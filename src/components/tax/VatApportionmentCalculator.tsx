import React, { useState, useMemo } from 'react';
import { Calculator, RotateCcw, Check, Copy, AlertCircle, Scale, FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface VatApportionmentCalculatorProps {
  className?: string;
  initialInputTax?: number;
  initialStandardZeroSupplies?: number;
  initialTotalSupplies?: number;
}

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
    description: 'Produces both 15% standard-rated packaged goods and First Schedule VAT-exempt agro items using shared factory utilities & packing.',
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
    description: 'Supplies 0% zero-rated direct exports alongside 7.5% reduced-rate local supplies.',
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
    description: 'All outward supplies are either 15% standard-rated local sales or 0% zero-rated exports.',
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

export function VatApportionmentCalculator({
  className = '',
  initialInputTax = 450000,
  initialStandardZeroSupplies = 6000000,
  initialTotalSupplies = 10000000
}: VatApportionmentCalculatorProps) {
  // Primary Section 47 formula inputs: I, T, T_total
  const [inputTaxI, setInputTaxI] = useState<number>(initialInputTax);
  const [qualifyingSuppliesT, setQualifyingSuppliesT] = useState<number>(initialStandardZeroSupplies);
  const [totalSuppliesTMax, setTotalSuppliesTMax] = useState<number>(initialTotalSupplies);

  // Optional granular supply builder state
  const [showGranularBreakdown, setShowGranularBreakdown] = useState<boolean>(false);
  const [standard15Sales, setStandard15Sales] = useState<number>(5000000);
  const [zeroRated0Sales, setZeroRated0Sales] = useState<number>(1000000);
  const [exemptSales, setExemptSales] = useState<number>(3000000);
  const [reducedRateSales, setReducedRateSales] = useState<number>(1000000);

  const [activePresetId, setActivePresetId] = useState<string>('mixed-agro-fmcg');
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  // Handle granular breakdown updates syncing to T and T_total
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
    setQualifyingSuppliesT(newT);
    setTotalSuppliesTMax(newTTotal);
    setActivePresetId('');
  };

  const applyPreset = (preset: PresetScenario) => {
    setInputTaxI(preset.inputTaxI);
    setQualifyingSuppliesT(preset.qualifyingSuppliesT);
    setTotalSuppliesTMax(preset.totalSuppliesTMax);
    setStandard15Sales(preset.standard15Sales);
    setZeroRated0Sales(preset.zeroRated0Sales);
    setExemptSales(preset.exemptSales);
    setReducedRateSales(preset.reducedRateSales);
    setActivePresetId(preset.id);
  };

  const handleReset = () => {
    applyPreset(PRESET_SCENARIOS[0]);
  };

  // Core Section 47 Calculation
  const calculation = useMemo(() => {
    const safeI = Math.max(0, Number.isFinite(inputTaxI) ? inputTaxI : 0);
    const safeT = Math.max(0, Number.isFinite(qualifyingSuppliesT) ? qualifyingSuppliesT : 0);
    const safeTTotal = Math.max(0, Number.isFinite(totalSuppliesTMax) ? totalSuppliesTMax : 0);

    const isTExceedingTotal = safeT > safeTTotal && safeTTotal > 0;
    const effectiveT = isTExceedingTotal ? safeTTotal : safeT;

    const ratio = safeTTotal > 0 ? effectiveT / safeTTotal : 0;
    const ratioPercent = ratio * 100;
    const disallowedPercent = safeTTotal > 0 ? Math.max(0, 100 - ratioPercent) : 0;

    const eligiblePartialRebate = safeI * ratio;
    const disallowedInputTax = Math.max(0, safeI - eligiblePartialRebate);
    const nonQualifyingSupplies = Math.max(0, safeTTotal - effectiveT);

    return {
      safeI,
      safeT,
      safeTTotal,
      effectiveT,
      isTExceedingTotal,
      ratio,
      ratioPercent,
      disallowedPercent,
      eligiblePartialRebate,
      disallowedInputTax,
      nonQualifyingSupplies
    };
  }, [inputTaxI, qualifyingSuppliesT, totalSuppliesTMax]);

  const handleCopySummary = () => {
    const text = [
      'VAT Apportionment Calculation (Section 47, VAT & SD Act 2012)',
      'Formula: Eligible Partial Rebate = I × (T ÷ T_total)',
      `Total Input Tax on Common Inputs (I): ${formatBDTExact(calculation.safeI)}`,
      `Standard (15%) & Zero-Rated (0%) Supplies (T): ${formatBDTExact(calculation.effectiveT)}`,
      `Total Supplies Across All Categories (T_total): ${formatBDTExact(calculation.safeTTotal)}`,
      `Apportionment Ratio (T ÷ T_total): ${calculation.ratioPercent.toFixed(2)}%`,
      `Eligible Partial Rebate (Claimable in Mushak 9.1 Part-4): ${formatBDTExact(calculation.eligiblePartialRebate)}`,
      `Disallowed / Non-Rebatable Input Tax: ${formatBDTExact(calculation.disallowedInputTax)}`
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    });
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 md:p-8 border-b border-slate-800">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium mb-2">
              <span>Section 47 · VAT & SD Act, 2012</span>
              <span aria-hidden="true">·</span>
              <span>Mushak 9.1 Part-4 & Part-5 Apportionment</span>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
              <Calculator className="w-6 h-6 text-emerald-400 shrink-0" />
              <span>VAT Apportionment Calculator (উপকরণ করের আংশিক রেয়াত)</span>
            </h3>
            <p className="text-sm text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
              Compute your monthly <strong>Eligible Partial Input Tax Rebate</strong> when common business inputs are used to supply both Standard/Zero-Rated goods (15% / 0%) and Exempt or Reduced-Rate supplies.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              {copiedSummary ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Copied</span>
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Formula Banner */}
        <div className="mt-6 p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-300">
            <span className="font-semibold text-white">Statutory Formula (Section 47):</span>
          </div>
          <div className="font-mono text-xs md:text-sm text-emerald-300 font-semibold">
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
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-snug">{preset.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Calculator Grid */}
      <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Inputs (I, T, T_total) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Input 1: Total Input Tax (I) */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
            <label htmlFor="vat-apportionment-input-i" className="block text-sm font-bold text-slate-900 mb-1">
              1. Total Input Tax on Common Inputs (<span className="font-mono text-emerald-700">I</span>)
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Total 15% VAT paid during the tax period on shared raw materials, packing, utilities, or common services (supported by valid Mushak 6.3 / BOE).
            </p>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                BDT
              </span>
              <input
                id="vat-apportionment-input-i"
                type="number"
                min={0}
                step={1000}
                value={inputTaxI || ''}
                onChange={(e) => {
                  setInputTaxI(Math.max(0, parseFloat(e.target.value) || 0));
                  setActivePresetId('');
                }}
                placeholder="e.g. 450000"
                className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl font-mono text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Input 2: Standard / Zero-Rated Supply Value (T) */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
            <label htmlFor="vat-apportionment-input-t" className="block text-sm font-bold text-slate-900 mb-1">
              2. Standard-Rated (15%) & Zero-Rated (0%) Supply Value (<span className="font-mono text-emerald-700">T</span>)
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Value of outward supplies taxed at the standard 15% rate plus 0% zero-rated direct/deemed exports in the tax period (Mushak 9.1 Part-3, Notes 1, 2 & 4).
            </p>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                BDT
              </span>
              <input
                id="vat-apportionment-input-t"
                type="number"
                min={0}
                step={10000}
                value={qualifyingSuppliesT || ''}
                onChange={(e) => {
                  setQualifyingSuppliesT(Math.max(0, parseFloat(e.target.value) || 0));
                  setActivePresetId('');
                }}
                placeholder="e.g. 6000000"
                className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl font-mono text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Input 3: Total Supplies (T_total) */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
            <label htmlFor="vat-apportionment-input-ttotal" className="block text-sm font-bold text-slate-900 mb-1">
              3. Total Supplies Value Across All Categories (<span className="font-mono text-emerald-700">T_total</span>)
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Total value of all supplies during the month: Standard (15%) + Zero-Rated (0%) + VAT-Exempt (First Schedule) + Reduced/Truncated-Rate (5%, 7.5%, 10%).
            </p>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                BDT
              </span>
              <input
                id="vat-apportionment-input-ttotal"
                type="number"
                min={0}
                step={10000}
                value={totalSuppliesTMax || ''}
                onChange={(e) => {
                  setTotalSuppliesTMax(Math.max(0, parseFloat(e.target.value) || 0));
                  setActivePresetId('');
                }}
                placeholder="e.g. 10000000"
                className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl font-mono text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Validation Warning if T > T_total */}
            {calculation.isTExceedingTotal && (
              <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start justify-between gap-3 text-xs text-amber-900">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Standard/Zero-Rated supplies (<strong>T</strong>) cannot exceed Total Supplies (<strong>T_total</strong>). Ratio is capped at 100%.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setTotalSuppliesTMax(qualifyingSuppliesT)}
                  className="font-bold text-amber-900 underline shrink-0 cursor-pointer"
                >
                  Sync T_total = T
                </button>
              </div>
            )}
          </div>

          {/* Optional Granular Supply Builder Accordion */}
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

        {/* Right Column: Live Section 47 Output & Mushak 9.1 Breakdown */}
        <div className="lg:col-span-5 space-y-5">
          {/* Primary Result Card */}
          <div className="p-6 rounded-2xl bg-emerald-950 text-white border border-emerald-800">
            <div className="text-xs font-semibold text-emerald-300 mb-1">
              Eligible Partial Input Tax Rebate (Section 47)
            </div>
            <div className="text-3xl md:text-4xl font-bold font-mono text-white tracking-tight my-2">
              {formatBDTExact(calculation.eligiblePartialRebate)}
            </div>
            <div className="text-xs text-emerald-200/90 flex items-center gap-2">
              <span>Eligible Ratio: <strong>{calculation.ratioPercent.toFixed(2)}%</strong> of Common Input Tax</span>
            </div>

            {/* Visual Ratio Bar */}
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
                  style={{ width: `${Math.min(100, Math.max(0, calculation.disallowedPercent))}%` }}
                  className="bg-rose-500/80 h-full transition-all duration-300"
                />
              </div>
            </div>

            {/* Secondary Metrics */}
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

          {/* Step-by-Step Formula Substitution */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-600" />
              <span>Step-by-Step Section 47 Working</span>
            </div>
            <div className="space-y-2 font-mono text-[11px] text-slate-700 bg-white p-3.5 rounded-lg border border-slate-200">
              <div>
                Rebate = I × (T ÷ T_total)
              </div>
              <div>
                Rebate = {calculation.safeI.toLocaleString('en-IN')} × ({calculation.effectiveT.toLocaleString('en-IN')} ÷ {calculation.safeTTotal.toLocaleString('en-IN')})
              </div>
              <div>
                Rebate = {calculation.safeI.toLocaleString('en-IN')} × {calculation.ratio.toFixed(6)}
              </div>
              <div className="font-bold text-emerald-700 pt-1 border-t border-slate-100">
                Eligible Partial Rebate = {formatBDTExact(calculation.eligiblePartialRebate)}
              </div>
            </div>
          </div>

          {/* Mushak 9.1 Filing Guidance */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2 leading-relaxed">
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>How to Report in Form Mushak 9.1</span>
            </div>
            <p>
              <strong>1. Part-4 (Sub-Form Ka):</strong> Record your eligible standard-rated purchases in Notes 14 & 15 (Total Common Input Tax <strong>{formatBDT(calculation.safeI)}</strong>).
            </p>
            <p>
              <strong>2. Part-5 (Increasing Adjustment — Note 25):</strong> If the full common input VAT (<strong>{formatBDT(calculation.safeI)}</strong>) is populated in Part-4 via Sub-Form Ka, enter the disallowed portion (<strong>{formatBDTExact(calculation.disallowedInputTax)}</strong>) as an Increasing Adjustment in <strong>Part-5, Note 25</strong> so your net rebate equals <strong>{formatBDTExact(calculation.eligiblePartialRebate)}</strong>.
            </p>
            <p>
              <strong>3. Annual June Reconciliation:</strong> Under Rule 28 of the VAT & SD Rules 2016, provisional monthly apportionment ratios must be reconciled against full fiscal-year turnover in the June tax return.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
