import React, { useState, useEffect } from 'react';
import {
  Calculator,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  FileText,
  DollarSign,
  TrendingDown,
  Layers,
  Building,
  HelpCircle
} from 'lucide-react';

interface Props {
  className?: string;
  showBengaliDefault?: boolean;
}

type TabType = 'salary' | 'screener' | 'tax_calc' | 'checklist';

interface IncomeStreamPreset {
  id: string;
  nameEn: string;
  nameBn: string;
  headEn: string;
  headBn: string;
  status: 'EXEMPT' | 'PARTIAL' | 'TAXABLE' | 'DEEMED_RISK' | 'SPECIAL_TDS';
  governingSection: string;
  summaryEn: string;
  summaryBn: string;
  documentationEn: string[];
  documentationBn: string[];
}

const INCOME_PRESETS: IncomeStreamPreset[] = [
  {
    id: 'salary_package',
    nameEn: 'Salary & Employment Allowances',
    nameBn: 'বেতন ও চাকরির ভাতাদি',
    headEn: 'Income from Employment (Sec 32)',
    headBn: 'চাকরি হইতে আয় (ধারা ৩২)',
    status: 'PARTIAL',
    governingSection: 'Sixth Schedule, Part 1, Paragraph 1',
    summaryEn: 'Exempt up to lower of 1/3rd of total employment income or BDT 450,000. Balance is taxable at progressive slabs.',
    summaryBn: 'মোট প্রাপ্ত বেতনের এক-তৃতীয়াংশ অথবা ৪,৫০,০০০ টাকার মধ্যে যেটি কম তাহা করমুক্ত। অবশিষ্ট অর্থ করযোগ্য।',
    documentationEn: ['Employer Salary Certificate', 'Monthly Payslips', 'Bank statement showing salary credits', 'Provident fund records'],
    documentationBn: ['নিয়োগকর্তার বেতন প্রত্যয়নপত্র', 'মাসিক পে-স্লিপ', 'ব্যাংক বিবরণী (বেতন জমা)', 'ভবিষ্য তহবিল বিবরণী']
  },
  {
    id: 'freelance_ites_prc',
    nameEn: 'Freelance ITES Export Remittances (With PRC)',
    nameBn: 'ফ্রিল্যান্সিং আইটিইএস রেমিট্যান্স (পিআরসিসহ)',
    headEn: 'Business / Other Sources (Sec 124)',
    headBn: 'ব্যবসা / অন্যান্য উৎস (ধারা ১২৪)',
    status: 'EXEMPT',
    governingSection: 'Sixth Schedule, Part 1, Paragraph 21 & Sec 124',
    summaryEn: 'Foreign currency earnings from qualifying software development, ITES, and digital services remitted via authorized dealer banks are fully tax-exempt with Proceeds Realization Certificate (PRC).',
    summaryBn: 'বৈধ ব্যাংকিং চ্যানেলে প্রাপ্ত অনুমোদিত সফটওয়্যার ও আইটিইএস রফতানি আয় পিআরসি (PRC) সাপেক্ষে সম্পূর্ণ করমুক্ত।',
    documentationEn: ['Proceeds Realization Certificate (PRC)', 'Foreign client invoice / contract', 'Upwork/Fiverr/marketplace statement', 'Bank credit advice'],
    documentationBn: ['প্রসিডস রিয়ালাইজেশন সার্টিফিকেট (PRC)', 'বিদেশি ক্লায়েন্টের চালান / চুক্তি', 'মার্কেটপ্লেস আর্নিং হিস্ট্রি', 'ব্যাংক ক্রেডিট অ্যাডভাইস']
  },
  {
    id: 'foreign_consulting_non_ites',
    nameEn: 'Non-ITES Foreign Service Remittance',
    nameBn: 'নন-আইটিইএস বিদেশি পরামর্শক সেবা রেমিট্যান্স',
    headEn: 'Income from Business / Profession (Sec 124)',
    headBn: 'ব্যবসা বা পেশা হইতে আয় (ধারা ১২৪)',
    status: 'SPECIAL_TDS',
    governingSection: 'Section 124 of Income Tax Act 2023',
    summaryEn: 'Foreign remittances for services outside statutory ITES scope are subject to 10% withholding tax deducted by the recipient bank upon credit.',
    summaryBn: 'আইটিইএস তালিকার বাইরের সেবামূলক রেমিট্যান্সের ক্ষেত্রে সংশ্লিষ্ট ব্যাংক জমা করার সময় ১০% উৎসে কর কর্তন করে।',
    documentationEn: ['Bank 10% TDS certificate / advice', 'Service contract / scope of work', 'Foreign client payment statement'],
    documentationBn: ['ব্যাংকের ১০% টিডিএস সার্টিফিকেট', 'চুক্তিপত্র বা কাজের বিবরণী', 'বিদেশি ক্লায়েন্টের পেমেন্ট স্টেটমেন্ট']
  },
  {
    id: 'nrb_wage_remittance',
    nameEn: 'NRB Wage Earner Inward Remittances',
    nameBn: 'প্রবাসী বাংলাদেশীদের (NRB) বৈধ রেমিট্যান্স',
    headEn: 'Income from Other Sources / Excluded',
    headBn: 'অন্যান্য উৎস / বহির্ভূত আয়',
    status: 'EXEMPT',
    governingSection: 'Sixth Schedule, Part 1, Paragraph 18',
    summaryEn: 'Remittances sent by Non-Resident Bangladeshi wage earners from overseas employment through official banking channels are 100% tax-exempt in Bangladesh.',
    summaryBn: 'বিদেশে চাকরির মাধ্যমে উপার্জিত অর্থ বৈধ ব্যাংকিং চ্যানেলে বাংলাদেশে পাঠালে তা শতভাগ করমুক্ত।',
    documentationEn: ['Official bank remittance credit certificate', 'Overseas work visa / resident permit copy', 'Passport with entry/exit stamps'],
    documentationBn: ['ব্যাংক রেমিট্যান্স সনদ', 'বিদেশি কর্মসংস্থান ভিসা / রেসিডেন্স পারমিট', 'পাসপোর্ট ও ইমিগ্রেশন সিল']
  },
  {
    id: 'gift_family',
    nameEn: 'Gifts from Spouse, Parents or Children',
    nameBn: 'স্বামী/স্ত্রী, পিতা-মাতা বা সন্তানদের নিকট হইতে উপহার',
    headEn: 'Excluded from Total Income',
    headBn: 'মোট আয় হইতে বহির্ভূত',
    status: 'EXEMPT',
    governingSection: 'Sixth Schedule, Part 1, Paragraph 35',
    summaryEn: 'Gifts received from immediate family (spouse, parents, children) are completely exempt, provided both parties declare the transaction in their NBR returns.',
    summaryBn: 'স্বামী/স্ত্রী, পিতা-মাতা বা সন্তানের নিকট হতে প্রাপ্ত উপহার সম্পূর্ণ করমুক্ত; শর্ত থাকে যে উভয় পক্ষ তাদের রিটার্নে তা প্রদর্শন করবেন।',
    documentationEn: ['Registered Gift Deed or affidavit', 'Donor income tax return acknowledgement copy', 'Banking transaction statement'],
    documentationBn: ['উপহার বা হেবা দলিল / হলফনামা', 'দাতা কর্তৃক দাখিলকৃত রিটার্ন প্রাপ্তিস্বীকার', 'ব্যাংক লেনদেনের বিবরণী']
  },
  {
    id: 'gift_friends_relatives',
    nameEn: 'Gifts from Friends, Siblings or Third Parties',
    nameBn: 'বন্ধু, ভাই-বোন বা অন্যান্য ব্যক্তির নিকট হইতে উপহার',
    headEn: 'Income from Other Sources (Sec 66(d) & 67)',
    headBn: 'অন্যান্য উৎস হইতে আয় (ধারা ৬৬(ঘ) ও ৬৭)',
    status: 'TAXABLE',
    governingSection: 'Section 66(d) & Section 67(11)',
    summaryEn: 'Gifts from outside immediate family are taxable under Other Sources. Cash gifts exceeding BDT 500,000 not routed via banking channels are treated as deemed unexplained income.',
    summaryBn: 'নিকট আত্মীয় ব্যতীত অন্যদের নিকট হতে উপহার অন্যান্য উৎসের আয় হিসেবে করযোগ্য। ৫ লাখ টাকার বেশি নগদ উপহার ব্যাংকিং চ্যানেলে না এলে গোপন আয় গণ্য হবে।',
    documentationEn: ['Gift agreement', 'Donor tax identification and source of fund proof', 'Bank deposit evidence'],
    documentationBn: ['উপহার চুক্তিপত্র', 'দাতার টিআইএন ও তহবিলের উৎস প্রমাণ', 'ব্যাংক জমা প্রমাণক']
  },
  {
    id: 'house_property_residential',
    nameEn: 'Residential House Rent Income',
    nameBn: 'আবাসিক বাড়ি বা ফ্ল্যাটের ভাড়া আয়',
    headEn: 'Income from Rent (Sections 36–39)',
    headBn: 'ভাড়া হইতে আয় (ধারা ৩৬-৩৯)',
    status: 'PARTIAL',
    governingSection: 'Section 37(1)(b) — Statutory Repair Allowance',
    summaryEn: 'Taxable after mandatory statutory repair & maintenance deduction of 25% of Annual Rental Value (ARV), plus municipal holding taxes and loan interest.',
    summaryBn: 'বার্ষিক মোট ভাড়ার ২৫% সংবিধিবদ্ধ মেরামত ও রক্ষণাবেক্ষণ খরচ কর্তন এবং হোল্ডিং ট্যাক্স বাদ দেওয়ার পর অবশিষ্ট অংশ করযোগ্য।',
    documentationEn: ['Tenancy agreement', 'Bank rent credit statements', 'City corporation holding tax receipts', 'Mortgage loan interest certificate'],
    documentationBn: ['ভাড়া চুক্তিপত্র', 'ভাড়া জমার ব্যাংক বিবরণী', 'পৌরসভা/সিটি কর্পোরেশন হোল্ডিং ট্যাক্স রশিদ', 'গৃহনির্মাণ ঋণের সুদের সনদ']
  },
  {
    id: 'agricultural_marginal',
    nameEn: 'Agricultural Income (Sole Livelihood / Marginal)',
    nameBn: 'কৃষি আয় (একমাত্র জীবিকা / প্রান্তিক কৃষক)',
    headEn: 'Income from Agriculture (Sec 40–44)',
    headBn: 'কৃষি হইতে আয় (ধারা ৪০-৪৪)',
    status: 'EXEMPT',
    governingSection: 'Sixth Schedule, Part 1, Paragraph 27',
    summaryEn: 'Up to BDT 200,000 is completely exempt for individual farmers whose sole source of income is agriculture. In other cases, 60% statutory production cost is deductible.',
    summaryBn: 'কৃষি যাঁদের আয়ের একমাত্র উৎস, তাঁদের জন্য ২,০০,০০০ টাকা পর্যন্ত কৃষি আয় সম্পূর্ণ করমুক্ত। সাধারণ ক্ষেত্রে ৬০% উৎপাদন খরচ অনুমোদনযোগ্য।',
    documentationEn: ['Land ownership khatian / porcha', 'Agricultural product sale vouchers', 'Local union parishad certificate'],
    documentationBn: ['খতিয়ান বা জমির পরচা', 'কৃষি পণ্য বিক্রির রশিদ', 'ইউনিয়ন পরিষদ চেয়ারম্যানের প্রত্যয়নপত্র']
  },
  {
    id: 'govt_pension',
    nameEn: 'Government Pension & Approved Gratuity',
    nameBn: 'সরকারি পেনশন ও অনুমোদিত আনুতোষিক',
    headEn: 'Income from Employment / Excluded',
    headBn: 'চাকরি হইতে আয় / অব্যাহতিপ্রাপ্ত',
    status: 'EXEMPT',
    governingSection: 'Sixth Schedule, Part 1, Paragraphs 2 & 3',
    summaryEn: 'Pensions paid by the Government of Bangladesh are 100% tax-free. Gratuity up to statutory limits from approved gratuity funds is also exempt.',
    summaryBn: 'বাংলাদেশ সরকার কর্তৃক প্রদত্ত পেনশন শতভাগ করমুক্ত। অনুমোদিত ফান্ড থেকে প্রাপ্ত গ্র্যাচুইটিও নির্দিষ্ট সীমা পর্যন্ত করমুক্ত।',
    documentationEn: ['Pension payment book / PPO', 'Bank pension credit statement', 'Gratuity sanction order'],
    documentationBn: ['পেনশন পেমেন্ট অর্ডার (PPO)', 'ব্যাংক পেনশন স্টেটমেন্ট', 'গ্র্যাচুইটি মঞ্জুরি পত্র']
  },
  {
    id: 'bank_interest_fdr',
    nameEn: 'Bank Savings & FDR Interest',
    nameBn: 'ব্যাংক সঞ্চয়ী ও এফডিআর হিসাবের সুদ',
    headEn: 'Income from Financial Assets (Sec 62–65)',
    headBn: 'আর্থিক পরিসম্পদ হইতে আয় (ধারা ৬২-৬৫)',
    status: 'SPECIAL_TDS',
    governingSection: 'Section 102 & Section 62',
    summaryEn: 'Gross interest is taxable under Financial Assets. Bank deducts 10% TDS (with PSR) or 15% TDS (without PSR) at source, which is adjustable against total tax liability.',
    summaryBn: 'মোট সুদ করযোগ্য। ব্যাংক পিএসআর থাকলে ১০% এবং না থাকলে ১৫% হারে উৎসে কর কর্তন করে, যা মোট করের সাথে সমন্বয়যোগ্য।',
    documentationEn: ['Bank TDS certificate / interest certificate', 'Annual bank account statement showing interest and tax withheld'],
    documentationBn: ['ব্যাংকের সুদ ও টিডিএস প্রত্যয়নপত্র', 'বার্ষিক ব্যাংক স্টেটমেন্ট']
  },
  {
    id: 'cash_loan_unexplained',
    nameEn: 'Cash Loans ≥ BDT 500,000 (Non-Banking)',
    nameBn: 'নগদ গৃহীত ঋণ ≥ ৫,০০,০০০ টাকা (ব্যাংক ব্যতীত)',
    headEn: 'Deemed Unexplained Income (Sec 67(11))',
    headBn: 'কাল্পনিক গোপন আয় (ধারা ৬৭(১১))',
    status: 'DEEMED_RISK',
    governingSection: 'Section 67(11) of Income Tax Act 2023',
    summaryEn: 'Any loan or financial accommodation of BDT 500,000 or more received in cash rather than crossed cheque / bank transfer is treated as deemed taxable unexplained income.',
    summaryBn: '৫ লাখ টাকা বা তদূর্ধ্ব যে কোনো ঋণ বা আর্থিক সুবিধা ব্যাংকিং মাধ্যম ছাড়া নগদে গ্রহণ করিলে উহা করদাতার কাল্পনিক গোপন আয় হিসেবে গণ্য হবে।',
    documentationEn: ['Formal signed loan agreement', 'Crossed cheque / bank credit advice', 'Lender TIN & source of funds'],
    documentationBn: ['স্ট্যাম্পে স্বাক্ষরিত ঋণ চুক্তি', 'অ্যাকাউন্ট পেয়ী চেক বা ব্যাংক জমা স্লিপ', 'ঋণদাতার টিআইএন ও আয়ের উৎস']
  },
  {
    id: 'lottery_gaming',
    nameEn: 'Lottery & Gaming Winnings',
    nameBn: 'লটারি ও জুয়া/অনলাইন গেমসের পুরস্কার',
    headEn: 'Other Sources / Special Withholding (Sec 118)',
    headBn: 'অন্যান্য উৎস / বিশেষ উৎসে কর (ধারা ১১৮)',
    status: 'SPECIAL_TDS',
    governingSection: 'Section 118 (Finance Act 2026: 25% TDS) & Sec 67(10)',
    summaryEn: 'Gross prize money is subject to 25% mandatory tax deduction at source. Requires proper reporting in return per Section 163 rules.',
    summaryBn: 'মোট পুরস্কারের অর্থের উপর ২৫% হারে উৎসে কর কর্তন করা হয় (অর্থ আইন ২০২৬)। রিটার্নে বিধি মোতাবেক প্রদর্শন বাধ্যতামূলক।',
    documentationEn: ['Official Prize Notification / Cheque', 'Organizer 25% TDS Certificate', 'Bank credit deposit slip'],
    documentationBn: ['পুরস্কার ঘোষণার চিঠি/চেক', 'আয়োজকের ২৫% টিডিএস চালান/প্রত্যয়ন', 'ব্যাংক ক্রেডিট স্লিপ']
  }
];

