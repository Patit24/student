import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AuthContext';
import { Shield, Check, Zap, LogOut, X, CheckCircle, Smartphone, Crown, Sparkles, ArrowRight, Users, BookOpen, Headphones, Upload } from 'lucide-react';
import { useToast } from '../components/Toast';
import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

const MY_UPI_ID = "9014842370@ybl";
const MY_NAME   = "PPREducation";

const PLANS = [
  {
    id: 'flex',
    label: 'Flex',
    priceINR: 1,
    period: '/ student / month',
    tag: 'PAY AS YOU GO',
    tagline: 'Pay only for what you use.',
    bestFor: 'Tutors just starting their journey.',
    icon: Users,
    cardStyle: 'card-flex',
    features: [
      'Unlimited Batches',
      '₹1 per active student / month',
      'Live Class Broadcasting',
      'Notice Board & Chat',
      'Basic Analytics',
      'Community Support',
    ],
  },
  {
    id: 'silver',
    label: 'Silver',
    priceINR: 1999,
    period: '/ year',
    tag: 'BEST VALUE',
    tagline: 'Save ~30% vs monthly billing.',
    bestFor: 'Mid-sized batches & serious educators.',
    icon: Zap,
    cardStyle: 'card-silver',
    features: [
      'Everything in Flex',
      'Unlimited Students',
      'NEET/JEE Batch Libraries (9-12th)',
      'Smart AI Exam Generator',
      'PDF & Recording Uploads',
      'Priority Email Support',
    ],
  },
  {
    id: 'gold',
    label: 'Gold',
    priceINR: 2999,
    period: '/ year',
    tag: 'SUPER PREMIUM',
    tagline: 'Zero limits. Absolute freedom.',
    bestFor: 'Scale your education empire.',
    icon: Crown,
    cardStyle: 'card-gold',
    features: [
      'Everything in Silver',
      'Zero Student Limits',
      'Global Study Materials Library',
      'White-label Dashboard',
      'Custom Branding & Domain',
      '24/7 Priority Support & Manager',
    ],
  },
];

