// Análisis y arreglos deterministas (sin IA, sin DOM) sobre partituras en formato Score.
//  - analyzeScore: mide qué tan exigente es una partitura.
//  - melodyOnly: deja sólo la melodía (mano derecha, voz superior) y la izquierda en silencios.
//  - addAccompaniment / harmonize: deduce acordes (I, IV, V, vi) a partir de la melodía y la tonalidad y escribe la izquierda.
import { keyToMidi, durBeats } from './model.js';
import { fitHand } from './compose.js';

const EPS = 1e-6;
const clone = (x) => JSON.parse(JSON.stringify(x));
const FLAT_KEYS = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm', 'Abm']);
const SHARP_NAMES = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
const FLAT_NAMES = ['c', 'db', 'd', 'eb', 'e', 'f', 'gb', 'g', 'ab', 'a', 'bb', 'b'];
const LETTER_PC = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
const SHARPS_OF = { C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, 'C#': 7, F: 1, Bb: 2, Eb: 3, Ab: 4, Db: 5, Gb: 6, Cb: 7 };
const REL_MAJOR = { Am: 'C', Em: 'G', Bm: 'D', 'F#m': 'A', 'C#m': 'E', 'G#m': 'B', 'D#m': 'F#', Dm: 'F', Gm: 'Bb', Cm: 'Eb', Fm: 'Ab', Bbm: 'Db', Ebm: 'Gb', Abm: 'Cb' };

