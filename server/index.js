import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import crypto from 'crypto';
import admin from 'firebase-admin';
import Razorpay from 'razorpay';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ── MIDDLEWARE ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── FIREBASE INITIALIZATION ─────────────────────────────────────────────────
const initFirebase = () => {
  if (admin.apps.length > 0) return admin.apps[0];

  let serviceAccount;
  const keyPath = process.env.FIREBASE_KEY_PATH;
  const keyJson = process.env.FIREBASE_KEY_JSON;

  try {
    if (keyJson) {
      serviceAccount = JSON.parse(keyJson);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
    } else if (keyPath) {
      // Read from file path
      const absolutePath = path.isAbsolute(keyPath) 
        ? keyPath 
        : path.join(__dirname, keyPath);
      serviceAccount = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
    } else if (keyJson) {
      // Fallback to environment variable string
      serviceAccount = JSON.parse(keyJson.trim());
    } else {
      console.error("❌ CRITICAL: Neither FIREBASE_KEY_PATH nor FIREBASE_KEY_JSON found in .env");
      return null;
    }

    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL || "https://antigravity-tuition-os-default-rtdb.asia-southeast1.firebasedatabase.app",
      storageBucket: process.env.FIREBASE_BUCKET || "antigravity-tuition-os.firebasestorage.app"
    });
  } catch (err) {
    console.error("❌ Firebase Init Error:", err.message);
    return null;
  }
};

const firebaseApp = initFirebase();

// ── RAZORPAY INITIALIZATION ─────────────────────────────────────────────────
const rzp_key_id = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
const rzp_key_secret = process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET || '';

const razorpay = new Razorpay({
  key_id: rzp_key_id,
  key_secret: rzp_key_secret,
});

// ── MULTER CONFIG ───────────────────────────────────────────────────────────
const upload = multer({ storage: multer.memoryStorage() });

// ── ROUTES ──────────────────────────────────────────────────────────────────

// 1. Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    firebase: !!firebaseApp,
    razorpay: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    server: 'AWS EC2',
    uptime: process.uptime()
  });
});

// 2. Create Razorpay Order
app.post('/api/create-order', async (req, res) => {
  const { amount_inr, tutor_id, plan_id, type, uid } = req.body;
  try {
    const isResume = type === 'resume_unlock';
    const finalAmount = isResume ? 4900 : Math.round(amount_inr * 100);
    
    const order = await razorpay.orders.create({
      amount: finalAmount,
      currency: 'INR',
      receipt: `ag_${Date.now()}`,
      notes: { tutor_id, plan_id, uid, type }
    });

    res.json({ order_id: order.id, amount: order.amount, key_id: rzp_key_id });
  } catch (err) {
    res.status(502).json({ error: 'Razorpay Error', message: err.message });
  }
});

// 3. Webhook for Payments
app.post('/api/webhook', async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'your_secret';
  const signature = req.headers['x-razorpay-signature'];
  const body = JSON.stringify(req.body);

  const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');

  if (signature !== expectedSignature) return res.status(400).send('Invalid Signature');

  if (req.body.event === 'payment.captured') {
    const notes = req.body.payload.payment.entity.notes;
    try {
      if (notes.tutor_id) {
        await admin.firestore().collection('users').doc(notes.tutor_id).update({
          subscription_status: 'active',
          subscription_tier: notes.plan_id || 'growth'
        });
      }
    } catch (err) {
      console.error('Webhook DB Error:', err);
    }
  }
  res.send('ok');
});

// 4. File Upload Relay
app.post('/api/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  const { uid, folder } = req.body;

  if (!file || !firebaseApp) return res.status(400).send('Upload failed');

  try {
    const bucket = admin.storage().bucket();
    const filename = `${folder || 'uploads'}/${uid}_${Date.now()}_${file.originalname}`;
    const blob = bucket.file(filename);

    const stream = blob.createWriteStream({ metadata: { contentType: file.mimetype }, resumable: false });
    stream.on('error', (err) => res.status(500).json({ error: err.message }));
    stream.on('finish', async () => {
      await blob.makePublic();
      res.status(200).json({ url: `https://storage.googleapis.com/${bucket.name}/${blob.name}` });
    });
    stream.end(file.buffer);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 5. MARKETPLACE: RAZORPAY ORDERS
app.post('/api/marketplace/create-order', async (req, res) => {
  const { amount_inr, user_id, product_id, is_bundle_discount } = req.body;
  try {
    const order = await razorpay.orders.create({
      amount: Math.round(amount_inr * 100),
      currency: 'INR',
      receipt: `mk_${user_id || 'guest'}_${Date.now()}`.substring(0, 40),
      notes: { user_id: user_id || 'guest', product_id, is_bundle_discount: is_bundle_discount ? 'true' : 'false', type: 'marketplace' },
    });
    res.json({ order_id: order.id, amount: order.amount, key_id: rzp_key_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. MARKETPLACE: GENERATE SIGNED URL
app.post('/api/marketplace/generate-signed-url', async (req, res) => {
  const { fileUrl } = req.body;
  if (!fileUrl) return res.status(400).send('No file URL');

  try {
    let filePath = fileUrl;
    if (fileUrl.includes('/o/')) {
      filePath = decodeURIComponent(fileUrl.split('/o/')[1].split('?')[0]);
    } else if (fileUrl.includes('storage.googleapis.com')) {
      const parts = new URL(fileUrl).pathname.split('/');
      filePath = parts.slice(2).join('/');
    }

    const bucket = admin.storage().bucket();
    const file = bucket.file(filePath);

    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000,
    });

    res.json({ signedUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── START SERVER ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Monolithic Server running on port ${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
});
