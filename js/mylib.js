// "Mi biblioteca": lógica pura (sin DOM ni almacenamiento). Origen de cada partitura, borradores, búsqueda / filtros / orden,
// y exportar / importar toda la biblioteca (partituras + anotaciones + historial; nunca la API key).
import { validateScore } from "./model.js";
import { fromJSON as annoFromJSON } from "./annotations.js";
import { buildTake } from "./takes.js";
import { normalizeLog } from "./practice-time.js";

export const ORIGIN_KINDS = ["ia", "importada", "incluida", "tarea", "arreglo", "transcrita", "grabada"];
export const ORIGIN_NAMES = { ia: "Creada con IA", importada: "Importada", incluida: "Incluida", tarea: "Tarea", arreglo: "Arreglo", transcrita: "Transcrita", grabada: "Grabada" };
export const FILTERS = [["todas", "Todas"], ["ia", "Creadas con IA"], ["importada", "Importadas"], ["incluida", "Incluidas"], ["tarea", "Tareas"], ["arreglo", "Arreglos"], ["transcrita", "Transcritas"], ["grabada", "Grabadas"], ["borrador", "Borradores"]];
export const SORTS = [["recientes", "Recientes"], ["titulo", "Título"], ["mejor", "Mejor resultado"]];

export const isDraft = (s) => !!(s && s.draft === true);

/**
 * De dónde salió una partitura: "ia" | "importada" | "incluida" | "tarea" | "arreglo" | "transcrita" | "grabada".
 * Usa `origin` si está; en las viejas lo infiere (versión derivada → arreglo; con nivel → IA; ids incluidos → incluida; el resto → importada).
 * opts.bundledIds: Set de ids de las partituras que trae la app.
 */
export function originKind(s, { bundledIds = null } = {}) {
  if (!s || typeof s !== "object") return "importada";
  const o = s.origin;
  if (o === "ia") return s.derivedFrom ? "arreglo" : "ia";
  if (o === "foto" || o === "imagenes" || o === "pdf" || o === "importada") return "importada";
  if (o === "incluida" || o === "tarea" || o === "arreglo" || o === "transcrita" || o === "grabada") return o;
  if (s.derivedFrom) return "arreglo";
  if (s.level) return "ia";
  if (bundledIds && bundledIds.has(s.id)) return "incluida";
  if (typeof s.id === "string" && /^demo-/.test(s.id)) return "incluida";
  return "importada";
}

/** Mejor resultado (%) de un resumen de intentos { count, best, last }; null si no hay. */
export const bestOf = (sum) => (sum && sum.count && Number.isFinite(sum.best) ? sum.best : null);

const norm = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const when = (s) => s.updatedAt || s.createdAt || 0;

/** Recordatorio de copia: desde 3 partituras, si nunca se exportó o pasaron más de 14 días desde la última exportación (y no está pospuesto). */
export const BACKUP_MIN_SCORES = 3;
export const BACKUP_EVERY_DAYS = 14;
/** Pura. lastExport / snoozeUntil: marcas de tiempo (0 o ausentes = nunca / sin posponer). */
export function shouldRemindBackup({ count = 0, lastExport = 0, snoozeUntil = 0, now = Date.now() } = {}) {
  if (!(count >= BACKUP_MIN_SCORES)) return false;
  if (snoozeUntil && now < snoozeUntil) return false;
  if (!lastExport) return true;
  return now - lastExport > BACKUP_EVERY_DAYS * 86400000;
}

/** Cuántas partituras hay por filtro (para los contadores de los chips). */
export function filterCounts(list, opts = {}) {
  const out = { todas: list.length, borrador: 0 };
  for (const k of ORIGIN_KINDS) out[k] = 0;
  for (const s of list) { out[originKind(s, opts)]++; if (isDraft(s)) out.borrador++; }
  return out;
}

