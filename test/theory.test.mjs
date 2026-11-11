import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAJOR_PATTERN, KEYS, majorScale, scaleMidi, scaleSteps, diatonicTriads, checkTriad,
  makeQualityQuiz, makeDegreeTasks, noteNameInKey,
} from '../js/theory.js';

// Valores esperados escritos a mano (ortografía estándar).
const EXPECTED = {
  C: 'Do Re Mi Fa Sol La Si',
  G: 'Sol La Si Do Re Mi Fa♯',
  D: 'Re Mi Fa♯ Sol La Si Do♯',
  A: 'La Si Do♯ Re Mi Fa♯ Sol♯',
  E: 'Mi Fa♯ Sol♯ La Si Do♯ Re♯',
  B: 'Si Do♯ Re♯ Mi Fa♯ Sol♯ La♯',
  'F#': 'Fa♯ Sol♯ La♯ Si Do♯ Re♯ Mi♯',
  Db: 'Re♭ Mi♭ Fa Sol♭ La♭ Si♭ Do',
  Ab: 'La♭ Si♭ Do Re♭ Mi♭ Fa Sol',
  Eb: 'Mi♭ Fa Sol La♭ Si♭ Do Re',
  Bb: 'Si♭ Do Re Mi♭ Fa Sol La',
  F: 'Fa Sol La Si♭ Do Re Mi',
};

test('patrón y 12 tonalidades', () => {
  assert.deepEqual(MAJOR_PATTERN, ['T', 'T', 'S', 'T', 'T', 'T', 'S']);
  assert.equal(KEYS.length, 12);
  assert.deepEqual(KEYS.map((k) => k.name), ['Do mayor', 'Sol mayor', 'Re mayor', 'La mayor', 'Mi mayor', 'Si mayor',
    'Fa♯ mayor', 'Re♭ mayor', 'La♭ mayor', 'Mi♭ mayor', 'Si♭ mayor', 'Fa mayor']);
  assert.deepEqual(KEYS.map((k) => k.accidentals), [0, 1, 2, 3, 4, 5, 6, -5, -4, -3, -2, -1]);
  assert.equal(new Set(KEYS.map((k) => k.tonicPc)).size, 12);
});

for (const [id, txt] of Object.entries(EXPECTED)) {
  test(`escala ${id}: ortografía, letras únicas y patrón`, () => {
    const sc = majorScale(id);
    assert.deepEqual(sc.map((n) => n.name), txt.split(' '));
    assert.deepEqual(sc.map((n) => n.degree), [1, 2, 3, 4, 5, 6, 7]);
    assert.equal(new Set(sc.map((n) => n.letter)).size, 7);
    const pcs = [...sc.map((n) => n.pc), sc[0].pc];
    const steps = pcs.slice(1).map((p, i) => ((p - pcs[i] + 12) % 12 === 2 ? 'T' : 'S'));
    assert.deepEqual(steps, MAJOR_PATTERN);
    assert.equal(sc[0].pc, KEYS.find((k) => k.id === id).tonicPc);
  });
}

test('scaleMidi: octava, octavas y updown', () => {
  assert.deepEqual(scaleMidi('C'), [60, 62, 64, 65, 67, 69, 71, 72]);
  assert.deepEqual(scaleMidi('F#', { octave: 3 }), [54, 56, 58, 59, 61, 63, 65, 66]);
  assert.deepEqual(scaleMidi('Bb', { octave: 4 }), [70, 72, 74, 75, 77, 79, 81, 82]);
  assert.equal(scaleMidi('G', { octaves: 2 }).length, 15);
  assert.deepEqual(scaleMidi('C', { direction: 'updown' }), [60, 62, 64, 65, 67, 69, 71, 72, 71, 69, 67, 65, 64, 62, 60]);
});

test('scaleSteps', () => {
  const s = scaleSteps('G');
  assert.deepEqual(s.map((x) => x.step), MAJOR_PATTERN);
  assert.deepEqual(s[0], { from: 'Sol', to: 'La', step: 'T' });
  assert.deepEqual(s[6], { from: 'Fa♯', to: 'Sol', step: 'S' });
});

