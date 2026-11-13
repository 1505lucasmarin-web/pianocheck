// Resumen de práctica para el profesor (texto corto, puro). Compara sólo intentos equivalentes (mismo pasaje, mano, bucle y modo).
import { sameKind, isComplete, rangeText, normRange, isWholeRange } from "./passage.js";
import { trendText, MODE_NAMES } from "./timing.js";

/** Intentos equivalentes a `att` (incluido él mismo si está en la lista): { count, best, last }. */
export function compareAttempts(attempts, att, n) {
  const same = (a) => a === att || (a.id && a.id === att.id);
  const eq = (attempts || []).filter((a) => same(a) || sameKind(a, att, n));
  if (!eq.some(same)) eq.push(att);
  eq.sort((p, q) => (p.at || 0) - (q.at || 0));
  const full = eq.filter((a) => isComplete(a) && Number.isFinite(a.accuracy));
  return { count: eq.length, best: full.length ? Math.max(...full.map((a) => a.accuracy)) : null, last: Number.isFinite(eq[eq.length - 1].accuracy) ? eq[eq.length - 1].accuracy : null };
}

const plural = (n, a, b) => (n === 1 ? a : b);
const handText = (h) => (h === "rh" ? "mano derecha" : h === "lh" ? "mano izquierda" : "ambas manos");

/** Texto de "dónde se repitieron los errores": weak = [{ measure (base 0), errors }]. */
export function weakText(weak, mode) {
  const w = (weak || []).filter((x) => x && x.errors > 0).slice(0, 3);
  if (!w.length) return mode === "pulso" ? "Pulso parejo en todos los compases" : "Sin errores";
  const items = w.map((x) => `compás ${x.measure + 1} (${x.errors} ${mode === "pulso" ? plural(x.errors, "paso", "pasos") : plural(x.errors, "error", "errores")})`);
  const repeated = w.some((x) => x.errors >= 2);
  return `${mode === "pulso" ? "Pulso flojo en" : repeated ? "Errores repetidos en" : "Errores en"}: ${items.join(", ")}`;
}

/**
 * in: { title, n (compases), att (intento), attempts (todos los de la partitura), task? { text } }
 * att: { accuracy, status, hands, range, loop, bpm, mode, measuresDone, measuresTotal, weak, trendMs, hits, onTimePct }
 */
export function buildSummary({ title, n, att, attempts = [], task = null }) {
  const mode = att.mode === "pulso" ? "pulso" : "espera";
  const r = att.range ? normRange(att.range, n) : null;
  const rangeLabel = r && !isWholeRange(r, n) ? `compases ${rangeText(r)} de ${n}` : "pieza entera";
  const lines = ["PianoCheck · Resumen de práctica", `Pieza: ${title || "Sin título"}`];
  lines.push(`Pasaje: ${rangeLabel}${att.loop ? " (en bucle)" : ""} · ${handText(att.hands)}`);
  lines.push(`Tempo: ♩ ${att.bpm || "—"} · Modo: ${MODE_NAMES[mode]}`);
  if (att.measuresTotal) lines.push(`Compases completos: ${att.measuresDone || 0} de ${att.measuresTotal}`);
  if (mode === "pulso") {
    lines.push(`Notas correctas: ${att.accuracy}%${att.onTimePct != null ? ` · A tiempo: ${att.onTimePct}%` : ""}${att.omitted ? ` · Omitidas: ${att.omitted}` : ""}`);
    const t = trendText({ hit: att.hits == null ? 3 : att.hits, trendMs: att.trendMs == null ? null : att.trendMs });
    if (t) lines.push(`Tendencia: ${t}`);
  } else lines.push(`Precisión: ${att.accuracy}%${att.status && att.status !== "finished" ? " (sesión sin terminar)" : ""}`);
  lines.push(weakText(att.weak, mode));
  if (Array.isArray(att.mistakes) && att.mistakes.length) { lines.push("Errores que se repiten:"); att.mistakes.forEach((t) => lines.push(`- ${t}`)); }
  const c = compareAttempts(attempts, att, n);
  lines.push(c.count <= 1 ? "Es el primer intento de este tipo." : `${c.count} intentos de este tipo; mejor ${c.best == null ? "—" : c.best + "%"}, último ${c.last}%`);
  if (task && task.text) lines.push(`Consigna: ${task.text}`);
  return lines.join("\n");
}
