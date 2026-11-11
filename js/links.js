// Identificar una canción (título + artista) a partir de un enlace de música.
// NO descarga ni analiza audio. Sin DOM; usa fetch inyectable. Importable en Node y navegador.

/**
 * Endpoints usados (prefijos; se les agrega la URL codificada / el id).
 * Estado de confirmación en documentación OFICIAL (verificado en esta sesión):
 */
export const ENDPOINTS = {
  // YouTube oEmbed: `${youtubeOembed}${encodeURIComponent(watchUrl)}` → {title, author_name, ...}.
  // NO confirmado en doc oficial de YouTube: sólo aparece como ejemplo (https://www.youtube.com/oembed?url=...&format=json)
  // en la especificación oembed.com (sec. 5.1). Esa especificación no dice nada de CORS.
  youtubeOembed: 'https://www.youtube.com/oembed?format=json&url=',
  // Spotify oEmbed: confirmado en developer.spotify.com (guía "Using the oEmbed API"): parámetro `url`;
  // la respuesta trae `title` y NO trae autor/artista. La doc no menciona CORS.
  spotifyOembed: 'https://open.spotify.com/oembed?url=',
  // SoundCloud oEmbed: confirmado en developers.soundcloud.com/docs/oembed (param url, format=json|js). La doc dice que
  // soporta "JSON (CORS) and JSONP". Muestra `title` ("Flickermood by Forss"); `author_name` no figura en la doc.
  soundcloudOembed: 'https://soundcloud.com/oembed?format=json&url=',
  // Deezer track: `${deezerTrack}${id}` → {title, artist:{name}}. NO confirmado: las páginas de developers.deezer.com
  // se sirven con login/JS y no pude leer la doc de /track; forma de respuesta tomada de conocimiento previo. CORS: sin dato.
  deezerTrack: 'https://api.deezer.com/track/',
  // iTunes Lookup: `${itunesLookup}${trackId}&country=ar` → {results:[{trackName, artistName, collectionName}]}.
  // Confirmado en performance-partners.apple.com/search-api (Lookup por `id`, campos trackName/artistName). La doc no
  // menciona CORS; sólo describe `callback` (JSONP) en Search.
  itunesLookup: 'https://itunes.apple.com/lookup?id=',
  // iTunes Search (confirmado en la misma doc; param term, entity=song, limit, country, callback). Reservado para la UI
  // (buscar a mano por texto); resolveSong no lo usa.
  itunesSearch: 'https://itunes.apple.com/search?entity=song&limit=5&term=',
};

const TRAIL = /[.,;:!?)\]}>»”’"']+$/;

/**
 * Primera URL http(s) dentro de un texto pegado/compartido.
 * @param {string} text
 * @returns {string|null}
 */
