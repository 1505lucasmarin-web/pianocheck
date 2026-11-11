import test from 'node:test';
import assert from 'node:assert/strict';
import { composeScore, normalizeScore, fitHand, buildComposeUserPrompt, COMPOSE_SYSTEM_PROMPT, buildComposeRequest } from '../js/compose.js';
import { summarizeAttempts } from '../js/store.js';
import { buildSteps, durBeats } from '../js/model.js';

const GOOD = { title: 'Para Elisa', bpm: 90, timeSig: [3, 4], keySig: 'Am', measures: [
  { rh: [{ k: ['e/5'], d: 'q' }, { k: ['d#/5'], d: 'q' }, { k: ['e/5'], d: 'q' }], lh: [{ k: ['a/2'], d: 'h', dots: 1 }] },
  { rh: [{ k: ['e/5'], d: 'h', dots: 1 }], lh: [{ k: ['a/2', 'e/3'], d: 'h', dots: 1 }] },
] };
const resp = (status, obj) => ({ ok: status < 300, status, text: async () => (typeof obj === 'string' ? obj : JSON.stringify(obj)) });
const anth = (text, extra = {}) => async () => resp(200, { stop_reason: 'end_turn', content: [{ type: 'text', text }], ...extra });
const base = (fetchImpl, extra = {}) => ({ query: 'Para Elisa', level: 'principiante', hands: 'dos-manos', provider: 'anthropic', apiKey: 'k', fetchImpl, ...extra });
const total = (evs) => evs.reduce((a, e) => a + durBeats(e), 0);

test('respuesta válida', async () => {
  const msgs = []; let sent;
  const s = await composeScore(base(async (u, init) => { sent = JSON.parse(init.body); return anth('```json\n' + JSON.stringify(GOOD) + '\n```')(); }, { onProgress: (m) => msgs.push(m) }));
  assert.equal(s.title, 'Para Elisa');
  assert.equal(s.measures.length, 2);
  assert.equal(s.level, 'principiante');
  assert.deepEqual(s.timeSig, [3, 4]);
  assert.ok(msgs.length >= 2);
  assert.match(sent.messages[0].content, /Para Elisa/);
  assert.ok(buildSteps(s).length > 0);
});

test('gemini válida', async () => {
  let url;
  const f = async (u) => { url = u; return resp(200, { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(GOOD) }] } }] }); };
  const s = await composeScore(base(f, { provider: 'gemini', level: 'pro' }));
  assert.match(url, /generateContent$/);
  assert.equal(s.level, 'pro');
});

test('respuesta con error del modelo', async () => {
  await assert.rejects(composeScore(base(anth('{"error":"No conozco esa pieza con certeza"}'))), (e) => /^La IA no pudo armar esta partitura: No conozco esa pieza con certeza\./.test(e.message) && /otra pieza/.test(e.message) && /foto/.test(e.message));
});

test('negativa en texto libre', async () => {
  await assert.rejects(composeScore(base(anth('Lo siento, no puedo escribir esa partitura.'))), /La IA no pudo armar esta partitura: Lo siento/);
  await assert.rejects(composeScore(base(async () => resp(200, { stop_reason: 'refusal', content: [] }))), /La IA no pudo armar esta partitura/);
});

test('JSON sin compases o roto', async () => {
  await assert.rejects(composeScore(base(anth('{"title":"x"}'))), /no pudo armar/);
  await assert.rejects(composeScore(base(anth('{"title":"x","measures":[{"rh":[],"lh":[]}]}'))), /no encontró notas/);
  await assert.rejects(composeScore(base(anth('{"title": '))), /interpretar/);
});

test('compases que no suman se normalizan', async () => {
  const bad = { title: 'X', timeSig: [4, 4], measures: [
    { rh: [{ k: ['c/4'], d: 'q' }, { k: ['d/4'], d: 'q' }], lh: [] },                                  // falta
    { rh: [{ k: ['c/4'], d: 'h' }, { k: ['e/4'], d: 'h', dots: 1 }, { k: ['g/4'], d: 'q' }], lh: [{ k: ['c/3'], d: 'w' }, { k: ['c/3'], d: 'q' }] }, // sobra
  ] };
  const s = await composeScore(base(anth(JSON.stringify(bad)), { level: 'intermedio' }));
  for (const m of s.measures) for (const h of ['rh', 'lh']) assert.equal(total(m[h]), 4, h);
  assert.deepEqual(s.measures[0].lh, [{ k: [], d: 'w' }]);
  const m1 = s.measures[1].rh; // h + (h. recortada a h) con ligadura implícita no necesaria
  assert.equal(m1.length, 2);
  assert.equal(m1[1].d, 'h');
  assert.equal(s.measures[1].lh.length, 1);
  assert.equal(s.level, 'intermedio');
});

