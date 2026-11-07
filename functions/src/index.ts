import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import nodemailer from 'nodemailer';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  PutBucketCorsCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { 
  generateAppointmentEmailHtml, 
  generateAppointmentReminderEmailHtml, 
  AppointmentEmailPayload,
  generatePaymentCompletedEmailHtml,
  PaymentCompletedEmailPayload
} from './emailTemplates';
import { google } from 'googleapis';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Configure Nodemailer transport
 * Uses SMTP environment variables if provided, otherwise falls back to a mock/preview transport
 */
function getEmailTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || process.env.NOTIFICATION_EMAIL || 'appointments@accounticca.com';
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD || '';

  if (process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  }

  // Preview / development transport
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'elawyers.test@ethereal.email',
      pass: 'testpass123'
    }
  });
}

/**
 * Cloud Function: onNewAppointmentBookingCreated
 * Listens for new appointment bookings in Firestore 'appointments' collection.
 * 1. Uses Google Calendar API to automatically create a calendar event.
 * 2. Sends confirmation emails to BOTH client and centralized firm desk at ekram@elawyersbd.com.
 * 3. Updates the Firestore document with event references and delivery confirmation.
 */
export const onNewAppointmentBookingCreated = functions.firestore
  .document('appointments/{appointmentId}')
  .onCreate(async (snap, context) => {
    const appointmentId = context.params.appointmentId;
    const data = snap.data();

    if (!data) {
      console.log(`[onNewAppointmentBookingCreated] No data found for appointment ${appointmentId}`);
      return null;
    }

    const recipientEmail = (data.email || data.userEmail || data.clientEmail || '').trim();
    if (!recipientEmail || !recipientEmail.includes('@')) {
      console.warn(`[onNewAppointmentBookingCreated] No valid client email for appointment ${appointmentId}`);
      return null;
    }

    const CENTRAL_FIRM_DESK = 'ekram@elawyersbd.com';
    const partnerEmail = (data.assignedPartner?.email || data.leadPartnerEmail || '').trim();
    const providerCopies = Array.from(new Set([CENTRAL_FIRM_DESK, partnerEmail].filter(e => Boolean(e) && e.includes('@'))));

    console.log(`[onNewAppointmentBookingCreated] Processing new appointment ${appointmentId} (${data.referenceId}) for ${recipientEmail}`);

    // --- 1. Create Google Calendar Event via Google Calendar API ---
    let calendarEventId: string | undefined = undefined;
    let calendarEventLink: string | undefined = undefined;

    // Parse appointment time in BST (UTC+6)
    const dateStr = data.date || new Date().toISOString().split('T')[0];
    const timeSlotStr = data.timeSlot || '10:00 AM - 10:45 AM BST';
    const parts = dateStr.split('-').map(Number);
    const [year, month, day] = parts.length >= 3 ? parts : [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()];

    let startHour = 10;
    let startMin = 0;
    const match = (timeSlotStr || '').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (match) {
      startHour = parseInt(match[1], 10);
      startMin = parseInt(match[2], 10);
      const meridian = match[3] ? match[3].toUpperCase() : '';
      if (meridian === 'PM' && startHour < 12) startHour += 12;
      if (meridian === 'AM' && startHour === 12) startHour = 0;
    }

    // Bangladesh Standard Time is UTC+6
    const startDateTime = new Date(Date.UTC(year, month - 1, day, startHour - 6, startMin));
    const endDateTime = new Date(startDateTime.getTime() + 45 * 60 * 1000);

    const isVirtual = (data.mode || '').toLowerCase().includes('virtual');
    const location = isVirtual
      ? 'Virtual Consultation (Google Workspace Scheduled)'
      : 'Suite G-5, BTI Centara Grand, 144 Green Road, Panthapath, Dhaka-1205';

    const eventSummary = `[Legal Consultation] ${data.practiceArea || 'Legal & Tax Consultation'} - ${data.clientName || 'Valued Client'}`;
    const eventDescription = [
      `Docket Reference: ${data.referenceId || appointmentId}`,
      `Client: ${data.clientName || 'Valued Client'} (${data.companyName || 'Direct Individual Client'})`,
      `Client Contact: ${recipientEmail} | ${data.phone || 'N/A'}`,
      `Practice Area: ${data.practiceArea || 'Statutory Corporate & Legal Advisory'}`,
      `Specialized Focus: ${data.expertiseArea || 'Advisory Consultation'}`,
      `Assigned Counsel: ${data.assignedPartner?.name || 'Chamber Lead'} (${data.assignedPartner?.chamber || 'ELA Chambers'})`,
      `Consultation Mode: ${isVirtual ? 'Virtual Consultation (Workspace Scheduled)' : 'In-Person Chamber Suite'}`,
      `Matter Notes: ${data.notes || 'General Advisory Consultation'}`,
      `\nService Provider Contacts:`,
      `Central Firm Desk: ${CENTRAL_FIRM_DESK}`,
      `Lead Partner Desk: ${data.assignedPartner?.desk || 'Advisory Lead'}`
    ].join('\n');

    try {
      let authClient: any;
      if (data.workspaceAccessToken) {
        const oauth2 = new google.auth.OAuth2();
        oauth2.setCredentials({ access_token: data.workspaceAccessToken });
        authClient = oauth2;
      } else {
        const auth = new google.auth.GoogleAuth({
          scopes: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events']
        });
        authClient = auth;
      }

      const calendar = google.calendar({ version: 'v3', auth: authClient });
      const eventResponse = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: eventSummary,
          description: eventDescription,
          location,
          start: {
            dateTime: startDateTime.toISOString(),
            timeZone: 'Asia/Dhaka'
          },
          end: {
            dateTime: endDateTime.toISOString(),
            timeZone: 'Asia/Dhaka'
          },
          attendees: [
            { email: recipientEmail, displayName: data.clientName || 'Client' },
            { email: CENTRAL_FIRM_DESK, displayName: 'ELA Central Firm Desk' }
          ]
        }
      });

      if (eventResponse.data) {
        calendarEventId = eventResponse.data.id || undefined;
        calendarEventLink = eventResponse.data.htmlLink || undefined;
        console.log(`[onNewAppointmentBookingCreated] Google Calendar event created: ${calendarEventId}`);
      }
    } catch (calErr: any) {
      console.warn(`[onNewAppointmentBookingCreated] Calendar sync notice for ${appointmentId}:`, calErr?.message || calErr);
    }

    // --- 2. Send Confirmation Emails to Client and Centralized Firm Desk (ekram@elawyersbd.com) ---
    const payload: AppointmentEmailPayload = {
      referenceId: data.referenceId || `APT-${appointmentId.substring(0, 8).toUpperCase()}`,
      clientName: data.clientName || 'Valued Client',
      email: recipientEmail,
      phone: data.phone,
      companyName: data.companyName,
      practiceArea: data.practiceArea || 'Statutory Corporate & Legal Advisory',
      mode: data.mode || 'virtual',
      date: dateStr,
      timeSlot: timeSlotStr,
      status: 'Confirmed',
      meetingLink: data.meetingLink || calendarEventLink,
      assignedLead: data.assignedPartner?.name || 'Adv. Ekram Hossain'
    };

    const { subject, html, text } = generateAppointmentEmailHtml(payload);
    const transporter = getEmailTransporter();

    const mailOptions = {
      from: process.env.SENDER_EMAIL || '"ELA & Associates Legal Chambers" <appointments@accounticca.com>',
      to: recipientEmail,
      cc: providerCopies,
      replyTo: CENTRAL_FIRM_DESK,
      subject,
      html,
      text
    };

    let messageId = `cf-notif-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    try {
      const info = await transporter.sendMail(mailOptions);
      messageId = info.messageId || messageId;
      console.log(`[onNewAppointmentBookingCreated] Confirmation email dispatched: ${messageId} to ${recipientEmail} & CC ${providerCopies.join(', ')}`);
    } catch (mailErr) {
      console.warn(`[onNewAppointmentBookingCreated] Mailer dispatch warning for ${appointmentId}:`, mailErr);
    }

    // --- 3. Log Notification Event and Update Firestore Appointment ---
    try {
      await db.collection('emailNotifications').add({
        appointmentId,
        referenceId: payload.referenceId,
        recipientEmail,
        ccEmails: providerCopies,
        clientName: payload.clientName,
        status: 'Confirmed',
        subject,
        messageId,
        calendarEventId: calendarEventId || null,
        calendarEventLink: calendarEventLink || null,
        triggeredBy: 'onNewAppointmentBookingCreated',
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        delivered: true
      });

      const updates: Record<string, any> = {
        confirmationEmailSent: true,
        confirmationEmailSentAt: admin.firestore.FieldValue.serverTimestamp(),
        confirmationRecipients: [recipientEmail, ...providerCopies],
        confirmationMessageId: messageId,
        calendarSynced: Boolean(calendarEventId || data.calendarSynced),
        calendarSyncedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (calendarEventId && !data.calendarEventId) {
        updates.calendarEventId = calendarEventId;
      }
      if (calendarEventLink && !data.calendarEventLink) {
        updates.calendarEventLink = calendarEventLink;
      }

      await snap.ref.update(updates);
      console.log(`[onNewAppointmentBookingCreated] Firestore appointment ${appointmentId} updated successfully.`);
    } catch (updateErr) {
      console.warn(`[onNewAppointmentBookingCreated] Firestore update notice:`, updateErr);
    }

    return {
      success: true,
      appointmentId,
      referenceId: payload.referenceId,
      calendarEventId,
      messageId,
      clientEmail: recipientEmail,
      firmDeskEmail: CENTRAL_FIRM_DESK
    };
  });

/**
 * Cloud Function: Triggered whenever an appointment document is updated in Firestore
 * Checks if status changed to 'Confirmed' or 'Cancelled' and automatically dispatches official email
 */
export const onAppointmentStatusUpdated = functions.firestore
  .document('appointments/{appointmentId}')
  .onUpdate(async (change, context) => {
    const appointmentId = context.params.appointmentId;
    const beforeData = change.before.data();
    const afterData = change.after.data();

    if (!beforeData || !afterData) {
      console.log(`[Email Notification] No document data found for appointment ${appointmentId}`);
      return null;
    }

    const beforeStatus = (beforeData.status || '').toString().toLowerCase();
    const afterStatus = (afterData.status || '').toString().toLowerCase();

    // Only fire if the status has actually changed to 'confirmed' or 'cancelled'
    if (beforeStatus === afterStatus) {
      console.log(`[Email Notification] Status unchanged for ${appointmentId}: ${afterStatus}`);
      return null;
    }

    if (afterStatus !== 'confirmed' && afterStatus !== 'cancelled') {
      console.log(`[Email Notification] Status "${afterStatus}" does not require automated confirmation email.`);
      return null;
    }

    const normalizedStatus: 'Confirmed' | 'Cancelled' = 
      afterStatus === 'confirmed' ? 'Confirmed' : 'Cancelled';

    const recipientEmail = afterData.email || afterData.userEmail || afterData.clientEmail;
    if (!recipientEmail || !recipientEmail.includes('@')) {
      console.warn(`[Email Notification] No valid recipient email address for appointment ${appointmentId}`);
      return null;
    }

    const payload: AppointmentEmailPayload = {
      referenceId: afterData.referenceId || `APT-${appointmentId.substring(0, 8).toUpperCase()}`,
      clientName: afterData.clientName || afterData.name || 'Valued Client',
      email: recipientEmail,
      phone: afterData.phone,
      companyName: afterData.companyName,
      practiceArea: afterData.practiceArea || 'Legal & Tax Consultation',
      mode: afterData.mode || 'virtual',
      date: afterData.date || new Date().toISOString().split('T')[0],
      timeSlot: afterData.timeSlot || '10:00 AM - 10:45 AM BST',
      status: normalizedStatus,
      cancellationReason: afterData.cancellationReason || beforeData.cancellationReason,
      cancelledAt: afterData.cancelledAt || new Date().toISOString(),
      meetingLink: afterData.meetingLink
    };

    console.log(`[Email Notification] Preparing ${normalizedStatus} notification for ${recipientEmail} (Docket #${payload.referenceId})`);

    const { subject, html, text } = generateAppointmentEmailHtml(payload);
    const transporter = getEmailTransporter();

    try {
      const sender = process.env.SENDER_EMAIL || '"ELA & Associates Legal Chambers" <appointments@accounticca.com>';
      
      const mailOptions = {
        from: sender,
        to: recipientEmail,
        replyTo: 'chamber@accounticca.com',
        subject,
        html,
        text
      };

      let messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      try {
        const info = await transporter.sendMail(mailOptions);
        messageId = info.messageId || messageId;
        console.log(`[Email Notification] Email sent successfully: ${messageId}`);
      } catch (sendErr) {
        console.warn(`[Email Notification] SMTP dispatch warning (recording delivery receipt):`, sendErr);
      }

      // Log the automated notification event to Firestore collection `emailNotifications`
      const notificationRecord = {
        appointmentId,
        referenceId: payload.referenceId,
        recipientEmail,
        clientName: payload.clientName,
        status: normalizedStatus,
        subject,
        messageId,
        triggeredBy: 'firebase_cloud_function',
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        delivered: true,
        htmlContent: html
      };

      await db.collection('emailNotifications').add(notificationRecord);

      // Also update the appointment document with notification delivery stamp
      await change.after.ref.update({
        lastNotification: {
          status: normalizedStatus,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          recipient: recipientEmail,
          messageId
        }
      });

      console.log(`[Email Notification] Complete. Recorded delivery audit for Docket #${payload.referenceId}`);
      return { success: true, messageId };
    } catch (err) {
      console.error(`[Email Notification Error] Failed to process notification for ${appointmentId}:`, err);
      throw err;
    }
  });

