import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA50ENd9--9PSQ9BUe4_j4rsN6UNWb5ybE",
  authDomain: "vocabtrainer-f193a.firebaseapp.com",
  projectId: "vocabtrainer-f193a",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DATA_DOC = doc(db, "vocab", "shared");

let quizWords = [];
let index = 0;
let correct = 0;
let retry = [];
let firstTry = true;

window.showTab = id => {
  document.querySelectorAll(".tabContent").forEach(t => t.style.display="none");
  document.getElementById(id).style.display="block";
};

window.toggleDarkMode = () => document.body.classList.toggle("dark-mode");

async function loadWeeks() {
  const snap = await getDoc(DATA_DOC);
  const weeks = snap.exists() ? Object.keys(snap.data()) : [];

  ["weekSelect","manageWeekSelect"].forEach(id=>{
    const sel = document.getElementById(id);
    sel.innerHTML="";
    weeks.forEach(w=>{
      const o=document.createElement("option");
      o.value=w; o.textContent=w;
      sel.appendChild(o);
    });
  });
}

loadWeeks();

window.addBulkWords = async () => {
  const week = weekInput.value.trim();
  const lines = bulkInput.value.trim().split("\n");

  if(!week || !lines.length) return alert("Missing data");

  const words = lines.map(l=>{
    const [t,d]=l.split(" - ");
    return {term:t?.trim(), definition:d?.trim()};
  }).filter(w=>w.term && w.definition);

  const snap = await getDoc(DATA_DOC);
  const data = snap.exists()? snap.data() : {};
  data[week]=words;

  await setDoc(DATA_DOC,data);
  loadWeeks();
  alert("Saved");
};

window.deleteWeek = async ()=>{
  const week = manageWeekSelect.value;
  if(!week) return;

  const snap = await getDoc(DATA_DOC);
  const data = snap.data();
  delete data[week];

  await setDoc(DATA_DOC,data);
  loadWeeks();
};

window.startQuiz = async ()=>{
  const week = weekSelect.value;
  const snap = await getDoc(DATA_DOC);
  quizWords = snap.data()[week].slice();
  index=0; correct=0; retry=[];
  nextWord();
};

function nextWord(){
  if(index>=quizWords.length){
    if(retry.length){
      quizWords=retry.slice(); retry=[]; index=0;
    } else return endQuiz();
  }

  quizTerm.textContent = quizWords[index].term;
  answerInput.value="";
  optionsContainer.innerHTML="";
  firstTry=true;

  if(multipleChoice.checked){
    const defs=[quizWords[index].definition];
    while(defs.length<4){
      const r=quizWords[Math.floor(Math.random()*quizWords.length)].definition;
      if(!defs.includes(r)) defs.push(r);
    }
    defs.sort(()=>Math.random()-0.5);
    defs.forEach(d=>{
      const b=document.createElement("button");
      b.textContent=d;
      b.onclick=()=>submitAnswer(d);
      optionsContainer.appendChild(b);
    });
  }
}

window.submitAnswer = (choice=null)=>{
  const ans = choice ?? answerInput.value.trim();
  if(!ans) return;

  if(ans.toLowerCase()===quizWords[index].definition.toLowerCase()){
    correct++;
  } else if(retryLater.checked){
    retry.push(quizWords[index]);
  }

  index++;
  progressBar.style.width = `${(index/quizWords.length)*100}%`;
  nextWord();
};

function endQuiz(){
  feedback.textContent = `Done! Score: ${Math.round((correct/quizWords.length)*100)}%`;
}
