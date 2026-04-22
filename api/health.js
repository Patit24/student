const { initFirebase } = require('./lib/firebase');

export default async function handler(req, res) {
  const app = initFirebase();
  const razorpayConfigured = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  
  res.status(200).json({
    status: 'ok',
    firebase: !!app,
    razorpay: razorpayConfigured,
    vercel: true,
    timestamp: new Date().toISOString()
  });
}
