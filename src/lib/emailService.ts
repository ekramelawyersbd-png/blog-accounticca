import dotenv from 'dotenv';
import nodemailer, { type SendMailOptions, type Transporter } from 'nodemailer';
import {
  renderTransactionalTemplate,
  extractTemplatePlaceholderKeys,
  type TransactionalEmailTemplate,
} from '../utils/transactionalEmailTemplates';

dotenv.config({ override: true });

export interface BrevoSmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  login: string;
  smtpKey: string;
  apiKey: string;
  senderName: string;
  senderEmail: string;
  supportEmail: string;
  fromHeader: string;
  formattedFrom: string;
  hasSmtpCredentials: boolean;
  hasApiCredentials: boolean;
  hasCredentials: boolean;
}

export interface BrevoRelaySummary {
  host: string;
  port: number;
  login: string;
  senderName: string;
  senderEmail: string;
  supportEmail: string;
  fromHeader: string;
  formattedFrom: string;
  liveRelayActive: boolean;
  configured: boolean;
  hasCredentials: boolean;
  hasSmtpCredentials: boolean;
  hasApiCredentials: boolean;
  keyFormat: 'xkeysib_api' | 'xsmtpsib_smtp' | 'configured_other' | 'missing';
  mode: string;
  status: string;
  lastError: string | null;
  lastVerifiedAt: string | null;
}

export interface SendTransactionalEmailOptions {
  /** Primary recipient email address (alias for recipientEmail) */
  to?: string;
  /** Primary recipient email address */
  recipientEmail?: string;
  /** Optional display name for primary recipient */
  recipientName?: string;
  subject: string;
  html: string;
  text?: string;
  cc?: string | string[];
  ccEmails?: string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: SendMailOptions['attachments'];
  headers?: SendMailOptions['headers'];
  /**
   * When true (default for server dispatch endpoints), falls back to an Ethereal/stream
   * MIME transporter if Brevo rejects delivery, while marking `liveDelivered: false`
   * and preserving the exact Brevo error in `smtpNotice`.
   * Set to false to return/throw directly on Brevo failure without fallback capture.
   */
  allowFallback?: boolean;
}

export interface SendTransactionalEmailResult {
  success: boolean;
  liveDelivered: boolean;
  messageId: string;
  transport: string;
  fromHeader: string;
  accepted: string[];
  rejected: string[];
  previewUrl: string | null;
  smtpNotice: string | null;
}

let cachedSmtpTransporter: Transporter | null = null;
let cachedSmtpSignature: string | null = null;
let cachedTestTransporter: Transporter | null = null;
let cachedTestIsEthereal = false;
let lastBrevoDeliveryError: string | null = null;
let lastBrevoVerifiedAt: string | null = null;

/**
 * Reads Brevo SMTP & REST API configuration from `.env` / process environment variables.
 */
