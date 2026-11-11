// "Pedir una canción": la IA arma un arreglo para piano a partir del nombre de la pieza.
// Lógica pura (prompt, normalización) + llamada a Anthropic/Gemini reutilizando helpers de omr.js.
import { validateScore, durBeats } from './model.js';
import { extractJson, mapHttpError, textFromResponse, OmrError, DEFAULT_MODELS } from './omr.js';

export const LEVELS = ['principiante', 'intermedio', 'pro'];
export const HANDS = ['melodia', 'dos-manos'];

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';

/* ------------------------------------------------------------------ prompt */

export const COMPOSE_SYSTEM_PROMPT = `You are a piano arranger. The user names a piece of music and you write a piano arrangement of it, from memory, as strict JSON for a practice app. Output ONLY one JSON object: no markdown fences, no commentary.

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
7. Level of the arrangement (the user message says which one):
 - principiante: a single-note melody in the right hand, in a fixed or nearly fixed hand position, with quarter notes or longer (eighth notes only if essential); a key with 0 or 1 accidentals; the left hand plays one note or one fifth per measure (whole or half notes); slow tempo.
 - intermedio: the complete melody with its real rhythm; the left hand with broken chords or bass plus chord; some double notes (intervals) in the right hand; a comfortable key (up to 3 accidentals).
 - pro: a complete arrangement in the original key; the melody harmonized with chords or octaves in the right hand; a moving accompaniment (arpeggios, octave basses, leaps); sixteenth notes and syncopations when the piece has them; the original tempo.
8. If the user asks for melody only, write only the melody in "rh" and leave "lh" as an empty array in every measure; the level still decides the rhythmic complexity and the key.
9. If you do not know the piece confidently enough, or you cannot write it, do not invent something else: answer with {"error": "<reason in Spanish>"} instead of a score.

Example of the format (3/4, key of G, one measure): {"title":"Example","bpm":90,"timeSig":[3,4],"keySig":"G","measures":[{"rh":[{"k":["g/4"],"d":"q"},{"k":["b/4"],"d":"q"},{"k":["d/5"],"d":"q"}],"lh":[{"k":["g/2","d/3"],"d":"h","dots":1}]}]}

Reply with the JSON object only.`;

const LEVEL_LINE = {
  principiante: 'Level: principiante (single-note melody, fixed hand position, quarter notes or longer, 0-1 accidentals, one note or fifth per measure in the left hand, slow tempo).',
  intermedio: 'Level: intermedio (complete melody with its real rhythm, broken chords or bass plus chord in the left hand, some double notes in the right hand, up to 3 accidentals).',
  pro: 'Level: pro (complete arrangement in the original key, harmonized melody with chords or octaves, moving accompaniment, sixteenth notes and syncopations when the piece has them, original tempo).',
};

/** `artist` es opcional: si viene, se agrega una línea para identificar la pieza (no cambia el resto del prompt). */
export function buildComposeUserPrompt(query, level, hands, artist) {
  const lv = LEVEL_LINE[level] || LEVEL_LINE.principiante;
  const hd = hands === 'melodia'
    ? 'Hands: melody only (right hand; left hand empty). The level still sets the rhythmic complexity and the key.'
    : 'Hands: both hands (melody in the right hand, accompaniment in the left hand).';
  const who = artist && String(artist).trim() ? `\nArtist or performer (only to identify which piece it is): ${JSON.stringify(String(artist).trim())}` : '';
  return `Piece requested by the user: ${JSON.stringify(String(query).trim())}${who}\n${lv}\n${hd}\nWrite the arrangement as the JSON object described in the instructions. Every measure must add up exactly to the time signature. JSON only.`;
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
const composeFail = (reason) => new OmrError(`${FAIL}: ${String(reason || 'sin motivo').trim().replace(/[.\s]+$/, '')}. ${SUGGEST}`, 'compose');

export function buildComposeRequest(provider, { apiKey, model, query, level, hands, artist }) {
  const user = buildComposeUserPrompt(query, level, hands, artist);
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
 * { query, artist?, sourceUrl?, level: "principiante"|"intermedio"|"pro", hands: "melodia"|"dos-manos", provider, apiKey, model, onProgress, signal, fetchImpl }
 * `artist` va al prompt para identificar la pieza; `sourceUrl` (http/https) sólo se guarda en la partitura ("Abrir original").
 */
export async function composeScore(opts = {}) {
  const { query, provider = 'anthropic', apiKey, onProgress = () => {}, signal } = opts;
  const level = LEVELS.includes(opts.level) ? opts.level : 'principiante';
  const hands = HANDS.includes(opts.hands) ? opts.hands : 'dos-manos';
  const fetchImpl = opts.fetchImpl || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
  if (provider !== 'anthropic' && provider !== 'gemini') throw new OmrError('Proveedor de IA desconocido.', 'config');
  if (!query || !String(query).trim()) throw new OmrError('Escribí qué canción querés tocar.', 'config');
  if (!apiKey || !String(apiKey).trim()) throw new OmrError('Falta la API key. Cargala en Ajustes.', 'auth');
  if (!fetchImpl) throw new OmrError('Este navegador no soporta llamadas de red.', 'config');
  const model = opts.model || DEFAULT_MODELS[provider];

  onProgress('Pensando el arreglo… puede tardar un minuto');
  const text = await callText(provider, { apiKey: String(apiKey).trim(), model, query, level, hands, artist: opts.artist }, fetchImpl, signal);
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
  r.score.level = level;
  if (typeof opts.sourceUrl === 'string' && /^https?:\/\/\S+$/i.test(opts.sourceUrl.trim()) && opts.sourceUrl.trim().length <= 2000) r.score.sourceUrl = opts.sourceUrl.trim();
  if (!parsed.title || !String(parsed.title).trim()) r.score.title = String(query).trim().slice(0, 80);
  return r.score;
}
