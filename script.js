let vocabByWeek = JSON.parse(localStorage.getItem("vocabByWeek")) || {};
let wordStats = {};
let currentWeek = null;
let remainingWords = [];
let currentWord = null;
let incorrectWords = [];
let testMode = false;
let attemptedWords = 0;

// Elements
const weekSelect = document.getElementById("weekSelect");
const optionsContainer = document.getElementById("optionsContainer");
const multipleChoiceCheckbox = document.getElementById("multipleChoice");
const retryLaterCheckbox = document.getElementById("retryLater");
const testModeCheckbox = document.getElementById("testMode");
const weeksList = document.getElementById("weeksList");
const answerInput = document.getElementById("answerInput");
const feedback = document.getElementById("feedback");
const progressBar = document.getElementById("progressBar");

// Populate dropdown & week list
function updateWeekDropdown() {
  weekSelect.innerHTML = "";
  for (let week in vocabByWeek) {
    const option = document.createElement("option");
    option.value = week;
    option.textContent = week;
    weekSelect.appendChild(option);
  }
}

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

// Save/load
function saveData() {
  localStorage.setItem("vocabByWeek", JSON.stringify(vocabByWeek));
}

// Add words
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

// Start Quiz
function startQuiz() {
  currentWeek = weekSelect.value;
  if (!currentWeek) {
    alert("Please select a week to start the quiz.");
    return;
  }
  if (!vocabByWeek[currentWeek] || vocabByWeek[currentWeek].length === 0) {
    alert("No words in this week. Please add words first.");
    return;
  }

  remainingWords = [...vocabByWeek[currentWeek]];
  incorrectWords = [];
  attemptedWords = 0;
  testMode = testModeCheckbox.checked;

  if (!wordStats[currentWeek]) wordStats[currentWeek] = {};
  remainingWords.forEach(w => {
    if (!wordStats[currentWeek][w.term]) {
      wordStats[currentWeek][w.term] = { attempts: 0, correctFirstTry: true, firstAnswerRecorded: false };
    }
  });

  feedback.textContent = "";
  showNextWord();
}

// Show next word
function showNextWord() {
  if (remainingWords.length === 0) {
    endQuiz();
    return;
  }

  const randomIndex = Math.floor(Math.random() * remainingWords.length);
  currentWord = remainingWords[randomIndex];

  document.getElementById("quizTerm").textContent = currentWord.term;
  answerInput.value = "";
  feedback.textContent = "";
  answerInput.style.display = multipleChoiceCheckbox.checked ? "none" : "block";
  document.getElementById("submitBtn").style.display = multipleChoiceCheckbox.checked ? "none" : "inline-block";

  if (multipleChoiceCheckbox.checked) setupMultipleChoice();

  updateProgressBar();
}

// Submit answer
function submitAnswer(selected = null) {
  if (!currentWord) return;

  let answer = selected || answerInput.value.trim();
  if (!answer) return;

  const correct = currentWord.def.trim();
  const retryLater = retryLaterCheckbox.checked;
  const stats = wordStats[currentWeek][currentWord.term];

  stats.attempts++;
  if (!stats.firstAnswerRecorded) {
    stats.firstAnswerRecorded = true;
    stats.correctFirstTry = answer.toLowerCase() === correct.toLowerCase();
  }

  attemptedWords++;

  if (!testMode) {
    if (answer.toLowerCase() === correct.toLowerCase()) {
      feedback.textContent = "Correct!";
      feedback.style.color = "green";
    } else {
      feedback.textContent = retryLater
        ? `Wrong! Correct: ${correct} (Will retry later)`
        : "Wrong! Try again.";
      feedback.style.color = "red";

      if (retryLater && !incorrectWords.includes(currentWord)) {
        incorrectWords.push(currentWord);
      }
    }
  }

  remainingWords = remainingWords.filter(w => w.term !== currentWord.term);
  setTimeout(showNextWord, 400);

  updateProgressBar();
}

// Multiple choice
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

// Shuffle
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Update progress bar
function updateProgressBar() {
  const total = vocabByWeek[currentWeek]?.length || 1;
  const percent = Math.floor((attemptedWords / total) * 100);
  progressBar.style.width = percent + "%";
}

// End quiz
function endQuiz() {
  const stats = wordStats[currentWeek];
  const total = Object.keys(stats).length;
  const correct = Object.values(stats).filter(s => s.correctFirstTry).length;

  if (testMode) {
    alert(`Test finished! Your grade: ${Math.floor((correct / total) * 100)}%`);
  } else {
    document.getElementById("quizTerm").textContent = "🎉 Quiz Complete!";
    feedback.textContent = "";
  }

  remainingWords = [];
  currentWord = null;
  attemptedWords = 0;
  updateProgressBar();
}

// Enter key
answerInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    submitAnswer();
  }
});

// Page load
document.addEventListener("DOMContentLoaded", () => {
  updateWeekDropdown();
  updateWeeksList();
  if (localStorage.getItem("darkMode") === "on") document.body.classList.add("dark-mode");
});