export function findUrl(text) {
  if (typeof text !== 'string') return null;
  const m = /https?:\/\/[^\s<>"'“”]+/i.exec(text);
  return m ? m[0].replace(TRAIL, '') : null;
}

const BARE_HOST = /(?:^|\s)((?:[a-z0-9-]+\.)*(?:youtube\.com|youtu\.be|spotify\.com|spotify\.link|music\.apple\.com|deezer\.com|deezer\.page\.link|soundcloud\.com)\/[^\s]*)/i;

function deslug(s) {
  if (!s) return '';
  let d = s;
  try { d = decodeURIComponent(s); } catch { /* deja s */ }
  return d.replace(/[-_+]+/g, ' ').replace(/\s+/g, ' ').trim()
    .replace(/(^|\s)(\p{L})/gu, (_, a, b) => a + b.toUpperCase());
}

const segs = (u) => u.pathname.split('/').filter(Boolean);

function parseYoutube(u, host) {
  const music = host === 'music.youtube.com';
  const service = music ? 'youtube-music' : 'youtube';
  const s = segs(u);
  const v = u.searchParams.get('v');
  const list = u.searchParams.get('list');
  if (host === 'youtu.be') return s[0] ? { service, id: s[0], kind: 'video' } : { service, kind: 'unknown' };
  if (s[0] === 'watch' && v) return { service, id: v, kind: music ? 'track' : 'video' };
  if (['shorts', 'embed', 'live', 'v'].includes(s[0]) && s[1]) return { service, id: s[1], kind: 'video' };
  if (list && (s[0] === 'playlist' || s[0] === 'watch' || !v)) {
    return { service, id: list, kind: /^(OLAK5uy_)/.test(list) ? 'album' : 'playlist' };
  }
  if (s[0] === 'channel' || (s[0] && s[0].startsWith('@'))) return { service, id: s[1] || s[0], kind: 'artist' };
  return { service, kind: 'unknown' };
}

function parseSpotify(u, host) {
  const service = 'spotify';
  if (host === 'spotify.link') return { service, kind: 'unknown' };
  let s = segs(u);
  if (s[0] && /^intl-/i.test(s[0])) s = s.slice(1);
  if (s[0] === 'embed') s = s.slice(1);
  const kinds = { track: 'track', album: 'album', playlist: 'playlist', artist: 'artist' };
  if (kinds[s[0]] && s[1]) return { service, id: s[1], kind: kinds[s[0]] };
  return { service, kind: 'unknown' };
}

function parseApple(u) {
  const service = 'apple-music';
  const s = segs(u);
  const country = /^[a-z]{2}$/i.test(s[0] || '') ? s.shift().toLowerCase() : undefined;
  const base = country ? { country } : {};
  const kind = s[0];
  const slug = s.length >= 3 ? s[1] : undefined;
  const id = s[s.length - 1] && /^(\d+|pl\.[\w-]+)$/.test(s[s.length - 1]) ? s[s.length - 1] : undefined;
  const slugTitle = slug ? deslug(slug) : undefined;
  if (kind === 'album' && id) {
    const t = u.searchParams.get('i');
    const r = t ? { ...base, service, id: t, albumId: id, kind: 'track' } : { ...base, service, id, kind: 'album' };
    if (slugTitle) r.slugTitle = slugTitle;
    return r;
  }
  if (kind === 'song' && id) {
    const r = { ...base, service, id, kind: 'track' };
    if (slugTitle) r.slugTitle = slugTitle;
    return r;
  }
  if (kind === 'playlist' && id) return { ...base, service, id, kind: 'playlist', ...(slugTitle ? { slugTitle } : {}) };
  if (kind === 'artist' && id) return { ...base, service, id, kind: 'artist', ...(slugTitle ? { slugTitle } : {}) };
  return { ...base, service, kind: 'unknown' };
}

function parseDeezer(u, host) {
  const service = 'deezer';
  if (host !== 'deezer.com') return { service, kind: 'unknown' };
  let s = segs(u);
  if (s[0] && /^[a-z]{2}(-[a-z]{2})?$/i.test(s[0]) && s.length > 2) s = s.slice(1);
  const kinds = { track: 'track', album: 'album', playlist: 'playlist', artist: 'artist' };
  if (kinds[s[0]] && s[1]) return { service, id: s[1], kind: kinds[s[0]] };
  return { service, kind: 'unknown' };
}

const SC_RESERVED = new Set(['discover', 'you', 'search', 'stream', 'feed', 'upload', 'charts', 'pages', 'settings', 'popular', 'terms-of-use']);
function parseSoundcloud(u, host) {
  const service = 'soundcloud';
  if (host === 'on.soundcloud.com') return { service, kind: 'unknown' };
  const s = segs(u);
  if (!s[0] || SC_RESERVED.has(s[0])) return { service, kind: 'unknown' };
  const slugArtist = deslug(s[0]);
  if (s.length === 1) return { service, kind: 'artist', slugArtist };
  if (s[1] === 'sets' && s[2]) return { service, kind: 'playlist', slugTitle: deslug(s[2]), slugArtist };
  if (['albums', 'tracks', 'likes', 'reposts', 'following', 'followers', 'popular-tracks'].includes(s[1])) {
    return { service, kind: 'artist', slugArtist };
  }
  return { service, kind: 'track', slugTitle: deslug(s[1]), slugArtist };
}

/**
 * Reconoce el servicio y el tipo de enlace dentro de un texto.
 * @param {string} text URL o texto con una URL ("Mirá esto https://…")
 * @returns {null | {service:'youtube'|'youtube-music'|'spotify'|'apple-music'|'deezer'|'soundcloud'|'otro',
 *   url:string, id?:string, albumId?:string, country?:string,
 *   kind:'track'|'video'|'album'|'playlist'|'artist'|'unknown', slugTitle?:string, slugArtist?:string}}
 *   null si no hay URL. slugTitle/slugArtist: texto des-slugificado (Title Case); en Apple con ?i= el slug es el del ÁLBUM.
 */
export function parseMusicLink(text) {
  let raw = findUrl(text);
  if (!raw && typeof text === 'string') {
    const b = BARE_HOST.exec(text);
    if (b) raw = 'https://' + b[1].replace(TRAIL, '');
  }
  if (!raw) return null;
  let u;
  try { u = new URL(raw); } catch { return null; }
  const host = u.hostname.toLowerCase().replace(/^(www|m)\./, '');
  const root = host.split('.').slice(-2).join('.');
  let r;
  if (host === 'youtu.be' || root === 'youtube.com') r = parseYoutube(u, host);
  else if (host === 'open.spotify.com' || host === 'spotify.link' || host === 'play.spotify.com') r = parseSpotify(u, host);
  else if (host === 'music.apple.com' || host === 'embed.music.apple.com') r = parseApple(u);
  else if (root === 'deezer.com' || host === 'deezer.page.link' || host === 'link.deezer.com') r = parseDeezer(u, root === 'deezer.com' && host === 'deezer.com' ? 'deezer.com' : host);
  else if (root === 'soundcloud.com') r = parseSoundcloud(u, host);
  else r = { service: 'otro', kind: 'unknown' };
  return { ...r, url: raw };
}

const NOISE = new Set(('official oficial video vídeo videoclip clip music musical audio lyrics lyric letra letras visualizer visualiser ' +
  'hd 4k hq remastered remaster remasterizado remasterizada con with sub subtitulado subtitulada version versión').split(' '));

function isNoise(s) {
  const t = s.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if (!t.length) return false;
  let real = false;
  for (const w of t) {
    if (/^(\d{4}|\d{3,4}p)$/.test(w)) continue;
    if (!NOISE.has(w)) return false;
    real = true;
  }
  return real;
}

function cleanAuthor(a) {
  if (!a) return '';
  let s = String(a).trim();
  s = s.replace(/\s*-\s*Topic$/i, '');
  const hadVevo = /\s*VEVO$/i.test(s);
  s = s.replace(/\s*VEVO$/i, '').replace(/\s+Official$/i, '').trim();
  if (hadVevo && !/\s/.test(s)) s = s.replace(/([a-z])([A-Z])/g, '$1 $2');
  return s;
}

function stripNoise(s) {
  let out = s.replace(/\s*[(\[{【]([^)\]}】]*)[)\]}】]/g, (m, inner) => (isNoise(inner) ? '' : m));
  out = out.replace(/\s+(?:HD|HQ|4K)\s*$/i, '');
  out = out.replace(/\s+(?:official\s+(?:music\s+)?video|official\s+audio|official\s+lyric\s+video|video\s+oficial|lyrics?)\s*$/i, '');
  return out.replace(/\s+/g, ' ').trim();
}

