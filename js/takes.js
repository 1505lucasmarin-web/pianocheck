// Tomas: cada intento de práctica («Te espero» o «A pulso») guardado como ejecución (eventos de notas, no audio),
// con sus métricas y la comparación entre tomas equivalentes. Lógica pura: sin DOM ni IndexedDB.
import { dayKey, shiftDay } from "./practice-time.js";

/** Máximo de notas (note-on) por toma. */
export const MAX_TAKE_EVENTS = 20000;
/** Duración máxima de una toma (30 min). Lo que pase de ahí no se guarda. */
export const MAX_TAKE_MS = 30 * 60 * 1000;
/** Tomas con menos notas que esto se descartan. */
export const MIN_TAKE_NOTES = 5;
/** Un hueco entre notas mayor que esto no cuenta como tiempo activo. */
export const ACTIVE_GAP_MS = 4000;
/** Días que se conservan todas las tomas (lo anterior se poda, ver pruneTakes). */
export const KEEP_ALL_DAYS = 14;
const MAX_STEPS = 5000;
const MODES = ["espera", "pulso"];
const HANDS = ["both", "rh", "lh"];

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const num = (x) => (x === null || x === undefined || x === "" ? NaN : Number(x));
const median = (xs) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const round1 = (x) => Math.round(x * 10) / 10;

/** Clave de rango ("pieza" o "compases a-b"): dos tomas sólo se comparan si la tienen igual. */
export const rangeKey = (t) => (t && t.range ? `${t.range.from}-${t.range.to}` : "pieza");

/**
 * Normaliza y valida una toma cruda. Devuelve null si no sirve (sin partitura o con menos de MIN_TAKE_NOTES notas).
 * Forma de la toma:
 * { id, scoreId, at (ISO), day ("AAAA-MM-DD" local), mode ("espera"|"pulso"), hands ("both"|"rh"|"lh"),
 *   range ({from,to} base 0 | null), loop (bool), bpm, durationSec, source ("midi"|"mic"|"teclado"), hasAudio (bool),
 *   events: [[tMs desde el inicio, midi, velocity 0-127, durMs | null]] ordenados por tiempo,
 *   steps: [{ i (índice en buildSteps), measure (base 0), tOn (ms desde el inicio en que se completó), clean (bool), wrong (nº de notas erradas antes de ese paso) }],
 *   summary: { accuracy, status, clean, dirty, wrong } }
 * @param {object} raw
 * @returns {object|null}
 */
export function buildTake(raw) {
  if (!raw || typeof raw !== "object" || typeof raw.scoreId !== "string" || !raw.scoreId) return null;
  const events = [];
  for (const e of Array.isArray(raw.events) ? raw.events : []) {
    if (!Array.isArray(e)) continue;
    const t = num(e[0]), midi = num(e[1]);
    if (!Number.isFinite(t) || t < 0 || t > MAX_TAKE_MS) continue;
    if (!Number.isInteger(midi) || midi < 21 || midi > 108) continue;
    const v = num(e[2]), d = num(e[3]);
    events.push([Math.round(t), midi, Number.isFinite(v) ? clamp(Math.round(v), 0, 127) : 80, Number.isFinite(d) && d >= 0 ? Math.round(Math.min(d, MAX_TAKE_MS)) : null]);
    if (events.length >= MAX_TAKE_EVENTS) break;
  }
  if (events.length < MIN_TAKE_NOTES) return null;
  events.sort((a, b) => a[0] - b[0]);

  const seen = new Set(), steps = [];
  for (const s of Array.isArray(raw.steps) ? raw.steps : []) {
    if (!s || !Number.isInteger(s.i) || s.i < 0 || seen.has(s.i) || steps.length >= MAX_STEPS) continue;
    const tOn = num(s.tOn);
    if (!Number.isFinite(tOn) || tOn < 0) continue;   // sólo pasos completados
    seen.add(s.i);
    steps.push({ i: s.i, measure: Number.isInteger(s.measure) && s.measure >= 0 ? s.measure : 0, tOn: Math.round(tOn), clean: s.clean === true, wrong: Number.isFinite(num(s.wrong)) ? Math.max(0, Math.floor(num(s.wrong))) : 0 });
  }
  steps.sort((a, b) => a.tOn - b.tOn);

  const atMs = typeof raw.at === "number" ? raw.at : Date.parse(raw.at);
  const at = Number.isFinite(atMs) ? atMs : Date.now();
  const range = raw.range && Number.isInteger(raw.range.from) && Number.isInteger(raw.range.to) && raw.range.from >= 0 && raw.range.to >= raw.range.from
    ? { from: raw.range.from, to: raw.range.to } : null;
  const bpm = num(raw.bpm);
  const dur = num(raw.durationSec);
  const sm = raw.summary && typeof raw.summary === "object" ? raw.summary : {};
  const summary = {};
  for (const k of ["accuracy", "clean", "dirty", "wrong"]) if (Number.isFinite(num(sm[k]))) summary[k] = num(sm[k]);
  if (typeof sm.status === "string") summary.status = sm.status.slice(0, 20);

  return {
    id: typeof raw.id === "string" && raw.id ? raw.id.slice(0, 80) : "t" + Math.round(at).toString(36) + Math.random().toString(36).slice(2, 6),
    scoreId: raw.scoreId.slice(0, 80),
    at: new Date(at).toISOString(),
    day: typeof raw.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.day) ? raw.day : dayKey(at),
    mode: MODES.includes(raw.mode) ? raw.mode : "espera",
    hands: HANDS.includes(raw.hands) ? raw.hands : "both",
    range,
    loop: raw.loop === true,
    bpm: Number.isFinite(bpm) ? clamp(Math.round(bpm), 20, 300) : 80,
    durationSec: Number.isFinite(dur) && dur >= 0 ? round1(dur) : round1(events[events.length - 1][0] / 1000),
    source: ["midi", "mic", "teclado"].includes(raw.source) ? raw.source : "teclado",
    hasAudio: raw.hasAudio === true,
    events, steps, summary,
  };
}

