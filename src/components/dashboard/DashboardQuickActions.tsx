import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  X, 
  Clock, 
  CheckCircle2, 
  Check, 
  BookOpen, 
  Calendar, 
  Zap, 
  Flame, 
  Sparkles, 
  ChevronRight, 
  Award, 
  FileSpreadsheet, 
  FileText, 
  Layers, 
  AlertCircle,
  TrendingUp,
  Tag
} from 'lucide-react';
import { CHECKLIST_ITEMS, ChecklistItem } from './ComplianceChecklist';
import { ComplianceDeadline } from './ComplianceDeadlineReminder';
import { DailyGoalItem, GoalSettings } from './DailyGoalTracker';
import { addClientActivity } from '../../services/clientActivityService';
import { getStreakFreezeData, StreakFreezeData } from '../../services/streakFreezeService';

interface DashboardQuickActionsProps {
  onOpenExportModal?: () => void;
  onNavigateTab?: (tab: string) => void;
}

const STORAGE_KEY_GOALS = 'accounticca_daily_goals_v1';
const STORAGE_KEY_SETTINGS = 'accounticca_daily_goal_settings_v1';
const STORAGE_KEY_STREAK = 'accounticca_daily_streak_v1';
const STORAGE_KEY_LAST_DATE = 'accounticca_streak_last_date_v1';
const STORAGE_KEY_DEADLINES = 'accounticca_compliance_deadline_reminders_v1';

const STUDY_TOPIC_PRESETS = [
  'Income Tax Act 2023 Assessment & Slabs',
  'Mushak 9.1 Monthly VAT Filing & VDS Rules',
  'RJSC Form IX & Annual Corporate Filings',
  'TDS Withholding & Deduction at Source',
  'Corporate Tax Planning & Minimum Turnover Tax',
  'Customs SROs & Advance Income Tax (AIT)'
];

const STUDY_DURATION_PRESETS = [
  { minutes: 15, label: '15 Mins', tag: 'Quick Read' },
  { minutes: 25, label: '25 Mins', tag: 'Pomodoro' },
  { minutes: 30, label: '30 Mins', tag: 'Standard (Rec)', isDefault: true },
  { minutes: 45, label: '45 Mins', tag: 'Deep Dive' },
  { minutes: 60, label: '60 Mins', tag: 'Mastery' }
];