/** Filtra, busca (título / artista, sin acentos) y ordena. opts: { q, filter, sort, sums:{id→{count,best,last}}, bundledIds } */
export function queryLibrary(list, { q = "", filter = "todas", sort = "recientes", sums = {}, bundledIds = null } = {}) {
  const words = norm(q).split(/\s+/).filter(Boolean);
  let out = (list || []).filter((s) => {
    if (filter === "borrador") { if (!isDraft(s)) return false; }
    else if (filter !== "todas" && originKind(s, { bundledIds }) !== filter) return false;
    if (!words.length) return true;
    const hay = norm(`${s.title || ""} ${s.artist || ""}`);
    return words.every((w) => hay.includes(w));
  });
  const byTitle = (a, b) => String(a.title || "").localeCompare(String(b.title || ""), "es", { sensitivity: "base" });
  if (sort === "titulo") out = out.sort((a, b) => byTitle(a, b) || when(b) - when(a));
  else if (sort === "mejor") out = out.sort((a, b) => { const x = bestOf(sums[a.id]), y = bestOf(sums[b.id]); if (x == null && y == null) return when(b) - when(a); if (x == null) return 1; if (y == null) return -1; return y - x || when(b) - when(a); });
  else out = out.sort((a, b) => when(b) - when(a));
  return out;
}

/** Borradores, el más reciente primero. */
export const draftsOf = (list) => (list || []).filter(isDraft).sort((a, b) => when(b) - when(a));

/* ============================================================ exportar / importar toda la biblioteca */
export const LIB_FORMAT = "pianocheck-library";
export const LIB_VERSION = 1;
export const LIB_EXT = ".pianocheck-lib";
export const LIB_LIMITS = { maxBytes: 80 * 1024 * 1024, maxScores: 500, maxAttempts: 20000, maxAnnoBytes: 400 * 1024, maxTasksBytes: 120 * 1024, maxTakes: 20000, maxTakeAudioChars: 12 * 1024 * 1024 };

const clone = (o) => JSON.parse(JSON.stringify(o));
const SECRET = /^(apikey|api_key|key|token|secret|password)$/i;
const strip = (o) => { for (const k of Object.keys(o)) if (SECRET.test(k)) delete o[k]; return o; };

/**
 * Objeto exportable. scores: registros guardados; attempts: todos; annotations: { idPartitura → datos }; tasks: ajustes.tasks. Sin ajustes ni API key.
 * Opcionales (sólo se escriben si hay datos): takes: tomas (takes.js); practiceTime: registro de tiempo (practice-time.js);
 * audios: { idToma → { mime, data (base64) } }, que se agrega a cada toma sólo si se pasa (el llamador decide si incluye audios).
 */
export function buildLibraryExport({ scores = [], attempts = [], annotations = {}, tasks = {}, takes = [], practiceTime = null, audios = null, now = Date.now() } = {}) {
  const ids = new Set(scores.map((s) => s.id));
  const anno = {};
  for (const id of Object.keys(annotations || {})) if (ids.has(id) && annotations[id]) anno[id] = clone(annotations[id]);
  const tk = {};
  for (const id of Object.keys(tasks || {})) if (ids.has(id) && tasks[id] && typeof tasks[id] === "object") tk[id] = clone(tasks[id]);
  const out = {
    format: LIB_FORMAT, version: LIB_VERSION, exportedAt: now,
    scores: scores.map((s) => strip(clone(s))),
    attempts: attempts.filter((a) => a && ids.has(a.scoreId)).map((a) => strip(clone(a))),
    annotations: anno, tasks: tk,
  };
  const tks = (takes || []).filter((t) => t && ids.has(t.scoreId)).map((t) => {
    const c = clone(t);
    if (audios && audios[t.id] && t.hasAudio) c.audio = { mime: String(audios[t.id].mime || "audio/webm"), data: String(audios[t.id].data || "") };
    return c;
  });
  if (tks.length) out.takes = tks;
  const pt = normalizeLog(practiceTime);
  if (Object.keys(pt.days).length) out.practiceTime = pt;
  return out;
}
export const serializeLibrary = (obj) => JSON.stringify(obj);
export const libraryFileName = (now = Date.now()) => `PianoCheck-biblioteca-${new Date(now).toISOString().slice(0, 10)}${LIB_EXT}`;