export function getBrevoSmtpConfig(): BrevoSmtpConfig {
  const host = (process.env.BREVO_SMTP_HOST || process.env.SMTP_HOST || 'smtp-relay.brevo.com').trim();
  const parsedPort = parseInt(process.env.BREVO_SMTP_PORT || process.env.SMTP_PORT || '587', 10);
  const port = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 587;
  const stripWrappingQuotes = (val: string) => val.trim().replace(/^["']|["']$/g, '').trim();
  const login = stripWrappingQuotes(process.env.BREVO_SMTP_USER || process.env.SMTP_USER || '9dabe5001@smtp-brevo.com');
  const smtpKey = stripWrappingQuotes(process.env.BREVO_SMTP_KEY || process.env.SMTP_PASS || '');
  const apiKey = stripWrappingQuotes(
    process.env.BREVO_API_KEY ||
    (smtpKey.startsWith('xkeysib-') ? smtpKey : '')
  );
  const senderName = (process.env.BREVO_SENDER_NAME || 'ACCOUNTICCA x E-Lawyers').trim();
  const senderEmail = (process.env.BREVO_SENDER_EMAIL || 'ekram@elawyersbd.com').trim();
  const supportEmail = (
    process.env.SUPPORT_EMAIL ||
    process.env.BREVO_SUPPORT_EMAIL ||
    senderEmail ||
    'ekram@elawyersbd.com'
  ).trim();
  const formattedFrom = `"${senderName}" <${senderEmail}>`;

  const hasSmtpCredentials = Boolean(login && smtpKey);
  const hasApiCredentials = Boolean(apiKey);

  return {
    host,
    port,
    secure: port === 465,
    login,
    smtpKey,
    apiKey,
    senderName,
    senderEmail,
    supportEmail,
    fromHeader: formattedFrom,
    formattedFrom,
    hasSmtpCredentials,
    hasApiCredentials,
    hasCredentials: hasSmtpCredentials || hasApiCredentials,
  };
}

/**
 * Returns the configured support email destination from `.env` (`SUPPORT_EMAIL` -> `BREVO_SUPPORT_EMAIL` -> `BREVO_SENDER_EMAIL`).
 */
export function getSupportEmailRecipient(): string {
  return getBrevoSmtpConfig().supportEmail;
}

/**
 * Returns a safe, secret-free diagnostic summary of the Brevo relay configuration.
 */
export function getBrevoRelayConfig(): BrevoRelaySummary {
  const cfg = getBrevoSmtpConfig();

  const activeKey = cfg.apiKey || cfg.smtpKey;
  const keyFormat: BrevoRelaySummary['keyFormat'] = !activeKey
    ? 'missing'
    : activeKey.startsWith('xkeysib-')
    ? 'xkeysib_api'
    : activeKey.startsWith('xsmtpsib-')
    ? 'xsmtpsib_smtp'
    : 'configured_other';

  return {
    host: cfg.host,
    port: cfg.port,
    login: cfg.login,
    senderName: cfg.senderName,
    senderEmail: cfg.senderEmail,
    supportEmail: cfg.supportEmail,
    fromHeader: cfg.fromHeader,
    formattedFrom: cfg.formattedFrom,
    liveRelayActive: cfg.hasCredentials && !lastBrevoDeliveryError,
    configured: cfg.hasCredentials,
    hasCredentials: cfg.hasCredentials,
    hasSmtpCredentials: cfg.hasSmtpCredentials,
    hasApiCredentials: cfg.hasApiCredentials,
    keyFormat,
    mode: !cfg.hasCredentials
      ? 'brevo_unconfigured (missing BREVO_SMTP_KEY or BREVO_API_KEY)'
      : cfg.hasApiCredentials && (!cfg.hasSmtpCredentials || cfg.smtpKey.startsWith('xkeysib-'))
      ? 'brevo_rest_api_v3'
      : `brevo_smtp_relay (${cfg.host}:${cfg.port})`,
    status: !cfg.hasCredentials
      ? 'unconfigured'
      : lastBrevoDeliveryError
      ? 'error'
      : 'ready',
    lastError: lastBrevoDeliveryError,
    lastVerifiedAt: lastBrevoVerifiedAt,
  };
}

/**
 * Creates (and reuses when env values are unchanged) a NodeMailer Transporter
 * configured for Brevo's SMTP relay (`smtp-relay.brevo.com:587` or `:465`).
 */
export function createBrevoTransporter(configOverride?: Partial<BrevoSmtpConfig>): Transporter {
  const base = getBrevoSmtpConfig();
  const cfg: BrevoSmtpConfig = { ...base, ...configOverride };

  if (!cfg.smtpKey) {
    throw new Error('BREVO_SMTP_KEY is not configured in environment (.env).');
  }

  const signature = `${cfg.host}:${cfg.port}:${cfg.login}:${cfg.smtpKey.length}:${cfg.smtpKey.slice(0, 8)}:${cfg.smtpKey.slice(-6)}`;
  if (!configOverride && cachedSmtpTransporter && cachedSmtpSignature === signature) {
    return cachedSmtpTransporter;
  }

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    requireTLS: cfg.port === 587,
    auth: {
      user: cfg.login,
      pass: cfg.smtpKey,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  if (!configOverride) {
    cachedSmtpTransporter = transporter;
    cachedSmtpSignature = signature;
  }

  return transporter;
}

/**
 * Verifies live SMTP handshake and authentication against Brevo (`smtp-relay.brevo.com`).
 */
export async function verifyBrevoSmtpConnection(): Promise<{
  ok: boolean;
  host: string;
  port: number;
  login: string;
  error: string | null;
  verifiedAt: string | null;
}> {
  const cfg = getBrevoSmtpConfig();
  if (!cfg.hasSmtpCredentials) {
    const err = 'Missing BREVO_SMTP_USER or BREVO_SMTP_KEY in environment (.env).';
    lastBrevoDeliveryError = err;
    return {
      ok: false,
      host: cfg.host,
      port: cfg.port,
      login: cfg.login,
      error: err,
      verifiedAt: null,
    };
  }

  try {
    const transporter = createBrevoTransporter();
    await transporter.verify();
    lastBrevoDeliveryError = null;
    lastBrevoVerifiedAt = new Date().toISOString();
    return {
      ok: true,
      host: cfg.host,
      port: cfg.port,
      login: cfg.login,
      error: null,
      verifiedAt: lastBrevoVerifiedAt,
    };
  } catch (err: any) {
    const message = err?.message || 'Brevo SMTP verification failed.';
    lastBrevoDeliveryError = `Brevo SMTP error (${cfg.host}:${cfg.port}): ${message}`;
    return {
      ok: false,
      host: cfg.host,
      port: cfg.port,
      login: cfg.login,
      error: lastBrevoDeliveryError,
      verifiedAt: null,
    };
  }
}

async function getFallbackNodemailerTransporter(): Promise<{
  transporter: Transporter;
  isEthereal: boolean;
}> {
  if (cachedTestTransporter) {
    return { transporter: cachedTestTransporter, isEthereal: cachedTestIsEthereal };
  }
  try {
    const testAccount = await Promise.race([
      nodemailer.createTestAccount(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1200)),
    ]);
    cachedTestTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    cachedTestIsEthereal = true;
    return { transporter: cachedTestTransporter, isEthereal: true };
  } catch {
    const streamTransporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
    cachedTestTransporter = streamTransporter;
    cachedTestIsEthereal = false;
    return {
      transporter: streamTransporter,
      isEthereal: false,
    };
  }
}

function normalizeEmailList(input?: string | string[]): string[] {
  if (!input) return [];
  const rawList = Array.isArray(input) ? input : input.split(/[,;]+/);
  return Array.from(
    new Set(
      rawList
        .map((item) => String(item || '').trim())
        .filter((email) => email.includes('@'))
    )
  );
}

function htmlToPlainText(html: string, fallback: string): string {
  const stripped = html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return stripped || fallback;
}

/**
 * Primary utility function to send transactional emails via NodeMailer using the
 * Brevo SMTP configuration from `.env` (and optional Brevo REST API v3 fallback/priority).
 */
export async function sendTransactionalEmail(
  options: SendTransactionalEmailOptions
): Promise<SendTransactionalEmailResult> {
  const cfg = getBrevoSmtpConfig();
  const recipientEmail = String(options.recipientEmail || options.to || '').trim();

  if (!recipientEmail || !recipientEmail.includes('@')) {
    throw new Error('A valid recipient email address (`to` / `recipientEmail`) is required.');
  }

  const cleanCc = Array.from(
    new Set([
      ...normalizeEmailList(options.cc),
      ...normalizeEmailList(options.ccEmails),
    ])
  ).filter((email) => email.toLowerCase() !== recipientEmail.toLowerCase());

  const cleanBcc = normalizeEmailList(options.bcc).filter(
    (email) => email.toLowerCase() !== recipientEmail.toLowerCase()
  );

  const plainText = (options.text || '').trim() || htmlToPlainText(options.html, options.subject);
  const toHeader = options.recipientName
    ? `"${options.recipientName}" <${recipientEmail}>`
    : recipientEmail;

  let smtpNotice: string | null = !cfg.hasCredentials
    ? 'Brevo credentials are not set (missing BREVO_SMTP_KEY or BREVO_API_KEY in .env).'
    : null;

  // 1. Primary NodeMailer Brevo SMTP Relay (`smtp-relay.brevo.com:587` / `:465`)
  if (cfg.hasSmtpCredentials && !cfg.smtpKey.startsWith('xkeysib-')) {
    try {
      const transporter = createBrevoTransporter(cfg);
      const info = await transporter.sendMail({
        from: cfg.formattedFrom,
        to: toHeader,
        cc: cleanCc.length > 0 ? cleanCc : undefined,
        bcc: cleanBcc.length > 0 ? cleanBcc : undefined,
        replyTo: options.replyTo || cfg.senderEmail,
        subject: options.subject,
        html: options.html,
        text: plainText,
        attachments: options.attachments,
        headers: options.headers,
      });

      lastBrevoDeliveryError = null;
      lastBrevoVerifiedAt = new Date().toISOString();

      return {
        success: true,
        liveDelivered: true,
        messageId: info.messageId || `<brevo-smtp-${Date.now()}@smtp-relay.brevo.com>`,
        transport: `brevo_smtp_relay (${cfg.host}:${cfg.port} • ${cfg.login})`,
        fromHeader: cfg.formattedFrom,
        accepted: Array.isArray(info.accepted) ? info.accepted.map(String) : [recipientEmail],
        rejected: Array.isArray(info.rejected) ? info.rejected.map(String) : [],
        previewUrl: null,
        smtpNotice: null,
      };
    } catch (smtpErr: any) {
      smtpNotice = `Brevo SMTP error (${cfg.host}:${cfg.port}): ${smtpErr?.message || 'relay failure'}`;
    }
  }

  // 2. Brevo Transactional Email REST API v3 (used when BREVO_API_KEY or `xkeysib-` key is provided)
  if (cfg.apiKey) {
    try {
      const brevoPayload: Record<string, any> = {
        sender: { name: cfg.senderName, email: cfg.senderEmail },
        to: [{ email: recipientEmail, name: options.recipientName || 'Valued Client' }],
        replyTo: { email: options.replyTo || cfg.senderEmail, name: cfg.senderName },
        subject: options.subject,
        htmlContent: options.html,
        textContent: plainText,
      };
      if (cleanCc.length > 0) {
        brevoPayload.cc = cleanCc.map((email) => ({ email }));
      }
      if (cleanBcc.length > 0) {
        brevoPayload.bcc = cleanBcc.map((email) => ({ email }));
      }

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'api-key': cfg.apiKey,
        },
        body: JSON.stringify(brevoPayload),
      });

      if (response.ok) {
        const result = (await response.json()) as { messageId?: string };
        lastBrevoDeliveryError = null;
        lastBrevoVerifiedAt = new Date().toISOString();

        return {
          success: true,
          liveDelivered: true,
          messageId: result.messageId || `<brevo-api-${Date.now()}@smtp-relay.brevo.com>`,
          transport: `brevo_rest_api_v3 (${cfg.host})`,
          fromHeader: cfg.formattedFrom,
          accepted: [recipientEmail, ...cleanCc, ...cleanBcc],
          rejected: [],
          previewUrl: null,
          smtpNotice: null,
        };
      } else {
        const errBody = await response.text();
        smtpNotice = `Brevo REST API error (${response.status}): ${errBody.slice(0, 220)}`;
      }
    } catch (apiErr: any) {
      smtpNotice = `Brevo REST API error: ${apiErr?.message || 'network error'}`;
    }
  }

  lastBrevoDeliveryError = smtpNotice;

  if (options.allowFallback === false) {
    return {
      success: false,
      liveDelivered: false,
      messageId: `<failed-${Date.now()}@local.invalid>`,
      transport: 'brevo_dispatch_failed',
      fromHeader: cfg.formattedFrom,
      accepted: [],
      rejected: [recipientEmail],
      previewUrl: null,
      smtpNotice,
    };
  }

  // 3. Sandbox/Dev Fallback (Ethereal or in-memory MIME stream — marks `liveDelivered: false`)
  try {
    const { transporter, isEthereal } = await getFallbackNodemailerTransporter();
    const info = await transporter.sendMail({
      from: cfg.formattedFrom,
      to: toHeader,
      cc: cleanCc.length > 0 ? cleanCc : undefined,
      bcc: cleanBcc.length > 0 ? cleanBcc : undefined,
      replyTo: options.replyTo || cfg.senderEmail,
      subject: options.subject,
      html: options.html,
      text: plainText,
      attachments: options.attachments,
      headers: options.headers,
    });
    const previewUrl = isEthereal ? (nodemailer.getTestMessageUrl(info) || null) : null;
    return {
      success: false,
      liveDelivered: false,
      messageId: info.messageId || `<fallback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@local.invalid>`,
      transport: isEthereal ? 'ethereal_test_fallback' : 'local_mime_stream_fallback',
      fromHeader: cfg.formattedFrom,
      accepted: [],
      rejected: [recipientEmail],
      previewUrl: typeof previewUrl === 'string' ? previewUrl : null,
      smtpNotice,
    };
  } catch (err: any) {
    return {
      success: false,
      liveDelivered: false,
      messageId: `<failed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@local.invalid>`,
      transport: 'brevo_dispatch_failed',
      fromHeader: cfg.formattedFrom,
      accepted: [],
      rejected: [recipientEmail],
      previewUrl: null,
      smtpNotice: smtpNotice || err?.message || 'Unknown email dispatch error',
    };
  }
}

