import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  INITIAL_LMS_COURSES,
  LmsCourse,
  LmsLesson,
  LmsFinalExamConfig
} from '../data/lmsCoursesData';
import { useAuth } from './AuthContext';
import { useShopAuth } from './ShopAuthContext';
import { usePurchases } from './PurchaseContext';
import { db } from '../lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';

/**
 * Recursively strips all `undefined` values from objects and arrays so Firestore never throws:
 * "Unsupported field value: undefined"
 */
export function cleanForFirestore<T>(data: T): T {
  if (data === undefined) {
    return null as any;
  }
  if (data === null || typeof data !== 'object') {
    return data;
  }
  if (data instanceof Date) {
    return data.toISOString() as any;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => cleanForFirestore(item)) as any;
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (value !== undefined) {
      clean[key] = cleanForFirestore(value);
    }
  }
  return clean as T;
}

/**
 * Safe wrapper around setDoc that strips undefined fields and catches any sync/async Firestore errors
 */
export async function safeSetDoc(docRef: any, data: any, options?: any) {
  try {
    const sanitized = cleanForFirestore(data);
    return await setDoc(docRef, sanitized, options);
  } catch (err) {
    console.warn('[LmsContext safeSetDoc Notice]:', err);
  }
}

export type LessonComputedStatus = 'locked' | 'available' | 'in_progress' | 'completed';

export interface StudentProfileRecord {
  userId: string;
  studentId: string; // e.g. STU-2026-001
  fullName: string;
  email: string;
  phone: string;
  enrolledCourseIds: string[];
  firestoreVerified?: boolean;
  updatedAt: string;
}

export interface LessonProgressRecord {
  key: string; // `${userId}_${courseId}_${lessonId}`
  userId: string;
  courseId: string;
  lessonId: string; // permanent ID e.g. cls_01
  videoWatchPercent: number; // 0-100
  videoCheckpointsReached: string[];
  videoCompleted: boolean;
  notesSectionsRead: string[];
  notesCompleted: boolean;
  pptViewed: boolean;
  pptSlidesViewed: number[];
  quizPassed: boolean;
  quizBestScore: number;
  quizAttemptsCount: number;
  firestoreValidated: boolean;
  firestoreValidatedAt?: string;
  completedInFirestore?: boolean;
  completedAt?: string;
  updatedAt: string;
}

export interface LessonCompletionCriteriaState {
  videoMet: boolean;
  notesMet: boolean;
  quizMet: boolean;
  firestoreValidated: boolean;
  completedInFirestore: boolean;
  allCriteriaMet: boolean;
  missingCriteriaLabels: string[];
}

export interface QuizAttemptRecord {
  attemptId: string;
  userId: string;
  studentName: string;
  courseId: string;
  lessonId: string; // or 'final_exam'
  quizTitle: string;
  selectedAnswers: number[];
  scorePercent: number;
  passed: boolean;
  submittedAt: string;
}

export interface FinalExamResultRecord {
  resultId: string;
  userId: string;
  studentName: string;
  studentId: string;
  courseId: string;
  scorePercent: number;
  passed: boolean;
  attemptsCount: number;
  selectedAnswers: number[];
  timeSpentSeconds: number;
  completedAt: string;
}

export type CertificateStatus = 'Valid' | 'Revoked' | 'Superseded';

export interface LmsCertificateRecord {
  certificateId: string; // Immutable ID e.g. CERT-2026-ELAW-1001
  userId: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  issueDate: string;
  issuerOrganization: string;
  authorizedSignatory: string;
  signatoryDesignation: string;
  status: CertificateStatus;
  revocationReason?: string;
  supersededById?: string;
  verificationUrl: string;
  createdAt: string;
}

export interface PublicCertificateVerificationResult {
  lookupStatus: 'found' | 'not_found';
  certificateStatus?: CertificateStatus;
  certificateId?: string;
  studentName?: string;
  courseTitle?: string;
  issueDate?: string;
  issuerOrganization?: string;
  authorizedSignatory?: string;
  signatoryDesignation?: string;
  revocationReason?: string;
}

export interface LmsAuditLogRecord {
  logId: string;
  actorEmail: string;
  actorRole: 'admin' | 'system';
  actionType:
    | 'COURSE_UPDATED'
    | 'LESSON_UPDATED'
    | 'EXAM_CONFIG_UPDATED'
    | 'CERTIFICATE_ISSUED'
    | 'CERTIFICATE_REVOKED'
    | 'CERTIFICATE_SUPERSEDED'
    | 'STUDENT_ENROLLED';
  targetId: string;
  summary: string;
  timestamp: string;
}

export interface ComputedLessonState {
  lesson: LmsLesson;
  progress: LessonProgressRecord;
  status: LessonComputedStatus;
  isContentRestricted: boolean;
  lockReason?: string;
  lessonCompletionPercent: number;
  completionCriteria: LessonCompletionCriteriaState;
}

export interface CertificateEligibilityState {
  allClassesCompleted: boolean;
  completedClassesCount: number;
  totalClassesCount: number;
  allQuizzesCompleted: boolean;
  completedQuizzesCount: number;
  requiredQuizzesCount: number;
  finalExamPassed: boolean;
  finalExamBestScore: number;
  enrollmentValidated: boolean;
  certificateIssued: boolean;
  certificate: LmsCertificateRecord | null;
  isFullyEligible: boolean;
}

interface LmsContextType {
  courses: LmsCourse[];
  activeCourseId: string;
  setActiveCourseId: (courseId: string) => void;
  activeCourse: LmsCourse;
  studentProfile: StudentProfileRecord;
  isFirestoreSyncing: boolean;
  isFirestoreEnrollmentVerified: boolean;
  verifyFirestoreEnrollment: (courseId?: string) => Promise<boolean>;
  updateStudentProfile: (updates: Partial<Pick<StudentProfileRecord, 'fullName' | 'email' | 'phone'>>) => void;
  enrollInCourse: (courseId: string) => Promise<void>;
  isEnrolledInCourse: (courseId: string) => boolean;
  getComputedLessonsForCourse: (courseId: string) => ComputedLessonState[];
  canAccessLessonContent: (
    courseId: string,
    lessonId: string,
    contentType?: 'video' | 'notes' | 'ppt' | 'quiz'
  ) => {
    allowed: boolean;
    status: LessonComputedStatus;
    reason?: string;
  };
  getCourseOverallProgress: (courseId: string) => {
    completedCount: number;
    totalCount: number;
    percent: number;
    allMandatoryLessonsDone: boolean;
  };
  getCertificateEligibility: (courseId: string) => CertificateEligibilityState;
  recordVideoCheckpoint: (courseId: string, lessonId: string, watchPercent: number, chapterId?: string) => void;
  markVideoLessonComplete: (courseId: string, lessonId: string) => { success: boolean; message: string };
  recordNotesSectionRead: (courseId: string, lessonId: string, sectionId: string) => void;
  markNotesLessonComplete: (courseId: string, lessonId: string) => { success: boolean; message: string };
  recordPptSlideView: (courseId: string, lessonId: string, slideNumber: number) => void;
  isLessonCompleted: (courseId: string, lessonId: string) => boolean;
  toggleLessonCompletion: (courseId: string, lessonId: string, forceCompleted?: boolean) => boolean;
  lastAccessedCourseId: string;
  recordCourseAccess: (courseId: string) => void;
  getFirstUncompletedLesson: (courseId?: string) => {
    courseId: string;
    portalCourseId: string;
    courseTitle: string;
    lessonId: string;
    className: string;
    lessonIndex: number;
    allCompleted: boolean;
    routeUrl: string;
  };
  submitClassQuiz: (
    courseId: string,
    lessonId: string,
    selectedAnswers: number[]
  ) => { scorePercent: number; passed: boolean; attempt: QuizAttemptRecord; error?: string };
  getLessonQuizAttempts: (courseId: string, lessonId: string) => QuizAttemptRecord[];
  submitFinalExam: (
    courseId: string,
    selectedAnswers: number[],
    timeSpentSeconds: number
  ) => { scorePercent: number; passed: boolean; result: FinalExamResultRecord; certificate: LmsCertificateRecord | null };
  getFinalExamResult: (courseId: string) => FinalExamResultRecord | null;
  ensureCertificateForEligibleStudent: (courseId: string) => LmsCertificateRecord | null;
  verifyCertificatePublic: (certificateIdInput: string, studentNameInput?: string) => PublicCertificateVerificationResult;
  // Admin methods & records
  allCertificates: LmsCertificateRecord[];
  allAuditLogs: LmsAuditLogRecord[];
  allExamResults: FinalExamResultRecord[];
  allProgressRecords: Record<string, LessonProgressRecord>;
  updateCourseDetails: (courseId: string, updates: Partial<LmsCourse>) => void;
  updateLessonConfig: (courseId: string, lessonId: string, updates: Partial<LmsLesson>) => void;
  updateFinalExamConfig: (courseId: string, updates: Partial<LmsFinalExamConfig>) => void;
  updateCertificateStatusAdmin: (certificateId: string, status: CertificateStatus, reason: string) => void;
  reissueCertificateAdmin: (certificateId: string, reason: string) => LmsCertificateRecord | null;
  loadDemoProgressPreset: (courseId: string, preset: '60_percent' | 'ready_for_exam' | 'reset') => void;
}

const STORAGE_KEYS = {
  COURSES: 'elaw_lms_courses_v1',
  STUDENT_PROFILE: 'elaw_lms_student_profile_v1',
  PROGRESS: 'elaw_lms_progress_v1',
  QUIZ_ATTEMPTS: 'elaw_lms_quiz_attempts_v1',
  EXAM_RESULTS: 'elaw_lms_exam_results_v1',
  CERTIFICATES: 'elaw_lms_certificates_v1',
  AUDIT_LOGS: 'elaw_lms_audit_logs_v1',
  LAST_ACCESSED_COURSE: 'elaw_lms_last_accessed_course_v1'
};

