const FLASH_MS = 850;
const BAKERS = {
  speedy: {
    name: "Speedy",
    limitMs: 6000,
    defaultCount: 50,
    passRate: 1,
    allowEarlyEnd: false,
    addMax: 12,
    mulMax: 12,
  },
  practice: {
    name: "Practice",
    limitMs: null,
    defaultCount: 20,
    passRate: 0.8,
    allowEarlyEnd: true,
    addMax: 12,
    mulMax: 12,
  },
  beginner: {
    name: "Beginner",
    limitMs: null,
    defaultCount: 10,
    passRate: 0.8,
    allowEarlyEnd: true,
    addMax: 5,
    mulMax: 3,
  },
};

const setupEl = document.getElementById("setup");
const quizEl = document.getElementById("quiz");
const resultsEl = document.getElementById("results");
const startBtn = document.getElementById("start-btn");
const againBtn = document.getElementById("again-btn");
const countInput = document.getElementById("question-count");
const progressEl = document.getElementById("progress");
const problemEl = document.getElementById("problem");
const flashEl = document.getElementById("flash");
const formEl = document.getElementById("answer-form");
const answerEl = document.getElementById("answer");
const timerWrap = document.getElementById("timer-wrap");
const timerNote = document.getElementById("timer-note");
const timerFill = document.getElementById("timer-fill");
const greenLabel = document.getElementById("green-label");
const greenLive = document.getElementById("green-live");
const yellowLive = document.getElementById("yellow-live");
const redLive = document.getElementById("red-live");
const greenFinal = document.getElementById("green-final");
const yellowFinal = document.getElementById("yellow-final");
const redFinal = document.getElementById("red-final");
const resultsTitle = document.getElementById("results-title");
const resultsSub = document.getElementById("results-sub");
const danceEl = document.getElementById("dance");
const keypad = document.querySelector(".keypad");
const confettiHost = document.querySelector(".confetti");
const doneBtn = document.getElementById("done-btn");
const bakerInputs = document.querySelectorAll('input[name="baker"]');

const SYMBOLS = { add: "+", sub: "−", mul: "×", div: "÷" };

const state = {
  baker: "speedy",
  limitMs: 6000,
  op: "add",
  total: 50,
  index: 0,
  current: null,
  startedAt: 0,
  locked: false,
  scores: { green: 0, yellow: 0, red: 0 },
  advanceTimer: null,
};

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeProblem(op) {
  const baker = BAKERS[state.baker];
  const addMax = baker.addMax;
  const mulMax = baker.mulMax;
  if (op === "add") {
    const a = randInt(0, addMax);
    const b = randInt(0, addMax);
    return { a, b, answer: a + b };
  }
  if (op === "sub") {
    const x = randInt(0, addMax);
    const y = randInt(0, addMax);
    const a = Math.max(x, y);
    const b = Math.min(x, y);
    return { a, b, answer: a - b };
  }
  if (op === "mul") {
    const a = randInt(0, mulMax);
    const b = randInt(0, mulMax);
    return { a, b, answer: a * b };
  }
  const b = randInt(1, addMax);
  const q = randInt(0, Math.floor(addMax / b));
  return { a: b * q, b, answer: q };
}

function answeredCount() {
  return state.scores.green + state.scores.yellow + state.scores.red;
}

function didPass() {
  const baker = BAKERS[state.baker];
  const answered = answeredCount();
  const correct = state.scores.green + state.scores.yellow;
  if (answered === 0) return false;
  if (state.baker === "speedy" || baker.passRate >= 1) {
    return (
      answered === state.total &&
      state.scores.green === state.total &&
      state.scores.yellow === 0 &&
      state.scores.red === 0
    );
  }
  return correct / answered >= baker.passRate;
}

function show(screen) {
  setupEl.classList.toggle("hidden", screen !== "setup");
  quizEl.classList.toggle("hidden", screen !== "quiz");
  resultsEl.classList.toggle("hidden", screen !== "results");
}

function updateLiveScore() {
  greenLive.textContent = String(state.scores.green);
  yellowLive.textContent = String(state.scores.yellow);
  redLive.textContent = String(state.scores.red);
}

function restartTimer() {
  timerFill.classList.remove("draining", "empty");
  timerFill.style.transform = "";
  timerFill.style.animationDuration = "";
  if (!state.limitMs) return;
  timerFill.style.animationDuration = `${state.limitMs / 1000}s`;
  void timerFill.offsetWidth;
  timerFill.classList.add("draining");
}

function freezeTimer(elapsed) {
  if (!state.limitMs) return;
  timerFill.classList.remove("draining");
  const remaining = Math.max(0, 1 - elapsed / state.limitMs);
  timerFill.style.transform = `scaleX(${remaining})`;
  if (remaining === 0) timerFill.classList.add("empty");
}

function nextQuestion() {
  state.locked = false;
  quizEl.classList.remove("flash-green", "flash-yellow", "flash-red");
  flashEl.textContent = "";
  flashEl.style.color = "";
  answerEl.value = "";
  state.current = makeProblem(state.op);
  state.index += 1;
  progressEl.textContent = `Question ${state.index} of ${state.total}`;
  problemEl.textContent = `${state.current.a} ${SYMBOLS[state.op]} ${state.current.b}`;
  state.startedAt = performance.now();
  restartTimer();
  answerEl.focus();
}

