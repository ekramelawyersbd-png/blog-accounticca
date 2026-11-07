import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  CalendarDays,
  Clock,
  Video,
  Building2,
  FileText,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  ExternalLink,
  Plus,
  SlidersHorizontal,
  ShieldCheck,
  Tag,
  Share2,
  Printer,
  Sparkles,
  UserCheck,
  Check,
  Search,
  RefreshCw,
  Info,
  CalendarCheck
} from 'lucide-react';
import {
  ClientCalendarProfile,
  SharedCalendarEvent,
  CalendarEventType,
  getActiveClientCalendarProfile,
  saveActiveClientCalendarProfile,
  getCombinedSharedCalendarEvents,
  calculateDaysRemaining
} from '../../services/clientProfileCalendarService';
import { Appointment } from '../../services/appointmentService';

interface SharedClientCalendarProps {
  appointments?: Appointment[];
  activeUser?: { displayName?: string | null; email?: string | null } | null;
  onScheduleConsultation?: () => void;
}

export const SharedClientCalendar: React.FC<SharedClientCalendarProps> = ({
  appointments = [],
  activeUser,
  onScheduleConsultation
}) => {
  // Client Profile State
  const [profile, setProfile] = useState<ClientCalendarProfile>(() =>
    getActiveClientCalendarProfile(activeUser || undefined)
  );
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Calendar Navigation State
  // Default month: October 2026 (Month 9 in 0-indexed Date)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(9); // 9 = October
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-17'); // Today
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');

  // Filter & Search State
  const [eventTypeFilter, setEventTypeFilter] = useState<'all' | 'statutory' | 'meetings' | 'urgent'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Event Modal
  const [selectedEvent, setSelectedEvent] = useState<SharedCalendarEvent | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync profile when activeUser prop changes
  useEffect(() => {
    setProfile(getActiveClientCalendarProfile(activeUser || undefined));
  }, [activeUser]);

  // Combined events based on active profile and appointments
  const allEvents = useMemo(() => {
    return getCombinedSharedCalendarEvents(profile, appointments);
  }, [profile, appointments]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return allEvents.filter(event => {
      // Category filter
      if (eventTypeFilter === 'statutory') {
        if (event.type === 'meeting') return false;
      } else if (eventTypeFilter === 'meetings') {
        if (event.type !== 'meeting') return false;
      } else if (eventTypeFilter === 'urgent') {
        if (event.daysRemaining < 0 || event.daysRemaining > 15) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = event.title.toLowerCase().includes(q);
        const matchesDesc = event.description.toLowerCase().includes(q);
        const matchesSection = (event.statutorySection || '').toLowerCase().includes(q);
        const matchesCounsel = (event.assignedCounsel || '').toLowerCase().includes(q);
        return matchesTitle || matchesDesc || matchesSection || matchesCounsel;
      }

      return true;
    });
  }, [allEvents, eventTypeFilter, searchQuery]);

  // Monthly grid generation
  const monthDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days = [];

    // Blank cells before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push({ dayNumber: null, dateString: '' });
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateString = `${currentYear}-${monthStr}-${dayStr}`;
      days.push({ dayNumber: day, dateString });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Events grouped by date string
  const eventsByDate = useMemo(() => {
    const map = new Map<string, SharedCalendarEvent[]>();
    for (const evt of filteredEvents) {
      const list = map.get(evt.date) || [];
      list.push(evt);
      map.set(evt.date, list);
    }
    return map;
  }, [filteredEvents]);

  // Events for currently selected date
  const selectedDateEvents = useMemo(() => {
    return eventsByDate.get(selectedDate) || [];
  }, [eventsByDate, selectedDate]);

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleGoToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(9); // Oct
    setSelectedDate('2026-10-17');
  };

  const monthLabel = new Date(currentYear, currentMonth, 1).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  // Export iCal (.ics)
  const handleExportICS = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Accounticca Legal & Tax//Client Portal Calendar//EN\nCALSCALE:GREGORIAN\n";
    
    filteredEvents.forEach(evt => {
      const cleanDate = evt.date.replace(/-/g, '');
      icsContent += "BEGIN:VEVENT\n";
      icsContent += `UID:${evt.id}@accounticca.com\n`;
      icsContent += `DTSTART;VALUE=DATE:${cleanDate}\n`;
      icsContent += `SUMMARY:${evt.title.replace(/,/g, '\\,')}\n`;
      icsContent += `DESCRIPTION:${evt.description.replace(/\n/g, ' ')}\n`;
      if (evt.location) {
        icsContent += `LOCATION:${evt.location}\n`;
      }
      icsContent += "END:VEVENT\n";
    });

    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `Tax_and_Meeting_Schedule_${profile.organization.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage('Exported calendar feed (.ics) for Apple/Google/Outlook calendar.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddGoogleCalendar = (evt: SharedCalendarEvent) => {
    const title = encodeURIComponent(`${evt.title} - Accounticca & ELA Chambers`);
    const details = encodeURIComponent(`${evt.description}\n\nClient: ${profile.organization}\nSection: ${evt.statutorySection || 'N/A'}`);
    const location = encodeURIComponent(evt.location || evt.meetingLink || 'Chamber Suite 704, Concord Tower, Dhaka');
    const dateFormatted = evt.date.replace(/-/g, '');
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateFormatted}/${dateFormatted}&details=${details}&location=${location}`;
    window.open(url, '_blank');
  };

  // Save profile changes
  const handleSaveProfileForm = (e: React.FormEvent) => {
    e.preventDefault();
    saveActiveClientCalendarProfile(profile);
    setIsProfileModalOpen(false);
    setToastMessage(`Calendar recalculated for ${profile.organization} (${profile.entityType.toUpperCase().replace('_', ' ')}).`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden space-y-0">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="bg-emerald-900 text-white px-5 py-3 flex items-center justify-between text-xs font-semibold animate-fade-in border-b border-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-300 hover:text-white cursor-pointer">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 sm:p-7 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-sm shrink-0">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Shared Client Compliance & Meeting Calendar
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Unified statutory tax filing milestones, monthly VAT deadlines, and chamber consultations tailored to your corporate profile.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/10 transition-all cursor-pointer"
              title="Customize profile synchronization parameters"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sync Settings</span>
            </button>

            <button
              onClick={handleExportICS}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/10 transition-all cursor-pointer"
              title="Export iCalendar file (.ics) for Apple/Google/Outlook"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export (.ics)</span>
            </button>

            {onScheduleConsultation && (
              <button
                onClick={onScheduleConsultation}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Book Meeting</span>
              </button>
            )}
          </div>
        </div>

        {/* Profile Sync Status Strip */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" />
              Active Profile:
            </span>
            <span className="font-bold text-white">{profile.organization}</span>
            <span>·</span>
            <span className="text-slate-300">{profile.entityType === 'private_ltd' ? 'Private Limited Company' : profile.entityType === 'public_ltd' ? 'Public Limited Company' : 'Individual Filer'}</span>
            <span>·</span>
            <span className="text-slate-300 font-mono">TIN: {profile.tinNumber}</span>
            <span>·</span>
            <span className="text-slate-300">Fiscal Year Closing: {profile.fiscalYearEnd.toUpperCase()}</span>
          </div>

          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="text-[11px] text-emerald-300 hover:text-white underline font-semibold cursor-pointer shrink-0"
          >
            Switch Entity / Recalculate Deadlines →
          </button>
        </div>
      </div>

      {/* Control Bar: Month Switcher, Filters, and View Toggle */}
      <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Month Switcher */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-xs sm:text-sm font-extrabold text-slate-900 min-w-[140px] text-center">
                {monthLabel}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleGoToday}
              className="px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              Today (Oct 17)
            </button>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl text-xs font-bold">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Month Grid
              </button>
              <button
                onClick={() => setViewMode('agenda')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'agenda' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Agenda List
              </button>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-1">
              <button
                onClick={() => setEventTypeFilter('all')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  eventTypeFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                All ({allEvents.length})
              </button>
              <button
                onClick={() => setEventTypeFilter('statutory')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  eventTypeFilter === 'statutory'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>Tax & VAT</span>
              </button>
              <button
                onClick={() => setEventTypeFilter('meetings')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  eventTypeFilter === 'meetings'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Meetings</span>
              </button>
              <button
                onClick={() => setEventTypeFilter('urgent')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  eventTypeFilter === 'urgent'
                    ? 'bg-rose-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                <span>Next 14 Days</span>
              </button>
            </div>

            <div className="relative w-full sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'month' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80">
          {/* Calendar Grid (Col 1-3) */}
          <div className="lg:col-span-3 p-4 sm:p-6 space-y-4">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[11px] font-black text-slate-400 uppercase tracking-wider">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {monthDays.map((cell, idx) => {
                if (!cell.dayNumber) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="min-h-[78px] sm:min-h-[96px] bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/60"
                    />
                  );
                }

                const dayEvents = eventsByDate.get(cell.dateString) || [];
                const isToday = cell.dateString === '2026-10-17';
                const isSelected = cell.dateString === selectedDate;

                return (
                  <div
                    key={cell.dateString}
                    onClick={() => setSelectedDate(cell.dateString)}
                    className={`min-h-[78px] sm:min-h-[96px] p-1.5 sm:p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/30 shadow-xs ring-2 ring-indigo-500/20'
                        : isToday
                        ? 'border-emerald-400 bg-emerald-50/30'
                        : dayEvents.length > 0
                        ? 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs'
                        : 'border-slate-100 bg-white hover:bg-slate-50/50'
                    }`}
                  >
                    {/* Day Number Header */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center ${
                          isToday
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-700'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      {isToday && (
                        <span className="hidden sm:inline text-[9px] font-black uppercase text-emerald-700 tracking-wider">
                          Today
                        </span>
                      )}
                    </div>

                    {/* Event Badges */}
                    <div className="space-y-1 mt-1">
                      {dayEvents.slice(0, 2).map((ev) => {
                        const isMeeting = ev.type === 'meeting';
                        return (
                          <div
                            key={ev.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(ev);
                            }}
                            className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold truncate flex items-center gap-1 ${
                              isMeeting
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                : ev.urgency === 'critical'
                                ? 'bg-rose-100 text-rose-900 border border-rose-200'
                                : 'bg-amber-100 text-amber-900 border border-amber-200'
                            }`}
                            title={ev.title}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                isMeeting ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                            />
                            <span className="truncate">{ev.title}</span>
                          </div>
                        );
                      })}

                      {dayEvents.length > 2 && (
                        <div className="text-[9px] font-bold text-slate-500 pl-1">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Day Inspector & Upcoming Digest */}
          <div className="lg:col-span-1 p-5 sm:p-6 bg-slate-50/50 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Day Schedule
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                  {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Day Events */}
              <div className="mt-4 space-y-3">
                {selectedDateEvents.length === 0 ? (
                  <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
                    <CalendarCheck className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">No scheduled events</p>
                    <p className="text-[11px] text-slate-500">
                      No statutory tax deadlines or chamber consultations on this date.
                    </p>
                  </div>
                ) : (
                  selectedDateEvents.map((evt) => {
                    const isMeeting = evt.type === 'meeting';
                    return (
                      <div
                        key={evt.id}
                        onClick={() => setSelectedEvent(evt)}
                        className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-indigo-300 transition-all cursor-pointer space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isMeeting
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {isMeeting ? 'Consultation' : 'Statutory Deadline'}
                          </span>
                          {evt.time && (
                            <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {evt.time.split(' ')[0]} {evt.time.split(' ')[1]}
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 leading-snug">
                          {evt.title}
                        </h4>

                        <p className="text-[11px] text-slate-500 line-clamp-2">
                          {evt.description}
                        </p>

                        <div className="pt-1 flex items-center justify-between text-[11px] border-t border-slate-100">
                          <span className="text-indigo-600 font-bold hover:underline">
                            View Details →
                          </span>
                          {evt.meetingLink && (
                            <a
                              href={evt.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-emerald-700 font-bold inline-flex items-center gap-1 hover:underline"
                            >
                              <Video className="w-3 h-3" />
                              <span>Meet Link</span>
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Upcoming Deadlines Quick Digest */}
            <div className="pt-4 border-t border-slate-200 space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Next Approaching Deadlines
              </span>
              <div className="space-y-2 text-xs">
                {allEvents
                  .filter((e) => e.daysRemaining >= 0)
                  .slice(0, 3)
                  .map((ev) => (
                    <div
                      key={`digest-${ev.id}`}
                      onClick={() => setSelectedEvent(ev)}
                      className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-50"
                    >
                      <div className="truncate">
                        <p className="font-bold text-slate-800 truncate text-[11px]">{ev.title}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{ev.date}</p>
                      </div>
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${
                          ev.daysRemaining <= 3
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ev.daysRemaining === 0 ? 'Today' : `in ${ev.daysRemaining}d`}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Agenda / Timeline View */
        <div className="p-5 sm:p-7 divide-y divide-slate-100">
          {filteredEvents.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">No events matched your search or filter.</p>
              <button
                onClick={() => {
                  setEventTypeFilter('all');
                  setSearchQuery('');
                }}
                className="text-xs font-bold text-indigo-600 underline"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredEvents.map((evt) => {
              const isMeeting = evt.type === 'meeting';
              const days = evt.daysRemaining;

              return (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className="py-5 sm:py-6 transition-colors hover:bg-slate-50/70 rounded-2xl px-3 cursor-pointer"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Date Badge & Info */}
                    <div className="flex items-start gap-4">
                      {/* Date Badge */}
                      <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center shrink-0 shadow-2xs">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                          {new Date(`${evt.date}T00:00:00`).toLocaleString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-lg font-black leading-none">
                          {evt.date.split('-')[2]}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="space-y-1.5 max-w-xl">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-extrabold text-slate-900">
                            {evt.title}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isMeeting
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {isMeeting ? 'Chamber Consultation' : 'Statutory Tax Deadline'}
                          </span>
                          {days >= 0 ? (
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                days <= 3
                                  ? 'bg-rose-100 text-rose-800 animate-pulse'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {days === 0 ? 'Due Today' : `${days} day${days > 1 ? 's' : ''} remaining`}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                              Completed Milestone
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          {evt.description}
                        </p>

                        {/* Metadata text without pill containers */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 pt-0.5">
                          {evt.time && (
                            <span className="flex items-center gap-1 font-semibold text-slate-600">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {evt.time}
                            </span>
                          )}
                          {evt.statutorySection && (
                            <>
                              <span>·</span>
                              <span className="font-medium text-slate-700">{evt.statutorySection}</span>
                            </>
                          )}
                          {evt.assignedCounsel && (
                            <>
                              <span>·</span>
                              <span className="font-medium text-slate-700">Counsel: {evt.assignedCounsel}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 md:self-center shrink-0">
                      {evt.meetingLink && (
                        <a
                          href={evt.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Meet</span>
                        </a>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddGoogleCalendar(evt);
                        }}
                        className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                        title="Add to Google Calendar"
                      >
                        <CalendarCheck className="w-3.5 h-3.5 text-slate-500" />
                        <span>Add to GCal</span>
                      </button>

                      <button
                        onClick={() => setSelectedEvent(evt)}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Profile Sync Configuration Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Client Profile Synchronization</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Parameters used to compute statutory filing deadlines and tax obligations
                </p>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfileForm} className="p-6 space-y-4 overflow-y-auto text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Company / Organization Name *</label>
                <input
                  type="text"
                  required
                  value={profile.organization}
                  onChange={(e) => setProfile({ ...profile, organization: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Entity Classification *</label>
                  <select
                    value={profile.entityType}
                    onChange={(e) => setProfile({ ...profile, entityType: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="private_ltd">Private Limited Company</option>
                    <option value="public_ltd">Public Limited Company</option>
                    <option value="individual">Individual Assessee</option>
                    <option value="foreign_branch">Foreign Branch / Liaison</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Fiscal Year Closing *</label>
                  <select
                    value={profile.fiscalYearEnd}
                    onChange={(e) => setProfile({ ...profile, fiscalYearEnd: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="june">June 30 Closing (Return Due Jan 15)</option>
                    <option value="december">December 31 Closing (Return Due Jul 15)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">TIN (12-Digit Tax ID)</label>
                  <input
                    type="text"
                    value={profile.tinNumber}
                    onChange={(e) => setProfile({ ...profile, tinNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">BIN (9-Digit VAT ID)</label>
                  <input
                    type="text"
                    value={profile.binNumber}
                    onChange={(e) => setProfile({ ...profile, binNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Assessed Tax Circle / LTU</label>
                <input
                  type="text"
                  value={profile.taxCircle}
                  onChange={(e) => setProfile({ ...profile, taxCircle: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="pt-2 space-y-2 border-t border-slate-200">
                <label className="flex items-center justify-between font-bold text-slate-800 cursor-pointer">
                  <span>VAT Registered (Mushak 9.1 Monthly Deadlines)</span>
                  <input
                    type="checkbox"
                    checked={profile.isVatRegistered}
                    onChange={(e) => setProfile({ ...profile, isVatRegistered: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600"
                  />
                </label>

                <label className="flex items-center justify-between font-bold text-slate-800 cursor-pointer">
                  <span>Withholding Agent (Section 75B TDS Monthly Returns)</span>
                  <input
                    type="checkbox"
                    checked={profile.hasWithholdingObligation}
                    onChange={(e) => setProfile({ ...profile, hasWithholdingObligation: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600"
                  />
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer"
                >
                  Apply &amp; Recalculate Calendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">
                  {selectedEvent.type === 'meeting' ? 'Chamber Consultation' : 'Statutory Milestone'}
                </span>
                <h3 className="text-base font-extrabold mt-0.5">{selectedEvent.title}</h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs text-slate-700">
              {/* Event Timing & Urgency Bar */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Scheduled Date</span>
                  <p className="font-extrabold text-sm text-slate-900">
                    {new Date(`${selectedEvent.date}T00:00:00`).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                {selectedEvent.daysRemaining >= 0 && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black ${
                      selectedEvent.daysRemaining <= 3
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {selectedEvent.daysRemaining === 0 ? 'Due Today' : `${selectedEvent.daysRemaining} Days Left`}
                  </span>
                )}
              </div>

              {/* Description */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Compliance Summary
                </span>
                <p className="text-xs leading-relaxed text-slate-700">
                  {selectedEvent.description}
                </p>
              </div>

              {/* Statutory Citations */}
              {selectedEvent.statutorySection && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                    Statutory Legal Authority
                  </span>
                  <p className="font-bold text-amber-950">{selectedEvent.statutorySection}</p>
                  {selectedEvent.formRequired && (
                    <p className="text-[11px] text-amber-800">Mandatory Form: <strong>{selectedEvent.formRequired}</strong></p>
                  )}
                  {selectedEvent.penaltyWarning && (
                    <p className="text-[10px] text-rose-800 font-semibold mt-1">
                      Warning: {selectedEvent.penaltyWarning}
                    </p>
                  )}
                </div>
              )}

              {/* Meeting Specific Details */}
              {selectedEvent.assignedCounsel && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider block">
                    Assigned Chamber Partner
                  </span>
                  <p className="font-bold text-indigo-950">{selectedEvent.assignedCounsel}</p>
                  <p className="text-[11px] text-indigo-800">
                    Mode: {selectedEvent.mode === 'virtual' ? 'Virtual Video Conference (Google Meet)' : 'Chamber Suite (In-Person)'}
                  </p>
                </div>
              )}

              {/* Profile Tags */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Synced Profile Attributes
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedEvent.profileTags.map((tag, i) => (
                    <span key={i} className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                onClick={() => handleAddGoogleCalendar(selectedEvent)}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-200 font-bold text-xs text-slate-800 flex items-center gap-1.5 cursor-pointer"
              >
                <CalendarCheck className="w-3.5 h-3.5 text-slate-600" />
                <span>Add to Google Calendar</span>
              </button>

              {selectedEvent.meetingLink ? (
                <a
                  href={selectedEvent.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Video className="w-4 h-4" />
                  <span>Join Video Conference</span>
                </a>
              ) : (
                <button
                  onClick={() => {
                    setSelectedEvent(null);
                    if (onScheduleConsultation) onScheduleConsultation();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-sm"
                >
                  Request Counsel Assistance
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
