const admin = require('firebase-admin');

// Shared initialization helper to prevent multiple initializations in serverless
function initFirebase() {
  if (admin.apps.length > 0) return admin.apps[0];

  const keyJson = process.env.FIREBASE_KEY_JSON;
  if (!keyJson) {
    console.error("CRITICAL: FIREBASE_KEY_JSON is missing in Environment Variables!");
    return null;
  }

  try {
    const serviceAccount = JSON.parse(keyJson);
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL || "https://antigravity-tuition-os-default-rtdb.asia-southeast1.firebasedatabase.app",
      storageBucket: process.env.FIREBASE_BUCKET || "antigravity-tuition-os.firebasestorage.app"
    });
  } catch (err) {
    console.error("Firebase Init Error (Check if FIREBASE_KEY_JSON is valid JSON):", err.message);
    return null;
  }
}

module.exports = { initFirebase, admin };
