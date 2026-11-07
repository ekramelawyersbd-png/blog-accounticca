import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  Flame, 
  Sparkles, 
  Award, 
  Crown, 
  Star, 
  Zap, 
  Share2, 
  Check, 
  X, 
  ChevronRight, 
  Gift, 
  ShieldCheck, 
  Linkedin, 
  Twitter, 
  Copy, 
  Download,
  PartyPopper,
  ArrowRight
} from 'lucide-react';

export interface StreakMilestone {
  days: number;
  title: string;
  bengaliTitle: string;
  badgeName: string;
  icon: 'Zap' | 'Flame' | 'Star' | 'ShieldCheck' | 'Trophy' | 'Crown' | 'PartyPopper';
  xpPoints: number;
  rewardNote: string;
  perkList: string[];
  gradientBg: string;
  accentColor: string;
  description: string;
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  {
    days: 3,
    title: '3-Day Habit Ignition',
    bengaliTitle: '৩ দিনের প্রাথমিক অর্জন',
    badgeName: 'Active Learner',
    icon: 'Zap',
    xpPoints: 150,
    rewardNote: 'Unlocked 1 Free NBR Statutory Form Guide PDF',
    perkList: ['+150 Compliance XP', 'Active Learner Badge on Profile', '+1 Streak Freeze Token ❄️', 'Access to Daily Tax Dispatch Alerts'],
    gradientBg: 'from-amber-600 via-orange-500 to-amber-700',
    accentColor: 'text-amber-400',
    description: 'You completed 3 consecutive days of reading tax dispatches and completing compliance goals!'
  },
  {
    days: 7,
    title: '7-Day Master Consistency',
    bengaliTitle: '৭ দিনের একনিষ্ঠ অর্জন',
    badgeName: 'Master Compliance Rank',
    icon: 'Flame',
    xpPoints: 500,
    rewardNote: '10% OFF Any Premium Tax & Legal Toolkit',
    perkList: ['+500 Compliance XP', 'Master Compliance Rank Flame Badge', '+1 Bonus Streak Freeze Token ❄️', '10% Discount Code on Single Tool Purchases', 'Eligible for Community Leaderboard'],
    gradientBg: 'from-orange-600 via-amber-600 to-red-600',
    accentColor: 'text-orange-300',
    description: '1 Full Week of daily statutory reading & tax calculation practice! You are building elite corporate habits.'
  },
  {
    days: 14,
    title: '14-Day Fortnight Champion',
    bengaliTitle: '১৪ দিনের নিবেদিত অর্জন',
    badgeName: 'Tax Practitioner Elite',
    icon: 'Star',
    xpPoints: 1000,
    rewardNote: 'Unlocked Exclusive Salary Tax Deduction Calculator Kit',
    perkList: ['+1,000 Compliance XP', 'Practitioner Elite Badge', '+2 Bonus Streak Freeze Tokens ❄️', 'Free Access to Salary Tax Deduction Calculator', 'Priority Q&A in Consultations'],
    gradientBg: 'from-purple-600 via-indigo-600 to-blue-600',
    accentColor: 'text-purple-300',
    description: '14 Days of uninterrupted tax & corporate learning! You demonstrate exceptional professional diligence.'
  },
  {
    days: 30,
    title: '30-Day Monthly Titan',
    bengaliTitle: '৩০ দিনের গৌরবময় মাইলফলক',
    badgeName: '30-Day Compliance Champion',
    icon: 'ShieldCheck',
    xpPoints: 2500,
    rewardNote: 'Free Access to RJSC Annual Filing Automation Kit',
    perkList: ['+2,500 Compliance XP', '30-Day Champion Crest Badge', '+2 Bonus Streak Freeze Tokens ❄️', 'Free Download of RJSC Form XII Automation Kit', 'Featured Practitioner Tag on Discussion Dispatches'],
    gradientBg: 'from-emerald-600 via-teal-600 to-cyan-700',
    accentColor: 'text-emerald-300',
    description: 'A full month of continuous daily growth! You have established a solid foundation in Bangladesh Tax & Corporate Law.'
  },
  {
    days: 60,
    title: '60-Day Corporate Legend',
    bengaliTitle: '৬০ দিনের করপোরেট লেজেন্ড',
    badgeName: 'Governance Master',
    icon: 'Trophy',
    xpPoints: 5000,
    rewardNote: 'Free 1-on-1 Consultation Voucher with Senior Tax Advocate',
    perkList: ['+5,000 Compliance XP', '60-Day Governance Master Trophy', 'Free 15-Min Tax Advisory Call Voucher', 'Permanent VIP Member Distinction'],
    gradientBg: 'from-blue-600 via-indigo-700 to-violet-800',
    accentColor: 'text-blue-300',
    description: '60 consecutive days of mastery! You belong to the top 1% of dedicated financial and legal compliance learners.'
  },
  {
    days: 90,
    title: '90-Day Sovereign Authority',
    bengaliTitle: '৯০ দিনের সার্বভৌম কর বিশেষজ্ঞ',
    badgeName: 'Quarterly Tax Authority',
    icon: 'Crown',
    xpPoints: 10000,
    rewardNote: 'Free Lifetime Access Pass to All Dispatches & Tool Updates',
    perkList: ['+10,000 Compliance XP', 'Crown of Tax Excellence Badge', 'All Premium Dispatches & Tool Kits Unlocked', 'Exclusive Annual Tax Digest Print Copy Eligibility'],
    gradientBg: 'from-amber-500 via-yellow-600 to-amber-700',
    accentColor: 'text-amber-200',
    description: '90 Days! An entire quarter of relentless daily tax study and corporate practice. You are a sovereign tax authority!'
  },
  {
    days: 100,
    title: '100-Day Centurion Sovereign',
    bengaliTitle: '১০০ দিনের সেঞ্চুরিয়ন অর্জন',
    badgeName: 'Centurion Compliance Sovereign',
    icon: 'PartyPopper',
    xpPoints: 15000,
    rewardNote: 'Honorary Lifetime Fellow Status & Hall of Fame Placement',
    perkList: ['+15,000 Compliance XP', 'Centurion Gold Crown Badge', 'Permanent Placement in Accounticca Hall of Fame', 'VIP Advisory Council Invitation'],
    gradientBg: 'from-rose-600 via-pink-600 to-purple-700',
    accentColor: 'text-rose-200',
    description: '100 DAYS CENTURION STREAK! A legendary milestone achieved by only the most disciplined professionals in Bangladesh.'
  }
];

