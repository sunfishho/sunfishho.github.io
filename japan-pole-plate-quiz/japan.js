const plate = document.querySelector("#plate");
const map = document.querySelector("#region-map");
const options = document.querySelector("#regions");
const question = document.querySelector("#question");
const progress = document.querySelector("#progress");
const progressBar = document.querySelector("#progress-bar");
const progressCount = document.querySelector("#progress-count");
const feedback = document.querySelector("#feedback");
const feedbackIcon = document.querySelector("#feedback-icon");
const feedbackTitle = document.querySelector("#feedback-title");
const feedbackDetail = document.querySelector("#feedback-detail");
const fieldExample = document.querySelector("#field-example");
const advance = document.querySelector("#advance");
const advanceLabel = document.querySelector("#advance-label");
const reference = document.querySelector("#reference");
const referenceButton = document.querySelector("#open-reference");
const referenceCards = document.querySelector("#reference-cards");
const regionById = new Map(polePlates.map((entry) => [entry.id, entry]));
const markers = new Map();
let deck = [];
let position = 0;
let missed = false;
let firstTry = 0;
let markedRegion;
let phase = "loading";

function mapNode(tag, attributes) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [key, value] of Object.entries(attributes)) {
    node.setAttribute(key, value);
  }
  return node;
}

function renderMap(data) {
  map.setAttribute("viewBox", data.viewBox);
  for (const inset of data.insets) {
    map.append(mapNode("rect", {
      class: "inset-outline", x: inset.x, y: inset.y, "data-region": inset.id,
      width: inset.width, height: inset.height, rx: 7,
    }));
  }

  const geometry = new Map(data.regions.map((region) => [region.id, region]));
  for (const entry of polePlates) {
    const { id, name } = entry;
    const region = geometry.get(id);
    const shape = mapNode("path", {
      class: "region-shape", d: region.path, "fill-rule": "evenodd", "data-region": id,
    });
    const button = document.createElement("button");
    button.type = "button";
    button.className = "region-option";
    button.dataset.region = id;
    button.textContent = name;
    button.addEventListener("focus", () => shape.classList.add("is-hovered"));
    button.addEventListener("blur", () => shape.classList.remove("is-hovered"));
    button.addEventListener("pointerenter", () => shape.classList.add("is-hovered"));
    button.addEventListener("pointerleave", () => shape.classList.remove("is-hovered"));

    map.append(shape);
    options.append(button);
    markers.set(id, { shape, button });
  }
}

function markRegion(id, className) {
  if (markedRegion) {
    const { shape, button } = markers.get(markedRegion);
    shape.classList.remove("is-wrong", "is-correct");
    button.classList.remove("is-wrong", "is-correct");
  }
  markedRegion = id;
  if (id) {
    const { shape, button } = markers.get(id);
    shape.classList.add(className);
    button.classList.add(className);
  }
}

function lockMap(locked) {
  map.classList.toggle("is-locked", locked);
  for (const { button } of markers.values()) button.disabled = locked;
}

function setFeedback(tone, icon, title, detail = "", source) {
  feedback.dataset.tone = tone;
  feedbackIcon.textContent = icon;
  feedbackTitle.textContent = title;
  feedbackDetail.textContent = detail;
  fieldExample.hidden = !source;
  if (source) fieldExample.href = source;
}

function setProgress(completed) {
  progressBar.max = deck.length;
  progressBar.value = completed;
  progressCount.textContent = `${completed} / ${deck.length} complete`;
}

function showPlate() {
  phase = "asking";
  missed = false;
  markRegion();
  lockMap(false);
  question.textContent = "Which region does this plate suggest?";
  const clue = deck[position];
  drawPolePlate(plate, clue.id);
  plate.setAttribute("aria-label", clue.description);
  setFeedback("neutral", "⌖", "Choose a region", "Select an area on the map or choose its name.");
  advanceLabel.textContent = "Next plate";
  advance.disabled = true;
}

