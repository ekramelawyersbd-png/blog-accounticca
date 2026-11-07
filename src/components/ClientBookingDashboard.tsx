import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Copy,
  Check,
  Search,
  RefreshCw,
  Video,
  Building2,
  ExternalLink,
  Download,
  Bell,
  Mail,
  ShieldCheck,
  Trash2,
  ArrowRight,
  CalendarCheck,
  Sparkles,
  UserCheck,
  FileText,
  Info,
  X,
  Plus,
} from 'lucide-react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { getAccessToken } from '../services/workspaceAuth';
import { workspaceCalendarApi } from '../services/workspaceService';
import {
  Appointment,
  fetchUserAppointments,
  updateAppointmentStatus,
  getGoogleCalendarUrl,
  downloadIcsFile,
  isAppointmentPast,
} from '../services/appointmentService';

function parseAppointmentStartTime(dateStr: string, timeSlot: string): Date | null {
  if (!dateStr || !timeSlot) return null;
  const dateMatch = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) return null;
  const [, yearStr, monthStr, dayStr] = dateMatch;
  const timeMatch = timeSlot.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  let hours = 10;
  let minutes = 0;
  if (timeMatch) {
    hours = parseInt(timeMatch[1], 10);
    minutes = parseInt(timeMatch[2], 10);
    const period = timeMatch[3].toUpperCase();
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  const isoBst = `${yearStr}-${monthStr}-${dayStr}T${pad(hours)}:${pad(minutes)}:00+06:00`;
  const parsed = new Date(isoBst);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export interface ClientBookingDashboardProps {
  /** Optional counter or key to force refresh when a new booking is created */
  refreshTrigger?: number | string;
  /** Optional callback to switch to the booking form or open new booking */
  onScheduleNew?: () => void;
  /** Compact mode when embedded inside another form */
  compact?: boolean;
  /** Custom heading title */
  title?: string;
  /** Custom subtitle */
  subtitle?: string;
}

interface ExtendedAppointment extends Appointment {
  calendarEventId?: string;
  calendarSynced?: boolean;
  reminder3hSent?: boolean;
  reminder3hSentAt?: string;
  confirmationEmailSent?: boolean;
  cancellationReason?: string;
  cancelledAt?: string;
}

type StatusFilter = 'upcoming' | 'all' | 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';

const CANCELLATION_REASONS = [
  'Schedule conflict — need to reschedule for another date',
  'Matter resolved internally or no longer requires review',
  'Switching consultation mode (Virtual vs. In-Person Chamber)',
  'Gathering additional statutory / tax documents before meeting',
  'Other reason (specify below)',
];

function normalizeStatus(rawStatus?: string): Appointment['status'] {
  if (!rawStatus) return 'Confirmed';
  const lower = rawStatus.toLowerCase();
  if (lower === 'cancelled' || lower === 'canceled') return 'Cancelled';
  if (lower === 'completed') return 'Completed';
  if (lower === 'pending') return 'Pending';
  return 'Confirmed';
}

function getTimeStatusInfo(dateStr: string, timeSlot: string, status: Appointment['status']) {
  if (status === 'Cancelled') {
    return {
      label: 'Booking Cancelled',
      tone: 'bg-rose-50 text-rose-700 border-rose-200',
      hoursRemaining: null as number | null,
      isUpcoming: false,
    };
  }
  if (status === 'Completed') {
    return {
      label: 'Session Completed',
      tone: 'bg-blue-50 text-blue-700 border-blue-200',
      hoursRemaining: null as number | null,
      isUpcoming: false,
    };
  }

  const parsedStart = parseAppointmentStartTime(dateStr, timeSlot);
  if (!parsedStart) {
    const past = isAppointmentPast({ date: dateStr, timeSlot } as Appointment);
    return {
      label: past ? 'Past Slot' : 'Scheduled',
      tone: past
        ? 'bg-slate-100 text-slate-600 border-slate-200'
        : 'bg-emerald-50 text-emerald-800 border-emerald-200',
      hoursRemaining: null as number | null,
      isUpcoming: !past,
    };
  }

  const diffMs = parsedStart.getTime() - Date.now();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < -1) {
    return {
      label: 'Past Consultation Slot',
      tone: 'bg-slate-100 text-slate-600 border-slate-200',
      hoursRemaining: diffHours,
      isUpcoming: false,
    };
  }

  if (diffHours >= -1 && diffHours <= 0) {
    return {
      label: 'In Progress Now',
      tone: 'bg-emerald-600 text-white border-emerald-700 animate-pulse',
      hoursRemaining: 0,
      isUpcoming: true,
    };
  }

  if (diffHours <= 3) {
    const mins = Math.max(1, Math.round(diffHours * 60));
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    const formatted = hrs > 0 ? `${hrs}h ${remMins}m` : `${remMins}m`;
    return {
      label: `Starts in ${formatted} • 3h Reminder Window`,
      tone: 'bg-amber-50 text-amber-900 border-amber-300',
      hoursRemaining: diffHours,
      isUpcoming: true,
    };
  }

  if (diffHours <= 24) {
    return {
      label: `Starts in ${Math.round(diffHours)} hours`,
      tone: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      hoursRemaining: diffHours,
      isUpcoming: true,
    };
  }

  const days = Math.round(diffHours / 24);
  return {
    label: `Upcoming in ${days} ${days === 1 ? 'day' : 'days'}`,
    tone: 'bg-teal-50 text-teal-800 border-teal-200',
    hoursRemaining: diffHours,
    isUpcoming: true,
  };
}

