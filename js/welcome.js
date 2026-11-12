import { demoScore } from "./demo.js";
import { createSession } from "./engine.js";
import { buildSteps, midiName } from "./model.js";
import { createPlayer } from "./playback.js";

const firstMeasure = buildSteps(demoScore, "rh").filter((step) => step.measure === 0);
const noteName = (midi) => midiName(midi).replace(/\d+$/, "").replace("#", "♯");
const freshSession = () => createSession(firstMeasure, { maxStreak: Number.MAX_SAFE_INTEGER });

/** Demo breve de la portada: no modifica la biblioteca, los ajustes ni el historial. */
export function mountWelcome(root) {
  const keys = [...root.querySelectorAll("#welcome-keys button[data-midi]")];
  const notes = [...root.querySelectorAll("[data-welcome-note]")];
  const count = root.querySelector("#welcome-count");
  const feedback = root.querySelector("#welcome-feedback");
  const repeat = root.querySelector("#welcome-repeat");
  const player = createPlayer();
  let session = freshSession();

  function draw(event) {
    const { index, total, status } = session.state;
    const results = session.stepResults;
    const next = firstMeasure[index]?.midi[0];
    const complete = status === "finished";
    const missed = event?.type === "miss";

    for (const [i, note] of notes.entries()) {
      note.classList.toggle("is-next", i === index);
      note.classList.toggle("is-hit", results[i] === "clean");
      note.classList.toggle("is-miss", results[i] === "dirty");
    }
    for (const key of keys) {
      const midi = Number(key.dataset.midi);
      const lastPlayed = event?.midi === midi;
      key.classList.toggle("is-next", midi === next);
      key.classList.toggle("is-hit", lastPlayed && !missed && midi !== next);
      key.classList.toggle("is-miss", lastPlayed && missed);
    }

    count.textContent = complete ? `${total} notas de ${total}` : `Nota ${index + 1} de ${total}`;
    repeat.hidden = !complete;
    feedback.classList.toggle("is-miss", missed);
    feedback.classList.toggle("is-done", complete);
    if (complete) feedback.textContent = "¡Bien! Completaste el compás.";
    else if (missed) feedback.textContent = `Tocaste ${noteName(event.midi)}. Probá con ${noteName(next)}.`;
    else if (event) feedback.textContent = `¡Bien! Ahora tocá ${noteName(next)}.`;
    else feedback.textContent = `Tocá ${noteName(next)} para empezar.`;
  }

  function start() {
    if (session.state.status === "finished") {
      session = freshSession();
      draw();
    }
    const next = firstMeasure[session.state.index].midi[0];
    keys.find((key) => Number(key.dataset.midi) === next)?.focus();
  }

  for (const key of keys) {
    key.addEventListener("click", () => {
      const midi = Number(key.dataset.midi);
      try { player.play([{ midi, at: 0, dur: 0.24, step: 0 }]); } catch (e) { /* La demo visual funciona sin audio. */ }
      const event = session.noteOn(midi);
      if (event.type !== "ignored") draw(event);
    });
  }
  root.querySelector("#welcome-start").addEventListener("click", start);
  repeat.addEventListener("click", start);
  draw();

  return { stop: () => player.stop() };
}
