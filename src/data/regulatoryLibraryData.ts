export interface RegulatoryDocument {
  id: string;
  authority: 'Bangladesh Bank' | 'National Board of Revenue (NBR)' | 'BIDA' | 'RJSC' | 'BSEC' | 'Ministry of Law, Justice and Parliamentary Affairs' | 'Other';
  authorityCode: 'bb' | 'nbr' | 'bida' | 'rjsc' | 'bsec' | 'law' | 'others';
  docNo: string;
  docDate: string; // YYYY-MM-DD
  year: number;
  description: string;
  category: 'Circular' | 'SRO' | 'Ordinance' | 'Office Order' | 'Notification' | 'Guideline';
  pdfUrl?: string;
  details?: string;
}

export const REGULATORY_DOCUMENTS: RegulatoryDocument[] = [
  {
    id: 'reg-bb-fepd2-10',
    authority: 'Bangladesh Bank',
    authorityCode: 'bb',
    docNo: 'FEPD-2 Circular No. 10',
    docDate: '2026-11-04',
    year: 2026,
    description: 'Foreign Currency Custodial Account Facilities have been Introduced for Licensed Money Changers',
    category: 'Circular',
    details: 'Bangladesh Bank has issued FEPD-2 Circular No. 10 allowing authorized money changers to open and operate foreign currency custodial bank accounts to facilitate legitimate foreign currency transactions, electronic settlements, and compliance tracking.'
  },
  {
    id: 'reg-bb-feid-04',
    authority: 'Bangladesh Bank',
    authorityCode: 'bb',
    docNo: 'FEID Circular No. 04',
    docDate: '2026-11-03',
    year: 2026,
    description: 'Preference Share Issuance Framework has been Introduced for Non-resident Investors',
    category: 'Circular',
    details: 'Establishes simplified regulatory channels and repatriation mechanisms for non-resident equity and preference share investments in Bangladeshi private and public limited companies.'
  },
  {
    id: 'reg-rjsc-ebrs-01',
    authority: 'RJSC',
    authorityCode: 'rjsc',
    docNo: 'Circular No. eBRS/2026/01',
    docDate: '2026-11-01',
    year: 2026,
    description: 'Implementation of Electronic Business Registration System (eBRS) with NID, e-TIN, PSR & E-Consent OTP Validation',
    category: 'Notification',
    details: 'Official পরিপত্র from RJSC detailing the new electronic Business Registration System (eBRS) launching 12 November 2026, real-time NID/e-TIN/mobile matching, mandatory PSR submission, and instant Model MoA/AoA company incorporation.'
  },
  {
    id: 'reg-bb-fepd2-09',
    authority: 'Bangladesh Bank',
    authorityCode: 'bb',
    docNo: 'FEPD-2 Circular No. 09',
    docDate: '2026-10-29',
    year: 2026,
    description: 'Foreign Exchange Regulations have been Consolidated to Streamline Foreign Exchange Management and Operations',
    category: 'Circular',
    details: 'Consolidated guidelines simplifying foreign exchange transactions, commercial remittances, royalty payments, and export proceeds realization for Bangladeshi enterprises.'
  },
  {
    id: 'reg-bb-fcrpd2-19',
    authority: 'Bangladesh Bank',
    authorityCode: 'bb',
    docNo: 'FCRPD-2 Circular No. 19',
    docDate: '2026-10-26',
    year: 2026,
    description: 'Loan Rescheduling Processing Deadlines have been Introduced for Financial Restructuring of Affected Borrowers',
    category: 'Circular',
    details: 'Mandatory processing timelines and risk assessment criteria for commercial banks handling loan rescheduling and financial restructuring applications.'
  },
  {
    id: 'reg-bb-fepd2-08',
    authority: 'Bangladesh Bank',
    authorityCode: 'bb',
    docNo: 'FEPD-2 Circular No. 08',
    docDate: '2026-10-25',
    year: 2026,
    description: 'Foreign Currency Account Retention Facilities have been Introduced for Merchants Accepting International Payments',
    category: 'Circular',
    details: 'Allows e-commerce merchants and IT service exporters to retain up to 70% of foreign currency earnings in ERQ accounts for foreign cloud and advertising expenses.'
  },
  {
    id: 'reg-nbr-0801-05',
    authority: 'National Board of Revenue (NBR)',
    authorityCode: 'nbr',
    docNo: 'Document no. 08.01.0000.036.01.001.21/05',
    docDate: '2026-10-25',
    year: 2026,
    description: 'Office Order Regarding the Determination and Reorganization of Appeal Jurisdictions of Tax Appeal Zones under the Income Tax Act, 2023',
    category: 'Office Order',
    details: 'Reorganizes appellate jurisdiction for corporate and individual taxpayers across Dhaka, Chattogram, Rajshahi, and Khulna appeal zones under Section 283 of Income Tax Act 2023.'
  },
  {
    id: 'reg-law-ord-39',
    authority: 'Ministry of Law, Justice and Parliamentary Affairs',
    authorityCode: 'law',
    docNo: 'Ordinance no. 39, 2026',
    docDate: '2026-10-19',
    year: 2026,
    description: 'The Special Electricity Generation Ordinance, 2026',
    category: 'Ordinance',
    details: 'Statutory ordinance governing renewable energy IPP tariffs, grid integration compliance, and sovereign guarantee structures.'
  },
  {
    id: 'reg-bb-bfiu1-34',
    authority: 'Bangladesh Bank',
    authorityCode: 'bb',
    docNo: 'BFIU-1 Circular Letter No. 34',
    docDate: '2026-10-19',
    year: 2026,
    description: 'Anti-Money Laundering and Counter-Terrorism Financing Guidelines have been Issued for Insurance Companies',
    category: 'Circular',
    details: 'BFIU mandatory AML/CTF compliance framework, beneficial ownership disclosure, and suspicious transaction reporting (STR) standards for insurance firms.'
  },
  {
    id: 'reg-bb-fepd2-19',
    authority: 'Bangladesh Bank',
    authorityCode: 'bb',
    docNo: 'FEPD-2 Circular No. 19',
    docDate: '2026-10-18',
    year: 2026,
    description: 'Prior Approval Requirement for Boiler Imports has been Suspended to Simplify Import Processes',
    category: 'Circular',
    details: 'Waives prior central bank clearance for capital machinery boiler imports, allowing commercial banks to open letters of credit (LC) directly.'
  },
  {
    id: 'reg-bb-fepd2-07',
    authority: 'Bangladesh Bank',
    authorityCode: 'bb',
    docNo: 'FEPD-2 Circular No. 07',
    docDate: '2026-10-17',
    year: 2026,
    description: 'Foreign Exchange and Gold Dealer Licensing Framework has been Consolidated to Streamline Operational Procedures',
    category: 'Circular',
    details: 'Consolidated statutory guidelines for foreign currency exchange houses and bullion dealers under the Foreign Exchange Regulation Act, 1947.'
  },
  {
    id: 'reg-nbr-vat-493',
    authority: 'National Board of Revenue (NBR)',
    authorityCode: 'nbr',
    docNo: 'Document No. 08.01.0000.075.010.019.19/Part-1/493',
    docDate: '2026-10-15',
    year: 2026,
    description: 'Extension of the deadline for filing the online VAT return in the eVAT system for the months of July to September 2026',
    category: 'Notification',
    details: 'Statutory extension notice for filing VAT 9.1 monthly returns on the online eVAT portal without late fee penalties.'
  },
  {
    id: 'reg-bida-08',
    authority: 'BIDA',
    authorityCode: 'bida',
    docNo: 'Instruction No. BIDA/FE/2026-08',
    docDate: '2026-10-12',
    year: 2026,
    description: 'Streamlined Work Permit and Branch Office Approval Framework for Foreign Direct Investors',
    category: 'Guideline',
    details: 'Bangladesh Investment Development Authority (BIDA) single-window digital process for work permit renewals, branch office registrations, and royalty remittance approvals.'
  },
  {
    id: 'reg-bsec-142',
    authority: 'BSEC',
    authorityCode: 'bsec',
    docNo: 'Order No. SEC/CMRRCD/2026/142',
    docDate: '2026-10-08',
    year: 2026,
    description: 'Updated Corporate Governance Code & Independent Director Qualification Norms',
    category: 'Notification',
    details: 'Bangladesh Securities and Exchange Commission (BSEC) mandatory governance standards, audit committee compositions, and independent director vetting rules.'
  },
  {
    id: 'reg-other-251',
    authority: 'Other',
    authorityCode: 'others',
    docNo: 'Document no. 05.00.0000.000.111.30.0001.24.251',
    docDate: '2026-10-15',
    year: 2026,
    description: 'Government Order on Change of Financial Year',
    category: 'Office Order',
    details: 'Cabinet Division official order regarding statutory financial year alignment and transitional tax filing schedules.'
  },
  {
    id: 'reg-nbr-guidelines-2026',
    authority: 'National Board of Revenue (NBR)',
    authorityCode: 'nbr',
    docNo: 'NBR Publication No. 2026/IT-01',
    docDate: '2026-07-01',
    year: 2026,
    description: 'আয়কর নির্দেশিকা ২০২৬-২০২৭ (Income Tax Guidelines AY 2026-2027)',
    category: 'Guideline',
    pdfUrl: 'https://pub-1d8caf41922f46e1952565fc23269fb3.r2.dev/%E0%A6%86%E0%A7%9F%E0%A6%95%E0%A6%B0%20%E0%A6%A8%E0%A6%BF%E0%A6%B0%E0%A7%8D%E0%A6%A6%E0%A7%87%E0%A6%B6%E0%A6%BF%E0%A6%95%E0%A6%BE%20%E0%A7%A8%E0%A7%A6%E0%A7%A8%E0%A7%AC-%E0%A7%A8%E0%A7%A6%E0%A7%A8%E0%A7%AD.pdf',
    details: 'Official step-by-step practical guide issued by NBR for individual tax return submission, deduction slabs, and universal e-filing under Income Tax Act 2023.'
  },
  {
    id: 'reg-nbr-circular-2026',
    authority: 'National Board of Revenue (NBR)',
    authorityCode: 'nbr',
    docNo: 'NBR Circular No. 01(Tax)/2026',
    docDate: '2026-07-01',
    year: 2026,
    description: 'আয়কর পরিপত্র ২০২৬-২০২৭ (Income Tax Circular AY 2026-2027)',
    category: 'SRO',
    pdfUrl: 'https://pub-1d8caf41922f46e1952565fc23269fb3.r2.dev/%E0%A6%86%E0%A7%9F%E0%A6%95%E0%A6%B0_%E0%A6%AA%E0%A6%B0%E0%A6%BF%E0%A6%AA%E0%A6%A4%E0%A7%8D%E0%A6%B0_%E0%A7%A8%E0%A7%A6%E0%A7%A8%E0%A7%AC-%E0%A7%A8%E0%A7%A6%E0%A7%A8%E0%A7%AD.pdf',
    details: 'Statutory circular on legal amendments, TDS rates, corporate taxation slabs, and procedural compliance rules passed in Finance Act 2026.'
  }
];
