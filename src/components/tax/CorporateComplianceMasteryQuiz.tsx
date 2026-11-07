import React, { useState, useMemo } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  RotateCcw,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Building2,
  Scale,
  Rocket,
  Calculator,
  BookOpen,
  ShieldCheck,
  Filter
} from 'lucide-react';

export type QuizTopicCategory =
  | 'ALL'
  | 'BANKING_2_5'
  | 'BANK_MANDATES'
  | 'SEC_56_56KA'
  | 'STARTUP_SANDBOX';

export interface MasteryQuizQuestion {
  id: number;
  category: Exclude<QuizTopicCategory, 'ALL'>;
  categoryLabel: string;
  learningObjective: string;
  question: string;
  bengaliQuestion: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  statutoryReference: string;
}

export const CORPORATE_COMPLIANCE_QUIZ_QUESTIONS: MasteryQuizQuestion[] = [
  {
    id: 1,
    category: 'BANKING_2_5',
    categoryLabel: '2.5% Banking Compliance Rate',
    learningObjective: 'Test knowledge on the 2.5% tax reduction for formal banking compliance in corporate entities.',
    question:
      'A non-listed private limited company in Bangladesh earns BDT 10 Crore in taxable profit. If it satisfies all formal banking channel compliance mandates, how much corporate tax does it save via the 2.5% rate reduction compared to the non-compliant rate?',
    bengaliQuestion:
      'একটি অতালিকাভুক্ত প্রাইভেট লিমিটেড কোম্পানির করযোগ্য মুনাফা ১০ কোটি টাকা। আনুষ্ঠানিক ব্যাংকিং চ্যানেলের শর্তাবলি পূর্ণ করলে ২.৫% কর হ্রাসের ফলে কোম্পানিটি কত টাকা কর সাশ্রয় করবে?',
    options: [
      'BDT 15 Lakh (Rate drops from 27.5% to 26.0%)',
      'BDT 25 Lakh (Rate drops from 30.0% to 27.5%)',
      'BDT 50 Lakh (Rate drops from 32.5% to 27.5%)',
      'BDT 75 Lakh (Rate drops from 27.5% to 20.0%)'
    ],
    correctAnswer: 1,
    explanation:
      'Non-listed companies face a 30.0% corporate tax rate if they fail formal banking compliance, or receive a 2.5% reduced rate of 27.5% when fully compliant. On BDT 10 Crore profit, 2.5% equals BDT 25,00,000 (BDT 25 Lakh) in direct tax savings.',
    statutoryReference: 'Finance Act, 2026 & Seventh Schedule of the Income Tax Act, 2023'
  },
  {
    id: 2,
    category: 'BANKING_2_5',
    categoryLabel: '2.5% Banking Compliance Rate',
    learningObjective: 'Test knowledge on the 2.5% tax reduction for formal banking compliance in corporate entities.',
    question:
      'What are the applicable corporate tax rates for a publicly listed company that issued more than 10% of its paid-up capital via IPO, with and without formal banking channel compliance?',
    bengaliQuestion:
      'আইপিও (IPO)-এর মাধ্যমে ১০%-এর বেশি মূলধন ইস্যুকারী তালিকাভুক্ত কোম্পানির ক্ষেত্রে ব্যাংকিং শর্ত পরিপালনসহ এবং পরিপালন ছাড়া করহার কত?',
    options: [
      '20.0% (Banking Compliant) vs. 22.5% (Non-Compliant)',
      '22.5% (Banking Compliant) vs. 25.0% (Non-Compliant)',
      '25.0% (Banking Compliant) vs. 27.5% (Non-Compliant)',
      '15.0% (Banking Compliant) vs. 17.5% (Non-Compliant)'
    ],
    correctAnswer: 0,
    explanation:
      'Listed companies with >10% IPO capital qualify for the lowest standard corporate rate of 20.0% when all transactions follow formal banking mandates. Failure to comply adds 2.5%, raising the effective rate to 22.5%. (For listed companies with ≤10% IPO, the rates are 25.0% compliant vs. 27.5% non-compliant).',
    statutoryReference: 'Finance Act, 2026 — Corporate Tax Rate Schedule'
  },
  {
    id: 3,
    category: 'BANK_MANDATES',
    categoryLabel: 'Single & Annual Bank Transfer Mandates',
    learningObjective: 'Determine annual and transaction-based bank transfer mandates for commercial expenditure compliance.',
    question:
      'To qualify for the 2.5% reduced corporate tax rate, what are the mandatory single-transaction and annual aggregate thresholds for commercial expenses and purchases that must be routed through formal bank transfers?',
    bengaliQuestion:
      '২.৫% হ্রাসকৃত কর্পোরেট করহারের সুবিধা পেতে একক লেনদেন এবং বার্ষিক মোট ব্যয়ের কোন সীমার অতিরিক্ত অর্থ অবশ্যই ব্যাংক ট্রান্সফারের মাধ্যমে পরিশোধ করতে হবে?',
    options: [
      'Any single transaction exceeding BDT 1 Lakh and annual cash expenses exceeding BDT 12 Lakh',
      'Any single transaction exceeding BDT 5 Lakh and annual aggregate non-bank expenses exceeding BDT 36 Lakh',
      'Any single transaction exceeding BDT 10 Lakh and annual aggregate non-bank expenses exceeding BDT 50 Lakh',
      'Only salary and office rent payments; supplier purchases have no transaction cap'
    ],
    correctAnswer: 1,
    explanation:
      'Under the corporate tax banking mandate: (1) 100% of all income/receipts, loans, and investments received must be via bank transfer; (2) every single expense or purchase exceeding BDT 5,00,000 (5 Lakh) must be paid via formal bank transfer; and (3) total annual expenses outside bank transfers must not exceed BDT 36,00,000 (36 Lakh).',
    statutoryReference: 'Seventh Schedule, Income Tax Act, 2023 & Finance Act, 2026'
  },
  {
    id: 4,
    category: 'BANK_MANDATES',
    categoryLabel: 'Single & Annual Bank Transfer Mandates',
    learningObjective: 'Determine annual and transaction-based bank transfer mandates for commercial expenditure compliance.',
    question:
      'Under Section 55 of the Income Tax Act 2023, if a business makes general commercial payments (excluding salary, rent, and raw materials) where 60% of the total category is paid outside banking channels, what is the disallowance?',
    bengaliQuestion:
      'আয়কর আইন ২০২৩-এর ৫৫ ধারা অনুযায়ী, বেতন, ভাড়া ও কাঁচামাল ব্যতীত অন্যান্য সাধারণ ব্যবসায়িক ব্যয়ের ৫০%-এর বেশি (যেমন ৬০%) ব্যাংকিং চ্যানেলের বাইরে পরিশোধ করা হলে কত অংশ অননুমোদিত হবে?',
    options: [
      '100% of the entire expenditure ledger is disallowed',
      '25% of the amount paid outside the banking channel is disallowed',
      '50% of the banking-channel portion is disallowed',
      '10% flat penalty on annual gross turnover'
    ],
    correctAnswer: 1,
    explanation:
      'While salary and rental payments made outside banking channels face 100% disallowance under Section 55, other general business expenses (excluding salary, rent, and raw materials) trigger a disallowance when non-banking payments exceed 50% of the total—resulting in 25% of the non-banking portion being added back.',
    statutoryReference: 'Income Tax Act, 2023 — Section 55 (Banking Channel Disallowances)'
  },
  {
    id: 5,
    category: 'SEC_56_56KA',
    categoryLabel: 'Section 56 & 56Ka (50% Penalty)',
    learningObjective: 'Identify consequences for failing to comply with TDS mandates under Section 56 and 56Ka.',
    question:
      'Under the revised Section 56(1) / Section 56Ka (effective 1 July 2026), if a company pays BDT 2,00,000 to a vendor where 5% TDS (BDT 10,000) was mandatory but fails to deduct and deposit the TDS, what is the statutory financial consequence?',
    bengaliQuestion:
      'সংশোধিত ৫৬(১) / ৫৬ক ধারা অনুযায়ী, কোনো কোম্পানি ২,০০,০০০ টাকার বিলের ওপর প্রযোজ্য ৫% (১০,০০০ টাকা) উৎসে কর কর্তন ও জমা না করলে আইনি আর্থিক পরিণতি কী হবে?',
    options: [
      'The company must pay the BDT 10,000 TDS shortfall plus an additional 50% penalty on the shortfall (BDT 5,000), totaling BDT 15,000',
      'The company must pay 50% of the entire BDT 2,00,000 invoice amount (BDT 1,00,000) as tax',
      'Only a BDT 500 late filing fee applies with no recovery of the principal TDS',
      'The vendor’s trade license is automatically cancelled by the DCT'
    ],
    correctAnswer: 0,
    explanation:
      'Under Section 56(1)(a) / 56Ka as amended by the Finance Act 2026, failure to deduct, collect, or pay required TDS obligates the taxpayer to pay the tax shortfall (BDT 10,000) plus an additional 50% of that shortfall (BDT 5,000) = BDT 15,000 total.',
    statutoryReference: 'Income Tax Act, 2023 — Section 56(1)(a) / 56Ka (Finance Act, 2026)'
  },
  {
    id: 6,
    category: 'SEC_56_56KA',
    categoryLabel: 'Section 56 & 56Ka (50% Penalty)',
    learningObjective: 'Determine the 50 percent penalty for non compliance with Section 56 and 56Ka.',
    question:
      'Suppose required TDS + 50% additional amount under Section 56(1)(a) equals BDT 15,000, and the tax authority recovers BDT 9,000 through enforcement action under Section 143. How is the remaining liability determined under Section 56(1)(b) / 56Ka?',
    bengaliQuestion:
      'ধরা যাক ৫৬(১)(ক) ধারা অনুযায়ী প্রদেয় কর ও ৫০% জরিমানাসহ মোট অংক ১৫,০০০ টাকা, এবং ১৪৩ ধারার অধীনে ৯,০০০ টাকা আদায় করা হয়েছে। ৫৬(১)(খ) ধারা অনুযায়ী অবশিষ্ট দায় কীভাবে নির্ধারিত হবে?',
    options: [
      'No further amount is payable once Section 143 action is initiated',
      'Only the BDT 6,000 difference is payable without any additional penalty',
      'The BDT 6,000 difference plus an additional 50% of that difference (BDT 3,000), totaling BDT 9,000',
      'Double the original invoice value is added to net wealth'
    ],
    correctAnswer: 2,
    explanation:
      'Under Section 56(1)(b), where the tax recovered following action under Section 143 (BDT 9,000) is less than the amount determined under clause (a) (BDT 15,000), the difference (BDT 6,000) PLUS an additional 50% of that difference (BDT 3,000) = BDT 9,000 is payable.',
    statutoryReference: 'Income Tax Act, 2023 — Section 56(1)(b) & Section 143'
  },
  {
    id: 7,
    category: 'SEC_56_56KA',
    categoryLabel: 'Section 56 & 56Ka (50% Penalty)',
    learningObjective: 'Differentiate the 50 percent penalty for non compliance under Section 56 and 56Ka.',
    question:
      'How does the 2026–27 treatment under Section 56(1) / 56Ka and Section 56(2) differ from the prior "Special Business Income" regime and Section 264 PSR rules?',
    bengaliQuestion:
      '২০২৬-২৭ অর্থবছরের ৫৬(১)/৫৬ক এবং ৫৬(২) ধারার বিধান পূর্ববর্তী "বিশেষ ব্যবসায়িক আয়" (Special Business Income) এবং ২৬৪ ধারার পিএসআর (PSR) বিধান থেকে কীভাবে আলাদা?',
    options: [
      'Section 56(1)/56Ka imposes TDS shortfall + 50% of the tax shortfall; Section 56(2) treats Section 55 disallowed expenses as business income; whereas Section 264 increases the TDS deduction rate by 50% when a payee lacks PSR',
      'All three sections impose a flat 50% tax on gross company revenue',
      'Section 56(2) permanently bans all loss carry-forward for 10 years on every company',
      'Section 55(a) still disallows 100% of every non-TDS invoice in addition to a 50% invoice fine'
    ],
    correctAnswer: 0,
    explanation:
      'Crucial statutory distinction: (1) Section 55(a) was deleted effective 1 July 2026; TDS omissions are now penalized under Section 56(1)/56Ka at 100% of the tax shortfall + 50% penalty on that shortfall. (2) Section 56(2) treats Section 55 inadmissible deductions (e.g., excess perquisites, entertainment, royalty caps) as regular business/professional income rather than "Special Business Income". (3) Under Section 264, if a payee fails to provide PSR, the withholding tax rate itself rises by 50%.',
    statutoryReference: 'Income Tax Act, 2023 — Sections 55, 56(1), 56(2) & 264 (Finance Act, 2026)'
  },
  {
    id: 8,
    category: 'STARTUP_SANDBOX',
    categoryLabel: 'Startup Sandbox (9-Yr & 0% Tax)',
    learningObjective: 'Identify the specific turnover tax rate and loss carry forward period for registered startups.',
    question:
      'Under Part 2 of the Eighth Schedule (Startup Sandbox) of the Income Tax Act 2023, what is the special loss carry-forward period for an NBR-registered startup, and how does its Sandbox turnover tax regime compare to ordinary companies?',
    bengaliQuestion:
      'আয়কর আইন ২০২৩-এর অষ্টম তফসিলের অংশ ২ (স্টার্টআপ স্যান্ডবক্স) অনুযায়ী, নিবন্ধিত স্টার্টআপের ক্ষতি জের টানার (Loss Carry-Forward) মেয়াদ কত বছর এবং ন্যূনতম টার্নওভার করের বিধান কী?',
    options: [
      '6 years loss carry-forward and 0.60% minimum turnover tax',
      '9 successive assessment years loss carry-forward, with 0% turnover tax during qualifying growth years (and 0.1% sandbox concessionary rate where applicable)',
      '3 years loss carry-forward and 1.00% minimum turnover tax',
      'Unlimited loss carry-forward for all unregistered partnerships at 0.25% turnover tax'
    ],
    correctAnswer: 1,
    explanation:
      'Under the Startup Sandbox (Eighth Schedule, Part 2), NBR-registered startups enjoy a 9-year loss carry-forward period (vs. 6 years for ordinary businesses under Section 70) even if shareholding changes through new investment, alongside relief from Section 163 minimum turnover tax (0% during qualifying Sandbox growth years / 0.1% concessionary startup rate).',
    statutoryReference: 'Income Tax Act, 2023 — Eighth Schedule, Part 2 (Startup Sandbox) & Finance Act, 2026'
  },
  {
    id: 9,
    category: 'STARTUP_SANDBOX',
    categoryLabel: 'Startup Sandbox (9-Yr & 0% Tax)',
    learningObjective: 'Apply the 0% turnover tax criteria for startups within their 9 year growth cycle.',
    question:
      'Which of the following compliance conditions must a startup fulfill to apply the 0% turnover tax relief and Sections 55/56 disallowance exemption during its growth cycle under the Startup Sandbox?',
    bengaliQuestion:
      'স্টার্টআপ স্যান্ডবক্সের অধীনে গ্রোথ ইয়ারে ০% টার্নওভার কর এবং ৫৫ ও ৫৬ ধারার ব্যয় কর্তন অব্যাহতি পেতে কোন শর্তাবলি পূরণ করা আবশ্যক?',
    options: [
      'Merely using the word "Tech" or "Startup" in the RJSC trade name without NBR registration',
      'Formal NBR Startup Sandbox registration, not formed by splitting/reconstructing an existing business, regular return filing, and granting "Read-Only" digital platform access under Section 129.4',
      'Granting the DCT full read-and-write administrative control to edit company invoices',
      'Paying 100% of vendor bills in physical cash to avoid bank fees'
    ],
    correctAnswer: 1,
    explanation:
      'To qualify for Startup Sandbox growth-year benefits (0% turnover tax relief, exemption from Sections 55 & 56 disallowances, and 9-year loss carry-forward), the company must be registered with the NBR under the Startup Sandbox, deploy innovation/technology without splitting an existing business, file annual returns, and provide "Read-Only" digital record access under Section 129.4.',
    statutoryReference: 'Income Tax Act, 2023 — Eighth Schedule Part 2 & Section 129.4 (Income Tax Circular 2026–27)'
  }
];

