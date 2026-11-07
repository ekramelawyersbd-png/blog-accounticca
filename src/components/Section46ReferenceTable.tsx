import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Calculator, 
  Clock, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Copy, 
  Check, 
  Download, 
  Layers, 
  Scale, 
  HelpCircle,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Banknote,
  Percent,
  Users,
  Building2,
  FileCheck2,
  ListOrdered,
  BookOpen
} from 'lucide-react';

export interface Section46Scenario {
  id: string;
  category: 'Asset Disposal' | 'Insurance & Salvage' | 'Trading Liabilities' | 'Bad Debts & Recoveries' | 'Finance Act 2026 Additions';
  title: string;
  sectionClause: string;
  condition: string;
  taxTreatment: string;
  incomeHead: 'Business Income' | 'Capital Gains' | 'Business Income & Capital Gains' | 'Allowable Deduction';
  exampleText: string;
  formula?: string;
  subsequentRule?: string;
}

export const SECTION_46_SCENARIOS: Section46Scenario[] = [
  {
    id: 'asset-disposal-above-cost',
    category: 'Asset Disposal',
    title: 'Disposal of Asset: Proceeds Exceed Original Acquisition Cost (A > B)',
    sectionClause: 'Sec. 46(2)',
    condition: 'Sale proceeds (A) exceed original cost (B) and written-down value (C)',
    taxTreatment: 'Cost minus WDV (B − C) is Business Income; Proceeds minus Cost (A − B) is Capital Gains',
    incomeHead: 'Business Income & Capital Gains',
    formula: 'Business Income = B - C | Capital Gain = A - B',
    exampleText: 'Machine purchased for BDT 20L, WDV BDT 12L, sold for BDT 25L → BDT 8L Business Income + BDT 5L Capital Gain.'
  },
  {
    id: 'asset-disposal-between-wdv-cost',
    category: 'Asset Disposal',
    title: 'Disposal of Asset: Proceeds Exceed WDV but Below Original Cost (C < A ≤ B)',
    sectionClause: 'Sec. 46(2)',
    condition: 'Sale proceeds (A) exceed WDV (C) but do not exceed original cost (B)',
    taxTreatment: 'Full excess over WDV (A − C) is treated as Business Income',
    incomeHead: 'Business Income',
    formula: 'Business Income = A - C',
    exampleText: 'Machine purchased for BDT 20L, WDV BDT 12L, sold for BDT 17L → BDT 5L Business Income.'
  },
  {
    id: 'asset-disposal-below-wdv',
    category: 'Asset Disposal',
    title: 'Disposal of Asset: Proceeds Below Written-Down Value (A < C)',
    sectionClause: 'Sec. 46(4)',
    condition: 'Sale proceeds (A) are less than written-down value (C)',
    taxTreatment: 'Shortfall (C − A) is treated as allowable Business Expenditure (General Deduction)',
    incomeHead: 'Allowable Deduction',
    formula: 'Allowable Deduction = C - A',
    exampleText: 'Machine WDV BDT 12L, sold for BDT 10L → BDT 2L allowable business deduction.'
  },
  {
    id: 'insurance-above-cost',
    category: 'Insurance & Salvage',
    title: 'Insurance/Salvage Recovery: Proceeds Exceed Original Cost (A > B)',
    sectionClause: 'Sec. 46(3)',
    condition: 'Insurance/compensation proceeds (A) exceed original acquisition cost (B)',
    taxTreatment: 'Cost minus WDV (B − C) is Business Income; Compensation minus Cost (A − B) is Capital Gains',
    incomeHead: 'Business Income & Capital Gains',
    formula: 'Business Income = B - C | Capital Gain = A - B',
    exampleText: 'Asset destroyed. Cost BDT 30L, WDV BDT 18L, Insurance paid BDT 36L → BDT 12L Business Income + BDT 6L Capital Gain.'
  },
  {
    id: 'insurance-between-wdv-cost',
    category: 'Insurance & Salvage',
    title: 'Insurance/Salvage Recovery: Proceeds Between WDV and Cost (C < A ≤ B)',
    sectionClause: 'Sec. 46(3)',
    condition: 'Insurance compensation (A) exceeds WDV (C) but is within original cost (B)',
    taxTreatment: 'Excess over WDV (A − C) is treated as Business Income',
    incomeHead: 'Business Income',
    formula: 'Business Income = A - C',
    exampleText: 'Cost BDT 30L, WDV BDT 18L, Insurance paid BDT 24L → BDT 6L Business Income.'
  },
  {
    id: 'insurance-below-wdv',
    category: 'Insurance & Salvage',
    title: 'Insurance/Salvage Recovery: Proceeds Below WDV (A < C)',
    sectionClause: 'Sec. 46(4)',
    condition: 'Insurance compensation (A) is less than written-down value (C)',
    taxTreatment: 'Shortfall (C − A) is treated as allowable Business Expenditure',
    incomeHead: 'Allowable Deduction',
    formula: 'Allowable Deduction = C - A',
    exampleText: 'WDV BDT 18L, Insurance paid BDT 15L → BDT 3L allowable business deduction.'
  },
  {
    id: 'unsettled-trading-liabilities',
    category: 'Trading Liabilities',
    title: 'Unsettled Supplier / Operating Expenses Unpaid After 3 Years',
    sectionClause: 'Sec. 46(8)',
    condition: 'Trade payable or expense liability unpaid 3 years after the end of the accounting income year',
    taxTreatment: 'Unpaid liability is deemed Business Income in the income year immediately following the 3-year expiry',
    incomeHead: 'Business Income',
    subsequentRule: 'If paid in a later year, the amount paid is deductible in that later income year.',
    exampleText: 'BDT 5L supplier liability claimed in FY 2022-23 remains unpaid by 30 June 2026 → Added as Business Income in FY 2026-27.'
  },
  {
    id: 'unpaid-interest-profit',
    category: 'Finance Act 2026 Additions',
    title: 'Unpaid Interest or Profit Expense Unpaid After 3 Years',
    sectionClause: 'Sec. 46(6A)',
    condition: 'Interest or profit deducted as business expense remains unpaid 3 years after end of income year',
    taxTreatment: 'Unpaid interest is deemed Business or Professional Income in the year following expiry',
    incomeHead: 'Business Income',
    subsequentRule: 'If paid in a subsequent year, the paid interest is deductible in that later year.',
    exampleText: 'BDT 3L loan interest deducted in FY 2022-23 unpaid by 30 June 2026 → Added as Business Income in FY 2026-27.'
  },
  {
    id: 'recovery-bad-debts',
    category: 'Bad Debts & Recoveries',
    title: 'Recovery of Previously Deducted Bad Debts',
    sectionClause: 'Sec. 46(9)',
    condition: 'A customer debt previously written off and allowed as a tax deduction is subsequently recovered',
    taxTreatment: 'Amount recovered is treated as Business Income in the income year of receipt',
    incomeHead: 'Business Income',
    exampleText: 'BDT 4L bad debt written off in 2024; customer repays BDT 1.5L in 2026 → BDT 1.5L added as Business Income in 2026.'
  },
  {
    id: 'recovery-losses-expenses',
    category: 'Bad Debts & Recoveries',
    title: 'Recovery or Reimbursement of Previously Deducted Expenses or Losses',
    sectionClause: 'Sec. 46(9)',
    condition: 'An expense or commercial loss allowed as a deduction in a prior year is reimbursed or compensated',
    taxTreatment: 'Reimbursement or benefit received is treated as Business Income in the year received',
    incomeHead: 'Business Income',
    exampleText: 'BDT 8L expense deducted in 2024; BDT 2L reimbursed in 2026 → BDT 2L added as Business Income.'
  },
  {
    id: 'initial-capital-deficiency',
    category: 'Finance Act 2026 Additions',
    title: 'Deficiency in Initial Capital Identified Under Sec. 180 Return',
    sectionClause: 'Sec. 46(10)',
    condition: 'Deficiency in initial capital identified within 5 income years of filing return',
    taxTreatment: 'Capital deficiency amount is treated as Business Income for the relevant income year',
    incomeHead: 'Business Income',
    exampleText: 'Return filed under Sec. 180; BDT 8L capital deficiency detected within 5 years → BDT 8L added as Business Income.'
  },
  {
    id: 'associated-enterprise-interest-shortfall',
    category: 'Finance Act 2026 Additions',
    title: 'Interest Shortfall Below 12% on Loans to Associated Enterprises',
    sectionClause: 'Sec. 46(11A)',
    condition: 'Non-bank loan to associated enterprise earning interest rate below 12% per annum',
    taxTreatment: 'Interest shortfall below 12% benchmark is deemed Business or Professional Income',
    incomeHead: 'Business Income',
    formula: 'Deemed Income = Loan Principal × (12% - Actual Interest Rate)',
    exampleText: 'BDT 1 Cr loan to associated firm at 8% interest → 4% shortfall (BDT 4L) added as Business Income.'
  }
];

