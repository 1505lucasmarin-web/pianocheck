// "Pedir una canción": la IA arma un arreglo para piano a partir del nombre de la pieza.
// Lógica pura (prompt, normalización) + llamada a Anthropic/Gemini reutilizando helpers de omr.js.
import { validateScore, durBeats } from './model.js';
import { extractJson, mapHttpError, textFromResponse, OmrError, DEFAULT_MODELS } from './omr.js';
import { GUIDE_SYSTEM_PROMPT, GUIDE_MODE_ADDENDUM, buildGuideUserPrompt, buildScoreFromGuidePrompt, buildRetryPrompt, normalizeGuide, verifyScore, problemsSummaryEs } from './guide.js';

export const LEVELS = ['principiante', 'intermedio', 'pro'];                    // niveles fijos (siguen aceptándose)
export const COMPOSE_LEVELS = ['auto', ...LEVELS];                              // 'auto' = la IA elige la complejidad según la pieza (valor por defecto)
export const STYLES = ['auto', 'melodia', 'acompanamiento'];                    // 'auto' = lo más sencillo que suene a la pieza
export const HANDS = ['melodia', 'dos-manos'];                                  // parámetro viejo; equivale a style melodia / acompanamiento
const MAX_SOURCE_CHARS = 12000;                                                 // tope del texto de notas de la fuente que va al prompt

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';

/* ------------------------------------------------------------------ prompt */

export const COMPOSE_SYSTEM_PROMPT = `You are a piano arranger. The user names a piece of music and you write a piano arrangement of it, from memory (or from the source notes the user message supplies, if any), as strict JSON for a practice app. Output ONLY one JSON object: no markdown fences, no commentary.

JSON schema:
{
  "title": string,             // title of the piece
  "bpm": number,               // suggested tempo in quarter-note beats per minute
  "timeSig": [number, number], // e.g. [4,4], [3,4], [6,8]
  "keySig": string,            // major/minor key name: "C","G","D","A","E","F","Bb","Eb","Am","Em","Dm"... (minor adds "m")
  "measures": [ { "rh": Event[], "lh": Event[] } ]
}
Event = { "k": string[], "d": "w"|"h"|"q"|"8"|"16"|"32", "dots": 0|1|2 (optional), "tie": boolean (optional) }

Rules:
1. "rh" is the right hand (treble clef) and "lh" the left hand (bass clef). Every measure has both arrays, in playing order.
2. "k" lists the ACTUAL SOUNDING pitches as "<letter><accidental>/<octave>", lowercase letter, "#" sharp, "b" flat, scientific pitch notation where middle C is "c/4" (e.g. "c/4", "f#/4", "bb/3"). Apply the key signature yourself: write the real pitch, never the bare letter name. A chord is ONE event with several entries in "k". A rest is an event with "k": [].
3. "d" is the base note value (w whole, h half, q quarter, 8 eighth, 16 sixteenth, 32 thirty-second); "dots" is the number of augmentation dots. A tie is written by "tie": true on the SECOND event, repeating the same pitches.
4. Every measure of each hand must add up EXACTLY to the time signature (4/4 = four quarter-note beats). Check each measure before answering. A whole-measure rest is a rest event as long as the measure.
5. Length: write the main, recognizable section of the piece, about 16 to 32 measures, ending at a natural stopping point.
6. Keep the pitches in a comfortable playing range for the hands.
7. Complexity of the arrangement (the user message says which mode applies):
 - auto (default): choose the complexity the piece itself asks for, looking at its register, melodic leaps, rhythm and harmony. Start from the SIMPLEST version that still sounds like the piece: keep the melody and its characteristic rhythm recognizable, in a comfortable key and register. Add a left hand, elaborate accompaniment patterns, harmonized chords, variations or embellishments ONLY when the identity of the piece depends on them (for example a piece defined by its arpeggiated or ostinato accompaniment) or when the user asks for them. Do not make it harder than necessary and do not pad it with decoration.
 - principiante: a single-note melody in the right hand, in a fixed or nearly fixed hand position, with quarter notes or longer (eighth notes only if essential); a key with 0 or 1 accidentals; the left hand plays one note or one fifth per measure (whole or half notes); slow tempo.
 - intermedio: the complete melody with its real rhythm; the left hand with broken chords or bass plus chord; some double notes (intervals) in the right hand; a comfortable key (up to 3 accidentals).
 - pro: a complete arrangement in the original key; the melody harmonized with chords or octaves in the right hand; a moving accompaniment (arpeggios, octave basses, leaps); sixteenth notes and syncopations when the piece has them; the original tempo.
8. Style (the user message says which one applies):
 - melodia: write only the melody in "rh" and leave "lh" as an empty array in every measure; the level still decides the rhythmic complexity and the key.
 - acompanamiento: melody in "rh" plus an accompaniment in "lh" (simple bass notes or block chords unless the level asks for more).
 - auto: you decide, following the "auto" complexity rule above (a melody alone is a perfectly good answer when that is enough to recognize the piece).
 If the user message includes SOURCE NOTES (the notes of an existing edition of this piece, as the same JSON measures), use them as the base: keep their pitches and rhythms for the melody and do NOT reinvent or "improve" it. You may only fix obvious errors, transpose to an easier key if the level or the auto rule calls for it, and add or remove the accompaniment according to the style.
9. If you do not know the piece confidently enough, or you cannot write it, do not invent something else: answer with {"error": "<reason in Spanish>"} instead of a score.

Example of the format (3/4, key of G, one measure): {"title":"Example","bpm":90,"timeSig":[3,4],"keySig":"G","measures":[{"rh":[{"k":["g/4"],"d":"q"},{"k":["b/4"],"d":"q"},{"k":["d/5"],"d":"q"}],"lh":[{"k":["g/2","d/3"],"d":"h","dots":1}]}]}

Reply with the JSON object only.`;

