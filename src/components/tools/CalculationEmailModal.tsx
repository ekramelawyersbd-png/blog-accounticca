import React, { useEffect, useMemo, useState } from 'react';
import {
  Mail,
  X,
  Send,
  CheckCircle2,
  Copy,
  Download,
  RefreshCw,
  Monitor,
  Smartphone,
  ShieldCheck,
  AlertCircle,
  Clock,
  FileText,
  Sparkles,
} from 'lucide-react';
import {
  CalculationEmailPayload,
  SentCalculationEmailRecord,
  buildCalculationEmailTemplate,
  extractCalculationSnapshotFromContainer,
} from '../../utils/calculationEmailTemplate';

export interface CalculationEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolId: string;
  toolName: string;
  toolCategory: string;
  toolPath: string;
  statutoryBasis?: string;
  userEmail?: string | null;
  userName?: string | null;
  containerRef?: React.RefObject<HTMLElement | null>;
  customSnapshot?: Omit<
    CalculationEmailPayload,
    'primaryRecipient' | 'recipientName' | 'ccRecipients' | 'customNote'
  > | null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CalculationEmailModal: React.FC<CalculationEmailModalProps> = ({
  isOpen,
  onClose,
  toolId,
  toolName,
  toolCategory,
  toolPath,
  statutoryBasis,
  userEmail,
  userName,
  containerRef,
  customSnapshot,
}) => {
  const defaultEmail = userEmail || 'ekram.elawyersbd@gmail.com';
  const [primaryEmail, setPrimaryEmail] = useState<string>(defaultEmail);
  const [ccInput, setCcInput] = useState<string>('');
  const [customNote, setCustomNote] = useState<string>('');
  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'preview' | 'history'>('preview');
  const [snapshotTick, setSnapshotTick] = useState<number>(0);

  const [sending, setSending] = useState<boolean>(false);
  const [testingBrevo, setTestingBrevo] = useState<boolean>(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sentConfirmation, setSentConfirmation] = useState<{
    referenceId: string;
    messageId: string;
    sentAt: string;
    recipients: string[];
    relayMode?: string;
    fromHeader?: string;
    previewUrl?: string | null;
  } | null>(null);
  const [brevoRelay, setBrevoRelay] = useState<{
    host: string;
    port: number;
    login: string;
    senderName: string;
    senderEmail: string;
    formattedFrom: string;
    mode: string;
    status: string;
  }>({
    host: 'smtp-relay.brevo.com',
    port: 587,
    login: '9dabe5001@smtp-brevo.com',
    senderName: 'ACCOUNTICCA x E-Lawyers',
    senderEmail: 'ekram@elawyersbd.com',
    formattedFrom: '"ACCOUNTICCA x E-Lawyers" <ekram@elawyersbd.com>',
    mode: 'brevo_smtp_relay (smtp-relay.brevo.com:587 • 9dabe5001@smtp-brevo.com)',
    status: 'ready',
  });
  const [copiedHtml, setCopiedHtml] = useState<boolean>(false);
  const [historyLogs, setHistoryLogs] = useState<SentCalculationEmailRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  useEffect(() => {
    if (userEmail) {
      setPrimaryEmail(userEmail);
    }
  }, [userEmail]);

  const fetchBrevoStatus = async () => {
    try {
      const res = await fetch('/api/email/brevo-status');
      if (res.ok) {
        const data = await res.json();
        if (data?.host) {
          setBrevoRelay({
            host: data.host || 'smtp-relay.brevo.com',
            port: Number(data.port || 587),
            login: data.login || '9dabe5001@smtp-brevo.com',
            senderName: data.senderName || 'ACCOUNTICCA x E-Lawyers',
            senderEmail: data.senderEmail || 'ekram@elawyersbd.com',
            formattedFrom:
              data.formattedFrom ||
              data.fromHeader ||
              '"ACCOUNTICCA x E-Lawyers" <ekram@elawyersbd.com>',
            mode: data.mode || 'brevo_smtp_relay',
            status: data.status || 'ready',
          });
        }
      }
    } catch {
      // Fallback to default Brevo config
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSentConfirmation(null);
      setErrorMsg(null);
      setSnapshotTick((t) => t + 1);
      void fetchBrevoStatus();
    }
  }, [isOpen]);

  const fetchHistoryLogs = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/email/calculation-logs');
      const data = await res.json();
      if (data?.success && Array.isArray(data.logs)) {
        setHistoryLogs(data.logs);
      }
      if (data?.brevoRelay?.host) {
        setBrevoRelay((prev) => ({ ...prev, ...data.brevoRelay }));
      }
    } catch {
      // Ignore network fallback
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'history') {
      void fetchHistoryLogs();
    }
  }, [isOpen, activeTab]);

  // Parse and validate CC recipients
  const parsedCcList = useMemo(() => {
    return ccInput
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [ccInput]);

  const invalidCcEmails = useMemo(() => {
    return parsedCcList.filter((email) => !EMAIL_REGEX.test(email));
  }, [parsedCcList]);

  // Extract or use provided calculation snapshot
  const baseSnapshot = useMemo(() => {
    if (customSnapshot) {
      return customSnapshot;
    }
    return extractCalculationSnapshotFromContainer(containerRef?.current || null, {
      toolId,
      toolName,
      toolCategory,
      toolPath,
      statutoryBasis,
    });
  }, [customSnapshot, containerRef, toolId, toolName, toolCategory, toolPath, statutoryBasis, snapshotTick]);

  const fullPayload: CalculationEmailPayload = useMemo(
    () => ({
      ...baseSnapshot,
      primaryRecipient: primaryEmail.trim() || defaultEmail,
      recipientName: userName || 'Verified Member',
      ccRecipients: parsedCcList.filter((e) => EMAIL_REGEX.test(e)),
      customNote,
    }),
    [baseSnapshot, primaryEmail, defaultEmail, userName, parsedCcList, customNote]
  );

  const compiledEmail = useMemo(() => buildCalculationEmailTemplate(fullPayload), [fullPayload]);

  if (!isOpen) return null;

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const targetPrimary = primaryEmail.trim();
    if (!EMAIL_REGEX.test(targetPrimary)) {
      setErrorMsg('Please enter a valid primary recipient email address.');
      return;
    }

    if (invalidCcEmails.length > 0) {
      setErrorMsg(`Invalid CC email format: ${invalidCcEmails.join(', ')}`);
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/email/send-calculation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceId: fullPayload.referenceId,
          toolId: fullPayload.toolId,
          toolName: fullPayload.toolName,
          toolCategory: fullPayload.toolCategory,
          toolPath: fullPayload.toolPath,
          primaryRecipient: targetPrimary,
          recipientName: fullPayload.recipientName,
          ccRecipients: fullPayload.ccRecipients,
          customNote: fullPayload.customNote,
          subject: compiledEmail.subject,
          html: compiledEmail.html,
          text: compiledEmail.text,
          summaryHighlight:
            fullPayload.summaryMetrics[fullPayload.summaryMetrics.length - 1]?.value ||
            `${fullPayload.inputs.length} inputs · ${fullPayload.tables.length} table(s)`,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch calculation email.');
      }

      setSentConfirmation({
        referenceId: fullPayload.referenceId,
        messageId: data.messageId || `calc-mail-${Date.now()}`,
        sentAt: new Date().toLocaleTimeString(),
        recipients: [targetPrimary, ...fullPayload.ccRecipients],
        relayMode: data.relayMode || brevoRelay.mode,
        fromHeader: data.fromHeader || brevoRelay.formattedFrom,
        previewUrl: data.previewUrl || null,
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to send calculation email right now.');
    } finally {
      setSending(false);
    }
  };

  const handleTestBrevoRelay = async () => {
    setErrorMsg(null);
    const targetPrimary = primaryEmail.trim() || defaultEmail;
    if (!EMAIL_REGEX.test(targetPrimary)) {
      setErrorMsg('Please enter a valid recipient email to test Brevo relay.');
      return;
    }
    setTestingBrevo(true);
    try {
      const res = await fetch('/api/email/brevo-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail: targetPrimary }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Brevo diagnostic test failed.');
      }
      setSentConfirmation({
        referenceId: data.referenceId || 'DIAG-BREVO',
        messageId: data.messageId || 'OK',
        sentAt: new Date().toLocaleTimeString(),
        recipients: [targetPrimary],
        relayMode: data.transport || `${brevoRelay.host}:${brevoRelay.port}`,
        fromHeader: data.fromHeader || brevoRelay.formattedFrom,
        previewUrl: data.previewUrl || null,
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not reach Brevo diagnostic endpoint.');
    } finally {
      setTestingBrevo(false);
    }
  };

  const handleResendHistoryItem = async (log: SentCalculationEmailRecord) => {
    setResendingId(log.referenceId);
    try {
      const res = await fetch(`/api/email/history/${encodeURIComponent(log.referenceId)}/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail: log.primaryRecipient }),
      });
      if (res.ok) {
        await fetchHistoryLogs();
      }
    } catch {
      // Ignore error
    } finally {
      setResendingId(null);
    }
  };

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(compiledEmail.html);
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleDownloadHtml = () => {
    const blob = new Blob([compiledEmail.html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fullPayload.referenceId}-${fullPayload.toolId}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="calc-email-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white border border-slate-300 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="bg-slate-950 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-400/40 flex items-center justify-center text-cyan-300 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {fullPayload.referenceId}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                  Brevo Relay: {brevoRelay.host}:{brevoRelay.port} ({brevoRelay.login})
                </span>
              </div>
              <h2 id="calc-email-modal-title" className="text-base sm:text-lg font-black text-white mt-0.5">
                {toolName}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                  activeTab === 'preview' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Live Email Template
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'history' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Sent Log</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close email preview modal"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {activeTab === 'preview' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
            {/* Left Control Column: Recipient, CC, Note & Dispatch */}
            <form
              onSubmit={handleSendEmail}
              className="lg:col-span-5 p-5 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-300 flex flex-col justify-between space-y-4 overflow-y-auto"
            >
              <div className="space-y-3.5">
                {/* Brevo SMTP Relay Status Card */}
                <div className="p-3 rounded-xl bg-emerald-50/90 border border-emerald-300 text-xs text-emerald-950 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-extrabold text-emerald-950">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                      <span>Brevo Transactional Mail Relay Ready</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleTestBrevoRelay}
                      disabled={testingBrevo}
                      className="px-2 py-0.5 rounded bg-emerald-800 hover:bg-emerald-900 text-white text-[10px] font-bold transition cursor-pointer disabled:opacity-50"
                    >
                      {testingBrevo ? 'Testing...' : 'Verify Relay'}
                    </button>
                  </div>
                  <div className="text-[11px] font-mono text-slate-800 leading-relaxed">
                    <div>
                      <strong>Host:</strong> {brevoRelay.host}:{brevoRelay.port} ·{' '}
                      <strong>Login:</strong> {brevoRelay.login}
                    </div>
                    <div className="truncate">
                      <strong>From:</strong> {brevoRelay.formattedFrom}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-blue-800 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-extrabold block text-slate-950">
                      Complete Statutory Report Included
                    </strong>
                    <span className="text-slate-800 font-medium">
                      Captures <strong className="font-mono">{fullPayload.inputs.length}</strong> input parameters,{' '}
                      <strong className="font-mono">{fullPayload.tables.length}</strong> statutory breakdown table(s), and{' '}
                      <strong className="font-mono">{fullPayload.legalNotes.length}</strong> compliance notes.
                    </span>
                  </div>
                </div>

                {/* Primary Recipient (Signed-in Member Email) */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-950 mb-1">
                    1. Primary Recipient (Signed-In Member Email)
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={primaryEmail}
                      onChange={(e) => setPrimaryEmail(e.target.value)}
                      readOnly={Boolean(userEmail)}
                      className={`w-full rounded-xl px-3 py-2 text-xs font-bold border ${
                        userEmail
                          ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                          : 'bg-white border-slate-300 text-slate-950 focus:ring-2 focus:ring-blue-600'
                      }`}
                    />
                    {userEmail && (
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-950">
                        Verified Member
                      </span>
                    )}
                  </div>
                </div>

                {/* Optional Custom CC Recipient */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-extrabold text-slate-950">
                      2. Optional Custom CC Recipient(s)
                    </label>
                    <span className="text-[11px] font-semibold text-slate-700">
                      Client, CFO, or Tax Advisor
                    </span>
                  </div>
                  <input
                    type="text"
                    value={ccInput}
                    onChange={(e) => setCcInput(e.target.value)}
                    placeholder="e.g. client@company.com, advisor@firm.bd"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  {invalidCcEmails.length > 0 ? (
                    <p className="text-[11px] font-bold text-rose-700 mt-1">
                      Check email format: {invalidCcEmails.join(', ')}
                    </p>
                  ) : parsedCcList.length > 0 ? (
                    <p className="text-[11px] font-bold text-emerald-800 mt-1">
                      CC ready: {parsedCcList.join(', ')}
                    </p>
                  ) : (
                    <p className="text-[11px] font-medium text-slate-700 mt-1">
                      Separate multiple CC email addresses with commas.
                    </p>
                  )}
                </div>

                {/* Optional Client / Reference Advisory Note */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-950 mb-1">
                    3. Optional Client / Reference Note (Live in Template)
                  </label>
                  <textarea
                    rows={2}
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="Add client name, TIN/BIN reference, or assessment notes..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Email Subject Preview */}
                <div className="p-2.5 rounded-xl bg-white border border-slate-300 text-xs">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 block">
                    Email Subject Line
                  </span>
                  <span className="font-mono font-bold text-slate-950 break-words">
                    {compiledEmail.subject}
                  </span>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-xs font-bold text-rose-900 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {sentConfirmation && (
                  <div className="p-3.5 rounded-xl bg-emerald-100 border border-emerald-400 text-xs text-emerald-950 space-y-1.5">
                    <div className="flex items-center gap-2 font-black text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0" />
                      <span>Dispatched via Brevo Mail Relay!</span>
                    </div>
                    <p className="font-semibold">
                      Sent to <strong className="font-mono">{sentConfirmation.recipients.join(', ')}</strong> at{' '}
                      {sentConfirmation.sentAt}.
                    </p>
                    <div className="text-[11px] font-mono font-bold text-emerald-900 space-y-0.5">
                      <div>Ref: {sentConfirmation.referenceId}</div>
                      <div className="truncate">Msg ID: {sentConfirmation.messageId}</div>
                      {sentConfirmation.relayMode && (
                        <div>Transport: {sentConfirmation.relayMode}</div>
                      )}
                    </div>
                    {sentConfirmation.previewUrl && (
                      <div className="pt-1">
                        <a
                          href={sentConfirmation.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-bold"
                        >
                          <span>Open Dispatched MIME Preview</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-300 space-y-2.5">
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-black text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {sending
                      ? 'Dispatching via Brevo SMTP...'
                      : sentConfirmation
                      ? 'Resend Calculation Report via Brevo'
                      : 'Send Calculation Report to Email'}
                  </span>
                </button>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSnapshotTick((t) => t + 1)}
                    className="px-2.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Re-capture latest inputs and breakdown from the active calculator"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-blue-700" />
                    <span>Refresh</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyHtml}
                    className="px-2.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-indigo-700" />
                    <span>{copiedHtml ? 'Copied!' : 'Copy HTML'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadHtml}
                    className="px-2.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Save HTML</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Right Column: Live HTML Email Template Preview */}
            <div className="lg:col-span-7 bg-slate-200/80 flex flex-col overflow-hidden">
              <div className="px-4 py-2.5 bg-white border-b border-slate-300 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-950">
                  <Sparkles className="w-4 h-4 text-blue-700" />
                  <span>Live HTML Email Preview (Exact Inbox Rendering)</span>
                </div>
                <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-300">
                  <button
                    type="button"
                    onClick={() => setViewportMode('desktop')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                      viewportMode === 'desktop'
                        ? 'bg-white text-slate-950 shadow-2xs'
                        : 'text-slate-700 hover:text-slate-950'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Desktop (640px)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewportMode('mobile')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                      viewportMode === 'mobile'
                        ? 'bg-white text-slate-950 shadow-2xs'
                        : 'text-slate-700 hover:text-slate-950'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Mobile (375px)</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 sm:p-5 flex justify-center">
                <div
                  className={`transition-all duration-200 w-full ${
                    viewportMode === 'mobile' ? 'max-w-[385px]' : 'max-w-[660px]'
                  }`}
                >
                  <div
                    className="rounded-2xl overflow-hidden shadow-md border border-slate-300 bg-white"
                    dangerouslySetInnerHTML={{ __html: compiledEmail.html }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Sent Calculation Email History Tab */
          <div className="p-5 flex-1 overflow-y-auto space-y-4 bg-slate-50">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-950">
                  Dispatched Calculation Email Log ({brevoRelay.host}:{brevoRelay.port})
                </h3>
                <p className="text-xs font-medium text-slate-800">
                  Audit trail of calculation statements dispatched via Brevo SMTP Relay ({brevoRelay.login}).
                </p>
              </div>
              <button
                type="button"
                onClick={fetchHistoryLogs}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-900 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Log</span>
              </button>
            </div>

            {loadingHistory ? (
              <div className="p-8 text-center text-xs font-bold text-slate-800">
                Loading dispatched calculation email history...
              </div>
            ) : historyLogs.length === 0 ? (
              <div className="bg-white border border-slate-300 rounded-2xl p-8 text-center space-y-2">
                <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                <div className="text-sm font-extrabold text-slate-950">
                  No Calculation Emails Dispatched Yet
                </div>
                <p className="text-xs font-medium text-slate-700 max-w-md mx-auto">
                  Switch to the <strong>Live Email Template</strong> tab and click{' '}
                  <strong>Send Calculation Report to Email</strong> to dispatch your first calculation statement.
                </p>
              </div>
            ) : (
              <div className="bg-white border border-slate-300 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-200 border-b border-slate-300 text-slate-950 font-black uppercase">
                      <th className="py-2.5 px-3 border-r border-slate-300">Ref ID</th>
                      <th className="py-2.5 px-3 border-r border-slate-300">Calculator Tool</th>
                      <th className="py-2.5 px-3 border-r border-slate-300">Recipients &amp; Relay</th>
                      <th className="py-2.5 px-3 border-r border-slate-300">Summary</th>
                      <th className="py-2.5 px-3 text-right">Dispatched / Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-950 font-semibold">
                    {historyLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-blue-50/40">
                        <td className="py-2.5 px-3 border-r border-slate-200 font-mono font-bold text-blue-950">
                          {log.referenceId}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-slate-950">
                          {log.toolName}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 font-mono">
                          <div>{log.primaryRecipient}</div>
                          {log.ccRecipients?.length > 0 && (
                            <div className="text-[11px] text-slate-700">
                              CC: {log.ccRecipients.join(', ')}
                            </div>
                          )}
                          <div className="text-[10px] text-emerald-800 font-bold mt-0.5">
                            {log.relayMode || `${brevoRelay.host}:${brevoRelay.port}`}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-emerald-950 font-bold">
                          {log.summaryHighlight || 'Complete Report'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-800 space-y-1">
                          <div>{new Date(log.sentAt).toLocaleString()}</div>
                          <button
                            type="button"
                            onClick={() => handleResendHistoryItem(log)}
                            disabled={resendingId === log.referenceId}
                            className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold cursor-pointer disabled:opacity-50"
                          >
                            {resendingId === log.referenceId ? 'Resending...' : 'Resend via Brevo'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalculationEmailModal;
