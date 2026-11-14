import React, { useCallback, useEffect, useId, useMemo, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Ban,
  CalendarClock,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  Mail,
  Play,
  RefreshCw,
  Send,
  Trash2,
  User,
  X,
} from 'lucide-react';
import type {
  EmailPlaceholderDefinition,
  TransactionalEmailCategory,
  TransactionalEmailTemplate,
} from '../../utils/transactionalEmailTemplates';
import { dispatchFormSubmissionToast } from '../ui/FormSubmissionToast';

export type ScheduledDispatchStatus =
  | 'scheduled'
  | 'processing'
  | 'sent'
  | 'failed'
  | 'cancelled';

export interface ScheduledEmailDispatchItem {
  id: string;
  referenceId: string;
  templateId: string;
  templateName: string;
  category: TransactionalEmailCategory | 'system';
  recipientEmail: string;
  recipientName?: string;
  ccAdmin: boolean;
  ccEmails: string[];
  subject: string;
  html: string;
  text: string;
  scheduledFor: string;
  notes?: string;
  status: ScheduledDispatchStatus;
  createdAt: string;
  updatedAt: string;
  dispatchedAt?: string | null;
  messageId?: string | null;
  transport?: string | null;
  smtpNotice?: string | null;
  error?: string | null;
}

interface ScheduleStats {
  total: number;
  scheduled: number;
  sent: number;
  failed: number;
  cancelled: number;
}

