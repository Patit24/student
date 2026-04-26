import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AuthContext';
import { 
  Video, Mic, MicOff, VideoOff, ScreenShare, MessageSquare, Users, 
  Lock, Unlock, Check, X, UserPlus, Calendar, Layout, Crown, 
  FileText, CheckSquare, Building2, AlertOctagon, ToggleLeft, 
  ToggleRight, Image, Globe, Play, Plus, Trash2, MapPin, TrendingUp, CreditCard, Layers, Shield
} from 'lucide-react';
import ChatSidebar from '../components/ChatSidebar';
import ExamCreator from '../components/ExamCreator';
import SmartExamUploader from '../components/SmartExamUploader';
import ExamDraftReview from '../components/ExamDraftReview';
import BankingSettings from '../components/BankingSettings';
import TutorMaterialsPanel from '../components/TutorMaterialsPanel';
import StudentManagePanel from '../components/StudentManagePanel';
import SubscriptionGuard, { useSubscription } from '../components/SubscriptionGuard';
import TutorLeadsPanel from '../components/TutorLeadsPanel';
import TutorCourseManager from '../components/TutorCourseManager';
import FinancialAnalytics from '../components/FinancialAnalytics';
import FileUploadVercel from '../components/FileUploadVercel';
import { useToast } from '../components/Toast';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

const PLAN_LIMITS = {
  free:   { batches: 1,        students: 5,   pdf: false, recording: false },
  growth: { batches: 5,        students: 50,  pdf: true,  recording: false },
  pro:    { batches: Infinity, students: Infinity, pdf: true, recording: true },
};

const PLAN_LABELS = {
  starter: 'BASIC',
  free:    'BASIC',
  growth:  'GROWTH',
  pro:     'ELITE'
};

