/**
 * SubscriptionGuard
 *
 * Wraps any feature that requires an active tutor subscription.
 * Shows a locked overlay with upgrade CTA instead of the feature content
 * if the tutor's subscription is inactive or expired.
 *
 * Usage:
 *   <SubscriptionGuard feature="PDF Upload">
 *     <TutorMaterialsPanel ... />
 *   </SubscriptionGuard>
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Zap } from 'lucide-react';
import { useAppContext } from '../context/AuthContext';

function isSubscriptionActive(user) {
  if (!user) return false;

  // Starter / free plan — always active (limited features)
  if (user.subscription_tier === 'starter' || user.subscription_tier === 'free') return true;

  // Check is_subscribed flag
  if (!user.is_subscribed && user.subscription_status !== 'active') return false;

  // Check expiry if present
  if (user.subscription_expiry) {
    const expiry = new Date(user.subscription_expiry);
    if (expiry < new Date()) return false;
  }

  // Active if status is 'active'
  return user.subscription_status === 'active';
}

export function useSubscription() {
  const { currentUser } = useAppContext();
  return {
    isActive: isSubscriptionActive(currentUser),
    tier:     currentUser?.subscription_tier || null,
    expiry:   currentUser?.subscription_expiry || null,
  };
}

export default function SubscriptionGuard({ children, feature = 'this feature', requiredTier = 'growth' }) {
  const { currentUser, isMockMode } = useAppContext();
  const navigate = useNavigate();

  // Mock mode — always show content (demo experience)
  if (isMockMode) return children;

  const active = isSubscriptionActive(currentUser);
  if (active) return children;

  // ── Locked overlay ───────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'relative',
      minHeight: '200px',
      borderRadius: '16px',
      overflow: 'hidden',
    }}>
      {/* Blurred background hint of the content */}
      <div style={{
        filter: 'blur(6px)',
        opacity: 0.25,
        pointerEvents: 'none',
        userSelect: 'none',
      }}>
        {children}
      </div>

      {/* Lock overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(7,9,15,0.75)',
        backdropFilter: 'blur(4px)',
        borderRadius: '16px',
        border: '1px solid rgba(245,197,24,0.2)',
        gap: '0.75rem',
        padding: '2rem',
        textAlign: 'center',
      }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '50%',
          background: 'rgba(245,197,24,0.1)',
          border: '1px solid rgba(245,197,24,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Lock size={22} color="#F5C518" />
        </div>

        <div>
          <p style={{ fontWeight: 700, color: '#F0F4FF', margin: '0 0 0.25rem', fontSize: '1rem' }}>
            {feature} is Locked
          </p>
          <p style={{ fontSize: '0.8rem', color: '#7A8BA8', margin: 0 }}>
            Upgrade to <strong style={{ color: '#F5C518', textTransform: 'capitalize' }}>{requiredTier}</strong> plan to unlock this feature.
          </p>
        </div>

        <button
          onClick={() => navigate('/pricing')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.6rem 1.4rem',
            background: '#F5C518', color: '#07090F',
            border: 'none', borderRadius: '9px',
            fontWeight: 800, fontSize: '0.85rem',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(245,197,24,0.35)',
          }}
        >
          <Zap size={15} /> Upgrade Now
        </button>
      </div>
    </div>
  );
}
