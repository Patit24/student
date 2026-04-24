import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AuthContext';
import { Play, Download, MessageSquare, FileText, Shield, Clock, Calendar as CalendarIcon, CheckCircle, ShieldAlert, CheckSquare, CreditCard, AlertTriangle, LogOut, Phone, Users, Video, Search, Package } from 'lucide-react';
import ChatSidebar from '../components/ChatSidebar';
import PaymentBanner from '../components/PaymentBanner';
import TestCenter from '../components/TestCenter';
import FeeProgressBar from '../components/FeeProgressBar';
import StudentMaterialsPanel from '../components/StudentMaterialsPanel';
import { subscribeGlobalAssets } from '../db.service';
import { useToast } from '../components/Toast';

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
  // Get the live student record
  const studentRecord = mockStudents.find(s => s.id === currentUser?.uid) || currentUser;
  
  // Normalized enrolled batches (support both old 'batch_id' and new 'enrolled_batches')
  const myEnrolledBatches = studentRecord?.enrolled_batches || (studentRecord?.batch_id ? [{
    tutor_id: studentRecord.tutorId,
    batch_id: studentRecord.batch_id,
    payment_status: studentRecord.payment_status,
    payment_due_date: studentRecord.payment_due_date,
    outstanding_balance: studentRecord.outstanding_balance || 0,
    monthly_fee: studentRecord.monthly_fee || 2500
  }] : []);

  const isGlobalStudent = myEnrolledBatches.length === 0;

  // Select first batch by default if available
  const [selectedEnrollment, setSelectedEnrollment] = useState(myEnrolledBatches[0] || null);

  // Re-sync selected enrollment if data changes
  useEffect(() => {
    if (!selectedEnrollment && myEnrolledBatches.length > 0) {
      setSelectedEnrollment(myEnrolledBatches[0]);
    }
  }, [myEnrolledBatches]);

  const currentTutor = mockTutors?.find(t => t.id === selectedEnrollment?.tutor_id);
  const currentBatch = mockBatches?.find(b => b.id === selectedEnrollment?.batch_id);
  
  // Specific payment check for selected batch
  const autoRestrictionOn = currentTutor?.auto_restriction_enabled ?? true;
  const isOverdue = selectedEnrollment?.payment_status === 'overdue' && autoRestrictionOn;

  // OTP States
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  // Class States
  const [inClass, setInClass] = useState(false);
  const [joinState, setJoinState] = useState('idle');
  const [isClassPrivate, setIsClassPrivate] = useState(true);

  // Exam State
  const [activeExam, setActiveExam] = useState(null);

  // My data filtered by selected enrollment
  const mySessions = mockSessions.filter(s => s.batch_id === selectedEnrollment?.batch_id);
  const myExams = mockExams.filter(e => e.batchId === selectedEnrollment?.batch_id);
  const mySubmissions = mockSubmissions.filter(s => s.student_id === currentUser?.uid);


  useEffect(() => {
    // Auto-trigger OTP if not verified
    if (currentUser && currentUser.is_verified === false && currentUser.phone) {
      sendOTP(currentUser.phone, 'recaptcha-container')
        .then(() => toast.success('Verification code sent to your phone! 📱'))
        .catch(err => {
          console.error('Auto-OTP failed:', err);
          toast.error('Failed to send SMS: ' + (err.message.includes('auth/operation-not-allowed') ? 'Enable Phone Auth in Firebase Console' : err.message));
        });
    }
  }, [currentUser]);

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    try {
      setOtpError('');
      await verifyOTP(otp);
    } catch (err) {
      setOtpError('Invalid OTP Code. Please enter 123456.');
    }
  };

  const handleJoinClass = async () => {
    if (isOverdue) {
      alert('⚠️ Your access is restricted due to an overdue payment for this batch.');
      return;
    }
    if (isClassPrivate && joinState === 'idle') {
      setJoinState('knocking');
      setTimeout(() => { setJoinState('approved'); startStream(); }, 5000);
    } else {
      startStream();
    }
  };

  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);

  const startStream = async () => {
    setInClass(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      console.error('Error joining stream.', err);
    }
  };

  const handleLeaveClass = () => {
    stream?.getTracks().forEach(t => t.stop());
    setInClass(false);
    setJoinState('idle');
  };

  const formatCountdown = (t) => {
    const diff = new Date(t).getTime() - now;
    if (diff <= 0) return 'Live Now';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${h}h ${m}m ${s}s`;
  };

  // ── VIEW: OTP GATE ──
  if (currentUser && currentUser.is_verified === false) {
    return (
      <div className="container flex justify-center items-center animate-fade-in" style={{ height: 'calc(100vh - 80px)' }}>
        <div id="recaptcha-container"></div>
        <div className="glass-panel p-8 text-center" style={{ maxWidth: '400px', border: '1px solid var(--primary)' }}>
          <Shield size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
          <h2 className="mb-2">Verify Your Account</h2>
          <p className="text-muted mb-6">Enter the 6-digit OTP sent to your registered mobile number: <strong>{currentUser.phone}</strong></p>
          <form onSubmit={handleVerifyOTP} className="flex-col gap-4">
            <input 
              type="text" 
              className="input-field text-center" 
              placeholder="Enter OTP (123456)" 
              value={otp} 
              onChange={e => setOtp(e.target.value)} 
              maxLength={6} 
              required 
              style={{ fontSize: '1.5rem', letterSpacing: '0.5rem', background: 'rgba(79,70,229,0.05)' }} 
            />
            {otpError && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{otpError}</p>}
            <button type="submit" className="btn btn-primary w-full mt-2" style={{ padding: '1rem' }}>Verify & Enter Classroom</button>
          </form>
          <p className="mt-6" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Didn't receive? <button className="btn-link" onClick={() => sendOTP(currentUser.phone, 'recaptcha-container')}>Resend OTP</button></p>
        </div>
      </div>
    );
  }

  // ── VIEW: GLOBAL STUDENT (Tutor Directory + Admin Library) ──
  if (isGlobalStudent) {
    return (
      <div className="container mt-8 animate-fade-in">
        <div className="flex justify-between items-center mb-8 mobile-stack">
          <div>
            <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', fontWeight: 800, letterSpacing: '-1px' }}>Discover Your <span style={{ color: '#F5C518' }}>Ideal Tutor</span></h1>
            <p className="text-muted" style={{ fontSize: '1.05rem' }}>Explore verified teachers or browse our free study materials library.</p>
          </div>
          <button onClick={() => logout()} className="btn btn-outline" style={{ borderRadius: '12px' }}><LogOut size={16}/> Logout</button>
        </div>

        <div className="flex gap-8 mobile-stack">
          {/* Tutor Directory */}
          <div style={{ flex: 2, minWidth: '100%' }}>
            <h3 className="mb-6 flex items-center gap-2"><Users size={22} color="#F5C518"/> Verified Tutors</h3>
            <div className="flex-col gap-4">
              {mockTutors.filter(t => t.subscription_status === 'active' || t.is_verified).map(tutor => (
                <div key={tutor.id} className="glass-panel p-6 flex justify-between items-center" style={{ borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex gap-4 items-center">
                    <div style={{ width: '60px', height: '60px', borderRadius: '15px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <img src={tutor.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name)}&background=random`} alt={tutor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{tutor.name}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{tutor.subjects?.join(', ')}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <a href={`tel:${tutor.phone || '0000000000'}`} className="btn btn-outline" style={{ padding: '0.6rem 1.2rem', borderRadius: '10px' }}>
                      <Phone size={15}/> Contact
                    </a>
                    <button onClick={() => navigate(`/tutor/${tutor.id}`)} className="btn btn-primary" style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', boxShadow: '0 4px 15px rgba(245,197,24,0.2)' }}>
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Study Materials */}
          <div style={{ flex: 1, minWidth: '100%' }}>
            <h3 className="mb-6 flex items-center gap-2"><Package size={22} color="#F5C518"/> Global Library</h3>
            <div className="glass-panel p-6" style={{ borderRadius: '24px', background: 'rgba(10, 14, 26, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-muted mb-6" style={{ fontSize: '0.9rem' }}>High-quality resources provided by PPREducation Admin.</p>
              <div className="flex-col gap-4">
                {globalAssets.map(asset => (
                  <div key={asset.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)', transition: 'transform 0.2s ease' }} className="hover-scale">
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245,197,24,0.1)', display: 'flex', alignItems: 'center', justifyObject: 'center', justifyContent: 'center' }}>
                      <FileText size={20} color="#F5C518" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: '#F0F4FF' }}>{asset.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{(asset.size / 1024 / 1024).toFixed(1)} MB • {asset.type?.split('/')[1]?.toUpperCase() || 'FILE'}</p>
                    </div>
                    <a href={asset.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ padding: '0.4rem', minWidth: 'auto', borderRadius: '8px' }}>
                      <Download size={16}/>
                    </a>
                  </div>
                ))}
                {globalAssets.length === 0 && (
                  <div className="text-center py-8">
                    <Package size={40} color="rgba(255,255,255,0.05)" style={{ marginBottom: '1rem' }} />
                    <p className="text-muted" style={{ fontSize: '0.85rem' }}>No resources available yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── VIEW: ENROLLED STUDENT CLASSROOM ──
  if (inClass) {
    return (
      <div className="flex" style={{ height: 'calc(100vh - 73px)', overflow: 'hidden' }}>
        <div style={{ flex: 1, backgroundColor: '#000', position: 'relative' }}>
          <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          <div className="flex justify-center items-center gap-4 p-4" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
            <button className="btn btn-outline" style={{ background: 'var(--surface)', borderColor: 'transparent', borderRadius: '12px' }} onClick={handleLeaveClass}>Leave Class</button>
          </div>
        </div>
        <div className="hide-on-mobile" style={{ width: '350px', borderLeft: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
          <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}><h3 className="flex items-center gap-2"><MessageSquare size={18}/> Live Chat</h3></div>
          <ChatSidebar roomId={`room-${selectedEnrollment?.batch_id}`} />
        </div>
      </div>
    );
  }

  if (activeExam) {
    return <TestCenter exam={activeExam} studentId={currentUser?.uid} onFinish={() => setActiveExam(null)} />;
  }

  return (
    <div className="container mt-6 animate-fade-in" style={{ paddingBottom: '4rem' }}>
      
      {/* ── Dashboard Header ── */}
      <div className="flex justify-between items-end mb-10 mobile-stack animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: '0.5rem' }}>
            Student <span className="text-gradient">Classroom</span>
          </h1>
          <div className="flex items-center gap-3">
            <div className="avatar-sm" style={{ background: 'var(--primary)', color: '#fff', fontSize: '0.8rem', fontWeight: 700 }}>
              {currentUser?.name?.charAt(0) || 'S'}
            </div>
            <p className="text-muted" style={{ fontSize: '1rem' }}>
              Welcome back, <strong style={{ color: '#fff' }}>{currentUser?.name}</strong>
            </p>
          </div>
        </div>
        <button onClick={() => logout()} className="btn btn-outline mobile-full" style={{ borderRadius: '14px', padding: '0.8rem 1.5rem', background: 'rgba(255,255,255,0.02)' }}>
          <LogOut size={16}/> Logout Account
        </button>
      </div>

      {/* ── Teacher & Batch Switcher ── */}
      <div className="mb-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--primary)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.2em', marginBottom: '1rem' }}>
          My Active Batches
        </p>
        <div className="flex gap-4 overflow-x-auto pb-6 custom-scrollbar no-scrollbar-mobile" style={{ scrollSnapType: 'x mandatory', padding: '0.5rem' }}>
          {myEnrolledBatches.map((enr, idx) => {
            const tutor = mockTutors.find(t => t.id === enr.tutor_id);
            const batch = mockBatches.find(b => b.id === enr.batch_id);
            const isActive = selectedEnrollment?.batch_id === enr.batch_id;
            const liveSession = mockSessions.find(s => s.batch_id === enr.batch_id && s.status === 'live');
            
            return (
              <button 
                key={enr.batch_id}
                onClick={() => setSelectedEnrollment(enr)}
                className={`glass-panel ${isActive ? 'active-glow' : 'hover-scale'}`}
                style={{
                  padding: '1.2rem', borderRadius: '24px',
                  minWidth: '220px', textAlign: 'left',
                  border: isActive ? '2.5px solid var(--primary)' : '1px solid rgba(255,255,255,0.08)',
                  background: isActive ? 'rgba(79,70,229,0.12)' : 'rgba(255,255,255,0.03)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  scrollSnapAlign: 'start', position: 'relative'
                }}
              >
                <div style={{ position: 'relative' }}>
                  <img 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(tutor?.name||'T')}&background=random&color=fff&size=64`} 
                    style={{ width: '48px', height: '48px', borderRadius: '16px', border: '2px solid rgba(255,255,255,0.1)' }}
                  />
                  {liveSession && (
                    <div style={{ position: 'absolute', top: -5, right: -5, width: '14px', height: '14px', background: '#EF4444', borderRadius: '50%', border: '2px solid #0a0e1a', boxShadow: '0 0 10px #EF4444' }} className="animate-pulse" />
                  )}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <p style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: isActive ? '#fff' : 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{tutor?.name || 'Teacher'}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{batch?.name || 'Class'}</p>
                </div>
                {isActive && <div style={{ position: 'absolute', bottom: -12, left: '50%', transform: 'translateX(-50%)', width: '20px', height: '4px', background: 'var(--primary)', borderRadius: '2px' }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Fee Overdue Alert ── */}
      {isOverdue && (
        <div className="animate-slide-up mb-10" style={{ animationDelay: '0.25s' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.05) 100%)', 
            border: '1px solid rgba(239,68,68,0.3)', 
            padding: '1.5rem', borderRadius: '24px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem',
            backdropFilter: 'blur(10px)', flexWrap: 'wrap'
          }}>
            <div className="flex gap-4 items-center">
              <div style={{ background: 'rgba(239,68,68,0.2)', padding: '0.75rem', borderRadius: '15px' }}>
                <ShieldAlert size={24} color="#EF4444" />
              </div>
              <div>
                <h4 style={{ color: '#EF4444', margin: 0, fontWeight: 800 }}>Payment Overdue</h4>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                  ₹{selectedEnrollment?.outstanding_balance} due for {currentTutor?.name}'s batch. Access is restricted.
                </p>
              </div>
            </div>
            <button className="btn btn-primary mobile-full" style={{ background: '#EF4444', border: 'none', padding: '1rem 2rem', borderRadius: '15px', fontWeight: 800 }} onClick={() => alert('Opening Payment Gateway...')}>
              <CreditCard size={18}/> Pay Now
            </button>
          </div>
        </div>
      )}

      {/* ── Main Dashboard Grid ── */}
      <div className="dashboard-grid">
        
        {/* Live Status Card */}
        <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="glass-panel p-8 h-full" style={{ borderRadius: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '300px', border: '1px solid rgba(255,255,255,0.05)', background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)' }}>
            <div>
              <div className="flex justify-between items-start mb-6">
                <div style={{ background: 'rgba(79,70,229,0.1)', padding: '0.8rem', borderRadius: '16px' }}>
                  <Video size={28} color="var(--primary)" />
                </div>
                {mockSessions.find(s => s.batch_id === selectedEnrollment?.batch_id && s.status === 'live') ? (
                  <span className="badge-live animate-pulse">LIVE NOW</span>
                ) : (
                  <span className="badge-offline">OFFLINE</span>
                )}
              </div>
              <h3 className="mb-2">Virtual Classroom</h3>
              <p className="text-muted" style={{ fontSize: '0.95rem' }}>Join the high-fidelity interactive session with {currentTutor?.name || 'your teacher'}.</p>
            </div>
            <div className="mt-8">
              {mockSessions.find(s => s.batch_id === selectedEnrollment?.batch_id && s.status === 'live') ? (
                <button className="btn btn-primary w-full p-4" style={{ borderRadius: '18px', fontSize: '1rem', fontWeight: 800, boxShadow: '0 10px 25px rgba(79,70,229,0.3)' }} onClick={handleJoinClass}>
                  Enter Live Classroom
                </button>
              ) : (
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '18px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>No live session currently active</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Schedule Card */}
        <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="glass-panel p-8 h-full" style={{ borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 className="mb-6 flex items-center gap-3"><CalendarIcon size={24} color="var(--primary)"/> Upcoming Sessions</h3>
            {mySessions.length === 0 && <p className="text-muted py-10 text-center">No upcoming sessions scheduled.</p>}
            <div className="flex-col gap-4">
              {mySessions.slice(0, 3).map(session => {
                const isReady = new Date(session.scheduled_time).getTime() - Date.now() <= 0;
                return (
                  <div key={session.id} className="session-card" style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                     <div className="flex justify-between items-center">
                       <div>
                         <h4 style={{ fontSize: '1rem', marginBottom: '0.2rem' }}>{session.title}</h4>
                         <p className="text-muted" style={{ fontSize: '0.75rem' }}>{new Date(session.scheduled_time).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</p>
                       </div>
                       <button 
                         className={`btn ${isReady ? 'btn-primary' : 'btn-outline'}`} 
                         style={{ padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '0.8rem' }}
                         disabled={!isReady || isOverdue} 
                         onClick={handleJoinClass}
                       >
                         {isOverdue ? <Lock size={14}/> : isReady ? 'Join' : 'Waiting'}
                       </button>
                     </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Study Materials Grid Card */}
        <div className="animate-slide-up" style={{ animationDelay: '0.5s', gridColumn: 'span 1' }}>
          <div className="glass-panel p-8" style={{ borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 className="mb-6 flex items-center gap-3"><FileText size={24} color="var(--primary)"/> Batch Library</h3>
            <StudentMaterialsPanel
              batchId={selectedEnrollment?.batch_id}
              isLocked={isOverdue}
            />
          </div>
        </div>

        {/* Admin Library Card */}
        <div className="animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <div className="glass-panel p-8" style={{ borderRadius: '32px', border: '1px solid rgba(245,197,24,0.1)', background: 'linear-gradient(135deg, rgba(245,197,24,0.05) 0%, transparent 100%)' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="flex items-center gap-3"><Package size={24} color="#F5C518"/> Global Assets</h3>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#F5C518', background: 'rgba(245,197,24,0.1)', padding: '0.3rem 0.6rem', borderRadius: '8px' }}>ADMIN RESOURCES</span>
            </div>
            <div className="flex-col gap-3">
              {globalAssets.map(asset => (
                <div key={asset.id} className="asset-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(245,197,24,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={20} color="#F5C518" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>{asset.name}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>{(asset.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                  <a href={asset.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ padding: '0.5rem', minWidth: 'auto', borderRadius: '10px' }}>
                    <Download size={16}/>
                  </a>
                </div>
              ))}
              {globalAssets.length === 0 && <p className="text-muted text-center py-6" style={{ fontSize: '0.85rem' }}>No global resources yet.</p>}
            </div>
          </div>
        </div>

      </div>

      <style>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
          gap: 2rem;
        }
        @media (max-width: 768px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
          .mobile-full { width: 100%; }
          .mobile-stack { flex-direction: column; align-items: flex-start ! from; }
        }
        .text-gradient {
          background: linear-gradient(135deg, var(--primary) 0%, #a78bfa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .avatar-sm {
          width: 32px; height: 32px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .badge-live {
          font-size: 0.65rem; font-weight: 900; color: #fff;
          background: #EF4444; padding: 0.3rem 0.8rem; border-radius: 10px;
          box-shadow: 0 0 15px rgba(239,68,68,0.4);
        }
        .badge-offline {
          font-size: 0.65rem; font-weight: 900; color: rgba(255,255,255,0.4);
          background: rgba(255,255,255,0.05); padding: 0.3rem 0.8rem; border-radius: 10px;
        }
        .active-glow {
          box-shadow: 0 10px 40px rgba(79,70,229,0.2) !important;
          transform: translateY(-5px);
        }
        .hover-scale:hover {
          transform: translateY(-5px);
          background: rgba(255,255,255,0.06) !important;
          border-color: rgba(255,255,255,0.15) !important;
        }
        .asset-card:hover {
          background: rgba(255,255,255,0.06) !important;
          transform: scale(1.02);
          transition: all 0.3s ease;
        }
        .no-scrollbar-mobile::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