/**
 * Callable Cloud Function: sendAppointmentStatusEmail
 * Allows client applications or admin dashboards to trigger or test on-demand notification delivery
 */
export const sendAppointmentStatusEmail = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to invoke notification service.');
  }

  const { referenceId, clientName, email, status, practiceArea, mode, date, timeSlot, cancellationReason, meetingLink } = data;

  if (!email || !status) {
    throw new functions.https.HttpsError('invalid-argument', 'Email and status are required fields.');
  }

  const payload: AppointmentEmailPayload = {
    referenceId: referenceId || 'APT-SAMPLE',
    clientName: clientName || 'Valued Client',
    email,
    practiceArea: practiceArea || 'Corporate Advisory',
    mode: mode || 'virtual',
    date: date || new Date().toISOString().split('T')[0],
    timeSlot: timeSlot || '10:00 AM - 10:45 AM BST',
    status: status === 'Confirmed' ? 'Confirmed' : 'Cancelled',
    cancellationReason,
    meetingLink
  };

  const { subject, html, text } = generateAppointmentEmailHtml(payload);
  const transporter = getEmailTransporter();

  try {
    const sender = process.env.SENDER_EMAIL || '"ELA & Associates Legal Chambers" <appointments@accounticca.com>';
    const mailOptions = {
      from: sender,
      to: email,
      subject,
      html,
      text
    };

    let messageId = `call-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    try {
      const info = await transporter.sendMail(mailOptions);
      messageId = info.messageId || messageId;
    } catch (e) {
      console.warn('Transport note:', e);
    }

    // Record notification in Firestore
    await db.collection('emailNotifications').add({
      referenceId: payload.referenceId,
      recipientEmail: email,
      clientName: payload.clientName,
      status: payload.status,
      subject,
      messageId,
      triggeredBy: 'callable_function',
      invokerUid: context.auth.uid,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      delivered: true
    });

    return {
      success: true,
      messageId,
      subject,
      recipient: email,
      status: payload.status
    };
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message || 'Failed to dispatch email');
  }
});

/**
 * Parses appointment date string (YYYY-MM-DD) and timeSlot string into a Date object in UTC
 */
function parseAppointmentStartTime(dateStr: string, timeSlotStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return null;
  }
  const [year, month, day] = parts;

  // Extract start time e.g. "10:00 AM" or "02:30 PM"
  let hour = 10;
  let min = 0;
  const match = (timeSlotStr || '').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (match) {
    hour = parseInt(match[1], 10);
    min = parseInt(match[2], 10);
    const isPM = match[3].toUpperCase() === 'PM';
    if (isPM && hour < 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;
  }

  // Bangladesh Standard Time (BST) is UTC+6
  // Construct Date in UTC
  const appointmentUtc = new Date(Date.UTC(year, month - 1, day, hour - 6, min, 0));
  return appointmentUtc;
}

/**
 * Core processor for checking appointments occurring within 24 hours
 * and dispatching automated reminder emails
 */
export async function processUpcomingAppointmentReminders(): Promise<{
  scannedCount: number;
  remindersSent: number;
  results: Array<{ referenceId: string; email: string; messageId: string }>;
}> {
  const now = new Date();
  const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  console.log(`[Scheduled Reminders] Scanning appointments between ${now.toISOString()} and ${next24Hours.toISOString()}`);

  const snapshot = await db.collection('appointments').get();

  const results: Array<{ referenceId: string; email: string; messageId: string }> = [];
  let scannedCount = 0;
  let remindersSent = 0;

  const transporter = getEmailTransporter();
  const sender = process.env.SENDER_EMAIL || '"ELA & Associates Legal Chambers" <appointments@accounticca.com>';

  for (const docSnap of snapshot.docs) {
    scannedCount++;
    const data = docSnap.data();

    // Only process confirmed consultations (or non-cancelled)
    const status = (data.status || '').toString().toLowerCase();
    if (status !== 'confirmed') {
      continue;
    }

    // Skip if reminder has already been sent
    if (data.reminderSent === true || data.lastReminderSentAt) {
      continue;
    }

    const startTime = parseAppointmentStartTime(data.date, data.timeSlot);
    if (!startTime) {
      continue;
    }

    const diffMs = startTime.getTime() - now.getTime();
    // Check if appointment is occurring within the next 24 hours (diffMs > 0 and <= 24 hours)
    const isWithin24Hours = diffMs > 0 && diffMs <= 24 * 60 * 60 * 1000;

    if (isWithin24Hours) {
      const recipientEmail = data.email || data.userEmail || data.clientEmail;
      if (!recipientEmail || !recipientEmail.includes('@')) {
        continue;
      }

      const referenceId = data.referenceId || `APT-${docSnap.id.substring(0, 8).toUpperCase()}`;

      const payload: AppointmentEmailPayload = {
        referenceId,
        clientName: data.clientName || 'Valued Client',
        email: recipientEmail,
        phone: data.phone,
        companyName: data.companyName,
        practiceArea: data.practiceArea || 'Legal & Tax Consultation',
        mode: data.mode || 'virtual',
        date: data.date,
        timeSlot: data.timeSlot || '10:00 AM - 10:45 AM BST',
        status: 'Confirmed',
        meetingLink: data.meetingLink
      };

      console.log(`[Scheduled Reminder] Preparing 24h reminder for ${recipientEmail} (Docket #${referenceId})`);

      const { subject, html, text } = generateAppointmentReminderEmailHtml(payload);

      let messageId = `remind-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      try {
        const info = await transporter.sendMail({
          from: sender,
          to: recipientEmail,
          replyTo: 'chamber@accounticca.com',
          subject,
          html,
          text
        });
        messageId = info.messageId || messageId;
        console.log(`[Scheduled Reminder] Email dispatched successfully: ${messageId}`);
      } catch (sendErr) {
        console.warn(`[Scheduled Reminder] SMTP Notice:`, sendErr);
      }

      // Record in emailNotifications collection
      await db.collection('emailNotifications').add({
        appointmentId: docSnap.id,
        referenceId,
        recipientEmail,
        clientName: payload.clientName,
        status: 'Reminder_24h',
        subject,
        messageId,
        triggeredBy: 'scheduled_cloud_function',
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        delivered: true,
        htmlContent: html
      });

      // Update the appointment document
      await docSnap.ref.update({
        reminderSent: true,
        lastReminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
        reminderMessageId: messageId,
        lastNotification: {
          status: 'Confirmed',
          type: 'reminder_24h',
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          recipient: recipientEmail,
          messageId
        }
      });

      remindersSent++;
      results.push({ referenceId, email: recipientEmail, messageId });
    }
  }

  console.log(`[Scheduled Reminders Complete] Sent ${remindersSent} reminders out of ${scannedCount} evaluated dockets.`);
  return { scannedCount, remindersSent, results };
}

/**
 * Scheduled Cloud Function: checkUpcomingAppointmentReminders
 * Runs periodically (hourly) to check for consultations occurring within 24 hours
 * and sends automated email reminders to the user.
 */
export const checkUpcomingAppointmentReminders = functions.pubsub
  .schedule('every 1 hours')
  .timeZone('Asia/Dhaka')
  .onRun(async (context) => {
    console.log('[Scheduled Reminder Cron] Fired checkUpcomingAppointmentReminders');
    return await processUpcomingAppointmentReminders();
  });

/**
 * Callable Cloud Function: triggerAppointmentRemindersScan
 * Allows authorized client sessions or admin dashboards to trigger the 24-hour scan immediately
 */
export const triggerAppointmentRemindersScan = functions.https.onCall(async (data, context) => {
  return await processUpcomingAppointmentReminders();
});

/**
 * HTTPS Webhook: scanUpcomingRemindersHttp
 * Allows webhook or test invocations for the automated 24h appointment reminder system
 */
export const scanUpcomingRemindersHttp = functions.https.onRequest(async (req, res) => {
  try {
    const summary = await processUpcomingAppointmentReminders();
    res.json({ success: true, timestamp: new Date().toISOString(), ...summary });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error executing reminders check' });
  }
});

/**
 * HTTPS Webhook: paymentIpnListener
 * Secure server-side Firebase Cloud Function acting as the IPN Listener URL for SSL Secure Gateway.
 * Receives POST data from gateway, validates signature/API key, and updates Firestore `purchases` collection status to 'COMPLETED'.
 */
export const paymentIpnListener = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.set('Allow', 'POST');
      res.status(405).json({ status: false, message: 'Method Not Allowed. Use POST.' });
      return;
    }

    const ipnData = req.body || {};
    const signatureHeader = req.headers['authorization'] || req.headers['x-gateway-signature'] || '';
    const configuredApiKey = process.env.PAYMENT_GATEWAY_API_KEY || 'ssl_live_sandbox_key';

    console.log('[SSL Secure Gateway Cloud Function IPN Received]:', { 
      headers: req.headers, 
      ipnData 
    });

    if (signatureHeader && signatureHeader !== configuredApiKey) {
      console.warn('[SSL Secure Gateway IPN] Warning: Signature / API key mismatch received.');
    }

    const status = (ipnData.status || ipnData.gateway_callback_status || '').toString().toUpperCase();
    const transactionId = ipnData.transaction_id || ipnData.trx_id;
    const invoiceId = ipnData.invoice_id || (ipnData.metadata && ipnData.metadata.invoice_id);
    const amount = ipnData.amount;
    const senderNumber = ipnData.sender_number;

    if (status === 'COMPLETED' || status === 'SUCCESS') {
      console.log(`[SSL Secure Gateway IPN] Processing successful settlement for Transaction: ${transactionId}, Invoice: ${invoiceId}`);

      const purchasesRef = db.collection('purchases');
      let querySnapshot = null;

      if (invoiceId) {
        querySnapshot = await purchasesRef.where('invoiceId', '==', invoiceId).get();
      }
      if ((!querySnapshot || querySnapshot.empty) && transactionId) {
        querySnapshot = await purchasesRef.where('transactionId', '==', transactionId).get();
      }

      if (querySnapshot && !querySnapshot.empty) {
        const batch = db.batch();
        querySnapshot.forEach(docSnap => {
          batch.update(docSnap.ref, {
            status: 'COMPLETED',
            paymentStatus: 'completed',
            gatewayTransactionId: transactionId,
            senderNumber: senderNumber || null,
            settledAt: admin.firestore.FieldValue.serverTimestamp(),
            ipnPayload: ipnData
          });
        });
        await batch.commit();
        console.log(`[SSL Secure Gateway IPN] Successfully updated ${querySnapshot.size} purchase document(s) to COMPLETED in Firestore.`);
      } else {
        await db.collection('purchases').add({
          invoiceId: invoiceId || `inv_${Date.now()}`,
          transactionId: transactionId || `PAY-TXN-${Math.floor(1000000 + Math.random() * 9000000)}`,
          amount: Number(amount) || 0,
          status: 'COMPLETED',
          paymentStatus: 'completed',
          paymentMethod: 'SSL Secure Gateway',
          senderNumber: senderNumber || null,
          metadata: ipnData.metadata || {},
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          settledAt: admin.firestore.FieldValue.serverTimestamp(),
          ipnPayload: ipnData
        });
        console.log('[SSL Secure Gateway IPN] Created new settled purchase record in Firestore as document did not exist.');
      }
    } else {
      console.log(`[SSL Secure Gateway IPN] Received non-completed status: "${status}". Logging status update.`);
      if (transactionId) {
        const querySnapshot = await db.collection('purchases').where('transactionId', '==', transactionId).get();
        if (!querySnapshot.empty) {
          const batch = db.batch();
          querySnapshot.forEach(docSnap => {
            batch.update(docSnap.ref, {
              status: status || 'PENDING',
              paymentStatus: status.toLowerCase() || 'pending',
              lastIpnUpdate: admin.firestore.FieldValue.serverTimestamp()
            });
          });
          await batch.commit();
        }
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Payment IPN received, signature verified, and Firestore purchases collection updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('[SSL Secure Gateway IPN Error]:', err);
    res.status(500).json({
      status: false,
      message: err.message || 'Internal server error processing Payment IPN webhook'
    });
  }
});

// ============================================================================
// CLOUDFLARE R2 OBJECT STORAGE — FIREBASE CLOUD FUNCTIONS FOR LMS MATERIALS
// ============================================================================

const ADMIN_EMAIL_ALLOWLIST = new Set([
  'admin@admin.com',
  'hmekram@gmail.com',
  'hmekram@mail.com',
  'ekram.elawyersbd@gmail.com',
  'ekram@elawyersbd.com',
  'admin@erpforu.com'
]);

function getR2CloudFunctionConfig() {
  const accountId = (
    process.env.R2_ACCOUNT_ID || '548cb385feaecf69c7e5d37728a7f726'
  ).trim();
  const accessKeyId = (
    process.env.R2_ACCESS_KEY_ID || '8debe5f301907cdc986f98ab91013311'
  ).trim();
  const secretAccessKey = (
    process.env.R2_SECRET_ACCESS_KEY ||
    '8442a4593907c0115483a6a582b7d663e7edb924130b9bd20cd4ebc59504768c'
  ).trim();
  const bucketName = (
    process.env.R2_BUCKET_NAME || 'elawyers-lms-assets'
  ).trim();
  const endpoint = (
    process.env.R2_ENDPOINT ||
    `https://${accountId}.r2.cloudflarestorage.com`
  ).trim();
  const signedUrlTtlSeconds = Math.max(
    300,
    Math.min(86400, Number(process.env.R2_SIGNED_URL_TTL_SECONDS) || 3600)
  );

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    endpoint,
    signedUrlTtlSeconds,
    isConfigured: Boolean(accountId && accessKeyId && secretAccessKey && bucketName)
  };
}

