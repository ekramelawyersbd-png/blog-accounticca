import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Download, 
  ExternalLink, 
  Bookmark, 
  Sparkles, 
  X, 
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { TaxScenario, TaxScenarioInputs, TaxScenarioResults } from '../../types/taxScenario';
import { 
  computeScenarioDeadlines, 
  ScenarioDeadlineReport, 
  TaxDeadline, 
  downloadIcsFile, 
  generateGoogleCalendarUrl,
  getReferenceNow
} from '../../utils/taxDeadlineUtils';

const STORAGE_KEY = 'bd_tax_planner_scenarios_v1';

interface TaxDeadlineNotificationProps {
  currentInputs?: TaxScenarioInputs;
  currentResults?: TaxScenarioResults;
  onLoadScenario?: (scenario: TaxScenario) => void;
  className?: string;
  variant?: 'banner' | 'card' | 'compact';
}

export function TaxDeadlineNotification({
  currentInputs,
  currentResults,
  onLoadScenario,
  className = '',
  variant = 'banner'
}: TaxDeadlineNotificationProps) {
  const [savedScenarios, setSavedScenarios] = useState<TaxScenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('active');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [notificationTab, setNotificationTab] = useState<'all' | 'advance' | 'annual'>('all');

  // Load scenarios from localStorage & listen to custom update events
  const loadScenarios = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSavedScenarios(parsed);
          return;
        }
      }
    } catch (e) {
      console.error('Failed to parse saved scenarios for deadlines', e);
    }
  };

  useEffect(() => {
    loadScenarios();

    const handleUpdate = () => {
      loadScenarios();
    };

    window.addEventListener('taxScenariosUpdated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('taxScenariosUpdated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Construct active temporary scenario from current inputs & results if provided
  const activeVirtualScenario: TaxScenario | null = useMemo(() => {
    if (!currentInputs || !currentResults) return null;
    return {
      id: 'active',
      name: 'Current Calculator Session',
      createdAt: new Date().toISOString(),
      inputs: currentInputs,
      results: currentResults
    };
  }, [currentInputs, currentResults]);

  // Combined selectable scenario options
  const allAvailableScenarios = useMemo(() => {
    const list: TaxScenario[] = [];
    if (activeVirtualScenario) {
      list.push(activeVirtualScenario);
    }
    savedScenarios.forEach(s => {
      if (!list.some(item => item.id === s.id)) {
        list.push(s);
      }
    });
    return list;
  }, [activeVirtualScenario, savedScenarios]);

  // Determine current active scenario for calculations
  const targetedScenario = useMemo(() => {
    if (selectedScenarioId === 'active' && activeVirtualScenario) {
      return activeVirtualScenario;
    }
    const found = savedScenarios.find(s => s.id === selectedScenarioId);
    if (found) return found;
    if (activeVirtualScenario) return activeVirtualScenario;
    if (savedScenarios.length > 0) return savedScenarios[0];
    return null;
  }, [selectedScenarioId, activeVirtualScenario, savedScenarios]);

  // Calculate deadline report
  const deadlineReport: ScenarioDeadlineReport | null = useMemo(() => {
    if (!targetedScenario) return null;
    return computeScenarioDeadlines(targetedScenario, getReferenceNow());
  }, [targetedScenario]);

  // Filter deadlines by active tab
  const filteredDeadlines = useMemo(() => {
    if (!deadlineReport) return [];
    if (notificationTab === 'advance') {
      return deadlineReport.deadlines.filter(d => d.category === 'advance_tax');
    }
    if (notificationTab === 'annual') {
      return deadlineReport.deadlines.filter(d => d.category === 'annual_return' || d.category === 'first_time_filer');
    }
    return deadlineReport.deadlines;
  }, [deadlineReport, notificationTab]);

  if (isDismissed) {
    return (
      <div className={`flex items-center justify-between p-3 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-amber-900 text-xs ${className}`}>
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-600 animate-pulse" />
          <span className="font-bold">Tax filing deadline alert is snoozed.</span>
          {deadlineReport?.primaryUpcomingDeadline && (
            <span className="text-amber-800 hidden sm:inline">
              Next: <strong className="font-semibold">{deadlineReport.primaryUpcomingDeadline.title}</strong> in {deadlineReport.primaryUpcomingDeadline.daysRemaining} days.
            </span>
          )}
        </div>
        <button
          onClick={() => setIsDismissed(false)}
          className="px-3 py-1 font-bold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100/50 rounded-lg transition-colors"
        >
          Show Alerts
        </button>
      </div>
    );
  }

  if (!deadlineReport || deadlineReport.deadlines.length === 0) {
    return null;
  }

  const primary = deadlineReport.primaryUpcomingDeadline;
  const isUrgentPrimary = primary ? primary.isUrgent : false;

  return (
    <div 
      id="tax-deadline-notification-banner"
      className={`rounded-3xl border transition-all duration-300 overflow-hidden shadow-sm ${
        isUrgentPrimary
          ? 'bg-gradient-to-br from-rose-50/95 via-amber-50/70 to-orange-50/90 border-rose-200/90'
          : 'bg-gradient-to-br from-emerald-50/95 via-teal-50/70 to-slate-50 border-emerald-200/80'
      } ${className}`}
    >
      {/* Top Main Alert Bar */}
      <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className={`p-2.5 rounded-2xl shrink-0 mt-0.5 ${
            isUrgentPrimary 
              ? 'bg-rose-500 text-white shadow-md shadow-rose-200 animate-bounce' 
              : 'bg-emerald-600 text-white shadow-md shadow-emerald-100'
          }`}>
            <Bell className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                isUrgentPrimary 
                  ? 'bg-rose-600 text-white animate-pulse' 
                  : 'bg-emerald-700 text-white'
              }`}>
                {isUrgentPrimary ? 'Urgent Deadline Alert' : 'Tax Calendar Alert'}
              </span>

              {primary && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${
                  primary.isUrgent 
                    ? 'bg-rose-100/90 border-rose-300 text-rose-900' 
                    : 'bg-emerald-100/90 border-emerald-300 text-emerald-900'
                }`}>
                  {primary.daysRemaining === 0 ? 'Due Today!' : `${primary.daysRemaining} days remaining`}
                </span>
              )}

              <span className="text-[11px] text-slate-500 font-medium">
                Income Tax Act 2023 Guidelines
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              {primary ? (
                <>
                  Approaching: <span className={isUrgentPrimary ? 'text-rose-700' : 'text-emerald-700'}>{primary.title}</span> ({primary.dateString})
                </>
              ) : (
                'Approaching Tax Deadlines'
              )}
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
              {primary ? (
                <>
                  {primary.description}
                  {primary.calculatedAmount && primary.calculatedAmount > 0 ? (
                    <span className="font-semibold text-slate-900 ml-1">
                      (Estimated: BDT {primary.calculatedAmount.toLocaleString()})
                    </span>
                  ) : null}
                </>
              ) : (
                'Stay compliant with statutory return submission and quarterly advance tax dates.'
              )}
            </p>
          </div>
        </div>

        {/* Action Controls Right Side */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          {primary && (
            <button
              type="button"
              onClick={() => downloadIcsFile(primary, targetedScenario.name)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-xs transition-colors"
              title="Add to iCalendar / Outlook"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Add Event</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors border ${
              isUrgentPrimary
                ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-800'
            }`}
          >
            <span>{isExpanded ? 'Hide Schedule' : 'View Schedule & Breakdown'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-black/5 transition-colors"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Schedule & Scenario Profile Panel */}
      {isExpanded && (
        <div className="border-t border-slate-200/70 bg-white/70 backdrop-blur-xs p-4 sm:p-6">
          {/* Profile Switcher & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200/60">
            {/* Scenario selector */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <Bookmark className="w-3.5 h-3.5 text-emerald-600" />
                Active Profile:
              </span>
              <select
                value={selectedScenarioId}
                onChange={(e) => setSelectedScenarioId(e.target.value)}
                className="bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs max-w-[220px]"
              >
                {allAvailableScenarios.map(sc => (
                  <option key={sc.id} value={sc.id}>
                    {sc.name} {sc.id === 'active' ? '(Current)' : ''}
                  </option>
                ))}
              </select>

              {onLoadScenario && targetedScenario && targetedScenario.id !== 'active' && (
                <button
                  type="button"
                  onClick={() => onLoadScenario(targetedScenario)}
                  className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                  title="Load this profile into the inputs above"
                >
                  Load in Planner
                </button>
              )}
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setNotificationTab('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  notificationTab === 'all' 
                    ? 'bg-white text-slate-900 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Deadlines ({deadlineReport.deadlines.length})
              </button>
              <button
                type="button"
                onClick={() => setNotificationTab('advance')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  notificationTab === 'advance' 
                    ? 'bg-white text-slate-900 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Advance Tax
              </button>
              <button
                type="button"
                onClick={() => setNotificationTab('annual')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  notificationTab === 'annual' 
                    ? 'bg-white text-slate-900 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tax Day Returns
              </button>
            </div>
          </div>

          {/* Key Profile Context Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/70">
              <span className="text-[11px] font-semibold text-slate-500 block">Assessed Income</span>
              <span className="text-sm font-extrabold text-slate-900">
                BDT {deadlineReport.totalIncome.toLocaleString()}
              </span>
            </div>

            <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/70">
              <span className="text-[11px] font-semibold text-slate-500 block">Net Payable Tax</span>
              <span className="text-sm font-extrabold text-emerald-700">
                BDT {deadlineReport.netPayable.toLocaleString()}
              </span>
            </div>

            <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/70">
              <span className="text-[11px] font-semibold text-slate-500 block">Advance Tax Status</span>
              <span className={`text-xs font-bold inline-flex items-center gap-1 ${
                deadlineReport.isAdvanceTaxApplicable ? 'text-amber-700' : 'text-slate-600'
              }`}>
                {deadlineReport.isAdvanceTaxApplicable ? 'Mandatory (Sec 154)' : 'Exempt (< BDT 6L)'}
              </span>
            </div>

            <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/70">
              <span className="text-[11px] font-semibold text-slate-500 block">Late Delay Interest Risk</span>
              <span className="text-xs font-bold text-rose-700">
                ~BDT {deadlineReport.monthlyDelayPenaltyEstimate.toLocaleString()} / month (2%)
              </span>
            </div>
          </div>

          {/* Timeline Cards Grid */}
          <div className="space-y-3">
            {filteredDeadlines.map((dl) => {
              const googleCalUrl = generateGoogleCalendarUrl(dl, targetedScenario.name);
              return (
                <div 
                  key={dl.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    dl.isUrgent
                      ? 'bg-rose-50/60 border-rose-200'
                      : dl.isApproaching
                      ? 'bg-amber-50/60 border-amber-200'
                      : 'bg-white border-slate-200/80 hover:border-emerald-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                        dl.isUrgent
                          ? 'bg-rose-600 text-white'
                          : dl.isApproaching
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        <Calendar className="w-4 h-4" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-extrabold text-slate-900">
                            {dl.title}
                          </h4>
                          {dl.banglaTitle && (
                            <span className="text-xs text-slate-500 font-medium hidden md:inline">
                              • {dl.banglaTitle}
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            dl.isUrgent
                              ? 'bg-rose-100 text-rose-800'
                              : dl.isApproaching
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {dl.daysRemaining} days left
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 mt-1">
                          {dl.description}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2 flex-wrap">
                          <span className="font-semibold text-slate-700">
                            Deadline: {dl.dateString}
                          </span>
                          <span>•</span>
                          <span className="text-slate-600">
                            {dl.statutorySection}
                          </span>
                          {dl.calculatedAmount && dl.calculatedAmount > 0 ? (
                            <>
                              <span>•</span>
                              <span className="font-bold text-emerald-700">
                                Amount Due: BDT {dl.calculatedAmount.toLocaleString()}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Deadline Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <a
                        href={googleCalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors text-xs font-semibold inline-flex items-center gap-1"
                        title="Add to Google Calendar"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">Google Cal</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>

                      <button
                        type="button"
                        onClick={() => downloadIcsFile(dl, targetedScenario.name)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1"
                        title="Download .ics Calendar Reminder"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>.ics</span>
                      </button>
                    </div>
                  </div>

                  {/* Warning Box if urgent */}
                  {dl.penaltyWarning && dl.isUrgent && (
                    <div className="mt-3 pt-3 border-t border-rose-200/60 flex items-start gap-2 text-[11px] text-rose-800">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <span><strong>Statutory Warning:</strong> {dl.penaltyWarning}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Statutory Advisory Note */}
          <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-start gap-2.5 text-xs text-slate-500">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Regulatory Note:</strong> Deadlines are calculated under the Income Tax Act 2023 and NBR Annual Guidelines. Tax Day is fixed for 30 November unless formally extended via NBR Statutory Regulatory Order (SRO). First-time individual assessees have until 30 June of the assessment year per Section 166.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
