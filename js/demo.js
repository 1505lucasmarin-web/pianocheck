// Partitura de demostración: Oda a la Alegría (Beethoven, dominio público), 8 compases, a dos manos.
const C = ["c/3", "e/3"], G = ["g/2", "d/3"], Gb = ["g/2", "b/2"];
const q = (k) => ({ k: [k], d: "q" });

export const demoScore = {
  id: "demo-oda-a-la-alegria",
  title: "Oda a la Alegría (demo)",
  bpm: 80,
  timeSig: [4, 4],
  keySig: "C",
  measures: [
    { rh: [q("e/4"), q("e/4"), q("f/4"), q("g/4")], lh: [{ k: C, d: "h" }, { k: C, d: "h" }] },
    { rh: [q("g/4"), q("f/4"), q("e/4"), q("d/4")], lh: [{ k: G, d: "h" }, { k: G, d: "h" }] },
    { rh: [q("c/4"), q("c/4"), q("d/4"), q("e/4")], lh: [{ k: C, d: "h" }, { k: C, d: "h" }] },
    { rh: [{ k: ["e/4"], d: "q", dots: 1 }, { k: ["d/4"], d: "8" }, { k: ["d/4"], d: "h" }], lh: [{ k: Gb, d: "h" }, { k: C, d: "h" }] },
    { rh: [q("e/4"), q("e/4"), q("f/4"), q("g/4")], lh: [{ k: C, d: "h" }, { k: C, d: "h" }] },
    { rh: [q("g/4"), q("f/4"), q("e/4"), q("d/4")], lh: [{ k: G, d: "h" }, { k: G, d: "h" }] },
    { rh: [q("c/4"), q("c/4"), q("d/4"), q("e/4")], lh: [{ k: C, d: "h" }, { k: C, d: "h" }] },
    { rh: [{ k: ["d/4"], d: "q", dots: 1 }, { k: ["c/4"], d: "8" }, { k: ["c/4"], d: "h" }], lh: [{ k: Gb, d: "h" }, { k: C, d: "h" }] },
  ],
};
