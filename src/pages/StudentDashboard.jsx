import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../context/AuthContext';
import { Play, Download, MessageSquare, FileText, Shield, Clock, Calendar as CalendarIcon, CheckCircle, ShieldAlert, CheckSquare, CreditCard, AlertTriangle, LogOut, Phone, Users, Video, Search, Package, Eye, EyeOff, Lock, TrendingUp, Zap, DownloadCloud, ChevronRight, XCircle } from 'lucide-react';
import ChatSidebar from '../components/ChatSidebar';
import PaymentBanner from '../components/PaymentBanner';
import TestCenter from '../components/TestCenter';
import FeeProgressBar from '../components/FeeProgressBar';
import StudentMaterialsPanel from '../components/StudentMaterialsPanel';
import { subscribeGlobalAssets } from '../db.service';
import { useToast } from '../components/Toast';

function PasswordResetGate() {
  const { updateUserPassword } = useAppContext();
  const toast = useToast();
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPass.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    if (newPass !== confirmPass) {
      alert('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await updateUserPassword(newPass);
      toast.success('Account secured successfully! Welcome to your classroom. 🚀');
    } catch (err) {
      console.error(err);
      alert('Failed to update password');
    }
    setLoading(false);
  };

  return (
    <div className="container flex justify-center items-center animate-fade-in" style={{ height: 'calc(100vh - 80px)' }}>
      <div className="glass-panel p-8" style={{ width: '100%', maxWidth: '400px', border: '1px solid var(--secondary)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ width: '64px', height: '64px', background: 'rgba(34,197,94,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Lock size={32} color="var(--secondary)" />
          </div>
          <h2 style={{ marginBottom: '0.5rem' }}>Secure Your Account</h2>
          <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>This is your first login. Please set a new private password to continue to your classroom.</p>
        </div>

        <form onSubmit={handleReset} className="flex-col gap-5">
          <div className="input-group">
            <label className="input-label">New Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPass ? "text" : "password"} 
                className="input-field" 
                placeholder="Minimum 6 characters"
                required 
                value={newPass} 
                onChange={e => setNewPass(e.target.value)} 
                style={{ paddingRight: '45px' }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#7A8BA8', cursor: 'pointer', display: 'flex' }}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Confirm Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Repeat your password"
              required 
              value={confirmPass} 
              onChange={e => setConfirmPass(e.target.value)} 
            />
          </div>

          <button disabled={loading} type="submit" className="btn btn-primary w-full mt-2" style={{ padding: '1.1rem', fontSize: '1rem', fontWeight: 700 }}>
            {loading ? 'Securing Account...' : 'Set Password & Enter Classroom'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const { 
    currentUser, verifyOTP, sendOTP, mockSessions, mockExams, 
    mockSubmissions, mockStudents, mockBatches, mockTutors, 
    logout 
  } = useAppContext();
  const toast = useToast();
  const navigate = useNavigate();

  const [globalAssets, setGlobalAssets] = useState([]);

  useEffect(() => {
    return subscribeGlobalAssets(setGlobalAssets);
  }, []);

  // ── Multi-Teacher Enrollment Logic ──
  const studentRecord = mockStudents.find(s => s.id === currentUser?.uid) || currentUser;
  
  const myEnrolledBatches = studentRecord?.enrolled_batches || (studentRecord?.batch_id ? [{
    tutor_id: studentRecord.tutorId,
    batch_id: studentRecord.batch_id,
    payment_status: studentRecord.payment_status,
    payment_due_date: studentRecord.payment_due_date,
    outstanding_balance: studentRecord.outstanding_balance || 0,
    monthly_fee: studentRecord.monthly_fee || 2500
  }] : []);

  const isGlobalStudent = myEnrolledBatches.length === 0;
  const [selectedEnrollment, setSelectedEnrollment] = useState(myEnrolledBatches[0] || null);

  useEffect(() => {
    if (!selectedEnrollment && myEnrolledBatches.length > 0) {
      setSelectedEnrollment(myEnrolledBatches[0]);
    }
  }, [myEnrolledBatches]);

  const currentTutor = mockTutors?.find(t => t.id === selectedEnrollment?.tutor_id);
  const currentBatch = mockBatches?.find(b => b.id === selectedEnrollment?.batch_id);
  
  const autoRestrictionOn = currentTutor?.auto_restriction_enabled ?? true;
  const paymentStatus = selectedEnrollment?.payment_status?.toLowerCase() || 'paid';
  const isOverdue = paymentStatus === 'overdue' && autoRestrictionOn;
  const isRestricted = paymentStatus === 'restricted' && autoRestrictionOn;

  const { roomId } = useParams();
  const [showBankingModal, setShowBankingModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); 
  const [activeExam, setActiveExam] = useState(null);

  const mySessions = mockSessions.filter(s => s.batch_id === selectedEnrollment?.batch_id);
  const liveSession = mySessions.find(s => s.is_live);

  useEffect(() => {
    if (currentUser && currentUser.is_verified === false && currentUser.phone) {
      sendOTP(currentUser.phone, 'recaptcha-container').catch(console.error);
    }
  }, [currentUser]);

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    try {
      setOtpError('');
      await verifyOTP(otp);
    } catch (err) {
      setOtpError('Invalid OTP Code.');
    }
  };

  const startStream = (targetRoom = null) => {
    if (isRestricted) {
      toast.error('⚠️ Account Locked due to pending dues.');
      return;
    }
    const finalRoom = targetRoom || roomId || liveSession?.room_id || `ppr-batch-${selectedEnrollment?.batch_id}`;
    if (!finalRoom) {
      toast.error('No active session found.');
      return;
    }
    if (finalRoom.includes('meet.google.com')) {
      window.open(finalRoom, '_blank');
    }
  };

  if (currentUser && currentUser.is_verified === false) {
    return (
      <div className="container flex justify-center items-center animate-fade-in" style={{ height: 'calc(100vh - 80px)' }}>
        <div id="recaptcha-container"></div>
        <div className="glass-panel p-8 text-center" style={{ maxWidth: '400px', border: '1px solid var(--primary)' }}>
          <Shield size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
          <h2 className="mb-2">Verify Your Account</h2>
          <p className="text-muted mb-6">Enter the 6-digit OTP sent to: <strong>{currentUser.phone}</strong></p>
          <form onSubmit={handleVerifyOTP} className="flex-col gap-4">
            <input 
              type="text" className="input-field text-center" placeholder="123456" 
              value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} required 
              style={{ fontSize: '1.5rem', letterSpacing: '0.5rem' }} 
            />
            {otpError && <p style={{ color: '#EF4444', fontSize: '0.85rem' }}>{otpError}</p>}
            <button type="submit" className="btn btn-primary w-full mt-2">Verify Account</button>
          </form>
        </div>
      </div>
    );
  }

  if (currentUser && currentUser.needs_password_reset === true) {
    return <PasswordResetGate />;
  }

  if (isGlobalStudent) {
    return (
      <div className="container mt-8 animate-fade-in" style={{ paddingBottom: '4rem' }}>
        <div className="flex justify-between items-end mb-12 mobile-stack">
          <div>
            <h1 style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', fontWeight: 900, letterSpacing: '-2px' }}>
              Discover Your <span style={{ color: 'var(--primary)' }}>Ideal Tutor</span>
            </h1>
            <p className="text-muted mt-2">Verified expert educators and premium study resources.</p>
          </div>
          <button onClick={() => logout()} className="btn btn-outline mobile-full">Logout</button>
        </div>

        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-12 lg:col-span-8 flex-col gap-6">
            <h3 className="flex items-center gap-2"><Users size={24} color="#F5C518"/> Expert Educators</h3>
            {mockTutors.filter(t => t.subscription_status === 'active' || t.is_verified).map((tutor) => (
              <div key={tutor.id} className="glass-panel p-6 flex justify-between items-center hover-scale">
                <div className="flex gap-6 items-center">
                  <img 
                    src={tutor.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name)}&background=random&color=fff&size=128`} 
                    style={{ width: '80px', height: '80px', borderRadius: '22px', border: '2px solid rgba(255,255,255,0.1)' }} 
                  />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{tutor.name}</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#7A8BA8' }}>{tutor.subjects?.join(' • ')}</p>
                  </div>
                </div>
                <button onClick={() => navigate(`/tutor/${tutor.id}`)} className="btn btn-primary">View Profile</button>
              </div>
            ))}
          </div>

          <div className="col-span-12 lg:col-span-4 flex-col gap-6">
            <h3 className="flex items-center gap-2"><Package size={24} color="#F5C518"/> Global Library</h3>
            <div className="glass-panel p-8">
              {globalAssets.map((asset) => (
                <div key={asset.id} className="asset-card flex items-center gap-4 p-4 mb-4" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '20px' }}>
                  <FileText size={22} color="#F5C518" />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0 }}>{asset.name}</p>
                    <p style={{ fontSize: '0.7rem', color: '#7A8BA8', margin: 0 }}>{(asset.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                  <a href={asset.url} target="_blank" rel="noopener noreferrer"><Download size={18} /></a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-6 animate-fade-in" style={{ paddingBottom: '4rem' }}>
      
      {/* ── Dashboard Header ── */}
      <div className="flex justify-between items-end mb-10 mobile-stack">
        <div>
          <h1 style={{ fontWeight: 900, letterSpacing: '-1.5px', margin: 0, fontSize: 'clamp(1.5rem, 4vw, 2.8rem)' }}>
            My <span style={{ color: 'var(--primary)' }}>Academic Hub</span>
          </h1>
          <p className="text-muted" style={{ margin: '0.3rem 0 0' }}>Welcome back, <strong>{currentUser?.name}</strong>. Keep learning!</p>
        </div>
        <button onClick={() => logout()} className="btn btn-outline mobile-full"><LogOut size={16}/> Logout</button>
      </div>

      {/* ── Multi-Tutor Selector ── */}
      {myEnrolledBatches.length > 1 && (
        <div className="flex gap-4 mb-10 overflow-x-auto pb-4 no-scrollbar">
          {myEnrolledBatches.map((enr, idx) => {
            const tutor = mockTutors.find(t => t.id === enr.tutor_id);
            const isActive = selectedEnrollment?.tutor_id === enr.tutor_id;
            return (
              <button 
                key={idx} onClick={() => setSelectedEnrollment(enr)}
                className={`glass-panel p-4 flex items-center gap-4 transition-all ${isActive ? 'active-glow' : 'opacity-60'}`}
                style={{ minWidth: '220px', border: isActive ? '1px solid var(--primary)' : '1px solid transparent' }}
              >
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(tutor?.name||'T')}&background=random&color=fff&size=64`} style={{ width: '40px', height: '40px', borderRadius: '12px' }} />
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0 }}>{tutor?.name}</p>
                  <p style={{ fontSize: '0.7rem', color: '#7A8BA8', margin: 0 }}>{enr.batch_name}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Dashboard Grid ── */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* Main Content Column */}
        <div className="col-span-12 lg:col-span-8 flex-col gap-8">
          
          {/* Global Tab Nav */}
          <div className="tab-nav mb-8 overflow-x-auto pb-2" style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setActiveTab('overview')} className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}><Activity size={18} /> Overview</button>
            <button onClick={() => setActiveTab('live')} className={`nav-btn ${activeTab === 'live' ? 'active' : ''}`}><Video size={18} /> Live</button>
            <button onClick={() => setActiveTab('materials')} className={`nav-btn ${activeTab === 'materials' ? 'active' : ''}`}><FileText size={18} /> Library</button>
            <button onClick={() => setActiveTab('payments')} className={`nav-btn ${activeTab === 'payments' ? 'active' : ''}`}><CreditCard size={18} /> Fees</button>
          </div>

          {/* Overdue/Restricted Banners */}
          {isOverdue && (
            <div className="glass-panel p-6 border-l-4 border-yellow-500 mb-8" style={{ background: 'rgba(245,197,24,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="flex items-center gap-4">
                <AlertTriangle color="#F5C518" />
                <div>
                  <h4 style={{ margin: 0, color: '#F5C518' }}>Payment Overdue</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>Your fee for {currentTutor?.name} is pending. Library restricted.</p>
                </div>
              </div>
              <button className="btn btn-primary" onClick={() => setActiveTab('payments')}>Pay Now</button>
            </div>
          )}

          {isRestricted && (
            <div className="glass-panel p-10 border-l-4 border-red-500 text-center mb-8" style={{ background: 'rgba(239,68,68,0.05)' }}>
              <Lock size={48} color="#EF4444" style={{ marginBottom: '1rem' }} />
              <h2 style={{ color: '#EF4444', margin: 0 }}>ACCOUNT LOCKED</h2>
              <p>Please clear your dues of ₹{selectedEnrollment?.outstanding_balance} to unlock your classroom.</p>
              <button className="btn btn-primary" onClick={() => setActiveTab('payments')} style={{ background: '#EF4444' }}>Unlock Now</button>
            </div>
          )}

          {/* Tab Contents */}
          {activeTab === 'overview' && (
            <div className="animate-reveal flex-col gap-8">
              <div className="grid grid-cols-3 gap-6 mobile-grid-1">
                <div className="glass-panel p-6 border-l-4 border-indigo-500">
                  <p style={{ fontSize: '0.7rem', color: '#7A8BA8', textTransform: 'uppercase' }}>Attendance</p>
                  <h2 style={{ margin: 0 }}>94%</h2>
                </div>
                <div className="glass-panel p-6 border-l-4 border-yellow-500">
                  <p style={{ fontSize: '0.7rem', color: '#7A8BA8', textTransform: 'uppercase' }}>Test Avg</p>
                  <h2 style={{ margin: 0 }}>88.5</h2>
                </div>
                <div className="glass-panel p-6 border-l-4 border-green-500">
                  <p style={{ fontSize: '0.7rem', color: '#7A8BA8', textTransform: 'uppercase' }}>Assignments</p>
                  <h2 style={{ margin: 0 }}>12/14</h2>
                </div>
              </div>

              <div className="glass-panel p-8">
                <h3 className="flex items-center gap-2 mb-4"><MessageSquare size={20} color="var(--primary)" /> Notice Board</h3>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: '15px' }}>
                  <p style={{ fontWeight: 700, margin: '0 0 0.5rem' }}>Sunday Unit Test Reminder</p>
                  <p style={{ fontSize: '0.9rem', color: '#7A8BA8', margin: 0 }}>Syllabus covers Human Physiology. Study materials are available in the Library tab.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'materials' && (
            <div className="glass-panel p-8 animate-reveal">
              <h3 className="flex items-center gap-2 mb-6"><FileText size={20} color="var(--primary)" /> Batch Library</h3>
              <StudentMaterialsPanel batchId={selectedEnrollment?.batch_id} isLocked={isRestricted || isOverdue} />
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="animate-reveal flex-col gap-8">
              <div className="glass-panel p-10" style={{ border: '1px solid rgba(245,197,24,0.2)', background: 'linear-gradient(135deg, rgba(245,197,24,0.05) 0%, transparent 100%)' }}>
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 style={{ margin: 0 }}>Fee Management</h2>
                    <p style={{ color: '#7A8BA8', margin: 0 }}>Pay your monthly tuition directly to your teacher.</p>
                  </div>
                  <CreditCard size={32} color="#F5C518" />
                </div>

                <div className="grid grid-cols-2 gap-6 mb-10">
                  <div className="glass-panel p-6">
                    <p style={{ fontSize: '0.7rem', color: '#7A8BA8' }}>MONTHLY FEE</p>
                    <h1 style={{ margin: 0 }}>₹{selectedEnrollment?.monthly_fee}</h1>
                  </div>
                  <div className="glass-panel p-6" style={{ background: (isOverdue || isRestricted) ? 'rgba(239,68,68,0.05)' : 'rgba(34,197,94,0.05)' }}>
                    <p style={{ fontSize: '0.7rem', color: '#7A8BA8' }}>STATUS</p>
                    <h3 style={{ margin: 0, color: (isOverdue || isRestricted) ? '#EF4444' : '#22C55E' }}>{paymentStatus.toUpperCase()}</h3>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                   <p style={{ fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                     Transfer ₹{selectedEnrollment?.outstanding_balance || selectedEnrollment?.monthly_fee} to <strong>{currentTutor?.name}</strong> using the details provided. Upload Transaction ID for approval.
                   </p>
                   <button className="btn btn-primary w-full" style={{ padding: '1.2rem', fontWeight: 900 }} onClick={() => setShowBankingModal(true)}>
                     Get Bank & UPI Details
                   </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'live' && (
            <div className="glass-panel p-20 text-center opacity-40">
               <Video size={48} style={{ marginBottom: '1rem' }} />
               <h3>Live Classes</h3>
               <p>No active sessions. Check the schedule in the sidebar.</p>
            </div>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="col-span-12 lg:col-span-4 flex-col gap-8">
          <div className="glass-panel p-8">
            <p style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase' }}>Active Batch</p>
            <h2 style={{ fontSize: '1.8rem', margin: '0.5rem 0' }}>{selectedEnrollment?.batch_name}</h2>
            <div className="flex items-center gap-2 mb-6">
              <Users size={16} color="#7A8BA8" />
              <span style={{ fontSize: '0.85rem' }}>Tutor: <strong>{currentTutor?.name}</strong></span>
            </div>
            <button className="btn btn-primary w-full p-4" disabled={!liveSession || isRestricted} onClick={() => startStream()}>
              {liveSession ? 'Join Live Now' : 'Class Offline'}
            </button>
          </div>

          <div className="glass-panel p-8">
             <h4 className="flex items-center gap-2 mb-6"><CalendarIcon size={18} color="var(--primary)"/> Schedule</h4>
             <div className="flex-col gap-4">
                {mySessions.length > 0 ? mySessions.slice(0, 3).map(s => (
                  <div key={s.id} className="p-4" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '15px' }}>
                    <p style={{ margin: 0, fontWeight: 700 }}>Regular Session</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#7A8BA8' }}>{new Date(s.scheduled_time).toLocaleString()}</p>
                  </div>
                )) : <p className="text-muted text-center py-6">No sessions found.</p>}
             </div>
          </div>
        </div>
      </div>

      {/* ── Banking Modal ── */}
      {showBankingModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>
          <div className="glass-panel p-10 animate-slide-up" style={{ width: '100%', maxWidth: '450px', border: '1px solid rgba(245,197,24,0.3)', borderRadius: '32px' }}>
            <div className="flex justify-between items-center mb-8">
               <h3 style={{ margin: 0 }}>Transfer Details</h3>
               <button onClick={() => setShowBankingModal(false)} style={{ background: 'none', border: 'none', color: '#7A8BA8' }}>✕</button>
            </div>

            <div className="flex-col gap-4">
               <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: '15px' }}>
                 <p style={{ fontSize: '0.7rem', color: '#7A8BA8', margin: '0 0 0.3rem' }}>ACCOUNT HOLDER</p>
                 <p style={{ fontWeight: 800, margin: 0 }}>{currentTutor?.name}</p>
               </div>
               <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: '15px' }}>
                 <p style={{ fontSize: '0.7rem', color: '#7A8BA8', margin: '0 0 0.3rem' }}>BANK ACCOUNT NUMBER</p>
                 <p style={{ fontWeight: 900, color: '#F5C518', margin: 0 }}>{currentTutor?.banking?.accountNumber || 'XXXXXXXXXXXX'}</p>
               </div>
               <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: '15px' }}>
                 <p style={{ fontSize: '0.7rem', color: '#7A8BA8', margin: '0 0 0.3rem' }}>IFSC CODE</p>
                 <p style={{ fontWeight: 800, margin: 0 }}>{currentTutor?.banking?.ifscCode || 'IFSC00123'}</p>
               </div>
               <div style={{ background: 'rgba(79,70,229,0.05)', padding: '1.2rem', borderRadius: '15px', border: '1px solid rgba(79,70,229,0.2)' }}>
                 <p style={{ fontSize: '0.7rem', color: '#7A8BA8', margin: '0 0 0.3rem' }}>UPI ID</p>
                 <p style={{ fontWeight: 900, color: 'var(--primary)', margin: 0 }}>{currentTutor?.banking?.upiId || `${currentTutor?.phone}@upi`}</p>
               </div>
            </div>

            <div className="mt-8">
               <label style={{ fontSize: '0.7rem', color: '#7A8BA8', display: 'block', marginBottom: '0.5rem' }}>TRANSACTION ID / UTR</label>
               <input type="text" className="input-field mb-4" placeholder="e.g. 1234567890" />
               <button className="btn btn-primary w-full p-4" onClick={() => { alert('Verification Request Sent!'); setShowBankingModal(false); }}>
                 Verify Payment
               </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .nav-btn {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);
          padding: 0.8rem 1.5rem; border-radius: 12px; color: #7A8BA8;
          display: flex; align-items: center; gap: 0.6rem; transition: all 0.3s;
          white-space: nowrap; font-weight: 700; cursor: pointer;
        }
        .nav-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .nav-btn.active { background: var(--primary); color: #000; border-color: var(--primary); }
        .active-glow { box-shadow: 0 0 20px rgba(79,70,229,0.2); }
        .hover-scale:hover { transform: translateY(-3px); background: rgba(255,255,255,0.05); }
      `}</style>
    </div>
  );
}