const DEFAULT_SAMPLE_CERTIFICATES: LmsCertificateRecord[] = [
  {
    certificateId: 'CERT-2026-ELAW-00101',
    userId: 'sample_student_01',
    studentId: 'STU-2026-001',
    studentName: 'Tanvir Ahmed Chowdhury',
    courseId: 'personal-income-tax',
    courseTitle: 'Personal Income Tax & Online e-Return Filing Masterclass (AY 2026–27)',
    issueDate: '2026-10-18',
    issuerOrganization: 'E-Lawyers Academy & Accounticca Professional Institute',
    authorizedSignatory: 'Adv. Ekram Hossain',
    signatoryDesignation: 'Advocate, Supreme Court of Bangladesh & Lead Tax Counsel',
    status: 'Valid',
    verificationUrl: '/verify-certificate?id=CERT-2026-ELAW-00101',
    createdAt: '2026-10-18T14:30:00Z'
  },
  {
    certificateId: 'CERT-2026-ELAW-00102',
    userId: 'sample_student_02',
    studentId: 'STU-2026-002',
    studentName: 'Barrister Nusrat Jahan',
    courseId: 'rjsc-corporate-compliance',
    courseTitle: 'Corporate Law, RJSC Company Registration & Annual Compliance Program',
    issueDate: '2026-10-15',
    issuerOrganization: 'E-Lawyers Academy & Accounticca Professional Institute',
    authorizedSignatory: 'Adv. Ekram Hossain',
    signatoryDesignation: 'Advocate, Supreme Court of Bangladesh & Lead Corporate Counsel',
    status: 'Valid',
    verificationUrl: '/verify-certificate?id=CERT-2026-ELAW-00102',
    createdAt: '2026-10-15T11:00:00Z'
  },
  {
    certificateId: 'CERT-2026-ELAW-00099',
    userId: 'sample_student_03',
    studentId: 'STU-2026-003',
    studentName: 'Kamrul Hasan',
    courseId: 'personal-income-tax',
    courseTitle: 'Personal Income Tax & Online e-Return Filing Masterclass (AY 2026–27)',
    issueDate: '2026-09-20',
    issuerOrganization: 'E-Lawyers Academy & Accounticca Professional Institute',
    authorizedSignatory: 'Adv. Ekram Hossain',
    signatoryDesignation: 'Advocate, Supreme Court of Bangladesh & Lead Tax Counsel',
    status: 'Revoked',
    revocationReason: 'Payment chargeback / enrollment invalidated by compliance audit.',
    verificationUrl: '/verify-certificate?id=CERT-2026-ELAW-00099',
    createdAt: '2026-09-20T09:15:00Z'
  }
];

const LmsContext = createContext<LmsContextType | undefined>(undefined);

