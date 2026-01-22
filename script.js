/* =====================
   GLOBAL DATA
===================== */
let vocabByWeek = JSON.parse(localStorage.getItem("vocabByWeek")) || {};
let currentWeek = null;
let quizWords = [];
let currentIndex = 0;
let firstTryCorrect = 0;
let retryLaterWords = [];
let firstAnswer = true;

/* =====================
   TAB SYSTEM (FIXED)
===================== */
window.showTab = function(tabId) {
  document.querySelectorAll(".tabContent").forEach(tab => {
    tab.style.display = "none";
  });
  document.getElementById(tabId).style.display = "block";
};

/* =====================
   DARK MODE
===================== */
window.toggleDarkMode = function() {
  document.body.classList.toggle("dark-mode");
};

/* =====================
   LOAD WEEK DROPDOWNS
===================== */
function refreshWeekSelects() {
  const weekSelect = document.getElementById("weekSelect");
  const manageWeekSelect = document.getElementById("manageWeekSelect");

  weekSelect.innerHTML = "";
  manageWeekSelect.innerHTML = "";

  Object.keys(vocabByWeek).forEach(week => {
    const opt1 = document.createElement("option");
    opt1.value = week;
    opt1.textContent = week;
    weekSelect.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = week;
    opt2.textContent = week;
    manageWeekSelect.appendChild(opt2);
  });
}

refreshWeekSelects();

/* =====================
   ADD / UPDATE WORDS
===================== */
window.addBulkWords = function() {
  const week = document.getElementById("weekInput").value.trim();
  const bulk = document.getElementById("bulkInput").value.trim();
  if (!week || !bulk) return alert("Fill everything out");

  const words = bulk.split("\n").map(line => {
    const parts = line.split(" - ");
    if (parts.length !== 2) return null;
    return { term: parts[0].trim(), definition: parts[1].trim() };
  }).filter(Boolean);

  vocabByWeek[week] = words;
  localStorage.setItem("vocabByWeek", JSON.stringify(vocabByWeek));

  document.getElementById("weekInput").value = "";
  document.getElementById("bulkInput").value = "";

  refreshWeekSelects();
  alert(`Saved ${words.length} words to ${week}`);
};

/* =====================
   DELETE WEEK
===================== */
window.deleteWeek = function() {
  const week = document.getElementById("manageWeekSelect").value;
  if (!week) return;
  if (!confirm(`Delete ${week}?`)) return;

  delete vocabByWeek[week];
  localStorage.setItem("vocabByWeek", JSON.stringify(vocabByWeek));
  refreshWeekSelects();
};

/* =====================
   START QUIZ
===================== */
window.startQuiz = function() {
  const week = document.getElementById("weekSelect").value;
  if (!week) return alert("Select a week");

  currentWeek = week;
  quizWords = [...vocabByWeek[week]];
  currentIndex = 0;
  firstTryCorrect = 0;
  retryLaterWords = [];
  firstAnswer = true;

  document.getElementById("progressBar").style.width = "0%";
  showNextWord();
};

/* =====================
   SHOW WORD
===================== */
function showNextWord() {
  if (currentIndex >= quizWords.length) {
    if (retryLaterWords.length && document.getElementById("retryLater").checked) {
      quizWords = [...retryLaterWords];
      retryLaterWords = [];
      currentIndex = 0;
    } else {
      endQuiz();
      return;
    }
  }

  const word = quizWords[currentIndex];
  document.getElementById("quizTerm").textContent = word.term;
  document.getElementById("answerInput").value = "";
  document.getElementById("feedback").textContent = "";
  firstAnswer = true;

  const options = document.getElementById("optionsContainer");
  options.innerHTML = "";

  if (document.getElementById("multipleChoice").checked) {
    options.style.display = "block";
    const defs = [word.definition];

    while (defs.length < 4) {
      const rand =
        quizWords[Math.floor(Math.random() * quizWords.length)].definition;
      if (!defs.includes(rand)) defs.push(rand);
    }

    defs.sort(() => Math.random() - 0.5);

    defs.forEach(def => {
      const btn = document.createElement("button");
      btn.textContent = def;
      btn.onclick = () => submitAnswer(def);
      options.appendChild(btn);
    });
  } else {
    options.style.display = "none";
  }
}

/* =====================
   SUBMIT ANSWER
===================== */
window.submitAnswer = function(choice = null) {
  const word = quizWords[currentIndex];
  const answer =
    choice ?? document.getElementById("answerInput").value.trim();

  if (!answer) return;

  const correct = answer.toLowerCase() === word.definition.toLowerCase();
  const testMode = document.getElementById("testMode").checked;
  const retryLater = document.getElementById("retryLater").checked;

  if (firstAnswer) {
    if (correct) firstTryCorrect++;
    else if (retryLater || testMode) retryLaterWords.push(word);
    else {
      document.getElementById("feedback").textContent = "Try again";
      return;
    }
    firstAnswer = false;
  }

  currentIndex++;
  updateProgress();
  showNextWord();
};

/* =====================
   PROGRESS BAR
===================== */
function updateProgress() {
  const total = quizWords.length;
  const percent = Math.min(100, (currentIndex / total) * 100);
  document.getElementById("progressBar").style.width = percent + "%";
}

/* =====================
   END QUIZ
===================== */
function endQuiz() {
  const testMode = document.getElementById("testMode").checked;
  let msg = "🎉 Quiz Complete!";

  if (testMode) {
    const score = Math.round((firstTryCorrect / quizWords.length) * 100);
    msg = `🎉 Test Complete! Score: ${score}%`;
  }

  document.getElementById("feedback").textContent = msg;
  document.getElementById("quizTerm").textContent = "";
  document.getElementById("optionsContainer").innerHTML = "";
}
