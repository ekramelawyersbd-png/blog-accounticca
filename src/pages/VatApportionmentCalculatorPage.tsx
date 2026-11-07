import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calculator,
  RotateCcw,
  Check,
  Copy,
  AlertCircle,
  Scale,
  FileText,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { ToolPageLayout } from '../components/tools/ToolPageLayout';

interface PresetScenario {
  id: string;
  label: string;
  description: string;
  inputTaxI: number;
  qualifyingSuppliesT: number;
  totalSuppliesTMax: number;
  standard15Sales: number;
  zeroRated0Sales: number;
  exemptSales: number;
  reducedRateSales: number;
}

const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'mixed-agro-fmcg',
    label: 'Mixed Consumer & Exempt Producer (60% Eligible)',
    description:
      'Produces both 15% standard-rated packaged goods and First Schedule VAT-exempt agro items using shared factory utilities & packing.',
    inputTaxI: 450000,
    qualifyingSuppliesT: 6000000,
    totalSuppliesTMax: 10000000,
    standard15Sales: 5000000,
    zeroRated0Sales: 1000000,
    exemptSales: 3000000,
    reducedRateSales: 1000000
  },
  {
    id: 'export-truncated',
    label: 'Export + Local Reduced-Rate Supplier (75% Eligible)',
    description:
      'Supplies 0% zero-rated direct exports alongside 7.5% reduced-rate local supplies.',
    inputTaxI: 320000,
    qualifyingSuppliesT: 7500000,
    totalSuppliesTMax: 10000000,
    standard15Sales: 2500000,
    zeroRated0Sales: 5000000,
    exemptSales: 0,
    reducedRateSales: 2500000
  },
  {
    id: 'full-standard-export',
    label: '100% Standard & Zero-Rated Exporter (100% Eligible)',
    description:
      'All outward supplies are either 15% standard-rated local sales or 0% zero-rated exports.',
    inputTaxI: 500000,
    qualifyingSuppliesT: 12000000,
    totalSuppliesTMax: 12000000,
    standard15Sales: 8000000,
    zeroRated0Sales: 4000000,
    exemptSales: 0,
    reducedRateSales: 0
  }
];

function formatBDT(amount: number): string {
  if (!Number.isFinite(amount)) return 'BDT 0';
  return 'BDT ' + Math.round(amount).toLocaleString('en-IN');
}

function formatBDTExact(amount: number): string {
  if (!Number.isFinite(amount)) return 'BDT 0.00';
  return (
    'BDT ' +
    amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  );
}

