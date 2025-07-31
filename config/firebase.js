// backend/config/firebase.js
const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyDIWZbcdPy2MV1vYcd88CcoWdAofi4VlEc",
    authDomain: "noduessystem.firebaseapp.com",
    projectId: "noduessystem",
    storageBucket: "noduessystem.firebasestorage.app",
    messagingSenderId: "1037845375965",
    appId: "1:1037845375965:web:f5fd1707ec70e2821ba434",
    measurementId: "G-DM5Q4M5NQC"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

module.exports = { db };


