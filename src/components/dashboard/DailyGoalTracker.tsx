import React, { useState, useEffect } from 'react';
import { 
  Target, 
  CheckCircle2, 
  Circle, 
  Flame, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Settings, 
  BookOpen, 
  Calculator, 
  Award, 
  Sparkles, 
  Clock, 
  Check, 
  X, 
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  Star,
  Trophy,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AchievementCelebrationModal, STREAK_MILESTONES } from './AchievementCelebrationModal';
import { 
  getStreakFreezeData, 
  StreakFreezeData 
} from '../../services/streakFreezeService';
import { StreakFreezeModal } from './StreakFreezeModal';

export interface DailyGoalItem {
  id: string;
  type: 'article_read' | 'tax_practice' | 'tool_test' | 'custom';
  title: string;
  category: string;
  completed: boolean;
  minutesEstimate: number;
}

export interface GoalSettings {
  targetArticles: number;
  targetPractices: number;
  targetMinutes: number;
}

const STORAGE_KEY_GOALS = 'accounticca_daily_goals_v1';
const STORAGE_KEY_SETTINGS = 'accounticca_daily_goal_settings_v1';
const STORAGE_KEY_STREAK = 'accounticca_daily_streak_v1';
const STORAGE_KEY_LAST_DATE = 'accounticca_streak_last_date_v1';

const DEFAULT_GOAL_ITEMS: DailyGoalItem[] = [
  {
    id: 'goal-1',
    type: 'article_read',
    title: 'Read 1 Income Tax Act 2023 Guide (Section 78 Rebate / Total Income)',
    category: 'Income Tax',
    completed: true,
    minutesEstimate: 8
  },
  {
    id: 'goal-2',
    type: 'article_read',
    title: 'Read 1 Corporate Law or RJSC Filing Dispatch',
    category: 'Corporate Law',
    completed: false,
    minutesEstimate: 6
  },
  {
    id: 'goal-3',
    type: 'tax_practice',
    title: 'Practice 1 Tax Assessment Calculation (Individual / Corporate Slab)',
    category: 'Tax Calculator',
    completed: true,
    minutesEstimate: 10
  },
  {
    id: 'goal-4',
    type: 'tool_test',
    title: 'Test 1 Interactive Tool (RJsc Fee Calculator / Post-Reg Checklist)',
    category: 'Compliance Tool',
    completed: false,
    minutesEstimate: 5
  }
];

const DEFAULT_SETTINGS: GoalSettings = {
  targetArticles: 2,
  targetPractices: 1,
  targetMinutes: 20
};