function startRound() {
  deck = [...polePlates];
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  position = 0;
  firstTry = 0;
  progress.hidden = false;
  setProgress(0);
  showPlate();
}

function guess(id, keyboard) {
  if (phase !== "asking") return;
  const answer = deck[position];
  if (answer.id !== id) {
    if (!missed) {
      missed = true;
      deck.push(answer);
      setProgress(position);
    }
    markRegion(id, "is-wrong");
    setFeedback("wrong", "×", "Try again", `You chose ${regionById.get(id).name}. This plate will come up again at the end.`);
    if (!keyboard) feedback.scrollIntoView({ block: "nearest" });
    return;
  }

  phase = "answered";
  if (!missed && position < polePlates.length) firstTry += 1;
  lockMap(true);
  markRegion(id, "is-correct");
  setProgress(position + 1);
  setFeedback("correct", "✓", `Correct · ${answer.name}`, `${answer.utility}. ${answer.clue}`, answer.field);
  advanceLabel.textContent = position + 1 < deck.length ? "Next plate" : "See results";
  advance.disabled = false;
  if (keyboard) advance.focus();
  else advance.scrollIntoView({ block: "nearest" });
}

for (const container of [map, options]) {
  container.addEventListener("click", (event) => {
    const target = event.target.closest("[data-region]");
    if (target) guess(target.dataset.region, event.detail === 0);
  });
}

advance.addEventListener("click", () => {
  if (phase === "error") {
    loadMap();
  } else if (phase === "complete") {
    startRound();
    question.focus();
  } else if (phase === "answered") {
    position += 1;
    if (position < deck.length) {
      showPlate();
    } else {
      phase = "complete";
      question.textContent = "Round complete";
      markRegion();
      setFeedback("correct", "✓", `All ${polePlates.length} regions covered`, `You got ${firstTry} right on the first try.`);
      advanceLabel.textContent = "Play again";
    }
    question.focus();
  }
});

function addReferenceCards() {
  for (const entry of polePlates) {
    const card = document.createElement("article");
    card.className = "reference-entry";
    const sample = document.createElement("canvas");
    sample.width = 286;
    sample.height = 360;
    sample.setAttribute("aria-hidden", "true");
    drawPolePlate(sample, entry.id);

    const copy = document.createElement("div");
    const heading = document.createElement("h3");
    heading.textContent = entry.name;
    const description = document.createElement("p");
    description.textContent = entry.clue;
    const example = document.createElement("a");
    example.href = entry.field;
    example.target = "_blank";
    example.rel = "noopener";
    example.textContent = "Field example ↗";
    example.setAttribute("aria-label", `Field example for ${entry.name}`);
    copy.append(heading, description, example);
    if (entry.streetView) {
      const panorama = document.createElement("a");
      panorama.href = entry.streetView;
      panorama.target = "_blank";
      panorama.rel = "noopener";
      panorama.textContent = "Street View arrow example ↗";
      copy.append(panorama);
    }
    card.append(sample, copy);
    referenceCards.append(card);
  }
}

referenceButton.addEventListener("click", () => {
  if (referenceCards.childElementCount === 0) addReferenceCards();
  reference.showModal();
});
reference.addEventListener("close", () => referenceButton.focus());

async function loadMap() {
  phase = "loading";
  advance.disabled = true;
  setFeedback("neutral", "⌖", "Loading the map");
  try {
    const response = await fetch("./map-data.json");
    if (!response.ok) throw new Error(`Map returned HTTP ${response.status}`);
    renderMap(await response.json());
    startRound();
  } catch (error) {
    console.error(error);
    map.replaceChildren();
    options.replaceChildren();
    markers.clear();
    phase = "error";
    setFeedback("wrong", "×", "The quiz could not load", "Try loading it again.");
    advanceLabel.textContent = "Reload quiz";
    advance.disabled = false;
  }
}

loadMap();
