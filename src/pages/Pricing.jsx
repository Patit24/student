import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AuthContext';
import { Shield, Check, Zap, ArrowLeft, LogOut, Smartphone, QrCode, X, CheckCircle } from 'lucide-react';
import { useToast } from '../components/Toast';
import './Pricing.css';

const MY_UPI_ID = "9014842370@ybl";
const MY_NAME   = "Antigravity Tuition";

const PLANS = [
  {
    id: 'starter',
    label: 'STARTER',
    priceINR: 0,
    period: '',
    tag: 'FREE',
    icon: Shield,
    color: '#94A3B8',
    features: [
      { text: '1 Batch Allowed',    ok: true },
      { text: '5 Students Max',     ok: true },
      { text: 'Basic Analytics',    ok: true },
      { text: 'Standard Support',   ok: true },
      { text: 'Live Classes',       ok: false },
    ],
  },
  {
    id: 'growth',
    label: 'GROWTH',
    priceINR: 499,
    period: '/mo',
    tag: 'POPULAR',
    icon: Zap,
    color: '#F5C518',
    features: [
      { text: '5 Batches Allowed',  ok: true },
      { text: '50 Students Max',    ok: true },
      { text: 'Live Classes',       ok: true },
      { text: 'Exam Generation',    ok: true },
      { text: 'Priority Support',   ok: true },
    ],
  },
  {
    id: 'pro',
    label: 'ELITE',
    priceINR: 799,
    period: '/mo',
    tag: 'UNLIMITED',
    icon: Shield,
    color: '#818CF8',
    features: [
      { text: 'Unlimited Batches',  ok: true },
      { text: 'Unlimited Students', ok: true },
      { text: 'Custom Branding',    ok: true },
      { text: 'White-labeling',     ok: true },
      { text: '24/7 Dedicated Mgr', ok: true },
    ],
  },
];

