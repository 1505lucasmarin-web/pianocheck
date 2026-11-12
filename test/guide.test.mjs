import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeGuide, chordPcs, keyPcs, normKey, verifyScore, buildRetryPrompt, buildGuideUserPrompt, GUIDE_SYSTEM_PROMPT, problemsSummaryEs, RANGE } from '../js/guide.js';
import { composeStepwise, buildModelRequest } from '../js/compose.js';
import { durBeats } from '../js/model.js';

const resp = (status, obj) => ({ ok: status < 300, status, text: async () => (typeof obj === 'string' ? obj : JSON.stringify(obj)) });
const anthText = (t, extra = {}) => resp(200, { stop_reason: 'end_turn', content: [{ type: 'text', text: t }], ...extra });

const GUIDE = { title: 'Canción de prueba', keySig: 'C', timeSig: [4, 4], bpm: 100,
  form: [{ name: 'estrofa', measures: 4 }],
  measures: [
    { section: 'estrofa', chords: ['C'], contour: 'repeats the root', alt: [] },
    { section: 'estrofa', chords: ['G'], contour: 'steps up', alt: [] },
    { section: 'estrofa', chords: ['Am', 'F'], contour: 'falls', alt: ['F#'] },
    { section: 'estrofa', chords: ['G7'], contour: 'held note', alt: [] },
  ] };
const q = (k, d = 'q') => ({ k: [k], d });
const GOOD = { title: 'Canción de prueba', bpm: 100, timeSig: [4, 4], keySig: 'C', measures: [
  { rh: [q('c/5'), q('e/5'), q('g/5'), q('e/5')], lh: [{ k: ['c/3', 'g/3'], d: 'w' }] },
  { rh: [q('d/5'), q('g/5'), q('b/4'), q('d/5')], lh: [{ k: ['g/2', 'd/3'], d: 'w' }] },
  { rh: [q('a/4'), q('f#/4'), q('f/4'), q('a/4')], lh: [{ k: ['a/2'], d: 'h' }, { k: ['f/2'], d: 'h' }] },
  { rh: [{ k: ['g/4'], d: 'w' }], lh: [{ k: ['g/2', 'f/3'], d: 'w' }] },
] };
const clone = (o) => JSON.parse(JSON.stringify(o));

test('chordPcs y keyPcs', () => {
  assert.deepEqual([...chordPcs('C')].sort((a, b) => a - b), [0, 4, 7]);
  assert.deepEqual([...chordPcs('Am7')].sort((a, b) => a - b), [0, 4, 7, 9]);
  assert.deepEqual([...chordPcs('G/B')].sort((a, b) => a - b), [2, 7, 11]);
  assert.deepEqual([...chordPcs('F#dim')].sort((a, b) => a - b), [0, 6, 9]);
  assert.deepEqual([...chordPcs('Bbmaj7')].sort((a, b) => a - b), [2, 5, 9, 10]);
  assert.deepEqual([...chordPcs('Dsus4')].sort((a, b) => a - b), [2, 7, 9]);
  assert.equal(chordPcs('hola'), null);
  assert.deepEqual([...keyPcs('C')].sort((a, b) => a - b), [0, 2, 4, 5, 7, 9, 11]);
  assert.ok(keyPcs('Am').has(8) && keyPcs('Am').has(0));              // sensible (sol#)
  assert.equal(normKey('a minor'), 'Am'); assert.equal(normKey('F♯m'), 'F#m'); assert.equal(normKey('xx'), null);
});

test('normalizeGuide: acepta, limpia y respeta la negativa', () => {
  const g = normalizeGuide({ ...GUIDE, keySig: 'g minor', bpm: 9999, timeSig: [3, 7] });
  assert.ok(g.ok); assert.equal(g.guide.keySig, 'Gm'); assert.equal(g.guide.bpm, 220); assert.deepEqual(g.guide.timeSig, [4, 4]);
  assert.equal(g.guide.measures.length, 4);
  const no = normalizeGuide({ error: 'No conozco esa pieza' });
  assert.equal(no.ok, false); assert.equal(no.refused, true); assert.equal(no.error, 'No conozco esa pieza');
  assert.equal(normalizeGuide({ title: 'x', measures: [] }).ok, false);
  assert.equal(normalizeGuide(null).ok, false);
});

test('verifyScore: una partitura correcta pasa', () => {
  const g = normalizeGuide(GUIDE).guide;
  const v = verifyScore(GOOD, g);
  assert.deepEqual(v.problems, []); assert.ok(v.ok);
});

