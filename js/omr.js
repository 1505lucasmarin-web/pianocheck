// Lectura de partituras por IA (foto/PDF → Score). Llamada directa desde el navegador con la API key del usuario.
import { durBeats, keyToMidi, validateScore } from './model.js';
import { timedNotesToEvents } from './importers.js';
import { splitScoreImage } from './omr-systems.js';

// Verificados en la documentación oficial (noviembre 2026):
//  - Anthropic (platform.claude.com/docs/en/models/overview): claude-sonnet-5-5 (todos los modelos actuales aceptan imagen).
//  - Gemini (ai.google.dev/gemini-api/docs/models): gemini-3.8-flash (estable).
export const DEFAULT_MODELS = {
  anthropic: 'claude-sonnet-5-5',
  gemini: 'gemini-3.8-flash',
};

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';

/* ------------------------------------------------------------------ prompt */

export const SYSTEM_PROMPT = `You are an expert optical music recognition (OMR) engine for piano sheet music. You read an image of ONE page of a piano score and transcribe it into strict JSON. Output ONLY the JSON object: no markdown fences, no commentary.

JSON schema:
{
  "title": string,            // title printed on the page, or "" if none
  "bpm": number,              // tempo in quarter-note beats per minute (from a tempo marking; if absent, estimate from the Italian term: Adagio 70, Andante 90, Moderato 108, Allegro 130; default 90)
  "timeSig": [number, number],// e.g. [4,4], [3,4], [6,8]
  "keySig": string,           // key signature as major/minor key name: "C","G","D","A","E","B","F#","C#","F","Bb","Eb","Ab","Db","Gb","Cb", minor adds "m": "Am","Em","Dm"... Derive it from the number of sharps/flats printed after the clef.
  "measures": [ { "rh": Event[], "lh": Event[], "pickup": boolean (optional, only if genuinely shorter) } ]
}
Event = { "k": string[], "d": "w"|"h"|"q"|"8"|"16"|"32", "dots": 0|1|2 (optional), "tie": boolean (optional), "f": number[] (optional, same order as k, 1–5 for printed finger numbers and 0 for unmarked notes) }
For a staff with independent voices or notes of unequal duration that overlap, put an empty array in that staff's rh/lh and use "rhTimed" or "lhTimed" in that measure instead. Each item is { "t": number, "b": number, "k": string, "tie": boolean (optional), "f": number (optional) }. "t" is the onset in quarter-note beats from the start of this measure (first beat = 0), "b" is its sounding duration in quarter-note beats within this measure. Give each pitch a separate item. Include sustained bass and inner notes; they must not disappear under running sixteenths. Omit rests in a timed staff. A C held through a half measure starts at 0 with b=2; an E a sixteenth later starts at 0.25. Keep the printed staff and pitches, and indicate the printed fingering where clear.

Rules (follow ALL of them):
1. "rh" is the upper staff (treble clef) and "lh" is the lower staff (bass clef) of the grand staff. Every measure must have both "rh" and "lh" arrays, in left-to-right, top-to-bottom reading order (finish all measures of the first system, then the next system). Include every measure on the page, including a pickup measure and the final one.
2. "k" lists the ACTUAL SOUNDING pitches in the form "<letter><accidental>/<octave>" using lowercase letters, "#" for sharp, "b" for flat, scientific pitch notation where middle C is "c/4". Examples: "c/4", "f#/4", "bb/3", "e/5".
3. Apply the key signature and any accidentals within the measure: if the key signature has F# then every F is "f#" unless cancelled by a natural; an accidental (sharp, flat, natural) on a note affects the same pitch for the rest of that measure (and only that measure unless tied across the barline). Write the resulting real pitch, never the bare letter name.
4. Get the octave right from the clef: treble clef: the bottom line is e/4, the first space above it is f/4, the top line is f/5; middle C (c/4) sits on a ledger line below the staff. Bass clef: the bottom line is g/2, the top line is a/3, the space above the top line is b/3, middle C (c/4) sits on a ledger line above the staff. Watch for ledger lines and for 8va/8vb marks and clef changes mid-piece; write the real sounding pitch.
5. In a sequential staff a chord is ONE event with several entries in "k". Use the timed staff format to preserve independent voices; never discard an inner voice just because it overlaps another.
6. A rest is an event with "k": [] and its duration.
7. "d" is the base note value: w=whole, h=half, q=quarter, 8=eighth, 16=sixteenth, 32=thirty-second. Use "dots" for augmentation dots. Triplets: use the written note value of the triplet notes.
8. A tie (curved line joining two notes of the SAME pitch) is written by setting "tie": true on the SECOND (continuation) event, which must repeat the same pitch(es). Slurs between different pitches are NOT ties; ignore slurs.
9. Every measure on each staff must add up exactly to the time signature (e.g. 4/4 = four quarter-note beats). Check this per staff and per measure before answering; if your first reading does not add up, re-read the measure and fix durations and rests. A whole-measure rest is a rest event with duration equal to the measure (a whole-note rest "w" in 4/4; "h" with dots 1 in 3/4; etc.). The only exception is a pickup (anacrusis) first measure, which may be shorter.
10. Copy clear printed piano finger numbers 1–5 in "f", aligned with their pitches. Do not invent finger numbers. Ignore lyrics, chord symbols, dynamics, pedal marks and page numbers. Do not invent notes. The printed common-time symbol C means 4/4; a struck-through C means 2/2.
11. Repeats: write the music once, as printed. Do not expand repeats.

Example for a piece in G major, 3/4, whose first measure has a treble-clef quarter-note G chord (g/4 + b/4 + d/5), then a quarter rest and a quarter F#, tied into the next measure, with the bass clef playing a dotted half note G (g/2):
{"title":"Example","bpm":100,"timeSig":[3,4],"keySig":"G","measures":[{"rh":[{"k":["g/4","b/4","d/5"],"d":"q"},{"k":[],"d":"q"},{"k":["f#/4"],"d":"q"}],"lh":[{"k":["g/2"],"d":"h","dots":1}]},{"rh":[{"k":["f#/4"],"d":"h","dots":1,"tie":true}],"lh":[{"k":[],"d":"h","dots":1}]}]}

Reply with the JSON object only.`;

