import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp,
  updateDoc,
  increment,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';

export type ProfessionalRole = 
  | 'advocate_supreme_court'
  | 'advocate_district_court'
  | 'barrister'
  | 'chartered_accountant'
  | 'cost_management_accountant'
  | 'tax_practitioner'
  | 'corporate_counsel'
  | 'legal_academic'
  | 'finance_director'
  | 'general_practitioner';

export interface ProfessionalRoleInfo {
  value: ProfessionalRole;
  label: string;
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  iconType: 'scales' | 'calculator' | 'briefcase' | 'award';
}

export const PROFESSIONAL_ROLES: ProfessionalRoleInfo[] = [
  {
    value: 'advocate_supreme_court',
    label: 'Advocate, Supreme Court of Bangladesh',
    badgeColor: 'text-indigo-800',
    badgeBg: 'bg-indigo-50',
    badgeBorder: 'border-indigo-200',
    iconType: 'scales'
  },
  {
    value: 'barrister',
    label: 'Barrister-at-Law',
    badgeColor: 'text-purple-800',
    badgeBg: 'bg-purple-50',
    badgeBorder: 'border-purple-200',
    iconType: 'scales'
  },
  {
    value: 'advocate_district_court',
    label: 'Advocate, District & Sessions Court',
    badgeColor: 'text-sky-800',
    badgeBg: 'bg-sky-50',
    badgeBorder: 'border-sky-200',
    iconType: 'scales'
  },
  {
    value: 'chartered_accountant',
    label: 'Chartered Accountant (FCA / ACA - ICAB)',
    badgeColor: 'text-emerald-800',
    badgeBg: 'bg-emerald-50',
    badgeBorder: 'border-emerald-200',
    iconType: 'calculator'
  },
  {
    value: 'cost_management_accountant',
    label: 'Cost & Management Accountant (FCMA / ACMA)',
    badgeColor: 'text-teal-800',
    badgeBg: 'bg-teal-50',
    badgeBorder: 'border-teal-200',
    iconType: 'calculator'
  },
  {
    value: 'tax_practitioner',
    label: 'Income Tax Practitioner (ITP) / VAT Consultant',
    badgeColor: 'text-amber-900',
    badgeBg: 'bg-amber-50',
    badgeBorder: 'border-amber-200',
    iconType: 'calculator'
  },
  {
    value: 'corporate_counsel',
    label: 'In-House Legal Counsel / Company Secretary',
    badgeColor: 'text-blue-800',
    badgeBg: 'bg-blue-50',
    badgeBorder: 'border-blue-200',
    iconType: 'briefcase'
  },
  {
    value: 'finance_director',
    label: 'CFO / Corporate Finance Director',
    badgeColor: 'text-cyan-900',
    badgeBg: 'bg-cyan-50',
    badgeBorder: 'border-cyan-200',
    iconType: 'calculator'
  },
  {
    value: 'legal_academic',
    label: 'Law Professor / Legal Researcher',
    badgeColor: 'text-rose-800',
    badgeBg: 'bg-rose-50',
    badgeBorder: 'border-rose-200',
    iconType: 'award'
  },
  {
    value: 'general_practitioner',
    label: 'Corporate & Legal Professional',
    badgeColor: 'text-slate-700',
    badgeBg: 'bg-slate-100',
    badgeBorder: 'border-slate-200',
    iconType: 'briefcase'
  }
];

export const DISCUSSION_TOPIC_TAGS = [
  'Statutory Interpretation',
  'Tax Assessment & ITA 2023',
  'Withholding Tax (TDS)',
  'VAT & SD Compliance',
  'Corporate Law & RJSC',
  'NBR SRO & Circulars',
  'High Court Precedent',
  'Practical Audit & Filing',
  'Penalty & Dispute Defense',
  'Tax Exemption & Rebates',
  'General Legal Inquiry'
];

export type CommentType = 'insight' | 'question';