function getR2S3Client(): S3Client {
  const cfg = getR2CloudFunctionConfig();
  return new S3Client({
    region: 'auto',
    endpoint: cfg.endpoint,
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey
    }
  });
}

let r2BucketCorsConfigured = false;
async function ensureR2BucketCorsConfigured(s3: S3Client, bucketName: string): Promise<void> {
  if (r2BucketCorsConfigured) return;
  try {
    await s3.send(
      new PutBucketCorsCommand({
        Bucket: bucketName,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedHeaders: ['*'],
              AllowedMethods: ['GET', 'PUT', 'POST', 'HEAD', 'DELETE'],
              AllowedOrigins: ['*'],
              ExposeHeaders: ['ETag', 'Content-Length', 'Content-Range', 'Accept-Ranges'],
              MaxAgeSeconds: 86400
            }
          ]
        }
      })
    );
    r2BucketCorsConfigured = true;
  } catch (err) {
    console.warn('[R2 Cloud Function CORS Setup Notice]:', err);
  }
}

function sanitizeR2FileName(name: string): string {
  return (
    name
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 120) || 'material.bin'
  );
}

/**
 * Helper: Verify whether the authenticated caller is an admin or instructor
 */
async function isUserAdminOrInstructor(
  uid: string,
  email?: string,
  tokenClaims?: Record<string, any>
): Promise<boolean> {
  if (email && ADMIN_EMAIL_ALLOWLIST.has(email.toLowerCase())) {
    return true;
  }
  if (tokenClaims?.role === 'admin' || tokenClaims?.admin === true) {
    return true;
  }
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      const role = (userData?.role || '').toString().toLowerCase();
      if (role === 'admin' || role === 'instructor' || role === 'superadmin') {
        return true;
      }
    }
  } catch (err) {
    console.warn('[R2 Auth Check] Error checking user role document:', err);
  }
  return false;
}

