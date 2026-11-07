import React, { useState, useEffect, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine 
} from 'recharts';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  Flame, 
  Award, 
  Sparkles, 
  ChevronRight, 
  Layers, 
  Activity, 
  BarChart3, 
  ShieldCheck, 
  Target,
  ArrowUpRight
} from 'lucide-react';
import { DailyGoalItem } from './DailyGoalTracker';
import { ComplianceDeadline } from './ComplianceDeadlineReminder';

interface WeeklyActivityTrendChartProps {
  className?: string;
  onOpenStudyModal?: () => void;
  onOpenComplianceModal?: () => void;
}

type TimeframeOption = 'week' | 'month' | 'quarter';
type MetricFilterOption = 'all' | 'study' | 'compliance';

interface TrendDataPoint {
  label: string;
  fullDate?: string;
  period?: string;
  studyMinutes: number;
  complianceTasks: number;
  targetMinutes: number;
  efficiencyScore?: number;
  consistencyPct?: number;
  isToday?: boolean;
}

const STORAGE_KEY_GOALS = 'accounticca_daily_goals_v1';
const STORAGE_KEY_CHECKLIST = 'corporateChecklist';
const STORAGE_KEY_DEADLINES = 'accounticca_compliance_deadline_reminders_v1';
const STORAGE_KEY_STREAK = 'accounticca_daily_streak_v1';

// Base baseline data for the current 7-day rolling cycle
const BASE_WEEK_DATA: TrendDataPoint[] = [
  { label: 'Mon', fullDate: 'Oct 12', studyMinutes: 25, complianceTasks: 1, targetMinutes: 20, efficiencyScore: 85 },
  { label: 'Tue', fullDate: 'Oct 13', studyMinutes: 35, complianceTasks: 2, targetMinutes: 20, efficiencyScore: 92 },
  { label: 'Wed', fullDate: 'Oct 14', studyMinutes: 20, complianceTasks: 1, targetMinutes: 20, efficiencyScore: 78 },
  { label: 'Thu', fullDate: 'Oct 15', studyMinutes: 45, complianceTasks: 3, targetMinutes: 20, efficiencyScore: 98 },
  { label: 'Fri', fullDate: 'Oct 16', studyMinutes: 40, complianceTasks: 2, targetMinutes: 20, efficiencyScore: 94 },
  { label: 'Sat', fullDate: 'Oct 17', studyMinutes: 30, complianceTasks: 1, targetMinutes: 20, efficiencyScore: 88 },
  { label: 'Sun', fullDate: 'Oct 18', studyMinutes: 20, complianceTasks: 2, targetMinutes: 20, efficiencyScore: 90, isToday: true }
];

// 4-Week Monthly Aggregates
const MONTH_TREND_DATA: TrendDataPoint[] = [
  { label: 'W1', period: 'W1 (Sep 21-27)', studyMinutes: 145, complianceTasks: 5, targetMinutes: 140, consistencyPct: 82 },
  { label: 'W2', period: 'W2 (Sep 28-Oct 4)', studyMinutes: 180, complianceTasks: 8, targetMinutes: 140, consistencyPct: 88 },
  { label: 'W3', period: 'W3 (Oct 5-11)', studyMinutes: 215, complianceTasks: 11, targetMinutes: 140, consistencyPct: 94 },
  { label: 'W4', period: 'W4 (Oct 12-18)', studyMinutes: 245, complianceTasks: 12, targetMinutes: 140, consistencyPct: 96 }
];

