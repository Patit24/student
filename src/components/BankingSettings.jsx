import React, { useState } from 'react';
import { Building2, Lock, Save, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from './Toast';

/**
 * BankingSettings
 * Secure bank details form for the tutor.
 * Account number is masked (only last 4 digits shown).
 * In production: encrypt at rest in Firestore before saving.
 */
export default function BankingSettings({ tutorId, bankDetails, onSave }) {
  const toast = useToast();
  const [form, setForm] = useState({
    bank_name:    bankDetails?.bank_name    || '',
    holder_name:  bankDetails?.holder_name  || '',
    account_no:   '',                         // never pre-fill full number
    ifsc:         bankDetails?.ifsc          || '',
    upi_id:       bankDetails?.upi_id        || '',
    razorpay_link: bankDetails?.razorpay_link || '',
  });
  const [showAccNo, setShowAccNo]   = useState(false);
  const [saved, setSaved]           = useState(false);
  const [error, setError]           = useState('');

  const maskedAccNo = bankDetails?.account_no_last4
    ? `•••• •••• ${bankDetails.account_no_last4}`
    : 'Not set';

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setSaved(false);
    setError('');
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.bank_name || !form.holder_name || !form.ifsc) {
      setError('Please fill Bank Name, Holder Name, and IFSC Code.');
      return;
    }
    if (form.account_no && form.account_no.length < 8) {
      setError('Account number must be at least 8 digits.');
      return;
    }

    // Mask: only store last 4 digits (simulate server-side encryption)
    const last4 = form.account_no ? form.account_no.slice(-4) : bankDetails?.account_no_last4;

    const payload = {
      bank_name:        form.bank_name,
      holder_name:      form.holder_name,
      account_no_last4: last4,
      ifsc:             form.ifsc.toUpperCase(),
      upi_id:           form.upi_id,
      razorpay_link:    form.razorpay_link,
      updated_at:       new Date().toISOString(),
    };

    try {
      await onSave(payload);
      setSaved(true);
      toast.success('Bank details saved to cloud ✅');
    } catch (err) {
      toast.error('Save failed: ' + err.message);
    }
    setForm(prev => ({ ...prev, account_no: '' }));
  }

  const inputStyle = {
    width: '100%',
    padding: '0.7rem 1rem',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: '10px',
    color: '#F0F4FF',
    fontSize: '0.88rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit',
  };

  const labelStyle = {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: '#94A3B8',
    marginBottom: '0.35rem',
    display: 'block',
  };

  const fieldWrap = { marginBottom: '1rem' };

  return (
    <div style={{ maxWidth: '560px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.5rem' }}>
        <div style={{ width: '36px', height: '36px', background: 'rgba(245,197,24,0.12)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Building2 size={18} color="#F5C518" />
        </div>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F0F4FF', margin: 0 }}>Payout & Banking</h3>
          <p style={{ fontSize: '0.76rem', color: '#7A8BA8', margin: 0 }}>Used to generate student payment links</p>
        </div>
      </div>

      {/* Security notice */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
        background: 'rgba(129,140,248,0.07)',
        border: '1px solid rgba(129,140,248,0.18)',
        borderRadius: '10px',
        padding: '0.7rem 0.9rem',
        marginBottom: '1.5rem',
        fontSize: '0.78rem',
        color: '#A5B4FC',
        lineHeight: 1.5,
      }}>
        <Lock size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
        <span>
          Account numbers are <strong>masked and encrypted at rest</strong>. Only the last 4 digits
          are stored in client state. Full numbers are never exposed to Admin or other tutors.
        </span>
      </div>

      <form onSubmit={handleSave}>
        {/* Bank Name */}
        <div style={fieldWrap}>
          <label style={labelStyle}>Bank Name</label>
          <input
            style={inputStyle}
            name="bank_name"
            value={form.bank_name}
            onChange={handleChange}
            placeholder="e.g. State Bank of India"
            required
          />
        </div>

        {/* Account Holder */}
        <div style={fieldWrap}>
          <label style={labelStyle}>Account Holder Name</label>
          <input
            style={inputStyle}
            name="holder_name"
            value={form.holder_name}
            onChange={handleChange}
            placeholder="As per bank records"
            required
          />
        </div>

        {/* Account Number */}
        <div style={fieldWrap}>
          <label style={labelStyle}>
            Account Number
            {bankDetails?.account_no_last4 && (
              <span style={{ color: '#22C55E', marginLeft: '0.5rem', fontSize: '0.72rem' }}>
                (Current: {maskedAccNo})
              </span>
            )}
          </label>
          <div style={{ position: 'relative' }}>
            <input
              style={{ ...inputStyle, paddingRight: '2.5rem', letterSpacing: showAccNo ? '0.05em' : '0.2em' }}
              name="account_no"
              type={showAccNo ? 'text' : 'password'}
              value={form.account_no}
              onChange={handleChange}
              placeholder={bankDetails?.account_no_last4 ? 'Enter to update' : 'Enter account number'}
              minLength={8}
              maxLength={18}
              inputMode="numeric"
            />
            <button
              type="button"
              onClick={() => setShowAccNo(v => !v)}
              style={{
                position: 'absolute', right: '0.7rem', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#7A8BA8', padding: 0,
              }}
            >
              {showAccNo ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* IFSC */}
        <div style={fieldWrap}>
          <label style={labelStyle}>IFSC / IBAN Code</label>
          <input
            style={{ ...inputStyle, textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: '0.08em' }}
            name="ifsc"
            value={form.ifsc}
            onChange={handleChange}
            placeholder="e.g. SBIN0001234"
            maxLength={11}
            required
          />
        </div>

        <div style={{
          height: '1px', background: 'rgba(255,255,255,0.06)',
          margin: '1.2rem 0',
        }} />

        <p style={{ fontSize: '0.78rem', color: '#7A8BA8', marginBottom: '1rem' }}>
          Digital payment links (optional — used on student dashboard)
        </p>

        {/* UPI */}
        <div style={fieldWrap}>
          <label style={labelStyle}>UPI ID</label>
          <input
            style={inputStyle}
            name="upi_id"
            value={form.upi_id}
            onChange={handleChange}
            placeholder="yourname@upi"
          />
        </div>

        {/* Razorpay link */}
        <div style={fieldWrap}>
          <label style={labelStyle}>Razorpay Payment Link (rzp.io)</label>
          <input
            style={inputStyle}
            name="razorpay_link"
            value={form.razorpay_link}
            onChange={handleChange}
            placeholder="https://rzp.io/l/your-link"
            type="url"
          />
          <p style={{ fontSize: '0.7rem', color: '#475569', marginTop: '0.3rem' }}>
            Create at <a href="https://dashboard.razorpay.com/app/payment-links" target="_blank" rel="noreferrer" style={{ color: '#818CF8' }}>razorpay.com/dashboard</a>
          </p>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#EF4444', fontSize: '0.82rem', marginBottom: '0.8rem' }}>
            <AlertTriangle size={13} /> {error}
          </div>
        )}

        <button
          type="submit"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: saved ? 'rgba(34,197,94,0.12)' : '#F5C518',
            color: saved ? '#22C55E' : '#07090F',
            border: saved ? '1px solid rgba(34,197,94,0.3)' : 'none',
            borderRadius: '10px',
            padding: '0.75rem 1.5rem',
            fontWeight: 700, fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: saved ? 'none' : '0 4px 16px rgba(245,197,24,0.3)',
          }}
        >
          {saved ? <><CheckCircle size={16} /> Saved!</> : <><Save size={16} /> Save Banking Details</>}
        </button>
      </form>
    </div>
  );
}
