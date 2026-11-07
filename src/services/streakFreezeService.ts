export interface StreakFreezeHistoryItem {
  id: string;
  action: 'earned' | 'spent' | 'protected';
  amount: number;
  reason: string;
  timestamp: string;
}

export interface StreakFreezeData {
  tokensAvailable: number;
  tokensEarnedTotal: number;
  tokensSpentTotal: number;
  activeFreezeDate: string | null; // YYYY-MM-DD
  isFreezeActiveForToday: boolean;
  history: StreakFreezeHistoryItem[];
}

export const STORAGE_KEY_FREEZE = 'accounticca_streak_freeze_data_v1';
export const STORAGE_KEY_STREAK = 'accounticca_daily_streak_v1';

export const DEFAULT_FREEZE_DATA: StreakFreezeData = {
  tokensAvailable: 2, // 2 initial complimentary freeze tokens for experimentation
  tokensEarnedTotal: 2,
  tokensSpentTotal: 0,
  activeFreezeDate: null,
  isFreezeActiveForToday: false,
  history: [
    {
      id: 'init-freeze-1',
      action: 'earned',
      amount: 1,
      reason: 'Achievement Reward: Starter Onboarding Bonus',
      timestamp: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 'init-freeze-2',
      action: 'earned',
      amount: 1,
      reason: 'Milestone Reward: 3-Day Consecutive Study Streak',
      timestamp: new Date(Date.now() - 1 * 86400000).toISOString()
    }
  ]
};

const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Loads the current Streak Freeze data from localStorage
 */
export const getStreakFreezeData = (): StreakFreezeData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FREEZE);
    if (raw) {
      const parsed: StreakFreezeData = JSON.parse(raw);
      const todayStr = getTodayString();
      const isTodayActive = parsed.activeFreezeDate === todayStr;

      return {
        ...DEFAULT_FREEZE_DATA,
        ...parsed,
        tokensAvailable: Math.max(0, parsed.tokensAvailable ?? 2),
        isFreezeActiveForToday: isTodayActive,
        history: Array.isArray(parsed.history) ? parsed.history : DEFAULT_FREEZE_DATA.history
      };
    }
  } catch (e) {
    console.warn('Notice loading streak freeze data:', e);
  }
  return DEFAULT_FREEZE_DATA;
};

/**
 * Saves streak freeze state to localStorage and notifies listeners
 */
export const saveStreakFreezeData = (data: StreakFreezeData): void => {
  try {
    localStorage.setItem(STORAGE_KEY_FREEZE, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('accounticca_freeze_updated', { detail: data }));
    window.dispatchEvent(new Event('accounticca_goals_updated'));
  } catch (e) {
    console.warn('Notice saving streak freeze data:', e);
  }
};

/**
 * Awards streak freeze token(s) to the user
 */
export const earnFreezeToken = (
  amount = 1, 
  reason = 'Completed Knowledge Module Milestone'
): { success: boolean; data: StreakFreezeData; newTotal: number } => {
  const current = getStreakFreezeData();
  const nextTokens = current.tokensAvailable + amount;
  const nextEarned = current.tokensEarnedTotal + amount;

  const historyItem: StreakFreezeHistoryItem = {
    id: `freeze-earn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    action: 'earned',
    amount,
    reason,
    timestamp: new Date().toISOString()
  };

  const updated: StreakFreezeData = {
    ...current,
    tokensAvailable: nextTokens,
    tokensEarnedTotal: nextEarned,
    history: [historyItem, ...current.history]
  };

  saveStreakFreezeData(updated);

  return {
    success: true,
    data: updated,
    newTotal: nextTokens
  };
};

/**
 * Spends 1 token to activate a 24-hour streak freeze for today
 */
export const activateStreakFreeze = (): { 
  success: boolean; 
  message: string; 
  data: StreakFreezeData 
} => {
  const current = getStreakFreezeData();
  const todayStr = getTodayString();

  if (current.isFreezeActiveForToday) {
    return {
      success: false,
      message: 'A Streak Freeze is already active for today! Your streak is completely protected.',
      data: current
    };
  }

  if (current.tokensAvailable < 1) {
    return {
      success: false,
      message: 'You do not have any Streak Freeze tokens left. Complete knowledge modules or hit streak milestones to earn more!',
      data: current
    };
  }

  let streak = 5;
  try {
    const rawStreak = localStorage.getItem(STORAGE_KEY_STREAK);
    if (rawStreak) streak = parseInt(rawStreak, 10);
  } catch {}

  const historyItem: StreakFreezeHistoryItem = {
    id: `freeze-spend-${Date.now()}`,
    action: 'spent',
    amount: 1,
    reason: `Activated 1-Day Streak Freeze (Protected ${streak}-day streak for ${todayStr})`,
    timestamp: new Date().toISOString()
  };

  const updated: StreakFreezeData = {
    ...current,
    tokensAvailable: current.tokensAvailable - 1,
    tokensSpentTotal: current.tokensSpentTotal + 1,
    activeFreezeDate: todayStr,
    isFreezeActiveForToday: true,
    history: [historyItem, ...current.history]
  };

  saveStreakFreezeData(updated);

  return {
    success: true,
    message: `Streak Freeze Activated! Your ${streak}-day streak is protected for today even if you miss your daily goals.`,
    data: updated
  };
};

/**
 * Checks if streak reset should be prevented due to an active freeze
 */
export const checkIsStreakProtected = (): boolean => {
  const current = getStreakFreezeData();
  return current.isFreezeActiveForToday;
};