test('verifyScore: compás que no suma, nota fuera de tonalidad/acorde, fuera de rango, cantidad distinta', () => {
  const g = normalizeGuide(GUIDE).guide;
  const bad = clone(GOOD);
  bad.measures[1].rh = [q('d/5'), q('g/5'), q('b/4')];                       // 3 tiempos
  bad.measures[0].rh[1] = q('c#/5');                                         // do# no está en C ni en el acorde ni en alt
  bad.measures[3].lh = [{ k: ['c/1'], d: 'w' }];                             // do1 < rango de la izquierda (C1 = 24 → ok); usamos algo más grave
  bad.measures[3].lh = [{ k: ['c/0'], d: 'w' }];
  bad.measures[2].rh[1] = q('f#/4');                                         // fa# está en alt del compás 3: debe pasar
  const v = verifyScore(bad, g);
  const types = v.problems.map((p) => `${p.type}:${p.measure}:${p.hand || ''}`);
  assert.ok(types.includes('sum:2:rh'), types.join());
  assert.ok(types.includes('pitch:1:rh'));
  assert.ok(types.includes('range:4:lh'));
  assert.ok(!types.some((t) => t.startsWith('pitch:3')));                    // alteración marcada
  const few = verifyScore({ ...GOOD, measures: GOOD.measures.slice(0, 3) }, g);
  assert.ok(few.problems.some((p) => p.type === 'count'));
  assert.ok(RANGE.rh[0] < RANGE.rh[1]);
  assert.match(buildRetryPrompt(v.problems), /Measure 2, right hand/);
  assert.match(problemsSummaryEs(v.problems), /no sumaba/);
});

test('verifyScore: "sólo melodía" no exige acordes en la izquierda vacía', () => {
  const g = normalizeGuide(GUIDE).guide;
  const mel = clone(GOOD); mel.measures.forEach((m) => { m.lh = []; });
  assert.ok(verifyScore(mel, g, { style: 'melodia' }).ok);
});

test('prompts: la hoja guía no copia partituras ni letras y permite la web sólo para datos', () => {
  assert.match(GUIDE_SYSTEM_PROMPT, /ONLY to look up facts about the piece/);
  assert.match(GUIDE_SYSTEM_PROMPT, /Do NOT copy sheet music or lyrics/);
  assert.match(GUIDE_SYSTEM_PROMPT, /"error"/);
  assert.match(buildGuideUserPrompt('Fix You', 'Coldplay'), /"Fix You"[\s\S]*"Coldplay"/);
});

/* ------------------------------------------------------------------ composeStepwise con fetch simulado */
const opts = (fetchImpl, extra = {}) => ({ query: 'Canción de prueba', artist: 'Yo', style: 'acompanamiento', provider: 'anthropic', apiKey: 'k', fetchImpl, ...extra });

