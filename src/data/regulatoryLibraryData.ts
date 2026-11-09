export interface RegulatoryDocument {
  id: string;
  authority:
    | 'Bangladesh Bank'
    | 'National Board of Revenue (NBR)'
    | 'BIDA'
    | 'RJSC'
    | 'BSEC'
    | 'Ministry of Law'
    | 'Others';
  authorityCode: 'bb' | 'nbr' | 'bida' | 'rjsc' | 'bsec' | 'law' | 'others';
  docNo: string;
  docDate: string; // YYYY-MM-DD
  year: number;
  description: string;
  category: 'Circular' | 'SRO' | 'Ordinance' | 'Office Order' | 'Notification' | 'Guideline';
  pdfUrl?: string;
  internalUrl?: string;
  details?: string;
  highlights?: string[];
  isPinned?: boolean;
}

export const REGULATORY_AUTHORITIES = [
  { id: 'all', label: 'All Authorities', shortLabel: 'All Authorities' },
  { id: 'nbr', label: 'National Board of Revenue (NBR)', shortLabel: 'National Board of Revenue (NBR)' },
  { id: 'bb', label: 'Bangladesh Bank', shortLabel: 'Bangladesh Bank' },
  { id: 'bida', label: 'BIDA', shortLabel: 'BIDA' },
  { id: 'rjsc', label: 'RJSC', shortLabel: 'RJSC' },
  { id: 'bsec', label: 'BSEC', shortLabel: 'BSEC' },
  { id: 'law', label: 'Ministry of Law', shortLabel: 'Ministry of Law' },
  { id: 'others', label: 'Others', shortLabel: 'Others' },
] as const;

export const REGULATORY_YEARS = [2026, 2025, 2024, 2023, 2022, 2021] as const;

export const REGULATORY_CATEGORIES = [
  'All',
  'SRO',
  'Circular',
  'Ordinance',
  'Guideline',
  'Notification',
  'Office Order',
] as const;

