// Sostener las notas largas (tipo Guitar Hero): lógica pura, sin DOM ni audio.
// 1) holdInfo(score, steps): duración en negras de cada nota de cada paso (con ligaduras, la misma cuenta que usa el reproductor).
// 2) createHoldTracker({ bpm, now }): sigue las notas que se están sosteniendo y dice cuánto falta, si se completó o se soltó antes.
import { keyToMidi, durBeats } from "./model.js";

export const HOLD_MIN_BEATS = 1;     // sólo se evalúan notas de 1 tiempo o más
export const HOLD_TOL_FRAC = 0.15;   // soltar hasta 15 % antes cuenta como completa…
export const HOLD_TOL_MS = 120;      // …o hasta 120 ms antes (vale la más generosa)
export const HOLD_KEEP_MS = 1600;    // cuánto tiempo sigue visible el resultado de una nota ya resuelta

export const HOLD_MODES = ["mostrar", "exigir", "apagado"];
export const HOLD_MODE_NAMES = { mostrar: "Mostrar", exigir: "Exigir", apagado: "Apagado" };
export const normHoldMode = (m) => (HOLD_MODES.includes(m) ? m : "mostrar");

const round = (x) => Math.round(x * 1e6) / 1e6;
const beatMs = (bpm) => 60000 / Math.max(20, Number(bpm) || 80);

/** Cadena de ligaduras de una nota: → { beats (negras), next: { measure, idx } del evento que sigue a la cadena (o null al final de la pieza) }. Misma cuenta que playback.chainBeats. */
function chain(score, mi, hand, idx, key) {
  const get = (m) => ((score.measures[m] || {})[hand] || []);
  let beats = durBeats(get(mi)[idx]), m = mi, i = idx + 1;
  for (;;) {
    let list = get(m);
    if (i >= list.length) { m++; i = 0; if (m >= score.measures.length) return { beats, next: null }; list = get(m); }
    const ev = list[i];
    if (!ev || !ev.tie || !Array.isArray(ev.k) || !ev.k.includes(key)) return { beats, next: ev ? { measure: m, idx: i } : { measure: m, idx: 0 } };
    beats += durBeats(ev); i++;
  }
}

/**
 * Por cada paso, las notas con su duración en negras: → Array (paralelo a `steps`) de [{ midi, hand, beats, t, end, measure, step, ref, endRef }] (ref = posición de la nota en la partitura; endRef = evento que sigue, para dibujar la barra).
 * Una nota ligada suena como una sola (suma las ligaduras). Si dos manos tocan la misma nota, queda la más larga.
 */
export function holdInfo(score, steps) {
  return (steps || []).map((st) => {
    const by = new Map();
    for (const r of st.refs || []) {
      const ev = ((score && score.measures[r.measure]) || {})[r.hand] && score.measures[r.measure][r.hand][r.idx];
      const key = ev && Array.isArray(ev.k) ? ev.k[r.keyIdx] : null;
      const midi = keyToMidi(key);
      if (midi === null || midi === undefined) continue;
      const ch = chain(score, r.measure, r.hand, r.idx, key);
      const beats = round(ch.beats);
      const prev = by.get(midi);
      if (!prev || beats > prev.beats) by.set(midi, { midi, hand: prev && prev.hand === "rh" ? "rh" : r.hand, beats, t: st.t, end: round(st.t + beats), measure: st.measure, step: st.i, ref: { measure: r.measure, hand: r.hand, idx: r.idx, keyIdx: r.keyIdx }, endRef: ch.next ? { measure: ch.next.measure, hand: r.hand, idx: ch.next.idx } : null });
    }
    return [...by.values()].sort((a, b) => a.midi - b.midi);
  });
}

/** Tolerancia (en negras) para dar por completa una nota de `total` negras al tempo `bpm`. */
export function holdTolerance(total, bpm) {
  return Math.max(total * HOLD_TOL_FRAC, HOLD_TOL_MS / beatMs(bpm));
}

