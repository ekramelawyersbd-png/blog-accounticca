import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Building2,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Search,
  FileCheck,
  Calendar,
  HelpCircle,
  Sparkles,
  BookOpen,
  Globe2
} from 'lucide-react';
import { APPROVED_11_INSTITUTIONS_SRO_213 } from '../../data/sro213ApprovedCharitiesTaxRebateArticle';
import { useLanguage } from '../../contexts/LanguageContext';

interface Sro213DonationRebateWidgetProps {
  className?: string;
}

const formatBanglaCurrency = (amount: number): string => {
  return `${Math.round(amount).toLocaleString('bn-BD')} টাকা`;
};

const formatEnglishCurrency = (amount: number): string => {
  return `BDT ${Math.round(amount).toLocaleString('en-IN')}`;
};

export const Sro213DonationRebateWidget: React.FC<Sro213DonationRebateWidgetProps> = ({
  className = ''
}) => {
  const { language, setLanguage } = useLanguage();
  const isBn = language === 'bn';

  const [activeTab, setActiveTab] = useState<'calculator' | 'institutions' | 'checklist' | 'references'>('calculator');

  // Calculator state (Default: Example 1)
  const [relevantIncome, setRelevantIncome] = useState<number>(1200000);
  const [donationAmount, setDonationAmount] = useState<number>(100000);
  const [otherInvestmentAmount, setOtherInvestmentAmount] = useState<number>(0);
  const [selectedInstitutionSerial, setSelectedInstitutionSerial] = useState<number>(9); // BRAC default
  const [taxpayerType, setTaxpayerType] = useState<'individual' | 'company_firm'>('individual');
  const [paymentNature, setPaymentNature] = useState<'donation' | 'service_bill'>('donation');

  // Institution search
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Checklist state
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({
    step1: true,
    step2: true,
    step3: false,
    step4: false,
    step5: false
  });

  const formatMoney = (amount: number) =>
    isBn ? formatBanglaCurrency(amount) : formatEnglishCurrency(amount);

  const selectedInstitution = useMemo(
    () =>
      APPROVED_11_INSTITUTIONS_SRO_213.find((inst) => inst.serial === selectedInstitutionSerial) ||
      APPROVED_11_INSTITUTIONS_SRO_213[8],
    [selectedInstitutionSerial]
  );

  const calculation = useMemo(() => {
    const totalEligibleInvestmentAndExpense = Math.max(0, donationAmount) + Math.max(0, otherInvestmentAmount);
    const limit1Income3Pct = Math.round(Math.max(0, relevantIncome) * 0.03);
    const limit2Investment10Pct = Math.round(totalEligibleInvestmentAndExpense * 0.1);
    const limit3StatutoryCap = 750000;

    const isEligible = taxpayerType === 'individual' && paymentNature === 'donation';
    const calculatedRebate = isEligible
      ? Math.min(limit1Income3Pct, limit2Investment10Pct, limit3StatutoryCap)
      : 0;

    let bindingRuleBn = 'মোট অনুমোদনযোগ্য বিনিয়োগ ও ব্যয়ের ১০%';
    let bindingRuleEn = '10% of total eligible investments & expenditure';

    if (
      calculatedRebate === limit1Income3Pct &&
      limit1Income3Pct <= limit2Investment10Pct &&
      limit1Income3Pct <= limit3StatutoryCap
    ) {
      bindingRuleBn = 'প্রাসঙ্গিক মোট আয়ের ৩%';
      bindingRuleEn = '3% of qualifying income';
    } else if (
      calculatedRebate === limit3StatutoryCap &&
      limit3StatutoryCap < limit1Income3Pct &&
      limit3StatutoryCap < limit2Investment10Pct
    ) {
      bindingRuleBn = 'সর্বোচ্চ আইনগত সীমা (৭,৫০,০০০ টাকা)';
      bindingRuleEn = 'Statutory maximum (BDT 750,000)';
    }

    return {
      totalEligibleInvestmentAndExpense,
      limit1Income3Pct,
      limit2Investment10Pct,
      limit3StatutoryCap,
      calculatedRebate,
      isEligible,
      bindingRule: isBn ? bindingRuleBn : bindingRuleEn
    };
  }, [relevantIncome, donationAmount, otherInvestmentAmount, taxpayerType, paymentNature, isBn]);

  const filteredInstitutions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return APPROVED_11_INSTITUTIONS_SRO_213;
    return APPROVED_11_INSTITUTIONS_SRO_213.filter(
      (item) =>
        item.nameEn.toLowerCase().includes(q) ||
        item.exactLegalName.toLowerCase().includes(q) ||
        item.shortCode.toLowerCase().includes(q) ||
        item.focusCategoryEn.toLowerCase().includes(q) ||
        item.focusCategory.toLowerCase().includes(q) ||
        item.descriptionEn.toLowerCase().includes(q) ||
        item.descriptionBn.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const applyPreset = (presetNumber: 1 | 2 | 3) => {
    setTaxpayerType('individual');
    setPaymentNature('donation');
    if (presetNumber === 1) {
      setRelevantIncome(1200000);
      setDonationAmount(100000);
      setOtherInvestmentAmount(0);
      setSelectedInstitutionSerial(9); // BRAC
    } else if (presetNumber === 2) {
      setRelevantIncome(1200000);
      setDonationAmount(500000);
      setOtherInvestmentAmount(0);
    } else if (presetNumber === 3) {
      setRelevantIncome(1500000);
      setDonationAmount(100000);
      setOtherInvestmentAmount(200000);
    }
  };

  return (
    <div className={`rounded-3xl border border-emerald-200/90 bg-white shadow-sm overflow-hidden ${className}`}>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-900 px-6 py-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-800/80 border border-emerald-600/50 text-emerald-100 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              {isBn
                ? 'এস.আর.ও. নং ২১৩-আইন/আয়কর-৪/২০২৬'
                : 'SRO No. 213-Ain/Aykor-4/2026'}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-200 bg-white/10 px-3 py-1 rounded-md">
              <Calendar className="w-3.5 h-3.5 text-emerald-300" />
              {isBn
                ? 'কার্যকর: ১ জুলাই ২০২৬–৩০ জুন ২০৩০'
                : 'Effective: 1 July 2026–30 June 2030'}
            </span>
          </div>

          {/* Direct Article & Widget Language Switcher */}
          <div className="inline-flex items-center gap-1 bg-emerald-950/80 border border-emerald-700/70 p-1 rounded-xl">
            <Globe2 className="w-3.5 h-3.5 text-emerald-300 ml-1.5 mr-0.5" />
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                !isBn
                  ? 'bg-white text-emerald-950 shadow-2xs'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('bn')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                isBn
                  ? 'bg-white text-emerald-950 shadow-2xs'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              বাংলা
            </button>
          </div>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug">
          {isBn
            ? '১১ প্রতিষ্ঠানে দানে আয়কর রেয়াত ক্যালকুলেটর ও যাচাই পোর্টাল'
            : 'Tax Rebate on Donations to 11 Organisations — Calculator & Directory'}
        </h3>
        <p className="text-xs sm:text-sm text-emerald-100/90 mt-1.5 leading-relaxed">
          {isBn
            ? 'আয়কর আইন, ২০২৩-এর ধারা ৭৬(১), ধারা ৭৮ এবং ষষ্ঠ তফসিলের অংশ ৩ (অনুচ্ছেদ ২, দফা ১৩) অনুসারে অনুমোদিত ১১টি জনকল্যাণমূলক প্রতিষ্ঠানে ব্যক্তি করদাতার দানে কর রেয়াতের তাৎক্ষণিক হিসাব।'
            : 'Interactive Section 78 rebate calculator, official 11-organisation directory, documentation checklist, and statutory references under Section 76(1) & Paragraph 2(13), Part 3 of the Sixth Schedule to the Income Tax Act, 2023.'}
        </p>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-5 bg-emerald-950/60 p-1.5 rounded-2xl border border-emerald-800/70">
          <button
            type="button"
            onClick={() => setActiveTab('calculator')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'calculator'
                ? 'bg-white text-emerald-950 shadow-xs'
                : 'text-emerald-100 hover:bg-emerald-800/50'
            }`}
          >
            <Calculator className="w-4 h-4 shrink-0" />
            <span>{isBn ? 'কর রেয়াত ক্যালকুলেটর' : 'Rebate Calculator'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('institutions')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'institutions'
                ? 'bg-white text-emerald-950 shadow-xs'
                : 'text-emerald-100 hover:bg-emerald-800/50'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span>{isBn ? 'অনুমোদিত ১১টি প্রতিষ্ঠান' : '11 Approved Orgs'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('checklist')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'checklist'
                ? 'bg-white text-emerald-950 shadow-xs'
                : 'text-emerald-100 hover:bg-emerald-800/50'
            }`}
          >
            <FileCheck className="w-4 h-4 shrink-0" />
            <span>{isBn ? 'রেয়াত দাবির চেকলিস্ট' : 'Documentation'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('references')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'references'
                ? 'bg-white text-emerald-950 shadow-xs'
                : 'text-emerald-100 hover:bg-emerald-800/50'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>{isBn ? 'তথ্যসূত্র ও দাবিত্যাগ' : 'References (1–6)'}</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Calculator */}
      {activeTab === 'calculator' && (
        <div className="p-6 sm:p-8 space-y-6">
          {/* Quick Example Presets */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {isBn
                  ? 'প্রবন্ধের গাণিতিক উদাহরণগুলো এক ক্লিকে যাচাই করুন:'
                  : 'Click to load the worked examples from the guide:'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => applyPreset(1)}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  relevantIncome === 1200000 && donationAmount === 100000 && otherInvestmentAmount === 0
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-white text-slate-700'
                }`}
              >
                <div className="text-xs font-bold text-emerald-800">
                  {isBn ? 'উদাহরণ ১: ১ লাখ টাকা অনুদান' : 'Example 1: Donation of BDT 100,000'}
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  {isBn
                    ? 'আয়: ১২,০০,০০০ টাকা | অনুদান: ১,০০,০০০ টাকা → রেয়াত: ১০,০০০ টাকা'
                    : 'Income: BDT 1,200,000 | Donation: BDT 100,000 → Rebate: BDT 10,000'}
                </div>
              </button>
              <button
                type="button"
                onClick={() => applyPreset(2)}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  relevantIncome === 1200000 && donationAmount === 500000 && otherInvestmentAmount === 0
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-white text-slate-700'
                }`}
              >
                <div className="text-xs font-bold text-emerald-800">
                  {isBn ? 'উদাহরণ ২: ৫ লাখ টাকা অনুদান' : 'Example 2: Donation of BDT 500,000'}
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  {isBn
                    ? 'আয়: ১২,০০,০০০ টাকা | অনুদান: ৫,০০,০০০ টাকা → রেয়াত: ৩৬,০০০ টাকা'
                    : 'Income: BDT 1,200,000 | Donation: BDT 500,000 → Rebate: BDT 36,000'}
                </div>
              </button>
              <button
                type="button"
                onClick={() => applyPreset(3)}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  relevantIncome === 1500000 && donationAmount === 100000 && otherInvestmentAmount === 200000
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-white text-slate-700'
                }`}
              >
                <div className="text-xs font-bold text-emerald-800">
                  {isBn ? 'উদাহরণ ৩: অন্যান্য বিনিয়োগসহ' : 'Example 3: Donation & Other Investments'}
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  {isBn
                    ? 'আয়: ১৫ লাখ | সঞ্চয় ২ লাখ + দান ১ লাখ → রেয়াত: ৩০,০০০ টাকা'
                    : 'Income: BDT 1.5M | Inv: 200K + Donation: 100K → Rebate: BDT 30,000'}
                </div>
              </button>
            </div>
          </div>

          {/* Eligibility Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isBn ? 'অনুমোদিত প্রতিষ্ঠান নির্বাচন করুন' : 'Select Approved Organisation'}
              </label>
              <select
                value={selectedInstitutionSerial}
                onChange={(e) => setSelectedInstitutionSerial(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
              >
                {APPROVED_11_INSTITUTIONS_SRO_213.map((inst) => (
                  <option key={inst.serial} value={inst.serial}>
                    {isBn
                      ? `${inst.serialBn}. ${inst.exactLegalName}`
                      : `${inst.serial}. ${inst.nameEn}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isBn ? 'করদাতার ধরন (Taxpayer Status)' : 'Donor / Taxpayer Category'}
              </label>
              <select
                value={taxpayerType}
                onChange={(e) => setTaxpayerType(e.target.value as 'individual' | 'company_firm')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
              >
                <option value="individual">
                  {isBn
                    ? 'স্বাভাবিক ব্যক্তি করদাতা (Individual)'
                    : 'Individual Taxpayer (Resident / NRB)'}
                </option>
                <option value="company_firm">
                  {isBn
                    ? 'কোম্পানি / অংশীদারি ফার্ম / অন্য সত্তা'
                    : 'Company / Partnership Firm / Legal Entity'}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isBn ? 'অর্থ প্রদানের প্রকৃতি' : 'Nature of Payment'}
              </label>
              <select
                value={paymentNature}
                onChange={(e) => setPaymentNature(e.target.value as 'donation' | 'service_bill')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
              >
                <option value="donation">
                  {isBn
                    ? 'নিঃস্বার্থ দান বা অনুদান (মানি রিসিটসহ)'
                    : 'Genuine Donation / Contribution (with Receipt)'}
                </option>
                <option value="service_bill">
                  {isBn
                    ? 'চিকিৎসা বিল / শিক্ষার ফি / পণ্যের মূল্য'
                    : 'Hospital Bill / Tuition Fee / Payment for Service'}
                </option>
              </select>
            </div>
          </div>

          {(isBn ? selectedInstitution.verificationNoteBn : selectedInstitution.verificationNoteEn) && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                {isBn ? selectedInstitution.verificationNoteBn : selectedInstitution.verificationNoteEn}
              </span>
            </div>
          )}

          {!calculation.isEligible && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-900 font-medium">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                {taxpayerType !== 'individual' ? (
                  <p>
                    {isBn ? (
                      <>
                        <strong>সতর্কতা:</strong> এস.আর.ও. নং ২১৩-আইন/আয়কর-৪/২০২৬ এবং ধারা ৭৮-এর এই সাধারণ কর রেয়াত সুবিধা মূলত <strong>স্বাভাবিক ব্যক্তি করদাতা (Individual Taxpayer)</strong>-এর জন্য প্রযোজ্য। কোনো কোম্পানি বা অংশীদারি ফার্ম এই ব্যক্তি-রেয়াত সুবিধা স্বয়ংক্রিয়ভাবে দাবি করতে পারবে না।
                      </>
                    ) : (
                      <>
                        <strong>Ineligible Donor Category:</strong> SRO No. 213-Ain/Aykor-4/2026 and Section 78 specifically cover donations made by <strong>individual taxpayers</strong>. Companies, partnership firms, and other legal entities are not automatically entitled to claim this individual tax rebate.
                      </>
                    )}
                  </p>
                ) : (
                  <p>
                    {isBn ? (
                      <>
                        <strong>সতর্কতা:</strong> হাসপাতালের চিকিৎসা বিল, পণ্য কেনা, শিক্ষার ফি বা কোনো সেবার মূল্য পরিশোধ করলে তা দান হিসেবে গণ্য হবে না এবং কর রেয়াত পাওয়া যাবে না।
                      </>
                    ) : (
                      <>
                        <strong>Ineligible Payment Type:</strong> Ordinary hospital bills, tuition fees, purchases, or payments for services do not qualify as genuine charitable donations.
                      </>
                    )}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Numeric Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn
                  ? '১. রেয়াত গণনার প্রাসঙ্গিক বার্ষিক আয় (টাকা)'
                  : '1. Qualifying Annual Income (BDT)'}
              </label>
              <input
                type="number"
                min={0}
                step={10000}
                value={relevantIncome}
                onChange={(e) => setRelevantIncome(Math.max(0, Number(e.target.value)))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-mono font-bold text-slate-900 focus:border-emerald-600 focus:outline-none"
              />
              <span className="block text-[11px] text-slate-500 mt-1">
                {isBn ? '৩% সীমা = ' : '3% Limit = '}
                {formatMoney(calculation.limit1Income3Pct)}
              </span>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn
                  ? '২. অনুমোদিত প্রতিষ্ঠানে অনুদান (টাকা)'
                  : '2. Eligible Donation Amount (BDT)'}
              </label>
              <input
                type="number"
                min={0}
                step={5000}
                value={donationAmount}
                onChange={(e) => setDonationAmount(Math.max(0, Number(e.target.value)))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-mono font-bold text-slate-900 focus:border-emerald-600 focus:outline-none"
              />
              <span className="block text-[11px] text-slate-500 mt-1">
                {isBn ? 'প্রতিষ্ঠান: ' : 'Recipient: '}
                {selectedInstitution.shortCode}
              </span>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn
                  ? '৩. অন্যান্য যোগ্য বিনিয়োগ ও ব্যয় (টাকা)'
                  : '3. Other Eligible Investments (BDT)'}
              </label>
              <input
                type="number"
                min={0}
                step={10000}
                value={otherInvestmentAmount}
                onChange={(e) => setOtherInvestmentAmount(Math.max(0, Number(e.target.value)))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-mono font-bold text-slate-900 focus:border-emerald-600 focus:outline-none"
              />
              <span className="block text-[11px] text-slate-500 mt-1">
                {isBn ? 'মোট বিনিয়োগ ও দান: ' : 'Total Qualifying Inv. & Donation: '}
                {formatMoney(calculation.totalEligibleInvestmentAndExpense)}
              </span>
            </div>
          </div>

          {/* Calculation Comparison Table */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-800 border-b border-slate-200">
                  <th className="py-3 px-4 font-bold">
                    {isBn ? 'ধারা ৭৮ অনুযায়ী রেয়াতের ৩টি সীমা' : 'Basis (Section 78 Three-Limit Test)'}
                  </th>
                  <th className="py-3 px-4 font-bold">
                    {isBn ? 'গণনার সূত্র' : 'Statutory Formula'}
                  </th>
                  <th className="py-3 px-4 font-bold text-right">
                    {isBn ? 'পরিমাণ' : 'Amount'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr
                  className={
                    calculation.calculatedRebate === calculation.limit1Income3Pct && calculation.isEligible
                      ? 'bg-emerald-50/60'
                      : ''
                  }
                >
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {isBn ? '১. প্রাসঙ্গিক মোট আয়ের ৩%' : '1. 3% of qualifying income'}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {isBn
                      ? `${formatMoney(relevantIncome)}-এর ৩%`
                      : `3% of ${formatMoney(relevantIncome)}`}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {formatMoney(calculation.limit1Income3Pct)}
                  </td>
                </tr>
                <tr
                  className={
                    calculation.calculatedRebate === calculation.limit2Investment10Pct && calculation.isEligible
                      ? 'bg-emerald-50/60'
                      : ''
                  }
                >
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {isBn
                      ? '২. মোট অনুমোদনযোগ্য বিনিয়োগ ও অনুদানের ১০%'
                      : '2. 10% of total eligible investments & expenditure'}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {isBn
                      ? `${formatMoney(calculation.totalEligibleInvestmentAndExpense)}-এর ১০%`
                      : `10% of ${formatMoney(calculation.totalEligibleInvestmentAndExpense)}`}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {formatMoney(calculation.limit2Investment10Pct)}
                  </td>
                </tr>
                <tr
                  className={
                    calculation.calculatedRebate === calculation.limit3StatutoryCap && calculation.isEligible
                      ? 'bg-emerald-50/60'
                      : ''
                  }
                >
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {isBn ? '৩. সর্বোচ্চ আইনগত সীমা' : '3. Statutory maximum'}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {isBn ? 'অর্থ আইন ২০২৬ নির্ধারিত সর্বোচ্চ সীমা' : 'Finance Act, 2026 statutory cap'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {formatMoney(calculation.limit3StatutoryCap)}
                  </td>
                </tr>
                <tr className="bg-emerald-900 text-white">
                  <td className="py-3.5 px-4 font-bold" colSpan={2}>
                    {isBn
                      ? `গণনাকৃত কর রেয়াত (সর্বনিম্ন পরিমাণ — ${calculation.isEligible ? calculation.bindingRule : 'অযোগ্য'})`
                      : `Calculated Rebate (Lowest of the 3 limits — ${calculation.isEligible ? calculation.bindingRule : 'Ineligible'})`}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-base sm:text-lg font-extrabold text-emerald-200">
                    {formatMoney(calculation.calculatedRebate)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-600">
            <HelpCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>
              {isBn ? (
                <>
                  <strong>মনে রাখুন:</strong> দান করা সম্পূর্ণ অর্থ ({formatMoney(donationAmount)}) সরাসরি আয়কর থেকে বাদ যাবে না। প্রকৃতপক্ষে ব্যবহারযোগ্য রেয়াত নির্ভর করবে করদাতার করদায় ও প্রযোজ্য ন্যূনতম করসহ অন্যান্য বিধানের ওপর।
                </>
              ) : (
                <>
                  <strong>Statutory Note:</strong> The full amount donated ({formatMoney(donationAmount)}) is not deducted directly from income tax liability. The amount actually usable against tax liability remains subject to applicable tax and minimum-tax provisions.
                </>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Tab 2: 11 Approved Institutions Directory */}
      {activeTab === 'institutions' && (
        <div className="p-6 sm:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-base font-bold text-slate-900">
                {isBn
                  ? 'এস.আর.ও. নং ২১৩-আইন/আয়কর-৪/২০২৬ অনুযায়ী অনুমোদিত ১১টি প্রতিষ্ঠান'
                  : '11 Approved Public-Welfare Organisations (SRO No. 213-Ain/Aykor-4/2026)'}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {isBn
                  ? 'অনুদান প্রদানের পূর্বে রসিদে প্রতিষ্ঠানের সঠিক আইনগত নাম যাচাই করুন'
                  : 'Verify the exact legal identity of the recipient organisation before donating'}
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isBn ? 'প্রতিষ্ঠানের নাম খুঁজুন...' : 'Search organisations...'}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredInstitutions.map((inst) => {
              const note = isBn ? inst.verificationNoteBn : inst.verificationNoteEn;
              return (
                <div
                  key={inst.serial}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-emerald-300 transition flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-xs shrink-0">
                        {isBn ? inst.serialBn : inst.serial}
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                        {isBn ? inst.focusCategory : inst.focusCategoryEn}
                      </span>
                    </div>
                    <h5 className="text-sm font-bold text-slate-900">
                      {isBn ? inst.exactLegalName : inst.nameEn}
                    </h5>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {isBn ? inst.descriptionBn : inst.descriptionEn}
                    </p>
                  </div>

                  {note && (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-900 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{note}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Claim Verification Checklist */}
      {activeTab === 'checklist' && (
        <div className="p-6 sm:p-8 space-y-4">
          <div>
            <h4 className="text-base font-bold text-slate-900">
              {isBn
                ? 'কর রেয়াত দাবির ৫-ধাপের কমপ্লায়েন্স চেকলিস্ট'
                : '5-Point Documentation & Return Compliance Checklist'}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {isBn
                ? 'আয়কর রিটার্নে অনুদানজনিত কর রেয়াত দাবির পূর্বে নিচের শর্তগুলো যাচাই করুন'
                : 'Verify these statutory documentation requirements before claiming the rebate on your income tax return'}
            </p>
          </div>

          <div className="space-y-2.5">
            {[
              {
                key: 'step1',
                titleBn: '১. প্রতিষ্ঠানের সঠিক আইনগত নাম যাচাই',
                titleEn: '1. Verify Exact Legal Identity of the Recipient Organisation',
                descBn:
                  'রসিদে উল্লিখিত নাম এস.আর.ও. নং ২১৩-আইন/আয়কর-৪/২০২৬-এর ১১টি প্রতিষ্ঠানের নামের সঙ্গে হুবহু মিলছে কি না যাচাই করুন (যেমন: বাংলাদেশ থ্যালাসেমিয়া সমিতি বনাম ফাউন্ডেশন)।',
                descEn:
                  'Confirm that the recipient organisation’s name on the receipt matches the exact entity approved under SRO No. 213-Ain/Aykor-4/2026 (organisations with similar names are not necessarily the same legal entity).'
              },
              {
                key: 'step2',
                titleBn: '২. কার্যকর সময়সীমার মধ্যে অনুদান প্রদান',
                titleEn: '2. Confirm Payment Within Effective Window (1 July 2026–30 June 2030)',
                descBn:
                  'অনুদানটি অবশ্যই ১ জুলাই ২০২৬ থেকে ৩০ জুন ২০৩০ তারিখের মধ্যে প্রদান করা হয়েছে কি না নিশ্চিত করুন।',
                descEn:
                  'Ensure the donation date falls within the notification’s effective period from 1 July 2026 to 30 June 2030.'
              },
              {
                key: 'step3',
                titleBn: '৩. ব্যাংকিং বা অনুমোদিত ডিজিটাল চ্যানেলে লেনদেন',
                titleEn: '3. Maintain Bank Transfer or Verifiable Digital Payment Confirmation',
                descBn:
                  'ব্যাংক ট্রান্সফার, অ্যাকাউন্ট পেয়ি চেক বা প্রতিষ্ঠানের অনুমোদিত ডিজিটাল পেমেন্ট পদ্ধতিতে অনুদান প্রদান করে লেনদেনের বিবরণ সংরক্ষণ করুন।',
                descEn:
                  'Use bank transfer or verifiable digital payment channels to establish clear audit proof that the donation was actually made.'
              },
              {
                key: 'step4',
                titleBn: '৪. আনুষ্ঠানিক মানি রিসিট / অনুদানের স্বীকৃতিপত্র সংগ্রহ',
                titleEn: '4. Obtain Official Donation Receipt Showing Donor & Contribution Details',
                descBn:
                  'রসিদে অনুদানদাতার নাম, প্রতিষ্ঠানের নাম, অনুদানের পরিমাণ ও প্রদানের তারিখ স্পষ্টভাবে উল্লেখ থাকতে হবে (সেবার বিল বা ফি নয়)।',
                descEn:
                  'Retain an official donation receipt stating the donor’s name, recipient organisation’s name, date of payment, and amount contributed (ordinary hospital bills or tuition fees do not qualify).'
              },
              {
                key: 'step5',
                titleBn: '৫. আয়কর রিটার্নে ষষ্ঠ তফসিল অংশ ৩ ও ধারা ৭৮ অনুযায়ী প্রদর্শন',
                titleEn: '5. Aggregate Under Part 3 of the Sixth Schedule & Apply Section 78 Limits',
                descBn:
                  'অন্যান্য অনুমোদনযোগ্য বিনিয়োগের সঙ্গে অনুদানটি যুক্ত করে ৩টি সীমার সর্বনিম্ন পরিমাণ অনুযায়ী রেয়াত দাবি করুন এবং মূল রসিদ সংরক্ষণ করুন।',
                descEn:
                  'Combine eligible donations with other qualifying investments when preparing your income tax return, apply the Section 78 three-limit cap, and retain supporting records for tax authority verification.'
              }
            ].map((item) => {
              const checked = Boolean(checkedSteps[item.key]);
              return (
                <label
                  key={item.key}
                  className={`flex items-start gap-3 p-4 rounded-2xl border transition cursor-pointer ${
                    checked
                      ? 'border-emerald-300 bg-emerald-50/50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setCheckedSteps((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                    }
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{isBn ? item.titleBn : item.titleEn}</span>
                      {checked && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {isBn ? item.descBn : item.descEn}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: References & Disclaimer */}
      {activeTab === 'references' && (
        <div className="p-6 sm:p-8 space-y-5">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs sm:text-sm text-amber-950 leading-relaxed">
            <strong className="font-bold block mb-1">
              {isBn ? 'দাবিত্যাগ (Disclaimer):' : 'Statutory Disclaimer:'}
            </strong>
            {isBn
              ? 'প্রবন্ধে উল্লিখিত উদাহরণগুলো কেবল ধারণা প্রদানের উদ্দেশ্যে তৈরি এবং ধরে নেওয়া হয়েছে যে সংশ্লিষ্ট অনুদান ও বিনিয়োগ প্রযোজ্য আইন অনুযায়ী যোগ্য। প্রকৃত কর-ব্যবস্থা করদাতার ব্যক্তিগত পরিস্থিতি, প্রচলিত আইন, ন্যূনতম করের বিধান এবং পরবর্তী যেকোনো সংশোধনীর ওপর নির্ভর করবে।'
              : "The examples are illustrative and assume that the donations and investments qualify under the applicable law. Actual tax treatment depends on the taxpayer's circumstances, current legislation, minimum-tax provisions and any subsequent amendments."}
          </div>

          <div>
            <h4 className="text-base font-bold text-slate-900 mb-3">
              References | তথ্যসূত্র
            </h4>
            <ol className="space-y-2.5 text-xs sm:text-sm text-slate-700">
              {[
                '1. National Board of Revenue (NBR), SRO No. 213-Ain/Aykor-4/2026 — Official Gazette (8 June 2026).',
                '2. Laws of Bangladesh, Income Tax Act, 2023 — Section 78.',
                '3. NBR, Income Tax Act, 2023 — Sixth Schedule, Part 3 (Paragraph 2(13)).',
                '4. Ministry of Law, Finance Act, 2026 — Income Tax Amendments.',
                '5. NBR, Income Tax FAQs and Guidance.',
                '6. Institutional information: ASHIC, BANCAT, Al-Markazul Islami, Disabled Child Foundation (DCF), Sherpur Diabetic Samity, Mawna Diabetic Association, Bangladesh Thalassemia Samity, Autism Welfare Foundation, BRAC, Ramakrishna Mission Dhaka and Chattogram Maa-O-Shishu Hospital.'
              ].map((refText, idx) => (
                <li
                  key={idx}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 font-medium"
                >
                  {refText}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};
