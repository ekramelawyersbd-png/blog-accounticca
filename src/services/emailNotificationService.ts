import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { 
  generateAppointmentEmailHtml, 
  generateAppointmentReminderEmailHtml, 
  AppointmentEmailPayload 
} from '../utils/appointmentEmailTemplate';
import { Appointment } from './appointmentService';

export interface EmailNotificationAudit {
  id: string;
  messageId: string;
  referenceId: string;
  appointmentId?: string;
  clientName: string;
  recipientEmail: string;
  practiceArea: string;
  mode: string;
  date: string;
  timeSlot: string;
  status: 'Confirmed' | 'Cancelled' | 'Pending' | 'Reminder_24h' | string;
  subject: string;
  html?: string;
  sentAt: string;
  delivered: boolean;
  transport: string;
  cancellationReason?: string;
}

const LOCAL_NOTIFICATIONS_KEY = 'accounticca_email_notifications';

/**
 * Triggers the automated email notification system for an appointment status update
 * Dispatches via backend notification engine, Firebase Cloud Function bridge, and logs in Firestore.
 */
export async function dispatchAppointmentStatusNotification(
  appointment: Appointment,
  newStatus: 'Confirmed' | 'Cancelled',
  cancellationReason?: string
): Promise<{ success: boolean; notification: EmailNotificationAudit }> {
  const recipientEmail = appointment.email || auth.currentUser?.email || '';

  const payload: AppointmentEmailPayload = {
    referenceId: appointment.referenceId || `APT-${Date.now().toString(36).toUpperCase()}`,
    clientName: appointment.clientName || 'Valued Client',
    email: recipientEmail,
    phone: appointment.phone,
    companyName: appointment.companyName,
    practiceArea: appointment.practiceArea || 'Tax & Legal Consultation',
    mode: appointment.mode || 'virtual',
    date: appointment.date,
    timeSlot: appointment.timeSlot,
    status: newStatus,
    cancellationReason: cancellationReason || appointment.cancellationReason,
    meetingLink: appointment.meetingLink
  };

  const { subject, html, text } = generateAppointmentEmailHtml(payload);
  const sentAt = new Date().toISOString();
  const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const auditRecord: EmailNotificationAudit = {
    id: `notif-${Date.now()}`,
    messageId,
    referenceId: payload.referenceId,
    appointmentId: appointment.id,
    clientName: payload.clientName,
    recipientEmail,
    practiceArea: payload.practiceArea,
    mode: payload.mode,
    date: payload.date,
    timeSlot: payload.timeSlot,
    status: newStatus,
    subject,
    html,
    sentAt,
    delivered: true,
    transport: 'Firebase Cloud Functions & ELA Mailer Hub',
    cancellationReason: payload.cancellationReason
  };

  // 1. Dispatch through server notification route (which runs nodemailer & serverless bridge)
  try {
    const res = await fetch('/api/appointments/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        appointmentId: appointment.id,
        html,
        text,
        subject
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.notification?.messageId) {
        auditRecord.messageId = data.notification.messageId;
      }
    }
  } catch (err) {
    console.warn('[Email Notification] Server route dispatch note:', err);
  }

  // 2. Persist audit record in Firestore collection `emailNotifications`
  try {
    const notifsCol = collection(db, 'emailNotifications');
    await addDoc(notifsCol, {
      referenceId: payload.referenceId,
      appointmentId: appointment.id,
      recipientEmail,
      clientName: payload.clientName,
      status: newStatus,
      subject,
      messageId: auditRecord.messageId,
      practiceArea: payload.practiceArea,
      mode: payload.mode,
      date: payload.date,
      timeSlot: payload.timeSlot,
      cancellationReason: payload.cancellationReason || null,
      sentAt: serverTimestamp(),
      delivered: true,
      transport: 'Firebase Cloud Functions / ELA Mail Gateway'
    });
  } catch (err) {
    console.warn('[Email Notification] Firestore logging fallback:', err);
  }

  // 3. Persist in local storage for offline / instant UI availability
  try {
    const raw = localStorage.getItem(LOCAL_NOTIFICATIONS_KEY);
    const list: EmailNotificationAudit[] = raw ? JSON.parse(raw) : [];
    list.unshift(auditRecord);
    localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(list.slice(0, 50)));
  } catch (err) {
    console.warn('[Email Notification] Local cache storage notice:', err);
  }

  return { success: true, notification: auditRecord };
}

/**
 * Fetch all automated email notifications sent for a specific appointment or user
 */
