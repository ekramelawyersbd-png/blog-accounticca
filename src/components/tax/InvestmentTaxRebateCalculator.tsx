import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  TrendingUp, 
  ArrowRight, 
  Sparkles, 
  RotateCcw,
  ShieldCheck,
  FileCheck
} from 'lucide-react';

interface InvestmentBreakdown {
  lifeInsurance: number;
  dps: number;
  govSecurities: number;
  mutualFunds: number;
  shares: number;
  providentFund: number;
  universalPension: number;
  approvedDonations: number;
}

export function InvestmentTaxRebateCalculator({ className = '' }: { className?: string }) {
  const [qualifyingIncome, setQualifyingIncome] = useState<number>(1500000);
  const [taxpayerCategory, setTaxpayerCategory] = useState<'general' | 'female_senior' | 'disabled' | 'freedom_fighter'>('general');
  const [isNewTaxpayer, setIsNewTaxpayer] = useState<boolean>(false);

  const [investments, setInvestments] = useState<InvestmentBreakdown>({
    lifeInsurance: 60000,
    dps: 180000,
    govSecurities: 300000,
    mutualFunds: 200000,
    shares: 0,
    providentFund: 0,
    universalPension: 0,
    approvedDonations: 0,
  });

  // Statutory DPS Ceiling for AY 2026-2027
  const DPS_STATUTORY_LIMIT = 120000;
  const STATUTORY_MAX_REBATE = 750000;

  // Compute eligible investment
  const eligibleDps = Math.min(investments.dps, DPS_STATUTORY_LIMIT);
  const totalActualInvested = Object.values(investments).reduce((sum, val) => sum + (Number(val) || 0), 0);
  
  const totalEligibleInvestment = 
    (Number(investments.lifeInsurance) || 0) +
    eligibleDps +
    (Number(investments.govSecurities) || 0) +
    (Number(investments.mutualFunds) || 0) +
    (Number(investments.shares) || 0) +
    (Number(investments.providentFund) || 0) +
    (Number(investments.universalPension) || 0) +
    (Number(investments.approvedDonations) || 0);

  // Three-Limit Formula (Section 78 & Sixth Schedule Part 3)
  const limit1_incomeBased = Math.round(qualifyingIncome * 0.03);
  const limit2_investmentBased = Math.round(totalEligibleInvestment * 0.10);
  const limit3_statutoryMax = STATUTORY_MAX_REBATE;

  const allowableRebate = Math.min(limit1_incomeBased, limit2_investmentBased, limit3_statutoryMax);

  // Governing limit identifier
  const governingLimit = useMemo(() => {
    if (allowableRebate === limit1_incomeBased && allowableRebate === limit2_investmentBased) {
      return 'both';
    }
    if (allowableRebate === limit1_incomeBased) return 'income';
    if (allowableRebate === limit2_investmentBased) return 'investment';
    return 'max';
  }, [allowableRebate, limit1_incomeBased, limit2_investmentBased]);

  // Investment required to maximize 3% income rebate
  const optimalInvestmentNeeded = Math.round(limit1_incomeBased / 0.10);

  // Calculate gross tax based on AY 2026-2027 tax slabs
  const calculateGrossTax = (income: number) => {
    let taxFreeThreshold = 400000; // General threshold for AY 2026-2027
    if (taxpayerCategory === 'female_senior') taxFreeThreshold = 450000;
    if (taxpayerCategory === 'disabled') taxFreeThreshold = 500000;
    if (taxpayerCategory === 'freedom_fighter') taxFreeThreshold = 525000;

    if (income <= taxFreeThreshold) return 0;

    let taxable = income - taxFreeThreshold;
    let tax = 0;

    // Slab 1: Next 3,00,000 @ 10%
    const slab1 = Math.min(taxable, 300000);
    tax += slab1 * 0.10;
    taxable -= slab1;

    // Slab 2: Next 4,00,000 @ 15%
    if (taxable > 0) {
      const slab2 = Math.min(taxable, 400000);
      tax += slab2 * 0.15;
      taxable -= slab2;
    }

    // Slab 3: Next 5,00,000 @ 20%
    if (taxable > 0) {
      const slab3 = Math.min(taxable, 500000);
      tax += slab3 * 0.20;
      taxable -= slab3;
    }

    // Slab 4: Next 20,00,000 @ 25%
    if (taxable > 0) {
      const slab4 = Math.min(taxable, 2000000);
      tax += slab4 * 0.25;
      taxable -= slab4;
    }

    // Slab 5: Remaining @ 30%
    if (taxable > 0) {
      tax += taxable * 0.30;
    }

    return Math.round(tax);
  };

  const grossTax = calculateGrossTax(qualifyingIncome);
  const taxAfterRebateRaw = Math.max(0, grossTax - allowableRebate);
  
  // Minimum tax rule for AY 2026-2027
  const minTaxApplicable = isNewTaxpayer ? 1000 : 5000;
  const netTaxPayable = grossTax > 0 ? Math.max(taxAfterRebateRaw, minTaxApplicable) : 0;

  // Handler for setting Tanvir's example
  const loadTanvirExample = () => {
    setQualifyingIncome(1500000);
    setTaxpayerCategory('general');
    setIsNewTaxpayer(false);
    setInvestments({
      lifeInsurance: 60000,
      dps: 180000,
      govSecurities: 300000,
      mutualFunds: 200000,
      shares: 0,
      providentFund: 0,
      universalPension: 0,
      approvedDonations: 0,
    });
  };

  const resetAll = () => {
    setQualifyingIncome(1000000);
    setTaxpayerCategory('general');
    setIsNewTaxpayer(false);
    setInvestments({
      lifeInsurance: 0,
      dps: 0,
      govSecurities: 0,
      mutualFunds: 0,
      shares: 0,
      providentFund: 0,
      universalPension: 0,
      approvedDonations: 0,
    });
  };

  return (
    <div id="interactive-tax-rebate-calculator" className={`bg-white rounded-3xl border border-emerald-200/90 shadow-lg overflow-hidden ${className}`}>
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 p-6 md:p-8 text-white relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/60 border border-emerald-500/50 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>AY 2026–2027 Interactive Tool</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Investment Tax Rebate Calculator
            </h3>
            <p className="text-emerald-100/90 text-sm mt-1 max-w-xl">
              Calculate your allowable tax rebate under Section 78 &amp; Sixth Schedule using the amended <strong>3% — 10% — Tk. 7,50,000</strong> rule.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={loadTanvirExample}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-emerald-900 hover:bg-emerald-50 transition-colors shadow-sm cursor-pointer"
            >
              <FileCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Load Mr. Tanvir's Example</span>
            </button>
            <button
              type="button"
              onClick={resetAll}
              title="Reset fields"
              className="p-2 rounded-xl text-xs font-bold bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Inputs Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Income & Taxpayer Category Section */}
          <div className="p-5 bg-slate-50/90 rounded-2xl border border-slate-200">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>1. Qualifying Total Income (Section 78)</span>
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Qualifying Income (Excluding Exempt &amp; Final Tax Income) (Tk.)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">৳</span>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={qualifyingIncome || ''}
                    onChange={(e) => setQualifyingIncome(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    placeholder="1500000"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Excludes tax-exempt income, reduced-rate income, partnership share of profit, and final settlement income.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Taxpayer Category</label>
                  <select
                    value={taxpayerCategory}
                    onChange={(e: any) => setTaxpayerCategory(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="general">General (Tk. 4,00,000 Nil)</option>
                    <option value="female_senior">Female / Senior 65+ (Tk. 4,50,000 Nil)</option>
                    <option value="disabled">Third Gender / Disabled (Tk. 5,00,000 Nil)</option>
                    <option value="freedom_fighter">Gazetted Freedom Fighter (Tk. 5,25,000 Nil)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-4 sm:pt-6">
                  <input
                    type="checkbox"
                    id="new-taxpayer-toggle"
                    checked={isNewTaxpayer}
                    onChange={(e) => setIsNewTaxpayer(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="new-taxpayer-toggle" className="text-xs font-medium text-slate-700 cursor-pointer">
                    First-time return submitter (Tk. 1,000 min tax)
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Eligible Investments Breakdown */}
          <div className="p-5 bg-slate-50/90 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-600" />
                <span>2. Eligible Investments &amp; Expenditures (Sixth Schedule)</span>
              </h4>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                10% Rate Rule
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Life Insurance */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Life Insurance Premium (Tk.)
                </label>
                <input
                  type="number"
                  min="0"
                  value={investments.lifeInsurance || ''}
                  onChange={(e) => setInvestments({ ...investments, lifeInsurance: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="0"
                />
              </div>

              {/* DPS with Statutory Alert */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Deposit Pension Scheme — DPS (Tk.)
                  </label>
                  {investments.dps > DPS_STATUTORY_LIMIT && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                      Capped at Tk. 1.2L
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  min="0"
                  value={investments.dps || ''}
                  onChange={(e) => setInvestments({ ...investments, dps: Number(e.target.value) })}
                  className={`w-full px-3 py-2 bg-white border rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none ${
                    investments.dps > DPS_STATUTORY_LIMIT ? 'border-amber-400 bg-amber-50/30' : 'border-slate-300'
                  }`}
                  placeholder="0"
                />
                {investments.dps > DPS_STATUTORY_LIMIT && (
                  <p className="text-[10px] text-amber-700 mt-1">
                    Actual: Tk. {investments.dps.toLocaleString()} &rarr; Statutory eligible: Tk. 1,20,000
                  </p>
                )}
              </div>

              {/* Govt Securities */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Government Securities / Savings (Tk.)
                </label>
                <input
                  type="number"
                  min="0"
                  value={investments.govSecurities || ''}
                  onChange={(e) => setInvestments({ ...investments, govSecurities: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="0"
                />
              </div>

              {/* Mutual Funds & ETFs */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mutual Funds / Unit Certificates / ETFs (Tk.)
                </label>
                <input
                  type="number"
                  min="0"
                  value={investments.mutualFunds || ''}
                  onChange={(e) => setInvestments({ ...investments, mutualFunds: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="0"
                />
              </div>

              {/* Listed Shares */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Listed Shares, Securities &amp; Debentures (Tk.)
                </label>
                <input
                  type="number"
                  min="0"
                  value={investments.shares || ''}
                  onChange={(e) => setInvestments({ ...investments, shares: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="0"
                />
              </div>

              {/* Provident Fund */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Provident Fund (GPF / Recognized RPF) (Tk.)
                </label>
                <input
                  type="number"
                  min="0"
                  value={investments.providentFund || ''}
                  onChange={(e) => setInvestments({ ...investments, providentFund: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="0"
                />
              </div>

              {/* Universal Pension Scheme */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Universal Pension Scheme — UPS (Tk.)
                </label>
                <input
                  type="number"
                  min="0"
                  value={investments.universalPension || ''}
                  onChange={(e) => setInvestments({ ...investments, universalPension: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="0"
                />
              </div>

              {/* Approved Donations & Zakat Fund */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Approved Donations &amp; Zakat Fund (S.R.O. 213) (Tk.)
                </label>
                <input
                  type="number"
                  min="0"
                  value={investments.approvedDonations || ''}
                  onChange={(e) => setInvestments({ ...investments, approvedDonations: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="0"
                />
              </div>

            </div>

            {/* Total Eligible Summary Bar */}
            <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs gap-2">
              <span className="text-slate-600">
                Total Actual Outlay: <strong className="text-slate-900">৳{totalActualInvested.toLocaleString()}</strong>
              </span>
              <span className="text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Statutory Eligible Investment: ৳{totalEligibleInvestment.toLocaleString()}
              </span>
            </div>
          </div>

        </div>

        {/* Right Results Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Three Limits Calculation Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-4">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Three-Limit Formula (AY 2026–2027)</span>
            </h4>

            <div className="space-y-3.5">
              
              {/* Limit 1 */}
              <div className={`p-3.5 rounded-xl border transition-all ${
                governingLimit === 'income' || governingLimit === 'both'
                  ? 'bg-emerald-950/70 border-emerald-500 ring-1 ring-emerald-500/50' 
                  : 'bg-slate-800/60 border-slate-700'
              }`}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Limit 1: 3% of Qualifying Income</span>
                  {(governingLimit === 'income' || governingLimit === 'both') && (
                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-900/80 px-2 py-0.5 rounded uppercase">
                      Lowest Limit
                    </span>
                  )}
                </div>
                <div className="text-lg font-black text-white">
                  ৳{limit1_incomeBased.toLocaleString()}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  3% × ৳{qualifyingIncome.toLocaleString()}
                </p>
              </div>

              {/* Limit 2 */}
              <div className={`p-3.5 rounded-xl border transition-all ${
                governingLimit === 'investment'
                  ? 'bg-emerald-950/70 border-emerald-500 ring-1 ring-emerald-500/50' 
                  : 'bg-slate-800/60 border-slate-700'
              }`}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Limit 2: 10% of Eligible Investment</span>
                  {governingLimit === 'investment' && (
                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-900/80 px-2 py-0.5 rounded uppercase">
                      Lowest Limit
                    </span>
                  )}
                </div>
                <div className="text-lg font-black text-white">
                  ৳{limit2_investmentBased.toLocaleString()}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  10% × ৳{totalEligibleInvestment.toLocaleString()} (Amended from 15%)
                </p>
              </div>

              {/* Limit 3 */}
              <div className={`p-3.5 rounded-xl border transition-all ${
                governingLimit === 'max'
                  ? 'bg-emerald-950/70 border-emerald-500 ring-1 ring-emerald-500/50' 
                  : 'bg-slate-800/60 border-slate-700'
              }`}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Limit 3: Statutory Maximum Ceiling</span>
                  {governingLimit === 'max' && (
                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-900/80 px-2 py-0.5 rounded uppercase">
                      Lowest Limit
                    </span>
                  )}
                </div>
                <div className="text-lg font-black text-white">
                  ৳{limit3_statutoryMax.toLocaleString()}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Maximum statutory rebate (Reduced from Tk. 10 Lakh)
                </p>
              </div>

            </div>

            {/* Allowable Rebate Highlight Box */}
            <div className="mt-5 pt-4 border-t border-slate-800 bg-gradient-to-r from-emerald-900/90 to-teal-900/90 p-4 rounded-xl border border-emerald-500/40">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 block mb-1">
                Allowable Investment Tax Rebate
              </span>
              <div className="text-3xl font-black text-white flex items-baseline gap-1">
                <span>৳{allowableRebate.toLocaleString()}</span>
                <span className="text-xs font-normal text-emerald-200">deduction from tax</span>
              </div>
              <p className="text-xs text-emerald-200 mt-1.5 leading-relaxed">
                Whichever is lower of the 3 limits under Section 78.
              </p>
            </div>
          </div>

          {/* Tax Payable Breakdown Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <span>Effect on Net Tax Payable (AY 2026–2027)</span>
            </h4>

            <div className="flex justify-between text-xs text-slate-600">
              <span>Gross Tax Liability (before rebate):</span>
              <span className="font-bold text-slate-900">৳{grossTax.toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-xs text-emerald-700 font-medium">
              <span>Less: Investment Tax Rebate:</span>
              <span className="font-bold">- ৳{allowableRebate.toLocaleString()}</span>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Net Tax Payable:</span>
                <span className="text-[10px] text-slate-400">Before advance tax, TDS &amp; surcharge</span>
              </div>
              <span className="text-xl font-black text-emerald-800">
                ৳{netTaxPayable.toLocaleString()}
              </span>
            </div>

            {grossTax > 0 && netTaxPayable === minTaxApplicable && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Statutory minimum tax of ৳{minTaxApplicable.toLocaleString()} applies.</span>
              </div>
            )}
          </div>

          {/* Tax Planning Optimization Insight */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Tax Planning Tip (AY 2026–2027)</span>
            </div>
            <p className="leading-relaxed text-slate-700 text-xs">
              Based on your qualifying income of <strong>৳{qualifyingIncome.toLocaleString()}</strong>, your 3% rebate ceiling is <strong>৳{limit1_incomeBased.toLocaleString()}</strong>.
            </p>
            <p className="leading-relaxed text-slate-700 text-xs">
              Under the new 10% rule, you need an eligible investment of <strong>৳{optimalInvestmentNeeded.toLocaleString()}</strong> to maximize this ceiling. Any investment beyond that does not generate additional rebate.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
