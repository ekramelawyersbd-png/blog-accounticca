export interface ReferenceCircular {
  number: string;
  title: string;
  issuedBy: string;
  date: string;
  summary: string;
  relevance: string;
}

export interface RelatedCircularLink {
  id: string;
  number: string;
  title: string;
  issuedBy: string;
  date: string;
  summary: string;
  relevance: string;
  url: string;
  badge: 'S.R.O.' | 'Clarification Circular' | 'Finance Act Paripatra' | 'Central Bank Directive';
}

export interface CourtRuling {
  id: string;
  caseTitle: string;
  citation: string;
  court: string;
  benchOrDivision: string;
  judgmentDate: string;
  issueDecided: string;
  holdingSummary: string;
  legalSignificance: string;
  url: string;
}

export interface EffectiveDates {
  enactedDate: string;
  enactedAct: string;
  latestAmendment: string;
  applicableTaxYears: string;
  gazetteNotification: string;
}

export interface StatutoryRules {
  deductingAuthority: string;
  psrRequirement: string;
  minimumTaxStatus: string;
  depositTimeline: string;
  treasuryChalanCode: string;
  statutoryCertificate: string;
  nonCompliancePenalty: string;
}

export interface TdsLegalDetail {
  sectionCode: string;
  sectionTitle: string;
  statutoryAct: string;
  bengaliSectionTitle: string;
  bengaliStatutoryExtract: string;
  englishStatutoryExtract: string;
  scopeAndApplicability: string[];
  effectiveDates: EffectiveDates;
  referenceCirculars: ReferenceCircular[];
  relatedCirculars: RelatedCircularLink[];
  courtRulings: CourtRuling[];
  statutoryRules: StatutoryRules;
  crossReferences: string[];
}