const LEVEL_LINE = {
  auto: 'Complexity: auto. Choose it from what the piece itself asks for (register, leaps, rhythm, harmony). Start with the simplest version that still sounds like the piece; keep the melody and its rhythm recognizable; add variations or an elaborate accompaniment only if the music justifies it or the user asked for them.',
  principiante: 'Level: principiante (single-note melody, fixed hand position, quarter notes or longer, 0-1 accidentals, one note or fifth per measure in the left hand, slow tempo).',
  intermedio: 'Level: intermedio (complete melody with its real rhythm, broken chords or bass plus chord in the left hand, some double notes in the right hand, up to 3 accidentals).',
  pro: 'Level: pro (complete arrangement in the original key, harmonized melody with chords or octaves, moving accompaniment, sixteenth notes and syncopations when the piece has them, original tempo).',
};

const STYLE_LINE = {
  auto: 'Style: auto. Melody in the right hand; write a left hand only if the piece needs it to sound like itself (otherwise leave "lh" empty); if you do, keep it simple unless the music asks for more.',
  melodia: 'Hands: melody only (right hand; left hand empty). The level still sets the rhythmic complexity and the key.',
  acompanamiento: 'Hands: both hands (melody in the right hand, accompaniment in the left hand).',
};

/** Resumen compacto de una partitura de origen para el prompt: tonalidad, compás, tempo y los compases en JSON. */
export function describeSource(score) {
  if (!score || !Array.isArray(score.measures) || !score.measures.length) return '';
  const head = { title: score.title, bpm: score.bpm, timeSig: score.timeSig, keySig: score.keySig };
  const ms = score.measures.map((m) => ({ rh: m.rh || [], lh: m.lh || [] }));
  let n = ms.length;
  let body = JSON.stringify(ms.slice(0, n));
  while (body.length > MAX_SOURCE_CHARS && n > 1) { n = Math.max(1, Math.floor(n * 0.8)); body = JSON.stringify(ms.slice(0, n)); }
  const cut = n < ms.length ? ` (only the first ${n} of ${ms.length} measures are shown)` : '';
  return `SOURCE NOTES (existing edition of this piece${cut}): ${JSON.stringify(head)}\nmeasures: ${body}`;
}

