import test from "node:test";
import assert from "node:assert/strict";
import { holdInfo, createHoldTracker, holdTolerance, summarizeHolds, holdLine, holdWeakText, beatsText, normHoldMode } from "../js/hold.js";
import { buildSteps, validateScore } from "../js/model.js";

const score = (rh, lh = [], extra = {}) => validateScore({ title: "t", bpm: 60, timeSig: [4, 4], keySig: "C", measures: [{ rh, lh }, ...(extra.more || [])] }).score;

test("holdInfo: blanca 2, redonda 4, negra 1 y ligadura suman", () => {
  const sc = score([{ d: "h", k: ["c/4"] }, { d: "h", k: ["d/4"] }], [{ d: "w", k: ["c/3"] }], { more: [{ rh: [{ d: "q", k: ["d/4"], tie: true }, { d: "q", k: ["e/4"] }, { d: "h", k: [] }], lh: [{ d: "w", k: [] }] }] });
  const st = buildSteps(sc, "both");
  const hi = holdInfo(sc, st);
  const at = (t, m) => hi[st.findIndex((s) => s.t === t)].find((x) => x.midi === m);
  assert.equal(at(0, 60).beats, 2);
  assert.equal(at(0, 48).beats, 4);
  assert.equal(at(2, 62).beats, 3);       // blanca + negra ligada
  assert.equal(at(5, 64).beats, 1);
  assert.equal(at(0, 60).measure, 0);
});

test("tolerancia: 15 % o 120 ms, la mayor", () => {
  assert.equal(holdTolerance(4, 60), 0.6);                         // 15 % de 4 = 0,6 > 0,12
  assert.ok(Math.abs(holdTolerance(1, 200) - 0.4) < 1e-9);          // 120 ms a 200 bpm = 0,4 negras
});

const mk = (bpm = 60) => { let t = 0; const res = []; const tr = createHoldTracker({ bpm, now: () => t, onResult: (r) => res.push(r) }); return { tr, res, at: (x) => { t = x; return x; } }; };

test("blanca sostenida completa → done; el avance de tick es lineal", () => {
  const { tr, res } = mk(60);
  tr.press(60, { hand: "rh", beats: 2, measure: 0 }, 0);
  let v = tr.tick(1000)[0];
  assert.equal(v.state, "holding"); assert.equal(v.total, 2); assert.equal(v.elapsed, 1); assert.equal(v.remaining, 1); assert.equal(v.fraction, 0.5);
  tr.release(60, 2000);
  assert.equal(tr.get(60, 2000).state, "done"); assert.equal(res.length, 1);
  assert.equal(res[0].state, "done");
});

test("soltada a la mitad → early con lo que faltaba", () => {
  const { tr, res } = mk(60);
  tr.press(60, { hand: "rh", beats: 2, measure: 3 }, 0);
  tr.release(60, 1000);
  const v = tr.get(60, 1000);
  assert.equal(v.state, "early"); assert.equal(v.short, 1); assert.equal(res[0].measure, 3);
  assert.equal(beatsText(v.short), "faltaba 1 tiempo");
  assert.equal(beatsText(2), "faltaban 2 tiempos"); assert.equal(beatsText(0.5), "faltaba medio tiempo");
});

test("soltar dentro de la tolerancia cuenta como completa", () => {
  const a = mk(60); a.tr.press(60, { hand: "rh", beats: 4 }, 0); a.tr.release(60, 3500); assert.equal(a.tr.get(60, 3500).state, "done");   // 0,5 < 0,6
  const b = mk(60); b.tr.press(60, { hand: "rh", beats: 4 }, 0); b.tr.release(60, 3300); assert.equal(b.tr.get(60, 3300).state, "early");
});

test("sin soltar, al llegar al final pasa a done; luego se olvida", () => {
  const { tr } = mk(120);
  tr.press(60, { hand: "lh", beats: 2 }, 0);
  assert.equal(tr.tick(900)[0].state, "holding");
  assert.equal(tr.tick(1000)[0].state, "done");
  assert.equal(tr.tick(1000 + 3000).length, 0);
});

test("notas de menos de 1 tiempo no se siguen", () => {
  const { tr } = mk(); assert.equal(tr.press(60, { hand: "rh", beats: 0.5 }, 0), null); assert.equal(tr.tick(10).length, 0);
  assert.equal(tr.press(60, null, 0), null);
});

