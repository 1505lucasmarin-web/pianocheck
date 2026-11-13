// Motor de sincronización: independiente de Firebase y de IndexedDB (recibe adaptadores `local` y `remote`), así se prueba con memoria.
// local:  getMeta/setMeta, get(kind,id), put(kind,id,rec), remove(kind,id), listAll(kind) -> [{id}]
// remote: pull(coll, sinceMs) -> [{id, data}], push([{coll,id,data}])
import { COLLECTIONS, PULL_OVERLAP_MS, docId, packDoc, tombstone, unpackDoc, pickSettings, settingsToApply, mergeTheory, sameJSON, chunk } from './sync-core.js';

const PULL_ORDER = ['scores', 'annos', 'attempts', 'takes', 'practice', 'meta'];
const KIND_OF = { scores: 'score', annos: 'anno', attempts: 'attempt', takes: 'take' };
const TOMBSTONE_KINDS = new Set(['score', 'anno', 'take']);

export function createEngine({ local, remote, deviceId, now = () => Date.now() }) {
  let meta = null, busy = null;
  const keyOf = (kind, id) => kind + ':' + id;
  async function loadMeta() { if (!meta) meta = (await local.getMeta()) || {}; meta.dirty ||= {}; meta.lastPull ||= {}; return meta; }
  const saveMeta = () => local.setMeta(meta);

  async function markDirty(kind, id) { await loadMeta(); meta.dirty[keyOf(kind, id || '')] = now(); if (kind === 'settings') meta.settingsU = now(); await saveMeta(); }
  async function markAllDirty() {
    await loadMeta();
    for (const kind of ['score', 'anno', 'attempt', 'take']) for (const { id } of await local.listAll(kind)) meta.dirty[keyOf(kind, id)] = now();
    for (const k of ['theory:main', 'settings:app', 'practice:own']) meta.dirty[k] = now();
    meta.settingsU = meta.settingsU || 0;
    await saveMeta();
  }

  async function push() {
    await loadMeta();
    const entries = Object.entries(meta.dirty), docs = [], sent = [], skipped = [];
    for (const [key, stamp] of entries) {
      const i = key.indexOf(':'), kind = key.slice(0, i), id = key.slice(i + 1);
      let rec;
      if (kind === 'theory') rec = await local.get('theory', 'main');
      else if (kind === 'settings') { const s = await local.get('settings', 'app'); rec = pickSettings(s, !!meta.syncKey); }
      else if (kind === 'practice') rec = await local.get('practice', 'own');
      else rec = await local.get(kind, id);
      const t = now();
      let data;
      if (rec == null) { if (!TOMBSTONE_KINDS.has(kind)) { sent.push([key, stamp]); continue; } data = tombstone(t); }
      else { data = packDoc(rec, t); if (!data) { skipped.push(key); sent.push([key, stamp]); continue; } }
      docs.push({ coll: COLLECTIONS[kind], id: kind === 'practice' ? deviceId : docId(kind, id), data });
      sent.push([key, stamp]);
    }
    for (const part of chunk(docs, 400)) await remote.push(part);
    await loadMeta();
    for (const [key, stamp] of sent) if (meta.dirty[key] === stamp) delete meta.dirty[key];
    await saveMeta();
    return { pushed: docs.length, skipped };
  }

  async function pull() {
    await loadMeta();
    const changed = new Set();
    for (const coll of PULL_ORDER) {
      const since = Math.max(0, (meta.lastPull[coll] || 0) - PULL_OVERLAP_MS);
      const docs = await remote.pull(coll, since);
      let maxU = meta.lastPull[coll] || 0;
      for (const { id, data } of docs) {
        const d = unpackDoc(data);
        if (!d) continue;
        if (d.u > maxU) maxU = d.u;
        if (await apply(coll, id, d)) changed.add(coll);
      }
      meta.lastPull[coll] = maxU;
    }
    await saveMeta();
    return changed;
  }

  async function apply(coll, id, d) {
    const kind = KIND_OF[coll];
    if (kind) {
      const cur = await local.get(kind, id);
      if (!cur && meta.dirty[keyOf(kind, id)]) return false;   // borrado local todavía sin subir: no lo resucitamos
      if (d.deleted) {
        if (!cur) return false;
        const stamp = kind === 'score' ? cur.updatedAt : kind === 'anno' ? cur._u : 0;
        if ((stamp || 0) > d.u) return false;
        await local.remove(kind, id); return true;
      }
      const r = d.rec;
      if (kind === 'score') { if (cur && (cur.updatedAt || 0) >= (r.updatedAt || 0)) return false; await local.put('score', id, r); return true; }
      if (kind === 'anno') { if (cur && (cur._u || 0) >= (r._u || 0)) return false; await local.put('anno', id, r); return true; }
      if (cur) return false;                                   // intentos y tomas no cambian una vez creados
      await local.put(kind, id, kind === 'take' ? { ...r, hasAudio: false } : r); return true;
    }
    if (coll === 'practice') {
      if (id === deviceId || d.deleted) return false;
      await local.put('practiceRemote', id, d.rec); return true;
    }
    if (coll === 'meta' && id === 'theory' && !d.deleted) {
      const cur = await local.get('theory', 'main');
      const merged = mergeTheory(cur, d.rec);
      if (sameJSON(merged, cur)) return false;
      await local.put('theory', 'main', merged);
      if (!sameJSON(merged, d.rec)) meta.dirty['theory:main'] = now();
      return true;
    }
    if (coll === 'meta' && id === 'settings' && !d.deleted) {
      if (d.u <= (meta.settingsU || 0)) return false;
      const patch = settingsToApply(d.rec, !!meta.syncKey);
      meta.settingsU = d.u;
      await local.put('settings', 'app', patch); return true;
    }
    return false;
  }

  /** Una pasada completa: baja lo nuevo y sube lo pendiente. Nunca corre dos a la vez. */
  function sync() {
    if (busy) return busy;
    busy = (async () => {
      const changed = await pull();
      const up = await push();
      return { changed, pushed: up.pushed, skipped: up.skipped };
    })().finally(() => { busy = null; });
    return busy;
  }
  return { sync, markDirty, markAllDirty, loadMeta, saveMeta, get meta() { return meta; }, resetPull() { if (meta) { meta.lastPull = {}; } } };
}
