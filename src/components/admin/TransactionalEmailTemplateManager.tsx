import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Mail,
  Code2,
  Eye,
  Save,
  RotateCcw,
  Send,
  Plus,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  UserPlus,
  Calendar,
  CreditCard,
  RefreshCw,
  Trash2,
  FileCode2,
  Columns2
} from 'lucide-react';
import {
  DEFAULT_TRANSACTIONAL_EMAIL_TEMPLATES,
  renderTransactionalTemplate,
  extractTemplatePlaceholderKeys,
  type TransactionalEmailTemplate,
  type TransactionalEmailCategory,
  type EmailPlaceholderDefinition
} from '../../utils/transactionalEmailTemplates';

interface BrevoRelaySummary {
  host: string;
  port: number;
  login: string;
  senderName: string;
  senderEmail: string;
  formattedFrom: string;
  liveRelayActive: boolean;
}

const CATEGORY_META: Record<
  TransactionalEmailCategory | 'all',
  { label: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  all: {
    label: 'All Templates',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    icon: Mail
  },
  registration: {
    label: 'Registration Emails',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: UserPlus
  },
  booking: {
    label: 'Booking Emails',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    icon: Calendar
  },
  payment: {
    label: 'Payment Emails',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-200',
    icon: CreditCard
  }
};

