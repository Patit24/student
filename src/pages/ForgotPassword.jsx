import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AuthContext';
import { Phone, ChevronLeft, CheckCircle, Shield, Key, Lock, Eye, EyeOff, Zap } from 'lucide-react';
import { useToast } from '../components/Toast';

export default function ForgotPassword() {
  const { sendOTP, verifyOTP, updateUserPassword, isMockMode } = useAppContext();
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Phone, 2: OTP, 3: Reset
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (phone.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    try {
      await sendOTP(phone, 'recaptcha-forgot-container');
      setStep(2);
      toast.success('OTP sent to ' + phone);
    } catch (err) {
      toast.error('Failed to send OTP: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length < 6) return;
    setLoading(true);
    try {
      await verifyOTP(otp);
      setStep(3);
      toast.success('Identity verified! Please set your new password.');
    } catch (err) {
      setError('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Note: In a production environment with virtual emails, 
      // this would call a secure backend function to update the auth password.
      await updateUserPassword(newPassword);
      toast.success('Password updated successfully! ✅');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      toast.error('Reset failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex justify-center items-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
      <div id="recaptcha-forgot-container"></div>
      
      <div className="glass-panel p-8 w-full animate-fade-in" style={{ maxWidth: '450px', border: '1px solid var(--primary)' }}>
        <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '2rem', textDecoration: 'none' }}>
          <ChevronLeft size={16} /> Back to Login
        </Link>

        {step === 1 && (
          <div className="animate-slide-up">
            <h2 className="mb-2">Forgot Password?</h2>
            <p className="text-muted mb-8" style={{ fontSize: '0.9rem' }}>
              No worries! Enter your registered mobile number and we'll verify your identity via OTP.
            </p>

            <form onSubmit={handleSendOTP} className="flex-col gap-5">
              <div className="input-group">
                <label className="input-label">Mobile Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="tel" className="input-field" placeholder="9876543210" required
                    style={{ paddingLeft: '3rem' }}
                    value={phone} onChange={e => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="animate-slide-up text-center">
            <div style={{ width: '64px', height: '64px', background: 'rgba(79,70,229,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Shield size={32} color="var(--primary)" />
            </div>
            <h2 className="mb-2">Verify Identity</h2>
            <p className="text-muted mb-8" style={{ fontSize: '0.9rem' }}>
              Enter the 6-digit code sent to <strong>{phone}</strong>
            </p>

            <form onSubmit={handleVerify} className="flex-col gap-5">
              <input 
                type="text" className="input-field text-center" placeholder="000000" maxLength={6} required
                style={{ fontSize: '1.5rem', letterSpacing: '0.5rem', background: 'rgba(79,70,229,0.05)' }}
                value={otp} onChange={e => setOtp(e.target.value)}
              />
              {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</p>}
              
              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <button type="button" className="btn-link" style={{ fontSize: '0.85rem' }} onClick={() => setStep(1)}>
                Change Number?
              </button>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="animate-slide-up">
            <h2 className="mb-2">New Password</h2>
            <p className="text-muted mb-8" style={{ fontSize: '0.9rem' }}>
              Identity verified! Now create a new secure password for your account.
            </p>

            <form onSubmit={handleResetPassword} className="flex-col gap-5">
              <div className="input-group">
                <label className="input-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className="input-field" 
                    placeholder="Minimum 6 characters" 
                    required
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)}
                    style={{ paddingRight: '45px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#7A8BA8', cursor: 'pointer', display: 'flex' }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Confirm New Password</label>
                <input 
                  type="password" className="input-field" placeholder="Repeat password" required
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading ? 'Updating...' : 'Reset Password & Login'}
              </button>
            </form>
          </div>
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
