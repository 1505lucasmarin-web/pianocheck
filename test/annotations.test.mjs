import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createStore, fromJSON, splitStrokeByMeasure, project, pointToAnchor, simplifyStroke, normalizeMark,
  MAX_MARKS, MAX_POINTS, MAX_TEXT, VERSION,
} from '../js/annotations.js';

// Vista continua: 4 compases en una fila. Vista por página: 2 filas de 2 compases, otro tamaño y otro origen.
const continuous = [0, 1, 2, 3].map((i) => ({ measure: i, x: 20 + i * 200, y: 100, w: 200, staffSpace: 10 }));
const paged = [
  { measure: 0, x: 50, y: 80, w: 300, staffSpace: 14 }, { measure: 1, x: 350, y: 80, w: 300, staffSpace: 14 },
  { measure: 2, x: 50, y: 500, w: 300, staffSpace: 14 }, { measure: 3, x: 350, y: 500, w: 300, staffSpace: 14 },
];
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);

test('pantalla → ancla → pantalla con dos layouts: mismo compás y misma posición relativa', () => {
  const p = { x: 20 + 200 * 2 + 50, y: 100 + 10 * 3 };                 // en el compás 2, a 1/4 del ancho, y = 3 espacios
  const a = pointToAnchor(p, continuous);
  assert.equal(a.measure, 2);
  near(a.x, 0.25); near(a.y, 3);
  assert.equal(a.staff, 'rh');
  const mark = { type: 'pen', measure: a.measure, points: [{ x: a.x, y: a.y }] };
  const back = project(mark, continuous)[0];
  near(back.x, p.x); near(back.y, p.y);
  const inPaged = project(mark, paged)[0];                              // otra vista: compás 2 está en la segunda fila
  near(inPaged.x, 50 + 0.25 * 300); near(inPaged.y, 500 + 3 * 14);
  const a2 = pointToAnchor(inPaged, paged);
  assert.equal(a2.measure, 2); near(a2.x, a.x); near(a2.y, a.y);
  // y de la mano izquierda
  assert.equal(pointToAnchor({ x: 30, y: 100 + 10 * 12 }, continuous).staff, 'lh');
  // compás que no está en el layout
  assert.equal(project({ measure: 9, points: [{ x: 0, y: 0 }] }, paged), null);
  assert.equal(pointToAnchor({ x: 1, y: 1 }, []), null);
  assert.equal(pointToAnchor({ x: NaN, y: 1 }, continuous), null);
});

test('un trazo guardado en una vista se proyecta idéntico en esa vista y consistente en la otra', () => {
  const stroke = [{ x: 60, y: 110 }, { x: 120, y: 90 }, { x: 180, y: 130 }, { x: 240, y: 105 }];   // compases 0 y 1
  const marks = splitStrokeByMeasure(stroke, continuous, { simplify: false });
  const gid = marks[0].groupId;
  assert.ok(marks.every((m) => m.groupId === gid));
  const screenA = marks.flatMap((m) => project(m, continuous));
  for (const s of stroke) assert.ok(screenA.some((q) => Math.abs(q.x - s.x) < 1e-6 && Math.abs(q.y - s.y) < 1e-6), 'punto original reproducido');
  const screenB = marks.flatMap((m) => project(m, paged));
  for (const m of marks) {
    for (const q of project(m, paged)) {
      const a = pointToAnchor(q, paged);
      if (Math.abs(a.x) < 1e-6 || Math.abs(a.x - 1) < 1e-6) continue;              // sobre la barra el punto es ambiguo (pertenece a ambos compases)
      assert.equal(a.measure, m.measure);
      assert.ok(m.points.some((p) => Math.abs(p.x - a.x) < 1e-3 && Math.abs(p.y - a.y) < 1e-3));
    }
  }
  assert.equal(screenA.length, screenB.length);
});

