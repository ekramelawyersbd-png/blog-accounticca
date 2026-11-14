import {
  DEFAULT_TRANSACTIONAL_EMAIL_TEMPLATES,
  type TransactionalEmailTemplate,
} from './transactionalEmailTemplates';

export const ADMIN_EMAIL_TEMPLATES_CACHE_KEY = 'accounticca_admin_email_templates_v1';

export interface AppointmentClientDetails {
  /** Client's full name (maps to both {{clientName}} and {{name}}) */
  name?: string;
  clientName?: string;
  /** Formatted appointment date/time string (maps to both {{appointmentTime}} and {{time}}) */
  time?: string;
  appointmentTime?: string;
  /** Selected consultation service / practice area (maps to {{service}}, {{serviceType}}, {{practiceArea}}) */
  service?: string;
  serviceType?: string;
  practiceArea?: string;
  /** Date & slot components */
  date?: string;
  appointmentDate?: string;
  timeSlot?: string;
  /** Booking metadata */
  referenceId?: string;
  email?: string;
  clientEmail?: string;
  phone?: string;
  clientPhone?: string;
  companyName?: string;
  mode?: string;
  consultationMode?: string;
  assignedCounsel?: string;
  assignedLead?: string;
  leadPartnerName?: string;
  status?: string;
  notes?: string;
  calendarSyncInfo?: string;
  calendarEventId?: string;
  meetingLink?: string;
  meetingOrLocationInfo?: string;
  cancellationReason?: string;
  hoursRemaining?: number | string;
  portalUrl?: string;
  bookingPortalUrl?: string;
  rebookUrl?: string;
  firmName?: string;
  firmDeskEmail?: string;
  firmPhone?: string;
  officeAddress?: string;
  /** Any additional custom placeholders configured in Admin Dynamic Email Builder */
  [key: string]: string | number | boolean | undefined | null;
}

export interface EmailGeneratorOptions {
  /** Escape HTML entities on injected variable values in HTML output (default: true) */
  escapeHtmlValues?: boolean;
  /** Fallback to template placeholder sampleValue if a token value is missing (default: false) */
  useSampleFallback?: boolean;
  /** Additional fallback values by placeholder key */
  fallbackValues?: Record<string, string>;
}

export interface GeneratedEmailOutput {
  templateId: string;
  templateName: string;
  enabled: boolean;
  ccAdmin: boolean;
  subject: string;
  html: string;
  text: string;
  resolvedVariables: Record<string, string>;
}

const RAW_HTML_SAFE_KEYS = new Set<string>(['itemsSummaryHtml']);