test('composeStepwise: dos llamadas (hoja guía + partitura) y sin reintento si todo está bien', async () => {
  const calls = [];
  const f = async (url, init) => {
    const body = JSON.parse(init.body); calls.push(body);
    return anthText(calls.length === 1 ? JSON.stringify(GUIDE) : JSON.stringify(GOOD));
  };
  const msgs = [];
  const r = await composeStepwise(opts(f, { onProgress: (m) => msgs.push(m) }));
  assert.equal(calls.length, 2);
  assert.match(calls[0].system, /GUIDE SHEET for it/); assert.equal(calls[0].tools, undefined);
  assert.match(calls[0].messages[0].content, /Canción de prueba/);
  assert.match(calls[1].system, /GUIDE MODE/);
  assert.match(calls[1].messages[0].content, /^GUIDE SHEET: \{/);
  assert.match(calls[1].messages[0].content, /"chords":\["Am","F"\]/);
  assert.equal(r.report.retried, false); assert.equal(r.score.measures.length, 4);
  assert.deepEqual(r.guide.timeSig, [4, 4]);
  assert.ok(msgs.some((m) => /Paso 1 de 2/.test(m)) && msgs.some((m) => /Paso 2 de 2/.test(m)));
});

test('composeStepwise: un compás que no suma → UN reintento con los problemas, y queda bien', async () => {
  const bad = clone(GOOD); bad.measures[1].rh = [q('d/5'), q('g/5'), q('b/4')];
  const calls = [];
  const f = async (url, init) => {
    const body = JSON.parse(init.body); calls.push(body);
    return anthText([JSON.stringify(GUIDE), JSON.stringify(bad), JSON.stringify(GOOD)][calls.length - 1]);
  };
  const r = await composeStepwise(opts(f));
  assert.equal(calls.length, 3);
  const retry = calls[2].messages;
  assert.equal(retry.length, 3);
  assert.equal(retry[1].role, 'assistant'); assert.equal(retry[2].role, 'user');
  assert.match(retry[2].content, /PROBLEMS FOUND IN YOUR PREVIOUS ANSWER/);
  assert.match(retry[2].content, /Measure 2, right hand: the events add up to 3 beats/);
  assert.equal(r.report.retried, true); assert.equal(r.report.problems.length, 1); assert.equal(r.report.remaining.length, 0);
  const sums = r.score.measures.map((m) => m.rh.reduce((a, e) => a + durBeats(e), 0));
  assert.deepEqual(sums, [4, 4, 4, 4]);
});

test('composeStepwise: si el reintento no mejora, se usa el primero ajustado; nunca más de un reintento', async () => {
  const bad = clone(GOOD); bad.measures[1].rh = [q('d/5'), q('g/5'), q('b/4')];
  const calls = [];
  const f = async (url, init) => { calls.push(1); return anthText(calls.length === 1 ? JSON.stringify(GUIDE) : JSON.stringify(bad)); };
  const r = await composeStepwise(opts(f));
  assert.equal(calls.length, 3);
  assert.equal(r.report.remaining.length, 1);
  assert.match(r.report.summary, /no sumaba/);
  assert.equal(r.score.measures[1].rh.reduce((a, e) => a + durBeats(e), 0), 4);   // normalizeScore completó con silencio
});

test('composeStepwise: la negativa del modelo se respeta (en la hoja guía y en la partitura): sin reintento ni reformulación', async () => {
  for (const which of [1, 2]) {
    const calls = [];
    const f = async () => { calls.push(1); return anthText(which === 1 || calls.length === 2 ? '{"error":"No conozco esa pieza con certeza"}' : JSON.stringify(GUIDE)); };
    await assert.rejects(composeStepwise(opts(f)), (e) => e.kind === 'compose' && /No conozco esa pieza con certeza/.test(e.message));
    assert.equal(calls.length, which);
  }
  const f3 = async () => resp(200, { stop_reason: 'refusal', content: [] });
  await assert.rejects(composeStepwise(opts(f3)), (e) => e.kind === 'compose');
});

test('composeStepwise: búsqueda web sólo en la hoja guía; si no está disponible sigue sin ella', async () => {
  const calls = [];
  const f = async (url, init) => {
    const body = JSON.parse(init.body); calls.push(body);
    if (calls.length === 1) return resp(400, { error: { message: 'web_search tool is not enabled for this organization' } });
    return anthText(calls.length === 2 ? JSON.stringify(GUIDE) : JSON.stringify(GOOD));
  };
  const r = await composeStepwise(opts(f, { web: true }));
  assert.equal(calls.length, 3);
  assert.equal(calls[0].tools[0].type, 'web_search_20250305'); assert.ok(calls[0].tools[0].blocked_domains.includes('scribd.com'));
  assert.equal(calls[1].tools, undefined); assert.equal(calls[2].tools, undefined);
  assert.equal(r.report.web, false);
  // con búsqueda disponible y pause_turn
  const calls2 = [];
  const f2 = async (url, init) => {
    const body = JSON.parse(init.body); calls2.push(body);
    if (calls2.length === 1) return resp(200, { stop_reason: 'pause_turn', content: [{ type: 'server_tool_use', id: 'x', name: 'web_search', input: { query: 'q' } }] });
    return anthText(calls2.length === 2 ? JSON.stringify(GUIDE) : JSON.stringify(GOOD));
  };
  const r2 = await composeStepwise(opts(f2, { web: true }));
  assert.equal(r2.report.web, true); assert.equal(calls2.length, 3);
  assert.equal(calls2[1].messages.at(-1).role, 'assistant');
});

test('composeStepwise: errores de red/clave se propagan con su kind; Gemini sin y con web', async () => {
  await assert.rejects(composeStepwise(opts(async () => { throw new TypeError('Failed to fetch'); })), (e) => e.kind === 'network');
  await assert.rejects(composeStepwise(opts(async () => resp(401, {}))), (e) => e.kind === 'auth');
  await assert.rejects(composeStepwise({ query: '', apiKey: 'k' }), /Escribí/);
  const urls = [];
  const f = async (url) => {
    urls.push(url);
    const out = urls.length === 1 ? GUIDE : GOOD;
    return resp(200, { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(out) }] } }] });
  };
  const r = await composeStepwise(opts(f, { provider: 'gemini' }));
  assert.match(urls[0], /generateContent$/); assert.equal(r.score.measures.length, 4);
  const w = buildModelRequest('gemini', { apiKey: 'k', model: 'm', system: 'S', turns: [{ role: 'user', text: 'U' }], web: true });
  assert.match(w.url, /interactions$/); assert.equal(JSON.parse(w.init.body).tools[0].type, 'google_search');
});
