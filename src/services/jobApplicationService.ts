import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db, auth, fallbackAuth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';

export type ApplicationStatus = 
  | 'Submitted' 
  | 'Under Review' 
  | 'Shortlisted' 
  | 'Interview Scheduled' 
  | 'Technical Assessment' 
  | 'Offer Extended' 
  | 'Withdrawn'
  | 'Archived';

export interface ApplicationTimelineEvent {
  title: string;
  date: string;
  description: string;
  completed: boolean;
  current?: boolean;
}

export interface JobApplication {
  id: string;
  userId: string;
  userEmail: string;
  jobId: string;
  jobTitle: string;
  category: string;
  department: string;
  jobType: string;
  location: string;
  salaryRange: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  coverLetter?: string;
  appliedDate: string; // e.g. "Oct 12, 2026"
  appliedAtIso: string;
  status: ApplicationStatus;
  statusNotes?: string;
  lastUpdatedDate: string;
  referenceId: string;
  stageIndex: number; // 0 to 4
  interviewDate?: string;
  interviewTime?: string;
  interviewMode?: 'online' | 'in-person';
  interviewLink?: string;
  interviewLocation?: string;
  interviewBooked?: boolean;
  timeline: ApplicationTimelineEvent[];
}

const COLLECTION_NAME = 'jobApplications';

const getLocalStorageKey = (userId: string) => `accounticca_job_apps_${userId}`;

export function generateDefaultTimeline(status: ApplicationStatus, appliedDate: string): ApplicationTimelineEvent[] {
  const isWithdrawn = status === 'Withdrawn';
  const isOffer = status === 'Offer Extended';
  const isInterview = status === 'Interview Scheduled' || status === 'Shortlisted';
  const isReview = status === 'Under Review' || isInterview || isOffer;

  return [
    {
      title: 'Application Submitted',
      date: appliedDate,
      description: 'Application package, resume, and credentials received by E-Lawyers HR.',
      completed: true,
      current: status === 'Submitted'
    },
    {
      title: 'Initial Screening & Under Review',
      date: isReview ? appliedDate : 'Pending',
      description: 'Department Head & Lead Consultant reviewing legal and tax qualifications.',
      completed: isReview,
      current: status === 'Under Review'
    },
    {
      title: 'Shortlisted & Interview Coordination',
      date: isInterview || isOffer ? 'Scheduled' : 'Upcoming',
      description: 'Selected for technical panel and cultural assessment with Senior Partners.',
      completed: isInterview || isOffer,
      current: isInterview
    },
    {
      title: 'Evaluation & Decision',
      date: isOffer ? 'Completed' : 'Upcoming',
      description: 'Final evaluation, partner clearance, and compensation package review.',
      completed: isOffer,
      current: isOffer
    }
  ];
}

/**
 * Fetch all applications for the authenticated user from Firestore with localStorage fallback
 */
