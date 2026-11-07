import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  FileCheck2, 
  RotateCcw, 
  Copy, 
  Check, 
  Printer, 
  Search, 
  Filter, 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  FolderCheck, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  ExternalLink, 
  Layers, 
  Landmark, 
  BadgePercent,
  Download
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export interface DocChecklistItem {
  id: string;
  category: 'sec66' | 'sec67' | 'statutory';
  priority: 'mandatory' | 'recommended' | 'conditional';
  titleEn: string;
  titleBn: string;
  sectionCode: string;
  summaryEn: string;
  summaryBn: string;
  auditDefenseTipEn: string;
  auditDefenseTipBn: string;
  verificationsEn: string[];
  verificationsBn: string[];
}

export const TAX_DOCUMENTATION_ITEMS: DocChecklistItem[] = [
  // SECTION 66: GENERAL INCOME & EXPENSES
  {
    id: 'royalty-license-agreement',
    category: 'sec66',
    priority: 'mandatory',
    titleEn: 'Royalty & Intellectual Property Licensing Agreements',
    titleBn: 'রয়্যালটি ও বুদ্ধিবৃত্তিক সম্পত্তি লাইসেন্স চুক্তিপত্র',
    sectionCode: 'Section 66(a)',
    summaryEn: 'Signed contracts granting software, copyright, patent, or trademark usage rights with payment schedules.',
    summaryBn: 'সফটওয়্যার, কপিরাইট, পেটেন্ট বা ট্রেডমার্ক ব্যবহারের অধিকার প্রদান সংক্রান্ত স্বাক্ষরিত চুক্তিপত্র ও পেমেন্ট শিডিউল।',
    auditDefenseTipEn: 'Deputy Commissioner of Taxes (DCT) will cross-verify whether the license fee is an active business revenue (Section 45) or passive royalty under Section 66.',
    auditDefenseTipBn: 'কর কর্মকর্তা (ডিসিটি) যাচাই করবেন এটি সক্রিয় ব্যবসায়িক আয় (ধারা ৪৫) নাকি ধারা ৬৬-এর অধীন প্যাসিভ রয়্যালটি।',
    verificationsEn: [
      'Signed agreement specifying exact scope of license and term',
      'Bank credit statements confirming electronic receipt',
      'Invoices issued matching remittance records'
    ],
    verificationsBn: [
      'লাইসেন্সের নির্দিষ্ট আওতা ও মেয়াদ উল্লেখসহ স্বাক্ষরিত চুক্তি',
      'ব্যাংকিং মাধ্যমে অর্থ প্রাপ্তি নিশ্চিতকারী ব্যাংক বিবরণী',
      'রেমিট্যান্স রেকর্ডের সাথে সামঞ্জস্যপূর্ণ ইস্যুকৃত চালান'
    ]
  },
  {
    id: 'technical-service-deliverables',
    category: 'sec66',
    priority: 'recommended',
    titleEn: 'Technical Service Deliverables & Completion Certificates',
    titleBn: 'কারিগরি সেবার ডেলিভারেবল ও সমাপ্তি সনদপত্র',
    sectionCode: 'Section 66(a)',
    summaryEn: 'Formal documentation of advisory, technological, or consultancy service milestones provided to clients.',
    summaryBn: 'গ্রাহককে প্রদত্ত প্রযুক্তিগত, ইঞ্জিনিয়ারিং বা পরামর্শমূলক সেবার মাইলফলক ও সরবরাহ সংক্রান্ত দালিলিক প্রমাণ।',
    auditDefenseTipEn: 'Prevents recharacterization of fees as employment income or undocumented trade receipts.',
    auditDefenseTipBn: 'সেবা ফি-কে বেতন বা অঘোষিত ট্রেড আয় হিসেবে ভুল শ্রেণিবিন্যাস করা প্রতিরোধ করে।',
    verificationsEn: [
      'Project scope of work (SOW) and service level agreement',
      'Client sign-off or deliverable acceptance memo',
      'Corresponding debit notes and receipts'
    ],
    verificationsBn: [
      'কাজের আওতা (SOW) ও সার্ভিস লেভেল অ্যাগ্রিমেন্ট',
      'ক্লায়েন্টের কাজ গ্রহণ বা সমাপ্তির আনুষ্ঠানিক স্বীকৃতিপত্র',
      'সংশ্লিষ্ট ডেবিট নোট ও মানি রিসিপ্ট'
    ]
  },
  {
    id: 'govt-cash-subsidy-sanction',
    category: 'sec66',
    priority: 'mandatory',
    titleEn: 'Government Cash Subsidy Sanction Letters & Notifications',
    titleBn: 'সরকারি নগদ সহায়তা / ভর্তুকির মঞ্জুরিপত্র ও সরকারি গেজেট',
    sectionCode: 'Section 66(b)',
    summaryEn: 'Official government sanction letters, Bangladesh Bank approvals, and commercial bank credit advices for subsidies.',
    summaryBn: 'সরকারি অনুমোদনপত্র, বাংলাদেশ ব্যাংকের ছাড়পত্র এবং নগদ সহায়তা প্রাপ্তির কমার্শিয়াল ব্যাংক ক্রেডিট অ্যাডভাইস।',
    auditDefenseTipEn: 'Required to demonstrate whether the cash assistance is subject to special tax rates, withholding at source, or Sixth Schedule exemptions.',
    auditDefenseTipBn: 'নগদ সহায়তা বিশেষ করহার, উৎসে কর কর্তন নাকি ষষ্ঠ তফসিলের অব্যাহতির আওতাধীন তা প্রমাণের জন্য জরুরি।',
    verificationsEn: [
      'Sanction letter from relevant Ministry or Export Promotion Bureau',
      'Authorized dealer bank credit notification showing net disbursement',
      'Evidence of TDS withheld at source upon release'
    ],
    verificationsBn: [
      'সংশ্লিষ্ট মন্ত্রণালয় বা রপ্তানি উন্নয়ন ব্যুরোর মঞ্জুরিপত্র',
      'নগদ অর্থ প্রদানকারী অথোরাইজড ডিলার ব্যাংকের ক্রেডিট নোটিফিকেশন',
      'অর্থ ছাড়ের সময় উৎসে কর কর্তনের (TDS) প্রমাণপত্র'
    ]
  },
  {
    id: 'asset-transfer-self-created',
    category: 'sec66',
    priority: 'conditional',
    titleEn: 'Self-Created Asset Transfer Documentation (Excluding Capital Assets)',
    titleBn: 'স্ব-সৃষ্ট সম্পত্তি হস্তান্তর চুক্তি (মূলধনী সম্পত্তি বহির্ভূত)',
    sectionCode: 'Section 66(c)',
    summaryEn: 'Contracts for transfer of qualifying intangible or self-created assets that fall outside Section 57 Capital Gains.',
    summaryBn: 'ধারা ৫৭-এর মূলধনী লাভ বহির্ভূত নির্দিষ্ট স্ব-সৃষ্ট বা অধিকার হস্তান্তর চুক্তিপত্র।',
    auditDefenseTipEn: 'Essential to establish that goodwill, hydrocarbons, or mineral rights are properly excluded as required by statute.',
    auditDefenseTipBn: 'আইন অনুযায়ী গুডউইল বা খনিজ অধিকার যথাযথভাবে বাদ দেওয়া হয়েছে কিনা তা নিশ্চিত করতে হবে।',
    verificationsEn: [
      'Transfer instrument specifying rights alienated',
      'Computation of gross proceeds versus self-creation costs',
      'Proof of receipt through account-payee banking transaction'
    ],
    verificationsBn: [
      'হস্তান্তরিত অধিকারের স্পষ্ট বিবরণ সম্বলিত দলিল',
      'মোট প্রাপ্তি বনাম সৃষ্টির খরচ সংক্রান্ত হিসাব বিবরণী',
      'অ্যাকাউন্ট পেয়ী ব্যাংকিং মাধ্যমে অর্থ প্রাপ্তির প্রমাণ'
    ]
  },
  {
    id: 'section68-deductions-vouchers',
    category: 'sec66',
    priority: 'mandatory',
    titleEn: 'Section 68 Revenue Expense Invoices & Payment Vouchers',
    titleBn: 'ধারা ৬৮ অনুযায়ী অনুমোদিত খরচের চালান ও ভাউচার',
    sectionCode: 'Section 68',
    summaryEn: 'Invoices, payroll sheets, and payment receipts wholly and exclusively incurred to earn Section 66 income.',
    summaryBn: 'ধারা ৬৬-এর আয় অর্জনের জন্য একক ও প্রত্যক্ষভাবে ব্যয়িত খরচের চালান, বেতন তালিকা ও পেমেন্ট রসিদ।',
    auditDefenseTipEn: 'Revenue expenditure claims are strictly disallowed if paid in cash above statutory limits or without mandatory withholding tax (TDS).',
    auditDefenseTipBn: 'বিধিবদ্ধ সীমার অতিরিক্ত নগদে বা উৎসে কর (TDS) কর্তন ছাড়া পরিশোধিত খরচ সরাসরি নামঞ্জুর করা হয়।',
    verificationsEn: [
      'Vouchers clearly indicating business connection to the income stream',
      'Proof of banking channel payments for expenses exceeding legal limits',
      'Proof of deduction and deposit of TDS on vendor payments'
    ],
    verificationsBn: [
      'উৎস আয়ের সাথে খরচের সরাসরি সম্পর্ক প্রদর্শনকারী ভাউচার',
      'আইনি সীমার অতিরিক্ত খরচের ক্ষেত্রে ব্যাংকিং মাধ্যমে পরিশোধের রেকর্ড',
      'ভেন্ডর পরিশোধে বিধি মোতাবেক উৎসে কর কর্তন ও চালানে জমার প্রমাণ'
    ]
  },

  // SECTION 67: DEEMED INCOME & DEFENSE FILES
  {
    id: 'legitimate-bank-credits',
    category: 'sec67',
    priority: 'mandatory',
    titleEn: 'Bank Credit Source Corroboration & Loan Agreements',
    titleBn: 'ব্যাংক ক্রেডিট উৎসের প্রমাণপত্র ও ঋণ চুক্তিপত্র',
    sectionCode: 'Section 67(2)',
    summaryEn: 'Full paper trail for all major bank credits to defeat "unexplained credit" deemed income additions under Section 67(2).',
    summaryBn: 'ব্যাংক হিসাবে জমার প্রকৃতি প্রমাণ ও ধারা ৬৭(২)-এর অঘোষিত জমা প্রতিরোধে প্রামাণ্য নথিপত্র।',
    auditDefenseTipEn: 'Every credit in your bank account is legally presumed to be taxable income unless you substantiate its exact non-income or previously-taxed origin.',
    auditDefenseTipBn: 'ব্যাংকে জমা হওয়া যেকোনো অর্থ করযোগ্য আয় হিসেবে গণ্য হতে পারে, যতক্ষণ না এর অ-করযোগ্য বা পূর্ব-করারোপিত উৎস প্রমাণ করা যায়।',
    verificationsEn: [
      'Complete 12-month bank statements with annotated credit lines',
      'Signed loan agreements containing lender TIN, address, and repayment tenor',
      'Proof that loan was disbursed through crossed cheque / bank transfer',
      'Lender bank statement demonstrating financial capacity to advance funds'
    ],
    verificationsBn: [
      'সকল বড় ক্রেডিট চিহ্নিতসহ ১২ মাসের পূর্ণাঙ্গ ব্যাংক স্টেটমেন্ট',
      'ঋণদাতার টিআইএন, ঠিকানা ও পরিশোধের শর্ত সম্বলিত চুক্তিপত্র',
      'ক্রসড চেক বা ব্যাংক ট্রান্সফারের মাধ্যমে ঋণ ছাড়ের প্রমাণ',
      'ঋণদাতার তহবিল সক্ষমতা প্রমাণের জন্য তার সংশ্লিষ্ট ব্যাংক হিসাব'
    ]
  },
  {
    id: 'asset-growth-reconciliation-67-3',
    category: 'sec67',
    priority: 'mandatory',
    titleEn: 'Section 67(3) Asset-Expenditure Reconciliation Worksheet',
    titleBn: 'ধারা ৬৭(৩) অনুযায়ী সম্পদ বৃদ্ধি ও খরচের সমন্বয় হিসাব',
    sectionCode: 'Section 67(3)',
    summaryEn: 'Audit reconciliation matching (A + B + C) Asset Growth & Expenses with (D + E + F) Assessed & Acceptable Funds.',
    summaryBn: '(A+B+C) মোট সম্পদ বৃদ্ধি ও ব্যয়ের সাথে (D+E+F) ঘোষিত আয় ও গ্রহণযোগ্য তহবিলের পূর্ণ গাণিতিক সমন্বয়।',
    auditDefenseTipEn: 'A shortfall automatically creates deemed income. Having this pre-calculated statement prevents unexpected audit notices.',
    auditDefenseTipBn: 'কোনো ব্যবধান থাকলে তা স্বয়ংক্রিয়ভাবে অঘোষিত আয় হিসেবে যুক্ত হয়। এই আগাম হিসাব অডিট নোটিশ থেকে সুরক্ষা দেয়।',
    verificationsEn: [
      'Documented increase in net assets (Item A: property, savings, investments)',
      'Detailed household expenditure sheet (Item B: family living, utilities, travel)',
      'Other fund expenditures (Item C: gifts given, capital losses)',
      'Assessed taxable income (Item D) and tax-exempt receipts (Item E)',
      'Documentation of acceptable non-income funds (Item F: legitimate inheritance, documented gifts)'
    ],
    verificationsBn: [
      'নীট সম্পদ বৃদ্ধির দালিলিক হিসাব (A: জমি, বাড়ি, সঞ্চয়পত্র, বিনিয়োগ)',
      'পারিবারিক ও ব্যক্তিগত জীবনযাত্রা ব্যয়ের বিবরণী (B: সংসার খরচ, ভ্রমণ)',
      'তহবিল থেকে অন্যান্য ব্যয় (C: প্রদত্ত দান, মূলধনী ক্ষতি)',
      'নির্ধারিত মোট আয় (D) এবং কর-অব্যাহতিপ্রাপ্ত আয়ের তালিকা (E)',
      'গ্রহণযোগ্য অন্যান্য তহবিলের প্রমাণ (F: ওয়ারিশ সূত্রে প্রাপ্ত অর্থ, ব্যাংকিং চ্যানেলে প্রাপ্ত উপহার)'
    ]
  },
  {
    id: 'asset-purchase-fmv-deed',
    category: 'sec67',
    priority: 'mandatory',
    titleEn: 'Asset Purchase Deeds, Sub-Registry Records & FMV Valuation Reports',
    titleBn: 'সম্পদ ক্রয় দলিল, সাব-রেজিস্ট্রি রেকর্ড ও বাজারমূল্য মূল্যায়ন প্রতিবেদন',
    sectionCode: 'Section 67(4)',
    summaryEn: 'Deed of sale, registered valuation stamps, and government circle rate certificates protecting against Section 67(4) under-pricing.',
    summaryBn: 'ধারা ৬৭(৪)-এর অবমূল্যায়িত সম্পদ ক্রয় নোটিশ প্রতিহতে রেজিস্ট্রিকৃত দলিল, সরকারি মৌজা রেট ও মূল্যায়ন প্রতিবেদন।',
    auditDefenseTipEn: 'If registered price is below Fair Market Value (FMV), the DCT will add the gap directly to taxable income.',
    auditDefenseTipBn: 'ক্রয়মূল্য সরকারি ন্যায্য বাজারমূল্যের কম হলে পার্থক্যের সমপরিমাণ অর্থ সরাসরি করযোগ্য আয় হিসেবে যোগ করা হবে।',
    verificationsEn: [
      'Certified copy of registered purchase deed and payment challan',
      'Government circle value (Mouza rate) certification from Sub-Registry office',
      'Professional property valuer assessment (if bought at distress/negotiated discount)',
      'Pay order / banker cheque copy proving exact payment consideration'
    ],
    verificationsBn: [
      'রেজিস্ট্রিকৃত সাফ-কবলা দলিলের সার্টিফাইড কপি ও রেজিস্ট্রেশন ফি চালান',
      'সাব-রেজিস্ট্রি অফিসের সরকারি মৌজা রেট / সার্কেল ভ্যালু প্রত্যয়নপত্র',
      'স্বীকৃত সার্ভেয়ার বা ইঞ্জিনিয়ারিং ফার্মের প্রোপার্টি ভ্যালুয়েশন রিপোর্ট',
      'অর্থ পরিশোধের পে-অর্ডার বা ব্যাংক ড্রাফটের কপি'
    ]
  },
  {
    id: 'contract-cancellation-records',
    category: 'sec67',
    priority: 'conditional',
    titleEn: 'Contract Forfeiture Agreements & Legal Default Notices',
    titleBn: 'চুক্তি বাতিলকরণ, বায়না বাজেয়াপ্তি ও আইনি নোটিশের নথিপত্র',
    sectionCode: 'Section 67(5)',
    summaryEn: 'Original sale agreements, forfeiture notice served to default buyer, and bank deposit slips for earnest money retained.',
    summaryBn: 'বায়না চুক্তিপত্র, খেলাপি ক্রেতাকে প্রেরিত রেজিস্ট্রি লিগ্যাল নোটিশ এবং বাজেয়াপ্ত বায়নার অর্থ জমার ব্যাংক স্লিপ।',
    auditDefenseTipEn: 'Protects from claims of unexplained cash inflows by officially documenting contract cancellation income.',
    auditDefenseTipBn: 'চুক্তি বাতিলের আয় হিসেবে যথাযথ শ্রেণিবিন্যাস করে অঘোষিত নগদ অর্থ জমার অভিযোগ থেকে মুক্ত রাখে।',
    verificationsEn: [
      'Notarized deed of agreement for sale containing forfeiture clause',
      'Postal receipts and legal advocate notice issued to defaulting party',
      'Bank credit statement reflecting retained deposit in the appropriate income year'
    ],
    verificationsBn: [
      'বায়না বাজেয়াপ্তির সুস্পষ্ট শর্ত সম্বলিত নোটারাইজড বা রেজিস্ট্রিকৃত বায়নাপত্র',
      'খেলাপি পক্ষকে প্রেরিত আইনজীবীর লিগ্যাল নোটিশ ও ডাক রসিদ',
      'সংশ্লিষ্ট করবর্ষে বাজেয়াপ্ত বায়নার অর্থ ব্যাংক হিসাবে জমা থাকার প্রমাণ'
    ]
  },
  {
    id: 'lease-salami-agreements',
    category: 'sec67',
    priority: 'conditional',
    titleEn: 'Long-Term Lease Agreements & Non-Refundable Salami Records',
    titleBn: 'দীর্ঘমেয়াদী লিজ চুক্তিপত্র ও অফেরতযোগ্য সালামি প্রাপ্তির প্রমাণ',
    sectionCode: 'Section 67(6)',
    summaryEn: 'Registered lease deeds detailing upfront non-refundable premium or salami separate from monthly rent.',
    summaryBn: 'মাসিক ভাড়ার অতিরিক্ত এককালীন অফেরতযোগ্য সালামি বা প্রিমিয়াম উল্লেখ সম্বলিত রেজিস্ট্রিকৃত লিজ দলিল।',
    auditDefenseTipEn: 'Prevents salami from being wrongly assessed as rental income (Section 36) where different statutory deductions apply.',
    auditDefenseTipBn: 'সালামিকে ভুলবশত গৃহ-সম্পত্তির সাধারণ ভাড়া (ধারা ৩৬) হিসেবে গণ্য হওয়া থেকে সুরক্ষা দেয়।',
    verificationsEn: [
      'Registered commercial lease agreement specifying non-refundable premium',
      'Banking transfer advice for lump-sum salami consideration',
      'Separate accounting ledger isolating lease premium from monthly rental receipts'
    ],
    verificationsBn: [
      'অফেরতযোগ্য প্রিমিয়াম উল্লেখপূর্বক রেজিস্ট্রিকৃত বাণিজ্যিক ইজারা দলিল',
      'এককালীন সালামি বাবদ অর্থ ব্যাংকে জমার ক্রেডিট অ্যাডভাইস',
      'মাসিক ভাড়ার সাথে সালামি আলাদাভাবে প্রদর্শনের হিসাব বই'
    ]
  },
  {
    id: 'debt-waiver-settlement-noc',
    category: 'sec67',
    priority: 'conditional',
    titleEn: 'Creditor Debt Waiver Letters & Final Settlement NOCs',
    titleBn: 'পাওনাদারের ঋণ মওকুফপত্র ও চূড়ান্ত নিষ্পত্তির অনাপত্তিপত্র (NOC)',
    sectionCode: 'Section 67(7)',
    summaryEn: 'Formal waiver deeds, bank debt write-off confirmations, or vendor compromise settlement deeds.',
    summaryBn: 'পাওনাদার কর্তৃক আনুষ্ঠানিকভাবে ঋণ মওকুফের দলিল বা চূড়ান্ত নিষ্পত্তিপত্র।',
    auditDefenseTipEn: 'Establishes the precise fiscal year of remission and exact quantum of waived liabilities to prevent arbitrary taxation.',
    auditDefenseTipBn: 'ঋণ মওকুফের সঠিক করবর্ষ ও প্রকৃত অংক নিশ্চিত করে কর কর্তৃপক্ষের স্বেচ্ছাচারী প্রাক্কলন রোধ করে।',
    verificationsEn: [
      'Signed mutual settlement deed on judicial stamp paper',
      'Bank sanction advice for loan compromise or waiver (if bank borrowing)',
      'Audited balance sheet showing removal of trading liability'
    ],
    verificationsBn: [
      'জুডিশিয়াল স্ট্যাম্পে স্বাক্ষরিত ঋণ বা দেনা নিষ্পত্তির চুক্তিপত্র',
      'ব্যাংক ঋণের ক্ষেত্রে ঋণ মওকুফ বা সুদ মওকুফের আনুষ্ঠানিক অনুমোদনপত্র',
      'নিরীক্ষিত ব্যালেন্স শিটে সংশ্লিষ্ট দায়ের সমন্বয় সংক্রান্ত নোট'
    ]
  },
  {
    id: 'banking-channel-proofs-67-11',
    category: 'sec67',
    priority: 'mandatory',
    titleEn: 'Banking Channel Instruments for Loans & Gifts Exceeding BDT 500k',
    titleBn: '৫ লক্ষ টাকার বেশি ঋণ ও দানের ক্ষেত্রে ব্যাংকিং চ্যানেলের প্রমাণপত্র',
    sectionCode: 'Section 67(11)',
    summaryEn: 'Account payee cheques, BEFTN, RTGS, or NPSB advice slips for any gift or borrowing of BDT 500,000 and above.',
    summaryBn: '৫ লক্ষ টাকা বা তদূর্ধ্ব যেকোনো ঋণ বা উপহারের ক্ষেত্রে অ্যাকাউন্ট পেয়ী চেক, BEFTN বা RTGS ব্যাংক বিবরণী।',
    auditDefenseTipEn: 'Under Section 67(11), cash receipt of loans or gifts exceeding BDT 500,000 is directly treated as deemed taxable income, regardless of genuineness.',
    auditDefenseTipBn: 'ধারা ৬৭(১১) অনুযায়ী, ৫ লাখ টাকার বেশি নগদ ঋণ বা উপহার আইনত সরাসরি অঘোষিত করযোগ্য আয় হিসেবে যুক্ত হবে।',
    verificationsEn: [
      'Cheque counterfoils and electronic bank clearing debit/credit slips',
      'Donor or lender bank statement showing originating fund clearance',
      'Zero cash deposits in ledger for transactions crossing statutory limits'
    ],
    verificationsBn: [
      'চেকের মুড়ি ও ব্যাংক ক্লিয়ারিং অ্যাডভাইস স্লিপ',
      'দাতা বা ঋণদাতার ব্যাংক থেকে অর্থ ছাড়ের সমান্তরাল স্টেটমেন্ট',
      'আইনি সীমা অতিক্রমকারী লেনদেনে নগদে টাকা জমার কোনো রেকর্ড না থাকা'
    ]
  },

  // STATUTORY FORMS & E-RETURN FILING
  {
    id: 'form-it-11ga-schedule-7',
    category: 'statutory',
    priority: 'mandatory',
    titleEn: 'Income Tax Return Form IT-11GA (Schedule for Other Sources)',
    titleBn: 'আয়কর রিটার্ন ফরম আইটি-১১গ (অন্যান্য উৎস আয়ের তফসিল)',
    sectionCode: 'Form IT-11GA',
    summaryEn: 'Completed statutory return showing gross Section 66 receipts and permissible Section 68 deduction claims.',
    summaryBn: 'ধারা ৬৬-এর মোট প্রাপ্তি ও ধারা ৬৮-এর অনুমোদিত খরচ প্রদর্শনকারী মূল রিটার্ন ফরম।',
    auditDefenseTipEn: 'Every claim must be categorized into its designated e-Return Head 7 sub-bucket to avoid system scrutiny flags.',
    auditDefenseTipBn: 'ই-রিটার্ন পোর্টালে প্রতিটি আয় সঠিক উপ-খাতে অন্তর্ভুক্ত করতে হবে যেন কোনো অডিট ফ্ল্যাগ তৈরি না হয়।',
    verificationsEn: [
      'Correct reporting of gross receipts in Head 7 entry field',
      'Separate disclosure of Section 68 admissible revenue expenditures',
      'Reconciliation with financial statements / profit & loss statement'
    ],
    verificationsBn: [
      '৭ নম্বর খাতের ফিল্ডে মোট প্রাপ্ত আয়ের নির্ভুল এন্ট্রি',
      'ধারা ৬৮ অনুযায়ী অনুমোদিত খরচের আলাদা প্রদর্শন',
      'ব্যক্তিগত বা ব্যবসায়িক লাভ-ক্ষতি হিসাবের সাথে সামঞ্জস্য'
    ]
  },
  {
    id: 'form-it-10b-statement-of-assets',
    category: 'statutory',
    priority: 'mandatory',
    titleEn: 'Statement of Assets, Liabilities & Life Style (IT-10B / Form 26)',
    titleBn: 'পরিসম্পদ, দায় ও জীবনযাত্রার ব্যয় বিবরণী (আইটি-১০খ / ফরম ২৬)',
    sectionCode: 'Form IT-10B',
    summaryEn: 'Statutory balance sheet of net wealth proving source of accretions and matching personal expenditures.',
    summaryBn: 'সম্পদ বৃদ্ধি ও জীবনযাত্রা ব্যয়ের উৎস ব্যাখ্যা করার প্রধান সংবিধিবদ্ধ সম্পদ বিবরণী।',
    auditDefenseTipEn: 'Discrepancy between closing wealth and declared fund sources triggers automatic Section 67(3) deemed income proceedings.',
    auditDefenseTipBn: 'সমাপনী সম্পদ ও তহবিল উৎসের গরমিল সরাসরি ধারা ৬৭(৩) অনুযায়ী অঘোষিত আয়ের নোটিশ আহ্বান করে।',
    verificationsEn: [
      'Accurate reporting of closing net assets in Section IT-10B',
      'Itemized household expenses matching lifestyle standard',
      'Net wealth accretion formula strictly reconciling to zero discrepancy'
    ],
    verificationsBn: [
      'আইটি-১০খ ফরমে সমাপনী নীট সম্পদের সঠিক মূল্যায়ন এন্ট্রি',
      'জীবনযাত্রার মানের সাথে সঙ্গতিপূর্ণ পারিবারিক খরচের হিসাব',
      'সম্পদ বৃদ্ধির সমীকরণে কোনো অমিল বা পার্থক্য শূন্য রাখা'
    ]
  },
  {
    id: 'tds-challans-form-136',
    category: 'statutory',
    priority: 'mandatory',
    titleEn: 'Tax Deduction Certificates (TDS Challans / Form 136 / e-TDS)',
    titleBn: 'উৎসে কর কর্তন সনদপত্র (TDS চালান / ফরম ১৩৬ / ই-টিডিএস)',
    sectionCode: 'Section 136 / Section 117',
    summaryEn: 'Certificates issued by deductors for 10%-12% royalties TDS, 20% lottery TDS, or subsidy withholding.',
    summaryBn: 'রয়্যালটি, লটারি জয় বা ভর্তুকি থেকে কর্তিত উৎসে করের সরকারি চালান ও সনদপত্র।',
    auditDefenseTipEn: 'Without original deduction certificates or automated e-TDS verification codes, tax credit will be denied by NBR.',
    auditDefenseTipBn: 'মূল কর কর্তন সনদপত্র বা ই-টিডিএস ভেরিফিকেশন কোড ব্যতীত পরিশোধিত কর ক্রেডিট পাওয়া যাবে না।',
    verificationsEn: [
      'Deductor TIN, seal, and authorized signatory on Form 136',
      'Bangladesh Bank Treasury Challan number, date, and code verification',
      'Credit claimed exactly matching tax withheld at source'
    ],
    verificationsBn: [
      'ফরম ১৩৬-এ কর কর্তনকারী কর্তৃপক্ষের টিআইএন, সিল ও স্বাক্ষর',
      'বাংলাদেশ ব্যাংক সরকারি ট্রেজারি চালানের নম্বর ও তারিখ',
      'দাবিকৃত কর ক্রেডিট ও কর্তিত করের হুবহু মিল'
    ]
  },
  {
    id: 'donor-gift-deed-and-tin',
    category: 'statutory',
    priority: 'recommended',
    titleEn: 'Registered Gift Deed, Donor TIN Certificate & Donor Wealth Statement',
    titleBn: 'রেজিস্ট্রিকৃত দানপত্র দলিল, দাতার টিআইএন সনদ ও দাতার সম্পদ বিবরণী',
    sectionCode: 'Section 66(d) / Sec 67',
    summaryEn: 'Essential documents for defending received gifts: registered deed, kinship proof, and donor source of funds.',
    summaryBn: 'উপহার প্রমাণের জন্য রেজিস্ট্রিকৃত দানপত্র, সম্পর্কের প্রমাণ ও দাতার তহবিল সামর্থ্যের প্রামাণ্য নথিপত্র।',
    auditDefenseTipEn: 'A gift is presumed taxable under Section 66 / 67 unless donor identity, relationship, and genuine fund origin are proved.',
    auditDefenseTipBn: 'দাতার পরিচয়, রক্তের সম্পর্ক এবং বৈধ আর্থিক সামর্থ্য প্রমাণ করতে না পারলে উপহার সরাসরি করযোগ্য আয় হবে।',
    verificationsEn: [
      'Registered Deed of Gift executed on non-judicial stamp',
      'Donor valid TIN Certificate and copy of submitted tax return',
      'Donor bank statement showing debit of the gift amount'
    ],
    verificationsBn: [
      'নন-জুডিশিয়াল স্ট্যাম্পে সম্পাদিত রেজিস্ট্রিকৃত হেবা / দানপত্র দলিল',
      'দাতার হালনাগাদ টিআইএন সনদ ও দাখিলকৃত আয়কর রিটার্নের কপি',
      'দাতার নিজস্ব ব্যাংক হিসাব থেকে অর্থ ডেবিটের ব্যাংক স্টেটমেন্ট'
    ]
  }
];

