import React, { useState } from 'react';
import { 
  Building2, 
  ShieldAlert, 
  Clock, 
  Banknote, 
  Percent, 
  Users, 
  Calculator, 
  ListOrdered, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle, 
  ArrowRight,
  HelpCircle,
  FileText
} from 'lucide-react';

export interface ScenarioDefinition {
  id: string;
  title: string;
  clause: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  overview: string;
  triggerEvent: string;
  variables: { symbol: string; label: string; description: string }[];
  formulas: { title: string; math: string; note: string }[];
  calculationSteps: string[];
  numericalExample: {
    inputs: { label: string; val: string }[];
    steps: { stepName: string; calculation: string; output: string }[];
    finalResult: string;
  };
  compliancePitfall: string;
}

export const SCENARIO_DEFINITIONS: Record<string, ScenarioDefinition> = {
  'asset-disposal': {
    id: 'asset-disposal',
    title: '1. Disposal of Business Assets & Balancing Charges',
    clause: 'Sec. 46(2) & 46(4)',
    category: 'Asset Disposal',
    icon: Building2,
    overview: 'Governs statutory tax calculations when depreciable plant, machinery, or buildings used in business are sold, transferred, or retired.',
    triggerEvent: 'Sale, transfer, or retirement of a depreciated business asset.',
    variables: [
      { symbol: 'A', label: 'Sale Proceeds', description: 'Gross cash or consideration received upon asset disposal' },
      { symbol: 'B', label: 'Original Acquisition Cost', description: 'Initial cost plus capital improvement costs incurred' },
      { symbol: 'C', label: 'Tax Written-Down Value (WDV)', description: 'Asset tax value calculated under the Third Schedule' }
    ],
    formulas: [
      { title: 'Case I: Proceeds Exceed Original Cost (A > B)', math: 'Business Income = B - C  |  Capital Gain = A - B', note: 'Split into recaptured depreciation (Business Income) and capital appreciation (Capital Gain).' },
      { title: 'Case II: Proceeds Between WDV & Cost (C < A ≤ B)', math: 'Business Income = A - C', note: 'Entire excess over tax WDV is recaptured as Deemed Business Income.' },
      { title: 'Case III: Proceeds Below Tax WDV (A < C)', math: 'Allowable Business Expenditure = C - A', note: 'Shortfall is an allowable operational deduction under Sec. 46(4).' }
    ],
    calculationSteps: [
      'Step 1: Extract the asset original tax cost (B) and latest tax WDV (C) from fixed asset schedule.',
      'Step 2: Record total gross sale proceeds / consideration received (A).',
      'Step 3: Compare sale proceeds (A) against original cost (B) and tax WDV (C).',
      'Step 4: If A > B, compute Business Income (B - C) and Capital Gain (A - B) separately.',
      'Step 5: Report Business Income under "Business or Profession" head and Capital Gain under "Capital Gains" head in tax return.'
    ],
    numericalExample: {
      inputs: [
        { label: 'Original Cost (B)', val: 'BDT 20,00,000' },
        { label: 'Tax WDV (C)', val: 'BDT 12,00,000' },
        { label: 'Sale Proceeds (A)', val: 'BDT 25,00,000' }
      ],
      steps: [
        { stepName: 'Condition Check', calculation: 'A (25L) > B (20L) > C (12L)', output: 'Case I Applies (Split Calculation)' },
        { stepName: 'Recaptured Depreciation', calculation: 'B - C = 20,00,000 - 12,00,000', output: 'BDT 8,00,000 (Deemed Business Income)' },
        { stepName: 'Capital Appreciation', calculation: 'A - B = 25,00,000 - 20,00,000', output: 'BDT 5,00,000 (Capital Gain)' }
      ],
      finalResult: 'Total Tk. 13,00,000 excess split into Tk. 8,00,000 Business Income + Tk. 5,00,000 Capital Gain.'
    },
    compliancePitfall: 'Reporting entire sale proceeds minus WDV as ordinary business income when proceeds exceed original cost causes over-reporting of business income and misclassification of capital gains.'
  },
  'insurance-salvage': {
    id: 'insurance-salvage',
    title: '2. Insurance Compensation & Salvage Recoveries',
    clause: 'Sec. 46(3)',
    category: 'Insurance & Compensation',
    icon: ShieldAlert,
    overview: 'Determines deemed business income when insurance settlements, salvage proceeds, or municipal compensation are received for lost/damaged depreciable capital assets.',
    triggerEvent: 'Receipt of insurance claim payment or salvage value for destroyed or damaged depreciable asset.',
    variables: [
      { symbol: 'A', label: 'Total Compensation Payout', description: 'Insurance payout plus salvage cash plus scrap recovery' },
      { symbol: 'B', label: 'Original Acquisition Cost', description: 'Historical acquisition cost of the damaged/destroyed asset' },
      { symbol: 'C', label: 'Tax Written-Down Value', description: 'Tax WDV immediately before the casualty event' }
    ],
    formulas: [
      { title: 'Case I: Compensation Exceeds Original Cost (A > B)', math: 'Business Income = B - C  |  Capital Gain = A - B', note: 'Business income is capped at accumulated tax depreciation (B - C).' },
      { title: 'Case II: Compensation Between WDV & Cost (C < A ≤ B)', math: 'Business Income = A - C', note: 'Full compensation gain over tax WDV is added to Business Income.' },
      { title: 'Case III: Compensation Below Tax WDV (A < C)', math: 'Allowable Business Expenditure = C - A', note: 'Unrecovered asset value is deductible in full under Sec. 46(4).' }
    ],
    calculationSteps: [
      'Step 1: Obtain pre-casualty tax WDV (C) and original acquisition cost (B).',
      'Step 2: Sum all insurance survey settlements, salvage cash, and scrap compensation (A).',
      'Step 3: Compare total compensation (A) with original cost (B) and WDV (C).',
      'Step 4: Compute deemed business income or deductible loss.',
      'Step 5: Separate capital gains if insurance payout exceeds original cost.'
    ],
    numericalExample: {
      inputs: [
        { label: 'Original Cost (B)', val: 'BDT 30,00,000' },
        { label: 'Tax WDV (C)', val: 'BDT 18,00,000' },
        { label: 'Insurance Payout (A)', val: 'BDT 36,00,000' }
      ],
      steps: [
        { stepName: 'Check Condition', calculation: 'A (36L) > B (30L) > C (18L)', output: 'Case I applies' },
        { stepName: 'Business Income Portion', calculation: 'B - C = 30,00,000 - 18,00,000', output: 'BDT 12,00,000 (Deemed Business Income)' },
        { stepName: 'Capital Gain Portion', calculation: 'A - B = 36,00,000 - 30,00,000', output: 'BDT 6,00,000 (Capital Gain)' }
      ],
      finalResult: 'Tk. 12,00,000 added as Business Income and Tk. 6,00,000 taxed as Capital Gain.'
    },
    compliancePitfall: 'Insurance compensation received for damaged trading stock (inventory) is 100% ordinary operational revenue, NOT subject to capital asset balancing rules under Section 46(3).'
  },
  'unsettled-liabilities': {
    id: 'unsettled-liabilities',
    title: '3. Unsettled Operating Liabilities (3-Year Rule)',
    clause: 'Sec. 46(8)',
    category: 'Liabilities',
    icon: Clock,
    overview: 'Prevents businesses from claiming deductible operating costs or inventory purchases while leaving supplier payables unpaid indefinitely.',
    triggerEvent: 'Expiry of 3 full income years after the end of the income year in which the deduction was originally claimed.',
    variables: [
      { symbol: 'L', label: 'Unpaid Liability', description: 'Outstanding trade payable or accrued expense balance' },
      { symbol: 'Y', label: 'Original Accounting Year', description: 'Income year in which the expense was accounted for' }
    ],
    formulas: [
      { title: 'Deemed Business Income Addition', math: 'Deemed Income = Unpaid Liability Amount (L)', note: 'Added to Business Income in Income Year (Y + 4).' },
      { title: 'Subsequent Settlement Proviso', math: 'Allowable Deduction = Amount Paid in Year (Y + N)', note: 'Deductible in the later year when cash payment actually occurs.' }
    ],
    calculationSteps: [
      'Step 1: Extract aged payables schedule for balances older than 36 months.',
      'Step 2: Calculate 3-year cutoff date starting from the END of original income year (30 June Y).',
      'Step 3: Identify liabilities remaining unpaid at 30 June (Y + 3).',
      'Step 4: Add total unpaid balance to Business Income in Income Year (Y + 4) e-Return.',
      'Step 5: File deduction claim in future assessment year if liability is subsequently paid.'
    ],
    numericalExample: {
      inputs: [
        { label: 'Original Liability (L)', val: 'BDT 5,00,000 (FY 2022–23)' },
        { label: 'Accounting Year End', val: '30 June 2023' },
        { label: '3-Year Expiry Date', val: '30 June 2026' }
      ],
      steps: [
        { stepName: 'Grace Window Check', calculation: '1 July 2023 to 30 June 2026 (3 Years)', output: 'Liability remained unpaid' },
        { stepName: 'Taxation Trigger', calculation: 'Income Year FY 2026–27 (AY 2027–28)', output: 'Add BDT 5,00,000 to Business Income' },
        { stepName: 'Subsequent Relief', calculation: 'Paid supplier in FY 2027–28', output: 'Deduct BDT 5,00,000 in FY 2027–28' }
      ],
      finalResult: 'BDT 5,00,000 added as Business Income in FY 2026-27, with full relief if paid later.'
    },
    compliancePitfall: 'Calculating 3 years from invoice date instead of the end of the accounting income year leads to premature or incorrect deemed income reporting.'
  },
  'recovery-bad-debts': {
    id: 'recovery-bad-debts',
    title: '4. Recovery of Previously Written-Off Bad Debts',
    clause: 'Sec. 46(9)',
    category: 'Bad Debts & Recoveries',
    icon: Banknote,
    overview: 'Ensures that any cash or benefit received against a bad debt or loss previously allowed as a tax deduction is returned to taxable business income.',
    triggerEvent: 'Receipt of cash or benefit against a bad debt written off in a prior tax assessment.',
    variables: [
      { symbol: 'D', label: 'Previously Allowed Deduction', description: 'Amount allowed as bad debt deduction under Sec. 51' },
      { symbol: 'R', label: 'Subsequent Cash Recovery', description: 'Actual amount repaid by customer or reimbursed' }
    ],
    formulas: [
      { title: 'Deemed Business Income Formula', math: 'Deemed Income = min(R, D)', note: 'Taxable as business income up to the amount previously deducted.' }
    ],
    calculationSteps: [
      'Step 1: Verify prior tax assessment records to confirm the bad debt write-off was allowed as a tax deduction.',
      'Step 2: Record cash or bank realization received from the debtor in current income year.',
      'Step 3: Include the recovered amount in current year taxable business income reconciliation.',
      'Step 4: Attach bank deposit proof and prior year assessment copy.'
    ],
    numericalExample: {
      inputs: [
        { label: 'Prior Bad Debt Allowed', val: 'BDT 4,00,000 (FY 2023–24)' },
        { label: 'Customer Recovery in 2026', val: 'BDT 1,50,000' }
      ],
      steps: [
        { stepName: 'Deduction Verification', calculation: 'Tk. 4,00,000 was deducted under Sec. 51', output: 'Valid prior deduction' },
        { stepName: 'Recovery Calculation', calculation: 'Recovery = BDT 1,50,000', output: 'BDT 1,50,000 Deemed Income' }
      ],
      finalResult: 'Tk. 1,50,000 added as Deemed Business Income in current assessment.'
    },
    compliancePitfall: 'Recoveries against bad debts that were NEVER allowed as tax deductions in prior tax assessments are NOT taxable under Section 46(9).'
  },
  'unpaid-interest': {
    id: 'unpaid-interest',
    title: '5. Unpaid Interest or Profit Expenses (Finance Act 2026)',
    clause: 'Sec. 46(6A)',
    category: 'Finance Act 2026',
    icon: Percent,
    overview: 'Introduced by Finance Act 2026 to prevent artificial interest deduction claims that are never remitted to lenders.',
    triggerEvent: 'Interest or profit expense deducted in business income remains unpaid 3 years after the income year end.',
    variables: [
      { symbol: 'I', label: 'Deducted Unpaid Interest', description: 'Interest or profit claimed under Sec. 52/53 and left unpaid' }
    ],
    formulas: [
      { title: 'Deemed Income Addition', math: 'Deemed Income = Unpaid Interest (I)', note: 'Added to Business Income in Income Year (Y + 4).' },
      { title: 'Subsequent Payment Relief', math: 'Allowable Deduction = Interest Paid in Year (Y + N)', note: 'Allowed as deduction when paid in a later year.' }
    ],
    calculationSteps: [
      'Step 1: Identify interest expenses claimed as deduction in FY Y.',
      'Step 2: Verify if interest remains unpaid on 30 June (Y + 3).',
      'Step 3: Add unpaid interest to Business Income in Income Year (Y + 4).',
      'Step 4: Claim deduction in subsequent year when interest is actually paid.'
    ],
    numericalExample: {
      inputs: [
        { label: 'Interest Claimed in FY 2022-23', val: 'BDT 3,00,000' },
        { label: 'Unpaid Status at 30 June 2026', val: 'Fully Unpaid' }
      ],
      steps: [
        { stepName: '3-Year Expiry', calculation: '30 June 2023 to 30 June 2026', output: '3 years expired' },
        { stepName: 'Tax Addition', calculation: 'FY 2026–27 e-Return', output: 'Add BDT 3,00,000 Business Income' }
      ],
      finalResult: 'BDT 3,00,000 added as Deemed Business Income in FY 2026–27.'
    },
    compliancePitfall: 'Must be tracked separately from trading payables under Sec. 46(8) in the tax adjustment register.'
  },
  'associated-loan-shortfall': {
    id: 'associated-loan-shortfall',
    title: '6. Loan Shortfall on Loans to Associated Enterprises',
    clause: 'Sec. 46(11A)',
    category: 'Finance Act 2026',
    icon: Users,
    overview: 'Prevents non-arm’s-length interest-free or low-interest loans given to group companies or associated entities.',
    triggerEvent: 'Loan provided to associated enterprise at an interest rate below 12% per annum.',
    variables: [
      { symbol: 'P', label: 'Loan Principal', description: 'Outstanding loan balance extended to associated entity' },
      { symbol: 'r', label: 'Actual Interest Rate Received', description: 'Annual interest rate charged to associated enterprise' }
    ],
    formulas: [
      { title: 'Benchmark Interest Shortfall Formula', math: 'Deemed Income = P × (12% - r%)', note: 'Shortfall below 12% benchmark is added as Deemed Business Income.' }
    ],
    calculationSteps: [
      'Step 1: Identify loans extended to associated enterprises by non-banking entities.',
      'Step 2: Determine actual interest rate charged (r%).',
      'Step 3: Calculate difference between 12% benchmark and actual rate r%.',
      'Step 4: Multiply shortfall percentage by principal P and add to taxable income.'
    ],
    numericalExample: {
      inputs: [
        { label: 'Loan Principal (P)', val: 'BDT 1,00,00,000 (1 Crore)' },
        { label: 'Actual Interest Charged (r%)', val: '8.0% per annum' }
      ],
      steps: [
        { stepName: 'Shortfall Calculation', calculation: '12.0% - 8.0% = 4.0% Shortfall', output: '4% below benchmark' },
        { stepName: 'Deemed Income Computation', calculation: '1,00,00,000 × 4.0%', output: 'BDT 4,00,000 Deemed Income' }
      ],
      finalResult: 'BDT 4,00,000 added as Deemed Business Income in current assessment.'
    },
    compliancePitfall: 'Does not apply to banks, non-bank financial institutions (NBFIs), and specialized leasing companies.'
  }
};

