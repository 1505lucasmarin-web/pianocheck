// "Buscar una versión para tocar" ANTES de generar de memoria. Sin backend, sin DOM; fetch inyectable.
// Orden: 1) biblioteca del usuario, 2) piezas incluidas en la app (pieces.js), 3) ediciones verificables encontradas con la
// herramienta de búsqueda web del proveedor de IA del usuario, 4) enlaces de búsqueda determinísticos a catálogos legítimos.
//
// ---- Qué se confirmó en documentación OFICIAL y qué no (consultado el 2026-11-11) ----
// Anthropic (platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool; docs.claude.com redirige ahí):
//   CONFIRMADO: herramienta de servidor `{type:"web_search_20250305", name:"web_search", max_uses, allowed_domains | blocked_domains
//   (excluyentes), user_location}`. Existen también `web_search_20260209` (filtrado dinámico, exige modelos 4.6+ y code
//   execution) y `web_search_20260318` (`response_inclusion`); se usa la básica 20250305 porque funciona con cualquier modelo
//   compatible y desde el navegador sin herramientas extra. Respuesta: bloques `server_tool_use` ({name:"web_search",
//   input:{query}}), `web_search_tool_result` ({tool_use_id, content:[{type:"web_search_result", url, title, page_age,
//   encrypted_content}]} o, ante error, content:{type:"web_search_tool_result_error", error_code}, con HTTP 200) y bloques `text`
//   con `citations:[{type:"web_search_result_location", url, title, cited_text}]`. Códigos: too_many_requests,
//   invalid_tool_input, max_uses_exceeded, query_too_long, request_too_large, unavailable. `stop_reason:"pause_turn"` → hay que
//   reenviar el turno pausado tal cual para continuar. Sin resultados = `content` vacío (no es error).
//   NO confirmado: nada sobre CORS para la herramienta (se usa el mismo encabezado de acceso directo desde el navegador que
//   el resto de la app).
// Gemini (ai.google.dev/gemini-api/docs/google-search): la documentación vigente describe la herramienta SOLO con la
//   Interactions API: POST https://generativelanguage.googleapis.com/v1beta/interactions, cuerpo
//   `{model, input, tools:[{type:"google_search"}]}`, cabecera `x-goog-api-key`. La respuesta trae `steps[]` con
//   `google_search_call` (arguments.queries), `google_search_result` (sólo search_suggestions) y `model_output` con
//   `content[]` de tipo text y `annotations:[{type:"url_citation", url, title, start_index, end_index}]` (el `title` de los
//   ejemplos es sólo el dominio). Por eso las URLs verificables de Gemini salen únicamente de esas `url_citation`.
//   NO confirmado: `groundingMetadata` / `groundingChunks` (generateContent) no figuran en la página vigente; el parser los
//   tolera como respaldo pero no se promete. Tampoco se documenta si `system_instruction` existe en Interactions: las
//   instrucciones van dentro de `input`.
// Buscadores de catálogos (para `searchLinks`): se exige URL de búsqueda confirmada HOY cargándola.
//   CONFIRMADO: Hal Leonard  https://www.halleonard.com/search/search.action?keywords=<texto>  (devolvió "Search Results:
//   "evermore" | Hal Leonard", 198 productos, primero "Taylor Swift – Evermore" Easy Piano).
//   NO confirmados (por eso NO se incluyen): Musicnotes (robots.txt impide leerlo), MuseScore (robots), IMSLP (robots),
//   Sheet Music Direct (la URL que figura en su blog de 2014 y las variantes actuales dieron error 4xx) y Sheet Music Plus
//   (`/en/explore?q=` cargó pero ignoró la consulta). Si se confirma otro formato, agregarlo en `SEARCH_ENGINES`.
import { findPiece, normalizeText } from './pieces.js';
import { OmrError, mapHttpError, extractJson, DEFAULT_MODELS } from './omr.js';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const GEMINI_INTERACTIONS_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';
export const ANTHROPIC_SEARCH_TOOL = 'web_search_20250305';
const MAX_PAUSES = 3;
const MAX_EDITIONS = 8;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MIN_INCLUDED_SCORE = 0.6;