export interface CommentItem {
  id: string;
  articleId: string;
  userId?: string;
  authorName: string;
  authorEmail?: string;
  role: ProfessionalRole;
  roleLabel: string;
  organization?: string;
  statutoryRef?: string;
  topicTag?: string;
  commentType?: CommentType;
  avatar: string;
  text: string;
  date: string;
  helpfulCount: number;
  parentId?: string | null;
  isVerifiedProfessional?: boolean;
}

// Initial realistic peer discussions seeded for Bangladesh law & accounting professionals
const DEFAULT_SEED_DISCUSSIONS: Record<string, CommentItem[]> = {
  default: [
    {
      id: 'seed-comment-1',
      articleId: 'default',
      commentType: 'insight',
      authorName: 'Adv. Barrister Tanjim Al-Islam',
      role: 'barrister',
      roleLabel: 'Barrister-at-Law & Advocate, Supreme Court of Bangladesh',
      organization: 'Tanjim & Associates Chambers, Supreme Court Bar',
      statutoryRef: 'Section 272(2), Income Tax Act 2023',
      topicTag: 'Statutory Interpretation',
      avatar: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=150&h=150&fit=crop&crop=faces',
      text: 'From a litigation standpoint before the High Court Division, the procedural hurdle under Section 272 is that the Deputy Commissioner of Taxes (DCT) must establish willful failure before applying punitive compounding penalties. Practicing counsel should always ensure the formal notice issued under Section 272 cites clear grounds rather than standard template assertions.',
      date: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
      helpfulCount: 14,
      parentId: null,
      isVerifiedProfessional: true
    },
    {
      id: 'seed-comment-q1',
      articleId: 'default',
      commentType: 'question',
      authorName: 'Shahriar Ahmed, ACMA',
      role: 'cost_management_accountant',
      roleLabel: 'Cost & Management Accountant (ACMA)',
      organization: 'FinTech Logistics Ltd.',
      statutoryRef: 'Section 119 & Section 166, ITA 2023',
      topicTag: 'Withholding Tax (TDS)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces',
      text: 'For cross-border SaaS software subscriptions (AWS/Google Cloud) paid via corporate credit card without a physical Permanent Establishment in Bangladesh, what is the current applicable withholding rate under the new Finance Act? Does the bank automatically deduct 20% TDS or must we file a separate Mushak 6.3 / 6.6 certificate?',
      date: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
      helpfulCount: 9,
      parentId: null,
      isVerifiedProfessional: true
    },
    {
      id: 'seed-comment-a1',
      articleId: 'default',
      commentType: 'insight',
      authorName: 'Mohammad Farhad Hossain, FCA',
      role: 'chartered_accountant',
      roleLabel: 'Chartered Accountant (FCA - ICAB)',
      organization: 'Farhad & Co., Chartered Accountants',
      statutoryRef: 'Section 119(1) & NBR SRO 186/2023',
      topicTag: 'Withholding Tax (TDS)',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces',
      text: 'Under Section 119 read with the Sixth Schedule, authorized dealer (AD) banks in Bangladesh deduct 20% TDS plus 15% VAT on royalty/technical service remittance abroad unless a Double Tax Avoidance Agreement (DTAA) residency certificate is validated by the NBR Taxes Zone. Ensure you collect the Form 16C withholding challan from your bank for annual tax assessment audit trails.',
      date: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
      helpfulCount: 16,
      parentId: 'seed-comment-q1',
      isVerifiedProfessional: true
    },
    {
      id: 'seed-comment-2',
      articleId: 'default',
      commentType: 'insight',
      authorName: 'Mohammad Farhad Hossain, FCA',
      role: 'chartered_accountant',
      roleLabel: 'Chartered Accountant (FCA - ICAB)',
      organization: 'Farhad & Co., Chartered Accountants',
      statutoryRef: 'VAT & SD Act 2012, Third Schedule',
      topicTag: 'VAT & SD Compliance',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces',
      text: 'When preparing the tax reconciliation statement (Mushak 9.1 vs audited financial statements), auditors often observe variance due to timing differences in export LC realizations. Ensuring documented proof of bill of lading (BL) and PRC (Proceeds Realization Certificate) eliminates 90% of DCT scrutiny during assessment proceedings.',
      date: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
      helpfulCount: 11,
      parentId: null,
      isVerifiedProfessional: true
    },
    {
      id: 'seed-comment-3',
      articleId: 'default',
      commentType: 'insight',
      authorName: 'Nasrin Sultana, ITP',
      role: 'tax_practitioner',
      roleLabel: 'Income Tax Practitioner (ITP) & VAT Consultant',
      organization: 'Dhaka Taxes Bar Association',
      statutoryRef: 'NBR SRO No. 182-Ain/2023',
      topicTag: 'NBR SRO & Circulars',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=faces',
      text: 'Note that the revised SRO provides an extension window for submission of withholding tax returns under Section 177. If clients faced e-TIN verification portal timeouts during month-end, keep the server timestamp log saved as evidence.',
      date: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      helpfulCount: 8,
      parentId: 'seed-comment-1',
      isVerifiedProfessional: true
    }
  ],
  'facebook-post-1718531953613967': [
    {
      id: 'fb-comment-1',
      articleId: 'facebook-post-1718531953613967',
      commentType: 'insight',
      authorName: 'Adv. Kazi Mahmudur Rahman',
      role: 'advocate_supreme_court',
      roleLabel: 'Advocate, Supreme Court of Bangladesh',
      organization: 'Dhaka Bar & Supreme Court Chambers',
      statutoryRef: 'Companies Act 1994 & RJSC Regulations',
      topicTag: 'Corporate Law & RJSC',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces',
      text: 'Remarkable milestone for corporate compliance in Bangladesh! Having seasoned barristers at E-Lawyers working alongside chartered tax specialists under one roof drastically speeds up RJSC name clearance, cross-border shareholder agreements, and post-incorporation statutory filings.',
      date: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      helpfulCount: 19,
      parentId: null,
      isVerifiedProfessional: true
    },
    {
      id: 'fb-comment-2',
      articleId: 'facebook-post-1718531953613967',
      commentType: 'question',
      authorName: 'Tanveer Hasan',
      role: 'corporate_counsel',
      roleLabel: 'Corporate Legal Counsel & Startup Founder',
      organization: 'TechVanguard Bangladesh',
      statutoryRef: 'Section 166, Income Tax Act 2023',
      topicTag: 'Tax Assessment & ITA 2023',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces',
      text: 'Congratulations to the entire team! Does E-Lawyers assist foreign investors and joint-venture companies in obtaining BIDA work permits and initial RJSC branch office licenses as part of this unified ecosystem?',
      date: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(),
      helpfulCount: 12,
      parentId: null,
      isVerifiedProfessional: true
    },
    {
      id: 'fb-comment-3',
      articleId: 'facebook-post-1718531953613967',
      commentType: 'insight',
      authorName: 'Barrister Ekramul Haque',
      role: 'barrister',
      roleLabel: 'Head of Legal Chambers, E-Lawyers',
      organization: 'E-LAWYERS Chambers & Corporate Law Practice',
      statutoryRef: 'BIDA Act 2016 & Foreign Exchange Regulation Act 1947',
      topicTag: 'Corporate Law & RJSC',
      avatar: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=150&h=150&fit=crop&crop=faces',
      text: 'Thank you Tanveer! Yes, absolutely. Our dedicated foreign direct investment (FDI) wing handles end-to-end BIDA registration, RJSC liaison/branch office approvals, Bangladesh Bank 18A/18B reporting, and outward remittance compliance for international joint ventures.',
      date: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      helpfulCount: 24,
      parentId: 'fb-comment-2',
      isVerifiedProfessional: true
    }
  ],
  'display-proof-submission-return-psr-section-265-bangladesh': [
    {
      id: 'psr-comment-1',
      articleId: 'display-proof-submission-return-psr-section-265-bangladesh',
      commentType: 'insight',
      authorName: 'Adv. M. Golam Sarwar, Supreme Court Bar',
      role: 'advocate_supreme_court',
      roleLabel: 'Advocate, Supreme Court of Bangladesh',
      organization: 'Sarwar & Partners Corporate Chambers',
      statutoryRef: 'Section 265 & Section 322, Income Tax Act 2023',
      topicTag: 'Statutory Interpretation',
      avatar: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=150&h=150&fit=crop&crop=faces',
      text: 'Section 265(2) of the Income Tax Act 2023 vests discretionary penalty jurisdiction in the DCT (BDT 20,000 to 50,000). However, under administrative law and natural justice principles codified in the Act, an inspecting DCT or tax officer cannot summarily levy this penalty on the spot without first serving a formal written Show Cause Notice giving reasonable time to respond. If an arbitrary order is passed without a formal hearing, it is immediately contestable on appeal under Section 322 before the Commissioner (Appeals).',
      date: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
      helpfulCount: 28,
      parentId: null,
      isVerifiedProfessional: true
    },
    {
      id: 'psr-comment-q1',
      articleId: 'display-proof-submission-return-psr-section-265-bangladesh',
      commentType: 'question',
      authorName: 'Md. Kamrul Ahsan, ACA',
      role: 'chartered_accountant',
      roleLabel: 'Chartered Accountant (ACA - ICAB)',
      organization: 'K. Ahsan & Co., Chartered Accountants',
      statutoryRef: 'Section 265, ITA 2023 (as amended by FA 2026)',
      topicTag: 'Corporate Tax',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces',
      text: 'For a corporate retail client with 14 outlets across Dhaka and Chattogram, does each retail outlet require displaying a separate branch-level PSR or is a certified copy of the principal registered office e-Return acknowledgment slip containing the Company TIN and trade license address sufficient during spot inspections?',
      date: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
      helpfulCount: 19,
      parentId: null,
      isVerifiedProfessional: true
    },
    {
      id: 'psr-comment-a1',
      articleId: 'display-proof-submission-return-psr-section-265-bangladesh',
      commentType: 'insight',
      authorName: 'Advocate Ekramul Hoque',
      role: 'advocate_supreme_court',
      roleLabel: 'Advocate, Supreme Court of Bangladesh & Founder, E-Lawyers',
      organization: 'E-Lawyers – Legal & Business Consultancy Firm',
      statutoryRef: 'Section 265(1) & NBR Directive 2026',
      topicTag: 'Corporate Tax',
      avatar: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=400',
      text: 'Under Section 265, "business premises" applies to each registered place of business where commercial activities are carried on. Because each branch holds a designated display point under local Trade License rules, best practice is to frame a legible, high-resolution certified copy of the company\'s centralized e-Return verification slip (with its active QR code) alongside the outlet\'s trade license at every branch reception counter.',
      date: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      helpfulCount: 34,
      parentId: 'psr-comment-q1',
      isVerifiedProfessional: true
    },
    {
      id: 'psr-comment-2',
      articleId: 'display-proof-submission-return-psr-section-265-bangladesh',
      commentType: 'insight',
      authorName: 'Farhana Parveen, ITP',
      role: 'tax_practitioner',
      roleLabel: 'Income Tax Practitioner (ITP) & VAT Consultant',
      organization: 'Chittagong Taxes Bar Association',
      statutoryRef: 'Finance Act 2026, Section 265 & Section 264',
      topicTag: 'Tax Assessment & ITA 2023',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=faces',
      text: 'Practitioners must note the crucial legal distinction between Section 264 and Section 265: Section 264 dictates where PSR must be verified by 45+ service-providing agencies (banks, trade license renewal, utility connections), whereas Section 265 specifically mandates public physical display at the business or professional premises. Fulfilling one does not substitute for the other.',
      date: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      helpfulCount: 22,
      parentId: null,
      isVerifiedProfessional: true
    }
  ],
  'company-audited-financial-statements-income-computation-sheet-bangladesh': [
    {
      id: 'audit-comment-1',
      articleId: 'company-audited-financial-statements-income-computation-sheet-bangladesh',
      commentType: 'insight',
      authorName: 'Mohammad Farhad Hossain, FCA',
      role: 'chartered_accountant',
      roleLabel: 'Chartered Accountant (FCA - ICAB)',
      organization: 'Farhad & Co., Chartered Accountants',
      statutoryRef: 'Section 73(1) ITA 2023 (as substituted by FA 2026)',
      topicTag: 'Audited Financial Statements',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces',
      text: 'The substitution of Section 73 by Section 59 of the Finance Act 2026 introduces strict statutory parity: whether a company, association of persons (AOP), or partnership firm exceeds the BDT 10 Crore turnover or BDT 5 Crore capital threshold, the financial statements and the accompanying Income Computation Sheet must bear an authentic ICAB Document Verification Code (DVC). Submissions without valid DVC verification will trigger Section 75 default proceedings for incomplete returns.',
      date: new Date(Date.now() - 16 * 3600 * 1000).toISOString(),
      helpfulCount: 31,
      parentId: null,
      isVerifiedProfessional: true
    },
    {
      id: 'audit-comment-q1',
      articleId: 'company-audited-financial-statements-income-computation-sheet-bangladesh',
      commentType: 'question',
      authorName: 'Syed Naimul Islam, FCMA',
      role: 'cost_management_accountant',
      roleLabel: 'Cost & Management Accountant (FCMA)',
      organization: 'Apex Industrial Holdings Ltd.',
      statutoryRef: 'Section 73 & Third Schedule, Depreciation Allowances',
      topicTag: 'Tax Accounting & Computation',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces',
      text: 'In cases where accounting depreciation under IAS 16 differs from tax depreciation under the Third Schedule of the ITA 2023, what is the best disclosure practice in the Income Computation Sheet to avoid unilateral disallowance by the DCT under Section 55?',
      date: new Date(Date.now() - 11 * 3600 * 1000).toISOString(),
      helpfulCount: 20,
      parentId: null,
      isVerifiedProfessional: true
    },
    {
      id: 'audit-comment-a1',
      articleId: 'company-audited-financial-statements-income-computation-sheet-bangladesh',
      commentType: 'insight',
      authorName: 'Advocate Ekramul Hoque',
      role: 'advocate_supreme_court',
      roleLabel: 'Advocate, Supreme Court of Bangladesh & Founder, E-Lawyers',
      organization: 'E-Lawyers – Legal & Business Consultancy Firm',
      statutoryRef: 'Section 49, 50 & Third Schedule, ITA 2023',
      topicTag: 'Corporate Tax',
      avatar: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=400',
      text: 'Always include a comprehensive Tax Reconciliation Schedule as an annexure to the certified Income Computation Sheet. Start with Net Profit Before Tax (accounting profit), add back book depreciation and non-admissible expenses under Section 55, and separately deduct allowable tax depreciation computed strictly under the Third Schedule. Both the client\'s Managing Director and the ICAB-registered statutory auditor should cross-sign this schedule.',
      date: new Date(Date.now() - 7 * 3600 * 1000).toISOString(),
      helpfulCount: 39,
      parentId: 'audit-comment-q1',
      isVerifiedProfessional: true
    }
  ],
  'corporate-income-tax-return-deadline-bangladesh-2026': [
    {
      id: 'deadline-comment-1',
      articleId: 'corporate-income-tax-return-deadline-bangladesh-2026',
      commentType: 'insight',
      authorName: 'Adv. Barrister Tanjim Al-Islam',
      role: 'barrister',
      roleLabel: 'Barrister-at-Law & Advocate, Supreme Court of Bangladesh',
      organization: 'Tanjim & Associates Chambers, Supreme Court Bar',
      statutoryRef: 'Section 170(2) & Section 171, Income Tax Act 2023',
      topicTag: 'Statutory Interpretation',
      avatar: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=150&h=150&fit=crop&crop=faces',
      text: 'For corporations observing the July 1 to June 30 accounting year, calculating the 15th day of the 9th month lands squarely on March 15, 2027. If an assessee requires an extension due to delayed audit completion or cross-border transfer pricing certifications, application under Section 171 must be lodged with the DCT prior to the expiry of the statutory March 15 deadline.',
      date: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      helpfulCount: 26,
      parentId: null,
      isVerifiedProfessional: true
    },
    {
      id: 'deadline-comment-2',
      articleId: 'corporate-income-tax-return-deadline-bangladesh-2026',
      commentType: 'insight',
      authorName: 'Nasrin Sultana, ITP',
      role: 'tax_practitioner',
      roleLabel: 'Income Tax Practitioner (ITP) & VAT Consultant',
      organization: 'Dhaka Taxes Bar Association',
      statutoryRef: 'Section 170(2) Alternative Rule (September 15)',
      topicTag: 'Tax Assessment & ITA 2023',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=faces',
      text: 'Take careful note of multinational subsidiaries operating on a calendar year (January 1 to December 31). Their 9th month reaches September 15. The alternative September 15 rule in Section 170(2) ensures that no company is required to file earlier than September 15 immediately following the close of the relevant income year.',
      date: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      helpfulCount: 18,
      parentId: null,
      isVerifiedProfessional: true
    }
  ]
};