/** Texto del mensaje de usuario que acompaña a la imagen de una página. */
export function buildUserPrompt(page, total, previous, fragment) {
  const extra = total > 1
    ? ` This is document page ${page} of ${total}. Transcribe only the music visible on this page. If a new movement begins, use its printed title and markings.`
    : '';
  const context = previous ? ` If markings are absent and this continues the previous movement, use previous meter ${JSON.stringify(previous.timeSig || [4, 4])}, key ${previous.keySig || 'C'} and tempo ${previous.bpm || 90}.` : '';
  const scope = fragment?.count > 1 ? ` This crop contains system ${fragment.index} of ${fragment.count} from the page. Read only the measures visible in this crop. A tie continuation may start in the preceding crop. Do not add any measure outside this image.` : '';
  return `Transcribe this piano score image into the JSON schema described in the instructions.${extra}${scope}${context} Remember: real sounding pitches with the key signature applied, correct octaves for each clef, chords as single events, ties as "tie": true, and every sequential staff summing to the time signature. JSON only.`;
}

const COMPACT_FORMAT = `
For this retry use compact JSON without indentation and with the same title, bpm, timeSig, keySig and measures object fields. Use only rhTimed and lhTimed for the two staves. Instead of objects for timed notes, use tuples [onset,duration,pitch] or [onset,duration,pitch,tie,finger]. tie is 1 for a continuation or 0; finger is 1–5 when printed. Omit optional trailing values when absent. Use decimal quarter-note beats. Do not enumerate rests. Keep every measure and every printed pitch; do not summarize. Example: {"timeSig":[4,4],"measures":[{"rhTimed":[[0.5,0.25,"g/4",0,1]],"lhTimed":[[0,2,"c/4"],[0.25,1.75,"e/4"]]}]}.`;

/* ------------------------------------------------------------------ JSON */

/** Extrae el primer objeto/array JSON de un texto (tolera ```json, texto alrededor, comas finales). */
export function extractJson(text) {
  if (typeof text !== 'string') throw new Error('La respuesta de la IA estaba vacía.');
  let s = text.trim();
  const fence = /```(?:json|JSON)?\s*([\s\S]*?)```/.exec(s);
  if (fence && /[{[]/.test(fence[1])) s = fence[1].trim();
  const candidates = [];
  for (let start = 0; start < s.length; start++) {
    const c = s[start];
    if (c !== '{' && c !== '[') continue;
    const end = findBalanced(s, start);
    if (end > start) candidates.push(s.slice(start, end + 1));
    if (candidates.length) break;
  }
  const tryParse = (t) => {
    try { return JSON.parse(t); } catch (e) { /* reintento abajo */ }
    try { return JSON.parse(t.replace(/,\s*([}\]])/g, '$1')); } catch (e) { return undefined; }
  };
  for (const c of candidates) {
    const v = tryParse(c);
    if (v !== undefined) return v;
  }
  throw new Error('La respuesta de la IA no se pudo leer como partitura (JSON inválido).');
}

