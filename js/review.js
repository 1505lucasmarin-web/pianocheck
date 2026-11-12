// Edición de partituras para el profesor (pura, sin DOM). Cada operación recibe la partitura y la referencia a una nota
// { measure, hand, idx, keyIdx } y devuelve { ok, score (copia nueva), ref (selección resultante), warn? } o { ok:false, error }.
// "warn" = { over: tiempos que se pasa el compás }.
import { keyToMidi, midiToKey, durBeats, MAX_COMMENT } from "./model.js";

const EPS = 1e-6;
const clone = (o) => JSON.parse(JSON.stringify(o));
export const DURATIONS = [
  { d: "w", name: "Redonda" }, { d: "h", name: "Blanca" }, { d: "q", name: "Negra" }, { d: "8", name: "Corchea" }, { d: "16", name: "Semicorchea" },
];
const REST_SIZES = [[4, "w", 0], [3, "h", 1], [2, "h", 0], [1.5, "q", 1], [1, "q", 0], [0.75, "8", 1], [0.5, "8", 0], [0.375, "16", 1], [0.25, "16", 0], [0.125, "32", 0]];

export const barLength = (score) => { const ts = (score && score.timeSig) || [4, 4]; return (ts[0] * 4) / ts[1]; };
export const beatsOf = (evs) => (evs || []).reduce((a, e) => a + durBeats(e), 0);
export const isRest = (ev) => !ev || !ev.k || ev.k.length === 0;
export const handName = (h) => (h === "rh" ? "mano derecha" : "mano izquierda");
export const otherHand = (h) => (h === "rh" ? "lh" : "rh");

/** Silencios que suman `beats` (de mayor a menor). */
export function restsFor(beats) {
  const out = [];
  let left = beats;
  while (left > EPS) {
    const s = REST_SIZES.find(([b]) => b <= left + EPS);
    if (!s) break;
    const ev = { k: [], d: s[1] }; if (s[2]) ev.dots = s[2];
    out.push(ev); left -= s[0];
  }
  return out;
}
const mkRest = (d, dots) => { const e = { k: [], d }; if (dots) e.dots = dots; return e; };

function startOf(evs, idx) { let t = 0; for (let i = 0; i < idx; i++) t += durBeats(evs[i]); return t; }
const evsOf = (sc, ref) => sc.measures[ref.measure][ref.hand];
function valid(sc, ref) {
  const m = sc && sc.measures && sc.measures[ref && ref.measure];
  const ev = m && m[ref.hand] && m[ref.hand][ref.idx];
  return !!ev;
}

/** Quita `need` tiempos de silencios a partir de `from`, saltando las notas. Devuelve lo que faltó quitar. */
function absorbRests(evs, from, need) {
  let i = from;
  while (need > EPS && i < evs.length) {
    const e = evs[i];
    if (isRest(e)) {
      const b = durBeats(e);
      if (b <= need + EPS) { evs.splice(i, 1); need -= b; continue; }
      evs.splice(i, 1, ...restsFor(b - need)); need = 0; break;
    }
    i++;
  }
  return need > EPS ? need : 0;
}
function fitWarn(sc, ref, warn) {
  const over = beatsOf(evsOf(sc, ref)) - barLength(sc);
  if (over > EPS) warn.over = Math.round(over * 1000) / 1000;
  return warn.over ? warn : undefined;
}

/** Cambia la duración (y el puntillo) de la nota/evento. El compás se reajusta con silencios o devuelve warn si se pasa. */
export function setDuration(score, ref, d, dots = 0) {
  if (!valid(score, ref)) return { ok: false, error: "No hay nota seleccionada." };
  if (!DURATIONS.some((x) => x.d === String(d))) return { ok: false, error: "Duración no válida." };
  const sc = clone(score), evs = evsOf(sc, ref), ev = evs[ref.idx];
  const old = durBeats(ev);
  ev.d = String(d); if (dots === 1 || dots === 2) ev.dots = dots; else delete ev.dots;
  delete ev.tie;
  const delta = durBeats(ev) - old;
  if (delta < -EPS) evs.splice(ref.idx + 1, 0, ...restsFor(-delta));            // los que siguen no se mueven
  else if (delta > EPS) {
    const over = beatsOf(evs) - barLength(sc);
    if (over > EPS) absorbRests(evs, ref.idx + 1, Math.min(over, delta));
  }
  const warn = fitWarn(sc, ref, {});
  return { ok: true, score: sc, ref: { ...ref }, warn };
}

/**
 * Coloca `ev` en el instante t de la mano. Si lo que ocupa son sólo silencios, los parte; si hay un evento de la misma duración exacta
 * en ese instante, devuelve { merge: idx } (se suma al acorde); si choca con notas, { conflict: true }.
 */
