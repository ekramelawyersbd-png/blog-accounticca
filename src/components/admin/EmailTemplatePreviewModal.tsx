import React, { useEffect, useId, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Code2,
  Eye,
  FileText,
  Loader2,
  Mail,
  Monitor,
  RefreshCw,
  Send,
  ShieldCheck,
  Smartphone,
  SlidersHorizontal,
  User,
  X,
} from 'lucide-react';
import {
  DEFAULT_TRANSACTIONAL_EMAIL_TEMPLATES,
  renderTransactionalTemplate,
  type EmailPlaceholderDefinition,
  type TransactionalEmailCategory,
  type TransactionalEmailTemplate,
} from '../../utils/transactionalEmailTemplates';
import { dispatchFormSubmissionToast } from '../ui/FormSubmissionToast';
import { getAdminAuthHeaders } from '../../contexts/ShopAuthContext';

export interface ServerTemplatePreviewData {
  templateId: string;
  templateName: string;
  category: TransactionalEmailCategory;
  enabled: boolean;
  fromHeader: string;
  senderEmail: string;
  replyTo: string;
  toHeader: string;
  ccEmails: string[];
  subject: string;
  html: string;
  text: string;
  resolvedVariables: Record<string, string>;
  placeholderKeys: string[];
  unresolvedPlaceholders: string[];
  htmlBytes: number;
  textLength: number;
  relaySummary?: {
    host: string;
    port: number;
    login: string;
    senderName: string;
    senderEmail: string;
    formattedFrom: string;
    liveRelayActive: boolean;
    configured: boolean;
    mode: string;
    status: string;
  };
}

export interface EmailTemplateDraftOverride {
  id: string;
  name?: string;
  enabled?: boolean;
  ccAdmin?: boolean;
  subjectTemplate?: string;
  htmlTemplate?: string;
  textTemplate?: string;
  placeholders?: EmailPlaceholderDefinition[];
}

