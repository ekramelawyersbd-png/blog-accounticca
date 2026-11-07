import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calculator, 
  HelpCircle, 
  RefreshCw, 
  Printer, 
  CheckCircle2, 
  ShieldCheck, 
  Building, 
  Coins, 
  FileSpreadsheet, 
  Download,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BookOpen
} from 'lucide-react';
import { ToolAccessGuard } from '../components/auth/ToolAccessGuard';
import { useAuth } from '../context/AuthContext';
import { recordToolSigning } from '../services/toolSigningService';
import { Link } from 'react-router-dom';

export const TaxCalculator: React.FC = () => {
  const { user } = useAuth();

  // Log session
  useEffect(() => {
    if (user) {
      recordToolSigning('tax-calculator', 'Bangladesh Income Tax Calculator', 'Taxation', '/tax-calculator', user);
    }
  }, [user]);

  // Taxpayer Category
  const [taxpayerCategory, setTaxpayerCategory] = useState<'general' | 'female_senior' | 'disabled' | 'freedom_fighter'>('general');
  // Number of qualifying disabled children / dependents (+Tk. 50,000 each)
  const [disabledDependents, setDisabledDependents] = useState<number>(0);
  // Residential / Location Category for Minimum Tax
  const [locationCategory, setLocationCategory] = useState<'dhaka_ctg' | 'other_city' | 'non_city' | 'disabled_new'>('dhaka_ctg');

  // Income Breakdown State (in BDT)
  const [basicSalary, setBasicSalary] = useState<number>(720000); // 60k/mo
  const [houseRent, setHouseRent] = useState<number>(300000); // 25k/mo
  const [medicalAllowance, setMedicalAllowance] = useState<number>(60000); // 5k/mo
  const [conveyanceAllowance, setConveyanceAllowance] = useState<number>(36000); // 3k/mo
  const [festivalBonus, setFestivalBonus] = useState<number>(120000);
  const [businessIncome, setBusinessIncome] = useState<number>(0);
  const [rentalIncome, setRentalIncome] = useState<number>(0);
  const [otherIncome, setOtherIncome] = useState<number>(0);
  // Income excluded from Limit A baseline (Sec 163 final/minimum tax, reduced-rate income, partnership share)
  const [excludedRebateIncome, setExcludedRebateIncome] = useState<number>(0);

  // Investment for Tax Rebate (Section 78 & Part 3 of the 6th Schedule, Income Tax Act 2023)
  const [dpsInvestment, setDpsInvestment] = useState<number>(240000); // Capped at Tk. 1,20,000
  const [govtSecurities, setGovtSecurities] = useState<number>(800000); // Capped at Tk. 5,00,000
  const [lifeInsurance, setLifeInsurance] = useState<number>(0);
  const [lifeInsuranceSumAssured, setLifeInsuranceSumAssured] = useState<number>(500000); // 10% cap
  const [providentFund, setProvidentFund] = useState<number>(168000); // RPF (Employee + Employer) / GPF
  const [mutualFundsEtf, setMutualFundsEtf] = useState<number>(300000); // Approved Mutual Fund / ETF / Unit Cert
  const [listedStocks, setListedStocks] = useState<number>(0); // Listed Stocks & Securities
  const [upsZakatBenevolent, setUpsZakatBenevolent] = useState<number>(0); // Universal Pension, Zakat & Benevolent Fund

  // Initial Tax-Free Thresholds (0% Tax Rate) — AY 2026–2027
  const baseExemptionThreshold = useMemo(() => {
    switch (taxpayerCategory) {
      case 'female_senior':
        return 450000;
      case 'disabled':
        return 525000;
      case 'freedom_fighter':
        return 550000;
      case 'general':
      default:
        return 400000;
    }
  }, [taxpayerCategory]);

  const dependentAddition = Math.max(0, disabledDependents) * 50000;
  const exemptionThreshold = baseExemptionThreshold + dependentAddition;

  const categoryLabel = useMemo(() => {
    switch (taxpayerCategory) {
      case 'female_senior':
        return 'Female Taxpayers & Senior Citizens (Age 65+)';
      case 'disabled':
        return 'Third Gender & Disabled / Physically Challenged Taxpayers';
      case 'freedom_fighter':
        return 'Gazetted War-Wounded Freedom Fighters & July 2024 Injured Fighters';
      case 'general':
      default:
        return 'General Individual Taxpayers';
    }
  }, [taxpayerCategory]);

  // Minimum Tax Threshold based on Jurisdiction / Taxpayer Baseline
  const minimumTax = useMemo(() => {
    switch (locationCategory) {
      case 'other_city':
        return 4000;
      case 'non_city':
        return 3000;
      case 'disabled_new':
        return 1000;
      case 'dhaka_ctg':
      default:
        return 5000;
    }
  }, [locationCategory]);

  // Salary Exemptions under Income Tax Act 2023 (Sixth Schedule):
  // 1/3 of total salary income or Tk. 5,00,000, whichever is less, is exempt (করমুক্ত বেতন = মোট চাকরি থেকে আয়ের ১/৩ অংশ অথবা ৫,০০,০০০ টাকা, যেটি কম).
  const grossSalaryIncome = basicSalary + houseRent + medicalAllowance + conveyanceAllowance + festivalBonus;
  const allowableSalaryExemption = Math.min(grossSalaryIncome / 3, 500000);
  const taxableSalary = Math.max(0, grossSalaryIncome - allowableSalaryExemption);

  // Total Taxable Income
  const totalTaxableIncome = taxableSalary + businessIncome + rentalIncome + otherIncome;
  const eligibleTotalIncomeForRebate = Math.max(0, totalTaxableIncome - excludedRebateIncome);

  // Active dynamic tooltip states for tax slab entries across Result Summary, Explanation Accordion & At-A-Glance Table
  const [activeSummarySlabTooltip, setActiveSummarySlabTooltip] = useState<number | null>(null);
  const [activeExplanationSlabTooltip, setActiveExplanationSlabTooltip] = useState<number | null>(null);
  const [activeSlabTooltip, setActiveSlabTooltip] = useState<number | null>(null);
  // Expandable Mathematical Explanation Accordion state
  const [isExplanationOpen, setIsExplanationOpen] = useState<boolean>(false);

  // Progressive Tax Slabs Calculation (AY 2026–2027)
  // Slab 1: First Tk. 4,00,000 (or category threshold + dependent addition) -> 0%
  // Slab 2: Next Tk. 3,00,000 -> 10%
  // Slab 3: Next Tk. 4,00,000 -> 15%
  // Slab 4: Next Tk. 5,00,000 -> 20%
  // Slab 5: Next Tk. 20,00,000 -> 25%
  // Slab 6: Remaining balance -> 30%
  const slabCalculations = useMemo(() => {
    let remaining = totalTaxableIncome;
    const slabs = [];

    // 1. Initial Exempt Slab (0%)
    const slab1Amount = Math.min(remaining, exemptionThreshold);
    const slab1RemainingAfter = Math.max(0, remaining - slab1Amount);
    const slab1Utilization = exemptionThreshold > 0 ? Math.min(100, Math.round((slab1Amount / exemptionThreshold) * 100)) : 0;
    slabs.push({
      tierNumber: 1,
      tierOrder: '1st Slab (0% Tax-Free Base)',
      slabName: `Initial Tax-Free Threshold (First Tk. ${exemptionThreshold.toLocaleString()})`,
      shortName: `First Tk. ${exemptionThreshold.toLocaleString()}`,
      rate: '0%',
      rateDecimal: 0,
      bracketRange: `৳ 0 – ৳ ${exemptionThreshold.toLocaleString()}`,
      slabLimitLabel: `৳ ${exemptionThreshold.toLocaleString()}`,
      priorAbsorbed: 0,
      incomeEnteringTier: totalTaxableIncome,
      taxableAmount: slab1Amount,
      remainingAfterTier: slab1RemainingAfter,
      taxPayable: 0,
      utilizationPct: slab1Utilization,
      sliceMathExpression: `min(৳ ${Math.round(totalTaxableIncome).toLocaleString()}, ৳ ${exemptionThreshold.toLocaleString()}) = ৳ ${Math.round(slab1Amount).toLocaleString()}`,
      formula: `৳ ${Math.round(slab1Amount).toLocaleString()} × 0% = ৳ 0`,
      statusLabel: slab1Amount >= exemptionThreshold ? 'Full Threshold Utilized' : 'Within Tax-Free Threshold',
      rateCalculationContext: `Based on your selected category (${categoryLabel}), your statutory 0% base is ৳ ${baseExemptionThreshold.toLocaleString()}${dependentAddition > 0 ? ` plus ৳ ${dependentAddition.toLocaleString()} for ${disabledDependents} disabled child/dependant(s)` : ''}, giving a total 0% tax-free threshold of ৳ ${exemptionThreshold.toLocaleString()}.`,
      context: `Your total taxable income is ৳ ${totalTaxableIncome.toLocaleString()} (Taxable Salary ৳ ${Math.round(taxableSalary).toLocaleString()} + Other Income ৳ ${(businessIncome + rentalIncome + otherIncome).toLocaleString()}). Under ${categoryLabel}, the first ৳ ${exemptionThreshold.toLocaleString()} is taxed at 0% (= ৳ 0), leaving ৳ ${Math.round(slab1RemainingAfter).toLocaleString()} for progressive tiers.`
    });
    remaining = slab1RemainingAfter;

    let currentLowerBound = exemptionThreshold;

    const progressiveTiers = [
      {
        tierNumber: 2,
        name: 'Next Tk. 3,00,000',
        limit: 300000,
        rateLabel: '10%',
        rateDecimal: 0.10,
        tierOrder: '2nd Slab (10% Progressive Band)',
        statutoryBasis: 'First progressive band above the 0% tax-free threshold under Finance Act / ITA 2023 (AY 2026–2027).'
      },
      {
        tierNumber: 3,
        name: 'Next Tk. 4,00,000',
        limit: 400000,
        rateLabel: '15%',
        rateDecimal: 0.15,
        tierOrder: '3rd Slab (15% Progressive Band)',
        statutoryBasis: 'Second progressive band applying to income exceeding the initial threshold + Tk. 3,00,000.'
      },
      {
        tierNumber: 4,
        name: 'Next Tk. 5,00,000',
        limit: 500000,
        rateLabel: '20%',
        rateDecimal: 0.20,
        tierOrder: '4th Slab (20% Progressive Band)',
        statutoryBasis: 'Mid-tier progressive band applying after the first Tk. 7,00,000 above your 0% threshold is absorbed.'
      },
      {
        tierNumber: 5,
        name: 'Next Tk. 20,00,000',
        limit: 2000000,
        rateLabel: '25%',
        rateDecimal: 0.25,
        tierOrder: '5th Slab (25% Progressive Band)',
        statutoryBasis: 'Upper-middle progressive band covering the next Tk. 20,00,000 after prior slabs.'
      }
    ];

    for (const tier of progressiveTiers) {
      const priorAbsorbed = currentLowerBound;
      const tierLower = currentLowerBound + 1;
      const tierUpper = currentLowerBound + tier.limit;
      const incomeEnteringTier = remaining;
      const taxableInTier = Math.min(remaining, tier.limit);
      const remainingAfterTier = Math.max(0, remaining - taxableInTier);
      const taxForTier = taxableInTier * tier.rateDecimal;
      const utilizationPct = Math.min(100, Math.round((taxableInTier / tier.limit) * 100));

      slabs.push({
        tierNumber: tier.tierNumber,
        tierOrder: tier.tierOrder,
        slabName: tier.name,
        shortName: tier.name,
        rate: tier.rateLabel,
        rateDecimal: tier.rateDecimal,
        bracketRange: `৳ ${tierLower.toLocaleString()} – ৳ ${tierUpper.toLocaleString()}`,
        slabLimitLabel: `৳ ${tier.limit.toLocaleString()}`,
        priorAbsorbed,
        incomeEnteringTier,
        taxableAmount: taxableInTier,
        remainingAfterTier,
        taxPayable: taxForTier,
        utilizationPct,
        sliceMathExpression: `min(max(0, ৳ ${Math.round(totalTaxableIncome).toLocaleString()} − ৳ ${priorAbsorbed.toLocaleString()}), ৳ ${tier.limit.toLocaleString()}) = ৳ ${Math.round(taxableInTier).toLocaleString()}`,
        formula: `৳ ${Math.round(taxableInTier).toLocaleString()} × ${tier.rateLabel} = ৳ ${Math.round(taxForTier).toLocaleString()}`,
        statusLabel:
          taxableInTier === 0
            ? 'Income Below Bracket'
            : taxableInTier >= tier.limit
            ? 'Bracket Fully Filled'
            : 'Partially Filled (Marginal Bracket)',
        rateCalculationContext: `${tier.statutoryBasis} Because your 0% threshold is ৳ ${exemptionThreshold.toLocaleString()}, this ${tier.rateLabel} tier spans ৳ ${tierLower.toLocaleString()} to ৳ ${tierUpper.toLocaleString()} (max width ৳ ${tier.limit.toLocaleString()}).`,
        context:
          taxableInTier > 0
            ? `After allocating ৳ ${priorAbsorbed.toLocaleString()} to lower slabs, ৳ ${Math.round(incomeEnteringTier).toLocaleString()} of your income enters this tier. Up to ৳ ${tier.limit.toLocaleString()} (here ৳ ${Math.round(taxableInTier).toLocaleString()}) falls within ৳ ${tierLower.toLocaleString()} – ৳ ${tierUpper.toLocaleString()} and is taxed at ${tier.rateLabel} (${Math.round(taxableInTier).toLocaleString()} × ${tier.rateLabel} = ৳ ${Math.round(taxForTier).toLocaleString()}).`
            : `Your total taxable income (৳ ${totalTaxableIncome.toLocaleString()}) does not exceed the ৳ ${priorAbsorbed.toLocaleString()} cumulative threshold required to enter this ${tier.rateLabel} bracket (৳ ${tierLower.toLocaleString()} – ৳ ${tierUpper.toLocaleString()}), so ৳ 0 is taxed here.`
      });

      remaining = remainingAfterTier;
      currentLowerBound = tierUpper;
    }

    // 6. Remaining Balance @ 30%
    const slab6Amount = remaining;
    const slab6Lower = currentLowerBound;
    slabs.push({
      tierNumber: 6,
      tierOrder: '6th Slab (30% Top Marginal Band)',
      slabName: 'Remaining Balance',
      shortName: `Above Tk. ${slab6Lower.toLocaleString()}`,
      rate: '30%',
      rateDecimal: 0.30,
      bracketRange: `Above ৳ ${slab6Lower.toLocaleString()}`,
      slabLimitLabel: 'No Upper Cap',
      priorAbsorbed: slab6Lower,
      incomeEnteringTier: slab6Amount,
      taxableAmount: slab6Amount,
      remainingAfterTier: 0,
      taxPayable: slab6Amount * 0.30,
      utilizationPct: slab6Amount > 0 ? 100 : 0,
      sliceMathExpression: `max(0, ৳ ${Math.round(totalTaxableIncome).toLocaleString()} − ৳ ${slab6Lower.toLocaleString()}) = ৳ ${Math.round(slab6Amount).toLocaleString()}`,
      formula: `৳ ${Math.round(slab6Amount).toLocaleString()} × 30% = ৳ ${Math.round(slab6Amount * 0.30).toLocaleString()}`,
      statusLabel: slab6Amount > 0 ? 'Top Marginal Bracket Active' : 'Income Below Top Bracket',
      rateCalculationContext: `Highest statutory marginal tax rate (30%) for AY 2026–2027, applying to all taxable income exceeding ৳ ${slab6Lower.toLocaleString()} (your ৳ ${exemptionThreshold.toLocaleString()} tax-free base + ৳ 32,00,000 across Tiers 2–5).`,
      context:
        slab6Amount > 0
          ? `After allocating ৳ ${slab6Lower.toLocaleString()} across the first five slabs, your remaining balance of ৳ ${Math.round(slab6Amount).toLocaleString()} exceeds ৳ ${slab6Lower.toLocaleString()} and is taxed at the highest progressive rate of 30% (${Math.round(slab6Amount).toLocaleString()} × 30% = ৳ ${Math.round(slab6Amount * 0.30).toLocaleString()}).`
          : `Your total taxable income (৳ ${totalTaxableIncome.toLocaleString()}) does not exceed ৳ ${slab6Lower.toLocaleString()}, so no income reaches the 30% top marginal bracket (৳ 0 taxed here).`
    });

    return slabs;
  }, [totalTaxableIncome, exemptionThreshold, categoryLabel, baseExemptionThreshold, dependentAddition, disabledDependents, taxableSalary, businessIncome, rentalIncome, otherIncome]);

  const grossTaxPayable = slabCalculations.reduce((sum, s) => sum + s.taxPayable, 0);

  // Total Allowable Investment (অনুমোদনযোগ্য বিনিয়োগ) — Part 3 of the 6th Schedule:
  // Total Allowable Investment = Sum of min(Actual Sector Investment, Statutory Sector Limit)
  const allowableDps = Math.min(dpsInvestment, 120000);
  const allowableGovtSecurities = Math.min(govtSecurities, 500000);
  const lifeInsuranceCap = lifeInsuranceSumAssured > 0 ? lifeInsuranceSumAssured * 0.10 : lifeInsurance;
  const allowableLifeInsurance = Math.min(lifeInsurance, lifeInsuranceCap);
  const allowableProvidentFund = providentFund; // Full RPF (Employee + Employer) / GPF
  const allowableMutualFunds = mutualFundsEtf; // Full eligible new investment
  const allowableListedStocks = listedStocks; // Full eligible listed stocks
  const allowableUpsZakat = upsZakatBenevolent; // Full UPS, Zakat Fund & Benevolent Funds

  const actualTotalInvestment =
    dpsInvestment +
    govtSecurities +
    lifeInsurance +
    providentFund +
    mutualFundsEtf +
    listedStocks +
    upsZakatBenevolent;

  const totalAllowableInvestment =
    allowableDps +
    allowableGovtSecurities +
    allowableLifeInsurance +
    allowableProvidentFund +
    allowableMutualFunds +
    allowableListedStocks +
    allowableUpsZakat;

  // The Three Comparison Limits for Investment Tax Rebate (Section 78):
  // Limit A — 3% of Eligible Total Income
  const limitA = eligibleTotalIncomeForRebate * 0.03;
  // Limit B — 10% of Total Allowable Investment
  const limitB = totalAllowableInvestment * 0.10;
  // Limit C — Maximum Statutory Cap (Tk. 7,50,000)
  const limitC = 750000;

  const taxRebate = Math.min(limitA, limitB, limitC);

  // Net Tax Calculation & Minimum Tax Floor
  const netTaxBeforeMinimum = Math.max(0, grossTaxPayable - taxRebate);
  let finalTaxPayable = 0;

  if (totalTaxableIncome > exemptionThreshold) {
    finalTaxPayable = Math.max(netTaxBeforeMinimum, minimumTax);
  } else {
    finalTaxPayable = 0;
  }

  const effectiveTaxRate = totalTaxableIncome > 0 ? ((finalTaxPayable / totalTaxableIncome) * 100).toFixed(2) : '0.00';
  // Monthly Salary TDS under Section 86 of Income Tax Act, 2023 (বার্ষিক নিট আয়কর ÷ ১২)
  const monthlySalaryTds = finalTaxPayable / 12;

  const loadPracticalExample = () => {
    setDpsInvestment(240000);
    setGovtSecurities(800000);
    setProvidentFund(168000);
    setMutualFundsEtf(300000);
    setLifeInsurance(0);
    setListedStocks(0);
    setUpsZakatBenevolent(0);
  };

  const loadSalaryTdsExample = (mode: 'no_rebate' | 'with_rebate' | 'with_bonus') => {
    setTaxpayerCategory('general');
    setDisabledDependents(0);
    setLocationCategory('dhaka_ctg');
    // Monthly gross salary = Tk. 1,00,000 -> Annual = Tk. 12,00,000
    setBasicSalary(720000);
    setHouseRent(360000);
    setMedicalAllowance(84000);
    setConveyanceAllowance(36000);
    setFestivalBonus(mode === 'with_bonus' ? 100000 : 0);
    setBusinessIncome(0);
    setRentalIncome(0);
    setOtherIncome(0);
    setExcludedRebateIncome(0);
    setDpsInvestment(0);
    setGovtSecurities(0);
    setProvidentFund(mode === 'with_rebate' ? 200000 : 0);
    setMutualFundsEtf(0);
    setLifeInsurance(0);
    setListedStocks(0);
    setUpsZakatBenevolent(0);
  };

  const resetDefaults = () => {
    setTaxpayerCategory('general');
    setDisabledDependents(0);
    setLocationCategory('dhaka_ctg');
    setBasicSalary(720000);
    setHouseRent(300000);
    setMedicalAllowance(60000);
    setConveyanceAllowance(36000);
    setFestivalBonus(120000);
    setBusinessIncome(0);
    setRentalIncome(0);
    setOtherIncome(0);
    setExcludedRebateIncome(0);
    setDpsInvestment(240000);
    setGovtSecurities(800000);
    setProvidentFund(168000);
    setMutualFundsEtf(300000);
    setLifeInsurance(0);
    setLifeInsuranceSumAssured(500000);
    setListedStocks(0);
    setUpsZakatBenevolent(0);
  };

  return (
    <ToolAccessGuard
      toolId="tax-calculator"
      toolName="Individual Income Tax Calculator (AY 2026-27)"
      toolCategory="Taxation & Compliance"
      toolPath="/tax-calculator"
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-6 space-y-6">
        {/* Title and Statutory Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 mb-2">
              <Calculator className="w-3.5 h-3.5 text-blue-600" />
              Income Tax Act 2023 · Part 3, 6th Schedule · AY 2026–2027
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Bangladesh Individual Income Tax &amp; Rebate Calculator
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Updated Initial Tax-Free Thresholds (Tk. 4,00,000+), 3-Limit Rebate Comparison (3% Income / 10% Allowable Investment / Tk. 7,50,000 Cap) &amp; Sector Capping Rules.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => loadSalaryTdsExample('no_rebate')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl text-xs font-bold text-blue-900 transition-all cursor-pointer"
              title="মাসিক বেতন ১,০০,০০০ টাকা (রেয়াত ছাড়া) — মাসিক TDS ৩,৭৫০ টাকা"
            >
              <span>TDS Ex 1 (৳3,750/mo)</span>
            </button>
            <button
              onClick={() => loadSalaryTdsExample('with_rebate')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-xl text-xs font-bold text-indigo-900 transition-all cursor-pointer"
              title="মাসিক বেতন ১,০০,০০০ টাকা + ২,০০,০০০ টাকা বিনিয়োগ রেয়াত — মাসিক TDS ২,০৮৩.৩৩ টাকা"
            >
              <span>TDS Ex 2 (৳2,083/mo)</span>
            </button>
            <button
              onClick={() => loadSalaryTdsExample('with_bonus')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-50 border border-purple-200 hover:bg-purple-100 rounded-xl text-xs font-bold text-purple-900 transition-all cursor-pointer"
              title="মাসিক বেতন ১,০০,০০০ টাকা + ২টি উৎসব বোনাস — মাসিক TDS ৪,৫৮৩.৩৩ টাকা"
            >
              <span>TDS + Bonus (৳4,583/mo)</span>
            </button>
            <button
              onClick={loadPracticalExample}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-xs font-bold text-emerald-900 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Tk. 10.88L Inv.</span>
            </button>
            <button
              onClick={resetDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Input Parameters & Results Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Taxpayer Demographics, Earnings & Sector Investments */}
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              1. Initial Tax-Free Thresholds (0% Tax Rate)
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Taxpayer Category (0% Initial Threshold)
              </label>
              <select
                value={taxpayerCategory}
                onChange={e => setTaxpayerCategory(e.target.value as any)}
                aria-label="Taxpayer Category"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="general">General Individual Taxpayers — First Tk. 4,00,000</option>
                <option value="female_senior">Female Taxpayers &amp; Senior Citizens (Age 65+) — First Tk. 4,50,000</option>
                <option value="disabled">Third Gender &amp; Disabled / Physically Challenged — First Tk. 5,25,000</option>
                <option value="freedom_fighter">Gazetted War-Wounded Freedom Fighters &amp; July 2024 Injured Fighters — First Tk. 5,50,000</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1">
                <span>Disabled Child / Dependant (+Tk. 50,000 each)</span>
                <span className="font-mono text-emerald-700">+৳ {dependentAddition.toLocaleString()}</span>
              </div>
              <input
                type="number"
                min={0}
                max={10}
                value={disabledDependents}
                onChange={e => setDisabledDependents(Math.max(0, Number(e.target.value) || 0))}
                aria-label="Number of Disabled Children or Dependants"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-black font-semibold"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Note: For parents or legal guardians of a disabled child/dependant, the tax-free limit is increased by Tk. 50,000 for each child.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Minimum Tax Floor (Jurisdiction / Baseline)
              </label>
              <select
                value={locationCategory}
                onChange={e => setLocationCategory(e.target.value as any)}
                aria-label="Residential Location"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="dhaka_ctg">Dhaka &amp; Chattogram City Corp (Min Tk. 5,000)</option>
                <option value="other_city">Other City Corporations (Min Tk. 4,000)</option>
                <option value="non_city">Other Areas / Municipalities (Min Tk. 3,000)</option>
                <option value="disabled_new">Disabled / New Taxpayers Baseline (Min Tk. 1,000)</option>
              </select>
            </div>

            {/* Income Streams Quick Input */}
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2 pt-2">
              <Coins className="w-4 h-4 text-emerald-600" />
              2. Annual Salary &amp; Other Earnings
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>Basic Salary (Annual)</span>
                  <span className="font-mono font-bold text-black">৳ {basicSalary.toLocaleString()}</span>
                </div>
                <input
                  type="number"
                  value={basicSalary || ''}
                  onChange={e => setBasicSalary(Number(e.target.value) || 0)}
                  aria-label="Basic Salary Annual"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-black font-semibold"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>House Rent Allowance</span>
                  <span className="font-mono font-bold text-black">৳ {houseRent.toLocaleString()}</span>
                </div>
                <input
                  type="number"
                  value={houseRent || ''}
                  onChange={e => setHouseRent(Number(e.target.value) || 0)}
                  aria-label="House Rent Allowance"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-black font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[11px] text-slate-600">Medical Allowance</span>
                  <input
                    type="number"
                    value={medicalAllowance || ''}
                    onChange={e => setMedicalAllowance(Number(e.target.value) || 0)}
                    aria-label="Medical Allowance"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-black font-semibold mt-1"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-600">Festival Bonus</span>
                  <input
                    type="number"
                    value={festivalBonus || ''}
                    onChange={e => setFestivalBonus(Number(e.target.value) || 0)}
                    aria-label="Festival Bonus"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-black font-semibold mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[11px] text-slate-600">Business / Prof. Income</span>
                  <input
                    type="number"
                    value={businessIncome || ''}
                    onChange={e => setBusinessIncome(Number(e.target.value) || 0)}
                    aria-label="Business Professional Income"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-black font-semibold mt-1"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-600">Rental Property Income</span>
                  <input
                    type="number"
                    value={rentalIncome || ''}
                    onChange={e => setRentalIncome(Number(e.target.value) || 0)}
                    aria-label="Rental Property Income"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-black font-semibold mt-1"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>Excluded Income (Sec 163 / Final Tax / Partnership)</span>
                  <span className="font-mono font-bold text-black">৳ {excludedRebateIncome.toLocaleString()}</span>
                </div>
                <input
                  type="number"
                  value={excludedRebateIncome || ''}
                  onChange={e => setExcludedRebateIncome(Number(e.target.value) || 0)}
                  aria-label="Excluded Income for Limit A"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-black font-semibold"
                />
              </div>
            </div>

            {/* Tax Rebate Investments — Part 3 of the 6th Schedule */}
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2 pt-2">
              <Building className="w-4 h-4 text-purple-600" />
              3. Allowable Investment Sectors (6th Schedule)
            </h3>

            <div className="space-y-2.5 text-xs">
              <div>
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>DPS Contribution (Cap: Tk. 1,20,000/yr)</span>
                  <span className="font-mono font-bold text-emerald-800">Allowable: ৳ {allowableDps.toLocaleString()}</span>
                </div>
                <input
                  type="number"
                  value={dpsInvestment || ''}
                  onChange={e => setDpsInvestment(Number(e.target.value) || 0)}
                  aria-label="DPS Investment"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-black font-semibold mt-1"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>Sanchayapatra / Govt Securities (Cap: Tk. 5,00,000)</span>
                  <span className="font-mono font-bold text-emerald-800">Allowable: ৳ {allowableGovtSecurities.toLocaleString()}</span>
                </div>
                <input
                  type="number"
                  value={govtSecurities || ''}
                  onChange={e => setGovtSecurities(Number(e.target.value) || 0)}
                  aria-label="Government Securities"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-black font-semibold mt-1"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>Recognized Provident Fund (RPF) / GPF (Full)</span>
                  <span className="font-mono font-bold text-emerald-800">Allowable: ৳ {allowableProvidentFund.toLocaleString()}</span>
                </div>
                <input
                  type="number"
                  value={providentFund || ''}
                  onChange={e => setProvidentFund(Number(e.target.value) || 0)}
                  aria-label="Provident Fund"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-black font-semibold mt-1"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>Mutual Funds, ETFs &amp; Unit Certificates (Full)</span>
                  <span className="font-mono font-bold text-emerald-800">Allowable: ৳ {allowableMutualFunds.toLocaleString()}</span>
                </div>
                <input
                  type="number"
                  value={mutualFundsEtf || ''}
                  onChange={e => setMutualFundsEtf(Number(e.target.value) || 0)}
                  aria-label="Mutual Funds ETFs"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-black font-semibold mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[11px] text-slate-600">Life Ins. Premium</span>
                  <input
                    type="number"
                    value={lifeInsurance || ''}
                    onChange={e => setLifeInsurance(Number(e.target.value) || 0)}
                    aria-label="Life Insurance Premium"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-black font-semibold mt-1"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-600">Sum Assured (10% Cap)</span>
                  <input
                    type="number"
                    value={lifeInsuranceSumAssured || ''}
                    onChange={e => setLifeInsuranceSumAssured(Number(e.target.value) || 0)}
                    aria-label="Life Insurance Sum Assured"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-black font-semibold mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[11px] text-slate-600">Listed Stocks &amp; Shares</span>
                  <input
                    type="number"
                    value={listedStocks || ''}
                    onChange={e => setListedStocks(Number(e.target.value) || 0)}
                    aria-label="Listed Stocks"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-black font-semibold mt-1"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-600">UPS / Zakat / Benevolent</span>
                  <input
                    type="number"
                    value={upsZakatBenevolent || ''}
                    onChange={e => setUpsZakatBenevolent(Number(e.target.value) || 0)}
                    aria-label="Universal Pension and Zakat"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-black font-semibold mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Result Summary & All Information At A Glance Table */}
          <div className="lg:col-span-8 space-y-6">
            {/* Result Summary Card with Interactive Tax Slab Tooltips & Expandable 'Explanation' Accordion */}
            <div className="bg-linear-to-r from-blue-900 to-indigo-950 rounded-2xl text-white shadow-md overflow-visible border border-blue-800/80">
              <div className="p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-cyan-300" />
                    <h3 className="text-sm sm:text-base font-black tracking-tight text-white">
                      Result Summary · Assessment Year 2026–2027
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-800/90 text-cyan-200 border border-blue-700">
                      0% Threshold: ৳ {exemptionThreshold.toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsExplanationOpen(prev => !prev)}
                      aria-expanded={isExplanationOpen}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-xs transition-all cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Explanation</span>
                      {isExplanationOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* 4 Key Summary Figures */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-blue-950/50 p-3 rounded-xl border border-blue-800/60">
                    <div className="text-xs text-blue-200 uppercase tracking-wider font-semibold">Taxable Income</div>
                    <div className="text-xl sm:text-2xl font-black mt-1">৳ {totalTaxableIncome.toLocaleString()}</div>
                    <div className="text-[11px] text-blue-300">0% Limit: ৳ {exemptionThreshold.toLocaleString()}</div>
                  </div>
                  <div className="bg-blue-950/50 p-3 rounded-xl border border-blue-800/60">
                    <div className="text-xs text-blue-200 uppercase tracking-wider font-semibold">Allowable Investment</div>
                    <div className="text-xl sm:text-2xl font-black mt-1 text-cyan-300">৳ {totalAllowableInvestment.toLocaleString()}</div>
                    <div className="text-[11px] text-blue-300">Actual: ৳ {actualTotalInvestment.toLocaleString()}</div>
                  </div>
                  <div className="bg-blue-950/50 p-3 rounded-xl border border-blue-800/60">
                    <div className="text-xs text-blue-200 uppercase tracking-wider font-semibold">Tax Rebate</div>
                    <div className="text-xl sm:text-2xl font-black mt-1 text-emerald-300">৳ {Math.round(taxRebate).toLocaleString()}</div>
                    <div className="text-[11px] text-blue-200">Min of Limits A, B, C</div>
                  </div>
                  <div className="bg-blue-950/50 p-3 rounded-xl border border-amber-400/40">
                    <div className="text-xs text-amber-200 uppercase tracking-wider font-semibold">Net Tax Payable</div>
                    <div className="text-xl sm:text-2xl font-black mt-1 text-amber-300">৳ {Math.round(finalTaxPayable).toLocaleString()}</div>
                    <div className="text-[11px] text-blue-200">Effective: {effectiveTaxRate}% · ৳ {Math.round(monthlySalaryTds).toLocaleString()}/mo</div>
                  </div>
                </div>

                {/* Result Summary Tax Slab Entries with Dynamic Hoverable Tooltips */}
                <div className="p-3.5 rounded-xl bg-blue-950/60 border border-blue-800/70 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                      <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-200">
                        Progressive Tax Slab Entries (Hover any tier for dynamic rate &amp; input derivation)
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-blue-200">
                      Gross Slab Tax: <strong className="text-amber-300">৳ {Math.round(grossTaxPayable).toLocaleString()}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {slabCalculations.map((slab, idx) => {
                      const isSummaryTooltipOpen = activeSummarySlabTooltip === idx;
                      const shareOfGrossPct =
                        grossTaxPayable > 0 ? ((slab.taxPayable / grossTaxPayable) * 100).toFixed(1) : '0.0';
                      const isActiveTier = slab.taxableAmount > 0;

                      return (
                        <div
                          key={idx}
                          tabIndex={0}
                          onMouseEnter={() => setActiveSummarySlabTooltip(idx)}
                          onMouseLeave={() => setActiveSummarySlabTooltip(prev => (prev === idx ? null : prev))}
                          onFocus={() => setActiveSummarySlabTooltip(idx)}
                          onBlur={() => setActiveSummarySlabTooltip(prev => (prev === idx ? null : prev))}
                          onClick={() => setActiveSummarySlabTooltip(prev => (prev === idx ? null : idx))}
                          aria-label={`${slab.tierOrder}: ${slab.slabName} at ${slab.rate} tax rate. Hover or click for calculation breakdown based on your input.`}
                          aria-describedby={isSummaryTooltipOpen ? `summary-slab-tooltip-${idx}` : undefined}
                          className={`relative p-2.5 rounded-xl border transition-all cursor-pointer select-none outline-none focus:ring-2 focus:ring-cyan-400 ${
                            isActiveTier
                              ? 'bg-slate-900/90 border-cyan-500/40 hover:border-cyan-300 shadow-xs'
                              : 'bg-slate-950/50 border-blue-900/60 hover:border-blue-600 opacity-85 hover:opacity-100'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-300">
                              Tier {slab.tierNumber} · {slab.shortName}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[10px] font-black border ${
                                isActiveTier
                                  ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              {slab.rate}
                              <HelpCircle className="w-2.5 h-2.5 text-cyan-300" />
                            </span>
                          </div>

                          <div className="mt-1 text-[10px] font-mono text-slate-400 truncate">
                            Bracket: {slab.bracketRange}
                          </div>

                          <div className="mt-1.5 pt-1.5 border-t border-slate-800/90 flex items-center justify-between text-[11px] font-mono">
                            <span className="text-slate-300">
                              Taxable: <strong className="text-white">৳{Math.round(slab.taxableAmount).toLocaleString()}</strong>
                            </span>
                            <span className={slab.taxPayable > 0 ? 'text-amber-300 font-black' : 'text-emerald-300 font-bold'}>
                              Tax: ৳{Math.round(slab.taxPayable).toLocaleString()}
                            </span>
                          </div>

                          {/* Dynamic Hoverable Tooltip for Result Summary Slab Entry */}
                          {isSummaryTooltipOpen && (
                            <div
                              id={`summary-slab-tooltip-${idx}`}
                              role="tooltip"
                              className={`z-40 top-full mt-2 w-76 sm:w-92 p-3.5 rounded-xl bg-slate-950 text-white shadow-2xl border border-cyan-500/50 text-left absolute space-y-2.5 ${
                                (idx + 1) % 3 === 0 ? 'right-0' : 'left-0'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
                                <div>
                                  <div className="text-[10px] uppercase tracking-wider font-extrabold text-cyan-300">
                                    {slab.tierOrder} · {slab.statusLabel}
                                  </div>
                                  <div className="text-xs font-black text-white mt-0.5">
                                    {slab.slabName} ({slab.bracketRange})
                                  </div>
                                </div>
                                <span className="px-2 py-0.5 rounded bg-amber-400/20 border border-amber-400/50 text-amber-300 font-mono text-xs font-black shrink-0">
                                  {slab.rate} Rate
                                </span>
                              </div>

                              {/* Contextual Rate Rule Based on User Input */}
                              <div className="p-2 rounded-lg bg-blue-950/70 border border-blue-800/80 text-[11px] text-blue-100 leading-relaxed">
                                <span className="font-bold text-cyan-300 block mb-0.5">
                                  Why {slab.rate} Applies to Your Input:
                                </span>
                                {slab.rateCalculationContext}
                              </div>

                              {/* Live Mathematical Derivation from User Inputs */}
                              <div className="space-y-1 text-[11px] bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono">
                                <div className="flex justify-between text-slate-300">
                                  <span>Your Total Taxable Income:</span>
                                  <span className="text-white font-bold">৳ {Math.round(totalTaxableIncome).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-slate-300">
                                  <span>Less Prior Slabs Absorbed:</span>
                                  <span className="text-slate-200">− ৳ {slab.priorAbsorbed.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-slate-300">
                                  <span>Income Entering Tier #{slab.tierNumber}:</span>
                                  <span className="text-cyan-200 font-bold">৳ {Math.round(slab.incomeEnteringTier).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-slate-300">
                                  <span>Tier Capacity Limit:</span>
                                  <span className="text-slate-200">{slab.slabLimitLabel}</span>
                                </div>
                                <div className="pt-1 border-t border-slate-800 text-[10px] text-cyan-300">
                                  Slice = {slab.sliceMathExpression}
                                </div>
                                <div className="flex justify-between text-amber-300 font-bold pt-1 border-t border-slate-800">
                                  <span>Tier Tax ({slab.rate}):</span>
                                  <span>{slab.formula}</span>
                                </div>
                                <div className="flex justify-between text-slate-400 text-[10px] pt-0.5">
                                  <span>Remaining for Higher Tiers:</span>
                                  <span>৳ {Math.round(slab.remainingAfterTier).toLocaleString()}</span>
                                </div>
                              </div>

                              {/* Bracket Utilization & Share of Gross Tax */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-slate-300 font-medium">
                                  <span>Bracket Utilization: <strong className="text-emerald-300 font-mono">{slab.utilizationPct}%</strong></span>
                                  <span>Share of Gross Tax: <strong className="text-amber-300 font-mono">{shareOfGrossPct}%</strong></span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                                    style={{ width: `${slab.utilizationPct}%` }}
                                  />
                                </div>
                              </div>

                              <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
                                {slab.context}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Result Summary 'Explanation' Accordion Trigger Bar */}
                <div className="rounded-xl border border-blue-700/80 bg-slate-950/70 overflow-visible">
                  <button
                    type="button"
                    onClick={() => setIsExplanationOpen(prev => !prev)}
                    aria-expanded={isExplanationOpen}
                    className="w-full px-4 py-2.5 flex items-center justify-between gap-3 text-left hover:bg-slate-900/80 transition-colors cursor-pointer rounded-xl"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-amber-300 shrink-0" />
                      <span className="text-xs sm:text-sm font-extrabold text-white">
                        Explanation — Detailed Mathematical Breakdown (AY 2026–2027 Thresholds, Tier % &amp; Total Derivation)
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 shrink-0">
                      <span>{isExplanationOpen ? 'Collapse' : 'Expand Math'}</span>
                      {isExplanationOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>

                  {isExplanationOpen && (
                    <div className="p-4 border-t border-blue-800/80 bg-slate-950 text-slate-100 space-y-4 text-xs rounded-b-xl">
                      {/* Section A: AY 2026–2027 Thresholds & Taxable Income Formula */}
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-black uppercase tracking-wider text-cyan-300">
                            1. Assessment Year 2026–2027 Tax-Free Thresholds &amp; Taxable Income
                          </span>
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-200 border border-cyan-500/30">
                            Active 0% Threshold: ৳ {exemptionThreshold.toLocaleString()} ({categoryLabel})
                          </span>
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                          For <strong className="text-white">AY 2026–2027</strong>, the statutory initial <strong className="text-white">0% tax-free threshold</strong> is <strong className="text-amber-300">Tk. 4,00,000</strong> for General Taxpayers (<strong className="text-white">Tk. 4,50,000</strong> for Female &amp; Senior Citizens 65+, <strong className="text-white">Tk. 5,25,000</strong> for Third Gender &amp; Disabled Taxpayers, and <strong className="text-white">Tk. 5,50,000</strong> for Gazetted War-Wounded Freedom Fighters &amp; July 2024 Injured Fighters), plus <strong className="text-white">Tk. 50,000</strong> per disabled child/dependant.
                        </p>
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-1 text-slate-200">
                          <div>
                            • Gross Salary = ৳ {grossSalaryIncome.toLocaleString()} | 6th Schedule Exemption = min(1/3 × ৳ {grossSalaryIncome.toLocaleString()}, ৳ 5,00,000) = <span className="text-emerald-300 font-bold">৳ {Math.round(allowableSalaryExemption).toLocaleString()}</span>
                          </div>
                          <div>
                            • Total Taxable Income = Taxable Salary (৳ {Math.round(taxableSalary).toLocaleString()}) + Other Income (৳ {(businessIncome + rentalIncome + otherIncome).toLocaleString()}) = <span className="text-amber-300 font-bold">৳ {Math.round(totalTaxableIncome).toLocaleString()}</span>
                          </div>
                          <div>
                            • Applicable 0% Threshold = Base (৳ {baseExemptionThreshold.toLocaleString()}){dependentAddition > 0 ? ` + Disabled Dependants (${disabledDependents} × ৳ 50,000 = ৳ ${dependentAddition.toLocaleString()})` : ''} = <span className="text-cyan-300 font-bold">৳ {exemptionThreshold.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Section B: Progressive Tier Percentages & Mathematical Slicing */}
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-black uppercase tracking-wider text-amber-300">
                            2. Progressive Tier Percentages (0%, 10%, 15%, 20%, 25%, 30%) &amp; Slab Derivation (Hover any row)
                          </span>
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30">
                            Slice_i = min(max(0, Income − Prior_i), Width_i)
                          </span>
                        </div>
                        <div className="overflow-visible">
                          <table className="w-full text-left border-collapse font-mono text-[11px] border border-slate-800">
                            <thead>
                              <tr className="bg-slate-950 text-slate-300 border-b border-slate-800">
                                <th className="py-1.5 px-2.5 border-r border-slate-800">Tier &amp; Bracket</th>
                                <th className="py-1.5 px-2.5 border-r border-slate-800 text-center">Tier %</th>
                                <th className="py-1.5 px-2.5 border-r border-slate-800">Mathematical Slice Derivation</th>
                                <th className="py-1.5 px-2.5 text-right">Tier Tax (৳)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                              {slabCalculations.map((s, idx) => {
                                const isExpTooltipOpen = activeExplanationSlabTooltip === idx;
                                return (
                                  <tr
                                    key={idx}
                                    onMouseEnter={() => setActiveExplanationSlabTooltip(idx)}
                                    onMouseLeave={() => setActiveExplanationSlabTooltip(prev => (prev === idx ? null : prev))}
                                    onClick={() => setActiveExplanationSlabTooltip(prev => (prev === idx ? null : idx))}
                                    className={`relative cursor-pointer transition-colors ${
                                      s.taxableAmount > 0
                                        ? 'bg-slate-900/90 hover:bg-slate-800 text-white'
                                        : 'bg-slate-950/40 hover:bg-slate-900/70 text-slate-400'
                                    }`}
                                  >
                                    <td className="py-1.5 px-2.5 border-r border-slate-800 font-sans font-bold relative">
                                      <div className="flex items-center justify-between gap-2">
                                        <div>
                                          {s.slabName} <span className="font-mono text-[10px] text-slate-400">({s.bracketRange})</span>
                                        </div>
                                        <HelpCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                      </div>
                                      {isExpTooltipOpen && (
                                        <div
                                          role="tooltip"
                                          className="z-40 left-2 top-full mt-1 w-80 sm:w-96 p-3 rounded-xl bg-slate-950 text-white shadow-2xl border border-cyan-500/60 font-sans text-left space-y-2"
                                        >
                                          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300">
                                              {s.tierOrder} · {s.statusLabel}
                                            </span>
                                            <span className="font-mono text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300">
                                              Rate: {s.rate}
                                            </span>
                                          </div>
                                          <p className="text-[11px] text-blue-100 leading-relaxed font-normal">
                                            {s.rateCalculationContext}
                                          </p>
                                          <div className="p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[10px] space-y-1 text-slate-200">
                                            <div>Slice Formula: <span className="text-cyan-300">{s.sliceMathExpression}</span></div>
                                            <div>Tax Formula: <span className="text-amber-300 font-bold">{s.formula}</span></div>
                                          </div>
                                          <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
                                            {s.context}
                                          </p>
                                        </div>
                                      )}
                                    </td>
                                    <td className="py-1.5 px-2.5 border-r border-slate-800 text-center font-bold text-cyan-300">
                                      {s.rate}
                                    </td>
                                    <td className="py-1.5 px-2.5 border-r border-slate-800">
                                      {s.formula}
                                    </td>
                                    <td className="py-1.5 px-2.5 text-right font-bold text-amber-300">
                                      ৳ {Math.round(s.taxPayable).toLocaleString()}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] flex flex-wrap items-center justify-between gap-2">
                          <span className="text-slate-300">Gross Tax Liability (∑ Tier Taxes):</span>
                          <span className="text-amber-300 font-bold">
                            {slabCalculations.map(s => `৳${Math.round(s.taxPayable).toLocaleString()}`).join(' + ')} = ৳ {Math.round(grossTaxPayable).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Section C: 3-Limit Rebate & Final Net Tax Derivation */}
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-black uppercase tracking-wider text-emerald-300">
                            3. Section 78 Rebate Comparison &amp; Final Net Tax Derivation
                          </span>
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-500/30">
                            Rebate = min(Limit A, Limit B, Limit C)
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-1 text-slate-200">
                          <div>
                            • Limit A (3% × Eligible Income ৳ {Math.round(eligibleTotalIncomeForRebate).toLocaleString()}) = ৳ {Math.round(limitA).toLocaleString()} | Limit B (10% × Allowable Inv. ৳ {Math.round(totalAllowableInvestment).toLocaleString()}) = ৳ {Math.round(limitB).toLocaleString()} | Limit C (Statutory Cap) = ৳ {limitC.toLocaleString()}
                          </div>
                          <div>
                            • Applied Tax Rebate = min(৳ {Math.round(limitA).toLocaleString()}, ৳ {Math.round(limitB).toLocaleString()}, ৳ {limitC.toLocaleString()}) = <span className="text-emerald-300 font-bold">৳ {Math.round(taxRebate).toLocaleString()}</span>
                          </div>
                          <div>
                            • Net Tax After Rebate = max(0, Gross Tax ৳ {Math.round(grossTaxPayable).toLocaleString()} − Rebate ৳ {Math.round(taxRebate).toLocaleString()}) = ৳ {Math.round(netTaxBeforeMinimum).toLocaleString()}
                          </div>
                          <div>
                            • Final Annual Net Tax Payable = {totalTaxableIncome > exemptionThreshold ? `max(Net Tax ৳ ${Math.round(netTaxBeforeMinimum).toLocaleString()}, Minimum Tax Floor ৳ ${minimumTax.toLocaleString()})` : '৳ 0 (Within 0% Tax-Free Threshold)'} = <span className="text-amber-300 font-bold">৳ {Math.round(finalTaxPayable).toLocaleString()}</span> (Effective Rate: {effectiveTaxRate}% | Monthly TDS u/s 86: ৳ {monthlySalaryTds.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo)
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Consolidated Single Table: All Information Displayed At A Glance, No Scroll */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-visible">
              <div className="p-4 bg-slate-50 border-b border-slate-200 rounded-t-2xl flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-black text-black">
                    Statutory Tax Slab &amp; Rebate Calculation Statement (At A Glance)
                  </h3>
                  <p className="text-xs text-slate-600">
                    Compliant with Bangladesh Income Tax Act 2023 (AY 2026–2027). Hover over any tax slab row, rate badge, or &ldquo;How derived&rdquo; for dynamic calculation details.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsExplanationOpen(prev => !prev)}
                    aria-expanded={isExplanationOpen}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{isExplanationOpen ? 'Hide Explanation' : 'Explanation'}</span>
                    {isExplanationOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                  <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-full border border-emerald-300">
                    Assessment Year 2026–27
                  </span>
                </div>
              </div>

              {/* Strict Non-Scrolling Full-Width Table */}
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr className="bg-slate-200/90 border-b border-slate-300 text-xs font-extrabold uppercase tracking-wider text-black">
                    <th className="py-2.5 px-3 text-black font-black border-r border-slate-300">Slab / Statutory Step</th>
                    <th className="py-2.5 px-3 text-black font-black border-r border-slate-300 text-center">Rate</th>
                    <th className="py-2.5 px-3 text-black font-black border-r border-slate-300 text-right">Taxable Tier (৳)</th>
                    <th className="py-2.5 px-3 text-black font-black text-right">Tax Payable (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs text-black">
                  {slabCalculations.map((slab, idx) => {
                    const isTooltipOpen = activeSlabTooltip === idx;
                    const shareOfGrossPct =
                      grossTaxPayable > 0 ? ((slab.taxPayable / grossTaxPayable) * 100).toFixed(1) : '0.0';
                    return (
                      <tr
                        key={idx}
                        onMouseEnter={() => setActiveSlabTooltip(idx)}
                        onMouseLeave={() => setActiveSlabTooltip(prev => (prev === idx ? null : prev))}
                        className={`transition-colors ${
                          isTooltipOpen
                            ? 'bg-blue-50/70'
                            : idx % 2 === 0
                            ? 'bg-white hover:bg-blue-50/40'
                            : 'bg-slate-50/60 hover:bg-blue-50/40'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-black font-bold border-r border-slate-200 relative">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-black">{slab.slabName}</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                  {slab.bracketRange}
                                </span>
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                                  {slab.formula}
                                </span>
                              </div>
                              <p className="text-[11px] font-normal text-slate-600 leading-relaxed">
                                {slab.context}
                              </p>
                            </div>

                            {/* Dynamic Tooltip Trigger & Interactive Popover */}
                            <div className="relative shrink-0">
                              <button
                                type="button"
                                onClick={() => setActiveSlabTooltip(prev => (prev === idx ? null : idx))}
                                onFocus={() => setActiveSlabTooltip(idx)}
                                onBlur={() => setActiveSlabTooltip(prev => (prev === idx ? null : prev))}
                                aria-label={`How ${slab.slabName} tax calculation is derived`}
                                aria-expanded={isTooltipOpen}
                                aria-describedby={isTooltipOpen ? `table-slab-tooltip-${idx}` : undefined}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-bold transition-colors cursor-pointer"
                              >
                                <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                                <span className="hidden sm:inline">How derived</span>
                              </button>

                              {isTooltipOpen && (
                                <div
                                  id={`table-slab-tooltip-${idx}`}
                                  role="tooltip"
                                  className="z-30 mt-1.5 w-76 sm:w-96 p-3.5 rounded-xl bg-slate-900 text-white shadow-2xl border border-slate-700 text-left right-0 absolute space-y-2.5"
                                >
                                  <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-2">
                                    <div>
                                      <div className="text-[10px] uppercase tracking-wider font-bold text-blue-300">
                                        {slab.tierOrder} · {slab.statusLabel}
                                      </div>
                                      <div className="text-xs font-extrabold text-white mt-0.5">
                                        {slab.slabName}
                                      </div>
                                    </div>
                                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono text-xs font-black shrink-0">
                                      {slab.rate} Rate
                                    </span>
                                  </div>

                                  {/* Contextual Explanation of Why This Rate Applies */}
                                  <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] text-blue-100 leading-relaxed font-normal">
                                    <span className="font-bold text-cyan-300 block mb-0.5">
                                      How {slab.rate} Rate Applies to Your Input:
                                    </span>
                                    {slab.rateCalculationContext}
                                  </div>

                                  {/* Step-by-Step Derivation */}
                                  <div className="space-y-1.5 text-[11px] bg-slate-800/90 p-2.5 rounded-lg border border-slate-700 font-mono">
                                    <div className="flex justify-between text-slate-300">
                                      <span>Income Range:</span>
                                      <span className="text-white font-bold">{slab.bracketRange}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-300">
                                      <span>Your Total Taxable Income:</span>
                                      <span className="text-white">৳ {Math.round(totalTaxableIncome).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-300">
                                      <span>Prior Slabs Absorbed:</span>
                                      <span className="text-slate-200">− ৳ {slab.priorAbsorbed.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-300">
                                      <span>Income Entering Tier #{slab.tierNumber}:</span>
                                      <span className="text-cyan-200 font-bold">৳ {Math.round(slab.incomeEnteringTier).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-300">
                                      <span>Slab Capacity Limit:</span>
                                      <span className="text-slate-200">{slab.slabLimitLabel}</span>
                                    </div>
                                    <div className="pt-1 border-t border-slate-700 text-[10px] text-cyan-300">
                                      Slice = {slab.sliceMathExpression}
                                    </div>
                                    <div className="flex justify-between text-amber-300 font-bold pt-1 border-t border-slate-700">
                                      <span>Derived Tax ({slab.rate}):</span>
                                      <span>{slab.formula}</span>
                                    </div>
                                  </div>

                                  {/* Slab Utilization Progress Bar */}
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-slate-300 font-medium">
                                      <span>Bracket Utilization: <strong className="font-mono text-emerald-300">{slab.utilizationPct}%</strong></span>
                                      <span>Share of Gross Tax: <strong className="font-mono text-amber-300">{shareOfGrossPct}%</strong></span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                                        style={{ width: `${slab.utilizationPct}%` }}
                                      />
                                    </div>
                                  </div>

                                  <p className="text-[11px] text-slate-200 leading-relaxed font-normal">
                                    {slab.context}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-black font-bold text-center border-r border-slate-200 align-top">
                          <span
                            title={`${slab.tierOrder}: ${slab.rateCalculationContext}`}
                            className="inline-flex items-center gap-1 font-mono bg-slate-200 hover:bg-blue-100 px-1.5 py-0.5 rounded text-black font-black cursor-help transition-colors"
                          >
                            {slab.rate}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-black font-bold text-right font-mono border-r border-slate-200 align-top">
                          {Math.round(slab.taxableAmount).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-black font-black text-right font-mono align-top">
                          {Math.round(slab.taxPayable).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Gross Tax Row */}
                  <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300">
                    <td colSpan={3} className="py-2 px-3 text-black font-black text-right border-r border-slate-200">
                      Gross Tax Liability (Calculated on Progressive Slabs):
                    </td>
                    <td className="py-2 px-3 text-black font-black text-right font-mono">
                      ৳ {Math.round(grossTaxPayable).toLocaleString()}
                    </td>
                  </tr>

                  {/* Three Comparison Limits Breakdown Rows */}
                  <tr className="bg-blue-50/50 text-[11px]">
                    <td colSpan={3} className="py-1.5 px-3 text-slate-800 font-bold text-right border-r border-slate-200">
                      Limit A — 3% of Eligible Total Income (3% of ৳ {Math.round(eligibleTotalIncomeForRebate).toLocaleString()}):
                    </td>
                    <td className="py-1.5 px-3 text-slate-900 font-bold text-right font-mono">
                      ৳ {Math.round(limitA).toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-blue-50/50 text-[11px]">
                    <td colSpan={3} className="py-1.5 px-3 text-slate-800 font-bold text-right border-r border-slate-200">
                      Limit B — 10% of Total Allowable Investment (10% of ৳ {Math.round(totalAllowableInvestment).toLocaleString()}):
                    </td>
                    <td className="py-1.5 px-3 text-slate-900 font-bold text-right font-mono">
                      ৳ {Math.round(limitB).toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-blue-50/50 text-[11px]">
                    <td colSpan={3} className="py-1.5 px-3 text-slate-800 font-bold text-right border-r border-slate-200">
                      Limit C — Maximum Statutory Cap:
                    </td>
                    <td className="py-1.5 px-3 text-slate-900 font-bold text-right font-mono">
                      ৳ {limitC.toLocaleString()}
                    </td>
                  </tr>

                  {/* Allowable Investment Rebate Row */}
                  <tr className="bg-emerald-50/90 font-bold">
                    <td colSpan={3} className="py-2 px-3 text-black font-black text-right border-r border-slate-200">
                      Less: Allowable Tax Rebate — Lower of Limit A, Limit B, or Limit C:
                    </td>
                    <td className="py-2 px-3 text-emerald-950 font-black text-right font-mono">
                      - ৳ {Math.round(taxRebate).toLocaleString()}
                    </td>
                  </tr>

                  {/* Net Tax Before Minimum */}
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={3} className="py-2 px-3 text-black font-black text-right border-r border-slate-200">
                      Net Payable Tax after Rebate Adjustment:
                    </td>
                    <td className="py-2 px-3 text-black font-black text-right font-mono">
                      ৳ {Math.round(netTaxBeforeMinimum).toLocaleString()}
                    </td>
                  </tr>

                  {/* Minimum Tax Floor Clause */}
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={3} className="py-2 px-3 text-black font-black text-right border-r border-slate-200">
                      Minimum Tax Floor (Applicable Baseline Threshold):
                    </td>
                    <td className="py-2 px-3 text-black font-black text-right font-mono">
                      ৳ {minimumTax.toLocaleString()}
                    </td>
                  </tr>

                  {/* Final Net Tax Payable Highlight */}
                  <tr className="bg-amber-100 font-extrabold border-t-2 border-amber-300">
                    <td colSpan={3} className="py-3 px-3 text-black font-black text-base text-right border-r border-amber-200">
                      FINAL ANNUAL NET TAX PAYABLE:
                    </td>
                    <td className="py-3 px-3 text-black font-black text-lg text-right font-mono">
                      ৳ {Math.round(finalTaxPayable).toLocaleString()}
                    </td>
                  </tr>

                  {/* Monthly Salary TDS Row (Section 86 of Income Tax Act 2023) */}
                  <tr className="bg-blue-950 text-white font-extrabold border-t border-blue-800">
                    <td colSpan={3} className="py-2.5 px-3 text-white font-bold text-right border-r border-blue-800">
                      MONTHLY SALARY TDS WITHHOLDING (ধারা ৮৬ · বার্ষিক নিট কর ÷ ১২):
                    </td>
                    <td className="py-2.5 px-3 text-cyan-300 font-black text-base text-right font-mono">
                      ৳ {monthlySalaryTds.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / mo
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Table Footer Summary Explanations & Mathematical Breakdown Accordion */}
              <div className="p-4 bg-slate-100 border-t border-slate-200 rounded-b-2xl text-xs text-black space-y-3">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-black">
                      • 1/3 Salary Exemption: ৳{Math.round(allowableSalaryExemption).toLocaleString()} deducted (1/3 of salary or max Tk. 5,00,000).
                    </span>
                    <span className="font-bold text-black">
                      • Total Allowable Investment (অনুমোদনযোগ্য বিনিয়োগ): ৳{totalAllowableInvestment.toLocaleString()} (10% Limit B = ৳{Math.round(limitB).toLocaleString()}).
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-black">
                      • Monthly Salary TDS (Sec 86): ৳{monthlySalaryTds.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/month (Read <Link to="/article/salary-tds-bangladesh-complete-guide-2026-2027" className="text-blue-800 underline font-black">বেতন থেকে উৎসে কর কর্তন ২০২৬–২৭</Link>).
                    </span>
                    <span className="font-bold text-black">
                      • Session logged to <Link to="/workspace?tab=tool-signings" className="text-blue-800 underline font-black">Workspace Audit Ledger</Link>.
                    </span>
                  </div>
                </div>

                {/* Expandable 'Explanation' Accordion Trigger & Content */}
                <div className="border border-slate-300 rounded-xl bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setIsExplanationOpen(prev => !prev)}
                    aria-expanded={isExplanationOpen}
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/90 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                        <Calculator className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-black text-slate-900 block">
                          Explanation: Step-by-Step Mathematical Breakdown (AY 2026–2027)
                        </span>
                        <span className="text-[11px] text-slate-600 font-medium block">
                          Click to {isExplanationOpen ? 'collapse' : 'expand'} full derivation using the Tk. 4,00,000 base threshold and progressive slab percentages (0% to 30%)
                        </span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold shrink-0">
                      <span>{isExplanationOpen ? 'Hide Math' : 'Show Math'}</span>
                      {isExplanationOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>

                  {isExplanationOpen && (
                    <div className="p-4 border-t border-slate-200 space-y-4 bg-white text-slate-800">
                      {/* Step 1: Taxable Income & Exemption Constant */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h5 className="text-xs font-black uppercase tracking-wider text-blue-900">
                            Step 1 · Taxable Income &amp; Initial Tax-Free Threshold Constant
                          </h5>
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                            Base Constant: Tk. 4,00,000 (General)
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          Under the Income Tax Act 2023 for Assessment Year 2026–2027, gross salary income first receives a statutory exemption of <strong className="text-black">1/3 of Gross Salary or Tk. 5,00,000 (whichever is lower)</strong>. Next, the initial tax-free threshold (<strong className="text-black">0% tax rate</strong>) is applied based on your taxpayer category: <strong className="text-black">Tk. 4,00,000</strong> for General Taxpayers (or <strong className="text-black">Tk. 4,50,000</strong> for Female/Senior 65+, <strong className="text-black">Tk. 5,25,000</strong> for Third Gender/Disabled, <strong className="text-black">Tk. 5,50,000</strong> for Gazetted War-Wounded Freedom Fighters &amp; July 2024 Injured Fighters), plus <strong className="text-black">Tk. 50,000</strong> per disabled child/dependant.
                        </p>
                        <div className="bg-slate-900 text-white p-3 rounded-lg font-mono text-[11px] space-y-1">
                          <div>Gross Salary = ৳ {grossSalaryIncome.toLocaleString()} | Salary Exemption = min(৳ {grossSalaryIncome.toLocaleString()} ÷ 3, ৳ 5,00,000) = ৳ {Math.round(allowableSalaryExemption).toLocaleString()}</div>
                          <div>Taxable Salary (৳ {Math.round(taxableSalary).toLocaleString()}) + Other Income (৳ {(businessIncome + rentalIncome + otherIncome).toLocaleString()}) = <span className="text-emerald-300 font-bold">Total Taxable Income: ৳ {Math.round(totalTaxableIncome).toLocaleString()}</span></div>
                          <div>Applicable 0% Tax-Free Threshold ({categoryLabel}) = ৳ {baseExemptionThreshold.toLocaleString()}{dependentAddition > 0 ? ` + ৳ ${dependentAddition.toLocaleString()} (${disabledDependents} × Tk. 50,000)` : ''} = <span className="text-cyan-300 font-bold">৳ {exemptionThreshold.toLocaleString()}</span></div>
                        </div>
                      </div>

                      {/* Step 2: Progressive Tiered Slab Percentages Breakdown */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h5 className="text-xs font-black uppercase tracking-wider text-indigo-900">
                            Step 2 · Progressive Tiered Slab Percentages (0%, 10%, 15%, 20%, 25%, 30%)
                          </h5>
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-900">
                            Gross Tax = ∑ (Slab Taxable Portion × Slab Rate %)
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          Your total taxable income of <strong className="text-black">৳ {Math.round(totalTaxableIncome).toLocaleString()}</strong> is partitioned sequentially across the AY 2026–2027 progressive brackets: First <strong className="text-black">Tk. {exemptionThreshold.toLocaleString()} @ 0%</strong>, Next <strong className="text-black">Tk. 3,00,000 @ 10%</strong>, Next <strong className="text-black">Tk. 4,00,000 @ 15%</strong>, Next <strong className="text-black">Tk. 5,00,000 @ 20%</strong>, Next <strong className="text-black">Tk. 20,00,000 @ 25%</strong>, and any <strong className="text-black">Remaining Balance @ 30%</strong>:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                          {slabCalculations.map((s, i) => (
                            <div
                              key={i}
                              className={`p-2.5 rounded-lg border flex flex-col justify-between ${
                                s.taxableAmount > 0
                                  ? 'bg-white border-blue-200 text-slate-900'
                                  : 'bg-slate-100/70 border-slate-200 text-slate-500'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 font-sans font-bold text-xs">
                                <span className="text-black">Tier {i + 1}: {s.slabName}</span>
                                <span className="px-1.5 py-0.5 rounded bg-slate-200 text-black font-mono text-[10px]">
                                  {s.rate}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                Bracket: {s.bracketRange} (Prior absorbed: ৳ {s.priorAbsorbed.toLocaleString()})
                              </div>
                              <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between font-bold text-black">
                                <span>Formula:</span>
                                <span className="text-blue-900">{s.formula}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="bg-slate-900 text-white p-2.5 rounded-lg font-mono text-[11px] flex flex-wrap items-center justify-between gap-2">
                          <span>Gross Tax Liability Sum:</span>
                          <span className="text-amber-300 font-bold">
                            {slabCalculations.map(s => `৳${Math.round(s.taxPayable).toLocaleString()}`).join(' + ')} = ৳ {Math.round(grossTaxPayable).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Step 3: Three-Limit Investment Rebate & Net Tax Floor */}
                      <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h5 className="text-xs font-black uppercase tracking-wider text-emerald-950">
                            Step 3 · Investment Tax Rebate (3-Limit Comparison) &amp; Minimum Tax Floor
                          </h5>
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-950">
                            Section 78 &amp; Part 3, 6th Schedule
                          </span>
                        </div>
                        <div className="bg-slate-900 text-white p-3 rounded-lg font-mono text-[11px] space-y-1">
                          <div>
                            Allowable Investment = DPS (৳ {allowableDps.toLocaleString()}) + Govt Sec (৳ {allowableGovtSecurities.toLocaleString()}) + RPF/GPF (৳ {allowableProvidentFund.toLocaleString()}) + Mutual/Other (৳ {(allowableMutualFunds + allowableLifeInsurance + allowableListedStocks + allowableUpsZakat).toLocaleString()}) = <span className="text-cyan-300 font-bold">৳ {totalAllowableInvestment.toLocaleString()}</span>
                          </div>
                          <div>
                            Tax Rebate = min(Limit A [3% Income]: ৳ {Math.round(limitA).toLocaleString()}, Limit B [10% Inv.]: ৳ {Math.round(limitB).toLocaleString()}, Limit C [Cap]: ৳ {limitC.toLocaleString()}) = <span className="text-emerald-300 font-bold">৳ {Math.round(taxRebate).toLocaleString()}</span>
                          </div>
                          <div>
                            Final Net Payable Tax = {totalTaxableIncome > exemptionThreshold ? `max(Gross Tax ৳ ${Math.round(grossTaxPayable).toLocaleString()} − Rebate ৳ ${Math.round(taxRebate).toLocaleString()}, Min Tax ৳ ${minimumTax.toLocaleString()})` : '৳ 0 (Income within 0% Tax-Free Threshold)'} = <span className="text-amber-300 font-bold">৳ {Math.round(finalTaxPayable).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Comprehensive Statutory Reference Guide: Thresholds, 3 Limits & Allowable Investment Rules */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-5">
              {/* 1. Initial Tax-Free Thresholds Table */}
              <div>
                <h4 className="text-sm font-black text-slate-900 mb-2">
                  Initial Tax-Free Thresholds (0% Tax Rate)
                </h4>
                <table className="w-full text-left border-collapse border border-slate-200 text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-black font-black">
                      <th className="py-2 px-3 border-r border-slate-200">Taxpayer Category</th>
                      <th className="py-2 px-3 text-right">Tax-Free Threshold</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                    <tr>
                      <td className="py-2 px-3 border-r border-slate-200">General Individual Taxpayers</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-black">First Tk. 4,00,000</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border-r border-slate-200">Female Taxpayers &amp; Senior Citizens (Age 65+)</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-black">First Tk. 4,50,000</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border-r border-slate-200">Third Gender &amp; Disabled / Physically Challenged Taxpayers</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-black">First Tk. 5,25,000</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border-r border-slate-200">Gazetted War-Wounded Freedom Fighters &amp; July 2024 Injured Fighters</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-black">First Tk. 5,50,000</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-[11px] text-slate-600 mt-1.5 font-medium">
                  (Note: For parents or legal guardians of a disabled child/dependant, the tax-free limit is increased by <strong>Tk. 50,000</strong> for each child.)
                </p>
              </div>

              {/* 2. The Three Comparison Limits & Impact on Final Payable Tax */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-blue-900">
                    1. The Three Comparison Limits (Tax Rebate)
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700 leading-relaxed">
                    <li>
                      <strong className="text-black">Limit A — 3% of Eligible Total Income:</strong> 3% of your eligible total taxable income.
                      <span className="block text-[11px] text-slate-600 mt-0.5">
                        <em>Exclusions:</em> Excludes tax-exempt income, income taxed at reduced rates, share of profit/income from a partnership firm or AOP, and income subject to final/minimum tax under Section 163.
                      </span>
                    </li>
                    <li>
                      <strong className="text-black">Limit B — 10% of Total Allowable Investment:</strong> 10% of the total actual allowable investment made during the tax year under Part 3 of the 6th Schedule.
                    </li>
                    <li>
                      <strong className="text-black">Limit C — Maximum Statutory Cap:</strong> The absolute upper limit of <strong>Tk. 7,50,000</strong>.
                    </li>
                  </ul>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900">
                    Impact on Final Payable Tax
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700 leading-relaxed">
                    <li>
                      <strong className="text-black">Adjustment Against Tax Liability:</strong> The resulting rebate amount is directly deducted from your gross tax liability (calculated using the applicable income tax slabs).
                    </li>
                    <li>
                      <strong className="text-black">Net Payable Tax:</strong> Subtracting the rebate yields your net tax payable for filing.
                    </li>
                    <li>
                      <strong className="text-black">Minimum Tax Floor:</strong> If the net tax after deducting the rebate drops below the baseline minimum tax threshold (e.g., Tk. 5,000 for general taxpayers or Tk. 1,000 for disabled/new taxpayers), you must still pay the applicable minimum tax.
                    </li>
                  </ul>
                </div>
              </div>

              {/* 3. Total Allowable Investment (অনুমোদনযোগ্য বিনিয়োগ) & Sector Capping Table */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    Total Allowable Investment (অনুমোদনযোগ্য বিনিয়োগ) — Calculation &amp; Sector Caps
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    To find your total allowable investment, each actual investment amount is compared against its statutory sector cap. For each sector, take the lower of the actual investment or the statutory ceiling:
                  </p>
                  <div className="my-2 px-3 py-2 bg-slate-900 text-white rounded-xl font-mono text-xs font-bold text-center">
                    Total Allowable Investment = ∑ min(Actual Sector Investment, Statutory Sector Limit)
                  </div>
                </div>

                <table className="w-full text-left border-collapse border border-slate-200 text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-black font-black">
                      <th className="py-2 px-3 border-r border-slate-200">Investment Sector</th>
                      <th className="py-2 px-3">Rule / Maximum Allowable Limit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    <tr>
                      <td className="py-2 px-3 border-r border-slate-200 font-bold text-black">Deposit Pension Scheme (DPS)</td>
                      <td className="py-2 px-3">Lower of actual deposit or <strong>Tk. 1,20,000</strong> per year.</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border-r border-slate-200 font-bold text-black">Government Securities / Savings Certificates (Sanchayapatra)</td>
                      <td className="py-2 px-3">Lower of actual investment or <strong>Tk. 5,00,000</strong>.</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border-r border-slate-200 font-bold text-black">Life Insurance Premium</td>
                      <td className="py-2 px-3">Lower of actual premium paid or <strong>10% of the actual sum assured</strong> (excluding bonus).</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border-r border-slate-200 font-bold text-black">Mutual Funds, ETFs, Unit Certificates</td>
                      <td className="py-2 px-3">Eligible new investments issued by asset managers, ICB, or finance companies.</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border-r border-slate-200 font-bold text-black">Listed Stocks &amp; Securities</td>
                      <td className="py-2 px-3">New investments in stocks, shares, or securities listed on an approved stock exchange in Bangladesh.</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border-r border-slate-200 font-bold text-black">Recognized Provident Fund (RPF)</td>
                      <td className="py-2 px-3">Both employee and employer contributions are fully included.</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border-r border-slate-200 font-bold text-black">General Provident Fund (GPF)</td>
                      <td className="py-2 px-3">Full actual contribution.</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border-r border-slate-200 font-bold text-black">Universal Pension Scheme, Zakat Fund &amp; Benevolent Funds</td>
                      <td className="py-2 px-3">Full actual contributions made to the Universal Pension Scheme, Zakat Fund under the Zakat Fund Management Act 2023, or approved benevolent/group insurance funds.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 4. Key Mandatory Conditions & Practical Calculation Example */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div className="bg-amber-50/70 rounded-xl p-4 border border-amber-200 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-950">
                    Key Mandatory Conditions
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-800 leading-relaxed">
                    <li>
                      <strong className="text-black">Holding Period until Maturity:</strong> Investments in Government Securities, Mutual Funds, ETFs, and Unit Certificates must be maintained for their full maturity period. Encashing or redeeming them prior to maturity invalidates the tax rebate, and the rebate previously enjoyed will be added back as additional tax payable in the year of encashment.
                    </li>
                    <li>
                      <strong className="text-black">Recognized Funds:</strong> Provident fund contributions must be made to a Recognized Provident Fund (RPF) or GPF to qualify.
                    </li>
                  </ul>
                </div>

                <div className="bg-emerald-50/70 rounded-xl p-4 border border-emerald-200 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950">
                    Practical Calculation Example (Tk. 10,88,000)
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-800 font-medium">
                    <li>• <strong>DPS Contribution:</strong> Tk. 2,40,000 (Actual) → Capped at <strong>Tk. 1,20,000</strong></li>
                    <li>• <strong>Sanchayapatra / Govt Securities:</strong> Tk. 8,00,000 (Actual) → Capped at <strong>Tk. 5,00,000</strong></li>
                    <li>• <strong>Recognized Provident Fund (Emp + Empl):</strong> <strong>Tk. 1,68,000</strong> (Full allowable)</li>
                    <li>• <strong>Approved Mutual Fund:</strong> <strong>Tk. 3,00,000</strong> (Full allowable)</li>
                  </ul>
                  <div className="pt-1.5 border-t border-emerald-200 text-xs font-bold text-black">
                    Total Allowable Investment = 1,20,000 + 5,00,000 + 1,68,000 + 3,00,000 = <span className="font-mono text-emerald-900">Tk. 10,88,000</span>
                    <span className="block text-[11px] font-normal text-slate-700 mt-0.5">
                      (Multiplied by 10% in the rebate formula to determine Limit B = <strong>Tk. 1,08,800</strong>).
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ToolAccessGuard>
  );
};
