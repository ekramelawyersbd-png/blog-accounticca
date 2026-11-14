import React, { useRef, useState } from 'react';
import {
  LayoutTemplate,
  Type,
  TableProperties,
  BellRing,
  MousePointerClick,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Sparkles,
  Check,
  Copy,
} from 'lucide-react';
import {
  type DynamicEmailBuilderConfig,
  type EmailBuilderDetailRow,
  type EmailCalloutTone,
  type EmailHeaderTheme,
} from '../../utils/emailTemplateBuilder';
import type { EmailPlaceholderDefinition } from '../../utils/transactionalEmailTemplates';

export interface ActiveBuilderInsertionTarget {
  fieldLabel: string;
  insert: (token: string) => void;
}

interface DynamicEmailBuilderProps {
  config: DynamicEmailBuilderConfig;
  placeholders: EmailPlaceholderDefinition[];
  onChange: (nextConfig: DynamicEmailBuilderConfig) => void;
  onRegisterInsertionTarget: (target: ActiveBuilderInsertionTarget) => void;
  hasManualHtmlEdits?: boolean;
  onSyncBuilderToHtml?: () => void;
}

const THEME_OPTIONS: Array<{
  value: EmailHeaderTheme;
  label: string;
  swatchClass: string;
}> = [
  { value: 'emerald', label: 'Chambers Emerald', swatchClass: 'bg-emerald-700' },
  { value: 'slate', label: 'Executive Navy', swatchClass: 'bg-slate-900' },
  { value: 'amber', label: 'Reminder Amber', swatchClass: 'bg-amber-700' },
  { value: 'indigo', label: 'Counsel Indigo', swatchClass: 'bg-indigo-800' },
  { value: 'rose', label: 'Cancellation Rose', swatchClass: 'bg-rose-800' },
];

const NOTICE_TONE_OPTIONS: Array<{ value: EmailCalloutTone; label: string }> = [
  { value: 'emerald', label: 'Emerald Notice' },
  { value: 'amber', label: 'Amber Alert' },
  { value: 'blue', label: 'Info Blue' },
  { value: 'slate', label: 'Neutral Slate' },
];

