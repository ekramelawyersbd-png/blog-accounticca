import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
import { Calculator, Info, DollarSign, Lightbulb, TrendingDown, ArrowRight, Building2, CheckCircle2, ExternalLink, ShieldCheck, AlertTriangle, BarChart3, ArrowRightLeft } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ServiceSEO } from '../components/SEO';
import { CorporateTaxRateCalculator } from '../components/tax/CorporateTaxRateCalculator';

type CompanyCategory = 
  | 'public_10' 
  | 'public_other' 
  | 'non_public' 
  | 'bank_listed' 
  | 'bank_non_listed' 
  | 'tobacco' 
  | 'mobile';

const TAX_RATES: Record<CompanyCategory, { label: string, standard: number, reduced: number, condition?: string }> = {
  public_10: { 
    label: 'Publicly Traded (IPO > 10% of Capital)', 
    standard: 0.225, 
    reduced: 0.20, 
    condition: 'if all transactions and income are conducted through formal banking channels (avoids 2.5% penalty)' 
  },
  public_other: { 
    label: 'Other Publicly Traded (IPO ≤ 10% of Capital)', 
    standard: 0.275, 
    reduced: 0.25, 
    condition: 'if all transactions and income are conducted through formal banking channels (avoids 2.5% penalty)' 
  },
  non_public: { 
    label: 'Non-Listed Company (Private Ltd / OPC)', 
    standard: 0.30, 
    reduced: 0.275,
    condition: 'if all transactions and income are conducted through formal banking channels (avoids 2.5% penalty)' 
  },
  bank_listed: { 
    label: 'Banks, Insurance & Financial (Listed)', 
    standard: 0.375, 
    reduced: 0.375 
  },
  bank_non_listed: { 
    label: 'Banks, Insurance & Financial (Non-listed)', 
    standard: 0.40, 
    reduced: 0.40 
  },
  tobacco: { 
    label: 'Tobacco Manufacturers', 
    standard: 0.45, 
    reduced: 0.45 
  },
  mobile: { 
    label: 'Mobile Phone Operators', 
    standard: 0.45, 
    reduced: 0.40,
    condition: 'if specific stock exchange listing conditions are fulfilled'
  },
};

