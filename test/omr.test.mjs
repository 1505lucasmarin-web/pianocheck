import test from 'node:test';
import assert from 'node:assert/strict';
import {
  recognizeScore, DEFAULT_MODELS, extractJson, mergePages, mapHttpError, buildUserPrompt, SYSTEM_PROMPT,
  buildAnthropicRequest, buildGeminiRequest, textFromResponse,
} from '../js/omr.js';

const PAGE1 = { title: 'Mi pieza', bpm: 100, timeSig: [3, 4], keySig: 'G', measures: [{ rh: [{ k: ['g/4', 'b/4'], d: 'h', dots: 1 }], lh: [{ k: ['G/2'], d: 'h', dots: 1 }] }] };
const PAGE2 = { title: '', measures: [{ rh: [{ k: ['a/4'], d: 'h', dots: 1 }], lh: [{ k: [], d: 'h', dots: 1 }] }] };

test('DEFAULT_MODELS y prompt', () => {
  assert.ok(DEFAULT_MODELS.anthropic && DEFAULT_MODELS.gemini);
  for (const w of ['"tie": true', 'treble', 'bass', 'chord', 'key signature', 'ONLY']) assert.ok(SYSTEM_PROMPT.includes(w), w);
  assert.match(buildUserPrompt(2, 3), /page 2 of 3/);
  assert.doesNotMatch(buildUserPrompt(1, 1), /page 1 of/);
});

test('extractJson tolera fences y texto alrededor', () => {
  assert.deepEqual(extractJson('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(extractJson('Claro, acá está:\n{"a":{"b":"}"},"c":[1,2]}\nListo.'), { a: { b: '}' }, c: [1, 2] });
  assert.deepEqual(extractJson('{"a":[1,2,],}'), { a: [1, 2] });
  assert.deepEqual(extractJson('Texto con [1] corchete {"x":2}'.replace('[1] ', '')), { x: 2 });
  assert.deepEqual(extractJson('```\n[{"rh":[]}]\n```'), [{ rh: [] }]);
  assert.throws(() => extractJson('nada de json'), /JSON/);
  assert.throws(() => extractJson('{"a":'), /JSON/);
});

test('mergePages une páginas y toma metadatos de la primera que los tenga', () => {
  const m = mergePages([PAGE1, PAGE2, [{ rh: [], lh: [] }]]);
  assert.equal(m.title, 'Mi pieza');
  assert.equal(m.bpm, 100);
  assert.deepEqual(m.timeSig, [3, 4]);
  assert.equal(m.keySig, 'G');
  assert.equal(m.measures.length, 3);
  const m2 = mergePages([PAGE2, PAGE1]);
  assert.equal(m2.title, 'Mi pieza');
});

test('mapHttpError', () => {
  assert.match(mapHttpError(401, 'anthropic').message, /API key/);
  assert.match(mapHttpError(403, 'gemini').message, /API key/);
  assert.match(mapHttpError(400, 'gemini', '{"error":{"message":"API key not valid."}}').message, /API key/);
  assert.match(mapHttpError(429, 'anthropic').message, /límite/);
  assert.match(mapHttpError(503, 'gemini').message, /no está disponible/);
  assert.match(mapHttpError(529, 'anthropic').message, /no está disponible/);
  assert.match(mapHttpError(404, 'anthropic', '{"error":{"message":"model: x"}}').message, /modelo/);
});

test('formato de las solicitudes', () => {
  const image = { mediaType: 'image/jpeg', data: 'QUJD' };
  const a = buildAnthropicRequest({ apiKey: 'k', model: 'm', image, page: 1, total: 1 });
  assert.equal(a.url, 'https://api.anthropic.com/v1/messages');
  assert.equal(a.init.headers['anthropic-dangerous-direct-browser-access'], 'true');
  assert.equal(a.init.headers['x-api-key'], 'k');
  const ab = JSON.parse(a.init.body);
  assert.equal(ab.messages[0].content[0].source.type, 'base64');
  const g = buildGeminiRequest({ apiKey: 'k', model: 'gm', image, page: 1, total: 1 });
  assert.match(g.url, /models\/gm:generateContent$/);
  const gb = JSON.parse(g.init.body);
  assert.equal(gb.contents[0].parts[0].inline_data.mime_type, 'image/jpeg');
  assert.equal(g.init.headers['x-goog-api-key'], 'k');
});

const resp = (status, obj) => ({ ok: status < 300, status, text: async () => (typeof obj === 'string' ? obj : JSON.stringify(obj)) });
const blob = () => new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3])], { type: 'image/jpeg' });

