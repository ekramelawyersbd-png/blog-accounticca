import React, { useState, useEffect } from 'react';
import { 
  Bookmark, 
  Save, 
  Trash2, 
  ArrowRightLeft, 
  Sparkles, 
  Check, 
  Layers, 
  FolderPlus, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Calendar,
  Share2
} from 'lucide-react';
import { TaxScenario, TaxScenarioInputs, TaxScenarioResults } from '../../types/taxScenario';
import { TaxScenarioComparison } from './TaxScenarioComparison';
import { ShareTaxScenarioModal } from './ShareTaxScenarioModal';
import { computeScenarioDeadlines, getReferenceNow } from '../../utils/taxDeadlineUtils';

const STORAGE_KEY = 'bd_tax_planner_scenarios_v1';

interface TaxScenarioManagerProps {
  currentInputs: TaxScenarioInputs;
  currentResults: TaxScenarioResults;
  onLoadScenario: (scenario: TaxScenario) => void;
  onShareScenario?: (scenario: TaxScenario) => void;
}

const SAMPLE_SCENARIOS: TaxScenario[] = [
  {
    id: 'sample-standard-corporate',
    name: 'Standard Salary (No Investment)',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    notes: 'Base compensation without tax rebate deductions.',
    inputs: {
      income: '1500000',
      investment: '0',
      tds: '25000',
      category: 'general',
      disabledDependents: 0,
      location: 'dhaka_ctg',
      isFirstTimeFiler: false
    },
    results: {
      totalLimit: 400000,
      taxableIncome: 1100000,
      grossTax: 150000,
      rebate: 0,
      netTaxBeforeMin: 150000,
      minimumTax: 5000,
      finalLiability: 150000,
      netPayable: 125000
    }
  },
  {
    id: 'sample-maximized-rebate',
    name: 'Tax-Optimized (Max Investment Rebate)',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    notes: 'Salary with 300,000 BDT DPS & Sanchayapatra investments.',
    inputs: {
      income: '1500000',
      investment: '300000',
      tds: '25000',
      category: 'general',
      disabledDependents: 0,
      location: 'dhaka_ctg',
      isFirstTimeFiler: false
    },
    results: {
      totalLimit: 400000,
      taxableIncome: 1100000,
      grossTax: 150000,
      rebate: 45000,
      netTaxBeforeMin: 105000,
      minimumTax: 5000,
      finalLiability: 105000,
      netPayable: 80000
    }
  }
];