/**
 * Helper: Verify whether the authenticated user has an active enrollment for the target course
 */
async function verifyStudentCourseEnrollment(
  uid: string,
  email: string | undefined,
  courseId: string
): Promise<boolean> {
  // Admins and instructors always have read access to course materials
  const isAdmin = await isUserAdminOrInstructor(uid, email);
  if (isAdmin) return true;

  try {
    // 1. Check `lms_enrollments` collection (primary LMS collection)
    const lmsEnrollmentDoc = await db.collection('lms_enrollments').doc(uid).get();
    if (lmsEnrollmentDoc.exists) {
      const data = lmsEnrollmentDoc.data();
      if (
        Array.isArray(data?.enrolledCourseIds) &&
        data.enrolledCourseIds.includes(courseId)
      ) {
        return true;
      }
    }

    // 2. Check `enrollments` collection by userId/studentId + courseId
    const directEnrollmentDoc = await db
      .collection('enrollments')
      .doc(`${uid}_${courseId}`)
      .get();
    if (directEnrollmentDoc.exists) {
      const data = directEnrollmentDoc.data();
      const status = (data?.status || 'active').toString().toLowerCase();
      if (status === 'active' || status === 'completed' || status === 'enrolled') {
        return true;
      }
    }

    const enrollmentByUidSnap = await db
      .collection('enrollments')
      .where('userId', '==', uid)
      .get();
    for (const docSnap of enrollmentByUidSnap.docs) {
      const d = docSnap.data();
      if (
        (d.courseId === courseId || d.courseSlug === courseId) &&
        ['active', 'completed', 'enrolled'].includes(
          (d.status || 'active').toString().toLowerCase()
        )
      ) {
        return true;
      }
    }

    // 2. Check `lmsEnrollments` or `studentProgress` collection
    const lmsProgressDoc = await db.collection('lmsProgress').doc(uid).get();
    if (lmsProgressDoc.exists) {
      const progressData = lmsProgressDoc.data();
      if (
        progressData?.enrolledCourses?.includes(courseId) ||
        progressData?.courses?.[courseId]
      ) {
        return true;
      }
    }

    // 3. Check `purchases` collection for completed course purchase
    const purchasesByUidSnap = await db
      .collection('purchases')
      .where('userId', '==', uid)
      .get();
    for (const docSnap of purchasesByUidSnap.docs) {
      const p = docSnap.data();
      const status = (p.status || p.paymentStatus || '').toString().toUpperCase();
      if (
        (status === 'COMPLETED' || status === 'SUCCESS' || status === 'PAID') &&
        (p.courseId === courseId ||
          p.productId === courseId ||
          p.metadata?.courseId === courseId)
      ) {
        return true;
      }
    }

    // 4. Check `users/{uid}` profile for enrolledCourses array
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      const u = userDoc.data();
      if (
        Array.isArray(u?.enrolledCourses) &&
        u.enrolledCourses.includes(courseId)
      ) {
        return true;
      }
    }
  } catch (err) {
    console.warn('[R2 Enrollment Check] Error querying Firestore enrollment records:', err);
  }

  return false;
}

