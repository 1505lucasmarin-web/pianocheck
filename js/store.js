// Persistencia local en IndexedDB: base "pianocheck", stores "scores" y "settings".
const DB_NAME = 'pianocheck';
const DB_VERSION = 2;
let dbPromise = null;

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') { reject(new Error('Este navegador no soporta almacenamiento local (IndexedDB).')); return; }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('scores')) db.createObjectStore('scores', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings'); // clave externa
        if (!db.objectStoreNames.contains('attempts')) db.createObjectStore('attempts', { keyPath: 'id' }).createIndex('scoreId', 'scoreId');
      };
      req.onsuccess = () => {
        const db = req.result;
        db.onversionchange = () => { db.close(); dbPromise = null; };
        resolve(db);
      };
      req.onerror = () => { dbPromise = null; reject(req.error || new Error('No se pudo abrir la base de datos.')); };
    });
  }
  return dbPromise;
}

async function run(store, mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    let result;
    const r = fn(tx.objectStore(store));
    if (r) r.onsuccess = () => { result = r.result; };
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Transacción cancelada.'));
  });
}

/** Lista de partituras guardadas (objetos Score completos + updatedAt), la más reciente primero. */
export async function listScores() {
  const all = await run('scores', 'readonly', (s) => s.getAll());
  return (all || []).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

/** Guarda (crea o reemplaza) una partitura. Devuelve la partitura guardada. */
export async function saveScore(score) {
  if (!score || typeof score !== 'object') throw new Error('Partitura inválida.');
  const rec = JSON.parse(JSON.stringify(score));
  if (!rec.id) rec.id = 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  rec.updatedAt = Date.now();
  await run('scores', 'readwrite', (s) => s.put(rec));
  return rec;
}

/** Guarda una partitura tal cual (conserva updatedAt): para importar una biblioteca exportada. */
export async function putScoreRaw(rec) {
  const r = JSON.parse(JSON.stringify(rec));
  if (!r.id) throw new Error('Partitura sin id.');
  if (!Number.isFinite(r.updatedAt)) r.updatedAt = Date.now();
  await run('scores', 'readwrite', (s) => s.put(r));
  return r;
}
/** Guarda un intento tal cual (conserva id y fecha): para importar una biblioteca exportada. */
export async function putAttemptRaw(rec) {
  if (!rec || !rec.id || !rec.scoreId) throw new Error('Intento inválido.');
  await run('attempts', 'readwrite', (s) => s.put(JSON.parse(JSON.stringify(rec))));
}

export async function getScore(id) {
  const r = await run('scores', 'readonly', (s) => s.get(id));
  return r || null;
}

const PDF_IMPORT_KEY = 'pending-pdf-import';
export async function getPendingPdfImport() {
  return (await run('settings', 'readonly', (s) => s.get(PDF_IMPORT_KEY))) || null;
}

export async function savePendingPdfImport(job) {
  await run('settings', 'readwrite', (s) => job ? s.put(job, PDF_IMPORT_KEY) : s.delete(PDF_IMPORT_KEY));
}

/** Escribe el avance en una sola transacción y sin reemplazar otro trabajo. */
export async function updatePendingPdfImport(id, update) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readwrite');
    const settings = tx.objectStore('settings');
    let updated = false;
    const req = settings.get(PDF_IMPORT_KEY);
    req.onsuccess = () => {
      const job = req.result;
      if (job?.id !== id) return;
      const next = update(job);
      if (next) settings.put(next, PDF_IMPORT_KEY);
      else settings.delete(PDF_IMPORT_KEY);
      updated = true;
    };
    tx.oncomplete = () => resolve(updated);
    tx.onabort = () => reject(tx.error || new Error('No se pudo guardar la importación.'));
  });
}

export async function deleteScore(id) {
  await run('scores', 'readwrite', (s) => s.delete(id));
  try { await deleteAttempts(id); } catch (e) { /* sin historial */ }
  try { await deleteAnnotations(id); } catch (e) { /* sin anotaciones */ }
}