/** Sitios de descargas no autorizadas que nunca se devuelven (lista mínima, de mejor esfuerzo; el prompt pide lo mismo). */
export const BLOCKED_DOMAINS = ['pdfdrive.com', 'scribd.com', 'pdfcoffee.com', 'dokumen.pub', 'vdocuments.mx', 'libgen.is', 'z-lib.org', 'annas-archive.org'];

/** Hosts de acceso abierto (dominio público / licencia abierta declarada por la fuente): sólo ahí una edición puede ser `importable`. */
export const OPEN_HOSTS = ['imslp.org', 'mutopiaproject.org', 'musopen.org', 'cpdl.org', 'upload.wikimedia.org', 'commons.wikimedia.org', 'archive.org'];

const FORMAT_BY_EXT = { musicxml: 'musicxml', mxl: 'musicxml', xml: 'musicxml', mid: 'midi', midi: 'midi', pdf: 'pdf' };
const MIME_EXT = { musicxml: 'musicxml', midi: 'mid', pdf: 'pdf' };

/* ------------------------------------------------------------------ errores */

/**
 * Clasifica un fallo para decidir qué mostrar en la UI. "Reintentar" sólo tiene sentido para `network` y `rate`.
 * Reutiliza OmrError.kind: network/server → "network"; auth → "auth"; rate → "rate"; refusal → "refused"; el resto → "unknown".
 * Acepta un Error, un OmrError o un objeto `{kind}` de `searchSong().errors`.
 * @param {any} err
 * @returns {"network"|"auth"|"rate"|"refused"|"unknown"}
 */
export function classifyFailure(err) {
  if (!err) return 'unknown';
  const k = err.kind;
  if (k === 'network' || k === 'server') return 'network';
  if (k === 'auth') return 'auth';
  if (k === 'rate') return 'rate';
  if (k === 'refusal' || k === 'refused') return 'refused';
  if (k === 'abort' || err.name === 'AbortError') return 'unknown';
  if (err instanceof TypeError && /fetch|network|load failed|failed to/i.test(String(err.message))) return 'network';
  return 'unknown';
}

/* ------------------------------------------------------------------ URLs */

function parseUrl(u) {
  try { return new URL(String(u)); } catch (e) { return null; }
}

/** Clave comparable de una URL: sin hash, sin parámetros de seguimiento, host en minúsculas, sin "/" final. */
export function normalizeUrl(u) {
  const x = parseUrl(u);
  if (!x || !/^https?:$/.test(x.protocol)) return '';
  for (const k of [...x.searchParams.keys()]) if (/^(utm_|fbclid$|gclid$|ref$)/i.test(k)) x.searchParams.delete(k);
  x.hash = '';
  const path = x.pathname.replace(/\/+$/, '');
  return `${x.protocol}//${x.hostname.toLowerCase().replace(/^www\./, '')}${path}${x.search}`;
}

const hostIn = (host, list) => list.some((d) => host === d || host.endsWith('.' + d));

function formatOf(url) {
  const x = parseUrl(url);
  if (!x) return 'web';
  const m = /\.([a-z0-9]{2,8})$/i.exec(x.pathname);
  return (m && FORMAT_BY_EXT[m[1].toLowerCase()]) || 'web';
}

/* ------------------------------------------------------------------ enlaces de búsqueda */

/** Buscadores de catálogos con formato de URL CONFIRMADO (ver encabezado). */
const SEARCH_ENGINES = [
  { label: 'Buscar en Hal Leonard', url: (q) => `https://www.halleonard.com/search/search.action?keywords=${encodeURIComponent(q)}` },
];

/**
 * Enlaces de búsqueda armados de forma determinista hacia catálogos legítimos.
 * @param {{title?:string, artist?:string}} q
 * @returns {{label:string, url:string}[]} vacío si no hay texto para buscar
 */