export interface EmailTemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates?: TransactionalEmailTemplate[];
  initialTemplateId?: string;
  draftOverride?: EmailTemplateDraftOverride | null;
  initialVariables?: Record<string, string>;
  initialRecipientEmail?: string;
  initialRecipientName?: string;
  onEmailSent?: (result: {
    templateId: string;
    recipientEmail: string;
    referenceId: string;
    messageId: string;
    liveDelivered: boolean;
    transport: string;
    smtpNotice?: string | null;
  }) => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const EmailTemplatePreviewModal: React.FC<EmailTemplatePreviewModalProps> = ({
  isOpen,
  onClose,
  templates: propTemplates,
  initialTemplateId,
  draftOverride,
  initialVariables,
  initialRecipientEmail = '',
  initialRecipientName = '',
  onEmailSent,
}) => {
  const headingId = useId();
  const recipientInputId = useId();
  const recipientNameId = useId();

  const availableTemplates = useMemo(
    () =>
      propTemplates && propTemplates.length > 0
        ? propTemplates
        : DEFAULT_TRANSACTIONAL_EMAIL_TEMPLATES,
    [propTemplates]
  );

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    initialTemplateId || availableTemplates[0]?.id || ''
  );
  const [recipientEmail, setRecipientEmail] = useState(initialRecipientEmail);
  const [recipientName, setRecipientName] = useState(initialRecipientName);
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [ccAdmin, setCcAdmin] = useState(true);
  const [useSampleFallback, setUseSampleFallback] = useState(true);
  const [forceSendDisabled, setForceSendDisabled] = useState(false);
  const [variables, setVariables] = useState<Record<string, string>>({});

  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');
  const [contentTab, setContentTab] = useState<'html' | 'text' | 'source'>('html');

  const [serverPreview, setServerPreview] = useState<ServerTemplatePreviewData | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [confirmReady, setConfirmReady] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendFeedback, setSendFeedback] = useState<{
    type: 'success' | 'warning' | 'error';
    title: string;
    message: string;
    details?: string;
  } | null>(null);

  // Compute the active template merged with any unsaved editor draft override
  const activeTemplate = useMemo(() => {
    const base =
      availableTemplates.find((t) => t.id === selectedTemplateId) || availableTemplates[0];
    if (!base) return null;
    if (draftOverride && draftOverride.id === base.id) {
      return {
        ...base,
        name: draftOverride.name ?? base.name,
        enabled: draftOverride.enabled ?? base.enabled,
        ccAdmin: draftOverride.ccAdmin ?? base.ccAdmin,
        subjectTemplate: draftOverride.subjectTemplate ?? base.subjectTemplate,
        htmlTemplate: draftOverride.htmlTemplate ?? base.htmlTemplate,
        textTemplate: draftOverride.textTemplate ?? base.textTemplate,
        placeholders: draftOverride.placeholders ?? base.placeholders,
      };
    }
    return base;
  }, [availableTemplates, selectedTemplateId, draftOverride]);

  // Sync state when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const nextId = initialTemplateId || availableTemplates[0]?.id || '';
    setSelectedTemplateId(nextId);
    setRecipientEmail(initialRecipientEmail);
    setRecipientName(initialRecipientName);
    setRecipientError(null);
    setConfirmReady(false);
    setSendFeedback(null);
    setPreviewError(null);
    setForceSendDisabled(false);
  }, [isOpen, initialTemplateId, initialRecipientEmail, initialRecipientName, availableTemplates]);

  // Seed placeholder values whenever activeTemplate switches
  useEffect(() => {
    if (!isOpen || !activeTemplate) return;
    setCcAdmin(activeTemplate.ccAdmin);
    const nextVars: Record<string, string> = {};
    for (const ph of activeTemplate.placeholders || []) {
      const overrideVal = initialVariables?.[ph.key];
      nextVars[ph.key] = overrideVal !== undefined ? overrideVal : ph.sampleValue;
    }
    if (initialRecipientName.trim()) {
      nextVars.clientName = initialRecipientName.trim();
    }
    if (initialRecipientEmail.trim()) {
      nextVars.clientEmail = initialRecipientEmail.trim();
    }
    setVariables(nextVars);
    setConfirmReady(false);
    setSendFeedback(null);
  }, [isOpen, activeTemplate?.id]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSending) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isSending, onClose]);

  // Build effective variable payload merging typed recipient details when blank/default
  const effectiveVariables = useMemo(() => {
    const merged: Record<string, string> = { ...variables };
    if (recipientName.trim()) {
      merged.clientName = recipientName.trim();
    }
    if (recipientEmail.trim()) {
      merged.clientEmail = recipientEmail.trim();
    }
    return merged;
  }, [variables, recipientName, recipientEmail]);

  // Immediate local fallback while server emailService preview refreshes
  const fallbackPreview = useMemo(() => {
    if (!activeTemplate) return null;
    return renderTransactionalTemplate(activeTemplate, effectiveVariables, useSampleFallback);
  }, [activeTemplate, effectiveVariables, useSampleFallback]);

  // Fetch authoritative server preview generated via `src/lib/emailService.ts`
  useEffect(() => {
    if (!isOpen || !activeTemplate) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoadingPreview(true);
      setPreviewError(null);
      try {
        const res = await fetch(`/api/email/templates/${activeTemplate.id}/preview`, {
          method: 'POST',
          headers: getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
          signal: controller.signal,
          body: JSON.stringify({
            name: activeTemplate.name,
            enabled: activeTemplate.enabled,
            ccAdmin,
            subjectTemplate: activeTemplate.subjectTemplate,
            htmlTemplate: activeTemplate.htmlTemplate,
            textTemplate: activeTemplate.textTemplate,
            placeholders: activeTemplate.placeholders,
            variables: effectiveVariables,
            useSampleFallback,
            recipientEmail: recipientEmail.trim(),
            recipientName: recipientName.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok || !data?.preview) {
          throw new Error(data?.error || 'Failed to render template preview via emailService.');
        }
        setServerPreview(data.preview as ServerTemplatePreviewData);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          setPreviewError(err?.message || 'Unable to fetch server emailService preview.');
        }
      } finally {
        setIsLoadingPreview(false);
      }
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [
    isOpen,
    activeTemplate,
    effectiveVariables,
    useSampleFallback,
    recipientEmail,
    recipientName,
    ccAdmin,
  ]);

  if (!isOpen || !activeTemplate) {
    return null;
  }

  const displayedSubject = serverPreview?.subject ?? fallbackPreview?.subject ?? '';
  const displayedHtml = serverPreview?.html ?? fallbackPreview?.html ?? '';
  const displayedText = serverPreview?.text ?? fallbackPreview?.text ?? '';
  const unresolvedList = serverPreview?.unresolvedPlaceholders ?? [];

  const handleValidateRecipient = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) {
      setRecipientError('Enter the user email address to send this template.');
      return false;
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      setRecipientError('Please enter a valid email address (e.g., client@company.com).');
      return false;
    }
    setRecipientError(null);
    return true;
  };

  const handleSendToUser = async () => {
    if (isSending) return;
    if (!handleValidateRecipient(recipientEmail)) {
      setConfirmReady(false);
      return;
    }
    if (!activeTemplate.enabled && !forceSendDisabled) {
      setSendFeedback({
        type: 'warning',
        title: 'Template is currently disabled',
        message:
          'Check "Override disabled status" below if you still want to send this template to the user.',
      });
      return;
    }

    if (!confirmReady) {
      setConfirmReady(true);
      setSendFeedback(null);
      return;
    }

    setIsSending(true);
    setSendFeedback(null);

    try {
      const res = await fetch(`/api/email/templates/${activeTemplate.id}/send`, {
        method: 'POST',
        headers: getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          name: activeTemplate.name,
          enabled: activeTemplate.enabled,
          ccAdmin,
          forceSend: forceSendDisabled,
          subjectTemplate: activeTemplate.subjectTemplate,
          htmlTemplate: activeTemplate.htmlTemplate,
          textTemplate: activeTemplate.textTemplate,
          placeholders: activeTemplate.placeholders,
          variables: effectiveVariables,
          useSampleFallback,
          recipientEmail: recipientEmail.trim(),
          recipientName: recipientName.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.liveDelivered) {
        setConfirmReady(false);
        setSendFeedback({
          type: 'success',
          title: 'Email sent via Brevo emailService',
          message:
            data.message ||
            `Delivered "${activeTemplate.name}" to ${recipientEmail.trim()}.`,
          details: `Ref: ${data.referenceId} • Message-ID: ${data.messageId} • Transport: ${data.transport}`,
        });
        dispatchFormSubmissionToast({
          title: 'Template email sent to user',
          message: `Sent "${activeTemplate.name}" via Brevo SMTP relay.`,
          referenceId: data.referenceId,
          recipientEmail: recipientEmail.trim(),
          type: 'success',
        });
        onEmailSent?.({
          templateId: activeTemplate.id,
          recipientEmail: recipientEmail.trim(),
          referenceId: data.referenceId,
          messageId: data.messageId,
          liveDelivered: true,
          transport: data.transport,
          smtpNotice: data.smtpNotice,
        });
        return;
      }

      if (res.status === 502) {
        setConfirmReady(false);
        setSendFeedback({
          type: 'warning',
          title: 'Logged in Email History · Brevo Relay Rejected Delivery',
          message:
            data.error ||
            data.smtpNotice ||
            'Brevo SMTP relay did not deliver the email.',
          details: `Ref: ${data.referenceId || 'N/A'} • Transport: ${data.transport || 'failed'}`,
        });
        dispatchFormSubmissionToast({
          title: 'Brevo relay did not deliver email',
          message: data.smtpNotice || data.error || 'Check Brevo SMTP credentials/IP.',
          referenceId: data.referenceId,
          recipientEmail: recipientEmail.trim(),
          type: 'error',
        });
        onEmailSent?.({
          templateId: activeTemplate.id,
          recipientEmail: recipientEmail.trim(),
          referenceId: data.referenceId || '',
          messageId: data.messageId || '',
          liveDelivered: false,
          transport: data.transport || 'failed',
          smtpNotice: data.smtpNotice,
        });
        return;
      }

      setSendFeedback({
        type: 'error',
        title: 'Could not send email',
        message: data?.error || data?.message || 'Unexpected error sending template.',
      });
    } catch (err: any) {
      setSendFeedback({
        type: 'error',
        title: 'Network error',
        message: err?.message || 'Failed to connect to the email dispatch endpoint.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-6 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSending) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-900 px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Admin Email Template Preview &amp; Dispatch</span>
              </span>
              {serverPreview?.relaySummary && (
                <span className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-300">
                  {serverPreview.relaySummary.mode}
                </span>
              )}
              {draftOverride && draftOverride.id === activeTemplate.id && (
                <span className="rounded border border-amber-400/40 bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-200">
                  Includes Unsaved Editor Draft
                </span>
              )}
            </div>
            <h2 id={headingId} className="truncate text-lg font-extrabold text-white">
              {activeTemplate.name}
            </h2>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <label className="sr-only" htmlFor="modal-template-select">
              Switch email template
            </label>
            <select
              id="modal-template-select"
              value={activeTemplate.id}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              disabled={isSending}
              className="max-w-[230px] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-white focus:border-emerald-500 focus:outline-none"
            >
              {availableTemplates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  [{tpl.category.toUpperCase()}] {tpl.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              aria-label="Close template preview modal"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300 transition hover:bg-slate-700 hover:text-white disabled:opacity-50 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body Split Layout */}
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-12 lg:overflow-hidden">
          {/* Left Panel: Recipient, Delivery Controls & Placeholder Values */}
          <div className="space-y-5 border-b border-slate-200 bg-slate-50/70 p-5 lg:col-span-4 lg:overflow-y-auto lg:border-b-0 lg:border-r">
            {/* Target User Section */}
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  1. Recipient Details
                </h3>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                    activeTemplate.enabled
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {activeTemplate.enabled ? 'Template Active' : 'Template Disabled'}
                </span>
              </div>

              <div>
                <label
                  htmlFor={recipientInputId}
                  className="block text-xs font-semibold text-slate-700"
                >
                  User Email Address <span className="text-rose-600">*</span>
                </label>
                <div className="relative mt-1">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id={recipientInputId}
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => {
                      setRecipientEmail(e.target.value);
                      if (recipientError) handleValidateRecipient(e.target.value);
                      setConfirmReady(false);
                    }}
                    onBlur={() => {
                      if (recipientEmail.trim()) handleValidateRecipient(recipientEmail);
                    }}
                    placeholder="client@company.com"
                    aria-invalid={Boolean(recipientError)}
                    className={`w-full rounded-xl border bg-white py-2 pl-9 pr-3 text-xs text-slate-900 focus:outline-none focus:ring-3 ${
                      recipientError
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                        : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-600/10'
                    }`}
                  />
                </div>
                {recipientError && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600">{recipientError}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor={recipientNameId}
                  className="block text-xs font-semibold text-slate-700"
                >
                  Recipient Name <span className="font-normal text-slate-400">(Optional)</span>
                </label>
                <div className="relative mt-1">
                  <User
                    className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id={recipientNameId}
                    type="text"
                    value={recipientName}
                    onChange={(e) => {
                      setRecipientName(e.target.value);
                      setConfirmReady(false);
                    }}
                    placeholder="e.g. Nadia Rahman"
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-3 focus:ring-emerald-600/10"
                  />
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-2.5">
                <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={ccAdmin}
                    onChange={(e) => {
                      setCcAdmin(e.target.checked);
                      setConfirmReady(false);
                    }}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    CC firm desk ({serverPreview?.senderEmail || 'ekram@elawyersbd.com'})
                  </span>
                </label>

                <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={useSampleFallback}
                    onChange={(e) => {
                      setUseSampleFallback(e.target.checked);
                      setConfirmReady(false);
                    }}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Fill empty placeholders with sample values</span>
                </label>

                {!activeTemplate.enabled && (
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-amber-800">
                    <input
                      type="checkbox"
                      checked={forceSendDisabled}
                      onChange={(e) => setForceSendDisabled(e.target.checked)}
                      className="rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                    />
                    <span>Override disabled status to send anyway</span>
                  </label>
                )}
              </div>
            </div>

            {/* Dynamic Placeholders Section */}
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <h3 className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                  <span>2. Template Placeholders ({activeTemplate.placeholders.length})</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    const reset: Record<string, string> = {};
                    for (const ph of activeTemplate.placeholders || []) {
                      reset[ph.key] = ph.sampleValue;
                    }
                    setVariables(reset);
                    setConfirmReady(false);
                  }}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                >
                  Reset Samples
                </button>
              </div>

              <div className="max-h-64 space-y-2.5 overflow-y-auto pr-1">
                {activeTemplate.placeholders.map((ph) => {
                  const isManagedByRecipient =
                    (ph.key === 'clientName' && Boolean(recipientName.trim())) ||
                    (ph.key === 'clientEmail' && Boolean(recipientEmail.trim()));

                  return (
                    <div key={ph.key} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <label
                          htmlFor={`modal-ph-${ph.key}`}
                          className="text-[11px] font-bold text-slate-700"
                        >
                          {ph.label}
                        </label>
                        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-emerald-800">
                          {ph.token}
                        </code>
                      </div>
                      <input
                        id={`modal-ph-${ph.key}`}
                        type="text"
                        value={effectiveVariables[ph.key] ?? ''}
                        disabled={isManagedByRecipient}
                        onChange={(e) => {
                          setVariables((prev) => ({ ...prev, [ph.key]: e.target.value }));
                          setConfirmReady(false);
                        }}
                        placeholder={ph.sampleValue}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                      />
                    </div>
                  );
                })}
              </div>

              {unresolvedList.length > 0 && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-900">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />
                  <span>
                    Unresolved tokens:{' '}
                    <strong className="font-mono">
                      {unresolvedList.map((k) => `{{${k}}}`).join(', ')}
                    </strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Server-Rendered emailService Preview */}
          <div className="flex min-h-0 flex-col bg-slate-100/70 lg:col-span-8 lg:overflow-hidden">
            {/* Preview Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-5 py-3">
              <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setContentTab('html')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer ${
                    contentTab === 'html'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5 text-emerald-600" />
                  <span>HTML Preview</span>
                </button>
                <button
                  type="button"
                  onClick={() => setContentTab('text')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer ${
                    contentTab === 'text'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Plain-Text</span>
                </button>
                <button
                  type="button"
                  onClick={() => setContentTab('source')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer ${
                    contentTab === 'source'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Code2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Interpolated HTML</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {contentTab === 'html' && (
                  <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-0.5">
                    <button
                      type="button"
                      onClick={() => setViewportMode('desktop')}
                      aria-label="Desktop email preview"
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                        viewportMode === 'desktop'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Monitor className="h-3.5 w-3.5" />
                      <span>Desktop</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewportMode('mobile')}
                      aria-label="Mobile email preview"
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                        viewportMode === 'mobile'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Smartphone className="h-3.5 w-3.5" />
                      <span>Mobile</span>
                    </button>
                  </div>
                )}

                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-mono text-slate-600">
                  {isLoadingPreview ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin text-emerald-600" />
                      <span>Syncing emailService...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      <span>
                        {serverPreview
                          ? `${(serverPreview.htmlBytes / 1024).toFixed(1)} KB`
                          : 'Ready'}
                      </span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Envelope Header Summary */}
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs space-y-1">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-slate-400">From:</span>
                  <span className="truncate font-mono text-slate-700">
                    {serverPreview?.fromHeader || '"ACCOUNTICCA x E-Lawyers" <ekram@elawyersbd.com>'}
                  </span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-slate-400">To:</span>
                  <span className="truncate font-mono text-slate-800">
                    {serverPreview?.toHeader || recipientEmail.trim() || '(Select recipient email)'}
                  </span>
                </div>
                {serverPreview && serverPreview.ccEmails.length > 0 && (
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-slate-400">CC:</span>
                    <span className="truncate font-mono text-slate-600">
                      {serverPreview.ccEmails.join(', ')}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="shrink-0 font-bold text-slate-400">Subject:</span>
                <span className="font-bold text-slate-900">{displayedSubject}</span>
              </div>
              {previewError && (
                <p className="text-[11px] font-medium text-amber-700">
                  Server preview notice: {previewError} (showing local interpolation)
                </p>
              )}
            </div>

            {/* Preview Canvas */}
            <div className="min-h-[380px] flex-1 overflow-y-auto p-4 sm:p-5">
              {contentTab === 'html' && (
                <div
                  className={`mx-auto transition-all duration-200 ${
                    viewportMode === 'mobile' ? 'max-w-[385px]' : 'w-full'
                  }`}
                >
                  <iframe
                    title={`EmailPreview-${activeTemplate.id}`}
                    srcDoc={displayedHtml}
                    sandbox="allow-same-origin"
                    className="h-[460px] w-full rounded-2xl border border-slate-200 bg-white shadow-xs"
                  />
                </div>
              )}

              {contentTab === 'text' && (
                <pre className="whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white p-5 font-mono text-xs leading-relaxed text-slate-800 shadow-2xs">
                  {displayedText || '(No plain-text fallback content defined)'}
                </pre>
              )}

              {contentTab === 'source' && (
                <pre className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 p-5 font-mono text-xs leading-relaxed text-emerald-200">
                  {displayedHtml}
                </pre>
              )}
            </div>
          </div>
        </div>

        {/* Footer Action Bar */}
        <div className="border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
          {sendFeedback && (
            <div
              role={sendFeedback.type === 'error' ? 'alert' : 'status'}
              className={`mb-3 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-xs ${
                sendFeedback.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                  : sendFeedback.type === 'warning'
                    ? 'border-amber-200 bg-amber-50 text-amber-950'
                    : 'border-rose-200 bg-rose-50 text-rose-950'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {sendFeedback.type === 'success' ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                ) : sendFeedback.type === 'warning' ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                )}
                <div className="space-y-0.5">
                  <p className="font-bold">{sendFeedback.title}</p>
                  <p>{sendFeedback.message}</p>
                  {sendFeedback.details && (
                    <p className="font-mono text-[11px] opacity-80">{sendFeedback.details}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSendFeedback(null)}
                className="text-[11px] font-bold opacity-70 hover:opacity-100 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-slate-600">
              {confirmReady ? (
                <span className="font-semibold text-emerald-800">
                  Ready to dispatch to <strong className="font-mono">{recipientEmail.trim()}</strong>{' '}
                  via Brevo SMTP. Click again to confirm send.
                </span>
              ) : (
                <span>
                  Preview rendered via <code className="font-mono text-slate-800">emailService</code>.
                  Verify recipient and placeholders before sending.
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSending}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                Close
              </button>

              {confirmReady && (
                <button
                  type="button"
                  onClick={() => setConfirmReady(false)}
                  disabled={isSending}
                  className="rounded-xl border border-slate-300 bg-slate-100 px-3.5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200 cursor-pointer"
                >
                  Cancel Confirm
                </button>
              )}

              <button
                type="button"
                onClick={handleSendToUser}
                disabled={isSending}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black text-white shadow-sm transition disabled:opacity-60 cursor-pointer ${
                  confirmReady
                    ? 'bg-emerald-700 hover:bg-emerald-800'
                    : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    <span>Sending via Brevo...</span>
                  </>
                ) : confirmReady ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Confirm &amp; Send to User</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                    <span>Send Template to User</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplatePreviewModal;
