import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Award,
  CheckCircle2,
  TrendingUp,
  Search,
  UserCheck,
  Sparkles,
  BarChart3
} from 'lucide-react';
import {
  ComputedLessonState,
  StudentProfileRecord,
  CertificateEligibilityState
} from '../../contexts/LmsContext';
import { LmsCourse } from '../../data/lmsCoursesData';

export interface LeaderboardStudentEntry {
  studentId: string;
  fullName: string;
  designation: string;
  courseId: string;
  courseShortLabel: string;
  quizzesCompleted: number;
  totalQuizzes: number;
  averageQuizScore: number; // 0 - 100
  totalQuizPoints: number; // max 1000 (10 quizzes * 100 pts)
  finalExamScore?: number;
  certified: boolean;
  lastActiveLabel: string;
  isCurrentUser?: boolean;
}

interface CohortSeedStudent {
  studentId: string;
  fullName: string;
  designation: string;
  courseId: string;
  quizScores: number[]; // scores for each completed quiz
  finalExamScore?: number;
  certified: boolean;
  lastActiveLabel: string;
}

const COHORT_SEED_STUDENTS: CohortSeedStudent[] = [
  {
    studentId: 'STU-2026-014',
    fullName: 'Barrister Nusrat Jahan',
    designation: 'Corporate Counsel',
    courseId: 'personal-income-tax',
    quizScores: [100, 100, 95, 100, 100, 95, 100, 100, 95, 100],
    finalExamScore: 96,
    certified: true,
    lastActiveLabel: '2h ago'
  },
  {
    studentId: 'STU-2026-029',
    fullName: 'Mahmudul Hasan, ACA',
    designation: 'Senior Tax Associate',
    courseId: 'personal-income-tax',
    quizScores: [100, 95, 95, 100, 90, 100, 95, 95, 100, 95],
    finalExamScore: 94,
    certified: true,
    lastActiveLabel: '4h ago'
  },
  {
    studentId: 'STU-2026-042',
    fullName: 'Farhana Yeasmin, ITP',
    designation: 'Tax Practitioner',
    courseId: 'personal-income-tax',
    quizScores: [95, 90, 95, 95, 100, 90, 95, 90, 95, 95],
    finalExamScore: 91,
    certified: true,
    lastActiveLabel: '1d ago'
  },
  {
    studentId: 'STU-2026-058',
    fullName: 'Adv. Tariqul Islam',
    designation: 'High Court Advocate',
    courseId: 'personal-income-tax',
    quizScores: [90, 95, 85, 90, 95, 90, 85, 90, 90],
    certified: false,
    lastActiveLabel: '6h ago'
  },
  {
    studentId: 'STU-2026-073',
    fullName: 'Sadia Afrin Chowdhury',
    designation: 'Finance Manager',
    courseId: 'personal-income-tax',
    quizScores: [90, 85, 90, 85, 90, 85, 90, 85],
    certified: false,
    lastActiveLabel: '1d ago'
  },
  {
    studentId: 'STU-2026-089',
    fullName: 'Rafiqul Alam, MBA',
    designation: 'Accounts Lead',
    courseId: 'personal-income-tax',
    quizScores: [85, 80, 90, 85, 80, 85],
    certified: false,
    lastActiveLabel: '2d ago'
  },
  {
    studentId: 'STU-2026-104',
    fullName: 'Adv. Shabnam Mustari',
    designation: 'Company Secretary',
    courseId: 'rjsc-corporate-compliance',
    quizScores: [100, 100, 95, 100, 95, 100, 100, 95, 100, 100],
    finalExamScore: 98,
    certified: true,
    lastActiveLabel: '3h ago'
  },
  {
    studentId: 'STU-2026-118',
    fullName: 'Kamrul Hasan Chowdhury',
    designation: 'Legal Compliance Officer',
    courseId: 'rjsc-corporate-compliance',
    quizScores: [95, 90, 95, 90, 95, 95, 90, 95, 90, 95],
    finalExamScore: 90,
    certified: true,
    lastActiveLabel: '5h ago'
  },
  {
    studentId: 'STU-2026-131',
    fullName: 'Nayeem Uddin Ahmed',
    designation: 'Startup Founder',
    courseId: 'rjsc-corporate-compliance',
    quizScores: [90, 85, 90, 85, 90, 85, 80],
    certified: false,
    lastActiveLabel: '1d ago'
  }
];

interface StudentQuizLeaderboardProps {
  course: LmsCourse;
  studentProfile: StudentProfileRecord;
  computedLessons: ComputedLessonState[];
  eligibility: CertificateEligibilityState;
}