/**
 * `artist` es opcional: si viene, se agrega una línea para identificar la pieza.
 * `level`: "auto" (valor por defecto) | "principiante" | "intermedio" | "pro".
 * `hands` (parámetro viejo): "melodia" | "dos-manos"; `extra.style` ("auto"|"melodia"|"acompanamiento") tiene prioridad.
 * `extra.sourceScore`: notas de una fuente (Score) para usar como base en vez de reinventar la melodía.
 */
export function buildComposeUserPrompt(query, level, hands, artist, extra = {}) {
  const lv = LEVEL_LINE[level] || LEVEL_LINE.auto;
  const style = STYLES.includes(extra && extra.style) ? extra.style : hands === 'melodia' ? 'melodia' : hands === 'dos-manos' ? 'acompanamiento' : 'auto';
  const who = artist && String(artist).trim() ? `\nArtist or performer (only to identify which piece it is): ${JSON.stringify(String(artist).trim())}` : '';
  const src = extra && extra.sourceScore ? describeSource(extra.sourceScore) : '';
  return `Piece requested by the user: ${JSON.stringify(String(query).trim())}${who}\n${lv}\n${STYLE_LINE[style]}${src ? '\n' + src : ''}\nWrite the arrangement as the JSON object described in the instructions. Every measure must add up exactly to the time signature. JSON only.`;
}

/* ------------------------------------------------------------------ normalización */

const U = 64; // unidades por negra
const PIECES = [[4, 'w', 0], [3, 'h', 1], [2, 'h', 0], [1.5, 'q', 1], [1, 'q', 0], [0.75, '8', 1], [0.5, '8', 0], [0.25, '16', 0], [0.125, '32', 0]]
  .map(([b, d, dots]) => ({ u: Math.round(b * U), d, dots }));

/** Descompone una duración (en unidades) en figuras de mayor a menor. */
function pieces(units) {
  const out = [];
  let left = units;
  while (left >= PIECES[PIECES.length - 1].u) {
    const p = PIECES.find((x) => x.u <= left);
    out.push(p); left -= p.u;
  }
  return out;
}
const mk = (k, p, tie) => { const e = { k: k.slice(), d: p.d }; if (p.dots) e.dots = p.dots; if (tie) e.tie = true; return e; };

/** Ajusta una mano a `barBeats` negras: completa con silencios o recorta (la nota cortada se parte con ligaduras). */
export function fitHand(events, barBeats) {
  const bar = Math.round(barBeats * U);
  const out = [];
  let t = 0; let changed = false;
  for (const ev of events || []) {
    if (t >= bar) { changed = true; continue; }
    const len = Math.round(durBeats(ev) * U);
    if (len <= 0) { changed = true; continue; }
    if (t + len <= bar) { out.push(ev); t += len; continue; }
    changed = true;
    const ps = pieces(bar - t);
    ps.forEach((p, i) => out.push(mk(ev.k, p, i === 0 ? ev.tie : ev.k.length > 0)));
    t = bar;
  }
  if (t < bar) {
    changed = true;
    for (const p of pieces(bar - t)) out.push(mk([], p, false));
  }
  return { events: out, changed };
}

/** validateScore + ajuste de cada mano de cada compás a la duración del compás. */
export function normalizeScore(raw) {
  const v = validateScore(raw);
  const bar = (v.score.timeSig[0] * 4) / v.score.timeSig[1];
  let adjusted = 0;
  for (const m of v.score.measures) {
    for (const hand of ['rh', 'lh']) {
      const r = fitHand(m[hand], bar);
      if (r.changed) adjusted++;
      m[hand] = r.events;
    }
  }
  return { ok: v.ok, errors: v.errors, score: v.score, adjusted };
}