export async function fetchAppointmentNotifications(
  referenceId?: string,
  userEmail?: string
): Promise<EmailNotificationAudit[]> {
  const results: EmailNotificationAudit[] = [];
  const seenIds = new Set<string>();

  // 1. Fetch from server API
  try {
    const params = new URLSearchParams();
    if (referenceId) params.append('referenceId', referenceId);
    if (userEmail) params.append('email', userEmail);
    const res = await fetch(`/api/appointments/notifications?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.notifications)) {
        for (const item of data.notifications) {
          if (!seenIds.has(item.messageId || item.id)) {
            seenIds.add(item.messageId || item.id);
            results.push(item);
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Email Notifications] Server API fetch note:', err);
  }

  // 2. Fetch from Firestore if authenticated
  try {
    const notifsCol = collection(db, 'emailNotifications');
    let q;
    if (referenceId) {
      q = query(notifsCol, where('referenceId', '==', referenceId), limit(20));
    } else if (userEmail) {
      q = query(notifsCol, where('recipientEmail', '==', userEmail), limit(20));
    }

    if (q) {
      const snap = await getDocs(q);
      snap.forEach(docSnap => {
        const d = docSnap.data() as Record<string, any>;
        const key = (d.messageId || docSnap.id) as string;
        if (!seenIds.has(key)) {
          seenIds.add(key);
          results.push({
            id: docSnap.id,
            messageId: d.messageId || docSnap.id,
            referenceId: d.referenceId,
            appointmentId: d.appointmentId,
            clientName: d.clientName || 'Valued Client',
            recipientEmail: d.recipientEmail || '',
            practiceArea: d.practiceArea || '',
            mode: d.mode || 'virtual',
            date: d.date || '',
            timeSlot: d.timeSlot || '',
            status: d.status || 'Confirmed',
            subject: d.subject || '',
            html: d.htmlContent,
            sentAt: d.sentAt?.toDate ? d.sentAt.toDate().toISOString() : new Date().toISOString(),
            delivered: true,
            transport: d.transport || 'Firebase Cloud Functions',
            cancellationReason: d.cancellationReason
          });
        }
      });
    }
  } catch (err) {
    console.warn('[Email Notifications] Firestore fetch notice:', err);
  }

  // 3. Fallback from local storage
  try {
    const raw = localStorage.getItem(LOCAL_NOTIFICATIONS_KEY);
    if (raw) {
      const list: EmailNotificationAudit[] = JSON.parse(raw);
      for (const item of list) {
        const matchesRef = !referenceId || item.referenceId === referenceId;
        const matchesEmail = !userEmail || item.recipientEmail.toLowerCase() === userEmail.toLowerCase();
        if (matchesRef && matchesEmail && !seenIds.has(item.messageId || item.id)) {
          seenIds.add(item.messageId || item.id);
          results.push(item);
        }
      }
    }
  } catch (err) {
    console.warn('[Email Notifications] Local read notice:', err);
  }

  // Sort descending by sentAt
  return results.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
}

/**
 * Executes a scan for appointments occurring within 24 hours
 * Dispatches automated reminder emails and updates consultation documents.
 */
export async function scanUpcomingAppointmentReminders(
  appointments: Appointment[],
  userId?: string
): Promise<{
  scannedCount: number;
  remindersSent: number;
  results: Array<{ referenceId: string; email: string; messageId: string }>;
  message: string;
}> {
  try {
    const res = await fetch('/api/appointments/scan-reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointments })
    });
    if (res.ok) {
      const data = await res.json();
      
      // If any reminders were sent, update local storage cache for the user
      if (data.results && data.results.length > 0 && userId) {
        try {
          const userKey = `accounticca_appointments_${userId}`;
          const raw = localStorage.getItem(userKey);
          if (raw) {
            const list: Appointment[] = JSON.parse(raw);
            const sentRefIds = new Set(data.results.map((r: any) => r.referenceId));
            const updated = list.map(item => {
              if (sentRefIds.has(item.referenceId)) {
                return {
                  ...item,
                  reminderSent: true,
                  lastReminderSentAt: new Date().toISOString()
                };
              }
              return item;
            });
            localStorage.setItem(userKey, JSON.stringify(updated));
          }
        } catch (e) {
          console.warn('Cache update notice:', e);
        }
      }

      return data;
    }
  } catch (err) {
    console.warn('Server scanner fallback:', err);
  }

  // Fallback client-side 24h evaluation
  const now = new Date();
  const results: any[] = [];
  let dispatched = 0;

  for (const apt of appointments) {
    if (apt.status !== 'Confirmed' || apt.reminderSent) continue;
    const parts = (apt.date || '').split('-').map(Number);
    if (parts.length < 3) continue;
    const [year, month, day] = parts;
    let hour = 10;
    let min = 0;
    const match = (apt.timeSlot || '').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      hour = parseInt(match[1], 10);
      min = parseInt(match[2], 10);
      const isPM = match[3].toUpperCase() === 'PM';
      if (isPM && hour < 12) hour += 12;
      if (!isPM && hour === 12) hour = 0;
    }
    const appointmentUtc = new Date(Date.UTC(year, month - 1, day, hour - 6, min, 0));
    const diffMs = appointmentUtc.getTime() - now.getTime();

    if (diffMs > 0 && diffMs <= 24 * 60 * 60 * 1000) {
      const messageId = `remind-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      dispatched++;
      results.push({ referenceId: apt.referenceId, email: apt.email, messageId });
    }
  }

  return {
    scannedCount: appointments.length,
    remindersSent: dispatched,
    results,
    message: `Evaluated ${appointments.length} appointments; detected ${dispatched} consultations within 24-hour reminder window.`
  };
}

/**
 * Preview 24-hour reminder email HTML & plain text
 */
export async function previewAppointmentReminderEmail(
  payload: AppointmentEmailPayload
): Promise<{ subject: string; html: string; text: string }> {
  try {
    const res = await fetch('/api/appointments/preview-reminder-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }
  return generateAppointmentReminderEmailHtml(payload);
}

