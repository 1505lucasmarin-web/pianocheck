import test from 'node:test';
import assert from 'node:assert/strict';
import { createMidiChord, CHORD_WINDOW_MS } from '../js/midi-chord.js';

// Reloj y temporizadores falsos: el test avanza el tiempo a mano.
function rig() {
  let clock = 0;
  const timers = new Map(); let id = 0;
  const log = [];
  const chord = createMidiChord({
    onChord: () => log.push('chord'),
    onSingle: (m) => log.push('single:' + m),
    setTimer: (fn, ms) => { const k = ++id; timers.set(k, { fn, at: clock + ms }); return k; },
    clearTimer: (k) => timers.delete(k),
    now: () => clock,
  });
  const advance = (ms) => {
    const end = clock + ms;
    for (;;) {
      const due = [...timers.entries()].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) break;
      clock = due[1].at; timers.delete(due[0]); due[1].fn();
    }
    clock = end;
  };
  return { chord, log, advance, at: (t) => { clock = t; }, timers };
}

test('la ventana es de 400 ms', () => {
  assert.equal(CHORD_WINDOW_MS, 400);
});

test('ambas dentro de la ventana reinician, sin acciones individuales', () => {
  const r = rig();
  assert.equal(r.chord.down(21, 0), true);
  assert.equal(r.chord.down(108, 150), true);
  r.chord.up(21); r.chord.up(108);
  r.advance(1000);
  assert.deepEqual(r.log, ['chord']);
});

test('segunda tecla mientras la primera sigue apretada, dentro de la ventana: acorde', () => {
  const r = rig();
  r.chord.down(108, 0);
  r.chord.down(21, 300);
  r.advance(1000);
  assert.deepEqual(r.log, ['chord']);
});

test('una sola tecla dispara su acción al vencer la ventana', () => {
  const r = rig();
  r.chord.down(21, 0);
  r.advance(399);
  assert.deepEqual(r.log, []);
  r.advance(1);
  assert.deepEqual(r.log, ['single:21']);
  assert.equal(r.chord.up(21), true);
});

test('una sola tecla suelta antes de vencer igual dispara al vencer', () => {
  const r = rig();
  r.chord.down(108, 0);
  r.chord.up(108);
  r.advance(500);
  assert.deepEqual(r.log, ['single:108']);
});

test('segunda tecla tarde: dos acciones individuales', () => {
  const r = rig();
  r.chord.down(21, 0);
  r.advance(400);
  assert.deepEqual(r.log, ['single:21']);
  r.chord.up(21);
  r.chord.down(108, 900);
  r.advance(400);
  assert.deepEqual(r.log, ['single:21', 'single:108']);
});

test('segunda tecla después de vencida la ventana, aunque la primera siga apretada: no es acorde', () => {
  const r = rig();
  r.chord.down(21, 0);
  r.advance(400);
  r.chord.down(108, 500);
  assert.deepEqual(r.log, ['single:21']);
  r.advance(400);
  assert.deepEqual(r.log, ['single:21', 'single:108']);
});

test('repetición sin soltar no vuelve a disparar', () => {
  const r = rig();
  r.chord.down(21, 0); r.chord.down(108, 100);
  r.chord.down(21, 200); r.chord.down(108, 250);
  r.advance(2000);
  assert.deepEqual(r.log, ['chord']);
  r.chord.up(21); r.chord.up(108);
  r.chord.down(21, 3000);
  r.advance(400);
  assert.deepEqual(r.log, ['chord', 'single:21']);
});

test('repetición de una sola tecla no duplica la acción', () => {
  const r = rig();
  r.chord.down(21, 0);
  r.chord.down(21, 50);
  r.advance(400);
  assert.deepEqual(r.log, ['single:21']);
});

test('una tecla que no es de comando no la toma el detector', () => {
  const r = rig();
  assert.equal(r.chord.down(60, 0), false);
  assert.equal(r.chord.up(60), false);
  r.advance(1000);
  assert.deepEqual(r.log, []);
});

test('cancel descarta la espera pendiente', () => {
  const r = rig();
  r.chord.down(21, 0);
  r.chord.cancel();
  r.advance(1000);
  assert.deepEqual(r.log, []);
  assert.equal(r.timers.size, 0);
});
