import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  TrendingDown, 
  DollarSign, 
  FileDown, 
  Share2, 
  Lightbulb, 
  RotateCcw, 
  Info, 
  Copy, 
  Check, 
  Sparkles,
  ArrowRight,
  Save,
  Clock,
  Trash2,
  HelpCircle,
  TrendingUp,
  FileCheck2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell 
} from 'recharts';
import { generateCorporateTaxPDF } from '../../utils/taxPdfExport';
import { CorporateComplianceMasteryQuiz } from './CorporateComplianceMasteryQuiz';

export type CompanyTypeCategory = 'non_listed' | 'listed_over_10' | 'listed_under_10';

export interface SavedCorporateCalc {
  id: string;
  timestamp: number;
  dateFormatted: string;
  taxableProfit: number;
  category: CompanyTypeCategory;
  isBankingCompliant: boolean;
  effectiveRate: number;
  taxPayable: number;
  penaltyAmount: number;
}

const COMPANY_CATEGORIES: Record<CompanyTypeCategory, {
  name: string;
  shortName: string;
  standardRate: number;
  penaltyRate: number;
  ipoCriteria: string;
  badge: string;
}> = {
  non_listed: {
    name: 'Non-Listed Company (Private Limited / OPC)',
    shortName: 'Non-Listed',
    standardRate: 0.275,
    penaltyRate: 0.30,
    ipoCriteria: 'Unlisted private/public companies not traded on DSE or CSE',
    badge: 'Baseline 27.5%'
  },
  listed_over_10: {
    name: 'Listed Company (IPO > 10% of Capital)',
    shortName: 'Listed (>10% IPO)',
    standardRate: 0.20,
    penaltyRate: 0.225,
    ipoCriteria: 'Issued more than 10% of paid-up capital through IPO',
    badge: 'Preferred 20.0%'
  },
  listed_under_10: {
    name: 'Other Listed Company (IPO ≤ 10% of Capital)',
    shortName: 'Listed (≤10% IPO)',
    standardRate: 0.25,
    penaltyRate: 0.275,
    ipoCriteria: 'Issued 10% or less of paid-up capital through IPO',
    badge: 'Preferred 25.0%'
  }
};

const PROFIT_PRESETS = [
  { label: 'Tk. 1 Crore', val: 10000000 },
  { label: 'Tk. 5 Crore', val: 50000000 },
  { label: 'Tk. 10 Crore (Official Example)', val: 100000000 },
  { label: 'Tk. 20 Crore', val: 200000000 },
  { label: 'Tk. 50 Crore', val: 500000000 }
];

interface CorporateTaxRateCalculatorProps {
  initialProfit?: number;
  initialCategory?: CompanyTypeCategory;
  className?: string;
}

