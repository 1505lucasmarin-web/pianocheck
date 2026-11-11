// Lógica pura de los ejercicios de Teoría (sin DOM). Usa theory.js.
import { scaleMidi, checkTriad } from './theory.js';

/** Puntaje { correct, total, pct } (pct entero 0..100). */
export function scoreOf(correct, total) {
  const t = Math.max(0, Math.floor(total) || 0);
  const c = Math.max(0, Math.min(t, Math.floor(correct) || 0));
  return { correct: c, total: t, pct: t ? Math.round((c / t) * 100) : 0 };
}

/**
 * Ejercicio de escala nota por nota.
 *  - Guiado ("Tocala"): cada nota debe ser exactamente la de la secuencia (octava 4 por defecto).
 *  - Libre ("Armala vos", free:true): la primera nota debe ser la fundamental en CUALQUIER octava y de ahí
 *    en adelante la secuencia se desplaza igual; el llamador no muestra las notas siguientes.
 * Los errores no frenan el ejercicio; cada posición cuenta "a la primera" sólo si nunca se erró.
 * @param {string} keyId id de theory.KEYS
 * @param {{direction?:'up'|'updown', free?:boolean, octave?:number}} [opts]
 * @returns {{noteOn(midi:number):object, readonly sequence:number[], readonly index:number, readonly total:number,
 *   readonly done:boolean, readonly mistakes:number, expected():number|null, result():{correct:number,total:number,pct:number}}}
 *   noteOn → {type:'ok', index, midi, next:number|null} | {type:'done', index, midi, result}
 *            | {type:'wrong', index, played, expected, prev:number|null, delta:number|null} | {type:'ignored'}
 *   `delta` = expected − prev con signo (+ sube, − baja); null en la primera nota.
 */
export function createScaleRun(keyId, opts = {}) {
  const { direction = 'up', free = false, octave = 4 } = opts;
  const base = scaleMidi(keyId, { octave, direction });
  let off = 0;
  let i = 0;
  let mistakes = 0;
  let done = false;
  const missed = new Set();
  const seq = () => base.map((m) => m + off);
  const result = () => scoreOf(base.length - missed.size, base.length);

  return {
    get sequence() { return seq(); },
    get index() { return i; },
    get total() { return base.length; },
    get done() { return done; },
    get mistakes() { return mistakes; },
    expected() { return done ? null : base[i] + off; },
    result,
    noteOn(midi) {
      if (done || !Number.isInteger(midi)) return { type: 'ignored' };
      let target = base[i] + off;
      if (free && i === 0) {
        // La fundamental en cualquier octava fija el desplazamiento.
        if (((midi - base[0]) % 12 + 12) % 12 === 0) { off = midi - base[0]; target = midi; }
      }
      if (midi === target) {
        const at = i;
        i++;
        if (i >= base.length) { done = true; return { type: 'done', index: at, midi, result: result() }; }
        return { type: 'ok', index: at, midi, next: base[i] + off };
      }
      mistakes++;
      missed.add(i);
      const prev = i > 0 ? base[i - 1] + off : null;
      return { type: 'wrong', index: i, played: midi, expected: target, prev, delta: prev === null ? null : target - prev };
    },
  };
}

/**
 * Consigna "Tocá el grado": acepta las notas de a una o juntas, en cualquier octava o inversión.
 * Una nota ajena a la tríada es error (no se acumula); la tarea se completa al reunir las tres clases de altura.
 * @param {{pcs:number[]}} triad forma de theory.diatonicTriads()
 * @returns {{noteOn(midi:number):object, readonly accepted:number[], readonly wrongs:number[], readonly done:boolean,
 *   readonly clean:boolean, missingPcs():number[]}}
 *   noteOn → {type:'partial', accepted, missingPcs} | {type:'ok', accepted, clean} | {type:'wrong', midi, wrongCount} | {type:'ignored'}
 */
export function createTriadTask(triad) {
  const accepted = [];
  const wrongs = [];
  let done = false;
  return {
    get accepted() { return accepted.slice(); },
    get wrongs() { return wrongs.slice(); },
    get done() { return done; },
    get clean() { return wrongs.length === 0; },
    missingPcs() { return checkTriad(accepted, triad).missingPcs; },
    noteOn(midi) {
      if (done || !Number.isInteger(midi) || accepted.includes(midi)) return { type: 'ignored' };
      const r = checkTriad([...accepted, midi], triad);
      if (r.wrongMidis.includes(midi)) { wrongs.push(midi); return { type: 'wrong', midi, wrongCount: wrongs.length }; }
      accepted.push(midi);
      if (r.ok) { done = true; return { type: 'ok', accepted: accepted.slice(), clean: wrongs.length === 0 }; }
      return { type: 'partial', accepted: accepted.slice(), missingPcs: r.missingPcs };
    },
  };
}
