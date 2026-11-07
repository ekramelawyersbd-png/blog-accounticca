import React, { useState, useMemo } from 'react';
import {
  Award,
  Trophy,
  ShieldCheck,
  CheckCircle2,
  Lock,
  BookOpen,
  FileCheck2,
  Target,
  Sparkles,
  ArrowRight,
  Download,
  X
} from 'lucide-react';
import {
  ComputedLessonState,
  StudentProfileRecord,
  CertificateEligibilityState
} from '../../contexts/LmsContext';
import { LmsCourse } from '../../data/lmsCoursesData';

export interface LearningMilestoneBadge {
  id: string;
  title: string;
  bengaliSubtitle: string;
  categoryLabel: string;
  tierLabel: string;
  requiredMasteryLabel: string;
  description: string;
  statutoryScope: string;
  iconType: 'tax-expert' | 'vat-pro' | 'foundation' | 'sprinter' | 'rjsc' | 'perfect' | 'distinction' | 'fellow';
  unlocked: boolean;
  progressPercent: number;
  progressText: string;
  achievedScoreLabel: string;
  nextActionLessonIndex?: number;
  nextActionLabel?: string;
}

interface LearningMilestonesBadgesProps {
  course: LmsCourse;
  studentProfile: StudentProfileRecord;
  computedLessons: ComputedLessonState[];
  eligibility: CertificateEligibilityState;
  onStartLessonQuiz?: (lessonIndex: number) => void;
  onOpenFinalExam?: () => void;
}