function ExamResultsPanel({ tutorId, myBatches, myStudents }) {
  const { mockExams, setMockExams, mockSubmissions, setMockSubmissions } = useAppContext();
  const [view, setView] = useState('list'); // 'list' | 'create' | 'smart-upload' | 'draft-review' | 'results'
  const [selectedExam, setSelectedExam] = useState(null);
  const [parsedDraft, setParsedDraft] = useState(null);
  const [feedback, setFeedback] = useState({});

  const myExams = mockExams.filter(e => e.tutorId === tutorId);

  const getSubmissions = (examId) => mockSubmissions.filter(s => s.exam_id === examId);

  const saveFeedback = (subId, text) => {
    setMockSubmissions(prev => prev.map(s => s.id === subId ? { ...s, teacher_feedback: text } : s));
    alert('Feedback saved!');
  };

  const handleDraftReady = (draftData) => {
    setParsedDraft(draftData);
    setView('draft-review');
  };

  const handlePublish = (exam, asDraft) => {
    const finalExam = { ...exam, tutorId };
    setMockExams(prev => [...prev, finalExam]);
    if (asDraft) {
      alert(`Draft "${exam.title}" saved. Students cannot see it yet.`);
    } else {
      alert(`Exam "${exam.title}" published! A notification has been sent to all students in the batch.`);
    }
    setParsedDraft(null);
    setView('list');
  };

  if (view === 'smart-upload') {
    return (
      <div>
        <button className="btn btn-outline mb-6" onClick={() => setView('list')}>← Back to Exams</button>
        <SmartExamUploader onDraftReady={handleDraftReady} />
      </div>
    );
  }

  if (view === 'draft-review' && parsedDraft) {
    return (
      <ExamDraftReview
        draft={parsedDraft}
        batches={myBatches}
        onPublish={handlePublish}
        onCancel={() => setView('smart-upload')}
      />
    );
  }

  if (view === 'create') {
    return (
      <div>
        <button className="btn btn-outline mb-6" onClick={() => setView('list')}>← Back to Exams</button>
        <ExamCreator tutorId={tutorId} batches={myBatches} />
      </div>
    );
  }

  if (view === 'results' && selectedExam) {
    const subs = getSubmissions(selectedExam.id);
    return (
      <div>
        <button className="btn btn-outline mb-6" onClick={() => setView('list')}>← Back</button>
        <div className="glass-panel p-8">
          <h3 className="mb-2">{selectedExam.title} — Results</h3>
          <p className="text-muted mb-6">{subs.length} submission(s)</p>
          {subs.length === 0 && <p className="text-muted">No submissions yet.</p>}
          {subs.map(sub => {
            const student = myStudents.find(s => s.id === sub.student_id);
            return (
              <div key={sub.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', marginBottom: '1rem' }}>
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h4>{student?.name || sub.student_id}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Submitted: {new Date(sub.submitted_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    {sub.mcq_score !== null && (
                      <span style={{ fontSize: '1.5rem', fontWeight: 700, color: sub.passed ? 'var(--secondary)' : 'var(--danger)' }}>
                        {sub.mcq_score}%
                      </span>
                    )}
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub.passed === true ? '✓ Passed' : sub.passed === false ? '✗ Failed' : 'Pending'}</p>
                  </div>
                </div>
                {selectedExam.questions.filter(q => q.type === 'short').map(q => (
                  <div key={q.id} style={{ marginBottom: '1rem' }}>
                    <p style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: '0.5rem' }}>{q.text}</p>
                    <div style={{ background: 'var(--surface)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      {sub.answers?.[q.id] || <em style={{ color: 'var(--text-muted)' }}>No answer provided</em>}
                    </div>
                    <textarea
                      className="input-field"
                      rows={2}
                      placeholder="Enter teacher feedback..."
                      defaultValue={sub.teacher_feedback || ''}
                      onChange={e => setFeedback(prev => ({ ...prev, [sub.id]: e.target.value }))}
                      style={{ resize: 'vertical', fontSize: '0.9rem' }}
                    />
                    <button className="btn btn-outline mt-2" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }} onClick={() => saveFeedback(sub.id, feedback[sub.id])}>
                      Save Feedback
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <h3>Exam Center ({myExams.length} exams)</h3>
        <div className="flex gap-3">
          <button className="btn btn-outline" onClick={() => setView('smart-upload')}>
            <FileText size={16}/> Smart Upload (Excel / PDF)
          </button>
          <button className="btn btn-primary" onClick={() => setView('create')}>
            <CheckSquare size={16}/> Create Manually
          </button>
        </div>
      </div>
      {myExams.length === 0 && (
        <div className="glass-panel p-8 text-center">
          <CheckSquare size={40} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
          <p className="text-muted">No exams yet. Create manually or use Smart Upload to parse an Excel/PDF file.</p>
        </div>
      )}
      <div className="flex-col gap-4">
        {myExams.map(exam => {
          const subs = getSubmissions(exam.id);
          const batch = myBatches.find(b => b.id === exam.batchId);
          return (
            <div key={exam.id} style={{ border: `1px solid ${exam.is_draft ? '#f59e0b' : 'var(--border)'}`, padding: '1.25rem', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.1)', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4>{exam.title}</h4>
                  {exam.is_draft && (
                    <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '1rem', background: 'rgba(245,158,11,0.2)', color: '#f59e0b', border: '1px solid #f59e0b' }}>DRAFT</span>
                  )}
                  {exam.generation_method?.includes('Auto') && (
                    <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '1rem', background: 'rgba(79,70,229,0.2)', color: 'var(--primary)' }}>AI-Parsed</span>
                  )}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {batch?.name || 'N/A'} · {exam.questions?.length || 0} Qs · {exam.duration_minutes} min · Pass: {exam.passing_score}%
                </p>
              </div>
              <div className="flex items-center gap-4">
                {exam.is_draft && (
                  <span style={{ fontSize: '0.8rem', color: '#f59e0b' }}>⚠ Hidden from students</span>
                )}
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{subs.length} submissions</span>
                <button className="btn btn-outline" style={{ padding: '0.3rem 0.75rem', fontSize: '0.85rem' }} onClick={() => { setSelectedExam(exam); setView('results'); }}>
                  View Results
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TutorDashboard() {
  const toast    = useToast();
  const navigate = useNavigate();
  const { 
    currentUser, 
    mockTutors,
    mockBatches, setMockBatches,
    mockStudents, setMockStudents,
    mockSessions, setMockSessions,
    mockLeads,
    updateBranding,
    updatePaymentStatus,
    updateBankingDetails,
    setAutoRestriction,
    updateTutorProfile,
    isMockMode,
    verifyOTP, 
    sendOTP
  } = useAppContext();

  const myTutorRecord            = mockTutors.find(t => t.id === currentUser?.uid) || mockTutors[0];
  const tutorBanking             = myTutorRecord?.banking || null;
  const autoRestrictionEnabled   = myTutorRecord?.auto_restriction_enabled ?? true;
  const profileIncomplete        = !myTutorRecord?.bio || !myTutorRecord?.location?.area;

  const tier = currentUser?.subscription_tier || 'free';
  const limits = PLAN_LIMITS[tier] || PLAN_LIMITS.free;

  const myBatches = mockBatches.filter(b => b.tutorId === currentUser?.uid);
  const myStudents = mockStudents.filter(s => s.tutorId === currentUser?.uid);

  const [isLive, setIsLive] = useState(false);
  const [streamActive, setStreamActive] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [waitingRoom, setWaitingRoom] = useState([]);
  const [googleMeetLink, setGoogleMeetLink] = useState('');
  const [selectedBatchForLive, setSelectedBatchForLive] = useState('');
  const [liveStartTime, setLiveStartTime] = useState('');
  const [showGoLiveModal, setShowGoLiveModal] = useState(false);

  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchLimit, setNewBatchLimit] = useState('');

  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentBatchId, setStudentBatchId] = useState('');

  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionBatchId, setSessionBatchId] = useState('');
  const [sessionDate, setSessionDate] = useState('');

  const [activeTab, setActiveTab] = useState('students');

  // Profile States
  const [profileBio, setProfileBio] = useState(myTutorRecord?.bio || '');
  const [profilePic, setProfilePic] = useState(myTutorRecord?.photoURL || '');
  const [profileSubjects, setProfileSubjects] = useState(myTutorRecord?.subjects?.join(', ') || '');
  const [profileClasses, setProfileClasses] = useState(myTutorRecord?.classes?.join(', ') || '');
  const [profileBoards, setProfileBoards] = useState(myTutorRecord?.boards?.join(', ') || '');
  const [profileMode, setProfileMode] = useState(myTutorRecord?.teaching_mode || 'online');
  const [profileVideo, setProfileVideo] = useState(myTutorRecord?.intro_video || '');
  const [profileArea, setProfileArea] = useState(myTutorRecord?.location?.area || '');
  const [profileCity, setProfileCity] = useState(myTutorRecord?.location?.city || '');
  const [profileExperience, setProfileExperience] = useState(myTutorRecord?.experience || '');
  const [profileQualification, setProfileQualification] = useState(myTutorRecord?.highest_qualification || '');
  const [profileCertificates, setProfileCertificates] = useState(myTutorRecord?.certificates || []);
  const [brandColor, setBrandColor] = useState(currentUser?.branding_color || '#4F46E5');

  const [credentialModal, setCredentialModal] = useState(null);

  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const cameraTrackRef = useRef(null);

  const { isActive: isSubscribed } = useSubscription();
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    try {
      setOtpError('');
      await verifyOTP(otp);
      toast.success('Account Verified! Welcome to the Command Center. 🚀');
    } catch (err) {
      setOtpError('Invalid OTP Code. Please enter 123456.');
    }
  };

  // ── VIEW: OTP GATE (FOR UNVERIFIED TUTORS) ──
  if (currentUser && currentUser.is_verified === false) {
    return (
      <div className="container flex justify-center items-center animate-fade-in" style={{ height: 'calc(100vh - 80px)' }}>
        <div id="recaptcha-tutor-container"></div>
        <div className="glass-panel p-8 text-center" style={{ maxWidth: '400px', border: '1px solid var(--primary)' }}>
          <Shield size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
          <h2 className="mb-2">Verify Your Authority</h2>
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
            <button type="submit" className="btn btn-primary w-full mt-2" style={{ padding: '1rem' }}>Verify & Activate Dashboard</button>
          </form>
          <p className="mt-6" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Didn't receive? <button className="btn-link" onClick={() => sendOTP(currentUser.phone, 'recaptcha-tutor-container')}>Resend OTP</button></p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    let knockInterval;
    if (isLive && isLocked) {
      knockInterval = setInterval(() => {
        const id = Math.floor(Math.random() * 1000).toString();
        setWaitingRoom(prev => prev.length < 3 ? [...prev, { id, name: `Student ${id}` }] : prev);
      }, 10000);
    }
    return () => clearInterval(knockInterval);
  }, [isLive, isLocked]);

  useEffect(() => {
    // Auto-trigger OTP if not verified
    if (currentUser && currentUser.is_verified === false && currentUser.phone) {
      sendOTP(currentUser.phone, 'recaptcha-tutor-container')
        .then(() => toast.success('Verification code sent! 📱'))
        .catch(err => {
          console.error('Auto-OTP failed:', err);
          toast.error('SMS Error: ' + (err.message.includes('auth/operation-not-allowed') ? 'Enable Phone Auth in Firebase' : err.message));
        });
    }
  }, [currentUser]);

  useEffect(() => {
    document.documentElement.style.setProperty('--primary', brandColor);
  }, [brandColor]);

  const handleSaveProfile = async () => {
    const profileData = {
      bio: profileBio,
      photoURL: profilePic,
      subjects: profileSubjects.split(',').map(s => s.trim()).filter(s => s),
      classes: profileClasses.split(',').map(s => s.trim()).filter(s => s),
      boards: profileBoards.split(',').map(s => s.trim()).filter(s => s),
      teaching_mode: profileMode,
      intro_video: profileVideo,
      experience: profileExperience,
      highest_qualification: profileQualification,
      location: {
        area: profileArea,
        city: profileCity,
      },
      certificates: profileCertificates,
      branding_color: brandColor,
    };
    await updateTutorProfile(profileData);
    toast.success('Public Profile Updated!');
  };

  const handleGoLive = async () => {
    if (!selectedBatchForLive) {
      toast.error('Please select a batch first.');
      return;
    }
    
    if (!googleMeetLink || !googleMeetLink.includes('meet.google.com')) {
      toast.error('Please enter a valid Google Meet link.');
      return;
    }

    // Update session status in mock data (simulating notification)
    setMockSessions(prev => prev.map(s => 
      s.batch_id === selectedBatchForLive ? { ...s, is_live: true, room_id: googleMeetLink } : s
    ));
    
    toast.success(`🚀 Link broadcasted to ${myBatches.find(b => b.id === selectedBatchForLive)?.name}!`);
    setIsLive(true);
    setShowGoLiveModal(false);
  };

  const stopStream = () => {
    setStreamActive(false);
    setIsLive(false);
    // Clear live status
    setMockSessions(prev => prev.map(s => ({ ...s, is_live: false })));
  };

  const copyMeetingLink = () => {
    navigator.clipboard.writeText(googleMeetLink);
    toast.success('Google Meet link copied!');
  };

  const createBatch = async (e) => {
    e.preventDefault();
    if (myBatches.length >= limits.batches) {
      toast.error(`Your ${tier} plan allows max ${limits.batches} batch(es).`);
      return;
    }
    if (!newBatchName || !newBatchLimit) return;

    const batchPayload = {
      name:     newBatchName,
      limit:    parseInt(newBatchLimit),
      assigned: [],
      tutorId:  currentUser.uid,
      created_at: new Date().toISOString(),
    };

    if (!isMockMode && db) {
      try {
        const { addDoc, collection: col } = await import('firebase/firestore');
        await addDoc(col(db, 'batches'), batchPayload);
        toast.success(`Batch "${newBatchName}" created ✅`);
      } catch (err) {
        toast.error(`Failed to create batch: ${err.message}`);
        return;
      }
    } else {
      const newBatch = { id: `batch-${Date.now()}`, ...batchPayload };
      setMockBatches(prev => [...prev, newBatch]);
      toast.success(`Batch "${newBatchName}" created ✅`);
    }

    setNewBatchName('');
    setNewBatchLimit('');
  };

  const [phoneLookup,     setPhoneLookup]     = useState(null);
  const [lookupLoading,   setLookupLoading]   = useState(false);

  const handlePhoneChange = async (phone) => {
    setStudentPhone(phone);
    setPhoneLookup(null);
    if (phone.length < 10) return;

    setLookupLoading(true);
    try {
      if (!isMockMode) {
        const { lookupStudentByPhone } = await import('../db.service');
        const existing = await lookupStudentByPhone(phone);
        if (existing) {
          setPhoneLookup({ found: true, name: existing.name, id: existing.id });
          setStudentName(existing.name);
        } else {
          setPhoneLookup({ found: false });
        }
      } else {
        const found = mockStudents.find(s => s.phone === phone);
        if (found) {
          setPhoneLookup({ found: true, name: found.name, id: found.id });
          setStudentName(found.name);
        } else {
          setPhoneLookup({ found: false });
        }
      }
    } catch { setPhoneLookup({ found: false }); }
    setLookupLoading(false);
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (myStudents.length >= limits.students) {
      toast.error(`Your ${tier} plan allows max ${limits.students} student(s).`);
      return;
    }

    if (phoneLookup?.found) {
      const existingId = phoneLookup.id;
      if (!isMockMode && db && existingId) {
        try {
          const { enrollStudentInBatch } = await import('../db.service');
          await enrollStudentInBatch(existingId, currentUser.uid, studentBatchId);
          toast.success(`${studentName} linked ✅`);
        } catch (err) {
          toast.error(`Link failed: ${err.message}`);
          return;
        }
      } else {
        const linked = { id: existingId || `student-${Date.now()}`, name: studentName, phone: studentPhone, is_verified: false, needs_password_reset: true, tutorId: currentUser.uid, batch_id: studentBatchId, payment_status: 'active' };
        if (!mockStudents.find(s => s.id === linked.id)) {
          setMockStudents(prev => [...prev, linked]);
        }
        toast.success(`${studentName} linked ✅`);
      }
      setStudentName(''); setStudentPhone(''); setStudentBatchId('');
      setPhoneLookup(null);
      return;
    }

    const { generateTempPassword } = await import('../db.service');
    const tempPassword = generateTempPassword();

    if (!isMockMode) {
      try {
        const { createStudentAccount } = await import('../db.service');
        const { tempPassword: actualPassword } = await createStudentAccount(studentPhone, studentName, currentUser.uid, studentBatchId);
        setCredentialModal({ name: studentName, phone: studentPhone, password: actualPassword });
        toast.success(`Account created!`);
      } catch (err) {
        toast.error(`Failed: ${err.message}`);
        return;
      }
    } else {
      const newStudent = { id: `student-${Date.now()}`, name: studentName, phone: studentPhone, batch_id: studentBatchId, is_verified: false, needs_password_reset: true, tutorId: currentUser.uid, payment_status: 'active' };
      setMockStudents(prev => [...prev, newStudent]);
      setCredentialModal({ name: studentName, phone: studentPhone, password: tempPassword });
      toast.success(`Account created!`);
    }
    setStudentName(''); setStudentPhone(''); setStudentBatchId('');
    setPhoneLookup(null);
  };

  const handleScheduleClass = (e) => {
    e.preventDefault();
    if (sessionTitle && sessionBatchId && sessionDate) {
      const newSession = {
        id: `session-${Date.now()}`,
        batch_id: sessionBatchId,
        title: sessionTitle,
        scheduled_time: sessionDate,
        room_link: `https://antigravity.edu/join/${Math.random().toString(36).substring(7)}`,
        is_live: false,
        tutorId: currentUser.uid
      };
      setMockSessions([...mockSessions, newSession]);
      alert(`Class Scheduled!`);
      setSessionTitle(''); setSessionBatchId(''); setSessionDate('');
    }
  };

  if (isLive) {
    return (
      <div className="flex h-screen live-stream-root" style={{ height: 'calc(100vh - 73px)', overflow: 'hidden', background: '#000' }}>
        {/* Left Control Sidebar */}
        <div style={{ width: '280px', borderRight: '1px solid #333', background: '#111', display: 'flex', flexDirection: 'column', color: 'white', padding: '1.5rem' }}>
          <div className="mb-8">
            <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Video size={18}/> LIVE CLASS
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#888' }}>You are currently broadcasting to your students.</p>
          </div>

          <div className="mb-8 p-4" style={{ background: '#1a1a1a', borderRadius: 'var(--radius)', border: '1px solid #333' }}>
            <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.5rem' }}>STUDENT JOIN LINK</p>
            <div style={{ wordBreak: 'break-all', fontSize: '0.8rem', color: 'var(--primary)', marginBottom: '1rem', padding: '0.5rem', background: '#000', borderRadius: '4px' }}>
              {window.location.origin}/join/live
            </div>
            <button className="btn btn-primary w-full" style={{ padding: '0.5rem', fontSize: '0.8rem' }} onClick={copyMeetingLink}>
              Copy Link
            </button>
          </div>

          <div className="mt-auto">
            <button className="btn btn-danger w-full" onClick={stopStream}>End Class</button>
          </div>
        </div>

        {/* Main Content (Google Meet Control Area) */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0a0e1a' }}>
          <div className="glass-panel p-10 text-center" style={{ maxWidth: '600px', border: '1px solid var(--primary)' }}>
            <div className="flex justify-center mb-6">
              <div className="pulse-red" style={{ width: '80px', height: '80px', background: 'rgba(79,70,229,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Video size={40} color="var(--primary)"/>
              </div>
            </div>
            <h2 className="mb-4">Class is Live! 🔴</h2>
            <p className="text-muted mb-8">You are currently broadcasting your Google Meet session to your students. Keep this tab open to manage the session.</p>
            
            <div className="flex-col gap-4">
              <a href={googleMeetLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full" style={{ padding: '1rem' }}>
                Open My Google Meet
              </a>
              <button onClick={stopStream} className="btn btn-outline w-full" style={{ padding: '1rem' }}>
                End Global Session
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const Tab = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={activeTab === id ? 'btn btn-primary' : 'btn btn-outline'}
      style={{ padding: '0.5rem 1.1rem', fontSize: '0.88rem', whiteSpace: 'nowrap', flexShrink: 0 }}
    >
      <Icon size={16} /> <span className="tab-text">{label}</span>
    </button>
  );

  return (
    <div className="container mt-6 animate-fade-in" style={{ paddingLeft: '2rem', paddingRight: '2rem', paddingBottom: '6rem' }}>
      
      {/* ── Dashboard Header with Radial Glow ── */}
      <div className="flex-col items-center mb-16 mobile-stack" style={{ 
        padding: '4rem 2rem', 
        borderRadius: '40px',
        background: 'radial-gradient(circle at center, rgba(79,70,229,0.15) 0%, transparent 70%)',
        position: 'relative',
        marginTop: '2rem'
      }}>
        <div className="neon-border-wrapper animate-slide-up">
          <h1 className="neon-text" style={{ 
            fontSize: 'clamp(2rem, 6vw, 4rem)', 
            fontWeight: 950, 
            letterSpacing: '-2px', 
            margin: 0,
            textAlign: 'center',
            textTransform: 'uppercase'
          }}>
            Tutor Dashboard
          </h1>
        </div>
        <p className="text-muted mt-4" style={{ fontSize: '1.1rem', fontWeight: 600, letterSpacing: '0.1em' }}>
          {myStudents.length} STUDENTS • {myBatches.length} BATCHES
        </p>
      </div>

      {/* ── Smart Go Live Bar ── */}
      <div className="glass-panel p-2 flex items-center gap-3 animate-slide-up" style={{ 
        borderRadius: '20px', 
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.02)',
        marginTop: '2rem',
        marginBottom: '4rem',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input 
            type="text" 
            placeholder="Paste Google Meet Link..." 
            className="input-field" 
            style={{ width: '100%', border: 'none', background: 'transparent', padding: '1rem' }}
            value={googleMeetLink}
            onChange={(e) => setGoogleMeetLink(e.target.value)}
          />
        </div>
        <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)' }} />
        <select 
          className="input-field" 
          style={{ border: 'none', background: 'transparent', width: '200px' }}
          value={selectedBatchForLive}
          onChange={(e) => setSelectedBatchForLive(e.target.value)}
        >
          <option value="">Select Batch...</option>
          {myBatches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)' }} />
        <input 
          type="datetime-local" 
          className="input-field" 
          style={{ border: 'none', background: 'transparent', width: '200px', fontSize: '0.8rem' }}
          value={liveStartTime}
          onChange={(e) => setLiveStartTime(e.target.value)}
        />
        <button 
          className="btn btn-secondary" 
          style={{ padding: '1rem 2rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          onClick={() => isSubscribed ? handleGoLive() : navigate('/pricing')}
        >
          <Video size={18}/> Go Live
        </button>
      </div>

      <div className="tabs-row mb-6 custom-scrollbar" style={{ display: 'flex', gap: '0.8rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <Tab id="students"   label="Students"   icon={Users} />
        <Tab id="analytics"  label="Analytics"  icon={TrendingUp} />
        <Tab id="batches"    label="Batches"     icon={Layers} />
        <Tab id="schedule"   label="Schedule"    icon={Calendar} />
        <Tab id="materials"  label="Materials"   icon={FileText} />
        <Tab id="marketplace" label="Marketplace" icon={Globe} />
        <Tab id="exams"      label="Exams"       icon={CheckSquare} />
        <Tab id="leads"      label="Leads"      icon={TrendingUp} />
        <Tab id="defaulters" label="Overdue"     icon={AlertOctagon} />
        <Tab id="banking"    label="Banking"     icon={CreditCard} />
        <Tab id="profile"    label="Public Profile" icon={Layout} />
      </div>

      {activeTab === 'students' && (
        <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
          <div className="glass-panel p-8" style={{ flex: 1, minWidth: '320px' }}>
            <h3 className="mb-4 flex items-center gap-2"><UserPlus size={20}/> Add Student</h3>
            <form onSubmit={handleAddStudent} className="flex-col gap-4">
              <input 
                type="tel" 
                className="input-field mb-2" 
                placeholder="Student Mobile Number" 
                value={studentPhone} 
                onChange={e => handlePhoneChange(e.target.value)} 
                required 
              />
              {lookupLoading && <p style={{ fontSize: '0.7rem', color: 'var(--primary)' }}>Checking records...</p>}
              {phoneLookup?.found && <p style={{ fontSize: '0.7rem', color: 'var(--secondary)' }}>Existing student found: {phoneLookup.name}</p>}
              <input type="text" className="input-field mb-2" placeholder="Name" value={studentName} onChange={e => setStudentName(e.target.value)} required />
              <select className="input-field mb-2" value={studentBatchId} onChange={e => setStudentBatchId(e.target.value)} required>
                <option value="" disabled>Assign to Batch...</option>
                {myBatches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <button type="submit" className="btn btn-primary w-full">Create Student Account</button>
            </form>
          </div>
          <div className="glass-panel p-8" style={{ flex: 2, minWidth: '320px' }}>
            <StudentManagePanel myStudents={myStudents} myBatches={myBatches} />
          </div>
        </div>
      )}

      {activeTab === 'analytics' && <FinancialAnalytics myStudents={myStudents} />}

      {activeTab === 'batches' && (
        <div className="glass-panel p-8">
          <h3 className="mb-4">Batch Management</h3>
          <form onSubmit={createBatch} className="flex gap-4 items-end mb-6 flex-wrap">
            <input type="text" className="input-field" placeholder="Batch Name" value={newBatchName} onChange={e => setNewBatchName(e.target.value)} required />
            <input type="number" className="input-field" placeholder="Limit" value={newBatchLimit} onChange={e => setNewBatchLimit(e.target.value)} required />
            <button type="submit" className="btn btn-primary">Create Batch</button>
          </form>
          <div className="flex-col gap-4">
            {myBatches.map(b => (
              <div key={b.id} className="p-4 glass-panel" style={{ background: 'rgba(0,0,0,0.1)' }}>
                <h4>{b.name}</h4>
                <p className="text-muted">Capacity: {myStudents.filter(s => s.batch_id === b.id).length} / {b.limit}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="glass-panel p-8">
          <h3 className="mb-4">Schedule Class</h3>
          <form onSubmit={handleScheduleClass} className="flex-col gap-4">
            <input type="text" className="input-field mb-2" placeholder="Title" value={sessionTitle} onChange={e => setSessionTitle(e.target.value)} required />
            <select className="input-field mb-2" value={sessionBatchId} onChange={e => setSessionBatchId(e.target.value)} required>
              <option value="" disabled>Select Batch...</option>
              {myBatches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <input type="datetime-local" className="input-field mb-2" value={sessionDate} onChange={e => setSessionDate(e.target.value)} required />
            <button type="submit" className="btn btn-secondary w-full">Schedule</button>
          </form>
        </div>
      )}

      {activeTab === 'materials' && <TutorMaterialsPanel myBatches={myBatches} />}
      {activeTab === 'marketplace' && <TutorCourseManager tutorId={currentUser?.uid} />}
      {activeTab === 'exams' && <ExamResultsPanel tutorId={currentUser?.uid} myBatches={myBatches} myStudents={myStudents} />}
      {activeTab === 'leads' && <TutorLeadsPanel />}
      {activeTab === 'defaulters' && (
        <div className="glass-panel p-8">
          <h3>Overdue Payments</h3>
          {myStudents.filter(s => s.payment_status === 'overdue').map(s => (
            <div key={s.id} className="p-4 glass-panel mb-2 flex justify-between items-center">
              <span>{s.name}</span>
              <button className="btn btn-danger" onClick={() => alert('Reminder Sent')}>Remind</button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'banking' && (
        <div className="glass-panel p-8">
          <BankingSettings tutorId={currentUser?.uid} bankDetails={tutorBanking} onSave={(data) => updateBankingDetails(currentUser?.uid, data)} />
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="glass-panel p-8">
          <h3 className="mb-8">Public Profile Editor</h3>
          <div className="flex mobile-stack gap-10">
            {/* Round Photo Preview & Upload */}
            <div className="flex-col items-center gap-4" style={{ minWidth: '200px' }}>
              <div style={{ 
                width: '120px', 
                height: '120px', 
                borderRadius: '50%', 
                border: '3px solid var(--primary)',
                padding: '4px',
                boxShadow: '0 0 20px rgba(79, 70, 229, 0.3)',
                background: 'rgba(255,255,255,0.02)',
                overflow: 'hidden'
              }}>
                <img 
                  src={profilePic || 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor'} 
                  alt="Profile" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                />
              </div>
              <FileUploadVercel 
                uid={currentUser?.uid} 
                folder="profiles" 
                onUploadSuccess={(url) => setProfilePic(url)} 
                label="Change Photo"
              />
            </div>

            {/* Info Form */}
            <div className="flex-1 flex-col gap-4">
              <label style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 800 }}>BIO / ABOUT ME</label>
              <textarea className="input-field" placeholder="Bio" value={profileBio} onChange={e => setProfileBio(e.target.value)} rows={4} />
              
              <label style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 800 }}>TEACHING SUBJECTS</label>
              <input className="input-field" placeholder="e.g. Mathematics, Physics" value={profileSubjects} onChange={e => setProfileSubjects(e.target.value)} />

              <div className="flex mobile-stack gap-4">
                <div className="flex-1 flex-col gap-2">
                  <label style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 800 }}>TARGET CLASSES</label>
                  <input className="input-field" placeholder="e.g. Class 10, Class 12, JEE" value={profileClasses} onChange={e => setProfileClasses(e.target.value)} />
                </div>
                <div className="flex-1 flex-col gap-2">
                  <label style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 800 }}>LOCATION (AREA/COLONY)</label>
                  <input className="input-field" placeholder="e.g. Salt Lake, Sector V" value={profileArea} onChange={e => setProfileArea(e.target.value)} />
                </div>
              </div>

              <div className="flex mobile-stack gap-4">
                <div className="flex-1 flex-col gap-2">
                  <label style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 800 }}>YEARS OF EXPERIENCE</label>
                  <input className="input-field" placeholder="e.g. 5 Years" value={profileExperience} onChange={e => setProfileExperience(e.target.value)} />
                </div>
                <div className="flex-1 flex-col gap-2">
                  <label style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 800 }}>HIGHEST QUALIFICATION</label>
                  <input className="input-field" placeholder="e.g. M.Sc in Physics" value={profileQualification} onChange={e => setProfileQualification(e.target.value)} />
                </div>
              </div>

              {/* Certificate Upload Section */}
              <div className="glass-panel p-6 mt-4" style={{ background: 'rgba(79, 70, 229, 0.05)', border: '1px dashed var(--primary)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <Shield size={20} color="var(--primary)" />
                  <h4 style={{ margin: 0 }}>Qualification Verification</h4>
                </div>
                <p className="text-muted text-sm mb-4">Please upload your highest qualification certificate (PDF or Image). This will be used to verify your authority on the platform.</p>
                
                <div className="flex items-center gap-4 flex-wrap">
                  <FileUploadVercel 
                    uid={currentUser?.uid} 
                    folder="certificates" 
                    onUploadSuccess={(url) => setProfileCertificates(prev => [...prev, { url, type: 'qualification', name: 'Certificate', uploaded_at: new Date().toISOString(), status: 'pending' }])} 
                    label="Upload Certificate"
                  />
                  
                  {profileCertificates.map((cert, idx) => (
                    <div key={idx} className="glass-panel p-2 flex items-center gap-2" style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)' }}>
                      <FileText size={14} />
                      <span>Certificate {idx + 1}</span>
                      <span style={{ color: cert.status === 'active' ? 'var(--secondary)' : '#f5c518' }}>
                        ({cert.status || 'Pending'})
                      </span>
                      <button onClick={() => setProfileCertificates(prev => prev.filter((_, i) => i !== idx))} className="btn-link" style={{ color: 'var(--danger)' }}><Trash2 size={12}/></button>
                    </div>
                  ))}
                </div>
              </div>
              
              <button className="btn btn-primary w-full mt-6" onClick={handleSaveProfile} style={{ padding: '1rem', fontWeight: 800 }}>
                <Check size={20} /> Save & Submit for Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {credentialModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel p-8" style={{ maxWidth: '400px' }}>
            <h2 className="mb-4">Credentials Created</h2>
            <p><strong>Mobile:</strong> {credentialModal.phone}</p>
            <p><strong>Password:</strong> {credentialModal.password}</p>
            <p className="mt-4" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Give these credentials to the student. They will need to verify their OTP on first login.</p>
            <button className="btn btn-primary w-full mt-4" onClick={() => setCredentialModal(null)}>Close</button>
          </div>
        </div>
      )}

      <style>{`
        .input-field {
          margin-bottom: 1rem;
        }
        .neon-border-wrapper {
          padding: 1.5rem 3rem;
          border: 2px solid var(--primary);
          border-radius: 24px;
          box-shadow: 0 0 20px rgba(79, 70, 229, 0.2), inset 0 0 20px rgba(79, 70, 229, 0.2);
          animation: neon-pulse 3s infinite ease-in-out;
          position: relative;
          background: rgba(10, 14, 26, 0.6);
          backdrop-filter: blur(10px);
        }

        .neon-text {
          color: #fff;
          text-shadow: 0 0 10px rgba(79, 70, 229, 0.8), 0 0 20px rgba(79, 70, 229, 0.4), 0 0 30px rgba(79, 70, 229, 0.2);
          animation: text-flicker 5s infinite;
        }

        @keyframes neon-pulse {
          0%, 100% { 
            border-color: var(--primary);
            box-shadow: 0 0 20px rgba(79, 70, 229, 0.4), inset 0 0 20px rgba(79, 70, 229, 0.2);
          }
          50% { 
            border-color: #a78bfa;
            box-shadow: 0 0 40px rgba(167, 139, 250, 0.6), inset 0 0 30px rgba(167, 139, 250, 0.3);
          }
        }

        @keyframes text-flicker {
          0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100% { opacity: 1; }
          20%, 21.999%, 63%, 63.999%, 65%, 69.999% { opacity: 0.95; }
        }
      `}</style>
    </div>
  );
}

function MarkPaidButton({ studentId, onMark }) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState('cash');
  if (!open) return <button className="btn btn-outline" style={{ fontSize: '0.75rem' }} onClick={() => setOpen(true)}>✓ Mark Paid</button>;
  return (
    <div className="flex gap-2">
      <select className="input-field" value={method} onChange={e => setMethod(e.target.value)} style={{ fontSize: '0.75rem' }}>
        <option value="cash">Cash</option>
        <option value="digital">Digital</option>
      </select>
      <button className="btn btn-primary" style={{ fontSize: '0.75rem' }} onClick={() => { onMark(studentId, method); setOpen(false); }}>OK</button>
      <button className="btn btn-outline" style={{ fontSize: '0.75rem' }} onClick={() => setOpen(false)}>✕</button>
    </div>
  );
}
