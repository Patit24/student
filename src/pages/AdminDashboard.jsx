import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AuthContext';
import { 
  Users, DollarSign, Activity, CheckCircle, XCircle, 
  Trash2, Package, LogOut, LayoutDashboard, Search,
  TrendingUp, CreditCard, ShieldCheck, ExternalLink,
  Lock, ArrowRight, UserCheck
} from 'lucide-react';
import { subscribeGlobalAssets, deleteGlobalAsset } from '../db.service';
import { useToast } from '../components/Toast';
import { collection, query, where, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { isMockMode, currentUser, logout } = useAppContext();
  const toast = useToast();
  const navigate = useNavigate();

  // KPIs & Tutors
  const [tutors, setTutors] = useState([]);
  
  // Selection for Verification
  const [verifyingTutor, setVerifyingTutor] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('pro');

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'tutor'));
    const unsub = onSnapshot(q, (snap) => {
      const real = snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data(),
        // Correct field name from Pricing.jsx: payment_tx_id
        txn_id: d.data().payment_tx_id || (isMockMode ? `MOCK-TXN-${d.id}` : 'N/A')
      }));
      
      if (real.length > 0 || !isMockMode) {
        setTutors(real);
      } else {
        // Fallback Mock Data
        setTutors([
          { id: 't1', name: 'Dr. Sarah Wilson', email: 'sarah@edu.com', subscription_tier: 'pro', subscription_status: 'active', txn_id: 'TXN-PPR88231' },
          { id: 't2', name: 'John Miller', email: 'john@edu.com', subscription_tier: 'growth', subscription_status: 'inactive', txn_id: 'TXN-PPR99104' },
          { id: 't3', name: 'Emily Davis', email: 'emily@edu.com', subscription_tier: 'pro', subscription_status: 'inactive', txn_id: 'TXN-PPR44120' },
        ]);
      }
    });
    return unsub;
  }, [isMockMode]);

  const totalTutors = tutors.length;
  const pendingTutors = tutors.filter(t => t.subscription_status !== 'active').length;
  
  const revenue = tutors.reduce((acc, tutor) => {
    if (tutor.subscription_status === 'active') {
      if (tutor.subscription_tier === 'pro') return acc + 999;
      if (tutor.subscription_tier === 'growth') return acc + 499;
    }
    return acc;
  }, 0);

  const approveTutor = async () => {
    if (!verifyingTutor) return;
    try {
      await updateDoc(doc(db, 'users', verifyingTutor.id), {
        subscription_status: 'active',
        subscription_tier: selectedPlan,
        approved_at: new Date().toISOString()
      });
      toast.success(`Plan ${selectedPlan.toUpperCase()} Activated for ${verifyingTutor.name}! 🚀`);
      setVerifyingTutor(null);
    } catch (err) {
      console.error("Approval error:", err);
      toast.error('Activation failed: ' + err.message);
    }
  };

  const removeTutor = async (id) => {
    if (window.confirm('Are you sure you want to remove this tutor permanentely?')) {
      if (isMockMode) {
        setTutors(prev => prev.filter(t => t.id !== id));
        toast.success('Mock: Tutor removed');
        return;
      }
      try {
        await deleteDoc(doc(db, 'users', id));
        toast.success('Tutor removed from platform');
      } catch (err) {
        console.error("Delete error:", err);
        toast.error('Removal failed: ' + err.message);
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="admin-premium-root">
      <div className="container" style={{ maxWidth: '1440px' }}>
        
        {/* Header */}
        <header className="flex justify-between items-center mb-10 animate-premium">
          <div className="flex items-center gap-4">
            <div className="glass-card p-3" style={{ borderRadius: '15px' }}>
              <ShieldCheck size={32} color="#f5c518" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
                Command <span style={{ color: '#f5c518' }}>Center</span>
              </h1>
              <p style={{ color: '#7a8ba8', fontSize: '0.9rem', margin: 0 }}>Super Admin Authority · PPREducation</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="glass-card flex items-center gap-3 px-4 py-2">
              <div style={{ width: '10px', height: '10px', background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 10px #22c55e' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>System Live</span>
            </div>
            <button onClick={handleLogout} className="btn-remove" style={{ padding: '0.6rem 1.2rem' }}>
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <div className="flex gap-10">
          
          {/* Sidebar Stats */}
          <aside className="admin-sidebar animate-premium" style={{ animationDelay: '0.1s' }}>
            <div className="glass-card stat-box">
              <span className="stat-label">Total Tutors</span>
              <div className="flex items-end justify-between">
                <span className="stat-value">{totalTutors}</span>
                <Users size={24} color="#7a8ba8" />
              </div>
              <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#22c55e' }}>
                <TrendingUp size={12} /> +12% this month
              </div>
            </div>

            <div className="glass-card stat-box">
              <span className="stat-label">Pending Approval</span>
              <div className="flex items-end justify-between">
                <span className="stat-value" style={{ color: '#ef4444' }}>{pendingTutors}</span>
                <Activity size={24} color="#7a8ba8" />
              </div>
              <p style={{ fontSize: '0.75rem', marginTop: '0.8rem', color: '#7a8ba8' }}>Awaiting verification</p>
            </div>

            <div className="glass-card stat-box">
              <span className="stat-label">Pending Payments</span>
              <div className="flex items-end justify-between">
                <span className="stat-value">₹{revenue.toLocaleString()}</span>
                <CreditCard size={24} color="#7a8ba8" />
              </div>
              <p style={{ fontSize: '0.75rem', marginTop: '0.8rem', color: '#7a8ba8' }}>Projected Revenue</p>
            </div>
          </aside>

          {/* Main Content: Tutor Management */}
          <main style={{ flex: 1 }} className="animate-premium" style={{ animationDelay: '0.2s' }}>
            <div className="glass-card p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="flex items-center gap-3">
                  <Users size={22} color="#f5c518" />
                  Tutor Management
                </h3>
                <div className="glass-card flex items-center px-4 py-2" style={{ width: '300px' }}>
                  <Search size={18} color="#7a8ba8" />
                  <input 
                    type="text" placeholder="Search Tutors..." 
                    style={{ background: 'transparent', border: 'none', color: 'white', padding: '0 1rem', width: '100%', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Name / Email</th>
                      <th>Transaction ID</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tutors.map(tutor => (
                      <tr key={tutor.id}>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{tutor.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#7a8ba8' }}>{tutor.email}</div>
                        </td>
                        <td>
                          <code style={{ color: '#f5c518', fontSize: '0.8rem', background: 'rgba(245, 197, 24, 0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                            {tutor.txn_id}
                          </code>
                        </td>
                        <td>
                          {tutor.subscription_status === 'active' ? (
                            <span className="badge-active">Approved</span>
                          ) : (
                            <span className="badge-pending">Pending Approval</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="flex justify-end gap-3">
                            {tutor.subscription_status !== 'active' ? (
                              <button 
                                className="btn-approve"
                                onClick={() => {
                                  setVerifyingTutor(tutor);
                                  setSelectedPlan(tutor.pending_plan || 'growth');
                                }}
                              >
                                Review
                              </button>
                            ) : (
                              <button 
                                className="btn-remove"
                                style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderColor: 'rgba(34, 197, 94, 0.2)' }}
                                onClick={() => setVerifyingTutor(tutor)}
                              >
                                Manage
                              </button>
                            )}
                            <button 
                              className="btn-remove"
                              onClick={() => removeTutor(tutor.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>

        {/* ── 4K MANUAL PAYMENT VERIFICATION CARD (MODAL) ── */}
        {verifyingTutor && (
          <div className="verification-overlay animate-fade-in">
            <div className="glass-card verification-card animate-premium">
              <button className="close-modal" onClick={() => setVerifyingTutor(null)}><XCircle /></button>
              
              <div className="verification-header">
                <div className="header-badge">Manual Payment Verification</div>
                <h2 className="cinematic-title">Verify & Approve</h2>
              </div>

              <div className="verification-body">
                {/* Profile Snapshot */}
                <div className="tutor-profile-snapshot">
                  <div className="pfp-container">
                    <img 
                      src={verifyingTutor.profile_image || `https://ui-avatars.com/api/?name=${verifyingTutor.name}&background=f5c518&color=0a0e1a&bold=true`} 
                      alt="Tutor" 
                    />
                  </div>
                  <div className="tutor-info">
                    <h3>{verifyingTutor.name}</h3>
                    <p>{verifyingTutor.email}</p>
                  </div>
                </div>

                {/* Glowing Transaction ID Section */}
                <div className="txn-highlight-box">
                  <span className="label">Verification Code</span>
                  <div className="glowing-txn-id">
                    Transaction ID: <span className="gold-text">{verifyingTutor.txn_id}</span>
                  </div>
                </div>

                {/* Plan Selection */}
                <div className="plan-selection-area">
                  <label>Select Plan to Activate</label>
                  <div className="plan-dropdown-container">
                    <Package size={18} className="dropdown-icon" />
                    <select 
                      value={selectedPlan} 
                      onChange={(e) => setSelectedPlan(e.target.value)}
                      className="premium-select"
                    >
                      <option value="starter">Basic Plan (Free)</option>
                      <option value="growth">Growth Plan (Popular)</option>
                      <option value="pro">Elite Plan (Best Value)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="verification-footer">
                <button 
                  className="btn-verify-approve"
                  onClick={approveTutor}
                >
                  <UserCheck size={20} /> Verify & Approve Plan
                </button>
                <p className="footer-disclaimer">By clicking verify, you confirm that the transaction ID matches your bank records.</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
