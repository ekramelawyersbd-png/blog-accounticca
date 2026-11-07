export interface LmsVideoChapter {
  id: string;
  title: string;
  timestampLabel: string;
  progressMarker: number; // 0 to 100
  summary: string;
}

export interface LmsR2AssetMetadata {
  r2ObjectKey?: string;
  r2FileName?: string;
  r2MimeType?: string;
  r2FileSizeBytes?: number;
  r2UploadedAt?: string;
  r2StorageMode?: 'cloudflare-r2' | 'local-fallback';
  sourceType?: 'r2-upload' | 'url';
  externalUrl?: string;
}

export interface LmsVideoAsset extends LmsR2AssetMetadata {
  assetId: string;
  title: string;
  durationLabel: string;
  durationSeconds: number;
  instructor: string;
  streamUrl?: string;
  externalUrl?: string;
  keyTopics: string[];
  chapters: LmsVideoChapter[];
}

export interface LmsNoteSection {
  id: string;
  heading: string;
  statutoryRef: string;
  content: string;
  keyChecklist: string[];
}

export interface LmsNotesAsset extends LmsR2AssetMetadata {
  assetId: string;
  title: string;
  readingTimeMinutes: number;
  sections: LmsNoteSection[];
  externalUrl?: string;
}

export interface LmsPptSlide {
  slideNumber: number;
  title: string;
  subtitle: string;
  bulletPoints: string[];
  statutoryCitation: string;
  keyTakeaway: string;
}

export interface LmsPptAsset extends LmsR2AssetMetadata {
  assetId: string;
  title: string;
  deckCode: string;
  slides: LmsPptSlide[];
  externalUrl?: string;
}

export interface LmsQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface LmsQuizConfig {
  quizId: string;
  title: string;
  passingScore: number; // Percentage 0-100
  maxAttempts: number;
  questions: LmsQuizQuestion[];
}

export interface LmsLesson {
  lessonId: string; // Immutable ID so changing heading never breaks student progress
  classNumber: string; // '01' .. '10'
  label: string; // 'CLASS 1' .. 'CLASS 10'
  heading: string;
  description: string;
  quizRequired: boolean;
  published: boolean;
  videoAsset: LmsVideoAsset;
  notesAsset: LmsNotesAsset;
  pptAsset: LmsPptAsset;
  quizConfig: LmsQuizConfig;
}

export interface LmsFinalExamConfig {
  examId: string;
  title: string;
  description: string;
  timeLimitMinutes: number;
  passingScore: number; // e.g. 70
  maxAttempts: number;
  questions: LmsQuizQuestion[];
}

export interface LmsCourse {
  courseId: string;
  productSlug: string;
  programTag: string;
  title: string;
  subtitle: string;
  description: string;
  priceBdt: number;
  published: boolean;
  issuerOrganization: string;
  authorizedSignatory: string;
  signatoryDesignation: string;
  lessons: LmsLesson[];
  finalExam: LmsFinalExamConfig;
  updatedAt: string;
}

