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
  FileSpreadsheet,
  Copy,
  Check,
  X,
  ExternalLink,
  Calculator,
  Layers,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  Database,
  ArrowUpDown,
  Filter,
  Download
} from 'lucide-react';
import {
  CalculationEmailReportRecord,
  fetchCalculationReportsFromFirestore,
  subscribeCalculationReports,
  saveCalculationReportToFirestore,
} from '../../services/calculationReportFirestoreService';
import {
  syncCalculationReportsToSheet,
  getStoredCalculationSheetId,
  getStoredCalculationSheetTitle,
  exportCalculationReportsCsv,
} from '../../services/calculationSheetsSync';
import { getAccessToken, getConnectedWorkspaceEmail } from '../../services/workspaceAuth';

export const CalculationEmailHistoryTab: React.FC = () => {
  const [reports, setReports] = useState<CalculationEmailReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [calculatorFilter, setCalculatorFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedReport, setSelectedReport] = useState<CalculationEmailReportRecord | null>(null);
  const [viewMode, setViewMode] = useState<'html' | 'text' | 'metadata'>('html');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Google Sheets sync state
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [sheetSyncResult, setSheetSyncResult] = useState<{
    success: boolean;
    syncedCount: number;
    spreadsheetUrl: string;
    message?: string;
  } | null>(null);

  // Resend state
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Workspace Auth state
  const workspaceToken = getAccessToken();
  const connectedWorkspaceEmail = getConnectedWorkspaceEmail();
  const currentSheetId = getStoredCalculationSheetId();
  const currentSheetTitle = getStoredCalculationSheetTitle();

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchCalculationReportsFromFirestore();
      setReports(data);
    } catch (err: any) {
      console.warn('Failed to load calculation reports from Firestore:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();

    // Subscribe to real-time Firestore updates
    const unsubscribe = subscribeCalculationReports((liveReports) => {
      if (liveReports && liveReports.length > 0) {
        setReports(liveReports);
        setLoading(false);
      }
    });

    const handleLocalUpdate = (e: any) => {
      if (e?.detail) {
        setReports((prev) => {
          const idx = prev.findIndex((p) => p.referenceId === e.detail.referenceId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = e.detail;
            return next;
          }
          return [e.detail, ...prev];
        });
      }
    };

    window.addEventListener('calculation_email_report_saved', handleLocalUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener('calculation_email_report_saved', handleLocalUpdate);
    };
  }, []);

  // Distinct calculator types for filter dropdown
  const calculatorTypes = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      if (r.calculatorType || r.toolName) {
        set.add(r.calculatorType || r.toolName);
      }
    });
    return Array.from(set);
  }, [reports]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchesSearch =
        (r.referenceId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.primaryRecipient || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.recipientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.toolName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.calculatorType || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.summaryHighlight || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCalc =
        calculatorFilter === 'ALL' ||
        r.calculatorType === calculatorFilter ||
        r.toolName === calculatorFilter;

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'Delivered' && (r.status === 'Delivered' || !r.status)) ||
        r.status === statusFilter;

      return matchesSearch && matchesCalc && matchesStatus;
    });
  }, [reports, searchQuery, calculatorFilter, statusFilter]);

  // Metrics
  const totalReportsCount = reports.length;
  const uniqueRecipientsCount = new Set(reports.map((r) => r.primaryRecipient)).size;
  const uniqueCalculatorTypesCount = calculatorTypes.length;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSyncToGoogleSheets = async () => {
    if (filteredReports.length === 0) return;
    setIsSyncingSheet(true);
    setNotification(null);
    try {
      const res = await syncCalculationReportsToSheet(filteredReports);
      setSheetSyncResult(res);
      setNotification({
        type: 'success',
        text: `Successfully synced ${res.syncedCount} calculation report(s) to Google Sheets in /workspace!`,
      });

      // Update local reports with sheetSynced status
      setReports((prev) =>
        prev.map((r) => ({
          ...r,
          sheetSynced: true,
          sheetSyncedAt: new Date().toISOString(),
        }))
      );
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: err?.message || 'Failed to sync calculation reports to Google Sheets. Check /workspace connection.',
      });
    } finally {
      setIsSyncingSheet(false);
    }
  };

  const handleResendReport = async (report: CalculationEmailReportRecord) => {
    setResendingId(report.referenceId);
    setNotification(null);
    try {
      const res = await fetch('/api/email/send-calculation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceId: report.referenceId,
          toolId: report.toolId,
          toolName: report.toolName,
          toolCategory: report.toolCategory,
          toolPath: report.toolPath,
          primaryRecipient: report.primaryRecipient,
          recipientName: report.recipientName,
          ccRecipients: report.ccRecipients,
          subject: report.subject,
          html: report.html,
          text: report.text,
          summaryHighlight: report.summaryHighlight,
        }),
      });

      const raw = await res.text();
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {}

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || `Failed to resend calculation email (${res.status}).`);
      }

      setNotification({
        type: 'success',
        text: `Calculation report [${report.referenceId}] successfully re-dispatched to ${report.primaryRecipient} via Brevo SMTP relay.`,
      });

      // Update Firestore record with latest sentAt
      await saveCalculationReportToFirestore({
        ...report,
        sentAt: new Date().toISOString(),
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: err?.message || 'Failed to resend calculation report via Brevo relay.',
      });
    } finally {
      setResendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Metrics */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                Firestore Collection: calculation_email_reports
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                Brevo SMTP Relay: smtp-relay.brevo.com:587
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Sent Calculation Reports &amp; Email Dispatch Ledger
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Real-time audit log of statutory calculation statements sent to members across Bangladesh tax, VAT, gratuity, and RJSC compliance tools. Backed by persistent Firestore storage with automated Google Sheets sync for /workspace.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSyncToGoogleSheets}
              disabled={isSyncingSheet || filteredReports.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
              title="Save all matching calculation reports to Google Sheets in /workspace"
            >
              {isSyncingSheet ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              <span>{isSyncingSheet ? 'Syncing to Sheets...' : 'Save to Google Sheet (/workspace)'}</span>
            </button>

            <button
              type="button"
              onClick={() => exportCalculationReportsCsv(filteredReports)}
              disabled={filteredReports.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
              title="Export calculation reports to CSV"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={loadData}
              title="Refresh Firestore Ledger"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-800/80 mt-6">
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-2xl font-black text-emerald-400 font-mono">{totalReportsCount}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Reports In Firestore</div>
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-2xl font-black text-cyan-400 font-mono">{uniqueRecipientsCount}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Unique Members</div>
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-2xl font-black text-indigo-400 font-mono">{uniqueCalculatorTypesCount}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Calculator Types</div>
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-sm font-bold text-slate-200 truncate font-mono">
              {currentSheetId ? 'Google Sheet Active' : 'Sheet Ready'}
            </div>
            <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>/workspace Synced</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          role="alert"
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>

          <div className="flex items-center gap-2">
            {sheetSyncResult?.spreadsheetUrl && (
              <a
                href={sheetSyncResult.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition"
              >
                <span>Open Google Sheet</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="p-1 hover:bg-black/10 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filters & Search Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by recipient email, ref ID, calculator type, or highlight..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>

          {/* Calculator Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={calculatorFilter}
              onChange={(e) => setCalculatorFilter(e.target.value)}
              aria-label="Filter by calculator type"
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">All Calculator Types ({calculatorTypes.length})</option>
              {calculatorTypes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by delivery status"
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">All Delivery Statuses</option>
              <option value="Delivered">Delivered (via Brevo)</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-bold shrink-0 text-right">
          Showing <span className="text-slate-900 font-black">{filteredReports.length}</span> of {totalReportsCount} reports
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900">
              Calculation Reports Ledger (Firestore Data Source)
            </h3>
            <p className="text-xs text-slate-500">
              Lists timestamp, recipient email, calculator type, statutory summary highlight, and Brevo relay transport details.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
              Live Firestore Sync
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-500">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-bold text-slate-600">Querying Firestore collection 'calculation_email_reports'...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-16 text-center text-slate-500 space-y-3">
            <Calculator className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No calculation email reports found</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              When members calculate income tax, VAT, gratuity, or RJSC fees and click "Send Calculation Report", the report is automatically logged to Firestore and appears here in real time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-950 font-black uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-3.5 border-r border-slate-200">Ref ID</th>
                  <th className="py-3 px-3.5 border-r border-slate-200">Timestamp (BST)</th>
                  <th className="py-3 px-3.5 border-r border-slate-200">Recipient Email</th>
                  <th className="py-3 px-3.5 border-r border-slate-200">Calculator Type</th>
                  <th className="py-3 px-3.5 border-r border-slate-200">Statutory Summary</th>
                  <th className="py-3 px-3.5 border-r border-slate-200">Relay &amp; Status</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-950 font-medium">
                {filteredReports.map((report) => (
                  <tr key={report.id || report.referenceId} className="hover:bg-slate-50/80 transition-colors">
                    {/* Reference ID */}
                    <td className="py-3 px-3.5 border-r border-slate-100 font-mono font-bold text-blue-950 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{report.referenceId}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(report.referenceId, report.referenceId)}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                          title="Copy reference ID"
                        >
                          {copiedId === report.referenceId ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-500 font-sans font-normal truncate max-w-[120px]">
                        {report.toolPath}
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-3.5 border-r border-slate-100 font-mono text-slate-700 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{report.formattedDate || new Date(report.sentAt).toLocaleString()}</span>
                      </div>
                    </td>

                    {/* Recipient Email */}
                    <td className="py-3 px-3.5 border-r border-slate-100 font-mono">
                      <div className="font-bold text-slate-900 truncate max-w-[210px]">
                        {report.primaryRecipient}
                      </div>
                      {report.recipientName && (
                        <div className="text-[11px] text-slate-600 font-sans font-medium">
                          {report.recipientName}
                        </div>
                      )}
                      {report.ccRecipients && report.ccRecipients.length > 0 && (
                        <div className="text-[10px] text-slate-500 font-mono truncate max-w-[210px]">
                          CC: {report.ccRecipients.join(', ')}
                        </div>
                      )}
                    </td>

                    {/* Calculator Type */}
                    <td className="py-3 px-3.5 border-r border-slate-100">
                      <div className="font-bold text-slate-900">{report.calculatorType || report.toolName}</div>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {report.toolCategory || 'Compliance'}
                      </span>
                    </td>

                    {/* Statutory Summary Highlight */}
                    <td className="py-3 px-3.5 border-r border-slate-100 font-mono font-bold text-emerald-950">
                      <div className="truncate max-w-[220px]">
                        {report.summaryHighlight || 'Complete Report'}
                      </div>
                    </td>

                    {/* Relay & Status */}
                    <td className="py-3 px-3.5 border-r border-slate-100 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{report.status || 'Delivered'}</span>
                        </span>
                        {report.sheetSynced && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Sheet
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 mt-1 truncate max-w-[160px]">
                        {report.relayMode}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedReport(report)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] inline-flex items-center gap-1 transition cursor-pointer"
                          title="View formatted statement"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleResendReport(report)}
                          disabled={resendingId === report.referenceId}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] inline-flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                          title="Resend email via Brevo SMTP relay"
                        >
                          <RotateCcw className={`w-3 h-3 ${resendingId === report.referenceId ? 'animate-spin' : ''}`} />
                          <span>{resendingId === report.referenceId ? 'Sending...' : 'Resend'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Statement Inspection Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white border border-slate-300 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-slate-950 text-white px-6 py-4.5 flex items-center justify-between gap-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      {selectedReport.referenceId}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-300">
                      {selectedReport.calculatorType || selectedReport.toolName}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white mt-0.5 truncate max-w-md">
                    {selectedReport.subject || 'Calculation Report Statement'}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setViewMode('html')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      viewMode === 'html' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    HTML Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('text')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      viewMode === 'text' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Plain Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('metadata')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      viewMode === 'metadata' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Transport Meta
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                  aria-label="Close statement modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
              {viewMode === 'html' ? (
                selectedReport.html ? (
                  <div className="bg-white rounded-2xl border border-slate-300 shadow-sm p-4 overflow-hidden">
                    <iframe
                      title="Calculation Statement Preview"
                      srcDoc={selectedReport.html}
                      className="w-full min-h-[500px] border-0 rounded-xl"
                      sandbox="allow-same-origin"
                    />
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-500 font-medium">
                    No rendered HTML payload attached to this record.
                  </div>
                )
              ) : viewMode === 'text' ? (
                <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl font-mono text-xs whitespace-pre-wrap leading-relaxed overflow-x-auto">
                  {selectedReport.text || 'No plain text statement attached.'}
                </div>
              ) : (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="text-sm font-black text-slate-900">Firestore &amp; Brevo Relay Transport Parameters</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="text-slate-500 font-bold">Document ID</div>
                      <div className="font-bold text-slate-900 mt-1">{selectedReport.id}</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="text-slate-500 font-bold">Reference ID</div>
                      <div className="font-bold text-blue-900 mt-1">{selectedReport.referenceId}</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="text-slate-500 font-bold">Primary Recipient</div>
                      <div className="font-bold text-emerald-900 mt-1">{selectedReport.primaryRecipient}</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="text-slate-500 font-bold">Calculator Type</div>
                      <div className="font-bold text-slate-900 mt-1">{selectedReport.calculatorType || selectedReport.toolName}</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="text-slate-500 font-bold">Sent At (ISO)</div>
                      <div className="font-bold text-slate-900 mt-1">{selectedReport.sentAt}</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="text-slate-500 font-bold">Brevo Relay Mode</div>
                      <div className="font-bold text-slate-900 mt-1">{selectedReport.relayMode}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <div className="text-xs font-mono text-slate-500">
                To: <strong className="text-slate-900">{selectedReport.primaryRecipient}</strong>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleResendReport(selectedReport)}
                  disabled={resendingId === selectedReport.referenceId}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${resendingId === selectedReport.referenceId ? 'animate-spin' : ''}`} />
                  <span>{resendingId === selectedReport.referenceId ? 'Resending...' : 'Resend Email via Brevo'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalculationEmailHistoryTab;