function findBalanced(s, start) {
  let depth = 0; let inStr = false; let esc = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '{' || c === '[') depth++;
    else if (c === '}' || c === ']') { depth--; if (depth === 0) return i; }
  }
  return -1;
}

/** Une los resultados por página: metadatos de la primera página que los tenga, compases concatenados. */
export function mergePages(pages, { includeMeasures = true } = {}) {
  const out = { title: '', bpm: undefined, timeSig: undefined, keySig: undefined, measures: [] };
  for (const raw of pages) {
    const p = Array.isArray(raw) ? { measures: raw } : (raw || {});
    if (!out.title && typeof p.title === 'string' && p.title.trim()) out.title = p.title.trim();
    if (out.bpm === undefined && Number(p.bpm) > 0) out.bpm = Number(p.bpm);
    if (!out.timeSig && Array.isArray(p.timeSig) && p.timeSig.length === 2) out.timeSig = p.timeSig;
    if (!out.keySig && typeof p.keySig === 'string' && p.keySig) out.keySig = p.keySig;
    if (includeMeasures && Array.isArray(p.measures)) {
      for (const m of p.measures) {
        if (!m || typeof m !== 'object') continue;
        const [n, d] = out.timeSig || [4, 4];
        const bar = n * 4 / d;
        const hand = (name) => {
          const sequential = Array.isArray(m[name]) ? m[name] : [];
          const timed = m[name + 'Timed'];
          if (!Array.isArray(timed) || !timed.length) return sequential;
          const decoded = timed.map((x) => Array.isArray(x) ? { t: x[0], b: x[1], k: x[2], tie: x[3] === 1, f: x[4] } : x);
          const notes = decoded.filter((x) => x && keyToMidi(x.k) != null && Number.isFinite(x.t) && Number.isFinite(x.b))
            .map((x) => ({ key: x.k.trim().toLowerCase(), start: x.t, dur: x.b, tie: x.tie === true, finger: x.f }));
          const implied = Object.values({ rh: m.rh, lh: m.lh }).map((v) => Array.isArray(v) ? v.reduce((a, e) => a + durBeats(e), 0) : 0);
          const length = m.pickup === true ? Math.min(bar, Math.max(...implied, ...notes.map((x) => x.start + x.dur))) : bar;
          return notes.length ? timedNotesToEvents(notes, length) : sequential;
        };
        out.measures.push({ rh: hand('rh'), lh: hand('lh') });
      }
    }
  }
  if (!out.title) delete out.title;
  if (out.bpm === undefined) delete out.bpm;
  if (!out.timeSig) delete out.timeSig;
  if (!out.keySig) delete out.keySig;
  return out;
}

/* ------------------------------------------------------------------ errores */

export class OmrError extends Error {
  constructor(message, kind) { super(message); this.name = 'OmrError'; this.kind = kind; }
}

const PROVIDER_NAME = { anthropic: 'Anthropic', gemini: 'Gemini' };

function apiDetail(body) {
  try {
    const j = JSON.parse(body);
    return (j.error && (j.error.message || j.error.status)) || '';
  } catch (e) { return ''; }
}

/** Mensaje en español para una respuesta HTTP de error. */
export function mapHttpError(status, provider, body = '') {
  const who = PROVIDER_NAME[provider] || 'el proveedor';
  const detail = apiDetail(body);
  if (status === 401 || status === 403) return new OmrError(`La API key de ${who} no es válida o no tiene permiso. Revisala en Ajustes.`, 'auth');
  if (status === 400 && /api key|API_KEY_INVALID/i.test(body)) return new OmrError(`La API key de ${who} no es válida. Revisala en Ajustes.`, 'auth');
  if (status === 429) return new OmrError(`Se alcanzó el límite de uso de ${who} (demasiadas solicitudes o sin crédito). Esperá un momento y reintentá.`, 'rate');
  if (status === 404 || (status === 400 && /model.+(not found|not supported|not available|does not exist)/i.test(detail))) return new OmrError(`El modelo configurado no está disponible en ${who}. Cambialo en Ajustes.${detail ? ' (' + detail + ')' : ''}`, 'model');
  if (status === 413) return new OmrError('La imagen es demasiado grande para enviar. Probá con una foto de menor resolución.', 'size');
  if (status === 400) return new OmrError(`${who} rechazó la solicitud${detail ? ': ' + detail : ''}.`, 'bad');
  if (status === 529 || status >= 500) return new OmrError(`${who} no está disponible en este momento (error ${status}). Reintentá en unos minutos.`, 'server');
  return new OmrError(`Error inesperado de ${who} (HTTP ${status}).${detail ? ' ' + detail : ''}`, 'http');
}

