import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  Copy, 
  Check, 
  TrendingDown, 
  DollarSign, 
  Building2, 
  ShieldCheck, 
  HelpCircle,
  ArrowRight,
  Sparkles,
  Info,
  Scale,
  Save,
  Clock,
  Trash2,
  FileDown,
  Share2,
  Lightbulb
} from 'lucide-react';
import { TurnoverBurdenChart } from './TurnoverBurdenChart';
import { generateTurnoverPDF } from '../../utils/taxPdfExport';

export interface SavedTurnoverCalc {
  id: string;
  timestamp: number;
  dateFormatted: string;
  turnover: number;
  slabLabel: string;
  rate: number;
  rateLabel: string;
  currentTax: number;
  previousTax: number;
  savings: number;
  isLossMaking: boolean;
}

export interface TurnoverTaxCalculatorProps {
  className?: string;
  initialShowComparison?: boolean;
  onComparisonToggle?: (enabled: boolean) => void;
}

export function TurnoverTaxCalculator({
  className = '',
  initialShowComparison = true,
  onComparisonToggle
}: TurnoverTaxCalculatorProps) {
  // Input: Annual Turnover in BDT (Default: 3 Crore = 30,000,000)
  const [turnoverInput, setTurnoverInput] = useState<number>(30000000);
  const [isLossMaking, setIsLossMaking] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isComparisonActive, setIsComparisonActive] = useState<boolean>(initialShowComparison);

  const handleToggleComparison = () => {
    const nextVal = !isComparisonActive;
    setIsComparisonActive(nextVal);
    onComparisonToggle?.(nextVal);
  };
  
  // Local storage history
  const [history, setHistory] = useState<SavedTurnoverCalc[]>(() => {
    try {
      const saved = localStorage.getItem('turnover_tax_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.slice(0, 5);
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Slab thresholds in Taka:
  // Up to Tk. 2 Crore (20,000,000): 0%
  // Tk. 2 Crore to Tk. 4 Crore (20,000,001 to 40,000,000): 0.5%
  // Above Tk. 4 Crore (40,000,001+): 1.0%
  const calculation = useMemo(() => {
    const turnover = Math.max(0, Number(turnoverInput) || 0);

    let slabId = 1;
    let slabLabel = 'Slab 1 (Up to Tk. 2 Crore)';
    let rate = 0;
    let rateLabel = '0% (Tax-Free)';
    let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    let slabDesc = 'Small business exemption threshold under revised NBR structure.';

    if (turnover <= 20000000) {
      slabId = 1;
      slabLabel = 'Slab 1 (Up to Tk. 2 Crore)';
      rate = 0;
      rateLabel = '0% (Tax-Free)';
      badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
      slabDesc = 'Annual sales do not exceed Tk. 2 Crore. Minimum turnover tax is completely NIL.';
    } else if (turnover <= 40000000) {
      slabId = 2;
      slabLabel = 'Slab 2 (Tk. 2 Crore to Tk. 4 Crore)';
      rate = 0.005;
      rateLabel = '0.5%';
      badgeColor = 'bg-blue-100 text-blue-800 border-blue-300';
      slabDesc = 'Medium enterprise bracket with reduced turnover rate of 0.5%.';
    } else {
      slabId = 3;
      slabLabel = 'Slab 3 (Above Tk. 4 Crore)';
      rate = 0.01;
      rateLabel = '1.0%';
      badgeColor = 'bg-purple-100 text-purple-800 border-purple-300';
      slabDesc = 'Large business bracket applying the standard 1% minimum turnover tax.';
    }

    // Revised Minimum Turnover Tax
    const currentTax = turnover * rate;

    // Previous Proposal: Flat 1% across all sales
    const previousTax = turnover * 0.01;

    // Net savings under revised structure
    const savings = Math.max(0, previousTax - currentTax);
    const savingsPercent = previousTax > 0 ? ((savings / previousTax) * 100).toFixed(0) : '0';

    return {
      turnover,
      slabId,
      slabLabel,
      rate,
      rateLabel,
      badgeColor,
      slabDesc,
      currentTax,
      previousTax,
      savings,
      savingsPercent
    };
  }, [turnoverInput]);

  const handleReset = () => {
    setTurnoverInput(30000000);
    setIsLossMaking(false);
  };

  const handleShareResult = async () => {
    const text = `
=== Minimum Turnover Tax Calculation (Bangladesh NBR Restructured Slabs) ===
Annual Business Turnover: BDT ${calculation.turnover.toLocaleString('en-IN')} (Tk. ${(calculation.turnover / 10000000).toFixed(2)} Crore)
Assigned Slab: ${calculation.slabLabel}
Applicable Minimum Rate: ${calculation.rateLabel}
Minimum Turnover Tax Payable: BDT ${calculation.currentTax.toLocaleString('en-IN')}
--------------------------------------------------
Comparison with Previous Proposal (Flat 1%):
Previous Flat 1% Tax: BDT ${calculation.previousTax.toLocaleString('en-IN')}
Revised Structure Tax: BDT ${calculation.currentTax.toLocaleString('en-IN')}
Tax Saved by Business: BDT ${calculation.savings.toLocaleString('en-IN')} (${calculation.savingsPercent}% reduction)
Loss-Making Status: ${isLossMaking ? 'Yes (Loss Incurred; Minimum Tax serves as statutory tax floor)' : 'No (Profitable)'}
Statutory Basis: National Board of Revenue (NBR) Revised Minimum Turnover Tax Framework
Accounticca × E-Lawyers Bangladesh Corporate Advisory
`.trim();

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback
    }

    if (navigator.share) {
      navigator.share({
        title: 'Minimum Turnover Tax Assessment - Bangladesh NBR',
        text
      }).catch(() => {});
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const copyResults = handleShareResult;

  const handleSaveSnapshot = () => {
    const newItem: SavedTurnoverCalc = {
      id: `turnover-${Date.now()}`,
      timestamp: Date.now(),
      dateFormatted: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }),
      turnover: calculation.turnover,
      slabLabel: calculation.slabLabel,
      rate: calculation.rate,
      rateLabel: calculation.rateLabel,
      currentTax: calculation.currentTax,
      previousTax: calculation.previousTax,
      savings: calculation.savings,
      isLossMaking
    };

    const filtered = history.filter(h => h.turnover !== calculation.turnover);
    const updated = [newItem, ...filtered].slice(0, 5);
    setHistory(updated);
    try {
      localStorage.setItem('turnover_tax_history', JSON.stringify(updated));
    } catch {
      // ignore
    }
    setSaveSuccessMessage('Turnover calculation saved to history!');
    setTimeout(() => setSaveSuccessMessage(null), 2500);
  };

  const handleRestore = (item: SavedTurnoverCalc) => {
    setTurnoverInput(item.turnover);
    setIsLossMaking(item.isLossMaking);
    setSaveSuccessMessage(`Restored Tk. ${(item.turnover / 10000000).toFixed(2)} Crore calculation`);
    setTimeout(() => setSaveSuccessMessage(null), 2500);
  };

  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    try {
      localStorage.setItem('turnover_tax_history', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleClearAllHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('turnover_tax_history');
    } catch {
      // ignore
    }
    setSaveSuccessMessage('History cleared.');
    setTimeout(() => setSaveSuccessMessage(null), 2000);
  };

  const handleDownloadPDF = () => {
    generateTurnoverPDF({
      turnover: calculation.turnover,
      slabLabel: calculation.slabLabel,
      rateLabel: calculation.rateLabel,
      currentTax: calculation.currentTax,
      previousTax: calculation.previousTax,
      savings: calculation.savings,
      savingsPercent: calculation.savingsPercent,
      isLossMaking
    });
  };

  return (
    <div className={`bg-white rounded-3xl border border-indigo-200/80 shadow-xl overflow-hidden ${className}`}>
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-400/30 backdrop-blur-xs text-indigo-300">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
                  NBR Restructured Slabs
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 rounded-md border border-emerald-500/30">
                  3-Tier Turnover System
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                Minimum Turnover Tax Calculator
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Calculate statutory minimum tax liability and compare savings versus the previous flat 1% proposal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-compliance-tips', { detail: { toolId: 'minimum-turnover-tax-tool' } }))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 transition-colors shadow-2xs cursor-pointer"
              title="Open context-aware compliance advice"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Compliance Tips</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/50 transition-colors shadow-xs"
              title="Download assessment report as PDF"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Download as PDF</span>
            </button>
            <button
              type="button"
              onClick={handleSaveSnapshot}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-800/60 hover:bg-indigo-700/80 border border-indigo-500/40 transition-colors shadow-2xs"
              title="Save snapshot to browser storage"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Snapshot</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            <button
              type="button"
              onClick={handleShareResult}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-900 bg-indigo-300 hover:bg-indigo-200 transition-colors shadow-xs"
              title="Share calculation result (copies formatted summary to clipboard)"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-800" /> : <Share2 className="w-3.5 h-3.5 text-slate-900" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Share Result'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tax Comparison Mode Banner & Toggle */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 px-6 sm:px-8 py-3.5 border-t border-indigo-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Tax Comparison Mode: New Slabs vs. Hypothetical 1% Flat Rate</span>
              <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Live Savings Visualizer
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Compare your actual tax liability against the previous uniform 1% proposal to calculate retained cash flow.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
          <span className="text-xs font-semibold text-slate-300">Compare 1% Flat:</span>
          <button
            type="button"
            role="switch"
            aria-checked={isComparisonActive}
            onClick={handleToggleComparison}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${
              isComparisonActive ? 'bg-indigo-500' : 'bg-slate-700'
            }`}
            title="Toggle hypothetical 1% flat rate comparison"
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                isComparisonActive ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-xs font-bold ${isComparisonActive ? 'text-emerald-400' : 'text-slate-500'}`}>
            {isComparisonActive ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Inputs Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Turnover Input Card */}
          <div className="bg-slate-50/90 p-5 sm:p-6 rounded-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="turnover-amount-input" className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <span>Annual Gross Sales / Turnover</span>
                <span className="text-xs font-normal text-slate-500">(BDT / Taka)</span>
              </label>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                Tk. {(calculation.turnover / 10000000).toFixed(2)} Crore
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              Total gross sales value or total business receipts during the income year (excluding VAT).
            </p>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                ৳
              </span>
              <input
                id="turnover-amount-input"
                type="number"
                min="0"
                step="500000"
                value={turnoverInput || ''}
                onChange={(e) => setTurnoverInput(Math.max(0, Number(e.target.value)))}
                className="w-full pl-9 pr-4 py-3 bg-white border border-slate-300 rounded-xl font-black text-slate-900 text-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-2xs"
                placeholder="e.g. 30000000"
              />
            </div>

            {/* Quick Presets */}
            <div className="mt-4">
              <div className="text-[11px] font-semibold text-slate-500 mb-1.5">Quick Turnover Presets:</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Tk. 80 Lakh', val: 8000000, desc: 'Slab 1 (0%)' },
                  { label: 'Tk. 1.50 Crore', val: 15000000, desc: 'Slab 1 (0%)' },
                  { label: 'Tk. 2.00 Crore', val: 20000000, desc: 'Slab 1 (0%)' },
                  { label: 'Tk. 3.00 Crore', val: 30000000, desc: 'Slab 2 (0.5%)' },
                  { label: 'Tk. 4.00 Crore', val: 40000000, desc: 'Slab 2 (0.5%)' },
                  { label: 'Tk. 6.00 Crore', val: 60000000, desc: 'Slab 3 (1.0%)' },
                  { label: 'Tk. 10.00 Crore', val: 100000000, desc: 'Slab 3 (1.0%)' }
                ].map(item => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setTurnoverInput(item.val)}
                    className={`text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all ${
                      calculation.turnover === item.val
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Loss-Making Simulation Toggle */}
          <div className="p-4 sm:p-5 bg-amber-50/70 rounded-2xl border border-amber-200/80 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Simulate Loss-Making Business Scenario</span>
              </div>
              <p className="text-[11px] text-amber-800/90 leading-relaxed">
                Under normal tax rules, a loss-making business has zero profit tax (Tk. 0). However, the Minimum Turnover Tax ensures that businesses contribute a baseline floor based on operational sales volume.
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => setIsLossMaking(!isLossMaking)}
              className={`shrink-0 px-3 py-1 text-xs font-bold rounded-lg border transition-colors ${
                isLossMaking
                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                  : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-100'
              }`}
            >
              {isLossMaking ? 'Loss-Making: ON' : 'Normal / Profit'}
            </button>
          </div>

          {/* Active Slab Card */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Assigned NBR Turnover Slab
              </span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${calculation.badgeColor}`}>
                {calculation.slabLabel}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[11px] text-slate-500 font-medium">Turnover Bracket</div>
                <div className="text-xs font-bold text-slate-800 mt-1">
                  {calculation.slabId === 1 && 'Up to Tk. 2 Crore'}
                  {calculation.slabId === 2 && 'Tk. 2 Cr to Tk. 4 Cr'}
                  {calculation.slabId === 3 && 'Above Tk. 4 Crore'}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[11px] text-slate-500 font-medium">Revised Tax Rate</div>
                <div className="text-sm font-black text-indigo-700 mt-0.5">
                  {calculation.rateLabel}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[11px] text-slate-500 font-medium">Previous Proposed Rate</div>
                <div className="text-xs font-bold text-slate-500 line-through mt-1">
                  1.0% (Flat)
                </div>
              </div>
            </div>

            <p className="mt-3.5 text-xs text-slate-600 leading-relaxed">
              {calculation.slabDesc}
            </p>
          </div>

          {/* 3-Tier Slab Visual Progression Bar */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
              <span>Slab Hierarchy</span>
              <span>Your Position: Tk. {(calculation.turnover / 10000000).toFixed(2)} Cr</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className={`p-2.5 rounded-xl border transition-all ${
                calculation.slabId === 1 
                  ? 'bg-emerald-600 text-white font-bold ring-2 ring-emerald-400 shadow-xs' 
                  : 'bg-white text-slate-700 border-slate-200'
              }`}>
                <div className="text-[10px] opacity-80 uppercase">Tier 1</div>
                <div className="font-extrabold">&le; Tk. 2 Crore</div>
                <div className="text-[11px] font-semibold mt-0.5">0% Tax-Free</div>
              </div>

              <div className={`p-2.5 rounded-xl border transition-all ${
                calculation.slabId === 2 
                  ? 'bg-indigo-600 text-white font-bold ring-2 ring-indigo-400 shadow-xs' 
                  : 'bg-white text-slate-700 border-slate-200'
              }`}>
                <div className="text-[10px] opacity-80 uppercase">Tier 2</div>
                <div className="font-extrabold">Tk. 2 - 4 Crore</div>
                <div className="text-[11px] font-semibold mt-0.5">0.5% Rate</div>
              </div>

              <div className={`p-2.5 rounded-xl border transition-all ${
                calculation.slabId === 3 
                  ? 'bg-purple-600 text-white font-bold ring-2 ring-purple-400 shadow-xs' 
                  : 'bg-white text-slate-700 border-slate-200'
              }`}>
                <div className="text-[10px] opacity-80 uppercase">Tier 3</div>
                <div className="font-extrabold">&gt; Tk. 4 Crore</div>
                <div className="text-[11px] font-semibold mt-0.5">1.0% Rate</div>
              </div>
            </div>
          </div>

          {/* Tax Comparison & Actual Savings Breakdown Card */}
          {isComparisonActive && (
            <div className="p-5 sm:p-6 bg-gradient-to-br from-indigo-50/90 via-purple-50/50 to-emerald-50/70 rounded-2xl border-2 border-indigo-200/90 shadow-sm space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-3 border-b border-indigo-200/70">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    Tax Comparison: New Slabs vs. Hypothetical 1% Flat Rate
                  </h4>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300">
                  Savings Visualizer
                </span>
              </div>

              {/* Side-by-side comparison cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. New Slab System */}
                <div className="p-4 bg-white rounded-xl border border-indigo-200 shadow-2xs">
                  <div className="text-[11px] font-bold uppercase text-indigo-700 tracking-wider">
                    New Slab System
                  </div>
                  <div className="text-xl font-black text-slate-900 mt-1">
                    ৳{calculation.currentTax.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Rate: <strong className="text-indigo-700">{calculation.rateLabel}</strong>
                  </div>
                </div>

                {/* 2. Hypothetical 1% Flat Rate */}
                <div className="p-4 bg-white rounded-xl border border-rose-200 shadow-2xs">
                  <div className="text-[11px] font-bold uppercase text-rose-700 tracking-wider">
                    Hypothetical 1% Flat
                  </div>
                  <div className="text-xl font-black text-rose-900 line-through mt-1">
                    ৳{calculation.previousTax.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Rate: <strong className="text-rose-700">1.0% Flat</strong> (All sales)
                  </div>
                </div>

                {/* 3. Actual Net Savings */}
                <div className={`p-4 rounded-xl border shadow-2xs ${
                  calculation.savings > 0 
                    ? 'bg-emerald-50 border-emerald-300' 
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="text-[11px] font-bold uppercase text-emerald-800 tracking-wider flex items-center justify-between">
                    <span>Actual Savings</span>
                    {calculation.savings > 0 && (
                      <span className="text-[10px] bg-emerald-200 text-emerald-950 px-1.5 py-0.5 rounded-md font-extrabold">
                        {calculation.savingsPercent}% Saved
                      </span>
                    )}
                  </div>
                  <div className="text-xl font-black text-emerald-700 mt-1">
                    ৳{calculation.savings.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-emerald-800 mt-0.5 font-medium">
                    {calculation.savings > 0 
                      ? 'Retained liquidity' 
                      : 'Standard rate active'}
                  </div>
                </div>
              </div>

              {/* Visual Comparison Progress Gauge */}
              {calculation.previousTax > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between items-center text-[11px] font-semibold text-slate-600">
                    <span>Tax Burden Relative to 1% Flat Proposal (100%):</span>
                    <span className="font-bold text-slate-800">
                      Current: {((calculation.currentTax / calculation.previousTax) * 100).toFixed(0)}% of flat levy
                    </span>
                  </div>

                  <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden flex">
                    <div 
                      style={{ width: `${Math.min(100, (calculation.currentTax / calculation.previousTax) * 100)}%` }}
                      className="h-full bg-indigo-600 transition-all duration-500" 
                      title={`Payable Tax: ৳${calculation.currentTax.toLocaleString('en-IN')}`}
                    />
                    <div 
                      style={{ width: `${Math.min(100, (calculation.savings / calculation.previousTax) * 100)}%` }}
                      className="h-full bg-emerald-400 transition-all duration-500" 
                      title={`Tax Saved: ৳${calculation.savings.toLocaleString('en-IN')}`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                    <span className="flex items-center gap-1 font-semibold text-indigo-700">
                      <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
                      <span>Payable Tax: {((calculation.currentTax / calculation.previousTax) * 100).toFixed(0)}%</span>
                    </span>
                    <span className="flex items-center gap-1 font-bold text-emerald-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                      <span>Actual Savings: {calculation.savingsPercent}%</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Explanatory Narrative Box */}
              <div className="text-xs text-slate-700 leading-relaxed bg-white/90 p-3.5 rounded-xl border border-indigo-100 flex items-start gap-2 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {calculation.slabId === 1 && (
                    <>
                      <strong>Small Business Exemption (100% Tax Relief):</strong> Under the hypothetical 1% flat rate, this business would have paid <strong>৳{calculation.previousTax.toLocaleString('en-IN')}</strong> regardless of profit or loss. Under NBR's new slab system, minimum turnover tax is <strong>Tk. 0</strong>, saving <strong>৳{calculation.savings.toLocaleString('en-IN')}</strong> in operational capital.
                    </>
                  )}
                  {calculation.slabId === 2 && (
                    <>
                      <strong>Medium Enterprise Relief (50% Tax Cut):</strong> By halving the rate from 1.0% (<strong>৳{calculation.previousTax.toLocaleString('en-IN')}</strong>) to 0.5% (<strong>৳{calculation.currentTax.toLocaleString('en-IN')}</strong>), the new slab structure preserves <strong>৳{calculation.savings.toLocaleString('en-IN')}</strong> for reinvestment and working capital.
                    </>
                  )}
                  {calculation.slabId === 3 && (
                    <>
                      <strong>Standard Corporate Floor:</strong> At turnover exceeding Tk. 4 Crore, the business reaches the standard 1.0% rate (<strong>৳{calculation.currentTax.toLocaleString('en-IN')}</strong>), which matches the baseline statutory floor for large commercial enterprises.
                    </>
                  )}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Output Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-indigo-800/40 sticky top-24">
            
            <div className="flex items-center justify-between pb-4 border-b border-indigo-800/60">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-400" />
                <h4 className="font-bold text-base text-white tracking-wide">
                  Turnover Tax Summary
                </h4>
              </div>
              <span className="text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-500/30">
                NBR Approved
              </span>
            </div>

            <div className="mt-5 space-y-3.5 text-sm">
              <div className="flex justify-between items-center text-slate-300">
                <span>Annual Turnover:</span>
                <span className="font-bold text-white">৳{calculation.turnover.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span>Turnover Bracket:</span>
                <span className="font-semibold text-indigo-300">{calculation.slabLabel.split('(')[0]}</span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span>Applied Minimum Rate:</span>
                <span className="font-bold text-indigo-400">{calculation.rateLabel}</span>
              </div>

              {isLossMaking && (
                <div className="p-2.5 bg-amber-950/70 border border-amber-700/50 rounded-xl text-xs text-amber-200">
                  <strong>Loss-making business:</strong> Regular profit tax = Tk. 0. Statutory payable tax equals this minimum turnover liability.
                </div>
              )}

              {/* Main Result Card */}
              <div className="mt-4 p-5 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl text-center text-white shadow-lg border border-indigo-400/30">
                <div className="text-xs uppercase font-semibold text-indigo-200 tracking-wider">
                  Payable Minimum Turnover Tax
                </div>
                <div className="text-3xl font-black mt-1">
                  ৳{calculation.currentTax.toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-indigo-200 mt-1 font-medium">
                  {calculation.currentTax === 0 
                    ? '100% Tax-Free under Tk. 2 Crore Exemption' 
                    : `Tk. ${(calculation.currentTax / 100000).toFixed(2)} Lakh`}
                </div>
              </div>

              {/* Comparison vs Previous 1% Flat Proposal */}
              <div className="mt-5 pt-4 border-t border-indigo-800/60 space-y-3">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Impact of Restructuring</span>
                  <span className="text-emerald-400 font-extrabold">Save vs 1% Flat</span>
                </div>

                <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/60 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Under Previous Flat 1%:</span>
                    <span className="line-through font-semibold text-slate-300">
                      ৳{calculation.previousTax.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex justify-between text-indigo-300">
                    <span>Under Revised Structure:</span>
                    <span className="font-bold text-white">
                      ৳{calculation.currentTax.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {calculation.savings > 0 ? (
                    <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-emerald-400">
                      <span className="font-bold flex items-center gap-1">
                        <TrendingDown className="w-4 h-4" />
                        Direct Tax Savings:
                      </span>
                      <span className="font-black text-sm">
                        -৳{calculation.savings.toLocaleString('en-IN')} ({calculation.savingsPercent}%)
                      </span>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-700 text-slate-400 text-[11px]">
                      At above Tk. 4 Crore, the standard 1% rate remains active.
                    </div>
                  )}
                </div>
              </div>

              {/* Statutory Note */}
              <div className="mt-4 pt-3 border-t border-indigo-800/60 text-[11px] text-slate-400 flex items-start gap-1.5 leading-relaxed">
                <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  Administered under Income Tax Act, 2023. Whichever is higher between normal corporate income tax and minimum turnover tax is the final tax liability.
                </span>
              </div>

              {/* Action Buttons in Card: Download PDF and Share Result */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="py-2.5 px-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98]"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handleShareResult}
                  className="py-2.5 px-3 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-indigo-300 transition-all active:scale-[0.98]"
                  title="Copy calculation summary to clipboard"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Share2 className="w-4 h-4 text-indigo-700" />}
                  <span>{copied ? 'Copied!' : 'Share Result'}</span>
                </button>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Incremental Turnover Tax Burden Line Chart */}
      <div className="border-t border-slate-200 p-6 sm:p-8 bg-slate-50/60">
        <TurnoverBurdenChart
          currentTurnover={calculation.turnover}
          onSelectTurnover={(val) => setTurnoverInput(val)}
        />
      </div>

      {/* Local Storage History (Last 5 Calculations) */}
      <div className="border-t border-slate-200 bg-slate-50/80 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-800 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-base text-slate-900">Turnover Calculation History</h4>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300">
                  {history.length}/5 Saved
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Saved in your local browser storage. Click Restore to reload values into the calculator.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveSnapshot}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-2xs"
            >
              <Save className="w-3.5 h-3.5" />
              Save Current
            </button>
            {history.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllHistory}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Feedback message banner */}
        {saveSuccessMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{saveSuccessMessage}</span>
          </div>
        )}

        {/* History Cards Grid */}
        {history.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
            <Clock className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-sm font-bold text-slate-700">No saved turnover calculations yet</div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Click &quot;Save Snapshot&quot; to keep up to 5 turnover tax scenarios for easy comparison.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {history.map((item, index) => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{item.dateFormatted}</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      #{index + 1}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Annual Turnover:</span>
                      <span className="font-bold text-slate-900">
                        Tk. {(item.turnover / 10000000).toFixed(2)} Cr
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Slab & Rate:</span>
                      <span className="font-semibold text-indigo-700">
                        {item.rateLabel}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Tax Payable:</span>
                      <span className="font-bold text-slate-900">
                        ৳{item.currentTax.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {item.savings > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span className="font-medium">Tax Saved:</span>
                        <span className="font-bold">
                          -৳{item.savings.toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleRestore(item)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restore</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteHistory(item.id, e)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

// Named and default export alias
export const MinimumTurnoverTaxCalculator = TurnoverTaxCalculator;
export default TurnoverTaxCalculator;
