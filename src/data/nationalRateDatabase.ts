export type RateCategory = 'VAT' | 'TDS_VDS' | 'CUSTOMS';

export interface BaseRateItem {
  id: string;
  category: RateCategory;
  code: string; // HS Code, Service Code, or ITA Section
  title: string;
  bengaliTitle?: string;
  description: string;
  sectionOrSchedule: string;
  vdsApplicable: boolean;
  remarks?: string;
  tags: string[];
}

export interface VatRateItem extends BaseRateItem {
  category: 'VAT';
  vatRate: number; // percentage, e.g. 15, 7.5, 5, 0
  vatType: 'Standard (15%)' | 'Reduced Rate' | 'Exempt (0%)' | 'Specific VAT';
  vdsRate?: number; // VDS rate if applicable
  sroNumber?: string;
}

export interface TdsVdsRateItem extends BaseRateItem {
  category: 'TDS_VDS';
  baseRate: number; // base percentage, e.g. 5
  baseRateFormatted: string; // e.g. "5% (or 7.5% for non-company)"
  cashOrPenaltyRate?: number; // rate for non-compliance or cash payment
  deductingAuthority: string;
  paymentNature: string;
  certificateRequired: boolean;
  tinRequirement: 'Mandatory PSR' | 'Standard TIN' | 'N/A';
}

export interface CustomsRateItem extends BaseRateItem {
  category: 'CUSTOMS';
  hsCode: string; // 8-digit HS code e.g. "8471.30.10"
  sectionName: string; // Chapter / Section name
  unit: string; // e.g. "kg", "u", "m3"
  customsDuty: number; // CD %
  regulatoryDuty: number; // RD %
  supplementaryDuty: number; // SD %
  vatRate: number; // VAT %
  advanceTax: number; // AT %
  advanceIncomeTax: number; // AIT %
  totalTaxIncidence: number; // TTI % calculated standardly
}

export type RateItem = VatRateItem | TdsVdsRateItem | CustomsRateItem;