// Rich Scenario Step-by-Step Calculation Guide definitions
export interface DynamicFormulaGuide {
  id: string;
  title: string;
  clause: string;
  condition?: string;
  icon: any;
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

export const FORMULA_GUIDES: Record<string, DynamicFormulaGuide> = {
  'asset-disposal': {
    id: 'asset-disposal',
    title: '1. Disposal of Business Assets & Balancing Charges',
    clause: 'Section 46(2) & Section 46(4)',
    icon: Building2,
    overview: 'Governs the statutory tax treatment when depreciable plant, machinery, or buildings used in business are sold or transferred.',
    triggerEvent: 'Sale, transfer, or retirement of a depreciated business asset.',
    variables: [
      { symbol: 'A', label: 'Sale Proceeds', description: 'Total consideration or cash received upon disposal' },
      { symbol: 'B', label: 'Original Cost', description: 'Initial acquisition cost plus capital enhancement costs' },
      { symbol: 'C', label: 'Tax WDV', description: 'Written-down value calculated under Third Schedule' }
    ],
    formulas: [
      { title: 'Case I: Proceeds Exceed Original Cost (A > B)', math: 'Deemed Business Income = B - C  |  Capital Gain = A - B', note: 'Split into Business Income (recaptured depreciation) and Capital Gain.' },
      { title: 'Case II: Proceeds Between WDV & Cost (C < A ≤ B)', math: 'Deemed Business Income = A - C', note: 'Entire gain above tax WDV is recaptured as Business Income.' },
      { title: 'Case III: Proceeds Below Tax WDV (A < C)', math: 'Allowable Business Expenditure = C - A', note: 'Shortfall is claimed as an allowable operational expense under Sec. 46(4).' }
    ],
    calculationSteps: [
      'Step 1: Obtain the asset’s original tax acquisition cost (B) and latest tax WDV (C) from the fixed asset register.',
      'Step 2: Obtain total gross sale consideration received (A).',
      'Step 3: Compare sale proceeds (A) against original cost (B).',
      'Step 4: If A > B, compute Business Income (B − C) and Capital Gain (A − B) separately.',
      'Step 5: Report Business Income under "Business or Profession" head and Capital Gain under "Capital Gains" head in tax return.'
    ],
    numericalExample: {
      inputs: [
        { label: 'Original Cost (B)', val: 'BDT 20,00,000' },
        { label: 'Tax WDV (C)', val: 'BDT 12,00,000' },
        { label: 'Sale Proceeds (A)', val: 'BDT 25,00,000' }
      ],
      steps: [
        { stepName: 'Check Condition', calculation: 'A (25L) > B (20L) > C (12L)', output: 'Case I applies (Split calculation)' },
        { stepName: 'Recaptured Depreciation', calculation: 'B - C = 20,00,000 - 12,00,000', output: 'BDT 8,00,000 (Deemed Business Income)' },
        { stepName: 'Capital Appreciation', calculation: 'A - B = 25,00,000 - 20,00,000', output: 'BDT 5,00,000 (Capital Gain)' }
      ],
      finalResult: 'Total Tk. 13,00,000 excess split into Tk. 8,00,000 Business Income + Tk. 5,00,000 Capital Gain.'
    },
    compliancePitfall: 'Do not report the entire Tk. 13L as Business Income. Treating capital gains as ordinary business income can cause incorrect tax rate application under Section 57.'
  },
  'insurance-salvage': {
    id: 'insurance-salvage',
    title: '2. Insurance, Salvage & Compensation Recoveries',
    clause: 'Section 46(3) & Section 46(4)',
    icon: ShieldAlert,
    overview: 'Applies when a business asset is damaged, destroyed, demolished, or lost due to fire, flood, accident, or theft.',
    triggerEvent: 'Receipt of insurance claims, salvage sales proceeds, or third-party damage compensation.',
    variables: [
      { symbol: 'A', label: 'Insurance/Compensation Proceeds', description: 'Total insurance claim payout + salvage scrap value' },
      { symbol: 'B', label: 'Original Cost', description: 'Original acquisition cost of the destroyed asset' },
      { symbol: 'C', label: 'Tax WDV', description: 'Tax written-down value prior to destruction' }
    ],
    formulas: [
      { title: 'Case I: Claim Proceeds Exceed Cost (A > B)', math: 'Deemed Business Income = B - C  |  Capital Gain = A - B', note: 'Split between recaptured depreciation and capital appreciation.' },
      { title: 'Case II: Claim Proceeds Between WDV & Cost (C < A ≤ B)', math: 'Deemed Business Income = A - C', note: 'Full recovery above tax WDV is deemed Business Income.' },
      { title: 'Case III: Claim Proceeds Below WDV (A < C)', math: 'Allowable Loss Expenditure = C - A', note: 'Unrecovered WDV is deductible as a business loss.' }
    ],
    calculationSteps: [
      'Step 1: Obtain asset WDV (C) prior to damage and original cost (B).',
      'Step 2: Sum all insurance survey settlements, salvage cash, and municipal compensation (A).',
      'Step 3: Compare total compensation (A) with original cost (B) and WDV (C).',
      'Step 4: Compute deemed business income or deductible loss.',
      'Step 5: Separate capital gains if insurance payout exceeds original acquisition cost.'
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
    compliancePitfall: 'Insurance compensation for lost trading stock (inventory) is 100% ordinary revenue receipt; Section 46(3) applies strictly to depreciable capital assets.'
  },
  'unsettled-liabilities': {
    id: 'unsettled-liabilities',
    title: '3. Unsettled Supplier & Operating Liabilities (3-Year Rule)',
    clause: 'Section 46(8)',
    condition: 'Trading liability remains unpaid for 3 full income years after the end of the accounting income year.',
    icon: Clock,
    overview: 'Prevents businesses from claiming deductible operating costs or inventory purchases while leaving liabilities unpaid indefinitely.',
    triggerEvent: 'Expiry of 3 years from the end of the income year in which the expense was accounted for.',
    variables: [
      { symbol: 'L', label: 'Unpaid Liability', description: 'Outstanding trade payable or accrued expense balance' },
      { symbol: 'Y', label: 'Original Accounting Year', description: 'Income year in which the deduction was originally claimed' }
    ],
    formulas: [
      { title: 'Deemed Business Income Addition', math: 'Deemed Income = Unpaid Liability Amount (L)', note: 'Added to Business Income in Income Year (Y + 4).' },
      { title: 'Subsequent Settlement Proviso', math: 'Allowable Deduction = Amount Paid in Year (Y + N)', note: 'Deductible in the later year when cash payment actually occurs.' }
    ],
    calculationSteps: [
      'Step 1: Extract aged payables schedule for balances older than 36 months.',
      'Step 2: Calculate 3-year cutoff date starting from the END of original income year (30 June Y).',
      'Step 3: Check if liability remains unsettled on 30 June (Y + 3).',
      'Step 4: If unpaid, add full balance L to business income in return for Income Year (Y + 4).',
      'Step 5: Maintain statutory audit trail for future payment relief.'
    ],
    numericalExample: {
      inputs: [
        { label: 'Original Year (Y)', val: 'FY 2022–23 (Ended 30 June 2023)' },
        { label: 'Unpaid Supplier Debt (L)', val: 'BDT 5,00,000' },
        { label: '3-Year Expiry Date', val: '30 June 2026' }
      ],
      steps: [
        { stepName: 'Grace Window Check', calculation: '1 July 2023 to 30 June 2026 (3 Years)', output: 'Liability remained unpaid' },
        { stepName: 'Taxation Trigger', calculation: 'Income Year FY 2026–27 (AY 2027–28)', output: 'Add BDT 5,00,000 to Business Income' },
        { stepName: 'Subsequent Relief', calculation: 'Paid supplier in FY 2027–28', output: 'Deduct BDT 5,00,000 in FY 2027–28' }
      ],
      finalResult: 'BDT 5,00,000 added as Business Income in FY 2026-27, with full relief if paid later.'
    },
    compliancePitfall: 'Calculating 3 years from invoice date instead of the end of the accounting year leads to prematurely or incorrectly reporting deemed income.'
  },
  'recovery-bad-debts': {
    id: 'recovery-bad-debts',
    title: '4. Recovery of Previously Written-off Bad Debts & Losses',
    clause: 'Section 46(9)',
    icon: Banknote,
    overview: 'Ensures that any cash or benefit received against an expense, bad debt, or loss previously allowed as a tax deduction is returned to taxable business income.',
    triggerEvent: 'Receipt of cash or benefit against a bad debt written off in a prior tax assessment.',
    variables: [
      { symbol: 'D', label: 'Previously Allowed Deduction', description: 'Amount allowed as bad debt under Sec. 51 or business loss' },
      { symbol: 'R', label: 'Subsequent Cash Recovery', description: 'Actual amount repaid by customer or reimbursed' }
    ],
    formulas: [
      { title: 'Deemed Business Income Formula', math: 'Deemed Income = min(R, D)', note: 'Taxable as business income up to the amount previously deducted.' }
    ],
    calculationSteps: [
      'Step 1: Check prior tax assessment records to confirm the bad debt write-off was allowed as a tax deduction.',
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
    compliancePitfall: 'Recoveries against bad debts that were NEVER allowed as tax deductions in prior assessments are NOT taxable under Section 46(9).'
  },
  'unpaid-interest': {
    id: 'unpaid-interest',
    title: '5. Unpaid Interest or Profit Expenses (Finance Act 2026)',
    clause: 'Section 46(6A)',
    icon: Percent,
    overview: 'Introduced by Finance Act 2026 to prevent artificial interest deduction claims that are never actually remitted to lenders.',
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
    title: '6. Loan Interest Shortfall on Loans to Associated Enterprises',
    clause: 'Section 46(11A)',
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
        { stepName: 'Benchmark Check', calculation: '12% - 8% = 4% Interest Shortfall', output: '4% below benchmark' },
        { stepName: 'Shortfall Calculation', calculation: '1,00,00,000 × 4%', output: 'BDT 4,00,00,000' }
      ],
      finalResult: 'BDT 4,00,000 added as Deemed Business Income in current assessment.'
    },
    compliancePitfall: 'This provision does not apply to banks, financial institutions, and specialized leasing companies.'
  }
};

export function Section46ReferenceTable() {
  const [activeTab, setActiveTab] = useState<'explorer' | 'matrix' | 'calculator' | 'timeline'>('explorer');
  const [selectedGuideKey, setSelectedGuideKey] = useState<string>('asset-disposal');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Asset Disposal Calculator State
  const [calcCost, setCalcCost] = useState<number>(2000000); // 20 Lakhs
  const [calcWdv, setCalcWdv] = useState<number>(1200000);   // 12 Lakhs
  const [calcSale, setCalcSale] = useState<number>(2500000);  // 25 Lakhs

  // Timeline Calculator State
  const [liabilityAmount, setLiabilityAmount] = useState<number>(500000);
  const [accountingYear, setAccountingYear] = useState<number>(2023); // FY 2022-23 (ends 30 June 2023)

  const categories = ['All', 'Asset Disposal', 'Insurance & Salvage', 'Trading Liabilities', 'Bad Debts & Recoveries', 'Finance Act 2026 Additions'];

  const selectedGuide = FORMULA_GUIDES[selectedGuideKey] || FORMULA_GUIDES['asset-disposal'];
  const GuideIcon = selectedGuide.icon;

  const filteredScenarios = useMemo(() => {
    return SECTION_46_SCENARIOS.filter(scenario => {
      const matchesCategory = selectedCategory === 'All' || scenario.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || 
        scenario.title.toLowerCase().includes(q) ||
        scenario.sectionClause.toLowerCase().includes(q) ||
        scenario.condition.toLowerCase().includes(q) ||
        scenario.taxTreatment.toLowerCase().includes(q) ||
        scenario.exampleText.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Asset Disposal Calculation Results
  const disposalResults = useMemo(() => {
    const B = Number(calcCost) || 0;
    const C = Number(calcWdv) || 0;
    const A = Number(calcSale) || 0;

    if (A > B) {
      const businessIncome = B - C;
      const capitalGains = A - B;
      return {
        type: 'above-cost',
        businessIncome: Math.max(0, businessIncome),
        capitalGains: Math.max(0, capitalGains),
        allowableDeduction: 0,
        explanation: `Sale proceeds (BDT ${(A/100000).toFixed(2)}L) exceed original acquisition cost (BDT ${(B/100000).toFixed(2)}L). Under Sec. 46(2), cost minus WDV is Business Income, and the excess above cost is Capital Gains.`
      };
    } else if (A > C) {
      const businessIncome = A - C;
      return {
        type: 'between-wdv-cost',
        businessIncome: Math.max(0, businessIncome),
        capitalGains: 0,
        allowableDeduction: 0,
        explanation: `Sale proceeds (BDT ${(A/100000).toFixed(2)}L) exceed WDV (BDT ${(C/100000).toFixed(2)}L) but are within original cost (BDT ${(B/100000).toFixed(2)}L). Full gain of BDT ${(businessIncome/100000).toFixed(2)}L is Business Income.`
      };
    } else if (A < C) {
      const allowableDeduction = C - A;
      return {
        type: 'below-wdv',
        businessIncome: 0,
        capitalGains: 0,
        allowableDeduction: Math.max(0, allowableDeduction),
        explanation: `Sale proceeds (BDT ${(A/100000).toFixed(2)}L) are less than WDV (BDT ${(C/100000).toFixed(2)}L). The shortfall of BDT ${(allowableDeduction/100000).toFixed(2)}L is an allowable business expense under Sec. 46(4).`
      };
    } else {
      return {
        type: 'equal',
        businessIncome: 0,
        capitalGains: 0,
        allowableDeduction: 0,
        explanation: 'Sale proceeds equal tax WDV. No business income, capital gain, or deductible shortfall arises.'
      };
    }
  }, [calcCost, calcWdv, calcSale]);

  // Timeline Results
  const timelineResults = useMemo(() => {
    const endYear = accountingYear; // e.g. 2023 (June 30, 2023)
    const cutoffYear = endYear + 3;  // June 30, 2026
    const taxationIncomeYear = `1 July ${cutoffYear} – 30 June ${cutoffYear + 1}`; // FY 2026-27
    const assessmentYear = `AY ${cutoffYear + 1}–${cutoffYear + 2}`;

    return {
      accountingYearEnd: `30 June ${endYear}`,
      threeYearExpiry: `30 June ${cutoffYear}`,
      taxationIncomeYear,
      assessmentYear
    };
  }, [accountingYear]);

  const handleCopyRule = (scenario: Section46Scenario) => {
    const textToCopy = `[${scenario.sectionClause}] ${scenario.title}\nCondition: ${scenario.condition}\nTax Treatment: ${scenario.taxTreatment}\nExample: ${scenario.exampleText}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(scenario.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCSV = () => {
    const headers = ['Clause', 'Category', 'Scenario Title', 'Condition', 'Tax Treatment', 'Income Head', 'Example'];
    const rows = SECTION_46_SCENARIOS.map(s => [
      `"${s.sectionClause}"`,
      `"${s.category}"`,
      `"${s.title.replace(/"/g, '""')}"`,
      `"${s.condition.replace(/"/g, '""')}"`,
      `"${s.taxTreatment.replace(/"/g, '""')}"`,
      `"${s.incomeHead}"`,
      `"${s.exampleText.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Section_46_Deemed_Business_Income_Scenarios.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="not-prose my-12 bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Scale className="w-40 h-40 text-emerald-400" />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-extrabold uppercase tracking-widest px-3.5 py-1.5 rounded-full mb-3 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Interactive Statutory Matrix & Formula Explorer</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
            Section 46 Deemed Business Income Reference Hub
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
            Select any scenario to inspect dynamic formulas, calculation steps, 3-year cutoff timelines, and Finance Act 2026 amendments under Bangladesh Income Tax Act, 2023.
          </p>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-slate-800">
            <button
              onClick={() => setActiveTab('explorer')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                activeTab === 'explorer' 
                  ? 'bg-emerald-500 text-slate-950 shadow-md scale-102 ring-2 ring-emerald-300' 
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>1. Formulas & Steps Explorer</span>
            </button>

            <button
              onClick={() => setActiveTab('matrix')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                activeTab === 'matrix' 
                  ? 'bg-emerald-500 text-slate-950 shadow-md scale-102 ring-2 ring-emerald-300' 
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>2. Scenarios Matrix ({SECTION_46_SCENARIOS.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('calculator')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                activeTab === 'calculator' 
                  ? 'bg-emerald-500 text-slate-950 shadow-md scale-102 ring-2 ring-emerald-300' 
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>3. Asset Disposal Calculator</span>
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                activeTab === 'timeline' 
                  ? 'bg-emerald-500 text-slate-950 shadow-md scale-102 ring-2 ring-emerald-300' 
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>4. 3-Year Liability Cutoff Tool</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: DYNAMIC FORMULA & STEP-BY-STEP CALCULATION EXPLORER */}
      {activeTab === 'explorer' && (
        <div className="p-6 sm:p-8 bg-slate-50/50">
          <div className="mb-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-emerald-600" />
              <span>Select a Statutory Scenario to View Specific Formula & Steps:</span>
            </h3>

            {/* Toggleable Scenario Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.keys(FORMULA_GUIDES).map((key) => {
                const guide = FORMULA_GUIDES[key];
                const IconComp = guide.icon;
                const isSelected = selectedGuideKey === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedGuideKey(key)}
                    className={`text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected 
                        ? 'bg-gradient-to-br from-emerald-900 to-slate-900 text-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20 scale-[1.01]' 
                        : 'bg-white text-slate-800 border-slate-200/90 hover:border-emerald-300 hover:bg-emerald-50/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                        isSelected ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {guide.clause}
                      </span>
                    </div>
                    <div className="font-bold text-sm leading-snug line-clamp-2">
                      {guide.title}
                    </div>
                    <div className={`text-xs mt-2 flex items-center gap-1 font-semibold ${
                      isSelected ? 'text-emerald-400' : 'text-emerald-700'
                    }`}>
                      <span>Inspect calculation steps</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Scenario Formula & Step-by-step Detail View */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 shrink-0 mt-0.5">
                  <GuideIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-extrabold uppercase tracking-wider mb-1.5 border border-emerald-200/60">
                    <span>Statutory Reference: {selectedGuide.clause}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    {selectedGuide.title}
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm mt-1">
                    {selectedGuide.overview}
                  </p>
                </div>
              </div>
            </div>

            {/* Content Breakdown Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
              {/* Left Column: Formulas & Variable Definitions (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* Statutory Trigger Event */}
                <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 block mb-1">
                    ⚡ Statutory Trigger Condition
                  </span>
                  <p className="text-xs sm:text-sm text-emerald-950 font-medium leading-relaxed">
                    {selectedGuide.triggerEvent}
                  </p>
                </div>

                {/* Variable Definitions */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <ListOrdered className="w-4 h-4 text-emerald-600" />
                    <span>Key Calculation Variables</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {selectedGuide.variables.map((v) => (
                      <div key={v.symbol} className="bg-slate-50 p-3 rounded-xl border border-slate-200">
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
                    <span>Statutory Formulas & Rules</span>
                  </h4>
                  <div className="space-y-3">
                    {selectedGuide.formulas.map((f, idx) => (
                      <div key={idx} className="bg-slate-900 p-4 rounded-2xl text-white border border-slate-800">
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

                {/* Calculation Methodology Steps */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Step-by-Step Calculation Methodology</span>
                  </h4>
                  <div className="space-y-2">
                    {selectedGuide.calculationSteps.map((stepText, idx) => (
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

              {/* Right Column: Worked Numerical Example & Compliance Pitfall (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                {/* Worked Numerical Example Box */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 p-6 rounded-3xl text-white border border-slate-800 shadow-md">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                    <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>Worked Numerical Example</span>
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-extrabold">
                      Statutory Case
                    </span>
                  </div>

                  {/* Inputs */}
                  <div className="mb-4">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Given Figures:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedGuide.numericalExample.inputs.map((inp, idx) => (
                        <div key={idx} className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                          <span className="text-[10px] text-slate-400 block">{inp.label}</span>
                          <span className="text-xs font-bold text-emerald-300">{inp.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Calculation Breakdown */}
                  <div className="mb-4 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Step-by-Step Breakdown:</span>
                    {selectedGuide.numericalExample.steps.map((st, idx) => (
                      <div key={idx} className="bg-white/5 p-3 rounded-xl border border-white/10 text-xs">
                        <div className="text-slate-300 font-bold mb-0.5">{st.stepName}</div>
                        <div className="font-mono text-slate-400 text-[11px]">{st.calculation}</div>
                        <div className="text-emerald-400 font-bold mt-1 text-[11px]">→ {st.output}</div>
                      </div>
                    ))}
                  </div>

                  {/* Final Output Summary */}
                  <div className="p-3.5 bg-emerald-500/20 border border-emerald-400/40 rounded-xl">
                    <span className="text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider block mb-1">
                      Final Tax Return Effect:
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-white leading-snug">
                      {selectedGuide.numericalExample.finalResult}
                    </p>
                  </div>
                </div>

                {/* Compliance Pitfall Warning */}
                <div className="p-5 bg-amber-50 border border-amber-200 rounded-3xl text-amber-950">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider mb-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Audit & Compliance Pitfall Warning</span>
                  </div>
                  <p className="text-xs sm:text-sm text-amber-900 leading-relaxed font-medium">
                    {selectedGuide.compliancePitfall}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SCENARIOS MATRIX */}
      {activeTab === 'matrix' && (
        <div className="p-6 sm:p-8">
          {/* Controls Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200/80">
            {/* Search Box */}
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search rule, section, keyword (e.g. 3 years, insurance, bad debt, 12%)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0 hidden sm:inline" />
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    selectedCategory === cat 
                      ? 'bg-emerald-800 text-white shadow-xs' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              title="Download Section 46 Scenarios as CSV"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead className="bg-slate-900 text-white border-b-2 border-slate-800 text-xs uppercase tracking-wider font-extrabold">
                <tr>
                  <th className="py-3.5 px-4 w-28">Section Clause</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Scenario</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Criteria / Condition</th>
                  <th className="py-3.5 px-4 min-w-[220px]">Tax Treatment</th>
                  <th className="py-3.5 px-4 w-36">Head of Income</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Practical Example</th>
                  <th className="py-3.5 px-4 w-12 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 text-xs sm:text-sm bg-white">
                {filteredScenarios.length > 0 ? (
                  filteredScenarios.map((scenario) => (
                    <tr 
                      key={scenario.id} 
                      className="hover:bg-emerald-50/40 transition-colors group"
                    >
                      {/* Section Clause */}
                      <td className="py-4 px-4 align-top font-black text-emerald-800 shrink-0">
                        <span className="inline-block bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-md text-xs font-extrabold tracking-wide">
                          {scenario.sectionClause}
                        </span>
                      </td>

                      {/* Scenario Title */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-bold text-slate-900 leading-snug">
                          {scenario.title}
                        </div>
                      </td>

                      {/* Criteria / Condition */}
                      <td className="py-4 px-4 align-top text-xs text-slate-700 leading-relaxed font-medium">
                        <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/80">
                          <span className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">Trigger Condition:</span>
                          {scenario.condition}
                        </div>
                      </td>

                      {/* Statutory Tax Treatment */}
                      <td className="py-4 px-4 align-top text-slate-800 font-medium leading-relaxed">
                        <div>{scenario.taxTreatment}</div>
                        {scenario.formula && (
                          <div className="mt-1.5 p-1.5 bg-emerald-50/60 border border-emerald-200/70 rounded font-mono text-[11px] text-emerald-950 font-bold">
                            {scenario.formula}
                          </div>
                        )}
                        {scenario.subsequentRule && (
                          <div className="mt-1.5 text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                            <span>{scenario.subsequentRule}</span>
                          </div>
                        )}
                      </td>

                      {/* Head of Income Badge */}
                      <td className="py-4 px-4 align-top">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          scenario.incomeHead === 'Business Income'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : scenario.incomeHead === 'Capital Gains'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : scenario.incomeHead === 'Business Income & Capital Gains'
                            ? 'bg-purple-100 text-purple-900 border border-purple-300'
                            : 'bg-blue-100 text-blue-900 border border-blue-300'
                        }`}>
                          <Layers className="w-3 h-3 shrink-0" />
                          <span>{scenario.incomeHead}</span>
                        </span>
                      </td>

                      {/* Practical Example */}
                      <td className="py-4 px-4 align-top text-slate-600 text-xs leading-relaxed italic bg-slate-50/50 rounded-lg p-3">
                        {scenario.exampleText}
                      </td>

                      {/* Action (Copy) */}
                      <td className="py-4 px-4 align-top text-center">
                        <button
                          onClick={() => handleCopyRule(scenario)}
                          title="Copy rule text"
                          className="p-2 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-all cursor-pointer"
                        >
                          {copiedId === scenario.id ? (
                            <Check className="w-4 h-4 text-emerald-600 animate-in zoom-in-50" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-sm">No statutory scenarios matched your query "{searchQuery}".</p>
                      <button 
                        onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                        className="mt-3 text-xs text-emerald-700 font-bold underline hover:text-emerald-800"
                      >
                        Reset Filters
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: INTERACTIVE ASSET DISPOSAL CALCULATOR */}
      {activeTab === 'calculator' && (
        <div className="p-6 sm:p-8 bg-slate-50/50">
          <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 shrink-0">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Section 46(2) Asset Disposal & Balancing Charge Calculator
                </h3>
                <p className="text-slate-500 text-xs sm:text-sm">
                  Test custom asset sale proceeds against tax WDV and original acquisition cost to see the exact statutory split between Business Income, Capital Gains, or Allowable Deduction.
                </p>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Original Cost (BDT B)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">Tk.</span>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={calcCost}
                    onChange={(e) => setCalcCost(Number(e.target.value))}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">e.g. 20,00,000 (20 Lakhs)</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Tax WDV (BDT C)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">Tk.</span>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={calcWdv}
                    onChange={(e) => setCalcWdv(Number(e.target.value))}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">e.g. 12,00,000 (12 Lakhs)</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Sale / Insurance Proceeds (BDT A)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">Tk.</span>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={calcSale}
                    onChange={(e) => setCalcSale(Number(e.target.value))}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">e.g. 25,00,000 (25 Lakhs)</span>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap items-center gap-2 mb-8 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">Quick Presets:</span>
              <button
                onClick={() => { setCalcCost(2000000); setCalcWdv(1200000); setCalcSale(2500000); }}
                className="px-3 py-1 bg-white hover:bg-emerald-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:text-emerald-800 transition-all cursor-pointer"
              >
                Proceeds &gt; Cost (25L vs 20L)
              </button>
              <button
                onClick={() => { setCalcCost(2000000); setCalcWdv(1200000); setCalcSale(1700000); }}
                className="px-3 py-1 bg-white hover:bg-emerald-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:text-emerald-800 transition-all cursor-pointer"
              >
                Proceeds Between WDV & Cost (17L)
              </button>
              <button
                onClick={() => { setCalcCost(2000000); setCalcWdv(1200000); setCalcSale(1000000); }}
                className="px-3 py-1 bg-white hover:bg-emerald-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:text-emerald-800 transition-all cursor-pointer"
              >
                Proceeds Below WDV (10L)
              </button>
            </div>

            {/* Output Cards */}
            <div className="bg-gradient-to-br from-slate-900 to-emerald-950 p-6 rounded-2xl text-white shadow-md border border-slate-800">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Statutory Calculation Output</span>
                </span>
                <span className="text-xs text-slate-400 font-mono">Sec. 46(2) / Sec. 46(4)</span>
              </div>

              <p className="text-slate-300 text-xs sm:text-sm mb-6 leading-relaxed">
                {disposalResults.explanation}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Business Income Card */}
                <div className="bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-xs">
                  <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block mb-1">
                    Deemed Business Income
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-emerald-400">
                    Tk. {disposalResults.businessIncome.toLocaleString('en-BD')}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">Taxed under Business Head</span>
                </div>

                {/* Capital Gains Card */}
                <div className="bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-xs">
                  <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block mb-1">
                    Capital Gain
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-amber-400">
                    Tk. {disposalResults.capitalGains.toLocaleString('en-BD')}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">Taxed under Capital Gains Head</span>
                </div>

                {/* Allowable Deduction Card */}
                <div className="bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-xs">
                  <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider block mb-1">
                    Allowable Deduction
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-blue-400">
                    Tk. {disposalResults.allowableDeduction.toLocaleString('en-BD')}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">Deductible Expense (Sec. 46(4))</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: 3-YEAR LIABILITY TIMELINE CALCULATOR */}
      {activeTab === 'timeline' && (
        <div className="p-6 sm:p-8 bg-slate-50/50">
          <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Section 46(8) & Sec. 46(6A) 3-Year Liability Cutoff Tool
                </h3>
                <p className="text-slate-500 text-xs sm:text-sm">
                  Determine the exact statutory 3-year deadline and taxation year when unpaid supplier liabilities or unpaid interest expenses become deemed business income.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Accounting Income Year End
                </label>
                <select
                  value={accountingYear}
                  onChange={(e) => setAccountingYear(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
                >
                  <option value={2021}>FY 2020–21 (Ended 30 June 2021)</option>
                  <option value={2022}>FY 2021–22 (Ended 30 June 2022)</option>
                  <option value={2023}>FY 2022–23 (Ended 30 June 2023)</option>
                  <option value={2024}>FY 2023–24 (Ended 30 June 2024)</option>
                  <option value={2025}>FY 2024–25 (Ended 30 June 2025)</option>
                  <option value={2026}>FY 2025–26 (Ended 30 June 2026)</option>
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">Year in which expense deduction was claimed</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Unpaid Liability Amount (BDT)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">Tk.</span>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    value={liabilityAmount}
                    onChange={(e) => setLiabilityAmount(Number(e.target.value))}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">e.g. 5,00,000 (5 Lakhs)</span>
              </div>
            </div>

            {/* Timeline Visualizer */}
            <div className="bg-slate-900 p-6 rounded-2xl text-white border border-slate-800 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-6 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Statutory Cutoff Timeline
              </h4>

              <div className="relative border-l-2 border-emerald-500/40 ml-4 pl-6 space-y-6">
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900" />
                  <div className="text-xs text-slate-400 font-mono">Phase 1: Claim Deduction</div>
                  <div className="text-base font-bold text-white">FY {accountingYear - 1}–{accountingYear}</div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Expense of Tk. {liabilityAmount.toLocaleString('en-BD')} claimed in return. Year-end: <strong className="text-emerald-300">{timelineResults.accountingYearEnd}</strong>.
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-amber-500 border-2 border-slate-900" />
                  <div className="text-xs text-amber-400 font-mono">Phase 2: 3-Year Unsettled Grace Window</div>
                  <div className="text-base font-bold text-amber-200">Ends {timelineResults.threeYearExpiry}</div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    If liability remains unpaid continuously up to this date, Section 46(8) / 46(6A) triggers.
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-red-500 border-2 border-slate-900" />
                  <div className="text-xs text-red-400 font-mono">Phase 3: Deemed Business Income Inclusion</div>
                  <div className="text-base sm:text-lg font-black text-white">Income Year {timelineResults.taxationIncomeYear}</div>
                  <p className="text-xs text-emerald-300 mt-0.5 font-semibold">
                    Tk. {liabilityAmount.toLocaleString('en-BD')} added as Deemed Business Income in {timelineResults.assessmentYear}!
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 leading-relaxed flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong>Statutory Relief Proviso:</strong> If the business subsequently settles and pays the supplier or creditor in a later income year, the full amount paid (Tk. {liabilityAmount.toLocaleString('en-BD')}) is allowed as an allowable deduction in that later year's income tax return.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