function startRound() {
  const count = countInput.valueAsNumber;
  if (!Number.isInteger(count) || count < 1 || count > 200) {
    countInput.setCustomValidity("Enter a whole number from 1 to 200.");
    countInput.reportValidity();
    countInput.focus();
    return;
  }
  countInput.setCustomValidity("");
  state.baker = document.querySelector('input[name="baker"]:checked').value;
  state.limitMs = BAKERS[state.baker].limitMs;
  state.op = document.querySelector('input[name="op"]:checked').value;
  state.total = count;
  const timed = Boolean(state.limitMs);
  quizEl.classList.toggle("untimed", !timed);
  quizEl.classList.toggle("can-stop", BAKERS[state.baker].allowEarlyEnd);
  resultsEl.classList.toggle("untimed", !timed);
  if (timed) {
    const seconds = state.limitMs / 1000;
    timerWrap.setAttribute("aria-label", `${seconds} second timer`);
    timerNote.textContent = `${BAKERS[state.baker].name}'s sprinkle timer: ${seconds} seconds for green`;
  }
  countInput.value = String(state.total);
  state.index = 0;
  state.scores = { green: 0, yellow: 0, red: 0 };
  updateLiveScore();
  show("quiz");
  nextQuestion();
}

function finishRound() {
  window.clearTimeout(state.advanceTimer);
  timerFill.classList.remove("draining");
  greenFinal.textContent = String(state.scores.green);
  yellowFinal.textContent = String(state.scores.yellow);
  redFinal.textContent = String(state.scores.red);

  const answered = answeredCount();
  const correct = state.scores.green + state.scores.yellow;
  const requiresPerfectSpeed = state.baker === "speedy";
  const denom = requiresPerfectSpeed ? state.total : answered;
  const scored = requiresPerfectSpeed ? state.scores.green : correct;
  const percent = denom ? Math.floor((scored / denom) * 100) : 0;
  const passed = didPass();
  const passNeed = requiresPerfectSpeed
    ? 100
    : Math.round(BAKERS[state.baker].passRate * 100);

  danceEl.classList.toggle("hidden", !passed);
  if (passed) {
    resultsTitle.textContent = "You passed!";
    resultsSub.textContent =
      passNeed >= 100
        ? "Perfect batch. The cupcake cannot stay still."
        : `${percent}% right on ${answered} treat${answered === 1 ? "" : "s"}. The cupcake cannot stay still.`;
    sprinkleConfetti();
  } else {
    resultsTitle.textContent = "Batch complete";
    resultsSub.textContent =
      answered === 0
        ? "Try at least one treat next time."
        : `${percent}% right on ${answered} treat${answered === 1 ? "" : "s"}. Need ${passNeed}% to pass.`;
  }
  greenLabel.textContent = state.limitMs ? "Green (fast + right)" : "Green (right)";
  show("results");
}

function sprinkleConfetti() {
  confettiHost.replaceChildren();
  const colors = ["#ff6ea8", "#7ee0c4", "#ffe07a", "#7aa7ff", "#ff8a5b"];
  for (let i = 0; i < 24; i += 1) {
    const bit = document.createElement("span");
    bit.style.left = `${Math.random() * 100}%`;
    bit.style.background = colors[i % colors.length];
    bit.style.animationDelay = `${Math.random() * 0.8}s`;
    confettiHost.appendChild(bit);
  }
}

function grade(raw) {
  if (state.locked) return;
  const trimmed = raw.trim();
  if (!/^-?\d+$/.test(trimmed)) return;

  const guess = Number(trimmed);
  if (!Number.isSafeInteger(guess)) return;

  state.locked = true;
  const elapsed = performance.now() - state.startedAt;
  const correct = guess === state.current.answer;
  let color = "red";
  if (correct && (!state.limitMs || elapsed < state.limitMs)) color = "green";
  else if (correct) color = "yellow";

  state.scores[color] += 1;
  updateLiveScore();
  freezeTimer(elapsed);

  quizEl.classList.add(`flash-${color}`);
  flashEl.style.color = `var(--${color})`;
  flashEl.textContent = correct ? (color === "green" ? "Sweet!" : "Right — a little extra time") : "Not quite";

  state.advanceTimer = window.setTimeout(() => {
    if (state.index >= state.total) finishRound();
    else nextQuestion();
  }, FLASH_MS);
}

timerFill.addEventListener("animationend", () => {
  timerFill.classList.remove("draining");
  timerFill.classList.add("empty");
});

function syncCountDefault() {
  const baker = document.querySelector('input[name="baker"]:checked').value;
  countInput.value = String(BAKERS[baker].defaultCount);
}

startBtn.addEventListener("click", startRound);
againBtn.addEventListener("click", () => show("setup"));
doneBtn.addEventListener("click", finishRound);
bakerInputs.forEach((input) => {
  input.addEventListener("change", syncCountDefault);
});
countInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") startRound();
});
countInput.addEventListener("input", () => {
  countInput.setCustomValidity("");
});

formEl.addEventListener("submit", (event) => {
  event.preventDefault();
  grade(answerEl.value);
});

keypad.addEventListener("click", (event) => {
  const key = event.target.closest("button")?.dataset.key;
  if (!key || state.locked) return;
  if (key === "back") {
    answerEl.value = answerEl.value.slice(0, -1);
  } else if (key === "-") {
    answerEl.value = answerEl.value.startsWith("-")
      ? answerEl.value.slice(1)
      : `-${answerEl.value}`;
  } else if (answerEl.value.replace("-", "").length < 5) {
    answerEl.value += key;
  }
  answerEl.focus();
});
