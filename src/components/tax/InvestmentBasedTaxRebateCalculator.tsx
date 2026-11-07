import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calculator, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  Copy, 
  Check, 
  Sparkles, 
  Scale, 
  ShieldCheck, 
  Save, 
  Clock, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Info,
  DollarSign,
  TrendingDown,
  FileText,
  FileDown,
  Share2,
  Lightbulb
} from 'lucide-react';
import { generateRebatePDF } from '../../utils/taxPdfExport';
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

export interface SavedRebateCalc {
  id: string;
  timestamp: number;
  dateFormatted: string;
  taxableIncome: number;
  eligibleInvestment: number;
  limit1_income: number;
  limit2_investment: number;
  limit3_ceiling: number;
  allowableRebate: number;
  limitingTitle: string;
}

interface ItemizedInvestments {
  dps: number;
  lifeInsurance: number;
  govSecurities: number;
  mutualFundsShares: number;
  universalPension: number;
  providentFund: number;
  approvedDonations: number;
}

export function InvestmentBasedTaxRebateCalculator({ className = '' }: { className?: string }) {
  // Inputs: Taxable Income and Eligible Investment (Default: Tk. 20 Lakh income, Tk. 8 Lakh investment)
  const [taxableIncome, setTaxableIncome] = useState<number>(2000000);
  const [eligibleInvestment, setEligibleInvestment] = useState<number>(800000);
  
  // Optional Itemized Breakdown toggle
  const [showItemized, setShowItemized] = useState<boolean>(false);
  const [itemized, setItemized] = useState<ItemizedInvestments>({
    dps: 120000,
    lifeInsurance: 80000,
    govSecurities: 400000,
    mutualFundsShares: 100000,
    universalPension: 50000,
    providentFund: 50000,
    approvedDonations: 0,
  });

  const [copied, setCopied] = useState<boolean>(false);
  const [history, setHistory] = useState<SavedRebateCalc[]>(() => {
    try {
      const saved = localStorage.getItem('rebate_calc_history');
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

  // Government Maximum Ceiling under Finance Act 2026
  const GOVT_MAX_CEILING = 750000;
  const DPS_STATUTORY_CAP = 120000;

  // Synchronize itemized investments sum (respecting DPS cap of 1.2L)
  const effectiveDps = Math.min(Number(itemized.dps) || 0, DPS_STATUTORY_CAP);
  const itemizedTotal = useMemo(() => {
    return (
      effectiveDps +
      (Number(itemized.lifeInsurance) || 0) +
      (Number(itemized.govSecurities) || 0) +
      (Number(itemized.mutualFundsShares) || 0) +
      (Number(itemized.universalPension) || 0) +
      (Number(itemized.providentFund) || 0) +
      (Number(itemized.approvedDonations) || 0)
    );
  }, [itemized, effectiveDps]);

  // Main Calculation Logic
  // Formula: Lowest of:
  // 1. 3% of total taxable income
  // 2. 10% of eligible investment
  // 3. Tk. 7,50,000 ceiling
  const calculation = useMemo(() => {
    const income = Math.max(0, Number(taxableIncome) || 0);
    const investment = Math.max(0, Number(eligibleInvestment) || 0);

    const limit1_income = income * 0.03;
    const limit2_investment = investment * 0.10;
    const limit3_ceiling = GOVT_MAX_CEILING;

    const allowableRebate = Math.min(limit1_income, limit2_investment, limit3_ceiling);

    // Identify which limit is the constraining ceiling
    let limitingFactor: 'income' | 'investment' | 'ceiling' = 'income';
    let limitingTitle = 'Income-Based Limit (3%)';
    let limitingBadgeColor = 'bg-blue-100 text-blue-800 border-blue-300';
    let limitingDesc = 'The rebate is capped by your taxable income (maximum 3% of taxable income).';

    if (allowableRebate === limit1_income && (allowableRebate < limit2_investment || allowableRebate < limit3_ceiling)) {
      limitingFactor = 'income';
      limitingTitle = 'Income Limit (3% of Taxable Income)';
      limitingBadgeColor = 'bg-blue-100 text-blue-800 border-blue-300';
      limitingDesc = 'Your eligible investment exceeds what your taxable income allows to be rebated. Increasing investments further will not generate extra rebate unless taxable income rises.';
    } else if (allowableRebate === limit2_investment && (allowableRebate < limit1_income || allowableRebate < limit3_ceiling)) {
      limitingFactor = 'investment';
      limitingTitle = 'Investment Limit (10% of Investment)';
      limitingBadgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
      limitingDesc = 'Your rebate is directly determined by 10% of your current investment. You have unused income allowance, meaning additional eligible investments will increase your rebate!';
    } else {
      limitingFactor = 'ceiling';
      limitingTitle = 'Government Maximum Ceiling (Tk. 7.5 Lakh)';
      limitingBadgeColor = 'bg-purple-100 text-purple-800 border-purple-300';
      limitingDesc = 'You have reached the absolute statutory maximum rebate allowed by the Government of Bangladesh for AY 2026-2027.';
    }

    // Chart Data for visual comparison
    const chartData = [
      { name: '3% Income Limit', amount: Math.round(limit1_income), fill: limitingFactor === 'income' ? '#059669' : '#64748b' },
      { name: '10% Investment', amount: Math.round(limit2_investment), fill: limitingFactor === 'investment' ? '#059669' : '#64748b' },
      { name: 'Govt Ceiling', amount: limit3_ceiling, fill: limitingFactor === 'ceiling' ? '#059669' : '#64748b' },
    ];

    return {
      income,
      investment,
      limit1_income,
      limit2_investment,
      limit3_ceiling,
      allowableRebate,
      limitingFactor,
      limitingTitle,
      limitingBadgeColor,
      limitingDesc,
      chartData
    };
  }, [taxableIncome, eligibleInvestment]);

  const loadExample = (ex: 1 | 2 | 3) => {
    if (ex === 1) {
      setTaxableIncome(2000000);
      setEligibleInvestment(800000);
    } else if (ex === 2) {
      setTaxableIncome(10000000);
      setEligibleInvestment(5000000);
    } else if (ex === 3) {
      setTaxableIncome(50000000);
      setEligibleInvestment(10000000);
    }
  };

  const handleReset = () => {
    setTaxableIncome(2000000);
    setEligibleInvestment(800000);
    setShowItemized(false);
  };

  const handleShareResult = async () => {
    const text = `
=== Investment-Based Tax Rebate Calculator (Bangladesh Finance Act 2026) ===
Total Taxable Income: BDT ${calculation.income.toLocaleString('en-IN')}
Total Eligible Investment: BDT ${calculation.investment.toLocaleString('en-IN')}
--------------------------------------------------
Evaluation of the Three Statutory Limits:
1. 3% of Taxable Income: BDT ${calculation.limit1_income.toLocaleString('en-IN')}
2. 10% of Eligible Investment: BDT ${calculation.limit2_investment.toLocaleString('en-IN')}
3. Government Maximum Ceiling: BDT ${calculation.limit3_ceiling.toLocaleString('en-IN')} (Tk. 7.5 Lakh)
--------------------------------------------------
Final Allowable Tax Credit: BDT ${calculation.allowableRebate.toLocaleString('en-IN')}
Governing Statutory Limit: ${calculation.limitingTitle}
Statutory Basis: Section 78, Income Tax Act, 2023 & Part 3 of Sixth Schedule (Finance Act 2026)
Accounticca × E-Lawyers Direct Tax Practice
`.trim();

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback
    }

    if (navigator.share) {
      navigator.share({
        title: 'Investment Tax Rebate Assessment - AY 2026-27',
        text
      }).catch(() => {});
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const copyResults = handleShareResult;

  const handleSaveSnapshot = () => {
    const newItem: SavedRebateCalc = {
      id: `rebate-${Date.now()}`,
      timestamp: Date.now(),
      dateFormatted: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }),
      taxableIncome: calculation.income,
      eligibleInvestment: calculation.investment,
      limit1_income: calculation.limit1_income,
      limit2_investment: calculation.limit2_investment,
      limit3_ceiling: calculation.limit3_ceiling,
      allowableRebate: calculation.allowableRebate,
      limitingTitle: calculation.limitingTitle
    };

    const filtered = history.filter(
      h => !(h.taxableIncome === calculation.income && h.eligibleInvestment === calculation.investment)
    );
    const updated = [newItem, ...filtered].slice(0, 5);
    setHistory(updated);
    try {
      localStorage.setItem('rebate_calc_history', JSON.stringify(updated));
    } catch {
      // ignore
    }
    setSaveSuccessMessage('Rebate calculation saved to history!');
    setTimeout(() => setSaveSuccessMessage(null), 2500);
  };

  const handleRestore = (item: SavedRebateCalc) => {
    setTaxableIncome(item.taxableIncome);
    setEligibleInvestment(item.eligibleInvestment);
    setSaveSuccessMessage(`Restored calculation (Income: ৳${(item.taxableIncome / 100000).toFixed(1)}L)`);
    setTimeout(() => setSaveSuccessMessage(null), 2500);
  };

  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    try {
      localStorage.setItem('rebate_calc_history', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('rebate_calc_history');
    } catch {
      // ignore
    }
    setSaveSuccessMessage('History cleared.');
    setTimeout(() => setSaveSuccessMessage(null), 2000);
  };

  const handleDownloadPDF = () => {
    generateRebatePDF({
      taxableIncome: calculation.income,
      eligibleInvestment: calculation.investment,
      limit1_income: calculation.limit1_income,
      limit2_investment: calculation.limit2_investment,
      limit3_ceiling: calculation.limit3_ceiling,
      allowableRebate: calculation.allowableRebate,
      limitingTitle: calculation.limitingTitle,
      limitingDesc: calculation.limitingDesc,
      itemized: showItemized ? {
        dps: effectiveDps,
        lifeInsurance: itemized.lifeInsurance,
        govSecurities: itemized.govSecurities,
        mutualFundsShares: itemized.mutualFundsShares,
        universalPension: itemized.universalPension,
        providentFund: itemized.providentFund
      } : undefined
    });
  };

  return (
    <div className={`bg-white rounded-3xl border border-emerald-200/90 shadow-xl overflow-hidden ${className}`}>
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-400/30 backdrop-blur-xs text-emerald-300">
              <Scale className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                  Finance Act 2026
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-white/10 text-slate-200 rounded-md">
                  AY 2026–2027
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                Investment-Based Tax Rebate Calculator
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Computes maximum allowable tax credit as the lowest of 3% taxable income, 10% investment, and Tk. 7,50,000 ceiling
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-compliance-tips', { detail: { toolId: 'investment-rebate-calculator-tool' } }))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 transition-colors shadow-2xs cursor-pointer"
              title="Open context-aware compliance advice"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Compliance Tips</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/50 transition-colors shadow-xs"
              title="Download Rebate Assessment Report as PDF"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Download as PDF</span>
            </button>
            <button
              type="button"
              onClick={handleSaveSnapshot}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-emerald-800/60 hover:bg-emerald-700/80 border border-emerald-500/40 transition-colors shadow-2xs"
              title="Save calculation snapshot"
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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-900 bg-emerald-300 hover:bg-emerald-200 transition-colors shadow-xs"
              title="Share calculation result (copies formatted summary to clipboard)"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-800" /> : <Share2 className="w-3.5 h-3.5 text-slate-900" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Share Result'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Inputs Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Official Examples Quick Presets */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Finance Act 2026 Case Studies:</span>
              </span>
              <span className="text-[11px] text-slate-500 font-normal">Click to test scenario</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => loadExample(1)}
                className="p-2.5 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition-all text-xs"
              >
                <div className="font-bold text-slate-800">Example 1: Moderate</div>
                <div className="text-[10px] text-slate-500 mt-0.5">৳20L Income • ৳8L Inv</div>
                <div className="text-[11px] font-extrabold text-emerald-700 mt-1">Rebate: ৳60,000</div>
              </button>

              <button
                type="button"
                onClick={() => loadExample(2)}
                className="p-2.5 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition-all text-xs"
              >
                <div className="font-bold text-slate-800">Example 2: High Income</div>
                <div className="text-[10px] text-slate-500 mt-0.5">৳1 Cr Income • ৳50L Inv</div>
                <div className="text-[11px] font-extrabold text-emerald-700 mt-1">Rebate: ৳3,00,000</div>
              </button>

              <button
                type="button"
                onClick={() => loadExample(3)}
                className="p-2.5 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition-all text-xs"
              >
                <div className="font-bold text-slate-800">Example 3: Max Cap</div>
                <div className="text-[10px] text-slate-500 mt-0.5">৳5 Cr Income • ৳1 Cr Inv</div>
                <div className="text-[11px] font-extrabold text-purple-700 mt-1">Rebate: ৳7,50,000</div>
              </button>
            </div>
          </div>

          {/* Primary Input 1: Total Taxable Income */}
          <div className="bg-slate-50/90 p-5 rounded-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="taxable-income-input" className="text-sm font-bold text-slate-800">
                1. Total Taxable Income (BDT)
              </label>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                3% Limit = ৳{calculation.limit1_income.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-2.5">
              Total gross income from employment, rent, business, capital gains, etc., before any investment rebate.
            </p>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">৳</span>
              <input
                id="taxable-income-input"
                type="number"
                min="0"
                step="50000"
                value={taxableIncome || ''}
                onChange={(e) => setTaxableIncome(Math.max(0, Number(e.target.value)))}
                className="w-full pl-9 pr-4 py-3 bg-white border border-slate-300 rounded-xl font-black text-slate-900 text-lg focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                placeholder="e.g. 2000000"
              />
            </div>
            {/* Quick Chips */}
            <div className="flex flex-wrap gap-2 mt-2.5">
              {[1000000, 1500000, 2000000, 3500000, 5000000, 10000000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setTaxableIncome(val)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-colors ${
                    taxableIncome === val
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  ৳{(val / 100000).toFixed(0)} Lakh
                </button>
              ))}
            </div>
          </div>

          {/* Primary Input 2: Eligible Investment Amount */}
          <div className="bg-slate-50/90 p-5 rounded-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="eligible-investment-input" className="text-sm font-bold text-slate-800">
                2. Total Eligible Investment (BDT)
              </label>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                10% Limit = ৳{calculation.limit2_investment.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-2.5">
              Total qualifying investments made under Part 3 of Sixth Schedule (DPS, insurance, bonds, mutual funds).
            </p>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">৳</span>
              <input
                id="eligible-investment-input"
                type="number"
                min="0"
                step="25000"
                value={eligibleInvestment || ''}
                onChange={(e) => setEligibleInvestment(Math.max(0, Number(e.target.value)))}
                className="w-full pl-9 pr-4 py-3 bg-white border border-slate-300 rounded-xl font-black text-slate-900 text-lg focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                placeholder="e.g. 800000"
              />
            </div>
            {/* Quick Chips */}
            <div className="flex flex-wrap gap-2 mt-2.5">
              {[300000, 500000, 800000, 1500000, 3000000, 5000000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setEligibleInvestment(val)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-colors ${
                    eligibleInvestment === val
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  ৳{(val / 100000).toFixed(0)} Lakh
                </button>
              ))}
            </div>

            {/* Optional Itemized Drawer */}
            <div className="mt-4 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowItemized(!showItemized)}
                className="flex items-center justify-between w-full text-xs font-bold text-emerald-700 hover:text-emerald-800"
              >
                <span>{showItemized ? 'Hide Itemized Investment Breakdown' : 'Fill Itemized Investments (DPS, Insurance, Bonds, Pension)'}</span>
                {showItemized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showItemized && (
                <div className="mt-3 p-3.5 bg-white rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Deposit Pension Scheme (DPS)
                      <span className="text-[10px] text-slate-500 font-normal ml-1">(Max Tk. 1.2 Lakh)</span>
                    </label>
                    <input
                      type="number"
                      value={itemized.dps}
                      onChange={(e) => setItemized(prev => ({ ...prev, dps: Number(e.target.value) }))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg mt-0.5 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Life Insurance Premium
                      <span className="text-[10px] text-slate-500 font-normal ml-1">(Max 10% of sum assured)</span>
                    </label>
                    <input
                      type="number"
                      value={itemized.lifeInsurance}
                      onChange={(e) => setItemized(prev => ({ ...prev, lifeInsurance: Number(e.target.value) }))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg mt-0.5 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Govt. Securities / Sanchayapatra
                    </label>
                    <input
                      type="number"
                      value={itemized.govSecurities}
                      onChange={(e) => setItemized(prev => ({ ...prev, govSecurities: Number(e.target.value) }))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg mt-0.5 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Listed Mutual Funds / Stocks
                    </label>
                    <input
                      type="number"
                      value={itemized.mutualFundsShares}
                      onChange={(e) => setItemized(prev => ({ ...prev, mutualFundsShares: Number(e.target.value) }))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg mt-0.5 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Universal Pension Scheme (UPS)
                    </label>
                    <input
                      type="number"
                      value={itemized.universalPension}
                      onChange={(e) => setItemized(prev => ({ ...prev, universalPension: Number(e.target.value) }))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg mt-0.5 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Recognized Provident Fund (RPF)
                    </label>
                    <input
                      type="number"
                      value={itemized.providentFund}
                      onChange={(e) => setItemized(prev => ({ ...prev, providentFund: Number(e.target.value) }))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg mt-0.5 text-xs font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-slate-600 font-semibold">
                      Total Calculated Eligible: <strong>৳{itemizedTotal.toLocaleString('en-IN')}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setEligibleInvestment(itemizedTotal)}
                      className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-700 transition-colors shadow-2xs"
                    >
                      Apply Total to Calculator &uarr;
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Three Statutory Benchmarks Breakdown Card */}
          <div className="bg-slate-50/90 p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="uppercase tracking-wider">Evaluation of the 3 Benchmarks</span>
              <span className="text-emerald-700 font-extrabold">Allowable = Lowest</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Benchmark 1 */}
              <div className={`p-4 rounded-xl border transition-all ${
                calculation.limitingFactor === 'income'
                  ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300 shadow-xs'
                  : 'bg-white border-slate-200'
              }`}>
                <div className="text-[10px] font-bold uppercase text-slate-500">Benchmark 1</div>
                <div className="text-xs font-bold text-slate-800 mt-0.5">3% of Taxable Income</div>
                <div className="text-lg font-black text-slate-900 mt-1">
                  ৳{calculation.limit1_income.toLocaleString('en-IN')}
                </div>
                {calculation.limitingFactor === 'income' && (
                  <span className="inline-block mt-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded-full">
                    LOWEST (GOVERNING)
                  </span>
                )}
              </div>

              {/* Benchmark 2 */}
              <div className={`p-4 rounded-xl border transition-all ${
                calculation.limitingFactor === 'investment'
                  ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300 shadow-xs'
                  : 'bg-white border-slate-200'
              }`}>
                <div className="text-[10px] font-bold uppercase text-slate-500">Benchmark 2</div>
                <div className="text-xs font-bold text-slate-800 mt-0.5">10% of Investment</div>
                <div className="text-lg font-black text-slate-900 mt-1">
                  ৳{calculation.limit2_investment.toLocaleString('en-IN')}
                </div>
                {calculation.limitingFactor === 'investment' && (
                  <span className="inline-block mt-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded-full">
                    LOWEST (GOVERNING)
                  </span>
                )}
              </div>

              {/* Benchmark 3 */}
              <div className={`p-4 rounded-xl border transition-all ${
                calculation.limitingFactor === 'ceiling'
                  ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-300 shadow-xs'
                  : 'bg-white border-slate-200'
              }`}>
                <div className="text-[10px] font-bold uppercase text-slate-500">Benchmark 3</div>
                <div className="text-xs font-bold text-slate-800 mt-0.5">Government Ceiling</div>
                <div className="text-lg font-black text-slate-900 mt-1">
                  ৳{calculation.limit3_ceiling.toLocaleString('en-IN')}
                </div>
                {calculation.limitingFactor === 'ceiling' && (
                  <span className="inline-block mt-1 text-[10px] font-extrabold text-purple-800 bg-purple-200/80 px-2 py-0.5 rounded-full">
                    LOWEST (GOVERNING)
                  </span>
                )}
              </div>
            </div>

            {/* Narrative Explanation */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
              <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{calculation.limitingDesc}</span>
            </div>
          </div>

        </div>

        {/* Right Output Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-emerald-800/40 sticky top-24">
            
            <div className="flex items-center justify-between pb-4 border-b border-emerald-800/60">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-base text-white tracking-wide">
                  Rebate Summary
                </h4>
              </div>
              <span className="text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30">
                Section 78
              </span>
            </div>

            <div className="mt-5 space-y-3.5 text-sm">
              <div className="flex justify-between items-center text-slate-300">
                <span>Taxable Income:</span>
                <span className="font-bold text-white">৳{calculation.income.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span>Eligible Investment:</span>
                <span className="font-bold text-white">৳{calculation.investment.toLocaleString('en-IN')}</span>
              </div>

              <div className="pt-2 border-t border-emerald-800/50 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>1. 3% of Income:</span>
                  <span className="font-bold">৳{calculation.limit1_income.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>2. 10% of Investment:</span>
                  <span className="font-bold">৳{calculation.limit2_investment.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>3. Maximum Cap:</span>
                  <span className="font-bold">৳{calculation.limit3_ceiling.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Main Result Card */}
              <div className="mt-4 p-5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl text-center text-white shadow-lg border border-emerald-400/30">
                <div className="text-xs uppercase font-semibold text-emerald-100 tracking-wider">
                  Final Allowable Tax Credit
                </div>
                <div className="text-3xl font-black mt-1">
                  ৳{calculation.allowableRebate.toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-emerald-100 mt-1 font-medium">
                  Direct deduction from payable tax liability
                </div>
              </div>

              {/* Limiting Factor Tag */}
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs space-y-1">
                <div className="text-slate-400 text-[11px]">Governing Limitation:</div>
                <div className="font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{calculation.limitingTitle}</span>
                </div>
              </div>

              {/* Visual Bar Chart of the 3 Limits */}
              <div className="mt-4 pt-3 border-t border-emerald-800/60">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Three Limits Comparison Chart
                </div>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={calculation.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 10 }} axisLine={{ stroke: '#475569' }} />
                      <YAxis tick={{ fill: '#cbd5e1', fontSize: 10 }} axisLine={{ stroke: '#475569' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px', color: '#fff' }}
                        formatter={(val: any) => [`৳${Number(val).toLocaleString('en-IN')}`, 'Amount']}
                      />
                      <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                        {calculation.chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-[10px] text-slate-400 text-center mt-1">
                  Green bar indicates the lowest allowable statutory credit.
                </div>

                {/* Action Buttons: Download PDF and Share Result */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    className="py-2.5 px-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98]"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleShareResult}
                    className="py-2.5 px-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-emerald-300 transition-all active:scale-[0.98]"
                    title="Copy calculation summary to clipboard"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Share2 className="w-4 h-4 text-emerald-700" />}
                    <span>{copied ? 'Copied!' : 'Share Result'}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Local Storage History (Last 5 Calculations) */}
      <div className="border-t border-slate-200 bg-slate-50/80 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-base text-slate-900">Rebate Calculation History</h4>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {history.length}/5 Saved
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Saved in browser storage. Click Restore to reload past income & investment values.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveSnapshot}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-2xs"
            >
              <Save className="w-3.5 h-3.5" />
              Save Current
            </button>
            {history.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
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
            <div className="text-sm font-bold text-slate-700">No saved rebate calculations yet</div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Click &quot;Save Snapshot&quot; to keep up to 5 rebate scenarios for easy comparison.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {history.map((item, index) => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
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
                      <span className="text-slate-500">Taxable Income:</span>
                      <span className="font-bold text-slate-900">৳{item.taxableIncome.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Eligible Investment:</span>
                      <span className="font-medium text-slate-800">৳{item.eligibleInvestment.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Governing Limit:</span>
                      <span className="font-semibold text-emerald-700 truncate max-w-[150px]">
                        {item.limitingTitle.split('(')[0]}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                      <span className="text-slate-600 font-medium">Allowable Credit:</span>
                      <span className="text-sm font-black text-emerald-700">
                        ৳{item.allowableRebate.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleRestore(item)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors"
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

export default InvestmentBasedTaxRebateCalculator;