/** Pura: { ok:true } si dos tomas se pueden comparar; si no, { ok:false, reason }. */
export function takesComparable(a, b) {
  if (!a || !b) return { ok: false, reason: "Falta una de las tomas." };
  if (a.scoreId !== b.scoreId) return { ok: false, reason: "Son de partituras distintas." };
  if (a.hands !== b.hands) return { ok: false, reason: "Una es de una mano y la otra de otra." };
  if (rangeKey(a) !== rangeKey(b)) return { ok: false, reason: "Son de compases distintos." };
  if (a.mode !== b.mode) return { ok: false, reason: "Una es «Te espero» y la otra «A pulso»." };
  return { ok: true };
}

/**
 * Pura: métricas de una toma. `steps` es buildSteps(partitura, toma.hands): sus índices i y compases dan la posición
 * de cada paso (en negras) y el rango de la toma. Ver la forma de la respuesta en el código (campos documentados abajo).
 * - accuracy: % de pasos completados que salieron limpios (0-100). Un paso es limpio si no tuvo notas erradas (en «A pulso» el tiempo se mide en tempo y pulso, no acá).
 * - wrongNotes: notas erradas (summary.wrong si está, si no la suma por paso).
 * - measuresDone / measuresTotal: compases con todos sus pasos completados / compases del rango.
 * - completion: pasos completados / pasos del rango (0..1).
 * - activeSec: tiempo activo estimado (huecos > ACTIVE_GAP_MS no cuentan).
 * - notesPerMin: notas por minuto de tiempo activo.
 * - tempoBpm: tempo efectivo en negras por minuto: mediana de los intervalos reales por negra escrita. null si no alcanza.
 * - evenness: regularidad del pulso 0..100 (100 = intervalos reales iguales a los escritos al tempo efectivo). null si no alcanza.
 * - hesitations: intervalos reales mayores al doble de lo esperado; hesitationMeasures: compás de cada uno.
 * - holdPct: null (la toma no guarda duraciones escritas, así que no se calcula el sostener).
 * - perMeasure: [{ measure, errors (pasos no limpios), seconds (tiempo que se tardó en el compás), hesitated (bool) }].
 * @returns {object}
 */
