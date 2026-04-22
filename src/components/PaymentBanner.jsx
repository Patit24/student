import React from 'react';
import { AlertTriangle, CreditCard } from 'lucide-react';

export default function PaymentBanner({ balance, dueDate }) {
  return (
    <div style={{
      background: 'linear-gradient(90deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))',
      border: '1px solid var(--danger)',
      borderRadius: 'var(--radius)',
      padding: '1rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '1.5rem',
      flexWrap: 'wrap',
      gap: '1rem',
      animation: 'fadeIn 0.4s ease'
    }}>
      <div className="flex items-center gap-3">
        <AlertTriangle size={24} color="var(--danger)" style={{ flexShrink: 0 }} />
        <div>
          <h4 style={{ color: 'var(--danger)', marginBottom: '0.2rem' }}>Payment Overdue</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Your tuition fee of <strong style={{ color: 'var(--text)' }}>₹{balance}</strong> was due on <strong style={{ color: 'var(--text)' }}>{dueDate}</strong>.
            Access to Notes, Live Classes, and Exams is currently restricted.
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            📱 An SMS reminder has been sent to your registered phone number.
          </p>
        </div>
      </div>
      <button className="btn btn-danger" style={{ flexShrink: 0 }}>
        <CreditCard size={16} /> Pay Now to Unlock
      </button>
    </div>
  );
}
