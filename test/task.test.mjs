import test from 'node:test';
import assert from 'node:assert/strict';
import { demoScore } from '../js/demo.js';
import { validateScore } from '../js/model.js';
import { buildTaskFile, serializeTask, parseTaskFile, normTask, describeTask, taskFileName, TASK_VERSION, MAX_TASK_BYTES, MAX_TASK_TEXT } from '../js/task.js';
import { buildSummary, compareAttempts, weakText } from '../js/summary.js';
import { attemptKey, equivalentAttempts, bestEquivalent } from '../js/passage.js';
import { summarizeAttempts } from '../js/store.js';
import { createRecorder, recorderSupported, pickMime, extFor, clock } from '../js/recorder.js';

const task = { from: 4, to: 7, hands: 'lh', bpm: 56, mode: 'pulso', text: 'Compases 5–8, mano izquierda, 56 BPM. Sostené el bajo durante todo su valor' };

test('tarea: ida y vuelta conserva partitura y consigna, sin id ni datos personales', () => {
  const sc = { ...validateScore(demoScore).score, apiKey: 'sk-secreto', id: 'mio', origin: 'foto', reviewed: ['sum:1:rh'], comments: { 4: 'Ojo con el bajo' } };
  const file = buildTaskFile({ score: sc, task, now: 1 });
  const txt = serializeTask(file);
  assert.ok(!/sk-secreto|apiKey|mio|reviewed/.test(txt));
  assert.equal(file.version, TASK_VERSION); assert.equal(file.kind, 'task');
  const r = parseTaskFile(txt);
  assert.ok(r.ok, r.error);
  assert.equal(r.score.measures.length, 8); assert.deepEqual(r.score.comments, { 4: 'Ojo con el bajo' });
  assert.deepEqual(r.task, { from: 4, to: 7, hands: 'lh', bpm: 56, mode: 'pulso', text: task.text });
  assert.equal(r.score.id, r.id);
  assert.equal(parseTaskFile(txt).id, r.id);                      // mismo archivo → mismo id (no se duplica al importar de nuevo)
  assert.equal(describeTask(r.task, 8), 'Compases 5–8 · mano izquierda · ♩ 56 · A pulso');
  assert.equal(describeTask(normTask({}, 8), 8), 'Pieza entera · ambas manos · Te espero');
});

test('tarea: datos corruptos, versión desconocida, tamaño y campos de más', () => {
  const good = JSON.parse(serializeTask(buildTaskFile({ score: demoScore, task })));
  assert.match(parseTaskFile('esto no es json {').error, /dañado/);
  assert.match(parseTaskFile('[1,2]').error, /no es una tarea/);
  assert.match(parseTaskFile(JSON.stringify({ ...good, format: 'otro' })).error, /no es una tarea/);
  assert.match(parseTaskFile(JSON.stringify({ ...good, version: 99 })).error, /más nueva/);
  assert.match(parseTaskFile(JSON.stringify({ ...good, version: 'x' })).error, /versión desconocida/);
  assert.match(parseTaskFile(JSON.stringify({ ...good, version: 0 })).error, /versión desconocida/);
  assert.match(parseTaskFile(JSON.stringify({ ...good, score: { measures: 'x' } })).error, /partitura/);
  assert.match(parseTaskFile(JSON.stringify({ ...good, score: { measures: [{ rh: [], lh: [] }] } })).error, /sin notas|dañada/);
  assert.match(parseTaskFile('x'.repeat(MAX_TASK_BYTES + 1)).error, /demasiado grande/);
  assert.match(parseTaskFile(JSON.stringify({ ...good, score: { ...good.score, measures: new Array(600).fill(good.score.measures[0]) } })).error, /demasiado larga/);
  assert.match(parseTaskFile(new Uint8Array([0xff, 0xfe, 0x00])).error, /no se puede leer/);
  const extra = parseTaskFile(JSON.stringify({ ...good, apiKey: 'sk-x', ajustes: { a: 1 }, task: { ...good.task, otro: 5, text: 'a'.repeat(MAX_TASK_TEXT + 50) }, score: { ...good.score, secreto: 1 } }));
  assert.ok(extra.ok);
  assert.ok(!JSON.stringify(extra).includes('sk-x') && !('secreto' in extra.score) && !('otro' in extra.task));
  assert.equal(extra.task.text.length, MAX_TASK_TEXT);
  assert.ok(parseTaskFile(new TextEncoder().encode(serializeTask(buildTaskFile({ score: demoScore, task })))).ok);   // también acepta bytes
});