/**
 * Limpia el título de un video/pista y separa artista.
 * Quita (Official Video), [Letra], | …, HD/4K, remasterizados; conserva (Live…), (Acoustic), (En Vivo);
 * mueve "ft./feat./con X" al artista ("A ft. X"); quita " - Topic" y "VEVO" del autor.
 * @param {string} rawTitle
 * @param {string} [rawAuthor] canal/autor (se usa como artista si el título no trae "Artista - Título")
 * @returns {{title:string, artist:string}} artist puede ser '' si no se pudo determinar
 */
export function cleanTitle(rawTitle, rawAuthor) {
  let t = String(rawTitle ?? '').replace(/\s+/g, ' ').trim();
  t = t.split(/\s[|｜]\s/)[0].trim();
  const parts = t.split(/\s[-–—]\s/).map((p) => p.trim()).filter(Boolean);
  let kept = parts.filter((p) => !isNoise(p));
  if (!kept.length) kept = parts.length ? [parts[0]] : [];
  kept = kept.map(stripNoise).filter(Boolean);

  let artist = '';
  let title = '';
  if (kept.length >= 2) { artist = kept[0]; title = kept.slice(1).join(' - '); }
  else { title = kept[0] || ''; artist = cleanAuthor(rawAuthor); }

  const feats = [];
  const grab = (re) => {
    const m = re.exec(title);
    if (m) { feats.push(m[1].trim()); title = (title.slice(0, m.index) + title.slice(m.index + m[0].length)).replace(/\s+/g, ' ').trim(); }
  };
  grab(/\s*[(\[]\s*(?:feat\.?|ft\.?|featuring|con|with)\s+([^)\]]+)[)\]]/i);
  grab(/\s+(?:feat\.?|ft\.?|featuring)\s+(.+)$/i);
  title = title.replace(/^(["“'])(.+)(["”'])$/, '$2').trim();
  if (feats.length && artist) artist += ' ft. ' + feats.join(', ');
  else if (feats.length) artist = 'ft. ' + feats.join(', ');
  if (artist.startsWith('ft. ') && !kept.length) artist = '';
  return { title, artist };
}

async function fetchJson(fetchImpl, url, signal, timeoutMs) {
  const ctl = new AbortController();
  let timer;
  const onAbort = () => ctl.abort();
  if (signal) { if (signal.aborted) throw new Error('abortado'); signal.addEventListener('abort', onAbort, { once: true }); }
  const timeout = new Promise((_, rej) => { timer = setTimeout(() => { ctl.abort(); rej(new Error('timeout')); }, timeoutMs); });
  try {
    const run = (async () => {
      const res = await fetchImpl(url, { signal: ctl.signal });
      if (!res || res.ok === false) throw new Error('HTTP ' + (res && res.status));
      return await res.json();
    })();
    run.catch(() => {});
    return await Promise.race([run, timeout]);
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onAbort);
  }
}

function slugResult(link) {
  if (link.slugTitle) return { title: link.slugTitle, artist: link.slugArtist || '', source: 'slug' };
  return null;
}

/**
 * Averigua título y artista de un enlace, sin lanzar nunca (red/CORS/timeout se toleran).
 * Orden: oEmbed del servicio → iTunes Lookup (Apple con id de pista) / Deezer API → slug de la URL → nada.
 * @param {ReturnType<typeof parseMusicLink>|string} link resultado de parseMusicLink (o texto)
 * @param {{fetchImpl?:typeof fetch, signal?:AbortSignal, timeoutMs?:number}} [opts]
 * @returns {Promise<{title:string, artist:string, source:'oembed'|'lookup'|'slug'|'none', needsTrack?:true}>}
 *   Álbum/lista/artista → needsTrack:true (sin red; title puede traer el slug como pista). artist '' = desconocido
 *   (p. ej. Spotify oEmbed sólo da el título).
 */
export async function resolveSong(link, { fetchImpl, signal, timeoutMs = 6000 } = {}) {
  try {
    if (typeof link === 'string') link = parseMusicLink(link);
    if (!link) return { title: '', artist: '', source: 'none' };
    if (['album', 'playlist', 'artist'].includes(link.kind)) {
      return { title: link.slugTitle || '', artist: link.slugArtist || '', source: 'none', needsTrack: true };
    }
    const f = fetchImpl || (typeof fetch === 'function' ? fetch : null);
    if (f) {
      const got = await viaNetwork(link, f, signal, timeoutMs).catch(() => null);
      if (got) return got;
    }
    return slugResult(link) || { title: '', artist: '', source: 'none' };
  } catch {
    return { title: '', artist: '', source: 'none' };
  }
}

async function viaNetwork(link, f, signal, timeoutMs) {
  const enc = encodeURIComponent;
  const get = (url) => fetchJson(f, url, signal, timeoutMs);
  const fromOembed = (d, byRe) => {
    if (!d || typeof d.title !== 'string' || !d.title.trim()) return null;
    let title = d.title;
    const author = typeof d.author_name === 'string' ? d.author_name : '';
    if (byRe && author) {
      const i = title.toLowerCase().lastIndexOf(' by ' + author.toLowerCase());
      if (i > 0) title = title.slice(0, i);
    }
    const c = cleanTitle(title, author);
    return c.title ? { ...c, source: 'oembed' } : null;
  };
  switch (link.service) {
    case 'youtube':
    case 'youtube-music': {
      const url = link.id && link.kind !== 'playlist' ? 'https://www.youtube.com/watch?v=' + link.id : link.url;
      return fromOembed(await get(ENDPOINTS.youtubeOembed + enc(url)));
    }
    case 'spotify':
      return fromOembed(await get(ENDPOINTS.spotifyOembed + enc(link.url)));
    case 'soundcloud': {
      const r = fromOembed(await get(ENDPOINTS.soundcloudOembed + enc(link.url)), true);
      if (r && !r.artist && link.slugArtist) r.artist = link.slugArtist;
      return r;
    }
    case 'deezer': {
      if (link.kind !== 'track' || !link.id) return null;
      const d = await get(ENDPOINTS.deezerTrack + enc(link.id));
      if (!d || typeof d.title !== 'string' || !d.title) return null;
      return { title: d.title, artist: (d.artist && d.artist.name) || '', source: 'lookup' };
    }
    case 'apple-music': {
      if (link.kind !== 'track' || !link.id) return null;
      const d = await get(ENDPOINTS.itunesLookup + enc(link.id) + (link.country ? '&country=' + link.country : ''));
      const r = d && Array.isArray(d.results) ? d.results.find((x) => x && x.trackName) : null;
      return r ? { title: r.trackName, artist: r.artistName || '', source: 'lookup' } : null;
    }
    default:
      return null;
  }
}
