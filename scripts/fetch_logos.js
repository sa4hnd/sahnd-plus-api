#!/usr/bin/env node

/**
 * Assigns real logo URLs to channels in channels.json.
 *
 * Uses curated Wikipedia/Wikimedia URLs (known to be stable and reliable)
 * and icon.horse favicons as fallback for channels with known websites.
 *
 * Wikipedia image URLs are permanent and don't need runtime validation.
 * We assign them directly to avoid rate limiting issues.
 */

const fs = require('fs');
const path = require('path');

const CHANNELS_PATH = path.join(__dirname, '..', 'data', 'channels.json');

// ─── Curated logo database ───
// Sources:
//   - Wikipedia/Wikimedia Commons (permanent, reliable CDN)
//   - icon.horse (free favicon service)
//   - Direct channel website logos

const LOGO_DB = {
  // ═══════════════════════════════════════
  // NEWS
  // ═══════════════════════════════════════
  'K24 HD': 'https://upload.wikimedia.org/wikipedia/en/1/1e/Kurdistan24_Logo.png',
  'RUDAW HD': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Rudaw_Media_Network.svg/200px-Rudaw_Media_Network.svg.png',
  'AVA TV': 'https://icon.horse/icon/avatv.co',
  'Kurdsat News': 'https://upload.wikimedia.org/wikipedia/en/8/89/Kurdsat_News.png',
  'NRT HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/1/18/NRT_logo.svg/200px-NRT_logo.svg.png',
  'Al Jazeera': 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4c/Al_Jazeera_Media_Network_Logo.svg/200px-Al_Jazeera_Media_Network_Logo.svg.png',
  'RT Arabic': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Russia-today-logo.svg/200px-Russia-today-logo.svg.png',
  'Sky News Arabia': 'https://upload.wikimedia.org/wikipedia/en/thumb/9/99/Sky_News_Arabia.svg/200px-Sky_News_Arabia.svg.png',
  'BBC Arabic': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/BBC_Arabic.svg/200px-BBC_Arabic.svg.png',
  'Al Arabiya': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Al_Arabiya_logo.svg/200px-Al_Arabiya_logo.svg.png',
  'Al Hadath HD': 'https://upload.wikimedia.org/wikipedia/ar/thumb/8/8b/Al_Hadath_TV_Logo.svg/200px-Al_Hadath_TV_Logo.svg.png',
  'Asharq News HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/28/Asharq_News_Logo.svg/200px-Asharq_News_Logo.svg.png',
  'Extra News': 'https://icon.horse/icon/extranews.tv',
  'CNBC Arabiya': 'https://upload.wikimedia.org/wikipedia/en/3/3e/CNBC_Arabiya.png',
  'AL MAYADEEN TV': 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4b/Al_Mayadeen_TV_Logo.svg/200px-Al_Mayadeen_TV_Logo.svg.png',
  'AL SHARQIYA NEWS HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b6/Alsharqiya_News_Logo.svg/200px-Alsharqiya_News_Logo.svg.png',
  'Iraqia News HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/c/cc/Al_Iraqiya_logo.svg/200px-Al_Iraqiya_logo.svg.png',
  'CNBC': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/CNBC_logo.svg/200px-CNBC_logo.svg.png',
  'CNN': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/CNN.svg/200px-CNN.svg.png',
  'Fox News': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Fox_News_Channel_logo.svg/200px-Fox_News_Channel_logo.svg.png',
  'Sky News HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/d/db/Sky_News_2023.svg/200px-Sky_News_2023.svg.png',
  'BBC News': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/BBC_News_2019.svg/200px-BBC_News_2019.svg.png',
  'BBC Persian': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/BBC_Persian.svg/200px-BBC_Persian.svg.png',
  'Press TV': 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c1/Press_TV.svg/200px-Press_TV.svg.png',
  'France 24': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/25/France_24_logo.svg/200px-France_24_logo.svg.png',
  'TRT Arabia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/TRT_Arabi_logosu.svg/200px-TRT_Arabi_logosu.svg.png',
  'DW Arabia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Deutsche_Welle_symbol_2012.svg/200px-Deutsche_Welle_symbol_2012.svg.png',
  'NHK WORLD': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/NHK_World-Japan_logo.svg/200px-NHK_World-Japan_logo.svg.png',

  // ═══════════════════════════════════════
  // KURDISH ENTERTAINMENT
  // ═══════════════════════════════════════
  'Kurdistan TV HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Kurdistan_TV_logo.svg/200px-Kurdistan_TV_logo.svg.png',
  'Zagros TV HD': 'https://upload.wikimedia.org/wikipedia/en/f/fc/Zagros_TV_Logo.png',
  'Kurdmax Sorani': 'https://upload.wikimedia.org/wikipedia/en/e/ec/KurdMax_logo.png',
  'Kurdmax Kurmanji': 'https://upload.wikimedia.org/wikipedia/en/e/ec/KurdMax_logo.png',
  'Kurdsat HD': 'https://upload.wikimedia.org/wikipedia/en/f/f2/KurdSat_logo.png',
  'NRT 2 HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/1/18/NRT_logo.svg/200px-NRT_logo.svg.png',
  'WAAR HD': 'https://icon.horse/icon/waartv.com',
  'Kirkuk TV HD': 'https://icon.horse/icon/kirkuktv.net',
  'TRT KURDI': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/TRT_Kurdî_logosu.svg/200px-TRT_Kurdî_logosu.svg.png',
  'Gali Kurdistan': 'https://upload.wikimedia.org/wikipedia/en/5/5d/Gali_Kurdistan_logo.png',
  'SPEDA TV': 'https://icon.horse/icon/speda.tv',
  'STERK TV': 'https://upload.wikimedia.org/wikipedia/en/f/f9/Sterk_TV_logo.png',
  'Ishtar TV': 'https://icon.horse/icon/ishtartv.com',
  'CIRA TV': 'https://icon.horse/icon/ciratv.com',

  // ═══════════════════════════════════════
  // IRANIAN
  // ═══════════════════════════════════════
  'IRIB TV1': 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c4/IRIB_TV1_logo.svg/200px-IRIB_TV1_logo.svg.png',
  'IRIB TV2': 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f3/IRIB_TV2_logo.svg/200px-IRIB_TV2_logo.svg.png',
  'IRIB TV3': 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1b/IRIB_TV3_Logo.svg/200px-IRIB_TV3_Logo.svg.png',
  'IRIB TV4': 'https://upload.wikimedia.org/wikipedia/en/8/81/IRIB_TV4.png',
  'IRINN': 'https://upload.wikimedia.org/wikipedia/en/5/53/IRINN_logo.png',
  'IRIB Ofogh': 'https://upload.wikimedia.org/wikipedia/en/thumb/4/44/Ofogh_TV.svg/200px-Ofogh_TV.svg.png',
  'IRIB Nasim': 'https://upload.wikimedia.org/wikipedia/en/thumb/d/de/Nasim_TV.svg/200px-Nasim_TV.svg.png',
  'IRIB Tamasha': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2c/Tamasha_TV.svg/200px-Tamasha_TV.svg.png',
  'Gem TV HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8e/GEM_TV_Logo.svg/200px-GEM_TV_Logo.svg.png',

  // ═══════════════════════════════════════
  // TURKISH
  // ═══════════════════════════════════════
  'Star HD': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Star_TV_logo.svg/200px-Star_TV_logo.svg.png',
  'Show HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/9/93/Show_TV.svg/200px-Show_TV.svg.png',
  'ATV': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/ATV_logo.svg/200px-ATV_logo.svg.png',
  'NTV HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/f/fb/NTV_Turkey.svg/200px-NTV_Turkey.svg.png',
  'TLC HD': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/TLC_Logo.svg/200px-TLC_Logo.svg.png',
  'KANAL D': 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f3/Kanal_D.svg/200px-Kanal_D.svg.png',
  'TV8 HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8e/TV8_Turkey_logo.svg/200px-TV8_Turkey_logo.svg.png',
  'TRT 1 HD': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/TRT_1_logo_%282021-%29.svg/200px-TRT_1_logo_%282021-%29.svg.png',
  'TRT 2 HD': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/TRT_2_logo.svg/200px-TRT_2_logo.svg.png',
  'ProSieben HD': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/ProSieben_logo_2015.svg/200px-ProSieben_logo_2015.svg.png',
  'RTL HD': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/RTL_logo_2021.svg/200px-RTL_logo_2021.svg.png',
  'Power HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0e/Power_TV_Turkey.svg/200px-Power_TV_Turkey.svg.png',
  'Power Turk': 'https://upload.wikimedia.org/wikipedia/en/d/d3/PowerTurk_TV_logo.png',
  'Kral Pop': 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7a/Kral_Pop_TV.svg/200px-Kral_Pop_TV.svg.png',

  // ═══════════════════════════════════════
  // MBC NETWORK
  // ═══════════════════════════════════════
  'MBC 1 HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/20/MBC_1_logo.svg/200px-MBC_1_logo.svg.png',
  'MBC 4 HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c8/MBC_4_logo.svg/200px-MBC_4_logo.svg.png',
  'MBC 5': 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9b/MBC_5_logo.svg/200px-MBC_5_logo.svg.png',
  'MBC DRAMA HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b9/MBC_Drama_logo.svg/200px-MBC_Drama_logo.svg.png',
  'MBC IRAQ HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/6/68/MBC_Iraq_logo.svg/200px-MBC_Iraq_logo.svg.png',
  'MBC Masr HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/0/09/MBC_Masr_logo.svg/200px-MBC_Masr_logo.svg.png',
  'MBC Masr 2 HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7c/MBC_Masr_2_logo.svg/200px-MBC_Masr_2_logo.svg.png',
  'MBC Bollywood': 'https://upload.wikimedia.org/wikipedia/en/5/5c/MBC_Bollywood_logo.png',
  'MBC 2 HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c3/MBC_2_logo.svg/200px-MBC_2_logo.svg.png',
  'MBC Action HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4a/MBC_Action_logo.svg/200px-MBC_Action_logo.svg.png',
  'MBC Max HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/24/MBC_Max_logo.svg/200px-MBC_Max_logo.svg.png',
  'MBC P Variety HD': 'https://upload.wikimedia.org/wikipedia/en/9/9e/MBC_Persia_logo.png',
  'MBC 3 HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1a/MBC_3_logo.svg/200px-MBC_3_logo.svg.png',

  // ═══════════════════════════════════════
  // GULF / UAE / KUWAIT
  // ═══════════════════════════════════════
  'Abu Dhabi TV': 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f0/Abu_Dhabi_TV_Logo.svg/200px-Abu_Dhabi_TV_Logo.svg.png',
  'AL EMARAT TV': 'https://upload.wikimedia.org/wikipedia/en/thumb/6/64/Al_Emarat_TV.svg/200px-Al_Emarat_TV.svg.png',
  'Dubai TV HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e1/Dubai_TV_Logo.svg/200px-Dubai_TV_Logo.svg.png',
  'SAMA DUBAI HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/24/Sama_Dubai_logo.svg/200px-Sama_Dubai_logo.svg.png',
  'Dubai One HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/d/dc/Dubai_One_logo.svg/200px-Dubai_One_logo.svg.png',
  'Kuwait TV 1': 'https://upload.wikimedia.org/wikipedia/en/thumb/0/09/Kuwait_Television_Logo.svg/200px-Kuwait_Television_Logo.svg.png',
  'Kuwait TV 2': 'https://upload.wikimedia.org/wikipedia/en/thumb/0/09/Kuwait_Television_Logo.svg/200px-Kuwait_Television_Logo.svg.png',
  'AL ARABY HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2e/Al_Araby_Television.svg/200px-Al_Araby_Television.svg.png',

  // ═══════════════════════════════════════
  // LEBANESE
  // ═══════════════════════════════════════
  'Rotana Drama': 'https://upload.wikimedia.org/wikipedia/en/thumb/9/99/Rotana_Drama.svg/200px-Rotana_Drama.svg.png',
  'Rotana Khalijiah': 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c2/Rotana_Khalijiah.svg/200px-Rotana_Khalijiah.svg.png',
  'Rotana Classic': 'https://upload.wikimedia.org/wikipedia/en/thumb/7/76/Rotana_Classic.svg/200px-Rotana_Classic.svg.png',
  'Rotana Cinema EGY': 'https://upload.wikimedia.org/wikipedia/en/thumb/8/80/Rotana_Cinema.svg/200px-Rotana_Cinema.svg.png',
  'Rotana Cinema KSA': 'https://upload.wikimedia.org/wikipedia/en/thumb/8/80/Rotana_Cinema.svg/200px-Rotana_Cinema.svg.png',
  'Rotana': 'https://upload.wikimedia.org/wikipedia/en/thumb/d/df/Rotana_Music.svg/200px-Rotana_Music.svg.png',
  'Rotana Clip': 'https://upload.wikimedia.org/wikipedia/en/thumb/3/3d/Rotana_Clip.svg/200px-Rotana_Clip.svg.png',
  'LBC SAT': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/26/LBC_SAT_logo.svg/200px-LBC_SAT_logo.svg.png',
  'LBC International': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/26/LBC_SAT_logo.svg/200px-LBC_SAT_logo.svg.png',
  'MTV Lebanon': 'https://upload.wikimedia.org/wikipedia/en/thumb/0/08/MTV_Lebanon_Logo.svg/200px-MTV_Lebanon_Logo.svg.png',
  'OTV': 'https://upload.wikimedia.org/wikipedia/en/thumb/3/3c/OTV_Lebanon.svg/200px-OTV_Lebanon.svg.png',
  'AL Jadeed': 'https://upload.wikimedia.org/wikipedia/en/thumb/a/ad/Al_Jadeed_logo.svg/200px-Al_Jadeed_logo.svg.png',
  'Teleliban TV': 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c3/Tele_Liban_logo.svg/200px-Tele_Liban_logo.svg.png',

  // ═══════════════════════════════════════
  // EGYPTIAN
  // ═══════════════════════════════════════
  'DMC HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/DMC_TV_logo.svg/200px-DMC_TV_logo.svg.png',
  'CBC': 'https://upload.wikimedia.org/wikipedia/en/thumb/4/42/CBC_Egypt_logo.svg/200px-CBC_Egypt_logo.svg.png',
  'ALHayat': 'https://upload.wikimedia.org/wikipedia/en/thumb/7/75/Al_Hayat_TV.svg/200px-Al_Hayat_TV.svg.png',
  'Al Nahar One HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/ef/Alnahar_tv_logo.svg/200px-Alnahar_tv_logo.svg.png',
  'ON Drama': 'https://upload.wikimedia.org/wikipedia/en/thumb/4/43/ON_Drama_logo.svg/200px-ON_Drama_logo.svg.png',
  'Al Kahera Wal Nas': 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4d/AlKahera_Wal_Nas.svg/200px-AlKahera_Wal_Nas.svg.png',
  'SYRIA TV HD': 'https://icon.horse/icon/syriatv.net',

  // ═══════════════════════════════════════
  // IRAQI
  // ═══════════════════════════════════════
  'Iraqia Ent HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/c/cc/Al_Iraqiya_logo.svg/200px-Al_Iraqiya_logo.svg.png',
  'AL SHARQIYA': 'https://upload.wikimedia.org/wikipedia/en/thumb/7/79/Al_Sharqiya_logo.svg/200px-Al_Sharqiya_logo.svg.png',
  'Al Sumaria TV': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/ed/Al_Sumaria_logo.svg/200px-Al_Sumaria_logo.svg.png',
  'Dijlah TV': 'https://upload.wikimedia.org/wikipedia/en/3/35/Dijlah_TV_Logo.png',
  'UTV Iraq HD': 'https://icon.horse/icon/utviraq.com',

  // ═══════════════════════════════════════
  // OSN (use single brand icon)
  // ═══════════════════════════════════════
  'OSN Alfa Musalsalat HD1': 'https://icon.horse/icon/osn.com',
  'OSN Alfa Musalsalat HD2': 'https://icon.horse/icon/osn.com',
  'OSN Alfa Cinema HD1': 'https://icon.horse/icon/osn.com',
  'OSN Alfa Cinema HD2': 'https://icon.horse/icon/osn.com',
  'OSN Yahala HD': 'https://icon.horse/icon/osn.com',
  'OSN Yahala Bil Arabi HD': 'https://icon.horse/icon/osn.com',
  'OSN Yahala Aflam HD': 'https://icon.horse/icon/osn.com',
  'OSN Movies Hollywood HD': 'https://icon.horse/icon/osn.com',
  'OSN Movies Family HD': 'https://icon.horse/icon/osn.com',
  'OSN Comedy HD': 'https://icon.horse/icon/osn.com',
  'OSN Movies Action HD': 'https://icon.horse/icon/osn.com',
  'OSN Kids HD': 'https://icon.horse/icon/osn.com',

  // ═══════════════════════════════════════
  // beIN (use brand icon)
  // ═══════════════════════════════════════
  'Bein Drama HD 1': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/BeIN_Sports_logo_%282017%29.svg/200px-BeIN_Sports_logo_%282017%29.svg.png',
  'Bein Series HD1': 'https://icon.horse/icon/bein.com',
  'Bein Series HD2': 'https://icon.horse/icon/bein.com',
  'Bein Movies Premiere HD1': 'https://icon.horse/icon/bein.com',
  'Bein Movies Action HD2': 'https://icon.horse/icon/bein.com',
  'Bein Movies Drama HD3': 'https://icon.horse/icon/bein.com',
  'Bein Movies Family HD4': 'https://icon.horse/icon/bein.com',
  'Bein Gourmet HD': 'https://icon.horse/icon/bein.com',
  'Bein Fatafeat': 'https://upload.wikimedia.org/wikipedia/en/thumb/f/fe/Fatafeat_logo.svg/200px-Fatafeat_logo.svg.png',

  // ═══════════════════════════════════════
  // MOVIES
  // ═══════════════════════════════════════
  'HBO': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/HBO_logo.svg/200px-HBO_logo.svg.png',
  'Sky Cinema Action HD': 'https://icon.horse/icon/sky.com',
  'Sky Cinema Comedy HD': 'https://icon.horse/icon/sky.com',
  'Sky Cinema Si-Fi horror HD': 'https://icon.horse/icon/sky.com',
  'Sky Cinema Drama HD': 'https://icon.horse/icon/sky.com',
  'Sky Cinema Family HD': 'https://icon.horse/icon/sky.com',
  'Sky Cinema Premiere HD': 'https://icon.horse/icon/sky.com',
  'ART AFLAM 1': 'https://icon.horse/icon/art-tv.net',
  'ART AFLAM 2': 'https://icon.horse/icon/art-tv.net',
  'ART CINEMA': 'https://icon.horse/icon/art-tv.net',
  'ART HEKAYAT': 'https://icon.horse/icon/art-tv.net',
  'ART HEKAYAT 2': 'https://icon.horse/icon/art-tv.net',
  'B4U Aflam': 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b7/B4U_Aflam.svg/200px-B4U_Aflam.svg.png',
  'Zee Aflam': 'https://upload.wikimedia.org/wikipedia/en/thumb/1/18/Zee_Aflam.svg/200px-Zee_Aflam.svg.png',
  'Zee Alwan': 'https://upload.wikimedia.org/wikipedia/en/thumb/8/84/Zee_Alwan.svg/200px-Zee_Alwan.svg.png',

  // ═══════════════════════════════════════
  // KIDS
  // ═══════════════════════════════════════
  'SPACETOON ARABIC': 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a3/Spacetoon.svg/200px-Spacetoon.svg.png',
  'Majid Kids TV': 'https://upload.wikimedia.org/wikipedia/en/thumb/0/04/Majid_TV_logo.svg/200px-Majid_TV_logo.svg.png',
  'CN Arabia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Cartoon_Network_2010_logo.svg/200px-Cartoon_Network_2010_logo.svg.png',
  'CN UK': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Cartoon_Network_2010_logo.svg/200px-Cartoon_Network_2010_logo.svg.png',
  'Disney Channel HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/5/50/Disney_Channel_2014.svg/200px-Disney_Channel_2014.svg.png',
  'Nickelodeon JR': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Nickelodeon_2023_logo_%28outline%29.svg/200px-Nickelodeon_2023_logo_%28outline%29.svg.png',
  'Cbeebies': 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8e/CBeebies_logo.svg/200px-CBeebies_logo.svg.png',
  'Jeem HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c1/JeemTV.svg/200px-JeemTV.svg.png',
  'Baraem HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/9/93/Baraem.svg/200px-Baraem.svg.png',
  'Boomerang': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Boomerang_TV_logo.svg/200px-Boomerang_TV_logo.svg.png',
  'ZAROK TV': 'https://upload.wikimedia.org/wikipedia/en/a/af/Zarok_TV_logo.png',

  // ═══════════════════════════════════════
  // MUSIC
  // ═══════════════════════════════════════
  'VinTV HD': 'https://icon.horse/icon/vintv.tv',
  'Mazzika': 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Mazzika_logo.svg/200px-Mazzika_logo.svg.png',

  // ═══════════════════════════════════════
  // SPORTS
  // ═══════════════════════════════════════
  'My UFC': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/UFC_logo.svg/200px-UFC_logo.svg.png',
  'BeIN Sports HD': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/BeIN_Sports_logo_%282017%29.svg/200px-BeIN_Sports_logo_%282017%29.svg.png',
  'BeIN Sports News HD': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/BeIN_Sports_logo_%282017%29.svg/200px-BeIN_Sports_logo_%282017%29.svg.png',
  'Thmanyah 1': 'https://icon.horse/icon/thmanyah.com',
  'Thmanyah 2': 'https://icon.horse/icon/thmanyah.com',
  'AD SPORT 1': 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5a/Abu_Dhabi_Sports.svg/200px-Abu_Dhabi_Sports.svg.png',
  'AD SPORT 2': 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5a/Abu_Dhabi_Sports.svg/200px-Abu_Dhabi_Sports.svg.png',
  'Alkass one HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/1/17/Alkass_Sports_Channels.svg/200px-Alkass_Sports_Channels.svg.png',
  'Alkass two HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/1/17/Alkass_Sports_Channels.svg/200px-Alkass_Sports_Channels.svg.png',
  'Alkass three HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/1/17/Alkass_Sports_Channels.svg/200px-Alkass_Sports_Channels.svg.png',
  'Alkass four HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/1/17/Alkass_Sports_Channels.svg/200px-Alkass_Sports_Channels.svg.png',
  'DUBAI SPORTS 1 HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d0/Dubai_Sports.svg/200px-Dubai_Sports.svg.png',
  'DUBAI SPORTS 2 HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d0/Dubai_Sports.svg/200px-Dubai_Sports.svg.png',
  'DUBAI RACING 1 HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0a/Dubai_Racing.svg/200px-Dubai_Racing.svg.png',
  'DUBAI RACING 2 HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0a/Dubai_Racing.svg/200px-Dubai_Racing.svg.png',
  'KSA Sport 1': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/23/SSC_%28Saudi_Arabia%29.svg/200px-SSC_%28Saudi_Arabia%29.svg.png',
  'KSA Sport 2': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/23/SSC_%28Saudi_Arabia%29.svg/200px-SSC_%28Saudi_Arabia%29.svg.png',
  'ON Sport': 'https://upload.wikimedia.org/wikipedia/en/thumb/4/46/ON_Sport_logo.svg/200px-ON_Sport_logo.svg.png',
  'TRT Spor HD': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/TRT_Spor_logo_%282022-%29.svg/200px-TRT_Spor_logo_%282022-%29.svg.png',
  'TRT Spor Yıldız': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/TRT_Spor_Yıldız_logosu.svg/200px-TRT_Spor_Yıldız_logosu.svg.png',
  'ZIGGO Sport Select': 'https://icon.horse/icon/ziggosport.nl',
  'ZIGGO Sport voetbal': 'https://icon.horse/icon/ziggosport.nl',
  'EURO Sport 1': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Eurosport_1_Logo_2015.svg/200px-Eurosport_1_Logo_2015.svg.png',
  'EURO Sport 2': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Eurosport_2_Logo_2015.svg/200px-Eurosport_2_Logo_2015.svg.png',
  'ESPN': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ESPN_wordmark.svg/200px-ESPN_wordmark.svg.png',
  'ESPN 2': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/ESPN2_logo.svg/200px-ESPN2_logo.svg.png',
  'MUTV': 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4a/MUTV_Logo.svg/200px-MUTV_Logo.svg.png',
  'TNT Sports 1': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/TNT_Sports_logo_2023.svg/200px-TNT_Sports_logo_2023.svg.png',
  'TNT Sports 2': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/TNT_Sports_logo_2023.svg/200px-TNT_Sports_logo_2023.svg.png',
  'Sky Sports main event HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d6/Sky_Sports_Main_Event.svg/200px-Sky_Sports_Main_Event.svg.png',
  'Sky Sports action HD': 'https://icon.horse/icon/skysports.com',
  'Sky Sports PL HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/8/86/Sky_Sports_Premier_League.svg/200px-Sky_Sports_Premier_League.svg.png',
  'Sky Sports football HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a7/Sky_Sports_Football.svg/200px-Sky_Sports_Football.svg.png',
  'Sky Sports cricket HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/6/68/Sky_Sports_Cricket.svg/200px-Sky_Sports_Cricket.svg.png',
  'Sky Sports News HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/9/98/Sky_Sports_News_2020.svg/200px-Sky_Sports_News_2020.svg.png',
  'Sky Sports Arena HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/c/cf/Sky_Sports_Arena.svg/200px-Sky_Sports_Arena.svg.png',
  'Sky Sports F1 HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/9/93/Sky_Sports_F1.svg/200px-Sky_Sports_F1.svg.png',
  'Sky Sports Golf HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9b/Sky_Sports_Golf.svg/200px-Sky_Sports_Golf.svg.png',
  'Iraqia Sport HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/c/cc/Al_Iraqiya_logo.svg/200px-Al_Iraqiya_logo.svg.png',

  // ═══════════════════════════════════════
  // RELIGION
  // ═══════════════════════════════════════
  'NourSat': 'https://icon.horse/icon/noursat.tv',

  // ═══════════════════════════════════════
  // DOCUMENTARY
  // ═══════════════════════════════════════
  'K24 Documentary': 'https://upload.wikimedia.org/wikipedia/en/1/1e/Kurdistan24_Logo.png',
  'Al Jazeera Documentary HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4c/Al_Jazeera_Media_Network_Logo.svg/200px-Al_Jazeera_Media_Network_Logo.svg.png',
  'Asharq Documentary HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/28/Asharq_News_Logo.svg/200px-Asharq_News_Logo.svg.png',
  'AD Nat Geo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Natgeo_logo.svg/200px-Natgeo_logo.svg.png',
  'Nat Geo WILD': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Nat_Geo_Wild_logo.svg/200px-Nat_Geo_Wild_logo.svg.png',
  'BBC Earth': 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6c/BBC_Earth.svg/200px-BBC_Earth.svg.png',
  'History': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/History_Channel_logo.svg/200px-History_Channel_logo.svg.png',
  'Discovery Channel': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Discovery_Channel_2019.svg/200px-Discovery_Channel_2019.svg.png',
  'Discovery Science': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Discovery_Science_2017.svg/200px-Discovery_Science_2017.svg.png',
  'NRT Sport': 'https://upload.wikimedia.org/wikipedia/en/thumb/1/18/NRT_logo.svg/200px-NRT_logo.svg.png',
  'NRT 3 Kids': 'https://upload.wikimedia.org/wikipedia/en/thumb/1/18/NRT_logo.svg/200px-NRT_logo.svg.png',
  'NRT 4': 'https://upload.wikimedia.org/wikipedia/en/thumb/1/18/NRT_logo.svg/200px-NRT_logo.svg.png',

  // ═══════════════════════════════════════
  // COOKING
  // ═══════════════════════════════════════
  'SamiraTV': 'https://icon.horse/icon/samira.tv',
};