test('calidades por grado en las 12 tonalidades', () => {
  for (const k of KEYS) {
    const t = diatonicTriads(k.id);
    assert.deepEqual(t.map((x) => x.degree), ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']);
    assert.deepEqual(t.map((x) => x.quality), ['Mayor', 'menor', 'menor', 'Mayor', 'Mayor', 'menor', 'disminuido']);
    for (const x of t) {
      const [a, b, c] = x.midi;
      const iv = x.quality === 'Mayor' ? [4, 3] : x.quality === 'menor' ? [3, 4] : [3, 3];
      assert.deepEqual([b - a, c - b], iv, `${k.id} ${x.degree}`);
      assert.ok(a >= 60 && a <= 71);
      assert.deepEqual(x.midi.map((m) => m % 12), x.pcs);
    }
  }
});

test('nombres de acordes', () => {
  const names = (k) => diatonicTriads(k).map((t) => t.name);
  assert.deepEqual(names('C'), ['Do', 'Rem', 'Mim', 'Fa', 'Sol', 'Lam', 'Si dim']);
  assert.deepEqual(names('G'), ['Sol', 'Lam', 'Sim', 'Do', 'Re', 'Mim', 'Fa♯ dim']);
  assert.deepEqual(names('F'), ['Fa', 'Solm', 'Lam', 'Si♭', 'Do', 'Rem', 'Mi dim']);
  assert.deepEqual(names('Bb'), ['Si♭', 'Dom', 'Rem', 'Mi♭', 'Fa', 'Solm', 'La dim']);
  assert.deepEqual(names('F#'), ['Fa♯', 'Sol♯m', 'La♯m', 'Si', 'Do♯', 'Re♯m', 'Mi♯ dim']);
  assert.deepEqual(diatonicTriads('G')[3].notes, ['Do', 'Mi', 'Sol']);
  assert.deepEqual(diatonicTriads('C')[0].midi, [60, 64, 67]);
});

test('checkTriad', () => {
  const C = diatonicTriads('C')[0];
  assert.deepEqual(checkTriad([60, 64, 67], C), { ok: true, missingPcs: [], wrongMidis: [] });
  assert.equal(checkTriad([64, 67, 72], C).ok, true); // 1ª inversión
  assert.equal(checkTriad([67, 72, 76], C).ok, true); // 2ª inversión
  assert.equal(checkTriad([48, 64, 79, 84], C).ok, true); // octavas distintas + duplicación
  assert.deepEqual(checkTriad([60, 64, 66], C), { ok: false, missingPcs: [7], wrongMidis: [66] });
  assert.deepEqual(checkTriad([60, 64], C), { ok: false, missingPcs: [7], wrongMidis: [] });
  assert.deepEqual(checkTriad([], C).missingPcs, [0, 4, 7]);
  assert.equal(checkTriad([60, 64, 67, 69], C).ok, false); // nota extra
});

const seq = (vals) => { let i = 0; return () => vals[i++ % vals.length]; };

test('makeQualityQuiz con rng determinista', () => {
  // grado = floor(r*7): 0.55 → IV (3)
  const q = makeQualityQuiz('G', 1, seq([0.55]));
  assert.deepEqual(q[0], {
    prompt: '¿Qué tipo de acorde es el IV grado de Sol mayor?',
    options: ['Mayor', 'menor', 'disminuido'],
    answer: 'Mayor',
    explain: 'En Sol mayor el IV grado es Do (Do–Mi–Sol): acorde Mayor.',
    key: 'G',
    degree: 'IV',
  });
  const r = makeQualityQuiz('C', 3, seq([0.99, 0.99, 0.99, 0.0, 0.0]));
  assert.deepEqual(r.map((x) => x.degree), ['VII', 'I', 'VII']);
  assert.equal(r[0].answer, 'disminuido');
  assert.notEqual(r[0].degree, r[1].degree);
});

test('sin repetir consecutivos (rng constante y tonalidad libre)', () => {
  const t = makeDegreeTasks('C', 20, () => 0.3);
  for (let i = 1; i < t.length; i++) assert.notEqual(t[i].prompt, t[i - 1].prompt);
  const q = makeQualityQuiz(null, 30, Math.random);
  assert.equal(q.length, 30);
  for (let i = 1; i < q.length; i++) assert.notEqual(q[i].prompt, q[i - 1].prompt);
  assert.ok(new Set(q.map((x) => x.key)).size > 1);
});

test('makeDegreeTasks', () => {
  const t = makeDegreeTasks('G', 1, seq([0.55]))[0];
  assert.equal(t.prompt, 'Tocá el IV de Sol mayor');
  assert.equal(t.triad.name, 'Do');
  assert.equal(checkTriad([60, 64, 67], t.triad).ok, true);
  assert.deepEqual(makeDegreeTasks('F', 0), []);
});

test('noteNameInKey', () => {
  assert.equal(noteNameInKey(66, 'F#'), 'Fa♯4');
  assert.equal(noteNameInKey(65, 'F#'), 'Mi♯4');
  assert.equal(noteNameInKey(70, 'Bb'), 'Si♭4');
  assert.equal(noteNameInKey(61, 'Db'), 'Re♭4');
  assert.equal(noteNameInKey(60, 'C'), 'Do4');
  assert.equal(noteNameInKey(59, 'C'), 'Si3');
  assert.equal(noteNameInKey(61, 'C'), 'Do♯4'); // fuera de escala
  assert.equal(noteNameInKey(61, 'F'), 'Re♭4'); // tonalidad con bemoles: fuera de escala usa bemoles
  assert.equal(noteNameInKey(68, 'Eb'), 'La♭4');
  assert.equal(noteNameInKey(200, 'C'), '?');
});