export const DashboardQuickActions: React.FC<DashboardQuickActionsProps> = ({
  onOpenExportModal,
  onNavigateTab
}) => {
  // State for Speed Dial FAB
  const [isFabOpen, setIsFabOpen] = useState(false);

  // Modals state
  const [isStudyModalOpen, setIsStudyModalOpen] = useState(false);
  const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);

  // Study Session Form State
  const [studyMinutes, setStudyMinutes] = useState<number>(30);
  const [studyTopic, setStudyTopic] = useState<string>(STUDY_TOPIC_PRESETS[0]);
  const [customTopic, setCustomTopic] = useState<string>('');
  const [selectedGoalIdToComplete, setSelectedGoalIdToComplete] = useState<string>('');
  const [studyNotes, setStudyNotes] = useState<string>('');
  const [isLoggingStudy, setIsLoggingStudy] = useState(false);

  // Compliance Quick Mark State
  const [complianceTab, setComplianceTab] = useState<'checklist' | 'deadlines'>('checklist');
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [deadlines, setDeadlines] = useState<ComplianceDeadline[]>([]);

  // Daily goals state for linking
  const [dailyGoals, setDailyGoals] = useState<DailyGoalItem[]>([]);
  const [currentStreak, setCurrentStreak] = useState<number>(5);
  const [freezeData, setFreezeData] = useState<StreakFreezeData>(() => getStreakFreezeData());

  // Toast feedback state
  const [quickToast, setQuickToast] = useState<{ message: string; sub?: string } | null>(null);

  // Load latest state from localStorage
  const refreshLocalState = () => {
    try {
      // Goals
      const rawGoals = localStorage.getItem(STORAGE_KEY_GOALS);
      if (rawGoals) setDailyGoals(JSON.parse(rawGoals));

      // Streak
      const rawStreak = localStorage.getItem(STORAGE_KEY_STREAK);
      if (rawStreak) setCurrentStreak(parseInt(rawStreak, 10));

      // Checklist
      const rawChecklist = localStorage.getItem('corporateChecklist');
      if (rawChecklist) setChecklistState(JSON.parse(rawChecklist));

      // Deadlines
      const rawDeadlines = localStorage.getItem(STORAGE_KEY_DEADLINES);
      if (rawDeadlines) setDeadlines(JSON.parse(rawDeadlines));

      // Freeze Data
      setFreezeData(getStreakFreezeData());
    } catch {}
  };

  useEffect(() => {
    refreshLocalState();
    window.addEventListener('storage', refreshLocalState);
    window.addEventListener('accounticca_goals_updated', refreshLocalState);
    window.addEventListener('accounticca_deadlines_updated', refreshLocalState);
    window.addEventListener('corporate_checklist_updated', refreshLocalState);
    window.addEventListener('accounticca_freeze_updated', refreshLocalState);

    return () => {
      window.removeEventListener('storage', refreshLocalState);
      window.removeEventListener('accounticca_goals_updated', refreshLocalState);
      window.removeEventListener('accounticca_deadlines_updated', refreshLocalState);
      window.removeEventListener('corporate_checklist_updated', refreshLocalState);
      window.removeEventListener('accounticca_freeze_updated', refreshLocalState);
    };
  }, []);

  const showToast = (message: string, sub?: string) => {
    setQuickToast({ message, sub });
    setTimeout(() => {
      setQuickToast(null);
    }, 4000);
  };

  // Submit Study Session Log
  const handleLogStudySession = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingStudy(true);

    const finalTopic = customTopic.trim() ? customTopic.trim() : studyTopic;
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      // 1. Update Goal Items
      let updatedGoals = [...dailyGoals];
      let goalTitleCompleted = '';

      if (selectedGoalIdToComplete) {
        updatedGoals = updatedGoals.map(g => {
          if (g.id === selectedGoalIdToComplete) {
            goalTitleCompleted = g.title;
            return { ...g, completed: true, minutesEstimate: Math.max(g.minutesEstimate, studyMinutes) };
          }
          return g;
        });
      } else {
        // Create an explicit completed study item in the list
        const newGoal: DailyGoalItem = {
          id: `goal-study-${Date.now()}`,
          type: 'article_read',
          title: `Study Session: ${finalTopic}`,
          category: 'Tax & Legal Study',
          completed: true,
          minutesEstimate: studyMinutes
        };
        updatedGoals.unshift(newGoal);
      }

      localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(updatedGoals));
      setDailyGoals(updatedGoals);

      // 2. Check and Increment Streak
      let newStreak = currentStreak;
      const lastCompletedDate = localStorage.getItem(STORAGE_KEY_LAST_DATE);
      if (lastCompletedDate !== todayStr) {
        newStreak = currentStreak + 1;
        localStorage.setItem(STORAGE_KEY_LAST_DATE, todayStr);
        localStorage.setItem(STORAGE_KEY_STREAK, newStreak.toString());
        setCurrentStreak(newStreak);
      }

      // 3. Log Client/User Activity
      addClientActivity({
        type: 'task_completion',
        title: `Logged ${studyMinutes}m Study: ${finalTopic}`,
        description: studyNotes.trim() 
          ? studyNotes.trim() 
          : `Dedicated study session completed on ${finalTopic}. Daily learning quota progress updated.`,
        clientName: 'Active Learner',
        clientCompany: 'Compliance & Advisory Desk',
        clientEmail: 'learning@accounticca.com',
        status: 'verified',
        practiceArea: 'Legal Research & Study',
        referenceId: `STD-${Date.now().toString().slice(-4)}`,
        sourceChannel: 'Dashboard Quick Actions Hub',
        notes: `Duration: ${studyMinutes} mins. Active streak: ${newStreak} days.`
      });

      // 4. Dispatch custom event so DailyGoalTracker and other components update immediately
      window.dispatchEvent(new Event('accounticca_goals_updated'));

      showToast(
        `Logged ${studyMinutes} minutes of study!`,
        `Topic: ${finalTopic} • Streak: ${newStreak} days 🔥`
      );

      // Close modal and reset form
      setIsStudyModalOpen(false);
      setCustomTopic('');
      setSelectedGoalIdToComplete('');
      setStudyNotes('');
    } catch (err: any) {
      showToast('Error logging study session', err.message);
    } finally {
      setIsLoggingStudy(false);
    }
  };

  // Toggle Corporate Checklist Item
  const handleToggleChecklistItem = (item: ChecklistItem) => {
    const isCurrentlyChecked = !!checklistState[item.id];
    const willBeChecked = !isCurrentlyChecked;

    const nextState = { ...checklistState, [item.id]: willBeChecked };
    setChecklistState(nextState);
    localStorage.setItem('corporateChecklist', JSON.stringify(nextState));
    window.dispatchEvent(new Event('corporate_checklist_updated'));

    if (willBeChecked) {
      addClientActivity({
        type: 'task_completion',
        title: `Completed ${item.label}`,
        description: item.description || `Verified compliance item: ${item.label}`,
        clientName: 'Active Client Account',
        clientCompany: 'Corporate Tax Compliance Docket',
        clientEmail: 'compliance@accounticca.com',
        status: 'completed',
        practiceArea: 'Corporate Tax & Compliance',
        referenceId: `TSK-${Date.now().toString().slice(-4)}`,
        sourceChannel: 'Quick Actions Speed Dial',
        notes: 'Completed and verified via Dashboard Quick Actions.'
      });

      showToast(`Marked '${item.label}' complete!`, 'Corporate Tax Checklist updated.');
    } else {
      showToast(`Unchecked '${item.label}'.`, 'Checklist item reset to pending.');
    }
  };

  // Toggle Statutory Deadline Completion
  const handleToggleDeadlineComplete = (deadline: ComplianceDeadline) => {
    const nextCompleted = !deadline.isCompleted;
    const updated = deadlines.map(d => {
      if (d.id === deadline.id) {
        return {
          ...d,
          isCompleted: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : undefined
        };
      }
      return d;
    });

    setDeadlines(updated);
    localStorage.setItem(STORAGE_KEY_DEADLINES, JSON.stringify(updated));
    window.dispatchEvent(new Event('accounticca_deadlines_updated'));

    if (nextCompleted) {
      addClientActivity({
        type: 'compliance_update',
        title: `Filed Deadline: ${deadline.title}`,
        description: `Statutory filing confirmed for ${deadline.title} (${deadline.dueDate}).`,
        clientName: deadline.entityName || 'General Tax File',
        clientCompany: 'Compliance Record Desk',
        clientEmail: 'compliance@accounticca.com',
        status: 'verified',
        practiceArea: deadline.category,
        referenceId: `FIL-${Date.now().toString().slice(-4)}`,
        sourceChannel: 'Quick Actions Speed Dial',
        notes: `Statutory compliance filing completed on ${new Date().toLocaleDateString()}.`
      });

      showToast(`Statutory Filing Complete!`, `${deadline.title} marked as filed.`);
    } else {
      showToast(`Deadline status reset`, `${deadline.title} marked pending.`);
    }
  };

  // Pending counts
  const pendingChecklistCount = CHECKLIST_ITEMS.filter(it => !checklistState[it.id]).length;
  const pendingDeadlinesCount = deadlines.filter(d => !d.isCompleted).length;

  return (
    <>
      {/* 1. TOP 'QUICK LINKS' BAR IN DASHBOARD */}
      <div 
        id="dashboard-quick-actions-bar"
        className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-4 sm:p-5 text-white shadow-md border border-slate-700/80 space-y-3"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-700/70 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-wide text-white">Workflow Quick Actions</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  1-Click Workflow
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Instantly log daily tax study time or mark compliance tasks and statutory deadlines complete.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold shrink-0">
            <span className="text-amber-300 flex items-center gap-1 bg-amber-950/60 border border-amber-500/30 px-2.5 py-1 rounded-xl">
              <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>{currentStreak} Day Streak</span>
            </span>

            {/* Streak Freeze Status */}
            <button
              onClick={() => {
                if (onNavigateTab) onNavigateTab('achievements');
                const el = document.getElementById('streak-freeze-protection-card');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                freezeData.isFreezeActiveForToday
                  ? 'bg-cyan-950/80 text-cyan-200 border-cyan-400/60 shadow-2xs hover:bg-cyan-900/80'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white hover:border-slate-600'
              }`}
              title="Manage Streak Freeze Protection in Achievements"
            >
              <span className="text-sm">❄️</span>
              <span>{freezeData.isFreezeActiveForToday ? 'Shielded' : `${freezeData.tokensAvailable} Freeze`}</span>
            </button>
          </div>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center gap-2.5 flex-wrap pt-0.5">
          {/* Quick Action 1: Log Study Session */}
          <button
            id="quick-link-log-study-btn"
            onClick={() => setIsStudyModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-all shadow-xs cursor-pointer active:scale-95"
            title="Log a study session to hit daily quota and maintain your streak"
          >
            <Clock className="w-4 h-4 text-emerald-200" />
            <span>Log Study Session</span>
            <span className="text-[10px] bg-emerald-700 text-emerald-100 font-mono px-1.5 py-0.2 rounded">
              +15/30m
            </span>
          </button>

          {/* Quick Action 2: Mark Compliance Complete */}
          <button
            id="quick-link-mark-compliance-btn"
            onClick={() => setIsComplianceModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-xs cursor-pointer active:scale-95"
            title="Mark corporate checklist items or upcoming deadlines as complete"
          >
            <CheckCircle2 className="w-4 h-4 text-slate-950" />
            <span>Mark Compliance Complete</span>
            {(pendingChecklistCount > 0 || pendingDeadlinesCount > 0) && (
              <span className="text-[10px] bg-slate-900 text-amber-300 font-bold px-1.5 py-0.2 rounded-full">
                {pendingChecklistCount + pendingDeadlinesCount}
              </span>
            )}
          </button>

          {/* Quick Action 3: Open Deadlines Calendar */}
          <button
            id="quick-link-deadlines-calendar-btn"
            onClick={() => {
              if (onNavigateTab) {
                onNavigateTab('deadlines');
              } else {
                const el = document.getElementById('compliance-deadlines-calendar-component');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs transition-all border border-slate-700 cursor-pointer"
            title="View full interactive compliance calendar"
          >
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>Deadlines Calendar</span>
          </button>

          {/* Quick Action 4: Export CSV */}
          <button
            id="quick-link-export-data-btn"
            onClick={() => {
              if (onOpenExportModal) onOpenExportModal();
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs transition-all border border-slate-700 cursor-pointer"
            title="Download activity progress and stored deadlines as CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. FLOATING ACTION BUTTON (SPEED DIAL) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end pointer-events-auto">
        {/* Speed Dial Options Menu (Expanded) */}
        {isFabOpen && (
          <div className="mb-3 space-y-2.5 flex flex-col items-end animate-fade-in">
            {/* Speed Option 1: Log Study Session */}
            <div className="flex items-center gap-2.5">
              <span className="bg-slate-900/90 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-md border border-slate-700 whitespace-nowrap">
                Log Study Session (+30m)
              </span>
              <button
                id="fab-action-log-study"
                onClick={() => {
                  setIsFabOpen(false);
                  setIsStudyModalOpen(true);
                }}
                className="w-12 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                title="Log a study session"
              >
                <Clock className="w-5 h-5" />
              </button>
            </div>

            {/* Speed Option 2: Mark Compliance Complete */}
            <div className="flex items-center gap-2.5">
              <span className="bg-slate-900/90 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-md border border-slate-700 whitespace-nowrap">
                Mark Compliance Complete
              </span>
              <button
                id="fab-action-mark-compliance"
                onClick={() => {
                  setIsFabOpen(false);
                  setIsComplianceModalOpen(true);
                }}
                className="w-12 h-12 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                title="Mark compliance items complete"
              >
                <CheckCircle2 className="w-5 h-5 text-slate-950" />
              </button>
            </div>

            {/* Speed Option 3: Jump to Calendar */}
            <div className="flex items-center gap-2.5">
              <span className="bg-slate-900/90 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-md border border-slate-700 whitespace-nowrap">
                Compliance Calendar View
              </span>
              <button
                id="fab-action-deadlines"
                onClick={() => {
                  setIsFabOpen(false);
                  if (onNavigateTab) {
                    onNavigateTab('deadlines');
                  } else {
                    const el = document.getElementById('compliance-deadlines-calendar-component');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="w-12 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                title="View compliance calendar"
              >
                <Calendar className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Primary FAB Trigger Button */}
        <button
          id="dashboard-floating-action-btn"
          onClick={() => setIsFabOpen(!isFabOpen)}
          className={`w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center transition-all duration-300 cursor-pointer ${
            isFabOpen 
              ? 'bg-slate-900 text-white rotate-90 scale-95' 
              : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-105 active:scale-95 ring-4 ring-emerald-500/30'
          }`}
          title={isFabOpen ? 'Close Quick Actions' : 'Quick Actions Hub (Study & Compliance)'}
          aria-expanded={isFabOpen}
        >
          {isFabOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <div className="relative">
              <Zap className="w-6 h-6 text-amber-300" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            </div>
          )}
        </button>
      </div>

      {/* 3. QUICK LOG STUDY SESSION MODAL */}
      {isStudyModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsStudyModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Quick Log Study Session</h3>
                  <p className="text-xs text-slate-500">Record learning time to update quota and advance your streak.</p>
                </div>
              </div>
              <button
                onClick={() => setIsStudyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleLogStudySession} className="space-y-4">
              {/* Duration Presets */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  Select Study Duration
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {STUDY_DURATION_PRESETS.map((dur) => (
                    <button
                      key={dur.minutes}
                      type="button"
                      onClick={() => setStudyMinutes(dur.minutes)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        studyMinutes === dur.minutes 
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-black shadow-xs' 
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-bold'
                      }`}
                    >
                      <div className="text-sm font-black">{dur.minutes}m</div>
                      <div className="text-[9px] text-slate-500 uppercase">{dur.tag}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Study Topic Preset or Custom */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  Knowledge Topic / Focus
                </label>
                <select
                  value={studyTopic}
                  onChange={(e) => setStudyTopic(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {STUDY_TOPIC_PRESETS.map((topic) => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Or enter custom topic / article title..."
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Link to Existing Daily Goal (Optional) */}
              {dailyGoals.filter(g => !g.completed).length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                    Mark Incomplete Goal (Optional)
                  </label>
                  <select
                    value={selectedGoalIdToComplete}
                    onChange={(e) => setSelectedGoalIdToComplete(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="">None (Log as standalone study time)</option>
                    {dailyGoals.filter(g => !g.completed).map((goal) => (
                      <option key={goal.id} value={goal.id}>
                        ✓ Complete: {goal.title} ({goal.minutesEstimate}m)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Study Notes (Optional) */}
              <div className="space-y-1">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  Key Takeaways / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Reviewed revised Section 78 investment rebate ceiling rules."
                  value={studyNotes}
                  onChange={(e) => setStudyNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Quota & Streak Impact Banner */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Adds <strong>{studyMinutes} mins</strong> toward daily activity quota.</span>
                </div>
                <span className="font-extrabold text-amber-800">
                  Streak: {currentStreak}d 🔥
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStudyModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoggingStudy}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isLoggingStudy ? 'Saving...' : 'Save & Log Session'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. QUICK MARK COMPLIANCE COMPLETE MODAL */}
      {isComplianceModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsComplianceModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-scale-up max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Quick Mark Compliance Complete</h3>
                  <p className="text-xs text-slate-500">1-click checklist task completion & statutory deadline filing.</p>
                </div>
              </div>
              <button
                onClick={() => setIsComplianceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-Tabs: Checklist vs Deadlines */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => setComplianceTab('checklist')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  complianceTab === 'checklist' 
                    ? 'bg-white text-slate-900 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>Corporate Checklist ({pendingChecklistCount} Pending)</span>
              </button>

              <button
                type="button"
                onClick={() => setComplianceTab('deadlines')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  complianceTab === 'deadlines' 
                    ? 'bg-white text-slate-900 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Statutory Deadlines ({pendingDeadlinesCount} Pending)</span>
              </button>
            </div>

            {/* Scrollable Items List */}
            <div className="overflow-y-auto flex-1 space-y-2.5 pr-1">
              {complianceTab === 'checklist' ? (
                <>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    Corporate Tax Assessment Checklist Items
                  </div>
                  {CHECKLIST_ITEMS.map((item) => {
                    const isChecked = !!checklistState[item.id];
                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isChecked 
                            ? 'bg-emerald-50/50 border-emerald-200' 
                            : 'bg-white border-slate-200 hover:border-amber-300'
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{item.label}</span>
                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                              item.category === 'mandatory' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {item.category}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-[11px] text-slate-500 leading-snug truncate">{item.description}</p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleChecklistItem(item)}
                          className={`shrink-0 px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                            isChecked
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                              : 'bg-slate-100 text-slate-800 hover:bg-emerald-600 hover:text-white border border-slate-200'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isChecked ? 'Completed' : 'Mark Done'}</span>
                        </button>
                      </div>
                    );
                  })}
                </>
              ) : (
                <>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    Stored Compliance Deadline Filings
                  </div>
                  {deadlines.length > 0 ? (
                    deadlines.map((dl) => (
                      <div
                        key={dl.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          dl.isCompleted 
                            ? 'bg-emerald-50/50 border-emerald-200' 
                            : 'bg-white border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 truncate">{dl.title}</span>
                            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800">
                              {dl.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                            <span>📅 Due: <strong>{dl.dueDate}</strong></span>
                            {dl.entityName && <span>• 🏢 {dl.entityName}</span>}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleDeadlineComplete(dl)}
                          className={`shrink-0 px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                            dl.isCompleted
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                              : 'bg-amber-500 text-slate-950 hover:bg-amber-600 shadow-2xs'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{dl.isCompleted ? 'Filed' : 'Mark Filed'}</span>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No compliance deadlines found in browser storage.
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs shrink-0">
              <span className="text-slate-500">
                Syncs with Checklist, Activity Feed &amp; Deadlines Calendar
              </span>
              <button
                type="button"
                onClick={() => setIsComplianceModalOpen(false)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. IN-APP INSTANT TOAST NOTIFICATION */}
      {quickToast && (
        <div className="fixed bottom-24 right-6 z-50 bg-slate-950 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-slide-up max-w-sm">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <Check className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <div className="font-extrabold text-white">{quickToast.message}</div>
            {quickToast.sub && <div className="text-slate-400 text-[11px] mt-0.5">{quickToast.sub}</div>}
          </div>
        </div>
      )}
    </>
  );
};
