// Pasajes (rango de compases), bucle, resumen por compás y sugerencias. Puro, sin DOM.
// Un pasaje es { from, to } en compases base 0, inclusive. Los pasos del pasaje son un subconjunto de buildSteps
// que conserva `i` (índice global) y `measure`: el render sigue usando los índices de la partitura completa.
import { buildSteps } from "./model.js";

const int = (x) => Math.round(Number(x));

/** Normaliza un rango contra la cantidad de compases. null si no es válido. */
export function normRange(r, n) {
  if (!r || !Number.isFinite(Number(r.from)) || !Number.isFinite(Number(r.to)) || !(n > 0)) return null;
  let a = int(r.from), b = int(r.to);
  if (a > b) [a, b] = [b, a];
  a = Math.max(0, Math.min(n - 1, a)); b = Math.max(0, Math.min(n - 1, b));
  return { from: a, to: b };
}
export const isWholeRange = (r, n) => !r || (r.from === 0 && r.to === n - 1);
/** "5–6" o "5" (base 1). */
export function rangeText(r) { return r.from === r.to ? `${r.from + 1}` : `${r.from + 1}–${r.to + 1}`; }

/** Pasos del pasaje: los de `steps` cuyo compás cae en el rango. Conservan i, t, measure, refs. */
export function passageSteps(steps, range) {
  const list = Array.isArray(steps) ? steps : [];
  if (!range) return list.slice();
  return list.filter((s) => s.measure >= range.from && s.measure <= range.to);
}
export function stepsForPassage(score, range, hands = "both") { return passageSteps(buildSteps(score, hands), range); }

/** Pasos desde un compás hasta el final (para "seguir desde…"). */
export const stepsFrom = (steps, measure) => (steps || []).filter((s) => s.measure >= measure);

/** Compás actual y el siguiente; si es el último, el anterior y el actual. */
export function currentPair(measure, n) {
  const m = Math.max(0, Math.min(n - 1, int(measure) || 0));
  if (n <= 1) return { from: 0, to: 0 };
  return m + 1 < n ? { from: m, to: m + 1 } : { from: m - 1, to: m };
}

/**
 * Compases con errores, del que más costó al que menos: [{ measure, errors, dirty }].
 * `dirty` = pasos con error en ese compás; `errors` = notas erradas (si se da stepErrors) o, si no, igual a dirty.
 * Orden: errors desc, dirty desc, compás asc.
 */
export function hardestMeasures(stepResults, steps, stepErrors) {
  const by = new Map();
  (steps || []).forEach((s, k) => {
    const wrong = stepErrors ? (stepErrors[k] || 0) : 0;
    const isDirty = stepResults && stepResults[k] === "dirty";
    if (!isDirty && !wrong) return;
    const e = by.get(s.measure) || { measure: s.measure, errors: 0, dirty: 0 };
    if (isDirty) e.dirty++;
    e.errors += stepErrors ? wrong : (isDirty ? 1 : 0);
    by.set(s.measure, e);
  });
  return [...by.values()].filter((e) => e.errors > 0 || e.dirty > 0)
    .sort((a, b) => b.errors - a.errors || b.dirty - a.dirty || a.measure - b.measure);
}

/** El compás con más errores + el siguiente (o el anterior si es el último). null si no hubo errores. */
export function suggestPassage(stepResults, steps, opts = {}) {
  const h = hardestMeasures(stepResults, steps, opts.stepErrors);
  if (!h.length) return null;
  const n = Number.isFinite(opts.measures) ? opts.measures : Math.max(...(steps || []).map((s) => s.measure)) + 1;
  return currentPair(h[0].measure, n);
}

/** Compases completos (todos sus pasos tocados) sobre los que tienen pasos. `index` = pasos ya completados. */
export function coverage(steps, index) {
  const total = new Map(), done = new Map();
  (steps || []).forEach((s, k) => {
    total.set(s.measure, (total.get(s.measure) || 0) + 1);
    if (k < index) done.set(s.measure, (done.get(s.measure) || 0) + 1);
  });
  let d = 0;
  total.forEach((t, m) => { if ((done.get(m) || 0) >= t) d++; });
  return { measuresDone: d, measuresTotal: total.size };
}

/**
 * Estado por compás para la tira de resultado: "dirty" (algún paso con error), "clean" (todos sus pasos limpios),
 * "none" (no se tocó completo) o "empty" (compás sin notas). Largo = n.
 */
export function measureSummary(stepResults, steps, n) {
  const out = new Array(Math.max(0, n)).fill("empty");
  const cnt = new Array(out.length).fill(0), clean = new Array(out.length).fill(0), dirty = new Array(out.length).fill(0);
  (steps || []).forEach((s, k) => {
    if (s.measure < 0 || s.measure >= out.length) return;
    cnt[s.measure]++;
    if (stepResults && stepResults[k] === "clean") clean[s.measure]++;
    else if (stepResults && stepResults[k] === "dirty") dirty[s.measure]++;
  });
  for (let m = 0; m < out.length; m++) {
    if (!cnt[m]) continue;
    out[m] = dirty[m] ? "dirty" : clean[m] === cnt[m] ? "clean" : "none";
  }
  return out;
}

