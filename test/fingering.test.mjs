import test from "node:test";
import assert from "node:assert/strict";
import { suggestFingering } from "../js/fingering.js";
import { getPieceScore } from "../js/pieces.js";
import { buildSchedule } from "../js/playback.js";

test("digitación: las manos espejan los acordes y se conservan los dedos impresos", () => {
  const score = { measures: [{
    rh: [{ k: ["c/4", "e/4", "g/4"], d: "h", f: [1, 0, 5] }, { k: ["a/4"], d: "h" }],
    lh: [{ k: ["c/3", "e/3", "g/3"], d: "w", f: [5, 0, 1] }],
  }] };
  const result = suggestFingering(score);
  assert.equal(result.added, 3);
  assert.deepEqual(score.measures[0].rh[0].f, [1, 0, 5]);
  const { rh, lh } = result.score.measures[0];
  assert.equal(rh[0].f[0], 1);
  assert.equal(rh[0].f[2], 5);
  assert.equal(lh[0].f[0], 5);
  assert.equal(lh[0].f[2], 1);
  assert.ok(rh[0].f[1] > 1 && rh[0].f[1] < 5 && lh[0].f[1] > 1 && lh[0].f[1] < 5);
});

test("Preludio BWV 846: 35 compases y el Do y el Mi iniciales se sostienen juntos", () => {
  const score = getPieceScore("bach-preludio-bwv846", "preludio");
  assert.equal(score.measures.length, 35);
  const events = buildSchedule(score).events.filter((e) => e.measure === 0);
  assert.deepEqual(events.slice(0, 3).map((e) => [e.midi, e.beat, e.dur]), [[60, 0, 2], [64, .25, 1.75], [67, .5, .25]]);
  const result = suggestFingering(score);
  assert.ok(result.added > 200);
  assert.deepEqual(buildSchedule(result.score).events, buildSchedule(score).events);
});
