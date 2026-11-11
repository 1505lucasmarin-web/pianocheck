import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeMove, nearestMissing, computeRange, semitonesText } from '../js/keyboard.js';

test('describeMove: medio tono, 1 tono, 1 tono y medio, octava', () => {
  assert.deepEqual(describeMove(65, 67), { dir: 'derecha', semitones: 2, text: 'Movete 1 tono a la derecha → Sol4' });
  assert.deepEqual(describeMove(65, 64), { dir: 'izquierda', semitones: 1, text: 'Movete medio tono a la izquierda → Mi4' });
  assert.equal(describeMove(60, 63).text, 'Movete 1 tono y medio a la derecha → Re#4');
  assert.equal(describeMove(72, 60).text, 'Movete 1 octava a la izquierda → Do4');
  assert.equal(describeMove(60, 72).dir, 'derecha');
});

test('describeMove: varios tonos y más de una octava', () => {
  assert.equal(describeMove(60, 65).text, 'Movete 2 tonos y medio a la derecha → Fa4');
  assert.equal(describeMove(60, 68).text, 'Movete 4 tonos a la derecha → Sol#4');
  assert.equal(describeMove(60, 74).text, 'Movete 1 octava y 1 tono a la derecha → Re5');
  assert.equal(describeMove(72, 58).text, 'Movete 1 octava y 1 tono a la izquierda → La#3');
  assert.equal(describeMove(60, 73).text, 'Movete 1 octava y medio tono a la derecha → Do#5');
  assert.equal(describeMove(60, 84).text, 'Movete 2 octavas a la derecha → Do6');
  assert.equal(semitonesText(11), '5 tonos y medio');
  assert.equal(semitonesText(14), '1 octava y 1 tono');
});

test('describeMove: misma nota → sin dirección', () => {
  assert.deepEqual(describeMove(60, 60), { dir: null, semitones: 0, text: '' });
});

test('nearestMissing: la más cercana de las que faltan', () => {
  assert.equal(nearestMissing(65, [43, 50, 64]), 64);   // acorde: Mi4 está a 1 semitono
  assert.equal(nearestMissing(55, [43, 50, 64]), 50);   // Sol3 → Re3 (5) gana a Sol2 (12) y Mi4 (9)
  assert.equal(nearestMissing(60, [60 - 3, 60 + 3]), 57); // empate → la más grave
  assert.equal(nearestMissing(60, []), null);
  assert.equal(nearestMissing(60, [67]), 67);
});

test('computeRange: octavas completas, ≥ media octava de margen, mínimo 2 octavas', () => {
  // demo: Sol2 (43) .. Sol4 (67) → Do2 .. Si5
  assert.deepEqual(computeRange(43, 67), { low: 36, high: 83 });
  for (const [a, b] of [[60, 60], [60, 71], [55, 79], [40, 90], [21, 108], [48, 59]]) {
    const r = computeRange(a, b);
    assert.equal(r.low === 21 || r.low % 12 === 0, true, `${a}-${b} empieza en Do (o La0)`);
    assert.equal(r.high === 108 || r.high % 12 === 11, true, `${a}-${b} termina en Si (o Do8)`);
    assert.ok(r.high - r.low + 1 >= 24, `${a}-${b} mínimo 2 octavas`);
    assert.ok(r.low <= Math.max(21, a - 6) && r.high >= Math.min(108, b + 6), `${a}-${b} margen`);
  }
  assert.deepEqual(computeRange(60, 60), { low: 48, high: 71 });
});