const CLASS_BLUEPRINTS: Array<{
  lessonId: string;
  classNumber: string;
  label: string;
  heading: string;
  description: string;
  statutoryRef: string;
  topics: string[];
  quizQuestion: string;
  quizOptions: string[];
  correctIdx: number;
  explanation: string;
}> = [
  {
    lessonId: 'cls_01',
    classNumber: '01',
    label: 'CLASS 1',
    heading: 'Introduction to the Course',
    description: 'Taxpayer categories, residency status rules, income year vs. assessment year, and statutory foundations under the Income Tax Act 2023.',
    statutoryRef: 'Sections 2, 16 & 26 of the Income Tax Act, 2023',
    topics: [
      'Overview of Direct Taxation & Finance Act 2026 updates',
      'Classification of Persons & Assessees under Section 2',
      'Resident vs. Non-Resident taxpayer determination rules',
      'Income Year vs. Assessment Year statutory timeline',
      '12-Digit e-TIN registration & Circle/Zone jurisdiction'
    ],
    quizQuestion: 'Under the Income Tax Act 2023, an individual is treated as a Resident in Bangladesh if they stay in Bangladesh during the income year for a period of at least:',
    quizOptions: [
      '90 days or more in aggregate',
      '182 days or more in aggregate (or 90+ days with 365+ days in preceding 4 years)',
      '240 days continuously without exit',
      'Only if holding a trade license in Dhaka'
    ],
    correctIdx: 1,
    explanation: 'Section 2(45) of the Income Tax Act 2023 stipulates 182 days or more in the income year, or 90 days in the income year coupled with 365 days across the preceding 4 years.'
  },
  {
    lessonId: 'cls_02',
    classNumber: '02',
    label: 'CLASS 2',
    heading: 'Fundamental Concepts',
    description: 'Mandatory return filing criteria, Proof of Submission of Return (PSR) for 43+ services, statutory deadlines (Tax Day), and self-assessment framework.',
    statutoryRef: 'Sections 166, 171 & 264 of the Income Tax Act, 2023',
    topics: [
      'Mandatory return filing triggers under Section 166',
      'Proof of Submission of Return (PSR) under Section 264',
      'National Tax Day (November 30) & extension procedures',
      'Universal Self-Assessment return processing under Section 180',
      'Penalties and consequences for non-filing under Section 266'
    ],
    quizQuestion: 'What is the statutory "Tax Day" deadline for an individual taxpayer in Bangladesh to file their annual income tax return without penalty?',
    quizOptions: [
      'June 30 of the income year',
      'September 15 of the assessment year',
      'November 30 following the end of the income year',
      'December 31 of the calendar year'
    ],
    correctIdx: 2,
    explanation: 'Under the Income Tax Act 2023, November 30 following the June 30 income year-end is designated as Tax Day for individual taxpayers.'
  },
  {
    lessonId: 'cls_03',
    classNumber: '03',
    label: 'CLASS 3',
    heading: 'Core Principles and Methods',
    description: 'Selection of the proper return form (IT-Gha 2023 vs. IT-11Gha 2023), mandatory schedules, and step-by-step docket assembly.',
    statutoryRef: 'NBR Statutory Return Forms IT-11Gha (2023) & IT-Gha (2023)',
    topics: [
      'Eligibility for One-Page Return Form (IT-Gha 2023)',
      'Comprehensive Individual Return Form (IT-11Gha 2023)',
      'Schedule 1 (Employment), Schedule 2 (House Property) & Schedule 3 (Business)',
      'Statement of Assets & Liabilities (IT-10B) & Lifestyle Expense (IT-10BB)',
      'Cross-reconciliation of opening net wealth, savings, and closing net wealth'
    ],
    quizQuestion: 'Which statement in the individual income tax return records a taxpayer’s personal and family living expenses during the income year?',
    quizOptions: [
      'IT-10B (Statement of Assets and Liabilities)',
      'IT-10BB (Statement of Lifestyle and Personal Expenses)',
      'Schedule 24A (Withholding Tax Schedule)',
      'Mushak-9.1 Monthly Return'
    ],
    correctIdx: 1,
    explanation: 'Form IT-10BB captures the taxpayer’s annual personal, family, housing, transport, education, and festival expenses.'
  },
  {
    lessonId: 'cls_04',
    classNumber: '04',
    label: 'CLASS 4',
    heading: 'Practical Applications',
    description: 'Computation of Income from Employment (salary, allowances, perquisites, one-third exemption cap) and Income from Business or Profession.',
    statutoryRef: 'Sections 32–36 & 45–55 of the Income Tax Act, 2023',
    topics: [
      'Gross salary components: basic pay, house rent, medical, conveyance & festival bonus',
      'Standard deduction rule: lower of 1/3rd of gross salary or BDT 4,50,000',
      'Valuation of employer-provided motor vehicle, accommodation & perquisites',
      'Recognized Provident Fund (RPF) & Gratuity Fund tax treatment',
      'Business & Professional income: allowable vs. inadmissible deductions'
    ],
    quizQuestion: 'Under the Income Tax Act 2023, what is the statutory tax-exempt deduction from gross employment income for a salaried individual?',
    quizOptions: [
      'Flat 50% of basic salary only',
      'Lower of one-third (1/3) of total employment income or BDT 4,50,000',
      'Actual house rent and medical receipts up to BDT 10,00,000',
      'No exemption is allowed on employment income'
    ],
    correctIdx: 1,
    explanation: 'Sixth Schedule Part 1 allows a single consolidated exemption equal to the lower of 1/3rd of gross salary income or BDT 4,50,000.'
  },
  {
    lessonId: 'cls_05',
    classNumber: '05',
    label: 'CLASS 5',
    heading: 'Advanced Concepts',
    description: 'Income from Rental House Property, municipal taxes, statutory repair & maintenance allowances, Agricultural Income, and Income from Other Sources.',
    statutoryRef: 'Sections 37–44 & 66–69 of the Income Tax Act, 2023',
    topics: [
      'Determining Annual Value of residential vs. commercial rental property',
      'Statutory repair & maintenance allowance: 25% (residential) vs. 30% (commercial)',
      'Deduction of municipal/city corporation tax, land revenue & mortgage interest',
      'Vacancy allowance rules and documentation with utility bills',
      'Agricultural income production costs (60% statutory allowance) & exemption threshold'
    ],
    quizQuestion: 'What is the statutory repair, collection, and maintenance allowance for a residential property let out to tenants?',
    quizOptions: [
      '15% of rental value',
      '25% of annual rental value',
      '30% of annual rental value',
      '40% of gross rent received'
    ],
    correctIdx: 1,
    explanation: 'For residential rental property, 25% of the annual value is allowed as statutory repair and maintenance deduction (30% applies to commercial property).'
  },
  {
    lessonId: 'cls_06',
    classNumber: '06',
    label: 'CLASS 6',
    heading: 'Tools and Techniques',
    description: 'Capital Gains taxation on land, apartments, and listed securities, plus Income from Financial Assets (FDR interest, savings instruments, dividends).',
    statutoryRef: 'Sections 57–65 of the Income Tax Act, 2023',
    topics: [
      'Capital gains computation: transfer value minus cost of acquisition & improvement',
      'Source tax on property transfer under Section 125 as minimum/final tax',
      'Capital gains from listed company shares on DSE/CSE for individual investors',
      'Taxation of Sanchayapatra (National Savings Certificates) TDS under Section 105',
      'Bank interest, FDR yield, and dividend income assessment'
    ],
    quizQuestion: 'How is tax deducted at source (TDS) on profits from Sanchayapatra (National Savings Certificates) treated for an individual taxpayer?',
    quizOptions: [
      'Fully exempt from all tax and omitted from the return',
      'Settled under Minimum Tax (Section 163) where TDS is the minimum tax liability on that income',
      'Refundable in cash within 7 days of deduction',
      'Taxed again at flat 30% regardless of slab'
    ],
    correctIdx: 1,
    explanation: 'Under Section 163 of the Income Tax Act 2023, TDS on Sanchayapatra profit constitutes the minimum tax on that source of income.'
  },
  {
    lessonId: 'cls_07',
    classNumber: '07',
    label: 'CLASS 7',
    heading: 'Practical Case Studies',
    description: 'Aggregating all 7 heads of income, applying progressive tax slabs (0%, 5%, 10%, 15%, 20%, 25%), and location-based minimum tax rules.',
    statutoryRef: 'Finance Act 2026 & Section 163 of the Income Tax Act, 2023',
    topics: [
      'Aggregation of all 7 statutory heads of income into Total Taxable Income',
      'Tax-free thresholds: General (BDT 3,50,000), Women/Senior 65+ (BDT 4,00,000), Disabled/Third Gender (BDT 4,75,000), Gazetted War-Wounded Freedom Fighters (BDT 5,00,000)',
      'Step-by-step slab calculation across 5% to 25% brackets',
      'Location-based minimum tax (BDT 5,000 City Corp / BDT 4,000 District / BDT 3,000 Other)',
      'End-to-end multi-head taxpayer case study walkthrough'
    ],
    quizQuestion: 'What is the statutory minimum tax payable by an individual taxpayer whose taxable income exceeds the tax-free threshold and who resides within Dhaka or Chattogram City Corporation?',
    quizOptions: [
      'BDT 2,000',
      'BDT 3,000',
      'BDT 4,000',
      'BDT 5,000'
    ],
    correctIdx: 3,
    explanation: 'Taxpayers residing in Dhaka North, Dhaka South, or Chattogram City Corporation areas with taxable income above the threshold must pay a minimum tax of BDT 5,000.'
  },
  {
    lessonId: 'cls_08',
    classNumber: '08',
    label: 'CLASS 8',
    heading: 'Real-World Implementation',
    description: 'Three-way Investment Tax Rebate formula (Section 78), qualifying investment instruments (Sixth Schedule Part 3), and TDS/Advance Tax credit adjustments.',
    statutoryRef: 'Section 78 & Sixth Schedule Part 3 of the Income Tax Act, 2023',
    topics: [
      'Qualifying investments: DPS (up to BDT 1,20,000), Sanchayapatra (up to BDT 5,00,000), Life Insurance (up to 10% of policy value), Listed Shares & Treasury Bonds',
      'Three-prong Investment Tax Rebate formula: Lower of (a) 3% of taxable income, (b) 15% of eligible investment, or (c) BDT 10,00,000',
      'Verification of Withholding Tax (TDS) certificates & bank challans',
      'Advance Income Tax (AIT) paid on motor vehicles (Section 138) adjustment rules',
      'Computing Net Tax Payable after rebate and tax credits'
    ],
    quizQuestion: 'Under Section 78 of the Income Tax Act 2023, the maximum Investment Tax Rebate is calculated as the LOWER of which three amounts?',
    quizOptions: [
      '5% of gross income, 20% of investment, or BDT 5,00,000',
      '3% of eligible taxable income, 15% of actual allowable investment, or BDT 10,00,000',
      '10% of total salary, 25% of DPS, or BDT 15,00,000',
      'Flat 15% of any bank deposit without limit'
    ],
    correctIdx: 1,
    explanation: 'Section 78 caps the investment tax rebate at the lowest of: 3% of taxable income (excluding minimum/exempt income), 15% of eligible investment, or BDT 10,00,000.'
  },
  {
    lessonId: 'cls_09',
    classNumber: '09',
    label: 'CLASS 9',
    heading: 'Revision and Practice',
    description: 'Net Wealth Surcharge computation, preparing the IT-10B Balance Sheet, reconciling accretion in net wealth, and avoiding audit red flags.',
    statutoryRef: 'Section 167 & Form IT-10B of the Income Tax Act, 2023',
    topics: [
      'When is IT-10B (Statement of Assets & Liabilities) mandatory? (Net wealth > BDT 50 Lakh, motor car owner, city property owner)',
      'Net Wealth Surcharge slabs (10% above BDT 4 Crore up to 35% for high net worth)',
      'Reconciling Opening Net Wealth + Total Income + Exempt Receipts/Gifts − Family Expenses = Closing Net Wealth',
      'Documenting non-agricultural property, gold/jewelry, cash in hand & bank balances',
      'Top 10 return filing errors that trigger NBR audit scrutiny'
    ],
    quizQuestion: 'Above what Net Wealth threshold does the Net Wealth Surcharge (starting at 10% of income tax payable) generally become applicable for an individual taxpayer?',
    quizOptions: [
      'Above BDT 50 Lakh',
      'Above BDT 1 Crore',
      'Above BDT 4 Crore (or owning 2+ motor cars / >8,000 sq. ft. house property)',
      'Above BDT 50 Crore only'
    ],
    correctIdx: 2,
    explanation: 'Net Wealth Surcharge starts at 10% when net wealth exceeds BDT 4 Crore (or if the assessee owns more than one motor car or house property exceeding 8,000 sq. ft.).'
  },
  {
    lessonId: 'cls_10',
    classNumber: '10',
    label: 'CLASS 10',
    heading: 'Final Review and Preparation',
    description: 'End-to-end simulation of the NBR Online e-Return Portal (etaxnbr.gov.bd): biometric mobile verification, ledger entry, A-Challan payment, and instant PSR download.',
    statutoryRef: 'NBR Online e-Return System (etaxnbr.gov.bd) & Section 264',
    topics: [
      'Biometric SIM verification & account registration on etaxnbr.gov.bd',
      'Navigating the Assessment Information, Income Heads, Rebate, and Expenditure tabs',
      'Entering Assets & Liabilities online and verifying zero-difference reconciliation',
      'Paying balance tax via Sonali Bank e-Payment, A-Challan, or Mobile Financial Services (bKash/Nagad)',
      'Final online submission, downloading the official Return View PDF & instant PSR acknowledgment slip'
    ],
    quizQuestion: 'Upon successfully submitting an online return on the NBR e-Return portal, which official document can be downloaded immediately as proof for bank, trade license, and vehicle services?',
    quizOptions: [
      'Certificate of Incorporation (Form XII)',
      'Proof of Submission of Return (PSR) / Acknowledgment Receipt with QR Code',
      'VAT Registration Bin Certificate (Mushak-2.3)',
      'Customs Bill of Entry'
    ],
    correctIdx: 1,
    explanation: 'The NBR e-Return portal immediately generates a QR-verifiable Proof of Submission of Return (PSR) acknowledgment certificate under Section 264.'
  }
];

