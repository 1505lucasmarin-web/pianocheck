import test from "node:test";
import assert from "node:assert/strict";
import { createEngine } from "../js/sync-engine.js";
import { sumLogs, mergeTheory, pickSettings, settingsToApply, packDoc, unpackDoc, MAX_DOC_CHARS, docId } from "../js/sync-core.js";

function fakeRemote() {
  const db = {};
  return { db,
    async pull(coll, since) { return Object.entries(db[coll] || {}).filter(([, d]) => d.u > since).map(([id, data]) => ({ id, data })); },
    async push(docs) { for (const d of docs) ((db[d.coll] ||= {})[d.id] = JSON.parse(JSON.stringify(d.data))); } };
}
function fakeLocal() {
  const st = { score: {}, anno: {}, attempt: {}, take: {}, theory: { main: { lessons: {} } }, settings: { app: {} }, practice: { own: { days: {} } }, practiceRemote: {} };
  let meta = null;
  return { st,
    async getMeta() { return meta; }, async setMeta(m) { meta = JSON.parse(JSON.stringify(m)); },
    async get(k, id) { return st[k][id] ? JSON.parse(JSON.stringify(st[k][id])) : null; },
    async put(k, id, rec) { st[k][id] = k === 'settings' ? { ...st.settings.app, ...rec } : JSON.parse(JSON.stringify(rec)); },
    async remove(k, id) { delete st[k][id]; },
    async listAll(k) { return Object.keys(st[k]).map((id) => ({ id })); } };
}
const mk = (remote, deviceId, t) => { const local = fakeLocal(); const clock = { t }; const eng = createEngine({ local, remote, deviceId, now: () => clock.t }); return { local, eng, clock }; };