export function buildSearchLinks({ title, artist } = {}) {
  const text = [title, artist].map((x) => String(x || '').trim()).filter(Boolean).join(' ');
  if (!text) return [];
  return SEARCH_ENGINES.map((e) => ({ label: e.label, url: e.url(text) }));
}

/* ------------------------------------------------------------------ biblioteca e incluidas */

function matchLibrary(library, { title, artist, sourceUrl }) {
  const nt = normalizeText(title); const na = normalizeText(artist);
  const nu = normalizeUrl(sourceUrl);
  const bounded = (hay, needle) => needle.length >= 3 && (` ${hay} `).includes(` ${needle} `);
  const out = [];
  for (const s of Array.isArray(library) ? library : []) {
    if (!s || typeof s !== 'object') continue;
    const st = normalizeText(s.title);
    let match = null;
    if (nu && s.sourceUrl && normalizeUrl(s.sourceUrl) === nu) match = 'url';
    else if (nt && st && (st === nt || bounded(st, nt) || (st.length >= 4 && bounded(nt, st)))) match = na && bounded(st, na) ? 'title+artist' : 'title';
    if (match) out.push({ scoreId: s.id, title: s.title, match });
  }
  const rank = { url: 0, 'title+artist': 1, title: 2 };
  return out.sort((a, b) => rank[a.match] - rank[b.match]);
}

function matchIncluded(title) {
  const found = findPiece(title).filter((r) => r.score >= MIN_INCLUDED_SCORE);
  if (!found.length) return [];
  const top = found[0].score;
  const out = [];
  for (const { piece, score } of found) {
    if (score < top - 0.15) continue;
    for (const v of piece.versions) out.push({ pieceId: piece.id, versionId: v.id, title: piece.title, label: v.label, score });
  }
  return out;
}

/* ------------------------------------------------------------------ búsqueda con IA */

export const SEARCH_SYSTEM_PROMPT = `You help a piano student find LEGITIMATE editions of the sheet music for a piece of music, using your web search tool. Output ONLY one JSON object at the end, with no markdown fences.

Rules:
1. First work out what the user means. A song and an album can share a name (for example "evermore" is both a Taylor Swift song, with Bon Iver, and an album). Decide which one the title and artist refer to and say so in "kind": "song", "album" or "unknown". Search for the SONG's sheet music unless the user clearly asked for the album.
2. Prefer legitimate sources: music publishers, official sheet-music stores (single-song digital prints, piano/vocal or easy piano arrangements), and public-domain or open-licence catalogues (IMSLP, Mutopia, Musopen, CPDL, Wikimedia Commons) when the piece is in the public domain.
3. NEVER return sites that distribute copyrighted scores without authorization (free-download PDF dumps, scraped uploads, torrent or "lyrics + tabs" copy sites). If you only find those, return an empty list.
4. Only list pages that your web search actually returned. NEVER write a URL from memory or invent one: every "url" must be exactly a URL from the search results.
5. A songbook of the whole album is not the same as the single song: say so in "scope" ("song", "album" or "collection") and explain briefly in "note".
6. Write "note" in Spanish (Argentina), one short sentence at most. Return at most 6 editions.

JSON schema:
{"identified":{"title":string,"artist":string,"kind":"song"|"album"|"unknown"},
 "editions":[{"title":string,"artist":string,"publisher":string,"url":string,"format":"musicxml"|"midi"|"pdf"|"web","scope":"song"|"album"|"collection","note":string}]}`;

/** Mensaje de usuario de la búsqueda (título/artista/enlace como datos entre comillas). */
export function buildSearchUserPrompt({ title, artist, sourceUrl } = {}) {
  const lines = [`Find sheet music editions for a piano player. Title: ${JSON.stringify(String(title || '').trim())}`];
  if (artist && String(artist).trim()) lines.push(`Artist or composer: ${JSON.stringify(String(artist).trim())}`);
  if (sourceUrl && String(sourceUrl).trim()) lines.push(`The user got this from a link (only to help identify the piece): ${JSON.stringify(String(sourceUrl).trim())}`);
  lines.push('Search the web, then answer with the JSON object described in the instructions. JSON only.');
  return lines.join('\n');
}