// Central Database of National Rates (VAT, TDS/VDS, Customs Tariff)
export const NATIONAL_RATE_DATABASE: RateItem[] = [
  // --- VAT RATES & SERVICE/PRODUCT CODES ---
  {
    id: 'vat-1023900',
    category: 'VAT',
    code: '1023900',
    title: 'Other Buffalo',
    description: 'Live buffaloes for breeding, agriculture or meat production.',
    sectionOrSchedule: 'First Schedule Part 1 (Exempted Goods)',
    vatRate: 0,
    vatType: 'Exempt (0%)',
    vdsApplicable: false,
    remarks: 'Exempted from local VAT and import VAT.',
    tags: ['buffalo', 'live animal', 'agriculture', 'exempt', '1023900']
  },
  {
    id: 'vat-1029010',
    category: 'VAT',
    code: '1029010',
    title: 'Other Pure-Bred Breeding Animals',
    description: 'Pure-bred breeding bovine animals.',
    sectionOrSchedule: 'First Schedule Part 1',
    vatRate: 0,
    vatType: 'Exempt (0%)',
    vdsApplicable: false,
    remarks: 'Zero VAT on pure-bred livestock.',
    tags: ['breeding', 'bovine', 'livestock', 'pure-bred', '1029010']
  },
  {
    id: 'vat-1051110',
    category: 'VAT',
    code: '1051110',
    title: 'Fowls of Species Gallus Domesticus (Parent Stock One Day Chick)',
    description: 'Day-old chicks parent stock for poultry hatcheries.',
    sectionOrSchedule: 'First Schedule Part 1',
    vatRate: 0,
    vatType: 'Exempt (0%)',
    vdsApplicable: false,
    remarks: 'Exempted to support national poultry sector.',
    tags: ['poultry', 'chick', 'hatchery', 'parent stock', '1051110']
  },
  {
    id: 'vat-11010010',
    category: 'VAT',
    code: '11010010',
    title: 'Wheat or Meslin Flour (Wrapped/Canned up to 2.5 Kg)',
    description: 'Retail packed wheat flour (Atta/Maida) in consumer packaging.',
    sectionOrSchedule: 'First Schedule Part 1',
    vatRate: 0,
    vatType: 'Exempt (0%)',
    vdsApplicable: false,
    remarks: 'Basic staple food exemption.',
    tags: ['wheat', 'flour', 'atta', 'maida', 'food', '11010010']
  },
  {
    id: 'vat-11022000',
    category: 'VAT',
    code: '11022000',
    title: 'Maize (Corn) Flour',
    description: 'Processed corn flour in bulk or retail packaging.',
    sectionOrSchedule: 'Table 1 - Standard VAT Rate',
    vatRate: 15,
    vatType: 'Standard (15%)',
    vdsApplicable: false,
    remarks: 'Standard 15% VAT on commercial maize processing.',
    tags: ['maize', 'corn flour', 'food processing', '11022000']
  },
  {
    id: 'vat-11031100',
    category: 'VAT',
    code: '11031100',
    title: 'Groats and Meal of Wheat',
    description: 'Wheat semolina (Suji) and groats.',
    sectionOrSchedule: 'Table 1 - Standard VAT Rate',
    vatRate: 15,
    vatType: 'Standard (15%)',
    vdsApplicable: false,
    remarks: 'Standard 15% VAT rate applicable.',
    tags: ['groats', 'suji', 'semolina', 'wheat meal', '11031100']
  },
  {
    id: 'vat-11051000',
    category: 'VAT',
    code: '11051000',
    title: 'Potato Flour, Meal and Powder',
    description: 'Dehydrated potato flour and starch products.',
    sectionOrSchedule: 'Table 1 - Standard VAT Rate',
    vatRate: 15,
    vatType: 'Standard (15%)',
    vdsApplicable: false,
    remarks: 'Standard 15% rate.',
    tags: ['potato', 'starch', 'potato flour', '11051000']
  },
  {
    id: 'vat-s001',
    category: 'VAT',
    code: 'S001.00',
    title: 'Hotel and Restaurant Services',
    description: 'A/C Restaurants, non-AC restaurants, and luxury hotel accommodations.',
    sectionOrSchedule: 'Third Schedule & SRO No. 136-AIN/2023',
    vatRate: 7.5,
    vatType: 'Reduced Rate',
    vdsApplicable: true,
    vdsRate: 7.5,
    sroNumber: 'S.R.O. No. 136-AIN/2023',
    remarks: '7.5% for Non-AC/AC restaurant; 15% for 3-star and above hotels. VDS applies on government/corporate bills.',
    tags: ['hotel', 'restaurant', 'food service', 'hospitality', 's001']
  },
  {
    id: 'vat-s002',
    category: 'VAT',
    code: 'S002.00',
    title: 'Construction Services / Contractor',
    description: 'Building construction, civil works, infrastructure development, and contractor services.',
    sectionOrSchedule: 'Third Schedule & VDS SRO 240-AIN/2021',
    vatRate: 7.5,
    vatType: 'Reduced Rate',
    vdsApplicable: true,
    vdsRate: 7.5,
    sroNumber: 'S.R.O. No. 240-AIN/2021',
    remarks: '7.5% VAT rate for construction firm without input rebate. 100% VDS mandatory by deducting entities.',
    tags: ['construction', 'contractor', 'civil works', 'building', 's002']
  },
  {
    id: 'vat-s003',
    category: 'VAT',
    code: 'S003.00',
    title: 'Information Technology Enabled Services (ITES) & Software',
    description: 'Custom software development, web hosting, cloud services, IT consultancy, data processing.',
    sectionOrSchedule: 'Third Schedule (Reduced Rate) & Statutory Exemption',
    vatRate: 5,
    vatType: 'Reduced Rate',
    vdsApplicable: true,
    vdsRate: 5,
    sroNumber: 'S.R.O. No. 173-AIN/2024',
    remarks: '5% reduced VAT rate. Full exemption for Bangladesh-developed export software & specific ITES.',
    tags: ['software', 'ites', 'it services', 'cloud', 'hosting', 'technology', 's003']
  },
  {
    id: 'vat-s008',
    category: 'VAT',
    code: 'S008.10',
    title: 'Security and Guarding Services',
    description: 'Private security agency, bodyguard, physical security, and cash transit services.',
    sectionOrSchedule: 'Third Schedule',
    vatRate: 10,
    vatType: 'Reduced Rate',
    vdsApplicable: true,
    vdsRate: 10,
    sroNumber: 'S.R.O. No. 240-AIN/2021',
    remarks: '10% VAT rate with VDS mandatory at source by withholding entities.',
    tags: ['security', 'guarding', 'manpower', 's008']
  },
  {
    id: 'vat-s037',
    category: 'VAT',
    code: 'S037.00',
    title: 'Procurement Provider / Supply of Goods under VDS',
    description: 'Traders, suppliers, procurement entities supplying goods to government, autonomous bodies or corporate entities.',
    sectionOrSchedule: 'Third Schedule Item 37 & VDS SRO',
    vatRate: 7.5,
    vatType: 'Reduced Rate',
    vdsApplicable: true,
    vdsRate: 7.5,
    sroNumber: 'S.R.O. No. 240-AIN/2021',
    remarks: '7.5% VDS compulsory at source on gross invoice if Mushak 6.3 shows reduced rate or standard rate without VDS certificate.',
    tags: ['procurement', 'supplier', 'supply of goods', 'vds', 's037']
  },

  // --- TDS / VDS (WITHHOLDING TAX & DEDUCTION AT SOURCE) ---
  {
    id: 'tds-sec-89',
    category: 'TDS_VDS',
    code: 'Sec. 89',
    title: 'Supply of Goods / Distributorship',
    description: 'Deduction of tax at source from payments made to suppliers of goods, distributors, and local traders.',
    sectionOrSchedule: 'Income Tax Act, 2023 Section 89 & Rule 3',
    vdsApplicable: true,
    baseRate: 7,
    baseRateFormatted: '2% to 7% (Tiered by Invoice Amount)',
    cashOrPenaltyRate: 10.5,
    deductingAuthority: 'Specified Persons (Companies, Govt, Autonomous Bodies)',
    paymentNature: 'Payment for supply of raw materials, capital equipment, or finished goods',
    certificateRequired: true,
    tinRequirement: 'Mandatory PSR',
    remarks: 'Base tiers: Up to BDT 50L (2%), 50L to 2Cr (3%), 2Cr to 5Cr (4%), 5Cr to 15Cr (5%), Above 15Cr (7%). 50% penalty if no PSR.',
    tags: ['supply of goods', 'supplier', 'sec 89', 'section 89', 'withholding tax', 'tds', 'vds']
  },
  {
    id: 'tds-sec-90',
    category: 'TDS_VDS',
    code: 'Sec. 90',
    title: 'Execution of Contract / Sub-Contract',
    description: 'TDS on payments to contractors, sub-contractors, construction firms, and service providers.',
    sectionOrSchedule: 'Income Tax Act, 2023 Section 90',
    vdsApplicable: true,
    baseRate: 7.5,
    baseRateFormatted: '1% to 7.5% (Tiered by Contract Value)',
    cashOrPenaltyRate: 11.25,
    deductingAuthority: 'Specified Withholding Entities',
    paymentNature: 'Construction, engineering, repair, maintenance, or civil contract works',
    certificateRequired: true,
    tinRequirement: 'Mandatory PSR',
    remarks: 'Oil supply (0.6%), Gas (1%), General construction contracts (up to 7.5%). Cash payments attract 50% higher tax rate.',
    tags: ['contractor', 'execution of contract', 'sec 90', 'section 90', 'civil works', 'tds']
  },
  {
    id: 'tds-sec-91',
    category: 'TDS_VDS',
    code: 'Sec. 91',
    title: 'Professional, Technical & Consultancy Fees',
    description: 'TDS on payments to lawyers, chartered accountants, engineers, doctors, consultants, and IT experts.',
    sectionOrSchedule: 'Income Tax Act, 2023 Section 91',
    vdsApplicable: true,
    baseRate: 10,
    baseRateFormatted: '10% (15% if no TIN / PSR)',
    cashOrPenaltyRate: 15,
    deductingAuthority: 'All Companies, Govt Offices, NGOs, Educational Institutions',
    paymentNature: 'Professional fees, advisory fees, legal fees, audit fees, technical consulting',
    certificateRequired: true,
    tinRequirement: 'Mandatory PSR',
    remarks: 'Base rate 10% on gross fees exceeding BDT 25,000. 15% if recipient fails to furnish PSR/TIN.',
    tags: ['professional fee', 'consultancy', 'sec 91', 'section 91', 'audit fee', 'legal fee', 'doctor']
  },
  {
    id: 'tds-sec-92',
    category: 'TDS_VDS',
    code: 'Sec. 92',
    title: 'Royalty, Technical Know-How & Technical Fees',
    description: 'Withholding tax on royalty payments, brand licensing fees, technical knowledge transfer, and franchise fees.',
    sectionOrSchedule: 'Income Tax Act, 2023 Section 92',
    vdsApplicable: true,
    baseRate: 10,
    baseRateFormatted: '10% (12% if payment exceeds BDT 25 Lakh)',
    cashOrPenaltyRate: 18,
    deductingAuthority: 'Specified Persons making royalty payments',
    paymentNature: 'Royalty, patent fees, brand licensing, franchise fee, technical process know-how',
    certificateRequired: true,
    tinRequirement: 'Mandatory PSR',
    remarks: '10% up to BDT 25L; 12% on amount exceeding BDT 25L.',
    tags: ['royalty', 'technical fee', 'franchise', 'sec 92', 'section 92', 'brand fee']
  },
  {
    id: 'tds-sec-93',
    category: 'TDS_VDS',
    code: 'Sec. 93',
    title: 'Commission, Indenting, Agency & Media Buying',
    description: 'TDS on commission earned by indenting agents, advertising agency, media buying house, and sales commission.',
    sectionOrSchedule: 'Income Tax Act, 2023 Section 93',
    vdsApplicable: true,
    baseRate: 10,
    baseRateFormatted: '10% (5% for media agency)',
    cashOrPenaltyRate: 15,
    deductingAuthority: 'Companies & Principal Entities',
    paymentNature: 'Sales commission, indenting commission, agency fee, media commission',
    certificateRequired: true,
    tinRequirement: 'Mandatory PSR',
    remarks: '10% standard commission TDS. Reduced 5% for accredited media agencies and ad firms.',
    tags: ['commission', 'indenting', 'agency', 'sec 93', 'section 93', 'media buying']
  },
  {
    id: 'tds-sec-95',
    category: 'TDS_VDS',
    code: 'Sec. 95',
    title: 'House Rent & Commercial Property Rent',
    description: 'TDS on house rent, office premises rent, factory rent, and commercial space leasing.',
    sectionOrSchedule: 'Income Tax Act, 2023 Section 95',
    vdsApplicable: true,
    baseRate: 5,
    baseRateFormatted: '5%',
    cashOrPenaltyRate: 7.5,
    deductingAuthority: 'All Corporate Tenants, Govt Offices, NGOs, Banks, Educational Bodies',
    paymentNature: 'Monthly rent for commercial, office, residential, or industrial premises exceeding BDT 25,000/mo',
    certificateRequired: true,
    tinRequirement: 'Mandatory PSR',
    remarks: '5% flat rate on monthly rental payments exceeding BDT 25,000. Landlord TIN compulsory.',
    tags: ['rent', 'house rent', 'office rent', 'sec 95', 'section 95', 'commercial premises']
  },
  {
    id: 'tds-sec-102',
    category: 'TDS_VDS',
    code: 'Sec. 102',
    title: 'Salary Income TDS',
    description: 'Deduction of income tax from employee salaries by employers at average income tax rate.',
    sectionOrSchedule: 'Income Tax Act, 2023 Section 102 & First Schedule',
    vdsApplicable: false,
    baseRate: 0,
    baseRateFormatted: 'Average Tax Rate on Total Annual Taxable Salary',
    cashOrPenaltyRate: 0,
    deductingAuthority: 'All Employers (Corporate, Partnership, Govt, NGO)',
    paymentNature: 'Basic salary, allowances, perquisites, bonuses, leave encashment',
    certificateRequired: true,
    tinRequirement: 'Mandatory PSR',
    remarks: 'Employer calculates total expected annual taxable salary, applies individual slabs (0% up to 400k/375k, 10%-30%), and deducts monthly in 12 equal installments.',
    tags: ['salary', 'salary tds', 'sec 102', 'section 102', 'payroll', 'employee tax']
  },
  {
    id: 'tds-sec-108',
    category: 'TDS_VDS',
    code: 'Sec. 108',
    title: 'Dividend Income Withholding Tax',
    description: 'TDS on dividend payments distributed by resident companies to individual or institutional shareholders.',
    sectionOrSchedule: 'Income Tax Act, 2023 Section 108',
    vdsApplicable: false,
    baseRate: 10,
    baseRateFormatted: '10% (Resident Individual with TIN/PSR), 15% (No TIN), 20% (Company)',
    cashOrPenaltyRate: 15,
    deductingAuthority: 'Dividend Distributing Company',
    paymentNature: 'Cash or stock dividend payouts',
    certificateRequired: true,
    tinRequirement: 'Mandatory PSR',
    remarks: '10% for TIN holders, 15% without TIN, 20% for corporate recipient, 30% for non-resident non-company.',
    tags: ['dividend', 'sec 108', 'section 108', 'shareholder', 'dividend tax']
  },
  {
    id: 'tds-sec-134',
    category: 'TDS_VDS',
    code: 'Sec. 134',
    title: 'Overseas Payments & Foreign Remittances',
    description: 'TDS on outward foreign remittances for management fees, software, advertising, consulting, technical services.',
    sectionOrSchedule: 'Income Tax Act, 2023 Section 134',
    vdsApplicable: true,
    baseRate: 20,
    baseRateFormatted: '10% to 30% (Based on Nature of Service)',
    cashOrPenaltyRate: 30,
    deductingAuthority: 'Remitting Bank & Remitter',
    paymentNature: 'Outward foreign currency remittance via banking channel',
    certificateRequired: true,
    tinRequirement: 'Standard TIN',
    remarks: 'Ad agency / digital marketing (15%), software / tech fees (10%), advisory / management fee (20%), interest / royalty (20%), other income (30%). Subject to DTAA tax treaty relief.',
    tags: ['foreign remittance', 'overseas payment', 'sec 134', 'section 134', 'dtaa', 'outward remittance']
  },

  // --- CUSTOMS TARIFF & HS CODES ---
  {
    id: 'customs-84713010',
    category: 'CUSTOMS',
    code: '8471.30.10',
    hsCode: '8471.30.10',
    title: 'Laptops, Notebooks & Netbook Computers',
    description: 'Portable automatic data processing machines weighing not more than 10 kg, consisting of at least a CPU, keyboard, and display.',
    sectionOrSchedule: 'Chapter 84 - Nuclear Reactors, Boilers, Machinery & ADP Machines',
    sectionName: 'Section XVI - Machinery & Electrical Equipment',
    unit: 'u (Unit)',
    vdsApplicable: false,
    customsDuty: 5.0,
    regulatoryDuty: 0.0,
    supplementaryDuty: 0.0,
    vatRate: 15.0,
    advanceTax: 5.0,
    advanceIncomeTax: 5.0,
    totalTaxIncidence: 31.0,
    remarks: 'Concessional 5% CD to promote digital connectivity. Total tax incidence ~31%.',
    tags: ['laptop', 'computer', 'notebook', '84713010', 'it hardware', 'customs', 'hs code']
  },
  {
    id: 'customs-85171300',
    category: 'CUSTOMS',
    code: '8517.13.00',
    hsCode: '8517.13.00',
    title: 'Smartphones / Mobile Phones (Completely Built Unit - CBU)',
    description: 'Cellular smartphones for wireless telecommunication networks.',
    sectionOrSchedule: 'Chapter 85 - Electrical Machinery, Sound Recorders & Telecom Equipment',
    sectionName: 'Section XVI - Machinery & Electrical Equipment',
    unit: 'u (Unit)',
    vdsApplicable: false,
    customsDuty: 25.0,
    regulatoryDuty: 3.0,
    supplementaryDuty: 20.0,
    vatRate: 15.0,
    advanceTax: 5.0,
    advanceIncomeTax: 5.0,
    totalTaxIncidence: 89.32,
    remarks: 'High protection for local mobile phone assembly plants. TTI ~89.32% for CBU imports.',
    tags: ['smartphone', 'mobile phone', 'cellular', '85171300', 'telecom', 'cbu']
  },
  {
    id: 'customs-87032310',
    category: 'CUSTOMS',
    code: '8703.23.10',
    hsCode: '8703.23.10',
    title: 'Motor Cars (Engine Capacity 1500cc to 1600cc)',
    description: 'Sedan cars and personal motor vehicles with spark-ignition internal combustion engine.',
    sectionOrSchedule: 'Chapter 87 - Vehicles Other Than Railway or Tramway Rolling Stock',
    sectionName: 'Section XVII - Vehicles, Aircraft, Vessels',
    unit: 'u (Unit)',
    vdsApplicable: false,
    customsDuty: 25.0,
    regulatoryDuty: 3.0,
    supplementaryDuty: 45.0,
    vatRate: 15.0,
    advanceTax: 5.0,
    advanceIncomeTax: 5.0,
    totalTaxIncidence: 127.85,
    remarks: 'Tiered Supplementary Duty based on engine cc capacity. SD increases sharply above 2000cc.',
    tags: ['car', 'motor car', 'vehicle', 'sedan', '1500cc', '87032310', 'automobile']
  },
  {
    id: 'customs-30049099',
    category: 'CUSTOMS',
    code: '3004.90.99',
    hsCode: '3004.90.99',
    title: 'Medicaments for Therapeutic or Prophylactic Uses (Finished Pharma)',
    description: 'Finished pharmaceutical drugs, essential medicines, and formulation products.',
    sectionOrSchedule: 'Chapter 30 - Pharmaceutical Products',
    sectionName: 'Section VI - Products of Chemical & Allied Industries',
    unit: 'kg',
    vdsApplicable: false,
    customsDuty: 10.0,
    regulatoryDuty: 0.0,
    supplementaryDuty: 0.0,
    vatRate: 15.0,
    advanceTax: 5.0,
    advanceIncomeTax: 5.0,
    totalTaxIncidence: 38.6,
    remarks: 'Active Pharmaceutical Ingredients (API) enjoy concessional 0% - 5% CD under SRO.',
    tags: ['medicine', 'pharmaceutical', 'drug', 'pharma', '30049099', 'health']
  },
  {
    id: 'customs-10011990',
    category: 'CUSTOMS',
    code: '1001.19.90',
    hsCode: '1001.19.90',
    title: 'Durum Wheat (Other Than Seed)',
    description: 'Bulk grain durum wheat for commercial milling and flour production.',
    sectionOrSchedule: 'Chapter 10 - Cereals',
    sectionName: 'Section II - Vegetable Products',
    unit: 'kg',
    vdsApplicable: false,
    customsDuty: 0.0,
    regulatoryDuty: 0.0,
    supplementaryDuty: 0.0,
    vatRate: 0.0,
    advanceTax: 0.0,
    advanceIncomeTax: 2.0,
    totalTaxIncidence: 2.0,
    remarks: 'Essential food grain zero-duty regime. Only 2% AIT applicable at import stage.',
    tags: ['wheat', 'cereal', 'food grain', 'durum wheat', '10011990', 'agriculture']
  },
  {
    id: 'customs-85285210',
    category: 'CUSTOMS',
    code: '8528.52.10',
    hsCode: '8528.52.10',
    title: 'Computer LED / LCD Monitors (Up to 22 Inches)',
    description: 'Monitors capable of directly connecting to and designed for use with automatic data processing machines.',
    sectionOrSchedule: 'Chapter 85 - Electrical Machinery & Visual Displays',
    sectionName: 'Section XVI - Machinery & Electrical Equipment',
    unit: 'u (Unit)',
    vdsApplicable: false,
    customsDuty: 10.0,
    regulatoryDuty: 0.0,
    supplementaryDuty: 0.0,
    vatRate: 15.0,
    advanceTax: 5.0,
    advanceIncomeTax: 5.0,
    totalTaxIncidence: 38.62,
    remarks: 'Standard IT hardware duty rate. 10% CD + 15% VAT + 5% AT + 5% AIT.',
    tags: ['monitor', 'led display', 'computer screen', '85285210', 'it hardware']
  },
  {
    id: 'customs-84151090',
    category: 'CUSTOMS',
    code: '8415.10.90',
    hsCode: '8415.10.90',
    title: 'Air Conditioning Units (Split / Window Type CBU)',
    description: 'Air conditioning machines comprising a motor-driven fan and elements for changing temperature and humidity.',
    sectionOrSchedule: 'Chapter 84 - Machinery & Mechanical Appliances',
    sectionName: 'Section XVI - Machinery & Electrical Equipment',
    unit: 'u (Unit)',
    vdsApplicable: false,
    customsDuty: 25.0,
    regulatoryDuty: 3.0,
    supplementaryDuty: 20.0,
    vatRate: 15.0,
    advanceTax: 5.0,
    advanceIncomeTax: 5.0,
    totalTaxIncidence: 89.32,
    remarks: 'Local electronics protection SD applied to fully assembled AC imports.',
    tags: ['air conditioner', 'ac', 'split ac', '84151090', 'appliances']
  },
  {
    id: 'customs-27101211',
    category: 'CUSTOMS',
    code: '2710.12.11',
    hsCode: '2710.12.11',
    title: 'Motor Spirit (Octane / Petrol Fuel)',
    description: 'Refined light oils and preparations of petroleum.',
    sectionOrSchedule: 'Chapter 27 - Mineral Fuels, Oils & Distillation Products',
    sectionName: 'Section V - Mineral Products',
    unit: 'litre',
    vdsApplicable: false,
    customsDuty: 10.0,
    regulatoryDuty: 0.0,
    supplementaryDuty: 10.0,
    vatRate: 15.0,
    advanceTax: 2.0,
    advanceIncomeTax: 2.0,
    totalTaxIncidence: 44.25,
    remarks: 'Energy sector tariff structure governed by BPC SRO notifications.',
    tags: ['octane', 'petrol', 'fuel', 'petroleum', '27101211', 'energy']
  }
];

