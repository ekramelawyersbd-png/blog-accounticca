import { ComplianceDeadline, calculateDaysRemaining } from '../components/dashboard/ComplianceDeadlineReminder';
import { DailyGoalItem, GoalSettings } from '../components/dashboard/DailyGoalTracker';

const STORAGE_KEY_REMINDERS = 'accounticca_compliance_deadline_reminders_v1';
const STORAGE_KEY_GOALS = 'accounticca_daily_goals_v1';
const STORAGE_KEY_SETTINGS = 'accounticca_daily_goal_settings_v1';
const STORAGE_KEY_STREAK = 'accounticca_daily_streak_v1';
const STORAGE_KEY_LAST_DATE = 'accounticca_streak_last_date_v1';
const STORAGE_KEY_PURCHASES = 'accounticca_purchased_products';

/**
 * Helper to escape and format CSV cell value according to RFC 4180
 */
export function escapeCsvCell(value: any): string {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  // If string contains comma, quote, or newline, escape double quotes and wrap in quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export interface ExportDataSummary {
  deadlinesCount: number;
  goalsCount: number;
  streakDays: number;
  completedGoalsCount: number;
  unlockedToolsCount: number;
  filename: string;
}

/**
 * Retrieves compliance deadlines from browser localStorage
 */
export function getStoredComplianceDeadlines(): ComplianceDeadline[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REMINDERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to read compliance deadlines from localStorage', e);
  }
  return [
    {
      id: 'dl-vat-mushak-nov',
      title: 'Monthly VAT Return (Mushak 9.1 Filing & Payment)',
      category: 'VAT & Customs',
      entityName: 'E-Lawyers Consulting Ltd',
      dueDate: '2026-11-15',
      leadDaysAlert: 7,
      priority: 'high',
      notes: 'Must submit withholding VAT certificates and Mushak 6.3 invoices.',
      isCompleted: false,
      createdAt: '2026-10-01T08:00:00Z'
    },
    {
      id: 'dl-indiv-tax-nov',
      title: 'Individual Tax Return Filing Deadline (Tax Day)',
      category: 'Income Tax',
      entityName: 'All Individual Assessment Partners',
      dueDate: '2026-11-30',
      leadDaysAlert: 14,
      priority: 'high',
      notes: 'Section 166 of Income Tax Act 2023 deadline for FY 2025-26 assessment year 2026-27.',
      isCompleted: false,
      createdAt: '2026-10-01T08:00:00Z'
    },
    {
      id: 'dl-ait-q2-dec',
      title: 'Advance Income Tax (AIT) Q2 Installment Payment',
      category: 'Income Tax',
      entityName: 'Corporate Advisory Clients',
      dueDate: '2026-12-15',
      leadDaysAlert: 7,
      priority: 'medium',
      notes: 'Pay 2nd installment of estimated corporate tax in Bangladesh Bank treasury.',
      isCompleted: false,
      createdAt: '2026-10-01T08:00:00Z'
    },
    {
      id: 'dl-rjsc-form-ix',
      title: 'Annual RJSC Form IX & XXIII Filing',
      category: 'RJSC Corporate',
      entityName: 'Private Limited Companies',
      dueDate: '2026-12-30',
      leadDaysAlert: 10,
      priority: 'medium',
      notes: 'Submit annual return of directors and balance sheet following AGM.',
      isCompleted: false,
      createdAt: '2026-10-01T08:00:00Z'
    }
  ];
}

/**
 * Retrieves daily goals from browser localStorage
 */
