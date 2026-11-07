import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Plus,
  Trash2,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
  FileCheck2,
  Radio,
  PlayCircle,
  FileText,
  Presentation,
  HelpCircle,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Lock,
  Sparkles,
  BookOpen,
  Layers,
  CheckSquare,
  Square,
  EyeOff,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowRight,
  X,
  AlertCircle,
  Award
} from 'lucide-react';
import {
  LmsContentTabType,
  LmsClassContentLinks,
  LmsPortalDataMap,
  AcademyPortalCourseOption,
  getAcademyPortalCourses,
  slugifyAcademyCourseName,
  resolveAcademyCourseOption,
  loadLmsPortalData,
  saveLmsPortalData,
  cloneDefaultLmsData,
  syncLmsPortalDataFromFirestore,
  resolveEmbedBehavior
} from '../utils/lmsPortalStore';
import { useLms, LmsCertificateRecord } from '../contexts/LmsContext';
import { FinalExamModal } from '../components/lms/FinalExamModal';
import { LmsCertificateViewerModal } from '../components/lms/LmsCertificateViewerModal';
import {
  StudentProgressDashboard,
  ModuleProgressMetric
} from '../components/lms/StudentProgressDashboard';
import { ServiceSEO } from '../components/SEO';
import { Breadcrumbs } from '../components/Breadcrumbs';

interface AdminDraftRow {
  id: string;
  originalClassName: string;
  className: string;
  links: LmsClassContentLinks;
}

export function isLiveEnabledForRecord(links?: LmsClassContentLinks): boolean {
  if (!links) return false;
  if (typeof links.hasLiveClass === 'boolean') {
    return links.hasLiveClass;
  }
  return Boolean((links.live || '').trim());
}

function createDraftRowsFromMap(data: LmsPortalDataMap): AdminDraftRow[] {
  return Object.entries(data).map(([className, links], idx) => ({
    id: `lms-row-${idx}-${Math.random().toString(36).slice(2, 8)}`,
    originalClassName: className,
    className,
    links: {
      hasLiveClass: isLiveEnabledForRecord(links),
      live: links?.live || '',
      recorded: links?.recorded || '',
      note: links?.note || '',
      ppt: links?.ppt || '',
      mcq: links?.mcq || ''
    }
  }));
}

const CONTENT_TABS: {
  id: LmsContentTabType;
  label: string;
  shortDesc: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'live', label: 'Live Class', shortDesc: 'Interactive live session link', icon: Radio },
  { id: 'recorded', label: 'Recorded Video', shortDesc: 'On-demand HD class recording', icon: PlayCircle },
  { id: 'note', label: 'Note', shortDesc: 'Comprehensive study notes & handouts', icon: FileText },
  { id: 'ppt', label: 'PPT', shortDesc: 'Presentation slides & visual decks', icon: Presentation },
  { id: 'mcq', label: 'MCQ', shortDesc: 'Self-assessment quiz & practice questions', icon: HelpCircle }
];