/* ---- anotaciones a mano (clave "anno:<id de partitura>" del store de ajustes: no cambia el esquema de la base) ---- */
export async function getAnnotations(scoreId) {
  if (!scoreId) return null;
  return (await run('settings', 'readonly', (s) => s.get('anno:' + scoreId))) || null;
}
/** `data` = lo que devuelve toJSON() del módulo de anotaciones (objeto serializable). Vacío/null borra el registro. */
export async function saveAnnotations(scoreId, data) {
  if (!scoreId) return;
  await run('settings', 'readwrite', (s) => (data ? s.put(JSON.parse(JSON.stringify(data)), 'anno:' + scoreId) : s.delete('anno:' + scoreId)));
}
export async function deleteAnnotations(scoreId) { return saveAnnotations(scoreId, null); }

/* ---- historial de intentos por partitura ---- */

/** Guarda un intento: { scoreId, accuracy, status, total, index, clean, dirty, wrong, hands, range:{from,to}|null, loop, bpm, laps, measuresDone, measuresTotal }.
 *  Los intentos viejos no traen range/loop/bpm: se leen como pieza entera, sin bucle. */
export async function addAttempt(att) {
  if (!att || !att.scoreId) throw new Error('Intento inválido.');
  const rec = { ...att, at: att.at || Date.now(), id: 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) };
  await run('attempts', 'readwrite', (s) => s.put(rec));
  return rec;
}

export async function listAttempts(scoreId) {
  const all = await run('attempts', 'readonly', (s) => (scoreId ? s.index('scoreId').getAll(scoreId) : s.getAll()));
  return (all || []).sort((a, b) => a.at - b.at);
}

export async function deleteAttempts(scoreId) {
  const list = await listAttempts(scoreId);
  if (!list.length) return;
  await run('attempts', 'readwrite', (s) => { list.forEach((a) => s.delete(a.id)); });
}

/**
 * Pura: { count, best, last } (porcentajes) de la PIEZA ENTERA a partir de una lista de intentos.
 * Los intentos de un pasaje o de bucle (range / loop) y los de modo "A pulso" no entran: no son comparables con la pieza completa en "Te espero".
 * `best` sólo considera intentos completos (sin status = datos viejos, se toman como completos).
 */
export function summarizeAttempts(list) {
  const a = (list || []).filter((x) => x && Number.isFinite(x.accuracy) && !x.range && !x.loop && x.mode !== 'pulso').sort((p, q) => p.at - q.at);
  if (!a.length) return { count: 0, best: null, last: null };
  const full = a.filter((x) => !x.status || x.status === 'finished');
  return { count: a.length, best: full.length ? Math.max(...full.map((x) => x.accuracy)) : null, last: a[a.length - 1].accuracy };
}

/** Mapa scoreId → resumen para toda la biblioteca. */
export async function attemptSummaries() {
  const by = {};
  for (const a of await listAttempts()) (by[a.scoreId] ||= []).push(a);
  const out = {};
  for (const k of Object.keys(by)) out[k] = summarizeAttempts(by[k]);
  return out;
}

export async function getSettings() {
  const r = await run('settings', 'readonly', (s) => s.get('app'));
  return r || {};
}

/** Mezcla `obj` con los ajustes existentes y devuelve el resultado. */
export async function saveSettings(obj) {
  const cur = await getSettings();
  const next = { ...cur, ...(obj || {}) };
  await run('settings', 'readwrite', (s) => s.put(next, 'app'));
  return next;
}

/* ---- progreso de Teoría (clave "theory" del store de ajustes: no cambia el esquema de la base) ---- */

/** Porcentaje mínimo para dar por completada una tonalidad en una lección. */
export const THEORY_PASS = 80;

/** Porcentaje mínimo para dar por dominada una tonalidad (ejercicio completado en esa tonalidad). */
export const MASTER_PCT = 90;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DAYS = 400;

/** Día local "AAAA-MM-DD" de una marca de tiempo (para la racha). */
export function theoryDayKey(ts = Date.now()) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Normaliza lo guardado: { lessons: { [lessonId]: { best:{[ejercicio]:{correct,total,pct,key,at}}, keys:string[], mastered:string[], runs:number } }, days?: string[] }.
 *  `days` (días con algún ejercicio completado, "AAAA-MM-DD") sólo aparece si hay alguno. Lo viejo sin `mastered` se deriva de `best`. */
