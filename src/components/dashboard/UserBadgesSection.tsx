import React, { useState, useEffect, useMemo } from 'react';
import { 
  Award, 
  Flame, 
  ShieldCheck, 
  Star, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  Trophy, 
  Crown, 
  Zap, 
  BookMarked, 
  Calculator, 
  Building2, 
  FileText, 
  Share2, 
  Check, 
  X, 
  ChevronRight, 
  TrendingUp,
  BookOpen,
  CheckSquare,
  RotateCcw,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useBookmarks } from '../../contexts/BookmarkContext';
import { usePurchases } from '../../contexts/PurchaseContext';
import { AchievementCelebrationModal } from './AchievementCelebrationModal';
import { 
  getStreakFreezeData, 
  activateStreakFreeze, 
  earnFreezeToken, 
  StreakFreezeData 
} from '../../services/streakFreezeService';
import { StreakFreezeModal } from './StreakFreezeModal';

export interface KnowledgeLesson {
  id: string;
  title: string;
  statuteRef: string;
  keyTakeaway: string;
}

export interface KnowledgeModule {
  id: string;
  badgeId: string;
  badgeAwardTitle: string;
  badgeIconName: 'Calculator' | 'ShieldCheck' | 'Building2' | 'BookOpen';
  title: string;
  bengaliTitle: string;
  category: string;
  estimatedMinutes: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  lessons: KnowledgeLesson[];
}

export interface UserAchievementBadge {
  id: string;
  title: string;
  bengaliTitle: string;
  description: string;
  iconName: 'Calculator' | 'ShieldCheck' | 'Building2' | 'BookOpen' | 'Flame' | 'Crown' | 'Trophy' | 'Zap' | 'BookMarked' | 'Star';
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
  category: 'Knowledge Modules' | 'Streak Milestones' | 'Practical Tools';
  currentValue: number;
  targetValue: number;
  unlocked: boolean;
  unlockedAt?: string;
  rewardNote: string;
  xpPoints: number;
  criteriaText: string;
  linkedModuleId?: string;
  streakDaysTarget?: number;
}

const STORAGE_KEY_STREAK = 'accounticca_daily_streak_v1';
const STORAGE_KEY_MODULES_PROGRESS = 'accounticca_completed_modules_v1';
const STORAGE_KEY_BADGES_UNLOCKED = 'accounticca_unlocked_badges_v1';

