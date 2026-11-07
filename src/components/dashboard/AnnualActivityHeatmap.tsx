import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { 
  Calendar, 
  Flame, 
  TrendingUp, 
  Sparkles, 
  Award, 
  ShieldCheck, 
  CheckCircle2, 
  BookOpen, 
  Clock, 
  BarChart2, 
  Info, 
  Plus, 
  RotateCcw,
  Zap,
  Check
} from 'lucide-react';

export interface DayActivityData {
  date: string; // YYYY-MM-DD
  dateObj: Date;
  count: number;
  studyMinutes: number;
  articlesRead: number;
  complianceTasks: number;
  practiceCalculations: number;
  dayOfWeek: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  weekIndex: number;
}

export type HeatmapMetricFilter = 'all' | 'study' | 'compliance' | 'practice';
export type HeatmapRangeFilter = '365d' | 'ytd' | '6m';
export type HeatmapColorTheme = 'emerald' | 'cyan' | 'indigo' | 'amber';

const STORAGE_KEY_HEATMAP = 'accounticca_annual_heatmap_activity_v1';
const STORAGE_KEY_STREAK = 'accounticca_daily_streak_v1';

// Color ramps using D3 threshold scales
const COLOR_RAMPS: Record<HeatmapColorTheme, string[]> = {
  emerald: ['#f1f5f9', '#a7f3d0', '#34d399', '#059669', '#064e3b'],
  cyan: ['#f1f5f9', '#bae6fd', '#38bdf8', '#0284c7', '#0c4a6e'],
  indigo: ['#f1f5f9', '#c7d2fe', '#818cf8', '#4f46e5', '#312e81'],
  amber: ['#f1f5f9', '#fde68a', '#fbbf24', '#d97706', '#78350f']
};

/**
 * Generate 365 days of deterministic, realistic activity history ending at today
 */
export const generateInitial365DaysData = (endDate: Date = new Date(2026, 9, 18)): DayActivityData[] => {
  const result: DayActivityData[] = [];
  const currentStreak = 5; // User currently on active 5-day streak
  
  // Create 365 days array going backwards from endDate
  for (let i = 364; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);

    const dateStr = d.toISOString().split('T')[0];
    const dayOfWeek = d.getDay(); // 0 is Sun, 6 is Sat
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Friday/Saturday weekend in BD
    const month = d.getMonth(); // 0-indexed (10 is Nov)
    const dayOfMonth = d.getDate();

    let count = 0;
    let studyMinutes = 0;
    let articlesRead = 0;
    let complianceTasks = 0;
    let practiceCalculations = 0;

    // Check if within current active streak (last 5 days)
    if (i < currentStreak) {
      count = 3 + (i % 3) * 2;
      studyMinutes = 20 + (i % 2) * 15;
      articlesRead = 1 + (i % 2);
      complianceTasks = 1;
      practiceCalculations = 1;
    } else {
      // Deterministic pseudo-random seed based on date
      const seed = (d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()) % 100;

      // Realistic tax spikes:
      // November is Tax Month in Bangladesh (returns deadline Nov 30) -> High intensity
      const isTaxSeason = month === 10; 
      // 15th of each month is monthly VAT return deadline (Mushak 9.1) -> Peak spikes
      const isVatDeadlineWindow = dayOfMonth >= 12 && dayOfMonth <= 15;

      if (isTaxSeason) {
        if (seed % 10 > 2) {
          count = 4 + (seed % 7);
          studyMinutes = 30 + (seed % 40);
          articlesRead = 2 + (seed % 3);
          complianceTasks = 1 + (seed % 3);
          practiceCalculations = 1 + (seed % 2);
        }
      } else if (isVatDeadlineWindow) {
        if (seed % 10 > 3) {
          count = 3 + (seed % 6);
          studyMinutes = 25 + (seed % 30);
          complianceTasks = 2 + (seed % 2);
          articlesRead = 1;
        }
      } else if (isWeekend) {
        // Less frequent, but deeper study sessions on weekends
        if (seed % 10 > 5) {
          count = 2 + (seed % 4);
          studyMinutes = 35 + (seed % 25);
          articlesRead = 2;
        }
      } else {
        // Regular weekdays: ~65% chance of activity
        if (seed % 10 > 3) {
          count = 1 + (seed % 5);
          studyMinutes = 15 + (seed % 30);
          articlesRead = seed % 2 === 0 ? 1 : 2;
          complianceTasks = seed % 3 === 0 ? 1 : 0;
          practiceCalculations = seed % 4 === 0 ? 1 : 0;
        }
      }
    }

    result.push({
      date: dateStr,
      dateObj: d,
      count,
      studyMinutes,
      articlesRead,
      complianceTasks,
      practiceCalculations,
      dayOfWeek,
      weekIndex: 0 // computed later based on grid
    });
  }

  return result;
};

