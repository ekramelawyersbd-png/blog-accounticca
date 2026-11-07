import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink, 
  Plus, 
  Share2, 
  Check, 
  X, 
  Eye, 
  Layers, 
  LayoutGrid, 
  ListOrdered, 
  Sparkles,
  ShieldCheck,
  Building2,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths, 
  parseISO 
} from 'date-fns';
import { 
  ComplianceDeadline, 
  calculateDaysRemaining 
} from './ComplianceDeadlineReminder';
import { exportDashboardDataAsCSV } from '../../utils/dashboardCsvExporter';

const STORAGE_KEY_REMINDERS = 'accounticca_compliance_deadline_reminders_v1';

const DEFAULT_DEADLINES: ComplianceDeadline[] = [
  {
    id: 'dl-vat-mushak-nov',
    title: 'Monthly VAT Return (Mushak 9.1 Filing & Payment)',
    category: 'VAT & Customs',
    entityName: 'E-Lawyers Consulting Ltd',
    dueDate: '2026-11-15',
    leadDaysAlert: 7,
    priority: 'high',
    notes: 'Must submit withholding VAT certificates and Mushak 6.3 invoices.',
    isCompleted: false,
    createdAt: '2026-10-01T08:00:00Z'
  },
  {
    id: 'dl-indiv-tax-nov',
    title: 'Individual Tax Return Filing Deadline (Tax Day)',
    category: 'Income Tax',
    entityName: 'All Individual Assessment Partners',
    dueDate: '2026-11-30',
    leadDaysAlert: 14,
    priority: 'high',
    notes: 'Section 166 of Income Tax Act 2023 deadline for FY 2025-26 assessment year 2026-27.',
    isCompleted: false,
    createdAt: '2026-10-01T08:00:00Z'
  },
  {
    id: 'dl-ait-q2-dec',
    title: 'Advance Income Tax (AIT) Q2 Installment Payment',
    category: 'Income Tax',
    entityName: 'Corporate Advisory Clients',
    dueDate: '2026-12-15',
    leadDaysAlert: 7,
    priority: 'medium',
    notes: 'Pay 2nd installment of estimated corporate tax in Bangladesh Bank treasury.',
    isCompleted: false,
    createdAt: '2026-10-01T08:00:00Z'
  },
  {
    id: 'dl-rjsc-form-ix',
    title: 'Annual RJSC Form IX & XXIII Filing',
    category: 'RJSC Corporate',
    entityName: 'Private Limited Companies',
    dueDate: '2026-12-30',
    leadDaysAlert: 10,
    priority: 'medium',
    notes: 'Submit annual return of directors and balance sheet following AGM.',
    isCompleted: false,
    createdAt: '2026-10-01T08:00:00Z'
  }
];

