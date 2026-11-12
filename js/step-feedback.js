const HANDS = ["rh", "lh"];

/** MIDI no indica la mano física: atribuir el error a la nota pendiente más cercana. */
export function errorHand(targets, played, remaining) {
  let result = null, distance = Infinity;
  for (const hand of HANDS) for (const note of targets[hand]) {
    if (!remaining.includes(note)) continue;
    const gap = Math.abs(played - note);
    if (gap < distance) { result = hand; distance = gap; }
    else if (gap === distance && result !== hand) result = null;
  }
  return result;
}

export function handMarks(targets, hit, dirty = new Set(), kind = "clean") {
  const result = {};
  for (const hand of HANDS) {
    const notes = targets[hand];
    if (dirty.has(hand)) result[hand] = "dirty";
    else if (notes.length && notes.every((n) => hit.includes(n))) result[hand] = kind;
  }
  return result;
}