test('tarea: normTask acota rango, tempo, mano y modo', () => {
  assert.deepEqual(normTask({ from: 0, to: 7, hands: 'x', bpm: 9999, mode: 'zzz', text: 5 }, 8), { from: null, to: null, hands: 'both', bpm: 240, mode: 'espera', text: '' });
  assert.deepEqual(normTask({ from: 6, to: 2, bpm: 10 }, 8), { from: 2, to: 6, hands: 'both', bpm: 30, mode: 'espera', text: '' });
  assert.deepEqual(normTask(null, 8).from, null);
  assert.match(taskFileName('Oda a la Alegría (demo)'), /^Tarea-Oda-a-la-Alegria-demo\.pianocheck$/);
  assert.equal(taskFileName(''), 'Tarea-tarea.pianocheck');
  assert.throws(() => buildTaskFile({ score: { measures: [] }, task }));
});

const att = (o) => ({ id: 'a' + Math.random(), at: 1, accuracy: 80, status: 'finished', hands: 'lh', range: { from: 4, to: 7 }, loop: true, bpm: 56, mode: 'pulso', ...o });

test('intentos equivalentes: el modo separa las comparaciones y los récords', () => {
  assert.equal(attemptKey({ hands: 'both' }, 8), 'all|both|once');                      // la clave de "Te espero" no cambió
  assert.equal(attemptKey({ hands: 'both', mode: 'pulso' }, 8), 'all|both|once|pulso');
  const list = [att({ at: 1, accuracy: 70 }), att({ at: 2, accuracy: 92 }), att({ at: 3, accuracy: 100, mode: 'espera' }), att({ at: 4, accuracy: 88 })];
  const ref = list[3];
  assert.equal(equivalentAttempts(list, ref, 8).length, 2);
  assert.equal(bestEquivalent(list, ref, 8), 92);                                          // el 100% de Te espero no cuenta
  assert.deepEqual(summarizeAttempts([{ accuracy: 100, at: 1, mode: 'pulso' }, { accuracy: 60, at: 2 }]), { count: 1, best: 60, last: 60 });
});

test('resumen: texto para el profesor, a pulso, comparando sólo intentos equivalentes', () => {
  const list = [att({ at: 1, accuracy: 70 }), att({ at: 2, accuracy: 92 }), att({ at: 3, accuracy: 100, mode: 'espera', range: null, loop: false, hands: 'both' }), att({ at: 4, accuracy: 88, onTimePct: 71, trendMs: 60, hits: 24, omitted: 1, measuresDone: 4, measuresTotal: 4, weak: [{ measure: 5, errors: 4 }, { measure: 6, errors: 2 }] })];
  const t = buildSummary({ title: 'Oda a la Alegría', n: 8, att: list[3], attempts: list, task: { text: 'Sostené el bajo' } });
  assert.equal(t, [
    'PianoCheck · Resumen de práctica',
    'Pieza: Oda a la Alegría',
    'Pasaje: compases 5–8 de 8 (en bucle) · mano izquierda',
    'Tempo: ♩ 56 · Modo: A pulso',
    'Compases completos: 4 de 4',
    'Notas correctas: 88% · A tiempo: 71% · Omitidas: 1',
    'Tendencia: Tendés a atrasarte ~60 ms',
    'Pulso flojo en: compás 6 (4 pasos), compás 7 (2 pasos)',
    '3 intentos de este tipo; mejor 92%, último 88%',
    'Consigna: Sostené el bajo',
  ].join('\n'));
  assert.deepEqual(compareAttempts(list, list[3], 8), { count: 3, best: 92, last: 88 });
});

test('resumen: Te espero con errores repetidos y primer intento', () => {
  const a = { id: 'x', at: 1, accuracy: 62, status: 'finished', hands: 'both', range: null, loop: false, bpm: 80, mode: 'espera', measuresDone: 8, measuresTotal: 8, weak: [{ measure: 2, errors: 3 }] };
  const t = buildSummary({ title: 'Demo', n: 8, att: a, attempts: [a] });
  assert.match(t, /Pasaje: pieza entera · ambas manos/);
  assert.match(t, /Precisión: 62%/);
  assert.match(t, /Errores repetidos en: compás 3 \(3 errores\)/);
  assert.match(t, /Es el primer intento de este tipo\./);
  assert.ok(!/Consigna|Tendencia/.test(t));
  assert.equal(weakText([], 'espera'), 'Sin errores');
  assert.equal(weakText([{ measure: 0, errors: 1 }], 'espera'), 'Errores en: compás 1 (1 error)');
  assert.match(buildSummary({ title: 'Demo', n: 8, att: { ...a, status: 'stopped' }, attempts: [] }), /sesión sin terminar/);
});

