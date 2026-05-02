import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AuthContext';
import { 
  Users, DollarSign, Activity, CheckCircle, XCircle, 
  Trash2, Package, LogOut, LayoutDashboard, Search,
  TrendingUp, CreditCard, ShieldCheck, ExternalLink,
  Lock, ArrowRight, UserCheck, Upload, Zap, Globe,
  BookOpen, Star, Loader2, FileText, BarChart, Download,
  MessageSquare, Video, CheckSquare, ChevronRight, PackageCheck,
  TrendingDown, Info, Settings, ShieldAlert, Globe2, Microscope, Plus, Brain
} from 'lucide-react';
import { subscribeGlobalAssets, uploadGlobalAsset, deleteGlobalAsset, uploadFileToStorage } from '../db.service';
import { useToast } from '../components/Toast';
import { collection, query, where, onSnapshot, updateDoc, doc, deleteDoc, serverTimestamp, addDoc, orderBy } from 'firebase/firestore';
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

  // NEET/JEE Aspirant state
  const [aspirantMaterials, setAspirantMaterials] = useState([]);
  const [aspirantExams, setAspirantExams] = useState([]);
  const [aspStream, setAspStream] = useState('neet');
  const [aspMatTitle, setAspMatTitle] = useState('');
  const [aspMatSubject, setAspMatSubject] = useState('');
  const [aspMatClass, setAspMatClass] = useState('12th');
  const [aspExamTitle, setAspExamTitle] = useState('');
  const [aspQuestions, setAspQuestions] = useState([{ question: '', options: ['', '', '', ''], correct: 0 }]);

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
    const qMat = query(collection(db, 'aspirant_materials'), orderBy('created_at', 'desc'));
    const unsubAspMat = onSnapshot(qMat, snap => {
      setAspirantMaterials(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const qExam = query(collection(db, 'aspirant_exams'), orderBy('created_at', 'desc'));
    const unsubAspExam = onSnapshot(qExam, snap => {
      setAspirantExams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubAssets(); unsubCourses(); unsubAspMat(); unsubAspExam(); };
  }, []);

  const totalRevenue = tutors.reduce((acc, tutor) => {
    if (tutor.subscription_status === 'active') {
      if (tutor.subscription_tier === 'gold') return acc + 2999;
      if (tutor.subscription_tier === 'silver') return acc + 1999;
      if (tutor.subscription_tier === 'flex') {
        const sc = allStudents.filter(s => s.tutorId === tutor.id).length;
        return acc + sc; // ₹1 per student
      }
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
      const planToActivate = verifyingTutor.pending_plan || selectedPlan;
      const isYearly = planToActivate === 'silver' || planToActivate === 'gold';
      const updateData = {
        subscription_status: 'active',
        subscription_tier: planToActivate,
        is_subscribed: true,
        approved_at: serverTimestamp(),
        pending_plan: null,
      };
      if (isYearly) {
        const expiry = new Date();
        expiry.setFullYear(expiry.getFullYear() + 1);
        updateData.subscription_expiry = expiry.toISOString();
      }
      await updateDoc(doc(db, 'users', verifyingTutor.id), updateData);
      toast.success(`${planToActivate.toUpperCase()} Plan Activated! 🚀`);
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
    if (window.confirm('Are you sure you want to completely remove this tutor? ALL their batches, materials, and student links will be deleted. This action cannot be undone.')) {
      try {
        const { deleteTutorCompletely } = await import('../db.service');
        await deleteTutorCompletely(tutorId);
        toast.success('Tutor and all associated data removed successfully');
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

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

        // Skip header row if needed, assuming: Question, A, B, C, D, Correct
        const formattedQuestions = data.slice(1).map(row => {
          if (!row[0]) return null;
          const options = [row[1], row[2], row[3], row[4]].map(o => String(o || '').trim());
          const correctLetter = String(row[5] || 'A').toUpperCase().trim();
          const correctIndex = ['A', 'B', 'C', 'D'].indexOf(correctLetter);
          
          return {
            question: String(row[0]).trim(),
            options,
            correct: correctIndex === -1 ? 0 : correctIndex
          };
        }).filter(q => q !== null);

        if (formattedQuestions.length > 0) {
          setAspQuestions(formattedQuestions);
          toast.success(`Parsed ${formattedQuestions.length} questions from Excel!`);
        } else {
          toast.error('No valid questions found in Excel');
        }
      } catch (err) {
        toast.error('Error parsing Excel: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
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
              <button className={`tab-btn ${activeTab === 'aspirant' ? 'active' : ''}`} onClick={() => setActiveTab('aspirant')}><Microscope size={18} /> {'NEET / JEE'}</button>
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
                            <td>
                              {t.subscription_status === 'active' ? <span className="badge-active">Live ({t.subscription_tier?.toUpperCase()})</span> 
                              : t.subscription_status === 'pending_verification' ? <span className="badge-pending" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>⏳ Pending ({t.pending_plan?.toUpperCase()})</span>
                              : <span className="badge-pending">Review</span>}
                            </td>
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

            {/* TAB: NEET / JEE Aspirant */}
            {activeTab === 'aspirant' && (
              <div className="flex-col gap-8 animate-premium">
                {/* Stream Selector */}
                <div className="flex gap-4 mb-4">
                  <button className={`tab-btn ${aspStream === 'neet' ? 'active' : ''}`} onClick={() => setAspStream('neet')} style={{ background: aspStream === 'neet' ? 'rgba(34,197,94,0.12)' : '', borderColor: aspStream === 'neet' ? '#22C55E' : '', color: aspStream === 'neet' ? '#22C55E' : '' }}><Microscope size={16} /> NEET</button>
                  <button className={`tab-btn ${aspStream === 'jee' ? 'active' : ''}`} onClick={() => setAspStream('jee')} style={{ background: aspStream === 'jee' ? 'rgba(129,140,248,0.12)' : '', borderColor: aspStream === 'jee' ? '#818CF8' : '', color: aspStream === 'jee' ? '#818CF8' : '' }}><Brain size={16} /> JEE</button>
                </div>

                {/* Upload Study Material */}
                <div className="glass-card p-8" style={{ border: `1px solid ${aspStream === 'neet' ? 'rgba(34,197,94,0.25)' : 'rgba(129,140,248,0.25)'}` }}>
                  <h3 className="flex items-center gap-2 mb-6"><Upload size={20} color={aspStream === 'neet' ? '#22C55E' : '#818CF8'} /> Upload {aspStream.toUpperCase()} Study Material</h3>
                  <div className="flex gap-4 mb-4 mobile-stack">
                    <input className="input-field flex-1" placeholder="Material Title" value={aspMatTitle} onChange={e => setAspMatTitle(e.target.value)} />
                    <input className="input-field" placeholder="Subject (e.g. Biology)" value={aspMatSubject} onChange={e => setAspMatSubject(e.target.value)} style={{ maxWidth: '200px' }} />
                    <select className="input-field" value={aspMatClass} onChange={e => setAspMatClass(e.target.value)} style={{ maxWidth: '120px' }}>
                      <option value="11th">11th</option>
                      <option value="12th">12th</option>
                      <option value="11th & 12th">Both</option>
                    </select>
                  </div>
                  <input type="file" id={`asp-mat-file-${aspStream}`} hidden onChange={async (e) => {
                    const file = e.target.files[0]; if (!file || !aspMatTitle.trim()) { toast.error('Enter title & select file'); return; }
                    setIsUploading(true); setUploadProgress(0);
                    try {
                      const url = await uploadFileToStorage(file, `aspirant_${aspStream}`, (pct) => setUploadProgress(pct));
                      await addDoc(collection(db, 'aspirant_materials'), { title: aspMatTitle.trim(), subject: aspMatSubject.trim() || 'General', class_name: aspMatClass, stream: aspStream, file_name: file.name, size: file.size, url, created_at: serverTimestamp() });
                      toast.success(`${aspStream.toUpperCase()} material published! 🚀`); setAspMatTitle(''); setAspMatSubject('');
                    } catch (err) { toast.error('Upload failed: ' + err.message); }
                    finally { setIsUploading(false); }
                  }} />
                  <label htmlFor={`asp-mat-file-${aspStream}`} className="btn-approve flex items-center gap-2 cursor-pointer" style={{ padding: '0.8rem 2rem', display: 'inline-flex' }}>
                    <Upload size={18} /> Upload PDF
                  </label>
                  {isUploading && <div className="mt-4"><div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}><div style={{ width: `${uploadProgress}%`, height: '100%', background: aspStream === 'neet' ? '#22C55E' : '#818CF8', transition: 'width 0.3s' }} /></div></div>}
                </div>

                {/* Existing Materials */}
                <div className="glass-card p-8">
                  <h4 className="mb-4" style={{ color: '#94A3B8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📚 {aspStream.toUpperCase()} Materials ({aspirantMaterials.filter(m => m.stream === aspStream).length})</h4>
                  {aspirantMaterials.filter(m => m.stream === aspStream).length === 0 ? (
                    <p style={{ color: '#7A8BA8', textAlign: 'center', padding: '2rem' }}>No materials uploaded yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {aspirantMaterials.filter(m => m.stream === aspStream).map(m => (
                        <div key={m.id} className="flex justify-between items-center" style={{ padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px' }}>
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, color: '#F0F4FF', fontSize: '0.9rem' }}>{m.title}</p>
                            <p style={{ margin: 0, fontSize: '0.72rem', color: '#7A8BA8' }}>{m.subject} · Class {m.class_name} · {m.file_name}</p>
                          </div>
                          <button className="btn-icon" onClick={async () => { await deleteDoc(doc(db, 'aspirant_materials', m.id)); toast.success('Deleted'); }}><Trash2 size={16} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Upload Mock Exam */}
                <div className="glass-card p-8" style={{ border: `1px solid ${aspStream === 'neet' ? 'rgba(34,197,94,0.25)' : 'rgba(129,140,248,0.25)'}` }}>
                  <h3 className="flex items-center gap-2 mb-6"><CheckSquare size={20} color={aspStream === 'neet' ? '#22C55E' : '#818CF8'} /> Create {aspStream.toUpperCase()} Mock Exam</h3>
                  
                  <div className="flex gap-4 mb-6">
                    <input type="file" id="exam-excel-upload" hidden accept=".xlsx, .xls" onChange={handleExcelUpload} />
                    <label htmlFor="exam-excel-upload" className="btn-approve flex-1 flex items-center justify-center gap-2 cursor-pointer" style={{ background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)', color: '#F0F4FF' }}>
                      <FileText size={18} /> Bulk Upload via Excel
                    </label>
                    <button className="btn-approve" onClick={() => {
                      const template = [
                        ['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct (A/B/C/D)'],
                        ['What is the capital of France?', 'London', 'Paris', 'Berlin', 'Madrid', 'B'],
                        ['Which planet is known as the Red Planet?', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'B']
                      ];
                      const ws = XLSX.utils.aoa_to_sheet(template);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, "Template");
                      XLSX.writeFile(wb, `${aspStream}_exam_template.xlsx`);
                    }} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#7A8BA8', padding: '0.6rem' }} title="Download Template">
                      <Download size={16} />
                    </button>
                  </div>

                  <input className="input-field mb-4" placeholder="Exam Title (e.g. Weekly Mock — Week 14)" value={aspExamTitle} onChange={e => setAspExamTitle(e.target.value)} />
                  {aspQuestions.map((q, qi) => (
                    <div key={qi} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', marginBottom: '0.8rem' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span style={{ fontSize: '0.72rem', color: aspStream === 'neet' ? '#22C55E' : '#818CF8', fontWeight: 700 }}>Q{qi + 1}</span>
                        <input className="input-field flex-1" placeholder="Enter question..." value={q.question} onChange={e => { const nq = [...aspQuestions]; nq[qi].question = e.target.value; setAspQuestions(nq); }} />
                        {aspQuestions.length > 1 && <button style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }} onClick={() => setAspQuestions(aspQuestions.filter((_, i) => i !== qi))}><Trash2 size={14} /></button>}
                      </div>
                      <div className="flex gap-2 mobile-stack mb-2">
                        {q.options.map((opt, oi) => (
                          <input key={oi} className="input-field flex-1" placeholder={`Option ${String.fromCharCode(65 + oi)}`} value={opt} onChange={e => { const nq = [...aspQuestions]; nq[qi].options[oi] = e.target.value; setAspQuestions(nq); }} style={{ fontSize: '0.82rem' }} />
                        ))}
                      </div>
                      <select className="input-field" value={q.correct} onChange={e => { const nq = [...aspQuestions]; nq[qi].correct = parseInt(e.target.value); setAspQuestions(nq); }} style={{ maxWidth: '200px', fontSize: '0.82rem' }}>
                        {q.options.map((_, oi) => <option key={oi} value={oi}>Correct: {String.fromCharCode(65 + oi)}</option>)}
                      </select>
                    </div>
                  ))}
                  <div className="flex gap-4 mt-4">
                    <button className="btn-approve" style={{ padding: '0.6rem 1.5rem', fontSize: '0.85rem' }} onClick={() => setAspQuestions([...aspQuestions, { question: '', options: ['', '', '', ''], correct: 0 }])}><Plus size={16} /> Add Question</button>
                    <button className="btn-approve" style={{ padding: '0.6rem 1.5rem', fontSize: '0.85rem', background: aspStream === 'neet' ? 'rgba(34,197,94,0.15)' : 'rgba(129,140,248,0.15)', color: aspStream === 'neet' ? '#22C55E' : '#818CF8' }} onClick={async () => {
                      if (!aspExamTitle.trim()) { toast.error('Enter exam title'); return; }
                      const validQ = aspQuestions.filter(q => q.question.trim() && q.options.every(o => o.trim()));
                      if (validQ.length === 0) { toast.error('Add at least 1 complete question'); return; }
                      try {
                        await addDoc(collection(db, 'aspirant_exams'), { title: aspExamTitle.trim(), stream: aspStream, questions: validQ, duration: validQ.length * 60, created_at: serverTimestamp() });
                        toast.success(`${aspStream.toUpperCase()} exam published with ${validQ.length} questions! ✅`);
                        setAspExamTitle(''); setAspQuestions([{ question: '', options: ['', '', '', ''], correct: 0 }]);
                      } catch (err) { toast.error('Failed: ' + err.message); }
                    }}><Zap size={16} /> Publish Exam</button>
                  </div>
                </div>

                {/* Existing Exams */}
                <div className="glass-card p-8">
                  <h4 className="mb-4" style={{ color: '#94A3B8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📋 {aspStream.toUpperCase()} Exams ({aspirantExams.filter(e => e.stream === aspStream).length})</h4>
                  {aspirantExams.filter(e => e.stream === aspStream).length === 0 ? (
                    <p style={{ color: '#7A8BA8', textAlign: 'center', padding: '2rem' }}>No exams created yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {aspirantExams.filter(e => e.stream === aspStream).map(ex => (
                        <div key={ex.id} className="flex justify-between items-center" style={{ padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px' }}>
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, color: '#F0F4FF', fontSize: '0.9rem' }}>{ex.title}</p>
                            <p style={{ margin: 0, fontSize: '0.72rem', color: '#7A8BA8' }}>{ex.questions?.length || 0} questions · {formatDate(ex.created_at)}</p>
                          </div>
                          <button className="btn-icon" onClick={async () => { await deleteDoc(doc(db, 'aspirant_exams', ex.id)); toast.success('Exam deleted'); }}><Trash2 size={16} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