export const ClientBookingDashboard: React.FC<ClientBookingDashboardProps> = ({
  refreshTrigger,
  onScheduleNew,
  compact = false,
  title = 'Client Booking Dashboard',
  subtitle = 'View your upcoming consultations, track real-time calendar & reminder status, or cancel bookings if needed.',
}) => {
  const { user } = useAuth();

  const [appointments, setAppointments] = useState<ExtendedAppointment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('upcoming');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lookupInput, setLookupInput] = useState<string>('');
  const [isLookingUp, setIsLookingUp] = useState<boolean>(false);
  const [lookupMessage, setLookupMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [toastBanner, setToastBanner] = useState<{
    type: 'success' | 'info' | 'warning';
    title: string;
    message: string;
  } | null>(null);

  // Cancellation modal state
  const [cancellingApt, setCancellingApt] = useState<ExtendedAppointment | null>(null);
  const [selectedCancelReason, setSelectedCancelReason] = useState<string>(CANCELLATION_REASONS[0]);
  const [customCancelNote, setCustomCancelNote] = useState<string>('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState<boolean>(false);

  // Action states per appointment (calendar sync / manual reminder trigger)
  const [syncingCalendarRef, setSyncingCalendarRef] = useState<string | null>(null);
  const [sendingReminderRef, setSendingReminderRef] = useState<string | null>(null);

  // Brevo SMTP Relay status & live test dispatch state
  const [brevoStatus, setBrevoStatus] = useState<{
    host: string;
    port: number;
    login?: string;
    senderName: string;
    senderEmail: string;
    fromHeader: string;
    configured: boolean;
    mode: string;
  } | null>(null);
  const [isSendingBrevoTest, setIsSendingBrevoTest] = useState<boolean>(false);
  const [lastBrevoPreviewUrl, setLastBrevoPreviewUrl] = useState<string | null>(null);

  const loadBrevoStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/email/brevo-status');
      if (res.ok) {
        const data = await res.json();
        setBrevoStatus(data);
      }
    } catch {
      // Non-blocking status check
    }
  }, []);

  useEffect(() => {
    void loadBrevoStatus();
  }, [loadBrevoStatus]);

  const handleDispatchBrevoTest = async () => {
    setIsSendingBrevoTest(true);
    setLastBrevoPreviewUrl(null);
    try {
      const targetEmail = user?.email || appointments[0]?.email || 'ekram@elawyersbd.com';
      const res = await fetch('/api/email/brevo-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail: targetEmail }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.previewUrl) {
          setLastBrevoPreviewUrl(data.previewUrl);
        }
        setToastBanner({
          type: 'success',
          title: 'Brevo SMTP Relay Dispatch Verified',
          message: `Dispatched via ${data.host || 'smtp-relay.brevo.com'}:${data.port || 587} from ${data.fromHeader || 'ACCOUNTICCA x E-Lawyers <ekram@elawyersbd.com>'} to ${data.recipient} (Message ID: ${data.messageId || 'OK'}).`,
        });
        void loadBrevoStatus();
      } else {
        setToastBanner({
          type: 'warning',
          title: 'Brevo SMTP Test Notice',
          message: data.error || 'Unable to complete test dispatch.',
        });
      }
    } catch {
      setToastBanner({
        type: 'warning',
        title: 'Brevo SMTP Connection Error',
        message: 'Could not reach /api/email/brevo-test endpoint.',
      });
    } finally {
      setIsSendingBrevoTest(false);
    }
  };

  const loadBookings = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);

      try {
        const mergedMap = new Map<string, ExtendedAppointment>();

        // 1. Read local device bookings (accounticca_booked_appointments)
        try {
          const rawDevice = localStorage.getItem('accounticca_booked_appointments');
          if (rawDevice) {
            const parsed: ExtendedAppointment[] = JSON.parse(rawDevice);
            if (Array.isArray(parsed)) {
              parsed.forEach((item) => {
                if (item && item.referenceId) {
                  mergedMap.set(item.referenceId, {
                    ...item,
                    id: item.id || item.referenceId,
                    status: normalizeStatus(item.status),
                  });
                }
              });
            }
          }
        } catch {
          // Ignore localStorage parse errors
        }

        // 2. If user is authenticated, fetch from appointmentService (which queries Firestore + user cache)
        if (user?.uid) {
          try {
            const userApts = await fetchUserAppointments(user.uid, user.email);
            userApts.forEach((apt) => {
              const existing = mergedMap.get(apt.referenceId);
              mergedMap.set(apt.referenceId, {
                ...existing,
                ...apt,
                status: normalizeStatus(apt.status),
              });
            });
          } catch (err) {
            console.warn('Error loading user appointments:', err);
          }
        }

        // 3. Enrich with live Firestore records for any referenceIds or user email
        const knownRefIds = Array.from(mergedMap.keys()).slice(0, 10);
        if (knownRefIds.length > 0) {
          try {
            const refQuery = query(
              collection(db, 'appointments'),
              where('referenceId', 'in', knownRefIds)
            );
            const snap = await getDocs(refQuery);
            snap.forEach((docSnap) => {
              const data = docSnap.data();
              const refId = data.referenceId || docSnap.id;
              const existing = mergedMap.get(refId);
              mergedMap.set(refId, {
                ...(existing || ({} as ExtendedAppointment)),
                id: docSnap.id,
                referenceId: refId,
                division: data.division || existing?.division || 'Accounticca Advisory',
                practiceArea: data.practiceArea || existing?.practiceArea || 'Corporate & Tax Advisory',
                expertiseArea: data.expertiseArea || existing?.expertiseArea,
                mode: data.mode || existing?.mode || 'virtual',
                date: data.date || existing?.date || '',
                timeSlot: data.timeSlot || existing?.timeSlot || '',
                clientName: data.clientName || existing?.clientName || 'Client',
                email: data.email || data.userEmail || existing?.email || '',
                phone: data.phone || existing?.phone || '',
                companyName: data.companyName || existing?.companyName,
                notes: data.notes || existing?.notes,
                status: normalizeStatus(data.status || existing?.status),
                createdAt:
                  typeof data.createdAt === 'string'
                    ? data.createdAt
                    : existing?.createdAt || new Date().toISOString(),
                assignedPartner: data.assignedPartner || existing?.assignedPartner,
                calendarEventId: data.calendarEventId ?? existing?.calendarEventId,
                calendarSynced: Boolean(data.calendarSynced || data.calendarEventId || existing?.calendarSynced),
                reminder3hSent: Boolean(data.reminder3hSent ?? existing?.reminder3hSent),
                reminder3hSentAt: data.reminder3hSentAt || existing?.reminder3hSentAt,
                confirmationEmailSent: data.confirmationEmailSent ?? existing?.confirmationEmailSent ?? true,
                cancellationReason: data.cancellationReason || existing?.cancellationReason,
                cancelledAt: data.cancelledAt || existing?.cancelledAt,
              });
            });
          } catch {
            // Firestore query may be restricted for unauthenticated guest sessions; local cache remains intact
          }
        }

        const list = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()
        );

        setAppointments(list);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user?.uid, user?.email]
  );

  useEffect(() => {
    void loadBookings();
  }, [loadBookings, refreshTrigger]);

  // Listen for custom booking update events across components
  useEffect(() => {
    const handleCustomUpdate = () => {
      void loadBookings(true);
    };
    window.addEventListener('accounticca:appointment-updated', handleCustomUpdate);
    return () => {
      window.removeEventListener('accounticca:appointment-updated', handleCustomUpdate);
    };
  }, [loadBookings]);

  // Lookup booking by Reference ID (APT-...) or Email address from Firestore
  const handleDocketLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = lookupInput.trim();
    if (!trimmed) return;

    setIsLookingUp(true);
    setLookupMessage(null);

    try {
      const isRefId = trimmed.toUpperCase().startsWith('APT-');
      const appointmentsRef = collection(db, 'appointments');
      const q = isRefId
        ? query(appointmentsRef, where('referenceId', '==', trimmed.toUpperCase()))
        : query(appointmentsRef, where('email', '==', trimmed.toLowerCase()));

      const snap = await getDocs(q);
      if (snap.empty) {
        setLookupMessage({
          type: 'info',
          text: isRefId
            ? `No booking found with Reference ID "${trimmed.toUpperCase()}".`
            : `No bookings found matching email "${trimmed}".`,
        });
      } else {
        const fetched: ExtendedAppointment[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          fetched.push({
            id: docSnap.id,
            referenceId: data.referenceId || docSnap.id,
            division: data.division || 'Accounticca Advisory',
            practiceArea: data.practiceArea || 'Corporate & Tax Consultation',
            expertiseArea: data.expertiseArea,
            mode: data.mode || 'virtual',
            date: data.date || '',
            timeSlot: data.timeSlot || '',
            clientName: data.clientName || 'Client',
            email: data.email || '',
            phone: data.phone || '',
            companyName: data.companyName,
            notes: data.notes,
            status: normalizeStatus(data.status),
            createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
            assignedPartner: data.assignedPartner,
            calendarEventId: data.calendarEventId,
            calendarSynced: Boolean(data.calendarSynced || data.calendarEventId),
            reminder3hSent: Boolean(data.reminder3hSent),
            reminder3hSentAt: data.reminder3hSentAt,
            confirmationEmailSent: data.confirmationEmailSent ?? true,
            cancellationReason: data.cancellationReason,
            cancelledAt: data.cancelledAt,
          });
        });

        setAppointments((prev) => {
          const map = new Map<string, ExtendedAppointment>();
          prev.forEach((item) => map.set(item.referenceId, item));
          fetched.forEach((item) => map.set(item.referenceId, item));
          const updated = Array.from(map.values()).sort(
            (a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()
          );
          try {
            localStorage.setItem('accounticca_booked_appointments', JSON.stringify(updated));
          } catch {
            // ignore
          }
          return updated;
        });

        setStatusFilter('all');
        setLookupMessage({
          type: 'success',
          text: `Loaded ${fetched.length} ${fetched.length === 1 ? 'booking' : 'bookings'} into your dashboard.`,
        });
        setLookupInput('');
      }
    } catch {
      setLookupMessage({
        type: 'error',
        text: 'Unable to query remote docket registry right now. Showing bookings saved on this device.',
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleCopyRef = (refId: string) => {
    navigator.clipboard.writeText(refId);
    setCopiedRef(refId);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  // Sync a booking to Workspace Calendar if not yet synced
  const handleManualCalendarSync = async (apt: ExtendedAppointment) => {
    const token = getAccessToken();
    if (!token) {
      setToastBanner({
        type: 'warning',
        title: 'Google Workspace Connection Required',
        message: 'Connect your Google Workspace account in the /workspace hub to sync directly to Google Calendar, or use the G-Calendar link on the card.',
      });
      return;
    }

    setSyncingCalendarRef(apt.referenceId);
    try {
      const startTime = parseAppointmentStartTime(apt.date, apt.timeSlot) || new Date(Date.now() + 3600000);
      const endTime = new Date(startTime.getTime() + 45 * 60 * 1000);
      const createdEvent = await workspaceCalendarApi.createEvent({
        summary: `[${apt.referenceId}] ${apt.practiceArea} — ${apt.clientName}`,
        description: `Docket Reference: ${apt.referenceId}\nPractice Area: ${apt.practiceArea}\nClient: ${apt.clientName} (${apt.email})\nLead Partner: ${apt.assignedPartner?.name || 'Senior Partner'}\nCentral Desk: ekram@elawyersbd.com`,
        location:
          apt.mode === 'virtual'
            ? 'Virtual Session (Online)'
            : 'Suite G-5, BTI Centara Grand, 144–144/1 Green Road, Panthapath, Dhaka–1205',
        start: { dateTime: startTime.toISOString() },
        end: { dateTime: endTime.toISOString() },
      });

      const eventId = createdEvent?.id || `cal-${Date.now()}`;

      // Update Firestore if id exists
      if (apt.id && !apt.id.startsWith('seed-') && !apt.id.startsWith('APT-')) {
        try {
          await updateDoc(doc(db, 'appointments', apt.id), {
            calendarEventId: eventId,
            calendarSynced: true,
            updatedAt: serverTimestamp(),
          });
        } catch {
          // ignore
        }
      }

      setAppointments((prev) => {
        const next = prev.map((item) =>
          item.referenceId === apt.referenceId
            ? { ...item, calendarEventId: eventId, calendarSynced: true }
            : item
        );
        try {
          localStorage.setItem('accounticca_booked_appointments', JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });

      setToastBanner({
        type: 'success',
        title: 'Synced to /workspace Google Calendar',
        message: `Appointment ${apt.referenceId} is now synced to your Google Workspace Calendar.`,
      });
    } catch (err: any) {
      setToastBanner({
        type: 'warning',
        title: 'Calendar Sync Notice',
        message: err?.message || 'Could not sync with Google Calendar. Please verify your Workspace token.',
      });
    } finally {
      setSyncingCalendarRef(null);
    }
  };

  // Trigger a 3-Hour Reminder Email manually or on-demand
  const handleSendReminderNow = async (apt: ExtendedAppointment) => {
    setSendingReminderRef(apt.referenceId);
    try {
      const res = await fetch('/api/appointments/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceId: apt.referenceId,
          clientName: apt.clientName,
          email: apt.email,
          phone: apt.phone,
          companyName: apt.companyName,
          practiceArea: apt.practiceArea,
          expertiseArea: apt.expertiseArea,
          division: apt.division,
          mode: apt.mode,
          date: apt.date,
          timeSlot: apt.timeSlot,
          status: 'Reminder3H',
          assignedPartner: apt.assignedPartner,
          notes: apt.notes,
        }),
      });

      if (res.ok) {
        const nowIso = new Date().toISOString();
        if (apt.id && !apt.id.startsWith('seed-') && !apt.id.startsWith('APT-')) {
          try {
            await updateDoc(doc(db, 'appointments', apt.id), {
              reminder3hSent: true,
              reminder3hSentAt: nowIso,
              updatedAt: serverTimestamp(),
            });
          } catch {
            // ignore
          }
        }

        setAppointments((prev) => {
          const next = prev.map((item) =>
            item.referenceId === apt.referenceId
              ? { ...item, reminder3hSent: true, reminder3hSentAt: nowIso }
              : item
          );
          try {
            localStorage.setItem('accounticca_booked_appointments', JSON.stringify(next));
          } catch {
            // ignore
          }
          return next;
        });

        setToastBanner({
          type: 'success',
          title: 'Advance Reminder Dispatched',
          message: `3-hour reminder notification sent to ${apt.email}, ${apt.assignedPartner?.name || 'Lead Partner'}, and ekram@elawyersbd.com.`,
        });
      }
    } catch {
      setToastBanner({
        type: 'warning',
        title: 'Reminder Queued',
        message: 'Reminder request queued for background dispatch.',
      });
    } finally {
      setSendingReminderRef(null);
    }
  };

  // Confirm Cancellation Flow
  const handleConfirmCancel = async () => {
    if (!cancellingApt) return;
    setIsSubmittingCancel(true);

    const finalReason =
      selectedCancelReason === 'Other reason (specify below)' && customCancelNote.trim()
        ? customCancelNote.trim()
        : customCancelNote.trim()
        ? `${selectedCancelReason} — ${customCancelNote.trim()}`
        : selectedCancelReason;

    try {
      // 1. Update Firestore + LocalStorage + Notify Server (/api/appointments/notify with status: 'Cancelled')
      await updateAppointmentStatus(
        cancellingApt.id || cancellingApt.referenceId,
        cancellingApt.referenceId,
        'Cancelled',
        user?.uid,
        finalReason
      );

      // 2. If calendarEventId exists and Workspace token is active, remove event from Google Calendar
      const token = getAccessToken();
      if (token && cancellingApt.calendarEventId && !cancellingApt.calendarEventId.startsWith('cal-')) {
        try {
          await workspaceCalendarApi.deleteEvent(cancellingApt.calendarEventId);
        } catch (calErr) {
          console.warn('Workspace calendar event removal notice:', calErr);
        }
      }

      const cancelledAtIso = new Date().toISOString();

      // 3. Update local state immediately
      setAppointments((prev) => {
        const next = prev.map((item) =>
          item.referenceId === cancellingApt.referenceId
            ? {
                ...item,
                status: 'Cancelled' as const,
                cancellationReason: finalReason,
                cancelledAt: cancelledAtIso,
              }
            : item
        );
        try {
          localStorage.setItem('accounticca_booked_appointments', JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });

      window.dispatchEvent(new CustomEvent('accounticca:appointment-updated'));

      setToastBanner({
        type: 'info',
        title: `Booking ${cancellingApt.referenceId} Cancelled`,
        message: `Your consultation slot has been released and cancellation notices have been dispatched to ${cancellingApt.email} and ekram@elawyersbd.com.`,
      });

      setCancellingApt(null);
      setCustomCancelNote('');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  // Summary metrics
  const metrics = useMemo(() => {
    const total = appointments.length;
    const upcoming = appointments.filter((a) => {
      if (a.status === 'Cancelled' || a.status === 'Completed') return false;
      return !isAppointmentPast(a);
    }).length;
    const confirmed = appointments.filter((a) => a.status === 'Confirmed').length;
    const cancelled = appointments.filter((a) => a.status === 'Cancelled').length;
    return { total, upcoming, confirmed, cancelled };
  }, [appointments]);

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      // Status filter
      if (statusFilter === 'upcoming') {
        if (apt.status === 'Cancelled' || apt.status === 'Completed') return false;
        if (isAppointmentPast(apt)) return false;
      } else if (statusFilter !== 'all') {
        if (apt.status !== statusFilter) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchRef = apt.referenceId?.toLowerCase().includes(q);
        const matchArea = apt.practiceArea?.toLowerCase().includes(q);
        const matchExp = apt.expertiseArea?.toLowerCase().includes(q);
        const matchPartner = apt.assignedPartner?.name?.toLowerCase().includes(q);
        const matchEmail = apt.email?.toLowerCase().includes(q);
        const matchClient = apt.clientName?.toLowerCase().includes(q);
        if (!matchRef && !matchArea && !matchExp && !matchPartner && !matchEmail && !matchClient) {
          return false;
        }
      }

      return true;
    });
  }, [appointments, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header & Summary Strip */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1">
              <CalendarCheck className="w-4 h-4 text-emerald-600" />
              <span>Real-Time Consultation Docket Tracker</span>
            </div>
            <h2 className={`${compact ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'} font-black text-slate-900 tracking-tight`}>
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-2xl">
              {subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => void loadBookings(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Refresh Status'}</span>
            </button>

            {onScheduleNew && (
              <button
                type="button"
                onClick={onScheduleNew}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Book New Consultation</span>
              </button>
            )}
          </div>
        </div>

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
          <button
            type="button"
            onClick={() => setStatusFilter('upcoming')}
            className={`text-left p-3.5 rounded-2xl border transition cursor-pointer ${
              statusFilter === 'upcoming'
                ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/15'
                : 'bg-slate-50/70 border-slate-200/80 hover:bg-white'
            }`}
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Upcoming Active
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-black text-emerald-800 tabular-nums">
                {metrics.upcoming}
              </span>
              <span className="text-[11px] font-semibold text-emerald-700">Scheduled</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`text-left p-3.5 rounded-2xl border transition cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-50/70 border-slate-200/80 hover:bg-white'
            }`}
          >
            <span
              className={`text-[11px] font-bold uppercase tracking-wider block ${
                statusFilter === 'all' ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              Total Bookings
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span
                className={`text-2xl font-black tabular-nums ${
                  statusFilter === 'all' ? 'text-white' : 'text-slate-900'
                }`}
              >
                {metrics.total}
              </span>
              <span
                className={`text-[11px] font-semibold ${
                  statusFilter === 'all' ? 'text-emerald-300' : 'text-slate-500'
                }`}
              >
                All Sessions
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('Confirmed')}
            className={`text-left p-3.5 rounded-2xl border transition cursor-pointer ${
              statusFilter === 'Confirmed'
                ? 'bg-teal-50/80 border-teal-300 ring-2 ring-teal-500/15'
                : 'bg-slate-50/70 border-slate-200/80 hover:bg-white'
            }`}
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Confirmed Slots
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-black text-teal-800 tabular-nums">
                {metrics.confirmed}
              </span>
              <span className="text-[11px] font-semibold text-teal-700">3h Auto-Remind</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('Cancelled')}
            className={`text-left p-3.5 rounded-2xl border transition cursor-pointer ${
              statusFilter === 'Cancelled'
                ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-500/15'
                : 'bg-slate-50/70 border-slate-200/80 hover:bg-white'
            }`}
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Cancelled
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-black text-rose-700 tabular-nums">
                {metrics.cancelled}
              </span>
              <span className="text-[11px] font-semibold text-rose-600">Released</span>
            </div>
          </button>
        </div>

        {/* Brevo SMTP Relay Status & Dispatch Verification Bar */}
        <div className="hidden mt-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 px-4 py-3 sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-extrabold text-slate-900">
                  Brevo Transactional Mail Relay
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-900 border border-emerald-300/80 font-mono">
                  {brevoStatus?.host || 'smtp-relay.brevo.com'}:{brevoStatus?.port || 587}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200 font-mono">
                  Login: {brevoStatus?.login || '9dabe5001@smtp-brevo.com'}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                  From: {brevoStatus?.senderName || 'ACCOUNTICCA x E-Lawyers'} &lt;{brevoStatus?.senderEmail || 'ekram@elawyersbd.com'}&gt;
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Automated confirmations, 3-hour advance reminders, cancellations, and platform receipts route through Brevo SMTP &amp; copy <span className="font-mono font-semibold text-slate-800">ekram@elawyersbd.com</span>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {lastBrevoPreviewUrl && (
              <a
                href={lastBrevoPreviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-800 transition"
              >
                <span>Inspect Mail Preview</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button
              type="button"
              onClick={handleDispatchBrevoTest}
              disabled={isSendingBrevoTest}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 px-3.5 py-1.5 text-[11px] font-bold text-white transition cursor-pointer disabled:opacity-50"
            >
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isSendingBrevoTest ? 'Dispatching...' : 'Send Test Email'}</span>
            </button>
          </div>
        </div>

        {/* Toast / Status Alert Banner */}
        {toastBanner && (
          <div
            role="status"
            className={`mt-5 rounded-2xl border p-4 flex items-start justify-between gap-3 ${
              toastBanner.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : toastBanner.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-950'
                : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            <div className="flex items-start gap-3">
              {toastBanner.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : toastBanner.type === 'warning' ? (
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="text-xs sm:text-sm font-bold">{toastBanner.title}</h4>
                <p
                  className={`text-xs mt-0.5 leading-relaxed ${
                    toastBanner.type === 'info' ? 'text-slate-300' : 'opacity-90'
                  }`}
                >
                  {toastBanner.message}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setToastBanner(null)}
              className="p-1 rounded-lg opacity-70 hover:opacity-100 cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filter Bar & Search / Docket Lookup */}
        <div className="hidden mt-5 pt-5 border-t border-slate-100 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {(
                [
                  { id: 'upcoming', label: 'Upcoming' },
                  { id: 'all', label: 'All Bookings' },
                  { id: 'Confirmed', label: 'Confirmed' },
                  { id: 'Pending', label: 'Pending' },
                  { id: 'Completed', label: 'Completed' },
                  { id: 'Cancelled', label: 'Cancelled' },
                ] as { id: StatusFilter; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    statusFilter === tab.id
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Local Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by APT-ID, practice, partner..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Cross-Device / Guest Docket Lookup Bar */}
          <form
            onSubmit={handleDocketLookup}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-2xl bg-slate-50/90 border border-slate-200/80 p-2.5"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 px-2 shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Lookup Booking by Reference ID or Email:</span>
            </div>
            <input
              type="text"
              value={lookupInput}
              onChange={(e) => setLookupInput(e.target.value)}
              placeholder="Enter APT-2026-... or your booking email address"
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLookingUp || !lookupInput.trim()}
              className="rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-4 py-1.5 text-xs font-bold transition cursor-pointer shrink-0"
            >
              {isLookingUp ? 'Searching Registry...' : 'Retrieve Booking'}
            </button>
          </form>

          {lookupMessage && (
            <p
              className={`text-xs font-medium px-3 py-2 rounded-xl border ${
                lookupMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : lookupMessage.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              {lookupMessage.text}
            </p>
          )}
        </div>
      </div>

      {/* Appointments List */}
      {isLoading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center space-y-3">
          <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">
            Loading your scheduled consultations and calendar sync status...
          </p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">
              {statusFilter === 'upcoming'
                ? 'No upcoming consultations in this view'
                : 'No bookings match your current filter'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {appointments.length > 0
                ? 'Switch to "All Bookings" to view past or cancelled consultations, or use the lookup bar above.'
                : 'Schedule a legal or tax consultation above, or enter your APT Reference ID / email to load an existing docket.'}
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-2">
            {statusFilter !== 'all' && appointments.length > 0 && (
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 transition cursor-pointer"
              >
                Show All Bookings ({appointments.length})
              </button>
            )}
            {onScheduleNew && (
              <button
                type="button"
                onClick={onScheduleNew}
                className="rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-bold text-white transition cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>Schedule Consultation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((apt) => {
            const timeInfo = getTimeStatusInfo(apt.date, apt.timeSlot, apt.status);
            const isCancelled = apt.status === 'Cancelled';
            const isCompleted = apt.status === 'Completed';
            const canCancel = !isCancelled && !isCompleted;
            const isSynced = Boolean(apt.calendarSynced || apt.calendarEventId);

            return (
              <article
                key={apt.referenceId}
                className={`rounded-3xl border bg-white p-5 sm:p-6 transition-all shadow-2xs ${
                  isCancelled
                    ? 'border-rose-200/80 bg-rose-50/10'
                    : 'border-slate-200/90 hover:border-emerald-300'
                }`}
              >
                {/* Top Status & Reference Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-100/80 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5">
                      <span>{apt.referenceId}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyRef(apt.referenceId)}
                        className="text-emerald-700 hover:text-emerald-950 cursor-pointer"
                        title="Copy Docket Reference ID"
                      >
                        {copiedRef === apt.referenceId ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </span>

                    <span
                      className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        apt.status === 'Confirmed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : apt.status === 'Completed'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : apt.status === 'Cancelled'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      ● {apt.status}
                    </span>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${timeInfo.tone}`}
                    >
                      {timeInfo.label}
                    </span>

                    <span className="text-xs font-medium text-slate-500">
                      {apt.division || 'Accounticca Advisory'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/70">
                    <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{apt.date}</span>
                    <span className="text-slate-300">|</span>
                    <Clock className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{apt.timeSlot}</span>
                  </div>
                </div>

                {/* Main Consultation Details Grid */}
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3
                          className={`text-base sm:text-lg font-bold ${
                            isCancelled ? 'line-through text-slate-500' : 'text-slate-900'
                          }`}
                        >
                          {apt.practiceArea}
                        </h3>
                        {apt.expertiseArea && (
                          <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50/90 px-2.5 py-0.5 rounded-md border border-emerald-200">
                            <span>Specialized Focus:</span>
                            <span>{apt.expertiseArea}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
                      <span>
                        <strong className="text-slate-800">Client:</strong> {apt.clientName}
                      </span>
                      {apt.email && (
                        <span>
                          <strong className="text-slate-800">Email:</strong> {apt.email}
                        </span>
                      )}
                      {apt.companyName && (
                        <span>
                          <strong className="text-slate-800">Organization:</strong> {apt.companyName}
                        </span>
                      )}
                    </div>

                    {apt.notes && (
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <strong className="text-slate-800">Matter Brief / Notes: </strong>
                        {apt.notes}
                      </p>
                    )}

                    {isCancelled && apt.cancellationReason && (
                      <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-900 flex items-start gap-2">
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Cancellation Reason: </span>
                          <span>{apt.cancellationReason}</span>
                          {apt.cancelledAt && (
                            <span className="block text-[11px] text-rose-700 mt-0.5">
                              Cancelled on {new Date(apt.cancelledAt).toLocaleString()} • Notification copied to ekram@elawyersbd.com
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Assigned Partner & Consultation Mode Card */}
                  <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-xs flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Assigned Lead Partner &amp; Desk
                      </span>
                      <p className="font-bold text-slate-900 text-sm">
                        {apt.assignedPartner?.name || 'Md. Ekramul Haque, LL.M.'}
                      </p>
                      <p className="text-[11px] text-emerald-700 font-medium">
                        {apt.assignedPartner?.title || 'Senior Practice Partner'}
                      </p>
                      <p className="text-[11px] text-slate-500 pt-0.5">
                        Central Copy: <span className="font-mono text-slate-700">ekram@elawyersbd.com</span>
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Session Mode:</span>
                      <span className="font-bold text-slate-900 inline-flex items-center gap-1.5">
                        {apt.mode === 'virtual' ? (
                          <>
                            <Video className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Virtual Consultation</span>
                          </>
                        ) : (
                          <>
                            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Dhaka Chambers</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4-Stage Automated Pipeline Tracker */}
                <div className="mt-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 p-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                    {/* Step 1: Docket Registered */}
                    <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200/60">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 block text-[11px]">
                          1. Docket Registered
                        </span>
                        <span className="text-[10px] text-slate-500 truncate block">
                          Ref {apt.referenceId}
                        </span>
                      </div>
                    </div>

                    {/* Step 2: /workspace Calendar Sync */}
                    <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-slate-200/60">
                      <div className="flex items-center gap-2 min-w-0">
                        <CalendarCheck
                          className={`w-4 h-4 shrink-0 ${
                            isCancelled
                              ? 'text-slate-400'
                              : isSynced
                              ? 'text-emerald-600'
                              : 'text-amber-600'
                          }`}
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block text-[11px]">
                            2. /workspace Calendar
                          </span>
                          <span className="text-[10px] text-slate-500 truncate block">
                            {isCancelled
                              ? 'Slot Released'
                              : isSynced
                              ? 'Synced to Calendar'
                              : 'Ready to Sync'}
                          </span>
                        </div>
                      </div>
                      {!isCancelled && !isSynced && (
                        <button
                          type="button"
                          onClick={() => void handleManualCalendarSync(apt)}
                          disabled={syncingCalendarRef === apt.referenceId}
                          className="text-[10px] font-bold text-emerald-700 hover:text-emerald-950 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 shrink-0 cursor-pointer"
                        >
                          {syncingCalendarRef === apt.referenceId ? 'Syncing...' : 'Sync'}
                        </button>
                      )}
                    </div>

                    {/* Step 3: Confirmation Email */}
                    <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200/60">
                      <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 block text-[11px]">
                          3. Confirmation Email
                        </span>
                        <span className="text-[10px] text-slate-500 truncate block">
                          Sent to Client &amp; Desk
                        </span>
                      </div>
                    </div>

                    {/* Step 4: 3-Hour Advance Reminder */}
                    <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-slate-200/60">
                      <div className="flex items-center gap-2 min-w-0">
                        <Bell
                          className={`w-4 h-4 shrink-0 ${
                            isCancelled
                              ? 'text-slate-400'
                              : apt.reminder3hSent
                              ? 'text-emerald-600'
                              : 'text-teal-600'
                          }`}
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block text-[11px]">
                            4. 3h Advance Reminder
                          </span>
                          <span className="text-[10px] text-slate-500 truncate block">
                            {isCancelled
                              ? 'Cancelled'
                              : apt.reminder3hSent
                              ? 'Dispatched to Both Parties'
                              : 'Auto-Scheduled (3h Prior)'}
                          </span>
                        </div>
                      </div>
                      {!isCancelled && !isCompleted && !apt.reminder3hSent && (
                        <button
                          type="button"
                          onClick={() => void handleSendReminderNow(apt)}
                          disabled={sendingReminderRef === apt.referenceId}
                          title="Dispatch 3-hour reminder email now to client and provider"
                          className="text-[10px] font-bold text-teal-800 hover:text-teal-950 bg-teal-50 px-2 py-1 rounded-md border border-teal-200 shrink-0 cursor-pointer"
                        >
                          {sendingReminderRef === apt.referenceId ? 'Sending...' : 'Notify Now'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Controls */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={getGoogleCalendarUrl(apt)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 font-bold text-slate-700 transition"
                    >
                      <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Add to Google Calendar</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>

                    <button
                      type="button"
                      onClick={() => downloadIcsFile(apt)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 font-bold text-slate-700 transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>Download .ics</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {canCancel ? (
                      <button
                        type="button"
                        onClick={() => {
                          setCancellingApt(apt);
                          setSelectedCancelReason(CANCELLATION_REASONS[0]);
                          setCustomCancelNote('');
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 px-3.5 py-2 font-bold text-rose-700 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Cancel Booking</span>
                      </button>
                    ) : isCancelled ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancelled</span>
                      </span>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancellingApt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-booking-modal-title"
        >
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="cancel-booking-modal-title" className="text-lg font-black text-slate-900">
                    Cancel Consultation Booking?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Docket Reference: <span className="font-mono font-bold text-slate-700">{cancellingApt.referenceId}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCancellingApt(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 text-xs space-y-1">
              <p className="font-bold text-slate-900">{cancellingApt.practiceArea}</p>
              <p className="text-slate-600">
                Scheduled for <strong>{cancellingApt.date}</strong> at <strong>{cancellingApt.timeSlot}</strong>
              </p>
              <p className="text-slate-500">
                Assigned Partner: {cancellingApt.assignedPartner?.name || 'Md. Ekramul Haque, LL.M.'}
              </p>
            </div>

            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-slate-800">
                Select a reason for cancellation:
              </label>
              <div className="space-y-1.5">
                {CANCELLATION_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                      selectedCancelReason === reason
                        ? 'border-rose-400 bg-rose-50/60 font-bold text-rose-950'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
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

              <div className="pt-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Additional notes for the chamber desk (optional):
                </label>
                <textarea
                  rows={2}
                  value={customCancelNote}
                  onChange={(e) => setCustomCancelNote(e.target.value)}
                  placeholder="E.g., Preferred alternative dates or instructions for your partner..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Confirming cancellation releases your reserved time slot, removes the event from the synced{' '}
              <code className="text-slate-700 font-semibold">/workspace</code> calendar, and sends a cancellation confirmation to{' '}
              <strong>{cancellingApt.email}</strong> and <strong>ekram@elawyersbd.com</strong>.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCancellingApt(null)}
                disabled={isSubmittingCancel}
                className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition cursor-pointer"
              >
                Keep Appointment
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmCancel()}
                disabled={isSubmittingCancel}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition cursor-pointer inline-flex items-center gap-1.5"
              >
                {isSubmittingCancel ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Cancelling Booking...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Cancellation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientBookingDashboard;
