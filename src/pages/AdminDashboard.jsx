import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AuthContext';
import { 
  Users, DollarSign, Activity, CheckCircle, XCircle, 
  Trash2, Package, LogOut, LayoutDashboard, Search,
  TrendingUp, CreditCard, ShieldCheck, ExternalLink,
  Lock, ArrowRight, UserCheck, Upload, Zap, Globe,
  BookOpen, Star, Loader2
} from 'lucide-react';
import { subscribeGlobalAssets, uploadGlobalAsset, deleteGlobalAsset, uploadFileToStorage } from '../db.service';
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
  const [globalAssets, setGlobalAssets] = useState([]);
  const [activeTab, setActiveTab] = useState('tutors'); // 'tutors' or 'materials'
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Selection for Verification
  const [verifyingTutor, setVerifyingTutor] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('pro');

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'tutor'));
    const unsub = onSnapshot(q, (snap) => {
      const real = snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data(),
        txn_id: d.data().payment_tx_id || (isMockMode ? `MOCK-TXN-${d.id}` : 'N/A')
      }));
      if (real.length > 0 || !isMockMode) setTutors(real);
    });
    return unsub;
  }, [isMockMode]);

  // Subscribe to Global Assets
  useEffect(() => {
    return subscribeGlobalAssets(setGlobalAssets);
  }, []);

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
      toast.success(`Plan ${selectedPlan.toUpperCase()} Activated! 🚀`);
      setVerifyingTutor(null);
    } catch (err) {
      toast.error('Activation failed: ' + err.message);
    }
  };

  const removeTutor = async (id) => {
    if (window.confirm('Remove this tutor permanently?')) {
      try {
        await deleteDoc(doc(db, 'users', id));
        toast.success('Tutor removed');
      } catch (err) {
        toast.error('Removal failed');
      }
    }
  };

  const [assetTitle, setAssetTitle] = useState('');
  const [assetCategory, setAssetCategory] = useState('general'); // general, neet, jee
  const [assetType, setAssetType] = useState('material'); // material, mock, suggestion

  const handleQuickUpload = async (e, category, title, materialType) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Auto-generate title if blank for "One-Click" experience
    const finalTitle = title?.trim() || `${category.toUpperCase()} ${materialType.charAt(0).toUpperCase() + materialType.slice(1)} - ${new Date().toLocaleDateString('en-IN')}`;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const url = await uploadFileToStorage(file, `admin_${category}`, (pct) => setUploadProgress(pct));
      await uploadGlobalAsset({
        title: finalTitle,
        category,
        material_type: materialType,
        name: file.name,
        size: file.size,
        url: url,
        type: file.type,
        uploader: 'Super Admin',
        status: 'published',
        is_free: true,
        price: 0,
        created_at: new Date().toISOString()
      });
      toast.success(`${finalTitle} published successfully! 🚀`);
      
      // Clear inputs manually
      if (category === 'neet') {
        const t = document.getElementById('neet-title');
        if (t) t.value = '';
      }
      if (category === 'jee') {
        const t = document.getElementById('jee-title');
        if (t) t.value = '';
      }
      if (category === 'general') {
        const t = document.getElementById('global-title');
        if (t) t.value = '';
      }
    } catch (err) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      e.target.value = null; // Clear file input
    }
  };

  const handleDeleteAsset = async (id) => {
    if (window.confirm('Delete this material?')) {
      try {
        await deleteGlobalAsset(id);
        toast.success('Material deleted');
      } catch (err) {
        toast.error('Delete failed');
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
            </div>

            <div className="glass-card stat-box">
              <span className="stat-label">Global Materials</span>
              <div className="flex items-end justify-between">
                <span className="stat-value" style={{ color: '#f5c518' }}>{globalAssets.length}</span>
                <Package size={24} color="#7a8ba8" />
              </div>
            </div>

            <div className="glass-card stat-box">
              <span className="stat-label">Pending Payments</span>
              <div className="flex items-end justify-between">
                <span className="stat-value">₹{revenue.toLocaleString()}</span>
                <CreditCard size={24} color="#7a8ba8" />
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="animate-premium" style={{ flex: 1, animationDelay: '0.2s' }}>
            
            {/* Tab Navigation */}
            <div className="tab-nav mb-6">
              <button 
                className={`tab-btn ${activeTab === 'tutors' ? 'active' : ''}`}
                onClick={() => setActiveTab('tutors')}
              >
                <Users size={18} /> Tutor Management
              </button>
              <button 
                className={`tab-btn ${activeTab === 'materials' ? 'active' : ''}`}
                onClick={() => setActiveTab('materials')}
              >
                <Package size={18} /> Global Materials
              </button>
            </div>

            {activeTab === 'tutors' ? (
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
                              <button 
                                className="btn-approve"
                                onClick={() => {
                                  setVerifyingTutor(tutor);
                                  setSelectedPlan(tutor.pending_plan || 'growth');
                                }}
                              >
                                {tutor.subscription_status === 'active' ? 'Manage' : 'Review'}
                              </button>
                              <button className="btn-remove" onClick={() => removeTutor(tutor.id)}>
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
            ) : (
              <div className="glass-card p-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="flex items-center gap-3">
                    <Package size={22} color="#f5c518" />
                    Global Study Materials
                  </h3>
                </div>

                {/* ── NEET UPLOAD ZONE ── */}
                <div className="glass-card p-10 mb-10" style={{ borderRadius: '24px', background: 'rgba(5,130,100,0.03)', border: '1px solid rgba(16,185,129,0.1)' }}>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10B981' }}>NEET <span style={{ color: '#fff' }}>Medical Hub</span></h3>
                      <p className="text-muted">Upload Mock Tests and Materials for Medical aspirants.</p>
                    </div>
                    <div style={{ background: 'rgba(16,185,129,0.1)', padding: '0.8rem', borderRadius: '12px' }}>
                      <Activity size={24} color="#10B981" />
                    </div>
                  </div>
                  
                  <div className="flex-col gap-4">
                    <div className="flex gap-4">
                      <input 
                        type="text" 
                        placeholder="Material Title (e.g. Biology Unit Test #1)" 
                        className="premium-input flex-1"
                        id="neet-title"
                        style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(16,185,129,0.2)', color: 'white' }}
                      />
                      <select 
                        id="neet-type"
                        className="premium-input"
                        style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(16,185,129,0.2)', color: 'white' }}
                      >
                        <option value="material">Study Material</option>
                        <option value="mock">Mock Exam</option>
                        <option value="suggestion">Last-Min Suggestion</option>
                      </select>
                    </div>
                    <div className="mt-4">
                      <input 
                        type="file" 
                        id="neet-file" 
                        onChange={(e) => handleQuickUpload(e, 'neet', document.getElementById('neet-title').value, document.getElementById('neet-type').value)}
                        hidden 
                      />
                      <label htmlFor="neet-file" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#10B981', border: 'none', padding: '1rem', borderRadius: '12px', cursor: 'pointer', justifyContent: 'center' }}>
                        <Upload size={20} /> Publish to NEET Hub
                      </label>
                    </div>
                  </div>
                </div>

                {/* ── JEE UPLOAD ZONE ── */}
                <div className="glass-card p-10 mb-10" style={{ borderRadius: '24px', background: 'rgba(99,102,241,0.03)', border: '1px solid rgba(99,102,241,0.1)' }}>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#6366F1' }}>JEE <span style={{ color: '#fff' }}>Engineering Hub</span></h3>
                      <p className="text-muted">Upload Mock Tests and Materials for Engineering aspirants.</p>
                    </div>
                    <div style={{ background: 'rgba(99,102,241,0.1)', padding: '0.8rem', borderRadius: '12px' }}>
                      <Zap size={24} color="#6366F1" />
                    </div>
                  </div>
                  
                  <div className="flex-col gap-4">
                    <div className="flex gap-4">
                      <input 
                        type="text" 
                        placeholder="Material Title (e.g. Physics Mock #4)" 
                        className="premium-input flex-1"
                        id="jee-title"
                        style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(99,102,241,0.2)', color: 'white' }}
                      />
                      <select 
                        id="jee-type"
                        className="premium-input"
                        style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(99,102,241,0.2)', color: 'white' }}
                      >
                        <option value="material">Study Material</option>
                        <option value="mock">Mock Exam</option>
                        <option value="suggestion">Last-Min Suggestion</option>
                      </select>
                    </div>
                    <div className="mt-4">
                      <input 
                        type="file" 
                        id="jee-file" 
                        onChange={(e) => handleQuickUpload(e, 'jee', document.getElementById('jee-title').value, document.getElementById('jee-type').value)}
                        hidden 
                      />
                      <label htmlFor="jee-file" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#6366F1', border: 'none', padding: '1rem', borderRadius: '12px', cursor: 'pointer', justifyContent: 'center' }}>
                        <Upload size={20} /> Publish to JEE Hub
                      </label>
                    </div>
                  </div>
                </div>

                {/* ── GLOBAL LIBRARY UPLOAD ── */}
                <div className="glass-card p-10 mb-10" style={{ borderRadius: '24px', background: 'rgba(245,197,24,0.03)', border: '1px solid rgba(245,197,24,0.1)' }}>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F5C518' }}>Global <span style={{ color: '#fff' }}>Library</span></h3>
                      <p className="text-muted">General lead magnets and public resources.</p>
                    </div>
                    <div style={{ background: 'rgba(245,197,24,0.1)', padding: '0.8rem', borderRadius: '12px' }}>
                      <Globe size={24} color="#F5C518" />
                    </div>
                  </div>
                  
                  <div className="flex-col gap-4">
                    <input 
                      type="text" 
                      placeholder="Resource Title (e.g. Free Formula Ebook)" 
                      className="premium-input"
                      id="global-title"
                      style={{ width: '100%', marginBottom: '1rem', padding: '1rem', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(245,197,24,0.2)', color: 'white' }}
                    />
                    <input 
                      type="file" 
                      id="global-file" 
                      onChange={(e) => handleQuickUpload(e, 'general', document.getElementById('global-title').value, 'material')}
                      hidden 
                    />
                    <label htmlFor="global-file" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F5C518', color: '#000', border: 'none', padding: '1rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, justifyContent: 'center' }}>
                      <Upload size={20} /> Publish to Public Library
                    </label>
                  </div>
                </div>

                {/* Materials Grid */}
                <div className="materials-grid">
                  {globalAssets.map(asset => (
                    <div key={asset.id} className="asset-card glass-card">
                      <div className="asset-info">
                        <div className="asset-icon">
                          <Package size={24} color="#f5c518" />
                        </div>
                        <div>
                          <div className="asset-name">{asset.name}</div>
                          <div className="asset-meta">{(asset.size / 1024 / 1024).toFixed(2)} MB • {new Date(asset.created_at?.toDate()).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="asset-actions">
                        <a href={asset.url} target="_blank" rel="noopener noreferrer" className="btn-icon">
                          <ExternalLink size={18} />
                        </a>
                        <button onClick={() => handleDeleteAsset(asset.id)} className="btn-icon delete">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {globalAssets.length === 0 && (
                    <div className="empty-state">
                      <Package size={48} color="rgba(122, 139, 168, 0.2)" />
                      <p>No global materials uploaded yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
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