/** Texto "faltaba 1 tiempo" / "faltaban 2 tiempos" / "faltaba medio tiempo". */
export function beatsText(b, past = true) {
  const r = Math.round(b * 2) / 2;
  const v = Math.max(0.5, r);
  const num = v === 0.5 ? "medio" : String(v).replace(".", ",");
  const unit = v <= 1 ? "tiempo" : "tiempos";
  const verb = past ? (v <= 1 ? "faltaba" : "faltaban") : (v <= 1 ? "falta" : "faltan");
  return `${verb} ${num} ${unit}`;
}

/**
 * Seguimiento de lo que se sostiene.
 *   press(midi, info, t)   info = { hand, beats, measure?, step?, guided? } (o null). beats < 1 → no se sigue (devuelve null).
 *   release(midi, t)       soltó la tecla (con el pedal pisado no cuenta hasta que se suelte el pedal)
 *   pedal(down, t)         pedal de sustain (CC64)
 *   setBpm(bpm, t)         cambio de tempo en caliente: lo ya transcurrido no cambia
 *   tick(t) → [{ midi, hand, total, elapsed, remaining, fraction, state: "holding"|"done"|"early", ... }]
 * `guided` (micrófono): se anima como guía pero nunca se evalúa (no hay forma de saber cuándo soltó).
 * Tiempos en ms; si se omite t se usa now().
 */
export function createHoldTracker({ bpm = 80, now = () => 0, onResult = null, keepMs = HOLD_KEEP_MS } = {}) {
  let curBpm = bpm, pedalDown = false;
  const recs = new Map();       // midi → registro
  const results = [];           // registros resueltos y evaluables (para el resumen)
  let seq = 0;

  const elapsedAt = (r, t) => (r.endT != null ? r.done : r.acc + Math.max(0, t - r.lastT) / beatMs(curBpm));
  function settle(r, state, t, extra = {}) {
    r.state = state; r.endT = t; r.resolvedAt = t;
    r.done = state === "done" ? r.total : Math.min(r.total, Math.max(0, r.acc + Math.max(0, t - r.lastT) / beatMs(curBpm)));
    Object.assign(r, extra);
    if (!r.guided) { results.push(r); onResult && onResult(view(r, t)); }
  }
  function view(r, t) {
    const el = r.endT != null ? r.done : Math.min(r.total, elapsedAt(r, t));
    return { id: r.id, midi: r.midi, hand: r.hand, total: r.total, elapsed: el, remaining: Math.max(0, r.total - el), fraction: r.total ? Math.min(1, el / r.total) : 1, state: r.state, guided: r.guided, excused: !!r.excused, short: r.state === "early" ? Math.max(0, r.total - el) : 0, measure: r.measure, step: r.step, startT: r.startT, pressed: !r.keyUp };
  }
  function closeByRelease(r, t) {
    const el = Math.min(r.total, elapsedAt(r, t));
    const tol = holdTolerance(r.total, curBpm);
    if (el >= r.total - tol) settle(r, "done", t);
    else if (r.handBusy) settle(r, "done", t, { excused: true });     // soltó para tocar la siguiente con esa mano
    else settle(r, "early", t);
  }

  const api = {
    press(midi, info, t = now()) {
      // la mano que toca otra nota: lo que sostenía con esa mano puede soltarse sin penalizar
      if (info && info.hand) for (const r of recs.values()) if (r.state === "holding" && r.midi !== midi && r.hand === info.hand && (info.step == null || info.step !== r.step)) r.handBusy = true;
      const old = recs.get(midi);
      if (old && old.state === "holding") { if (old.keyUp) settle(old, elapsedAt(old, t) >= old.total - holdTolerance(old.total, curBpm) ? "done" : "early", t); else closeByRelease(old, t); }
      if (!info || !(info.beats >= HOLD_MIN_BEATS - 1e-9)) { if (old) recs.delete(midi); return null; }
      const r = { id: ++seq, midi, hand: info.hand || "rh", total: info.beats, startT: t, lastT: t, acc: 0, state: "holding", keyUp: false, endT: null, done: 0, guided: !!info.guided, measure: info.measure, step: info.step, handBusy: false };
      recs.set(midi, r);
      return view(r, t);
    },
    release(midi, t = now()) {
      const r = recs.get(midi); if (!r || r.state !== "holding" || r.guided) return;
      if (pedalDown) { r.keyUp = true; r.keyUpT = t; return; }
      closeByRelease(r, t);
    },
    pedal(down, t = now()) {
      const was = pedalDown; pedalDown = !!down;
      if (was && !pedalDown) for (const r of recs.values()) if (r.state === "holding" && r.keyUp && !r.guided) closeByRelease(r, t);
    },
    setBpm(b, t = now()) {
      const nb = Math.max(20, Number(b) || curBpm);
      for (const r of recs.values()) if (r.endT == null) { r.acc += Math.max(0, t - r.lastT) / beatMs(curBpm); r.lastT = t; }
      curBpm = nb;
    },
    tick(t = now()) {
      const out = [];
      for (const [midi, r] of [...recs]) {
        if (r.state === "holding" && elapsedAt(r, t) >= r.total) {
          // llegó al final del valor: completa (si ya había soltado la tecla con el pedal, también)
          settle(r, "done", t);
        }
        if (r.state !== "holding" && t - r.resolvedAt > keepMs) { recs.delete(midi); continue; }
        out.push(view(r, t));
      }
      return out;
    },
    get(midi, t = now()) { const r = recs.get(midi); return r ? view(r, t) : null; },
    get active() { return [...recs.values()].some((r) => r.state === "holding"); },
    get bpm() { return curBpm; },
    get pedalDown() { return pedalDown; },
    /** Notas ya resueltas y evaluables (no guiadas). */
    get results() { return results.map((r) => view(r, r.endT)); },
    /** Olvida lo que se estaba sosteniendo (p. ej. al pausar). */
    clearActive() { recs.clear(); },
    reset() { recs.clear(); results.length = 0; pedalDown = false; },
  };
  return api;
}

