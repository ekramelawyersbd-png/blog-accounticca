import React, { useState } from 'react';
import { 
  Calculator, 
  BookOpen, 
  Scale, 
  ShieldCheck, 
  AlertTriangle, 
  Layers, 
  Percent, 
  FileText, 
  Copy, 
  Check, 
  ExternalLink, 
  ArrowRight, 
  Sparkles, 
  HelpCircle, 
  RotateCcw, 
  CheckCircle2, 
  XCircle,
  Building,
  UserCheck,
  Coins,
  ChevronRight,
  Info
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { glossaryTerms, GlossaryTerm } from '../../data/glossaryData';

interface InteractiveKeyTermsEducatorProps {
  onOpenModal?: (term: GlossaryTerm) => void;
}

type KeyTermId = 'tds' | 'vat' | 'sixth-schedule' | 'vds' | 'psr' | 'min-tax';
type TabMode = 'concept' | 'simulator' | 'lifecycle' | 'penalties' | 'quiz';

export const InteractiveKeyTermsEducator: React.FC<InteractiveKeyTermsEducatorProps> = ({ onOpenModal }) => {
  const [selectedTermId, setSelectedTermId] = useState<KeyTermId>('tds');
  const [activeTab, setActiveTab] = useState<TabMode>('concept');
  const [bilingual, setBilingual] = useState<'en' | 'bn'>('en');
  const [copied, setCopied] = useState(false);

  // --- TDS Simulator State ---
  const [tdsCategory, setTdsCategory] = useState<'rent' | 'contractor' | 'supplies' | 'lottery' | 'freelance' | 'salary'>('rent');
  const [tdsAmount, setTdsAmount] = useState<number>(100000);
  const [payeeHasPsr, setPayeeHasPsr] = useState<boolean>(true);

  // --- VAT Simulator State ---
  const [vatBaseAmount, setVatBaseAmount] = useState<number>(200000);
  const [vatRateType, setVatRateType] = useState<'standard' | 'truncated5' | 'truncated75' | 'truncated10' | 'turnover4' | 'zero'>('standard');
  const [isVdsApplicable, setIsVdsApplicable] = useState<boolean>(true);

  // --- Sixth Schedule Simulator State ---
  const [taxableIncome, setTaxableIncome] = useState<number>(1200000);
  const [dpsAmount, setDpsAmount] = useState<number>(100000);
  const [lifeInsurance, setLifeInsurance] = useState<number>(50000);
  const [bondsOrSanchay, setBondsOrSanchay] = useState<number>(100000);
  const [stocksAmount, setStocksAmount] = useState<number>(0);

  // --- Mini Quiz State ---
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number | null>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<string, boolean>>({});

  // Calculations for TDS Simulator
  const calculateTds = () => {
    let baseRate = 0.05; // 5% default for rent
    let section = 'Section 109 (House Property Rent)';
    let isMinTax = false;
    let ruleNote = 'Deducted by withholding entities from office or commercial premises rent.';

    switch (tdsCategory) {
      case 'rent':
        baseRate = 0.05;
        section = 'Section 109 (House Property Rent)';
        isMinTax = false;
        ruleNote = 'Tenant company/NGO must deduct 5% from monthly gross rent exceeding threshold.';
        break;
      case 'contractor':
        baseRate = 0.10; // 10%
        section = 'Section 89 / 90 (Contractor & Professional Fees)';
        isMinTax = false;
        ruleNote = 'Professional, advisory, and execution contractor bills carry 10% to 12% statutory withholding.';
        break;
      case 'supplies':
        baseRate = 0.05; // 5% supply
        section = 'Section 89 (Supply of Goods & Materials)';
        isMinTax = true;
        ruleNote = 'Base rate 2% to 7% depending on supply slab; treated as Minimum Tax under Section 163.';
        break;
      case 'lottery':
        baseRate = 0.25; // 25% under amended ITA 2023 / Finance Act 2026
        section = 'Section 118 (Lottery & Gaming Winnings)';
        isMinTax = true;
        ruleNote = 'Amended to 25% under Finance Act, 2026. Must be deducted before disbursing prize funds.';
        break;
      case 'freelance':
        baseRate = 0.0; // 0% if qualifying ITES under Sixth Schedule Part A
        section = 'Section 124 & Sixth Schedule Part A, Para 21';
        isMinTax = false;
        ruleNote = 'Inward remittances from 27 listed ITES services brought via banking channel are 100% tax-exempt.';
        break;
      case 'salary':
        baseRate = 0.10; // Estimated slab average
        section = 'Section 86 (Salary Withholding)';
        isMinTax = false;
        ruleNote = 'Calculated based on annual estimated taxable salary divided across 12 monthly pay cycles.';
        break;
    }

    // 50% penalty rate if payee has no PSR (Section 264)
    const effectiveRate = payeeHasPsr ? baseRate : baseRate * 1.5;
    const calculatedTds = Math.round(tdsAmount * effectiveRate);
    const netPayable = tdsAmount - calculatedTds;

    return {
      baseRate,
      effectiveRate,
      calculatedTds,
      netPayable,
      section,
      isMinTax,
      ruleNote
    };
  };

  // Calculations for VAT Simulator
  const calculateVat = () => {
    let rate = 0.15;
    let label = '15% Standard VAT (Input Tax Credit Allowed)';
    let vdsRate = 0.15;

    switch (vatRateType) {
      case 'standard':
        rate = 0.15;
        label = '15% Standard Rate (Rebate/Input Credit eligible)';
        vdsRate = 0.15;
        break;
      case 'truncated5':
        rate = 0.05;
        label = '5% Truncated Rate (Procurement / Designated Services, No Input Rebate)';
        vdsRate = 0.05;
        break;
      case 'truncated75':
        rate = 0.075;
        label = '7.5% Truncated Rate (Specific Construction/Services)';
        vdsRate = 0.075;
        break;
      case 'truncated10':
        rate = 0.10;
        label = '10% Truncated Rate (Specific Manufacturing/Services)';
        vdsRate = 0.10;
        break;
      case 'turnover4':
        rate = 0.04;
        label = '4% Turnover Tax (Annual Revenue BDT 50 Lakh to 3 Crore)';
        vdsRate = 0.04;
        break;
      case 'zero':
        rate = 0.00;
        label = '0% Zero-Rated (Physical Exports & Deemed Exports)';
        vdsRate = 0.00;
        break;
    }

    const vatAmount = Math.round(vatBaseAmount * rate);
    const grossInvoice = vatBaseAmount + vatAmount;
    const vdsAmount = isVdsApplicable ? vatAmount : 0;
    const netPaidToSupplier = isVdsApplicable ? vatBaseAmount : grossInvoice;

    return {
      rate,
      label,
      vatAmount,
      grossInvoice,
      vdsAmount,
      netPaidToSupplier
    };
  };

  // Calculations for Sixth Schedule Simulator
  const calculateSixthSchedule = () => {
    const cappedDps = Math.min(dpsAmount, 120000); // statutory DPS ceiling BDT 120,000
    const actualEligible = cappedDps + lifeInsurance + bondsOrSanchay + stocksAmount;
    
    // Statutory Limits under Part B:
    // Lowest of: (1) Actual, (2) 20% of total taxable income, (3) BDT 1,000,000
    const incomeLimit20Pct = Math.round(taxableIncome * 0.20);
    const statutoryMax = 1000000;
    const allowableInvestment = Math.min(actualEligible, incomeLimit20Pct, statutoryMax);
    
    // Rebate rate: 3% of allowable investment
    const taxRebateSaved = Math.round(allowableInvestment * 0.03);

    return {
      cappedDps,
      actualEligible,
      incomeLimit20Pct,
      statutoryMax,
      allowableInvestment,
      taxRebateSaved
    };
  };

  const tdsCalc = calculateTds();
  const vatCalc = calculateVat();
  const sixthCalc = calculateSixthSchedule();

  const handleCopyCheatSheet = () => {
    let summaryText = '';
    if (selectedTermId === 'tds') {
      summaryText = `[STATUTORY CHEAT SHEET: TDS (Tax Deduction at Source)]\n` +
        `Law: Income Tax Act, 2023 (Sections 86–142) & Finance Act, 2026\n` +
        `Concept: Payer withholds tax prior to disbursement and deposits to govt exchequer on payee's behalf.\n` +
        `Key Rates: Rent (5%), Contractor (10-12%), Supplies (2-7%), Lottery (25%), Salaries (Slab rate).\n` +
        `Compliance: Verification of PSR mandatory (50% surcharge if missing); Treasury deposit via e-Challan within 2 weeks; Quarterly Statement under Sec 177.\n` +
        `Penalties: Disallowance of whole expense under Sec 55(ka) + 2% per month interest under Sec 143.`;
    } else if (selectedTermId === 'vat') {
      summaryText = `[STATUTORY CHEAT SHEET: VAT (Value Added Tax)]\n` +
        `Law: VAT & SD Act, 2012 & VAT Rules, 2016\n` +
        `Concept: Multi-stage indirect tax collected from consumers on value added at each supply stage.\n` +
        `Rates: 15% Standard (Input credit eligible), 5%, 7.5%, 10% Truncated, 4% Turnover Tax (BDT 50L-3Cr).\n` +
        `Forms: Mushak-6.3 (Tax Invoice), Mushak-6.6 (VDS Certificate), Mushak-9.1 (Monthly Return by 15th).\n` +
        `Penalties: Mushak-6.3 default fine BDT 10k–100k; Late Mushak-9.1 fee BDT 10k + 2%/mo interest.`;
    } else if (selectedTermId === 'sixth-schedule') {
      summaryText = `[STATUTORY CHEAT SHEET: Sixth Schedule (ষষ্ঠ তফসিল)]\n` +
        `Law: Income Tax Act, 2023 — Sixth Schedule (Part A & Part B)\n` +
        `Part A (Exemptions): 27 IT/ITES sectors, export of software, agricultural income up to 2 Lakhs, remittances via banking channels.\n` +
        `Part B (Investment Tax Rebate): Allowable ceiling = Lowest of (1) Actual eligible, (2) 20% of taxable income, (3) BDT 1,000,000.\n` +
        `Tax Rebate Rate: 3% of allowable investment subtracted directly from gross tax payable.\n` +
        `Eligible Instruments: DPS (up to 120k/yr), Life Insurance, Treasury Bonds, DSE/CSE stocks.`;
    } else if (selectedTermId === 'vds') {
      summaryText = `[STATUTORY CHEAT SHEET: VDS (VAT Deduction at Source)]\n` +
        `Law: VAT & SD Act, 2012 — Section 49 & VDS SRO No. 186-AIN/2019/43-Mushak\n` +
        `Concept: Registered withholding buyer withholds VAT from vendor bill and deposits to local VAT Circle.\n` +
        `Mandatory Certificate: Mushak-6.6 issued within 3 working days. Vendor adjusts against Mushak-9.1.`;
    } else if (selectedTermId === 'psr') {
      summaryText = `[STATUTORY CHEAT SHEET: PSR (Proof of Submission of Return)]\n` +
        `Law: Income Tax Act, 2023 — Section 264 & 265\n` +
        `Requirement: Mandatory verification for 43+ civic & financial services (bank loans >500k, trade license, credit cards, utility).\n` +
        `Consequence: 50% surcharge on TDS deductions if payee fails to submit valid PSR.`;
    } else {
      summaryText = `[STATUTORY CHEAT SHEET: Section 163 Minimum Tax]\n` +
        `Law: Income Tax Act, 2023 — Section 163\n` +
        `Concept: Baseline tax floor. Location-based (BDT 3,000–5,000) or turnover-based (0.6%) or deemed final withholding.`;
    }

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const currentTermData = glossaryTerms.find(t => t.id === selectedTermId) || glossaryTerms[0];

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200/90 shadow-xl overflow-hidden my-12" id="interactive-key-terms-hub">
      {/* ========================================================= */}
      {/* TOP HEADER & VALUE PROPOSITION */}
      {/* ========================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 sm:p-8 border-b border-emerald-800/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Statutory Education Portal • বিধিবদ্ধ কর শিক্ষা কেন্দ্র</span>
              </span>
              <span className="text-xs text-slate-300 hidden sm:inline">
                Income Tax Act, 2023 & VAT Act, 2012
              </span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              Interactive Key Terms Guide: TDS, VAT & Sixth Schedule
            </h2>
            
            <p className="mt-2.5 text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              Master the foundational building blocks of Bangladesh’s revenue architecture through plain-language definitions, live scenario calculators, practical compliance lifecycles, and statutory penalty alerts.
            </p>
          </div>

          {/* Action buttons: Bilingual toggle & Copy Cheat Sheet */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {/* Language Switcher */}
            <div className="inline-flex p-1 bg-slate-800/90 rounded-2xl border border-slate-700 shadow-inner">
              <button
                onClick={() => setBilingual('en')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  bilingual === 'en'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setBilingual('bn')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all font-bengali ${
                  bilingual === 'bn'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                বাংলা
              </button>
            </div>

            <button
              onClick={handleCopyCheatSheet}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs sm:text-sm font-bold text-white transition-all shadow-sm"
              title="Copy statutory cheat sheet to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-300" />
                  <span>Copy Cheat Sheet</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PRIMARY TERM SELECTOR PILLS */}
        {/* ========================================================= */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <p className="text-xs uppercase tracking-wider font-bold text-emerald-400 mb-3 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Select Key Statutory Concept to Explore:</span>
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* TDS */}
            <button
              onClick={() => setSelectedTermId('tds')}
              className={`p-3 rounded-2xl text-left transition-all border flex flex-col justify-between ${
                selectedTermId === 'tds'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg scale-[1.02] font-black'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono font-bold">Sec 86–142</span>
                <Percent className="w-4 h-4" />
              </div>
              <span className="text-base font-extrabold leading-tight">TDS</span>
              <span className={`text-[11px] truncate mt-0.5 ${selectedTermId === 'tds' ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
                {bilingual === 'bn' ? 'উৎসে কর কর্তন' : 'Withholding Tax'}
              </span>
            </button>

            {/* VAT */}
            <button
              onClick={() => setSelectedTermId('vat')}
              className={`p-3 rounded-2xl text-left transition-all border flex flex-col justify-between ${
                selectedTermId === 'vat'
                  ? 'bg-blue-500 text-white border-blue-400 shadow-lg scale-[1.02] font-black'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono font-bold">Act 2012</span>
                <Calculator className="w-4 h-4" />
              </div>
              <span className="text-base font-extrabold leading-tight">VAT (মূসক)</span>
              <span className={`text-[11px] truncate mt-0.5 ${selectedTermId === 'vat' ? 'text-blue-100 font-semibold' : 'text-slate-400'}`}>
                {bilingual === 'bn' ? 'মূল্য সংযোজন কর' : 'Consumption Tax'}
              </span>
            </button>

            {/* Sixth Schedule */}
            <button
              onClick={() => setSelectedTermId('sixth-schedule')}
              className={`p-3 rounded-2xl text-left transition-all border flex flex-col justify-between ${
                selectedTermId === 'sixth-schedule'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg scale-[1.02] font-black'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono font-bold">Part A & B</span>
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-base font-extrabold leading-tight">Sixth Schedule</span>
              <span className={`text-[11px] truncate mt-0.5 ${selectedTermId === 'sixth-schedule' ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
                {bilingual === 'bn' ? 'ষষ্ঠ তফসিল (অব্যাহতি/রেয়াত)' : 'Exemptions & Rebates'}
              </span>
            </button>

            {/* VDS */}
            <button
              onClick={() => setSelectedTermId('vds')}
              className={`p-3 rounded-2xl text-left transition-all border flex flex-col justify-between ${
                selectedTermId === 'vds'
                  ? 'bg-purple-500 text-white border-purple-400 shadow-lg scale-[1.02] font-black'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono font-bold">Sec 49</span>
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-base font-extrabold leading-tight">VDS</span>
              <span className={`text-[11px] truncate mt-0.5 ${selectedTermId === 'vds' ? 'text-purple-100 font-semibold' : 'text-slate-400'}`}>
                {bilingual === 'bn' ? 'উৎসে মূসক কর্তন' : 'Withholding VAT'}
              </span>
            </button>

            {/* PSR */}
            <button
              onClick={() => setSelectedTermId('psr')}
              className={`p-3 rounded-2xl text-left transition-all border flex flex-col justify-between ${
                selectedTermId === 'psr'
                  ? 'bg-rose-500 text-white border-rose-400 shadow-lg scale-[1.02] font-black'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono font-bold">Sec 264</span>
                <UserCheck className="w-4 h-4" />
              </div>
              <span className="text-base font-extrabold leading-tight">PSR</span>
              <span className={`text-[11px] truncate mt-0.5 ${selectedTermId === 'psr' ? 'text-rose-100 font-semibold' : 'text-slate-400'}`}>
                {bilingual === 'bn' ? 'রিটার্ন জমার প্রমাণ' : 'Return Proof'}
              </span>
            </button>

            {/* Minimum Tax */}
            <button
              onClick={() => setSelectedTermId('min-tax')}
              className={`p-3 rounded-2xl text-left transition-all border flex flex-col justify-between ${
                selectedTermId === 'min-tax'
                  ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-lg scale-[1.02] font-black'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono font-bold">Sec 163</span>
                <Coins className="w-4 h-4" />
              </div>
              <span className="text-base font-extrabold leading-tight">Min Tax</span>
              <span className={`text-[11px] truncate mt-0.5 ${selectedTermId === 'min-tax' ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
                {bilingual === 'bn' ? 'ন্যূনতম কর (ধারা ১৬৩)' : 'Statutory Floor'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* INTERACTIVE MODE NAV TABS */}
      {/* ========================================================= */}
      <div className="bg-slate-100/80 border-b border-slate-200 px-4 sm:px-8 flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none py-2.5">
        <button
          onClick={() => setActiveTab('concept')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'concept'
              ? 'bg-white text-emerald-800 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-600" />
          <span>1. Concept & Statutory Anatomy</span>
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'simulator'
              ? 'bg-white text-emerald-800 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Calculator className="w-4 h-4 text-emerald-600" />
          <span>2. Live Calculator & Scenario Simulator</span>
        </button>

        <button
          onClick={() => setActiveTab('lifecycle')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'lifecycle'
              ? 'bg-white text-emerald-800 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>3. 5-Step Practical Compliance Cycle</span>
        </button>

        <button
          onClick={() => setActiveTab('penalties')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'penalties'
              ? 'bg-white text-rose-800 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>4. Statutory Traps & Penalties</span>
        </button>

        <button
          onClick={() => setActiveTab('quiz')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'quiz'
              ? 'bg-white text-emerald-800 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-amber-500" />
          <span>5. Concept Check Micro-Quiz</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB CONTENT PANELS */}
      {/* ========================================================= */}
      <div className="p-6 sm:p-8">
        {/* ========================================================= */}
        {/* TAB 1: CONCEPT & STATUTORY ANATOMY */}
        {/* ========================================================= */}
        {activeTab === 'concept' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header info badge */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-xl bg-emerald-600 text-white shrink-0 shadow-sm">
                  <Scale className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-md">
                      Governing Statutory Law
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      National Board of Revenue (NBR) Framework
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                    {selectedTermId === 'tds' && 'TDS: Tax Deduction at Source (উৎসে কর কর্তন)'}
                    {selectedTermId === 'vat' && 'VAT: Value Added Tax (মূল্য সংযোজন কর - মূসক)'}
                    {selectedTermId === 'sixth-schedule' && 'Sixth Schedule: Exemptions & Investment Tax Rebates (ষষ্ঠ তফসিল)'}
                    {selectedTermId === 'vds' && 'VDS: VAT Deduction at Source (উৎসে মূসক কর্তন)'}
                    {selectedTermId === 'psr' && 'PSR: Proof of Submission of Return (রিটার্ন জমার প্রমাণ)'}
                    {selectedTermId === 'min-tax' && 'Section 163: Statutory Minimum Tax (ন্যূনতম কর)'}
                  </h3>
                  <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-0.5">
                    {selectedTermId === 'tds' && 'Income Tax Act, 2023 — Chapter VII, Sections 86 to 142 & Finance Act, 2026'}
                    {selectedTermId === 'vat' && 'Value Added Tax and Supplementary Duty Act, 2012 (Act No. 47 of 2012) & VAT Rules, 2016'}
                    {selectedTermId === 'sixth-schedule' && 'Income Tax Act, 2023 — Sixth Schedule (Part A: 34 Exemption Clauses; Part B: 16 Investment Rebate Clauses)'}
                    {selectedTermId === 'vds' && 'VAT & SD Act, 2012 — Section 49 & SRO No. 186-AIN/2019/43-Mushak'}
                    {selectedTermId === 'psr' && 'Income Tax Act, 2023 — Sections 264 & 265'}
                    {selectedTermId === 'min-tax' && 'Income Tax Act, 2023 — Section 163'}
                  </p>
                </div>
              </div>

              {onOpenModal && (
                <button
                  onClick={() => onOpenModal(currentTermData)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1.5 self-start md:self-auto shadow-xs"
                >
                  <span>Open Full Statutory Modal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Plain English vs Statutory Definition Side-by-Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Plain Language Breakdown */}
              <div className="p-6 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-900">
                      {bilingual === 'bn' ? 'সহজ বাংলায় সারসংক্ষেপ' : 'In Plain Everyday Words'}
                    </h4>
                  </div>
                  <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-normal">
                    {selectedTermId === 'tds' && (
                      bilingual === 'bn' 
                        ? 'আপনি যখন কাউকে কোনো অর্থ পরিশোধ করবেন (যেমন বাড়িভাড়া, কনসালটেন্সি ফি বা পণ্য সরবরাহ), তখন সরকারি নিয়মে তার মোট বিল থেকে নির্দিষ্ট হারে কর কেটে সরকারি কোষাগারে জমা দিতে হবে। বাকি অর্থ গ্রহীতাকে পরিশোধ করা হয়।'
                        : 'Instead of waiting for taxpayers to pay all their taxes at the end of the year, the payer withholds a statutory percentage from payments (rent, contracts, winnings, salaries) and deposits it directly into the government treasury on behalf of the recipient.'
                    )}
                    {selectedTermId === 'vat' && (
                      bilingual === 'bn'
                        ? 'ভ্যাট হলো একটি পরোক্ষ কর যা পণ্য বা সেবার প্রতি ধাপে যোগ হওয়া মূল্যের ওপর ধার্য হয়। চূড়ান্ত ভোক্তা এই কর বহন করেন, কিন্তু ব্যবসায়ীরা গ্রাহকের কাছ থেকে তা সংগ্রহ করে প্রতি মাসে সরকারি ট্রেজারিতে জমা দেন।'
                        : 'VAT is an indirect multi-stage consumption tax. Businesses collect it from buyers when invoicing goods or services and deposit it to NBR every month, claiming back the VAT they already paid on their business purchases (input tax credit / রেয়াত).'
                    )}
                    {selectedTermId === 'sixth-schedule' && (
                      bilingual === 'bn'
                        ? 'ষষ্ঠ তফসিল হলো বাংলাদেশের কর ব্যবস্থার সবচেয়ে গুরুত্বপূর্ণ তফসিল। এর অংশ ১-এ বলা আছে কোন কোন আয় সম্পূর্ণ করমুক্ত (যেমন ২৭টি আইটি সেবা, কৃষির প্রথম ২ লাখ), আর অংশ ২-এ ডিপিএস বা জীবন বীমায় বিনিয়োগ করে ৩% কর রেয়াত পাওয়ার নিয়ম রয়েছে।'
                        : 'The Sixth Schedule is the statutory master catalog of exclusions. Part A lists every lawful tax exemption (IT/ITES income, pension, foreign remittance). Part B allows individual taxpayers to legally cut their gross tax liability by investing in approved instruments like DPS, life insurance, and treasury bonds.'
                    )}
                    {selectedTermId === 'vds' && (
                      bilingual === 'bn'
                        ? 'নির্দিষ্ট সরবরাহকারী বা সেবা প্রদানকারীর বিল পরিশোধের সময় নির্ধারিত সরকারি বা নিবন্ধিত প্রতিষ্ঠানগুলো মূল ভ্যাট বিল থেকে ভ্যাট কেটে রেখে মুসক-৬.৬ সার্টিফিকেট দেয়।'
                        : 'When a designated withholding entity purchases specified goods or services, it does not pay the full VAT to the vendor. Instead, it withholds the VAT amount, pays it to the VAT Circle, and issues Mushak-6.6 certificate.'
                    )}
                    {selectedTermId === 'psr' && (
                      bilingual === 'bn'
                        ? 'পিএসআর হলো আয়কর রিটার্ন জমা দেওয়ার সরকারি প্রাপ্তিস্বীকারপত্র। ব্যাংক ঋণ, ট্রেড লাইসেন্স বা গ্যাস-বিদ্যুৎ সংযোগ পেতে ৪৩টির বেশি নাগরিক সেবায় এটি বাধ্যতামূলক।'
                        : 'PSR is the official statutory proof (acknowledgment slip or e-return system certificate) that you filed your annual tax return. Under Section 264, it is strictly mandatory to access 43+ essential public and financial services in Bangladesh.'
                    )}
                    {selectedTermId === 'min-tax' && (
                      bilingual === 'bn'
                        ? 'ধারা ১৬৩ অনুযায়ী করদাতার আয় যতই কম হোক বা ক্ষতি হোক, নির্দিষ্ট সীমায় পৌঁছালে সিটি কর্পোরেশনে ৫,০০০ টাকা বা কোম্পানিগুলোর জন্য মোট বিক্রির ০.৬% ন্যূনতম কর দিতেই হবে।'
                        : 'Section 163 mandates the statutory minimum amount of tax a taxpayer or business must remit, even if tax allowances or business losses would otherwise reduce computed tax to zero.'
                    )}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-emerald-200/60 flex items-center justify-between text-xs text-emerald-800 font-semibold">
                  <span>Target Audience:</span>
                  <span className="bg-emerald-100 px-2.5 py-1 rounded-md text-emerald-900">
                    {selectedTermId === 'tds' && 'Payers, Corporate Finance, Landlords, Contractors'}
                    {selectedTermId === 'vat' && 'Manufacturers, Importers, Retailers, Consultants'}
                    {selectedTermId === 'sixth-schedule' && 'All Salaried Individuals, Freelancers, Investors'}
                    {selectedTermId === 'vds' && 'Withholding Entities & Corporate Procurement'}
                    {selectedTermId === 'psr' && 'All Business Owners & Individual Taxpayers'}
                    {selectedTermId === 'min-tax' && 'Firms, City Taxpayers, Import Licensees'}
                  </span>
                </div>
              </div>

              {/* Card 2: Legal Rigor & Enforcement Details */}
              <div className="p-6 rounded-2xl bg-slate-900 text-white flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-300">
                      Statutory Framework & Enforceability
                    </h4>
                  </div>
                  
                  <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                    {selectedTermId === 'tds' && (
                      <>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span><strong>Withholding Duty (Sec 87):</strong> Government bodies, companies, NGOs, and cooperatives must deduct tax before releasing payments.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span><strong>Deposit Timeline:</strong> Must be deposited within 2 weeks of deduction to Bangladesh Bank or Sonali Bank via automated e-Challan / A-Challan.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span><strong>Quarterly Filing (Sec 177):</strong> Mandatory quarterly withholding tax returns to the respective Taxes Circle.</span>
                        </li>
                      </>
                    )}

                    {selectedTermId === 'vat' && (
                      <>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                          <span><strong>Registration Threshold:</strong> Annual turnover exceeding BDT 30,000,000 mandates a 13-digit BIN; turnover between BDT 5,000,000–30,000,000 requires Turnover Tax registration.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                          <span><strong>Mandatory Invoicing (Mushak-6.3):</strong> Must be generated at delivery time. Supplies without Mushak-6.3 cannot claim input rebate.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                          <span><strong>Monthly Return (Mushak-9.1):</strong> Due strictly by the 15th of the subsequent month, even if monthly turnover is zero.</span>
                        </li>
                      </>
                    )}

                    {selectedTermId === 'sixth-schedule' && (
                      <>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span><strong>Part A (Exemptions):</strong> 34 statutory exemptions including software exports, gratuity up to BDT 2.5 Crore, and genuine foreign remittances.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span><strong>Part B (Rebate Formula):</strong> Maximum allowable investment is the lowest of: (a) actual investment, (b) 20% of taxable income, or (c) BDT 10 Lakh.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span><strong>3% Direct Credit:</strong> 3% of the allowable investment is deducted straight from gross tax (maximum rebate = BDT 30,000).</span>
                        </li>
                      </>
                    )}

                    {selectedTermId === 'vds' && (
                      <>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                          <span><strong>Withholding Entities:</strong> Government entities, semi-govt, autonomous bodies, NGOs, banks, insurance, and limited companies.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                          <span><strong>Mushak-6.6 Certificate:</strong> Issued in triplicate within 3 working days of payment deduction.</span>
                        </li>
                      </>
                    )}

                    {selectedTermId === 'psr' && (
                      <>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <span><strong>43+ Essential Services:</strong> Trade license renewal, bank loan &gt; BDT 5 Lakh, credit card issuance, car registration, commercial gas/electricity.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <span><strong>50% Higher Withholding:</strong> Withholding agents must deduct 50% extra tax if the payee fails to furnish valid PSR!</span>
                        </li>
                      </>
                    )}

                    {selectedTermId === 'min-tax' && (
                      <>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                          <span><strong>Location Minimum:</strong> Dhaka/Chittagong City: BDT 5,000; Other City: BDT 4,000; Rural: BDT 3,000.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                          <span><strong>Corporate Turnover Tax:</strong> 0.6% on gross turnover regardless of loss.</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                  <span>Enforcing Body:</span>
                  <span className="text-white font-mono font-semibold">Taxes Circle & VAT Commissionerate</span>
                </div>
              </div>
            </div>

            {/* Cross-linking to deep dive articles */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 text-sm">
                    Recommended In-Depth Guides on This Concept
                  </h5>
                  <p className="text-xs text-slate-600">
                    Review official case studies, practical schedules, and section-by-section analysis.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {selectedTermId === 'tds' && (
                  <>
                    <Link
                      to="/tds-reference"
                      className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 text-xs font-bold transition-colors inline-flex items-center gap-1"
                    >
                      <span>TDS Reference Rates</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      to="/article/tds-lottery-winnings-gifts-loans-freelance-income-bangladesh-2026-2027"
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1"
                    >
                      <span>TDS on Winnings & Freelance</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </>
                )}

                {selectedTermId === 'vat' && (
                  <>
                    <Link
                      to="/vat-guide"
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1"
                    >
                      <span>Complete VAT Guide (2012 Act)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </>
                )}

                {selectedTermId === 'sixth-schedule' && (
                  <>
                    <Link
                      to="/article/tax-rebate-investment-ceiling-bangladesh"
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1"
                    >
                      <span>Investment Rebate Ceiling Guide</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      to="/article/taxable-and-non-taxable-income-bangladesh-guide-2026-2027"
                      className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 text-xs font-bold transition-colors inline-flex items-center gap-1"
                    >
                      <span>Taxable vs Non-Taxable Guide</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </>
                )}

                {['vds', 'psr', 'min-tax'].includes(selectedTermId) && (
                  <Link
                    to="/article/psr-display-compliance-section-265-guide"
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1"
                  >
                    <span>Section 265 Compliance Guide</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: LIVE SIMULATOR & CALCULATOR */}
        {/* ========================================================= */}
        {activeTab === 'simulator' && (
          <div className="space-y-8 animate-fadeIn">
            {/* TDS SIMULATOR */}
            {selectedTermId === 'tds' && (
              <div className="bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-200">
                <div className="max-w-2xl mb-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
                    <Calculator className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Interactive TDS Withholding Simulator</span>
                  </div>
                  <h4 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Calculate Statutory Withholding & Net Disbursement
                  </h4>
                  <p className="text-sm text-slate-600 mt-1">
                    Select the transaction type under Income Tax Act, 2023, input the gross payment in BDT, and see the exact tax deduction, treasury deposit rules, and payee net receipt.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Inputs Column */}
                  <div className="lg:col-span-6 space-y-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                        1. Transaction Category / Payment Type
                      </label>
                      <select
                        value={tdsCategory}
                        onChange={(e) => setTdsCategory(e.target.value as any)}
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900 text-sm"
                      >
                        <option value="rent">Office / Commercial Space Rent (5% — Section 109)</option>
                        <option value="contractor">Contractor & Professional Fees (10% — Section 89/90)</option>
                        <option value="supplies">Supply of Goods / Materials (5% — Section 89)</option>
                        <option value="lottery">Lottery / Gaming Winnings (25% — amended Sec 118)</option>
                        <option value="freelance">IT Freelancing / ITES Inward Remittance (0% — Sixth Sch)</option>
                        <option value="salary">Estimated Salaried Employee (Slab Rate Average ~10%)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                        2. Gross Payment Amount (BDT)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">BDT</span>
                        <input
                          type="number"
                          min="1000"
                          step="5000"
                          value={tdsAmount}
                          onChange={(e) => setTdsAmount(Math.max(0, Number(e.target.value)))}
                          className="w-full pl-16 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900 text-base"
                        />
                      </div>
                      <div className="flex gap-2 mt-2">
                        {[50000, 100000, 500000, 1000000].map(val => (
                          <button
                            key={val}
                            onClick={() => setTdsAmount(val)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 transition-colors"
                          >
                            {(val / 1000).toLocaleString()}k
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* PSR Verification Toggle */}
                    <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          Payee PSR Verified (Section 264)?
                        </span>
                        <span className="text-xs text-slate-500 block">
                          If unchecked, 50% higher punitive TDS applies under Section 264.
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={payeeHasPsr}
                          onChange={(e) => setPayeeHasPsr(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>
                  </div>

                  {/* Outputs Card */}
                  <div className="lg:col-span-6 bg-white p-6 rounded-2xl border-2 border-emerald-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Statutory Section
                        </span>
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md">
                          {tdsCalc.section}
                        </span>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Gross Invoice / Payment:</span>
                          <span className="font-mono font-bold text-slate-900 text-base">
                            BDT {tdsAmount.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">
                            Statutory TDS Rate:
                            {!payeeHasPsr && (
                              <span className="ml-1 text-xs font-bold text-rose-600">
                                (+50% PSR Penalty)
                              </span>
                            )}
                          </span>
                          <span className="font-mono font-bold text-emerald-700">
                            {(tdsCalc.effectiveRate * 100).toFixed(1)}%
                          </span>
                        </div>

                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-emerald-900 block">
                              Tax Deducted at Source (TDS)
                            </span>
                            <span className="text-[11px] text-emerald-700">
                              Deposit via automated e-Challan
                            </span>
                          </div>
                          <span className="text-xl font-black text-emerald-900 font-mono">
                            BDT {tdsCalc.calculatedTds.toLocaleString()}
                          </span>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-300 block">
                              Net Amount Paid to Recipient
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Disbursed via bank transfer / cheque
                            </span>
                          </div>
                          <span className="text-xl font-black text-emerald-400 font-mono">
                            BDT {tdsCalc.netPayable.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                      <div className="flex items-start gap-1.5">
                        <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Deposit Deadline:</strong> Within 2 weeks of deduction to Bangladesh Bank treasury code.</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span><strong>Section 163 Status:</strong> {tdsCalc.isMinTax ? 'Treated as Minimum Tax under Section 163 (non-adjustable/non-refundable).' : 'Fully adjustable credit against annual tax return assessment.'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VAT SIMULATOR */}
            {selectedTermId === 'vat' && (
              <div className="bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-200">
                <div className="max-w-2xl mb-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-2">
                    <Calculator className="w-3.5 h-3.5 text-blue-700" />
                    <span>Interactive VAT & VDS Billing Simulator</span>
                  </div>
                  <h4 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Calculate Output VAT, Input Credit Eligibility & VDS
                  </h4>
                  <p className="text-sm text-slate-600 mt-1">
                    Simulate how Bangladesh’s VAT and Supplementary Duty Act, 2012 operates on commercial invoicing, tax withholding (VDS), and invoice documentation.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Inputs Column */}
                  <div className="lg:col-span-6 space-y-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                        1. Applicable VAT Rate Schedule
                      </label>
                      <select
                        value={vatRateType}
                        onChange={(e) => setVatRateType(e.target.value as any)}
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900 text-sm"
                      >
                        <option value="standard">15% Standard Rate (Rebate / Input Credit Allowed)</option>
                        <option value="truncated5">5% Truncated Rate (Procurement Provider / Specific Services)</option>
                        <option value="truncated75">7.5% Truncated Rate (Construction / Specific Supplies)</option>
                        <option value="truncated10">10% Truncated Rate (Designated Goods / Services)</option>
                        <option value="turnover4">4% Turnover Tax (Annual Revenue BDT 50L to 3Cr)</option>
                        <option value="zero">0% Zero-Rated (Physical Exports & Deemed Exports)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                        2. Base Supply / Service Value (BDT)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">BDT</span>
                        <input
                          type="number"
                          min="1000"
                          step="10000"
                          value={vatBaseAmount}
                          onChange={(e) => setVatBaseAmount(Math.max(0, Number(e.target.value)))}
                          className="w-full pl-16 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-900 text-base"
                        />
                      </div>
                      <div className="flex gap-2 mt-2">
                        {[100000, 200000, 500000, 1000000].map(val => (
                          <button
                            key={val}
                            onClick={() => setVatBaseAmount(val)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 transition-colors"
                          >
                            {(val / 1000).toLocaleString()}k
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* VDS Withholding Toggle */}
                    <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          Buyer is a Designated Withholding Entity (VDS)?
                        </span>
                        <span className="text-xs text-slate-500 block">
                          If checked, buyer withholds VAT amount and issues Form Mushak-6.6.
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isVdsApplicable}
                          onChange={(e) => setIsVdsApplicable(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  {/* Outputs Card */}
                  <div className="lg:col-span-6 bg-white p-6 rounded-2xl border-2 border-blue-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Invoicing Classification
                        </span>
                        <span className="text-xs font-bold text-blue-800 bg-blue-100 px-2.5 py-1 rounded-md">
                          Mushak-6.3 Tax Invoice
                        </span>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Base Supply Value (Excluding VAT):</span>
                          <span className="font-mono font-bold text-slate-900 text-base">
                            BDT {vatBaseAmount.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">VAT Charged ({(vatCalc.rate * 100).toFixed(1)}%):</span>
                          <span className="font-mono font-bold text-blue-700 text-base">
                            BDT {vatCalc.vatAmount.toLocaleString()}
                          </span>
                        </div>

                        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-blue-900 block">
                              Total Invoice Amount (Gross)
                            </span>
                            <span className="text-[11px] text-blue-700">
                              Face value printed on Mushak-6.3
                            </span>
                          </div>
                          <span className="text-xl font-black text-blue-900 font-mono">
                            BDT {vatCalc.grossInvoice.toLocaleString()}
                          </span>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-300 block">
                              Net Cash Disbursed to Vendor
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {isVdsApplicable ? 'Excludes VDS (Mushak-6.6 issued)' : 'Full invoice payment'}
                            </span>
                          </div>
                          <span className="text-xl font-black text-blue-400 font-mono">
                            BDT {vatCalc.netPaidToSupplier.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                      <div className="flex items-start gap-1.5">
                        <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span><strong>Mushak-9.1 Deadline:</strong> Due by the 15th of next month via NBR IVAS VAT portal.</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Input Credit Status:</strong> {vatRateType === 'standard' ? 'Full input tax rebate eligible.' : 'No input tax rebate (truncated rate restriction).' }</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SIXTH SCHEDULE SIMULATOR */}
            {(selectedTermId === 'sixth-schedule' || selectedTermId === 'vds' || selectedTermId === 'psr' || selectedTermId === 'min-tax') && (
              <div className="bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-200">
                <div className="max-w-2xl mb-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-2">
                    <Layers className="w-3.5 h-3.5 text-amber-700" />
                    <span>Sixth Schedule Part B: Investment Tax Rebate Calculator</span>
                  </div>
                  <h4 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Test Allowable Investment Ceilings & Direct 3% Rebate Savings
                  </h4>
                  <p className="text-sm text-slate-600 mt-1">
                    Calculate your exact allowable investment ceiling under the Income Tax Act, 2023 and the exact BDT discount knocked directly off your annual tax bill.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Inputs Column */}
                  <div className="lg:col-span-6 space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Annual Total Taxable Income (BDT)
                      </label>
                      <input
                        type="number"
                        min="300000"
                        step="50000"
                        value={taxableIncome}
                        onChange={(e) => setTaxableIncome(Math.max(0, Number(e.target.value)))}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold text-slate-900 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          DPS Deposit (Max 1.2 Lakh)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="10000"
                          value={dpsAmount}
                          onChange={(e) => setDpsAmount(Math.max(0, Number(e.target.value)))}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-semibold text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Life Insurance Premium
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="5000"
                          value={lifeInsurance}
                          onChange={(e) => setLifeInsurance(Math.max(0, Number(e.target.value)))}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-semibold text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Sanchayapatra / Govt Bonds
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="20000"
                          value={bondsOrSanchay}
                          onChange={(e) => setBondsOrSanchay(Math.max(0, Number(e.target.value)))}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-semibold text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Listed Stocks (DSE / CSE)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="20000"
                          value={stocksAmount}
                          onChange={(e) => setStocksAmount(Math.max(0, Number(e.target.value)))}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-semibold text-sm"
                        />
                      </div>
                    </div>

                    <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                      <span className="font-bold block">Statutory Ceiling Rules (Part B):</span>
                      <p>Allowable investment is the lowest of: (1) Actual eligible = BDT {sixthCalc.actualEligible.toLocaleString()}, (2) 20% of taxable income = BDT {sixthCalc.incomeLimit20Pct.toLocaleString()}, or (3) BDT 1,000,000.</p>
                    </div>
                  </div>

                  {/* Outputs Card */}
                  <div className="lg:col-span-6 bg-white p-6 rounded-2xl border-2 border-amber-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Rebate Calculation Schedule
                        </span>
                        <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-md">
                          Sixth Schedule Part B
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">Actual Total Investment Made:</span>
                          <span className="font-mono font-bold text-slate-900">
                            BDT {sixthCalc.actualEligible.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">20% of Taxable Income Ceiling:</span>
                          <span className="font-mono font-bold text-slate-900">
                            BDT {sixthCalc.incomeLimit20Pct.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">Statutory Maximum Ceiling:</span>
                          <span className="font-mono font-bold text-slate-900">
                            BDT 1,000,000
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">
                            Allowable Eligible Base (Lowest of 3):
                          </span>
                          <span className="text-base font-extrabold text-slate-900 font-mono">
                            BDT {sixthCalc.allowableInvestment.toLocaleString()}
                          </span>
                        </div>

                        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-emerald-100 block">
                              Tax Rebate Saved in BDT (3% Direct Credit)
                            </span>
                            <span className="text-[11px] text-emerald-200">
                              Subtracted directly from gross tax liability
                            </span>
                          </div>
                          <span className="text-2xl font-black text-white font-mono">
                            BDT {sixthCalc.taxRebateSaved.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                      <span>Maximum Possible Annual Rebate:</span>
                      <span className="font-mono font-bold text-slate-800">BDT 30,000 (3% of BDT 10L)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: 5-STEP PRACTICAL COMPLIANCE LIFECYCLE */}
        {/* ========================================================= */}
        {activeTab === 'lifecycle' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="max-w-2xl mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                Operational Compliance Roadmap
              </span>
              <h4 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                The Practical 5-Step Execution Cycle
              </h4>
              <p className="text-sm text-slate-600 mt-1">
                How this statutory requirement operates step-by-step from initial invoice generation to final annual tax return submission.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Step 1 */}
              <div className="p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-emerald-500 transition-all shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center mb-3">
                    01
                  </div>
                  <h5 className="font-bold text-slate-900 text-sm mb-1">
                    {selectedTermId === 'tds' && 'Verify PSR & Bill'}
                    {selectedTermId === 'vat' && 'Issue Mushak-6.3'}
                    {selectedTermId === 'sixth-schedule' && 'Identify Eligible Asset'}
                    {selectedTermId === 'vds' && 'Inspect Vendor Invoice'}
                    {selectedTermId === 'psr' && 'File Return Online'}
                    {selectedTermId === 'min-tax' && 'Determine Location'}
                  </h5>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedTermId === 'tds' && 'Check payee’s Proof of Submission of Return (PSR). If missing, apply 50% surcharge.'}
                    {selectedTermId === 'vat' && 'Generate numbered tax invoice Mushak-6.3 before goods depart or services commence.'}
                    {selectedTermId === 'sixth-schedule' && 'Select approved instruments (DPS, Life Insurance, Sanchayapatra, Treasury Bonds).'}
                    {selectedTermId === 'vds' && 'Verify if supplier holds 15% standard invoice or truncated rate requiring withholding.'}
                    {selectedTermId === 'psr' && 'Submit annual tax return on NBR eTax portal (etaxnbr.gov.bd) by Tax Day.'}
                    {selectedTermId === 'min-tax' && 'Verify registered location (Dhaka/Ctg = BDT 5,000; other city = BDT 4,000; rural = BDT 3,000).'}
                  </p>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-700 mt-4 block">
                  Stage: Pre-Transaction
                </span>
              </div>

              {/* Step 2 */}
              <div className="p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-emerald-500 transition-all shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center mb-3">
                    02
                  </div>
                  <h5 className="font-bold text-slate-900 text-sm mb-1">
                    {selectedTermId === 'tds' && 'Calculate & Withhold'}
                    {selectedTermId === 'vat' && 'Record in Register'}
                    {selectedTermId === 'sixth-schedule' && 'Invest by June 30'}
                    {selectedTermId === 'vds' && 'Withhold VAT Amount'}
                    {selectedTermId === 'psr' && 'Obtain System Slip'}
                    {selectedTermId === 'min-tax' && 'Compute Regular Tax'}
                  </h5>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedTermId === 'tds' && 'Apply statutory rate (e.g. 5% rent, 10% contractor, 25% lottery) and pay net balance.'}
                    {selectedTermId === 'vat' && 'Maintain statutory books: Mushak-6.1 (Purchase Book) & Mushak-6.2 (Sales Book).'}
                    {selectedTermId === 'sixth-schedule' && 'Deposit funds into own account before the 30th of June of the relevant Income Year.'}
                    {selectedTermId === 'vds' && 'Deduct the VAT component from vendor payment voucher before issuing cheque/wire.'}
                    {selectedTermId === 'psr' && 'Download automated QR-coded acknowledgment slip and assessment certificate.'}
                    {selectedTermId === 'min-tax' && 'Calculate slab tax. If slab tax is lower than minimum floor, minimum floor prevails.'}
                  </p>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-700 mt-4 block">
                  Stage: Execution
                </span>
              </div>

              {/* Step 3 */}
              <div className="p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-emerald-500 transition-all shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center mb-3">
                    03
                  </div>
                  <h5 className="font-bold text-slate-900 text-sm mb-1">
                    {selectedTermId === 'tds' && 'Treasury Deposit'}
                    {selectedTermId === 'vat' && 'Monthly Return 9.1'}
                    {selectedTermId === 'sixth-schedule' && 'Collect Certificate'}
                    {selectedTermId === 'vds' && 'Issue Mushak-6.6'}
                    {selectedTermId === 'psr' && 'Furnish to Services'}
                    {selectedTermId === 'min-tax' && 'Pay Minimum Floor'}
                  </h5>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedTermId === 'tds' && 'Deposit withheld tax to Bangladesh Bank / Sonali Bank via e-Challan within 2 weeks.'}
                    {selectedTermId === 'vat' && 'Submit monthly Mushak-9.1 return by 15th of the following month.'}
                    {selectedTermId === 'sixth-schedule' && 'Collect bank DPS certificates, policy receipts, or CDBL share transaction ledgers.'}
                    {selectedTermId === 'vds' && 'Issue Mushak-6.6 certificate in triplicate to supplier within 3 working days.'}
                    {selectedTermId === 'psr' && 'Present PSR certificate to banks for loans, City Corporation for trade licenses, etc.'}
                    {selectedTermId === 'min-tax' && 'Pay the statutory minimum tax via treasury challan or online before filing return.'}
                  </p>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-700 mt-4 block">
                  Stage: Treasury Deposit
                </span>
              </div>

              {/* Step 4 */}
              <div className="p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-emerald-500 transition-all shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center mb-3">
                    04
                  </div>
                  <h5 className="font-bold text-slate-900 text-sm mb-1">
                    {selectedTermId === 'tds' && 'Issue Certificate'}
                    {selectedTermId === 'vat' && 'Reconcile Input Rebate'}
                    {selectedTermId === 'sixth-schedule' && 'Apply 3% Formula'}
                    {selectedTermId === 'vds' && 'Treasury Remittance'}
                    {selectedTermId === 'psr' && 'Display on Premises'}
                    {selectedTermId === 'min-tax' && 'Record Challan'}
                  </h5>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedTermId === 'tds' && 'Furnish statutory TDS Certificate to payee with challan tracking number.'}
                    {selectedTermId === 'vat' && 'Reconcile input tax credit against output liability in Sub-form of Mushak-9.1.'}
                    {selectedTermId === 'sixth-schedule' && 'Apply Part B 3% rebate rate on the allowable ceiling and subtract from gross tax.'}
                    {selectedTermId === 'vds' && 'Deposit deducted VDS to local VAT Circle within 15 days of deduction.'}
                    {selectedTermId === 'psr' && 'Commercial offices must display PSR compliance certificate under Section 265.'}
                    {selectedTermId === 'min-tax' && 'Attach treasury challan to return as proof of non-refundable baseline payment.'}
                  </p>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-700 mt-4 block">
                  Stage: Certification
                </span>
              </div>

              {/* Step 5 */}
              <div className="p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-emerald-500 transition-all shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center mb-3">
                    05
                  </div>
                  <h5 className="font-bold text-slate-900 text-sm mb-1">
                    {selectedTermId === 'tds' && 'Annual Return Credit'}
                    {selectedTermId === 'vat' && 'Retain 5-Year Files'}
                    {selectedTermId === 'sixth-schedule' && 'Submit Schedule'}
                    {selectedTermId === 'vds' && 'Adjust in 9.1'}
                    {selectedTermId === 'psr' && 'Annual Renewal'}
                    {selectedTermId === 'min-tax' && 'Assessment Closure'}
                  </h5>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedTermId === 'tds' && 'Payee claims full credit against annual return; payer files Sec 177 quarterly return.'}
                    {selectedTermId === 'vat' && 'Store all Mushak-6.3 and purchase challans for statutory audit minimum of 5 years.'}
                    {selectedTermId === 'sixth-schedule' && 'Attach Investment Schedule to annual Return-2023 along with bank proofs.'}
                    {selectedTermId === 'vds' && 'Vendor adjusts Mushak-6.6 as decreasing adjustment in monthly return.'}
                    {selectedTermId === 'psr' && 'Renew annual return every year on Tax Day (30 November) to maintain uninterrupted PSR.'}
                    {selectedTermId === 'min-tax' && 'Assessing Officer completes assessment under Universal Self-Assessment.'}
                  </p>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-700 mt-4 block">
                  Stage: Final Reconciliation
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: STATUTORY TRAPS & PENALTIES */}
        {/* ========================================================= */}
        {activeTab === 'penalties' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="max-w-2xl mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-3 py-1 rounded-full">
                Statutory Non-Compliance Warning
              </span>
              <h4 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                Consequences of Failure under Bangladeshi Tax Law
              </h4>
              <p className="text-sm text-slate-600 mt-1">
                Breaching statutory withholding, VAT documentation, or exemption criteria triggers immediate punitive disallowances, interest charges, and personal liability.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Penalty Card 1 */}
              <div className="p-6 rounded-2xl bg-rose-50/70 border-2 border-rose-200 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center mb-4 shadow-sm">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <h5 className="text-lg font-bold text-rose-950 mb-2">
                    {selectedTermId === 'tds' && 'Section 55 Disallowance'}
                    {selectedTermId === 'vat' && 'Mushak-6.3 Default Fines'}
                    {selectedTermId === 'sixth-schedule' && 'Unexplained Deemed Income'}
                    {selectedTermId === 'vds' && 'Joint Withholding Liability'}
                    {selectedTermId === 'psr' && 'Public Service Denial'}
                    {selectedTermId === 'min-tax' && 'Return Rejection'}
                  </h5>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {selectedTermId === 'tds' && 'If a company fails to deduct or deposit TDS from rent or contractor fees, the ENTIRE expenditure is disallowed under Section 55(ka) and added back to taxable commercial profit!'}
                    {selectedTermId === 'vat' && 'Supplying goods or services without issuing a computerized or printed Mushak-6.3 incurs statutory minimum fines from BDT 10,000 up to BDT 100,000 per violation.'}
                    {selectedTermId === 'sixth-schedule' && 'Failing to formally declare exempt income under Part A in the return leads the tax officer to treat the money as unrecorded deemed income under Section 67 at full marginal tax rates.'}
                    {selectedTermId === 'vds' && 'The withholding entity becomes personally liable for the full un-deducted VAT amount plus penalty interest, regardless of whether the vendor already received the cash.'}
                    {selectedTermId === 'psr' && 'Banks cannot release loans exceeding BDT 5 Lakh; City Corporations cannot renew trade licenses; and customs cannot clear commercial cargo without verified PSR.'}
                    {selectedTermId === 'min-tax' && 'Submitting a tax return with tax payable below the statutory minimum floor results in notice of demand under Section 173 and default interest.'}
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-rose-200 text-xs font-mono font-bold text-rose-900">
                  Statutory Clause: {selectedTermId === 'tds' ? 'ITA 2023, Sec 55(ka)' : selectedTermId === 'vat' ? 'VAT Act 2012, Sec 85' : 'ITA 2023, Sec 67'}
                </div>
              </div>

              {/* Penalty Card 2 */}
              <div className="p-6 rounded-2xl bg-amber-50/70 border-2 border-amber-200 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-4 shadow-sm">
                    <Scale className="w-5 h-5" />
                  </div>
                  <h5 className="text-lg font-bold text-amber-950 mb-2">
                    {selectedTermId === 'tds' && '2% Monthly Compounding Interest'}
                    {selectedTermId === 'vat' && 'Late Filing Surcharge (9.1)'}
                    {selectedTermId === 'sixth-schedule' && 'Rebate Revocation'}
                    {selectedTermId === 'vds' && '2% Monthly Interest on VDS'}
                    {selectedTermId === 'psr' && '50% Higher TDS Rate'}
                    {selectedTermId === 'min-tax' && 'Interest Penalty (Sec 174)'}
                  </h5>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {selectedTermId === 'tds' && 'Under Section 143, any delayed deposit of deducted tax incurs interest penalty at the rate of 2% per month calculated from the date deduction was due until actual deposit.'}
                    {selectedTermId === 'vat' && 'Failing to file Mushak-9.1 monthly return by the 15th incurs a flat BDT 10,000 late filing fine plus 2% monthly interest on any unpaid VAT balance.'}
                    {selectedTermId === 'sixth-schedule' && 'Claiming tax rebate under Part B without authentic bank deposit certificates or investment in taxpayer’s own name results in instant disallowance and re-assessment.'}
                    {selectedTermId === 'vds' && 'Delayed deposit of deducted VDS incurs 2% per month statutory interest until payment is recorded in the VAT commissionerate.'}
                    {selectedTermId === 'psr' && 'Under Section 264, withholding agents MUST deduct tax at a 50% HIGHER rate if the recipient cannot produce a valid verified PSR slip.'}
                    {selectedTermId === 'min-tax' && 'Unpaid minimum tax attracts default surcharge under Section 174 and potential attachment of bank accounts.'}
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-amber-200 text-xs font-mono font-bold text-amber-900">
                  Financial Impact: Recurring monthly interest
                </div>
              </div>

              {/* Penalty Card 3 */}
              <div className="p-6 rounded-2xl bg-slate-900 text-white flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center mb-4 shadow-sm font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h5 className="text-lg font-bold text-white mb-2">
                    Recommended Safe Practice
                  </h5>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {selectedTermId === 'tds' && 'Always verify payee’s e-TIN and PSR before issuing cheques. Automate monthly withholding reconciliations and generate e-Challan within 10 days of payment.'}
                    {selectedTermId === 'vat' && 'Ensure all sales invoices are generated in Mushak-6.3 format and reconcile input tax credits against purchase registers before the 15th of each month.'}
                    {selectedTermId === 'sixth-schedule' && 'Complete all planned investments in DPS, Insurance, or Treasury Bonds by 15 June. Always retain original bank statements with bank seal.'}
                    {selectedTermId === 'vds' && 'Issue Form Mushak-6.6 within 3 business days of payment so vendors do not face VAT credit discrepancies.'}
                    {selectedTermId === 'psr' && 'File your income tax return well before Tax Day (30 November) and maintain both digital PDF and printed copies of acknowledgment receipts.'}
                    {selectedTermId === 'min-tax' && 'Check whether your gross turnover or commercial activity falls under Section 163 to avoid back-taxes during audit.'}
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-800 text-xs text-emerald-400 font-semibold">
                  Compliance Status: Full legal protection
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: CONCEPT CHECK MICRO-QUIZ */}
        {/* ========================================================= */}
        {activeTab === 'quiz' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="max-w-2xl mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
                Knowledge Check & Validation
              </span>
              <h4 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                Quick Scenario Micro-Quiz
              </h4>
              <p className="text-sm text-slate-600 mt-1">
                Test your practical understanding of {currentTermData.shortTerm} with instant statutory explanation and reference.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-200">
              {/* Scenario 1 */}
              <div className="mb-8 pb-8 border-b border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded">
                    Scenario 1
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">
                    {selectedTermId === 'tds' ? 'Withholding & PSR Rule' : selectedTermId === 'vat' ? 'Input Credit Eligibility' : 'Sixth Schedule Part B Calculation'}
                  </span>
                </div>

                <h5 className="text-base sm:text-lg font-bold text-slate-900 mb-3">
                  {selectedTermId === 'tds' && 'A company pays BDT 100,000 office rent to a landlord who refuses to provide their Proof of Submission of Return (PSR). What is the tenant’s legal obligation?'}
                  {selectedTermId === 'vat' && 'A business purchases consultancy services under a truncated 5% VAT rate. Can the business claim an input tax credit (রেয়াত) in its Mushak-9.1 return?'}
                  {selectedTermId === 'sixth-schedule' && 'A taxpayer earns BDT 1,000,000 taxable income and invests BDT 300,000 in DPS and Sanchayapatra. What is their maximum allowable investment ceiling?'}
                  {['vds', 'psr', 'min-tax'].includes(selectedTermId) && 'Under Section 264, is a bank legally permitted to disburse a personal car loan of BDT 1,000,000 without obtaining a verified PSR?'}
                </h5>

                {/* Options */}
                <div className="space-y-2.5 max-w-xl">
                  {selectedTermId === 'tds' && [
                    { label: 'A. Pay full BDT 100,000 without deduction', isCorrect: false },
                    { label: 'B. Deduct standard 5% TDS (BDT 5,000)', isCorrect: false },
                    { label: 'C. Deduct 50% higher punitive TDS: 7.5% (BDT 7,500) under Section 264', isCorrect: true },
                    { label: 'D. Deduct 25% TDS like lottery winnings', isCorrect: false }
                  ].map((opt, idx) => {
                    const isSelected = quizAnswers['q1'] === idx;
                    const submitted = quizSubmitted['q1'];

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setQuizAnswers(prev => ({ ...prev, q1: idx }));
                          setQuizSubmitted(prev => ({ ...prev, q1: true }));
                        }}
                        className={`w-full p-3.5 rounded-xl text-left text-xs sm:text-sm font-semibold transition-all border flex items-center justify-between ${
                          submitted && opt.isCorrect
                            ? 'bg-emerald-100 border-emerald-500 text-emerald-950 font-bold'
                            : submitted && isSelected && !opt.isCorrect
                            ? 'bg-rose-100 border-rose-400 text-rose-900 font-bold'
                            : isSelected
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {submitted && opt.isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
                        {submitted && isSelected && !opt.isCorrect && <XCircle className="w-4 h-4 text-rose-700" />}
                      </button>
                    );
                  })}

                  {selectedTermId === 'vat' && [
                    { label: 'A. Yes, all VAT payments are always eligible for input rebate', isCorrect: false },
                    { label: 'B. No, truncated rates (5%, 7.5%, 10%) are statutorily barred from input tax credit', isCorrect: true },
                    { label: 'C. Yes, but only with special NBR permission', isCorrect: false },
                    { label: 'D. Only if turnover is below 50 Lakhs', isCorrect: false }
                  ].map((opt, idx) => {
                    const isSelected = quizAnswers['q1'] === idx;
                    const submitted = quizSubmitted['q1'];

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setQuizAnswers(prev => ({ ...prev, q1: idx }));
                          setQuizSubmitted(prev => ({ ...prev, q1: true }));
                        }}
                        className={`w-full p-3.5 rounded-xl text-left text-xs sm:text-sm font-semibold transition-all border flex items-center justify-between ${
                          submitted && opt.isCorrect
                            ? 'bg-emerald-100 border-emerald-500 text-emerald-950 font-bold'
                            : submitted && isSelected && !opt.isCorrect
                            ? 'bg-rose-100 border-rose-400 text-rose-900 font-bold'
                            : isSelected
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {submitted && opt.isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
                        {submitted && isSelected && !opt.isCorrect && <XCircle className="w-4 h-4 text-rose-700" />}
                      </button>
                    );
                  })}

                  {(selectedTermId === 'sixth-schedule' || ['vds', 'psr', 'min-tax'].includes(selectedTermId)) && [
                    { label: 'A. BDT 300,000 (actual investment)', isCorrect: false },
                    { label: 'B. BDT 200,000 (20% of BDT 1,000,000 taxable income ceiling)', isCorrect: true },
                    { label: 'C. BDT 1,000,000 (statutory maximum limit)', isCorrect: false },
                    { label: 'D. BDT 120,000 (DPS cap)', isCorrect: false }
                  ].map((opt, idx) => {
                    const isSelected = quizAnswers['q1'] === idx;
                    const submitted = quizSubmitted['q1'];

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setQuizAnswers(prev => ({ ...prev, q1: idx }));
                          setQuizSubmitted(prev => ({ ...prev, q1: true }));
                        }}
                        className={`w-full p-3.5 rounded-xl text-left text-xs sm:text-sm font-semibold transition-all border flex items-center justify-between ${
                          submitted && opt.isCorrect
                            ? 'bg-emerald-100 border-emerald-500 text-emerald-950 font-bold'
                            : submitted && isSelected && !opt.isCorrect
                            ? 'bg-rose-100 border-rose-400 text-rose-900 font-bold'
                            : isSelected
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {submitted && opt.isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
                        {submitted && isSelected && !opt.isCorrect && <XCircle className="w-4 h-4 text-rose-700" />}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Box */}
                {quizSubmitted['q1'] && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-900 text-white text-xs sm:text-sm space-y-1.5 animate-fadeIn">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                      <Sparkles className="w-4 h-4" />
                      <span>Statutory Explanation:</span>
                    </div>
                    <p className="text-slate-300">
                      {selectedTermId === 'tds' && 'Under Section 264(3), where a payee is required to present Proof of Submission of Return (PSR) but fails to do so, the withholding tax rate increases by 50% (5% becomes 7.5%).'}
                      {selectedTermId === 'vat' && 'Under the VAT & SD Act, 2012, input tax credit (রেয়াত) is strictly conditional on paying the standard 15% rate and holding a valid Mushak-6.3. Truncated rates do not enjoy input tax rebates.'}
                      {selectedTermId === 'sixth-schedule' && 'Under Part B of the Sixth Schedule, the allowable investment ceiling is the lowest of: (a) actual eligible investment (BDT 300,000), (b) 20% of taxable income (BDT 200,000), or (c) BDT 1,000,000. Hence, BDT 200,000 applies.'}
                      {['vds', 'psr', 'min-tax'].includes(selectedTermId) && 'Under Part B, 20% of taxable income acts as the statutory ceiling, so the allowable investment is capped at BDT 200,000.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Reset Quiz Button */}
              {quizSubmitted['q1'] && (
                <button
                  onClick={() => {
                    setQuizAnswers({});
                    setQuizSubmitted({});
                  }}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Question</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* COMPACT FOOTER SUMMARY BAR */}
      {/* ========================================================= */}
      <div className="bg-slate-50 px-6 sm:px-8 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-600" />
          <span>Statutory Authority: <strong>National Board of Revenue (NBR), Government of Bangladesh</strong></span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-slate-400">Current Law: ITA 2023 / Finance Act 2026</span>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-emerald-700 hover:underline font-bold"
          >
            Back to Top ↑
          </button>
        </div>
      </div>
    </div>
  );
};
