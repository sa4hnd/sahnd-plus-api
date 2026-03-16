const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());

// Stream sources that we try in order to extract direct m3u8 URLs
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

// Try to extract m3u8 URL from embed page HTML
async function extractStream(embedUrl, sourceName) {
  try {
    const res = await fetch(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml',
        'Referer': new URL(embedUrl).origin + '/',
      },
      redirect: 'follow',
      timeout: 8000,
    });
    const html = await res.text();

    // Look for m3u8 URLs in the page
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
    console.error(`Failed ${sourceName}:`, e.message);
    return null;
  }
}

// Proxy endpoint for m3u8 segments (handles referer headers)
app.get('/proxy', async (req, res) => {
  const { url, referer } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        'Referer': referer || '',
        'Origin': referer ? new URL(referer).origin : '',
      },
    });
    const contentType = response.headers.get('content-type');
    res.set('Content-Type', contentType || 'application/octet-stream');
    res.set('Access-Control-Allow-Origin', '*');
    response.body.pipe(res);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Main stream extraction endpoint
app.get('/stream', async (req, res) => {
  const { tmdb_id, type = 'movie', s, e: ep } = req.query;
  if (!tmdb_id) return res.status(400).json({ error: 'Missing tmdb_id' });

  console.log(`[${new Date().toISOString()}] Resolving ${type}/${tmdb_id}${s ? ` S${s}E${ep}` : ''}`);

  // Try each source
  for (const source of SOURCES) {
    const embedUrl = source.getEmbed(type, tmdb_id, s, ep);
    console.log(`  Trying ${source.name}: ${embedUrl}`);
    const result = await extractStream(embedUrl, source.name);
    if (result) {
      console.log(`  ✓ Found stream from ${source.name}`);
      return res.json({
        success: true,
        stream: result.url,
        source: result.source,
        referer: result.referer,
        // Provide a proxied URL that handles referer automatically
        proxied: `${req.protocol}://${req.get('host')}/proxy?url=${encodeURIComponent(result.url)}&referer=${encodeURIComponent(result.referer)}`,
      });
    }
  }

  // If no direct stream found, return embed URLs as fallback
  console.log('  ✗ No direct stream found, returning embeds');
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`SAHND+ API running on port ${PORT}`));
