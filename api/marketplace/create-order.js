import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { amount_inr, user_id, product_id, is_bundle_discount } = req.body;

  const rzp_key_id = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
  const rzp_key_secret = process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET || '';

  if (!rzp_key_id || !rzp_key_secret) {
    return res.status(500).json({ error: 'Razorpay keys not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your environment.' });
  }

  const razorpay = new Razorpay({
    key_id: rzp_key_id,
    key_secret: rzp_key_secret,
  });

  try {
    const order = await razorpay.orders.create({
      amount: Math.round(amount_inr * 100),
      currency: 'INR',
      receipt: `mk_${user_id || 'guest'}_${Date.now()}`.substring(0, 40),
      notes: { 
        user_id: user_id || 'guest', 
        product_id, 
        is_bundle_discount: is_bundle_discount ? 'true' : 'false', 
        type: 'marketplace' 
      },
    });

    res.status(200).json({ 
      order_id: order.id, 
      amount: order.amount, 
      key_id: rzp_key_id 
    });
  } catch (err) {
    console.error('Razorpay Error:', err);
    res.status(500).json({ error: err.message });
  }
}
