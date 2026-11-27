const svgNamespace = "http://www.w3.org/2000/svg";
const map = document.querySelector("#map");
const shapes = document.querySelector("#state-shapes");
const zones = document.querySelector("#guess-zones");
const coverage = document.querySelector("#coverage");
const labels = document.querySelector("#state-labels");
const codeText = document.querySelector("#code");
const question = document.querySelector("#question");
const progress = document.querySelector("#progress");
const progressBar = document.querySelector("#progress-bar");
const progressCount = document.querySelector("#progress-count");
const feedback = document.querySelector("#feedback");
const feedbackIcon = document.querySelector("#feedback-icon");
const feedbackTitle = document.querySelector("#feedback-title");
const feedbackDetail = document.querySelector("#feedback-detail");
const advance = document.querySelector("#advance");
const advanceLabel = document.querySelector("#advance-label");
const list = new Intl.ListFormat("en", { type: "conjunction" });
const percent = new Intl.NumberFormat("en", { style: "percent", maximumFractionDigits: 1 });
const states = new Map();
const detailedZones = new Map();
const usesDepartments = Boolean(map.dataset.detailedSource && new URLSearchParams(location.search).get("digits") === "4");
const usesZones = map.dataset.mode === "zones" && !usesDepartments;
const questionText = usesDepartments ? "Which department used this prefix?" : question.textContent;
const prefixGroup = usesDepartments ? document.querySelector("#prefix-group") : null;
const departmentGuess = usesDepartments ? document.querySelector("#department-guess") : null;
const sheetButton = document.querySelector("#open-answers");
const answerSheet = sheetButton && typeof createQuizAnswerSheet === "function" ? createQuizAnswerSheet(sheetButton) : null;

// Give small states larger tap targets linked to their locations on the map.
const calloutPositions = {
  AL: [582, 281],
  DF: [406, 330],
  ES: [518, 385],
  PB: [590, 241],
  RJ: [501, 447],
  RN: [586, 201],
  SE: [560, 318],
};

let allCodes = [];
let codes = [];
let deck = [];
let position = 0;
let firstTry = 0;
let missed = false;
let wrongTarget;
let phase = "loading";

function svg(tag, attributes = {}, content) {
  const element = document.createElementNS(svgNamespace, tag);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  if (content !== undefined) element.textContent = content;
  return element;
}

function renderMap(data) {
  map.setAttribute("viewBox", data.viewBox);
  if (usesZones) {
    renderZoneMap(data);
    return;
  }

  for (const state of data.states) {
    const shape = svg("g", {
      class: "state",
      "data-state": state.id,
    });
    if (!usesDepartments) {
      shape.setAttribute("role", "button");
      shape.setAttribute("tabindex", "0");
      shape.setAttribute("aria-label", state.name);
    }
    shape.append(
      svg("title", {}, state.name),
      svg("path", { d: state.path, "fill-rule": "evenodd" }),
    );

    const label = svg("g", { class: "state-label", "data-state": state.id });
    const callout = usesDepartments ? undefined : calloutPositions[state.id];
    const [x, y] = callout ?? [state.x, state.y];
    if (callout) {
      label.classList.add("is-callout");
      label.append(
        svg("line", { x1: state.x, y1: state.y, x2: x, y2: y }),
        svg("circle", { cx: state.x, cy: state.y, r: 2 }),
        svg("rect", { x: x - 25, y: y - 18, width: 50, height: 36 }),
        svg("rect", { class: "label-pill", x: x - 17, y: y - 10, width: 34, height: 20, rx: 5 }),
      );
    }

    label.append(
      svg("title", {}, state.name),
      svg("rect", { x: x - 14, y: y - 10, width: 28, height: 20 }),
      svg("text", { x, y, dy: ".34em", "text-anchor": "middle" }, state.id),
    );

    label.addEventListener("pointerenter", () => shape.classList.add("is-hovered"));
    label.addEventListener("pointerleave", () => shape.classList.remove("is-hovered"));
    shape.addEventListener("focus", () => label.classList.add("is-focused"));
    shape.addEventListener("blur", () => label.classList.remove("is-focused"));
    shapes.append(shape);
    labels.append(label);
    states.set(state.id, { name: state.name, shape, label });
  }
}

