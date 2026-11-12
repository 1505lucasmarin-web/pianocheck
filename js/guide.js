// "Crear con IA" por pasos: hoja guía (tonalidad, compás, tempo, forma, acordes por compás, contorno) y verificador determinista.
// Lógica pura, sin DOM ni red. La llamada a la IA está en compose.js.
import { validateScore, durBeats, keyToMidi } from './model.js';

const MAX_GUIDE_MEASURES = 64;
const LETTER_PC = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
const NAME_PC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** Rangos tocables (MIDI) por mano. Fuera de ellos el verificador pide corregir. */
export const RANGE = { rh: [48, 96], lh: [24, 67] };

/* ------------------------------------------------------------------ prompts */

export const GUIDE_SYSTEM_PROMPT = `You are a music analyst helping a piano student. The user names a piece of music. You write a compact GUIDE SHEET for it, from what you know: key, time signature, tempo, form by sections and the chord progression bar by bar, plus the shape of the melody. You do NOT write the notes. Output ONLY one JSON object: no markdown fences, no commentary.

JSON schema:
{
  "title": string,
  "artist": string,                  // optional
  "keySig": string,                  // "C","G","D","A","E","F","Bb","Eb","Am","Em","Dm"... (minor adds "m")
  "timeSig": [number, number],       // e.g. [4,4], [3,4], [6,8]
  "bpm": number,                     // quarter-note beats per minute
  "form": [ { "name": string, "measures": number } ],     // e.g. intro 4, estrofa 8, estribillo 8
  "measures": [ { "section": string, "chords": string[], "contour": string, "alt": string[] } ]
}
Rules:
1. "measures" has ONE entry per bar of the main, recognizable part of the piece (about 16 to 32 bars, ending at a natural stopping point), in playing order; the sum of "form" measures equals its length.
2. "chords": the chord symbols that sound in that bar, in order, one or two per bar ("C", "Am7", "G/B", "F#dim", "Dsus4"). Use the real harmony of the piece in the key you declare.
3. "contour": a few words in English for the melody of that bar: "starts on 3rd, steps up to 5th", "repeats the same note", "leaps up an octave then falls", "held note", "rest".
4. "alt": pitch names of notes that are NOT in the key or in the bar's chords but are really in the melody there (chromatic notes, borrowed notes), like ["F#","Bb"]. Empty array when there are none.
5. If you do not know the piece confidently enough, or you are not sure which piece it is, do not invent a harmony: answer with {"error": "<reason in Spanish>"}.
6. Web search, if the tool is available, may be used ONLY to look up facts about the piece (key, time signature, tempo, form, chords). Do NOT copy sheet music or lyrics from any page.

Reply with the JSON object only.`;

export const GUIDE_MODE_ADDENDUM = `

GUIDE MODE. The user message supplies a GUIDE SHEET for this piece. Follow it:
- The score has EXACTLY the number of measures of the guide, with the guide's key, time signature and tempo.
- The right-hand melody follows each bar's "contour". Use only notes of the declared key or of that bar's chords, plus the pitches listed in that bar's "alt".
- If an accompaniment is asked for, the left hand plays the chords of each bar (bass notes, fifths, block or broken chords); every note belongs to that bar's chords.
- Keep both hands inside a playable range (right hand C3 to C7, left hand C1 to G4).
- This rule overrides rule 5 (length): the guide fixes how many measures to write.
- If the user message includes PROBLEMS FOUND IN YOUR PREVIOUS ANSWER, fix exactly those and return the COMPLETE corrected JSON again.`;

/** Mensaje de usuario de la hoja guía. */
export function buildGuideUserPrompt(query, artist) {
  const who = artist && String(artist).trim() ? `\nArtist or performer (only to identify which piece it is): ${JSON.stringify(String(artist).trim())}` : '';
  return `Piece requested by the user: ${JSON.stringify(String(query).trim())}${who}\nWrite the guide sheet as the JSON object described in the instructions. JSON only.`;
}

