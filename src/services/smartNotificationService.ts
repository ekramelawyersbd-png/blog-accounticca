import { ComplianceDeadline, calculateDaysRemaining } from '../components/dashboard/ComplianceDeadlineReminder';

export interface SmartNotificationConfig {
  enabled: boolean;
  leadDays: number; // default: 3 days before deadline
  soundEnabled: boolean;
  lastChecked?: string;
  lastDispatchedDate?: string;
}

export interface SmartNotificationAudit {
  id: string;
  deadlineId: string;
  deadlineTitle: string;
  dueDate: string;
  daysRemaining: number;
  leadDaysSetting: number;
  dispatchedAt: string;
  status: 'dispatched' | 'clicked' | 'dismissed';
}

export const SMART_NOTIF_CONFIG_KEY = 'accounticca_smart_notifications_config';
export const SMART_NOTIF_AUDIT_KEY = 'accounticca_smart_notification_audit_log';
export const STORAGE_KEY_REMINDERS = 'accounticca_compliance_deadline_reminders_v1';

export const DEFAULT_SMART_CONFIG: SmartNotificationConfig = {
  enabled: false,
  leadDays: 3, // Default: 3 days before deadline as requested
  soundEnabled: true
};

/**
 * Checks if Notification API is supported by the user's browser
 */
export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

/**
 * Gets the current Notification permission status
 */
export const getNotificationPermission = (): NotificationPermission | 'unsupported' => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
};

/**
 * Requests Notification permission from the browser
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isNotificationSupported()) {
    throw new Error('Desktop/mobile notifications are not supported in this browser.');
  }
  const permission = await Notification.requestPermission();
  return permission;
};

/**
 * Retrieves the stored smart notification config
 */
export const getSmartNotificationConfig = (): SmartNotificationConfig => {
  try {
    const raw = localStorage.getItem(SMART_NOTIF_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SMART_CONFIG,
        ...parsed,
        leadDays: typeof parsed.leadDays === 'number' && parsed.leadDays >= 1 ? parsed.leadDays : 3
      };
    }
  } catch (err) {
    console.warn('Notice parsing smart notification config:', err);
  }
  return DEFAULT_SMART_CONFIG;
};

/**
 * Saves smart notification config to localStorage and broadcasts update
 */
export const saveSmartNotificationConfig = (config: Partial<SmartNotificationConfig>): SmartNotificationConfig => {
  const current = getSmartNotificationConfig();
  const updated: SmartNotificationConfig = {
    ...current,
    ...config,
    leadDays: typeof config.leadDays === 'number' && config.leadDays >= 1 ? config.leadDays : (current.leadDays || 3)
  };

  try {
    localStorage.setItem(SMART_NOTIF_CONFIG_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('accounticca_smart_notifications_updated', { detail: updated }));
  } catch (err) {
    console.warn('Notice saving smart notification config:', err);
  }

  return updated;
};

/**
 * Fetches stored compliance deadlines from localStorage
 */
export const getStoredComplianceDeadlines = (): ComplianceDeadline[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REMINDERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Notice reading stored compliance deadlines:', err);
  }
  return [];
};

/**
 * Returns deadlines that fall within the custom leadDays window
 */
export const getApproachingDeadlines = (
  customLeadDays?: number
): Array<{ deadline: ComplianceDeadline; daysRemaining: number }> => {
  const deadlines = getStoredComplianceDeadlines();
  const lead = typeof customLeadDays === 'number' && customLeadDays >= 1 ? customLeadDays : getSmartNotificationConfig().leadDays;

  const results: Array<{ deadline: ComplianceDeadline; daysRemaining: number }> = [];

  deadlines.forEach(dl => {
    if (dl.isCompleted) return;
    const daysRemaining = calculateDaysRemaining(dl.dueDate);
    // Deadline is in the future or today, and within the leadDays threshold
    if (daysRemaining >= 0 && daysRemaining <= lead) {
      results.push({ deadline: dl, daysRemaining });
    }
  });

  return results.sort((a, b) => a.daysRemaining - b.daysRemaining);
};

/**
 * Retrieves audit log of sent smart notifications
 */