test('recognizeScore (anthropic) con 2 páginas', async () => {
  const texts = ['Aquí:\n```json\n' + JSON.stringify(PAGE1) + '\n```', JSON.stringify(PAGE2)];
  let n = 0; const msgs = [];
  const fetchImpl = async (url, init) => resp(200, { stop_reason: 'end_turn', content: [{ type: 'text', text: texts[n++] }] });
  const s = await recognizeScore([blob(), blob()], { provider: 'anthropic', apiKey: 'sk', onProgress: (m) => msgs.push(m), fetchImpl });
  assert.equal(n, 2);
  assert.equal(s.measures.length, 2);
  assert.equal(s.title, 'Mi pieza');
  assert.deepEqual(s.measures[0].lh[0].k, ['g/2']); // normalizado a minúsculas
  assert.ok(msgs.length >= 2);
});

test('recognizeScore (gemini)', async () => {
  let url;
  const fetchImpl = async (u) => { url = u; return resp(200, { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(PAGE1) }] } }] }); };
  const s = await recognizeScore([blob()], { provider: 'gemini', apiKey: 'k', fetchImpl });
  assert.match(url, new RegExp(DEFAULT_MODELS.gemini));
  assert.equal(s.bpm, 100);
});

test('recognizeScore: errores claros', async () => {
  const opts = (fetchImpl, extra = {}) => ({ provider: 'anthropic', apiKey: 'k', fetchImpl, ...extra });
  await assert.rejects(recognizeScore([blob()], opts(async () => resp(401, {}))), /API key/);
  await assert.rejects(recognizeScore([blob()], opts(async () => resp(429, {}))), /límite/);
  await assert.rejects(recognizeScore([blob()], opts(async () => resp(500, 'x'))), /disponible/);
  await assert.rejects(recognizeScore([blob()], opts(async () => { throw new TypeError('Failed to fetch'); })), /conexión/);
  await assert.rejects(recognizeScore([blob()], opts(async () => resp(200, { content: [{ type: 'text', text: 'no sé' }] }))), /interpretar/);
  await assert.rejects(recognizeScore([blob()], opts(async () => resp(200, { content: [{ type: 'text', text: '{"measures":[]}' }] }))), /no encontró notas/);
  await assert.rejects(recognizeScore([blob()], opts(async () => resp(200, { stop_reason: 'max_tokens', content: [] }))), /agotó su límite/);
  await assert.rejects(recognizeScore([blob()], { provider: 'anthropic', apiKey: '', fetchImpl: async () => {} }), /API key/);
  await assert.rejects(recognizeScore([], opts(async () => {})), /imágenes/);
});

test('textFromResponse gemini bloqueada', () => {
  assert.throws(() => textFromResponse('gemini', { promptFeedback: { blockReason: 'SAFETY' } }), /bloque/);
});

test('OMR: conserva la digitación impresa y liga el bajo sin eliminar el ataque de la voz interna', async () => {
  const output = {
    timeSig: [4, 4],
    measures: [{ rh: [], lhTimed: [{ t: 0, b: 2, k: 'c/4', f: 5 }, { t: .25, b: 1.75, k: 'e/4', f: 3 }] }],
  };
  const fetchImpl = async () => resp(200, { content: [{ type: 'text', text: JSON.stringify(output) }] });
  const s = await recognizeScore([blob()], { apiKey: 'fake', fetchImpl });
  assert.deepEqual(s.measures[0].lh[0], { k: ['c/4'], d: '16', f: [5] });
  assert.deepEqual(s.measures[0].lh[1], { k: ['c/4', 'e/4'], d: 'q', dots: 2, ties: ['c/4'], f: [0, 3] });
});

test('OMR: descarta la respuesta cortada y reúne los sistemas en orden con el compás anterior', async () => {
  const messages = [];
  const fragment = (pitch) => ({ content: [{ type: 'text', text: JSON.stringify({ measures: [{ rhTimed: [[0, 1, pitch, 0, 3]] }] }) }] });
  const fetchImpl = async (_url, req) => {
    const body = JSON.parse(req.body);
    messages.push(body);
    const n = messages.length;
    return resp(200, n === 1 ? { content: [{ type: 'text', text: JSON.stringify(PAGE1) }] }
      : n === 2 ? { stop_reason: 'max_tokens', content: [{ type: 'text', text: '{"measures":[' }] }
      : fragment(n === 3 ? 'a/4' : 'b/4'));
  };
  const score = await recognizeScore([blob(), blob()], { apiKey: 'fake', fetchImpl, splitImage: async () => [blob(), blob()] });
  assert.equal(messages.length, 4);
  assert.match(messages[2].system, /compact JSON/);
  assert.match(messages[2].messages[0].content[1].text, /system 1 of 2.*previous meter \[3,4\]/);
  assert.match(messages[3].messages[0].content[1].text, /system 2 of 2/);
  assert.deepEqual(score.measures.map((m) => m.rh[0].k), [['g/4', 'b/4'], ['a/4'], ['b/4']]);
  assert.deepEqual(score.measures[1].rh[0].f, [3]);
});
