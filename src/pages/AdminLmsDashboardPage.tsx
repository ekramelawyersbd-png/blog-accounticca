import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  SlidersHorizontal,
  Award,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  FileCheck2,
  Users,
  History,
  AlertTriangle,
  RotateCcw,
  ArrowLeft,
  ExternalLink,
  HardDrive,
  RefreshCw,
  Mail
} from 'lucide-react';
import { useLms, CertificateStatus } from '../contexts/LmsContext';
import { LmsR2AssetMetadata } from '../data/lmsCoursesData';
import { R2MaterialUploadCard } from '../components/lms/R2MaterialUploadCard';
import { fetchR2StorageStatus, R2StorageStatus } from '../utils/r2StorageClient';
import { ServiceSEO } from '../components/SEO';
import { TransactionalEmailTemplateManager } from '../components/admin/TransactionalEmailTemplateManager';

type AdminLmsTab = 'editor' | 'assessments' | 'students' | 'certificates' | 'audit' | 'email-templates';

export const AdminLmsDashboardPage: React.FC<{
  initialTab?: AdminLmsTab;
}> = ({ initialTab = 'editor' }) => {
  const { courseId: paramCourseId } = useParams<{ courseId?: string }>();
  const location = useLocation();

  const {
    courses,
    activeCourseId,
    setActiveCourseId,
    studentProfile,
    getCourseOverallProgress,
    getComputedLessonsForCourse,
    allCertificates,
    allAuditLogs,
    allExamResults,
    updateCourseDetails,
    updateLessonConfig,
    updateFinalExamConfig,
    updateCertificateStatusAdmin,
    reissueCertificateAdmin
  } = useLms();

  const [activeTab, setActiveTab] = useState<AdminLmsTab>(() => {
    if (location.pathname.includes('/assessments')) return 'assessments';
    if (location.pathname.includes('/certificates')) return 'certificates';
    return initialTab;
  });

  useEffect(() => {
    if (location.pathname.includes('/assessments')) setActiveTab('assessments');
    else if (location.pathname.includes('/certificates')) setActiveTab('certificates');
    else if (location.pathname.includes('/edit')) setActiveTab('editor');
  }, [location.pathname]);

  useEffect(() => {
    if (paramCourseId && courses.some((c) => c.courseId === paramCourseId)) {
      setActiveCourseId(paramCourseId);
    }
  }, [paramCourseId, courses, setActiveCourseId]);

  const selectedCourse =
    courses.find((c) => c.courseId === activeCourseId) || courses[0];

  const [selectedLessonId, setSelectedLessonId] = useState<string>(
    selectedCourse.lessons[0]?.lessonId || 'cls_01'
  );

  const selectedLesson =
    selectedCourse.lessons.find((l) => l.lessonId === selectedLessonId) ||
    selectedCourse.lessons[0];

  // Course Editor Form State
  const [courseTitle, setCourseTitle] = useState(selectedCourse.title);
  const [coursePublished, setCoursePublished] = useState(selectedCourse.published);
  const [classHeading, setClassHeading] = useState(selectedLesson.heading);
  const [classDescription, setClassDescription] = useState(selectedLesson.description);
  const [quizRequired, setQuizRequired] = useState(selectedLesson.quizRequired);
  const [videoAssetId, setVideoAssetId] = useState(selectedLesson.videoAsset.assetId);
  const [notesAssetId, setNotesAssetId] = useState(selectedLesson.notesAsset.assetId);
  const [pptAssetId, setPptAssetId] = useState(selectedLesson.pptAsset.assetId);

  // URL Material State
  const [videoStreamUrl, setVideoStreamUrl] = useState(
    selectedLesson.videoAsset.streamUrl || selectedLesson.videoAsset.externalUrl || ''
  );
  const [notesExternalUrl, setNotesExternalUrl] = useState(
    selectedLesson.notesAsset.externalUrl || ''
  );
  const [pptExternalUrl, setPptExternalUrl] = useState(
    selectedLesson.pptAsset.externalUrl || ''
  );

  // Assessment Manager State
  const [quizPassingScore, setQuizPassingScore] = useState(
    selectedLesson.quizConfig.passingScore
  );
  const [quizMaxAttempts, setQuizMaxAttempts] = useState(
    selectedLesson.quizConfig.maxAttempts
  );
  const [examTimeLimit, setExamTimeLimit] = useState(
    selectedCourse.finalExam.timeLimitMinutes
  );
  const [examPassingScore, setExamPassingScore] = useState(
    selectedCourse.finalExam.passingScore
  );
  const [examMaxAttempts, setExamMaxAttempts] = useState(
    selectedCourse.finalExam.maxAttempts
  );

  // Sync form fields when selected course or lesson changes
  useEffect(() => {
    setCourseTitle(selectedCourse.title);
    setCoursePublished(selectedCourse.published);
    setExamTimeLimit(selectedCourse.finalExam.timeLimitMinutes);
    setExamPassingScore(selectedCourse.finalExam.passingScore);
    setExamMaxAttempts(selectedCourse.finalExam.maxAttempts);
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedLesson) {
      setClassHeading(selectedLesson.heading);
      setClassDescription(selectedLesson.description);
      setQuizRequired(selectedLesson.quizRequired);
      setVideoAssetId(selectedLesson.videoAsset.assetId);
      setNotesAssetId(selectedLesson.notesAsset.assetId);
      setPptAssetId(selectedLesson.pptAsset.assetId);
      setVideoStreamUrl(
        selectedLesson.videoAsset.streamUrl || selectedLesson.videoAsset.externalUrl || ''
      );
      setNotesExternalUrl(selectedLesson.notesAsset.externalUrl || '');
      setPptExternalUrl(selectedLesson.pptAsset.externalUrl || '');
      setQuizPassingScore(selectedLesson.quizConfig.passingScore);
      setQuizMaxAttempts(selectedLesson.quizConfig.maxAttempts);
    }
  }, [selectedLesson]);

  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [certActionReason, setCertActionReason] = useState(
    'Administrative compliance verification update'
  );
  const [r2Status, setR2Status] = useState<R2StorageStatus | null>(null);

  useEffect(() => {
    fetchR2StorageStatus()
      .then((st) => setR2Status(st))
      .catch(() => setR2Status(null));
  }, []);

  const showToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 3500);
  };

  const handleR2UploadSuccess = (
    materialType: 'video' | 'notes' | 'ppt',
    metadata: LmsR2AssetMetadata,
    suggestedAssetId: string
  ) => {
    if (materialType === 'video') {
      setVideoAssetId(suggestedAssetId);
      updateLessonConfig(selectedCourse.courseId, selectedLesson.lessonId, {
        videoAsset: {
          ...selectedLesson.videoAsset,
          assetId: suggestedAssetId,
          ...metadata
        }
      });
    } else if (materialType === 'notes') {
      setNotesAssetId(suggestedAssetId);
      updateLessonConfig(selectedCourse.courseId, selectedLesson.lessonId, {
        notesAsset: {
          ...selectedLesson.notesAsset,
          assetId: suggestedAssetId,
          ...metadata
        }
      });
    } else {
      setPptAssetId(suggestedAssetId);
      updateLessonConfig(selectedCourse.courseId, selectedLesson.lessonId, {
        pptAsset: {
          ...selectedLesson.pptAsset,
          assetId: suggestedAssetId,
          ...metadata
        }
      });
    }

    showToast(
      `Uploaded ${materialType.toUpperCase()} file "${metadata.r2FileName}" to R2 Object Storage (${metadata.r2ObjectKey}) and synced to Firestore.`
    );
  };

  const handleRemoveR2Object = (materialType: 'video' | 'notes' | 'ppt') => {
    if (materialType === 'video') {
      const nextAsset: any = {
        ...selectedLesson.videoAsset,
        sourceType: 'r2-upload'
      };
      delete nextAsset.r2ObjectKey;
      delete nextAsset.r2FileName;
      delete nextAsset.r2MimeType;
      delete nextAsset.r2FileSizeBytes;
      delete nextAsset.r2UploadedAt;
      delete nextAsset.r2StorageMode;
      delete nextAsset.streamUrl;
      delete nextAsset.externalUrl;
      updateLessonConfig(selectedCourse.courseId, selectedLesson.lessonId, {
        videoAsset: nextAsset
      });
    } else if (materialType === 'notes') {
      const nextAsset: any = {
        ...selectedLesson.notesAsset,
        sourceType: 'r2-upload'
      };
      delete nextAsset.r2ObjectKey;
      delete nextAsset.r2FileName;
      delete nextAsset.r2MimeType;
      delete nextAsset.r2FileSizeBytes;
      delete nextAsset.r2UploadedAt;
      delete nextAsset.r2StorageMode;
      delete nextAsset.externalUrl;
      updateLessonConfig(selectedCourse.courseId, selectedLesson.lessonId, {
        notesAsset: nextAsset
      });
    } else {
      const nextAsset: any = {
        ...selectedLesson.pptAsset,
        sourceType: 'r2-upload'
      };
      delete nextAsset.r2ObjectKey;
      delete nextAsset.r2FileName;
      delete nextAsset.r2MimeType;
      delete nextAsset.r2FileSizeBytes;
      delete nextAsset.r2UploadedAt;
      delete nextAsset.r2StorageMode;
      delete nextAsset.externalUrl;
      updateLessonConfig(selectedCourse.courseId, selectedLesson.lessonId, {
        pptAsset: nextAsset
      });
    }

    showToast(`Removed R2 ${materialType.toUpperCase()} object from Class ${selectedLesson.classNumber}.`);
  };

  const handleSaveLessonChanges = (e: React.FormEvent) => {
    e.preventDefault();
    updateCourseDetails(selectedCourse.courseId, {
      title: courseTitle.trim() || selectedCourse.title,
      published: coursePublished
    });

    const nextVideo: any = {
      ...selectedLesson.videoAsset,
      assetId: videoAssetId.trim() || selectedLesson.videoAsset.assetId,
      sourceType: videoStreamUrl.trim() ? 'url' : selectedLesson.videoAsset.sourceType || 'r2-upload',
      title: `Class ${selectedLesson.classNumber}: ${classHeading.trim() || selectedLesson.heading}`
    };
    if (videoStreamUrl.trim()) {
      nextVideo.streamUrl = videoStreamUrl.trim();
      nextVideo.externalUrl = videoStreamUrl.trim();
    } else {
      delete nextVideo.streamUrl;
      delete nextVideo.externalUrl;
    }

    const nextNotes: any = {
      ...selectedLesson.notesAsset,
      assetId: notesAssetId.trim() || selectedLesson.notesAsset.assetId,
      sourceType: notesExternalUrl.trim() ? 'url' : selectedLesson.notesAsset.sourceType || 'r2-upload'
    };
    if (notesExternalUrl.trim()) {
      nextNotes.externalUrl = notesExternalUrl.trim();
    } else {
      delete nextNotes.externalUrl;
    }

    const nextPpt: any = {
      ...selectedLesson.pptAsset,
      assetId: pptAssetId.trim() || selectedLesson.pptAsset.assetId,
      sourceType: pptExternalUrl.trim() ? 'url' : selectedLesson.pptAsset.sourceType || 'r2-upload'
    };
    if (pptExternalUrl.trim()) {
      nextPpt.externalUrl = pptExternalUrl.trim();
    } else {
      delete nextPpt.externalUrl;
    }

    updateLessonConfig(selectedCourse.courseId, selectedLesson.lessonId, {
      heading: classHeading.trim() || selectedLesson.heading,
      description: classDescription.trim() || selectedLesson.description,
      quizRequired,
      videoAsset: nextVideo,
      notesAsset: nextNotes,
      pptAsset: nextPpt
    });
    showToast(
      `Saved Class ${selectedLesson.classNumber} (Immutable ID: ${selectedLesson.lessonId}). Student completion progress remains intact.`
    );
  };

  const handleCopyConfigurationDraft = () => {
    const draftPayload = {
      courseId: selectedCourse.courseId,
      courseName: courseTitle,
      lessonId: selectedLesson.lessonId,
      classNumber: `Class ${selectedLesson.classNumber}`,
      quizRequirement: quizRequired ? 'Required for completion' : 'Optional',
      classHeading,
      learningMaterials: {
        videoUrlOrAssetId: videoAssetId,
        notesFileOrAssetId: notesAssetId,
        pptFileOrAssetId: pptAssetId
      }
    };
    navigator.clipboard.writeText(JSON.stringify(draftPayload, null, 2)).then(() => {
      setCopiedDraft(true);
      setTimeout(() => setCopiedDraft(false), 2500);
    });
  };

  const handleSaveAssessmentRules = (e: React.FormEvent) => {
    e.preventDefault();
    updateLessonConfig(selectedCourse.courseId, selectedLesson.lessonId, {
      quizRequired,
      quizConfig: {
        ...selectedLesson.quizConfig,
        passingScore: Number(quizPassingScore) || 70,
        maxAttempts: Number(quizMaxAttempts) || 5
      }
    });
    updateFinalExamConfig(selectedCourse.courseId, {
      timeLimitMinutes: Number(examTimeLimit) || 25,
      passingScore: Number(examPassingScore) || 70,
      maxAttempts: Number(examMaxAttempts) || 5
    });
    showToast('Updated Class Quiz & Final Examination grading criteria.');
  };

  const overallStudentStats = getCourseOverallProgress(selectedCourse.courseId);
  const computedStudentLessons = getComputedLessonsForCourse(selectedCourse.courseId);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <ServiceSEO
        title="Course Management | Admin LMS Dashboard & Course Editor"
        description="Admin LMS Dashboard for managing courses, 10-class curriculum, learning assets, quiz passing criteria, final examination settings, and verifiable certificates."
        serviceType="Admin LMS Console"
        canonicalUrl="/admin/dashboard"
      />

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Admin dashboard · Course editor</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Course Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Manage course curriculum, permanent lesson IDs, learning assets, exam rules, student progress, and certificates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to={`/student/course/${selectedCourse.courseId}`}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-600" />
              <span>View Student Portal</span>
            </Link>
            <Link
              to="/verify-certificate"
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
              <span>Public Verification</span>
            </Link>
            <Link
              to="/admin/shop"
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white flex items-center gap-1.5"
            >
              <span>Shop Catalog Admin</span>
            </Link>
          </div>
        </div>

        {/* Status Toast */}
        {statusToast && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-semibold flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusToast(null)}
              className="text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Segmented Admin Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-200/70 p-1.5 rounded-2xl w-fit">
          {[
            { id: 'editor' as const, label: '1. Course & Class Editor', icon: BookOpen },
            { id: 'assessments' as const, label: '2. Quiz & Final Exam Manager', icon: SlidersHorizontal },
            { id: 'students' as const, label: '3. Student Enrollment & Progress', icon: Users },
            { id: 'certificates' as const, label: '4. Certificate Manager', icon: Award },
            { id: 'audit' as const, label: '5. Admin Action Logs', icon: History },
            { id: 'email-templates' as const, label: '6. Email Templates (Brevo)', icon: Mail }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-emerald-600" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: COURSE & CLASS EDITOR */}
        {activeTab === 'editor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Form (8 Cols) */}
            <form
              onSubmit={handleSaveLessonChanges}
              className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Course & Class Curriculum Editor
                  </h2>
                  <p className="text-xs text-slate-500">
                    Each class uses a permanent Lesson ID ({selectedLesson.lessonId}) so updating headings never erases student progress.
                  </p>
                </div>

                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={coursePublished}
                    onChange={(e) => setCoursePublished(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  <span>Course Published</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Select Course / Digital Product
                  </label>
                  <select
                    value={selectedCourse.courseId}
                    onChange={(e) => {
                      setActiveCourseId(e.target.value);
                      const nextCourse = courses.find((c) => c.courseId === e.target.value);
                      if (nextCourse && nextCourse.lessons[0]) {
                        setSelectedLessonId(nextCourse.lessons[0].lessonId);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:border-emerald-600"
                  >
                    {courses.map((c) => (
                      <option key={c.courseId} value={c.courseId}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Course / Product Name
                  </label>
                  <input
                    type="text"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Class Number (Permanent ID: {selectedLesson.lessonId})
                  </label>
                  <select
                    value={selectedLesson.lessonId}
                    onChange={(e) => setSelectedLessonId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:border-emerald-600"
                  >
                    {selectedCourse.lessons.map((l) => (
                      <option key={l.lessonId} value={l.lessonId}>
                        Class {l.classNumber} — {l.heading} ({l.lessonId})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Quiz Requirement
                  </label>
                  <select
                    value={quizRequired ? 'required' : 'optional'}
                    onChange={(e) => setQuizRequired(e.target.value === 'required')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:border-emerald-600"
                  >
                    <option value="required">Required for completion</option>
                    <option value="optional">Optional practice quiz</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Class Heading
                  </label>
                  <input
                    type="text"
                    value={classHeading}
                    onChange={(e) => setClassHeading(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Class Description & Scope
                  </label>
                  <textarea
                    rows={2}
                    value={classDescription}
                    onChange={(e) => setClassDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Learning Materials & Cloudflare R2 Object Storage Section */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-emerald-600" />
                      <span>Learning Materials · Cloudflare R2 Object Storage</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Direct browser upload via R2 presigned PUT URLs. Enrolled students receive signed temporary read URLs.
                    </p>
                  </div>

                  {r2Status ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono tabular-nums shadow-xs transition-all ${
                          r2Status.configured
                            ? 'bg-gradient-to-r from-emerald-50 to-teal-50/60 border-emerald-300 text-emerald-900'
                            : 'bg-gradient-to-r from-amber-50 to-orange-50/60 border-amber-300 text-amber-900'
                        }`}
                      >
                        <span className="relative flex h-2 w-2">
                          <span
                            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                              r2Status.configured ? 'bg-emerald-400' : 'bg-amber-400'
                            }`}
                          />
                          <span
                            className={`relative inline-flex rounded-full h-2 w-2 ${
                              r2Status.configured ? 'bg-emerald-600' : 'bg-amber-600'
                            }`}
                          />
                        </span>
                        <span className="font-bold tracking-tight">
                          {r2Status.configured ? 'Cloudflare R2 Active' : 'R2 Secure Store'}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="bg-white/80 px-2 py-0.5 rounded-md border border-slate-200/60 text-[11px] font-semibold text-slate-700">
                          {r2Status.bucketName}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          TTL: {r2Status.signedUrlTtlSeconds}s
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          fetchR2StorageStatus()
                            .then((st) => {
                              setR2Status(st);
                              showToast('R2 Object Storage status verified.');
                            })
                            .catch(() => showToast('Failed to connect to R2 Object Storage.'));
                        }}
                        title="Verify R2 Connection"
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-emerald-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-[11px]">Verify</span>
                      </button>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-xs font-mono">
                      <span className="inline-block w-2 h-2 rounded-full bg-slate-300 animate-pulse" />
                      <span>Checking R2 Storage...</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <R2MaterialUploadCard
                    courseId={selectedCourse.courseId}
                    lessonId={selectedLesson.lessonId}
                    classNumber={selectedLesson.classNumber}
                    materialType="video"
                    label="1. Video Lecture"
                    assetIdValue={videoAssetId}
                    onAssetIdChange={setVideoAssetId}
                    urlValue={videoStreamUrl}
                    onUrlChange={(url) => {
                      setVideoStreamUrl(url);
                      const nextVideo: any = { ...selectedLesson.videoAsset };
                      if (url.trim()) {
                        nextVideo.streamUrl = url.trim();
                        nextVideo.externalUrl = url.trim();
                        nextVideo.sourceType = 'url';
                      } else {
                        delete nextVideo.streamUrl;
                        delete nextVideo.externalUrl;
                        nextVideo.sourceType = 'r2-upload';
                      }
                      updateLessonConfig(selectedCourse.courseId, selectedLesson.lessonId, {
                        videoAsset: nextVideo
                      });
                      showToast(url.trim() ? 'Configured Direct Video URL' : 'Cleared Video URL');
                    }}
                    currentMetadata={{
                      r2ObjectKey: selectedLesson.videoAsset.r2ObjectKey,
                      r2FileName: selectedLesson.videoAsset.r2FileName,
                      r2MimeType: selectedLesson.videoAsset.r2MimeType,
                      r2FileSizeBytes: selectedLesson.videoAsset.r2FileSizeBytes,
                      r2UploadedAt: selectedLesson.videoAsset.r2UploadedAt,
                      r2StorageMode: selectedLesson.videoAsset.r2StorageMode,
                      sourceType: selectedLesson.videoAsset.sourceType,
                      externalUrl: selectedLesson.videoAsset.externalUrl || selectedLesson.videoAsset.streamUrl
                    }}
                    onUploadSuccess={(meta, nextId) =>
                      handleR2UploadSuccess('video', meta, nextId)
                    }
                    onRemoveR2Object={() => {
                      setVideoStreamUrl('');
                      handleRemoveR2Object('video');
                    }}
                  />

                  <R2MaterialUploadCard
                    courseId={selectedCourse.courseId}
                    lessonId={selectedLesson.lessonId}
                    classNumber={selectedLesson.classNumber}
                    materialType="notes"
                    label="2. Reading Notes (PDF)"
                    assetIdValue={notesAssetId}
                    onAssetIdChange={setNotesAssetId}
                    urlValue={notesExternalUrl}
                    onUrlChange={(url) => {
                      setNotesExternalUrl(url);
                      const nextNotes: any = { ...selectedLesson.notesAsset };
                      if (url.trim()) {
                        nextNotes.externalUrl = url.trim();
                        nextNotes.sourceType = 'url';
                      } else {
                        delete nextNotes.externalUrl;
                        nextNotes.sourceType = 'r2-upload';
                      }
                      updateLessonConfig(selectedCourse.courseId, selectedLesson.lessonId, {
                        notesAsset: nextNotes
                      });
                      showToast(url.trim() ? 'Configured Direct Notes URL' : 'Cleared Notes URL');
                    }}
                    currentMetadata={{
                      r2ObjectKey: selectedLesson.notesAsset.r2ObjectKey,
                      r2FileName: selectedLesson.notesAsset.r2FileName,
                      r2MimeType: selectedLesson.notesAsset.r2MimeType,
                      r2FileSizeBytes: selectedLesson.notesAsset.r2FileSizeBytes,
                      r2UploadedAt: selectedLesson.notesAsset.r2UploadedAt,
                      r2StorageMode: selectedLesson.notesAsset.r2StorageMode,
                      sourceType: selectedLesson.notesAsset.sourceType,
                      externalUrl: selectedLesson.notesAsset.externalUrl
                    }}
                    onUploadSuccess={(meta, nextId) =>
                      handleR2UploadSuccess('notes', meta, nextId)
                    }
                    onRemoveR2Object={() => {
                      setNotesExternalUrl('');
                      handleRemoveR2Object('notes');
                    }}
                  />

                  <R2MaterialUploadCard
                    courseId={selectedCourse.courseId}
                    lessonId={selectedLesson.lessonId}
                    classNumber={selectedLesson.classNumber}
                    materialType="ppt"
                    label="3. PPT Slide Deck"
                    assetIdValue={pptAssetId}
                    onAssetIdChange={setPptAssetId}
                    urlValue={pptExternalUrl}
                    onUrlChange={(url) => {
                      setPptExternalUrl(url);
                      const nextPpt: any = { ...selectedLesson.pptAsset };
                      if (url.trim()) {
                        nextPpt.externalUrl = url.trim();
                        nextPpt.sourceType = 'url';
                      } else {
                        delete nextPpt.externalUrl;
                        nextPpt.sourceType = 'r2-upload';
                      }
                      updateLessonConfig(selectedCourse.courseId, selectedLesson.lessonId, {
                        pptAsset: nextPpt
                      });
                      showToast(url.trim() ? 'Configured Direct PPT URL' : 'Cleared PPT URL');
                    }}
                    currentMetadata={{
                      r2ObjectKey: selectedLesson.pptAsset.r2ObjectKey,
                      r2FileName: selectedLesson.pptAsset.r2FileName,
                      r2MimeType: selectedLesson.pptAsset.r2MimeType,
                      r2FileSizeBytes: selectedLesson.pptAsset.r2FileSizeBytes,
                      r2UploadedAt: selectedLesson.pptAsset.r2UploadedAt,
                      r2StorageMode: selectedLesson.pptAsset.r2StorageMode,
                      sourceType: selectedLesson.pptAsset.sourceType,
                      externalUrl: selectedLesson.pptAsset.externalUrl
                    }}
                    onUploadSuccess={(meta, nextId) =>
                      handleR2UploadSuccess('ppt', meta, nextId)
                    }
                    onRemoveR2Object={() => {
                      setPptExternalUrl('');
                      handleRemoveR2Object('ppt');
                    }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleCopyConfigurationDraft}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  {copiedDraft ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Configuration Draft Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>Copy configuration draft</span>
                    </>
                  )}
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>Save Class Configuration</span>
                </button>
              </div>
            </form>

            {/* Right Sidebar: 10-Class Quick Selector (4 Cols) */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  10-Class Permanent ID Registry
                </h3>
                <p className="text-xs text-slate-500">
                  Click any class to edit its heading and learning assets.
                </p>
              </div>

              <div className="space-y-2">
                {selectedCourse.lessons.map((l) => {
                  const isActive = l.lessonId === selectedLesson.lessonId;
                  return (
                    <button
                      key={l.lessonId}
                      type="button"
                      onClick={() => setSelectedLessonId(l.lessonId)}
                      className={`w-full p-3 rounded-xl border text-left transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">
                          Class {l.classNumber}: {l.heading}
                        </div>
                        <div
                          className={`text-[11px] font-mono ${
                            isActive ? 'text-emerald-400' : 'text-slate-500'
                          }`}
                        >
                          ID: {l.lessonId} · {l.quizRequired ? 'Quiz Required' : 'Optional Quiz'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: QUIZ & FINAL EXAM MANAGER */}
        {activeTab === 'assessments' && (
          <form
            onSubmit={handleSaveAssessmentRules}
            className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6"
          >
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">
                Quiz & Final Examination Criteria Manager
              </h2>
              <p className="text-xs text-slate-500">
                Configure passing marks, time limits, and maximum attempts for class quizzes and the final examination.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Class Quiz Settings */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Class {selectedLesson.classNumber} Quiz Parameters ({selectedLesson.heading})
                </h3>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Passing Score Percentage (%)
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={quizPassingScore}
                    onChange={(e) => setQuizPassingScore(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm font-mono tabular-nums text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Maximum Attempts Allowed
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={quizMaxAttempts}
                    onChange={(e) => setQuizMaxAttempts(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm font-mono tabular-nums text-slate-900"
                  />
                </div>
              </div>

              {/* Final Examination Settings */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Final Examination Parameters ({selectedCourse.finalExam.examId})
                </h3>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Final Exam Passing Score (%)
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={examPassingScore}
                    onChange={(e) => setExamPassingScore(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm font-mono tabular-nums text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Time Limit (Minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={examTimeLimit}
                    onChange={(e) => setExamTimeLimit(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm font-mono tabular-nums text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Maximum Exam Attempts
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={examMaxAttempts}
                    onChange={(e) => setExamMaxAttempts(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm font-mono tabular-nums text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
              >
                Save Assessment Criteria
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: STUDENT ENROLLMENT & PROGRESS */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Student Enrollment & Live Course Progress
                </h2>
                <p className="text-xs text-slate-500">
                  Real-time view of enrolled learner progress across all 10 classes and final examination.
                </p>
              </div>
              <div className="text-xs font-mono tabular-nums text-emerald-700 font-bold">
                Overall Course Completion: {overallStudentStats.percent}% ({overallStudentStats.completedCount}/10 Classes)
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-xs">
                    <th className="py-3 px-4 font-bold">Class</th>
                    <th className="py-3 px-4 font-bold">Permanent ID</th>
                    <th className="py-3 px-4 font-bold">Video Checkpoint</th>
                    <th className="py-3 px-4 font-bold">Notes Checkpoint</th>
                    <th className="py-3 px-4 font-bold">Quiz Score</th>
                    <th className="py-3 px-4 font-bold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {computedStudentLessons.map((item) => (
                    <tr key={item.lesson.lessonId} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        Class {item.lesson.classNumber}: {item.lesson.heading}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">
                        {item.lesson.lessonId}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums">
                        {item.progress.videoCompleted
                          ? '100% (Verified)'
                          : `${item.progress.videoWatchPercent}%`}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums">
                        {item.progress.notesCompleted
                          ? 'Completed'
                          : `${item.progress.notesSectionsRead.length}/${item.lesson.notesAsset.sections.length}`}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums">
                        {item.progress.quizPassed
                          ? `Passed (${item.progress.quizBestScore}%)`
                          : 'Pending'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold capitalize">
                        {item.status.replace('_', ' ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {allExamResults.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-3">
                  Final Examination Submissions
                </h3>
                <div className="space-y-2">
                  {allExamResults.map((ex) => (
                    <div
                      key={ex.resultId}
                      className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono tabular-nums"
                    >
                      <span>
                        {ex.studentName} ({ex.studentId}) · Course: {ex.courseId}
                      </span>
                      <span className={ex.passed ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                        Score: {ex.scorePercent}% ({ex.passed ? 'PASSED' : 'FAILED'})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CERTIFICATE MANAGER */}
        {activeTab === 'certificates' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Certificate Registry & Status Controller
                </h2>
                <p className="text-xs text-slate-500">
                  Control certificate validity (Valid, Revoked, Superseded) or re-issue credentials with full audit logging.
                </p>
              </div>

              <div className="w-full sm:w-72">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Audit Reason for Status Change / Re-issue
                </label>
                <input
                  type="text"
                  value={certActionReason}
                  onChange={(e) => setCertActionReason(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-xs">
                    <th className="py-3 px-4 font-bold">Certificate ID</th>
                    <th className="py-3 px-4 font-bold">Student Name</th>
                    <th className="py-3 px-4 font-bold">Course</th>
                    <th className="py-3 px-4 font-bold">Issue Date</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allCertificates.map((cert) => (
                    <tr key={cert.certificateId} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono tabular-nums font-bold text-slate-900">
                        {cert.certificateId}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {cert.studentName}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {cert.courseTitle}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-600">
                        {cert.issueDate}
                      </td>
                      <td className="py-3 px-4">
                        {cert.status === 'Valid' ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Valid</span>
                          </span>
                        ) : (
                          <span className="text-rose-700 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{cert.status}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                        {cert.status !== 'Valid' && (
                          <button
                            type="button"
                            onClick={() => {
                              updateCertificateStatusAdmin(
                                cert.certificateId,
                                'Valid' as CertificateStatus,
                                certActionReason
                              );
                              showToast(`Restored ${cert.certificateId} to Valid.`);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs cursor-pointer"
                          >
                            Restore Valid
                          </button>
                        )}
                        {cert.status === 'Valid' && (
                          <button
                            type="button"
                            onClick={() => {
                              updateCertificateStatusAdmin(
                                cert.certificateId,
                                'Revoked',
                                certActionReason
                              );
                              showToast(`Revoked certificate ${cert.certificateId}.`);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs cursor-pointer"
                          >
                            Revoke
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const newCert = reissueCertificateAdmin(
                              cert.certificateId,
                              certActionReason
                            );
                            if (newCert) {
                              showToast(
                                `Re-issued new Certificate ${newCert.certificateId} (marked ${cert.certificateId} as Superseded).`
                              );
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Re-issue</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: ADMIN ACTION LOGS */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">
                Immutable Admin & Certificate Audit Logs
              </h2>
              <p className="text-xs text-slate-500">
                Every curriculum edit, exam rule update, and certificate issuance/revocation is recorded here.
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {allAuditLogs.map((log, index) => (
                <div
                  key={log.logId ? `${log.logId}-${index}` : `audit-${index}`}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900">
                      {log.actionType} · <span className="font-mono text-emerald-700">{log.targetId}</span>
                    </div>
                    <div className="text-slate-600">{log.summary}</div>
                  </div>
                  <div className="font-mono tabular-nums text-slate-400 shrink-0">
                    {log.actorEmail} · {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: TRANSACTIONAL EMAIL TEMPLATE MANAGER (BREVO) */}
        {activeTab === 'email-templates' && (
          <TransactionalEmailTemplateManager />
        )}
      </div>
    </div>
  );
};