export function TaxScenarioManager({
  currentInputs,
  currentResults,
  onLoadScenario,
  onShareScenario
}: TaxScenarioManagerProps) {
  const [scenarios, setScenarios] = useState<TaxScenario[]>([]);
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioNotes, setScenarioNotes] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [activeLoadedId, setActiveLoadedId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [sharingScenario, setSharingScenario] = useState<TaxScenario | null>(null);

  // Load from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setScenarios(parsed);
          return;
        }
      }
      // If nothing saved, initialize with sample scenarios for great initial UX
      setScenarios(SAMPLE_SCENARIOS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_SCENARIOS));
    } catch (e) {
      console.error('Failed to load scenarios from localStorage', e);
      setScenarios(SAMPLE_SCENARIOS);
    }
  }, []);

  // Save to local storage
  const persistScenarios = (updated: TaxScenario[]) => {
    setScenarios(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('taxScenariosUpdated'));
    } catch (e) {
      console.error('Failed to persist scenarios to localStorage', e);
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const handleSaveCurrentScenario = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = scenarioName.trim() || `Plan ${scenarios.length + 1} (${new Date().toLocaleDateString()})`;

    const newScenario: TaxScenario = {
      id: 'sc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      name: finalName,
      createdAt: new Date().toISOString(),
      notes: scenarioNotes.trim() || undefined,
      inputs: { ...currentInputs },
      results: { ...currentResults }
    };

    const updated = [newScenario, ...scenarios];
    persistScenarios(updated);
    setActiveLoadedId(newScenario.id);
    setScenarioName('');
    setScenarioNotes('');
    setShowSaveForm(false);
    showToast(`Scenario "${finalName}" saved to local storage.`);
  };

  const handleDeleteScenario = (id: string, name: string) => {
    const updated = scenarios.filter(s => s.id !== id);
    persistScenarios(updated);
    setSelectedIds(prev => prev.filter(selId => selId !== id));
    if (activeLoadedId === id) {
      setActiveLoadedId(null);
    }
    showToast(`Scenario "${name}" removed.`);
  };

  const handleLoadScenario = (sc: TaxScenario) => {
    onLoadScenario(sc);
    setActiveLoadedId(sc.id);
    showToast(`Loaded "${sc.name}" into the active planner.`);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleResetToSamples = () => {
    persistScenarios(SAMPLE_SCENARIOS);
    setSelectedIds([]);
    showToast('Reset scenarios to default samples.');
  };

  // Compare selected scenarios (or fallback to comparing all if none checked)
  const scenariosToCompare = scenarios.filter(s => selectedIds.includes(s.id));

  return (
    <div id="tax-scenario-manager-section" className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/60 mt-10">
      
      {/* Toast Alert */}
      {notification && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bookmark className="w-5 h-5 text-emerald-600" />
            <h3 className="text-xl font-bold text-slate-900">Saved Tax Scenarios</h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {scenarios.length} {scenarios.length === 1 ? 'Saved' : 'Saved'}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Save multiple variations of income, investments, and filing conditions to local storage and compare side-by-side.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="open-save-scenario-btn"
            onClick={() => setShowSaveForm(!showSaveForm)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            Save Current Plan
          </button>

          {scenarios.length >= 2 && (
            <button
              id="compare-scenarios-btn"
              onClick={() => {
                if (selectedIds.length < 2) {
                  // If user clicked compare without selecting, select the first 2 by default
                  setSelectedIds(scenarios.slice(0, 2).map(s => s.id));
                }
                setShowComparison(true);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                selectedIds.length >= 2 
                  ? 'bg-slate-900 hover:bg-slate-800 text-white' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              Compare ({selectedIds.length >= 2 ? selectedIds.length : 'Select'})
            </button>
          )}
        </div>
      </div>

      {/* Save Scenario Form Drawer */}
      {showSaveForm && (
        <form 
          onSubmit={handleSaveCurrentScenario}
          className="mb-8 p-5 bg-slate-50 rounded-2xl border border-slate-200/80 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Save className="w-4 h-4 text-emerald-600" /> Save Active Planner Values
            </h4>
            <span className="text-xs text-slate-500">Saved locally in browser</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Scenario Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Plan A: 300k Sanchayapatra Rebate"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Notes / Strategy (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Assumes 1st time filer bonus or Dhaka location"
                value={scenarioNotes}
                onChange={(e) => setScenarioNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <span className="font-semibold text-slate-700">Captures:</span>
              Income: {parseInt(currentInputs.income || '0', 10).toLocaleString()} BDT | 
              Tax: {currentResults.finalLiability.toLocaleString()} BDT
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSaveForm(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="submit-save-scenario-btn"
                className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> Save Scenario
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Scenarios Grid / List */}
      {scenarios.length === 0 ? (
        <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800 mb-1">No Saved Tax Scenarios</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            Adjust your income and investment numbers above, then click &quot;Save Current Plan&quot; to bookmark different options for side-by-side evaluation.
          </p>
          <button
            onClick={handleResetToSamples}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
          >
            Load Sample Comparative Scenarios
          </button>
        </div>
      ) : (
        <div>
          {/* Comparison Helper Bar */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-3 px-1">
            <span>Check 2 or more scenarios to compare side-by-side ({selectedIds.length} selected):</span>
            <div className="flex items-center gap-3">
              {selectedIds.length > 0 && (
                <button
                  onClick={() => setSelectedIds([])}
                  className="text-slate-400 hover:text-slate-600 underline"
                >
                  Clear selection
                </button>
              )}
              {selectedIds.length < scenarios.length && (
                <button
                  onClick={() => setSelectedIds(scenarios.map(s => s.id))}
                  className="text-emerald-600 hover:text-emerald-700 font-semibold"
                >
                  Select all ({scenarios.length})
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenarios.map((sc) => {
              const isSelected = selectedIds.includes(sc.id);
              const isActive = activeLoadedId === sc.id;
              const isCliff = sc.results.taxableIncome > 0 && sc.results.finalLiability === sc.results.minimumTax;

              return (
                <div
                  key={sc.id}
                  className={`rounded-2xl p-4 transition-all border flex flex-col justify-between ${
                    isSelected 
                      ? 'border-emerald-500 bg-emerald-50/20 shadow-sm' 
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    {/* Top Row: checkbox + title + delete */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <label className="flex items-start gap-2.5 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(sc.id)}
                          className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                        />
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1">
                            {sc.name}
                          </h4>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {new Date(sc.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </label>

                      <button
                        id={`delete-scenario-btn-${sc.id}`}
                        onClick={() => handleDeleteScenario(sc.id, sc.name)}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Delete scenario"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {sc.notes && (
                      <p className="text-xs text-slate-500 italic mb-3 line-clamp-1">
                        {sc.notes}
                      </p>
                    )}

                    {/* Stats badges */}
                    <div className="grid grid-cols-2 gap-2 my-3 p-2.5 bg-slate-50 rounded-xl text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Income</span>
                        <span className="font-bold text-slate-800">
                          {parseInt(sc.inputs.income || '0', 10).toLocaleString()} BDT
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Investment</span>
                        <span className="font-semibold text-slate-700">
                          {parseInt(sc.inputs.investment || '0', 10).toLocaleString()} BDT
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Net Payable</span>
                        <span className="font-black text-emerald-700">
                          {sc.results.netPayable.toLocaleString()} BDT
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Status</span>
                        {isCliff ? (
                          <span className="text-amber-700 font-semibold text-[11px]">Min Tax Cliff</span>
                        ) : (
                          <span className="text-slate-600 font-medium text-[11px]">Normal Slab</span>
                        )}
                      </div>
                    </div>

                    {/* Approaching Deadline Indicator for this Profile */}
                    {(() => {
                      const report = computeScenarioDeadlines(sc, getReferenceNow());
                      const primary = report.primaryUpcomingDeadline;
                      if (!primary) return null;
                      return (
                        <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-semibold mb-2 ${
                          primary.isUrgent
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          <span className="flex items-center gap-1 truncate max-w-[170px]">
                            <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate">{primary.title}:</span>
                          </span>
                          <span className="font-bold shrink-0 ml-1">
                            {primary.daysRemaining === 0 ? 'Today!' : `${primary.daysRemaining}d left`}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Bottom Action */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <ShieldCheck className="w-3.5 h-3.5" /> Active in Planner
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">Ready to load</span>
                    )}

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        id={`share-scenario-card-btn-${sc.id}`}
                        onClick={() => {
                          if (onShareScenario) {
                            onShareScenario(sc);
                          } else {
                            setSharingScenario(sc);
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-emerald-700 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 transition-colors shadow-2xs"
                        title="Share this scenario via deep link or email"
                      >
                        <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Share</span>
                      </button>

                      <button
                        type="button"
                        id={`load-scenario-btn-${sc.id}`}
                        onClick={() => handleLoadScenario(sc)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                      >
                        Load <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick comparison action button below the cards */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              💡 Tip: Save different investment amounts (e.g. 0 vs 200,000 BDT) to see exact tax rebate savings and cliff boundaries.
            </div>

            <button
              id="compare-selected-scenarios-footer-btn"
              onClick={() => {
                if (selectedIds.length < 2) {
                  setSelectedIds(scenarios.slice(0, 2).map(s => s.id));
                }
                setShowComparison(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-colors"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Open Side-by-Side Comparison
            </button>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {showComparison && (
        <TaxScenarioComparison
          scenarios={scenariosToCompare.length >= 2 ? scenariosToCompare : scenarios.slice(0, 2)}
          onClose={() => setShowComparison(false)}
          onLoadScenario={(sc) => {
            handleLoadScenario(sc);
            setShowComparison(false);
          }}
          onShareScenario={(sc) => {
            if (onShareScenario) {
              onShareScenario(sc);
            } else {
              setSharingScenario(sc);
            }
          }}
        />
      )}

      {/* Standalone Share Modal fallback if used independently */}
      {sharingScenario && (
        <ShareTaxScenarioModal
          isOpen={!!sharingScenario}
          onClose={() => setSharingScenario(null)}
          scenarioName={sharingScenario.name}
          notes={sharingScenario.notes}
          inputs={sharingScenario.inputs}
          results={sharingScenario.results}
        />
      )}

    </div>
  );
}