export function takeMetrics(take, steps = []) {
  const empty = { accuracy: 0, wrongNotes: 0, measuresDone: 0, measuresTotal: 0, completion: 0, activeSec: 0, notesPerMin: 0, tempoBpm: null, evenness: null, hesitations: 0, hesitationMeasures: [], holdPct: null, perMeasure: [], stepsDone: 0, stepsTotal: 0 };
  if (!take) return empty;
  const inRange = (s) => !take.range || (s.measure >= take.range.from && s.measure <= take.range.to);
  const scoped = (steps || []).filter(inRange);
  const byI = new Map(scoped.map((s) => [s.i, s]));
  const done = take.steps.filter((s) => byI.has(s.i)).sort((a, b) => a.tOn - b.tOn);
  const clean = done.filter((s) => s.clean).length;

  // tiempo activo y notas por minuto
  let activeMs = 0;
  for (let k = 1; k < take.events.length; k++) { const gap = take.events[k][0] - take.events[k - 1][0]; if (gap <= ACTIVE_GAP_MS) activeMs += gap; }
  const last = take.events[take.events.length - 1];
  activeMs += last[3] || 0;
  const activeSec = round1(activeMs / 1000);

  // tempo efectivo: mediana de (intervalo real / negras escritas) entre pasos consecutivos
  const perBeat = [], pairs = [];
  for (let k = 1; k < done.length; k++) {
    const a = byI.get(done[k - 1].i), b = byI.get(done[k].i);
    const beats = b.t - a.t;
    if (!(beats > 0)) continue;
    const real = done[k].tOn - done[k - 1].tOn;
    perBeat.push(real / beats);
    pairs.push({ beats, real, measure: b.measure, k });
  }
  const msPerBeat = median(perBeat.filter((x) => x > 0));
  const tempoBpm = msPerBeat ? Math.round(60000 / msPerBeat) : null;

  // regularidad e hesitaciones respecto del tempo efectivo
  let evenness = null, hesitations = 0;
  const hesMeasures = new Set();
  if (msPerBeat && pairs.length) {
    const errs = [];
    for (const p of pairs) {
      const expected = p.beats * msPerBeat;
      errs.push(p.real / expected - 1);
      if (p.real > 2 * expected) { hesitations++; hesMeasures.add(p.measure); }
    }
    const mad = errs.reduce((x, e) => x + Math.abs(e), 0) / errs.length;   // desviación media: un titubeo aislado no anula la regularidad
    evenness = Math.round(clamp(100 * (1 - 2 * mad), 0, 100));
  }

  // por compás
  const measures = [...new Set(scoped.map((s) => s.measure))].sort((a, b) => a - b);
  const perMeasure = measures.map((m) => ({ measure: m, errors: 0, seconds: 0, hesitated: hesMeasures.has(m) }));
  const pmOf = new Map(perMeasure.map((x) => [x.measure, x]));
  let prevT = 0;
  for (const s of done) {
    const st = byI.get(s.i), row = pmOf.get(st.measure);
    if (!row) continue;
    row.seconds += (s.tOn - prevT) / 1000;
    prevT = s.tOn;
    if (!s.clean) row.errors++;
  }
  for (const r of perMeasure) r.seconds = round1(r.seconds);

  const totalSteps = scoped.length;
  const doneI = new Set(done.map((d) => d.i));
  const left = new Map();   // compás → pasos del rango que faltan
  for (const s of scoped) if (!doneI.has(s.i)) left.set(s.measure, (left.get(s.measure) || 0) + 1);
  const measuresDone = measures.filter((m) => !left.get(m)).length;
  const wrongFromSteps = done.reduce((x, s) => x + s.wrong, 0);
  const wrongNotes = take.summary && Number.isFinite(take.summary.wrong) ? take.summary.wrong : wrongFromSteps;

  return {
    accuracy: done.length ? Math.round((clean / done.length) * 100) : 0,
    wrongNotes,
    measuresDone,
    measuresTotal: measures.length,
    completion: totalSteps ? clamp(done.length / totalSteps, 0, 1) : 0,
    activeSec,
    notesPerMin: activeSec > 0 ? round1(take.events.length / (activeSec / 60)) : 0,
    tempoBpm,
    evenness,
    hesitations,
    hesitationMeasures: [...hesMeasures].sort((a, b) => a - b),
    holdPct: null,
    perMeasure,
    stepsDone: done.length,
    stepsTotal: totalSteps,
  };
}

/**
 * Pura: compara dos tomas. Sólo compara tomas equivalentes (misma partitura, mano, rango y modo).
 * `a` es la anterior y `b` la más reciente: los deltas son b − a. verdict por compás: "mejor" si hay menos pasos no limpios en b,
 * "peor" si hay más, "igual" si no cambian. improved / worsened: números de compás (base 0).
 * @param {object} a
 * @param {object} b
 * @param {object[]} steps buildSteps(partitura, a.hands)
 * @param {{antes?:string, ahora?:string}} [labels] palabras para el titular (por defecto "antes" y "ahora")
 * @returns {{comparable:false, reason:string} | {comparable:true, metricsA, metricsB, deltas, perMeasure, improved, worsened, headline}}
 */