const isObj = (x) => x && typeof x === "object" && !Array.isArray(x);

/**
 * Lee un archivo exportado con validación estricta. Nunca lanza.
 * → { ok, error?, scores:[registro validado + createdAt/updatedAt], attempts, annotations:{id→datos}, tasks, warnings:[], skipped:{scores, attempts, annotations} }
 */
export function parseLibraryExport(text, limits = LIB_LIMITS) {
  const res = { ok: false, scores: [], attempts: [], annotations: {}, tasks: {}, warnings: [], skipped: { scores: 0, attempts: 0, annotations: 0 } };
  try {
    if (typeof text !== "string" || !text.trim()) return { ...res, error: "El archivo está vacío." };
    if (text.length > limits.maxBytes) return { ...res, error: "El archivo es demasiado grande para importarlo." };
    let data;
    try { data = JSON.parse(text); } catch (e) { return { ...res, error: "El archivo no es una biblioteca de PianoCheck (no se puede leer)." }; }
    if (!isObj(data) || data.format !== LIB_FORMAT) return { ...res, error: "El archivo no es una biblioteca de PianoCheck." };
    if (!Number.isInteger(data.version) || data.version > LIB_VERSION || data.version < 1) return { ...res, error: "El archivo es de otra versión de PianoCheck." };
    if (!Array.isArray(data.scores)) return { ...res, error: "Al archivo le faltan las partituras." };
    const seen = new Set();
    let list = data.scores;
    if (list.length > limits.maxScores) { res.warnings.push(`Se importan sólo las primeras ${limits.maxScores} partituras de ${list.length}.`); res.skipped.scores += list.length - limits.maxScores; list = list.slice(0, limits.maxScores); }
    for (const raw of list) {
      if (!isObj(raw) || typeof raw.id !== "string" || !raw.id || raw.id.length > 80 || seen.has(raw.id)) { res.skipped.scores++; continue; }
      const v = validateScore(raw);
      if (!v.ok || !v.score.measures.length || v.score.measures.length > 2000) { res.skipped.scores++; continue; }
      v.score.id = raw.id;
      const rec = { ...v.score };
      if (Number.isFinite(raw.updatedAt) && raw.updatedAt > 0) rec.updatedAt = Math.round(raw.updatedAt);
      if (Number.isFinite(raw.createdAt) && raw.createdAt > 0) rec.createdAt = Math.round(raw.createdAt);
      seen.add(raw.id); res.scores.push(rec);
    }
    const atts = Array.isArray(data.attempts) ? data.attempts : [];
    const aSeen = new Set();
    for (const a of atts) {
      if (res.attempts.length >= limits.maxAttempts) { res.skipped.attempts++; continue; }
      if (!isObj(a) || typeof a.id !== "string" || !a.id || a.id.length > 80 || typeof a.scoreId !== "string" || !seen.has(a.scoreId) || aSeen.has(a.id)) { res.skipped.attempts++; continue; }
      if (JSON.stringify(a).length > 4000) { res.skipped.attempts++; continue; }
      aSeen.add(a.id); res.attempts.push(strip(clone(a)));
    }
    if (isObj(data.annotations)) {
      for (const id of Object.keys(data.annotations)) {
        if (!seen.has(id)) { res.skipped.annotations++; continue; }
        const d = data.annotations[id];
        if (!isObj(d) || JSON.stringify(d).length > limits.maxAnnoBytes) { res.skipped.annotations++; continue; }
        const r = annoFromJSON(d);
        if (!r.ok) { res.skipped.annotations++; continue; }
        res.annotations[id] = r.store.toJSON();
      }
    }
    if (isObj(data.tasks) && JSON.stringify(data.tasks).length <= limits.maxTasksBytes) {
      for (const id of Object.keys(data.tasks)) if (seen.has(id) && isObj(data.tasks[id])) res.tasks[id] = clone(data.tasks[id]);
    }
    res.takes = []; res.takeAudio = {}; res.practiceTime = null;
    if (Array.isArray(data.takes)) {
      const tIds = new Set();
      for (const raw of data.takes) {
        if (res.takes.length >= limits.maxTakes) { res.skipped.takes = (res.skipped.takes || 0) + 1; continue; }
        if (!isObj(raw) || typeof raw.id !== "string" || !seen.has(raw.scoreId) || tIds.has(raw.id)) { res.skipped.takes = (res.skipped.takes || 0) + 1; continue; }
        const t = buildTake(raw);
        if (!t) { res.skipped.takes = (res.skipped.takes || 0) + 1; continue; }
        t.id = raw.id.slice(0, 80);
        tIds.add(t.id);
        if (isObj(raw.audio) && typeof raw.audio.data === "string" && raw.audio.data.length <= limits.maxTakeAudioChars) {
          res.takeAudio[t.id] = { mime: typeof raw.audio.mime === "string" ? raw.audio.mime.slice(0, 40) : "audio/webm", data: raw.audio.data };
        }
        res.takes.push(t);
      }
    }
    if (isObj(data.practiceTime)) res.practiceTime = normalizeLog(data.practiceTime);
    if (!res.scores.length) return { ...res, error: "La biblioteca del archivo no tiene partituras válidas." };
    res.ok = true;
    return res;
  } catch (e) {
    return { ...res, error: "No se pudo leer el archivo: " + (e && e.message ? e.message : e) };
  }
}