export function CorporateTaxPlanner() {
  const [category, setCategory] = useState<CompanyCategory>('non_public');
  const [revenue, setRevenue] = useState<string>('');
  const [expenses, setExpenses] = useState<string>('');
  const [plannedCapEx, setPlannedCapEx] = useState<string>('');
  const [meetsConditions, setMeetsConditions] = useState<boolean>(true);
  const [plansEarlyFiling, setPlansEarlyFiling] = useState<boolean>(true);
  const [corpScenarioAKey, setCorpScenarioAKey] = useState<string>('unoptimized_private');
  const [corpScenarioBKey, setCorpScenarioBKey] = useState<string>('compliant_private_capex');

  const analysis = useMemo(() => {
    const rev = parseFloat(revenue) || 0;
    const exp = parseFloat(expenses) || 0;
    const capex = parseFloat(plannedCapEx) || 0;

    // Simplified assumption: 10% depreciation on new CapEx for the year if executed before year-end
    const estimatedDepreciation = capex * 0.10;
    const operatingProfit = Math.max(0, rev - exp);
    const taxableIncome = Math.max(0, operatingProfit - estimatedDepreciation);

    const rateInfo = TAX_RATES[category];
    const applicableRate = meetsConditions ? rateInfo.reduced : rateInfo.standard;
    
    let baseTax = taxableIncome * applicableRate;
    
    // Early filing incentive: 5% of payable tax, up to 25,000
    let earlyFilingRebate = 0;
    if (plansEarlyFiling && baseTax > 0) {
      earlyFilingRebate = Math.min(baseTax * 0.05, 25000);
    }
    
    const finalTax = Math.max(0, baseTax - earlyFilingRebate);

    // Alternative scenario: No CapEx, standard rate, no early filing
    const altTaxable = operatingProfit;
    const altBaseTax = altTaxable * rateInfo.standard;
    const potentialSavings = altBaseTax - finalTax;

    const strategies = [];

    if (rateInfo.standard > rateInfo.reduced) {
      strategies.push({
        id: 'conditions',
        title: 'Meet Reduced Rate Conditions',
        description: `Ensure you meet the requirement: ${rateInfo.condition}. This drops your rate from ${(rateInfo.standard * 100).toFixed(1)}% to ${(rateInfo.reduced * 100).toFixed(1)}%.`,
        impact: taxableIncome * (rateInfo.standard - rateInfo.reduced)
      });
    }

    if (capex > 0) {
      strategies.push({
        id: 'capex',
        title: 'Accelerate Capital Expenditure',
        description: 'Execute your planned CapEx before the income year ends. This allows you to claim depreciation allowances (estimated at 10%) for the current assessment year, lowering taxable income.',
        impact: estimatedDepreciation * applicableRate
      });
    }

    if (baseTax > 0) {
      strategies.push({
        id: 'early_filing',
        title: 'Early Filing Incentive',
        description: 'File your corporate tax return within 6 months from the end of your income year to receive a 5% tax incentive on payable tax (up to Tk 25,000).',
        impact: Math.min(baseTax * 0.05, 25000)
      });
    }

    // Sort strategies by highest impact
    strategies.sort((a, b) => b.impact - a.impact);

    return {
      operatingProfit,
      taxableIncome,
      baseTax,
      finalTax,
      potentialSavings,
      strategies,
      applicableRate
    };
  }, [category, revenue, expenses, plannedCapEx, meetsConditions, plansEarlyFiling]);

  const corporatePresets = useMemo(() => {
    const baseOperatingProfit = analysis.operatingProfit > 0 ? analysis.operatingProfit : 10000000; // Default 1 Crore BDT if empty
    const capexDep = (parseFloat(plannedCapEx) || 2000000) * 0.10;

    return {
      active_input: {
        label: `Current Planner Input (${TAX_RATES[category].label})`,
        taxableIncome: analysis.operatingProfit > 0 ? analysis.taxableIncome : baseOperatingProfit,
        grossTax: analysis.operatingProfit > 0 ? Math.round(analysis.operatingProfit * TAX_RATES[category].standard) : Math.round(baseOperatingProfit * TAX_RATES[category].standard),
        taxSavings: analysis.operatingProfit > 0 ? Math.round(analysis.potentialSavings) : Math.round(baseOperatingProfit * (TAX_RATES[category].standard - analysis.applicableRate)),
        finalTax: analysis.operatingProfit > 0 ? Math.round(analysis.finalTax) : Math.round(baseOperatingProfit * analysis.applicableRate)
      },
      unoptimized_private: {
        label: 'Private Ltd — Unoptimized Cash Non-Compliant (30.0%)',
        taxableIncome: baseOperatingProfit,
        grossTax: Math.round(baseOperatingProfit * 0.30),
        taxSavings: 0,
        finalTax: Math.round(baseOperatingProfit * 0.30)
      },
      compliant_private_capex: {
        label: 'Private Ltd — Banking Compliant + CapEx + Early Filing (27.5%)',
        taxableIncome: Math.max(0, baseOperatingProfit - capexDep),
        grossTax: Math.round(baseOperatingProfit * 0.30),
        taxSavings: Math.round(baseOperatingProfit * 0.30 - Math.max(0, Math.max(0, baseOperatingProfit - capexDep) * 0.275 - 25000)),
        finalTax: Math.round(Math.max(0, Math.max(0, baseOperatingProfit - capexDep) * 0.275 - 25000))
      },
      listed_ipo_10: {
        label: 'Publicly Traded (>10% IPO) — Banking Compliant (20.0%)',
        taxableIncome: Math.max(0, baseOperatingProfit - capexDep),
        grossTax: Math.round(baseOperatingProfit * 0.225),
        taxSavings: Math.round(baseOperatingProfit * 0.225 - Math.max(0, Math.max(0, baseOperatingProfit - capexDep) * 0.20 - 25000)),
        finalTax: Math.round(Math.max(0, Math.max(0, baseOperatingProfit - capexDep) * 0.20 - 25000))
      },
      listed_ipo_other: {
        label: 'Publicly Traded (≤10% IPO) — Banking Compliant (25.0%)',
        taxableIncome: Math.max(0, baseOperatingProfit - capexDep),
        grossTax: Math.round(baseOperatingProfit * 0.275),
        taxSavings: Math.round(baseOperatingProfit * 0.275 - Math.max(0, Math.max(0, baseOperatingProfit - capexDep) * 0.25 - 25000)),
        finalTax: Math.round(Math.max(0, Math.max(0, baseOperatingProfit - capexDep) * 0.25 - 25000))
      }
    } as Record<string, { label: string; taxableIncome: number; grossTax: number; taxSavings: number; finalTax: number }>;
  }, [analysis, category, plannedCapEx]);

  const corpA = corporatePresets[corpScenarioAKey] || corporatePresets.unoptimized_private;
  const corpB = corporatePresets[corpScenarioBKey] || corporatePresets.compliant_private_capex;

  const corpChartData = [
    {
      metric: 'Taxable Profit',
      scenarioA: corpA.taxableIncome,
      scenarioB: corpB.taxableIncome
    },
    {
      metric: 'Standard Unoptimized Tax',
      scenarioA: corpA.grossTax,
      scenarioB: corpB.grossTax
    },
    {
      metric: 'Compliance & CapEx Savings',
      scenarioA: corpA.taxSavings,
      scenarioB: corpB.taxSavings
    },
    {
      metric: 'Final Corporate Tax',
      scenarioA: corpA.finalTax,
      scenarioB: corpB.finalTax
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <ServiceSEO
        title="Corporate Tax Planner 2026-27 | Assessment Year Strategy | Compliance Hub"
        description="Analyze financial projections and implement strategic deductions to optimize corporate income tax liability for listed and private companies in Bangladesh."
        serviceType="Corporate Tax Optimization & Financial Planning"
        canonicalUrl="/corporate-planner"
        keywords={['Corporate Tax Planning Bangladesh', 'Income Tax Act 2023 Corporate Rates', 'Listed Company Tax Slabs', 'Cashless Transaction Tax Benefits']}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Tools Hub', url: '/tools' },
          { name: 'Corporate Tax Planner', url: '/corporate-planner' }
        ]}
      />
      <Breadcrumbs items={[{ label: 'Tools' }, { label: 'Corporate Tax Planner 2026' }]} />
      
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-700">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Corporate Tax Planner & Slabs 2026-27</h1>
        </div>
        <p className="text-slate-600 text-lg max-w-3xl">
          Analyze corporate tax slabs (20%, 25%, 27.5%), test banking channel compliance (+2.5% penalty), and project long-term capital market listing savings for the Assessment Year 2026–27.
        </p>
      </div>

      {/* Interactive Slabs & Capital Market Comparison Calculator */}
      <div className="w-full mb-12">
        <CorporateTaxRateCalculator />
      </div>

      {/* Mobile Compact Result Summary Bar (<1024px) */}
      <div className="lg:hidden mb-6 rounded-2xl bg-slate-900 border border-slate-800 p-4 text-white shadow-md flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
            <span>Corporate Tax Assessment</span>
            <span>&middot;</span>
            <span className="text-slate-300">AY 2026–27 (FA 2026)</span>
          </div>
          <div className="text-2xl font-black font-mono tabular-nums text-white mt-0.5">
            {parseFloat(revenue || '0') > 0
              ? `৳ ${Math.round(analysis.finalTax).toLocaleString()}`
              : '৳ —'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Applicable Rate: {(analysis.applicableRate * 100).toFixed(1)}% &middot; Sec 163 Minimum Tax
          </div>
        </div>
        <a
          href="#corporate-tax-detailed-assessment"
          className="shrink-0 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
        >
          View Breakdown &darr;
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Input Workspace - 58.33% (lg:col-span-7) on desktop */}
        <div className="min-w-0 w-full lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Financial Projections</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Assessment Year 2026–27 &middot; Income Tax Act 2023 &amp; Finance Act 2026
                </p>
              </div>
              <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                58.33% Input Workspace
              </span>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Company Category</label>
                <select 
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value as CompanyCategory);
                    setMeetsConditions(false);
                  }}
                  className="w-full min-w-0 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium appearance-none"
                >
                  {Object.entries(TAX_RATES).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Estimated Annual Revenue (Tk)</label>
                <div className="relative">
                  <DollarSign className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={revenue}
                    onChange={(e) => setRevenue(e.target.value)}
                    placeholder="e.g. 50000000"
                    className="w-full min-w-0 pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Estimated Operating Expenses (Tk)</label>
                <div className="relative">
                  <DollarSign className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={expenses}
                    onChange={(e) => setExpenses(e.target.value)}
                    placeholder="e.g. 35000000"
                    className="w-full min-w-0 pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Planned Capital Expenditure (Tk)</label>
                <div className="relative">
                  <DollarSign className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={plannedCapEx}
                    onChange={(e) => setPlannedCapEx(e.target.value)}
                    placeholder="e.g. 5000000"
                    className="w-full min-w-0 pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">E.g., machinery, equipment, or vehicles planned for purchase.</p>
              </div>

              {TAX_RATES[category].standard > TAX_RATES[category].reduced && (
                <div className="pt-2">
                  <label className="flex items-start gap-3 p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl cursor-pointer">
                    <div className="flex items-center h-5 mt-0.5">
                      <input 
                        type="checkbox" 
                        checked={meetsConditions}
                        onChange={(e) => setMeetsConditions(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-600"
                      />
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-slate-900 mb-1">Meet Reduced Rate Conditions</span>
                      <span className="block text-xs text-slate-600">{TAX_RATES[category].condition}</span>
                    </div>
                  </label>
                </div>
              )}

              <div className="pt-2">
                <label className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:border-emerald-200 transition-colors">
                  <div className="flex items-center h-5 mt-0.5">
                    <input 
                      type="checkbox" 
                      checked={plansEarlyFiling}
                      onChange={(e) => setPlansEarlyFiling(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-900 mb-1">Plan to File Early</span>
                    <span className="block text-xs text-slate-600">Within 6 months from the end of the income year.</span>
                  </div>
                </label>
              </div>

            </div>
          </div>
        </div>

        {/* Assessment & Strategies Section - 41.67% (lg:col-span-5) Sticky on Desktop */}
        <div id="corporate-tax-detailed-assessment" className="min-w-0 w-full lg:col-span-5 lg:sticky lg:top-20 space-y-6 scroll-mt-24">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-sm p-6 md:p-8 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-10">
                <TrendingDown className="w-32 h-32" />
             </div>
             
             <div className="relative z-10">
               <div className="flex items-center justify-between gap-2 mb-6">
                 <h2 className="text-slate-300 font-bold flex items-center gap-2">
                   Projected Tax Liability
                 </h2>
                 <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                   AY 2026–27
                 </span>
               </div>
               
               <div className="mb-8 flex flex-col gap-4 justify-between border-b border-slate-800 pb-6">
                 <div>
                   <div className="text-emerald-400 text-sm font-bold uppercase tracking-widest mb-1">Optimized Tax Payable</div>
                   <div className="text-4xl font-bold font-mono tabular-nums">
                     ৳ {Math.round(analysis.finalTax).toLocaleString()}
                   </div>
                   <div className="text-slate-400 text-sm mt-2 font-medium">Effective Rate: {((analysis.finalTax / (analysis.operatingProfit || 1)) * 100).toFixed(1)}%</div>
                 </div>
                 
                 <div className="bg-emerald-500/20 px-4 py-3 rounded-xl border border-emerald-500/30 flex items-center justify-between">
                   <div className="text-emerald-200 text-xs font-bold uppercase tracking-widest">Total Potential Savings</div>
                   <div className="text-xl font-bold font-mono tabular-nums text-emerald-400">৳ {Math.round(analysis.potentialSavings).toLocaleString()}</div>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4 text-sm">
                 <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                   <div className="text-slate-400 font-medium mb-1">Taxable Income</div>
                   <div className="text-lg font-bold font-mono tabular-nums">৳ {Math.round(analysis.taxableIncome).toLocaleString()}</div>
                 </div>
                 <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                   <div className="text-slate-400 font-medium mb-1">Applicable Rate</div>
                   <div className="text-lg font-bold font-mono tabular-nums">{(analysis.applicableRate * 100).toFixed(1)}%</div>
                 </div>
               </div>
             </div>
          </div>

          {/* Tax Planning Strategies */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-emerald-50/50 flex items-center gap-3">
              <div className="bg-emerald-100 p-2 rounded-xl">
                <Lightbulb className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Tax Planning Strategies</h3>
                <p className="text-sm text-slate-600">Actionable steps to minimize your liability</p>
              </div>
            </div>
            
            <div className="p-0">
              {analysis.strategies.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {analysis.strategies.map((strategy, index) => (
                    <div key={strategy.id} className="p-6 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-2 gap-4">
                        <h4 className="font-bold text-slate-900 flex items-center gap-2">
                          <span className="bg-slate-100 text-slate-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                            {index + 1}
                          </span>
                          {strategy.title}
                        </h4>
                        {strategy.impact > 0 && (
                          <span className="shrink-0 bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-lg">
                            Save Tk {Math.round(strategy.impact).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 ml-8 leading-relaxed">
                        {strategy.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-medium">Enter your financial data to see customized tax planning strategies.</p>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-3">
              <p className="text-xs text-slate-500 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Disclaimer: This planner provides estimates based on standard rules from the Finance Act 2026. Actual tax liability may vary based on non-allowable expenses, detailed depreciation schedules, and other specific adjustments. Always consult a certified tax professional.
                </span>
              </p>
              <div className="pt-2">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-100/60 hover:bg-emerald-100 px-3.5 py-2 rounded-xl transition-colors"
                >
                  <span>Book Consultation with Corporate Tax Specialist</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Corporate Scenario Comparison via Recharts */}
      <div className="mt-12 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-900 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1.5">
              <BarChart3 className="w-4 h-4" />
              <span>Corporate Tax Scenario Comparison (Recharts)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Compare Two Corporate Tax Structures Side-by-Side
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Select two corporate entity or compliance scenarios to compare taxable profit, banking compliance savings, and final corporate tax liability.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const temp = corpScenarioAKey;
              setCorpScenarioAKey(corpScenarioBKey);
              setCorpScenarioBKey(temp);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors self-start lg:self-auto cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>Swap Scenario A ↔ B</span>
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
              <label htmlFor="corp-scenario-a" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Scenario A (Baseline Corporate Structure)
              </label>
              <select
                id="corp-scenario-a"
                value={corpScenarioAKey}
                onChange={(e) => setCorpScenarioAKey(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-900"
              >
                {Object.entries(corporatePresets).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.label}
                  </option>
                ))}
              </select>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                <span>Final Corporate Tax:</span>
                <strong className="font-mono text-slate-900 text-sm tabular-nums">
                  BDT {corpA.finalTax.toLocaleString()}
                </strong>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40">
              <label htmlFor="corp-scenario-b" className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-2">
                Scenario B (Comparison Corporate Structure)
              </label>
              <select
                id="corp-scenario-b"
                value={corpScenarioBKey}
                onChange={(e) => setCorpScenarioBKey(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-emerald-300 bg-white text-sm font-semibold text-slate-900"
              >
                {Object.entries(corporatePresets).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.label}
                  </option>
                ))}
              </select>
              <div className="mt-3 flex items-center justify-between text-xs text-emerald-900">
                <span>Final Corporate Tax:</span>
                <strong className="font-mono text-emerald-800 text-sm tabular-nums">
                  BDT {corpB.finalTax.toLocaleString()}
                </strong>
              </div>
            </div>
          </div>

          <div className="h-[340px] w-full rounded-xl border border-slate-200 p-4 bg-white">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={corpChartData} margin={{ top: 16, right: 24, left: 16, bottom: 8 }} barGap={10}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="metric" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#334155', fontWeight: 600 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(val: number) => (val >= 100000 ? `৳${(val / 100000).toFixed(1)}L` : `৳${(val / 1000).toFixed(0)}k`)}
                />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    `BDT ${Number(val || 0).toLocaleString()}`,
                    name === 'scenarioA' ? `Scenario A: ${corpA.label}` : `Scenario B: ${corpB.label}`
                  ]}
                  contentStyle={{ borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px', fontWeight: 600 }}
                  formatter={(val: string) => (val === 'scenarioA' ? `Scenario A: ${corpA.label}` : `Scenario B: ${corpB.label}`)}
                />
                <Bar dataKey="scenarioA" name="scenarioA" fill="#1e293b" radius={[4, 4, 0, 0]} maxBarSize={52} />
                <Bar dataKey="scenarioB" name="scenarioB" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={52} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
