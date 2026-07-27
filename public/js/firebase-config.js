// Only needed if js/config.js has TRANSPORT = "firebase".
//
// 1. Go to https://console.firebase.google.com -> Create a project (free)
// 2. Build -> Realtime Database -> Create Database -> start in TEST MODE
// 3. Gear icon -> Project settings -> "Your apps" -> click </> (Web) -> register
// 4. Copy the config object it gives you into here:

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
