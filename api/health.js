const { initFirebase } = require('./lib/firebase');

export default async function handler(req, res) {
  const app = initFirebase();
  const razorpayReady = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  const databaseReady = !!app;

  // USER REQUIREMENT 4: Return 200 only if BOTH are ready
  if (databaseReady && razorpayReady) {
    return res.status(200).json({
      status: 'ok',
      firebase: true,
      razorpay: true,
      vercel: true,
      timestamp: new Date().toISOString()
    });
  }

  // Otherwise return 503 Service Unavailable or 500
  return res.status(503).json({
    status: 'error',
    message: 'System initialization incomplete',
    firebase: databaseReady,
    razorpay: razorpayReady,
    vercel: true
  });
}