/** Pedido a la API del proveedor con su herramienta de búsqueda web. */
export function buildSearchRequest(provider, { apiKey, model, title, artist, sourceUrl, messages } = {}) {
  const user = buildSearchUserPrompt({ title, artist, sourceUrl });
  if (provider === 'anthropic') {
    return {
      url: ANTHROPIC_URL,
      init: {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          system: SEARCH_SYSTEM_PROMPT,
          messages: messages || [{ role: 'user', content: user }],
          tools: [{ type: ANTHROPIC_SEARCH_TOOL, name: 'web_search', max_uses: 3, blocked_domains: BLOCKED_DOMAINS }],
        }),
      },
    };
  }
  return {
    url: GEMINI_INTERACTIONS_URL,
    init: {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({ model, input: `${SEARCH_SYSTEM_PROMPT}\n\n${user}`, tools: [{ type: 'google_search' }] }),
    },
  };
}

/** Pool de URLs reales devueltas por la herramienta + texto del modelo + errores de la herramienta. */
function newPool() { return { urls: new Map(), cited: new Set(), text: '', toolErrors: [] }; }

function addUrl(pool, url, title, cited) {
  const key = normalizeUrl(url);
  if (!key) return;
  const prev = pool.urls.get(key);
  if (!prev) pool.urls.set(key, { url: String(url), title: String(title || '').trim() });
  else if (!prev.title && title) prev.title = String(title).trim();
  if (cited) pool.cited.add(key);
}

const TOOL_ERROR_KIND = { too_many_requests: 'rate', unavailable: 'network' };

function readAnthropic(json, pool) {
  for (const b of Array.isArray(json.content) ? json.content : []) {
    if (!b || typeof b !== 'object') continue;
    if (b.type === 'web_search_tool_result') {
      if (Array.isArray(b.content)) {
        for (const r of b.content) if (r && r.type === 'web_search_result') addUrl(pool, r.url, r.title, false);
      } else if (b.content && b.content.type === 'web_search_tool_result_error') {
        pool.toolErrors.push(String(b.content.error_code || 'error'));
      }
    } else if (b.type === 'text') {
      pool.text += b.text || '';
      for (const c of Array.isArray(b.citations) ? b.citations : []) if (c && c.url) addUrl(pool, c.url, c.title, true);
    }
  }
}

function readGemini(json, pool) {
  for (const st of Array.isArray(json.steps) ? json.steps : []) {
    if (!st || st.type !== 'model_output') continue;
    for (const c of Array.isArray(st.content) ? st.content : []) {
      if (!c || c.type !== 'text') continue;
      pool.text += c.text || '';
      for (const a of Array.isArray(c.annotations) ? c.annotations : []) if (a && a.type === 'url_citation' && a.url) addUrl(pool, a.url, a.title, true);
    }
  }
  // Respaldo NO confirmado en la doc vigente: generateContent con groundingMetadata.
  for (const cand of Array.isArray(json.candidates) ? json.candidates : []) {
    pool.text += ((cand.content && cand.content.parts) || []).map((p) => p.text || '').join('');
    for (const ch of (cand.groundingMetadata && cand.groundingMetadata.groundingChunks) || []) if (ch && ch.web && ch.web.uri) addUrl(pool, ch.web.uri, ch.web.title, true);
  }
}

