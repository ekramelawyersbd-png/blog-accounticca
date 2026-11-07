import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Gift,
  Coins,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  Info,
  Copy,
  Check,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  Sparkles,
  FileText,
  DollarSign
} from 'lucide-react';

interface TdsLotteryGiftsFreelanceCardProps {
  className?: string;
  showBengaliDefault?: boolean;
}

export function TdsLotteryGiftsFreelanceCard({
  className = '',
  showBengaliDefault = false
}: TdsLotteryGiftsFreelanceCardProps) {
  const [bengaliMode, setBengaliMode] = useState<boolean>(showBengaliDefault);
  const [activeTab, setActiveTab] = useState<'lottery' | 'gifts' | 'loans' | 'freelance' | 'checklist'>('lottery');
  const [copied, setCopied] = useState<boolean>(false);

  // 1. Lottery State
  const [lotteryAmount, setLotteryAmount] = useState<number>(500000);
  const tdsLotteryRate = 0.25; // 25% under amended Section 118 Finance Act 2026
  const tdsLotteryWithheld = lotteryAmount * tdsLotteryRate;
  const netLotteryPayout = lotteryAmount - tdsLotteryWithheld;

  // 2. Gifts State
  const [giftAmount, setGiftAmount] = useState<number>(1000000);
  const [donorRelation, setDonorRelation] = useState<'family' | 'other' | 'corporate'>('family');
  const [giftMethod, setGiftMethod] = useState<'bank' | 'foreign_bank' | 'cash'>('bank');

  // 3. Loans State
  const [loanAmount, setLoanAmount] = useState<number>(800000);
  const [loanMethod, setLoanMethod] = useState<'bank' | 'cash'>('bank');
  const [waivedAmount, setWaivedAmount] = useState<number>(0);

  // 4. Freelance State
  const [freelanceAmount, setFreelanceAmount] = useState<number>(600000);
  const [freelanceServiceType, setFreelanceServiceType] = useState<'ites' | 'non_ites'>('ites');
  const [hasPrc, setHasPrc] = useState<boolean>(true);

  // 5. Checklist State with LocalStorage
  const CHECKLIST_STORAGE_KEY = 'elawyers_tds_lottery_gifts_checklist_v1';
  const defaultChecklistItems = [
    { id: 'item-1', label: 'Lottery / Contest Official Prize Certificate', category: 'lottery' },
    { id: 'item-2', label: 'TDS Certificate (A-Challan Treasury Receipt) for Withheld Tax', category: 'lottery' },
    { id: 'item-3', label: 'Bank Statement Showing Disbursed Net Prize Proceeds', category: 'lottery' },
    { id: 'item-4', label: 'Registered Family Gift Deed / Notarized Heba Declaration', category: 'gifts' },
    { id: 'item-5', label: 'Proof of Donor Asset Disclosure in Donor’s Annual Tax Return', category: 'gifts' },
    { id: 'item-6', label: 'Foreign Inward Remittance Credit Advice (if gifted from abroad)', category: 'gifts' },
    { id: 'item-7', label: 'Written Stamped Loan Agreement with Repayment Schedule', category: 'loans' },
    { id: 'item-8', label: 'Account-Payee Cheque or Bank Clearance for Borrowed Capital', category: 'loans' },
    { id: 'item-9', label: 'Lender e-TIN Certificate & Assessed Wealth Credential', category: 'loans' },
    { id: 'item-10', label: 'Written Settlement / Waiver Deed (for Section 67(7) loan relief)', category: 'loans' },
    { id: 'item-11', label: 'Proceeds Realization Certificate (PRC / Form C) from Bank', category: 'freelance' },
    { id: 'item-12', label: 'Export Service Contract / Platform Earning Record (Upwork/Fiverr/Direct)', category: 'freelance' },
    { id: 'item-13', label: 'Annual Income Tax Return (IT-11GA) Sixth Schedule Disclosure', category: 'freelance' }
  ];

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(CHECKLIST_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed reading checklist from localStorage', e);
    }
    return {
      'item-1': true,
      'item-4': true,
      'item-11': true
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(checkedItems));
    } catch (e) {
      console.warn('Failed saving checklist to localStorage', e);
    }
  }, [checkedItems]);

  const toggleChecklistItem = (id: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const resetChecklist = () => {
    setCheckedItems({
      'item-1': true,
      'item-4': true,
      'item-11': true
    });
  };

  // Calculations for Gifts
  const isFamilyExempt = donorRelation === 'family' && (giftMethod === 'bank' || giftMethod === 'foreign_bank');
  const isCashThresholdBreached = giftMethod === 'cash' && giftAmount >= 500000;

  // Calculations for Loans
  const isLoanCashBreach = loanMethod === 'cash' && loanAmount >= 500000;
  const deemedLoanIncome = isLoanCashBreach ? loanAmount : 0;
  const deemedWaiverIncome = waivedAmount > 0 ? waivedAmount : 0;

  // Calculations for Freelance
  const isItesExempt = freelanceServiceType === 'ites' && hasPrc;
  const freelanceTdsRate = isItesExempt ? 0 : 0.10;
  const freelanceWithholding = freelanceAmount * freelanceTdsRate;
  const freelanceNetReceipt = freelanceAmount - freelanceWithholding;

  const copySummary = () => {
    const text = `
E-LAWYERS BANGLADESH TAX COMPLIANCE SUMMARY: FY 2026–27
======================================================
1. LOTTERY & GAMING WINNINGS (SECTION 118)
- Gross Winnings: BDT ${lotteryAmount.toLocaleString()}
- TDS Rate: 25% (Amended Finance Act 2026)
- Tax Withheld at Source: BDT ${tdsLotteryWithheld.toLocaleString()}
- Net Disbursed Payout: BDT ${netLotteryPayout.toLocaleString()}

2. GIFTS & DONATIONS (SECTION 66 & SIXTH SCHEDULE)
- Amount: BDT ${giftAmount.toLocaleString()}
- Donor: ${donorRelation.toUpperCase()} | Method: ${giftMethod.toUpperCase()}
- Tax Status: ${isFamilyExempt ? '100% TAX EXEMPT (Sixth Schedule Part 1 Para 35)' : isCashThresholdBreached ? 'DEEMED INCOME RISK (Section 67(11) Cash Breach)' : 'TAXABLE UNDER SECTION 66(d)'}

3. LOANS & LOAN WAIVER (SECTION 67)
- Principal: BDT ${loanAmount.toLocaleString()} (${loanMethod.toUpperCase()})
- Cash Loan Deemed Income (Sec 67(11)): BDT ${deemedLoanIncome.toLocaleString()}
- Loan Waiver Deemed Income (Sec 67(7)): BDT ${deemedWaiverIncome.toLocaleString()}

4. FREELANCE / ITES SERVICE REMITTANCES (SECTION 124)
- Foreign Inward Remittance: BDT ${freelanceAmount.toLocaleString()}
- Service Category: ${freelanceServiceType === 'ites' ? 'Qualifying IT/ITES' : 'General Consulting / Non-ITES'}
- PRC Certificate: ${hasPrc ? 'Verified' : 'Missing'}
- Withholding TDS: BDT ${freelanceWithholding.toLocaleString()} (${(freelanceTdsRate * 100).toFixed(0)}%)
- Final Net Credit: BDT ${freelanceNetReceipt.toLocaleString()}

Published by E-Lawyers | Bangladesh Tax, Accounting & Compliance
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const progressPercent = Math.round((checkedCount / defaultChecklistItems.length) * 100);

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden transition-all duration-300 ${className}`}>
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 px-6 py-6 text-white border-b border-emerald-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{bengaliMode ? 'অর্থ আইন ২০২৬ সংশোধিত নির্দেশিকা' : 'Finance Act 2026 Amended Guidelines'}</span>
            </div>
            <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Coins className="w-6 h-6 text-emerald-400" />
              {bengaliMode 
                ? 'লটারি, উপহার, ঋণ ও ফ্রিল্যান্স আয় কর হিসাব ও যাচাইকরণ' 
                : 'TDS, Gifts, Loans & Freelance Tax Screener (FY 2026–27)'}
            </h3>
            <p className="text-sm text-slate-300 mt-1">
              {bengaliMode
                ? 'ধারা ৬৬, ৬৭, ১১৮, ১২৪ ও ষষ্ঠ তফসিল অনুযায়ী ট্যাক্স উইথহোল্ডিং ও ছাড়ের সরাসরি মূল্যায়ন'
                : 'Instant statutory assessment under Sections 66, 67, 118, 124 & Sixth Schedule Part 1'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={() => setBengaliMode(!bengaliMode)}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-emerald-400/30 hover:bg-emerald-500/20 text-emerald-200 transition-colors"
            >
              {bengaliMode ? 'Switch to English' : 'বাংলা সংস্করণ'}
            </button>
            <button
              onClick={copySummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
              title="Copy Summary"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (bengaliMode ? 'কপি হয়েছে' : 'Copied') : (bengaliMode ? 'সারাংশ কপি' : 'Copy Report')}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('lottery')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-semibold rounded-xl transition-all ${
              activeTab === 'lottery'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>{bengaliMode ? '১. লটারি ও গেইমিং (Sec 118)' : '1. Lottery & Gaming (Sec 118)'}</span>
          </button>
          <button
            onClick={() => setActiveTab('gifts')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-semibold rounded-xl transition-all ${
              activeTab === 'gifts'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>{bengaliMode ? '২. উপহার ও হেবা (Sec 66/ষষ্ঠ তফসিল)' : '2. Family & Other Gifts'}</span>
          </button>
          <button
            onClick={() => setActiveTab('loans')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-semibold rounded-xl transition-all ${
              activeTab === 'loans'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>{bengaliMode ? '৩. ঋণ ও ঋণ মওকুফ (Sec 67)' : '3. Loans & Waivers (Sec 67)'}</span>
          </button>
          <button
            onClick={() => setActiveTab('freelance')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-semibold rounded-xl transition-all ${
              activeTab === 'freelance'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>{bengaliMode ? '৪. ফ্রিল্যান্সিং ও রেমিট্যান্স (Sec 124)' : '4. Freelance / ITES (Sec 124)'}</span>
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-semibold rounded-xl transition-all ${
              activeTab === 'checklist'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{bengaliMode ? '৫. ডকুমেন্টস চেকলিস্ট' : '5. Audit Checklist'}</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-950/40 text-emerald-300">
              {checkedCount}/{defaultChecklistItems.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Card Content */}
      <div className="p-6 md:p-8 bg-slate-50/50">
        {/* TAB 1: LOTTERY & GAMING */}
        {activeTab === 'lottery' && (
          <div className="space-y-6">
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900">
                    {bengaliMode ? 'ধারা ১১৮: ২৫% উৎসে কর কর্তন (১ জুলাই ২০২৬ থেকে প্রযোজ্য)' : 'Section 118: 25% Mandatory TDS Rate (Effective 1 July 2026)'}
                  </h4>
                  <p className="text-xs text-amber-800 mt-1">
                    {bengaliMode
                      ? 'অর্থ আইন ২০২৬ অনুযায়ী লটারি, ক্রসওয়ার্ড, কার্ড গেম, বা অনলাইন গেমের পুরস্কার প্রদানের সময় পূর্বের ২০%-এর পরিবর্তে বাধ্যতামূলক ২৫% হারে কর কর্তন করতে হবে।'
                      : 'The Finance Act 2026 increased the withholding rate on lottery, puzzle, and contest winnings from 20% to 25%. Payer must remit via A-Challan.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Input Area */}
              <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
                <label className="block">
                  <span className="text-sm font-bold text-slate-800">
                    {bengaliMode ? 'মোট লটারি বা পুরস্কারের পরিমাণ (টাকা):' : 'Gross Prize / Lottery Winnings Amount (BDT):'}
                  </span>
                  <div className="mt-2 relative rounded-lg shadow-sm">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-semibold text-sm">৳</span>
                    <input
                      type="number"
                      step="10000"
                      min="0"
                      value={lotteryAmount}
                      onChange={e => setLotteryAmount(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full pl-9 pr-4 py-2.5 text-lg font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </label>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {[100000, 300000, 500000, 1000000, 2500000].map(val => (
                    <button
                      key={val}
                      onClick={() => setLotteryAmount(val)}
                      className={`px-3 py-1 text-xs rounded-lg font-semibold border transition-all ${
                        lotteryAmount === val
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                    >
                      ৳ {(val / 100000).toFixed(val % 100000 === 0 ? 0 : 1)} Lac
                    </button>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>{bengaliMode ? 'আইনগত ধারা:' : 'Statutory Provision:'}</span>
                    <span className="font-bold text-slate-900">Section 118, Income Tax Act 2023</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{bengaliMode ? 'উইথহোল্ডিং ট্যাক্স রেট:' : 'Withholding TDS Rate:'}</span>
                    <span className="font-bold text-emerald-700">25.0%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{bengaliMode ? 'চূড়ান্ত নিষ্পত্তি (Final Tax?):' : 'Final Settlement Status:'}</span>
                    <span className="font-bold text-amber-700">{bengaliMode ? 'না (ধারা ১৬৩ পর্যালোচনা সাপেক্ষ)' : 'No (Subject to Sec 163 rules)'}</span>
                  </div>
                </div>
              </div>

              {/* Output Breakdown */}
              <div className="lg:col-span-6 bg-gradient-to-br from-slate-900 to-emerald-950 p-6 rounded-xl text-white shadow-md space-y-5">
                <h4 className="text-xs uppercase font-extrabold tracking-wider text-emerald-400">
                  {bengaliMode ? 'আর্থিক হিসাব ও প্রাপ্তি' : 'Calculation & Net Disbursed Payout'}
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-lg bg-white/10 border border-white/10">
                    <div className="text-xs text-slate-300">{bengaliMode ? 'উৎস কর কর্তন (২৫%)' : 'TDS Withheld (25%)'}</div>
                    <div className="text-xl font-black text-rose-400 mt-1">
                      ৳ {tdsLotteryWithheld.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-emerald-500/20 border border-emerald-400/30">
                    <div className="text-xs text-emerald-200">{bengaliMode ? 'হাতে প্রাপ্ত নগদ টাকা' : 'Net Cash Disbursed'}</div>
                    <div className="text-xl font-black text-emerald-300 mt-1">
                      ৳ {netLotteryPayout.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200 space-y-2">
                  <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                    <Info className="w-4 h-4" />
                    <span>{bengaliMode ? 'রিটার্নে কীভাবে দেখাবেন?' : 'How to Report in NBR e-Return:'}</span>
                  </div>
                  <p>
                    {bengaliMode
                      ? `মোট BDT ${lotteryAmount.toLocaleString()} টাকা "অন্যান্য উৎস হতে আয়" (Head 7) হিসেবে প্রদর্শন করতে হবে। কর্তনকৃত BDT ${tdsLotteryWithheld.toLocaleString()} টাকা অগ্রিম কর/TDS হিসেবে ক্রেডিট দাবি করা যাবে।`
                      : `Report gross BDT ${lotteryAmount.toLocaleString()} under Income from Other Sources. Claim BDT ${tdsLotteryWithheld.toLocaleString()} as advance tax credit in Part 2.`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GIFTS & DONATIONS */}
        {activeTab === 'gifts' && (
          <div className="space-y-6">
            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl">
              <div className="flex items-start gap-3">
                <Gift className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-950">
                    {bengaliMode ? 'ষষ্ঠ তফসিল ১ম খণ্ড অনুচ্ছেদ ৩৫: নিকটাত্মীয়ের উপহারে ১০০% কর অব্যাহতি' : 'Sixth Schedule Part 1, Para 35: 100% Tax Exemption for Immediate Family'}
                  </h4>
                  <p className="text-xs text-emerald-800 mt-1">
                    {bengaliMode
                      ? 'স্বামী, স্ত্রী, পিতা, মাতা বা সন্তানের নিকট হতে প্রাপ্ত উপহার সম্পূর্ণ করমুক্ত। উভয় পক্ষের রিটার্নে এবং পরিসম্পদ বিবরণীতে এই লেনদেন প্রতিফলিত হতে হবে।'
                      : 'Gifts from a spouse, parent, or child are fully exempt when disclosed in both tax returns. Bank remittances from abroad waive donor return requirement.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Controls */}
              <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    {bengaliMode ? 'উপহারদাতার সম্পর্ক নির্বাচন করুন:' : 'Donor Relationship:'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setDonorRelation('family')}
                      className={`p-2.5 rounded-lg text-xs font-bold border text-center transition-all ${
                        donorRelation === 'family'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {bengaliMode ? 'স্বামী/স্ত্রী/মা-বাবা/সন্তান' : 'Spouse / Parent / Child'}
                    </button>
                    <button
                      onClick={() => setDonorRelation('other')}
                      className={`p-2.5 rounded-lg text-xs font-bold border text-center transition-all ${
                        donorRelation === 'other'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {bengaliMode ? 'ভাই/বোন/বন্ধু/আত্মীয়' : 'Sibling / Friend / Relative'}
                    </button>
                    <button
                      onClick={() => setDonorRelation('corporate')}
                      className={`p-2.5 rounded-lg text-xs font-bold border text-center transition-all ${
                        donorRelation === 'corporate'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {bengaliMode ? 'প্রতিষ্ঠান / তৃতীয় পক্ষ' : 'Corporate / Third Party'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    {bengaliMode ? 'অর্থ স্থানান্তরের মাধ্যম:' : 'Payment / Transfer Method:'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setGiftMethod('bank')}
                      className={`p-2.5 rounded-lg text-xs font-bold border text-center transition-all ${
                        giftMethod === 'bank'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {bengaliMode ? 'ব্যাংক ট্রান্সফার / চেক' : 'Local Bank Transfer'}
                    </button>
                    <button
                      onClick={() => setGiftMethod('foreign_bank')}
                      className={`p-2.5 rounded-lg text-xs font-bold border text-center transition-all ${
                        giftMethod === 'foreign_bank'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {bengaliMode ? 'বিদেশ থেকে ব্যাংক রেমিট্যান্স' : 'Foreign Remittance'}
                    </button>
                    <button
                      onClick={() => setGiftMethod('cash')}
                      className={`p-2.5 rounded-lg text-xs font-bold border text-center transition-all ${
                        giftMethod === 'cash'
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {bengaliMode ? 'নগদ টাকা (Cash)' : 'Physical Cash'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {bengaliMode ? 'উপহারের মোট পরিমাণ (টাকা):' : 'Gift Amount (BDT):'}
                  </label>
                  <input
                    type="number"
                    step="50000"
                    min="0"
                    value={giftAmount}
                    onChange={e => setGiftAmount(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-3.5 py-2 text-base font-bold text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Status Screener */}
              <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                  <span className="text-xs uppercase font-extrabold text-slate-500">
                    {bengaliMode ? 'কর মূল্যায়নের ফলাফল' : 'Statutory Assessment Outcome'}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                    isFamilyExempt
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : isCashThresholdBreached
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {isFamilyExempt
                      ? (bengaliMode ? '১০০% করমুক্ত (Tax-Exempt)' : '100% Tax Exempt')
                      : isCashThresholdBreached
                      ? (bengaliMode ? 'ঝুঁকিপূর্ণ: গণ্যমান্য আয় (Deemed Income)' : 'High Risk: Deemed Income')
                      : (bengaliMode ? 'করযোগ্য (Taxable under Sec 66)' : 'Taxable under Section 66')}
                  </span>
                </div>

                <div className="space-y-3 text-xs text-slate-700">
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="font-bold text-slate-900 mb-1">
                      {bengaliMode ? 'আইনগত ভিত্তি ও নিয়মাবলী:' : 'Legal Basis & Rule Application:'}
                    </div>
                    {isFamilyExempt ? (
                      <p className="text-emerald-700 font-medium">
                        {bengaliMode
                          ? 'ষষ্ঠ তফসিলের ১ম খণ্ড, অনুচ্ছেদ ৩৫ অনুযায়ী এটি মোট আয় থেকে বাদ যাবে। কোনো কর প্রদেয় হবে না। তবে দানকারী ও গ্রহণকারী উভয়ের আয়কর রিটার্নে এবং পরিসম্পদ বিবরণীতে (IT-10B) স্পষ্টভাবে উল্লেখ করতে হবে।'
                          : 'Qualifies under Sixth Schedule, Part 1, paragraph 35. 0% tax liability. Both donor and recipient must report in respective IT-10B wealth statements.'}
                      </p>
                    ) : isCashThresholdBreached ? (
                      <p className="text-rose-700 font-semibold">
                        {bengaliMode
                          ? `সতর্কতা! নগদ অর্থ গ্রহণ ধারা ৬৭(১১) লঙ্ঘন করে। ৫ লক্ষ টাকা বা তদূর্ধ্ব পরিমাণ নগদ গ্রহণ করায় সম্পূর্ণ BDT ${giftAmount.toLocaleString()} টাকা unexplained deemed income হিসেবে গণ্য হতে পারে!`
                          : `Alert! Receiving cash of BDT 500,000 or more violates Section 67(11). The entire BDT ${giftAmount.toLocaleString()} risks being added as unexplained deemed income with zero expense offsets.`}
                      </p>
                    ) : (
                      <p className="text-amber-800">
                        {bengaliMode
                          ? 'স্বামী, স্ত্রী, পিতা-মাতা বা সন্তান ব্যতীত অন্যান্য আত্মীয় বা বন্ধুদের কাছ থেকে প্রাপ্ত উপহার ধারা ৬৬(ঘ) অনুযায়ী "অন্যান্য উৎস হতে আয়" হিসেবে সাধারণ স্ল্যাব হারে করযোগ্য।'
                          : 'Gifts from siblings, cousins, friends, or third parties do not qualify for the family exemption and are taxable under Section 66(d) at progressive individual slab rates.'}
                      </p>
                    )}
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 space-y-1">
                    <span className="font-semibold text-slate-800">{bengaliMode ? 'প্রয়োজনীয় প্রমাণপত্র:' : 'Mandatory Defense Documentation:'}</span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600">
                      <li>{bengaliMode ? 'নোটারাইজড হেবা ঘোষণা / দানপত্র দলিল' : 'Notarized Heba / Gift Deed'}</li>
                      <li>{bengaliMode ? 'ব্যাংক হিসাব বিবরণী (টাকা ডেবিট ও ক্রেডিট প্রমাণ)' : 'Bank statements evidencing clean fund transfer'}</li>
                      <li>{bengaliMode ? 'উপহারদাতার আয়কর রিটার্নে সম্পদমূল্যের সমন্বয়' : 'Donor tax return wealth deduction verification'}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LOANS & LOAN WAIVER */}
        {activeTab === 'loans' && (
          <div className="space-y-6">
            <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-rose-950">
                    {bengaliMode ? 'ধারা ৬৭(৭) ও ৬৭(১১): নগদ ঋণ গ্রহণ ও ঋণ মওকুফের গুরুতর কর ঝুঁকি' : 'Section 67(7) & 67(11): Severe Anti-Avoidance Rules on Loans'}
                  </h4>
                  <p className="text-xs text-rose-800 mt-1">
                    {bengaliMode
                      ? '৫ লক্ষ টাকা বা তদূর্ধ্ব নগদ ঋণ গ্রহণ করলে তা ধারা ৬৭(১১) অনুযায়ী অপ্রদর্শিত আয় গণ্য হবে। এবং ঋণ মওকুফ (Waiver) হলে ধারা ৬৭(৭) অনুযায়ী মওকুফকৃত পরিমাণ করযোগ্য আয় হিসেবে যুক্ত হবে।'
                      : 'Cash loans >= BDT 500,000 become deemed taxable income under Sec 67(11). Waived or forgiven loans become deemed taxable income under Sec 67(7). Zero deductions allowed!'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {bengaliMode ? 'গৃহীত ঋণের মোট পরিমাণ (টাকা):' : 'Loan Borrowing Amount (BDT):'}
                  </label>
                  <input
                    type="number"
                    step="50000"
                    min="0"
                    value={loanAmount}
                    onChange={e => setLoanAmount(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-3.5 py-2 text-base font-bold text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    {bengaliMode ? 'ঋণ গ্রহণের মাধ্যম:' : 'Disbursement Method:'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setLoanMethod('bank')}
                      className={`p-2.5 rounded-lg text-xs font-bold border text-center transition-all ${
                        loanMethod === 'bank'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {bengaliMode ? 'ব্যাংকিং চ্যানেল (চেক/ট্রান্সফার)' : 'Banking Channel (Cheque/EFT)'}
                    </button>
                    <button
                      onClick={() => setLoanMethod('cash')}
                      className={`p-2.5 rounded-lg text-xs font-bold border text-center transition-all ${
                        loanMethod === 'cash'
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {bengaliMode ? 'নগদ গ্রহণ (Cash Receipt)' : 'Physical Cash'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {bengaliMode ? 'মওকুফকৃত বা ক্ষমা করা ঋণ (টাকা):' : 'Waived / Forgiven Debt Amount (BDT):'}
                  </label>
                  <input
                    type="number"
                    step="25000"
                    min="0"
                    value={waivedAmount}
                    onChange={e => setWaivedAmount(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-3.5 py-2 text-base font-bold text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {bengaliMode ? 'যদি কোনো ঋণ মওকুফ না হয়ে থাকে তবে 0 লিখুন।' : 'Leave 0 if loan was not waived.'}
                  </span>
                </div>
              </div>

              {/* Assessment Panel */}
              <div className="lg:col-span-6 bg-slate-900 p-6 rounded-xl text-white shadow-md space-y-4">
                <h4 className="text-xs uppercase font-extrabold tracking-wider text-emerald-400">
                  {bengaliMode ? 'করদাতার ঝুঁকি ও আয় সংযোজন বিশ্লেষণ' : 'Deemed Income Risk Exposure'}
                </h4>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-lg bg-white/10 border border-white/10 flex justify-between items-center">
                    <div>
                      <div className="text-xs text-slate-300">{bengaliMode ? 'নগদ ঋণের কারণে গণ্যমান্য আয় (Sec 67(11))' : 'Cash Loan Deemed Addition'}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{loanMethod === 'cash' ? (loanAmount >= 500000 ? 'Breached >= 5 Lac limit' : 'Under limit') : 'Clean bank trail'}</div>
                    </div>
                    <div className={`text-lg font-black ${isLoanCashBreach ? 'text-rose-400' : 'text-emerald-400'}`}>
                      ৳ {deemedLoanIncome.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-white/10 border border-white/10 flex justify-between items-center">
                    <div>
                      <div className="text-xs text-slate-300">{bengaliMode ? 'ঋণ মওকুফ গণ্যমান্য আয় (Sec 67(7))' : 'Loan Waiver Deemed Addition'}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{waivedAmount > 0 ? 'Taxed in year of waiver' : 'No debt relief'}</div>
                    </div>
                    <div className={`text-lg font-black ${waivedAmount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                      ৳ {deemedWaiverIncome.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-emerald-950/60 border border-emerald-500/30">
                    <div className="text-xs font-bold text-emerald-300 mb-1">
                      {bengaliMode ? 'মোট সম্ভাব্য করযোগ্য আয় সংযোজন:' : 'Total Potential Deemed Additions:'}
                    </div>
                    <div className="text-2xl font-black text-white">
                      ৳ {(deemedLoanIncome + deemedWaiverIncome).toLocaleString()}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1.5">
                      {bengaliMode
                        ? 'ধারা ৬৮ অনুযায়ী গণ্যমান্য আয়ের বিপরীতে কোনো খরচ বিয়োজন পাওয়া যায় না। সম্পূর্ণ অর্থ ব্যক্তির নিয়মিত ট্যাক্স স্ল্যাবে যোগ হবে।'
                        : 'Under Section 68, ZERO expense deductions are allowable against Section 67 additions.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: FREELANCE / ITES */}
        {activeTab === 'freelance' && (
          <div className="space-y-6">
            <div className="bg-sky-50 border-l-4 border-sky-500 p-4 rounded-r-xl">
              <div className="flex items-start gap-3">
                <Laptop className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-sky-950">
                    {bengaliMode ? 'ধারা ১২৪ ও ষষ্ঠ তফসিল: আইটিইএস (ITES) ফ্রিল্যান্সিং রেমিট্যান্স কর মূল্যায়ন' : 'Section 124 & Sixth Schedule: ITES Freelance Remittance Screening'}
                  </h4>
                  <p className="text-xs text-sky-800 mt-1">
                    {bengaliMode
                      ? 'অনুমোদিত আইটি ও আইটিইএস সেবা রপ্তানির রেমিট্যান্স পিআরসি (PRC/Form C) সহ ব্যাংকিং চ্যানেলে গ্রহণ করলে করমুক্ত। নন-আইটি কনসাল্টিং বা সেবায় ১০% উৎসে কর কর্তন প্রযোজ্য।'
                      : 'Qualifying IT/ITES inward remittances via banking channel with valid Proceeds Realization Certificate (PRC) remain exempt. Non-ITES consulting attracts 10% TDS under Sec 124.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    {bengaliMode ? 'সেবার ধরন নির্বাচন করুন:' : 'Service Export Nature:'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setFreelanceServiceType('ites')}
                      className={`p-2.5 rounded-lg text-xs font-bold border text-center transition-all ${
                        freelanceServiceType === 'ites'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {bengaliMode ? 'আইটি / সফটওয়্যার / ডিজিটাল সার্ভিস (ITES)' : 'Qualifying IT / ITES Service'}
                    </button>
                    <button
                      onClick={() => setFreelanceServiceType('non_ites')}
                      className={`p-2.5 rounded-lg text-xs font-bold border text-center transition-all ${
                        freelanceServiceType === 'non_ites'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {bengaliMode ? 'সাধারণ কনসাল্টিং / অনুবাদ / অন্যান্য' : 'Non-ITES Consulting / Services'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {bengaliMode ? 'ব্যাংকে প্রাপ্ত মোট রেমিট্যান্স (টাকা):' : 'Inward Remittance Amount (BDT):'}
                  </label>
                  <input
                    type="number"
                    step="50000"
                    min="0"
                    value={freelanceAmount}
                    onChange={e => setFreelanceAmount(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-3.5 py-2 text-base font-bold text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <input
                    type="checkbox"
                    id="has-prc-checkbox"
                    checked={hasPrc}
                    onChange={e => setHasPrc(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <label htmlFor="has-prc-checkbox" className="text-xs font-semibold text-slate-800 cursor-pointer">
                    {bengaliMode ? 'ব্যাংক হতে PRC (Proceeds Realization Certificate) সংগৃহীত রয়েছে' : 'PRC (Proceeds Realization Certificate) collected from Bank'}
                  </label>
                </div>
              </div>

              {/* Freelance Output */}
              <div className="lg:col-span-6 bg-slate-900 p-6 rounded-xl text-white shadow-md space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-xs uppercase font-extrabold text-emerald-400">
                    {bengaliMode ? 'কর অব্যাহতি ও উইথহোল্ডিং স্ট্যাটাস' : 'Exemption & TDS Status'}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                    isItesExempt
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                  }`}>
                    {isItesExempt
                      ? (bengaliMode ? '১০০% করমুক্ত (ITES Exemption)' : '100% Tax-Exempt ITES')
                      : (bengaliMode ? '১০% উৎসে কর প্রযোজ্য (Sec 124)' : '10% TDS Applicable (Sec 124)')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-xs text-slate-300">{bengaliMode ? 'ব্যাংক উইথহোল্ডিং (TDS)' : 'Bank TDS Deducted'}</div>
                    <div className="text-xl font-black text-rose-400 mt-1">
                      ৳ {freelanceWithholding.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-xs text-slate-300">{bengaliMode ? 'গ্রাহক হিসেবে জমা' : 'Net Bank Credit'}</div>
                    <div className="text-xl font-black text-emerald-300 mt-1">
                      ৳ {freelanceNetReceipt.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 space-y-1.5">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>{bengaliMode ? 'রিটার্ন জমা দেওয়ার আবশ্যকতা:' : 'Return Filing Obligation:'}</span>
                  </div>
                  <p>
                    {bengaliMode
                      ? 'আয় করমুক্ত হলেও আয়কর আইন ২০২৩-এর ধারা ১৬৬ অনুযায়ী বার্ষিক আয়কর রিটার্ন দাখিল করা বাধ্যতামূলক। ষষ্ঠ তফসিলে এই আয় প্রদর্শন করতে হবে।'
                      : 'Even if 100% tax-exempt, filing an annual return under Section 166 is MANDATORY. Report the turnover under the Sixth Schedule schedule.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: AUDIT CHECKLIST WITH LOCALSTORAGE */}
        {activeTab === 'checklist' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{bengaliMode ? 'অডিট প্রতিরোধ ও প্রমাণপত্র প্রস্তুতি চেকলিস্ট' : 'Audit Defense & Compliance Checklist'}</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {bengaliMode ? 'আপনার সংরক্ষিত তথ্য ব্রাউজারে স্বয়ংক্রিয়ভাবে সেভ থাকবে।' : 'Your checked items are automatically saved in local browser storage.'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-800">{checkedCount} / {defaultChecklistItems.length} {bengaliMode ? 'সম্পন্ন' : 'Ready'}</div>
                  <div className="text-[10px] text-emerald-600 font-semibold">{progressPercent}% {bengaliMode ? 'প্রস্তুত' : 'Prepared'}</div>
                </div>
                <button
                  onClick={resetChecklist}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                  title="Reset Checklist"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {defaultChecklistItems.map((item) => {
                const isChecked = !!checkedItems[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleChecklistItem(item.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                      isChecked
                        ? 'bg-emerald-50/70 border-emerald-300 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border transition-colors ${
                      isChecked
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}>
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-xs font-medium block leading-relaxed ${
                        isChecked ? 'text-emerald-950 font-semibold' : 'text-slate-700'
                      }`}>
                        {item.label}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-400 mt-1 block">
                        Category: {item.category}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info Strip */}
      <div className="px-6 py-4 bg-slate-100/90 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            {bengaliMode
              ? 'ই-লয়ার্স বাংলাদেশ: আয়কর আইন ২০২৩ এবং অর্থ আইন ২০২৬ মানদণ্ড অনুযায়ী নিরীক্ষিত।'
              : 'E-Lawyers Bangladesh: Grounded in Income Tax Act 2023 & Finance Act 2026.'}
          </span>
        </div>
        <div className="text-slate-500 text-[11px]">
          Official NBR Reference: Sections 66, 67, 118, 124 & 163
        </div>
      </div>
    </div>
  );
}
