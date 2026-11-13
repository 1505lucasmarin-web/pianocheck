// Sección "Teoría": dos lecciones de clase (escala mayor y grados/acordes) con ejercicios que usan la misma entrada que Práctica.
// La lógica de los ejercicios vive en lessons.js y theory.js (puros); acá sólo hay estado de pantalla y HTML.
import { KEYS, MAJOR_PATTERN, majorScale, scaleMidi, diatonicTriads, makeDegreeTasks, makeQualityQuiz, noteNameInKey, keyboardLabel } from './theory.js';
import { createScaleRun, createTriadTask, scoreOf } from './lessons.js';
import { semitonesText } from './keyboard.js';
import { theorySummary, THEORY_PASS } from './store.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const N_TASKS = 5;
const keyObj = (id) => KEYS.find((k) => k.id === id) || KEYS[0];
const keyShort = (k) => k.name.replace(' mayor', '');
const pcName = (m, key) => noteNameInKey(m, key).replace(/-?\d+$/, '');
const armadura = (n) => (n === 0 ? 'Sin alteraciones' : n > 0 ? `${n} ${n === 1 ? 'sostenido' : 'sostenidos'}` : `${-n} ${n === -1 ? 'bemol' : 'bemoles'}`);

export const LESSONS = [
  { id: 'escala', n: 1, title: 'La escala mayor', tab: '1 · La escala mayor' },
  { id: 'grados', n: 2, title: 'Los grados y sus acordes', tab: '2 · Grados y acordes' },
];
const MODES = {
  escala: [['ver', 'Mirar'], ['tocala', 'Tocala'], ['armala', 'Armala vos']],
  grados: [['ver', 'Mirar'], ['grado', 'Tocá el grado'], ['quiz', 'Mayor/menor']],
};
const EXERCISE_OF = { tocala: 'tocala', armala: 'armala', grado: 'grado', quiz: 'quiz' };

/** Texto "Movete … → Fa♯4" con la ortografía de la tonalidad (misma redacción que el piano guía de Práctica). */
export function moveText(played, target, keyId) {
  const diff = target - played;
  if (!diff) return '';
  return `Movete ${semitonesText(Math.abs(diff))} a la ${diff > 0 ? 'derecha' : 'izquierda'} → ${noteNameInKey(target, keyId)}`;
}

/**
 * @param {object} env
 *   $(id), kb (createKeyboard de #th-piano), player (createPlayer), toast(msg), settings() → ajustes actuales,
 *   inputReady() → hay MIDI / micrófono / teclado de pantalla, enableOnscreen(), saveResult(lesson, ex, key, correct, total) → Promise<progreso>,
 *   loadProgress() → Promise<progreso>, onProgress(progreso)
 */
