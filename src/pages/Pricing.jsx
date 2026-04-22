import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AuthContext';
import { Shield, Check, Zap, LogOut, X, CheckCircle, Smartphone, QrCode, Crown } from 'lucide-react';
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
      toast.success("Request Submitted! Verification in progress.");
      setTimeout(() => navigate('/tutor'), 4000);
    } catch (err) {
      toast.error("Error: " + err.message);
    } finally {
      setPaying(null);
    }
  };

  if (success) {
    return (
      <div className="pr-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', background: '#07090F' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(245,197,24,0.1)', border: '2px solid #F5C518', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <CheckCircle size={40} color="#F5C518" />
          </div>
          <h2 style={{ color: '#F0F4FF', marginBottom: '1rem' }}>Request Submitted! 🎉</h2>
          <p style={{ color: '#7A8BA8', lineHeight: '1.6' }}>
            We have received your payment details. Our team will verify the transaction and activate your plan shortly.
          </p>
          <button onClick={() => navigate('/tutor')} className="btn btn-primary mt-6 w-full">Go to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pr-root" style={{ background: '#07090F', minHeight: '100vh' }}>
      <div className="pr-header" style={{ textAlign: 'center', paddingTop: '4rem', paddingBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', background: 'rgba(245,197,24,0.1)', borderRadius: '99px', color: '#F5C518', fontSize: '0.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>
          <Crown size={14} /> PREMIUM PLANS
        </div>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, color: '#F0F4FF', margin: 0 }}>Upgrade Your <span style={{ color: '#F5C518' }}>Center</span></h1>
        <p style={{ color: '#7A8BA8', marginTop: '1rem', fontSize: '1.1rem' }}>Instant UPI Payment — Active in 60 minutes.</p>
        
        <button onClick={handleLogout} style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#F0F4FF', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LogOut size={14} /> Log Out
        </button>
      </div>

      <div className="pr-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '1100px', margin: '0 auto', padding: '2rem' }}>
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = currentUser?.subscription_tier === plan.id || currentUser?.pending_plan === plan.id;
          return (
            <div key={plan.id} className="pr-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '2.5rem', transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden' }}>
              {plan.tag === 'POPULAR' && <div style={{ position: 'absolute', top: '1.5rem', right: '-2.5rem', background: '#F5C518', color: '#000', padding: '0.2rem 3rem', transform: 'rotate(45deg)', fontSize: '0.7rem', fontWeight: 900 }}>BEST VALUE</div>}
              <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: `${plan.color}20`, color: plan.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <Icon size={24} />
              </div>
              <h3 style={{ color: '#F0F4FF', margin: 0, fontSize: '1.5rem' }}>{plan.label}</h3>
              <div style={{ marginTop: '1rem', marginBottom: '2rem' }}>
                {plan.priceINR === 0 ? <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#F0F4FF' }}>Free</span> : (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
                    <span style={{ fontSize: '1.5rem', color: '#F5C518', fontWeight: 700 }}>₹</span>
                    <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#F0F4FF' }}>{plan.priceINR}</span>
                    <span style={{ color: '#7A8BA8' }}>/mo</span>
                  </div>
                )}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2.5rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {plan.features.map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: f.ok ? '#F0F4FF' : '#475569', fontSize: '0.9rem' }}>
                    <Check size={16} color={f.ok ? plan.color : '#475569'} />
                    <span>{f.text}</span>
                  </li>
                ))}
              </ul>
              <button
                style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: 'none', background: isCurrent ? 'rgba(255,255,255,0.05)' : plan.color, color: isCurrent ? '#475569' : '#000', fontWeight: 700, cursor: isCurrent ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease' }}
                disabled={isCurrent}
                onClick={() => handleSubscribe(plan)}
              >
                {isCurrent ? 'Current Plan' : plan.priceINR === 0 ? 'Get Started' : `Upgrade to ${plan.label}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* UPI MODAL */}
      {upiModal.show && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '2rem', maxWidth: '400px', width: '100%', position: 'relative' }}>
            <button onClick={() => setUpiModal({ ...upiModal, show: false })} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: '#7A8BA8', cursor: 'pointer' }}><X size={24}/></button>
            
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h3 style={{ color: '#F5C518', fontSize: '1.5rem', margin: '0 0 0.5rem 0' }}>Complete Payment</h3>
              <p style={{ color: '#7A8BA8', margin: 0, fontSize: '0.9rem' }}>Scan or use UPI apps below</p>
            </div>

            <div style={{ background: 'white', padding: '1rem', borderRadius: '16px', marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
              <img 
                src={`https://chart.googleapis.com/chart?chs=250x250&cht=qr&chl=${encodeURIComponent(upiModal.url)}&choe=UTF-8`} 
                alt="UPI QR Code" 
                style={{ width: '200px', height: '200px' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ fontSize: '0.75rem', color: '#7A8BA8', margin: '0 0 0.2rem 0' }}>UPI ID:</p>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: '#F0F4FF', margin: 0 }}>{MY_UPI_ID}</p>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <p style={{ fontSize: '0.85rem', color: '#F0F4FF', marginBottom: '0.5rem' }}>Transaction ID / UTR (12 Digits):</p>
                <input 
                  type="text" 
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '1rem' }}
                  placeholder="e.g. 412356789012" 
                  value={txId} 
                  onChange={e => setTxId(e.target.value)} 
                />
              </div>

              <button 
                onClick={handleConfirmPayment}
                disabled={paying}
                style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: '#F5C518', color: '#000', border: 'none', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', marginTop: '1rem' }}
              >
                {paying ? 'Submitting...' : 'I HAVE PAID'}
              </button>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem', opacity: 0.6 }}>
                <Smartphone size={16} color="#7A8BA8" />
                <QrCode size={16} color="#7A8BA8" />
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .pr-root { font-family: 'Inter', system-ui, sans-serif; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