export const AnnualActivityHeatmap: React.FC = () => {
  const [metricFilter, setMetricFilter] = useState<HeatmapMetricFilter>('all');
  const [rangeFilter, setRangeFilter] = useState<HeatmapRangeFilter>('365d');
  const [colorTheme, setColorTheme] = useState<HeatmapColorTheme>('emerald');
  const [selectedDay, setSelectedDay] = useState<DayActivityData | null>(null);
  const [hoveredDay, setHoveredDay] = useState<DayActivityData | null>(null);
  const [activityIncrementedToday, setActivityIncrementedToday] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Load or initialize 365-day activity records
  const [rawDaysData, setRawDaysData] = useState<DayActivityData[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_HEATMAP);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length >= 300) {
          return parsed.map((item: any) => ({
            ...item,
            dateObj: new Date(item.date)
          }));
        }
      }
    } catch (e) {
      console.warn('Notice loading annual activity heatmap data:', e);
    }
    const fresh = generateInitial365DaysData();
    try {
      localStorage.setItem(STORAGE_KEY_HEATMAP, JSON.stringify(fresh));
    } catch {}
    return fresh;
  });

  // Listen for global workflow activity triggers (study sessions, checklist completions)
  useEffect(() => {
    const handleActivityLogged = () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        setRawDaysData(prev => {
          const updated = prev.map(d => {
            if (d.date === todayStr) {
              return {
                ...d,
                count: d.count + 1,
                studyMinutes: d.studyMinutes + 15,
                complianceTasks: d.complianceTasks + 1
              };
            }
            return d;
          });
          localStorage.setItem(STORAGE_KEY_HEATMAP, JSON.stringify(updated));
          return updated;
        });
      } catch (e) {
        console.warn('Notice syncing heatmap activity:', e);
      }
    };

    window.addEventListener('accounticca_goals_updated', handleActivityLogged);
    window.addEventListener('accounticca_deadlines_updated', handleActivityLogged);
    window.addEventListener('corporate_checklist_updated', handleActivityLogged);

    return () => {
      window.removeEventListener('accounticca_goals_updated', handleActivityLogged);
      window.removeEventListener('accounticca_deadlines_updated', handleActivityLogged);
      window.removeEventListener('corporate_checklist_updated', handleActivityLogged);
    };
  }, []);

  // Filtered dataset according to range
  const daysData = useMemo(() => {
    if (rangeFilter === 'ytd') {
      const currentYear = new Date().getFullYear();
      return rawDaysData.filter(d => d.dateObj.getFullYear() === currentYear);
    }
    if (rangeFilter === '6m') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 180);
      return rawDaysData.filter(d => d.dateObj >= cutoff);
    }
    return rawDaysData;
  }, [rawDaysData, rangeFilter]);

  // Compute metric value according to selected filter
  const getMetricValue = (d: DayActivityData): number => {
    if (metricFilter === 'study') return d.studyMinutes;
    if (metricFilter === 'compliance') return d.complianceTasks;
    if (metricFilter === 'practice') return d.practiceCalculations;
    return d.count;
  };

  // D3 Color Scale Threshold setup
  const d3ColorScale = useMemo(() => {
    const colors = COLOR_RAMPS[colorTheme];
    if (metricFilter === 'study') {
      // Minutes scale: 0, 1-20m, 21-40m, 41-60m, 60m+
      return d3.scaleThreshold<number, string>()
        .domain([1, 21, 41, 61])
        .range(colors);
    }
    if (metricFilter === 'compliance' || metricFilter === 'practice') {
      // Task scale: 0, 1, 2, 3, 4+
      return d3.scaleThreshold<number, string>()
        .domain([1, 2, 3, 4])
        .range(colors);
    }
    // Overall activities count scale: 0, 1-2, 3-5, 6-9, 10+
    return d3.scaleThreshold<number, string>()
      .domain([1, 3, 6, 10])
      .range(colors);
  }, [colorTheme, metricFilter]);

  // Calendar Grid Layout Computation using D3 time scales
  const { weeks, monthLabels, totalContributions, activeDaysCount, maxIntensityDay, currentStreak, longestStreak } = useMemo(() => {
    if (daysData.length === 0) {
      return { 
        weeks: [], 
        monthLabels: [], 
        totalContributions: 0, 
        activeDaysCount: 0, 
        maxIntensityDay: null, 
        currentStreak: 0, 
        longestStreak: 0 
      };
    }

    const firstDate = daysData[0].dateObj;
    // Map dates into Sunday-based 7-row columns
    const weeksArr: { weekIndex: number; days: (DayActivityData | null)[] }[] = [];
    
    // Group days by week
    let currentWeek: (DayActivityData | null)[] = new Array(7).fill(null);
    let currentWeekIdx = 0;

    // Fill initial padding days if first day isn't Sunday
    const startDayOfWeek = firstDate.getDay();
    let currentDayPtr = startDayOfWeek;

    daysData.forEach((day) => {
      if (currentDayPtr === 7) {
        weeksArr.push({ weekIndex: currentWeekIdx, days: currentWeek });
        currentWeek = new Array(7).fill(null);
        currentWeekIdx++;
        currentDayPtr = 0;
      }
      currentWeek[day.dayOfWeek] = { ...day, weekIndex: currentWeekIdx };
      currentDayPtr = day.dayOfWeek + 1;
    });

    if (currentWeek.some(d => d !== null)) {
      weeksArr.push({ weekIndex: currentWeekIdx, days: currentWeek });
    }

    // Month Label placement calculation
    const monthFormatter = d3.timeFormat('%b');
    const labels: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    weeksArr.forEach((w) => {
      // Find the first valid day in this week
      const firstValidDay = w.days.find(d => d !== null);
      if (firstValidDay) {
        const m = firstValidDay.dateObj.getMonth();
        if (m !== lastMonth) {
          labels.push({
            label: monthFormatter(firstValidDay.dateObj),
            weekIndex: w.weekIndex
          });
          lastMonth = m;
        }
      }
    });

    // Statistical KPI calculations
    let total = 0;
    let activeDays = 0;
    let maxDay: DayActivityData | null = null;
    let curStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;

    daysData.forEach(d => {
      const val = getMetricValue(d);
      total += val;
      if (val > 0) {
        activeDays++;
        tempStreak++;
        if (tempStreak > maxStreak) maxStreak = tempStreak;
      } else {
        tempStreak = 0;
      }

      if (!maxDay || val > getMetricValue(maxDay)) {
        maxDay = d;
      }
    });

    // Compute streak at the end of the array
    for (let i = daysData.length - 1; i >= 0; i--) {
      if (getMetricValue(daysData[i]) > 0) {
        curStreak++;
      } else {
        break;
      }
    }

    return {
      weeks: weeksArr,
      monthLabels: labels,
      totalContributions: total,
      activeDaysCount: activeDays,
      maxIntensityDay: maxDay,
      currentStreak: curStreak,
      longestStreak: maxStreak
    };
  }, [daysData, metricFilter]);

  // Handler to log test activity for today
  const handleLogTodayActivity = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setRawDaysData(prev => {
      const updated = prev.map(d => {
        if (d.date === todayStr) {
          return {
            ...d,
            count: d.count + 1,
            studyMinutes: d.studyMinutes + 25,
            articlesRead: d.articlesRead + 1,
            practiceCalculations: d.practiceCalculations + 1
          };
        }
        return d;
      });
      try {
        localStorage.setItem(STORAGE_KEY_HEATMAP, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setActivityIncrementedToday(true);
    setTimeout(() => {
      setActivityIncrementedToday(false);
    }, 4000);
  };

  // Reset heatmap to standard baseline
  const handleResetHeatmap = () => {
    const fresh = generateInitial365DaysData();
    setRawDaysData(fresh);
    try {
      localStorage.setItem(STORAGE_KEY_HEATMAP, JSON.stringify(fresh));
    } catch {}
    setSelectedDay(null);
  };

  const activeInspectorDay = selectedDay || hoveredDay;

  // Day of week labels (Sun, Tue, Thu, Sat or Mon, Wed, Fri)
  const DAY_LABELS = [
    { row: 1, label: 'Mon' },
    { row: 3, label: 'Wed' },
    { row: 5, label: 'Fri' }
  ];

  return (
    <div id="annual-activity-heatmap-card" className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-7">
      
      {/* 1. Header Bar with Metrics & Range Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-slate-100">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-13 h-13 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shadow-xs shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                365-Day Activity & Contribution Heatmap
              </h3>
              <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-950 bg-emerald-100 border border-emerald-300 px-3 py-0.5 rounded-full shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span>D3.js Visualization Engine</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Intensity mapping of your daily statutory readings, compliance checklists, and tax practice sessions over the past 365 days.
            </p>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {/* Timeframe Range Segmented Buttons */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
            {[
              { id: '365d', label: 'Past 365 Days' },
              { id: 'ytd', label: '2026 YTD' },
              { id: '6m', label: 'Last 6 Months' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRangeFilter(tab.id as HeatmapRangeFilter)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  rangeFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Color Ramp Theme Selector */}
          <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
            {(['emerald', 'cyan', 'indigo', 'amber'] as const).map(theme => (
              <button
                key={theme}
                type="button"
                onClick={() => setColorTheme(theme)}
                className={`w-6 h-6 rounded-lg transition-transform cursor-pointer flex items-center justify-center ${
                  colorTheme === theme ? 'scale-110 ring-2 ring-slate-900 shadow-xs' : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: COLOR_RAMPS[theme][3]
                }}
                title={`Color theme: ${theme}`}
              />
            ))}
          </div>

          {/* Quick Action: Log Today's Practice */}
          <button
            type="button"
            id="heatmap-log-practice-btn"
            onClick={handleLogTodayActivity}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-xs transition-all cursor-pointer"
            title="Log +1 Practice session for today"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Activity Today</span>
          </button>
        </div>
      </div>

      {/* 2. Success Alert for Instant Activity Logging */}
      {activityIncrementedToday && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 flex items-center justify-between text-xs font-bold text-emerald-950 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Activity successfully recorded for today! Today's square on the D3 heatmap has been updated in real-time.</span>
          </div>
          <button 
            onClick={() => setActivityIncrementedToday(false)}
            className="text-emerald-700 underline text-[11px] cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3. Summary Statistics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5">
        {/* Stat 1: Total Contributions */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Total {metricFilter === 'study' ? 'Study Minutes' : 'Contributions'}
          </p>
          <div className="text-2xl font-black text-slate-900 flex items-baseline gap-1.5">
            <span>{totalContributions.toLocaleString()}</span>
            <span className="text-xs font-bold text-emerald-600">
              {metricFilter === 'study' ? 'mins' : 'actions'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">In selected timeframe</p>
        </div>

        {/* Stat 2: Active Days Ratio */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Active Days
          </p>
          <div className="text-2xl font-black text-slate-900 flex items-baseline gap-1.5">
            <span>{activeDaysCount}</span>
            <span className="text-xs font-bold text-slate-400">/ {daysData.length}d</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-bold">
            {Math.round((activeDaysCount / Math.max(daysData.length, 1)) * 100)}% Consistency
          </p>
        </div>

        {/* Stat 3: Current Streak */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Current Streak
          </p>
          <div className="text-2xl font-black text-amber-600 flex items-baseline gap-1.5">
            <Flame className="w-5 h-5 fill-amber-500 text-amber-600 inline" />
            <span>{currentStreak} Days</span>
          </div>
          <p className="text-[11px] text-slate-500">Unbroken practice</p>
        </div>

        {/* Stat 4: Longest Streak */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Longest Streak
          </p>
          <div className="text-2xl font-black text-slate-900 flex items-baseline gap-1.5">
            <Award className="w-5 h-5 text-amber-500 inline" />
            <span>{longestStreak} Days</span>
          </div>
          <p className="text-[11px] text-slate-500">All-time record</p>
        </div>

        {/* Stat 5: Peak Intensity Day */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1 col-span-2 sm:col-span-4 lg:col-span-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Peak Intensity
          </p>
          <div className="text-2xl font-black text-slate-900 truncate">
            {maxIntensityDay ? `${getMetricValue(maxIntensityDay)} ${metricFilter === 'study' ? 'm' : 'tasks'}` : '0'}
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            {maxIntensityDay ? new Date(maxIntensityDay.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'None'}
          </p>
        </div>
      </div>

      {/* 4. Metric Filter Tabs (All vs Study vs Compliance vs Practice) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 flex-wrap">
          {[
            { id: 'all', label: 'All Activity Metrics', icon: BarChart2 },
            { id: 'study', label: 'Study & Reading Time', icon: BookOpen },
            { id: 'compliance', label: 'Compliance & Checklist Filings', icon: ShieldCheck },
            { id: 'practice', label: 'Tax Calculations & Practice', icon: Zap }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = metricFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMetricFilter(tab.id as HeatmapMetricFilter)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  isActive ? 'bg-white text-slate-900 shadow-2xs font-black' : 'hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleResetHeatmap}
          className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          title="Reset heatmap data to default distribution"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Sample Data</span>
        </button>
      </div>

      {/* 5. Main D3 SVG Contribution Grid */}
      <div 
        ref={containerRef}
        className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4 sm:p-6 overflow-x-auto select-none space-y-4"
      >
        <div className="min-w-[780px]">
          {/* Months Header Labels */}
          <div className="relative h-5 text-[11px] font-bold text-slate-400 pl-8">
            {monthLabels.map((m, idx) => (
              <span
                key={`${m.label}-${idx}`}
                className="absolute"
                style={{
                  left: `${m.weekIndex * 15 + 32}px`
                }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Grid with Day of Week Rows */}
          <div className="flex items-start">
            {/* Day of Week Labels */}
            <div className="flex flex-col justify-between h-[105px] pr-2 text-[10px] font-bold text-slate-400 shrink-0 select-none">
              <span className="h-3 leading-3">Sun</span>
              <span className="h-3 leading-3">Tue</span>
              <span className="h-3 leading-3">Thu</span>
              <span className="h-3 leading-3">Sat</span>
            </div>

            {/* Weeks Columns */}
            <div className="flex gap-[3.5px]">
              {weeks.map((week) => (
                <div key={week.weekIndex} className="flex flex-col gap-[3.5px]">
                  {week.days.map((day, dayIndex) => {
                    if (!day) {
                      return (
                        <div 
                          key={`empty-${week.weekIndex}-${dayIndex}`} 
                          className="w-3 h-3 rounded-[2.5px] opacity-0 pointer-events-none" 
                        />
                      );
                    }

                    const val = getMetricValue(day);
                    const fillColor = d3ColorScale(val);
                    const isSelected = selectedDay?.date === day.date;
                    const isToday = day.date === new Date().toISOString().split('T')[0];

                    return (
                      <div
                        key={day.date}
                        onClick={() => setSelectedDay(day)}
                        onMouseEnter={() => setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                        className={`w-3 h-3 rounded-[2.5px] transition-all cursor-pointer relative ${
                          isSelected 
                            ? 'ring-2 ring-slate-900 ring-offset-1 z-10 scale-125' 
                            : isToday 
                              ? 'ring-1.5 ring-emerald-600 ring-offset-1' 
                              : 'hover:scale-125 hover:z-10'
                        }`}
                        style={{ backgroundColor: fillColor }}
                        title={`${day.date}: ${val} ${metricFilter === 'study' ? 'mins' : 'activities'}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend & Guidance at Grid Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Learn how we calculate contribution density:</span>
            <span className="font-semibold text-slate-700">Guide Reads, Statutory Filings & Tax Practice</span>
          </div>

          {/* Color Ramp Legend */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <span className="text-[11px] text-slate-400 font-semibold mr-1">Less</span>
            {COLOR_RAMPS[colorTheme].map((col, idx) => (
              <div 
                key={idx}
                className="w-3 h-3 rounded-[2px] border border-slate-200/50"
                style={{ backgroundColor: col }}
                title={`Level ${idx}`}
              />
            ))}
            <span className="text-[11px] text-slate-400 font-semibold ml-1">More</span>
          </div>
        </div>
      </div>

      {/* 6. Interactive Day Inspector Card (Pinned or Hovered Day Details) */}
      {activeInspectorDay ? (
        <div 
          id="heatmap-day-inspector-card"
          className="rounded-2xl border-2 border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 via-white to-slate-50/50 p-5 shadow-xs space-y-4 animate-fade-in"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-2xs">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-base">
                  {new Date(activeInspectorDay.date).toLocaleDateString(undefined, { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </h4>
                <p className="text-xs text-slate-500">
                  {activeInspectorDay.date === new Date().toISOString().split('T')[0] 
                    ? '📍 Today’s Activity Log' 
                    : 'Historical Record'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-emerald-950 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full">
                {activeInspectorDay.count} Total Activities
              </span>
              {selectedDay && (
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 underline cursor-pointer"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>

          {/* Breakdown Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* Metric 1: Study Minutes */}
            <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Study Minutes</span>
              </div>
              <p className="text-lg font-black text-slate-900">{activeInspectorDay.studyMinutes}m</p>
              <p className="text-[10px] text-slate-400">Statutory reading</p>
            </div>

            {/* Metric 2: Articles Read */}
            <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>Articles Read</span>
              </div>
              <p className="text-lg font-black text-slate-900">{activeInspectorDay.articlesRead}</p>
              <p className="text-[10px] text-slate-400">Guides completed</p>
            </div>

            {/* Metric 3: Compliance Checklist Tasks */}
            <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Checklist Tasks</span>
              </div>
              <p className="text-lg font-black text-slate-900">{activeInspectorDay.complianceTasks}</p>
              <p className="text-[10px] text-slate-400">Corporate & VAT items</p>
            </div>

            {/* Metric 4: Practice Calculations */}
            <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold">
                <Zap className="w-3.5 h-3.5 text-purple-600" />
                <span>Tax Practices</span>
              </div>
              <p className="text-lg font-black text-slate-900">{activeInspectorDay.practiceCalculations}</p>
              <p className="text-[10px] text-slate-400">Calculators tested</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Hover over or click any square in the heatmap above to inspect that day's full statutory activity breakdown.</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">52 Weeks · 365 Days</span>
        </div>
      )}

    </div>
  );
};

export default AnnualActivityHeatmap;