export const KNOWLEDGE_MODULES: KnowledgeModule[] = [
  {
    id: 'module-tax-expert',
    badgeId: 'tax-expert',
    badgeAwardTitle: 'Tax Expert',
    badgeIconName: 'Calculator',
    title: 'Income Tax Act 2023 & Assessment Mastery',
    bengaliTitle: 'আয়কর আইন ও কর নির্ধারণ বিশেষজ্ঞ',
    category: 'Income Tax',
    estimatedMinutes: 25,
    level: 'Advanced',
    description: 'Master individual income tax slabs, Section 78 investment rebates, and mandatory Proof of Submission of Return (PSR) compliance under Income Tax Act 2023.',
    lessons: [
      {
        id: 'tax-les-1',
        title: 'Section 78 Investment Tax Rebate & Ceiling Calculations',
        statuteRef: 'Income Tax Act 2023, Section 78 & Schedule 3',
        keyTakeaway: 'Rebate is computed on eligible investments (max 3% of total income or 15% of actual investment or BDT 10 Lakh, whichever is lower).'
      },
      {
        id: 'tax-les-2',
        title: 'Individual & Corporate Tax Rate Slabs for FY 2026-27',
        statuteRef: 'Finance Act 2026 & SRO Circular No. 182-AIN',
        keyTakeaway: 'General threshold is BDT 350,000 for men and BDT 400,000 for women/senior citizens, with progressive tax slabs up to 30%.'
      },
      {
        id: 'tax-les-3',
        title: 'Section 265 Mandatory Proof of Submission of Return (PSR)',
        statuteRef: 'Income Tax Act 2023, Section 264 & 265',
        keyTakeaway: 'PSR is obligatory across 43+ civic services including bank loans > BDT 5 Lakh, trade license renewal, and company directorships.'
      }
    ]
  },
  {
    id: 'module-vat-pro',
    badgeId: 'vat-pro',
    badgeAwardTitle: 'VAT Pro',
    badgeIconName: 'ShieldCheck',
    title: 'VAT Act 2012, VDS & Mushak 9.1 Compliance',
    bengaliTitle: 'মূল্য সংযোজন কর ও উৎস কর্তন বিশারদ',
    category: 'VAT & Customs',
    estimatedMinutes: 20,
    level: 'Intermediate',
    description: 'Comprehensive walkthrough of Mushak 9.1 monthly filings, withholding VAT (VDS) deduction rates, and input tax credit reconciliations.',
    lessons: [
      {
        id: 'vat-les-1',
        title: 'Monthly VAT Return (Mushak 9.1) Preparation & Deadlines',
        statuteRef: 'Value Added Tax and Supplementary Duty Act 2012, Section 64',
        keyTakeaway: 'Mushak 9.1 return must be submitted by the 15th day of the following calendar month to avoid statutory non-filing penalties.'
      },
      {
        id: 'vat-les-2',
        title: 'VDS Withholding Rates & Mandatory Deduction Scenarios',
        statuteRef: 'VDS Statutory Regulatory Order (SRO) 2026-27',
        keyTakeaway: 'Specified procuring entities must withhold VAT at prescribed rates (e.g. 5% to 15%) and deposit via treasury chalan within 7 days.'
      },
      {
        id: 'vat-les-3',
        title: 'Mushak 6.3 Tax Invoice Validation & Input Tax Rebate',
        statuteRef: 'VAT Rules 2016, Rule 40',
        keyTakeaway: 'Input tax credit is allowable only against authentic computerized or registered Mushak 6.3 tax invoices received within 4 tax periods.'
      }
    ]
  },
  {
    id: 'module-corporate-counsel',
    badgeId: 'corporate-counsel',
    badgeAwardTitle: 'Corporate Counsel',
    badgeIconName: 'Building2',
    title: 'RJSC Company Law, MoA & Secretarial Governance',
    bengaliTitle: 'যৌথমূলধন কোম্পানি আইন ও করপোরেট প্রশাসন',
    category: 'Corporate Governance',
    estimatedMinutes: 30,
    level: 'Advanced',
    description: 'Step-by-step corporate compliance for Private Limited company incorporation, Schedule X director changes, and annual Form IX filings.',
    lessons: [
      {
        id: 'corp-les-1',
        title: 'RJSC Incorporation, Name Clearance & Digital Signatures',
        statuteRef: 'Companies Act 1994, Sections 5-11',
        keyTakeaway: 'Name clearance certificate is valid for 30 days. MoA objects clause determines required regulatory permissions and authorized capital fees.'
      },
      {
        id: 'corp-les-2',
        title: 'MoA & AoA Drafting: Share Classes & Statutory Clauses',
        statuteRef: 'Companies Act 1994, Table A & First Schedule',
        keyTakeaway: 'Articles of Association regulate board quorum, share transfers, pre-emptive rights, and managing director powers.'
      },
      {
        id: 'corp-les-3',
        title: 'Annual Return Filing (Form IX, Schedule X & AGM Protocol)',
        statuteRef: 'Companies Act 1994, Sections 36 & 81',
        keyTakeaway: 'Every company must hold an AGM within 9 months of financial year-end and file Form IX within 21 days of the meeting.'
      }
    ]
  },
  {
    id: 'module-audit-dvc',
    badgeId: 'audit-dvc',
    badgeAwardTitle: 'Audit & DVC Authority',
    badgeIconName: 'BookOpen',
    title: 'Audited Financials, DVC Verification & NBR Synchronization',
    bengaliTitle: 'অডিট নিরীক্ষা ও ডকুমেন্ট ভেরিফিকেশন কোড',
    category: 'Audit & Accounts',
    estimatedMinutes: 15,
    level: 'Intermediate',
    description: 'Understand ICAB Document Verification Code (DVC) validation, statutory audit disclosures, and automated tax return verification.',
    lessons: [
      {
        id: 'audit-les-1',
        title: 'ICAB Document Verification Code (DVC) Authentication',
        statuteRef: 'ICAB Bye-Laws & NBR Order on Statutory Audit',
        keyTakeaway: 'All corporate tax returns must attach audited financial statements with a valid 18-digit DVC generated by a licensed Chartered Accountant.'
      },
      {
        id: 'audit-les-2',
        title: 'Statutory Disclosures: Depreciation, WPPF & Related Parties',
        statuteRef: 'Income Tax Act 2023, Section 70 & BFRS/IFRS',
        keyTakeaway: 'Third-schedule tax depreciation schedules and 5% Workers Profit Participation Fund (WPPF) allocations must be explicitly disclosed.'
      }
    ]
  }
];

