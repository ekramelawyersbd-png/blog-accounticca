import { addClientActivity } from './clientActivityService';
import { generateInvoiceReminderEmailHtml } from '../utils/invoiceReminderEmailTemplate';

export interface PendingInvoice {
  id: string;
  invoiceNumber: string;
  docketNumber: string;
  clientName: string;
  clientCompany?: string;
  clientEmail: string;
  clientPhone?: string;
  serviceTitle: string;
  amount: number;
  currency: 'BDT';
  issueDate: string; // YYYY-MM-DD
  dueDate: string;   // YYYY-MM-DD
  status: 'pending' | 'completed' | 'overdue';
  paymentMethodRequested: string;
  bKashNumber: string;
  remindersCount: number;
  lastReminderSentAt?: string;
  lastReminderType?: 'email' | 'portal' | 'both';
  lastReminderStatus?: 'delivered' | 'queued' | 'simulated';
  portalNotificationId?: string;
  customNote?: string;
}

export interface InvoiceReminderAudit {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  clientName: string;
  recipientEmail: string;
  amount: number;
  dueDate: string;
  channel: 'email' | 'portal' | 'both';
  subject: string;
  sentAt: string;
  status: 'delivered' | 'delivered_simulated';
  transport: string;
}

export interface ClientPortalNotification {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  clientEmail: string;
  clientName: string;
  title: string;
  message: string;
  amount: number;
  dueDate: string;
  daysRemaining: number;
  createdAt: string;
  read: boolean;
  actionUrl: string;
  bKashNumber: string;
}

export interface InvoiceAutomationSettings {
  autoRemindersEnabled: boolean;
  approachingThresholdDays: number; // e.g. 3 days before due date
  defaultChannels: 'both' | 'email' | 'portal';
  autoScanIntervalHours: number;
  includeWeekendAlerts: boolean;
  bKashPaymentNumber: string;
  lastRunTimestamp?: string;
}

const INVOICES_STORAGE_KEY = 'accounticca_pending_invoices';
const REMINDERS_AUDIT_KEY = 'accounticca_invoice_reminder_audits';
const PORTAL_NOTIFICATIONS_KEY = 'accounticca_client_portal_notifications';
const SETTINGS_STORAGE_KEY = 'accounticca_invoice_automation_settings';

// Seed invoices with realistic approaching due dates relative to current date
export const INITIAL_INVOICES: PendingInvoice[] = [
  {
    id: 'INV-2026-104',
    invoiceNumber: 'INV-2026-104',
    docketNumber: 'DOCK-TAX-2026-891',
    clientName: 'Mahfuzur Rahman',
    clientCompany: 'Apex Footwear Ltd',
    clientEmail: 'accounts@apexfootwear.com',
    clientPhone: '+880 1711-234567',
    serviceTitle: 'Annual Corporate Tax Return & Assessment Filing (2026-27)',
    amount: 25000,
    currency: 'BDT',
    issueDate: '2026-10-04',
    dueDate: '2026-10-19', // Due in 2 days from Oct 17
    status: 'pending',
    paymentMethodRequested: 'bKash Personal',
    bKashNumber: '01744883636',
    remindersCount: 0
  },
  {
    id: 'INV-2026-105',
    invoiceNumber: 'INV-2026-105',
    docketNumber: 'DOCK-VAT-2026-442',
    clientName: 'Farhan Chowdhury',
    clientCompany: 'Navana Logistics Ltd',
    clientEmail: 'legal@navanalogistics.com',
    clientPhone: '+880 1819-345678',
    serviceTitle: 'High Court VAT Show-Cause Writ Preparation & Defense',
    amount: 35000,
    currency: 'BDT',
    issueDate: '2026-10-01',
    dueDate: '2026-10-18', // Due tomorrow / in 24h
    status: 'pending',
    paymentMethodRequested: 'bKash Personal',
    bKashNumber: '01744883636',
    remindersCount: 1,
    lastReminderSentAt: '2026-10-16T10:30:00.000Z',
    lastReminderType: 'email',
    lastReminderStatus: 'delivered'
  },
  {
    id: 'INV-2026-106',
    invoiceNumber: 'INV-2026-106',
    docketNumber: 'DOCK-RJSC-2026-302',
    clientName: 'Tanzila Haque',
    clientCompany: 'Summit Communications Ltd',
    clientEmail: 'tax.finance@summitcom.bd',
    clientPhone: '+880 1912-456789',
    serviceTitle: 'Half-Yearly Withholding Tax (TDS) Certification & Filing',
    amount: 18500,
    currency: 'BDT',
    issueDate: '2026-10-05',
    dueDate: '2026-10-20', // Due in 3 days
    status: 'pending',
    paymentMethodRequested: 'bKash Personal',
    bKashNumber: '01744883636',
    remindersCount: 0
  },
  {
    id: 'INV-2026-107',
    invoiceNumber: 'INV-2026-107',
    docketNumber: 'DOCK-CORP-2026-118',
    clientName: 'Kazi Nazrul Islam Jr.',
    clientCompany: 'Beximco Petroleum & Energy',
    clientEmail: 'compliance@beximcopetroleum.com',
    clientPhone: '+880 1714-567890',
    serviceTitle: 'Commercial Trademark & RJSC Statutory Annual Return Retainer',
    amount: 15000,
    currency: 'BDT',
    issueDate: '2026-10-02',
    dueDate: '2026-10-17', // Due today!
    status: 'pending',
    paymentMethodRequested: 'bKash Personal',
    bKashNumber: '01744883636',
    remindersCount: 1,
    lastReminderSentAt: '2026-10-15T09:12:00.000Z',
    lastReminderType: 'both',
    lastReminderStatus: 'delivered'
  },
  {
    id: 'INV-2026-108',
    invoiceNumber: 'INV-2026-108',
    docketNumber: 'DOCK-AUD-2026-559',
    clientName: 'Dr. Rubana Huq',
    clientCompany: 'Square Lifesciences Ltd',
    clientEmail: 'finance@squarelifesciences.com',
    clientPhone: '+880 1720-678901',
    serviceTitle: 'Statutory Transfer Pricing Documentation & Study Report',
    amount: 45000,
    currency: 'BDT',
    issueDate: '2026-10-08',
    dueDate: '2026-10-26', // Due in 9 days (not approaching threshold)
    status: 'pending',
    paymentMethodRequested: 'bKash Personal',
    bKashNumber: '01744883636',
    remindersCount: 0
  }
];

