import { teamMembers, TeamMember } from './teamData';

export interface Expert {
  id: string;
  name: string;
  role: string;
  verificationBadge: string;
  experience: string;
  rating: number;
  reviewsCount: number;
  answersCount: number;
  articlesCount: number;
  helpfulVotes: number;
  avatar: string;
  coverImage: string;
  category: string;
  specialization: string[];
  credentials: string;
  bio: string;
  hourlyRate?: string;
  isAvailableForConsultation?: boolean;
  linkedin?: string;
  facebook?: string;
  youtube?: string;
  whatsapp?: string;
  email?: string;
  phone?: string;
}

export interface QuestionAnswer {
  id: string;
  author: {
    name: string;
    role: string;
    badge: string;
    avatar: string;
    rating: number;
  };
  content: string;
  upvotes: number;
  time: string;
  isVerifiedAnswer?: boolean;
}

export interface Question {
  id: string;
  title: string;
  content: string;
  author: {
    name: string;
    role: string;
    avatar?: string;
    isExpert?: boolean;
    badge?: string;
  };
  tags: string[];
  category: string;
  answersCount: number;
  upvotes: number;
  views: number;
  time: string;
  timestamp: number;
  lastAnsweredTime: string;
  isAnsweredByExpert: boolean;
  answers: QuestionAnswer[];
}

export interface ExpertCategory {
  id: string;
  icon: string;
  title: string;
  count: string;
  description: string;
  color: string;
  badgeBg: string;
}

export interface TrendingDiscussion {
  id: string;
  title: string;
  participantsCount: number;
  expertRepliesCount: number;
  category: string;
  tag: string;
  time: string;
}

export interface TopContributor {
  rank: number;
  name: string;
  role: string;
  badge: string;
  avatar: string;
  helpfulAnswers: number;
  reputationPoints: number;
  tierBadge: string;
  tierColor: string;
}

