const svgNamespace = "http://www.w3.org/2000/svg";
const map = document.querySelector("#map");
const shapes = document.querySelector("#state-shapes");
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
const states = new Map();

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

let codes = [];
let deck = [];
let position = 0;
let firstTry = 0;
let missed = false;
let wrongState;
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

  for (const state of data.states) {
    const shape = svg("g", {
      class: "state",
      role: "button",
      tabindex: "0",
      "aria-label": state.name,
      "data-state": state.id,
    });
    shape.append(
      svg("title", {}, state.name),
      svg("path", { d: state.path, "fill-rule": "evenodd" }),
    );

    const label = svg("g", { class: "state-label", "data-state": state.id });
    const callout = calloutPositions[state.id];
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

function setFeedback(tone, icon, title, detail = "") {
  feedback.dataset.tone = tone;
  feedbackIcon.textContent = icon;
  feedbackTitle.textContent = title;
  feedbackDetail.textContent = detail;
}

function setInteraction(enabled) {
  map.classList.toggle("is-answered", !enabled);
  for (const { shape } of states.values()) {
    shape.setAttribute("tabindex", enabled ? "0" : "-1");
    shape.setAttribute("aria-disabled", String(!enabled));
  }
}

function markWrongState(id, marked) {
  const { shape, label } = states.get(id);
  shape.classList.toggle("is-wrong", marked);
  label.classList.toggle("is-wrong", marked);
}

function clearWrongGuess() {
  if (wrongState) markWrongState(wrongState, false);
  wrongState = undefined;
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

function showQuestion() {
  phase = "asking";
  missed = false;
  clearWrongGuess();
  clearCoverage();
  setInteraction(true);

  codeText.textContent = deck[position].code;
  question.textContent = "Which state uses this code?";
  advance.disabled = true;
  advanceLabel.textContent = "Next code";
  setFeedback("neutral", "⌖", "Choose a state", "Select a state or its two-letter label on the map.");
}

function startQuiz() {
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

function guess(id, keyboard) {
  if (phase !== "asking") return;
  const answer = deck[position];
  clearWrongGuess();

  if (!answer.states.includes(id)) {
    wrongState = id;
    if (!missed) {
      missed = true;
      deck.push(answer);
      updateProgress(position);
    }
    markWrongState(id, true);
    setFeedback("wrong", "×", "Try again", `You chose ${states.get(id).name}. This code will also come back at the end.`);
    if (!keyboard) feedback.scrollIntoView({ block: "nearest" });
    return;
  }

  phase = "answered";
  if (!missed && position < codes.length) firstTry += 1;
  setInteraction(false);
  coverage.replaceChildren(svg("path", { d: answer.path, "fill-rule": "evenodd" }));
  for (const stateId of answer.states) states.get(stateId).label.classList.add("is-correct");

  const names = list.format(answer.states.map((stateId) => states.get(stateId).name));
  const places = answer.places.length > 0 ? ` Includes ${list.format(answer.places)}.` : "";
  setFeedback("correct", "✓", "Correct!", `DDD ${answer.code} · ${names}.${places}`);
  updateProgress(position + 1);
  advanceLabel.textContent = position + 1 < deck.length ? "Next code" : "See results";
  advance.disabled = false;
  if (keyboard) advance.focus();
  else advance.scrollIntoView({ block: "nearest" });
}

map.addEventListener("click", (event) => {
  const target = event.target.closest("[data-state]");
  if (target) guess(target.dataset.state, false);
});

map.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const target = event.target.closest(".state");
  if (target) {
    event.preventDefault();
    guess(target.dataset.state, true);
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
    const response = await fetch("./map-data.json");
    if (!response.ok) throw new Error(`Map data returned HTTP ${response.status}`);
    const data = await response.json();
    renderMap(data);
    codes = data.codes;
    startQuiz();
  } catch (error) {
    console.error(error);
    shapes.replaceChildren();
    labels.replaceChildren();
    states.clear();
    phase = "error";
    setFeedback("wrong", "×", "The map could not load", "Try loading it again.");
    advanceLabel.textContent = "Reload map";
    advance.disabled = false;
  }
}

loadQuiz();