export interface ScheduledEmailQueuePanelProps {
  templates: TransactionalEmailTemplate[];
  activeTemplate?: TransactionalEmailTemplate;
  draftOverride?: {
    id: string;
    name?: string;
    enabled?: boolean;
    ccAdmin?: boolean;
    subjectTemplate?: string;
    htmlTemplate?: string;
    textTemplate?: string;
    placeholders?: EmailPlaceholderDefinition[];
  } | null;
  sampleValues?: Record<string, string>;
  defaultRecipientEmail?: string;
  onQueueCountChange?: (scheduledCount: number) => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function toLocalDateTimeInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function formatRelativeCountdown(isoDate: string): string {
  const diffMs = new Date(isoDate).getTime() - Date.now();
  if (Number.isNaN(diffMs)) return '';
  if (diffMs <= 0) return 'Due now';
  const totalMinutes = Math.ceil(diffMs / 60000);
  if (totalMinutes < 60) return `in ${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours < 24) return mins > 0 ? `in ${hours}h ${mins}m` : `in ${hours}h`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `in ${days}d ${remHours}h` : `in ${days}d`;
}

const STATUS_STYLE_MAP: Record<
  ScheduledDispatchStatus,
  { label: string; className: string }
> = {
  scheduled: {
    label: 'Scheduled',
    className: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  processing: {
    label: 'Sending...',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  sent: {
    label: 'Sent',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  failed: {
    label: 'Failed',
    className: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-slate-100 text-slate-600 border-slate-300',
  },
};

export const ScheduledEmailQueuePanel: React.FC<ScheduledEmailQueuePanelProps> = ({
  templates,
  activeTemplate,
  draftOverride,
  sampleValues = {},
  defaultRecipientEmail = '',
  onQueueCountChange,
}) => {
  const emailFieldId = useId();
  const nameFieldId = useId();
  const templateFieldId = useId();
  const dateFieldId = useId();
  const notesFieldId = useId();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    activeTemplate?.id || templates[0]?.id || ''
  );
  const [recipientEmail, setRecipientEmail] = useState(defaultRecipientEmail);
  const [recipientName, setRecipientName] = useState('');
  const [scheduledLocal, setScheduledLocal] = useState<string>(() =>
    toLocalDateTimeInputValue(new Date(Date.now() + 60 * 60 * 1000))
  );
  const [ccAdmin, setCcAdmin] = useState<boolean>(activeTemplate?.ccAdmin ?? true);
  const [forceScheduleDisabled, setForceScheduleDisabled] = useState(false);
  const [notes, setNotes] = useState('');

  const [schedules, setSchedules] = useState<ScheduledEmailDispatchItem[]>([]);
  const [stats, setStats] = useState<ScheduleStats>({
    total: 0,
    scheduled: 0,
    sent: 0,
    failed: 0,
    cancelled: 0,
  });
  const [statusFilter, setStatusFilter] = useState<'all' | ScheduledDispatchStatus>('all');
  const [previewItem, setPreviewItem] = useState<ScheduledEmailDispatchItem | null>(null);

  const [isLoadingQueue, setIsLoadingQueue] = useState(false);
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);
  const [isProcessingDue, setIsProcessingDue] = useState(false);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (activeTemplate?.id) {
      setSelectedTemplateId(activeTemplate.id);
      setCcAdmin(activeTemplate.ccAdmin);
    }
  }, [activeTemplate?.id, activeTemplate?.ccAdmin]);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) || activeTemplate || templates[0],
    [templates, selectedTemplateId, activeTemplate]
  );

  const fetchSchedules = useCallback(
    async (processDue = false) => {
      setIsLoadingQueue(true);
      try {
        const res = await fetch(
          `/api/email/schedules${processDue ? '?processDue=true' : ''}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.schedules)) {
          setSchedules(data.schedules);
        }
        if (data.stats) {
          setStats(data.stats);
          onQueueCountChange?.(Number(data.stats.scheduled || 0));
        }
      } catch {
        // Non-blocking refresh
      } finally {
        setIsLoadingQueue(false);
      }
    },
    [onQueueCountChange]
  );

  useEffect(() => {
    void fetchSchedules(false);
  }, [fetchSchedules]);

  // Auto-refresh while scheduled/processing items exist
  useEffect(() => {
    if (stats.scheduled === 0) return;
    const timer = window.setInterval(() => {
      void fetchSchedules(false);
    }, 15000);
    return () => window.clearInterval(timer);
  }, [stats.scheduled, fetchSchedules]);

  const applyTimePreset = (offsetMinutes: number | 'tomorrow_9am') => {
    let target: Date;
    if (offsetMinutes === 'tomorrow_9am') {
      target = new Date();
      target.setDate(target.getDate() + 1);
      target.setHours(9, 0, 0, 0);
    } else {
      target = new Date(Date.now() + offsetMinutes * 60 * 1000);
    }
    setScheduledLocal(toLocalDateTimeInputValue(target));
    setFormError(null);
  };

  const handleQueueSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmittingSchedule || !selectedTemplate) return;

    const cleanEmail = recipientEmail.trim();
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      setFormError('Please enter a valid recipient email address.');
      return;
    }

    const parsedDate = scheduledLocal ? new Date(scheduledLocal) : null;
    if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
      setFormError('Please choose a valid scheduled date and time.');
      return;
    }
    if (parsedDate.getTime() < Date.now() + 30 * 1000) {
      setFormError('Scheduled date and time must be at least 1 minute in the future.');
      return;
    }

    setIsSubmittingSchedule(true);
    setFormError(null);
    setBannerMessage(null);

    const usesDraft = Boolean(draftOverride && draftOverride.id === selectedTemplate.id);

    try {
      const res = await fetch('/api/email/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          name: usesDraft ? draftOverride?.name : selectedTemplate.name,
          enabled: usesDraft ? draftOverride?.enabled : selectedTemplate.enabled,
          ccAdmin,
          forceSchedule: forceScheduleDisabled,
          subjectTemplate: usesDraft
            ? draftOverride?.subjectTemplate
            : selectedTemplate.subjectTemplate,
          htmlTemplate: usesDraft ? draftOverride?.htmlTemplate : selectedTemplate.htmlTemplate,
          textTemplate: usesDraft ? draftOverride?.textTemplate : selectedTemplate.textTemplate,
          placeholders: usesDraft ? draftOverride?.placeholders : selectedTemplate.placeholders,
          variables: usesDraft ? sampleValues : undefined,
          useSampleFallback: true,
          recipientEmail: cleanEmail,
          recipientName: recipientName.trim() || undefined,
          scheduledFor: parsedDate.toISOString(),
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(data?.error || 'Could not queue scheduled email.');
        return;
      }

      setBannerMessage({
        type: 'success',
        text: data.message || `Scheduled dispatch queued for ${cleanEmail}.`,
      });
      dispatchFormSubmissionToast({
        title: 'Email dispatch scheduled',
        message: `Queued "${selectedTemplate.name}" for ${parsedDate.toLocaleString()}.`,
        referenceId: data.schedule?.referenceId,
        recipientEmail: cleanEmail,
        type: 'success',
      });
      setNotes('');
      setForceScheduleDisabled(false);
      await fetchSchedules(false);
    } catch (err: any) {
      setFormError(err?.message || 'Network error while queueing scheduled email.');
    } finally {
      setIsSubmittingSchedule(false);
    }
  };

  const handleDispatchNow = async (item: ScheduledEmailDispatchItem) => {
    if (busyItemId) return;
    setBusyItemId(item.id);
    setBannerMessage(null);
    try {
      const res = await fetch(`/api/email/schedules/${item.id}/dispatch-now`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      setBannerMessage({
        type: res.ok && data?.liveDelivered ? 'success' : 'error',
        text: data?.message || data?.error || 'Dispatch completed.',
      });
      dispatchFormSubmissionToast({
        title:
          res.ok && data?.liveDelivered ? 'Scheduled email sent now' : 'Dispatch failed',
        message: data?.message || data?.error || 'Check Brevo relay status.',
        referenceId: item.referenceId,
        recipientEmail: item.recipientEmail,
        type: res.ok && data?.liveDelivered ? 'success' : 'error',
      });
      await fetchSchedules(false);
    } catch (err: any) {
      setBannerMessage({
        type: 'error',
        text: err?.message || 'Failed to dispatch scheduled email.',
      });
    } finally {
      setBusyItemId(null);
    }
  };

  const handleCancelSchedule = async (item: ScheduledEmailDispatchItem) => {
    if (busyItemId) return;
    setBusyItemId(item.id);
    setBannerMessage(null);
    try {
      const res = await fetch(`/api/email/schedules/${item.id}/cancel`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBannerMessage({
          type: 'error',
          text: data?.error || 'Could not cancel scheduled dispatch.',
        });
      } else {
        setBannerMessage({
          type: 'success',
          text: data?.message || `Cancelled ${item.referenceId}.`,
        });
      }
      await fetchSchedules(false);
    } catch (err: any) {
      setBannerMessage({
        type: 'error',
        text: err?.message || 'Network error cancelling dispatch.',
      });
    } finally {
      setBusyItemId(null);
    }
  };

  const handleDeleteSchedule = async (item: ScheduledEmailDispatchItem) => {
    if (busyItemId) return;
    setBusyItemId(item.id);
    try {
      await fetch(`/api/email/schedules/${item.id}`, { method: 'DELETE' });
      await fetchSchedules(false);
    } finally {
      setBusyItemId(null);
    }
  };

  const handleProcessDueNow = async () => {
    if (isProcessingDue) return;
    setIsProcessingDue(true);
    setBannerMessage(null);
    try {
      const res = await fetch('/api/email/schedules/process-due', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      setBannerMessage({
        type: 'success',
        text: data?.message || 'Checked queue for due dispatches.',
      });
      await fetchSchedules(false);
    } finally {
      setIsProcessingDue(false);
    }
  };

  const filteredSchedules = useMemo(() => {
    if (statusFilter === 'all') return schedules;
    return schedules.filter((s) => s.status === statusFilter);
  }, [schedules, statusFilter]);

  const minDateTimeLocal = toLocalDateTimeInputValue(new Date(Date.now() + 60 * 1000));

  return (
    <section
      id="scheduled-dispatch-queue"
      className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden scroll-mt-6"
    >
      {/* Header */}
      <div className="bg-slate-900 text-white px-5 py-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30">
              <CalendarClock className="w-3.5 h-3.5 text-blue-300" />
              <span>Scheduled Email Dispatch Queue</span>
            </span>
            <span className="text-[11px] font-mono bg-slate-800 text-emerald-300 px-2 py-0.5 rounded border border-slate-700">
              {stats.scheduled} Queued · {stats.sent} Sent · {stats.failed} Failed
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-white">
            Schedule Future Template Dispatches via Brevo SMTP
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleProcessDueNow}
            disabled={isProcessingDue}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            {isProcessingDue ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            <span>Process Due Now</span>
          </button>
          <button
            type="button"
            onClick={() => void fetchSchedules(false)}
            disabled={isLoadingQueue}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isLoadingQueue ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {bannerMessage && (
          <div
            role="status"
            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
              bannerMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              {bannerMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{bannerMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setBannerMessage(null)}
              className="text-[11px] font-bold opacity-70 hover:opacity-100 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Schedule New Dispatch Form */}
        <form
          onSubmit={handleQueueSubmit}
          noValidate
          className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                Queue New Email Dispatch
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Server scheduler checks every 15 seconds and dispatches automatically at the scheduled time.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 mr-1">Quick time:</span>
              <button
                type="button"
                onClick={() => applyTimePreset(15)}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 text-[11px] font-bold text-slate-700 cursor-pointer"
              >
                +15 min
              </button>
              <button
                type="button"
                onClick={() => applyTimePreset(60)}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 text-[11px] font-bold text-slate-700 cursor-pointer"
              >
                +1 hour
              </button>
              <button
                type="button"
                onClick={() => applyTimePreset('tomorrow_9am')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 text-[11px] font-bold text-slate-700 cursor-pointer"
              >
                Tomorrow 9:00 AM
              </button>
            </div>
          </div>

          {formError && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-800 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div>
              <label
                htmlFor={templateFieldId}
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Email Template
              </label>
              <select
                id={templateFieldId}
                value={selectedTemplate?.id || ''}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-emerald-600 focus:outline-none"
              >
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    [{tpl.category.toUpperCase()}] {tpl.name}
                    {!tpl.enabled ? ' (Disabled)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor={emailFieldId}
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Recipient Email <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  id={emailFieldId}
                  type="email"
                  required
                  value={recipientEmail}
                  onChange={(e) => {
                    setRecipientEmail(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="client@company.com"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-8 pr-3 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor={nameFieldId}
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Recipient Name <span className="font-normal text-slate-400">(Optional)</span>
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  id={nameFieldId}
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Tariqul Islam"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-8 pr-3 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor={dateFieldId}
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Scheduled Date &amp; Time <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <Clock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  id={dateFieldId}
                  type="datetime-local"
                  required
                  min={minDateTimeLocal}
                  value={scheduledLocal}
                  onChange={(e) => {
                    setScheduledLocal(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-8 pr-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
            <div className="flex flex-1 flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[220px]">
                <label htmlFor={notesFieldId} className="sr-only">
                  Schedule Notes
                </label>
                <input
                  id={notesFieldId}
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional admin note (e.g. Monthly compliance reminder follow-up)..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ccAdmin}
                  onChange={(e) => setCcAdmin(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>CC Firm Desk</span>
              </label>

              {selectedTemplate && !selectedTemplate.enabled && (
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-amber-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={forceScheduleDisabled}
                    onChange={(e) => setForceScheduleDisabled(e.target.checked)}
                    className="rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                  />
                  <span>Allow disabled template</span>
                </label>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmittingSchedule}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-black inline-flex items-center justify-center gap-2 cursor-pointer transition-colors shrink-0"
            >
              {isSubmittingSchedule ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Queueing Dispatch...</span>
                </>
              ) : (
                <>
                  <CalendarClock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Queue Scheduled Email</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {(['all', 'scheduled', 'sent', 'failed', 'cancelled'] as const).map((status) => {
              const count =
                status === 'all' ? stats.total : stats[status as keyof Omit<ScheduleStats, 'total'>];
              const active = statusFilter === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{status}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      active ? 'bg-slate-800 text-emerald-300' : 'bg-white text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Queue List */}
        {filteredSchedules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center space-y-2">
            <CalendarClock className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700">
              No {statusFilter === 'all' ? '' : `${statusFilter} `}scheduled email dispatches
            </p>
            <p className="text-xs text-slate-500">
              Use the form above to queue an email template for a future date and time.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 overflow-hidden">
            {filteredSchedules.map((item) => {
              const badge = STATUS_STYLE_MAP[item.status];
              const isBusy = busyItemId === item.id;

              return (
                <div
                  key={item.id}
                  className="p-4 bg-white hover:bg-slate-50/60 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                      <span className="font-mono text-[11px] font-bold text-slate-500">
                        {item.referenceId}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{item.templateName}</span>
                      {item.status === 'scheduled' && (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                          {formatRelativeCountdown(item.scheduledFor)}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-700 truncate">
                      <span className="font-semibold">To:</span>{' '}
                      <span className="font-mono">
                        {item.recipientName
                          ? `${item.recipientName} <${item.recipientEmail}>`
                          : item.recipientEmail}
                      </span>
                      <span className="mx-2 text-slate-300">|</span>
                      <span className="font-semibold">Subject:</span> {item.subject}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                      <span>
                        Scheduled for:{' '}
                        <strong className="text-slate-700">
                          {new Date(item.scheduledFor).toLocaleString()}
                        </strong>
                      </span>
                      {item.dispatchedAt && (
                        <span>
                          Processed: {new Date(item.dispatchedAt).toLocaleString()}
                        </span>
                      )}
                      {item.notes && <span className="italic">Note: {item.notes}</span>}
                    </div>

                    {item.error && (
                      <div className="text-[11px] font-medium text-rose-700">
                        Relay Notice: {item.error}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewItem(item)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Preview</span>
                    </button>

                    {(item.status === 'scheduled' || item.status === 'failed') && (
                      <button
                        type="button"
                        onClick={() => void handleDispatchNow(item)}
                        disabled={isBusy}
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        {isBusy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>{item.status === 'failed' ? 'Retry Now' : 'Send Now'}</span>
                      </button>
                    )}

                    {item.status === 'scheduled' && (
                      <button
                        type="button"
                        onClick={() => void handleCancelSchedule(item)}
                        disabled={isBusy}
                        className="px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    )}

                    {item.status !== 'scheduled' && item.status !== 'processing' && (
                      <button
                        type="button"
                        onClick={() => void handleDeleteSchedule(item)}
                        disabled={isBusy}
                        aria-label={`Remove ${item.referenceId}`}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Queued Email Payload Preview Modal */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewItem(null);
          }}
        >
          <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-5 py-3.5 text-white">
              <div className="min-w-0">
                <p className="text-[11px] font-mono text-emerald-300">
                  {previewItem.referenceId} · Scheduled for{' '}
                  {new Date(previewItem.scheduledFor).toLocaleString()}
                </p>
                <h4 className="truncate text-sm font-bold">{previewItem.subject}</h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                aria-label="Close queued email preview"
                className="rounded-lg bg-slate-800 p-1.5 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-100 flex-1 overflow-y-auto">
              <iframe
                title={`ScheduledPreview-${previewItem.id}`}
                srcDoc={previewItem.html}
                sandbox="allow-same-origin"
                className="w-full h-[460px] rounded-xl border border-slate-200 bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ScheduledEmailQueuePanel;
