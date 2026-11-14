export type EmailHeaderTheme = 'emerald' | 'slate' | 'amber' | 'rose' | 'indigo';

export type EmailCalloutTone = 'emerald' | 'amber' | 'slate' | 'blue';

export interface EmailBuilderDetailRow {
  id: string;
  label: string;
  valueTemplate: string;
  enabled: boolean;
  highlight?: boolean;
}

export interface DynamicEmailBuilderConfig {
  version: number;
  headerTheme: EmailHeaderTheme;
  eyebrowText: string;
  headlineText: string;
  subheadlineText: string;
  greetingText: string;
  introParagraph: string;
  closingParagraph: string;
  showDetailsCard: boolean;
  detailsCardTitle: string;
  detailRows: EmailBuilderDetailRow[];
  showNoticeBox: boolean;
  noticeTone: EmailCalloutTone;
  noticeTitle: string;
  noticeBody: string;
  showCtaButton: boolean;
  ctaLabel: string;
  ctaUrlTemplate: string;
  footerPrimaryLine: string;
  footerSecondaryLine: string;
}

const HEADER_THEME_STYLES: Record<
  EmailHeaderTheme,
  {
    gradient: string;
    eyebrowColor: string;
    subtextColor: string;
    accentColor: string;
    ctaBg: string;
  }
> = {
  emerald: {
    gradient: 'linear-gradient(135deg, #065f46 0%, #0f172a 100%)',
    eyebrowColor: '#34d399',
    subtextColor: '#cbd5e1',
    accentColor: '#059669',
    ctaBg: '#059669',
  },
  slate: {
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    eyebrowColor: '#38bdf8',
    subtextColor: '#cbd5e1',
    accentColor: '#0f172a',
    ctaBg: '#0f172a',
  },
  amber: {
    gradient: 'linear-gradient(135deg, #92400e 0%, #0f172a 100%)',
    eyebrowColor: '#fbbf24',
    subtextColor: '#fde68a',
    accentColor: '#b45309',
    ctaBg: '#b45309',
  },
  rose: {
    gradient: 'linear-gradient(135deg, #881337 0%, #0f172a 100%)',
    eyebrowColor: '#fda4af',
    subtextColor: '#fecdd3',
    accentColor: '#be123c',
    ctaBg: '#059669',
  },
  indigo: {
    gradient: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
    eyebrowColor: '#a5b4fc',
    subtextColor: '#e0e7ff',
    accentColor: '#4338ca',
    ctaBg: '#4338ca',
  },
};

const CALLOUT_TONE_STYLES: Record<
  EmailCalloutTone,
  { bg: string; border: string; text: string }
> = {
  emerald: {
    bg: '#ecfdf5',
    border: '#a7f3d0',
    text: '#065f46',
  },
  amber: {
    bg: '#fffbeb',
    border: '#fde68a',
    text: '#92400e',
  },
  slate: {
    bg: '#f8fafc',
    border: '#cbd5e1',
    text: '#334155',
  },
  blue: {
    bg: '#eff6ff',
    border: '#bfdbfe',
    text: '#1e40af',
  },
};

function escapeHtmlPreservingTokens(text: string): string {
  const tokens: string[] = [];
  const tokenized = text.replace(/\{\{\s*[a-zA-Z0-9_.-]+\s*\}\}/g, (match) => {
    const idx = tokens.push(match) - 1;
    return `__TMPL_TOKEN_${idx}__`;
  });

  const escaped = tokenized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\r?\n/g, '<br />');

  return escaped.replace(/__TMPL_TOKEN_(\d+)__/g, (_m, i) => tokens[Number(i)] || '');
}

function emphasizeTokens(htmlWithTokens: string, highlightColor: string): string {
  return htmlWithTokens.replace(
    /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g,
    (token, key) => {
      if (key === 'referenceId' || key === 'enrollmentId' || key === 'orderId' || key === 'trxId') {
        return `<strong style="font-family: monospace; color: ${highlightColor};">${token}</strong>`;
      }
      return token;
    }
  );
}