function escapeHtmlValue(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function firstNonEmpty(...values: Array<unknown>): string {
  for (const val of values) {
    if (val !== undefined && val !== null) {
      const trimmed = String(val).trim();
      if (trimmed !== '') return trimmed;
    }
  }
  return '';
}

/**
 * Caches admin-saved email templates in browser localStorage for fast client-side
 * access before /api/appointments/notify dispatches via Brevo.
 */
export function cacheAdminEmailTemplates(templates: TransactionalEmailTemplate[]): void {
  if (typeof window === 'undefined' || !Array.isArray(templates) || templates.length === 0) {
    return;
  }
  try {
    window.localStorage.setItem(ADMIN_EMAIL_TEMPLATES_CACHE_KEY, JSON.stringify(templates));
  } catch {
    // Non-blocking cache write
  }
}

export function getCachedAdminEmailTemplates(): TransactionalEmailTemplate[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(ADMIN_EMAIL_TEMPLATES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * EmailTemplateGenerator
 *
 * Programmatically injects client appointment details (name, time, service, and
 * consultation metadata) into HTML, subject, and plain-text email templates
 * configured in the Admin Panel before dispatching to Brevo.
 */
export class EmailTemplateGenerator {
  private defaultDetails: Partial<AppointmentClientDetails>;

  constructor(defaultDetails: Partial<AppointmentClientDetails> = {}) {
    this.defaultDetails = defaultDetails;
  }

  /**
   * Normalizes client details so both short aliases (name, time, service) and
   * full template tokens (clientName, appointmentTime, serviceType, practiceArea)
   * resolve consistently.
   */
  static normalizeClientDetails(
    details: AppointmentClientDetails
  ): Record<string, string> {
    const normalized: Record<string, string> = {};

    for (const [key, rawVal] of Object.entries(details || {})) {
      if (rawVal !== undefined && rawVal !== null) {
        const strVal = String(rawVal).trim();
        if (strVal !== '') {
          normalized[key] = strVal;
        }
      }
    }

    const clientName = firstNonEmpty(details.clientName, details.name, 'Valued Client');
    const service = firstNonEmpty(
      details.serviceType,
      details.service,
      details.practiceArea,
      'Tax & Legal Consultation'
    );
    const date = firstNonEmpty(details.date, details.appointmentDate);
    const timeSlot = firstNonEmpty(details.timeSlot);
    const formattedDateTime =
      date && timeSlot ? `${date} at ${timeSlot} (BST)` : date || timeSlot;
    const appointmentTime = firstNonEmpty(
      details.appointmentTime,
      details.time,
      formattedDateTime,
      'Scheduled Chambers Slot'
    );

    const modeRaw = firstNonEmpty(details.consultationMode, details.mode, 'virtual');
    const consultationMode =
      modeRaw.toLowerCase().includes('virtual') || modeRaw.toLowerCase().includes('meet')
        ? modeRaw.includes('(')
          ? modeRaw
          : 'Virtual Consultation (Google Meet)'
        : modeRaw.toLowerCase().includes('chamber') || modeRaw.toLowerCase().includes('in_person')
        ? modeRaw.includes('(')
          ? modeRaw
          : 'In-Person Chamber Consultation'
        : modeRaw;

    const assignedCounsel = firstNonEmpty(
      details.assignedCounsel,
      details.assignedLead,
      details.leadPartnerName,
      'Adv. Md. Ekramul Haque (Managing Partner)'
    );

    const clientEmail = firstNonEmpty(details.clientEmail, details.email);
    const clientPhone = firstNonEmpty(details.clientPhone, details.phone, '+880 1613-242524');
    const portalUrl = firstNonEmpty(
      details.portalUrl,
      details.bookingPortalUrl,
      'https://blog.accounticca.com/contact?tab=appointment'
    );
    const officeAddress = firstNonEmpty(
      details.officeAddress,
      'Suite G-5, BTI Centara Grand, 144–144/1 Green Road, Panthapath, Dhaka–1205'
    );

    const calendarSyncInfo = firstNonEmpty(
      details.calendarSyncInfo,
      details.calendarEventId
        ? 'Google Calendar event synced & automated 3-hour prior reminder is active for this session.'
        : 'An automated 3-hour prior reminder and Chambers scheduling confirmation are active for this slot.'
    );

    Object.assign(normalized, {
      // Primary client fields (aliases synchronized bidirectionally)
      name: clientName,
      clientName,
      time: appointmentTime,
      appointmentTime,
      service,
      serviceType: service,
      practiceArea: firstNonEmpty(details.practiceArea, service),
      date: date || appointmentTime,
      appointmentDate: date || appointmentTime,
      timeSlot: timeSlot || appointmentTime,
      // Contact & dossier metadata
      referenceId: firstNonEmpty(details.referenceId, `APT-${Date.now()}`),
      email: clientEmail,
      clientEmail,
      phone: clientPhone,
      clientPhone,
      companyName: firstNonEmpty(details.companyName),
      mode: firstNonEmpty(details.mode, 'virtual'),
      consultationMode,
      assignedCounsel,
      status: firstNonEmpty(details.status, 'Confirmed'),
      notes: firstNonEmpty(details.notes, 'Scheduled tax & legal consultation briefing.'),
      calendarSyncInfo,
      meetingOrLocationInfo: firstNonEmpty(
        details.meetingOrLocationInfo,
        details.meetingLink,
        officeAddress
      ),
      cancellationReason: firstNonEmpty(
        details.cancellationReason,
        'Rescheduled at client request'
      ),
      hoursRemaining: firstNonEmpty(details.hoursRemaining, '3'),
      portalUrl,
      bookingPortalUrl: portalUrl,
      rebookUrl: firstNonEmpty(details.rebookUrl, portalUrl),
      firmName: firstNonEmpty(details.firmName, 'ACCOUNTICCA x E-Lawyers'),
      firmDeskEmail: firstNonEmpty(details.firmDeskEmail, 'ekram@elawyersbd.com'),
      firmPhone: firstNonEmpty(details.firmPhone, '+880 1613-242524'),
      officeAddress,
    });

    return normalized;
  }

  /**
   * Injects normalized client details into any HTML email template string
   * containing `{{token}}` placeholders.
   */
  static injectIntoHtmlTemplate(
    htmlTemplate: string,
    details: AppointmentClientDetails,
    options: EmailGeneratorOptions = {}
  ): string {
    const resolved = EmailTemplateGenerator.buildResolvedVariables(details, [], options);
    return EmailTemplateGenerator.interpolate(htmlTemplate, resolved, {
      escapeHtml: options.escapeHtmlValues !== false,
    });
  }

  /**
   * Generates a complete email payload (subject, html, text) from either a
   * `TransactionalEmailTemplate` object, a template ID (e.g. 'booking_confirmation'),
   * or a raw HTML template string.
   */
  static generate(
    templateOrId:
      | string
      | Pick<
          TransactionalEmailTemplate,
          | 'id'
          | 'name'
          | 'enabled'
          | 'ccAdmin'
          | 'subjectTemplate'
          | 'htmlTemplate'
          | 'textTemplate'
          | 'placeholders'
        >,
    details: AppointmentClientDetails,
    options: EmailGeneratorOptions = {}
  ): GeneratedEmailOutput {
    let template: Pick<
      TransactionalEmailTemplate,
      | 'id'
      | 'name'
      | 'enabled'
      | 'ccAdmin'
      | 'subjectTemplate'
      | 'htmlTemplate'
      | 'textTemplate'
      | 'placeholders'
    >;

    if (typeof templateOrId === 'string') {
      const looksLikeRawHtml =
        templateOrId.includes('<') && templateOrId.includes('>');
      if (looksLikeRawHtml) {
        template = {
          id: 'custom_inline_html',
          name: 'Custom Appointment Confirmation',
          enabled: true,
          ccAdmin: true,
          subjectTemplate:
            '[{{referenceId}}] Consultation Confirmed: {{serviceType}} on {{appointmentTime}}',
          htmlTemplate: templateOrId,
          textTemplate:
            'Dear {{clientName}}, your appointment for {{serviceType}} is confirmed for {{appointmentTime}} (Ref: {{referenceId}}).',
          placeholders: [],
        };
      } else {
        const cached = getCachedAdminEmailTemplates();
        const found =
          cached?.find((t) => t.id === templateOrId) ||
          DEFAULT_TRANSACTIONAL_EMAIL_TEMPLATES.find((t) => t.id === templateOrId) ||
          DEFAULT_TRANSACTIONAL_EMAIL_TEMPLATES.find((t) => t.id === 'booking_confirmation') ||
          DEFAULT_TRANSACTIONAL_EMAIL_TEMPLATES[0];
        template = found;
      }
    } else {
      template = templateOrId;
    }

    const resolvedVariables = EmailTemplateGenerator.buildResolvedVariables(
      details,
      template.placeholders || [],
      options
    );

    const subject = EmailTemplateGenerator.interpolate(
      template.subjectTemplate,
      resolvedVariables,
      { escapeHtml: false }
    );

    const html = EmailTemplateGenerator.interpolate(
      template.htmlTemplate,
      resolvedVariables,
      { escapeHtml: options.escapeHtmlValues !== false }
    );

    const text = EmailTemplateGenerator.interpolate(
      template.textTemplate,
      resolvedVariables,
      { escapeHtml: false }
    );

    return {
      templateId: template.id,
      templateName: template.name,
      enabled: template.enabled,
      ccAdmin: template.ccAdmin,
      subject,
      html,
      text,
      resolvedVariables,
    };
  }

  /**
   * Fetches the active Admin-customized template from `/api/email/templates`
   * (falling back cleanly to cached or default templates if offline) and injects
   * client details before dispatching to Brevo.
   */
  static async generateFromAdminTemplate(
    templateId: string,
    details: AppointmentClientDetails,
    options: EmailGeneratorOptions = {}
  ): Promise<GeneratedEmailOutput> {
    let selectedTemplate: TransactionalEmailTemplate | undefined;

    if (typeof fetch !== 'undefined') {
      try {
        const res = await fetch('/api/email/templates');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.templates) && data.templates.length > 0) {
            cacheAdminEmailTemplates(data.templates);
            selectedTemplate = data.templates.find(
              (t: TransactionalEmailTemplate) => t.id === templateId
            );
          }
        }
      } catch {
        // Fall through to cached / default template
      }
    }

    if (!selectedTemplate) {
      const cached = getCachedAdminEmailTemplates();
      selectedTemplate =
        cached?.find((t) => t.id === templateId) ||
        DEFAULT_TRANSACTIONAL_EMAIL_TEMPLATES.find((t) => t.id === templateId) ||
        DEFAULT_TRANSACTIONAL_EMAIL_TEMPLATES.find((t) => t.id === 'booking_confirmation');
    }

    return EmailTemplateGenerator.generate(
      selectedTemplate || templateId,
      details,
      options
    );
  }

  /**
   * Instance method delegating to `EmailTemplateGenerator.generate` with instance defaults.
   */
  generate(
    templateOrId:
      | string
      | Pick<
          TransactionalEmailTemplate,
          | 'id'
          | 'name'
          | 'enabled'
          | 'ccAdmin'
          | 'subjectTemplate'
          | 'htmlTemplate'
          | 'textTemplate'
          | 'placeholders'
        >,
    details: AppointmentClientDetails,
    options: EmailGeneratorOptions = {}
  ): GeneratedEmailOutput {
    return EmailTemplateGenerator.generate(
      templateOrId,
      { ...this.defaultDetails, ...details },
      options
    );
  }

  /**
   * Instance method delegating to `EmailTemplateGenerator.injectIntoHtmlTemplate`.
   */
  injectIntoHtml(
    htmlTemplate: string,
    details: AppointmentClientDetails,
    options: EmailGeneratorOptions = {}
  ): string {
    return EmailTemplateGenerator.injectIntoHtmlTemplate(
      htmlTemplate,
      { ...this.defaultDetails, ...details },
      options
    );
  }

  private static buildResolvedVariables(
    details: AppointmentClientDetails,
    placeholders: TransactionalEmailTemplate['placeholders'],
    options: EmailGeneratorOptions
  ): Record<string, string> {
    const resolved = EmailTemplateGenerator.normalizeClientDetails(details);

    for (const ph of placeholders || []) {
      if (resolved[ph.key] === undefined || resolved[ph.key] === '') {
        if (options.fallbackValues?.[ph.key]) {
          resolved[ph.key] = options.fallbackValues[ph.key];
        } else if (options.useSampleFallback && ph.sampleValue) {
          resolved[ph.key] = ph.sampleValue;
        } else if (!(ph.key in resolved)) {
          resolved[ph.key] = '';
        }
      }
    }

    if (options.fallbackValues) {
      for (const [k, v] of Object.entries(options.fallbackValues)) {
        if (resolved[k] === undefined || resolved[k] === '') {
          resolved[k] = v;
        }
      }
    }

    return resolved;
  }

  private static interpolate(
    template: string,
    variables: Record<string, string>,
    config: { escapeHtml: boolean }
  ): string {
    if (!template) return '';

    const lowerLookup = new Map<string, string>();
    for (const [k, v] of Object.entries(variables)) {
      lowerLookup.set(k.toLowerCase(), v);
    }

    return template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_match, rawKey: string) => {
      const value =
        variables[rawKey] !== undefined
          ? variables[rawKey]
          : lowerLookup.get(rawKey.toLowerCase()) ?? '';

      if (!config.escapeHtml || RAW_HTML_SAFE_KEYS.has(rawKey)) {
        return value;
      }
      return escapeHtmlValue(value);
    });
  }
}

export const emailTemplateGenerator = new EmailTemplateGenerator();

export default EmailTemplateGenerator;
