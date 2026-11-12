// Toma de una melodía tocada en un piano MIDI: notas y tiempos EXACTOS (en segundos), listos para notesToScore. Lógica pura, sin DOM.
// Formato de nota = el del motor de transcripción: { midi, start, end, velocity } (segundos desde `t0`; velocity 0–1).

const PICKUP_S = 0.6;                                                   // notas hasta 0,6 s antes del primer tiempo = anacrusa (se pegan al 0)

/**
 * createTake({ minDur }) →
 *   begin(ts): marca t0 (instante, en ms, del primer tiempo; sin metrónomo se omite y t0 = primera nota)
 *   noteOn(midi, vel127, ts) / noteOff(midi, ts) / pedal(): ts en ms (performance.now de los eventos MIDI)
 *   finish(ts) → notes[] ordenadas; las que siguen sonando se cierran en `ts`
 *   count: notas abiertas + cerradas hasta ahora
 */
export function createTake({ minDur = 0.03 } = {}) {
  let t0 = null;
  const open = new Map();                                               // midi → { start(ms), velocity }
  const done = [];
  const close = (midi, ts) => {
    const o = open.get(midi); if (!o) return;
    open.delete(midi);
    done.push({ midi, startMs: o.start, endMs: Math.max(ts, o.start), velocity: o.velocity });
  };
  return {
    begin(ts) { t0 = ts; },
    noteOn(midi, vel = 80, ts = 0) {
      if (!Number.isFinite(midi)) return;
      if (open.has(midi)) close(midi, ts);                              // misma tecla sin soltar: la nota anterior termina acá
      open.set(midi, { start: ts, velocity: Math.max(0.05, Math.min(1, vel / 127)) });
    },
    noteOff(midi, ts = 0) { close(midi, ts); },
    get count() { return open.size + done.length; },
    get started() { return t0 != null; },
    /** → { notes, firstMs } */
    finish(ts = 0) {
      for (const m of [...open.keys()]) close(m, ts);
      const all = done.slice().sort((a, b) => a.startMs - b.startMs || a.midi - b.midi);
      const base = t0 != null ? t0 : (all.length ? all[0].startMs : 0);
      const notes = [];
      for (const n of all) {
        let s = (n.startMs - base) / 1000;
        if (s < -PICKUP_S) continue;                                    // ruido de la entrada
        let e = (n.endMs - base) / 1000;
        if (e - s < minDur) continue;
        if (s < 0) { e = e - s; s = 0; }                                // anacrusa: se corre al 0 conservando su duración
        notes.push({ midi: n.midi, start: Math.round(s * 1000) / 1000, end: Math.round(e * 1000) / 1000, velocity: Math.round(n.velocity * 100) / 100 });
      }
      return { notes, firstMs: all.length ? all[0].startMs : null };
    },
  };
}

/* ------------------------------------------------------------------ cuantización de una toma MIDI */
import { quantizeNotes, handSegments, segmentsToMeasures, separateHands, detectKey, spell } from './transcribe-core.js';
import { validateScore } from './model.js';

/**
 * Notas de una toma MIDI → Score con la grilla EXACTA: el tempo es el del metrónomo (o el detectado) y el primer tiempo es `t0`
 * (0 con metrónomo; con la primera nota si no hubo metrónomo). Así el compás no depende de adivinar el acento.
 * Sólo compases de negra (x/4); para otros devuelve null y se usa notesToScore.
 * @param {{midi:number,start:number,end:number,velocity:number}[]} notes
 * @param {{bpm:number, timeSig?:number[], mode?:'melodia'|'dos-manos', title?:string, t0?:number|null}} o
 */
export function takeToScore(notes, o = {}) {
  const ts = Array.isArray(o.timeSig) && o.timeSig.length === 2 ? o.timeSig.map(Number) : [4, 4];
  const bpm = Math.max(30, Math.min(240, Number(o.bpm) || 80));
  if (ts[1] !== 4 || !notes.length) return null;
  const mode = o.mode === 'dos-manos' ? 'dos-manos' : 'melodia';
  const E = 30 / bpm;
  let t0 = o.t0 == null ? Math.min(...notes.map((n) => n.start)) : o.t0;
  if (o.t0 != null) {                                                       // latencia / pulso del que toca: corre la fase al desfase mediano respecto del tiempo más cercano
    const beat = 2 * E, res = notes.map((n) => { const b = (n.start - t0) / beat; return b - Math.round(b); }).sort((a, b) => a - b);
    t0 += res[Math.floor(res.length / 2)] * beat;
  }                                                       // una corchea, en segundos
  const bar = ts[0] * 4;                                                    // semicorcheas por compás
  const onGrid = (gu) => { let odd = 0; for (const n of notes) { const x = 2 * ((n.start - t0) / E); if (Math.abs(((x % 2) + 2) % 2 - 1) < 0.5) odd++; } return odd / notes.length; };
  const gu = notes.length >= 6 && onGrid(1) < 0.06 ? 2 : 1;
  const sep = separateHands(notes, { mode });
  const key = detectKey(notes);
  const grid = { E, t0, warp: () => 0, xb: 0, gu };
  const hands = {};
  for (const h of ['rh', 'lh']) {
    const hn = h === 'rh' ? sep.rh : sep.lh;
    hands[h] = handSegments(quantizeNotes(hn, grid), { gu }).map((sg) => ({ s: sg.s, e: sg.e, keys: sg.midis.map((m) => spell(m, key)) }));
    const last = hands[h][hands[h].length - 1];                             // la última nota se sostiene hasta el final de su tiempo (no deja un silencio de relleno)
    if (last) last.e = Math.max(last.e, Math.ceil(last.e / 4) * 4);
  }
  const lastU = Math.max(1, ...['rh', 'lh'].map((h) => Math.max(0, ...hands[h].map((sg) => sg.e))));
  const nMeasures = Math.max(1, Math.ceil(lastU / bar));
  const measures = Array.from({ length: nMeasures }, () => ({ rh: [], lh: [] }));
  for (const h of ['rh', 'lh']) segmentsToMeasures(hands[h], bar, nMeasures, false).forEach((evs, i) => { measures[i][h] = evs; });
  const v = validateScore({ title: o.title || 'Melodía grabada', bpm: Math.round(bpm), timeSig: ts, keySig: key.keySig, origin: 'grabada', measures });
  const warnings = v.errors.map((e) => 'Validación: ' + e);
  return { score: v.score, info: { seconds: Math.max(...notes.map((n) => n.end)) - t0, bpm, bpmConfidence: 1, key: key.keySig, noteCount: mode === 'melodia' ? sep.rh.length : notes.length, warnings, timeSig: ts, measures: nMeasures, grid: gu === 2 ? '8' : '16', mode } };
}