interface CorporateComplianceMasteryQuizProps {
  defaultTab?: 'quiz' | 'simulators';
  initialTopic?: QuizTopicCategory;
  className?: string;
}

export const CorporateComplianceMasteryQuiz: React.FC<CorporateComplianceMasteryQuizProps> = ({
  defaultTab = 'quiz',
  initialTopic = 'ALL',
  className = ''
}) => {
  const [activeMode, setActiveMode] = useState<'quiz' | 'simulators'>(defaultTab);
  const [selectedTopic, setSelectedTopic] = useState<QuizTopicCategory>(initialTopic);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Simulator 1: Banking Mandate & 2.5% Corporate Tax Reduction
  const [simCompanyType, setSimCompanyType] = useState<'non_listed' | 'listed_over_10' | 'listed_under_10'>('non_listed');
  const [simProfitBdt, setSimProfitBdt] = useState<number>(100000000); // 10 Crore
  const [simMaxSingleCashTx, setSimMaxSingleCashTx] = useState<number>(350000); // 3.5 Lakh
  const [simAnnualCashExp, setSimAnnualCashExp] = useState<number>(2800000); // 28 Lakh
  const [simAllReceiptsBanked, setSimAllReceiptsBanked] = useState<boolean>(true);

  // Simulator 2: Section 56 & 56Ka 50% Penalty Calculator
  const [simInvoiceAmount, setSimInvoiceAmount] = useState<number>(200000);
  const [simTdsRate, setSimTdsRate] = useState<number>(5);
  const [simTdsDeducted, setSimTdsDeducted] = useState<number>(0);
  const [simRecoveredSec143, setSimRecoveredSec143] = useState<number>(0);

  // Simulator 3: Startup Sandbox (9-Year Growth Cycle & 0% Turnover Tax)
  const [simStartupTurnover, setSimStartupTurnover] = useState<number>(50000000); // 5 Crore
  const [simGrowthYear, setSimGrowthYear] = useState<number>(3); // Year 3 of 9
  const [simNbrRegistered, setSimNbrRegistered] = useState<boolean>(true);
  const [simReadOnlyAccess, setSimReadOnlyAccess] = useState<boolean>(true);
  const [simNotReconstructed, setSimNotReconstructed] = useState<boolean>(true);

  const filteredQuestions = useMemo(() => {
    if (selectedTopic === 'ALL') return CORPORATE_COMPLIANCE_QUIZ_QUESTIONS;
    return CORPORATE_COMPLIANCE_QUIZ_QUESTIONS.filter(q => q.category === selectedTopic);
  }, [selectedTopic]);

  const currentQ = filteredQuestions[currentIdx] || filteredQuestions[0];

  const handleTopicChange = (topic: QuizTopicCategory) => {
    setSelectedTopic(topic);
    setCurrentIdx(0);
    setSelectedOption(null);
    setHasAnswered(false);
    setScore(0);
    setIsCompleted(false);
  };

  const handleSelectOption = (idx: number) => {
    if (hasAnswered) return;
    setSelectedOption(idx);
    setHasAnswered(true);
    if (idx === currentQ.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentIdx < filteredQuestions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedOption(null);
      setHasAnswered(false);
    } else {
      setIsCompleted(true);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setHasAnswered(false);
    setScore(0);
    setIsCompleted(false);
  };

  // Simulator 1 Computation
  const bankingEval = useMemo(() => {
    const singleTxPass = simMaxSingleCashTx <= 500000;
    const annualExpPass = simAnnualCashExp <= 3600000;
    const isCompliant = singleTxPass && annualExpPass && simAllReceiptsBanked;

    const baseRates = {
      non_listed: { compliant: 27.5, nonCompliant: 30.0, label: 'Non-Listed Private Ltd / OPC' },
      listed_over_10: { compliant: 20.0, nonCompliant: 22.5, label: 'Listed Company (>10% IPO)' },
      listed_under_10: { compliant: 25.0, nonCompliant: 27.5, label: 'Listed Company (≤10% IPO)' }
    }[simCompanyType];

    const appliedRate = isCompliant ? baseRates.compliant : baseRates.nonCompliant;
    const compliantTax = Math.round(simProfitBdt * (baseRates.compliant / 100));
    const nonCompliantTax = Math.round(simProfitBdt * (baseRates.nonCompliant / 100));
    const taxDifferential = nonCompliantTax - compliantTax;

    return {
      singleTxPass,
      annualExpPass,
      isCompliant,
      baseRates,
      appliedRate,
      compliantTax,
      nonCompliantTax,
      taxDifferential
    };
  }, [simCompanyType, simProfitBdt, simMaxSingleCashTx, simAnnualCashExp, simAllReceiptsBanked]);

  // Simulator 2 Computation
  const sec56Eval = useMemo(() => {
    const requiredTds = Math.round(simInvoiceAmount * (simTdsRate / 100));
    const shortfall = Math.max(0, requiredTds - simTdsDeducted);
    const penalty50Percent = Math.round(shortfall * 0.5);
    const clauseATotal = shortfall + penalty50Percent;

    const diffAfter143 = Math.max(0, clauseATotal - simRecoveredSec143);
    const clauseBPenalty50 = simRecoveredSec143 > 0 ? Math.round(diffAfter143 * 0.5) : 0;
    const clauseBTotalRemaining = diffAfter143 + clauseBPenalty50;

    return {
      requiredTds,
      shortfall,
      penalty50Percent,
      clauseATotal,
      diffAfter143,
      clauseBPenalty50,
      clauseBTotalRemaining
    };
  }, [simInvoiceAmount, simTdsRate, simTdsDeducted, simRecoveredSec143]);

  // Simulator 3 Computation
  const startupEval = useMemo(() => {
    const inGrowthWindow = simGrowthYear >= 1 && simGrowthYear <= 9;
    const qualifiesSandbox = simNbrRegistered && simReadOnlyAccess && simNotReconstructed && inGrowthWindow;
    const standardTurnoverTax = Math.round(simStartupTurnover * 0.006); // 0.60% general
    const sandboxPointOneTax = Math.round(simStartupTurnover * 0.001); // 0.10% legacy/concessionary
    const growthCycleZeroTax = 0; // 0% under growth cycle criteria

    return {
      inGrowthWindow,
      qualifiesSandbox,
      standardTurnoverTax,
      sandboxPointOneTax,
      growthCycleZeroTax,
      lossCarryForwardYears: qualifiesSandbox ? 9 : 6
    };
  }, [simStartupTurnover, simGrowthYear, simNbrRegistered, simReadOnlyAccess, simNotReconstructed]);

  return (
    <div className={`bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden ${className}`}>
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 border-b border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>FY 2026–27 Corporate Compliance &amp; Sandbox Mastery</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              2.5% Banking Rule, Section 56/56Ka Penalties &amp; Startup Sandbox Assessment
            </h3>
            <p className="text-slate-300 text-sm mt-1.5 max-w-3xl leading-relaxed">
              Verify statutory mastery of the 2.5% corporate banking compliance reduction, BDT 5L/36L bank transfer mandates, Section 56 &amp; 56Ka 50% TDS penalties, and the 9-year Startup Sandbox (0% / 0.1% turnover tax).
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-800 p-1 rounded-2xl border border-slate-700 shrink-0 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setActiveMode('quiz')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeMode === 'quiz'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Knowledge Quiz ({CORPORATE_COMPLIANCE_QUIZ_QUESTIONS.length} Qs)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('simulators')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeMode === 'simulators'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Rule Evaluators (3 Tools)</span>
            </button>
          </div>
        </div>

        {/* Core Learning Objectives Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3">
            <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>2.5% Banking Tax Reduction</span>
            </div>
            <p className="text-slate-300 leading-snug">
              20% / 25% / 27.5% compliant corporate rates vs. +2.5% penalty for cash transactions.
            </p>
          </div>
          <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3">
            <div className="font-bold text-cyan-400 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>BDT 5L &amp; 36L Bank Mandates</span>
            </div>
            <p className="text-slate-300 leading-snug">
              Single expense &gt; BDT 5 Lakh &amp; annual expenses &gt; BDT 36 Lakh require formal bank transfer.
            </p>
          </div>
          <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3">
            <div className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" />
              <span>Sec 56 &amp; 56Ka 50% Penalty</span>
            </div>
            <p className="text-slate-300 leading-snug">
              TDS shortfall + 50% penalty under Sec 56(1)/56Ka; Sec 55 disallowances added back under Sec 56(2).
            </p>
          </div>
          <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3">
            <div className="font-bold text-purple-400 mb-1 flex items-center gap-1.5">
              <Rocket className="w-3.5 h-3.5" />
              <span>Startup Sandbox (9-Yr Cycle)</span>
            </div>
            <p className="text-slate-300 leading-snug">
              9-year loss carry-forward, 0% growth-cycle / 0.1% turnover tax &amp; Sec 129.4 read-only access.
            </p>
          </div>
        </div>
      </div>

      {activeMode === 'quiz' ? (
        <div className="p-6 sm:p-8">
          {/* Topic Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5 text-emerald-600" />
                Topic:
              </span>
              {[
                { id: 'ALL' as QuizTopicCategory, label: 'All Objectives (9)' },
                { id: 'BANKING_2_5' as QuizTopicCategory, label: '2.5% Banking Rate (2)' },
                { id: 'BANK_MANDATES' as QuizTopicCategory, label: 'BDT 5L / 36L Mandates (2)' },
                { id: 'SEC_56_56KA' as QuizTopicCategory, label: 'Section 56 & 56Ka 50% Penalty (3)' },
                { id: 'STARTUP_SANDBOX' as QuizTopicCategory, label: 'Startup 9-Yr & 0% Turnover Tax (2)' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTopicChange(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedTopic === tab.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {!isCompleted && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Question</span>
                <span className="text-sm font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  {currentIdx + 1} of {filteredQuestions.length}
                </span>
              </div>
            )}
          </div>

          {!isCompleted ? (
            <div>
              {/* Learning Objective Tag */}
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                  {currentQ.categoryLabel}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Objective: {currentQ.learningObjective}
                </span>
              </div>

              {/* Question Text */}
              <div className="mb-6">
                <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {currentQ.question}
                </h4>
                <p className="text-sm font-medium text-emerald-800 mt-1.5">
                  {currentQ.bengaliQuestion}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3 mb-6">
                {currentQ.options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === currentQ.correctAnswer;

                  let btnClass = 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800';
                  if (hasAnswered) {
                    if (isCorrect) {
                      btnClass =
                        'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold ring-2 ring-emerald-400';
                    } else if (isSelected) {
                      btnClass = 'border-red-500 bg-red-50 text-red-900 font-semibold ring-2 ring-red-400';
                    } else {
                      btnClass = 'border-slate-200 bg-slate-50 text-slate-400 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectOption(idx)}
                      disabled={hasAnswered}
                      className={`w-full text-left p-4 rounded-2xl border text-sm transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer ${btnClass}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="leading-snug">{option}</span>
                      </div>

                      {hasAnswered && (
                        <div className="shrink-0">
                          {isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          ) : isSelected ? (
                            <XCircle className="w-5 h-5 text-red-600" />
                          ) : null}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation Box */}
              {hasAnswered && (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 mb-6 text-sm">
                  <div className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-emerald-600" />
                    <span>Statutory Analysis &amp; Differentiation:</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed mb-2.5">{currentQ.explanation}</p>
                  <div className="text-xs text-slate-500 font-semibold">
                    Statutory Authority: <span className="text-slate-800">{currentQ.statutoryReference}</span>
                  </div>
                </div>
              )}

              {/* Footer Next Button */}
              {hasAnswered && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow transition-all inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span>
                      {currentIdx < filteredQuestions.length - 1 ? 'Next Question' : 'View Assessment Score'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-4">
                <Award className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-bold text-slate-900 mb-2">Assessment Completed!</h4>
              <p className="text-slate-600 text-sm max-w-md mx-auto mb-6">
                You scored <strong className="text-emerald-700 text-lg">{score}</strong> out of{' '}
                <strong className="text-slate-900 text-lg">{filteredQuestions.length}</strong> on the Corporate Tax, Section 56/56Ka &amp; Startup Sandbox Mastery Check.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleRestartQuiz}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retake Quiz</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMode('simulators')}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Open Interactive Rule Evaluators</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Interactive Simulators Mode */
        <div className="p-6 sm:p-8 space-y-8 bg-slate-50/60">
          {/* Simulator 1: 2.5% Banking Compliance & BDT 5L / 36L Mandate Evaluator */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs">
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-bold text-slate-900">
                  1. Corporate 2.5% Banking Reduction &amp; BDT 5L / 36L Mandate Validator
                </h4>
                <p className="text-xs text-slate-500">
                  Tests compliance with the BDT 5,00,000 single-transaction mandate, BDT 36,00,000 annual limit, and 100% receipt banking rule.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Corporate Entity Category
                  </label>
                  <select
                    value={simCompanyType}
                    onChange={e => setSimCompanyType(e.target.value as 'non_listed' | 'listed_over_10' | 'listed_under_10')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium bg-white"
                  >
                    <option value="non_listed">Non-Listed Company (27.5% vs 30%)</option>
                    <option value="listed_over_10">Listed &gt;10% IPO (20% vs 22.5%)</option>
                    <option value="listed_under_10">Listed ≤10% IPO (25% vs 27.5%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Annual Taxable Profit (BDT)
                  </label>
                  <input
                    type="number"
                    value={simProfitBdt}
                    onChange={e => setSimProfitBdt(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Largest Single Non-Bank Expense (Cap: BDT 5,00,000)
                  </label>
                  <input
                    type="number"
                    value={simMaxSingleCashTx}
                    onChange={e => setSimMaxSingleCashTx(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Annual Total Non-Bank Expenses (Cap: BDT 36,00,000)
                  </label>
                  <input
                    type="number"
                    value={simAnnualCashExp}
                    onChange={e => setSimAnnualCashExp(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <input
                      type="checkbox"
                      checked={simAllReceiptsBanked}
                      onChange={e => setSimAllReceiptsBanked(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                    <span className="text-xs sm:text-sm font-semibold text-slate-800">
                      100% of sales receipts, revenues, loans, and advances were received through formal banking channels
                    </span>
                  </label>
                </div>
              </div>

              <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                    Mandate Status
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      bankingEval.isCompliant
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-red-500/20 text-red-300 border border-red-500/40'
                    }`}
                  >
                    {bankingEval.isCompliant ? 'QUALIFIES FOR 2.5% REDUCTION' : '+2.5% PENALTY TRIGGERED'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs border-y border-slate-800 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Single Tx ≤ BDT 5,00,000:</span>
                    <span className={bankingEval.singleTxPass ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                      {bankingEval.singleTxPass ? 'PASS' : 'BREACHED (> 5L)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Annual Non-Bank ≤ BDT 36,00,000:</span>
                    <span className={bankingEval.annualExpPass ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                      {bankingEval.annualExpPass ? 'PASS' : 'BREACHED (> 36L)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">100% Receipts &amp; Loans via Bank:</span>
                    <span className={simAllReceiptsBanked ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                      {simAllReceiptsBanked ? 'PASS' : 'BREACHED'}
                    </span>
                  </div>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <div className="text-xs text-slate-400">Applicable Corporate Rate</div>
                    <div className="text-2xl font-extrabold text-emerald-400">{bankingEval.appliedRate}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">2.5% Tax Impact</div>
                    <div className="text-base font-bold text-white">
                      BDT {bankingEval.taxDifferential.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Simulator 2: Section 56 & 56Ka 50% Penalty Calculator */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs">
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-bold text-slate-900">
                  2. Section 56 &amp; 56Ka Non-Compliance 50% Penalty Calculator
                </h4>
                <p className="text-xs text-slate-500">
                  Computes the unpaid TDS shortfall + 50% penalty under Section 56(1)(a) &amp; Section 143 recovery differential under Section 56(1)(b).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Gross Payment / Invoice Amount (BDT)
                  </label>
                  <input
                    type="number"
                    value={simInvoiceAmount}
                    onChange={e => setSimInvoiceAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mandatory TDS Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={simTdsRate}
                    onChange={e => setSimTdsRate(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Actual TDS Deducted &amp; Paid (BDT)
                  </label>
                  <input
                    type="number"
                    value={simTdsDeducted}
                    onChange={e => setSimTdsDeducted(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Amount Recovered Under Sec 143 (Optional, BDT)
                  </label>
                  <input
                    type="number"
                    value={simRecoveredSec143}
                    onChange={e => setSimRecoveredSec143(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-5 space-y-2.5 text-xs">
                <div className="font-bold text-amber-400 uppercase tracking-wider">
                  Section 56(1) / 56Ka Calculation Breakdown
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Required Statutory TDS ({simTdsRate}%):</span>
                  <span className="font-bold text-white">BDT {sec56Eval.requiredTds.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Unpaid TDS Shortfall:</span>
                  <span className="font-bold text-amber-300">BDT {sec56Eval.shortfall.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>+ 50% Penalty on Shortfall (Sec 56(1)(a)):</span>
                  <span className="font-bold text-red-400">+ BDT {sec56Eval.penalty50Percent.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-2 text-sm font-extrabold text-white">
                  <span>Total Payable Under Sec 56(1)(a):</span>
                  <span className="text-emerald-400">BDT {sec56Eval.clauseATotal.toLocaleString('en-IN')}</span>
                </div>
                {simRecoveredSec143 > 0 && (
                  <div className="border-t border-slate-800 pt-2 space-y-1 text-slate-300">
                    <div className="flex justify-between">
                      <span>Difference After Sec 143 Recovery:</span>
                      <span>BDT {sec56Eval.diffAfter143.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-amber-300 font-bold">
                      <span>Sec 56(1)(b) Balance + 50% Penalty:</span>
                      <span>BDT {sec56Eval.clauseBTotalRemaining.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Simulator 3: Startup Sandbox 9-Year Growth Cycle & 0% Turnover Tax Evaluator */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs">
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <Rocket className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-bold text-slate-900">
                  3. Startup Sandbox Evaluator (9-Year Growth Cycle, 0% / 0.1% Turnover Tax &amp; Loss Carry-Forward)
                </h4>
                <p className="text-xs text-slate-500">
                  Evaluates Eighth Schedule Part 2 Startup Sandbox eligibility, 9-year loss carry-forward, and 0% growth-year turnover tax criteria.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Annual Startup Turnover / Receipts (BDT)
                  </label>
                  <input
                    type="number"
                    value={simStartupTurnover}
                    onChange={e => setSimStartupTurnover(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Current Growth Cycle Year (1 to 12)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={simGrowthYear}
                    onChange={e => setSimGrowthYear(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold"
                  />
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <input
                      type="checkbox"
                      checked={simNbrRegistered}
                      onChange={e => setSimNbrRegistered(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                    <span className="text-xs font-semibold text-slate-800">
                      Registered with NBR under Startup Sandbox (Eighth Schedule, Part 2)
                    </span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer select-none p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <input
                      type="checkbox"
                      checked={simReadOnlyAccess}
                      onChange={e => setSimReadOnlyAccess(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                    <span className="text-xs font-semibold text-slate-800">
                      Granted &quot;Read-Only&quot; digital platform access to tax authorities (Section 129.4)
                    </span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer select-none p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <input
                      type="checkbox"
                      checked={simNotReconstructed}
                      onChange={e => setSimNotReconstructed(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                    <span className="text-xs font-semibold text-slate-800">
                      Independent technology/innovation venture (Not formed by splitting/reconstructing an existing business)
                    </span>
                  </label>
                </div>
              </div>

              <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-5 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Sandbox Status</span>
                  <span
                    className={`px-2.5 py-1 rounded-full font-bold ${
                      startupEval.qualifiesSandbox
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {startupEval.qualifiesSandbox ? 'SANDBOX GROWTH RELIEF ACTIVE' : 'STANDARD CORPORATE RULES'}
                  </span>
                </div>

                <div className="space-y-1.5 border-y border-slate-800 py-3">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Loss Carry-Forward Period:</span>
                    <span className="font-bold text-emerald-400">
                      {startupEval.lossCarryForwardYears} Successive Assessment Years
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Sections 55 &amp; 56 Disallowances:</span>
                    <span className="font-bold text-white">
                      {startupEval.qualifiesSandbox ? 'Exempt During Growth Years' : 'Applicable'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Growth Cycle 0% Turnover Tax:</span>
                    <span className="font-bold text-emerald-400">
                      {startupEval.qualifiesSandbox
                        ? 'BDT 0 (0% Growth Cycle Criteria Met)'
                        : `BDT ${startupEval.standardTurnoverTax.toLocaleString('en-IN')} (0.60% Standard)`}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Reference 0.1% Sandbox Rate:</span>
                    <span>BDT {startupEval.sandboxPointOneTax.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