// 12-Week Long-Term Trajectory
const QUARTER_TREND_DATA: TrendDataPoint[] = [
  { label: 'Wk 1', period: 'Week 1', studyMinutes: 110, complianceTasks: 4, targetMinutes: 140, consistencyPct: 72 },
  { label: 'Wk 2', period: 'Week 2', studyMinutes: 125, complianceTasks: 5, targetMinutes: 140, consistencyPct: 76 },
  { label: 'Wk 3', period: 'Week 3', studyMinutes: 135, complianceTasks: 6, targetMinutes: 140, consistencyPct: 80 },
  { label: 'Wk 4', period: 'Week 4', studyMinutes: 150, complianceTasks: 7, targetMinutes: 140, consistencyPct: 84 },
  { label: 'Wk 5', period: 'Week 5', studyMinutes: 165, complianceTasks: 8, targetMinutes: 140, consistencyPct: 87 },
  { label: 'Wk 6', period: 'Week 6', studyMinutes: 180, complianceTasks: 9, targetMinutes: 140, consistencyPct: 90 },
  { label: 'Wk 7', period: 'Week 7', studyMinutes: 175, complianceTasks: 8, targetMinutes: 140, consistencyPct: 88 },
  { label: 'Wk 8', period: 'Week 8', studyMinutes: 195, complianceTasks: 10, targetMinutes: 140, consistencyPct: 92 },
  { label: 'Wk 9', period: 'Week 9', studyMinutes: 210, complianceTasks: 11, targetMinutes: 140, consistencyPct: 93 },
  { label: 'Wk 10', period: 'Week 10', studyMinutes: 220, complianceTasks: 12, targetMinutes: 140, consistencyPct: 95 },
  { label: 'Wk 11', period: 'Week 11', studyMinutes: 235, complianceTasks: 13, targetMinutes: 140, consistencyPct: 97 },
  { label: 'Wk 12', period: 'Week 12', studyMinutes: 250, complianceTasks: 14, targetMinutes: 140, consistencyPct: 98 }
];