/* ------------------------------------------------------------------ llamada */

const FAIL = 'La IA no pudo armar esta partitura';
const SUGGEST = 'Probá con otra pieza o cargá una foto o un PDF de la partitura.';
const composeFail = (reason) => {
  const why = String(reason || 'sin motivo').trim().replace(/[.\s]+$/, '');
  const e = new OmrError(`${FAIL}: ${why}. ${SUGGEST}`, 'compose');
  e.reason = why;                                                              // motivo tal cual lo dijo el modelo (la UI lo muestra y ofrece otros caminos)
  return e;
};

export function buildComposeRequest(provider, { apiKey, model, query, level, hands, artist, style, sourceScore }) {
  const user = buildComposeUserPrompt(query, level, hands, artist, { style, sourceScore });
  if (provider === 'anthropic') {
    return {
      url: ANTHROPIC_URL,
      init: {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model, max_tokens: 16000, system: COMPOSE_SYSTEM_PROMPT, messages: [{ role: 'user', content: user }] }),
      },
    };
  }
  return {
    url: `${GEMINI_BASE}${encodeURIComponent(model)}:generateContent`,
    init: {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: COMPOSE_SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 32768 },
      }),
    },
  };
}

async function callText(provider, opts, fetchImpl, signal) {
  const { url, init } = buildComposeRequest(provider, opts);
  let res;
  try { res = await fetchImpl(url, { ...init, signal }); } catch (e) {
    if (e && e.name === 'AbortError') throw new OmrError('Cancelaste el pedido.', 'abort');
    throw new OmrError('No hay conexión con internet (o el navegador bloqueó la llamada). Verificá tu conexión y reintentá.', 'network');
  }
  const body = await res.text();
  if (!res.ok) throw mapHttpError(res.status, provider, body);
  let json;
  try { json = JSON.parse(body); } catch (e) { throw new OmrError('La respuesta del servidor no se pudo leer.', 'parse'); }
  try { return textFromResponse(provider, json); } catch (e) {
    if (e && e.kind === 'refusal') throw composeFail('el modelo rechazó el pedido');
    if (e && e.kind === 'truncated') throw composeFail('la respuesta se cortó por ser demasiado larga; probá con una pieza más corta');
    throw e;
  }
}

/**
 * Arma una partitura a partir de un pedido en texto.
 * { query, artist?, sourceUrl?, level?: "auto"(defecto)|"principiante"|"intermedio"|"pro", style?: "auto"(defecto)|"melodia"|"acompanamiento",
 *   hands?: "melodia"|"dos-manos" (viejo; si no hay `style` se traduce), sourceScore?: Score (notas de una fuente para usar como base),
 *   provider, apiKey, model, onProgress, signal, fetchImpl }
 * `artist` va al prompt para identificar la pieza; `sourceUrl` (http/https) sólo se guarda en la partitura ("Abrir original").
 */
