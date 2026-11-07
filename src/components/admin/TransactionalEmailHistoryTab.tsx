import React, { useState, useEffect, useMemo } from 'react';
import {
  Mail,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  RefreshCw,
  Send,
  Eye,
  FileDown,
  Copy,
  Check,
  X,
  UserPlus,
  Calendar,
  CreditCard,
  Terminal,
  RotateCcw
} from 'lucide-react';

export type EmailDeliveryStatus = 'delivered' | 'pending' | 'failed';
export type EmailLogCategory = 'registration' | 'booking' | 'payment' | 'system';

export interface BrevoEmailLogRecord {
  id: string;
  messageId: string;
  referenceId: string;
  appointmentId?: string;
  clientName: string;
  recipientEmail: string;
  ccEmails?: string[];
  phone?: string;
  companyName?: string;
  practiceArea: string;
  mode: string;
  date: string;
  timeSlot: string;
  status: string;
  subject: string;
  html: string;
  text: string;
  sentAt: string;
  retriedAt?: string;
  delivered: boolean;
  deliveryStatus: EmailDeliveryStatus;
  category: EmailLogCategory;
  transport: string;
  fromHeader?: string;
  smtpNotice?: string | null;
}

interface EmailHistoryStats {
  total: number;
  deliveredCount: number;
  pendingCount: number;
  failedCount: number;
  deliveryRate: number;
}

interface BrevoRelayInfo {
  host: string;
  port: number;
  login: string;
  senderName: string;
  senderEmail: string;
  formattedFrom: string;
  liveRelayActive: boolean;
}

const STATUS_BADGE_MAP: Record<
  EmailDeliveryStatus,
  { label: string; className: string; icon: React.ComponentType<{ className?: string }> }
> = {
  delivered: {
    label: 'Delivered',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: CheckCircle2
  },
  pending: {
    label: 'Pending',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: Clock
  },
  failed: {
    label: 'Failed',
    className: 'bg-rose-50 text-rose-800 border-rose-200',
    icon: AlertCircle
  }
};

const CATEGORY_BADGE_MAP: Record<
  EmailLogCategory,
  { label: string; className: string; icon: React.ComponentType<{ className?: string }> }
> = {
  registration: {
    label: 'Registration',
    className: 'bg-emerald-100/70 text-emerald-900 border-emerald-200',
    icon: UserPlus
  },
  booking: {
    label: 'Booking',
    className: 'bg-blue-100/70 text-blue-900 border-blue-200',
    icon: Calendar
  },
  payment: {
    label: 'Payment & Order',
    className: 'bg-amber-100/70 text-amber-900 border-amber-200',
    icon: CreditCard
  },
  system: {
    label: 'System / Diagnostic',
    className: 'bg-slate-100 text-slate-800 border-slate-300',
    icon: Terminal
  }
};

