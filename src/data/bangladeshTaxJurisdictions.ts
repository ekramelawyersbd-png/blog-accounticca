export type DivisionId =
  | 'dhaka'
  | 'chattogram'
  | 'rajshahi'
  | 'khulna'
  | 'sylhet'
  | 'rangpur'
  | 'barishal'
  | 'mymensingh';

export interface TaxZoneOffice {
  id: string;
  zoneName: string;
  commissionerTitle: string;
  eReturnZoneCode: string;
  dctCircles: string[];
  coverageAreas: string[];
  address: string;
  phone: string;
  email: string;
  officeHours: string;
  focusSector: string;
}

export interface JurisdictionComplianceRule {
  title: string;
  statutoryRef: string;
  requirement: string;
  applicability: string;
}

export interface DivisionTaxJurisdiction {
  id: DivisionId;
  name: string;
  bnName: string;
  headquarters: string;
  totalTaxZones: number;
  minimumTaxAmount: number;
  minimumTaxLabel: string;
  minimumTaxDetail: string;
  propertyAitNote: string;
  vatCommissionerate: string;
  eReturnStatus: string;
  summary: string;
  svgPath: string;
  labelPos: { x: number; y: number };
  pinPos: { x: number; y: number };
  offices: TaxZoneOffice[];
  complianceRequirements: JurisdictionComplianceRule[];
  psrMandates: string[];
}