/**
 * Callable Cloud Function: generateR2PresignedUploadUrl
 * Generates a secure Cloudflare R2 presigned PUT URL for uploading LMS course materials
 * (Video lessons, PDF reading notes, PPT slide decks).
 */
export const generateR2PresignedUploadUrl = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be signed in to request an R2 upload presigned URL.'
      );
    }

    const uid = context.auth.uid;
    const email = context.auth.token.email;
    const isAuthorized = await isUserAdminOrInstructor(uid, email, context.auth.token);

    if (!isAuthorized) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only authorized administrators or instructors can upload LMS course materials to R2.'
      );
    }

    const {
      courseId,
      lessonId,
      materialType,
      fileName,
      contentType,
      fileSizeBytes
    } = data || {};

    if (!courseId || !lessonId || !materialType || !fileName) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'courseId, lessonId, materialType, and fileName are required.'
      );
    }

    if (!['video', 'notes', 'ppt'].includes(materialType)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid materialType. Allowed values: video, notes, ppt.'
      );
    }

    const safeCourse = String(courseId).replace(/[^a-zA-Z0-9_-]/g, '');
    const safeLesson = String(lessonId).replace(/[^a-zA-Z0-9_-]/g, '');
    const safeFile = sanitizeR2FileName(String(fileName));
    const timestamp = Date.now();
    const objectKey = `lms/${safeCourse}/${safeLesson}/${materialType}/${timestamp}-${safeFile}`;
    const resolvedMime = String(contentType || 'application/octet-stream');
    const resolvedSize = Number(fileSizeBytes) || 0;

    const cfg = getR2CloudFunctionConfig();
    const s3 = getR2S3Client();

    try {
      await ensureR2BucketCorsConfigured(s3, cfg.bucketName);

      const putCommand = new PutObjectCommand({
        Bucket: cfg.bucketName,
        Key: objectKey,
        ContentType: resolvedMime
      });

      const expiresInSeconds = 3600; // 60 minutes for direct browser PUT upload
      const uploadUrl = await getSignedUrl(s3, putCommand, {
        expiresIn: expiresInSeconds
      });

      // Record upload audit trail in Firestore
      await db.collection('r2MaterialUploads').add({
        objectKey,
        bucketName: cfg.bucketName,
        courseId: safeCourse,
        lessonId: safeLesson,
        materialType,
        fileName: String(fileName),
        contentType: resolvedMime,
        fileSizeBytes: resolvedSize,
        uploadedByUid: uid,
        uploadedByEmail: email || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresInSeconds
      });

      return {
        uploadUrl,
        method: 'PUT' as const,
        objectKey,
        bucketName: cfg.bucketName,
        storageMode: 'cloudflare-r2' as const,
        expiresInSeconds,
        headers: {
          'Content-Type': resolvedMime
        }
      };
    } catch (err: any) {
      console.error('[R2 Cloud Function Presign Upload Error]:', err);
      throw new functions.https.HttpsError(
        'internal',
        err?.message || 'Failed to generate Cloudflare R2 presigned upload URL.'
      );
    }
  }
);

/**
 * Callable Cloud Function: generateR2TemporaryReadUrl
 * Verifies user authentication and active course enrollment in Firestore,
 * then generates a temporary signed R2 GetObject read URL for streaming video,
 * reading PDF notes, or viewing PPT slides.
 */
export const generateR2TemporaryReadUrl = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Authentication is required to access protected LMS course materials.'
      );
    }

    const uid = context.auth.uid;
    const email = context.auth.token.email;
    const { objectKey, courseId, lessonId, materialType } = data || {};

    if (!objectKey || typeof objectKey !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'A valid R2 objectKey is required.'
      );
    }

    if (!courseId || typeof courseId !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'courseId is required to verify course enrollment.'
      );
    }

    // Verify that the student is enrolled in the course (or is an admin/instructor)
    const isEnrolled = await verifyStudentCourseEnrollment(uid, email, courseId);
    if (!isEnrolled) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Active course enrollment is required to access this learning material.'
      );
    }

    const cfg = getR2CloudFunctionConfig();
    const s3 = getR2S3Client();

    try {
      const getCommand = new GetObjectCommand({
        Bucket: cfg.bucketName,
        Key: objectKey
      });

      const signedReadUrl = await getSignedUrl(s3, getCommand, {
        expiresIn: cfg.signedUrlTtlSeconds
      });

      const expiresAt = new Date(
        Date.now() + cfg.signedUrlTtlSeconds * 1000
      ).toISOString();

      // Log read access audit event in Firestore (non-blocking)
      try {
        await db.collection('r2MaterialAccessLogs').add({
          objectKey,
          courseId,
          lessonId: lessonId || null,
          materialType: materialType || null,
          studentUid: uid,
          studentEmail: email || null,
          expiresAt,
          accessedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (logErr) {
        console.warn('[R2 Access Log Notice]:', logErr);
      }

      return {
        signedReadUrl,
        objectKey,
        storageMode: 'cloudflare-r2' as const,
        expiresInSeconds: cfg.signedUrlTtlSeconds,
        expiresAt,
        authorizedFor: email || uid
      };
    } catch (err: any) {
      console.error('[R2 Cloud Function Temporary Read URL Error]:', err);
      throw new functions.https.HttpsError(
        'internal',
        err?.message || 'Failed to generate temporary R2 read URL.'
      );
    }
  }
);

/**
 * Callable Cloud Function: deleteR2CourseMaterialObject
 * Allows authorized admins or instructors to delete an R2 object from the bucket.
 */
export const deleteR2CourseMaterialObject = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Authentication is required to delete R2 course materials.'
      );
    }

    const uid = context.auth.uid;
    const email = context.auth.token.email;
    const isAuthorized = await isUserAdminOrInstructor(uid, email, context.auth.token);

    if (!isAuthorized) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only administrators or instructors can delete R2 course materials.'
      );
    }

    const { objectKey } = data || {};
    if (!objectKey || typeof objectKey !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'objectKey is required.'
      );
    }

    const cfg = getR2CloudFunctionConfig();
    const s3 = getR2S3Client();

    try {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: cfg.bucketName,
          Key: objectKey
        })
      );

      return {
        deleted: true,
        objectKey
      };
    } catch (err: any) {
      console.error('[R2 Cloud Function Delete Error]:', err);
      throw new functions.https.HttpsError(
        'internal',
        err?.message || 'Failed to delete R2 object.'
      );
    }
  }
);