test('trazo que cruza 3 compases: se parte por compás, con puntos de cruce en las barras y un solo groupId', () => {
  const stroke = [{ x: 70, y: 100 }, { x: 500, y: 130 }];                // compás 0 → 1 → 2 → ... en la vista continua
  const marks = splitStrokeByMeasure(stroke, continuous, { simplify: false, type: 'hl', color: '#ffd400' });
  assert.deepEqual(marks.map((m) => m.measure), [0, 1, 2]);
  assert.equal(new Set(marks.map((m) => m.groupId)).size, 1);
  assert.ok(marks.every((m) => m.type === 'hl' && m.color === '#ffd400'));
  near(marks[0].points.at(-1).x, 1); near(marks[1].points[0].x, 0); near(marks[1].points.at(-1).x, 1); near(marks[2].points[0].x, 0);
  // los cruces son continuos: la y de salida de un compás es la de entrada del siguiente
  near(marks[0].points.at(-1).y, marks[1].points[0].y); near(marks[1].points.at(-1).y, marks[2].points[0].y);
  // la y interpolada está sobre la recta
  const expectY = 100 + ((220 - 70) / (500 - 70)) * 30;
  near(marks[0].points.at(-1).y * 10 + 100, expectY, 0.02);
});

test('trazo que cruza compases y salta de sistema en la vista por página', () => {
  // empieza en el compás 0, pasa al 1 (misma fila), baja al sistema siguiente (compás 2) y entra al 3
  const stroke = [{ x: 300, y: 100 }, { x: 450, y: 110 }, { x: 120, y: 520 }, { x: 400, y: 530 }];
  const marks = splitStrokeByMeasure(stroke, paged, { simplify: false });
  assert.deepEqual(marks.map((m) => m.measure), [0, 1, 2, 3]);
  assert.equal(new Set(marks.map((m) => m.groupId)).size, 1);
  near(marks[0].points.at(-1).x, 1); near(marks[1].points[0].x, 0);              // empalme entre 0 y 1
  // el salto de fila NO se interpola: el compás 1 termina donde estaba el último punto y el 2 empieza en el siguiente
  near(marks[1].points.at(-1).x, (450 - 350) / 300, 1e-3);
  near(marks[2].points[0].x, (120 - 50) / 300, 1e-3);
  near(marks[2].points.at(-1).x, 1); near(marks[3].points[0].x, 0);              // empalme entre 2 y 3
  // la misma marca de grupo proyectada en la vista continua cae en los mismos compases
  for (const m of marks) assert.ok(project(m, continuous).every((q) => q.x >= 20 + m.measure * 200 - 60 && q.x <= 20 + (m.measure + 1) * 200 + 60));
});

test('simplificación, límites de puntos y marcas inválidas', () => {
  const line = Array.from({ length: 500 }, (_, i) => ({ x: 20 + i * 0.3, y: 100 + Math.sin(i / 20) }));   // todo en el compás 0
  const marks = splitStrokeByMeasure(line, continuous);
  assert.ok(marks[0].points.length < 100);
  const wiggle = Array.from({ length: 1000 }, (_, i) => ({ x: 20 + (i % 100) * 1.9, y: 100 + (i % 2) * 40 }));
  const m2 = splitStrokeByMeasure(wiggle, continuous, { simplify: false });
  assert.ok(m2.every((m) => m.points.length <= MAX_POINTS));
  assert.deepEqual(simplifyStroke([{ x: 0, y: 0 }, { x: 1, y: 0.001 }, { x: 2, y: 0 }], 0.1).length, 2);
  assert.deepEqual(simplifyStroke([], 1), []);
  assert.deepEqual(splitStrokeByMeasure([], continuous), []);
  assert.deepEqual(splitStrokeByMeasure([{ x: 1, y: 1 }], []), []);
  assert.ok(normalizeMark({ type: 'zzz', measure: 0, points: [{ x: 0, y: 0 }] }).error);
  assert.ok(normalizeMark({ type: 'pen', measure: -1, points: [{ x: 0, y: 0 }] }).error);
  assert.ok(normalizeMark({ type: 'pen', measure: 0, points: [{ x: NaN, y: 0 }] }).error);
  assert.ok(normalizeMark({ type: 'pen', measure: 0, points: [] }).error);
  assert.ok(normalizeMark({ type: 'pen', measure: 0, points: [{ x: 0, y: 0 }], color: 'rojo' }).error);
  assert.ok(normalizeMark({ type: 'text', measure: 0, points: [{ x: 0, y: 0 }], text: '   ' }).error);
  assert.equal(normalizeMark({ type: 'pen', measure: 0, points: [{ x: 9, y: 500 }] }).mark.points[0].x, 1.25);   // se recorta
  assert.ok(normalizeMark({ type: 'pen', measure: 0, points: [{ x: 9, y: 500 }] }, { strict: true }).error);
});

