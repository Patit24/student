import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../context/AuthContext';
import { Play, Download, MessageSquare, FileText, Shield, Calendar as CalendarIcon, CheckCircle, CreditCard, AlertTriangle, LogOut, Users, Video, Package, Eye, EyeOff, Lock, ChevronRight, XCircle, Activity, TrendingUp, BookOpen, Star, Zap, Sparkles } from 'lucide-react';
import StudentMaterialsPanel from '../components/StudentMaterialsPanel';
import StudentDoubtSolver from '../components/StudentDoubtSolver';
import { subscribeGlobalAssets } from '../db.service';
import { useToast } from '../components/Toast';
import './StudentDashboard.css';

function PasswordResetGate() {
  const { updateUserPassword } = useAppContext();
  const toast = useToast();
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPass.length < 6) { alert('Password must be at least 6 characters'); return; }
    if (newPass !== confirmPass) { alert('Passwords do not match'); return; }
    setLoading(true);
    try {
      await updateUserPassword(newPass);
      toast.success('Account secured! Welcome to your classroom. 🚀');
    } catch (err) { alert('Failed to update password'); }
    setLoading(false);
  };

  return (
    <div className="sd-root">
      <div className="sd-content container flex justify-center items-center" style={{ height: 'calc(100vh - 80px)' }}>
        <div className="sd-card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div className="sd-empty-icon" style={{ width: '64px', height: '64px' }}><Lock size={28} color="#F5C518" /></div>
            <h2 style={{ margin: '0 0 0.5rem' }}>Secure Your Account</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748B' }}>Set a private password to access your classroom.</p>
          </div>
          <form onSubmit={handleReset} className="flex-col gap-4">
            <div className="input-group">
              <label className="input-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? "text" : "password"} className="input-field" placeholder="Min 6 characters" required value={newPass} onChange={e => setNewPass(e.target.value)} style={{ paddingRight: '40px' }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Confirm Password</label>
              <input type="password" className="input-field" placeholder="Repeat password" required value={confirmPass} onChange={e => setConfirmPass(e.target.value)} />
            </div>
            <button disabled={loading} type="submit" className="sd-pay-btn" style={{ marginTop: '0.5rem' }}>
              {loading ? 'Securing...' : 'Set Password & Enter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const { currentUser, verifyOTP, sendOTP, mockSessions, mockNotices, mockStudents, mockBatches, mockTutors, logout } = useAppContext();
  const toast = useToast();
  const navigate = useNavigate();
  const [globalAssets, setGlobalAssets] = useState([]);

  useEffect(() => subscribeGlobalAssets(setGlobalAssets), []);

  const studentRecord = mockStudents.find(s => s.id === currentUser?.uid) || currentUser;
  const myEnrolledBatches = studentRecord?.enrolled_batches || (studentRecord?.batch_id ? [{
    tutor_id: studentRecord.tutorId, batch_id: studentRecord.batch_id,
    payment_status: studentRecord.payment_status, payment_due_date: studentRecord.payment_due_date,
    outstanding_balance: studentRecord.outstanding_balance || 0, monthly_fee: studentRecord.monthly_fee || 2500,
    batch_name: studentRecord.batch_name
  }] : []);

  const isGlobalStudent = myEnrolledBatches.length === 0;
  const [selectedEnrollment, setSelectedEnrollment] = useState(myEnrolledBatches[0] || null);

  useEffect(() => {
    if (!selectedEnrollment && myEnrolledBatches.length > 0) setSelectedEnrollment(myEnrolledBatches[0]);
  }, [myEnrolledBatches]);

  const currentTutor = mockTutors?.find(t => t.id === selectedEnrollment?.tutor_id);
  const autoRestrictionOn = currentTutor?.auto_restriction_enabled ?? true;
  const paymentStatus = selectedEnrollment?.payment_status?.toLowerCase() || 'paid';
  const isOverdue = (paymentStatus === 'overdue' || paymentStatus === 'unpaid') && autoRestrictionOn;
  const isRestricted = paymentStatus === 'restricted' && autoRestrictionOn;

  const { roomId } = useParams();
  const [showBankingModal, setShowBankingModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const mySessions = mockSessions.filter(s => s.batch_id === selectedEnrollment?.batch_id);
  const liveSession = mySessions.find(s => s.is_live);
  
  // Find any live sessions across all enrolled batches
  const enrolledBatchIds = currentUser?.enrolled_batches?.map(b => b.batch_id) || (currentUser?.batch_id ? [currentUser.batch_id] : []);
  const allLiveSessions = mockSessions.filter(s => s.is_live && enrolledBatchIds.includes(s.batch_id));

  useEffect(() => {
    if (currentUser && currentUser.is_verified === false && currentUser.phone)
      sendOTP(currentUser.phone, 'recaptcha-container').catch(console.error);
  }, [currentUser]);

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    try { setOtpError(''); await verifyOTP(otp); } catch { setOtpError('Invalid OTP Code.'); }
  };

  const startStream = (targetRoom = null) => {
    if (isRestricted) { toast.error('⚠️ Account Locked due to pending dues.'); return; }
    const finalRoom = targetRoom || roomId || liveSession?.meeting_link || `ppr-batch-${selectedEnrollment?.batch_id}`;
    if (!finalRoom) { toast.error('No active session found.'); return; }
    if (finalRoom.startsWith('http')) window.open(finalRoom, '_blank');
    else toast.error('Invalid meeting room link.');
  };

  // OTP Gate
  if (currentUser && currentUser.is_verified === false) {
    return (
      <div className="sd-root">
        <div className="sd-content container flex justify-center items-center" style={{ height: 'calc(100vh - 80px)' }}>
          <div id="recaptcha-container"></div>
          <div className="sd-card" style={{ maxWidth: '400px', padding: '2.5rem', textAlign: 'center' }}>
            <div className="sd-empty-icon" style={{ width: '64px', height: '64px' }}><Shield size={28} color="#818CF8" /></div>
            <h2 style={{ margin: '0 0 0.5rem' }}>Verify Account</h2>
            <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '1.5rem' }}>OTP sent to <strong style={{ color: '#F0F4FF' }}>{currentUser.phone}</strong></p>
            <form onSubmit={handleVerifyOTP} className="flex-col gap-4">
              <input type="text" className="input-field text-center" placeholder="• • • • • •" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} required style={{ fontSize: '1.5rem', letterSpacing: '0.5rem', textAlign: 'center' }} />
              {otpError && <p style={{ color: '#EF4444', fontSize: '0.8rem', margin: 0 }}>{otpError}</p>}
              <button type="submit" className="sd-pay-btn">Verify Account</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (currentUser && currentUser.needs_password_reset === true) return <PasswordResetGate />;

  // Global Student (no enrollment)
  if (isGlobalStudent) {
    return (
      <div className="sd-root">
        <div className="sd-content container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
          <div className="sd-header">
            <div>
              <h1 className="sd-header-title">Discover Your <span>Ideal Tutor</span></h1>
              <p className="sd-header-sub">Verified expert educators and premium study resources.</p>
            </div>
            <button onClick={() => logout()} className="sd-logout-btn"><LogOut size={16} /> Logout</button>
          </div>
          <div className="sd-grid" style={{ gridTemplateColumns: '1fr 340px' }}>
            <div className="flex-col gap-4">
              {mockTutors.filter(t => t.subscription_status === 'active' || t.is_verified).map(tutor => (
                <div key={tutor.id} className="sd-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="flex gap-4 items-center">
                    <img src={tutor.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name)}&background=1e293b&color=f5c518&size=128`} style={{ width: '56px', height: '56px', borderRadius: '16px', border: '2px solid rgba(245,197,24,0.2)' }} alt={tutor.name} />
                    <div>
                      <h4 style={{ margin: 0, fontWeight: 800 }}>{tutor.name}</h4>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>{tutor.subjects?.join(' · ')}</p>
                    </div>
                  </div>
                  <button onClick={() => navigate(`/tutor/${tutor.id}`)} className="sd-pay-btn" style={{ width: 'auto', padding: '0.7rem 1.5rem', fontSize: '0.85rem' }}>View</button>
                </div>
              ))}
            </div>
            <div className="flex-col gap-4">
              <div className="sd-card sd-sidebar-card">
                <h4 className="flex items-center gap-2 mb-4"><Package size={18} color="#F5C518" /> Global Library</h4>
                <div className="flex-col gap-2">
                  {globalAssets.map(asset => (
                    <div key={asset.id} className="sd-schedule-item">
                      <div className="sd-schedule-dot"><FileText size={16} color="#F5C518" /></div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem' }}>{asset.name}</p>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#475569' }}>{(asset.size/1024/1024).toFixed(1)} MB</p>
                      </div>
                      <a href={asset.url} target="_blank" rel="noopener noreferrer" style={{ color: '#F5C518' }}><Download size={16} /></a>
                    </div>
                  ))}
                  {globalAssets.length === 0 && <p style={{ color: '#475569', textAlign: 'center', padding: '2rem 0', fontSize: '0.85rem' }}>No resources yet.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══ Main Enrolled Dashboard ═══
  return (
    <div className="sd-root">
      <div className="sd-content container" style={{ paddingBottom: '4rem' }}>

        {/* Global Live Banner */}
        {allLiveSessions.length > 0 && (
          <div className="sd-banner-overdue" style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)', borderColor: 'rgba(34, 197, 94, 0.3)', marginTop: '2rem' }}>
            <div className="flex items-center gap-3">
              <div className="pulse-red" style={{ width: '12px', height: '12px', background: '#EF4444', borderRadius: '50%' }} />
              <span style={{ fontWeight: 800, color: '#EF4444' }}>LIVE CLASS IN PROGRESS</span>
              <span className="hide-on-mobile" style={{ fontSize: '0.9rem', color: '#94A3B8' }}>{allLiveSessions[0].title} is live now!</span>
            </div>
            <button 
              onClick={() => startStream(allLiveSessions[0].meeting_link)}
              className="btn btn-primary" 
              style={{ padding: '0.6rem 1.2rem', fontSize: '0.8rem' }}
            >
              Join Now
            </button>
          </div>
        )}

        {/* Header */}
        <div className="sd-header">
          <div>
            <h1 className="sd-header-title">My <span>Academic Hub</span></h1>
            <p className="sd-header-sub">Welcome back, <strong>{currentUser?.name}</strong></p>
          </div>
          <button onClick={() => logout()} className="sd-logout-btn"><LogOut size={16} /> Logout</button>
        </div>

        {/* Multi-Tutor Selector */}
        {myEnrolledBatches.length > 1 && (
          <div className="sd-tutor-selector">
            {myEnrolledBatches.map((enr, idx) => {
              const tutor = mockTutors.find(t => t.id === enr.tutor_id);
              return (
                <button key={idx} onClick={() => setSelectedEnrollment(enr)} className={`sd-tutor-chip ${selectedEnrollment?.tutor_id === enr.tutor_id ? 'active' : ''}`}>
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(tutor?.name||'T')}&background=1e293b&color=f5c518&size=64`} style={{ width: '36px', height: '36px', borderRadius: '10px' }} alt="" />
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: '0.85rem' }}>{tutor?.name}</p>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B' }}>{enr.batch_name}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Main Grid */}
        <div className="sd-grid">
          {/* ── Left Column ── */}
          <div className="flex-col gap-4">

            {/* Tab Navigation */}
            <div className="sd-tabs">
              {[
                { id: 'overview', icon: <Activity size={16} />, label: 'Overview' },
                { id: 'live', icon: <Video size={16} />, label: 'Live Class' },
                { id: 'materials', icon: <BookOpen size={16} />, label: 'Library' },
                { id: 'ai', icon: <Sparkles size={16} />, label: 'AI Doubt Solver' },
                { id: 'payments', icon: <CreditCard size={16} />, label: 'Fees' },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`sd-tab ${activeTab === tab.id ? 'active' : ''}`}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Overdue Banner */}
            {isOverdue && (
              <div className="sd-banner-overdue">
                <div className="flex items-center gap-4">
                  <AlertTriangle size={20} color="#F5C518" />
                  <div>
                    <p style={{ margin: 0, fontWeight: 800, color: '#F5C518', fontSize: '0.9rem' }}>Payment Overdue</p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>Library access restricted until payment.</p>
                  </div>
                </div>
                <button className="sd-pay-btn" style={{ width: 'auto', padding: '0.6rem 1.4rem', fontSize: '0.8rem' }} onClick={() => setActiveTab('payments')}>Pay Now</button>
              </div>
            )}

            {/* Restricted Banner */}
            {isRestricted && (
              <div className="sd-banner-restricted">
                <div className="lock-icon"><Lock size={28} color="#EF4444" /></div>
                <h2 style={{ color: '#EF4444', margin: '0 0 0.5rem', fontWeight: 900 }}>ACCOUNT LOCKED</h2>
                <p style={{ color: '#64748B', margin: '0 0 1.5rem', fontSize: '0.9rem' }}>Clear ₹{selectedEnrollment?.outstanding_balance} to unlock your classroom.</p>
                <button className="sd-pay-btn" style={{ maxWidth: '280px', margin: '0 auto', background: 'linear-gradient(135deg, #EF4444, #DC2626)' }} onClick={() => setActiveTab('payments')}>Unlock Account</button>
              </div>
            )}

            {/* ── TAB: Overview ── */}
            {activeTab === 'overview' && (
              <div className="flex-col gap-4 sd-animate">
                <div className="sd-stat-grid">
                  <div className="sd-card sd-stat sd-animate sd-animate-delay-1">
                    <div className="sd-stat-icon" style={{ background: 'rgba(129,140,248,0.1)' }}><Video size={20} color="#818CF8" /></div>
                    <p className="sd-stat-label">Live Classes</p>
                    <p className="sd-stat-value indigo">{mySessions.length}</p>
                  </div>
                  <div className="sd-card sd-stat sd-animate sd-animate-delay-2">
                    <div className="sd-stat-icon" style={{ background: 'rgba(245,197,24,0.1)' }}><Zap size={20} color="#F5C518" /></div>
                    <p className="sd-stat-label">Test Average</p>
                    <p className="sd-stat-value gold">88.5</p>
                  </div>
                  <div className="sd-card sd-stat sd-animate sd-animate-delay-3">
                    <div className="sd-stat-icon" style={{ background: 'rgba(34,197,94,0.1)' }}><FileText size={20} color="#22C55E" /></div>
                    <p className="sd-stat-label">Study Materials</p>
                    <p className="sd-stat-value green">{globalAssets.length}</p>
                  </div>
                </div>

                <div className="sd-card sd-notice sd-animate sd-animate-delay-2">
                  <h4 className="flex items-center gap-2 mb-4" style={{ fontWeight: 800 }}><MessageSquare size={18} color="#F5C518" /> Notice Board</h4>
                  <div className="flex-col gap-4">
                    {mockNotices.filter(n => enrolledBatchIds.includes(n.batch_id)).sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).map(notice => (
                      <div key={notice.id} className="sd-notice-item">
                        <div className="sd-notice-badge"><Star size={10} /> {new Date(notice.created_at) > new Date(Date.now() - 86400000) ? 'New' : 'Update'}</div>
                        <p style={{ fontWeight: 800, margin: '0 0 0.4rem', fontSize: '0.95rem', color: '#F0F4FF' }}>{notice.title}</p>
                        <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0, lineHeight: 1.6 }}>{notice.content}</p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--hp-yellow)', marginTop: '0.5rem', opacity: 0.8 }}>— {notice.tutor_name}</p>
                      </div>
                    ))}
                    {mockNotices.filter(n => enrolledBatchIds.includes(n.batch_id)).length === 0 && (
                      <p className="text-muted text-center py-4">No notices yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: Library ── */}
            {activeTab === 'materials' && (
              <div className="sd-card sd-animate" style={{ padding: '2rem' }}>
                <h3 className="flex items-center gap-2 mb-4" style={{ fontWeight: 800 }}><BookOpen size={20} color="#F5C518" /> Batch Library</h3>
                <StudentMaterialsPanel batchId={selectedEnrollment?.batch_id} isLocked={isRestricted || isOverdue} />
              </div>
            )}

            {/* ── TAB: Fees ── */}
            {activeTab === 'payments' && (
              <div className="sd-card sd-fee-hero sd-animate">
                <div className="flex justify-between items-start" style={{ marginBottom: '1.5rem' }}>
                  <div>
                    <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem' }}>Fee Management</h2>
                    <p style={{ color: '#64748B', margin: '0.3rem 0 0', fontSize: '0.85rem' }}>Pay tuition directly to your teacher</p>
                  </div>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(245,197,24,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CreditCard size={22} color="#F5C518" />
                  </div>
                </div>

                <div className="sd-fee-grid">
                  <div className="sd-fee-box amount">
                    <p className="sd-bank-label">Monthly Fee</p>
                    <p className="sd-fee-amount">₹{selectedEnrollment?.monthly_fee}</p>
                  </div>
                  <div className={`sd-fee-box status ${(isOverdue || isRestricted) ? 'danger' : ''}`}>
                    <p className="sd-bank-label">Status</p>
                    <p style={{ margin: '0.3rem 0 0', fontSize: '1.4rem', fontWeight: 900, color: (isOverdue || isRestricted) ? '#EF4444' : '#22C55E' }}>
                      {paymentStatus.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '18px', border: '1px dashed rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize: '0.85rem', lineHeight: 1.7, color: '#94A3B8', margin: '0 0 1.5rem' }}>
                    Transfer <strong style={{ color: '#F5C518' }}>₹{selectedEnrollment?.outstanding_balance || selectedEnrollment?.monthly_fee}</strong> to <strong style={{ color: '#F0F4FF' }}>{currentTutor?.name}</strong> and upload Transaction ID for approval.
                  </p>
                  <button className="sd-pay-btn" onClick={() => setShowBankingModal(true)}>
                    <CreditCard size={18} /> Get Bank & UPI Details
                  </button>
                </div>
              </div>
            )}

            {/* ── TAB: AI Doubt Solver ── */}
            {activeTab === 'ai' && !isRestricted && (
              <div className="sd-animate">
                <StudentDoubtSolver tutorId={selectedEnrollment?.tutor_id} />
              </div>
            )}

            {/* ── TAB: Live ── */}
            {activeTab === 'live' && (
              <div className="sd-card sd-empty-state sd-animate">
                <div className="sd-empty-icon"><Video size={32} color="#818CF8" /></div>
                <h3 style={{ margin: '0 0 0.5rem', fontWeight: 800 }}>Live Classes</h3>
                <p style={{ color: '#475569', fontSize: '0.9rem', margin: 0 }}>No active sessions right now. Check your schedule.</p>
              </div>
            )}
          </div>

          {/* ── Right Sidebar ── */}
          <div className="flex-col gap-4">
            {/* Active Batch Card */}
            <div className="sd-card sd-sidebar-card sd-animate sd-animate-delay-1">
              <p className="sd-batch-label"><span className="dot"></span> Active Batch</p>
              <h3 className="sd-batch-name">{selectedEnrollment?.batch_name || 'My Batch'}</h3>
              <div className="sd-tutor-row">
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentTutor?.name||'T')}&background=1e293b&color=f5c518&size=64`} className="sd-tutor-avatar" alt="" />
                <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>Tutor: <strong style={{ color: '#F0F4FF' }}>{currentTutor?.name}</strong></span>
              </div>
              <button className={`sd-join-btn ${liveSession ? 'live' : 'offline'}`} disabled={!liveSession || isRestricted} onClick={() => startStream()}>
                {liveSession ? <><Play size={18} /> Join Live Now</> : 'Class Offline'}
              </button>
            </div>

            {/* Schedule Card */}
            <div className="sd-card sd-sidebar-card sd-animate sd-animate-delay-2">
              <h4 className="flex items-center gap-2 mb-4" style={{ fontWeight: 800 }}><CalendarIcon size={16} color="#F5C518" /> Schedule</h4>
              <div className="flex-col gap-2">
                {mySessions.length > 0 ? mySessions.slice(0, 3).map(s => (
                  <div key={s.id} className="sd-schedule-item">
                    <div className="sd-schedule-dot"><CalendarIcon size={14} color="#818CF8" /></div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem' }}>Session</p>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: '#475569' }}>{new Date(s.scheduled_time).toLocaleString()}</p>
                    </div>
                  </div>
                )) : <p style={{ color: '#475569', textAlign: 'center', padding: '2rem 0', fontSize: '0.85rem' }}>No sessions found.</p>}
              </div>
            </div>
          </div>
        </div>

        {/* ── Banking Modal ── */}
        {showBankingModal && (
          <div className="sd-modal-overlay">
            <div className="sd-card sd-modal">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <p className="sd-notice-badge" style={{ marginBottom: '0.5rem' }}><CreditCard size={10} /> Direct Pay</p>
                  <h3 style={{ margin: 0, fontWeight: 900 }}>Transfer Details</h3>
                </div>
                <button className="sd-modal-close" onClick={() => setShowBankingModal(false)}><XCircle size={18} /></button>
              </div>

              <div className="flex-col gap-2">
                <div className="sd-bank-row">
                  <p className="sd-bank-label">Account Holder</p>
                  <p className="sd-bank-value">{currentTutor?.name}</p>
                </div>
                <div className="sd-bank-row highlight">
                  <p className="sd-bank-label">Bank Account Number</p>
                  <p className="sd-bank-value gold">{currentTutor?.banking?.accountNumber || 'XXXXXXXXXXXX'}</p>
                </div>
                <div className="sd-bank-row">
                  <p className="sd-bank-label">IFSC Code</p>
                  <p className="sd-bank-value">{currentTutor?.banking?.ifscCode || 'IFSC00123'}</p>
                </div>
                <div className="sd-bank-row" style={{ borderColor: 'rgba(129,140,248,0.15)', background: 'rgba(129,140,248,0.03)' }}>
                  <p className="sd-bank-label">UPI ID</p>
                  <p className="sd-bank-value primary">{currentTutor?.banking?.upiId || `${currentTutor?.phone}@upi`}</p>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <p className="sd-bank-label" style={{ marginBottom: '0.5rem' }}>Transaction ID / UTR</p>
                <input type="text" className="input-field" placeholder="e.g. 1234567890" style={{ marginBottom: '1rem' }} />
                <button className="sd-pay-btn" onClick={() => { toast.success('Verification request sent!'); setShowBankingModal(false); }}>
                  <CheckCircle size={18} /> Verify Payment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
