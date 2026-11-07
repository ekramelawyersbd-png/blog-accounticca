import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  ArrowRightLeft,
  BarChart3,
  CheckCircle2,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Layers,
  Scale,
  BookmarkCheck
} from 'lucide-react';
import {
  TaxCategory,
  TaxLocation,
  TaxScenario,
  TaxScenarioInputs,
  TaxScenarioResults
} from '../../types/taxScenario';

const STORAGE_KEY = 'bd_tax_planner_scenarios_v1';

export interface ComputedSlabItem {
  slabKey: string;
  slabLabel: string;
  rateLabel: string;
  taxableSlice: number;
  taxAmount: number;
}

export interface ComputedScenarioSummary {
  results: TaxScenarioResults;
  effectiveRate: number;
  slabs: ComputedSlabItem[];
}

export interface PresetScenarioOption {
  id: string;
  group: 'preset' | 'saved' | 'active';
  label: string;
  badge: string;
  inputs: TaxScenarioInputs;
}

const STATUTORY_PRESETS: PresetScenarioOption[] = [
  {
    id: 'preset-15l-no-inv',
    group: 'preset',
    label: 'BDT 15,00,000 Income — Standard (Zero Investment)',
    badge: 'No Rebate Baseline',
    inputs: {
      income: '1500000',
      investment: '0',
      tds: '25000',
      category: 'general',
      disabledDependents: 0,
      location: 'dhaka_ctg',
      isFirstTimeFiler: false
    }
  },
  {
    id: 'preset-15l-max-inv',
    group: 'preset',
    label: 'BDT 15,00,000 Income — Tax-Optimized (BDT 3,00,000 Investment)',
    badge: 'Full Sec 78 Rebate',
    inputs: {
      income: '1500000',
      investment: '300000',
      tds: '25000',
      category: 'general',
      disabledDependents: 0,
      location: 'dhaka_ctg',
      isFirstTimeFiler: false
    }
  },
  {
    id: 'preset-15l-female-senior',
    group: 'preset',
    label: 'BDT 15,00,000 Income — Female / Senior 65+ (With Investment)',
    badge: 'Higher 4.5L Threshold',
    inputs: {
      income: '1500000',
      investment: '300000',
      tds: '25000',
      category: 'female_senior',
      disabledDependents: 0,
      location: 'dhaka_ctg',
      isFirstTimeFiler: false
    }
  },
  {
    id: 'preset-24l-no-inv',
    group: 'preset',
    label: 'BDT 24,00,000 Income — Mid-Senior Executive (No Investment)',
    badge: 'Unoptimized',
    inputs: {
      income: '2400000',
      investment: '0',
      tds: '60000',
      category: 'general',
      disabledDependents: 0,
      location: 'dhaka_ctg',
      isFirstTimeFiler: false
    }
  },
  {
    id: 'preset-24l-max-inv',
    group: 'preset',
    label: 'BDT 24,00,000 Income — Mid-Senior Executive (BDT 4,80,000 Investment)',
    badge: 'Optimized Sec 78',
    inputs: {
      income: '2400000',
      investment: '480000',
      tds: '60000',
      category: 'general',
      disabledDependents: 0,
      location: 'dhaka_ctg',
      isFirstTimeFiler: false
    }
  },
  {
    id: 'preset-40l-exec',
    group: 'preset',
    label: 'BDT 40,00,000 Income — C-Suite / High Earner (With Rebate)',
    badge: '25%–30% Slabs',
    inputs: {
      income: '4000000',
      investment: '800000',
      tds: '150000',
      category: 'general',
      disabledDependents: 0,
      location: 'dhaka_ctg',
      isFirstTimeFiler: false
    }
  },
  {
    id: 'preset-min-tax-cliff',
    group: 'preset',
    label: 'BDT 5,20,000 Income — First-Time Filer vs Dhaka Minimum Cliff',
    badge: 'Minimum Tax Rule',
    inputs: {
      income: '520000',
      investment: '100000',
      tds: '0',
      category: 'general',
      disabledDependents: 0,
      location: 'dhaka_ctg',
      isFirstTimeFiler: true
    }
  }
];

