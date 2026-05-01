import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc, setDoc, getDoc, getDocFromCache,
  collection, query, where, getDocs,
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager
} from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getDatabase, ref as rtdbRef, set, onValue, push } from 'firebase/database';

// ── Antigravity Tuition OS — Firebase Configuration ──
// Project : antigravity-tuition-os
// Account : patitroy29@gmail.com
const firebaseConfig = {
  apiKey: "AIzaSyCzTijbLiM6kd-GuHGEbsPYr2U_Psw4pnc",
  authDomain: "antigravity-tuition-os.firebaseapp.com",
  projectId: "antigravity-tuition-os",
  storageBucket: "antigravity-tuition-os.firebasestorage.app",
  messagingSenderId: "1021639170510",
  appId: "1:1021639170510:web:9d6a803eb5226d5be0f39f",
  // ⚠️ If you see a databaseURL error, go to:
  // https://console.firebase.google.com/project/antigravity-tuition-os/database
  // → Click "Create Database" → pick a region → "Start in locked mode" → Enable
  databaseURL: "https://antigravity-tuition-os-default-rtdb.asia-southeast1.firebasedatabase.app",
};

// ── Required Firestore Composite Indexes ──────────────────────────────────────
// If you see "index required" errors in the browser console, go to:
// https://console.firebase.google.com/project/antigravity-tuition-os/firestore/indexes
// and create the following composite indexes:
//
//  Collection: users     Fields: tutorId (ASC) + role (ASC)
//  Collection: batches   Fields: tutorId (ASC)
//  Collection: materials Fields: tutor_id (ASC) + created_at (DESC)
//  Collection: materials Fields: batch_id (ASC)  + created_at (DESC)
//
// Firebase will also give you a direct link in the console error to create them.
// ─────────────────────────────────────────────────────────────────────────────


// ── Core services ─────────────────────────────────────
let app, auth, db, storage, rtdb;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  
  // Use modern initialization with persistentLocalCache to fix the multi-tab and deprecation errors
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
  });
  
  storage = getStorage(app);

  console.log("✅ Firebase core initialized (Auth + Firestore + Storage + Offline)");
} catch (err) {
  console.error("❌ Firebase core init error:", err);
}

// ── Realtime Database (optional — requires manual Console setup) ──
// Initialized separately so a missing RTDB instance won't crash the whole app.
try {
  rtdb = getDatabase(app);
  console.log("✅ Firebase Realtime Database connected");
} catch (err) {
  // This usually means the RTDB instance hasn't been created in the Console yet.
  // Visit: https://console.firebase.google.com/project/antigravity-tuition-os/database
  console.warn(
    "⚠️ Realtime Database not available — open the Firebase Console link above to enable it.",
    err.message,
  );
  rtdb = null;
}

export { auth, db, storage, rtdb };