export function Section46ScenarioSelector() {
  const [selectedScenarioKey, setSelectedScenarioKey] = useState<string>('asset-disposal');
  const [interactiveMode, setInteractiveMode] = useState<'formula' | 'calculator'>('formula');

  // Asset Disposal Live Calculator State
  const [cost, setCost] = useState<number>(2000000);
  const [wdv, setWdv] = useState<number>(1200000);
  const [sale, setSale] = useState<number>(2500000);

  const scenario = SCENARIO_DEFINITIONS[selectedScenarioKey] || SCENARIO_DEFINITIONS['asset-disposal'];
  const IconComponent = scenario.icon;

  // Live calculation output for asset disposal
  const calcResult = React.useMemo(() => {
    const B = Number(cost) || 0;
    const C = Number(wdv) || 0;
    const A = Number(sale) || 0;

    if (A > B) {
      return {
        businessIncome: Math.max(0, B - C),
        capitalGain: Math.max(0, A - B),
        deduction: 0,
        type: 'A > B (Exceeds Original Cost)',
        summary: `Sale proceeds exceed acquisition cost. Cost minus WDV (Tk. ${(B-C).toLocaleString()}) is Business Income; proceeds minus cost (Tk. ${(A-B).toLocaleString()}) is Capital Gain.`
      };
    } else if (A > C) {
      return {
        businessIncome: Math.max(0, A - C),
        capitalGain: 0,
        deduction: 0,
        type: 'C < A ≤ B (Between WDV and Cost)',
        summary: `Sale proceeds exceed tax WDV but are within original cost. Entire gain over WDV (Tk. ${(A-C).toLocaleString()}) is Business Income.`
      };
    } else if (A < C) {
      return {
        businessIncome: 0,
        capitalGain: 0,
        deduction: Math.max(0, C - A),
        type: 'A < C (Below Tax WDV)',
        summary: `Sale proceeds are below tax WDV. The shortfall (Tk. ${(C-A).toLocaleString()}) is an allowable operational business deduction under Sec. 46(4).`
      };
    }
    return { businessIncome: 0, capitalGain: 0, deduction: 0, type: 'A = C (Equal)', summary: 'Sale proceeds equal tax WDV. No tax adjustment required.' };
  }, [cost, wdv, sale]);

  return (
    <div className="not-prose my-10 bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden font-sans">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-6 sm:p-8 text-white">
        <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-extrabold uppercase tracking-widest px-3.5 py-1.5 rounded-full mb-3">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Interactive Section 46 Scenario Selector</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
          Deemed Business Income Scenario & Formula Explorer
        </h2>
        <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
          Select any tax scenario card below to dynamically render its statutory section clause, formula rules, variable definitions, step-by-step methodology, and worked numerical examples under the Bangladesh Income Tax Act, 2023.
        </p>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => setInteractiveMode('formula')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              interactiveMode === 'formula'
                ? 'bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-300'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Statutory Formulas & Steps</span>
          </button>
          <button
            onClick={() => setInteractiveMode('calculator')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              interactiveMode === 'calculator'
                ? 'bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-300'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Live Asset Disposal Calculator</span>
          </button>
        </div>
      </div>

      {/* Scenario Selection Grid Cards */}
      <div className="p-6 bg-slate-50/70 border-b border-slate-200">
        <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-emerald-600" />
          <span>Select a Tax Scenario to Inspect Computation Logic:</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {Object.keys(SCENARIO_DEFINITIONS).map((key) => {
            const sc = SCENARIO_DEFINITIONS[key];
            const ScIcon = sc.icon;
            const isSelected = selectedScenarioKey === key;

            return (
              <button
                key={key}
                onClick={() => setSelectedScenarioKey(key)}
                className={`text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-br from-emerald-900 via-slate-900 to-teal-950 text-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20 scale-[1.01]'
                    : 'bg-white text-slate-800 border-slate-200/90 hover:border-emerald-300 hover:bg-emerald-50/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <ScIcon className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                    isSelected ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {sc.clause}
                  </span>
                </div>

                <div className="font-bold text-sm leading-snug mb-2">
                  {sc.title}
                </div>

                <div className={`text-xs flex items-center gap-1 font-semibold ${
                  isSelected ? 'text-emerald-400' : 'text-emerald-700'
                }`}>
                  <span>Inspect statutory logic</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Dynamic View Area */}
      {interactiveMode === 'formula' ? (
        <div className="p-6 sm:p-8 bg-white">
          {/* Active Scenario Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 shrink-0 mt-0.5">
                <IconComponent className="w-6 h-6" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-900 text-xs font-extrabold uppercase tracking-wider mb-1.5 border border-emerald-200/80">
                  <span>Statutory Reference: {scenario.clause}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {scenario.title}
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm mt-1 leading-relaxed">
                  {scenario.overview}
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
            {/* Left Column: Statutory Trigger, Variables, Formulas, Steps (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Trigger Condition Box */}
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 block mb-1">
                  ⚡ Statutory Trigger Condition
                </span>
                <p className="text-xs sm:text-sm text-emerald-950 font-medium leading-relaxed">
                  {scenario.triggerEvent}
                </p>
              </div>

              {/* Variables */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <ListOrdered className="w-4 h-4 text-emerald-600" />
                  <span>Calculation Variables</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {scenario.variables.map((v) => (
                    <div key={v.symbol} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-6 h-6 rounded-md bg-emerald-800 text-white font-mono text-xs font-extrabold flex items-center justify-center shrink-0">
                          {v.symbol}
                        </span>
                        <span className="font-bold text-slate-900 text-xs">{v.label}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight">{v.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Formulas List */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  <span>Statutory Calculation Formulas</span>
                </h4>
                <div className="space-y-3">
                  {scenario.formulas.map((f, idx) => (
                    <div key={idx} className="bg-slate-900 p-4 rounded-2xl text-white border border-slate-800 shadow-xs">
                      <div className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider mb-1.5">
                        {f.title}
                      </div>
                      <div className="bg-white/10 p-2.5 rounded-xl font-mono text-xs sm:text-sm font-bold text-emerald-300 mb-2 border border-white/10">
                        {f.math}
                      </div>
                      <div className="text-slate-300 text-xs italic leading-relaxed">
                        Note: {f.note}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step-by-Step Methodology */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Step-by-Step Calculation Logic</span>
                </h4>
                <div className="space-y-2">
                  {scenario.calculationSteps.map((stepText, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs sm:text-sm text-slate-800 font-medium">
                      <span className="w-5 h-5 rounded-full bg-emerald-800 text-white text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-snug">{stepText}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Worked Numerical Example & Audit Pitfalls (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Worked Numerical Example Card */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 p-6 rounded-3xl text-white border border-slate-800 shadow-md">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Worked Numerical Example</span>
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-extrabold">
                    Practical Case
                  </span>
                </div>

                {/* Given Inputs */}
                <div className="mb-4">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Given Figures:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {scenario.numericalExample.inputs.map((inp, idx) => (
                      <div key={idx} className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                        <span className="text-[10px] text-slate-400 block">{inp.label}</span>
                        <span className="text-xs font-bold text-emerald-300">{inp.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Calculation Breakdown */}
                <div className="mb-4 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Calculation Breakdown:
                  </span>
                  {scenario.numericalExample.steps.map((st, idx) => (
                    <div key={idx} className="bg-white/5 p-3 rounded-xl border border-white/10 text-xs">
                      <div className="text-slate-300 font-bold mb-0.5">{st.stepName}</div>
                      <div className="font-mono text-slate-400 text-[11px]">{st.calculation}</div>
                      <div className="text-emerald-400 font-bold mt-1 text-[11px]">→ {st.output}</div>
                    </div>
                  ))}
                </div>

                {/* Final Tax Return Summary */}
                <div className="p-3.5 bg-emerald-500/20 border border-emerald-400/40 rounded-xl">
                  <span className="text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider block mb-1">
                    Final Tax Return Impact:
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-white leading-snug">
                    {scenario.numericalExample.finalResult}
                  </p>
                </div>
              </div>

              {/* Audit Warning */}
              <div className="p-5 bg-amber-50 border border-amber-200 rounded-3xl text-amber-950">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider mb-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Audit & Compliance Pitfall</span>
                </div>
                <p className="text-xs sm:text-sm text-amber-900 leading-relaxed font-medium">
                  {scenario.compliancePitfall}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Live Asset Disposal Calculator View */
        <div className="p-6 sm:p-8 bg-white">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-xl font-extrabold text-slate-900 mb-2 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-600" />
              <span>Interactive Section 46(2) Asset Disposal Calculator</span>
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm mb-6">
              Enter your capital asset figures to immediately calculate deemed business income recaptured depreciation vs capital gains.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Original Acquisition Cost (B)
                </label>
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Tk. {(cost/100000).toFixed(2)} Lakhs</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tax Written-Down Value (C)
                </label>
                <input
                  type="number"
                  value={wdv}
                  onChange={(e) => setWdv(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Tk. {(wdv/100000).toFixed(2)} Lakhs</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Gross Sale Proceeds (A)
                </label>
                <input
                  type="number"
                  value={sale}
                  onChange={(e) => setSale(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Tk. {(sale/100000).toFixed(2)} Lakhs</span>
              </div>
            </div>

            {/* Live Calculation Output Card */}
            <div className="bg-slate-900 p-6 rounded-3xl text-white border border-slate-800 shadow-md">
              <div className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 mb-2">
                Calculation Result ({calcResult.type})
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
                {calcResult.summary}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                  <span className="text-[11px] text-emerald-300 font-bold block uppercase tracking-wider mb-1">
                    Deemed Business Income:
                  </span>
                  <span className="text-lg font-extrabold text-white">
                    Tk. {calcResult.businessIncome.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">Taxed under Sec. 45/46</span>
                </div>

                <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                  <span className="text-[11px] text-amber-300 font-bold block uppercase tracking-wider mb-1">
                    Capital Gain:
                  </span>
                  <span className="text-lg font-extrabold text-white">
                    Tk. {calcResult.capitalGain.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">Taxed under Capital Gains head</span>
                </div>

                <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                  <span className="text-[11px] text-blue-300 font-bold block uppercase tracking-wider mb-1">
                    Allowable Deduction:
                  </span>
                  <span className="text-lg font-extrabold text-white">
                    Tk. {calcResult.deduction.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">Claimed under Sec. 46(4)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