export const EXPERT_CATEGORIES: ExpertCategory[] = [
  {
    id: 'corporate-law',
    icon: '⚖️',
    title: 'Corporate Lawyers',
    count: '124 Experts',
    description: 'Company registration, mergers & acquisitions, and shareholder disputes',
    color: 'from-blue-600 to-indigo-700',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  {
    id: 'tax-consultants',
    icon: '📊',
    title: 'Tax Consultants',
    count: '98 Experts',
    description: 'Income Tax Act 2023, corporate tax rebates, and NBR assessments',
    color: 'from-emerald-600 to-teal-700',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  {
    id: 'vat-specialists',
    icon: '💰',
    title: 'VAT Specialists',
    count: '76 Experts',
    description: 'VAT Act 2012, withholding taxes (VDS), and customs duties',
    color: 'from-amber-600 to-orange-700',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  {
    id: 'company-registration',
    icon: '🏢',
    title: 'Company Registration',
    count: '54 Experts',
    description: 'RJSC entity filings, trade licenses, and statutory MOA/AOA setup',
    color: 'from-purple-600 to-pink-700',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  {
    id: 'foreign-investment',
    icon: '🌍',
    title: 'Foreign Investment',
    count: '43 Experts',
    description: 'BIDA approvals, dividend repatriation, and cross-border joint ventures',
    color: 'from-cyan-600 to-blue-700',
    badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200'
  }
];

const COVER_IMAGES = [
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1000&auto=format&fit=crop&q=80',
];

function getCategoryForMember(member: TeamMember): string {
  const combined = `${member.expertise} ${member.position}`.toLowerCase();
  if (combined.includes('vat')) return 'vat-specialists';
  if (combined.includes('tax') || combined.includes('acca') || combined.includes('accounting') || combined.includes('financial')) return 'tax-consultants';
  if (combined.includes('corporate law') || combined.includes('litigation') || member.name.includes('Advocate')) return 'corporate-law';
  if (combined.includes('foreign') || combined.includes('ceo') || combined.includes('strategy')) return 'foreign-investment';
  if (combined.includes('company') || combined.includes('registration') || combined.includes('advisory') || combined.includes('consultancy') || combined.includes('compliance')) return 'company-registration';
  return 'corporate-law';
}

function getVerificationBadge(member: TeamMember): string {
  const pos = member.position.toLowerCase();
  const name = member.name.toLowerCase();
  const exp = member.expertise.toLowerCase();
  if (pos.includes('founding')) return '✓ Founding Member';
  if (pos.includes('ceo')) return '✓ Chief Executive Officer';
  if (name.includes('advocate') || pos.includes('advocate')) return '✓ Supreme Court Advocate';
  if (name.includes('acca') || pos.includes('acca')) return '✓ ACCA Qualified';
  if (name.includes('phd')) return '✓ PhD Legal Scholar';
  if (pos.includes('partner')) return '✓ Firm Partner';
  if (pos.includes('senior consultant')) return '✓ Senior Consultant';
  if (exp.includes('tax') || pos.includes('tax')) return '✓ Income Tax Adviser';
  if (exp.includes('vat') || pos.includes('vat')) return '✓ VAT Consultant';
  return '✓ Verified Practitioner';
}

function getExperience(member: TeamMember, idx: number): string {
  const pos = member.position.toLowerCase();
  if (pos.includes('founding') || pos.includes('ceo')) return '15+ Years Experience';
  if (pos.includes('senior') || pos.includes('partner') || member.name.includes('Advocate') || member.name.includes('PhD')) return '12+ Years Experience';
  if (pos.includes('consultant') || member.name.includes('ACCA')) return '8+ Years Experience';
  if (pos.includes('senior executive')) return '6+ Years Experience';
  return '4+ Years Experience';
}

export const INITIAL_EXPERTS: Expert[] = teamMembers.map((member, idx) => {
  const category = getCategoryForMember(member);
  const verificationBadge = getVerificationBadge(member);
  const experience = getExperience(member, idx);
  const specs = member.expertise.split(',').map(s => s.trim()).filter(Boolean);
  
  const rating = idx === 0 ? 5.0 : idx < 6 ? 4.9 : 4.8;
  const answersCount = Math.max(25, 160 - idx * 6);
  const reviewsCount = Math.max(18, 120 - idx * 5);
  const articlesCount = Math.max(4, 28 - idx);
  const helpfulVotes = answersCount * 4 + reviewsCount * 2;

  const pos = member.position.toLowerCase();

  return {
    id: `team-exp-${idx + 1}`,
    name: member.name,
    role: member.position,
    verificationBadge,
    experience,
    rating,
    reviewsCount,
    answersCount,
    articlesCount,
    helpfulVotes,
    avatar: member.imgSrc,
    coverImage: COVER_IMAGES[idx % COVER_IMAGES.length],
    category,
    specialization: specs.length > 0 ? specs : ['Corporate Advisory', 'Regulatory Compliance'],
    credentials: `${member.position} at E-Lawyers | Specializing in ${member.expertise}`,
    bio: member.bio,
    hourlyRate: pos.includes('founding') || pos.includes('ceo') ? 'BDT 5,000 / hr' : pos.includes('partner') || pos.includes('senior') ? 'BDT 4,000 / hr' : 'BDT 3,000 / hr',
    isAvailableForConsultation: true,
    linkedin: member.linkedin,
    facebook: member.facebook,
    youtube: member.youtube,
    whatsapp: member.whatsapp,
    email: member.email,
    phone: member.phone
  };
});

export const TRENDING_DISCUSSIONS: TrendingDiscussion[] = [
  {
    id: 'trend-1',
    title: 'VAT registration rules and Mushak compliance for online/e-commerce businesses',
    participantsCount: 245,
    expertRepliesCount: 12,
    category: 'VAT & Customs',
    tag: 'E-commerce VAT',
    time: 'Active now'
  },
  {
    id: 'trend-2',
    title: 'Foreign Direct Investment (FDI) profit & dividend repatriation procedures in 2026',
    participantsCount: 182,
    expertRepliesCount: 8,
    category: 'Corporate Law',
    tag: 'FDI Repatriation',
    time: '2 hours ago'
  },
  {
    id: 'trend-3',
    title: 'Income Tax Act 2023: Resolving high unexplained expenditure and Section 163 penalties',
    participantsCount: 310,
    expertRepliesCount: 15,
    category: 'Income Tax',
    tag: 'Tax Audit & Appeals',
    time: '4 hours ago'
  }
];

export const TOP_CONTRIBUTORS_MONTH: TopContributor[] = [
  {
    rank: 1,
    name: teamMembers[0]?.name || 'Ekramul Islam Khandaker',
    role: teamMembers[0]?.position || 'Founding Member',
    badge: '✓ Founding Member',
    avatar: teamMembers[0]?.imgSrc || '',
    helpfulAnswers: 184,
    reputationPoints: 2840,
    tierBadge: '🥇 Diamond Contributor',
    tierColor: 'bg-amber-500/10 text-amber-700 border-amber-300'
  },
  {
    rank: 2,
    name: teamMembers[1]?.name || 'Advocate Anamul Haque',
    role: teamMembers[1]?.position || 'Founding Member',
    badge: '✓ Supreme Court Advocate',
    avatar: teamMembers[1]?.imgSrc || '',
    helpfulAnswers: 162,
    reputationPoints: 2420,
    tierBadge: '🥈 Platinum Expert',
    tierColor: 'bg-slate-500/10 text-slate-700 border-slate-300'
  },
  {
    rank: 3,
    name: teamMembers[2]?.name || 'Md. Abu Hanif',
    role: teamMembers[2]?.position || 'CEO',
    badge: '✓ Executive Director',
    avatar: teamMembers[2]?.imgSrc || '',
    helpfulAnswers: 139,
    reputationPoints: 1980,
    tierBadge: '🥉 Gold Partner',
    tierColor: 'bg-amber-700/10 text-amber-900 border-amber-400'
  },
  {
    rank: 4,
    name: teamMembers[4]?.name || 'Muhammad Abdul Kader ACCA',
    role: teamMembers[4]?.position || 'Senior Consultant',
    badge: '✓ ACCA Qualified',
    avatar: teamMembers[4]?.imgSrc || '',
    helpfulAnswers: 118,
    reputationPoints: 1750,
    tierBadge: '⭐ Master Practitioner',
    tierColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-300'
  }
];

export const INITIAL_QUESTIONS: Question[] = [
  {
    id: 'q-1',
    title: 'How does the new VAT Act affect e-commerce businesses in Bangladesh?',
    content: 'With the recent enforcement under the Value Added Tax and Supplementary Duty Act, 2012, is it strictly mandatory for an online marketplace selling through social media and a web storefront with annual turnover below BDT 50 Lakhs to obtain a centralized Business Identification Number (BIN)? What are the practical withholding VAT (VDS) obligations when engaging third-party courier services?',
    author: {
      name: 'Rahim Uddin',
      role: 'Business Owner & E-commerce Founder',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces'
    },
    tags: ['VAT', 'E-commerce', 'Tax Law'],
    category: 'VAT & Customs',
    answersCount: 5,
    upvotes: 24,
    views: 890,
    time: '2 hours ago',
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    lastAnsweredTime: '2 hours ago',
    isAnsweredByExpert: true,
    answers: [
      {
        id: 'ans-1',
        author: {
          name: 'Karim Chowdhury',
          role: 'VAT Specialist',
          badge: '✓ Ex-NBR Consultant',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=faces',
          rating: 5.0
        },
        content: 'Under SRO guidelines, e-commerce entities providing digital marketplace services or collecting payments online must maintain a BIN regardless of the standard turnover threshold if they charge commission or facilitate courier delivery. Furthermore, under Rule 40 of VAT Rules 2016, if you make payments to logistics courier partners, you must deduct withholding VAT at the applicable standard rate (currently 15% on courier commission, or 7.5% if specific procurement provider thresholds apply) and issue Mushak 6.6 certificates within 3 working days.',
        upvotes: 18,
        time: '1 hour ago',
        isVerifiedAnswer: true
      },
      {
        id: 'ans-2',
        author: {
          name: 'Aminul Islam',
          role: 'Corporate Lawyer',
          badge: '✓ Supreme Court Advocate',
          avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&h=120&fit=crop&crop=faces',
          rating: 4.8
        },
        content: 'Also ensure your Trade License specifies "E-commerce or IT-Enabled Services (ITES)" in the objective clause; otherwise, banks may freeze merchant gateway settlements upon NBR audits.',
        upvotes: 6,
        time: '30 mins ago'
      }
    ]
  },
  {
    id: 'q-2',
    title: 'Tax rebate on IT sector investments and startup exemption for FY 2026-27',
    content: 'Can someone clarify the maximum allowable tax rebate percentage for investments made in recognized IT sector companies this fiscal year under the new Income Tax Act, 2023? Does the investment qualify for general rebate under Sixth Schedule Part 3, and what documentation is required from BTRC or BASIS?',
    author: {
      name: 'Nusrat Jahan',
      role: 'Startup Co-Founder',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=faces'
    },
    tags: ['Income Tax', 'IT Sector', 'Tax Rebate'],
    category: 'Income Tax',
    answersCount: 3,
    upvotes: 19,
    views: 640,
    time: '5 hours ago',
    timestamp: Date.now() - 5 * 60 * 60 * 1000,
    lastAnsweredTime: '3 hours ago',
    isAnsweredByExpert: true,
    answers: [
      {
        id: 'ans-3',
        author: {
          name: 'Sadia Rahman',
          role: 'Tax Consultant',
          badge: '✓ FCA Certified',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&crop=faces',
          rating: 4.9
        },
        content: 'Under Sixth Schedule (Part 3) of the Income Tax Act 2023, eligible investments in tech companies or venture capital funds are assessed at 15% of the total eligible investment or 3% of taxable income, whichever is lower. The company must hold valid BASIS membership and satisfy the software product IP declaration certificate.',
        upvotes: 14,
        time: '3 hours ago',
        isVerifiedAnswer: true
      }
    ]
  },
  {
    id: 'q-3',
    title: 'Process and central bank approvals for repatriating dividends for foreign investors in Bangladesh',
    content: 'What are the latest Bangladesh Bank Foreign Exchange guidelines and required BIDA clearances for a 100% foreign-owned limited liability subsidiary to repatriate net post-tax dividends to its parent entity in Singapore?',
    author: {
      name: 'Marcus Vance',
      role: 'Managing Director, Asia Ventures',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=faces'
    },
    tags: ['Corporate Law', 'FDI', 'Bangladesh Bank'],
    category: 'Foreign Investment',
    answersCount: 8,
    upvotes: 38,
    views: 1210,
    time: '1 day ago',
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
    lastAnsweredTime: '6 hours ago',
    isAnsweredByExpert: true,
    answers: [
      {
        id: 'ans-4',
        author: {
          name: 'Aminul Islam',
          role: 'Corporate Lawyer',
          badge: '✓ Supreme Court Advocate',
          avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&h=120&fit=crop&crop=faces',
          rating: 4.8
        },
        content: 'Under the Guidelines for Foreign Exchange Transactions (GFET), Authorized Dealer (AD) banks can remit dividends without prior approval of Bangladesh Bank, provided: 1) Audited financial statements by an ICAB-certified firm are submitted; 2) Proof of advance tax payment on dividend (e.g. 20% or lower treaty rate like Bangladesh-Singapore DTAA at 15%) is attached; 3) RJSC Form XII and Annual Return are up to date; and 4) BIDA registration certificate is valid.',
        upvotes: 29,
        time: '18 hours ago',
        isVerifiedAnswer: true
      }
    ]
  },
  {
    id: 'q-4',
    title: 'Sole Proprietorship vs Private Limited: When to convert for tax & legal optimization?',
    content: 'I have been running an export consulting business as a Sole Proprietorship for 3 years. Now our annual turnover crossed BDT 1.2 Crore. At what point does it make legal and tax sense to convert to a Private Limited Company under Companies Act 1994?',
    author: {
      name: 'Shahriar Kabir',
      role: 'Export Consultant',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&h=120&fit=crop&crop=faces'
    },
    tags: ['Company Registration', 'Corporate Law', 'RJSC'],
    category: 'Company Registration',
    answersCount: 4,
    upvotes: 17,
    views: 530,
    time: '2 days ago',
    timestamp: Date.now() - 48 * 60 * 60 * 1000,
    lastAnsweredTime: '1 day ago',
    isAnsweredByExpert: true,
    answers: []
  },
  {
    id: 'q-5',
    title: 'NBR Audit notices under Section 182: How to formally submit reconciliation?',
    content: 'We received an initial notice requiring explanation of disparity between bank book deposits and Mushak 9.1 sales figures. What is the statutory time limit to reply and can extension be obtained under Section 183?',
    author: {
      name: 'Farhan Mehmood',
      role: 'Chief Financial Officer',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&h=120&fit=crop&crop=faces'
    },
    tags: ['Income Tax', 'Tax Audit', 'NBR'],
    category: 'Income Tax',
    answersCount: 0,
    upvotes: 9,
    views: 310,
    time: '3 hours ago',
    timestamp: Date.now() - 3 * 60 * 60 * 1000,
    lastAnsweredTime: 'Unanswered',
    isAnsweredByExpert: false,
    answers: []
  }
];
