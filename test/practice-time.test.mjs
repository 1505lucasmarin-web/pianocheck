import { test } from "node:test";
import assert from "node:assert/strict";
import { createTimeTracker, addSession, totals, splitByDay, formatDuration, mergeLogs, normalizeLog, dayKey, shiftDay, scoreSeconds, TEORIA_ID } from "../js/practice-time.js";

const at = (y, m, d, h = 0, mi = 0, s = 0) => new Date(y, m - 1, d, h, mi, s).getTime();
function clock(start = at(2026, 11, 13, 10)) {
  let t = start;
  return { now: () => t, set: (v) => { t = v; }, add: (ms) => { t += ms; } };
}

test("inactividad: no suma el tiempo ocioso tras la última nota", () => {
  const c = clock();
  const t = createTimeTracker({ now: c.now, idleMs: 30000 });
  t.start();
  c.add(5000); t.activity();          // nota a los 5 s
  c.add(10 * 60000);                  // 10 minutos sin tocar
  assert.equal(t.stop(), 30);         // 5 s de espera no cuentan, sólo la ventana de 30 s tras la nota
});

test("actividad continua suma todo el tiempo", () => {
  const c = clock();
  const t = createTimeTracker({ now: c.now, idleMs: 30000 });
  t.start();
  for (let i = 0; i < 20; i++) { c.add(10000); t.activity(); }   // notas cada 10 s durante 200 s
  c.add(1000);
  // el tramo previo a la primera nota no cuenta (no hubo actividad); de ahí en más, todo: 190 s + 1 s de cola
  assert.equal(t.stop(), 191);
});

test("sin ninguna nota no suma nada, aunque la práctica esté abierta", () => {
  const c = clock();
  const t = createTimeTracker({ now: c.now });
  t.start(); c.add(40000);
  assert.equal(t.stop(), 0);
});

test("pausa: no cuenta mientras está en pausa, ni la ventana de actividad anterior", () => {
  const c = clock();
  const t = createTimeTracker({ now: c.now, idleMs: 30000 });
  t.start(); c.add(1000); t.activity();
  c.add(2000); t.pause();             // sólo 2 s después de la nota
  c.add(60000);                       // pausado un minuto
  t.start(); c.add(1000);             // reanuda sin tocar: no cuenta nada
  assert.equal(t.stop(), 2);
});

test("activity() fuera de práctica no cuenta y pausar dos veces no duplica", () => {
  const c = clock();
  const t = createTimeTracker({ now: c.now });
  t.activity(); c.add(5000); t.activity();
  assert.equal(t.running, false);
  t.start(); c.add(1000); t.activity(); c.add(1000); t.pause(); t.pause();
  assert.equal(t.stop(), 1);
});

test("onSpan entrega los tramos contados y su suma coincide con stop()", () => {
  const c = clock();
  const spans = [];
  const t = createTimeTracker({ now: c.now, idleMs: 10000, onSpan: (a, b) => spans.push([a, b]) });
  t.start(); c.add(3000); t.activity(); c.add(20000); t.pause();
  const sum = spans.reduce((x, [a, b]) => x + (b - a), 0) / 1000;
  assert.equal(sum, 10);             // ventana de 10 s tras la nota a los 3 s
  assert.equal(t.stop(), 10);
});

test("seconds() muestra el total parcial sin pausar", () => {
  const c = clock();
  const t = createTimeTracker({ now: c.now, idleMs: 30000 });
  t.start(); c.add(1000); t.activity(); c.add(4000);
  assert.equal(t.seconds(), 4);
  assert.equal(t.running, true);
});

test("una sesión que cruza la medianoche se reparte entre los dos días", () => {
  const parts = splitByDay(at(2026, 11, 12, 23, 50), at(2026, 11, 13, 0, 10));
  assert.deepEqual(parts.map((p) => p.day), ["2026-11-12", "2026-11-13"]);
  assert.deepEqual(parts.map((p) => p.seconds), [600, 600]);
  assert.deepEqual(splitByDay(5, 5), []);
});

test("el tracker reparte por día un tramo que cruza medianoche", () => {
  const c = clock(at(2026, 11, 12, 23, 59, 50));
  const days = {};
  const t = createTimeTracker({ now: c.now, idleMs: 60000, onSpan: (a, b) => { for (const p of splitByDay(a, b)) days[p.day] = (days[p.day] || 0) + p.seconds; } });
  t.start(); t.activity(); c.add(20000); t.pause();
  assert.equal(days["2026-11-12"], 10);
  assert.equal(days["2026-11-13"], 10);
});

