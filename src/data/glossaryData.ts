export interface GlossaryTerm {
  id: string;
  term: string;
  shortTerm: string;
  bengaliTerm: string;
  category: 'income-tax' | 'vat' | 'exemptions' | 'compliance' | 'corporate';
  categoryLabel: string;
  summary: string;
  actReference: string;
  keyProvisions: string[];
  ratesOrLimits?: string;
  practicalExample?: {
    scenario: string;
    calculation?: string;
    outcome: string;
  };
  complianceRules?: string[];
  documentsRequired?: string[];
  penaltiesOrConsequences?: string;
  relatedTerms: string[];
  relatedLinks?: {
    title: string;
    url: string;
  }[];
  featured?: boolean;
  tags: string[];
}

export interface TermComparison {
  id: string;
  title: string;
  bengaliTitle: string;
  description: string;
  termA: {
    name: string;
    basis: string;
    governingLaw: string;
    rateOrScope: string;
    keyObligation: string;
    consequence: string;
  };
  termB: {
    name: string;
    basis: string;
    governingLaw: string;
    rateOrScope: string;
    keyObligation: string;
    consequence: string;
  };
}

export interface QuizQuestion {
  id: number;
  question: string;
  bengaliQuestion: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  statutoryReference: string;
}

export const glossaryCategories = [
  { id: 'all', label: 'All Terms', count: 22 },
  { id: 'income-tax', label: 'Income Tax Act, 2023', count: 8 },
  { id: 'vat', label: 'VAT & SD Act, 2012', count: 6 },
  { id: 'exemptions', label: 'Exemptions & Schedules', count: 4 },
  { id: 'compliance', label: 'Compliance & Verification', count: 4 },
];

