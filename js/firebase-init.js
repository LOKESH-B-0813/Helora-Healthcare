import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBMae9bFKQexuJANZhnPu9esqc9-PtQAgQ",
    authDomain: "helorahealthcare-996d2.firebaseapp.com",
    projectId: "helorahealthcare-996d2",
    storageBucket: "helorahealthcare-996d2.appspot.com",
    messagingSenderId: "488158312400",
    appId: "1:488158312400:web:c3d4cdaa4092d3995f6bd5",
    measurementId: "G-PHRJBPTK0T"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Global attach for legacy support when necessary
window.auth = auth;
window.db = db;

console.log("Firebase initialized successfully");
