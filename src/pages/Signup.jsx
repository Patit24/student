import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AuthContext';

export default function Signup() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'student';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(initialRole);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAppContext();
  const navigate = useNavigate();

  // Update role if query param changes
  useEffect(() => {
    const r = searchParams.get('role');
    if (r) setRole(r);
  }, [searchParams]);

  function friendlyError(code) {
    switch (code) {
      case 'auth/email-already-in-use':    return 'This mobile number is already registered. Try logging in.';
      case 'auth/invalid-email':           return 'Please enter a valid mobile number.';
      case 'auth/weak-password':           return 'Password must be at least 6 characters.';
      case 'auth/operation-not-allowed':   return 'Phone sign-in is not enabled. Please enable it in the Firebase Console.';
      case 'auth/network-request-failed':  return 'Network error. Check your internet connection.';
      case 'auth/configuration-not-found': return 'Firebase Auth is not configured properly.';
      default: return `Registration failed: ${code || 'unknown error'}.`;
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    try {
      setError('');
      setLoading(true);
      await signup(phone, password, role, name);
      navigate(role === 'tutor' ? '/pricing' : '/student');
    } catch (err) {
      console.error('Signup error:', err);
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container flex justify-center items-center h-screen animate-fade-in" style={{ height: 'calc(100vh - 80px)' }}>
      <div className="glass-panel p-8" style={{ width: '100%', maxWidth: '450px' }}>
        <h2 className="text-center mb-4">Create Account</h2>
        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        
        <form onSubmit={handleSubmit} className="flex-col">
          <div className="input-group flex" style={{ flexDirection: 'row', gap: '1rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
              <input type="radio" value="student" checked={role === 'student'} onChange={() => setRole('student')} />
              <span>Student</span>
            </label>
            <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
              <input type="radio" value="tutor" checked={role === 'tutor'} onChange={() => setRole('tutor')} />
              <span>Tutor</span>
            </label>
          </div>

          <div className="input-group">
            <label className="input-label">Full Name</label>
            <input 
              type="text" 
              className="input-field" 
              required 
              value={name} 
              onChange={e => setName(e.target.value)} 
            />
          </div>
          <div className="input-group">
            <label className="input-label">Mobile Number</label>
            <input 
              type="tel" 
              className="input-field" 
              required 
              placeholder="e.g. 9876543210"
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
            />
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <input 
              type="password" 
              className="input-field" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
            />
          </div>
          <button disabled={loading} type="submit" className="btn btn-primary w-full mt-4">
            Sign Up
          </button>
        </form>

        <div className="text-center mt-4">
          <p>Already have an account? <Link to="/login" style={{ color: 'var(--primary)' }}>Log In</Link></p>
        </div>
      </div>
    </div>
  );
}