function placeAt(evs, t, ev) {
  const dur = durBeats(ev);
  let s = 0;
  const over = [];
  evs.forEach((e, i) => { const b = durBeats(e); if (s < t + dur - EPS && s + b > t + EPS) over.push({ i, s, b }); s += b; });
  const total = s;
  if (!over.length) {
    const out = evs.slice();
    if (t > total + EPS) out.push(...restsFor(t - total));
    out.push(ev);
    return { evs: out, idx: out.length - 1 };
  }
  if (over.some((o) => !isRest(evs[o.i]))) {
    if (over.length === 1 && Math.abs(over[0].s - t) < EPS && Math.abs(over[0].b - dur) < EPS) return { merge: over[0].i };
    return { conflict: true };
  }
  const first = over[0], last = over[over.length - 1];
  const before = t - first.s, after = last.s + last.b - (t + dur);
  const out = evs.slice(0, first.i);
  if (before > EPS) out.push(...restsFor(before));
  const idx = out.length; out.push(ev);
  if (after > EPS) out.push(...restsFor(after));
  out.push(...evs.slice(last.i + 1));
  return { evs: out, idx };
}

/** Pasa la nota (o el evento entero si tiene una sola nota) a la otra mano, en el mismo instante. */
export function moveHand(score, ref) {
  if (!valid(score, ref)) return { ok: false, error: "No hay nota seleccionada." };
  const sc = clone(score), m = sc.measures[ref.measure];
  const src = m[ref.hand], ev = src[ref.idx];
  if (isRest(ev) || !ev.k[ref.keyIdx]) return { ok: false, error: "Elegí una nota." };
  const to = otherHand(ref.hand), t = startOf(src, ref.idx);
  const key = ev.k[ref.keyIdx], fing = ev.f && ev.f[ref.keyIdx] ? ev.f[ref.keyIdx] : 0;
  const ne = { k: [key], d: ev.d }; if (ev.dots) ne.dots = ev.dots; if (fing) ne.f = [fing];
  const dst = m[to] || (m[to] = []);
  const pl = placeAt(dst, t, ne);
  if (pl.conflict) return { ok: false, error: `En la ${handName(to)} ya hay notas en ese lugar. Pasalas o borralas primero.` };
  let newRef;
  if (pl.merge !== undefined) {
    const tgt = dst[pl.merge];
    if (tgt.k.includes(key)) return { ok: false, error: `La ${handName(to)} ya tiene esa nota.` };
    tgt.k.push(key); if (fing || tgt.f) { tgt.f = tgt.f || new Array(tgt.k.length - 1).fill(0); tgt.f.push(fing); }
    newRef = { measure: ref.measure, hand: to, idx: pl.merge, keyIdx: tgt.k.length - 1 };
  } else { m[to] = pl.evs; newRef = { measure: ref.measure, hand: to, idx: pl.idx, keyIdx: 0 }; }
  if (ev.k.length > 1) { ev.k.splice(ref.keyIdx, 1); if (ev.f) { ev.f.splice(ref.keyIdx, 1); if (!ev.f.some(Boolean)) delete ev.f; } }
  else src[ref.idx] = mkRest(ev.d, ev.dots);
  const warn = fitWarn(sc, newRef, {});
  return { ok: true, score: sc, ref: newRef, warn };
}

/** Digitación 1–5 (0/null la quita) de la nota seleccionada. */
export function setFinger(score, ref, f) {
  if (!valid(score, ref)) return { ok: false, error: "No hay nota seleccionada." };
  const sc = clone(score), ev = evsOf(sc, ref)[ref.idx];
  if (isRest(ev) || !ev.k[ref.keyIdx]) return { ok: false, error: "Elegí una nota." };
  const n = Math.round(Number(f));
  const fs = Array.isArray(ev.f) ? ev.f.slice(0, ev.k.length) : [];
  while (fs.length < ev.k.length) fs.push(0);
  fs[ref.keyIdx] = n >= 1 && n <= 5 ? n : 0;
  if (fs.some(Boolean)) ev.f = fs; else delete ev.f;
  return { ok: true, score: sc, ref: { ...ref } };
}
export const fingerOfRef = (score, ref) => { const ev = valid(score, ref) && evsOf(score, ref)[ref.idx]; return ev && ev.f && ev.f[ref.keyIdx] ? ev.f[ref.keyIdx] : 0; };

/** Sube/baja la altura en semitonos. */
export function shiftPitch(score, ref, semi) {
  if (!valid(score, ref)) return { ok: false, error: "No hay nota seleccionada." };
  const sc = clone(score), ev = evsOf(sc, ref)[ref.idx], m = keyToMidi(ev.k[ref.keyIdx]);
  if (m == null) return { ok: false, error: "Elegí una nota." };
  const nk = midiToKey(Math.max(21, Math.min(108, m + semi)));
  if (ev.k.some((k, j) => j !== ref.keyIdx && k === nk)) return { ok: false, error: "Ese acorde ya tiene esa nota." };
  ev.k[ref.keyIdx] = nk;
  return { ok: true, score: sc, ref: { ...ref } };
}

