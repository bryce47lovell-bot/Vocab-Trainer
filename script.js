/* =========================
   DARK MODE (PERSISTENT)
========================= */
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "on") {
    document.body.classList.add("dark-mode");
  }
});

/* =========================
   DATA
========================= */
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
const answerInput = document.getElementById("answerInput");
const submitBtn = document.getElementById("submitBtn");
const quizTerm = document.getElementById("quizTerm");
const feedback = document.getElementById("feedback");
const progress = document.getElementById("progress");
const totalWords = document.getElementById("totalWords");
const correctFirstTry = document.getElementById("correctFirstTry");
const missedWords = document.getElementById("missedWords");

/* =========================
   DARK MODE TOGGLE
========================= */
function toggleDarkMode() {
  const isDark = document.body.classList.toggle("dark-mode");
  localStorage.setItem("darkMode", isDark ? "on" : "off");
}

/* =========================
   UI
========================= */
function showTab(tabId) {
  document.querySelectorAll(".tabContent").forEach(tab => {
    tab.style.display = "none";
  });
  document.getElementById(tabId).style.display = "block";
}

/* =========================
   STORAGE
========================= */
function saveData() {
  localStorage.setItem("vocabByWeek", JSON.stringify(vocabByWeek));
}

/* =========================
   WEEK MANAGEMENT
========================= */
function updateWeekDropdown() {
  weekSelect.innerHTML = "";
  for (let week in vocabByWeek) {
    const opt = document.createElement("option");
    opt.value = week;
    opt.textContent = week;
    weekSelect.appendChild(opt);
  }

  if (weekSelect.options.length > 0) {
    weekSelect.value = weekSelect.options[0].value;
  }
}

function updateWeeksList() {
  weeksList.innerHTML = "";
  for (let week in vocabByWeek) {
    const li = document.createElement("li");
    li.textContent = week;

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.style.marginLeft = "10px";
    delBtn.onclick = () => deleteWeek(week);

    li.appendChild(delBtn);
    weeksList.appendChild(li);
  }
}

function deleteWeek(week) {
  if (!confirm(`Delete "${week}"?`)) return;
  delete vocabByWeek[week];
  saveData();
  updateWeekDropdown();
  updateWeeksList();
}

/* =========================
   ADD WORDS
========================= */
function addBulkWords() {
  const week = weekInput.value.trim();
  const text = bulkInput.value.trim();
  if (!week || !text) return;

  if (!vocabByWeek[week]) vocabByWeek[week] = [];

  text.split("\n").forEach(line => {
    const parts = line.split(" - ");
    if (parts.length === 2) {
      vocabByWeek[week].push({
        term: parts[0].trim(),
        def: parts[1].trim()
      });
    }
  });

  saveData();
  updateWeekDropdown();
  updateWeeksList();

  weekInput.value = "";
  bulkInput.value = "";
}

/* =========================
   QUIZ
========================= */
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
    if (!wordStats[currentWeek][w.term]) {
      wordStats[currentWeek][w.term] = {
        attempts: 0,
        correctFirstTry: true
      };
    }
  });

  answerInput.style.display = "block";
  submitBtn.style.display = "inline-block";
  optionsContainer.style.display = "none";

  showNextWord();
}

function showNextWord() {
  if (remainingWords.length === 0) {
    quizTerm.textContent = "🎉 Quiz complete!";
    optionsContainer.style.display = "none";
    answerInput.style.display = "none";
    submitBtn.style.display = "none";
    progress.textContent = "";
    updateSummary();
    return;
  }

  currentWord = remainingWords[Math.floor(Math.random() * remainingWords.length)];

  quizTerm.textContent = currentWord.term;
  answerInput.value = "";
  feedback.textContent = "";
  progress.textContent = `Remaining: ${remainingWords.length}`;

  if (multipleChoiceCheckbox.checked) {
    setupMultipleChoice();
  } else {
    optionsContainer.style.display = "none";
    answerInput.style.display = "block";
    submitBtn.style.display = "inline-block";
  }
}

function submitAnswer(selected = null) {
  const answer = selected || answerInput.value.trim();
  const correct = currentWord.def;

  const stats = wordStats[currentWeek][currentWord.term];
  stats.attempts++;

  if (stats.attempts > 1) stats.correctFirstTry = false;

  if (answer.toLowerCase() === correct.toLowerCase()) {
    feedback.textContent = "✅ Correct!";
    feedback.style.color = "green";
    remainingWords = remainingWords.filter(w => w !== currentWord);
    setTimeout(showNextWord, 700);
  } else {
    feedback.textContent = "❌ Wrong!";
    feedback.style.color = "red";
    if (retryLaterCheckbox.checked) {
      if (!incorrectWords.includes(currentWord)) incorrectWords.push(currentWord);
      remainingWords = remainingWords.filter(w => w !== currentWord);
      setTimeout(showNextWord, 900);
    }
  }

  updateSummary();
}

function setupMultipleChoice() {
  optionsContainer.innerHTML = "";
  optionsContainer.style.display = "block";
  answerInput.style.display = "none";
  submitBtn.style.display = "none";

  const allDefs = vocabByWeek[currentWeek].map(w => w.def);
  const choices = [currentWord.def];

  while (choices.length < 4 && choices.length < allDefs.length) {
    const randomDef = allDefs[Math.floor(Math.random() * allDefs.length)];
    if (!choices.includes(randomDef)) choices.push(randomDef);
  }

  choices.sort(() => Math.random() - 0.5);

  choices.forEach(def => {
    const btn = document.createElement("button");
    btn.textContent = def;
    btn.onclick = () => submitAnswer(def);
    optionsContainer.appendChild(btn);
  });
}

/* =========================
   SUMMARY
========================= */
function updateSummary() {
  if (!currentWeek || !wordStats[currentWeek]) return;

  const stats = wordStats[currentWeek];
  const total = Object.keys(stats).length;
  const correctFirst = Object.values(stats).filter(s => s.correctFirstTry).length;

  totalWords.textContent = total;
  correctFirstTry.textContent = correctFirst;
  missedWords.textContent = total - correctFirst;
}

function reviewMissed() {
  if (!currentWeek || !wordStats[currentWeek]) return;

  const missedTerms = Object.keys(wordStats[currentWeek]).filter(
    t => !wordStats[currentWeek][t].correctFirstTry
  );

  if (missedTerms.length === 0) {
    alert("No missed words to review!");
    return;
  }

  remainingWords = vocabByWeek[currentWeek].filter(w => missedTerms.includes(w.term));
  incorrectWords = [];
  showNextWord();
  showTab("quizTab");
}

/* =========================
   SUBMIT ANSWER ON ENTER
========================= */
answerInput.addEventListener("keydown", function(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    submitAnswer();
  }
});

/* =========================
   INITIALIZE
========================= */
updateWeekDropdown();
updateWeeksList();