// --- DUTY CALCULATOR FORMULA HELPERS ---
export interface DutyCalculationInputs {
  assessableValueBDT: number;
  customsDutyPercent: number;
  regulatoryDutyPercent: number;
  supplementaryDutyPercent: number;
  vatPercent: number;
  advanceTaxPercent: number;
  advanceIncomeTaxPercent: number;
}

export interface DutyCalculationBreakdown {
  assessableValueBDT: number;
  customsDutyBDT: number;
  regulatoryDutyBDT: number;
  valueForSDBDT: number;
  supplementaryDutyBDT: number;
  valueForVATBDT: number;
  vatBDT: number;
  advanceTaxBDT: number;
  advanceIncomeTaxBDT: number;
  totalDutyPayableBDT: number;
  totalCostWithTaxBDT: number;
  effectiveTotalTaxIncidencePercent: number; // Effective TTI %
}

/**
 * Calculates Bangladesh Import Customs Duties based on NBR statutory cascading formula:
 * 1. CD = AV * CD%
 * 2. RD = AV * RD%
 * 3. Base for SD = AV + CD + RD
 * 4. SD = BaseSD * SD%
 * 5. Base for VAT = AV + CD + RD + SD
 * 6. VAT = BaseVAT * VAT%
 * 7. AT = BaseVAT * AT% (or AV * AT% per specific SRO)
 * 8. AIT = AV * AIT%
 * 9. Total Duties = CD + RD + SD + VAT + AT + AIT
 */
