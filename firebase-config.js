import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
    apiKey:            "BURAYA_API_KEY",
    authDomain:        "BURAYA.firebaseapp.com",
    projectId:         "BURAYA_PROJECT_ID",
    storageBucket:     "BURAYA.appspot.com",
    messagingSenderId: "BURAYA_SENDER_ID",
    appId:             "BURAYA_APP_ID"
};

// Cloudflare Turnstile Site Key
const TURNSTILE_SITE_KEY = "1x00000000000000000000AA"; 

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage, TURNSTILE_SITE_KEY };
