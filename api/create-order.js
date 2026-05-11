import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { amount_inr, tutor_id, plan_id, type, uid } = req.body;

  const rzp_key_id = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
  const rzp_key_secret = process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET || '';

  if (!rzp_key_id || !rzp_key_secret) {
    return res.status(500).json({ status: 'error', message: 'Razorpay keys not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your environment.' });
  }

  const razorpay = new Razorpay({
    key_id: rzp_key_id,
    key_secret: rzp_key_secret,
  });

  try {
    const isResume = type === 'resume_unlock';
    const finalAmount = isResume ? 4900 : Math.round(amount_inr * 100);
    const finalReceipt = isResume ? `resume_${uid}_${Date.now()}` : `ag_${tutor_id}_${Date.now()}`;
    const finalNotes = isResume ? { uid, type } : { tutor_id, plan_id };

    const order = await razorpay.orders.create({
      amount: finalAmount,
      currency: 'INR',
      receipt: finalReceipt,
      notes: finalNotes,
    });

    res.status(200).json({ 
      order_id: order.id, 
      amount: order.amount, 
      key_id: rzp_key_id 
    });

  } catch (err) {
    console.error('Razorpay Error:', err);
    res.status(502).json({ 
      status: 'error', 
      message: 'Razorpay unreachable',
      details: err.message 
    });
  }
}