export function calculateCustomsDuties(inputs: DutyCalculationInputs): DutyCalculationBreakdown {
  const av = Math.max(0, inputs.assessableValueBDT);
  
  const cd = av * (inputs.customsDutyPercent / 100);
  const rd = av * (inputs.regulatoryDutyPercent / 100);
  
  const baseSD = av + cd + rd;
  const sd = baseSD * (inputs.supplementaryDutyPercent / 100);
  
  const baseVAT = baseSD + sd;
  const vat = baseVAT * (inputs.vatPercent / 100);
  
  const at = baseVAT * (inputs.advanceTaxPercent / 100);
  const ait = av * (inputs.advanceIncomeTaxPercent / 100);
  
  const totalDuty = cd + rd + sd + vat + at + ait;
  const totalCost = av + totalDuty;
  const effectiveTTI = av > 0 ? (totalDuty / av) * 100 : 0;

  return {
    assessableValueBDT: av,
    customsDutyBDT: cd,
    regulatoryDutyBDT: rd,
    valueForSDBDT: baseSD,
    supplementaryDutyBDT: sd,
    valueForVATBDT: baseVAT,
    vatBDT: vat,
    advanceTaxBDT: at,
    advanceIncomeTaxBDT: ait,
    totalDutyPayableBDT: totalDuty,
    totalCostWithTaxBDT: totalCost,
    effectiveTotalTaxIncidencePercent: Math.round(effectiveTTI * 100) / 100
  };
}

