import React from 'react';
import {
  CalculationEmailPayload,
  CalculationEmailInputItem,
  CalculationEmailTable,
  CalculationEmailTableRow,
  CalculationEmailMetric,
} from '../../utils/calculationEmailTemplate';

export interface CalculationEmailReportViewProps {
  /**
   * Complete calculation email report payload or individual sections
   */
  payload?: CalculationEmailPayload;
  /**
   * Title of the tool or calculator (e.g., 'Bangladesh Individual Income Tax & Rebate Calculator')
   */
  toolName?: string;
  /**
   * Unique statutory reference identifier (e.g., 'ITAX-2026-94812')
   */
  referenceId?: string;
  /**
   * Category or legal discipline (e.g., 'Income Tax Act 2023 · Assessment Year 2026–2027')
   */
  toolCategory?: string;
  /**
   * Specific statutory section or basis
   */
  statutoryBasis?: string;
  /**
   * Timestamp string
   */
  generatedAt?: string;
  /**
   * Top-level summary metric tiles (cards)
   */
  summaryMetrics?: CalculationEmailMetric[];
  /**
   * Form inputs and taxpayer parameters
   */
  inputs?: CalculationEmailInputItem[];
  /**
   * Full statutory breakdown tables
   */
  tables?: CalculationEmailTable[];
  /**
   * Compliance and legal notes
   */
  legalNotes?: string[];
  /**
   * Custom user or practitioner reference advisory note
   */
  customNote?: string;
  /**
   * Organization branding name
   */
  firmName?: string;
  /**
   * Organization verified desk email
   */
  firmEmail?: string;
  /**
   * Organization physical chamber address
   */
  firmAddress?: string;
  /**
   * Show border container styling or render flat
   */
  isCard?: boolean;
  /**
   * Optional custom className for outer wrapper
   */
  className?: string;
}