export function getStoredDailyGoals(): DailyGoalItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GOALS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to read daily goals from localStorage', e);
  }
  return [
    {
      id: 'goal-1',
      type: 'article_read',
      title: 'Read 1 Income Tax Act 2023 Guide (Section 78 Rebate / Total Income)',
      category: 'Income Tax',
      completed: true,
      minutesEstimate: 8
    },
    {
      id: 'goal-2',
      type: 'article_read',
      title: 'Read 1 Corporate Law or RJSC Filing Dispatch',
      category: 'Corporate Law',
      completed: false,
      minutesEstimate: 6
    },
    {
      id: 'goal-3',
      type: 'tax_practice',
      title: 'Practice 1 Tax Assessment Calculation (Individual / Corporate Slab)',
      category: 'Tax Calculator',
      completed: true,
      minutesEstimate: 10
    },
    {
      id: 'goal-4',
      type: 'tool_test',
      title: 'Test 1 Interactive Tool (RJsc Fee Calculator / Post-Reg Checklist)',
      category: 'Compliance Tool',
      completed: false,
      minutesEstimate: 5
    }
  ];
}

/**
 * Retrieves streak days count
 */
export function getStoredStreak(): { streakDays: number; lastDate: string } {
  try {
    const streakStr = localStorage.getItem(STORAGE_KEY_STREAK);
    const lastDate = localStorage.getItem(STORAGE_KEY_LAST_DATE) || new Date().toISOString().split('T')[0];
    const streakDays = streakStr ? parseInt(streakStr, 10) : 5;
    return { streakDays: isNaN(streakDays) ? 5 : streakDays, lastDate };
  } catch {
    return { streakDays: 5, lastDate: new Date().toISOString().split('T')[0] };
  }
}

/**
 * Retrieves goal target settings
 */
export function getStoredGoalSettings(): GoalSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    targetArticles: 2,
    targetPractices: 1,
    targetMinutes: 20
  };
}

/**
 * Generates and triggers download of Dashboard Activity Progress & Stored Deadlines as a CSV file
 */
