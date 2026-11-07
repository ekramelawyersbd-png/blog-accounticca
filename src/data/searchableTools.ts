export interface SearchableTool {
  id: string;
  name: string;
  shortName: string;
  category: 'Tax Calculator' | 'Tax Planner' | 'Statutory Guide' | 'Compliance Reference' | 'Utility';
  description: string;
  path: string;
  iconName: 'Calculator' | 'Calendar' | 'FileText' | 'BookOpen' | 'Coins' | 'Building2' | 'FolderDown' | 'Scale' | 'Receipt' | 'ShieldCheck';
  badge?: string;
  tags: string[];
  featured?: boolean;
}

export const searchableTaxTools: SearchableTool[] = [
  {
    id: 'seo-performance-audit',
    name: 'SEO Performance Audit & Compliance Inspector',
    shortName: 'SEO Performance Audit',
    category: 'Compliance Reference',
    description: 'Real-time diagnostic analysis of meta tags, structured data (Schema.org JSON-LD), social sharing cards, and content headers found in our index.html with actionable Google SEO recommendations.',
    path: '/tools/seo-performance-audit',
    iconName: 'ShieldCheck',
    badge: 'Google SEO Standards',
    tags: ['seo audit', 'seo performance audit', 'meta tags', 'structured data', 'json-ld', 'schema.org', 'google standards', 'opengraph', 'twitter cards', 'headings hierarchy', 'search engine optimization', 'seo checker'],
    featured: true
  },
  {
    id: 'vat-apportionment-calculator',
    name: 'VAT Apportionment Calculator (Section 47 Partial Input Tax Rebate)',
    shortName: 'VAT Apportionment Calculator',
    category: 'Tax Calculator',
    description: 'Compute your Eligible Partial Input Tax Rebate = I × (T ÷ T_total) under Section 47 of the VAT & SD Act 2012 for mixed Standard (15%), Zero-Rated (0%), and Exempt/Reduced-Rate supplies.',
    path: '/tools/vat-apportionment-calculator',
    iconName: 'Calculator',
    badge: 'Section 47 VAT Act',
    tags: ['vat apportionment calculator', 'partial input tax rebate', 'section 47 vat', 'উপকরণ কর রেয়াত', 'input tax credit', 'mushak 9.1 part 4', 'mushak 9.1 part 5', 'common input vat', 'apportionment formula'],
    featured: true
  },
  {
    id: 'bin-registration-in-bangladesh',
    name: 'BIN & VAT Registration Complete Guide (Mushak 2.1 & 2.3)',
    shortName: 'BIN Registration Guide',
    category: 'Statutory Guide',
    description: 'Complete guide to Business Identification Number (BIN) registration in Bangladesh, BDT 50L/30L thresholds, required corporate documents, Mushak 2.1 online portal steps, ITC, and monthly VAT compliance.',
    path: '/article/bin-registration-in-bangladesh',
    iconName: 'FileText',
    badge: 'VAT & SD Act 2012',
    tags: ['bin registration', 'vat registration', 'mushak 2.1', 'mushak 2.3', 'mushak 6.3', 'mushak 9.1', 'business identification number', 'nbr vat portal', 'input tax credit', 'turnover tax'],
    featured: true
  },
  {
    id: 'trade-license-guide-dncc-dscc',
    name: 'Trade License Guide (DNCC & DSCC)',
    shortName: 'Trade License Guide',
    category: 'Statutory Guide',
    description: 'Complete operational and legal guide to Trade License in Bangladesh, DNCC/DSCC requirements, application, renewal & costs.',
    path: '/article/trade-license-bangladesh-guide-dncc-dscc',
    iconName: 'Building2',
    badge: 'DNCC & DSCC',
    tags: ['trade license', 'dncc', 'dscc', 'trade license bangladesh', 'city corporation', 'trade license renewal', 'trade license cost', 'business registration', 'dhaka'],
    featured: true
  },
  {
    id: 'total-income-calculation',
    name: 'How to Calculate Gross Income and Total Taxable Income (FY 2026–27)',
    shortName: 'Gross & Total Income Guide',
    category: 'Statutory Guide',
    description: 'Complete guide and interactive aggregator to compute Gross Receipts, 7 statutory heads of income, allowable deductions, Section 78 investment rebate, and FY 2026–27 tax slabs.',
    path: '/article/total-income-calculation-bangladesh-2026-2027',
    iconName: 'Calculator',
    badge: 'ITA 2023 & Finance Act 2026',
    tags: ['gross income', 'total income', 'taxable income', 'মোট আয়', 'seven heads', 'heads of income', 'salary exemption', 'rent deduction', 'business income', 'section 78', 'investment rebate', 'ay 2026-27', 'tax slabs'],
    featured: true
  },
  {
    id: 'tax-return-checklist',
    name: '10 Heads Income Return Checklist',
    shortName: 'Income Return Checklist',
    category: 'Tax Planner',
    description: 'Interactive checklist to tick off all 10 statutory income heads under IT-11GA, tracking progress toward Total Income & Section 78 rebate limits.',
    path: '/article/total-income-calculation-bangladesh-2026-2027#tax-return-checklist-tool',
    iconName: 'ShieldCheck',
    badge: 'Interactive Tracker',
    tags: ['tax checklist', 'return checklist', 'total income checklist', '10 heads', 'it-11ga', 'income heads', 'income tax act 2023'],
    featured: true
  },
  {
    id: 'agricultural-tax-calculator',
    name: 'Agricultural Income Tax Calculator 2026–2027',
    shortName: 'Agri Tax Calculator',
    category: 'Tax Calculator',
    description: 'Calculate net agricultural income, apply Section 43 deemed 60% expense rule or actual records, Clause 20 BDT 2 Lakh farmer exemption, and FY 2026-27 tax slabs.',
    path: '/article/agricultural-income-tax-bangladesh-2026-2027#agricultural-tax-calculator-tool',
    iconName: 'Calculator',
    badge: 'AY 2026-27 Slabs',
    tags: ['agricultural tax', 'agriculture income', 'কৃষি আয়', 'farmer tax', 'section 43', '60% expense', 'clause 20', 'ay 2026-27', 'agro business', 'crop tax'],
    featured: true
  },
  {
    id: 'clause-20-agri-exemption',
    name: 'Clause 20 Agricultural Exemption Guide',
    shortName: 'Clause 20 Exemption Card',
    category: 'Compliance Reference',
    description: 'Visual summary card of strict statutory conditions for BDT 2 Lakh agricultural exemption under Sixth Schedule Part 1 Clause 20.',
    path: '/article/agricultural-income-tax-bangladesh-2026-2027#clause-20-exemption-card',
    iconName: 'ShieldCheck',
    badge: 'Sixth Schedule',
    tags: ['clause 20', 'dofa 20', 'কৃষি কর অব্যাহতি', 'agricultural exemption', '2 lakh exemption', 'farmer by occupation', 'income tax act 2023'],
    featured: true
  },
  {
    id: 'tax-calculator',
    name: 'Tax Calculator 2026-27',
    shortName: 'Tax Calculator',
    category: 'Tax Calculator',
    description: 'Calculate salary, business & individual income tax liability with FY 2026-27 statutory slabs and rebates.',
    path: '/tax-calculator',
    iconName: 'Calculator',
    badge: 'FY 2026-27 Updated',
    tags: ['tax calculator', 'income tax', 'individual tax', 'salary tax', 'rebate', 'slabs', 'assessment year', 'ait', 'tax rate', '2026-27', 'tax slab'],
    featured: true
  },
  {
    id: 'tax-planner',
    name: 'Individual Tax Planner',
    shortName: 'Tax Planner',
    category: 'Tax Planner',
    description: 'Strategic tax optimizer for personal income tax, investment rebates under Schedule 2, and minimum cliff taxes.',
    path: '/tax-planner',
    iconName: 'Receipt',
    badge: 'Schedule 2 Optimizer',
    tags: ['tax planner', 'planning', 'investment rebate', 'dps', 'sanchayapatra', 'life insurance', 'stocks', 'minimum tax', '82c', 'tax saving'],
    featured: true
  },
  {
    id: 'corporate-planner',
    name: 'Corporate Tax Planner',
    shortName: 'Corporate Tax',
    category: 'Tax Planner',
    description: 'Simulate corporate tax rates for Private Limited, Listed, and Non-Listed entities with RJSC statutory deductions.',
    path: '/corporate-planner',
    iconName: 'Building2',
    badge: 'Corporate',
    tags: ['corporate tax', 'corporate planner', 'company tax', 'private limited', 'public limited', 'turnover tax', 'withholding', 'rjsc', 'corporate slab'],
    featured: true
  },
  {
    id: 'tds-guide',
    name: 'TDS Reference & Deduction Rates',
    shortName: 'TDS Guide',
    category: 'Compliance Reference',
    description: 'Comprehensive withholding tax directory covering Section 89, 90, 119 rates, SRO exemptions, and certificates.',
    path: '/tds-guide',
    iconName: 'BookOpen',
    badge: 'Income Tax Act 2023',
    tags: ['tds', 'tax deducted at source', 'withholding tax', 'section 89', 'section 90', 'section 119', 'source tax', 'deduction', 'sro', 'tds rates'],
    featured: true
  },
  {
    id: 'vat-guide',
    name: 'VAT & Customs Guide (VDS)',
    shortName: 'VAT & VDS Guide',
    category: 'Statutory Guide',
    description: 'Official Value Added Tax rules, Mushak forms, withholding VAT (VDS) deduction rates, and customs guidelines.',
    path: '/vat-guide',
    iconName: 'FileText',
    badge: 'VAT Act 2012',
    tags: ['vat', 'vds', 'withholding vat', 'mushak', 'customs', 'import', 'export', 'vat return', 'vat registration', 'vat exemption'],
    featured: true
  },
  {
    id: 'policy-analysis',
    name: 'Tax Policy Analysis & SRO Impact',
    shortName: 'Tax Policy Analysis',
    category: 'Statutory Guide',
    description: 'Comparative analysis of Finance Act revisions, statutory regulatory orders (SROs), and economic policy impact.',
    path: '/policy-analysis',
    iconName: 'Scale',
    badge: 'NBR Circulars',
    tags: ['policy', 'tax policy', 'sro', 'finance act', 'gazette', 'nbr circular', 'budget 2026', 'amendment', 'statutory updates'],
    featured: false
  },
  {
    id: 'tax-refund-guide',
    name: 'Income Tax Refund Guide',
    shortName: 'Tax Refund Guide',
    category: 'Statutory Guide',
    description: 'Step-by-step statutory process for claiming tax refunds under Section 240 of the Income Tax Act 2023.',
    path: '/tax-refund-guide',
    iconName: 'Coins',
    badge: 'Section 240 Guide',
    tags: ['refund', 'tax refund', 'advance income tax', 'ait refund', 'section 240', 'overpayment', 'adjustment', 'bank account refund'],
    featured: true
  },
  {
    id: 'rjsc-fee-estimator',
    name: 'RJSC Incorporation Fee Estimator',
    shortName: 'RJSC Fee Estimator',
    category: 'Tax Calculator',
    description: 'Estimate authorized capital registration fees, stamp duty, digital certificate charges, and RJSC compliance costs.',
    path: '/tools#rjsc-fee-calculator',
    iconName: 'Calculator',
    badge: 'Incorporation',
    tags: ['rjsc', 'company incorporation', 'authorized capital', 'filing fee', 'stamp duty', 'registration', 'name clearance', 'memorandum'],
    featured: false
  },
  {
    id: 'wealth-surcharge-tool',
    name: 'Net Wealth Surcharge Visualizer',
    shortName: 'Wealth Surcharge Visualizer',
    category: 'Tax Calculator',
    description: 'Explore progressive net wealth surcharge tiers (10% to 35%) and luxury asset triggers under Section 2(86B).',
    path: '/tools#wealth-surcharge-tool',
    iconName: 'Coins',
    badge: 'Wealth Surcharge',
    tags: ['wealth surcharge', 'net assets', 'luxury tax', 'cars', 'real estate', 'section 2(86B)', 'surcharge brackets', 'wealth statement'],
    featured: false
  },
  {
    id: 'early-filing-tool',
    name: 'Early Filing Incentive Calculator',
    shortName: 'Early Filing Incentive',
    category: 'Tax Calculator',
    description: 'Calculate your statutory 5% tax rebate (up to BDT 25,000) for filing returns between July 1 and September 30.',
    path: '/tools#early-filing-tool',
    iconName: 'Calendar',
    badge: '5% Rebate',
    tags: ['early filing', '5% incentive', 'tax day', 'rebate calculator', 'early bird', 'september 30 deadline', 'incentive'],
    featured: false
  },
  {
    id: 'resource-library',
    name: 'Legal & Tax Resource Library (PDFs)',
    shortName: 'Resource Library',
    category: 'Utility',
    description: 'Download standard NDA agreements, service contracts, board resolutions, and tax return filing checklists.',
    path: '/resource-library',
    iconName: 'FolderDown',
    badge: 'Downloadable Docs',
    tags: ['pdf', 'download', 'template', 'nda', 'agreement', 'checklist', 'board resolution', 'draft', 'contract', 'resource library'],
    featured: true
  },
  {
    id: 'glossary',
    name: 'Legal, Fiscal & Tax Glossary',
    shortName: 'Legal & Tax Glossary',
    category: 'Compliance Reference',
    description: 'A-to-Z repository of statutory legal definitions, corporate compliance terms, and tax jargon explained simply.',
    path: '/glossary',
    iconName: 'BookOpen',
    badge: 'Definitions Hub',
    tags: ['glossary', 'dictionary', 'definition', 'legal terms', 'tax terms', 'fiscal jargon', 'assessment', 'depreciation', 'glossary terms', 'terms'],
    featured: false
  },
  {
    id: 'interactive-key-terms-hub',
    name: 'Interactive Key Terms Guide: TDS, VAT & Sixth Schedule',
    shortName: 'Interactive Terms Guide',
    category: 'Compliance Reference',
    description: 'Interactive educational hub defining TDS (Sec 86-142), VAT (Act 2012), Sixth Schedule exemptions & rebates, with live simulators, 5-step workflows, and penalty guides.',
    path: '/glossary#interactive-key-terms-hub',
    iconName: 'Scale',
    badge: 'TDS, VAT & 6th Sch',
    tags: ['tds', 'vat', 'sixth schedule', 'interactive glossary', 'withholding tax', 'mushak', 'vds', 'psr', 'tax exemptions', 'investment rebate', 'dps rebate', 'section 163', 'glossary'],
    featured: true
  },
  {
    id: 'compliance-calendar',
    name: 'Statutory Compliance Calendar',
    shortName: 'Compliance Calendar',
    category: 'Compliance Reference',
    description: 'Interactive dashboard tracking corporate tax return due dates, monthly withholding statements, and VAT deadlines.',
    path: '/dashboard',
    iconName: 'Calendar',
    badge: 'Deadlines Tracker',
    tags: ['calendar', 'deadline', 'due date', 'statutory timeline', 'monthly returns', 'annual return', 'tax day', 'vat deadline', 'compliance calendar'],
    featured: false
  },
  {
    id: 'corporate-tax-rates-2026-calculator',
    name: 'Corporate Tax Rates & Comparison Calculator (FY 2026-27)',
    shortName: 'Corporate Tax Calculator',
    category: 'Tax Calculator',
    description: 'Calculate corporate income tax for non-listed (27.5%), listed >10% IPO (20%), and listed ≤10% IPO (25%) companies, with +2.5% banking channel penalty modeling.',
    path: '/tools#corporate-tax-tool',
    iconName: 'Building2',
    badge: 'FY 2026-27 Slabs',
    tags: ['corporate tax', 'listed company', 'non-listed company', 'ipo', 'banking channels', '2.5% penalty', '27.5%', '20%', '25%', '30%', 'dse', 'cse', 'capital market', 'private limited'],
    featured: true
  },
  {
    id: 'corporate-tax-guide-2026-2027',
    name: 'Corporate Tax Rates in Bangladesh FY 2026-27: Complete Guide',
    shortName: 'Corporate Tax Guide',
    category: 'Statutory Guide',
    description: 'Analysis of FY 2026-27 corporate tax rates, banking channel conditions (+2.5% penalty), listed vs non-listed comparisons, and IPO benefits.',
    path: '/article/corporate-tax-rates-bangladesh-fy-2026-27',
    iconName: 'FileText',
    badge: 'Listed vs Non-Listed',
    tags: ['corporate tax rates bangladesh', 'fy 2026-27', 'listed vs non-listed', 'banking penalty', 'ipo tax benefit', '5-year roadmap', 'income tax act 2023'],
    featured: true
  },
  {
    id: 'audited-financial-statements-guide',
    name: 'Audited Financial Statements & Income Computation (কোম্পানির নিরীক্ষিত হিসাব ও আয় পরিগণনাপত্র)',
    shortName: 'Audited Accounts & Computation',
    category: 'Statutory Guide',
    description: 'Provisions under Income Tax Act 2023 (Section 73, 166, 171) for audited financial statements, DVS codes, computation sheets, thresholds & deadlines.',
    path: '/article/company-audited-financial-statements-income-computation-sheet-bangladesh',
    iconName: 'FileText',
    badge: 'Section 73 & DVS',
    tags: ['audited accounts', 'নিরীক্ষিত আর্থিক বিবরণী', 'আয় পরিগণনাপত্র', 'income computation sheet', 'section 73', 'dvs', 'icab', 'corporate tax', 'tax day', 'company return'],
    featured: true
  },
  {
    id: 'corporate-tax-return-deadline-guide',
    name: 'Corporate Income Tax Return Deadline 2026 (কোম্পানি রিটার্ন দাখিলের সংবিধিবদ্ধ সময়সীমা)',
    shortName: 'Corporate Return Deadline',
    category: 'Statutory Guide',
    description: 'Statutory deadline for companies under Section 170(2) of the Income Tax Act 2023 (15th day of 9th month, e.g. 15 March 2027, or 15 September rule).',
    path: '/article/corporate-income-tax-return-deadline-bangladesh-2026',
    iconName: 'Calendar',
    badge: 'Section 170(2)',
    tags: ['corporate tax deadline', 'company return deadline', 'section 170(2)', 'march 15', 'september 15', 'tax day', 'company tax return bangladesh', 'finance act 2026'],
    featured: true
  },
  {
    id: 'psr-display-section-265-guide',
    name: 'Display of Proof of Submission of Return (PSR) at Premises (ব্যবসায়িক প্রাঙ্গণে পিএসআর প্রদর্শন)',
    shortName: 'PSR Display Guide',
    category: 'Statutory Guide',
    description: 'Mandatory display of latest PSR at business and professional premises under Section 265 of Income Tax Act 2023, penalties (BDT 20,000–50,000) & compliance checklist.',
    path: '/article/display-proof-submission-return-psr-section-265-bangladesh',
    iconName: 'Building2',
    badge: 'Section 265 Penalty',
    tags: ['psr display', 'proof of submission of return', 'section 265', 'conspicuous place', 'business premises', 'professional chamber', 'dct penalty', 'bdt 20000 to 50000', 'finance act 2026', 'e-return', 'acknowledgement'],
    featured: true
  },
  {
    id: 'taxable-vs-exempt-income-screener',
    name: 'Taxable vs. Non-Taxable Income Screener & Calculator FY 2026–27',
    shortName: 'Taxable vs Exempt Income',
    category: 'Tax Calculator',
    description: 'Calculate statutory salary exemption (lesser of 1/3rd or BDT 450,000), screen 7 statutory heads of income, test freelance ITES & family gift exemptions, and calculate FY 2026-27 progressive slab tax.',
    path: '/article/taxable-and-non-taxable-income-bangladesh-guide-2026-2027#taxable-vs-exempt-income-tool',
    iconName: 'Calculator',
    badge: 'Sixth Sched. Pt 1',
    tags: ['taxable income', 'non-taxable income', 'exempt income', 'salary exemption', '1/3rd 450k', 'seven heads', 'freelance tax', 'gift exemption', 'sixth schedule', 'tax slabs 2026-27'],
    featured: true
  },
  {
    id: 'accounting-tax-glossary',
    name: 'Accounting & Legal Glossary: TDS, VAT & Sixth Schedule',
    shortName: 'Tax Glossary & Quiz',
    category: 'Compliance Reference',
    description: 'Authoritative dictionary defining TDS, VAT, Sixth Schedule, PSR, e-TIN, and BIN with legal citations, BDT examples, side-by-side concept comparison, and interactive knowledge quiz.',
    path: '/glossary',
    iconName: 'BookOpen',
    badge: 'Interactive Glossary',
    tags: ['glossary', 'dictionary', 'tds', 'vat', 'sixth schedule', 'ait', 'psr', 'tin', 'bin', 'mushak 6.3', 'mushak 9.1', 'quiz', 'definition', 'terminology'],
    featured: true
  },
  {
    id: 'national-rate-finder',
    name: 'National Rate Finder (Tax, VAT, VDS, TDS & Customs HS Search)',
    shortName: 'National Rate Finder',
    category: 'Compliance Reference',
    description: 'Central rate directory to search live VAT rates, Withholding Tax (TDS/VDS) rules under ITA 2023, and Customs HS Code tariffs with total tax incidence (TTI) calculator.',
    path: '/tools/rate-finder',
    iconName: 'Receipt',
    badge: 'VAT, TDS & Customs',
    tags: ['rate finder', 'vat rate', 'tds rate', 'vds rate', 'customs duty', 'hs code', 'hs tariff', 'duty calculator', 'tti', 'sro 240', 'tax finder', 'rate database'],
    featured: true
  }
];