export function normalizeTheory(raw) {
  const out = { lessons: {} };
  const src = raw && typeof raw === 'object' && raw.lessons && typeof raw.lessons === 'object' ? raw.lessons : {};
  for (const id of Object.keys(src)) {
    const l = src[id] || {};
    const best = l.best && typeof l.best === 'object' ? { ...l.best } : {};
    const mastered = Array.isArray(l.mastered) ? l.mastered.filter((k) => typeof k === 'string') : [];
    for (const b of Object.values(best)) if (b && b.key && Number.isFinite(b.pct) && b.pct >= MASTER_PCT && !mastered.includes(b.key)) mastered.push(b.key);
    out.lessons[id] = {
      best,
      keys: Array.isArray(l.keys) ? l.keys.filter((k) => typeof k === 'string') : [],
      mastered,
      runs: Number.isFinite(l.runs) ? l.runs : 0,
    };
  }
  const days = Array.isArray(raw && raw.days) ? [...new Set(raw.days.filter((d) => typeof d === 'string' && DAY_RE.test(d)))].sort().slice(-MAX_DAYS) : [];
  if (days.length) out.days = days;
  return out;
}

/**
 * Pura: suma un resultado. Guarda el mejor puntaje por ejercicio; marca la tonalidad como completada si pct >= THEORY_PASS
 * y como dominada si pct >= MASTER_PCT; anota el día (racha).
 * @returns nuevo objeto de progreso (no muta el recibido)
 */
export function recordTheory(progress, lessonId, exercise, keyId, correct, total, now = Date.now()) {
  const cur = normalizeTheory(progress);
  const l = cur.lessons[lessonId] || { best: {}, keys: [], mastered: [], runs: 0 };
  const t = Math.max(0, Math.floor(total) || 0);
  const c = Math.max(0, Math.min(t, Math.floor(correct) || 0));
  const pct = t ? Math.round((c / t) * 100) : 0;
  const prev = l.best[exercise];
  if (!prev || pct > prev.pct) l.best[exercise] = { correct: c, total: t, pct, key: keyId || null, at: now };
  if (keyId && pct >= THEORY_PASS && !l.keys.includes(keyId)) l.keys.push(keyId);
  if (keyId && pct >= MASTER_PCT && !l.mastered.includes(keyId)) l.mastered.push(keyId);
  l.runs += 1;
  cur.lessons[lessonId] = l;
  cur.days = [...new Set([...(cur.days || []), theoryDayKey(now)])].sort().slice(-MAX_DAYS);
  return cur;
}

/** Pura: tonalidades dominadas (pct >= MASTER_PCT) de una lección. */
export function masteredKeys(progress, lessonId) {
  const l = normalizeTheory(progress).lessons[lessonId];
  return l ? l.mastered.slice() : [];
}

/** Pura: días con algún ejercicio de Teoría completado (ordenados). */
export function theoryDays(progress) {
  return normalizeTheory(progress).days || [];
}

/** Pura: { best (mejor % entre ejercicios o null), keys (tonalidades completadas), byExercise, runs } de una lección. */
export function theorySummary(progress, lessonId) {
  const l = normalizeTheory(progress).lessons[lessonId];
  if (!l) return { best: null, keys: [], byExercise: {}, runs: 0 };
  const pcts = Object.values(l.best).map((b) => b.pct).filter(Number.isFinite);
  return { best: pcts.length ? Math.max(...pcts) : null, keys: l.keys.slice(), byExercise: l.best, runs: l.runs };
}

export async function getTheoryProgress() {
  return normalizeTheory(await run('settings', 'readonly', (s) => s.get('theory')));
}

/** Registra un resultado en IndexedDB y devuelve el progreso actualizado. */
export async function saveTheoryResult(lessonId, exercise, keyId, correct, total) {
  const next = recordTheory(await getTheoryProgress(), lessonId, exercise, keyId, correct, total);
  await run('settings', 'readwrite', (s) => s.put(next, 'theory'));
  return next;
}