/** Borra la nota; si era la única, el evento queda como silencio de la misma duración. */
export function deleteNote(score, ref) {
  if (!valid(score, ref)) return { ok: false, error: "No hay nota seleccionada." };
  const sc = clone(score), ev = evsOf(sc, ref)[ref.idx];
  if (isRest(ev)) return { ok: false, error: "Elegí una nota." };
  ev.k.splice(ref.keyIdx, 1);
  if (ev.f) { ev.f.splice(ref.keyIdx, 1); if (!ev.f.some(Boolean)) delete ev.f; }
  if (!ev.k.length) { delete ev.tie; delete ev.f; }
  return { ok: true, score: sc, ref: null };
}

/**
 * Inserta junto al evento seleccionado. where: "before" | "after" (evento nuevo con la misma duración) o "chord" (suma una nota al acorde).
 * rest = true inserta un silencio. La nota nueva copia la altura de la seleccionada (en acorde, una tercera arriba).
 */
export function insertEvent(score, ref, where, { rest = false } = {}) {
  if (!valid(score, ref)) return { ok: false, error: "No hay nota seleccionada." };
  const sc = clone(score), evs = evsOf(sc, ref), cur = evs[ref.idx];
  if (where === "chord") {
    if (rest) return { ok: false, error: "A un acorde se le suman notas, no silencios." };
    if (isRest(cur)) return { ok: false, error: "Elegí una nota." };
    const base = keyToMidi(cur.k[ref.keyIdx]);
    let key = null;
    for (const add of [4, 3, 7, 5, 2, 12, 1]) {
      const k = midiToKey(Math.min(108, base + add));
      if (k && !cur.k.includes(k)) { key = k; break; }
    }
    if (!key) return { ok: false, error: "No se pudo sumar otra nota al acorde." };
    cur.k.push(key);
    if (cur.f) cur.f.push(0);
    return { ok: true, score: sc, ref: { ...ref, keyIdx: cur.k.length - 1 } };
  }
  const ne = rest ? mkRest(cur.d, cur.dots) : { k: [cur.k[ref.keyIdx]], d: cur.d };
  if (!rest && cur.dots) ne.dots = cur.dots;
  const pos = where === "before" ? ref.idx : ref.idx + 1;
  evs.splice(pos, 0, ne);
  const nb = durBeats(ne);
  const over = beatsOf(evs) - barLength(sc);
  if (over > EPS) absorbRests(evs, pos + 1, Math.min(over, nb));
  const sel = where === "before" ? { ...ref, idx: ref.idx + 1 } : { ...ref };
  const next = rest ? sel : { measure: ref.measure, hand: ref.hand, idx: pos, keyIdx: 0 };
  const warn = fitWarn(sc, ref, {});
  return { ok: true, score: sc, ref: next, warn };
}

/** Comentario de un compás (texto corto). Vacío lo borra. */
export function setComment(score, measure, text) {
  if (!score || !score.measures || !score.measures[measure]) return { ok: false, error: "Compás inexistente." };
  const sc = clone(score), t = String(text || "").replace(/\s+/g, " ").trim().slice(0, MAX_COMMENT);
  const cm = { ...(sc.comments || {}) };
  if (t) cm[measure] = t; else delete cm[measure];
  if (Object.keys(cm).length) sc.comments = cm; else delete sc.comments;
  return { ok: true, score: sc, ref: null };
}
/** Marca/desmarca un aviso de importación como revisado. */
export function setReviewed(score, key, on) {
  const sc = clone(score), set = new Set(sc.reviewed || []);
  if (on) set.add(key); else set.delete(key);
  if (set.size) sc.reviewed = [...set]; else delete sc.reviewed;
  return { ok: true, score: sc, ref: null };
}

/* ---------------------- historial deshacer / rehacer ---------------------- */

/** Historial de varios pasos. push(estado) antes de cambiar; undo(actual) / redo(actual) devuelven el estado a restaurar o null. */
export function createHistory(max = 60) {
  let past = [], future = [];
  return {
    push(state) { past.push(clone(state)); if (past.length > max) past.shift(); future = []; },
    undo(cur) { if (!past.length) return null; future.push(clone(cur)); return past.pop(); },
    redo(cur) { if (!future.length) return null; past.push(clone(cur)); return future.pop(); },
    get canUndo() { return past.length > 0; },
    get canRedo() { return future.length > 0; },
    get size() { return past.length; },
    clear() { past = []; future = []; },
  };
}