async function postJson(fetchImpl, req, provider, signal) {
  let res;
  try { res = await fetchImpl(req.url, { ...req.init, signal }); } catch (e) {
    if (e && e.name === 'AbortError') throw new OmrError('Cancelaste la búsqueda.', 'abort');
    throw new OmrError('No hay conexión con internet (o el navegador bloqueó la llamada). Verificá tu conexión y reintentá.', 'network');
  }
  const body = await res.text();
  if (!res.ok) {
    if (res.status === 400 && /web.?search|google_search|tool/i.test(body)) {
      throw new OmrError('La búsqueda web no está disponible con esta cuenta o este modelo. Revisá Ajustes o probá con otro modelo.', 'unsupported');
    }
    throw mapHttpError(res.status, provider, body);
  }
  try { return JSON.parse(body); } catch (e) { throw new OmrError('La respuesta del servidor no se pudo leer.', 'parse'); }
}

async function runAiSearch(q, ai, fetchImpl, signal) {
  const provider = ai.provider === 'gemini' ? 'gemini' : 'anthropic';
  const model = ai.model || DEFAULT_MODELS[provider];
  const apiKey = String(ai.apiKey).trim();
  const pool = newPool();
  if (provider === 'anthropic') {
    let messages = null;
    for (let i = 0; i <= MAX_PAUSES; i++) {
      const json = await postJson(fetchImpl, buildSearchRequest('anthropic', { apiKey, model, ...q, messages }), 'anthropic', signal);
      if (json.stop_reason === 'refusal') throw new OmrError('La IA rechazó este pedido.', 'refusal');
      readAnthropic(json, pool);
      if (json.stop_reason !== 'pause_turn') break;
      messages = [...(messages || [{ role: 'user', content: buildSearchUserPrompt(q) }]), { role: 'assistant', content: json.content }];
    }
  } else {
    const json = await postJson(fetchImpl, buildSearchRequest('gemini', { apiKey, model, ...q }), 'gemini', signal);
    const br = json.promptFeedback && json.promptFeedback.blockReason;
    if (br) throw new OmrError(`Gemini bloqueó el pedido (${br}).`, 'refusal');
    readGemini(json, pool);
  }
  return pool;
}

/** Convierte lo que devolvió la herramienta en ediciones verificables. Sólo sobreviven URLs que están en el pool real. */
function editionsFromPool(pool) {
  let parsed = null;
  try { parsed = extractJson(pool.text); } catch (e) { parsed = null; }
  const picks = parsed && Array.isArray(parsed.editions) ? parsed.editions.slice(0, 20) : null;
  const out = []; const seen = new Set(); let rejected = 0;
  const accept = (key, meta) => {
    const hit = pool.urls.get(key);
    const x = hit && parseUrl(hit.url);
    if (!x || !/^https?:$/.test(x.protocol) || seen.has(key)) return;
    const host = x.hostname.toLowerCase().replace(/^www\./, '');
    if (hostIn(host, BLOCKED_DOMAINS)) { rejected++; return; }
    if (host === 'vertexaisearch.cloud.google.com') { rejected++; return; }          // enlace de redirección opaco: no se sabe de qué sitio es
    seen.add(key);
    const format = formatOf(hit.url);
    const importable = x.protocol === 'https:' && format !== 'web' && hostIn(host, OPEN_HOSTS);
    const ed = {
      title: (meta.title || hit.title || host).toString().slice(0, 160),
      publisher: (meta.publisher || host).toString().slice(0, 80),
      source: host,
      url: hit.url,
      format,
      importable,
      verified: true,
      scope: ['song', 'album', 'collection'].includes(meta.scope) ? meta.scope : 'song',
    };
    if (meta.artist) ed.artist = String(meta.artist).slice(0, 80);
    if (meta.note) ed.note = String(meta.note).replace(/\s+/g, ' ').trim().slice(0, 200);
    out.push(ed);
  };
  if (picks) {
    for (const e of picks) {
      const key = e && typeof e.url === 'string' ? normalizeUrl(e.url) : '';
      if (!key || !pool.urls.has(key)) { rejected++; continue; }                   // URL inventada o ajena a la búsqueda: se descarta
      accept(key, e);
    }
  } else {
    for (const key of pool.cited) accept(key, { note: 'Resultado citado por el buscador.' });
  }
  const identified = parsed && parsed.identified && typeof parsed.identified === 'object' ? parsed.identified : null;
  return { editions: out.slice(0, MAX_EDITIONS), rejected, identified };
}

