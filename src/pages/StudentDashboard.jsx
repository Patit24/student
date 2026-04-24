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

export default function StudentDashboard() {
  const { 
    currentUser, verifyOTP, sendOTP, mockSessions, mockExams, 
    mockSubmissions, mockStudents, mockBatches, mockTutors, 
    logout 
  } = useAppContext();
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
        .catch(err => console.error('Auto-OTP failed:', err));
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
            <button className="btn btn-outline" style={{ background: 'var(--surface)', borderColor: 'transparent' }} onClick={handleLeaveClass}>Leave Class</button>
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
    <div className="container mt-4 animate-fade-in" style={{ paddingBottom: '2rem' }}>
      
      {/* Teacher Switcher */}
      <div className="mb-8">
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.8rem' }}>Your Teachers & Batches</p>
        <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar" style={{ scrollSnapType: 'x mandatory' }}>
          {myEnrolledBatches.map(enr => {
            const tutor = mockTutors.find(t => t.id === enr.tutor_id);
            const batch = mockBatches.find(b => b.id === enr.batch_id);
            const isActive = selectedEnrollment?.batch_id === enr.batch_id;
            const liveSession = mockSessions.find(s => s.batch_id === enr.batch_id && s.status === 'live');
            
            return (
              <button 
                key={enr.batch_id}
                onClick={() => setSelectedEnrollment(enr)}
                style={{
                  padding: '0.75rem 1.25rem', borderRadius: '16px',
                  background: isActive ? 'rgba(245,197,24,0.12)' : 'rgba(255,255,255,0.03)',
                  border: isActive ? '1px solid #F5C518' : '1px solid rgba(255,255,255,0.08)',
                  color: isActive ? '#F5C518' : 'var(--text-muted)',
                  whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  minWidth: '180px', scrollSnapAlign: 'start',
                  boxShadow: isActive ? '0 8px 24px rgba(245,197,24,0.1)' : 'none',
                  transform: isActive ? 'translateY(-2px)' : 'none'
                }}
              >
                <div style={{ position: 'relative' }}>
                  <img 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(tutor?.name||'T')}&background=random`} 
                    style={{ width: '32px', height: '32px', borderRadius: '50%', border: isActive ? '2px solid #F5C518' : 'none' }}
                  />
                  {liveSession && (
                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: '12px', height: '12px', background: '#EF4444', borderRadius: '50%', border: '2px solid #000' }} />
                  )}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0, color: isActive ? '#F5C518' : '#F0F4FF' }}>{tutor?.name || 'Teacher'}</p>
                  <p style={{ fontSize: '0.65rem', margin: 0 }}>{batch?.name || 'Class'} · {batch?.schedule || 'Flexible'}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Batch-Specific Fee Warning */}
      {isOverdue && (
        <div style={{ 
          background: 'rgba(239,68,68,0.1)', 
          border: '1px solid #EF4444', 
          padding: '1rem 1.5rem', 
          borderRadius: '12px', 
          marginBottom: '2rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <h4 style={{ color: '#EF4444', margin: 0 }}>⚠️ Access Restricted: {currentTutor?.name}</h4>
            <p style={{ fontSize: '0.85rem', color: 'rgba(239,68,68,0.8)', margin: 0 }}>
              Payment of ₹{selectedEnrollment?.outstanding_balance} overdue since {selectedEnrollment?.payment_due_date}.
            </p>
          </div>
          <button className="btn btn-primary" style={{ background: '#EF4444', border: 'none' }} onClick={() => alert('Opening Payment Gateway...')}>
            <CreditCard size={15}/> Pay Now
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-8 mobile-stack" style={{ gap: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.2rem)' }}>Student Classroom</h2>
          <p className="text-muted mt-1">
            Learning with <strong style={{ color: '#F0F4FF' }}>{currentTutor?.name || 'your teacher'}</strong>
          </p>
        </div>
        <div className="flex gap-3 mobile-stack w-full" style={{ justifyContent: 'flex-start' }}>
          {mockSessions.find(s => s.batch_id === selectedEnrollment?.batch_id && s.status === 'live') && (
            <button className="btn btn-primary animate-pulse w-full" style={{ background: '#EF4444', border: 'none', padding: '1rem' }} onClick={handleJoinClass}>
              <Video size={18}/> Join Live Class
            </button>
          )}
          <button onClick={() => logout()} className="btn btn-outline w-full" style={{ fontSize: '0.9rem', padding: '1rem' }}>
            <LogOut size={14}/> Logout
          </button>
        </div>
      </div>

      <div className="flex gap-8 mobile-stack">
        {/* Schedule */}
        <div className="glass-panel p-8" style={{ flex: 1, minWidth: '100%' }}>
          <h3 className="mb-4 flex items-center gap-2"><CalendarIcon size={20}/> Schedule</h3>
          {mySessions.length === 0 && <p className="text-muted">No classes scheduled by this teacher.</p>}
          <div className="flex-col gap-4">
            {mySessions.map(session => {
              const isReady = new Date(session.scheduled_time).getTime() - now <= 0;
              return (
                <div key={session.id} style={{ border: '1px solid var(--border)', padding: '1.25rem', borderRadius: 'var(--radius)' }}>
                   <div className="flex justify-between items-start mb-3">
                     <div>
                       <h4 style={{ color: '#F5C518' }}>{session.title}</h4>
                       <p className="text-muted" style={{ fontSize: '0.8rem' }}>{new Date(session.scheduled_time).toLocaleString()}</p>
                     </div>
                   </div>
                   <button 
                     className={`btn w-full ${isReady ? 'btn-secondary' : 'btn-outline'}`} 
                     disabled={!isReady || isOverdue} 
                     onClick={handleJoinClass}
                   >
                     {isOverdue ? <><Lock size={15}/> Locked (Payment)</> : isReady ? <><Play size={16}/> Join Class</> : <><Clock size={16}/> Scheduled</>}
                   </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Materials */}
        <div style={{ flex: 1, minWidth: '100%' }} className="flex-col gap-6">
          <div className="glass-panel p-8">
            <h3 className="mb-4 flex items-center gap-2"><FileText size={20}/> Batch Materials</h3>
            <StudentMaterialsPanel
              batchId={selectedEnrollment?.batch_id}
              isLocked={isOverdue}
            />
          </div>

          <div className="glass-panel p-8" style={{ border: '1px solid rgba(245,197,24,0.1)' }}>
            <h3 className="mb-4 flex items-center gap-2"><Package size={20} color="#F5C518"/> Admin Library</h3>
            <div className="flex-col gap-3">
              {globalAssets.map(asset => (
                <div key={asset.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <FileText size={18} color="#F5C518" />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0, color: '#F0F4FF' }}>{asset.name}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>{(asset.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                  <a href={asset.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ padding: '0.3rem', minWidth: 'auto', borderRadius: '6px' }}>
                    <Download size={14}/>
                  </a>
                </div>
              ))}
              {globalAssets.length === 0 && <p className="text-muted" style={{ fontSize: '0.8rem' }}>No admin resources yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
