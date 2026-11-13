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
  const st = { score: {}, anno: {}, attempt: {}, take: {}, audio: {}, theory: { main: { lessons: {} } }, settings: { app: {} }, practice: { own: { days: {} } }, practiceRemote: {} };
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

test("audio: sólo viaja el de tomas marcadas y llega a otros dispositivos que ya tienen la toma", async () => {
  const { splitAudio, joinAudio, AUDIO_CHUNK, MAX_AUDIO_CHARS } = await import("../js/sync-core.js");
  const big = "A".repeat(AUDIO_CHUNK * 2 + 5);
  const parts = splitAudio("t1", "audio/webm", big, 1);
  assert.equal(parts.length, 3); assert.equal(joinAudio(parts.map((p) => p.data)).b64, big);
  assert.equal(joinAudio(parts.slice(1).map((p) => p.data)), null); assert.equal(splitAudio("t", "x", "A".repeat(MAX_AUDIO_CHARS + 1), 1), null);
  const r = fakeRemote(); r.removeAudio = async (id) => { for (const k of Object.keys(r.db.audio || {})) if (k.startsWith(id + "~")) delete r.db.audio[k]; };
  const A = mk(r, "A", 1000), B = mk(r, "B", 1000);
  const origGet = A.local.get; A.local.get = async (k, id) => (k === "audio" ? (A.local.st.take[id] && A.local.st.take[id].syncAudio ? { mime: "audio/webm", b64: "QUJD" } : null) : origGet(k, id));
  B.local.put = async (k, id, rec) => { if (k === "audio") { B.local.st.take[id].hasAudio = true; B.local.audio = rec; } else if (k === "take") B.local.st.take[id] = { ...rec }; };
  A.local.st.take.t1 = { id: "t1", scoreId: "s", hasAudio: true, syncAudio: true, events: [] }; A.local.st.take.t2 = { id: "t2", scoreId: "s", hasAudio: true, events: [] };
  await A.eng.markDirty("take", "t1"); await A.eng.markDirty("take", "t2"); await A.eng.markDirty("audio", "t1"); await A.eng.markDirty("audio", "t2");
  await A.eng.sync(); assert.deepEqual(Object.keys(r.db.audio), ["t1~0"]);
  await B.eng.sync(); assert.equal(B.local.audio.b64, "QUJD"); assert.equal(B.local.st.take.t2.hasAudio, false);
  A.local.st.take.t1.syncAudio = false; A.clock.t = 5000; await A.eng.markDirty("audio", "t1"); await A.eng.sync();
  assert.deepEqual(Object.keys(r.db.audio || {}), []);
});
test("una API key vacía no pisa la de la nube", () => {
  assert.deepEqual(pickSettings({ scoreTheme: "x", apiKey: "" }, true), { scoreTheme: "x" });
});
