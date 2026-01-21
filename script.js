// ===== Data =====
let vocabByWeek = JSON.parse(localStorage.getItem("vocabByWeek")) || {};
let currentWeek = null;
let remainingWords = [];
let currentWord = null;
let incorrectWords = [];
let wordStats = {};
let testMode = false;

// ===== Elements =====
const weekSelect = document.getElementById("weekSelect");
const optionsContainer = document.getElementById("optionsContainer");
const multipleChoiceCheckbox = document.getElementById("multipleChoice");
const retryLaterCheckbox = document.getElementById("retryLater");
const testModeCheckbox = document.getElementById("testMode");
const weeksList = document.getElementById("weeksList");
const answerInput = document.getElementById("answerInput");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progress");

// ===== Initial setup =====
document.addEventListener("DOMContentLoaded", () => {
  updateWeekDropdown();
  updateWeeksList();
  if (localStorage.getItem("darkMode") === "on") {
    document.body.classList.add("dark-mode");
  }
});

// ===== Tabs =====
function showTab(tabId) {
  document.querySelectorAll(".tabContent").forEach(tab => tab.style.display = "none");
  document.getElementById(tabId).style.display = "block";
}

// ===== Dark Mode =====
function toggleDarkMode() {
  const isDark = document.body.classList.toggle("dark-mode");
  localStorage.setItem("darkMode", isDark ? "on" : "off");
}

// ===== Save / Load =====
function saveData() {
  localStorage.setItem("vocabByWeek", JSON.stringify(vocabByWeek));
}

// ===== Update Dropdown =====
function updateWeekDropdown() {
  weekSelect.innerHTML = "";
  for (let week in vocabByWeek) {
    const option = document.createElement("option");
    option.value = week;
    option.textContent = week;
    weekSelect.appendChild(option);
  }
}

// ===== Add Words =====
function addBulkWords() {
  const week = document.getElementById("weekInput").value.trim();
  const text = document.getElementById("bulkInput").value.trim();
  if (!week || !text) return;

  if (!vocabByWeek[week]) vocabByWeek[week] = [];

  text.split("\n").forEach(line => {
    const parts = line.split(" - ");
    if (parts.length === 2) {
      vocabByWeek[week].push({ term: parts[0].trim(), def: parts[1].trim() });
    }
  });

  saveData();
  updateWeekDropdown();
  updateWeeksList();

  document.getElementById("weekInput").value = "";
  document.getElementById("bulkInput").value = "";

  alert("Words added!");
}

// ===== Start Quiz =====
function startQuiz() {
  currentWeek = weekSelect.value;
  if (!currentWeek || !vocabByWeek[currentWeek] || vocabByWeek[currentWeek].length === 0) {
    alert("No words in this week");
    return;
  }

  remainingWords = [...vocabByWeek[currentWeek]];
  incorrectWords = [];
  testMode = testModeCheckbox.checked;

  if (!wordStats[currentWeek]) wordStats[currentWeek] = {};
  remainingWords.forEach(w => {
    if (!wordStats[currentWeek][w.term]) {
      wordStats[currentWeek][w.term] = { attempts: 0, correctFirstTry: true };
    }
  });

  showNextWord();
}

// ===== Show Next Word =====
function showNextWord() {
  if (remainingWords.length === 0) {
    if (retryLaterCheckbox.checked && incorrectWords.length > 0) {
      remainingWords = [...incorrectWords];
      incorrectWords = [];
      showNextWord();
      return;
    } else {
      if (testMode) {
        showTestResults();
      } else {
        document.getElementById("quizTerm").textContent = "🎉 You got all words correct!";
      }
      optionsContainer.style.display = "none";
      answerInput.style.display = "none";
      document.getElementById("submitBtn").style.display = "none";
      progressBar.style.width = "100%";
      progressText.textContent = "";
      updateSummary();
      return;
    }
  }

  const randomIndex = Math.floor(Math.random() * remainingWords.length);
  currentWord = remainingWords[randomIndex];

  document.getElementById("quizTerm").textContent = currentWord.term;
  answerInput.value = "";
  document.getElementById("feedback").textContent = "";

  updateProgressBar();

  if (multipleChoiceCheckbox.checked) setupMultipleChoice();
  else {
    optionsContainer.style.display = "none";
    answerInput.style.display = "block";
    document.getElementById("submitBtn").style.display = "inline-block";
  }
}