/** Mano con más errores: counts = { rh, lh }. Empate sin errores → null; empate con errores → "lh" (suele ser la más difícil). */
export function harderHand(counts) {
  const r = (counts && counts.rh) || 0, l = (counts && counts.lh) || 0;
  if (!r && !l) return null;
  return r > l ? "rh" : "lh";
}

/** ¿El rango tiene notas de esa mano? (para ofrecer "probar con una mano"). */
export function handsWithNotes(steps) {
  const has = { rh: false, lh: false };
  (steps || []).forEach((s) => (s.refs || []).forEach((r) => { if (r.hand === "rh" || r.hand === "lh") has[r.hand] = true; }));
  return has;
}

/* ---------- intentos equivalentes ---------- */

/** Clave de equivalencia de un intento: mismo rango, misma mano, bucle o no. Sin rango = pieza entera (datos viejos). */
export function attemptKey(att, n) {
  const r = att && att.range ? normRange(att.range, n) : null;
  const whole = isWholeRange(r, n);
  return [whole ? "all" : `${r.from}-${r.to}`, (att && att.hands) || "both", att && att.loop ? "loop" : "once"].join("|");
}
export const sameKind = (a, b, n) => attemptKey(a, n) === attemptKey(b, n);
export const isComplete = (a) => !!a && (!a.status || a.status === "finished");
/** Intentos equivalentes a `ref` (sin incluirlo si es el mismo objeto). */
export function equivalentAttempts(list, ref, n) { return (list || []).filter((a) => a !== ref && sameKind(a, ref, n)); }
/** Mejor precisión entre intentos equivalentes COMPLETOS; null si no hay. */
export function bestEquivalent(list, ref, n) {
  const c = equivalentAttempts(list, ref, n).filter((a) => isComplete(a) && Number.isFinite(a.accuracy));
  return c.length ? Math.max(...c.map((a) => a.accuracy)) : null;
}

/**
 * La acción principal de la pantalla de resultado (una sola).
 * in: { stepResults, steps, stepErrors, done (pasos completados), status, hands, bpm, measures (n), range, loop }
 * out: { type: "fix"|"continue"|"both-hands"|"faster"|"none", ... }
 */
export function nextAction(a) {
  const n = a.measures, steps = a.steps || [];
  const hard = hardestMeasures(a.stepResults, steps, a.stepErrors);
  if (hard.length) {
    const range = currentPair(hard[0].measure, n);
    return { type: "fix", measure: hard[0].measure, range, title: `El compás ${hard[0].measure + 1} fue el que más te costó`, cta: `Practicar compases ${rangeText(range)}` };
  }
  const finished = a.status === "finished";
  if (!finished) {
    const next = steps[Math.min(a.done || 0, steps.length - 1)];
    if (!(a.done > 0) || !next) return { type: "none" };
    if (a.loop && a.range) return { type: "continue", loop: true, measure: a.range.from, title: "Lo que tocaste salió limpio, pero no completaste una vuelta", cta: `Retomar el bucle ${rangeText(a.range)}` };
    return { type: "continue", measure: next.measure, title: "Lo que tocaste salió limpio, pero falta un tramo", cta: `Seguir desde el compás ${next.measure + 1}` };
  }
  if (a.hands && a.hands !== "both") return { type: "both-hands", title: "Salió limpio. Probá sumar la otra mano", cta: "Probar con ambas manos" };
  const bpm = Math.round(a.bpm || 80);
  return { type: "faster", bpm: Math.min(240, bpm + 4), title: "Salió limpio. Probá un poco más rápido", cta: `Subir el tempo a ♩ ${Math.min(240, bpm + 4)}` };
}

/* ---------- memoria de práctica por partitura ---------- */

/** Devuelve un mapa nuevo con la entrada de `id` actualizada; se conservan las `max` más recientes. */
export function mergePractice(map, id, entry, max = 30) {
  const next = { ...(map || {}), [id]: { ...entry, at: entry.at || Date.now() } };
  const ids = Object.keys(next).sort((p, q) => (next[q].at || 0) - (next[p].at || 0));
  ids.slice(max).forEach((k) => delete next[k]);
  return next;
}
/** La práctica más reciente cuya partitura existe (exists(id) → bool). { id, ...entry } o null. */
export function latestPractice(map, exists = () => true) {
  const ids = Object.keys(map || {}).filter((k) => map[k] && map[k].at && exists(k)).sort((p, q) => map[q].at - map[p].at);
  return ids.length ? { id: ids[0], ...map[ids[0]] } : null;
}