/** Tónica (clase de altura 0..11) y modo de un keySig tipo "C", "Bb", "F#m". */
function parseKey(keySig) {
  const m = /^([A-G])([#b]?)(m?)$/.exec(String(keySig || 'C'));
  if (!m) return { tonic: 0, minor: false, name: 'C' };
  const tonic = (LETTER_PC[m[1].toLowerCase()] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12;
  return { tonic, minor: m[3] === 'm', name: m[1] + m[2] + m[3] };
}

/** Conjunto de clases de altura de la tonalidad (menor: natural + 6.º y 7.º grados alterados habituales). */
function scalePcs(keySig) {
  const { tonic, minor } = parseKey(keySig);
  const steps = minor ? [0, 2, 3, 5, 7, 8, 9, 10, 11] : [0, 2, 4, 5, 7, 9, 11];
  return new Set(steps.map((s) => (tonic + s) % 12));
}

/** Cantidad de alteraciones de la armadura (0..7). */
function keySigCount(keySig) {
  const { name, minor } = parseKey(keySig);
  const major = minor ? REL_MAJOR[name] : name;
  return major in SHARPS_OF ? SHARPS_OF[major] : 0;
}

const midiOf = (k) => keyToMidi(k);
const soundingEvents = (list) => (Array.isArray(list) ? list : []).filter((e) => e && Array.isArray(e.k) && e.k.length > 0);
const sumBeats = (list) => (Array.isArray(list) ? list : []).reduce((a, e) => a + durBeats(e), 0);
const barBeats = (score) => ((score && score.timeSig ? score.timeSig[0] : 4) * 4) / (score && score.timeSig ? score.timeSig[1] : 4);

/** Largo en negras de un compás: el mayor entre las dos manos (o el compás completo si ambas están vacías). */
function measureLength(m, bar) {
  const l = Math.max(sumBeats(m && m.rh), sumBeats(m && m.lh));
  return l > EPS ? l : bar;
}

/* ------------------------------------------------------------------ análisis */

/**
 * Mide qué tan exigente es una partitura.
 * @param {object} score Score
 * @returns {{range:{min:number|null,max:number|null,span:number,rh:{min:number,max:number}|null,lh:{min:number,max:number}|null},
 *   maxLeap:number, shortestDur:number|null, chordDensity:number, hands:'rh'|'lh'|'both'|'none',
 *   accidentals:number, keySigCount:number, estimated:'sencilla'|'media'|'elaborada'}}
 *   range en MIDI; maxLeap = mayor salto (semitonos) entre notas consecutivas de la melodía (voz superior de la mano derecha);
 *   shortestDur en negras; chordDensity = fracción (0..1) de eventos con 2+ notas; accidentals = notas fuera de la tonalidad.
 */
export function analyzeScore(score) {
  const measures = score && Array.isArray(score.measures) ? score.measures : [];
  const scale = scalePcs(score && score.keySig);
  const lo = { rh: null, lh: null };
  const hi = { rh: null, lh: null };
  let events = 0; let chords = 0; let shortEvents = 0; let shortest = null; let accidentals = 0; let notes = 0;
  const melody = [];
  for (const m of measures) {
    for (const hand of ['rh', 'lh']) {
      for (const ev of soundingEvents(m && m[hand])) {
        const mids = ev.k.map(midiOf).filter((x) => x !== null);
        if (!mids.length) continue;
        if (!ev.tie) {
          events++;
          if (mids.length > 1) chords++;
          if (durBeats(ev) <= 0.25 + EPS) shortEvents++;
          notes += mids.length;
          for (const x of mids) if (!scale.has(x % 12)) accidentals++;
        }
        const d = durBeats(ev);
        if (d > 0 && (shortest === null || d < shortest)) shortest = d;
        const mn = Math.min(...mids); const mx = Math.max(...mids);
        if (lo[hand] === null || mn < lo[hand]) lo[hand] = mn;
        if (hi[hand] === null || mx > hi[hand]) hi[hand] = mx;
        if (hand === 'rh' && !ev.tie) melody.push(mx);
      }
    }
  }
  let maxLeap = 0;
  for (let i = 1; i < melody.length; i++) maxLeap = Math.max(maxLeap, Math.abs(melody[i] - melody[i - 1]));
  const hasR = lo.rh !== null; const hasL = lo.lh !== null;
  const hands = hasR && hasL ? 'both' : hasR ? 'rh' : hasL ? 'lh' : 'none';
  const all = [lo.rh, lo.lh].filter((x) => x !== null);
  const allHi = [hi.rh, hi.lh].filter((x) => x !== null);
  const min = all.length ? Math.min(...all) : null;
  const max = allHi.length ? Math.max(...allHi) : null;
  const chordDensity = events ? Math.round((chords / events) * 1000) / 1000 : 0;
  const ksc = keySigCount(score && score.keySig);

  // Puntaje: cada rasgo suma "exigencia". ≤2 sencilla, ≤5 media, más elaborada.
  let pts = 0;
  const shortRatio = events ? shortEvents / events : 0;           // semicorcheas o más cortas: unas pocas (puntillos) no cuentan
  pts += shortRatio >= 0.3 ? 3 : shortRatio >= 0.12 ? 1 : 0;
  pts += maxLeap > 14 ? 2 : maxLeap > 9 ? 1 : 0;
  pts += chordDensity >= 0.6 ? 2 : chordDensity >= 0.25 ? 1 : 0;
  pts += hands === 'both' ? 1 : 0;
  const accRatio = notes ? accidentals / notes : 0;
  pts += accRatio >= 0.2 ? 2 : accRatio >= 0.05 ? 1 : 0;
  pts += ksc >= 4 ? 1 : 0;
  pts += max !== null && min !== null && max - min > 31 ? 2 : max !== null && min !== null && max - min > 24 ? 1 : 0;
  const estimated = pts <= 2 ? 'sencilla' : pts <= 5 ? 'media' : 'elaborada';
  return {
    range: {
      min, max, span: min !== null ? max - min : 0,
      rh: hasR ? { min: lo.rh, max: hi.rh } : null, lh: hasL ? { min: lo.lh, max: hi.lh } : null,
    },
    maxLeap, shortestDur: shortest, chordDensity, hands, accidentals, keySigCount: ksc, estimated,
  };
}

/* ------------------------------------------------------------------ solo melodía */

/**
 * Deja sólo la mano derecha: los acordes se reducen a su voz superior y la izquierda queda en silencios del largo de cada compás.
 * No modifica el original. Es idempotente: melodyOnly(melodyOnly(s)) es igual a melodyOnly(s).
 * @param {object} score Score
 * @returns {object} Score nuevo
 */
export function melodyOnly(score) {
  const out = clone(score || {});
  const bar = barBeats(out);
  out.measures = (out.measures || []).map((m) => {
    const rh = (m && Array.isArray(m.rh) ? m.rh : []).map((ev) => {
      if (!ev || !Array.isArray(ev.k) || ev.k.length <= 1) return ev;
      let top = 0;
      ev.k.forEach((key, i) => { if ((midiOf(key) ?? -1) > (midiOf(ev.k[top]) ?? -1)) top = i; });
      const e = { ...ev, k: [ev.k[top]] };
      if (Array.isArray(ev.f)) { if (ev.f[top] > 0) e.f = [ev.f[top]]; else delete e.f; }
      return e;
    });
    const len = sumBeats(rh) > EPS ? sumBeats(rh) : measureLength(m, bar);
    return { ...(m || {}), rh, lh: fitHand([], len).events };
  });
  return out;
}

/* ------------------------------------------------------------------ armonía */

const MAJOR_DEGREES = [
  { degree: 'I', root: 0, pcs: [0, 4, 7], prior: 0.25 }, { degree: 'IV', root: 5, pcs: [5, 9, 0], prior: 0.08 },
  { degree: 'V', root: 7, pcs: [7, 11, 2], prior: 0.15 }, { degree: 'vi', root: 9, pcs: [9, 0, 4], prior: 0 },
];
const MINOR_DEGREES = [
  { degree: 'i', root: 0, pcs: [0, 3, 7], prior: 0.25 }, { degree: 'iv', root: 5, pcs: [5, 8, 0], prior: 0.08 },
  { degree: 'V', root: 7, pcs: [7, 11, 2], prior: 0.15 }, { degree: 'VI', root: 8, pcs: [8, 0, 3], prior: 0 },
];

/** Segmentos de armonía de un compás de `len` negras: [{start, beats}]. */
function segmentsFor(score, len, bar, isPickup) {
  if (isPickup) return [];
  const [num, den] = score.timeSig || [4, 4];
  const compound = den === 8 && num >= 6 && num % 3 === 0;
  if (len < bar - EPS) return [{ start: 0, beats: len }];
  if (compound) {
    const n = num / 3; const g = 1.5;
    return Array.from({ length: n }, (_, i) => ({ start: i * g, beats: g }));
  }
  if (bar >= 4 - EPS) return [{ start: 0, beats: bar / 2 }, { start: bar / 2, beats: bar / 2 }];
  return [{ start: 0, beats: bar }];
}

/** Peso de cada clase de altura de la melodía dentro de [s, e) de un compás (el comienzo del segmento pesa más). */
function pcWeights(rh, s, e) {
  const w = new Array(12).fill(0);
  let t = 0;
  for (const ev of rh || []) {
    const d = durBeats(ev);
    const a = Math.max(s, t); const b = Math.min(e, t + d);
    if (ev && Array.isArray(ev.k) && ev.k.length && b > a + EPS) {
      const pcs = ev.k.map(midiOf).filter((x) => x !== null).map((x) => x % 12);
      let wt = (b - a) * (ev.tie ? 0.5 : 1);
      if (t <= s + EPS) wt *= 1.5;
      for (const pc of pcs) w[pc] += wt / pcs.length;
    }
    t += d;
  }
  return w;
}

/**
 * Deduce un acorde por compás o medio compás a partir de la melodía y la tonalidad (grados I, IV, V, vi; en menor i, iv, V, VI).
 * @param {object} score Score
 * @returns {{measure:number, start:number, beats:number, degree:string, root:number, pcs:number[]}[]}
 *   root y pcs son clases de altura 0..11. Los compases con anacrusa inicial no llevan acorde.
 */
export function harmonize(score) {
  const measures = score && Array.isArray(score.measures) ? score.measures : [];
  const bar = barBeats(score);
  const key = parseKey(score && score.keySig);
  const table = (key.minor ? MINOR_DEGREES : MAJOR_DEGREES).map((c) => ({
    ...c, root: (c.root + key.tonic) % 12, pcs: c.pcs.map((p) => (p + key.tonic) % 12),
  }));
  const tonic = table[0];
  const out = [];
  let prev = null; let run = 0;
  const lastIdx = measures.length - 1;
  measures.forEach((m, mi) => {
    const len = measureLength(m, bar);
    const isPickup = mi === 0 && len < bar - EPS && measures.length > 1;
    const segs = segmentsFor(score, len, bar, isPickup);
    segs.forEach((seg, si) => {
      const w = pcWeights(m && m.rh, seg.start, seg.start + seg.beats);
      const total = w.reduce((a, b) => a + b, 0);
      let best = null;
      for (const c of table) {
        const fit = c.pcs.reduce((a, pc) => a + w[pc], 0) / (total || 1);
        let sc = fit + c.prior + (prev && prev.degree === c.degree ? (run >= 2 ? -0.03 * (run - 1) : 0.1) : 0);
        const isLast = mi === lastIdx && si === segs.length - 1;
        if (isLast && c === tonic && c.pcs.some((pc) => w[pc] > 0)) sc += 2;      // cadencia final
        if (!out.length && c === tonic && c.pcs.some((pc) => w[pc] > 0)) sc += 1;    // arranca en la tónica
        if (total === 0 && c === (prev ? table.find((x) => x.degree === prev.degree) : tonic)) sc += 1;   // silencio: se mantiene
        if (!best || sc > best.sc + EPS) best = { sc, c };
      }
      const c = best.c;
      run = prev && prev.degree === c.degree ? run + 1 : 1;
      prev = c;
      out.push({ measure: mi, start: seg.start, beats: seg.beats, degree: c.degree, root: c.root, pcs: c.pcs.slice() });
    });
  });
  return out;
}

const FIGS = [[4, 'w', 0], [3, 'h', 1], [2, 'h', 0], [1.5, 'q', 1], [1, 'q', 0], [0.75, '8', 1], [0.5, '8', 0], [0.25, '16', 0], [0.125, '32', 0]];

/** Parte una duración en negras en figuras (con ligaduras si no entra en una sola). */
function noteEvents(keys, beats) {
  const out = [];
  let left = Math.round(beats * 64);
  while (left >= 8) {
    const f = FIGS.find(([b]) => Math.round(b * 64) <= left);
    const ev = { k: keys.slice(), d: f[1] };
    if (f[2]) ev.dots = f[2];
    if (out.length) ev.tie = true;
    out.push(ev);
    left -= Math.round(f[0] * 64);
  }
  return out;
}

function spell(pc, flats) { return (flats ? FLAT_NAMES : SHARP_NAMES)[pc]; }

/** Mi bemol → "eb/2" etc. para una clase de altura y una octava. */
function keyName(midi, flats) {
  return `${spell(midi % 12, flats)}/${Math.floor(midi / 12) - 1}`;
}

/**
 * Escribe la mano izquierda con un acorde deducido por compás/medio compás. No toca la mano derecha ni modifica el original.
 * @param {object} score Score
 * @param {{pattern?: 'bajo'|'acordes'}} [opts] `bajo` (por defecto): la fundamental en octava grave; `acordes`: tríada en posición fundamental.
 *   Duran lo que dura el segmento (redonda, blanca, blanca con puntillo…).
 * @returns {object} Score nuevo (con la izquierda reemplazada)
 */
export function addAccompaniment(score, opts = {}) {
  const pattern = opts.pattern === 'acordes' ? 'acordes' : 'bajo';
  const out = clone(score || {});
  const bar = barBeats(out);
  const flats = FLAT_KEYS.has(parseKey(out.keySig).name);
  const plan = harmonize(out);
  out.measures = (out.measures || []).map((m, mi) => {
    const len = measureLength(m, bar);
    const chords = plan.filter((c) => c.measure === mi);
    let lh = [];
    if (!chords.length) lh = fitHand([], len).events;
    else {
      for (const c of chords) {
        let keys;
        if (pattern === 'bajo') {
          keys = [keyName(36 + c.root, flats)];                                    // do2..si2
        } else {
          const root = 43 + (((c.root - 43) % 12) + 12) % 12;
          keys = c.pcs.map((pc) => keyName(root + ((pc - c.root + 12) % 12), flats));
        }
        lh.push(...noteEvents(keys, c.beats));
      }
    }
    return { ...(m || {}), lh };
  });
  return out;
}