export const glossaryTerms: GlossaryTerm[] = [
  {
    id: 'tds',
    term: 'TDS (Tax Deduction at Source)',
    shortTerm: 'TDS',
    bengaliTerm: 'উৎসে কর কর্তন',
    category: 'income-tax',
    categoryLabel: 'Income Tax Act, 2023',
    featured: true,
    summary: 'A statutory tax collection mechanism whereby the payer deducts income tax directly from eligible payments at source and deposits it to the government treasury on behalf of the payee.',
    actReference: 'Income Tax Act, 2023 — Chapter VII, Sections 86 to 142 (with amended rates under Finance Act, 2026)',
    keyProvisions: [
      'Statutory obligation of designated withholding entities (specified persons under Section 87) to deduct tax before releasing payments.',
      'Applies to over 50 transaction types including salaries (Sec 86), contractor/supply payments (Sec 89), office rent (Sec 109), commissions (Sec 106), lottery/winnings (Sec 118: 25%), and foreign remittances for services (Sec 124).',
      'Deductions must be deposited into the government exchequer via automated e-Challan / A-Challan within statutory timelines (generally within 2 weeks of deduction).',
      'TDS is in some cases treated as minimum tax liability under Section 163 and cannot be refunded or adjusted against other heads.'
    ],
    ratesOrLimits: 'Varies by transaction: Salaries (slab rate), Supply of goods (2%–7%), Contractor services (10%–12%), Office rent (5%), Commission (10%), Lottery/gaming winnings (25% under amended Sec 118), Inward IT remittance (exempt if qualifying ITES).',
    practicalExample: {
      scenario: 'A company pays office rent of BDT 100,000 per month to an individual landlord.',
      calculation: 'Under Section 109, the tenant company must deduct 5% TDS: BDT 100,000 × 5% = BDT 5,000. Tenant pays landlord net BDT 95,000 and deposits BDT 5,000 to the government treasury via e-Challan.',
      outcome: 'Tenant issues a TDS certificate to landlord. Landlord claims BDT 5,000 credit against their final income tax assessment. If the tenant fails to deduct, the entire BDT 100,000 rental expense is disallowed from company expenditure under Section 55.'
    },
    complianceRules: [
      'Withholding entity must verify recipient’s Proof of Submission of Return (PSR) under Section 264 (50% higher TDS rate applies if PSR is not furnished where required).',
      'Deposit deducted tax through Bangladesh Bank / Sonali Bank automated e-Challan or A-Challan within prescribed schedule.',
      'Furnish mandatory quarterly withholding tax statements under Section 177 to the respective Taxes Circle.',
      'Issue statutory deduction certificates to payees so they can claim credit in their annual tax returns.'
    ],
    documentsRequired: [
      'Proof of Submission of Return (PSR) of the payee',
      'Treasury e-Challan / A-Challan of tax deposit',
      'TDS Certificate issued by withholding entity',
      'Withholding Tax Register & Bank payment vouchers'
    ],
    penaltiesOrConsequences: 'Failure to deduct or deposit TDS leads to disallowance of the entire expenditure under Section 55(ka), interest penalty of 2% per month on the unpaid amount under Section 143, and personal liability of the withholding agent.',
    relatedTerms: ['vds', 'ait', 'psr', 'sixth-schedule', 'minimum-tax'],
    relatedLinks: [
      { title: 'TDS on Lottery, Gifts & Freelance Guide', url: '/article/tds-lottery-winnings-gifts-loans-freelance-income-bangladesh-2026-2027' },
      { title: 'TDS Reference Guide & Rates', url: '/tds-reference' },
      { title: 'Income from Other Sources (Sec 66 & 67)', url: '/article/other-sources-sections-66-67-bangladesh-tax-guide-2026' }
    ],
    tags: ['tds', 'withholding tax', 'tax deduction at source', 'income tax act 2023', 'salary tds', 'rent tds', 'section 118', 'section 89', 'challan']
  },
  {
    id: 'vat',
    term: 'VAT (Value Added Tax)',
    shortTerm: 'VAT',
    bengaliTerm: 'মূল্য সংযোজন কর (মূসক)',
    category: 'vat',
    categoryLabel: 'VAT & SD Act, 2012',
    featured: true,
    summary: 'A multi-stage indirect consumption tax levied on the value added to taxable goods and services at each point in the supply chain, from manufacture and import to retail distribution.',
    actReference: 'Value Added Tax and Supplementary Duty Act, 2012 (Act No. 47 of 2012) & VAT Rules, 2016',
    keyProvisions: [
      'Standard VAT rate of 15% with input tax credit (রেয়াত) eligibility, alongside specific truncated rates (5%, 7.5%, 10%) without input credit.',
      'Mandatory registration for entities with annual turnover exceeding BDT 30,000,000 (3 Crore) receiving a 13-digit Business Identification Number (BIN).',
      'Turnover tax rate of 4% applies for businesses with turnover between BDT 5,000,000 and BDT 30,000,000.',
      'Documented transaction flow: Mushak-6.3 tax invoice must be issued at or before the time of delivery; Mushak-9.1 monthly return is due by the 15th of the following month.'
    ],
    ratesOrLimits: 'Standard: 15% (with input tax rebate). Truncated rates: 5% (procurement provider / specific services), 7.5%, 10%. Turnover tax: 4%. Zero-rated: 0% for physical exports and deemed exports.',
    practicalExample: {
      scenario: 'A consulting firm bills a corporate client BDT 200,000 for financial advisory services subject to standard 15% VAT.',
      calculation: 'Gross fee = BDT 200,000. VAT @ 15% = BDT 30,000. Total invoice amount = BDT 230,000. Firm issues Mushak-6.3 invoice.',
      outcome: 'Client pays the invoice. If withholding entity status applies, client may withhold VDS and issue Mushak-6.6 certificate. Firm submits monthly Mushak-9.1 return by 15th of next month.'
    },
    complianceRules: [
      'Maintain statutory registers: Mushak-6.1 (Purchase Register) and Mushak-6.2 (Sales Register) in real time.',
      'Issue prescribed computerized or printed Mushak-6.3 invoice for every supply.',
      'Submit monthly Mushak-9.1 return by the 15th day of the subsequent month even if turnover is zero (nil return).',
      'Retain all VAT records and purchase challans for a statutory minimum of 5 years.'
    ],
    documentsRequired: [
      '13-digit BIN Registration Certificate',
      'Mushak-6.1 Purchase Register',
      'Mushak-6.2 Sales Register',
      'Mushak-6.3 Tax Invoice Challans',
      'Mushak-6.6 VDS Withholding Certificate',
      'Mushak-9.1 Monthly VAT Return submission acknowledgment'
    ],
    penaltiesOrConsequences: 'Failure to issue Mushak-6.3 or maintain registers incurs minimum fines of BDT 10,000 to BDT 100,000. Late filing of Mushak-9.1 incurs BDT 10,000 late fee plus 2% monthly interest on unpaid VAT dues.',
    relatedTerms: ['vds', 'bin', 'mushak-6-3', 'mushak-6-6', 'mushak-9-1', 'supplementary-duty'],
    relatedLinks: [
      { title: 'Complete Bangladesh VAT Guide', url: '/vat-guide' },
      { title: 'Turnover Tax Calculator & Guide', url: '/article/turnover-tax-guide-bangladesh' }
    ],
    tags: ['vat', 'value added tax', 'mushak', 'bin', 'nbr', 'mushak 6.3', 'mushak 9.1', 'input tax credit', 'vat act 2012']
  },
  {
    id: 'sixth-schedule',
    term: 'Sixth Schedule (ষষ্ঠ তফসিল)',
    shortTerm: 'Sixth Schedule',
    bengaliTerm: 'ষষ্ঠ তফসিল (কর অব্যাহতি ও বিনিয়োগ কর রেয়াত)',
    category: 'exemptions',
    categoryLabel: 'Exemptions & Schedules',
    featured: true,
    summary: 'The principal schedule of the Income Tax Act, 2023 governing statutory tax exemptions (Part A) and qualifying investment tax rebates (Part B). It dictates what income is non-taxable and how personal taxpayers reduce their tax liability.',
    actReference: 'Income Tax Act, 2023 — Sixth Schedule (Part A: Sections 1–34; Part B: Sections 1–16)',
    keyProvisions: [
      'Part A (অংশ ১ - কর অব্যাহতিপ্রাপ্ত আয় / Exemptions): Lists specific incomes excluded from total taxable income. Examples: 27 qualifying IT and ITES activities, export of software, agricultural income up to BDT 200,000 for small cultivators, official foreign remittances brought via banking channels, recognized pensions, gratuity up to BDT 25,000,000, and dividend income up to statutory ceiling.',
      'Part B (অংশ ২ - কর রেয়াতযোগ্য বিনিয়োগ / Investment Tax Rebate): Allows individuals to claim a tax credit against eligible savings and investments made during the income year.',
      'Allowable Investment Ceiling: Capped at the lowest of: (a) Actual eligible investments, (b) 20% of total taxable income, or (c) BDT 1,000,000 (10 Lakh taka).',
      'Rebate Calculation: 3% of the eligible allowable investment (or 15% under specific legacy schedules) is directly subtracted from gross tax liability.',
      'Eligible Investments: Deposit Pension Scheme (DPS) up to BDT 120,000 annually, life insurance premiums, treasury bonds, approved stocks on DSE/CSE, national savings certificates (Sanchayapatra), and donations to approved charitable trusts or national relief funds.'
    ],
    ratesOrLimits: 'Part A: Full or capped exemptions per category. Part B: Investment ceiling is lesser of 20% taxable income, actual investment, or BDT 1,000,000. Maximum possible tax rebate = BDT 30,000 (at 3% of BDT 1,000,000).',
    practicalExample: {
      scenario: 'A salaried taxpayer earns BDT 1,200,000 total taxable income. During the income year, they invested BDT 100,000 in DPS, BDT 50,000 in life insurance, and BDT 100,000 in government bonds (total actual investment = BDT 250,000).',
      calculation: 'Ceiling check: (1) Actual = BDT 250,000; (2) 20% of BDT 1,200,000 = BDT 240,000; (3) Statutory maximum = BDT 1,000,000. Allowable investment is BDT 240,000. Tax rebate = BDT 240,000 × 3% = BDT 7,200.',
      outcome: 'If their gross tax before rebate was BDT 55,000, their net tax payable reduces to BDT 47,800 (BDT 55,000 − BDT 7,200).'
    },
    complianceRules: [
      'Exempt income under Part A must still be formally declared in the annual income tax return (Form Return-2023) under the exempt income column.',
      'Rebate claims under Part B must be supported with original bank certificates, premium receipts, DPS statements, and broker ledger accounts.',
      'Investment instruments must be held in the taxpayer’s own name and funded from declared income sources.'
    ],
    documentsRequired: [
      'Bank certificate for DPS deposits during July–June income year',
      'Life insurance premium payment receipts and policy documents',
      'Central Depository Bangladesh Ltd (CDBL) portfolio statement / BO account statement',
      'Sanchayapatra investment certificate / Treasury bond holding statement',
      'Official receipts of donations to NBR-approved charitable funds'
    ],
    penaltiesOrConsequences: 'Failing to declare exempt income may lead assessing officers to treat funds as unexplained income under Section 67. Claiming invalid rebate without authentic documents leads to rebate rejection and back-tax reassessment.',
    relatedTerms: ['tds', 'investment-rebate', 'salary-exemption', 'minimum-tax'],
    relatedLinks: [
      { title: 'Taxable and Non-Taxable Income Guide (FY 2026–27)', url: '/article/taxable-and-non-taxable-income-bangladesh-guide-2026-2027' },
      { title: 'Investment Tax Rebate Calculator', url: '/article/tax-rebate-investment-ceiling-bangladesh' },
      { title: 'General Tax Calculator', url: '/tax-calculator' }
    ],
    tags: ['sixth schedule', 'tax exemption', 'tax rebate', 'part a', 'part b', 'dps', 'sanchayapatra', 'life insurance', 'income tax act 2023']
  },
  {
    id: 'vds',
    term: 'VDS (VAT Deduction at Source)',
    shortTerm: 'VDS',
    bengaliTerm: 'উৎসে মূসক কর্তন',
    category: 'vat',
    categoryLabel: 'VAT & SD Act, 2012',
    summary: 'A procedure requiring registered withholding entities to deduct the payable VAT amount directly from the supplier’s bill before disbursement and deposit it into the government treasury.',
    actReference: 'VAT and Supplementary Duty Act, 2012 — Section 49 & VDS Rules SRO No. 186-AIN/2019/43-Mushak',
    keyProvisions: [
      'Withholding entity must deduct VAT on designated supplies such as procurement providers, security services, transport, clearing & forwarding, advertising, and consultancy.',
      'Must issue statutory Mushak-6.6 deduction certificate to supplier within 3 working days of deduction.',
      'Deduction is not allowed if supplier provides a valid 15% Mushak-6.3 invoice showing standard rate unless explicitly mandated by SRO.',
      'Deposited into treasury under the code of the local VAT Commissionerate via e-Challan.'
    ],
    ratesOrLimits: 'Typically 5% to 15% depending on service code specified in SRO. Procurement providers: 5% or 7.5%.',
    practicalExample: {
      scenario: 'A registered corporate buyer procures printing services worth BDT 50,000 from a supplier holding a truncated 5% VAT rate.',
      calculation: 'VAT @ 5% = BDT 2,500. Buyer pays supplier BDT 50,000 (excluding VAT) and withholds BDT 2,500 to deposit into government treasury via A-Challan.',
      outcome: 'Buyer issues Form Mushak-6.6 to the supplier. Supplier uses Mushak-6.6 to adjust their monthly VAT liability in Mushak-9.1.'
    },
    complianceRules: [
      'Issue Form Mushak-6.6 in triplicate within 3 working days.',
      'Deposit deducted VAT into government treasury within 15 days.',
      'Account for VDS in Sub-form of monthly return Mushak-9.1.'
    ],
    documentsRequired: ['Mushak-6.3 supplier invoice', 'Mushak-6.6 withholding certificate', 'Treasury e-Challan'],
    penaltiesOrConsequences: 'Failure to deduct VDS results in 2% monthly interest penalty on withholding entity and joint liability for the outstanding VAT amount.',
    relatedTerms: ['vat', 'tds', 'mushak-6-6', 'mushak-6-3'],
    tags: ['vds', 'vat deduction at source', 'mushak 6.6', 'withholding vat', 'procurement']
  },
  {
    id: 'ait',
    term: 'AIT (Advance Income Tax)',
    shortTerm: 'AIT',
    bengaliTerm: 'অগ্রিম আয়কর',
    category: 'income-tax',
    categoryLabel: 'Income Tax Act, 2023',
    summary: 'Advance tax collected by the tax authority during commercial activities such as imports, vehicle registration, property transfer, or contract payments, adjustable against the final tax liability.',
    actReference: 'Income Tax Act, 2023 — Chapter VII, Sections 137, 140, 154 and Section 163',
    keyProvisions: [
      'Mandatory advance tax on imports at port of entry (Section 120/121) based on assessment value.',
      'Payable on motor vehicle fitness renewals based on engine capacity (cc) under Section 153.',
      'Payable in quarterly installments under Section 154 for taxpayers whose last assessed income exceeded BDT 600,000.',
      'Under Section 163, certain AIT payments (e.g. import of specific goods, land sales) constitute minimum tax and cannot be carried forward or refunded.'
    ],
    ratesOrLimits: 'Import AIT: 5% or specific rate. Private cars: BDT 25,000 (up to 1500cc) up to BDT 200,000 (above 3500cc). Land transfer: 8% or specific rate per katha.',
    complianceRules: [
      'Track all AIT payment challans and bill of entry records.',
      'Reconcile quarterly advance tax installments due on 15 September, 15 December, 15 March, and 15 June.',
      'Claim credit in the annual tax return with treasury challan numbers.'
    ],
    relatedTerms: ['tds', 'minimum-tax', 'income-year', 'assessment-year'],
    tags: ['ait', 'advance income tax', 'import tax', 'motor car ait', 'quarterly advance tax']
  },
  {
    id: 'psr',
    term: 'PSR (Proof of Submission of Return)',
    shortTerm: 'PSR',
    bengaliTerm: 'রিটার্ন দাখিলের প্রমাণপত্র',
    category: 'compliance',
    categoryLabel: 'Compliance & Verification',
    summary: 'The statutory acknowledgment receipt or system-generated certificate confirming that a taxpayer has submitted their annual income tax return for the relevant assessment year.',
    actReference: 'Income Tax Act, 2023 — Sections 264 & 265',
    keyProvisions: [
      'Section 264 lists 43 mandatory economic activities and government services that cannot be accessed without presenting a verified PSR.',
      'Mandatory for: bank loans above BDT 500,000, trade license renewal in city corporations/municipalities, credit card issuance, opening merchant accounts, motor vehicle registration, utility connections, import/export licenses (IRC/ERC), and company directorship.',
      'Under Section 265, organizations and commercial establishments must verify and display PSR compliance of their officers and suppliers.',
      'Withholding entities must deduct tax at a 50% higher rate if the recipient fails to produce PSR for specified payments.'
    ],
    complianceRules: [
      'Every person required to have PSR must file their return on or before Tax Day (30 November).',
      'Retain acknowledgment receipt and QR-coded digital certificate issued by NBR online filing portal (etaxnbr.gov.bd).',
      'Service providers (banks, city corporations, RJSC) must verify PSR authenticity using NBR online verification portal.'
    ],
    penaltiesOrConsequences: 'Service denial by banks and licensing bodies; 50% surcharge on TDS deductions; and penalty of BDT 10,000 to BDT 50,000 on organizations failing to verify PSR under Section 265.',
    relatedTerms: ['tin', 'tds', 'assessment-year'],
    relatedLinks: [
      { title: 'Section 265 PSR Verification & Display Guide', url: '/article/psr-display-compliance-section-265-guide' }
    ],
    tags: ['psr', 'proof of submission of return', 'section 264', 'section 265', 'trade license', 'bank loan']
  },
  {
    id: 'tin',
    term: 'e-TIN (Taxpayer Identification Number)',
    shortTerm: 'e-TIN',
    bengaliTerm: 'করদাতা শনাক্তকরণ নম্বর (ই-টিন)',
    category: 'income-tax',
    categoryLabel: 'Income Tax Act, 2023',
    summary: 'A unique 12-digit digital identifier issued by the National Board of Revenue (NBR) to identify individual and corporate tax entities in Bangladesh.',
    actReference: 'Income Tax Act, 2023 — Sections 261 to 263',
    keyProvisions: [
      '12-digit electronic number generated through the NBR online registration system.',
      'Mandatory prerequisite for opening commercial bank accounts, company incorporation at RJSC, purchasing motor vehicles, and obtaining trade licenses.',
      'Holding an e-TIN generally creates a legal obligation to file an annual income tax return under Section 166, subject to limited exceptions.'
    ],
    complianceRules: [
      'Ensure National ID (NID) and company RJSC certificate details match the e-TIN registry.',
      'Submit annual tax return every assessment year even if income is below taxable threshold, unless explicitly exempt under Section 166(2).'
    ],
    relatedTerms: ['bin', 'psr', 'assessment-year'],
    tags: ['tin', 'e-tin', 'taxpayer identification number', 'nbr', 'registration']
  },
  {
    id: 'bin',
    term: 'BIN (Business Identification Number)',
    shortTerm: 'BIN',
    bengaliTerm: 'ব্যবসা শনাক্তকরণ নম্বর (বিআইএন)',
    category: 'vat',
    categoryLabel: 'VAT & SD Act, 2012',
    summary: 'A unique 13-digit identification number issued by the VAT authority to a registered commercial entity, manufacturer, importer, or service provider.',
    actReference: 'Value Added Tax and Supplementary Duty Act, 2012 — Section 4 & Section 6',
    keyProvisions: [
      '13-digit number required for conducting import and export operations through customs.',
      'Mandatory for opening letter of credit (LC), participating in tenders, and issuing Mushak-6.3 tax invoices.',
      'Entities with annual turnover between BDT 50 Lakh and 3 Crore receive Turnover Tax BIN; those exceeding BDT 3 Crore receive full VAT BIN.'
    ],
    complianceRules: [
      'Display the BIN certificate prominently at the principal place of business.',
      'Submit monthly Mushak-9.1 return every month under the 13-digit BIN.'
    ],
    relatedTerms: ['tin', 'vat', 'mushak-6-3', 'mushak-9-1'],
    tags: ['bin', 'business identification number', 'vat registration', 'customs lc']
  },
  {
    id: 'assessment-year',
    term: 'Assessment Year vs Income Year',
    shortTerm: 'AY vs IY',
    bengaliTerm: 'করবর্ষ বনাম আয়বর্ষ',
    category: 'income-tax',
    categoryLabel: 'Income Tax Act, 2023',
    summary: 'Income Year (আয়বর্ষ) is the 12-month period in which income is earned (1 July to 30 June). Assessment Year (করবর্ষ) is the immediately succeeding 12-month financial year in which that income is assessed and taxed.',
    actReference: 'Income Tax Act, 2023 — Section 2(9) and Section 2(21)',
    keyProvisions: [
      'Income Year: Generally starts on 1 July and ends on 30 June. For companies, an alternative financial accounting year approved by NBR may apply.',
      'Assessment Year: Commences on the 1st of July following the income year. E.g., for income earned during FY 2025–26 (1 July 2025 – 30 June 2026), the Assessment Year is 2026–27.',
      'Tax return submitted on Tax Day (30 November) belongs to the relevant Assessment Year based on the preceding Income Year’s accounts.'
    ],
    relatedTerms: ['tin', 'psr', 'ait'],
    tags: ['assessment year', 'income year', 'tax day', 'financial year', 'ay', 'iy']
  },
  {
    id: 'minimum-tax',
    term: 'Minimum Tax (ন্যূনতম কর)',
    shortTerm: 'Min Tax',
    bengaliTerm: 'ন্যূনতম কর (ধারা ১৬৩)',
    category: 'income-tax',
    categoryLabel: 'Income Tax Act, 2023',
    summary: 'The statutory baseline tax liability that a taxpayer must pay regardless of allowable expenses, business losses, or lower tax slab computations.',
    actReference: 'Income Tax Act, 2023 — Section 163',
    keyProvisions: [
      'Location-based minimum tax for individuals whose taxable income crosses the threshold: Dhaka/Chittagong City Corporation: BDT 5,000; Other City Corporations: BDT 4,000; Non-city areas: BDT 3,000.',
      'Gross Receipts Minimum Tax for companies and firms: 0.6% on gross turnover (0.1% for industrial manufacturing of goods, 0.75% for mobile operators).',
      'Specified TDS/AIT amounts under Section 163(2) deemed as final settlement or minimum tax ceiling.'
    ],
    relatedTerms: ['tds', 'ait', 'sixth-schedule'],
    tags: ['minimum tax', 'section 163', 'turnover tax', 'city corporation tax']
  },
  {
    id: 'section-66-67',
    term: 'Sections 66 & 67 (Income from Other Sources)',
    shortTerm: 'Sec 66 & 67',
    bengaliTerm: 'অন্যান্য উৎস হইতে আয় ও বিশেষ ক্ষেত্রে ধার্যকৃত আয়',
    category: 'income-tax',
    categoryLabel: 'Income Tax Act, 2023',
    summary: 'Section 66 governs general residual income not classified under the other six heads (royalties, licence fees, gifts, prizes). Section 67 treats unexplained deposits, unrecorded assets, loan waivers, and asset purchase discounts as deemed taxable income.',
    actReference: 'Income Tax Act, 2023 — Sections 66 & 67',
    keyProvisions: [
      'Section 66 captures royalties, casual receipts, technical fees, gifts from non-relatives, and miscellaneous gains.',
      'Section 67 deems unproved financial assets, unexplained bank credits, loan write-offs, and under-valued real estate purchases as taxable income.',
      'Amounts categorized under Section 67 generally carry full marginal income tax rates without standard allowance exemptions.'
    ],
    relatedTerms: ['tds', 'sixth-schedule'],
    relatedLinks: [
      { title: 'Complete Guide on Sections 66 and 67', url: '/article/other-sources-sections-66-67-bangladesh-tax-guide-2026' }
    ],
    tags: ['section 66', 'section 67', 'income from other sources', 'deemed income', 'unexplained deposit']
  },
  {
    id: 'mushak-6-3',
    term: 'Mushak-6.3 (VAT Tax Invoice)',
    shortTerm: 'Mushak 6.3',
    bengaliTerm: 'মূসক-৬.৩ কর চালানপত্র',
    category: 'vat',
    categoryLabel: 'VAT & SD Act, 2012',
    summary: 'The statutory tax invoice that must accompany any supply of taxable goods or services in Bangladesh, serving as proof of VAT charged and enabling the buyer to claim input tax credit.',
    actReference: 'VAT and Supplementary Duty Act, 2012 — Section 51 & VAT Rules, 2016 — Rule 40',
    keyProvisions: [
      'Must be issued at or before the time of supply/delivery.',
      'Contains supplier and buyer BIN, description, quantity, value, applicable VAT rate, and VAT amount.',
      'Crucial for input tax rebate: A buyer cannot claim input VAT credit without an authentic Mushak-6.3 invoice.'
    ],
    relatedTerms: ['vat', 'mushak-6-6', 'mushak-9-1', 'bin'],
    tags: ['mushak 6.3', 'tax invoice', 'vat invoice', 'input credit']
  },
  {
    id: 'mushak-6-6',
    term: 'Mushak-6.6 (VDS Certificate)',
    shortTerm: 'Mushak 6.6',
    bengaliTerm: 'মূসক-৬.৬ উৎসে কর কর্তন সনদপত্র',
    category: 'vat',
    categoryLabel: 'VAT & SD Act, 2012',
    summary: 'The statutory withholding certificate issued by a withholding entity to a supplier confirming that VAT has been deducted at source and deposited into the exchequer.',
    actReference: 'VAT and Supplementary Duty Rules, 2016 — Rule 40(ka)',
    keyProvisions: [
      'Must be issued within 3 working days of withholding VAT.',
      'Issued in 3 copies: 1 for supplier, 1 for tax authority, 1 for withholding entity records.',
      'Essential for the supplier to adjust the deducted VAT in Part-4 of their monthly Mushak-9.1 return.'
    ],
    relatedTerms: ['vds', 'vat', 'mushak-9-1'],
    tags: ['mushak 6.6', 'vds certificate', 'withholding certificate']
  },
  {
    id: 'mushak-9-1',
    term: 'Mushak-9.1 (Monthly VAT Return)',
    shortTerm: 'Mushak 9.1',
    bengaliTerm: 'মূসক-৯.১ মাসিক দাখিলপত্র',
    category: 'vat',
    categoryLabel: 'VAT & SD Act, 2012',
    summary: 'The comprehensive monthly tax return that every VAT-registered entity must submit to the VAT Circle by the 15th of each month, detailing sales, purchases, input credits, and net tax.',
    actReference: 'VAT and Supplementary Duty Act, 2012 — Section 64',
    keyProvisions: [
      'Due by the 15th day of the subsequent month (e.g. July return due by 15 August).',
      'Mandatory even if business had zero sales (nil return).',
      'Failure to file triggers automated late fine of BDT 10,000 and 2% monthly interest.'
    ],
    relatedTerms: ['vat', 'bin', 'mushak-6-3', 'mushak-6-6'],
    tags: ['mushak 9.1', 'monthly vat return', 'return submission']
  },
  {
    id: 'investment-rebate',
    term: 'Investment Tax Rebate (বিনিয়োগ কর রেয়াত)',
    shortTerm: 'Tax Rebate',
    bengaliTerm: 'কর রেয়াত',
    category: 'exemptions',
    categoryLabel: 'Exemptions & Schedules',
    summary: 'A direct deduction from the total calculated income tax amount granted to individual taxpayers who invest in qualified instruments prescribed in Sixth Schedule Part B.',
    actReference: 'Income Tax Act, 2023 — Sixth Schedule Part B & Section 78',
    keyProvisions: [
      'Maximum allowable investment is lower of: (i) 20% of taxable income, (ii) actual investment, or (iii) BDT 1,000,000.',
      'Tax rebate is 3% of the allowable investment.',
      'Qualifying instruments include DPS (up to 120,000 BDT/yr), life insurance premiums, treasury bonds, and stock market investments.'
    ],
    relatedTerms: ['sixth-schedule', 'minimum-tax'],
    tags: ['investment rebate', 'tax credit', 'dps', 'sanchayapatra', 'life insurance']
  },
  {
    id: 'dvc',
    term: 'DVC (Document Verification Code)',
    shortTerm: 'DVC',
    bengaliTerm: 'ডকুমেন্ট ভেরিফিকেশন কোড (ডিভিসি)',
    category: 'compliance',
    categoryLabel: 'Compliance & Verification',
    summary: 'A system-generated alphanumeric security code issued by the Institute of Chartered Accountants of Bangladesh (ICAB) to verify the authenticity of audited financial statements.',
    actReference: 'ICAB DVC Directive & Income Tax Act, 2023 — Section 73 & Section 264',
    keyProvisions: [
      'Mandatory on audited accounts of all limited companies submitted to NBR, RJSC, and commercial banks.',
      'Tax authorities reject financial reports lacking a valid ICAB DVC.',
      'Prevents multiple conflicting balance sheets for banks vs tax offices.'
    ],
    relatedTerms: ['tin', 'psr', 'corporate-tax'],
    tags: ['dvc', 'icab', 'audited statements', 'verification code']
  },
  {
    id: 'sro',
    term: 'SRO (Statutory Regulatory Order)',
    shortTerm: 'SRO',
    bengaliTerm: 'সংবিধিবদ্ধ নিয়ন্ত্রক আদেশ (এসআরও)',
    category: 'compliance',
    categoryLabel: 'Compliance & Verification',
    summary: 'An executive rule or notification issued by the Ministry of Finance or NBR to amend, clarify, exempt, or implement specific provisions of tax and VAT legislation.',
    actReference: 'General Clauses Act & Respective taxing statutes (e.g. Section 76 of Income Tax Act 2023, Section 126 of VAT Act 2012)',
    keyProvisions: [
      'SROs have the force of delegated legislation.',
      'Frequently used to grant temporary customs concessions, define VDS withholding lists, or extend return submission deadlines.'
    ],
    relatedTerms: ['vat', 'tds', 'sixth-schedule'],
    tags: ['sro', 'statutory regulatory order', 'gazette', 'nbr circular']
  },
  {
    id: 'supplementary-duty',
    term: 'Supplementary Duty (সম্পূরক শুল্ক - এসডি)',
    shortTerm: 'SD',
    bengaliTerm: 'সম্পূরক শুল্ক',
    category: 'vat',
    categoryLabel: 'VAT & SD Act, 2012',
    summary: 'An additional indirect levy imposed on luxury items, non-essential goods, or socially undesirable products (such as tobacco, alcohol, luxury vehicles, and telecommunications).',
    actReference: 'Value Added Tax and Supplementary Duty Act, 2012 — Section 55 & Second Schedule',
    keyProvisions: [
      'Levied at the import stage or local manufacturing stage prior to VAT calculation.',
      'Ranges from 10% to over 300% on specified products.',
      'Supplementary Duty is generally not creditable (non-rebateable) as input tax credit.'
    ],
    relatedTerms: ['vat', 'mushak-6-3'],
    tags: ['sd', 'supplementary duty', 'luxury tax', 'tobacco duty']
  },
  {
    id: 'turnover-tax',
    term: 'Turnover Tax (টার্নওভার কর)',
    shortTerm: 'Turnover Tax',
    bengaliTerm: 'টার্নওভার কর (৪%)',
    category: 'vat',
    categoryLabel: 'VAT & SD Act, 2012',
    summary: 'A simplified 4% tax regime applicable to small businesses with annual turnover between BDT 5,000,000 and BDT 30,000,000 who are exempt from standard VAT registration.',
    actReference: 'Value Added Tax and Supplementary Duty Act, 2012 — Section 63',
    keyProvisions: [
      'Turnover tax rate is a flat 4% without any input tax credit.',
      'Return submitted quarterly using Form Mushak-9.2.',
      'Cannot issue Mushak-6.3 tax invoices to customers.'
    ],
    relatedTerms: ['vat', 'bin'],
    tags: ['turnover tax', 'small business', 'mushak 9.2', '4 percent']
  },
  {
    id: 'withholding-entity',
    term: 'Withholding Entity (উৎস কর কর্তনকারী কর্তৃপক্ষ)',
    shortTerm: 'Withholding Entity',
    bengaliTerm: 'উৎস কর কর্তনকারী কর্তৃপক্ষ',
    category: 'compliance',
    categoryLabel: 'Compliance & Verification',
    summary: 'A government agency, corporate body, NGO, educational institution, hospital, or commercial organization designated by law to deduct tax and VAT at source from vendor payments.',
    actReference: 'Income Tax Act, 2023 — Section 87 & VAT Act, 2012 — Section 49',
    keyProvisions: [
      'Includes all limited companies, banks, insurance companies, statutory corporations, NGOs, universities, and registered firms.',
      'Carries strict legal obligation to withhold TDS and VDS before disbursing funds.',
      'Liable to penalty, surcharge, and personal prosecution if deductions are omitted.'
    ],
    relatedTerms: ['tds', 'vds', 'psr'],
    tags: ['withholding entity', 'deduction agent', 'section 87']
  },
  {
    id: 'universal-self-assessment',
    term: 'Universal Self-Assessment (সার্বজনীন স্বনির্ধারণী পদ্ধতি)',
    shortTerm: 'Self-Assessment',
    bengaliTerm: 'সার্বজনীন স্বনির্ধারণী পদ্ধতি (ধারা ১৮০)',
    category: 'income-tax',
    categoryLabel: 'Income Tax Act, 2023',
    summary: 'The standard statutory mechanism under Section 180 where a taxpayer’s filed income tax return is automatically accepted upon submission without prior audit by the Deputy Commissioner of Taxes (DCT).',
    actReference: 'Income Tax Act, 2023 — Section 180',
    keyProvisions: [
      'Acknowledgment receipt serves as the final assessment order unless subsequently selected for statutory audit by NBR.',
      'Taxpayer must pay the full net tax payable along with the return via automated treasury challan.',
      'Returns filed after the statutory Tax Day may forfeit universal self-assessment privileges and attract penalty.'
    ],
    relatedTerms: ['tin', 'psr', 'assessment-year'],
    tags: ['universal self-assessment', 'section 180', 'tax return', 'dct']
  }
];

