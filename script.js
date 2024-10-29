// script.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA1Ev9yosRf54ZYqKNk0nMlDPGB1wvfNok",
  authDomain: "life-is-a-game-c63e8.firebaseapp.com",
  projectId: "life-is-a-game-c63e8",
  storageBucket: "life-is-a-game-c63e8.appspot.com",
  messagingSenderId: "811209861596",
  appId: "1:811209861596:web:797afa123b21f211264719"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const loginSection = document.getElementById('login-section');
const registerSection = document.getElementById('register-section');
const calculatorSection = document.getElementById('calculator-section');

const showRegister = document.getElementById('show-register');
const showLogin = document.getElementById('show-login');

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

const packetForm = document.getElementById('packet-form');
const shopForm = document.getElementById('shop-form');
const wantsList = document.getElementById('wants-list');

const experienceFill = document.getElementById('experience-fill');

const logoutButton = document.getElementById('logout-button');

// Event Listeners for Navigation
showRegister.addEventListener('click', (e) => {
    e.preventDefault();
    loginSection.classList.add('hidden');
    registerSection.classList.remove('hidden');
});

showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
});

// User Authentication

// Register User
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value.trim();

    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        // Initialize user data in Firestore
        await setDoc(doc(db, "users", user.uid), {
            experience: 0,
            wants: []
        });
        // Reset and navigate to calculator section
        registerForm.reset();
        registerSection.classList.add('hidden');
        calculatorSection.classList.remove('hidden');
        updateExperienceBar(0);
        loadWants();
    } catch (error) {
        alert(error.message);
    }
});

// Login User
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
        // Reset and navigate to calculator section
        loginForm.reset();
        loginSection.classList.add('hidden');
        calculatorSection.classList.remove('hidden');
        fetchExperience();
        loadWants();
    } catch (error) {
        alert(error.message);
    }
});

// Logout User
logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        calculatorSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
    } catch (error) {
        alert(error.message);
    }
});

// Auth State Listener
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginSection.classList.add('hidden');
        registerSection.classList.add('hidden');
        calculatorSection.classList.remove('hidden');
        fetchExperience();
        loadWants();
    } else {
        loginSection.classList.remove('hidden');
        registerSection.classList.add('hidden');
        calculatorSection.classList.add('hidden');
    }
});

// Experience Tracking

// Fetch Experience from Firestore
async function fetchExperience() {
    const user = auth.currentUser;
    if (user) {
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                updateExperienceBar(data.experience);
            }
        } catch (error) {
            console.error("Error fetching experience:", error);
        }
    }
}

// Update Experience in Firestore
async function updateExperience(newExp) {
    const user = auth.currentUser;
    if (user) {
        try {
            await updateDoc(doc(db, "users", user.uid), {
                experience: newExp
            });
            updateExperienceBar(newExp);
        } catch (error) {
            console.error("Error updating experience:", error);
        }
    }
}

// Update Experience Bar UI
function updateExperienceBar(exp) {
    const level = Math.floor(exp / 100);
    const progress = exp % 100;
    experienceFill.style.width = `${progress}%`;
    experienceFill.textContent = `${level} / ${level + 1}`;
}

// Add Packet Pages
packetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pagesInput = document.getElementById('pages').value.trim();
    const pages = parseInt(pagesInput);

    if (isNaN(pages) || pages < 1) {
        alert("Please enter a valid number of pages.");
        return;
    }

    const user = auth.currentUser;
    if (user) {
        try {
            const userRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
                let currentExp = userDoc.data().experience;
                currentExp += pages; // 1 page = 1 experience point
                await updateDoc(userRef, {
                    experience: currentExp
                });
                packetForm.reset();
                fetchExperience();
            }
        } catch (error) {
            console.error("Error adding experience:", error);
        }
    }
});

// Shop Functionality

// Add Want
shopForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const description = document.getElementById('want-description').value.trim();
    const costInput = document.getElementById('want-cost').value.trim();
    const cost = parseInt(costInput);

    if (description === "" || isNaN(cost) || cost < 1) {
        alert("Please enter a valid description and cost.");
        return;
    }

    const user = auth.currentUser;
    if (user) {
        try {
            const want = {
                id: Date.now(),
                description: description,
                cost: cost
            };
            await updateDoc(doc(db, "users", user.uid), {
                wants: arrayUnion(want)
            });
            shopForm.reset();
            loadWants();
        } catch (error) {
            console.error("Error adding want:", error);
        }
    }
});

// Load Wants from Firestore
async function loadWants() {
    const user = auth.currentUser;
    if (user) {
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                const wants = data.wants;
                wantsList.innerHTML = "";
                wants.forEach((want) => {
                    const li = document.createElement('li');
                    li.classList.add('want-item');
                    li.innerHTML = `
                        <span>${want.description} (Cost: ${want.cost} Levels)</span>
                        <button data-id="${want.id}">Buy</button>
                    `;
                    wantsList.appendChild(li);
                });
            }
        } catch (error) {
            console.error("Error loading wants:", error);
        }
    }
}

// Handle Buy Want
wantsList.addEventListener('click', async (e) => {
    if (e.target.tagName === 'BUTTON') {
        const wantId = parseInt(e.target.getAttribute('data-id'));
        const user = auth.currentUser;

        if (user) {
            try {
                const userRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userRef);
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    const wants = data.wants;
                    const want = wants.find(w => w.id === wantId);
                    if (want) {
                        const currentExp = data.experience;
                        if (currentExp >= want.cost * 100) { // Assuming 1 level = 100 exp
                            const newExp = currentExp - (want.cost * 100);
                            // Update experience and remove want
                            await updateDoc(userRef, {
                                experience: newExp,
                                wants: arrayRemove(want)
                            });
                            alert(`You have purchased: ${want.description}`);
                            fetchExperience();
                            loadWants();
                        } else {
                            alert("Not enough experience points to purchase this item.");
                        }
                    }
                }
            } catch (error) {
                console.error("Error purchasing want:", error);
            }
        }
    }
});