/**
 * Compiles a structured DynamicEmailBuilderConfig into clean, email-client-safe
 * responsive HTML and plain-text fallback strings while preserving all {{tokens}}.
 */
export function compileBuilderConfigToEmailTemplates(
  config: DynamicEmailBuilderConfig,
  titleFallback = 'Notification Email'
): { htmlTemplate: string; textTemplate: string } {
  const theme = HEADER_THEME_STYLES[config.headerTheme] || HEADER_THEME_STYLES.emerald;
  const noticeTone = CALLOUT_TONE_STYLES[config.noticeTone] || CALLOUT_TONE_STYLES.emerald;

  const activeRows = (config.detailRows || []).filter((r) => r.enabled && (r.label.trim() || r.valueTemplate.trim()));

  const detailRowsHtml = activeRows
    .map((row, idx) => {
      const topBorder = idx === 0 ? '' : ' border-top: 1px solid #f1f5f9;';
      const valueColor = row.highlight ? theme.accentColor : '#0f172a';
      const fontWeight = row.highlight ? '800' : '600';
      return `                      <tr>
                        <td style="padding: 8px 0; color: #64748b; width: 38%; vertical-align: top;${topBorder}">${escapeHtmlPreservingTokens(row.label)}:</td>
                        <td style="padding: 8px 0; font-weight: ${fontWeight}; color: ${valueColor}; vertical-align: top;${topBorder}">${escapeHtmlPreservingTokens(row.valueTemplate)}</td>
                      </tr>`;
    })
    .join('\n');

  const detailsCardHtml =
    config.showDetailsCard && activeRows.length > 0
      ? `
              <!-- Dynamic Appointment / Summary Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    ${
                      config.detailsCardTitle.trim()
                        ? `<div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 12px;">${escapeHtmlPreservingTokens(config.detailsCardTitle)}</div>`
                        : ''
                    }
                    <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; color: #1e293b;">