const CATEGORY_LABELS: Record<TaxCategory, string> = {
  general: 'General Individual (4.0L Limit)',
  female_senior: 'Female / Senior 65+ (4.5L Limit)',
  disabled: 'Person with Disability (5.25L Limit)',
  freedom_fighter: 'Gazetted Freedom Fighter (5.5L Limit)'
};

const LOCATION_LABELS: Record<TaxLocation, string> = {
  dhaka_ctg: 'Dhaka / Chattogram City Corp.',
  other_cc: 'Other City Corporation',
  non_cc: 'Outside City Corporation'
};

export function computeScenarioTax(inputs: TaxScenarioInputs): ComputedScenarioSummary {
  const inc = Math.max(0, Number(inputs.income) || 0);
  const inv = Math.max(0, Number(inputs.investment) || 0);
  const preTds = Math.max(0, Number(inputs.tds) || 0);

  let baseLimit = 400000;
  if (inputs.category === 'female_senior') baseLimit = 450000;
  if (inputs.category === 'disabled') baseLimit = 525000;
  if (inputs.category === 'freedom_fighter') baseLimit = 550000;

  const totalLimit = baseLimit + (Number(inputs.disabledDependents) || 0) * 50000;
  const taxableIncome = Math.max(0, inc - totalLimit);

  let rem = taxableIncome;
  const slabs: ComputedSlabItem[] = [
    {
      slabKey: '0%',
      slabLabel: `0% Exempt Tier (Up to ${(totalLimit / 100000).toFixed(2)}L)`,
      rateLabel: '0% Tier',
      taxableSlice: Math.min(inc, totalLimit),
      taxAmount: 0
    }
  ];

  // Next 300,000 @ 10%
  const slice10 = rem > 0 ? Math.min(rem, 300000) : 0;
  const tax10 = slice10 * 0.10;
  rem -= slice10;
  slabs.push({
    slabKey: '10%',
    slabLabel: 'Next BDT 3,00,000 @ 10%',
    rateLabel: '10% Slab',
    taxableSlice: slice10,
    taxAmount: Math.round(tax10)
  });

  // Next 400,000 @ 15%
  const slice15 = rem > 0 ? Math.min(rem, 400000) : 0;
  const tax15 = slice15 * 0.15;
  rem -= slice15;
  slabs.push({
    slabKey: '15%',
    slabLabel: 'Next BDT 4,00,000 @ 15%',
    rateLabel: '15% Slab',
    taxableSlice: slice15,
    taxAmount: Math.round(tax15)
  });

  // Next 500,000 @ 20%
  const slice20 = rem > 0 ? Math.min(rem, 500000) : 0;
  const tax20 = slice20 * 0.20;
  rem -= slice20;
  slabs.push({
    slabKey: '20%',
    slabLabel: 'Next BDT 5,00,000 @ 20%',
    rateLabel: '20% Slab',
    taxableSlice: slice20,
    taxAmount: Math.round(tax20)
  });

  // Next 2,000,000 @ 25%
  const slice25 = rem > 0 ? Math.min(rem, 2000000) : 0;
  const tax25 = slice25 * 0.25;
  rem -= slice25;
  slabs.push({
    slabKey: '25%',
    slabLabel: 'Next BDT 20,00,000 @ 25%',
    rateLabel: '25% Slab',
    taxableSlice: slice25,
    taxAmount: Math.round(tax25)
  });

  // Balance @ 30%
  const slice30 = rem > 0 ? rem : 0;
  const tax30 = slice30 * 0.30;
  slabs.push({
    slabKey: '30%',
    slabLabel: 'Remaining Balance @ 30%',
    rateLabel: '30% Slab',
    taxableSlice: slice30,
    taxAmount: Math.round(tax30)
  });

  const grossTax = Math.round(tax10 + tax15 + tax20 + tax25 + tax30);

  // Investment Rebate (Section 78): Lower of 3% of taxable income, 15% of investment, or 1,000,000 BDT
  let rebate = 0;
  if (taxableIncome > 0 && inv > 0) {
    const r1 = taxableIncome * 0.03;
    const r2 = inv * 0.15;
    const r3 = 1000000;
    rebate = Math.round(Math.min(r1, r2, r3));
  }
  rebate = Math.min(rebate, grossTax);

  const netTaxBeforeMin = Math.max(0, grossTax - rebate);

  let minimumTax = 0;
  if (taxableIncome > 0) {
    if (inputs.isFirstTimeFiler) {
      minimumTax = 1000;
    } else {
      if (inputs.location === 'dhaka_ctg') minimumTax = 5000;
      else if (inputs.location === 'other_cc') minimumTax = 4000;
      else minimumTax = 3000;
    }
  }

  const finalLiability = taxableIncome > 0 ? Math.max(netTaxBeforeMin, minimumTax) : 0;
  const netPayable = Math.max(0, finalLiability - preTds);
  const effectiveRate = inc > 0 ? (finalLiability / inc) * 100 : 0;

  return {
    results: {
      totalLimit,
      taxableIncome,
      grossTax,
      rebate,
      netTaxBeforeMin,
      minimumTax,
      finalLiability,
      netPayable
    },
    effectiveRate,
    slabs
  };
}