test('store: agregar, borrar un trazo entero (grupo), deshacer y rehacer', () => {
  const st = createStore();
  const stroke = splitStrokeByMeasure([{ x: 70, y: 100 }, { x: 500, y: 130 }], continuous, { simplify: false });
  const r = st.add(stroke);
  assert.ok(r.ok);
  assert.equal(st.count(), 3);
  st.add({ type: 'text', measure: 3, points: [{ x: 0.5, y: -2 }], text: '  más   suave  ' });
  assert.equal(st.marks().at(-1).text, 'más suave');
  assert.equal(st.forMeasure(3).length, 1);
  assert.equal(st.count(), 4);

  // borrar tocando sólo el segmento del compás 1: se va el trazo completo (3 segmentos)
  const mid = st.marks().find((m) => m.measure === 1).points[1];
  const e = st.eraseAt({ measure: 1, x: mid.x, y: mid.y, wSS: 20 }, 0.5);
  assert.equal(e.removed.length, 3);
  assert.equal(st.count(), 1);
  assert.deepEqual(st.eraseAt({ measure: 1, x: 0.5, y: 40 }, 0.5).removed, []);        // lejos: no borra nada
  assert.deepEqual(st.eraseAt({ measure: 3, x: 0.5, y: -2 }, 'x').removed, []);         // radio inválido
  assert.equal(st.canUndo(), true);

  assert.ok(st.undo());                       // deshace el borrado: vuelve el trazo de 3 segmentos
  assert.equal(st.count(), 4);
  assert.deepEqual(st.marks().filter((m) => m.type === 'pen').map((m) => m.measure), [0, 1, 2]);
  assert.ok(st.undo());                       // deshace el texto
  assert.equal(st.count(), 3);
  assert.ok(st.undo());                       // deshace el trazo completo de una vez
  assert.equal(st.count(), 0);
  assert.equal(st.undo(), false);
  assert.ok(st.redo()); assert.equal(st.count(), 3);
  assert.ok(st.redo()); assert.equal(st.count(), 4);
  assert.ok(st.redo()); assert.equal(st.count(), 1);        // rehace el borrado
  assert.equal(st.redo(), false);
  // una acción nueva descarta lo que se podía rehacer
  st.undo();
  st.add({ type: 'pen', measure: 0, points: [{ x: 0.1, y: 1 }, { x: 0.2, y: 1 }] });
  assert.equal(st.canRedo(), false);
});

test('store: clear se puede deshacer; suscriptores', () => {
  const st = createStore();
  let n = 0;
  const off = st.subscribe(() => n++);
  st.add({ type: 'pen', measure: 0, points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] });
  st.add({ type: 'hl', measure: 1, points: [{ x: 0, y: 0 }, { x: 1, y: 0 }] });
  assert.equal(st.marks().find((m) => m.type === 'hl').w, 1.2);                          // grosor por defecto del resaltado
  assert.equal(st.clear(), 2);
  assert.equal(st.count(), 0);
  assert.equal(st.clear(), 0);
  st.undo();
  assert.equal(st.count(), 2);
  assert.ok(n >= 4);
  off(); const before = n; st.clear(); assert.equal(n, before);
});