function setupDetailedMode() {
  document.body.classList.add("department-quiz");
  document.querySelector("#mode-first").removeAttribute("aria-current");
  document.querySelector("#mode-detailed").setAttribute("aria-current", "page");
  document.querySelector("#quiz-description").textContent = "Practice four-digit landline prefixes using recorded local allocations from before 2023.";
  document.querySelector("#group-control").hidden = false;
  document.querySelector("#department-control").hidden = false;
  document.querySelector("#state-labels").setAttribute("aria-hidden", "true");
  map.setAttribute("aria-label", "Metropolitan France with department boundaries");
  question.textContent = questionText;

  prefixGroup.addEventListener("change", startQuiz);
  departmentGuess.addEventListener("change", () => {
    const selection = states.get(departmentGuess.value);
    if (selection) guess(selection.shape, true);
  });
}

function renderZoneMap(data) {
  for (const region of data.states) {
    shapes.append(svg("path", { class: "admin-region", d: region.path, "fill-rule": "evenodd" }));
  }

  for (const zone of data.codes) {
    zones.append(svg("path", {
      class: "guess-zone",
      d: zone.path,
      "fill-rule": "evenodd",
      "data-prefix": zone.code,
    }));
  }

  for (const city of data.cities) {
    const label = svg("g", {
      class: "city",
      role: "button",
      tabindex: "0",
      "aria-label": city.name,
      "data-city": city.name,
      "data-prefix": city.code,
    });
    const width = Math.max(42, city.name.length * 8.6 + 16);
    label.append(
      svg("rect", { x: city.x - 7, y: city.y - 15, width, height: 30 }),
      svg("circle", { cx: city.x, cy: city.y, r: 3.4 }),
      svg("text", { x: city.x + 8, y: city.y, dy: ".34em" }, city.name),
    );
    labels.append(label);
  }
}

function setFeedback(tone, icon, title, detail = "") {
  feedback.dataset.tone = tone;
  feedbackIcon.textContent = icon;
  feedbackTitle.textContent = title;
  feedbackDetail.textContent = detail;
}

function setInteraction(enabled) {
  map.classList.toggle("is-answered", !enabled);
  if (departmentGuess) departmentGuess.disabled = !enabled;
  for (const shape of map.querySelectorAll('[role="button"]')) {
    shape.setAttribute("tabindex", enabled ? "0" : "-1");
    shape.setAttribute("aria-disabled", String(!enabled));
  }
}

function markWrongGuess(target, marked) {
  const state = states.get(target.dataset.state);
  if (state) {
    state.shape.classList.toggle("is-wrong", marked);
    state.label.classList.toggle("is-wrong", marked);
  } else if (target.dataset.city) {
    target.classList.toggle("is-wrong", marked);
  }
}

function clearWrongGuess() {
  if (wrongTarget) markWrongGuess(wrongTarget, false);
  wrongTarget = undefined;
}

function updateProgress(completed) {
  progressBar.max = deck.length;
  progressBar.value = completed;
  progressCount.textContent = `${completed} / ${deck.length} complete`;
}

function clearCoverage() {
  coverage.replaceChildren();
  for (const { label } of states.values()) label.classList.remove("is-correct");
}

function formatCode(code) {
  return usesDepartments ? `${code.slice(0, 2)}\u00a0${code.slice(2)}` : code;
}

function answerIds(answer) {
  return usesDepartments ? answer.departments : answer.states;
}

function describeAnswer(answer) {
  const note = usesDepartments && answer.localShare < 1
    ? `Named local areas account for ${percent.format(answer.localShare)} of the archived allocated numbers.`
    : "";
  return {
    code: formatCode(answer.code),
    area: usesZones ? answer.name : list.format(answerIds(answer).map((id) => states.get(id).name)),
    examples: answer.places,
    paths: usesDepartments ? answer.zones.map((id) => detailedZones.get(id).path) : [answer.path],
    note,
  };
}

function showQuestion() {
  phase = "asking";
  missed = false;
  clearWrongGuess();
  clearCoverage();
  setInteraction(true);

  codeText.textContent = formatCode(deck[position].code);
  if (departmentGuess) departmentGuess.value = "";
  question.textContent = questionText;
  advance.disabled = true;
  advanceLabel.textContent = "Next code";
  if (usesDepartments) {
    setFeedback("neutral", "⌖", "Choose a department", "Select any department that had local allocations for this prefix.");
  } else if (usesZones) {
    setFeedback("neutral", "⌖", "Choose a location", "Select a spot or a city on the map.");
  } else {
    setFeedback("neutral", "⌖", "Choose a state", "Select a state or its two-letter label on the map.");
  }
}