export async function composeScore(opts = {}) {
  const { query, provider = 'anthropic', apiKey, onProgress = () => {}, signal } = opts;
  const level = COMPOSE_LEVELS.includes(opts.level) ? opts.level : 'auto';
  const style = STYLES.includes(opts.style) ? opts.style : opts.hands === 'melodia' ? 'melodia' : opts.hands === 'dos-manos' ? 'acompanamiento' : 'auto';
  const hands = HANDS.includes(opts.hands) ? opts.hands : undefined;
  const fetchImpl = opts.fetchImpl || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
  if (provider !== 'anthropic' && provider !== 'gemini') throw new OmrError('Proveedor de IA desconocido.', 'config');
  if (!query || !String(query).trim()) throw new OmrError('Escribí qué canción querés tocar.', 'config');
  if (!apiKey || !String(apiKey).trim()) throw new OmrError('Falta la API key. Cargala en Ajustes.', 'auth');
  if (!fetchImpl) throw new OmrError('Este navegador no soporta llamadas de red.', 'config');
  const model = opts.model || DEFAULT_MODELS[provider];

  onProgress('Pensando el arreglo… puede tardar un minuto');
  const text = await callText(provider, { apiKey: String(apiKey).trim(), model, query, level, hands, artist: opts.artist, style, sourceScore: opts.sourceScore }, fetchImpl, signal);
  onProgress('Armando la partitura…');
  let parsed;
  try { parsed = extractJson(text); } catch (e) {
    if (!/[{[]/.test(String(text || ''))) {
      const snippet = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 220);
      throw composeFail(snippet || 'la respuesta vino vacía');
    }
    throw new OmrError('No se pudo interpretar la respuesta de la IA. Reintentá o probá con otra pieza.', 'parse');
  }
  if (parsed && !Array.isArray(parsed) && typeof parsed.error === 'string' && parsed.error.trim()) throw composeFail(parsed.error);
  if (!parsed || Array.isArray(parsed) || !Array.isArray(parsed.measures)) throw composeFail('no devolvió compases');
  const r = normalizeScore(parsed);
  if (!r.ok) throw composeFail('no encontró notas para tocar');
  if (level !== 'auto') r.score.level = level;                                 // en modo auto la partitura no queda marcada con un nivel fijo
  if (typeof opts.sourceUrl === 'string' && /^https?:\/\/\S+$/i.test(opts.sourceUrl.trim()) && opts.sourceUrl.trim().length <= 2000) r.score.sourceUrl = opts.sourceUrl.trim();
  if (!parsed.title || !String(parsed.title).trim()) r.score.title = String(query).trim().slice(0, 80);
  return r.score;
}


/* ================================================================== crear con IA por pasos (hoja guía → partitura → verificación) */
// Dos llamadas con la IA del usuario, sin audio: (i) hoja guía (tonalidad, compás, tempo, forma, acordes por compás, contorno) y
// (ii) partitura a partir de esa hoja. Verificación determinista y UN reintento automático con los problemas detectados.
// Si el modelo dice que no conoce la pieza se respeta: se lanza composeFail (kind "compose") sin reformular ni insistir.
const GEMINI_INTERACTIONS = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const WEB_BLOCKED = ['pdfdrive.com', 'scribd.com', 'pdfcoffee.com', 'dokumen.pub', 'vdocuments.mx', 'libgen.is', 'z-lib.org', 'annas-archive.org'];
export const COMPOSE_WEB_TOOL = 'web_search_20250305';
const MAX_PAUSES = 3;

/** Pedido genérico de texto. turns = [{role:'user'|'assistant', text}]. web: herramienta de búsqueda web del proveedor (sólo para datos de la pieza). */
export function buildModelRequest(provider, { apiKey, model, system, turns, web = false, maxTokens = 16000, anthropicMessages }) {
  if (provider === 'anthropic') {
    const body = { model, max_tokens: maxTokens, system, messages: anthropicMessages || turns.map((t) => ({ role: t.role, content: t.text })) };
    if (web) body.tools = [{ type: COMPOSE_WEB_TOOL, name: 'web_search', max_uses: 3, blocked_domains: WEB_BLOCKED }];
    return { url: ANTHROPIC_URL, init: { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }, body: JSON.stringify(body) } };
  }
  if (web) {   // Gemini con búsqueda: sólo la API Interactions (ver catalog.js); las instrucciones van dentro de `input`
    const input = `${system}\n\n` + turns.map((t) => (t.role === 'user' ? t.text : `Previous answer:\n${t.text}`)).join('\n\n');
    return { url: GEMINI_INTERACTIONS, init: { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey }, body: JSON.stringify({ model, input, tools: [{ type: 'google_search' }] }) } };
  }
  return {
    url: `${GEMINI_BASE}${encodeURIComponent(model)}:generateContent`,
    init: {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: turns.map((t) => ({ role: t.role === 'assistant' ? 'model' : 'user', parts: [{ text: t.text }] })), generationConfig: { temperature: 0.3, maxOutputTokens: 32768 } }),
    },
  };
}