test('store: límites de marcas y de puntos', () => {
  const st = createStore();
  for (let i = 0; i < MAX_MARKS; i++) assert.ok(st.add({ type: 'pen', measure: 0, points: [{ x: 0, y: 0 }] }).ok);
  const r = st.add({ type: 'pen', measure: 0, points: [{ x: 0, y: 0 }] });
  assert.equal(r.ok, false);
  assert.match(r.error, /límite/);
  assert.equal(st.count(), MAX_MARKS);
  const st2 = createStore();
  const many = Array.from({ length: 5000 }, (_, i) => ({ x: (i % 50) / 50, y: (i % 7) * 1.5 }));
  const ok = st2.add({ type: 'pen', measure: 0, points: many });
  assert.ok(ok.ok); assert.ok(ok.marks[0].points.length <= MAX_POINTS);
  assert.equal(st2.add({ type: 'text', measure: 0, points: [{ x: 0, y: 0 }], text: 'x'.repeat(500) }).marks[0].text.length, MAX_TEXT);
  assert.equal(st2.add([]).ok, false);
  assert.equal(st2.add(null).ok, false);
  assert.equal(st2.add([{ type: 'pen', measure: 0, points: [{ x: 0, y: 0 }] }, { type: 'nope' }]).ok, false);   // todo o nada
  assert.equal(st2.count(), 2);
});

test('JSON: ida y vuelta, y JSON corrupto', () => {
  const st = createStore();
  st.add(splitStrokeByMeasure([{ x: 70, y: 100 }, { x: 500, y: 130 }], continuous, { simplify: false }));
  st.add({ type: 'text', measure: 2, staff: 'lh', event: 3, points: [{ x: 0.3, y: 12 }], text: 'ritard.', size: 1.6 });
  const json = JSON.stringify(st);
  const back = fromJSON(json);
  assert.ok(back.ok); assert.deepEqual(back.errors, []);
  assert.deepEqual(back.store.toJSON(), st.toJSON());
  assert.equal(st.toJSON().v, VERSION);
  assert.deepEqual(fromJSON(st.toJSON()).store.marks(), st.marks());
  assert.deepEqual(createStore(st.toJSON()).marks(), st.marks());
  assert.deepEqual(createStore(st.marks()).marks(), st.marks());

  for (const bad of ['{no es json', '', 'null', '[]', '42', JSON.stringify({ v: 99, marks: [] }), JSON.stringify({ v: 1 }), JSON.stringify({ v: 1, marks: 'x' }), undefined, null, 7]) {
    const r = fromJSON(bad);
    assert.equal(r.ok, false, String(bad));
    assert.ok(r.errors.length > 0);
    assert.equal(r.store.count(), 0);
  }
  // marcas inválidas se descartan una por una, las buenas quedan
  const good = st.toJSON().marks[0];
  const mixed = fromJSON({ v: 1, marks: [
    good, { ...good, id: 'x2', type: 'lapiz' }, { ...good, id: 'x3', points: [{ x: 'a', y: 1 }] }, { ...good, id: 'x4', measure: 1.5 },
    { ...good, id: 'x5', points: [{ x: 5, y: 0 }] }, { ...good, id: good.id }, { type: 'pen', measure: 0, points: [{ x: 0, y: 0 }] }, 'basura', null,
    { ...good, id: 'x6', text: undefined, type: 'text', points: [{ x: 0, y: 0 }] },
  ] });
  assert.ok(mixed.ok);
  assert.equal(mixed.store.count(), 1);
  assert.equal(mixed.errors.length, 9);
  // límites al leer
  const huge = fromJSON({ v: 1, marks: Array.from({ length: MAX_MARKS + 1 }, (_, i) => ({ ...good, id: 'i' + i })) });
  assert.equal(huge.ok, false);
  const longStroke = fromJSON({ v: 1, marks: [{ ...good, points: Array.from({ length: MAX_POINTS + 1 }, () => ({ x: 0, y: 0 })) }] });
  assert.equal(longStroke.store.count(), 0);
  const bigText = fromJSON({ v: 1, marks: [{ id: 't', groupId: 't', type: 'text', measure: 0, points: [{ x: 0, y: 0 }], text: 'z'.repeat(MAX_TEXT + 1) }] });
  assert.equal(bigText.store.count(), 0);
});