/* ------------------------------------------------------------------ API pública */

const errEntry = (source, err) => ({ source, kind: classifyFailure(err), message: err && err.message ? err.message : String(err) });

/**
 * Busca una versión para tocar antes de generar de memoria.
 * @param {{title:string, artist?:string, sourceUrl?:string}} query
 * @param {{library?: object[], ai?: {provider:'anthropic'|'gemini', apiKey:string, model?:string}, fetchImpl?: Function,
 *   signal?: AbortSignal, skipAiIfLocal?: boolean}} [opts] `skipAiIfLocal` (defecto true): si ya hay coincidencia en la biblioteca o
 *   entre las incluidas no se gasta una llamada de IA.
 * @returns {Promise<{
 *   identified:{title:string, artist:string, kind:'song'|'album'|'unknown'},
 *   inLibrary:{scoreId:string, title:string, match:'url'|'title+artist'|'title'}[],
 *   included:{pieceId:string, versionId:string, title:string, label:string, score:number}[],
 *   editions:{title:string, artist?:string, publisher:string, source:string, url:string, format:'musicxml'|'midi'|'pdf'|'web',
 *     importable:boolean, verified:true, scope:'song'|'album'|'collection', note?:string}[],
 *   searchLinks:{label:string, url:string}[],
 *   errors:{source:'input'|'ai', kind:'network'|'auth'|'rate'|'refused'|'unknown', message:string}[],
 *   retryable:boolean, rejected:number, aiSkipped:boolean }>}
 *   Nunca lanza. `retryable` = algún error es de red o de límite de uso (mostrar "Reintentar"). `rejected` = cantidad de URLs
 *   descartadas por no provenir de la herramienta de búsqueda (o por ser sitios bloqueados).
 */
export async function searchSong(query = {}, opts = {}) {
  const title = String((query && query.title) || '').trim();
  const artist = String((query && query.artist) || '').trim();
  const sourceUrl = String((query && query.sourceUrl) || '').trim();
  const res = {
    identified: { title, artist, kind: 'unknown' }, inLibrary: [], included: [], editions: [],
    searchLinks: buildSearchLinks({ title, artist }), errors: [], retryable: false, rejected: 0, aiSkipped: false,
  };
  try {
    if (!title && !sourceUrl) {
      res.errors.push({ source: 'input', kind: 'unknown', message: 'Escribí el título de la canción.' });
      return res;
    }
    res.inLibrary = matchLibrary(opts.library, { title, artist, sourceUrl });
    res.included = title ? matchIncluded(title) : [];
    if (res.inLibrary.length || res.included.length) res.identified.kind = 'song';

    const ai = opts.ai;
    if (!title) {
      res.errors.push({ source: 'input', kind: 'unknown', message: 'Para buscar ediciones hace falta el título de la canción.' });
    } else if (!ai || !ai.apiKey || !String(ai.apiKey).trim()) {
      res.errors.push({ source: 'ai', kind: 'auth', message: 'Para buscar ediciones verificables hace falta una API key de IA (Anthropic o Gemini). Cargala en Ajustes.' });
    } else if ((res.inLibrary.length || res.included.length) && opts.skipAiIfLocal !== false) {
      res.aiSkipped = true;
    } else {
      const fetchImpl = opts.fetchImpl || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
      if (!fetchImpl) {
        res.errors.push({ source: 'ai', kind: 'unknown', message: 'Este navegador no soporta llamadas de red.' });
      } else {
        try {
          const pool = await runAiSearch({ title, artist, sourceUrl }, ai, fetchImpl, opts.signal);
          for (const code of pool.toolErrors) {
            res.errors.push({ source: 'ai', kind: TOOL_ERROR_KIND[code] || 'unknown', message: `La búsqueda web falló (${code}).` });
          }
          const r = editionsFromPool(pool);
          res.editions = r.editions;
          res.rejected = r.rejected;
          const id = r.identified;
          if (id) {
            if (typeof id.title === 'string' && id.title.trim()) res.identified.title = id.title.trim().slice(0, 120);
            if (typeof id.artist === 'string' && id.artist.trim()) res.identified.artist = id.artist.trim().slice(0, 120);
            if (id.kind === 'song' || id.kind === 'album') res.identified.kind = id.kind;
          }
        } catch (e) {
          res.errors.push(errEntry('ai', e));
        }
      }
    }
  } catch (e) {
    res.errors.push(errEntry('input', e));
  }
  res.retryable = res.errors.some((e) => e.kind === 'network' || e.kind === 'rate');
  return res;
}

