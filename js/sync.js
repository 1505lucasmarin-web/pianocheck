// Cuenta de Google + sincronización entre dispositivos (Firebase: Auth + Firestore). Todo carga bajo demanda desde vendor/firebase.mjs.
// Estructura en Firestore: users/{uid}/{scores|annos|attempts|takes|practice|meta}/{id} con { u, json } o { u, deleted:true }.
// El audio de las tomas y (por defecto) la API key NUNCA se suben.
import * as store from './store.js';
import { createEngine } from './sync-engine.js';
import { COLLECTIONS, sumLogs } from './sync-core.js';

export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAwx0sA6VPKGu_YVfE_Yn6MKeJ5aaRN5bk',
  authDomain: 'pianocheck-b0920.firebaseapp.com',
  projectId: 'pianocheck-b0920',
  storageBucket: 'pianocheck-b0920.firebasestorage.app',
  messagingSenderId: '721091398191',
  appId: '1:721091398191:web:45e291fca11b23f96194da',
};
export const FIRESTORE_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}`;

const TIMEOUT_MS = 25000;
const withTimeout = (p, ms = TIMEOUT_MS) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('Sin conexión con la nube (tiempo agotado).')), ms))]);

let listenerAttached = false, fb = null, app = null, auth = null, db = null, user = null, engine = null, deviceId = null, listener = () => {}, timer = null, state = { status: 'off', message: '', lastSync: 0, email: '', syncKey: false };

const emit = (patch) => { state = { ...state, ...patch }; try { listener({ ...state }); } catch (e) { /* UI */ } };
export const getState = () => ({ ...state });

async function loadFirebase() {
  if (!fb) {
    fb = await import('../vendor/firebase.mjs');
    app = fb.initializeApp(FIREBASE_CONFIG);
    auth = fb.getAuth(app);
    db = fb.initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
  }
  return fb;
}

async function blobToB64(blob) {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
  return btoa(s);
}
function b64ToBlob(b64, mime) {
  const bin = atob(b64), u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return new Blob([u], { type: mime || 'audio/webm' });
}

/* ---- adaptador local (IndexedDB vía store.js) ---- */
const local = {
  getMeta: () => store.getSyncMeta(),
  setMeta: (m) => store.saveSyncMeta(m),
  async get(kind, id) {
    if (kind === 'score') return store.getScore(id);
    if (kind === 'anno') return store.getAnnotations(id);
    if (kind === 'attempt') return ((await store.listAttempts()) || []).find((a) => a.id === id) || null;
    if (kind === 'take') return store.getTake(id);
    if (kind === 'audio') {                                     // sólo las tomas que el usuario marcó
      const t = await store.getTake(id);
      if (!t || !t.syncAudio || !t.hasAudio) return null;
      const a = await store.getTakeAudio(id);
      return a && a.blob ? { mime: a.mime, b64: await blobToB64(a.blob) } : null;
    }
    if (kind === 'theory') return store.getTheoryProgress();
    if (kind === 'settings') return store.getSettings();
    if (kind === 'practice') return store.getOwnPracticeLog();
    return null;
  },
  async put(kind, id, rec) {
    await store.withoutNotify(async () => {
      if (kind === 'score') await store.putScoreRaw(rec);
      else if (kind === 'anno') await store.putAnnotationsRaw(id, rec);
      else if (kind === 'attempt') await store.putAttemptRaw(rec);
      else if (kind === 'take') await store.saveTake(rec);
      else if (kind === 'audio') await store.putTakeAudio(id, b64ToBlob(rec.b64, rec.mime), rec.mime);
      else if (kind === 'theory') await store.putTheoryRaw(rec);
      else if (kind === 'settings') await store.saveSettings(rec);
      else if (kind === 'practiceRemote') await store.putPracticeRemote(id, rec);
    });
  },
  async remove(kind, id) {
    await store.withoutNotify(async () => {
      if (kind === 'score') await store.deleteScore(id);
      else if (kind === 'anno') await store.deleteAnnotations(id);
      else if (kind === 'take') await store.deleteTakes([id]);
    });
  },
  async listAll(kind) {
    if (kind === 'audio') return ((await store.listTakes()) || []).filter((t) => t.syncAudio).map((t) => ({ id: t.id }));
    return ((await store.listIds(kind)) || []).map((id) => ({ id })); },
};

/* ---- adaptador remoto (Firestore) ---- */
const remote = {
  async pull(coll, since) {
    const f = fb, col = f.collection(db, 'users', user.uid, coll);
    const snap = await withTimeout(f.getDocs(f.query(col, f.where('u', '>', since))));
    return snap.docs.map((d) => ({ id: d.id, data: d.data() }));
  },
  async push(docs) {
    const f = fb, b = f.writeBatch(db);
    for (const d of docs) b.set(f.doc(db, 'users', user.uid, d.coll, d.id), d.data);
    await withTimeout(b.commit());
  },
  async removeAudio(takeId) {
    const f = fb, snap = await withTimeout(f.getDocs(f.query(f.collection(db, 'users', user.uid, 'audio'), f.where('takeId', '==', takeId))));
    if (snap.empty) return;
    const b = f.writeBatch(db); snap.docs.forEach((d) => b.delete(d.ref)); await withTimeout(b.commit());
  },
};

async function getDeviceId() {
  const m = (await store.getSyncMeta()) || {};
  if (m.deviceId) return m.deviceId;
  const id = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  await store.saveSyncMeta({ ...m, deviceId: id });
  return id;
}

async function startEngine() {
  deviceId = await getDeviceId();
  engine = createEngine({ local, remote, deviceId });
  const m = await engine.loadMeta();
  if (m.syncKey === undefined) m.syncKey = true;   // la API key sincroniza por defecto (se puede apagar en Ajustes)
  const first = m.uid !== user.uid;
  if (first) { m.uid = user.uid; m.lastPull = {}; m.dirty = {}; m.deviceId = deviceId; await engine.saveMeta(); await engine.markAllDirty(); }
  emit({ syncKey: !!m.syncKey });
  store.onChange((kind, id) => { engine.markDirty(kind, id).catch(() => {}); schedule(20000); });
}

function schedule(ms) { clearTimeout(timer); timer = setTimeout(() => { syncNow().catch(() => {}); }, ms); }

/** Una pasada de sincronización. Devuelve { changed:Set, pushed } o null si no hay sesión. */
export async function syncNow() {
  if (!engine || !user) return null;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) { emit({ status: 'offline', message: 'Sin conexión: se sincroniza cuando vuelva.' }); return null; }
  emit({ status: 'syncing', message: 'Sincronizando…' });
  try {
    const res = await engine.sync();
    emit({ status: 'ok', message: '', lastSync: Date.now() });
    if (res.changed.size) try { window.dispatchEvent(new CustomEvent('pianocheck-synced', { detail: { changed: [...res.changed] } })); } catch (e) { /* sin ventana */ }
    return res;
  } catch (e) {
    emit({ status: 'error', message: friendly(e) });
    schedule(120000);
    throw e;
  }
}

function friendly(e) {
  const c = (e && e.code) || '';
  if (/permission-denied/.test(c)) return 'La nube rechazó el acceso: revisá las reglas de Firestore (Ajustes → ayuda de cuenta).';
  if (/unavailable|network/.test(c)) return 'No hay conexión con la nube por ahora. Se reintenta solo.';
  if (/not-found|failed-precondition/.test(c)) return 'Falta crear la base Firestore en el proyecto de Firebase.';
  return (e && e.message) || 'No se pudo sincronizar.';
}

/** Arranca la escucha de sesión. Llamar una vez al abrir la app; no descarga Firebase si nunca se inició sesión. */
export async function init(onState) {
  listener = onState || listener;
  const m = await store.getSyncMeta();
  if (!m || !m.uid) { emit({ status: 'off', syncKey: !!(m && m.syncKey) }); return; }   // nunca se inició sesión: no se carga nada
  await attach();
}

async function attach() {
  if (listenerAttached) return;
  listenerAttached = true;
  const f = await loadFirebase();
  try { await f.getRedirectResult(auth); } catch (e) { emit({ status: 'error', message: friendly(e) }); }
  f.onAuthStateChanged(auth, async (u) => {
    user = u;
    if (!u) { engine = null; store.onChange(null); emit({ status: 'off', email: '', message: '' }); return; }
    emit({ email: u.email || '', status: 'syncing' });
    try { await startEngine(); await syncNow(); } catch (e) { emit({ status: 'error', message: friendly(e) }); }
    window.addEventListener('online', () => schedule(2000));
    document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(3000); });
  });
}

export async function signIn() {
  const f = await loadFirebase();
  const provider = new f.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try { await f.signInWithPopup(auth, provider); }
  catch (e) {
    if (e && /popup-blocked|operation-not-supported|web-storage/.test(e.code || '')) { await f.signInWithRedirect(auth, provider); return; }
    if (e && /popup-closed|cancelled/.test(e.code || '')) return;
    emit({ status: 'error', message: /unauthorized-domain/.test(e.code || '') ? 'Dominio no autorizado: agregalo en Firebase → Authentication → Configuración → Dominios autorizados.' : friendly(e) });
    throw e;
  }
  await attach();
}

export async function signOut() {
  if (auth) await fb.signOut(auth);
  store.onChange(null); engine = null; user = null;
  const m = (await store.getSyncMeta()) || {};
  await store.saveSyncMeta({ deviceId: m.deviceId, syncKey: m.syncKey });   // se queda en este dispositivo todo lo que ya había; sólo se corta el vínculo
  emit({ status: 'off', email: '', message: '', lastSync: 0 });
}

/** Activa/desactiva la subida de la API key a la cuenta (por defecto NO). */
export async function setSyncKey(on) {
  const m = (await store.getSyncMeta()) || {};
  m.syncKey = !!on;
  if (engine) { await engine.loadMeta(); engine.meta.syncKey = !!on; if (on) await engine.markDirty('settings', 'app'); await engine.saveMeta(); schedule(500); }
  else await store.saveSyncMeta(m);
  emit({ syncKey: !!on });
}
export { sumLogs, COLLECTIONS };
