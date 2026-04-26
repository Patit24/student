import { initFirebase } from './lib/firebase.js';

export default async function handler(req, res) {
  const app = initFirebase();
  const razorpayReady = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  
  const statusInfo = {
    status: app && razorpayReady ? 'ok' : 'error',
    firebase_initialized: !!app,
    firebase_key_exists: !!process.env.FIREBASE_KEY_JSON,
    firebase_key_length: process.env.FIREBASE_KEY_JSON?.length || 0,
    razorpay: razorpayReady,
    vercel: true,
    timestamp: new Date().toISOString()
  };

  if (app && razorpayReady) {
    return res.status(200).json(statusInfo);
  }

  return res.status(503).json({
    ...statusInfo,
    message: 'System initialization incomplete - Check Environment Variables in Vercel Dashboard'
  });
}