/**
 * Intenta descargar una edición `importable` (sólo fuentes abiertas). Nunca lanza.
 * @param {{url:string, format?:string, importable?:boolean}} edition
 * @param {{fetchImpl?: Function, signal?: AbortSignal}} [opts]
 * @returns {Promise<{blob: Blob, filename: string}|{error: string, kind: 'unsupported'|'network'|'http'|'format'|'size'|'abort'}>}
 *   `error` ya viene en español para mostrar; ante CORS o falta de red `kind` es "network" (la UI puede ofrecer abrir el enlace
 *   y usar "Importar mi copia").
 */
export async function fetchEditionFile(edition, opts = {}) {
  if (!edition || edition.importable !== true || typeof edition.url !== 'string') {
    return { error: 'Esta edición no se puede descargar automáticamente. Abrí el enlace, conseguí el archivo y usá "Importar mi copia".', kind: 'unsupported' };
  }
  const x = parseUrl(edition.url);
  if (!x || x.protocol !== 'https:') return { error: 'El enlace no es seguro (https).', kind: 'unsupported' };
  const fetchImpl = opts.fetchImpl || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
  if (!fetchImpl) return { error: 'Este navegador no soporta llamadas de red.', kind: 'network' };
  let res;
  try { res = await fetchImpl(edition.url, { signal: opts.signal, redirect: 'follow' }); } catch (e) {
    if (e && e.name === 'AbortError') return { error: 'Cancelaste la descarga.', kind: 'abort' };
    return { error: 'No se pudo descargar el archivo: no hay conexión o el sitio no permite descargarlo desde la app. Abrí el enlace, bajalo y usá "Importar mi copia".', kind: 'network' };
  }
  if (!res.ok) return { error: `El sitio respondió con un error (HTTP ${res.status}). Abrí el enlace y probá desde ahí.`, kind: 'http' };
  const type = String((res.headers && res.headers.get && res.headers.get('content-type')) || '').toLowerCase();
  if (type.includes('text/html')) return { error: 'El enlace abre una página web, no un archivo. Abrilo, descargá el archivo y usá "Importar mi copia".', kind: 'format' };
  const len = Number(res.headers && res.headers.get && res.headers.get('content-length'));
  if (Number.isFinite(len) && len > MAX_FILE_BYTES) return { error: 'El archivo es demasiado grande (más de 25 MB).', kind: 'size' };
  let blob;
  try { blob = await res.blob(); } catch (e) { return { error: 'La descarga se cortó. Reintentá.', kind: 'network' }; }
  if (blob.size > MAX_FILE_BYTES) return { error: 'El archivo es demasiado grande (más de 25 MB).', kind: 'size' };
  if (blob.size === 0) return { error: 'El archivo descargado está vacío.', kind: 'format' };
  let name = '';
  try { name = decodeURIComponent(x.pathname.split('/').filter(Boolean).pop() || ''); } catch (e) { name = ''; }
  name = name.replace(/[^\w.\- ()áéíóúñÁÉÍÓÚÑ]+/g, '_').slice(0, 100);
  const fmt = edition.format;
  if (!name) name = 'partitura';
  if (!/\.[a-z0-9]{2,8}$/i.test(name) && MIME_EXT[fmt]) name += '.' + MIME_EXT[fmt];
  return { blob, filename: name };
}