async function callModel(provider, req, fetchImpl, signal) {
  const post = async (r) => {
    let res;
    try { res = await fetchImpl(r.url, { ...r.init, signal }); } catch (e) {
      if (e && e.name === 'AbortError') throw new OmrError('Cancelaste el pedido.', 'abort');
      throw new OmrError('No hay conexión con internet (o el navegador bloqueó la llamada). Verificá tu conexión y reintentá.', 'network');
    }
    const body = await res.text();
    if (!res.ok) {
      if (res.status === 400 && req.web && /web.?search|google_search|tool/i.test(body)) throw new OmrError('La búsqueda web no está disponible con esta cuenta o este modelo.', 'unsupported');
      throw mapHttpError(res.status, provider, body);
    }
    try { return JSON.parse(body); } catch (e) { throw new OmrError('La respuesta del servidor no se pudo leer.', 'parse'); }
  };
  const wrap = (fn) => { try { return fn(); } catch (e) {
    if (e && e.kind === 'refusal') throw composeFail('el modelo rechazó el pedido');
    if (e && e.kind === 'truncated') throw composeFail('la respuesta se cortó por ser demasiado larga; probá con una pieza más corta');
    throw e;
  } };
  if (provider === 'anthropic' && req.web) {
    let text = ''; let msgs = null;
    for (let i = 0; i <= MAX_PAUSES; i++) {
      const json = await post(buildModelRequest('anthropic', { ...req, anthropicMessages: msgs || undefined }));
      text = wrap(() => textFromResponse('anthropic', json));
      if (json.stop_reason !== 'pause_turn') break;
      msgs = [...(msgs || req.turns.map((t) => ({ role: t.role, content: t.text }))), { role: 'assistant', content: json.content }];
    }
    return text;
  }
  const json = await post(buildModelRequest(provider, req));
  if (provider === 'gemini' && req.web) {
    let out = '';
    for (const st of Array.isArray(json.steps) ? json.steps : []) {
      if (!st || st.type !== 'model_output') continue;
      for (const c of Array.isArray(st.content) ? st.content : []) if (c && c.type === 'text') out += c.text || '';
    }
    return out;
  }
  return wrap(() => textFromResponse(provider, json));
}