export function createTheory(env) {
  const { $, kb } = env;
  const S = {
    lesson: 'escala', key: 'C', mode: 'ver', updown: false,
    run: null, finished: null, miss: null,
    deg: 0, tasks: [], ti: 0, task: null, taskClean: 0, taskDone: false, fb: null,
    quiz: null, listening: false, progress: { lessons: {} },
  };
  let timer = 0;
  let active = false;
  let lastReady = null;

  /* ---------- progreso ---------- */
  const summary = () => theorySummary(S.progress, S.lesson);
  function pushProgress(p) { S.progress = p; env.onProgress && env.onProgress(p); }

  /* ---------- piano ---------- */
  function setRange() {
    if (S.lesson === 'escala') { const t = scaleMidi(S.key)[0]; kb.setRange(t - 3, t + 15); } else kb.setRange(57, 81);
  }
  function clearPiano() { kb.setHint(null); kb.setSteps([]); kb.setTargets([]); }
  function scaleTargets(full) {
    const seq = scaleMidi(S.key);
    return seq.map((m) => ({ midi: m, label: keyboardLabel(m, S.key), done: !!full }));
  }
  function triadTargets(t, done) { return t.midi.map((m) => ({ midi: m, label: keyboardLabel(m, S.key), done: !!done })); }
  function syncPiano(focus = true) {
    const M = S.mode;
    let list = [], steps = [], focusList = [];
    if (S.lesson === 'escala') {
      if (M === 'ver') {
        list = scaleTargets(false);
        const seq = scaleMidi(S.key);
        steps = MAJOR_PATTERN.map((tx, i) => ({ fromMidi: seq[i], toMidi: seq[i + 1], text: tx }));
      } else if (S.run) {
        const r = S.run, seq = r.sequence, labelOf = (m) => keyboardLabel(m, S.key);
        const map = new Map();
        for (let i = 0; i < r.index; i++) map.set(seq[i], { midi: seq[i], label: labelOf(seq[i]), done: true });
        if (S.finished) {
          // todo hecho
        } else if (M === 'tocala' || r.index === 0) {
          const nx = seq[r.index];
          map.set(nx, { midi: nx, label: labelOf(nx), done: false });
        }
        list = [...map.values()];
        focusList = list.filter((x) => !x.done).map((x) => x.midi);
      }
    } else if (M === 'ver') {
      list = triadTargets(diatonicTriads(S.key)[S.deg], false);
    } else if (M === 'grado' && S.task) {
      list = S.task.accepted.map((m) => ({ midi: m, label: keyboardLabel(m, S.key), done: true }));
    } else if (M === 'quiz' && S.quiz && S.quiz.answered) {
      list = triadTargets(diatonicTriads(S.key)[ROMAN.indexOf(S.quiz.items[S.quiz.i].degree)], false);
    }
    kb.setSteps(steps);
    kb.setTargets(list);
    if (focus) kb.focus(focusList.length ? focusList : list.map((x) => x.midi));
  }

  /* ---------- reproducción ---------- */
  function stopListening(silent) {
    if (!S.listening) return;
    S.listening = false;
    env.player.stop();
    if (!silent) { syncPiano(false); syncStatus(); }
  }
  function listen(events, onStepNote) {
    if (S.listening) { stopListening(); return; }
    try {
      S.listening = true;
      env.player.play(events, {
        onStep: (e) => { kb.flash(e.midi, 'ok'); onStepNote && onStepNote(e); },
        onEnd: () => { if (S.listening) stopListening(); },
      });
    } catch (err) { S.listening = false; env.toast(err.message || 'No se pudo reproducir el audio.'); }
    syncStatus();
  }
  function listenScale() {
    const seq = scaleMidi(S.key);
    const events = seq.map((m, i) => ({ step: i, beat: i, at: i * 0.5, dur: 0.55, midi: m, hand: 'rh' }));
    listen(events);
  }
  function listenChord(t) {
    const events = t.midi.map((m) => ({ step: 0, beat: 0, at: 0, dur: 1.7, midi: m, hand: 'rh' }));
    listen(events);
  }

  /* ---------- modos / estado de los ejercicios ---------- */
  function clearTimers() { clearTimeout(timer); timer = 0; }
  function startMode() {
    clearTimers(); stopListening(true);
    S.run = null; S.finished = null; S.miss = null; S.fb = null; S.task = null; S.quiz = null; S.taskDone = false;
    kb.setHint(null);
    setRange();
    if (S.lesson === 'escala') {
      if (S.mode === 'tocala') S.run = createScaleRun(S.key, { direction: S.updown ? 'updown' : 'up' });
      else if (S.mode === 'armala') S.run = createScaleRun(S.key, { free: true });
    } else if (S.mode === 'grado') {
      S.tasks = makeDegreeTasks(S.key, N_TASKS); S.ti = 0; S.taskClean = 0; S.task = createTriadTask(S.tasks[0].triad);
    } else if (S.mode === 'quiz') {
      S.quiz = { items: makeQualityQuiz(S.key, N_TASKS), i: 0, answered: null, correct: 0 };
    }
    render(); syncPiano(true); syncStatus();
  }
  function finish(exercise, correct, total) {
    S.finished = { exercise, ...scoreOf(correct, total) };
    S.miss = null; kb.setHint(null);
    env.saveResult(S.lesson, exercise, S.key, correct, total).then(pushProgress).catch(() => env.toast('No se pudo guardar el progreso.', 3000)).finally(() => { if (active) { render(); syncStatus(); } });
    render(); syncPiano(false); syncStatus();
  }

  /* ---------- entrada de notas ---------- */
  function noteOn(m) {
    if (!active || S.listening) return;
    if (S.mode === 'tocala' || S.mode === 'armala') scaleNote(m);
    else if (S.mode === 'grado') triadNote(m);
  }
  function scaleNote(m) {
    const r = S.run;
    if (!r || r.done || S.finished) return;
    const guided = S.mode === 'tocala';
    const ev = r.noteOn(m);
    if (ev.type === 'ignored') return;
    if (ev.type === 'wrong') {
      kb.flash(m, 'bad');
      if (guided) {
        kb.setHint({ fromMidi: m, toMidi: ev.expected });
        S.miss = { played: noteNameInKey(m, S.key), next: noteNameInKey(ev.expected, S.key), sub: moveText(m, ev.expected, S.key) };
      } else {
        S.miss = { played: noteNameInKey(m, S.key), over: m > ev.expected, prev: ev.prev, delta: ev.delta };
      }
      syncPiano(false); syncStatus(); updateLive();
      return;
    }
    kb.setHint(null); kb.flash(m, 'ok'); S.miss = null;
    if (ev.type === 'done') { finish(guided ? 'tocala' : 'armala', ev.result.correct, ev.result.total); return; }
    syncPiano(true); syncStatus(); updateLive();
  }
  function triadHint(t, wrongCount, played) {
    return wrongCount <= 1
      ? `${played} no es del acorde. Sobre ${t.notes[0]}, apilá dos terceras usando sólo notas de la escala.`
      : `${played} tampoco. Las notas de ${t.name} son ${t.notes.join(' – ')}.`;
  }
  function triadNote(m) {
    if (!S.task || S.taskDone || S.finished) return;
    const t = S.tasks[S.ti].triad;
    const ev = S.task.noteOn(m);
    if (ev.type === 'ignored') return;
    if (ev.type === 'wrong') {
      kb.flash(m, 'bad');
      S.fb = { kind: 'bad', text: triadHint(t, ev.wrongCount, pcName(m, S.key)), short: 'Nota ajena al acorde' };
    } else {
      kb.setHint(null); kb.flash(m, 'ok');
      if (ev.type === 'partial') {
        const n = ev.missingPcs.length;
        S.fb = { kind: 'ok', text: `Va bien: ${n === 1 ? 'falta 1 nota' : `faltan ${n} notas`}.`, short: n === 1 ? 'Falta 1 nota' : `Faltan ${n} notas` };
      } else {
        S.taskDone = true;
        if (ev.clean) S.taskClean++;
        S.fb = { kind: 'good', text: `¡Bien! ${t.degree} de ${keyObj(S.key).name}: ${t.name} (${t.notes.join(' – ')})${ev.clean ? '' : '. Con errores no suma al puntaje'}.`, short: ev.clean ? '¡Bien!' : 'Resuelto con errores' };
        timer = setTimeout(nextTask, 1700);
      }
    }
    syncPiano(false); syncStatus(); updateLive();
  }
  function nextTask() {
    clearTimers();
    if (!S.task) return;
    if (S.ti + 1 >= S.tasks.length) { finish('grado', S.taskClean, S.tasks.length); return; }
    S.ti++; S.task = createTriadTask(S.tasks[S.ti].triad); S.taskDone = false; S.fb = null;
    kb.setHint(null); render(); syncPiano(false); syncStatus();
  }
  function answerQuiz(opt) {
    const q = S.quiz; if (!q || q.answered) return;
    q.answered = opt;
    if (opt === q.items[q.i].answer) q.correct++;
    render(); syncPiano(true); syncStatus();
    const nb = $('th-live') && $('th-live').querySelector('[data-act="qnext"]');
    if (nb && nb.scrollIntoView) nb.scrollIntoView({ block: 'nearest' });
  }
  function nextQuiz() {
    const q = S.quiz; if (!q || !q.answered) return;
    stopListening(true);
    if (q.i + 1 >= q.items.length) { finish('quiz', q.correct, q.items.length); return; }
    q.i++; q.answered = null; render(); syncPiano(false); syncStatus();
  }

  /* ---------- HTML ---------- */
  function formulaChips() {
    return `<div class="formula" aria-label="Fórmula: fundamental, tono, tono, semitono, tono, tono, tono, semitono"><span class="fchip root">Fund.</span>${MAJOR_PATTERN.map((x) => `<span class="fchip ${x === 'S' ? 's' : 't'}">${x}</span>`).join('')}</div>`;
  }
  function introHtml() {
    if (S.lesson === 'escala') {
      return `<section class="th-card">
        <p>Desde la fundamental, subís con esta fórmula:</p>${formulaChips()}
        <p class="th-small"><b>T</b> = tono (2 semitonos) · <b>S</b> = semitono (la tecla de al lado)</p></section>`;
    }
    return `<section class="th-card"><p>Sobre cada nota de la escala se arma una tríada (nota, tercera y quinta). Cada grado queda <b>Mayor</b>, <b>menor</b> o <b>disminuido</b>.</p></section>`;
  }
  function lessonTabs() {
    return `<div class="seg wide th-lessons" role="group" aria-label="Lección">${LESSONS.map((l) => `<button data-act="lesson" data-v="${l.id}" class="${l.id === S.lesson ? 'on' : ''}" aria-pressed="${l.id === S.lesson}">${esc(l.tab)}</button>`).join('')}</div>`;
  }
  function progressLine() {
    const s = summary();
    const best = s.best == null ? 'Sin ejercicios todavía' : `Mejor puntaje ${s.best}%`;
    return `<p class="th-prog" aria-label="Tu progreso en esta lección"><span>${best}</span><span aria-hidden="true"> · </span><span>Tonalidades <b>${s.keys.length}</b> de 12</span></p>`;
  }
  function modeTabs() {
    return `<div class="seg wide th-modes" role="group" aria-label="Modo">${MODES[S.lesson].map(([id, t]) => `<button data-act="mode" data-v="${id}" class="${id === S.mode ? 'on' : ''}" aria-pressed="${id === S.mode}">${esc(t)}</button>`).join('')}</div>`;
  }
  function keySel() {
    const done = new Set(summary().keys);
    return `<div class="th-keys" id="th-keys" role="group" aria-label="Tonalidad">${KEYS.map((k) => `<button class="kbtn${k.id === S.key ? ' on' : ''}" data-act="key" data-v="${k.id}" aria-pressed="${k.id === S.key}" aria-label="${esc(k.name)}${done.has(k.id) ? ', completada' : ''}">${esc(keyShort(k))}${done.has(k.id) ? '<i class="kdone" aria-hidden="true">✓</i>' : ''}</button>`).join('')}</div>`;
  }
  /** Fila de notas con las pastillas T / S entre vecinas. */
  function rowHtml() {
    const sc = majorScale(S.key);
    const names = [...sc.map((n) => n.name), sc[0].name];
    const r = S.run;
    let cur = -1, doneFn = () => false, revealed = () => true;
    if (S.mode !== 'ver' && r) {
      const idx = S.finished ? r.total : r.index;
      const deg = idx <= 7 ? idx : 14 - idx;
      if (S.finished) { cur = -1; doneFn = () => true; }
      else if (idx <= 7) { cur = deg; doneFn = (d) => d < deg; }
      else { cur = deg; doneFn = (d) => d !== deg; }
      if (S.mode === 'armala') revealed = (d) => d === 0 || d < idx || !!S.finished;
    }
    const cells = names.map((n, d) => {
      const show = revealed(d);
      const cls = ['sn', doneFn(d) ? 'done' : '', d === cur ? 'cur' : '', show ? '' : 'unk'].filter(Boolean).join(' ');
      return `<span class="${cls}">${show ? esc(n) : '?'}</span>`;
    }).join('');
    const pills = MAJOR_PATTERN.map((x, i) => `<span class="ss ${x === 'S' ? 's' : 't'}" style="left:${((i + 1) * 12.5).toFixed(2)}%">${x}</span>`).join('');
    const label = S.mode === 'armala' ? 'Notas de la escala (las que ya encontraste)' : `Escala de ${keyObj(S.key).name}: ${names.join(', ')}`;
    return `<div class="srow" role="img" aria-label="${esc(label)}"><div class="srow-n">${cells}</div><div class="srow-s">${pills}</div></div>`;
  }
  function degTable() {
    const tri = diatonicTriads(S.key);
    const t = tri[S.deg];
    const rows = tri.map((x, i) => `<button class="deg-row${i === S.deg ? ' sel' : ''}" data-act="row" data-v="${i}" aria-pressed="${i === S.deg}" aria-label="${x.degree}: ${x.name}, ${x.quality}, ${x.notes.join(', ')}. Tocá para escucharlo">
      <b class="dg">${x.degree}</b><span class="dq q-${x.quality === 'Mayor' ? 'M' : x.quality === 'menor' ? 'm' : 'd'}">${x.quality}</span><span class="dn">${esc(x.name)}</span><span class="dt">${x.notes.map(esc).join(' – ')}</span></button>`).join('');
    const [a, b, c] = t.midi;
    const third = (n) => (n === 4 ? 'tercera mayor' : 'tercera menor');
    const rule = (q, txt) => `<li class="${t.quality === q ? 'on' : ''}"><b>${q === 'Mayor' ? 'Mayor' : q}</b> = ${txt}</li>`;
    return `<div class="deg-table" role="group" aria-label="Grados de ${esc(keyObj(S.key).name)}"><div class="deg-head" aria-hidden="true"><span>Grado</span><span>Calidad</span><span>Acorde</span><span>Notas</span></div>${rows}</div>
      <section class="why" aria-live="polite"><p><b>${t.degree} (${esc(t.name)})</b>: ${esc(t.notes[0])} → ${esc(t.notes[1])} es una ${third(b - a)} (${b - a} semitonos) y ${esc(t.notes[1])} → ${esc(t.notes[2])} una ${third(c - b)} (${c - b}). Resultado: acorde ${t.quality}.</p>
      <ul class="why-rules">${rule('Mayor', 'tercera mayor + menor')}${rule('menor', 'tercera menor + mayor')}${rule('disminuido', 'tercera menor + menor')}</ul></section>`;
  }
  function inputBanner() {
    if (env.inputReady()) return '';
    return `<div class="th-banner" role="note"><svg class="ic sm" aria-hidden="true"><use href="#i-plug"/></svg><span>Para tocar, conectá tu piano o usá el teclado de pantalla.</span><button class="btn sm" data-act="kbd">Teclado de pantalla</button></div>`;
  }
  function resultHtml() {
    const f = S.finished; if (!f) return '';
    const ok = f.pct >= THEORY_PASS;
    const head = f.pct === 100 ? '¡Perfecto!' : ok ? '¡Muy bien!' : 'Terminaste';
    const what = { tocala: 'notas a la primera', armala: 'notas a la primera', grado: 'acordes a la primera', quiz: 'respuestas correctas' }[f.exercise];
    const tag = ok ? `<span class="th-pass">${esc(keyObj(S.key).name)}: completada</span>` : `<span class="th-pass no">Con ${THEORY_PASS}% o más se completa la tonalidad</span>`;
    return `<section class="th-result" role="status"><b class="trh">${head}</b><p><span class="trs">${f.correct} de ${f.total}</span> ${what} · ${f.pct}%</p>${tag}
      <div class="row wrap"><button class="btn" data-act="again">Repetir</button><button class="btn primary" data-act="nextkey">Siguiente tonalidad</button></div></section>`;
  }
  function liveHtml() {
    const M = S.mode;
    if (S.lesson === 'escala') {
      if (M === 'ver') {
        const odd = S.key === 'F#' ? `<p class="th-note"><svg class="ic sm" aria-hidden="true"><use href="#i-info"/></svg><span>Ojo: en Fa♯ mayor la séptima nota es <b>Mi♯</b>. Suena igual que Fa, pero cada letra se usa una sola vez.</span></p>` : '';
        return rowHtml() + odd;
      }
      if (S.finished) return rowHtml() + resultHtml();
      if (M === 'tocala') {
        return inputBanner() + `<div class="th-opt"><button class="chip" data-act="updown" aria-pressed="${S.updown}">Ida y vuelta</button><span class="th-small">${S.updown ? 'Subís y volvés a bajar.' : 'Sólo subís hasta la octava.'}</span></div>` + rowHtml()
          + `<p class="th-small th-steps">Seguí las teclas que se iluminan. Si te equivocás, la flecha te muestra hacia dónde moverte.</p>`;
      }
      return inputBanner() + `<p class="th-lead">Tocá la fundamental y buscá cada nota siguiendo la fórmula. Las teclas no se anticipan.</p>` + rowHtml();
    }
    if (M === 'ver') return degTable();
    if (S.finished) return resultHtml();
    if (M === 'grado') {
      const t = S.tasks[S.ti]; if (!t) return '';
      const fb = S.fb ? `<p class="th-fb ${S.fb.kind}" id="th-fb" role="status">${esc(S.fb.text)}</p>` : `<p class="th-fb" id="th-fb" role="status">Tocá las tres notas, juntas o de a una, en la octava que quieras.</p>`;
      const dots = `<div class="th-dots" aria-label="Acorde ${S.ti + 1} de ${S.tasks.length}">${S.tasks.map((_, i) => `<i class="${i < S.ti ? 'd' : i === S.ti ? 'c' : ''}"></i>`).join('')}</div>`;
      return inputBanner() + `<section class="th-prompt"><span class="th-q">Acorde ${S.ti + 1} de ${S.tasks.length}</span><b class="th-ask">${esc(t.prompt)}</b>${fb}${dots}</section>`;
    }
    const q = S.quiz.items[S.quiz.i];
    const a = S.quiz.answered;
    const opts = q.options.map((o) => {
      const cls = a ? (o === q.answer ? ' right' : o === a ? ' wrong' : ' dim') : '';
      const mark = a ? (o === q.answer ? '<i aria-hidden="true">✓</i>' : o === a ? '<i aria-hidden="true">✕</i>' : '') : '';
      return `<button class="qopt${cls}" data-act="opt" data-v="${o}" ${a ? 'disabled' : ''}>${mark}${o}</button>`;
    }).join('');
    const last = S.quiz.i + 1 >= S.quiz.items.length;
    const exp = a ? `<div class="q-exp ${a === q.answer ? 'good' : 'bad'}" role="status"><b>${a === q.answer ? '¡Correcto!' : 'No es esa.'}</b> ${esc(q.explain)}</div><button class="btn primary big" data-act="qnext">${last ? 'Ver puntaje' : 'Siguiente'}</button>` : '';
    return `<section class="th-prompt"><span class="th-q">Pregunta ${S.quiz.i + 1} de ${S.quiz.items.length}</span><b class="th-ask">¿Mayor, menor o disminuido?</b><p class="th-sub">${esc(q.prompt)}</p><div class="qopts" role="group" aria-label="Respuesta">${opts}</div>${exp}</section>`;
  }

  /* ---------- render ---------- */
  function keepUi(fn) {
    const body = $('th-body');
    const top = body.scrollTop;
    const ae = document.activeElement;
    const sel = ae && body.contains(ae) && ae.dataset && ae.dataset.act ? `[data-act="${ae.dataset.act}"]${ae.dataset.v != null ? `[data-v="${ae.dataset.v}"]` : ''}` : null;
    fn(body);
    body.scrollTop = top;
    if (sel) { const n = body.querySelector(sel); if (n && !n.disabled) n.focus({ preventScroll: true }); }
  }
  function centerKey() {
    const c = $('th-keys'); if (!c) return;
    const b = c.querySelector('.kbtn.on'); if (!b) return;
    c.scrollLeft = Math.max(0, b.offsetLeft - (c.clientWidth - b.offsetWidth) / 2);
  }
  function render() {
    if (!active) return;
    keepUi((body) => {
      body.innerHTML = lessonTabs() + (S.mode === 'ver' ? progressLine() : '') + modeTabs() + (S.mode === 'ver' ? introHtml() : '') + keySel() + `<div id="th-live" class="th-live">${liveHtml()}</div>`;
      centerKey();
    });
  }
  function updateLive() {
    if (!active) return;
    const live = $('th-live'); if (!live) { render(); return; }
    keepUi(() => { live.innerHTML = liveHtml(); });
  }

  /* ---------- panel de estado (junto al piano) ---------- */
  function statusInfo() {
    const key = keyObj(S.key), M = S.mode;
    if (S.listening) return { label: 'Escuchando', name: S.lesson === 'escala' ? key.name : diatonicTriads(S.key)[S.deg].name, sub: 'Tocá Detener para volver', cls: 'listen' };
    if (S.finished) return { label: 'Terminaste', name: `${S.finished.correct} de ${S.finished.total}`, sub: `${S.finished.pct}%`, cls: '' };
    if (S.lesson === 'escala') {
      if (M === 'ver') return { label: 'Tonalidad', name: key.name, sub: armadura(key.accidentals) };
      const r = S.run; if (!r) return { label: '', name: '', sub: '' };
      const i = r.index;
      if (M === 'tocala') {
        const step = i === 0 ? 'Empezá en la fundamental' : `Desde ${noteNameInKey(r.sequence[i - 1], S.key)}: ${semitonesText(r.sequence[i] - r.sequence[i - 1])} ${r.sequence[i] > r.sequence[i - 1] ? 'arriba' : 'abajo'}`;
        if (S.miss) return { label: `<span class="n-bad">Tocaste ${esc(S.miss.played)}</span> · Próxima: `, name: S.miss.next, sub: S.miss.sub, cls: 'bad' };
        return { label: i === 0 ? 'Fundamental' : 'Próxima nota', name: noteNameInKey(r.sequence[i], S.key), sub: step };
      }
      if (S.miss) {
        const d = S.miss.delta;
        const sub = d == null ? 'Empezá en la fundamental' : `Desde ${noteNameInKey(S.miss.prev, S.key)} hay que ${d > 0 ? 'subir' : 'bajar'} ${semitonesText(d)}`;
        return { label: `<span class="n-bad">Tocaste ${esc(S.miss.played)}</span> · `, name: d == null ? 'Es la fundamental' : S.miss.over ? 'Te pasaste' : 'Te quedaste corto', sub, cls: 'bad' };
      }
      if (i === 0) return { label: 'Armá la escala', name: `Empezá en ${pcName(r.sequence[0], S.key)}`, sub: 'Es la tecla iluminada' };
      const st = MAJOR_PATTERN[i - 1];
      return { label: `Nota ${i + 1} de ${r.total}`, name: '¿Cuál sigue?', sub: `Desde ${noteNameInKey(r.sequence[i - 1], S.key)}: ${st === 'T' ? 'un tono (T)' : 'un semitono (S)'}` };
    }
    const t = diatonicTriads(S.key)[S.deg];
    if (M === 'ver') return { label: `Grado ${t.degree}`, name: t.name, sub: `${t.quality} · ${t.notes.join('–')}` };
    if (M === 'grado') {
      const k = S.tasks[S.ti]; if (!k) return { label: '', name: '', sub: '' };
      return { label: `Acorde ${S.ti + 1} de ${S.tasks.length}`, name: `${k.triad.degree} de ${keyShort(key)}`, sub: S.fb ? S.fb.short : 'Juntas o de a una', cls: S.fb && S.fb.kind === 'bad' ? 'bad' : '' };
    }
    const q = S.quiz && S.quiz.items[S.quiz.i];
    if (!q) return { label: '', name: '', sub: '' };
    return { label: `Pregunta ${S.quiz.i + 1} de ${S.quiz.items.length}`, name: `${q.degree} de ${keyShort(keyObj(q.key))}`, sub: S.quiz.answered ? (S.quiz.answered === q.answer ? 'Correcto' : 'Incorrecto') : 'Elegí una opción', cls: S.quiz.answered && S.quiz.answered !== q.answer ? 'bad' : '' };
  }
  function progressFrac() {
    if (S.finished) return 1;
    const M = S.mode;
    if (M === 'tocala' || M === 'armala') return S.run ? S.run.index / S.run.total : 0;
    if (M === 'grado') return S.tasks.length ? (S.ti + (S.taskDone ? 1 : 0)) / S.tasks.length : 0;
    if (M === 'quiz') return S.quiz ? (S.quiz.i + (S.quiz.answered ? 1 : 0)) / S.quiz.items.length : 0;
    return 0;
  }
  function auxInfo() {
    const M = S.mode;
    if (S.listening) return { t: 'Detener', icon: 'stop' };
    if (S.finished) return null;
    if (M === 'ver') return { t: 'Escuchar', icon: 'ear' };
    if (M === 'tocala' || M === 'armala') return { t: 'Reiniciar', icon: 'restart' };
    if (M === 'grado') return S.taskDone ? null : { t: 'Saltar', icon: 'skip' };
    if (M === 'quiz') return S.quiz && S.quiz.answered ? { t: 'Escuchar', icon: 'ear' } : null;
    return null;
  }
  function syncStatus() {
    if (!active) return;
    const s = statusInfo();
    $('th-next').className = 'next-info' + (s.cls ? ' ' + s.cls : '');
    $('th-next-label').innerHTML = s.label || '';
    $('th-next-name').textContent = s.name || '';
    $('th-next-sub').textContent = s.sub || '';
    $('th-progress').style.width = Math.round(progressFrac() * 100) + '%';
    const a = auxInfo(), btn = $('th-aux');
    btn.hidden = !a;
    if (a) { $('th-aux-t').textContent = a.t; btn.querySelector('use').setAttribute('href', '#i-' + a.icon); }
  }
  function onAux() {
    if (S.listening) { stopListening(); return; }
    const M = S.mode;
    if (M === 'ver') { S.lesson === 'escala' ? listenScale() : listenChord(diatonicTriads(S.key)[S.deg]); }
    else if (M === 'tocala' || M === 'armala') startMode();
    else if (M === 'grado') {
      if (S.taskDone || !S.task) return;
      kb.setHint(null); S.fb = null;
      nextTaskSkipped();
    } else if (M === 'quiz' && S.quiz && S.quiz.answered) listenChord(diatonicTriads(S.key)[ROMAN.indexOf(S.quiz.items[S.quiz.i].degree)]);
  }
  function nextTaskSkipped() { nextTask(); }

  /* ---------- clics ---------- */
  function onBodyClick(e) {
    const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
    const act = b.dataset.act, v = b.dataset.v;
    if (act === 'lesson') { if (v !== S.lesson) { S.lesson = v; S.mode = 'ver'; S.deg = 0; startMode(); } }
    else if (act === 'mode') { if (v !== S.mode) { S.mode = v; startMode(); } }
    else if (act === 'key') { if (v !== S.key) { S.key = v; startMode(); } }
    else if (act === 'updown') { S.updown = !S.updown; startMode(); }
    else if (act === 'row') {
      S.deg = +v; stopListening(true); render(); syncPiano(true); syncStatus();
      listenChord(diatonicTriads(S.key)[S.deg]);
    } else if (act === 'again') startMode();
    else if (act === 'nextkey') { const i = KEYS.findIndex((k) => k.id === S.key); S.key = KEYS[(i + 1) % KEYS.length].id; startMode(); }
    else if (act === 'opt') answerQuiz(v);
    else if (act === 'qnext') nextQuiz();
    else if (act === 'kbd') env.enableOnscreen();
  }

  return {
    LESSONS,
    /** Abre la sección (lección opcional). Devuelve una promesa que se resuelve al cargar el progreso. */
    async open(lesson) {
      active = true; lastReady = !!env.inputReady();
      if (lesson && LESSONS.some((l) => l.id === lesson)) { S.lesson = lesson; }
      S.mode = 'ver'; S.deg = 0;
      startMode();
      try { pushProgress(await env.loadProgress()); } catch (e) { /* sin historial */ }
      if (active) { render(); syncStatus(); }
    },
    leave() { active = false; clearTimers(); stopListening(true); clearPiano(); },
    noteOn,
    /** Notas esperadas para el micrófono (sin anticipar nada en pantalla). */
    expected() {
      if (!active || S.finished) return [];
      if (S.mode === 'tocala' || S.mode === 'armala') { const e = S.run && S.run.expected(); return e == null ? [] : [e]; }
      if (S.mode === 'grado' && S.task && !S.taskDone) return S.task.missingPcs().map((pc) => 60 + pc);
      return [];
    },
    /** Cambió la conexión (MIDI / micrófono / teclado de pantalla). */
    refreshInput() { const r = !!env.inputReady(); if (active && r !== lastReady) { lastReady = r; updateLive(); } else lastReady = r; },
    onAux,
    onBodyClick,
    get state() { return S; },
    summary: (lessonId, progress) => theorySummary(progress || S.progress, lessonId),
  };
}