const STORAGE_KEY_LAST_CELEBRATED = 'accounticca_last_celebrated_streak_v1';

interface AchievementCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStreak: number;
  forcedMilestoneDays?: number; // Optional milestone override for previewing
}

export const AchievementCelebrationModal: React.FC<AchievementCelebrationModalProps> = ({
  isOpen,
  onClose,
  currentStreak,
  forcedMilestoneDays
}) => {
  const [copiedShare, setCopiedShare] = useState(false);
  const [selectedMilestoneDays, setSelectedMilestoneDays] = useState<number>(() => {
    if (forcedMilestoneDays) return forcedMilestoneDays;
    // Find closest reached or default to 7
    const reached = STREAK_MILESTONES.filter(m => currentStreak >= m.days);
    if (reached.length > 0) return reached[reached.length - 1].days;
    return 7;
  });

  // Update selected milestone when props change
  useEffect(() => {
    if (forcedMilestoneDays) {
      setSelectedMilestoneDays(forcedMilestoneDays);
    } else {
      const reached = STREAK_MILESTONES.filter(m => currentStreak >= m.days);
      if (reached.length > 0) {
        setSelectedMilestoneDays(reached[reached.length - 1].days);
      } else {
        setSelectedMilestoneDays(7);
      }
    }
  }, [forcedMilestoneDays, currentStreak, isOpen]);

  // Active milestone object
  const activeMilestone = useMemo(() => {
    return STREAK_MILESTONES.find(m => m.days === selectedMilestoneDays) || STREAK_MILESTONES[1];
  }, [selectedMilestoneDays]);

  const isUnlocked = currentStreak >= activeMilestone.days;

  // Render appropriate Icon
  const renderIcon = (iconName: StreakMilestone['icon'], className: string) => {
    switch (iconName) {
      case 'Zap': return <Zap className={className} />;
      case 'Flame': return <Flame className={className} />;
      case 'Star': return <Star className={className} />;
      case 'ShieldCheck': return <ShieldCheck className={className} />;
      case 'Trophy': return <Trophy className={className} />;
      case 'Crown': return <Crown className={className} />;
      case 'PartyPopper': return <PartyPopper className={className} />;
      default: return <Award className={className} />;
    }
  };

  // Social share content text
  const shareText = `🔥 Reached the ${activeMilestone.title} (${activeMilestone.days}-Day Streak) on Accounticca! Completed daily tax & corporate compliance dispatches. #BangladeshTax #Accounticca #IncomeTax #CareerGrowth`;

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyShare = () => {
    navigator.clipboard.writeText(shareText);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Confetti & Glow Background Particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl" />
      </div>

      {/* Main Dialog Modal */}
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden text-white my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header Banner with Dynamic Gradient */}
        <div className={`relative p-6 sm:p-8 bg-gradient-to-r ${activeMilestone.gradientBg} overflow-hidden text-white`}>
          
          {/* Decorative Background Elements */}
          <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -left-10 -top-10 w-40 h-40 bg-black/20 rounded-full blur-xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white/90 hover:text-white transition-colors cursor-pointer z-10"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Banner Tag */}
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/30 backdrop-blur-md text-xs font-black uppercase tracking-wider text-amber-200 border border-white/20">
              <PartyPopper className="w-3.5 h-3.5 text-amber-300" />
              <span>Streak Milestone Celebration</span>
            </span>
            {isUnlocked ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/30 backdrop-blur-md text-xs font-bold text-emerald-200 border border-emerald-400/30">
                <Check className="w-3 h-3 text-emerald-300" /> Milestone Reached!
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-slate-200 border border-white/10">
                Target Milestone ({activeMilestone.days - currentStreak} days left)
              </span>
            )}
          </div>

          {/* Trophy & Title Header */}
          <div className="flex flex-col sm:flex-row items-center gap-5">
            
            {/* Animated Flame / Trophy Badge Icon */}
            <div className="relative group shrink-0">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-300 to-yellow-300 rounded-3xl blur-md opacity-75 group-hover:opacity-100 transition duration-500 animate-pulse" />
              <div className="relative w-20 h-20 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-white/30 flex items-center justify-center text-amber-400 shadow-xl">
                {renderIcon(activeMilestone.icon, 'w-10 h-10 animate-bounce text-amber-300 fill-amber-300/20')}
              </div>
            </div>

            <div className="text-center sm:text-left space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                {activeMilestone.title}
              </h2>
              <p className="text-sm font-semibold text-amber-100/90">
                {activeMilestone.bengaliTitle} • <span className="underline decoration-amber-300">{activeMilestone.badgeName} Badge</span>
              </p>
              <p className="text-xs text-white/80 max-w-md pt-1">
                {activeMilestone.description}
              </p>
            </div>
          </div>

        </div>

        {/* Milestone Selector Tabs */}
        <div className="bg-slate-950/90 px-6 py-3 border-y border-slate-800 overflow-x-auto flex items-center gap-2 scrollbar-none">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 shrink-0 mr-1 flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-400" /> Milestones:
          </span>
          {STREAK_MILESTONES.map((m) => {
            const unlocked = currentStreak >= m.days;
            const isSelected = selectedMilestoneDays === m.days;

            return (
              <button
                key={m.days}
                onClick={() => setSelectedMilestoneDays(m.days)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black scale-105'
                    : unlocked
                    ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30'
                    : 'bg-slate-900/60 hover:bg-slate-800 text-slate-500 border border-slate-800'
                }`}
              >
                <span>{m.days} Days</span>
                {unlocked && <Check className="w-3 h-3 text-emerald-400" />}
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Key Metrics Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Metric 1: Current Streak */}
            <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/80 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Your Active Streak</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-amber-400">{currentStreak}</span>
                <span className="text-xs text-slate-300 font-bold">/ {activeMilestone.days} Days</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {isUnlocked ? '✓ Target Achieved' : `${activeMilestone.days - currentStreak} more days needed`}
              </p>
            </div>

            {/* Metric 2: Compliance XP */}
            <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/80 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Reward XP Earned</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-emerald-400">+{activeMilestone.xpPoints}</span>
                <span className="text-xs text-emerald-300 font-bold">XP</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Compliance Level Boost
              </p>
            </div>

            {/* Metric 3: Rank Title */}
            <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/80 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Rank Unlocked</span>
              <div className="text-sm font-black text-amber-200 truncate pt-0.5">
                {activeMilestone.badgeName}
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Official Accounticca Distinction
              </p>
            </div>

          </div>

          {/* Unlocked Perks & Rewards Box */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40 rounded-2xl p-5 border border-amber-500/20 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-400" />
                <span>Milestone Perks & Unlocked Benefits</span>
              </h4>
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800">
                {activeMilestone.rewardNote}
              </span>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {activeMilestone.perkList.map((perk, idx) => (
                <li key={idx} className="flex items-center gap-2 text-slate-200 font-medium">
                  <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Media Sharing & Bragging Widget */}
          <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Brag & Share Your Streak Milestone</span>
              </h4>
              <span className="text-[10px] text-slate-400">Inspire your network</span>
            </div>

            <p className="text-xs text-slate-300 italic bg-slate-900/80 p-3 rounded-xl border border-slate-700/60 text-slate-300">
              "{shareText}"
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={handleShareLinkedIn}
                className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
              >
                <Linkedin className="w-4 h-4 fill-current" />
                <span>LinkedIn</span>
              </button>

              <button
                onClick={handleShareTwitter}
                className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-600 transition-colors cursor-pointer shadow-xs"
              >
                <Twitter className="w-4 h-4 fill-current" />
                <span>Twitter / X</span>
              </button>

              <button
                onClick={handleCopyShare}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors cursor-pointer"
                title="Copy share text"
              >
                {copiedShare ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-400" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <div className="text-xs text-slate-400 text-center sm:text-left">
              Keep reading dispatches daily to maintain your active flame streak!
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Continue Daily Learning</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default AchievementCelebrationModal;
