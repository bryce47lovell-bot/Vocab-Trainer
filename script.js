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
const weeksList = document.getElementById("weeksList");
const answerInput = document.getElementById("answerInput");
const testModeCheckbox = document.getElementById("testModeCheckbox");
const progressBar = document.getElementById("progressBar");

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
  document.querySelectorAll('.tabContent').forEach(tab => tab.style.display = 'none');
  document.getElementById(tabId).style.display = 'block';
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
  if (!currentWeek || vocabByWeek[currentWeek].length === 0) {
    alert("No words in this week");
    return;
  }

  remainingWords = [...vocabByWeek[currentWeek]];
  incorrectWords = [];
  testMode = testModeCheckbox.checked;

  if (!wordStats[currentWeek]) wordStats[currentWeek] = {};
  remainingWords.forEach(w => {
    if (!wordStats[currentWeek][w.term]) {
      wordStats[currentWeek][w.term] = { attempts: 0, correctFirstTry: true, userAnswer: "" };
    }
  });

  showNextWord();
}

// ===== Show Next Word =====
function showNextWord() {
  if (remainingWords.length === 0) {
    if (testMode) {
      showTestResults();
      return;
    }
    if (retryLaterCheckbox.checked && incorrectWords.length > 0) {
      remainingWords = [...incorrectWords];
      incorrectWords = [];
      showNextWord();
      return;
    } else {
      document.getElementById("quizTerm").textContent = "🎉 You got all words correct!";
      optionsContainer.style.display = "none";
      answerInput.style.display = "none";
      document.getElementById("submitBtn").style.display = "none";
      document.getElementById("progress").textContent = "";
      updateSummary();
      updateProgressBar();
      return;
    }
  }

  const randomIndex = Math.floor(Math.random() * remainingWords.length);
  currentWord = remainingWords[randomIndex];

  document.getElementById("quizTerm").textContent = currentWord.term;
  answerInput.value = "";
  document.getElementById("feedback").textContent = "";

  if (multipleChoiceCheckbox.checked) setupMultipleChoice();
  else {
    optionsContainer.style.display = "none";
    answerInput.style.display = "block";
    document.getElementById("submitBtn").style.display = "inline-block";
  }

  updateProgressBar();
}

// ===== Submit Answer =====
function submitAnswer(selected = null) {
  let answer = selected || answerInput.value.trim();
  wordStats[currentWeek][currentWord.term].attempts++;
  wordStats[currentWeek][currentWord.term].userAnswer = answer;

  if (testMode) {
    // Test mode: record answer, remove word, go next
    remainingWords = remainingWords.filter(w => w.term !== currentWord.term);
    showNextWord();
    return; // skip correctness check
  }

  const correct = currentWord.def.trim();
  const feedback = document.getElementById("feedback");
  const retryLater = retryLaterCheckbox.checked;

  if (answer.toLowerCase() === correct.toLowerCase()) {
    feedback.textContent = "Correct!";
    feedback.style.color = "green";
    remainingWords = remainingWords.filter(w => w.term !== currentWord.term);
    setTimeout(showNextWord, 800);
  } else {
    feedback.style.color = "red";
    if (retryLater) {
      if (!incorrectWords.includes(currentWord)) incorrectWords.push(currentWord);
      remainingWords = remainingWords.filter(w => w.term !== currentWord.term);
      feedback.textContent = `Wrong! Correct: ${currentWord.def} (Will retry later)`;
      setTimeout(showNextWord, 1200);
    } else {
      feedback.textContent = "Wrong! Try again.";
    }
  }

  updateSummary();
  updateProgressBar();
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
    btn.onclick = () => submitAnswer(def); // testMode is handled inside submitAnswer
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
      li.textContent = `${term} (Attempts: ${stats[term].attempts}, Your Answer: ${stats[term].userAnswer})`;
      missedList.appendChild(li);
    }
  }
}

// ===== Review Missed =====
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
  showTab('quizTab');
}

// ===== Progress Bar =====
function updateProgressBar() {
  if (!currentWeek || !wordStats[currentWeek]) return;
  const total = Object.keys(wordStats[currentWeek]).length;
  const completed = total - remainingWords.length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  progressBar.style.width = percent + "%";
}

// ===== Test Results =====
function showTestResults() {
  let total = Object.keys(wordStats[currentWeek]).length;
  let correctCount = 0;

  for (let term in wordStats[currentWeek]) {
    const entry = wordStats[currentWeek][term];
    const correctAnswer = vocabByWeek[currentWeek].find(w => w.term === term).def;
    if (entry.userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
      correctCount++;
      entry.correctFirstTry = true;
    } else {
      entry.correctFirstTry = false;
    }
  }

  document.getElementById("quizTerm").textContent = `Test Complete! Score: ${correctCount} / ${total}`;
  optionsContainer.style.display = "none";
  answerInput.style.display = "none";
  document.getElementById("submitBtn").style.display = "none";
  document.getElementById("progress").textContent = "";

  updateSummary();
  updateProgressBar();
}

// ===== Enter Key Submit =====
answerInput.addEventListener("keydown", function(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    submitAnswer();
  }
});
