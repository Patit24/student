import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AuthContext';
import { 
  Users, DollarSign, Activity, CheckCircle, XCircle, 
  Trash2, Package, LogOut, LayoutDashboard, Search,
  TrendingUp, CreditCard, ShieldCheck, ExternalLink,
  Lock, ArrowRight, UserCheck, Upload, Zap, Globe,
  BookOpen, Star, Loader2, FileText, BarChart, Download,
  MessageSquare, Video, CheckSquare, ChevronRight, PackageCheck,
  TrendingDown, Info, Settings, ShieldAlert, Globe2
} from 'lucide-react';
import { subscribeGlobalAssets, uploadGlobalAsset, deleteGlobalAsset, uploadFileToStorage } from '../db.service';
import { useToast } from '../components/Toast';
import { collection, query, where, onSnapshot, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import AdminBlogManager from '../components/AdminBlogManager';
import TutorCourseManager from '../components/TutorCourseManager';
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
  const [activeTab, setActiveTab] = useState('tutors'); 
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Search/Filters for Analytics
  const [selectedAnalyticsTutor, setSelectedAnalyticsTutor] = useState(null);
  const [verifyingTutor, setVerifyingTutor] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('growth');
  const [allCourses, setAllCourses] = useState([]);

  useEffect(() => {
    const qTutors = query(collection(db, 'users'), where('role', '==', 'tutor'));
    const unsubTutors = onSnapshot(qTutors, (snap) => {
      setTutors(snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data(),
        txn_id: d.data().payment_tx_id || (isMockMode ? `MOCK-TXN-${d.id}` : 'N/A')
      })));
    });

    const qBatches = query(collection(db, 'batches'));
    const unsubBatches = onSnapshot(qBatches, (snap) => {
      setBatches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const qStudents = query(collection(db, 'users'), where('role', '==', 'student'));
    const unsubStudents = onSnapshot(qStudents, (snap) => {
      setAllStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubTutors(); unsubBatches(); unsubStudents(); };
  }, [isMockMode]);

  useEffect(() => {
    const unsubAssets = subscribeGlobalAssets(setGlobalAssets);
    const qCourses = query(collection(db, 'courses'));
    const unsubCourses = onSnapshot(qCourses, snap => {
      setAllCourses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubAssets(); unsubCourses(); };
  }, []);

  const totalRevenue = tutors.reduce((acc, tutor) => {
    if (tutor.subscription_status === 'active') {
      if (tutor.subscription_tier === 'pro') return acc + 999;
      if (tutor.subscription_tier === 'growth') return acc + 499;
    }
    return acc;
  }, 0);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const approveTutor = async () => {
    if (!verifyingTutor) return;
    try {
      await updateDoc(doc(db, 'users', verifyingTutor.id), {
        subscription_status: 'active',
        subscription_tier: selectedPlan,
        approved_at: serverTimestamp()
      });
      toast.success(`Plan ${selectedPlan.toUpperCase()} Activated! 🚀`);
      setVerifyingTutor(null);
    } catch (err) {
      toast.error('Activation failed');
    }
  };

  const handleDeleteAsset = async (id) => {
    if (window.confirm('Delete this resource?')) {
      await deleteGlobalAsset(id);
      toast.success('Resource deleted');
    }
  };

  const handleDeleteTutor = async (tutorId) => {
    if (window.confirm('Are you sure you want to completely remove this tutor? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'users', tutorId));
        toast.success('Tutor removed successfully');
      } catch (err) {
        toast.error('Failed to remove tutor');
        console.error(err);
      }
    }
  };

  const handleQuickUpload = async (e, category, title, materialType, description) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const url = await uploadFileToStorage(file, `admin_${category}`, (pct) => setUploadProgress(pct));
      await uploadGlobalAsset({
        title: title?.trim() || `${category.toUpperCase()} Resource`,
        description: description || '',
        category,
        material_type: materialType,
        name: file.name,
        size: file.size,
        url,
        status: 'published',
        uploader: 'Super Admin',
        created_at: serverTimestamp()
      });
      toast.success('Asset published! 🚀');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const formatDate = (val) => {
    if (!val) return 'N/A';
    if (val.toDate) return val.toDate().toLocaleDateString();
    return new Date(val).toLocaleDateString();
  };

  return (
    <div className="admin-premium-root">
      <div className="container" style={{ maxWidth: '1440px' }}>
        
        {/* Command Center Header */}
        <header className="flex justify-between items-center mb-10 mobile-stack">
          <div className="flex items-center gap-4">
            <div className="glass-card p-3"><ShieldCheck size={32} color="#f5c518" /></div>
            <div>
              <h1 style={{ margin: 0, fontWeight: 900 }}>Command <span style={{ color: '#f5c518' }}>Center</span></h1>
              <p style={{ margin: 0, color: '#7a8ba8', fontSize: '0.85rem' }}>Super Admin Authority • PPREducation</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-remove mobile-full"><LogOut size={18} /> Logout</button>
        </header>

        <div className="flex gap-10 mobile-stack">
          {/* Sidebar KPIs */}
          <aside className="admin-sidebar">
            <div className="glass-card stat-box">
              <span className="stat-label">Total Tutors</span>
              <div className="flex items-end justify-between">
                <span className="stat-value">{tutors.length}</span>
                <Users size={24} color="#7a8ba8" />
              </div>
            </div>
            <div className="glass-card stat-box">
              <span className="stat-label">Platform Revenue</span>
              <div className="flex items-end justify-between">
                <span className="stat-value">₹{totalRevenue.toLocaleString()}</span>
                <DollarSign size={24} color="#7a8ba8" />
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main style={{ flex: 1 }}>
            
            <div className="tab-nav mb-8 overflow-x-auto">
              <button className={`tab-btn ${activeTab === 'tutors' ? 'active' : ''}`} onClick={() => setActiveTab('tutors')}><Users size={18} /> Tutors</button>
              <button className={`tab-btn ${activeTab === 'payouts' ? 'active' : ''}`} onClick={() => setActiveTab('payouts')}><ShieldCheck size={18} /> Profiles & Commission</button>
              <button className={`tab-btn ${activeTab === 'materials' ? 'active' : ''}`} onClick={() => setActiveTab('materials')}><Package size={18} /> Global Library</button>
              <button className={`tab-btn ${activeTab === 'blogs' ? 'active' : ''}`} onClick={() => setActiveTab('blogs')}><FileText size={18} /> Blogs</button>
              <button className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => setActiveTab('courses')}><BookOpen size={18} /> Marketplace</button>
              <button className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}><BarChart size={18} /> Analytics</button>
            </div>

            {/* TAB: Tutors */}
            {activeTab === 'tutors' && (
              <div className="glass-card p-8 animate-premium">
                <h3 className="mb-6 flex items-center gap-2"><Users size={20} color="#f5c518" /> Tutor Directory</h3>
                <div className="table-responsive">
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Tutor</th>
                        <th>TXN ID</th>
                        <th>Stats</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tutors.map(t => {
                        const batchCount = batches.filter(b => b.tutorId === t.id).length;
                        const studentCount = allStudents.filter(s => s.tutorId === t.id || (s.enrolled_batches && s.enrolled_batches.some(eb => eb.tutor_id === t.id))).length;
                        return (
                          <tr key={t.id}>
                            <td><strong>{t.name}</strong><br/><small className="text-muted">{t.phone}</small></td>
                            <td><code>{t.txn_id}</code></td>
                            <td>
                              <div style={{ fontSize: '0.8rem', color: '#7a8ba8', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                <span><Package size={12} style={{ display:'inline', verticalAlign:'text-bottom', marginRight: '4px' }} /> {batchCount} Batches</span>
                                <span><Users size={12} style={{ display:'inline', verticalAlign:'text-bottom', marginRight: '4px' }} /> {studentCount} Students</span>
                              </div>
                            </td>
                            <td>{t.subscription_status === 'active' ? <span className="badge-active">Live</span> : <span className="badge-pending">Review</span>}</td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button className="btn-approve" onClick={() => { setVerifyingTutor(t); setSelectedPlan(t.pending_plan || 'growth'); }}>Verify</button>
                                <button className="btn-remove" onClick={() => handleDeleteTutor(t.id)} title="Remove Tutor" style={{ padding: '0.4rem 0.6rem', minWidth: 'auto' }}><Trash2 size={16} /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: Profiles & Commission */}
            {activeTab === 'payouts' && (
              <div className="flex-col gap-8 animate-premium">
                <div className="glass-card p-8">
                  <h3 className="mb-6"><ShieldCheck size={20} color="#f5c518" /> Commission Configuration</h3>
                  <div className="grid grid-cols-1 gap-6">
                    {tutors.map(t => (
                      <div key={t.id} className="glass-card p-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <div className="flex justify-between items-center mb-6">
                          <div className="flex items-center gap-3">
                            <div className="avatar-sm" style={{ background: 'var(--primary)', color: '#000', fontWeight: 900 }}>{t.name.charAt(0)}</div>
                            <div>
                              <div style={{ fontWeight: 800 }}>{t.name}</div>
                              <div style={{ fontSize: '0.75rem', color: '#7a8ba8' }}>UPI: {t.banking?.upiId || 'Not Set'}</div>
                            </div>
                          </div>
                          <div className="badge-active">PLATFORM FEE: ACTIVE</div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="input-group">
                            <label className="input-label">Direct Pay Fee (%)</label>
                            <input type="number" step="0.1" className="input-field" value={t.direct_commission || 0.1} onChange={(e) => updateDoc(doc(db, 'users', t.id), { direct_commission: parseFloat(e.target.value) })} />
                          </div>
                          <div className="input-group">
                            <label className="input-label">Online Class Fee (%)</label>
                            <input type="number" step="1" className="input-field" value={t.class_commission || 2} onChange={(e) => updateDoc(doc(db, 'users', t.id), { class_commission: parseFloat(e.target.value) })} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Global Library */}
            {activeTab === 'materials' && (
              <div className="flex-col gap-8 animate-premium">
                <div className="glass-card p-10 mb-8" style={{ border: '1px solid rgba(245,197,24,0.3)', background: 'linear-gradient(135deg, rgba(245,197,24,0.05) 0%, transparent 100%)' }}>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 style={{ margin: 0, fontWeight: 900 }}>Global <span style={{ color: '#f5c518' }}>Assets</span></h3>
                      <p className="text-muted" style={{ margin: 0 }}>Publish lead magnets and study materials to the student dashboard.</p>
                    </div>
                    <Globe size={32} color="#f5c518" />
                  </div>
                  <div className="flex gap-4 mobile-stack">
                    <input id="asset-title" type="text" placeholder="Material Title" className="input-field flex-1" />
                    <input type="file" id="asset-file" hidden onChange={(e) => handleQuickUpload(e, 'general', document.getElementById('asset-title').value, 'material', '')} />
                    <label htmlFor="asset-file" className="btn-approve flex items-center gap-2 cursor-pointer" style={{ padding: '1rem 2.5rem' }}>
                      <Upload size={20} /> Publish to Dashboard
                    </label>
                  </div>
                  {isUploading && (
                    <div className="mt-4">
                      <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                        <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#f5c518', boxShadow: '0 0 10px #f5c518', transition: 'width 0.3s' }} />
                      </div>
                      <p className="text-xs text-center mt-2">Uploading: {uploadProgress}%</p>
                    </div>
                  )}
                </div>

                <div className="materials-grid">
                  {globalAssets.map(asset => (
                    <div key={asset.id} className="asset-card glass-card">
                      <div className="asset-info">
                        <div className="asset-icon"><Package size={20} color="#f5c518" /></div>
                        <div>
                          <div className="asset-name">{asset.title}</div>
                          <div className="asset-meta">{(asset.size / 1024 / 1024).toFixed(1)} MB • {formatDate(asset.created_at)}</div>
                        </div>
                      </div>
                      <div className="asset-actions">
                        <button className="btn-icon" onClick={() => handleDeleteAsset(asset.id)}><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other Tabs Placeholder */}
            {['blogs', 'courses', 'analytics'].includes(activeTab) && (
              <div className="glass-card p-20 text-center opacity-30">
                <Loader2 className="animate-spin mb-4" size={48} />
                <h3>Module Loading...</h3>
                <p>This command sub-center is currently being synchronized.</p>
              </div>
            )}

          </main>
        </div>

        {/* Verification Modal */}
        {verifyingTutor && (
          <div className="verification-overlay animate-premium">
            <div className="glass-card verification-card" style={{ maxWidth: '450px' }}>
              <button className="close-modal" onClick={() => setVerifyingTutor(null)}><XCircle /></button>
              <h2 className="cinematic-title">Verify Payment</h2>
              <div className="tutor-profile-snapshot">
                <img src={`https://ui-avatars.com/api/?name=${verifyingTutor.name}&background=f5c518&color=000&bold=true`} style={{ width: '50px', height: '50px', borderRadius: '12px' }} />
                <div>
                  <div style={{ fontWeight: 800 }}>{verifyingTutor.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#7a8ba8' }}>TXN: {verifyingTutor.txn_id}</div>
                </div>
              </div>
              <div className="plan-selection-area mt-8">
                <label>Assign Subscription Tier</label>
                <select className="premium-select" value={selectedPlan} onChange={(e) => setSelectedPlan(e.target.value)}>
                  <option value="growth">Growth Plan (₹499/mo)</option>
                  <option value="pro">Elite Plan (₹999/mo)</option>
                </select>
              </div>
              <button className="btn-verify-approve" onClick={approveTutor}>
                Verify & Activate Account
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
