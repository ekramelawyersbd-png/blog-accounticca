import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Video,
  Building2,
  Copy,
  Check,
  Search,
  RefreshCw,
  Plus,
  ExternalLink,
  Download,
  FileText,
  X,
  RotateCcw,
  Radio
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Appointment,
  AppointmentStatus,
  subscribeToUserAppointments,
  updateAppointmentStatus,
  createQuickPortalAppointment,
  getGoogleCalendarUrl,
  downloadIcsFile,
  CHAMBER_ADDRESS
} from '../../services/appointmentService';

export interface MyAppointmentsSectionProps {
  userId: string;
  userEmail?: string | null;
  userName?: string | null;
  onViewDocumentsForRef?: (referenceId: string) => void;
  compact?: boolean;
}

const CANCELLATION_REASONS = [
  'Schedule conflict — need to reschedule for another date',
  'Matter resolved internally prior to consultation date',
  'Switching consultation mode (Virtual vs. In-Person Chamber)',
  'Gathering additional statutory / tax documents before meeting',
  'Other reason (specify below)'
];

const PRACTICE_OPTIONS = [
  'Income Tax & Corporate Assessment',
  'VAT & SD Act Compliance & Reconciliations',
  'Corporate Law & Commercial Litigation',
  'RJSC Company Incorporation & Secretarial',
  'Statutory Financial Audit & Assurance'
];

const TIME_SLOT_OPTIONS = [
  '10:00 AM - 10:45 AM BST',
  '11:30 AM - 12:15 PM BST',
  '02:30 PM - 03:15 PM BST',
  '04:00 PM - 04:45 PM BST'
];

