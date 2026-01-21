// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteField } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA50ENd9--9PSQ9BUe4_j4rsN6UNWb5ybE",
  authDomain: "vocabtrainer-f193a.firebaseapp.com",
  projectId: "vocabtrainer-f193a",
  storageBucket: "vocabtrainer-f193a.appspot.com",
  messagingSenderId: "540382279011",
  appId: "1:540382279011:web:566a19d642815b60f98f56"
};

// Init
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

// Quiz state
let currentUser = null;
let currentWeek = null;
let quizWords = [];
let currentIndex = 0;
let firstTryCorrect = 0;
let retryLaterWords = [];
let firstAnswer = true;

// Show tab
window.showTab = function(id){
  document.querySelectorAll(".tabContent").forEach(tab=>tab.style.display="none");
  document.getElementById(id).style.display="block";
};

// Dark mode
window.toggleDarkMode = function(){
  document.body.classList.toggle("dark-mode");
};

// Settings panel toggle
window.toggleSettings = function(){
  const tab = document.getElementById("settingsTab");
  tab.style.display = tab.style.display==="block"?"none":"block";
  if(currentUser) loadManageWeeks();
};

// Signup
window.signupUser = async function(){
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;
  const msg = document.getElementById("signupMessage");
  try {
    const userCredential = await createUserWithEmailAndPassword(auth,email,password);
    currentUser = userCredential.user;
    await setDoc(doc(db,"users",currentUser.uid),{weeks:{}});
    msg.textContent="Signup successful! You can now login.";
  } catch(e){
    msg.textContent=e.message;
  }
};

// Login
window.loginUser = async function(){
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  const msg = document.getElementById("loginMessage");
  try{
    const userCredential = await signInWithEmailAndPassword(auth,email,password);
    currentUser = userCredential.user;
    msg.textContent="Login successful!";
    showTab("quizTab");
    loadWeeks();
  } catch(e){
    msg.textContent=e.message;
  }
};

// Logout
window.logoutUser = function(){
  signOut(auth);
  currentUser = null;
  quizWords=[];
  currentIndex=0;
  showTab("quizTab");
};

// Add words
window.addBulkWords = async function(){
  if(!currentUser) return alert("Login first!");
  const week = document.getElementById("weekInput").value;
  const bulkText = document.getElementById("bulkInput").value;
  if(!week||!bulkText) return;
  const words = bulkText.split("\n").map(l=>{
    const [t,d]=l.split(" - ");
    return {term:t?.trim(), definition:d?.trim()};
  }).filter(w=>w.term&&w.definition);
  const docRef = doc(db,"users",currentUser.uid);
  const docSnap = await getDoc(docRef);
  const data = docSnap.exists()?docSnap.data():{};
  data.weeks = data.weeks||{};
  data.weeks[week]=words;
  await setDoc(docRef,data);
  document.getElementById("weekInput").value="";
  document.getElementById("bulkInput").value="";
  alert(`Added ${words.length} words to ${week}`);
  loadWeeks();
  loadManageWeeks();
};

// Load weeks dropdown
async function loadWeeks(){
  if(!currentUser) return;
  const docSnap = await getDoc(doc(db,"users",currentUser.uid));
  const weekSelect = document.getElementById("weekSelect");
  weekSelect.innerHTML="";
  if(docSnap.exists()){
    const weeks = Object.keys(docSnap.data().weeks||{});
    weeks.forEach(w=>{
      const option = document.createElement("option");
      option.value=w;
      option.textContent=w;
      weekSelect.appendChild(option);
    });
  }
}

// Load manage weeks in settings
async function loadManageWeeks(){
  if(!currentUser) return;
  const docSnap = await getDoc(doc(db,"users",currentUser.uid));
  const weekList = document.getElementById("weekList");
  weekList.innerHTML="";
  if(docSnap.exists()){
    const weeks = Object.keys(docSnap.data().weeks||{});
    weeks.forEach(w=>{
      const li = document.createElement("li");
      li.textContent=w;
      const btn = document.createElement("button");
      btn.textContent="Delete";
      btn.onclick=()=>deleteWeek(w);
      li.appendChild(btn);
      weekList.appendChild(li);
    });
  }
}

// Delete entire week
async function deleteWeek(week){
  if(!currentUser) return;
  const docRef = doc(db,"users",currentUser.uid);
  const docSnap = await getDoc(docRef);
  if(!docSnap.exists()) return;
  const data = docSnap.data();
  delete data.weeks[week];
  await setDoc(docRef,data);
  loadWeeks();
  loadManageWeeks();
  alert(`${week} deleted.`);
}
