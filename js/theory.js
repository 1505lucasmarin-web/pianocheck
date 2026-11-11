// Teoría de la escala mayor y acordes diatónicos. Sin DOM, sin dependencias.
// Nombres latinos (Do Re Mi Fa Sol La Si) con ortografía correcta por tonalidad.

/** Patrón de la escala mayor: T = tono, S = semitono (Fundamental–T–T–S–T–T–T–S). */
export const MAJOR_PATTERN = ['T', 'T', 'S', 'T', 'T', 'T', 'S'];

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const LATIN = { C: 'Do', D: 'Re', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si' };
const ACC_SYMBOL = { '-2': '𝄫', '-1': '♭', '0': '', '1': '♯', '2': '𝄪' };
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
/** Calidad de cada grado de la escala mayor (apuntes de clase). */
const DEGREE_QUALITY = ['Mayor', 'menor', 'menor', 'Mayor', 'Mayor', 'menor', 'disminuido'];
const QUALITY_SUFFIX = { Mayor: '', menor: 'm', disminuido: ' dim' };

/** Orden de ids con su ortografía. Elección documentada: Fa♯ (6 sostenidos) y Re♭ (5 bemoles). */
const KEY_DEFS = [
  ['C', 'C', 0, 0], ['G', 'G', 0, 1], ['D', 'D', 0, 1], ['A', 'A', 0, 1], ['E', 'E', 0, 1], ['B', 'B', 0, 1],
  ['F#', 'F', 1, 1], ['Db', 'D', -1, 1], ['Ab', 'A', -1, 1], ['Eb', 'E', -1, 1], ['Bb', 'B', -1, 1], ['F', 'F', 0, 1],
];

function pcOf(letter, acc) { return (((LETTER_PC[letter] + acc) % 12) + 12) % 12; }
function accName(acc) { return ACC_SYMBOL[String(acc)] ?? (acc > 0 ? '♯'.repeat(acc) : '♭'.repeat(-acc)); }
function latinName(letter, acc) { return LATIN[letter] + accName(acc); }

// Alteraciones de armadura: sostenidos (+) o bemoles (-)
const SIGNATURE = { C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5 };

/**
 * Las 12 tonalidades mayores en ortografía estándar: Do, Sol, Re, La, Mi, Si, Fa♯, Re♭, La♭, Mi♭, Si♭, Fa.
 * Decisión: la tonalidad de 6 alteraciones se llama Fa♯ (no Sol♭) y la de 5♭ se llama Re♭ (no Do♯, que tendría 7♯).
 * `accidentals`: nº de alteraciones de la armadura (positivo = sostenidos, negativo = bemoles).
 * @type {{id:string,name:string,tonicPc:number,accidentals:number}[]}
 */
export const KEYS = KEY_DEFS.map(([id, letter, acc]) => ({
  id,
  name: latinName(letter, acc) + ' mayor',
  tonicPc: pcOf(letter, acc),
  accidentals: SIGNATURE[id],
}));

function keyDef(keyId) {
  const i = KEY_DEFS.findIndex((d) => d[0] === keyId);
  if (i < 0) throw new Error('Tonalidad desconocida: ' + keyId);
  return { id: KEY_DEFS[i][0], letter: KEY_DEFS[i][1], acc: KEY_DEFS[i][2], info: KEYS[i] };
}

/**
 * Escala mayor con ortografía correcta (una letra por grado).
 * @param {string} keyId id de KEYS ("C","F#","Bb"…)
 * @returns {{degree:number,pc:number,letter:string,accidental:number,name:string}[]}
 *   letter: "C".."B"; accidental: -2..2; name latino p. ej. "Fa♯".
 */
export function majorScale(keyId) {
  const k = keyDef(keyId);
  const li = LETTERS.indexOf(k.letter);
  const out = [];
  let pc = k.info.tonicPc;
  for (let i = 0; i < 7; i++) {
    const letter = LETTERS[(li + i) % 7];
    let acc = (((pc - LETTER_PC[letter]) % 12) + 12) % 12;
    if (acc > 6) acc -= 12;
    out.push({ degree: i + 1, pc, letter, accidental: acc, name: latinName(letter, acc) });
    pc = (pc + (MAJOR_PATTERN[i] === 'T' ? 2 : 1)) % 12;
  }
  return out;
}

/**
 * Notas MIDI de la escala. La fundamental cae en la octava `octave` (Do4 = 60).
 * @param {string} keyId
 * @param {{octave?:number, octaves?:number, direction?:'up'|'updown'}} [opts]
 * @returns {number[]} incluye la nota final de la octava; en "updown" baja sin repetir el punto más alto.
 */
export function scaleMidi(keyId, { octave = 4, octaves = 1, direction = 'up' } = {}) {
  const k = keyDef(keyId);
  const up = [(octave + 1) * 12 + k.info.tonicPc];
  for (let o = 0; o < octaves; o++) {
    for (const s of MAJOR_PATTERN) up.push(up[up.length - 1] + (s === 'T' ? 2 : 1));
  }
  if (direction === 'updown') return up.concat(up.slice(0, -1).reverse());
  return up;
}

/**
 * Pasos entre grados consecutivos (7 pasos hasta la octava).
 * @param {string} keyId
 * @returns {{from:string,to:string,step:'T'|'S'}[]} from/to son nombres latinos.
 */
export function scaleSteps(keyId) {
  const sc = majorScale(keyId);
  return MAJOR_PATTERN.map((step, i) => ({ from: sc[i].name, to: sc[(i + 1) % 7].name, step }));
}

/**
 * Los 7 acordes de tres sonidos de la tonalidad.
 * @param {string} keyId
 * @returns {{degree:string,quality:'Mayor'|'menor'|'disminuido',name:string,notes:string[],pcs:number[],midi:number[]}[]}
 *   name: "Do", "Rem", "Si dim"; midi: posición fundamental con la fundamental en 60..71.
 */
export function diatonicTriads(keyId) {
  const sc = majorScale(keyId);
  return sc.map((root, i) => {
    const q = DEGREE_QUALITY[i];
    const tri = [sc[i], sc[(i + 2) % 7], sc[(i + 4) % 7]];
    const base = 60 + root.pc;
    const midi = [base];
    for (const n of tri.slice(1)) {
      let m = midi[midi.length - 1] + 1;
      while (m % 12 !== n.pc) m++;
      midi.push(m);
    }
    return {
      degree: ROMAN[i],
      quality: q,
      name: root.name + QUALITY_SUFFIX[q],
      notes: tri.map((n) => n.name),
      pcs: tri.map((n) => n.pc),
      midi,
    };
  });
}

/**
 * Verifica un acorde tocado por clases de altura (cualquier octava, inversión o duplicación).
 * @param {number[]} playedMidis
 * @param {{pcs:number[]}} triad
 * @returns {{ok:boolean, missingPcs:number[], wrongMidis:number[]}}
 *   missingPcs: clases del acorde que faltan; wrongMidis: notas tocadas ajenas al acorde.
 */
export function checkTriad(playedMidis, triad) {
  const played = (playedMidis || []).filter((m) => Number.isInteger(m));
  const have = new Set(played.map((m) => ((m % 12) + 12) % 12));
  const want = new Set(triad.pcs);
  const missingPcs = triad.pcs.filter((pc) => !have.has(pc));
  const wrongMidis = played.filter((m) => !want.has(((m % 12) + 12) % 12));
  return { ok: missingPcs.length === 0 && wrongMidis.length === 0, missingPcs, wrongMidis };
}

function pick(arr, rng) {
  return arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];
}