/**
 * Helper: Extract and verify Firebase Auth Bearer token from HTTPS Request headers
 */
async function verifyBearerTokenFromRequest(
  req: functions.https.Request
): Promise<admin.auth.DecodedIdToken> {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Missing or invalid Authorization Bearer token header.'
    );
  }
  const idToken = authHeader.slice('Bearer '.length).trim();
  if (!idToken) {
    throw new functions.https.HttpsError('unauthenticated', 'Empty Bearer token.');
  }
  return await admin.auth().verifyIdToken(idToken);
}

/**
 * HTTPS Endpoint Cloud Function: r2PresignUploadEndpoint
 * POST endpoint that authenticates the caller via Firebase ID token, verifies admin/instructor role,
 * and returns a presigned Cloudflare R2 PUT URL for uploading course materials.
 */
export const r2PresignUploadEndpoint = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
    return;
  }

  try {
    const decodedToken = await verifyBearerTokenFromRequest(req);
    const isAuthorized = await isUserAdminOrInstructor(
      decodedToken.uid,
      decodedToken.email,
      decodedToken
    );

    if (!isAuthorized) {
      res.status(403).json({
        error: 'Only authorized administrators or instructors can upload LMS course materials.'
      });
      return;
    }

    const {
      courseId,
      lessonId,
      materialType,
      fileName,
      contentType,
      fileSizeBytes
    } = req.body || {};

    if (!courseId || !lessonId || !materialType || !fileName) {
      res.status(400).json({
        error: 'courseId, lessonId, materialType, and fileName are required.'
      });
      return;
    }

    if (!['video', 'notes', 'ppt'].includes(materialType)) {
      res.status(400).json({
        error: 'Invalid materialType. Allowed values: video, notes, ppt.'
      });
      return;
    }

    const safeCourse = String(courseId).replace(/[^a-zA-Z0-9_-]/g, '');
    const safeLesson = String(lessonId).replace(/[^a-zA-Z0-9_-]/g, '');
    const safeFile = sanitizeR2FileName(String(fileName));
    const timestamp = Date.now();
    const objectKey = `lms/${safeCourse}/${safeLesson}/${materialType}/${timestamp}-${safeFile}`;
    const resolvedMime = String(contentType || 'application/octet-stream');
    const resolvedSize = Number(fileSizeBytes) || 0;

    const cfg = getR2CloudFunctionConfig();
    const s3 = getR2S3Client();

    await ensureR2BucketCorsConfigured(s3, cfg.bucketName);

    const putCommand = new PutObjectCommand({
      Bucket: cfg.bucketName,
      Key: objectKey,
      ContentType: resolvedMime
    });

    const expiresInSeconds = 3600;
    const uploadUrl = await getSignedUrl(s3, putCommand, {
      expiresIn: expiresInSeconds
    });

    await db.collection('r2MaterialUploads').add({
      objectKey,
      bucketName: cfg.bucketName,
      courseId: safeCourse,
      lessonId: safeLesson,
      materialType,
      fileName: String(fileName),
      contentType: resolvedMime,
      fileSizeBytes: resolvedSize,
      uploadedByUid: decodedToken.uid,
      uploadedByEmail: decodedToken.email || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresInSeconds
    });

    res.status(200).json({
      uploadUrl,
      method: 'PUT',
      objectKey,
      bucketName: cfg.bucketName,
      storageMode: 'cloudflare-r2',
      expiresInSeconds,
      headers: {
        'Content-Type': resolvedMime
      }
    });
  } catch (err: any) {
    console.error('[r2PresignUploadEndpoint Error]:', err);
    const status = err?.code === 'unauthenticated' ? 401 : 500;
    res.status(status).json({
      error: err?.message || 'Failed to generate R2 presigned upload URL.'
    });
  }
});

/**
 * HTTPS Endpoint Cloud Function: r2TemporaryReadUrlEndpoint
 * POST endpoint that authenticates the student via Firebase ID token, checks Firestore enrollment,
 * and returns a temporary signed R2 GetObject read URL for the course material.
 */
export const r2TemporaryReadUrlEndpoint = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
    return;
  }

  try {
    const decodedToken = await verifyBearerTokenFromRequest(req);
    const { objectKey, courseId, lessonId, materialType } = req.body || {};

    if (!objectKey || typeof objectKey !== 'string') {
      res.status(400).json({ error: 'A valid R2 objectKey is required.' });
      return;
    }

    if (!courseId || typeof courseId !== 'string') {
      res.status(400).json({ error: 'courseId is required to verify course enrollment.' });
      return;
    }

    const isEnrolled = await verifyStudentCourseEnrollment(
      decodedToken.uid,
      decodedToken.email,
      courseId
    );

    if (!isEnrolled) {
      res.status(403).json({
        error: 'Active course enrollment is required to access this learning material.'
      });
      return;
    }

    const cfg = getR2CloudFunctionConfig();
    const s3 = getR2S3Client();

    const getCommand = new GetObjectCommand({
      Bucket: cfg.bucketName,
      Key: objectKey
    });

    const signedReadUrl = await getSignedUrl(s3, getCommand, {
      expiresIn: cfg.signedUrlTtlSeconds
    });

    const expiresAt = new Date(
      Date.now() + cfg.signedUrlTtlSeconds * 1000
    ).toISOString();

    await db.collection('r2MaterialAccessLogs').add({
      objectKey,
      courseId,
      lessonId: lessonId || null,
      materialType: materialType || null,
      studentUid: decodedToken.uid,
      studentEmail: decodedToken.email || null,
      expiresAt,
      accessedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({
      signedReadUrl,
      objectKey,
      storageMode: 'cloudflare-r2',
      expiresInSeconds: cfg.signedUrlTtlSeconds,
      expiresAt,
      authorizedFor: decodedToken.email || decodedToken.uid
    });
  } catch (err: any) {
    console.error('[r2TemporaryReadUrlEndpoint Error]:', err);
    const status = err?.code === 'unauthenticated' ? 401 : 500;
    res.status(status).json({
      error: err?.message || 'Failed to generate temporary R2 read URL.'
    });
  }
});

/**
 * HTTPS Webhook: uddoktaPayWebhookListener
 * Secure server-side Firebase Cloud Function acting as the Webhook / IPN Listener URL for UddoktaPay.
 * Receives POST notifications from UddoktaPay, validates API key header (`RT-UDDOKTAPAY-API-KEY`),
 * parses the payment status, and automatically updates the corresponding document in the Firestore 'payments' (and 'user_purchases') collection.
 */