export default function Pricing() {
  const { currentUser, logout, isMockMode } = useAppContext();
  const navigate = useNavigate();
  const toast = useToast();

  const [upiModal, setUpiModal] = useState({ show: false, plan: null });
  const [txId, setTxId] = useState('');
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleLogout = async () => { await logout(); navigate('/'); };

  const handleChoosePlan = (plan) => {
    if (!currentUser) return navigate('/login');
    
    // If tutor has never used a trial, they can activate it
    if (currentUser.role === 'tutor' && !currentUser.trial_used) {
      setUpiModal({ show: true, plan, isTrial: true });
      return;
    }

    if (plan.id === 'flex' && currentUser.subscription_tier === 'flex') return;
    setUpiModal({ show: true, plan, isTrial: false });
    setTxId('');
  };

  const handleConfirmTrial = async () => {
    setPaying(true);
    try {
      const plan = upiModal.plan;
      if (!isMockMode && db && currentUser?.uid) {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          subscription_tier: plan.id,
          subscription_status: 'active',
          trial_used: true,
          trial_activated_at: serverTimestamp(),
          trial_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
      }
      setSuccess(true);
      toast.success(`🎉 ${plan.label} Trial Activated! Enjoy 30 days of free premium access.`);
      setTimeout(() => navigate('/tutor'), 2000);
    } catch (err) {
      toast.error('Failed to activate trial: ' + err.message);
    } finally {
      setPaying(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!txId.trim()) return toast.error('Please enter a valid Transaction ID.');
    setPaying(true);
    try {
      const plan = upiModal.plan;
      if (!isMockMode && db && currentUser?.uid) {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          pending_plan: plan.id,
          payment_tx_id: txId.trim(),
          payment_submitted_at: serverTimestamp(),
          subscription_status: 'pending_verification',
        });
      }
      setSuccess(true);
      setUpiModal({ show: false, plan: null });
      toast.success('Payment proof submitted! Admin will verify within 30 minutes. 🚀');
    } catch (err) {
      toast.error('Submission failed: ' + err.message);
    } finally {
      setPaying(false);
    }
  };

  const upiAmount = upiModal.plan?.priceINR || 0;
  const upiUrl = `upi://pay?pa=${MY_UPI_ID}&pn=${MY_NAME}&am=${upiAmount}&cu=INR&tn=PPR+${upiModal.plan?.label || ''}+Plan`;

  if (success) {
    return (
      <div className="pr-root pr-success-view">
        <div className="pr-success-card">
          <div className="pr-check-ring"><CheckCircle size={48} /></div>
          <h2>Verification in Progress</h2>
          <p>We've received your transaction reference. Our team will activate your <strong>{upiModal.plan?.label || 'Premium'}</strong> features within <strong>30 minutes</strong>.</p>
          <button onClick={() => navigate('/tutor')} className="pr-btn pr-btn-gold">Go to Dashboard</button>
        </div>
        <style>{BASE_CSS}</style>
      </div>
    );
  }

  return (
    <div className="pr-root">
      <div className="pr-bg">
        <div className="pr-blob pr-blob1"></div>
        <div className="pr-blob pr-blob2"></div>
        <div className="pr-blob pr-blob3"></div>
      </div>

      <nav className="pr-nav">
        <div className="pr-logo">PPR<span>Education</span></div>
        <button onClick={handleLogout} className="pr-logout"><LogOut size={16} /> Logout</button>
      </nav>

      <header className="pr-header">
        <div className="pr-badge"><Sparkles size={14} /> NEW SUBSCRIPTION PLANS</div>
        <h1>Choose Your <span>Growth Plan</span></h1>
        <p>From ₹1/student to unlimited empire. Instant UPI activation.</p>
      </header>

      <div className="pr-grid">
        {/* FREE TRIAL BANNER */}
        <div className="animate-premium" style={{ 
          gridColumn: '1 / -1',
          background: 'linear-gradient(90deg, #F5C518 0%, #FFD700 100%)', 
          borderRadius: '24px', 
          padding: '2rem', 
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(245, 197, 24, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '0.5rem',
          color: '#000',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <Sparkles size={32} />
            <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.8rem', letterSpacing: '-0.8px' }}>1 MONTH FREE FOR ALL TUTORS!</h2>
          </div>
          <p style={{ margin: 0, opacity: 0.8, fontWeight: 700, fontSize: '1.1rem' }}>Get full access to any growth plan absolutely free for your first 30 days.</p>
        </div>

        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = currentUser?.subscription_tier === plan.id;
          const isPending = currentUser?.pending_plan === plan.id;
          const isFeatured = plan.id === 'silver';

          return (
            <div key={plan.id} className={`pr-card ${plan.cardStyle} ${isFeatured ? 'pr-featured' : ''}`}>
              {plan.id === 'silver' && <div className="pr-ribbon">✨ Best Value</div>}
              {plan.id === 'gold' && <div className="pr-ribbon pr-ribbon-gold">👑 Super Premium</div>}

              <div className="pr-card-top">
                <div className={`pr-icon-box ${plan.cardStyle}`}><Icon size={28} /></div>
                <h3>{plan.label}</h3>
                <div className="pr-price">
                  <span className="pr-currency">₹</span>
                  <span className="pr-amount">{plan.priceINR.toLocaleString()}</span>
                  <span className="pr-period">{plan.period}</span>
                </div>
                <p className="pr-tagline">{plan.tagline}</p>
                <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22C55E', fontSize: '0.75rem', fontWeight: 800, padding: '6px 12px', borderRadius: '99px', display: 'inline-block', marginTop: '1rem' }}>
                   🎁 FIRST 30 DAYS FREE
                </div>

              </div>

              <ul className="pr-features">
                {plan.features.map((f, i) => (
                  <li key={i}><Check size={16} className="pr-check" /> {f}</li>
                ))}
              </ul>

              <p className="pr-best-for"><BookOpen size={14} /> {plan.bestFor}</p>

              <button
                className={`pr-btn ${plan.id === 'gold' ? 'pr-btn-dark' : plan.id === 'silver' ? 'pr-btn-gold' : 'pr-btn-outline'}`}
                disabled={isCurrent || isPending}
                onClick={() => handleChoosePlan(plan)}
              >
                {isCurrent ? '✓ Current Plan' : isPending ? '⏳ Pending Verification' : (
                  <>Upgrade to {plan.label} <ArrowRight size={18} className="pr-arrow" /></>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* UPI PAYMENT MODAL */}
      {upiModal.show && (
        <div className="pr-modal-overlay">
          <div className="pr-modal">
            <button className="pr-close" onClick={() => setUpiModal({ show: false, plan: null })}><X size={24} /></button>

            <div className="pr-modal-head">
              <div className="pr-modal-icon">{upiModal.isTrial ? <Sparkles size={32} /> : <Smartphone size={32} />}</div>
              <h3>{upiModal.isTrial ? 'Activate Free Trial' : 'Complete Payment'}</h3>
              <p>
                {upiModal.isTrial 
                  ? `Get 30 days of ${upiModal.plan?.label} features for FREE.` 
                  : `Upgrade to ${upiModal.plan?.label} — ₹${upiAmount.toLocaleString()}${upiModal.plan?.period}`}
              </p>
            </div>

            {upiModal.isTrial ? (
              <div style={{ padding: '1rem 0', textAlign: 'center' }}>
                <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22C55E', padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem' }}>
                  <CheckCircle size={40} style={{ marginBottom: '1rem' }} />
                  <h4 style={{ margin: 0, fontSize: '1.2rem' }}>Ready to Scale?</h4>
                  <p style={{ margin: '0.5rem 0 0', opacity: 0.8, fontSize: '0.9rem' }}>You won't be charged for the first 30 days. You can cancel or change plans anytime.</p>
                </div>
                <button className="pr-btn pr-btn-gold pr-full" onClick={handleConfirmTrial} disabled={paying}>
                  {paying ? 'Activating...' : 'Start My 30-Day Free Trial'}
                </button>
              </div>
            ) : (
              <>
                <div className="pr-qr-wrap">
                  <img src={`https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(upiUrl)}&choe=UTF-8`} alt="QR" />
                  <div className="pr-qr-border"></div>
                </div>

                <div className="pr-pay-details">
                  <div className="pr-detail"><span>UPI ID</span><span className="pr-val">{MY_UPI_ID}</span></div>
                  <div className="pr-detail"><span>Amount</span><span className="pr-val pr-hl">₹{upiAmount.toLocaleString()}</span></div>
                  <div className="pr-detail"><span>Plan</span><span className="pr-val">{upiModal.plan?.label} ({upiModal.plan?.period?.replace('/', '').trim()})</span></div>
                </div>

                <a href={upiUrl} className="pr-btn pr-btn-gold pr-full" style={{ textDecoration: 'none', marginBottom: '1.5rem' }}>
                  Open UPI App (GPay / PhonePe)
                </a>

                <div className="pr-utr-box">
                  <label><Upload size={14} /> Enter Transaction ID (UTR)</label>
                  <input type="text" placeholder="12-digit reference number" value={txId} onChange={e => setTxId(e.target.value)} />
                  <p className="pr-hint">Required for manual verification by admin</p>
                </div>

                <button className="pr-btn pr-btn-gold pr-full" onClick={handleConfirmPayment} disabled={paying}>
                  {paying ? 'Submitting...' : 'Submit Payment Proof'}
                </button>
              </>
            )}

          </div>
        </div>
      )}

      <style>{BASE_CSS}</style>
    </div>
  );
}

const BASE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');

.pr-root {
  font-family: 'Outfit', sans-serif;
  background: #020617;
  color: #f8fafc;
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
  padding-bottom: 4rem;
}

.pr-bg { position: fixed; inset: 0; z-index: 0; overflow: hidden; }
.pr-blob { position: absolute; width: 600px; height: 600px; border-radius: 50%; filter: blur(80px); opacity: 0.12; animation: prMove 20s infinite alternate; }
.pr-blob1 { background: #F5C518; top: -10%; right: -10%; }
.pr-blob2 { background: #6366f1; bottom: -10%; left: -10%; animation-delay: -5s; }
.pr-blob3 { background: #ec4899; top: 30%; left: 20%; animation-delay: -10s; }
@keyframes prMove { from { transform: translate(0,0) scale(1); } to { transform: translate(100px,50px) scale(1.1); } }

.pr-nav { position: relative; z-index: 10; display: flex; justify-content: space-between; align-items: center; padding: 2rem 5%; }
.pr-logo { font-weight: 800; font-size: 1.5rem; }
.pr-logo span { color: #F5C518; }
.pr-logout { background: none; border: none; color: #64748b; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: 0.3s; }
.pr-logout:hover { color: #f8fafc; }

.pr-header { position: relative; z-index: 10; text-align: center; padding: 3rem 1rem 5rem; }
.pr-badge { display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(245,197,24,0.1); border: 1px solid rgba(245,197,24,0.2); color: #F5C518; padding: 0.5rem 1.2rem; border-radius: 99px; font-weight: 600; font-size: 0.8rem; margin-bottom: 2rem; }
.pr-header h1 { font-size: clamp(2.5rem,6vw,4.5rem); font-weight: 800; line-height: 1.1; margin: 0; }
.pr-header h1 span { color: #F5C518; }
.pr-header p { color: #94a3b8; font-size: 1.2rem; margin-top: 1.5rem; }

.pr-grid { position: relative; z-index: 10; display: grid; grid-template-columns: repeat(auto-fit,minmax(320px,1fr)); gap: 2rem; max-width: 1200px; margin: 0 auto; padding: 0 2rem; }

/* === FLEX CARD (White) === */
.pr-card.card-flex {
  background: rgba(255,255,255,0.97);
  color: #1e293b;
  border: 2px solid #D4A017;
  border-radius: 32px;
  padding: 3rem;
  transition: all 0.4s cubic-bezier(0.4,0,0.2,1);
  display: flex; flex-direction: column;
  position: relative;
}
.pr-card.card-flex .pr-check { color: #D4A017; }
.pr-card.card-flex .pr-tagline { color: #64748b; }
.pr-card.card-flex .pr-best-for { color: #64748b; }
.pr-card.card-flex .pr-currency { color: #D4A017; }
.pr-card.card-flex .pr-period { color: #94a3b8; }
.pr-card.card-flex .pr-features li { color: #334155; }
.pr-icon-box.card-flex { background: rgba(212,160,23,0.1); color: #D4A017; }

/* === SILVER CARD (Soft Yellow) === */
.pr-card.card-silver {
  background: linear-gradient(135deg, #FFF8E1 0%, #FFFDE7 50%, #FFF9C4 100%);
  color: #1e293b;
  border: 2px solid #F5C518;
  border-radius: 32px;
  padding: 3rem;
  transition: all 0.4s cubic-bezier(0.4,0,0.2,1);
  display: flex; flex-direction: column;
  position: relative;
  box-shadow: 0 0 60px rgba(245,197,24,0.15);
  transform: translateY(-10px);
}
.pr-card.card-silver .pr-check { color: #B45309; }
.pr-card.card-silver .pr-tagline { color: #92400e; }
.pr-card.card-silver .pr-best-for { color: #92400e; }
.pr-card.card-silver .pr-currency { color: #B45309; }
.pr-card.card-silver .pr-period { color: #78350f; }
.pr-card.card-silver .pr-features li { color: #451a03; }
.pr-icon-box.card-silver { background: rgba(180,83,9,0.1); color: #B45309; }

/* === GOLD CARD (Dark Matte) === */
.pr-card.card-gold {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
  color: #f8fafc;
  border: 2px solid rgba(212,160,23,0.4);
  border-radius: 32px;
  padding: 3rem;
  transition: all 0.4s cubic-bezier(0.4,0,0.2,1);
  display: flex; flex-direction: column;
  position: relative;
}
.pr-card.card-gold h3 { color: #D4A017; }
.pr-card.card-gold .pr-check { color: #F5C518; }
.pr-card.card-gold .pr-tagline { color: #94a3b8; }
.pr-card.card-gold .pr-best-for { color: #94a3b8; }
.pr-card.card-gold .pr-currency { color: #F5C518; }
.pr-card.card-gold .pr-period { color: #64748b; }
.pr-card.card-gold .pr-features li { color: #cbd5e1; }
.pr-icon-box.card-gold { background: rgba(245,197,24,0.1); color: #F5C518; }

.pr-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,0.3); }
.pr-card.pr-featured:hover { transform: translateY(-14px); }

.pr-ribbon {
  position: absolute; top: 1.5rem; right: 1.5rem;
  background: linear-gradient(135deg, #F5C518, #D4A017);
  color: #000; padding: 0.4rem 1rem; border-radius: 99px;
  font-weight: 800; font-size: 0.7rem; text-transform: uppercase;
  box-shadow: 0 4px 12px rgba(245,197,24,0.3);
  animation: prGlow 2s infinite ease-in-out;
}
.pr-ribbon-gold { background: linear-gradient(135deg, #D4A017, #92400e); color: #F5C518; }
@keyframes prGlow { 0%,100% { box-shadow: 0 4px 12px rgba(245,197,24,0.3); } 50% { box-shadow: 0 4px 24px rgba(245,197,24,0.6); } }

.pr-card-top { margin-bottom: 2rem; }
.pr-icon-box { width: 64px; height: 64px; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem; }
.pr-card-top h3 { font-size: 1.8rem; font-weight: 800; margin: 0 0 0.5rem; }
.pr-price { display: flex; align-items: baseline; gap: 0.25rem; margin-bottom: 0.5rem; }
.pr-currency { font-size: 1.5rem; font-weight: 600; }
.pr-amount { font-size: 3.5rem; font-weight: 800; line-height: 1; }
.pr-period { font-size: 0.85rem; margin-left: 0.25rem; }
.pr-tagline { font-size: 0.9rem; font-weight: 500; margin: 0; }

.pr-features { list-style: none; padding: 0; margin: 0 0 2rem; flex-grow: 1; display: flex; flex-direction: column; gap: 1rem; }
.pr-features li { display: flex; align-items: center; gap: 0.75rem; font-weight: 500; font-size: 0.95rem; }

.pr-best-for { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; font-weight: 600; margin: 0 0 1.5rem; padding: 0.75rem 1rem; border-radius: 12px; background: rgba(0,0,0,0.04); }

.pr-btn { width: 100%; padding: 1.1rem; border-radius: 16px; border: none; font-weight: 800; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.75rem; transition: all 0.3s; }
.pr-btn-gold { background: linear-gradient(135deg, #F5C518, #D4A017); color: #020617; }
.pr-btn-gold:hover { background: linear-gradient(135deg, #FFD700, #F5C518); transform: scale(1.02); box-shadow: 0 8px 24px rgba(245,197,24,0.3); }
.pr-btn-dark { background: linear-gradient(135deg, #D4A017, #92400e); color: #fff; }
.pr-btn-dark:hover { background: linear-gradient(135deg, #F5C518, #D4A017); color: #020617; transform: scale(1.02); }
.pr-btn-outline { background: rgba(212,160,23,0.08); border: 2px solid #D4A017; color: #D4A017; }
.pr-btn-outline:hover { background: #D4A017; color: #fff; }
.pr-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }
.pr-arrow { transition: transform 0.3s; }
.pr-btn:hover .pr-arrow { transform: translateX(5px); }

/* Modal */
.pr-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); backdrop-filter: blur(12px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
.pr-modal { background: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 40px; padding: 3rem; width: 100%; max-width: 460px; position: relative; animation: prSlide 0.5s cubic-bezier(0.2,1,0.2,1); }
@keyframes prSlide { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.pr-close { position: absolute; top: 2rem; right: 2rem; background: none; border: none; color: #64748b; cursor: pointer; }
.pr-modal-head { text-align: center; margin-bottom: 2rem; }
.pr-modal-icon { width: 80px; height: 80px; background: rgba(245,197,24,0.1); color: #F5C518; border-radius: 24px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; }
.pr-modal-head h3 { font-size: 1.8rem; font-weight: 800; margin: 0; color: #f8fafc; }
.pr-modal-head p { color: #94a3b8; margin-top: 0.5rem; }
.pr-modal-head strong { color: #F5C518; }

.pr-qr-wrap { position: relative; width: 220px; height: 220px; margin: 0 auto 2rem; background: #fff; padding: 10px; border-radius: 24px; }
.pr-qr-wrap img { width: 100%; height: 100%; }
.pr-qr-border { position: absolute; inset: -5px; border: 2px dashed #F5C518; border-radius: 28px; opacity: 0.3; animation: prSpin 10s linear infinite; }
@keyframes prSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.pr-pay-details { display: grid; gap: 0.75rem; margin-bottom: 1.5rem; }
.pr-detail { display: flex; justify-content: space-between; padding: 1rem 1.2rem; background: rgba(255,255,255,0.03); border-radius: 16px; font-size: 0.9rem; color: #94a3b8; }
.pr-val { font-weight: 700; color: #f8fafc; }
.pr-hl { color: #F5C518; font-size: 1.1rem; }

.pr-utr-box { margin-bottom: 1.5rem; }
.pr-utr-box label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #94a3b8; margin-bottom: 0.75rem; font-weight: 600; }
.pr-utr-box input { width: 100%; padding: 1.1rem; background: #1e293b; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; color: #fff; font-size: 1rem; outline: none; transition: 0.3s; box-sizing: border-box; }
.pr-utr-box input:focus { border-color: #F5C518; box-shadow: 0 0 0 4px rgba(245,197,24,0.1); }
.pr-hint { font-size: 0.75rem; color: #64748b; margin-top: 0.5rem; }
.pr-full { width: 100%; }

.pr-success-view { display: flex; align-items: center; justify-content: center; padding: 2rem; }
.pr-success-card { background: rgba(15,23,42,0.8); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 48px; padding: 4rem; text-align: center; max-width: 500px; animation: prScale 0.5s cubic-bezier(0.175,0.885,0.32,1.275); }
@keyframes prScale { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.pr-check-ring { width: 100px; height: 100px; background: rgba(34,197,94,0.1); color: #22c55e; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 2rem; border: 2px solid rgba(34,197,94,0.2); }
.pr-success-card h2 { font-size: 2.2rem; font-weight: 800; margin-bottom: 1.5rem; color: #f8fafc; }
.pr-success-card p { color: #94a3b8; line-height: 1.6; margin-bottom: 2.5rem; }

@media (max-width: 768px) {
  .pr-header { padding: 2rem 1.5rem 3rem; }
  .pr-grid { padding: 0 1rem; gap: 1.5rem; }
  .pr-card { padding: 2rem; }
  .pr-modal { padding: 2rem; border-radius: 28px; }
  .pr-card.card-silver { transform: none; }
}
`;