export const WeeklyActivityTrendChart: React.FC<WeeklyActivityTrendChartProps> = ({
  className = '',
  onOpenStudyModal,
  onOpenComplianceModal
}) => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('week');
  const [metricFilter, setMetricFilter] = useState<MetricFilterOption>('all');
  const [streakDays, setStreakDays] = useState<number>(5);
  const [todayLoggedMinutes, setTodayLoggedMinutes] = useState<number>(20);
  const [todayCompletedTasks, setTodayCompletedTasks] = useState<number>(2);

  // Sync real-time data from localStorage
  const refreshStorageMetrics = () => {
    try {
      // Streak
      const rawStreak = localStorage.getItem(STORAGE_KEY_STREAK);
      if (rawStreak) setStreakDays(parseInt(rawStreak, 10));

      // Daily goals (sum of completed minutes for today)
      const rawGoals = localStorage.getItem(STORAGE_KEY_GOALS);
      if (rawGoals) {
        const goals: DailyGoalItem[] = JSON.parse(rawGoals);
        const mins = goals
          .filter(g => g.completed)
          .reduce((sum, g) => sum + (g.minutesEstimate || 0), 0);
        if (mins > 0) setTodayLoggedMinutes(mins);
      }

      // Checklist & Deadlines completed count
      let taskCount = 0;
      const rawChecklist = localStorage.getItem(STORAGE_KEY_CHECKLIST);
      if (rawChecklist) {
        const parsed = JSON.parse(rawChecklist);
        taskCount += Object.values(parsed).filter(Boolean).length;
      }

      const rawDeadlines = localStorage.getItem(STORAGE_KEY_DEADLINES);
      if (rawDeadlines) {
        const deadlines: ComplianceDeadline[] = JSON.parse(rawDeadlines);
        taskCount += deadlines.filter(d => d.isCompleted).length;
      }

      if (taskCount > 0) {
        setTodayCompletedTasks(Math.min(15, taskCount));
      }
    } catch {}
  };

  useEffect(() => {
    refreshStorageMetrics();
    window.addEventListener('storage', refreshStorageMetrics);
    window.addEventListener('accounticca_goals_updated', refreshStorageMetrics);
    window.addEventListener('accounticca_deadlines_updated', refreshStorageMetrics);
    window.addEventListener('corporate_checklist_updated', refreshStorageMetrics);

    return () => {
      window.removeEventListener('storage', refreshStorageMetrics);
      window.removeEventListener('accounticca_goals_updated', refreshStorageMetrics);
      window.removeEventListener('accounticca_deadlines_updated', refreshStorageMetrics);
      window.removeEventListener('corporate_checklist_updated', refreshStorageMetrics);
    };
  }, []);

  // Compute live current week dataset incorporating today's live minutes and tasks
  const weekData = useMemo(() => {
    return BASE_WEEK_DATA.map((item) => {
      if (item.isToday) {
        const dynamicMinutes = Math.max(item.studyMinutes, todayLoggedMinutes);
        const dynamicTasks = Math.max(item.complianceTasks, todayCompletedTasks);
        return {
          ...item,
          studyMinutes: dynamicMinutes,
          complianceTasks: dynamicTasks,
          efficiencyScore: Math.min(100, Math.round((dynamicMinutes / item.targetMinutes) * 100))
        };
      }
      return item;
    });
  }, [todayLoggedMinutes, todayCompletedTasks]);

  // Derived KPI aggregates
  const totalWeeklyMinutes = useMemo(() => {
    return weekData.reduce((sum, d) => sum + d.studyMinutes, 0);
  }, [weekData]);

  const totalWeeklyTasks = useMemo(() => {
    return weekData.reduce((sum, d) => sum + d.complianceTasks, 0);
  }, [weekData]);

  const averageDailyMinutes = useMemo(() => {
    return Math.round(totalWeeklyMinutes / weekData.length);
  }, [totalWeeklyMinutes, weekData.length]);

  const quotaConsistencyPct = useMemo(() => {
    const metCount = weekData.filter(d => d.studyMinutes >= d.targetMinutes).length;
    return Math.round((metCount / weekData.length) * 100);
  }, [weekData]);

  const peakDay = useMemo(() => {
    return [...weekData].sort((a, b) => b.studyMinutes - a.studyMinutes)[0];
  }, [weekData]);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-slate-700/80 rounded-2xl p-4 shadow-xl text-white text-xs space-y-2.5 backdrop-blur-md min-w-[210px] animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-black text-sm text-slate-100">
              {dataPoint.fullDate || dataPoint.period || label}
            </span>
            {dataPoint.isToday && (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black px-2 py-0.5 rounded-full uppercase">
                Today
              </span>
            )}
          </div>

          <div className="space-y-1.5 font-medium">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Study Minutes:</span>
              </span>
              <span className="font-bold text-white font-mono text-xs">
                {dataPoint.studyMinutes}m
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Compliance Tasks:</span>
              </span>
              <span className="font-bold text-white font-mono text-xs">
                {dataPoint.complianceTasks} items
              </span>
            </div>

            {dataPoint.targetMinutes && (
              <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-800/80">
                <span>Daily Quota Target:</span>
                <span className="font-mono text-slate-300">{dataPoint.targetMinutes}m</span>
              </div>
            )}

            {dataPoint.efficiencyScore !== undefined && (
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Quota Progress:</span>
                <span className={`font-bold ${dataPoint.efficiencyScore >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {dataPoint.efficiencyScore}%
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      id="weekly-activity-trend-chart-card"
      className={`bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6 ${className}`}
    >
      {/* Top Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-xs shrink-0">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Weekly Activity &amp; Compliance Trends
              </h3>
              <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Recharts Line Analytics</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualize your daily learning dedication, statutory checklist filings, and long-term engagement trajectory.
            </p>
          </div>
        </div>

        {/* Timeframe & Metric Filter Toggles */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {/* Timeframe Toggle */}
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setTimeframe('week')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeframe === 'week' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('month')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeframe === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              4 Weeks
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('quarter')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeframe === 'quarter' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Quarter (12 Wks)
            </button>
          </div>

          {/* Metric Filter */}
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setMetricFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                metricFilter === 'all' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setMetricFilter('study')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                metricFilter === 'study' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Study Only
            </button>
            <button
              type="button"
              onClick={() => setMetricFilter('compliance')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                metricFilter === 'compliance' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Compliance Only
            </button>
          </div>
        </div>
      </div>

      {/* Engagement KPI Highlight Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Metric 1: Total Study Time */}
        <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Weekly Study</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900">{totalWeeklyMinutes}m</span>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +18%
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Avg {averageDailyMinutes} mins/day across tax modules
          </p>
        </div>

        {/* Metric 2: Compliance Tasks */}
        <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Compliance Tasks</span>
            <CheckCircle2 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900">{totalWeeklyTasks}</span>
            <span className="text-[11px] font-bold text-amber-600">Filed</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Corporate checklist &amp; statutory deadlines
          </p>
        </div>

        {/* Metric 3: Quota Consistency */}
        <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Quota Consistency</span>
            <Target className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900">{quotaConsistencyPct}%</span>
            <span className="text-[11px] font-bold text-indigo-600">Target Hit</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {weekData.filter(d => d.studyMinutes >= d.targetMinutes).length} of 7 days met daily 20m goal
          </p>
        </div>

        {/* Metric 4: Peak Activity Day */}
        <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Productive Peak</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900">{peakDay.label}</span>
            <span className="text-[11px] font-bold text-rose-600">{peakDay.studyMinutes}m</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {streakDays}-day active learning streak maintained 🔥
          </p>
        </div>
      </div>

      {/* Main Recharts Line Chart Container */}
      <div className="bg-slate-50/70 rounded-2xl p-4 sm:p-6 border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="text-xs font-bold text-slate-700">
            {timeframe === 'week' 
              ? 'Daily Activity Trajectory (Current 7 Days)' 
              : timeframe === 'month' 
                ? '4-Week Rolling Consistency Curve' 
                : '12-Week Long-Term Mastery Trajectory'}
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            {(metricFilter === 'all' || metricFilter === 'study') && (
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-3 h-1 bg-emerald-600 rounded-full" />
                <span>Study Minutes (Left Y-Axis)</span>
              </span>
            )}
            {(metricFilter === 'all' || metricFilter === 'compliance') && (
              <span className="flex items-center gap-1.5 text-amber-700">
                <span className="w-3 h-1 bg-amber-500 rounded-full" />
                <span>Tasks Completed (Right Y-Axis)</span>
              </span>
            )}
            {timeframe === 'week' && metricFilter !== 'compliance' && (
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-3 h-0.5 border-t border-dashed border-slate-400" />
                <span>Daily Target (20m)</span>
              </span>
            )}
          </div>
        </div>

        <div className="h-72 sm:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={timeframe === 'week' ? weekData : timeframe === 'month' ? MONTH_TREND_DATA : QUARTER_TREND_DATA}
              margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              
              <XAxis 
                dataKey="label" 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
              />

              {/* Left Y-Axis: Minutes */}
              {(metricFilter === 'all' || metricFilter === 'study') && (
                <YAxis 
                  yAxisId="left"
                  stroke="#059669" 
                  fontSize={11} 
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickFormatter={(val) => `${val}m`}
                  domain={[0, 'auto']}
                />
              )}

              {/* Right Y-Axis: Tasks */}
              {(metricFilter === 'all' || metricFilter === 'compliance') && (
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="#d97706" 
                  fontSize={11} 
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickFormatter={(val) => `${val} tasks`}
                  domain={[0, 'auto']}
                />
              )}

              <Tooltip content={<CustomTooltip />} />

              {/* Daily Target Benchmark Line */}
              {timeframe === 'week' && metricFilter !== 'compliance' && (
                <ReferenceLine 
                  yAxisId="left"
                  y={20} 
                  stroke="#94a3b8" 
                  strokeDasharray="4 4" 
                  label={{ value: '20m Goal', position: 'insideTopLeft', fill: '#64748b', fontSize: 10 }}
                />
              )}

              {/* Line 1: Study Minutes Curve */}
              {(metricFilter === 'all' || metricFilter === 'study') && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="studyMinutes"
                  name="Study Minutes"
                  stroke="#059669"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#047857', stroke: '#ecfdf5', strokeWidth: 3 }}
                />
              )}

              {/* Line 2: Compliance Tasks Curve */}
              {(metricFilter === 'all' || metricFilter === 'compliance') && (
                <Line
                  yAxisId={metricFilter === 'compliance' ? 'right' : 'right'}
                  type="monotone"
                  dataKey="complianceTasks"
                  name="Compliance Tasks"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  strokeDasharray="0"
                  dot={{ r: 4, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#d97706', stroke: '#fffbeb', strokeWidth: 3 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Action Footer Callout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-500 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Activity curve dynamically recalibrates when you log study sessions or file statutory compliance items.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenStudyModal && (
            <button
              type="button"
              onClick={onOpenStudyModal}
              className="font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
            >
              + Log Today's Study
            </button>
          )}
          {onOpenComplianceModal && (
            <button
              type="button"
              onClick={onOpenComplianceModal}
              className="font-bold text-amber-700 hover:text-amber-800 underline cursor-pointer"
            >
              ✓ Mark Task Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeeklyActivityTrendChart;