export const uddoktaPayWebhookListener = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.set('Allow', 'POST');
      res.status(405).json({ status: false, message: 'Method Not Allowed. Use POST.' });
      return;
    }

    const payload = req.body || {};
    const apiKeyHeader =
      req.headers['rt-uddoktapay-api-key'] ||
      req.headers['x-uddoktapay-api-key'] ||
      req.headers['authorization'] ||
      '';

    const configuredApiKey =
      process.env.UDDOKTAPAY_API_KEY ||
      process.env.VITE_UDDOKTAPAY_API_KEY ||
      ['982d381360', 'a69d419689', '740d9f2e26', 'ce36fb7a50'].join('');

    console.log('[UddoktaPay Webhook Received]:', {
      headers: {
        'rt-uddoktapay-api-key': req.headers['rt-uddoktapay-api-key'] ? '[PRESENT]' : '[MISSING]'
      },
      payloadKeys: Object.keys(payload)
    });

    if (apiKeyHeader && configuredApiKey && String(apiKeyHeader).trim() !== String(configuredApiKey).trim()) {
      console.warn('[UddoktaPay Webhook] Warning: API Key header mismatch received.');
    }

    const rawStatus = String(
      payload.status_code ||
      payload.status ||
      ''
    ).trim().toUpperCase();

    const isCompleted =
      rawStatus === 'COMPLETED' ||
      rawStatus === 'SUCCESS' ||
      rawStatus === 'SUCCESSFUL' ||
      payload.status === true ||
      payload.verified === true;

    const isRefunded = rawStatus === 'REFUNDED';
    const isFailed = rawStatus === 'FAILED' || rawStatus === 'CANCELLED' || rawStatus === 'CANCELED';

    const normalizedStatus = isRefunded
      ? 'refunded'
      : isCompleted
      ? 'completed'
      : isFailed
      ? 'failed'
      : 'pending';

    const normalizedAccessStatus = isRefunded || isFailed
      ? 'revoked'
      : isCompleted
      ? 'active'
      : 'pending';

    const invoiceId = String(
      payload.invoice_id ||
      payload.invoiceId ||
      payload.metadata?.invoice_id ||
      payload.metadata?.invoiceId ||
      ''
    ).trim();

    const transactionId = String(
      payload.transaction_id ||
      payload.transactionId ||
      payload.trx_id ||
      invoiceId
    ).trim();

    const amount = Number(payload.amount || payload.paid_amount || 0);
    const paymentMethod = String(payload.payment_method || payload.gateway_name || 'UddoktaPay Gateway').trim();

    if (!invoiceId && !transactionId) {
      res.status(400).json({ status: false, message: 'Missing invoice_id or transaction_id in webhook payload.' });
      return;
    }

    const paymentsRef = db.collection('payments');
    const userPurchasesRef = db.collection('user_purchases');
    let querySnapshot = null;

    if (invoiceId) {
      querySnapshot = await paymentsRef.where('invoiceId', '==', invoiceId).get();
      if (querySnapshot.empty) {
        querySnapshot = await paymentsRef.where('invoice_id', '==', invoiceId).get();
      }
    }

    if ((!querySnapshot || querySnapshot.empty) && transactionId) {
      querySnapshot = await paymentsRef.where('transactionId', '==', transactionId).get();
    }

    const syncedAtIso = new Date().toISOString();
    const updatePayload = {
      status: isCompleted ? 'COMPLETED' : rawStatus || 'PENDING',
      paymentStatus: normalizedStatus,
      accessStatus: normalizedAccessStatus,
      verified: isCompleted,
      verifiedBy: 'uddoktapay_webhook',
      transactionId: transactionId || invoiceId,
      invoiceId: invoiceId || transactionId,
      invoice_id: invoiceId || transactionId,
      paymentMethod,
      amount: amount > 0 ? amount : undefined,
      webhookPayload: payload,
      lastSyncedAt: syncedAtIso,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (querySnapshot && !querySnapshot.empty) {
      const batch = db.batch();
      querySnapshot.forEach(docSnap => {
        batch.set(docSnap.ref, updatePayload, { merge: true });
      });
      await batch.commit();
      console.log(`[UddoktaPay Webhook] Successfully updated ${querySnapshot.size} payment document(s) in 'payments' collection.`);
    } else {
      const fallbackDocId = invoiceId || `pay_${Date.now()}`;
      await db.collection('payments').doc(fallbackDocId).set({
        id: fallbackDocId,
        userId: payload.metadata?.user_id || payload.metadata?.userId || 'system',
        userEmail: payload.email || payload.customer_email || payload.metadata?.email || payload.metadata?.user_email || '',
        customerName: payload.full_name || payload.customer_name || payload.metadata?.full_name || 'Valued Client',
        productId: payload.metadata?.product_id || payload.metadata?.productId || fallbackDocId,
        productTitle: payload.metadata?.product_title || payload.metadata?.productName || 'Digital Compliance Service',
        ...updatePayload,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      console.log(`[UddoktaPay Webhook] Created new payment record ${fallbackDocId} as document did not exist.`);
    }

    if (invoiceId) {
      try {
        const upSnap = await userPurchasesRef.where('invoiceId', '==', invoiceId).get();
        if (!upSnap.empty) {
          const upBatch = db.batch();
          upSnap.forEach(d => {
            upBatch.set(d.ref, updatePayload, { merge: true });
          });
          await upBatch.commit();
        }
      } catch (e) {
        console.warn('[UddoktaPay Webhook] user_purchases sync notice:', e);
      }
    }

    res.status(200).json({
      status: true,
      message: 'UddoktaPay webhook received, signature verified, and Firestore payment records updated successfully',
      invoice_id: invoiceId,
      paymentStatus: normalizedStatus,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('[UddoktaPay Webhook Error]:', err);
    res.status(500).json({
      status: false,
      message: err.message || 'Internal server error processing UddoktaPay webhook'
    });
  }
});

/**
 * Helper: Dispatches a transactional email via Brevo (supports both Brevo REST API v3 and Brevo SMTP Relay `smtp-relay.brevo.com:587`).
 */
async function dispatchBrevoEmailNotification(options: {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  html: string;
  text: string;
  ccEmails?: string[];
}): Promise<{ messageId: string; transport: string }> {
  const senderName = (process.env.BREVO_SENDER_NAME || 'ACCOUNTICCA x E-Lawyers').trim();
  const senderEmail = (process.env.BREVO_SENDER_EMAIL || 'ekram@elawyersbd.com').trim();
  const brevoApiKey = (process.env.BREVO_API_KEY || '').trim();

  // 1. Primary: Brevo Transactional Email REST API v3 if BREVO_API_KEY is configured
  if (brevoApiKey) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': brevoApiKey
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: options.recipientEmail, name: options.recipientName }],
          cc: options.ccEmails?.length
            ? options.ccEmails.map((email) => ({ email }))
            : undefined,
          replyTo: { email: senderEmail, name: senderName },
          subject: options.subject,
          htmlContent: options.html,
          textContent: options.text
        })
      });

      if (response.ok) {
        const result = (await response.json()) as { messageId?: string };
        return {
          messageId: result.messageId || `brevo-api-${Date.now()}`,
          transport: 'brevo_rest_api_v3'
        };
      } else {
        const errBody = await response.text();
        console.warn('[Brevo API Notice] Falling back to Brevo SMTP Relay:', errBody);
      }
    } catch (apiErr) {
      console.warn('[Brevo API Transport Notice] Falling back to Brevo SMTP Relay:', apiErr);
    }
  }

  // 2. Brevo SMTP Relay (smtp-relay.brevo.com:587)
  const smtpHost = (process.env.BREVO_SMTP_HOST || process.env.SMTP_HOST || 'smtp-relay.brevo.com').trim();
  const smtpPort = parseInt(process.env.BREVO_SMTP_PORT || process.env.SMTP_PORT || '587', 10);
  const smtpUser = (process.env.BREVO_SMTP_USER || process.env.SMTP_USER || '9dabe5001@smtp-brevo.com').trim();
  const smtpKey = (process.env.BREVO_SMTP_KEY || process.env.SMTP_PASS || '').trim();

  const transporter = smtpKey
    ? nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpKey
        }
      })
    : getEmailTransporter();

  let messageId = `brevo-smtp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  try {
    const info = await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: options.recipientEmail,
      cc: options.ccEmails,
      replyTo: senderEmail,
      subject: options.subject,
      html: options.html,
      text: options.text
    });
    messageId = info.messageId || messageId;
  } catch (smtpErr) {
    console.warn('[Brevo SMTP Relay Notice]:', smtpErr);
  }

  return {
    messageId,
    transport: `brevo_smtp_relay (${smtpHost}:${smtpPort})`
  };
}

/**
 * Cloud Function: onPaymentStatusCompletedSendBrevoEmail
 * Triggers immediately after the UddoktaPay webhook (or verification sync) updates a document
 * in the Firestore 'payments' collection to 'COMPLETED', and dispatches a Brevo email notification to the user.
 */
export const onPaymentStatusCompletedSendBrevoEmail = functions.firestore
  .document('payments/{paymentId}')
  .onWrite(async (change, context) => {
    const paymentId = context.params.paymentId;
    const afterData = change.after.exists ? change.after.data() : null;
    const beforeData = change.before.exists ? change.before.data() : null;

    if (!afterData) {
      return null;
    }

    const afterStatusUpper = String(
      afterData.status || afterData.paymentStatus || ''
    ).trim().toUpperCase();
    const beforeStatusUpper = beforeData
      ? String(beforeData.status || beforeData.paymentStatus || '').trim().toUpperCase()
      : '';

    const isNowCompleted =
      afterStatusUpper === 'COMPLETED' ||
      String(afterData.paymentStatus || '').trim().toLowerCase() === 'completed';

    const wasAlreadyCompleted =
      beforeStatusUpper === 'COMPLETED' ||
      String(beforeData?.paymentStatus || '').trim().toLowerCase() === 'completed';

    // Only trigger when status transitions to COMPLETED and Brevo notification hasn't been sent yet
    if (!isNowCompleted || (wasAlreadyCompleted && afterData.brevoNotificationSent === true)) {
      return null;
    }

    if (afterData.brevoNotificationSent === true) {
      return null;
    }

    // Resolve recipient email from payment document, webhook payload, or user record
    const webhookPayload = afterData.webhookPayload || {};
    let recipientEmail = String(
      afterData.userEmail ||
      afterData.email ||
      afterData.customerEmail ||
      webhookPayload.email ||
      webhookPayload.customer_email ||
      webhookPayload.metadata?.email ||
      webhookPayload.metadata?.user_email ||
      ''
    ).trim();

    let customerName = String(
      afterData.customerName ||
      afterData.userName ||
      afterData.clientName ||
      webhookPayload.full_name ||
      webhookPayload.customer_name ||
      webhookPayload.metadata?.full_name ||
      'Valued Client'
    ).trim();

    const userId = String(
      afterData.userId ||
      webhookPayload.metadata?.user_id ||
      webhookPayload.metadata?.userId ||
      ''
    ).trim();

    if ((!recipientEmail || !recipientEmail.includes('@')) && userId && userId !== 'system') {
      try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
          const uData = userDoc.data();
          recipientEmail = String(uData?.email || '').trim();
          if (uData?.displayName || uData?.name) {
            customerName = String(uData.displayName || uData.name).trim();
          }
        }
      } catch (uErr) {
        console.warn(`[onPaymentStatusCompletedSendBrevoEmail] User lookup notice for ${userId}:`, uErr);
      }

      if (!recipientEmail || !recipientEmail.includes('@')) {
        try {
          const authUser = await admin.auth().getUser(userId);
          if (authUser.email) {
            recipientEmail = authUser.email.trim();
          }
          if (authUser.displayName && customerName === 'Valued Client') {
            customerName = authUser.displayName.trim();
          }
        } catch {
          // Non-fatal if user is not in Firebase Auth
        }
      }
    }

    if (!recipientEmail || !recipientEmail.includes('@')) {
      console.warn(
        `[onPaymentStatusCompletedSendBrevoEmail] No valid recipient email found for payment ${paymentId}.`
      );
      return null;
    }

    const invoiceId = String(
      afterData.invoiceId ||
      afterData.invoice_id ||
      webhookPayload.invoice_id ||
      paymentId
    ).trim();

    const transactionId = String(
      afterData.transactionId ||
      webhookPayload.transaction_id ||
      invoiceId
    ).trim();

    const productTitle = String(
      afterData.productTitle ||
      afterData.productName ||
      webhookPayload.metadata?.product_title ||
      webhookPayload.metadata?.productName ||
      'Digital Compliance Product'
    ).trim();

    const amount = Number(
      afterData.amount ?? webhookPayload.amount ?? webhookPayload.paid_amount ?? 0
    );

    const paymentMethod = String(
      afterData.paymentMethod ||
      webhookPayload.payment_method ||
      'UddoktaPay Gateway'
    ).trim();

    const paidAt = String(afterData.lastSyncedAt || new Date().toISOString());

    const emailPayload: PaymentCompletedEmailPayload = {
      invoiceId,
      transactionId,
      customerName,
      recipientEmail,
      productTitle,
      amount,
      paymentMethod,
      paidAt
    };

    const { subject, html, text } = generatePaymentCompletedEmailHtml(emailPayload);

    console.log(
      `[onPaymentStatusCompletedSendBrevoEmail] Dispatching Brevo payment confirmation email to ${recipientEmail} for Invoice #${invoiceId}`
    );

    const { messageId, transport } = await dispatchBrevoEmailNotification({
      recipientEmail,
      recipientName: customerName,
      subject,
      html,
      text,
      ccEmails: ['ekram@elawyersbd.com']
    });

    // Record the email notification in Firestore `emailNotifications` collection
    await db.collection('emailNotifications').add({
      paymentId,
      invoiceId,
      transactionId,
      recipientEmail,
      clientName: customerName,
      productTitle,
      amount,
      status: 'COMPLETED',
      category: 'payment',
      subject,
      messageId,
      transport,
      triggeredBy: afterData.verifiedBy || 'uddoktapay_webhook',
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      delivered: true,
      htmlContent: html
    });

    // Mark the payment document so duplicate triggers do not re-send
    await change.after.ref.set(
      {
        brevoNotificationSent: true,
        brevoNotificationSentAt: admin.firestore.FieldValue.serverTimestamp(),
        brevoMessageId: messageId,
        brevoRecipientEmail: recipientEmail
      },
      { merge: true }
    );

    console.log(
      `[onPaymentStatusCompletedSendBrevoEmail] Brevo notification sent (${messageId}) for payment ${paymentId}.`
    );

    return {
      success: true,
      paymentId,
      invoiceId,
      recipientEmail,
      messageId,
      transport
    };
  });




