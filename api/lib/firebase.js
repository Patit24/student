import admin from 'firebase-admin';

// Shared initialization helper to prevent multiple initializations in serverless
export function initFirebase() {
  if (admin.apps.length > 0) return admin.apps[0];

  const keyJson = process.env.FIREBASE_KEY_JSON;
  if (!keyJson) {
    console.error("CRITICAL: FIREBASE_KEY_JSON is missing!");
    return null;
  }

  try {
    // If the string starts with { it's already a JSON string, otherwise it might be base64 or escaped
    const serviceAccount = JSON.parse(keyJson.trim());
    
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL || "https://antigravity-tuition-os-default-rtdb.asia-southeast1.firebasedatabase.app",
      storageBucket: process.env.FIREBASE_BUCKET || "antigravity-tuition-os.firebasestorage.app"
    });
  } catch (err) {
    console.error("Firebase Init Error:", err.message);
    return null;
  }
}

export { admin };