export const getSmartNotificationAuditLog = (): SmartNotificationAudit[] => {
  try {
    const raw = localStorage.getItem(SMART_NOTIF_AUDIT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
};

/**
 * Records an audit entry for a dispatched notification
 */
const recordAuditEntry = (entry: Omit<SmartNotificationAudit, 'id' | 'dispatchedAt' | 'status'>) => {
  try {
    const logs = getSmartNotificationAuditLog();
    const newEntry: SmartNotificationAudit = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      dispatchedAt: new Date().toISOString(),
      status: 'dispatched'
    };
    logs.unshift(newEntry);
    // Keep last 50 entries
    localStorage.setItem(SMART_NOTIF_AUDIT_KEY, JSON.stringify(logs.slice(0, 50)));
  } catch {}
};

/**
 * Sends a test notification to verify browser notification capabilities
 */
export const sendTestSmartNotification = async (leadDays = 3): Promise<{ success: boolean; message: string }> => {
  if (!isNotificationSupported()) {
    return { success: false, message: 'Browser Notification API is not supported on this device/browser.' };
  }

  if (Notification.permission !== 'granted') {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') {
      return { success: false, message: 'Notification permission was denied. Please allow notifications in your browser settings.' };
    }
  }

  try {
    const notification = new Notification('🔔 Smart Compliance Notification (Test)', {
      body: `Test successful! You will receive browser alerts ${leadDays} day${leadDays > 1 ? 's' : ''} before stored tax & regulatory deadlines.`,
      icon: '/favicon.ico',
      tag: `test-smart-notif-${Date.now()}`,
      requireInteraction: false
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    recordAuditEntry({
      deadlineId: 'test-ping',
      deadlineTitle: 'Smart Notification Test Ping',
      dueDate: new Date().toISOString().slice(0, 10),
      daysRemaining: 0,
      leadDaysSetting: leadDays
    });

    return { success: true, message: `Test notification sent successfully for ${leadDays}-day lead time!` };
  } catch (err: any) {
    return { success: false, message: err.message || 'Could not display browser notification.' };
  }
};

/**
 * Evaluates stored compliance deadlines against the leadDays threshold
 * and triggers browser notifications for qualifying deadlines
 */
export const checkAndDispatchDeadlineNotifications = async (
  options?: { force?: boolean; customLeadDays?: number }
): Promise<{
  dispatched: number;
  matches: Array<{ deadline: ComplianceDeadline; daysRemaining: number }>;
  errors: string[];
}> => {
  const config = getSmartNotificationConfig();
  const errors: string[] = [];

  if (!config.enabled && !options?.force) {
    return { dispatched: 0, matches: [], errors: ['Smart notifications are currently toggled off in profile settings.'] };
  }

  if (!isNotificationSupported()) {
    return { dispatched: 0, matches: [], errors: ['Notification API not supported.'] };
  }

  if (Notification.permission !== 'granted') {
    return { dispatched: 0, matches: [], errors: ['Notification permission is not granted.'] };
  }

  const targetLeadDays = options?.customLeadDays ?? config.leadDays ?? 3;
  const matches = getApproachingDeadlines(targetLeadDays);

  if (matches.length === 0) {
    saveSmartNotificationConfig({ lastChecked: new Date().toISOString() });
    return { dispatched: 0, matches: [], errors: [] };
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const auditLogs = getSmartNotificationAuditLog();
  let dispatchedCount = 0;

  for (const { deadline, daysRemaining } of matches) {
    // Prevent duplicate notification on the exact same date for the same deadline unless forced
    const alreadyDispatchedToday = auditLogs.some(
      log => log.deadlineId === deadline.id && log.dispatchedAt.slice(0, 10) === todayStr
    );

    if (alreadyDispatchedToday && !options?.force) {
      continue;
    }

    try {
      const urgencyText = daysRemaining === 0 
        ? 'DUE TODAY!' 
        : daysRemaining === 1 
          ? 'Due TOMORROW!' 
          : `Due in ${daysRemaining} days (${deadline.dueDate})`;

      const title = `⏰ Statutory Compliance Alert: ${deadline.title}`;
      const body = `${deadline.entityName ? `[${deadline.entityName}] ` : ''}${urgencyText} • Category: ${deadline.category}. ${deadline.notes ? `Note: ${deadline.notes}` : 'Review details in your Dashboard.'}`;

      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: `smart-deadline-${deadline.id}-${todayStr}`,
        requireInteraction: daysRemaining <= 1
      });

      notification.onclick = () => {
        window.focus();
        window.location.href = '/dashboard?tab=deadlines';
        notification.close();
      };

      recordAuditEntry({
        deadlineId: deadline.id,
        deadlineTitle: deadline.title,
        dueDate: deadline.dueDate,
        daysRemaining,
        leadDaysSetting: targetLeadDays
      });

      dispatchedCount++;
    } catch (err: any) {
      errors.push(`Error alerting for ${deadline.title}: ${err.message}`);
    }
  }

  saveSmartNotificationConfig({
    lastChecked: new Date().toISOString(),
    lastDispatchedDate: todayStr
  });

  return {
    dispatched: dispatchedCount,
    matches,
    errors
  };
};