export const CalculationEmailReportView: React.FC<CalculationEmailReportViewProps> = ({
  payload,
  toolName: propToolName,
  referenceId: propRefId,
  toolCategory: propToolCategory,
  statutoryBasis: propStatutoryBasis,
  generatedAt: propGeneratedAt,
  summaryMetrics: propSummaryMetrics,
  inputs: propInputs,
  tables: propTables,
  legalNotes: propLegalNotes,
  customNote: propCustomNote,
  firmName = 'ACCOUNTICCA x E-LAWYERS BD',
  firmEmail = 'ekram@elawyersbd.com',
  firmAddress = 'Suite G-5, BTI Centara Grand, 144–144/1 Green Road, Panthapath, Dhaka–1205',
  isCard = true,
  className = '',
}) => {
  // Merge props with payload fallback
  const toolName = propToolName || payload?.toolName || 'Statutory Compliance Calculation Statement';
  const referenceId = propRefId || payload?.referenceId || `CALC-2026-${Math.floor(10000 + Math.random() * 90000)}`;
  const toolCategory = propToolCategory || payload?.toolCategory || 'Statutory Compliance & Tax';
  const statutoryBasis = propStatutoryBasis || payload?.statutoryBasis || 'Income Tax Act 2023 & NBR Regulatory Framework';
  const generatedAt = propGeneratedAt || payload?.generatedAt || new Date().toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' });
  const summaryMetrics = propSummaryMetrics || payload?.summaryMetrics || [];
  const inputs = propInputs || payload?.inputs || [];
  const tables = propTables || payload?.tables || [];
  const legalNotes = propLegalNotes || payload?.legalNotes || [];
  const customNote = propCustomNote || payload?.customNote;

  return (
    <div
      className={`font-sans text-slate-900 bg-white ${
        isCard ? 'rounded-2xl border border-slate-300 shadow-md overflow-hidden' : ''
      } ${className}`}
      data-testid="calculation-email-report-view"
    >
      {/* 1. Header Banner */}
      <div className="bg-slate-950 text-white p-6 sm:p-7 border-b-4 border-amber-500">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400">
            {firmName} · STATUTORY COMPLIANCE DESK
          </span>
          <span className="text-xs font-mono font-black text-amber-300 bg-slate-900/90 px-2.5 py-1 rounded-md border border-amber-500/40">
            Ref: {referenceId}
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
          {toolName}
        </h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-2 font-medium">
          <span>
            Discipline: <strong className="text-white font-semibold">{toolCategory}</strong>
          </span>
          <span className="text-slate-600">|</span>
          <span>
            Generated: <strong className="text-white font-mono">{generatedAt}</strong>
          </span>
        </div>
        <div className="mt-2 text-[11px] text-emerald-300 font-mono bg-emerald-950/60 inline-block px-2.5 py-0.5 rounded border border-emerald-500/30">
          Statutory Framework: {statutoryBasis}
        </div>
      </div>

      {/* Main Report Body */}
      <div className="p-6 sm:p-8 space-y-6 bg-slate-50/50">
        {/* Custom Advisory Note if present */}
        {customNote && customNote.trim() && (
          <div className="p-4 rounded-xl bg-blue-50 border-l-4 border-blue-600 text-xs text-blue-950 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800 block">
              Client / Practitioner Reference Advisory Note
            </span>
            <p className="font-semibold leading-relaxed">{customNote.trim()}</p>
          </div>
        )}

        {/* 2. Top Summary Metric Cards */}
        {summaryMetrics.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {summaryMetrics.slice(0, 4).map((m, idx) => {
              const toneClasses =
                m.tone === 'amber'
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : m.tone === 'emerald'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : m.tone === 'indigo'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-950'
                  : m.tone === 'blue'
                  ? 'bg-blue-50 border-blue-300 text-blue-950'
                  : 'bg-slate-100 border-slate-300 text-slate-900';

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between ${toneClasses}`}
                >
                  <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-85 block mb-1">
                    {m.label}
                  </span>
                  <div className="text-base sm:text-lg font-black font-mono tracking-tight">
                    {m.value}
                  </div>
                  {m.sublabel && (
                    <span className="text-[10px] opacity-75 mt-0.5 font-medium">{m.sublabel}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 3. Section 1: Inputs & Parameters Table */}
        {inputs.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-300 shadow-2xs overflow-hidden">
            <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-xs font-black">
              <span>1. Verified Input Parameters &amp; Thresholds</span>
              <span className="text-[10px] font-mono text-emerald-400">
                {inputs.length} Parameter{inputs.length === 1 ? '' : 's'}
              </span>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-950 font-black border-b border-slate-300 uppercase text-[11px]">
                  <th className="py-2.5 px-4 border-r border-slate-300">Parameter / Baseline</th>
                  <th className="py-2.5 px-4 text-right">Computed / Input Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {inputs.map((item, idx) => (
                  <tr
                    key={idx}
                    className={`hover:bg-blue-50/30 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}`}
                  >
                    <td className="py-2.5 px-4 border-r border-slate-200 font-bold text-slate-900">
                      {item.label}
                      {item.note && (
                        <span className="ml-2 inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-mono text-[10px] font-bold border border-emerald-300">
                          {item.note}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-black text-blue-950 whitespace-nowrap">
                      {item.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Section 2: Statutory Breakdown Tables */}
        {tables.length > 0 && (
          <div className="space-y-5">
            {tables.map((table, tIdx) => {
              const colCount = table.headers.length;

              return (
                <div
                  key={tIdx}
                  className="bg-white rounded-xl border border-slate-300 shadow-2xs overflow-hidden"
                >
                  <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-xs font-black">
                    <span>
                      {inputs.length > 0 ? `${tIdx + 2}. ` : ''}
                      {table.title}
                    </span>
                    {table.subtitle && (
                      <span className="text-[10px] font-mono text-slate-300 hidden sm:inline">
                        {table.subtitle}
                      </span>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-950 font-black border-b-2 border-slate-300 uppercase text-[11px]">
                          {table.headers.map((h, hIdx) => (
                            <th
                              key={hIdx}
                              className={`py-2.5 px-3.5 ${
                                hIdx < colCount - 1 ? 'border-r border-slate-300' : ''
                              } ${
                                hIdx === 0
                                  ? 'text-left'
                                  : hIdx === 1 && colCount === 4
                                  ? 'text-center'
                                  : 'text-right'
                              }`}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {table.rows.map((row: CalculationEmailTableRow, rIdx: number) => {
                          const tone = row.tone || 'default';
                          let rowClass = rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70';
                          let textClass = 'text-slate-900 font-bold';

                          if (tone === 'highlight') {
                            rowClass = 'bg-amber-100/90 text-amber-950 border-t-2 border-b-2 border-amber-400';
                            textClass = 'text-amber-950 font-black text-sm';
                          } else if (tone === 'tds') {
                            rowClass = 'bg-indigo-100/90 text-indigo-950 border-t-2 border-b-2 border-indigo-400';
                            textClass = 'text-indigo-950 font-black';
                          } else if (tone === 'rebate') {
                            rowClass = 'bg-emerald-100/80 text-emerald-950 border-t border-emerald-300';
                            textClass = 'text-emerald-950 font-extrabold';
                          } else if (tone === 'limit') {
                            rowClass = 'bg-blue-50 text-blue-950';
                            textClass = 'text-blue-950 font-bold';
                          } else if (tone === 'subtotal') {
                            rowClass = 'bg-slate-200/90 text-slate-950 border-t-2 border-slate-400';
                            textClass = 'text-slate-950 font-extrabold';
                          }

                          // Check if row is a 2-item summary spanning wide columns (e.g., Particulars + Total)
                          const nonEmpty = row.cells.filter((c) => c && c.trim() !== '');
                          if (nonEmpty.length === 2 && colCount > 2 && row.cells[0] && row.cells[colCount - 1]) {
                            return (
                              <tr key={rIdx} className={`${rowClass} hover:opacity-95`}>
                                <td
                                  colSpan={colCount - 1}
                                  className={`py-2.5 px-3.5 text-right border-r border-slate-300 ${textClass}`}
                                >
                                  {row.cells[0]}
                                </td>
                                <td
                                  className={`py-2.5 px-3.5 text-right font-mono whitespace-nowrap ${textClass}`}
                                >
                                  {row.cells[colCount - 1]}
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr key={rIdx} className={`${rowClass} hover:opacity-95`}>
                              {row.cells.slice(0, colCount).map((cell, cIdx) => {
                                const alignClass =
                                  cIdx === 0
                                    ? 'text-left'
                                    : cIdx === 1 && colCount === 4
                                    ? 'text-center'
                                    : 'text-right';
                                const isNumeric = cIdx > 0;

                                return (
                                  <td
                                    key={cIdx}
                                    className={`py-2.5 px-3.5 ${
                                      cIdx < colCount - 1 ? 'border-r border-slate-200' : ''
                                    } ${alignClass} ${
                                      isNumeric ? 'font-mono whitespace-nowrap' : ''
                                    } ${textClass}`}
                                  >
                                    {cell}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 5. Section 3: Legal & Regulatory Compliance Notes */}
        {legalNotes.length > 0 && (
          <div className="bg-slate-100 rounded-xl border border-slate-300 p-5 space-y-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-slate-950 block">
              3. Statutory &amp; Regulatory Compliance Notes (AY 2026–2027)
            </span>
            <ul className="list-disc pl-5 space-y-1.5 text-[11px] text-slate-800 font-semibold leading-relaxed">
              {legalNotes.map((note, nIdx) => (
                <li key={nIdx}>{note}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 6. Footer Disclaimer & Chambers Desk */}
      <div className="bg-slate-900 text-slate-300 p-6 border-t border-slate-800 text-center text-xs space-y-2">
        <div className="font-bold text-white tracking-wide">
          {firmName} · CHAMBER DESK
        </div>
        <div className="text-[11px] text-slate-400">{firmAddress}</div>
        <div className="text-[11px] text-emerald-400 font-mono">
          Email: <a href={`mailto:${firmEmail}`} className="underline hover:text-emerald-300">{firmEmail}</a> | Statutory Portal: https://accounticca.ai.studio
        </div>
        <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-3 max-w-2xl mx-auto leading-normal">
          CONFIDENTIALITY & PRIVILEGE NOTICE: This calculation statement is automatically compiled pursuant to Bangladesh tax and statutory guidelines for Assessment Year 2026–2027. Retain with relevant certificates and schedules for audit verification.
        </div>
      </div>
    </div>
  );
};

export default CalculationEmailReportView;
