const STATES = {
  pending: ["Pendiente", "○"],
  preparing: ["Preparando", "…"],
  reading: ["Leyendo con IA", "◉"],
  saving: ["Guardando", "…"],
  saved: ["Guardado", "✓"],
  done: ["Listo", "✓"],
  failed: ["Por reintentar", "!"],
};
const isDone = (state) => state === "saved" || state === "done";
const isActive = (state) => ["preparing", "reading", "saving"].includes(state);

/** Vista del plan real de lectura: cada sistema cambia de estado de forma independiente. */
export function createPdfProgress(root) {
  const list = root.querySelector("#pdf-live-pages");
  const count = root.querySelector("#pdf-live-count");
  const active = root.querySelector("#pdf-live-active");
  const bar = root.querySelector("#pdf-live-bar");
  const pages = new Map();
  let current = null;

  function summarize() {
    let ready = 0, progress = 0, reading = 0, running = 0;
    for (const { parts } of pages.values()) {
      const entries = [...parts.values()];
      const done = entries.filter(({ state }) => isDone(state)).length;
      if (entries.length) progress += done / entries.length;
      if (entries.length && done === entries.length) ready++;
      reading += entries.filter(({ state }) => state === "reading").length;
      running += entries.filter(({ state }) => isActive(state)).length;
    }
    const text = `${ready}/${pages.size} ${pages.size === 1 ? "página lista" : "páginas listas"}`;
    if (count.textContent !== text) count.textContent = text;
    bar.value = progress;
    bar.setAttribute("aria-valuetext", text);
    const activity = reading > 1 ? `${reading} en paralelo` : reading === 1 ? "1 leyendo" : running ? "En curso" : "";
    if (active.textContent !== activity) active.textContent = activity;
    active.hidden = !running;
  }

  function updatePage(page) {
    const { details, label, parts } = pages.get(page);
    const items = [...parts.values()];
    const done = items.filter(({ state }) => isDone(state)).length;
    const running = items.filter(({ state }) => isActive(state)).length;
    details.dataset.state = items.some(({ state }) => state === "failed") ? "failed" : running ? "reading" : done && done === items.length ? "saved" : "pending";
    label.textContent = items.length ? `${done}/${items.length} ${items.length === 1 ? "parte" : "partes"}` : "Pendiente";
  }

  function start(pageNumbers, completed = {}) {
    clear();
    for (const page of pageNumbers) {
      const details = document.createElement("details");
      details.className = "pdf-page";
      details.dataset.page = page;
      details.innerHTML = '<summary><span></span><small></small></summary><ul></ul>';
      const summary = details.querySelector("summary");
      summary.firstElementChild.textContent = `Página ${page}`;
      const label = summary.lastElementChild;
      label.textContent = "Pendiente";
      const parts = new Map();
      const items = details.querySelector("ul");
      const pending = document.createElement("li");
      pending.className = "pdf-unplanned";
      pending.textContent = "Todavía no empezó la lectura.";
      items.append(pending);
      pages.set(page, { details, label, items, parts });
      list.append(details);
      // Al retomar, las páginas ya completas aparecen listas desde el primer cuadro.
      const prefix = `${page}:`;
      const keys = Object.keys(completed).filter((key) => key.startsWith(prefix));
      const total = Number(keys[0]?.split("/")[1]) || 1;
      if (keys.length === total) {
        setPlan(page, keys.sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).map((id) => ({
          id, number: total > 1 ? Number(id.slice(prefix.length).split("/")[0]) : null, state: "saved",
        })));
      }
    }
    bar.max = pageNumbers.length;
    summarize();
    root.hidden = false;
  }

  function paint(part, state) {
    const [text, icon] = STATES[state];
    part.state = state;
    part.row.dataset.state = state;
    part.row.firstElementChild.textContent = icon;
    part.row.lastElementChild.textContent = text;
  }

  function setPlan(number, items) {
    const page = pages.get(number);
    page.parts.clear();
    page.items.replaceChildren();
    for (const item of items) {
      const row = document.createElement("li");
      row.className = "pdf-part";
      row.dataset.part = item.id;
      row.innerHTML = '<span aria-hidden="true"></span><b></b><small></small>';
      row.children[1].textContent = item.number ? `Sistema ${item.number}` : "Página completa";
      const part = { row, state: item.state };
      paint(part, item.state);
      page.parts.set(item.id, part);
      page.items.append(row);
    }
    updatePage(number);
  }

  function update(event) {
    const page = pages.get(event.page);
    if (!page) return;
    if (event.type === "plan") {
      const last = pages.get(current);
      const finished = last?.parts.size && [...last.parts.values()].every(({ state }) => isDone(state));
      if (last && last !== page && finished) last.details.open = false;
      current = event.page;
      setPlan(event.page, event.parts);
      page.details.open = !event.parts.every(({ state }) => isDone(state));
    } else {
      const part = page.parts.get(event.id);
      if (!part) return;
      paint(part, event.state);
      updatePage(event.page);
    }
    summarize();
  }

  function clear() {
    pages.clear();
    current = null;
    list.replaceChildren();
    root.hidden = true;
  }

  return { start, update, clear };
}