/* ------------------------------------------------------------------ imágenes */

function sniffType(u8) {
  if (u8[0] === 0xff && u8[1] === 0xd8) return 'image/jpeg';
  if (u8[0] === 0x89 && u8[1] === 0x50) return 'image/png';
  if (u8[0] === 0x47 && u8[1] === 0x49) return 'image/gif';
  if (u8[0] === 0x52 && u8[1] === 0x49 && u8[8] === 0x57) return 'image/webp';
  return '';
}

export function bytesToBase64(u8) {
  let bin = '';
  const CH = 0x8000;
  for (let i = 0; i < u8.length; i += CH) bin += String.fromCharCode.apply(null, u8.subarray(i, i + CH));
  return btoa(bin);
}

/** Blob → { mediaType, data(base64) }. Reduce a ≤ maxSide px y pasa a JPEG si hay canvas (navegador). */
export async function imageToBase64(blob, maxSide = 2000) {
  let work = blob;
  if (typeof createImageBitmap === 'function' && (typeof OffscreenCanvas !== 'undefined' || typeof document !== 'undefined')) {
    try {
      const bmp = await createImageBitmap(blob, { imageOrientation: 'from-image' });
      const k = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
      const w = Math.max(1, Math.round(bmp.width * k)); const h = Math.max(1, Math.round(bmp.height * k));
      let canvas;
      if (typeof OffscreenCanvas !== 'undefined') canvas = new OffscreenCanvas(w, h);
      else { canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h; }
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
      ctx.drawImage(bmp, 0, 0, w, h);
      if (bmp.close) bmp.close();
      const encoded = canvas.convertToBlob
        ? await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.9 })
        : await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.9));
      if (encoded) work = encoded;
    } catch (e) { work = blob; }
  }
  const u8 = new Uint8Array(await work.arrayBuffer());
  const mediaType = sniffType(u8) || work.type || 'image/jpeg';
  return { mediaType, data: bytesToBase64(u8) };
}

/* ------------------------------------------------------------------ proveedores */

export function buildAnthropicRequest({ apiKey, model, image, page, total, previous, fragment }) {
  return {
    url: ANTHROPIC_URL,
    init: {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: 16000,
        system: SYSTEM_PROMPT + (fragment ? COMPACT_FORMAT : ''),
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: image.mediaType, data: image.data } },
            { type: 'text', text: buildUserPrompt(page, total, previous, fragment) },
          ],
        }],
      }),
    },
  };
}

export function buildGeminiRequest({ apiKey, model, image, page, total, previous, fragment }) {
  return {
    url: `${GEMINI_BASE}${encodeURIComponent(model)}:generateContent`,
    init: {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT + (fragment ? COMPACT_FORMAT : '') }] },
        contents: [{
          role: 'user',
          parts: [
            { inline_data: { mime_type: image.mediaType, data: image.data } },
            { text: buildUserPrompt(page, total, previous, fragment) },
          ],
        }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0, maxOutputTokens: 32768 },
      }),
    },
  };
}

