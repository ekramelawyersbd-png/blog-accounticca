import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bell, 
  Calendar, 
  Clock, 
  ChevronRight, 
  AlertTriangle, 
  Download, 
  ExternalLink,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { TaxScenario } from '../../types/taxScenario';
import { 
  computeScenarioDeadlines, 
  ScenarioDeadlineReport, 
  downloadIcsFile, 
  getReferenceNow 
} from '../../utils/taxDeadlineUtils';

const STORAGE_KEY = 'bd_tax_planner_scenarios_v1';

interface TaxDeadlineNavDropdownProps {
  className?: string;
}

export function TaxDeadlineNavDropdown({ className = '' }: TaxDeadlineNavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scenarios, setScenarios] = useState<TaxScenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadScenarios = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setScenarios(parsed);
          setSelectedScenarioId(prev => (prev && parsed.some(s => s.id === prev) ? prev : parsed[0].id));
          return;
        }
      }
    } catch (e) {
      console.error('Error loading scenarios for nav alert', e);
    }
  };

  useEffect(() => {
    loadScenarios();

    const handleUpdate = () => loadScenarios();
    window.addEventListener('taxScenariosUpdated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('taxScenariosUpdated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const activeScenario = useMemo(() => {
    if (!scenarios || scenarios.length === 0) return null;
    return scenarios.find(s => s.id === selectedScenarioId) || scenarios[0];
  }, [scenarios, selectedScenarioId]);

  const deadlineReport: ScenarioDeadlineReport | null = useMemo(() => {
    if (!activeScenario) return null;
    return computeScenarioDeadlines(activeScenario, getReferenceNow());
  }, [activeScenario]);

  const primary = deadlineReport?.primaryUpcomingDeadline;
  const isUrgent = primary ? primary.isUrgent : false;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        id="navbar-tax-deadline-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Tax Filing Deadlines & Alerts"
        aria-label="View approaching tax filing deadlines"
        className={`relative p-2 rounded-xl transition-all duration-200 flex items-center justify-center ${
          isOpen
            ? 'bg-emerald-100 text-emerald-800'
            : isUrgent
            ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50'
            : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
        }`}
      >
        <Bell className={`w-5 h-5 ${isUrgent ? 'animate-swing' : ''}`} />
        
        {/* Urgency Badge */}
        {primary && (
          <span className={`absolute -top-1 -right-1 text-white text-[10px] font-extrabold h-4 min-w-[18px] px-1 rounded-full flex items-center justify-center shadow-xs ${
            isUrgent 
              ? 'bg-rose-600 animate-pulse ring-2 ring-white' 
              : 'bg-emerald-600'
          }`}>
            {primary.daysRemaining === 0 ? '!' : `${primary.daysRemaining}d`}
          </span>
        )}
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 pb-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isUrgent ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`} />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Tax Deadlines Alert
              </h4>
            </div>
            
            <Link
              to="/tax-planner"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              Tax Planner <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Profile Switcher if multiple scenarios exist */}
          {scenarios.length > 1 && (
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-slate-500">Based on Profile:</span>
              <select
                value={selectedScenarioId}
                onChange={(e) => setSelectedScenarioId(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 max-w-[180px] truncate"
              >
                {scenarios.map(sc => (
                  <option key={sc.id} value={sc.id}>
                    {sc.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Body */}
          {deadlineReport && deadlineReport.deadlines.length > 0 ? (
            <div className="px-3 py-2 max-h-[360px] overflow-y-auto space-y-2">
              {/* Primary Urgent Highlight Card */}
              {primary && (
                <div className={`p-3 rounded-xl border ${
                  isUrgent 
                    ? 'bg-rose-50/80 border-rose-200 text-rose-950' 
                    : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-sm uppercase tracking-wide ${
                      isUrgent ? 'bg-rose-600 text-white' : 'bg-emerald-700 text-white'
                    }`}>
                      {isUrgent ? 'Urgent Approaching' : 'Next Statutory Date'}
                    </span>
                    <span className="text-xs font-black">
                      {primary.daysRemaining === 0 ? 'Due Today!' : `${primary.daysRemaining} days left`}
                    </span>
                  </div>

                  <p className="text-xs font-bold leading-snug">
                    {primary.title} ({primary.dateString})
                  </p>
                  <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                    {primary.description}
                  </p>

                  <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-semibold">
                      {primary.statutorySection}
                    </span>
                    <button
                      type="button"
                      onClick={() => downloadIcsFile(primary, activeScenario?.name || 'Tax Profile')}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-emerald-800 bg-white/90 px-2 py-0.5 rounded-md border border-slate-200/80 shadow-2xs"
                    >
                      <Download className="w-3 h-3" /> Add Event
                    </button>
                  </div>
                </div>
              )}

              {/* Other upcoming list */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 block">
                  Other Statutory Deadlines
                </span>
                {deadlineReport.deadlines.slice(1, 4).map(dl => (
                  <div 
                    key={dl.id}
                    className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                        {dl.title}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {dl.dateString} • {dl.statutorySection}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-600 shrink-0 bg-slate-100 px-2 py-0.5 rounded-md">
                      {dl.daysRemaining}d
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-6 px-4 text-center">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-600 font-medium">No saved tax scenarios detected.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Configure your income profile in Tax Planner to track personalized deadlines.</p>
            </div>
          )}

          {/* Footer */}
          <div className="px-4 pt-2 pb-1 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">AY 2026-2027 Guidelines</span>
            <Link
              to="/tax-planner"
              onClick={() => setIsOpen(false)}
              className="font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
            >
              Open Full Planner <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
