// Detector de acordes de las dos teclas de comando (La0 = 21, Do8 = 108).
// Módulo puro: el tiempo y los temporizadores se inyectan para poder probarlo.
//
// Reglas:
//  - Una tecla de comando sola dispara su acción (onSingle) cuando vence la ventana.
//  - Si la otra tecla llega dentro de la ventana medida desde la primera pulsación, es un acorde
//    (onChord): se cancela la acción individual y no se dispara ninguna de las dos.
//  - Una tecla que sigue apretada (repetición) no vuelve a disparar nada hasta que se suelte.
//  - Si la segunda llega después de vencida la ventana, son dos acciones individuales.

export const CHORD_KEYS = [21, 108];
export const CHORD_WINDOW_MS = 400;

export function createMidiChord({
  keys = CHORD_KEYS,
  windowMs = CHORD_WINDOW_MS,
  onChord = () => {},
  onSingle = () => {},
  setTimer = (fn, ms) => setTimeout(fn, ms),
  clearTimer = (id) => clearTimeout(id),
  now = () => performance.now(),
} = {}) {
  let pending = null;            // { m, t, timer }: primera tecla esperando a ver si llega la otra
  const consumed = new Set();    // teclas tomadas por el detector hasta que se sueltan

  const fire = (p) => { clearTimer(p.timer); pending = null; onSingle(p.m); };

  return {
    /** Nota apretada. Devuelve true si la tecla es de comando (la app no debe usarla como nota). */
    down(m, t = now()) {
      if (!keys.includes(m)) return false;
      if (consumed.has(m)) return true;                    // repetición sin soltar
      if (pending && pending.m === m) return true;         // ya está esperando
      if (pending && t - pending.t < windowMs) {           // la otra llegó a tiempo: acorde
        clearTimer(pending.timer);
        pending = null;
        consumed.add(m);
        onChord();
        return true;
      }
      if (pending) fire(pending);                           // la anterior ya venció
      consumed.add(m);
      const p = { m, t, timer: null };
      p.timer = setTimer(() => { if (pending === p) fire(p); }, windowMs);
      pending = p;
      return true;
    },
    /** Nota soltada. Devuelve true si era una tecla de comando que el detector tenía tomada. */
    up(m) {
      return consumed.delete(m);
    },
    /** Descarta todo (por ejemplo, al desconectar el piano). */
    cancel() {
      if (pending) clearTimer(pending.timer);
      pending = null; consumed.clear();
    },
    get pending() { return pending ? pending.m : null; },
  };
}