export const REGULATORY_DOCUMENTS: RegulatoryDocument[] = [
  {
    id: 'reg-sro-273-tds-2026',
    authority: 'National Board of Revenue (NBR)',
    authorityCode: 'nbr',
    docNo: 'SRO No. 273-Law/Income Tax-5/2026',
    docDate: '2026-06-30',
    year: 2026,
    description:
      'উৎসে কর বিধিমালা, ২০২৬ (Withholding Tax / TDS Rules 2026) — ঠিকাদার, সরবরাহকারী, সেবা, আমদানি ও রিয়েল এস্টেট খাতে উৎস কর কর্তনের পূর্ণাঙ্গ হার ও বিধিমালা',
    category: 'SRO',
    internalUrl: '/SRO/TDS2026',
    isPinned: true,
    highlights: [
      'Sections 89–139 ITO 2023 Complete TDS Rate Schedule',
      'Interactive Searchable Rule-by-Rule Bengali Schedule',
      'Gross-up Formula, PSR Rules & Monthly Return Timeline',
    ],
    details:
      'আয়কর আইন, ২০২৩ (২০২৩ সনের ১২ নং আইন) এর ধারা ৩৪৩ এ প্রদত্ত ক্ষমতাবলে জাতীয় রাজস্ব বোর্ড কর্তৃক জারিকৃত উৎসে কর বিধিমালা, ২০২৬ (এস.আর.ও. নং-২৭৩-আইন/আয়কর-৫/২০২৬)। এতে ঠিকাদার ও সরবরাহকারী (ধারা ৮৯), নির্দিষ্ট সেবা (ধারা ৯০), অনিবাসীদের আয় (ধারা ১১৯), সম্পত্তি হস্তান্তর (ধারা ১২৫), এবং আমদানিকারকদের উৎস কর হারের পূর্ণাঙ্গ তফসিল অন্তর্ভুক্ত রয়েছে।',
  },
  {
    id: 'reg-nbr-paripatra-2026-27',
    authority: 'National Board of Revenue (NBR)',
    authorityCode: 'nbr',
    docNo: 'Income Tax Circular 01/2026-2027',
    docDate: '2026-07-15',
    year: 2026,
    description:
      'আয়কর পরিপত্র ২০২৬-২০২৭ (Income Tax Paripatra FY 2026-27) — অর্থ আইন ২০২৬ ও আয়কর আইন ২০২৩-এর সংশোধনীসমূহের বিস্তারিত ব্যাখ্যা ও কর হার',
    category: 'Circular',
    pdfUrl: 'https://nbr.gov.bd/uploads/paripatra/Paripatra_2026-271.pdf',
    internalUrl: '/article/income-tax-circular-2026-2027-pdf-download',
    isPinned: true,
    highlights: [
      'Corporate & Individual Tax Slabs FY 2026-27',
      'Minimum Tax u/s 163 & Startup Incentives',
      'Environmental Surcharge & Net Wealth Thresholds',
    ],
    details:
      'জাতীয় রাজস্ব বোর্ড (এনবিআর) কর্তৃক প্রকাশিত আয়কর পরিপত্র ২০২৬-২০২৭। এতে ২০২৬-২০২৭ কর বছরের ব্যক্তিশ্রেণির করহার, কর্পোরেট করহার, ন্যূনতম কর, উৎসে কর এবং রিটার্ন দাখিল সংক্রান্ত নতুন বিধানাবলির দাপ্তরিক ব্যাখ্যা প্রদান করা হয়েছে।',
  },
  {
    id: 'reg-nbr-guideline-2026-27',
    authority: 'National Board of Revenue (NBR)',
    authorityCode: 'nbr',
    docNo: 'NBR Return Guideline 2026-2027',
    docDate: '2026-07-18',
    year: 2026,
    description:
      'আয়কর রিটার্ন পূরণের নির্দেশিকা ২০২৬-২০২৭ (Income Tax Return Filing Guideline 2026-2027) — IT-11GA (2023) ফরম পূরণ, রেয়াত ও তফসিল নির্দেশিকা',
    category: 'Guideline',
    pdfUrl: 'https://nbr.gov.bd/uploads/publications/Return_fill_up_Guideline_2026-2027.pdf',
    internalUrl: '/article/income-tax-guidelines-2026-2027-pdf-download',
    isPinned: true,
    highlights: [
      'Step-by-step IT-11GA (2023) Return Form Guide',
      'Salary Perquisite Exemption (1/3rd or BDT 5,00,000)',
      'IT-10B Asset & Liability Statement Rules',
    ],
    details:
      '২০২৬-২০২৭ কর বছরের জন্য জাতীয় রাজস্ব বোর্ডের অফিসিয়াল আয়কর নির্দেশিকা। এতে ব্যক্তিশ্রেণির করদাতাদের আয় গণনা, বিনিয়োগ জনিত কর রেয়াত (ধারা ৭৮), জীবনযাত্রার ব্যয় বিবরণী (IT-10BB) এবং পরিসম্পদ ও দায় বিবরণী (IT-10B) পূরণের পূর্ণাঙ্গ নিয়ম উদাহরণসহ বর্ণনা করা হয়েছে।',
  },
  {
    id: 'reg-rjsc-ebrs-2026',
    authority: 'RJSC',
    authorityCode: 'rjsc',
    docNo: 'RJSC Circular No. 01/eBRS/2026',
    docDate: '2026-03-10',
    year: 2026,
    description:
      'Mandatory Rollout of Electronic Business Registry System (eBRS) for Name Clearance, Company Incorporation, and Statutory Return Filings (Form VIII, IX, XII, XV & Schedule X)',
    category: 'Circular',
    internalUrl: '/article/rjsc-ebrs-company-registration-bangladesh-2026',
    isPinned: true,
    highlights: [
      'NID & TIN Biometric Verification via eBRS Portal',
      'Digital MoA/AoA Submission & One-Stop BIDA Sync',
      'Mandatory Online Filing of Schedule X & Form XII',
    ],
    details:
      'Under the modernized Electronic Business Registry System (eBRS), RJSC mandates 100% paperless processing for Private & Public Limited Companies, One Person Companies (OPC), Foreign Company Liaison/Branch offices, Partnership Firms, and Societies in Bangladesh.',
  },
  {
    id: 'reg-2026-01',
    authority: 'Bangladesh Bank',
    authorityCode: 'bb',
    docNo: 'FEPD Circular Letter No. 05',
    docDate: '2026-02-23',
    year: 2026,
    description: 'Comprehensive Guidelines on Overseas Business Expansion (OBE) by Bangladeshi Enterprises',
    category: 'Circular',
    details:
      'Foreign Exchange Policy Department (FEPD) Circular Letter No. 05 dated 23 February 2026 outlines the eligibility criteria, capital remittance thresholds, and reporting requirements for resident Bangladeshi companies establishing subsidiaries or branch offices abroad.',
  },
  {
    id: 'reg-2026-02',
    authority: 'National Board of Revenue (NBR)',
    authorityCode: 'nbr',
    docNo: 'SRO No. 72-Law/2026/344-Mushak',
    docDate: '2026-02-18',
    year: 2026,
    description: 'Value Added Tax (VAT) & Supplementary Duty Exemption Order on Essential Ramadan Commodities',
    category: 'SRO',
    details:
      'Issued under Section 126 of the Value Added Tax and Supplementary Duty Act, 2012, adjusting import-stage and supply-stage VAT exemptions for designated essential commodities.',
  },
  {
    id: 'reg-2026-03',
    authority: 'National Board of Revenue (NBR)',
    authorityCode: 'nbr',
    docNo: 'SRO No. 68-Law/Income Tax-15/2026',
    docDate: '2026-02-10',
    year: 2026,
    description: 'Amendment to Source Tax (TDS) Deduction Rates on Imported Industrial Raw Materials under Income Tax Act, 2023',
    category: 'SRO',
    details:
      'Refines withholding tax rates at the import stage for backward-linkage industrial manufacturers under Section 120 of the Income Tax Act, 2023.',
  },
  {
    id: 'reg-2026-04',
    authority: 'National Board of Revenue (NBR)',
    authorityCode: 'nbr',
    docNo: 'SRO No. 55-Law/Income Tax-14/2026',
    docDate: '2026-02-02',
    year: 2026,
    description: 'Tax Holiday & Reduced Corporate Tax Framework for Renewable Energy & Agro-Processing Undertakings',
    category: 'SRO',
    details:
      'Provides graded corporate income tax exemptions for newly established renewable power plants and cold-chain agro-processing facilities commissioned between 2026 and 2030.',
  },
  {
    id: 'reg-2026-05',
    authority: 'Ministry of Law',
    authorityCode: 'law',
    docNo: 'Ordinance No. 10 of 2026',
    docDate: '2026-02-01',
    year: 2026,
    description: 'জাতীয় রাজস্ব বোর্ড (সংশোধন) অধ্যাদেশ, ২০২৬ [National Board of Revenue (Amendment) Ordinance, 2026]',
    category: 'Ordinance',
    details:
      'Promulgated by the Legislative and Parliamentary Affairs Division, restructuring tax policy formulation and revenue administration wings under the National Board of Revenue.',
  },
  {
    id: 'reg-2026-06',
    authority: 'National Board of Revenue (NBR)',
    authorityCode: 'nbr',
    docNo: 'SRO No. 52-Law/2026/343-Mushak',
    docDate: '2026-02-01',
    year: 2026,
    description: 'Amendment to the Value Added Tax and Supplementary Duty Rules, 2016 regarding Electronic Fiscal Device (EFDMS) Integration',
    category: 'SRO',
    details:
      'Mandates real-time API invoice transmission and input tax credit (Rebate) validation rules for registered VAT taxpayers.',
  },
  {
    id: 'reg-2026-07',
    authority: 'National Board of Revenue (NBR)',
    authorityCode: 'nbr',
    docNo: 'SRO No. 48-Law/Income Tax-13/2026',
    docDate: '2026-01-29',
    year: 2026,
    description: 'Extension of Individual Income Tax Return Filing Deadline (e-Return & Paper Return) for Assessment Year 2025-2026',
    category: 'SRO',
    details:
      'Extends the statutory Tax Day deadline under Section 166 and Section 334 of the Income Tax Act, 2023 without penalty or delay interest.',
  },
  {
    id: 'reg-2026-08',
    authority: 'Bangladesh Bank',
    authorityCode: 'bb',
    docNo: 'FEID Circular Letter No. 01',
    docDate: '2026-01-25',
    year: 2026,
    description: 'Instructions regarding Repatriation of Dividend & Disinvestment Proceeds to Non-Resident Shareholders',
    category: 'Circular',
    details:
      'Foreign Exchange Investment Department (FEID) Circular Letter No. 01 streamlines Authorized Dealer (AD) bank verification of fair valuation and tax clearance certificates for non-resident equity transfers.',
  },
  {
    id: 'reg-2026-09',
    authority: 'Bangladesh Bank',
    authorityCode: 'bb',
    docNo: 'FEPD Circular No. 08',
    docDate: '2026-01-25',
    year: 2026,
    description: 'Import Policy Order 2025–2028 Foreign Exchange Operational Alignment & Usance LC Tenure Rules',
    category: 'Circular',
    details:
      'Harmonizes Authorized Dealer (AD) letter of credit (LC) margin and deferred payment usance periods with the Import Policy Order 2025–2028.',
  },
  {
    id: 'reg-2026-10',
    authority: 'Bangladesh Bank',
    authorityCode: 'bb',
    docNo: 'FEPD Circular No. 07',
    docDate: '2026-01-19',
    year: 2026,
    description: 'Enhancement of Outward Remittance Limits for IT/Software Cloud Services, Royalty & Technical Know-How Fees',
    category: 'Circular',
    details:
      'Revises annual bona fide corporate remittance allowances via virtual corporate cards and AD channels for software subscriptions and BIDA-aligned royalty remittances.',
  },
  {
    id: 'reg-2026-11',
    authority: 'Bangladesh Bank',
    authorityCode: 'bb',
    docNo: 'FEOD Circular No. 01',
    docDate: '2026-01-18',
    year: 2026,
    description: 'Reporting of Foreign Exchange Transactions on Online Foreign Exchange Monitoring Dashboard',
    category: 'Circular',
    details:
      'Foreign Exchange Operation Department (FEOD) directive requiring real-time reporting of EXP and IMP forms by Authorized Dealers.',
  },
  {
    id: 'reg-2026-12',
    authority: 'Bangladesh Bank',
    authorityCode: 'bb',
    docNo: 'FEPD Circular No. 06',
    docDate: '2026-01-15',
    year: 2026,
    description: 'Guidelines on Foreign Currency Accounts for Freelancers, IT Exporters & Cross-Border Service Providers',
    category: 'Circular',
    details:
      'Increases retention quota percentages in Exporter Retention Quota (ERQ) accounts for registered ITES and software exporters.',
  },
  {
    id: 'reg-2026-13',
    authority: 'Bangladesh Bank',
    authorityCode: 'bb',
    docNo: 'DFIM Circular No. 01',
    docDate: '2026-01-15',
    year: 2026,
    description: 'Prudential Regulations on Single Borrower Exposure Limit & Governance for Finance Companies (NBFIs)',
    category: 'Circular',
    details:
      'Department of Financial Institutions and Markets (DFIM) circular updating capital adequacy and credit concentration limits under the Finance Company Act, 2023.',
  },
  {
    id: 'reg-2026-14',
    authority: 'Bangladesh Bank',
    authorityCode: 'bb',
    docNo: 'BRPD Circular Letter No. 03',
    docDate: '2026-01-14',
    year: 2026,
    description: 'Master Loan Classification, Provisioning & Rescheduling Framework for Corporate & SME Borrowers',
    category: 'Circular',
    details:
      'Banking Regulation and Policy Department (BRPD) instructions on past-due recognition, Base-III provisioning buffers, and exit policies for stressed industrial borrowers.',
  },
  {
    id: 'reg-2026-15',
    authority: 'Bangladesh Bank',
    authorityCode: 'bb',
    docNo: 'FEPD Circular No. 05',
    docDate: '2026-01-13',
    year: 2026,
    description: 'Working Capital Borrowing from Parent Companies / Shareholders Abroad by Foreign-Owned Companies in Bangladesh',
    category: 'Circular',
    details:
      'Sets interest-free and SOFR-benchmarked short-term working capital loan rules for Type-A, Type-B, and non-EPZ foreign-invested manufacturing entities.',
  },
  {
    id: 'reg-2026-16',
    authority: 'Bangladesh Bank',
    authorityCode: 'bb',
    docNo: 'FEPD Circular No. 04',
    docDate: '2026-01-12',
    year: 2026,
    description: 'Encashment Certificate & Export Incentive Verification Rules for RMG and Non-Traditional Exports',
    category: 'Circular',
    details:
      'Clarifies cash assistance audit trails and F.O.B realization documentary requirements for export-oriented industries.',
  },
  {
    id: 'reg-2026-17',
    authority: 'Bangladesh Bank',
    authorityCode: 'bb',
    docNo: 'BRPD Circular Letter No. 02',
    docDate: '2026-01-12',
    year: 2026,
    description: 'Fit and Proper Test Criteria for Appointment of Independent Directors & Chief Executive Officers in Scheduled Banks',
    category: 'Circular',
    details:
      'Updates minimum professional qualification, CIB clearance, and cooling-off period requirements under the Bank Company Act, 1991 (as amended).',
  },
  {
    id: 'reg-2026-18',
    authority: 'National Board of Revenue (NBR)',
    authorityCode: 'nbr',
    docNo: 'Order No. 08.01.0000.030.03.005.24',
    docDate: '2026-01-12',
    year: 2026,
    description: 'Mandatory Proof of Submission of Return (PSR) Verification Protocol for 45 Specified Services under Section 264',
    category: 'Office Order',
    details:
      'Instructs banks, RJSC, city corporations, and licensing authorities on automated online verification of e-Return acknowledgments (PSR) prior to service renewal.',
  },
  {
    id: 'reg-bida-2026-01',
    authority: 'BIDA',
    authorityCode: 'bida',
    docNo: 'BIDA OSS Notification No. 04/2026',
    docDate: '2026-02-05',
    year: 2026,
    description: 'Updated Guidelines on Work Permit Issuance, Security Clearance & Royalty/Technical Fee Approval via BIDA One Stop Service (OSS)',
    category: 'Guideline',
    details:
      'Establishes maximum 1:5 foreign-to-local employee ratio for manufacturing units and 1:20 for commercial offices, along with automated 6% ceiling checks on royalty, technical know-how, and franchise fee remittances under Section 18 of the BIDA Act, 2016.',
  },
  {
    id: 'reg-bsec-2026-01',
    authority: 'BSEC',
    authorityCode: 'bsec',
    docNo: 'BSEC/CMRRCD/2026-412/09',
    docDate: '2026-01-28',
    year: 2026,
    description: 'Corporate Governance Code Compliance & Independent Audit Committee Reporting Directive for Listed Companies and Issuers',
    category: 'Notification',
    details:
      'Requires quarterly digital submission of related-party transaction disclosures, unclaimed dividend transfers to the Capital Market Stabilization Fund (CMSF), and independent director certification.',
  },
  // ================= 2025 REGULATORY ARCHIVE =================
  {
    id: 'reg-2025-01',
    authority: 'Ministry of Law',
    authorityCode: 'law',
    docNo: 'Finance Ordinance, 2025 (Ord. No. 28 of 2025)',
    docDate: '2025-06-30',
    year: 2025,
    description: 'অর্থ অধ্যাদেশ, ২০২৫ (Finance Ordinance, 2025) — Amendments to Income Tax Act 2023, Customs Act 2023 & VAT Act 2012',
    category: 'Ordinance',
    details:
      'Enacts fiscal measures for FY 2025-2026 including prospective two-year tax slab adjustments, capital gains rules on listed securities, and customs tariff rationalizations.',
  },
  {
    id: 'reg-2025-02',
    authority: 'National Board of Revenue (NBR)',
    authorityCode: 'nbr',
    docNo: 'SRO No. 210-Law/Income Tax-04/2025',
    docDate: '2025-08-04',
    year: 2025,
    description: 'Compulsory Online Income Tax Return (e-Return) Filing Order for All Individual Taxpayers Across Bangladesh',
    category: 'SRO',
    details:
      'Issued under Section 328 of the Income Tax Act, 2023 making online return submission via etaxnbr.gov.bd mandatory for individual taxpayers except senior citizens aged 65+ and specified categories.',
  },
  {
    id: 'reg-2025-03',
    authority: 'Bangladesh Bank',
    authorityCode: 'bb',
    docNo: 'BRPD Circular No. 15/2025',
    docDate: '2025-11-12',
    year: 2025,
    description: 'Implementation of Basel-III Capital Conservation Buffer & International Financial Reporting Standards (IFRS 9) Expected Credit Loss',
    category: 'Circular',
    details:
      'Sets phased roadmap for scheduled commercial banks in Bangladesh to transition from rule-based CL provisioning to IFRS 9 expected credit loss modeling.',
  },
  {
    id: 'reg-2025-04',
    authority: 'RJSC',
    authorityCode: 'rjsc',
    docNo: 'RJSC Office Order No. 14/2025',
    docDate: '2025-09-18',
    year: 2025,
    description: 'Mandatory Beneficial Ownership (UBO) Disclosure & Digital Share Transfer Verification under Companies Act, 1994',
    category: 'Office Order',
    details:
      'Requires private and public limited companies to submit verified NID/Passport particulars of ultimate beneficial owners holding 10% or more equity during Form XII and Schedule X filings.',
  },
  // ================= 2024 REGULATORY ARCHIVE =================
  {
    id: 'reg-2024-01',
    authority: 'National Board of Revenue (NBR)',
    authorityCode: 'nbr',
    docNo: 'Finance Act, 2024 (Act No. V of 2024)',
    docDate: '2024-06-30',
    year: 2024,
    description: 'অর্থ আইন, ২০২৪ (Finance Act, 2024) — Comprehensive Tax Rate Schedule, Withholding Tax & Customs Act 2023 Commencement',
    category: 'Ordinance',
    details:
      'Enacted budgetary fiscal reforms for FY 2024-25 and brought the new Customs Act, 2023 (Act No. 57 of 2023) into operational force.',
  },
  {
    id: 'reg-2024-02',
    authority: 'BIDA',
    authorityCode: 'bida',
    docNo: 'BIDA Guideline No. 02/Foreign-Branch/2024',
    docDate: '2024-05-14',
    year: 2024,
    description: 'Standard Operating Procedure for Opening, Renewal and Closure of Branch, Liaison & Representative Offices in Bangladesh',
    category: 'Guideline',
    details:
      'Details inward remittance minimum of USD 50,000 within 2 months of BIDA permission letter, quarterly Bangladesh Bank reporting, and statutory audit compliance.',
  },
  {
    id: 'reg-2024-03',
    authority: 'Bangladesh Bank',
    authorityCode: 'bb',
    docNo: 'FEPD Circular No. 11/2024',
    docDate: '2024-07-22',
    year: 2024,
    description: 'Crawling Peg Exchange Rate System & Interbank Foreign Exchange Market Operational Guidelines',
    category: 'Circular',
    details:
      'Introduces crawling peg mid-rate mechanism for USD/BDT transactions and prescribes spread discipline for Authorized Dealer banks.',
  },
  // ================= 2023 REGULATORY ARCHIVE =================
  {
    id: 'reg-2023-01',
    authority: 'Ministry of Law',
    authorityCode: 'law',
    docNo: 'Act No. XII of 2023 (আয়কর আইন, ২০২৩)',
    docDate: '2023-06-22',
    year: 2023,
    description: 'আয়কর আইন, ২০২৩ (Income Tax Act, 2023) — Complete Modern Bengali Statutory Replacement of the Income Tax Ordinance, 1984',
    category: 'Ordinance',
    details:
      'Enacted 345 sections and 8 schedules modernizing direct tax administration, transfer pricing, universal self-assessment (Section 180), and withholding tax architecture in Bangladesh.',
  },
  {
    id: 'reg-2023-02',
    authority: 'BSEC',
    authorityCode: 'bsec',
    docNo: 'BSEC/CMRRCD/2023-398/45',
    docDate: '2023-10-10',
    year: 2023,
    description: 'Bangladesh Securities and Exchange Commission (Qualified Investor Offer by Small Capital Companies) Rules Amendment, 2023',
    category: 'Notification',
    details:
      'Streamlines SME Board listing eligibility, paid-up capital floors, and prospectus vetting timelines for growth-stage Bangladeshi enterprises.',
  },
  // ================= 2022 & 2021 ARCHIVE =================
  {
    id: 'reg-2022-01',
    authority: 'National Board of Revenue (NBR)',
    authorityCode: 'nbr',
    docNo: 'Transfer Pricing Rules S.R.O. No. 162-Law/2022',
    docDate: '2022-06-15',
    year: 2022,
    description: 'Transfer Pricing Documentation, Arm’s Length Price Computation & Chartered Accountant Report (Section 237) Rules',
    category: 'SRO',
    details:
      'Prescribes mandatory Transfer Pricing study and Accountant Report submission for international transactions exceeding BDT 3.00 Crore per income year.',
  },
  {
    id: 'reg-2021-01',
    authority: 'RJSC',
    authorityCode: 'rjsc',
    docNo: 'Companies (Second Amendment) Act Implementation Circular 2021',
    docDate: '2021-03-25',
    year: 2021,
    description: 'Operationalization of One Person Company (OPC) Registration under Section 392A–392L of the Companies Act, 1994',
    category: 'Circular',
    details:
      'Establishes paid-up capital thresholds (BDT 25 Lakh to BDT 5 Crore), nominee succession rules, and incorporation forms for One Person Companies (OPC) in Bangladesh.',
  },
];
