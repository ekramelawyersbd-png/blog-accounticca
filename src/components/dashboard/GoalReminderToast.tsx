import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  Flame, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ArrowRight, 
  Sparkles, 
  Volume2, 
  Settings,
  Target
} from 'lucide-react';
import { DailyGoalItem } from './DailyGoalTracker';

const STORAGE_KEY_GOALS = 'accounticca_daily_goals_v1';
const STORAGE_KEY_REMINDER_HOUR = 'accounticca_goal_reminder_hour_v1';
const STORAGE_KEY_DISMISSED_DATE = 'accounticca_goal_reminder_dismissed_date_v1';

export const GoalReminderToast: React.FC = () => {
  const [reminderHour, setReminderHour] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_REMINDER_HOUR);
      if (saved) return parseInt(saved, 10);
    } catch {}
    return 18; // Default 18:00 (6:00 PM)
  });

  const [isVisible, setIsVisible] = useState(false);
  const [incompleteItems, setIncompleteItems] = useState<DailyGoalItem[]>([]);
  const [snoozedUntil, setSnoozedUntil] = useState<number | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  // Check goal status and reminder cutoff time
  const checkReminderStatus = () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const dismissedDate = localStorage.getItem(STORAGE_KEY_DISMISSED_DATE);

      // Do not re-show if user explicitly dismissed today
      if (dismissedDate === todayStr) {
        setIsVisible(false);
        return;
      }

      // Check snoozed state
      if (snoozedUntil && Date.now() < snoozedUntil) {
        setIsVisible(false);
        return;
      }

      // Read current goals
      const savedGoals = localStorage.getItem(STORAGE_KEY_GOALS);
      if (savedGoals) {
        const parsed: DailyGoalItem[] = JSON.parse(savedGoals);
        const incomplete = parsed.filter(item => !item.completed);
        setIncompleteItems(incomplete);

        const currentHour = new Date().getHours();

        // Trigger if after cutoff time and incomplete items exist
        if (currentHour >= reminderHour && incomplete.length > 0) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      }
    } catch {}
  };

  useEffect(() => {
    checkReminderStatus();
    const interval = setInterval(checkReminderStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [reminderHour, snoozedUntil]);

  // Request browser Web Push notification permission
  const handleRequestPushPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        triggerWebPushNotification('Push Notifications Enabled!', 'You will receive 6:00 PM reminders when daily goals are incomplete.');
      }
    }
  };

  // Trigger native web push notification
  const triggerWebPushNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/footer-logo.png',
          tag: 'daily-goal-reminder'
        });
      } catch {}
    }
  };

  // Simulate 6 PM alert for testing
  const handleSimulateAlert = () => {
    try {
      const savedGoals = localStorage.getItem(STORAGE_KEY_GOALS);
      let incomplete: DailyGoalItem[] = [];
      if (savedGoals) {
        const parsed: DailyGoalItem[] = JSON.parse(savedGoals);
        incomplete = parsed.filter(item => !item.completed);
      }

      if (incomplete.length === 0) {
        incomplete = [
          { id: 'sim-1', type: 'article_read', title: 'Read 1 Corporate Law or RJSC Filing Dispatch', category: 'Corporate Law', completed: false, minutesEstimate: 6 },
          { id: 'sim-2', type: 'tool_test', title: 'Test 1 Interactive Tool (RJsc Fee Calculator)', category: 'Compliance Tool', completed: false, minutesEstimate: 5 }
        ];
      }

      setIncompleteItems(incomplete);
      setIsVisible(true);
      setSnoozedUntil(null);

      // Trigger Web Push Notification if permission granted
      triggerWebPushNotification(
        `Goal Reminder (${formatHourLabel(reminderHour)})`,
        `You have ${incomplete.length} incomplete compliance goals for today. Complete them now to maintain your active streak!`
      );
    } catch {}
  };

  const handleDismissToday = () => {
    setIsVisible(false);
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      localStorage.setItem(STORAGE_KEY_DISMISSED_DATE, todayStr);
    } catch {}
  };

  const handleSnoozeOneHour = () => {
    setIsVisible(false);
    setSnoozedUntil(Date.now() + 3600000); // Snooze for 1 hour (3600000 ms)
  };

  const handleScrollToTracker = () => {
    const el = document.getElementById('daily-goal-tracker-card');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setIsVisible(false);
  };

  const handleSaveReminderHour = (hour: number) => {
    setReminderHour(hour);
    try {
      localStorage.setItem(STORAGE_KEY_REMINDER_HOUR, hour.toString());
    } catch {}
  };

  const formatHourLabel = (hour: number) => {
    if (hour === 12) return '12:00 PM';
    if (hour > 12) return `${hour - 12}:00 PM`;
    return `${hour}:00 AM`;
  };

  return (
    <>
      {/* Floating Toast Notification Card */}
      {isVisible && incompleteItems.length > 0 && (
        <div 
          id="goal-reminder-toast-card"
          className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-slate-900 text-white rounded-3xl p-5 shadow-2xl border border-amber-500/40 animate-in slide-in-from-bottom-5 duration-300 space-y-4"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold shrink-0 shadow-md">
                <Flame className="w-6 h-6 text-slate-950 fill-amber-200 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                    {formatHourLabel(reminderHour)} Goal Cutoff Alert
                  </span>
                </div>
                <h4 className="text-sm font-extrabold text-white mt-0.5">
                  Incomplete Daily Goals Remaining!
                </h4>
              </div>
            </div>

            <button
              onClick={handleDismissToday}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Dismiss for today"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Alert Body & Incomplete Task List */}
          <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700/80 space-y-2 text-xs">
            <p className="text-slate-300 leading-relaxed font-medium">
              You have <span className="text-amber-400 font-bold">{incompleteItems.length} incomplete tasks</span> for today. Finish them before midnight to preserve your daily learning streak!
            </p>

            <ul className="space-y-1.5 pt-1">
              {incompleteItems.slice(0, 2).map((item) => (
                <li key={item.id} className="flex items-start gap-2 text-slate-200">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="truncate">{item.title}</span>
                </li>
              ))}
              {incompleteItems.length > 2 && (
                <li className="text-[11px] text-amber-300 font-bold pl-5">
                  + {incompleteItems.length - 2} more task{incompleteItems.length - 2 > 1 ? 's' : ''}
                </li>
              )}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              onClick={handleScrollToTracker}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Target className="w-4 h-4" />
              <span>Complete Goals Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleSnoozeOneHour}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              title="Snooze reminder for 1 hour"
            >
              Snooze 1h
            </button>
          </div>
        </div>
      )}

      {/* Control Bar Embedded Widget in Dashboard */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h5 className="font-extrabold text-white flex items-center gap-2">
              <span>Goal Cutoff Time & Push Notification System</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.2 rounded-md font-bold">
                Cutoff: {formatHourLabel(reminderHour)}
              </span>
            </h5>
            <p className="text-slate-400 mt-0.5">
              Automated push alerts trigger if goals remain incomplete by {formatHourLabel(reminderHour)}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Time Cutoff Selector */}
          <select
            value={reminderHour}
            onChange={(e) => handleSaveReminderHour(Number(e.target.value))}
            className="bg-slate-800 text-white border border-slate-700 rounded-xl px-2.5 py-1.5 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
            title="Set daily cutoff reminder hour"
          >
            <option value={17}>5:00 PM Cutoff</option>
            <option value={18}>6:00 PM Cutoff (Default)</option>
            <option value={19}>7:00 PM Cutoff</option>
            <option value={20}>8:00 PM Cutoff</option>
            <option value={21}>9:00 PM Cutoff</option>
          </select>

          {/* Web Push Permission Button */}
          {notificationPermission !== 'granted' && (
            <button
              onClick={handleRequestPushPermission}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors cursor-pointer"
              title="Enable native browser push notifications"
            >
              Enable Web Push
            </button>
          )}

          {/* Simulate Alert Button */}
          <button
            onClick={handleSimulateAlert}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
            title="Test the 6 PM goal reminder alert instantly"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simulate {formatHourLabel(reminderHour)} Alert</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default GoalReminderToast;