export const MyAppointmentsSection: React.FC<MyAppointmentsSectionProps> = ({
  userId,
  userEmail,
  userName,
  onViewDocumentsForRef,
  compact = false
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLiveFirestore, setIsLiveFirestore] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Confirmed' | 'Cancelled'>('All');
  const [modeFilter, setModeFilter] = useState<'all' | 'virtual' | 'in_person'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Status feedback banner
  const [statusNotice, setStatusNotice] = useState<{
    type: 'success' | 'info' | 'warning';
    message: string;
  } | null>(null);

  // Cancellation modal state
  const [cancellingAppointment, setCancellingAppointment] = useState<Appointment | null>(null);
  const [selectedCancelReason, setSelectedCancelReason] = useState<string>(CANCELLATION_REASONS[0]);
  const [customCancelReason, setCustomCancelReason] = useState<string>('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState<boolean>(false);

  // Quick New Appointment modal state
  const [isQuickBookOpen, setIsQuickBookOpen] = useState<boolean>(false);
  const [newPracticeArea, setNewPracticeArea] = useState<string>(PRACTICE_OPTIONS[0]);
  const [newMode, setNewMode] = useState<'virtual' | 'in_person'>('virtual');
  const [newDate, setNewDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [newTimeSlot, setNewTimeSlot] = useState<string>(TIME_SLOT_OPTIONS[1]);
  const [newInitialStatus, setNewInitialStatus] = useState<'Pending' | 'Confirmed'>('Pending');
  const [newNotes, setNewNotes] = useState<string>('');
  const [isCreatingBooking, setIsCreatingBooking] = useState<boolean>(false);

  // Subscribe to real-time updates (Firestore onSnapshot + local sync)
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeToUserAppointments(userId, userEmail, (liveList, meta) => {
      setAppointments(liveList);
      setIsLiveFirestore(meta.isLiveFirestore);
      setLastSyncedAt(meta.lastSyncedAt);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [userId, userEmail]);

  const counts = useMemo(() => {
    const pending = appointments.filter(a => a.status === 'Pending').length;
    const confirmed = appointments.filter(a => a.status === 'Confirmed').length;
    const cancelled = appointments.filter(a => a.status === 'Cancelled').length;
    return {
      total: appointments.length,
      pending,
      confirmed,
      cancelled
    };
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      if (statusFilter !== 'All' && apt.status !== statusFilter) {
        return false;
      }
      if (modeFilter !== 'all' && apt.mode !== modeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchRef = apt.referenceId.toLowerCase().includes(q);
        const matchPractice = apt.practiceArea.toLowerCase().includes(q);
        const matchExpertise = (apt.expertiseArea || '').toLowerCase().includes(q);
        const matchNotes = (apt.notes || '').toLowerCase().includes(q);
        const matchDivision = (apt.division || '').toLowerCase().includes(q);
        if (!matchRef && !matchPractice && !matchExpertise && !matchNotes && !matchDivision) {
          return false;
        }
      }
      return true;
    });
  }, [appointments, statusFilter, modeFilter, searchQuery]);

  const handleCopyRef = (refId: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(refId);
      setCopiedRef(refId);
      setTimeout(() => setCopiedRef(null), 2000);
    }
  };

  const handleManualSync = () => {
    window.dispatchEvent(new CustomEvent('accounticca:appointment-updated'));
    setStatusNotice({
      type: 'info',
      message: 'Synchronized real-time appointment statuses with chamber docket registry.'
    });
    setTimeout(() => setStatusNotice(null), 3500);
  };

  const handleStatusChange = async (apt: Appointment, nextStatus: AppointmentStatus, reason?: string) => {
    setUpdatingId(apt.id || apt.referenceId);
    try {
      await updateAppointmentStatus(
        apt.id || apt.referenceId,
        apt.referenceId,
        nextStatus,
        userId,
        reason
      );

      setStatusNotice({
        type: nextStatus === 'Confirmed' ? 'success' : nextStatus === 'Cancelled' ? 'warning' : 'info',
        message:
          nextStatus === 'Confirmed'
            ? `Appointment ${apt.referenceId} is now Confirmed. Chamber coordinates and calendar access are active.`
            : nextStatus === 'Pending'
            ? `Appointment ${apt.referenceId} moved to Pending status for partner review.`
            : `Appointment ${apt.referenceId} has been Cancelled and its chamber slot released.`
      });
      setTimeout(() => setStatusNotice(null), 5000);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingAppointment) return;
    setIsSubmittingCancel(true);

    const finalReason =
      selectedCancelReason === 'Other reason (specify below)' && customCancelReason.trim()
        ? customCancelReason.trim()
        : customCancelReason.trim()
        ? `${selectedCancelReason} — ${customCancelReason.trim()}`
        : selectedCancelReason;

    try {
      await handleStatusChange(cancellingAppointment, 'Cancelled', finalReason);
      setCancellingAppointment(null);
      setCustomCancelReason('');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const handleQuickCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingBooking(true);
    try {
      const created = await createQuickPortalAppointment({
        userId,
        userEmail: userEmail || 'client@accounticca.com',
        clientName: userName || 'Authorized Client',
        practiceArea: newPracticeArea,
        mode: newMode,
        date: newDate,
        timeSlot: newTimeSlot,
        notes: newNotes.trim() || 'Scheduled directly via Client Portal My Appointments dashboard.',
        status: newInitialStatus
      });

      setIsQuickBookOpen(false);
      setNewNotes('');
      setStatusFilter('All');
      setStatusNotice({
        type: 'success',
        message: `New appointment ${created.referenceId} scheduled with ${created.status} status and synced in real time.`
      });
      setTimeout(() => setStatusNotice(null), 5000);
    } finally {
      setIsCreatingBooking(false);
    }
  };

  const formattedSyncTime = useMemo(() => {
    if (!lastSyncedAt) return 'Live';
    try {
      return new Date(lastSyncedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return 'Live';
    }
  }, [lastSyncedAt]);

  return (
    <section
      id="my-appointments-section"
      aria-label="My Appointments Real-Time Status Dashboard"
      className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6"
    >
      {/* Section Header & Real-Time Connection Telemetry */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-600" />
              <span>Real-Time Docket Stream</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {isLiveFirestore ? 'Cloud Firestore Connected' : 'Local Session Synced'} ({formattedSyncTime})
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            My Appointments
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            Monitor live status transitions across your pending, confirmed, and cancelled legal and tax consultations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleManualSync}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Sync Status</span>
          </button>

          <button
            type="button"
            onClick={() => setIsQuickBookOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Quick Schedule</span>
          </button>

          <Link
            to="/contact?tab=appointment"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Full Booking Form</span>
          </Link>
        </div>
      </div>

      {/* Real-Time Status Summary Cards (All | Pending | Confirmed | Cancelled) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <button
          type="button"
          onClick={() => setStatusFilter('All')}
          className={`p-4 rounded-2xl border text-left transition-colors cursor-pointer ${
            statusFilter === 'All'
              ? 'bg-slate-900 border-slate-900 text-white'
              : 'bg-slate-50/70 border-slate-200/90 hover:bg-white text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className={statusFilter === 'All' ? 'text-slate-300' : 'text-slate-500'}>
              Total Recorded
            </span>
            <Calendar className={`w-4 h-4 ${statusFilter === 'All' ? 'text-emerald-400' : 'text-slate-400'}`} />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black font-mono tabular-nums">
              {counts.total}
            </span>
            <span className={`text-xs font-semibold ${statusFilter === 'All' ? 'text-emerald-300' : 'text-slate-500'}`}>
              All Statuses
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Pending')}
          className={`p-4 rounded-2xl border text-left transition-colors cursor-pointer ${
            statusFilter === 'Pending'
              ? 'bg-amber-600 border-amber-600 text-white'
              : 'bg-amber-50/50 border-amber-200/90 hover:bg-amber-50 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className={statusFilter === 'Pending' ? 'text-amber-100' : 'text-amber-900'}>
              Pending Review
            </span>
            <Clock className={`w-4 h-4 ${statusFilter === 'Pending' ? 'text-white' : 'text-amber-600'}`} />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span
              className={`text-2xl sm:text-3xl font-black font-mono tabular-nums ${
                statusFilter === 'Pending' ? 'text-white' : 'text-amber-800'
              }`}
            >
              {counts.pending}
            </span>
            <span className={`text-xs font-semibold ${statusFilter === 'Pending' ? 'text-amber-100' : 'text-amber-700'}`}>
              Awaiting Partner
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Confirmed')}
          className={`p-4 rounded-2xl border text-left transition-colors cursor-pointer ${
            statusFilter === 'Confirmed'
              ? 'bg-emerald-700 border-emerald-700 text-white'
              : 'bg-emerald-50/50 border-emerald-200/90 hover:bg-emerald-50 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className={statusFilter === 'Confirmed' ? 'text-emerald-100' : 'text-emerald-900'}>
              Confirmed
            </span>
            <CheckCircle2 className={`w-4 h-4 ${statusFilter === 'Confirmed' ? 'text-white' : 'text-emerald-600'}`} />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span
              className={`text-2xl sm:text-3xl font-black font-mono tabular-nums ${
                statusFilter === 'Confirmed' ? 'text-white' : 'text-emerald-800'
              }`}
            >
              {counts.confirmed}
            </span>
            <span
              className={`text-xs font-semibold ${
                statusFilter === 'Confirmed' ? 'text-emerald-100' : 'text-emerald-700'
              }`}
            >
              Active &amp; Ready
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Cancelled')}
          className={`p-4 rounded-2xl border text-left transition-colors cursor-pointer ${
            statusFilter === 'Cancelled'
              ? 'bg-rose-700 border-rose-700 text-white'
              : 'bg-rose-50/50 border-rose-200/90 hover:bg-rose-50 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className={statusFilter === 'Cancelled' ? 'text-rose-100' : 'text-rose-900'}>
              Cancelled
            </span>
            <XCircle className={`w-4 h-4 ${statusFilter === 'Cancelled' ? 'text-white' : 'text-rose-600'}`} />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span
              className={`text-2xl sm:text-3xl font-black font-mono tabular-nums ${
                statusFilter === 'Cancelled' ? 'text-white' : 'text-rose-800'
              }`}
            >
              {counts.cancelled}
            </span>
            <span className={`text-xs font-semibold ${statusFilter === 'Cancelled' ? 'text-rose-100' : 'text-rose-700'}`}>
              Slot Released
            </span>
          </div>
        </button>
      </div>

      {/* Status Action Alert Banner */}
      {statusNotice && (
        <div
          role="status"
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-medium ${
            statusNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : statusNotice.type === 'warning'
              ? 'bg-rose-50 border-rose-200 text-rose-950'
              : 'bg-slate-900 border-slate-800 text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : statusNotice.type === 'warning' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{statusNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusNotice(null)}
            className="p-1 rounded-lg opacity-75 hover:opacity-100 cursor-pointer"
            aria-label="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Segmented Status Filters, Mode Selector & Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
            {(['All', 'Pending', 'Confirmed', 'Cancelled'] as const).map(st => {
              const countVal =
                st === 'All'
                  ? counts.total
                  : st === 'Pending'
                  ? counts.pending
                  : st === 'Confirmed'
                  ? counts.confirmed
                  : counts.cancelled;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    statusFilter === st
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{st}</span>
                  <span className="font-mono tabular-nums text-[11px] text-slate-400">
                    ({countVal})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Consultation Mode Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setModeFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                modeFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Modes
            </button>
            <button
              type="button"
              onClick={() => setModeFilter('virtual')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 ${
                modeFilter === 'virtual' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Video className="w-3.5 h-3.5 text-emerald-600" />
              <span>Virtual</span>
            </button>
            <button
              type="button"
              onClick={() => setModeFilter('in_person')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 ${
                modeFilter === 'in_person' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-slate-600" />
              <span>Chamber</span>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search APT-ID, practice area..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Appointments List */}
      {isLoading ? (
        <div className="space-y-3 py-4">
          {[1, 2, 3].map(skeleton => (
            <div
              key={skeleton}
              className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 animate-pulse space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-36 bg-slate-200 rounded" />
                <div className="h-4 w-24 bg-slate-200 rounded" />
              </div>
              <div className="h-5 w-64 bg-slate-200 rounded" />
              <div className="h-3 w-full max-w-md bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="p-10 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 text-center space-y-3">
          <Calendar className="w-9 h-9 text-slate-300 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">
              No {statusFilter !== 'All' ? statusFilter.toLowerCase() : ''} appointments found
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {searchQuery || statusFilter !== 'All' || modeFilter !== 'all'
                ? 'Try clearing your status or search filters to view all recorded appointments.'
                : 'Schedule your first consultation with our tax practitioners or High Court advocates to track real-time status here.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2.5 pt-1">
            {(searchQuery || statusFilter !== 'All' || modeFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('All');
                  setModeFilter('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsQuickBookOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-xs font-bold text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Appointment</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {(compact ? filteredAppointments.slice(0, 4) : filteredAppointments).map(apt => {
            const isPending = apt.status === 'Pending';
            const isConfirmed = apt.status === 'Confirmed';
            const isCancelled = apt.status === 'Cancelled';
            const isUpdatingThis = updatingId === (apt.id || apt.referenceId);

            return (
              <div
                key={apt.id || apt.referenceId}
                className={`p-5 sm:p-6 rounded-2xl border transition-colors space-y-4 ${
                  isConfirmed
                    ? 'bg-white border-slate-200 hover:border-emerald-300'
                    : isPending
                    ? 'bg-white border-amber-200/90 hover:border-amber-300'
                    : 'bg-slate-50/60 border-slate-200/80'
                }`}
              >
                {/* Top Metadata & Status Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <button
                      type="button"
                      onClick={() => handleCopyRef(apt.referenceId)}
                      className="font-mono font-bold text-slate-900 hover:text-emerald-700 inline-flex items-center gap-1 cursor-pointer tabular-nums"
                      title="Copy Reference ID"
                    >
                      <span>{apt.referenceId}</span>
                      {copiedRef === apt.referenceId ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>
                    <span aria-hidden="true">·</span>
                    <span>{apt.division || 'Accounticca Advisory'}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                      {apt.mode === 'virtual' ? (
                        <>
                          <Video className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Virtual (Google Meet)</span>
                        </>
                      ) : (
                        <>
                          <Building2 className="w-3.5 h-3.5 text-slate-600" />
                          <span>In-Person Chamber</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Semantic Status Indicator (Icon + Explicit Text Label) */}
                  <div className="flex items-center gap-3">
                    {isPending && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>Status: Pending Review</span>
                      </span>
                    )}
                    {isConfirmed && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Status: Confirmed</span>
                      </span>
                    )}
                    {isCancelled && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span>Status: Cancelled</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Main Details Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                  <div className="lg:col-span-2 space-y-1.5">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {apt.practiceArea}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 font-mono tabular-nums">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{apt.date}</span>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{apt.timeSlot}</span>
                      </span>
                      {apt.expertiseArea && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-sans text-slate-600">{apt.expertiseArea}</span>
                        </>
                      )}
                    </div>

                    {apt.notes && (
                      <p className="text-xs text-slate-600 leading-relaxed pt-1">
                        <strong className="text-slate-700">Matter Notes:</strong> {apt.notes}
                      </p>
                    )}

                    {isCancelled && apt.cancellationReason && (
                      <p className="text-xs text-rose-700 leading-relaxed pt-1">
                        <strong>Cancellation Reason:</strong> {apt.cancellationReason}
                      </p>
                    )}
                  </div>

                  {/* Real-Time Status Stepper Box */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                      <span>Real-Time Lifecycle</span>
                      <span className="font-mono tabular-nums text-slate-700">
                        {isPending ? 'Step 2 of 3' : isConfirmed ? 'Step 3 of 3' : 'Closed'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                      <div className="space-y-1">
                        <div className="h-1.5 rounded-full bg-emerald-600" />
                        <span className="block text-[10px] font-semibold text-slate-700 truncate">
                          1. Logged
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div
                          className={`h-1.5 rounded-full ${
                            isPending
                              ? 'bg-amber-500'
                              : isConfirmed
                              ? 'bg-emerald-600'
                              : 'bg-slate-300'
                          }`}
                        />
                        <span className="block text-[10px] font-semibold text-slate-700 truncate">
                          2. {isPending ? 'Pending' : 'Reviewed'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div
                          className={`h-1.5 rounded-full ${
                            isConfirmed
                              ? 'bg-emerald-600'
                              : isCancelled
                              ? 'bg-rose-500'
                              : 'bg-slate-200'
                          }`}
                        />
                        <span className="block text-[10px] font-semibold text-slate-700 truncate">
                          3. {isCancelled ? 'Cancelled' : 'Confirmed'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    {isConfirmed && apt.mode === 'virtual' && (
                      <a
                        href={apt.meetingLink || 'https://meet.google.com/qmv-trcx-vny'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-colors whitespace-nowrap shrink-0"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Join Google Meet</span>
                        <ExternalLink className="w-3 h-3 opacity-80" />
                      </a>
                    )}

                    {isConfirmed && apt.mode === 'in_person' && (
                      <a
                        href="https://www.google.com/maps/search/?api=1&query=BTI+Centara+Grand+144+Green+Road+Panthapath+Dhaka+1205"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors whitespace-nowrap shrink-0"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Chamber Map ({CHAMBER_ADDRESS.split(',')[0]})</span>
                        <ExternalLink className="w-3 h-3 opacity-80" />
                      </a>
                    )}

                    {isPending && (
                      <button
                        type="button"
                        disabled={isUpdatingThis}
                        onClick={() => void handleStatusChange(apt, 'Confirmed')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isUpdatingThis ? 'Updating...' : 'Confirm Appointment'}</span>
                      </button>
                    )}

                    {isCancelled && (
                      <>
                        <button
                          type="button"
                          disabled={isUpdatingThis}
                          onClick={() => void handleStatusChange(apt, 'Pending')}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore as Pending</span>
                        </button>
                        <button
                          type="button"
                          disabled={isUpdatingThis}
                          onClick={() => void handleStatusChange(apt, 'Confirmed')}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Re-Confirm Slot</span>
                        </button>
                      </>
                    )}

                    {onViewDocumentsForRef && (
                      <button
                        type="button"
                        onClick={() => onViewDocumentsForRef(apt.referenceId)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span>Vault Files</span>
                      </button>
                    )}
                  </div>

                  {/* Right-Side Secondary Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    {!isCancelled && (
                      <>
                        <a
                          href={getGoogleCalendarUrl(apt)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition-colors whitespace-nowrap shrink-0"
                        >
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>G-Calendar</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => downloadIcsFile(apt)}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-500" />
                          <span>.ics</span>
                        </button>
                      </>
                    )}

                    {isConfirmed && (
                      <button
                        type="button"
                        disabled={isUpdatingThis}
                        onClick={() => void handleStatusChange(apt, 'Pending')}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-amber-900 font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Mark Pending</span>
                      </button>
                    )}

                    {!isCancelled && (
                      <button
                        type="button"
                        disabled={isUpdatingThis}
                        onClick={() => setCancellingAppointment(apt)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Cancel</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Reason Modal */}
      {cancellingAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-rose-700">
                  Cancel Consultation · {cancellingAppointment.referenceId}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  Confirm Appointment Cancellation
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCancellingAppointment(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are cancelling <strong>{cancellingAppointment.practiceArea}</strong> scheduled for{' '}
              <span className="font-mono font-semibold">{cancellingAppointment.date}</span> (
              {cancellingAppointment.timeSlot}). Your status will immediately update to{' '}
              <strong>Cancelled</strong> in real time.
            </p>

            <form onSubmit={handleConfirmCancelSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Select Reason for Cancellation
                </label>
                <div className="space-y-1.5">
                  {CANCELLATION_REASONS.map(reason => (
                    <label
                      key={reason}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                        selectedCancelReason === reason
                          ? 'bg-rose-50/70 border-rose-300 font-bold text-slate-900'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="cancelReason"
                        value={reason}
                        checked={selectedCancelReason === reason}
                        onChange={() => setSelectedCancelReason(reason)}
                        className="accent-rose-600"
                      />
                      <span>{reason}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={customCancelReason}
                  onChange={e => setCustomCancelReason(e.target.value)}
                  placeholder="Optional rescheduling preference or note for the chamber desk..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setCancellingAppointment(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Keep Appointment
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCancel}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-xs font-bold text-white cursor-pointer"
                >
                  {isSubmittingCancel ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Schedule Consultation Modal */}
      {isQuickBookOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-emerald-700">
                  Client Portal · Instant Docket Creation
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  Schedule New Consultation
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickBookOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Practice Area
                </label>
                <select
                  value={newPracticeArea}
                  onChange={e => setNewPracticeArea(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 font-medium focus:bg-white focus:border-emerald-600 focus:outline-none"
                >
                  {PRACTICE_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 font-mono focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Time Slot (BST)
                  </label>
                  <select
                    value={newTimeSlot}
                    onChange={e => setNewTimeSlot(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 font-mono focus:bg-white focus:border-emerald-600 focus:outline-none"
                  >
                    {TIME_SLOT_OPTIONS.map(slot => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Consultation Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewMode('virtual')}
                      className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                        newMode === 'virtual'
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Virtual</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewMode('in_person')}
                      className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                        newMode === 'in_person'
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Chamber</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Initial Booking Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewInitialStatus('Pending')}
                      className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                        newInitialStatus === 'Pending'
                          ? 'bg-amber-50 border-amber-500 text-amber-900'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Pending</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewInitialStatus('Confirmed')}
                      className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                        newInitialStatus === 'Confirmed'
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirmed</span>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Matter Brief / Agenda Notes
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Describe your tax assessment, VAT return, or corporate legal matter..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuickBookOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingBooking}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 font-bold text-white cursor-pointer"
                >
                  {isCreatingBooking ? 'Saving to Registry...' : 'Create Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