${detailRowsHtml}
                    </table>
                  </td>
                </tr>
              </table>`
      : '';

  const noticeBoxHtml =
    config.showNoticeBox && (config.noticeTitle.trim() || config.noticeBody.trim())
      ? `
              <!-- Notice / Reminder Callout -->
              <div style="background-color: ${noticeTone.bg}; border: 1px solid ${noticeTone.border}; border-radius: 10px; padding: 14px 16px; font-size: 12px; line-height: 1.6; color: ${noticeTone.text}; margin-bottom: 24px;">
                ${config.noticeTitle.trim() ? `<strong>${escapeHtmlPreservingTokens(config.noticeTitle)}:</strong> ` : ''}${escapeHtmlPreservingTokens(config.noticeBody)}
              </div>`
      : '';

  const ctaHtml =
    config.showCtaButton && config.ctaLabel.trim()
      ? `
              <!-- Primary Action Button -->
              <div style="text-align: center; margin: 24px 0;">
                <a href="${config.ctaUrlTemplate.trim() || '{{portalUrl}}'}" style="display: inline-block; background-color: ${theme.ctaBg}; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 13px 28px; border-radius: 10px;">
                  ${escapeHtmlPreservingTokens(config.ctaLabel)} &rarr;
                </a>
              </div>`
      : '';

  const closingHtml = config.closingParagraph.trim()
    ? `
              <p style="margin: 18px 0 0 0; font-size: 13px; line-height: 1.6; color: #475569;">
                ${escapeHtmlPreservingTokens(config.closingParagraph)}
              </p>`
    : '';

  const htmlTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtmlPreservingTokens(titleFallback)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.06);">

          <!-- Header Banner -->
          <tr>
            <td style="background: ${theme.gradient}; padding: 30px 32px; color: #ffffff;">
              ${
                config.eyebrowText.trim()
                  ? `<div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: ${theme.eyebrowColor}; margin-bottom: 6px;">${escapeHtmlPreservingTokens(config.eyebrowText)}</div>`
                  : ''
              }
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; line-height: 1.3;">
                ${escapeHtmlPreservingTokens(config.headlineText)}
              </h1>
              ${
                config.subheadlineText.trim()
                  ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: ${theme.subtextColor};">${emphasizeTokens(escapeHtmlPreservingTokens(config.subheadlineText), theme.eyebrowColor)}</p>`
                  : ''
              }
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 32px;">
              ${
                config.greetingText.trim()
                  ? `<p style="margin: 0 0 14px 0; font-size: 15px; color: #334155;"><strong>${escapeHtmlPreservingTokens(config.greetingText)}</strong></p>`
                  : ''
              }
              ${
                config.introParagraph.trim()
                  ? `<p style="margin: 0 0 22px 0; font-size: 14px; line-height: 1.65; color: #475569;">${escapeHtmlPreservingTokens(config.introParagraph)}</p>`
                  : ''
              }
              ${detailsCardHtml}
              ${noticeBoxHtml}
              ${ctaHtml}
              ${closingHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b;">
              ${
                config.footerPrimaryLine.trim()
                  ? `<div><strong>${escapeHtmlPreservingTokens(config.footerPrimaryLine)}</strong></div>`
                  : ''
              }
              ${
                config.footerSecondaryLine.trim()
                  ? `<div style="margin-top: 4px;">${escapeHtmlPreservingTokens(config.footerSecondaryLine)}</div>`
                  : ''
              }
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textLines: string[] = [
    config.headlineText,
    config.subheadlineText,
    '',
    config.greetingText,
    config.introParagraph,
    '',
  ];

  if (config.showDetailsCard && activeRows.length > 0) {
    if (config.detailsCardTitle.trim()) {
      textLines.push(`${config.detailsCardTitle.toUpperCase()}:`);
    }
    for (const row of activeRows) {
      textLines.push(`- ${row.label}: ${row.valueTemplate}`);
    }
    textLines.push('');
  }

  if (config.showNoticeBox && config.noticeBody.trim()) {
    textLines.push(
      `${config.noticeTitle ? `${config.noticeTitle}: ` : ''}${config.noticeBody}`,
      ''
    );
  }

  if (config.showCtaButton && config.ctaLabel.trim()) {
    textLines.push(`${config.ctaLabel}: ${config.ctaUrlTemplate || '{{portalUrl}}'}`, '');
  }

  if (config.closingParagraph.trim()) {
    textLines.push(config.closingParagraph, '');
  }

  if (config.footerPrimaryLine.trim()) {
    textLines.push(config.footerPrimaryLine);
  }
  if (config.footerSecondaryLine.trim()) {
    textLines.push(config.footerSecondaryLine);
  }

  const textTemplate = textLines
    .filter((line, idx, arr) => !(line === '' && arr[idx - 1] === ''))
    .join('\n')
    .trim();

  return { htmlTemplate, textTemplate };
}

