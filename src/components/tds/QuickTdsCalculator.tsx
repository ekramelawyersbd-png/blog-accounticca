import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calculator, 
  Coins, 
  Copy, 
  Check, 
  RotateCcw, 
  ArrowRight, 
  Scale, 
  Info, 
  Percent, 
  Receipt,
  FileCheck,
  TrendingDown,
  HelpCircle
} from 'lucide-react';

export interface TdsCategoryItem {
  id: string;
  category: string;
  subCategory: string;
  section: string;
  rate: string;
}

export interface QuickTdsCalculatorProps {
  id?: string;
  className?: string;
  initialAmount?: number;
  initialRate?: number;
  initialCategory?: string;
  initialSection?: string;
  tdsCategories?: TdsCategoryItem[];
  onSelectCategory?: (id: string) => void;
}

export interface CalculationHistoryItem {
  id: string;
  date: string;
  mode: 'standard' | 'grossUp';
  amount: number;
  rate: number;
  grossAmount: number;
  deductedAmount: number;
  netAmount: number;
  categoryName?: string;
  section?: string;
}

const COMMON_RATES = [1, 2, 3, 5, 6, 7.5, 10, 15, 20, 25];

const QUICK_AMOUNTS = [
  { label: '৳ 25K', value: 25000 },
  { label: '৳ 50K', value: 50000 },
  { label: '৳ 100K', value: 100000 },
  { label: '৳ 250K', value: 250000 },
  { label: '৳ 500K', value: 500000 },
  { label: '৳ 1M', value: 1000000 },
  { label: '৳ 5M', value: 5000000 },
];