test("addSession suma por día y partitura sin mutar el registro", () => {
  const log0 = addSession(null, { day: "2026-11-13", scoreId: "a", seconds: 60 });
  const log1 = addSession(log0, { day: "2026-11-13", scoreId: "a", seconds: 30 });
  const log2 = addSession(log1, { day: "2026-11-13", scoreId: "b", seconds: 10 });
  assert.equal(log1.days["2026-11-13"].a, 90);
  assert.equal(log0.days["2026-11-13"].a, 60);
  assert.equal(log2.days["2026-11-13"].b, 10);
  assert.deepEqual(addSession(log2, { day: "2026-11-13", scoreId: "a", seconds: 0 }), log2);
});

test("totales: hoy, semana, mes, byDay de 30 días, byScore y la racha", () => {
  const now = at(2026, 11, 13, 15);
  const log = { days: {} };
  const put = (k, id, s) => { const d = shiftDay(now, k); log.days[d] = { ...(log.days[d] || {}), [id]: s }; };
  put(0, "a", 600); put(1, "a", 1200); put(2, "b", 300); put(6, "a", 60); put(8, "a", 900); put(40, "b", 5000);
  const t = totals(log, { now });
  assert.equal(t.today, 600);
  assert.equal(t.week, 600 + 1200 + 300 + 60);
  assert.equal(t.month, 600 + 1200 + 300 + 60 + 900);   // hace 8 días entra en los 30; el de hace 40 días queda fuera
  assert.equal(t.total, 600 + 1200 + 300 + 60 + 900 + 5000);
  assert.equal(t.byDay.length, 30);
  assert.equal(t.byDay[29].day, dayKey(now));
  assert.equal(t.byDay[29].seconds, 600);
  assert.equal(t.byDay[0].seconds, 0);
  assert.deepEqual(t.byScore[0], { scoreId: "b", seconds: 5300 });
  assert.equal(t.streakDays, 3);                  // hoy, ayer y anteayer; hace 6 días no entra
});

test("racha: si hoy no hubo práctica, cuenta desde ayer", () => {
  const now = at(2026, 11, 13, 9);
  const log = { days: { [shiftDay(now, 1)]: { a: 100 }, [shiftDay(now, 2)]: { a: 100 } } };
  assert.equal(totals(log, { now }).streakDays, 2);
  assert.equal(totals(log, { now }).today, 0);
  assert.equal(totals({ days: {} }, { now }).streakDays, 0);
});

test("formatDuration: horas, minutos y menos de un minuto", () => {
  assert.equal(formatDuration(12 * 3600 + 35 * 60), "12 h 35 min");
  assert.equal(formatDuration(2 * 3600), "2 h");
  assert.equal(formatDuration(48 * 60 + 59), "48 min");
  assert.equal(formatDuration(59), "menos de 1 min");
  assert.equal(formatDuration(0), "menos de 1 min");
  assert.equal(formatDuration(NaN), "menos de 1 min");
});

test("mergeLogs toma el mayor por día y partitura (importar dos veces no duplica)", () => {
  const a = { days: { "2026-11-13": { x: 100, y: 50 } } };
  const b = { days: { "2026-11-13": { x: 80, z: 30 }, "2026-11-12": { x: 10 } } };
  const m = mergeLogs(a, b);
  assert.deepEqual(m, { days: { "2026-11-13": { x: 100, y: 50, z: 30 }, "2026-11-12": { x: 10 } } });
  assert.deepEqual(mergeLogs(m, a), m);
});

test("normalizeLog descarta valores inválidos y scoreSeconds suma por partitura", () => {
  const n = normalizeLog({ days: { "2026-11-13": { a: 10, b: -4, c: "x" }, "mal": { a: 1 } } });
  assert.deepEqual(n, { days: { "2026-11-13": { a: 10 } } });
  assert.equal(scoreSeconds(n, "a"), 10);
  assert.equal(scoreSeconds(null, "a"), 0);
  assert.equal(typeof TEORIA_ID, "string");
});

test("checkpoint acredita lo contado sin pausar ni duplicar", () => {
  const c = clock();
  const spans = [];
  const t = createTimeTracker({ now: c.now, idleMs: 30000, onSpan: (a, b) => spans.push((b - a) / 1000) });
  t.start(); c.add(1000); t.activity(); c.add(5000); t.checkpoint(); c.add(5000); t.checkpoint(); c.add(1000);
  assert.equal(t.stop(), 11);
  assert.deepEqual(spans, [5, 5, 1]);
});