export const DailyGoalTracker: React.FC = () => {
  const [goalItems, setGoalItems] = useState<DailyGoalItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GOALS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_GOAL_ITEMS;
  });

  const [settings, setSettings] = useState<GoalSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_SETTINGS;
  });

  const [streakDays, setStreakDays] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STREAK);
      if (saved) return parseInt(saved, 10);
    } catch {}
    return 5;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalType, setNewGoalType] = useState<'article_read' | 'tax_practice' | 'custom'>('article_read');
  const [newGoalCategory, setNewGoalCategory] = useState('Income Tax');
  const [newGoalMinutes, setNewGoalMinutes] = useState(5);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [celebrationMilestone, setCelebrationMilestone] = useState<number | undefined>(undefined);

  // Streak Freeze Protection State
  const [freezeData, setFreezeData] = useState<StreakFreezeData>(() => getStreakFreezeData());
  const [showFreezeModal, setShowFreezeModal] = useState(false);

  useEffect(() => {
    const handleFreezeUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<StreakFreezeData>;
      if (customEvent.detail) {
        setFreezeData(customEvent.detail);
      } else {
        setFreezeData(getStreakFreezeData());
      }
    };
    window.addEventListener('accounticca_freeze_updated', handleFreezeUpdate);
    return () => window.removeEventListener('accounticca_freeze_updated', handleFreezeUpdate);
  }, []);

  // Auto trigger Achievement Celebration Modal when streak matches milestone
  useEffect(() => {
    const milestoneDays = [3, 7, 14, 30, 60, 90, 100];
    if (milestoneDays.includes(streakDays)) {
      const lastCelebratedKey = 'accounticca_last_celebrated_streak_v1';
      try {
        const lastCelebrated = localStorage.getItem(lastCelebratedKey);
        if (lastCelebrated !== streakDays.toString()) {
          localStorage.setItem(lastCelebratedKey, streakDays.toString());
          setCelebrationMilestone(streakDays);
          setShowCelebrationModal(true);
        }
      } catch {}
    }
  }, [streakDays]);

  // Sync external updates from Floating Action Button / Quick Links
  useEffect(() => {
    const syncFromStorage = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_GOALS);
        if (saved) setGoalItems(JSON.parse(saved));
        const savedStreak = localStorage.getItem(STORAGE_KEY_STREAK);
        if (savedStreak) setStreakDays(parseInt(savedStreak, 10));
      } catch {}
    };

    window.addEventListener('storage', syncFromStorage);
    window.addEventListener('accounticca_goals_updated', syncFromStorage);
    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener('accounticca_goals_updated', syncFromStorage);
    };
  }, []);

  // Derived metrics
  const completedCount = goalItems.filter(i => i.completed).length;
  const totalCount = goalItems.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const completedArticles = goalItems.filter(i => i.type === 'article_read' && i.completed).length;
  const completedPractices = goalItems.filter(i => (i.type === 'tax_practice' || i.type === 'tool_test') && i.completed).length;
  const loggedMinutes = goalItems.filter(i => i.completed).reduce((sum, i) => sum + i.minutesEstimate, 0);

  const articlesPct = settings.targetArticles > 0 ? Math.min(100, Math.round((completedArticles / settings.targetArticles) * 100)) : 0;
  const practicesPct = settings.targetPractices > 0 ? Math.min(100, Math.round((completedPractices / settings.targetPractices) * 100)) : 0;
  const minutesPct = settings.targetMinutes > 0 ? Math.min(100, Math.round((loggedMinutes / settings.targetMinutes) * 100)) : 0;

  const isAllGoalsMet = completionPercentage === 100 || (completedArticles >= settings.targetArticles && completedPractices >= settings.targetPractices);

  // Save changes to localStorage & update streak when daily goals are completed
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(goalItems));
    } catch {}

    if (isAllGoalsMet && totalCount > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      try {
        const lastCompletedDate = localStorage.getItem(STORAGE_KEY_LAST_DATE);
        if (lastCompletedDate !== todayStr) {
          localStorage.setItem(STORAGE_KEY_LAST_DATE, todayStr);
          setStreakDays(prev => {
            const next = prev + 1;
            localStorage.setItem(STORAGE_KEY_STREAK, next.toString());
            return next;
          });
        }
      } catch {}
    }
  }, [goalItems, isAllGoalsMet, totalCount, settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STREAK, streakDays.toString());
    } catch {}
  }, [streakDays]);

  const toggleGoal = (id: string) => {
    setGoalItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, completed: !item.completed };
      }
      return item;
    }));
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    const newItem: DailyGoalItem = {
      id: `goal-${Date.now()}`,
      type: newGoalType,
      title: newGoalTitle.trim(),
      category: newGoalCategory,
      completed: false,
      minutesEstimate: Number(newGoalMinutes) || 5
    };

    setGoalItems(prev => [...prev, newItem]);
    setNewGoalTitle('');
    setShowAddForm(false);
  };

  const handleDeleteGoal = (id: string) => {
    setGoalItems(prev => prev.filter(i => i.id !== id));
  };

  const handleResetToday = () => {
    setGoalItems(prev => prev.map(i => ({ ...i, completed: false })));
  };

  const handleResetDefaultGoals = () => {
    setGoalItems(DEFAULT_GOAL_ITEMS);
    setSettings(DEFAULT_SETTINGS);
  };

  const handleIncrementStreak = () => {
    setStreakDays(prev => prev + 1);
  };

  const handleResetStreak = () => {
    if (freezeData.isFreezeActiveForToday) {
      const confirmReset = window.confirm(
        `Notice: Your ${streakDays}-day streak is currently shielded by an active Streak Freeze for today! 🛡️\n\nAre you sure you want to manually reset your streak to 0?`
      );
      if (!confirmReset) return;
    }
    setStreakDays(0);
  };

  return (
    <div id="daily-goal-tracker-card" className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
      
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 shadow-xs shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-bold text-slate-900">Daily Compliance & Study Goal Tracker</h3>
              
              {/* Active Flame Streak Badge */}
              <button
                onClick={() => setShowCelebrationModal(true)}
                className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full transition-all cursor-pointer shadow-xs ${
                  streakDays > 0
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/20'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
                title="Click to open Achievement Celebration Modal"
              >
                <Flame className={`w-4 h-4 ${streakDays > 0 ? 'text-amber-100 fill-amber-200 animate-bounce' : 'text-slate-400'}`} />
                <span>{streakDays > 0 ? `${streakDays}-Day Active Streak!` : 'Start Daily Streak'}</span>
              </button>

              {/* Quick Streak Freeze Status Badge */}
              {freezeData.isFreezeActiveForToday ? (
                <button
                  onClick={() => setShowFreezeModal(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-black text-cyan-800 bg-cyan-100 border border-cyan-300 px-2.5 py-0.5 rounded-full hover:bg-cyan-200 transition-colors cursor-pointer"
                  title="Streak Freeze is Active for Today!"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-700" />
                  <span>Freeze Active</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowFreezeModal(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
                  title="Click to manage Streak Freeze protection"
                >
                  <span>❄️ {freezeData.tokensAvailable} Freeze</span>
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Set daily goals for reading statutory tax dispatches, practicing calculations, and completing compliance checklists
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={() => setShowCelebrationModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-xs transition-colors cursor-pointer"
            title="View Achievement Celebration Modal"
          >
            <Award className="w-4 h-4 text-slate-950" />
            <span>Celebration Modal</span>
          </button>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            title="Add a custom daily learning goal"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Goal</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            title="Configure daily targets"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Streak Highlight Banner Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-5 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shrink-0 shadow-inner cursor-pointer" onClick={() => setShowCelebrationModal(true)}>
            <Flame className="w-8 h-8 text-amber-100 fill-amber-100 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-amber-100 bg-black/20 px-2.5 py-0.5 rounded-full">
                Consecutive Learning Streak
              </span>
              {isAllGoalsMet && (
                <span className="text-xs font-bold text-emerald-200 bg-emerald-950/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" /> Today Met
                </span>
              )}
              {freezeData.isFreezeActiveForToday && (
                <span className="text-xs font-black text-cyan-100 bg-cyan-950/50 border border-cyan-300/60 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Freeze Shield Active</span>
                </span>
              )}
            </div>
            <h4 className="text-2xl font-black text-white mt-1 flex items-baseline gap-2">
              <span>{streakDays} Days Streak</span>
              <span className="text-xs font-semibold text-amber-100">
                {streakDays >= 7 ? '🔥 Master Compliance Rank' : streakDays >= 3 ? '⚡ Active Learner' : 'Daily Starter'}
              </span>
            </h4>
            <p className="text-xs text-amber-100/90 mt-0.5">
              {freezeData.isFreezeActiveForToday
                ? 'Streak Freeze is protecting your streak today! You will not lose your progress even if you miss daily goals.'
                : isAllGoalsMet
                  ? 'Congratulations! You met all daily activity goals today. Your streak is recorded.'
                  : `Complete ${settings.targetArticles - completedArticles > 0 ? `${settings.targetArticles - completedArticles} more article` : 'your remaining goals'} today to extend your flame streak!`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 relative z-10 flex-wrap">
          {/* Streak Freeze Vault button */}
          <button
            onClick={() => setShowFreezeModal(true)}
            className={`px-3 py-1.5 rounded-xl font-extrabold text-xs backdrop-blur-sm transition-all cursor-pointer border flex items-center gap-1.5 shadow-2xs ${
              freezeData.isFreezeActiveForToday
                ? 'bg-cyan-600/80 hover:bg-cyan-600 text-white border-cyan-300'
                : 'bg-black/20 hover:bg-black/30 text-amber-100 border-white/20'
            }`}
            title="Open Streak Freeze Vault"
          >
            <span>❄️</span>
            <span>{freezeData.isFreezeActiveForToday ? 'Freeze Shielded' : `Freeze (${freezeData.tokensAvailable})`}</span>
          </button>

          <button
            onClick={() => setShowCelebrationModal(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-900/40 hover:bg-slate-900/60 text-amber-200 font-extrabold text-xs backdrop-blur-sm transition-colors cursor-pointer border border-amber-300/40 flex items-center gap-1"
            title="Open Streak Milestone Celebration"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Celebrate</span>
          </button>
          <button
            onClick={handleIncrementStreak}
            className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-sm transition-colors cursor-pointer border border-white/30"
            title="Increment streak count (+1 Day test)"
          >
            +1 Day
          </button>
          <button
            onClick={handleResetStreak}
            className="px-2.5 py-1.5 rounded-xl bg-black/20 hover:bg-black/30 text-amber-100 font-medium text-xs transition-colors cursor-pointer"
            title="Reset streak to 0"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Daily Quota Activity Hub: Circular Ring & Sub-Quota Progress Indicators */}
      <div className="bg-slate-50/80 rounded-2xl border border-slate-200/90 p-5 sm:p-6 space-y-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          
          {/* Main Circular Progress Ring (Hero Quota Dial) */}
          <div className="flex flex-col items-center shrink-0">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 140 140">
                <defs>
                  <linearGradient id="circleQuotaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="50%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#14b8a6" />
                  </linearGradient>
                </defs>
                {/* Track Circle */}
                <circle
                  cx="70"
                  cy="70"
                  r="56"
                  strokeWidth="12"
                  className="stroke-slate-200/80 fill-none"
                />
                {/* Progress Circle */}
                <circle
                  cx="70"
                  cy="70"
                  r="56"
                  strokeWidth="12"
                  strokeLinecap="round"
                  stroke="url(#circleQuotaGradient)"
                  className="fill-none transition-all duration-700 ease-out"
                  style={{
                    strokeDasharray: 351.86,
                    strokeDashoffset: 351.86 - (351.86 * completionPercentage) / 100
                  }}
                />
              </svg>

              {/* Center Info Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                {completionPercentage === 100 ? (
                  <Trophy className="w-6 h-6 text-amber-500 fill-amber-100 animate-bounce mb-0.5" />
                ) : (
                  <Flame className="w-5 h-5 text-amber-500 fill-amber-100 mb-0.5" />
                )}
                <span className="text-2xl font-black text-slate-900 leading-none">
                  {completionPercentage}%
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                  Daily Quota
                </span>
              </div>
            </div>

            <div className="mt-2 text-center">
              <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                completionPercentage === 100
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-900 border border-amber-200'
              }`}>
                {completionPercentage === 100 ? '🎉 Quota Mastered!' : `${completedCount} of ${totalCount} Tasks Done`}
              </span>
            </div>
          </div>

          {/* Sub-Quota Mini-Circular Dials Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            
            {/* Sub-quota 1: Articles Read Target */}
            <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs flex items-center gap-3">
              <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="18" strokeWidth="4" className="stroke-slate-100 fill-none" />
                  <circle
                    cx="24"
                    cy="24"
                    r="18"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="stroke-emerald-500 fill-none transition-all duration-500"
                    style={{
                      strokeDasharray: 113.1,
                      strokeDashoffset: 113.1 - (113.1 * articlesPct) / 100
                    }}
                  />
                </svg>
                <BookOpen className="w-4 h-4 text-emerald-600 absolute" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Articles</span>
                  <span className="text-[11px] font-black text-emerald-700">{articlesPct}%</span>
                </div>
                <p className="text-sm font-extrabold text-slate-900 truncate">
                  {completedArticles} / {settings.targetArticles}
                </p>
                <p className="text-[10px] font-semibold text-slate-500">
                  {completedArticles >= settings.targetArticles ? '✓ Target Achieved' : `${settings.targetArticles - completedArticles} remaining`}
                </p>
              </div>
            </div>

            {/* Sub-quota 2: Tax Practice Target */}
            <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs flex items-center gap-3">
              <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="18" strokeWidth="4" className="stroke-slate-100 fill-none" />
                  <circle
                    cx="24"
                    cy="24"
                    r="18"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="stroke-indigo-500 fill-none transition-all duration-500"
                    style={{
                      strokeDasharray: 113.1,
                      strokeDashoffset: 113.1 - (113.1 * practicesPct) / 100
                    }}
                  />
                </svg>
                <Calculator className="w-4 h-4 text-indigo-600 absolute" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Practices</span>
                  <span className="text-[11px] font-black text-indigo-700">{practicesPct}%</span>
                </div>
                <p className="text-sm font-extrabold text-slate-900 truncate">
                  {completedPractices} / {settings.targetPractices}
                </p>
                <p className="text-[10px] font-semibold text-slate-500">
                  {completedPractices >= settings.targetPractices ? '✓ Practice Met' : 'Simulate cases'}
                </p>
              </div>
            </div>

            {/* Sub-quota 3: Time Logged Target */}
            <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs flex items-center gap-3">
              <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="18" strokeWidth="4" className="stroke-slate-100 fill-none" />
                  <circle
                    cx="24"
                    cy="24"
                    r="18"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="stroke-amber-500 fill-none transition-all duration-500"
                    style={{
                      strokeDasharray: 113.1,
                      strokeDashoffset: 113.1 - (113.1 * minutesPct) / 100
                    }}
                  />
                </svg>
                <Clock className="w-4 h-4 text-amber-600 absolute" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Time Logged</span>
                  <span className="text-[11px] font-black text-amber-700">{minutesPct}%</span>
                </div>
                <p className="text-sm font-extrabold text-slate-900 truncate">
                  {loggedMinutes}m / {settings.targetMinutes}m
                </p>
                <p className="text-[10px] font-semibold text-slate-500">
                  🔥 {streakDays}-day streak
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Milestone Progress Bar with Stage Markers */}
        <div className="space-y-2 pt-2 border-t border-slate-200/70">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>Daily Activity Quota Stages</span>
            </span>
            <span className="text-emerald-700 font-black">
              {completionPercentage}% Quota Reached
            </span>
          </div>

          <div className="relative w-full bg-slate-200/80 h-3.5 rounded-full p-0.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 h-full rounded-full transition-all duration-700 ease-out shadow-xs" 
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          {/* Milestone Ticks */}
          <div className="grid grid-cols-4 gap-1 text-[10px] font-extrabold text-slate-400 pt-1">
            <div className={`flex items-center gap-1 ${completionPercentage >= 25 ? 'text-amber-700' : ''}`}>
              <Star className={`w-3 h-3 ${completionPercentage >= 25 ? 'text-amber-500 fill-amber-500' : ''}`} />
              <span>25% Starter</span>
            </div>
            <div className={`flex items-center gap-1 justify-center ${completionPercentage >= 50 ? 'text-amber-700' : ''}`}>
              <Zap className={`w-3 h-3 ${completionPercentage >= 50 ? 'text-amber-500 fill-amber-500' : ''}`} />
              <span>50% Halfway</span>
            </div>
            <div className={`flex items-center gap-1 justify-center ${completionPercentage >= 75 ? 'text-emerald-700' : ''}`}>
              <ShieldCheck className={`w-3 h-3 ${completionPercentage >= 75 ? 'text-emerald-600 fill-emerald-100' : ''}`} />
              <span>75% Specialist</span>
            </div>
            <div className={`flex items-center gap-1 justify-end ${completionPercentage === 100 ? 'text-emerald-800 font-black' : ''}`}>
              <Trophy className={`w-3 h-3 ${completionPercentage === 100 ? 'text-amber-500 fill-amber-400' : ''}`} />
              <span>100% Quota Met</span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel (Collapsible) */}
      {isSettingsOpen && (
        <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span>Configure Daily Learning Targets</span>
            </h4>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Target Articles Read / Day</label>
              <input
                type="number"
                min="1"
                max="10"
                value={settings.targetArticles}
                onChange={(e) => setSettings({ ...settings, targetArticles: Math.max(1, Number(e.target.value)) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">Target Tax Practices / Day</label>
              <input
                type="number"
                min="1"
                max="10"
                value={settings.targetPractices}
                onChange={(e) => setSettings({ ...settings, targetPractices: Math.max(1, Number(e.target.value)) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">Target Reading Minutes / Day</label>
              <input
                type="number"
                min="5"
                max="180"
                step="5"
                value={settings.targetMinutes}
                onChange={(e) => setSettings({ ...settings, targetMinutes: Math.max(5, Number(e.target.value)) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleResetDefaultGoals}
              className="text-slate-400 hover:text-rose-400 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Default Goals</span>
            </button>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Save Targets
            </button>
          </div>
        </div>
      )}

      {/* Add Custom Goal Form */}
      {showAddForm && (
        <form onSubmit={handleAddGoal} className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Add Custom Daily Learning Goal
            </h4>
            <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
            <div className="sm:col-span-6">
              <label className="block text-slate-700 font-bold mb-1">Goal Description *</label>
              <input
                type="text"
                required
                placeholder="e.g. Complete 1 Minimum Turnover Tax simulation"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-slate-700 font-bold mb-1">Goal Type</label>
              <select
                value={newGoalType}
                onChange={(e) => setNewGoalType(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="article_read">Article Read</option>
                <option value="tax_practice">Tax Practice</option>
                <option value="custom">Custom Checklist</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-slate-700 font-bold mb-1">Est. Minutes</label>
              <input
                type="number"
                min="1"
                max="60"
                value={newGoalMinutes}
                onChange={(e) => setNewGoalMinutes(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Add Goal
            </button>
          </div>
        </form>
      )}

      {/* Goal Checklist Items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-1">
          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span>Today's Learning & Compliance Tasks</span>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              {completedCount}/{totalCount} Done
            </span>
          </h4>

          <button
            onClick={handleResetToday}
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
            title="Reset today's goal checkmarks"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Checkmarks</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {goalItems.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleGoal(item.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 group ${
                item.completed
                  ? 'bg-emerald-50/60 border-emerald-200/90 text-slate-900'
                  : 'bg-white border-slate-200/80 hover:border-emerald-300 text-slate-800 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <button
                  type="button"
                  className="mt-0.5 shrink-0 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleGoal(item.id);
                  }}
                >
                  {item.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 shrink-0" />
                  )}
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${
                      item.type === 'article_read' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : item.type === 'tax_practice' 
                        ? 'bg-indigo-100 text-indigo-800' 
                        : 'bg-amber-100 text-amber-900'
                    }`}>
                      {item.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      ~{item.minutesEstimate} mins
                    </span>
                  </div>

                  <p className={`text-sm font-bold transition-colors ${
                    item.completed ? 'line-through text-slate-500 font-medium' : 'text-slate-900 group-hover:text-emerald-950'
                  }`}>
                    {item.title}
                  </p>
                </div>
              </div>

              {/* Action Quick Link & Delete */}
              <div className="flex items-center gap-2 shrink-0">
                {item.type === 'tax_practice' ? (
                  <Link
                    to="/tax-calculator"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-emerald-300 text-xs text-slate-700 font-semibold flex items-center gap-1 shrink-0"
                    title="Open Tax Calculator"
                  >
                    <span>Practice</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                ) : item.type === 'article_read' ? (
                  <Link
                    to="/article/total-income-calculation-bangladesh-2026-2027"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-emerald-300 text-xs text-slate-700 font-semibold flex items-center gap-1 shrink-0"
                    title="Read Tax Guide"
                  >
                    <span>Read</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                ) : null}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteGoal(item.id);
                  }}
                  className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                  title="Remove goal"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievement Celebration Modal */}
      <AchievementCelebrationModal
        isOpen={showCelebrationModal}
        onClose={() => {
          setShowCelebrationModal(false);
          setCelebrationMilestone(undefined);
        }}
        currentStreak={streakDays}
        forcedMilestoneDays={celebrationMilestone}
      />

      {/* Streak Freeze Vault & Protection Modal */}
      <StreakFreezeModal
        isOpen={showFreezeModal}
        onClose={() => setShowFreezeModal(false)}
        streakDays={streakDays}
      />

    </div>
  );
};

export default DailyGoalTracker;
