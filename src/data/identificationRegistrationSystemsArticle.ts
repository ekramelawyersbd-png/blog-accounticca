import { Article } from '../types';

export interface IdentificationSystemRecord {
  id: number;
  name: string;
  acronym: string;
  issuingEntity: string;
  legalBasis: string;
  format: string;
  purpose: string;
  fee: string;
  timeline: string;
  source: string;
  domain: 'Bangladesh Tax & Regulatory' | 'Canada CRA & Corporate' | 'Global Payment & ISO (BIN/IIN)' | 'US Municipal & Corporate';
}

export const IDENTIFICATION_SYSTEMS_DATA: IdentificationSystemRecord[] = [
  {
    id: 1,
    name: 'Taxpayer Identification Number',
    acronym: 'TIN / eTIN',
    issuingEntity: 'National Board of Revenue (NBR), Bangladesh / Tax Authority',
    legalBasis: 'Income Tax Act, 2023 (Section 261) / Income tax law',
    format: '12 digits',
    purpose: 'Taxpayer identification for income tax return filing, asset reporting, fulfilling tax compliance, tracking filings/payments, accessing financial services (opening bank accounts, buying real estate, business licensing), and mandatory business/financial transactions',
    fee: 'Free / Completely free',
    timeline: 'Instant / Real-time (Online) / Immediately',
    source: '[1-4]',
    domain: 'Bangladesh Tax & Regulatory'
  },
  {
    id: 2,
    name: 'Business Identification Number',
    acronym: 'BIN / eBIN / VAT Registration',
    issuingEntity: 'National Board of Revenue (NBR), Bangladesh',
    legalBasis: 'Value Added Tax and Supplementary Duty Act, 2012 (with amendments up to 2025); VAT & SD Rules, 2016; Finance Act, 2026',
    format: '9, 11, or 13 digits',
    purpose: 'Official business registration for Value Added Tax (VAT) and commercial operations; required for businesses with annual turnover above BDT 5 million, importers/exporters, branch/liaison offices, and tender suppliers to charge/collect VAT, claim input tax credits, issue tax invoices, open LCs, clear customs, access banking, and obtain trade licenses',
    fee: 'Free / Statutory treasury rates (Professional packages range from ৳5,000 to ৳20,000)',
    timeline: 'Processed immediately to 3–7 working days (up to 15–30 days if site inspection/clarifications needed)',
    source: '[1, 5-10]',
    domain: 'Bangladesh Tax & Regulatory'
  },
  {
    id: 3,
    name: 'Business Number',
    acronym: 'BN',
    issuingEntity: 'Canada Revenue Agency (CRA)',
    legalBasis: 'Proceeds of Crime (Money Laundering) and Terrorist Financing Regulations / Bill C-2 (Strong Borders Act)',
    format: '9 digits (or 15-character alphanumeric format with 9-digit BN + 2-letter program code + 4-digit reference number)',
    purpose: 'Federal tax identification number and standard identifier for legal entities to interact with Canadian federal, provincial, and municipal government programs; serves as the root key for setting up CRA program accounts (GST/HST, payroll, corporate tax, import-export)',
    fee: 'Completely free ($0)',
    timeline: 'Instant / Real-time online assignment via BRO (activation within 48 hours to 10 business days; several days to 6 weeks by mail/fax/phone)',
    source: '[5, 11-17]',
    domain: 'Canada CRA & Corporate'
  },
  {
    id: 4,
    name: 'GST/HST Account',
    acronym: 'RT / GST/HST Program Account',
    issuingEntity: 'Canada Revenue Agency (CRA) / Revenu Québec (for Quebec)',
    legalBasis: 'Mandatory for annual worldwide taxable sales of $30,000 or more',
    format: '9-digit BN + RT + 4-digit reference number (e.g., 123456789 RT 0001)',
    purpose: 'CRA program account used by businesses for collecting, remitting, and tracking Goods and Services Tax (GST) / Harmonized Sales Tax (HST) and claiming Input Tax Credits (ITCs)',
    fee: 'Completely free ($0)',
    timeline: 'Instant confirmation online during registration (Immediate session via BRO / Form RC1 by mail)',
    source: '[11, 13-15]',
    domain: 'Canada CRA & Corporate'
  },
  {
    id: 5,
    name: 'Payroll Deductions Account',
    acronym: 'RP / Payroll Account',
    issuingEntity: 'Canada Revenue Agency (CRA)',
    legalBasis: 'Required for businesses employing staff',
    format: '9-digit BN + RP + 4-digit reference number (e.g., 123456789 RP 0001)',
    purpose: 'CRA program account used by employers paying salaries, wages, or bonuses to deduct and remit income taxes, Employment Insurance (EI) premiums, and Canada Pension Plan (CPP) contributions',
    fee: 'Completely free ($0)',
    timeline: 'Instant confirmation online during registration (Immediate session via BRO / Form RC1 by mail)',
    source: '[11, 13-15]',
    domain: 'Canada CRA & Corporate'
  },
  {
    id: 6,
    name: 'Corporation Income Tax Account',
    acronym: 'RC / Corporate Income Tax Program Account',
    issuingEntity: 'Canada Revenue Agency (CRA) / Corporations Canada',
    legalBasis: 'Required for incorporated businesses',
    format: '9-digit BN + RC + 4-digit reference number (e.g., 123456789 RC 0001)',
    purpose: 'CRA program account allowing incorporated businesses to file corporate T2 tax returns, pay installments, and manage corporate tax matters (automatically assigned upon federal or certain provincial incorporations)',
    fee: 'Completely free ($0)',
    timeline: 'Instant confirmation online during registration (Immediate session via BRO / Form RC1 by mail)',
    source: '[11, 14, 15, 17]',
    domain: 'Canada CRA & Corporate'
  },
  {
    id: 7,
    name: 'Import-Export Program Account',
    acronym: 'RM Account / Import-Export Account',
    issuingEntity: 'Canada Revenue Agency (CRA) / Canada Border Services Agency (CBSA)',
    legalBasis: 'Not in source',
    format: '9-digit BN + RM + 4-digit reference number (e.g., 123456789 RM 0001)',
    purpose: 'Authorizes businesses to engage in international trade and clear commercial goods through Canadian customs with the CBSA',
    fee: 'Not in source',
    timeline: 'A few business days to several weeks (depending on setup via CARM or BRO)',
    source: '[13-15]',
    domain: 'Canada CRA & Corporate'
  },
  {
    id: 8,
    name: 'Information Returns Account',
    acronym: 'RZ / Information Returns Program Account',
    issuingEntity: 'Canada Revenue Agency (CRA)',
    legalBasis: 'Not in source',
    format: '9-digit BN + RZ + 4-digit reference number (e.g., 123456789 RZ 0001)',
    purpose: 'CRA program account used by businesses to file information returns and tax slips such as T5, T5013, T5018, or TFSA returns',
    fee: 'Completely free ($0)',
    timeline: 'Instant confirmation online during registration (Immediate session via BRO / Form RC1 by mail)',
    source: '[11, 14, 15]',
    domain: 'Canada CRA & Corporate'
  },
  {
    id: 9,
    name: 'Registered Charity Account',
    acronym: 'RR / Registered Charity Program Account',
    issuingEntity: 'Canada Revenue Agency (CRA)',
    legalBasis: 'Not in source',
    format: '9-digit BN + RR + 4-digit reference number (e.g., 123456789 RR 0001)',
    purpose: 'CRA program account used by organizations registered as charities or non-profits for charitable tax purposes',
    fee: 'Completely free ($0)',
    timeline: 'Instant confirmation online during registration (Immediate session via BRO / Form RC1 by mail)',
    source: '[11, 15]',
    domain: 'Canada CRA & Corporate'
  },
  {
    id: 10,
    name: 'Issuer Identifier Number (International Interchange)',
    acronym: 'IIN / Bank Identification Number (BIN) / Institution Identification Number',
    issuingEntity: 'American National Standards Institute (ANSI) / International Organization for Standardization (ISO) / ABA / CUSIP Global Services / NEN',
    legalBasis: 'ISO/IEC 7812 / ISO/IEC 7812-1 / ISO/IEC 7812-2',
    format: '8 digits (formerly 6 digits)',
    purpose: 'Uniquely identifies card-issuing institutions globally for routing card transactions, clearing, and settlement across international payment networks',
    fee: 'Variable ($350 GBP to $2,500 USD; NEN National: €750 + VAT, International: US$950 + VAT)',
    timeline: '5 business days (ANSI) to 3 weeks (NEN) (up to 8 weeks for blockholder approval)',
    source: '[5, 18-23]',
    domain: 'Global Payment & ISO (BIN/IIN)'
  },
  {
    id: 11,
    name: 'Issuer Identifier Number (Closed Environment)',
    acronym: 'Closed Environment IIN / National IIN',
    issuingEntity: 'American National Standards Institute (ANSI)',
    legalBasis: 'ISO/IEC 7812 / U.S. National Numbering System',
    format: '9 digits (Format: 9 840 XXXXX)',
    purpose: 'National use ONLY; used when the issuer acquires its own transactions and its network does not accept, allow, or process card programs other than its own',
    fee: '$2,500 non-refundable application fee',
    timeline: 'Typically within 5 business days once completed application and fee are received',
    source: '[18]',
    domain: 'Global Payment & ISO (BIN/IIN)'
  },
  {
    id: 12,
    name: 'IIN Blockholder',
    acronym: 'Blockholder',
    issuingEntity: 'American National Standards Institute (ANSI) / ISO/IEC 7812 Registration Authority',
    legalBasis: 'ISO/IEC 7812 / ISO/IEC 7812-1',
    format: 'Fulfills blocks of 8-digit IINs',
    purpose: 'Assigned to an entity that owns 2 or more IINs (located within or outside the U.S.)',
    fee: '$3,000 non-refundable application fee (plus additional fees per assigned number)',
    timeline: 'Up to 8 weeks',
    source: '[18, 20]',
    domain: 'Global Payment & ISO (BIN/IIN)'
  },
  {
    id: 13,
    name: 'Bank Identification Number',
    acronym: 'BIN / Issuing BIN',
    issuingEntity: 'American Bankers Association (ABA) / ISO / Card Networks (Visa, Mastercard)',
    legalBasis: 'ISO/IEC 7812-1 / ISO/IEC 7812-2',
    format: '6 to 8 digits (first 6 to 8 digits of the Primary Account Number [PAN])',
    purpose: 'Identifies card issuers for transaction routing, payment processing, fraud checks, card type, product level, country, and currency; mandated transition to 8-digit BINs',
    fee: 'Mastercard fees: USD 12,500 (new 6-digit), USD 500 (new 8-digit), USD 25,000 (special 6-digit), USD 10,000 (special 8-digit)',
    timeline: 'Effective April 2022 mandate (Visa assigning 8-digit BINs since 2019)',
    source: '[21, 22, 24, 25]',
    domain: 'Global Payment & ISO (BIN/IIN)'
  },
  {
    id: 14,
    name: 'UK National Issuer Identification Number',
    acronym: 'UK National IIN',
    issuingEntity: 'Pay.UK (agent for BSI on behalf of ISO/IEC JTC1/SC17)',
    legalBasis: 'ISO/IEC 7812',
    format: '8 digits (first 8 digits of PAN)',
    purpose: 'Identifies card issuers and routes card transactions for institutions based in the UK ONLY',
    fee: '£350 + VAT (one-off payment)',
    timeline: 'Not in source',
    source: '[26]',
    domain: 'Global Payment & ISO (BIN/IIN)'
  },
  {
    id: 15,
    name: 'UK International Issuer Identification Number',
    acronym: 'UK International IIN',
    issuingEntity: 'Pay.UK (agent for BSI on behalf of ISO/IEC JTC1/SC17)',
    legalBasis: 'ISO/IEC 7812',
    format: '8 digits (first 8 digits of PAN)',
    purpose: 'Identifies card issuers and routes card transactions for UK-based institutions issuing cards designed for international acceptance',
    fee: '£660 + VAT (plus £30 + VAT annual maintenance fee starting year 2)',
    timeline: 'Not in source',
    source: '[26]',
    domain: 'Global Payment & ISO (BIN/IIN)'
  },
  {
    id: 16,
    name: 'Overseas International Issuer Identification Number',
    acronym: 'Overseas International IIN',
    issuingEntity: 'Pay.UK Limited (sponsoring on behalf of ISO/IEC JTC1/SC17)',
    legalBasis: 'ISO/IEC 7812',
    format: '8 digits (first 8 digits of PAN)',
    purpose: 'Identifies card issuers and routes card transactions for institutions based outside the UK that lack a Sponsoring Authority',
    fee: '£660 (one-off payment, VAT zero-rated outside UK)',
    timeline: 'Not in source',
    source: '[26]',
    domain: 'Global Payment & ISO (BIN/IIN)'
  },
  {
    id: 17,
    name: 'Acquirer Reference ID',
    acronym: 'ARID',
    issuingEntity: 'Mastercard',
    legalBasis: 'Mastercard acquirer standard (renamed from Acquirer Only BIN)',
    format: '6 digits',
    purpose: 'Identifies acquiring customers/acquirers for transaction processing',
    fee: 'USD 2,000 (one-time fee)',
    timeline: 'Not in source',
    source: '[21]',
    domain: 'Global Payment & ISO (BIN/IIN)'
  },
  {
    id: 18,
    name: 'Acquiring Identifier',
    acronym: 'Acquiring Numerics',
    issuingEntity: 'Visa',
    legalBasis: 'Not in source',
    format: '6 digits',
    purpose: 'Used to support acquiring transactions (reclassified from ISO BINs)',
    fee: 'Not in source',
    timeline: 'Not in source',
    source: '[25]',
    domain: 'Global Payment & ISO (BIN/IIN)'
  },
  {
    id: 19,
    name: 'Primary Account Number',
    acronym: 'PAN',
    issuingEntity: 'Card Issuers / Card Networks (e.g., Visa)',
    legalBasis: 'PCI DSS / ISO/IEC 7812',
    format: '8 to 19 digits (typically 16 or 19 digits)',
    purpose: 'Unique payment card number identifying the specific account, containing the BIN, individual account identifier, and check digit',
    fee: 'Not in source',
    timeline: 'Not in source',
    source: '[22, 25]',
    domain: 'Global Payment & ISO (BIN/IIN)'
  },
  {
    id: 20,
    name: 'Account Range',
    acronym: 'Account Range Table (ARDEF)',
    issuingEntity: 'Visa',
    legalBasis: 'Not in source',
    format: 'First 9 digits of a Primary Account Number (PAN)',
    purpose: 'Used to differentiate specific products, processing parameters, and proper clearing of transactions',
    fee: 'Not in source',
    timeline: 'Requires CIQ request to reactivate ranges',
    source: '[25]',
    domain: 'Global Payment & ISO (BIN/IIN)'
  },
  {
    id: 21,
    name: 'Trade Waste Removal License',
    acronym: 'Trade Waste License / BIC License / Trade Waste Permit / Carting License',
    issuingEntity: 'NYC Business Integrity Commission (BIC) / NYS DCJS',
    legalBasis: '16 RCNY Section 1-06 & Local Law 199 of 2019 / Administrative Code Title 16-A',
    format: 'Serial License / Vehicle Decal',
    purpose: 'Regulates trade waste haulers and commercial safety in New York City',
    fee: 'License Fee: $5,000 (2-year term); Investigation Fee: $600; Disclosure Fee: $600 per principal/key employee; Vehicle Fee: $500 per vehicle; Fingerprint Fee: $75 per person',
    timeline: '2-year term upon approval (pending background investigation)',
    source: '[5, 27, 28]',
    domain: 'US Municipal & Corporate'
  },
  {
    id: 22,
    name: 'Class 2 Registration Application (Construction and Demolition Debris)',
    acronym: 'Class 2 Registration / C & D Registration',
    issuingEntity: 'NYC Business Integrity Commission (BIC)',
    legalBasis: 'Administrative Code of NYC ("Local Law 42 of 1996"), Title 16-A, Ch. 1; Rules of NYC, Title 17, Ch. 1',
    format: 'Not in source',
    purpose: 'Exemption from licensing requirements for businesses solely removing construction, demolition, alteration, or excavation waste in NYC',
    fee: '$3,500 registration fee for a 2-year term (plus 2% credit card fee); $500 fee per vehicle',
    timeline: '2-year initial term and 2-year renewals',
    source: '[28, 29]',
    domain: 'US Municipal & Corporate'
  },
  {
    id: 23,
    name: 'Micro-hauler Licenses',
    acronym: 'Not in source',
    issuingEntity: 'NYC Business Integrity Commission (BIC) / NYS DCJS',
    legalBasis: 'Not in source',
    format: 'Not in source',
    purpose: 'Micro-hauler trade waste licensing in NYC',
    fee: '$600 license fee for a 2-year term; $500 vehicle fee; $100 disclosure fee per managerial employee; Fingerprint fee as required',
    timeline: '2-year initial term and 2-year renewals',
    source: '[28]',
    domain: 'US Municipal & Corporate'
  },
  {
    id: 24,
    name: 'Self-Hauler Registrations',
    acronym: 'Not in source',
    issuingEntity: 'NYC Business Integrity Commission (BIC)',
    legalBasis: 'Not in source',
    format: 'Not in source',
    purpose: 'Self-hauler trade waste registration in NYC',
    fee: '$1,000 registration fee for a 2-year term; $400 vehicle fee',
    timeline: '2-year initial term and 2-year renewals',
    source: '[28]',
    domain: 'US Municipal & Corporate'
  },
  {
    id: 25,
    name: 'Broker Registrations',
    acronym: 'Not in source',
    issuingEntity: 'NYC Business Integrity Commission (BIC)',
    legalBasis: 'Not in source',
    format: 'Not in source',
    purpose: 'Trade waste broker registration in NYC',
    fee: '$5,000 registration fee for a 2-year term',
    timeline: '2-year initial term and 2-year renewals',
    source: '[28]',
    domain: 'US Municipal & Corporate'
  },
  {
    id: 26,
    name: 'Labor Union or Labor Organizations Registrations',
    acronym: 'Not in source',
    issuingEntity: 'NYC Business Integrity Commission (BIC)',
    legalBasis: 'Not in source',
    format: 'Not in source',
    purpose: 'Registration of labor unions or labor organizations operating in the trade waste industry in NYC',
    fee: '$4,000 registration application fee for a 5-year term; $600 disclosure fee per officer',
    timeline: '5-year initial term and 5-year renewals',
    source: '[28]',
    domain: 'US Municipal & Corporate'
  },
  {
    id: 27,
    name: 'Withholding Identification Number',
    acronym: 'WIN / TWIN',
    issuingEntity: 'National Board of Revenue (NBR), Bangladesh',
    legalBasis: 'Income Tax Act, 2023, Section 263 (as amended by Finance Act, 2026)',
    format: 'Same format as TIN when held, or a distinct WIN / Temporary WIN (TWIN)',
    purpose: 'Mandatory identifier for entities responsible for deducting or collecting tax at source (withholding tax)',
    fee: 'Not in source',
    timeline: 'Not in source',
    source: '[2]',
    domain: 'Bangladesh Tax & Regulatory'
  },
  {
    id: 28,
    name: 'Enlistment Certificate',
    acronym: 'Turnover Tax Enlistment',
    issuingEntity: 'National Board of Revenue (NBR), Bangladesh',
    legalBasis: 'VAT and Supplementary Duty Act 2012',
    format: 'Not in source',
    purpose: 'Registration for businesses with annual turnover between BDT 3 million and BDT 5 million under the 4% turnover tax scheme',
    fee: 'Not in source',
    timeline: 'Not in source',
    source: '[6]',
    domain: 'Bangladesh Tax & Regulatory'
  },
  {
    id: 29,
    name: 'Trade License',
    acronym: 'Commercial License',
    issuingEntity: 'City Corporation, Municipality (Paurashava), or Union Parishad',
    legalBasis: 'Local Government Acts / Income Tax Act, 2023',
    format: 'Varies by local authority',
    purpose: 'Authorization to conduct business or trade operations within a local jurisdiction',
    fee: 'Varies by business type and location',
    timeline: 'Not in source',
    source: '[1]',
    domain: 'Bangladesh Tax & Regulatory'
  },
  {
    id: 30,
    name: 'Company Incorporation Certificate',
    acronym: 'Company Registration',
    issuingEntity: 'Registrar of Joint Stock Companies and Firms (RJSC), Bangladesh',
    legalBasis: 'Companies Act, 1994 (Act No. 18 of 1994)',
    format: 'Varies',
    purpose: 'Legal incorporation of limited liability companies, partnerships, and joint ventures',
    fee: 'Not in source',
    timeline: 'Not in source',
    source: '[1]',
    domain: 'Bangladesh Tax & Regulatory'
  },
  {
    id: 31,
    name: 'Societies Registration Certificate',
    acronym: 'Society / Club Registration',
    issuingEntity: 'Registrar of Joint Stock Companies and Firms (RJSC), Bangladesh',
    legalBasis: 'Societies Registration Act, 1860 (Act No. XXI of 1860)',
    format: 'Varies',
    purpose: 'Legal incorporation of non-profit societies, trade associations, and social clubs',
    fee: 'Not in source',
    timeline: 'Not in source',
    source: '[1]',
    domain: 'Bangladesh Tax & Regulatory'
  },
  {
    id: 32,
    name: 'Articles of Incorporation (Alberta)',
    acronym: 'Alberta Corporate Incorporation',
    issuingEntity: 'Alberta Corporate Registry',
    legalBasis: 'Not in source',
    format: 'Alberta Incorporation Number',
    purpose: 'Provincial incorporation of a corporation in Alberta establishing legal corporate entity, share structure, and directors',
    fee: 'NUANS report fee $25–$30 (plus statutory filing fee)',
    timeline: 'Filing completed in 1–2 days; confirmation email in 3–5 days',
    source: '[11]',
    domain: 'Canada CRA & Corporate'
  },
  {
    id: 33,
    name: 'Declaration of Trade Name (Alberta)',
    acronym: 'Trade Name Registration',
    issuingEntity: 'Alberta Corporate Registry',
    legalBasis: 'Not in source',
    format: 'Not in source',
    purpose: 'Provincial business name registration for sole proprietorships operating in Alberta',
    fee: 'Approximately $75–$100 filing fee',
    timeline: 'Valid for 5 years',
    source: '[11]',
    domain: 'Canada CRA & Corporate'
  },
  {
    id: 34,
    name: 'Declaration of Partnership (Alberta)',
    acronym: 'Partnership Registration',
    issuingEntity: 'Alberta Corporate Registry',
    legalBasis: 'Not in source',
    format: 'Not in source',
    purpose: 'Provincial registration for general partnerships operating in Alberta',
    fee: 'Filing fee applies',
    timeline: 'Valid for 5 years',
    source: '[11]',
    domain: 'Canada CRA & Corporate'
  },
  {
    id: 35,
    name: 'National Identity Card',
    acronym: 'NID',
    issuingEntity: 'Government of Bangladesh / Election Commission',
    legalBasis: 'National Identity Registration Act',
    format: '10, 13, or 17 digits',
    purpose: 'Personal identity verification for citizens, tax registration, e-Return portal registration, and SIM card biometric verification',
    fee: 'Not in source',
    timeline: 'Not in source',
    source: '[1, 3]',
    domain: 'Bangladesh Tax & Regulatory'
  },
  {
    id: 36,
    name: 'Social Insurance Number',
    acronym: 'SIN',
    issuingEntity: 'Employment and Social Development Canada',
    legalBasis: 'Not in source',
    format: '9 digits (temporary SINs start with 9)',
    purpose: 'Individual identification for working in Canada, accessing government benefits, and validating business owners/directors during CRA business program account registrations',
    fee: 'Not in source',
    timeline: 'Not in source',
    source: '[13, 15, 17]',
    domain: 'Canada CRA & Corporate'
  },
  {
    id: 37,
    name: 'Procurement Business Number',
    acronym: 'PBN',
    issuingEntity: 'Public Services and Procurement Canada (via CanadaBuys)',
    legalBasis: 'Not in source',
    format: 'Not in source',
    purpose: 'Required for business suppliers to bid on Canadian federal government tender opportunities and contracts',
    fee: 'Not in source',
    timeline: 'Not in source',
    source: '[17]',
    domain: 'Canada CRA & Corporate'
  },
  {
    id: 38,
    name: 'Luxury Tax Account',
    acronym: 'LT',
    issuingEntity: 'Canada Revenue Agency (CRA)',
    legalBasis: 'Not in source',
    format: 'Not in source',
    purpose: 'CRA program account for Luxury Tax',
    fee: 'Not in source',
    timeline: 'Immediate session online via BRO / Submit documents in CRA account / Mail',
    source: '[15]',
    domain: 'Canada CRA & Corporate'
  },
  {
    id: 39,
    name: 'Underused Housing Tax Account',
    acronym: 'RU',
    issuingEntity: 'Canada Revenue Agency (CRA)',
    legalBasis: 'Not in source',
    format: 'Not in source',
    purpose: 'CRA program account for Underused Housing Tax',
    fee: 'Not in source',
    timeline: 'Online via BRO',
    source: '[15]',
    domain: 'Canada CRA & Corporate'
  },
  {
    id: 40,
    name: 'Global Minimum Tax Account',
    acronym: 'PT',
    issuingEntity: 'Canada Revenue Agency (CRA)',
    legalBasis: 'Not in source',
    format: 'Not in source',
    purpose: 'CRA program account for Global minimum tax',
    fee: 'Not in source',
    timeline: 'Online via BRO',
    source: '[15]',
    domain: 'Canada CRA & Corporate'
  },
  {
    id: 41,
    name: 'Air Travellers Security Charge Account',
    acronym: 'RG',
    issuingEntity: 'Canada Revenue Agency (CRA)',
    legalBasis: 'Not in source',
    format: 'Not in source',
    purpose: 'CRA program account for Air Travellers Security Charge',
    fee: 'Not in source',
    timeline: 'Paper form only',
    source: '[15]',
    domain: 'Canada CRA & Corporate'
  },
  {
    id: 42,
    name: 'Excise Duty Account',
    acronym: 'RD',
    issuingEntity: 'Canada Revenue Agency (CRA)',
    legalBasis: 'Not in source',
    format: 'Not in source',
    purpose: 'CRA program account for Excise duty based on business product',
    fee: 'Not in source',
    timeline: 'Paper forms related to business product',
    source: '[15]',
    domain: 'Canada CRA & Corporate'
  },
  {
    id: 43,
    name: 'Excise Tax and Special Levies Account',
    acronym: 'RE',
    issuingEntity: 'Canada Revenue Agency (CRA)',
    legalBasis: 'Not in source',
    format: 'Not in source',
    purpose: 'CRA program account for excise tax and special levies',
    fee: 'Not in source',
    timeline: 'Paper forms related to business',
    source: '[15]',
    domain: 'Canada CRA & Corporate'
  },
  {
    id: 44,
    name: 'Insurance Premium Tax Account',
    acronym: 'RN',
    issuingEntity: 'Canada Revenue Agency (CRA)',
    legalBasis: 'Not in source',
    format: 'Not in source',
    purpose: 'CRA program account for insurance premium tax',
    fee: 'Not in source',
    timeline: 'Paper form only',
    source: '[15]',
    domain: 'Canada CRA & Corporate'
  },
  {
    id: 45,
    name: 'Import Registration Certificate',
    acronym: 'IRC',
    issuingEntity: 'Office of the Chief Controller of Imports and Exports (CCI&E), Bangladesh',
    legalBasis: 'Imports and Exports (Control) Act / Income Tax Act, 2023',
    format: 'Varies',
    purpose: 'Authorization for commercial or industrial import of goods into Bangladesh',
    fee: 'Not in source',
    timeline: 'Not in source',
    source: '[1]',
    domain: 'Bangladesh Tax & Regulatory'
  },
  {
    id: 46,
    name: 'Export Registration Certificate',
    acronym: 'ERC',
    issuingEntity: 'Office of the Chief Controller of Imports and Exports (CCI&E), Bangladesh',
    legalBasis: 'Imports and Exports (Control) Act / Income Tax Act, 2023',
    format: 'Varies',
    purpose: 'Authorization for commercial export of goods from Bangladesh',
    fee: 'Not in source',
    timeline: 'Not in source',
    source: '[1]',
    domain: 'Bangladesh Tax & Regulatory'
  },
  {
    id: 47,
    name: 'Fire License',
    acronym: 'Fire Safety Certificate',
    issuingEntity: 'Fire Service and Civil Defence Department, Bangladesh',
    legalBasis: 'Fire Prevention and Fire Fighting Act / Income Tax Act, 2023',
    format: 'Varies',
    purpose: 'Safety certification for commercial, industrial, and public establishment premises',
    fee: 'Not in source',
    timeline: 'Not in source',
    source: '[1]',
    domain: 'Bangladesh Tax & Regulatory'
  },
  {
    id: 48,
    name: 'Environmental Clearance Certificate',
    acronym: 'ECC / Environment Clearance',
    issuingEntity: 'Department of Environment (DoE), Bangladesh',
    legalBasis: 'Bangladesh Environment Conservation Act / Income Tax Act, 2023',
    format: 'Varies',
    purpose: 'Environmental impact compliance permit for industrial and commercial projects',
    fee: 'Not in source',
    timeline: 'Not in source',
    source: '[1]',
    domain: 'Bangladesh Tax & Regulatory'
  },
  {
    id: 49,
    name: 'BSTI License',
    acronym: 'Standards Quality Control Certificate',
    issuingEntity: 'Bangladesh Standards and Testing Institution (BSTI)',
    legalBasis: 'Bangladesh Standards and Testing Institution Act / Income Tax Act, 2023',
    format: 'Varies',
    purpose: 'Quality certification for mandatory standardized consumer and industrial products',
    fee: 'Not in source',
    timeline: 'Not in source',
    source: '[1]',
    domain: 'Bangladesh Tax & Regulatory'
  },
  {
    id: 50,
    name: 'Bonded Warehouse License',
    acronym: 'Bond License',
    issuingEntity: 'Customs, Excise and VAT Commissionerate (NBR), Bangladesh',
    legalBasis: 'Customs Act / Income Tax Act, 2023',
    format: 'Varies',
    purpose: 'Duty-free import and storage permit for export-oriented manufacturing industries',
    fee: 'Not in source',
    timeline: 'Not in source',
    source: '[1]',
    domain: 'Bangladesh Tax & Regulatory'
  },
  {
    id: 51,
    name: 'Customs Agent License',
    acronym: 'C&F Agent License',
    issuingEntity: 'Customs Authority (NBR), Bangladesh',
    legalBasis: 'Customs Act / Income Tax Act, 2023',
    format: 'Varies',
    purpose: 'Authorization for freight forwarders and clearing agents to act at ports of entry/exit',
    fee: 'Not in source',
    timeline: 'Not in source',
    source: '[1]',
    domain: 'Bangladesh Tax & Regulatory'
  },
  {
    id: 52,
    name: 'Freight Forwarding License',
    acronym: 'Freight Forwarder License',
    issuingEntity: 'Customs Authority / Ministry of Shipping, Bangladesh',
    legalBasis: 'Customs Act / Income Tax Act, 2023',
    format: 'Varies',
    purpose: 'Licensing for logistics and international cargo transport intermediaries',
    fee: 'Not in source',
    timeline: 'Not in source',
    source: '[1]',
    domain: 'Bangladesh Tax & Regulatory'
  },
  {
    id: 53,
    name: 'Buying House Registration',
    acronym: 'Garments Buying House Certificate',
    issuingEntity: 'Department of Textiles / Export Promotion Bureau, Bangladesh',
    legalBasis: 'Textile Act / Income Tax Act, 2023',
    format: 'Varies',
    purpose: 'Registration to operate an intermediary apparel procurement agency',
    fee: 'Not in source',
    timeline: 'Not in source',
    source: '[1]',
    domain: 'Bangladesh Tax & Regulatory'
  },
  {
    id: 54,
    name: 'Drug License',
    acronym: 'Not in source',
    issuingEntity: 'Directorate General of Drug Administration (DGDA), Bangladesh',
    legalBasis: 'Drugs Act / Income Tax Act, 2023',
    format: 'Varies',
    purpose: 'Permit for manufacturing, storing, or selling pharmaceutical products and medicines',
    fee: 'Not in source',
    timeline: 'Not in source',
    source: '[1]',
    domain: 'Bangladesh Tax & Regulatory'
  },
  {
    id: 55,
    name: 'E-Commerce Business License',
    acronym: 'Digital Business Identification (DBID)',
    issuingEntity: 'Ministry of Commerce / Designated Licensing Authority, Bangladesh',
    legalBasis: 'Digital Commerce Guidelines / Income Tax Act, 2023',
    format: 'Varies',
    purpose: 'Official license to conduct commercial business activities on digital platforms',
    fee: 'Not in source',
    timeline: 'Not in source',
    source: '[1]',
    domain: 'Bangladesh Tax & Regulatory'
  },
  {
    id: 56,
    name: 'Microcredit Agency License',
    acronym: 'Microfinance License',
    issuingEntity: 'Microcredit Regulatory Authority (MRA), Bangladesh',
    legalBasis: 'Microcredit Regulatory Authority Act / Income Tax Act, 2023',
    format: 'Varies',
    purpose: 'Authorization for microfinance institutions to operationally disburse microloans and accept foreign donations',
    fee: 'Not in source',
    timeline: 'Not in source',
    source: '[1]',
    domain: 'Bangladesh Tax & Regulatory'
  },
  {
    id: 57,
    name: 'NGO Bureau Registration',
    acronym: 'NGO Registration',
    issuingEntity: "NGO Affairs Bureau (Prime Minister's Office), Bangladesh",
    legalBasis: 'Foreign Donations (Voluntary Activities) Regulation Act / Income Tax Act, 2023',
    format: 'Varies',
    purpose: 'Mandatory registration for non-governmental organizations to receive and utilize foreign funds',
    fee: 'Not in source',
    timeline: 'Not in source',
    source: '[1]',
    domain: 'Bangladesh Tax & Regulatory'
  },
  {
    id: 58,
    name: 'SME Foundation Registration',
    acronym: 'SME Entrepreneur Registration',
    issuingEntity: 'SME Foundation, Bangladesh',
    legalBasis: 'National Industrial Policy / Income Tax Act, 2023',
    format: 'Varies',
    purpose: 'Registration of small and medium enterprises to obtain tax exemptions on annual turnover limits',
    fee: 'Not in source',
    timeline: 'Not in source',
    source: '[1]',
    domain: 'Bangladesh Tax & Regulatory'
  },
  {
    id: 59,
    name: 'Surveyor License',
    acronym: 'General Insurance Surveyor License',
    issuingEntity: 'Insurance Development and Regulatory Authority (IDRA), Bangladesh',
    legalBasis: 'Insurance Act / Income Tax Act, 2023',
    format: 'Varies',
    purpose: 'Licensing to conduct property, cargo, and loss assessment surveys for insurance claims',
    fee: 'Not in source',
    timeline: 'Not in source',
    source: '[1]',
    domain: 'Bangladesh Tax & Regulatory'
  },
  {
    id: 60,
    name: 'Insurance Agency Certificate',
    acronym: 'Insurance Agent License',
    issuingEntity: 'Insurance Development and Regulatory Authority (IDRA), Bangladesh',
    legalBasis: 'Insurance Act, 2010 / Income Tax Act, 2023',
    format: 'Varies',
    purpose: 'Certification to act as an agent for insurance companies and sell policies',
    fee: 'Not in source',
    timeline: 'Not in source',
    source: '[1]',
    domain: 'Bangladesh Tax & Regulatory'
  },
  {
    id: 61,
    name: 'Motor Vehicle Registration Certificate',
    acronym: 'Vehicle Fitness & Smart Card',
    issuingEntity: 'Bangladesh Road Transport Authority (BRTA)',
    legalBasis: 'Road Transport Act / Income Tax Act, 2023',
    format: 'Varies (includes Registration Number and Engine CC)',
    purpose: 'Ownership, fitness certification, and environmental surcharge collection for motor vehicles',
    fee: 'Varies based on engine capacity (Advance Tax ranges from BDT 25,000 to BDT 5,00,000)',
    timeline: 'Not in source',
    source: '[1]',
    domain: 'Bangladesh Tax & Regulatory'
  },
  {
    id: 62,
    name: 'Stamp & Court Fee Vendor License',
    acronym: 'Deed Writer License',
    issuingEntity: 'District Registrar / Sub-Register Office, Bangladesh',
    legalBasis: 'Stamp Act / Registration Act / Income Tax Act, 2023',
    format: 'Varies',
    purpose: 'License to sell judicial/non-judicial stamps, court fees, cartridge papers, or draft legal instruments',
    fee: 'Not in source',
    timeline: 'Not in source',
    source: '[1]',
    domain: 'Bangladesh Tax & Regulatory'
  },
  {
    id: 63,
    name: 'Nikah Registrar License',
    acronym: 'Kazi License',
    issuingEntity: 'Ministry of Law, Justice and Parliamentary Affairs, Bangladesh',
    legalBasis: 'Muslim Marriages and Divorces (Registration) Act, 1974',
    format: 'Varies',
    purpose: 'Official license to register Muslim marriages and divorces',
    fee: 'Not in source',
    timeline: 'Not in source',
    source: '[1]',
    domain: 'Bangladesh Tax & Regulatory'
  },
  {
    id: 64,
    name: 'Hindu Marriage Registrar License',
    acronym: 'Hindu Marriage Registrar',
    issuingEntity: 'Ministry of Law, Justice and Parliamentary Affairs, Bangladesh',
    legalBasis: 'Hindu Marriage Registration Act, 2012 (Act No. 40 of 1974 / 2012)',
    format: 'Varies',
    purpose: 'Official license to register Hindu marriages',
    fee: 'Not in source',
    timeline: 'Not in source',
    source: '[1]',
    domain: 'Bangladesh Tax & Regulatory'
  },
  {
    id: 65,
    name: 'Special Marriage Registrar License',
    acronym: 'Special Marriage Registrar',
    issuingEntity: 'Ministry of Law, Justice and Parliamentary Affairs, Bangladesh',
    legalBasis: 'Special Marriage Act, 1872 (Act No. III of 1872)',
    format: 'Varies',
    purpose: 'Official license to register marriages under the Special Marriage Act',
    fee: 'Not in source',
    timeline: 'Not in source',
    source: '[1]',
    domain: 'Bangladesh Tax & Regulatory'
  },
  {
    id: 66,
    name: 'Certificate of Doing Business',
    acronym: 'Business Certificate',
    issuingEntity: 'County Clerk (Local County)',
    legalBasis: 'Not in source',
    format: 'Not in source',
    purpose: 'Required for sole proprietors operating under an assumed name when applying for NYC Trade Waste Licenses',
    fee: 'Not in source',
    timeline: 'Not in source',
    source: '[27]',
    domain: 'US Municipal & Corporate'
  },
  {
    id: 67,
    name: 'Authority to Do Business Certificate',
    acronym: 'Certificate of Assumed Name',
    issuingEntity: 'New York Secretary of State',
    legalBasis: 'Not in source',
    format: 'Not in source',
    purpose: 'Required for out-of-state foreign entities applying for a NYC Trade Waste Removal License',
    fee: 'Not in source',
    timeline: 'Not in source',
    source: '[27]',
    domain: 'US Municipal & Corporate'
  },
  {
    id: 68,
    name: 'Social Security Number',
    acronym: 'SSN',
    issuingEntity: 'Not in source',
    legalBasis: 'Not in source',
    format: 'Not in source',
    purpose: 'Required personal identification for business owners of partnerships or sole proprietorships applying for NYC Trade Waste Licenses',
    fee: 'Not in source',
    timeline: 'Not in source',
    source: '[27]',
    domain: 'US Municipal & Corporate'
  },
  {
    id: 69,
    name: 'Certificate of Partnership',
    acronym: 'Not in source',
    issuingEntity: 'County Clerk (Local County)',
    legalBasis: 'Not in source',
    format: 'Not in source',
    purpose: 'Required organizational documentation for partnerships applying for NYC Trade Waste Licenses',
    fee: 'Not in source',
    timeline: 'Not in source',
    source: '[27]',
    domain: 'US Municipal & Corporate'
  },
  {
    id: 70,
    name: 'Certificate of Incorporation',
    acronym: 'Not in source',
    issuingEntity: 'Secretary of State',
    legalBasis: 'Not in source',
    format: 'Not in source',
    purpose: 'Required organizational documentation for corporations applying for NYC Trade Waste Licenses',
    fee: 'Not in source',
    timeline: 'Not in source',
    source: '[27]',
    domain: 'US Municipal & Corporate'
  },
  {
    id: 71,
    name: 'Registered Application Provider Identifier',
    acronym: 'RID',
    issuingEntity: 'Not in source',
    legalBasis: 'Not in source',
    format: 'Not in source',
    purpose: 'Identification required for applicants wishing to issue chip cards under ISO standards',
    fee: 'Not in source',
    timeline: 'Not in source',
    source: '[19]',
    domain: 'Global Payment & ISO (BIN/IIN)'
  }
];

