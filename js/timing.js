// Modo "A pulso": lógica pura (sin DOM, sin audio). El cursor avanza solo al tempo elegido y cada paso tiene su instante ideal.
// Tiempos en milisegundos desde el inicio de la toma (el primer tiempo después de la cuenta de entrada = 0).
// Desvío = instante tocado − instante ideal: negativo = adelantado, positivo = atrasado.
import { durBeats } from "./model.js";

export const MODES = ["espera", "pulso"];
export const MODE_NAMES = { espera: "Te espero", pulso: "A pulso" };
export const normMode = (m) => (m === "pulso" ? "pulso" : "espera");

export const DEFAULT_WINDOW = 120;             // ± ms para "a tiempo"
export const WINDOWS = [80, 120, 180];         // márgenes que se ofrecen en Ajustes (Justo / Normal / Amplio)
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const median = (a) => { const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

/** Duración de una negra en ms. */
export const beatMs = (bpm) => 60000 / Math.max(20, Number(bpm) || 80);

/** Ventana "a tiempo" (± ms): la base de los ajustes a 80 BPM o más; en tempos lentos crece en proporción (hasta el doble). */
export function windowFor(bpm, base = DEFAULT_WINDOW) {
  const b = clamp(Math.round(Number(base) || DEFAULT_WINDOW), 40, 300);
  const slow = clamp(80 / (Number(bpm) || 80), 1, 2);
  return Math.round(b * slow);
}
/** Hasta dónde una nota tocada se puede asignar a un paso (mucho más ancho que la ventana "a tiempo"): "cercana a un paso vecino". */
export function reachFor(bpm, win) { return Math.round(clamp(Math.max(win * 1.5, beatMs(bpm) * 0.5), 100, 700)); }

/** Clasificación de un desvío: "ontime" | "early" | "late". */
export function classify(dev, win) { return Math.abs(dev) <= win ? "ontime" : dev < 0 ? "early" : "late"; }
export const TIMING_ES = { ontime: "a tiempo", early: "adelantado", late: "atrasado" };
export const devText = (dev) => `${dev < 0 ? "−" : "+"}${Math.abs(Math.round(dev))} ms`;

/** Inicio (en negras) de cada compás, con el mismo criterio que buildSteps. → { starts: number[], total } */
export function measureStarts(score) {
  const ms = (score && score.measures) || [];
  const ts = (score && score.timeSig) || [4, 4];
  const barLen = (ts[0] * 4) / ts[1];
  const starts = []; let base = 0;
  for (const m of ms) {
    starts.push(base);
    let maxLen = 0;
    for (const hand of ["rh", "lh"]) {
      const t = ((m && m[hand]) || []).reduce((a, ev) => a + durBeats(ev), 0);
      if (t > maxLen) maxLen = t;
    }
    base += maxLen > 0 ? maxLen : barLen;
  }
  return { starts, total: base, barLen };
}

/** Pasos del pasaje con su instante ideal. entry = { j, g, k, lap, i, measure, midi, at } (j = posición en la línea de tiempo). */
export function lapEntries(steps, { bpm, origin, lapBeats, lap = 0, startJ = 0 }) {
  const bm = beatMs(bpm);
  return steps.map((s, k) => ({ j: startJ + k, g: lap * steps.length + k, k, lap, i: s.i, measure: s.measure, midi: s.midi, at: (lap * lapBeats + (s.t - origin)) * bm }));
}
export function buildTimeline(steps, o) {
  const laps = Math.max(1, o.laps || 1), out = [];
  for (let lap = 0; lap < laps; lap++) out.push(...lapEntries(steps, { ...o, lap, startJ: out.length }));
  return out;
}

/* ---------------------- asignación de notas tocadas a pasos ---------------------- */

function lowerBound(tl, t) { let lo = 0, hi = tl.length; while (lo < hi) { const m = (lo + hi) >> 1; if (tl[m].at < t) lo = m + 1; else hi = m; } return lo; }

/**
 * Asigna cada nota tocada ({ midi, t }) a un paso de la línea de tiempo `tl` (ordenada por `at`).
 * Una nota sólo puede ir a un paso que la contenga y esté a menos de `reach` ms; si hay varias opciones gana la más próxima en el tiempo
 * (así una nota fuera de ventana, cerca de un paso vecino, se asigna al más cercano). Las notas que no entran en ningún paso se anotan como
 * "de más" del paso más cercano (si está a menos de `reach`) o quedan sueltas.
 * → { assign: [j|-1], extraAt: [j|-1] (paso al que se atribuye cada nota de más) }
 */
export function matchEvents(tl, events, { reach }) {
  const assign = new Array(events.length).fill(-1);
  const extraAt = new Array(events.length).fill(-1);
  const pairs = [];
  events.forEach((ev, ei) => {
    for (let j = lowerBound(tl, ev.t - reach); j < tl.length && tl[j].at <= ev.t + reach; j++) {
      if (tl[j].midi.includes(ev.midi)) pairs.push({ ei, j, d: Math.abs(ev.t - tl[j].at) });
    }
  });
  pairs.sort((a, b) => a.d - b.d || a.ei - b.ei);
  const taken = new Map();               // `${j}|${midi}` → ei
  for (const p of pairs) {
    const key = p.j + "|" + events[p.ei].midi;
    if (assign[p.ei] >= 0 || taken.has(key)) continue;
    assign[p.ei] = p.j; taken.set(key, p.ei);
  }
  events.forEach((ev, ei) => {
    if (assign[ei] >= 0) return;
    let best = -1, bd = Infinity;
    for (let j = lowerBound(tl, ev.t - reach); j < tl.length && tl[j].at <= ev.t + reach; j++) {
      const d = Math.abs(ev.t - tl[j].at);
      if (d < bd) { bd = d; best = j; }
    }
    extraAt[ei] = best;
  });
  return { assign, extraAt };
}

/**
 * Puntúa una toma: por paso, "hit" (acertado: todas sus notas), "wrong" (errado: faltan notas y hubo notas de más o sólo algunas)
 * o "missed" (omitido: nada tocado cerca de su instante). El desvío de un paso es el promedio de sus notas, así que un acorde
 * levemente arpegiado sigue contando "a tiempo". Las notas fuera de [primer paso − reach, último paso + reach] se ignoran.
 */
export function scoreTimeline(tl, events, { win, reach }) {
  const lo = tl.length ? tl[0].at - reach : 0, hi = tl.length ? tl[tl.length - 1].at + reach : 0;
  const evs = events.filter((e) => e.t >= lo && e.t <= hi).sort((a, b) => a.t - b.t);
  const { assign, extraAt } = matchEvents(tl, evs, { reach });
  const steps = tl.map((e) => ({ ...e, matched: [], extra: [], missing: [], status: "missed", dev: null, timing: null }));
  evs.forEach((ev, ei) => {
    if (assign[ei] >= 0) steps[assign[ei]].matched.push({ midi: ev.midi, dev: ev.t - tl[assign[ei]].at });
    else if (extraAt[ei] >= 0) steps[extraAt[ei]].extra.push({ midi: ev.midi, dev: ev.t - tl[extraAt[ei]].at });
  });
  let strays = 0;
  extraAt.forEach((j, ei) => { if (assign[ei] < 0 && j < 0) strays++; });
  let wrongNotes = strays;
  for (const s of steps) {
    s.missing = s.midi.filter((m) => !s.matched.some((x) => x.midi === m));
    wrongNotes += s.extra.length;
    if (!s.missing.length) {
      s.status = "hit";
      s.dev = Math.round(s.matched.reduce((a, x) => a + x.dev, 0) / s.matched.length);
      s.timing = classify(s.dev, win);
    } else if (s.matched.length || s.extra.length) {
      s.status = "wrong";
      if (s.matched.length) s.dev = Math.round(s.matched.reduce((a, x) => a + x.dev, 0) / s.matched.length);
    }
  }
  return { steps, wrongNotes, strays };
}

/** Estado de cada compás para la tira de resultado: "empty" (sin notas), "none" (no se llegó), "clean" (todo a tiempo), "off" (notas bien pero fuera de tiempo) o "dirty" (errado u omitido). */
export function measureStates(scored, steps, n) {
  const out = new Array(Math.max(0, n)).fill("empty");
  const cnt = new Array(out.length).fill(0), seen = new Array(out.length).fill(0);
  const bad = new Array(out.length).fill(false), off = new Array(out.length).fill(false);
  (steps || []).forEach((s) => { if (s.measure >= 0 && s.measure < out.length) cnt[s.measure]++; });
  (scored.steps || []).forEach((s) => {
    if (s.measure < 0 || s.measure >= out.length) return;
    seen[s.measure]++;
    if (s.status !== "hit") bad[s.measure] = true; else if (s.timing !== "ontime") off[s.measure] = true;
  });
  for (let m = 0; m < out.length; m++) {
    if (!cnt[m]) continue;
    out[m] = bad[m] ? "dirty" : seen[m] < cnt[m] ? "none" : off[m] ? "off" : "clean";
  }
  return out;
}

/** Resumen de una toma puntuada. */
export function summarize(scored, { win }) {
  const st = scored.steps, total = st.length;
  const hits = st.filter((s) => s.status === "hit");
  const ontime = hits.filter((s) => s.timing === "ontime").length;
  const early = hits.filter((s) => s.timing === "early").length;
  const late = hits.filter((s) => s.timing === "late").length;
  const wrong = st.filter((s) => s.status === "wrong").length;
  const missed = st.filter((s) => s.status === "missed").length;
  const devs = hits.map((s) => s.dev);
  const by = new Map();
  for (const s of st) {
    const e = by.get(s.measure) || { measure: s.measure, total: 0, hit: 0, ontime: 0, bad: 0, abs: 0 };
    e.total++;
    if (s.status === "hit") { e.hit++; e.abs += Math.abs(s.dev); if (s.timing === "ontime") e.ontime++; }
    if (!(s.status === "hit" && s.timing === "ontime")) e.bad++;
    by.set(s.measure, e);
  }
  const byMeasure = [...by.values()].sort((a, b) => a.measure - b.measure);
  const weak = byMeasure.filter((e) => e.bad > 0)
    .sort((a, b) => b.bad / b.total - a.bad / a.total || b.bad - a.bad || (b.hit ? b.abs / b.hit : 0) - (a.hit ? a.abs / a.hit : 0) || a.measure - b.measure)
    .slice(0, 3).map((e) => ({ measure: e.measure, bad: e.bad, total: e.total }));
  const trendMs = devs.length ? Math.round(median(devs)) : null;
  return {
    total, hit: hits.length, wrong, missed, ontime, early, late, wrongNotes: scored.wrongNotes,
    pctCorrect: total ? Math.round((hits.length / total) * 100) : 0,
    pctOnTime: hits.length ? Math.round((ontime / hits.length) * 100) : null,   // entre los pasos acertados
    trendMs, meanAbs: devs.length ? Math.round(devs.reduce((a, d) => a + Math.abs(d), 0) / devs.length) : null,
    byMeasure, weak, win,
  };
}

/** "Tendés a adelantarte ~60 ms" / "Tendés a atrasarte ~60 ms" / "Tu pulso es parejo". null si hay pocos datos. */
export function trendText(sum, { minHits = 3, even = 20 } = {}) {
  if (!sum || sum.hit < minHits || sum.trendMs == null) return null;
  const ms = sum.trendMs;
  if (Math.abs(ms) < even) return "Tu pulso es parejo: no te adelantás ni te atrasás";
  const r = Math.round(Math.abs(ms) / 10) * 10;
  return `Tendés a ${ms < 0 ? "adelantarte" : "atrasarte"} ~${r} ms`;
}

/** La acción principal sugerida después de una toma a pulso. */
export function timingAction(sum, { bpm, measures }) {
  const b = Math.round(bpm || 80);
  const poor = sum.pctCorrect < 75 || (sum.pctOnTime != null && sum.pctOnTime < 60);
  if (poor && b > 32) {
    const nb = Math.max(30, Math.round(b * 0.87));   // 10–15% más lento
    return { type: "slower", bpm: nb, title: "Todavía cuesta seguir el pulso. Probá un poco más despacio", cta: `Bajar el tempo a ♩ ${nb}` };
  }
  if (sum.weak.length) {
    const m = sum.weak[0].measure, n = measures || m + 1;
    const range = m + 1 < n ? { from: m, to: m + 1 } : { from: Math.max(0, m - 1), to: m };
    return { type: "fix", measure: m, range, title: `El compás ${m + 1} fue el más flojo de pulso`, cta: `Practicar compases ${range.from === range.to ? range.from + 1 : `${range.from + 1}–${range.to + 1}`}` };
  }
  return { type: "faster", bpm: Math.min(240, b + 4), title: "Pulso firme. Probá un poco más rápido", cta: `Subir el tempo a ♩ ${Math.min(240, b + 4)}` };
}

/* ---------------------- toma en vivo ---------------------- */

/**
 * Toma a pulso en curso. `steps` = pasos del pasaje (conservan i/t/measure). `origin` = inicio (en negras) del primer compás del pasaje;
 * `lapBeats` = largo del pasaje en negras. Con `loop` la toma sigue vuelta tras vuelta sin cuenta de entrada entre vueltas.
 * Los tiempos son ms desde el inicio de la toma. Usa la misma asignación que la puntuación final, sobre un entorno local.
 */
export function createPulse(steps, { bpm, win, origin = 0, lapBeats, loop = false }) {
  const list = Array.isArray(steps) ? steps : [];
  const reach = reachFor(bpm, win);
  const tl = [], events = [];
  const lapMs = lapBeats * beatMs(bpm);
  let lapsBuilt = 0, finalizedUpTo = 0;
  const finalized = [];   // por j: estado final
  const ensureLap = (lap) => {
    while (lapsBuilt <= lap && (loop || lapsBuilt < 1)) { tl.push(...lapEntries(list, { bpm, origin, lapBeats, lap: lapsBuilt, startJ: tl.length })); lapsBuilt++; }
  };
  ensureLap(0);

  function local(t, span) {
    const a = lowerBound(tl, t - span), b = Math.min(tl.length, lowerBound(tl, t + span + 1) + 1);
    const sub = tl.slice(a, b);
    const evs = events.filter((e) => e.t >= t - span - reach && e.t <= t + span + reach).sort((p, q) => p.t - q.t);
    return { a, sub, evs, m: matchEvents(sub, evs, { reach }) };
  }

  function stepStatus(entry) {
    const { a, sub, evs, m } = local(entry.at, 2 * reach);
    const idx = entry.j - a;
    const got = [], extra = [];
    evs.forEach((e, ei) => { if (m.assign[ei] === idx) got.push(e); else if (m.assign[ei] < 0 && m.extraAt[ei] === idx) extra.push(e); });
    const missing = entry.midi.filter((x) => !got.some((e) => e.midi === x));
    if (!missing.length) {
      const dev = Math.round(got.reduce((s, e) => s + (e.t - entry.at), 0) / got.length);
      return { status: "hit", dev, timing: classify(dev, win) };
    }
    return { status: got.length || extra.length ? "wrong" : "missed", dev: null, timing: null };
  }

  return {
    reach, win, lapMs, get steps() { return list; },
    get timeline() { return tl; },
    get lapCount() { return lapsBuilt; },
    /** Instante ideal del paso k de la vuelta lap. */
    idealAt(k, lap = 0) { return (lap * lapBeats + (list[k].t - origin)) * beatMs(bpm); },
    /** Una nota tocada en el instante t. → { kind: "ignored" | "stray" | "hit" | "wrong", entry?, dev?, timing?, done? } */
    noteOn(midi, t) {
      if (!list.length) return { kind: "ignored" };
      const endAt = loop ? Infinity : tl[tl.length - 1].at + reach;
      if (t < tl[0].at - reach || t > endAt) return { kind: "ignored" };
      ensureLap(Math.floor((t + reach) / Math.max(1, lapMs)) + 1);
      const ev = { midi, t };
      events.push(ev);
      const { a, sub, evs, m } = local(t, 2 * reach);
      const ei = evs.indexOf(ev);
      const j = m.assign[ei];
      if (j >= 0) {
        const entry = sub[j];
        const got = evs.filter((e, k) => m.assign[k] === j);
        const dev = Math.round(ev.t - entry.at);
        const done = entry.midi.every((x) => got.some((e) => e.midi === x));
        const mean = Math.round(got.reduce((s, e) => s + (e.t - entry.at), 0) / got.length);
        return { kind: "hit", entry, dev, timing: classify(dev, win), done, meanDev: mean, meanTiming: classify(mean, win) };
      }
      const ex = m.extraAt[ei];
      if (ex >= 0) return { kind: "wrong", entry: sub[ex], midi };
      return { kind: "stray", midi };
    },
    /** Avanza el reloj hasta t: cierra los pasos cuyo plazo (instante ideal + reach) ya pasó. → [{ entry, status, dev, timing, lapDone }] */
    tick(t) {
      if (!list.length) return [];
      if (loop) ensureLap(Math.floor((t + reach) / Math.max(1, lapMs)) + 1);
      const out = [];
      while (finalizedUpTo < tl.length && tl[finalizedUpTo].at + reach < t) {
        const entry = tl[finalizedUpTo];
        const r = stepStatus(entry);
        finalized[finalizedUpTo] = r;
        finalizedUpTo++;
        out.push({ entry, ...r, lapDone: entry.k === list.length - 1 });
      }
      return out;
    },
    /** ¿Ya se cerraron todos los pasos (sólo sin bucle)? */
    get finished() { return !loop && finalizedUpTo >= tl.length; },
    get closed() { return finalizedUpTo; },
    /** Puntuación de lo ya cerrado (o de todo si all = true). */
    result(all = false) {
      const laps = loop ? finalized.filter((f, j) => f && tl[j].k === list.length - 1).length : 1;
      // en bucle sólo cuentan las vueltas completas (la vuelta a medias no se juzga); sin ninguna completa se muestra lo cerrado
      const n = all ? tl.length : loop && laps > 0 ? laps * list.length : finalizedUpTo;
      const part = tl.slice(0, n);
      const scored = scoreTimeline(part, events, { win, reach });
      return { scored, summary: summarize(scored, { win }), laps };
    },
    get events() { return events; },
    /** Puntuación de una vuelta completa (bucle). */
    lapResult(lap) {
      const part = tl.filter((e) => e.lap === lap);
      const scored = scoreTimeline(part, events, { win, reach });
      return { scored, summary: summarize(scored, { win }) };
    },
  };
}
