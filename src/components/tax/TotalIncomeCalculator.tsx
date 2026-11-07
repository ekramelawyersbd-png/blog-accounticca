import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  HelpCircle, 
  TrendingUp, 
  ArrowRight, 
  RotateCcw,
  ShieldCheck,
  FileCheck,
  Building2,
  Briefcase,
  Sprout,
  Landmark,
  Coins,
  Globe2,
  Users2,
  DollarSign,
  Printer,
  ChevronDown,
  ChevronUp,
  Percent,
  Sparkles,
  Info
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export interface IncomeHeadData {
  gross: number;
  deduction: number;
  isExcludedFromRebate?: boolean;
}

export function TotalIncomeCalculator({ className = '' }: { className?: string }) {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  // Taxpayer Category
  const [taxpayerCategory, setTaxpayerCategory] = useState<'general' | 'female_senior' | 'disabled' | 'freedom_fighter'>('general');
  const [locationType, setLocationType] = useState<'dhaka_ctg' | 'other_city' | 'other_areas'>('dhaka_ctg');

  // Head 1: Employment
  const [employmentGross, setEmploymentGross] = useState<number>(1000000);
  const [employmentExempt, setEmploymentExempt] = useState<number>(0);

  // Head 2: House Property / Rent
  const [rentGross, setRentGross] = useState<number>(0);
  const [propertyType, setPropertyType] = useState<'residential' | 'commercial'>('residential');
  const [rentMunicipalTax, setRentMunicipalTax] = useState<number>(0);
  const [rentMortgageInterest, setRentMortgageInterest] = useState<number>(0);
  const [customRepairsDeduction, setCustomRepairsDeduction] = useState<boolean>(false);
  const [manualRepairs, setManualRepairs] = useState<number>(0);

  // Head 3: Agriculture
  const [agricultureGross, setAgricultureGross] = useState<number>(0);
  const [agricultureExpense, setAgricultureExpense] = useState<number>(0);

  // Head 4: Business / Profession
  const [businessGross, setBusinessGross] = useState<number>(500000);
  const [businessExpense, setBusinessExpense] = useState<number>(0);

  // Head 5: Capital Gains
  const [capitalGainsGross, setCapitalGainsGross] = useState<number>(0);
  const [capitalGainsCost, setCapitalGainsCost] = useState<number>(0);

  // Head 6: Financial Assets
  const [financialGross, setFinancialGross] = useState<number>(200000);
  const [financialTds, setFinancialTds] = useState<number>(20000);

  // Head 7: Other Sources
  const [otherSourcesGross, setOtherSourcesGross] = useState<number>(0);
  const [otherSourcesExpense, setOtherSourcesExpense] = useState<number>(0);

  // Head 8: Partnership Firm / AOP (Key Section 78 Distinction!)
  const [partnershipGross, setPartnershipGross] = useState<number>(200000);

  // Head 9: Spouse / Minor Child
  const [spouseChildIncome, setSpouseChildIncome] = useState<number>(0);

  // Head 10: Foreign Income
  const [foreignGross, setForeignGross] = useState<number>(0);
  const [foreignTaxCredit, setForeignTaxCredit] = useState<number>(0);

  // Investments for Tax Rebate
  const [dpsInvestment, setDpsInvestment] = useState<number>(120000);
  const [lifeInsurance, setLifeInsurance] = useState<number>(50000);
  const [govSecurities, setGovSecurities] = useState<number>(250000);
  const [otherEligibleInvestments, setOtherEligibleInvestments] = useState<number>(0);

  // Advance Tax / Other TDS
  const [advanceTaxPaid, setAdvanceTaxPaid] = useState<number>(0);

  // Expandable sections
  const [expandedHead, setExpandedHead] = useState<string | null>(null);

  // --- Calculations ---

  // 1. Employment Net
  const netEmployment = Math.max(0, employmentGross - employmentExempt);

  // 2. Rent Net
  const statutoryRepairRate = propertyType === 'residential' ? 0.25 : 0.30;
  const repairsDeduction = customRepairsDeduction ? manualRepairs : Math.round(rentGross * statutoryRepairRate);
  const totalRentDeductions = repairsDeduction + rentMunicipalTax + rentMortgageInterest;
  const netRent = Math.max(0, rentGross - totalRentDeductions);

  // 3. Agriculture Net
  const netAgriculture = Math.max(0, agricultureGross - agricultureExpense);

  // 4. Business Net
  const netBusiness = Math.max(0, businessGross - businessExpense);

  // 5. Capital Gains Net
  const netCapitalGains = Math.max(0, capitalGainsGross - capitalGainsCost);

  // 6. Financial Assets Net
  const netFinancial = Math.max(0, financialGross);

  // 7. Other Sources Net
  const netOtherSources = Math.max(0, otherSourcesGross - otherSourcesExpense);

  // 8. Partnership / AOP Net
  const netPartnership = Math.max(0, partnershipGross);

  // 9. Spouse / Child Net
  const netSpouseChild = Math.max(0, spouseChildIncome);

  // 10. Foreign Income Net
  const netForeign = Math.max(0, foreignGross);

  // TOTAL INCOME (Aggregate of all 10 heads)
  const totalIncome = 
    netEmployment + 
    netRent + 
    netAgriculture + 
    netBusiness + 
    netCapitalGains + 
    netFinancial + 
    netOtherSources + 
    netPartnership + 
    netSpouseChild + 
    netForeign;

  // QUALIFYING INCOME FOR SECTION 78 REBATE (Excludes Partnership Firm share & final/tax-exempt components)
  const qualifyingIncomeForRebate = Math.max(0, totalIncome - netPartnership);

  // --- Investment Tax Rebate Computation (AY 2026-2027) ---
  const DPS_STATUTORY_LIMIT = 120000;
  const STATUTORY_MAX_REBATE = 750000;

  const allowableDps = Math.min(dpsInvestment, DPS_STATUTORY_LIMIT);
  const totalEligibleInvestment = allowableDps + lifeInsurance + govSecurities + otherEligibleInvestments;

  // 3-Limit Formula
  const limit1_3PercentIncome = Math.round(qualifyingIncomeForRebate * 0.03);
  const limit2_10PercentInvestment = Math.round(totalEligibleInvestment * 0.10);
  const limit3_StatutoryCap = STATUTORY_MAX_REBATE;

  const allowableTaxRebate = Math.min(limit1_3PercentIncome, limit2_10PercentInvestment, limit3_StatutoryCap);

  const governingLimit = useMemo(() => {
    if (allowableTaxRebate === limit1_3PercentIncome && allowableTaxRebate === limit2_10PercentInvestment) return 'both';
    if (allowableTaxRebate === limit1_3PercentIncome) return 'income';
    if (allowableTaxRebate === limit2_10PercentInvestment) return 'investment';
    return 'cap';
  }, [allowableTaxRebate, limit1_3PercentIncome, limit2_10PercentInvestment]);

  // Investment required to fully claim 3% income rebate limit
  const optimalInvestmentNeeded = Math.round(limit1_3PercentIncome / 0.10);

  // --- Tax Liability Computation (AY 2026-2027 Slabs) ---
  const getTaxFreeThreshold = () => {
    switch (taxpayerCategory) {
      case 'female_senior': return 400000;
      case 'disabled': return 475000;
      case 'freedom_fighter': return 500000;
      default: return 350000;
    }
  };

  const taxFreeThreshold = getTaxFreeThreshold();

  const calculateGrossTax = (income: number) => {
    if (income <= taxFreeThreshold) return { totalTax: 0, slabs: [] };

    let taxable = income - taxFreeThreshold;
    let totalTax = 0;
    const slabs: { label: string; rate: string; amount: number; tax: number }[] = [];

    // First Slab: Tax Free
    slabs.push({
      label: isBn ? 'করমুক্ত সীমা' : 'Initial Tax-Free Limit',
      rate: '0%',
      amount: Math.min(income, taxFreeThreshold),
      tax: 0
    });

    // Slab 1: Next Tk. 1,00,000 @ 5%
    if (taxable > 0) {
      const slabAmt = Math.min(taxable, 100000);
      const taxAmt = slabAmt * 0.05;
      totalTax += taxAmt;
      taxable -= slabAmt;
      slabs.push({ label: isBn ? 'পরবর্তী ১,০০,০০০ টাকা' : 'Next Tk. 1,00,000', rate: '5%', amount: slabAmt, tax: taxAmt });
    }

    // Slab 2: Next Tk. 4,00,000 @ 10%
    if (taxable > 0) {
      const slabAmt = Math.min(taxable, 400000);
      const taxAmt = slabAmt * 0.10;
      totalTax += taxAmt;
      taxable -= slabAmt;
      slabs.push({ label: isBn ? 'পরবর্তী ৪,০০,০০০ টাকা' : 'Next Tk. 4,00,000', rate: '10%', amount: slabAmt, tax: taxAmt });
    }

    // Slab 3: Next Tk. 5,00,000 @ 15%
    if (taxable > 0) {
      const slabAmt = Math.min(taxable, 500000);
      const taxAmt = slabAmt * 0.15;
      totalTax += taxAmt;
      taxable -= slabAmt;
      slabs.push({ label: isBn ? 'পরবর্তী ৫,০০,০০০ টাকা' : 'Next Tk. 5,00,000', rate: '15%', amount: slabAmt, tax: taxAmt });
    }

    // Slab 4: Next Tk. 5,00,000 @ 20%
    if (taxable > 0) {
      const slabAmt = Math.min(taxable, 500000);
      const taxAmt = slabAmt * 0.20;
      totalTax += taxAmt;
      taxable -= slabAmt;
      slabs.push({ label: isBn ? 'পরবর্তী ৫,০০,০০০ টাকা' : 'Next Tk. 5,00,000', rate: '20%', amount: slabAmt, tax: taxAmt });
    }

    // Slab 5: Balance @ 25%
    if (taxable > 0) {
      const slabAmt = taxable;
      const taxAmt = slabAmt * 0.25;
      totalTax += taxAmt;
      slabs.push({ label: isBn ? 'অবশিষ্টাংশ' : 'Remaining Balance', rate: '25%', amount: slabAmt, tax: taxAmt });
    }

    return { totalTax: Math.round(totalTax), slabs };
  };

  const { totalTax: grossTaxLiability, slabs } = calculateGrossTax(totalIncome);

  // Minimum Tax
  const getMinimumTax = () => {
    if (totalIncome <= taxFreeThreshold) return 0;
    if (locationType === 'dhaka_ctg') return 5000;
    if (locationType === 'other_city') return 4000;
    return 3000;
  };
  const minTax = getMinimumTax();

  // Net Tax After Rebate
  const taxAfterRebate = Math.max(0, grossTaxLiability - allowableTaxRebate);
  // Apply minimum tax if gross tax was greater than zero
  const taxPayableWithMinTax = (grossTaxLiability > 0 && taxAfterRebate < minTax) ? minTax : taxAfterRebate;

  // Final Net Payable after TDS and Advance Tax
  const totalTaxCredits = financialTds + advanceTaxPaid + foreignTaxCredit;
  const netPayableOrRefund = taxPayableWithMinTax - totalTaxCredits;

  // Preset Handlers
  const loadArticlePreset = () => {
    setEmploymentGross(1000000);
    setEmploymentExempt(0);
    setRentGross(0);
    setAgricultureGross(0);
    setBusinessGross(500000);
    setBusinessExpense(0);
    setCapitalGainsGross(0);
    setFinancialGross(200000);
    setFinancialTds(20000);
    setOtherSourcesGross(0);
    setPartnershipGross(200000);
    setSpouseChildIncome(0);
    setForeignGross(0);
    setDpsInvestment(120000);
    setGovSecurities(250000);
    setLifeInsurance(50000);
  };

  const loadLandlordPreset = () => {
    setEmploymentGross(600000);
    setRentGross(1200000);
    setPropertyType('residential');
    setRentMunicipalTax(15000);
    setRentMortgageInterest(50000);
    setCustomRepairsDeduction(false);
    setBusinessGross(0);
    setFinancialGross(150000);
    setFinancialTds(15000);
    setPartnershipGross(0);
    setAgricultureGross(0);
    setDpsInvestment(120000);
    setGovSecurities(100000);
    setLifeInsurance(60000);
  };

  const resetAll = () => {
    setEmploymentGross(0);
    setEmploymentExempt(0);
    setRentGross(0);
    setRentMunicipalTax(0);
    setRentMortgageInterest(0);
    setAgricultureGross(0);
    setAgricultureExpense(0);
    setBusinessGross(0);
    setBusinessExpense(0);
    setCapitalGainsGross(0);
    setCapitalGainsCost(0);
    setFinancialGross(0);
    setFinancialTds(0);
    setOtherSourcesGross(0);
    setOtherSourcesExpense(0);
    setPartnershipGross(0);
    setSpouseChildIncome(0);
    setForeignGross(0);
    setForeignTaxCredit(0);
    setDpsInvestment(0);
    setLifeInsurance(0);
    setGovSecurities(0);
    setOtherEligibleInvestments(0);
    setAdvanceTaxPaid(0);
  };

  const toggleHead = (id: string) => {
    setExpandedHead(expandedHead === id ? null : id);
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm ${className}`}>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold tracking-wide uppercase border border-emerald-500/30 mb-3">
              <Calculator className="w-3.5 h-3.5" />
              {isBn ? 'এনবিআর আইটি-১১গ (২০২৩) ফ্রেমওয়ার্ক' : 'IT-11GA (2023) Framework'}
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {isBn ? 'মোট আয় ও কর রেয়াত ক্যালকুলেটর ২০২৬–২০২৭' : 'Total Income & Tax Rebate Calculator'}
            </h3>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              {isBn 
                ? 'আয়কর আইন ২০২৩-এর ১০টি খাতের মোট আয়, ধারা ৭৮ অনুযায়ী ৩% রেয়াত ভিত্তি এবং ৩-লিমিট কর রেয়াত তাৎক্ষণিক গণনা করুন।' 
                : 'Compute Total Income under all 10 statutory heads, reconcile Section 78 qualifying base, and calculate the 3-limit investment rebate.'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
              title="Print Summary"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">{isBn ? 'প্রিন্ট' : 'Print'}</span>
            </button>
            <button
              onClick={resetAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">{isBn ? 'রিসেট' : 'Reset'}</span>
            </button>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium mr-1">{isBn ? 'উদাহরণ লোড করুন:' : 'Load Scenarios:'}</span>
          <button
            onClick={loadArticlePreset}
            className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 rounded-md font-medium border border-emerald-500/30 transition flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            {isBn ? 'নিবন্ধের উদাহরণ (১৯ লাখ আয়)' : 'Article Example (19L Income)'}
          </button>
          <button
            onClick={loadLandlordPreset}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md font-medium border border-slate-700 transition"
          >
            {isBn ? 'বাড়িওয়ালা ও চাকুরিজীবী' : 'Landlord & Salaried'}
          </button>
        </div>
      </div>

      {/* Main Grid: Inputs Left (65%), Real-Time Summary Right (35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        
        {/* Left: Input Columns */}
        <div className="lg:col-span-7 p-6 sm:p-8 space-y-6">
          
          {/* Top Options: Taxpayer Category & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/70">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {isBn ? 'করদাতার শ্রেণি' : 'Taxpayer Category'}
              </label>
              <select
                value={taxpayerCategory}
                onChange={(e) => setTaxpayerCategory(e.target.value as any)}
                className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                <option value="general">{isBn ? 'সাধারণ পুরুষ করদাতা (করমুক্ত ৩.৫০ লাখ)' : 'General Taxpayer (Exempt 3.50L)'}</option>
                <option value="female_senior">{isBn ? 'মহিলা ও ৬৫+ জ্যেষ্ঠ নাগরিক (করমুক্ত ৪.০০ লাখ)' : 'Female & Senior 65+ (Exempt 4.00L)'}</option>
                <option value="disabled">{isBn ? 'প্রতিবন্ধী ব্যক্তি (করমুক্ত ৪.৭৫ লাখ)' : 'Physically Challenged (Exempt 4.75L)'}</option>
                <option value="freedom_fighter">{isBn ? 'গেজেটভুক্ত মুক্তিযোদ্ধা (করমুক্ত ৫.০০ লাখ)' : 'Gazetted Freedom Fighter (Exempt 5.00L)'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {isBn ? 'অবস্থান (ন্যূনতম কর)' : 'Jurisdiction (Min Tax)'}
              </label>
              <select
                value={locationType}
                onChange={(e) => setLocationType(e.target.value as any)}
                className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                <option value="dhaka_ctg">{isBn ? 'ঢাকা ও চট্টগ্রাম সিটি কর্পোরেশন (৫,০০০ টাকা)' : 'Dhaka & Chittagong City (Tk. 5,000)'}</option>
                <option value="other_city">{isBn ? 'অন্যান্য সিটি কর্পোরেশন (৪,০০০ টাকা)' : 'Other City Corporations (Tk. 4,000)'}</option>
                <option value="other_areas">{isBn ? 'অন্যান্য জেলা/পৌরসভা/উপজেলা (৩,০০০ টাকা)' : 'Other Areas / Municipalities (Tk. 3,000)'}</option>
              </select>
            </div>
          </div>

          {/* Section: 10 Heads of Income */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                {isBn ? 'আয়ের ১০টি খাত (আয়কর রিটার্ন আইটি-১১গ)' : '10 Heads of Income (IT-11GA)'}
              </h4>
              <span className="text-xs text-slate-500">
                {isBn ? 'আইনসম্মত কর্তন বাদ দিন' : 'Enter Receipts & Deductions'}
              </span>
            </div>

            <div className="space-y-3">
              
              {/* Head 1: Employment */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleHead('head1')}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50/70 hover:bg-slate-100/70 text-left transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        1. {isBn ? 'চাকরি হতে আয়' : 'Income from Employment'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {isBn ? 'মূল বেতন, বাড়ি ভাড়া, চিকিৎসা ও উৎসব ভাতা' : 'Salary, basic pay, allowances & bonus'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-900 font-mono">
                      ৳ {netEmployment.toLocaleString('en-IN')}
                    </span>
                    {expandedHead === 'head1' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>
                {expandedHead === 'head1' && (
                  <div className="p-4 bg-white border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        {isBn ? 'মোট প্রাপ্ত বেতন ও সুবিধাদি (গ্রস)' : 'Gross Salary & Receipts'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={employmentGross || ''}
                        onChange={(e) => setEmploymentGross(Number(e.target.value) || 0)}
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        {isBn ? 'অনুমোদিত কর অব্যাহতি (যদি থাকে)' : 'Allowable Exemptions'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={employmentExempt || ''}
                        onChange={(e) => setEmploymentExempt(Number(e.target.value) || 0)}
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900"
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Head 2: House Property */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleHead('head2')}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50/70 hover:bg-slate-100/70 text-left transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        2. {isBn ? 'ভাড়া হতে আয়' : 'Income from Rent'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {isBn ? 'বাড়ি/ফ্ল্যাট ভাড়া, বিধিবদ্ধ মেরামত ও কর কর্তন' : 'Gross rent less statutory maintenance & municipal tax'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-900 font-mono">
                      ৳ {netRent.toLocaleString('en-IN')}
                    </span>
                    {expandedHead === 'head2' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>
                {expandedHead === 'head2' && (
                  <div className="p-4 bg-white border-t border-slate-200 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          {isBn ? 'মোট ভাড়া প্রাপ্তি (গ্রস)' : 'Gross Rental Receipts'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={rentGross || ''}
                          onChange={(e) => setRentGross(Number(e.target.value) || 0)}
                          className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          {isBn ? 'সম্পত্তির ধরন' : 'Property Type'}
                        </label>
                        <select
                          value={propertyType}
                          onChange={(e) => setPropertyType(e.target.value as any)}
                          className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                        >
                          <option value="residential">{isBn ? 'আবাসিক (২৫% বিধিবদ্ধ মেরামত কর্তন)' : 'Residential (25% Statutory Repairs)'}</option>
                          <option value="commercial">{isBn ? 'বাণিজ্যিক (৩০% বিধিবদ্ধ মেরামত কর্তন)' : 'Commercial (30% Statutory Repairs)'}</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          {isBn ? 'পৌর কর / সিটি কর' : 'Municipal / City Rates'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={rentMunicipalTax || ''}
                          onChange={(e) => setRentMunicipalTax(Number(e.target.value) || 0)}
                          className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          {isBn ? 'গৃহঋণের সুদ (যদি থাকে)' : 'Mortgage / Loan Interest'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={rentMortgageInterest || ''}
                          onChange={(e) => setRentMortgageInterest(Number(e.target.value) || 0)}
                          className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 flex items-center justify-between">
                      <span>
                        {isBn 
                          ? `স্বয়ংক্রিয় মেরামত ছাড় (${propertyType === 'residential' ? '২৫%' : '৩০%'}): ৳ ${repairsDeduction.toLocaleString('en-IN')}` 
                          : `Statutory repair deduction (${propertyType === 'residential' ? '25%' : '30%'}): Tk. ${repairsDeduction.toLocaleString('en-IN')}`}
                      </span>
                      <span className="font-semibold text-slate-900 font-mono">
                        {isBn ? 'মোট অনুমোদনযোগ্য কর্তন: ' : 'Total Deductions: '}
                        ৳ {totalRentDeductions.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Head 3: Agriculture */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleHead('head3')}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50/70 hover:bg-slate-100/70 text-left transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                      <Sprout className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        3. {isBn ? 'কৃষি হতে আয়' : 'Income from Agriculture'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {isBn ? 'ফসল, মৎস্য, ডেইরি বা পোল্ট্রি হতে আয়' : 'Crops, farming, fisheries & dairy'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-900 font-mono">
                      ৳ {netAgriculture.toLocaleString('en-IN')}
                    </span>
                    {expandedHead === 'head3' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>
                {expandedHead === 'head3' && (
                  <div className="p-4 bg-white border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        {isBn ? 'মোট কৃষি প্রাপ্তি' : 'Gross Agricultural Receipts'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={agricultureGross || ''}
                        onChange={(e) => setAgricultureGross(Number(e.target.value) || 0)}
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        {isBn ? 'অনুমোদনযোগ্য উৎপাদন খরচ' : 'Allowable Production Expenses'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={agricultureExpense || ''}
                        onChange={(e) => setAgricultureExpense(Number(e.target.value) || 0)}
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono"
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Head 4: Business or Profession */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleHead('head4')}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50/70 hover:bg-slate-100/70 text-left transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        4. {isBn ? 'ব্যবসা বা পেশা হতে আয়' : 'Income from Business or Profession'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {isBn ? 'বাণিজ্যিক বিক্রয় ও পেশাগত ফি হতে অনুমোদনযোগ্য খরচ বাদ' : 'Trading, consultancy, services less expenses'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-900 font-mono">
                      ৳ {netBusiness.toLocaleString('en-IN')}
                    </span>
                    {expandedHead === 'head4' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>
                {expandedHead === 'head4' && (
                  <div className="p-4 bg-white border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        {isBn ? 'মোট ব্যবসা/পেশা প্রাপ্তি' : 'Gross Receipts / Revenue'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={businessGross || ''}
                        onChange={(e) => setBusinessGross(Number(e.target.value) || 0)}
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        {isBn ? 'অনুমোদনযোগ্য ব্যবসায়িক খরচ' : 'Allowable Business Expenses'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={businessExpense || ''}
                        onChange={(e) => setBusinessExpense(Number(e.target.value) || 0)}
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono"
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Head 5: Capital Gains */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleHead('head5')}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50/70 hover:bg-slate-100/70 text-left transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        5. {isBn ? 'মূলধনি আয় (ক্যাপিটাল গেইন)' : 'Capital Gains'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {isBn ? 'জমি, ফ্ল্যাট, শেয়ার বা লাইসেন্স বিক্রির মুনাফা' : 'Disposal of capital assets minus cost'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-900 font-mono">
                      ৳ {netCapitalGains.toLocaleString('en-IN')}
                    </span>
                    {expandedHead === 'head5' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>
                {expandedHead === 'head5' && (
                  <div className="p-4 bg-white border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        {isBn ? 'সম্পত্তি বিক্রয় বা হস্তান্তর মূল্য' : 'Transfer / Sale Proceeds'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={capitalGainsGross || ''}
                        onChange={(e) => setCapitalGainsGross(Number(e.target.value) || 0)}
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        {isBn ? 'ক্রয়মূল্য ও হস্তান্তর সংক্রান্ত অনুমোদিত ব্যয়' : 'Acquisition Cost & Expenses'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={capitalGainsCost || ''}
                        onChange={(e) => setCapitalGainsCost(Number(e.target.value) || 0)}
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono"
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Head 6: Financial Assets */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleHead('head6')}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50/70 hover:bg-slate-100/70 text-left transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                      <Coins className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        6. {isBn ? 'আর্থিক পরিসম্পদ হতে আয়' : 'Income from Financial Assets'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {isBn ? 'ব্যাংক সুদ, এফডিআর, সঞ্চয়পত্র মুনাফা, ডিভিডেন্ড' : 'Bank interest, deposits, sanchayapatra & dividends'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-900 font-mono">
                      ৳ {netFinancial.toLocaleString('en-IN')}
                    </span>
                    {expandedHead === 'head6' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>
                {expandedHead === 'head6' && (
                  <div className="p-4 bg-white border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        {isBn ? 'মোট অর্জিত সুদ ও মুনাফা (গ্রস)' : 'Gross Interest / Dividends'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={financialGross || ''}
                        onChange={(e) => setFinancialGross(Number(e.target.value) || 0)}
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        {isBn ? 'উৎসে কর কর্তন বা টিডিএস (TDS)' : 'Tax Deducted at Source (TDS)'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={financialTds || ''}
                        onChange={(e) => setFinancialTds(Number(e.target.value) || 0)}
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono"
                        placeholder="0"
                      />
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        {isBn ? 'এই কর সমন্বয় করা হবে।' : 'Credited against final payable tax.'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Head 7: Other Sources */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleHead('head7')}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50/70 hover:bg-slate-100/70 text-left transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        7. {isBn ? 'অন্যান্য উৎস হতে আয়' : 'Income from Other Sources'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {isBn ? 'রয়্যালটি, সম্মানী, লাইসেন্স ফি, সরকারি প্রণোদনা' : 'Royalties, fees, honorarium, subsidies'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-900 font-mono">
                      ৳ {netOtherSources.toLocaleString('en-IN')}
                    </span>
                    {expandedHead === 'head7' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>
                {expandedHead === 'head7' && (
                  <div className="p-4 bg-white border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        {isBn ? 'অন্যান্য প্রাপ্তি' : 'Receipts'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={otherSourcesGross || ''}
                        onChange={(e) => setOtherSourcesGross(Number(e.target.value) || 0)}
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        {isBn ? 'অনুমোদিত ব্যয়' : 'Allowable Expense'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={otherSourcesExpense || ''}
                        onChange={(e) => setOtherSourcesExpense(Number(e.target.value) || 0)}
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono"
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Head 8: Partnership Firm / AOP (Key Legal Focal Point) */}
              <div className="border-2 border-amber-300/80 bg-amber-50/20 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleHead('head8')}
                  className="w-full flex items-center justify-between p-3.5 bg-amber-50/60 hover:bg-amber-100/60 text-left transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500 text-white rounded-lg">
                      <Users2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-slate-900">
                          8. {isBn ? 'অংশীদারি ফার্ম / ব্যক্তিসংঘ হতে আয়' : 'Share of Partnership / AOP'}
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                          {isBn ? '৩% রেয়াত হতে বাদ' : 'Excluded from 3% Base'}
                        </span>
                      </div>
                      <div className="text-xs text-amber-800">
                        {isBn ? 'মোট আয়ে যোগ হলেও ধারা ৭৮-এর ৩% রেয়াত গণনায় আসবে না' : 'Included in Total Income, but excluded from 3% Section 78 base'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-amber-900 font-mono">
                      ৳ {netPartnership.toLocaleString('en-IN')}
                    </span>
                    {expandedHead === 'head8' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>
                {expandedHead === 'head8' && (
                  <div className="p-4 bg-white border-t border-amber-200">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      {isBn ? 'অংশীদারি ফার্ম বা AOP হতে করদাতার অংশের মুনাফা' : 'Taxpayer Share of Profit from Partnership/AOP'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={partnershipGross || ''}
                      onChange={(e) => setPartnershipGross(Number(e.target.value) || 0)}
                      className="w-full text-sm border border-amber-300 rounded-lg px-3 py-2 font-mono"
                      placeholder="0"
                    />
                    <p className="mt-2 text-xs text-amber-800 leading-relaxed bg-amber-50 p-2.5 rounded-lg border border-amber-200/60">
                      <strong>{isBn ? 'ধারা ৭৮ সতর্কতা:' : 'Section 78 Rule:'}</strong>{' '}
                      {isBn 
                        ? 'যেহেতু অংশীদারি ফার্ম পর্যায়ে আয়কর পরিশোধিত হয়, তাই করদাতার ব্যক্তিগত ৩% বিনিয়োগ রেয়াত গণনায় এই অংকটি ভিত্তি হিসেবে গণ্য হবে না।'
                        : 'Because tax is assessed at the firm level, this amount is part of reported Total Income, but explicitly excluded when determining the 3% investment rebate limit.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Head 9: Spouse / Minor Child */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleHead('head9')}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50/70 hover:bg-slate-100/70 text-left transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
                      <Users2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        9. {isBn ? 'স্বামী/স্ত্রী বা অপ্রাপ্তবয়স্ক সন্তানের আয়' : 'Spouse / Minor Child Income'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {isBn ? 'আইনগত শর্তসাপেক্ষে করদাতার আয়ে অন্তর্ভুক্তির ক্ষেত্রে' : 'Included only under statutory clubbing provisions'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-900 font-mono">
                      ৳ {netSpouseChild.toLocaleString('en-IN')}
                    </span>
                    {expandedHead === 'head9' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>
                {expandedHead === 'head9' && (
                  <div className="p-4 bg-white border-t border-slate-200">
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      {isBn ? 'অন্তর্ভুক্ত যোগ্য আয়' : 'Statutorily Included Income'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={spouseChildIncome || ''}
                      onChange={(e) => setSpouseChildIncome(Number(e.target.value) || 0)}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono"
                      placeholder="0"
                    />
                  </div>
                )}
              </div>

              {/* Head 10: Foreign Income */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleHead('head10')}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50/70 hover:bg-slate-100/70 text-left transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-100 text-teal-700 rounded-lg">
                      <Globe2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        10. {isBn ? 'বৈদেশিক করযোগ্য আয়' : 'Foreign Taxable Income'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {isBn ? 'বিদেশে উপার্জিত করযোগ্য বেতন, পরামর্শ ফি বা বিনিয়োগ আয়' : 'Worldwide taxable foreign income'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-900 font-mono">
                      ৳ {netForeign.toLocaleString('en-IN')}
                    </span>
                    {expandedHead === 'head10' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>
                {expandedHead === 'head10' && (
                  <div className="p-4 bg-white border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        {isBn ? 'বৈদেশিক আয় (বাংলাদেশি টাকায়)' : 'Foreign Income (BDT)'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={foreignGross || ''}
                        onChange={(e) => setForeignGross(Number(e.target.value) || 0)}
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        {isBn ? 'বিদেশে প্রদত্ত কর ক্রেডিট (FTC)' : 'Foreign Tax Credit (FTC)'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={foreignTaxCredit || ''}
                        onChange={(e) => setForeignTaxCredit(Number(e.target.value) || 0)}
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono"
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Section: Investments (for Section 78 Rebate) */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                {isBn ? 'অনুমোদিত বিনিয়োগ (কর রেয়াতের জন্য)' : 'Eligible Investments (Section 78)'}
              </h4>
              <span className="text-xs text-slate-500 font-mono">
                {isBn ? 'ডিপিএস সর্বোচ্চ সীমা ১.২০ লাখ' : 'DPS Max Limit: Tk. 1.20L'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 bg-emerald-50/40 rounded-xl border border-emerald-100">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {isBn ? 'ডিপিএস কিস্তি (DPS)' : 'DPS Installments (Max 1.2L)'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={dpsInvestment || ''}
                  onChange={(e) => setDpsInvestment(Number(e.target.value) || 0)}
                  className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {isBn ? 'জীবন বীমা প্রিমিয়াম' : 'Life Insurance Premium'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={lifeInsurance || ''}
                  onChange={(e) => setLifeInsurance(Number(e.target.value) || 0)}
                  className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {isBn ? 'সরকারি সিকিউরিটিজ / বন্ড / ট্রেজারি' : 'Govt Securities / Treasury Bonds'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={govSecurities || ''}
                  onChange={(e) => setGovSecurities(Number(e.target.value) || 0)}
                  className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {isBn ? 'অন্যান্য যোগ্য বিনিয়োগ ও দান' : 'Mutual Funds / Approved Donations'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={otherEligibleInvestments || ''}
                  onChange={(e) => setOtherEligibleInvestments(Number(e.target.value) || 0)}
                  className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Section: Advance Tax & Credits */}
          <div className="pt-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {isBn ? 'অগ্রিম কর (AIT) বা রিটার্নের সাথে প্রদেয় কর' : 'Advance Income Tax (AIT) / Other Paid Taxes'}
            </label>
            <input
              type="number"
              min="0"
              value={advanceTaxPaid || ''}
              onChange={(e) => setAdvanceTaxPaid(Number(e.target.value) || 0)}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono"
              placeholder="0"
            />
          </div>

        </div>

        {/* Right: Live Calculation & Summary Column */}
        <div className="lg:col-span-5 p-6 sm:p-8 bg-slate-50/50 space-y-6">

          {/* Core Total Income vs Rebate Base Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {isBn ? 'গণনাকৃত সমষ্টি' : 'Income Aggregate'}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                AY 2026–2027
              </span>
            </div>

            {/* 1. Total Income */}
            <div>
              <div className="text-xs text-slate-500 font-medium">
                {isBn ? 'মোট আয় (রিটার্নে প্রদর্শিত সর্বমোট আয়)' : 'Total Income (Aggregate Under All Heads)'}
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono mt-0.5">
                ৳ {totalIncome.toLocaleString('en-IN')}
              </div>
            </div>

            {/* 2. Qualifying Base for Section 78 */}
            <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/80">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-emerald-950">
                  {isBn ? 'ধারা ৭৮ অনুযায়ী ৩% রেয়াত ভিত্তি' : 'Section 78 Qualifying Income Base'}
                </div>
                <span className="text-xs font-mono font-bold text-emerald-800">
                  ৳ {qualifyingIncomeForRebate.toLocaleString('en-IN')}
                </span>
              </div>
              {netPartnership > 0 && (
                <div className="text-[11px] text-emerald-800 mt-1.5 flex items-start gap-1">
                  <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    {isBn 
                      ? `অংশীদারি ফার্মের আয় (৳ ${netPartnership.toLocaleString('en-IN')}) ৩% ভিত্তি থেকে স্বয়ংক্রিয়ভাবে বাদ দেওয়া হয়েছে।`
                      : `Partnership firm share (Tk. ${netPartnership.toLocaleString('en-IN')}) excluded from the 3% limit.`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Investment Rebate 3-Limit Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {isBn ? '৩-লিমিট রেয়াত হিসাব' : '3-Limit Rebate Formula'}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {isBn ? 'সর্বনিম্নটি গ্রহণযোগ্য' : 'Lowest of 3'}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {/* Limit 1 */}
              <div className={`p-2.5 rounded-lg flex items-center justify-between transition ${governingLimit === 'income' || governingLimit === 'both' ? 'bg-amber-100/70 border border-amber-300 font-semibold' : 'bg-slate-50 text-slate-600'}`}>
                <div>
                  <span className="font-bold text-slate-900">1. {isBn ? 'যোগ্য আয়ের ৩%' : '3% of Qualifying Income'}</span>
                  <div className="text-[10px] text-slate-500">3% × ৳ {qualifyingIncomeForRebate.toLocaleString('en-IN')}</div>
                </div>
                <span className="font-mono text-sm text-slate-900">
                  ৳ {limit1_3PercentIncome.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Limit 2 */}
              <div className={`p-2.5 rounded-lg flex items-center justify-between transition ${governingLimit === 'investment' || governingLimit === 'both' ? 'bg-amber-100/70 border border-amber-300 font-semibold' : 'bg-slate-50 text-slate-600'}`}>
                <div>
                  <span className="font-bold text-slate-900">2. {isBn ? 'বিনিয়োগের ১০%' : '10% of Eligible Investment'}</span>
                  <div className="text-[10px] text-slate-500">10% × ৳ {totalEligibleInvestment.toLocaleString('en-IN')}</div>
                </div>
                <span className="font-mono text-sm text-slate-900">
                  ৳ {limit2_10PercentInvestment.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Limit 3 */}
              <div className={`p-2.5 rounded-lg flex items-center justify-between transition ${governingLimit === 'cap' ? 'bg-amber-100/70 border border-amber-300 font-semibold' : 'bg-slate-50 text-slate-600'}`}>
                <div>
                  <span className="font-bold text-slate-900">3. {isBn ? 'সর্বোচ্চ আইনি সীমা' : 'Statutory Maximum Limit'}</span>
                  <div className="text-[10px] text-slate-500">Fixed AY 2026-27 ceiling</div>
                </div>
                <span className="font-mono text-sm text-slate-900">
                  ৳ {STATUTORY_MAX_REBATE.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Final Rebate Allowed */}
            <div className="p-3 bg-emerald-600 text-white rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <div className="text-xs uppercase tracking-wider font-semibold opacity-90">
                  {isBn ? 'অনুমোদনযোগ্য কর রেয়াত' : 'Allowable Tax Rebate'}
                </div>
                <div className="text-[11px] opacity-80">
                  {governingLimit === 'income' && (isBn ? '৩% আয়ের সীমা দ্বারা নিয়ন্ত্রিত' : 'Capped by 3% income limit')}
                  {governingLimit === 'investment' && (isBn ? '১০% বিনিয়োগের সীমা দ্বারা নিয়ন্ত্রিত' : 'Capped by 10% investment limit')}
                  {governingLimit === 'both' && (isBn ? 'উভয় সীমা সমান' : 'Income & investment limits equal')}
                  {governingLimit === 'cap' && (isBn ? 'সর্বোচ্চ ৭.৫০ লাখের সীমা' : 'Statutory Tk. 7.5L cap')}
                </div>
              </div>
              <div className="text-xl font-black font-mono">
                ৳ {allowableTaxRebate.toLocaleString('en-IN')}
              </div>
            </div>

            {/* Smart Investment Optimization Tip */}
            {governingLimit === 'investment' && limit1_3PercentIncome > limit2_10PercentInvestment && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  {isBn ? 'কর সাশ্রয়ের সুযোগ:' : 'Tax Saving Tip:'}
                </div>
                <p className="text-[11px] leading-relaxed">
                  {isBn 
                    ? `আপনার সম্পূর্ণ ৩% রেয়াত (৳ ${limit1_3PercentIncome.toLocaleString('en-IN')}) পেতে মোট ৳ ${optimalInvestmentNeeded.toLocaleString('en-IN')} বিনিয়োগ প্রয়োজন। আরো ৳ ${(optimalInvestmentNeeded - totalEligibleInvestment).toLocaleString('en-IN')} বিনিয়োগ করলে সম্পূর্ণ কর ছাড় পাবেন।`
                    : `To claim your full 3% rebate (Tk. ${limit1_3PercentIncome.toLocaleString('en-IN')}), invest Tk. ${optimalInvestmentNeeded.toLocaleString('en-IN')}. Investing an additional Tk. ${(optimalInvestmentNeeded - totalEligibleInvestment).toLocaleString('en-IN')} will maximize tax savings.`}
                </p>
              </div>
            )}
          </div>

          {/* Tax Slabs & Net Liability Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              {isBn ? 'চূড়ান্ত প্রদেয় কর নিরূপণ' : 'Final Tax Calculation'}
            </span>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">{isBn ? 'গ্রস কর দায় (স্ল্যাব অনুযায়ী)' : 'Gross Tax Liability (Slabs)'}</span>
                <span className="font-mono font-bold text-slate-900">৳ {grossTaxLiability.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-emerald-700 font-medium">{isBn ? '(–) বিনিয়োগ কর রেয়াত' : '(–) Investment Tax Rebate'}</span>
                <span className="font-mono font-bold text-emerald-700">– ৳ {allowableTaxRebate.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">{isBn ? 'রেয়াত পরবর্তী কর (ন্যূনতম কর প্রযোজ্য)' : 'Tax After Rebate (Min Tax check)'}</span>
                <span className="font-mono font-bold text-slate-900">৳ {taxPayableWithMinTax.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">{isBn ? '(–) উৎসে কর্তিত ও অগ্রিম কর' : '(–) TDS & Advance Tax Paid'}</span>
                <span className="font-mono font-medium text-slate-700">– ৳ {totalTaxCredits.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Net Result Box */}
            <div className={`p-4 rounded-xl text-center ${netPayableOrRefund > 0 ? 'bg-amber-500 text-white' : netPayableOrRefund < 0 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-white'}`}>
              <div className="text-xs uppercase tracking-wider font-semibold opacity-90">
                {netPayableOrRefund > 0 
                  ? (isBn ? 'রিটার্নের সাথে নিট প্রদেয় কর' : 'Net Tax Payable with Return') 
                  : netPayableOrRefund < 0 
                  ? (isBn ? 'প্রাপ্য কর রিফান্ড (Refund)' : 'Tax Refund Claimable') 
                  : (isBn ? 'কোনো অতিরিক্ত কর প্রদেয় নেই' : 'Nil Tax Liability')}
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono mt-1">
                ৳ {Math.abs(netPayableOrRefund).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
