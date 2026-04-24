import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AuthContext';
import { Phone, ChevronLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '../components/Toast';

export default function ForgotPassword() {
  const { forgotPassword } = useAppContext();
  const toast = useToast();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone) return;
    setLoading(true);
    try {
      await forgotPassword(phone);
      setSent(true);
      toast.success('Reset instructions triggered for ' + phone);
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex justify-center items-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
      <div className="glass-panel p-8 w-full animate-fade-in" style={{ maxWidth: '450px' }}>
        <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '2rem', textDecoration: 'none' }}>
          <ChevronLeft size={16} /> Back to Login
        </Link>

        <h2 className="mb-2">Reset Password</h2>
        <p className="text-muted mb-8" style={{ fontSize: '0.9rem' }}>
          Enter your registered mobile number and we'll send you instructions to reset your password.
        </p>

        {sent ? (
          <div className="text-center p-6" style={{ background: 'rgba(16,185,129,0.05)', borderRadius: '15px', border: '1px solid rgba(16,185,129,0.2)' }}>
            <CheckCircle size={48} color="var(--secondary)" style={{ marginBottom: '1rem' }} />
            <h4 style={{ color: 'var(--secondary)' }}>Instructions Sent</h4>
            <p className="text-muted mt-2" style={{ fontSize: '0.85rem' }}>
              We've sent recovery instructions to <strong>{phone}</strong>.
            </p>
            <button className="btn btn-primary w-full mt-6" onClick={() => setSent(false)}>Resend</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-col gap-5">
            <div className="flex-col gap-2">
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Mobile Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="tel" className="input-field" placeholder="e.g. 9876543210" required
                  style={{ paddingLeft: '3rem' }}
                  value={phone} onChange={e => setPhone(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? 'Processing...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 text-center" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-muted" style={{ fontSize: '0.8rem' }}>
            Need help? Contact <a href="mailto:support@ppreducation.in" style={{ color: 'var(--primary)' }}>support@ppreducation.in</a>
          </p>
        </div>
      </div>
    </div>
  );
}