/** Texto de la respuesta del proveedor (lanza OmrError si fue cortada o bloqueada). */
export function textFromResponse(provider, json) {
  if (provider === 'anthropic') {
    const text = (json.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
    if (json.stop_reason === 'max_tokens') throw new OmrError('La respuesta de la IA se cortó por ser demasiado larga. Probá con una página con menos compases.', 'truncated');
    if (json.stop_reason === 'refusal') throw new OmrError('La IA rechazó procesar esta imagen.', 'refusal');
    return text;
  }
  const cand = json.candidates && json.candidates[0];
  if (!cand) {
    const br = json.promptFeedback && json.promptFeedback.blockReason;
    throw new OmrError(br ? `Gemini bloqueó la imagen (${br}).` : 'Gemini no devolvió ninguna respuesta.', 'refusal');
  }
  if (cand.finishReason === 'MAX_TOKENS') throw new OmrError('La respuesta de la IA se cortó por ser demasiado larga.', 'truncated');
  return ((cand.content && cand.content.parts) || []).map((p) => p.text || '').join('');
}

async function callProvider(provider, opts, fetchImpl, signal) {
  const build = provider === 'anthropic' ? buildAnthropicRequest : buildGeminiRequest;
  const { url, init } = build(opts);
  let res;
  try {
    res = await fetchImpl(url, { ...init, signal });
  } catch (e) {
    if (e && e.name === 'AbortError') throw new OmrError('Lectura cancelada.', 'abort');
    throw new OmrError('No hay conexión con internet (o el navegador bloqueó la llamada). Verificá tu conexión y reintentá.', 'network');
  }
  const body = await res.text();
  if (!res.ok) throw mapHttpError(res.status, provider, body);
  let json;
  try { json = JSON.parse(body); } catch (e) { throw new OmrError('La respuesta del servidor no se pudo leer.', 'parse'); }
  return textFromResponse(provider, json);
}

/**
 * Lee una o más páginas de partitura con IA.
 * options: { provider, apiKey, model, onProgress, fetchImpl?, signal? }
 */
export async function recognizeScore(images, options = {}) {
  const { provider = 'anthropic', apiKey, onProgress = () => {}, signal } = options;
  const fetchImpl = options.fetchImpl || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
  if (provider !== 'anthropic' && provider !== 'gemini') throw new OmrError('Proveedor de IA desconocido.', 'config');
  if (!apiKey || !String(apiKey).trim()) throw new OmrError('Falta la API key. Cargala en Ajustes.', 'auth');
  if (!images || !images.length) throw new OmrError('No hay imágenes para leer.', 'config');
  if (!fetchImpl) throw new OmrError('Este navegador no soporta llamadas de red.', 'config');
  const model = options.model || DEFAULT_MODELS[provider];
  const key = String(apiKey).trim();

  const pages = [];
  const split = options.splitImage || splitScoreImage;
  for (let i = 0; i < images.length; i++) {
    signal?.throwIfAborted();
    const page = images.pageNumbers?.[i] || i + 1;
    const total = images.totalPages || images.length;
    const label = total > 1 ? ` (página ${page} de ${total})` : '';
    onProgress(`Preparando imagen${label}…`);
    let previous = pages.length ? mergePages(pages, { includeMeasures: false }) : undefined;
    async function read(blob, fragment) {
      signal?.throwIfAborted();
      const image = await imageToBase64(blob);
      signal?.throwIfAborted();
      const suffix = fragment?.count > 1 ? ` · sistema ${fragment.index} de ${fragment.count}` : '';
      onProgress(`Leyendo la partitura con IA${label}${suffix}…`);
      const text = await callProvider(provider, { apiKey: key, model, image, page, total, previous, fragment }, fetchImpl, signal);
      let parsed;
      try { parsed = extractJson(text); } catch {
        throw new OmrError('No se pudo interpretar la respuesta de la IA. Reintentá o probá con una foto más nítida.', 'parse');
      }
      if (Array.isArray(parsed)) parsed = { measures: parsed };
      const withContext = { timeSig: previous?.timeSig, ...parsed };
      if (!validateScore(mergePages([withContext])).ok) {
        throw new OmrError('La IA no encontró notas. Verificá que la página tenga música o elegí otro rango.', 'empty');
      }
      pages.push(parsed);
      previous = {
        timeSig: parsed.timeSig || previous?.timeSig,
        keySig: parsed.keySig || previous?.keySig,
        bpm: parsed.bpm || previous?.bpm,
      };
    }
    try {
      // Los PDFs con muchos sistemas se leen por bandas desde el principio.
      let parts = [];
      if (images.pageNumbers) {
        try { parts = await split(images[i]); } catch { /* la imagen completa sigue disponible */ }
      }
      if (parts.length < 4) {
        try { await read(images[i]); continue; }
        catch (e) {
          if (e.kind !== 'truncated') throw e;
          if (!parts.length && !images.pageNumbers) {
            try { parts = await split(images[i]); } catch { /* reintentar la página en formato compacto */ }
          }
        }
      }
      const chunks = parts.length > 1 ? parts : [images[i]];
      for (let j = 0; j < chunks.length; j++) {
        try { await read(chunks[j], { index: j + 1, count: chunks.length }); }
        catch (e) {
          if (e.kind !== 'truncated') throw e;
          const where = chunks.length > 1 ? ` (sistema ${j + 1} de ${chunks.length})` : '';
          throw new OmrError(`La IA agotó su límite incluso con el formato compacto${where}. Probá con otro modelo en Ajustes o importá una edición MusicXML o MIDI.`, 'truncated');
        }
      }
    } catch (e) {
      throw new OmrError(e.message + label, e.kind);
    }
  }
  onProgress('Armando la partitura…');
  const merged = mergePages(pages);
  const res = validateScore(merged);
  if (!res.ok) throw new OmrError('La IA no encontró notas en la imagen. Probá con una foto más nítida y bien encuadrada.', 'empty');
  return res.score;
}
