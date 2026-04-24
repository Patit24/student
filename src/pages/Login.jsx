import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AuthContext';
import { Shield, BookOpen, GraduationCap, Users, Zap, ChevronRight } from 'lucide-react';
import './Login.css';


function friendlyError(code) {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Incorrect mobile number or password.';
    case 'auth/invalid-email':      return 'Please enter a valid mobile number.';
    case 'auth/too-many-requests':  return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed': return 'Network error. Check your internet connection.';
    default: return `Login failed: ${code || 'unknown error'}. Check the console for details.`;
  }
}

const ROLE_META = {
  super_admin: { label: 'Admin', icon: Shield,          color: '#EF4444', path: '/admin'   },
  tutor:       { label: 'Tutor', icon: GraduationCap,   color: '#F5C518', path: '/tutor'   },
  student:     { label: 'Student', icon: Users,          color: '#22C55E', path: '/student' },
};

export default function Login() {
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [detectedRole, setDetectedRole] = useState(null); // animate role badge
  const { login } = useAppContext();
  const navigate  = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      setDetectedRole(null);
      const user = await login(phone, password);

      // Show detected-role animation then navigate
      const role = user?.role || 'student';
      setDetectedRole(role);

      setTimeout(() => {
        if (role === 'super_admin') navigate('/admin');
        else if (role === 'tutor' && user.subscription_status !== 'active') navigate('/pricing');
        else if (role === 'tutor') navigate('/tutor');
        else navigate('/student');
      }, 900);

    } catch (err) {
      console.error('Login error:', err);
      setError(friendlyError(err.code));
      setLoading(false);
    }
  }

  const prefill = (role) => {
    if (role === 'admin')   { setPhone('admin'); setPassword('MasterCS_2026!'); return; }
    if (role === 'overdue') { setPhone('9000000001');      setPassword('password123'); return; }
    if (role === 'tutor')   { setPhone('9876543210');      setPassword('password123'); return; }
    setPhone('9876543210');
    setPassword('password123');
  };

  const meta = detectedRole ? ROLE_META[detectedRole] : null;

  return (
    <div className="login-root">
      {/* Background orbs */}
      <div className="login-orb login-orb1" />
      <div className="login-orb login-orb2" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <BookOpen size={28} color="#F5C518" />
          <span>PPREducation</span>
        </div>

        <h2 className="login-title">Welcome Back</h2>
        <p className="login-sub">Sign in to your portal — your role is detected automatically.</p>

        {/* Role detection badge */}
        {detectedRole && meta && (
          <div className="login-role-badge" style={{ borderColor: meta.color, color: meta.color }}>
            <meta.icon size={16} />
            <span>Detected: <strong>{meta.label}</strong> — Redirecting…</span>
            <ChevronRight size={14} />
          </div>
        )}

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label>Mobile Number</label>
            <input
              id="login-phone"
              type="tel"
              className="input-field"
              required
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
            />
          </div>
          <div className="login-field">
            <label>Password</label>
            <input
              id="login-password"
              type="password"
              className="input-field"
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button
            id="login-submit"
            disabled={loading}
            type="submit"
            className="login-btn-primary"
          >
            {loading ? <span className="login-spinner" /> : <Zap size={16} />}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="login-signup-link">
          <Link to="/forgot-password" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Forgot Password?</Link>
          Don't have an account? <Link to="/signup" id="login-goto-signup">Sign Up</Link>
        </p>

        {/* Demo quick-fill */}
        <div className="login-demo-section">
          <p className="login-demo-label">⚡ Quick Demo Login</p>
          <div className="login-demo-btns">
            {[
              { id: 'demo-tutor',    label: 'Tutor',          role: 'tutor',   color: '#F5C518' },
              { id: 'demo-student',  label: 'Student ✓',      role: 'student', color: '#22C55E' },
              { id: 'demo-overdue',  label: 'Overdue Student',role: 'overdue', color: '#EF4444' },
              { id: 'demo-admin',    label: '🛡 Admin',        role: 'admin',   color: '#818CF8' },
            ].map(({ id, label, role, color }) => (
              <button
                key={id}
                id={id}
                onClick={() => prefill(role)}
                className="login-demo-btn"
                style={{ borderColor: color, color }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