export async function fetchUserApplications(userId: string, userEmail?: string): Promise<JobApplication[]> {
  const localKey = getLocalStorageKey(userId);
  let localApps: JobApplication[] = [];

  try {
    const raw = localStorage.getItem(localKey);
    if (raw) {
      localApps = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading applications from localStorage:', e);
  }

  const firestoreUser = fallbackAuth.currentUser;
  if (!firestoreUser) {
    return localApps;
  }

  const effectiveUid = firestoreUser.uid || userId;
  try {
    const appsRef = collection(db, COLLECTION_NAME);
    const q = query(appsRef, where('userId', '==', effectiveUid));
    const snapshot = await getDocs(q);

    const cloudApps: JobApplication[] = [];
    snapshot.forEach(docSnap => {
      cloudApps.push(docSnap.data() as JobApplication);
    });

    if (cloudApps.length > 0) {
      // Sort newest first
      cloudApps.sort((a, b) => new Date(b.appliedAtIso).getTime() - new Date(a.appliedAtIso).getTime());
      
      // Update local storage cache
      try {
        localStorage.setItem(localKey, JSON.stringify(cloudApps));
      } catch (e) {
        // ignore
      }
      return cloudApps;
    }
  } catch (error) {
    console.warn('Firestore fetchUserApplications error, falling back to local cache:', error);
    try {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    } catch {
      // Non-blocking fallback
    }
  }

  // Return local storage items if cloud was empty or offline
  return localApps;
}

/**
 * Save a new job application to Firestore and localStorage
 */
export async function saveJobApplication(
  appData: Omit<JobApplication, 'id' | 'referenceId' | 'appliedDate' | 'appliedAtIso' | 'stageIndex' | 'timeline' | 'lastUpdatedDate'> & {
    id?: string;
    status?: ApplicationStatus;
    referenceId?: string;
  }
): Promise<JobApplication> {
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const isoDate = now.toISOString();
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  const docId = appData.id || `app_${now.getTime()}_${randomSuffix}`;
  const refId = appData.referenceId || `EL-2026-${randomSuffix}`;
  const initialStatus: ApplicationStatus = appData.status || 'Under Review';

  const firestoreUser = fallbackAuth.currentUser;
  const effectiveUid = firestoreUser?.uid || appData.userId;

  const fullApplication: JobApplication = {
    ...appData,
    userId: effectiveUid,
    id: docId,
    referenceId: refId,
    status: initialStatus,
    statusNotes: 'Your application is actively being screened by our recruitment committee.',
    stageIndex: initialStatus === 'Submitted' ? 0 : initialStatus === 'Under Review' ? 1 : 2,
    appliedDate: formattedDate,
    appliedAtIso: isoDate,
    lastUpdatedDate: formattedDate,
    timeline: generateDefaultTimeline(initialStatus, formattedDate)
  };

  // 1. Cache to local storage immediately
  const localKey = getLocalStorageKey(appData.userId);
  try {
    const raw = localStorage.getItem(localKey);
    const existing: JobApplication[] = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter(a => a.id !== docId);
    filtered.unshift(fullApplication);
    localStorage.setItem(localKey, JSON.stringify(filtered));
  } catch (storageErr) {
    console.warn('LocalStorage save error:', storageErr);
  }

  // 2. Persist to Firestore only if authenticated on Firestore project
  if (firestoreUser) {
    try {
      const docRef = doc(db, COLLECTION_NAME, docId);
      await setDoc(docRef, {
        ...fullApplication,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.warn('Firestore saveJobApplication error (saved locally):', error);
      try {
        handleFirestoreError(error, OperationType.WRITE, `${COLLECTION_NAME}/${docId}`);
      } catch {
        // Non-blocking fallback
      }
    }
  }

  return fullApplication;
}

/**
 * Update an existing application (e.g. interview booking or withdrawal)
 */
export async function updateJobApplication(
  id: string, 
  userId: string, 
  updates: Partial<JobApplication>
): Promise<void> {
  const localKey = getLocalStorageKey(userId);
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Update local storage
  try {
    const raw = localStorage.getItem(localKey);
    if (raw) {
      const existing: JobApplication[] = JSON.parse(raw);
      const updated = existing.map(a => {
        if (a.id === id) {
          const newStatus = updates.status || a.status;
          return {
            ...a,
            ...updates,
            lastUpdatedDate: formattedDate,
            timeline: updates.timeline || (updates.status ? generateDefaultTimeline(newStatus, a.appliedDate) : a.timeline)
          };
        }
        return a;
      });
      localStorage.setItem(localKey, JSON.stringify(updated));
    }
  } catch (e) {
    console.warn('LocalStorage update error:', e);
  }

  // Update Firestore only if authenticated on Firestore project
  const firestoreUser = fallbackAuth.currentUser;
  if (firestoreUser) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...updates,
        lastUpdatedDate: formattedDate,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.warn('Firestore updateJobApplication error:', error);
      try {
        handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
      } catch {
        // Non-blocking fallback
      }
    }
  }
}

/**
 * Generate simulated initial seed applications for demo/testing preview
 */
export function createSeedApplications(user: { uid: string; email?: string | null; displayName?: string | null }): JobApplication[] {
  const userName = user.displayName || 'Candidate';
  const userEmail = user.email || 'candidate@elawyers.com.bd';

  return [
    {
      id: `seed_app_1_${user.uid}`,
      userId: user.uid,
      userEmail,
      jobId: 'job-1',
      jobTitle: 'Senior Corporate Tax Consultant',
      category: 'Taxation',
      department: 'Tax Advisory',
      jobType: 'Full-time',
      location: 'Dhaka (Gulshan)',
      salaryRange: 'Tk 60,000 - 90,000 / mo',
      applicantName: userName,
      applicantEmail: userEmail,
      applicantPhone: '+880 1712 345678',
      coverLetter: 'Experienced in complex corporate tax advisory, return filings under Bangladesh Income Tax Act 2023, and NBR dispute resolution.',
      appliedDate: 'Oct 08, 2026',
      appliedAtIso: '2026-10-08T09:30:00.000Z',
      status: 'Shortlisted',
      statusNotes: 'Technical profile shortlisted! Selected for partner interview with Advisory Team.',
      lastUpdatedDate: 'Oct 11, 2026',
      referenceId: 'EL-2026-89104',
      stageIndex: 2,
      interviewDate: '2026-10-25',
      interviewTime: '11:30',
      interviewMode: 'online',
      interviewLink: 'https://meet.google.com/ela-tax-2026',
      interviewLocation: 'Google Meet (Virtual)',
      interviewBooked: true,
      timeline: [
        {
          title: 'Application Submitted',
          date: 'Oct 08, 2026',
          description: 'Application package and CA credentials received successfully.',
          completed: true
        },
        {
          title: 'Initial Screening & Qualification Review',
          date: 'Oct 09, 2026',
          description: 'Resume screened and approved by Senior Tax Director.',
          completed: true
        },
        {
          title: 'Shortlisted for Technical Interview',
          date: 'Oct 11, 2026',
          description: 'Panel interview scheduled for Oct 25, 2026 at 11:30 AM BST.',
          completed: true,
          current: true
        },
        {
          title: 'Partner Offer & Agreement',
          date: 'Upcoming',
          description: 'Formal retainer contract and compensation finalization.',
          completed: false
        }
      ]
    },
    {
      id: `seed_app_2_${user.uid}`,
      userId: user.uid,
      userEmail,
      jobId: 'job-4',
      jobTitle: 'Part-Time Financial Auditor & Accountant',
      category: 'Audit',
      department: 'Audit & Assurance',
      jobType: 'Part-time',
      location: 'Remote / Hybrid',
      salaryRange: 'Tk 25,000 - 40,000 / mo',
      applicantName: userName,
      applicantEmail: userEmail,
      applicantPhone: '+880 1712 345678',
      coverLetter: 'Part-qualified CA with practical mastery of QuickBooks, Mushak 9.1 VAT reconciliation, and financial audit documentation.',
      appliedDate: 'Oct 11, 2026',
      appliedAtIso: '2026-10-11T14:15:00.000Z',
      status: 'Under Review',
      statusNotes: 'Application is currently under technical review by the Audit & Assurance division.',
      lastUpdatedDate: 'Oct 12, 2026',
      referenceId: 'EL-2026-92147',
      stageIndex: 1,
      timeline: generateDefaultTimeline('Under Review', 'Oct 11, 2026')
    }
  ];
}
