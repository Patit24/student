import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AuthContext';
import { 
  Video, Mic, MicOff, VideoOff, ScreenShare, MessageSquare, Users, 
  Lock, Unlock, Check, X, UserPlus, Calendar, Palette, Crown, 
  FileText, CheckSquare, Building2, AlertOctagon, ToggleLeft, 
  ToggleRight, Image, Globe, Play, Plus, Trash2, MapPin
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
import { useToast } from '../components/Toast';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';


const PLAN_LIMITS = {
  free:   { batches: 1,        students: 5,   pdf: false, recording: false },
  growth: { batches: 5,        students: 50,  pdf: true,  recording: false },
  pro:    { batches: Infinity, students: Infinity, pdf: true, recording: true },
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

                {/* Short answer questions need teacher grading */}
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
  } = useAppContext();

  const myTutorRecord            = mockTutors.find(t => t.id === currentUser?.uid) || mockTutors[0];
  const tutorBanking             = myTutorRecord?.banking || null;
  const autoRestrictionEnabled   = myTutorRecord?.auto_restriction_enabled ?? true; // default ON
  const profileIncomplete        = !myTutorRecord?.bio || !myTutorRecord?.location?.area;

  const tier = currentUser?.subscription_tier || 'free';
  const limits = PLAN_LIMITS[tier] || PLAN_LIMITS.free;

  // Tenant-isolated data
  const myBatches = mockBatches.filter(b => b.tutorId === currentUser?.uid);
  const myStudents = mockStudents.filter(s => s.tutorId === currentUser?.uid);

  // Live Session States
  const [isLive, setIsLive] = useState(false);
  const [streamActive, setStreamActive] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [waitingRoom, setWaitingRoom] = useState([]);
  const [activeParticipants, setActiveParticipants] = useState([]);

  // Batch UI
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchLimit, setNewBatchLimit] = useState('');

  // Student Onboarding
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentBatchId, setStudentBatchId] = useState('');

  // Scheduling
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionBatchId, setSessionBatchId] = useState('');
  const [sessionDate, setSessionDate] = useState('');

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
  const [profileCertificates, setProfileCertificates] = useState(myTutorRecord?.certificates || []);
  const [brandColor, setBrandColor] = useState(currentUser?.branding_color || '#4F46E5');

  const handleSaveProfile = async () => {
    const profileData = {
      bio: profileBio,
      photoURL: profilePic,
      subjects: profileSubjects.split(',').map(s => s.trim()).filter(s => s),
      classes: profileClasses.split(',').map(s => s.trim()).filter(s => s),
      boards: profileBoards.split(',').map(s => s.trim()).filter(s => s),
      teaching_mode: profileMode,
      intro_video: profileVideo,
      location: {
        area: profileArea,
        city: profileCity,
      },
      certificates: profileCertificates,
      branding_color: brandColor,
    };
    await updateTutorProfile(profileData);
    toast.success('Public Profile Updated! Students can now find you better.');
  };

  // PDF
  const [pdfFile, setPdfFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');

  // Active Tab
  const { isActive: isSubscribed } = useSubscription();
  const [activeTab, setActiveTab] = useState('students');

  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const cameraTrackRef = useRef(null);

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

  // Apply branding to CSS
  useEffect(() => {
    document.documentElement.style.setProperty('--primary', brandColor);
  }, [brandColor]);

  const handleSaveBranding = () => {
    updateBranding(brandColor);
    alert('Branding saved! Students will see your custom theme on login.');
  };

  const handleGoLive = async () => {
    setIsLive(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      cameraTrackRef.current = mediaStream.getVideoTracks()[0];
      setStreamActive(true);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      console.error('Error accessing media devices.', err);
      setIsLive(false);
    }
  };

  const stopStream = () => {
    stream?.getTracks().forEach(t => t.stop());
    setStreamActive(false);
    setIsLive(false);
    setWaitingRoom([]);
    setActiveParticipants([]);
    setIsScreenSharing(false);
  };

  const toggleMic = () => {
    if (stream) {
      const t = stream.getAudioTracks()[0];
      if (t) { t.enabled = !micOn; setMicOn(!micOn); }
    }
  };

  const toggleCamera = () => {
    if (stream && !isScreenSharing) {
      const t = stream.getVideoTracks()[0];
      if (t) { t.enabled = !cameraOn; setCameraOn(!cameraOn); }
    }
  };

  const revertToCamera = () => {
    if (stream && cameraTrackRef.current) {
      stream.getVideoTracks()[0]?.stop();
      stream.removeTrack(stream.getVideoTracks()[0]);
      stream.addTrack(cameraTrackRef.current);
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsScreenSharing(false);
      setCameraOn(true);
    }
  };

  const toggleScreenShare = async () => {
    if (!limits.recording) {
      alert('Screen sharing is available on the Pro plan. Please upgrade.');
      return;
    }
    try {
      if (!isScreenSharing) {
        const ss = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = ss.getVideoTracks()[0];
        screenTrack.onended = revertToCamera;
        const current = stream.getVideoTracks()[0];
        stream.removeTrack(current);
        stream.addTrack(screenTrack);
        if (videoRef.current) videoRef.current.srcObject = stream;
        setIsScreenSharing(true);
      } else {
        revertToCamera();
      }
    } catch (err) {
      console.error("Error toggling screen share", err);
    }
  };

  const createBatch = async (e) => {
    e.preventDefault();
    if (myBatches.length >= limits.batches) {
      toast.error(`Your ${tier} plan allows max ${limits.batches} batch(es). Please upgrade.`);
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
        // Write to Firestore — onSnapshot listener will auto-update mockBatches
        await addDoc(col(db, 'batches'), batchPayload);
        toast.success(`Batch "${newBatchName}" created ✅`);
      } catch (err) {
        toast.error(`Failed to create batch: ${err.message}`);
        return;
      }
    } else {
      // Mock mode: update local state
      const newBatch = { id: `batch-${Date.now()}`, ...batchPayload };
      setMockBatches(prev => [...prev, newBatch]);
      toast.success(`Batch "${newBatchName}" created ✅`);
    }

    setNewBatchName('');
    setNewBatchLimit('');
  };

  // ── Email lookup: check if student already registered ──
  const [emailLookup,     setEmailLookup]     = useState(null);  // { found: bool, name?, id? }
  const [lookupLoading,   setLookupLoading]   = useState(false);
  const [credentialModal, setCredentialModal] = useState(null);  // { name, email, password }

  const handleEmailChange = async (email) => {
    setStudentEmail(email);
    setEmailLookup(null);
    if (!email.includes('@')) return;

    setLookupLoading(true);
    try {
      if (!isMockMode) {
        const { lookupStudentByEmail } = await import('../db.service');
        const existing = await lookupStudentByEmail(email);
        if (existing) {
          setEmailLookup({ found: true, name: existing.name, id: existing.id });
          setStudentName(existing.name); // pre-fill name
        } else {
          setEmailLookup({ found: false });
        }
      } else {
        // Mock mode lookup
        const found = mockStudents.find(s => s.email === email);
        if (found) {
          setEmailLookup({ found: true, name: found.name, id: found.id });
          setStudentName(found.name);
        } else {
          setEmailLookup({ found: false });
        }
      }
    } catch { setEmailLookup({ found: false }); }
    setLookupLoading(false);
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (myStudents.length >= limits.students) {
      toast.error(`Your ${tier} plan allows max ${limits.students} student(s). Please upgrade.`);
      return;
    }

    // If already registered, just link to batch — update their Firestore doc
    if (emailLookup?.found) {
      const existingId = emailLookup.id;
      const linkPayload = {
        tutorId:        currentUser.uid,
        batch_id:       studentBatchId,
        phone:          studentPhone,
        payment_status: 'active',
      };

      if (!isMockMode && db && existingId) {
        try {
          const { enrollStudentInBatch } = await import('../db.service');
          await enrollStudentInBatch(existingId, currentUser.uid, studentBatchId);
          toast.success(`${studentName} linked to your batch ✅`);
        } catch (err) {
          toast.error(`Link failed: ${err.message}`);
          return;
        }
      } else {
        // Mock mode
        const linked = { id: existingId || `student-${Date.now()}`, name: studentName, email: studentEmail, is_verified: true, ...linkPayload };
        if (!mockStudents.find(s => s.id === linked.id)) {
          setMockStudents(prev => [...prev, linked]);
        }
        toast.success(`${studentName} linked to your batch ✅`);
      }

      setStudentName(''); setStudentEmail(''); setStudentPhone(''); setStudentBatchId('');
      setEmailLookup(null);
      return;
    }

    // ── New student — generate password and create account ──
    const { generateTempPassword } = await import('../db.service');
    const tempPassword = generateTempPassword();
    const newId = `student-${Date.now()}`;

    if (!isMockMode) {
      try {
        const { createStudentAccount } = await import('../db.service');
        const result = await createStudentAccount(
          studentEmail, studentName, currentUser.uid, studentBatchId
        );
        // ✅ Don't call setMockStudents here — the onSnapshot listener will
        //    automatically pick up the new Firestore doc and update the list.
        setCredentialModal({ name: studentName, email: studentEmail, password: result.tempPassword });
        toast.success(`Account created for ${studentName}! Share the credentials.`);
      } catch (err) {
        toast.error(`Failed to create account: ${err.message}`);
        return;
      }
    } else {
      // Mock mode — update local state directly
      const newStudent = {
        id: newId, name: studentName, email: studentEmail,
        phone: studentPhone, batch_id: studentBatchId,
        is_verified: true, tutorId: currentUser.uid,
        payment_status: 'active',
      };
      setMockStudents(prev => [...prev, newStudent]);
      setMockBatches(prev => prev.map(b =>
        b.id === studentBatchId ? { ...b, assigned: [...(b.assigned||[]), newId] } : b
      ));
      setCredentialModal({ name: studentName, email: studentEmail, password: tempPassword });
      toast.success(`Account created for ${studentName}! Share the credentials.`);
    }

    setStudentName(''); setStudentEmail(''); setStudentPhone(''); setStudentBatchId('');
    setEmailLookup(null);
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
      alert(`Class Scheduled! Notifications sent to Verified Students in the batch.`);
      setSessionTitle(''); setSessionBatchId(''); setSessionDate('');
    }
  };

  const handlePdfUpload = (e) => {
    e.preventDefault();
    if (!limits.pdf) {
      alert('PDF uploads are available on the Growth or Pro plan. Please upgrade.');
      return;
    }
    if (pdfFile) {
      setUploadMessage('Uploading PDF...');
      setTimeout(() => {
        setUploadMessage('PDF uploaded! Subscribed students can now view it.');
        setPdfFile(null);
      }, 1500);
    }
  };

  // ----------- LIVE VIEW -----------
  if (isLive) {
    return (
      <div className="flex h-screen live-stream-root" style={{ height: 'calc(100vh - 73px)', overflow: 'hidden' }}>
        <div className="flex-col" style={{ flex: 1, backgroundColor: '#000', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 10, display: 'flex', gap: '1rem' }}>
            <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: 'var(--radius-lg)' }}>
              {isLocked ? <Lock size={16} color="var(--danger)" /> : <Unlock size={16} color="var(--secondary)" />}
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{isLocked ? 'Private' : 'Public'}</span>
            </div>
            <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: 'var(--radius-lg)' }}>
              <Users size={16} />
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{activeParticipants.length} live</span>
            </div>
          </div>

          {streamActive ? (
            <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <div className="flex justify-center items-center h-full" style={{ color: 'white' }}><p>Starting camera…</p></div>
          )}
          
          <div className="flex justify-center items-center gap-4 p-4" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
            <button className="btn btn-outline" style={{ background: 'var(--surface)', borderColor: 'transparent' }} onClick={toggleMic}>
              {micOn ? <Mic size={20}/> : <MicOff size={20} color="var(--danger)"/>}
            </button>
            <button className="btn btn-outline" style={{ background: 'var(--surface)', borderColor: 'transparent' }} onClick={toggleCamera}>
              {cameraOn ? <Video size={20}/> : <VideoOff size={20} color="var(--danger)"/>}
            </button>
            <button className="btn btn-outline" 
              style={{ background: isScreenSharing ? 'var(--primary)' : 'var(--surface)', borderColor: 'transparent' }} 
              onClick={toggleScreenShare}
              title={!limits.recording ? 'Pro plan required' : ''}
            >
              <ScreenShare size={20} color="white"/>
            </button>
            <button className="btn btn-danger" onClick={stopStream}>End Class</button>
          </div>
        </div>
        
        <div className="live-chat-panel" style={{ width: '350px', borderLeft: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
          {isLocked && waitingRoom.length > 0 && (
            <div className="p-4" style={{ borderBottom: '1px solid var(--border)', background: 'rgba(239, 68, 68, 0.1)' }}>
              <h4 className="flex items-center gap-2 mb-2" style={{ color: 'var(--danger)' }}><Lock size={16}/> Waiting Room ({waitingRoom.length})</h4>
              {waitingRoom.map(student => (
                <div key={student.id} className="flex justify-between items-center mb-2" style={{ background: 'var(--background)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.9rem' }}>{student.name}</span>
                  <div className="flex gap-2">
                    <button onClick={() => { setWaitingRoom(waitingRoom.filter(s => s.id !== student.id)); setActiveParticipants([...activeParticipants, student]); }} style={{ background: 'var(--secondary)', border: 'none', borderRadius: '4px', padding: '0.2rem', cursor: 'pointer', color: 'white' }}><Check size={14}/></button>
                    <button onClick={() => setWaitingRoom(waitingRoom.filter(s => s.id !== student.id))} style={{ background: 'var(--danger)', border: 'none', borderRadius: '4px', padding: '0.2rem', cursor: 'pointer', color: 'white' }}><X size={14}/></button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h3 className="flex items-center gap-2"><MessageSquare size={18}/> Live Chat</h3>
          </div>
          <ChatSidebar roomId={`room-${currentUser?.uid}`} />
        </div>
      </div>
    );
  }

  // ----------- MAIN DASHBOARD -----------
  const PlanBadge = ({ label }) => (
    <span style={{ fontSize: '0.7rem', background: 'var(--primary)', color: 'white', padding: '0.15rem 0.5rem', borderRadius: '1rem', marginLeft: '0.5rem', verticalAlign: 'middle' }}>
      {label}
    </span>
  );

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
    <div className="container mt-4 animate-fade-in" style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <div className="dash-header">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            Tutor Dashboard
            <span style={{ fontSize: '0.7rem', background: 'rgba(79,70,229,0.2)', color: 'var(--primary)', border: '1px solid var(--primary)', padding: '0.2rem 0.75rem', borderRadius: '1rem', verticalAlign: 'middle' }}>
              <Crown size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.3rem' }}/>
              {tier.toUpperCase()} PLAN
            </span>
            <Link to="/pricing" style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>Upgrade Plan</Link>
          </h2>
          <p className="text-muted mt-1">{myStudents.length} Students · {myBatches.length} Batches · {myStudents.filter(s => s.is_verified).length} Verified</p>
        </div>
        <div className="dash-header-actions">
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button className={`btn ${!isLocked ? 'btn-secondary' : 'btn-outline'}`} style={{ padding: '0.5rem 0.8rem', fontSize: '0.85rem' }} onClick={() => setIsLocked(false)}>
              <Unlock size={15}/> <span className="tab-text">Public</span>
            </button>
            <button className={`btn ${isLocked ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.5rem 0.8rem', fontSize: '0.85rem' }} onClick={() => setIsLocked(true)}>
              <Lock size={15}/> <span className="tab-text">Private</span>
            </button>
          </div>
          <button
            className="btn btn-secondary"
            onClick={isSubscribed ? handleGoLive : () => navigate('/pricing')}
            style={{ fontSize: '0.9rem', padding: '0.6rem 1.2rem', opacity: isSubscribed ? 1 : 0.6 }}
            title={isSubscribed ? 'Start Live Class' : '🔒 Upgrade to unlock Live Classes'}
          >
            <Video size={16}/> <span className="tab-text">{isSubscribed ? 'Go Live' : 'Upgrade'}</span>
            {!isSubscribed && <span style={{fontSize:'0.7rem'}}>🔒</span>}
          </button>
        </div>
      </div>

      {profileIncomplete && (
        <div className="glass-panel p-4 mb-6 animate-fade-in" style={{ border: '1px solid rgba(245,197,24,0.3)', background: 'rgba(245,197,24,0.05)' }}>
          <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
            <AlertOctagon size={20} color="#F5C518" />
            <div style={{ flex: 1, minWidth: '200px' }}>
              <h4 style={{ fontSize: '0.9rem', color: '#F5C518', marginBottom: '0.2rem' }}>Complete Your Discovery Profile</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Students can't find you in local searches yet! Add your Bio, Subjects, and Location in the Branding tab.</p>
            </div>
            <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }} onClick={() => setActiveTab('branding')}>Fix Now</button>
          </div>
        </div>
      )}

      {/* Tabs — horizontal scroll on mobile */}
      <div className="tabs-row mb-6">
        <Tab id="leads"      label={`Leads (${mockLeads.filter(l => l.tutor_id === currentUser?.uid && l.status === 'new').length})`} icon={MessageSquare} />
        <Tab id="students"   label="Students"   icon={Users} />
        <Tab id="batches"    label="Batches"     icon={UserPlus} />
        <Tab id="materials"  label="Materials"   icon={FileText} />
        <Tab id="schedule"   label="Schedule"    icon={Calendar} />
        <Tab id="exams"      label="Exams"       icon={CheckSquare} />
        <Tab id="defaulters" label={`Overdue (${myStudents.filter(s => s.payment_status === 'overdue').length})`} icon={AlertOctagon} />
        <Tab id="banking"    label="Banking"     icon={Building2} />
        <Tab id="profile"    label="Public Profile" icon={Palette} />
      </div>

      {/* ---- LEADS TAB ---- */}
      {activeTab === 'leads' && (
        <TutorLeadsPanel />
      )}

      {/* ---- STUDENTS TAB ---- */}
      {activeTab === 'students' && (
        <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
          <div className="glass-panel p-8" style={{ flex: 1, minWidth: '320px' }}>
            <h3 className="mb-4 flex items-center gap-2"><UserPlus size={20}/> Add Student
              <PlanBadge label={`${limits.students === Infinity ? '∞' : limits.students} max`} />
            </h3>
            <form onSubmit={handleAddStudent} className="flex-col gap-4">

              {/* Email field with live lookup */}
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="input-field mb-1"
                  placeholder="Student Email Address"
                  value={studentEmail}
                  onChange={e => handleEmailChange(e.target.value)}
                  required
                />
                {lookupLoading && (
                  <p style={{ fontSize: '0.72rem', color: '#7A8BA8', margin: '0 0 0.5rem' }}>🔍 Checking database…</p>
                )}
                {emailLookup?.found && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.5rem 0.75rem', borderRadius: '8px', marginBottom: '0.5rem',
                    background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)',
                  }}>
                    <span style={{ fontSize: '0.85rem' }}>✅</span>
                    <p style={{ fontSize: '0.78rem', color: '#86EFAC', margin: 0 }}>
                      Already registered: <strong>{emailLookup.name}</strong> — will be linked to your batch.
                    </p>
                  </div>
                )}
                {emailLookup?.found === false && studentEmail.includes('@') && (
                  <p style={{ fontSize: '0.72rem', color: '#F5C518', margin: '0 0 0.5rem' }}>
                    🆕 New student — a login account will be auto-created.
                  </p>
                )}
              </div>

              {/* Name: auto-filled when student found */}
              <input
                type="text"
                className="input-field mb-2"
                placeholder="Student Full Name"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                readOnly={emailLookup?.found === true}
                style={{ opacity: emailLookup?.found ? 0.7 : 1 }}
                required
              />

              <input type="tel" className="input-field mb-2" placeholder="Phone Number" value={studentPhone} onChange={e => setStudentPhone(e.target.value)} required />
              <select className="input-field mb-2" value={studentBatchId} onChange={e => setStudentBatchId(e.target.value)} required>
                <option value="" disabled>Assign to Batch...</option>
                {myBatches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>

              <button type="submit" className="btn btn-primary w-full" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                {emailLookup?.found
                  ? <><UserPlus size={16} /> Link to Batch</>
                  : <><UserPlus size={16} /> Create Account & Send Credentials</>
                }
              </button>
            </form>
          </div>

          {/* ── Manage existing students ── */}
          <div className="glass-panel p-8" style={{ flex: 2, minWidth: '320px' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} /> Manage Students
            </h3>
            <StudentManagePanel myStudents={myStudents} myBatches={myBatches} />
          </div>
        </div>
      )}


      {/* ---- BATCHES TAB ---- */}
      {activeTab === 'batches' && (
        <div className="glass-panel p-8">
          <h3 className="mb-4 flex items-center gap-2">Batch Management
            <PlanBadge label={`${limits.batches === Infinity ? '∞' : limits.batches} max batches`} />
          </h3>
          <form onSubmit={createBatch} className="flex gap-4 items-end mb-6 flex-wrap">
            <div style={{ flex: 2, minWidth: '200px' }}>
              <input type="text" className="input-field" placeholder="Batch Name (e.g., Civil Eng - Batch A)" value={newBatchName} onChange={e => setNewBatchName(e.target.value)} required />
            </div>
            <div style={{ flex: 1, minWidth: '100px' }}>
              <input type="number" className="input-field" placeholder="Student Limit" min="1" value={newBatchLimit} onChange={e => setNewBatchLimit(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary">Create Batch</button>
          </form>
          <div className="flex-col gap-4">
            {myBatches.length === 0 && <p className="text-muted">No batches created yet.</p>}
            {myBatches.map(b => {
              const enrolled = myStudents.filter(s => s.batch_id === b.id).length;
              const pct = Math.round((enrolled / b.limit) * 100);
              return (
                <div key={b.id} style={{ border: '1px solid var(--border)', padding: '1.25rem', borderRadius: 'var(--radius)', background: 'rgba(0,0,0,0.1)' }}>
                  <div className="flex justify-between items-center mb-2">
                    <h4>{b.name}</h4>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{enrolled} / {b.limit}</span>
                  </div>
                  <div style={{ background: 'var(--border)', borderRadius: '1rem', height: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: pct >= 100 ? 'var(--danger)' : 'var(--primary)', transition: 'width 0.4s ease' }} />
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{pct}% capacity</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---- SCHEDULE TAB ---- */}
      {activeTab === 'schedule' && (
        <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
          <div className="glass-panel p-8" style={{ flex: 1, minWidth: '320px' }}>
            <h3 className="mb-4 flex items-center gap-2"><Calendar size={20}/> Schedule Class</h3>
            <form onSubmit={handleScheduleClass} className="flex-col gap-4">
              <input type="text" className="input-field mb-2" placeholder="Class Title" value={sessionTitle} onChange={e => setSessionTitle(e.target.value)} required />
              <select className="input-field mb-2" value={sessionBatchId} onChange={e => setSessionBatchId(e.target.value)} required>
                <option value="" disabled>Select Target Batch...</option>
                {myBatches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <input type="datetime-local" className="input-field mb-2" value={sessionDate} onChange={e => setSessionDate(e.target.value)} required />
              <button type="submit" className="btn btn-secondary w-full">Generate Link & Notify Batch</button>
            </form>
          </div>

          <div className="glass-panel p-8" style={{ flex: 2, minWidth: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.5rem' }}>
            <FileText size={28} color="#F5C518" />
            <h4 style={{ color: '#F0F4FF', marginBottom: '0.2rem' }}>Upload Materials from the Materials Tab</h4>
            <p style={{ fontSize: '0.82rem', color: '#7A8BA8', textAlign: 'center' }}>
              PDF uploads are now managed in the <strong style={{ color: '#F5C518' }}>Materials</strong> tab with batch assignment and live student visibility.
            </p>
          </div>
        </div>
      )}

      {/* ---- MATERIALS TAB ---- */}
      {activeTab === 'materials' && (
        <SubscriptionGuard feature="PDF / Material Uploads" requiredTier="growth">
          <TutorMaterialsPanel myBatches={myBatches} />
        </SubscriptionGuard>
      )}

      {/* ---- EXAMS TAB ---- */}
      {activeTab === 'exams' && (
        <ExamResultsPanel tutorId={currentUser?.uid} myBatches={myBatches} myStudents={myStudents} />
      )}


      {/* ---- DEFAULTERS TAB ---- */}
      {activeTab === 'defaulters' && (() => {
        const defaulters = myStudents.filter(s =>
          s.payment_status === 'overdue' ||
          (s.payment_due_date && new Date(s.payment_due_date) < new Date() && s.payment_status !== 'paid')
        );
        return (
          <div className="glass-panel p-8">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.8rem' }}>
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#F0F4FF' }}>
                  <AlertOctagon size={20} color="#EF4444" /> Defaulters — {defaulters.length} Students
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#7A8BA8', marginTop: '0.2rem' }}>
                  Students who missed the 5th-day payment deadline this month.
                </p>
              </div>
              {defaulters.length > 0 && (
                <button
                  onClick={() => alert(`📢 Bulk SMS sent to ${defaulters.length} overdue students reminding them to pay fees.`)}
                  style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', borderRadius: '9px', padding: '0.55rem 1.1rem', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  📱 Send Bulk Reminder ({defaulters.length})
                </button>
              )}
            </div>

            {defaulters.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed rgba(34,197,94,0.3)', borderRadius: '12px' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
                <h4 style={{ color: '#22C55E', marginBottom: '0.3rem' }}>No Defaulters!</h4>
                <p style={{ color: '#7A8BA8', fontSize: '0.85rem' }}>All students have paid their fees this month.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {defaulters.map(s => {
                  const daysOverdue = s.payment_due_date
                    ? Math.max(0, Math.floor((new Date() - new Date(s.payment_due_date)) / 86400000))
                    : 0;
                  return (
                    <div key={s.id} style={{
                      background: 'rgba(239,68,68,0.05)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: '12px',
                      padding: '1rem 1.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.8rem',
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{ width: '32px', height: '32px', background: 'rgba(239,68,68,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#EF4444' }}>
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#F0F4FF', margin: 0 }}>{s.name}</p>
                            <p style={{ fontSize: '0.72rem', color: '#7A8BA8', margin: 0 }}>{s.phone || s.email}</p>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ fontSize: '1.2rem', fontWeight: 900, color: '#EF4444', margin: 0 }}>₹{(s.outstanding_balance || s.monthly_fee || 0).toLocaleString()}</p>
                          <p style={{ fontSize: '0.65rem', color: '#7A8BA8', margin: 0 }}>{daysOverdue}d overdue</p>
                        </div>
                        <button
                          onClick={() => alert(`📱 SMS sent to ${s.name} at ${s.phone || s.email}`)}
                          style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', borderRadius: '7px', padding: '0.3rem 0.7rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                        >
                          📱 Remind
                        </button>
                        <MarkPaidButton studentId={s.id} onMark={async (id, method) => {
                          await updatePaymentStatus(id, method);
                          toast.success(`${s.name} marked as Paid (${method}) ✅`);
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* ---- BANKING TAB ---- */}
      {activeTab === 'banking' && (
        <div>
          {/* Auto-Restriction Toggle */}
          <div className="glass-panel p-8" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                  {autoRestrictionEnabled ? <ToggleRight size={22} color="#F5C518" /> : <ToggleLeft size={22} color="#7A8BA8" />}
                  Auto-Restriction
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#7A8BA8', margin: 0 }}>
                  {autoRestrictionEnabled
                    ? 'ON — Students are automatically restricted after the 5th if unpaid.'
                    : 'OFF — All students have full access regardless of payment status.'}
                </p>
              </div>
              <button
                onClick={async () => {
                  const next = !autoRestrictionEnabled;
                  await setAutoRestriction(myTutorRecord?.id || currentUser?.uid, next);
                  toast.success(`Auto-Restriction ${next ? 'enabled' : 'disabled'} ✅`);
                }}
                style={{
                  background: autoRestrictionEnabled ? 'rgba(245,197,24,0.12)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${autoRestrictionEnabled ? 'rgba(245,197,24,0.35)' : 'rgba(255,255,255,0.12)'}`,
                  color: autoRestrictionEnabled ? '#F5C518' : '#7A8BA8',
                  borderRadius: '10px',
                  padding: '0.6rem 1.2rem',
                  fontWeight: 700, fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.25s',
                }}
              >
                {autoRestrictionEnabled ? '🔒 Disable Restriction' : '🔓 Enable Restriction'}
              </button>
            </div>
          </div>
          {/* Banking Details Form */}
          <div className="glass-panel p-8">
            <BankingSettings
              tutorId={currentUser?.uid}
              bankDetails={tutorBanking}
              onSave={(data) => updateBankingDetails(currentUser?.uid, data)}
            />
          </div>
        </div>
      )}

      {/* ---- PUBLIC PROFILE TAB ---- */}
      {activeTab === 'profile' && (
        <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
          <div className="glass-panel p-8" style={{ flex: 1, minWidth: '320px' }}>
            <h3 className="mb-2 flex items-center gap-2"><Palette size={20}/> Public Profile Editor</h3>
            <p className="text-muted mb-6">This information is visible to students on the discovery page and your public profile.</p>

            <div className="flex gap-6 mb-8" style={{ flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '280px' }}>
                <div className="input-group">
                  <label className="input-label">Profile Bio</label>
                  <textarea 
                    className="input-field" 
                    rows={4} 
                    placeholder="Tell students about your teaching style, experience, and what they can expect..."
                    value={profileBio}
                    onChange={e => setProfileBio(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Profile Picture URL</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="https://..."
                      value={profilePic}
                      onChange={e => setProfilePic(e.target.value)}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Specialization (comma-separated)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Math, Physics, JEE, Class 10..."
                    value={profileSubjects}
                    onChange={e => setProfileSubjects(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Classes (comma-separated)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="9, 10, 11, 12..."
                    value={profileClasses}
                    onChange={e => setProfileClasses(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Boards (comma-separated)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="CBSE, ICSE, State Board..."
                    value={profileBoards}
                    onChange={e => setProfileBoards(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ flex: 1, minWidth: '280px' }}>
                <div className="input-group">
                  <label className="input-label">Teaching Mode</label>
                  <select 
                    className="input-field"
                    value={profileMode}
                    onChange={e => setProfileMode(e.target.value)}
                  >
                    <option value="online">Online Only</option>
                    <option value="offline">Offline / Home Tuition</option>
                    <option value="both">Both Online & Offline</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Intro Video URL (YouTube/Vimeo)</label>
                  <div className="flex items-center gap-2">
                    <Play size={18} color="var(--danger)" />
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="https://youtube.com/watch?v=..."
                      value={profileVideo}
                      onChange={e => setProfileVideo(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label">Area / Locality</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. Salt Lake"
                      value={profileArea}
                      onChange={e => setProfileArea(e.target.value)}
                    />
                  </div>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label">City</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. Kolkata"
                      value={profileCity}
                      onChange={e => setProfileCity(e.target.value)}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Primary Brand Color</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="color" 
                      value={brandColor} 
                      onChange={e => setBrandColor(e.target.value)}
                      style={{ width: '40px', height: '35px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }}
                    />
                    <input type="text" className="input-field" value={brandColor} onChange={e => setBrandColor(e.target.value)} style={{ flex: 1 }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h4 className="mb-4 flex items-center gap-2"><FileText size={18} /> Certificates & Awards</h4>
              <div className="flex flex-col gap-3">
                {profileCertificates.map((cert, idx) => (
                  <div key={idx} className="flex gap-3 items-center p-3 glass-panel" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div style={{ flex: 1 }}>
                      <input 
                        type="text" 
                        placeholder="Certificate Name" 
                        className="input-field mb-2"
                        value={cert.name}
                        onChange={e => {
                          const newCerts = [...profileCertificates];
                          newCerts[idx].name = e.target.value;
                          setProfileCertificates(newCerts);
                        }}
                      />
                      <input 
                        type="text" 
                        placeholder="Certificate Image URL" 
                        className="input-field"
                        value={cert.url}
                        onChange={e => {
                          const newCerts = [...profileCertificates];
                          newCerts[idx].url = e.target.value;
                          setProfileCertificates(newCerts);
                        }}
                      />
                    </div>
                    <button 
                      className="btn btn-outline" 
                      style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.2)' }}
                      onClick={() => {
                        setProfileCertificates(prev => prev.filter((_, i) => i !== idx));
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button 
                  className="btn btn-outline w-full flex items-center justify-center gap-2" 
                  onClick={() => setProfileCertificates(prev => [...prev, { name: '', url: '' }])}
                >
                  <Plus size={16} /> Add Certificate
                </button>
              </div>
            </div>

            <button className="btn btn-primary w-full p-4" onClick={handleSaveProfile}>
              Save Public Profile & Branding
            </button>
          </div>

          <div className="glass-panel p-8" style={{ width: '320px', height: 'fit-content' }}>
            <h4 className="mb-4">Profile Preview</h4>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '100px', height: '100px', borderRadius: '50%', 
                background: 'rgba(255,255,255,0.05)', margin: '0 auto 1rem',
                border: `3px solid ${brandColor}`, overflow: 'hidden'
              }}>
                {profilePic ? <img src={profilePic} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={40} style={{ margin: '30px auto' }} />}
              </div>
              <h3 style={{ marginBottom: '0.25rem' }}>{currentUser?.name}</h3>
              <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                {profileArea ? `${profileArea}, ${profileCity}` : 'Location not set'}
              </p>
              
              <div className="flex gap-2 justify-center flex-wrap mb-4">
                {profileSubjects.split(',').slice(0, 3).map((s, i) => s.trim() && (
                  <span key={i} style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '1rem' }}>
                    {s.trim()}
                  </span>
                ))}
              </div>

              <div className="p-3" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', fontSize: '0.8rem', textAlign: 'left' }}>
                <p style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', opacity: 0.8 }}>
                  {profileBio || 'No bio written yet...'}
                </p>
              </div>

              <button className="btn btn-outline w-full mt-4" style={{ fontSize: '0.75rem' }} onClick={() => navigate(`/tutor/${currentUser?.uid}`)}>
                View Live Profile <Globe size={12} style={{ marginLeft: '4px' }} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Credential Modal ── */}
      {credentialModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }}>
          <div style={{
            background: '#0D1425',
            border: '1px solid rgba(245,197,24,0.25)',
            borderRadius: '20px',
            padding: '2rem',
            maxWidth: '440px', width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎉</div>
              <h2 style={{ color: '#F0F4FF', marginBottom: '0.25rem' }}>Account Created!</h2>
              <p style={{ color: '#7A8BA8', fontSize: '0.85rem' }}>
                Share these credentials with <strong style={{ color: '#F5C518' }}>{credentialModal.name}</strong>
              </p>
            </div>
            {[
              { label: 'Email',               value: credentialModal.email,    icon: '📧' },
              { label: 'Temporary Password',   value: credentialModal.password, icon: '🔑' },
            ].map(row => (
              <div key={row.label} style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '0.75rem',
              }}>
                <p style={{ fontSize: '0.7rem', color: '#7A8BA8', margin: '0 0 0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {row.icon} {row.label}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <code style={{ fontSize: '0.95rem', color: '#F5C518', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {row.value}
                  </code>
                  <button
                    onClick={() => { navigator.clipboard.writeText(row.value); toast.success(`${row.label} copied!`); }}
                    style={{
                      background: 'rgba(245,197,24,0.1)', border: '1px solid rgba(245,197,24,0.25)',
                      color: '#F5C518', borderRadius: '6px', padding: '0.25rem 0.6rem',
                      fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0,
                    }}
                  >Copy</button>
                </div>
              </div>
            ))}
            <div style={{
              background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.5rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <span>📨</span>
              <p style={{ fontSize: '0.78rem', color: '#86EFAC', margin: 0 }}>
                A welcome email with these credentials has been sent to {credentialModal.email}
              </p>
            </div>
            <button onClick={() => setCredentialModal(null)} className="btn btn-primary w-full" style={{ fontWeight: 700 }}>
              Done ✓
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Mark as Paid inline widget ── */
function MarkPaidButton({ studentId, onMark }) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState('cash');

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#22C55E', borderRadius: '7px', padding: '0.3rem 0.8rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
      >
        ✓ Mark Paid
      </button>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
      <select
        value={method}
        onChange={e => setMethod(e.target.value)}
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#F0F4FF', borderRadius: '6px', padding: '0.25rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}
      >
        <option value="cash">💵 Cash</option>
        <option value="digital">💳 Digital / UPI</option>
      </select>
      <button
        onClick={() => { onMark(studentId, method); setOpen(false); }}
        style={{ background: '#22C55E', border: 'none', color: '#07090F', borderRadius: '6px', padding: '0.3rem 0.7rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
      >
        Confirm
      </button>
      <button
        onClick={() => setOpen(false)}
        style={{ background: 'transparent', border: 'none', color: '#7A8BA8', fontSize: '0.75rem', cursor: 'pointer' }}
      >
        ✕
      </button>
    </div>
  );
}