export const termComparisons: TermComparison[] = [
  {
    id: 'tds-vs-vds',
    title: 'TDS vs VDS',
    bengaliTitle: 'উৎসে আয়কর কর্তন বনাম উৎসে মূসক কর্তন',
    description: 'While both are withholding mechanisms deducted before payment, TDS is an advance collection of direct Income Tax, whereas VDS is an indirect consumption tax collection under VAT.',
    termA: {
      name: 'TDS (Tax Deduction at Source)',
      basis: 'Direct Income Tax collected from supplier/payee profit margin.',
      governingLaw: 'Income Tax Act, 2023 (Chapter VII, Sections 86–142)',
      rateOrScope: 'Slab rate for salary; 2% to 12% for goods/services; 25% for lottery.',
      keyObligation: 'Deposit via e-Challan; issue certificate; file quarterly statement (Sec 177).',
      consequence: 'Disallowance of entire company expense under Sec 55 + 2% monthly interest.'
    },
    termB: {
      name: 'VDS (VAT Deduction at Source)',
      basis: 'Indirect consumption tax collected on goods and services delivered.',
      governingLaw: 'VAT & SD Act, 2012 (Section 49 & SRO 186-AIN/2019)',
      rateOrScope: '5% to 15% depending on specific procurement/service code.',
      keyObligation: 'Issue Mushak-6.6 certificate within 3 working days; deposit to VAT treasury.',
      consequence: 'Joint liability for unwithheld VAT + 2% per month penalty.'
    }
  },
  {
    id: 'sixth-part-a-vs-b',
    title: 'Sixth Schedule: Part A vs Part B',
    bengaliTitle: 'ষষ্ঠ তফসিল: অংশ ১ (অব্যাহতি) বনাম অংশ ২ (রেয়াত)',
    description: 'Part A completely excludes eligible receipts from your total taxable income, whereas Part B grants a tax rebate (tax deduction) against allowable investments.',
    termA: {
      name: 'Part A (অংশ ১ - কর অব্যাহতিপ্রাপ্ত আয়)',
      basis: 'Tax Exemption: Income is completely excluded from total income calculation.',
      governingLaw: 'Income Tax Act, 2023 — Sixth Schedule Part A',
      rateOrScope: 'Exempts 27 IT/ITES sectors, remittances, pension, small agriculture (<200k).',
      keyObligation: 'Must be explicitly reported under exempt income in Return Form-2023.',
      consequence: 'Unreported exempt income risks being treated as unexplained deemed income under Sec 67.'
    },
    termB: {
      name: 'Part B (অংশ ২ - কর রেয়াতযোগ্য বিনিয়োগ)',
      basis: 'Tax Credit: 3% of allowable investment is directly subtracted from calculated tax.',
      governingLaw: 'Income Tax Act, 2023 — Sixth Schedule Part B',
      rateOrScope: 'Ceiling: lowest of actual investment, 20% of taxable income, or BDT 1,000,000.',
      keyObligation: 'Requires proof documents: DPS certificate, life insurance receipt, stock BO statement.',
      consequence: 'Invalid or missing proofs leads to rebate cancellation and back-tax recovery.'
    }
  },
  {
    id: 'tin-vs-bin',
    title: 'e-TIN vs BIN',
    bengaliTitle: 'ই-টিন বনাম বিআইএন',
    description: 'e-TIN identifies the taxpayer for direct income tax liabilities, whereas BIN identifies the business entity for indirect VAT transactions and trade.',
    termA: {
      name: 'e-TIN (Taxpayer Identification Number)',
      basis: '12-digit number for individuals, partnerships, and companies for Income Tax.',
      governingLaw: 'Income Tax Act, 2023 (Section 261)',
      rateOrScope: 'Applicable to anyone earning taxable income or seeking licenses/bank loans.',
      keyObligation: 'Annual submission of income tax return (Form Return-2023) by Tax Day.',
      consequence: 'Non-filing triggers penalty under Section 266 and loss of PSR.'
    },
    termB: {
      name: 'BIN (Business Identification Number)',
      basis: '13-digit number for commercial entities, importers, and service providers for VAT.',
      governingLaw: 'VAT & SD Act, 2012 (Section 4 & Section 6)',
      rateOrScope: 'Mandatory for businesses with turnover > BDT 3 Crore, importers, or tender bidders.',
      keyObligation: 'Monthly submission of Mushak-9.1 return by 15th of every month.',
      consequence: 'Automated late penalty of BDT 10,000 per missing monthly return + customs blockage.'
    }
  },
  {
    id: 'income-year-vs-assessment-year',
    title: 'Income Year vs Assessment Year',
    bengaliTitle: 'আয়বর্ষ বনাম করবর্ষ',
    description: 'The Income Year is the 12-month period when income is actually generated; the Assessment Year is the subsequent financial period when that income is assessed.',
    termA: {
      name: 'Income Year (আয়বর্ষ)',
      basis: 'The financial period of earning (usually 1 July to 30 June of year X).',
      governingLaw: 'Income Tax Act, 2023 — Section 2(9)',
      rateOrScope: 'Accounts, bank deposits, salary slips, and receipts are recorded during this span.',
      keyObligation: 'Maintain all financial statements, TDS challans, and transaction vouchers.',
      consequence: 'Failure to keep records prevents accurate return preparation.'
    },
    termB: {
      name: 'Assessment Year (করবর্ষ)',
      basis: 'The 12-month period immediately following the income year (1 July to 30 June of year X+1).',
      governingLaw: 'Income Tax Act, 2023 — Section 2(21)',
      rateOrScope: 'Tax rates legislated in the Finance Act of this year apply to previous year income.',
      keyObligation: 'File return on or before 30 November (Tax Day) during this year.',
      consequence: 'Late filing incurs 2% monthly simple interest and forfeiture of tax incentives.'
    }
  }
];

