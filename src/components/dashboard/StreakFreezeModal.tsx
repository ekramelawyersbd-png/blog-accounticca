import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Flame, 
  X, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Clock, 
  Award, 
  Zap, 
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  Info
} from 'lucide-react';
import { 
  getStreakFreezeData, 
  activateStreakFreeze, 
  earnFreezeToken, 
  StreakFreezeData 
} from '../../services/streakFreezeService';

interface StreakFreezeModalProps {
  isOpen: boolean;
  onClose: () => void;
  streakDays: number;
}

export const StreakFreezeModal: React.FC<StreakFreezeModalProps> = ({
  isOpen,
  onClose,
  streakDays
}) => {
  const [freezeData, setFreezeData] = useState<StreakFreezeData>(() => getStreakFreezeData());
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const refreshData = () => {
    setFreezeData(getStreakFreezeData());
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('accounticca_freeze_updated', refreshData);
    return () => {
      window.removeEventListener('accounticca_freeze_updated', refreshData);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleActivateFreeze = () => {
    const res = awaitActivateFreeze();
    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
      setFreezeData(res.data);
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  const awaitActivateFreeze = () => {
    return activateStreakFreeze();
  };

  const handleEarnTestToken = (reason: string) => {
    const res = earnFreezeToken(1, reason);
    setFreezeData(res.data);
    setFeedback({
      type: 'success',
      text: `Earned +1 Streak Freeze Token ❄️! New balance: ${res.newTotal} token${res.newTotal > 1 ? 's' : ''}.`
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-6 animate-scale-up max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 shadow-2xs">
              <span className="text-xl">❄️</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">Streak Freeze Protection Vault</h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
                  Protection System
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Protect your {streakDays}-day streak from resetting if you miss your daily goals.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert Toast */}
        {feedback && (
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-bold gap-2 animate-fade-in ${
            feedback.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
              : feedback.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-cyan-50 border-cyan-200 text-cyan-900'
          }`}>
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              <span>{feedback.text}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-[11px] underline cursor-pointer text-slate-500">
              Dismiss
            </button>
          </div>
        )}

        {/* Hero Token Status & Active Shield Card */}
        <div className="rounded-3xl border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-blue-50/40 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white border border-cyan-200 flex flex-col items-center justify-center shadow-sm">
                <span className="text-2xl">❄️</span>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Freeze Tokens</div>
                <div className="text-3xl font-black text-slate-900 flex items-baseline gap-2">
                  <span>{freezeData.tokensAvailable}</span>
                  <span className="text-xs font-bold text-cyan-700">Token{freezeData.tokensAvailable !== 1 ? 's' : ''} in Inventory</span>
                </div>
              </div>
            </div>

            {/* Current Protection Status Badge */}
            <div className="sm:text-right">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs border ${
                freezeData.isFreezeActiveForToday
                  ? 'bg-cyan-600 text-white border-cyan-700 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}>
                {freezeData.isFreezeActiveForToday ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-cyan-200" />
                    <span>Active For Today (Protected)</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Unprotected Today</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Active Protection Explainer */}
          {freezeData.isFreezeActiveForToday ? (
            <div className="bg-cyan-100/70 border border-cyan-300/80 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-cyan-950">
              <ShieldCheck className="w-5 h-5 text-cyan-700 shrink-0 mt-0.5" />
              <div>
                <div className="font-extrabold text-cyan-900">Streak Freeze Shield is Active Today!</div>
                <p className="mt-0.5 text-cyan-800 leading-relaxed">
                  Your <strong>{streakDays}-day consecutive streak</strong> is 100% safe. Even if you don't complete any articles or tax practice cases before midnight, your streak will not reset.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white/80 border border-cyan-200/80 rounded-2xl p-3.5 flex items-start justify-between gap-3 text-xs text-slate-700">
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>Current Streak: {streakDays} Days</span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  Spend 1 Freeze Token to lock in 24-hour protection if you are traveling, busy, or taking a rest day.
                </p>
              </div>

              <button
                type="button"
                onClick={handleActivateFreeze}
                disabled={freezeData.tokensAvailable < 1}
                className="shrink-0 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <span>Equip Freeze</span>
                <span className="text-[10px] bg-cyan-700 px-1.5 py-0.2 rounded font-mono">1 Token</span>
              </button>
            </div>
          )}
        </div>

        {/* How to Earn More Tokens Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>How to Earn Streak Freeze Tokens</span>
            </h4>
            <span className="text-[11px] font-bold text-slate-400">Total Earned: {freezeData.tokensEarnedTotal}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {/* Method 1 */}
            <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>🎓 Complete Knowledge Modules</span>
                </span>
                <span className="text-[11px] font-black text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded-full">
                  +1 Token
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Earn 1 token every time you complete all lessons in <em>Tax Expert</em>, <em>VAT Pro</em>, or <em>Corporate Counsel</em>.
              </p>
              <button
                type="button"
                onClick={() => handleEarnTestToken('Reward: Completed Tax Expert Module')}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer pt-1"
              >
                Claim Test Module Token &rarr;
              </button>
            </div>

            {/* Method 2 */}
            <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>🔥 Hit Streak Milestones</span>
                </span>
                <span className="text-[11px] font-black text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded-full">
                  +1 to +2
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Earn bonus freeze tokens at 7-day, 14-day, 30-day, and 100-day consecutive study milestones.
              </p>
              <button
                type="button"
                onClick={() => handleEarnTestToken('Reward: 7-Day Streak Milestone Bonus')}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer pt-1"
              >
                Claim Milestone Bonus Token &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* Token Usage History Log */}
        {freezeData.history.length > 0 && (
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
              Recent Token Activity History
            </h4>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {freezeData.history.slice(0, 5).map((item) => (
                <div 
                  key={item.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{item.action === 'spent' ? '🛡️' : '❄️'}</span>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate text-[11px]">{item.reason}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(item.timestamp).toLocaleDateString()} at {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <span className={`font-mono text-xs font-black shrink-0 ${
                    item.action === 'spent' ? 'text-rose-600' : 'text-emerald-600'
                  }`}>
                    {item.action === 'spent' ? '-1 Token' : `+${item.amount} Token`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            Protected by Accounticca Achievement Engine
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors cursor-pointer"
          >
            Close Vault
          </button>
        </div>
      </div>
    </div>
  );
};

export default StreakFreezeModal;
