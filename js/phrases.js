// Detección de frases que se repiten. Puro, sin DOM.
//
// findPhrases(score) → Phrase[]
//   Phrase = { id, label, startMeasure, endMeasure /* inclusive, base 0 */, repeatOf /* id de la primera aparición o null */,
//              exact /* true: igual a la primera aparición (o es la primera) */, variation /* null | "end" | "rhythm" | "some" */ }
//
// Algoritmo
//  1. Firma por compás de la mano derecha (melodía; si la derecha no tiene notas en toda la pieza, la izquierda):
//     secuencia de (inicio en negras, alturas MIDI, duración, ligadura).
//  2. Ventanas de L compases (L ∈ 4, 2, 8, 1). Dos ventanas "se parecen" si son iguales (exacta) o variantes (′):
//     ≥75% de compases iguales, o igual salvo el último compás, o misma secuencia de alturas con otro ritmo.
//     Una ventana es candidata si tiene pareja que no se solape con ella (las de 1 compás necesitan 2 parejas: 3+ apariciones).
//  3. Para cada longitud, programación dinámica sobre los compases: ventanas sin solaparse que maximizan
//     (a) compases cubiertos y, a igualdad, (b) compases con pareja exacta. Se descartan las ventanas que quedan
//     sin pareja entre las elegidas y se repite. Se usa una sola longitud por pieza: la que más compases cubre
//     (empate → 4, luego 2, luego 8, luego 1).
//  4. Las ventanas se agrupan en familias por orden de aparición; una familia de una sola ventana no es frase.
//     Letras A, B, C… por orden de aparición; las variantes llevan ′ (A′).
import { keyToMidi, durBeats } from "./model.js";

const LENGTHS = [4, 2, 8, 1];
const r6 = (x) => Math.round(x * 1e6) / 1e6;

function measureInfo(m, hand) {
  const evs = (m && Array.isArray(m[hand])) ? m[hand] : [];
  let t = 0, has = false;
  const parts = [], pitches = [];
  for (const ev of evs) {
    const mids = ((ev && ev.k) || []).map(keyToMidi).filter((x) => x !== null).sort((a, b) => a - b);
    parts.push(`${r6(t)}:${mids.join(",")}:${r6(durBeats(ev))}${ev && ev.tie ? "t" : ""}`);
    if (mids.length) { has = true; if (!ev.tie) pitches.push(mids.join(",")); }
    t += durBeats(ev);
  }
  return { sig: parts.join("|"), pitches: pitches.join(";"), has };
}