interface TaxScenarioBarComparisonProps {
  activeCalculatorInputs?: TaxScenarioInputs;
  activeCalculatorLabel?: string;
  title?: string;
  subtitle?: string;
}

export function TaxScenarioBarComparison({
  activeCalculatorInputs,
  activeCalculatorLabel = 'Current Calculator Input',
  title = 'Side-by-Side Tax Scenario Comparison',
  subtitle = 'Select any two tax scenarios—statutory presets, saved scenarios, or custom parameters—and compare their tax liabilities side-by-side via Recharts.'
}: TaxScenarioBarComparisonProps) {
  const [savedScenarios, setSavedScenarios] = useState<TaxScenario[]>([]);
  const [chartView, setChartView] = useState<'liability' | 'slabs'>('liability');
  const [showCustomEditors, setShowCustomEditors] = useState<boolean>(false);

  // Load saved scenarios from localStorage
  const loadSavedFromStorage = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSavedScenarios(parsed);
        }
      }
    } catch {
      // Ignore storage read errors
    }
  };

  useEffect(() => {
    loadSavedFromStorage();
    const handleStorageChange = () => loadSavedFromStorage();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const [scenarioAId, setScenarioAId] = useState<string>('preset-15l-no-inv');
  const [scenarioBId, setScenarioBId] = useState<string>('preset-15l-max-inv');

  const [scenarioAName, setScenarioAName] = useState<string>('Scenario A: Standard (No Investment)');
  const [scenarioBName, setScenarioBName] = useState<string>('Scenario B: Tax-Optimized (Max Rebate)');

  const [inputsA, setInputsA] = useState<TaxScenarioInputs>(STATUTORY_PRESETS[0].inputs);
  const [inputsB, setInputsB] = useState<TaxScenarioInputs>(STATUTORY_PRESETS[1].inputs);

  // Combine all selectable options
  const allOptions = useMemo<PresetScenarioOption[]>(() => {
    const opts: PresetScenarioOption[] = [];

    if (activeCalculatorInputs && Number(activeCalculatorInputs.income) > 0) {
      opts.push({
        id: 'active-calculator',
        group: 'active',
        label: `${activeCalculatorLabel} (BDT ${Number(activeCalculatorInputs.income).toLocaleString()})`,
        badge: 'Live Input',
        inputs: activeCalculatorInputs
      });
    }

    savedScenarios.forEach((sc) => {
      opts.push({
        id: `saved-${sc.id}`,
        group: 'saved',
        label: `${sc.name} (BDT ${Number(sc.inputs.income || 0).toLocaleString()})`,
        badge: 'Saved Scenario',
        inputs: sc.inputs
      });
    });

    STATUTORY_PRESETS.forEach((preset) => {
      opts.push(preset);
    });

    return opts;
  }, [activeCalculatorInputs, activeCalculatorLabel, savedScenarios]);

  const handleSelectScenarioA = (optionId: string) => {
    setScenarioAId(optionId);
    if (optionId === 'custom') return;
    const found = allOptions.find((o) => o.id === optionId);
    if (found) {
      setInputsA({ ...found.inputs });
      setScenarioAName(`Scenario A: ${found.label.split(' (')[0]}`);
    }
  };

  const handleSelectScenarioB = (optionId: string) => {
    setScenarioBId(optionId);
    if (optionId === 'custom') return;
    const found = allOptions.find((o) => o.id === optionId);
    if (found) {
      setInputsB({ ...found.inputs });
      setScenarioBName(`Scenario B: ${found.label.split(' (')[0]}`);
    }
  };

  const handleSyncActiveToA = () => {
    if (!activeCalculatorInputs) return;
    setScenarioAId('active-calculator');
    setInputsA({ ...activeCalculatorInputs });
    setScenarioAName(`Scenario A: ${activeCalculatorLabel}`);
  };

  const handleSwapScenarios = () => {
    const tempId = scenarioAId;
    const tempName = scenarioAName;
    const tempInputs = { ...inputsA };

    setScenarioAId(scenarioBId);
    setScenarioAName(scenarioBName.replace(/^Scenario B:/, 'Scenario A:'));
    setInputsA({ ...inputsB });

    setScenarioBId(tempId);
    setScenarioBName(tempName.replace(/^Scenario A:/, 'Scenario B:'));
    setInputsB(tempInputs);
  };

  const summaryA = useMemo(() => computeScenarioTax(inputsA), [inputsA]);
  const summaryB = useMemo(() => computeScenarioTax(inputsB), [inputsB]);

  const liabilityChartData = useMemo(() => {
    return [
      {
        metric: 'Gross Slab Tax',
        fullDescription: 'Total Progressive Tax Before Section 78 Rebate',
        scenarioA: summaryA.results.grossTax,
        scenarioB: summaryB.results.grossTax
      },
      {
        metric: 'Investment Rebate',
        fullDescription: 'Section 78 Tax Credit on Eligible Investments',
        scenarioA: summaryA.results.rebate,
        scenarioB: summaryB.results.rebate
      },
      {
        metric: 'Final Tax Liability',
        fullDescription: 'Net Assessed Tax Liability (Subject to Statutory Minimum)',
        scenarioA: summaryA.results.finalLiability,
        scenarioB: summaryB.results.finalLiability
      },
      {
        metric: 'Net Payable (After TDS)',
        fullDescription: 'Remaining Balance Payable with Return u/s 173',
        scenarioA: summaryA.results.netPayable,
        scenarioB: summaryB.results.netPayable
      }
    ];
  }, [summaryA, summaryB]);

  const slabChartData = useMemo(() => {
    return summaryA.slabs.slice(1).map((slabA, idx) => {
      const slabB = summaryB.slabs[idx + 1];
      return {
        metric: slabA.rateLabel,
        fullDescription: slabA.slabLabel,
        scenarioA: slabA.taxAmount,
        scenarioB: slabB ? slabB.taxAmount : 0
      };
    });
  }, [summaryA, summaryB]);

  const activeChartData = chartView === 'liability' ? liabilityChartData : slabChartData;

  const liabilityDiff = summaryB.results.finalLiability - summaryA.results.finalLiability;
  const savingsAmount = Math.abs(liabilityDiff);
  const savingsPct =
    summaryA.results.finalLiability > 0
      ? ((Math.abs(liabilityDiff) / summaryA.results.finalLiability) * 100).toFixed(1)
      : '0.0';

  return (
    <section
      id="tax-scenario-comparison-chart"
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden my-10"
    >
      {/* Top Header */}
      <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-900 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2">
              <BarChart3 className="w-4 h-4" />
              <span>Interactive Two-Scenario Liability Comparator (AY 2026–2027)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
              {subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {activeCalculatorInputs && Number(activeCalculatorInputs.income) > 0 && (
              <button
                type="button"
                onClick={handleSyncActiveToA}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Use Current Inputs as Scenario A</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleSwapScenarios}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              title="Swap Scenario A and Scenario B"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span>Swap A ↔ B</span>
            </button>
            <button
              type="button"
              onClick={() => {
                loadSavedFromStorage();
                setShowCustomEditors((prev) => !prev);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                showCustomEditors
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showCustomEditors ? 'Hide Parameter Editors' : 'Customize Parameters'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-8">
        {/* Scenario A & Scenario B Selectors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scenario A Selector Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-xs bg-slate-800 inline-block shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Scenario A (Baseline)
                  </span>
                </div>
                <span className="text-xs font-mono font-semibold text-slate-600 bg-white px-2.5 py-0.5 rounded border border-slate-200 tabular-nums">
                  Effective Rate: {summaryA.effectiveRate.toFixed(2)}%
                </span>
              </div>

              <label htmlFor="select-scenario-a" className="sr-only">
                Select Scenario A
              </label>
              <select
                id="select-scenario-a"
                value={scenarioAId}
                onChange={(e) => handleSelectScenarioA(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {activeCalculatorInputs && Number(activeCalculatorInputs.income) > 0 && (
                  <optgroup label="Live Calculator Input">
                    {allOptions
                      .filter((o) => o.group === 'active')
                      .map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                  </optgroup>
                )}
                {savedScenarios.length > 0 && (
                  <optgroup label="Your Saved Scenarios">
                    {allOptions
                      .filter((o) => o.group === 'saved')
                      .map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                  </optgroup>
                )}
                <optgroup label="Finance Act 2026 Benchmark Scenarios">
                  {allOptions
                    .filter((o) => o.group === 'preset')
                    .map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                </optgroup>
                <option value="custom">Custom Scenario A Parameters</option>
              </select>

              {/* Quick Summary Chips */}
              <div className="grid grid-cols-3 gap-2.5 mt-4 pt-4 border-t border-slate-200/80 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                  <span className="text-slate-500 block text-[11px]">Annual Income</span>
                  <strong className="text-slate-900 font-bold tabular-nums">
                    BDT {Number(inputsA.income || 0).toLocaleString()}
                  </strong>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                  <span className="text-slate-500 block text-[11px]">Eligible Investment</span>
                  <strong className="text-emerald-700 font-bold tabular-nums">
                    BDT {Number(inputsA.investment || 0).toLocaleString()}
                  </strong>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                  <span className="text-slate-500 block text-[11px]">Final Tax Liability</span>
                  <strong className="text-slate-900 font-bold tabular-nums">
                    BDT {summaryA.results.finalLiability.toLocaleString()}
                  </strong>
                </div>
              </div>

              {/* Optional Inline Editor for Scenario A */}
              {showCustomEditors && (
                <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Annual Income (BDT)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        value={inputsA.income}
                        onChange={(e) => {
                          setScenarioAId('custom');
                          setScenarioAName('Scenario A: Custom Input');
                          setInputsA({ ...inputsA, income: e.target.value });
                        }}
                        className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Investment (Sec 78)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        value={inputsA.investment}
                        onChange={(e) => {
                          setScenarioAId('custom');
                          setScenarioAName('Scenario A: Custom Input');
                          setInputsA({ ...inputsA, investment: e.target.value });
                        }}
                        className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        TDS Deducted (BDT)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="5000"
                        value={inputsA.tds}
                        onChange={(e) => {
                          setScenarioAId('custom');
                          setScenarioAName('Scenario A: Custom Input');
                          setInputsA({ ...inputsA, tds: e.target.value });
                        }}
                        className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg tabular-nums"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Taxpayer Category
                      </label>
                      <select
                        value={inputsA.category}
                        onChange={(e) => {
                          setScenarioAId('custom');
                          setInputsA({ ...inputsA, category: e.target.value as TaxCategory });
                        }}
                        className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg"
                      >
                        {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Location Zone
                      </label>
                      <select
                        value={inputsA.location}
                        onChange={(e) => {
                          setScenarioAId('custom');
                          setInputsA({ ...inputsA, location: e.target.value as TaxLocation });
                        }}
                        className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg"
                      >
                        {Object.entries(LOCATION_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Scenario B Selector Card */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-xs bg-emerald-600 inline-block shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                    Scenario B (Comparison Target)
                  </span>
                </div>
                <span className="text-xs font-mono font-semibold text-emerald-800 bg-white px-2.5 py-0.5 rounded border border-emerald-200 tabular-nums">
                  Effective Rate: {summaryB.effectiveRate.toFixed(2)}%
                </span>
              </div>

              <label htmlFor="select-scenario-b" className="sr-only">
                Select Scenario B
              </label>
              <select
                id="select-scenario-b"
                value={scenarioBId}
                onChange={(e) => handleSelectScenarioB(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-emerald-300 bg-white text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {activeCalculatorInputs && Number(activeCalculatorInputs.income) > 0 && (
                  <optgroup label="Live Calculator Input">
                    {allOptions
                      .filter((o) => o.group === 'active')
                      .map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                  </optgroup>
                )}
                {savedScenarios.length > 0 && (
                  <optgroup label="Your Saved Scenarios">
                    {allOptions
                      .filter((o) => o.group === 'saved')
                      .map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                  </optgroup>
                )}
                <optgroup label="Finance Act 2026 Benchmark Scenarios">
                  {allOptions
                    .filter((o) => o.group === 'preset')
                    .map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                </optgroup>
                <option value="custom">Custom Scenario B Parameters</option>
              </select>

              {/* Quick Summary Chips */}
              <div className="grid grid-cols-3 gap-2.5 mt-4 pt-4 border-t border-emerald-200/70 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-emerald-200/70">
                  <span className="text-slate-500 block text-[11px]">Annual Income</span>
                  <strong className="text-slate-900 font-bold tabular-nums">
                    BDT {Number(inputsB.income || 0).toLocaleString()}
                  </strong>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-200/70">
                  <span className="text-slate-500 block text-[11px]">Eligible Investment</span>
                  <strong className="text-emerald-700 font-bold tabular-nums">
                    BDT {Number(inputsB.investment || 0).toLocaleString()}
                  </strong>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-200/70">
                  <span className="text-slate-500 block text-[11px]">Final Tax Liability</span>
                  <strong className="text-emerald-800 font-bold tabular-nums">
                    BDT {summaryB.results.finalLiability.toLocaleString()}
                  </strong>
                </div>
              </div>

              {/* Optional Inline Editor for Scenario B */}
              {showCustomEditors && (
                <div className="mt-4 pt-4 border-t border-emerald-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-900 uppercase mb-1">
                        Annual Income (BDT)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        value={inputsB.income}
                        onChange={(e) => {
                          setScenarioBId('custom');
                          setScenarioBName('Scenario B: Custom Input');
                          setInputsB({ ...inputsB, income: e.target.value });
                        }}
                        className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-emerald-300 rounded-lg tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-900 uppercase mb-1">
                        Investment (Sec 78)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        value={inputsB.investment}
                        onChange={(e) => {
                          setScenarioBId('custom');
                          setScenarioBName('Scenario B: Custom Input');
                          setInputsB({ ...inputsB, investment: e.target.value });
                        }}
                        className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-emerald-300 rounded-lg tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-900 uppercase mb-1">
                        TDS Deducted (BDT)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="5000"
                        value={inputsB.tds}
                        onChange={(e) => {
                          setScenarioBId('custom');
                          setScenarioBName('Scenario B: Custom Input');
                          setInputsB({ ...inputsB, tds: e.target.value });
                        }}
                        className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-emerald-300 rounded-lg tabular-nums"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-900 uppercase mb-1">
                        Taxpayer Category
                      </label>
                      <select
                        value={inputsB.category}
                        onChange={(e) => {
                          setScenarioBId('custom');
                          setInputsB({ ...inputsB, category: e.target.value as TaxCategory });
                        }}
                        className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-emerald-300 rounded-lg"
                      >
                        {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-900 uppercase mb-1">
                        Location Zone
                      </label>
                      <select
                        value={inputsB.location}
                        onChange={(e) => {
                          setScenarioBId('custom');
                          setInputsB({ ...inputsB, location: e.target.value as TaxLocation });
                        }}
                        className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-emerald-300 rounded-lg"
                      >
                        {Object.entries(LOCATION_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Differential Banner */}
        <div
          className={`rounded-xl p-4 sm:p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            liabilityDiff < 0
              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
              : liabilityDiff > 0
              ? 'bg-amber-50/90 border-amber-200 text-amber-950'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                liabilityDiff < 0
                  ? 'bg-emerald-600 text-white'
                  : liabilityDiff > 0
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-700 text-white'
              }`}
            >
              {liabilityDiff < 0 ? (
                <TrendingDown className="w-5 h-5" />
              ) : liabilityDiff > 0 ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <Scale className="w-5 h-5" />
              )}
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider block opacity-75">
                Net Tax Liability Differential (Scenario B vs Scenario A)
              </span>
              <h3 className="text-base sm:text-lg font-bold leading-snug">
                {liabilityDiff < 0 ? (
                  <>
                    Scenario B reduces final tax liability by{' '}
                    <span className="underline decoration-emerald-500 decoration-2 font-mono tabular-nums">
                      BDT {savingsAmount.toLocaleString()}
                    </span>{' '}
                    ({savingsPct}% tax savings)
                  </>
                ) : liabilityDiff > 0 ? (
                  <>
                    Scenario B increases final tax liability by{' '}
                    <span className="underline decoration-amber-500 decoration-2 font-mono tabular-nums">
                      BDT {savingsAmount.toLocaleString()}
                    </span>{' '}
                    (+{savingsPct}% higher tax)
                  </>
                ) : (
                  <>Both scenarios result in an identical final tax liability of BDT {summaryA.results.finalLiability.toLocaleString()}</>
                )}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right font-mono">
              <div className="text-[11px] uppercase font-sans font-semibold opacity-75">
                Rebate Difference
              </div>
              <div className="text-sm font-bold tabular-nums">
                {summaryB.results.rebate - summaryA.results.rebate >= 0 ? '+' : ''}
                BDT {(summaryB.results.rebate - summaryA.results.rebate).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Recharts BarChart Section */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span>
                  {chartView === 'liability'
                    ? 'Tax Liability, Section 78 Rebate & Net Payable Comparison'
                    : 'Progressive Tax Slab-by-Slab Liability Breakdown'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {chartView === 'liability'
                  ? 'Side-by-side comparison of Gross Tax, Eligible Investment Rebate, Final Tax Liability, and Net Tax Payable.'
                  : 'Side-by-side comparison of tax assessed within each statutory progressive slab tier (10% to 30%).'}
              </p>
            </div>

            {/* Chart Mode Toggle */}
            <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-100 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setChartView('liability')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                  chartView === 'liability'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Liability & Rebate
              </button>
              <button
                type="button"
                onClick={() => setChartView('slabs')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                  chartView === 'slabs'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Slab-by-Slab Tax
              </button>
            </div>
          </div>

          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={activeChartData}
                margin={{ top: 16, right: 24, left: 16, bottom: 12 }}
                barGap={8}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="metric"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#334155', fontWeight: 600 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(value: number) =>
                    value >= 100000
                      ? `৳${(value / 100000).toFixed(1)}L`
                      : value >= 1000
                      ? `৳${(value / 1000).toFixed(0)}k`
                      : `৳${value}`
                  }
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '12px'
                  }}
                  formatter={(value: any, name: any) => [
                    `BDT ${Number(value || 0).toLocaleString()}`,
                    name === 'scenarioA' ? scenarioAName : scenarioBName
                  ]}
                  labelFormatter={(label: any, payload: any) => {
                    if (payload && payload.length > 0 && payload[0].payload?.fullDescription) {
                      return `${label} — ${payload[0].payload.fullDescription}`;
                    }
                    return label;
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '12px', fontWeight: 600 }}
                  formatter={(value: string) =>
                    value === 'scenarioA' ? scenarioAName : scenarioBName
                  }
                />
                <Bar
                  dataKey="scenarioA"
                  name="scenarioA"
                  fill="#1e293b"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={52}
                />
                <Bar
                  dataKey="scenarioB"
                  name="scenarioB"
                  fill="#059669"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={52}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side-by-Side Structured Comparison Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider">
                <th className="py-3.5 px-4 font-bold">Assessment Metric</th>
                <th className="py-3.5 px-4 font-bold text-right">Scenario A (Baseline)</th>
                <th className="py-3.5 px-4 font-bold text-right text-emerald-300">
                  Scenario B (Comparison)
                </th>
                <th className="py-3.5 px-4 font-bold text-right">Variance (B − A)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
              <tr className="bg-slate-50/60">
                <td className="py-3 px-4 font-semibold text-slate-700">Taxpayer Category</td>
                <td className="py-3 px-4 text-right font-medium text-slate-800">
                  {CATEGORY_LABELS[inputsA.category]}
                </td>
                <td className="py-3 px-4 text-right font-medium text-emerald-900">
                  {CATEGORY_LABELS[inputsB.category]}
                </td>
                <td className="py-3 px-4 text-right text-slate-400">—</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-700">Total Annual Taxable Income</td>
                <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                  BDT {Number(inputsA.income || 0).toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                  BDT {Number(inputsB.income || 0).toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right font-mono text-slate-600 tabular-nums">
                  {Number(inputsB.income || 0) - Number(inputsA.income || 0) >= 0 ? '+' : ''}
                  {(Number(inputsB.income || 0) - Number(inputsA.income || 0)).toLocaleString()}
                </td>
              </tr>
              <tr className="bg-slate-50/60">
                <td className="py-3 px-4 font-semibold text-slate-700">0% Tax-Free Threshold</td>
                <td className="py-3 px-4 text-right font-mono text-slate-700 tabular-nums">
                  BDT {summaryA.results.totalLimit.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right font-mono text-slate-700 tabular-nums">
                  BDT {summaryB.results.totalLimit.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right font-mono text-slate-600 tabular-nums">
                  {summaryB.results.totalLimit - summaryA.results.totalLimit >= 0 ? '+' : ''}
                  {(summaryB.results.totalLimit - summaryA.results.totalLimit).toLocaleString()}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-700">Net Assessable Taxable Income</td>
                <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                  BDT {summaryA.results.taxableIncome.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                  BDT {summaryB.results.taxableIncome.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right font-mono text-slate-600 tabular-nums">
                  {summaryB.results.taxableIncome - summaryA.results.taxableIncome >= 0 ? '+' : ''}
                  {(summaryB.results.taxableIncome - summaryA.results.taxableIncome).toLocaleString()}
                </td>
              </tr>
              <tr className="bg-slate-50/60">
                <td className="py-3 px-4 font-semibold text-slate-700">Gross Slab Tax (Before Rebate)</td>
                <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                  BDT {summaryA.results.grossTax.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                  BDT {summaryB.results.grossTax.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right font-mono text-slate-600 tabular-nums">
                  {summaryB.results.grossTax - summaryA.results.grossTax >= 0 ? '+' : ''}
                  {(summaryB.results.grossTax - summaryA.results.grossTax).toLocaleString()}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-emerald-800">
                  Section 78 Investment Rebate
                </td>
                <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700 tabular-nums">
                  − BDT {summaryA.results.rebate.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700 tabular-nums">
                  − BDT {summaryB.results.rebate.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700 tabular-nums">
                  {summaryB.results.rebate - summaryA.results.rebate >= 0 ? '+' : ''}
                  {(summaryB.results.rebate - summaryA.results.rebate).toLocaleString()}
                </td>
              </tr>
              <tr className="bg-slate-900 text-white font-bold">
                <td className="py-3.5 px-4">Final Assessed Tax Liability</td>
                <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                  BDT {summaryA.results.finalLiability.toLocaleString()}
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-emerald-300 tabular-nums">
                  BDT {summaryB.results.finalLiability.toLocaleString()}
                </td>
                <td
                  className={`py-3.5 px-4 text-right font-mono tabular-nums ${
                    liabilityDiff < 0
                      ? 'text-emerald-400'
                      : liabilityDiff > 0
                      ? 'text-amber-300'
                      : 'text-slate-300'
                  }`}
                >
                  {liabilityDiff > 0 ? '+' : ''}
                  BDT {liabilityDiff.toLocaleString()}
                </td>
              </tr>
              <tr className="bg-emerald-50/70 font-bold">
                <td className="py-3 px-4 text-slate-900">Net Tax Payable (After TDS Credit)</td>
                <td className="py-3 px-4 text-right font-mono text-slate-900 tabular-nums">
                  BDT {summaryA.results.netPayable.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right font-mono text-emerald-800 tabular-nums">
                  BDT {summaryB.results.netPayable.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right font-mono text-slate-900 tabular-nums">
                  {summaryB.results.netPayable - summaryA.results.netPayable > 0 ? '+' : ''}
                  BDT {(summaryB.results.netPayable - summaryA.results.netPayable).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
