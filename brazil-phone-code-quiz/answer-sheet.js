function createQuizAnswerSheet(button) {
  const dialog = document.createElement("dialog");
  dialog.id = "quiz-answer-sheet";
  dialog.className = "answer-sheet";
  dialog.setAttribute("aria-labelledby", "answer-sheet-title");
  dialog.innerHTML = `
    <header class="answer-sheet-header">
      <h2 id="answer-sheet-title">Answer sheet</h2>
      <form method="dialog">
        <button class="answer-sheet-close" type="submit" autofocus>Close</button>
      </form>
    </header>
    <div class="answer-sheet-layout">
      <div class="answer-sheet-lookup">
        <label for="answer-sheet-search">Search codes, areas, or example places</label>
        <input id="answer-sheet-search" type="search" autocomplete="off">
        <p class="answer-sheet-count" role="status"></p>
        <fieldset class="answer-sheet-results" aria-label="Matching codes"></fieldset>
      </div>
      <section class="answer-sheet-preview" aria-label="Selected coverage">
        <div class="answer-sheet-detail" aria-live="polite">
          <h3></h3>
          <p class="answer-sheet-examples"></p>
          <p class="answer-sheet-note"></p>
        </div>
        <svg class="answer-sheet-map" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <g class="answer-sheet-outlines"></g>
          <g class="answer-sheet-coverage"></g>
        </svg>
      </section>
    </div>
  `;
  document.body.append(dialog);

  const search = dialog.querySelector("input");
  const count = dialog.querySelector(".answer-sheet-count");
  const results = dialog.querySelector(".answer-sheet-results");
  const preview = dialog.querySelector(".answer-sheet-preview");
  const heading = preview.querySelector("h3");
  const examples = preview.querySelector(".answer-sheet-examples");
  const note = preview.querySelector(".answer-sheet-note");
  const map = preview.querySelector("svg");
  const outlines = map.querySelector(".answer-sheet-outlines");
  const coverage = map.querySelector(".answer-sheet-coverage");
  const places = new Intl.ListFormat("en", { type: "conjunction" });

  let entries = [];
  let selected;

  function normalize(text) {
    return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  }

  function path(geometry) {
    const shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
    shape.setAttribute("d", geometry);
    shape.setAttribute("fill-rule", "evenodd");
    return shape;
  }

  function showAnswer(entry) {
    selected = entry;
    preview.hidden = !entry;
    if (!entry) {
      coverage.replaceChildren();
      return;
    }
    heading.textContent = `${entry.code} · ${entry.area}`;
    examples.textContent = entry.examples ? `Includes ${entry.examples}.` : "";
    note.textContent = entry.note ?? "";
    coverage.replaceChildren(...entry.paths.map(path));
  }

  function renderResults() {
    const query = normalize(search.value.trim());
    const digits = /^[\d\s.-]+$/.test(query) ? query.replace(/\D/g, "") : "";
    const words = query.split(/\s+/);
    const matches = entries.filter((entry) => (
      digits ? entry.digits.includes(digits) : words.every((word) => entry.searchText.includes(word))
    ));
    const active = matches.includes(selected) ? selected : matches[0];

    count.textContent = matches.length
      ? `${matches.length} ${matches.length === 1 ? "code" : "codes"}`
      : "No matching codes.";
    results.replaceChildren(...matches.map((entry) => {
      const label = document.createElement("label");
      label.className = "answer-sheet-row";

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "answer-sheet-code";
      radio.checked = entry === active;
      radio.addEventListener("change", () => showAnswer(entry));

      const copy = document.createElement("span");
      copy.className = "answer-sheet-row-copy";
      const code = document.createElement("strong");
      code.textContent = entry.code;
      const area = document.createElement("span");
      area.textContent = entry.area;
      copy.append(code, area);
      label.append(radio, copy);
      return label;
    }));
    showAnswer(active);
  }

  button.disabled = true;
  button.setAttribute("aria-haspopup", "dialog");
  button.setAttribute("aria-controls", dialog.id);
  button.addEventListener("click", () => dialog.showModal());
  dialog.addEventListener("close", () => button.focus());
  search.addEventListener("input", renderResults);

  return {
    update(mapData, describe) {
      entries = mapData.codes.map((answer) => {
        const entry = describe(answer);
        const digits = entry.code.replace(/\D/g, "");
        const exampleText = Array.isArray(entry.examples)
          ? places.format(entry.examples)
          : entry.examples ?? "";
        return {
          ...entry,
          digits,
          examples: exampleText,
          searchText: normalize(`${entry.code} ${digits} ${entry.area} ${exampleText}`),
        };
      }).sort((left, right) => Number(left.digits) - Number(right.digits));

      map.setAttribute("viewBox", mapData.viewBox);
      outlines.replaceChildren(...mapData.states.map((state) => path(state.path)));
      search.value = "";
      selected = undefined;
      renderResults();
      button.disabled = entries.length === 0;
    },
  };
}