/** Resumen de una toma: → { total, ok, early, byMeasure: [{ measure, early }] (más soltados primero) }. */
export function summarizeHolds(list) {
  const res = (list || []).filter((x) => x && !x.guided && (x.state === "done" || x.state === "early"));
  const early = res.filter((x) => x.state === "early");
  const by = new Map();
  for (const e of early) if (e.measure != null) by.set(e.measure, (by.get(e.measure) || 0) + 1);
  const byMeasure = [...by.entries()].map(([measure, n]) => ({ measure, early: n })).sort((a, b) => b.early - a.early || a.measure - b.measure);
  return { total: res.length, ok: res.length - early.length, early: early.length, byMeasure };
}

/** "Duraciones: sostuviste completas 5 de 7 notas largas" (null si no hubo notas largas evaluadas). */
export function holdLine(sum) {
  if (!sum || !sum.total) return null;
  return `Duraciones: sostuviste completas ${sum.ok} de ${sum.total} ${sum.total === 1 ? "nota larga" : "notas largas"}`;
}
/** "Donde más soltaste antes: compás 3 (2), compás 5 (1)" (null si no hubo). */
export function holdWeakText(sum, max = 3) {
  const w = ((sum && sum.byMeasure) || []).slice(0, max);
  if (!w.length) return null;
  return `Soltaste antes en: ${w.map((x) => `compás ${x.measure + 1} (${x.early})`).join(", ")}`;
}

/** Evento (misma mano) que sigue a la cadena de ligaduras de la nota `ref` ({ measure, hand, idx, keyIdx }); null al final de la pieza. */
export function endRefOf(score, ref) {
  const ev = ((score && score.measures[ref.measure]) || {})[ref.hand] && score.measures[ref.measure][ref.hand][ref.idx];
  const key = ev && ev.k && ev.k[ref.keyIdx];
  if (!key) return null;
  const ch = chain(score, ref.measure, ref.hand, ref.idx, key);
  return ch.next ? { measure: ch.next.measure, hand: ref.hand, idx: ch.next.idx } : null;
}
