// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA50ENd9--9PSQ9BUe4_j4rsN6UNWb5ybE",
  authDomain: "vocabtrainer-f193a.firebaseapp.com",
  projectId: "vocabtrainer-f193a",
  storageBucket: "vocabtrainer-f193a.appspot.com",
  messagingSenderId: "540382279011",
  appId: "1:540382279011:web:566a19d642815b60f98f56"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

// Globals
let currentUser = null;
let quizWords = [];
let currentIndex = 0;
let firstTryCorrect = 0;
let missedWords = [];
let retryLaterWords = [];
let firstAnswer = true;
let currentWeek = null;

// Show tab
window.showTab = id => {
  document.querySelectorAll(".tabContent").forEach(tab=>tab.style.display="none");
  document.getElementById(id).style.display="block";
};

// Dark mode
window.toggleDarkMode = ()=>document.body.classList.toggle("dark-mode");

// Signup
window.signupUser = async ()=>{
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();
  const msg = document.getElementById("signupMessage");
  try{
    const userCred = await createUserWithEmailAndPassword(auth,email,password);
    currentUser = userCred.user;
    await setDoc(doc(db,"users",currentUser.uid),{weeks:{}});
    msg.textContent="Signup successful!";
    showTab("settingsTab");
    loadWeeks();
    loadManageWeeks();
  }catch(err){msg.textContent=err.message;}
};

// Login
window.loginUser = async ()=>{
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const msg = document.getElementById("loginMessage");
  try{
    const userCred = await signInWithEmailAndPassword(auth,email,password);
    currentUser = userCred.user;
    msg.textContent="Login successful!";
    showTab("quizTab");
    loadWeeks();
    loadManageWeeks();
  }catch(err){msg.textContent=err.message;}
};

// Logout
window.logoutUser = ()=>{
  signOut(auth);
  currentUser=null;
  quizWords=[];
  currentIndex=0;
  showTab("settingsTab");
};

// Load weeks for quiz
async function loadWeeks(){
  if(!currentUser) return;
  const docSnap = await getDoc(doc(db,"users",currentUser.uid));
  const weekSelect = document.getElementById("weekSelect");
  weekSelect.innerHTML="";
  if(docSnap.exists()){
    const data = docSnap.data();
    const weeks = Object.keys(data.weeks||{});
    weeks.forEach(w=>{
      const option = document.createElement("option");
      option.value=w; option.textContent=w;
      weekSelect.appendChild(option);
    });
  }
}

// Load weeks for Manage Weeks
async function loadManageWeeks(){
  if(!currentUser) return;
  const docSnap = await getDoc(doc(db,"users",currentUser.uid));
  const sel = document.getElementById("manageWeekSelect");
  sel.innerHTML="";
  if(docSnap.exists()){
    const data = docSnap.data();
    const weeks = Object.keys(data.weeks||{});
    weeks.forEach(w=>{
      const option = document.createElement("option");
      option.value=w; option.textContent=w;
      sel.appendChild(option);
    });
  }
}

// Add / update words
window.addBulkWords = async ()=>{
  if(!currentUser) return alert("Login first!");
  const week = document.getElementById("weekInput").value.trim();
  const bulkText = document.getElementById("bulkInput").value.trim();
  if(!week || !bulkText) return alert("Enter week and words");

  const words = bulkText.split("\n").map(line=>{
    const [term, def] = line.split(" - ");
    return { term: term?.trim(), definition: def?.trim() };
  }).filter(w=>w.term && w.definition);

  const docRef = doc(db,"users",currentUser.uid);
  const docSnap = await getDoc(docRef);
  const data = docSnap.exists()? docSnap.data() : {};
  data.weeks = data.weeks||{};
  data.weeks[week]=words;

  await setDoc(docRef,data);
  alert(`Added ${words.length} words to ${week}`);
  document.getElementById("weekInput").value="";
  document.getElementById("bulkInput").value="";
  loadWeeks();
  loadManageWeeks();
};

// Delete week
window.deleteWeek = async ()=>{
  if(!currentUser) return alert("Login first!");
  const week = document.getElementById("manageWeekSelect").value;
  if(!week) return alert("Select a week to delete");

  const docRef = doc(db,"users",currentUser.uid);
  const docSnap = await getDoc(docRef);
  if(docSnap.exists()){
    const data = docSnap.data();
    delete data.weeks[week];
    await setDoc(docRef,data);
    alert(`Deleted ${week}`);
    loadWeeks();
    loadManageWeeks();
  }
};

