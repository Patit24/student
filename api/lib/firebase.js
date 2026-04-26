import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure envs are loaded for the lib
dotenv.config();

export let lastFirebaseError = null;

// Shared initialization helper to prevent multiple initializations in serverless
export function initFirebase() {
  if (admin.apps.length > 0) return admin.apps[0];

  const keyJson = process.env.FIREBASE_KEY_JSON;
  
  if (!keyJson) {
    console.error("❌ CRITICAL: FIREBASE_KEY_JSON is missing from .env");
    return null;
  }

  try {
    const serviceAccount = JSON.parse(keyJson.trim());
    
    lastFirebaseError = null; // Reset on success
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL || "https://antigravity-tuition-os-default-rtdb.asia-southeast1.firebasedatabase.app",
      storageBucket: process.env.FIREBASE_BUCKET || "antigravity-tuition-os.firebasestorage.app"
    });
  } catch (err) {
    console.error("❌ Firebase Init Error:", err.message);
    lastFirebaseError = err.message;
    return null;
  }
}

export { admin };
