import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Video, 
  Building2, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  Printer, 
  X, 
  Phone, 
  Mail, 
  Search, 
  Filter, 
  RefreshCw, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  FileText, 
  ChevronRight,
  AlertTriangle,
  Eye,
  Send,
  Inbox,
  Star,
  Bell
} from 'lucide-react';
import { 
  Appointment, 
  AppointmentStatus, 
  fetchUserAppointments, 
  updateAppointmentStatus, 
  createSeedAppointments, 
  getGoogleCalendarUrl, 
  downloadIcsFile,
  isAppointmentPast,
  isAppointmentWithin24Hours,
  CHAMBER_ADDRESS,
  CHAMBER_HOTLINE
} from '../../services/appointmentService';
import { 
  generateAppointmentEmailHtml, 
  generateAppointmentReminderEmailHtml 
} from '../../utils/appointmentEmailTemplate';
import { 
  fetchAppointmentNotifications, 
  EmailNotificationAudit,
  dispatchAppointmentStatusNotification,
  scanUpcomingAppointmentReminders
} from '../../services/emailNotificationService';
import { AppointmentRatingCard } from './AppointmentRatingCard';
import { AppointmentRatingModal } from './AppointmentRatingModal';
import { useAuth } from '../../contexts/AuthContext';

export function MyAppointmentsView() {
  const { user, authUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Confirmed' | 'Pending' | 'Cancelled'>('All');
  const [selectedMode, setSelectedMode] = useState<'all' | 'virtual' | 'in_person'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals & Popups
  const [cancellingApp, setCancellingApp] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('Schedule conflict / need rescheduling');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [printApp, setPrintApp] = useState<Appointment | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  // Email Notification & 24-Hour Reminder States
  const [previewEmailApp, setPreviewEmailApp] = useState<Appointment | null>(null);
  const [previewReminderApp, setPreviewReminderApp] = useState<Appointment | null>(null);
  const [isScanningReminders, setIsScanningReminders] = useState(false);
  const [showNotifHistory, setShowNotifHistory] = useState(false);
  const [notifHistory, setNotifHistory] = useState<EmailNotificationAudit[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isConfirmingId, setIsConfirmingId] = useState<string | null>(null);
  const [isResendingId, setIsResendingId] = useState<string | null>(null);

  // Rating & Feedback State
  const [ratingApp, setRatingApp] = useState<Appointment | null>(null);

  // Load appointments
  const loadData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      let data = await fetchUserAppointments(user.uid, user.email || undefined);
      
      // If user has zero appointments recorded, populate initial sample consultations
      // so they can evaluate status tracking, Google Calendar sync, and cancellation
      if (data.length === 0) {
        const seed = createSeedAppointments({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || authUser?.displayName
        });
        data = seed;
        try {
          localStorage.setItem(`accounticca_appointments_${user.uid}`, JSON.stringify(seed));
        } catch {
          // ignore
        }
      }
      setAppointments(data);
    } catch (err) {
      console.warn('Failed to load appointments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Handle Copy Reference ID
  const handleCopyRef = (refId: string) => {
    navigator.clipboard.writeText(refId);
    setCopiedId(refId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Status Filter Counts
  const counts = useMemo(() => {
    return {
      all: appointments.length,
      confirmed: appointments.filter(a => a.status === 'Confirmed').length,
      pending: appointments.filter(a => a.status === 'Pending').length,
      cancelled: appointments.filter(a => a.status === 'Cancelled').length
    };
  }, [appointments]);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(item => {
      // Status filter
      if (selectedStatus !== 'All' && item.status !== selectedStatus) {
        return false;
      }
      // Mode filter
      if (selectedMode !== 'all' && item.mode !== selectedMode) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchRef = item.referenceId.toLowerCase().includes(q);
        const matchPractice = item.practiceArea.toLowerCase().includes(q);
        const matchClient = item.clientName.toLowerCase().includes(q);
        const matchCompany = (item.companyName || '').toLowerCase().includes(q);
        const matchNotes = (item.notes || '').toLowerCase().includes(q);
        if (!matchRef && !matchPractice && !matchClient && !matchCompany && !matchNotes) {
          return false;
        }
      }
      return true;
    });
  }, [appointments, selectedStatus, selectedMode, searchQuery]);

  // Handle Cancel Appointment Confirmation
  const handleConfirmCancel = async () => {
    if (!cancellingApp || !user) return;
    setIsSubmittingCancel(true);
    try {
      await updateAppointmentStatus(
        cancellingApp.id, 
        cancellingApp.referenceId, 
        'Cancelled', 
        user.uid, 
        cancelReason
      );

      setAppointments(prev => prev.map(a => {
        if (a.referenceId === cancellingApp.referenceId || a.id === cancellingApp.id) {
          return {
            ...a,
            status: 'Cancelled',
            cancellationReason: cancelReason,
            cancelledAt: new Date().toISOString()
          };
        }
        return a;
      }));

      setNotification({
        type: 'info',
        message: `Consultation ${cancellingApp.referenceId} cancelled. Automated cancellation notice dispatched to ${cancellingApp.email || user.email} via Firebase Cloud Functions.`
      });
      setTimeout(() => setNotification(null), 6000);
      setCancellingApp(null);
    } catch (err) {
      setNotification({
        type: 'error',
        message: 'Could not cancel appointment. Please try again or reach the chamber hotline.'
      });
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  // Handle Partner/Admin Confirmation (Simulate or verify Confirmed transition)
  const handleConfirmAppointment = async (booking: Appointment) => {
    if (!user) return;
    setIsConfirmingId(booking.id);
    try {
      await updateAppointmentStatus(
        booking.id,
        booking.referenceId,
        'Confirmed',
        user.uid
      );

      const recipient = booking.email || user.email || 'client@accounticca.com';

      setAppointments(prev => prev.map(a => {
        if (a.referenceId === booking.referenceId || a.id === booking.id) {
          return {
            ...a,
            status: 'Confirmed',
            updatedAt: new Date().toISOString(),
            lastNotification: {
              status: 'Confirmed',
              sentAt: new Date().toISOString(),
              recipient
            }
          };
        }
        return a;
      }));

      setNotification({
        type: 'success',
        message: `Consultation ${booking.referenceId} confirmed! Automated confirmation email dispatched to ${recipient} via Firebase Cloud Functions.`
      });
      setTimeout(() => setNotification(null), 6000);
    } catch (err) {
      setNotification({
        type: 'error',
        message: 'Could not confirm appointment. Please verify connection and try again.'
      });
    } finally {
      setIsConfirmingId(null);
    }
  };

  // Handle re-dispatching email notification
  const handleResendNotification = async (booking: Appointment) => {
    setIsResendingId(booking.id);
    try {
      const res = await dispatchAppointmentStatusNotification(
        booking,
        booking.status === 'Cancelled' ? 'Cancelled' : 'Confirmed',
        booking.cancellationReason
      );

      setNotification({
        type: 'success',
        message: `Automated ${booking.status} email re-sent to ${res.notification.recipientEmail} (ID: ${res.notification.messageId})`
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      setNotification({
        type: 'error',
        message: 'Failed to re-send email notification.'
      });
    } finally {
      setIsResendingId(null);
    }
  };

  // Open Email Notification History
  const handleOpenNotifHistory = async () => {
    setShowNotifHistory(true);
    setIsLoadingHistory(true);
    try {
      const history = await fetchAppointmentNotifications(undefined, user?.email || undefined);
      setNotifHistory(history);
    } catch (err) {
      console.warn('Failed to load email notification history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Handle 24-hour reminder check scan (Scheduled Cloud Function trigger)
  const handleRunReminderScan = async () => {
    setIsScanningReminders(true);
    try {
      const res = await scanUpcomingAppointmentReminders(appointments, user?.uid);
      if (res.results && res.results.length > 0) {
        const sentIds = new Set(res.results.map((r: any) => r.referenceId));
        setAppointments(prev => prev.map(a => {
          if (sentIds.has(a.referenceId)) {
            return {
              ...a,
              reminderSent: true,
              lastReminderSentAt: new Date().toISOString()
            };
          }
          return a;
        }));
        setNotification({
          type: 'success',
          message: `Scheduled Cloud Function: Sent ${res.remindersSent} automated 24-hour reminder email(s) for upcoming consultation dockets!`
        });
      } else {
        setNotification({
          type: 'info',
          message: `Scheduled Cloud Function: Evaluated ${res.scannedCount} consultations. No pending 24-hour reminders needed right now.`
        });
      }
      setTimeout(() => setNotification(null), 6000);
    } catch (err) {
      setNotification({
        type: 'error',
        message: 'Could not complete 24-hour appointment reminder check.'
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsScanningReminders(false);
    }
  };

  // Re-seed demo appointments
  const handleLoadSampleData = () => {
    if (!user) return;
    const seed = createSeedAppointments({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || authUser?.displayName
    });
    setAppointments(seed);
    try {
      localStorage.setItem(`accounticca_appointments_${user.uid}`, JSON.stringify(seed));
    } catch {
      // ignore
    }
    setNotification({
      type: 'success',
      message: 'Demo consultation appointments restored for status tracking review.'
    });
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 animate-fade-in ${
          notification.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : notification.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
        }`}>
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
            {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {notification.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
            {notification.type === 'info' && <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />}
            <span>{notification.message}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setNotification(null)}
            className="text-xs font-bold underline opacity-70 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Banner / Metrics Overview */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Calendar className="w-4 h-4" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                My Booked Consultations
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Track status lifecycle, chamber slot allocations, Google Meet sessions, and official entry credentials.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/contact#appointment"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Book New Consultation</span>
            </Link>
            <button
              type="button"
              onClick={handleOpenNotifHistory}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-800 font-semibold text-xs transition-colors cursor-pointer"
              title="View Automated Email Notifications History"
            >
              <Mail className="w-3.5 h-3.5 text-emerald-600" />
              <span>Email Logs</span>
            </button>
            <button
              type="button"
              onClick={handleRunReminderScan}
              disabled={isScanningReminders}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-blue-200 bg-blue-50/80 hover:bg-blue-100 text-blue-900 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Execute Scheduled Cloud Function 24h Reminder Scan"
            >
              <Bell className={`w-3.5 h-3.5 text-blue-600 ${isScanningReminders ? 'animate-bounce' : ''}`} />
              <span>{isScanningReminders ? 'Checking...' : 'Check 24h Reminders'}</span>
            </button>
            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh appointment list"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Status Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-5">
          <button
            type="button"
            onClick={() => setSelectedStatus('All')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              selectedStatus === 'All'
                ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70 text-slate-700'
            }`}
          >
            <div className="text-[11px] font-semibold opacity-80 uppercase tracking-wider">Total Consultations</div>
            <div className="text-2xl font-black mt-1">{counts.all}</div>
            <div className="text-[11px] mt-0.5 opacity-70">All recorded bookings</div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus('Confirmed')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              selectedStatus === 'Confirmed'
                ? 'bg-emerald-700 border-emerald-700 text-white shadow-sm'
                : 'bg-emerald-50/60 border-emerald-200/80 hover:bg-emerald-100/60 text-emerald-950'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Confirmed</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <div className="text-2xl font-black mt-1 text-emerald-800" style={{ color: selectedStatus === 'Confirmed' ? '#ffffff' : undefined }}>
              {counts.confirmed}
            </div>
            <div className="text-[11px] mt-0.5 opacity-80 text-emerald-700" style={{ color: selectedStatus === 'Confirmed' ? '#ffffff' : undefined }}>
              Active &amp; Chamber Ready
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus('Pending')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              selectedStatus === 'Pending'
                ? 'bg-amber-600 border-amber-600 text-white shadow-sm'
                : 'bg-amber-50/60 border-amber-200/80 hover:bg-amber-100/60 text-amber-950'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Pending</span>
              <Clock className="w-3 h-3 text-amber-600" />
            </div>
            <div className="text-2xl font-black mt-1 text-amber-800" style={{ color: selectedStatus === 'Pending' ? '#ffffff' : undefined }}>
              {counts.pending}
            </div>
            <div className="text-[11px] mt-0.5 opacity-80 text-amber-700" style={{ color: selectedStatus === 'Pending' ? '#ffffff' : undefined }}>
              Under Chamber Review
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus('Cancelled')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              selectedStatus === 'Cancelled'
                ? 'bg-rose-700 border-rose-700 text-white shadow-sm'
                : 'bg-rose-50/60 border-rose-200/80 hover:bg-rose-100/60 text-rose-950'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Cancelled</span>
              <XCircle className="w-3 h-3 text-rose-500" />
            </div>
            <div className="text-2xl font-black mt-1 text-rose-800" style={{ color: selectedStatus === 'Cancelled' ? '#ffffff' : undefined }}>
              {counts.cancelled}
            </div>
            <div className="text-[11px] mt-0.5 opacity-80 text-rose-700" style={{ color: selectedStatus === 'Cancelled' ? '#ffffff' : undefined }}>
              Withdrawn / Past
            </div>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by reference ID, practice area, or keywords..."
            className="w-full pl-9.5 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
          <span className="text-xs text-slate-500 font-medium pl-1">Mode:</span>
          <div className="flex items-center p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setSelectedMode('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                selectedMode === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setSelectedMode('virtual')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                selectedMode === 'virtual' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Video className="w-3 h-3 text-emerald-600" />
              <span>Virtual</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedMode('in_person')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                selectedMode === 'in_person' ? 'bg-white text-blue-800 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-3 h-3 text-blue-600" />
              <span>Chamber</span>
            </button>
          </div>
        </div>
      </div>

      {/* Appointment Cards List */}
      {isLoading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/90 space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-sm text-slate-600 font-medium">Synchronizing booked appointments from chamber registry...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-slate-200/90 shadow-xs space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Calendar className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-slate-900">
              {searchQuery || selectedStatus !== 'All' || selectedMode !== 'all' 
                ? 'No Consultations Found' 
                : 'No Booked Appointments Yet'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              {searchQuery || selectedStatus !== 'All' || selectedMode !== 'all'
                ? 'No consultations match your current filter criteria. Try resetting your search filters or status selector.'
                : 'You have not scheduled any legal or tax advisory consultations yet. Book a session with our Chartered Accountants and High Court Advocates.'}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {searchQuery || selectedStatus !== 'All' || selectedMode !== 'all' ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedStatus('All');
                  setSelectedMode('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            ) : (
              <>
                <Link
                  to="/contact#appointment"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book Consultation Now</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLoadSampleData}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Load Sample Consultations</span>
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((booking) => {
            const isConfirmed = booking.status === 'Confirmed';
            const isPending = booking.status === 'Pending';
            const isCancelled = booking.status === 'Cancelled';

            return (
              <div
                key={booking.id || booking.referenceId}
                className={`bg-white rounded-3xl p-6 sm:p-7 border transition-all duration-200 shadow-2xs hover:shadow-xs ${
                  isConfirmed 
                    ? 'border-emerald-200/90 hover:border-emerald-300' 
                    : isPending
                      ? 'border-amber-200/90 hover:border-amber-300'
                      : 'border-slate-200/90 bg-slate-50/40 opacity-90'
                }`}
              >
                {/* Header row: Reference ID, Status Badge, Division */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Reference ID Pill */}
                    <button
                      type="button"
                      onClick={() => handleCopyRef(booking.referenceId)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-mono font-bold transition-colors cursor-pointer"
                      title="Click to copy Reference ID"
                    >
                      <span>{booking.referenceId}</span>
                      {copiedId === booking.referenceId ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400" />
                      )}
                    </button>

                    {/* Division Tag */}
                    <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      {booking.division || 'Accounticca Advisory'}
                    </span>

                    {/* Mode Tag */}
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      booking.mode === 'virtual'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200/70'
                        : 'bg-indigo-50 text-indigo-800 border border-indigo-200/70'
                    }`}>
                      {booking.mode === 'virtual' ? (
                        <>
                          <Video className="w-3 h-3 text-blue-600" />
                          <span>Virtual (Google Meet)</span>
                        </>
                      ) : (
                        <>
                          <Building2 className="w-3 h-3 text-indigo-600" />
                          <span>In-Person Chamber</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-2">
                    {isConfirmed && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Confirmed</span>
                      </span>
                    )}

                    {isPending && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/90 shadow-2xs">
                        <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" style={{ animationDuration: '4s' }} />
                        <span>Pending Chamber Review</span>
                      </span>
                    )}

                    {isCancelled && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200/90 shadow-2xs">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Cancelled</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Body */}
                <div className="py-4 space-y-4">
                  {/* Practice Area Title & Agenda */}
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                      {booking.practiceArea}
                    </h3>
                    {booking.expertiseArea && (
                      <div className="mt-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/80">
                          <span>Focus:</span>
                          <span className="font-bold">{booking.expertiseArea}</span>
                        </span>
                      </div>
                    )}
                    {booking.notes && (
                      <p className="text-xs sm:text-sm text-slate-600 mt-1.5 line-clamp-2 leading-relaxed bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                        <span className="font-semibold text-slate-700">Agenda / Notes: </span>
                        {booking.notes}
                      </p>
                    )}
                  </div>

                  {/* Date & Time Slot Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {/* Date */}
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white text-emerald-700 flex items-center justify-center border border-slate-200/80 shadow-2xs shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scheduled Date</div>
                        <div className="text-xs sm:text-sm font-bold text-slate-900">
                          {booking.date ? new Date(booking.date + 'T00:00:00').toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : 'Date TBA'}
                        </div>
                      </div>
                    </div>

                    {/* Time */}
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white text-amber-700 flex items-center justify-center border border-slate-200/80 shadow-2xs shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time Slot (BST)</div>
                        <div className="text-xs sm:text-sm font-bold text-slate-900">
                          {booking.timeSlot}
                        </div>
                      </div>
                    </div>

                    {/* Format / Venue */}
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3 sm:col-span-2 md:col-span-1">
                      <div className="w-9 h-9 rounded-xl bg-white text-blue-700 flex items-center justify-center border border-slate-200/80 shadow-2xs shrink-0">
                        {booking.mode === 'virtual' ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {booking.mode === 'virtual' ? 'Conference Platform' : 'Physical Chamber'}
                        </div>
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {booking.mode === 'virtual' 
                            ? 'Google Meet Video' 
                            : 'BTI Centara Grand, Dhaka'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mode specific alert box */}
                  {isConfirmed && booking.mode === 'virtual' && (
                    <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <Video className="w-4 h-4 text-blue-600 shrink-0" />
                        <div className="text-xs text-blue-900 leading-snug">
                          <span className="font-bold">Google Meet Link Ready: </span>
                          Session room activates 10 minutes prior to scheduled BST slot.
                        </div>
                      </div>
                      <a
                        href={booking.meetingLink || 'https://meet.google.com/qmv-trcx-vny'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all shrink-0 cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Join Meeting</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                    </div>
                  )}

                  {isConfirmed && booking.mode === 'in_person' && (
                    <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <Building2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-indigo-950 leading-snug">
                          <span className="font-bold">Chamber Location: </span>
                          {CHAMBER_ADDRESS}.
                          <span className="block text-[11px] text-indigo-700 mt-0.5">Reception Desk Direct: {CHAMBER_HOTLINE}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPrintApp(booking)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all shrink-0 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Entry Chamber Pass</span>
                      </button>
                    </div>
                  )}

                  {isPending && (
                    <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Chamber Partner Assignment in Progress: </span>
                        Our Practice Lead is verifying partner availability for {booking.practiceArea}. You will receive SMS &amp; email confirmation prior to the selected time.
                      </div>
                    </div>
                  )}

                  {isCancelled && (
                    <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 flex items-start gap-3 text-xs text-rose-900">
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Consultation Cancelled: </span>
                        {booking.cancellationReason || 'Withdrawn by client.'}
                        {booking.cancelledAt && (
                          <span className="block text-[11px] text-rose-700 mt-0.5">
                            Cancelled on {new Date(booking.cancelledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Automated Email Notification Status Strip */}
                  <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    isConfirmed 
                      ? 'bg-emerald-50/90 border-emerald-200/90 text-emerald-950'
                      : isCancelled
                        ? 'bg-rose-50/90 border-rose-200/90 text-rose-950'
                        : 'bg-amber-50/80 border-amber-200/80 text-amber-950'
                  }`}>
                    <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                        isConfirmed 
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-300' 
                          : isCancelled 
                            ? 'bg-rose-100 text-rose-700 border-rose-300' 
                            : 'bg-amber-100 text-amber-700 border-amber-300'
                      }`}>
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold flex items-center gap-1.5 flex-wrap">
                          <span>
                            {isConfirmed 
                              ? 'Automated Confirmation Email Dispatched' 
                              : isCancelled 
                                ? 'Automated Cancellation Email Dispatched' 
                                : 'Automated Email Notification Standby'}
                          </span>
                          {(isConfirmed || isCancelled) && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/80 border border-slate-200 text-slate-700 shadow-2xs">
                              Cloud Functions Triggered
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] opacity-85 truncate mt-0.5">
                          {isConfirmed || isCancelled ? (
                            <>Delivered to <strong className="font-semibold">{booking.email || user?.email || 'client address'}</strong> with docket details &amp; coordinates</>
                          ) : (
                            <>Sends instant official confirmation email upon partner chamber assignment</>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
                      {(isConfirmed || isCancelled) && (
                        <>
                          <button
                            type="button"
                            onClick={() => setPreviewEmailApp(booking)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-600" />
                            <span>View Sent Email</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResendNotification(booking)}
                            disabled={isResendingId === booking.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
                            title="Resend email notification"
                          >
                            <Send className="w-3 h-3 text-slate-500" />
                            <span className="hidden sm:inline">{isResendingId === booking.id ? 'Sending...' : 'Resend'}</span>
                          </button>
                        </>
                      )}

                      {isPending && (
                        <button
                          type="button"
                          onClick={() => handleConfirmAppointment(booking)}
                          disabled={isConfirmingId === booking.id}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                          title="Simulate Partner Approval to trigger automated confirmation email"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isConfirmingId === booking.id ? 'Confirming...' : 'Approve & Send Email'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 24-Hour Scheduled Courtesy Reminder Strip */}
                  {isConfirmed && isAppointmentWithin24Hours(booking) && (
                    <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
                      booking.reminderSent
                        ? 'bg-blue-50/90 border-blue-200 text-blue-950'
                        : 'bg-indigo-50/70 border-indigo-200 text-indigo-950'
                    }`}>
                      <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                          booking.reminderSent
                            ? 'bg-blue-100 text-blue-700 border-blue-300'
                            : 'bg-indigo-100 text-indigo-700 border-indigo-300'
                        }`}>
                          <Bell className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold flex items-center gap-1.5 flex-wrap">
                            <span>
                              {booking.reminderSent
                                ? 'Automated 24h Courtesy Reminder Dispatched'
                                : 'Scheduled Tomorrow (Within 24 Hours)'}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shadow-2xs ${
                              booking.reminderSent
                                ? 'bg-blue-100 text-blue-800 border-blue-300'
                                : 'bg-indigo-100 text-indigo-800 border-indigo-300'
                            }`}>
                              {booking.reminderSent ? 'Scheduled Cloud Function Delivered' : 'Hourly Scheduled Cloud Function'}
                            </span>
                          </div>
                          <div className="text-[11px] opacity-85 truncate mt-0.5">
                            {booking.reminderSent ? (
                              <>Dispatched automated reminder to <strong className="font-semibold">{booking.email || user?.email}</strong> with docket coordinates &amp; room access</>
                            ) : (
                              <>Scheduled Firebase Cloud Function periodically scans and sends courtesy reminder</>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => setPreviewReminderApp(booking)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-blue-900 font-bold text-xs rounded-xl border border-blue-200 shadow-2xs transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          <span>View 24h Reminder Email</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Stepper Lifecycle */}
                  <div className="pt-2">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Consultation Progress Lifecycle
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {/* Step 1 */}
                      <div className="space-y-1">
                        <div className="h-1.5 rounded-full bg-emerald-500"></div>
                        <div className="text-[10px] font-bold text-slate-800">1. Booked</div>
                        <div className="text-[9px] text-slate-400">Request Logged</div>
                      </div>

                      {/* Step 2 */}
                      <div className="space-y-1">
                        <div className={`h-1.5 rounded-full ${
                          isCancelled ? 'bg-rose-400' : isConfirmed ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'
                        }`}></div>
                        <div className={`text-[10px] font-bold ${isCancelled ? 'text-rose-700' : 'text-slate-800'}`}>
                          {isCancelled ? 'Cancelled' : isConfirmed ? '2. Confirmed' : '2. Reviewing'}
                        </div>
                        <div className="text-[9px] text-slate-400">
                          {isCancelled ? 'Slot Released' : isConfirmed ? 'Partner Assigned' : 'Chamber Check'}
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="space-y-1">
                        <div className={`h-1.5 rounded-full ${
                          isCancelled ? 'bg-slate-200' : isConfirmed ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}></div>
                        <div className="text-[10px] font-bold text-slate-800">3. Advisory</div>
                        <div className="text-[9px] text-slate-400">Session Conducted</div>
                      </div>

                      {/* Step 4 */}
                      <div className="space-y-1">
                        <div className="h-1.5 rounded-full bg-slate-200"></div>
                        <div className="text-[10px] font-bold text-slate-400">4. Follow-up</div>
                        <div className="text-[9px] text-slate-400">Formal Memorandum</div>
                      </div>
                    </div>
                  </div>

                  {/* Post-appointment rating & feedback component */}
                  <div className="pt-1">
                    <AppointmentRatingCard
                      booking={booking}
                      onOpenRatingModal={(b) => setRatingApp(b)}
                    />
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Add to Google Calendar */}
                    {!isCancelled && (
                      <a
                        href={getGoogleCalendarUrl(booking)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
                        title="Add to Google Calendar"
                      >
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Google Calendar</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    )}

                    {/* Download .ics file */}
                    {!isCancelled && (
                      <button
                        type="button"
                        onClick={() => downloadIcsFile(booking)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                        title="Download .ics calendar invitation"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                        <span>Download .ics</span>
                      </button>
                    )}

                    {/* Print Booking Slip */}
                    <button
                      type="button"
                      onClick={() => setPrintApp(booking)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
                      title="Print Official Booking Slip"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                      <span>Print Slip</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Post-appointment rate experience button if past */}
                    {isAppointmentPast(booking) && !isCancelled && (
                      <button
                        type="button"
                        onClick={() => setRatingApp(booking)}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer ${
                          booking.rating 
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300' 
                            : 'bg-amber-600 hover:bg-amber-700 text-white'
                        }`}
                        title={booking.rating ? 'Update consultation review' : 'Rate this completed consultation'}
                      >
                        <Star className={`w-3.5 h-3.5 ${booking.rating ? 'fill-amber-500 text-amber-500' : 'fill-white text-white'}`} />
                        <span>{booking.rating ? `Rated ★ ${booking.rating.rating}.0` : 'Rate Experience'}</span>
                      </button>
                    )}

                    {/* Cancel button if not already cancelled */}
                    {!isCancelled ? (
                      <button
                        type="button"
                        onClick={() => setCancellingApp(booking)}
                        className="inline-flex items-center gap-1 px-3 py-2 text-rose-700 hover:bg-rose-50 font-semibold text-xs rounded-xl border border-rose-200/60 transition-colors cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-500" />
                        <span>Cancel Consultation</span>
                      </button>
                    ) : (
                      <Link
                        to="/contact#appointment"
                        className="inline-flex items-center gap-1 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Reschedule / Rebook</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancellingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-start justify-between gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button
                type="button"
                onClick={() => setCancellingApp(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">
                Cancel Consultation {cancellingApp.referenceId}?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Are you sure you want to cancel your consultation for <span className="font-semibold text-slate-900">{cancellingApp.practiceArea}</span> scheduled on <span className="font-semibold text-slate-900">{cancellingApp.date}</span> at <span className="font-semibold text-slate-900">{cancellingApp.timeSlot}</span>?
              </p>
            </div>

            {/* Reason selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Please provide a cancellation reason:
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              >
                <option value="Schedule conflict / need rescheduling">Schedule conflict / need rescheduling</option>
                <option value="Matter resolved internally">Matter resolved internally</option>
                <option value="Selected another consultation date">Selected another consultation date</option>
                <option value="Chamber physical travel not feasible">Chamber physical travel not feasible</option>
                <option value="Other administrative reasons">Other administrative reasons</option>
              </select>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 leading-normal">
              You can always book another consultation at any time via the Contact page or directly with our chamber reception at {CHAMBER_HOTLINE}.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancellingApp(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Keep Appointment
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isSubmittingCancel}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingCancel ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Booking Slip / Chamber Entry Pass Modal */}
      {printApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6 my-8">
            {/* Header with Print & Close */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-bold text-slate-900">Official Consultation Pass &amp; Docket</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintApp(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Pass Body */}
            <div id="printable-consultation-pass" className="border-2 border-slate-900 rounded-2xl p-6 bg-white space-y-5 text-slate-900">
              {/* Firm Header */}
              <div className="text-center border-b border-slate-200 pb-4 space-y-1">
                <div className="text-xs font-black tracking-widest uppercase text-emerald-700">
                  Accounticca Advisory &amp; E-Lawyers Chambers
                </div>
                <div className="text-lg font-black text-slate-900">
                  CONSULTATION RESERVATION DOCKET
                </div>
                <div className="text-[11px] text-slate-500">
                  Dhaka Commercial Bench &amp; Statutory Tax Practice
                </div>
              </div>

              {/* Reference ID & Status */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold">Reference ID: </span>
                  <span className="font-mono font-bold text-slate-900">{printApp.referenceId}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Status: </span>
                  <span className={`font-bold uppercase ${
                    printApp.status === 'Confirmed' ? 'text-emerald-700' : printApp.status === 'Pending' ? 'text-amber-700' : 'text-rose-700'
                  }`}>
                    {printApp.status}
                  </span>
                </div>
              </div>

              {/* Consultation Details */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-slate-400 font-bold uppercase text-[10px]">Client / Organization</div>
                  <div className="font-bold text-slate-900 mt-0.5">{printApp.clientName}</div>
                  <div className="text-slate-600 text-[11px]">{printApp.companyName || 'Corporate Individual'}</div>
                </div>

                <div>
                  <div className="text-slate-400 font-bold uppercase text-[10px]">Practice Division</div>
                  <div className="font-bold text-slate-900 mt-0.5">{printApp.practiceArea}</div>
                  <div className="text-slate-600 text-[11px]">{printApp.division || 'Accounticca Advisory'}</div>
                </div>

                <div>
                  <div className="text-slate-400 font-bold uppercase text-[10px]">Date &amp; Time (BST)</div>
                  <div className="font-bold text-slate-900 mt-0.5">{printApp.date}</div>
                  <div className="text-slate-600 text-[11px]">{printApp.timeSlot}</div>
                </div>

                <div>
                  <div className="text-slate-400 font-bold uppercase text-[10px]">Consultation Mode</div>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {printApp.mode === 'virtual' ? 'Virtual (Google Meet)' : 'In-Person Chamber'}
                  </div>
                  <div className="text-slate-600 text-[11px]">
                    {printApp.mode === 'virtual' ? 'Secure Encrypted Video' : 'Panthapath Chamber'}
                  </div>
                </div>
              </div>

              {/* Venue or Virtual Link */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-800">
                  {printApp.mode === 'virtual' ? 'Video Meeting Protocol:' : 'Chamber Venue & Security Protocol:'}
                </div>
                <div className="text-slate-600 text-[11px] leading-relaxed">
                  {printApp.mode === 'virtual' 
                    ? 'Session URL: ' + (printApp.meetingLink || 'https://meet.google.com/qmv-trcx-vny') + '. Please ensure webcam & audio clearance 5 minutes prior to session.'
                    : CHAMBER_ADDRESS + '. Present this slip at Ground Floor security desk for clearance to Suite G-5.'}
                </div>
                <div className="text-[10px] text-slate-500 font-mono pt-1">
                  Chamber Helpline: {CHAMBER_HOTLINE}
                </div>
              </div>

              {/* Footer Stamp note */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                <span>Verified System Record</span>
                <span>Accounticca × E-Lawyers BD</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setPrintApp(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Automated Email Preview / Delivery Receipt Modal */}
      {previewEmailApp && (() => {
        const emailContent = generateAppointmentEmailHtml({
          referenceId: previewEmailApp.referenceId,
          clientName: previewEmailApp.clientName || 'Valued Client',
          email: previewEmailApp.email || user?.email || 'client@accounticca.com',
          phone: previewEmailApp.phone,
          companyName: previewEmailApp.companyName,
          practiceArea: previewEmailApp.practiceArea,
          mode: previewEmailApp.mode,
          date: previewEmailApp.date,
          timeSlot: previewEmailApp.timeSlot,
          status: previewEmailApp.status === 'Cancelled' ? 'Cancelled' : 'Confirmed',
          cancellationReason: previewEmailApp.cancellationReason,
          meetingLink: previewEmailApp.meetingLink
        });

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
            <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl space-y-4 my-6 overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">Automated Email Notification Receipt</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Delivered
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Triggered by Firebase Cloud Functions (<code className="text-emerald-300">onAppointmentStatusUpdated</code>)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewEmailApp(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Envelope Metadata Card */}
              <div className="px-5 sm:px-6">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">To:</span>
                    <span className="font-bold text-slate-900 truncate">
                      {previewEmailApp.email || user?.email || 'client@accounticca.com'} ({previewEmailApp.clientName})
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">From:</span>
                    <span className="font-semibold text-slate-800">
                      ELA &amp; Associates Legal Chambers &lt;appointments@accounticca.com&gt;
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Subject:</span>
                    <span className="font-bold text-slate-900 break-all">{emailContent.subject}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
                    <span>Docket Reference: <strong className="font-mono text-slate-800">{previewEmailApp.referenceId}</strong></span>
                    <span>Status Trigger: <strong className={previewEmailApp.status === 'Confirmed' ? 'text-emerald-700' : 'text-rose-700'}>{previewEmailApp.status}</strong></span>
                    <span>Engine: <strong className="text-slate-800">Cloud Functions / SMTP Hub</strong></span>
                  </div>
                </div>
              </div>

              {/* Email Rendered Preview Area */}
              <div className="px-5 sm:px-6 flex-1 overflow-y-auto">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Rendered Email Preview (Client Viewport)
                </div>
                <div 
                  className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-2xs p-2 sm:p-4 max-h-[380px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: emailContent.html }}
                />
              </div>

              {/* Footer Controls */}
              <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(emailContent.text);
                      setNotification({ type: 'success', message: 'Plain text email body copied to clipboard!' });
                      setTimeout(() => setNotification(null), 3000);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Text</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(emailContent.html);
                      setNotification({ type: 'success', message: 'HTML email source copied to clipboard!' });
                      setTimeout(() => setNotification(null), 3000);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy HTML</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewEmailApp(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
                >
                  Close Receipt
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 24-Hour Courtesy Reminder Email Preview Modal */}
      {previewReminderApp && (() => {
        const reminderContent = generateAppointmentReminderEmailHtml({
          referenceId: previewReminderApp.referenceId,
          clientName: previewReminderApp.clientName || 'Valued Client',
          email: previewReminderApp.email || user?.email || 'client@accounticca.com',
          phone: previewReminderApp.phone,
          companyName: previewReminderApp.companyName,
          practiceArea: previewReminderApp.practiceArea,
          mode: previewReminderApp.mode,
          date: previewReminderApp.date,
          timeSlot: previewReminderApp.timeSlot,
          status: 'Confirmed',
          meetingLink: previewReminderApp.meetingLink
        });

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
            <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl space-y-4 my-6 overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">24-Hour Courtesy Reminder Receipt</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        Scheduled Reminder
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Scheduled Firebase Cloud Function (<code className="text-blue-300">checkUpcomingAppointmentReminders</code>)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewReminderApp(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Envelope Metadata Card */}
              <div className="px-5 sm:px-6">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">To:</span>
                    <span className="font-bold text-slate-900 truncate">
                      {previewReminderApp.email || user?.email || 'client@accounticca.com'} ({previewReminderApp.clientName})
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">From:</span>
                    <span className="font-semibold text-slate-800">
                      ELA &amp; Associates Legal Chambers &lt;appointments@accounticca.com&gt;
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Subject:</span>
                    <span className="font-bold text-slate-900 break-all">{reminderContent.subject}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
                    <span>Docket Reference: <strong className="font-mono text-slate-800">{previewReminderApp.referenceId}</strong></span>
                    <span>Trigger: <strong className="text-blue-700">Scheduled 24h Cron Check</strong></span>
                    <span>Engine: <strong className="text-slate-800">Firebase Cloud Functions PubSub</strong></span>
                  </div>
                </div>
              </div>

              {/* Rendered Preview Area */}
              <div className="px-5 sm:px-6 flex-1 overflow-y-auto">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Rendered Email Preview (Client Viewport)
                </div>
                <div 
                  className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-2xs p-2 sm:p-4 max-h-[380px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: reminderContent.html }}
                />
              </div>

              {/* Footer Controls */}
              <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(reminderContent.text);
                      setNotification({ type: 'success', message: 'Reminder plain text copied to clipboard!' });
                      setTimeout(() => setNotification(null), 3000);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Text</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(reminderContent.html);
                      setNotification({ type: 'success', message: 'Reminder HTML source copied to clipboard!' });
                      setTimeout(() => setNotification(null), 3000);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy HTML</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewReminderApp(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
                >
                  Close Receipt
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Email Notifications History Modal */}
      {showNotifHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl space-y-4 my-6 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                  <Inbox className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Automated Email Notifications Audit Log</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Firebase Cloud Functions &amp; Chamber Mailer Dispatch History
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await handleRunReminderScan();
                    const history = await fetchAppointmentNotifications(undefined, user?.email || undefined);
                    setNotifHistory(history);
                  }}
                  disabled={isScanningReminders}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-400/80 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                  title="Run Scheduled Cloud Function 24h reminder scan"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>{isScanningReminders ? 'Scanning...' : 'Scan 24h Reminders'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowNotifHistory(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-3">
              {isLoadingHistory ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
                  <p className="text-xs font-semibold">Querying notification dispatch audit records...</p>
                </div>
              ) : notifHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-3 bg-slate-50 rounded-2xl border border-slate-200/80 p-6">
                  <div className="w-12 h-12 rounded-2xl bg-white text-slate-400 flex items-center justify-center mx-auto shadow-2xs border border-slate-200">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">No Email Notifications Dispatched Yet</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Whenever an appointment is updated or scheduled within 24 hours, Firebase Cloud Functions immediately sends an email and logs the delivery receipt here.
                    </p>
                  </div>
                </div>
              ) : (
                notifHistory.map((item, idx) => (
                  <div 
                    key={item.id || item.messageId || idx}
                    className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          item.status === 'Reminder_24h'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : item.status === 'Confirmed' 
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                          {item.status === 'Reminder_24h' ? '24h Reminder' : item.status}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-900">
                          #{item.referenceId}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {new Date(item.sentAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-800">
                      {item.subject}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>Recipient: <strong className="text-slate-700">{item.recipientEmail}</strong></span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 font-mono text-slate-600">
                          {item.messageId?.substring(0, 16)}...
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowNotifHistory(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post-Appointment Rating & Feedback Modal */}
      {ratingApp && user && (
        <AppointmentRatingModal
          booking={ratingApp}
          userId={user.uid}
          onClose={() => setRatingApp(null)}
          onRatingSubmitted={(updated) => {
            setAppointments(prev => prev.map(a => 
              (a.referenceId === updated.referenceId || a.id === updated.id ? updated : a)
            ));
            setNotification({
              type: 'success',
              message: `Thank you! Your consultation feedback and rating for #${updated.referenceId} has been successfully recorded.`
            });
            setTimeout(() => setNotification(null), 6000);
          }}
        />
      )}
    </div>
  );
}