export const BANGLADESH_TAX_JURISDICTIONS: DivisionTaxJurisdiction[] = [
  {
    id: 'dhaka',
    name: 'Dhaka Division',
    bnName: 'ঢাকা বিভাগ (ট্যাক্স জোন ১–১৫, LTU, গাজীপুর ও নারায়ণগঞ্জ)',
    headquarters: 'Segunbagicha Revenue Complex, Dhaka',
    totalTaxZones: 19,
    minimumTaxAmount: 5000,
    minimumTaxLabel: 'BDT 5,000 (DNCC & DSCC) · BDT 4,000 (Gazipur/Narayanganj) · BDT 3,000 (District)',
    minimumTaxDetail:
      'Assessees residing in Dhaka North & South City Corporation pay minimum tax of BDT 5,000; Gazipur & Narayanganj City Corporations pay BDT 4,000; district towns pay BDT 3,000.',
    propertyAitNote:
      'Section 125 Property Transfer AIT reaches up to 8% in Gulshan, Banani, Motijheel & Dhanmondi commercial zones (minimum fixed per-katha/sq.m threshold applies).',
    vatCommissionerate: 'Dhaka North, South, East, West & LTU (VAT)',
    eReturnStatus: 'Mandatory e-Return (etaxnbr.gov.bd) for all Individual, Bank, Telecom & Govt Circle assessees',
    summary:
      'Home to NBR headquarters, Dhaka Taxes Zones 1–15, the Large Taxpayers Unit (LTU), Central Survey Zone, and major industrial zones in Gazipur and Narayanganj.',
    svgPath:
      'M 215 222 L 264 265 L 315 272 L 338 302 L 326 358 L 302 412 L 264 422 L 236 428 L 220 382 L 212 338 L 220 280 Z',
    labelPos: { x: 274, y: 332 },
    pinPos: { x: 274, y: 348 },
    offices: [
      {
        id: 'dhaka-zone-1',
        zoneName: 'Taxes Zone-01, Dhaka',
        commissionerTitle: 'Office of the Commissioner of Taxes, Zone-01',
        eReturnZoneCode: 'DHAKA-ZONE-01',
        dctCircles: [
          'Company Circle-001 to 006 (Motijheel & Dilkusha)',
          'Salary Circle-012 (Financial Institutions)',
          'Territorial Circle-015 to 022 (Ramna, Paltan & Shahbagh)',
        ],
        coverageAreas: ['Motijheel', 'Dilkusha', 'Segunbagicha', 'Paltan', 'Ramna'],
        address: '48/1 Segunbagicha (Kar Bhaban), Dhaka-1000',
        phone: '+880 2-8392104',
        email: 'tz1dhaka@nbr.gov.bd',
        officeHours: 'Sun–Thu, 9:00 AM – 4:00 PM',
        focusSector: 'Banks, Insurance, Listed Corporates & Motijheel Commercial Houses',
      },
      {
        id: 'dhaka-ltu',
        zoneName: 'Large Taxpayers Unit (LTU-Tax), Dhaka',
        commissionerTitle: 'Commissioner of Taxes, Large Taxpayers Unit',
        eReturnZoneCode: 'LTU-DHAKA',
        dctCircles: [
          'LTU Circle-01 (Telecom, Mobile Operators & Power)',
          'LTU Circle-02 (Scheduled Banks & NBFIs)',
          'LTU Circle-03 (Multinationals & Tobacco/FMCG)',
        ],
        coverageAreas: ['National Top Corporate Assessees (Headquartered in Dhaka Metro)'],
        address: '214/B Tejgaon I/A (Revenue Complex), Dhaka-1208',
        phone: '+880 2-8870412',
        email: 'commissioner.ltu@nbr.gov.bd',
        officeHours: 'Sun–Thu, 9:00 AM – 4:30 PM',
        focusSector: 'Banks, Telcos, Multinationals & High-Value Corporates',
      },
      {
        id: 'dhaka-zone-4',
        zoneName: 'Taxes Zone-04, Dhaka (Gulshan & Banani)',
        commissionerTitle: 'Office of the Commissioner of Taxes, Zone-04',
        eReturnZoneCode: 'DHAKA-ZONE-04',
        dctCircles: [
          'Company Circle-071 to 082 (Gulshan-1 & 2, Banani)',
          'Circle-085 (Baridhara Diplomatic & Expat Desks)',
          'Circle-090 (Uttara Sector 1–14 Commercial)',
        ],
        coverageAreas: ['Gulshan', 'Banani', 'Baridhara', 'Niketan', 'Uttara'],
        address: '132/4 Segunbagicha (Dhaka Kar Bhaban Annex), Dhaka-1000',
        phone: '+880 2-9348215',
        email: 'tz4dhaka@nbr.gov.bd',
        officeHours: 'Sun–Thu, 9:00 AM – 4:00 PM',
        focusSector: 'IT/ITES Firms, Foreign Liaison Offices, Expatriate & High-Net-Worth Individuals',
      },
      {
        id: 'gazipur-zone',
        zoneName: 'Taxes Zone-Gazipur',
        commissionerTitle: 'Office of the Commissioner of Taxes, Gazipur',
        eReturnZoneCode: 'GAZIPUR-ZONE',
        dctCircles: [
          'Company Circle-01 & 02 (Tongi & Gazipur Industrial)',
          'Circle-05 (Konabari & Kaliakoir RMG Clusters)',
          'Circle-11 (Sreepur & Tangail Industrial Belt)',
        ],
        coverageAreas: ['Gazipur City Corp', 'Tongi', 'Konabari', 'Kaliakoir', 'Tangail'],
        address: 'Bimanchal Tower, Chandana Chowrasta, Gazipur-1702',
        phone: '+880 2-49272110',
        email: 'tzgazipur@nbr.gov.bd',
        officeHours: 'Sun–Thu, 9:00 AM – 4:00 PM',
        focusSector: 'RMG Export Factories, Textile Mills & Pharmaceuticals',
      },
      {
        id: 'narayanganj-zone',
        zoneName: 'Taxes Zone-Narayanganj',
        commissionerTitle: 'Office of the Commissioner of Taxes, Narayanganj',
        eReturnZoneCode: 'NARAYANGANJ-ZONE',
        dctCircles: [
          'Circle-01 to 05 (Narayanganj Sadar & Chashara)',
          'Circle-09 (Fatullah Knitwear & Adamjee EPZ)',
          'Circle-14 (Munshiganj & Rupganj Steel/Cement)',
        ],
        coverageAreas: ['Narayanganj City Corp', 'Fatullah', 'Adamjee EPZ', 'Rupganj', 'Munshiganj'],
        address: '62 Bangabandhu Road, Chashara, Narayanganj-1400',
        phone: '+880 2-7645388',
        email: 'tznarayanganj@nbr.gov.bd',
        officeHours: 'Sun–Thu, 9:00 AM – 4:00 PM',
        focusSector: 'Knitwear Exports, Adamjee EPZ Units & Heavy Manufacturing',
      },
    ],
    complianceRequirements: [
      {
        title: 'City Corporation Minimum Tax (BDT 5,000)',
        statutoryRef: 'Income Tax Act 2023 · Section 163 & Finance Act 2026',
        requirement:
          'All individual taxpayers under Dhaka North (DNCC) & Dhaka South (DSCC) jurisdiction with taxable income above the 0% threshold must pay at least BDT 5,000 annual income tax.',
        applicability: 'DNCC & DSCC Residents & Business Owners',
      },
      {
        title: 'Mandatory ICAB DVC Verification on Company Returns',
        statutoryRef: 'Income Tax Act 2023 · Section 73',
        requirement:
          'Private Limited Companies, NGOs, and firms with turnover exceeding statutory caps filed in Dhaka Company Circles must carry a verified ICAB Document Verification Code (DVC).',
        applicability: 'All Registered Companies & Large Proprietorships',
      },
      {
        title: 'Section 55 Banking Channel Rule & Section 265 PSR Display',
        statutoryRef: 'Income Tax Act 2023 · Sections 55 & 265',
        requirement:
          'Cash expenditures above BDT 50,000 (and salaries > BDT 20,000) risk disallowance if not routed through banking channels. Latest PSR must be displayed visibly at Dhaka commercial premises.',
        applicability: 'Motijheel, Gulshan, Banani & Industrial Premises',
      },
    ],
    psrMandates: [
      'DNCC & DSCC Trade License issuance and annual renewal (Form 11)',
      'Commercial Gas, DESCO/DPDC electricity load sanction & WASA commercial connections',
      'Land/Apartment Deed Registration across Dhaka Sub-Registry Offices (Sec 125)',
      'RJSC Share Transfer (Form 117) & Director TIN/PSR Synchronization',
    ],
  },
  {
    id: 'chattogram',
    name: 'Chattogram Division',
    bnName: 'চট্টগ্রাম বিভাগ (ট্যাক্স জোন ১–৪ ও কুমিল্লা)',
    headquarters: 'CGO Building-1, Agrabad Commercial Area, Chattogram',
    totalTaxZones: 5,
    minimumTaxAmount: 5000,
    minimumTaxLabel: 'BDT 5,000 (Chattogram City Corp) · BDT 4,000 (Cumilla) · BDT 3,000 (District)',
    minimumTaxDetail:
      'Chattogram City Corporation taxpayers face the Tier-1 BDT 5,000 minimum tax slab; Cumilla City Corporation is BDT 4,000; Cox’s Bazar, Feni, Noakhali & Hill Districts are BDT 3,000.',
    propertyAitNote:
      'Agrabad, Nasirabad, Khulshi & GEC commercial corridors apply Tier-1 metro deed AIT (up to 6%–8%), while CHT Hill Districts enjoy statutory special exemptions.',
    vatCommissionerate: 'Chattogram Customs, Excise & VAT Commissionerate & Cumilla VAT',
    eReturnStatus: 'Mandatory online e-Return for Chattogram Metro & Cumilla salaried/corporate desks',
    summary:
      'Covers Bangladesh’s primary seaport gateway, Chattogram Taxes Zones 1–4, Chittagong EPZ (CEPZ), Korean EPZ, Cumilla Tax Zone, and Chattogram Hill Tracts special jurisdictions.',
    svgPath:
      'M 338 302 L 392 286 L 408 345 L 444 345 L 486 365 L 506 455 L 494 558 L 465 650 L 478 686 L 452 684 L 442 636 L 434 588 L 412 520 L 394 472 L 368 444 L 334 434 L 302 412 L 326 358 Z',
    labelPos: { x: 422, y: 462 },
    pinPos: { x: 405, y: 486 },
    offices: [
      {
        id: 'ctg-zone-1',
        zoneName: 'Taxes Zone-01, Chattogram (Agrabad Port & Trade)',
        commissionerTitle: 'Office of the Commissioner of Taxes, Zone-01, Chattogram',
        eReturnZoneCode: 'CTG-ZONE-01',
        dctCircles: [
          'Company Circle-01 to 04 (Agrabad C/A, Shipping & Stevedoring)',
          'Circle-07 (Chittagong Port & C&F Agents)',
          'Circle-12 (CEPZ & Karnaphuli EPZ Industrial Units)',
        ],
        coverageAreas: ['Agrabad', 'Bandar', 'Halishahar', 'CEPZ', 'Patenga'],
        address: 'CGO Building-1, Agrabad C/A, Chattogram-4100',
        phone: '+880 31-723419',
        email: 'tz1ctg@nbr.gov.bd',
        officeHours: 'Sun–Thu, 9:00 AM – 4:00 PM',
        focusSector: 'Maritime Shipping, Import-Export C&F, Steel Re-rolling & EPZ Units',
      },
      {
        id: 'ctg-zone-3',
        zoneName: 'Taxes Zone-03, Chattogram (Khulshi, Nasirabad & Cox’s Bazar)',
        commissionerTitle: 'Office of the Commissioner of Taxes, Zone-03, Chattogram',
        eReturnZoneCode: 'CTG-ZONE-03',
        dctCircles: [
          'Circle-41 to 46 (Nasirabad, Khulshi, GEC & Jubilee Road)',
          'Circle-58 (Cox’s Bazar Sadar, Hospitality & Marine)',
          'Circle-62 (Sitakunda Shipbreaking & Heavy Industry)',
        ],
        coverageAreas: ['Khulshi', 'Nasirabad', 'Sitakunda', 'Cox’s Bazar', 'Teknaf'],
        address: '1268 East Nasirabad (Kar Complex), Chattogram-4000',
        phone: '+880 31-2550192',
        email: 'tz3ctg@nbr.gov.bd',
        officeHours: 'Sun–Thu, 9:00 AM – 4:00 PM',
        focusSector: 'Tourism & Hospitality, Shipbreaking Yards & Khatunganj Commodity Trade',
      },
      {
        id: 'cumilla-zone',
        zoneName: 'Taxes Zone-Cumilla (Noakhali, Feni & Chandpur)',
        commissionerTitle: 'Office of the Commissioner of Taxes, Cumilla',
        eReturnZoneCode: 'CUMILLA-ZONE',
        dctCircles: [
          'Circle-01 to 06 (Cumilla City & EPZ)',
          'Circle-10 (Feni Sadar & Border Trade)',
          'Circle-15 (Noakhali Maijdee & Chandpur)',
        ],
        coverageAreas: ['Cumilla', 'Brahmanbaria', 'Chandpur', 'Feni', 'Noakhali', 'Lakshmipur'],
        address: 'Kandirpar Revenue Bhaban, Cumilla-3500',
        phone: '+880 81-68421',
        email: 'tzcumilla@nbr.gov.bd',
        officeHours: 'Sun–Thu, 9:00 AM – 4:00 PM',
        focusSector: 'Cumilla EPZ, Remittance-Linked Real Estate & Agro-Processing',
      },
    ],
    complianceRequirements: [
      {
        title: 'Import Stage Advance Income Tax (AIT) & Sec 120 Credit Reconciliation',
        statutoryRef: 'Income Tax Act 2023 · Sections 120 & 163(2)',
        requirement:
          'Importers clearing cargo through Chattogram Custom House pay 5% (or SRO-reduced) AIT at Bill of Entry. Under Sec 163, import AIT for commercial importers acts as minimum tax floor.',
        applicability: 'Chattogram Importers, Khatunganj Traders & C&F Agencies',
      },
      {
        title: 'Chittagong Hill Tracts (CHT) Indigenous Taxpayer Exemption Verification',
        statutoryRef: 'Sixth Schedule Part 1 · Income Tax Act 2023',
        requirement:
          'Ethnic minority residents permanently domiciled in Rangamati, Bandarban & Khagrachari earning locally sourced non-corporate income must obtain Circle Exemption Certification when opening bank/LC accounts.',
        applicability: 'Rangamati, Bandarban & Khagrachari Districts',
      },
      {
        title: 'EPZ & Mirsarai Economic Zone Tax Holiday Compliance',
        statutoryRef: 'NBR EPZ SROs & Section 73 Audit Mandate',
        requirement:
          'Units operating in CEPZ, Karnaphuli EPZ, or BEZA National Special Economic Zone must still file annual audited returns with DVC and deduct TDS/VDS on local vendor invoices.',
        applicability: 'CEPZ, KEPZ, Cumilla EPZ & Mirsarai Zone Units',
      },
    ],
    psrMandates: [
      'IRC / ERC renewal via CCI&E Chattogram & Custom House ASYCUDA World BIN linkage',
      'Chattogram City Corporation (CCC) Trade License & Port Gate Pass approvals',
      'Commercial Bank Letter of Credit (LC) margin & foreign outward remittance clearance',
    ],
  },
  {
    id: 'rajshahi',
    name: 'Rajshahi Division',
    bnName: 'রাজশাহী বিভাগ (রাজশাহী ও বগুড়া জোন)',
    headquarters: 'Helipad Road / Uposhohor Revenue Complex, Rajshahi',
    totalTaxZones: 2,
    minimumTaxAmount: 4000,
    minimumTaxLabel: 'BDT 4,000 (Rajshahi City Corp) · BDT 3,000 (Bogura, Pabna, Sirajganj & Districts)',
    minimumTaxDetail:
      'Rajshahi City Corporation residents fall under the BDT 4,000 minimum tax bracket; Bogura, Pabna, Sirajganj, Natore, Naogaon, Chapai & Joypurhat districts pay BDT 3,000.',
    propertyAitNote:
      'Section 125 Property Transfer AIT follows City Corporation rates (2%–4%) in Rajshahi Metro and Pourashava/Rural tiered schedules across Barind districts.',
    vatCommissionerate: 'Customs, Excise & VAT Commissionerate, Rajshahi',
    eReturnStatus: 'Full e-Return support; regional NBR Taxpayer Help Desks operational during Nov–Dec Peak',
    summary:
      'Administered by Taxes Zone-Rajshahi and Taxes Zone-Bogura, overseeing agro-industrial mills, silk/handloom textiles, cold storages, and BSCIC SME estates.',
    svgPath:
      'M 102 170 L 155 178 L 210 175 L 215 222 L 220 280 L 212 338 L 155 315 L 96 305 L 84 266 L 60 232 L 78 198 Z',
    labelPos: { x: 145, y: 248 },
    pinPos: { x: 108, y: 256 },
    offices: [
      {
        id: 'rajshahi-zone',
        zoneName: 'Taxes Zone-Rajshahi',
        commissionerTitle: 'Office of the Commissioner of Taxes, Rajshahi',
        eReturnZoneCode: 'RAJSHAHI-ZONE',
        dctCircles: [
          'Company Circle-01 (Rajshahi City Corp & BSCIC)',
          'Circle-04 (Chapai Nawabganj Mango & Sonamasjid Land Port)',
          'Circle-09 (Natore & Naogaon Rice Mills)',
        ],
        coverageAreas: ['Rajshahi City', 'Chapai Nawabganj', 'Naogaon', 'Natore'],
        address: 'Kar Bhaban, Plot 42, Sector-2, Uposhohor, Rajshahi-6000',
        phone: '+880 721-761402',
        email: 'tzrajshahi@nbr.gov.bd',
        officeHours: 'Sun–Thu, 9:00 AM – 4:00 PM',
        focusSector: 'Agro-Processing, Rice/Auto Mills, Land Port Imports & Education Institutions',
      },
      {
        id: 'bogura-zone',
        zoneName: 'Taxes Zone-Bogura (Pabna & Sirajganj)',
        commissionerTitle: 'Office of the Commissioner of Taxes, Bogura',
        eReturnZoneCode: 'BOGURA-ZONE',
        dctCircles: [
          'Company Circle-01 (Bogura Light Engineering & Cold Storage)',
          'Circle-08 (Pabna Ishwardi EPZ & Pharmaceuticals)',
          'Circle-14 (Sirajganj Powerloom & Handloom Trade)',
        ],
        coverageAreas: ['Bogura', 'Joypurhat', 'Pabna', 'Sirajganj'],
        address: 'Satmatha Sherpur Road, Kar Bhaban, Bogura-5800',
        phone: '+880 51-66219',
        email: 'tzbogura@nbr.gov.bd',
        officeHours: 'Sun–Thu, 9:00 AM – 4:00 PM',
        focusSector: 'Light Engineering, Foundry, Ishwardi EPZ & Agro-Supply Chains',
      },
    ],
    complianceRequirements: [
      {
        title: 'Agricultural Income & Clause 20 Farmer Exemption Verification',
        statutoryRef: 'Income Tax Act 2023 · Sec 40–44 & 6th Schedule Part 1 Clause 20',
        requirement:
          'Assessees earning solely from agriculture qualify for an extra BDT 2,00,000 exemption. Deemed 60% production expense deduction applies when formal books are absent.',
        applicability: 'Naogaon, Natore, Rajshahi & Bogura Commercial Growers',
      },
      {
        title: 'Auto Rice Mill & Cold Storage TDS Withholding (Sec 89)',
        statutoryRef: 'Income Tax Act 2023 · Section 89 & SRO 273/2026',
        requirement:
          'Millers and cold storages must deduct TDS on contract paddy milling, packaging supplies, and warehouse transport exceeding threshold invoices, depositing via A-Challan by the 15th.',
        applicability: 'Bogura, Naogaon & Pabna Industrial Clusters',
      },
    ],
    psrMandates: [
      'Rajshahi City Corporation (RCC) & Bogura Pourashava Trade Licenses',
      'Land Port Import Clearance at Sonamasjid & Hili',
      'Agricultural Credit above BDT 5,00,000 with Scheduled Banks',
    ],
  },
  {
    id: 'khulna',
    name: 'Khulna Division',
    bnName: 'খুলনা বিভাগ (খুলনা ও যশোর জোন)',
    headquarters: 'Boyra Revenue Bhaban, Khulna',
    totalTaxZones: 2,
    minimumTaxAmount: 4000,
    minimumTaxLabel: 'BDT 4,000 (Khulna City Corp) · BDT 3,000 (Jashore, Kushtia, Satkhira & Districts)',
    minimumTaxDetail:
      'Khulna City Corporation residents pay BDT 4,000 minimum tax; Jashore, Benapole, Kushtia, Satkhira, Bagerhat & Jhenaidah assessees pay BDT 3,000.',
    propertyAitNote:
      'KCC Metro residential/commercial plots carry 3%–5% Sec 125 deed AIT; Mongla Port & Benapole land port warehouses require active e-BIN + PSR.',
    vatCommissionerate: 'Customs, Excise & VAT Commissionerate, Khulna & Jashore',
    eReturnStatus: 'Online e-Return active across all 10 districts; Benapole/Mongla C&F helpdesks',
    summary:
      'Administered by Taxes Zone-Khulna and Taxes Zone-Jashore, covering Mongla Seaport, Benapole Land Port, frozen shrimp/seafood exports, jute mills, and Kushtia agro-industry.',
    svgPath:
      'M 96 305 L 155 315 L 212 338 L 220 382 L 236 428 L 208 490 L 198 540 L 156 546 L 108 550 L 100 488 L 112 425 L 96 368 Z',
    labelPos: { x: 158, y: 430 },
    pinPos: { x: 180, y: 472 },
    offices: [
      {
        id: 'khulna-zone',
        zoneName: 'Taxes Zone-Khulna',
        commissionerTitle: 'Office of the Commissioner of Taxes, Khulna',
        eReturnZoneCode: 'KHULNA-ZONE',
        dctCircles: [
          'Company Circle-01 (Khulna Metro & Frozen Seafood Exporters)',
          'Circle-06 (Mongla EPZ & Port Shipping Agents)',
          'Circle-11 (Bagerhat & Satkhira Aquaculture Desks)',
        ],
        coverageAreas: ['Khulna City Corp', 'Bagerhat', 'Satkhira', 'Mongla Port & EPZ'],
        address: 'Kar Bhaban, Majid Sarani / Boyra, Khulna-9000',
        phone: '+880 41-762814',
        email: 'tzkhulna@nbr.gov.bd',
        officeHours: 'Sun–Thu, 9:00 AM – 4:00 PM',
        focusSector: 'Frozen Seafood Exports, Mongla EPZ, Jute & Shipyard Operations',
      },
      {
        id: 'jashore-zone',
        zoneName: 'Taxes Zone-Jashore (Benapole & Kushtia)',
        commissionerTitle: 'Office of the Commissioner of Taxes, Jashore',
        eReturnZoneCode: 'JASHORE-ZONE',
        dctCircles: [
          'Circle-01 to 04 (Jashore Sadar & Software Tech Park)',
          'Circle-07 (Benapole Land Port Importers & C&F)',
          'Circle-12 (Kushtia & Chuadanga Flour/Tobacco Mills)',
        ],
        coverageAreas: ['Jashore', 'Benapole', 'Kushtia', 'Jhenaidah', 'Magura', 'Chuadanga'],
        address: 'Rail Road Kar Complex, Jashore-7400',
        phone: '+880 421-68104',
        email: 'tzjashore@nbr.gov.bd',
        officeHours: 'Sun–Thu, 9:00 AM – 4:00 PM',
        focusSector: 'Benapole Cross-Border Trade, Software Tech Park & Kushtia Agro-Mills',
      },
    ],
    complianceRequirements: [
      {
        title: 'Frozen Seafood & Hatchery Reduced Corporate Rate & Export Subsidy Tax',
        statutoryRef: 'Income Tax Act 2023 · Export Incentives & Cash Subsidy Sec 112',
        requirement:
          'Seafood & frozen food exporters receive 10% withholding TDS on export cash incentives; export proceeds realization certificates (PRC) must reconcile with Mushak 6.2 zero-rated exports.',
        applicability: 'Khulna, Satkhira & Bagerhat Seafood Exporters',
      },
      {
        title: 'Benapole Land Port & Mongla Port C&F Withholding Verification',
        statutoryRef: 'Income Tax Act 2023 · Section 90 & Section 120',
        requirement:
          'C&F commissions and cross-border freight bills at Benapole and Mongla are subject to 10% TDS by importers and reconcilable via monthly A-Challan statements.',
        applicability: 'Benapole Land Port & Mongla Port Stakeholders',
      },
    ],
    psrMandates: [
      'Khulna City Corporation (KCC) Commercial Trade License & Mongla Port Pass',
      'Jashore Software Technology Park ITES Exemption Certificate Renewals',
      'Cross-Border LC & Importer Registration Certificate (IRC) Renewals',
    ],
  },
  {
    id: 'sylhet',
    name: 'Sylhet Division',
    bnName: 'সিলেট বিভাগ (সিলেট ট্যাক্স জোন)',
    headquarters: 'Mendibagh / Subhanighat Revenue Complex, Sylhet',
    totalTaxZones: 1,
    minimumTaxAmount: 4000,
    minimumTaxLabel: 'BDT 4,000 (Sylhet City Corp) · BDT 3,000 (Moulvibazar, Habiganj & Sunamganj)',
    minimumTaxDetail:
      'Sylhet City Corporation residents fall under the BDT 4,000 minimum tax bracket; Moulvibazar, Habiganj & Sunamganj districts fall under BDT 3,000.',
    propertyAitNote:
      'NRB (Non-Resident Bangladeshi) remittance-backed property investments in Sylhet Metro must document formal banking-channel inward remittance to claim source-of-fund tax protection.',
    vatCommissionerate: 'Customs, Excise & VAT Commissionerate, Sylhet',
    eReturnStatus: 'e-Return portal widely adopted by NRB property holders & salaried professionals',
    summary:
      'Taxes Zone-Sylhet oversees Non-Resident Bangladeshi (NRB) remittance investments, Moulvibazar tea estates, Habiganj industrial corridor, and Tamabil/Sheola border customs.',
    svgPath:
      'M 312 185 L 368 174 L 436 166 L 478 178 L 464 218 L 448 268 L 412 294 L 392 286 L 338 302 L 315 272 L 328 228 Z',
    labelPos: { x: 392, y: 232 },
    pinPos: { x: 402, y: 215 },
    offices: [
      {
        id: 'sylhet-zone-main',
        zoneName: 'Taxes Zone-Sylhet (Metro & NRB Desk)',
        commissionerTitle: 'Office of the Commissioner of Taxes, Sylhet',
        eReturnZoneCode: 'SYLHET-ZONE',
        dctCircles: [
          'Company Circle-01 (Sylhet Metro, Real Estate & Tourism)',
          'Circle-04 (NRB Remittance & Foreign Asset Special Desk)',
          'Circle-09 (Habiganj & Shahjalal Fertilizer/Industrial Belt)',
        ],
        coverageAreas: ['Sylhet City Corp', 'Habiganj', 'Moulvibazar', 'Sunamganj'],
        address: 'House 32, Road-2, Mendibagh, Sylhet-3100',
        phone: '+880 821-716904',
        email: 'tzsylhet@nbr.gov.bd',
        officeHours: 'Sun–Thu, 9:00 AM – 4:00 PM',
        focusSector: 'NRB Remittance Portfolios, Tea Gardens, Hospitality & Gas/Ceramic Industries',
      },
      {
        id: 'sreemangal-circle',
        zoneName: 'Moulvibazar & Sreemangal Tea Estate Circle (Zone-Sylhet)',
        commissionerTitle: 'Deputy Commissioner of Taxes, Circle-12 (Moulvibazar)',
        eReturnZoneCode: 'SYLHET-CIRCLE-12',
        dctCircles: [
          'Circle-12 (Moulvibazar Sadar & Tea Estates)',
          'Circle-14 (Sreemangal & Kulaura Agro-Industrial)',
        ],
        coverageAreas: ['Moulvibazar', 'Sreemangal', 'Kamalganj', 'Kulaura', 'Barlekha'],
        address: 'Saifur Rahman Road, Kar Complex, Moulvibazar-3200',
        phone: '+880 861-52410',
        email: 'circle12sylhet@nbr.gov.bd',
        officeHours: 'Sun–Thu, 9:00 AM – 4:00 PM',
        focusSector: 'Tea & Rubber Plantations (Composite 60% Agri / 40% Business Tax)',
      },
    ],
    complianceRequirements: [
      {
        title: 'NRB Remittance Exemption & Source-of-Fund Documentation',
        statutoryRef: 'Income Tax Act 2023 · Sixth Schedule Part 1 (Remittance Clause)',
        requirement:
          'Wage-earner inward remittances sent by NRBs via official banking channels are 100% tax-exempt, provided bank encashment certificates (C-Form) and passport/visa proof accompany the return.',
        applicability: 'UK/US/Middle East NRBs Holding Assets in Sylhet Division',
      },
      {
        title: 'Tea & Rubber Plantation 60:40 Split Taxation Rule',
        statutoryRef: 'Income Tax Act 2023 · Section 40 & Rule Set',
        requirement:
          'Income from growing and manufacturing tea or rubber in Moulvibazar/Habiganj is treated as 60% Agricultural Income and 40% Business Income for corporate/individual assessment.',
        applicability: 'Tea Estates in Moulvibazar, Sylhet & Habiganj',
      },
    ],
    psrMandates: [
      'Sylhet City Corporation (SCC) Trade License & Hotel/Resort Licensing',
      'Transfer of High-Value Urban Land & Commercial Plazas in Zindabazar/Upashahar',
      'Repatriable NRB Investor Bank Account & Foreign Currency (NFCD) Openings',
    ],
  },
  {
    id: 'rangpur',
    name: 'Rangpur Division',
    bnName: 'রংপুর বিভাগ (রংপুর ও দিনাজপুর জোন)',
    headquarters: 'Kachari Bazar Revenue Complex, Rangpur',
    totalTaxZones: 2,
    minimumTaxAmount: 4000,
    minimumTaxLabel: 'BDT 4,000 (Rangpur City Corp) · BDT 3,000 (Dinajpur, Nilphamari, Kurigram & Districts)',
    minimumTaxDetail:
      'Rangpur City Corporation assessees fall under the BDT 4,000 minimum tax threshold; Dinajpur, Nilphamari (Uttara EPZ), Thakurgaon, Panchagarh, Kurigram, Lalmonirhat & Gaibandha pay BDT 3,000.',
    propertyAitNote:
      'Lower rural/district deed AIT rates apply across Barind and Teesta basin districts; Banglabandha & Hili land ports strictly enforce Sec 120 AIT at customs clearance.',
    vatCommissionerate: 'Customs, Excise & VAT Commissionerate, Rangpur',
    eReturnStatus: 'Full e-Return capability with special Uttara EPZ & agro-enterprise advisory',
    summary:
      'Managed by Taxes Zone-Rangpur & Taxes Zone-Dinajpur, covering Uttara EPZ (Nilphamari), Barapukuria coal/power sector, Banglabandha Land Port, and northern rice/tobacco/cold-storage supply chains.',
    svgPath:
      'M 88 42 L 128 38 L 164 54 L 196 56 L 224 96 L 228 138 L 210 175 L 155 178 L 102 170 L 82 128 L 72 74 Z',
    labelPos: { x: 148, y: 112 },
    pinPos: { x: 162, y: 122 },
    offices: [
      {
        id: 'rangpur-zone',
        zoneName: 'Taxes Zone-Rangpur',
        commissionerTitle: 'Office of the Commissioner of Taxes, Rangpur',
        eReturnZoneCode: 'RANGPUR-ZONE',
        dctCircles: [
          'Company Circle-01 (Rangpur City Corp & Cold Storages)',
          'Circle-06 (Nilphamari & Uttara EPZ Manufacturing)',
          'Circle-11 (Kurigram, Lalmonirhat & Gaibandha)',
        ],
        coverageAreas: ['Rangpur City Corp', 'Nilphamari', 'Uttara EPZ', 'Kurigram', 'Lalmonirhat', 'Gaibandha'],
        address: 'Kar Bhaban, Kachari Bazar, Rangpur-5400',
        phone: '+880 521-63412',
        email: 'tzrangpur@nbr.gov.bd',
        officeHours: 'Sun–Thu, 9:00 AM – 4:00 PM',
        focusSector: 'Uttara EPZ Export Units, Agro Cold Storages & Tobacco Processing',
      },
      {
        id: 'dinajpur-zone',
        zoneName: 'Taxes Zone-Dinajpur (Thakurgaon & Panchagarh)',
        commissionerTitle: 'Office of the Commissioner of Taxes, Dinajpur',
        eReturnZoneCode: 'DINAJPUR-ZONE',
        dctCircles: [
          'Circle-01 to 04 (Dinajpur Sadar, Rice Milling & Hili Port)',
          'Circle-08 (Thakurgaon Sugar & Agro Industries)',
          'Circle-12 (Panchagarh Tea & Banglabandha Land Port)',
        ],
        coverageAreas: ['Dinajpur', 'Hili Land Port', 'Thakurgaon', 'Panchagarh', 'Banglabandha'],
        address: 'Ghasipara Revenue Complex, Dinajpur-5200',
        phone: '+880 531-65209',
        email: 'tzdinajpur@nbr.gov.bd',
        officeHours: 'Sun–Thu, 9:00 AM – 4:00 PM',
        focusSector: 'Hili & Banglabandha Cross-Border Ports, Auto Rice Mills & Small Tea Growers',
      },
    ],
    complianceRequirements: [
      {
        title: 'Uttara EPZ Reduced Corporate Tax & Worker WPPF Audit',
        statutoryRef: 'Income Tax Act 2023 & BEPZA / NBR Industrial SROs',
        requirement:
          'Export-oriented manufacturing units inside Uttara EPZ must file audited accounts with ICAB DVC and claim export-income incentives separately from local subcontracting income.',
        applicability: 'Uttara EPZ (Nilphamari) Manufacturing Units',
      },
      {
        title: 'SME Cold Storage & Maize/Rice Mill Asset Statement (IT-10B)',
        statutoryRef: 'Income Tax Act 2023 · Section 167',
        requirement:
          'Sole proprietors whose gross wealth exceeds BDT 40 Lakh or who own motor vehicles/multiple urban properties must attach IT-10B wealth statements to avoid Section 266 penalties.',
        applicability: 'Rangpur & Dinajpur Traders & Mill Owners',
      },
    ],
    psrMandates: [
      'Rangpur City Corporation (RpCC) & Pourashava Trade Licenses',
      'Banglabandha, Burimari & Hili Land Port Customs Importer Renewals',
      'Commercial Vehicle Fitness & BRTA Registration in Northern Districts',
    ],
  },
  {
    id: 'barishal',
    name: 'Barishal Division',
    bnName: 'বরিশাল বিভাগ (বরিশাল ট্যাক্স জোন)',
    headquarters: 'Alekanda / Band Road Kar Complex, Barishal',
    totalTaxZones: 1,
    minimumTaxAmount: 4000,
    minimumTaxLabel: 'BDT 4,000 (Barishal City Corp) · BDT 3,000 (Patuakhali, Bhola, Pirojpur & Districts)',
    minimumTaxDetail:
      'Barishal City Corporation taxpayers follow the BDT 4,000 minimum tax tier; Payra Port, Patuakhali, Bhola, Barguna, Jhalokathi & Pirojpur districts follow BDT 3,000.',
    propertyAitNote:
      'Riverine/coastal land & Kuakata tourism zone transfers require Mouza-rate verification and e-TIN/PSR attachment under Sec 125.',
    vatCommissionerate: 'Customs, Excise & VAT Commissionerate, Barishal (Khulna South Zone)',
    eReturnStatus: 'Online e-Return mandatory for Government Officials & BCC Metro taxpayers',
    summary:
      'Taxes Zone-Barishal manages southern coastal & riverine jurisdictions including Payra Seaport, Kuakata hospitality corridor, Bhola gas fields, and inland river transport.',
    svgPath:
      'M 236 428 L 264 422 L 302 412 L 312 468 L 308 518 L 276 544 L 232 548 L 198 540 L 208 490 Z',
    labelPos: { x: 262, y: 486 },
    pinPos: { x: 262, y: 468 },
    offices: [
      {
        id: 'barishal-zone',
        zoneName: 'Taxes Zone-Barishal',
        commissionerTitle: 'Office of the Commissioner of Taxes, Barishal',
        eReturnZoneCode: 'BARISHAL-ZONE',
        dctCircles: [
          'Company Circle-01 (Barishal City Corp & River Transport)',
          'Circle-05 (Patuakhali, Payra Port & Kuakata Tourism)',
          'Circle-09 (Bhola Gas/Power Contractors & Barguna)',
        ],
        coverageAreas: ['Barishal City Corp', 'Patuakhali', 'Payra Port', 'Bhola', 'Barguna', 'Pirojpur'],
        address: 'Alekanda Road, Barishal Kar Complex, Barishal-8200',
        phone: '+880 431-64812',
        email: 'tzbarishal@nbr.gov.bd',
        officeHours: 'Sun–Thu, 9:00 AM – 4:00 PM',
        focusSector: 'Payra Seaport Logistics, Inland Shipping, Power Projects & Hospitality',
      },
    ],
    complianceRequirements: [
      {
        title: 'Inland Water Transport & Cargo Vessel Presumptive/Minimum Tax',
        statutoryRef: 'Income Tax Act 2023 · Presumptive Transport Rules & Sec 163',
        requirement:
          'Owners of passenger launches, oil tankers, and coastal cargo vessels registered under Barishal circles must settle advance tax on gross tonnage/passenger capacity prior to BIWTA survey renewal.',
        applicability: 'Barishal, Bhola & Patuakhali Vessel Owners',
      },
      {
        title: 'Payra Port & Power Plant Subcontractor TDS Compliance',
        statutoryRef: 'Income Tax Act 2023 · Sections 88 & 89',
        requirement:
          'EPC and civil contractors operating at Payra Port & Kalapara power hubs must withhold TDS on sub-contracted marine dredging, haulage, and equipment rentals.',
        applicability: 'Payra Port & Southern Infrastructure Contractors',
      },
    ],
    psrMandates: [
      'BIWTA Launch & Coastal Vessel Route Permit & Annual Fitness Renewal',
      'Barishal City Corporation (BCC) Trade License Renewals',
      'Kuakata Commercial Resort & Tourism Licensing',
    ],
  },
  {
    id: 'mymensingh',
    name: 'Mymensingh Division',
    bnName: 'ময়মনসিংহ বিভাগ (ময়মনসিংহ ট্যাক্স জোন)',
    headquarters: 'Choto Bazar / Kachi Jhuli Revenue Bhaban, Mymensingh',
    totalTaxZones: 1,
    minimumTaxAmount: 4000,
    minimumTaxLabel: 'BDT 4,000 (Mymensingh City Corp) · BDT 3,000 (Jamalpur, Sherpur & Netrokona)',
    minimumTaxDetail:
      'Mymensingh City Corporation falls under the BDT 4,000 minimum tax tier; Jamalpur, Sherpur & Netrokona district circles fall under BDT 3,000.',
    propertyAitNote:
      'Valuka/Trishal highway industrial belt plots carry commercial deed AIT rates when transferred for factory or warehouse development.',
    vatCommissionerate: 'Customs, Excise & VAT Commissionerate, Mymensingh (Dhaka North Extension)',
    eReturnStatus: 'Online e-Return active for Mymensingh Metro, University Staff & Valuka Factories',
    summary:
      'Taxes Zone-Mymensingh covers Bangladesh’s 8th administrative division including the Bhaluka-Trishal spinning/agro-industrial corridor, Jamalpur Economic Zone, and fisheries belts.',
    svgPath:
      'M 210 175 L 262 168 L 312 185 L 328 228 L 315 272 L 264 265 L 215 222 Z',
    labelPos: { x: 270, y: 220 },
    pinPos: { x: 268, y: 230 },
    offices: [
      {
        id: 'mymensingh-zone',
        zoneName: 'Taxes Zone-Mymensingh',
        commissionerTitle: 'Office of the Commissioner of Taxes, Mymensingh',
        eReturnZoneCode: 'MYMENSINGH-ZONE',
        dctCircles: [
          'Company Circle-01 (Mymensingh City & Valuka Industrial Corridor)',
          'Circle-06 (Jamalpur & Nakugaon/Dhanua Border Trade)',
          'Circle-10 (Netrokona & Sherpur Agro-Fisheries)',
        ],
        coverageAreas: ['Mymensingh City Corp', 'Bhaluka', 'Trishal', 'Jamalpur', 'Sherpur', 'Netrokona'],
        address: '38 Kachi Jhuli Road, Mymensingh-2200',
        phone: '+880 91-65319',
        email: 'tzmymensingh@nbr.gov.bd',
        officeHours: 'Sun–Thu, 9:00 AM – 4:00 PM',
        focusSector: 'Poultry & Aquaculture Feed Mills, Ceramics, Spinning Mills & Agro Trade',
      },
    ],
    complianceRequirements: [
      {
        title: 'Fisheries, Hatchery & Poultry Sector Reduced Tax & Banking Mandate',
        statutoryRef: 'Income Tax Act 2023 · SRO on Fisheries & Poultry Income',
        requirement:
          'Commercial aquaculture and poultry enterprises in Mymensingh & Trishal qualify for concessional progressive rates (0%–10%–15% bands), subject to filing audited accounts and banking receipts.',
        applicability: 'Trishal, Mymensingh, Netrokona & Sherpur Fisheries',
      },
      {
        title: 'Bhaluka Ceramics & Textile Factory VDS/TDS Compliance',
        statutoryRef: 'Income Tax Act 2023 Sec 89 & VAT Act 2012 Sec 49',
        requirement:
          'Factories along the Dhaka–Mymensingh industrial highway must remit monthly VDS (Mushak 6.6) and TDS on raw material procurement and outsourced logistics.',
        applicability: 'Bhaluka & Trishal Industrial Zones',
      },
    ],
    psrMandates: [
      'Mymensingh City Corporation (MCC) Trade Licenses & Clinic Approvals',
      'Commercial Feed & Agro-Processing Industrial Loan Documentation',
      'Bhaluka Highway Industrial Land Transfer Deed Clearances',
    ],
  },
];