export const StudentLearningPortalPage: React.FC<{
  autoOpenExam?: boolean;
}> = ({ autoOpenExam = false }) => {
  const {
    courseId: paramCourseId,
    lessonId: paramLessonId,
    certificateId: paramCertificateId
  } = useParams<{
    courseId?: string;
    lessonId?: string;
    certificateId?: string;
  }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const {
    courses,
    activeCourse,
    setActiveCourseId,
    studentProfile,
    allCertificates,
    getCertificateEligibility,
    isLessonCompleted,
    toggleLessonCompletion,
    recordCourseAccess,
    getFirstUncompletedLesson
  } = useLms();

  // Build dropdown options from all courses on the /training Academy page + LmsContext courses
  const academyCourseOptions = useMemo<AcademyPortalCourseOption[]>(() => {
    const baseAcademy = getAcademyPortalCourses();
    const seenTitles = new Set(baseAcademy.map((c) => c.title.trim().toLowerCase()));
    const extraFromContext: AcademyPortalCourseOption[] = [];

    courses.forEach((c) => {
      const key = c.title.trim().toLowerCase();
      if (!seenTitles.has(key)) {
        seenTitles.add(key);
        const slug = slugifyAcademyCourseName(c.title);
        extraFromContext.push({
          id: c.courseId,
          title: c.title,
          slug,
          dashboardPath: `/student/dashboard/${slug}`,
          categoryLabel: c.programTag || 'LMS Program'
        });
      }
    });

    return [...baseAcademy, ...extraFromContext];
  }, [courses]);

  const [selectedPortalCourseId, setSelectedPortalCourseId] = useState<string>(() => {
    const opts = getAcademyPortalCourses();

    // 1. Check route parameter (:courseId — supports slug, title, or ID)
    if (paramCourseId) {
      const resolvedFromParam = resolveAcademyCourseOption(paramCourseId);
      if (resolvedFromParam) return resolvedFromParam.id;
    }

    // 2. Check URL query string (?course=...) or saved active portal course or student enrollment
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const queryCourse = params.get('course') || params.get('courseId');
      if (queryCourse) {
        const resolvedFromQuery = resolveAcademyCourseOption(queryCourse);
        if (resolvedFromQuery) return resolvedFromQuery.id;
      }

      try {
        const savedPortalCourse = window.localStorage.getItem('lms_active_portal_course_id');
        if (savedPortalCourse) {
          const resolvedSaved = resolveAcademyCourseOption(savedPortalCourse);
          if (resolvedSaved) return resolvedSaved.id;
        }

        const rawEnrollments = window.localStorage.getItem('training_enrollments');
        if (rawEnrollments) {
          const parsed = JSON.parse(rawEnrollments);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const latestEnrollment = parsed[parsed.length - 1];
            const enrolledTitle = String(latestEnrollment?.title || '').trim();
            if (enrolledTitle) {
              const matchedByEnrollment = resolveAcademyCourseOption(enrolledTitle);
              if (matchedByEnrollment) return matchedByEnrollment.id;
            }
          }
        }
      } catch {
        // Ignore storage read errors
      }
    }

    // 3. Check LmsContext studentProfile enrolledCourseIds
    if (studentProfile?.enrolledCourseIds?.length) {
      const firstEnrolledId = studentProfile.enrolledCourseIds[0];
      if (firstEnrolledId === 'rjsc-corporate-compliance') {
        const rjscOpt = opts.find((o) => o.id === 'academy-course-402' || o.id === 'rjsc-corporate-compliance');
        if (rjscOpt) return rjscOpt.id;
      }
      const matchedProfileOpt = resolveAcademyCourseOption(firstEnrolledId);
      if (matchedProfileOpt) return matchedProfileOpt.id;
    }

    // Default to Personal Income Tax Return Filing Training (401) from /training
    const defaultOpt =
      opts.find((o) => o.id === 'academy-course-401') || opts[0];
    return defaultOpt ? defaultOpt.id : 'academy-course-401';
  });

  const selectedCourseOption = useMemo<AcademyPortalCourseOption>(
    () =>
      academyCourseOptions.find((o) => o.id === selectedPortalCourseId) ||
      resolveAcademyCourseOption(selectedPortalCourseId) ||
      academyCourseOptions[0] || {
        id: 'academy-course-401',
        title: activeCourse.title,
        slug: slugifyAcademyCourseName(activeCourse.title),
        dashboardPath: `/student/dashboard/${slugifyAcademyCourseName(activeCourse.title)}`,
        categoryLabel: 'Academy Program'
      },
    [academyCourseOptions, selectedPortalCourseId, activeCourse.title]
  );

  // Core LMS Portal State scoped to the selected Academy course
  const [lmsData, setLmsData] = useState<LmsPortalDataMap>(() =>
    loadLmsPortalData(selectedPortalCourseId)
  );
  const [adminDraftRows, setAdminDraftRows] = useState<AdminDraftRow[]>(() =>
    createDraftRowsFromMap(loadLmsPortalData(selectedPortalCourseId))
  );
  const [isAdminView, setIsAdminView] = useState<boolean>(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState<boolean>(false);
  const [adminEmailInput, setAdminEmailInput] = useState<string>('');
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('');
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);

  const classKeys = useMemo(() => Object.keys(lmsData), [lmsData]);
  const [currentClass, setCurrentClass] = useState<string>(() => {
    const initialMap = loadLmsPortalData(selectedPortalCourseId);
    const keys = Object.keys(initialMap);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const queryClass = params.get('class');
      const queryLesson = params.get('lesson');
      if (queryClass && keys.includes(queryClass)) {
        return queryClass;
      }
      if (queryLesson) {
        const numMatch = queryLesson.match(/0*(\d+)$/);
        if (numMatch) {
          const idx = Math.max(0, parseInt(numMatch[1], 10) - 1);
          if (keys[idx]) return keys[idx];
        }
      }
    }
    return keys[0] || 'Class 01';
  });
  const [currentTab, setCurrentTab] = useState<LmsContentTabType>('live');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Record course access whenever selectedPortalCourseId is active
  useEffect(() => {
    if (selectedPortalCourseId) {
      recordCourseAccess(selectedPortalCourseId);
    }
  }, [selectedPortalCourseId, recordCourseAccess]);

  // Sync course and lesson when route param (:courseId, :lessonId) or URL query parameters (?course=..., ?lesson=..., ?class=..., ?tab=...) change
  useEffect(() => {
    const queryCourse =
      paramCourseId || searchParams.get('course') || searchParams.get('courseId');
    const queryClass = searchParams.get('class');
    const queryLesson = paramLessonId || searchParams.get('lesson');
    const queryTab = searchParams.get('tab') as LmsContentTabType | null;

    if (queryTab && ['live', 'recorded', 'note', 'ppt', 'mcq'].includes(queryTab)) {
      setCurrentTab(queryTab);
    }

    let targetCourseId = selectedPortalCourseId;
    if (queryCourse) {
      const matchedOpt =
        resolveAcademyCourseOption(queryCourse) ||
        academyCourseOptions.find(
          (o) =>
            o.id === queryCourse ||
            o.slug === queryCourse ||
            (o.title && queryCourse && typeof o.title === 'string' && typeof queryCourse === 'string' && o.title.trim().toLowerCase() === queryCourse.trim().toLowerCase())
        );
      if (matchedOpt && matchedOpt.id !== selectedPortalCourseId) {
        targetCourseId = matchedOpt.id;
        setSelectedPortalCourseId(matchedOpt.id);
        try {
          window.localStorage.setItem('lms_active_portal_course_id', matchedOpt.id);
        } catch {
          // Ignore storage error
        }
        const nextCourseData = loadLmsPortalData(matchedOpt.id);
        setLmsData(nextCourseData);
        setAdminDraftRows(createDraftRowsFromMap(nextCourseData));
        const nextKeys = Object.keys(nextCourseData);
        if (nextKeys[0] && !queryClass && !queryLesson) {
          setCurrentClass(nextKeys[0]);
        }
      }
    }

    const activeMap =
      targetCourseId === selectedPortalCourseId ? lmsData : loadLmsPortalData(targetCourseId);
    const activeKeys = Object.keys(activeMap);

    if (queryClass && activeKeys.includes(queryClass)) {
      setCurrentClass(queryClass);
    } else if (queryLesson) {
      const numMatch = queryLesson.match(/0*(\d+)$/);
      if (numMatch) {
        const idx = Math.max(0, parseInt(numMatch[1], 10) - 1);
        if (activeKeys[idx]) {
          setCurrentClass(activeKeys[idx]);
        }
      }
    }
  }, [searchParams, paramCourseId, paramLessonId, academyCourseOptions]);

  // In-UI notification & reset confirmation states (replacing window.alert / window.confirm)
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState<boolean>(false);

  // Exam & Certificate modals
  const [isExamModalOpen, setIsExamModalOpen] = useState<boolean>(Boolean(autoOpenExam));
  const [activeCertificateModal, setActiveCertificateModal] =
    useState<LmsCertificateRecord | null>(null);

  // Sync from Firestore when selectedPortalCourseId changes or on mount
  useEffect(() => {
    let mounted = true;
    syncLmsPortalDataFromFirestore(selectedPortalCourseId).then((remote) => {
      if (mounted && remote) {
        setLmsData(remote);
        setAdminDraftRows(createDraftRowsFromMap(remote));
        const firstKey = Object.keys(remote)[0];
        if (firstKey && !remote[currentClass]) {
          setCurrentClass(firstKey);
        }
      }
    });
    return () => {
      mounted = false;
    };
  }, [selectedPortalCourseId]);

  // Listen for external updates to lmsData
  useEffect(() => {
    const handleDataUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<
        LmsPortalDataMap | { courseId?: string; data: LmsPortalDataMap }
      >;
      if (!customEvent.detail) return;
      const detailObj = customEvent.detail as any;
      if (detailObj && typeof detailObj === 'object' && 'data' in detailObj && detailObj.data) {
        const payloadData = detailObj.data as LmsPortalDataMap;
        if (
          !detailObj.courseId ||
          detailObj.courseId === selectedPortalCourseId
        ) {
          setLmsData(payloadData);
          setAdminDraftRows(createDraftRowsFromMap(payloadData));
        }
      } else {
        const directMap = customEvent.detail as LmsPortalDataMap;
        setLmsData(directMap);
        setAdminDraftRows(createDraftRowsFromMap(directMap));
      }
    };
    window.addEventListener('lmsDataUpdated', handleDataUpdated);
    return () => window.removeEventListener('lmsDataUpdated', handleDataUpdated);
  }, [selectedPortalCourseId]);

  // Ensure currentClass remains valid if classes change
  useEffect(() => {
    if (classKeys.length > 0 && !lmsData[currentClass]) {
      setCurrentClass(classKeys[0]);
    }
  }, [classKeys, currentClass, lmsData]);

  const hasLiveForCurrentClass = useMemo(
    () => isLiveEnabledForRecord(lmsData[currentClass]),
    [lmsData, currentClass]
  );

  const visibleTabsForCurrentClass = useMemo(
    () =>
      CONTENT_TABS.filter((tab) =>
        tab.id === 'live' ? hasLiveForCurrentClass : true
      ),
    [hasLiveForCurrentClass]
  );

  // Automatically switch away from 'live' tab if Live Class is disabled/hidden for the active session
  useEffect(() => {
    if (!hasLiveForCurrentClass && currentTab === 'live') {
      setCurrentTab('recorded');
    }
  }, [hasLiveForCurrentClass, currentTab]);

  // Open certificate modal if URL contains certificateId
  useEffect(() => {
    if (paramCertificateId) {
      const found = allCertificates.find(
        (c) => c.certificateId.toUpperCase() === paramCertificateId.toUpperCase()
      );
      if (found) {
        setActiveCertificateModal(found);
      }
    }
  }, [paramCertificateId, allCertificates]);

  // Student View Content Protection (Block Ctrl/Cmd + C, P, S and F12 when Student View is active)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isAdminView) {
        const key = e.key.toLowerCase();
        if (
          (e.ctrlKey || e.metaKey) &&
          (key === 'c' || key === 'p' || key === 's')
        ) {
          e.preventDefault();
        }
        if (e.key === 'F12') {
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdminView]);

  const showToast = (msg: string) => {
    setStatusBanner(msg);
    setTimeout(() => {
      setStatusBanner((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Handle selecting an Academy course from the header dropdown menu or course directory:
  // Navigates to /student/dashboard/<course-slug> and loads that course's curriculum.
  const handleCourseDropdownChange = (newCourseId: string) => {
    const chosen =
      academyCourseOptions.find((o) => o.id === newCourseId) ||
      resolveAcademyCourseOption(newCourseId);
    const resolvedId = chosen ? chosen.id : newCourseId;

    setSelectedPortalCourseId(resolvedId);
    try {
      window.localStorage.setItem('lms_active_portal_course_id', resolvedId);
    } catch {
      // Ignore storage errors
    }

    // Sync LmsContext activeCourseId if matching
    if (resolvedId === 'academy-course-402' || resolvedId === 'rjsc-corporate-compliance') {
      setActiveCourseId('rjsc-corporate-compliance');
    } else if (courses.some((c) => c.courseId === resolvedId)) {
      setActiveCourseId(resolvedId);
    } else {
      setActiveCourseId('personal-income-tax');
    }

    const courseData = loadLmsPortalData(resolvedId);
    setLmsData(courseData);
    setAdminDraftRows(createDraftRowsFromMap(courseData));
    const firstKey = Object.keys(courseData)[0] || 'Class 01';
    setCurrentClass(firstKey);
    setCurrentTab('live');
    setConfirmResetOpen(false);

    if (chosen) {
      navigate(chosen.dashboardPath);
      showToast(
        isAdminView
          ? `Opened Admin Page for "${chosen.title}"`
          : `Switched to "${chosen.title}"`
      );
    }
  };

  const handleToggleView = () => {
    if (!isAdminView) {
      if (!isAdminAuthenticated) {
        setAdminAuthError(null);
        setIsAdminAuthModalOpen(true);
        return;
      }
      // Entering Admin View: sync draft rows with current saved data
      setAdminDraftRows(createDraftRowsFromMap(lmsData));
      setConfirmResetOpen(false);
      setIsAdminView(true);
    } else {
      setIsAdminView(false);
    }
  };

  const handleAdminAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailClean = (adminEmailInput || '').trim().toLowerCase();
    const passClean = (adminPasswordInput || '').trim();

    if (emailClean === 'hmekram@gmail.com' && passClean === '123ekraM.com') {
      setIsAdminAuthenticated(true);
      setIsAdminAuthModalOpen(false);
      setAdminAuthError(null);
      setAdminPasswordInput('');
      setAdminDraftRows(createDraftRowsFromMap(lmsData));
      setConfirmResetOpen(false);
      setIsAdminView(true);
      showToast('Admin verified (hmekram@gmail.com). Switched to Admin Page.');
    } else {
      setAdminAuthError('Invalid admin credentials. Access is restricted to authorized admin only.');
    }
  };

  const handleAdminClassNameChange = (rowId: string, newClassName: string) => {
    setAdminDraftRows((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              className: newClassName
            }
          : row
      )
    );
  };

  const handleAdminLiveToggle = (rowId: string) => {
    setAdminDraftRows((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              links: {
                ...row.links,
                hasLiveClass: !isLiveEnabledForRecord(row.links)
              }
            }
          : row
      )
    );
  };

  const allDraftRowsHaveLive = useMemo(
    () =>
      adminDraftRows.length > 0 &&
      adminDraftRows.every((row) => isLiveEnabledForRecord(row.links)),
    [adminDraftRows]
  );

  const activeLiveRowCount = useMemo(
    () => adminDraftRows.filter((row) => isLiveEnabledForRecord(row.links)).length,
    [adminDraftRows]
  );

  const handleToggleAllRowsLive = () => {
    const nextState = !allDraftRowsHaveLive;
    setAdminDraftRows((prev) =>
      prev.map((row) => ({
        ...row,
        links: {
          ...row.links,
          hasLiveClass: nextState
        }
      }))
    );
  };

  const handleAdminInputChange = (
    rowId: string,
    fieldType: LmsContentTabType,
    value: string
  ) => {
    setAdminDraftRows((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              links: {
                ...row.links,
                [fieldType]: value
              }
            }
          : row
      )
    );
  };

  const handleAddClassRow = () => {
    const existingNames = new Set(adminDraftRows.map((r) => r.className.trim()));
    const nextNum = adminDraftRows.length + 1;
    let newClassKey = `Class ${String(nextNum).padStart(2, '0')}`;
    let counter = nextNum;
    while (existingNames.has(newClassKey)) {
      counter += 1;
      newClassKey = `Class ${String(counter).padStart(2, '0')}`;
    }

    setAdminDraftRows((prev) => [
      ...prev,
      {
        id: `lms-row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        originalClassName: newClassKey,
        className: newClassKey,
        links: {
          hasLiveClass: true,
          live: '',
          recorded: '',
          note: '',
          ppt: '',
          mcq: ''
        }
      }
    ]);
  };

  const handleRemoveClassRow = (rowId: string) => {
    if (adminDraftRows.length <= 1) return;
    setAdminDraftRows((prev) => prev.filter((row) => row.id !== rowId));
  };

  const handleSaveAdminChanges = async () => {
    const cleaned: LmsPortalDataMap = {};
    let updatedCurrentClass = currentClass;

    adminDraftRows.forEach((row, index) => {
      const fallbackName = `Class ${String(index + 1).padStart(2, '0')}`;
      let baseName = row.className.trim() || fallbackName;
      let finalName = baseName;
      let dupCounter = 2;
      while (cleaned[finalName]) {
        finalName = `${baseName} (${dupCounter})`;
        dupCounter += 1;
      }

      if (row.originalClassName === currentClass) {
        updatedCurrentClass = finalName;
      }

      const hasLive = isLiveEnabledForRecord(row.links);

      cleaned[finalName] = {
        hasLiveClass: hasLive,
        live: (row.links.live || '').trim(),
        recorded: (row.links.recorded || '').trim(),
        note: (row.links.note || '').trim(),
        ppt: (row.links.ppt || '').trim(),
        mcq: (row.links.mcq || '').trim()
      };
    });

    setLmsData(cleaned);
    setAdminDraftRows(createDraftRowsFromMap(cleaned));
    const targetClass = cleaned[updatedCurrentClass]
      ? updatedCurrentClass
      : Object.keys(cleaned)[0] || 'Class 01';
    setCurrentClass(targetClass);

    if (!isLiveEnabledForRecord(cleaned[targetClass]) && currentTab === 'live') {
      setCurrentTab('recorded');
    }

    await saveLmsPortalData(cleaned, selectedPortalCourseId);
    showToast(
      `Saved content for "${selectedCourseOption.title}"! Changes are now live on the Student Dashboard.`
    );
    setIsAdminView(false);
  };

  const handleConfirmResetDefaults = async () => {
    const defaults = cloneDefaultLmsData();
    setAdminDraftRows(createDraftRowsFromMap(defaults));
    setLmsData(defaults);
    setCurrentClass('Class 01');
    setCurrentTab('live');
    setConfirmResetOpen(false);
    await saveLmsPortalData(defaults, selectedPortalCourseId);
    showToast(`Reset "${selectedCourseOption.title}" links to default settings.`);
  };

  const effectiveTab: LmsContentTabType =
    !hasLiveForCurrentClass && currentTab === 'live' ? 'recorded' : currentTab;
  const activeUrl = lmsData[currentClass]?.[effectiveTab] || '';
  const embedState = resolveEmbedBehavior(activeUrl);
  const currentTabMeta =
    CONTENT_TABS.find((t) => t.id === effectiveTab) || CONTENT_TABS[1];
  const currentTabLabel = currentTabMeta.label;
  const CurrentTabIcon = currentTabMeta.icon;

  const currentClassIndex = classKeys.indexOf(currentClass);
  const prevClassKey = currentClassIndex > 0 ? classKeys[currentClassIndex - 1] : null;
  const nextClassKey =
    currentClassIndex >= 0 && currentClassIndex < classKeys.length - 1
      ? classKeys[currentClassIndex + 1]
      : null;

  const currentClassAvailableTabs = useMemo(() => {
    const clsRecord = lmsData[currentClass];
    if (!clsRecord) return [];
    return visibleTabsForCurrentClass.filter((t) =>
      Boolean((clsRecord[t.id] || '').trim())
    );
  }, [lmsData, currentClass, visibleTabsForCurrentClass]);

  const getLessonIdForClass = (clsName: string, idx: number): string => {
    const trimmed = (clsName || '').trim();
    if (/^(?:class\s*|cls_?\s*)0*\d+$/i.test(trimmed)) {
      return trimmed;
    }
    return `cls_${String(idx >= 0 ? idx + 1 : 1).padStart(2, '0')}`;
  };

  const currentLessonId = getLessonIdForClass(currentClass, currentClassIndex);
  const isCurrentLessonCompleted = isLessonCompleted(
    selectedPortalCourseId,
    currentLessonId
  );

  const completedClassCount = useMemo(
    () =>
      classKeys.filter((clsName, idx) =>
        isLessonCompleted(selectedPortalCourseId, getLessonIdForClass(clsName, idx))
      ).length,
    [classKeys, isLessonCompleted, selectedPortalCourseId]
  );

  // Compute the next uncompleted lesson in the most recently accessed course
  const nextUncompletedTarget = useMemo(() => {
    const contextTarget = getFirstUncompletedLesson(selectedPortalCourseId);
    // Also verify against the live `classKeys` of the active course
    const targetCourseId = contextTarget.portalCourseId || selectedPortalCourseId;
    const targetMap =
      targetCourseId === selectedPortalCourseId ? lmsData : loadLmsPortalData(targetCourseId);
    const targetKeys = Object.keys(targetMap);

    for (let idx = 0; idx < targetKeys.length; idx++) {
      const clsName = targetKeys[idx];
      const lessonId = getLessonIdForClass(clsName, idx);
      if (!isLessonCompleted(targetCourseId, lessonId)) {
        const courseOpt = resolveAcademyCourseOption(targetCourseId) || selectedCourseOption;
        return {
          ...contextTarget,
          portalCourseId: targetCourseId,
          lessonId,
          className: clsName,
          lessonIndex: idx,
          allCompleted: false,
          routeUrl: `${courseOpt.dashboardPath}?lesson=${encodeURIComponent(
            lessonId
          )}&class=${encodeURIComponent(clsName)}`
        };
      }
    }

    const fallbackCls = targetKeys[0] || 'Class 01';
    const fallbackOpt = resolveAcademyCourseOption(targetCourseId) || selectedCourseOption;
    return {
      ...contextTarget,
      portalCourseId: targetCourseId,
      lessonId: getLessonIdForClass(fallbackCls, 0),
      className: fallbackCls,
      lessonIndex: 0,
      allCompleted: true,
      routeUrl: `${fallbackOpt.dashboardPath}?lesson=cls_01&class=${encodeURIComponent(
        fallbackCls
      )}`
    };
  }, [getFirstUncompletedLesson, isLessonCompleted, lmsData, selectedPortalCourseId, selectedCourseOption]);

  const handleContinueLearning = () => {
    const target = nextUncompletedTarget;
    const targetCourseId = target.portalCourseId || selectedPortalCourseId;

    if (targetCourseId !== selectedPortalCourseId) {
      setSelectedPortalCourseId(targetCourseId);
      const nextData = loadLmsPortalData(targetCourseId);
      setLmsData(nextData);
      setAdminDraftRows(createDraftRowsFromMap(nextData));
    }

    setIsAdminView(false);
    setCurrentClass(target.className);
    recordCourseAccess(targetCourseId);
    navigate(target.routeUrl);

    showToast(
      target.allCompleted
        ? `All lessons completed! Reviewing ${target.className}.`
        : `Continuing learning at ${target.className} (First uncompleted lesson).`
    );
  };

  // Per-module time spent state (minutes), persisted to localStorage
  const [moduleTimeMap, setModuleTimeMap] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem('lms_portal_module_time_spent_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {
      // ignore
    }
    return {};
  });

  // Automatically increment study time by 1 minute for the active class while in Student View
  useEffect(() => {
    if (isAdminView || !currentClass) return;
    const timer = setInterval(() => {
      const key = `${selectedPortalCourseId}__${currentClass}`;
      setModuleTimeMap((prev) => {
        const currentMins = prev[key];
        const nextVal = (typeof currentMins === 'number' ? currentMins : 25) + 1;
        const next = { ...prev, [key]: nextVal };
        try {
          localStorage.setItem('lms_portal_module_time_spent_v1', JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    }, 60000);
    return () => clearInterval(timer);
  }, [isAdminView, currentClass, selectedPortalCourseId]);

  const handleAddStudyMinutes = (targetClassName: string, minutesToAdd: number) => {
    const key = `${selectedPortalCourseId}__${targetClassName}`;
    setModuleTimeMap((prev) => {
      const idx = classKeys.indexOf(targetClassName);
      const lessonId = getLessonIdForClass(targetClassName, idx >= 0 ? idx : 0);
      const completed = isLessonCompleted(selectedPortalCourseId, lessonId);
      const defaultBase = completed ? 45 + Math.max(0, idx) * 5 : idx === 1 ? 28 : 12;
      const base = typeof prev[key] === 'number' ? prev[key] : defaultBase;
      const next = { ...prev, [key]: Math.max(0, base + minutesToAdd) };
      try {
        localStorage.setItem('lms_portal_module_time_spent_v1', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    showToast(`Logged +${minutesToAdd} mins study time for ${targetClassName}.`);
  };

  const moduleProgressMetrics = useMemo<ModuleProgressMetric[]>(() => {
    return classKeys.map((clsName, idx) => {
      const lessonId = getLessonIdForClass(clsName, idx);
      const isCompleted = isLessonCompleted(selectedPortalCourseId, lessonId);
      const clsRecord = lmsData[clsName];
      const clsHasLive = isLiveEnabledForRecord(clsRecord);
      const enabledTabs = CONTENT_TABS.filter((t) => (t.id === 'live' ? clsHasLive : true));
      const readyCount = clsRecord
        ? enabledTabs.filter((t) => Boolean((clsRecord[t.id] || '').trim())).length
        : 0;

      const completionRate = isCompleted
        ? 100
        : clsName === currentClass
          ? Math.max(35, idx === 1 ? 55 : 35)
          : idx === 1
            ? 50
            : readyCount > 0
              ? 20
              : 0;

      const timeKey = `${selectedPortalCourseId}__${clsName}`;
      const defaultMinutes = isCompleted
        ? 45 + idx * 5
        : completionRate >= 50
          ? 28
          : completionRate > 0
            ? 15
            : 5;
      const timeSpentMinutes =
        typeof moduleTimeMap[timeKey] === 'number' ? moduleTimeMap[timeKey] : defaultMinutes;

      return {
        className: clsName,
        shortLabel: `C${String(idx + 1).padStart(2, '0')}`,
        lessonId,
        isCompleted,
        completionRate,
        timeSpentMinutes,
        materialsReadyCount: readyCount,
        totalMaterialsCount: enabledTabs.length
      };
    });
  }, [classKeys, currentClass, isLessonCompleted, lmsData, moduleTimeMap, selectedPortalCourseId]);

  const handleToggleModuleCompleteFromDashboard = (clsName: string, lessonId: string) => {
    const nextState = toggleLessonCompletion(selectedPortalCourseId, lessonId);
    showToast(
      nextState
        ? `${clsName} marked as completed.`
        : `${clsName} marked as incomplete.`
    );
  };

  const handleToggleCurrentLessonComplete = () => {
    const nextState = toggleLessonCompletion(selectedPortalCourseId, currentLessonId);
    showToast(
      nextState
        ? `${currentClass} marked as completed.`
        : `${currentClass} marked as incomplete.`
    );
  };

  const dynamicTitle = isAdminView
    ? `Admin Content Management – ${selectedCourseOption.title} | LMS Portal`
    : `${currentClass}: ${currentTabLabel} – ${selectedCourseOption.title} | LMS Portal`;
  const dynamicDescription = isAdminView
    ? `Manage class links for Live Class, Recorded Video, Note, PPT, and MCQ across ${classKeys.length} classes for ${selectedCourseOption.title}.`
    : `Access ${currentTabLabel} materials for ${currentClass} in ${selectedCourseOption.title} on the Accounticca & E-Lawyers LMS Portal.`;

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f7f6] text-[#333]">
      <ServiceSEO
        title={dynamicTitle}
        description={dynamicDescription}
        serviceType="Student Learning Management System"
        canonicalUrl={selectedCourseOption.dashboardPath}
      />

      {/* LMS Portal Header */}
      <header className="bg-white/95 backdrop-blur-md px-4 sm:px-8 py-4 flex flex-wrap justify-between items-center gap-4 border-b border-slate-200/90 shadow-[0_2px_12px_-3px_rgba(30,78,117,0.08)] z-10">
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e4e75] to-[#153a58] text-white flex items-center justify-center shadow-xs shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#1e4e75]">
                LMS Portal
              </h1>
              <span className="hidden sm:inline-block text-slate-300" aria-hidden="true">
                ·
              </span>
              <span className="hidden sm:inline-block text-xs font-medium text-slate-500">
                {!isAdminView
                  ? `${currentClass} of ${classKeys.length} · ${currentTabLabel}`
                  : `${adminDraftRows.length} Modules Configured`}
              </span>
              <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-600">
                {selectedCourseOption.dashboardPath}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 max-w-full sm:max-w-md md:max-w-xl">
              <select
                value={selectedPortalCourseId}
                onChange={(e) => handleCourseDropdownChange(e.target.value)}
                aria-label="Select Academy Course from /training"
                title={
                  isAdminView
                    ? 'Select an Academy course to open its Admin Content Management panel'
                    : `Active Academy Course: ${selectedCourseOption.title} (${selectedCourseOption.dashboardPath})`
                }
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50/90 hover:bg-white hover:border-[#1e4e75] text-xs sm:text-sm font-semibold text-[#1e4e75] shadow-2xs transition-all cursor-pointer focus:outline-none focus:border-[#1e4e75] focus:ring-2 focus:ring-[#1e4e75]/25 truncate"
              >
                {academyCourseOptions.map((courseOpt) => (
                  <option key={courseOpt.id} value={courseOpt.id}>
                    {courseOpt.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {statusBanner && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{statusBanner}</span>
            </div>
          )}

          <button
            id="continue-learning-btn"
            type="button"
            onClick={handleContinueLearning}
            title={
              nextUncompletedTarget.allCompleted
                ? `All lessons completed — Review ${nextUncompletedTarget.className}`
                : `Resume at first uncompleted lesson: ${nextUncompletedTarget.className} (${selectedCourseOption.title})`
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
          >
            <PlayCircle className="w-4 h-4 text-emerald-100 shrink-0" />
            <span>Continue Learning</span>
            <span className="hidden sm:inline-block text-[11px] font-mono bg-emerald-700/80 text-emerald-100 px-1.5 py-0.5 rounded">
              {nextUncompletedTarget.className}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsExamModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold border border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100 hover:border-slate-300 hover:text-[#1e4e75] cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4e75]/30"
          >
            <FileCheck2 className="w-4 h-4 text-[#1e4e75]" />
            <span>Final Exam</span>
          </button>

          <button
            type="button"
            onClick={handleToggleView}
            title={
              isAdminView
                ? 'Return to Student Learning View'
                : 'Restricted to Authorized Admin (hmekram@gmail.com)'
            }
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm border border-[#1e4e75] text-[#1e4e75] bg-white hover:bg-[#1e4e75] hover:text-white shadow-2xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4e75]/40"
          >
            {!isAdminView && <Lock className="w-3.5 h-3.5 shrink-0" />}
            <span>{isAdminView ? 'Switch to Student Page' : 'Switch to Admin Page'}</span>
          </button>
        </div>
      </header>

      {/* Dynamic Breadcrumbs Navigation for Student Portal */}
      <div className="bg-white/95 border-b border-slate-200/80 px-4 sm:px-8 py-2">
        <Breadcrumbs
          inline
          showBackButton
          className="text-xs"
          items={[
            { label: 'Training Academy', path: '/training' },
            { label: 'Student Portal', path: '/student/dashboard' },
            { label: selectedCourseOption.title, path: selectedCourseOption.dashboardPath },
            { label: `${currentClass}${currentTab ? ` · ${currentTabLabel}` : ''}` }
          ]}
        />
      </div>

      {/* Academy Courses Directory Bar (/student/dashboard/:courseSlug pages from /training) */}
      <nav
        aria-label="Academy Courses Pages"
        className="bg-slate-900 text-white px-4 sm:px-8 py-2.5 border-b border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar"
      >
        <Link
          to="/training"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold border border-slate-700 shrink-0 transition-colors"
          title="Back to /training Academy Hub"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>/training Courses:</span>
        </Link>

        {academyCourseOptions.map((courseOpt) => {
          const isCurrentCourse = courseOpt.id === selectedPortalCourseId;
          return (
            <Link
              key={courseOpt.id}
              to={courseOpt.dashboardPath}
              onClick={(e) => {
                e.preventDefault();
                handleCourseDropdownChange(courseOpt.id);
              }}
              title={`${courseOpt.title} (${courseOpt.dashboardPath})`}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-all border ${
                isCurrentCourse
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-2xs'
                  : 'bg-slate-800/70 text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>{courseOpt.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Views Container */}
      <div id="app-container" className="flex-1 flex flex-col overflow-hidden relative">
        {!isAdminView ? (
          /* --- STUDENT VIEW --- */
          <div
            id="student-view"
            onContextMenu={(e) => e.preventDefault()}
            className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[640px]"
          >
            {/* Left Sidebar */}
            <aside
              className={`${
                isSidebarCollapsed ? 'w-full md:w-[68px]' : 'w-full md:w-[272px]'
              } bg-gradient-to-b from-[#1a4568] via-[#1e4e75] to-[#153a58] text-white flex flex-col overflow-y-auto shrink-0 border-b md:border-b-0 md:border-r border-white/10 select-none transition-all duration-300 ease-in-out`}
            >
              <div
                onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsSidebarCollapsed((prev) => !prev);
                  }
                }}
                title={
                  isSidebarCollapsed
                    ? 'নেভিগেশন বার বড় করুন (Expand Curriculum Sidebar)'
                    : 'নেভিগেশন বার ছোট করুন (Collapse Curriculum Sidebar)'
                }
                aria-expanded={!isSidebarCollapsed}
                className={`${
                  isSidebarCollapsed
                    ? 'px-2.5 py-3.5 justify-center'
                    : 'px-4 py-3.5 justify-between'
                } border-b border-white/10 flex items-center bg-black/15 hover:bg-black/25 cursor-pointer transition-all group`}
              >
                <div
                  className={`flex items-center gap-2.5 min-w-0 ${
                    isSidebarCollapsed ? 'md:hidden' : ''
                  }`}
                >
                  <Layers className="w-4 h-4 text-sky-300 shrink-0" />
                  <span className="font-bold tracking-tight text-[1rem] text-white truncate">
                    Class Curriculum
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!isSidebarCollapsed && (
                    <span className="text-xs font-mono tabular-nums text-sky-200/80">
                      {classKeys.length} Classes
                    </span>
                  )}
                  <span
                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white/10 group-hover:bg-sky-400/25 text-sky-200 group-hover:text-white border border-white/15 group-hover:border-sky-300/40 shadow-2xs transition-all"
                    aria-hidden="true"
                  >
                    {isSidebarCollapsed ? (
                      <PanelLeftOpen className="w-4 h-4" />
                    ) : (
                      <PanelLeftClose className="w-4 h-4" />
                    )}
                  </span>
                </div>
              </div>

              <ul
                className={`list-none m-0 p-2 flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible flex-1 ${
                  isSidebarCollapsed ? 'md:items-center' : ''
                }`}
              >
                {classKeys.map((className, idx) => {
                  const isActive = className === currentClass;
                  const classRecord = lmsData[className];
                  const classHasLive = isLiveEnabledForRecord(classRecord);
                  const enabledTabsForClass = CONTENT_TABS.filter((t) =>
                    t.id === 'live' ? classHasLive : true
                  );
                  const readyCount = classRecord
                    ? enabledTabsForClass.filter((t) =>
                        Boolean((classRecord[t.id] || '').trim())
                      ).length
                    : 0;
                  const formattedIndex = String(idx + 1).padStart(2, '0');
                  const itemLessonId = getLessonIdForClass(className, idx);
                  const isItemCompleted = isLessonCompleted(
                    selectedPortalCourseId,
                    itemLessonId
                  );

                  return (
                    <li
                      key={className}
                      onClick={() => setCurrentClass(className)}
                      title={`${className} (${
                        isItemCompleted ? 'Completed · ' : ''
                      }${readyCount}/${enabledTabsForClass.length} materials ready)`}
                      className={`group ${
                        isSidebarCollapsed
                          ? 'px-2.5 py-2.5 md:w-11 md:h-11 justify-center'
                          : 'px-3.5 py-3 justify-between'
                      } rounded-lg cursor-pointer transition-all text-[0.925rem] whitespace-nowrap select-none flex items-center gap-3 ${
                        isActive
                          ? 'bg-white text-[#153a58] font-bold shadow-sm'
                          : 'hover:bg-white/10 text-white/90 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-6 h-6 rounded-md text-xs font-mono tabular-nums flex items-center justify-center shrink-0 transition-colors ${
                            isItemCompleted
                              ? isActive
                                ? 'bg-emerald-600 text-white font-bold'
                                : 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40'
                              : isActive
                                ? 'bg-[#1e4e75] text-white font-bold'
                                : 'bg-white/10 text-sky-200 group-hover:bg-white/20'
                          }`}
                        >
                          {isItemCompleted ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            formattedIndex
                          )}
                        </span>
                        <span
                          className={`truncate ${
                            isSidebarCollapsed ? 'hidden' : ''
                          }`}
                        >
                          {className}
                        </span>
                      </div>

                      {!isSidebarCollapsed && (
                        <div className="hidden md:flex items-center gap-1.5 shrink-0">
                          {isItemCompleted && (
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                isActive
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-emerald-500/20 text-emerald-200'
                              }`}
                            >
                              Done
                            </span>
                          )}
                          <span
                            className={`text-[11px] font-mono tabular-nums transition-colors ${
                              isActive
                                ? 'text-[#1e4e75]/80 font-semibold'
                                : readyCount > 0
                                  ? 'text-sky-200/75'
                                  : 'text-white/35'
                            }`}
                            title={`${readyCount} of ${enabledTabsForClass.length} materials published`}
                          >
                            {readyCount}/{enabledTabsForClass.length}
                          </span>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>

              {!isSidebarCollapsed && (
                <div className="hidden md:flex flex-col gap-2 p-4 border-t border-white/10 bg-black/15 text-xs text-sky-100/80">
                  <button
                    id="sidebar-continue-learning-btn"
                    type="button"
                    onClick={handleContinueLearning}
                    className="w-full mb-1 py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <span className="inline-flex items-center gap-1.5 truncate">
                      <PlayCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Continue Learning</span>
                    </span>
                    <span className="font-mono text-[11px] bg-black/15 px-1.5 py-0.5 rounded inline-flex items-center gap-1 shrink-0">
                      <span>{nextUncompletedTarget.className}</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </button>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Active Module</span>
                    <span className="font-semibold text-white">{currentClass}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Course Progress</span>
                    <span className="font-mono tabular-nums text-emerald-300 font-semibold">
                      {completedClassCount} of {classKeys.length} Completed
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Live Session</span>
                    <span className="font-semibold text-sky-200">
                      {hasLiveForCurrentClass ? 'Scheduled' : 'Not Scheduled'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Published Items</span>
                    <span className="font-mono tabular-nums text-sky-200 font-semibold">
                      {currentClassAvailableTabs.length} of {visibleTabsForCurrentClass.length}
                    </span>
                  </div>
                </div>
              )}
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col bg-white overflow-hidden">
              {/* Top Horizontal Tabs (Mobile-Enhanced Grid + Desktop Tab Strip) */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-[#1e4e75] p-2.5 sm:px-6 sm:pt-2 sm:pb-0 border-b border-[#153a58] shrink-0 gap-2 sm:gap-1">
                <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 sm:gap-1 w-full sm:w-auto sm:overflow-x-auto">
                  {visibleTabsForCurrentClass.map((tab) => {
                    const isActive = tab.id === effectiveTab;
                    const TabIcon = tab.icon;
                    const hasContent = Boolean((lmsData[currentClass]?.[tab.id] || '').trim());

                    return (
                      <button
                        key={tab.id}
                        type="button"
                        data-type={tab.id}
                        onClick={() => setCurrentTab(tab.id)}
                        className={`group relative min-h-[42px] sm:min-h-0 px-3 sm:px-5 py-2 sm:py-3.5 rounded-lg sm:rounded-b-none sm:rounded-t-lg whitespace-nowrap transition-all text-xs sm:text-[0.925rem] border sm:border-0 sm:border-b-[3px] cursor-pointer select-none inline-flex items-center justify-between sm:justify-start gap-2 ${
                          isActive
                            ? 'text-white bg-[#2a6b9e] border-sky-300/70 sm:border-b-sky-300 font-bold shadow-xs sm:shadow-[0_-2px_10px_rgba(0,0,0,0.12)]'
                            : 'text-white/85 bg-white/5 sm:bg-transparent border-white/10 sm:border-b-transparent hover:text-white hover:bg-white/10 font-medium'
                        }`}
                      >
                        <span className="inline-flex items-center gap-1.5 sm:gap-2 min-w-0 truncate">
                          <TabIcon
                            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform group-hover:scale-105 ${
                              isActive ? 'text-sky-200' : 'text-white/70 group-hover:text-white'
                            }`}
                          />
                          <span className="truncate">{tab.label}</span>
                        </span>
                        {hasContent && (
                          <span
                            className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-white/10 text-sky-200/90'
                            }`}
                          >
                            Ready
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Quick Class Stepper (Visible on Mobile & Desktop inside Tab Bar) */}
                <div className="flex items-center justify-between sm:justify-end gap-2 pt-1.5 sm:pt-0 sm:pb-1.5 sm:pl-4 border-t border-white/10 sm:border-t-0 shrink-0">
                  <span className="text-[11px] font-medium text-sky-200/90 sm:hidden truncate">
                    Module: <strong className="text-white">{currentClass}</strong>
                  </span>
                  <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                    <button
                      type="button"
                      disabled={!prevClassKey}
                      onClick={() => prevClassKey && setCurrentClass(prevClassKey)}
                      title={prevClassKey ? `Previous: ${prevClassKey}` : 'First Class'}
                      className="px-2 py-1 sm:p-1.5 rounded-md bg-white/10 sm:bg-transparent text-white/90 hover:text-white hover:bg-white/15 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors inline-flex items-center gap-1 text-xs"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="sm:hidden font-semibold">Prev</span>
                    </button>
                    <span className="text-xs font-mono tabular-nums text-sky-100 px-1.5">
                      {currentClassIndex + 1} / {classKeys.length}
                    </span>
                    <button
                      type="button"
                      disabled={!nextClassKey}
                      onClick={() => nextClassKey && setCurrentClass(nextClassKey)}
                      title={nextClassKey ? `Next: ${nextClassKey}` : 'Last Class'}
                      className="px-2 py-1 sm:p-1.5 rounded-md bg-white/10 sm:bg-transparent text-white/90 hover:text-white hover:bg-white/15 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors inline-flex items-center gap-1 text-xs"
                    >
                      <span className="sm:hidden font-semibold">Next</span>
                      <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content Display Area (Anti-copy protected for students) */}
              <div
                id="content-display"
                className={`flex-1 ${
                  isSidebarCollapsed
                    ? 'p-2 sm:p-4 lg:p-5'
                    : 'p-4 sm:p-6 lg:p-8'
                } overflow-y-auto select-none bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] flex flex-col gap-3 transition-all duration-300`}
              >
                {/* Certificate Expiry & Renewal Notification Banner */}
                {(() => {
                  const certEligibility = getCertificateEligibility(selectedPortalCourseId);
                  const activeCert =
                    certEligibility.certificate ||
                    allCertificates.find((c) => c.courseId === selectedPortalCourseId && c.status === 'Valid');
                  if (!activeCert) return null;

                  const issueDateStr = activeCert.issueDate;
                  const expiryDateStr =
                    activeCert.expiryDate ||
                    (() => {
                      const d = new Date(issueDateStr);
                      d.setFullYear(d.getFullYear() + 1);
                      return d.toISOString().split('T')[0];
                    })();
                  const today = new Date();
                  const expiryDateObj = new Date(expiryDateStr);
                  const diffTime = expiryDateObj.getTime() - today.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  const isExpiringSoon = diffDays <= 30 && diffDays >= 0;
                  const isExpired = diffDays < 0;

                  return (
                    <div
                      className={`rounded-xl border p-4 sm:p-5 shadow-sm transition-all ${
                        isExpired
                          ? 'bg-rose-50 border-rose-300 text-rose-900'
                          : isExpiringSoon
                            ? 'bg-amber-50 border-amber-300 text-amber-900'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              isExpired || isExpiringSoon
                                ? 'bg-amber-500/20 text-amber-700'
                                : 'bg-emerald-500/20 text-emerald-700'
                            }`}
                          >
                            <Award className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm sm:text-base font-bold">
                                Verified Course Completion Certificate ({activeCert.certificateId})
                              </h3>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                                  isExpired
                                    ? 'bg-rose-600 text-white'
                                    : isExpiringSoon
                                      ? 'bg-amber-600 text-white'
                                      : 'bg-emerald-600 text-white'
                                }`}
                              >
                                {isExpired
                                  ? 'Expired'
                                  : isExpiringSoon
                                    ? `Expiring in ${diffDays} Days`
                                    : 'Active & Valid'}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm mt-1 opacity-90 leading-relaxed">
                              Issued on <strong className="font-mono">{activeCert.issueDate}</strong> · Certificate Expiry Date:{' '}
                              <strong className="font-mono underline">{expiryDateStr}</strong>
                              {isExpiringSoon && (
                                <span className="block mt-1 font-semibold text-amber-800">
                                  Warning: Your professional certificate needs renewal within {diffDays} days to maintain active standing on Accounticca & E-Lawyers professional registry.
                                </span>
                              )}
                              {isExpired && (
                                <span className="block mt-1 font-semibold text-rose-800">
                                  Notice: This certificate has expired. Please submit a renewal application to recertify.
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setActiveCertificateModal(activeCert)}
                            className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-[#1e4e75] border border-slate-300 font-bold text-xs shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <FileCheck2 className="w-4 h-4" />
                            <span>View Certificate</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              showToast(
                                `Renewal application submitted for ${activeCert.certificateId}. Our compliance team will review within 24 hours.`
                              )
                            }
                            className={`px-3.5 py-2 rounded-lg text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                              isExpiringSoon || isExpired
                                ? 'bg-amber-600 hover:bg-amber-700'
                                : 'bg-[#1e4e75] hover:bg-[#153a58]'
                            }`}
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>{isExpiringSoon || isExpired ? 'Request Renewal' : 'Renew / Recertify'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Contextual Module & Resource Header Bar */}
                <div className="bg-white rounded-xl border border-slate-200/90 px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#1e4e75]/10 text-[#1e4e75] flex items-center justify-center shrink-0">
                      <CurrentTabIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <span className="font-semibold text-[#1e4e75]">{currentClass}</span>
                        <span aria-hidden="true">·</span>
                        <span>{ currentTabMeta.shortDesc }</span>
                      </div>
                      <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                        {currentClass} — {currentTabLabel}
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-auto">
                    <label
                      htmlFor="lesson-complete-checkbox"
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs sm:text-sm font-semibold cursor-pointer select-none transition-all shadow-2xs ${
                        isCurrentLessonCompleted
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100/80'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-[#1e4e75]/40'
                      }`}
                      title={
                        isCurrentLessonCompleted
                          ? 'Lesson completed — click to mark as incomplete'
                          : 'Click to mark this lesson as complete'
                      }
                    >
                      <input
                        id="lesson-complete-checkbox"
                        type="checkbox"
                        checked={isCurrentLessonCompleted}
                        onChange={handleToggleCurrentLessonComplete}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500/30 accent-emerald-600 cursor-pointer"
                      />
                      <span>Mark as Complete</span>
                    </label>

                    <span className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-500">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Protected Student View</span>
                    </span>

                    <a
                      href={embedState.originalUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-hidden="true"
                      tabIndex={-1}
                      className="hidden"
                    >
                      <span>Open in New Tab</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {embedState.isEmpty ? (
                  <div className="flex-1 flex flex-col items-center justify-center min-h-[420px] bg-white rounded-xl border border-slate-200/80 p-8 text-center shadow-2xs">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1.5">
                      No {currentTabLabel} Published for {currentClass} Yet
                    </h3>
                    <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
                      The instructor has not attached a {currentTabLabel.toLowerCase()} resource link for{' '}
                      <strong className="text-slate-700">{currentClass}</strong> yet. Please check another resource tab or select a different class from the curriculum sidebar.
                    </p>

                    {currentClassAvailableTabs.length > 0 ? (
                      <div className="flex flex-col items-center gap-2.5">
                        <span className="text-xs font-medium text-slate-500">
                          Available materials in {currentClass}:
                        </span>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          {currentClassAvailableTabs.map((availTab) => {
                            const AvailIcon = availTab.icon;
                            return (
                              <button
                                key={availTab.id}
                                type="button"
                                onClick={() => setCurrentTab(availTab.id)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1e4e75] hover:bg-[#153a58] text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                              >
                                <AvailIcon className="w-3.5 h-3.5" />
                                <span>View {availTab.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Administrators can publish class links using the Admin Page button above.</span>
                      </div>
                    )}
                  </div>
                ) : (embedState.canEmbed && embedState.embedUrl) ? (
                  <div className="flex-1 flex flex-col min-h-[calc(100vh-13.5rem)] bg-white rounded-xl border border-slate-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden">
                    <iframe
                      title={`${currentClass} - ${effectiveTab}`}
                      src={embedState.embedUrl}
                      className="w-full flex-1 min-h-[calc(100vh-13.5rem)] border-0 bg-white"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center min-h-[420px] text-center bg-white rounded-xl border border-slate-200/90 shadow-2xs p-8">
                    <div className="w-14 h-14 rounded-2xl bg-[#1e4e75]/10 text-[#1e4e75] flex items-center justify-center mb-4">
                      <CurrentTabIcon className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      Launch {currentClass} — {currentTabLabel}
                    </h3>
                    <p className="mb-6 text-slate-600 text-sm sm:text-base max-w-xl leading-relaxed">
                      This session or material is hosted on an external platform (such as Zoom or Google Workspace) that requires opening in a dedicated browser tab for security and full interactive features.
                    </p>
                    <a
                      href={embedState.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 rounded-xl bg-[#1e4e75] hover:bg-[#153a58] text-white font-bold text-sm no-underline transition-all shadow-sm hover:shadow-md inline-flex items-center gap-2"
                    >
                      <span>Open {currentTabLabel} in New Tab</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}

                {/* Student Progress Dashboard (Recharts Completion Rates & Time Spent per Module) */}
                <StudentProgressDashboard
                  courseTitle={selectedCourseOption.title}
                  courseId={selectedPortalCourseId}
                  currentClass={currentClass}
                  moduleMetrics={moduleProgressMetrics}
                  onSelectClass={(targetCls) => {
                    setCurrentClass(targetCls);
                    showToast(`Switched to ${targetCls}`);
                  }}
                  onToggleComplete={handleToggleModuleCompleteFromDashboard}
                  onAddStudyMinutes={handleAddStudyMinutes}
                />
              </div>
            </main>
          </div>
        ) : (
          /* --- ADMIN VIEW --- */
          <div
            id="admin-view"
            className="flex-1 flex flex-col p-4 sm:p-8 bg-[#f4f7f6] overflow-y-auto"
          >
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#1e4e75]">
                  Admin Page - Content Management ({selectedCourseOption.title})
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Configure classes, Live Class visibility, and material links for{' '}
                  <strong className="text-[#1e4e75]">{selectedCourseOption.title}</strong>. Changes will immediately reflect on the Student Dashboard upon saving.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddClassRow}
                className="px-4 py-2 rounded bg-[#1e4e75] hover:bg-[#153a58] text-white font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add Class</span>
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-[0_2px_10px_rgba(0,0,0,0.05)] overflow-x-auto">
              <table className="w-full border-collapse min-w-[960px]">
                <thead>
                  <tr>
                    <th className="p-4 text-left border-b border-[#ddd] bg-[#f8f9fa] font-bold text-[#1e4e75] min-w-[180px]">
                      Class No
                    </th>
                    <th className="p-4 text-left border-b border-[#ddd] bg-[#f8f9fa] font-bold text-[#1e4e75] min-w-[270px]">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Radio className="w-4 h-4 text-[#1e4e75]" />
                          <span>Live Class</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleToggleAllRowsLive}
                          title={
                            allDraftRowsHaveLive
                              ? 'Click to disable Live Class for all sessions'
                              : 'Click to enable Live Class for all sessions'
                          }
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all cursor-pointer select-none ${
                            allDraftRowsHaveLive
                              ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-2xs'
                              : 'bg-white text-slate-600 border-slate-300 hover:border-[#1e4e75] hover:text-[#1e4e75]'
                          }`}
                        >
                          {allDraftRowsHaveLive ? (
                            <CheckSquare className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <Square className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span>
                            All ({activeLiveRowCount}/{adminDraftRows.length})
                          </span>
                        </button>
                      </div>
                    </th>
                    <th className="p-4 text-left border-b border-[#ddd] bg-[#f8f9fa] font-bold text-[#1e4e75]">
                      Recorded Video
                    </th>
                    <th className="p-4 text-left border-b border-[#ddd] bg-[#f8f9fa] font-bold text-[#1e4e75]">
                      Note
                    </th>
                    <th className="p-4 text-left border-b border-[#ddd] bg-[#f8f9fa] font-bold text-[#1e4e75]">
                      PPT
                    </th>
                    <th className="p-4 text-left border-b border-[#ddd] bg-[#f8f9fa] font-bold text-[#1e4e75]">
                      MCQ
                    </th>
                    <th className="p-4 text-center border-b border-[#ddd] bg-[#f8f9fa] font-bold text-[#1e4e75] w-16">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody id="admin-table-body">
                  {adminDraftRows.map((row, idx) => {
                    const rowHasLive = isLiveEnabledForRecord(row.links);
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/60">
                        <td className="p-4 text-left border-b border-[#ddd] whitespace-nowrap min-w-[180px]">
                          <input
                            type="text"
                            data-class={row.className}
                            data-type="className"
                            value={row.className}
                            onChange={(e) =>
                              handleAdminClassNameChange(row.id, e.target.value)
                            }
                            placeholder={`Class ${String(idx + 1).padStart(2, '0')}`}
                            aria-label={`Class No for row ${idx + 1}`}
                            className="w-full p-2.5 border border-[#ddd] rounded text-[0.9rem] font-bold text-[#1e4e75] bg-white focus:outline-none focus:border-[#1e4e75] focus:ring-2 focus:ring-[#1e4e75]/20"
                          />
                        </td>

                        {/* Live Class Cell with Per-Session Tick / Toggle Button + URL Input */}
                        <td className="p-4 text-left border-b border-[#ddd] min-w-[270px]">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleAdminLiveToggle(row.id)}
                              aria-pressed={rowHasLive}
                              title={
                                rowHasLive
                                  ? 'Live Class is ON (Visible on Student Dashboard) — Click to turn OFF'
                                  : 'No Live Class for this session (Hidden on Student Dashboard) — Click to turn ON'
                              }
                              className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-2.5 rounded border text-xs font-bold transition-all cursor-pointer select-none ${
                                rowHasLive
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-2xs'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300'
                              }`}
                            >
                              {rowHasLive ? (
                                <>
                                  <CheckSquare className="w-4 h-4 shrink-0" />
                                  <span>Live ON</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-4 h-4 shrink-0 text-slate-500" />
                                  <span>No Live</span>
                                </>
                              )}
                            </button>

                            <input
                              type="url"
                              data-class={row.className}
                              data-type="live"
                              disabled={!rowHasLive}
                              value={row.links.live || ''}
                              onChange={(e) =>
                                handleAdminInputChange(row.id, 'live', e.target.value)
                              }
                              placeholder={
                                rowHasLive
                                  ? 'Enter live URL'
                                  : 'Hidden on Student Dashboard'
                              }
                              className={`w-full p-2.5 border rounded text-[0.9rem] transition-colors focus:outline-none ${
                                rowHasLive
                                  ? 'border-[#ddd] bg-white text-slate-900 focus:border-[#1e4e75] focus:ring-2 focus:ring-[#1e4e75]/20'
                                  : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                              }`}
                            />
                          </div>
                        </td>

                        {(['recorded', 'note', 'ppt', 'mcq'] as LmsContentTabType[]).map(
                          (type) => (
                            <td key={type} className="p-4 text-left border-b border-[#ddd]">
                              <input
                                type="url"
                                data-class={row.className}
                                data-type={type}
                                value={row.links[type] || ''}
                                onChange={(e) =>
                                  handleAdminInputChange(row.id, type, e.target.value)
                                }
                                placeholder={`Enter ${type} URL`}
                                className="w-full p-2.5 border border-[#ddd] rounded text-[0.9rem] focus:outline-none focus:border-[#1e4e75] focus:ring-2 focus:ring-[#1e4e75]/20"
                              />
                            </td>
                          )
                        )}
                        <td className="p-4 text-center border-b border-[#ddd]">
                          <button
                            type="button"
                            onClick={() => handleRemoveClassRow(row.id)}
                            disabled={adminDraftRows.length <= 1}
                            title={`Delete ${row.className || `Row ${idx + 1}`}`}
                            className="p-2 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Reset Confirmation Banner (In-UI replacement for window.confirm) */}
            {confirmResetOpen && (
              <div className="mt-4 p-4 rounded-lg bg-amber-50 border border-amber-200 flex flex-wrap items-center justify-between gap-3 text-sm text-amber-900">
                <span>
                  Are you sure you want to reset all links to default?
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmResetOpen(false)}
                    className="px-3 py-1.5 rounded border border-amber-300 bg-white text-amber-900 font-semibold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmResetDefaults}
                    className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer"
                  >
                    Yes, Reset to Defaults
                  </button>
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div className="mt-8 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(true)}
                className="px-4 py-2.5 rounded font-bold text-sm border border-[#1e4e75] text-[#1e4e75] bg-transparent hover:bg-[#1e4e75] hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset to Defaults</span>
              </button>
              <button
                type="button"
                onClick={handleSaveAdminChanges}
                className="px-5 py-2.5 rounded font-bold text-sm bg-[#1e4e75] hover:bg-[#153a58] text-white transition-colors cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Final Examination Modal */}
      <FinalExamModal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        course={activeCourse}
        onOpenCertificate={(cert) => setActiveCertificateModal(cert)}
      />

      {/* Official Certificate Viewer & PDF Generator Modal */}
      <LmsCertificateViewerModal
        isOpen={activeCertificateModal !== null}
        onClose={() => setActiveCertificateModal(null)}
        certificate={activeCertificateModal}
      />

      {/* Admin Access Verification Modal */}
      {isAdminAuthModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lms-admin-auth-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-[#1e4e75] to-[#153a58] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-sky-200" />
                </div>
                <div>
                  <h3 id="lms-admin-auth-title" className="text-sm sm:text-base font-bold">
                    Admin Access Required
                  </h3>
                  <p className="text-[11px] text-sky-100/80">
                    Sign in as authorized LMS administrator to manage content
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAdminAuthModalOpen(false);
                  setAdminAuthError(null);
                }}
                aria-label="Close admin login modal"
                className="p-1.5 rounded-lg text-white/75 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdminAuthSubmit} className="p-6 space-y-4">
              {adminAuthError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-700 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{adminAuthError}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="lms-admin-email"
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                >
                  Admin Email
                </label>
                <input
                  id="lms-admin-email"
                  type="email"
                  required
                  autoFocus
                  value={adminEmailInput}
                  onChange={(e) => {
                    setAdminEmailInput(e.target.value);
                    if (adminAuthError) setAdminAuthError(null);
                  }}
                  placeholder="Enter admin email"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-sm text-slate-900 focus:outline-none focus:border-[#1e4e75] focus:ring-2 focus:ring-[#1e4e75]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="lms-admin-password"
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                >
                  Admin Password
                </label>
                <input
                  id="lms-admin-password"
                  type="password"
                  required
                  value={adminPasswordInput}
                  onChange={(e) => {
                    setAdminPasswordInput(e.target.value);
                    if (adminAuthError) setAdminAuthError(null);
                  }}
                  placeholder="Enter admin password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-sm text-slate-900 focus:outline-none focus:border-[#1e4e75] focus:ring-2 focus:ring-[#1e4e75]/20"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminAuthModalOpen(false);
                    setAdminAuthError(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1e4e75] hover:bg-[#153a58] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Unlock Admin Page</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
