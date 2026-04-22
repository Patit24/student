const crypto = require('crypto');
const { initFirebase, admin } = require('./lib/firebase');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'your_webhook_secret_here';
  const signature = req.headers['x-razorpay-signature'];

  const shasum = crypto.createHmac('sha256', secret);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest('hex');

  if (signature !== digest) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const { event, payload } = req.body;

  if (event === 'payment.captured') {
    const payment = payload.payment.entity;
    const notes = payment.notes;
    
    const app = initFirebase();
    if (!app) return res.status(500).json({ error: 'Firebase not initialized' });

    // USER REQUIREMENT 2: Fast sync to update payment_status
    try {
      if (notes.type === 'resume_unlock' && notes.uid) {
        await admin.database().ref(`user_resumes/${notes.uid}`).update({
          payment_status: 'success',
          payment_id: payment.id,
          paid_at: new Date().toISOString()
        });
      } else if (notes.tutor_id) {
        await admin.firestore().collection('users').doc(notes.tutor_id).update({
          subscription_status: 'active',
          subscription_tier: notes.plan_id || 'growth',
          last_payment_id: payment.id
        });
      }
    } catch (dbErr) {
      console.error('Database Sync Error:', dbErr);
      return res.status(500).json({ error: 'Database sync failed' });
    }
  }

  res.status(200).json({ received: true });
}
