const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const AbortController = globalThis.AbortController;

const app = express();
app.use(cors());

// Stream sources
const SOURCES = [
  {
    name: 'VidSrc CC',
    getEmbed: (type, id, s, e) =>
      type === 'tv' && s && e
        ? `https://vidsrc.cc/v2/embed/${type}/${id}/${s}/${e}`
        : `https://vidsrc.cc/v2/embed/${type}/${id}`,
  },
  {
    name: 'AutoEmbed',
    getEmbed: (type, id, s, e) =>
      type === 'tv' && s && e
        ? `https://player.autoembed.cc/embed/${type}/${id}/${s}/${e}`
        : `https://player.autoembed.cc/embed/${type}/${id}`,
  },
  {
    name: 'Embed.su',
    getEmbed: (type, id, s, e) =>
      type === 'tv' && s && e
        ? `https://embed.su/embed/${type}/${id}/${s}/${e}`
        : `https://embed.su/embed/${type}/${id}`,
  },
];

// Extract m3u8 from embed page HTML — with short timeout for Vercel
async function extractStream(embedUrl, sourceName) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000); // 4s max per source

  try {
    const res = await fetch(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml',
        'Referer': new URL(embedUrl).origin + '/',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timer);
    const html = await res.text();

    // Look for m3u8 URLs
    const m3u8Patterns = [
      /https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/gi,
      /source:\s*['"]([^'"]*\.m3u8[^'"]*)['"]/gi,
      /file:\s*['"]([^'"]*\.m3u8[^'"]*)['"]/gi,
      /src:\s*['"]([^'"]*\.m3u8[^'"]*)['"]/gi,
      /['"]([^'"]*master\.m3u8[^'"]*)['"]/gi,
      /['"]([^'"]*index\.m3u8[^'"]*)['"]/gi,
    ];

    for (const pattern of m3u8Patterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        const url = match[1] || match[0];
        if (url && url.includes('.m3u8')) {
          return { url: url.replace(/\\/g, ''), source: sourceName, referer: new URL(embedUrl).origin + '/' };
        }
      }
    }

    // Look for mp4 URLs
    const mp4Patterns = [
      /https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*/gi,
      /source:\s*['"]([^'"]*\.mp4[^'"]*)['"]/gi,
      /file:\s*['"]([^'"]*\.mp4[^'"]*)['"]/gi,
    ];

    for (const pattern of mp4Patterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        const url = match[1] || match[0];
        if (url && url.includes('.mp4') && !url.includes('thumbnail') && !url.includes('poster')) {
          return { url: url.replace(/\\/g, ''), source: sourceName, referer: new URL(embedUrl).origin + '/' };
        }
      }
    }

    return null;
  } catch (e) {
    clearTimeout(timer);
    return null;
  }
}

// Try ALL sources in parallel — return first success
async function findStream(type, id, s, e) {
  const promises = SOURCES.map(async (source) => {
    const embedUrl = source.getEmbed(type, id, s, e);
    const result = await extractStream(embedUrl, source.name);
    if (result) return result;
    return null;
  });

  // Race: return first non-null result
  const results = await Promise.all(promises);
  return results.find(r => r !== null) || null;
}

// Proxy endpoint — buffered for Vercel compatibility
app.get('/proxy', async (req, res) => {
  const { url, referer } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        'Referer': referer || '',
        'Origin': referer ? new URL(referer).origin : '',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    const buffer = await response.buffer();
    const contentType = response.headers.get('content-type');
    res.set('Content-Type', contentType || 'application/octet-stream');
    res.set('Access-Control-Allow-Origin', '*');
    res.send(buffer);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// Main stream extraction — sequential (legacy)
app.get('/stream', async (req, res) => {
  const { tmdb_id, type = 'movie', s, e: ep } = req.query;
  if (!tmdb_id) return res.status(400).json({ error: 'Missing tmdb_id' });

  const result = await findStream(type, tmdb_id, s, ep);
  if (result) {
    return res.json({
      success: true,
      stream: result.url,
      source: result.source,
      referer: result.referer,
      proxied: `${req.protocol}://${req.get('host')}/proxy?url=${encodeURIComponent(result.url)}&referer=${encodeURIComponent(result.referer)}`,
    });
  }

  res.json({
    success: false,
    message: 'No direct stream found. Use embed fallback.',
    embeds: SOURCES.map(s => ({
      name: s.name,
      url: s.getEmbed(type, tmdb_id, req.query.s, req.query.e),
    })),
  });
});

// Health check
app.get('/', (req, res) => res.json({ status: 'SAHND+ Stream API', version: '1.0' }));

// --- Channels ---
const channelsData = require('./data/channels.json');

app.get('/api/channels', (req, res) => {
  const grouped = {};
  for (const ch of channelsData) {
    if (!grouped[ch.category]) grouped[ch.category] = [];
    grouped[ch.category].push(ch);
  }
  const categories = Object.entries(grouped).map(([name, channels]) => ({ name, channels }));
  res.json({ success: true, count: channelsData.length, categories });
});

app.get('/api/channels/:id/stream', (req, res) => {
  const ch = channelsData.find(c => c.id === req.params.id);
  if (!ch) return res.status(404).json({ success: false, error: 'CHANNEL_NOT_FOUND' });
  res.json({ success: true, channel: ch });
});

// --- Stream endpoints (mobile API format) — ALL PARALLEL ---
app.get('/api/streams/vixsrc/:type/:tmdbId', async (req, res) => {
  const { type, tmdbId } = req.params;
  const { season, episode } = req.query;
  const mediaType = type === 'series' ? 'tv' : type;

  const result = await findStream(mediaType, tmdbId, season, episode);
  if (result) {
    return res.json({
      success: true,
      streams: [{
        url: result.url,
        subtitles: [],
        provider: result.source,
        headers: { Referer: result.referer },
      }],
    });
  }
  res.json({ success: false, streams: [] });
});

app.get('/api/streams/:type/:tmdbId', async (req, res) => {
  const { type, tmdbId } = req.params;
  const { season, episode } = req.query;
  const mediaType = type === 'series' ? 'tv' : type;

  const promises = SOURCES.map(async (source) => {
    const embedUrl = source.getEmbed(mediaType, tmdbId, season, episode);
    return extractStream(embedUrl, source.name);
  });

  const results = await Promise.all(promises);
  const streams = results.filter(r => r !== null).map(r => ({
    url: r.url,
    subtitles: [],
    provider: r.source,
    headers: { Referer: r.referer },
  }));

  res.json({ success: streams.length > 0, count: streams.length, streams });
});

// Vercel export / local dev
if (process.env.VERCEL) {
  module.exports = app;
} else {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`SAHND+ API running on port ${PORT}`));
}
