import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTake, takeMetrics, compareTakes, trend, pruneTakes, takesComparable, MAX_TAKE_EVENTS, MIN_TAKE_NOTES } from "../js/takes.js";

// Partitura sintética: 8 negras en 2 compases de 4/4. Cada paso i cae en la negra i (t = i, en negras).
const steps = Array.from({ length: 8 }, (_, i) => ({ i, t: i, measure: Math.floor(i / 4), midi: [60 + i] }));

/** Toma a un tempo dado (ms por negra) con deslices opcionales por paso: extra[i] = ms de más antes del paso i. */
function make({ msPerBeat = 1000, extra = {}, wrongAt = {}, cleanAt = null, n = 8, scoreId = "p1", hands = "both", range = null, mode = "espera", sub = null } = {}) {
  let t = 0;
  const idx = sub || Array.from({ length: n }, (_, i) => i);
  const st = [], ev = [];
  let wrongCarry = 0;
  for (const i of idx) {
    t += msPerBeat + (extra[i] || 0);
    ev.push([Math.round(t), 60 + i, 80, Math.round(msPerBeat * 0.8)]);
    if (wrongAt[i]) { ev.push([Math.round(t + 50), 70, 80, 100]); wrongCarry += wrongAt[i]; }
    st.push({ i, measure: Math.floor(i / 4), tOn: Math.round(t), clean: !wrongAt[i] && !(cleanAt && cleanAt.includes(i)), wrong: wrongCarry });
    wrongCarry = 0;
  }
  return { id: "x" + Math.random().toString(36).slice(2), scoreId, mode, hands, range, bpm: 60, steps: st, events: ev, durationSec: t / 1000, source: "midi" };
}

test("buildTake descarta tomas con menos de 5 notas y normaliza las válidas", () => {
  assert.equal(MIN_TAKE_NOTES, 5);
  assert.equal(buildTake({ scoreId: "p", events: [[0, 60], [100, 61], [200, 62]] }), null);
  assert.equal(buildTake({ events: [[0, 60]] }), null);
  const t = buildTake({ scoreId: "p", events: [[900, 62, 80, 10], [0, 60, 90, null], [100, 5, 80, 1], [200, 61], [300, 62], [400, 63], [500, 64, 300, 0]], steps: [{ i: 1, measure: 0, tOn: 100, clean: true }, { i: 1, measure: 0, tOn: 120 }, { i: 2, measure: 0 }], mode: "rara", hands: "xx", range: { from: 2, to: 1 } });
  assert.ok(t);
  assert.deepEqual(t.events.map((e) => e[0]), [0, 200, 300, 400, 500, 900]);      // ordenadas, la midi 5 fuera de rango se descarta
  assert.equal(t.events[4][2], 127);                                              // velocity acotada
  assert.equal(t.mode, "espera");
  assert.equal(t.hands, "both");
  assert.equal(t.range, null);
  assert.equal(t.steps.length, 1);                                                // sin duplicados y sólo pasos completados
  assert.equal(t.day.length, 10);
  assert.equal(t.source, "teclado");
  assert.equal(t.hasAudio, false);
});

test("buildTake limita el número de notas", () => {
  const ev = Array.from({ length: MAX_TAKE_EVENTS + 50 }, (_, k) => [k, 60]);
  assert.equal(buildTake({ scoreId: "p", events: ev }).events.length, MAX_TAKE_EVENTS);
});

test("toma perfecta a tempo exacto: evenness ~100 y tempo igual al escrito", () => {
  const m = takeMetrics(buildTake(make({ msPerBeat: 1000 })), steps);
  assert.equal(m.accuracy, 100);
  assert.equal(m.wrongNotes, 0);
  assert.equal(m.tempoBpm, 60);
  assert.ok(m.evenness >= 99, `evenness ${m.evenness}`);
  assert.equal(m.hesitations, 0);
  assert.equal(m.measuresDone, 2);
  assert.equal(m.measuresTotal, 2);
  assert.equal(m.completion, 1);
});

test("toma con titubeos: cuenta las pausas largas y las marca en su compás", () => {
  const clean = takeMetrics(buildTake(make({ msPerBeat: 1000 })), steps);
  const hes = takeMetrics(buildTake(make({ msPerBeat: 1000, extra: { 5: 2500 } })), steps);   // pausa grande antes del paso 5 (compás 2)
  assert.equal(hes.hesitations, 1);
  assert.deepEqual(hes.hesitationMeasures, [1]);
  assert.equal(hes.perMeasure.find((r) => r.measure === 1).hesitated, true);
  assert.ok(hes.evenness < clean.evenness);
});

test("toma más rápida: tempo efectivo mayor y comparación con la lenta", () => {
  const slow = buildTake(make({ msPerBeat: 1000, scoreId: "p" }));
  const fast = buildTake(make({ msPerBeat: 500, scoreId: "p" }));
  assert.equal(takeMetrics(fast, steps).tempoBpm, 120);
  const cmp = compareTakes(slow, fast, steps);
  assert.equal(cmp.comparable, true);
  assert.equal(cmp.deltas.tempoBpm, 60);
  assert.match(cmp.headline, /60 bpm más rápido que antes/);
});