export const UserBadgesSection: React.FC = () => {
  const { savedItems } = useBookmarks();
  const { purchasedProductIds } = usePurchases();
  const [copiedBadgeId, setCopiedBadgeId] = useState<string | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<UserAchievementBadge | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'unlocked' | 'modules' | 'streak'>('all');
  const [activeSection, setActiveSection] = useState<'badges' | 'modules'>('badges');
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState<UserAchievementBadge | null>(null);

  // Streak Freeze Protection state
  const [freezeData, setFreezeData] = useState<StreakFreezeData>(() => getStreakFreezeData());
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [freezeToastMessage, setFreezeToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleFreezeUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<StreakFreezeData>;
      if (customEvent.detail) {
        setFreezeData(customEvent.detail);
      } else {
        setFreezeData(getStreakFreezeData());
      }
    };
    window.addEventListener('accounticca_freeze_updated', handleFreezeUpdate);
    return () => window.removeEventListener('accounticca_freeze_updated', handleFreezeUpdate);
  }, []);

  const handleQuickActivateFreeze = () => {
    const res = activateStreakFreeze();
    setFreezeData(res.data);
    setFreezeToastMessage(res.message);
    setTimeout(() => {
      setFreezeToastMessage(null);
    }, 5000);
  };

  // Active streak state from localStorage
  const [streakDays, setStreakDays] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STREAK);
      if (saved) return parseInt(saved, 10);
    } catch {}
    return 5;
  });

  // Track completed lessons for each module: { [moduleId]: lessonId[] }
  const [completedLessonsMap, setCompletedLessonsMap] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MODULES_PROGRESS);
      if (saved) return JSON.parse(saved);
    } catch {}
    // Seed Tax Expert lesson 1 and 2 by default so user has progress to see
    return {
      'module-tax-expert': ['tax-les-1', 'tax-les-2'],
      'module-vat-pro': ['vat-les-1']
    };
  });

  // Save module progress to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MODULES_PROGRESS, JSON.stringify(completedLessonsMap));
    } catch (e) {
      console.error('Failed to save module progress', e);
    }
  }, [completedLessonsMap]);

  // Toggle lesson completion
  const handleToggleLesson = (moduleId: string, lessonId: string) => {
    setCompletedLessonsMap(prev => {
      const currentList = prev[moduleId] || [];
      const updated = currentList.includes(lessonId)
        ? currentList.filter(id => id !== lessonId)
        : [...currentList, lessonId];
      
      const newMap = { ...prev, [moduleId]: updated };
      
      // Check if this module just became fully completed
      const targetModule = KNOWLEDGE_MODULES.find(m => m.id === moduleId);
      if (targetModule && updated.length === targetModule.lessons.length && !currentList.includes(lessonId)) {
        // Award Streak Freeze Token for completing module!
        const freezeRes = earnFreezeToken(1, `Module Reward: Completed ${targetModule.title}`);
        setFreezeData(freezeRes.data);

        // Find corresponding badge to celebrate
        const earnedBadge = allBadges.find(b => b.linkedModuleId === moduleId);
        if (earnedBadge) {
          setNewlyUnlockedBadge(earnedBadge);
        }
      }

      return newMap;
    });
  };

  // Streak testing helper for user testing
  const handleSimulateStreak = (days: number) => {
    setStreakDays(days);
    try {
      localStorage.setItem(STORAGE_KEY_STREAK, days.toString());
    } catch {}
  };

  // All Achievement Badges definition
  const allBadges: UserAchievementBadge[] = useMemo(() => {
    const isTaxModuleDone = (completedLessonsMap['module-tax-expert'] || []).length >= 3;
    const isVatModuleDone = (completedLessonsMap['module-vat-pro'] || []).length >= 3;
    const isCorpModuleDone = (completedLessonsMap['module-corporate-counsel'] || []).length >= 3;
    const isAuditModuleDone = (completedLessonsMap['module-audit-dvc'] || []).length >= 2;

    return [
      // KNOWLEDGE MODULE BADGES
      {
        id: 'tax-expert',
        title: 'Tax Expert',
        bengaliTitle: 'আয়কর বিশেষজ্ঞ',
        description: 'Complete the Income Tax Act 2023 & Assessment Framework knowledge module.',
        iconName: 'Calculator',
        tier: 'Gold',
        category: 'Knowledge Modules',
        currentValue: (completedLessonsMap['module-tax-expert'] || []).length,
        targetValue: 3,
        unlocked: isTaxModuleDone,
        unlockedAt: isTaxModuleDone ? 'Oct 18, 2026' : undefined,
        rewardNote: 'Certified Income Tax Assessment Knowledge Badge',
        xpPoints: 850,
        criteriaText: 'Complete all 3 lessons in Income Tax Assessment Module',
        linkedModuleId: 'module-tax-expert'
      },
      {
        id: 'vat-pro',
        title: 'VAT Pro',
        bengaliTitle: 'মূসক প্রফেশনাল',
        description: 'Complete the VAT Act 2012, VDS Withholding & Mushak 9.1 Return module.',
        iconName: 'ShieldCheck',
        tier: 'Gold',
        category: 'Knowledge Modules',
        currentValue: (completedLessonsMap['module-vat-pro'] || []).length,
        targetValue: 3,
        unlocked: isVatModuleDone,
        unlockedAt: isVatModuleDone ? 'Oct 18, 2026' : undefined,
        rewardNote: 'Verified VAT & VDS Compliance Specialist Badge',
        xpPoints: 800,
        criteriaText: 'Complete all 3 lessons in VAT & VDS Compliance Module',
        linkedModuleId: 'module-vat-pro'
      },
      {
        id: 'corporate-counsel',
        title: 'Corporate Counsel',
        bengaliTitle: 'করপোরেট কাউন্সিল',
        description: 'Complete the RJSC Company Law, MoA Drafting & Secretarial module.',
        iconName: 'Building2',
        tier: 'Diamond',
        category: 'Knowledge Modules',
        currentValue: (completedLessonsMap['module-corporate-counsel'] || []).length,
        targetValue: 3,
        unlocked: isCorpModuleDone,
        unlockedAt: isCorpModuleDone ? 'Oct 18, 2026' : undefined,
        rewardNote: 'Master Corporate Secretarial Compliance Badge',
        xpPoints: 950,
        criteriaText: 'Complete all 3 lessons in RJSC Corporate Governance Module',
        linkedModuleId: 'module-corporate-counsel'
      },
      {
        id: 'audit-dvc',
        title: 'Audit & DVC Authority',
        bengaliTitle: 'অডিট ও ডিভিসি বিশারদ',
        description: 'Complete the Audited Financials, DVC Verification & NBR Sync module.',
        iconName: 'BookOpen',
        tier: 'Silver',
        category: 'Knowledge Modules',
        currentValue: (completedLessonsMap['module-audit-dvc'] || []).length,
        targetValue: 2,
        unlocked: isAuditModuleDone,
        unlockedAt: isAuditModuleDone ? 'Oct 18, 2026' : undefined,
        rewardNote: 'Chartered Financial Document Verification Badge',
        xpPoints: 600,
        criteriaText: 'Complete all 2 lessons in Audited Financials & DVC Module',
        linkedModuleId: 'module-audit-dvc'
      },

      // STREAK MILESTONE BADGES
      {
        id: 'active-learner-3d',
        title: 'Active Learner (3 Days)',
        bengaliTitle: '৩ দিনের প্রাথমিক অভ্যাস',
        description: 'Maintain a 3-day active consecutive compliance learning streak.',
        iconName: 'Zap',
        tier: 'Bronze',
        category: 'Streak Milestones',
        currentValue: Math.min(streakDays, 3),
        targetValue: 3,
        unlocked: streakDays >= 3,
        unlockedAt: streakDays >= 3 ? 'Oct 12, 2026' : undefined,
        rewardNote: '+150 XP & Free NBR Statutory Form Guide PDF',
        xpPoints: 150,
        criteriaText: 'Reach a 3-day consecutive study streak',
        streakDaysTarget: 3
      },
      {
        id: 'consistency-king-7d',
        title: '7-Day Streak Scholar',
        bengaliTitle: '৭ দিনের একনিষ্ঠ অর্জন',
        description: 'Achieve a full 7-day consecutive streak in daily compliance study.',
        iconName: 'Flame',
        tier: 'Silver',
        category: 'Streak Milestones',
        currentValue: Math.min(streakDays, 7),
        targetValue: 7,
        unlocked: streakDays >= 7,
        unlockedAt: streakDays >= 7 ? 'Oct 16, 2026' : undefined,
        rewardNote: 'Master Compliance Rank & 10% Tool Discount Voucher',
        xpPoints: 500,
        criteriaText: 'Reach a 7-day consecutive study streak',
        streakDaysTarget: 7
      },
      {
        id: 'month-titan-30d',
        title: '30-Day Compliance Titan',
        bengaliTitle: '৩০ দিনের গৌরবময় মাইলফলক',
        description: 'Reach a 30-day streak of daily statutory reading and calculation practices.',
        iconName: 'Crown',
        tier: 'Gold',
        category: 'Streak Milestones',
        currentValue: Math.min(streakDays, 30),
        targetValue: 30,
        unlocked: streakDays >= 30,
        unlockedAt: streakDays >= 30 ? 'Oct 18, 2026' : undefined,
        rewardNote: 'Free RJSC Annual Filing Automation Kit & VIP Distinction',
        xpPoints: 2500,
        criteriaText: 'Reach a 30-day consecutive study streak',
        streakDaysTarget: 30
      },
      {
        id: 'grandmaster-90d',
        title: '90-Day Grandmaster',
        bengaliTitle: '৯০ দিনের গ্র্যান্ডমাস্টার',
        description: 'Complete 90 consecutive days of statutory learning. The highest echelon of legal compliance.',
        iconName: 'Trophy',
        tier: 'Diamond',
        category: 'Streak Milestones',
        currentValue: Math.min(streakDays, 90),
        targetValue: 90,
        unlocked: streakDays >= 90,
        rewardNote: 'Lifetime Hall of Fame Induction & Direct Partner Advisory Access',
        xpPoints: 10000,
        criteriaText: 'Reach a 90-day consecutive study streak',
        streakDaysTarget: 90
      },

      // PRACTICAL TOOLS & LIBRARY BADGES
      {
        id: 'master-collector',
        title: 'Master Library Collector',
        bengaliTitle: 'নথি ও আইন সংগ্রাহক',
        description: 'Save 5+ statutory guides and NBR circulars to your personal reading library.',
        iconName: 'BookMarked',
        tier: 'Bronze',
        category: 'Practical Tools',
        currentValue: savedItems.length,
        targetValue: 5,
        unlocked: savedItems.length >= 5,
        unlockedAt: savedItems.length >= 5 ? 'Oct 14, 2026' : undefined,
        rewardNote: 'Permanent Cloud Bookmark Synchronization Access',
        xpPoints: 300,
        criteriaText: 'Save 5 or more articles/guides to your dashboard'
      },
      {
        id: 'pro-tool-owner',
        title: 'Pro Tool Owner',
        bengaliTitle: 'টুল ব্যবহারকারী',
        description: 'Unlock and utilize 1+ professional calculators or compliance templates.',
        iconName: 'Star',
        tier: 'Silver',
        category: 'Practical Tools',
        currentValue: purchasedProductIds.length,
        targetValue: 1,
        unlocked: purchasedProductIds.length >= 1,
        unlockedAt: purchasedProductIds.length >= 1 ? 'Oct 10, 2026' : undefined,
        rewardNote: 'Permanent Interactive Tool License Holder',
        xpPoints: 400,
        criteriaText: 'Own or unlock 1 or more professional tools'
      }
    ];
  }, [completedLessonsMap, streakDays, savedItems.length, purchasedProductIds.length]);

  const unlockedBadges = useMemo(() => allBadges.filter(b => b.unlocked), [allBadges]);
  const totalXP = useMemo(() => unlockedBadges.reduce((sum, b) => sum + b.xpPoints, 0), [unlockedBadges]);
  const completionPercentage = Math.round((unlockedBadges.length / allBadges.length) * 100);

  const filteredBadges = useMemo(() => {
    if (filterTab === 'unlocked') return allBadges.filter(b => b.unlocked);
    if (filterTab === 'modules') return allBadges.filter(b => b.category === 'Knowledge Modules');
    if (filterTab === 'streak') return allBadges.filter(b => b.category === 'Streak Milestones');
    return allBadges;
  }, [allBadges, filterTab]);

  const handleShareBadge = (badge: UserAchievementBadge, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `🏆 I earned the '${badge.title}' (${badge.bengaliTitle}) Badge on Accounticca & E-Lawyers Compliance Hub! Earned ${badge.xpPoints} XP.`;
    navigator.clipboard.writeText(text);
    setCopiedBadgeId(badge.id);
    setTimeout(() => setCopiedBadgeId(null), 2500);
  };

  const getBadgeIconComponent = (iconName: UserAchievementBadge['iconName']) => {
    switch (iconName) {
      case 'Calculator':
        return Calculator;
      case 'ShieldCheck':
        return ShieldCheck;
      case 'Building2':
        return Building2;
      case 'BookOpen':
        return BookOpen;
      case 'Flame':
        return Flame;
      case 'Crown':
        return Crown;
      case 'Trophy':
        return Trophy;
      case 'Zap':
        return Zap;
      case 'BookMarked':
        return BookMarked;
      case 'Star':
      default:
        return Star;
    }
  };

  return (
    <div id="user-achievements-system-card" className="hidden bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-8">
      {/* Newly Unlocked Celebration Toast Modal */}
      {newlyUnlockedBadge && (
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-emerald-600 text-white rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in border border-amber-300">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 text-white">
              <Trophy className="w-8 h-8 text-amber-200 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-black/30 text-amber-200 px-2.5 py-0.5 rounded-full">
                  Achievement Unlocked!
                </span>
                <span className="text-xs font-bold text-amber-100">+{newlyUnlockedBadge.xpPoints} XP Awarded</span>
              </div>
              <h4 className="text-lg font-black text-white mt-0.5 flex items-center gap-2">
                <span>{newlyUnlockedBadge.title} Badge</span>
                <span className="text-xs font-semibold text-amber-200">({newlyUnlockedBadge.bengaliTitle})</span>
              </h4>
              <p className="text-xs text-amber-100">
                {newlyUnlockedBadge.rewardNote}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setSelectedBadge(newlyUnlockedBadge);
                setNewlyUnlockedBadge(null);
              }}
              className="px-4 py-2 bg-white text-slate-950 font-black text-xs rounded-xl shadow-xs hover:bg-amber-100 transition-colors cursor-pointer"
            >
              View Badge
            </button>
            <button
              onClick={() => setNewlyUnlockedBadge(null)}
              className="p-2 text-white/80 hover:text-white rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shrink-0">
            <Trophy className="w-7 h-7 text-amber-100" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-2xl font-black text-slate-900">User Achievement & Badges System</h2>
              <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-950 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full shadow-2xs">
                <Crown className="w-3.5 h-3.5 text-amber-700" />
                <span>{unlockedBadges.length} of {allBadges.length} Badges Earned ({completionPercentage}%)</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Earn certified badges (e.g., <strong className="text-slate-700">Tax Expert</strong>, <strong className="text-slate-700">VAT Pro</strong>, <strong className="text-slate-700">Corporate Counsel</strong>) by completing knowledge modules and maintaining daily streaks.
            </p>
          </div>
        </div>

        {/* Header Summary Stats & Milestone Triggers */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-2 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xs">
              XP
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Score</p>
              <p className="text-base font-black text-slate-900">{totalXP.toLocaleString()} XP</p>
            </div>
          </div>

          {/* Streak Freeze Status Button */}
          <button
            id="open-streak-freeze-vault-btn"
            onClick={() => setShowFreezeModal(true)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer shadow-2xs ${
              freezeData.isFreezeActiveForToday
                ? 'bg-cyan-50 border-cyan-300 text-cyan-900 hover:bg-cyan-100'
                : 'bg-slate-50 hover:bg-cyan-50/60 border-slate-200/90 text-slate-800'
            }`}
            title="Open Streak Freeze Vault - Protect streak status with tokens"
          >
            <span className="text-base">❄️</span>
            <div className="text-left leading-none">
              <div className="flex items-center gap-1.5">
                <span>{freezeData.tokensAvailable} Token{freezeData.tokensAvailable !== 1 ? 's' : ''}</span>
                {freezeData.isFreezeActiveForToday ? (
                  <span className="bg-cyan-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">Protected</span>
                ) : (
                  <span className="bg-slate-200 text-slate-600 text-[9px] px-1.5 py-0.2 rounded-full font-bold">Vault</span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-semibold mt-0.5 inline-block">Streak Freeze</span>
            </div>
          </button>

          <button
            onClick={() => setShowCelebrationModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-xs transition-colors cursor-pointer"
            title="Open Streak Milestone Celebration Modal"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>Celebrate Milestones</span>
          </button>
        </div>
      </div>

      {/* Streak Freeze Alert Toast Feedback */}
      {freezeToastMessage && (
        <div className="bg-cyan-50 border-2 border-cyan-300 rounded-2xl p-4 flex items-center justify-between text-xs font-bold text-cyan-950 animate-fade-in shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🛡️</span>
            <span>{freezeToastMessage}</span>
          </div>
          <button 
            onClick={() => setFreezeToastMessage(null)}
            className="text-cyan-800 hover:text-cyan-950 font-black text-xs px-2 py-1 rounded-lg bg-cyan-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Dedicated Streak Freeze Feature Card */}
      <div id="streak-freeze-protection-card" className="rounded-3xl border-2 border-cyan-200 bg-gradient-to-br from-cyan-50/90 via-white to-blue-50/50 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-white border border-cyan-200 text-cyan-600 flex items-center justify-center shadow-xs shrink-0 text-2xl">
              ❄️
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black text-slate-900">Streak Freeze Protection System</h3>
                {freezeData.isFreezeActiveForToday ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-white bg-cyan-600 px-2.5 py-0.5 rounded-full shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Protected for Today ({streakDays}d Streak Safe)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                    <span>Unshielded Today</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                Earn freeze tokens by completing knowledge modules and hitting streak milestones. Spend 1 token to protect your daily streak status for one day if you miss your study goals.
              </p>
            </div>
          </div>

          {/* Quick Actions & Token Balance */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <div className="bg-white border border-cyan-200 rounded-2xl px-4 py-2 flex items-center gap-2.5 shadow-2xs">
              <span className="text-xl">❄️</span>
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inventory</p>
                <p className="text-base font-black text-cyan-900">{freezeData.tokensAvailable} Token{freezeData.tokensAvailable !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {freezeData.isFreezeActiveForToday ? (
              <div className="px-3.5 py-2.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-2xs">
                <Check className="w-4 h-4 text-emerald-700" />
                <span>Streak Safe for Today</span>
              </div>
            ) : (
              <button
                id="equip-freeze-btn"
                onClick={handleQuickActivateFreeze}
                disabled={freezeData.tokensAvailable < 1}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Spend 1 token to protect your streak today"
              >
                <ShieldCheck className="w-4 h-4 text-cyan-200" />
                <span>Equip Freeze (1 Token)</span>
              </button>
            )}

            <button
              onClick={() => setShowFreezeModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
            >
              <span>Vault & History</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Mode Toggle: Badges Showcase vs Knowledge Modules */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => setActiveSection('badges')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeSection === 'badges'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4 text-amber-600" />
            <span>All Badges ({allBadges.length})</span>
          </button>

          <button
            onClick={() => setActiveSection('modules')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeSection === 'modules'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>Knowledge Modules ({KNOWLEDGE_MODULES.length})</span>
          </button>
        </div>

        {/* Filter Pills for Badges View */}
        {activeSection === 'badges' && (
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600 flex-wrap">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              All ({allBadges.length})
            </button>
            <button
              onClick={() => setFilterTab('unlocked')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterTab === 'unlocked' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Unlocked ({unlockedBadges.length})
            </button>
            <button
              onClick={() => setFilterTab('modules')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterTab === 'modules' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Module Badges (4)
            </button>
            <button
              onClick={() => setFilterTab('streak')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filterTab === 'streak' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Streak Badges (4)
            </button>
          </div>
        )}

        {/* Interactive Streak Milestone Testing Buttons */}
        {activeSection === 'modules' && (
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span>Simulate Streak:</span>
            <button
              onClick={() => handleSimulateStreak(streakDays + 1)}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700"
              title="Add 1 streak day"
            >
              +1 Day ({streakDays}d)
            </button>
            <button
              onClick={() => handleSimulateStreak(7)}
              className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 rounded-lg text-amber-900"
              title="Jump to 7-day milestone"
            >
              Hit 7d
            </button>
            <button
              onClick={() => handleSimulateStreak(30)}
              className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 rounded-lg text-emerald-900"
              title="Jump to 30-day milestone"
            >
              Hit 30d
            </button>
          </div>
        )}
      </div>

      {/* SECTION 1: BADGES GRID */}
      {activeSection === 'badges' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredBadges.map((badge) => {
            const Icon = getBadgeIconComponent(badge.iconName);
            const percent = Math.min(100, Math.round((badge.currentValue / badge.targetValue) * 100));

            return (
              <div
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className={`relative p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 group overflow-hidden ${
                  badge.unlocked
                    ? 'bg-gradient-to-br from-amber-50/70 via-white to-emerald-50/50 border-amber-300 shadow-xs hover:shadow-md hover:border-amber-400'
                    : 'bg-slate-50/70 border-slate-200/80 hover:border-slate-300 text-slate-400'
                }`}
              >
                {/* Glow accent */}
                {badge.unlocked && (
                  <div className="absolute -right-10 -top-10 w-28 h-28 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />
                )}

                <div className="space-y-3 relative z-10">
                  {/* Top Badge Icon & Tier */}
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs ${
                      badge.unlocked 
                        ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white' 
                        : 'bg-slate-200 text-slate-400'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>

                    <div className="flex items-center gap-1">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        badge.tier === 'Diamond' 
                          ? 'bg-cyan-100 text-cyan-900 border border-cyan-200' 
                          : badge.tier === 'Gold'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : badge.tier === 'Silver'
                          ? 'bg-slate-200 text-slate-800'
                          : 'bg-orange-100 text-orange-900'
                      }`}>
                        {badge.tier}
                      </span>

                      {badge.unlocked ? (
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center">
                          <Lock className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Bengali Translation */}
                  <div>
                    <h4 className={`text-base font-black leading-snug ${
                      badge.unlocked ? 'text-slate-900 group-hover:text-amber-900' : 'text-slate-600'
                    }`}>
                      {badge.title}
                    </h4>
                    <p className="text-xs font-bold text-emerald-700 mt-0.5">
                      {badge.bengaliTitle}
                    </p>
                  </div>

                  {/* Description & Criteria */}
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {badge.description}
                  </p>
                </div>

                {/* Progress & Reward Footer */}
                <div className="space-y-2 pt-3 border-t border-slate-100 relative z-10">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-500 uppercase tracking-wider text-[10px]">Progress</span>
                    <span className={badge.unlocked ? 'text-emerald-700 font-extrabold' : 'text-slate-600'}>
                      {badge.currentValue}/{badge.targetValue} ({percent}%)
                    </span>
                  </div>

                  <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        badge.unlocked ? 'bg-gradient-to-r from-amber-500 to-emerald-500' : 'bg-slate-400'
                      }`} 
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span className="font-bold text-amber-700">+{badge.xpPoints} XP</span>

                    {badge.unlocked ? (
                      <button
                        onClick={(e) => handleShareBadge(badge, e)}
                        className="text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1 cursor-pointer"
                        title="Share achievement"
                      >
                        {copiedBadgeId === badge.id ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Copied
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5">
                            <Share2 className="w-3 h-3" /> Share
                          </span>
                        )}
                      </button>
                    ) : (
                      badge.linkedModuleId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSection('modules');
                          }}
                          className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-0.5"
                        >
                          <span>Complete Module</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SECTION 2: KNOWLEDGE MODULES */}
      {activeSection === 'modules' && (
        <div className="space-y-6">
          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <p className="font-extrabold text-emerald-950 text-sm">Interactive Knowledge Modules</p>
                <p className="text-emerald-700">
                  Read and check off the statutory learning checkpoints below. Completing all lessons in a module automatically awards you the designated Certified Badge!
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {KNOWLEDGE_MODULES.map((module) => {
              const completedList = completedLessonsMap[module.id] || [];
              const isFullyDone = completedList.length === module.lessons.length;
              const percent = Math.round((completedList.length / module.lessons.length) * 100);
              const BadgeIcon = getBadgeIconComponent(module.badgeIconName);

              return (
                <div 
                  key={module.id} 
                  className={`bg-white rounded-3xl border p-6 space-y-5 transition-all flex flex-col justify-between ${
                    isFullyDone 
                      ? 'border-emerald-300 shadow-xs bg-gradient-to-br from-emerald-50/40 via-white to-amber-50/30' 
                      : 'border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Module Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {module.category}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            ~{module.estimatedMinutes} mins
                          </span>
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                            {module.level}
                          </span>
                        </div>

                        <h3 className="text-lg font-black text-slate-900 leading-snug">
                          {module.title}
                        </h3>
                        <p className="text-xs font-bold text-emerald-700 mt-0.5">
                          {module.bengaliTitle}
                        </p>
                      </div>

                      {/* Associated Badge Preview Box */}
                      <div className={`p-3 rounded-2xl border text-center shrink-0 flex flex-col items-center min-w-[90px] ${
                        isFullyDone 
                          ? 'bg-amber-100/80 border-amber-300 text-amber-950' 
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}>
                        <BadgeIcon className="w-6 h-6 mb-1 text-amber-600" />
                        <span className="text-[10px] font-extrabold uppercase tracking-wider block">Awards:</span>
                        <span className="text-xs font-black truncate max-w-[85px]">{module.badgeAwardTitle}</span>
                        {isFullyDone && <span className="text-[9px] font-bold text-emerald-700">✓ EARNED</span>}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {module.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-slate-500 uppercase tracking-wider text-[10px]">Checkpoints</span>
                        <span className={isFullyDone ? 'text-emerald-700 font-extrabold' : 'text-slate-600'}>
                          {completedList.length} of {module.lessons.length} Completed ({percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Lesson Checkpoints */}
                    <div className="space-y-2.5 pt-2">
                      <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                        Knowledge Checkpoints:
                      </h4>

                      {module.lessons.map((lesson, idx) => {
                        const isDone = completedList.includes(lesson.id);

                        return (
                          <div 
                            key={lesson.id}
                            onClick={() => handleToggleLesson(module.id, lesson.id)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                              isDone 
                                ? 'bg-emerald-50/70 border-emerald-200 text-slate-900' 
                                : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <button
                              type="button"
                              className="mt-0.5 shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleLesson(module.id, lesson.id);
                              }}
                            >
                              {isDone ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                              ) : (
                                <div className="w-5 h-5 rounded-md border-2 border-slate-300 hover:border-emerald-500" />
                              )}
                            </button>

                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase text-slate-400">Part {idx + 1}</span>
                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50/80 px-2 py-0.2 rounded">
                                  {lesson.statuteRef}
                                </span>
                              </div>
                              <p className={`text-xs font-bold ${isDone ? 'text-slate-900' : 'text-slate-800'}`}>
                                {lesson.title}
                              </p>
                              <p className="text-[11px] text-slate-500 leading-snug">
                                💡 <strong className="font-semibold text-slate-600">Takeaway:</strong> {lesson.keyTakeaway}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Card Bottom status */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    {isFullyDone ? (
                      <span className="font-extrabold text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Module Completed • {module.badgeAwardTitle} Badge Awarded!</span>
                      </span>
                    ) : (
                      <span className="font-medium text-slate-500">
                        Check off all {module.lessons.length} checkpoints to earn the {module.badgeAwardTitle} badge
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        // Mark all completed
                        setCompletedLessonsMap(prev => ({
                          ...prev,
                          [module.id]: module.lessons.map(l => l.id)
                        }));
                        const earned = allBadges.find(b => b.linkedModuleId === module.id);
                        if (earned) setNewlyUnlockedBadge(earned);
                      }}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer underline"
                    >
                      {isFullyDone ? 'Re-verify' : 'Complete All'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BADGE DETAIL POPUP MODAL */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 text-center relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center mx-auto shadow-lg">
              {React.createElement(getBadgeIconComponent(selectedBadge.iconName), { className: 'w-10 h-10' })}
            </div>

            <div className="space-y-1">
              <span className="text-xs font-black text-amber-800 bg-amber-100 px-3 py-1 rounded-full uppercase tracking-wider border border-amber-300">
                {selectedBadge.category} • {selectedBadge.tier} Tier
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">{selectedBadge.title}</h3>
              <p className="text-sm font-bold text-emerald-700">{selectedBadge.bengaliTitle}</p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              {selectedBadge.description}
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-left space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Status:</span>
                <span className={selectedBadge.unlocked ? 'text-emerald-700 font-black flex items-center gap-1' : 'text-slate-600 font-bold'}>
                  {selectedBadge.unlocked ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Unlocked {selectedBadge.unlockedAt ? `on ${selectedBadge.unlockedAt}` : ''}</span>
                    </>
                  ) : (
                    'Locked (In Progress)'
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Criteria:</span>
                <span className="font-extrabold text-slate-900">{selectedBadge.criteriaText}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Reward XP:</span>
                <span className="font-black text-amber-700">+{selectedBadge.xpPoints} XP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Achievement Perk:</span>
                <span className="font-bold text-emerald-700">{selectedBadge.rewardNote}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              {selectedBadge.unlocked ? (
                <button
                  onClick={(e) => handleShareBadge(selectedBadge, e)}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share Achievement on Social Media</span>
                </button>
              ) : (
                selectedBadge.linkedModuleId && (
                  <button
                    onClick={() => {
                      setSelectedBadge(null);
                      setActiveSection('modules');
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Go to Knowledge Module to Earn This Badge</span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Achievement Celebration Modal for Streaks */}
      <AchievementCelebrationModal
        isOpen={showCelebrationModal}
        onClose={() => setShowCelebrationModal(false)}
        currentStreak={streakDays}
      />

      {/* Streak Freeze Vault & Protection Modal */}
      <StreakFreezeModal
        isOpen={showFreezeModal}
        onClose={() => setShowFreezeModal(false)}
        streakDays={streakDays}
      />
    </div>
  );
};

export default UserBadgesSection;