// ===== Submit Answer =====
function submitAnswer(selected = null) {
  let answer = selected || answerInput.value.trim();
  const correct = currentWord.def.trim();
  const feedback = document.getElementById("feedback");
  const retryLater = retryLaterCheckbox.checked;

  wordStats[currentWeek][currentWord.term].attempts++;

  if (answer.toLowerCase() === correct.toLowerCase()) {
    if (!testMode) feedback.textContent = "Correct!";
    if (!testMode) feedback.style.color = "green";
    remainingWords = remainingWords.filter(w => w.term !== currentWord.term);
  } else {
    if (!testMode) {
      feedback.textContent = retryLater ? `Wrong! Correct: ${currentWord.def} (Will retry later)` : "Wrong! Try again.";
      feedback.style.color = "red";
    }
    if (retryLater && !testMode) {
      if (!incorrectWords.includes(currentWord)) incorrectWords.push(currentWord);
      remainingWords = remainingWords.filter(w => w.term !== currentWord.term);
    }
  }

  if (!testMode || answer.toLowerCase() === correct.toLowerCase()) {
    showNextWord();
  }
}

// ===== Multiple Choice =====
function setupMultipleChoice() {
  optionsContainer.innerHTML = "";
  optionsContainer.style.display = "block";
  answerInput.style.display = "none";
  document.getElementById("submitBtn").style.display = "none";

  const allDefs = vocabByWeek[currentWeek].map(w => w.def);
  const choices = [currentWord.def];

  while (choices.length < 4 && choices.length < allDefs.length) {
    const randomDef = allDefs[Math.floor(Math.random() * allDefs.length)];
    if (!choices.includes(randomDef)) choices.push(randomDef);
  }

  shuffleArray(choices);

  choices.forEach(def => {
    const btn = document.createElement("button");
    btn.textContent = def;
    btn.onclick = () => submitAnswer(def);
    optionsContainer.appendChild(btn);
  });
}

// ===== Shuffle Helper =====
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// ===== Weeks List =====
function updateWeeksList() {
  weeksList.innerHTML = "";
  for (let week in vocabByWeek) {
    const li = document.createElement("li");
    li.textContent = week + " ";
    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.style.marginLeft = "10px";
    delBtn.onclick = () => deleteWeek(week);
    li.appendChild(delBtn);
    weeksList.appendChild(li);
  }
}

function deleteWeek(week) {
  if (!confirm(`Delete week "${week}"? This cannot be undone.`)) return;
  delete vocabByWeek[week];
  saveData();
  updateWeekDropdown();
  updateWeeksList();
}

// ===== Progress Bar =====
function updateProgressBar() {
  const total = remainingWords.length + incorrectWords.length;
  const completed = vocabByWeek[currentWeek].length - remainingWords.length;
  const percent = (completed / vocabByWeek[currentWeek].length) * 100;
  progressBar.style.width = percent + "%";
  progressText.textContent = `Progress: ${completed}/${vocabByWeek[currentWeek].length}`;
}

// ===== Summary =====
function updateSummary() {
  if (!currentWeek || !wordStats[currentWeek]) return;

  const stats = wordStats[currentWeek];
  const total = Object.keys(stats).length;
  const correctFirst = Object.values(stats).filter(s => s.correctFirstTry).length;
  const missed = total - correctFirst;

  document.getElementById("totalWords").textContent = total;
  document.getElementById("correctFirstTry").textContent = correctFirst;
  document.getElementById("missedWords").textContent = missed;

  const missedList = document.getElementById("missedWordsList");
  missedList.innerHTML = "";
  for (let term in stats) {
    if (!stats[term].correctFirstTry) {
      const li = document.createElement("li");
      li.textContent = `${term} (Attempts: ${stats[term].attempts})`;
      missedList.appendChild(li);
    }
  }
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

// ===== Test Mode Results =====
function showTestResults() {
  const total = vocabByWeek[currentWeek].length;
  const correct = Object.values(wordStats[currentWeek]).filter(s => s.correctFirstTry).length;
  alert(`Test Completed! Score: ${correct}/${total} (${Math.round((correct/total)*100)}%)`);
}

// ===== Enter Key Submit =====
answerInput.addEventListener("keydown", function(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    submitAnswer();
  }
});