export const TaxableVsExemptIncomeCalculator: React.FC<Props> = ({
  className = '',
  showBengaliDefault = false
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('salary');
  const [isBengali, setIsBengali] = useState(showBengaliDefault);
  const [copied, setCopied] = useState(false);

  // --- Tab 1: Salary Exemption Calculator State ---
  const [basicSalary, setBasicSalary] = useState<number>(900000);
  const [houseRent, setHouseRent] = useState<number>(360000);
  const [medicalAllowance, setMedicalAllowance] = useState<number>(120000);
  const [conveyance, setConveyance] = useState<number>(60000);
  const [festivalBonus, setFestivalBonus] = useState<number>(150000);
  const [otherAllowances, setOtherAllowances] = useState<number>(0);

  // Computations
  const grossSalary = basicSalary + houseRent + medicalAllowance + conveyance + festivalBonus + otherAllowances;
  const oneThirdSalary = Math.round(grossSalary / 3);
  const statutoryCap = 450000;
  const exemptSalary = Math.min(oneThirdSalary, statutoryCap);
  const taxableSalary = Math.max(0, grossSalary - exemptSalary);

  // --- Tab 2: Screener State ---
  const [selectedStreamId, setSelectedStreamId] = useState<string>('salary_package');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const selectedPreset = INCOME_PRESETS.find(p => p.id === selectedStreamId) || INCOME_PRESETS[0];

  const filteredPresets = INCOME_PRESETS.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      p.nameEn.toLowerCase().includes(q) ||
      p.nameBn.toLowerCase().includes(q) ||
      p.headEn.toLowerCase().includes(q) ||
      p.governingSection.toLowerCase().includes(q)
    );
  });

  // --- Tab 3: Progressive Tax Calculator State ---
  const [taxCategory, setTaxCategory] = useState<'male' | 'female' | 'disabled' | 'freedom_fighter'>('male');
  const [disabledChildrenCount, setDisabledChildrenCount] = useState<number>(0);
  const [locationZone, setLocationZone] = useState<'dhaka_ctg' | 'other_city' | 'non_city'>('dhaka_ctg');
  const [userTaxableIncome, setUserTaxableIncome] = useState<number>(taxableSalary || 1080000);
  const [advanceTds, setAdvanceTds] = useState<number>(0);

  // Base threshold
  let baseThreshold = 350000;
  if (taxCategory === 'female') baseThreshold = 400000;
  if (taxCategory === 'disabled') baseThreshold = 475000;
  if (taxCategory === 'freedom_fighter') baseThreshold = 500000;

  const totalThreshold = baseThreshold + (disabledChildrenCount * 50000);

  // Minimum tax
  let minimumTax = 5000;
  if (locationZone === 'other_city') minimumTax = 4000;
  if (locationZone === 'non_city') minimumTax = 3000;

  // Progressive slab calculation for FY 2026–27
  const calculateSlabs = (income: number, threshold: number) => {
    if (income <= threshold) {
      return {
        slabRows: [{ label: `First BDT ${threshold.toLocaleString()}`, rate: '0%', tax: 0, taxablePortion: income }],
        totalTax: 0
      };
    }

    let remaining = income - threshold;
    const rows = [
      { label: `First BDT ${threshold.toLocaleString()} (Threshold)`, rate: '0%', tax: 0, taxablePortion: threshold }
    ];
    let taxAccum = 0;

    // Slab 1: Next 100,000 @ 5%
    if (remaining > 0) {
      const chunk = Math.min(remaining, 100000);
      const tax = chunk * 0.05;
      rows.push({ label: 'Next BDT 100,000', rate: '5%', tax, taxablePortion: chunk });
      taxAccum += tax;
      remaining -= chunk;
    }

    // Slab 2: Next 400,000 @ 10%
    if (remaining > 0) {
      const chunk = Math.min(remaining, 400000);
      const tax = chunk * 0.10;
      rows.push({ label: 'Next BDT 400,000', rate: '10%', tax, taxablePortion: chunk });
      taxAccum += tax;
      remaining -= chunk;
    }

    // Slab 3: Next 500,000 @ 15%
    if (remaining > 0) {
      const chunk = Math.min(remaining, 500000);
      const tax = chunk * 0.15;
      rows.push({ label: 'Next BDT 500,000', rate: '15%', tax, taxablePortion: chunk });
      taxAccum += tax;
      remaining -= chunk;
    }

    // Slab 4: Next 500,000 @ 20%
    if (remaining > 0) {
      const chunk = Math.min(remaining, 500000);
      const tax = chunk * 0.20;
      rows.push({ label: 'Next BDT 500,000', rate: '20%', tax, taxablePortion: chunk });
      taxAccum += tax;
      remaining -= chunk;
    }

    // Slab 5: Remaining @ 25%
    if (remaining > 0) {
      const chunk = remaining;
      const tax = chunk * 0.25;
      rows.push({ label: 'Balance Amount', rate: '25%', tax, taxablePortion: chunk });
      taxAccum += tax;
      remaining = 0;
    }

    return { slabRows: rows, totalTax: taxAccum };
  };

  const { slabRows, totalTax } = calculateSlabs(userTaxableIncome, totalThreshold);
  const appliedTax = userTaxableIncome > totalThreshold ? Math.max(totalTax, minimumTax) : 0;
  const netPayable = Math.max(0, appliedTax - advanceTds);
  const refundDue = advanceTds > appliedTax ? advanceTds - appliedTax : 0;

  // --- Tab 4: Interactive Checklist State with localStorage ---
  const CHECKLIST_ITEMS = [
    { id: 'c1', en: 'Signed Employer Salary Certificate with basic & allowance breakdown', bn: 'মূল বেতন ও ভাতাদিসহ স্বাক্ষরিত নিয়োগকর্তার বেতন সনদ' },
    { id: 'c2', en: 'Bank statements reconciling salary, rent and business credits', bn: 'বেতন, বাড়িভাড়া ও ব্যবসায়িক লেনদেনের পূর্ণাঙ্গ ব্যাংক বিবরণী' },
    { id: 'c3', en: 'Statutory exemption computation (Sixth Schedule Part 1, Para 1)', bn: 'আইনসম্মত করমুক্ত আয়ের হিসাব (ষষ্ঠ তফসিল খণ্ড ১, প্যারা ১)' },
    { id: 'c4', en: 'Foreign currency remittance Proceed Realization Certificates (PRC)', bn: 'অনুমোদিত ব্যাংক প্রদত্ত বৈদেশিক মুদ্রা নগদায়ন সনদ (PRC)' },
    { id: 'c5', en: 'Proof of Return Submission (PSR) from bank/financial institutions', bn: 'ব্যাংক ও আর্থিক প্রতিষ্ঠান হতে প্রাপ্ত রিটার্ন দাখিল প্রমাণক (PSR)' },
    { id: 'c6', en: 'Registered gift deeds & donor tax return acknowledgement slips', bn: 'উপহারের রেজিস্ট্রিকৃত দলিল এবং দাতার রিটার্ন প্রাপ্তিস্বীকার পত্র' },
    { id: 'c7', en: 'Withholding tax (TDS) certificates on interest, lottery or services', bn: 'ব্যাংক সুদ, লটারি বা চুক্তির ওপর সংগৃহীত টিডিএস চালান/সনদ' },
    { id: 'c8', en: 'Tenancy agreements, municipal holding tax and utility receipts', bn: 'ভাড়া চুক্তিপত্র, পৌরসভা/সিটি কর্পোরেশন হোল্ডিং ট্যাক্স রশিদ' },
    { id: 'c9', en: 'Investment tax rebate proofs (DPS, Life Insurance, Sanchayapatra)', bn: 'বিনিয়োগ কর রেয়াত সংক্রান্ত প্রমাণক (ডিপিএস, জীবন বীমা, সঞ্চয়পত্র)' },
    { id: 'c10', en: 'e-Return statement draft matching Asset & Liability (IT-10B)', bn: 'পরম্পরা সম্পদ ও দায় বিবরণীর (IT-10B) সাথে সমন্বয়কৃত ই-রিটার্ন খসড়া' }
  ];

  const STORAGE_KEY = 'bd_taxable_vs_exempt_checklist_v1';
  const [checkedIds, setCheckedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : ['c1', 'c2', 'c3'];
    } catch {
      return ['c1', 'c2', 'c3'];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedIds));
    } catch {
      // ignore
    }
  }, [checkedIds]);

  const toggleCheck = (id: string) => {
    setCheckedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const resetChecklist = () => {
    setCheckedIds([]);
  };

  const copySummary = () => {
    const text = isBengali
      ? `=== করযোগ্য ও করমুক্ত আয় সারাংশ (অর্থবছর ২০২৬-২৭) ===
মোট বেতন আয়: BDT ${grossSalary.toLocaleString()}
করমুক্ত বেতন (১/৩ বা ৪.৫ লাখের কম): BDT ${exemptSalary.toLocaleString()}
করযোগ্য বেতন: BDT ${taxableSalary.toLocaleString()}
করমুক্ত সীমা: BDT ${totalThreshold.toLocaleString()}
প্রদেয় নিট কর: BDT ${netPayable.toLocaleString()}
ই-লয়ার্স বাংলাদেশ ট্যাক্স কম্প্লায়েন্স প্ল্যাটফর্ম`
      : `=== Taxable vs. Exempt Income Summary (FY 2026–27) ===
Gross Employment Income: BDT ${grossSalary.toLocaleString()}
Statutory Exemption (Lesser of 1/3 or 450k): BDT ${exemptSalary.toLocaleString()}
Net Taxable Salary: BDT ${taxableSalary.toLocaleString()}
Applicable Tax-Free Threshold: BDT ${totalThreshold.toLocaleString()}
Net Payable Tax: BDT ${netPayable.toLocaleString()}
Prepared via E-Lawyers Bangladesh Tax Compliance Platform`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getStatusBadge = (status: IncomeStreamPreset['status']) => {
    switch (status) {
      case 'EXEMPT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isBengali ? 'শতভাগ করমুক্ত' : 'Fully Exempt (0%)'}
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <TrendingDown className="w-3.5 h-3.5" />
            {isBengali ? 'আংশিক করমুক্ত' : 'Partially Exempt'}
          </span>
        );
      case 'SPECIAL_TDS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <DollarSign className="w-3.5 h-3.5" />
            {isBengali ? 'উৎসে কর (TDS)' : 'Special TDS / Withholding'}
          </span>
        );
      case 'TAXABLE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
            <FileText className="w-3.5 h-3.5" />
            {isBengali ? 'স্বাভাবিক করযোগ্য' : 'Fully Taxable (Slab Rate)'}
          </span>
        );
      case 'DEEMED_RISK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertTriangle className="w-3.5 h-3.5" />
            {isBengali ? 'উচ্চ ঝুঁকিপূর্ণ গোপন আয়' : 'Deemed Unexplained Risk'}
          </span>
        );
    }
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden ${className}`}>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 sm:p-7 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                FY 2026–27 Statutory Interactive Tool
              </span>
              <span className="text-slate-400 text-xs">Act No. 12 of 2023</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Calculator className="w-6 h-6 text-emerald-400 shrink-0" />
              {isBengali
                ? 'করযোগ্য ও করমুক্ত আয় গণক ও যাচাইকরণ টুল'
                : 'Taxable vs. Non-Taxable Income Screener & Calculator'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              {isBengali
                ? 'বেতন অব্যাহতি (১/৩ বা ৪.৫০ লাখ), ৭টি আয়ের খাত, ফ্রিল্যান্সিং রেমিট্যান্স, ব্যক্তিগত করমুক্ত সীমা ও প্রগতিশীল ট্যাক্স স্ল্যাব যাচাই।'
                : 'Interactive salary exemption formula, 7 statutory heads screening, ITES remittances, personal thresholds, and progressive slab tax calculator.'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsBengali(!isBengali)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors flex items-center gap-1.5"
              title="Toggle English / বাংলা"
            >
              {isBengali ? 'Switch to English' : 'বাংলায় দেখুন'}
            </button>
            <button
              onClick={copySummary}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors flex items-center gap-1.5"
              title="Copy Summary"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? (isBengali ? 'কপি হয়েছে' : 'Copied') : isBengali ? 'সারাংশ কপি' : 'Copy Summary'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setActiveTab('salary')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'salary'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'bg-white/10 hover:bg-white/15 text-slate-200'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            {isBengali ? '১. বেতন করমুক্ত হিসাব (১/৩ বা ৪.৫ লাখ)' : '1. Salary Exemption (1/3rd or 450k)'}
          </button>
          <button
            onClick={() => setActiveTab('screener')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'screener'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'bg-white/10 hover:bg-white/15 text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            {isBengali ? '২. আয়ের খাত ও যাচাইকরণ' : '2. 7 Heads & Category Screener'}
          </button>
          <button
            onClick={() => {
              setActiveTab('tax_calc');
              setUserTaxableIncome(taxableSalary);
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'tax_calc'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'bg-white/10 hover:bg-white/15 text-slate-200'
            }`}
          >
            <Calculator className="w-4 h-4" />
            {isBengali ? '৩. প্রগতিশীল কর স্ল্যাব গণক' : '3. Progressive Tax Slab Calc'}
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'checklist'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'bg-white/10 hover:bg-white/15 text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            {isBengali ? '৪. অডিট ও নথি চেকলিস্ট' : '4. Audit Defense Checklist'}
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-emerald-300">
              {checkedIds.length}/{CHECKLIST_ITEMS.length}
            </span>
          </button>
        </div>
      </div>

      {/* Tab 1: Salary Exemption Calculator */}
      {activeTab === 'salary' && (
        <div className="p-6 sm:p-8 space-y-6">
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-emerald-950">
              <p className="font-bold mb-1">
                {isBengali
                  ? 'আইনি বিধান: আয়কর আইন ২০২৩-এর ষষ্ঠ তফসিল, খণ্ড ১, প্যারা ১'
                  : 'Statutory Rule: Sixth Schedule, Part 1, Paragraph 1 of the Income Tax Act, 2023'}
              </p>
              <p>
                {isBengali
                  ? 'চাকরি হতে প্রাপ্ত মোট আয়ের এক-তৃতীয়াংশ (১/৩) অথবা ৪,৫০,০০০ টাকার মধ্যে যাহা কম, তাহা করমুক্ত হইবে। পৃথকভাবে বাড়িভাড়া বা চিকিৎসা ভাতার অব্যাহতি গ্রহণের কোনো অবকাশ নাই।'
                  : 'Total exempt employment income is strictly the lesser of one-third (1/3) of gross salary receipts or BDT 450,000. Separate carve-outs for house rent or conveyance no longer apply under the 2023 Act.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Inputs Column */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                {isBengali ? 'বার্ষিক বেতন ও ভাতার বিবরণ (টাকায়)' : 'Annual Salary Breakdown (BDT)'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isBengali ? 'মূল বেতন (Basic Salary)' : 'Basic Salary'}
                  </label>
                  <input
                    type="number"
                    value={basicSalary || ''}
                    onChange={e => setBasicSalary(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium text-slate-900"
                    placeholder="e.g. 900000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isBengali ? 'বাড়িভাড়া ভাতা (House Rent)' : 'House Rent Allowance'}
                  </label>
                  <input
                    type="number"
                    value={houseRent || ''}
                    onChange={e => setHouseRent(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium text-slate-900"
                    placeholder="e.g. 360000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isBengali ? 'চিকিৎসা ভাতা (Medical Allowance)' : 'Medical Allowance'}
                  </label>
                  <input
                    type="number"
                    value={medicalAllowance || ''}
                    onChange={e => setMedicalAllowance(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium text-slate-900"
                    placeholder="e.g. 120000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isBengali ? 'যাতায়াত ভাতা (Conveyance)' : 'Conveyance Allowance'}
                  </label>
                  <input
                    type="number"
                    value={conveyance || ''}
                    onChange={e => setConveyance(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium text-slate-900"
                    placeholder="e.g. 60000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isBengali ? 'উৎসব বোনাস (Festival Bonus)' : 'Festival Bonuses'}
                  </label>
                  <input
                    type="number"
                    value={festivalBonus || ''}
                    onChange={e => setFestivalBonus(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium text-slate-900"
                    placeholder="e.g. 150000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isBengali ? 'অন্যান্য সুবিধাদি / পারকুইজিট' : 'Other Benefits / Perquisites'}
                  </label>
                  <input
                    type="number"
                    value={otherAllowances || ''}
                    onChange={e => setOtherAllowances(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium text-slate-900"
                    placeholder="e.g. 0"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">
                  {isBengali ? 'নমুনা বেতন প্যাকেজ:' : 'Sample Packages:'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setBasicSalary(600000);
                    setHouseRent(240000);
                    setMedicalAllowance(60000);
                    setConveyance(30000);
                    setFestivalBonus(100000);
                    setOtherAllowances(0);
                  }}
                  className="px-2.5 py-1 text-xs rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                >
                  BDT 1,030,000 (Mid)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBasicSalary(900000);
                    setHouseRent(360000);
                    setMedicalAllowance(120000);
                    setConveyance(60000);
                    setFestivalBonus(150000);
                    setOtherAllowances(0);
                  }}
                  className="px-2.5 py-1 text-xs rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                >
                  BDT 1,590,000 (Senior)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBasicSalary(1800000);
                    setHouseRent(720000);
                    setMedicalAllowance(180000);
                    setConveyance(120000);
                    setFestivalBonus(300000);
                    setOtherAllowances(180000);
                  }}
                  className="px-2.5 py-1 text-xs rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                >
                  BDT 3,300,000 (Executive)
                </button>
              </div>
            </div>

            {/* Computation Results Card */}
            <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-6 shadow-lg space-y-5">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <span className="text-xs font-semibold uppercase text-emerald-400 tracking-wider">
                  {isBengali ? 'আইনসঙ্গত ফলাফল' : 'Statutory Computation'}
                </span>
                <span className="text-xs text-slate-400">Sixth Sched. Pt 1</span>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center text-slate-300">
                  <span>{isBengali ? 'মোট বার্ষিক বেতন (Gross)' : 'Gross Employment Income'}:</span>
                  <span className="font-mono font-bold text-white text-base">
                    BDT {grossSalary.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-300">
                  <span>{isBengali ? '১/৩ অংশ (One-Third)' : '1/3rd of Gross'}:</span>
                  <span className="font-mono text-slate-200">
                    BDT {oneThirdSalary.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-300">
                  <span>{isBengali ? 'সংবিধিবদ্ধ সর্বোচ্চ সীমা (Cap)' : 'Statutory Ceiling Cap'}:</span>
                  <span className="font-mono text-slate-200">
                    BDT {statutoryCap.toLocaleString()}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-700/80 flex justify-between items-center text-emerald-300">
                  <span className="font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {isBengali ? 'অনুমোদিত করমুক্ত অংশ' : 'Allowable Exempt Portion'}:
                  </span>
                  <span className="font-mono font-bold text-lg text-emerald-300">
                    - BDT {exemptSalary.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Taxable Salary Highlight Box */}
              <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10 text-center">
                <p className="text-xs text-slate-300 uppercase tracking-wider font-semibold mb-1">
                  {isBengali ? 'চূড়ান্ত করযোগ্য বেতন (Taxable Salary)' : 'Net Taxable Salary (Sec 32)'}
                </p>
                <p className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
                  BDT {taxableSalary.toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {isBengali
                    ? `(মোট বেতন ${grossSalary.toLocaleString()} - অব্যাহতি ${exemptSalary.toLocaleString()})`
                    : `(Gross ${grossSalary.toLocaleString()} - Exempt ${exemptSalary.toLocaleString()})`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setUserTaxableIncome(taxableSalary);
                  setActiveTab('tax_calc');
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <Calculator className="w-4 h-4" />
                {isBengali
                  ? 'এই আয়ের ওপর কর হিসাব করুন →'
                  : 'Calculate Tax on This Salary →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Seven Heads & Category Screener */}
      {activeTab === 'screener' && (
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isBengali ? 'আয়ের খাত ও করযোগ্যতা অনুসন্ধান' : 'Income Heads & Taxability Screener'}
              </h3>
              <p className="text-xs text-slate-500">
                {isBengali
                  ? 'যে কোনো আয়ের উৎস নির্বাচন করে তার আইনি ধারা, করের হার ও প্রয়োজনীয় কাগজপত্র দেখুন।'
                  : 'Select an income stream to review its statutory classification, exemption eligibility, and required audit documents.'}
              </p>
            </div>

            <div className="w-full sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={isBengali ? 'আয় বা ধারা খুঁজুন...' : 'Search income stream or section...'}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* List of streams */}
            <div className="lg:col-span-5 space-y-2 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
              {filteredPresets.map(preset => {
                const isSelected = preset.id === selectedStreamId;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedStreamId(preset.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs sm:text-sm font-bold text-slate-900">
                        {isBengali ? preset.nameBn : preset.nameEn}
                      </span>
                      {getStatusBadge(preset.status)}
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      {isBengali ? preset.headBn : preset.headEn}
                    </span>
                  </button>
                );
              })}

              {filteredPresets.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">
                  {isBengali ? 'কোনো ফলাফল পাওয়া যায়নি।' : 'No matching income streams found.'}
                </div>
              )}
            </div>

            {/* Details panel for selected stream */}
            <div className="lg:col-span-7 bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-5">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusBadge(selectedPreset.status)}
                    <span className="text-xs font-mono text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                      {selectedPreset.governingSection}
                    </span>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900">
                    {isBengali ? selectedPreset.nameBn : selectedPreset.nameEn}
                  </h4>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    {isBengali ? selectedPreset.headBn : selectedPreset.headEn}
                  </p>
                </div>
              </div>

              {/* Legal explanation */}
              <div>
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-emerald-600" />
                  {isBengali ? 'আইনি ব্যাখ্যা ও কর নীতিমালা' : 'Statutory Rule & Treatment'}
                </h5>
                <p className="text-xs sm:text-sm text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200 leading-relaxed">
                  {isBengali ? selectedPreset.summaryBn : selectedPreset.summaryEn}
                </p>
              </div>

              {/* Required Documentation */}
              <div>
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  {isBengali ? 'অডিট ও কর ফাইলিংয়ের জন্য আবশ্যকীয় কাগজপত্র' : 'Mandatory Audit Defense Documents'}
                </h5>
                <ul className="space-y-2">
                  {(isBengali ? selectedPreset.documentationBn : selectedPreset.documentationEn).map((doc, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-slate-800 bg-white px-3 py-2 rounded-lg border border-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Progressive Tax Slab Calculator */}
      {activeTab === 'tax_calc' && (
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Options & Income Input */}
            <div className="lg:col-span-6 space-y-5">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-600" />
                {isBengali ? 'করদাতার তথ্য ও করযোগ্য আয়' : 'Taxpayer Profile & Taxable Income'}
              </h3>

              {/* Taxable Income Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    {isBengali ? 'মোট করযোগ্য আয় (Taxable Income BDT)' : 'Total Taxable Income (BDT)'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setUserTaxableIncome(taxableSalary)}
                    className="text-[11px] text-emerald-700 hover:underline font-semibold"
                  >
                    {isBengali ? 'বেতন হিসাব থেকে নিন' : 'Pull from Salary Tab'}
                  </button>
                </div>
                <input
                  type="number"
                  value={userTaxableIncome || ''}
                  onChange={e => setUserTaxableIncome(Number(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 text-base font-bold text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                  placeholder="e.g. 1080000"
                />
              </div>

              {/* Taxpayer Category Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {isBengali ? 'করদাতার শ্রেণি (করমুক্ত সীমা)' : 'Taxpayer Category (Tax-Free Threshold)'}
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setTaxCategory('male')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      taxCategory === 'male'
                        ? 'bg-emerald-50 border-emerald-500 font-bold text-emerald-950'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>{isBengali ? 'সাধারণ পুরুষ' : 'General (Male)'}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">BDT 350,000</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTaxCategory('female')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      taxCategory === 'female'
                        ? 'bg-emerald-50 border-emerald-500 font-bold text-emerald-950'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>{isBengali ? 'নারী / জ্যেষ্ঠ নাগরিক (৬৫+)' : 'Female / Senior (65+)'}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">BDT 400,000</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTaxCategory('disabled')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      taxCategory === 'disabled'
                        ? 'bg-emerald-50 border-emerald-500 font-bold text-emerald-950'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>{isBengali ? 'প্রতিবন্ধী ব্যক্তি' : 'Physically Challenged'}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">BDT 475,000</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTaxCategory('freedom_fighter')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      taxCategory === 'freedom_fighter'
                        ? 'bg-emerald-50 border-emerald-500 font-bold text-emerald-950'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>{isBengali ? 'গেজেটভুক্ত মুক্তিযোদ্ধা' : 'War-Wounded Veteran'}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">BDT 500,000</div>
                  </button>
                </div>
              </div>

              {/* Dependent Disabled Children */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBengali
                    ? 'প্রতিবন্ধী সন্তান/পোষ্য সংখ্যা (+৫০,০০০ টাকা সীমা)'
                    : 'Disabled Child/Dependent Count (+50k BDT threshold each)'}
                </label>
                <select
                  value={disabledChildrenCount}
                  onChange={e => setDisabledChildrenCount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={0}>{isBengali ? '০ (কোনোটি নয়)' : '0 (None)'}</option>
                  <option value={1}>{isBengali ? '১ সন্তান (+৫০,০০০ টাকা)' : '1 Child (+50,000 BDT)'}</option>
                  <option value={2}>{isBengali ? '২ সন্তান (+১,০০,০০০ টাকা)' : '2 Children (+100,000 BDT)'}</option>
                  <option value={3}>{isBengali ? '৩ সন্তান (+১,৫০,০০০ টাকা)' : '3 Children (+150,000 BDT)'}</option>
                </select>
              </div>

              {/* Location for Minimum Tax */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBengali ? 'বাসস্থান / কর্মস্থল এলাকা (ন্যূনতম কর)' : 'Location for Minimum Tax (Sec 163)'}
                </label>
                <select
                  value={locationZone}
                  onChange={e => setLocationZone(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="dhaka_ctg">
                    {isBengali ? 'ঢাকা ও চট্টগ্রাম সিটি কর্পোরেশন (ন্যূনতম ৫,০০০ টাকা)' : 'Dhaka & Chittagong City Corp (Min BDT 5,000)'}
                  </option>
                  <option value="other_city">
                    {isBengali ? 'অন্যান্য সিটি কর্পোরেশন এলাকা (ন্যূনতম ৪,০০০ টাকা)' : 'Other City Corporations (Min BDT 4,000)'}
                  </option>
                  <option value="non_city">
                    {isBengali ? 'সিটি কর্পোরেশনের বাইরের জেলা/পৌরসভা (ন্যূনতম ৩,০০০ টাকা)' : 'Municipalities / District Areas (Min BDT 3,000)'}
                  </option>
                </select>
              </div>

              {/* Advance TDS Deduction */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBengali ? 'পূর্বে কর্তিত অগ্রিম আয়কর / টিডিএস (টাকায়)' : 'Advance Tax / TDS Already Deducted (BDT)'}
                </label>
                <input
                  type="number"
                  value={advanceTds || ''}
                  onChange={e => setAdvanceTds(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  placeholder="e.g. 10000"
                />
              </div>
            </div>

            {/* Computation Breakdown Table & Net Result */}
            <div className="lg:col-span-6 space-y-5">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {isBengali ? 'স্ল্যাবভিত্তিক কর হিসাব (অর্থবছর ২০২৬-২৭)' : 'Progressive Slab Computation'}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-700">
                    Threshold: BDT {totalThreshold.toLocaleString()}
                  </span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-300 text-slate-500 font-semibold">
                        <th className="py-2">{isBengali ? 'আয় স্ল্যাব' : 'Income Slab'}</th>
                        <th className="py-2 text-center">{isBengali ? 'হার' : 'Rate'}</th>
                        <th className="py-2 text-right">{isBengali ? 'কর (টাকা)' : 'Tax (BDT)'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      {slabRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-white/60">
                          <td className="py-2 text-slate-800 font-sans">{row.label}</td>
                          <td className="py-2 text-center text-slate-600 font-bold">{row.rate}</td>
                          <td className="py-2 text-right font-bold text-slate-900">
                            {row.tax.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Statutory Minimum Tax Check */}
                <div className="pt-2 border-t border-slate-200 text-xs space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>{isBengali ? 'স্ল্যাবভিত্তিক মোট স্বাভাবিক কর:' : 'Calculated Slab Tax:'}</span>
                    <span className="font-mono font-bold text-slate-900">BDT {totalTax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isBengali ? 'আইনসম্মত প্রযোজ্য ন্যূনতম কর:' : 'Statutory Minimum Tax:'}</span>
                    <span className="font-mono text-slate-700">BDT {minimumTax.toLocaleString()}</span>
                  </div>
                  {totalTax > 0 && totalTax < minimumTax && (
                    <p className="text-[11px] text-amber-700 font-semibold bg-amber-50 p-2 rounded border border-amber-200">
                      {isBengali
                        ? `* স্বাভাবিক কর (${totalTax} টাকা) এলাকাভিত্তিক ন্যূনতম কর (${minimumTax} টাকা)-এর চেয়ে কম হওয়ায় ন্যূনতম কর প্রযোজ্য হইবে।`
                        : `* Since calculated slab tax (${totalTax}) is less than statutory minimum (${minimumTax}), minimum tax applies.`}
                    </p>
                  )}
                </div>
              </div>

              {/* Summary Bottom Box */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-center text-sm text-slate-300">
                  <span>{isBengali ? 'মোট কর দায় (Gross Tax):' : 'Gross Tax Payable:'}</span>
                  <span className="font-mono font-bold text-white text-base">
                    BDT {appliedTax.toLocaleString()}
                  </span>
                </div>

                {advanceTds > 0 && (
                  <div className="flex justify-between items-center text-sm text-slate-300">
                    <span>{isBengali ? 'কর্তিত টিডিএস সমন্বয়:' : 'Less Advance TDS:'}</span>
                    <span className="font-mono text-emerald-400">
                      - BDT {advanceTds.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-700 flex justify-between items-center">
                  <div>
                    <span className="text-xs uppercase text-slate-400 tracking-wider block font-semibold">
                      {refundDue > 0
                        ? (isBengali ? 'এনবিআর হতে রিফান্ড প্রাপ্য' : 'Refund Claimable from NBR')
                        : (isBengali ? 'পরিশোধযোগ্য নিট কর' : 'Net Tax Payable (Challan)')}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {isBengali ? 'ই-রিটার্নে চালান বা রিফান্ড দাবিসহ দাখিল' : 'Pay via A-Challan / e-Return'}
                    </span>
                  </div>
                  <span className={`text-2xl font-black font-mono ${refundDue > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    BDT {(refundDue > 0 ? refundDue : netPayable).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Audit Defense Checklist */}
      {activeTab === 'checklist' && (
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isBengali ? 'আয়কর রিটার্ন ও অডিট প্রতিরক্ষা চেকলিস্ট' : 'Income Tax Return & Audit Defense Checklist'}
              </h3>
              <p className="text-xs text-slate-500">
                {isBengali
                  ? 'আপনার প্রস্তুতকৃত নথিসমূহ টিক দিন। তথ্য স্বয়ংক্রিয়ভাবে লোকাল স্টোরেজে সংরক্ষিত থাকে।'
                  : 'Tick off the documents you have ready. Your checklist is persisted in localStorage across visits.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                {Math.round((checkedIds.length / CHECKLIST_ITEMS.length) * 100)}% {isBengali ? 'প্রস্তুত' : 'Ready'}
              </span>
              <button
                type="button"
                onClick={resetChecklist}
                className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                {isBengali ? 'রিসেট' : 'Reset'}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${(checkedIds.length / CHECKLIST_ITEMS.length) * 100}%` }}
            />
          </div>

          {/* Checklist Items */}
          <div className="space-y-2.5">
            {CHECKLIST_ITEMS.map((item, idx) => {
              const isChecked = checkedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                    isChecked
                      ? 'bg-emerald-50/70 border-emerald-300 text-slate-900'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                      isChecked
                        ? 'bg-emerald-600 text-white'
                        : 'border border-slate-300 bg-white'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div className="text-xs sm:text-sm font-medium flex-1">
                    {isBengali ? item.bn : item.en}
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    #{idx + 1}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600">
              <p className="font-semibold text-slate-800 mb-0.5">
                {isBengali ? 'ধারা ১৮০ (সর্বোত্তম মূল্যায়ন) এবং ধারা ২১২ (অডিট) সতর্কতা:' : 'Statutory Notice for Section 180 & Section 212 Audits:'}
              </p>
              <p>
                {isBengali
                  ? 'উপযুক্ত স্বপক্ষীয় প্রমাণক (যেমন- পিআরসি, ব্যাংক বিবরণী বা উপহারের হলফনামা) সংরক্ষিত না থাকলে কর কমিশনার বা সার্কেল কর্মকর্তা করমুক্ত সুবিধাসমূহ বাতিল করে গোপন আয় হিসেবে ধার্য করতে পারেন।'
                  : 'Failing to maintain contemporaneous banking trail, Proceeds Realization Certificates, or registered gift acknowledgements allows assessing officers to reject exemption claims and treat receipts as deemed unexplained investments.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Building className="w-3.5 h-3.5 text-emerald-700" />
          <span>E-Lawyers Bangladesh Direct Tax Compliance Advisory</span>
        </div>
        <div className="text-[11px] text-slate-400">
          Statutory references verified against Bangladesh Income Tax Act 2023 & Finance Act 2026.
        </div>
      </div>
    </div>
  );
};
