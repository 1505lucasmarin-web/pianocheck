import test from 'node:test';
import assert from 'node:assert/strict';
import { PIECES, findPiece, getPieceScore, normalizeText } from '../js/pieces.js';
import { validateScore, durBeats, buildSteps } from '../js/model.js';

const total = (evs) => evs.reduce((a, e) => a + durBeats(e), 0);

test('hay al menos 8 piezas, la Oda a la Alegría es la primera y todas tienen melodía sencilla primero', () => {
  assert.ok(PIECES.length >= 8);
  assert.equal(PIECES[0].id, 'oda-a-la-alegria');
  assert.equal(new Set(PIECES.map((p) => p.id)).size, PIECES.length);
  for (const p of PIECES) {
    assert.ok(p.title && p.composer && Array.isArray(p.aliases) && p.aliases.length >= 3, p.id);
    assert.equal(p.versions[0].label, 'Solo melodía', p.id);
    for (const v of p.versions) assert.ok(['Solo melodía', 'Con acompañamiento'].includes(v.label));
  }
  assert.ok(PIECES.filter((p) => p.versions.length === 2).length >= 8);
});

test('cada Score pasa validateScore sin descartes y cada compás suma el compás (anacrusa declarada)', () => {
  for (const p of PIECES) {
    for (const v of p.versions) {
      const r = validateScore(v.score);
      assert.deepEqual(r.errors, [], `${p.id}/${v.id}`);
      assert.ok(r.ok);
      assert.deepEqual(r.score.measures, v.score.measures, `${p.id}/${v.id} validateScore no debe cambiar nada`);
      const bar = (v.score.timeSig[0] * 4) / v.score.timeSig[1];
      v.score.measures.forEach((m, i) => {
        const want = i === 0 && v.pickupBeats ? v.pickupBeats : bar;
        assert.equal(total(m.rh), want, `${p.id}/${v.id} compás ${i + 1} mano derecha`);
        assert.equal(total(m.lh), want, `${p.id}/${v.id} compás ${i + 1} mano izquierda`);
      });
      if (v.label === 'Solo melodía') assert.ok(v.score.measures.every((m) => m.lh.every((e) => e.k.length === 0)), 'izquierda en silencios');
      assert.ok(buildSteps(v.score).length > 0);
    }
  }
});

test('la melodía de ambas versiones es idéntica y el acompañamiento tiene notas en la izquierda', () => {
  for (const p of PIECES.filter((x) => x.versions.length === 2)) {
    const [a, b] = p.versions;
    assert.deepEqual(a.score.measures.map((m) => m.rh), b.score.measures.map((m) => m.rh), p.id);
    assert.ok(b.score.measures.some((m) => m.lh.some((e) => e.k.length)), p.id);
  }
});

test('Oda a la Alegría: 16 compases, notas conocidas', () => {
  const s = PIECES[0].versions[0].score;
  assert.equal(s.measures.length, 16);
  const midi = buildSteps(s, 'rh').map((x) => x.midi[0]);
  assert.deepEqual(midi.slice(0, 15), [64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64, 64, 62, 62]);   // mi mi fa sol sol fa mi re do do re mi mi re re
  assert.equal(midi[midi.length - 1], 60);
});

test('Noche de Paz: 12 compases en 6/8 y termina en do', () => {
  const p = PIECES.find((x) => x.id === 'noche-de-paz');
  assert.deepEqual(p.versions[0].score.timeSig, [6, 8]);
  assert.equal(p.versions[0].score.measures.length, 12);
  assert.equal(p.versions[0].score.measures[11].rh[0].k[0], 'c/5');
});

test('getPieceScore devuelve copias independientes', () => {
  const a = getPieceScore('oda-a-la-alegria');
  a.measures[0].rh[0].k[0] = 'z/9';
  assert.equal(getPieceScore('oda-a-la-alegria').measures[0].rh[0].k[0], 'e/4');
  assert.equal(getPieceScore('nada'), null);
  assert.equal(getPieceScore('oda-a-la-alegria', 'nada'), null);
  assert.ok(getPieceScore('oda-a-la-alegria', 'acompanamiento').measures[0].lh[0].k.length > 0);
});

test('findPiece: normaliza tildes, alias y parciales', () => {
  const top = (q) => (findPiece(q)[0] || {}).piece;
  assert.equal(top('oda a la alegria').id, 'oda-a-la-alegria');
  assert.equal(findPiece('oda a la alegria')[0].score, 1);
  assert.equal(top('ODA A LA ALEGRÍA').id, 'oda-a-la-alegria');
  assert.equal(top('ode to joy').id, 'oda-a-la-alegria');
  assert.equal(top('himno a la alegría').id, 'oda-a-la-alegria');
  assert.equal(top('fur elise').id, 'para-elisa');
  assert.equal(top('Für Elise').id, 'para-elisa');
  assert.equal(top('fur elisa').id, 'para-elisa');                      // error de tipeo
  assert.equal(top('para elisa').id, 'para-elisa');
  assert.equal(top('twinkle twinkle little star').id, 'estrellita');
  assert.equal(top('frere jacques').id, 'martinillo');
  assert.equal(top('happy birthday').id, 'cumpleanos-feliz');
  assert.equal(top('cumpleaños').id, 'cumpleanos-feliz');
  assert.equal(top('canon pachelbel').id, 'canon-de-pachelbel');
  assert.equal(top('minuet in G').id, 'minueto-en-sol');
  assert.equal(top('silent night').id, 'noche-de-paz');
  assert.equal(top('greensleeves').id, 'greensleeves');
  assert.equal(top('oda alegria').id, 'oda-a-la-alegria');
  const r = findPiece('ode to joy');
  assert.ok(r.every((x) => x.score >= 0 && x.score <= 1));
  assert.ok(r.every((x, i) => i === 0 || r[i - 1].score >= x.score));
});

test('findPiece: sin resultado para pedidos que no están', () => {
  assert.deepEqual(findPiece('evermore'), []);
  assert.deepEqual(findPiece('evermore Taylor Swift'), []);
  assert.deepEqual(findPiece(''), []);
  assert.deepEqual(findPiece(null), []);
  assert.deepEqual(findPiece('la'), []);
  assert.deepEqual(findPiece('Bohemian Rhapsody'), []);
});

test('normalizeText', () => {
  assert.equal(normalizeText('  Für  Élise!! '), 'fur elise');
  assert.equal(normalizeText('Cumpleaños'), 'cumpleanos');
  assert.equal(normalizeText(undefined), '');
});