export function exportDashboardDataAsCSV(
  scope: 'all' | 'deadlines' | 'activity' = 'all',
  customFilename?: string
): ExportDataSummary {
  const deadlines = getStoredComplianceDeadlines();
  const goals = getStoredDailyGoals();
  const { streakDays, lastDate } = getStoredStreak();
  const settings = getStoredGoalSettings();
  
  let unlockedToolsCount = 0;
  try {
    const purchasesRaw = localStorage.getItem(STORAGE_KEY_PURCHASES);
    if (purchasesRaw) {
      const parsed = JSON.parse(purchasesRaw);
      unlockedToolsCount = Array.isArray(parsed) ? parsed.length : 0;
    }
  } catch {}

  const completedGoals = goals.filter(g => g.completed);
  const completionPct = goals.length > 0 ? Math.round((completedGoals.length / goals.length) * 100) : 0;
  const loggedMinutes = completedGoals.reduce((sum, g) => sum + (g.minutesEstimate || 0), 0);

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0];

  const lines: string[] = [];
  // UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';

  if (scope === 'all' || scope === 'activity') {
    // SECTION 1: HEADER & ACTIVITY SUMMARY
    lines.push('=== ACCOUNTICCA & E-LAWYERS DASHBOARD DATA EXPORT ===');
    lines.push(`Exported On,${escapeCsvCell(`${dateStr} ${timeStr}`)}`);
    lines.push(`Jurisdiction,${escapeCsvCell('Bangladesh (Income Tax Act 2023 & VAT Act 2012)')}`);
    lines.push('');

    lines.push('=== ACTIVITY PROGRESS & STUDY STREAK SUMMARY ===');
    lines.push('Metric,Value,Target / Status');
    lines.push(`Consecutive Learning Streak,${escapeCsvCell(`${streakDays} Days`)},${escapeCsvCell(streakDays >= 7 ? 'Master Compliance Rank' : streakDays >= 3 ? 'Active Learner' : 'Daily Starter')}`);
    lines.push(`Last Active Date,${escapeCsvCell(lastDate)},${escapeCsvCell('Recorded in Local Storage')}`);
    lines.push(`Daily Goal Quota Completion,${escapeCsvCell(`${completionPct}%`)},${escapeCsvCell(`${completedGoals.length} of ${goals.length} Tasks Completed`)}`);
    lines.push(`Articles Read Today,${escapeCsvCell(completedGoals.filter(g => g.type === 'article_read').length)},${escapeCsvCell(`Target: ${settings.targetArticles} Articles/Day`)}`);
    lines.push(`Tax Practices Today,${escapeCsvCell(completedGoals.filter(g => g.type === 'tax_practice' || g.type === 'tool_test').length)},${escapeCsvCell(`Target: ${settings.targetPractices} Practices/Day`)}`);
    lines.push(`Study Time Logged,${escapeCsvCell(`${loggedMinutes} Minutes`)},${escapeCsvCell(`Target: ${settings.targetMinutes} Mins/Day`)}`);
    lines.push(`Unlocked Professional Tools,${escapeCsvCell(unlockedToolsCount)},${escapeCsvCell('Active License')}`);
    lines.push('');

    // SECTION 2: DAILY LEARNING & COMPLIANCE TASKS TABLE
    lines.push('=== DAILY LEARNING & COMPLIANCE GOALS ===');
    lines.push('Task ID,Task Title,Category,Type,Estimated Minutes,Status,Completed');
    goals.forEach(goal => {
      lines.push([
        escapeCsvCell(goal.id),
        escapeCsvCell(goal.title),
        escapeCsvCell(goal.category),
        escapeCsvCell(goal.type),
        escapeCsvCell(goal.minutesEstimate || 5),
        escapeCsvCell(goal.completed ? 'Completed' : 'Pending'),
        escapeCsvCell(goal.completed ? 'YES' : 'NO')
      ].join(','));
    });
    lines.push('');
  }

  if (scope === 'all' || scope === 'deadlines') {
    // SECTION 3: STORED COMPLIANCE DEADLINES TABLE
    lines.push('=== STORED STATUTORY & COMPLIANCE DEADLINES ===');
    lines.push('Deadline ID,Title,Category,Entity / Company Name,Due Date,Days Remaining,Status,Priority,Lead Alert Days,Filing Notes,Created At,Completed Date');

    deadlines.forEach(dl => {
      const daysLeft = calculateDaysRemaining(dl.dueDate);
      let statusStr = 'Upcoming';
      if (dl.isCompleted) {
        statusStr = 'Filed / Completed';
      } else if (daysLeft < 0) {
        statusStr = `Overdue (${Math.abs(daysLeft)} days ago)`;
      } else if (daysLeft === 0) {
        statusStr = 'DUE TODAY';
      } else if (daysLeft <= (dl.leadDaysAlert || 7)) {
        statusStr = `Approaching (Due in ${daysLeft} days)`;
      } else {
        statusStr = `Due in ${daysLeft} days`;
      }

      lines.push([
        escapeCsvCell(dl.id),
        escapeCsvCell(dl.title),
        escapeCsvCell(dl.category),
        escapeCsvCell(dl.entityName || 'N/A'),
        escapeCsvCell(dl.dueDate),
        escapeCsvCell(daysLeft),
        escapeCsvCell(statusStr),
        escapeCsvCell(dl.priority ? dl.priority.toUpperCase() : 'MEDIUM'),
        escapeCsvCell(dl.leadDaysAlert || 7),
        escapeCsvCell(dl.notes || 'None'),
        escapeCsvCell(dl.createdAt || 'N/A'),
        escapeCsvCell(dl.completedAt || (dl.isCompleted ? 'Marked Completed' : 'Pending'))
      ].join(','));
    });
  }

  const csvContent = BOM + lines.join('\r\n');
  const filename = customFilename || (
    scope === 'deadlines'
      ? `Compliance_Deadlines_${dateStr}.csv`
      : scope === 'activity'
      ? `Activity_Progress_${dateStr}.csv`
      : `Compliance_and_Activity_Data_${dateStr}.csv`
  );

  // Trigger browser download via Blob
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return {
    deadlinesCount: deadlines.length,
    goalsCount: goals.length,
    streakDays,
    completedGoalsCount: completedGoals.length,
    unlockedToolsCount,
    filename
  };
}
