import { durBeats, isTied, keyToMidi } from "./model.js";

const FINGERS = [1, 2, 3, 4, 5];
const BLACK = new Set([1, 3, 6, 8, 10]);
const isBlack = (midi) => BLACK.has(midi % 12);

function assignments(notes, hand) {
  const result = [];
  function place(i, previous, values) {
    if (i === notes.length) {
      result.push(values);
      return;
    }
    for (const finger of FINGERS) {
      if (notes[i].fixed && notes[i].fixed !== finger) continue;
      if (previous != null && (hand === "rh" ? finger <= previous : finger >= previous)) continue;
      place(i + 1, finger, [...values, finger]);
    }
  }
  place(0, null, []);
  return result;
}

function shapeCost(notes, fingers) {
  let cost = 0;
  for (let i = 0; i < notes.length; i++) {
    const finger = fingers[i], midi = notes[i].midi;
    if (isBlack(midi) && finger === 1) cost += 2;
    if (isBlack(midi) && finger === 5) cost += 0.45;
    if (!i) continue;
    const span = midi - notes[i - 1].midi;
    const low = Math.min(finger, fingers[i - 1]);
    const high = Math.max(finger, fingers[i - 1]);
    const comfortable = low === 1 ? [0, 4, 7, 9, 12][high - 1] : (high - low) * 2 + 1;
    cost += Math.max(0, span - comfortable) ** 2 * 0.9;
    cost += Math.max(0, high - low - span) * 0.35;
  }
  return cost;
}

function moveCost(before, after, hand, gap) {
  if (!before.length || !after.length) return 0;
  const sign = hand === "rh" ? 1 : -1;
  const a = before.at(-1), b = after.at(-1);
  const shift = Math.abs((b.midi - sign * b.finger * 2) - (a.midi - sign * a.finger * 2));
  let cost = Math.max(0, shift - 1) * (gap >= 1 ? 0.22 : 0.62);
  if (a.midi === b.midi) return cost + (a.finger === b.finger ? 0 : 1.2);
  const semitones = (b.midi - a.midi) * sign;
  if (Math.abs(semitones) <= 5 && semitones * (b.finger - a.finger) <= 0) {
    if ((a.finger === 1 || b.finger === 1) && a.finger !== b.finger) cost = 1.2 + (isBlack((a.finger === 1 ? a : b).midi) ? 2 : 0);
    else cost += gap >= 1 ? 1 : 3.6;
  }
  return cost;
}

/** Sugiere dedos editables para las dos manos, conservando las indicaciones escritas. */
export function suggestFingering(score) {
  const result = structuredClone(score);
  let added = 0, skipped = 0;
  for (const hand of ["rh", "lh"]) {
    let layers = [];
    let gap = 0;
    function finish() {
      let pick = layers.at(-1)?.states.reduce((best, state) => state.cost < best.cost ? state : best);
      for (let i = layers.length - 1; i >= 0; i--) {
        const { event, notes } = layers[i];
        event.f = [...(event.f || Array(event.k.length).fill(0))];
        notes.forEach(({ index, fixed }, j) => {
          if (!fixed && !notes[j].held) { event.f[index] = pick.notes[j].finger; added++; }
        });
        if (!event.f.some(Boolean)) delete event.f;
        pick = pick.previous;
      }
      layers = [];
    }
    for (const measure of result.measures) for (const event of measure[hand] || []) {
      if (!event.k.length) { gap += durBeats(event); continue; }
      if (event.tie) continue;
      const notes = event.k.map((key, index) => ({ midi: keyToMidi(key), index, fixed: event.f?.[index] || 0, held: isTied(event, key) }))
        .sort((a, b) => a.midi - b.midi);
      const choices = notes.length > 5 || notes.some((n) => n.midi == null) ? [] : assignments(notes, hand);
      if (!choices.length) {
        finish();
        skipped += notes.filter((n) => !n.fixed).length;
        gap = 0;
        continue;
      }
      const previous = layers.at(-1)?.states || [{ notes: [], cost: 0 }];
      const states = choices.flatMap((fingers) => {
        const placed = notes.map((n, i) => ({ midi: n.midi, finger: fingers[i] }));
        const compatible = previous.filter((state) => notes.every((n, i) => !n.held || !state.notes.some((p) => p.midi === n.midi && p.finger !== fingers[i])));
        if (!compatible.length) return [];
        const best = compatible.map((state) => ({ state, cost: state.cost + moveCost(state.notes, placed, hand, gap) }))
          .reduce((a, b) => b.cost < a.cost ? b : a);
        const centerBias = placed.length === 1 && !best.state.notes.length ? Math.abs(placed[0].finger - 3) * 0.08 : 0;
        return [{ notes: placed, previous: best.state, cost: best.cost + shapeCost(notes, fingers) + centerBias }];
      });
      if (!states.length) {
        finish(); skipped += notes.filter((n) => !n.fixed && !n.held).length; gap = 0;
        continue;
      }
      layers.push({ event, notes, states });
      gap = 0;
    }
    finish();
  }
  return { score: result, added, skipped };
}