export function CorporateTaxRateCalculator({
  initialProfit = 100000000, // Tk. 10 Crore standard example
  initialCategory = 'non_listed',
  className = ''
}: CorporateTaxRateCalculatorProps) {
  const [profitInput, setProfitInput] = useState<string>(initialProfit.toString());
  const [category, setCategory] = useState<CompanyTypeCategory>(initialCategory);
  const [isBankingCompliant, setIsBankingCompliant] = useState<boolean>(true);
  const [companyName, setCompanyName] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // History in localStorage
  const [history, setHistory] = useState<SavedCorporateCalc[]>(() => {
    try {
      const saved = localStorage.getItem('corporate_tax_calc_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const taxableProfit = useMemo(() => {
    const val = parseFloat(profitInput);
    return isNaN(val) || val < 0 ? 0 : val;
  }, [profitInput]);

  const currentCategoryInfo = COMPANY_CATEGORIES[category];

  // Current calculation
  const calculation = useMemo(() => {
    const baseRate = currentCategoryInfo.standardRate;
    const effectiveRate = isBankingCompliant 
      ? currentCategoryInfo.standardRate 
      : currentCategoryInfo.penaltyRate;

    const baseTax = taxableProfit * baseRate;
    const finalTax = taxableProfit * effectiveRate;
    const penaltyAmount = isBankingCompliant ? 0 : finalTax - baseTax;
    const retainedEarnings = Math.max(0, taxableProfit - finalTax);

    // Multi-company comparison matrix for the exact same profit
    const nonListedRate = isBankingCompliant ? 0.275 : 0.30;
    const listedOver10Rate = isBankingCompliant ? 0.20 : 0.225;
    const listedUnder10Rate = isBankingCompliant ? 0.25 : 0.275;

    const nonListedTax = taxableProfit * nonListedRate;
    const listedOver10Tax = taxableProfit * listedOver10Rate;
    const listedUnder10Tax = taxableProfit * listedUnder10Rate;

    const savingsOver10 = Math.max(0, nonListedTax - listedOver10Tax);
    const savingsUnder10 = Math.max(0, nonListedTax - listedUnder10Tax);

    return {
      baseRate,
      effectiveRate,
      baseTax,
      finalTax,
      penaltyAmount,
      retainedEarnings,
      nonListedTax,
      listedOver10Tax,
      listedUnder10Tax,
      savingsOver10,
      savingsUnder10
    };
  }, [taxableProfit, category, isBankingCompliant, currentCategoryInfo]);

  // Chart data for visual comparison
  const chartData = useMemo(() => {
    return [
      {
        name: 'Company A: Non-Listed',
        rate: isBankingCompliant ? '27.5%' : '30.0%',
        taxCrore: +(calculation.nonListedTax / 10000000).toFixed(2),
        taxBDT: calculation.nonListedTax,
        fill: '#64748b' // Slate
      },
      {
        name: 'Company B: Listed (>10% IPO)',
        rate: isBankingCompliant ? '20.0%' : '22.5%',
        taxCrore: +(calculation.listedOver10Tax / 10000000).toFixed(2),
        taxBDT: calculation.listedOver10Tax,
        fill: '#10b981' // Emerald
      },
      {
        name: 'Company C: Listed (≤10% IPO)',
        rate: isBankingCompliant ? '25.0%' : '27.5%',
        taxCrore: +(calculation.listedUnder10Tax / 10000000).toFixed(2),
        taxBDT: calculation.listedUnder10Tax,
        fill: '#3b82f6' // Blue
      }
    ];
  }, [calculation, isBankingCompliant]);

  const handleDownloadPDF = () => {
    generateCorporateTaxPDF({
      companyName: companyName.trim() || undefined,
      taxableProfit,
      categoryLabel: currentCategoryInfo.name,
      isBankingCompliant,
      baseRate: calculation.baseRate,
      effectiveRate: calculation.effectiveRate,
      penaltyRate: 0.025,
      taxPayable: calculation.finalTax,
      penaltyAmount: calculation.penaltyAmount,
      nonListedTax: calculation.nonListedTax,
      listedOver10Tax: calculation.listedOver10Tax,
      listedUnder10Tax: calculation.listedUnder10Tax,
      savingsOver10: calculation.savingsOver10,
      savingsUnder10: calculation.savingsUnder10
    });
  };

  const handleShareResult = () => {
    const text = `
=== Bangladesh Corporate Tax Assessment (FY 2026-27 / AY 2027-28) ===
Entity: ${companyName.trim() || 'Corporate Assessee'}
Category: ${currentCategoryInfo.name}
Annual Taxable Profit: BDT ${taxableProfit.toLocaleString('en-IN')}

Banking Channel Status: ${isBankingCompliant ? 'Compliant (100% formal bank transfers)' : 'NON-COMPLIANT (+2.5% Penalty Applied)'}
Statutory Tax Rate: ${(calculation.effectiveRate * 100).toFixed(1)}%
Final Corporate Tax Liability: BDT ${calculation.finalTax.toLocaleString('en-IN')}
${!isBankingCompliant ? `• Unbanked Penalty Surcharge: +BDT ${calculation.penaltyAmount.toLocaleString('en-IN')}\n` : ''}Net Retained Profit: BDT ${calculation.retainedEarnings.toLocaleString('en-IN')}

--------------------------------------------------
Capital Market Listing Comparison (Same Profit):
1. Company A (Non-Listed, 27.5%): BDT ${calculation.nonListedTax.toLocaleString('en-IN')}
2. Company B (Listed >10% IPO, 20.0%): BDT ${calculation.listedOver10Tax.toLocaleString('en-IN')}
   → Tax Savings vs Non-Listed: BDT ${calculation.savingsOver10.toLocaleString('en-IN')} (Save 7.5%)
3. Company C (Listed ≤10% IPO, 25.0%): BDT ${calculation.listedUnder10Tax.toLocaleString('en-IN')}
   → Tax Savings vs Non-Listed: BDT ${calculation.savingsUnder10.toLocaleString('en-IN')} (Save 2.5%)

Statutory Authority: Income Tax Act, 2023 & NBR FY 2026-27 5-Year Roadmap
Accounticca × E-Lawyers Corporate Taxation & Capital Markets Advisory
`.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveSnapshot = () => {
    const newItem: SavedCorporateCalc = {
      id: `corp-${Date.now()}`,
      timestamp: Date.now(),
      dateFormatted: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }),
      taxableProfit,
      category,
      isBankingCompliant,
      effectiveRate: calculation.effectiveRate,
      taxPayable: calculation.finalTax,
      penaltyAmount: calculation.penaltyAmount
    };

    const updated = [newItem, ...history.filter(h => h.id !== newItem.id)].slice(0, 5);
    setHistory(updated);
    try {
      localStorage.setItem('corporate_tax_calc_history', JSON.stringify(updated));
    } catch {
      // ignore
    }
    setSaveSuccessMessage('Snapshot saved to history.');
    setTimeout(() => setSaveSuccessMessage(null), 2500);
  };

  const handleRestore = (item: SavedCorporateCalc) => {
    setProfitInput(item.taxableProfit.toString());
    setCategory(item.category);
    setIsBankingCompliant(item.isBankingCompliant);
    setSaveSuccessMessage(`Restored snapshot from ${item.dateFormatted}`);
    setTimeout(() => setSaveSuccessMessage(null), 2500);
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('corporate_tax_calc_history');
    } catch {
      // ignore
    }
    setSaveSuccessMessage('History cleared.');
    setTimeout(() => setSaveSuccessMessage(null), 2000);
  };

  const handleReset = () => {
    setProfitInput('100000000');
    setCategory('non_listed');
    setIsBankingCompliant(true);
    setCompanyName('');
  };

  return (
    <div className={`bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden ${className}`}>
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
                  National Budget FY 2026–27
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 rounded-md border border-emerald-500/30">
                  Listed vs Non-Listed Slabs
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-white/10 text-slate-200 rounded-md">
                  AY 2027–2028
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                Corporate Tax Rates & Comparison Calculator
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Calculate corporate tax liabilities, evaluate banking channel penalties (+2.5%), and project capital market IPO savings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-compliance-tips', { detail: { toolId: 'corporate-tax-tool' } }))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 transition-colors shadow-2xs cursor-pointer"
              title="Open corporate tax compliance advice"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Compliance Tips</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/50 transition-colors shadow-xs cursor-pointer"
              title="Download Corporate Assessment Report as PDF"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Download as PDF</span>
            </button>
            <button
              type="button"
              onClick={handleSaveSnapshot}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-800/60 hover:bg-indigo-700/80 border border-indigo-500/40 transition-colors shadow-2xs cursor-pointer"
              title="Save current corporate calculation to browser storage"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Snapshot ({history.length}/5)</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
              title="Reset calculator to defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {saveSuccessMessage && (
          <div className="mt-3 px-3.5 py-1.5 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-xs text-emerald-200 font-semibold flex items-center gap-2 animate-in fade-in duration-200">
            <Check className="w-3.5 h-3.5 text-emerald-300" />
            <span>{saveSuccessMessage}</span>
          </div>
        )}
      </div>

      {/* Main Content Layout */}
      <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Inputs & Company Options (7 cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* Company Optional Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Company / Entity Name <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Apex Industrial Solutions Ltd."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Assessment Period
              </label>
              <div className="px-3.5 py-2.5 bg-slate-100/70 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>FY 2026–2027 (AY 2027–2028)</span>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-extrabold uppercase">
                  Roadmap
                </span>
              </div>
            </div>
          </div>

          {/* Taxable Net Profit Input */}
          <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
              <label className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-indigo-600" />
                <span>Annual Taxable Net Profit (BDT)</span>
              </label>
              <span className="text-xs text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                Tk. {(taxableProfit / 10000000).toFixed(2)} Crore
              </span>
            </div>

            <div className="relative mt-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                ৳
              </span>
              <input
                type="number"
                min="0"
                step="100000"
                value={profitInput}
                onChange={(e) => setProfitInput(e.target.value)}
                placeholder="Enter taxable profit"
                className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-base font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
              />
            </div>

            {/* Quick Profit Presets */}
            <div className="mt-3">
              <div className="text-[11px] font-semibold text-slate-500 mb-1.5">
                Quick Scenario Presets:
              </div>
              <div className="flex flex-wrap gap-2">
                {PROFIT_PRESETS.map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => setProfitInput(preset.val.toString())}
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      taxableProfit === preset.val
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Company Category Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-indigo-600" />
                <span>Company Classification & Listing Status</span>
              </label>
              <span className="text-xs text-slate-500">Select to evaluate rate</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {(Object.keys(COMPANY_CATEGORIES) as CompanyTypeCategory[]).map((catKey) => {
                const info = COMPANY_CATEGORIES[catKey];
                const isSelected = category === catKey;
                return (
                  <div
                    key={catKey}
                    onClick={() => setCategory(catKey)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                        : 'border-slate-200 hover:border-indigo-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black text-slate-900">
                            {info.name}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            catKey === 'listed_over_10'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : catKey === 'listed_under_10'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : 'bg-slate-100 text-slate-800 border border-slate-300'
                          }`}>
                            {info.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {info.ipoCriteria}
                        </p>
                      </div>
                    </div>

                    <div className="text-right sm:self-center shrink-0 pl-8 sm:pl-0">
                      <div className="text-xs font-bold text-slate-500">Compliant Rate</div>
                      <div className="text-base font-black text-slate-900">
                        {(info.standardRate * 100).toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-amber-700 font-medium">
                        {(info.penaltyRate * 100).toFixed(1)}% unbanked
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Formal Banking Channels Toggle Card */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            isBankingCompliant 
              ? 'bg-emerald-50/70 border-emerald-200' 
              : 'bg-rose-50/90 border-rose-300 shadow-sm'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                  isBankingCompliant ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {isBankingCompliant ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-900">
                      Formal Banking Channel Compliance
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isBankingCompliant 
                        ? 'bg-emerald-200 text-emerald-900' 
                        : 'bg-rose-200 text-rose-900 animate-pulse'
                    }`}>
                      {isBankingCompliant ? 'Compliant' : '+2.5% Tax Penalty Active'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {isBankingCompliant 
                      ? 'All eligible income, receipts, and operational expenditures are conducted through official banking channels.' 
                      : 'Failing to conduct all transactions through formal banking channels invokes an immediate 2.5% surcharge penalty on taxable profits.'}
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
                <button
                  type="button"
                  role="switch"
                  aria-checked={isBankingCompliant}
                  onClick={() => setIsBankingCompliant(!isBankingCompliant)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                    isBankingCompliant ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                  title="Toggle banking channels compliance"
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isBankingCompliant ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className={`text-xs font-black ${isBankingCompliant ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {isBankingCompliant ? 'Yes (Compliant)' : 'No (Penalized)'}
                </span>
              </div>
            </div>

            {/* Non-compliance Penalty Callout */}
            {!isBankingCompliant && (
              <div className="mt-3 pt-3 border-t border-rose-200/80 text-xs text-rose-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Statutory Penalty Burden:</span>
                </div>
                <span className="font-black text-rose-900 bg-rose-200/70 px-2 py-0.5 rounded-md">
                  +BDT {calculation.penaltyAmount.toLocaleString('en-IN')} (adds 2.5% to total tax)
                </span>
              </div>
            )}
          </div>

          {/* History Drawer if exists */}
          {history.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  Saved Corporate Snapshots ({history.length}/5)
                </span>
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleRestore(item)}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition-all cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-800">
                        Tk. {(item.taxableProfit / 10000000).toFixed(2)} Cr ({COMPANY_CATEGORIES[item.category].shortName})
                      </div>
                      <div className="text-[10px] text-slate-500">{item.dateFormatted}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-indigo-700">
                        Tk. {(item.taxPayable / 10000000).toFixed(2)} Cr
                      </div>
                      <div className="text-[10px] text-slate-500">{(item.effectiveRate * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Statutory Results & Multi-Company Comparison (5 cols) */}
        <div className="lg:col-span-5 space-y-6">

          {/* Primary Liability Output Card */}
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
                <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] font-extrabold text-indigo-300">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  Statutory Tax Output
                </span>
                <span className="bg-white/10 px-2 py-0.5 rounded-md text-white font-mono text-[11px]">
                  AY 2027–2028
                </span>
              </div>

              <div className="text-xs text-slate-400 mb-1">
                Effective Corporate Tax Rate:
              </div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                  {(calculation.effectiveRate * 100).toFixed(1)}%
                </span>
                {calculation.penaltyAmount > 0 && (
                  <span className="text-xs font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-400/30">
                    Includes +2.5% penalty
                  </span>
                )}
              </div>

              {/* Total Corporate Tax Box */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-4">
                <div className="text-xs text-indigo-200 font-bold uppercase tracking-wider">
                  Corporate Tax Payable:
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
                  ৳ {calculation.finalTax.toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-slate-300 mt-0.5">
                  ≈ Tk. {(calculation.finalTax / 10000000).toFixed(2)} Crore
                </div>
              </div>

              {/* Breakdown Rows */}
              <div className="space-y-2 text-xs border-t border-slate-800 pt-3">
                <div className="flex justify-between text-slate-300">
                  <span>Annual Taxable Profit:</span>
                  <span className="font-bold text-white">৳ {taxableProfit.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Base Rate:</span>
                  <span className="font-bold text-white">{(calculation.baseRate * 100).toFixed(1)}%</span>
                </div>
                {calculation.penaltyAmount > 0 && (
                  <div className="flex justify-between text-rose-300 font-bold">
                    <span>Non-Banking Channel Penalty:</span>
                    <span>+৳ {calculation.penaltyAmount.toLocaleString('en-IN')} (+2.5%)</span>
                  </div>
                )}
                <div className="flex justify-between text-emerald-300 font-bold pt-1 border-t border-slate-800">
                  <span>Net Retained Profit (Post-Tax):</span>
                  <span>৳ {calculation.retainedEarnings.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Action Buttons: PDF & Share */}
              <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 transition-colors shadow-xs cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Download PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handleShareResult}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-xs cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share Result</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Multi-Company Side-by-Side Comparison Card */}
          <div className="bg-slate-50 rounded-3xl p-5 sm:p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Side-by-Side Savings Analysis</span>
              </h4>
              <span className="text-[10px] text-slate-500 font-semibold">
                Tk. {(taxableProfit / 10000000).toFixed(1)} Cr Profit
              </span>
            </div>

            {/* Visual Recharts Bar Comparison */}
            <div className="h-44 w-full mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="rate" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit=" Cr" />
                  <Tooltip 
                    formatter={(val: any) => [`Tk. ${val} Crore (৳ ${((val as number) * 10000000).toLocaleString('en-IN')})`, 'Corporate Tax']}
                    contentStyle={{ borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="taxCrore" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Comparison Rows */}
            <div className="space-y-2 text-xs">
              {/* Company A: Non-listed */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-slate-900">
                    Company A (Non-Listed)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Rate: {isBankingCompliant ? '27.5%' : '30.0%'} • Baseline
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-slate-900">
                    Tk. {(calculation.nonListedTax / 10000000).toFixed(2)} Cr
                  </div>
                  <div className="text-[10px] text-slate-400">Standard</div>
                </div>
              </div>

              {/* Company B: Listed > 10% */}
              <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-emerald-950 flex items-center gap-1">
                    <span>Company B (Listed &gt;10% IPO)</span>
                    <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1 rounded-sm font-bold">Max Savings</span>
                  </div>
                  <div className="text-[11px] text-emerald-700">
                    Rate: {isBankingCompliant ? '20.0%' : '22.5%'} • 7.5% discount
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-emerald-900">
                    Tk. {(calculation.listedOver10Tax / 10000000).toFixed(2)} Cr
                  </div>
                  <div className="text-[10px] font-bold text-emerald-700">
                    Saves Tk. {(calculation.savingsOver10 / 10000000).toFixed(2)} Cr
                  </div>
                </div>
              </div>

              {/* Company C: Listed <= 10% */}
              <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-blue-950">
                    Company C (Listed ≤10% IPO)
                  </div>
                  <div className="text-[11px] text-blue-700">
                    Rate: {isBankingCompliant ? '25.0%' : '27.5%'} • 2.5% discount
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-blue-900">
                    Tk. {(calculation.listedUnder10Tax / 10000000).toFixed(2)} Cr
                  </div>
                  <div className="text-[10px] font-bold text-blue-700">
                    Saves Tk. {(calculation.savingsUnder10 / 10000000).toFixed(2)} Cr
                  </div>
                </div>
              </div>
            </div>

            {/* Practical Comparison Summary Text */}
            <div className="mt-3 p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-[11px] text-indigo-900 leading-relaxed">
              <strong>Capital Market Benefit:</strong> On a taxable profit of Tk. {(taxableProfit / 10000000).toFixed(0)} Crore, a listed company with &gt;10% IPO issuance retains an additional <strong>Tk. {(calculation.savingsOver10 / 10000000).toFixed(2)} Crore (Tk. {Math.round(calculation.savingsOver10 / 100000).toLocaleString('en-IN')} Lakh)</strong> in liquidity every year compared to a private company.
            </div>
          </div>

        </div>
      </div>

      {/* Strategic Insights & Policy Overview Accordion/Grid */}
      <div className="p-6 sm:p-8 bg-slate-50 border-t border-slate-200">
        <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-600" />
          <span>Strategic Regulatory Context & Policy Rationale</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Why Government Provides Lower Rates */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <h5 className="text-xs font-black uppercase tracking-wider text-emerald-800 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Why Listed Companies Receive Lower Tax Rates</span>
            </h5>
            <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="font-bold text-slate-900 shrink-0">1. Capital Market Depth:</span>
                <span>Incentivizes private family conglomerates to raise public equity rather than accumulating heavy short-term bank debt.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-slate-900 shrink-0">2. Corporate Governance:</span>
                <span>Listed entities are subject to BSEC oversight, mandatory quarterly audits, independent directorships, and IFRS standards.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-slate-900 shrink-0">3. Formal Financial System:</span>
                <span>Minimizes unrecorded revenue, discourages cash hoarding, and creates transparent audit trails across industries.</span>
              </li>
            </ul>
          </div>

          {/* Criticisms and Business Concerns */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <h5 className="text-xs font-black uppercase tracking-wider text-amber-800 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Business Concerns & Operational Realities</span>
            </h5>
            <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="font-bold text-slate-900 shrink-0">1. Heavy Compliance Pressure:</span>
                <span>Maintaining 100% formal banking for petty supplier expenses, agricultural raw materials, and daily wage disbursements is challenging.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-slate-900 shrink-0">2. Disadvantage for SMEs:</span>
                <span>Smaller private companies without the scale for an IPO bear the full 27.5%–30.0% rate without capital market subsidies.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-slate-900 shrink-0">3. IPO Listing Hurdles:</span>
                <span>Minimum Tk. 30 Crore paid-up capital requirement, high underwriting fees, and public disclosure overhead prevent smaller firms from listing.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Interactive Mastery Quiz & Rule Evaluators (2.5% Banking Rule, BDT 5L/36L Mandates, Sec 56/56Ka 50% Penalty & Startup Sandbox) */}
      <div className="p-6 sm:p-8 border-t border-slate-200 bg-white">
        <CorporateComplianceMasteryQuiz initialTopic="ALL" />
      </div>
    </div>
  );
}

export default CorporateTaxRateCalculator;
