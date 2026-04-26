import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AuthContext';
import { 
  Users, DollarSign, Activity, CheckCircle, XCircle, 
  Trash2, Package, LogOut, LayoutDashboard, Search,
  TrendingUp, CreditCard, ShieldCheck, ExternalLink,
  Lock, ArrowRight, UserCheck, Upload, Zap, Globe,
  BookOpen, Star, Loader2, FileText
} from 'lucide-react';
import { subscribeGlobalAssets, uploadGlobalAsset, deleteGlobalAsset, uploadFileToStorage } from '../db.service';
import { useToast } from '../components/Toast';
import { collection, query, where, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import AdminBlogManager from '../components/AdminBlogManager';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { isMockMode, currentUser, logout } = useAppContext();
  const toast = useToast();
  const navigate = useNavigate();

  // KPIs & Tutors
  const [tutors, setTutors] = useState([]);
  const [batches, setBatches] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [globalAssets, setGlobalAssets] = useState([]);
  const [activeTab, setActiveTab] = useState('tutors'); // 'tutors' | 'materials' | 'blogs' | 'analytics'
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Search/Filters for Analytics
  const [searchTutor, setSearchTutor] = useState('');
  const [selectedAnalyticsTutor, setSelectedAnalyticsTutor] = useState(null);
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
      setTutors(real);
    });

    const qBatches = query(collection(db, 'batches'));
    const unsubBatches = onSnapshot(qBatches, (snap) => {
      setBatches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const qStudents = query(collection(db, 'users'), where('role', '==', 'student'));
    const unsubStudents = onSnapshot(qStudents, (snap) => {
      setAllStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsub(); unsubBatches(); unsubStudents(); };
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

  const handleQuickUpload = async (e, category, title, materialType, description) => {
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
        description: description || '',
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
        const d = document.getElementById('neet-desc');
        if (t) t.value = '';
        if (d) d.value = '';
      }
      if (category === 'jee') {
        const t = document.getElementById('jee-title');
        const d = document.getElementById('jee-desc');
        if (t) t.value = '';
        if (d) d.value = '';
      }
      if (category === 'general') {
        const t = document.getElementById('global-title');
        const d = document.getElementById('global-desc');
        if (t) t.value = '';
        if (d) d.value = '';
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
        <header className="flex justify-between items-center mb-10 animate-premium mobile-stack" style={{ gap: '1.5rem' }}>
          <div className="flex items-center gap-4">
            <div className="glass-card p-3" style={{ borderRadius: '15px' }}>
              <ShieldCheck size={32} color="#f5c518" />
            </div>
            <div>
              <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 1.8rem)', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
                Command <span style={{ color: '#f5c518' }}>Center</span>
              </h1>
              <p style={{ color: '#7a8ba8', fontSize: '0.9rem', margin: 0 }}>Super Admin Authority · PPREducation</p>
            </div>
          </div>

          <div className="flex items-center gap-6 w-full mobile-stack" style={{ justifyContent: 'flex-end' }}>
            <div className="glass-card flex items-center gap-3 px-4 py-2 w-full" style={{ justifyContent: 'center' }}>
              <div style={{ width: '10px', height: '10px', background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 10px #22c55e' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>System Live</span>
            </div>
            <button onClick={handleLogout} className="btn-remove w-full" style={{ padding: '0.8rem', display: 'flex', justifyContent: 'center' }}>
              <LogOut size={18} /> Logout
            </button>
          </div>
        </header>

        <div className="flex gap-10 mobile-stack">
          
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
              <button 
                className={`tab-btn ${activeTab === 'blogs' ? 'active' : ''}`}
                onClick={() => setActiveTab('blogs')}
              >
                <FileText size={18} /> Manage Blogs
              </button>
              <button onClick={() => setActiveTab('courses')} className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}><BookOpen size={18} /> Course Management</button>
              <button onClick={() => setActiveTab('analytics')} className={`nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}><BarChart size={18} /> Analytics</button>
              <button onClick={() => setActiveTab('marketplace')} className={`nav-btn ${activeTab === 'marketplace' ? 'active' : ''}`}><Globe size={18} /> Marketplace</button>
              <button onClick={() => setActiveTab('revenue')} className={`nav-btn ${activeTab === 'revenue' ? 'active' : ''}`}><DollarSign size={18} /> Revenue</button>
            </div>

            {activeTab === 'tutors' ? (
              <div className="glass-card p-8">
                <div className="flex justify-between items-center mb-8 mobile-stack" style={{ gap: '1.5rem' }}>
                  <h3 className="flex items-center gap-3">
                    <Users size={22} color="#f5c518" />
                    Tutors
                  </h3>
                  <div className="glass-card flex items-center px-4 py-2 w-full" style={{ maxWidth: '400px' }}>
                    <Search size={18} color="#7a8ba8" />
                    <input 
                      type="text" placeholder="Search Tutors..." 
                      style={{ background: 'transparent', border: 'none', color: 'white', padding: '0 1rem', width: '100%', outline: 'none' }}
                    />
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Tutor</th>
                        <th className="hide-on-mobile">Transaction</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tutors.map(tutor => (
                        <tr key={tutor.id}>
                          <td>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{tutor.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#7a8ba8' }}>{tutor.phone}</div>
                          </td>
                          <td className="hide-on-mobile">
                            <code style={{ color: '#f5c518', fontSize: '0.8rem', background: 'rgba(245, 197, 24, 0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                              {tutor.txn_id}
                            </code>
                          </td>
                          <td>
                            {tutor.subscription_status === 'active' ? (
                              <span className="badge-active">Live</span>
                            ) : (
                              <span className="badge-pending">Review</span>
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
                                {tutor.subscription_status === 'active' ? 'Plan' : 'Verify'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeTab === 'materials' ? (
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
                    <div className="flex gap-4 mobile-stack">
                      <input 
                        type="text" 
                        placeholder="Material Title" 
                        className="premium-input flex-1"
                        id="neet-title"
                        style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(16,185,129,0.2)', color: 'white' }}
                      />
                      <select 
                        id="neet-type"
                        className="premium-input w-full"
                        style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(16,185,129,0.2)', color: 'white' }}
                      >
                        <option value="material">Study Material</option>
                        <option value="mock">Mock Exam</option>
                        <option value="suggestion">Suggestion</option>
                      </select>
                    </div>
                    <div className="mt-4">
                      <textarea 
                        placeholder="Short Description (e.g. Detailed notes on Human Physiology...)" 
                        className="premium-input w-full mb-4"
                        id="neet-desc"
                        rows="2"
                        style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(16,185,129,0.2)', color: 'white', resize: 'none' }}
                      />
                      <input 
                        type="file" 
                        id="neet-file" 
                        onChange={(e) => handleQuickUpload(e, 'neet', document.getElementById('neet-title').value, document.getElementById('neet-type').value, document.getElementById('neet-desc').value)}
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
                    <div className="flex gap-4 mobile-stack">
                      <input 
                        type="text" 
                        placeholder="Material Title" 
                        className="premium-input flex-1"
                        id="jee-title"
                        style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(99,102,241,0.2)', color: 'white' }}
                      />
                      <select 
                        id="jee-type"
                        className="premium-input w-full"
                        style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(99,102,241,0.2)', color: 'white' }}
                      >
                        <option value="material">Study Material</option>
                        <option value="mock">Mock Exam</option>
                        <option value="suggestion">Suggestion</option>
                      </select>
                    </div>
                    <div className="mt-4">
                      <textarea 
                        placeholder="Short Description (e.g. Comprehensive Physics Mock Test based on latest pattern...)" 
                        className="premium-input w-full mb-4"
                        id="jee-desc"
                        rows="2"
                        style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(99,102,241,0.2)', color: 'white', resize: 'none' }}
                      />
                      <input 
                        type="file" 
                        id="jee-file" 
                        onChange={(e) => handleQuickUpload(e, 'jee', document.getElementById('jee-title').value, document.getElementById('jee-type').value, document.getElementById('jee-desc').value)}
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
                    <textarea 
                      placeholder="Short Description (e.g. A comprehensive guide to all physics formulas for quick revision.)" 
                      className="premium-input"
                      id="global-desc"
                      rows="2"
                      style={{ width: '100%', marginBottom: '1rem', padding: '1rem', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(245,197,24,0.2)', color: 'white', resize: 'none' }}
                    />
                    <input 
                      type="file" 
                      id="global-file" 
                      onChange={(e) => handleQuickUpload(e, 'general', document.getElementById('global-title').value, 'material', document.getElementById('global-desc').value)}
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
            ) : activeTab === 'blogs' ? (
              <div className="glass-card p-8">
                <AdminBlogManager />
              </div>
            ) : activeTab === 'marketplace' ? (
              (() => {
                const [allCourses, setAllCourses] = useState([]);
                useEffect(() => {
                  const q = query(collection(db, 'courses'));
                  return onSnapshot(q, snap => setAllCourses(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
                }, []);
            
                const totalMarketplaceRevenue = allCourses.reduce((acc, c) => acc + (c.total_revenue || 0), 0);
                const totalAdminCommission = totalMarketplaceRevenue * 0.20;
            
                return (
                  <div className="flex-col gap-8 animate-reveal">
                    <div className="grid grid-cols-3 mobile-grid-1 gap-6">
                      <div className="glass-card p-6 border-l-4 border-yellow-500">
                        <span className="text-xs font-bold text-muted uppercase">Total Marketplace Sales</span>
                        <div className="text-3xl font-black mt-1">₹{totalMarketplaceRevenue.toLocaleString()}</div>
                      </div>
                      <div className="glass-card p-6 border-l-4 border-green-500">
                        <span className="text-xs font-bold text-muted uppercase">Platform Commission (20%)</span>
                        <div className="text-3xl font-black mt-1">₹{totalAdminCommission.toLocaleString()}</div>
                      </div>
                      <div className="glass-card p-6 border-l-4 border-indigo-500">
                        <span className="text-xs font-bold text-muted uppercase">Total Masterclasses</span>
                        <div className="text-3xl font-black mt-1">{allCourses.length}</div>
                      </div>
                    </div>
            
                    <div className="glass-card p-8">
                      <h3 className="text-xl font-bold mb-6">Course Management</h3>
                      <div className="flex-col gap-4">
                        {allCourses.map(course => (
                          <div key={course.id} className="flex justify-between items-center p-4 border-b border-white/5 hover:bg-white/5 transition-all">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                                <BookOpen className="text-yellow-500" size={20} />
                              </div>
                              <div>
                                <h4 className="font-bold">{course.title}</h4>
                                <p className="text-xs text-muted">Tutor ID: {course.tutorId} • {course.category}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-8">
                              <div className="text-right">
                                <div className="font-bold text-sm">₹{course.total_revenue || 0}</div>
                                <div className="text-[10px] text-muted">Admin: ₹{(course.total_revenue || 0) * 0.2}</div>
                              </div>
                              <button className="text-red-400 hover:text-red-300" onClick={() => deleteCourse(course.id)}>
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : activeTab === 'analytics' || activeTab === 'revenue' ? (
              <div className="flex-col gap-8">
                {/* Analytics Summary Bar */}
                <div className="grid grid-cols-3 mobile-grid-1 gap-6 mb-4">
                  <div className="glass-card p-6 border-l-4 border-yellow-500">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted">Total Batches</span>
                    <div className="text-3xl font-black mt-2">{batches.length}</div>
                  </div>
                  <div className="glass-card p-6 border-l-4 border-indigo-500">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted">Total Students</span>
                    <div className="text-3xl font-black mt-2">{allStudents.length}</div>
                  </div>
                  <div className="glass-card p-6 border-l-4 border-green-500">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted">Average/Batch</span>
                    <div className="text-3xl font-black mt-2">{batches.length ? (allStudents.length / batches.length).toFixed(1) : 0}</div>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-8">
                  {/* Tutor Workload List */}
                  <div className="col-span-12 lg:col-span-5 glass-card p-8">
                    <h4 className="flex items-center gap-2 mb-6"><Users size={20} color="#f5c518" /> Tutor Workloads</h4>
                    <div className="flex-col gap-4 overflow-y-auto" style={{ maxHeight: '600px' }}>
                      {tutors.map(tutor => {
                        const tutorBatches = batches.filter(b => b.tutorId === tutor.id);
                        const tutorStudents = allStudents.filter(s => s.tutorId === tutor.id);
                        return (
                          <div 
                            key={tutor.id} 
                            className={`glass-card p-4 hover:border-yellow-500 cursor-pointer transition-all ${selectedAnalyticsTutor?.id === tutor.id ? 'border-yellow-500 bg-yellow-500/5' : ''}`}
                            onClick={() => setSelectedAnalyticsTutor(tutor)}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-bold">{tutor.name}</div>
                                <div className="text-xs text-muted">{tutor.phone}</div>
                              </div>
                              <div className="text-right">
                                <div className="badge-active" style={{ fontSize: '0.7rem' }}>{tutorBatches.length} Batches</div>
                                <div className="text-xs font-bold mt-1">{tutorStudents.length} Students</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Batch & Student Drill-Down */}
                  <div className="col-span-12 lg:col-span-7 flex-col gap-6">
                    {selectedAnalyticsTutor ? (
                      <>
                        <div className="glass-card p-8 animate-reveal">
                          <h4 className="flex items-center gap-2 mb-6">
                            <Package size={20} color="#f5c518" /> 
                            Batches for {selectedAnalyticsTutor.name}
                          </h4>
                          <div className="grid grid-cols-2 mobile-grid-1 gap-4">
                            {batches.filter(b => b.tutorId === selectedAnalyticsTutor.id).map(batch => {
                              const studentsInBatch = allStudents.filter(s => s.batch_id === batch.id);
                              return (
                                <div key={batch.id} className="glass-card p-5 flex-col gap-2" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                  <div className="flex justify-between items-start">
                                    <div className="font-black text-lg">{batch.name}</div>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 800, background: 'rgba(245,197,24,0.1)', color: '#f5c518', padding: '2px 8px', borderRadius: '4px' }}>
                                      {studentsInBatch.length} / {batch.limit}
                                    </div>
                                  </div>
                                  <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                    <div style={{ 
                                      width: `${Math.min(100, (studentsInBatch.length / batch.limit) * 100)}%`, 
                                      height: '100%', 
                                      background: '#f5c518',
                                      boxShadow: '0 0 10px #f5c518'
                                    }} />
                                  </div>
                                  <div className="text-xs text-muted mt-2">
                                    {studentsInBatch.length > 0 ? (
                                      <div className="flex-col gap-1">
                                        <span className="font-bold text-white mb-1">Student Data:</span>
                                        {studentsInBatch.slice(0, 5).map(s => (
                                          <div key={s.id} className="flex justify-between border-b border-white/5 pb-1">
                                            <span>{s.name}</span>
                                            <span className="opacity-50">{s.phone}</span>
                                          </div>
                                        ))}
                                        {studentsInBatch.length > 5 && <div className="text-center italic mt-1 opacity-40">+ {studentsInBatch.length - 5} more</div>}
                                      </div>
                                    ) : (
                                      'No students enrolled yet.'
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                            {batches.filter(b => b.tutorId === selectedAnalyticsTutor.id).length === 0 && (
                              <div className="col-span-2 text-center p-10 opacity-30">No batches found for this tutor.</div>
                            )}
                          </div>
                        </div>

                        {/* Export/Collect Student Data View */}
                        <div className="glass-card p-8 animate-reveal" style={{ animationDelay: '0.1s' }}>
                          <div className="flex justify-between items-center mb-6">
                            <h4 className="flex items-center gap-2"><UserCheck size={20} color="#f5c518" /> Student Directory</h4>
                            <button 
                              className="hp-btn-outline text-xs py-2" 
                              onClick={() => {
                                const data = allStudents.filter(s => s.tutorId === selectedAnalyticsTutor.id);
                                const csv = "Name,Phone,Batch\n" + data.map(s => `"${s.name}","${s.phone}","${batches.find(b => b.id === s.batch_id)?.name || 'Unknown'}"`).join("\n");
                                const blob = new Blob([csv], { type: 'text/csv' });
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `students_${selectedAnalyticsTutor.name.replace(/\s+/g, '_')}.csv`;
                                a.click();
                              }}
                            >
                              Collect CSV Data
                            </button>
                          </div>
                          <div className="table-responsive" style={{ maxHeight: '400px' }}>
                            <table className="premium-table">
                              <thead>
                                <tr>
                                  <th>Student Name</th>
                                  <th>Phone</th>
                                  <th>Batch</th>
                                </tr>
                              </thead>
                              <tbody>
                                {allStudents.filter(s => s.tutorId === selectedAnalyticsTutor.id).map(student => (
                                  <tr key={student.id}>
                                    <td className="font-bold">{student.name}</td>
                                    <td>{student.phone}</td>
                                    <td className="text-xs text-yellow-500 font-bold">
                                      {batches.find(b => b.id === student.batch_id)?.name || 'N/A'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="glass-card p-20 flex-col items-center justify-center text-center opacity-50 h-full">
                        <Activity size={48} className="mb-4 text-yellow-500 animate-pulse" />
                        <h3>Select a tutor to analyze batches</h3>
                        <p>Detailed workload metrics and student enrollment data will appear here.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
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
                    <p>{verifyingTutor.phone}</p>
                  </div>
                </div>

                {/* Certificates for Verification */}
                {verifyingTutor.certificates?.length > 0 && (
                  <div className="certificates-review-area mt-6">
                    <label className="text-xs font-bold uppercase tracking-widest text-yellow-500 mb-2 block">Credentials to Verify</label>
                    <div className="flex gap-4 overflow-x-auto pb-4">
                      {verifyingTutor.certificates.map((cert, idx) => (
                        <a 
                          key={idx} 
                          href={cert.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="glass-card p-3 flex-col items-center gap-2 hover:border-yellow-500 transition-all"
                          style={{ minWidth: '120px', background: 'rgba(255,255,255,0.03)' }}
                        >
                          <FileText size={24} color="#f5c518" />
                          <span style={{ fontSize: '0.7rem' }}>{cert.name || 'Certificate'}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

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