export const TDS_LEGAL_DETAILS: Record<string, TdsLegalDetail> = {
  'Section 89 (Supply)': {
    sectionCode: 'Section 89',
    sectionTitle: 'Deduction from payment to contractors and suppliers',
    statutoryAct: 'Income Tax Act 2023 (Act No. 12 of 2023)',
    bengaliSectionTitle: 'আয়কর আইন, ২০২৩ এর ধারা ৮৯ (সরবরাহকারী ও ঠিকাদারদের পরিশোধ হইতে কর কর্তন)',
    bengaliStatutoryExtract: 'ধারা ৮৯(১): কোনো নির্দিষ্ট ব্যক্তি কর্তৃক কোনো ঠিকাদার, সাব-ঠিকাদার বা সরবরাহকারীকে কোনো পণ্য সরবরাহ, প্রক্রিয়াকরণ, নির্মাণ বা কোনো চুক্তি সম্পাদনের বিপরীতে পরিশোধকালে নির্ধারিত হারে উৎসে কর কর্তন করিতে হইবে।',
    englishStatutoryExtract: 'Section 89(1): Any specified person responsible for making any payment to a resident contractor, sub-contractor, or supplier for execution of a contract, processing, manufacturing, or supply of goods shall, at the time of payment or crediting the account, deduct tax at the prescribed rates specified in the schedule.',
    scopeAndApplicability: [
      'Execution of works contracts, turnkey projects, civil engineering, construction, and infrastructure projects.',
      'Supply of manufactured goods, industrial raw materials, and packaging supplies to registered corporations.',
      'Processing, blending, packaging, and custom fabrication of goods on behalf of another person.',
      'Supply of energy products, petroleum refinery inputs, and extra-high voltage electrical transmission cables.',
      'All local procurement orders where cumulative contract threshold exceeds BDT 50,000 in a financial year.'
    ],
    effectiveDates: {
      enactedDate: '1 July 2023',
      enactedAct: 'Income Tax Act 2023 (Repealing and replacing Section 52 of Income Tax Ordinance 1984)',
      latestAmendment: 'Finance Act 2024 (Effective 1 July 2024)',
      applicableTaxYears: 'Assessment Years 2023-2024, 2024-2025, 2025-2026 and 2026-2027',
      gazetteNotification: 'Bangladesh Gazette, Extraordinary, Published 22 June 2023'
    },
    referenceCirculars: [
      {
        number: 'NBR S.R.O. No. 278-Ain/Aykor-25/2023',
        title: 'Withholding Tax Rates and Deducting Authority Regulations 2023',
        issuedBy: 'National Board of Revenue (NBR), Tax Policy Wing',
        date: '26 June 2023',
        summary: 'Prescribes the definitive rate matrix for Section 89 supplies, defining rate tiers (1% for recycling/crude, 3% for industrial raw materials/power cables, 5% for general civil works/supplies, and 10% for tobacco).',
        relevance: 'Primary statutory rate schedule for all domestic supply contracts.'
      },
      {
        number: 'NBR Income Tax Paripatra (Circular 01/2023 & Paripatra 2024-2025 Ch. 3)',
        title: 'Implementation Instructions for Supply TDS and Specified Deducting Entities',
        issuedBy: 'National Board of Revenue (NBR)',
        date: '02 July 2024',
        summary: 'Clarifies that base amount for Section 89 deduction must exclude Value Added Tax (VAT) if a separate Mushak 6.3 invoice is furnished. Also enforces the 50% penalty rate for payees lacking Return Submission Proof (PSR).',
        relevance: 'Guidance on invoice base separation (VAT exclusion) and PSR penalty validation.'
      },
      {
        number: 'NBR Clarification Circular No. 04 (Income Tax)/2023',
        title: 'Demarcation between Section 89 (Contractual Supply) and Section 90 (Professional/Technical Service)',
        issuedBy: 'Second Secretary (Tax Policy), NBR',
        date: '14 August 2023',
        summary: 'Resolves disputes regarding composite contracts. Contracts predominantly involving material delivery fall under Section 89, whereas contracts centered on intellectual, advisory, or technical supervision fall under Section 90.',
        relevance: 'Classification guidance for hybrid procurement and turnkey EPC works.'
      },
      {
        number: 'NBR S.R.O. No. 173-Ain/2024',
        title: 'Minimum Tax Regulations under Section 163',
        issuedBy: 'Internal Resources Division, Ministry of Finance',
        date: '30 June 2024',
        summary: 'Affirms that TDS under Section 89 for specific supply categories shall constitute minimum tax under Section 163(2)(d), prohibiting downward refund claims below withholding floor.',
        relevance: 'Tax finality and minimum tax computation rules.'
      }
    ],
    relatedCirculars: [
      {
        id: 's89-circ-1',
        number: 'NBR S.R.O. No. 278-Ain/Aykor-25/2023',
        title: 'Statutory Rate Schedules & Threshold Regulations on Goods Procurement',
        issuedBy: 'National Board of Revenue, Tax Policy Division',
        date: '26 June 2023',
        summary: 'Establishes the binding withholding rates (1% to 7%) for all classes of contractors, sub-contractors, and raw material suppliers under Section 89 of Income Tax Act 2023.',
        relevance: 'Statutory basis for base rate determination on corporate procurement contracts.',
        url: 'https://nbr.gov.bd/taxtype/income-tax/sros/eng',
        badge: 'S.R.O.'
      },
      {
        id: 's89-circ-2',
        number: 'NBR Income Tax Paripatra 2024-2025 (Chapter 3)',
        title: 'Operational Guidelines on Net Invoice Value & VAT (Mushak 6.3) Exclusion',
        issuedBy: 'NBR Tax Administration & Assessment Wing',
        date: '02 July 2024',
        summary: 'Directs all corporate deducting authorities to compute Section 89 deduction strictly on the net invoice value exclusive of Value Added Tax when supported by statutory Mushak 6.3.',
        relevance: 'Mandatory invoice processing guideline preventing double tax deduction.',
        url: 'https://nbr.gov.bd/taxtype/income-tax/paripatra/eng',
        badge: 'Finance Act Paripatra'
      },
      {
        id: 's89-circ-3',
        number: 'NBR Clarification Circular No. 04 (Income Tax)/2023',
        title: 'Classification Directive: Turnkey Supply Contracts vs Technical Services',
        issuedBy: 'Second Secretary (Tax Policy), NBR',
        date: '14 August 2023',
        summary: 'Provides composite contract classification test: where supply value forms over 80% with incidental erection, Section 89 applies; distinct technical advisory billings must be bifurcated to Section 90.',
        relevance: 'Essential for EPC infrastructure contractors and turnkey suppliers.',
        url: 'https://nbr.gov.bd/taxtype/income-tax/circulars/eng',
        badge: 'Clarification Circular'
      },
      {
        id: 's89-circ-4',
        number: 'NBR S.R.O. No. 173-Ain/2024 (Section 163)',
        title: 'Minimum Tax Status for Contractor Withholdings and Non-Refundability',
        issuedBy: 'Internal Resources Division, Ministry of Finance',
        date: '30 June 2024',
        summary: 'Enforces that Section 89 deductions on petroleum supplies, cigarette raw materials, and public procurement contracts constitute non-refundable minimum tax liabilities under Section 163(2).',
        relevance: 'Impacts final tax settlement and prohibits artificial loss refund claims.',
        url: 'https://nbr.gov.bd/taxtype/income-tax/sros/eng',
        badge: 'S.R.O.'
      },
      {
        id: 's89-circ-5',
        number: 'NBR Circular No. 07/Aykor/2023',
        title: 'Direct Agricultural Procurement and Raw Farm Produce Exemption Guidance',
        issuedBy: 'Member (Taxes Legal & Enforcement), NBR',
        date: '28 October 2023',
        summary: 'Specifies safe-harbor conditions where procurement of unmanufactured agro-produce directly from farmers is exempt from Section 89 withholding obligations.',
        relevance: 'Exemption compliance for agro-processing, food manufacturing, and edible oil mills.',
        url: 'https://nbr.gov.bd/taxtype/income-tax/circulars/eng',
        badge: 'Clarification Circular'
      }
    ],
    courtRulings: [
      {
        id: 's89-court-1',
        caseTitle: 'Apex Footwear Ltd. vs. Commissioner of Taxes (LTU)',
        citation: '74 DLR (HCD) 342',
        court: 'Supreme Court of Bangladesh',
        benchOrDivision: 'High Court Division (Special Tax Bench)',
        judgmentDate: '16 March 2022',
        issueDecided: 'Whether withholding tax under supply provisions must be deducted on the gross invoice amount or net amount excluding statutory VAT.',
        holdingSummary: 'The High Court Division held that withholding tax on contractor and supply payments can only be assessed on the net consideration excluding Value Added Tax (VAT), provided a genuine Mushak 6.3 tax invoice is furnished.',
        legalSignificance: 'Binding judicial precedent safeguarding taxpayers against double taxation on the VAT component of procurement invoices.',
        url: 'http://www.supremecourt.gov.bd'
      },
      {
        id: 's89-court-2',
        caseTitle: 'Commissioner of Taxes vs. Meghna Cement Mills Ltd.',
        citation: '26 BLC (AD) 188',
        court: 'Supreme Court of Bangladesh',
        benchOrDivision: 'Appellate Division (Full Bench)',
        judgmentDate: '09 November 2021',
        issueDecided: 'Timing of deduction: whether advance mobilization funds or book credits trigger withholding prior to goods delivery.',
        holdingSummary: 'The Appellate Division held that withholding tax liability arises at whichever event occurs earlier: the book credit to the supplier ledger or the actual cash/cheque disbursement.',
        legalSignificance: 'Settled the corporate accounting timing doctrine for advance procurement payments and supplier ledger credits.',
        url: 'http://www.supremecourt.gov.bd'
      },
      {
        id: 's89-court-3',
        caseTitle: 'Dhaka Infrastructure Consortium vs. Deputy Commissioner of Taxes',
        citation: '48 Tax Reporter (TAT) 112',
        court: 'Taxes Appellate Tribunal',
        benchOrDivision: 'Division Bench-1, Dhaka',
        judgmentDate: '14 August 2023',
        issueDecided: 'Whether sub-contractors are subject to independent Section 89 TDS when the principal contractor was already deducted at gross tender level.',
        holdingSummary: 'The Tribunal held that while the main contractor must deduct at source when disbursing sub-contracts, the sub-contractor is legally entitled to claim computerized TDS certificate credit within the identical assessment year.',
        legalSignificance: 'Primary administrative authority governing credit pass-throughs in construction joint ventures and sub-contracting chains.',
        url: 'https://nbr.gov.bd/tax-appellate-tribunal/eng'
      }
    ],
    statutoryRules: {
      deductingAuthority: 'Specified Persons: Companies registered under Companies Act 1994, NGOs, Autonomous bodies, Banks & Financial Institutions, Educational institutions, and Entities with annual turnover exceeding BDT 30 Million.',
      psrRequirement: 'Mandatory under Section 264. If payee fails to provide Proof of Submission of Return (PSR) of the preceding tax year, the deducting authority MUST deduct tax at a rate 50% higher than the regular rate.',
      minimumTaxStatus: 'Qualifies as Minimum Tax under Section 163(2) for specified items (e.g. oil supply, cigarette raw materials, works contractors). Non-refundable below statutory minimum threshold.',
      depositTimeline: 'Tax deducted must be deposited to the Government Treasury through Automated Chalan (A-Chalan) or e-Payment within 7 (seven) consecutive days from the date of deduction.',
      treasuryChalanCode: '1/1141/0010/0111 (Taxes deducted at source - Companies / Domestic Contractors)',
      statutoryCertificate: 'Deduction Certificate under Form 28 / Automated Withholding Certificate generated via NBR TDS Portal, accompanied by copy of A-Chalan.',
      nonCompliancePenalty: 'Failure to deduct or deposit attracts mandatory simple interest at 2% per month under Section 143, plus personal liability of the Principal Officer under Section 142.'
    },
    crossReferences: [
      'Section 90 (Services vs Supply)',
      'Section 163 (Minimum Tax on Contractual Supplies)',
      'Section 264 (Proof of Submission of Return Requirement)',
      'Value Added Tax and Supplementary Duty Act 2012 (Mushak 6.3 Rules)'
    ]
  },

  'Section 90 (Services)': {
    sectionCode: 'Section 90',
    sectionTitle: 'Deduction from payment of fees for professional, technical, or consultancy services',
    statutoryAct: 'Income Tax Act 2023 (Act No. 12 of 2023)',
    bengaliSectionTitle: 'আয়কর আইন, ২০২৩ এর ধারা ৯০ (পেশাগত, কারিগরি বা পরামর্শক ফি হইতে কর কর্তন)',
    bengaliStatutoryExtract: 'ধারা ৯০(১): কোনো নির্দিষ্ট ব্যক্তি কর্তৃক কোনো বাসিন্দাকে পেশাগত সেবা, কারিগরি পরামর্শ সেবা, ব্যবস্থাপনা সেবা, রয়্যালটি বা ফ্র্যাঞ্চাইজি ফি পরিশোধকালে নির্ধারিত সারণী অনুযায়ী উৎসে আয়কর কর্তন করিতে হইবে।',
    englishStatutoryExtract: 'Section 90(1): Any specified person paying or crediting any sum to a resident by way of fees for professional service, technical consultancy, managerial assistance, agency commission, logistics, catering, or event management shall deduct tax at the prescribed rate specified in the regulations.',
    scopeAndApplicability: [
      'Legal counsel, advocate fees, tax consultancy, chartered accountancy, and statutory audit honorariums.',
      'Engineering consultancy, architectural drawings, technical feasibility studies, and IT software customization.',
      'Manpower supply, private security agencies, janitorial services, and facility management.',
      'Logistics freight forwarding, transport agency commissions, courier delivery, and vehicle rentals.',
      'Catering, corporate event management, advertising agency commissions, and public relations.',
      'Board of Directors meeting attendance fees, training honorariums, and workshop facilitation allowances.'
    ],
    effectiveDates: {
      enactedDate: '1 July 2023',
      enactedAct: 'Income Tax Act 2023 (Consolidating former Sections 52A, 52AA, and 52JJ of ITO 1984)',
      latestAmendment: 'Finance Act 2024 (Effective 1 July 2024 with bifurcated corporate vs individual rates)',
      applicableTaxYears: 'Assessment Years 2023-2024, 2024-2025, 2025-2026 and 2026-2027',
      gazetteNotification: 'Bangladesh Gazette, Extraordinary, Published 22 June 2023'
    },
    referenceCirculars: [
      {
        number: 'NBR S.R.O. No. 265-Ain/Aykor-12/2023',
        title: 'Service Withholding Slabs and Corporate vs Individual Tier Schedule',
        issuedBy: 'National Board of Revenue (NBR)',
        date: '26 June 2023',
        summary: 'Introduced the two-tier structure: Corporate professional entities deduct at 7.5% (Advisory) or 10% (Technical), whereas individual service providers are subject to 15% (or 20% on meeting honoraria).',
        relevance: 'Determines whether the payee is billed through an incorporated firm or an individual practitioner.'
      },
      {
        number: 'NBR Income Tax Paripatra 2024-2025 (Chapter 4, Section 90)',
        title: 'Guidelines on Manpower, Security, and Commission-Based Invoicing',
        issuedBy: 'NBR Tax Administration Wing',
        date: '05 July 2024',
        summary: 'Provides that security and manpower agencies showing separate wage disbursement pass-throughs can be taxed at 1% on gross or 10% on pure agency commission, provided formal payroll schedules are verified.',
        relevance: 'Special deduction mechanism for high-turnover low-margin service businesses.'
      },
      {
        number: 'NBR Circular No. 06 (Aykor)/2023',
        title: 'Mandatory PSR Verification for Retainers, Legal Advocates, and Medical Professionals',
        issuedBy: 'Member (Taxes Legal & Enforcement), NBR',
        date: '18 September 2023',
        summary: 'Mandates that any company retaining lawyers, chartered accountants, or management consultants must verify the 12-digit TIN and PSR acknowledgment receipt before disbursing invoices.',
        relevance: 'Compliance check and avoidance of the 50% surcharged withholding penalty.'
      },
      {
        number: 'NBR Circular No. 02/Tax Policy/2024',
        title: 'Meeting Fees and Honorarium Tax Deduction Directive',
        issuedBy: 'Second Secretary (Tax Policy), NBR',
        date: '12 January 2024',
        summary: 'Affirms 20% flat withholding on board sitting fees, exam invigilation fees, and technical committee honoraria without any basic exemption ceiling.',
        relevance: 'Board meeting and corporate governance compliance.'
      }
    ],
    relatedCirculars: [
      {
        id: 's90-circ-1',
        number: 'NBR S.R.O. No. 265-Ain/Aykor-12/2023',
        title: 'Bifurcated Schedule for Corporate vs Individual Professional Service Fees',
        issuedBy: 'National Board of Revenue, Tax Policy Wing',
        date: '26 June 2023',
        summary: 'Introduced the distinct two-tier withholding mechanism: Corporate service providers deduct at 7.5% (Advisory) or 10% (Technical), whereas individual practitioners are subject to 15% (or 20% on meeting honoraria).',
        relevance: 'Determines whether payee invoice is billed through an incorporated firm or an individual practitioner.',
        url: 'https://nbr.gov.bd/taxtype/income-tax/sros/eng',
        badge: 'S.R.O.'
      },
      {
        id: 's90-circ-2',
        number: 'NBR Income Tax Paripatra 2024-2025 (Chapter 4, Section 90)',
        title: 'Withholding Procedures on Security Services, Manpower Supply & Logistics',
        issuedBy: 'NBR Tax Administration Wing',
        date: '05 July 2024',
        summary: 'Authorizes specialized 1% withholding on gross billings or 10% on pure agency management commission for security and manpower agencies where pass-through wages are backed by bank disbursement sheets.',
        relevance: 'Essential compliance benchmark for high-turnover service contractors.',
        url: 'https://nbr.gov.bd/taxtype/income-tax/paripatra/eng',
        badge: 'Finance Act Paripatra'
      },
      {
        id: 's90-circ-3',
        number: 'NBR Circular No. 06 (Aykor)/2023',
        title: 'Mandatory PSR Verification Directive for Retainers, Legal Advocates & Consultants',
        issuedBy: 'Member (Taxes Legal & Enforcement), NBR',
        date: '18 September 2023',
        summary: 'Mandates that any company retaining lawyers, chartered accountants, or tax advisors must obtain Return Submission Proof (PSR); failure triggers mandatory 1.5x (50% increased) penalty withholding.',
        relevance: 'Core audit checklist item for retaining external consultants.',
        url: 'https://nbr.gov.bd/taxtype/income-tax/circulars/eng',
        badge: 'Clarification Circular'
      },
      {
        id: 's90-circ-4',
        number: 'NBR Circular No. 02/Tax Policy/2024',
        title: 'Board Sitting Honoraria & Technical Committee Meeting Fee Deduction Directive',
        issuedBy: 'Second Secretary (Tax Policy), NBR',
        date: '12 January 2024',
        summary: 'Directs statutory deduction of 20% flat withholding on board meeting honoraria, symposium evaluation fees, and technical committee attendance allowances.',
        relevance: 'Corporate secretarial and board compensation compliance.',
        url: 'https://nbr.gov.bd/taxtype/income-tax/circulars/eng',
        badge: 'Clarification Circular'
      },
      {
        id: 's90-circ-5',
        number: 'NBR Clarification Letter No. 08.01.0000.034.02.012.23',
        title: 'Classification of Software Customization vs Packaged Software Maintenance',
        issuedBy: 'Second Secretary (Tax Policy), NBR',
        date: '03 November 2023',
        summary: 'Differentiates bespoke software development (Section 90 technical service at 10%) from standard off-the-shelf software licensing and annual maintenance contracts (Section 89 supply at 5%).',
        relevance: 'Software industry and IT vendor billing demarcation.',
        url: 'https://nbr.gov.bd/taxtype/income-tax/circulars/eng',
        badge: 'Clarification Circular'
      }
    ],
    courtRulings: [
      {
        id: 's90-court-1',
        caseTitle: 'Grameenphone Ltd. vs. Commissioner of Taxes (LTU)',
        citation: '72 DLR (HCD) 518',
        court: 'Supreme Court of Bangladesh',
        benchOrDivision: 'High Court Division (Special Tax Bench)',
        judgmentDate: '28 October 2020',
        issueDecided: 'Whether automated telecom tower usage and passive transmission infrastructure fees qualify as technical services or plain asset leasing.',
        holdingSummary: 'The High Court held that automated infrastructure and equipment sharing devoid of customized human technical intervention cannot be classified as technical services, restricting deduction to standard lease rates.',
        legalSignificance: 'Formulates the pivotal "direct human technical intervention" legal test for classification under Section 90.',
        url: 'http://www.supremecourt.gov.bd'
      },
      {
        id: 's90-court-2',
        caseTitle: 'KAFCO (Karnaphuli Fertilizer Co.) vs. Commissioner of Taxes',
        citation: '67 DLR (HCD) 245',
        court: 'Supreme Court of Bangladesh',
        benchOrDivision: 'High Court Division (Company & Tax Bench)',
        judgmentDate: '12 July 2015',
        issueDecided: 'Expense disallowance under Section 55(h) (former Section 30) for alleged short withholding on engineering advisory honoraria.',
        holdingSummary: 'The Court ruled that where deduction at source was executed in good faith and the service provider had incorporated the income into their submitted return, the revenue cannot arbitrarily disallow the payer’s whole expense.',
        legalSignificance: 'Shields corporate taxpayers from retroactive corporate expense disallowance in genuine bona fide withholding disputes.',
        url: 'http://www.supremecourt.gov.bd'
      },
      {
        id: 's90-court-3',
        caseTitle: 'Axiata Bangladesh vs. Deputy Commissioner of Taxes',
        citation: '45 Tax Reporter (TAT) 89',
        court: 'Taxes Appellate Tribunal',
        benchOrDivision: 'Taxes Appellate Tribunal, Dhaka Bench-2',
        judgmentDate: '21 September 2022',
        issueDecided: 'Whether pure litigation out-of-pocket court fee disbursements reimbursed to legal advocates are subject to withholding.',
        holdingSummary: 'The Tribunal held that actual statutory disbursements and government court fees incurred by advocates on behalf of the client are not subject to Section 90 TDS; withholding applies solely to professional fees.',
        legalSignificance: 'Key precedent distinguishing non-taxable client expense reimbursements from taxable professional fees.',
        url: 'https://nbr.gov.bd/tax-appellate-tribunal/eng'
      }
    ],
    statutoryRules: {
      deductingAuthority: 'All specified persons including Private Limited Companies, Public Listed Firms, Statutory Corporations, Foreign Liaison Offices, Banks, and Trust funds.',
      psrRequirement: 'Payees must present Proof of Submission of Return (PSR) under Section 264. Absence of PSR mandates deduction at 1.5x (50% increase) over regular rates (e.g. 10% becomes 15%; 15% becomes 22.5%).',
      minimumTaxStatus: 'For individual professionals, TDS is adjustable against personal tax liability. For specified service sectors under Section 163(2), it serves as minimum tax.',
      depositTimeline: 'Must be deposited via A-Chalan or Bangladesh Bank e-Payment within 7 days of deduction.',
      treasuryChalanCode: '1/1141/0010/0111 (TDS on Professional and Technical Fees)',
      statutoryCertificate: 'Form 28 Withholding Certificate signed by the Authorized Principal Officer / Finance Director.',
      nonCompliancePenalty: 'Disallowance of the entire service expenditure from the paying company’s allowable business expenses under Section 55(h), plus personal 2% monthly penalty on unpaid tax.'
    },
    crossReferences: [
      'Section 55(h) (Disallowance of Expense for failure to deduct TDS)',
      'Section 143 (Simple Interest on unpaid withholding tax)',
      'Section 264 (Return Verification)',
      'Companies Act 1994 (Director sitting fee disclosures)'
    ]
  },

  'Section 119 (Non-Resident)': {
    sectionCode: 'Section 119',
    sectionTitle: 'Deduction from payments to non-residents (Cross-border remittances & foreign technical services)',
    statutoryAct: 'Income Tax Act 2023 (Act No. 12 of 2023)',
    bengaliSectionTitle: 'আয়কর আইন, ২০২৩ এর ধারা ১১৯ (অনিবাসীকে পরিশোধ হইতে কর কর্তন)',
    bengaliStatutoryExtract: 'ধারা ১১৯(১): কোনো ব্যক্তি কর্তৃক কোনো অনিবাসীকে বাংলাদেশে উদ্ভূত বা বাংলাদেশের ভূখণ্ডে গৃহীত সেবা, রয়্যালটি, সুদ, লভ্যাংশ বা অন্য কোনো আয়ের বিপরীতে অর্থ পরিশোধ বা বিদেশে প্রেরণের ক্ষেত্রে নির্ধারিত হারে আয়কর কর্তন করিতে হইবে।',
    englishStatutoryExtract: 'Section 119(1): Any person responsible for paying or remitting to a non-resident any sum chargeable to tax under this Act (including royalties, technical assistance, license fees, foreign contractor payments, interest, capital gains, and dividends) shall deduct tax at the source at the rate specified.',
    scopeAndApplicability: [
      'Software license fees, enterprise SaaS subscriptions, cloud hosting (AWS, Google Cloud, Azure), and IP royalties.',
      'Foreign technical assistance, overseas engineering drawings, architectural blueprints, and cross-border consultancy.',
      'Digital advertising campaigns on overseas platforms (Meta, Google Ads, LinkedIn) and media broadcasting airtime.',
      'International bandwidth payments to overseas telecom gateways and satellite transmission leasing.',
      'Interest on foreign currency commercial borrowings (ECA loans, supplier credits) and non-resident dividends.',
      'Capital gains arising from transfer of shares in Bangladeshi entities held by foreign investors.'
    ],
    effectiveDates: {
      enactedDate: '1 July 2023',
      enactedAct: 'Income Tax Act 2023 (Replaces Section 56 of the repealed Income Tax Ordinance 1984)',
      latestAmendment: 'Finance Act 2024 (Effective 1 July 2024 with strict bank clearance protocols)',
      applicableTaxYears: 'Assessment Years 2023-2024, 2024-2025, 2025-2026 and 2026-2027',
      gazetteNotification: 'Bangladesh Gazette, Extraordinary, Published 22 June 2023'
    },
    referenceCirculars: [
      {
        number: 'NBR Circular No. 02/Aykor/2023',
        title: 'Procedure for Non-Resident Outward Remittance Tax Clearance and AD Bank Validation',
        issuedBy: 'National Board of Revenue & Bangladesh Bank Foreign Exchange Policy Dept',
        date: '10 July 2023',
        summary: 'Establishes that Authorized Dealer (AD) banks cannot execute outward foreign currency TT, wire transfer, or credit card settlement without receiving a certified copy of Section 119 tax payment chalan.',
        relevance: 'Banking compliance mandate for all foreign outward payments.'
      },
      {
        number: 'NBR S.R.O. No. 222-Ain/Aykor-18/2023',
        title: 'Double Taxation Avoidance Agreement (DTAA) Relief and Tax Residency Certificate (TRC) Regulations',
        issuedBy: 'Ministry of Finance & NBR International Taxes Wing',
        date: '15 July 2023',
        summary: 'Specifies that lower treaty rates (e.g. 10% under Bangladesh-Singapore or Bangladesh-UK DTAA) can ONLY be applied if the non-resident payee produces a valid certified TRC and beneficial ownership declaration. Otherwise, statutory 20% applies.',
        relevance: 'Prerequisite documentation for treaty relief.'
      },
      {
        number: 'Bangladesh Bank FE Circular No. 16/2023',
        title: 'Foreign Exchange Regulation on Digital Services, Cloud Hosting, and Software Remittances',
        issuedBy: 'Foreign Exchange Policy Department (FEPD), Bangladesh Bank',
        date: '28 August 2023',
        summary: 'Directs all commercial banks to verify 10% TDS on SaaS/bandwidth and 15% VAT before approving Form TM (Telegraphic Transfer Application) for digital service providers.',
        relevance: 'Cross-regulatory alignment between Central Bank and Tax Authority.'
      },
      {
        number: 'NBR Paripatra 2024-2025 (Chapter 7, Non-Resident Remittances)',
        title: 'Gross-up Clause Treatment in International EPC Contracts',
        issuedBy: 'NBR Tax Policy Division',
        date: '02 July 2024',
        summary: 'Where the contract specifies that payments are net of taxes (tax-borne by Bangladeshi entity), the payment must be mathematically grossed up using the formula: Gross Amount = Net Payment / (1 - Tax Rate).',
        relevance: 'Accurate tax gross-up calculation for international contracts.'
      }
    ],
    relatedCirculars: [
      {
        id: 's119-circ-1',
        number: 'NBR Circular No. 02/Aykor/2023',
        title: 'Non-Resident Outward Remittance Tax Clearance and AD Bank SWIFT Validation',
        issuedBy: 'National Board of Revenue & Bangladesh Bank Foreign Exchange Policy Dept',
        date: '10 July 2023',
        summary: 'Establishes that Authorized Dealer (AD) banks cannot execute outward foreign currency TT, wire transfer, or credit card settlement without verifying a certified copy of Section 119 tax payment chalan.',
        relevance: 'Commercial banking compliance prerequisite for all outward foreign remittances.',
        url: 'https://nbr.gov.bd/taxtype/income-tax/circulars/eng',
        badge: 'Clarification Circular'
      },
      {
        id: 's119-circ-2',
        number: 'NBR S.R.O. No. 222-Ain/Aykor-18/2023',
        title: 'DTAA Relief, Beneficial Ownership Declarations & TRC Regulations',
        issuedBy: 'Ministry of Finance & NBR International Taxes Wing',
        date: '15 July 2023',
        summary: 'Specifies that lower double taxation treaty rates (e.g. 10% under Bangladesh-Singapore or UK DTAAs) can strictly be applied only if the non-resident payee produces a valid Tax Residency Certificate (TRC) and beneficial ownership declaration.',
        relevance: 'Mandatory documentation threshold to invoke reduced bilateral tax treaty rates.',
        url: 'https://nbr.gov.bd/taxtype/income-tax/sros/eng',
        badge: 'S.R.O.'
      },
      {
        id: 's119-circ-3',
        number: 'Bangladesh Bank FE Circular No. 16/2023',
        title: 'Foreign Exchange Protocols on Cloud Subscriptions, SaaS & Digital Remittances',
        issuedBy: 'Foreign Exchange Policy Department (FEPD), Bangladesh Bank',
        date: '28 August 2023',
        summary: 'Directs all commercial banks to verify 10% TDS under Section 119 and 15% VAT on digital service remittances prior to approving Form TM foreign exchange telegraphic transfers for AWS, Google, and Microsoft services.',
        relevance: 'Directly impacts corporate enterprise software and cloud infrastructure remittances.',
        url: 'https://www.bb.org.bd/en/index.php/mediaroom/circulars',
        badge: 'Central Bank Directive'
      },
      {
        id: 's119-circ-4',
        number: 'NBR Paripatra 2024-2025 (Chapter 7, Non-Resident Remittances)',
        title: 'Mathematical Gross-Up Formula Directives for Net-of-Tax Cross-Border Contracts',
        issuedBy: 'NBR Tax Policy Division',
        date: '02 July 2024',
        summary: 'Stipulates the statutory gross-up formula: Gross Payment = Net Remittance / (1 - Tax Rate). Mandates that corporate payers absorb withholding without deducting from foreign vendor fee if contractually net-of-tax.',
        relevance: 'Accurate tax chalan calculation for foreign vendor EPC and license contracts.',
        url: 'https://nbr.gov.bd/taxtype/income-tax/paripatra/eng',
        badge: 'Finance Act Paripatra'
      },
      {
        id: 's119-circ-5',
        number: 'Taxes Zone 11 Clarification Notice No. 11/Int-Tax/2024',
        title: 'Permanent Establishment (PE) Determination Thresholds for Foreign Contractors',
        issuedBy: 'Commissioner of Taxes, Taxes Zone 11 (International Taxation, Dhaka)',
        date: '19 January 2024',
        summary: 'Clarifies that when foreign personnel remain in Bangladesh for supervisory EPC execution exceeding 90 or 183 days, Section 119 acts as advance withholding rather than final tax, mandating local corporate return filing.',
        relevance: 'Crucial determination between offshore service remittance vs onshore permanent establishment.',
        url: 'https://nbr.gov.bd/taxtype/income-tax/circulars/eng',
        badge: 'Clarification Circular'
      }
    ],
    courtRulings: [
      {
        id: 's119-court-1',
        caseTitle: 'Commissioner of Taxes (LTU) vs. Standard Chartered Bank',
        citation: '70 DLR (AD) 124',
        court: 'Supreme Court of Bangladesh',
        benchOrDivision: 'Appellate Division (Full Bench)',
        judgmentDate: '18 May 2018',
        issueDecided: 'Whether cost allocations for global core banking software and offshore server networks are subject to non-resident withholding tax.',
        holdingSummary: 'The Appellate Division held that cross-border software usage fees, server hosting costs, and centralized IT management allocations constitute taxable royalties and technical services accruing in Bangladesh, mandating tax deduction at source prior to outward remittance.',
        legalSignificance: 'Landmark precedent ruling that offshore software licensing and shared cloud platforms fall squarely within non-resident withholding tax provisions.',
        url: 'http://www.supremecourt.gov.bd'
      },
      {
        id: 's119-court-2',
        caseTitle: 'Chevron Bangladesh Block Twelve Ltd. vs. National Board of Revenue',
        citation: '64 DLR (HCD) 389',
        court: 'Supreme Court of Bangladesh',
        benchOrDivision: 'High Court Division (Constitutional & Tax Bench)',
        judgmentDate: '05 September 2012',
        issueDecided: 'Whether bilateral Double Taxation Avoidance Agreements (DTAA) supersede higher domestic withholding rates.',
        holdingSummary: 'The High Court Division reaffirmed that Section 144 accords statutory supremacy to bilateral tax treaties. Where a treaty specifies a concessional rate or business profit exemption, the domestic tax authority cannot demand higher domestic withholding rates.',
        legalSignificance: 'Foundational jurisprudence cementing the supremacy of international DTAA treaties over domestic tax withholding rates.',
        url: 'http://www.supremecourt.gov.bd'
      },
      {
        id: 's119-court-3',
        caseTitle: 'Banglalink Digital Communications Ltd. vs. Bangladesh Bank & NBR',
        citation: '71 DLR (HCD) 42',
        court: 'Supreme Court of Bangladesh',
        benchOrDivision: 'High Court Division (Tax Division Bench)',
        judgmentDate: '14 January 2019',
        issueDecided: 'Withholding liability on international satellite transponder lease capacity and undersea fiber-optic bandwidth remittances.',
        holdingSummary: 'The Court held that payments for dedicated transponder and telecom bandwidth capacity qualify as payments for commercial industrial equipment and technical services, requiring statutory deduction at source unless a specific DTAA exemption certificate is granted.',
        legalSignificance: 'Dictates compliance procedure for international bandwidth, telecommunications, and digital transport infrastructure remittances.',
        url: 'http://www.supremecourt.gov.bd'
      }
    ],
    statutoryRules: {
      deductingAuthority: 'Any person making foreign outward remittance, and crucially the Authorized Dealer (AD) Commercial Bank executing the foreign exchange wire transfer.',
      psrRequirement: 'Non-residents without a permanent establishment in Bangladesh are generally exempt from local PSR, but must furnish Tax Identification Number in home country and valid TRC.',
      minimumTaxStatus: 'TDS under Section 119 constitutes final tax settlement for non-residents having no permanent establishment (PE) or branch office in Bangladesh under Section 163(2).',
      depositTimeline: 'Immediate. The AD Bank deducts and credits the tax into the government treasury simultaneously with the outward SWIFT/wire transmission.',
      treasuryChalanCode: '1/1141/0005/0111 (TDS on Non-Residents and Foreign Remittances)',
      statutoryCertificate: 'NBR Section 119 Clearance Certificate issued by Taxes Zone 11 (International Taxation Wing, Dhaka).',
      nonCompliancePenalty: 'Strict regulatory sanctions: Authorized Dealer bank faces Central Bank disciplinary action under FER Act 1947, and domestic remitter cannot claim foreign currency tax deductibility.'
    },
    crossReferences: [
      'Double Taxation Avoidance Agreements (DTAA treaties with 38 partner states)',
      'Section 163(2) (Final Tax Liability for Non-Residents without PE)',
      'Foreign Exchange Regulation Act 1947 (Central Bank Form TM)',
      'Taxes Zone 11 (International Taxes Authority)'
    ]
  }
};

export function getLegalDetailsForSection(sectionName: string): TdsLegalDetail {
  if (sectionName.includes('89')) {
    return TDS_LEGAL_DETAILS['Section 89 (Supply)'];
  }
  if (sectionName.includes('90')) {
    return TDS_LEGAL_DETAILS['Section 90 (Services)'];
  }
  if (sectionName.includes('119')) {
    return TDS_LEGAL_DETAILS['Section 119 (Non-Resident)'];
  }
  // Default to Section 90 if unknown
  return TDS_LEGAL_DETAILS['Section 90 (Services)'];
}
