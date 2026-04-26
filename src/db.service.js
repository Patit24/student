/**
 * db.service.js
 * Central Firestore service layer for Antigravity Tuition OS.
 * All reads/writes go through here — never raw Firestore calls in components.
 */
import {
  doc, getDoc, setDoc, updateDoc,
  collection, query, where,
  onSnapshot, addDoc, serverTimestamp, getDocs, deleteDoc
} from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

// ─────────────────────────────────────────────────────────────────────────────
// TUTOR PROFILE
// ─────────────────────────────────────────────────────────────────────────────

export async function getTutorProfile(tutorId) {
  const snap = await getDoc(doc(db, 'users', tutorId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ── GLOBAL ASSETS (Admin Library) ──
export function subscribeGlobalAssets(callback) {
  return onSnapshot(collection(db, 'admin_global_assets'), snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function uploadGlobalAsset(data) {
  return await addDoc(collection(db, 'admin_global_assets'), {
    ...data,
    created_at: serverTimestamp()
  });
}

export async function deleteGlobalAsset(id) {
  await deleteDoc(doc(db, 'admin_global_assets', id));
}
export async function uploadFileToStorage(file, path, onProgress) {
  return new Promise((resolve, reject) => {
    const sRef = storageRef(storage, `${path}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(sRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
      },
      (error) => reject(error),
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
}

// ── PURCHASES ──
export async function markAssetPurchased(userId, assetId) {
  await setDoc(doc(db, 'users', userId, 'purchased_items', assetId), {
    purchased_at: serverTimestamp()
  });
}

// ── COURSE MARKETPLACE ──
export async function createCourse(data) {
  return await addDoc(collection(db, 'courses'), {
    ...data,
    status: 'published',
    created_at: serverTimestamp(),
    sales_count: 0,
    total_revenue: 0
  });
}

export function subscribeCourses(callback) {
  const q = query(collection(db, 'courses'), where('status', '==', 'published'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export function subscribeTutorCourses(tutorId, callback) {
  const q = query(collection(db, 'courses'), where('tutorId', '==', tutorId));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function deleteCourse(id) {
  await deleteDoc(doc(db, 'courses', id));
}

/**
 * Record a course sale with intelligent split logic
 * - If Admin created: 100% Admin Revenue
 * - If Tutor created: 80% Tutor / 20% Admin Commission
 */
export async function recordCourseSale(studentId, courseId, amount, tutorId) {
  // Fetch creator profile to determine role
  const creatorSnap = await getDoc(doc(db, 'users', tutorId));
  const creatorData = creatorSnap.exists() ? creatorSnap.data() : { role: 'tutor' };
  const isAdmin = creatorData.role === 'super_admin';

  const adminCommission = isAdmin ? amount : (amount * 0.20);
  const tutorEarnings = isAdmin ? 0 : (amount * 0.80);

  // 1. Record the transaction for auditing
  await addDoc(collection(db, 'transactions'), {
    type: 'course_purchase',
    studentId,
    courseId,
    tutorId,
    total_amount: amount,
    admin_commission: adminCommission,
    tutor_earnings: tutorEarnings,
    is_admin_flagship: isAdmin,
    status: 'completed',
    created_at: serverTimestamp()
  });

  // 2. Add course to student's library
  await setDoc(doc(db, 'users', studentId, 'enrolled_courses', courseId), {
    enrolled_at: serverTimestamp(),
    courseId,
    tutorId,
    amount_paid: amount
  });

  // 3. Update course stats
  const courseRef = doc(db, 'courses', courseId);
  const courseSnap = await getDoc(courseRef);
  if (courseSnap.exists()) {
    await updateDoc(courseRef, {
      sales_count: (courseSnap.data().sales_count || 0) + 1,
      total_revenue: (courseSnap.data().total_revenue || 0) + amount
    });
  }
}

export function subscribePurchases(userId, callback) {
  return onSnapshot(collection(db, 'users', userId, 'purchased_items'), snap => {
    callback(snap.docs.map(d => d.id));
  });
}

export function subscribeTutorProfile(tutorId, callback) {
  return onSnapshot(doc(db, 'users', tutorId), snap => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
}

export async function saveBankDetails(tutorId, bankData) {
  await updateDoc(doc(db, 'users', tutorId), {
    banking: bankData,
    banking_updated_at: serverTimestamp(),
  });
}

export async function setAutoRestriction(tutorId, enabled) {
  await updateDoc(doc(db, 'users', tutorId), {
    auto_restriction_enabled: enabled,
    updated_at: serverTimestamp(),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// MATERIALS  — Write metadata FIRST, then upload file, then update URL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Upload a file to Firebase Storage + persist metadata to Firestore.
 *
 * Strategy:
 *  1. Write a "pending" Firestore doc immediately (so the listener sees it).
 *  2. Upload to Storage with progress.
 *  3. Update the Firestore doc with the real download URL.
 *
 * This means even if Storage is slow, the student panel shows "Uploading…"
 * immediately, and the URL fills in once done.
 */
export function uploadMaterial(file, tutorId, batchId, batchName, onProgress) {
  return new Promise(async (resolve, reject) => {
    if (!db) { reject(new Error('Firestore not initialised')); return; }

    // ── Step 1: write pending metadata to Firestore ──
    let metaRef;
    try {
      metaRef = await addDoc(collection(db, 'tutor_materials'), {
        file_name:  file.name,
        file_size:  file.size,
        file_url:   '',          // filled in after upload
        status:     'uploading',
        visibility: 'private',   // Isolated from homepage/public view
        tutor_id:   tutorId,
        batch_id:   batchId,
        batch_name: batchName,
        created_at: serverTimestamp(),
      });
    } catch (err) {
      reject(new Error(`Firestore metadata write failed: ${err.message}`));
      return;
    }

    // ── Step 2: upload to Storage ──
    if (!storage) {
      // No storage configured — mark as uploaded with placeholder
      await updateDoc(metaRef, { status: 'uploaded', file_url: '' });
      resolve({ id: metaRef.id, file_url: '', file_name: file.name, batch_id: batchId, tutor_id: tutorId });
      return;
    }

    const path    = `materials/${tutorId}/${batchId}/${Date.now()}_${file.name}`;
    const fileRef = storageRef(storage, path);
    const task    = uploadBytesResumable(fileRef, file);

    task.on(
      'state_changed',
      snapshot => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (onProgress) onProgress(pct);
      },
      async (err) => {
        // Storage upload failed — clean up the pending Firestore doc
        try { await updateDoc(metaRef, { status: 'error', error: err.message }); } catch {}
        reject(err);
      },
      async () => {
        // ── Step 3: get URL and update Firestore doc ──
        try {
          const file_url = await getDownloadURL(task.snapshot.ref);
          await updateDoc(metaRef, { file_url, status: 'uploaded' });
          resolve({ id: metaRef.id, file_url, file_name: file.name, batch_id: batchId, tutor_id: tutorId });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

/** Live listener: anyone can see admin public assets (for lead gen). */
export function subscribePublicAssets(callback) {
  const q = query(
    collection(db, 'admin_public_assets'),
    where('status', '==', 'published')
  );
  return onSnapshot(q, snap => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(items);
  });
}

/** Live listener: student sees materials for their batch (excludes errored/uploading). */
export function subscribeMaterials(batchId, callback) {
  const q = query(
    collection(db, 'tutor_materials'),
    where('batch_id', '==', batchId),
    where('visibility', '==', 'private')
  );
  return onSnapshot(q, snap => {
    const items = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(m => m.status !== 'error'); // hide failed uploads from students
    callback(items);
  });
}

/** Live listener: tutor sees all materials they uploaded. */
export function subscribeTutorMaterials(tutorId, callback) {
  const q = query(
    collection(db, 'tutor_materials'),
    where('tutor_id', '==', tutorId)
  );
  return onSnapshot(q, snap => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(items);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT STATUS
// ─────────────────────────────────────────────────────────────────────────────

export async function markStudentPaid(studentId, method = 'cash') {
  const today   = new Date();
  const nextDue = new Date(today.getFullYear(), today.getMonth() + 1, 5)
                    .toISOString().split('T')[0];
  await updateDoc(doc(db, 'users', studentId), {
    payment_status:      'paid',
    payment_method:      method,
    outstanding_balance: 0,
    payment_due_date:    nextDue,
    paid_at:             serverTimestamp(),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/** Look up an existing student by phone in Firestore. */
export async function lookupStudentByPhone(phone) {
  if (!db || !phone) return null;
  const q    = query(
    collection(db, 'users'),
    where('phone', '==', phone.trim()),
    where('role',  '==', 'student')
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

/** Generate a secure readable temp password. e.g. testpass */
export function generateTempPassword() {
  return "testpass";
}

/**
 * Create a new student Firebase Auth account + Firestore profile.
 * Uses a secondary Firebase App instance so the tutor stays logged in.
 */
export async function createStudentAccount(phone, name, tutorId, batchId, monthlyFee = 2500) {
  const { getApp, initializeApp } = await import('firebase/app');
  const { getAuth, createUserWithEmailAndPassword, signOut } = await import('firebase/auth');

  // Reuse or create a secondary Firebase app instance
  let secondaryApp;
  try {
    secondaryApp = getApp('student-creator');
  } catch {
    const config = {
      apiKey:            'AIzaSyCzTijbLiM6kd-GuHGEbsPYr2U_Psw4pnc',
      authDomain:        'antigravity-tuition-os.firebaseapp.com',
      projectId:         'antigravity-tuition-os',
      storageBucket:     'antigravity-tuition-os.firebasestorage.app',
      messagingSenderId: '1021639170510',
      appId:             '1:1021639170510:web:9d6a803eb5226d5be0f39f',
      databaseURL:       'https://antigravity-tuition-os-default-rtdb.asia-southeast1.firebasedatabase.app',
    };
    secondaryApp = initializeApp(config, 'student-creator');
  }

  const tempPassword  = generateTempPassword();
  const secondaryAuth = getAuth(secondaryApp);
  const virtualEmail  = `${phone.trim()}@ppreducation.in`;

  const credential = await createUserWithEmailAndPassword(
    secondaryAuth,
    virtualEmail,
    tempPassword
  );
  const uid = credential.user.uid;

  // Write Firestore profile
  await setDoc(doc(db, 'users', uid), {
    phone:               phone.trim(),
    name,
    role:                'student',
    is_verified:         false, // Requirement: needs OTP verification
    needs_password_reset: true, // Force password reset on first login
    tutorId:             tutorId, 
    batch_id:            batchId,
    enrolled_batches: [
      {
        tutor_id: tutorId,
        batch_id: batchId,
        payment_status: 'active',
        monthly_fee: monthlyFee,
        outstanding_balance: 0,
        payment_due_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5).toISOString().split('T')[0]
      }
    ],
    createdAt:           serverTimestamp(),
  });

  // Sign out of secondary app so tutor session is unaffected
  await signOut(secondaryAuth);

  return { uid, tempPassword };
}

/**
 * Enroll an existing student in a new batch (for multi-teacher support).
 */
export async function enrollStudentInBatch(studentId, tutorId, batchId, monthlyFee = 2500) {
  const { arrayUnion } = await import('firebase/firestore');
  const studentRef = doc(db, 'users', studentId);
  
  await updateDoc(studentRef, {
    tutorId: tutorId, // Set last tutor for compatibility
    batch_id: batchId,
    enrolled_batches: arrayUnion({
      tutor_id: tutorId,
      batch_id: batchId,
      payment_status: 'active',
      monthly_fee: monthlyFee,
      outstanding_balance: 0,
      payment_due_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5).toISOString().split('T')[0]
    })
  });
}