export function compareTakes(a, b, steps, labels = {}) {
  const eq = takesComparable(a, b);
  if (!eq.ok) return { comparable: false, reason: eq.reason };
  const ma = takeMetrics(a, steps), mb = takeMetrics(b, steps);
  const diff = (x, y) => (Number.isFinite(x) && Number.isFinite(y) ? round1(y - x) : null);
  const deltas = {
    accuracy: diff(ma.accuracy, mb.accuracy),
    tempoBpm: diff(ma.tempoBpm, mb.tempoBpm),
    evenness: diff(ma.evenness, mb.evenness),
    hesitations: diff(ma.hesitations, mb.hesitations),
    wrongNotes: diff(ma.wrongNotes, mb.wrongNotes),
    completion: diff(ma.completion, mb.completion),
    activeSec: diff(ma.activeSec, mb.activeSec),
  };
  const ids = [...new Set([...ma.perMeasure.map((x) => x.measure), ...mb.perMeasure.map((x) => x.measure)])].sort((x, y) => x - y);
  const pa = new Map(ma.perMeasure.map((x) => [x.measure, x])), pb = new Map(mb.perMeasure.map((x) => [x.measure, x]));
  const perMeasure = ids.map((m) => {
    const x = pa.get(m) || { errors: 0, seconds: 0 }, y = pb.get(m) || { errors: 0, seconds: 0 };
    const verdict = y.errors < x.errors ? "mejor" : y.errors > x.errors ? "peor" : "igual";
    return { measure: m, errorsA: x.errors, errorsB: y.errors, secondsA: x.seconds, secondsB: y.seconds, verdict };
  });
  const improved = perMeasure.filter((r) => r.verdict === "mejor").map((r) => r.measure);
  const worsened = perMeasure.filter((r) => r.verdict === "peor").map((r) => r.measure);

  const antes = labels.antes || "antes", ahora = labels.ahora || "ahora";
  const parts = [];
  if (ma.wrongNotes > 0 && mb.wrongNotes !== ma.wrongNotes) {
    const pct = Math.round(Math.abs(mb.wrongNotes - ma.wrongNotes) / ma.wrongNotes * 100);
    parts.push(mb.wrongNotes < ma.wrongNotes ? `${pct} % menos errores` : `${pct} % más errores`);
  } else if (ma.wrongNotes === 0 && mb.wrongNotes > 0) parts.push(`${mb.wrongNotes} ${mb.wrongNotes === 1 ? "error nuevo" : "errores nuevos"}`);
  if (deltas.tempoBpm !== null && Math.abs(deltas.tempoBpm) >= 1) parts.push(`${Math.round(Math.abs(deltas.tempoBpm))} bpm ${deltas.tempoBpm > 0 ? "más rápido" : "más lento"}`);
  const headline = parts.length ? `${ahora[0].toUpperCase()}${ahora.slice(1)}: ${parts.join(" y ")} que ${antes}.` : `${ahora[0].toUpperCase()}${ahora.slice(1)}: sin cambios notables frente a ${antes}.`;

  return { comparable: true, metricsA: ma, metricsB: mb, deltas, perMeasure, improved, worsened, headline };
}

/**
 * Pura: progreso por día. Agrupa las tomas por día (ascendente) y da, por cada métrica, el mejor valor de ese día.
 * @returns {{day:string, best:{accuracy:number, tempoBpm:number|null, evenness:number|null}, takes:number}[]}
 */
export function trend(takes, steps) {
  const byDay = new Map();
  for (const t of takes || []) {
    if (!t) continue;
    const m = takeMetrics(t, steps);
    const row = byDay.get(t.day) || { day: t.day, best: { accuracy: null, tempoBpm: null, evenness: null }, takes: 0 };
    row.takes++;
    row.best.accuracy = row.best.accuracy === null ? m.accuracy : Math.max(row.best.accuracy, m.accuracy);
    for (const k of ["tempoBpm", "evenness"]) if (Number.isFinite(m[k])) row.best[k] = row.best[k] === null ? m[k] : Math.max(row.best[k], m[k]);
    byDay.set(t.day, row);
  }
  return [...byDay.values()].sort((x, y) => (x.day < y.day ? -1 : x.day > y.day ? 1 : 0));
}

/**
 * Pura: ids de tomas que hay que borrar para no llenar el dispositivo. Se conservan todas las tomas de los
 * últimos keepDays días; de lo anterior, por día, partitura, mano y rango, la MEJOR (precisión) y la ÚLTIMA.
 * @param {object[]} takes
 * @param {{now?:number, keepDays?:number}} [o]
 * @returns {string[]}
 */
export function pruneTakes(takes, { now = Date.now(), keepDays = KEEP_ALL_DAYS } = {}) {
  const cut = shiftDay(now, keepDays);
  const groups = new Map();
  for (const t of takes || []) {
    if (!t || !t.id || t.day >= cut) continue;
    const key = `${t.day}|${t.scoreId}|${t.hands}|${rangeKey(t)}`;
    (groups.get(key) || groups.set(key, []).get(key)).push(t);
  }
  const drop = [];
  for (const list of groups.values()) {
    const acc = (t) => (t.summary && Number.isFinite(t.summary.accuracy) ? t.summary.accuracy : 0);
    const best = list.reduce((x, t) => (acc(t) > acc(x) ? t : x), list[0]);
    const last = list.reduce((x, t) => (String(t.at) > String(x.at) ? t : x), list[0]);
    for (const t of list) if (t.id !== best.id && t.id !== last.id) drop.push(t.id);
  }
  return drop;
}