/**
 * Filter and query helper for National Rate Database
 */
export function searchRateDatabase(
  query: string,
  category: RateCategory | 'ALL' = 'ALL',
  vdsOnly: boolean = false,
  hsSectionFilter: string = 'ALL'
): RateItem[] {
  const cleanQuery = query.trim().toLowerCase();

  return NATIONAL_RATE_DATABASE.filter(item => {
    // Category match
    if (category !== 'ALL' && item.category !== category) {
      return false;
    }

    // VDS filter
    if (vdsOnly && !item.vdsApplicable) {
      return false;
    }

    // HS Section filter for Customs
    if (hsSectionFilter !== 'ALL' && item.category === 'CUSTOMS') {
      const customs = item as CustomsRateItem;
      if (!customs.sectionName.toLowerCase().includes(hsSectionFilter.toLowerCase())) {
        return false;
      }
    }

    // Query string match against multiple fields
    if (!cleanQuery) return true;

    const matchesCode = item.code.toLowerCase().includes(cleanQuery);
    const matchesTitle = item.title.toLowerCase().includes(cleanQuery);
    const matchesDescription = item.description.toLowerCase().includes(cleanQuery);
    const matchesSection = item.sectionOrSchedule.toLowerCase().includes(cleanQuery);
    const matchesTags = item.tags.some(tag => tag.toLowerCase().includes(cleanQuery));
    
    let matchesHs = false;
    if (item.category === 'CUSTOMS') {
      matchesHs = (item as CustomsRateItem).hsCode.toLowerCase().includes(cleanQuery) ||
                  (item as CustomsRateItem).sectionName.toLowerCase().includes(cleanQuery);
    }

    let matchesSro = false;
    if (item.category === 'VAT' && (item as VatRateItem).sroNumber) {
      matchesSro = (item as VatRateItem).sroNumber!.toLowerCase().includes(cleanQuery);
    }

    return matchesCode || matchesTitle || matchesDescription || matchesSection || matchesTags || matchesHs || matchesSro;
  });
}