export const DEFAULT_BUILDER_CONFIGS: Record<string, DynamicEmailBuilderConfig> = {
  booking_confirmation: {
    version: 1,
    headerTheme: 'emerald',
    eyebrowText: '{{firmName}} • Chambers Scheduling Desk',
    headlineText: 'Consultation Appointment {{status}}',
    subheadlineText: 'Booking Reference: {{referenceId}}',
    greetingText: 'Dear {{clientName}},',
    introParagraph:
      'Your consultation for {{serviceType}} with {{firmName}} is officially {{status}} for {{appointmentTime}}. Please review your scheduled session details below:',
    closingParagraph:
      'Need to update your schedule or share supporting tax/legal files ahead of time? Reply directly to {{firmDeskEmail}} or call {{firmPhone}}.',
    showDetailsCard: true,
    detailsCardTitle: 'Confirmed Consultation Details',
    detailRows: [
      {
        id: 'row-client',
        label: 'Client Name',
        valueTemplate: '{{clientName}}',
        enabled: true,
      },
      {
        id: 'row-ref',
        label: 'Booking Reference',
        valueTemplate: '{{referenceId}}',
        enabled: true,
        highlight: true,
      },
      {
        id: 'row-service',
        label: 'Service Type',
        valueTemplate: '{{serviceType}}',
        enabled: true,
        highlight: true,
      },
      {
        id: 'row-time',
        label: 'Appointment Date & Time',
        valueTemplate: '{{appointmentTime}}',
        enabled: true,
        highlight: true,
      },
      {
        id: 'row-mode',
        label: 'Consultation Mode',
        valueTemplate: '{{consultationMode}}',
        enabled: true,
      },
      {
        id: 'row-counsel',
        label: 'Assigned Counsel',
        valueTemplate: '{{assignedCounsel}}',
        enabled: true,
      },
      {
        id: 'row-contact',
        label: 'Client Contact',
        valueTemplate: '{{clientEmail}} • {{clientPhone}}',
        enabled: true,
      },
      {
        id: 'row-notes',
        label: 'Case / Brief Notes',
        valueTemplate: '{{notes}}',
        enabled: true,
      },
    ],
    showNoticeBox: true,
    noticeTone: 'emerald',
    noticeTitle: 'Calendar & Reminder Notice',
    noticeBody: '{{calendarSyncInfo}}',
    showCtaButton: true,
    ctaLabel: 'Manage or Reschedule Appointment',
    ctaUrlTemplate: '{{portalUrl}}',
    footerPrimaryLine: '{{firmName}} • Central Desk: {{firmDeskEmail}}',
    footerSecondaryLine: '{{officeAddress}}',
  },

  booking_reminder_3h: {
    version: 1,
    headerTheme: 'amber',
    eyebrowText: 'Upcoming Session Alert • {{hoursRemaining}} Hours Remaining',
    headlineText: 'Your Consultation Begins Today at {{timeSlot}}',
    subheadlineText: 'Reference ID: {{referenceId}}',
    greetingText: 'Dear {{clientName}},',
    introParagraph:
      'This is a courtesy reminder from {{firmName}} that your scheduled {{serviceType}} consultation is coming up in approximately {{hoursRemaining}} hours.',
    closingParagraph:
      'Please keep relevant tax files, statutory notices, or corporate documents ready for review. For urgent schedule updates contact {{firmDeskEmail}}.',
    showDetailsCard: true,
    detailsCardTitle: 'Session Schedule Summary',
    detailRows: [
      { id: 'r-client', label: 'Client Name', valueTemplate: '{{clientName}}', enabled: true },
      { id: 'r-service', label: 'Service Type', valueTemplate: '{{serviceType}}', enabled: true, highlight: true },
      { id: 'r-time', label: 'Appointment Time', valueTemplate: '{{appointmentTime}}', enabled: true, highlight: true },
      { id: 'r-mode', label: 'Session Mode', valueTemplate: '{{consultationMode}}', enabled: true },
      { id: 'r-loc', label: 'Chambers Desk', valueTemplate: '{{officeAddress}}', enabled: true },
    ],
    showNoticeBox: true,
    noticeTone: 'amber',
    noticeTitle: 'Preparation Checklist',
    noticeBody: 'Please join 5 minutes early for virtual sessions or arrive 10 minutes before your slot at Panthapath Chambers.',
    showCtaButton: true,
    ctaLabel: 'Open Appointment Portal',
    ctaUrlTemplate: '{{portalUrl}}',
    footerPrimaryLine: '{{firmName}} • Desk: {{firmDeskEmail}}',
    footerSecondaryLine: '{{officeAddress}}',
  },

  booking_cancellation: {
    version: 1,
    headerTheme: 'rose',
    eyebrowText: '{{firmName}} • Scheduling Registry',
    headlineText: 'Consultation Appointment Cancelled',
    subheadlineText: 'Reference ID: {{referenceId}}',
    greetingText: 'Dear {{clientName}},',
    introParagraph:
      'Your consultation appointment (Reference: {{referenceId}}) for {{serviceType}} originally scheduled for {{appointmentTime}} has been marked as {{status}}, and the chamber time slot has been released.',
    closingParagraph: 'Questions or need priority rebooking? Contact our chambers at {{firmDeskEmail}}.',
    showDetailsCard: true,
    detailsCardTitle: 'Cancelled Booking Summary',
    detailRows: [
      { id: 'c-client', label: 'Client Name', valueTemplate: '{{clientName}}', enabled: true },
      { id: 'c-service', label: 'Service Type', valueTemplate: '{{serviceType}}', enabled: true },
      { id: 'c-time', label: 'Original Time', valueTemplate: '{{appointmentTime}}', enabled: true },
      { id: 'c-reason', label: 'Status / Note', valueTemplate: '{{cancellationReason}}', enabled: true },
    ],
    showNoticeBox: false,
    noticeTone: 'slate',
    noticeTitle: 'Rebooking Notice',
    noticeBody: 'You can reserve a new consultation time slot at your convenience using the button below.',
    showCtaButton: true,
    ctaLabel: 'Book a New Consultation Slot',
    ctaUrlTemplate: '{{rebookUrl}}',
    footerPrimaryLine: '{{firmName}} • Desk: {{firmDeskEmail}}',
    footerSecondaryLine: '{{officeAddress}}',
  },

  registration_welcome: {
    version: 1,
    headerTheme: 'emerald',
    eyebrowText: '{{firmName}} • Client Registry',
    headlineText: 'Welcome to Your Legal & Tax Compliance Portal',
    subheadlineText: 'Account Reference: {{referenceId}}',
    greetingText: 'Dear {{clientName}},',
    introParagraph:
      'Thank you for registering with {{firmName}}. Your client portal profile has been provisioned and gives you direct access to Bangladesh Income Tax calculators, VAT & TDS schedules, RJSC corporate tools, and digital legal templates.',
    closingParagraph:
      'Need immediate legal or tax advisory? Reply directly to {{firmDeskEmail}} or call our chambers at {{firmPhone}}.',
    showDetailsCard: true,
    detailsCardTitle: 'Registered Account Summary',
    detailRows: [
      { id: 'rw-name', label: 'Full Name', valueTemplate: '{{clientName}}', enabled: true },
      { id: 'rw-email', label: 'Registered Email', valueTemplate: '{{clientEmail}}', enabled: true },
      { id: 'rw-role', label: 'Account Role', valueTemplate: '{{accountRole}}', enabled: true, highlight: true },
      { id: 'rw-date', label: 'Registration Date', valueTemplate: '{{registrationDate}}', enabled: true },
    ],
    showNoticeBox: false,
    noticeTone: 'emerald',
    noticeTitle: 'Portal Security',
    noticeBody: 'Your portal session uses encrypted credentials.',
    showCtaButton: true,
    ctaLabel: 'Open Client Compliance Portal',
    ctaUrlTemplate: '{{portalUrl}}',
    footerPrimaryLine: '{{firmName}}',
    footerSecondaryLine: '{{officeAddress}}',
  },

  registration_enrollment: {
    version: 1,
    headerTheme: 'emerald',
    eyebrowText: '{{firmName}} • Tax & Legal Academy',
    headlineText: 'Seat Reservation & Enrollment Confirmed',
    subheadlineText: 'Enrollment ID: {{enrollmentId}}',
    greetingText: 'Hello {{clientName}},',
    introParagraph:
      'Your seat reservation for {{courseTitle}} has been recorded with the {{firmName}} Training Desk. You can now access the Student LMS Portal for video classes, statutory notes, slide decks, and certification exams.',
    closingParagraph: 'For batch schedules or certificate verification, write to {{firmDeskEmail}}.',
    showDetailsCard: true,
    detailsCardTitle: 'Enrollment Summary',
    detailRows: [
      { id: 're-name', label: 'Participant Name', valueTemplate: '{{clientName}}', enabled: true },
      { id: 're-contact', label: 'Email & Phone', valueTemplate: '{{clientEmail}} • {{clientPhone}}', enabled: true },
      { id: 're-course', label: 'Enrolled Program', valueTemplate: '{{courseTitle}}', enabled: true, highlight: true },
      { id: 're-fee', label: 'Tuition Fee', valueTemplate: '{{tuitionFee}}', enabled: true },
      { id: 're-date', label: 'Enrollment Date', valueTemplate: '{{registrationDate}}', enabled: true },
    ],
    showNoticeBox: false,
    noticeTone: 'emerald',
    noticeTitle: 'LMS Access Ready',
    noticeBody: 'Your learning modules are unlocked inside the Student Dashboard.',
    showCtaButton: true,
    ctaLabel: 'Launch Student LMS Dashboard',
    ctaUrlTemplate: '{{dashboardUrl}}',
    footerPrimaryLine: '{{firmName}} • Verified Desk: {{firmDeskEmail}}',
    footerSecondaryLine: '{{officeAddress}}',
  },

  payment_receipt: {
    version: 1,
    headerTheme: 'emerald',
    eyebrowText: '{{firmName}} • Verified Payment Receipt',
    headlineText: 'Thank You for Your Order & Payment!',
    subheadlineText: 'Order / Invoice ID: #{{orderId}} • TrxID: {{trxId}}',
    greetingText: 'Dear {{customerName}},',
    introParagraph:
      'We have received and verified your payment of BDT {{totalAmount}} via {{paymentMethod}}. Your digital templates, statutory compliance kits, or academy access entitlements are ready below.',
    closingParagraph: 'Need GST/VAT billing assistance? Contact {{firmDeskEmail}}.',
    showDetailsCard: true,
    detailsCardTitle: 'Transaction & Billing Summary',
    detailRows: [
      { id: 'pr-ord', label: 'Invoice / Order ID', valueTemplate: '#{{orderId}}', enabled: true, highlight: true },
      { id: 'pr-trx', label: 'Gateway Transaction ID', valueTemplate: '{{trxId}}', enabled: true, highlight: true },
      { id: 'pr-method', label: 'Payment Method', valueTemplate: '{{paymentMethod}}', enabled: true },
      { id: 'pr-amt', label: 'Total Amount Paid', valueTemplate: 'BDT {{totalAmount}}', enabled: true, highlight: true },
      { id: 'pr-contact', label: 'Customer Contact', valueTemplate: '{{customerEmail}} • {{customerPhone}}', enabled: true },
      { id: 'pr-date', label: 'Settlement Date', valueTemplate: '{{paymentDate}}', enabled: true },
    ],
    showNoticeBox: true,
    noticeTone: 'slate',
    noticeTitle: 'Purchased Items Summary',
    noticeBody: '{{itemsSummaryText}}',
    showCtaButton: true,
    ctaLabel: 'Access Purchased Downloads & Courses',
    ctaUrlTemplate: '{{downloadPortalUrl}}',
    footerPrimaryLine: '{{firmName}} • Billing Desk: {{firmDeskEmail}}',
    footerSecondaryLine: '{{officeAddress}}',
  },
};

export function createDefaultBuilderConfigForTemplate(templateId: string): DynamicEmailBuilderConfig {
  const preset = DEFAULT_BUILDER_CONFIGS[templateId] || DEFAULT_BUILDER_CONFIGS.booking_confirmation;
  return {
    ...preset,
    detailRows: preset.detailRows.map((row) => ({ ...row })),
  };
}
