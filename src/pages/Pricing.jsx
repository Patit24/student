/**
 * Pricing.jsx — Antigravity Tuition OS
 *
 * Flow:
 *   1. Tutor clicks "Subscribe"
 *   2. Frontend calls /api/create-order on our Express server
 *   3. Server creates a Razorpay order and returns order_id
 *   4. Razorpay Checkout opens with that order_id
 *   5. On payment.success → handler calls /api/verify-payment (optional client-side confirm)
 *   6. Razorpay Webhook (server-side) → updates Firestore + RTDB with is_subscribed: true
 *   7. AuthContext onSnapshot listener hydrates the dashboard — no manual refresh needed
 *
 * If the server is not running / not configured → falls back to demo mode.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AuthContext';
import { Check, X, Zap, Crown, Shield, LogOut, CheckCircle } from 'lucide-react';
import './Pricing.css';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';
// Add trailing slash removal to ensure consistent URL concatenation
const cleanApiUrl = SERVER_URL.replace(/\/$/, "");

const PLANS = [
  {
    id: 'starter',
    label: 'Starter',
    price: 0,
    priceINR: 0,
    period: '/mo',
    tag: null,
    icon: Shield,
    color: '#7A8BA8',
    features: [
      { text: '1 Batch',            ok: true  },
      { text: 'Up to 5 Students',   ok: true  },
      { text: 'Live Streaming',     ok: true  },
      { text: 'PDF Uploads',        ok: false },
      { text: 'AI Exam Engine',     ok: false },
      { text: 'Cloud Recordings',   ok: false },
      { text: 'Fee Guard System',   ok: false },
    ],
  },
  {
    id: 'growth',
    label: 'Growth',
    price: 29,
    priceINR: 2499,
    period: '/mo',
    tag: 'MOST POPULAR',
    icon: Zap,
    color: '#F5C518',
    features: [
      { text: '5 Batches',          ok: true  },
      { text: 'Up to 50 Students',  ok: true  },
      { text: 'Live Streaming',     ok: true  },
      { text: 'PDF Uploads',        ok: true  },
      { text: 'AI Exam Engine',     ok: true  },
      { text: 'Cloud Recordings',   ok: false },
      { text: 'Fee Guard System',   ok: true  },
    ],
  },
  {
    id: 'pro',
    label: 'Pro',
    price: 99,
    priceINR: 7999,
    period: '/mo',
    tag: 'UNLIMITED',
    icon: Crown,
    color: '#818CF8',
    features: [
      { text: 'Unlimited Batches',  ok: true },
      { text: 'Unlimited Students', ok: true },
      { text: 'Live Streaming',     ok: true },
      { text: 'PDF Uploads',        ok: true },
      { text: 'AI Exam Engine',     ok: true },
      { text: 'Cloud Recordings',   ok: true },
      { text: 'Fee Guard System',   ok: true },
    ],
  },
];

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Pricing() {
  const { updateTutorSubscription, logout, currentUser, isMockMode } = useAppContext();
  const navigate = useNavigate();

  const [paying,       setPaying]       = useState(null);
  const [rzpError,     setRzpError]     = useState('');
  const [serverOnline, setServerOnline] = useState(false);
  const [success,      setSuccess]      = useState(false); // post-payment success state

  // USER REQUIREMENT 4: Retry connection if first attempt fails (Cold Start handling)
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 2;

    const checkHealth = () => {
      fetch(`${cleanApiUrl}/api/health`, { signal: AbortSignal.timeout(5000) })
        .then(r => r.json())
        .then(d => {
          setServerOnline(d.razorpay === true);
          setLoadingServer(false);
        })
        .catch(() => {
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(checkHealth, 2000); // 2s delay between retries
          } else {
            setServerOnline(false);
            setLoadingServer(false);
          }
        });
    };

    checkHealth();
  }, [cleanApiUrl]);

  // Removed auto-redirect to allow upgrades/plan changes
  /* 
  useEffect(() => {
    if (currentUser?.subscription_status === 'active' && !success) {
      navigate('/tutor');
    }
  }, [currentUser, navigate, success]);
  */

  const handleLogout = async () => { await logout(); navigate('/'); };

  const handleSubscribe = async (plan) => {
    setRzpError('');
    setPaying(plan.id);

    // ── Starter (free) ───────────────────────────────────────────────────────
    if (plan.priceINR === 0) {
      await updateTutorSubscription(plan.id);
      navigate('/tutor');
      return;
    }

    // ── Real payment via server ───────────────────────────────────────────────
    if (isMockMode) {
      toast.info("Demo Mode: Subscribing instantly...");
      await updateTutorSubscription(plan.id);
      setSuccess(true);
      setTimeout(() => navigate('/tutor'), 2000);
      return;
    }

    if (!serverOnline) {
      setRzpError('Payment server is offline. Please try again in a few minutes.');
      setPaying(null);
      return;
    }
    const sdkLoaded = await loadRazorpay();
    if (!sdkLoaded) {
      setRzpError('Razorpay SDK failed to load. Check your internet connection.');
      setPaying(null);
      return;
    }

    let orderData;
    try {
      const res = await fetch(`${cleanApiUrl}/api/resume/create-order`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          amount_inr: plan.priceINR,
          tutor_id:   currentUser?.uid,
          plan_id:    plan.id,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Server error');
      }
      orderData = await res.json();
    } catch (err) {
      setRzpError(`Could not create order: ${err.message}`);
      setPaying(null);
      return;
    }

    const options = {
      key:      orderData.key_id,
      order_id: orderData.order_id,
      amount:   orderData.amount,
      currency: orderData.currency,
      name:     'Antigravity Tuition OS',
      description: `${plan.label} Plan — Monthly Subscription`,

      handler: async function (response) {
        /**
         * Client-side success handler.
         * The webhook will also fire server-side for reliability.
         * Here we optimistically update the UI so the tutor
         * doesn't wait for the webhook round-trip.
         */
        console.log('✅ Payment captured:', response);
        await updateTutorSubscription(plan.id);
        setSuccess(true);
        setTimeout(() => navigate('/tutor'), 2000);
      },

      prefill: {
        name:  currentUser?.name  || '',
        email: currentUser?.email || '',
      },
      theme:  { color: plan.color },
      modal:  { ondismiss: () => setPaying(null) },

      notes: { tutor_id: currentUser?.uid },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (resp) => {
      setRzpError(`Payment failed: ${resp.error.description}`);
      setPaying(null);
    });
    rzp.open();
  };

  // ── Post-payment success screen ──────────────────────────────────────────
  if (success) {
    return (
      <div className="pr-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'rgba(34,197,94,0.15)', border: '2px solid #22C55E',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}>
            <CheckCircle size={40} color="#22C55E" />
          </div>
          <h2 style={{ color: '#F0F4FF', marginBottom: '0.5rem' }}>Payment Successful! 🎉</h2>
          <p style={{ color: '#7A8BA8' }}>Your dashboard is being activated…</p>
          <div style={{ marginTop: '1rem' }}>
            <span className="pr-spinner" style={{ display: 'inline-block' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pr-root">
      <div className="pr-orb pr-orb1" />
      <div className="pr-orb pr-orb2" />

      <div className="pr-header">
        <div className="pr-header-badge">
          <Crown size={14} /> Tutor Subscription
        </div>
        <h1>Choose Your <span className="pr-yellow">Teaching Plan</span></h1>
        <p>Your dashboard is ready. Select a plan to unlock your full coaching center.</p>

        {/* Server status pill */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.3rem 0.8rem', borderRadius: '999px', fontSize: '0.75rem',
          marginTop: '0.5rem',
          background: 'rgba(34,197,94,0.1)',
          border: '1px solid rgba(34,197,94,0.3)',
          color: '#22C55E',
        }}>
          <Shield size={16} /> 🔒 Secure Checkout
        </div>

        <button className="pr-logout-btn" onClick={handleLogout} id="pricing-logout">
          <LogOut size={14} /> Log Out
        </button>
      </div>

      <div className="pr-grid">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isPopular = plan.id === 'growth';
          const isCurrent = currentUser?.subscription_tier === plan.id;
          return (
            <div
              key={plan.id}
              className={`pr-card ${isPopular ? 'pr-card-featured' : ''}`}
              style={{ '--plan-color': plan.color }}
            >
              {plan.tag && (
                <div className="pr-card-tag" style={{ background: plan.color, color: plan.id === 'growth' ? '#07090F' : '#fff' }}>
                  {plan.tag}
                </div>
              )}
              <div className="pr-card-icon" style={{ background: `${plan.color}18`, color: plan.color }}>
                <Icon size={24} />
              </div>
              <h3 className="pr-plan-name">{plan.label}</h3>
              <div className="pr-price">
                {plan.priceINR === 0
                  ? <span className="pr-price-num">Free</span>
                  : <>
                      <span className="pr-price-sym">₹</span>
                      <span className="pr-price-num">{plan.priceINR.toLocaleString()}</span>
                      <span className="pr-price-period">{plan.period}</span>
                    </>
                }
              </div>

              <ul className="pr-features">
                {plan.features.map((f, i) => (
                  <li key={i} className={f.ok ? 'pr-feat-ok' : 'pr-feat-no'}>
                    {f.ok
                      ? <Check size={14} color={plan.color} />
                      : <X     size={14} color="#475569" />
                    }
                    <span>{f.text}</span>
                  </li>
                ))}
              </ul>

              <button
                id={`pricing-buy-${plan.id}`}
                className="pr-buy-btn"
                style={{
                  background:  isPopular ? plan.color : 'transparent',
                  color:       isPopular ? '#07090F'  : plan.color,
                  borderColor: plan.color,
                  boxShadow:   isPopular ? `0 4px 20px ${plan.color}40` : 'none',
                  opacity:     isCurrent ? 0.6 : 1,
                }}
                disabled={paying === plan.id || isCurrent}
                onClick={() => handleSubscribe(plan)}
              >
                {paying === plan.id
                  ? <><span className="pr-spinner" /> Processing…</>
                  : isCurrent
                    ? '✓ Current Plan'
                    : plan.priceINR === 0
                      ? 'Start Free'
                      : currentUser?.subscription_status === 'active'
                        ? `Upgrade to ${plan.label}`
                        : `Subscribe — ₹${plan.priceINR.toLocaleString()}/mo`
                }
              </button>
            </div>
          );
        })}
      </div>

      {rzpError && (
        <div style={{ textAlign: 'center', marginTop: '1rem', color: '#EF4444', fontSize: '0.85rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '0.75rem' }}>
          ⚠️ {rzpError}
        </div>
      )}

      <p className="pricing-sub" style={{ marginBottom: '3rem' }}>
        Choose the plan that fits your tuition business. No hidden fees.
      </p>
    </div>
  );
}
