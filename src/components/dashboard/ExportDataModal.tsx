import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  X, 
  CheckCircle2, 
  Calendar, 
  Flame, 
  Target, 
  FileText, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { 
  exportDashboardDataAsCSV, 
  getStoredComplianceDeadlines, 
  getStoredDailyGoals, 
  getStoredStreak,
  ExportDataSummary 
} from '../../utils/dashboardCsvExporter';

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportDataModal: React.FC<ExportDataModalProps> = ({ isOpen, onClose }) => {
  const [selectedScope, setSelectedScope] = useState<'all' | 'deadlines' | 'activity'>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState<ExportDataSummary | null>(null);

  if (!isOpen) return null;

  const deadlines = getStoredComplianceDeadlines();
  const goals = getStoredDailyGoals();
  const { streakDays } = getStoredStreak();
  const completedGoals = goals.filter(g => g.completed);

  const handleDownload = () => {
    setIsExporting(true);
    setTimeout(() => {
      try {
        const result = exportDashboardDataAsCSV(selectedScope);
        setLastExport(result);
      } catch (err) {
        console.error('Failed to export CSV', err);
      } finally {
        setIsExporting(false);
      }
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-200 shadow-inner">
              <FileSpreadsheet className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white">Export Dashboard Data</h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-400 text-slate-950 px-2 py-0.5 rounded-full">
                  CSV File
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Download your activity progress and stored statutory deadlines for Excel or Google Sheets.
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Success Banner if just exported */}
          {lastExport && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-extrabold text-emerald-950">CSV Export Successfully Downloaded!</p>
                <p className="text-emerald-700 font-medium">
                  Saved as <span className="font-mono font-bold text-emerald-900">{lastExport.filename}</span>
                </p>
                <p className="text-[11px] text-emerald-600">
                  Included {lastExport.deadlinesCount} compliance deadlines, {lastExport.goalsCount} activity tasks, and {lastExport.streakDays}-day streak stats.
                </p>
              </div>
            </div>
          )}

          {/* Quick Metrics Preview */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-center">
              <div className="flex items-center justify-center text-amber-500 mb-1">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-xl font-black text-slate-900">{deadlines.length}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Deadlines</p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-center">
              <div className="flex items-center justify-center text-emerald-600 mb-1">
                <Target className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-xl font-black text-slate-900">{completedGoals.length}/{goals.length}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Goals Met</p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-center">
              <div className="flex items-center justify-center text-orange-500 mb-1">
                <Flame className="w-5 h-5 text-orange-500 fill-orange-100" />
              </div>
              <p className="text-xl font-black text-slate-900">{streakDays}d</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Streak</p>
            </div>
          </div>

          {/* Export Scope Selector */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Select Data to Include in CSV
            </label>

            <div className="space-y-2">
              <label 
                className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  selectedScope === 'all'
                    ? 'bg-emerald-50/80 border-emerald-400 ring-1 ring-emerald-400'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="exportScope"
                  value="all"
                  checked={selectedScope === 'all'}
                  onChange={() => setSelectedScope('all')}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">Comprehensive Dashboard Bundle</span>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Includes all stored statutory deadlines, daily learning tasks, study streak metrics, and quota completion.
                  </p>
                </div>
              </label>

              <label 
                className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  selectedScope === 'deadlines'
                    ? 'bg-emerald-50/80 border-emerald-400 ring-1 ring-emerald-400'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="exportScope"
                  value="deadlines"
                  checked={selectedScope === 'deadlines'}
                  onChange={() => setSelectedScope('deadlines')}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="min-w-0">
                  <span className="font-extrabold text-sm text-slate-900">Stored Compliance Deadlines Only</span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Exports tax filing dates, VAT return timelines, RJSC corporate deadlines, and entity instructions.
                  </p>
                </div>
              </label>

              <label 
                className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  selectedScope === 'activity'
                    ? 'bg-emerald-50/80 border-emerald-400 ring-1 ring-emerald-400'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="exportScope"
                  value="activity"
                  checked={selectedScope === 'activity'}
                  onChange={() => setSelectedScope('activity')}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="min-w-0">
                  <span className="font-extrabold text-sm text-slate-900">Activity Progress & Learning Goals Only</span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Exports daily checklist items, estimated reading minutes, streak counters, and target quotas.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Compatibility Note */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 text-[11px] text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Exports standard RFC 4180 UTF-8 CSV with BOM for full compatibility with Microsoft Excel, Apple Numbers, and Google Sheets.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            id="modal-confirm-download-csv-btn"
            onClick={handleDownload}
            disabled={isExporting}
            className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-md disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating CSV...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download CSV File</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
export default ExportDataModal;