export const glossaryQuizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: 'What corporate tax rate reduction do Bangladeshi corporate entities receive for complying with formal banking channel mandates, and what are the commercial expenditure transfer thresholds?',
    bengaliQuestion: 'আনুষ্ঠানিক ব্যাংকিং চ্যানেলের শর্তাবলি পরিপালন করলে কর্পোরেট প্রতিষ্ঠানগুলো কত শতাংশ কর হ্রাস পায় এবং ব্যবসায়িক ব্যয়ের ব্যাংক ট্রান্সফার সীমা কত?',
    options: [
      '2.5% corporate tax reduction; single transactions > BDT 5 Lakh and annual aggregate non-bank expenses > BDT 36 Lakh must be made via bank transfer (plus 100% of receipts/loans)',
      '5.0% corporate tax reduction; single transactions > BDT 10 Lakh and annual expenses > BDT 50 Lakh via bank transfer',
      '1.0% corporate tax reduction; only salary payments require bank transfer',
      '2.5% corporate tax reduction; no annual cap applies to commercial cash purchases'
    ],
    correctAnswer: 0,
    explanation: 'Corporate entities receive a 2.5% tax rate reduction (e.g., 27.5% vs 30% for non-listed companies; 20% vs 22.5% for listed >10% IPO; 25% vs 27.5% for listed ≤10% IPO) when 100% of receipts/loans and all single commercial expenses > BDT 5,00,000 and annual commercial expenses > BDT 36,00,000 are transacted through formal banking channels.',
    statutoryReference: 'Seventh Schedule, Income Tax Act, 2023 & Finance Act, 2026'
  },
  {
    id: 2,
    question: 'Under the amended Section 56(1) / Section 56Ka (effective 1 July 2026), what is the consequence of failing to deduct, collect, or deposit mandatory TDS, and how is the 50% penalty differentiated?',
    bengaliQuestion: 'সংশোধিত ৫৬(১) / ৫৬ক ধারা অনুযায়ী বাধ্যতামূলক উৎসে কর (TDS) কর্তন বা জমা না করার পরিণতি কী এবং ৫০% জরিমানার পার্থক্য কী?',
    options: [
      'Only a BDT 500 flat administrative notice fee is charged',
      'The taxpayer must pay the unpaid TDS shortfall PLUS an additional 50% penalty on that tax shortfall under Section 56(1)/56Ka (whereas Section 56(2) adds back Section 55 disallowed expenses as business income, and Section 264 increases TDS rate by 50% for missing PSR)',
      '50% of the entire gross vendor invoice value is confiscated immediately',
      'The supplier must pay a 5% surcharge to the landlord'
    ],
    correctAnswer: 1,
    explanation: 'Under Section 56(1)(a) / 56Ka (as substituted by Finance Act 2026), failure to deduct or pay required TDS results in liability for the TDS shortfall plus an additional 50% penalty of that shortfall (and under clause (b), 50% on any remaining difference after Section 143 recovery). By contrast, Section 56(2) treats Section 55 inadmissible expenses as business income, while Section 264 increases the withholding rate by 50% if PSR is not furnished.',
    statutoryReference: 'Income Tax Act, 2023 — Sections 55, 56(1), 56(2) / 56Ka & Section 143 (Finance Act, 2026)'
  },
  {
    id: 3,
    question: 'What are the specific turnover tax rate, 0% growth-cycle criteria, and loss carry-forward period for NBR-registered startups under the Startup Sandbox (Eighth Schedule, Part 2)?',
    bengaliQuestion: 'স্টার্টআপ স্যান্ডবক্স (অষ্টম তফসিল, অংশ ২)-এর অধীনে নিবন্ধিত স্টার্টআপের টার্নওভার করহার, ৯ বছরের গ্রোথ সাইকেলে ০% করের শর্ত এবং ক্ষতি জের টানার মেয়াদ কত?',
    options: [
      '6-year loss carry-forward and 0.60% standard minimum turnover tax',
      '9-year loss carry-forward period; 0% turnover tax criteria during qualifying growth years within the 9-year cycle (and 0.1% concessionary sandbox rate) upon NBR registration, return filing, and Section 129.4 Read-Only digital access',
      '3-year loss carry-forward and 1.00% turnover tax with no digital reporting requirement',
      'Unlimited loss carry-forward without NBR registration'
    ],
    correctAnswer: 1,
    explanation: 'Under Part 2 of the Eighth Schedule (Startup Sandbox), registered startups can carry forward unadjusted losses for 9 successive assessment years (vs. 6 years under Section 70). Within their 9-year growth cycle, qualifying NBR-registered startups granting Section 129.4 Read-Only digital access and filing regular returns enjoy 0% growth-year turnover tax relief (and the 0.1% sandbox turnover tax rate), plus exemption from Sections 55 and 56 disallowances.',
    statutoryReference: 'Income Tax Act, 2023 — Eighth Schedule Part 2 (Startup Sandbox) & Section 129.4'
  },
  {
    id: 4,
    question: 'Under the amended Section 118 of the Income Tax Act 2023 (effective 1 July 2026), what is the statutory TDS rate on lottery and game winnings?',
    bengaliQuestion: 'আয়কর আইন ২০২৩ এর সংশোধিত ১১৮ ধারা অনুযায়ী লটারি বা প্রতিযোগিতার পুরস্কারে উৎসে কর কর্তনের হার কত?',
    options: ['10%', '15%', '20%', '25%'],
    correctAnswer: 3,
    explanation: 'Under the amended Section 118 (effective FY 2026–27), the payer must deduct tax at source at the rate of 25% from qualifying lottery and game winnings (up from 20%).',
    statutoryReference: 'Income Tax Act, 2023 — Section 118 (as amended by Finance Act, 2026)'
  },
  {
    id: 5,
    question: 'What is the maximum statutory investment ceiling for claiming an Investment Tax Rebate under Sixth Schedule Part B?',
    bengaliQuestion: 'ষষ্ঠ তফসিল অংশ ২ এর অধীনে বিনিয়োগ কর রেয়াত পাওয়ার সর্বোচ্চ বিনিয়োগ সীমা কত?',
    options: [
      'Lower of: Actual investment, 20% of taxable income, or BDT 1,000,000',
      'Lower of: Actual investment, 25% of taxable income, or BDT 1,500,000',
      'Flat BDT 500,000 for all individual taxpayers',
      '15% of gross annual salary without ceiling'
    ],
    correctAnswer: 0,
    explanation: 'Under Sixth Schedule Part B, the allowable investment is capped at the lowest of: (a) actual investment, (b) 20% of total taxable income, or (c) BDT 1,000,000 (10 Lakh taka). The tax rebate is 3% of this allowable investment.',
    statutoryReference: 'Income Tax Act, 2023 — Sixth Schedule Part B & Section 78'
  },
  {
    id: 6,
    question: 'By which day of the month must a registered VAT entity submit its monthly Mushak-9.1 return to avoid penalties?',
    bengaliQuestion: 'জরিমানা এড়াতে নিবন্ধিত মূসক প্রতিষ্ঠানকে প্রতি মাসের কত তারিখের মধ্যে মূসক-৯.১ দাখিল করতে হয়?',
    options: [
      'By the 7th of the following month',
      'By the 15th of the following month',
      'By the 30th of the following month',
      'By the end of the quarter'
    ],
    correctAnswer: 1,
    explanation: 'Under Section 64 of the VAT & SD Act 2012, the monthly Mushak-9.1 return must be submitted by the 15th day of the subsequent month. Late filing attracts an automated BDT 10,000 penalty.',
    statutoryReference: 'VAT and Supplementary Duty Act, 2012 — Section 64'
  },
  {
    id: 7,
    question: 'Which statutory VAT document must be issued by a buyer to the supplier within 3 working days after deducting VDS?',
    bengaliQuestion: 'উৎসে মূসক (ভিডিএস) কর্তনের পর ৩ কার্যদিবসের মধ্যে সরবরাহকারীকে কোন চালান বা সনদপত্র প্রদান করতে হয়?',
    options: ['Mushak-6.1', 'Mushak-6.3', 'Mushak-6.6', 'Mushak-9.1'],
    correctAnswer: 2,
    explanation: 'Under VAT Rule 40(ka), a withholding entity must issue the statutory VDS Certificate on Form Mushak-6.6 in triplicate within 3 working days of deducting VAT.',
    statutoryReference: 'VAT and Supplementary Duty Rules, 2016 — Rule 40(ka)'
  }
];
