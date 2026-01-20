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

updateWeekDropdown();
updateWeeksList();

/* ---------- TAB HANDLING ---------- */
function showTab(tabId) {
  document.querySelectorAll(".tabContent").forEach(tab => {
    tab.style.display = "none";
  });
  document.getElementById(tabId).style.display = "block";
}

/* ---------- DARK MODE ---------- */
function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
}

if (localStorage.getItem("darkMode") === "true") {
  document.body.classList.add("dark");
}

/* ---------- DATA ---------- */
function saveData() {
  localStorage.setItem("vocabByWeek", JSON.stringify(vocabByWeek));
}

function updateWeekDropdown() {
  weekSelect.innerHTML = "";
  for (let week in vocabByWeek) {
    const option = document.createElement("option");
    option.value = week;
    option.textContent = week;
    weekSelect.appendChild(option);
  }
}

/* ---------- ADD WORDS ---------- */
function addBulkWords() {
  const week = document.getElementById("weekInput").value.trim();
  const text = document.getElementById("bulkInput").value.trim();
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

  document.getElementById("weekInput").value = "";
  document.getElementById("bulkInput").value = "";
}

/* ---------- QUIZ ---------- */
function startQuiz() {
  currentWeek = weekSelect.value;

  if (!currentWeek || !vocabByWeek[currentWeek].length) {
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

  showNextWord();
}

function showNextWord() {
  const answerInput = document.getElementById("answerInput");
  const submitBtn = document.getElementById("submitBtn");

  if (remainingWords.length === 0) {
    if (retryLaterCheckbox.checked && incorrectWords.length > 0) {
      remainingWords = [...incorrectWords];
      incorrectWords = [];
    } else {
      document.getElementById("quizTerm").textContent = "🎉 All done!";
      optionsContainer.style.display = "none";
      answerInput.style.display = "none";
      submitBtn.style.display = "none";
      document.getElementById("progress").textContent = "";
      updateSummary();
      return;
    }
  }

  // RESET DISPLAY EVERY QUESTION (THIS FIXES THE BUG)
  optionsContainer.style.display = "none";
  answerInput.style.display = "block";
  submitBtn.style.display = "inline-block";

  const index = Math.floor(Math.random() * remainingWords.length);
  currentWord = remainingWords[index];

  document.getElementById("quizTerm").textContent = currentWord.term;
  answerInput.value = "";
  document.getElementById("feedback").textContent = "";
  document.getElementById("progress").textContent =
    `Remaining: ${remainingWords.length}`;

  if (multipleChoiceCheckbox.checked) {
    setupMultipleChoice();
  }
}

function submitAnswer(selected = null) {
  const answerInput = document.getElementById("answerInput");
  const feedback = document.getElementById("feedback");

  let answer = selected || answerInput.value.trim();
  const correct = currentWord.def.trim();

  const stats = wordStats[currentWeek][currentWord.term];
  stats.attempts++;
  if (stats.attempts > 1) stats.correctFirstTry = false;

  if (answer.toLowerCase() === correct.toLowerCase()) {
    feedback.textContent = "✅ Correct!";
    feedback.style.color = "green";
    remainingWords = remainingWords.filter(w => w !== currentWord);
    setTimeout(showNextWord, 700);
  } else {
    feedback.style.color = "red";
    if (retryLaterCheckbox.checked) {
      incorrectWords.push(currentWord);
      remainingWords = remainingWords.filter(w => w !== currentWord);
      feedback.textContent = `❌ ${correct} (retry later)`;
      setTimeout(showNextWord, 900);
    } else {
      feedback.textContent = "❌ Try again";
    }
  }

  updateSummary();
}

/* ---------- MULTIPLE CHOICE ---------- */
function setupMultipleChoice() {
  optionsContainer.innerHTML = "";
  optionsContainer.style.display = "block";

  document.getElementById("answerInput").style.display = "none";
  document.getElementById("submitBtn").style.display = "none";

  const defs = vocabByWeek[currentWeek].map(w => w.def);
  const choices = [currentWord.def];

  while (choices.length < 4 && choices.length < defs.length) {
    const rand = defs[Math.floor(Math.random() * defs.length)];
    if (!choices.includes(rand)) choices.push(rand);
  }

  shuffleArray(choices);

  choices.forEach(def => {
    const btn = document.createElement("button");
    btn.textContent = def;
    btn.onclick = () => submitAnswer(def);
    optionsContainer.appendChild(btn);
  });
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/* ---------- MANAGE WEEKS ---------- */
function updateWeeksList() {
  weeksList.innerHTML = "";
  for (let week in vocabByWeek) {
    const li = document.createElement("li");
    li.textContent = week;

    const del = document.createElement("button");
    del.textContent = "Delete";
    del.onclick = () => deleteWeek(week);

    li.appendChild(del);
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

/* ---------- SUMMARY ---------- */
function updateSummary() {
  if (!currentWeek) return;

  const stats = wordStats[currentWeek];
  const total = Object.keys(stats).length;
  const correct = Object.values(stats).filter(s => s.correctFirstTry).length;

  document.getElementById("totalWords").textContent = total;
  document.getElementById("correctFirstTry").textContent = correct;
  document.getElementById("missedWords").textContent = total - correct;

  const list = document.getElementById("missedWordsList");
  list.innerHTML = "";

  for (let term in stats) {
    if (!stats[term].correctFirstTry) {
      const li = document.createElement("li");
      li.textContent = `${term} (${stats[term].attempts})`;
      list.appendChild(li);
    }
  }
}
