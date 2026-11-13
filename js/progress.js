// Progreso por partitura: lógica pura de la pantalla de progreso (sin DOM ni IndexedDB).
// Las métricas y las comparaciones salen de takes.js; acá se eligen las tomas, se alinean por paso,
// se arman los veredictos y los SVG (gráfico de evolución y piano-roll comparativo) como cadenas.
import { takeMetrics, compareTakes, trend, rangeKey } from "./takes.js";
import { dayKey, shiftDay, normalizeLog } from "./practice-time.js";
import { midiName } from "./model.js";

export const HANDS_ES = { both: "Ambas manos", rh: "Mano derecha", lh: "Mano izquierda" };
export const HANDS_SHORT = { both: "Ambas", rh: "Der.", lh: "Izq." };
export const MODE_ES = { espera: "Te espero", pulso: "A pulso" };
export const SOURCE_ES = { midi: "MIDI", mic: "Micrófono", teclado: "Teclado en pantalla" };
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const FIELDS = ["hands", "rangeKey", "mode"];
const byAt = (a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0);
const pad2 = (n) => String(n).padStart(2, "0");

/* ---- fechas y textos ---- */

/** "AAAA-MM-DD" → "12 nov" ("" si no es una fecha válida). */
export function shortDate(day) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day || "");
  return m ? `${Number(m[3])} ${MESES[Number(m[2]) - 1]}` : "";
}
/** Hoy / Ayer / "12 nov", respecto de `now`. */
export function relDay(day, now = Date.now()) {
  if (day === dayKey(now)) return "Hoy";
  if (day === shiftDay(now, 1)) return "Ayer";
  return shortDate(day);
}
/** Para frases: hoy / ayer / "el 12 nov". */
export function relDayPhrase(day, now = Date.now()) {
  if (day === dayKey(now)) return "hoy";
  if (day === shiftDay(now, 1)) return "ayer";
  return `el ${shortDate(day)}`;
}
/** Hora local "HH:MM" de una marca ISO. */
export function hhmm(at) {
  const d = new Date(at);
  return Number.isNaN(d.getTime()) ? "" : `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
/** 12.5 → "12,5" (coma decimal, rioplatense). */
export function decimalEs(x, digits = 1) { return Number(x).toFixed(digits).replace(".", ","); }
/** Segundos → "1 min 42 s" o "58 s". */
export function fmtSec(sec) {
  const s = Math.round(Number(sec) || 0), m = Math.floor(s / 60), r = s % 60;
  return m ? `${m} min ${r} s` : `${r} s`;
}
export const plural = (n, one, many) => (n === 1 ? one : many);

/** Etiqueta de una toma para los selectores: "Ayer 21:10 · 90 % · ♩ 58". */
export function takeLabel(take, m, now = Date.now()) {
  const tempo = m && m.tempoBpm != null ? `♩ ${m.tempoBpm}` : "♩ —";
  return `${relDay(take.day, now)} ${hhmm(take.at)} · ${m ? m.accuracy : "—"} % · ${tempo}`;
}

/** "Compases 5–8" o "Pieza entera" (base 0 en la toma). */
export function rangeLabel(range) {
  return range ? `Compases ${range.from + 1}–${range.to + 1}` : "Pieza entera";
}
/** Nombre de un grupo: "Ambas manos · Pieza entera · Te espero". */
export function groupLabel(g) {
  return `${HANDS_ES[g.hands]} · ${rangeLabel(g.range)} · ${MODE_ES[g.mode]}`;
}

/* ---- combinaciones equivalentes (sólo se comparan tomas de un mismo grupo) ---- */

/**
 * Agrupa las tomas por mano, pasaje y modo (lo que takesComparable exige igual). Cada grupo trae sus tomas en orden
 * cronológico. Va primero el grupo con más tomas (empate: el de la toma más reciente).
 * @returns {{key:string, hands:string, rangeKey:string, range:object|null, mode:string, takes:object[], count:number, lastAt:string}[]}
 */
export function groupsOf(takes) {
  const map = new Map();
  for (const t of takes || []) {
    if (!t) continue;
    const rk = rangeKey(t), key = `${t.hands}|${rk}|${t.mode}`;
    let g = map.get(key);
    if (!g) { g = { key, hands: t.hands, rangeKey: rk, range: t.range || null, mode: t.mode, takes: [] }; map.set(key, g); }
    g.takes.push(t);
  }
  const out = [...map.values()];
  for (const g of out) { g.takes.sort(byAt); g.count = g.takes.length; g.lastAt = g.takes[g.takes.length - 1].at; }
  return out.sort((a, b) => b.count - a.count || (a.lastAt < b.lastAt ? 1 : a.lastAt > b.lastAt ? -1 : 0));
}

/** Opciones de un filtro ("hands" | "rangeKey" | "mode") con la cantidad de tomas de cada una, la más usada primero. */
export function filterOptions(groups, field) {
  const map = new Map();
  for (const g of groups || []) {
    const value = g[field];
    const label = field === "hands" ? HANDS_SHORT[g.hands] : field === "mode" ? MODE_ES[g.mode] : rangeLabel(g.range);
    const row = map.get(value) || { value, label, count: 0 };
    row.count += g.count;
    map.set(value, row);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

/**
 * Elige el grupo a mostrar. `want` = { hands, rangeKey, mode } pedidos; `changed` = el filtro que el usuario tocó.
 * Si no existe la combinación exacta, toma el grupo con más coincidencias (y, a igualdad, el de más tomas).
 * Con `want` vacío devuelve el grupo con más tomas.
 */
export function resolveGroup(groups, want = {}, changed = null) {
  if (!groups || !groups.length) return null;
  let pool = groups;
  if (changed && want[changed] !== undefined) {
    const same = groups.filter((g) => g[changed] === want[changed]);
    if (same.length) pool = same;
  }
  let best = null, bestScore = -Infinity;
  for (const g of pool) {
    const matches = FIELDS.filter((k) => k !== changed && want[k] !== undefined && g[k] === want[k]).length;
    const score = matches * 1e6 + g.count;
    if (score > bestScore) { best = g; bestScore = score; }
  }
  return best;
}

/** Mejor toma de una lista según accOf (empate: la más reciente). */
export function bestOf(list, accOf = (t) => (t.summary && Number.isFinite(t.summary.accuracy) ? t.summary.accuracy : 0)) {
  let best = null, bv = -Infinity;
  for (const t of list || []) { const v = accOf(t); if (v >= bv) { best = t; bv = v; } }
  return best;
}

/**
 * Par por defecto de un grupo (tomas en orden cronológico). Con dos o más días de práctica: A = la mejor del día
 * anterior y B = la última del día más reciente. Si todas son del mismo día: las dos últimas.
 * @returns {{a:string, b:string, rule:string} | null} ids; null si hay menos de dos tomas.
 */
export function defaultPair(takes, { accOf } = {}) {
  const list = (takes || []).slice().sort(byAt);
  if (list.length < 2) return null;
  const days = [...new Set(list.map((t) => t.day))].sort();
  if (days.length >= 2) {
    const lastDay = days[days.length - 1], prevDay = days[days.length - 2];
    const b = list.filter((t) => t.day === lastDay).pop();
    const a = bestOf(list.filter((t) => t.day === prevDay), accOf);
    return { a: a.id, b: b.id, rule: "dia-anterior" };
  }
  return { a: list[list.length - 2].id, b: list[list.length - 1].id, rule: "ultimas-dos" };
}

/**
 * Comparaciones rápidas. kind: "ayer" (mejor de ayer vs. última de hoy), "primera" (primera vs. última),
 * "mejor" (mejor de las anteriores a la última vs. la última).
 * @returns {{ok:true, a:string, b:string} | {ok:false, reason:string}}
 */
export function presetPair(kind, takes, { now = Date.now(), accOf } = {}) {
  const list = (takes || []).slice().sort(byAt);
  if (kind === "ayer") {
    const a = bestOf(list.filter((t) => t.day === shiftDay(now, 1)), accOf);
    const b = list.filter((t) => t.day === dayKey(now)).pop();
    if (!a || !b) return { ok: false, reason: "Para «Ayer vs. hoy» hace falta una toma de ayer y una de hoy." };
    return { ok: true, a: a.id, b: b.id };
  }
  if (list.length < 2) return { ok: false, reason: "Hace falta otra toma para comparar." };
  const last = list[list.length - 1];
  if (kind === "primera") return { ok: true, a: list[0].id, b: last.id };
  if (kind === "mejor") return { ok: true, a: bestOf(list.slice(0, -1), accOf).id, b: last.id };
  return { ok: false, reason: "Comparación desconocida." };
}

/**
 * Días practicados de una partitura: los días con tiempo registrado para ella y los días con alguna toma guardada
 * (una toma también es práctica aunque el registro de tiempo no tenga ese día).
 */
export function practiceDaysOf(log, scoreId, takes = []) {
  const L = normalizeLog(log);
  const days = new Set(Object.keys(L.days).filter((d) => (L.days[d][scoreId] || 0) > 0));
  for (const t of takes || []) if (t && t.day) days.add(t.day);
  return days.size;
}

/* ---- métricas y veredictos ---- */

/** Métricas de la evolución: mismo orden y nombres que trend() de takes.js. */
export const EVO_METRICS = {
  accuracy: { label: "Precisión", unit: " %", aria: (v) => `${v} % de precisión`, min: 0, max: 100 },
  tempoBpm: { label: "Tempo efectivo", unit: " bpm", aria: (v) => `${v} bpm de tempo efectivo` },
  evenness: { label: "Pulso parejo", unit: "/100", aria: (v) => `${v} de 100 de pulso parejo`, min: 0, max: 100 },
};

/** Mejor valor por día de las tomas dadas (usa steps de su mano). */
export function evolutionPoints(takes, steps) {
  return trend(takes || [], steps || []).map((r) => ({
    day: r.day, label: shortDate(r.day), takes: r.takes,
    accuracy: r.best.accuracy, tempoBpm: r.best.tempoBpm, evenness: r.best.evenness,
  }));
}

/** Métricas de la comparación: `lessIsBetter` marca las que mejoran bajando; tol es el margen de «igual». */
export const DIFF_META = {
  accuracy: { label: "Precisión", lessIsBetter: false, tol: 0, fmt: (v) => `${v} %` },
  tempoBpm: { label: "Tempo efectivo", lessIsBetter: false, tol: 0.5, fmt: (v) => `♩ ${v}` },
  evenness: { label: "Pulso parejo", lessIsBetter: false, tol: 0, fmt: (v) => `${v} /100` },
  hesitations: { label: "Titubeos", lessIsBetter: true, tol: 0, fmt: (v) => String(v) },
  wrongNotes: { label: "Notas erradas", lessIsBetter: true, tol: 0, fmt: (v) => String(v) },
  activeSec: { label: "Duración", note: "tiempo activo", lessIsBetter: true, tol: 1, fmt: (v) => fmtSec(v) },
};
export const DIFF_KEYS = Object.keys(DIFF_META);

/**
 * Veredicto de una métrica entre A (antes) y B (ahora): ▲ mejor, ▼ peor, = igual. Con «menos es mejor»
 * (titubeos, notas erradas, duración) bajar es ▲.
 */
export function verdictOf(key, a, b) {
  const m = DIFF_META[key];
  if (!Number.isFinite(a) || !Number.isFinite(b)) return { sym: "—", word: "sin dato", cls: "na" };
  const d = b - a;
  if (Math.abs(d) <= m.tol) return { sym: "=", word: "igual", cls: "same" };
  const better = m.lessIsBetter ? d < 0 : d > 0;
  return better ? { sym: "▲", word: "mejor", cls: "better" } : { sym: "▼", word: "peor", cls: "worse" };
}

/** Filas de las tarjetas de diferencia a partir de compareTakes(). */
export function diffRows(cmp) {
  return DIFF_KEYS.map((key) => {
    const m = DIFF_META[key], a = cmp.metricsA[key], b = cmp.metricsB[key];
    const fmtOr = (v) => (Number.isFinite(v) ? m.fmt(v) : "—");
    return { key, label: m.label, note: m.note || "", a, b, textA: fmtOr(a), textB: fmtOr(b), lessIsBetter: m.lessIsBetter, ...verdictOf(key, a, b) };
  });
}

/** Tira por compás: cada compás con su veredicto (▲ mejor, = igual, ▼ peor). */
export function measureRows(cmp) {
  const sym = { mejor: "▲", igual: "=", peor: "▼" }, cls = { mejor: "better", igual: "same", peor: "worse" };
  return cmp.perMeasure.map((r) => ({ ...r, sym: sym[r.verdict], cls: cls[r.verdict] }));
}

/** Detalle de un compás: "Compás 5: ayer 3 errores y 6,2 s · hoy 1 error y 4,1 s". */
export function measureDetail(r, antes, ahora) {
  const part = (who, errs, secs) => `${who} ${errs} ${plural(errs, "error", "errores")} y ${decimalEs(secs)} s`;
  return `Compás ${r.measure + 1}: ${part(antes, r.errorsA, r.secondsA)} · ${part(ahora, r.errorsB, r.secondsB)}`;
}

/** Titular de la comparación ("Hoy: 12 % menos errores y 8 bpm más rápido que ayer."). */
export function headlineOf(a, b, now = Date.now()) {
  const sameDay = a.day === b.day;
  const antes = sameDay ? "la toma anterior" : relDayPhrase(a.day, now);
  const ahora = sameDay ? "la última" : relDayPhrase(b.day, now);
  return { antes, ahora };
}

/** Compara A (antes) y B (ahora) con los nombres de día ya armados. */
export function compareWith(a, b, steps, now = Date.now()) {
  const { antes, ahora } = headlineOf(a, b, now);
  return compareTakes(a, b, steps, { antes, ahora });
}

/* ---- piano-roll: alineado por PASO de la partitura, no por reloj ---- */

/**
 * Alinea las notas de una toma con las columnas (pasos) de la partitura en su rango. Cada nota cae en la columna del
 * primer paso completado a partir de su tiempo (lo que se tocó antes de completar un paso es ese paso). Una nota es
 * errada si su altura no está en el paso. Las columnas sin tocar quedan vacías (toma parcial).
 * @param {object} take
 * @param {object[]} steps buildSteps(partitura, take.hands)
 * @returns {{cols:number, colMeasure:number[], measureStarts:{measure:number,col:number}[], notes:{col:number,midi:number,vel:number,wrong:boolean,t:number}[], doneCols:Set<number>, minMidi:number, maxMidi:number}}
 */
export function rollLayout(take, steps) {
  const inRange = (s) => !take.range || (s.measure >= take.range.from && s.measure <= take.range.to);
  const cols = (steps || []).filter(inRange).slice().sort((a, b) => a.i - b.i);
  const colOf = new Map(cols.map((s, k) => [s.i, k]));
  const done = (take.steps || []).filter((s) => colOf.has(s.i)).sort((a, b) => a.tOn - b.tOn);
  const notes = [];
  let p = 0;
  for (const ev of take.events || []) {
    const [t, midi, vel] = ev;
    while (p < done.length && done[p].tOn < t) p++;
    const st = done[p] || done[done.length - 1];
    const col = st ? colOf.get(st.i) : 0;
    const expected = cols[col] ? cols[col].midi : [];
    notes.push({ col, midi, vel, wrong: !expected.includes(midi), t });
  }
  const measureStarts = [];
  cols.forEach((s, k) => { if (k === 0 || cols[k - 1].measure !== s.measure) measureStarts.push({ measure: s.measure, col: k }); });
  const mids = [...notes.map((n) => n.midi), ...cols.flatMap((s) => s.midi)];
  return {
    cols: cols.length,
    colMeasure: cols.map((s) => s.measure),
    measureStarts,
    notes,
    doneCols: new Set(done.map((s) => colOf.get(s.i))),
    minMidi: mids.length ? Math.min(...mids) : 60,
    maxMidi: mids.length ? Math.max(...mids) : 72,
  };
}

/**
 * Toma parcial con sólo las notas de un compás (para «Escuchar este compás»): desde el paso anterior al primero del
 * compás hasta su último paso. Devuelve { events, sec } con los tiempos corridos a cero, o null si no hay nada.
 */
export function measureSegment(take, steps, measure, tailMs = 300) {
  const ids = new Set((steps || []).filter((s) => s.measure === measure).map((s) => s.i));
  const mine = (take.steps || []).filter((s) => ids.has(s.i)).sort((a, b) => a.tOn - b.tOn);
  if (!mine.length) return null;
  const first = mine[0].tOn, end = mine[mine.length - 1].tOn;
  const prev = (take.steps || []).filter((s) => s.tOn < first).reduce((x, s) => Math.max(x, s.tOn), 0);
  const events = (take.events || []).filter((e) => e[0] >= prev && e[0] <= end + tailMs).map((e) => [e[0] - prev, e[1], e[2], e[3]]);
  if (!events.length) return null;
  return { events, sec: (end - prev) / 1000 };
}

/* ---- SVG (cadenas, sin DOM) ---- */

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/** Escala del eje Y: 0–100 para porcentajes y pulso; con margen para el tempo. */
export function yScale(points, key) {
  const vals = points.map((p) => p[key]).filter(Number.isFinite);
  const def = EVO_METRICS[key];
  if (def.min !== undefined) return { lo: def.min, hi: def.max };
  if (!vals.length) return { lo: 0, hi: 100 };
  let lo = Math.floor((Math.min(...vals) - 5) / 5) * 5, hi = Math.ceil((Math.max(...vals) + 5) / 5) * 5;
  if (hi - lo < 10) { lo -= 5; hi += 5; }
  return { lo: Math.max(0, lo), hi };
}

/**
 * Gráfico de evolución (líneas, SVG propio). Los días se ubican proporcionales a la fecha (un día sin práctica deja hueco).
 * Cada punto es enfocable y lleva aria-label. Devuelve { svg, pts } con pts = [{ i, day, label, value, text }].
 */
export function evolutionSvg(points, key, { width = 600, height = 240 } = {}) {
  const def = EVO_METRICS[key];
  const withVal = points.filter((p) => Number.isFinite(p[key]));
  const padL = 44, padR = 18, padT = 26, padB = 42;
  const iw = Math.max(40, width - padL - padR), ih = Math.max(40, height - padT - padB);
  const { lo, hi } = yScale(points, key);
  const dayNum = (d) => { const [y, m, dd] = d.split("-").map(Number); return Date.UTC(y, m - 1, dd) / 86400000; };
  const d0 = withVal.length ? dayNum(withVal[0].day) : 0, d1 = withVal.length ? dayNum(withVal[withVal.length - 1].day) : 0;
  const xOf = (day) => (d1 > d0 ? padL + ((dayNum(day) - d0) / (d1 - d0)) * iw : padL + iw / 2);
  const yOf = (v) => padT + (1 - (v - lo) / (hi - lo || 1)) * ih;
  const ticks = [lo, (lo + hi) / 2, hi].map((v) => Math.round(v));
  const grid = ticks.map((v) => `<line class="pg-grid-l" x1="${padL}" x2="${width - padR}" y1="${yOf(v).toFixed(1)}" y2="${yOf(v).toFixed(1)}"/><text class="pg-ytick" x="${padL - 8}" y="${(yOf(v) + 4).toFixed(1)}" text-anchor="end">${v}</text>`).join("");
  const n = withVal.length;
  const every = n > 8 ? Math.ceil(n / 6) : 1;
  const pts = withVal.map((p, i) => ({ i, day: p.day, label: p.label, value: p[key], x: xOf(p.day), y: yOf(p[key]), text: `${p.label}: ${def.aria(p[key])}` }));
  const line = pts.length > 1 ? `<polyline class="pg-line" fill="none" points="${pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}"/>` : "";
  const xl = pts.map((p, k) => (k % every === 0 || k === n - 1 ? `<text class="pg-xtick" x="${p.x.toFixed(1)}" y="${height - 14}" text-anchor="middle">${esc(p.label)}</text>` : "")).join("");
  const dots = pts.map((p) => `<g class="pg-pt-g"><circle class="pg-pt" data-i="${p.i}" tabindex="0" role="img" aria-label="${esc(p.text)}" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="6.5"/><text class="pg-pt-v" x="${p.x.toFixed(1)}" y="${(p.y - 12).toFixed(1)}" text-anchor="middle">${esc(p.value + (def.unit || ""))}</text></g>`).join("");
  const svg = `<svg class="pg-evo-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="group" aria-label="${esc(def.label)} por día">${grid}${line}${xl}${dots}</svg>`;
  return { svg, pts };
}

