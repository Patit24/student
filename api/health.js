import { initFirebase } from './lib/firebase.js';

export default async function handler(req, res) {
  const app = initFirebase();
  const razorpayReady = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  const databaseReady = !!app;

  if (databaseReady && razorpayReady) {
    return res.status(200).json({
      status: 'ok',
      firebase: true,
      razorpay: true,
      vercel: true,
      timestamp: new Date().toISOString()
    });
  }

  return res.status(503).json({
    status: 'error',
    message: 'System initialization incomplete',
    firebase: databaseReady,
    razorpay: razorpayReady,
    vercel: true
  });
}