test("comparación por compás: la toma con errores en el compás 1 es peor, la limpia mejor", () => {
  const a = buildTake(make({ wrongAt: { 0: 1, 2: 2 }, cleanAt: [1] }));
  const b = buildTake(make({}));
  const cmp = compareTakes(a, b, steps);
  assert.equal(cmp.comparable, true);
  const m0 = cmp.perMeasure.find((r) => r.measure === 0);
  assert.equal(m0.verdict, "mejor");
  assert.equal(m0.errorsA > m0.errorsB, true);
  assert.deepEqual(cmp.improved, [0, 1].filter((m) => cmp.perMeasure.find((r) => r.measure === m).verdict === "mejor"));
  assert.ok(cmp.improved.includes(0));
  assert.equal(cmp.deltas.wrongNotes, -3);
  assert.match(cmp.headline, /menos errores/);
  const back = compareTakes(b, a, steps);
  assert.ok(back.worsened.includes(0));
});

test("tomas no equivalentes no se comparan (partitura, mano, rango o modo)", () => {
  const base = buildTake(make({}));
  assert.equal(compareTakes(base, buildTake(make({ scoreId: "otra" })), steps).comparable, false);
  assert.equal(compareTakes(base, buildTake(make({ hands: "rh" })), steps).comparable, false);
  assert.equal(compareTakes(base, buildTake(make({ range: { from: 0, to: 0 } })), steps).comparable, false);
  const r = compareTakes(base, buildTake(make({ mode: "pulso" })), steps);
  assert.equal(r.comparable, false);
  assert.match(r.reason, /pulso/);
  assert.match(takesComparable(base, buildTake(make({ scoreId: "z" }))).reason, /partituras/);
});

test("toma parcial: completion y compases hechos reflejan lo tocado", () => {
  const p = buildTake(make({ sub: [0, 1, 2, 3, 4, 5] }));
  const m = takeMetrics(p, steps);
  assert.equal(m.stepsDone, 6);
  assert.equal(m.completion, 0.75);
  assert.equal(m.measuresTotal, 2);
  assert.equal(m.measuresDone, 1);
});

test("trend agrupa por día con el mejor valor de cada métrica", () => {
  const t1 = buildTake({ ...make({ msPerBeat: 1000, cleanAt: [0] }), day: "2026-11-12", at: Date.parse("2026-11-12T12:00:00Z") });
  const t2 = buildTake({ ...make({ msPerBeat: 800 }), day: "2026-11-12", at: Date.parse("2026-11-12T13:00:00Z") });
  const t3 = buildTake({ ...make({ msPerBeat: 700 }), day: "2026-11-13", at: Date.parse("2026-11-13T13:00:00Z") });
  const tr = trend([t3, t1, t2], steps);
  assert.deepEqual(tr.map((r) => r.day), ["2026-11-12", "2026-11-13"]);
  assert.equal(tr[0].takes, 2);
  assert.equal(tr[0].best.accuracy, 100);
  assert.equal(tr[0].best.tempoBpm, 75);
  assert.equal(tr[1].best.tempoBpm, 86);
});

test("pruneTakes conserva todo lo de los últimos 14 días y, de lo anterior, la mejor y la última por día", () => {
  const now = Date.parse("2026-11-13T12:00:00");
  const mk = (id, day, acc, at) => ({ id, day, scoreId: "p", hands: "both", range: null, at, summary: { accuracy: acc } });
  const takes = [
    mk("reciente1", "2026-11-12", 10, "2026-11-12T10:00:00Z"),
    mk("reciente2", "2026-11-05", 20, "2026-11-05T10:00:00Z"),
    mk("viejoA", "2026-10-01", 50, "2026-10-01T09:00:00Z"),
    mk("viejoB", "2026-10-01", 90, "2026-10-01T10:00:00Z"),   // la mejor
    mk("viejoC", "2026-10-01", 60, "2026-10-01T11:00:00Z"),   // la última
    mk("viejoD", "2026-10-01", 40, "2026-10-01T08:00:00Z"),
    mk("otroDia", "2026-09-30", 70, "2026-09-30T09:00:00Z"),  // única de su día: se queda
  ];
  const drop = pruneTakes(takes, { now });
  assert.deepEqual(drop.sort(), ["viejoA", "viejoD"]);
});

test("una toma favorita (keep: true) sobrevive a la retención automática y se normaliza", () => {
  const now = Date.parse("2026-11-13T12:00:00");
  const mk = (id, day, acc, at, extra = {}) => ({ id, day, scoreId: "p", hands: "both", range: null, at, summary: { accuracy: acc }, ...extra });
  const takes = [
    mk("viejaFav", "2026-10-01", 10, "2026-10-01T08:00:00Z", { keep: true }),   // peor precisión, pero favorita
    mk("viejoA", "2026-10-01", 50, "2026-10-01T09:00:00Z"),
    mk("viejoB", "2026-10-01", 90, "2026-10-01T10:00:00Z"),                       // la mejor del día
    mk("viejoC", "2026-10-01", 60, "2026-10-01T11:00:00Z"),                       // la última del día
  ];
  const drop = pruneTakes(takes, { now });
  assert.ok(!drop.includes("viejaFav"), "la favorita no se borra");
  assert.deepEqual(drop.sort(), ["viejoA"]);
  const t = buildTake({ scoreId: "p", events: [[0, 60], [100, 61], [200, 62], [300, 63], [400, 64]], keep: true });
  assert.equal(t.keep, true);
  assert.equal(buildTake({ scoreId: "p", events: [[0, 60], [100, 61], [200, 62], [300, 63], [400, 64]] }).keep, false);
});