/** Colores de cada voz del piano-roll (A hachurada, B sólida: se distinguen también sin color). */
export const ROLL_STYLE = {
  a: { fill: "#bfb199", stroke: "#bfb199", hatch: true },
  b: { fill: "#e9b44c", stroke: "#e9b44c", hatch: false },
};

/**
 * Piano-roll comparativo: una voz por carril (A arriba, B abajo). Eje horizontal = pasos de la partitura (columnas iguales),
 * altura = nota. Notas erradas con borde rojo. Cada nota es un rect con data-m (compás) para elegir compás tocándola.
 * @param {{key:'a'|'b', label:string, layout:object}[]} lanes
 */
export function rollSvg(lanes, { colW = 40, laneH = 110, selected = null, label = "Piano-roll" } = {}) {
  const cols = Math.max(0, ...lanes.map((l) => l.layout.cols));
  const minM = Math.min(...lanes.map((l) => l.layout.minMidi)), maxM = Math.max(...lanes.map((l) => l.layout.maxMidi));
  const span = Math.max(8, maxM - minM + 2);
  const unit = laneH / span;
  const W = cols * colW + 8, bandH = 18, gap = 26;
  const H = lanes.length * (bandH + laneH + gap);
  const parts = [];
  const lay = lanes[0] ? lanes[0].layout : { measureStarts: [] };
  if (selected != null) {
    const ms = lay.measureStarts, k = ms.findIndex((s) => s.measure === selected);
    if (k >= 0) {
      const from = ms[k].col, to = k + 1 < ms.length ? ms[k + 1].col : cols;
      parts.push(`<rect class="pg-sel" x="${from * colW}" y="0" width="${(to - from) * colW}" height="${H}"/>`);
    }
  }
  for (const s of lay.measureStarts) {
    parts.push(`<line class="pg-bar" x1="${s.col * colW}" x2="${s.col * colW}" y1="0" y2="${H}"/>`);
    parts.push(`<text class="pg-mnum" x="${s.col * colW + 4}" y="12" data-m="${s.measure}">${s.measure + 1}</text>`);
  }
  const defs = lanes.filter((l) => ROLL_STYLE[l.key].hatch).map((l) => `<pattern id="pg-hatch-${l.key}" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)"><rect width="6" height="6" fill="${ROLL_STYLE[l.key].fill}"/><line x1="0" y1="0" x2="0" y2="6" stroke="#15110d" stroke-width="2"/></pattern>`).join("");
  lanes.forEach((lane, li) => {
    const top = li * (bandH + laneH + gap) + bandH, st = ROLL_STYLE[lane.key];
    parts.push(`<text class="pg-lane-t" x="4" y="${top - 6}">${esc(lane.label)}</text>`);
    parts.push(`<rect class="pg-lane" x="0" y="${top}" width="${W}" height="${laneH}"/>`);
    const fill = st.hatch ? `url(#pg-hatch-${lane.key})` : st.fill;
    for (const n of lane.layout.notes) {
      const y = top + (maxM + 1 - n.midi) * unit;   // escala común a los dos carriles
      const m = lane.layout.colMeasure[n.col];
      const title = `${esc(midiName(n.midi))} · compás ${m + 1}${n.wrong ? " · nota errada" : ""}`;
      parts.push(`<g class="pg-n pg-n-${lane.key}${n.wrong ? " wrong" : ""}" data-m="${m}"><rect x="${n.col * colW + 4}" y="${y.toFixed(1)}" width="${colW - 8}" height="${Math.max(4, unit - 1.5).toFixed(1)}" rx="2" fill="${fill}" stroke="${n.wrong ? "#ff8272" : st.stroke}" stroke-width="${n.wrong ? 2.5 : 1}"><title>${title}</title></rect></g>`);
    }
  });
  return `<svg class="pg-roll-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(label)}">${defs ? `<defs>${defs}</defs>` : ""}${parts.join("")}</svg>`;
}
