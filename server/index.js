/**
 * Antigravity Tuition OS — Payment Server
 * ─────────────────────────────────────────
 * Endpoints:
 *   POST /api/create-order        → creates a Razorpay order (one-time payment)
 *   POST /api/create-subscription → creates a Razorpay subscription (recurring)
 *   POST /api/webhook             → Razorpay webhook (payment.captured / subscription.activated)
 *
 * Setup:
 *   1. Copy .env.example → .env and fill in keys
 *   2. npm install  (in /server)
 *   3. node index.js
 */

require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const bodyParser = require('body-parser');
const crypto     = require('crypto');
const Razorpay   = require('razorpay');
const admin      = require('firebase-admin');

// ── Firebase Admin init ─────────────────────────────────────────────────────
// Provide the service account JSON path via env variable
let firebaseReady = false;
try {
  const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://antigravity-tuition-os-default-rtdb.firebaseio.com',
  });
  firebaseReady = true;
  console.log('✅ Firebase Admin initialized');
} catch (err) {
  console.warn('⚠️  Firebase Admin not initialized:', err.message);
  console.warn('   Place serviceAccountKey.json in /server or set FIREBASE_SERVICE_ACCOUNT_PATH in .env');
}

// ── Razorpay init ────────────────────────────────────────────────────────────
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID     || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});
const razorpayReady = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

// ── App ──────────────────────────────────────────────────────────────────────
const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
}));

// Raw body needed for webhook signature verification
app.use('/api/webhook', bodyParser.raw({ type: 'application/json' }));
app.use(express.json());

// ── Helpers ──────────────────────────────────────────────────────────────────
function planToTier(amountINR) {
  if (amountINR >= 7999) return 'pro';
  if (amountINR >= 2499) return 'growth';
  return 'starter';
}

async function grantSubscription(tutorId, tier, razorpayData = {}) {
  if (!firebaseReady || !tutorId) return;

  const now        = new Date();
  const expiry     = new Date(now);
  expiry.setMonth(expiry.getMonth() + 1); // +1 month

  const update = {
    is_subscribed:       true,
    subscription_tier:   tier,
    subscription_status: 'active',
    subscription_date:   now.toISOString(),
    subscription_expiry: expiry.toISOString(),
    ...razorpayData,
  };

  // Update Firestore
  await admin.firestore().collection('users').doc(tutorId).update(update);

  // Also update Realtime Database (for instant onValue listener)
  await admin.database().ref(`tutors/${tutorId}`).update(update);

  console.log(`✅ Subscription granted → tutor:${tutorId} tier:${tier}`);
}

// ── Routes ───────────────────────────────────────────────────────────────────

/** Health check */
app.get('/api/health', (req, res) => {
  res.json({
    status:        'ok',
    razorpay:      razorpayReady,
    firebase:      firebaseReady,
    timestamp:     new Date().toISOString(),
  });
});

/**
 * POST /api/create-order
 * Body: { amount_inr: 2499, tutor_id: "uid", plan_id: "growth" }
 * Returns: { order_id, amount, currency, key_id }
 */
app.post('/api/create-order', async (req, res) => {
  const { amount_inr, tutor_id, plan_id } = req.body;

  if (!amount_inr || !tutor_id) {
    return res.status(400).json({ error: 'amount_inr and tutor_id are required' });
  }

  if (!razorpayReady) {
    return res.status(503).json({ error: 'Razorpay not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env' });
  }

  try {
    const order = await razorpay.orders.create({
      amount:   Math.round(amount_inr * 100), // paise
      currency: 'INR',
      receipt:  `ag_${tutor_id}_${Date.now()}`,
      notes:    { tutor_id, plan_id },
    });

    res.json({
      order_id: order.id,
      amount:   order.amount,
      currency: order.currency,
      key_id:   process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Order creation failed:', err);
    res.status(500).json({ error: err.error?.description || err.message });
  }
});

/**
 * POST /api/create-subscription
 * Body: { plan_id: "plan_XXXX", tutor_id: "uid", total_count: 12 }
 * Returns: { subscription_id, key_id }
 *
 * NOTE: plan_id must be created in the Razorpay Dashboard first.
 */
app.post('/api/create-subscription', async (req, res) => {
  const { plan_id, tutor_id, total_count = 12 } = req.body;

  if (!plan_id || !tutor_id) {
    return res.status(400).json({ error: 'plan_id and tutor_id are required' });
  }

  if (!razorpayReady) {
    return res.status(503).json({ error: 'Razorpay not configured' });
  }

  try {
    const subscription = await razorpay.subscriptions.create({
      plan_id,
      total_count,
      quantity:  1,
      notes:     { tutor_id },
    });

    res.json({
      subscription_id: subscription.id,
      key_id:          process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Subscription creation failed:', err);
    res.status(500).json({ error: err.error?.description || err.message });
  }
});

/**
 * POST /api/webhook
 * Razorpay sends events here. Verifies signature and grants subscription on success.
 *
 * Register this URL in Razorpay Dashboard → Settings → Webhooks:
 *   https://your-server.com/api/webhook
 * Secret: set RAZORPAY_WEBHOOK_SECRET in .env
 */
app.post('/api/webhook', async (req, res) => {
  const secret    = process.env.RAZORPAY_WEBHOOK_SECRET || '';
  const signature = req.headers['x-razorpay-signature'] || '';
  const body      = req.body; // raw Buffer

  // Verify signature
  if (secret) {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (expected !== signature) {
      console.warn('⚠️  Webhook signature mismatch');
      return res.status(400).json({ error: 'Invalid signature' });
    }
  }

  let payload;
  try { payload = JSON.parse(body.toString()); }
  catch { return res.status(400).json({ error: 'Invalid JSON' }); }

  const event = payload.event;
  console.log(`📦 Razorpay Webhook: ${event}`);

  try {
    if (event === 'payment.captured') {
      const payment  = payload.payload.payment.entity;
      const tutorId  = payment.notes?.tutor_id;
      const amountINR = payment.amount / 100;
      const tier     = planToTier(amountINR);

      await grantSubscription(tutorId, tier, {
        last_payment_id:     payment.id,
        last_payment_amount: amountINR,
      });
    }

    if (event === 'subscription.activated' || event === 'subscription.charged') {
      const sub      = payload.payload.subscription.entity;
      const tutorId  = sub.notes?.tutor_id;
      const tier     = planToTier((sub.plan_id && sub.current_end - sub.current_start) ? 2499 : 0);

      await grantSubscription(tutorId, tier, {
        razorpay_subscription_id: sub.id,
      });
    }

    if (event === 'subscription.cancelled' || event === 'subscription.expired') {
      const sub     = payload.payload.subscription.entity;
      const tutorId = sub.notes?.tutor_id;
      if (firebaseReady && tutorId) {
        await admin.firestore().collection('users').doc(tutorId).update({
          is_subscribed:       false,
          subscription_status: 'inactive',
        });
        await admin.database().ref(`tutors/${tutorId}`).update({
          is_subscribed:       false,
          subscription_status: 'inactive',
        });
        console.log(`⛔ Subscription revoked → tutor:${tutorId}`);
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n🚀 Antigravity Payment Server running on http://localhost:${PORT}`);
  console.log(`   Razorpay: ${razorpayReady ? '✅ Configured' : '⚠️  Demo mode (add keys to .env)'}`);
  console.log(`   Firebase: ${firebaseReady ? '✅ Connected'  : '⚠️  Not connected (add serviceAccountKey.json)'}`);
  console.log(`   Health:   http://localhost:${PORT}/api/health\n`);
});
