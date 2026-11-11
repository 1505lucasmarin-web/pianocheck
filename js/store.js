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

export async function getScore(id) {
  const r = await run('scores', 'readonly', (s) => s.get(id));
  return r || null;
}

export async function deleteScore(id) {
  await run('scores', 'readwrite', (s) => s.delete(id));
  try { await deleteAttempts(id); } catch (e) { /* sin historial */ }
}

/* ---- historial de intentos por partitura ---- */

/** Guarda un intento: { scoreId, accuracy, status, total, index, clean, dirty, wrong, hands }. */
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

/** Pura: { count, best, last } (porcentajes) a partir de una lista de intentos. */
export function summarizeAttempts(list) {
  const a = (list || []).filter((x) => x && Number.isFinite(x.accuracy)).sort((p, q) => p.at - q.at);
  if (!a.length) return { count: 0, best: null, last: null };
  return { count: a.length, best: Math.max(...a.map((x) => x.accuracy)), last: a[a.length - 1].accuracy };
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