function buildLessonsForCourse(coursePrefix: string): LmsLesson[] {
  return CLASS_BLUEPRINTS.map((bp, index) => {
    const num = bp.classNumber;
    return {
      lessonId: bp.lessonId,
      classNumber: num,
      label: bp.label,
      heading: bp.heading,
      description: bp.description,
      quizRequired: true,
      published: true,
      videoAsset: {
        assetId: `VID-${coursePrefix.toUpperCase()}-${num}`,
        title: `Class ${num}: ${bp.heading}`,
        durationLabel: `${22 + index * 3}m 30s`,
        durationSeconds: (22 + index * 3) * 60 + 30,
        instructor: 'Adv. Ekram Hossain, Advocate, Supreme Court of Bangladesh',
        keyTopics: bp.topics,
        chapters: [
          {
            id: `${bp.lessonId}_ch1`,
            title: '1. Statutory Framework & Legal Definitions',
            timestampLabel: '00:00',
            progressMarker: 25,
            summary: `Detailed breakdown of ${bp.statutoryRef} and key statutory definitions.`
          },
          {
            id: `${bp.lessonId}_ch2`,
            title: '2. Core Computation Methodology & Rules',
            timestampLabel: '06:45',
            progressMarker: 55,
            summary: `Step-by-step application of ${bp.topics[0]} and ${bp.topics[1]}.`
          },
          {
            id: `${bp.lessonId}_ch3`,
            title: '3. Practical Case Study & Working Sheet',
            timestampLabel: '14:20',
            progressMarker: 85,
            summary: `Live working example demonstrating ${bp.topics[2]} and ${bp.topics[3]}.`
          },
          {
            id: `${bp.lessonId}_ch4`,
            title: '4. Compliance Checklist & Filing Takeaways',
            timestampLabel: '19:50',
            progressMarker: 100,
            summary: `Final audit checklist covering ${bp.topics[4]} and practitioner safeguards.`
          }
        ]
      },
      notesAsset: {
        assetId: `DOC-${coursePrefix.toUpperCase()}-${num}`,
        title: `Class ${num} Lecture Notes — ${bp.heading}`,
        readingTimeMinutes: 8,
        sections: [
          {
            id: `${bp.lessonId}_sec1`,
            heading: `1. Statutory Provision & Scope (${bp.statutoryRef})`,
            statutoryRef: bp.statutoryRef,
            content: `${bp.description} Practitioners and taxpayers must evaluate the exact wording of ${bp.statutoryRef} alongside the latest Finance Act 2026 circulars issued by the National Board of Revenue (NBR).`,
            keyChecklist: [bp.topics[0], bp.topics[1]]
          },
          {
            id: `${bp.lessonId}_sec2`,
            heading: '2. Step-by-Step Computation & Documentation Protocol',
            statutoryRef: 'NBR Compliance Manual AY 2026–27',
            content: `When preparing the return docket for Class ${num}, ensure all primary evidentiary records—bank certificates, challans, salary statements, or property deeds—are cross-checked before entering figures into the return schedules.`,
            keyChecklist: [bp.topics[2], bp.topics[3]]
          },
          {
            id: `${bp.lessonId}_sec3`,
            heading: '3. Practitioner Audit Safeguards & Verification Checkpoint',
            statutoryRef: 'Universal Self-Assessment Audit Guidelines',
            content: `Before finalizing this module, confirm that every figure reconciles with the taxpayer's bank trail and IT-10B wealth statement to prevent discrepancies under Section 180 scrutiny.`,
            keyChecklist: [bp.topics[4], 'Verify documentary evidence retention for 6 assessment years']
          }
        ]
      },
      pptAsset: {
        assetId: `PPT-${coursePrefix.toUpperCase()}-${num}`,
        title: `Class ${num} Presentation Deck — ${bp.heading}`,
        deckCode: `DECK-${num}-2026`,
        slides: [
          {
            slideNumber: 1,
            title: `Class ${num}: ${bp.heading}`,
            subtitle: bp.statutoryRef,
            bulletPoints: [
              bp.description,
              `Primary Focus: ${bp.topics[0]}`,
              `Secondary Focus: ${bp.topics[1]}`
            ],
            statutoryCitation: bp.statutoryRef,
            keyTakeaway: 'Master the statutory baseline before applying computation formulas.'
          },
          {
            slideNumber: 2,
            title: 'Core Rules & Computation Matrix',
            subtitle: 'Statutory Thresholds & Exemptions',
            bulletPoints: [
              bp.topics[1],
              bp.topics[2],
              bp.topics[3]
            ],
            statutoryCitation: 'Income Tax Act, 2023 & Finance Act, 2026',
            keyTakeaway: 'Always verify whether TDS on a head of income falls under Minimum Tax (Section 163).'
          },
          {
            slideNumber: 3,
            title: 'Practical Implementation & Audit Checklist',
            subtitle: 'Evidentiary Requirements & Filing Best Practices',
            bulletPoints: [
              bp.topics[3],
              bp.topics[4],
              'Cross-verify all schedules prior to final e-Return submission'
            ],
            statutoryCitation: 'NBR e-Return Filing Protocol',
            keyTakeaway: 'Complete the Class Quiz after reviewing the Video and Notes to unlock the next module.'
          }
        ]
      },
      quizConfig: {
        quizId: `QUIZ-${coursePrefix.toUpperCase()}-${num}`,
        title: `Class ${num} Assessment Quiz — ${bp.heading}`,
        passingScore: 70,
        maxAttempts: 5,
        questions: [
          {
            id: `${bp.lessonId}_q1`,
            question: bp.quizQuestion,
            options: bp.quizOptions,
            correctOptionIndex: bp.correctIdx,
            explanation: bp.explanation
          },
          {
            id: `${bp.lessonId}_q2`,
            question: `Which primary statutory reference governs the core principles covered in Class ${num} (${bp.heading})?`,
            options: [
              bp.statutoryRef,
              'Admiralty Court Act, 2000',
              'Negotiable Instruments Act, 1881 Section 138 only',
              'Trademark Rules, 2015'
            ],
            correctOptionIndex: 0,
            explanation: `Class ${num} is directly governed by ${bp.statutoryRef}.`
          },
          {
            id: `${bp.lessonId}_q3`,
            question: `In Class ${num}, which of the following is an essential practitioner compliance step?`,
            options: [
              bp.topics[0],
              'Submitting unverified verbal estimates without bank statements',
              'Ignoring the November 30 Tax Day deadline',
              'Omitting mandatory schedules from the return'
            ],
            correctOptionIndex: 0,
            explanation: `"${bp.topics[0]}" is a core statutory requirement emphasized in Class ${num}.`
          }
        ]
      }
    };
  });
}