export const TransactionalEmailTemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<TransactionalEmailTemplate[]>(
    DEFAULT_TRANSACTIONAL_EMAIL_TEMPLATES
  );
  const [selectedCategory, setSelectedCategory] = useState<TransactionalEmailCategory | 'all'>('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    DEFAULT_TRANSACTIONAL_EMAIL_TEMPLATES[0].id
  );
  const [brevoRelay, setBrevoRelay] = useState<BrevoRelaySummary>({
    host: 'smtp-relay.brevo.com',
    port: 587,
    login: '9dabe5001@smtp-brevo.com',
    senderName: 'ACCOUNTICCA x E-Lawyers',
    senderEmail: 'ekram@elawyersbd.com',
    formattedFrom: '"ACCOUNTICCA x E-Lawyers" <ekram@elawyersbd.com>',
    liveRelayActive: true
  });

  // Editor state for the active template
  const [nameInput, setNameInput] = useState('');
  const [subjectInput, setSubjectInput] = useState('');
  const [htmlInput, setHtmlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [enabledInput, setEnabledInput] = useState(true);
  const [ccAdminInput, setCcAdminInput] = useState(true);
  const [placeholdersList, setPlaceholdersList] = useState<EmailPlaceholderDefinition[]>([]);
  const [sampleValues, setSampleValues] = useState<Record<string, string>>({});

  // Custom placeholder creation state
  const [newPhKey, setNewPhKey] = useState('');
  const [newPhLabel, setNewPhLabel] = useState('');
  const [newPhSample, setNewPhSample] = useState('');
  const [showAddPlaceholder, setShowAddPlaceholder] = useState(false);

  // View & interaction state
  const [editorViewMode, setEditorViewMode] = useState<'split' | 'code' | 'preview'>('split');
  const [activeCodeTab, setActiveCodeTab] = useState<'html' | 'text' | 'placeholders'>('html');
  const [lastFocusedField, setLastFocusedField] = useState<'subject' | 'html' | 'text'>('html');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [testRecipient, setTestRecipient] = useState('ekram@elawyersbd.com');

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
    details?: string;
  } | null>(null);

  const subjectRef = useRef<HTMLInputElement | null>(null);
  const htmlTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const textTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const loadTemplatesFromServer = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/email/templates');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.templates) && data.templates.length > 0) {
          setTemplates(data.templates);
        }
        if (data.brevoRelay) {
          setBrevoRelay(data.brevoRelay);
        }
      }
    } catch (err) {
      console.warn('Using local fallback templates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplatesFromServer();
  }, []);

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === 'all') return templates;
    return templates.filter((t) => t.category === selectedCategory);
  }, [templates, selectedCategory]);

  const activeTemplate = useMemo(() => {
    return (
      templates.find((t) => t.id === selectedTemplateId) ||
      filteredTemplates[0] ||
      templates[0]
    );
  }, [templates, selectedTemplateId, filteredTemplates]);

  // Synchronize editor inputs whenever activeTemplate changes
  useEffect(() => {
    if (!activeTemplate) return;
    setNameInput(activeTemplate.name);
    setSubjectInput(activeTemplate.subjectTemplate);
    setHtmlInput(activeTemplate.htmlTemplate);
    setTextInput(activeTemplate.textTemplate);
    setEnabledInput(activeTemplate.enabled);
    setCcAdminInput(activeTemplate.ccAdmin);
    setPlaceholdersList(activeTemplate.placeholders || []);

    const initialSamples: Record<string, string> = {};
    for (const ph of activeTemplate.placeholders || []) {
      initialSamples[ph.key] = ph.sampleValue;
    }
    setSampleValues(initialSamples);
  }, [activeTemplate?.id]);

  // Auto-detect any {{token}} typed in subject/html/text that isn't yet in placeholdersList
  const detectedTokensInCode = useMemo(() => {
    return extractTemplatePlaceholderKeys(subjectInput, htmlInput, textInput);
  }, [subjectInput, htmlInput, textInput]);

  // Live rendered preview
  const liveRendered = useMemo(() => {
    return renderTransactionalTemplate(
      {
        subjectTemplate: subjectInput,
        htmlTemplate: htmlInput,
        textTemplate: textInput,
        placeholders: placeholdersList
      },
      sampleValues,
      true
    );
  }, [subjectInput, htmlInput, textInput, placeholdersList, sampleValues]);

  // Insert placeholder token at cursor position in active field
  const handleInsertPlaceholder = (token: string) => {
    navigator.clipboard?.writeText(token).catch(() => {});
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 1800);

    if (lastFocusedField === 'subject' && subjectRef.current) {
      const el = subjectRef.current;
      const start = el.selectionStart ?? subjectInput.length;
      const end = el.selectionEnd ?? subjectInput.length;
      const next = subjectInput.slice(0, start) + token + subjectInput.slice(end);
      setSubjectInput(next);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + token.length, start + token.length);
      }, 10);
      return;
    }

    if (lastFocusedField === 'text' && textTextareaRef.current && activeCodeTab === 'text') {
      const el = textTextareaRef.current;
      const start = el.selectionStart ?? textInput.length;
      const end = el.selectionEnd ?? textInput.length;
      const next = textInput.slice(0, start) + token + textInput.slice(end);
      setTextInput(next);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + token.length, start + token.length);
      }, 10);
      return;
    }

    if (htmlTextareaRef.current) {
      if (activeCodeTab !== 'html') {
        setActiveCodeTab('html');
      }
      const el = htmlTextareaRef.current;
      const start = el.selectionStart ?? htmlInput.length;
      const end = el.selectionEnd ?? htmlInput.length;
      const next = htmlInput.slice(0, start) + token + htmlInput.slice(end);
      setHtmlInput(next);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + token.length, start + token.length);
      }, 10);
    } else {
      setHtmlInput((prev) => `${prev}${token}`);
    }
  };

  const handleAddCustomPlaceholder = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = newPhKey.trim().replace(/[^a-zA-Z0-9_]/g, '');
    if (!cleanKey) return;

    const token = `{{${cleanKey}}}`;
    const newDef: EmailPlaceholderDefinition = {
      key: cleanKey,
      token,
      label: newPhLabel.trim() || cleanKey,
      description: `Custom placeholder ${token}`,
      sampleValue: newPhSample.trim() || `[Sample ${cleanKey}]`,
      isCustom: true
    };

    setPlaceholdersList((prev) => {
      const filtered = prev.filter((p) => p.key !== cleanKey);
      return [...filtered, newDef];
    });
    setSampleValues((prev) => ({
      ...prev,
      [cleanKey]: newDef.sampleValue
    }));

    setNewPhKey('');
    setNewPhLabel('');
    setNewPhSample('');
    setShowAddPlaceholder(false);
    setFeedback({
      type: 'success',
      text: `Added placeholder ${token}. Click its chip to insert into the HTML or Subject template.`
    });
  };

  const handleRemoveCustomPlaceholder = (key: string) => {
    setPlaceholdersList((prev) => prev.filter((p) => p.key !== key));
  };

  const handleSaveTemplate = async () => {
    if (!activeTemplate) return;
    setIsSaving(true);
    setFeedback(null);

    const updatedPlaceholders = placeholdersList.map((p) => ({
      ...p,
      sampleValue: sampleValues[p.key] ?? p.sampleValue
    }));

    try {
      const res = await fetch(`/api/email/templates/${activeTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameInput,
          enabled: enabledInput,
          ccAdmin: ccAdminInput,
          subjectTemplate: subjectInput,
          htmlTemplate: htmlInput,
          textTemplate: textInput,
          placeholders: updatedPlaceholders
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save template');
      }

      const savedTpl: TransactionalEmailTemplate = data.template;
      setTemplates((prev) => prev.map((t) => (t.id === savedTpl.id ? savedTpl : t)));
      setPlaceholdersList(savedTpl.placeholders);
      setFeedback({
        type: 'success',
        text: data.message || `Saved "${savedTpl.name}" successfully. All live Brevo dispatches now use this template.`
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Could not save email template.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetTemplate = async (resetAll = false) => {
    if (!activeTemplate && !resetAll) return;
    setIsResetting(true);
    setFeedback(null);

    const targetId = resetAll ? 'all' : activeTemplate.id;
    try {
      const res = await fetch(`/api/email/templates/${targetId}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset template');
      }

      if (resetAll && Array.isArray(data.templates)) {
        setTemplates(data.templates);
        const current = data.templates.find((t: TransactionalEmailTemplate) => t.id === activeTemplate.id) || data.templates[0];
        if (current) {
          setNameInput(current.name);
          setSubjectInput(current.subjectTemplate);
          setHtmlInput(current.htmlTemplate);
          setTextInput(current.textTemplate);
          setEnabledInput(current.enabled);
          setCcAdminInput(current.ccAdmin);
          setPlaceholdersList(current.placeholders);
        }
      } else if (data.template) {
        const resetTpl: TransactionalEmailTemplate = data.template;
        setTemplates((prev) => prev.map((t) => (t.id === resetTpl.id ? resetTpl : t)));
        setNameInput(resetTpl.name);
        setSubjectInput(resetTpl.subjectTemplate);
        setHtmlInput(resetTpl.htmlTemplate);
        setTextInput(resetTpl.textTemplate);
        setEnabledInput(resetTpl.enabled);
        setCcAdminInput(resetTpl.ccAdmin);
        setPlaceholdersList(resetTpl.placeholders);
        const initialSamples: Record<string, string> = {};
        for (const ph of resetTpl.placeholders || []) {
          initialSamples[ph.key] = ph.sampleValue;
        }
        setSampleValues(initialSamples);
      }

      setFeedback({
        type: 'success',
        text: data.message || 'Template restored to factory default HTML and placeholders.'
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Failed to reset template.'
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!activeTemplate) return;
    if (!testRecipient.trim() || !testRecipient.includes('@')) {
      setFeedback({
        type: 'error',
        text: 'Please enter a valid recipient email address for the test dispatch.'
      });
      return;
    }

    setIsSendingTest(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/email/templates/${activeTemplate.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: testRecipient.trim(),
          subjectTemplate: subjectInput,
          htmlTemplate: htmlInput,
          textTemplate: textInput,
          placeholders: placeholdersList,
          variables: sampleValues
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch test email');
      }

      setFeedback({
        type: 'success',
        text: data.message || `Test email sent to ${testRecipient} via Brevo SMTP Relay.`,
        details: `Message-ID: ${data.messageId} • From: ${data.fromHeader} • Transport: ${data.transport}`
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Failed to send test email via Brevo SMTP.'
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Brevo SMTP Relay Status & Global Actions Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <span>Brevo Transactional Email Template Manager</span>
            </span>
            <span className="text-xs font-mono text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">
              {brevoRelay.host}:{brevoRelay.port} ({brevoRelay.login})
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white">
            Customize Registration, Booking &amp; Payment HTML Emails
          </h2>
          <p className="text-xs text-slate-300 max-w-3xl">
            Edit the HTML layout, subject line, and dynamic <code className="text-emerald-300 font-mono">{'{{placeholders}}'}</code> for all automated emails dispatched from{' '}
            <strong className="text-white font-mono">{brevoRelay.formattedFrom}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={loadTemplatesFromServer}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>
          <button
            type="button"
            onClick={() => handleResetTemplate(true)}
            disabled={isResetting}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/80 text-slate-200 hover:text-rose-200 text-xs font-bold border border-slate-700 hover:border-rose-800 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All to Defaults</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-rose-50 border-rose-200 text-rose-950'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
            {feedback.details && (
              <div className="text-[11px] font-mono text-slate-600 pl-6">{feedback.details}</div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 self-end sm:self-center cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'registration', 'booking', 'payment'] as const).map((cat) => {
            const meta = CATEGORY_META[cat];
            const Icon = meta.icon;
            const count =
              cat === 'all'
                ? templates.length
                : templates.filter((t) => t.category === cat).length;
            const isSelected = selectedCategory === cat;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  const matching =
                    cat === 'all' ? templates : templates.filter((t) => t.category === cat);
                  if (matching.length > 0 && !matching.some((m) => m.id === selectedTemplateId)) {
                    setSelectedTemplateId(matching[0].id);
                  }
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{meta.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                    isSelected ? 'bg-slate-800 text-emerald-300' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setEditorViewMode('split')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
              editorViewMode === 'split'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Columns2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Split Editor &amp; Preview</span>
          </button>
          <button
            type="button"
            onClick={() => setEditorViewMode('code')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
              editorViewMode === 'code'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>HTML Editor</span>
          </button>
          <button
            type="button"
            onClick={() => setEditorViewMode('preview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
              editorViewMode === 'preview'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-emerald-600" />
            <span>Full Preview</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Template List (3 cols) + Right Editor & Preview (9 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Template Selector */}
        <div className="lg:col-span-3 space-y-3">
          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500 px-1">
            Select Email Template ({filteredTemplates.length})
          </div>
          <div className="space-y-2.5">
            {filteredTemplates.map((tpl) => {
              const isSelected = activeTemplate?.id === tpl.id;
              const catMeta = CATEGORY_META[tpl.category];
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                      : 'bg-white text-slate-900 border-slate-200 hover:border-emerald-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : catMeta.badgeClass
                      }`}
                    >
                      {tpl.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        tpl.enabled
                          ? isSelected
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {tpl.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <div className="font-bold text-sm leading-snug">{tpl.name}</div>
                  <div
                    className={`text-[11px] line-clamp-2 ${
                      isSelected ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {tpl.description}
                  </div>
                  <div
                    className={`text-[10px] font-mono pt-1 flex items-center justify-between ${
                      isSelected ? 'text-slate-400' : 'text-slate-400'
                    }`}
                  >
                    <span>{tpl.placeholders.length} placeholders</span>
                    <span>{tpl.triggerEvent.split('(')[0].trim()}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Workspace: Template Configuration, Placeholders, HTML Editor & Live Preview */}
        {activeTemplate && (
          <div className="lg:col-span-9 space-y-6">
            {/* Template Metadata & Subject Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border ${
                        CATEGORY_META[activeTemplate.category].badgeClass
                      }`}
                    >
                      {activeTemplate.category} template
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      ID: {activeTemplate.id}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="text-lg font-black text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-600 focus:outline-none w-full sm:w-96"
                  />
                  <p className="text-xs text-slate-500">
                    Trigger Event: <strong className="text-slate-700">{activeTemplate.triggerEvent}</strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enabledInput}
                      onChange={(e) => setEnabledInput(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Template Enabled</span>
                  </label>

                  <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ccAdminInput}
                      onChange={(e) => setCcAdminInput(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>CC Firm Desk ({brevoRelay.senderEmail})</span>
                  </label>
                </div>
              </div>

              {/* Email Subject Line Editor */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Email Subject Line Template (Supports {'{{placeholders}}'})
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Click any placeholder chip below to insert at cursor
                  </span>
                </div>
                <input
                  ref={subjectRef}
                  type="text"
                  value={subjectInput}
                  onFocus={() => setLastFocusedField('subject')}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  placeholder="Enter email subject line with {{placeholders}}..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono text-xs sm:text-sm font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Dynamic Placeholders Bar (1-Click Insertion) */}
              <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-xs font-extrabold text-slate-800">
                      Available Placeholders ({placeholdersList.length})
                    </span>
                    <span className="text-[11px] text-slate-500">
                      — Click a placeholder to insert into{' '}
                      <strong className="text-emerald-700 uppercase">{lastFocusedField}</strong> &amp; copy
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveCodeTab(activeCodeTab === 'placeholders' ? 'html' : 'placeholders')}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                    >
                      {activeCodeTab === 'placeholders' ? 'Back to HTML Editor' : 'Edit Sample Test Values'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddPlaceholder((prev) => !prev)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Custom Placeholder</span>
                    </button>
                  </div>
                </div>

                {/* Add Custom Placeholder Inline Form */}
                {showAddPlaceholder && (
                  <form
                    onSubmit={handleAddCustomPlaceholder}
                    className="p-3 bg-white rounded-xl border border-emerald-200 grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end"
                  >
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Placeholder Key *
                      </label>
                      <input
                        type="text"
                        required
                        value={newPhKey}
                        onChange={(e) => setNewPhKey(e.target.value)}
                        placeholder="e.g. zoomLink"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Display Label
                      </label>
                      <input
                        type="text"
                        value={newPhLabel}
                        onChange={(e) => setNewPhLabel(e.target.value)}
                        placeholder="e.g. Zoom Meeting Link"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Sample Preview Value
                      </label>
                      <input
                        type="text"
                        value={newPhSample}
                        onChange={(e) => setNewPhSample(e.target.value)}
                        placeholder="e.g. https://meet.google.com/abc"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="submit"
                        className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Add {'{{Key}}'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddPlaceholder(false)}
                        className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Placeholder Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {placeholdersList.map((ph) => {
                    const isUsed = detectedTokensInCode.includes(ph.key);
                    const isCopied = copiedToken === ph.token;
                    return (
                      <button
                        key={ph.key}
                        type="button"
                        onClick={() => handleInsertPlaceholder(ph.token)}
                        title={`${ph.label}: ${ph.description}\nSample: ${sampleValues[ph.key] ?? ph.sampleValue}\nClick to insert ${ph.token}`}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold inline-flex items-center gap-1.5 border transition-all cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : isUsed
                            ? 'bg-white text-slate-800 border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        <span>{ph.token}</span>
                        {isCopied ? (
                          <Check className="w-3 h-3 text-white" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Editor & Live Preview Split Container */}
            <div
              className={`grid grid-cols-1 ${
                editorViewMode === 'split' ? 'xl:grid-cols-2' : ''
              } gap-6 items-start`}
            >
              {/* Left Column: HTML / Plain-Text / Sample Values Editor */}
              {editorViewMode !== 'preview' && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs flex flex-col">
                  {/* Editor Sub-Tabs */}
                  <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between gap-2 border-b border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setActiveCodeTab('html')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                          activeCodeTab === 'html'
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <FileCode2 className="w-3.5 h-3.5" />
                        <span>HTML Content</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveCodeTab('text')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                          activeCodeTab === 'text'
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>Plain-Text Fallback</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveCodeTab('placeholders')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                          activeCodeTab === 'placeholders'
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Placeholder Values ({placeholdersList.length})</span>
                      </button>
                    </div>

                    <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                      UTF-8 • Brevo MIME
                    </span>
                  </div>

                  {/* Tab 1: HTML Code Editor */}
                  {activeCodeTab === 'html' && (
                    <div className="p-0">
                      <textarea
                        ref={htmlTextareaRef}
                        value={htmlInput}
                        onFocus={() => setLastFocusedField('html')}
                        onChange={(e) => setHtmlInput(e.target.value)}
                        rows={24}
                        spellCheck={false}
                        className="w-full p-4 font-mono text-xs leading-relaxed bg-slate-950 text-emerald-100 focus:outline-none resize-y min-h-[480px]"
                        placeholder="Paste or edit transactional HTML email content with {{placeholders}}..."
                      />
                    </div>
                  )}

                  {/* Tab 2: Plain Text Fallback Editor */}
                  {activeCodeTab === 'text' && (
                    <div className="p-0">
                      <textarea
                        ref={textTextareaRef}
                        value={textInput}
                        onFocus={() => setLastFocusedField('text')}
                        onChange={(e) => setTextInput(e.target.value)}
                        rows={20}
                        spellCheck={false}
                        className="w-full p-4 font-mono text-xs leading-relaxed bg-slate-950 text-slate-100 focus:outline-none resize-y min-h-[480px]"
                        placeholder="Plain-text fallback version for non-HTML mail clients..."
                      />
                    </div>
                  )}

                  {/* Tab 3: Placeholder Sample Values Editor */}
                  {activeCodeTab === 'placeholders' && (
                    <div className="p-5 space-y-3 max-h-[520px] overflow-y-auto">
                      <div className="text-xs text-slate-600 pb-2 border-b border-slate-100">
                        Customize sample values below to test how dynamic data interpolates in the live preview and test dispatches.
                      </div>
                      {placeholdersList.map((ph) => (
                        <div
                          key={ph.key}
                          className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                        >
                          <div className="sm:col-span-5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {ph.token}
                              </span>
                              <span className="text-xs font-bold text-slate-800">{ph.label}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{ph.description}</div>
                          </div>
                          <div className="sm:col-span-6">
                            <input
                              type="text"
                              value={sampleValues[ph.key] ?? ph.sampleValue}
                              onChange={(e) =>
                                setSampleValues((prev) => ({
                                  ...prev,
                                  [ph.key]: e.target.value
                                }))
                              }
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 focus:outline-none focus:border-emerald-600"
                            />
                          </div>
                          <div className="sm:col-span-1 text-right">
                            {ph.isCustom && (
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomPlaceholder(ph.key)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                                title="Remove custom placeholder"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Right Column: Live Rendered HTML Email Preview */}
              {editorViewMode !== 'code' && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs flex flex-col">
                  <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Live Brevo Rendered Preview</span>
                      </span>
                      <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                        Real-Time Placeholder Interpolation
                      </span>
                    </div>
                    <div className="text-xs bg-white p-2.5 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-slate-400 font-bold w-14 shrink-0">From:</span>
                        <span className="font-mono text-slate-700 truncate">
                          {brevoRelay.formattedFrom}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-slate-400 font-bold w-14 shrink-0">Subject:</span>
                        <span className="font-bold text-slate-900">{liveRendered.subject}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-200/50 p-3 flex-1">
                    <iframe
                      title={`Preview-${activeTemplate.id}`}
                      srcDoc={liveRendered.html}
                      className="w-full min-h-[480px] bg-white rounded-xl border border-slate-200"
                      sandbox="allow-same-origin"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Action Bar: Save, Reset & Live Test Dispatch via Brevo */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xs">
              {/* Left: Save & Reset Template */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black inline-flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving Template...' : 'Save Template Changes'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleResetTemplate(false)}
                  disabled={isResetting}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isResetting ? 'Resetting...' : 'Reset This Template'}</span>
                </button>
              </div>

              {/* Right: Send Live Test Email via Brevo */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1 sm:w-64">
                  <input
                    type="email"
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    placeholder="Test recipient email..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={isSendingTest}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-black inline-flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {isSendingTest ? 'Sending via Brevo...' : 'Send Live Test via Brevo'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionalEmailTemplateManager;