export function QuickTdsCalculator({
  id = 'quick-tds-calculator',
  className = '',
  initialAmount = 100000,
  initialRate = 5,
  initialCategory = '',
  initialSection = '',
  tdsCategories = [],
  onSelectCategory,
}: QuickTdsCalculatorProps) {
  const [amountStr, setAmountStr] = useState<string>(initialAmount ? initialAmount.toString() : '100000');
  const [selectedRate, setSelectedRate] = useState<number>(initialRate ?? 5);
  const [customRateStr, setCustomRateStr] = useState<string>('');
  const [isCustomRate, setIsCustomRate] = useState<boolean>(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(initialCategory || '');
  const [calculationMode, setCalculationMode] = useState<'standard' | 'grossUp'>('standard');
  const [copied, setCopied] = useState<boolean>(false);

  const [history, setHistory] = useState<CalculationHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [justSaved, setJustSaved] = useState<boolean>(false);

  // Load history on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tdsCalculatorHistory');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Failed to load history', err);
    }
  }, []);

  // Sync when initial props change
  useEffect(() => {
    if (initialAmount) {
      setAmountStr(initialAmount.toString());
    }
  }, [initialAmount]);

  useEffect(() => {
    if (initialRate !== undefined && initialRate !== null) {
      setSelectedRate(initialRate);
      if (!COMMON_RATES.includes(initialRate)) {
        setIsCustomRate(true);
        setCustomRateStr(initialRate.toString());
      } else {
        setIsCustomRate(false);
      }
    }
  }, [initialRate]);

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategoryId(initialCategory);
    }
  }, [initialCategory]);

  // Parse numeric amount
  const numericAmount = useMemo(() => {
    const cleaned = amountStr.replace(/[^0-9.]/g, '');
    const val = parseFloat(cleaned);
    return isNaN(val) || val < 0 ? 0 : val;
  }, [amountStr]);

  // Current active effective rate
  const activeRate = useMemo(() => {
    if (isCustomRate) {
      const val = parseFloat(customRateStr);
      return isNaN(val) || val < 0 ? 0 : val;
    }
    return selectedRate;
  }, [isCustomRate, customRateStr, selectedRate]);

  // Find selected category object
  const activeCategoryObj = useMemo(() => {
    if (!selectedCategoryId || !tdsCategories.length) return null;
    return tdsCategories.find(c => c.id === selectedCategoryId) || null;
  }, [selectedCategoryId, tdsCategories]);

  // Calculation Results
  const { grossAmount, deductedAmount, netAmount, effectivePercent } = useMemo(() => {
    const ratePercent = activeRate / 100;

    if (calculationMode === 'standard') {
      // Standard: Input is Gross invoice
      const gross = numericAmount;
      const deducted = gross * ratePercent;
      const net = gross - deducted;
      return {
        grossAmount: gross,
        deductedAmount: deducted,
        netAmount: Math.max(0, net),
        effectivePercent: activeRate
      };
    } else {
      // Gross-Up: Input is Net amount required by vendor
      const net = numericAmount;
      if (ratePercent >= 1) {
        return {
          grossAmount: net,
          deductedAmount: 0,
          netAmount: net,
          effectivePercent: 0
        };
      }
      const gross = net / (1 - ratePercent);
      const deducted = gross - net;
      return {
        grossAmount: gross,
        deductedAmount: deducted,
        netAmount: net,
        effectivePercent: activeRate
      };
    }
  }, [numericAmount, activeRate, calculationMode]);

  // When a statutory category is chosen from dropdown
  const handleCategorySelect = (catId: string) => {
    setSelectedCategoryId(catId);
    if (!catId) return;

    const found = tdsCategories.find(c => c.id === catId);
    if (found) {
      // parse rate from string e.g. "7.5%", "10%", "20%"
      const numMatch = found.rate.match(/[\d.]+/);
      if (numMatch) {
        const parsed = parseFloat(numMatch[0]);
        if (!isNaN(parsed)) {
          setSelectedRate(parsed);
          setIsCustomRate(false);
          setCustomRateStr('');
        }
      }
      if (onSelectCategory) {
        onSelectCategory(catId);
      }
    }
  };

  // Preset rate click
  const handleRateClick = (rate: number) => {
    setSelectedRate(rate);
    setIsCustomRate(false);
    setCustomRateStr('');
  };

  // Custom rate change
  const handleCustomRateChange = (val: string) => {
    setCustomRateStr(val);
    setIsCustomRate(true);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed >= 0) {
      setSelectedRate(parsed);
    }
  };

  // Reset fields
  const handleReset = () => {
    setAmountStr('100000');
    setSelectedRate(5);
    setIsCustomRate(false);
    setCustomRateStr('');
    setSelectedCategoryId('');
    setCalculationMode('standard');
  };

  // Format currency in Bangladeshi Taka
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val).replace('BDT', '৳');
  };

  // Copy breakdown summary
  const handleCopySummary = () => {
    const modeLabel = calculationMode === 'standard' 
      ? 'Deduct from Gross Invoice' 
      : 'Gross-Up (Net of Tax Agreement)';
    
    const categoryInfo = activeCategoryObj 
      ? `\nCategory: ${activeCategoryObj.category} (${activeCategoryObj.section})`
      : '';

    const text = `=========================================
QUICK TDS CALCULATION SUMMARY
Income Tax Act 2023 - Bangladesh
=========================================
Calculation Mode: ${modeLabel}${categoryInfo}
Base / Input Amount: ${formatCurrency(numericAmount)}
Applicable TDS Rate: ${activeRate}%

-----------------------------------------
Gross Invoice Amount:    ${formatCurrency(grossAmount)}
TDS Deducted Amount:     ${formatCurrency(deductedAmount)}
Net Amount Payable:      ${formatCurrency(netAmount)}
-----------------------------------------
Formula: ${calculationMode === 'standard' 
  ? `${formatCurrency(grossAmount)} × ${activeRate}% = ${formatCurrency(deductedAmount)}` 
  : `${formatCurrency(netAmount)} ÷ (1 - ${activeRate}%) = ${formatCurrency(grossAmount)}`}
=========================================
Generated via LegalTax BD TDS Reference Guide`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveToHistory = () => {
    const newItem: CalculationHistoryItem = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      mode: calculationMode,
      amount: numericAmount,
      rate: activeRate,
      grossAmount,
      deductedAmount,
      netAmount,
      categoryName: activeCategoryObj?.category,
      section: activeCategoryObj?.section,
    };
    
    const newHistory = [newItem, ...history].slice(0, 10); // Keep last 10
    setHistory(newHistory);
    try {
      localStorage.setItem('tdsCalculatorHistory', JSON.stringify(newHistory));
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } catch (err) {
      console.error('Failed to save history', err);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('tdsCalculatorHistory');
    } catch (err) {
      console.error('Failed to clear history', err);
    }
  };

  const handleLoadHistoryItem = (item: CalculationHistoryItem) => {
    setAmountStr(item.amount.toString());
    setSelectedRate(item.rate);
    setCalculationMode(item.mode);
    setIsCustomRate(!COMMON_RATES.includes(item.rate));
    setCustomRateStr(!COMMON_RATES.includes(item.rate) ? item.rate.toString() : '');
    setSelectedCategoryId('');
    if (showHistory) setShowHistory(false);
  };

  // Net vs TDS ratio for the progress bar
  const netRatio = grossAmount > 0 ? (netAmount / grossAmount) * 100 : 95;
  const tdsRatio = grossAmount > 0 ? (deductedAmount / grossAmount) * 100 : 5;

  return (
    <div 
      id={id} 
      className={`bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden ${className}`}
    >
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-6 md:p-8 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Calculator className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Quick TDS Calculator
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                  Instant
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-0.5">
                Calculate withholding tax deduction, net payable, or gross-up amounts under Bangladesh Tax Law
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={handleReset}
              id="quick-tds-reset-btn"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-xs border border-white/20 transition-colors"
              title="Reset all fields"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Calculation Mode Toggle Switch */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">
            Calculation Rule:
          </span>
          <div className="inline-flex p-1 rounded-xl bg-black/20 border border-white/10 max-w-full">
            <button
              type="button"
              id="calc-mode-standard"
              onClick={() => setCalculationMode('standard')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                calculationMode === 'standard'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-emerald-100 hover:text-white'
              }`}
            >
              Standard (Deduct from Gross)
            </button>
            <button
              type="button"
              id="calc-mode-grossup"
              onClick={() => setCalculationMode('grossUp')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                calculationMode === 'grossUp'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-emerald-100 hover:text-white'
              }`}
            >
              Gross-Up (Net of Tax Contract)
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Inputs vs. Live Calculation Output */}
      <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Form (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Amount Input Block */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="quick-tds-amount-input" className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-emerald-600" />
                <span>
                  {calculationMode === 'standard' ? 'Invoice Gross Amount' : 'Target Net Payment Amount'}
                </span>
              </label>
              <span className="text-xs font-semibold text-slate-400">Currency: BDT (৳)</span>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-slate-400 font-bold text-lg">৳</span>
              </div>
              <input
                id="quick-tds-amount-input"
                type="text"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="Enter amount (e.g. 100,000)"
                className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xl sm:text-2xl font-black text-slate-900 transition-shadow"
              />
            </div>

            {/* Quick Amount Chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              <span className="text-[11px] font-bold text-slate-400 mr-1 uppercase">Presets:</span>
              {QUICK_AMOUNTS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setAmountStr(preset.value.toString())}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                    numericAmount === preset.value
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tax Rate Selection Section */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-emerald-600" />
                <span>Select Tax Deduction Rate</span>
              </label>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                Active: {activeRate}%
              </span>
            </div>

            {/* Common Statutory Rate Buttons */}
            <div className="grid grid-cols-5 sm:grid-cols-5 gap-2 mb-4">
              {COMMON_RATES.map((rate) => {
                const isSelected = !isCustomRate && selectedRate === rate;
                return (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => handleRateClick(rate)}
                    id={`rate-btn-${rate}`}
                    className={`py-2 px-2 text-center rounded-xl text-xs sm:text-sm font-black transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs scale-102 ring-2 ring-emerald-600/20'
                        : 'bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700'
                    }`}
                  >
                    {rate}%
                  </button>
                );
              })}
            </div>

            {/* Custom Rate Input & Category Selector in 2 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Category Dropdown (8 cols) */}
              <div className="sm:col-span-8">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  Or pick by Statutory Category
                </label>
                <div className="relative">
                  <select
                    id="quick-tds-category-dropdown"
                    value={selectedCategoryId}
                    onChange={(e) => handleCategorySelect(e.target.value)}
                    className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none truncate"
                  >
                    <option value="">-- Choose TDS Category (Sec 89 / 90 / 119) --</option>
                    {tdsCategories.map((item) => (
                      <option key={item.id} value={item.id}>
                        [{item.rate}] {item.category} ({item.section})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                    <Scale className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Custom Rate Input (4 cols) */}
              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  Custom Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={customRateStr}
                    onChange={(e) => handleCustomRateChange(e.target.value)}
                    placeholder="e.g. 7.5"
                    className={`w-full pl-3 pr-7 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      isCustomRate ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/30' : 'border-slate-200'
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate-400 text-xs font-bold">
                    %
                  </div>
                </div>
              </div>
            </div>

            {/* If Category is selected, show mini details badge */}
            {activeCategoryObj && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-2.5 text-xs text-emerald-900">
                <FileCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">{activeCategoryObj.category}</span>
                  <span className="text-emerald-700"> &bull; {activeCategoryObj.subCategory}</span>
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-white border border-emerald-200 font-bold text-[10px] text-emerald-800">
                    {activeCategoryObj.section}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Instant Results Display (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 sm:p-6 relative overflow-hidden flex-1 flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/40 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />

            <div>
              <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-200/80">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                  Calculation Results
                </span>
                <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                  {activeRate}% Deducted
                </span>
              </div>

              {/* Primary Metric: TDS Deducted Amount */}
              <div className="mb-5 bg-white p-4 rounded-xl border border-emerald-200 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600" />
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
                  <span>TDS Deducted Amount (কর কর্তন)</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                    To Treasury
                  </span>
                </div>
                <div 
                  id="quick-tds-deducted-output" 
                  className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono tracking-tight"
                >
                  {formatCurrency(deductedAmount)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <span>Calculated at</span>
                  <span className="font-bold text-slate-700">{activeRate}%</span>
                  <span>of {formatCurrency(grossAmount)}</span>
                </div>
              </div>

              {/* Secondary Metrics: Gross vs. Net */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase">
                    Net Payable to Vendor
                  </span>
                  <div className="text-base sm:text-lg font-black text-slate-900 font-mono mt-0.5">
                    {formatCurrency(netAmount)}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    ({netRatio.toFixed(1)}% of Gross)
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase">
                    Gross Invoice Amount
                  </span>
                  <div className="text-base sm:text-lg font-black text-slate-800 font-mono mt-0.5">
                    {formatCurrency(grossAmount)}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {calculationMode === 'standard' ? 'Direct Base' : 'Grossed Up'}
                  </span>
                </div>
              </div>

              {/* Proportion Bar */}
              <div className="space-y-1.5 mb-5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                  <span>Net Payable ({netRatio.toFixed(1)}%)</span>
                  <span className="text-emerald-700">TDS ({tdsRatio.toFixed(1)}%)</span>
                </div>
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-slate-800 transition-all duration-300" 
                    style={{ width: `${netRatio}%` }} 
                    title={`Net Payable: ${formatCurrency(netAmount)}`}
                  />
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-300" 
                    style={{ width: `${tdsRatio}%` }} 
                    title={`TDS Deducted: ${formatCurrency(deductedAmount)}`}
                  />
                </div>
              </div>

              {/* Formula & Rule Note */}
              <div className="text-xs text-slate-600 bg-white/80 p-3 rounded-xl border border-slate-200/80 leading-relaxed font-mono">
                <div className="font-bold text-slate-800 mb-1 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Statutory Formula:</span>
                </div>
                {calculationMode === 'standard' ? (
                  <div className="text-[11px]">
                    TDS = Gross ({formatCurrency(grossAmount)}) × {activeRate}% = <strong className="text-emerald-700">{formatCurrency(deductedAmount)}</strong>
                  </div>
                ) : (
                  <div className="text-[11px]">
                    Gross = Net ({formatCurrency(netAmount)}) ÷ (1 - {activeRate}%) = {formatCurrency(grossAmount)}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons: Copy Summary & Save History */}
            <div className="mt-5 pt-4 border-t border-slate-200 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="quick-tds-copy-btn"
                  onClick={handleCopySummary}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-xs truncate"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-white shrink-0" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-white shrink-0" />
                      <span>Copy Summary</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  id="quick-tds-save-btn"
                  onClick={handleSaveToHistory}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-xs truncate"
                >
                  {justSaved ? (
                    <>
                      <Check className="w-4 h-4 text-white shrink-0" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4 text-white shrink-0" />
                      <span>Save to History</span>
                    </>
                  )}
                </button>
              </div>

              {history.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors mt-1"
                >
                  {showHistory ? 'Hide Recent Calculations' : `View Recent Calculations (${history.length})`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* History Section */}
      {showHistory && history.length > 0 && (
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-emerald-600" />
              <span>Recent Calculations</span>
            </h4>
            <button
              onClick={handleClearHistory}
              className="text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors"
            >
              Clear History
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {history.map((item) => (
              <div 
                key={item.id} 
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-sm hover:border-emerald-300 transition-all cursor-pointer group"
                onClick={() => handleLoadHistoryItem(item)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                    {item.mode === 'standard' ? 'Standard' : 'Gross-Up'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-black text-slate-800 font-mono">
                      {formatCurrency(item.amount)}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      at {item.rate}% ({formatCurrency(item.deductedAmount)} TDS)
                    </div>
                  </div>
                  <button className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white text-slate-400 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Statutory Compliance Notice */}
      <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 text-xs text-slate-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Under Bangladesh Income Tax Act 2023, TDS must be deposited via government e-Challan / A-Challan within prescribed monthly deadlines.
          </span>
        </div>
        <span className="text-[11px] font-bold text-slate-400 shrink-0">
          Source: Sections 89, 90 &amp; 119
        </span>
      </div>
    </div>
  );
}