export default function Pricing() {
  const { updateTutorSubscription, logout, currentUser } = useAppContext();
  const navigate = useNavigate();
  const toast = useToast();

  const [paying, setPaying] = useState(null);
  const [success, setSuccess] = useState(false);
  const [upiModal, setUpiModal] = useState({ show: false, url: '', plan: null });
  const [txId, setTxId] = useState('');

  const handleLogout = async () => { await logout(); navigate('/'); };

  const handleSubscribe = async (plan) => {
    if (plan.priceINR === 0) {
      await updateTutorSubscription(plan.id);
      navigate('/tutor');
      return;
    }

    const upiUrl = `upi://pay?pa=${MY_UPI_ID}&pn=${encodeURIComponent(MY_NAME)}&am=${plan.priceINR}&cu=INR&tn=${encodeURIComponent(`Sub: ${plan.label}`)}`;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = upiUrl;
      // Also show modal so they can enter TX ID after paying
      setUpiModal({ show: true, url: upiUrl, plan });
    } else {
      setUpiModal({ show: true, url: upiUrl, plan });
    }
  };

  const handleConfirmPayment = async () => {
    if (!txId.trim()) return toast.error("Please enter your Transaction ID / UTR");
    
    setPaying(upiModal.plan.id);
    try {
      const { db } = await import('../firebase');
      const { doc, updateDoc } = await import('firebase/firestore');
      
      await updateDoc(doc(db, 'users', currentUser.uid), {
        subscription_status: 'pending_verification',
        pending_plan: upiModal.plan.id,
        payment_tx_id: txId,
        payment_requested_at: new Date().toISOString()
      });

      setSuccess(true);
      setUpiModal({ show: false, url: '', plan: null });
      toast.success("Details Submitted! Verification usually takes 1-2 hours.");
      setTimeout(() => navigate('/tutor'), 4000);
    } catch (err) {
      toast.error("Error: " + err.message);
    } finally {
      setPaying(null);
    }
  };

  if (success) {
    return (
      <div className="pr-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(245,197,24,0.1)', border: '2px solid #F5C518', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <CheckCircle size={40} color="#F5C518" />
          </div>
          <h2 style={{ color: '#F0F4FF', marginBottom: '1rem' }}>Request Submitted! 🎉</h2>
          <p style={{ color: '#7A8BA8', lineHeight: '1.6' }}>
            We have received your payment details. Our team will verify the transaction and activate your <strong>{PLANS.find(p => p.id === currentUser?.pending_plan)?.label || 'Pro'}</strong> plan shortly.
          </p>
          <button onClick={() => navigate('/tutor')} className="btn btn-primary mt-6 w-full">Go to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pr-root">
      <div className="pr-header">
        <h1>Upgrade Your <span className="pr-yellow">Classroom</span></h1>
        <p>Direct UPI Payment — Instant activation after manual verification.</p>
        <button className="pr-logout-btn" onClick={handleLogout}>
          <LogOut size={14} /> Log Out
        </button>
      </div>

      <div className="pr-grid">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = currentUser?.subscription_tier === plan.id || currentUser?.pending_plan === plan.id;
          return (
            <div key={plan.id} className="pr-card" style={{ '--plan-color': plan.color }}>
              <div className="pr-card-icon" style={{ background: `${plan.color}18`, color: plan.color }}>
                <Icon size={24} />
              </div>
              <h3 className="pr-plan-name">{plan.label}</h3>
              <div className="pr-price">
                {plan.priceINR === 0 ? <span className="pr-price-num">Free</span> : (
                  <>
                    <span className="pr-price-sym">₹</span>
                    <span className="pr-price-num">{plan.priceINR}</span>
                    <span className="pr-price-period">/mo</span>
                  </>
                )}
              </div>
              <ul className="pr-features">
                {plan.features.map((f, i) => (
                  <li key={i} className={f.ok ? 'pr-feat-ok' : 'pr-feat-no'}>
                    <Check size={14} color={f.ok ? plan.color : '#475569'} />
                    <span>{f.text}</span>
                  </li>
                ))}
              </ul>
              <button
                className="pr-buy-btn"
                style={{ background: plan.color, color: '#000', borderColor: plan.color }}
                disabled={isCurrent}
                onClick={() => handleSubscribe(plan)}
              >
                {isCurrent ? 'Current Plan' : plan.priceINR === 0 ? 'Get Started' : `Pay ₹${plan.priceINR}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* UPI MODAL */}
      {upiModal.show && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel p-8 animate-reveal-up" style={{ maxWidth: '400px', width: '100%', position: 'relative' }}>
            <button onClick={() => setUpiModal({ ...upiModal, show: false })} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#7A8BA8', cursor: 'pointer' }}><X size={20}/></button>
            
            <div className="text-center mb-6">
              <h3 style={{ color: '#F5C518' }}>Complete Payment</h3>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>Scan the QR code or pay using UPI</p>
            </div>

            <div className="flex justify-center mb-6" style={{ background: 'white', padding: '1rem', borderRadius: '12px' }}>
              <img 
                src={`https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(upiModal.url)}&choe=UTF-8`} 
                alt="UPI QR Code" 
                style={{ width: '200px', height: '200px' }}
              />
            </div>

            <div className="flex-col gap-4">
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>UPI ID:</p>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>{MY_UPI_ID}</p>
              </div>

              <div className="mt-4">
                <p style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>Enter Transaction ID (UTR):</p>
                <input 
                  type="text" 
                  className="input-field w-full" 
                  placeholder="12-digit Ref No." 
                  value={txId} 
                  onChange={e => setTxId(e.target.value)} 
                />
              </div>

              <button className="btn btn-primary w-full mt-2" onClick={handleConfirmPayment}>
                {paying ? 'Verifying...' : 'I Have Paid'}
              </button>
              
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem' }}>
                Open GPay, PhonePe, or Paytm to scan. Your plan will be activated after manual verification.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