export const StudentQuizLeaderboard: React.FC<StudentQuizLeaderboardProps> = ({
  course,
  studentProfile,
  computedLessons,
  eligibility
}) => {
  const [scopeFilter, setScopeFilter] = useState<'course' | 'all'>('course');
  const [sortMetric, setSortMetric] = useState<'points' | 'average' | 'completed'>('points');
  const [searchTerm, setSearchTerm] = useState('');

  // Compute live quiz completion metrics for the current logged-in student
  const currentUserEntry = useMemo<LeaderboardStudentEntry>(() => {
    const totalQuizzes = computedLessons.length || 10;
    const passedLessons = computedLessons.filter((item) => item.progress.quizPassed);
    const quizzesCompleted = passedLessons.length;

    const totalQuizPoints = passedLessons.reduce(
      (sum, item) => sum + (item.progress.quizBestScore || 100),
      0
    );

    const averageQuizScore =
      quizzesCompleted > 0
        ? Math.round((totalQuizPoints / quizzesCompleted) * 10) / 10
        : 0;

    return {
      studentId: studentProfile.studentId,
      fullName: studentProfile.fullName,
      designation: 'Enrolled Learner (You)',
      courseId: course.courseId,
      courseShortLabel:
        course.courseId === 'personal-income-tax'
          ? 'Income Tax Masterclass'
          : 'RJSC Corporate Compliance',
      quizzesCompleted,
      totalQuizzes,
      averageQuizScore,
      totalQuizPoints,
      finalExamScore:
        eligibility.finalExamBestScore > 0 ? eligibility.finalExamBestScore : undefined,
      certified: eligibility.isFullyEligible || Boolean(eligibility.certificate),
      lastActiveLabel: 'Just now',
      isCurrentUser: true
    };
  }, [course.courseId, computedLessons, studentProfile, eligibility]);

  // Build full leaderboard list combining cohort seed data and the live student entry
  const rankedStudents = useMemo(() => {
    const cohortEntries: LeaderboardStudentEntry[] = COHORT_SEED_STUDENTS.filter(
      (seed) =>
        seed.studentId !== studentProfile.studentId &&
        seed.fullName.toLowerCase() !== studentProfile.fullName.toLowerCase()
    ).map((seed) => {
      const quizzesCompleted = seed.quizScores.length;
      const totalQuizPoints = seed.quizScores.reduce((acc, s) => acc + s, 0);
      const averageQuizScore =
        quizzesCompleted > 0
          ? Math.round((totalQuizPoints / quizzesCompleted) * 10) / 10
          : 0;

      return {
        studentId: seed.studentId,
        fullName: seed.fullName,
        designation: seed.designation,
        courseId: seed.courseId,
        courseShortLabel:
          seed.courseId === 'personal-income-tax'
            ? 'Income Tax Masterclass'
            : 'RJSC Corporate Compliance',
        quizzesCompleted,
        totalQuizzes: 10,
        averageQuizScore,
        totalQuizPoints,
        finalExamScore: seed.finalExamScore,
        certified: seed.certified,
        lastActiveLabel: seed.lastActiveLabel,
        isCurrentUser: false
      };
    });

    const combined = [currentUserEntry, ...cohortEntries].filter((entry) =>
      scopeFilter === 'course' ? entry.courseId === course.courseId : true
    );

    combined.sort((a, b) => {
      if (sortMetric === 'average') {
        if (b.averageQuizScore !== a.averageQuizScore) {
          return b.averageQuizScore - a.averageQuizScore;
        }
        return b.totalQuizPoints - a.totalQuizPoints;
      }
      if (sortMetric === 'completed') {
        if (b.quizzesCompleted !== a.quizzesCompleted) {
          return b.quizzesCompleted - a.quizzesCompleted;
        }
        return b.averageQuizScore - a.averageQuizScore;
      }
      // Default: sort by total quiz points (combines completion count & score quality)
      if (b.totalQuizPoints !== a.totalQuizPoints) {
        return b.totalQuizPoints - a.totalQuizPoints;
      }
      return b.averageQuizScore - a.averageQuizScore;
    });

    return combined.map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));
  }, [currentUserEntry, scopeFilter, course.courseId, sortMetric, studentProfile]);

  const currentUserRanked = useMemo(
    () => rankedStudents.find((s) => s.isCurrentUser) || null,
    [rankedStudents]
  );

  const visibleRows = useMemo(() => {
    if (!searchTerm.trim()) return rankedStudents;
    const q = searchTerm.trim().toLowerCase();
    return rankedStudents.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        s.designation.toLowerCase().includes(q)
    );
  }, [rankedStudents, searchTerm]);

  const topThree = rankedStudents.slice(0, 3);

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
      {/* Top Section Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Live Cohort Quiz Standings</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Student Quiz Completion Leaderboard
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Ranked by cumulative quiz completion scores (up to 100 points per class quiz across 10 mandatory classes). Your rank updates automatically as you pass module quizzes.
          </p>
        </div>

        {/* Scope & Sort Switchers */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setScopeFilter('course')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                scopeFilter === 'course'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Course
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                scopeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Programs
            </button>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            {[
              { id: 'points' as const, label: 'Total Points' },
              { id: 'average' as const, label: 'Avg. Score %' },
              { id: 'completed' as const, label: 'Quizzes Done' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSortMetric(tab.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  sortMetric === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Current Student Live Standing Summary Strip */}
      {currentUserRanked && (
        <div className="rounded-xl bg-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex flex-col items-center justify-center shrink-0 font-mono tabular-nums">
              <span className="text-[10px] uppercase text-emerald-300 font-bold leading-none">
                Rank
              </span>
              <span className="text-lg font-extrabold text-white leading-tight">
                #{currentUserRanked.rank}
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-white">
                  {currentUserRanked.fullName}
                </span>
                <span className="text-xs font-mono tabular-nums text-emerald-400">
                  {currentUserRanked.studentId}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {currentUserRanked.quizzesCompleted === currentUserRanked.totalQuizzes
                  ? 'All 10 class quizzes completed! You are in the top tier of this cohort.'
                  : `Complete ${
                      currentUserRanked.totalQuizzes - currentUserRanked.quizzesCompleted
                    } more class quiz${
                      currentUserRanked.totalQuizzes - currentUserRanked.quizzesCompleted === 1
                        ? ''
                        : 'zes'
                    } to maximize your cumulative leaderboard score.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 sm:gap-8 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800 font-mono tabular-nums">
            <div>
              <div className="text-[11px] font-sans text-slate-400">Quizzes Passed</div>
              <div className="text-base sm:text-lg font-bold text-white">
                {currentUserRanked.quizzesCompleted}/{currentUserRanked.totalQuizzes}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-sans text-slate-400">Avg. Quiz Score</div>
              <div className="text-base sm:text-lg font-bold text-emerald-400">
                {currentUserRanked.averageQuizScore}%
              </div>
            </div>
            <div>
              <div className="text-[11px] font-sans text-slate-400">Total Points</div>
              <div className="text-base sm:text-lg font-bold text-amber-400">
                {currentUserRanked.totalQuizPoints} pts
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 Performers Podium Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topThree.map((student) => {
          const isFirst = student.rank === 1;
          const isSecond = student.rank === 2;
          return (
            <div
              key={student.studentId}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-colors ${
                student.isCurrentUser
                  ? 'border-emerald-400 bg-emerald-50/40'
                  : isFirst
                  ? 'border-amber-300 bg-amber-50/30'
                  : 'border-slate-200 bg-slate-50/50'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-extrabold font-mono tabular-nums ${
                      isFirst
                        ? 'text-amber-700'
                        : isSecond
                        ? 'text-slate-700'
                        : 'text-amber-800'
                    }`}
                  >
                    <Trophy
                      className={`w-4 h-4 ${
                        isFirst
                          ? 'text-amber-500'
                          : isSecond
                          ? 'text-slate-400'
                          : 'text-amber-700'
                      }`}
                    />
                    <span>RANK #{student.rank}</span>
                  </span>

                  <span className="text-xs font-mono tabular-nums text-slate-500">
                    {student.studentId}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-bold text-slate-900 truncate">
                      {student.fullName}
                    </h3>
                    {student.isCurrentUser && (
                      <span className="text-xs font-bold text-emerald-700 shrink-0">
                        (You)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{student.designation}</p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-200/80 flex items-baseline justify-between font-mono tabular-nums">
                <div className="text-xs text-slate-600">
                  <span className="font-bold text-slate-900">
                    {student.quizzesCompleted}/{student.totalQuizzes}
                  </span>{' '}
                  quizzes ·{' '}
                  <span className="font-bold text-emerald-700">
                    {student.averageQuizScore}%
                  </span>{' '}
                  avg
                </div>
                <div className="text-base font-extrabold text-slate-900">
                  {student.totalQuizPoints} <span className="text-xs font-normal text-slate-500">pts</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search & Full Standings Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Complete Cohort Standings ({visibleRows.length} Students)</span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search student name or ID..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Quizzes Completed</th>
                <th className="py-3 px-4">Avg. Quiz Score</th>
                <th className="py-3 px-4">Cumulative Points</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {visibleRows.map((entry) => {
                const completionRatio = Math.round(
                  (entry.quizzesCompleted / entry.totalQuizzes) * 100
                );
                return (
                  <tr
                    key={entry.studentId}
                    className={`transition-colors ${
                      entry.isCurrentUser
                        ? 'bg-emerald-50/70 font-medium'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono tabular-nums font-bold text-slate-900">
                      #{entry.rank}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{entry.fullName}</span>
                        {entry.isCurrentUser && (
                          <span className="text-[11px] font-bold text-emerald-700">
                            · You
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono tabular-nums">{entry.studentId}</span>
                        <span aria-hidden="true">·</span>
                        <span>{entry.designation}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono tabular-nums font-bold text-slate-800 w-10">
                          {entry.quizzesCompleted}/{entry.totalQuizzes}
                        </span>
                        <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200 hidden sm:block">
                          <div
                            className="h-full bg-emerald-600"
                            style={{ width: `${completionRatio}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono tabular-nums font-bold text-emerald-700">
                      {entry.averageQuizScore}%
                    </td>

                    <td className="py-3.5 px-4 font-mono tabular-nums font-bold text-slate-900">
                      {entry.totalQuizPoints} pts
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {entry.certified ? (
                        <span className="inline-flex items-center justify-end gap-1 text-xs font-bold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Certified</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-end gap-1 text-xs font-medium text-slate-500">
                          <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                          <span>Active ({entry.lastActiveLabel})</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
