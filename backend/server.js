/**
 * backend/server.js — Vercel Optimized Backend
 * Handles: Razorpay Payments, Webhooks, and Firebase Storage Upload Relay.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const admin = require('firebase-admin');
const multer = require('multer');

// --- Firebase Admin Init (Vercel Style) ---
let firebaseReady = false;
try {
  let serviceAccount;
  if (process.env.FIREBASE_KEY_JSON) {
    serviceAccount = JSON.parse(process.env.FIREBASE_KEY_JSON);
  } else {
    serviceAccount = require('./serviceAccountKey.json');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://antigravity-tuition-os-default-rtdb.firebaseio.com',
    storageBucket: process.env.FIREBASE_BUCKET || 'antigravity-tuition-os.appspot.com',
  });
  firebaseReady = true;
  console.log('✅ Firebase Admin connected (Vercel Mode)');
} catch (err) {
  console.error('❌ Firebase Init Error:', err.message);
}

// --- Razorpay Init ---
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

// --- Express App ---
const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));

// Multer for Uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Webhook raw body
app.use('/api/webhook', bodyParser.raw({ type: 'application/json' }));
app.use(express.json());

// --- ROUTES ---

/** Health & Vercel Verification */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    firebase: firebaseReady, 
    razorpay: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    vercel: true 
  });
});

/** 
 * 1. FILE UPLOAD RELAY (Fixes CORS)
 */
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!firebaseReady) return res.status(500).json({ error: 'Firebase not ready' });
  if (!req.file) return res.status(400).json({ error: 'No file' });

  try {
    const bucket = admin.storage().bucket();
    const folder = req.body.folder || 'misc';
    const fileName = `${folder}/${req.body.uid || 'anon'}_${Date.now()}_${req.file.originalname}`;
    const file = bucket.file(fileName);

    const stream = file.createWriteStream({
      metadata: { contentType: req.file.mimetype },
      public: true
    });

    stream.on('error', (e) => res.status(500).json({ error: e.message }));
    stream.on('finish', () => {
      const url = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      res.json({ url, fileName });
    });
    stream.end(req.file.buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 2. RAZORPAY ORDERS (Subscriptions & Resumes)
 */
app.post('/api/create-order', async (req, res) => {
  const { amount_inr, tutor_id, plan_id } = req.body;
  try {
    const order = await razorpay.orders.create({
      amount: Math.round(amount_inr * 100),
      currency: 'INR',
      receipt: `ag_${tutor_id}_${Date.now()}`,
      notes: { tutor_id, plan_id },
    });
    res.json({ order_id: order.id, amount: order.amount, key_id: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/resume/create-order', async (req, res) => {
  const { uid } = req.body;
  try {
    const order = await razorpay.orders.create({
      amount: 4900, // ₹49 in paise
      currency: 'INR',
      receipt: `resume_${uid}_${Date.now()}`,
      notes: { uid, type: 'resume_unlock' },
    });
    res.json({ order_id: order.id, amount: order.amount, key_id: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 3. RAZORPAY WEBHOOK
 */
app.post('/api/webhook', async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const sig = req.headers['x-razorpay-signature'];
  
  if (secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(req.body);
    if (hmac.digest('hex') !== sig) return res.status(400).send('Invalid signature');
  }

  const payload = JSON.parse(req.body.toString());
  const event = payload.event;

  if (event === 'payment.captured') {
    const payment = payload.payload.payment.entity;
    const tutorId = payment.notes?.tutor_id;
    const tier = (payment.amount / 100) >= 7999 ? 'pro' : 'growth';

    if (firebaseReady && tutorId) {
      await admin.firestore().collection('users').doc(tutorId).update({
        subscription_status: 'active',
        subscription_tier: tier,
        last_payment_id: payment.id
      });
    }

    // Handle Resume Unlocks
    const type = payment.notes?.type;
    const uid = payment.notes?.uid;
    if (type === 'resume_unlock' && uid) {
      await admin.database().ref(`user_resumes/${uid}`).update({
        payment_status: 'success',
        payment_id: payment.id,
        paid_at: new Date().toISOString()
      });
    }
  }
  res.json({ received: true });
});

// Vercel handles the listening, but for local testing:
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`Backend live on ${PORT}`));
}

module.exports = app;
