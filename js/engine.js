// Sesión de práctica "te espero". Sin DOM.

export function createSession(steps, opts = {}) {
  const maxStreak = Number.isFinite(opts.maxStreak) ? opts.maxStreak : 5;
  const list = Array.isArray(steps) ? steps : [];
  const total = list.length;
  const stepResults = new Array(total).fill(null);
  let index = 0;
  let pressed = [];
  let cleanSteps = 0;
  let dirtySteps = 0;
  let wrongNotes = 0;
  let streak = 0;
  let dirty = false;
  let status = total === 0 ? 'finished' : 'playing';

  function remaining() {
    const st = list[index];
    return st ? st.midi.filter((m) => !pressed.includes(m)) : [];
  }

  const session = {
    noteOn(midi) {
      if (status !== 'playing') return { type: 'ignored', step: index, midi };
      const st = list[index];
      if (st.midi.includes(midi)) {
        if (pressed.includes(midi)) return { type: 'ignored', step: index, midi };
        pressed.push(midi);
        if (pressed.length < st.midi.length) {
          return { type: 'partial', step: index, midi, expected: remaining() };
        }
        const result = dirty ? 'dirty' : 'clean';
        stepResults[index] = result;
        if (dirty) dirtySteps++; else cleanSteps++;
        streak = 0;
        const done = index;
        index++;
        pressed = [];
        dirty = false;
        if (index >= total) {
          status = 'finished';
          return { type: 'finished', step: done, midi, result };
        }
        return { type: 'step', step: done, midi, result };
      }
      // Nota equivocada
      wrongNotes++;
      streak++;
      dirty = true;
      stepResults[index] = 'dirty';
      const info = { step: index, midi, expected: remaining(), streak };
      if (streak > maxStreak) {
        status = 'stopped';
        dirtySteps++; // el paso donde se detuvo cuenta como recorrido con error
        return { type: 'stopped', ...info };
      }
      return { type: 'miss', ...info };
    },
    get state() {
      const traversed = cleanSteps + dirtySteps;
      return {
        index, total, cleanSteps, dirtySteps, wrongNotes, streak,
        accuracy: traversed > 0 ? Math.round((cleanSteps / traversed) * 100) : 0,
        status,
        pressed: pressed.slice(),
      };
    },
    get stepResults() { return stepResults.slice(); },
  };
  return session;
}