// Elige pares (tonalidad, grado) sin repetir el anterior: si coincide, avanza un grado.
function* pairs(keyId, rng) {
  let prev = null;
  for (;;) {
    const key = keyId || pick(KEYS, rng).id;
    let deg = Math.min(6, Math.floor(rng() * 7));
    if (prev && prev.key === key && prev.deg === deg) deg = (deg + 1) % 7;
    prev = { key, deg };
    yield prev;
  }
}

/**
 * Preguntas "¿qué tipo de acorde es el IV grado de Sol mayor?".
 * @param {string|null} keyId null = tonalidad al azar en cada pregunta
 * @param {number} n cantidad
 * @param {() => number} [rng=Math.random]
 * @returns {{prompt:string,options:string[],answer:string,explain:string,key:string,degree:string}[]}
 */
export function makeQualityQuiz(keyId, n, rng = Math.random) {
  const out = [];
  const gen = pairs(keyId, rng);
  for (let i = 0; i < n; i++) {
    const { key, deg } = gen.next().value;
    const t = diatonicTriads(key)[deg];
    const kn = keyDef(key).info.name;
    out.push({
      prompt: `¿Qué tipo de acorde es el ${t.degree} grado de ${kn}?`,
      options: ['Mayor', 'menor', 'disminuido'],
      answer: t.quality,
      explain: `En ${kn} el ${t.degree} grado es ${t.name} (${t.notes.join('–')}): acorde ${t.quality}.`,
      key,
      degree: t.degree,
    });
  }
  return out;
}

/**
 * Consignas "Tocá el IV de Sol mayor".
 * @param {string|null} keyId null = tonalidad al azar
 * @param {number} n
 * @param {() => number} [rng=Math.random]
 * @returns {{prompt:string, triad:object, key:string}[]} triad tiene la forma de diatonicTriads().
 */
export function makeDegreeTasks(keyId, n, rng = Math.random) {
  const out = [];
  const gen = pairs(keyId, rng);
  for (let i = 0; i < n; i++) {
    const { key, deg } = gen.next().value;
    const triad = diatonicTriads(key)[deg];
    out.push({ prompt: `Tocá el ${triad.degree} de ${keyDef(key).info.name}`, triad, key });
  }
  return out;
}

/**
 * Nombre latino con la ortografía de la tonalidad y la octava científica (Do4 = 60).
 * 66 en Fa♯ mayor → "Fa♯4"; 65 en Fa♯ mayor → "Mi♯4". Notas fuera de la escala usan
 * sostenidos (tonalidades con ♯ o Do) o bemoles (tonalidades con ♭).
 * @param {number} midi
 * @param {string} keyId
 * @returns {string} "?" si midi es inválido
 */
export function noteNameInKey(midi, keyId) {
  if (!Number.isInteger(midi) || midi < 0 || midi > 127) return '?';
  const pc = midi % 12;
  const sc = majorScale(keyId);
  let n = sc.find((x) => x.pc === pc);
  if (!n) {
    const flats = keyDef(keyId).info.accidentals < 0;
    const sharpL = ['C', 'C', 'D', 'D', 'E', 'F', 'F', 'G', 'G', 'A', 'A', 'B'];
    const flatL = ['C', 'D', 'D', 'E', 'E', 'F', 'G', 'G', 'A', 'A', 'B', 'B'];
    const letter = (flats ? flatL : sharpL)[pc];
    let acc = pc - LETTER_PC[letter];
    n = { letter, accidental: acc };
  }
  const nat = midi - n.accidental;
  return latinName(n.letter, n.accidental) + (Math.floor(nat / 12) - 1);
}