export const LearningMilestonesBadges: React.FC<LearningMilestonesBadgesProps> = ({
  course,
  studentProfile,
  computedLessons,
  eligibility,
  onStartLessonQuiz,
  onOpenFinalExam
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'unlocked' | 'in_progress'>('all');
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null);

  // Compute student's real quiz mastery metrics from computedLessons & eligibility
  const masteryStats = useMemo(() => {
    const totalQuizzes = computedLessons.filter((l) => l.lesson.quizRequired).length || 10;
    const passedLessons = computedLessons.filter((l) => l.progress.quizPassed);
    const quizPassedCount = passedLessons.length;

    const attemptedScores = computedLessons
      .filter((l) => l.progress.quizPassed || l.progress.quizBestScore > 0)
      .map((l) => l.progress.quizBestScore);

    const avgQuizScore =
      attemptedScores.length > 0
        ? Math.round(attemptedScores.reduce((acc, s) => acc + s, 0) / attemptedScores.length)
        : 0;

    const perfectQuizCount = computedLessons.filter(
      (l) => l.progress.quizPassed && l.progress.quizBestScore === 100
    ).length;

    const highMasteryQuizCount = computedLessons.filter(
      (l) => l.progress.quizPassed && l.progress.quizBestScore >= 80
    ).length;

    // Specific module group checks (e.g., Classes 4-6 for VAT/Withholding/Source Tax mastery)
    const vatAndWithholdingLessons = computedLessons.slice(3, 6);
    const vatPassedCount = vatAndWithholdingLessons.filter((l) => l.progress.quizPassed).length;
    const vatAvgScore =
      vatAndWithholdingLessons.some((l) => l.progress.quizBestScore > 0)
        ? Math.round(
            vatAndWithholdingLessons.reduce((acc, l) => acc + l.progress.quizBestScore, 0) /
              vatAndWithholdingLessons.length
          )
        : 0;

    // Find next available unpassed quiz index for quick action
    const nextUnpassedQuizIndex = computedLessons.findIndex(
      (l) => !l.progress.quizPassed && l.status !== 'locked'
    );

    return {
      totalQuizzes,
      quizPassedCount,
      avgQuizScore,
      perfectQuizCount,
      highMasteryQuizCount,
      vatPassedCount,
      vatTotalCount: vatAndWithholdingLessons.length || 3,
      vatAvgScore,
      nextUnpassedQuizIndex: nextUnpassedQuizIndex >= 0 ? nextUnpassedQuizIndex : 0
    };
  }, [computedLessons]);

  // Build virtual badges based on real quiz mastery levels
  const badges: LearningMilestoneBadge[] = useMemo(() => {
    const {
      totalQuizzes,
      quizPassedCount,
      avgQuizScore,
      perfectQuizCount,
      highMasteryQuizCount,
      vatPassedCount,
      vatTotalCount,
      vatAvgScore,
      nextUnpassedQuizIndex
    } = masteryStats;

    // 1. Tax Foundation Scholar
    const foundationUnlocked = quizPassedCount >= 1;
    const foundationProgress = Math.min(100, Math.round((quizPassedCount / 1) * 100));

    // 2. Statutory Quiz Sprinter
    const sprinterUnlocked = quizPassedCount >= 3 && avgQuizScore >= 75;
    const sprinterProgress = Math.min(
      100,
      Math.round((Math.min(quizPassedCount, 3) / 3) * 70 + (avgQuizScore >= 75 ? 30 : (avgQuizScore / 75) * 30))
    );

    // 3. VAT Pro
    const vatProUnlocked =
      (vatPassedCount >= vatTotalCount && vatAvgScore >= 80) ||
      (quizPassedCount >= 5 && avgQuizScore >= 80);
    const vatProProgress = vatProUnlocked
      ? 100
      : Math.min(
          99,
          Math.max(
            Math.round((vatPassedCount / vatTotalCount) * 80 + (vatAvgScore >= 80 ? 20 : 0)),
            Math.round((Math.min(quizPassedCount, 5) / 5) * 80 + (avgQuizScore >= 80 ? 20 : 0))
          )
        );

    // 4. Precision Mastery (100% Score)
    const perfectUnlocked = perfectQuizCount >= 1;
    const bestSingleScore = computedLessons.reduce(
      (max, l) => Math.max(max, l.progress.quizBestScore),
      0
    );
    const perfectProgress = perfectUnlocked ? 100 : Math.min(95, bestSingleScore);

    // 5. Corporate & Return Strategist
    const corporateUnlocked = quizPassedCount >= 7 && highMasteryQuizCount >= 5;
    const corporateProgress = corporateUnlocked
      ? 100
      : Math.min(99, Math.round((Math.min(quizPassedCount, 7) / 7) * 100));

    // 6. Tax Expert
    const taxExpertUnlocked = quizPassedCount >= totalQuizzes && avgQuizScore >= 80;
    const taxExpertProgress = taxExpertUnlocked
      ? 100
      : Math.min(
          99,
          Math.round((quizPassedCount / totalQuizzes) * 80 + (avgQuizScore >= 80 ? 20 : (avgQuizScore / 80) * 20))
        );

    // 7. Distinction Honor Laureate
    const distinctionUnlocked =
      quizPassedCount >= totalQuizzes &&
      eligibility.finalExamPassed &&
      eligibility.finalExamBestScore >= 85;
    const distinctionProgress = distinctionUnlocked
      ? 100
      : Math.min(
          99,
          Math.round(
            (quizPassedCount / totalQuizzes) * 60 +
              (eligibility.finalExamPassed
                ? Math.min(40, Math.round((eligibility.finalExamBestScore / 85) * 40))
                : 0)
          )
        );

    // 8. Chartered Compliance Fellow
    const fellowUnlocked = eligibility.isFullyEligible;
    const fellowCheckpoints = [
      eligibility.allClassesCompleted,
      eligibility.allQuizzesCompleted,
      eligibility.finalExamPassed,
      eligibility.enrollmentValidated
    ].filter(Boolean).length;
    const fellowProgress = fellowUnlocked ? 100 : Math.round((fellowCheckpoints / 4) * 100);

    return [
      {
        id: 'badge-tax-foundation',
        title: 'Tax Foundation Scholar',
        bengaliSubtitle: 'কর আইন প্রাথমিক দক্ষতা ব্যাজ',
        categoryLabel: 'Foundation Mastery',
        tierLabel: 'Tier I',
        requiredMasteryLabel: 'Pass 1+ Class Quiz (≥70%)',
        description:
          'Awarded for passing your first statutory class assessment and establishing foundational legal literacy.',
        statutoryScope: 'Income Tax Act 2023 · Foundational Principles',
        iconType: 'foundation',
        unlocked: foundationUnlocked,
        progressPercent: foundationProgress,
        progressText: `${Math.min(quizPassedCount, 1)}/1 Quiz Passed`,
        achievedScoreLabel: foundationUnlocked ? `Best: ${bestSingleScore}%` : 'Not yet earned',
        nextActionLessonIndex: nextUnpassedQuizIndex,
        nextActionLabel: 'Take Class 01 Quiz'
      },
      {
        id: 'badge-quiz-sprinter',
        title: 'Statutory Quiz Sprinter',
        bengaliSubtitle: 'ধারাবাহিক কুইজ পারদর্শিতা',
        categoryLabel: 'Consistency Milestone',
        tierLabel: 'Tier II',
        requiredMasteryLabel: '3+ Quizzes · ≥75% Avg Score',
        description:
          'Recognizes consistent analytical accuracy across at least three consecutive module assessments.',
        statutoryScope: 'Assessment Procedures & Return Computation',
        iconType: 'sprinter',
        unlocked: sprinterUnlocked,
        progressPercent: sprinterProgress,
        progressText: `${Math.min(quizPassedCount, 3)}/3 Quizzes · Avg ${avgQuizScore}%`,
        achievedScoreLabel: sprinterUnlocked ? `Avg Mastery: ${avgQuizScore}%` : `Current Avg: ${avgQuizScore}%`,
        nextActionLessonIndex: nextUnpassedQuizIndex,
        nextActionLabel: 'Continue Module Quizzes'
      },
      {
        id: 'badge-vat-pro',
        title: 'VAT Pro',
        bengaliSubtitle: 'মূসক ও উৎস কর বিশেষজ্ঞ ব্যাজ',
        categoryLabel: 'Indirect & Source Tax',
        tierLabel: 'Tier III',
        requiredMasteryLabel: '5+ Quizzes or Modules 4–6 · ≥80% Avg',
        description:
          'Certifies high-proficiency mastery in Value Added Tax (Mushak), TDS withholding schedules, and source tax compliance.',
        statutoryScope: 'VAT & SD Act 2012 · Withholding & VDS Rules',
        iconType: 'vat-pro',
        unlocked: vatProUnlocked,
        progressPercent: vatProProgress,
        progressText: `${Math.min(quizPassedCount, 5)}/5 Quizzes · Avg ${avgQuizScore}%`,
        achievedScoreLabel: vatProUnlocked ? `Verified (${avgQuizScore}% Mastery)` : 'Requires ≥80% Avg',
        nextActionLessonIndex: nextUnpassedQuizIndex,
        nextActionLabel: 'Advance to VAT & TDS Quizzes'
      },
      {
        id: 'badge-precision-100',
        title: 'Precision Mastery (100% Club)',
        bengaliSubtitle: 'শতভাগ নির্ভুল মূল্যায়ন অর্জন',
        categoryLabel: 'Accuracy Distinction',
        tierLabel: 'Tier III',
        requiredMasteryLabel: '100% Score on Any Quiz',
        description:
          'Awarded for achieving a flawless 100% score on a statutory class quiz with zero errors.',
        statutoryScope: 'Zero-Error Statutory Interpretation',
        iconType: 'perfect',
        unlocked: perfectUnlocked,
        progressPercent: perfectProgress,
        progressText: `${perfectQuizCount} Perfect Quiz${perfectQuizCount === 1 ? '' : 'zes'}`,
        achievedScoreLabel: perfectUnlocked
          ? `${perfectQuizCount}x 100% Achieved`
          : `Peak Score: ${bestSingleScore}%`,
        nextActionLessonIndex: nextUnpassedQuizIndex,
        nextActionLabel: 'Attempt 100% Quiz Score'
      },
      {
        id: 'badge-corporate-strategist',
        title: 'Corporate & Return Strategist',
        bengaliSubtitle: 'কর্পোরেট ও রিটার্ন কমপ্লায়েন্স দক্ষতা',
        categoryLabel: 'Advanced Practice',
        tierLabel: 'Tier IV',
        requiredMasteryLabel: '7+ Quizzes Passed · 5+ at ≥80%',
        description:
          'Demonstrates advanced command over wealth statements (IT-10B), investment rebates, and corporate return audits.',
        statutoryScope: 'IT-10B Reconciliation & Rebate Optimization',
        iconType: 'rjsc',
        unlocked: corporateUnlocked,
        progressPercent: corporateProgress,
        progressText: `${Math.min(quizPassedCount, 7)}/7 Quizzes · ${highMasteryQuizCount}/5 High-Score`,
        achievedScoreLabel: corporateUnlocked ? `Avg Mastery: ${avgQuizScore}%` : `${quizPassedCount}/7 Completed`,
        nextActionLessonIndex: nextUnpassedQuizIndex,
        nextActionLabel: 'Take Next Module Quiz'
      },
      {
        id: 'badge-tax-expert',
        title: 'Tax Expert',
        bengaliSubtitle: 'চূড়ান্ত কর আইন বিশেষজ্ঞ ব্যাজ',
        categoryLabel: 'Course Mastery',
        tierLabel: 'Tier IV',
        requiredMasteryLabel: `All ${totalQuizzes} Quizzes Passed · ≥80% Avg`,
        description:
          'Flagship subject-matter badge awarded to practitioners who pass every mandatory class quiz with at least 80% average mastery.',
        statutoryScope: `Full Curriculum (${course.title})`,
        iconType: 'tax-expert',
        unlocked: taxExpertUnlocked,
        progressPercent: taxExpertProgress,
        progressText: `${quizPassedCount}/${totalQuizzes} Quizzes · Avg ${avgQuizScore}%`,
        achievedScoreLabel: taxExpertUnlocked
          ? `Certified Tax Expert (${avgQuizScore}%)`
          : `${quizPassedCount}/${totalQuizzes} Quizzes Passed`,
        nextActionLessonIndex: nextUnpassedQuizIndex,
        nextActionLabel: 'Complete Remaining Quizzes'
      },
      {
        id: 'badge-distinction-laureate',
        title: 'Distinction Honor Laureate',
        bengaliSubtitle: 'ডিস্টিংশন অনার্স অর্জনকারী',
        categoryLabel: 'Examination Honors',
        tierLabel: 'Tier V',
        requiredMasteryLabel: 'All Quizzes + Final Exam ≥85%',
        description:
          'Reserved for top-decile scholars who complete all class assessments and pass the Final Examination with 85% or higher.',
        statutoryScope: 'Comprehensive Final Board Assessment',
        iconType: 'distinction',
        unlocked: distinctionUnlocked,
        progressPercent: distinctionProgress,
        progressText: eligibility.finalExamPassed
          ? `Final Exam: ${eligibility.finalExamBestScore}%`
          : `${quizPassedCount}/${totalQuizzes} Quizzes · Exam Pending`,
        achievedScoreLabel: distinctionUnlocked
          ? `Exam Score: ${eligibility.finalExamBestScore}%`
          : `Requires ≥85% Final Exam`,
        nextActionLabel: overallProgressCanTakeExam(quizPassedCount, totalQuizzes)
          ? 'Open Final Examination'
          : 'Unlock Final Exam First'
      },
      {
        id: 'badge-chartered-fellow',
        title: 'Chartered Compliance Fellow',
        bengaliSubtitle: 'সনদপ্রাপ্ত কমপ্লায়েন্স ফেলো',
        categoryLabel: 'Apex Credential',
        tierLabel: 'Tier V',
        requiredMasteryLabel: '100% Course & Certificate Verified',
        description:
          'The highest Academy milestone: all 10 classes, all mandatory quizzes, Firestore verification, and official certification complete.',
        statutoryScope: 'E-Lawyers Academy Verified Fellowship',
        iconType: 'fellow',
        unlocked: fellowUnlocked,
        progressPercent: fellowProgress,
        progressText: `${fellowCheckpoints}/4 Verification Gates`,
        achievedScoreLabel: fellowUnlocked ? 'Fellowship Active' : 'Pending Full Completion',
        nextActionLabel: 'View Eligibility Gates'
      }
    ];
  }, [masteryStats, computedLessons, eligibility, course.title]);

  const unlockedCount = useMemo(() => badges.filter((b) => b.unlocked).length, [badges]);

  const currentMasteryRank = useMemo(() => {
    if (unlockedCount >= 7) return 'Tier V · Distinguished Tax & VAT Fellow';
    if (unlockedCount >= 5) return 'Tier IV · Certified Tax Expert';
    if (unlockedCount >= 3) return 'Tier III · VAT & Compliance Pro';
    if (unlockedCount >= 1) return 'Tier II · Statutory Associate';
    return 'Tier I · Academy Initiate';
  }, [unlockedCount]);

  const filteredBadges = useMemo(() => {
    if (filterMode === 'unlocked') return badges.filter((b) => b.unlocked);
    if (filterMode === 'in_progress') return badges.filter((b) => !b.unlocked);
    return badges;
  }, [badges, filterMode]);

  const selectedBadge = useMemo(
    () => badges.find((b) => b.id === selectedBadgeId) || null,
    [badges, selectedBadgeId]
  );

  const renderBadgeIcon = (
    iconType: LearningMilestoneBadge['iconType'],
    unlocked: boolean
  ) => {
    const baseColor = unlocked ? 'text-emerald-700' : 'text-slate-400';
    switch (iconType) {
      case 'tax-expert':
        return <Trophy className={`w-6 h-6 ${unlocked ? 'text-amber-600' : baseColor}`} />;
      case 'vat-pro':
        return <ShieldCheck className={`w-6 h-6 ${unlocked ? 'text-emerald-700' : baseColor}`} />;
      case 'distinction':
        return <Sparkles className={`w-6 h-6 ${unlocked ? 'text-amber-600' : baseColor}`} />;
      case 'fellow':
        return <Award className={`w-6 h-6 ${unlocked ? 'text-emerald-700' : baseColor}`} />;
      case 'perfect':
        return <Target className={`w-6 h-6 ${unlocked ? 'text-emerald-700' : baseColor}`} />;
      case 'rjsc':
        return <FileCheck2 className={`w-6 h-6 ${unlocked ? 'text-emerald-700' : baseColor}`} />;
      case 'sprinter':
        return <CheckCircle2 className={`w-6 h-6 ${unlocked ? 'text-emerald-700' : baseColor}`} />;
      default:
        return <BookOpen className={`w-6 h-6 ${unlocked ? 'text-emerald-700' : baseColor}`} />;
    }
  };

  const handleDownloadBadgeTranscript = (badge: LearningMilestoneBadge) => {
    const content = [
      '====================================================================',
      '           E-LAWYERS ACADEMY — LEARNING MILESTONE CREDENTIAL        ',
      '====================================================================',
      '',
      `Badge Title         : ${badge.title} (${badge.tierLabel})`,
      `Category            : ${badge.categoryLabel}`,
      `Mastery Criterion   : ${badge.requiredMasteryLabel}`,
      `Statutory Scope     : ${badge.statutoryScope}`,
      '',
      `Recipient Name      : ${studentProfile.fullName}`,
      `Student ID          : ${studentProfile.studentId}`,
      `Enrolled Course     : ${course.title}`,
      `Quiz Mastery Score  : ${masteryStats.avgQuizScore}% Average (${masteryStats.quizPassedCount}/${masteryStats.totalQuizzes} Quizzes Passed)`,
      `Badge Status        : ${badge.unlocked ? 'UNLOCKED & VERIFIED' : 'IN PROGRESS'}`,
      `Issued / Checked On : ${new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })}`,
      '',
      '--------------------------------------------------------------------',
      'Verified by E-Lawyers BD Tax & Corporate Law Academy Portal',
      '===================================================================='
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${badge.id}-${studentProfile.studentId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section
      id="student-learning-milestones-section"
      aria-label="Learning Milestones and Virtual Mastery Badges"
      className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6"
    >
      {/* Top Header & Mastery Rank Summary */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
            <Award className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Learning Milestones · Quiz Mastery System</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Virtual Mastery Badges &amp; Competency Tiers
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            Earn verifiable specialist badges—including <strong className="font-semibold text-slate-800">Tax Expert</strong> and <strong className="font-semibold text-slate-800">VAT Pro</strong>—as you pass class quizzes and achieve higher statutory accuracy scores.
          </p>
        </div>

        {/* Interactive Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start lg:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterMode === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({badges.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('unlocked')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterMode === 'unlocked'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Unlocked ({unlockedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('in_progress')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterMode === 'in_progress'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            In Progress ({badges.length - unlockedCount})
          </button>
        </div>
      </div>

      {/* Mastery Overview Strip (Unboxed clean metrics + progress bar) */}
      <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-slate-500">Current Standing</div>
            <div className="text-sm sm:text-base font-bold text-slate-900">
              {currentMasteryRank}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-600 font-medium">
            <span>
              <strong className="font-bold text-slate-900 font-mono tabular-nums">
                {unlockedCount}/{badges.length}
              </strong>{' '}
              Badges Earned
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Quiz Mastery:{' '}
              <strong className="font-bold text-emerald-700 font-mono tabular-nums">
                {masteryStats.avgQuizScore}%
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Quizzes Passed:{' '}
              <strong className="font-bold text-slate-900 font-mono tabular-nums">
                {masteryStats.quizPassedCount}/{masteryStats.totalQuizzes}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              100% Scores:{' '}
              <strong className="font-bold text-slate-900 font-mono tabular-nums">
                {masteryStats.perfectQuizCount}
              </strong>
            </span>
          </div>
        </div>

        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-600 transition-all duration-500 rounded-full"
            style={{ width: `${Math.round((unlockedCount / badges.length) * 100)}%` }}
          />
        </div>
      </div>

      {/* Badges Grid */}
      {filteredBadges.length === 0 ? (
        <div className="py-10 text-center space-y-2 border border-dashed border-slate-200 rounded-xl">
          <p className="text-sm font-bold text-slate-800">
            No badges match the selected filter.
          </p>
          <p className="text-xs text-slate-500">
            Switch to &ldquo;All&rdquo; or complete class quizzes to unlock your first virtual mastery badge.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredBadges.map((badge) => {
            const isSelected = selectedBadgeId === badge.id;
            return (
              <div
                key={badge.id}
                id={badge.id}
                onClick={() => setSelectedBadgeId(isSelected ? null : badge.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedBadgeId(isSelected ? null : badge.id);
                  }
                }}
                className={`group rounded-2xl border p-5 flex flex-col justify-between transition-all text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-600 ${
                  badge.unlocked
                    ? isSelected
                      ? 'bg-emerald-50/50 border-emerald-500 shadow-sm'
                      : 'bg-white border-emerald-300 hover:border-emerald-400 shadow-2xs'
                    : isSelected
                    ? 'bg-slate-50 border-slate-400'
                    : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 opacity-90'
                }`}
              >
                <div className="space-y-3.5">
                  {/* Top Row: Icon Emblem + Unboxed Tier & Status Text */}
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-105 ${
                        badge.unlocked
                          ? badge.iconType === 'tax-expert' || badge.iconType === 'distinction'
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-emerald-50 border-emerald-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      {renderBadgeIcon(badge.iconType, badge.unlocked)}
                    </div>

                    <div className="text-right text-xs">
                      <div className="font-mono font-bold text-slate-500">
                        {badge.tierLabel} · {badge.categoryLabel}
                      </div>
                      <div
                        className={`font-bold mt-0.5 flex items-center justify-end gap-1 ${
                          badge.unlocked ? 'text-emerald-700' : 'text-slate-400'
                        }`}
                      >
                        {badge.unlocked ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Unlocked</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{badge.progressPercent}%</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                      {badge.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">{badge.bengaliSubtitle}</p>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {badge.description}
                  </p>
                </div>

                {/* Bottom Mastery Progress & Criterion Footer */}
                <div className="pt-4 mt-4 border-t border-slate-200/70 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium truncate pr-2">
                      {badge.requiredMasteryLabel}
                    </span>
                    <span
                      className={`font-mono font-bold shrink-0 ${
                        badge.unlocked ? 'text-emerald-700' : 'text-slate-700'
                      }`}
                    >
                      {badge.progressPercent}%
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        badge.unlocked ? 'bg-emerald-600' : 'bg-amber-500'
                      }`}
                      style={{ width: `${badge.progressPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    <span>{badge.progressText}</span>
                    <span className="font-semibold text-emerald-700 group-hover:underline">
                      {isSelected ? 'Hide details' : 'Inspect'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Badge Detailed Inspector Panel */}
      {selectedBadge && (
        <div
          id="selected-milestone-badge-inspector"
          className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 space-y-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-400 font-mono">
                <span>{selectedBadge.tierLabel}</span>
                <span aria-hidden="true">·</span>
                <span>{selectedBadge.categoryLabel}</span>
                <span aria-hidden="true">·</span>
                <span>{selectedBadge.unlocked ? 'Verified Mastery Credential' : 'Milestone In Progress'}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                {selectedBadge.title} — {selectedBadge.bengaliSubtitle}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                {selectedBadge.description}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedBadgeId(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close badge inspector"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-800 text-xs">
            <div>
              <div className="text-slate-400">Statutory Domain</div>
              <div className="font-semibold text-white mt-0.5">{selectedBadge.statutoryScope}</div>
            </div>
            <div>
              <div className="text-slate-400">Qualification Criterion</div>
              <div className="font-semibold text-white mt-0.5">
                {selectedBadge.requiredMasteryLabel}
              </div>
            </div>
            <div>
              <div className="text-slate-400">Your Mastery Status</div>
              <div className="font-semibold text-emerald-400 mt-0.5">
                {selectedBadge.progressText} · {selectedBadge.achievedScoreLabel}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <div className="text-xs text-slate-400">
              Recipient: <span className="text-slate-200 font-semibold">{studentProfile.fullName}</span> ({studentProfile.studentId})
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {selectedBadge.unlocked ? (
                <button
                  type="button"
                  onClick={() => handleDownloadBadgeTranscript(selectedBadge)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Badge Verification Slip</span>
                </button>
              ) : selectedBadge.id === 'badge-distinction-laureate' &&
                overallProgressCanTakeExam(masteryStats.quizPassedCount, masteryStats.totalQuizzes) &&
                onOpenFinalExam ? (
                <button
                  type="button"
                  onClick={onOpenFinalExam}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Start Final Examination</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                typeof selectedBadge.nextActionLessonIndex === 'number' &&
                onStartLessonQuiz && (
                  <button
                    type="button"
                    onClick={() => onStartLessonQuiz(selectedBadge.nextActionLessonIndex!)}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>
                      {selectedBadge.nextActionLabel ||
                        `Take Class 0${selectedBadge.nextActionLessonIndex + 1} Quiz`}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

function overallProgressCanTakeExam(passedQuizzes: number, totalQuizzes: number): boolean {
  return passedQuizzes >= totalQuizzes;
}
