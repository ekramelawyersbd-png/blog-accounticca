export interface ResourceTemplate {
  id: string;
  title: string;
  subtitle: string;
  category: 'Legal Contracts' | 'Tax & Compliance' | 'Corporate & RJSC' | 'Employment & HR';
  description: string;
  fileSizeEstimate: string;
  pages: number;
  badge?: string;
  tags: string[];
  governingLaw: string;
  sections: {
    heading: string;
    content: string | string[];
  }[];
  fullText: string;
}

export const RESOURCE_TEMPLATES: ResourceTemplate[] = [
  {
    id: 'mutual-nda-bangladesh',
    title: 'Mutual Non-Disclosure Agreement (NDA)',
    subtitle: 'Standard Bilateral Confidentiality & Trade Secret Protection Agreement',
    category: 'Legal Contracts',
    description: 'Comprehensive bilateral confidentiality agreement tailored to Bangladesh law. Protects proprietary business data, technical algorithms, client lists, financial records, and commercial negotiations.',
    fileSizeEstimate: '2 Pages • PDF',
    pages: 2,
    badge: 'Most Downloaded',
    tags: ['Contract Act 1872', 'Confidentiality', 'Startups & M&A', 'IP Protection'],
    governingLaw: 'Contract Act, 1872 & Arbitration Act, 2001 (Bangladesh)',
    sections: [
      {
        heading: '1. Definition of Confidential Information',
        content: 'Confidential Information includes all non-public technical, financial, commercial, or operational information, trade secrets, software code, customer data, and business plans disclosed by one party ("Disclosing Party") to the other ("Receiving Party"), whether orally or in writing, marked or reasonably understood to be confidential.'
      },
      {
        heading: '2. Obligations of Receiving Party',
        content: [
          'Maintain strict confidentiality using at least reasonable care.',
          'Restrict disclosure solely to employees, directors, and legal/financial advisors on a strict "need-to-know" basis.',
          'Ensure recipients are bound by confidentiality obligations no less restrictive than this Agreement.',
          'Not use Confidential Information for any purpose outside the authorized Evaluation Purpose.'
        ]
      },
      {
        heading: '3. Exclusions from Confidentiality',
        content: 'Information is not confidential if it: (a) is or becomes publicly known through no breach; (b) was already known prior to disclosure without restriction; (c) is independently developed without reference to the Disclosing Party\'s information; or (d) is required to be disclosed by a court of competent jurisdiction or statutory regulatory authority in Bangladesh with prior written notice.'
      },
      {
        heading: '4. Term and Duration',
        content: 'This Agreement shall remain in effect for a period of two (2) years from the Effective Date. The confidentiality obligations regarding trade secrets and proprietary source code shall survive indefinitely or until statutory disclosure.'
      },
      {
        heading: '5. Governing Law and Dispute Resolution',
        content: 'This Agreement shall be governed by and construed in accordance with the laws of the People\'s Republic of Bangladesh. Any dispute arising out of or in connection with this Agreement shall be referred to and finally resolved by arbitration in Dhaka under the Arbitration Act, 2001.'
      }
    ],
    fullText: `MUTUAL NON-DISCLOSURE AND CONFIDENTIALITY AGREEMENT

This Mutual Non-Disclosure Agreement ("Agreement") is made and entered into on this _____ day of ____________, 202___ ("Effective Date"), by and between:

PARTY A:
Name / Entity: ________________________________________________
Registered Address: ___________________________________________
Trade License / RJSC Reg. No.: _________________________________
Authorized Representative: ______________________________________

AND

PARTY B:
Name / Entity: ________________________________________________
Registered Address: ___________________________________________
Trade License / RJSC Reg. No.: _________________________________
Authorized Representative: ______________________________________

(Party A and Party B may collectively be referred to as "Parties" and individually as "Party").

RECITALS:
WHEREAS, the Parties wish to explore potential commercial collaboration, joint venture, investment, or service delivery ("Permitted Purpose"); and
WHEREAS, in the course of discussions, each Party may disclose to the other proprietary, confidential, or trade secret information;

NOW, THEREFORE, in consideration of the mutual covenants herein, the Parties agree as follows:

1. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" refers to any proprietary information disclosed by either Party ("Disclosing Party") to the other ("Receiving Party"), including but not limited to business plans, financial projections, customer data, software source code, know-how, technical architectures, pricing methodologies, and commercial terms, whether disclosed in writing, electronically, or orally.

2. OBLIGATIONS OF RECEIVING PARTY
The Receiving Party agrees:
a) To hold Confidential Information in strict confidence, exercising at least reasonable degree of care.
b) Not to disclose, publish, or release Confidential Information to any third party without prior written consent of the Disclosing Party.
c) To disclose Confidential Information only to its employees, directors, and legal advisors who have a need to know and are bound by similar confidentiality commitments.
d) To use the Confidential Information solely for evaluating or executing the Permitted Purpose.

3. EXCLUSIONS FROM CONFIDENTIAL INFORMATION
Confidential Information does not include information that:
a) Is or becomes publicly available without breach of this Agreement.
b) Was already in the lawful possession of the Receiving Party before receipt.
c) Is independently developed by the Receiving Party without reference to or reliance upon the Disclosing Party's information.
d) Is required to be disclosed by applicable court orders or regulatory mandates in Bangladesh, provided prompt notice is given to the Disclosing Party.

4. RETURN OR DESTRUCTION OF MATERIALS
Upon written request by the Disclosing Party or upon termination of this Agreement, the Receiving Party shall promptly return or certify the secure destruction of all physical and electronic copies of the Confidential Information.

5. DURATION OF OBLIGATIONS
This Agreement and the confidentiality obligations herein shall remain binding for a period of two (2) years from the Effective Date, provided that obligations with respect to trade secrets and source code shall survive perpetuity.

6. REMEDIES & INJUNCTIVE RELIEF
The Parties acknowledge that unauthorized disclosure or use of Confidential Information will cause irreparable harm for which monetary damages alone may be inadequate. Accordingly, the Disclosing Party shall be entitled to seek injunctive relief from courts of competent jurisdiction without prejudice to other rights.

7. GOVERNING LAW AND JURISDICTION
This Agreement shall be governed by and construed in accordance with the laws of the People's Republic of Bangladesh. Any dispute arising out of this Agreement shall be settled amicably within 30 days, failing which it shall be referred to arbitration in Dhaka in accordance with the Arbitration Act, 2001.

IN WITNESS WHEREOF, the Parties hereto have executed this Agreement by their duly authorized representatives as of the date first above written.

FOR PARTY A:
Signature: ____________________________________
Name: _________________________________________
Title: __________________________________________
Company Seal:

FOR PARTY B:
Signature: ____________________________________
Name: _________________________________________
Title: __________________________________________
Company Seal:`
  },
  {
    id: 'master-service-agreement-bangladesh',
    title: 'Master Service Agreement (MSA)',
    subtitle: 'Professional B2B Services Contract with Bangladesh Tax & VAT Deductions',
    category: 'Legal Contracts',
    description: 'Standard master service agreement for consulting, corporate, IT, and creative services. Contains statutory TDS (Tax Deducted at Source) and VDS (VAT Deducted at Source) clauses under the Income Tax Act 2023.',
    fileSizeEstimate: '3 Pages • PDF',
    pages: 3,
    badge: 'Corporate Standard',
    tags: ['Income Tax Act 2023', 'VAT Act 2012', 'B2B Consulting', 'Payment & TDS/VDS'],
    governingLaw: 'Contract Act, 1872 & Income Tax Act, 2023 (Bangladesh)',
    sections: [
      {
        heading: '1. Scope of Services & Statements of Work',
        content: 'Service Provider shall provide professional services described in attached Statements of Work (SOW). Each SOW specifies milestones, timelines, deliverables, acceptance criteria, and fee schedules.'
      },
      {
        heading: '2. Fees, Invoicing & Bangladesh Tax Deductions',
        content: [
          'Client shall remit invoiced amounts within 30 days of receipt.',
          'All statutory deductions for Tax Deducted at Source (TDS) under the Income Tax Act, 2023 and VAT Deducted at Source (VDS) under the VAT & Supplementary Duty Act, 2012 shall be deducted where mandated by law.',
          'Client must provide official Treasury Challan (Challan copy) or withholding tax certificate to Service Provider within 15 days of deduction.'
        ]
      },
      {
        heading: '3. Intellectual Property Rights & Ownership',
        content: 'Upon receipt of full payment, all customized deliverables created specifically for Client shall vest exclusively with Client as work-for-hire, while Service Provider retains ownership of pre-existing tools, libraries, and frameworks.'
      },
      {
        heading: '4. Limitation of Liability & Indemnification',
        content: 'Neither party shall be liable for indirect, punitive, or consequential damages. Total aggregate liability arising out of this agreement shall be capped at the total fees paid under the applicable SOW.'
      },
      {
        heading: '5. Termination & Dispute Resolution',
        content: 'Either party may terminate for convenience with 30 days prior written notice, or immediately upon material breach. Unresolved disputes shall be referred to arbitration in Dhaka under the Arbitration Act, 2001.'
      }
    ],
    fullText: `MASTER SERVICES AGREEMENT (MSA)

This Master Services Agreement ("Agreement") is dated this _____ day of ____________, 202___, by and between:

CLIENT:
Entity Name: __________________________________________________
Registered Address: ___________________________________________
BIN / TIN: ____________________________________________________
Authorized Representative: ______________________________________

AND

SERVICE PROVIDER:
Entity Name: __________________________________________________
Registered Address: ___________________________________________
BIN / TIN: ____________________________________________________
Authorized Representative: ______________________________________

1. ENGAGEMENT AND SERVICES
Service Provider agrees to perform services for Client as set forth in one or more Statements of Work ("SOW") executed by both Parties. Each SOW shall constitute an integral part of this Agreement.

2. FEES, INVOICING, AND TAX DEDUCTIONS
a) Invoicing: Service Provider shall submit invoices upon completion of milestones or on a monthly basis.
b) Payment: Invoices are payable within 30 days from invoice date.
c) Statutory Withholding (TDS & VDS): Payments made by Client are subject to statutory deduction of Income Tax at Source (TDS) under the Income Tax Act, 2023 and VAT at Source (VDS) under the VAT and Supplementary Duty Act, 2012. Client agrees to furnish official Treasury deposit certificates (Challan) and Mushak 6.6 certificates within 15 calendar days of deposit.

3. INDEPENDENT CONTRACTOR STATUS
Service Provider operates strictly as an independent contractor. Nothing in this Agreement creates any partnership, joint venture, or employer-employee relationship.

4. INTELLECTUAL PROPERTY RIGHTS
a) Client Materials: Client retains all right, title, and interest in data and materials provided to Service Provider.
b) Deliverables: Upon full payment of all undisputed fees, all copyright and proprietary rights in tailored deliverables shall transfer to Client.
c) Pre-Existing IP: Service Provider retains ownership of its pre-existing tools, methodologies, templates, and know-how.

5. CONFIDENTIALITY
Each Party agrees to hold confidential all proprietary information received from the other Party, using standard reasonable care, and not disclose to third parties without prior written consent.

6. WARRANTIES & LIMITATION OF LIABILITY
a) Service Provider warrants that services will be performed with professional skill and competence.
b) In no event shall either Party be liable for lost profits or consequential damages. The aggregate liability of either Party shall not exceed total fees paid under the relevant SOW.

7. TERMINATION
a) Either Party may terminate this Agreement without cause upon thirty (30) days written notice.
b) Either Party may terminate immediately upon written notice if the other Party commits a material breach and fails to cure such breach within 14 days.

8. GOVERNING LAW AND DISPUTE RESOLUTION
This Agreement shall be governed by the laws of Bangladesh. Any dispute arising out of this Agreement shall be settled through good-faith negotiation, failing which it shall be referred to arbitration under the Arbitration Act, 2001 in Dhaka, Bangladesh.

IN WITNESS WHEREOF, the Parties have executed this Agreement as of the date first written above.

FOR CLIENT:                                FOR SERVICE PROVIDER:
Signature: __________________________     Signature: __________________________
Name: _______________________________     Name: _______________________________
Title: ______________________________     Title: ______________________________
Date: _______________________________     Date: _______________________________`
  },
  {
    id: 'income-tax-return-checklist-2026-2027',
    title: 'Individual & Corporate Tax Return Checklist (AY 2026-27)',
    subtitle: 'Comprehensive Document Verification & Tax Audit Preparedness Sheet',
    category: 'Tax & Compliance',
    description: 'Complete step-by-step document checklist for individual taxpayers, professionals, directors, and corporate entities for filing returns under the Income Tax Act 2023 for Assessment Year 2026-27.',
    fileSizeEstimate: '2 Pages • PDF',
    pages: 2,
    badge: 'AY 2026-27 Verified',
    tags: ['Income Tax Act 2023', 'e-Return Checklist', 'Wealth Statement', 'Tax Audit'],
    governingLaw: 'Income Tax Act, 2023 & NBR Tax Return Circular 2026-27',
    sections: [
      {
        heading: '1. Identification & Baseline Credentials',
        content: [
          '12-digit e-TIN Certificate & National ID (NID) copy.',
          'Registered biometric mobile phone number for e-Return OTP verification.',
          'Previous Assessment Year (AY 2025-26) Acknowledgement Receipt & IT-10B Wealth Statement.'
        ]
      },
      {
        heading: '2. Income from Employment / Salary (Sec. 32)',
        content: [
          'Annual Salary Statement / Tax deduction certificate signed by employer.',
          'Proof of non-taxable allowances (Medical, Conveyance, House Rent within statutory limits).',
          'Details of Provident Fund, Gratuity, or Festival Bonus receipts.'
        ]
      },
      {
        heading: '3. Income from House Property, Business & Capital Gains',
        content: [
          'House Property: Tenancy agreements, rent collection receipts, municipal tax receipts, bank loan interest certificate.',
          'Business Income: Audited / Unaudited Profit & Loss Account, Balance Sheet, and Trade License.',
          'Capital Gains: Share trading tax deduction certificates (BO Account statement), sale deeds of real estate properties.'
        ]
      },
      {
        heading: '4. Investment Tax Rebate Supporting Documents',
        content: [
          'Deposit Pension Scheme (DPS) certificates (deductible up to statutory limits).',
          'Life insurance premium receipts and Provident Fund contribution certificates.',
          'Government treasury bonds or recognized mutual fund investment proofs.'
        ]
      },
      {
        heading: '5. Wealth Statement (IT-10B) & Liabilities Verification',
        content: [
          'Bank balance certificates as of 30th June 2026 for all personal accounts.',
          'Details of land, apartments, vehicles, gold/jewelry, and cash in hand.',
          'Bank loan liability statements, personal borrowing deeds, and family maintenance expense estimate.'
        ]
      }
    ],
    fullText: `INCOME TAX RETURN FILING CHECKLIST (ASSESSMENT YEAR 2026-2027)
Governing Law: Income Tax Act, 2023 | National Board of Revenue (NBR)

Taxpayer Name: _______________________________________________
e-TIN Number: _________________________ Circle / Zone: ________
Assessment Year: 2026-2027             Income Year: 2025-2026

[ ] SECTION A: MANDATORY TAX IDENTIFICATION & ACCESS
  [ ] 12-Digit e-TIN Certificate Copy
  [ ] National Identity Card (NID) / Passport copy
  [ ] NBR e-Return portal login credentials & Biometric SIM for OTP
  [ ] Previous Year (AY 2025-26) Return Acknowledgement & Tax Clearance Receipt
  [ ] Last year's Net Wealth Statement (IT-10B) copy

[ ] SECTION B: INCOME FROM EMPLOYMENT (SALARY)
  [ ] Salary Certificate issued and stamped by employer
  [ ] Bank Statements for the period July 1, 2025 to June 30, 2026
  [ ] Breakdown of basic pay, house rent allowance, conveyance & medical allowance
  [ ] Provident Fund contribution statement (both employee and employer share)
  [ ] Tax Deduction at Source (TDS) certificate issued by employer under Section 86

[ ] SECTION C: INCOME FROM HOUSE PROPERTY & RENT
  [ ] Tenancy Agreements with tenants
  [ ] Bank statements showing rent credit deposits
  [ ] City Corporation municipal tax / Land Revenue tax payment receipts
  [ ] House building loan interest payment certificate from scheduled bank

[ ] SECTION D: INCOME FROM BUSINESS, PROFESSION & INVESTMENTS
  [ ] Bank Interest Certificates & TDS deduction proofs (savings accounts, FDRs)
  [ ] Sanchayapatra (National Savings Certificate) Profit & TDS Certificate
  [ ] BO Account Statement & Dividend income tax deduction slips
  [ ] Business Profit & Loss statement, Balance Sheet, and Trade License

[ ] SECTION E: INVESTMENT TAX REBATE DOCUMENTS
  [ ] Life Insurance Premium receipts
  [ ] Deposit Pension Scheme (DPS) annual deposit statement
  [ ] Government Treasury Bond purchase certificates
  [ ] Approved Charitable donations / Zakat Fund receipts (under Schedule 5)

[ ] SECTION F: STATEMENT OF ASSETS & LIABILITIES (IT-10B)
  [ ] Bank balance certificates as of June 30, 2026 for all accounts
  [ ] Immovable property deeds (land, commercial spaces, apartments)
  [ ] Motor vehicle registration / BRTA fitness certificates & Advance Tax receipt
  [ ] Gold / Jewellery acquisition declarations
  [ ] Outstanding bank loans, mortgage certificates, and personal unsecured loans
  [ ] Family living expenses and lifestyle expenditure estimate breakdown

VERIFICATION & SIGN-OFF:
Completed By: __________________________   Designation: ________________________
Client Signature: ______________________   Date: _______________________________`
  },
  {
    id: 'board-resolution-bank-signatory',
    title: 'Board Resolution: Bank Account & Signatories',
    subtitle: 'RJSC & Companies Act 1994 Standard Corporate Banking Resolution',
    category: 'Corporate & RJSC',
    description: 'Official corporate board resolution format for opening and operating corporate bank accounts, appointing authorized signatories, and defining transaction thresholds under the Companies Act 1994.',
    fileSizeEstimate: '2 Pages • PDF',
    pages: 2,
    badge: 'Banking & RJSC',
    tags: ['Companies Act 1994', 'RJSC Resolution', 'Bank Account Opening', 'Board Minutes'],
    governingLaw: 'Companies Act, 1994 (Bangladesh)',
    sections: [
      {
        heading: '1. Meeting Details & Quorum',
        content: 'Record of the meeting of the Board of Directors held at the registered office of the company, with presence of quorum pursuant to the Articles of Association.'
      },
      {
        heading: '2. Resolution to Open Bank Account',
        content: 'Formal resolution authorizing the opening of Current, Foreign Currency, or Savings account in the name of the Company with a nominated scheduled bank in Bangladesh.'
      },
      {
        heading: '3. Designation of Authorized Signatories',
        content: [
          'Designation of Director(s) / CEO as Authorized Signatories.',
          'Operational mandate: Singly, Jointly, or under designated financial slab ceilings.',
          'Authority to execute checks, drafts, bills of exchange, and internet banking authorizations.'
        ]
      },
      {
        heading: '4. Certification & Specimen Signatures',
        content: 'Chairman and Managing Director certification of the true extract of minutes with attested specimen signatures.'
      }
    ],
    fullText: `CERTIFIED TRUE COPY OF THE RESOLUTION PASSED BY THE BOARD OF DIRECTORS OF
[COMPANY NAME LIMITED]
HELD AT ITS REGISTERED OFFICE ON [DATE] AT [TIME]

Present:
1. __________________________________ - Chairman
2. __________________________________ - Managing Director
3. __________________________________ - Director

QUORUM:
A quorum was present, and the meeting proceeded to transact business.

OPENING OF BANK ACCOUNT AND APPOINTMENT OF AUTHORIZED SIGNATORIES:
The Chairman informed the Board that for smooth business operations, it was desirable to open and maintain a Current / SND / CD Account in the name of the Company with [BANK NAME], [BRANCH NAME], Dhaka, Bangladesh.

Following discussion, it was unanimously RESOLVED:

1. "RESOLVED THAT a Current Account in the name and style of '[COMPANY NAME LIMITED]' be opened with [BANK NAME], [BRANCH NAME], Dhaka, Bangladesh."

2. "FURTHER RESOLVED THAT the said Bank be and is hereby authorized to honor all cheques, bills of exchange, promissory notes, and other negotiable instruments drawn, accepted, or made on behalf of the Company, and to act on all banking instructions signed by the following authorized persons:

Authorized Signatory 1:
Name: ___________________________________ Designation: Managing Director
Specimen Signature: ______________________

Authorized Signatory 2:
Name: ___________________________________ Designation: Director / Chairman
Specimen Signature: ______________________

Mode of Operation:
[ ] Singly by either of the above signatories for amounts up to BDT ___________
[ ] Jointly by both signatories for any transaction exceeding BDT ____________

3. "FURTHER RESOLVED THAT the authorized signatories be and are hereby empowered to apply for and operate Corporate Internet Banking, Debit Cards, and Trade Finance facilities on behalf of the Company."

4. "FURTHER RESOLVED THAT this resolution remains in full force and effect until formal written notice of revocation is delivered to and acknowledged by the Bank."

CERTIFIED TRUE EXTRACT:

________________________________________        ________________________________________
[Name of Chairman]                              [Name of Managing Director]
Chairman of the Board                           Managing Director
Company Seal:                                   Date: __________________`
  },
  {
    id: 'employment-contract-template-bangladesh',
    title: 'Employment Agreement Template (Labour Act 2006)',
    subtitle: 'Standard Full-Time Employment Contract with Probation & IP Clauses',
    category: 'Employment & HR',
    description: 'Standard employment agreement fully compliant with Bangladesh Labour Act 2006 (as amended). Covers appointment terms, salary breakdown, working hours, probationary period, termination notices, and confidentiality.',
    fileSizeEstimate: '3 Pages • PDF',
    pages: 3,
    badge: 'Labour Act Compliant',
    tags: ['Labour Act 2006', 'HR & Payroll', 'Probation & Notice', 'Employee IP'],
    governingLaw: 'Bangladesh Labour Act, 2006 (Amended 2013/2018)',
    sections: [
      {
        heading: '1. Position, Duties & Probation Period',
        content: 'Designation of employee, principal responsibilities, standard probation duration of 3 to 6 months pursuant to Section 4 of Bangladesh Labour Act 2006, and confirmation assessment.'
      },
      {
        heading: '2. Remuneration, Allowances & Tax Deductions',
        content: 'Gross salary breakdown (Basic, House Rent, Medical, Conveyance) compliant with statutory minimum wage regulations. Company shall deduct employee income tax at source (TDS) where applicable.'
      },
      {
        heading: '3. Working Hours, Overtime & Leave Entitlements',
        content: 'Standard 48 hours weekly work limit, casual leave, sick leave, annual leave with wages in accordance with Section 115-117 of Bangladesh Labour Act 2006.'
      },
      {
        heading: '4. Non-Disclosure & Intellectual Property Assignment',
        content: 'Strict confidentiality of company trade secrets and complete assignment of all inventions, software code, and creative works produced during employment.'
      },
      {
        heading: '5. Termination, Resignation & Separation Benefits',
        content: 'Notice periods for probationers (30 days) and permanent workers (60-120 days), severance payment, and compliance with statutory separation procedures.'
      }
    ],
    fullText: `EMPLOYMENT AGREEMENT

This Employment Agreement ("Agreement") is executed on this _____ day of ____________, 202___, by and between:

EMPLOYER:
Company Name: __________________________________________________
Registered Address: ___________________________________________
Represented by: _______________________________________________

AND

EMPLOYEE:
Full Name: ____________________________________________________
Father's Name: ________________________________________________
NID No.: __________________________ Mobile: ___________________
Present Address: ______________________________________________

1. APPOINTMENT AND PROBATION
The Employer hereby appoints the Employee to the position of [JOB TITLE]. The Employee shall undergo a probationary period of three (3) to six (6) months from the joining date. Upon satisfactory performance, the Employer shall issue a written confirmation letter.

2. REMUNERATION AND BENEFITS
a) Gross Monthly Salary: BDT ________________/- (Bangladeshi Taka in words).
   - Basic Salary (50-60%): BDT ________________/-
   - House Rent Allowance: BDT ________________/-
   - Medical Allowance: BDT ________________/-
   - Conveyance Allowance: BDT ________________/-
b) Statutory Deductions: Salary is subject to mandatory tax deduction at source (TDS) under the Income Tax Act, 2023.
c) Festival Bonus: Two festival bonuses per calendar year as per Company HR Policy.

3. WORKING HOURS AND LEAVE
a) Working hours shall be 8 hours per day, 5-6 days per week in accordance with the Bangladesh Labour Act, 2006.
b) The Employee is entitled to Casual Leave (10 days), Sick Leave (14 days with medical certificate), and Annual Earned Leave as per statutory regulations.

4. CONFIDENTIALITY AND CODE OF CONDUCT
The Employee covenants that they shall not, during or after employment, disclose to any third party any confidential information, customer lists, or proprietary systems of the Employer.

5. INTELLECTUAL PROPERTY
All inventions, software code, designs, and work products developed by the Employee in the course of employment shall remain the sole and exclusive property of the Employer.

6. TERMINATION AND NOTICE PERIOD
a) During probation, either Party may terminate this Agreement by providing 30 days written notice or payment in lieu thereof.
b) After confirmation, termination by either Party requires 60 to 90 days written notice or salary in lieu as provided under the Bangladesh Labour Act, 2006.
c) The Employer reserves the right to terminate employment immediately for gross misconduct, theft, or breach of trust following statutory due process.

7. GOVERNING LAW
This Agreement shall be governed by and construed in accordance with the laws of the People's Republic of Bangladesh, specifically the Bangladesh Labour Act, 2006.

SIGNATURES:

EMPLOYER REPRESENTATIVE:                   EMPLOYEE:
Signature: __________________________     Signature: __________________________
Name: _______________________________     Name: _______________________________
Title: ______________________________     Date: _______________________________
Date: _______________________________`
  },
  {
    id: 'vat-vds-compliance-checklist-bangladesh',
    title: 'VAT & VDS Compliance Checklist (VAT Act 2012)',
    subtitle: 'Mushak 6.3, 6.6, VDS Deductions & Monthly Return Verification Guide',
    category: 'Tax & Compliance',
    description: 'Essential compliance checklist for VAT registered businesses and withholding entities. Verifies Tax Invoices (Mushak 6.3), VDS Certificates (Mushak 6.6), Treasury Challan deposits, and Mushak 9.1 monthly filings.',
    fileSizeEstimate: '2 Pages • PDF',
    pages: 2,
    badge: 'NBR VAT Act 2012',
    tags: ['VAT Act 2012', 'Mushak 6.3', 'Mushak 6.6', 'Monthly VDS Filing'],
    governingLaw: 'Value Added Tax and Supplementary Duty Act, 2012 (Bangladesh)',
    sections: [
      {
        heading: '1. Registration & Baseline Verification',
        content: [
          '13-digit Business Identification Number (BIN) certificate displayed at place of business.',
          'Verification of VAT registration status of suppliers and sub-contractors on NBR portal.'
        ]
      },
      {
        heading: '2. Tax Invoices & Supply Documentation',
        content: [
          'Issuance of valid Tax Invoice (Mushak 6.3) at the time of supply for every transaction.',
          'Purchase register (Mushak 6.1) and Sales register (Mushak 6.2) maintained concurrently.'
        ]
      },
      {
        heading: '3. VAT Deducted at Source (VDS) Obligations',
        content: [
          'Identification of procurement services subject to mandatory VDS under SRO guidelines.',
          'Issuance of VDS Certificate (Mushak 6.6) to supplier within three (3) working days of deduction.',
          'Deposit of deducted VAT into Government Treasury via e-Challan / A-Challan within statutory time limit.'
        ]
      },
      {
        heading: '4. Monthly Return (Mushak 9.1) Filing Protocol',
        content: [
          'Reconciliation of monthly output VAT with sales registers.',
          'Reconciliation of input tax credit with verified Mushak 6.3 invoices.',
          'Submission of Mushak 9.1 return online on or before the 15th day of the following month.'
        ]
      }
    ],
    fullText: `VAT & VDS STATUTORY COMPLIANCE CHECKLIST
Governing Law: Value Added Tax and Supplementary Duty Act, 2012 | NBR Bangladesh

Entity Name: __________________________________________________
13-Digit BIN: __________________________ VAT Circle: ___________
Tax Period / Month: ___________________ Financial Year: ________

[ ] 1. BASELINE REGISTRATION & PREMISES COMPLIANCE
  [ ] 13-digit online BIN certificate visibly displayed at primary registered premises
  [ ] Branches and depots registered or centrally registered with approval
  [ ] Trade License, TIN, and Bank details synchronized with VAT portal

[ ] 2. INVOICE MANAGEMENT (MUSHAK 6.3)
  [ ] Prescribed Tax Invoice (Mushak 6.3) issued for every taxable supply
  [ ] Invoice includes Supplier BIN, Buyer BIN, sequential number, date, and VAT breakdown
  [ ] Credit Note (Mushak 6.7) or Debit Note (Mushak 6.8) issued in case of adjustment

[ ] 3. STATUTORY REGISTERS & RECORD KEEPING
  [ ] Purchase Register (Mushak 6.1) updated concurrently with supplier invoices
  [ ] Sales Register (Mushak 6.2) updated concurrently with deliveries
  [ ] All commercial records and invoices archived for the statutory 5-year period

[ ] 4. VAT DEDUCTED AT SOURCE (VDS) CHECKS
  [ ] Identification of services liable for VDS under current NBR Withholding SRO
  [ ] Correct rate of VAT (e.g., 5%, 7.5%, 10%, 15%) withheld from supplier invoices
  [ ] Mushak 6.6 (VDS Certificate) issued in triplicate within 3 working days
  [ ] Withheld VAT deposited into Bangladesh Bank / Sonali Bank under code 1/1133/...

[ ] 5. MONTHLY RETURN (MUSHAK 9.1) FILING
  [ ] Input tax credit claimed only against valid, verifiable Mushak 6.3 invoices
  [ ] Total taxable supplies matched with monthly financial accounts
  [ ] Online submission of Mushak 9.1 on or before the 15th of the month
  [ ] Acknowledgement slip downloaded and filed with monthly accounting bundle

COMPLIANCE OFFICER SIGNATURE:
Name: _______________________________   Designation: ________________________
Signature: __________________________   Date: _______________________________`
  }
];