export const DynamicEmailBuilder: React.FC<DynamicEmailBuilderProps> = ({
  config,
  placeholders,
  onChange,
  onRegisterInsertionTarget,
  hasManualHtmlEdits = false,
  onSyncBuilderToHtml,
}) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    header: true,
    copy: true,
    rows: true,
    notice: false,
    ctaFooter: false,
  });
  const [copiedQuickToken, setCopiedQuickToken] = useState<string | null>(null);

  const activeInsertFnRef = useRef<((token: string) => void) | null>(null);
  const [activeFieldName, setActiveFieldName] = useState<string>('Confirmation Message');

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const registerFieldFocus = (
    el: HTMLInputElement | HTMLTextAreaElement | null,
    fieldLabel: string,
    getValue: () => string,
    applyValue: (nextVal: string) => void
  ) => {
    const insert = (token: string) => {
      const current = getValue();
      const start = el?.selectionStart ?? current.length;
      const end = el?.selectionEnd ?? current.length;
      const updated = current.slice(0, start) + token + current.slice(end);
      applyValue(updated);
      window.setTimeout(() => {
        if (el) {
          el.focus();
          const pos = start + token.length;
          el.setSelectionRange(pos, pos);
        }
      }, 10);
    };

    activeInsertFnRef.current = insert;
    setActiveFieldName(fieldLabel);
    onRegisterInsertionTarget({ fieldLabel, insert });
  };

  const handleQuickChipClick = (token: string) => {
    navigator.clipboard?.writeText(token).catch(() => {});
    setCopiedQuickToken(token);
    window.setTimeout(() => setCopiedQuickToken(null), 1500);

    if (activeInsertFnRef.current) {
      activeInsertFnRef.current(token);
    } else {
      onChange({
        ...config,
        introParagraph: `${config.introParagraph}${config.introParagraph.endsWith(' ') ? '' : ' '}${token}`,
      });
    }
  };

  const updateRow = (rowId: string, patch: Partial<EmailBuilderDetailRow>) => {
    onChange({
      ...config,
      detailRows: config.detailRows.map((row) =>
        row.id === rowId ? { ...row, ...patch } : row
      ),
    });
  };

  const moveRow = (idx: number, direction: -1 | 1) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= config.detailRows.length) return;
    const copy = [...config.detailRows];
    const [item] = copy.splice(idx, 1);
    copy.splice(targetIdx, 0, item);
    onChange({ ...config, detailRows: copy });
  };

  const removeRow = (rowId: string) => {
    onChange({
      ...config,
      detailRows: config.detailRows.filter((row) => row.id !== rowId),
    });
  };

  const addRow = () => {
    const newRow: EmailBuilderDetailRow = {
      id: `row-custom-${Date.now()}`,
      label: 'Additional Detail',
      valueTemplate: '{{notes}}',
      enabled: true,
    };
    onChange({
      ...config,
      showDetailsCard: true,
      detailRows: [...config.detailRows, newRow],
    });
  };

  // Spotlight key client confirmation variables cleanly
  const priorityKeys = ['clientName', 'appointmentTime', 'serviceType', 'date', 'timeSlot', 'consultationMode'];
  const priorityPlaceholders = placeholders.filter((p) => priorityKeys.includes(p.key));
  const secondaryPlaceholders = placeholders.filter((p) => !priorityKeys.includes(p.key));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs flex flex-col">
      {/* Builder Top Header */}
      <div className="bg-slate-900 text-white px-4 py-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <h3 className="text-xs sm:text-sm font-black tracking-tight text-white">
              Visual Dynamic Email Builder
            </h3>
            <p className="text-[11px] text-slate-300">
              Customize confirmation blocks &amp; click variables below to insert at cursor
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono text-emerald-300 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
          Target: {activeFieldName}
        </span>
      </div>

      {/* Warning banner if admin manually altered raw HTML */}
      {hasManualHtmlEdits && (
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-950">
          <span className="font-semibold">
            Raw HTML was manually modified. Editing a Visual Block below will re-sync HTML &amp; Plain Text.
          </span>
          {onSyncBuilderToHtml && (
            <button
              type="button"
              onClick={onSyncBuilderToHtml}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold cursor-pointer"
            >
              Sync Visual Builder Now
            </button>
          )}
        </div>
      )}

      {/* Quick Core Variable Inserter Strip */}
      <div className="px-4 py-3 bg-emerald-50/70 border-b border-emerald-200/80 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900 inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>Quick Insert Client Variables</span>
          </span>
          <span className="text-[11px] text-emerald-800">
            Focus any text field below &amp; click a token
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[...priorityPlaceholders, ...secondaryPlaceholders.slice(0, 5)].map((ph) => {
            const isCopied = copiedQuickToken === ph.token;
            return (
              <button
                key={ph.key}
                type="button"
                onClick={() => handleQuickChipClick(ph.token)}
                title={`Insert ${ph.label} (${ph.token}) — Sample: ${ph.sampleValue}`}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5 border transition-colors cursor-pointer ${
                  isCopied
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-800 border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50'
                }`}
              >
                <span>{ph.label}</span>
                <code className={`font-mono text-[10px] ${isCopied ? 'text-emerald-100' : 'text-emerald-700'}`}>
                  {ph.token}
                </code>
                {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 text-slate-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Builder Sections */}
      <div className="p-4 space-y-3 bg-slate-50/60">
        {/* 1. HEADER BANNER & THEME */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('header')}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-800">
              <LayoutTemplate className="w-3.5 h-3.5 text-emerald-600" />
              <span>1. Header Banner &amp; Brand Theme</span>
            </span>
            {openSections.header ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {openSections.header && (
            <div className="px-4 pb-4 pt-2 border-t border-slate-100 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                  Banner Color Theme
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {THEME_OPTIONS.map((opt) => {
                    const selected = config.headerTheme === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange({ ...config, headerTheme: opt.value })}
                        className={`px-2.5 py-2 rounded-lg border text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all ${
                          selected
                            ? 'border-slate-900 bg-slate-900 text-white shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-sm shrink-0 ${opt.swatchClass}`} />
                        <span className="truncate">{opt.label.split(' ')[1] || opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Top Eyebrow Label
                  </label>
                  <input
                    type="text"
                    value={config.eyebrowText}
                    onFocus={(e) =>
                      registerFieldFocus(
                        e.currentTarget,
                        'Header Eyebrow',
                        () => config.eyebrowText,
                        (val) => onChange({ ...config, eyebrowText: val })
                      )
                    }
                    onChange={(e) => onChange({ ...config, eyebrowText: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Banner Subheadline
                  </label>
                  <input
                    type="text"
                    value={config.subheadlineText}
                    onFocus={(e) =>
                      registerFieldFocus(
                        e.currentTarget,
                        'Banner Subheadline',
                        () => config.subheadlineText,
                        (val) => onChange({ ...config, subheadlineText: val })
                      )
                    }
                    onChange={(e) => onChange({ ...config, subheadlineText: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Main Banner Headline
                </label>
                <input
                  type="text"
                  value={config.headlineText}
                  onFocus={(e) =>
                    registerFieldFocus(
                      e.currentTarget,
                      'Banner Headline',
                      () => config.headlineText,
                      (val) => onChange({ ...config, headlineText: val })
                    )
                  }
                  onChange={(e) => onChange({ ...config, headlineText: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* 2. GREETING & CONFIRMATION MESSAGE */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('copy')}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-800">
              <Type className="w-3.5 h-3.5 text-emerald-600" />
              <span>2. Client Greeting &amp; Confirmation Copy</span>
            </span>
            {openSections.copy ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {openSections.copy && (
            <div className="px-4 pb-4 pt-2 border-t border-slate-100 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Greeting Line
                </label>
                <input
                  type="text"
                  value={config.greetingText}
                  onFocus={(e) =>
                    registerFieldFocus(
                      e.currentTarget,
                      'Greeting Line',
                      () => config.greetingText,
                      (val) => onChange({ ...config, greetingText: val })
                    )
                  }
                  onChange={(e) => onChange({ ...config, greetingText: e.target.value })}
                  placeholder="Dear {{clientName}},"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Opening Confirmation Paragraph
                </label>
                <textarea
                  rows={3}
                  value={config.introParagraph}
                  onFocus={(e) =>
                    registerFieldFocus(
                      e.currentTarget,
                      'Confirmation Message',
                      () => config.introParagraph,
                      (val) => onChange({ ...config, introParagraph: val })
                    )
                  }
                  onChange={(e) => onChange({ ...config, introParagraph: e.target.value })}
                  placeholder="Your consultation for {{serviceType}} is confirmed for {{appointmentTime}}..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs leading-relaxed text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Closing Support Note
                </label>
                <textarea
                  rows={2}
                  value={config.closingParagraph}
                  onFocus={(e) =>
                    registerFieldFocus(
                      e.currentTarget,
                      'Closing Support Note',
                      () => config.closingParagraph,
                      (val) => onChange({ ...config, closingParagraph: val })
                    )
                  }
                  onChange={(e) => onChange({ ...config, closingParagraph: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs leading-relaxed text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. DYNAMIC APPOINTMENT / SUMMARY DETAIL ROWS */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('rows')}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-800">
              <TableProperties className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                3. Dynamic Detail Rows ({config.detailRows.filter((r) => r.enabled).length} visible)
              </span>
            </span>
            {openSections.rows ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {openSections.rows && (
            <div className="px-4 pb-4 pt-2 border-t border-slate-100 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showDetailsCard}
                    onChange={(e) => onChange({ ...config, showDetailsCard: e.target.checked })}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Show Structured Details Summary Card</span>
                </label>

                <button
                  type="button"
                  onClick={addRow}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Detail Row</span>
                </button>
              </div>

              {config.showDetailsCard && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Details Card Heading
                    </label>
                    <input
                      type="text"
                      value={config.detailsCardTitle}
                      onFocus={(e) =>
                        registerFieldFocus(
                          e.currentTarget,
                          'Details Card Title',
                          () => config.detailsCardTitle,
                          (val) => onChange({ ...config, detailsCardTitle: val })
                        )
                      }
                      onChange={(e) => onChange({ ...config, detailsCardTitle: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="space-y-2">
                    {config.detailRows.map((row, index) => (
                      <div
                        key={row.id}
                        className={`p-2.5 rounded-xl border transition-colors ${
                          row.enabled
                            ? 'bg-slate-50 border-slate-200'
                            : 'bg-slate-100/70 border-slate-200/70 opacity-60'
                        }`}
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                          <div className="sm:col-span-4">
                            <input
                              type="text"
                              value={row.label}
                              onChange={(e) => updateRow(row.id, { label: e.target.value })}
                              placeholder="Field label"
                              aria-label={`Row ${index + 1} label`}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600"
                            />
                          </div>
                          <div className="sm:col-span-5">
                            <input
                              type="text"
                              value={row.valueTemplate}
                              onFocus={(e) =>
                                registerFieldFocus(
                                  e.currentTarget,
                                  `Row: ${row.label || 'Detail'}`,
                                  () => row.valueTemplate,
                                  (val) => updateRow(row.id, { valueTemplate: val })
                                )
                              }
                              onChange={(e) => updateRow(row.id, { valueTemplate: e.target.value })}
                              placeholder="{{clientName}} / {{appointmentTime}}"
                              aria-label={`Row ${index + 1} dynamic value`}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                            />
                          </div>
                          <div className="sm:col-span-3 flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => updateRow(row.id, { highlight: !row.highlight })}
                              title="Toggle accent highlight"
                              className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border cursor-pointer ${
                                row.highlight
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                  : 'bg-white border-slate-200 text-slate-500'
                              }`}
                            >
                              Bold
                            </button>
                            <button
                              type="button"
                              onClick={() => updateRow(row.id, { enabled: !row.enabled })}
                              title={row.enabled ? 'Hide row' : 'Show row'}
                              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer"
                            >
                              {row.enabled ? (
                                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => moveRow(index, -1)}
                              disabled={index === 0}
                              title="Move up"
                              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveRow(index, 1)}
                              disabled={index === config.detailRows.length - 1}
                              title="Move down"
                              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeRow(row.id)}
                              title="Delete row"
                              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* 4. CALLOUT / REMINDER NOTICE BOX */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('notice')}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-800">
              <BellRing className="w-3.5 h-3.5 text-emerald-600" />
              <span>4. Highlight Notice / Preparation Box</span>
            </span>
            {openSections.notice ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {openSections.notice && (
            <div className="px-4 pb-4 pt-2 border-t border-slate-100 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showNoticeBox}
                    onChange={(e) => onChange({ ...config, showNoticeBox: e.target.checked })}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Include Highlight Callout Banner</span>
                </label>

                <select
                  value={config.noticeTone}
                  onChange={(e) =>
                    onChange({ ...config, noticeTone: e.target.value as EmailCalloutTone })
                  }
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 bg-white"
                >
                  {NOTICE_TONE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {config.showNoticeBox && (
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Callout Title
                    </label>
                    <input
                      type="text"
                      value={config.noticeTitle}
                      onFocus={(e) =>
                        registerFieldFocus(
                          e.currentTarget,
                          'Notice Title',
                          () => config.noticeTitle,
                          (val) => onChange({ ...config, noticeTitle: val })
                        )
                      }
                      onChange={(e) => onChange({ ...config, noticeTitle: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Callout Body
                    </label>
                    <textarea
                      rows={2}
                      value={config.noticeBody}
                      onFocus={(e) =>
                        registerFieldFocus(
                          e.currentTarget,
                          'Notice Body',
                          () => config.noticeBody,
                          (val) => onChange({ ...config, noticeBody: val })
                        )
                      }
                      onChange={(e) => onChange({ ...config, noticeBody: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 5. CTA BUTTON & FOOTER */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('ctaFooter')}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-800">
              <MousePointerClick className="w-3.5 h-3.5 text-emerald-600" />
              <span>5. Action Button (CTA) &amp; Chambers Footer</span>
            </span>
            {openSections.ctaFooter ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {openSections.ctaFooter && (
            <div className="px-4 pb-4 pt-2 border-t border-slate-100 space-y-3">
              <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showCtaButton}
                  onChange={(e) => onChange({ ...config, showCtaButton: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Display Primary Action Button</span>
              </label>

              {config.showCtaButton && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Button Label
                    </label>
                    <input
                      type="text"
                      value={config.ctaLabel}
                      onFocus={(e) =>
                        registerFieldFocus(
                          e.currentTarget,
                          'CTA Button Label',
                          () => config.ctaLabel,
                          (val) => onChange({ ...config, ctaLabel: val })
                        )
                      }
                      onChange={(e) => onChange({ ...config, ctaLabel: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Destination URL Token
                    </label>
                    <input
                      type="text"
                      value={config.ctaUrlTemplate}
                      onFocus={(e) =>
                        registerFieldFocus(
                          e.currentTarget,
                          'CTA Button URL',
                          () => config.ctaUrlTemplate,
                          (val) => onChange({ ...config, ctaUrlTemplate: val })
                        )
                      }
                      onChange={(e) => onChange({ ...config, ctaUrlTemplate: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Footer Primary Line
                  </label>
                  <input
                    type="text"
                    value={config.footerPrimaryLine}
                    onFocus={(e) =>
                      registerFieldFocus(
                        e.currentTarget,
                        'Footer Line 1',
                        () => config.footerPrimaryLine,
                        (val) => onChange({ ...config, footerPrimaryLine: val })
                      )
                    }
                    onChange={(e) => onChange({ ...config, footerPrimaryLine: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Footer Address Line
                  </label>
                  <input
                    type="text"
                    value={config.footerSecondaryLine}
                    onFocus={(e) =>
                      registerFieldFocus(
                        e.currentTarget,
                        'Footer Address',
                        () => config.footerSecondaryLine,
                        (val) => onChange({ ...config, footerSecondaryLine: val })
                      )
                    }
                    onChange={(e) => onChange({ ...config, footerSecondaryLine: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DynamicEmailBuilder;