function getUiAvatarUrl(name, category) {
  const colors = {
    'News': '1E88E5', 'Sports': '43A047', 'Entertainment': 'FB8C00',
    'Movies': 'E53935', 'Kids': '8E24AA', 'Music': 'D81B60',
    'Religion': '00897B', 'Documentary': '5D4037', 'Education': '3949AB',
    'Cooking': 'F4511E', 'Culture': '6D4C41',
  };
  const bg = colors[category] || '546E7A';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&size=128&bold=true&format=png`;
}

function main() {
  console.log('Reading channels.json...');
  const channels = JSON.parse(fs.readFileSync(CHANNELS_PATH, 'utf8'));
  console.log(`Total channels: ${channels.length}`);
  console.log(`Logos in database: ${Object.keys(LOGO_DB).length}`);

  let updated = 0;
  let unchanged = 0;
  let fallback = 0;

  for (const channel of channels) {
    const newLogo = LOGO_DB[channel.name];

    if (newLogo) {
      if (channel.logo !== newLogo) {
        console.log(`  +++ ${channel.name}`);
        channel.logo = newLogo;
        updated++;
      } else {
        console.log(`  === ${channel.name} (already set)`);
        unchanged++;
      }
    } else {
      // Keep existing clearbit/non-avatar logos if present
      if (channel.logo && !channel.logo.includes('ui-avatars.com')) {
        console.log(`  --- ${channel.name} (keeping existing: ${channel.logo.substring(0, 50)}...)`);
        unchanged++;
      } else {
        const avatarUrl = getUiAvatarUrl(channel.name, channel.category);
        channel.logo = avatarUrl;
        console.log(`  ... ${channel.name} (avatar fallback)`);
        fallback++;
      }
    }
  }

  fs.writeFileSync(CHANNELS_PATH, JSON.stringify(channels, null, 2) + '\n');

  const withReal = channels.filter(c => !c.logo.includes('ui-avatars.com')).length;

  console.log('\n' + '='.repeat(50));
  console.log(`Total channels:        ${channels.length}`);
  console.log(`Updated with new logo: ${updated}`);
  console.log(`Already had good logo: ${unchanged}`);
  console.log(`Fallback to avatars:   ${fallback}`);
  console.log(`Real logos total:      ${withReal}/${channels.length} (${Math.round(withReal / channels.length * 100)}%)`);
  console.log('='.repeat(50));

  // Show breakdown by category
  console.log('\nBy category:');
  const cats = {};
  for (const ch of channels) {
    if (!cats[ch.category]) cats[ch.category] = { total: 0, real: 0 };
    cats[ch.category].total++;
    if (!ch.logo.includes('ui-avatars.com')) cats[ch.category].real++;
  }
  for (const [cat, stats] of Object.entries(cats).sort((a, b) => b[1].total - a[1].total)) {
    console.log(`  ${cat}: ${stats.real}/${stats.total} (${Math.round(stats.real / stats.total * 100)}%)`);
  }
}

main();
