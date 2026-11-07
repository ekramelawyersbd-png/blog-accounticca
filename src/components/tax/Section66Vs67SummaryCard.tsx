import React, { useState } from 'react';
import { 
  Scale, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Check, 
  Layers, 
  ShieldCheck, 
  ArrowRight, 
  Coins, 
  Calculator,
  Building,
  Info
} from 'lucide-react';

interface Section66Vs67SummaryCardProps {
  className?: string;
  showBengaliDefault?: boolean;
}

export function Section66Vs67SummaryCard({ 
  className = '', 
  showBengaliDefault = false 
}: Section66Vs67SummaryCardProps) {
  const [bengaliMode, setBengaliMode] = useState<boolean>(showBengaliDefault);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'comparison' | 'sec66' | 'sec67'>('comparison');

  const copySummaryText = () => {
    const text = `
QUICK REFERENCE: SECTION 66 VS. SECTION 67 (INCOME TAX ACT, 2023)
===================================================================
1. SECTION 66: GENERAL INCOME FROM OTHER SOURCES
- Nature: Actual, unclassified receipts outside the other 6 statutory heads.
- Scope: Royalties, license fees, technical service fees, government cash subsidies, qualifying asset transfers, donations/grants/gifts, and residual income.
- Statutory Basis: Real transactions and monetary/in-kind inflows.
- Deduction of Expenses: Permitted under Section 68 (revenue expenses incurred wholly and exclusively for earning such income).
- Assessment Basis: Documented actual receipt values via banking channels.

2. SECTION 67: SPECIAL CASES (DEEMED INCOME & ANTI-AVOIDANCE)
- Nature: Legal fictions deeming unverified wealth or non-arm's length benefits as taxable income.
- Scope: Unexplained bank credits (67(2)), asset-expenditure shortfall formula [(A+B+C) - (D+E+F)] (67(3)), purchase below Fair Market Value (67(4)), forfeited contract advances (67(5)), lease salami (67(6)), loan waivers (67(7)), winnings (67(8)), private company advances (67(9)-(10)), and cash threshold breaches (67(11)).
- Statutory Basis: Statutory formulas, auditor discrepancy findings, or lack of satisfactory explanation.
- Deduction of Expenses: STRICTLY NO deductions allowed against deemed income additions.
- Assessment Basis: Discrepancies, FMV differences, or unexplained balances added directly to total income.

Published by E-Lawyers | Bangladesh Tax, Accounting & Compliance
`.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const comparisonData = [
    {
      feature: bengaliMode ? 'আইনগত প্রকৃতি ও উদ্দেশ্য' : 'Legal Nature & Purpose',
      sec66: bengaliMode 
        ? 'প্রকৃত রাজস্ব প্রাপ্তি যা ধারা ৩০ এর অন্য ৬টি উৎসের আওতাভুক্ত নয় (সাধারণ করযোগ্য আয়)।'
        : 'Actual revenue inflows not covered by the other 6 statutory heads of Section 30 (Ordinary taxable receipts).',
      sec67: bengaliMode 
        ? 'আইনগত অনুমান (Legal Fiction) বা অনুমিত আয় (Deemed Income) যা কর ফাঁকি রোধে প্রণীত।'
        : 'Statutory legal fiction / deemed income created to curb tax avoidance and capture unexplained wealth.',
      badge66: 'Ordinary Receipt',
      badge67: 'Deemed Income'
    },
    {
      feature: bengaliMode ? 'আয়ের উৎস ও উদাহরণ' : 'Scope & Inflow Triggers',
      sec66: bengaliMode 
        ? 'রয়্যালটি, লাইসেন্স ফি, কারিগরি পরামর্শ ফি, সরকারি নগদ প্রণোদনা, উপহার, অনুদান ও অবশিষ্ট আয়।'
        : 'Royalties, software licenses, technical fees, cash export subsidies, documented gifts, grants, and residual income.',
      sec67: bengaliMode 
        ? 'ব্যাংক বইয়ে অপ্রদর্শিত জমা, সম্পদ-ব্যয় ঘাটতি, ন্যায্যমূল্যের চেয়ে কম মূল্যে ক্রয়, ঋণ মওকুফ, বাজি ও নগদ লেনদেনের লঙ্ঘন।'
        : 'Unexplained credits, asset growth shortfalls, purchases below FMV, loan waivers, cancelled contract forfeits, winnings, cash breaches.',
      badge66: 'Direct Transaction',
      badge67: 'Scrutiny / Friction'
    },
    {
      feature: bengaliMode ? 'সংবিধিবদ্ধ গাণিতিক সূত্র' : 'Statutory Formula',
      sec66: bengaliMode 
        ? 'কোনো নির্দিষ্ট সূত্র নেই; প্রকৃত ব্যাংক প্রাপ্তি ও চুক্তির ভিত্তিতে নিরূপিত হয়।'
        : 'No statutory mathematical formula; computed on actual receipt basis.',
      sec67: bengaliMode 
        ? 'ধারা ৬৭(৩) এ স্পষ্ট সূত্র প্রযোজ্য: (A + B + C) − (D + E + F) = সম্ভাব্য অপ্রদর্শিত আয়।'
        : 'Strict statutory formula under Sec 67(3): Potential Unexplained Income = (A + B + C) − (D + E + F).',
      badge66: 'None',
      badge67: 'Sec 67(3) Formula'
    },
    {
      feature: bengaliMode ? 'খরচ কর্তন সুবিধা (ধারা ৬৮)' : 'Allowable Deductions (Sec 68)',
      sec66: bengaliMode 
        ? 'হ্যাঁ, ধারা ৬৮ অনুযায়ী এই আয় অর্জনের উদ্দেশ্যে সম্পূর্ণ ও একচেটিয়াভাবে ব্যয়কৃত রাজস্ব খরচ কর্তনযোগ্য।'
        : 'YES, allowable under Section 68(1) for revenue expenses incurred wholly and exclusively for earning the income.',
      sec67: bengaliMode 
        ? 'সম্পূর্ণ নিষিদ্ধ। অনুমিত আয় (Deemed Income) হতে কোনো প্রকার ব্যয় বা ছাড় কর্তন করা যায় না।'
        : 'STRICTLY NO deductions. Deemed income additions are gross additions with zero expense offset allowed.',
      badge66: 'Deductions Allowed',
      badge67: 'Zero Deductions'
    },
    {
      feature: bengaliMode ? 'প্রমাণের দায়ভার (Burden of Proof)' : 'Burden of Proof & Audit',
      sec66: bengaliMode 
        ? 'স্বাভাবিক বাণিজ্যিক নথিপত্র (চুক্তিপত্র, চালান, ব্যাংক বিবরণী ও উপহার দলিল)।'
        : 'Standard documentary proof (agreements, invoices, bank statements, gift deed, tax receipts).',
      sec67: bengaliMode 
        ? 'করদাতার ওপর বিপরীত প্রমাণের দায়ভার; তহবিলের প্রকৃত উৎস ও ঋণদাতার সামর্থ্য প্রমাণে ব্যর্থ হলে আয় গণ্য হবে।'
        : 'Reverse burden of proof on taxpayer to prove genuine source, lender solvency, or fair market price to DCT satisfaction.',
      badge66: 'Standard Records',
      badge67: 'Reverse Burden'
    },
    {
      feature: bengaliMode ? 'মূল্যায়ন মানদণ্ড' : 'Valuation Benchmark',
      sec66: bengaliMode 
        ? 'প্রকৃত চুক্তি বা চালানে উল্লিখিত গ্রহণযোগ্য বিনিময় মূল্য।'
        : 'Actual agreed contractual consideration or banking invoice amount.',
      sec67: bengaliMode 
        ? 'ন্যায্য বাজার মূল্য (Fair Market Value)। ধারা ৬৭(৪) অনুযায়ী কম মূল্যে ক্রয় করলে পার্থক্যের উপর কর ধার্য।'
        : 'Fair Market Value (FMV) under Sec 67(4); difference between FMV and purchase price is taxed as deemed income.',
      badge66: 'Contract Value',
      badge67: 'FMV Comparison'
    },
    {
      feature: bengaliMode ? 'ব্যাংকিং চ্যানেল বাধ্যবাধকতা' : 'Banking Channel Rules',
      sec66: bengaliMode 
        ? 'স্বাভাবিক প্রাতিষ্ঠানিক ব্যাংকিং চ্যানেলে অর্থ গ্রহণ বাঞ্ছনীয়।'
        : 'Recommended formal banking receipts for smooth compliance.',
      sec67: bengaliMode 
        ? 'বাধ্যতামূলক। ধারা ৬৭(১১) অনুযায়ী ৫ লক্ষ টাকার বেশি ঋণ বা উপহার নগদে গ্রহণ করলে সরাসরি আয় গণ্য।'
        : 'Mandatory under Sec 67(11). Loans or gifts >= BDT 500,000 received in cash risk full addition to taxable income.',
      badge66: 'Formal Receipt',
      badge67: 'Mandatory Banking'
    }
  ];

  return (
    <div className={`bg-white rounded-3xl border border-indigo-200/90 shadow-xl overflow-hidden transition-all duration-300 ${className}`}>
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-400/30 backdrop-blur-xs text-indigo-300 shrink-0">
              <Scale className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase bg-indigo-400/20 text-indigo-200 rounded-full border border-indigo-400/30">
                  {bengaliMode ? 'দ্রুত রেফারেন্স সারসংক্ষেপ' : 'Quick Reference Summary'}
                </span>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-400/20 text-emerald-200 rounded-md border border-emerald-400/30">
                  Income Tax Act, 2023
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {bengaliMode 
                  ? 'ধারা ৬৬ (সাধারণ আয়) বনাম ধারা ৬৭ (বিশেষ ক্ষেত্র / অনুমিত আয়)' 
                  : 'Section 66 (General Income) vs. Section 67 (Special Cases / Deemed Income)'}
              </h2>
              <p className="text-xs sm:text-sm text-indigo-200/90 mt-0.5">
                {bengaliMode 
                  ? 'অন্যান্য উৎস হতে আয় (Head 7): মূল পার্থক্য ও কর নির্ধারণের তুলনামূলক চিত্র' 
                  : 'Key distinctions, statutory triggers, deductions, and audit risks for Head 7 tax compliance'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            <button
              type="button"
              onClick={() => setBengaliMode(!bengaliMode)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-colors"
            >
              {bengaliMode ? 'English View' : 'বাংলা সংস্করণ'}
            </button>
            <button
              type="button"
              onClick={copySummaryText}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm"
              title="Copy Summary"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (bengaliMode ? 'কপি হয়েছে!' : 'Copied!') : (bengaliMode ? 'কপি করুন' : 'Copy')}</span>
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 mt-5 border-t border-indigo-900/60 pt-4 overflow-x-auto text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('comparison')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'comparison'
                ? 'bg-indigo-500/30 text-white font-bold border border-indigo-400/40 shadow-xs'
                : 'text-indigo-200 hover:text-white hover:bg-white/5'
            }`}
          >
            {bengaliMode ? 'পাশাপাশি তুলনামূলক ছক' : 'Comparison Matrix'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sec66')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'sec66'
                ? 'bg-emerald-500/30 text-white font-bold border border-emerald-400/40 shadow-xs'
                : 'text-indigo-200 hover:text-white hover:bg-white/5'
            }`}
          >
            {bengaliMode ? 'ধারা ৬৬: সাধারণ আয়' : 'Section 66 (General Receipts)'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sec67')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'sec67'
                ? 'bg-amber-500/30 text-white font-bold border border-amber-400/40 shadow-xs'
                : 'text-indigo-200 hover:text-white hover:bg-white/5'
            }`}
          >
            {bengaliMode ? 'ধারা ৬৭: বিশেষ অনুমিত আয়' : 'Section 67 (Deemed Income)'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 sm:p-7">
        {/* Quick Executive Snapshot Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Card for Section 66 */}
          <div className="rounded-2xl p-4.5 bg-gradient-to-br from-emerald-50/80 to-teal-50/40 border border-emerald-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                Section 66
              </span>
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {bengaliMode ? 'খরচ কর্তন প্রযোজ্য' : 'Deductions Permitted'}
              </span>
            </div>
            <h4 className="font-bold text-slate-900 text-base mb-1.5">
              {bengaliMode ? 'ধারা ৬৬: সাধারণ অন্যান্য আয়' : 'General Income from Other Sources'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              {bengaliMode
                ? 'চুক্তিবদ্ধ রয়্যালটি, সফটওয়্যার লাইসেন্স ফি, কারিগরি পরামর্শ, সরকারি রপ্তানি নগদ সহায়তা এবং আইনানুগ উপহার। যা ধারা ৬৮ অনুযায়ী অনুমোদিত রাজস্ব ব্যয় বাদ দিয়ে নিট আকারে করযোগ্য।'
                : 'Actual non-routine receipts including royalties, technical service fees, government cash subsidies, qualifying asset transfers, and legitimate gifts. Expenses incurred solely to earn income are deductible under Section 68.'}
            </p>
            <div className="text-[11px] text-emerald-900 bg-white/80 rounded-xl p-2.5 border border-emerald-200/60 font-medium space-y-1">
              <div><strong>{bengaliMode ? 'কর ভিত্তি:' : 'Tax Basis:'}</strong> {bengaliMode ? 'প্রকৃত প্রাপ্তি (Actual Gross Inflow) − অনুমোদিত খরচ' : 'Actual Gross Receipts − Section 68 Allowable Expenses'}</div>
              <div><strong>{bengaliMode ? 'কর হার:' : 'Tax Rate:'}</strong> {bengaliMode ? 'স্বাভাবিক ব্যক্তিক/কোম্পানি স্ল্যাব হার ও প্রযোজ্য উৎসে কর' : 'Normal applicable individual/corporate slab rates + statutory TDS'}</div>
            </div>
          </div>

          {/* Card for Section 67 */}
          <div className="rounded-2xl p-4.5 bg-gradient-to-br from-amber-50/80 to-rose-50/40 border border-amber-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wide">
                Section 67
              </span>
              <span className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {bengaliMode ? 'কোনো খরচ কর্তন নেই' : 'No Expense Deductions'}
              </span>
            </div>
            <h4 className="font-bold text-slate-900 text-base mb-1.5">
              {bengaliMode ? 'ধারা ৬৭: বিশেষ অনুমিত আয় (আইনগত অনুমান)' : 'Special Cases & Deemed Taxable Income'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              {bengaliMode
                ? 'অপ্রদর্শিত জমা, সম্পদ বৃদ্ধির ঘাটতি সূত্র [(A+B+C) - (D+E+F)], বাজারমূল্যের চেয়ে কমে সম্পদ ক্রয়, ঋণ মওকুফ, বাতিল চুক্তির অগ্রিম ও নগদ লেনদেন লঙ্ঘন। সম্পূর্ণ অর্থ সরাসরি করযোগ্য আয়ে যোগ হয়।'
                : 'Statutory legal fictions capturing unexplained book credits, formula asset shortfalls [(A+B+C) - (D+E+F)], below-FMV purchases, loan remissions, salami, and cash limit breaches. 100% added directly with zero deductions.'}
            </p>
            <div className="text-[11px] text-amber-900 bg-white/80 rounded-xl p-2.5 border border-amber-200/60 font-medium space-y-1">
              <div><strong>{bengaliMode ? 'কর ভিত্তি:' : 'Tax Basis:'}</strong> {bengaliMode ? 'অপ্রদর্শিত/ঘাটতি সম্পূর্ণ অর্থ (Gross Deemed Addition) − ০ খরচ' : 'Entire Unexplained / Discrepancy Amount − Zero Deductions'}</div>
              <div><strong>{bengaliMode ? 'ঝুঁকি:' : 'Audit Risk:'}</strong> {bengaliMode ? 'ক্ষতি সমন্বয় বন্ধ, নিয়মিত অডিট ও জরিমানা (ধারা ২৭২)' : 'No business loss set-off, mandatory scrutiny audit, & Section 272 penalty'}</div>
            </div>
          </div>
        </div>

        {/* Tab 1: Detailed Comparison Matrix */}
        {activeTab === 'comparison' && (
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                {bengaliMode ? 'তুলনামূলক বৈশিষ্ট্য তালিকা' : 'Side-by-Side Comparison Matrix'}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {bengaliMode ? 'আয়কর আইন, ২০২৩ এর অধীনে' : 'Under Bangladesh Income Tax Act, 2023'}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700">
                    <th className="p-3 font-bold w-1/4">{bengaliMode ? 'বৈশিষ্ট্য / মানদণ্ড' : 'Feature / Dimension'}</th>
                    <th className="p-3 font-bold w-3/8 text-emerald-800 bg-emerald-50/50">
                      {bengaliMode ? 'ধারা ৬৬: সাধারণ অন্যান্য আয়' : 'Section 66 (General Income)'}
                    </th>
                    <th className="p-3 font-bold w-3/8 text-amber-800 bg-amber-50/50">
                      {bengaliMode ? 'ধারা ৬৭: বিশেষ ক্ষেত্র (অনুমিত আয়)' : 'Section 67 (Special Cases / Deemed Income)'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comparisonData.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                      <td className="p-3 font-semibold text-slate-800 align-top">
                        {row.feature}
                      </td>
                      <td className="p-3 text-slate-600 bg-emerald-50/15 align-top">
                        <div className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{row.sec66}</span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-600 bg-amber-50/15 align-top">
                        <div className="flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span>{row.sec67}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Section 66 Focus */}
        {activeTab === 'sec66' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
              <h4 className="text-sm font-bold text-emerald-950 mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {bengaliMode ? 'ধারা ৬৬ এর প্রধান আওতাভুক্ত আয়সমূহ:' : 'Key Incomes Taxable under Section 66:'}
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700">
                <li className="p-2.5 bg-white rounded-xl border border-emerald-100 flex items-start gap-2">
                  <span className="font-bold text-emerald-700">66(1):</span>
                  <span>{bengaliMode ? 'রয়্যালটি, লাইসেন্স ফি ও পেটেন্ট বা কারিগরি পরিষেবা ফি' : 'Royalties, software/patent licensing fees, and technical service fees'}</span>
                </li>
                <li className="p-2.5 bg-white rounded-xl border border-emerald-100 flex items-start gap-2">
                  <span className="font-bold text-emerald-700">66(2):</span>
                  <span>{bengaliMode ? 'সরকার কর্তৃক প্রদত্ত রপ্তানি বা নগদ ভর্তুকি (Cash Subsidy)' : 'Government cash subsidies, export cash assistance, and incentives'}</span>
                </li>
                <li className="p-2.5 bg-white rounded-xl border border-emerald-100 flex items-start gap-2">
                  <span className="font-bold text-emerald-700">66(3):</span>
                  <span>{bengaliMode ? 'নির্দিষ্ট স্ব-নির্মিত ও অস্পষ্ট সম্পদের হস্তান্তর হতে আয়' : 'Transfers of qualifying self-created intangible assets (excluding goodwill/minerals)'}</span>
                </li>
                <li className="p-2.5 bg-white rounded-xl border border-emerald-100 flex items-start gap-2">
                  <span className="font-bold text-emerald-700">66(4):</span>
                  <span>{bengaliMode ? 'দান, অনুদান ও সাধারণ উপহার (Donations, Grants & Gifts)' : 'Donations, statutory grants, and non-exempt gifts from third parties'}</span>
                </li>
                <li className="p-2.5 bg-white rounded-xl border border-emerald-100 sm:col-span-2 flex items-start gap-2">
                  <span className="font-bold text-emerald-700">66(5):</span>
                  <span>{bengaliMode ? 'অবশিষ্ট করযোগ্য আয় যা ধারা ৩০ এর অপর ৬টি উৎসে অন্তর্ভুক্ত হয়নি' : 'Residual taxable receipts not fitting within Heads 1 through 6 of Section 30'}</span>
                </li>
              </ul>
            </div>
            
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <span><strong>{bengaliMode ? 'খরচ কর্তন ধারা:' : 'Deductions Section:'}</strong> Section 68 allows revenue expenses wholly incurred for earning Section 66 income.</span>
              <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-md">Deductible</span>
            </div>
          </div>
        )}

        {/* Tab 3: Section 67 Focus */}
        {activeTab === 'sec67' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
              <h4 className="text-sm font-bold text-amber-950 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                {bengaliMode ? 'ধারা ৬৭ এর ১০টি বিশেষ অনুমিত আয়ের ক্ষেত্র:' : '10 Statutory Deemed Income Cases under Section 67:'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                <div className="p-2 bg-white rounded-xl border border-amber-100">
                  <strong className="text-amber-800">67(2):</strong> {bengaliMode ? 'হিসাব বইয়ে অপ্রদর্শিত জমা (Unexplained Book Credits)' : 'Unexplained sum credited in books of account'}
                </div>
                <div className="p-2 bg-white rounded-xl border border-amber-100">
                  <strong className="text-amber-800">67(3):</strong> {bengaliMode ? 'সম্পদ বৃদ্ধি ও ব্যয় ঘাটতি সূত্র: (A+B+C) − (D+E+F)' : 'Asset growth deficit: (A+B+C) − (D+E+F) formula'}
                </div>
                <div className="p-2 bg-white rounded-xl border border-amber-100">
                  <strong className="text-amber-800">67(4):</strong> {bengaliMode ? 'বাজারমূল্যের চেয়ে কমে সম্পদ ক্রয় (FMV shortfall)' : 'Purchasing capital asset below Fair Market Value'}
                </div>
                <div className="p-2 bg-white rounded-xl border border-amber-100">
                  <strong className="text-amber-800">67(5):</strong> {bengaliMode ? 'চুক্তি বাতিলের ক্ষতিপূরণ / বাজেয়াপ্ত অগ্রিম' : 'Contract cancellation compensation or forfeited advance'}
                </div>
                <div className="p-2 bg-white rounded-xl border border-amber-100">
                  <strong className="text-amber-800">67(6):</strong> {bengaliMode ? 'ইজারা সেলামি বা অগ্রিম প্রিমিয়াম (Lease Salami)' : 'Lease premium, salami, or non-refundable lump sum'}
                </div>
                <div className="p-2 bg-white rounded-xl border border-amber-100">
                  <strong className="text-amber-800">67(7):</strong> {bengaliMode ? 'মওকুফকৃত ঋণ ও দায় (Loan waiver & remission)' : 'Waived loans, forgiven debts, or remitted trade liabilities'}
                </div>
                <div className="p-2 bg-white rounded-xl border border-amber-100">
                  <strong className="text-amber-800">67(8):</strong> {bengaliMode ? 'লটারি, প্রাইজবন্ড ও প্রতিযোগিতায় জয়ী অর্থ' : 'Lottery, raffle, prize bond, and game contest winnings'}
                </div>
                <div className="p-2 bg-white rounded-xl border border-amber-100">
                  <strong className="text-amber-800">67(9)-(10):</strong> {bengaliMode ? 'প্রাইভেট কোম্পানি হতে শেয়ারহোল্ডারকে প্রদত্ত ঋণ' : 'Private company loans/advances to substantial shareholders'}
                </div>
                <div className="p-2 bg-white rounded-xl border border-amber-100 sm:col-span-2">
                  <strong className="text-amber-800">67(11):</strong> {bengaliMode ? 'ব্যাংকিং চ্যানেল লঙ্ঘন করে নগদ ঋণ বা উপহার গ্রহণ (≥ ৫ লক্ষ টাকা)' : 'Cash loans, gifts, or considerations >= BDT 500,000 bypassing banking channels'}
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 flex items-center justify-between">
              <span><strong>{bengaliMode ? 'সতর্কবার্তা:' : 'Critical Rule:'}</strong> {bengaliMode ? 'ধারা ৬৭ এর কোনো অনুমিত আয়ের বিপরীতে কোনো খরচ বাদ দেওয়া যায় না।' : 'Zero deductions permitted against deemed income additions under Section 67.'}</span>
              <span className="text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded-md">No Deductions</span>
            </div>
          </div>
        )}

        {/* Bottom Note & Quick Statutory Advice */}
        <div className="mt-5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-2.5 text-xs text-slate-600">
          <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {bengaliMode ? (
              <>
                <strong>পরামর্শ:</strong> আয়কর রিটার্ন (আইটি-১১গ) দাখিলের পূর্বে অস্বাভাবিক বা এককালীন প্রতিটি লেনদেনের আইনগত উৎস চিহ্নিত করুন। নিয়মিত আয়ের জন্য ধারা ৬৬ এবং ব্যাংক ক্রেডিট ও সম্পদ বৃদ্ধির হিসাব মেলাতে ধারা ৬৭ এর সূত্র আগাম যাচাই করে রিটার্ন দাখিল করলে ডেপুটি কমিশনার অব ট্যাক্সেস (ডিসিটি) এর অপ্রদর্শিত আয় বা অডিট আপত্তি এড়ানো সম্ভব।
              </>
            ) : (
              <>
                <strong>Practitioner Note:</strong> Before filing tax return Form <strong>IT-11GA</strong>, classify every non-routine transaction precisely. Use Section 66 for genuine contractual inflows (claiming Section 68 expenses), and reconcile wealth statement <strong>IT-10B</strong> against the Section 67(3) formula to preemptively identify and resolve potential unexplained asset discrepancies.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