/**
 * Convenience wrapper matching server dispatcher routes.
 */
export async function dispatchBrevoEmail(options: {
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  html: string;
  text?: string;
  ccEmails?: string[];
  replyTo?: string;
  allowFallback?: boolean;
}): Promise<{
  messageId: string;
  transport: string;
  fromHeader: string;
  previewUrl: string | null;
  smtpNotice: string | null;
  liveDelivered: boolean;
}> {
  const result = await sendTransactionalEmail(options);
  return {
    messageId: result.messageId,
    transport: result.transport,
    fromHeader: result.fromHeader,
    previewUrl: result.previewUrl,
    smtpNotice: result.smtpNotice,
    liveDelivered: result.liveDelivered,
  };
}

export interface SupportContactSubmission {
  referenceId: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  department?: string;
  subject: string;
  message: string;
  submittedAt?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Formats and dispatches a validated contact/support form submission to the
 * support email address defined in `.env` (`SUPPORT_EMAIL` / `BREVO_SUPPORT_EMAIL` / `BREVO_SENDER_EMAIL`).
 */
export async function sendSupportContactEmail(
  submission: SupportContactSubmission
): Promise<{
  supportEmail: string;
  subject: string;
  html: string;
  text: string;
  result: SendTransactionalEmailResult;
}> {
  const cfg = getBrevoSmtpConfig();
  const supportEmail = cfg.supportEmail;
  const submittedAt = submission.submittedAt || new Date().toISOString();
  const department = (submission.department || 'General & Advisory Support').trim();
  const emailSubject = `[Support Desk • ${submission.referenceId}] ${submission.subject.trim()}`;

  const safeName = escapeHtml(submission.name.trim());
  const safeEmail = escapeHtml(submission.email.trim());
  const safePhone = escapeHtml((submission.phone || 'Not provided').trim());
  const safeCompany = escapeHtml((submission.companyName || 'Individual / Not specified').trim());
  const safeDept = escapeHtml(department);
  const safeSubject = escapeHtml(submission.subject.trim());
  const safeMessageHtml = escapeHtml(submission.message.trim()).replace(/\r?\n/g, '<br />');
  const safeRef = escapeHtml(submission.referenceId);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:#064e3b;padding:24px 28px;color:#ffffff;">
              <p style="margin:0;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#a7f3d0;font-weight:700;">ACCOUNTICCA × E-LAWYERS SUPPORT DESK</p>
              <h1 style="margin:8px 0 0;font-size:20px;line-height:1.3;font-weight:700;">New Support Form Submission</h1>
              <p style="margin:6px 0 0;font-size:13px;color:#d1fae5;">Docket Reference: <strong>${safeRef}</strong></p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
                <tr>
                  <td style="padding:8px 0;color:#64748b;width:140px;vertical-align:top;">Sender Name</td>
                  <td style="padding:8px 0;color:#0f172a;font-weight:600;">${safeName}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#64748b;vertical-align:top;">Reply-To Email</td>
                  <td style="padding:8px 0;"><a href="mailto:${safeEmail}" style="color:#047857;font-weight:600;text-decoration:none;">${safeEmail}</a></td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#64748b;vertical-align:top;">Phone / WhatsApp</td>
                  <td style="padding:8px 0;color:#0f172a;">${safePhone}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#64748b;vertical-align:top;">Organization</td>
                  <td style="padding:8px 0;color:#0f172a;">${safeCompany}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#64748b;vertical-align:top;">Support Desk</td>
                  <td style="padding:8px 0;color:#0f172a;font-weight:600;">${safeDept}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#64748b;vertical-align:top;">Subject</td>
                  <td style="padding:8px 0;color:#0f172a;font-weight:600;">${safeSubject}</td>
                </tr>
              </table>

              <div style="margin-top:20px;padding:16px 18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#475569;">Message Details</p>
                <p style="margin:0;font-size:14px;line-height:1.65;color:#1e293b;">${safeMessageHtml}</p>
              </div>

              <p style="margin:20px 0 0;font-size:12px;color:#64748b;">
                Submitted at ${escapeHtml(submittedAt)} · Replying directly to this email addresses <strong>${safeEmail}</strong>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  const text = [
    `ACCOUNTICCA x E-LAWYERS SUPPORT DESK`,
    `Reference: ${submission.referenceId}`,
    `Submitted At: ${submittedAt}`,
    ``,
    `Sender Name: ${submission.name.trim()}`,
    `Email: ${submission.email.trim()}`,
    `Phone: ${(submission.phone || 'Not provided').trim()}`,
    `Organization: ${(submission.companyName || 'Individual / Not specified').trim()}`,
    `Department: ${department}`,
    `Subject: ${submission.subject.trim()}`,
    ``,
    `Message:`,
    submission.message.trim(),
  ].join('\n');

  const result = await sendTransactionalEmail({
    recipientEmail: supportEmail,
    recipientName: 'ACCOUNTICCA x E-Lawyers Support Desk',
    replyTo: submission.email.trim(),
    subject: emailSubject,
    html,
    text,
    headers: {
      'X-Support-Reference': submission.referenceId,
      'X-Support-Department': department,
    },
  });

  return {
    supportEmail,
    subject: emailSubject,
    html,
    text,
    result,
  };
}

export interface EmailTemplatePreviewInput {
  template: Pick<
    TransactionalEmailTemplate,
    'id' | 'name' | 'category' | 'enabled' | 'ccAdmin' | 'subjectTemplate' | 'htmlTemplate' | 'textTemplate' | 'placeholders'
  >;
  variables?: Record<string, string | number | undefined | null>;
  useSampleFallback?: boolean;
  recipientEmail?: string;
  recipientName?: string;
  ccAdmin?: boolean;
}

export interface EmailTemplatePreviewResult {
  templateId: string;
  templateName: string;
  category: TransactionalEmailTemplate['category'];
  enabled: boolean;
  fromHeader: string;
  senderEmail: string;
  replyTo: string;
  toHeader: string;
  ccEmails: string[];
  subject: string;
  html: string;
  text: string;
  resolvedVariables: Record<string, string>;
  placeholderKeys: string[];
  unresolvedPlaceholders: string[];
  htmlBytes: number;
  textLength: number;
  relaySummary: BrevoRelaySummary;
}

/**
 * Generates an accurate server-side email preview using the active Brevo `emailService`
 * envelope settings (`fromHeader`, `ccAdmin`, `relaySummary`) and template interpolation.
 */
export function previewEmailTemplate(input: EmailTemplatePreviewInput): EmailTemplatePreviewResult {
  const cfg = getBrevoSmtpConfig();
  const relaySummary = getBrevoRelayConfig();
  const useSampleFallback = input.useSampleFallback !== false;

  const rendered = renderTransactionalTemplate(
    input.template,
    input.variables || {},
    useSampleFallback
  );

  const placeholderKeys = extractTemplatePlaceholderKeys(
    input.template.subjectTemplate,
    input.template.htmlTemplate,
    input.template.textTemplate
  );

  const unresolvedPlaceholders = placeholderKeys.filter((key) => {
    const val = rendered.resolvedVariables[key];
    return val === undefined || val === null || String(val).trim() === '';
  });

  const cleanRecipient = (input.recipientEmail || '').trim();
  const toHeader = cleanRecipient
    ? input.recipientName
      ? `"${input.recipientName.trim()}" <${cleanRecipient}>`
      : cleanRecipient
    : '(No recipient selected yet)';

  const shouldCcAdmin = input.ccAdmin ?? input.template.ccAdmin;
  const ccEmails =
    shouldCcAdmin && cfg.senderEmail.toLowerCase() !== cleanRecipient.toLowerCase()
      ? [cfg.senderEmail]
      : [];

  return {
    templateId: input.template.id,
    templateName: input.template.name,
    category: input.template.category,
    enabled: input.template.enabled,
    fromHeader: cfg.formattedFrom,
    senderEmail: cfg.senderEmail,
    replyTo: cfg.senderEmail,
    toHeader,
    ccEmails,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    resolvedVariables: rendered.resolvedVariables,
    placeholderKeys,
    unresolvedPlaceholders,
    htmlBytes: Buffer.byteLength(rendered.html || '', 'utf-8'),
    textLength: (rendered.text || '').length,
    relaySummary,
  };
}

export interface SendEmailTemplateToUserOptions extends EmailTemplatePreviewInput {
  recipientEmail: string;
  recipientName?: string;
  referenceId?: string;
  allowFallback?: boolean;
}

/**
 * Renders an email template and dispatches it directly to the target user via `sendTransactionalEmail`.
 */
export async function sendEmailTemplateToUser(options: SendEmailTemplateToUserOptions): Promise<{
  preview: EmailTemplatePreviewResult;
  result: SendTransactionalEmailResult;
}> {
  const preview = previewEmailTemplate(options);
  const result = await sendTransactionalEmail({
    recipientEmail: options.recipientEmail.trim(),
    recipientName: options.recipientName?.trim() || 'Valued Client',
    ccEmails: preview.ccEmails,
    subject: preview.subject,
    html: preview.html,
    text: preview.text,
    allowFallback: options.allowFallback,
    headers: {
      'X-Email-Template-Id': options.template.id,
      ...(options.referenceId ? { 'X-Dispatch-Reference': options.referenceId } : {}),
    },
  });

  return { preview, result };
}