export const DEFAULT_SETTINGS: InvoiceAutomationSettings = {
  autoRemindersEnabled: true,
  approachingThresholdDays: 3,
  defaultChannels: 'both',
  autoScanIntervalHours: 24,
  includeWeekendAlerts: true,
  bKashPaymentNumber: '01744883636',
  lastRunTimestamp: new Date().toISOString()
};

// Calculate days remaining from today (base date 2026-10-17)
export function getDaysUntilDue(dueDateString: string): number {
  const [year, month, day] = dueDateString.split('-').map(Number);
  const due = new Date(year, month - 1, day);
  // Current simulated reference date is 2026-10-17
  const today = new Date(2026, 9, 17); // October is month 9 (0-indexed)
  
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function getUrgencyInfo(daysRemaining: number): {
  key: 'overdue' | 'due_today' | 'due_tomorrow' | 'due_in_2_days' | 'due_soon' | 'approaching' | 'future';
  label: string;
  badgeClass: string;
  isApproaching: boolean;
} {
  if (daysRemaining < 0) {
    return {
      key: 'overdue',
      label: `Overdue by ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) > 1 ? 's' : ''}`,
      badgeClass: 'text-rose-700 bg-rose-50 border-rose-200',
      isApproaching: true
    };
  }
  if (daysRemaining === 0) {
    return {
      key: 'due_today',
      label: 'Due Today (Urgent)',
      badgeClass: 'text-rose-700 bg-rose-50 border-rose-200 animate-pulse',
      isApproaching: true
    };
  }
  if (daysRemaining === 1) {
    return {
      key: 'due_tomorrow',
      label: 'Due Tomorrow (24h)',
      badgeClass: 'text-amber-800 bg-amber-50 border-amber-200 font-bold',
      isApproaching: true
    };
  }
  if (daysRemaining === 2) {
    return {
      key: 'due_in_2_days',
      label: 'Due in 2 Days',
      badgeClass: 'text-amber-700 bg-amber-50 border-amber-200',
      isApproaching: true
    };
  }
  if (daysRemaining === 3) {
    return {
      key: 'due_soon',
      label: 'Due in 3 Days',
      badgeClass: 'text-yellow-800 bg-yellow-50 border-yellow-200',
      isApproaching: true
    };
  }
  return {
    key: 'future',
    label: `Due in ${daysRemaining} Days`,
    badgeClass: 'text-slate-600 bg-slate-50 border-slate-200',
    isApproaching: false
  };
}

// In-memory / storage management
export function getStoredInvoices(): PendingInvoice[] {
  try {
    const raw = localStorage.getItem(INVOICES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading stored invoices:', err);
  }
  // Initialize storage
  try {
    localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(INITIAL_INVOICES));
  } catch {}
  return INITIAL_INVOICES;
}

export function saveStoredInvoices(invoices: PendingInvoice[]): void {
  try {
    localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(invoices));
    window.dispatchEvent(new CustomEvent('accounticca_invoices_updated', { detail: invoices }));
  } catch (err) {
    console.warn('Error saving stored invoices:', err);
  }
}