function startQuiz() {
  codes = prefixGroup?.value ? allCodes.filter((answer) => answer.code.startsWith(prefixGroup.value)) : allCodes;
  deck = [...codes];
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  position = 0;
  firstTry = 0;
  progress.hidden = false;
  updateProgress(0);
  showQuestion();
}

function guess(target, keyboard) {
  if (phase !== "asking") return;
  const answer = deck[position];
  const stateId = target.dataset.state;
  const correct = usesZones ? target.dataset.prefix === answer.code : answerIds(answer).includes(stateId);
  clearWrongGuess();

  if (!correct) {
    wrongTarget = target;
    if (!missed) {
      missed = true;
      deck.push(answer);
      updateProgress(position);
    }
    markWrongGuess(target, true);
    if (departmentGuess) departmentGuess.value = "";
    const name = target.dataset.city ?? states.get(stateId)?.name;
    const chosen = name ? `You chose ${name}. ` : "";
    setFeedback("wrong", "×", "Try again", `${chosen}This code will also come back at the end.`);
    if (!keyboard) feedback.scrollIntoView({ block: "nearest" });
    return;
  }

  phase = "answered";
  if (!missed && position < codes.length) firstTry += 1;
  setInteraction(false);
  const { code, area, examples, paths } = describeAnswer(answer);
  coverage.replaceChildren(...paths.map((path) => svg("path", { d: path, "fill-rule": "evenodd" })));
  if (!usesZones) {
    for (const id of answerIds(answer)) states.get(id).label.classList.add("is-correct");
  }
  const places = examples.length > 0 ? ` Includes ${list.format(examples)}.` : "";
  const displayCode = usesZones || usesDepartments ? code : `DDD ${code}`;
  const areaDescription = usesDepartments ? `Recorded in ${area}` : area;
  setFeedback("correct", "✓", "Correct!", `${displayCode} · ${areaDescription}.${places}`);
  updateProgress(position + 1);
  advanceLabel.textContent = position + 1 < deck.length ? "Next code" : "See results";
  advance.disabled = false;
  if (keyboard) advance.focus();
  else advance.scrollIntoView({ block: "nearest" });
}

map.addEventListener("click", (event) => {
  const target = event.target.closest("[data-state], [data-prefix]");
  if (target) guess(target, false);
});

map.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const target = event.target.closest('[role="button"]');
  if (target) {
    event.preventDefault();
    guess(target, true);
  }
});

advance.addEventListener("click", () => {
  if (phase === "error") {
    loadQuiz();
    return;
  }
  if (phase === "complete") {
    startQuiz();
    question.focus();
    return;
  }
  if (phase !== "answered") return;

  position += 1;
  if (position < deck.length) {
    showQuestion();
  } else {
    phase = "complete";
    clearCoverage();
    question.textContent = "Quiz complete";
    codeText.textContent = "✓";
    setFeedback("correct", "✓", `All ${codes.length} codes solved`, `You got ${firstTry} right on the first try.`);
    advanceLabel.textContent = "Play again";
  }
  question.focus();
});

async function loadQuiz() {
  phase = "loading";
  advance.disabled = true;
  setFeedback("neutral", "⌖", "Loading the map");
  try {
    const source = usesDepartments ? map.dataset.detailedSource : map.dataset.source || "./map-data.json";
    const response = await fetch(source);
    if (!response.ok) throw new Error(`Map data returned HTTP ${response.status}`);
    const data = await response.json();
    if (usesDepartments) {
      for (const zone of data.zones) detailedZones.set(zone.id, zone);
      data.states = data.departments;
      const byName = [...data.states].sort((a, b) => a.name.localeCompare(b.name, "fr"));
      departmentGuess.append(...byName.map((state) => new Option(`${state.name} (${state.id})`, state.id)));
      prefixGroup.disabled = false;
    }
    renderMap(data);
    allCodes = data.codes;
    answerSheet?.update(data, describeAnswer);
    startQuiz();
  } catch (error) {
    console.error(error);
    shapes.replaceChildren();
    zones?.replaceChildren();
    labels.replaceChildren();
    states.clear();
    detailedZones.clear();
    if (prefixGroup) prefixGroup.disabled = true;
    if (departmentGuess) {
      departmentGuess.disabled = true;
      departmentGuess.options.length = 1;
    }
    phase = "error";
    setFeedback("wrong", "×", "The map could not load", "Try loading it again.");
    advanceLabel.textContent = "Reload map";
    advance.disabled = false;
  }
}

if (usesDepartments) setupDetailedMode();
loadQuiz();
