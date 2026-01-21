/**********************
  GLOBAL STATE
**********************/
let vocabData = JSON.parse(localStorage.getItem("vocabData")) || {};
let quizWords = [];
let currentIndex = 0;
let firstTryCorrect = 0;
let totalQuizWords = 0;
let retryQueue = [];
let answeredThisQuestion = false;

/**********************
  TAB SYSTEM
**********************/
function showTab(tabId) {
  document.querySelectorAll(".tabContent").forEach(tab => {
    tab.style.display = "none";
  });
  document.getElementById(tabId).style.display = "block";

  if (tabId === "quizTab") loadWeeks();
  if (tabId === "settingsTab") renderManageWeeks();
}

/**********************
  DARK MODE
**********************/
function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
}

/**********************
  SAVE / LOAD
**********************/
function saveData() {
  localStorage.setItem("vocabData", JSON.stringify(vocabData));
}

/**********************
  ADD WORDS
**********************/
function addBulkWords() {
  const week = document.getElementById("weekInput").value.trim();
  const bulk = document.getElementById("bulkInput").value.trim();

  if (!week || !bulk) return alert("Enter a week and words.");

  if (!vocabData[week]) vocabData[week] = [];

  bulk.split("\n").forEach(line => {
    const parts = line.split("-");
    if (parts.length >= 2) {
      vocabData[week].push({
        term: parts[0].trim(),
        def: parts.slice(1).join("-").trim()
      });
    }
  });

  saveData();
  document.getElementById("bulkInput").value = "";
  loadWeeks();
  alert("Words added!");
}

/**********************
  LOAD WEEKS
**********************/
function loadWeeks() {
  const select = document.getElementById("weekSelect");
  select.innerHTML = "";

  Object.keys(vocabData).forEach(week => {
    const opt = document.createElement("option");
    opt.value = week;
    opt.textContent = week;
    select.appendChild(opt);
  });
}

/**********************
  START QUIZ
**********************/
function startQuiz() {
  const week = document.getElementById("weekSelect").value;
  if (!vocabData[week] || vocabData[week].length === 0) {
    return alert("No words in this week.");
  }

  quizWords = [...vocabData[week]];
  currentIndex = 0;
  firstTryCorrect = 0;
  retryQueue = [];
  totalQuizWords = quizWords.length;

  nextQuestion();
}

/**********************
  NEXT QUESTION
**********************/
function nextQuestion() {
  answeredThisQuestion = false;

  if (currentIndex >= quizWords.length) {
    if (retryQueue.length > 0) {
      quizWords = retryQueue;
      retryQueue = [];
      currentIndex = 0;
    } else {
      endQuiz();
      return;
    }
  }

  const q = quizWords[currentIndex];
  document.getElementById("quizTerm").textContent = q.term;
  document.getElementById("answerInput").value = "";
  document.getElementById("feedback").textContent = "";

  renderOptions(q);
  updateProgress();
}

/**********************
  MULTIPLE CHOICE
**********************/
function renderOptions(q) {
  const mc = document.getElementById("multipleChoice").checked;
  const container = document.getElementById("optionsContainer");
  container.innerHTML = "";

  if (!mc) {
    container.style.display = "none";
    return;
  }

  container.style.display = "block";

  let choices = [q.def];
  const allDefs = Object.values(vocabData).flat().map(w => w.def);

  while (choices.length < 4 && allDefs.length > choices.length) {
    const rand = allDefs[Math.floor(Math.random() * allDefs.length)];
    if (!choices.includes(rand)) choices.push(rand);
  }

  choices.sort(() => Math.random() - 0.5);

  choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.textContent = choice;
    btn.onclick = () => checkAnswer(choice);
    container.appendChild(btn);
  });
}

/**********************
  SUBMIT ANSWER
**********************/
function submitAnswer() {
  const val = document.getElementById("answerInput").value.trim();
  if (!val) return;
  checkAnswer(val);
}

/**********************
  CHECK ANSWER
**********************/
function checkAnswer(answer) {
  if (answeredThisQuestion) return;

  const q = quizWords[currentIndex];
  const retryLater = document.getElementById("retryLater").checked;
  const testMode = document.getElementById("testMode").checked;

  answeredThisQuestion = true;

  if (answer.toLowerCase() === q.def.toLowerCase()) {
    document.getElementById("feedback").textContent = "✅ Correct!";
    firstTryCorrect++;
    currentIndex++;
    setTimeout(nextQuestion, 600);
  } else {
    document.getElementById("feedback").textContent = `❌ Correct answer: ${q.def}`;

    if (retryLater || testMode) {
      retryQueue.push(q);
      currentIndex++;
      setTimeout(nextQuestion, 900);
    } else {
      answeredThisQuestion = false; // allow retry same question
    }
  }
}

/**********************
  PROGRESS
**********************/
function updateProgress() {
  const percent = Math.round((currentIndex / totalQuizWords) * 100);
  document.getElementById("progressBar").style.width = percent + "%";
  document.getElementById("progress").textContent =
    `${currentIndex} / ${totalQuizWords}`;
}

/**********************
  END QUIZ
**********************/
function endQuiz() {
  const testMode = document.getElementById("testMode").checked;
  let message = "🎉 Quiz Complete!";

  if (testMode) {
    const score = Math.round((firstTryCorrect / totalQuizWords) * 100);
    message = `🎉 Test Complete! Score: ${score}%`;
  }

  document.getElementById("feedback").textContent = message;
  document.getElementById("quizTerm").textContent = "";
  document.getElementById("optionsContainer").style.display = "none";
  document.getElementById("progressBar").style.width = "100%";
}

/**********************
  MANAGE WEEKS (SETTINGS)
**********************/
function renderManageWeeks() {
  const list = document.getElementById("manageWeeksList");
  if (!list) return;

  list.innerHTML = "";

  Object.keys(vocabData).forEach(week => {
    const li = document.createElement("li");
    li.textContent = `${week} (${vocabData[week].length} words)`;

    const del = document.createElement("button");
    del.textContent = "Delete";
    del.style.marginLeft = "10px";
    del.onclick = () => {
      if (confirm(`Delete ${week}?`)) {
        delete vocabData[week];
        saveData();
        loadWeeks();
        renderManageWeeks();
      }
    };

    li.appendChild(del);
    list.appendChild(li);
  });
}

/**********************
  INIT
**********************/
showTab("quizTab");
loadWeeks();
