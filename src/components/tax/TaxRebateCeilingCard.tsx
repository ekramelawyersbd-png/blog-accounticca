import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  CheckCircle2, 
  AlertCircle, 
  Scale, 
  TrendingDown, 
  Sparkles, 
  ShieldCheck, 
  Copy, 
  Check, 
  RotateCcw,
  Info,
  DollarSign,
  ArrowRight
} from 'lucide-react';

interface TaxRebateCeilingCardProps {
  className?: string;
  initialIncome?: number;
  initialInvestment?: number;
}

export function TaxRebateCeilingCard({
  className = '',
  initialIncome = 2000000,
  initialInvestment = 800000
}: TaxRebateCeilingCardProps) {
  const [taxableIncome, setTaxableIncome] = useState<number>(initialIncome);
  const [eligibleInvestment, setEligibleInvestment] = useState<number>(initialInvestment);
  const [copied, setCopied] = useState<boolean>(false);

  // Government Maximum Ceiling for AY 2026-2027
  const GOVT_MAX_CEILING = 750000;

  // Three Limits Computation
  // 1. Income-based limit: 3% of total taxable income
  // 2. Investment-based limit: 10% of eligible investment amount
  // 3. Government ceiling: Tk. 7,50,000 (Tk. 7.5 Lakh)
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
    let limitingReason = 'The rebate is capped at 3% of total taxable income.';

    if (allowableRebate === limit1_income && (allowableRebate < limit2_investment || allowableRebate < limit3_ceiling)) {
      limitingFactor = 'income';
      limitingTitle = 'Income-Based Limit (3%)';
      limitingReason = 'Your eligible investment exceeds what your taxable income allows to be rebated (capped at 3% of income).';
    } else if (allowableRebate === limit2_investment && (allowableRebate < limit1_income || allowableRebate < limit3_ceiling)) {
      limitingFactor = 'investment';
      limitingTitle = 'Investment-Based Limit (10%)';
      limitingReason = 'Your rebate is determined directly by 10% of your eligible investment contributions.';
    } else {
      limitingFactor = 'ceiling';
      limitingTitle = 'Government Maximum Ceiling (Tk. 7.5 Lakh)';
      limitingReason = 'You have hit the absolute maximum statutory rebate cap permitted under Bangladesh Finance Act 2026.';
    }

    // Previous Proposal Comparison (15% rate, Tk. 10 Lakh cap)
    const prevRateTax = investment * 0.15;
    const prevAllowable = Math.min(income * 0.03, prevRateTax, 1000000);
    const difference = prevAllowable - allowableRebate;

    return {
      income,
      investment,
      limit1_income,
      limit2_investment,
      limit3_ceiling,
      allowableRebate,
      limitingFactor,
      limitingTitle,
      limitingReason,
      prevAllowable,
      difference
    };
  }, [taxableIncome, eligibleInvestment]);

  const loadExample = (exNumber: 1 | 2 | 3) => {
    if (exNumber === 1) {
      // Example 1: Moderate Income (Income 20L, Inv 8L -> Rebate Tk. 60,000)
      setTaxableIncome(2000000);
      setEligibleInvestment(800000);
    } else if (exNumber === 2) {
      // Example 2: Higher Income (Income 1 Cr, Inv 50L -> Rebate Tk. 3,00,000)
      setTaxableIncome(10000000);
      setEligibleInvestment(5000000);
    } else if (exNumber === 3) {
      // Example 3: Large Investment (Income 5 Cr, Inv 1 Cr -> Rebate Tk. 7,50,000)
      setTaxableIncome(50000000);
      setEligibleInvestment(10000000);
    }
  };

  const copySummary = () => {
    const text = `
=== Bangladesh Finance Act 2026 Tax Rebate Calculation ===
Total Taxable Income: BDT ${calculation.income.toLocaleString('en-IN')}
Total Eligible Investment: BDT ${calculation.investment.toLocaleString('en-IN')}
--------------------------------------------------
Three-Limit Evaluation:
1. 3% of Taxable Income: BDT ${calculation.limit1_income.toLocaleString('en-IN')}
2. 10% of Eligible Investment: BDT ${calculation.limit2_investment.toLocaleString('en-IN')}
3. Maximum Government Ceiling: BDT ${calculation.limit3_ceiling.toLocaleString('en-IN')} (Tk. 7.5 Lakh)
--------------------------------------------------
Final Allowable Tax Rebate (Lowest of 3): BDT ${calculation.allowableRebate.toLocaleString('en-IN')}
Constraining Ceiling: ${calculation.limitingTitle}
Statutory Basis: Bangladesh Finance Act 2026 & Income Tax Act, 2023 (Section 78)
Accounticca × E-Lawyers Direct Tax Practice
`.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`bg-white rounded-3xl border border-emerald-200 shadow-xl overflow-hidden ${className}`}>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 sm:p-7 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-400/30 text-emerald-300">
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
                Tax Rebate Ceiling & Three-Limit Calculator
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Statutory formula: Lowest of 3% taxable income, 10% eligible investment, or Tk. 7.5 Lakh
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={copySummary}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-900 bg-emerald-300 hover:bg-emerald-200 transition-colors shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Breakdown'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        
        {/* Preset Case Study Buttons */}
        <div>
          <div className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Load Official Case Studies:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => loadExample(1)}
              className="p-3 bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition-all group"
            >
              <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                Example 1: Moderate Income
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Income: ৳20L | Investment: ৳8L
              </div>
              <div className="text-[11px] font-extrabold text-emerald-700 mt-1">
                Rebate: ৳60,000 (Income capped)
              </div>
            </button>

            <button
              type="button"
              onClick={() => loadExample(2)}
              className="p-3 bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition-all group"
            >
              <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                Example 2: Higher Income
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Income: ৳1 Cr | Investment: ৳50L
              </div>
              <div className="text-[11px] font-extrabold text-emerald-700 mt-1">
                Rebate: ৳3,00,000 (Income capped)
              </div>
            </button>

            <button
              type="button"
              onClick={() => loadExample(3)}
              className="p-3 bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition-all group"
            >
              <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                Example 3: Max Ceiling Applied
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Income: ৳5 Cr | Investment: ৳1 Cr
              </div>
              <div className="text-[11px] font-extrabold text-purple-700 mt-1">
                Rebate: ৳7,50,000 (Govt Ceiling)
              </div>
            </button>
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Total Taxable Income (BDT)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
              <input
                type="number"
                min="0"
                step="50000"
                value={taxableIncome || ''}
                onChange={(e) => setTaxableIncome(Math.max(0, Number(e.target.value)))}
                className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. 2000000"
              />
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Qualifying taxable income before investment rebate.
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Eligible Investment Amount (BDT)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
              <input
                type="number"
                min="0"
                step="25000"
                value={eligibleInvestment || ''}
                onChange={(e) => setEligibleInvestment(Math.max(0, Number(e.target.value)))}
                className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. 800000"
              />
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Approved investments (DPS, insurance, bonds, provident funds).
            </div>
          </div>
        </div>

        {/* The Three Limits Evaluation Grid */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
            <span>Evaluation of the Three Statutory Limits</span>
            <span className="text-emerald-700 font-bold">Allowable = Lowest Amount</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Limit 1: Income-based */}
            <div className={`p-4 rounded-2xl border transition-all ${
              calculation.limitingFactor === 'income'
                ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300 shadow-sm'
                : 'bg-white border-slate-200 opacity-90'
            }`}>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Limit 1</span>
                {calculation.limitingFactor === 'income' && (
                  <span className="text-[10px] font-extrabold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                    LOWEST (ACTIVE)
                  </span>
                )}
              </div>
              <div className="text-xs font-bold text-slate-700">3% of Taxable Income</div>
              <div className="text-xl font-black text-slate-900 mt-1">
                ৳{calculation.limit1_income.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                ৳{calculation.income.toLocaleString('en-IN')} &times; 3%
              </div>
            </div>

            {/* Limit 2: Investment-based */}
            <div className={`p-4 rounded-2xl border transition-all ${
              calculation.limitingFactor === 'investment'
                ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300 shadow-sm'
                : 'bg-white border-slate-200 opacity-90'
            }`}>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Limit 2</span>
                {calculation.limitingFactor === 'investment' && (
                  <span className="text-[10px] font-extrabold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                    LOWEST (ACTIVE)
                  </span>
                )}
              </div>
              <div className="text-xs font-bold text-slate-700">10% of Investment</div>
              <div className="text-xl font-black text-slate-900 mt-1">
                ৳{calculation.limit2_investment.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                ৳{calculation.investment.toLocaleString('en-IN')} &times; 10%
              </div>
            </div>

            {/* Limit 3: Govt Ceiling */}
            <div className={`p-4 rounded-2xl border transition-all ${
              calculation.limitingFactor === 'ceiling'
                ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-300 shadow-sm'
                : 'bg-white border-slate-200 opacity-90'
            }`}>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Limit 3</span>
                {calculation.limitingFactor === 'ceiling' && (
                  <span className="text-[10px] font-extrabold bg-purple-600 text-white px-2 py-0.5 rounded-full">
                    LOWEST (ACTIVE)
                  </span>
                )}
              </div>
              <div className="text-xs font-bold text-slate-700">Government Ceiling</div>
              <div className="text-xl font-black text-slate-900 mt-1">
                ৳{calculation.limit3_ceiling.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Statutory Max Cap (Tk. 7.5 Lakh)
              </div>
            </div>
          </div>
        </div>

        {/* Final Allowable Rebate Highlight Card */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase font-bold text-emerald-300 tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Final Allowable Investment Tax Credit</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-white mt-1">
              ৳{calculation.allowableRebate.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-emerald-200 mt-1">
              Determined by <strong>{calculation.limitingTitle}</strong> (Lowest among the three limits)
            </div>
          </div>

          <div className="sm:text-right shrink-0 bg-white/10 p-3.5 rounded-xl border border-white/10">
            <div className="text-[11px] text-slate-300 font-medium">Applied Statutory Ceiling:</div>
            <div className="text-sm font-extrabold text-white mt-0.5">
              {calculation.limitingTitle}
            </div>
            <div className="text-[11px] text-emerald-300 mt-0.5">
              Deducted directly from payable tax
            </div>
          </div>
        </div>

        {/* Comparison: Previous Proposal vs FY 2026-27 Revised Rule */}
        <div className="pt-2">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
            Key Rule Changes (Previous Proposal vs FY 2026-27 Revised Rule)
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3.5">Category</th>
                  <th className="py-2.5 px-3.5">Previous Proposal</th>
                  <th className="py-2.5 px-3.5">FY 2026-27 Revised Rule</th>
                  <th className="py-2.5 px-3.5 text-right">Tax Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                <tr>
                  <td className="py-2.5 px-3.5 font-bold text-slate-900">Investment-based rebate rate</td>
                  <td className="py-2.5 px-3.5 text-slate-500 line-through">15% of investment</td>
                  <td className="py-2.5 px-3.5 font-bold text-emerald-700">10% of investment</td>
                  <td className="py-2.5 px-3.5 text-right font-medium text-amber-700">Requires higher investment</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3.5 font-bold text-slate-900">Maximum rebate ceiling</td>
                  <td className="py-2.5 px-3.5 text-slate-500 line-through">Tk. 10 Lakh</td>
                  <td className="py-2.5 px-3.5 font-bold text-emerald-700">Tk. 7.5 Lakh (Tk. 7,50,000)</td>
                  <td className="py-2.5 px-3.5 text-right font-medium text-rose-700">Tk. 2.5 Lakh reduction in cap</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

export default TaxRebateCeilingCard;