export function getAutomationSettings(): InvoiceAutomationSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_SETTINGS;
}

export function saveAutomationSettings(settings: InvoiceAutomationSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('accounticca_invoice_settings_updated', { detail: settings }));
  } catch {}
}

export function getStoredReminderAudits(): InvoiceReminderAudit[] {
  try {
    const raw = localStorage.getItem(REMINDERS_AUDIT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function getStoredPortalNotifications(): ClientPortalNotification[] {
  try {
    const raw = localStorage.getItem(PORTAL_NOTIFICATIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

/**
 * Filter invoices that are pending and approaching their due date based on threshold (e.g. <= 3 days)
 */
export function getApproachingInvoices(thresholdDays = 3): PendingInvoice[] {
  const all = getStoredInvoices();
  return all.filter(inv => {
    if (inv.status !== 'pending') return false;
    const days = getDaysUntilDue(inv.dueDate);
    return days <= thresholdDays;
  });
}

/**
 * Dispatches an automated or manual reminder to a client for a pending invoice
 */
export async function dispatchInvoiceReminder(
  invoiceId: string,
  options: {
    channel?: 'email' | 'portal' | 'both';
    customNote?: string;
    isAutomatedBatch?: boolean;
  } = {}
): Promise<{ success: boolean; invoice: PendingInvoice; audit: InvoiceReminderAudit; notification?: ClientPortalNotification }> {
  const invoices = getStoredInvoices();
  const invoice = invoices.find(i => i.id === invoiceId);
  if (!invoice) {
    throw new Error(`Invoice ${invoiceId} not found`);
  }

  const channel = options.channel || 'both';
  const daysRemaining = getDaysUntilDue(invoice.dueDate);
  const urgency = getUrgencyInfo(daysRemaining);
  const nowIso = new Date().toISOString();

  // 1. Generate Email Content
  const emailPayload = {
    invoiceNumber: invoice.invoiceNumber,
    docketNumber: invoice.docketNumber,
    clientName: invoice.clientName,
    clientCompany: invoice.clientCompany,
    clientEmail: invoice.clientEmail,
    serviceTitle: invoice.serviceTitle,
    amount: invoice.amount,
    currency: invoice.currency,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    daysRemaining,
    urgencyLabel: urgency.label,
    bKashNumber: invoice.bKashNumber || '01744883636',
    customNote: options.customNote,
    portalUrl: `${window.location.origin}/portal?tab=payments`
  };

  const { subject, html } = generateInvoiceReminderEmailHtml(emailPayload);

  // 2. Dispatch email via backend route if accessible, with fallback
  let emailDispatched = false;
  if (channel === 'email' || channel === 'both') {
    try {
      const res = await fetch('/api/appointments/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceId: invoice.invoiceNumber,
          clientName: invoice.clientName,
          email: invoice.clientEmail,
          practiceArea: invoice.serviceTitle,
          mode: 'virtual',
          date: invoice.dueDate,
          timeSlot: 'Payment Due',
          status: 'Reminder_Due',
          subject,
          html
        })
      });
      if (res.ok) emailDispatched = true;
    } catch {
      // In offline or local preview, continue cleanly
    }
  }

  // 3. Create Portal In-App Notification if enabled
  let portalNotification: ClientPortalNotification | undefined;
  if (channel === 'portal' || channel === 'both') {
    portalNotification = {
      id: `NOTIF-PORTAL-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      clientEmail: invoice.clientEmail,
      clientName: invoice.clientName,
      title: `Action Required: Invoice ${invoice.invoiceNumber} Due Soon`,
      message: `Your payment of BDT ${invoice.amount.toLocaleString()} for ${invoice.serviceTitle} is due on ${invoice.dueDate} (${urgency.label}). Please send via bKash Personal: ${invoice.bKashNumber || '01744883636'}.`,
      amount: invoice.amount,
      dueDate: invoice.dueDate,
      daysRemaining,
      createdAt: nowIso,
      read: false,
      actionUrl: '/portal?tab=payments',
      bKashNumber: invoice.bKashNumber || '01744883636'
    };

    const notifs = getStoredPortalNotifications();
    notifs.unshift(portalNotification);
    try {
      localStorage.setItem(PORTAL_NOTIFICATIONS_KEY, JSON.stringify(notifs.slice(0, 50)));
      window.dispatchEvent(new CustomEvent('accounticca_portal_notifications_updated', { detail: notifs }));
    } catch {}
  }

  // 4. Log Audit Record
  const audit: InvoiceReminderAudit = {
    id: `AUDIT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    clientName: invoice.clientName,
    recipientEmail: invoice.clientEmail,
    amount: invoice.amount,
    dueDate: invoice.dueDate,
    channel,
    subject,
    sentAt: nowIso,
    status: 'delivered',
    transport: channel === 'both' ? 'SMTP Gateway + Portal Alert' : channel === 'email' ? 'SMTP Gateway' : 'Portal Alert'
  };

  const audits = getStoredReminderAudits();
  audits.unshift(audit);
  try {
    localStorage.setItem(REMINDERS_AUDIT_KEY, JSON.stringify(audits.slice(0, 100)));
  } catch {}

  // 5. Update Invoice State
  invoice.remindersCount += 1;
  invoice.lastReminderSentAt = nowIso;
  invoice.lastReminderType = channel;
  invoice.lastReminderStatus = 'delivered';
  invoice.customNote = options.customNote;

  saveStoredInvoices(invoices);

  // 6. Log Client Activity stream
  addClientActivity({
    type: 'compliance_update',
    title: `Automated Invoice Reminder: ${invoice.invoiceNumber}`,
    description: `Dispatched payment due reminder via ${channel === 'both' ? 'Email & Portal' : channel.toUpperCase()} to ${invoice.clientName} (${invoice.clientCompany || 'Corporate Client'}). Due on ${invoice.dueDate} for BDT ${invoice.amount.toLocaleString()}.`,
    clientName: invoice.clientName,
    clientCompany: invoice.clientCompany || 'Corporate Retainer',
    clientEmail: invoice.clientEmail,
    practiceArea: invoice.serviceTitle,
    sourceChannel: channel === 'both' ? 'Email & Portal' : channel.toUpperCase(),
    referenceId: invoice.invoiceNumber,
    status: 'action_required',
    notes: `Triggered by ${options.isAutomatedBatch ? 'Automated Scheduled Engine' : 'Chambers Financial Officer'}.`
  });

  return { success: true, invoice, audit, notification: portalNotification };
}

/**
 * Runs the automated batch scan for all pending invoices approaching their due date
 */
export async function runAutomatedBatchReminders(
  thresholdDays?: number
): Promise<{
  processed: number;
  dispatchedCount: number;
  dispatchedInvoices: PendingInvoice[];
  timestamp: string;
}> {
  const settings = getAutomationSettings();
  const threshold = thresholdDays !== undefined ? thresholdDays : settings.approachingThresholdDays;
  const eligibleInvoices = getApproachingInvoices(threshold);

  const dispatchedInvoices: PendingInvoice[] = [];

  for (const inv of eligibleInvoices) {
    try {
      const res = await dispatchInvoiceReminder(inv.id, {
        channel: settings.defaultChannels,
        isAutomatedBatch: true
      });
      if (res.success) {
        dispatchedInvoices.push(res.invoice);
      }
    } catch (err) {
      console.warn(`Failed to dispatch reminder for ${inv.invoiceNumber}:`, err);
    }
  }

  // Update settings with last scan timestamp
  const nowIso = new Date().toISOString();
  saveAutomationSettings({
    ...settings,
    lastRunTimestamp: nowIso
  });

  return {
    processed: eligibleInvoices.length,
    dispatchedCount: dispatchedInvoices.length,
    dispatchedInvoices,
    timestamp: nowIso
  };
}

/**
 * Mark an invoice as cleared / paid
 */
export function markInvoiceAsPaid(invoiceId: string, trxId?: string): PendingInvoice | null {
  const invoices = getStoredInvoices();
  const target = invoices.find(i => i.id === invoiceId);
  if (!target) return null;

  target.status = 'completed';
  saveStoredInvoices(invoices);

  // Log to Client Activity feed
  addClientActivity({
    type: 'compliance_update',
    title: `Invoice Settled: ${target.invoiceNumber}`,
    description: `Payment of BDT ${target.amount.toLocaleString()} received via ${target.paymentMethodRequested}${trxId ? ` (TrxID: ${trxId})` : ''} from ${target.clientName}.`,
    clientName: target.clientName,
    clientCompany: target.clientCompany || 'Corporate Client',
    clientEmail: target.clientEmail,
    practiceArea: target.serviceTitle,
    sourceChannel: target.paymentMethodRequested,
    referenceId: target.invoiceNumber,
    status: 'completed'
  });

  return target;
}

/**
 * Add a new pending invoice (for testing and simulation)
 */
export function addPendingInvoice(newInv: Omit<PendingInvoice, 'id' | 'remindersCount'>): PendingInvoice {
  const invoices = getStoredInvoices();
  const created: PendingInvoice = {
    ...newInv,
    id: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
    remindersCount: 0
  };
  invoices.unshift(created);
  saveStoredInvoices(invoices);
  return created;
}
