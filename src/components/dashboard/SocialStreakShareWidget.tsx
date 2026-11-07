import React, { useState, useMemo } from 'react';
import { 
  Share2, 
  Flame, 
  Trophy, 
  Linkedin, 
  Twitter, 
  Copy, 
  Check, 
  Sparkles, 
  Award, 
  ExternalLink,
  MessageSquareQuote,
  CheckCircle2,
  Crown
} from 'lucide-react';
import { useBookmarks } from '../../contexts/BookmarkContext';
import { usePurchases } from '../../contexts/PurchaseContext';
import { AchievementCelebrationModal } from './AchievementCelebrationModal';

const STORAGE_KEY_STREAK = 'accounticca_daily_streak_v1';

export const SocialStreakShareWidget: React.FC = () => {
  const { savedItems } = useBookmarks();
  const { purchasedProductIds } = usePurchases();

  const [copied, setCopied] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'linkedin' | 'twitter'>('linkedin');
  const [customComment, setCustomComment] = useState('Building tax & corporate compliance expertise every single day!');
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);

  // Retrieve current streak days
  const streakDays = useMemo(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STREAK);
      if (saved) return parseInt(saved, 10);
    } catch {}
    return 5;
  }, []);

  // Compute unlocked badges count
  const unlockedBadgesCount = useMemo(() => {
    let count = 0;
    if (streakDays >= 5) count++; // Consistency King
    count++; // Tax Assessment Master (default 1)
    if (savedItems.length >= 5) count++; // Master Library Collector
    count++; // VAT Shield (default 1)
    if (purchasedProductIds.length >= 1) count++; // Pro Tool Owner
    return count;
  }, [streakDays, savedItems.length, purchasedProductIds.length]);

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://accounticca.com';

  // Format share post content
  const shareText = useMemo(() => {
    const header = `🔥 ${streakDays}-Day Compliance & Study Streak on Accounticca!`;
    const badgesInfo = `🏆 Unlocked ${unlockedBadgesCount} Virtual Achievements including Consistency King & Tax Master.`;
    const comment = customComment.trim() ? `\n"${customComment.trim()}"` : '';
    const hashtags = `\n\n#TaxComplianceBD #FinanceAct2026 #ContinuousLearning #Accounticca #CorporateLaw`;
    return `${header}\n${badgesInfo}${comment}${hashtags}`;
  }, [streakDays, unlockedBadgesCount, customComment]);

  const handleCopyText = () => {
    navigator.clipboard.writeText(`${shareText}\n\nExplore Accounticca: ${appUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareLinkedIn = () => {
    const encodedUrl = encodeURIComponent(appUrl);
    const encodedText = encodeURIComponent(shareText);
    // LinkedIn share URL with text summary
    const linkedinUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodedText}%20${encodedUrl}`;
    window.open(linkedinUrl, '_blank', 'width=600,height=600,noopener,noreferrer');
  };

  const handleShareTwitter = () => {
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(appUrl);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
    window.open(twitterUrl, '_blank', 'width=600,height=500,noopener,noreferrer');
  };

  return (
    <div id="social-streak-share-card" className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-500/30 space-y-6 relative overflow-hidden">
      {/* Background Subtle Glows */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center shadow-lg shrink-0">
            <Share2 className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-bold text-white">Share Your Streak & Achievements</h3>
              <span className="text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Community Boost</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspire fellow corporate CFOs, accountants, and tax professionals by sharing your learning milestone on LinkedIn or Twitter
            </p>
          </div>
        </div>

        {/* Quick Stats Pill & Celebration Trigger */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={() => setShowCelebrationModal(true)}
            className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 border border-amber-500/30 hover:border-amber-400 rounded-2xl p-2 px-3 text-xs transition-colors cursor-pointer shadow-sm"
            title="Open Streak Milestone Celebration Modal"
          >
            <div className="flex items-center gap-1 text-amber-400 font-extrabold pr-2 border-r border-slate-700">
              <Flame className="w-4 h-4 fill-amber-400 animate-bounce" />
              <span>{streakDays} Days Streak</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-400 font-extrabold pl-1">
              <Crown className="w-4 h-4 text-emerald-400" />
              <span>{unlockedBadgesCount} Badges</span>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-amber-300 ml-1" />
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Left Column: Post Preview Card */}
        <div className="lg:col-span-7 space-y-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquareQuote className="w-4 h-4 text-amber-400" />
            <span>Social Post Live Preview</span>
          </label>

          <div className="bg-slate-800/90 rounded-2xl p-5 border border-slate-700/90 space-y-4 shadow-inner text-xs">
            {/* User Avatar & Headline */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
                AC
              </div>
              <div>
                <h5 className="font-bold text-white text-sm">Accounticca Member</h5>
                <p className="text-[11px] text-slate-400">Bangladesh Tax & Corporate Law Practitioner</p>
              </div>
            </div>

            {/* Generated Message Content */}
            <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-700/60 font-mono text-[11px] leading-relaxed text-slate-200 whitespace-pre-wrap">
              {shareText}
            </div>

            {/* Editable Note Input */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-bold block">Add Personal Note (Optional):</label>
              <input
                type="text"
                value={customComment}
                onChange={(e) => setCustomComment(e.target.value)}
                placeholder="e.g. Practicing Section 78 tax rebates daily!"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-sans text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Platform Direct Share Buttons */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Choose Sharing Platform
            </label>

            {/* LinkedIn Action Button */}
            <button
              onClick={handleShareLinkedIn}
              className="w-full py-3.5 px-5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-extrabold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/15 rounded-xl text-white group-hover:scale-105 transition-transform">
                  <Linkedin className="w-5 h-5 fill-current" />
                </div>
                <div className="text-left">
                  <p className="font-extrabold text-sm">Share on LinkedIn</p>
                  <p className="text-[11px] text-blue-200 font-normal">Post streak to professional network</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-blue-200 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Twitter / X Action Button */}
            <button
              onClick={handleShareTwitter}
              className="w-full py-3.5 px-5 bg-gradient-to-r from-slate-800 to-slate-950 hover:bg-slate-800 text-white font-extrabold text-xs rounded-2xl border border-slate-700 shadow-md transition-all flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl text-white group-hover:scale-105 transition-transform">
                  <Twitter className="w-5 h-5 fill-current" />
                </div>
                <div className="text-left">
                  <p className="font-extrabold text-sm">Share on Twitter / X</p>
                  <p className="text-[11px] text-slate-400 font-normal">Tweet streak & badges update</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Copy Post Text Button */}
            <button
              onClick={handleCopyText}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700/80 text-amber-300 font-bold text-xs rounded-2xl border border-slate-700/80 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Post Text Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-amber-400" />
                  <span>Copy Formatted Share Text</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed text-center sm:text-left pt-2 border-t border-slate-800/80">
            💡 Sharing your daily compliance progress helps motivate peer accountants & lawyers across Bangladesh while establishing your professional brand.
          </p>
        </div>

      </div>

      {/* Achievement Celebration Modal */}
      <AchievementCelebrationModal
        isOpen={showCelebrationModal}
        onClose={() => setShowCelebrationModal(false)}
        currentStreak={streakDays}
      />
    </div>
  );
};

export default SocialStreakShareWidget;