export const identificationRegistrationSystemsArticle: Article = {
  id: 'identification-and-registration-systems-overview-guide',
  title: 'Identification and Registration Systems Overview: Complete Matrix of Tax, VAT (BIN/e-BIN), Corporate, Payment ISO & Regulatory Identifiers',
  metaTitle: 'Identification and Registration Systems Overview | TIN, BIN, WIN, RJSC, CRA BN & ISO 7812 Guide',
  metaDescription: 'Complete 71-item comparative matrix of Identification and Registration Systems across Bangladesh (TIN, BIN/eBIN, WIN/TWIN, RJSC, IRC, ERC, DBID, BRTA), Canada CRA (BN, RT, RP, RC, RM), Global ISO/IEC 7812 Payment Card BIN/IINs, and Municipal Regulatory Licenses.',
  excerpt: 'A comprehensive comparative reference matrix of 71 tax, corporate, commercial, financial payment, and municipal identification systems—detailing official acronyms, issuing authorities, statutory legal bases (Income Tax Act 2023, VAT & SD Act 2012, ISO/IEC 7812, CRA BRO), digit formats, primary scope, application fees, and processing timelines.',
  content: `
## 1. Executive Overview: Navigating Tax, Corporate, Financial & Regulatory Identifiers

Modern corporate compliance requires distinguishing between overlapping acronyms and statutory registration frameworks across national tax authorities, corporate registries, customs agencies, and international payment standards. For example, the acronym **BIN** refers to a **9-, 11-, or 13-digit Business Identification Number (VAT Registration)** issued by the **National Board of Revenue (NBR)** in Bangladesh under the **Value Added Tax and Supplementary Duty Act, 2012**, whereas in banking and payment processing under **ISO/IEC 7812**, **BIN (Bank Identification Number / Issuer Identifier Number — IIN)** denotes the **6- to 8-digit prefix** of a Primary Account Number (PAN). Similarly, cross-border enterprises operating between **Bangladesh** and **Canada** must distinguish between Bangladesh's **12-digit e-TIN**, **13-digit e-BIN**, and **Withholding Identification Number (WIN / TWIN)** under the **Income Tax Act, 2023 (as amended by Finance Act, 2026)** and Canada's **9-digit Business Number (BN)** and **15-character CRA Program Accounts (RT, RP, RC, RM, RZ, RR)**.

*(For deep-dive Bangladesh VAT and BIN workflows, see our dedicated guides: [Business Identification Number (BIN) Registration in Bangladesh](/article/bin-registration-in-bangladesh), [Corporate VAT Compliance & Monthly Return Protocol (Mushak 9.1)](/article/corporate-vat-compliance-monthly-return-protocol-bangladesh), and [Comprehensive Guide to Input Tax Rebate (উপকরণ কর রেয়াত)](/article/input-tax-rebate-bangladesh-vat-guide).)*

---

## 2. Complete Identification and Registration Systems Reference Matrix

The master table below compiles all **71 identification and registration systems**, preserving the exact **Identifier / Registration Name**, **Acronym / Alternate Name**, **Issuing / Governing Entity**, **Standard or Legal Basis**, **Number of Digits or Format**, **Primary Purpose or Scope**, **Application / Registration Fee**, **Processing Timeline**, and **Source Citations**:

| Identifier / Registration Name | Acronym / Alternate Name | Issuing / Governing Entity | Standard or Legal Basis | Number of Digits or Format | Primary Purpose or Scope | Application / Registration Fee | Processing Timeline | Source |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Taxpayer Identification Number** | TIN / eTIN | National Board of Revenue (NBR), Bangladesh / Tax Authority | Income Tax Act, 2023 (Section 261) / Income tax law | 12 digits | Taxpayer identification for income tax return filing, asset reporting, fulfilling tax compliance, tracking filings/payments, accessing financial services (opening bank accounts, buying real estate, business licensing), and mandatory business/financial transactions | Free / Completely free | Instant / Real-time (Online) / Immediately | [1-4] |
| **Business Identification Number** | BIN / eBIN / VAT Registration | National Board of Revenue (NBR), Bangladesh | Value Added Tax and Supplementary Duty Act, 2012 (with amendments up to 2025); VAT & SD Rules, 2016; Finance Act, 2026 | 9, 11, or 13 digits | Official business registration for Value Added Tax (VAT) and commercial operations; required for businesses with annual turnover above BDT 5 million, importers/exporters, branch/liaison offices, and tender suppliers to charge/collect VAT, claim input tax credits, issue tax invoices, open LCs, clear customs, access banking, and obtain trade licenses | Free / Statutory treasury rates (Professional packages range from ৳5,000 to ৳20,000) | Processed immediately to 3–7 working days (up to 15–30 days if site inspection/clarifications needed) | [1, 5-10] |
| **Business Number** | BN | Canada Revenue Agency (CRA) | Proceeds of Crime (Money Laundering) and Terrorist Financing Regulations / Bill C-2 (Strong Borders Act) | 9 digits (or 15-character alphanumeric format with 9-digit BN + 2-letter program code + 4-digit reference number) | Federal tax identification number and standard identifier for legal entities to interact with Canadian federal, provincial, and municipal government programs; serves as the root key for setting up CRA program accounts (GST/HST, payroll, corporate tax, import-export) | Completely free ($0) | Instant / Real-time online assignment via BRO (activation within 48 hours to 10 business days; several days to 6 weeks by mail/fax/phone) | [5, 11-17] |
| **GST/HST Account** | RT / GST/HST Program Account | Canada Revenue Agency (CRA) / Revenu Québec (for Quebec) | Mandatory for annual worldwide taxable sales of $30,000 or more | 9-digit BN + RT + 4-digit reference number (e.g., 123456789 RT 0001) | CRA program account used by businesses for collecting, remitting, and tracking Goods and Services Tax (GST) / Harmonized Sales Tax (HST) and claiming Input Tax Credits (ITCs) | Completely free ($0) | Instant confirmation online during registration (Immediate session via BRO / Form RC1 by mail) | [11, 13-15] |
| **Payroll Deductions Account** | RP / Payroll Account | Canada Revenue Agency (CRA) | Required for businesses employing staff | 9-digit BN + RP + 4-digit reference number (e.g., 123456789 RP 0001) | CRA program account used by employers paying salaries, wages, or bonuses to deduct and remit income taxes, Employment Insurance (EI) premiums, and Canada Pension Plan (CPP) contributions | Completely free ($0) | Instant confirmation online during registration (Immediate session via BRO / Form RC1 by mail) | [11, 13-15] |
| **Corporation Income Tax Account** | RC / Corporate Income Tax Program Account | Canada Revenue Agency (CRA) / Corporations Canada | Required for incorporated businesses | 9-digit BN + RC + 4-digit reference number (e.g., 123456789 RC 0001) | CRA program account allowing incorporated businesses to file corporate T2 tax returns, pay installments, and manage corporate tax matters (automatically assigned upon federal or certain provincial incorporations) | Completely free ($0) | Instant confirmation online during registration (Immediate session via BRO / Form RC1 by mail) | [11, 14, 15, 17] |
| **Import-Export Program Account** | RM Account / Import-Export Account | Canada Revenue Agency (CRA) / Canada Border Services Agency (CBSA) | Not in source | 9-digit BN + RM + 4-digit reference number (e.g., 123456789 RM 0001) | Authorizes businesses to engage in international trade and clear commercial goods through Canadian customs with the CBSA | Not in source | A few business days to several weeks (depending on setup via CARM or BRO) | [13-15] |
| **Information Returns Account** | RZ / Information Returns Program Account | Canada Revenue Agency (CRA) | Not in source | 9-digit BN + RZ + 4-digit reference number (e.g., 123456789 RZ 0001) | CRA program account used by businesses to file information returns and tax slips such as T5, T5013, T5018, or TFSA returns | Completely free ($0) | Instant confirmation online during registration (Immediate session via BRO / Form RC1 by mail) | [11, 14, 15] |
| **Registered Charity Account** | RR / Registered Charity Program Account | Canada Revenue Agency (CRA) | Not in source | 9-digit BN + RR + 4-digit reference number (e.g., 123456789 RR 0001) | CRA program account used by organizations registered as charities or non-profits for charitable tax purposes | Completely free ($0) | Instant confirmation online during registration (Immediate session via BRO / Form RC1 by mail) | [11, 15] |
| **Issuer Identifier Number (International Interchange)** | IIN / Bank Identification Number (BIN) / Institution Identification Number | American National Standards Institute (ANSI) / International Organization for Standardization (ISO) / ABA / CUSIP Global Services / NEN | ISO/IEC 7812 / ISO/IEC 7812-1 / ISO/IEC 7812-2 | 8 digits (formerly 6 digits) | Uniquely identifies card-issuing institutions globally for routing card transactions, clearing, and settlement across international payment networks | Variable ($350 GBP to $2,500 USD; NEN National: €750 + VAT, International: US$950 + VAT) | 5 business days (ANSI) to 3 weeks (NEN) (up to 8 weeks for blockholder approval) | [5, 18-23] |
| **Issuer Identifier Number (Closed Environment)** | Closed Environment IIN / National IIN | American National Standards Institute (ANSI) | ISO/IEC 7812 / U.S. National Numbering System | 9 digits (Format: 9 840 XXXXX) | National use ONLY; used when the issuer acquires its own transactions and its network does not accept, allow, or process card programs other than its own | $2,500 non-refundable application fee | Typically within 5 business days once completed application and fee are received | [18] |
| **IIN Blockholder** | Blockholder | American National Standards Institute (ANSI) / ISO/IEC 7812 Registration Authority | ISO/IEC 7812 / ISO/IEC 7812-1 | Fulfills blocks of 8-digit IINs | Assigned to an entity that owns 2 or more IINs (located within or outside the U.S.) | $3,000 non-refundable application fee (plus additional fees per assigned number) | Up to 8 weeks | [18, 20] |
| **Bank Identification Number** | BIN / Issuing BIN | American Bankers Association (ABA) / ISO / Card Networks (Visa, Mastercard) | ISO/IEC 7812-1 / ISO/IEC 7812-2 | 6 to 8 digits (first 6 to 8 digits of the Primary Account Number [PAN]) | Identifies card issuers for transaction routing, payment processing, fraud checks, card type, product level, country, and currency; mandated transition to 8-digit BINs | Mastercard fees: USD 12,500 (new 6-digit), USD 500 (new 8-digit), USD 25,000 (special 6-digit), USD 10,000 (special 8-digit) | Effective April 2022 mandate (Visa assigning 8-digit BINs since 2019) | [21, 22, 24, 25] |
| **UK National Issuer Identification Number** | UK National IIN | Pay.UK (agent for BSI on behalf of ISO/IEC JTC1/SC17) | ISO/IEC 7812 | 8 digits (first 8 digits of PAN) | Identifies card issuers and routes card transactions for institutions based in the UK ONLY | £350 + VAT (one-off payment) | Not in source | [26] |
| **UK International Issuer Identification Number** | UK International IIN | Pay.UK (agent for BSI on behalf of ISO/IEC JTC1/SC17) | ISO/IEC 7812 | 8 digits (first 8 digits of PAN) | Identifies card issuers and routes card transactions for UK-based institutions issuing cards designed for international acceptance | £660 + VAT (plus £30 + VAT annual maintenance fee starting year 2) | Not in source | [26] |
| **Overseas International Issuer Identification Number** | Overseas International IIN | Pay.UK Limited (sponsoring on behalf of ISO/IEC JTC1/SC17) | ISO/IEC 7812 | 8 digits (first 8 digits of PAN) | Identifies card issuers and routes card transactions for institutions based outside the UK that lack a Sponsoring Authority | £660 (one-off payment, VAT zero-rated outside UK) | Not in source | [26] |
| **Acquirer Reference ID** | ARID | Mastercard | Mastercard acquirer standard (renamed from Acquirer Only BIN) | 6 digits | Identifies acquiring customers/acquirers for transaction processing | USD 2,000 (one-time fee) | Not in source | [21] |
| **Acquiring Identifier** | Acquiring Numerics | Visa | Not in source | 6 digits | Used to support acquiring transactions (reclassified from ISO BINs) | Not in source | Not in source | [25] |
| **Primary Account Number** | PAN | Card Issuers / Card Networks (e.g., Visa) | PCI DSS / ISO/IEC 7812 | 8 to 19 digits (typically 16 or 19 digits) | Unique payment card number identifying the specific account, containing the BIN, individual account identifier, and check digit | Not in source | Not in source | [22, 25] |
| **Account Range** | Account Range Table (ARDEF) | Visa | Not in source | First 9 digits of a Primary Account Number (PAN) | Used to differentiate specific products, processing parameters, and proper clearing of transactions | Not in source | Requires CIQ request to reactivate ranges | [25] |
| **Trade Waste Removal License** | Trade Waste License / BIC License / Trade Waste Permit / Carting License | NYC Business Integrity Commission (BIC) / NYS DCJS | 16 RCNY Section 1-06 & Local Law 199 of 2019 / Administrative Code Title 16-A | Serial License / Vehicle Decal | Regulates trade waste haulers and commercial safety in New York City | License Fee: $5,000 (2-year term); Investigation Fee: $600; Disclosure Fee: $600 per principal/key employee; Vehicle Fee: $500 per vehicle; Fingerprint Fee: $75 per person | 2-year term upon approval (pending background investigation) | [5, 27, 28] |
| **Class 2 Registration Application (Construction and Demolition Debris)** | Class 2 Registration / C & D Registration | NYC Business Integrity Commission (BIC) | Administrative Code of NYC ("Local Law 42 of 1996"), Title 16-A, Ch. 1; Rules of NYC, Title 17, Ch. 1 | Not in source | Exemption from licensing requirements for businesses solely removing construction, demolition, alteration, or excavation waste in NYC | $3,500 registration fee for a 2-year term (plus 2% credit card fee); $500 fee per vehicle | 2-year initial term and 2-year renewals | [28, 29] |
| **Micro-hauler Licenses** | Not in source | NYC Business Integrity Commission (BIC) / NYS DCJS | Not in source | Not in source | Micro-hauler trade waste licensing in NYC | $600 license fee for a 2-year term; $500 vehicle fee; $100 disclosure fee per managerial employee; Fingerprint fee as required | 2-year initial term and 2-year renewals | [28] |
| **Self-Hauler Registrations** | Not in source | NYC Business Integrity Commission (BIC) | Not in source | Not in source | Self-hauler trade waste registration in NYC | $1,000 registration fee for a 2-year term; $400 vehicle fee | 2-year initial term and 2-year renewals | [28] |
| **Broker Registrations** | Not in source | NYC Business Integrity Commission (BIC) | Not in source | Not in source | Trade waste broker registration in NYC | $5,000 registration fee for a 2-year term | 2-year initial term and 2-year renewals | [28] |
| **Labor Union or Labor Organizations Registrations** | Not in source | NYC Business Integrity Commission (BIC) | Not in source | Not in source | Registration of labor unions or labor organizations operating in the trade waste industry in NYC | $4,000 registration application fee for a 5-year term; $600 disclosure fee per officer | 5-year initial term and 5-year renewals | [28] |
| **Withholding Identification Number** | WIN / TWIN | National Board of Revenue (NBR), Bangladesh | Income Tax Act, 2023, Section 263 (as amended by Finance Act, 2026) | Same format as TIN when held, or a distinct WIN / Temporary WIN (TWIN) | Mandatory identifier for entities responsible for deducting or collecting tax at source (withholding tax) | Not in source | Not in source | [2] |
| **Enlistment Certificate** | Turnover Tax Enlistment | National Board of Revenue (NBR), Bangladesh | VAT and Supplementary Duty Act 2012 | Not in source | Registration for businesses with annual turnover between BDT 3 million and BDT 5 million under the 4% turnover tax scheme | Not in source | Not in source | [6] |
| **Trade License** | Commercial License | City Corporation, Municipality (Paurashava), or Union Parishad | Local Government Acts / Income Tax Act, 2023 | Varies by local authority | Authorization to conduct business or trade operations within a local jurisdiction | Varies by business type and location | Not in source | [1] |
| **Company Incorporation Certificate** | Company Registration | Registrar of Joint Stock Companies and Firms (RJSC), Bangladesh | Companies Act, 1994 (Act No. 18 of 1994) | Varies | Legal incorporation of limited liability companies, partnerships, and joint ventures | Not in source | Not in source | [1] |
| **Societies Registration Certificate** | Society / Club Registration | Registrar of Joint Stock Companies and Firms (RJSC), Bangladesh | Societies Registration Act, 1860 (Act No. XXI of 1860) | Varies | Legal incorporation of non-profit societies, trade associations, and social clubs | Not in source | Not in source | [1] |
| **Articles of Incorporation (Alberta)** | Alberta Corporate Incorporation | Alberta Corporate Registry | Not in source | Alberta Incorporation Number | Provincial incorporation of a corporation in Alberta establishing legal corporate entity, share structure, and directors | NUANS report fee $25–$30 (plus statutory filing fee) | Filing completed in 1–2 days; confirmation email in 3–5 days | [11] |
| **Declaration of Trade Name (Alberta)** | Trade Name Registration | Alberta Corporate Registry | Not in source | Not in source | Provincial business name registration for sole proprietorships operating in Alberta | Approximately $75–$100 filing fee | Valid for 5 years | [11] |
| **Declaration of Partnership (Alberta)** | Partnership Registration | Alberta Corporate Registry | Not in source | Not in source | Provincial registration for general partnerships operating in Alberta | Filing fee applies | Valid for 5 years | [11] |
| **National Identity Card** | NID | Government of Bangladesh / Election Commission | National Identity Registration Act | 10, 13, or 17 digits | Personal identity verification for citizens, tax registration, e-Return portal registration, and SIM card biometric verification | Not in source | Not in source | [1, 3] |
| **Social Insurance Number** | SIN | Employment and Social Development Canada | Not in source | 9 digits (temporary SINs start with 9) | Individual identification for working in Canada, accessing government benefits, and validating business owners/directors during CRA business program account registrations | Not in source | Not in source | [13, 15, 17] |
| **Procurement Business Number** | PBN | Public Services and Procurement Canada (via CanadaBuys) | Not in source | Not in source | Required for business suppliers to bid on Canadian federal government tender opportunities and contracts | Not in source | Not in source | [17] |
| **Luxury Tax Account** | LT | Canada Revenue Agency (CRA) | Not in source | Not in source | CRA program account for Luxury Tax | Not in source | Immediate session online via BRO / Submit documents in CRA account / Mail | [15] |
| **Underused Housing Tax Account** | RU | Canada Revenue Agency (CRA) | Not in source | Not in source | CRA program account for Underused Housing Tax | Not in source | Online via BRO | [15] |
| **Global Minimum Tax Account** | PT | Canada Revenue Agency (CRA) | Not in source | Not in source | CRA program account for Global minimum tax | Not in source | Online via BRO | [15] |
| **Air Travellers Security Charge Account** | RG | Canada Revenue Agency (CRA) | Not in source | Not in source | CRA program account for Air Travellers Security Charge | Not in source | Paper form only | [15] |
| **Excise Duty Account** | RD | Canada Revenue Agency (CRA) | Not in source | Not in source | CRA program account for Excise duty based on business product | Not in source | Paper forms related to business product | [15] |
| **Excise Tax and Special Levies Account** | RE | Canada Revenue Agency (CRA) | Not in source | Not in source | CRA program account for excise tax and special levies | Not in source | Paper forms related to business | [15] |
| **Insurance Premium Tax Account** | RN | Canada Revenue Agency (CRA) | Not in source | Not in source | CRA program account for insurance premium tax | Not in source | Paper form only | [15] |
| **Import Registration Certificate** | IRC | Office of the Chief Controller of Imports and Exports (CCI&E), Bangladesh | Imports and Exports (Control) Act / Income Tax Act, 2023 | Varies | Authorization for commercial or industrial import of goods into Bangladesh | Not in source | Not in source | [1] |
| **Export Registration Certificate** | ERC | Office of the Chief Controller of Imports and Exports (CCI&E), Bangladesh | Imports and Exports (Control) Act / Income Tax Act, 2023 | Varies | Authorization for commercial export of goods from Bangladesh | Not in source | Not in source | [1] |
| **Fire License** | Fire Safety Certificate | Fire Service and Civil Defence Department, Bangladesh | Fire Prevention and Fire Fighting Act / Income Tax Act, 2023 | Varies | Safety certification for commercial, industrial, and public establishment premises | Not in source | Not in source | [1] |
| **Environmental Clearance Certificate** | ECC / Environment Clearance | Department of Environment (DoE), Bangladesh | Bangladesh Environment Conservation Act / Income Tax Act, 2023 | Varies | Environmental impact compliance permit for industrial and commercial projects | Not in source | Not in source | [1] |
| **BSTI License** | Standards Quality Control Certificate | Bangladesh Standards and Testing Institution (BSTI) | Bangladesh Standards and Testing Institution Act / Income Tax Act, 2023 | Varies | Quality certification for mandatory standardized consumer and industrial products | Not in source | Not in source | [1] |
| **Bonded Warehouse License** | Bond License | Customs, Excise and VAT Commissionerate (NBR), Bangladesh | Customs Act / Income Tax Act, 2023 | Varies | Duty-free import and storage permit for export-oriented manufacturing industries | Not in source | Not in source | [1] |
| **Customs Agent License** | C&F Agent License | Customs Authority (NBR), Bangladesh | Customs Act / Income Tax Act, 2023 | Varies | Authorization for freight forwarders and clearing agents to act at ports of entry/exit | Not in source | Not in source | [1] |
| **Freight Forwarding License** | Freight Forwarder License | Customs Authority / Ministry of Shipping, Bangladesh | Customs Act / Income Tax Act, 2023 | Varies | Licensing for logistics and international cargo transport intermediaries | Not in source | Not in source | [1] |
| **Buying House Registration** | Garments Buying House Certificate | Department of Textiles / Export Promotion Bureau, Bangladesh | Textile Act / Income Tax Act, 2023 | Varies | Registration to operate an intermediary apparel procurement agency | Not in source | Not in source | [1] |
| **Drug License** | Not in source | Directorate General of Drug Administration (DGDA), Bangladesh | Drugs Act / Income Tax Act, 2023 | Varies | Permit for manufacturing, storing, or selling pharmaceutical products and medicines | Not in source | Not in source | [1] |
| **E-Commerce Business License** | Digital Business Identification (DBID) | Ministry of Commerce / Designated Licensing Authority, Bangladesh | Digital Commerce Guidelines / Income Tax Act, 2023 | Varies | Official license to conduct commercial business activities on digital platforms | Not in source | Not in source | [1] |
| **Microcredit Agency License** | Microfinance License | Microcredit Regulatory Authority (MRA), Bangladesh | Microcredit Regulatory Authority Act / Income Tax Act, 2023 | Varies | Authorization for microfinance institutions to operationally disburse microloans and accept foreign donations | Not in source | Not in source | [1] |
| **NGO Bureau Registration** | NGO Registration | NGO Affairs Bureau (Prime Minister's Office), Bangladesh | Foreign Donations (Voluntary Activities) Regulation Act / Income Tax Act, 2023 | Varies | Mandatory registration for non-governmental organizations to receive and utilize foreign funds | Not in source | Not in source | [1] |
| **SME Foundation Registration** | SME Entrepreneur Registration | SME Foundation, Bangladesh | National Industrial Policy / Income Tax Act, 2023 | Varies | Registration of small and medium enterprises to obtain tax exemptions on annual turnover limits | Not in source | Not in source | [1] |
| **Surveyor License** | General Insurance Surveyor License | Insurance Development and Regulatory Authority (IDRA), Bangladesh | Insurance Act / Income Tax Act, 2023 | Varies | Licensing to conduct property, cargo, and loss assessment surveys for insurance claims | Not in source | Not in source | [1] |
| **Insurance Agency Certificate** | Insurance Agent License | Insurance Development and Regulatory Authority (IDRA), Bangladesh | Insurance Act, 2010 / Income Tax Act, 2023 | Varies | Certification to act as an agent for insurance companies and sell policies | Not in source | Not in source | [1] |
| **Motor Vehicle Registration Certificate** | Vehicle Fitness & Smart Card | Bangladesh Road Transport Authority (BRTA) | Road Transport Act / Income Tax Act, 2023 | Varies (includes Registration Number and Engine CC) | Ownership, fitness certification, and environmental surcharge collection for motor vehicles | Varies based on engine capacity (Advance Tax ranges from BDT 25,000 to BDT 5,00,000) | Not in source | [1] |
| **Stamp & Court Fee Vendor License** | Deed Writer License | District Registrar / Sub-Register Office, Bangladesh | Stamp Act / Registration Act / Income Tax Act, 2023 | Varies | License to sell judicial/non-judicial stamps, court fees, cartridge papers, or draft legal instruments | Not in source | Not in source | [1] |
| **Nikah Registrar License** | Kazi License | Ministry of Law, Justice and Parliamentary Affairs, Bangladesh | Muslim Marriages and Divorces (Registration) Act, 1974 | Varies | Official license to register Muslim marriages and divorces | Not in source | Not in source | [1] |
| **Hindu Marriage Registrar License** | Hindu Marriage Registrar | Ministry of Law, Justice and Parliamentary Affairs, Bangladesh | Hindu Marriage Registration Act, 2012 (Act No. 40 of 2012) | Varies | Official license to register Hindu marriages | Not in source | Not in source | [1] |
| **Special Marriage Registrar License** | Special Marriage Registrar | Ministry of Law, Justice and Parliamentary Affairs, Bangladesh | Special Marriage Act, 1872 (Act No. III of 1872) | Varies | Official license to register marriages under the Special Marriage Act | Not in source | Not in source | [1] |
| **Certificate of Doing Business** | Business Certificate | County Clerk (Local County) | Not in source | Not in source | Required for sole proprietors operating under an assumed name when applying for NYC Trade Waste Licenses | Not in source | Not in source | [27] |
| **Authority to Do Business Certificate** | Certificate of Assumed Name | New York Secretary of State | Not in source | Not in source | Required for out-of-state foreign entities applying for a NYC Trade Waste Removal License | Not in source | Not in source | [27] |
| **Social Security Number** | SSN | Not in source | Not in source | Not in source | Required personal identification for business owners of partnerships or sole proprietorships applying for NYC Trade Waste Licenses | Not in source | Not in source | [27] |
| **Certificate of Partnership** | Not in source | County Clerk (Local County) | Not in source | Not in source | Required organizational documentation for partnerships applying for NYC Trade Waste Licenses | Not in source | Not in source | [27] |
| **Certificate of Incorporation** | Not in source | Secretary of State | Not in source | Not in source | Required organizational documentation for corporations applying for NYC Trade Waste Licenses | Not in source | Not in source | [27] |
| **Registered Application Provider Identifier** | RID | Not in source | Not in source | Not in source | Identification required for applicants wishing to issue chip cards under ISO standards | Not in source | Not in source | [19] |

---

## 3. Domain-Specific Analysis & Key Statutory Distinctions

### A. Bangladesh Tax, VAT & Commercial Licensing Ecosystem (29 Identifiers)

Under the **Income Tax Act, 2023** (including amendments through **Finance Act, 2026**) and the **Value Added Tax and Supplementary Duty Act, 2012**, corporate and individual compliance in Bangladesh revolves around four core fiscal identifiers supplemented by sectoral operating permits:

1. **TIN / e-TIN (12 Digits — Section 261, Income Tax Act, 2023)**: Issued free and instantaneously online by the NBR for income tax return filing, asset disclosure, real estate registration, bank account opening, and Proof of Submission of Return (PSR) verification under Section 264.
2. **BIN / e-BIN (9, 11, or 13 Digits — VAT & SD Act, 2012 & Rules, 2016)**: Mandatory for entities exceeding **BDT 5 Million** in annual turnover, importers/exporters, tender participants, and liaison offices to issue **Mushak 6.3** tax invoices, claim input tax rebates, open Letters of Credit (LCs), and file monthly **Mushak 9.1** returns.
3. **Turnover Tax Enlistment Certificate (VAT & SD Act, 2012)**: Applies to businesses with annual turnover between **BDT 3 Million and BDT 5 Million** under the **4% turnover tax** regime.
4. **Withholding Identification Number (WIN / TWIN — Section 263, Income Tax Act, 2023 as amended by Finance Act, 2026)**: Mandatory identifier for withholding entities responsible for deducting or collecting tax at source (TDS).
5. **Sectoral & Municipal Licenses (25 Permits)**: Includes **Trade License** (City Corporation/Paurashava), **RJSC Company Incorporation** (Companies Act, 1994) and **Societies Registration** (Act of 1860), **IRC & ERC** (CCI&E), **Fire License**, **Environmental Clearance Certificate (ECC)**, **BSTI License**, **Bonded Warehouse License**, **C&F Agent & Freight Forwarding Licenses**, **Buying House Registration**, **DGDA Drug License**, **DBID E-Commerce License**, **MRA Microcredit License**, **NGO Bureau Registration**, **SME Foundation Registration**, **IDRA Surveyor & Insurance Agency Certificates**, **BRTA Motor Vehicle Registration** (Advance Tax BDT 25,000 to BDT 5,00,000), **Stamp Vendor License**, and **Nikah / Hindu / Special Marriage Registrar Licenses**.

### B. Canada Revenue Agency (CRA) Business Number (BN) & Program Accounts (19 Identifiers)

In Canada, the **9-digit Business Number (BN)** serves as the single federal root identifier for legal entities, expanding into a **15-character alphanumeric program account** (**9-digit BN + 2-letter Program Code + 4-digit Reference Number**):

- **RT (GST/HST Account)**: Mandatory once worldwide taxable supplies reach **$30,000**; used to collect GST/HST and claim Input Tax Credits (ITCs).
- **RP (Payroll Deductions Account)**: Mandatory for employers remitting income tax, CPP, and EI deductions.
- **RC (Corporation Income Tax Account)**: Used for filing T2 corporate income tax returns.
- **RM (Import-Export Account)**: Required for commercial customs clearance with the CBSA (via CARM/BRO).
- **RZ (Information Returns) & RR (Registered Charity)**: For T5/T5013/T5018 information slips and registered charities.
- **Specialized CRA Accounts**: Includes **LT** (Luxury Tax), **RU** (Underused Housing Tax), **PT** (Global Minimum Tax), **RG** (Air Travellers Security Charge), **RD** (Excise Duty), **RE** (Excise Tax & Special Levies), and **RN** (Insurance Premium Tax), alongside **PBN** (Procurement Business Number), **SIN** (9-digit Social Insurance Number), and **Alberta Corporate Registry** filings (Articles of Incorporation, Trade Name, and Partnership registrations).

### C. Global Payment Card & ISO/IEC 7812 Identifiers (12 Identifiers)

In financial services and payment card routing, **BIN (Bank Identification Number)** and **IIN (Issuer Identifier Number)** are governed by **ISO/IEC 7812-1 / 7812-2**, ANSI, Pay.UK (BSI), and card networks (Visa, Mastercard):

- **8-Digit IIN / Issuing BIN Standard**: Historically 6 digits, international payment networks mandated the transition to **8-digit BINs** (effective April 2022; Visa assigning 8-digit BINs since 2019) forming the prefix of an **8- to 19-digit Primary Account Number (PAN)**.
- **National & Closed-Environment Variants**: Includes the **9-digit U.S. Closed Environment IIN (Format: 9 840 XXXXX)**, **UK National IIN (£350 + VAT)**, **UK International IIN (£660 + VAT)**, **Overseas International IIN (£660)**, **IIN Blockholder**, Mastercard **Acquirer Reference ID (ARID — 6 digits)**, Visa **Acquiring Numerics (6 digits)**, **Account Range Table (ARDEF — 9 digits)**, and **Registered Application Provider Identifier (RID)** for EMV chip cards.

### D. US Municipal & Commercial Regulatory Registrations (11 Identifiers)

Illustrating municipal commercial integrity licensing, the **New York City Business Integrity Commission (BIC)** under **Title 16-A of the NYC Administrative Code** and **Local Law 199 of 2019** regulates commercial waste and hauling via **Trade Waste Removal Licenses** ($5,000 for 2 years + investigation/vehicle fees), **Class 2 C&D Debris Registrations** ($3,500 for 2 years), **Micro-hauler Licenses** ($600), **Self-Hauler Registrations** ($1,000), **Broker Registrations** ($5,000), and **Labor Union Registrations** ($4,000 for 5 years), supported by foundational entity filings (**Certificate of Incorporation**, **Certificate of Partnership**, **Certificate of Doing Business**, **Authority to Do Business Certificate**, and **SSN**).
`,
  category: 'Compliance',
  categoryId: 'compliance',
  author: {
    id: 'mizanur-rahman',
    name: 'Mizanur Rahman, FCA',
    role: 'Principal Tax & Corporate Advisory',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    bio: 'Fellow Chartered Accountant (FCA) and Corporate Regulatory Advisor specializing in Bangladesh NBR taxation (TIN, BIN, WIN), RJSC corporate structuring, and cross-border regulatory compliance.'
  },
  publishedAt: '2026-10-30T19:00:00.000Z',
  readTime: 16,
  imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=1200',
  tags: [
    'Identification and Registration Systems',
    'TIN vs BIN Bangladesh',
    'Withholding Identification Number WIN',
    'Income Tax Act 2023 Section 261 263',
    'VAT Registration BIN Bangladesh',
    'CRA Business Number BN RT RP RC RM',
    'ISO IEC 7812 Bank Identification Number',
    'RJSC Trade License IRC ERC DBID',
    'Corporate Compliance Matrix'
  ],
  likes: 210,
  comments: 34,
  isExpertOpinion: true
};