export const LmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { adminUser } = useShopAuth();
  const { purchasedProductIds = [] } = usePurchases();

  const currentUserId = user?.uid || 'student_default_user';

  // 1. Courses State
  const [courses, setCourses] = useState<LmsCourse[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COURSES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0]?.lessons)) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_LMS_COURSES;
  });

  const [activeCourseId, setActiveCourseIdState] = useState<string>('personal-income-tax');
  const [lastAccessedCourseId, setLastAccessedCourseId] = useState<string>(() => {
    try {
      const savedLast = localStorage.getItem(STORAGE_KEYS.LAST_ACCESSED_COURSE);
      if (savedLast) return savedLast;
      const savedPortal = localStorage.getItem('lms_active_portal_course_id');
      if (savedPortal) return savedPortal;
    } catch {
      // ignore
    }
    return 'academy-course-401';
  });

  const recordCourseAccess = useCallback((courseId: string) => {
    const trimmed = (courseId || '').trim();
    if (!trimmed) return;
    setLastAccessedCourseId(trimmed);
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_ACCESSED_COURSE, trimmed);
      localStorage.setItem('lms_active_portal_course_id', trimmed);
    } catch {
      // ignore
    }
  }, []);

  const setActiveCourseId = useCallback(
    (courseId: string) => {
      setActiveCourseIdState(courseId);
      recordCourseAccess(courseId);
    },
    [recordCourseAccess]
  );

  const [isFirestoreSyncing, setIsFirestoreSyncing] = useState<boolean>(false);
  const [isFirestoreEnrollmentVerified, setIsFirestoreEnrollmentVerified] = useState<boolean>(false);

  // 2. Student Profile State
  const [studentProfile, setStudentProfile] = useState<StudentProfileRecord>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STUDENT_PROFILE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.enrolledCourseIds)) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return {
      userId: 'student_default_user',
      studentId: 'STU-2026-001',
      fullName: 'Tanvir Ahmed Chowdhury',
      email: 'student@elawyersbd.com',
      phone: '+880 1711-234567',
      enrolledCourseIds: ['personal-income-tax', 'rjsc-corporate-compliance'],
      firestoreVerified: true,
      updatedAt: new Date().toISOString()
    };
  });

  // 3. Lesson Progress Map (Keyed by `${userId}_${courseId}_${lessonId}`)
  const [progressMap, setProgressMap] = useState<Record<string, LessonProgressRecord>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const normalized: Record<string, LessonProgressRecord> = {};
          Object.entries(parsed).forEach(([k, val]) => {
            const rec = val as LessonProgressRecord;
            // Migrate legacy untouched 6-class seed so Class 02 is the first uncompleted lesson by default
            if (
              rec.completedAt === '2026-10-19T12:00:00Z' &&
              rec.updatedAt === '2026-10-19T12:00:00Z' &&
              ['cls_02', 'cls_03', 'cls_04', 'cls_05', 'cls_06'].includes(rec.lessonId)
            ) {
              return;
            }
            const isFullyDone =
              Boolean(rec.videoCompleted) &&
              Boolean(rec.notesCompleted) &&
              Boolean(rec.quizPassed);
            normalized[k] = {
              ...rec,
              firestoreValidated: rec.firestoreValidated !== false,
              completedInFirestore: rec.completedInFirestore ?? isFullyDone
            };
          });
          return normalized;
        }
      }
    } catch {
      // ignore
    }
    // Seed initial progress: Class 01 completed in Firestore, Class 02 In Progress (first uncompleted lesson)
    const initial: Record<string, LessonProgressRecord> = {};
    const defaultCourse = INITIAL_LMS_COURSES[0];
    defaultCourse.lessons.slice(0, 1).forEach((lesson) => {
      const key = `student_default_user_${defaultCourse.courseId}_${lesson.lessonId}`;
      initial[key] = {
        key,
        userId: 'student_default_user',
        courseId: defaultCourse.courseId,
        lessonId: lesson.lessonId,
        videoWatchPercent: 100,
        videoCheckpointsReached: lesson.videoAsset.chapters.map((c) => c.id),
        videoCompleted: true,
        notesSectionsRead: lesson.notesAsset.sections.map((s) => s.id),
        notesCompleted: true,
        pptViewed: true,
        pptSlidesViewed: [1, 2, 3],
        quizPassed: true,
        quizBestScore: 100,
        quizAttemptsCount: 1,
        firestoreValidated: true,
        firestoreValidatedAt: '2026-10-19T12:00:00Z',
        completedInFirestore: true,
        completedAt: '2026-10-19T12:00:00Z',
        updatedAt: '2026-10-19T12:00:00Z'
      };
    });
    const class2 = defaultCourse.lessons[1];
    if (class2) {
      const key2 = `student_default_user_${defaultCourse.courseId}_${class2.lessonId}`;
      initial[key2] = {
        key: key2,
        userId: 'student_default_user',
        courseId: defaultCourse.courseId,
        lessonId: class2.lessonId,
        videoWatchPercent: 50,
        videoCheckpointsReached: class2.videoAsset.chapters.slice(0, 2).map((c) => c.id),
        videoCompleted: false,
        notesSectionsRead: [class2.notesAsset.sections[0].id],
        notesCompleted: false,
        pptViewed: true,
        pptSlidesViewed: [1],
        quizPassed: false,
        quizBestScore: 0,
        quizAttemptsCount: 0,
        firestoreValidated: true,
        firestoreValidatedAt: '2026-10-20T01:00:00Z',
        completedInFirestore: false,
        updatedAt: '2026-10-20T01:00:00Z'
      };
    }
    return initial;
  });

  const studentProfileRef = useRef(studentProfile);
  studentProfileRef.current = studentProfile;

  // Sync Firebase user info, enrollment document, and real-time lesson progress records from Firestore
  useEffect(() => {
    let isMounted = true;
    let unsubscribeProgress: (() => void) | null = null;
    const activeUid = user?.uid || null;
    const activeDisplayName = user?.displayName || null;
    const activeEmail = user?.email || null;

    const syncUserWithFirestore = async () => {
      if (!activeUid) {
        if (isMounted) {
          setIsFirestoreEnrollmentVerified(false);
          setIsFirestoreSyncing(false);
        }
        return;
      }

      setIsFirestoreSyncing(true);
      try {
        const deterministicNum =
          Math.abs(
            activeUid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 899
          ) + 101;
        const generatedStudentId = `STU-2026-${String(deterministicNum).padStart(3, '0')}`;

        // 1. Check `lms_enrollments/{activeUid}` in Firestore
        const enrollmentRef = doc(db, 'lms_enrollments', activeUid);
        const enrollmentSnap = await getDoc(enrollmentRef);

        if (enrollmentSnap.exists()) {
          const remoteProfile = enrollmentSnap.data() as StudentProfileRecord;
          const remoteCourses = Array.isArray(remoteProfile.enrolledCourseIds)
            ? remoteProfile.enrolledCourseIds
            : ['personal-income-tax'];
          const mergedProfile: StudentProfileRecord = {
            userId: activeUid,
            studentId: remoteProfile.studentId || generatedStudentId,
            fullName: remoteProfile.fullName || activeDisplayName || 'Enrolled Student',
            email: remoteProfile.email || activeEmail || '',
            phone: remoteProfile.phone || '+880 1711-234567',
            enrolledCourseIds:
              remoteCourses.length > 0 ? remoteCourses : ['personal-income-tax'],
            firestoreVerified: true,
            updatedAt: remoteProfile.updatedAt || new Date().toISOString()
          };
          if (isMounted) {
            setStudentProfile(mergedProfile);
            setIsFirestoreEnrollmentVerified(mergedProfile.enrolledCourseIds.length > 0);
            localStorage.setItem(STORAGE_KEYS.STUDENT_PROFILE, JSON.stringify(mergedProfile));
          }
        } else {
          const currentLocalProfile = studentProfileRef.current;
          const newProfile: StudentProfileRecord = {
            userId: activeUid,
            studentId: generatedStudentId,
            fullName: activeDisplayName || currentLocalProfile.fullName || 'Enrolled Student',
            email: activeEmail || currentLocalProfile.email || '',
            phone: currentLocalProfile.phone || '+880 1711-234567',
            enrolledCourseIds: Array.from(
              new Set([
                ...(Array.isArray(currentLocalProfile.enrolledCourseIds)
                  ? currentLocalProfile.enrolledCourseIds
                  : []),
                'personal-income-tax'
              ])
            ),
            firestoreVerified: true,
            updatedAt: new Date().toISOString()
          };
          await safeSetDoc(enrollmentRef, newProfile, { merge: true });
          if (isMounted) {
            setStudentProfile(newProfile);
            setIsFirestoreEnrollmentVerified(true);
            localStorage.setItem(STORAGE_KEYS.STUDENT_PROFILE, JSON.stringify(newProfile));
          }
        }

        // 2. Real-time Firestore listener on `lms_progress` for this user
        const progressQuery = query(
          collection(db, 'lms_progress'),
          where('userId', '==', activeUid)
        );
        unsubscribeProgress = onSnapshot(
          progressQuery,
          (progressSnap) => {
            if (!isMounted || progressSnap.empty) return;
            setProgressMap((prev) => {
              let hasDiff = false;
              const next = { ...prev };
              progressSnap.forEach((docSnap) => {
                const data = docSnap.data() as LessonProgressRecord;
                const userKey = `${activeUid}_${data.courseId}_${data.lessonId}`;
                const fullyCompleted =
                  Boolean(data.videoCompleted) &&
                  Boolean(data.notesCompleted) &&
                  Boolean(data.quizPassed);
                const incomingRecord: LessonProgressRecord = {
                  ...data,
                  key: userKey,
                  userId: activeUid,
                  firestoreValidated: true,
                  firestoreValidatedAt: data.firestoreValidatedAt || data.updatedAt,
                  completedInFirestore: data.completedInFirestore ?? fullyCompleted
                };
                const existing = prev[userKey];
                if (
                  !existing ||
                  existing.videoWatchPercent !== incomingRecord.videoWatchPercent ||
                  existing.videoCompleted !== incomingRecord.videoCompleted ||
                  existing.notesCompleted !== incomingRecord.notesCompleted ||
                  existing.pptViewed !== incomingRecord.pptViewed ||
                  existing.quizPassed !== incomingRecord.quizPassed ||
                  existing.quizBestScore !== incomingRecord.quizBestScore ||
                  existing.completedInFirestore !== incomingRecord.completedInFirestore ||
                  existing.notesSectionsRead?.length !== incomingRecord.notesSectionsRead?.length ||
                  existing.pptSlidesViewed?.length !== incomingRecord.pptSlidesViewed?.length
                ) {
                  next[userKey] = incomingRecord;
                  hasDiff = true;
                }
              });
              if (!hasDiff) return prev;
              localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(next));
              return next;
            });
          },
          () => {
            // Ignore snapshot error if offline
          }
        );
      } catch {
        // Fallback if offline: still update local studentProfile for authenticated user
        if (isMounted) {
          setStudentProfile((prev) => {
            const prevEnrolled = Array.isArray(prev.enrolledCourseIds)
              ? prev.enrolledCourseIds
              : ['personal-income-tax'];
            const updated: StudentProfileRecord = {
              ...prev,
              userId: activeUid,
              fullName: activeDisplayName || prev.fullName || 'Enrolled Student',
              email: activeEmail || prev.email,
              enrolledCourseIds: Array.from(new Set([...prevEnrolled, 'personal-income-tax'])),
              firestoreVerified: true,
              updatedAt: new Date().toISOString()
            };
            return updated;
          });
          setIsFirestoreEnrollmentVerified(true);
        }
      } finally {
        if (isMounted) {
          setIsFirestoreSyncing(false);
        }
      }
    };

    syncUserWithFirestore();

    return () => {
      isMounted = false;
      if (unsubscribeProgress) {
        unsubscribeProgress();
      }
    };
  }, [user?.uid, user?.displayName, user?.email]);

  // Also auto-enroll if a matching productSlug is unlocked in PurchaseContext
  useEffect(() => {
    if (Array.isArray(purchasedProductIds) && purchasedProductIds.length > 0) {
      const matchedCourseIds = courses
        .filter(
          (c) =>
            purchasedProductIds.includes(c.productSlug) ||
            purchasedProductIds.includes(c.courseId)
        )
        .map((c) => c.courseId);
      if (matchedCourseIds.length > 0) {
        setStudentProfile((prev) => {
          const prevEnrolled = Array.isArray(prev.enrolledCourseIds) ? prev.enrolledCourseIds : [];
          const merged = Array.from(new Set([...prevEnrolled, ...matchedCourseIds]));
          if (merged.length === prevEnrolled.length) return prev;
          const next: StudentProfileRecord = {
            ...prev,
            enrolledCourseIds: merged,
            firestoreVerified: true,
            updatedAt: new Date().toISOString()
          };
          localStorage.setItem(STORAGE_KEYS.STUDENT_PROFILE, JSON.stringify(next));
          if (user?.uid) {
            safeSetDoc(doc(db, 'lms_enrollments', user.uid), next, { merge: true });
          }
          return next;
        });
      }
    }
  }, [purchasedProductIds, courses, user?.uid]);

  // 4. Quiz Attempts
  const [quizAttempts, setQuizAttempts] = useState<QuizAttemptRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.QUIZ_ATTEMPTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  // 5. Final Exam Results
  const [examResults, setExamResults] = useState<FinalExamResultRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXAM_RESULTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  // 6. Certificates
  const [certificates, setCertificates] = useState<LmsCertificateRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CERTIFICATES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_SAMPLE_CERTIFICATES;
  });

  // 7. Audit Logs
  const [auditLogs, setAuditLogs] = useState<LmsAuditLogRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [
      {
        logId: 'LOG-2026-001',
        actorEmail: 'hmekram@gmail.com',
        actorRole: 'admin',
        actionType: 'COURSE_UPDATED',
        targetId: 'personal-income-tax',
        summary: 'Published 10-Class Curriculum for Personal Income Tax & Online e-Return Filing Masterclass (AY 2026–27).',
        timestamp: '2026-10-18T10:00:00Z'
      },
      {
        logId: 'LOG-2026-002',
        actorEmail: 'system@elawyersbd.com',
        actorRole: 'system',
        actionType: 'CERTIFICATE_ISSUED',
        targetId: 'CERT-2026-ELAW-00101',
        summary: 'Issued Certificate CERT-2026-ELAW-00101 to Tanvir Ahmed Chowdhury upon passing Final Exam.',
        timestamp: '2026-10-18T14:30:00Z'
      },
      {
        logId: 'LOG-2026-003',
        actorEmail: 'hmekram@gmail.com',
        actorRole: 'admin',
        actionType: 'CERTIFICATE_REVOKED',
        targetId: 'CERT-2026-ELAW-00099',
        summary: 'Revoked Certificate CERT-2026-ELAW-00099 due to payment chargeback audit.',
        timestamp: '2026-09-25T16:20:00Z'
      }
    ];
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENT_PROFILE, JSON.stringify(studentProfile));
  }, [studentProfile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progressMap));
  }, [progressMap]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.QUIZ_ATTEMPTS, JSON.stringify(quizAttempts));
  }, [quizAttempts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXAM_RESULTS, JSON.stringify(examResults));
  }, [examResults]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify(certificates));
  }, [certificates]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Load certificates from Firestore on mount so public verification works across sessions
  useEffect(() => {
    const syncFirestoreCertificates = async () => {
      try {
        const q = query(collection(db, 'lms_certificates'), orderBy('createdAt', 'desc'), limit(50));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const remoteCerts: LmsCertificateRecord[] = [];
          snap.forEach((docSnap) => {
            remoteCerts.push(docSnap.data() as LmsCertificateRecord);
          });
          setCertificates((prev) => {
            const byId = new Map<string, LmsCertificateRecord>();
            prev.forEach((c) => byId.set(c.certificateId, c));
            remoteCerts.forEach((c) => byId.set(c.certificateId, c));
            return Array.from(byId.values());
          });
        }
      } catch {
        // Fallback to local state if Firestore collection rules or offline state prevent query
      }
    };
    syncFirestoreCertificates();
  }, []);

  const appendAuditLog = useCallback(
    (
      actionType: LmsAuditLogRecord['actionType'],
      targetId: string,
      summary: string,
      role: 'admin' | 'system' = 'admin'
    ) => {
      const newLog: LmsAuditLogRecord = {
        logId: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        actorEmail: adminUser?.email || user?.email || 'system@elawyersbd.com',
        actorRole: role,
        actionType,
        targetId,
        summary,
        timestamp: new Date().toISOString()
      };
      setAuditLogs((prev) => [newLog, ...prev]);
      safeSetDoc(doc(db, 'lms_audit_logs', newLog.logId), newLog);
    },
    [adminUser?.email, user?.email]
  );

  const activeCourse = useMemo(() => {
    return courses.find((c) => c.courseId === activeCourseId) || courses[0];
  }, [courses, activeCourseId]);

  const updateStudentProfile = useCallback(
    (updates: Partial<Pick<StudentProfileRecord, 'fullName' | 'email' | 'phone'>>) => {
      setStudentProfile((prev) => {
        const next: StudentProfileRecord = {
          ...prev,
          ...updates,
          firestoreVerified: true,
          updatedAt: new Date().toISOString()
        };
        safeSetDoc(doc(db, 'lms_enrollments', next.userId), next, { merge: true });
        return next;
      });
    },
    []
  );

  const enrollInCourse = useCallback(
    async (courseId: string) => {
      const prevEnrolled = Array.isArray(studentProfile.enrolledCourseIds)
        ? studentProfile.enrolledCourseIds
        : [];
      const merged = Array.from(new Set([...prevEnrolled, courseId]));
      const next: StudentProfileRecord = {
        ...studentProfile,
        userId: currentUserId,
        enrolledCourseIds: merged,
        firestoreVerified: true,
        updatedAt: new Date().toISOString()
      };
      setStudentProfile(next);
      setIsFirestoreEnrollmentVerified(true);
      localStorage.setItem(STORAGE_KEYS.STUDENT_PROFILE, JSON.stringify(next));
      try {
        await safeSetDoc(doc(db, 'lms_enrollments', currentUserId), next, { merge: true });
      } catch {
        // Fallback if offline
      }
      appendAuditLog(
        'STUDENT_ENROLLED',
        courseId,
        `Enrolled student ${next.fullName} (${next.studentId}) in ${courseId} and verified in Firestore.`,
        'system'
      );
    },
    [appendAuditLog, currentUserId, studentProfile]
  );

  const verifyFirestoreEnrollment = useCallback(
    async (courseId?: string): Promise<boolean> => {
      const activeUid = user?.uid;
      if (!activeUid) return false;
      const targetCourseId = courseId || activeCourseId;
      const currentProfile = studentProfileRef.current;
      try {
        const enrollmentRef = doc(db, 'lms_enrollments', activeUid);
        const snap = await getDoc(enrollmentRef);
        if (snap.exists()) {
          const data = snap.data() as StudentProfileRecord;
          const enrolledList = Array.isArray(data.enrolledCourseIds) ? data.enrolledCourseIds : [];
          if (enrolledList.includes(targetCourseId)) {
            setIsFirestoreEnrollmentVerified((prev) => (prev ? prev : true));
            return true;
          }
        }
        // Check local profile enrollment & sync to Firestore if enrolled locally
        const localEnrolled = Array.isArray(currentProfile.enrolledCourseIds)
          ? currentProfile.enrolledCourseIds
          : [];
        if (localEnrolled.includes(targetCourseId)) {
          await safeSetDoc(
            enrollmentRef,
            {
              ...currentProfile,
              userId: activeUid,
              firestoreVerified: true,
              updatedAt: new Date().toISOString()
            },
            { merge: true }
          );
          setIsFirestoreEnrollmentVerified((prev) => (prev ? prev : true));
          return true;
        }
        return false;
      } catch {
        const localEnrolled = Array.isArray(currentProfile.enrolledCourseIds)
          ? currentProfile.enrolledCourseIds
          : [];
        return localEnrolled.includes(targetCourseId);
      }
    },
    [activeCourseId, user?.uid]
  );

  const isEnrolledInCourse = useCallback(
    (courseId: string) => {
      const list = Array.isArray(studentProfile.enrolledCourseIds)
        ? studentProfile.enrolledCourseIds
        : [];
      return list.includes(courseId);
    },
    [studentProfile.enrolledCourseIds]
  );

  const getOrCreateLessonProgress = useCallback(
    (courseId: string, lessonId: string): LessonProgressRecord => {
      const userKey = `${currentUserId}_${courseId}_${lessonId}`;
      const defaultKey = `student_default_user_${courseId}_${lessonId}`;
      const existing = progressMap[userKey] || progressMap[defaultKey];
      if (existing) {
        const isFullyDone =
          Boolean(existing.videoCompleted) &&
          Boolean(existing.notesCompleted) &&
          Boolean(existing.quizPassed);
        return {
          ...existing,
          firestoreValidated: existing.firestoreValidated !== false,
          completedInFirestore: existing.completedInFirestore ?? isFullyDone
        };
      }
      return {
        key: userKey,
        userId: currentUserId,
        courseId,
        lessonId,
        videoWatchPercent: 0,
        videoCheckpointsReached: [],
        videoCompleted: false,
        notesSectionsRead: [],
        notesCompleted: false,
        pptViewed: false,
        pptSlidesViewed: [],
        quizPassed: false,
        quizBestScore: 0,
        quizAttemptsCount: 0,
        firestoreValidated: false,
        completedInFirestore: false,
        updatedAt: new Date().toISOString()
      };
    },
    [currentUserId, progressMap]
  );

  const evaluateLessonCompletionCriteria = useCallback(
    (lesson: LmsLesson, progress: LessonProgressRecord): LessonCompletionCriteriaState => {
      const videoMet = Boolean(progress.videoCompleted);
      const notesMet = Boolean(progress.notesCompleted);
      const quizMet = !lesson.quizRequired || Boolean(progress.quizPassed);
      const firestoreValidated = Boolean(progress.firestoreValidated);
      const completedInFirestore =
        Boolean(progress.completedInFirestore) ||
        (videoMet && notesMet && quizMet && firestoreValidated);
      const allCriteriaMet = videoMet && notesMet && quizMet && firestoreValidated && completedInFirestore;

      const missingCriteriaLabels: string[] = [];
      if (!videoMet) missingCriteriaLabels.push('Video Lesson (≥90%)');
      if (!notesMet) missingCriteriaLabels.push('Class Notes Checkpoints');
      if (!quizMet) missingCriteriaLabels.push(`Class Quiz (≥${lesson.quizConfig.passingScore}%)`);
      if ((!firestoreValidated || !completedInFirestore) && videoMet && notesMet && quizMet) {
        missingCriteriaLabels.push('Firestore Completion Verification');
      }

      return {
        videoMet,
        notesMet,
        quizMet,
        firestoreValidated,
        completedInFirestore,
        allCriteriaMet,
        missingCriteriaLabels
      };
    },
    []
  );

  const isLessonFullyCompleted = useCallback(
    (lesson: LmsLesson, progress: LessonProgressRecord): boolean => {
      return evaluateLessonCompletionCriteria(lesson, progress).allCriteriaMet;
    },
    [evaluateLessonCompletionCriteria]
  );

  // Strict Sequential 10-Class Unlocking Engine (Validated against Firestore completion status)
  const getComputedLessonsForCourse = useCallback(
    (courseId: string): ComputedLessonState[] => {
      const course = courses.find((c) => c.courseId === courseId) || courses[0];
      const enrolled = isEnrolledInCourse(course.courseId);

      return course.lessons.map((lesson, idx) => {
        const progress = getOrCreateLessonProgress(course.courseId, lesson.lessonId);
        const completionCriteria = evaluateLessonCompletionCriteria(lesson, progress);
        const completed = completionCriteria.allCriteriaMet;

        // Calculate individual lesson completion percentage (Video 40%, Notes 30%, Quiz 30%)
        const videoWeight = progress.videoCompleted
          ? 40
          : Math.min(35, Math.round((progress.videoWatchPercent / 100) * 40));
        const notesTotalSecs = Math.max(1, lesson.notesAsset.sections.length);
        const notesWeight = progress.notesCompleted
          ? 30
          : Math.min(
              25,
              Math.round((progress.notesSectionsRead.length / notesTotalSecs) * 30)
            );
        const quizWeight = !lesson.quizRequired ? 30 : progress.quizPassed ? 30 : 0;
        const lessonCompletionPercent = completed
          ? 100
          : Math.min(99, videoWeight + notesWeight + quizWeight);

        if (!enrolled) {
          return {
            lesson,
            progress,
            status: 'locked',
            isContentRestricted: true,
            lockReason: 'Firestore enrollment verification required to unlock course classes.',
            lessonCompletionPercent: 0,
            completionCriteria
          };
        }

        // Strict sequential check: Every preceding class (0 .. idx - 1) MUST be marked as fully completed in Firestore
        if (idx > 0) {
          for (let prevIdx = 0; prevIdx < idx; prevIdx++) {
            const prevLesson = course.lessons[prevIdx];
            const prevProgress = getOrCreateLessonProgress(course.courseId, prevLesson.lessonId);
            const prevCriteria = evaluateLessonCompletionCriteria(prevLesson, prevProgress);
            if (!prevCriteria.allCriteriaMet) {
              const missingDesc =
                prevCriteria.missingCriteriaLabels.length > 0
                  ? prevCriteria.missingCriteriaLabels.join(', ')
                  : 'Video, Notes & Quiz';
              return {
                lesson,
                progress,
                status: 'locked',
                isContentRestricted: true,
                lockReason: `Sequential Lock: Complete Class ${prevLesson.classNumber} (${missingDesc}) in Firestore to unlock Class ${lesson.classNumber} content (Video, Notes, PPT, Quiz).`,
                lessonCompletionPercent,
                completionCriteria
              };
            }
          }
        }

        if (completed) {
          return {
            lesson,
            progress,
            status: 'completed',
            isContentRestricted: false,
            lessonCompletionPercent: 100,
            completionCriteria
          };
        }

        const hasStarted =
          progress.videoWatchPercent > 0 ||
          progress.notesSectionsRead.length > 0 ||
          progress.pptViewed ||
          progress.quizAttemptsCount > 0;

        return {
          lesson,
          progress,
          status: hasStarted ? 'in_progress' : 'available',
          isContentRestricted: false,
          lessonCompletionPercent,
          completionCriteria
        };
      });
    },
    [
      courses,
      evaluateLessonCompletionCriteria,
      getOrCreateLessonProgress,
      isEnrolledInCourse
    ]
  );

  // Content Access Guard: Restricts access to Video, Notes, PPT, and Quiz unless previous class is marked completed in Firestore
  const canAccessLessonContent = useCallback(
    (
      courseId: string,
      lessonId: string,
      contentType?: 'video' | 'notes' | 'ppt' | 'quiz'
    ): {
      allowed: boolean;
      status: LessonComputedStatus;
      reason?: string;
    } => {
      const computed = getComputedLessonsForCourse(courseId);
      const target = computed.find(
        (item) => item.lesson.lessonId === lessonId || item.lesson.classNumber === lessonId
      );
      if (!target) {
        return {
          allowed: false,
          status: 'locked',
          reason: 'Requested class does not exist in this course.'
        };
      }
      if (target.status === 'locked' || target.isContentRestricted) {
        const contentLabel = contentType ? contentType.toUpperCase() : 'learning content';
        return {
          allowed: false,
          status: 'locked',
          reason:
            target.lockReason ||
            `Access to Class ${target.lesson.classNumber} ${contentLabel} is restricted until the previous class is marked as fully completed in Firestore.`
        };
      }
      return {
        allowed: true,
        status: target.status
      };
    },
    [getComputedLessonsForCourse]
  );

  const getCourseOverallProgress = useCallback(
    (courseId: string) => {
      const computed = getComputedLessonsForCourse(courseId);
      const totalCount = computed.length;
      const completedCount = computed.filter((item) => item.status === 'completed').length;
      // Blend completed classes and in-progress partial credit for smooth overall progress
      const sumPercentages = computed.reduce((acc, item) => acc + item.lessonCompletionPercent, 0);
      const percent = totalCount > 0 ? Math.round(sumPercentages / totalCount) : 0;
      const allMandatoryLessonsDone = completedCount === totalCount && totalCount > 0;

      return {
        completedCount,
        totalCount,
        percent,
        allMandatoryLessonsDone
      };
    },
    [getComputedLessonsForCourse]
  );

  const upsertProgressRecord = useCallback(
    (courseId: string, lessonId: string, updater: (prev: LessonProgressRecord) => LessonProgressRecord) => {
      const course = courses.find((c) => c.courseId === courseId) || courses[0];
      const lesson = course.lessons.find((l) => l.lessonId === lessonId);
      const userKey = `${currentUserId}_${courseId}_${lessonId}`;
      const defaultKey = `student_default_user_${courseId}_${lessonId}`;
      setProgressMap((prevMap) => {
        const nowIso = new Date().toISOString();
        const base =
          prevMap[userKey] ||
          prevMap[defaultKey] || {
            key: userKey,
            userId: currentUserId,
            courseId,
            lessonId,
            videoWatchPercent: 0,
            videoCheckpointsReached: [],
            videoCompleted: false,
            notesSectionsRead: [],
            notesCompleted: false,
            pptViewed: false,
            pptSlidesViewed: [],
            quizPassed: false,
            quizBestScore: 0,
            quizAttemptsCount: 0,
            firestoreValidated: false,
            completedInFirestore: false,
            updatedAt: nowIso
          };
        const nextValues = updater(base);
        // No-op check: if updater returned exact same reference, do not mutate state or trigger Firestore writes
        if (nextValues === base) {
          return prevMap;
        }

        const quizSatisfied = !lesson?.quizRequired || Boolean(nextValues.quizPassed);
        const isNowFullyCompleted =
          Boolean(nextValues.videoCompleted) &&
          Boolean(nextValues.notesCompleted) &&
          quizSatisfied;

        const updated: LessonProgressRecord = {
          ...nextValues,
          key: userKey,
          userId: currentUserId,
          firestoreValidated: true,
          firestoreValidatedAt: nowIso,
          completedInFirestore: isNowFullyCompleted,
          completedAt: isNowFullyCompleted ? nextValues.completedAt || nowIso : undefined,
          updatedAt: nowIso
        };
        safeSetDoc(doc(db, 'lms_progress', userKey), updated, { merge: true });
        return {
          ...prevMap,
          [userKey]: updated,
          [defaultKey]: updated
        };
      });
    },
    [courses, currentUserId]
  );

  const recordVideoCheckpoint = useCallback(
    (courseId: string, lessonId: string, watchPercent: number, chapterId?: string) => {
      const access = canAccessLessonContent(courseId, lessonId, 'video');
      if (!access.allowed) return;

      upsertProgressRecord(courseId, lessonId, (prev) => {
        const nextPercent = Math.max(prev.videoWatchPercent, Math.min(100, Math.round(watchPercent)));
        const hasChapter = !chapterId || prev.videoCheckpointsReached.includes(chapterId);
        const autoComplete = nextPercent >= 95 ? true : prev.videoCompleted;
        if (
          nextPercent === prev.videoWatchPercent &&
          hasChapter &&
          autoComplete === prev.videoCompleted
        ) {
          return prev;
        }
        const nextCheckpoints = chapterId
          ? Array.from(new Set([...prev.videoCheckpointsReached, chapterId]))
          : prev.videoCheckpointsReached;
        return {
          ...prev,
          videoWatchPercent: nextPercent,
          videoCheckpointsReached: nextCheckpoints,
          videoCompleted: autoComplete
        };
      });
    },
    [canAccessLessonContent, upsertProgressRecord]
  );

  const markVideoLessonComplete = useCallback(
    (courseId: string, lessonId: string): { success: boolean; message: string } => {
      const access = canAccessLessonContent(courseId, lessonId, 'video');
      if (!access.allowed) {
        return {
          success: false,
          message:
            access.reason ||
            'Access restricted: Previous class must be marked as fully completed in Firestore first.'
        };
      }

      const progress = getOrCreateLessonProgress(courseId, lessonId);
      if (progress.videoWatchPercent < 90 && progress.videoCheckpointsReached.length < 3) {
        return {
          success: false,
          message: `Playback validation required: Please complete at least 90% of the video lecture (currently ${progress.videoWatchPercent}%) or finish all lesson segments before marking complete.`
        };
      }
      upsertProgressRecord(courseId, lessonId, (prev) => ({
        ...prev,
        videoWatchPercent: 100,
        videoCompleted: true
      }));
      return {
        success: true,
        message: 'Video lecture verified and saved to Firestore.'
      };
    },
    [canAccessLessonContent, getOrCreateLessonProgress, upsertProgressRecord]
  );

  const recordNotesSectionRead = useCallback(
    (courseId: string, lessonId: string, sectionId: string) => {
      const access = canAccessLessonContent(courseId, lessonId, 'notes');
      if (!access.allowed) return;

      const course = courses.find((c) => c.courseId === courseId) || courses[0];
      const lesson = course.lessons.find((l) => l.lessonId === lessonId);
      const totalSections = lesson?.notesAsset.sections.length || 3;

      upsertProgressRecord(courseId, lessonId, (prev) => {
        if (prev.notesSectionsRead.includes(sectionId)) {
          return prev;
        }
        const nextSections = Array.from(new Set([...prev.notesSectionsRead, sectionId]));
        const allRead = nextSections.length >= totalSections;
        return {
          ...prev,
          notesSectionsRead: nextSections,
          notesCompleted: prev.notesCompleted || allRead
        };
      });
    },
    [canAccessLessonContent, courses, upsertProgressRecord]
  );

  const markNotesLessonComplete = useCallback(
    (courseId: string, lessonId: string): { success: boolean; message: string } => {
      const access = canAccessLessonContent(courseId, lessonId, 'notes');
      if (!access.allowed) {
        return {
          success: false,
          message:
            access.reason ||
            'Access restricted: Previous class must be marked as fully completed in Firestore first.'
        };
      }

      const course = courses.find((c) => c.courseId === courseId) || courses[0];
      const lesson = course.lessons.find((l) => l.lessonId === lessonId);
      const requiredCount = lesson?.notesAsset.sections.length || 3;
      const progress = getOrCreateLessonProgress(courseId, lessonId);

      if (progress.notesSectionsRead.length < requiredCount) {
        return {
          success: false,
          message: `Reading checkpoint required: Please read all ${requiredCount} sections (${progress.notesSectionsRead.length}/${requiredCount} completed) before marking notes complete.`
        };
      }
      upsertProgressRecord(courseId, lessonId, (prev) => ({
        ...prev,
        notesCompleted: true
      }));
      return {
        success: true,
        message: 'All reading checkpoints verified. Class Notes marked as Completed in Firestore.'
      };
    },
    [canAccessLessonContent, courses, getOrCreateLessonProgress, upsertProgressRecord]
  );

  const recordPptSlideView = useCallback(
    (courseId: string, lessonId: string, slideNumber: number) => {
      const access = canAccessLessonContent(courseId, lessonId, 'ppt');
      if (!access.allowed) return;

      upsertProgressRecord(courseId, lessonId, (prev) => {
        if (prev.pptViewed && prev.pptSlidesViewed.includes(slideNumber)) {
          return prev;
        }
        return {
          ...prev,
          pptViewed: true,
          pptSlidesViewed: Array.from(new Set([...prev.pptSlidesViewed, slideNumber]))
        };
      });
    },
    [canAccessLessonContent, upsertProgressRecord]
  );

  const resolveCourseAndLesson = useCallback(
    (courseIdInput: string, lessonIdInput: string) => {
      let normalizedCourseId = (courseIdInput || activeCourseId || 'personal-income-tax').trim();
      if (normalizedCourseId === 'academy-course-401') {
        normalizedCourseId = 'personal-income-tax';
      } else if (normalizedCourseId === 'academy-course-402') {
        normalizedCourseId = 'rjsc-corporate-compliance';
      }

      const course =
        courses.find((c) => c.courseId === normalizedCourseId) ||
        courses.find((c) => c.courseId === activeCourseId) ||
        courses[0];

      const rawLesson = (lessonIdInput || 'cls_01').trim();
      let matchedLesson: LmsLesson | undefined;
      let normalizedLessonId = rawLesson;

      if (course) {
        matchedLesson = course.lessons.find(
          (l) =>
            l.lessonId.toLowerCase() === rawLesson.toLowerCase() ||
            l.classNumber === rawLesson ||
            l.heading.trim().toLowerCase() === rawLesson.toLowerCase()
        );

        if (!matchedLesson) {
          const classNumMatch = rawLesson.match(/^(?:class\s*|cls_?\s*)?0*(\d+)$/i);
          if (classNumMatch) {
            const num = parseInt(classNumMatch[1], 10);
            const padded = String(num).padStart(2, '0');
            matchedLesson = course.lessons.find(
              (l) =>
                l.classNumber === padded ||
                l.classNumber === String(num) ||
                l.lessonId === `cls_${padded}`
            );
            normalizedLessonId = matchedLesson ? matchedLesson.lessonId : `cls_${padded}`;
          }
        } else {
          normalizedLessonId = matchedLesson.lessonId;
        }
      }

      return {
        normalizedCourseId,
        normalizedLessonId,
        course,
        lesson: matchedLesson
      };
    },
    [activeCourseId, courses]
  );

  const isLessonCompleted = useCallback(
    (courseId: string, lessonId: string): boolean => {
      const { normalizedCourseId, normalizedLessonId, lesson } = resolveCourseAndLesson(
        courseId,
        lessonId
      );
      const progress = getOrCreateLessonProgress(normalizedCourseId, normalizedLessonId);
      if (lesson) {
        return (
          Boolean(progress.completedInFirestore) &&
          evaluateLessonCompletionCriteria(lesson, progress).allCriteriaMet
        );
      }
      return (
        Boolean(progress.completedInFirestore) ||
        (Boolean(progress.videoCompleted) && Boolean(progress.notesCompleted))
      );
    },
    [evaluateLessonCompletionCriteria, getOrCreateLessonProgress, resolveCourseAndLesson]
  );

  const toggleLessonCompletion = useCallback(
    (courseId: string, lessonId: string, forceCompleted?: boolean): boolean => {
      const { normalizedCourseId, normalizedLessonId, lesson } = resolveCourseAndLesson(
        courseId,
        lessonId
      );
      const currentlyDone = isLessonCompleted(normalizedCourseId, normalizedLessonId);
      const nextCompleted =
        typeof forceCompleted === 'boolean' ? forceCompleted : !currentlyDone;

      const userKey = `${currentUserId}_${normalizedCourseId}_${normalizedLessonId}`;
      const defaultKey = `student_default_user_${normalizedCourseId}_${normalizedLessonId}`;

      setProgressMap((prevMap) => {
        const nowIso = new Date().toISOString();
        const base =
          prevMap[userKey] ||
          prevMap[defaultKey] || {
            key: userKey,
            userId: currentUserId,
            courseId: normalizedCourseId,
            lessonId: normalizedLessonId,
            videoWatchPercent: 0,
            videoCheckpointsReached: [],
            videoCompleted: false,
            notesSectionsRead: [],
            notesCompleted: false,
            pptViewed: false,
            pptSlidesViewed: [],
            quizPassed: false,
            quizBestScore: 0,
            quizAttemptsCount: 0,
            firestoreValidated: true,
            completedInFirestore: false,
            updatedAt: nowIso
          };

        const updated: LessonProgressRecord = nextCompleted
          ? {
              ...base,
              key: userKey,
              userId: currentUserId,
              courseId: normalizedCourseId,
              lessonId: normalizedLessonId,
              videoWatchPercent: 100,
              videoCheckpointsReached: lesson
                ? lesson.videoAsset.chapters.map((c) => c.id)
                : base.videoCheckpointsReached,
              videoCompleted: true,
              notesSectionsRead: lesson
                ? lesson.notesAsset.sections.map((s) => s.id)
                : base.notesSectionsRead,
              notesCompleted: true,
              pptViewed: true,
              pptSlidesViewed: lesson
                ? lesson.pptAsset.slides.map((s) => s.slideNumber)
                : [1, 2, 3],
              quizPassed: true,
              quizBestScore: Math.max(base.quizBestScore || 0, 100),
              quizAttemptsCount: Math.max(base.quizAttemptsCount || 0, 1),
              firestoreValidated: true,
              firestoreValidatedAt: nowIso,
              completedInFirestore: true,
              completedAt: nowIso,
              updatedAt: nowIso
            }
          : {
              ...base,
              key: userKey,
              userId: currentUserId,
              courseId: normalizedCourseId,
              lessonId: normalizedLessonId,
              videoWatchPercent: 0,
              videoCheckpointsReached: [],
              videoCompleted: false,
              notesSectionsRead: [],
              notesCompleted: false,
              pptViewed: false,
              pptSlidesViewed: [],
              quizPassed: false,
              firestoreValidated: true,
              firestoreValidatedAt: nowIso,
              completedInFirestore: false,
              completedAt: undefined,
              updatedAt: nowIso
            };

        safeSetDoc(doc(db, 'lms_progress', userKey), updated, { merge: true });
        return {
          ...prevMap,
          [userKey]: updated,
          [defaultKey]: updated
        };
      });

      recordCourseAccess(courseId);
      return nextCompleted;
    },
    [currentUserId, isLessonCompleted, recordCourseAccess, resolveCourseAndLesson]
  );

  const getFirstUncompletedLesson = useCallback(
    (courseIdInput?: string) => {
      // 1. Resolve most recently accessed course
      let candidateCourseId = (courseIdInput || '').trim();
      if (!candidateCourseId) {
        try {
          candidateCourseId =
            localStorage.getItem(STORAGE_KEYS.LAST_ACCESSED_COURSE) ||
            localStorage.getItem('lms_active_portal_course_id') ||
            '';
        } catch {
          // ignore
        }
      }
      if (!candidateCourseId) {
        // Check most recent updatedAt in progressMap for current user
        const userRecords = Object.values(progressMap).filter(
          (r) => r.userId === currentUserId || r.userId === 'student_default_user'
        );
        if (userRecords.length > 0) {
          const sorted = [...userRecords].sort(
            (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
          );
          if (sorted[0]?.courseId) {
            candidateCourseId = sorted[0].courseId;
          }
        }
      }
      if (!candidateCourseId) {
        candidateCourseId = lastAccessedCourseId || activeCourseId || 'academy-course-401';
      }

      const { normalizedCourseId, course } = resolveCourseAndLesson(candidateCourseId, 'cls_01');
      const portalCourseId =
        candidateCourseId.startsWith('academy-course-') ||
        candidateCourseId === 'interactive-lms-masterclass'
          ? candidateCourseId
          : normalizedCourseId === 'rjsc-corporate-compliance'
            ? 'academy-course-402'
            : normalizedCourseId === 'personal-income-tax'
              ? 'academy-course-401'
              : candidateCourseId;

      const courseTitle = course?.title || 'Personal Income Tax & Online e-Return Filing Masterclass';

      // 2. Read class keys configured for this course in portal storage
      let portalClassKeys: string[] = ['Class 01', 'Class 02', 'Class 03'];
      try {
        const rawPortal =
          localStorage.getItem(`lmsData_${portalCourseId}`) ||
          (portalCourseId === 'academy-course-401' || normalizedCourseId === 'personal-income-tax'
            ? localStorage.getItem('lmsData')
            : null);
        if (rawPortal) {
          const parsedPortal = JSON.parse(rawPortal);
          if (parsedPortal && typeof parsedPortal === 'object') {
            const keys = Object.keys(parsedPortal);
            if (keys.length > 0) {
              portalClassKeys = keys;
            }
          }
        }
      } catch {
        // Fallback to default class keys
      }

      // 3. Find first uncompleted class in portalClassKeys
      for (let idx = 0; idx < portalClassKeys.length; idx++) {
        const clsName = portalClassKeys[idx];
        const trimmed = (clsName || '').trim();
        const lessonId = /^(?:class\s*|cls_?\s*)0*\d+$/i.test(trimmed)
          ? `cls_${String(parseInt(trimmed.replace(/\D+/g, ''), 10) || idx + 1).padStart(2, '0')}`
          : `cls_${String(idx + 1).padStart(2, '0')}`;

        if (!isLessonCompleted(portalCourseId, lessonId)) {
          return {
            courseId: normalizedCourseId,
            portalCourseId,
            courseTitle,
            lessonId,
            className: clsName,
            lessonIndex: idx,
            allCompleted: false,
            routeUrl: `/student/dashboard?course=${encodeURIComponent(
              portalCourseId
            )}&lesson=${encodeURIComponent(lessonId)}&class=${encodeURIComponent(clsName)}`
          };
        }
      }

      // 4. Fallback if all portal classes are completed: check LmsCourse lessons or wrap to first lesson
      if (course && Array.isArray(course.lessons)) {
        for (let idx = 0; idx < course.lessons.length; idx++) {
          const l = course.lessons[idx];
          if (!isLessonCompleted(normalizedCourseId, l.lessonId)) {
            const clsLabel = portalClassKeys[idx] || `Class ${l.classNumber}`;
            return {
              courseId: normalizedCourseId,
              portalCourseId,
              courseTitle,
              lessonId: l.lessonId,
              className: clsLabel,
              lessonIndex: idx,
              allCompleted: false,
              routeUrl: `/student/dashboard?course=${encodeURIComponent(
                portalCourseId
              )}&lesson=${encodeURIComponent(l.lessonId)}&class=${encodeURIComponent(clsLabel)}`
            };
          }
        }
      }

      const fallbackClass = portalClassKeys[0] || 'Class 01';
      return {
        courseId: normalizedCourseId,
        portalCourseId,
        courseTitle,
        lessonId: 'cls_01',
        className: fallbackClass,
        lessonIndex: 0,
        allCompleted: true,
        routeUrl: `/student/dashboard?course=${encodeURIComponent(
          portalCourseId
        )}&lesson=cls_01&class=${encodeURIComponent(fallbackClass)}`
      };
    },
    [
      activeCourseId,
      currentUserId,
      isLessonCompleted,
      lastAccessedCourseId,
      progressMap,
      resolveCourseAndLesson
    ]
  );

  const submitClassQuiz = useCallback(
    (courseId: string, lessonId: string, selectedAnswers: number[]) => {
      const access = canAccessLessonContent(courseId, lessonId, 'quiz');
      if (!access.allowed) {
        const blockedAttempt: QuizAttemptRecord = {
          attemptId: `BLOCKED-${Date.now()}`,
          userId: currentUserId,
          studentName: studentProfile.fullName,
          courseId,
          lessonId,
          quizTitle: 'Restricted Quiz',
          selectedAnswers: [],
          scorePercent: 0,
          passed: false,
          submittedAt: new Date().toISOString()
        };
        return {
          scorePercent: 0,
          passed: false,
          attempt: blockedAttempt,
          error:
            access.reason ||
            'Quiz access restricted until the previous class is marked as completed in Firestore.'
        };
      }

      const course = courses.find((c) => c.courseId === courseId) || courses[0];
      const lesson = course.lessons.find((l) => l.lessonId === lessonId) || course.lessons[0];
      const questions = lesson.quizConfig.questions;

      let correctCount = 0;
      questions.forEach((q, idx) => {
        if (selectedAnswers[idx] === q.correctOptionIndex) {
          correctCount++;
        }
      });

      const scorePercent =
        questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 100;
      const passed = scorePercent >= lesson.quizConfig.passingScore;

      const attempt: QuizAttemptRecord = {
        attemptId: `ATT-${Date.now()}`,
        userId: currentUserId,
        studentName: studentProfile.fullName,
        courseId,
        lessonId,
        quizTitle: lesson.quizConfig.title,
        selectedAnswers,
        scorePercent,
        passed,
        submittedAt: new Date().toISOString()
      };

      setQuizAttempts((prev) => [attempt, ...prev]);
      safeSetDoc(doc(db, 'lms_attempts', attempt.attemptId), attempt);

      upsertProgressRecord(courseId, lessonId, (prev) => ({
        ...prev,
        quizPassed: prev.quizPassed || passed,
        quizBestScore: Math.max(prev.quizBestScore, scorePercent),
        quizAttemptsCount: prev.quizAttemptsCount + 1
      }));

      return { scorePercent, passed, attempt };
    },
    [canAccessLessonContent, courses, currentUserId, studentProfile.fullName, upsertProgressRecord]
  );

  const getLessonQuizAttempts = useCallback(
    (courseId: string, lessonId: string) => {
      return quizAttempts.filter((a) => a.courseId === courseId && a.lessonId === lessonId);
    },
    [quizAttempts]
  );

  const getFinalExamResult = useCallback(
    (courseId: string): FinalExamResultRecord | null => {
      const matching = examResults.filter((r) => r.courseId === courseId);
      if (matching.length === 0) return null;
      // Return best or latest passed result
      const passedResult = matching.find((r) => r.passed);
      return passedResult || matching[0];
    },
    [examResults]
  );

  const issueOrGetImmutableCertificate = useCallback(
    (course: LmsCourse): LmsCertificateRecord => {
      // Check if an active Valid certificate already exists for this student & course
      const existingValid = certificates.find(
        (c) =>
          c.courseId === course.courseId &&
          (c.userId === currentUserId || c.studentId === studentProfile.studentId) &&
          c.status === 'Valid'
      );
      if (existingValid) {
        return existingValid;
      }

      const deterministicSuffix = String(1000 + certificates.length + 1);
      const certId = `CERT-2026-ELAW-${deterministicSuffix}`;
      const issueDate = new Date().toISOString().split('T')[0];

      const newCert: LmsCertificateRecord = {
        certificateId: certId,
        userId: currentUserId,
        studentId: studentProfile.studentId,
        studentName: studentProfile.fullName,
        courseId: course.courseId,
        courseTitle: course.title,
        issueDate,
        issuerOrganization: course.issuerOrganization,
        authorizedSignatory: course.authorizedSignatory,
        signatoryDesignation: course.signatoryDesignation,
        status: 'Valid',
        verificationUrl: `/verify-certificate?id=${encodeURIComponent(certId)}`,
        createdAt: new Date().toISOString()
      };

      setCertificates((prev) => [newCert, ...prev]);
      safeSetDoc(doc(db, 'lms_certificates', newCert.certificateId), newCert);

      appendAuditLog(
        'CERTIFICATE_ISSUED',
        newCert.certificateId,
        `Issued Certificate ${newCert.certificateId} to ${newCert.studentName} for "${course.title}".`,
        'system'
      );

      return newCert;
    },
    [appendAuditLog, certificates, currentUserId, studentProfile.fullName, studentProfile.studentId]
  );

  const submitFinalExam = useCallback(
    (courseId: string, selectedAnswers: number[], timeSpentSeconds: number) => {
      const course = courses.find((c) => c.courseId === courseId) || courses[0];
      const questions = course.finalExam.questions;

      let correctCount = 0;
      questions.forEach((q, idx) => {
        if (selectedAnswers[idx] === q.correctOptionIndex) {
          correctCount++;
        }
      });

      const scorePercent =
        questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 100;
      const passed = scorePercent >= course.finalExam.passingScore;

      const prevForCourse = examResults.filter((r) => r.courseId === courseId);
      const result: FinalExamResultRecord = {
        resultId: `EXR-${Date.now()}`,
        userId: currentUserId,
        studentName: studentProfile.fullName,
        studentId: studentProfile.studentId,
        courseId,
        scorePercent,
        passed,
        attemptsCount: prevForCourse.length + 1,
        selectedAnswers,
        timeSpentSeconds,
        completedAt: new Date().toISOString()
      };

      setExamResults((prev) => [result, ...prev]);
      safeSetDoc(doc(db, 'lms_exam_results', result.resultId), result);

      let cert: LmsCertificateRecord | null = null;
      const overall = getCourseOverallProgress(courseId);
      if (passed && overall.allMandatoryLessonsDone && isEnrolledInCourse(courseId)) {
        cert = issueOrGetImmutableCertificate(course);
      }

      return { scorePercent, passed, result, certificate: cert };
    },
    [
      courses,
      currentUserId,
      examResults,
      getCourseOverallProgress,
      isEnrolledInCourse,
      issueOrGetImmutableCertificate,
      studentProfile.fullName,
      studentProfile.studentId
    ]
  );

  const getCertificateEligibility = useCallback(
    (courseId: string): CertificateEligibilityState => {
      const course = courses.find((c) => c.courseId === courseId) || courses[0];
      const computedLessons = getComputedLessonsForCourse(course.courseId);

      const totalClassesCount = computedLessons.length;
      const completedClassesCount = computedLessons.filter(
        (l) => l.progress.videoCompleted && l.progress.notesCompleted
      ).length;
      const allClassesCompleted =
        completedClassesCount === totalClassesCount && totalClassesCount > 0;

      const requiredQuizLessons = computedLessons.filter((l) => l.lesson.quizRequired);
      const requiredQuizzesCount = requiredQuizLessons.length;
      const completedQuizzesCount = requiredQuizLessons.filter((l) => l.progress.quizPassed).length;
      const allQuizzesCompleted = completedQuizzesCount === requiredQuizzesCount;

      const examRes = getFinalExamResult(course.courseId);
      const finalExamPassed = Boolean(examRes?.passed);
      const finalExamBestScore = examRes?.scorePercent || 0;

      const enrollmentValidated = isEnrolledInCourse(course.courseId);

      const activeCert =
        certificates.find(
          (c) =>
            c.courseId === course.courseId &&
            (c.userId === currentUserId || c.studentId === studentProfile.studentId) &&
            c.status === 'Valid'
        ) || null;

      const certificateIssued = Boolean(activeCert);
      const isFullyEligible =
        allClassesCompleted &&
        allQuizzesCompleted &&
        enrollmentValidated &&
        (finalExamPassed || certificateIssued || completedClassesCount === totalClassesCount);

      return {
        allClassesCompleted,
        completedClassesCount,
        totalClassesCount,
        allQuizzesCompleted,
        completedQuizzesCount,
        requiredQuizzesCount,
        finalExamPassed,
        finalExamBestScore,
        enrollmentValidated,
        certificateIssued,
        certificate: activeCert,
        isFullyEligible
      };
    },
    [
      certificates,
      courses,
      currentUserId,
      getComputedLessonsForCourse,
      getFinalExamResult,
      isEnrolledInCourse,
      studentProfile.studentId
    ]
  );

  const ensureCertificateForEligibleStudent = useCallback(
    (courseId: string): LmsCertificateRecord | null => {
      const course = courses.find((c) => c.courseId === courseId) || courses[0];
      const elig = getCertificateEligibility(courseId);
      if (
        elig.allClassesCompleted &&
        elig.allQuizzesCompleted &&
        elig.enrollmentValidated
      ) {
        return issueOrGetImmutableCertificate(course);
      }
      return elig.certificate;
    },
    [courses, getCertificateEligibility, issueOrGetImmutableCertificate]
  );

  // Privacy-Safe Public Certificate Verification
  const verifyCertificatePublic = useCallback(
    (certificateIdInput: string, studentNameInput?: string): PublicCertificateVerificationResult => {
      const normalizedId = certificateIdInput.trim().toUpperCase();
      if (!normalizedId) {
        return { lookupStatus: 'not_found' };
      }

      const matched = certificates.find(
        (c) => c.certificateId.toUpperCase() === normalizedId
      );

      if (!matched) {
        return { lookupStatus: 'not_found' };
      }

      // If optional student name was entered, verify partial/case-insensitive match
      if (studentNameInput && studentNameInput.trim().length > 0) {
        const queryName = studentNameInput.trim().toLowerCase();
        if (!matched.studentName.toLowerCase().includes(queryName)) {
          return { lookupStatus: 'not_found' };
        }
      }

      // Strictly return ONLY sanitized public fields (NO email, NO phone, NO studentId, NO exam marks)
      return {
        lookupStatus: 'found',
        certificateStatus: matched.status,
        certificateId: matched.certificateId,
        studentName: matched.studentName,
        courseTitle: matched.courseTitle,
        issueDate: matched.issueDate,
        issuerOrganization: matched.issuerOrganization,
        authorizedSignatory: matched.authorizedSignatory,
        signatoryDesignation: matched.signatoryDesignation,
        revocationReason: matched.revocationReason
      };
    },
    [certificates]
  );

  // Admin Methods
  const updateCourseDetails = useCallback(
    (courseId: string, updates: Partial<LmsCourse>) => {
      setCourses((prev) =>
        prev.map((c) => {
          if (c.courseId !== courseId) return c;
          const updated = { ...c, ...updates, updatedAt: new Date().toISOString() };
          safeSetDoc(doc(db, 'lms_courses', courseId), updated, { merge: true });
          return updated;
        })
      );
      appendAuditLog(
        'COURSE_UPDATED',
        courseId,
        `Updated course metadata/status for "${updates.title || courseId}".`
      );
    },
    [appendAuditLog]
  );

  const updateLessonConfig = useCallback(
    (courseId: string, lessonId: string, updates: Partial<LmsLesson>) => {
      setCourses((prev) =>
        prev.map((c) => {
          if (c.courseId !== courseId) return c;
          const updatedLessons = c.lessons.map((l) => {
            if (l.lessonId !== lessonId) return l;
            // Preserve permanent lessonId so existing student progress is never lost
            return { ...l, ...updates, lessonId: l.lessonId };
          });
          const updatedCourse = {
            ...c,
            lessons: updatedLessons,
            updatedAt: new Date().toISOString()
          };
          safeSetDoc(doc(db, 'lms_courses', courseId), updatedCourse, { merge: true });
          return updatedCourse;
        })
      );
      appendAuditLog(
        'LESSON_UPDATED',
        `${courseId}:${lessonId}`,
        `Updated lesson ${lessonId} (${updates.heading || 'content/assets'}) without altering permanent lessonId.`
      );
    },
    [appendAuditLog]
  );

  const updateFinalExamConfig = useCallback(
    (courseId: string, updates: Partial<LmsFinalExamConfig>) => {
      setCourses((prev) =>
        prev.map((c) => {
          if (c.courseId !== courseId) return c;
          const updatedCourse = {
            ...c,
            finalExam: { ...c.finalExam, ...updates },
            updatedAt: new Date().toISOString()
          };
          safeSetDoc(doc(db, 'lms_courses', courseId), updatedCourse, { merge: true });
          return updatedCourse;
        })
      );
      appendAuditLog(
        'EXAM_CONFIG_UPDATED',
        courseId,
        `Updated Final Examination parameters for course ${courseId}.`
      );
    },
    [appendAuditLog]
  );

  const updateCertificateStatusAdmin = useCallback(
    (certificateId: string, status: CertificateStatus, reason: string) => {
      setCertificates((prev) =>
        prev.map((c) => {
          if (c.certificateId !== certificateId) return c;
          const updated: LmsCertificateRecord = {
            ...c,
            status,
            revocationReason: status === 'Valid' ? undefined : reason
          };
          safeSetDoc(doc(db, 'lms_certificates', certificateId), updated, { merge: true });
          return updated;
        })
      );
      appendAuditLog(
        status === 'Revoked' ? 'CERTIFICATE_REVOKED' : 'CERTIFICATE_SUPERSEDED',
        certificateId,
        `Changed Certificate ${certificateId} status to ${status}. Reason: ${reason}`
      );
    },
    [appendAuditLog]
  );

  const reissueCertificateAdmin = useCallback(
    (certificateId: string, reason: string): LmsCertificateRecord | null => {
      const oldCert = certificates.find((c) => c.certificateId === certificateId);
      if (!oldCert) return null;

      const newCertId = `CERT-2026-ELAW-${1000 + certificates.length + 5}`;
      const newCert: LmsCertificateRecord = {
        ...oldCert,
        certificateId: newCertId,
        issueDate: new Date().toISOString().split('T')[0],
        status: 'Valid',
        revocationReason: undefined,
        supersededById: undefined,
        verificationUrl: `/verify-certificate?id=${encodeURIComponent(newCertId)}`,
        createdAt: new Date().toISOString()
      };

      setCertificates((prev) => [
        newCert,
        ...prev.map((c) =>
          c.certificateId === certificateId
            ? {
                ...c,
                status: 'Superseded' as CertificateStatus,
                supersededById: newCertId,
                revocationReason: `Superseded by ${newCertId}: ${reason}`
              }
            : c
        )
      ]);

      safeSetDoc(doc(db, 'lms_certificates', newCertId), newCert);
      appendAuditLog(
        'CERTIFICATE_SUPERSEDED',
        certificateId,
        `Superseded Certificate ${certificateId} with new Certificate ${newCertId}. Reason: ${reason}`
      );
      return newCert;
    },
    [appendAuditLog, certificates]
  );

  const loadDemoProgressPreset = useCallback(
    (courseId: string, preset: '60_percent' | 'ready_for_exam' | 'reset') => {
      const course = courses.find((c) => c.courseId === courseId) || courses[0];
      const nowIso = new Date().toISOString();
      setProgressMap((prev) => {
        const next = { ...prev };
        course.lessons.forEach((lesson, idx) => {
          const userKey = `${currentUserId}_${course.courseId}_${lesson.lessonId}`;
          const defaultKey = `student_default_user_${course.courseId}_${lesson.lessonId}`;

          if (preset === 'reset') {
            delete next[userKey];
            delete next[defaultKey];
            deleteDoc(doc(db, 'lms_progress', userKey)).catch(() => {});
            return;
          }

          const shouldComplete = preset === 'ready_for_exam' ? true : idx < 6;
          if (shouldComplete) {
            const rec: LessonProgressRecord = {
              key: userKey,
              userId: currentUserId,
              courseId: course.courseId,
              lessonId: lesson.lessonId,
              videoWatchPercent: 100,
              videoCheckpointsReached: lesson.videoAsset.chapters.map((ch) => ch.id),
              videoCompleted: true,
              notesSectionsRead: lesson.notesAsset.sections.map((s) => s.id),
              notesCompleted: true,
              pptViewed: true,
              pptSlidesViewed: [1, 2, 3],
              quizPassed: true,
              quizBestScore: 100,
              quizAttemptsCount: 1,
              firestoreValidated: true,
              firestoreValidatedAt: nowIso,
              completedInFirestore: true,
              completedAt: nowIso,
              updatedAt: nowIso
            };
            next[userKey] = rec;
            next[defaultKey] = rec;
            safeSetDoc(doc(db, 'lms_progress', userKey), rec, { merge: true });
          } else if (preset === '60_percent' && idx === 6) {
            const rec: LessonProgressRecord = {
              key: userKey,
              userId: currentUserId,
              courseId: course.courseId,
              lessonId: lesson.lessonId,
              videoWatchPercent: 75,
              videoCheckpointsReached: lesson.videoAsset.chapters.slice(0, 3).map((ch) => ch.id),
              videoCompleted: false,
              notesSectionsRead: [lesson.notesAsset.sections[0].id],
              notesCompleted: false,
              pptViewed: true,
              pptSlidesViewed: [1],
              quizPassed: false,
              quizBestScore: 0,
              quizAttemptsCount: 0,
              firestoreValidated: true,
              firestoreValidatedAt: nowIso,
              completedInFirestore: false,
              updatedAt: nowIso
            };
            next[userKey] = rec;
            next[defaultKey] = rec;
            safeSetDoc(doc(db, 'lms_progress', userKey), rec, { merge: true });
          } else {
            delete next[userKey];
            delete next[defaultKey];
            deleteDoc(doc(db, 'lms_progress', userKey)).catch(() => {});
          }
        });
        return next;
      });
    },
    [courses, currentUserId]
  );

  return (
    <LmsContext.Provider
      value={{
        courses,
        activeCourseId,
        setActiveCourseId,
        activeCourse,
        studentProfile,
        isFirestoreSyncing,
        isFirestoreEnrollmentVerified,
        verifyFirestoreEnrollment,
        updateStudentProfile,
        enrollInCourse,
        isEnrolledInCourse,
        getComputedLessonsForCourse,
        canAccessLessonContent,
        getCourseOverallProgress,
        getCertificateEligibility,
        recordVideoCheckpoint,
        markVideoLessonComplete,
        recordNotesSectionRead,
        markNotesLessonComplete,
        recordPptSlideView,
        isLessonCompleted,
        toggleLessonCompletion,
        lastAccessedCourseId,
        recordCourseAccess,
        getFirstUncompletedLesson,
        submitClassQuiz,
        getLessonQuizAttempts,
        submitFinalExam,
        getFinalExamResult,
        ensureCertificateForEligibleStudent,
        verifyCertificatePublic,
        allCertificates: certificates,
        allAuditLogs: auditLogs,
        allExamResults: examResults,
        allProgressRecords: progressMap,
        updateCourseDetails,
        updateLessonConfig,
        updateFinalExamConfig,
        updateCertificateStatusAdmin,
        reissueCertificateAdmin,
        loadDemoProgressPreset
      }}
    >
      {children}
    </LmsContext.Provider>
  );
};

export const useLms = () => {
  const ctx = useContext(LmsContext);
  if (!ctx) {
    throw new Error('useLms must be used within an LmsProvider');
  }
  return ctx;
};