test('fitHand: nota cortada se parte con ligadura y silencios completan', () => {
  const r = fitHand([{ k: ['c/4'], d: 'q' }, { k: ['d/4'], d: 'h', dots: 1 }, { k: ['e/4'], d: 'q' }], 4); // 1 + 3 + 1 = 5
  assert.equal(total(r.events), 4);
  assert.equal(r.events.length, 2); // el do y el re (3 negras -> cabe justo en 3), mi descartado
  const r2 = fitHand([{ k: ['c/4'], d: 'h' }, { k: ['d/4'], d: 'h' }, { k: ['e/4'], d: 'h' }], 3);
  assert.equal(total(r2.events), 3);
  assert.deepEqual(r2.events[1], { k: ['d/4'], d: 'q' });
  const r4 = fitHand([{ k: ['c/4'], d: 'w' }], 1.875); // resto sin figura única: se parte con ligadura
  assert.equal(total(r4.events), 1.875);
  assert.equal(r4.events[1].tie, true);
  const r3 = fitHand([{ k: ['c/4'], d: 'q' }], 3);
  assert.equal(total(r3.events), 3);
  assert.deepEqual(r3.events[1], { k: [], d: 'h' });
  assert.equal(fitHand([{ k: ['c/4'], d: 'w' }], 4).changed, false);
});

test('normalizeScore pasa por validateScore', () => {
  const r = normalizeScore({ title: 'T', measures: [{ rh: [{ k: ['zz/9'], d: 'q' }, { k: ['c/4'], d: 'q' }], lh: [] }] });
  assert.ok(r.ok);
  assert.ok(r.errors.length > 0);
  assert.equal(total(r.score.measures[0].rh), 4);
});

test('errores HTTP y red', async () => {
  await assert.rejects(composeScore(base(async () => resp(401, {}))), /API key/);
  await assert.rejects(composeScore(base(async () => resp(429, {}))), /límite/);
  await assert.rejects(composeScore(base(async () => resp(500, 'x'))), /disponible/);
  await assert.rejects(composeScore(base(async () => { throw new TypeError('Failed to fetch'); })), /conexión/);
  await assert.rejects(composeScore(base(async () => { const e = new Error('a'); e.name = 'AbortError'; throw e; })), (e) => e.kind === 'abort');
  await assert.rejects(composeScore(base(async () => {}, { apiKey: '' })), /API key/);
  await assert.rejects(composeScore(base(async () => {}, { query: '  ' })), /canción/);
});

test('el prompt cambia según el nivel y las manos', () => {
  const p = ['principiante', 'intermedio', 'pro'].map((l) => buildComposeUserPrompt('Himno a la Alegría', l, 'dos-manos'));
  assert.equal(new Set(p).size, 3);
  assert.match(p[0], /single-note melody/);
  assert.match(p[1], /broken chords/);
  assert.match(p[2], /original key/);
  assert.notEqual(buildComposeUserPrompt('x', 'pro', 'melodia'), buildComposeUserPrompt('x', 'pro', 'dos-manos'));
  assert.match(buildComposeUserPrompt('x', 'pro', 'melodia'), /melody only/);
  const body = (lv) => buildComposeRequest('anthropic', { apiKey: 'k', model: 'm', query: 'x', level: lv, hands: 'dos-manos' }).init.body;
  assert.notEqual(body('principiante'), body('pro'));
  assert.match(COMPOSE_SYSTEM_PROMPT, /"error"/);
  assert.match(COMPOSE_SYSTEM_PROMPT, /Spanish/);
});

test('summarizeAttempts', () => {
  assert.deepEqual(summarizeAttempts([]), { count: 0, best: null, last: null });
  assert.deepEqual(summarizeAttempts([{ at: 3, accuracy: 70 }, { at: 1, accuracy: 100 }, { at: 2, accuracy: 40 }]), { count: 3, best: 100, last: 70 });
});