/**
 * Fusión sin duplicar por id: lo que ya existe no se pisa. existing = { scoreIds:Set, attemptIds:Set, takeIds:Set }.
 * → { addScores, addAttempts, addAnnotations:{id→datos}, addTasks:{id→datos}, addTakes:[toma], addTakeAudio:{idToma→{mime,data}}, addPracticeTime:registro|null, counts:{ scores, attempts, takes, existing } }
 * addPracticeTime se fusiona con el registro del dispositivo tomando el mayor por día y partitura (practice-time.mergeLogs).
 */
export function planMerge(existing, parsed) {
  const sIds = existing.scoreIds || new Set(), aIds = existing.attemptIds || new Set(), tIds = existing.takeIds || new Set();
  const addScores = parsed.scores.filter((s) => !sIds.has(s.id));
  const added = new Set(addScores.map((s) => s.id));
  const addAttempts = parsed.attempts.filter((a) => added.has(a.scoreId) && !aIds.has(a.id));
  const addAnnotations = {}, addTasks = {};
  for (const id of Object.keys(parsed.annotations || {})) if (added.has(id)) addAnnotations[id] = parsed.annotations[id];
  for (const id of Object.keys(parsed.tasks || {})) if (added.has(id)) addTasks[id] = parsed.tasks[id];
  const addTakes = (parsed.takes || []).filter((t) => !tIds.has(t.id));
  const addTakeAudio = {};
  for (const t of addTakes) if (parsed.takeAudio && parsed.takeAudio[t.id]) addTakeAudio[t.id] = parsed.takeAudio[t.id];
  const addPracticeTime = parsed.practiceTime && Object.keys(parsed.practiceTime.days || {}).length ? parsed.practiceTime : null;
  return { addScores, addAttempts, addAnnotations, addTasks, addTakes, addTakeAudio, addPracticeTime, counts: { scores: addScores.length, attempts: addAttempts.length, takes: addTakes.length, existing: parsed.scores.length - addScores.length } };
}