export const TransactionalEmailHistoryTab: React.FC = () => {
  const [logs, setLogs] = useState<BrevoEmailLogRecord[]>([]);
  const [stats, setStats] = useState<EmailHistoryStats>({
    total: 0,
    deliveredCount: 0,
    pendingCount: 0,
    failedCount: 0,
    deliveryRate: 100
  });
  const [brevoRelay, setBrevoRelay] = useState<BrevoRelayInfo>({
    host: 'smtp-relay.brevo.com',
    port: 587,
    login: '9dabe5001@smtp-brevo.com',
    senderName: 'ACCOUNTICCA x E-Lawyers',
    senderEmail: 'ekram@elawyersbd.com',
    formattedFrom: '"ACCOUNTICCA x E-Lawyers" <ekram@elawyersbd.com>',
    liveRelayActive: true
  });

  const [statusFilter, setStatusFilter] = useState<'all' | EmailDeliveryStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | EmailLogCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [isSendingDiag, setIsSendingDiag] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<BrevoEmailLogRecord | null>(null);
  const [inspectorTab, setInspectorTab] = useState<'html' | 'text' | 'headers'>('html');

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const fetchEmailHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/email/history?limit=150');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.logs)) {
          setLogs(data.logs);
        }
        if (data.stats) {
          setStats(data.stats);
        }
        if (data.brevoRelay) {
          setBrevoRelay(data.brevoRelay);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch email history logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmailHistory();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (statusFilter !== 'all' && log.deliveryStatus !== statusFilter) {
        return false;
      }
      if (categoryFilter !== 'all' && log.category !== categoryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const match =
          (log.recipientEmail || '').toLowerCase().includes(q) ||
          (log.clientName || '').toLowerCase().includes(q) ||
          (log.referenceId || '').toLowerCase().includes(q) ||
          (log.subject || '').toLowerCase().includes(q) ||
          (log.messageId || '').toLowerCase().includes(q) ||
          (log.practiceArea || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [logs, statusFilter, categoryFilter, searchQuery]);

  const handleCopyText = (val: string, idKey: string) => {
    navigator.clipboard?.writeText(val).catch(() => {});
    setCopiedId(idKey);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleResendEmail = async (record: BrevoEmailLogRecord) => {
    setResendingId(record.id);
    setFeedback(null);
    try {
      const res = await fetch(`/api/email/history/${encodeURIComponent(record.id)}/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail: record.recipientEmail })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend email');
      }
      setFeedback({
        type: 'success',
        text: data.message || `Successfully resent email [${record.referenceId}] to ${record.recipientEmail}.`
      });
      await fetchEmailHistory();
      if (selectedLog?.id === record.id && data.log) {
        setSelectedLog(data.log);
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Could not resend transactional email.'
      });
    } finally {
      setResendingId(null);
    }
  };

  const handleUpdateDeliveryStatus = async (
    record: BrevoEmailLogRecord,
    nextStatus: EmailDeliveryStatus
  ) => {
    try {
      const res = await fetch(`/api/email/history/${encodeURIComponent(record.id)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryStatus: nextStatus })
      });
      const data = await res.json();
      if (res.ok && data.log) {
        await fetchEmailHistory();
        if (selectedLog?.id === record.id) {
          setSelectedLog(data.log);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleDispatchDiagnosticTest = async () => {
    setIsSendingDiag(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/email/brevo-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail: brevoRelay.senderEmail })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send diagnostic email');
      }
      setFeedback({
        type: 'success',
        text: `Dispatched Brevo diagnostic email [${data.referenceId}] to ${data.recipient} (${data.transport}).`
      });
      await fetchEmailHistory();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Failed to send diagnostic email.'
      });
    } finally {
      setIsSendingDiag(false);
    }
  };

  const handleExportCsv = () => {
    if (filteredLogs.length === 0) return;
    const headers = [
      'Log ID',
      'Reference ID',
      'Category',
      'Delivery Status',
      'Recipient Email',
      'Client Name',
      'Subject',
      'Brevo Message-ID',
      'Transport',
      'Sent At'
    ];
    const escapeCsv = (val: string) => `"${String(val || '').replace(/"/g, '""')}"`;
    const rows = filteredLogs.map((l) =>
      [
        l.id,
        l.referenceId,
        l.category,
        l.deliveryStatus.toUpperCase(),
        l.recipientEmail,
        l.clientName,
        l.subject,
        l.messageId,
        l.transport,
        l.sentAt
      ]
        .map(escapeCsv)
        .join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `brevo-email-history-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Brevo SMTP Relay Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <span>Brevo Transactional Email Delivery Logs</span>
            </span>
            <span className="text-xs font-mono text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">
              {brevoRelay.host}:{brevoRelay.port} • {brevoRelay.login}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white">
            Transactional Email History &amp; Delivery Status Ledger
          </h2>
          <p className="text-xs text-slate-300 max-w-3xl">
            Monitor real-time delivery status (<strong>Delivered</strong>, <strong>Pending</strong>, <strong>Failed</strong>), inspect MIME payloads, and re-dispatch transactional emails sent via{' '}
            <strong className="text-white font-mono">{brevoRelay.formattedFrom}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDispatchDiagnosticTest}
            disabled={isSendingDiag}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSendingDiag ? 'Dispatching...' : 'Send Diagnostic Email'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredLogs.length === 0}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-bold border border-slate-700 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={fetchEmailHistory}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Logs</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-rose-50 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-extrabold uppercase tracking-wider">Total Dispatched</span>
            <Mail className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-black font-mono tabular-nums text-slate-900">
            {stats.total}
          </div>
          <div className="text-[11px] text-slate-500">
            Logged across Registration, Booking &amp; Payment flows
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-xs font-extrabold uppercase tracking-wider">Delivered (250 OK)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono tabular-nums text-emerald-700">
              {stats.deliveredCount}
            </span>
            <span className="text-xs font-bold text-emerald-600">
              ({stats.deliveryRate}% rate)
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            Accepted by Brevo SMTP Relay ({brevoRelay.host})
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-xs font-extrabold uppercase tracking-wider">Pending / Queued</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black font-mono tabular-nums text-amber-700">
            {stats.pendingCount}
          </div>
          <div className="text-[11px] text-slate-500">
            Queued in relay buffer or awaiting final handshake
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-rose-200 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-xs font-extrabold uppercase tracking-wider">Failed / Bounced</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black font-mono tabular-nums text-rose-700">
            {stats.failedCount}
          </div>
          <div className="text-[11px] text-slate-500">
            Rejected or bounced (one-click retry available)
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xs">
        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'all', label: 'All Statuses', count: stats.total },
              { id: 'delivered', label: 'Delivered', count: stats.deliveredCount },
              { id: 'pending', label: 'Pending', count: stats.pendingCount },
              { id: 'failed', label: 'Failed', count: stats.failedCount }
            ] as const
          ).map((st) => {
            const active = statusFilter === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{st.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                    active ? 'bg-slate-800 text-emerald-300' : 'bg-white text-slate-600'
                  }`}
                >
                  {st.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Category Filter & Search Input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-emerald-600"
          >
            <option value="all">All Categories</option>
            <option value="registration">Registration &amp; Enrollment</option>
            <option value="booking">Consultation Booking</option>
            <option value="payment">Payment &amp; Shop Orders</option>
            <option value="system">System &amp; Brevo Diagnostic</option>
          </select>

          <div className="relative sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search email, ref ID, subject, message-id..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Email History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-extrabold">
                <th className="py-3.5 px-4">Delivery Status</th>
                <th className="py-3.5 px-4">Sent Timestamp</th>
                <th className="py-3.5 px-4">Recipient &amp; Client</th>
                <th className="py-3.5 px-4">Category &amp; Reference</th>
                <th className="py-3.5 px-4">Subject &amp; Brevo Message-ID</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => {
                const statusMeta = STATUS_BADGE_MAP[log.deliveryStatus] || STATUS_BADGE_MAP.delivered;
                const StatusIcon = statusMeta.icon;
                const catMeta = CATEGORY_BADGE_MAP[log.category] || CATEGORY_BADGE_MAP.booking;
                const CatIcon = catMeta.icon;
                const isResending = resendingId === log.id;

                return (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/90 transition-colors"
                  >
                    {/* Status Column */}
                    <td className="py-3.5 px-4 whitespace-nowrap align-top">
                      <div className="space-y-1">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border ${statusMeta.className}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>{statusMeta.label}</span>
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                          {log.transport.includes('Brevo SMTP Relay (')
                            ? 'Brevo SMTP 250 OK'
                            : log.transport}
                        </div>
                      </div>
                    </td>

                    {/* Timestamp Column */}
                    <td className="py-3.5 px-4 whitespace-nowrap align-top font-mono tabular-nums text-slate-600">
                      <div className="font-bold text-slate-900">
                        {new Date(log.sentAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: '2-digit',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {new Date(log.sentAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </div>
                      {log.retriedAt && (
                        <div className="text-[10px] text-emerald-700 font-sans font-semibold mt-0.5">
                          Retried
                        </div>
                      )}
                    </td>

                    {/* Recipient & Client Column */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-bold text-slate-900">{log.clientName || 'Recipient'}</div>
                      <div className="font-mono text-[11px] text-emerald-700 font-semibold">
                        {log.recipientEmail}
                      </div>
                      {log.ccEmails && log.ccEmails.length > 0 && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          CC: {log.ccEmails.join(', ')}
                        </div>
                      )}
                    </td>

                    {/* Category & Reference ID Column */}
                    <td className="py-3.5 px-4 whitespace-nowrap align-top">
                      <div className="space-y-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${catMeta.className}`}
                        >
                          <CatIcon className="w-3 h-3" />
                          <span>{catMeta.label}</span>
                        </span>
                        <div className="font-mono text-[11px] font-bold text-slate-800">
                          {log.referenceId}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[160px]">
                          {log.practiceArea}
                        </div>
                      </div>
                    </td>

                    {/* Subject & Message-ID Column */}
                    <td className="py-3.5 px-4 align-top max-w-xs">
                      <div className="font-bold text-slate-900 line-clamp-1" title={log.subject}>
                        {log.subject}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className="font-mono text-[10px] text-slate-500 truncate max-w-[220px]"
                          title={log.messageId}
                        >
                          ID: {log.messageId}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(log.messageId, log.id)}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer"
                          title="Copy Brevo Message-ID"
                        >
                          {copiedId === log.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Actions Column */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right align-top">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLog(log);
                            setInspectorTab('html');
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1 cursor-pointer transition-colors"
                          title="Inspect rendered HTML email and Brevo headers"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          <span>Inspect</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleResendEmail(log)}
                          disabled={isResending}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-800 border border-emerald-200 font-bold text-xs inline-flex items-center gap-1 cursor-pointer transition-colors"
                          title="Re-dispatch this email via Brevo SMTP Relay"
                        >
                          <RotateCcw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                          <span>{isResending ? 'Sending...' : 'Resend'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    {isLoading
                      ? 'Loading Brevo transactional email history...'
                      : 'No transactional email records matched your current filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email Payload & Brevo Log Inspector Drawer / Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between gap-4 border-b border-slate-800">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-emerald-400 font-bold">
                    {selectedLog.referenceId}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="font-mono text-slate-300 truncate">
                    {selectedLog.messageId}
                  </span>
                </div>
                <h3 className="text-base font-black text-white truncate">
                  {selectedLog.subject}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Metadata Bar */}
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <span className="text-slate-400 font-bold">To: </span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedLog.clientName} &lt;{selectedLog.recipientEmail}&gt;
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold">Sent: </span>
                  <span className="font-mono text-slate-700">
                    {new Date(selectedLog.sentAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Status Override Selector */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500">Status:</span>
                <select
                  value={selectedLog.deliveryStatus}
                  onChange={(e) =>
                    handleUpdateDeliveryStatus(
                      selectedLog,
                      e.target.value as EmailDeliveryStatus
                    )
                  }
                  className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-bold bg-white text-slate-900"
                >
                  <option value="delivered">Delivered</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            {/* Inspector Sub-Tabs */}
            <div className="px-6 pt-3 bg-white border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {(
                  [
                    { id: 'html', label: 'Rendered HTML Email' },
                    { id: 'text', label: 'Plain-Text Body' },
                    { id: 'headers', label: 'Brevo SMTP Telemetry & Headers' }
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setInspectorTab(t.id)}
                    className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                      inspectorTab === t.id
                        ? 'border-emerald-600 text-emerald-700'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleResendEmail(selectedLog)}
                disabled={resendingId === selectedLog.id}
                className="mb-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>
                  {resendingId === selectedLog.id ? 'Resending...' : 'Resend via Brevo'}
                </span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-100">
              {inspectorTab === 'html' && (
                <iframe
                  title={`Log-Preview-${selectedLog.id}`}
                  srcDoc={selectedLog.html}
                  className="w-full min-h-[420px] bg-white rounded-xl border border-slate-200"
                  sandbox="allow-same-origin"
                />
              )}

              {inspectorTab === 'text' && (
                <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                  {selectedLog.text || 'No plain-text fallback recorded.'}
                </pre>
              )}

              {inspectorTab === 'headers' && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2.5 font-mono text-xs">
                  <div>
                    <strong className="text-slate-500">Log Entry ID:</strong> {selectedLog.id}
                  </div>
                  <div>
                    <strong className="text-slate-500">Brevo Message-ID:</strong>{' '}
                    {selectedLog.messageId}
                  </div>
                  <div>
                    <strong className="text-slate-500">Reference ID:</strong>{' '}
                    {selectedLog.referenceId}
                  </div>
                  <div>
                    <strong className="text-slate-500">SMTP Transport:</strong>{' '}
                    {selectedLog.transport}
                  </div>
                  <div>
                    <strong className="text-slate-500">From Header:</strong>{' '}
                    {selectedLog.fromHeader || brevoRelay.formattedFrom}
                  </div>
                  <div>
                    <strong className="text-slate-500">Recipient (To):</strong>{' '}
                    {selectedLog.recipientEmail}
                  </div>
                  <div>
                    <strong className="text-slate-500">CC Desk Copies:</strong>{' '}
                    {selectedLog.ccEmails?.join(', ') || 'None'}
                  </div>
                  <div>
                    <strong className="text-slate-500">Category:</strong>{' '}
                    {selectedLog.category.toUpperCase()}
                  </div>
                  <div>
                    <strong className="text-slate-500">Delivery Status:</strong>{' '}
                    {selectedLog.deliveryStatus.toUpperCase()}
                  </div>
                  {selectedLog.smtpNotice && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                      <strong>SMTP Handshake Notice:</strong> {selectedLog.smtpNotice}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionalEmailHistoryTab;
