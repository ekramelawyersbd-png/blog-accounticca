# Firebase Cloud Functions: Automated Appointment Email Notification System

This directory houses the Firebase Cloud Function suite responsible for automated, instant email notifications to users whenever an appointment consultation docket transitions to **Confirmed** or **Cancelled**.

## Architecture & Lifecycle

1. **Firestore Trigger (`onAppointmentStatusUpdated`)**:
   - Listens to changes on `appointments/{appointmentId}` via `functions.firestore.document('appointments/{appointmentId}').onUpdate(...)`.
   - Compares `before.data().status` with `after.data().status`.
   - When the status changes to `'Confirmed'` or `'Cancelled'`:
     - Compiles the official chamber email using `generateAppointmentEmailHtml`.
     - Delivers the email to the client recipient (`email` or `userEmail`).
     - Logs the delivery audit record to Firestore `emailNotifications` collection.
     - Stamps the appointment document with `lastNotification` delivery metadata.

2. **Scheduled Cloud Function (`checkUpcomingAppointmentReminders`)**:
   - Runs periodically on a schedule (`every 1 hours`, timezone: `Asia/Dhaka`).
   - Scans the `appointments` collection for confirmed consultations occurring within the next 24 hours.
   - For any upcoming session where `reminderSent !== true`, dispatches the official 24-hour reminder notice using `generateAppointmentReminderEmailHtml`.
   - Records the delivery receipt in `emailNotifications` with `status: 'Reminder_24h'` and stamps the appointment document with `reminderSent: true` and `lastReminderSentAt`.
   - Also available as a callable function `triggerAppointmentRemindersScan` and HTTPS webhook `scanUpcomingRemindersHttp` for testing or on-demand execution.

3. **Callable Function (`sendAppointmentStatusEmail`)**:
   - Allows authenticated web applications or admin dashboards to invoke and trigger notifications on demand.

4. **Email Templates**:
   - Includes Chamber crest, Docket reference ID, Practice area badge, Date & Time (BST), Google Meet video link or physical chamber suite clearance directions, and legal disclaimer pursuant to Bangladesh Bar Council regulations.

## Deployment Instructions

```bash
# Install functions dependencies
cd functions
npm install

# Test TypeScript compilation
npm run build

# Deploy to Firebase project
firebase deploy --only functions
```

## Environment Variables (Optional SMTP)

By default, the Cloud Function uses a secure development transport. To connect production SMTP (e.g., Google Workspace, SendGrid, Amazon SES):

```bash
firebase functions:config:set smtp.host="smtp.gmail.com" smtp.port="587" smtp.user="appointments@accounticca.com" smtp.pass="YOUR_APP_PASSWORD"
```
Or define in `.env` inside `functions/`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=appointments@accounticca.com
SMTP_PASS=YOUR_APP_PASSWORD
SENDER_EMAIL="ELA & Associates Chambers" <appointments@accounticca.com>
```