const STORAGE_KEY = 'elawyers_sec66_67_doc_checklist_v1';

interface OtherSourcesDocChecklistProps {
  className?: string;
  showBengaliDefault?: boolean;
}

export function OtherSourcesDocChecklist({ 
  className = '', 
  showBengaliDefault = false 
}: OtherSourcesDocChecklistProps) {
  const { language } = useLanguage();
  const [bengaliMode, setBengaliMode] = useState<boolean>(showBengaliDefault || language === 'bn');
  
  // Keep in sync if global language changes
  useEffect(() => {
    if (language === 'bn') {
      setBengaliMode(true);
    }
  }, [language]);

  // Checked items state with LocalStorage persistence
  const [checkedIds, setCheckedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    // Default checked sample items to demonstrate functionality
    return ['royalty-license-agreement', 'legitimate-bank-credits', 'form-it-11ga-schedule-7'];
  });

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | 'sec66' | 'sec67' | 'statutory'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'mandatory' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Sync with LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedIds));
    } catch {
      // Storage quota or privacy mode error handling
    }
  }, [checkedIds]);

  const toggleCheck = (id: string) => {
    setCheckedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setCheckedIds(TAX_DOCUMENTATION_ITEMS.map(i => i.id));
  };

  const handleReset = () => {
    setCheckedIds([]);
  };

  // Filtered items
  const filteredItems = useMemo(() => {
    return TAX_DOCUMENTATION_ITEMS.filter(item => {
      // Category filter
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }

      // Priority / status filter
      if (filterPriority === 'mandatory' && item.priority !== 'mandatory') {
        return false;
      }
      if (filterPriority === 'pending' && checkedIds.includes(item.id)) {
        return false;
      }
      if (filterPriority === 'completed' && !checkedIds.includes(item.id)) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = item.titleEn.toLowerCase().includes(query) || item.titleBn.includes(query);
        const matchSection = item.sectionCode.toLowerCase().includes(query);
        const matchSummary = item.summaryEn.toLowerCase().includes(query) || item.summaryBn.includes(query);
        if (!matchTitle && !matchSection && !matchSummary) {
          return false;
        }
      }

      return true;
    });
  }, [activeCategory, filterPriority, searchQuery, checkedIds]);

  // Calculations
  const totalCount = TAX_DOCUMENTATION_ITEMS.length;
  const completedCount = checkedIds.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const sec66Count = TAX_DOCUMENTATION_ITEMS.filter(i => i.category === 'sec66').length;
  const sec66Completed = TAX_DOCUMENTATION_ITEMS.filter(i => i.category === 'sec66' && checkedIds.includes(i.id)).length;

  const sec67Count = TAX_DOCUMENTATION_ITEMS.filter(i => i.category === 'sec67').length;
  const sec67Completed = TAX_DOCUMENTATION_ITEMS.filter(i => i.category === 'sec67' && checkedIds.includes(i.id)).length;

  const statutoryCount = TAX_DOCUMENTATION_ITEMS.filter(i => i.category === 'statutory').length;
  const statutoryCompleted = TAX_DOCUMENTATION_ITEMS.filter(i => i.category === 'statutory' && checkedIds.includes(i.id)).length;

  // Copy Summary text for email or report
  const copyChecklistSummary = () => {
    const lines: string[] = [];
    lines.push(bengaliMode 
      ? 'আয়কর আইন ২০২৩: ধারা ৬৬ ও ৬৭ সংবিধিবদ্ধ কর নথিপত্র চেকলিস্ট প্রস্তুতি রিপোর্ট' 
      : 'INCOME TAX ACT 2023: SECTIONS 66 & 67 TAX DOCUMENTATION READINESS REPORT'
    );
    lines.push('========================================================================');
    lines.push(bengaliMode 
      ? `সামগ্রিক প্রস্তুতি: ${completedCount}/${totalCount} নথিপত্র প্রস্তুত (${progressPercent}%)` 
      : `Overall Readiness: ${completedCount}/${totalCount} Documents Prepared (${progressPercent}%)`
    );
    lines.push('');
    lines.push(bengaliMode ? '১. ধারা ৬৬ (সাধারণ প্রাপ্তি ও খরচ):' : '1. SECTION 66 (GENERAL RECEIPTS & EXPENSES):');
    TAX_DOCUMENTATION_ITEMS.filter(i => i.category === 'sec66').forEach(item => {
      const isDone = checkedIds.includes(item.id);
      lines.push(`  [${isDone ? '✓' : ' '}] ${bengaliMode ? item.titleBn : item.titleEn} (${item.sectionCode})`);
    });
    lines.push('');
    lines.push(bengaliMode ? '২. ধারা ৬৭ (বিশেষ ক্ষেত্র ও ডিমড আয় প্রতিরক্ষা):' : '2. SECTION 67 (SPECIAL CASES & DEEMED INCOME DEFENSE):');
    TAX_DOCUMENTATION_ITEMS.filter(i => i.category === 'sec67').forEach(item => {
      const isDone = checkedIds.includes(item.id);
      lines.push(`  [${isDone ? '✓' : ' '}] ${bengaliMode ? item.titleBn : item.titleEn} (${item.sectionCode})`);
    });
    lines.push('');
    lines.push(bengaliMode ? '৩. সংবিধিবদ্ধ রিটার্ন ফরম ও ই-রিটার্ন নথিপত্র:' : '3. STATUTORY RETURN FORMS & E-RETURN FILES:');
    TAX_DOCUMENTATION_ITEMS.filter(i => i.category === 'statutory').forEach(item => {
      const isDone = checkedIds.includes(item.id);
      lines.push(`  [${isDone ? '✓' : ' '}] ${bengaliMode ? item.titleBn : item.titleEn} (${item.sectionCode})`);
    });
    lines.push('');
    lines.push(bengaliMode ? 'প্রকাশক: ই-লয়ার্স | বাংলাদেশ ট্যাক্স, অ্যাকাউন্টিং ও কমপ্লায়েন্স' : 'Published by: E-Lawyers | Bangladesh Tax, Accounting & Compliance');
    
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  // Readiness status badge
  const getReadinessBadge = () => {
    if (progressPercent === 100) {
      return {
        labelEn: 'Audit-Proof & 100% Tax Compliant',
        labelBn: 'সম্পূর্ণ কর প্রস্তুত ও অডিট-সুরক্ষিত',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-300'
      };
    }
    if (progressPercent >= 70) {
      return {
        labelEn: 'High Compliance Readiness',
        labelBn: 'উচ্চ কমপ্লায়েন্স প্রস্তুতি',
        color: 'bg-blue-100 text-blue-800 border-blue-300'
      };
    }
    if (progressPercent >= 35) {
      return {
        labelEn: 'Documentation In Progress',
        labelBn: 'নথিপত্র প্রস্তুতকরণ চলমান',
        color: 'bg-amber-100 text-amber-800 border-amber-300'
      };
    }
    return {
      labelEn: 'Critical Documents Pending',
      labelBn: 'গুরুত্বপূর্ণ নথিপত্র বাকি রয়েছে',
      color: 'bg-rose-100 text-rose-800 border-rose-300'
    };
  };

  const badge = getReadinessBadge();

  return (
    <div className={`bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden ${className}`}>
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-6 sm:p-8 relative overflow-hidden">
        {/* Background glow & accents */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                {bengaliMode ? 'সংবিধিবদ্ধ অডিট চেকলিস্ট' : 'Statutory Audit Checklist'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700">
                <FileCheck2 className="w-3.5 h-3.5 text-blue-400" />
                {bengaliMode ? 'আইকর আইন ২০২৩: ধারা ৬৬ ও ৬৭' : 'Income Tax Act 2023: Sec 66 & 67'}
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {bengaliMode 
                ? 'অন্যান্য উৎস হতে আয়: সংবিধিবদ্ধ কর নথিপত্র চেকলিস্ট' 
                : 'Tax Documentation & Audit Defense Checklist'}
            </h3>

            <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              {bengaliMode
                ? 'আপনার ট্যাক্স ফাইল ও ই-রিটার্ন দাখিলের আগে প্রয়োজনীয় প্রতিটি চুক্তিপত্র, ভাউচার, ব্যাংকিং প্রমাণ ও বিবরণী ইন্টারেক্টিভভাবে টিক দিয়ে যাচাই করুন।'
                : 'Interactively track, verify, and check off the critical agreements, bank statements, and reconciliation worksheets required to defend your tax file.'}
            </p>
          </div>

          {/* Quick Utility Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Bengali/English toggle */}
            <button
              onClick={() => setBengaliMode(!bengaliMode)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all duration-200 backdrop-blur-sm"
              title="Toggle Bengali / English"
            >
              {bengaliMode ? 'Switch to English' : 'বাংলায় দেখুন'}
            </button>

            {/* Copy Summary */}
            <button
              onClick={copyChecklistSummary}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all duration-200"
              title="Copy checklist report to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (bengaliMode ? 'কপি হয়েছে!' : 'Copied!') : (bengaliMode ? 'রিপোর্ট কপি' : 'Copy Report')}</span>
            </button>

            {/* Print / Save */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all duration-200"
              title="Print checklist"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{bengaliMode ? 'প্রিন্ট' : 'Print'}</span>
            </button>

            {/* Reset */}
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Reset all checks"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{bengaliMode ? 'রিসেট' : 'Reset'}</span>
            </button>
          </div>
        </div>

        {/* Live Progress Bar Section */}
        <div className="mt-8 pt-6 border-t border-slate-700/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-200">
                {bengaliMode ? 'প্রস্তুতির অগ্রগতি:' : 'Documentation Readiness:'}
              </span>
              <span className="text-base font-bold text-emerald-400">
                {completedCount} / {totalCount} {bengaliMode ? 'টি প্রস্তুত' : 'Ready'} ({progressPercent}%)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.color}`}>
                {bengaliMode ? badge.labelBn : badge.labelEn}
              </span>
              {completedCount < totalCount && (
                <button
                  onClick={handleSelectAll}
                  className="text-xs text-emerald-400 hover:text-emerald-300 underline font-medium"
                >
                  {bengaliMode ? 'সবগুলো চেক করুন' : 'Check All'}
                </button>
              )}
            </div>
          </div>

          {/* Progress bar line */}
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/80">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          {/* Category mini-counters */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4 text-xs text-slate-300">
            <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between">
              <span>{bengaliMode ? 'ধারা ৬৬ নথি:' : 'Sec 66 Docs:'}</span>
              <span className="font-bold text-emerald-400">{sec66Completed}/{sec66Count}</span>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between">
              <span>{bengaliMode ? 'ধারা ৬৭ প্রতিরক্ষা:' : 'Sec 67 Defense:'}</span>
              <span className="font-bold text-amber-400">{sec67Completed}/{sec67Count}</span>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between">
              <span>{bengaliMode ? 'রিটার্ন ফরম:' : 'Statutory Forms:'}</span>
              <span className="font-bold text-blue-400">{statutoryCompleted}/{statutoryCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-sm">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {bengaliMode ? `সকল নথিপত্র (${totalCount})` : `All Documents (${totalCount})`}
            </button>
            <button
              onClick={() => setActiveCategory('sec66')}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeCategory === 'sec66'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              {bengaliMode ? `ধারা ৬৬ প্রাপ্তি (${sec66Count})` : `Sec 66 Receipts (${sec66Count})`}
            </button>
            <button
              onClick={() => setActiveCategory('sec67')}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeCategory === 'sec67'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
              }`}
            >
              {bengaliMode ? `ধারা ৬৭ প্রতিরক্ষা (${sec67Count})` : `Sec 67 Defense (${sec67Count})`}
            </button>
            <button
              onClick={() => setActiveCategory('statutory')}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeCategory === 'statutory'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
              }`}
            >
              {bengaliMode ? `রিটার্ন ফরম (${statutoryCount})` : `Statutory Forms (${statutoryCount})`}
            </button>
          </div>

          {/* Search & Priority Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={bengaliMode ? 'নথিপত্র খুঁজুন (যেমন: ব্যাংক, ঋণ)...' : 'Search docs (bank, loan, deed)...'}
                className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value as any)}
              className="px-3 py-1.5 text-xs sm:text-sm bg-white rounded-xl border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
            >
              <option value="all">{bengaliMode ? 'সকল অবস্থা' : 'All Statuses'}</option>
              <option value="pending">{bengaliMode ? 'বাকি নথিপত্র' : 'Pending Only'}</option>
              <option value="completed">{bengaliMode ? 'প্রস্তুতকৃত নথিপত্র' : 'Completed Only'}</option>
              <option value="mandatory">{bengaliMode ? 'বাধ্যতামূলক কেবল' : 'Mandatory Only'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Checklist Items Container */}
      <div className="p-4 sm:p-6 space-y-3.5">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300">
            <Info className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-700 mb-1">
              {bengaliMode ? 'কোনো নথিপত্র পাওয়া যায়নি' : 'No matching documents found'}
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              {bengaliMode 
                ? 'অনুসন্ধান বা ফিল্টারের শর্ত পরিবর্তন করে পুনরায় চেষ্টা করুন।'
                : 'Try adjusting your search query or status filter to view other tax documents.'}
            </p>
            <button
              onClick={() => { setSearchQuery(''); setFilterPriority('all'); setActiveCategory('all'); }}
              className="mt-4 px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              {bengaliMode ? 'ফিল্টার মুছুন' : 'Clear Filters'}
            </button>
          </div>
        ) : (
          filteredItems.map(item => {
            const isChecked = checkedIds.includes(item.id);
            const isExpanded = expandedId === item.id;

            // Category color accents
            const getCategoryTheme = () => {
              if (item.category === 'sec66') {
                return {
                  badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                  badgeLabel: bengaliMode ? 'ধারা ৬৬ প্রাপ্তি' : 'Sec 66 Receipt'
                };
              }
              if (item.category === 'sec67') {
                return {
                  badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
                  badgeLabel: bengaliMode ? 'ধারা ৬৭ ডিমড আয় প্রতিরক্ষা' : 'Sec 67 Deemed Defense'
                };
              }
              return {
                badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
                badgeLabel: bengaliMode ? 'সংবিধিবদ্ধ ফরম' : 'Statutory Form'
              };
            };

            const catTheme = getCategoryTheme();

            return (
              <div 
                key={item.id}
                className={`rounded-2xl border transition-all duration-200 ${
                  isChecked 
                    ? 'bg-emerald-50/40 border-emerald-300 shadow-sm' 
                    : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                {/* Main Item Row */}
                <div className="p-4 sm:p-5 flex items-start gap-3.5 sm:gap-4">
                  {/* Interactive Checkbox */}
                  <button
                    onClick={() => toggleCheck(item.id)}
                    className="mt-0.5 shrink-0 focus:outline-none transition-transform active:scale-95"
                    aria-label={`Toggle check for ${item.titleEn}`}
                  >
                    {isChecked ? (
                      <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-lg border-2 border-slate-300 hover:border-emerald-500 bg-white flex items-center justify-center transition-colors">
                        <div className="w-2 h-2 rounded-sm bg-transparent group-hover:bg-emerald-200"></div>
                      </div>
                    )}
                  </button>

                  {/* Document Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {/* Section code */}
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                        {item.sectionCode}
                      </span>

                      {/* Category tag */}
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${catTheme.badgeBg}`}>
                        {catTheme.badgeLabel}
                      </span>

                      {/* Priority Tag */}
                      {item.priority === 'mandatory' && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                          {bengaliMode ? 'বাধ্যতামূলক' : 'Mandatory'}
                        </span>
                      )}
                      {item.priority === 'conditional' && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                          {bengaliMode ? 'প্রযোজ্য ক্ষেত্রে' : 'Conditional'}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h4 
                      onClick={() => toggleCheck(item.id)}
                      className={`text-base sm:text-lg font-bold cursor-pointer transition-colors ${
                        isChecked 
                          ? 'text-emerald-950 line-through opacity-85' 
                          : 'text-slate-900 hover:text-emerald-700'
                      }`}
                    >
                      {bengaliMode ? item.titleBn : item.titleEn}
                    </h4>

                    {/* Summary Description */}
                    <p className={`text-xs sm:text-sm mt-1 leading-relaxed ${
                      isChecked ? 'text-slate-600' : 'text-slate-600'
                    }`}>
                      {bengaliMode ? item.summaryBn : item.summaryEn}
                    </p>

                    {/* Collapsible toggle */}
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5" />
                            <span>{bengaliMode ? 'অডিট পরামর্শ ও যাচাইকরণ লুকান' : 'Hide Audit Notes & Verifications'}</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            <span>{bengaliMode ? 'অডিট টিপস ও চেকিং পয়েন্ট দেখুন' : 'Show Audit Defense Tips & Checks'}</span>
                          </>
                        )}
                      </button>

                      {isChecked && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {bengaliMode ? 'প্রস্তুত হিসেবে চিহ্নিত' : 'Marked Prepared'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Drawer: Audit Defense Tips & Specific Verifications */}
                {isExpanded && (
                  <div className="px-4 pb-5 pt-1 sm:px-6 sm:pb-6 border-t border-slate-100 bg-slate-50/70 rounded-b-2xl mt-1 space-y-4">
                    {/* Why NBR Checks this */}
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-xs leading-relaxed text-amber-900">
                        <strong className="font-semibold block mb-0.5">
                          {bengaliMode ? 'কর কর্তৃপক্ষ (NBR/DCT) কেন এটি যাচাই করে:' : 'Why Tax Authority (NBR/DCT) Checks This:'}
                        </strong>
                        {bengaliMode ? item.auditDefenseTipBn : item.auditDefenseTipEn}
                      </div>
                    </div>

                    {/* Specific Actionable Checkpoints */}
                    <div>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        {bengaliMode ? 'নির্দিষ্ট দালিলিক যাচাইকরণ চেকলিস্ট:' : 'Specific Document Checkpoints:'}
                      </h5>
                      <ul className="space-y-1.5">
                        {(bengaliMode ? item.verificationsBn : item.verificationsEn).map((checkPoint, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                            <span>{checkPoint}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer / Summary Action Bar */}
      <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Info className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            {bengaliMode
              ? 'আপনার চেকলিস্ট অগ্রগতি ব্রাউজারে স্বয়ংক্রিয়ভাবে সংরক্ষিত থাকে।'
              : 'Your checklist selections are automatically saved in your browser storage.'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={copyChecklistSummary}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? (bengaliMode ? 'কপি সফল হয়েছে' : 'Copied to Clipboard') : (bengaliMode ? 'ক্লায়েন্ট বা আইনজীবীর জন্য কপি করুন' : 'Export / Copy Checklist')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
