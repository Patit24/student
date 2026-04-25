import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure envs are loaded for the lib
dotenv.config();

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
    
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL || "https://antigravity-tuition-os-default-rtdb.asia-southeast1.firebasedatabase.app",
      storageBucket: process.env.FIREBASE_BUCKET || "antigravity-tuition-os.firebasestorage.app"
    });
  } catch (err) {
    console.error("❌ Firebase Init Error:", err.message);
    return null;
  }
}

export { admin };
