const Razorpay = require('razorpay');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { amount_inr, tutor_id, plan_id, type, uid } = req.body;

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return res.status(500).json({ status: 'error', message: 'Razorpay keys not configured' });
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  try {
    // Check Razorpay Reachability
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
      key_id: process.env.RAZORPAY_KEY_ID 
    });

  } catch (err) {
    console.error('Razorpay Error:', err);
    // USER REQUIREMENT 3: Return specific JSON error if Razorpay unreachable
    res.status(502).json({ 
      status: 'error', 
      message: 'Razorpay unreachable',
      details: err.message 
    });
  }
}
