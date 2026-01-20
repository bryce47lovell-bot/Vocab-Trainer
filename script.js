let vocabByWeek = JSON.parse(localStorage.getItem("vocabByWeek")) || {};
let currentWeek = null;
let remainingWords = [];
let currentWord = null;
let incorrectWords = [];
let wordStats = {};

const weekSelect = document.getElementById("weekSelect");
const optionsContainer = document.getElementById("optionsContainer");
const multipleChoiceCheckbox = document.getElementById("multipleChoice");
const retryLaterCheckbox = document.getElementById("retryLater");
const weeksList = document.getElementById("weeksList");

/* ---------- UI ---------- */
function showTab(tabId) {
  document.querySelectorAll(".tabContent").forEach(t => t.style.display = "none");
  document.getElementById(tabId).style.display = "block";
}

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
}

/* ---------- STORAGE ---------- */
function saveData() {
  localStorage.setItem("vocabByWeek", JSON.stringify(vocabByWeek));
}

/* ---------- WEEK SETUP ---------- */
function updateWeekDropdown() {
  weekSelect.innerHTML = "";
  for (let week in vocabByWeek) {
    const opt = document.createElement("option");
    opt.value = week;
    opt.textContent = week;
    weekSelect.appendChild(opt);
  }

  // ✅ FIX: auto-select first week
  if (weekSelect.options.length > 0) {
    weekSelect.value = weekSelect.options[0].value;
  }
}

function updateWeeksList() {
  weeksList.innerHTML = "";
  for (let week in vocabByWeek) {
    const li = document.createElement("li");
    li.textContent = week;
    const btn = document.createElement("button");
    btn.textContent = "Delete";
    btn.onclick = () => deleteWeek(week);
    li.appendChild(btn);
    weeksList.appendChild(li);
  }
}

function deleteWeek(week) {
  if (!confirm(`Delete ${week}?`)) return;
  delete vocabByWeek[week];
  saveData();
  updateWeekDropdown();
  updateWeeksList();
}

/* ---------- ADD WORDS ---------- */
function addBulkWords() {
  const week = weekInput.value.trim();
  const text = bulkInput.value.trim();
  if (!week || !text) return;

  if (!vocabByWeek[week]) vocabByWeek[week] = [];

  text.split("\n").forEach(line => {
    const [term, def] = line.split(" - ");
    if (term && def) {
      vocabByWeek[week].push({ term: term.trim(), def: def.trim() });
    }
  });

  saveData();
  updateWeekDropdown();
  updateWeeksList();

  weekInput.value = "";
  bulkInput.value = "";
}

/* ---------- QUIZ ---------- */
function startQuiz() {
  showTab("quizTab");

  currentWeek = weekSelect.value;
  if (!currentWeek || !vocabByWeek[currentWeek]?.length) {
    alert("No words in this week");
    return;
  }

  remainingWords = [...vocabByWeek[currentWeek]];
  incorrectWords = [];

  if (!wordStats[currentWeek]) wordStats[currentWeek] = {};
  remainingWords.forEach(w => {
    wordStats[currentWeek][w.term] ??= { attempts: 0, correctFirstTry: true };
  });

  answerInput.style.display = "block";
  submitBtn.style.display = "inline-block";
  optionsContainer.style.display = "none";

  showNextWord();
}

function showNextWord() {
  if (!remainingWords.length) {
    quizTerm.textContent = "🎉 Quiz complete!";
    optionsContainer.style.display = "none";
    answerInput.style.display = "none";
    submitBtn.style.display = "none";
    updateSummary();
    return;
  }

  currentWord = remainingWords[Math.floor(Math.random() * remainingWords.length)];
  quizTerm.textContent = currentWord.term;
  feedback.textContent = "";
  progress.textContent = `Remaining: ${remainingWords.length}`;

  if (multipleChoiceCheckbox.checked) setupMultipleChoice();
  else {
    optionsContainer.style.display = "none";
    answerInput.style.display = "block";
    submitBtn.style.display = "inline-block";
  }
}

function submitAnswer(selected = null) {
  const answer = selected || answerInput.value.trim();
  const correct = currentWord.def;

  wordStats[currentWeek][currentWord.term].attempts++;

  if (answer.toLowerCase() === correct.toLowerCase()) {
    feedback.textContent = "✅ Correct!";
    remainingWords = remainingWords.filter(w => w !== currentWord);
    setTimeout(showNextWord, 700);
  } else {
    feedback.textContent = "❌ Wrong";
    if (retryLaterCheckbox.checked) {
      incorrectWords.push(currentWord);
      remainingWords = remainingWords.filter(w => w !== currentWord);
      setTimeout(showNextWord, 900);
    }
  }
}

function setupMultipleChoice() {
  optionsContainer.innerHTML = "";
  optionsContainer.style.display = "block";
  answerInput.style.display = "none";
  submitBtn.style.display = "none";

  const defs = vocabByWeek[currentWeek].map(w => w.def);
  const choices = [currentWord.def];

  while (choices.length < 4 && choices.length < defs.length) {
    const d = defs[Math.floor(Math.random() * defs.length)];
    if (!choices.includes(d)) choices.push(d);
  }

  choices.sort(() => Math.random() - 0.5);

  choices.forEach(def => {
    const btn = document.createElement("button");
    btn.textContent = def;
    btn.onclick = () => submitAnswer(def);
    optionsContainer.appendChild(btn);
  });
}

/* ---------- SUMMARY ---------- */
function updateSummary() {
  const stats = wordStats[currentWeek];
  if (!stats) return;

  const total = Object.keys(stats).length;
  const correctFirst = Object.values(stats).filter(s => s.correctFirstTry).length;

  totalWords.textContent = total;
  correctFirstTry.textContent = correctFirst;
  missedWords.textContent = total - correctFirst;
}

function reviewMissed() {
  showTab("quizTab");
}

/* ---------- INIT ---------- */
updateWeekDropdown();
updateWeeksList();
