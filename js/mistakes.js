// Errores que se repiten en una toma (puro, sin DOM). Agrupa las notas erradas por par "esperada → tocada" sin importar la octava.
import { midiName } from "./model.js";

/** Nombre de la clase de altura (0–11) en español con ♯, sin octava: 1 → "Re♯". */
const pcName = (pc) => midiName(60 + pc).replace(/-?\d+$/, "").replace("#", "♯");

/** Lista en español: ["2"] → "2"; ["2","5"] → "2 y 5"; ["2","5","7"] → "2, 5 y 7". */
function joinList(xs) {
  if (xs.length <= 1) return xs.join("");
  return `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}`;
}

/** Pista de dirección según la distancia en semitonos (played − expected). "" si no hay una forma clara. */
function distanceHint(d) {
  if (!Number.isInteger(d) || d === 0) return "";
  const up = d > 0, a = Math.abs(d), where = up ? "arriba" : "abajo";
  if (a === 1) return `Te vas medio tono ${where}`;
  if (a === 2) return `Te vas un tono ${where}`;
  if (a === 12) return `Te vas una octava ${where}`;
  return `Te vas ${a} semitonos ${where}`;
}

/**
 * misses: [{ measure (base 0), expected (midi de la nota esperada más cercana), played (midi tocado) }]
 * Devuelve hasta `limit` pares repetidos (2 o más veces), del más frecuente al menos frecuente (empate: el primero que apareció):
 * [{ expected, played (clases de altura 0–11), count, measures (base 1, únicos, ordenados), hint, text }]
 */
export function summarizeMistakes(misses, { limit = 3 } = {}) {
  const groups = new Map();
  let order = 0;
  for (const x of misses || []) {
    if (!x || !Number.isInteger(x.expected) || !Number.isInteger(x.played) || !Number.isInteger(x.measure)) continue;
    const expected = ((x.expected % 12) + 12) % 12, played = ((x.played % 12) + 12) % 12;
    const key = `${expected}>${played}`;
    let g = groups.get(key);
    if (!g) { g = { expected, played, count: 0, first: order++, measures: new Set(), dists: new Set() }; groups.set(key, g); }
    g.count++;
    g.measures.add(x.measure + 1);
    g.dists.add(x.played - x.expected);
  }
  const items = [...groups.values()].filter((g) => g.count >= 2)
    .sort((p, q) => q.count - p.count || p.first - q.first)
    .slice(0, Math.max(0, limit))
    .map((g) => {
      const measures = [...g.measures].sort((p, q) => p - q);
      const played = pcName(g.played), expected = pcName(g.expected);
      const where = measures.length === 1 ? `compás ${joinList(measures.map(String))}` : `compases ${joinList(measures.map(String))}`;
      const hint = g.dists.size === 1 ? distanceHint([...g.dists][0]) : "";
      return { expected: g.expected, played: g.played, count: g.count, measures, hint, text: `Tocás ${played} en lugar de ${expected} (${g.count} veces, ${where})` };
    });
  return items;
}

/** Compases (base 0, únicos, ordenados) donde pasó alguno de los errores de `items`. */
export function measuresToPractice(items) {
  const set = new Set();
  for (const it of items || []) for (const m of it.measures || []) set.add(m - 1);
  return [...set].sort((p, q) => p - q);
}

/** Agrupa compases consecutivos en rangos: [1,2,3,7] → [{from:1,to:3},{from:7,to:7}]. */
export function groupRanges(measures) {
  const xs = [...new Set(measures || [])].sort((p, q) => p - q);
  const out = [];
  for (const m of xs) {
    const last = out[out.length - 1];
    if (last && m === last.to + 1) last.to = m;
    else out.push({ from: m, to: m });
  }
  return out;
}
