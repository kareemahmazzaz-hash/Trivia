// Only needed if js/config.js has TRANSPORT = "firebase".
//
// 1. Go to https://console.firebase.google.com -> Create a project (free)
// 2. Build -> Realtime Database -> Create Database -> start in TEST MODE
// 3. Gear icon -> Project settings -> "Your apps" -> click </> (Web) -> register
// 4. Copy the config object it gives you into here:

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDVFZ3v8eFM5_FPgdW6NHlzZ6m_E_UL1kE",
  authDomain: "trivia-b8521.firebaseapp.com",
  databaseURL: "https://trivia-b8521-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "trivia-b8521",
  storageBucket: "trivia-b8521.firebasestorage.app",
  messagingSenderId: "1092604470192",
  appId: "1:1092604470192:web:9bb47dab7c6e66dd4dec75",
  measurementId: "G-3WHY76H02J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