export function findPhrases(score) {
  const ms = (score && Array.isArray(score.measures)) ? score.measures : [];
  const n = ms.length;
  if (n < 2) return [];
  let hand = "rh";
  if (!ms.some((m) => measureInfo(m, "rh").has)) hand = "lh";
  const info = ms.map((m) => measureInfo(m, hand));
  if (!info.some((x) => x.has)) return [];

  const usable = (i, L) => info.slice(i, i + L).filter((x) => x.has).length * 2 >= L;

  /** null | { exact, variation } */
  function sim(i, j, L) {
    let eq = 0;
    for (let k = 0; k < L; k++) if (info[i + k].sig === info[j + k].sig) eq++;
    if (eq === L) return { exact: true, variation: null };
    const lastDiffers = info[i + L - 1].sig !== info[j + L - 1].sig;
    if (L > 1 && eq === L - 1 && lastDiffers) return { exact: false, variation: "end" };
    if (eq / L >= 0.75) return { exact: false, variation: "some" };
    const pa = info.slice(i, i + L).map((x) => x.pitches).join("/"), pb = info.slice(j, j + L).map((x) => x.pitches).join("/");
    if (pa && pa === pb) return { exact: false, variation: "rhythm" };
    return null;
  }

  // candidatas por longitud
  const cand = {}; // L → Map(i → {exactPartner})
  for (const L of LENGTHS) {
    const mp = new Map();
    if (n >= 2 * L + (L === 1 ? 1 : 0)) {
      for (let i = 0; i + L <= n; i++) {
        if (!usable(i, L)) continue;
        let partners = 0, exact = false;
        for (let j = 0; j + L <= n; j++) {
          if (Math.abs(i - j) < L || !usable(j, L)) continue;
          const s = sim(i, j, L);
          if (s) { partners++; if (s.exact) exact = true; }
        }
        if (partners >= (L === 1 ? 2 : 1)) mp.set(i, { exact });
      }
    }
    cand[L] = mp;
  }

  const better = (a, b) => { for (let k = 0; k < 2; k++) { if (a[k] !== b[k]) return a[k] > b[k]; } return false; };

  function select(LS) {
    const best = [[0, 0]], from = [null];
    for (let p = 1; p <= n; p++) {
      best[p] = best[p - 1]; from[p] = { skip: true };
      for (const L of LS) {
        const c = p - L >= 0 ? cand[L].get(p - L) : null;
        if (!c) continue;
        const b = best[p - L];
        const v = [b[0] + L, b[1] + (c.exact ? L : 0)];
        if (better(v, best[p])) { best[p] = v; from[p] = { L }; }
      }
    }
    const out = [];
    for (let p = n; p > 0;) { const f = from[p]; if (f.skip) p--; else { out.push({ start: p - f.L, L: f.L }); p -= f.L; } }
    return out.reverse();
  }

  // una sola longitud por pieza: la que más compases cubre (empate → 4, 2, 8, 1)
  let chosen = [], bestCover = 0;
  for (const L of LENGTHS) {
    let sel = select([L]);
    for (let iter = 0; iter < 12; iter++) {
      const drop = sel.filter((w) => !sel.some((o) => o !== w && Math.abs(o.start - w.start) >= L && sim(w.start, o.start, L)));
      if (!drop.length) break;
      drop.forEach((w) => cand[L].delete(w.start));
      sel = select([L]);
    }
    const cover = sel.length * L;
    if (cover > bestCover) { bestCover = cover; chosen = sel; }
  }

  // familias por orden de aparición
  const fams = [];
  for (const w of chosen) {
    let placed = null;
    for (const f of fams) {
      if (f.L !== w.L) continue;
      const s = sim(f.members[0].start, w.start, w.L);
      if (s) { placed = { f, s }; break; }
    }
    if (!placed) {
      for (const f of fams) {
        if (f.L !== w.L) continue;
        if (f.members.some((o) => sim(o.start, w.start, w.L))) { placed = { f, s: sim(f.members[0].start, w.start, w.L) || { exact: false, variation: "some" } }; break; }
      }
    }
    if (placed) placed.f.members.push({ ...w, exact: placed.s.exact, variation: placed.s.variation });
    else fams.push({ L: w.L, members: [{ ...w, exact: true, variation: null }] });
  }
  const live = fams.filter((f) => f.members.length > 1);
  const letterOf = (k) => String.fromCharCode(65 + (k % 26)) + (k >= 26 ? String(Math.floor(k / 26)) : "");
  const famLetter = new Map(live.map((f, k) => [f, letterOf(k)]));
  const all = [];
  for (const f of live) for (const m of f.members) all.push({ f, m });
  all.sort((a, b) => a.m.start - b.m.start);
  const idOf = new Map(all.map((x, k) => [x.m, "p" + k]));
  return all.map(({ f, m }) => {
    const first = f.members[0];
    const rep = m === first;
    return {
      id: idOf.get(m),
      label: famLetter.get(f) + (m.exact ? "" : "′"),
      startMeasure: m.start,
      endMeasure: m.start + m.L - 1,
      repeatOf: rep ? null : idOf.get(first),
      exact: m.exact,
      variation: rep ? null : m.variation,
    };
  });
}

/** Letra base de la etiqueta ("A′" → "A"). */
export const baseLetter = (label) => String(label || "").replace(/′/g, "");

/** Frase que contiene al compás (base 0), o null. */
export function phraseAt(phrases, measure) {
  return (phrases || []).find((p) => measure >= p.startMeasure && measure <= p.endMeasure) || null;
}

/** Texto de rango de compases en base 1: "1–4" o "3". */
export function measureRangeText(p) {
  return p.startMeasure === p.endMeasure ? `${p.startMeasure + 1}` : `${p.startMeasure + 1}–${p.endMeasure + 1}`;
}

/** Aviso al entrar a una frase que ya apareció; null si es la primera aparición. */
export function repeatNotice(p, phrases) {
  if (!p || !p.repeatOf) return null;
  const base = (phrases || []).find((x) => x.id === p.repeatOf);
  if (!base) return null;
  const where = base.startMeasure === base.endMeasure ? `al compás ${measureRangeText(base)}` : `a los compases ${measureRangeText(base)}`;
  if (p.exact) return `Esta frase ya la tocaste: es igual ${where}`;
  const ref = base.startMeasure === base.endMeasure ? `al compás ${measureRangeText(base)}` : `a los compases ${measureRangeText(base)}`;
  const tail = p.variation === "end" ? ", cambia el final" : p.variation === "rhythm" ? ", cambia el ritmo" : ", con algunas variantes";
  return `Esta frase ya la tocaste: es parecida ${ref}${tail}`;
}

/** Etiqueta larga de una frase para el dibujo: "A", "A (se repite)", "A′ (parecida a A)". */
export function phraseCaption(p, phrases) {
  if (!p.repeatOf) return p.label;
  if (p.exact) return `${p.label} (se repite)`;
  return `${p.label} (parecida a ${baseLetter(p.label)})`;
}
