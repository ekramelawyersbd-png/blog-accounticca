import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { OperationType, handleFirestoreError } from './calculationReportFirestoreService';

export interface TrainingAdmissionRecord {
  id: string;
  applicantName: string;
  email: string;
  phone: string;
  courseId: string;
  courseName: string;
  qualification: string;
  experience: string;
  motivation?: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  approvedAt?: string | null;
  sheetSynced?: boolean;
  sheetSyncedAt?: string | null;
}

const COLLECTION_NAME = 'training_admissions';
const LOCAL_STORAGE_KEY = 'elaw_training_admissions';

export async function saveTrainingAdmissionToFirestore(
  record: Partial<TrainingAdmissionRecord>
): Promise<TrainingAdmissionRecord> {
  const admissionId = record.id || `ADMS-${Date.now()}`;
  const appliedAt = record.appliedAt || new Date().toISOString();

  const finalRecord: TrainingAdmissionRecord = {
    id: admissionId,
    applicantName: (record.applicantName || 'Valued Applicant').trim(),
    email: (record.email || '').trim().toLowerCase(),
    phone: (record.phone || '').trim(),
    courseId: record.courseId || 'course-400',
    courseName: record.courseName || 'Practical Income Tax & VAT Management',
    qualification: record.qualification || 'Graduate / Professional',
    experience: record.experience || '0-2 Years',
    motivation: record.motivation || '',
    status: record.status || 'pending',
    appliedAt,
    approvedAt: record.approvedAt || null,
    sheetSynced: Boolean(record.sheetSynced),
    sheetSyncedAt: record.sheetSyncedAt || null,
  };

  // 1. Cache to local storage
  try {
    const local = getLocalTrainingAdmissions();
    const existingIdx = local.findIndex((l) => l.id === admissionId || (l.email === finalRecord.email && l.courseId === finalRecord.courseId));
    if (existingIdx >= 0) {
      local[existingIdx] = finalRecord;
    } else {
      local.unshift(finalRecord);
    }
    if (local.length > 300) local.length = 300;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(local));
  } catch (err) {
    console.warn('[TrainingAdmission] LocalStorage cache notice:', err);
  }

  // 2. Persist to Firestore
  try {
    const docRef = doc(db, COLLECTION_NAME, admissionId);
    await setDoc(docRef, finalRecord, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${COLLECTION_NAME}/${admissionId}`);
  }

  // 3. Dispatch browser event
  try {
    window.dispatchEvent(
      new CustomEvent('training_admission_saved', { detail: finalRecord })
    );
  } catch {}

  return finalRecord;
}

export function getLocalTrainingAdmissions(): TrainingAdmissionRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function fetchTrainingAdmissionsFromFirestore(
  maxLimit: number = 200
): Promise<TrainingAdmissionRecord[]> {
  const mergedMap = new Map<string, TrainingAdmissionRecord>();

  getLocalTrainingAdmissions().forEach((item) => {
    mergedMap.set(item.id, item);
  });

  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('appliedAt', 'desc'), limit(maxLimit));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as TrainingAdmissionRecord;
      mergedMap.set(data.id || docSnap.id, { ...data, id: docSnap.id });
    });
  } catch (err) {
    console.warn('[TrainingAdmission] Firestore fetch warning (using local fallback):', err);
  }

  return Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
  );
}

export function subscribeTrainingAdmissions(
  callback: (admissions: TrainingAdmissionRecord[]) => void
): () => void {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('appliedAt', 'desc'), limit(200));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: TrainingAdmissionRecord[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...(docSnap.data() as TrainingAdmissionRecord), id: docSnap.id });
        });
        if (list.length > 0) {
          callback(list);
        }
      },
      (error) => {
        console.warn('[TrainingAdmission] Snapshot listener warning:', error);
      }
    );
    return unsubscribe;
  } catch {
    return () => {};
  }
}

export async function updateTrainingAdmissionStatus(
  admissionId: string,
  status: 'pending' | 'approved' | 'rejected'
): Promise<void> {
  const approvedAt = status === 'approved' ? new Date().toISOString() : null;

  // Update local
  try {
    const local = getLocalTrainingAdmissions();
    const idx = local.findIndex((l) => l.id === admissionId);
    if (idx >= 0) {
      local[idx] = { ...local[idx], status, approvedAt };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(local));
    }
  } catch {}

  // Update Firestore
  try {
    const docRef = doc(db, COLLECTION_NAME, admissionId);
    await setDoc(docRef, { status, approvedAt }, { merge: true });

    // If approved, grant course access in userCourses collection
    if (status === 'approved') {
      const local = getLocalTrainingAdmissions();
      const rec = local.find((l) => l.id === admissionId);
      if (rec && rec.email && rec.courseId) {
        await grantUserCourseAccess(rec.email, rec.courseId, rec.courseName);
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${admissionId}`);
  }

  try {
    window.dispatchEvent(
      new CustomEvent('training_admission_status_updated', { detail: { id: admissionId, status, approvedAt } })
    );
  } catch {}
}

/**
 * Grants user access to a specific course by writing to the 'userCourses' Firestore collection.
 */
export async function grantUserCourseAccess(
  email: string,
  courseId: string,
  courseName: string
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const docId = `${normalizedEmail}_${courseId}`.replace(/[^a-zA-Z0-9_]/g, '_');
  const record = {
    id: docId,
    email: normalizedEmail,
    courseId,
    courseName,
    grantedAt: new Date().toISOString(),
    status: 'active',
  };

  try {
    const docRef = doc(db, 'userCourses', docId);
    await setDoc(docRef, record, { merge: true });
  } catch (err) {
    console.warn('[UserCourses] Firestore write notice:', err);
  }

  // Local storage cache
  try {
    const key = `elaw_user_courses_${normalizedEmail}`;
    const raw = localStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    if (!list.some((c: any) => c.courseId === courseId)) {
      list.push(record);
      localStorage.setItem(key, JSON.stringify(list));
    }
  } catch {}
}

/**
 * Checks if a user has access to a specific course in 'userCourses'.
 */
export async function verifyUserCourseAccess(
  email: string,
  courseId: string
): Promise<boolean> {
  if (!email || !courseId) return false;
  const normalizedEmail = email.trim().toLowerCase();

  // Check local cache first
  try {
    const key = `elaw_user_courses_${normalizedEmail}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const list = JSON.parse(raw);
      if (list.some((c: any) => c.courseId === courseId && c.status === 'active')) {
        return true;
      }
    }
  } catch {}

  // Check Firestore userCourses collection
  try {
    const docId = `${normalizedEmail}_${courseId}`.replace(/[^a-zA-Z0-9_]/g, '_');
    const q = query(collection(db, 'userCourses'));
    const snapshot = await getDocs(q);
    let hasAccess = false;
    snapshot.forEach((d) => {
      const data = d.data();
      if (
        data.email?.toLowerCase() === normalizedEmail &&
        data.courseId === courseId &&
        data.status === 'active'
      ) {
        hasAccess = true;
      }
    });
    return hasAccess;
  } catch {
    return false;
  }
}