/* ---- grabación con MediaRecorder falso ---- */
function fakeEnv({ deny = false, types = ['audio/webm;codecs=opus'] } = {}) {
  const log = { stopped: 0, started: 0 };
  class MR {
    static isTypeSupported(t) { return types.includes(t); }
    constructor(stream, o) { this.stream = stream; this.mimeType = (o && o.mimeType) || ''; this.state = 'inactive'; }
    start() { this.state = 'recording'; log.started++; setTimeout(() => this.ondataavailable && this.ondataavailable({ data: new Blob(['abc']) }), 5); }
    stop() { this.state = 'inactive'; setTimeout(() => this.onstop && this.onstop(), 1); }
  }
  const track = { stop() { log.stopped++; } };
  return { log, env: { MediaRecorder: MR, navigator: { mediaDevices: { getUserMedia: async () => { if (deny) throw new Error('NotAllowedError'); return { getTracks: () => [track] }; } } } } };
}

test('grabación: pide permiso cada vez, devuelve un blob no vacío y suelta el micrófono', async () => {
  const { env, log } = fakeEnv();
  assert.ok(recorderSupported(env)); assert.ok(!recorderSupported({})); assert.ok(!recorderSupported({ MediaRecorder: class {}, navigator: {} }));
  const r = createRecorder({ env });
  await r.start();
  assert.ok(r.recording);
  await assert.rejects(r.start(), /en curso/);
  await new Promise((res) => setTimeout(res, 30));
  const out = await r.stop();
  assert.ok(out.blob.size > 0); assert.equal(out.mime, 'audio/webm;codecs=opus');
  assert.equal(log.stopped, 1); assert.ok(!r.recording);
  await r.start(); const gone = await r.cancel(); assert.equal(gone, null); assert.equal(log.stopped, 2);
});

test('grabación: permiso negado, tope de duración y utilidades', async () => {
  await assert.rejects(createRecorder({ env: fakeEnv({ deny: true }).env }).start(), /NotAllowed/);
  const { env, log } = fakeEnv();
  let auto = null;
  const r = createRecorder({ env, maxMs: 300, onAutoStop: (x) => { auto = x; } });
  await r.start();
  await new Promise((res) => setTimeout(res, 700));
  assert.ok(auto && auto.blob.size > 0 && auto.ms <= 300); assert.equal(log.stopped, 1);
  assert.equal(pickMime(fakeEnv({ types: ['audio/mp4'] }).env.MediaRecorder), 'audio/mp4');
  assert.equal(pickMime(fakeEnv({ types: [] }).env.MediaRecorder), '');
  assert.equal(extFor('audio/mp4'), 'm4a'); assert.equal(extFor('audio/webm;codecs=opus'), 'webm');
  assert.equal(clock(65000), '1:05'); assert.equal(clock(0), '0:00');
});

test('tarea: las anotaciones a mano viajan, se validan y las de compases inexistentes se descartan', async () => {
  const { createStore } = await import('../js/annotations.js');
  const st = createStore();
  st.add({ type: 'pen', measure: 1, points: [{ x: 0.1, y: -1 }, { x: 0.5, y: -2 }], color: '#7b1fa2' });
  st.add({ type: 'text', measure: 99, points: [{ x: 0.3, y: 5 }], text: 'no existe' });
  const sc = validateScore(demoScore).score;
  const file = buildTaskFile({ score: sc, annotations: st.toJSON(), task, now: 1 });
  assert.equal(file.annotations.marks.length, 1);
  const r = parseTaskFile(serializeTask(file));
  assert.ok(r.ok, r.error); assert.equal(r.annotations.marks.length, 1); assert.equal(r.annotations.marks[0].measure, 1);
  // anotaciones dañadas: la tarea igual se abre, sin marcas
  const bad = JSON.parse(serializeTask(file)); bad.annotations = { v: 7, marks: 'x' };
  const r2 = parseTaskFile(JSON.stringify(bad));
  assert.ok(r2.ok); assert.equal(r2.annotations, null);
  // sin anotaciones: no se agrega el campo
  assert.ok(!('annotations' in buildTaskFile({ score: sc, task, now: 1 })));
});
