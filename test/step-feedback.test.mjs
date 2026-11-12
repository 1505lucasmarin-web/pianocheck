import test from "node:test";
import assert from "node:assert/strict";
import { errorHand, handMarks } from "../js/step-feedback.js";
import { createPulse } from "../js/timing.js";

const target = { rh: [64], lh: [48] };

test("una mano correcta conserva su marca aunque la otra se equivoque o se corrija", () => {
  for (const [correct, wrong, played] of [["rh", "lh", 49], ["lh", "rh", 65]]) {
    assert.equal(errorHand(target, played, target[wrong]), wrong);
    const dirty = new Set([wrong]);
    const expected = { [correct]: "clean", [wrong]: "dirty" };
    assert.deepEqual(handMarks(target, target[correct], dirty), expected);
    assert.deepEqual(handMarks(target, [64, 48], dirty), expected);
  }
});

test("un error equidistante antes de que toque ninguna mano queda sin atribuir", () => {
  assert.equal(errorHand(target, 56, [48, 64]), null);
  assert.deepEqual(handMarks(target, [], new Set()), {});
});

test("a pulso informa cuál nota acertó y cuál faltó en un paso simultáneo", () => {
  const pulse = createPulse([{ i: 0, t: 0, measure: 0, midi: [48, 64] }], { bpm: 80, win: 120, lapBeats: 4 });
  assert.deepEqual(pulse.noteOn(64, 0).hit, [64]);
  assert.deepEqual(pulse.noteOn(49, 10).hit, [64]);
  const [step] = pulse.tick(500);
  assert.deepEqual(step.hit, [64]);
  assert.deepEqual(step.missing, [48]);
});