export function VatApportionmentCalculatorPage() {
  // Primary Section 47 formula inputs: Total Input Tax (I), Standard/Zero-Rated Supply Value (T), Total Supplies (T_total)
  const [totalInputTax, setTotalInputTax] = useState<number>(450000);
  const [standardZeroRatedSupplyValue, setStandardZeroRatedSupplyValue] = useState<number>(6000000);
  const [totalSuppliesValue, setTotalSuppliesValue] = useState<number>(10000000);

  // Optional granular supply builder state (Mushak 9.1 Part-3 notes)
  const [showGranularBreakdown, setShowGranularBreakdown] = useState<boolean>(false);
  const [standard15Sales, setStandard15Sales] = useState<number>(5000000);
  const [zeroRated0Sales, setZeroRated0Sales] = useState<number>(1000000);
  const [exemptSales, setExemptSales] = useState<number>(3000000);
  const [reducedRateSales, setReducedRateSales] = useState<number>(1000000);

  const [activePresetId, setActivePresetId] = useState<string>('mixed-agro-fmcg');
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  const updateFromGranular = (
    nextStd15: number,
    nextZero0: number,
    nextExempt: number,
    nextReduced: number
  ) => {
    const cleanStd = Math.max(0, nextStd15 || 0);
    const cleanZero = Math.max(0, nextZero0 || 0);
    const cleanExempt = Math.max(0, nextExempt || 0);
    const cleanReduced = Math.max(0, nextReduced || 0);

    setStandard15Sales(cleanStd);
    setZeroRated0Sales(cleanZero);
    setExemptSales(cleanExempt);
    setReducedRateSales(cleanReduced);

    const newT = cleanStd + cleanZero;
    const newTTotal = newT + cleanExempt + cleanReduced;
    setStandardZeroRatedSupplyValue(newT);
    setTotalSuppliesValue(newTTotal);
    setActivePresetId('');
  };

  const applyPreset = (preset: PresetScenario) => {
    setTotalInputTax(preset.inputTaxI);
    setStandardZeroRatedSupplyValue(preset.qualifyingSuppliesT);
    setTotalSuppliesValue(preset.totalSuppliesTMax);
    setStandard15Sales(preset.standard15Sales);
    setZeroRated0Sales(preset.zeroRated0Sales);
    setExemptSales(preset.exemptSales);
    setReducedRateSales(preset.reducedRateSales);
    setActivePresetId(preset.id);
  };

  const handleReset = () => {
    applyPreset(PRESET_SCENARIOS[0]);
  };

  // Section 47 Formula: Eligible Partial Rebate = I * (T / T_total)
  const calculation = useMemo(() => {
    const I = Math.max(0, Number.isFinite(totalInputTax) ? totalInputTax : 0);
    const T = Math.max(
      0,
      Number.isFinite(standardZeroRatedSupplyValue) ? standardZeroRatedSupplyValue : 0
    );
    const T_total = Math.max(0, Number.isFinite(totalSuppliesValue) ? totalSuppliesValue : 0);

    const isTExceedingTotal = T > T_total && T_total > 0;
    const effectiveT = isTExceedingTotal ? T_total : T;

    const apportionmentRatio = T_total > 0 ? effectiveT / T_total : 0;
    const ratioPercent = apportionmentRatio * 100;
    const disallowedPercent = T_total > 0 ? Math.max(0, 100 - ratioPercent) : 0;

    // Eligible Partial Rebate = I * (T / T_total)
    const eligiblePartialRebate = I * apportionmentRatio;
    const disallowedInputTax = Math.max(0, I - eligiblePartialRebate);
    const nonQualifyingSupplies = Math.max(0, T_total - effectiveT);

    return {
      I,
      T,
      T_total,
      effectiveT,
      isTExceedingTotal,
      apportionmentRatio,
      ratioPercent,
      disallowedPercent,
      eligiblePartialRebate,
      disallowedInputTax,
      nonQualifyingSupplies
    };
  }, [totalInputTax, standardZeroRatedSupplyValue, totalSuppliesValue]);

  const handleCopySummary = () => {
    const text = [
      'VAT Apportionment Calculation (Section 47, VAT & SD Act 2012)',
      'Formula: Eligible Partial Rebate = I × (T ÷ T_total)',
      `Total Input Tax on Common Inputs (I): ${formatBDTExact(calculation.I)}`,
      `Standard (15%) & Zero-Rated (0%) Supply Value (T): ${formatBDTExact(calculation.effectiveT)}`,
      `Total Supplies Across All Categories (T_total): ${formatBDTExact(calculation.T_total)}`,
      `Apportionment Ratio (T ÷ T_total): ${calculation.ratioPercent.toFixed(2)}%`,
      `Eligible Partial Rebate (Mushak 9.1 Part-4): ${formatBDTExact(calculation.eligiblePartialRebate)}`,
      `Disallowed / Non-Rebatable Input Tax (Part-5 Note 25): ${formatBDTExact(calculation.disallowedInputTax)}`
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    });
  };

  return (
    <ToolPageLayout
      toolId="vat-apportionment-calculator"
      title="VAT Apportionment Calculator (Section 47)"
      category="Tax & VAT Toolkits"
      description="Compute your Eligible Partial Input Tax Rebate under Section 47 of the Bangladesh VAT and Supplementary Duty Act, 2012 using the statutory formula: Eligible Partial Rebate = I × (T ÷ T_total)."
    >
      <div className="space-y-8">
        {/* Main Calculator Card */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-50/80 via-white to-slate-50 text-slate-900 p-6 md:p-8 border-b border-slate-200">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold mb-2">
                  <span>Section 47 · VAT & SD Act, 2012</span>
                  <span aria-hidden="true">·</span>
                  <span>Rule 28 · Mushak 9.1 Part-4 & Part-5</span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                  <Calculator className="w-6 h-6 text-emerald-600 shrink-0" />
                  <span>Section 47 VAT Apportionment Calculator (উপকরণ করের আংশিক রেয়াত)</span>
                </h2>
                <p className="text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
                  Enter your <strong>Total Input Tax (I)</strong>, <strong>Standard/Zero-Rated Supply Value (T)</strong>, and <strong>Total Supplies (T_total)</strong> to calculate your monthly Eligible Partial Rebate and Part-5 Increasing Adjustment.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs text-xs font-semibold transition-colors cursor-pointer"
                >
                  {copiedSummary ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Working</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Formula Display */}
            <div className="mt-6 p-4 rounded-xl bg-white border border-emerald-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-600">
                <span className="font-semibold text-slate-900">Section 47 Statutory Apportionment Formula:</span>
              </div>
              <div className="font-mono text-xs md:text-sm text-emerald-700 font-semibold">
                Eligible Partial Rebate = I × (T ÷ T_total)
              </div>
            </div>
          </div>

          {/* Preset Scenario Selector */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <div className="text-xs font-semibold text-slate-600 mb-2.5">
              Load Preset Monthly Return Scenario:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {PRESET_SCENARIOS.map((preset) => {
                const isSelected = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/90 border-emerald-600 text-slate-900 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900 mb-1 flex items-center justify-between gap-2">
                      <span>{preset.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-snug">
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calculator Inputs & Results Grid */}
          <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Input Fields for I, T, and T_total */}
            <div className="lg:col-span-7 space-y-6">
              {/* Field 1: Total Input Tax (I) */}
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                <label
                  htmlFor="input-total-input-tax-i"
                  className="block text-sm font-bold text-slate-900 mb-1"
                >
                  1. Total Input Tax (<span className="font-mono text-emerald-700">I</span>)
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  Total 15% VAT paid on unallocated/common inputs (raw materials, packing, shared utilities, overhead services) during the tax period.
                </p>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    BDT
                  </span>
                  <input
                    id="input-total-input-tax-i"
                    type="number"
                    min={0}
                    step={1000}
                    value={totalInputTax || ''}
                    onChange={(e) => {
                      setTotalInputTax(Math.max(0, parseFloat(e.target.value) || 0));
                      setActivePresetId('');
                    }}
                    placeholder="Enter Total Input Tax (I)"
                    className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl font-mono text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Field 2: Standard / Zero-Rated Supply Value (T) */}
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                <label
                  htmlFor="input-standard-zero-rated-supply-t"
                  className="block text-sm font-bold text-slate-900 mb-1"
                >
                  2. Standard / Zero-Rated Supply Value (<span className="font-mono text-emerald-700">T</span>)
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  Total value of standard-rated (15%) supplies and zero-rated (0%) direct/deemed export supplies in the tax period (Mushak 9.1 Part-3, Notes 1, 2 & 4).
                </p>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    BDT
                  </span>
                  <input
                    id="input-standard-zero-rated-supply-t"
                    type="number"
                    min={0}
                    step={10000}
                    value={standardZeroRatedSupplyValue || ''}
                    onChange={(e) => {
                      setStandardZeroRatedSupplyValue(Math.max(0, parseFloat(e.target.value) || 0));
                      setActivePresetId('');
                    }}
                    placeholder="Enter Standard/Zero-Rated Supply Value (T)"
                    className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl font-mono text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Field 3: Total Supplies (T_total) */}
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                <label
                  htmlFor="input-total-supplies-ttotal"
                  className="block text-sm font-bold text-slate-900 mb-1"
                >
                  3. Total Supplies (<span className="font-mono text-emerald-700">T_total</span>)
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  Total value of all supplies made during the tax period: Standard (15%) + Zero-Rated (0%) + VAT-Exempt + Reduced/Truncated-Rate (5%, 7.5%, 10%).
                </p>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    BDT
                  </span>
                  <input
                    id="input-total-supplies-ttotal"
                    type="number"
                    min={0}
                    step={10000}
                    value={totalSuppliesValue || ''}
                    onChange={(e) => {
                      setTotalSuppliesValue(Math.max(0, parseFloat(e.target.value) || 0));
                      setActivePresetId('');
                    }}
                    placeholder="Enter Total Supplies (T_total)"
                    className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl font-mono text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {calculation.isTExceedingTotal && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start justify-between gap-3 text-xs text-amber-900">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        Standard/Zero-Rated supply value (<strong>T</strong>) cannot exceed Total Supplies (<strong>T_total</strong>). Ratio is capped at 100%.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTotalSuppliesValue(standardZeroRatedSupplyValue)}
                      className="font-bold text-amber-900 underline shrink-0 cursor-pointer"
                    >
                      Sync T_total = T
                    </button>
                  </div>
                )}
              </div>

              {/* Optional Itemized Mushak 9.1 Part-3 Sales Breakdown */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowGranularBreakdown((prev) => !prev)}
                  className="w-full px-5 py-3.5 bg-white hover:bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  <span>Compute T and T_total from Itemized Mushak 9.1 Part-3 Sales Notes</span>
                  {showGranularBreakdown ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                {showGranularBreakdown && (
                  <div className="p-5 bg-slate-50 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Standard-Rated 15% Sales (Note 4)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={standard15Sales || ''}
                        onChange={(e) =>
                          updateFromGranular(
                            parseFloat(e.target.value) || 0,
                            zeroRated0Sales,
                            exemptSales,
                            reducedRateSales
                          )
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Zero-Rated 0% Export Sales (Notes 1 & 2)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={zeroRated0Sales || ''}
                        onChange={(e) =>
                          updateFromGranular(
                            standard15Sales,
                            parseFloat(e.target.value) || 0,
                            exemptSales,
                            reducedRateSales
                          )
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        VAT-Exempt Supplies (Note 3)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={exemptSales || ''}
                        onChange={(e) =>
                          updateFromGranular(
                            standard15Sales,
                            zeroRated0Sales,
                            parseFloat(e.target.value) || 0,
                            reducedRateSales
                          )
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Reduced / Truncated Rate Sales (Notes 5–7)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={reducedRateSales || ''}
                        onChange={(e) =>
                          updateFromGranular(
                            standard15Sales,
                            zeroRated0Sales,
                            exemptSales,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs text-slate-900"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Clear Display of Section 47 Result */}
            <div className="lg:col-span-5 space-y-5">
              {/* Primary Result Display */}
              <div className="p-6 rounded-2xl bg-emerald-950 text-white border border-emerald-800">
                <div className="text-xs font-semibold text-emerald-300 mb-1">
                  Eligible Partial Rebate (Section 47 Result)
                </div>
                <div
                  data-testid="eligible-partial-rebate-result"
                  className="text-3xl md:text-4xl font-bold font-mono text-white tracking-tight my-2"
                >
                  {formatBDTExact(calculation.eligiblePartialRebate)}
                </div>
                <div className="text-xs text-emerald-200/90 flex items-center gap-2">
                  <span>
                    Apportionment Ratio (T ÷ T_total):{' '}
                    <strong>{calculation.ratioPercent.toFixed(2)}%</strong>
                  </span>
                </div>

                {/* Ratio Bar */}
                <div className="mt-5">
                  <div className="flex justify-between text-[11px] font-medium text-emerald-200 mb-1.5">
                    <span>Eligible Rebate ({calculation.ratioPercent.toFixed(1)}%)</span>
                    <span>Disallowed ({calculation.disallowedPercent.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-emerald-900 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${Math.min(100, Math.max(0, calculation.ratioPercent))}%` }}
                      className="bg-emerald-400 h-full transition-all duration-300"
                    />
                    <div
                      style={{
                        width: `${Math.min(100, Math.max(0, calculation.disallowedPercent))}%`
                      }}
                      className="bg-rose-500/80 h-full transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Disallowed & Non-Qualifying Summary */}
                <div className="mt-6 pt-5 border-t border-emerald-800/80 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-emerald-300/80 mb-0.5">Disallowed Input Tax</div>
                    <div className="font-mono font-bold text-rose-300 text-sm">
                      {formatBDTExact(calculation.disallowedInputTax)}
                    </div>
                    <div className="text-[11px] text-emerald-200/70 mt-0.5">
                      Reverse in Part-5 (Note 25)
                    </div>
                  </div>
                  <div>
                    <div className="text-emerald-300/80 mb-0.5">Non-Qualifying Supplies</div>
                    <div className="font-mono font-bold text-white text-sm">
                      {formatBDT(calculation.nonQualifyingSupplies)}
                    </div>
                    <div className="text-[11px] text-emerald-200/70 mt-0.5">
                      Exempt + Reduced-Rate
                    </div>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Section 47 Formula Substitution */}
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-emerald-600" />
                  <span>Step-by-Step Section 47 Formula Breakdown</span>
                </div>
                <div className="space-y-2 font-mono text-[11px] text-slate-700 bg-white p-3.5 rounded-lg border border-slate-200">
                  <div>Eligible Partial Rebate = I × (T ÷ T_total)</div>
                  <div>
                    = {calculation.I.toLocaleString('en-IN')} × (
                    {calculation.effectiveT.toLocaleString('en-IN')} ÷{' '}
                    {calculation.T_total.toLocaleString('en-IN')})
                  </div>
                  <div>
                    = {calculation.I.toLocaleString('en-IN')} ×{' '}
                    {calculation.apportionmentRatio.toFixed(6)}
                  </div>
                  <div className="font-bold text-emerald-700 pt-1 border-t border-slate-100">
                    = {formatBDTExact(calculation.eligiblePartialRebate)}
                  </div>
                </div>
              </div>

              {/* Mushak 9.1 Reporting Protocol */}
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2 leading-relaxed">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>How to Report in Form Mushak 9.1</span>
                </div>
                <p>
                  <strong>1. Part-4 (Input Tax — Notes 14 & 15):</strong> Record your eligible standard-rated purchases via Sub-Form Ka (Total Common Input Tax:{' '}
                  <strong>{formatBDT(calculation.I)}</strong>).
                </p>
                <p>
                  <strong>2. Part-5 (Increasing Adjustment — Note 25):</strong> Enter the disallowed input VAT portion (
                  <strong>{formatBDTExact(calculation.disallowedInputTax)}</strong>) in{' '}
                  <strong>Part-5, Note 25</strong> so your net claimed rebate equals{' '}
                  <strong>{formatBDTExact(calculation.eligiblePartialRebate)}</strong>.
                </p>
                <p>
                  <strong>3. Rule 28 Annual Reconciliation:</strong> Provisional monthly partial rebates must be reconciled against full fiscal-year turnover in the June VAT return.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Companion Statutory Guides */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
          <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <span>Companion Bangladesh VAT & Input Tax Rebate Guides</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/article/input-tax-rebate-bangladesh-vat-guide"
              className="p-4 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 transition-all flex items-center justify-between gap-3 group"
            >
              <div>
                <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-800">
                  Comprehensive Guide to Input Tax Rebate (উপকরণ কর রেয়াত)
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Section 46 admissibility rules, negative list, Mushak 6.3 & 6.8 adjustments, and audit defense.
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 shrink-0" />
            </Link>

            <Link
              to="/article/corporate-vat-compliance-monthly-return-protocol-bangladesh"
              className="p-4 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 transition-all flex items-center justify-between gap-3 group"
            >
              <div>
                <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-800">
                  Corporate VAT Compliance & Monthly Return Protocol
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete Mushak 9.1 architecture, VDS rules, e-Chalan remittance, and Section 85 penalty defense.
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 shrink-0" />
            </Link>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}

export default VatApportionmentCalculatorPage;