function parseOrFail(text, what) {
  let parsed;
  try { parsed = extractJson(text); } catch (e) {
    if (!/[{[]/.test(String(text || ''))) {
      const snippet = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 220);
      throw composeFail(snippet || 'la respuesta vino vacía');
    }
    throw new OmrError(`No se pudo interpretar ${what} de la IA. Reintentá o probá con otra pieza.`, 'parse');
  }
  return parsed;
}

/**
 * Crear con IA por pasos. Devuelve { score, guide, report:{ retried, problems, remaining, web } }.
 * Opciones como composeScore, más `web` (true: la IA puede buscar en la web SÓLO datos de la pieza; si el proveedor no la soporta se sigue sin ella).
 */
export async function composeStepwise(opts = {}) {
  const { query, provider = 'anthropic', apiKey, onProgress = () => {}, signal } = opts;
  const level = COMPOSE_LEVELS.includes(opts.level) ? opts.level : 'auto';
  const style = STYLES.includes(opts.style) ? opts.style : opts.hands === 'melodia' ? 'melodia' : opts.hands === 'dos-manos' ? 'acompanamiento' : 'auto';
  const fetchImpl = opts.fetchImpl || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
  if (provider !== 'anthropic' && provider !== 'gemini') throw new OmrError('Proveedor de IA desconocido.', 'config');
  if (!query || !String(query).trim()) throw new OmrError('Escribí qué canción querés tocar.', 'config');
  if (!apiKey || !String(apiKey).trim()) throw new OmrError('Falta la API key. Cargala en Ajustes.', 'auth');
  if (!fetchImpl) throw new OmrError('Este navegador no soporta llamadas de red.', 'config');
  const model = opts.model || DEFAULT_MODELS[provider];
  const key = String(apiKey).trim();
  const report = { retried: false, problems: [], remaining: [], web: false };

  // 1) hoja guía
  onProgress('Paso 1 de 2: armando la hoja guía (tonalidad, compás, acordes y forma)…');
  const gTurns = [{ role: 'user', text: buildGuideUserPrompt(query, opts.artist) }];
  let gText;
  if (opts.web) {
    try { gText = await callModel(provider, { apiKey: key, model, system: GUIDE_SYSTEM_PROMPT, turns: gTurns, web: true, maxTokens: 8000 }, fetchImpl, signal); report.web = true; } catch (e) {
      if (!(e && (e.kind === 'unsupported' || e.kind === 'bad'))) throw e;      // la búsqueda no está disponible: se sigue sin ella (no es insistir con la pieza)
    }
  }
  if (gText == null) gText = await callModel(provider, { apiKey: key, model, system: GUIDE_SYSTEM_PROMPT, turns: gTurns, maxTokens: 8000 }, fetchImpl, signal);
  const gRaw = parseOrFail(gText, 'la hoja guía');
  const g = normalizeGuide(gRaw);
  if (!g.ok) throw composeFail(g.error);
  const guide = g.guide;

  // 2) partitura a partir de la hoja guía
  onProgress(`Paso 2 de 2: escribiendo la partitura (${guide.measures.length} compases)…`);
  const system = COMPOSE_SYSTEM_PROMPT + GUIDE_MODE_ADDENDUM;
  const userPrompt = buildScoreFromGuidePrompt(guide, STYLE_LINE[style], LEVEL_LINE[level]);
  const turns = [{ role: 'user', text: userPrompt }];
  const text1 = await callModel(provider, { apiKey: key, model, system, turns }, fetchImpl, signal);
  let parsed = parseOrFail(text1, 'la partitura');
  if (parsed && !Array.isArray(parsed) && typeof parsed.error === 'string' && parsed.error.trim()) throw composeFail(parsed.error);   // la negativa se respeta
  if (!parsed || Array.isArray(parsed) || !Array.isArray(parsed.measures)) throw composeFail('no devolvió compases');

  // 3) verificación determinista y UN reintento
  onProgress('Verificando compases, notas y rango…');
  let ver = verifyScore(parsed, guide, { style });
  report.problems = ver.problems;
  if (!ver.ok) {
    report.retried = true;
    onProgress(`Corrigiendo ${ver.total} problema${ver.total > 1 ? 's' : ''} detectado${ver.total > 1 ? 's' : ''}…`);
    const text2 = await callModel(provider, { apiKey: key, model, system, turns: [...turns, { role: 'assistant', text: text1 }, { role: 'user', text: buildRetryPrompt(ver.problems) }] }, fetchImpl, signal);
    let p2 = null;
    try { p2 = extractJson(text2); } catch (e) { p2 = null; }
    if (p2 && !Array.isArray(p2) && Array.isArray(p2.measures)) {
      const v2 = verifyScore(p2, guide, { style });
      if (v2.total <= ver.total) { parsed = p2; ver = v2; }                   // sólo se acepta si no empeora
    }
    report.remaining = ver.problems;
  }
  const r = normalizeScore(parsed);
  if (!r.ok) throw composeFail('no encontró notas para tocar');
  if (level !== 'auto') r.score.level = level;
  if (typeof opts.sourceUrl === 'string' && /^https?:\/\/\S+$/i.test(opts.sourceUrl.trim()) && opts.sourceUrl.trim().length <= 2000) r.score.sourceUrl = opts.sourceUrl.trim();
  if (!parsed.title || !String(parsed.title).trim()) r.score.title = (guide.title || String(query).trim()).slice(0, 80);
  r.score.bpm = r.score.bpm || guide.bpm;
  report.summary = problemsSummaryEs(report.remaining);
  return { score: r.score, guide, report };
}
