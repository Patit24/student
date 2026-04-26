import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AuthContext';
import { Shield, Check, Zap, LogOut, X, CheckCircle, Smartphone, QrCode, Crown, Sparkles, ArrowRight } from 'lucide-react';
import { useToast } from '../components/Toast';

const MY_UPI_ID = "9014842370@ybl";
const MY_NAME   = "PPREducation";

const PLANS = [
  {
    id: 'starter',
    label: 'Basic',
    priceINR: 0,
    period: '',
    tag: 'FREE',
    icon: Shield,
    color: '#94A3B8',
    gradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    features: [
      '1 Active Batch',
      '5 Students Limit',
      'Basic Performance Stats',
      'Community Support',
      'Cloud Storage (1GB)',
    ],
  },
  {
    id: 'growth',
    label: 'Growth',
    priceINR: 199,
    period: '/mo',
    tag: 'POPULAR',
    icon: Zap,
    color: '#F5C518',
    gradient: 'linear-gradient(135deg, #F5C518 0%, #B45309 100%)',
    features: [
      '5 Active Batches',
      '50 Students Limit',
      'Smart AI Exam Gen',
      'Live Streaming Access',
      'Priority Email Support',
    ],
  },
  {
    id: 'pro',
    label: 'Elite',
    priceINR: 399,
    period: '/mo',
    tag: 'BEST VALUE',
    icon: Crown,
    color: '#818CF8',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #312e81 100%)',
    features: [
      'Unlimited Batches',
      'Unlimited Students',
      'White-label Dashboard',
      'Custom Branding',
      '24/7 Dedicated Manager',
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
  const [hoveredPlan, setHoveredPlan] = useState(null);

  const handleLogout = async () => { await logout(); navigate('/'); };

  const handleSubscribe = async (plan) => {
    if (plan.priceINR === 0) {
      await updateTutorSubscription(plan.id);
      navigate('/tutor');
      return;
    }

    if (!currentUser) return navigate('/login');

    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!razorpayKey || razorpayKey === 'rzp_test_your_key_id') {
      return toast.error("Payment Gateway misconfigured. Please set a valid VITE_RAZORPAY_KEY_ID in environment variables.");
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      const options = {
        key: razorpayKey,
        amount: plan.priceINR * 100,
        currency: 'INR',
        name: 'PPREducation',
        description: `Upgrade to ${plan.label} Plan`,
        handler: async function(response) {
          try {
            setPaying(plan.id);
            await updateTutorSubscription(plan.id);
            setSuccess(true);
            toast.success(`${plan.label} Activation Successful! 🚀`);
            setTimeout(() => navigate('/tutor'), 3000);
          } catch (err) {
            toast.error("Activation failed: " + err.message);
          } finally {
            setPaying(null);
          }
        },
        prefill: {
          name: currentUser.name,
          contact: currentUser.phone
        },
        theme: { color: plan.color }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    };
    document.body.appendChild(script);
  };

  if (success) {
    return (
      <div className="new-pr-root success-view">
        <div className="success-card">
          <div className="check-ring"><CheckCircle size={48} /></div>
          <h2>Verification in Progress</h2>
          <p>We've received your transaction reference. Our team will activate your <strong>{PLANS.find(p => p.id === upiModal.plan?.id)?.label || 'Premium'}</strong> features within 60 minutes.</p>
          <button onClick={() => navigate('/tutor')} className="new-pr-btn primary">Go to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="new-pr-root">
      {/* Animated Background */}
      <div className="new-pr-bg">
        <div className="blob blob1"></div>
        <div className="blob blob2"></div>
        <div className="blob blob3"></div>
      </div>

      <nav className="new-pr-nav">
        <div className="logo">PPREducation</div>
        <button onClick={handleLogout} className="logout-link"><LogOut size={16} /> Logout</button>
      </nav>

      <header className="new-pr-header">
        <div className="badge"><Sparkles size={14} /> NEW LOWER PRICING</div>
        <h1>Elevate Your <span>Coaching Center</span></h1>
        <p>Choose the plan that fits your growth. Instant UPI activation.</p>
      </header>

      <div className="new-pr-grid">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isFeatured = plan.id === 'growth';
          const isCurrent = currentUser?.subscription_tier === plan.id || currentUser?.pending_plan === plan.id;
          
          return (
            <div 
              key={plan.id} 
              className={`new-pr-card ${isFeatured ? 'featured' : ''} ${hoveredPlan === plan.id ? 'hovered' : ''}`}
              onMouseEnter={() => setHoveredPlan(plan.id)}
              onMouseLeave={() => setHoveredPlan(null)}
              style={{ '--accent': plan.color }}
            >
              {isFeatured && <div className="popular-ribbon">Most Popular</div>}
              
              <div className="card-top">
                <div className="icon-box" style={{ background: `${plan.color}15`, color: plan.color }}>
                  <Icon size={28} />
                </div>
                <h3>{plan.label}</h3>
                <div className="price-tag">
                  {plan.priceINR === 0 ? <span className="amount">Free</span> : (
                    <>
                      <span className="currency">₹</span>
                      <span className="amount">{plan.priceINR}</span>
                      <span className="period">/mo</span>
                    </>
                  )}
                </div>
              </div>

              <ul className="feature-list">
                {plan.features.map((text, i) => (
                  <li key={i}><Check size={16} className="check" /> {text}</li>
                ))}
              </ul>

              <button 
                className={`new-pr-btn ${isFeatured ? 'primary' : 'outline'}`}
                disabled={isCurrent}
                onClick={() => handleSubscribe(plan)}
              >
                {isCurrent ? 'Current Plan' : (
                  <>
                    {plan.priceINR === 0 ? 'Start Learning' : `Get ${plan.label}`}
                    <ArrowRight size={18} className="arrow" />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* UPI MODAL */}
      {upiModal.show && (
        <div className="new-modal-overlay">
          <div className="new-modal-content">
            <button className="close-btn" onClick={() => setUpiModal({ ...upiModal, show: false })}><X size={24} /></button>
            
            <div className="modal-header">
              <div className="modal-icon"><Smartphone size={32} /></div>
              <h3>Complete Payment</h3>
              <p>Scan QR or pay via UPI ID below</p>
            </div>

            <div className="qr-container">
              <img src={`https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(upiModal.url)}&choe=UTF-8`} alt="QR" />
              <div className="qr-border"></div>
            </div>

            <div className="payment-details">
              <div className="detail-row">
                <span>UPI ID</span>
                <span className="val">{MY_UPI_ID}</span>
              </div>
              <div className="detail-row">
                <span>Amount</span>
                <span className="val highlight">₹{upiModal.plan?.priceINR}</span>
              </div>
            </div>

            <div className="utr-input-box">
              <label>Enter Transaction ID (UTR)</label>
              <input 
                type="text" 
                placeholder="12-digit reference number"
                value={txId}
                onChange={e => setTxId(e.target.value)}
              />
              <p className="hint">Required for manual verification</p>
            </div>

            <button 
              className="new-pr-btn primary full"
              onClick={handleConfirmPayment}
              disabled={paying}
            >
              {paying ? 'Verifying...' : 'Submit Payment Proof'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');

        .new-pr-root {
          font-family: 'Outfit', sans-serif;
          background: #020617;
          color: #f8fafc;
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
          padding-bottom: 4rem;
        }

        /* Animated Background */
        .new-pr-bg {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          z-index: 0;
          overflow: hidden;
        }
        .blob {
          position: absolute;
          width: 600px; height: 600px;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.15;
          animation: move 20s infinite alternate;
        }
        .blob1 { background: #F5C518; top: -10%; right: -10%; }
        .blob2 { background: #6366f1; bottom: -10%; left: -10%; animation-delay: -5s; }
        .blob3 { background: #ec4899; top: 30%; left: 20%; animation-delay: -10s; }

        @keyframes move {
          from { transform: translate(0, 0) scale(1); }
          to { transform: translate(100px, 50px) scale(1.1); }
        }

        .new-pr-nav {
          position: relative; z-index: 10;
          display: flex; justify-content: space-between; align-items: center;
          padding: 2rem 5%;
        }
        .new-pr-nav .logo { font-weight: 800; fontSize: 1.5rem; letterSpacing: -0.03em; }
        .new-pr-nav .logo span { color: #F5C518; }
        .logout-link { background: none; border: none; color: #64748b; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: 0.3s; }
        .logout-link:hover { color: #f8fafc; }

        .new-pr-header {
          position: relative; z-index: 10;
          text-align: center;
          padding: 4rem 1rem 6rem;
        }
        .new-pr-header .badge {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: rgba(245,197,24,0.1); border: 1px solid rgba(245,197,24,0.2);
          color: #F5C518; padding: 0.5rem 1.2rem; border-radius: 99px;
          font-weight: 600; font-size: 0.8rem; margin-bottom: 2rem;
        }
        .new-pr-header h1 { font-size: clamp(2.5rem, 6vw, 4.5rem); font-weight: 800; line-height: 1.1; margin: 0; }
        .new-pr-header h1 span { color: #F5C518; }
        .new-pr-header p { color: #94a3b8; font-size: 1.2rem; margin-top: 1.5rem; }

        .new-pr-grid {
          position: relative; z-index: 10;
          display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2rem; max-width: 1200px; margin: 0 auto; padding: 0 2rem;
        }

        .new-pr-card {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 32px;
          padding: 3rem;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex; flex-direction: column;
          position: relative;
        }
        .new-pr-card.featured { border: 2px solid #F5C518; transform: translateY(-10px); }
        .new-pr-card.hovered { border-color: var(--accent); transform: translateY(-5px); box-shadow: 0 20px 40px -15px rgba(0,0,0,0.5); }

        .popular-ribbon {
          position: absolute; top: 1.5rem; right: 1.5rem;
          background: #F5C518; color: #000;
          padding: 0.4rem 1rem; border-radius: 99px;
          font-weight: 800; font-size: 0.7rem; text-transform: uppercase;
        }

        .card-top { margin-bottom: 2.5rem; }
        .icon-box { width: 64px; height: 64px; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 2rem; }
        .card-top h3 { font-size: 1.8rem; font-weight: 700; margin-bottom: 0.5rem; }
        .price-tag { display: flex; align-items: baseline; gap: 0.25rem; }
        .currency { font-size: 1.5rem; color: #F5C518; font-weight: 600; }
        .amount { font-size: 3.5rem; font-weight: 800; }
        .period { color: #64748b; font-size: 1rem; }

        .feature-list { list-style: none; padding: 0; margin: 0 0 3rem 0; flex-grow: 1; display: flex; flex-direction: column; gap: 1.2rem; }
        .feature-list li { display: flex; align-items: center; gap: 1rem; color: #cbd5e1; font-weight: 500; }
        .feature-list li .check { color: var(--accent); }

        .new-pr-btn {
          width: 100%; padding: 1.2rem; border-radius: 16px; border: none;
          font-weight: 800; font-size: 1rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 0.75rem;
          transition: all 0.3s;
        }
        .new-pr-btn.primary { background: #F5C518; color: #020617; }
        .new-pr-btn.primary:hover { background: #fff; transform: scale(1.02); }
        .new-pr-btn.outline { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); color: #fff; }
        .new-pr-btn.outline:hover { background: rgba(255,255,255,0.08); border-color: #fff; }
        .new-pr-btn .arrow { transition: transform 0.3s; }
        .new-pr-btn:hover .arrow { transform: translateX(5px); }
        .new-pr-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Modal */
        .new-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.9);
          backdrop-filter: blur(12px); z-index: 1000;
          display: flex; align-items: center; justify-content: center; padding: 1.5rem;
        }
        .new-modal-content {
          background: #0f172a; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 40px; padding: 3rem; width: 100%; max-width: 450px;
          position: relative; animation: slideUp 0.5s cubic-bezier(0.2, 1, 0.2, 1);
        }
        @keyframes slideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        .close-btn { position: absolute; top: 2rem; right: 2rem; background: none; border: none; color: #64748b; cursor: pointer; }
        .modal-header { text-align: center; margin-bottom: 2.5rem; }
        .modal-icon { width: 80px; height: 80px; background: rgba(245,197,24,0.1); color: #F5C518; border-radius: 24px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; }
        .modal-header h3 { font-size: 1.8rem; font-weight: 800; margin: 0; }
        .modal-header p { color: #64748b; margin-top: 0.5rem; }

        .qr-container { position: relative; width: 220px; height: 220px; margin: 0 auto 2.5rem; background: #fff; padding: 10px; border-radius: 24px; }
        .qr-container img { width: 100%; height: 100%; }
        .qr-border { position: absolute; inset: -5px; border: 2px dashed #F5C518; border-radius: 28px; opacity: 0.3; animation: spin 10s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .payment-details { display: grid; gap: 0.75rem; margin-bottom: 2.5rem; }
        .detail-row { display: flex; justify-content: space-between; padding: 1.2rem; background: rgba(255,255,255,0.03); border-radius: 16px; font-size: 0.9rem; }
        .detail-row span:first-child { color: #64748b; }
        .detail-row .val { font-weight: 700; color: #f8fafc; }
        .detail-row .highlight { color: #F5C518; font-size: 1.1rem; }

        .utr-input-box label { display: block; font-size: 0.85rem; color: #64748b; margin-bottom: 0.75rem; font-weight: 600; }
        .utr-input-box input { width: 100%; padding: 1.2rem; background: #1e293b; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; color: #fff; font-size: 1.1rem; margin-bottom: 0.5rem; outline: none; transition: 0.3s; }
        .utr-input-box input:focus { border-color: #F5C518; box-shadow: 0 0 0 4px rgba(245,197,24,0.1); }
        .utr-input-box .hint { font-size: 0.75rem; color: #64748b; }

        .success-view { display: flex; align-items: center; justify-content: center; padding: 2rem; }
        .success-card { background: rgba(15,23,42,0.8); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 48px; padding: 4rem; text-align: center; max-width: 500px; animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes scaleIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .check-ring { width: 100px; height: 100px; background: rgba(34,197,94,0.1); color: #22c55e; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 2rem; border: 2px solid rgba(34,197,94,0.2); }
        .success-card h2 { font-size: 2.2rem; font-weight: 800; margin-bottom: 1.5rem; }
        .success-card p { color: #94a3b8; line-height: 1.6; margin-bottom: 2.5rem; }

        @media (max-width: 768px) {
          .new-pr-header { padding: 3rem 1.5rem; }
          .new-pr-grid { padding: 0 1.5rem; }
          .new-pr-card { padding: 2rem; }
          .new-modal-content { padding: 2rem; }
        }
      `}</style>
    </div>
  );
}
