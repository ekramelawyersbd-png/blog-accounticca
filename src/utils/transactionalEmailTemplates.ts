export type TransactionalEmailCategory = 'registration' | 'booking' | 'payment';

export interface EmailPlaceholderDefinition {
  key: string;
  token: string;
  label: string;
  description: string;
  sampleValue: string;
  isCustom?: boolean;
}

export interface TransactionalEmailTemplate {
  id: string;
  category: TransactionalEmailCategory;
  name: string;
  description: string;
  triggerEvent: string;
  enabled: boolean;
  ccAdmin: boolean;
  subjectTemplate: string;
  htmlTemplate: string;
  textTemplate: string;
  placeholders: EmailPlaceholderDefinition[];
  updatedAt: string;
  updatedBy?: string;
}

export const DEFAULT_TRANSACTIONAL_EMAIL_TEMPLATES: TransactionalEmailTemplate[] = [
  // ============================================================================
  // 1. REGISTRATION — CLIENT & PORTAL ACCOUNT WELCOME
  // ============================================================================
  {
    id: 'registration_welcome',
    category: 'registration',
    name: 'Client Account Registration & Welcome',
    description: 'Sent automatically via Brevo SMTP when a new user registers an account on the Compliance Hub & Client Portal.',
    triggerEvent: 'User Account Sign-Up (/auth)',
    enabled: true,
    ccAdmin: true,
    subjectTemplate: 'Welcome to {{firmName}} — Your Client Portal Account is Active [{{referenceId}}]',
    htmlTemplate: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to {{firmName}}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.06);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #064e3b 0%, #0f172a 100%); padding: 32px 32px 28px 32px; color: #ffffff;">
              <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #34d399; margin-bottom: 8px;">
                {{firmName}} • Client Registry
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; line-height: 1.3;">
                Welcome to Your Legal &amp; Tax Compliance Portal
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: #cbd5e1;">
                Account Reference: <strong style="color: #6ee7b7; font-family: monospace;">{{referenceId}}</strong>
              </p>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                Dear <strong>{{clientName}}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Thank you for registering with <strong>{{firmName}}</strong>. Your client portal profile has been provisioned and gives you direct access to Bangladesh Income Tax calculators, VAT &amp; TDS schedules, RJSC corporate tools, and digital legal templates.
              </p>

              <!-- Account Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 12px;">
                      Registered Account Summary
                    </div>
                    <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; color: #1e293b;">
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; width: 40%;">Full Name:</td>
                        <td style="padding: 6px 0; font-weight: 700;">{{clientName}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; border-top: 1px solid #f1f5f9;">Registered Email:</td>
                        <td style="padding: 6px 0; font-weight: 700; border-top: 1px solid #f1f5f9;">{{clientEmail}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; border-top: 1px solid #f1f5f9;">Account Role:</td>
                        <td style="padding: 6px 0; font-weight: 700; color: #059669; border-top: 1px solid #f1f5f9;">{{accountRole}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; border-top: 1px solid #f1f5f9;">Registration Date:</td>
                        <td style="padding: 6px 0; font-weight: 600; border-top: 1px solid #f1f5f9;">{{registrationDate}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 28px 0;">
                <a href="{{portalUrl}}" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 13px 28px; border-radius: 10px;">
                  Open Client Compliance Portal &rarr;
                </a>
              </div>

              <p style="margin: 20px 0 0 0; font-size: 13px; line-height: 1.6; color: #64748b;">
                Need immediate legal or tax advisory? Reply directly to this email at <a href="mailto:{{firmDeskEmail}}" style="color: #059669; font-weight: 600;">{{firmDeskEmail}}</a> or call our chambers at <strong>{{firmPhone}}</strong>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 700; color: #334155;">
                {{firmName}}
              </p>
              <p style="margin: 0; font-size: 11px; color: #64748b;">
                {{officeAddress}}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    textTemplate: `Welcome to {{firmName}} ({{referenceId}})

Dear {{clientName}},

Your client portal account ({{clientEmail}}) has been registered on {{registrationDate}} with role: {{accountRole}}.

Access your Client Compliance Portal: {{portalUrl}}

Contact Desk: {{firmDeskEmail}} | {{firmPhone}}
{{officeAddress}}`,
    placeholders: [
      { key: 'clientName', token: '{{clientName}}', label: 'Client Name', description: 'Full name of the registered user', sampleValue: 'Md. Tanvir Ahmed' },
      { key: 'clientEmail', token: '{{clientEmail}}', label: 'Client Email', description: 'Registered email address', sampleValue: 'tanvir.ahmed@example.com' },
      { key: 'accountRole', token: '{{accountRole}}', label: 'Account Role', description: 'Assigned portal role', sampleValue: 'Verified Client Member' },
      { key: 'registrationDate', token: '{{registrationDate}}', label: 'Registration Date', description: 'Formatted date of registration', sampleValue: 'October 28, 2026' },
      { key: 'referenceId', token: '{{referenceId}}', label: 'Reference ID', description: 'Unique registration reference ID', sampleValue: 'REG-2026-8492' },
      { key: 'portalUrl', token: '{{portalUrl}}', label: 'Portal URL', description: 'Direct link to client dashboard', sampleValue: 'https://blog.accounticca.com/client-portal' },
      { key: 'firmName', token: '{{firmName}}', label: 'Firm Name', description: 'Official organization name', sampleValue: 'ACCOUNTICCA x E-Lawyers' },
      { key: 'firmDeskEmail', token: '{{firmDeskEmail}}', label: 'Firm Desk Email', description: 'Verified sender / support email', sampleValue: 'ekram@elawyersbd.com' },
      { key: 'firmPhone', token: '{{firmPhone}}', label: 'Firm Phone', description: 'Chambers contact phone number', sampleValue: '+880 1613-242524' },
      { key: 'officeAddress', token: '{{officeAddress}}', label: 'Office Address', description: 'Chambers physical address', sampleValue: 'Suite G-5, BTI Centara Grand, 144–144/1 Green Road, Panthapath, Dhaka–1205' }
    ],
    updatedAt: new Date().toISOString()
  },

  // ============================================================================
  // 2. REGISTRATION — ACADEMY COURSE & WORKSHOP ENROLLMENT
  // ============================================================================
  {
    id: 'registration_enrollment',
    category: 'registration',
    name: 'Academy Course & Training Enrollment',
    description: 'Sent when a student or practitioner registers for an Academy tax/legal course or workshop.',
    triggerEvent: 'Course Enrollment Submission (/enrollment)',
    enabled: true,
    ccAdmin: true,
    subjectTemplate: '[{{enrollmentId}}] Course Enrollment Confirmed: {{courseTitle}} — {{firmName}}',
    htmlTemplate: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Course Enrollment Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #065f46 100%); padding: 30px 32px; color: #ffffff;">
              <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #34d399; margin-bottom: 6px;">
                {{firmName}} • Tax &amp; Legal Academy
              </div>
              <h1 style="margin: 0; font-size: 21px; font-weight: 800; color: #ffffff;">
                Seat Reservation &amp; Enrollment Confirmed
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #cbd5e1;">
                Enrollment ID: <strong style="color: #6ee7b7; font-family: monospace;">{{enrollmentId}}</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155;">
                Hello <strong>{{clientName}}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Your seat reservation for <strong>{{courseTitle}}</strong> has been recorded with the <strong>{{firmName}}</strong> Training Desk. You can now access the Student LMS Portal for video classes, statutory notes, slide decks, and certification exams.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; color: #1e293b;">
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; width: 38%;">Participant Name:</td>
                        <td style="padding: 6px 0; font-weight: 700;">{{clientName}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; border-top: 1px solid #f1f5f9;">Email &amp; Phone:</td>
                        <td style="padding: 6px 0; font-weight: 600; border-top: 1px solid #f1f5f9;">{{clientEmail}} • {{clientPhone}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; border-top: 1px solid #f1f5f9;">Enrolled Program:</td>
                        <td style="padding: 6px 0; font-weight: 800; color: #059669; border-top: 1px solid #f1f5f9;">{{courseTitle}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; border-top: 1px solid #f1f5f9;">Tuition Fee:</td>
                        <td style="padding: 6px 0; font-weight: 700; border-top: 1px solid #f1f5f9;">{{tuitionFee}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; border-top: 1px solid #f1f5f9;">Enrollment Date:</td>
                        <td style="padding: 6px 0; border-top: 1px solid #f1f5f9;">{{registrationDate}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <div style="text-align: center; margin: 26px 0;">
                <a href="{{dashboardUrl}}" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 13px 28px; border-radius: 10px;">
                  Launch Student LMS Dashboard &rarr;
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f1f5f9; padding: 18px 32px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b;">
              <strong>{{firmName}}</strong> • Verified Desk: {{firmDeskEmail}} • {{officeAddress}}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    textTemplate: `Course Enrollment Confirmed [{{enrollmentId}}]

Hello {{clientName}},
Your enrollment for "{{courseTitle}}" ({{tuitionFee}}) has been confirmed on {{registrationDate}}.
Access your Student LMS Dashboard: {{dashboardUrl}}

{{firmName}} | {{firmDeskEmail}}`,
    placeholders: [
      { key: 'clientName', token: '{{clientName}}', label: 'Participant Name', description: 'Enrolled student full name', sampleValue: 'Sharmin Sultana' },
      { key: 'clientEmail', token: '{{clientEmail}}', label: 'Participant Email', description: 'Student email address', sampleValue: 'sharmin@example.com' },
      { key: 'clientPhone', token: '{{clientPhone}}', label: 'Phone Number', description: 'Student mobile number', sampleValue: '+880 1712-345678' },
      { key: 'courseTitle', token: '{{courseTitle}}', label: 'Course Title', description: 'Title of the enrolled training course', sampleValue: 'Personal & Corporate Income Tax Masterclass 2026-27' },
      { key: 'tuitionFee', token: '{{tuitionFee}}', label: 'Tuition Fee', description: 'Course fee amount', sampleValue: 'BDT 12,500' },
      { key: 'enrollmentId', token: '{{enrollmentId}}', label: 'Enrollment ID', description: 'Unique enrollment reference code', sampleValue: 'ENR-2026-5019' },
      { key: 'registrationDate', token: '{{registrationDate}}', label: 'Enrollment Date', description: 'Formatted date of enrollment', sampleValue: 'October 28, 2026' },
      { key: 'dashboardUrl', token: '{{dashboardUrl}}', label: 'LMS Dashboard URL', description: 'Direct link to course learning portal', sampleValue: 'https://blog.accounticca.com/student/dashboard' },
      { key: 'firmName', token: '{{firmName}}', label: 'Firm Name', description: 'Official organization name', sampleValue: 'ACCOUNTICCA x E-Lawyers' },
      { key: 'firmDeskEmail', token: '{{firmDeskEmail}}', label: 'Firm Desk Email', description: 'Verified sender email', sampleValue: 'ekram@elawyersbd.com' },
      { key: 'officeAddress', token: '{{officeAddress}}', label: 'Office Address', description: 'Chambers physical address', sampleValue: 'Suite G-5, BTI Centara Grand, 144–144/1 Green Road, Panthapath, Dhaka–1205' }
    ],
    updatedAt: new Date().toISOString()
  },

  // ============================================================================
  // 3. BOOKING — CONSULTATION CONFIRMATION
  // ============================================================================
  {
    id: 'booking_confirmation',
    category: 'booking',
    name: 'Consultation Booking Confirmation',
    description: 'Sent via Brevo SMTP when a client books or reschedules a legal/tax consultation appointment.',
    triggerEvent: 'Appointment Confirmed (/api/appointments/notify)',
    enabled: true,
    ccAdmin: true,
    subjectTemplate: '[{{referenceId}}] Consultation Confirmed: {{practiceArea}} on {{date}} at {{timeSlot}}',
    htmlTemplate: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Consultation Booking Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.06);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #065f46 0%, #0f172a 100%); padding: 30px 32px; color: #ffffff;">
              <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #34d399; margin-bottom: 6px;">
                {{firmName}} • Chambers Scheduling Desk
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">
                Consultation Appointment {{status}}
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #cbd5e1;">
                Booking Reference: <strong style="color: #6ee7b7; font-family: monospace;">{{referenceId}}</strong>
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155;">
                Dear <strong>{{clientName}}</strong>,
              </p>
              <p style="margin: 0 0 22px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Your consultation with <strong>{{firmName}}</strong> is officially <strong>{{status}}</strong>. Please review your scheduled session details below:
              </p>

              <!-- Schedule Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; color: #1e293b;">
                      <tr>
                        <td style="padding: 7px 0; color: #64748b; width: 38%;">Booking Reference:</td>
                        <td style="padding: 7px 0; font-weight: 800; font-family: monospace; color: #059669;">{{referenceId}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 7px 0; color: #64748b; border-top: 1px solid #f1f5f9;">Practice Area / Topic:</td>
                        <td style="padding: 7px 0; font-weight: 700; border-top: 1px solid #f1f5f9;">{{practiceArea}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 7px 0; color: #64748b; border-top: 1px solid #f1f5f9;">Date &amp; Time Slot:</td>
                        <td style="padding: 7px 0; font-weight: 800; color: #0f172a; border-top: 1px solid #f1f5f9;">{{date}} at {{timeSlot}} (BST)</td>
                      </tr>
                      <tr>
                        <td style="padding: 7px 0; color: #64748b; border-top: 1px solid #f1f5f9;">Consultation Mode:</td>
                        <td style="padding: 7px 0; font-weight: 700; border-top: 1px solid #f1f5f9;">{{consultationMode}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 7px 0; color: #64748b; border-top: 1px solid #f1f5f9;">Client Contact:</td>
                        <td style="padding: 7px 0; border-top: 1px solid #f1f5f9;">{{clientEmail}} • {{clientPhone}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 7px 0; color: #64748b; border-top: 1px solid #f1f5f9;">Case / Brief Notes:</td>
                        <td style="padding: 7px 0; color: #334155; border-top: 1px solid #f1f5f9;">{{notes}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: 14px 16px; font-size: 12px; color: #065f46; margin-bottom: 24px;">
                <strong>Calendar &amp; Reminder Notice:</strong> {{calendarSyncInfo}}
              </div>

              <div style="text-align: center; margin: 24px 0;">
                <a href="{{portalUrl}}" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 12px 26px; border-radius: 10px;">
                  Manage or Reschedule Appointment &rarr;
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b;">
              <div><strong>{{firmName}}</strong> • Central Desk: {{firmDeskEmail}}</div>
              <div style="margin-top: 4px;">{{officeAddress}}</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    textTemplate: `[{{referenceId}}] Consultation Appointment {{status}} — {{firmName}}

Dear {{clientName}},
Your consultation for {{practiceArea}} is scheduled on {{date}} at {{timeSlot}} ({{consultationMode}}).
Client Contact: {{clientEmail}} | {{clientPhone}}
Notes: {{notes}}

Manage Booking: {{portalUrl}}
Chambers Desk: {{firmDeskEmail}} | {{officeAddress}}`,
    placeholders: [
      { key: 'clientName', token: '{{clientName}}', label: 'Client Name', description: 'Full name of the client booking the consultation', sampleValue: 'Rafiqul Islam' },
      { key: 'clientEmail', token: '{{clientEmail}}', label: 'Client Email', description: 'Client email address', sampleValue: 'rafiqul@example.com' },
      { key: 'clientPhone', token: '{{clientPhone}}', label: 'Client Phone', description: 'Client phone / WhatsApp number', sampleValue: '+880 1819-001122' },
      { key: 'referenceId', token: '{{referenceId}}', label: 'Booking Reference ID', description: 'Unique booking reference code', sampleValue: 'ELAW-261028-409' },
      { key: 'practiceArea', token: '{{practiceArea}}', label: 'Practice Area', description: 'Selected legal or tax practice area', sampleValue: 'Corporate Tax & NBR Audit Defense' },
      { key: 'consultationMode', token: '{{consultationMode}}', label: 'Consultation Mode', description: 'Virtual (Google Meet/Zoom) or In-Chambers', sampleValue: 'Virtual Video Consultation (Google Meet)' },
      { key: 'date', token: '{{date}}', label: 'Appointment Date', description: 'Scheduled consultation date', sampleValue: '2026-10-30' },
      { key: 'timeSlot', token: '{{timeSlot}}', label: 'Time Slot', description: 'Scheduled consultation time slot', sampleValue: '04:00 PM' },
      { key: 'status', token: '{{status}}', label: 'Booking Status', description: 'Confirmed or Rescheduled status', sampleValue: 'Confirmed' },
      { key: 'notes', token: '{{notes}}', label: 'Client Brief / Notes', description: 'Additional notes submitted by the client', sampleValue: 'Review of FY 2026-27 corporate tax return and withholding tax assessment.' },
      { key: 'calendarSyncInfo', token: '{{calendarSyncInfo}}', label: 'Calendar Sync Info', description: 'Calendar invitation and 3-hour reminder status', sampleValue: 'An automated 3-hour prior reminder and Google Calendar invitation are active for this slot.' },
      { key: 'portalUrl', token: '{{portalUrl}}', label: 'Booking Portal URL', description: 'URL to view or reschedule appointment', sampleValue: 'https://blog.accounticca.com/contact?tab=appointment' },
      { key: 'firmName', token: '{{firmName}}', label: 'Firm Name', description: 'Official organization name', sampleValue: 'ACCOUNTICCA x E-Lawyers' },
      { key: 'firmDeskEmail', token: '{{firmDeskEmail}}', label: 'Firm Desk Email', description: 'Verified sender email', sampleValue: 'ekram@elawyersbd.com' },
      { key: 'officeAddress', token: '{{officeAddress}}', label: 'Office Address', description: 'Chambers physical address', sampleValue: 'Suite G-5, BTI Centara Grand, 144–144/1 Green Road, Panthapath, Dhaka–1205' }
    ],
    updatedAt: new Date().toISOString()
  },

  // ============================================================================
  // 4. BOOKING — 3-HOUR PRIOR CONSULTATION REMINDER
  // ============================================================================
  {
    id: 'booking_reminder_3h',
    category: 'booking',
    name: 'Consultation 3-Hour Prior Reminder',
    description: 'Automated reminder dispatched 3 hours before a scheduled consultation via Brevo SMTP.',
    triggerEvent: '3-Hour Pre-Session Scheduler / Manual Trigger',
    enabled: true,
    ccAdmin: true,
    subjectTemplate: 'REMINDER ({{hoursRemaining}}h Prior): Consultation Today at {{timeSlot}} [{{referenceId}}]',
    htmlTemplate: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Upcoming Consultation Reminder</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #fde68a;">
          <tr>
            <td style="background: linear-gradient(135deg, #92400e 0%, #0f172a 100%); padding: 28px 32px; color: #ffffff;">
              <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #fbbf24; margin-bottom: 6px;">
                Upcoming Session Alert • {{hoursRemaining}} Hours Remaining
              </div>
              <h1 style="margin: 0; font-size: 21px; font-weight: 800; color: #ffffff;">
                Your Consultation Begins Today at {{timeSlot}}
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #fde68a;">
                Reference ID: <strong style="font-family: monospace;">{{referenceId}}</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 14px 0; font-size: 15px; color: #334155;">
                Dear <strong>{{clientName}}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                This is a courtesy reminder from <strong>{{firmName}}</strong> that your scheduled <strong>{{practiceArea}}</strong> consultation is coming up in approximately <strong>{{hoursRemaining}} hours</strong>.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; margin-bottom: 22px;">
                <tr>
                  <td style="padding: 18px 20px; font-size: 13px; color: #1e293b;">
                    <div style="margin-bottom: 6px;"><strong>Date &amp; Time:</strong> {{date}} at {{timeSlot}} (BST)</div>
                    <div style="margin-bottom: 6px;"><strong>Practice Area:</strong> {{practiceArea}}</div>
                    <div style="margin-bottom: 6px;"><strong>Session Mode:</strong> {{consultationMode}}</div>
                    <div><strong>Chambers Location / Desk:</strong> {{officeAddress}}</div>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 13px; color: #64748b;">
                Please keep relevant tax files, notices, or corporate documents ready for review. If you need assistance, contact <a href="mailto:{{firmDeskEmail}}" style="color: #059669; font-weight: 600;">{{firmDeskEmail}}</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    textTemplate: `REMINDER: Your consultation [{{referenceId}}] for {{practiceArea}} begins in {{hoursRemaining}} hours ({{date}} at {{timeSlot}}, Mode: {{consultationMode}}).
Desk: {{firmDeskEmail}} | {{officeAddress}}`,
    placeholders: [
      { key: 'clientName', token: '{{clientName}}', label: 'Client Name', description: 'Client full name', sampleValue: 'Rafiqul Islam' },
      { key: 'clientEmail', token: '{{clientEmail}}', label: 'Client Email', description: 'Client email address', sampleValue: 'rafiqul@example.com' },
      { key: 'referenceId', token: '{{referenceId}}', label: 'Reference ID', description: 'Booking reference code', sampleValue: 'ELAW-261028-409' },
      { key: 'practiceArea', token: '{{practiceArea}}', label: 'Practice Area', description: 'Consultation practice area', sampleValue: 'Corporate Tax & NBR Audit Defense' },
      { key: 'consultationMode', token: '{{consultationMode}}', label: 'Consultation Mode', description: 'Virtual or In-Chambers', sampleValue: 'Virtual Video Consultation' },
      { key: 'date', token: '{{date}}', label: 'Date', description: 'Appointment date', sampleValue: '2026-10-30' },
      { key: 'timeSlot', token: '{{timeSlot}}', label: 'Time Slot', description: 'Appointment time slot', sampleValue: '04:00 PM' },
      { key: 'hoursRemaining', token: '{{hoursRemaining}}', label: 'Hours Remaining', description: 'Hours before session starts', sampleValue: '3' },
      { key: 'portalUrl', token: '{{portalUrl}}', label: 'Portal URL', description: 'Link to appointment portal', sampleValue: 'https://blog.accounticca.com/contact?tab=appointment' },
      { key: 'firmName', token: '{{firmName}}', label: 'Firm Name', description: 'Official organization name', sampleValue: 'ACCOUNTICCA x E-Lawyers' },
      { key: 'firmDeskEmail', token: '{{firmDeskEmail}}', label: 'Firm Desk Email', description: 'Verified sender email', sampleValue: 'ekram@elawyersbd.com' },
      { key: 'officeAddress', token: '{{officeAddress}}', label: 'Office Address', description: 'Chambers physical address', sampleValue: 'Suite G-5, BTI Centara Grand, 144–144/1 Green Road, Panthapath, Dhaka–1205' }
    ],
    updatedAt: new Date().toISOString()
  },

  // ============================================================================
  // 5. BOOKING — CONSULTATION CANCELLATION NOTICE
  // ============================================================================
  {
    id: 'booking_cancellation',
    category: 'booking',
    name: 'Consultation Cancellation Notice',
    description: 'Sent via Brevo SMTP when an appointment is cancelled by the client or admin desk.',
    triggerEvent: 'Appointment Cancelled (/api/appointments/notify)',
    enabled: true,
    ccAdmin: true,
    subjectTemplate: '[{{referenceId}}] Consultation Cancelled: {{practiceArea}} ({{date}})',
    htmlTemplate: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Consultation Cancellation Notice</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #fecdd3;">
          <tr>
            <td style="background: linear-gradient(135deg, #881337 0%, #0f172a 100%); padding: 28px 32px; color: #ffffff;">
              <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #fda4af; margin-bottom: 6px;">
                {{firmName}} • Scheduling Registry
              </div>
              <h1 style="margin: 0; font-size: 21px; font-weight: 800; color: #ffffff;">
                Consultation Appointment Cancelled
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #fecdd3;">
                Reference ID: <strong style="font-family: monospace;">{{referenceId}}</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 14px 0; font-size: 15px; color: #334155;">
                Dear <strong>{{clientName}}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Your consultation appointment (Reference: <strong>{{referenceId}}</strong>) for <strong>{{practiceArea}}</strong> originally scheduled on <strong>{{date}} at {{timeSlot}}</strong> has been marked as <strong>Cancelled</strong>, and the chamber time slot has been released.
              </p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="{{rebookUrl}}" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 12px 24px; border-radius: 10px;">
                  Book a New Consultation Slot &rarr;
                </a>
              </div>
              <p style="margin: 0; font-size: 12px; color: #64748b; text-align: center;">
                Questions? Contact {{firmDeskEmail}}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    textTemplate: `Consultation Cancelled [{{referenceId}}]
Dear {{clientName}}, your appointment for {{practiceArea}} on {{date}} at {{timeSlot}} has been cancelled.
Book a new time slot: {{rebookUrl}}`,
    placeholders: [
      { key: 'clientName', token: '{{clientName}}', label: 'Client Name', description: 'Client full name', sampleValue: 'Rafiqul Islam' },
      { key: 'clientEmail', token: '{{clientEmail}}', label: 'Client Email', description: 'Client email address', sampleValue: 'rafiqul@example.com' },
      { key: 'referenceId', token: '{{referenceId}}', label: 'Reference ID', description: 'Cancelled booking reference ID', sampleValue: 'ELAW-261028-409' },
      { key: 'practiceArea', token: '{{practiceArea}}', label: 'Practice Area', description: 'Consultation practice area', sampleValue: 'Corporate Tax & NBR Audit Defense' },
      { key: 'consultationMode', token: '{{consultationMode}}', label: 'Consultation Mode', description: 'Virtual or In-Chambers', sampleValue: 'Virtual Video Consultation' },
      { key: 'date', token: '{{date}}', label: 'Date', description: 'Original appointment date', sampleValue: '2026-10-30' },
      { key: 'timeSlot', token: '{{timeSlot}}', label: 'Time Slot', description: 'Original appointment time slot', sampleValue: '04:00 PM' },
      { key: 'status', token: '{{status}}', label: 'Status', description: 'Booking status', sampleValue: 'Cancelled' },
      { key: 'rebookUrl', token: '{{rebookUrl}}', label: 'Rebook URL', description: 'URL to book a new appointment', sampleValue: 'https://blog.accounticca.com/contact?tab=appointment' },
      { key: 'firmName', token: '{{firmName}}', label: 'Firm Name', description: 'Official organization name', sampleValue: 'ACCOUNTICCA x E-Lawyers' },
      { key: 'firmDeskEmail', token: '{{firmDeskEmail}}', label: 'Firm Desk Email', description: 'Verified sender email', sampleValue: 'ekram@elawyersbd.com' }
    ],
    updatedAt: new Date().toISOString()
  },

  // ============================================================================
  // 6. PAYMENT — DIGITAL SHOP & UDDOKTAPAY SETTLEMENT RECEIPT
  // ============================================================================
  {
    id: 'payment_receipt',
    category: 'payment',
    name: 'Payment & Digital Order Receipt',
    description: 'Sent via Brevo SMTP when a customer completes a Digital Shop order or UddoktaPay payment settlement.',
    triggerEvent: 'Order Checkout & Payment Settlement (/api/shop/orders/send-email)',
    enabled: true,
    ccAdmin: true,
    subjectTemplate: 'Payment Receipt & Order Confirmation [#{{orderId}}] — {{firmName}}',
    htmlTemplate: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Receipt &amp; Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 640px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.06);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #065f46 0%, #0f172a 100%); padding: 30px 32px; color: #ffffff;">
              <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #34d399; margin-bottom: 6px;">
                {{firmName}} • Verified Payment Receipt
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">
                Thank You for Your Order &amp; Payment!
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #cbd5e1;">
                Order / Invoice ID: <strong style="color: #6ee7b7; font-family: monospace;">#{{orderId}}</strong> • TrxID: <strong style="color: #fde68a; font-family: monospace;">{{trxId}}</strong>
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155;">
                Dear <strong>{{customerName}}</strong>,
              </p>
              <p style="margin: 0 0 22px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                We have received and verified your payment of <strong>BDT {{totalAmount}}</strong> via <strong>{{paymentMethod}}</strong>. Your digital templates, statutory compliance kits, or academy access entitlements are unlocked below.
              </p>

              <!-- Payment Metadata Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 12px;">
                      Transaction &amp; Billing Summary
                    </div>
                    <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; color: #1e293b;">
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; width: 40%;">Invoice / Order ID:</td>
                        <td style="padding: 6px 0; font-weight: 800; font-family: monospace;">#{{orderId}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; border-top: 1px solid #f1f5f9;">Gateway Transaction ID:</td>
                        <td style="padding: 6px 0; font-weight: 800; font-family: monospace; color: #059669; border-top: 1px solid #f1f5f9;">{{trxId}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; border-top: 1px solid #f1f5f9;">Payment Method:</td>
                        <td style="padding: 6px 0; font-weight: 700; border-top: 1px solid #f1f5f9;">{{paymentMethod}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; border-top: 1px solid #f1f5f9;">Total Amount Paid:</td>
                        <td style="padding: 6px 0; font-weight: 800; font-size: 15px; color: #059669; border-top: 1px solid #f1f5f9;">BDT {{totalAmount}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; border-top: 1px solid #f1f5f9;">Customer Contact:</td>
                        <td style="padding: 6px 0; border-top: 1px solid #f1f5f9;">{{customerEmail}} • {{customerPhone}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; border-top: 1px solid #f1f5f9;">Settlement Date:</td>
                        <td style="padding: 6px 0; border-top: 1px solid #f1f5f9;">{{paymentDate}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Purchased Items Block -->
              <div style="margin-bottom: 24px;">
                <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #334155; margin-bottom: 10px;">
                  Purchased Items &amp; Deliverables
                </div>
                <div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                  {{itemsSummaryHtml}}
                </div>
              </div>

              <!-- CTA -->
              <div style="text-align: center; margin: 28px 0;">
                <a href="{{downloadPortalUrl}}" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 13px 28px; border-radius: 10px;">
                  Access Purchased Downloads &amp; Courses &rarr;
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b;">
              <div><strong>{{firmName}}</strong> • Billing &amp; Support Desk: {{firmDeskEmail}}</div>
              <div style="margin-top: 4px;">{{officeAddress}}</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    textTemplate: `Payment Receipt & Order Confirmation [#{{orderId}}] — {{firmName}}

Dear {{customerName}},
We have verified your payment of BDT {{totalAmount}} via {{paymentMethod}} (TrxID: {{trxId}}) on {{paymentDate}}.

Purchased Items:
{{itemsSummaryText}}

Access Downloads & Client Portal: {{downloadPortalUrl}}
Support Desk: {{firmDeskEmail}} | {{officeAddress}}`,
    placeholders: [
      { key: 'customerName', token: '{{customerName}}', label: 'Customer Name', description: 'Full name of the buyer', sampleValue: 'Md. Tanvir Ahmed' },
      { key: 'customerEmail', token: '{{customerEmail}}', label: 'Customer Email', description: 'Buyer email address for receipt delivery', sampleValue: 'tanvir.ahmed@example.com' },
      { key: 'customerPhone', token: '{{customerPhone}}', label: 'Customer Phone', description: 'Buyer mobile number', sampleValue: '+880 1712-345678' },
      { key: 'orderId', token: '{{orderId}}', label: 'Order / Invoice ID', description: 'Unique order or invoice identifier', sampleValue: 'ORD-2026-9941' },
      { key: 'trxId', token: '{{trxId}}', label: 'Transaction ID (TrxID)', description: 'UddoktaPay / bKash / Nagad / Card TrxID', sampleValue: 'UPAY-TXN-8849201' },
      { key: 'paymentMethod', token: '{{paymentMethod}}', label: 'Payment Method', description: 'Payment channel used by customer', sampleValue: 'UddoktaPay Hosted (bKash)' },
      { key: 'totalAmount', token: '{{totalAmount}}', label: 'Total Amount (BDT)', description: 'Formatted total paid amount in BDT', sampleValue: '2,700' },
      { key: 'paymentDate', token: '{{paymentDate}}', label: 'Payment Date', description: 'Timestamp of payment confirmation', sampleValue: 'October 28, 2026, 03:45 PM' },
      { key: 'itemsSummaryHtml', token: '{{itemsSummaryHtml}}', label: 'Items Summary (HTML)', description: 'Rendered HTML table/list of purchased products', sampleValue: '<div style="padding: 12px 16px; background: #ffffff; font-size: 13px;"><strong>1. Income Tax Return Kit 2026-27</strong> (DOCX + Excel) — <span style="color:#059669;font-weight:700;">BDT 1,500</span><br/><strong>2. Non-Disclosure Agreement (NDA)</strong> (DOCX + PDF) — <span style="color:#059669;font-weight:700;">BDT 1,200</span></div>' },
      { key: 'itemsSummaryText', token: '{{itemsSummaryText}}', label: 'Items Summary (Plain Text)', description: 'Plain-text list of purchased items', sampleValue: '- Income Tax Return Kit 2026-27 (BDT 1,500)\n- Non-Disclosure Agreement (NDA) (BDT 1,200)' },
      { key: 'downloadPortalUrl', token: '{{downloadPortalUrl}}', label: 'Download Portal URL', description: 'Link to digital downloads and client portal', sampleValue: 'https://blog.accounticca.com/client-portal?tab=purchases' },
      { key: 'firmName', token: '{{firmName}}', label: 'Firm Name', description: 'Official organization name', sampleValue: 'ACCOUNTICCA x E-Lawyers' },
      { key: 'firmDeskEmail', token: '{{firmDeskEmail}}', label: 'Firm Desk Email', description: 'Verified sender email', sampleValue: 'ekram@elawyersbd.com' },
      { key: 'officeAddress', token: '{{officeAddress}}', label: 'Office Address', description: 'Chambers physical address', sampleValue: 'Suite G-5, BTI Centara Grand, 144–144/1 Green Road, Panthapath, Dhaka–1205' }
    ],
    updatedAt: new Date().toISOString()
  }
];

/**
 * Interpolates {{placeholder}} tokens in subject, html, and text templates.
 */
export function renderTransactionalTemplate(
  template: Pick<TransactionalEmailTemplate, 'subjectTemplate' | 'htmlTemplate' | 'textTemplate' | 'placeholders'>,
  variables: Record<string, string | number | undefined | null>,
  useSampleFallback = false
): {
  subject: string;
  html: string;
  text: string;
  resolvedVariables: Record<string, string>;
} {
  const resolvedVariables: Record<string, string> = {};

  // Seed from defined placeholders
  for (const ph of template.placeholders || []) {
    const provided = variables[ph.key];
    if (provided !== undefined && provided !== null && String(provided).trim() !== '') {
      resolvedVariables[ph.key] = String(provided);
    } else if (useSampleFallback) {
      resolvedVariables[ph.key] = ph.sampleValue;
    } else {
      resolvedVariables[ph.key] = '';
    }
  }

  // Also include any extra variables passed in runtime payload
  for (const [k, v] of Object.entries(variables || {})) {
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      resolvedVariables[k] = String(v);
    }
  }

  const replaceTokens = (raw: string): string => {
    if (!raw) return '';
    return raw.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_match, key: string) => {
      if (Object.prototype.hasOwnProperty.call(resolvedVariables, key)) {
        return resolvedVariables[key];
      }
      return useSampleFallback ? `{{${key}}}` : '';
    });
  };

  return {
    subject: replaceTokens(template.subjectTemplate),
    html: replaceTokens(template.htmlTemplate),
    text: replaceTokens(template.textTemplate),
    resolvedVariables
  };
}

/**
 * Extracts all {{token}} names used in subject, html, or text templates.
 */
export function extractTemplatePlaceholderKeys(
  subjectTemplate: string,
  htmlTemplate: string,
  textTemplate: string
): string[] {
  const combined = `${subjectTemplate || ''}\n${htmlTemplate || ''}\n${textTemplate || ''}`;
  const regex = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;
  const found = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(combined)) !== null) {
    if (match[1]) {
      found.add(match[1]);
    }
  }
  return Array.from(found);
}
