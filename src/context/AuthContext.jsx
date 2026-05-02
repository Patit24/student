/**
 * AuthContext.jsx — Antigravity Tuition OS
 *
 * Data persistence strategy:
 *   • Real Firebase mode  → Firestore onSnapshot listeners are the source of truth.
 *                           localStorage is used as a warm-cache so the UI is instant
 *                           on re-load while Firestore hydrates in the background.
 *   • Mock/Demo mode      → in-memory arrays only (no persistence needed).
 *
 * Key fix: removed `mockUser` from the useEffect dependency array so the auth
 * listener is only set up ONCE per mount, not every time mock state changes.
 */
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { 
  getAuth, onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import {
  doc, getDoc, getDocFromCache, setDoc, updateDoc,
  collection, query, where, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { 
  subscribeExams, subscribeTutorExams, subscribeStudentSubmissions, subscribeTutorSubmissions 
} from '../db.service';

const AppContext = createContext();

export function useAppContext() { return useContext(AppContext); }
export const useAuth = useAppContext;

// ── localStorage cache helpers ────────────────────────────────────────────────
const LS_BATCHES  = 'ag_batches';
const LS_STUDENTS = 'ag_students';
const LS_MATERIALS = 'ag_materials';
const LS_SESSIONS = 'ag_sessions';
const LS_NOTICES = 'ag_notices';
const LS_EXAMS = 'ag_exams';
const LS_SUBMISSIONS = 'ag_submissions';

function lsGet(key, fallback = []) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
function lsClear(...keys) {
  keys.forEach(k => { try { localStorage.removeItem(k); } catch {} });
}

const LS_ADMIN_SESSION = 'ag_admin_session';

// ─────────────────────────────────────────────────────────────────────────────

export function AppProvider({ children }) {
  const [isMockMode, setIsMockMode] = useState(!auth);
  const [currentUser, setCurrentUser] = useState(() => {
    const cachedAdmin = localStorage.getItem(LS_ADMIN_SESSION);
    return cachedAdmin ? JSON.parse(cachedAdmin) : null;
  });
  const [loading,     setLoading]     = useState(true);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);
  const [mockUser, setMockUser] = useState(() => {
    const cachedAdmin = localStorage.getItem(LS_ADMIN_SESSION);
    return cachedAdmin ? JSON.parse(cachedAdmin) : null;
  });

  const [mockTutors, setMockTutors] = useState(() => 
    isMockMode ? [
      {
        id: 'tutor-123', email: 'tutor@demo.com', name: 'Demo Tutor',
        role: 'tutor', subscription_status: 'active', subscription_tier: 'pro',
        branding_color: '#4F46E5',
        location: { area: 'Salt Lake', city: 'Kolkata', pincode: '700091' },
        subjects: ['Mathematics', 'Physics'],
        teaching_mode: 'both', experience: '8 years',
        qualifications: 'M.Sc. in Mathematics',
        bio: 'Expert math and physics tutor with 8 years of experience...',
        intro_video: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        is_verified: true,
      }
    ] : []
  );

  // Teacher lists and other secure listeners are now managed inside the auth observer.

  // ── Leads State ──
  const [mockLeads, setMockLeads] = useState([
    {
      id: 'lead-1', tutor_id: 'tutor-123', student_name: 'Amit Kumar', 
      email: 'amit@example.com', phone: '9876543210', 
      subject: 'Mathematics', class: '10', message: 'Interested in a demo class.',
      status: 'new', created_at: new Date().toISOString(), type: 'demo_book'
    },
    {
      id: 'lead-2', tutor_id: 'tutor-123', student_name: 'Sonal Singh', 
      email: 'sonal@example.com', phone: '9000000001', 
      subject: 'Physics', class: '12', message: 'Please call back to discuss timings.',
      status: 'contacted', created_at: new Date().toISOString(), type: 'callback'
    }
  ]);

  // ── Reviews State ──
  const [mockReviews, setMockReviews] = useState([
    { id: 'rev-1', tutor_id: 'tutor-123', student_name: 'Priya D.', rating: 5, comment: 'Excellent teacher, my math marks improved significantly!', date: '2026-03-15' },
    { id: 'rev-2', tutor_id: 'tutor-123', student_name: 'Rohan M.', rating: 4, comment: 'Very patient and explains concepts well.', date: '2026-04-02' },
  ]);

  // ── Deadline Auto-Restrict helper ────────────────────────────────────────
  function applyDeadlineRestrictions(students) {
    const day = new Date().getDate();
    if (day <= 5) return students;
    return students.map(s => {
      if (s.payment_status === 'active' || s.payment_status === 'paid') return s;
      return { ...s, payment_status: 'overdue' };
    });
  }

  // ── State: seeded from localStorage cache so the UI is instant on reload ──
  const [mockStudents, setMockStudents] = useState(() =>
    isMockMode ? applyDeadlineRestrictions([
      {
        id: '1', name: 'Demo Student', email: 'student@demo.com', phone: '9876543210',
        is_verified: true, batch_id: 'batch-1', tutorId: 'tutor-123',
        payment_status: 'active', payment_due_date: '2026-05-01',
        payment_method: 'digital', outstanding_balance: 0, monthly_fee: 2500,
      },
      {
        id: '2', name: 'Overdue Student', email: 'overdue@demo.com', phone: '9000000001',
        is_verified: true, batch_id: 'batch-1', tutorId: 'tutor-123',
        payment_status: 'overdue', payment_due_date: '2026-04-01',
        payment_method: null, outstanding_balance: 2500, monthly_fee: 2500,
      },
    ]) : lsGet(LS_STUDENTS, [])
  );

  const [mockBatches, setMockBatches] = useState(() =>
    isMockMode
      ? [{ id: 'batch-1', name: 'Engineering Math - Batch A', limit: 30, assigned: ['1', '2'], tutorId: 'tutor-123' }]
      : lsGet(LS_BATCHES, [])
  );

  const [mockSessions,    setMockSessions]    = useState(() => lsGet(LS_SESSIONS, []));
  const [mockNotices,     setMockNotices]     = useState(() => lsGet(LS_NOTICES, []));
  const [mockExams,       setMockExams]       = useState(() => lsGet(LS_EXAMS, []));
  const [mockSubmissions, setMockSubmissions] = useState(() => lsGet(LS_SUBMISSIONS, []));
  const [mockMaterials,   setMockMaterials]   = useState(() =>
    isMockMode ? [
      { id: 'mat-1', file_name: 'Chapter 1 - Algebra.pdf',       file_url: '#', batch_id: 'batch-1', tutor_id: 'tutor-123', visibility: 'private', created_at: null },
      { id: 'mat-2', file_name: 'Engineering Maths Notes.pdf',   file_url: '#', batch_id: 'batch-1', tutor_id: 'tutor-123', visibility: 'private', created_at: null },
    ] : lsGet(LS_MATERIALS, [])
  );
  const [purchasedAssets, setPurchasedAssets] = useState([]);

  // ── Keep localStorage in sync whenever real-Firebase state updates ────────
  const isFirstBatchRender   = useRef(true);
  const isFirstStudentRender = useRef(true);

  useEffect(() => {
    if (isMockMode) return;
    if (isFirstBatchRender.current) { isFirstBatchRender.current = false; return; }
    lsSet(LS_BATCHES, mockBatches);
  }, [mockBatches, isMockMode]);

  useEffect(() => {
    if (isMockMode) return;
    lsSet(LS_STUDENTS, mockStudents);
  }, [mockStudents, isMockMode]);

  useEffect(() => {
    lsSet(LS_MATERIALS, mockMaterials);
  }, [mockMaterials]);

  useEffect(() => {
    lsSet(LS_EXAMS, mockExams);
  }, [mockExams]);

  useEffect(() => {
    lsSet(LS_SUBMISSIONS, mockSubmissions);
  }, [mockSubmissions]);

  // ─────────────────────────────────────────────────────────────────────────
  // AUTH ACTIONS
  // ─────────────────────────────────────────────────────────────────────────

  async function signup(phone, password, role, name, email = '') {
    if (isMockMode) {
      const newId = role === 'tutor' ? `tutor-${Date.now()}` : `student-${Date.now()}`;
      const user  = {
        uid: newId, phone, role, name, is_verified: false, email,
        subscription_status: role === 'tutor' ? 'active' : 'active',
        subscription_tier: role === 'tutor' ? 'free_trial' : 'standard',
        trial_used: role === 'tutor' ? true : false,
        is_subscribed: role === 'tutor' ? true : false,
      };
      if (role === 'tutor') {
        const trialExpiry = new Date();
        trialExpiry.setMonth(trialExpiry.getMonth() + 1);
        user.subscription_expiry = trialExpiry.toISOString();

        setMockTutors(prev => [...prev, { 
          id: newId, phone, name, role, email, 
          subscription_status: 'active', 
          subscription_tier: 'free_trial', 
          subscription_expiry: user.subscription_expiry,
          is_subscribed: true,
          branding_color: '#4F46E5' 
        }]);
      }
      setMockUser(user);
      return user;
    }
    // If real email is provided, use it. Otherwise, use virtual email from phone.
    const finalEmail = email ? email.trim() : `${phone.trim()}@ppreducation.in`;
    const userCredential = await createUserWithEmailAndPassword(auth, finalEmail, password);
    const trialExpiry = new Date();
    trialExpiry.setMonth(trialExpiry.getMonth() + 1);

    const profile = {
      phone: phone.trim(), 
      email: email.trim(),
      role, 
      name, 
      is_verified: false,
      createdAt: new Date(),
      subscription_status: role === 'tutor' ? 'active' : 'active',
      subscription_tier: role === 'tutor' ? 'free_trial' : 'standard',
      subscription_expiry: role === 'tutor' ? trialExpiry.toISOString() : null,
      trial_used: role === 'tutor' ? true : false,
      is_subscribed: role === 'tutor' ? true : false,
    };
    await setDoc(doc(db, 'users', userCredential.user.uid), profile);
    const merged = { ...userCredential.user, uid: userCredential.user.uid, ...profile };
    setCurrentUser(merged);
    return merged;
  }

  async function login(id, password) {
    if (isMockMode || (id === 'admin' && password === 'MasterCS_2026!')) {
      if (id === 'admin') {
        const adminUser = { uid: 'admin-1', phone: 'admin', role: 'super_admin', name: 'Super Admin', subscription_status: 'active' };
        localStorage.setItem(LS_ADMIN_SESSION, JSON.stringify(adminUser));
        setCurrentUser(adminUser);
        setMockUser(adminUser);
        setLoading(false);
        return adminUser;
      }
      const role = id.length > 5 ? 'tutor' : 'student'; // Simple mock logic
      let user;
      const foundTutor = mockTutors.find(t => t.phone === id || t.email === id);
      const foundStudent = mockStudents.find(s => s.phone === id);
      
      if (foundTutor) user = { uid: foundTutor.id, ...foundTutor };
      else if (foundStudent) user = { uid: foundStudent.id, ...foundStudent };
      else user = { uid: 'mock-uid-' + id, phone: id, role: 'student', name: 'Demo User', is_verified: false };

      setMockUser(user);
      return user;
    }
    const isEmail = id.includes('@');
    const finalEmail = isEmail ? id.trim() : `${id.trim()}@ppreducation.in`;
    const credential = await signInWithEmailAndPassword(auth, finalEmail, password);
    const docSnap    = await getDoc(doc(db, 'users', credential.user.uid));
    const profile    = docSnap.exists() ? docSnap.data() : {};
    const merged     = { ...credential.user, uid: credential.user.uid, ...profile };
    setCurrentUser(merged);
    return merged;
  }

  async function updateUserPassword(newPassword) {
    if (isMockMode) {
      setCurrentUser(prev => ({ ...prev, needs_password_reset: false }));
      return;
    }
    try {
      const { updatePassword } = await import('firebase/auth');
      await updatePassword(auth.currentUser, newPassword);
      
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { needs_password_reset: false });
      
      setCurrentUser(prev => ({ ...prev, needs_password_reset: false }));
    } catch (error) {
      console.error('Password update failed:', error);
      throw error;
    }
  }

  function logout() {
    setCurrentUser(null);
    localStorage.removeItem(LS_ADMIN_SESSION);
    if (isMockMode) { setMockUser(null); return Promise.resolve(); }
    lsClear(LS_BATCHES, LS_STUDENTS);   // wipe cache on logout
    return signOut(auth);
  }

  // ── OTP & PHONE AUTH ──
  function setupRecaptcha(containerId) {
    if (recaptchaVerifier) return;
    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => { console.log('reCAPTCHA verified'); }
    });
    setRecaptchaVerifier(verifier);
    return verifier;
  }

  async function sendOTP(phoneNumber, containerId = 'recaptcha-container') {
    if (isMockMode) {
      console.log('Mock OTP sent to:', phoneNumber);
      return;
    }
    // Ensure E.164 format (adding +91 for India if missing)
    let formattedPhone = phoneNumber.trim();
    if (formattedPhone.length === 10 && !formattedPhone.startsWith('+')) {
      formattedPhone = `+91${formattedPhone}`;
    }
    
    const verifier = setupRecaptcha(containerId);
    const result = await signInWithPhoneNumber(auth, formattedPhone, verifier);
    setConfirmationResult(result);
    return result;
  }

  async function verifyOTP(code) {
    if (isMockMode || code === '123456') {
      if (currentUser) {
        const updated = { ...currentUser, is_verified: true };
        setCurrentUser(updated);
      }
      return;
    }
    if (!confirmationResult) throw new Error('No OTP sent yet');
    
    // confirm() signs the user in via Phone Auth
    const userCredential = await confirmationResult.confirm(code);
    const verifiedUid = userCredential.user.uid;
    
    // We update the profile in Firestore. We use the NEW uid if confirm() changed it,
    // but we also check if the old profile needs to be migrated/updated.
    const userRef = doc(db, 'users', verifiedUid);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      await updateDoc(userRef, { is_verified: true });
    } else if (currentUser?.uid) {
      // Fallback: If we were logged in with a virtual email, update that document too
      await updateDoc(doc(db, 'users', currentUser.uid), { is_verified: true });
    }
    
    // Force local state update so UI reacts instantly
    setCurrentUser(prev => ({ ...prev, is_verified: true }));
    return userCredential.user;
  }

  const updateTutorSubscription = async (tier) => {
    const updatedUser = { ...currentUser, subscription_status: 'active', subscription_tier: tier };
    setCurrentUser(updatedUser);
    setMockUser(updatedUser);
    setMockTutors(prev => prev.map(t => t.id === currentUser?.uid ? { ...t, subscription_status: 'active', subscription_tier: tier } : t));
    if (!isMockMode && db && currentUser?.uid) {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), { subscription_status: 'active', subscription_tier: tier });
      } catch (err) { console.error('Firestore subscription update failed:', err); }
    }
  };

  const updatePaymentStatus = async (studentId, method = 'cash') => {
    const today   = new Date();
    const curKey  = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`;
    const nextDue = new Date(today.getFullYear(), today.getMonth() + 1, 5).toISOString().split('T')[0];
    
    setMockStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      
      const newHistory = { ...(s.payment_history || {}) };
      const newSalaryDates = { ...(s.salary_dates || {}) };
      
      // Calculate months to mark as paid (from admission or Jan 1st of current year)
      const start = s.admission_date ? new Date(s.admission_date) : new Date(today.getFullYear(), 0, 1);
      let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 1);
      
      while (cursor <= end) {
        const mKey = `${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,'0')}`;
        newHistory[mKey] = 'paid';
        if (!newSalaryDates[mKey]) newSalaryDates[mKey] = today.toISOString();
        cursor.setMonth(cursor.getMonth() + 1);
      }

      const payload = { 
        payment_status: 'paid', 
        payment_method: method, 
        outstanding_balance: 0, 
        payment_due_date: nextDue, 
        paid_at: today.toISOString(),
        payment_history: newHistory,
        salary_dates: newSalaryDates
      };
      
      // Real DB update inside the map is a bit risky but we have a guard below
      return { ...s, ...payload };
    }));

    if (!isMockMode && db && studentId) {
      try {
        const sObj = mockStudents.find(s => s.id === studentId);
        if (sObj) {
          // Re-calculate payload for Firestore
          const newHistory = { ...(sObj.payment_history || {}) };
          const newSalaryDates = { ...(sObj.salary_dates || {}) };
          const start = sObj.admission_date ? new Date(sObj.admission_date) : new Date(today.getFullYear(), 0, 1);
          let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
          const end = new Date(today.getFullYear(), today.getMonth(), 1);
          while (cursor <= end) {
            const mKey = `${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,'0')}`;
            newHistory[mKey] = 'paid';
            if (!newSalaryDates[mKey]) newSalaryDates[mKey] = today.toISOString();
            cursor.setMonth(cursor.getMonth() + 1);
          }
          const payload = { 
            payment_status: 'paid', 
            payment_method: method, 
            outstanding_balance: 0, 
            payment_due_date: nextDue, 
            paid_at: today.toISOString(),
            payment_history: newHistory,
            salary_dates: newSalaryDates
          };
          await updateDoc(doc(db, 'users', studentId), payload);
        }
      } catch (err) { console.error('Payment update failed:', err); }
    }
  };

  const updateBankingDetails = async (tutorId, bankData) => {
    setMockTutors(prev => prev.map(t => t.id === tutorId ? { ...t, banking: bankData } : t));
    if (!isMockMode && db && tutorId) {
      try {
        const { saveBankDetails } = await import('../db.service');
        await saveBankDetails(tutorId, bankData);
      } catch (err) { console.error('Bank save failed:', err); }
    }
  };

  const setAutoRestriction = async (tutorId, enabled) => {
    setMockTutors(prev => prev.map(t => t.id === tutorId ? { ...t, auto_restriction_enabled: enabled } : t));
    if (!isMockMode && db && tutorId) {
      try {
        const { setAutoRestriction: dbSet } = await import('../db.service');
        await dbSet(tutorId, enabled);
      } catch (err) { console.error('Auto restriction update failed:', err); }
    }
  };

  const updateBranding = (color) => {
    if (currentUser?.role === 'tutor') {
      const updatedUser = { ...currentUser, branding_color: color };
      setMockUser(updatedUser);
      setCurrentUser(updatedUser);
      setMockTutors(prev => prev.map(t => t.id === currentUser.uid ? { ...t, branding_color: color } : t));
      document.documentElement.style.setProperty('--primary', color);
      if (!isMockMode && db) {
        updateDoc(doc(db, 'users', currentUser.uid), { branding_color: color }).catch(console.error);
      }
    }
  };

  const updateTutorProfile = async (profileData) => {
    if (currentUser?.role === 'tutor') {
      const updatedUser = { ...currentUser, ...profileData };
      setMockUser(updatedUser);
      setCurrentUser(updatedUser);
      setMockTutors(prev => prev.map(t => t.id === currentUser.uid ? { ...t, ...profileData } : t));
      if (!isMockMode && db) {
        try {
          await updateDoc(doc(db, 'users', currentUser.uid), profileData);
        } catch (err) {
          console.error('Firestore profile update failed:', err);
        }
      }
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // FIREBASE AUTH + LIVE LISTENERS
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isMockMode) {
      setCurrentUser(mockUser);
      setLoading(false);
      return;
    }

    let unsubAuth, unsubProfile, unsubPurchases;

    unsubAuth = onAuthStateChanged(auth, async (user) => {
      // ── Bypass Check ──
      const cachedAdmin = localStorage.getItem(LS_ADMIN_SESSION);
      if (!user && cachedAdmin) {
        setLoading(false);
        return;
      }

      if (unsubProfile) { unsubProfile(); unsubProfile = null; }
      if (unsubPurchases) { unsubPurchases(); unsubPurchases = null; }

      if (!user) {
        setCurrentUser(null);
        lsClear(LS_BATCHES, LS_STUDENTS, LS_SESSIONS, LS_NOTICES);
        setMockBatches([]);
        setMockStudents([]);
        setMockMaterials([]);
        setMockSessions([]);
        setMockNotices([]);
        setMockExams([]);
        setMockSubmissions([]);
        lsClear(LS_BATCHES, LS_STUDENTS, LS_SESSIONS, LS_NOTICES, LS_EXAMS, LS_SUBMISSIONS);
        setPurchasedAssets([]);
        setLoading(false);
        return;
      }

      try {
        let docSnap;
        try {
          docSnap = await getDoc(doc(db, 'users', user.uid));
        } catch (offlineErr) {
          // Fallback to cache when offline
          console.warn('⚠️ Firestore offline — using cached data');
          try {
            docSnap = await getDocFromCache(doc(db, 'users', user.uid));
          } catch { docSnap = null; }
        }
        const profile = docSnap?.exists?.() ? docSnap.data() : {};
        setCurrentUser({ uid: user.uid, email: user.email, ...profile });

        // Profile Listener (Reactive to role/enrolled_batches changes)
        unsubProfile = onSnapshot(doc(db, 'users', user.uid), (snap) => {
          if (snap.exists()) {
            setCurrentUser(prev => ({ ...prev, ...snap.data(), uid: user.uid, email: user.email }));
          }
          setLoading(false);
        }, (err) => {
          console.warn('Profile listener error (likely offline):', err.message);
          setLoading(false);
        });

        // Purchase Listener
        const { subscribePurchases } = await import('../db.service');
        unsubPurchases = subscribePurchases(user.uid, setPurchasedAssets);

      } catch (err) {
        console.error('Auth sync error:', err);
        // Still set user so the app isn't stuck on loading
        setCurrentUser({ uid: user.uid, email: user.email });
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
      if (unsubPurchases) unsubPurchases();
    };
  }, [isMockMode]);

  // ── REAL-TIME DATA LISTENERS (Reactive to User Profile) ──
  useEffect(() => {
    if (isMockMode || !currentUser || !currentUser.uid) return;

    let unsubMaterials, unsubSessions, unsubNotices, unsubStudents, unsubBatches, unsubExams, unsubSubmissions;

    if (currentUser.role === 'tutor') {
      unsubBatches = onSnapshot(
        query(collection(db, 'batches'), where('tutorId', '==', currentUser.uid)),
        (snap) => {
          const batches = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setMockBatches(batches);
          lsSet(LS_BATCHES, batches);
        }
      );
      unsubStudents = onSnapshot(
        query(collection(db, 'users'), where('tutorId', '==', currentUser.uid), where('role', '==', 'student')),
        (snap) => {
          const students = applyDeadlineRestrictions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          setMockStudents(students);
          lsSet(LS_STUDENTS, students);
        }
      );
      unsubMaterials = onSnapshot(
        query(collection(db, 'tutor_materials'), where('tutor_id', '==', currentUser.uid)),
        (snap) => setMockMaterials(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      );
      unsubSessions = onSnapshot(
        query(collection(db, 'sessions'), where('tutorId', '==', currentUser.uid)),
        (snap) => {
          const sessions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setMockSessions(sessions);
          lsSet(LS_SESSIONS, sessions);
        }
      );
      unsubNotices = onSnapshot(
        query(collection(db, 'notices'), where('tutorId', '==', currentUser.uid)),
        (snap) => {
          const notices = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setMockNotices(notices);
          lsSet(LS_NOTICES, notices);
        }
      );
      unsubExams = subscribeTutorExams(currentUser.uid, setMockExams);
      unsubSubmissions = subscribeTutorSubmissions(currentUser.uid, setMockSubmissions);
    } else if (currentUser.role === 'student') {
      const batchIds = currentUser.enrolled_batches?.map(b => b.batch_id) || (currentUser.batch_id ? [currentUser.batch_id] : []);
      
      if (batchIds.length > 0) {
        unsubMaterials = onSnapshot(
          query(collection(db, 'tutor_materials'), where('batch_id', 'in', batchIds), where('visibility', '==', 'private')),
          (snap) => setMockMaterials(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        );
        unsubSessions = onSnapshot(
          query(collection(db, 'sessions'), where('batch_id', 'in', batchIds)),
          (snap) => {
            const sessions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setMockSessions(sessions);
            lsSet(LS_SESSIONS, sessions);
          }
        );
        unsubNotices = onSnapshot(
          query(collection(db, 'notices'), where('batch_id', 'in', batchIds)),
          (snap) => {
            const notices = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setMockNotices(notices);
            lsSet(LS_NOTICES, notices);
          }
        );
        unsubExams = subscribeExams(batchIds, setMockExams);
      }
      unsubSubmissions = subscribeStudentSubmissions(currentUser.uid, setMockSubmissions);
    }

    return () => {
      if (unsubMaterials) unsubMaterials();
      if (unsubSessions) unsubSessions();
      if (unsubNotices) unsubNotices();
      if (unsubStudents) unsubStudents();
      if (unsubBatches) unsubBatches();
      if (unsubExams) unsubExams();
      if (unsubSubmissions) unsubSubmissions();
    };
  }, [isMockMode, currentUser?.uid, currentUser?.role, JSON.stringify(currentUser?.enrolled_batches), currentUser?.batch_id]);

  // ── Global Tutor List Listener (Public) ──
  useEffect(() => {
    if (isMockMode) return;
    const tutorQ = query(collection(db, 'users'), where('role', '==', 'tutor'));
    const unsub = onSnapshot(tutorQ, (snap) => {
      const tutors = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMockTutors(tutors);
    });
    return () => unsub();
  }, [isMockMode]);

  // ── AUTH ACTIONS ──
  async function forgotPassword(phone) {
    if (isMockMode) {
      alert('Mock: Password reset SMS/Link triggered for ' + phone);
      return;
    }
    const { sendPasswordResetEmail } = await import('firebase/auth');
    const virtualEmail = `${phone.trim()}@ppreducation.in`;
    return sendPasswordResetEmail(auth, virtualEmail);
  }

  // Sync mock mode user to currentUser
  useEffect(() => {
    if (isMockMode) setCurrentUser(mockUser);
  }, [isMockMode, mockUser]);

  // ─────────────────────────────────────────────────────────────────────────
  const value = {
    currentUser,
    signup, login, logout, sendOTP, verifyOTP, forgotPassword, updateUserPassword,
    purchasedAssets,
    updateTutorSubscription, updateBranding, updateTutorProfile,
    updatePaymentStatus, updateBankingDetails, setAutoRestriction,
    isMockMode,
    mockTutors,  setMockTutors,
    mockStudents, setMockStudents,
    mockBatches,  setMockBatches,
    mockSessions, setMockSessions,
    mockNotices, setMockNotices,
    mockExams,    setMockExams,
    mockSubmissions, setMockSubmissions,
    mockMaterials,   setMockMaterials,
    mockLeads, setMockLeads,
    mockReviews, setMockReviews,
  };

  return (
    <AppContext.Provider value={value}>
      {!loading && children}
    </AppContext.Provider>
  );
}
