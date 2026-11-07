import React, { useState } from 'react';
import { 
  Calculator, 
  HelpCircle, 
  ArrowRight, 
  RotateCcw, 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  BookOpen, 
  Layers, 
  ShieldCheck, 
  Sparkles,
  Info,
  ChevronRight
} from 'lucide-react';

interface GrossVsTaxableIncomeCardProps {
  showBengaliDefault?: boolean;
  className?: string;
}

export const GrossVsTaxableIncomeCard: React.FC<GrossVsTaxableIncomeCardProps> = ({
  showBengaliDefault = false,
  className = ''
}) => {
  const [lang, setLang] = useState<'en' | 'bn'>(showBengaliDefault ? 'bn' : 'en');
  const [activeTab, setActiveTab] = useState<'matrix' | 'simulator' | 'slabs'>('matrix');
  const [copied, setCopied] = useState(false);

  // Mini-simulator state
  const [taxpayerType, setTaxpayerType] = useState<'male' | 'female_senior' | 'disabled' | 'freedom_fighter'>('male');
  const [grossSalary, setGrossSalary] = useState<number>(1200000);
  const [grossRent, setGrossRent] = useState<number>(600000);
  const [rentType, setRentType] = useState<'residential' | 'commercial'>('residential');
  const [grossBusiness, setGrossBusiness] = useState<number>(500000);
  const [businessExp, setBusinessExp] = useState<number>(200000);
  const [financialGross, setFinancialGross] = useState<number>(150000);
  const [partnershipShare, setPartnershipShare] = useState<number>(200000); // Taxed at firm level
  const [eligibleInvestments, setEligibleInvestments] = useState<number>(150000);

  // Computations
  // 1. Employment: Lower of 1/3 of salary or 450,000 exempt
  const salaryExemption = Math.min(Math.round(grossSalary / 3), 450000);
  const netSalary = Math.max(0, grossSalary - salaryExemption);

  // 2. Rent: 25% residential, 30% commercial statutory repairs
  const rentRepairsRate = rentType === 'residential' ? 0.25 : 0.30;
  const rentRepairsDeduction = Math.round(grossRent * rentRepairsRate);
  const netRent = Math.max(0, grossRent - rentRepairsDeduction);

  // 3. Business
  const netBusiness = Math.max(0, grossBusiness - businessExp);

  // 4. Financial
  const netFinancial = financialGross;

  // Total Income
  const totalIncome = netSalary + netRent + netBusiness + netFinancial + partnershipShare;

  // 3% Rebate Base (Excludes partnership share taxed at firm level under Section 78)
  const qualifyingRebateBase = netSalary + netRent + netBusiness + netFinancial;

  // Tax-free thresholds for FY 2026-27
  const thresholds: Record<string, number> = {
    male: 350000,
    female_senior: 400000,
    disabled: 475000,
    freedom_fighter: 500000
  };
  const threshold = thresholds[taxpayerType];

  // Slab tax calculation
  const calculateTax = (income: number, freeLimit: number) => {
    let taxableRemaining = Math.max(0, income - freeLimit);
    let tax = 0;
    const slabs = [
      { limit: 100000, rate: 0.05 },
      { limit: 400000, rate: 0.10 },
      { limit: 500000, rate: 0.15 },
      { limit: 500000, rate: 0.20 },
      { limit: Infinity, rate: 0.25 }
    ];

    for (const slab of slabs) {
      if (taxableRemaining <= 0) break;
      const taxableInSlab = Math.min(taxableRemaining, slab.limit);
      tax += taxableInSlab * slab.rate;
      taxableRemaining -= taxableInSlab;
    }
    return Math.round(tax);
  };

  const grossTax = calculateTax(totalIncome, threshold);

  // Investment rebate: Lowest of:
  // 1) 3% of qualifying total income
  // 2) 10% of qualifying investments
  // 3) BDT 750,000 cap
  const rebateByIncome = Math.round(qualifyingRebateBase * 0.03);
  const rebateByInvest = Math.round(eligibleInvestments * 0.10);
  const allowableRebate = Math.min(rebateByIncome, rebateByInvest, 750000);
  const netTaxPayable = Math.max(0, grossTax - allowableRebate);

  const copySummary = () => {
    const text = lang === 'en'
      ? `Bangladesh Tax Year 2026-27 Summary:
Gross Receipts: BDT ${(grossSalary + grossRent + grossBusiness + financialGross + partnershipShare).toLocaleString()}
Total Income (Section 30): BDT ${totalIncome.toLocaleString()}
Qualifying Rebate Base (Sec 78): BDT ${qualifyingRebateBase.toLocaleString()}
Tax-Free Threshold: BDT ${threshold.toLocaleString()}
Gross Tax Liability: BDT ${grossTax.toLocaleString()}
Allowable Investment Rebate: BDT ${allowableRebate.toLocaleString()}
Net Tax Payable: BDT ${netTaxPayable.toLocaleString()}
Source: Income Tax Act 2023 | E-Lawyers Compliance Hub`
      : `বাংলাদেশ করবর্ষ ২০২৬-২৭ সারসংক্ষেপ:
মোট প্রাপ্তি (Gross Receipts): ${(grossSalary + grossRent + grossBusiness + financialGross + partnershipShare).toLocaleString()} টাকা
মোট আয় (ধারা ৩০): ${totalIncome.toLocaleString()} টাকা
রেয়াত গণনার ভিত্তি (ধারা ৭৮): ${qualifyingRebateBase.toLocaleString()} টাকা
করমুক্ত সীমা: ${threshold.toLocaleString()} টাকা
মোট কর দায়: ${grossTax.toLocaleString()} টাকা
বিনিয়োগ কর রেয়াত: ${allowableRebate.toLocaleString()} টাকা
নিট প্রদেয় কর: ${netTaxPayable.toLocaleString()} টাকা
উৎস: আয়কর আইন ২০২৩ | ই-লইয়ার্স কমপ্লায়েন্স হাব`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/90 shadow-md overflow-hidden ${className}`}>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-2">
              <Scale className="w-3.5 h-3.5" />
              <span>Income Tax Act, 2023 | Sections 26, 29, 30 & 78</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {lang === 'en' 
                ? 'Gross Receipts vs. Head Income vs. Total Taxable Income' 
                : 'গ্রস প্রাপ্তি বনাম খাতাভিত্তিক আয় বনাম মোট করযোগ্য আয়'}
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              {lang === 'en'
                ? 'Interactive Statutory Matrix, Multi-Head Aggregator & Tax Slabs for FY 2026–27'
                : '২০২৬-২৭ করবর্ষের খাতাভিত্তিক গণনা, সংবিধিভিত্তিক রেয়াত এবং কর স্ল্যাব সিমুলেটর'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {/* Language Switcher */}
            <div className="inline-flex p-1 rounded-xl bg-slate-800/80 border border-slate-700">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  lang === 'en' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLang('bn')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  lang === 'bn' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                বাংলা
              </button>
            </div>

            {/* Copy Button */}
            <button
              type="button"
              onClick={copySummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="Copy Summary"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (lang === 'en' ? 'Copied!' : 'কপি হয়েছে') : (lang === 'en' ? 'Copy' : 'কপি')}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 mt-6 gap-2 sm:gap-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`pb-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'matrix'
                ? 'border-indigo-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{lang === 'en' ? '1. Concept Comparison Matrix' : '১. ধারণাগত তুলনামূলক ম্যাট্রিক্স'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={`pb-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'simulator'
                ? 'border-indigo-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>{lang === 'en' ? '2. Multi-Head Quick Aggregator' : '২. দ্রুত মোট আয় ক্যালকুলেটর'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('slabs')}
            className={`pb-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'slabs'
                ? 'border-indigo-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{lang === 'en' ? '3. FY 2026–27 Tax Slabs & Rules' : '৩. ২০২৬–২৭ কর স্ল্যাব ও নিয়ম'}</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Comparison Matrix */}
      {activeTab === 'matrix' && (
        <div className="p-6 sm:p-8 space-y-6">
          <div className="bg-indigo-50 border border-indigo-200/80 rounded-xl p-4 text-indigo-950 text-sm flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">
                {lang === 'en' 
                  ? 'Core Principle: Gross Receipts ≠ Head Income ≠ Total Taxable Income' 
                  : 'মৌলিক নীতি: গ্রস প্রাপ্তি ≠ খাতাভিত্তিক আয় ≠ মোট করযোগ্য আয়'}
              </p>
              <p className="mt-1 text-indigo-900/90 text-xs sm:text-sm leading-relaxed">
                {lang === 'en'
                  ? 'Under Sections 29, 30, and 78 of the Income Tax Act, 2023, each rupee received is examined through three successive statutory filters: allowable deductions per head, aggregate total income, and statutory exclusions from the investment tax rebate base.'
                  : 'আয়কর আইন ২০২৩-এর ধারা ২৯, ৩০ এবং ৭৮ অনুযায়ী প্রাপ্ত অর্থকে তিনটি সংবিধিবদ্ধ ধাপে ভাগ করা হয়: প্রতিটি খাতের অনুমোদিত কর্তন, সমন্বিত মোট আয় এবং বিনিয়োগ রেয়াতের ভিত্তিমূল্য থেকে সুনির্দিষ্ট বাদ দেওয়া।'
                }
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 border-b border-slate-200 font-semibold">
                  <th className="p-3 sm:p-4">{lang === 'en' ? 'Statutory Level' : 'সংবিধিবদ্ধ স্তর'}</th>
                  <th className="p-3 sm:p-4">{lang === 'en' ? 'Definition & Scope' : 'সংজ্ঞা ও পরিধি'}</th>
                  <th className="p-3 sm:p-4">{lang === 'en' ? 'Allowable Deductions / Adjustments' : 'অনুমোদিত কর্তন ও সমন্বয়'}</th>
                  <th className="p-3 sm:p-4">{lang === 'en' ? 'Statutory Reference' : 'আইনি রেফারেন্স'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="hover:bg-slate-50">
                  <td className="p-3 sm:p-4 font-semibold text-slate-900">
                    <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-bold mb-1">Level 1</span><br />
                    {lang === 'en' ? 'Gross Receipts (গ্রস প্রাপ্তি)' : 'গ্রস প্রাপ্তি (Gross Receipts)'}
                  </td>
                  <td className="p-3 sm:p-4 text-slate-600">
                    {lang === 'en'
                      ? 'Total money received by the taxpayer before any deductions (e.g. gross turnover, total salary credited, total rent collected, gross dividend).'
                      : 'যেকোনো কর্তনের পূর্বে করদাতার মোট প্রাপ্ত অর্থ (যেমন: মোট বিক্রয়মূল্য, ব্যাংক হিসাবে আসা মোট বেতন, মোট বাড়িভাড়া, গ্রস লভ্যাংশ)।'}
                  </td>
                  <td className="p-3 sm:p-4 text-slate-600">
                    <span className="text-amber-700 font-medium">
                      {lang === 'en' ? 'None (Raw inflows)' : 'কোনো কর্তন নেই (কাঁচা প্রাপ্তি)'}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4 font-mono text-xs text-slate-500">Sec 26 & Accounting</td>
                </tr>

                <tr className="hover:bg-slate-50">
                  <td className="p-3 sm:p-4 font-semibold text-slate-900">
                    <span className="inline-block px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-xs font-bold mb-1">Level 2</span><br />
                    {lang === 'en' ? 'Income Under Heads (খাতভিত্তিক আয়)' : 'খাতভিত্তিক আয় (Head-wise Income)'}
                  </td>
                  <td className="p-3 sm:p-4 text-slate-600">
                    {lang === 'en'
                      ? 'Gross receipts of each head minus statutory deductions, expenses, and allowable Sixth Schedule exemptions.'
                      : 'প্রতিটি খাতের প্রাপ্ত অর্থ থেকে ষষ্ঠ তফসিলের অনুমোদিত অব্যাহতি, সংবিধিবদ্ধ মেরামত বা পরিচালন ব্যয় বাদ দেওয়ার পর অবশিষ্ট আয়।'}
                  </td>
                  <td className="p-3 sm:p-4 text-slate-600">
                    {lang === 'en'
                      ? 'Salary: Min(1/3rd, 450k); Rent: 25% or 30% repairs; Business: Actual expenses & depreciation; Agri: 60% production cost.'
                      : 'চাকরি: ১/৩ অংশ বা ৪.৫ লাখ; ভাড়া: ২৫% বা ৩০% মেরামত; ব্যবসা: অনুমোদিত ব্যয় ও অবচয়; কৃষি: ৬০% উৎপাদন খরচ।'}
                  </td>
                  <td className="p-3 sm:p-4 font-mono text-xs text-slate-500">Sec 32, 36, 40, 45, 57, 62, 66</td>
                </tr>

                <tr className="hover:bg-slate-50 bg-indigo-50/40">
                  <td className="p-3 sm:p-4 font-semibold text-slate-900">
                    <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-bold mb-1">Level 3</span><br />
                    {lang === 'en' ? 'Total Income (মোট আয়)' : 'মোট আয় (Total Income)'}
                  </td>
                  <td className="p-3 sm:p-4 text-slate-600">
                    {lang === 'en'
                      ? 'Aggregate of net income computed across all applicable statutory heads under Section 30, plus deemed additions under Sections 66 & 67.'
                      : 'ধারা ৩০-এর অধীনে হিসাবকৃত সকল খাতের নিট আয়ের যোগফল এবং ধারা ৬৬ ও ৬৭-এর আরোপিত বা অনুমানভিত্তিক আয়ের সমষ্টি।'}
                  </td>
                  <td className="p-3 sm:p-4 text-slate-600">
                    {lang === 'en'
                      ? 'Aggregated across 7 statutory heads (IT-11GA reporting figure).'
                      : '৭টি খাতের মোট আয়ের যোগফল (আইটি-১১গ রিটার্নের মূল ভিত্তি)।'}
                  </td>
                  <td className="p-3 sm:p-4 font-mono text-xs text-emerald-700 font-bold">Sec 29 & 30</td>
                </tr>

                <tr className="hover:bg-slate-50">
                  <td className="p-3 sm:p-4 font-semibold text-slate-900">
                    <span className="inline-block px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-xs font-bold mb-1">Level 4</span><br />
                    {lang === 'en' ? '3% Rebate Base (রেয়াতের ভিত্তি)' : '৩% রেয়াতের ভিত্তি (Section 78 Base)'}
                  </td>
                  <td className="p-3 sm:p-4 text-slate-600">
                    {lang === 'en'
                      ? 'Total Income minus statutory exclusions: excludes partnership profit shares already taxed at firm level, exempt agriculture, and Sec 163 final tax.'
                      : 'মোট আয় থেকে ধারা ৭৮-এর অধীনে বাদ দেওয়া অংশ: অংশীদারি ফার্মের আয়ের অংশ (যা ফার্ম পর্যায়ে কর পরিশোধিত), করমুক্ত কৃষি আয় ইত্যাদি বাদ যায়।'}
                  </td>
                  <td className="p-3 sm:p-4 text-slate-600">
                    {lang === 'en'
                      ? 'Total Income − (Partnership share + Exempt income + Final tax items)'
                      : 'মোট আয় − (ফার্মের আয়ের অংশ + করমুক্ত আয় + চূড়ান্ত করযোগ্য আয়)'}
                  </td>
                  <td className="p-3 sm:p-4 font-mono text-xs text-purple-700 font-bold">Sec 78</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="border border-emerald-200 bg-emerald-50/60 rounded-xl p-4 text-xs sm:text-sm">
              <div className="flex items-center gap-2 font-bold text-emerald-900 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{lang === 'en' ? 'What Taxpayers Must Remember' : 'করদাতাদের মনে রাখা জরুরি'}</span>
              </div>
              <p className="text-emerald-800/90 leading-relaxed">
                {lang === 'en'
                  ? 'Always calculate net income head-by-head first before summing. Never apply the 3% rebate formula directly on gross turnover or on total income without deducting taxed partnership profits.'
                  : 'রিটার্ন প্রস্তুতকালে প্রথমে প্রতিটি খাতের বৈধ কর্তন বাদ দিয়ে নিট আয় বের করুন। ফার্মের কর পরিশোধিত মুনাফা মোট আয়ের অংশ হলেও ৩% রেয়াত গণনায় আসবে না।'}
              </p>
            </div>

            <div className="border border-amber-200 bg-amber-50/60 rounded-xl p-4 text-xs sm:text-sm">
              <div className="flex items-center gap-2 font-bold text-amber-900 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{lang === 'en' ? 'Common NBR Audit Traps' : 'সাধারণ অডিট সতর্কতা'}</span>
              </div>
              <p className="text-amber-800/90 leading-relaxed">
                {lang === 'en'
                  ? 'Over-claiming salary allowances without respecting the BDT 450,000 ceiling, claiming 30% commercial repair on residential flats, or deducting unapproved cash expenses under Section 55.'
                  : 'বেতন খাতে ৪,৫০,০০০ টাকার বেশি অব্যাহতি দাবি করা, আবাসিক ফ্ল্যাটে ৩০% মেরামত খরচ দাবি করা কিংবা ব্যাংক চ্যানেল ছাড়া ৫০,০০০ টাকার বেশি লেনদেনের ব্যয় অননুমোদিত হওয়া।'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Quick Multi-Head Aggregator Simulator */}
      {activeTab === 'simulator' && (
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Inputs Column */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-indigo-600" />
                  <span>{lang === 'en' ? 'Enter Annual Receipts & Inflows (BDT)' : 'বার্ষিক প্রাপ্তি ও আয়ের তথ্য (টাকা)'}</span>
                </h3>
                <span className="text-xs text-slate-500 font-mono">AY 2026–27</span>
              </div>

              {/* Taxpayer Category Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {lang === 'en' ? 'Taxpayer Category (Tax-Free Threshold)' : 'করদাতার শ্রেণি (করমুক্ত সীমা)'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'male', labelEn: 'Male (350k)', labelBn: 'সাধারণ পুরুষ (৩.৫ লাখ)' },
                    { id: 'female_senior', labelEn: 'Female / 65+ (400k)', labelBn: 'নারী / ৬৫+ (৪ লাখ)' },
                    { id: 'disabled', labelEn: 'Disabled (475k)', labelBn: 'প্রতিবন্ধী (৪.৭৫ লাখ)' },
                    { id: 'freedom_fighter', labelEn: 'Freedom F. (500k)', labelBn: 'মুক্তিযোদ্ধা (৫ লাখ)' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setTaxpayerType(cat.id as any)}
                      className={`px-2 py-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                        taxpayerType === cat.id
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {lang === 'en' ? cat.labelEn : cat.labelBn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input: Salary */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-800">
                  <span>{lang === 'en' ? '1. Gross Salary (চাকরি আয়)' : '১. গ্রস বেতন (চাকরি আয়)'}</span>
                  <span className="text-indigo-600 font-mono">
                    {lang === 'en' ? `Exempt: BDT ${salaryExemption.toLocaleString()}` : `অব্যাহতি: ${salaryExemption.toLocaleString()} টাকা`}
                  </span>
                </div>
                <input
                  type="number"
                  step="10000"
                  value={grossSalary}
                  onChange={(e) => setGrossSalary(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <p className="text-[11px] text-slate-500">
                  {lang === 'en'
                    ? `Sixth Schedule: Min(1/3rd, BDT 450,000) = BDT ${salaryExemption.toLocaleString()} exempt. Net taxable: BDT ${netSalary.toLocaleString()}`
                    : `ষষ্ঠ তফসিল: ১/৩ বা ৪,৫০,০০০ টাকার মধ্যে যা কম = ${salaryExemption.toLocaleString()} টাকা বাদ। নিট করযোগ্য: ${netSalary.toLocaleString()} টাকা`}
                </p>
              </div>

              {/* Input: House Rent */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-800">
                  <span>{lang === 'en' ? '2. Gross Rent Collected (ভাড়া আয়)' : '২. মোট বাড়িভাড়া প্রাপ্তি'}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setRentType('residential')}
                      className={`px-2 py-0.5 text-[11px] rounded ${rentType === 'residential' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-200 text-slate-700'}`}
                    >
                      Res (25%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRentType('commercial')}
                      className={`px-2 py-0.5 text-[11px] rounded ${rentType === 'commercial' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-200 text-slate-700'}`}
                    >
                      Comm (30%)
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  step="10000"
                  value={grossRent}
                  onChange={(e) => setGrossRent(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <p className="text-[11px] text-slate-500">
                  {lang === 'en'
                    ? `Statutory Repairs Allowance (${rentType === 'residential' ? '25%' : '30%'}): BDT ${rentRepairsDeduction.toLocaleString()}. Net taxable: BDT ${netRent.toLocaleString()}`
                    : `সংবিধিবদ্ধ মেরামত কর্তন (${rentType === 'residential' ? '২৫%' : '৩০%'}): ${rentRepairsDeduction.toLocaleString()} টাকা। নিট ভাড়া: ${netRent.toLocaleString()} টাকা`}
                </p>
              </div>

              {/* Input: Business Profit */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-800">
                  <span>{lang === 'en' ? '3. Business Gross & Allowable Expense' : '৩. ব্যবসা আয় ও অনুমোদিত ব্যয়'}</span>
                  <span className="text-emerald-700 font-mono">Net: BDT {netBusiness.toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="10000"
                    placeholder="Gross Receipts"
                    value={grossBusiness}
                    onChange={(e) => setGrossBusiness(Number(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                  />
                  <input
                    type="number"
                    step="10000"
                    placeholder="Allowable Exp"
                    value={businessExp}
                    onChange={(e) => setBusinessExp(Number(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Input: Financial Assets & Partnership */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-800 block">
                    {lang === 'en' ? '4. Financial Assets (ব্যাংক সুদ/লভ্যাংশ)' : '৪. ব্যাংক সুদ / লভ্যাংশ'}
                  </label>
                  <input
                    type="number"
                    step="5000"
                    value={financialGross}
                    onChange={(e) => setFinancialGross(Number(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-800 block flex items-center justify-between">
                    <span>{lang === 'en' ? '5. Partnership Profit Share' : '৫. অংশীদারি মুনাফা'}</span>
                    <span className="text-[10px] text-amber-700 font-bold">Sec 78 Excluded</span>
                  </label>
                  <input
                    type="number"
                    step="10000"
                    value={partnershipShare}
                    onChange={(e) => setPartnershipShare(Number(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Input: Eligible Investment */}
              <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-3 space-y-1.5">
                <label className="text-xs font-semibold text-indigo-950 block">
                  {lang === 'en' ? 'Eligible Investment for Rebate (DPS, Life Insurance, Gov Securities)' : 'অনুমোদনযোগ্য বিনিয়োগ (ডিপিএস, জীবন বীমা, ট্রেজারি বন্ড)'}
                </label>
                <input
                  type="number"
                  step="10000"
                  value={eligibleInvestments}
                  onChange={(e) => setEligibleInvestments(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-indigo-300 rounded-lg font-mono"
                />
              </div>
            </div>

            {/* Live Calculation Output Card */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-slate-900 text-white rounded-2xl p-6 shadow-xl space-y-5">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <span className="text-xs uppercase font-bold tracking-wider text-indigo-400">
                    {lang === 'en' ? 'Tax Computation Sheet' : 'কর গণনাপত্র'}
                  </span>
                  <span className="text-xs text-slate-400">ITA 2023 Framework</span>
                </div>

                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                    <span className="text-slate-300">{lang === 'en' ? 'Net Employment Income:' : 'নিট চাকরি আয়:'}</span>
                    <span className="font-mono font-semibold text-slate-100">BDT {netSalary.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                    <span className="text-slate-300">{lang === 'en' ? 'Net House Rent Income:' : 'নিট ভাড়া আয়:'}</span>
                    <span className="font-mono font-semibold text-slate-100">BDT {netRent.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                    <span className="text-slate-300">{lang === 'en' ? 'Net Business Income:' : 'নিট ব্যবসা আয়:'}</span>
                    <span className="font-mono font-semibold text-slate-100">BDT {netBusiness.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                    <span className="text-slate-300">{lang === 'en' ? 'Financial Assets Income:' : 'আর্থিক পরিসম্পদ আয়:'}</span>
                    <span className="font-mono font-semibold text-slate-100">BDT {netFinancial.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                    <span className="text-slate-300">{lang === 'en' ? 'Partnership Profit (Head 8):' : 'অংশীদারি মুনাফা (খাত ৮):'}</span>
                    <span className="font-mono font-semibold text-amber-300">BDT {partnershipShare.toLocaleString()}</span>
                  </div>

                  {/* Total Income */}
                  <div className="flex justify-between items-center py-2.5 bg-indigo-950/70 border border-indigo-700/50 rounded-xl px-3 my-2">
                    <span className="font-bold text-indigo-200">
                      {lang === 'en' ? 'Total Income (মোট আয়):' : 'মোট আয় (Total Income):'}
                    </span>
                    <span className="font-mono font-bold text-white text-base">
                      BDT {totalIncome.toLocaleString()}
                    </span>
                  </div>

                  {/* Section 78 Distinction Alert */}
                  <div className="text-[11px] text-slate-400 bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60 leading-relaxed">
                    <span className="text-amber-400 font-semibold">{lang === 'en' ? 'Note:' : 'লক্ষ্য করুন:'}</span>{' '}
                    {lang === 'en'
                      ? `Section 78 3% base is BDT ${qualifyingRebateBase.toLocaleString()} (excludes BDT ${partnershipShare.toLocaleString()} partnership share).`
                      : `ধারা ৭৮ অনুযায়ী ৩% রেয়াতের ভিত্তি ${qualifyingRebateBase.toLocaleString()} টাকা (ফার্মের অংশ বাদ দিয়ে)।`}
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-800/80 text-xs">
                    <span className="text-slate-300">{lang === 'en' ? 'Tax-Free Threshold:' : 'করমুক্ত সীমা:'}</span>
                    <span className="font-mono text-slate-300">BDT {threshold.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-800/80 text-xs">
                    <span className="text-slate-300">{lang === 'en' ? 'Gross Tax on Slabs:' : 'স্ল্যাব অনুযায়ী মোট কর:'}</span>
                    <span className="font-mono text-slate-200">BDT {grossTax.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-800/80 text-xs text-emerald-400">
                    <span>{lang === 'en' ? 'Less: Investment Tax Rebate:' : 'বাদ: বিনিয়োগ কর রেয়াত:'}</span>
                    <span className="font-mono font-bold">- BDT {allowableRebate.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Net Payable Banner */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-4 text-white shadow-lg">
                <div className="text-[11px] uppercase tracking-wider text-emerald-100 font-semibold">
                  {lang === 'en' ? 'Estimated Net Tax Payable' : 'আনুমানিক নিট প্রদেয় কর'}
                </div>
                <div className="text-2xl font-black font-mono tracking-tight mt-0.5">
                  BDT {netTaxPayable.toLocaleString()}
                </div>
                <div className="text-[10px] text-emerald-100 mt-1 flex items-center justify-between">
                  <span>{lang === 'en' ? 'Before TDS deduction at source' : 'উৎসে কর (TDS) কর্তন সমন্বয়ের পূর্বে'}</span>
                  <a href="#total-income-calculator-tool" className="underline font-bold text-white hover:text-emerald-200">
                    {lang === 'en' ? 'Full Calculator ↓' : 'পূর্ণাঙ্গ ক্যালকুলেটর ↓'}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: FY 2026–27 Tax Slabs & Rules */}
      {activeTab === 'slabs' && (
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Slab Table */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <span>{lang === 'en' ? 'Individual Income Tax Slabs (FY 2026–27)' : 'ব্যক্তি শ্রেণির আয়কর স্ল্যাব (২০২৬–২৭)'}</span>
              </h3>
              
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-100 text-slate-800 font-semibold">
                    <tr>
                      <th className="p-3">Slab Band</th>
                      <th className="p-3">Amount (BDT)</th>
                      <th className="p-3">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-3 font-medium">1st Slab</td>
                      <td className="p-3 font-mono">Up to Threshold (350k/400k/475k/500k)</td>
                      <td className="p-3 font-bold text-emerald-700">0% (Nil)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">2nd Slab</td>
                      <td className="p-3 font-mono">Next BDT 100,000</td>
                      <td className="p-3 font-bold text-blue-700">5%</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">3rd Slab</td>
                      <td className="p-3 font-mono">Next BDT 400,000</td>
                      <td className="p-3 font-bold text-indigo-700">10%</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">4th Slab</td>
                      <td className="p-3 font-mono">Next BDT 500,000</td>
                      <td className="p-3 font-bold text-amber-700">15%</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">5th Slab</td>
                      <td className="p-3 font-mono">Next BDT 500,000</td>
                      <td className="p-3 font-bold text-orange-700">20%</td>
                    </tr>
                    <tr className="bg-rose-50/50">
                      <td className="p-3 font-medium">Remaining</td>
                      <td className="p-3 font-mono">Balance Total Income</td>
                      <td className="p-3 font-bold text-rose-700">25%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Minimum Tax & Thresholds */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span>{lang === 'en' ? 'Minimum Tax & Threshold Categories' : 'ন্যূনতম কর ও করমুক্ত সীমার শ্রেণি'}</span>
              </h3>

              <div className="space-y-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs sm:text-sm">
                  <span className="font-bold text-slate-900 block mb-1">
                    {lang === 'en' ? 'Tax-Free Thresholds by Group:' : 'শ্রেণিভিত্তিক করমুক্ত আয়ের সীমা:'}
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-700">
                    <li><strong>General Male:</strong> BDT 350,000</li>
                    <li><strong>Female & Senior Citizens (65+ yrs):</strong> BDT 400,000</li>
                    <li><strong>Physically Challenged & 3rd Gender:</strong> BDT 475,000</li>
                    <li><strong>Gazetted Freedom Fighters:</strong> BDT 500,000</li>
                    <li><strong>Parents of Disabled Dependents:</strong> +BDT 50,000 per dependent</li>
                  </ul>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs sm:text-sm">
                  <span className="font-bold text-slate-900 block mb-1">
                    {lang === 'en' ? 'Statutory Minimum Tax by Area:' : 'এলাকাভিত্তিক ন্যূনতম করের হার:'}
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-700">
                    <li><strong>Dhaka & Chattogram City Corporation:</strong> BDT 5,000</li>
                    <li><strong>Other City Corporation Areas:</strong> BDT 4,000</li>
                    <li><strong>Other (Non-City / Rural Areas):</strong> BDT 3,000</li>
                  </ul>
                  <p className="text-[11px] text-slate-500 mt-2">
                    {lang === 'en'
                      ? 'If computed tax after rebate is less than minimum tax, the taxpayer must pay the minimum tax according to their residential/operating area.'
                      : 'রেয়াত সমন্বয়ের পর প্রদেয় কর এলাকাভিত্তিক ন্যূনতম করের চেয়ে কম হলে ন্যূনতম কর প্রদান বাধ্যতামূলক।'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer CTA */}
      <div className="bg-slate-50 border-t border-slate-200/80 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            {lang === 'en' 
              ? 'Compliant with Income Tax Act, 2023 and amendments introduced by Finance Act, 2026.' 
              : 'আয়কর আইন ২০২৩ এবং ফাইন্যান্স অ্যাক্ট ২০২৬-এর নির্দেশাবলির সাথে সঙ্গতিপূর্ণ।'}
          </span>
        </div>
        <a 
          href="#total-income-calculator-tool" 
          className="font-bold text-indigo-700 hover:text-indigo-900 inline-flex items-center gap-1 shrink-0"
        >
          <span>{lang === 'en' ? 'Use Full 10-Head Interactive Calculator' : 'পূর্ণাঙ্গ ১০-খাত ক্যালকুলেটর ব্যবহার করুন'}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