/** Mensaje de usuario de la partitura a partir de la hoja guía. */
export function buildScoreFromGuidePrompt(guide, styleLine, levelLine) {
  return `GUIDE SHEET: ${JSON.stringify(guide)}\n${levelLine}\n${styleLine}\nWrite the arrangement as the JSON object described in the instructions, following the guide sheet bar by bar. Every measure must add up exactly to the time signature. JSON only.`;
}

/** Texto de los problemas para el reintento. */
export function buildRetryPrompt(problems) {
  const lines = problems.slice(0, 12).map((p) => `- ${p.text}`);
  return `PROBLEMS FOUND IN YOUR PREVIOUS ANSWER (checked automatically):\n${lines.join('\n')}\nFix exactly those problems and return the COMPLETE corrected JSON again (all measures). JSON only.`;
}

/* ------------------------------------------------------------------ hoja guía */

const KEY_RE = /^([A-Ga-g])([#b]?)(m|min)?$/;

/** Normaliza el nombre de una tonalidad ("a minor", "Bb", "F#m") → "Am"/"Bb"/"F#m"; null si no se entiende. */
export function normKey(k) {
  const t = String(k || '').trim().replace(/\s+/g, '');
  const m = /^([A-Ga-g])([#b♯♭]?)(m|min|minor|menor)?$/i.exec(t);
  if (!m) return null;
  const acc = m[2] === '♯' ? '#' : m[2] === '♭' ? 'b' : m[2];
  return m[1].toUpperCase() + acc + (m[3] ? 'm' : '');
}

/** Valida y limpia la hoja guía de la IA. → { ok, guide?, error? } */
export function normalizeGuide(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, error: 'no devolvió una hoja guía' };
  if (typeof raw.error === 'string' && raw.error.trim()) return { ok: false, error: raw.error.trim(), refused: true };
  const ms = Array.isArray(raw.measures) ? raw.measures : [];
  if (ms.length < 2) return { ok: false, error: 'la hoja guía no tiene compases' };
  const keySig = normKey(raw.keySig) || 'C';
  let timeSig = [4, 4];
  if (Array.isArray(raw.timeSig) && raw.timeSig.length === 2) {
    const n = Number(raw.timeSig[0]), d = Number(raw.timeSig[1]);
    if (Number.isInteger(n) && n > 0 && n <= 32 && [2, 4, 8, 16].includes(d)) timeSig = [n, d];
  }
  const bpm = Number(raw.bpm);
  const guide = {
    title: typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim().slice(0, 120) : '',
    keySig, timeSig,
    bpm: Number.isFinite(bpm) && bpm > 0 ? Math.min(220, Math.max(30, Math.round(bpm))) : 90,
    form: [],
    measures: ms.slice(0, MAX_GUIDE_MEASURES).map((m) => {
      const o = m && typeof m === 'object' ? m : {};
      const chords = (Array.isArray(o.chords) ? o.chords : typeof o.chords === 'string' ? [o.chords] : []).map((c) => String(c).trim()).filter((c) => c && c.length <= 14).slice(0, 4);
      const alt = (Array.isArray(o.alt) ? o.alt : []).map((a) => String(a).trim()).filter((a) => /^[A-Ga-g][#b]?$/.test(a)).slice(0, 6);
      return { section: String(o.section || '').slice(0, 30), chords, contour: String(o.contour || '').slice(0, 120), alt };
    }),
  };
  if (typeof raw.artist === 'string' && raw.artist.trim()) guide.artist = raw.artist.trim().slice(0, 120);
  if (Array.isArray(raw.form)) guide.form = raw.form.filter((f) => f && typeof f === 'object').map((f) => ({ name: String(f.name || '').slice(0, 30), measures: Math.max(0, Math.round(Number(f.measures) || 0)) })).slice(0, 20);
  return { ok: true, guide };
}

/* ------------------------------------------------------------------ armonía */

const pcOf = (letter, acc) => (((LETTER_PC[letter.toLowerCase()] + (acc === '#' ? 1 : acc === 'b' ? -1 : 0)) % 12) + 12) % 12;

/** Clases de altura (0–11) de un acorde ("C", "Am7", "G/B", "F#dim", "Dsus4", "Bbmaj7"); null si no se entiende. */
export function chordPcs(sym) {
  const t = String(sym || '').trim().replace(/♯/g, '#').replace(/♭/g, 'b');
  const m = /^([A-G])([#b]?)([^/]*)(?:\/([A-G])([#b]?))?$/.exec(t);
  if (!m) return null;
  const root = pcOf(m[1], m[2]);
  const q = m[3].toLowerCase().replace(/[()]/g, '');
  let iv;
  if (/^(dim|o|°)/.test(q)) iv = [0, 3, 6];
  else if (/^(aug|\+)/.test(q)) iv = [0, 4, 8];
  else if (/^sus2/.test(q)) iv = [0, 2, 7];
  else if (/^sus/.test(q)) iv = [0, 5, 7];
  else if (/^(m|min|-)(?!aj)/.test(q)) iv = [0, 3, 7];
  else iv = [0, 4, 7];
  if (/^(dim|o|°)7/.test(q)) iv.push(9);
  else if (/m7b5|ø/.test(q)) { iv = [0, 3, 6, 10]; }
  else if (/maj7|ma7|△|Δ|m7\+/.test(q) || /^maj/.test(q)) iv.push(11);
  else if (/7/.test(q)) iv.push(10);
  if (/6/.test(q)) iv.push(9);
  if (/9/.test(q)) { iv.push(2); if (!/maj9/.test(q) && !/add9/.test(q) && !/m9/.test(q) && !/^9/.test(q)) { /* 9 implica 7 en notación común */ } }
  if (/add9|add2/.test(q)) iv.push(2);
  if (/11|add11/.test(q)) iv.push(5);
  if (/b5|-5/.test(q) && !/m7b5/.test(q)) iv = iv.map((x) => (x === 7 ? 6 : x));
  if (/#5|\+5/.test(q)) iv = iv.map((x) => (x === 7 ? 8 : x));
  const set = new Set(iv.map((x) => (root + x) % 12));
  if (m[4]) set.add(pcOf(m[4], m[5]));
  return set;
}

/** Notas de la escala de una tonalidad (mayor, o menor natural + sensible y sexto grado melódicos). */
export function keyPcs(keySig) {
  const k = normKey(keySig) || 'C';
  const minor = k.endsWith('m');
  const tonic = pcOf(k[0], k[1] === '#' || k[1] === 'b' ? k[1] : '');
  const iv = minor ? [0, 2, 3, 5, 7, 8, 9, 10, 11] : [0, 2, 4, 5, 7, 9, 11];
  return new Set(iv.map((x) => (tonic + x) % 12));
}

const pcName = (pc) => NAME_PC[((pc % 12) + 12) % 12];
const midiLabel = (m) => `${pcName(m)}${Math.floor(m / 12) - 1}`;

/* ------------------------------------------------------------------ verificador */

/**
 * Verificación determinista de la partitura que devolvió la IA, ANTES de normalizarla.
 *  - cada mano de cada compás suma exactamente el compás;
 *  - la cantidad de compases es la de la hoja guía;
 *  - cada nota está en la escala, en los acordes declarados del compás o en su lista "alt";
 *  - rango tocable por mano.
 * @returns {{ok:boolean, problems:{type:'count'|'sum'|'pitch'|'range', measure:number, hand?:string, text:string}[], total:number}}
 */
export function verifyScore(raw, guide, opts = {}) {
  const problems = [];
  const v = validateScore(raw);
  const sc = v.score;
  const bar = (sc.timeSig[0] * 4) / sc.timeSig[1];
  const gm = guide && Array.isArray(guide.measures) ? guide.measures : [];
  const style = opts.style || 'auto';
  if (gm.length && sc.measures.length !== gm.length) {
    problems.push({ type: 'count', measure: 0, text: `The score has ${sc.measures.length} measures but the guide sheet has ${gm.length}. Write exactly ${gm.length}.` });
  }
  if (gm.length && guide.timeSig && (sc.timeSig[0] !== guide.timeSig[0] || sc.timeSig[1] !== guide.timeSig[1])) {
    problems.push({ type: 'count', measure: 0, text: `The time signature must be ${guide.timeSig[0]}/${guide.timeSig[1]} as in the guide sheet.` });
  }
  const scale = guide ? keyPcs(guide.keySig) : null;
  const guideBar = guide && guide.timeSig ? (guide.timeSig[0] * 4) / guide.timeSig[1] : bar;
  sc.measures.forEach((m, i) => {
    const g = gm[i];
    let chordSet = null;
    if (g) {
      chordSet = new Set();
      for (const c of g.chords || []) { const p = chordPcs(c); if (p) p.forEach((x) => chordSet.add(x)); }
      for (const a of g.alt || []) { const mm = /^([A-Ga-g])([#b]?)$/.exec(a); if (mm) chordSet.add(pcOf(mm[1], mm[2])); }
    }
    for (const hand of ['rh', 'lh']) {
      const evs = m[hand];
      if (!evs.length) continue;
      const sum = evs.reduce((a, e) => a + durBeats(e), 0);
      if (Math.abs(sum - guideBar) > 0.01) {
        problems.push({ type: 'sum', measure: i + 1, hand, text: `Measure ${i + 1}, ${hand === 'rh' ? 'right' : 'left'} hand: the events add up to ${Math.round(sum * 1000) / 1000} beats (quarter notes) but the measure needs exactly ${guideBar}.` });
      }
      if (hand === 'lh' && style === 'melodia') continue;
      const bad = [];
      for (const ev of evs) {
        for (const k of ev.k) {
          const mid = keyToMidi(k);
          if (mid == null) continue;
          if (scale && chordSet && !scale.has(mid % 12) && !chordSet.has(mid % 12) && !ev.tie) bad.push(k);
          else if (scale && !chordSet && !scale.has(mid % 12) && !ev.tie) bad.push(k);
          if (mid < RANGE[hand][0] || mid > RANGE[hand][1]) {
            problems.push({ type: 'range', measure: i + 1, hand, text: `Measure ${i + 1}, ${hand === 'rh' ? 'right' : 'left'} hand: ${k} (${midiLabel(mid)}) is outside the playable range ${midiLabel(RANGE[hand][0])} to ${midiLabel(RANGE[hand][1])}.` });
          }
        }
      }
      if (bad.length) {
        const inKey = guide ? `${guide.keySig}${chordSet ? ` and the chords ${(g.chords || []).join(' ') || '(none)'}` : ''}` : '';
        problems.push({ type: 'pitch', measure: i + 1, hand, text: `Measure ${i + 1}, ${hand === 'rh' ? 'right' : 'left'} hand: ${[...new Set(bad)].join(', ')} ${bad.length > 1 ? 'are' : 'is'} not in ${inKey} and not listed in "alt". Use notes of the key or the chords.` });
      }
    }
  });
  return { ok: problems.length === 0, problems: problems.slice(0, 40), total: problems.length };
}

/** Resumen corto en español de lo que el verificador no pudo resolver (para mostrar en Revisión). */
export function problemsSummaryEs(problems) {
  if (!problems || !problems.length) return '';
  const n = (t) => problems.filter((p) => p.type === t).length;
  const parts = [];
  if (n('sum')) parts.push(`${n('sum')} compás${n('sum') > 1 ? 'es' : ''} que no sumaba${n('sum') > 1 ? 'n' : ''} (ya ajustado${n('sum') > 1 ? 's' : ''})`);
  if (n('pitch')) parts.push(`${n('pitch')} compás${n('pitch') > 1 ? 'es' : ''} con notas fuera de la tonalidad o los acordes`);
  if (n('range')) parts.push(`${n('range')} nota${n('range') > 1 ? 's' : ''} fuera de rango`);
  if (n('count')) parts.push('cantidad de compases distinta de la prevista');
  return parts.join(', ');
}