export const ComplianceDeadlinesCalendarView: React.FC = () => {
  // Load deadlines from localStorage with reactive listener
  const [deadlines, setDeadlines] = useState<ComplianceDeadline[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_REMINDERS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_DEADLINES;
  });

  const loadDeadlines = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_REMINDERS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDeadlines(parsed);
          return;
        }
      }
    } catch {}
    setDeadlines(DEFAULT_DEADLINES);
  };

  useEffect(() => {
    window.addEventListener('storage', loadDeadlines);
    window.addEventListener('accounticca_deadlines_updated', loadDeadlines);
    return () => {
      window.removeEventListener('storage', loadDeadlines);
      window.removeEventListener('accounticca_deadlines_updated', loadDeadlines);
    };
  }, []);

  // Calendar View State: default to November 2026 (where key tax deadlines occur)
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(2026, 10, 1)); // Nov 2026
  const [viewMode, setViewMode] = useState<'calendar' | 'timeline'>('calendar');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'approaching' | 'completed'>('all');
  const [inspectDeadline, setInspectDeadline] = useState<ComplianceDeadline | null>(null);
  const [selectedDayDeadlines, setSelectedDayDeadlines] = useState<{ date: Date; items: ComplianceDeadline[] } | null>(null);

  // Month navigation
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const jumpToToday = () => setCurrentMonth(new Date());
  const jumpToNovember2026 = () => setCurrentMonth(new Date(2026, 10, 1));

  // Filter deadlines based on user criteria
  const filteredDeadlines = useMemo(() => {
    return deadlines.filter(dl => {
      if (selectedCategory !== 'all' && dl.category !== selectedCategory) return false;
      const daysLeft = calculateDaysRemaining(dl.dueDate);

      if (selectedStatus === 'completed') return dl.isCompleted;
      if (selectedStatus === 'pending') return !dl.isCompleted;
      if (selectedStatus === 'approaching') return !dl.isCompleted && daysLeft >= 0 && daysLeft <= (dl.leadDaysAlert || 7);
      return true;
    });
  }, [deadlines, selectedCategory, selectedStatus]);

  // Compute calendar days for current month grid (including leading/trailing overflow days)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // Group deadlines by day string (YYYY-MM-DD)
  const deadlinesByDay = useMemo(() => {
    const map: Record<string, ComplianceDeadline[]> = {};
    filteredDeadlines.forEach(dl => {
      if (!map[dl.dueDate]) map[dl.dueDate] = [];
      map[dl.dueDate].push(dl);
    });
    return map;
  }, [filteredDeadlines]);

  // Deadlines in current displayed month
  const currentMonthDeadlines = useMemo(() => {
    return filteredDeadlines.filter(dl => {
      try {
        const d = parseISO(dl.dueDate);
        return isSameMonth(d, currentMonth);
      } catch {
        return false;
      }
    }).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [filteredDeadlines, currentMonth]);

  // Toggle deadline completion
  const handleToggleComplete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = deadlines.map(dl => {
      if (dl.id === id) {
        const next = !dl.isCompleted;
        return {
          ...dl,
          isCompleted: next,
          completedAt: next ? new Date().toISOString() : undefined
        };
      }
      return dl;
    });
    setDeadlines(updated);
    try {
      localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(updated));
      window.dispatchEvent(new Event('accounticca_deadlines_updated'));
    } catch {}

    if (inspectDeadline && inspectDeadline.id === id) {
      setInspectDeadline({
        ...inspectDeadline,
        isCompleted: !inspectDeadline.isCompleted,
        completedAt: !inspectDeadline.isCompleted ? new Date().toISOString() : undefined
      });
    }
  };

  // Google Calendar Sync
  const handleSyncToGoogleCalendar = (dl: ComplianceDeadline, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const calendarTitle = encodeURIComponent(`${dl.title} - Statutory Compliance Deadline`);
    const details = encodeURIComponent(`Compliance Deadline: ${dl.title}\nCategory: ${dl.category}\nEntity: ${dl.entityName || 'N/A'}\nNotes: ${dl.notes || 'None'}`);
    const location = encodeURIComponent(dl.entityName || 'NBR / RJSC Portal');

    const start = new Date(`${dl.dueDate}T09:00:00`);
    const end = new Date(`${dl.dueDate}T17:00:00`);

    const formatGCal = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');
    const dates = `${formatGCal(start)}/${formatGCal(end)}`;

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${calendarTitle}&dates=${dates}&details=${details}&location=${location}`;
    window.open(url, '_blank');
  };

  const getCategoryStyles = (category: ComplianceDeadline['category']) => {
    switch (category) {
      case 'Income Tax':
        return {
          bg: 'bg-blue-50 text-blue-900 border-blue-200 hover:border-blue-400',
          badge: 'bg-blue-600 text-white',
          dot: 'bg-blue-500'
        };
      case 'VAT & Customs':
        return {
          bg: 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:border-emerald-400',
          badge: 'bg-emerald-600 text-white',
          dot: 'bg-emerald-500'
        };
      case 'RJSC Corporate':
        return {
          bg: 'bg-purple-50 text-purple-900 border-purple-200 hover:border-purple-400',
          badge: 'bg-purple-600 text-white',
          dot: 'bg-purple-500'
        };
      case 'Trade License':
        return {
          bg: 'bg-amber-50 text-amber-900 border-amber-200 hover:border-amber-400',
          badge: 'bg-amber-600 text-white',
          dot: 'bg-amber-500'
        };
      case 'Audit & Accounts':
      default:
        return {
          bg: 'bg-teal-50 text-teal-900 border-teal-200 hover:border-teal-400',
          badge: 'bg-teal-600 text-white',
          dot: 'bg-teal-500'
        };
    }
  };

  return (
    <div id="compliance-deadlines-calendar-component" className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
      
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-xs shrink-0">
            <CalendarIcon className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black text-slate-900">Upcoming Deadlines Calendar View</h2>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                Browser Storage Sync
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Interactive timeline & monthly calendar grid of stored statutory tax dates and corporate filing requirements.
            </p>
          </div>
        </div>

        {/* Action Controls & View Mode Toggle */}
        <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-auto shrink-0">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
            <button
              onClick={() => setViewMode('calendar')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-xs font-black' : 'hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-emerald-600" />
              <span>Calendar Grid</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'timeline' ? 'bg-white text-slate-900 shadow-xs font-black' : 'hover:text-slate-900'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5 text-indigo-600" />
              <span>Timeline Stream</span>
            </button>
          </div>

          {/* Quick jump to November 2026 */}
          <button
            onClick={jumpToNovember2026}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer border border-slate-200"
            title="Jump to Nov 2026 (Tax Return & VAT Deadlines)"
          >
            Nov 2026
          </button>

          {/* Export to CSV shortcut */}
          <button
            onClick={() => exportDashboardDataAsCSV('deadlines')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-colors cursor-pointer border border-emerald-200"
            title="Download deadlines as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Month Navigator & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200">
        {/* Previous / Next Month Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-sm font-black text-slate-900 min-w-[130px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={jumpToToday}
            className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer shadow-2xs"
          >
            Today
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent border-none outline-none cursor-pointer font-bold text-slate-800 text-xs"
            >
              <option value="all">All Categories</option>
              <option value="Income Tax">Income Tax</option>
              <option value="VAT & Customs">VAT & Customs</option>
              <option value="RJSC Corporate">RJSC Corporate</option>
              <option value="Trade License">Trade License</option>
              <option value="Audit & Accounts">Audit & Accounts</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="bg-transparent border-none outline-none cursor-pointer font-bold text-slate-800 text-xs"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Deadlines</option>
              <option value="approaching">Approaching (Urgent)</option>
              <option value="completed">Filed / Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* VIEW 1: MONTHLY CALENDAR GRID */}
      {viewMode === 'calendar' && (
        <div className="space-y-2">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-extrabold uppercase tracking-wider text-slate-400 pb-1">
            <span className="text-rose-500">Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarDays.map((day, i) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const dayDeadlines = deadlinesByDay[dayStr] || [];
              const isCurrMonth = isSameMonth(day, currentMonth);
              const isDayToday = isSameDay(day, new Date());
              const hasDeadlines = dayDeadlines.length > 0;

              return (
                <div
                  key={i}
                  onClick={() => {
                    if (hasDeadlines) {
                      setSelectedDayDeadlines({ date: day, items: dayDeadlines });
                    }
                  }}
                  className={`min-h-[90px] sm:min-h-[115px] p-1.5 sm:p-2 rounded-2xl border transition-all flex flex-col justify-between relative ${
                    isCurrMonth ? 'bg-white' : 'bg-slate-50/50 text-slate-300'
                  } ${
                    isDayToday 
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20' 
                      : hasDeadlines 
                      ? 'border-slate-300 hover:border-emerald-400 hover:shadow-xs cursor-pointer' 
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  {/* Day Number Header */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black rounded-lg px-1.5 py-0.5 ${
                      isDayToday 
                        ? 'bg-emerald-600 text-white' 
                        : isCurrMonth 
                        ? 'text-slate-800' 
                        : 'text-slate-400'
                    }`}>
                      {format(day, 'd')}
                    </span>

                    {hasDeadlines && (
                      <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                        {dayDeadlines.length}
                      </span>
                    )}
                  </div>

                  {/* Day Deadlines Tags */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayDeadlines.slice(0, 2).map((dl) => {
                      const style = getCategoryStyles(dl.category);
                      const daysLeft = calculateDaysRemaining(dl.dueDate);
                      const isApproaching = daysLeft >= 0 && daysLeft <= (dl.leadDaysAlert || 7) && !dl.isCompleted;

                      return (
                        <div
                          key={dl.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectDeadline(dl);
                          }}
                          className={`px-1.5 py-1 rounded-lg border text-[10px] font-bold leading-tight truncate transition-all cursor-pointer flex items-center justify-between gap-1 ${
                            dl.isCompleted
                              ? 'bg-slate-100 text-slate-500 border-slate-200 line-through opacity-70'
                              : isApproaching
                              ? 'bg-amber-100 text-amber-950 border-amber-300 shadow-2xs'
                              : style.bg
                          }`}
                          title={`${dl.title} (${dl.category})`}
                        >
                          <span className="truncate">{dl.title}</span>
                          {dl.isCompleted ? (
                            <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                          ) : isApproaching ? (
                            <Clock className="w-2.5 h-2.5 text-amber-700 shrink-0 animate-pulse" />
                          ) : (
                            <span className={`w-1.5 h-1.5 rounded-full ${style.dot} shrink-0`} />
                          )}
                        </div>
                      );
                    })}

                    {dayDeadlines.length > 2 && (
                      <div className="text-[9px] font-black text-slate-500 text-center bg-slate-100 rounded py-0.5">
                        +{dayDeadlines.length - 2} more
                      </div>
                    )}
                  </div>

                  {/* Bottom Day Status Indicator */}
                  <div className="mt-1">
                    {dayDeadlines.some(d => !d.isCompleted && calculateDaysRemaining(d.dueDate) <= 0) && (
                      <div className="h-1 rounded-full bg-rose-500 w-full" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: TIMELINE STREAM VIEW */}
      {viewMode === 'timeline' && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Chronological Timeline for {format(currentMonth, 'MMMM yyyy')} ({currentMonthDeadlines.length} Deadlines)
            </span>
            <span className="text-[11px] font-bold text-slate-500">
              Organized by target filing dates
            </span>
          </div>

          {currentMonthDeadlines.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <CalendarIcon className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-600">No compliance deadlines stored for {format(currentMonth, 'MMMM yyyy')}</p>
              <p className="text-[11px] text-slate-400">Use the month switcher above or click Nov 2026 to view statutory filings.</p>
            </div>
          ) : (
            <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {currentMonthDeadlines.map((dl) => {
                const daysLeft = calculateDaysRemaining(dl.dueDate);
                const isOverdue = daysLeft < 0 && !dl.isCompleted;
                const isApproaching = daysLeft >= 0 && daysLeft <= (dl.leadDaysAlert || 7) && !dl.isCompleted;
                const style = getCategoryStyles(dl.category);

                return (
                  <div key={dl.id} className="relative group">
                    {/* Timeline Node Bullet */}
                    <div className={`absolute -left-6 sm:-left-8 top-4 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center transition-transform group-hover:scale-125 ${
                      dl.isCompleted 
                        ? 'border-emerald-600 bg-emerald-100' 
                        : isOverdue 
                        ? 'border-rose-600 bg-rose-100' 
                        : isApproaching 
                        ? 'border-amber-500 bg-amber-100' 
                        : 'border-slate-400'
                    }`}>
                      {dl.isCompleted && <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                    </div>

                    <div 
                      onClick={() => setInspectDeadline(dl)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        dl.isCompleted
                          ? 'bg-slate-50/70 border-slate-200 text-slate-500'
                          : isOverdue
                          ? 'bg-rose-50/80 border-rose-200 text-slate-900 shadow-xs'
                          : isApproaching
                          ? 'bg-amber-50/80 border-amber-300 text-slate-900 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900'
                      }`}
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${style.badge}`}>
                            {dl.category}
                          </span>
                          <span className="text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md">
                            📅 {format(parseISO(dl.dueDate), 'EEEE, MMMM dd, yyyy')}
                          </span>
                          {dl.entityName && (
                            <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                              🏢 {dl.entityName}
                            </span>
                          )}
                        </div>

                        <h4 className={`text-base font-black ${dl.isCompleted ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {dl.title}
                        </h4>

                        {dl.notes && (
                          <p className="text-xs text-slate-500 italic">
                            💡 {dl.notes}
                          </p>
                        )}
                      </div>

                      {/* Right Timeline Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {dl.isCompleted ? (
                          <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-xl flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Filed
                          </span>
                        ) : isOverdue ? (
                          <span className="text-xs font-black text-rose-800 bg-rose-200 border border-rose-300 px-3 py-1 rounded-xl">
                            Overdue {Math.abs(daysLeft)}d
                          </span>
                        ) : isApproaching ? (
                          <span className="text-xs font-black text-slate-950 bg-amber-400 border border-amber-500 px-3 py-1 rounded-xl shadow-xs">
                            {daysLeft === 0 ? 'DUE TODAY!' : `Due in ${daysLeft} days`}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
                            In {daysLeft} days
                          </span>
                        )}

                        <button
                          onClick={(e) => handleToggleComplete(dl.id, e)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors"
                        >
                          {dl.isCompleted ? 'Mark Pending' : 'Mark Filed'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: INSPECT SINGLE DEADLINE */}
      {inspectDeadline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setInspectDeadline(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <CalendarIcon className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {inspectDeadline.category}
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  {inspectDeadline.title}
                </h3>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Statutory Due Date:</span>
                <span className="font-black text-slate-900 text-sm">
                  {format(parseISO(inspectDeadline.dueDate), 'EEEE, MMMM dd, yyyy')}
                </span>
              </div>

              {inspectDeadline.entityName && (
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Entity / Company:</span>
                  <span className="font-bold text-slate-800">{inspectDeadline.entityName}</span>
                </div>
              )}

              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Status & Urgency:</span>
                <span className={`font-black ${
                  inspectDeadline.isCompleted 
                    ? 'text-emerald-700' 
                    : calculateDaysRemaining(inspectDeadline.dueDate) <= 0 
                    ? 'text-rose-700' 
                    : 'text-amber-700'
                }`}>
                  {inspectDeadline.isCompleted 
                    ? '✓ Filed / Completed' 
                    : `Due in ${calculateDaysRemaining(inspectDeadline.dueDate)} days`}
                </span>
              </div>

              {inspectDeadline.notes && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Filing Notes:</span>
                  <p className="text-slate-700 italic leading-relaxed bg-white p-2.5 rounded-xl border border-slate-200">
                    "{inspectDeadline.notes}"
                  </p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={(e) => handleToggleComplete(inspectDeadline.id, e)}
                className={`flex-1 py-3 rounded-xl font-black text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                  inspectDeadline.isCompleted
                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>{inspectDeadline.isCompleted ? 'Mark as Pending' : 'Mark as Filed / Completed'}</span>
              </button>

              <button
                onClick={(e) => handleSyncToGoogleCalendar(inspectDeadline, e)}
                className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                title="Add to Google Calendar"
              >
                <Share2 className="w-4 h-4 text-emerald-400" />
                <span>Sync to Google Calendar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DAY DEADLINES LIST POPUP */}
      {selectedDayDeadlines && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedDayDeadlines(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Calendar Day Schedule
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-1">
                {format(selectedDayDeadlines.date, 'EEEE, MMMM dd, yyyy')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedDayDeadlines.items.length} compliance deadlines falling on this date
              </p>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedDayDeadlines.items.map((dl) => (
                <div 
                  key={dl.id}
                  onClick={() => {
                    setSelectedDayDeadlines(null);
                    setInspectDeadline(dl);
                  }}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-400 transition-all cursor-pointer space-y-2 bg-slate-50 hover:bg-emerald-50/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {dl.category}
                    </span>
                    <span className={dl.isCompleted ? 'text-xs font-bold text-emerald-700' : 'text-xs font-bold text-amber-700'}>
                      {dl.isCompleted ? '✓ Filed' : 'Pending'}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900">{dl.title}</h4>
                  {dl.entityName && <p className="text-xs text-slate-500">🏢 {dl.entityName}</p>}
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedDayDeadlines(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ComplianceDeadlinesCalendarView;