test("una partitura creada en A aparece en B; borrar en B la borra en A", async () => {
  const r = fakeRemote(), A = mk(r, 'A', 1000), B = mk(r, 'B', 1000);
  A.local.st.score.s1 = { id: 's1', title: 'X', updatedAt: 500 };
  await A.eng.markDirty('score', 's1'); await A.eng.sync();
  const res = await B.eng.sync();
  assert.deepEqual(B.local.st.score.s1.title, 'X'); assert.ok(res.changed.has('scores'));
  delete B.local.st.score.s1; B.clock.t = 5000; await B.eng.markDirty('score', 's1'); await B.eng.sync();
  A.clock.t = 6000; await A.eng.sync();
  assert.equal(A.local.st.score.s1, undefined);
});
test("gana la versión más nueva de una partitura", async () => {
  const r = fakeRemote(), A = mk(r, 'A', 1000), B = mk(r, 'B', 1000);
  A.local.st.score.s1 = { id: 's1', title: 'viejo', updatedAt: 100 }; await A.eng.markDirty('score', 's1'); await A.eng.sync(); await B.eng.sync();
  B.local.st.score.s1 = { id: 's1', title: 'nuevo', updatedAt: 900 }; B.clock.t = 2000; await B.eng.markDirty('score', 's1'); await B.eng.sync();
  A.clock.t = 3000; await A.eng.sync();
  assert.equal(A.local.st.score.s1.title, 'nuevo');
});
test("intentos y tomas se unen; la toma llega sin audio", async () => {
  const r = fakeRemote(), A = mk(r, 'A', 1000), B = mk(r, 'B', 1000);
  A.local.st.attempt.a1 = { id: 'a1', scoreId: 's1', at: 1 }; B.local.st.attempt.a2 = { id: 'a2', scoreId: 's1', at: 2 };
  A.local.st.take.t1 = { id: 't1', scoreId: 's1', hasAudio: true, events: [[0, 60, 90, null]] };
  for (const [d, k, id] of [[A, 'attempt', 'a1'], [B, 'attempt', 'a2'], [A, 'take', 't1']]) await d.eng.markDirty(k, id);
  await A.eng.sync(); await B.eng.sync(); A.clock.t = 3000; await A.eng.sync();
  assert.ok(A.local.st.attempt.a2 && B.local.st.attempt.a1);
  assert.equal(B.local.st.take.t1.hasAudio, false); assert.deepEqual(B.local.st.take.t1.events, [[0, 60, 90, null]]);
});
test("el tiempo de práctica se suma entre dispositivos sin pisarse", async () => {
  const r = fakeRemote(), A = mk(r, 'A', 1000), B = mk(r, 'B', 1000);
  A.local.st.practice.own = { days: { '2026-11-13': { s1: 60 } } }; B.local.st.practice.own = { days: { '2026-11-13': { s1: 30 } } };
  await A.eng.markDirty('practice', 'own'); await B.eng.markDirty('practice', 'own');
  await A.eng.sync(); await B.eng.sync(); A.clock.t = 3000; await A.eng.sync();
  const total = sumLogs(A.local.st.practice.own, ...Object.values(A.local.st.practiceRemote));
  assert.equal(total.days['2026-11-13'].s1, 90);
});
test("Teoría se fusiona y los ajustes viajan sin la API key", async () => {
  const r = fakeRemote(), A = mk(r, 'A', 1000), B = mk(r, 'B', 1000);
  A.local.st.theory.main = { lessons: { l1: { best: { e: { pct: 70 } }, keys: ['C'], mastered: [], runs: 1 } } };
  B.local.st.theory.main = { lessons: { l1: { best: { e: { pct: 90 } }, keys: ['G'], mastered: ['G'], runs: 2 } } };
  A.local.st.settings.app = { scoreTheme: 'sepia', apiKey: 'SECRETO', timbre: 'piano' };
  await A.eng.markDirty('theory', 'main'); await B.eng.markDirty('theory', 'main'); await A.eng.markDirty('settings', 'app');
  await A.eng.sync(); await B.eng.sync(); A.clock.t = 3000; await A.eng.sync();
  assert.deepEqual(A.local.st.theory.main.lessons.l1.keys.sort(), ['C', 'G']); assert.equal(A.local.st.theory.main.lessons.l1.best.e.pct, 90);
  assert.equal(B.local.st.settings.app.scoreTheme, 'sepia'); assert.equal(B.local.st.settings.app.apiKey, undefined);
  assert.ok(!JSON.stringify(r.db).includes('SECRETO'));
});
test("con la opción activada, la key viaja sólo a quien también la activó", async () => {
  const r = fakeRemote(), A = mk(r, 'A', 1000), B = mk(r, 'B', 1000), C = mk(r, 'C', 1000);
  await A.eng.loadMeta(); A.eng.meta.syncKey = true; await B.eng.loadMeta(); B.eng.meta.syncKey = true;
  A.local.st.settings.app = { apiKey: 'K1', provider: 'gemini' }; await A.eng.markDirty('settings', 'app'); await A.eng.sync();
  await B.eng.sync(); await C.eng.sync();
  assert.equal(B.local.st.settings.app.apiKey, 'K1'); assert.equal(C.local.st.settings.app.apiKey, undefined);
});
test("lo pendiente se conserva si falla la subida y se reintenta", async () => {
  const r = fakeRemote(), A = mk(r, 'A', 1000); let fail = true; const push = r.push;
  r.push = async (d) => { if (fail) throw new Error('sin red'); return push(d); };
  A.local.st.score.s1 = { id: 's1', updatedAt: 1 }; await A.eng.markDirty('score', 's1');
  await assert.rejects(A.eng.sync()); assert.ok(A.eng.meta.dirty['score:s1']);
  fail = false; await A.eng.sync(); assert.ok(r.db.scores.s1); assert.equal(A.eng.meta.dirty['score:s1'], undefined);
});
test("primer inicio de sesión: sube todo lo local", async () => {
  const r = fakeRemote(), A = mk(r, 'A', 1000);
  A.local.st.score.s1 = { id: 's1', updatedAt: 1 }; A.local.st.attempt.a1 = { id: 'a1', scoreId: 's1', at: 1 };
  await A.eng.markAllDirty(); const res = await A.eng.sync();
  assert.ok(r.db.scores.s1 && r.db.attempts.a1 && r.db.meta.theory && r.db.practice.A); assert.ok(res.pushed >= 4);
});
test("documentos enormes se omiten; ids y packDoc", () => {
  assert.equal(packDoc({ x: 'a'.repeat(MAX_DOC_CHARS) }, 1), null);
  assert.deepEqual(unpackDoc(packDoc({ a: [[1, 2]] }, 5)), { deleted: false, u: 5, rec: { a: [[1, 2]] } });
  assert.equal(docId('score', 'a/b'), 'a_b'); assert.equal(unpackDoc({ deleted: true, u: 3 }).deleted, true);
  assert.deepEqual(pickSettings({ scoreTheme: 'x', apiKey: 'k', micSensitivity: 1 }), { scoreTheme: 'x' });
  assert.deepEqual(settingsToApply({ scoreTheme: 'x', apiKey: 'k' }, true), { scoreTheme: 'x', apiKey: 'k' });
  assert.deepEqual(mergeTheory(null, null), { lessons: {} });
});