const getLocalCacheKey = (articleId: string) => `accounticca_comments_${articleId}`;

/**
 * Read comments from localStorage cache
 */
export function getLocalCachedComments(articleId: string): CommentItem[] {
  try {
    const raw = localStorage.getItem(getLocalCacheKey(articleId));
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to read local comments cache', err);
  }

  // Fallback to default seed discussions tailored for Bangladesh law
  const seeds = DEFAULT_SEED_DISCUSSIONS[articleId] || DEFAULT_SEED_DISCUSSIONS.default;
  return seeds.map(s => ({ ...s, articleId }));
}

/**
 * Save comments to localStorage cache
 */
export function setLocalCachedComments(articleId: string, items: CommentItem[]) {
  try {
    localStorage.setItem(getLocalCacheKey(articleId), JSON.stringify(items));
  } catch (err) {
    console.warn('Failed to update local comments cache', err);
  }
}

/**
 * Subscribe to real-time comments from Firestore for a given article
 */
export function subscribeToArticleComments(
  articleId: string,
  onUpdate: (comments: CommentItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  const commentsCol = 'comments';
  const q = query(
    collection(db, commentsCol),
    where('articleId', '==', articleId)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        // Return local or seed comments
        const local = getLocalCachedComments(articleId);
        onUpdate(local);
        return;
      }

      const cloudComments: CommentItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        cloudComments.push({
          id: docSnap.id,
          articleId: data.articleId || articleId,
          userId: data.userId,
          authorName: data.authorName || 'Anonymous Professional',
          authorEmail: data.authorEmail,
          role: data.role || 'general_practitioner',
          roleLabel: data.roleLabel || 'Legal & Tax Professional',
          organization: data.organization || '',
          statutoryRef: data.statutoryRef || '',
          topicTag: data.topicTag || 'Statutory Interpretation',
          commentType: data.commentType || 'insight',
          avatar: data.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.authorName || 'Counsel')}`,
          text: data.text || '',
          date: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.date || new Date().toISOString(),
          helpfulCount: data.helpfulCount || 0,
          parentId: data.parentId || null,
          isVerifiedProfessional: data.isVerifiedProfessional ?? true
        });
      });

      // Merge with seed comments if needed
      const seeds = DEFAULT_SEED_DISCUSSIONS[articleId] || DEFAULT_SEED_DISCUSSIONS.default;
      const combinedMap = new Map<string, CommentItem>();
      seeds.forEach(s => combinedMap.set(s.id, { ...s, articleId }));
      cloudComments.forEach(c => combinedMap.set(c.id, c));

      const merged = Array.from(combinedMap.values());
      setLocalCachedComments(articleId, merged);
      onUpdate(merged);
    },
    (error) => {
      console.warn('Firestore comments subscription fallback to local cache:', error);
      try {
        handleFirestoreError(error, OperationType.LIST, commentsCol);
      } catch {
        // Fallback gracefully
      }
      onUpdate(getLocalCachedComments(articleId));
      if (onError) onError(error);
    }
  );

  return unsubscribe;
}

/**
 * Post a new professional comment or reply
 */
export async function postProfessionalComment(
  newCommentData: Omit<CommentItem, 'id' | 'date' | 'helpfulCount'>
): Promise<CommentItem> {
  const commentId = `comment_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const dateIso = new Date().toISOString();

  const commentItem: CommentItem = {
    ...newCommentData,
    id: commentId,
    date: dateIso,
    helpfulCount: 0,
    isVerifiedProfessional: true
  };

  // 1. Immediately update local storage for responsive UI
  const existing = getLocalCachedComments(newCommentData.articleId);
  const updatedList = [commentItem, ...existing];
  setLocalCachedComments(newCommentData.articleId, updatedList);

  // 2. Persist to Firestore
  const commentsCol = 'comments';
  try {
    const docRef = doc(db, commentsCol, commentId);
    await setDoc(docRef, {
      articleId: newCommentData.articleId,
      userId: newCommentData.userId || null,
      authorName: newCommentData.authorName,
      authorEmail: newCommentData.authorEmail || null,
      role: newCommentData.role,
      roleLabel: newCommentData.roleLabel,
      organization: newCommentData.organization || '',
      statutoryRef: newCommentData.statutoryRef || '',
      topicTag: newCommentData.topicTag || 'Statutory Interpretation',
      commentType: newCommentData.commentType || 'insight',
      avatar: newCommentData.avatar,
      text: newCommentData.text,
      parentId: newCommentData.parentId || null,
      helpfulCount: 0,
      isVerifiedProfessional: true,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.warn('Could not save comment to Firestore (offline fallback used):', error);
    try {
      handleFirestoreError(error, OperationType.CREATE, commentsCol);
    } catch {
      // Local cache already holds the comment
    }
  }

  window.dispatchEvent(new CustomEvent('articleCommentsUpdated', { detail: { articleId: newCommentData.articleId } }));
  return commentItem;
}

/**
 * Delete a comment from local cache and Firestore
 */
export async function deleteProfessionalComment(
  articleId: string,
  commentId: string
): Promise<void> {
  // Update local cache
  const local = getLocalCachedComments(articleId);
  const filtered = local.filter(c => c.id !== commentId && c.parentId !== commentId);
  setLocalCachedComments(articleId, filtered);

  // Update in Firestore
  const commentsCol = 'comments';
  try {
    const { deleteDoc } = await import('firebase/firestore');
    const docRef = doc(db, commentsCol, commentId);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('Could not delete comment from Firestore:', error);
  }

  window.dispatchEvent(new CustomEvent('articleCommentsUpdated', { detail: { articleId } }));
}

/**
 * Endorse / Mark a professional comment as helpful
 */
export async function toggleEndorsement(
  articleId: string,
  commentId: string,
  userVoted: boolean
): Promise<number> {
  const local = getLocalCachedComments(articleId);
  const target = local.find(c => c.id === commentId);
  let newCount = target?.helpfulCount || 0;

  if (target) {
    newCount = userVoted ? Math.max(0, target.helpfulCount - 1) : target.helpfulCount + 1;
    target.helpfulCount = newCount;
    setLocalCachedComments(articleId, local);
  }

  // Update in Firestore
  const commentsCol = 'comments';
  try {
    const docRef = doc(db, commentsCol, commentId);
    await updateDoc(docRef, {
      helpfulCount: increment(userVoted ? -1 : 1)
    });
  } catch (error) {
    // Suppress for client UI speed
    console.warn('Could not sync endorsement to Firestore:', error);
  }

  window.dispatchEvent(new CustomEvent('articleCommentsUpdated', { detail: { articleId } }));
  return newCount;
}
