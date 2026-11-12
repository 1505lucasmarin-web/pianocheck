// Tareas para la clase: archivo .pianocheck (JSON con versión, partitura completa y consigna). Puro, sin DOM.
// El archivo sólo lleva la partitura y la tarea: nunca API keys, ajustes ni historial.
import { validateScore } from "./model.js";
import { fromJSON as parseAnnotations } from "./annotations.js";
import { normRange, rangeText } from "./passage.js";
import { normMode, MODE_NAMES } from "./timing.js";

export const TASK_FORMAT = "pianocheck";
export const TASK_VERSION = 1;
export const TASK_EXT = ".pianocheck";
export const MAX_TASK_BYTES = 1.5 * 1024 * 1024;     // tamaño máximo del archivo
export const MAX_TASK_MEASURES = 500;
export const MAX_TASK_TEXT = 400;
const HANDS = ["both", "rh", "lh"];

function hash(str) {                                   // FNV-1a de 32 bits: id estable para que importar dos veces la misma tarea no la duplique
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36);
}

/** Normaliza los datos de la tarea: rango (null = pieza entera), mano, tempo, modo y consigna. */
export function normTask(raw, n) {
  const t = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const r = normRange({ from: t.from, to: t.to }, n);
  const whole = !r || (r.from === 0 && r.to === n - 1);
  const bpm = Number(t.bpm);
  return {
    from: whole ? null : r.from, to: whole ? null : r.to,
    hands: HANDS.includes(t.hands) ? t.hands : "both",
    bpm: Number.isFinite(bpm) && bpm > 0 ? Math.min(240, Math.max(30, Math.round(bpm))) : null,
    mode: normMode(t.mode),
    text: typeof t.text === "string" ? t.text.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").replace(/[ \t]+/g, " ").trim().slice(0, MAX_TASK_TEXT) : "",
  };
}

/** "Compases 5–8 · mano izquierda · ♩ 56 · A pulso" */
export function describeTask(task, n) {
  const range = task.from == null ? "Pieza entera" : `Compases ${rangeText({ from: task.from, to: task.to })}`;
  const hand = task.hands === "rh" ? "mano derecha" : task.hands === "lh" ? "mano izquierda" : "ambas manos";
  return [range, hand, task.bpm ? `♩ ${task.bpm}` : "", MODE_NAMES[task.mode] || ""].filter(Boolean).join(" · ");
}

/** Objeto del archivo. La partitura se limpia con validateScore y se le saca lo que no hace falta (id, origen, avisos revisados). */
export const MAX_TASK_ANNOTATIONS_BYTES = 600 * 1024;   // las anotaciones a mano viajan en la tarea si entran en este tamaño
export function buildTaskFile({ score, task, annotations = null, now = Date.now() }) {
  const v = validateScore(score);
  if (!v.ok) throw new Error("La partitura no tiene notas.");
  const sc = JSON.parse(JSON.stringify(v.score));
  delete sc.id; delete sc.origin; delete sc.reviewed;
  const out = { format: TASK_FORMAT, version: TASK_VERSION, kind: "task", createdAt: now, score: sc, task: normTask(task, sc.measures.length) };
  if (annotations && Array.isArray(annotations.marks) && annotations.marks.length && JSON.stringify(annotations).length <= MAX_TASK_ANNOTATIONS_BYTES) {
    const marks = annotations.marks.filter((m) => m && m.measure < sc.measures.length);
    if (marks.length) out.annotations = { ...annotations, marks };
  }
  return out;
}
export const serializeTask = (obj) => JSON.stringify(obj);
export function taskFileName(title) {
  const base = String(title || "tarea").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9 _-]+/g, "").trim().replace(/\s+/g, "-").slice(0, 40) || "tarea";
  return `Tarea-${base}${TASK_EXT}`;
}

/**
 * Valida estrictamente el contenido de un archivo .pianocheck (texto o bytes).
 * → { ok:true, score, task, id } | { ok:false, error }. Ignora campos de más; rechaza versión desconocida, datos corruptos y archivos enormes.
 */
export function parseTaskFile(input, { maxBytes = MAX_TASK_BYTES } = {}) {
  const fail = (error) => ({ ok: false, error });
  let text = input;
  if (typeof text !== "string") {
    try { text = new TextDecoder("utf-8", { fatal: true }).decode(input); } catch (e) { return fail("El archivo no se puede leer: no es una tarea de PianoCheck."); }
  }
  if (text.length > maxBytes) return fail("El archivo es demasiado grande para ser una tarea de PianoCheck.");
  let obj;
  try { obj = JSON.parse(text); } catch (e) { return fail("El archivo está dañado o no es una tarea de PianoCheck."); }
  if (!obj || typeof obj !== "object" || Array.isArray(obj) || obj.format !== TASK_FORMAT || obj.kind !== "task") return fail("Ese archivo no es una tarea de PianoCheck.");
  if (!Number.isInteger(obj.version) || obj.version < 1) return fail("El archivo tiene una versión desconocida.");
  if (obj.version > TASK_VERSION) return fail("La tarea es de una versión más nueva de PianoCheck. Actualizá la app y probá de nuevo.");
  if (!obj.score || typeof obj.score !== "object" || !Array.isArray(obj.score.measures)) return fail("La tarea no trae una partitura válida.");
  if (obj.score.measures.length > MAX_TASK_MEASURES) return fail("La partitura de la tarea es demasiado larga.");
  const v = validateScore(obj.score);
  if (!v.ok) return fail("La partitura de la tarea está dañada o no tiene notas.");
  const score = v.score;
  delete score.origin; delete score.reviewed;
  const task = normTask(obj.task, score.measures.length);
  const id = "t" + hash(JSON.stringify(score.measures) + "|" + score.title + "|" + task.text);
  score.id = id;
  let annotations = null;   // anotaciones a mano opcionales: si están dañadas se ignoran (la tarea igual se abre)
  if (obj.annotations) { const r = parseAnnotations(obj.annotations); if (r.ok && r.store.count()) annotations = r.store.toJSON(); }
  return { ok: true, score, task, id, annotations };
}