test("cambio de tempo en caliente: lo transcurrido no cambia", () => {
  const { tr } = mk(60);
  tr.press(60, { hand: "rh", beats: 4 }, 0);
  tr.setBpm(120, 1000);                      // 1 negra hecha; ahora 500 ms por negra
  const v = tr.tick(2000)[0];                // +2 negras
  assert.equal(v.elapsed, 3); assert.equal(v.remaining, 1);
});

test("notas repetidas: la segunda pulsación cierra la anterior y empieza otra", () => {
  const { tr, res } = mk(60);
  tr.press(60, { hand: "rh", beats: 2 }, 0);
  tr.press(60, { hand: "rh", beats: 2 }, 500);
  assert.equal(res.length, 1); assert.equal(res[0].state, "early");
  assert.equal(tr.get(60, 500).state, "holding"); assert.equal(tr.get(60, 500).elapsed, 0);
});

test("se soltó para tocar la siguiente con la misma mano: no penaliza", () => {
  const { tr, res } = mk(60);
  tr.press(60, { hand: "rh", beats: 4, step: 0 }, 0);
  tr.press(64, { hand: "rh", beats: 0.5, step: 1 }, 1000);       // la misma mano toca otra nota (otro paso)
  tr.release(60, 1100);
  assert.equal(res[0].state, "done"); assert.equal(res[0].excused, true);
  const o = mk(60); o.tr.press(60, { hand: "lh", beats: 4, step: 0 }, 0); o.tr.press(64, { hand: "rh", beats: 0.5, step: 1 }, 1000); o.tr.release(60, 1100);
  assert.equal(o.res[0].state, "early");                // otra mano: sí penaliza
});

test("pedal pisado: soltar la tecla no cuenta; al soltar el pedal sí", () => {
  const { tr, res } = mk(60);
  tr.pedal(true, 0);
  tr.press(60, { hand: "rh", beats: 2 }, 0);
  tr.release(60, 500);
  assert.equal(tr.get(60, 500).state, "holding"); assert.equal(res.length, 0);
  tr.pedal(false, 2100);
  assert.equal(tr.get(60, 2100).state, "done");
  const b = mk(60); b.tr.pedal(true, 0); b.tr.press(60, { hand: "rh", beats: 4 }, 0); b.tr.release(60, 500); b.tr.pedal(false, 1000);
  assert.equal(b.tr.get(60, 1000).state, "early");
});

test("guiado (micrófono): se anima, nunca se evalúa", () => {
  const { tr, res } = mk(60);
  tr.press(60, { hand: "rh", beats: 2, guided: true }, 0);
  tr.release(60, 500);
  assert.equal(tr.tick(600)[0].state, "holding");
  assert.equal(tr.tick(2000)[0].state, "done");
  assert.equal(res.length, 0); assert.equal(tr.results.length, 0);
});

test("resumen y textos", () => {
  const { tr } = mk(60);
  tr.press(60, { hand: "rh", beats: 2, measure: 0 }, 0); tr.release(60, 2000);
  tr.press(62, { hand: "rh", beats: 2, measure: 2 }, 3000); tr.release(62, 3500);
  tr.press(64, { hand: "rh", beats: 2, measure: 2 }, 5000); tr.release(64, 5300);
  const s = summarizeHolds(tr.results);
  assert.deepEqual([s.total, s.ok, s.early], [3, 1, 2]);
  assert.equal(holdLine(s), "Duraciones: sostuviste completas 1 de 3 notas largas");
  assert.equal(holdWeakText(s), "Soltaste antes en: compás 3 (2)");
  assert.equal(holdLine(summarizeHolds([])), null);
  assert.equal(normHoldMode("x"), "mostrar"); assert.equal(normHoldMode("exigir"), "exigir");
});

test("las notas de un mismo acorde (mismo paso, misma mano) no se excusan entre sí", () => {
  const { tr, res } = mk(60);
  tr.press(48, { hand: "lh", beats: 2, step: 0 }, 0); tr.press(52, { hand: "lh", beats: 2, step: 0 }, 20);
  tr.release(48, 500);
  assert.equal(res[0].state, "early");
});