// Quiz logic
window.startQuiz = async ()=>{
  if(!currentUser) return alert("Login first!");
  const week = document.getElementById("weekSelect").value;
  if(!week) return alert("Select a week!");
  currentWeek=week;

  const docSnap = await getDoc(doc(db,"users",currentUser.uid));
  quizWords=docSnap.data().weeks[week].slice();
  currentIndex=0; firstTryCorrect=0; missedWords=[]; retryLaterWords=[]; firstAnswer=true;

  document.getElementById("quizTerm").textContent="";
  document.getElementById("feedback").textContent="";
  document.getElementById("answerInput").value="";
  document.getElementById("optionsContainer").style.display="none";
  document.getElementById("progressBar").style.width="0%";

  showNextWord();
};

function showNextWord(){
  if(quizWords.length===0) return endQuiz();
  if(currentIndex>=quizWords.length){
    if(retryLaterWords.length && document.getElementById("retryLater").checked){
      quizWords=retryLaterWords.slice();
      retryLaterWords=[];
      currentIndex=0;
    }else return endQuiz();
  }

  const word = quizWords[currentIndex];
  document.getElementById("quizTerm").textContent=word.term;
  document.getElementById("answerInput").value="";
  document.getElementById("feedback").textContent="";
  firstAnswer=true;

  if(document.getElementById("multipleChoice").checked){
    const optionsContainer=document.getElementById("optionsContainer");
    optionsContainer.innerHTML="";
    const defs=[word.definition];
    while(defs.length<4){
      const rand=quizWords[Math.floor(Math.random()*quizWords.length)].definition;
      if(!defs.includes(rand)) defs.push(rand);
    }
    defs.sort(()=>Math.random()-0.5);
    defs.forEach(def=>{
      const btn=document.createElement("button");
      btn.textContent=def;
      btn.onclick=()=>submitAnswer(def);
      optionsContainer.appendChild(btn);
    });
    optionsContainer.style.display="block";
  }else document.getElementById("optionsContainer").style.display="none";
}

window.submitAnswer = function(selectedDef=null){
  const word = quizWords[currentIndex];
  const userAnswer = selectedDef?? document.getElementById("answerInput").value.trim();
  const feedback=document.getElementById("feedback");
  const testMode=document.getElementById("testMode").checked;
  const retryLater=document.getElementById("retryLater").checked;

  if(!userAnswer) return;

  if(firstAnswer){
    if(!testMode && !retryLater){
      if(userAnswer.toLowerCase()===word.definition.toLowerCase()){
        firstTryCorrect++; feedback.textContent="Correct!";
      }else{
        feedback.textContent="Incorrect, try again.";
        return;
      }
    }else{
      if(userAnswer.toLowerCase()===word.definition.toLowerCase()) firstTryCorrect++;
      else if(retryLater) retryLaterWords.push(word);
    }
    firstAnswer=false;
  }else{
    if(!testMode && !retryLater){
      if(userAnswer.toLowerCase()===word.definition.toLowerCase()) firstTryCorrect++;
      else return;
    }
  }

  currentIndex++;
  updateProgress();
  showNextWord();
};

function updateProgress(){
  const total = quizWords.length + retryLaterWords.length;
  const progress = Math.min(1,currentIndex/total)*100;
  document.getElementById("progressBar").style.width=progress+"%";
  document.getElementById("progress").textContent=`Progress: ${currentIndex} / ${total}`;
}

function endQuiz(){
  const testMode = document.getElementById("testMode").checked;
  let message="🎉 Quiz Complete!";
  if(testMode){
    const totalWords = quizWords.length + retryLaterWords.length;
    const score = Math.round((firstTryCorrect / totalWords)*100);
    message=`🎉 Test Complete! Your score: ${score}%`;
  }
  document.getElementById("feedback").textContent=message;
  document.getElementById("quizTerm").textContent="";
  document.getElementById("optionsContainer").style.display="none";
  document.getElementById("answerInput").value="";
  document.getElementById("progressBar").style.width="100%";
}
