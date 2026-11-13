// Avisos de importación (pura): problemas detectables en una partitura leída de foto, PDF o IA.
// Cada aviso: { key, kind: "sum"|"empty"|"leap"|"norm", measure (base 0), hand?, text, reviewed }.
import { keyToMidi } from "./model.js";
import { beatsOf, isRest, barLength } from "./review.js";

const EPS = 1e-6;
export const LEAP_SEMITONES = 24;                       // más de 2 octavas entre notas seguidas de una mano
const HAND = { rh: "mano derecha", lh: "mano izquierda" };
const KIND_ORDER = { sum: 0, norm: 1, empty: 2, leap: 3 };
const num = (x) => String(Math.round(x * 100) / 100).replace(".", ",");
const tiempos = (x) => `${num(x)} ${Math.abs(x - 1) < EPS ? "tiempo" : "tiempos"}`;

/** Partituras que vienen de foto, imágenes, PDF o IA (las únicas a las que se les buscan avisos). */
export const needsImportCheck = (score) => !!(score && ["foto", "imagenes", "pdf", "ia"].includes(score.origin));

/** `warnings` = errores que devolvió validateScore ("Compás 3 rh[1]: …"): marcan compases que hubo que normalizar. */
export function detectIssues(score, { warnings = [] } = {}) {
  const out = [];
  const ms = (score && score.measures) || [];
  const bar = barLength(score || {});
  const hasNotes = { rh: false, lh: false };
  ms.forEach((m) => ["rh", "lh"].forEach((h) => { if ((m[h] || []).some((e) => !isRest(e))) hasNotes[h] = true; }));
  const pickup = score && score.pickupBeats > 0;   // anacrusa declarada: el primer compás no suma el compás completo
  ms.forEach((m, mi) => {
    const withNotes = { rh: (m.rh || []).some((e) => !isRest(e)), lh: (m.lh || []).some((e) => !isRest(e)) };
    for (const h of ["rh", "lh"]) {
      const evs = m[h] || [];
      if (evs.length && !(pickup && mi === 0)) {
        const total = beatsOf(evs);
        if (Math.abs(total - bar) > EPS) out.push({ kind: "sum", measure: mi, hand: h, text: `Compás ${mi + 1}, ${HAND[h]}: suma ${tiempos(total)} y el compás indica ${tiempos(bar)}.` });
      }
      if (!withNotes[h] && withNotes[h === "rh" ? "lh" : "rh"] && hasNotes[h]) out.push({ kind: "empty", measure: mi, hand: h, text: `Compás ${mi + 1}: la ${HAND[h]} está vacía y la otra mano sí toca.` });
    }
  });
  for (const h of ["rh", "lh"]) {
    let prev = null;
    ms.forEach((m, mi) => {
      for (const ev of m[h] || []) {
        if (isRest(ev)) continue;
        const midis = ev.k.map(keyToMidi).filter((x) => x != null);
        if (!midis.length) continue;
        const cur = { lo: Math.min(...midis), hi: Math.max(...midis) };
        if (prev && Math.abs(cur.hi - prev.hi) > LEAP_SEMITONES && Math.abs(cur.lo - prev.lo) > LEAP_SEMITONES && !out.some((o) => o.kind === "leap" && o.measure === mi && o.hand === h))
          out.push({ kind: "leap", measure: mi, hand: h, text: `Compás ${mi + 1}, ${HAND[h]}: salto de más de 2 octavas entre notas seguidas. ¿Está bien leída la altura?` });
        prev = cur;
      }
    });
  }
  const seen = new Set();
  for (const w of warnings || []) {
    const mm = /^Compás (\d+)/.exec(String(w));
    if (!mm) continue;
    const mi = Number(mm[1]) - 1;
    if (mi < 0 || mi >= ms.length || seen.has(mi)) continue;
    seen.add(mi);
    out.push({ kind: "norm", measure: mi, text: `Compás ${mi + 1}: hubo que corregirlo al leerlo (${String(w).replace(/^Compás \d+\s*(rh|lh)?(\[\d+\])?:?\s*/, "").slice(0, 90) || "datos inválidos"}).` });
  }
  const done = new Set((score && score.reviewed) || []);
  return out
    .map((o) => ({ ...o, key: `${o.kind}:${o.measure}${o.hand ? ":" + o.hand : ""}` }))
    .map((o) => ({ ...o, reviewed: done.has(o.key) }))
    .sort((a, b) => a.measure - b.measure || KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || String(a.hand).localeCompare(String(b.hand)));
}
export const pendingIssues = (list) => (list || []).filter((x) => !x.reviewed);