export const DEFAULT_FINAL_EXAM_QUESTIONS: LmsQuizQuestion[] = CLASS_BLUEPRINTS.map((bp, idx) => ({
  id: `final_q_${idx + 1}`,
  question: bp.quizQuestion,
  options: bp.quizOptions,
  correctOptionIndex: bp.correctIdx,
  explanation: bp.explanation
}));

export const INITIAL_LMS_COURSES: LmsCourse[] = [
  {
    courseId: 'personal-income-tax',
    productSlug: 'income-tax-calculator-2026-27',
    programTag: 'DIGITAL LEARNING PROGRAM',
    title: 'Personal Income Tax & Online e-Return Filing Masterclass (AY 2026–27)',
    subtitle: '10 Classes · Quizzes · Final Examination',
    description: 'Comprehensive 10-class practitioner program covering the Income Tax Act 2023, Finance Act 2026 slabs, salary/house/business computation, Section 78 investment rebate, IT-10B net wealth reconciliation, and live NBR online e-Return filing.',
    priceBdt: 2500,
    published: true,
    issuerOrganization: 'E-Lawyers Academy & Accounticca Professional Institute',
    authorizedSignatory: 'Adv. Ekram Hossain',
    signatoryDesignation: 'Advocate, Supreme Court of Bangladesh & Lead Tax Counsel',
    lessons: buildLessonsForCourse('pit'),
    finalExam: {
      examId: 'EXAM-PIT-2026',
      title: 'Final Examination — Personal Income Tax & e-Return Certification',
      description: 'Comprehensive 10-question final certification assessment covering all 10 classes of the Personal Income Tax & Online e-Return Filing Masterclass.',
      timeLimitMinutes: 25,
      passingScore: 70,
      maxAttempts: 5,
      questions: DEFAULT_FINAL_EXAM_QUESTIONS
    },
    updatedAt: '2026-10-20T00:00:00Z'
  },
  {
    courseId: 'rjsc-corporate-compliance',
    productSlug: 'company-incorporation-rjsc-compliance-kit',
    programTag: 'DIGITAL LEARNING PROGRAM',
    title: 'Corporate Law, RJSC Company Registration & Annual Compliance Program',
    subtitle: '10 Classes · Quizzes · Final Examination',
    description: 'End-to-end corporate legal training covering Name Clearance, MOA/AOA drafting, Private Limited incorporation, Form XII, Schedule X, share transfer (Form 117), and AGM statutory filings.',
    priceBdt: 3000,
    published: true,
    issuerOrganization: 'E-Lawyers Academy & Accounticca Professional Institute',
    authorizedSignatory: 'Adv. Ekram Hossain',
    signatoryDesignation: 'Advocate, Supreme Court of Bangladesh & Lead Corporate Counsel',
    lessons: buildLessonsForCourse('rjsc'),
    finalExam: {
      examId: 'EXAM-RJSC-2026',
      title: 'Final Examination — Corporate Law & RJSC Compliance Certification',
      description: 'Comprehensive 10-question final examination assessing mastery of RJSC incorporation, statutory returns, and tax/corporate compliance.',
      timeLimitMinutes: 25,
      passingScore: 70,
      maxAttempts: 5,
      questions: DEFAULT_FINAL_EXAM_QUESTIONS
    },
    updatedAt: '2026-10-20T00:00:00Z'
  }
];
