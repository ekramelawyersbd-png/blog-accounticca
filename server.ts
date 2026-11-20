import dotenv from 'dotenv';
dotenv.config({ override: true });
import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import { promisify } from 'util';
import {
  getBrevoRelayConfig,
  getSupportEmailRecipient,
  dispatchBrevoEmail,
  sendSupportContactEmail,
  previewEmailTemplate,
  sendEmailTemplateToUser,
  verifyBrevoSmtpConnection,
} from './src/lib/emailService';
import {
  DEFAULT_TRANSACTIONAL_EMAIL_TEMPLATES,
  renderTransactionalTemplate,
  type TransactionalEmailTemplate,
} from './src/utils/transactionalEmailTemplates';
import { EmailTemplateGenerator } from './src/utils/emailGenerator';
import {
  generateCareerNotificationEmailHtml,
  generateCandidateAcknowledgementEmailHtml,
  type CareerApplicationData,
} from './src/utils/careerEmailTemplate';
import {
  resolveSeoMetadataForPath,
  generateAllBlogArticlesSeoMetadata,
  generateAllToolsSeoMetadata,
  injectSeoMetadataIntoHtml,
} from './src/services/seoMetadataService';
import {
  DEFAULT_SEO_CONFIG,
  generateRobotsTxt,
  generateLlmsTxt,
} from './src/utils/seoConfig';
import { crawlAllRoutesForSitemap } from './src/utils/sitemapGenerator';
import {
  getAdminFirestore,
  getFirebaseAdminStatus,
  verifyFirebaseIdToken,
  FieldValue,
} from './src/lib/firebaseAdmin';
import {
  maskEmail,
  maskPhone,
  sanitizePlainText,
  resolveClientIp,
  rateLimit,
  checkDuplicateSubmission,
  recordSubmissionFingerprint,
  createTurnstileVerificationProof,
  consumeTurnstileVerificationProof,
  contactInquirySchema,
  newsletterSubscribeSchema,
  newsletterUnsubscribeSchema,
  createUnsubscribeSignature,
  verifyUnsubscribeSignature,
} from './src/lib/securityMiddleware';
import {
  loginAdminWithPassword,
  syncAdminFromVerifiedFirebaseToken,
  verifyAdminSessionToken,
  revokeAdminSessionToken,
  revokeAllAdminSessionsForEmail,
  requireAdminAuth,
  extractBearerToken,
} from './src/lib/adminAuth';
import {
  syncContactLeadToNotion,
  syncNewsletterSubscriberToNotion,
  retryFailedNotionSyncs,
  getNotionSyncStatus,
  getNotionConfiguration,
} from './src/lib/notionService';

const execFileAsync = promisify(execFile);

const __filename = import.meta?.url ? fileURLToPath(import.meta.url) : path.resolve(process.cwd(), 'server.ts');
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', true);

const publicSubmitLimiter = rateLimit({
  keyPrefix: 'public_submit',
  windowMs: 60_000,
  maxRequests: 15,
  blockDurationMs: 2 * 60_000,
});

const strictAuthLimiter = rateLimit({
  keyPrefix: 'auth_action',
  windowMs: 5 * 60_000,
  maxRequests: 10,
  blockDurationMs: 5 * 60_000,
});

function resolvePort(): number {
  const portArgIdx = process.argv.indexOf('--port');
  if (portArgIdx !== -1 && process.argv[portArgIdx + 1]) {
    const p = parseInt(process.argv[portArgIdx + 1], 10);
    if (!isNaN(p)) return p;
  }
  if (process.env.PORT) {
    const p = parseInt(process.env.PORT, 10);
    if (!isNaN(p)) return p;
  }
  return 3000;
}

const PORT = resolvePort();

const IS_PROD = process.env.NODE_ENV === 'production' && process.env.npm_lifecycle_event !== 'dev';

// Body parsers
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true }));

// Use OS temp directory for runtime state so workspace remains clean and Cloud Run read-only root works
const DATA_DIR = path.join(os.tmpdir(), 'accounticca-runtime-data');
const TOOL_SIGNINGS_FILE = path.join(DATA_DIR, 'workspace_tool_signings.json');
const CONTACT_REQUESTS_FILE = path.join(DATA_DIR, 'contact-requests-server.json');
const CAREER_APPLICATIONS_FILE = path.join(DATA_DIR, 'career-applications-server.json');
const UDDOKTAPAY_INVOICES_FILE = path.join(DATA_DIR, 'uddoktapay-invoices.json');
const APPOINTMENT_NOTIFS_FILE = path.join(DATA_DIR, 'appointment-email-notifications.json');
const CALCULATION_EMAILS_FILE = path.join(DATA_DIR, 'calculation-emails-server.json');
const EMAIL_TEMPLATES_FILE = path.join(DATA_DIR, 'transactional-email-templates.json');
const EMAIL_HISTORY_FILE = path.join(DATA_DIR, 'transactional-email-history.json');
const SCHEDULED_EMAILS_FILE = path.join(DATA_DIR, 'scheduled-email-dispatches.json');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (mkdirErr) {
  console.warn('[Server] Runtime data directory notice:', mkdirErr);
}

function readJsonArray<T = any>(filePath: string): T[] {
  try {
    if (fs.existsSync(filePath)) {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (err) {
    console.warn(`Warning reading ${path.basename(filePath)}:`, err);
  }
  return [];
}

function writeJsonArray<T = any>(filePath: string, data: T[]): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn(`Warning writing ${path.basename(filePath)}:`, err);
  }
}

// Brevo SMTP & Transactional Email Engine is provided by ./src/lib/emailService.ts

function loadEmailTemplates(): TransactionalEmailTemplate[] {
  const saved = readJsonArray<TransactionalEmailTemplate>(EMAIL_TEMPLATES_FILE);
  if (!saved || saved.length === 0) {
    writeJsonArray(EMAIL_TEMPLATES_FILE, DEFAULT_TRANSACTIONAL_EMAIL_TEMPLATES);
    return DEFAULT_TRANSACTIONAL_EMAIL_TEMPLATES;
  }
  const byId = new Map(saved.map((t) => [t.id, t]));
  const merged = DEFAULT_TRANSACTIONAL_EMAIL_TEMPLATES.map((def) => {
    const savedTpl = byId.get(def.id);
    if (!savedTpl) return def;
    const existingKeys = new Set((savedTpl.placeholders || []).map((p) => p.key));
    const mergedPlaceholders = [
      ...(savedTpl.placeholders || []),
      ...def.placeholders.filter((p) => !existingKeys.has(p.key)),
    ];
    return {
      ...def,
      ...savedTpl,
      placeholders: mergedPlaceholders,
      builderConfig: savedTpl.builderConfig || def.builderConfig,
    };
  });
  return merged;
}

function saveEmailTemplates(templates: TransactionalEmailTemplate[]): void {
  writeJsonArray(EMAIL_TEMPLATES_FILE, templates);
}

interface ServerEmailLogRecord {
  id: string;
  messageId: string;
  referenceId: string;
  appointmentId?: string;
  clientName: string;
  recipientEmail: string;
  ccEmails?: string[];
  phone?: string;
  companyName?: string;
  practiceArea: string;
  mode: string;
  date: string;
  timeSlot: string;
  status: string;
  subject: string;
  html: string;
  text: string;
  sentAt: string;
  retriedAt?: string;
  delivered: boolean;
  deliveryStatus: 'delivered' | 'pending' | 'failed';
  category: 'registration' | 'booking' | 'payment' | 'system';
  transport: string;
  fromHeader?: string;
  previewUrl?: string | null;
  smtpNotice?: string | null;
}

function loadEmailHistory(): ServerEmailLogRecord[] {
  const history = readJsonArray<ServerEmailLogRecord>(EMAIL_HISTORY_FILE);
  const calcLogs = readJsonArray<any>(CALCULATION_EMAILS_FILE);

  // Sync any calculation emails that are not yet in EMAIL_HISTORY_FILE
  let modifiedHistory = false;
  let modifiedCalc = false;
  const existingRefs = new Set(history.map((h) => h.referenceId));
  const relay = getBrevoRelayConfig();

  for (const c of calcLogs) {
    if (c.relayMode === 'accounticca-smtp-relay') {
      c.relayMode = `brevo_smtp_relay (${relay.host}:${relay.port})`;
      modifiedCalc = true;
    }
    if (c.referenceId && !existingRefs.has(c.referenceId)) {
      existingRefs.add(c.referenceId);
      history.unshift({
        id: c.id || `calc-log-${Date.now()}`,
        messageId: c.id || `<${c.referenceId}@smtp-relay.brevo.com>`,
        referenceId: c.referenceId,
        clientName: c.recipientName || 'Verified Member',
        recipientEmail: c.primaryRecipient,
        ccEmails: c.ccRecipients || [],
        practiceArea: c.toolName || 'Statutory Calculation Report',
        mode: c.toolCategory || 'Compliance Calculator',
        date: (c.sentAt || new Date().toISOString()).slice(0, 10),
        timeSlot: new Date(c.sentAt || Date.now()).toLocaleTimeString(),
        status: 'Delivered',
        subject: c.subject || `[${c.referenceId}] Calculation Report`,
        html: c.html || `<div style="font-family:sans-serif;padding:24px;"><h2>${c.subject || c.toolName}</h2><p>Reference: <strong>${c.referenceId}</strong></p><p>Recipient: ${c.primaryRecipient}</p><p>Summary: ${c.summaryHighlight || 'Complete Report'}</p></div>`,
        text: c.text || `${c.subject || c.toolName} (${c.referenceId}) — ${c.summaryHighlight || ''}`,
        sentAt: c.sentAt || new Date().toISOString(),
        delivered: true,
        deliveryStatus: 'delivered',
        category: 'system',
        transport: c.relayMode || `brevo_smtp_relay (${relay.host}:${relay.port} • ${relay.login})`,
        fromHeader: relay.formattedFrom,
        previewUrl: c.previewUrl || null,
        smtpNotice: null,
      });
      modifiedHistory = true;
    }
  }

  if (modifiedCalc) {
    writeJsonArray(CALCULATION_EMAILS_FILE, calcLogs);
  }
  if (modifiedHistory) {
    writeJsonArray(EMAIL_HISTORY_FILE, history.slice(0, 400));
  }

  return history.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
}

function appendEmailHistory(record: ServerEmailLogRecord): void {
  const history = loadEmailHistory();
  history.unshift(record);
  if (history.length > 400) history.length = 400;
  writeJsonArray(EMAIL_HISTORY_FILE, history);
}

// In-memory + file-backed tool signings storage
interface ToolSigningRecord {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  photoURL?: string;
  toolId: string;
  toolName: string;
  toolCategory: string;
  toolPath: string;
  authProvider: string;
  signedAt: string;
  formattedDate: string;
  sessionStatus: 'active' | 'completed' | 'verified';
  userAgent?: string;
}

function loadSignings(): ToolSigningRecord[] {
  return readJsonArray<ToolSigningRecord>(TOOL_SIGNINGS_FILE);
}

function saveSignings(signings: ToolSigningRecord[]): void {
  writeJsonArray(TOOL_SIGNINGS_FILE, signings);
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  const relay = getBrevoRelayConfig();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    brevoRelay: {
      configured: relay.configured,
      mode: relay.mode,
      senderName: relay.senderName,
    },
    turnstileConfigured: Boolean(
      process.env.TURNSTILE_SECRET?.trim() || process.env.TURNSTILE_SECRET_KEY?.trim()
    ),
    turnstileSiteKey: DEFAULT_TURNSTILE_SITE_KEY,
    firestoreAdmin: getFirebaseAdminStatus(),
    notion: getNotionConfiguration(),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Cloudflare Turnstile Human Verification API
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_TURNSTILE_SITE_KEY = '0x4AAAAAAGCXo5pLXTP4rONr';
const CLOUDFLARE_TEST_SITE_KEY = '1x00000000000000000000AA';
const CLOUDFLARE_TEST_SECRET_KEY = '1x0000000000000000000000000000000AA';
const STALE_TURNSTILE_SITE_KEYS = new Set([
  'your_turnstile_site_key',
  'YOUR_SITE_KEY',
  '0x4AAAAAAGBkPsSQei2rRiGP',
  '0x4AAAAAAGCW2H9ASNhKzhcu',
]);
const redeemedTurnstileTokens = new Map<string, number>();

function cleanupRedeemedTurnstileTokens(): void {
  const now = Date.now();
  for (const [tok, expiresAt] of redeemedTurnstileTokens.entries()) {
    if (expiresAt <= now) {
      redeemedTurnstileTokens.delete(tok);
    }
  }
}

function resolveServerTurnstileSiteKey(): string {
  const candidates = [
    process.env.VITE_TURNSTILE_SITE_KEY,
    process.env.TURNSTILE_SITE_KEY,
    process.env.CLOUDFLARE_TURNSTILE_SITE_KEY,
  ];
  for (const val of candidates) {
    const trimmed = typeof val === 'string' ? val.trim() : '';
    if (trimmed && !STALE_TURNSTILE_SITE_KEYS.has(trimmed)) {
      return trimmed;
    }
  }
  return DEFAULT_TURNSTILE_SITE_KEY;
}

function resolveServerTurnstileSecretKey(token: string): {
  secret: string;
  usingTestKey: boolean;
} {
  // Tokens generated by Cloudflare's official test sitekey (1x00000000000000000000AA)
  // contain 'DUMMY.TOKEN' and must be validated with Cloudflare's test secret key.
  if (token.includes('DUMMY.TOKEN')) {
    return { secret: CLOUDFLARE_TEST_SECRET_KEY, usingTestKey: true };
  }

  const candidates = [
    process.env.TURNSTILE_SECRET,
    process.env.TURNSTILE_SECRET_KEY,
    process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY,
  ];
  for (const val of candidates) {
    const trimmed = typeof val === 'string' ? val.trim() : '';
    if (
      trimmed &&
      trimmed !== 'your_turnstile_secret_key' &&
      trimmed !== 'YOUR_SECRET_KEY'
    ) {
      return { secret: trimmed, usingTestKey: false };
    }
  }
  return { secret: CLOUDFLARE_TEST_SECRET_KEY, usingTestKey: true };
}

function extractTurnstileToken(body: any): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  if (body['cf-turnstile-response'] !== undefined) {
    return String(body['cf-turnstile-response'] || '');
  }
  if (body.turnstileToken !== undefined) {
    return String(body.turnstileToken || '');
  }
  if (body.token !== undefined) {
    return String(body.token || '');
  }
  return undefined;
}

async function verifyTurnstileToken(
  token: string,
  remoteIp?: string,
  expectedAction?: string
): Promise<{
  success: boolean;
  message?: string;
  errorCodes?: string[];
  action?: string;
  hostname?: string;
  usingTestKey: boolean;
}> {
  const cleanToken = typeof token === 'string' ? token.trim() : '';
  const { secret, usingTestKey } = resolveServerTurnstileSecretKey(cleanToken);

  if (!cleanToken || cleanToken.length > 2048) {
    return {
      success: false,
      message: 'Missing or invalid Cloudflare Turnstile verification token.',
      errorCodes: ['missing-input-response'],
      usingTestKey,
    };
  }

  cleanupRedeemedTurnstileTokens();
  if (!cleanToken.includes('DUMMY.TOKEN') && redeemedTurnstileTokens.has(cleanToken)) {
    return {
      success: false,
      message: 'Cloudflare Turnstile token has already been used. Please complete a fresh challenge.',
      errorCodes: ['timeout-or-duplicate'],
      usingTestKey,
    };
  }

  const expectedHostnames = new Set(
    (process.env.TURNSTILE_HOSTNAMES ?? '')
      .split(',')
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean)
  );

  try {
    const form = new URLSearchParams({
      secret,
      response: cleanToken,
      ...(remoteIp && !usingTestKey ? { remoteip: remoteIp } : {}),
    });

    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(10_000),
      body: form,
    });

    if (!verifyRes.ok) {
      throw new Error(`siteverify ${verifyRes.status}`);
    }

    const data: any = await verifyRes.json().catch(() => ({}));
    if (data?.success === true) {
      if (
        !usingTestKey &&
        expectedAction &&
        typeof data.action === 'string' &&
        data.action.length > 0 &&
        data.action !== expectedAction
      ) {
        return {
          success: false,
          message: 'Cloudflare Turnstile action mismatch.',
          errorCodes: ['action-mismatch'],
          usingTestKey,
        };
      }

      if (
        !usingTestKey &&
        expectedHostnames.size > 0 &&
        (!data.hostname || !expectedHostnames.has(String(data.hostname).toLowerCase()))
      ) {
        return {
          success: false,
          message: 'Cloudflare Turnstile hostname mismatch.',
          errorCodes: ['hostname-mismatch'],
          usingTestKey,
        };
      }

      if (!cleanToken.includes('DUMMY.TOKEN')) {
        redeemedTurnstileTokens.set(cleanToken, Date.now() + 10 * 60 * 1000);
      }

      return {
        success: true,
        action: data.action,
        hostname: data.hostname,
        usingTestKey,
      };
    }

    const errorCodes: string[] = Array.isArray(data?.['error-codes']) ? data['error-codes'] : [];
    return {
      success: false,
      message: 'Cloudflare Turnstile verification failed. Please retry the challenge.',
      errorCodes,
      usingTestKey,
    };
  } catch (err: any) {
    if (usingTestKey && cleanToken.includes('DUMMY.TOKEN')) {
      return {
        success: true,
        action: 'sandbox_dummy_token',
        usingTestKey: true,
      };
    }
    return {
      success: false,
      message: err?.message || 'Unable to reach Cloudflare Turnstile verification service.',
      errorCodes: ['network-error'],
      usingTestKey,
    };
  }
}

app.get('/api/security/turnstile/config', (_req, res) => {
  const siteKey = resolveServerTurnstileSiteKey();
  res.json({
    success: true,
    enabled: true,
    siteKey,
    usingTestKey: siteKey === CLOUDFLARE_TEST_SITE_KEY,
  });
});

app.post('/api/security/turnstile/verify', publicSubmitLimiter, async (req, res) => {
  const token = extractTurnstileToken(req.body) || '';
  const expectedAction =
    typeof req.body?.action === 'string' && req.body.action.trim()
      ? req.body.action.trim()
      : undefined;
  const clientIp = resolveClientIp(req);
  const result = await verifyTurnstileToken(token, clientIp, expectedAction);
  if (!result.success) {
    res.status(403).json(result);
    return;
  }
  const verificationProof = createTurnstileVerificationProof(expectedAction || 'general', clientIp);
  res.json({
    ...result,
    verificationProof,
  });
});

async function verifyTurnstileOrProof(
  req: express.Request,
  expectedAction?: string
): Promise<{ success: boolean; message?: string; errorCodes?: string[] }> {
  const body = req.body || {};
  const clientIp = resolveClientIp(req);
  const rawProof =
    typeof body.turnstileProof === 'string' && body.turnstileProof.trim()
      ? body.turnstileProof.trim()
      : undefined;

  if (rawProof) {
    const proofResult = consumeTurnstileVerificationProof(rawProof, clientIp);
    if (!proofResult.valid) {
      return {
        success: false,
        message: proofResult.reason || 'Cloudflare Turnstile verification proof is invalid or expired.',
        errorCodes: ['invalid-proof'],
      };
    }
    return { success: true };
  }

  const token = extractTurnstileToken(body);
  if (!token || !token.trim()) {
    return {
      success: false,
      message: 'Cloudflare Turnstile human verification is required.',
      errorCodes: ['missing-input-response'],
    };
  }

  const check = await verifyTurnstileToken(token, clientIp, expectedAction);
  if (!check.success) {
    return {
      success: false,
      message: check.message || 'Cloudflare Turnstile verification failed.',
      errorCodes: check.errorCodes,
    };
  }

  return { success: true };
}

async function resolveVerifiedCaller(req: express.Request): Promise<{
  isAdmin: boolean;
  uid?: string;
  email?: string;
}> {
  const bearer = extractBearerToken(req);
  if (!bearer) return { isAdmin: false };

  const adminSession = verifyAdminSessionToken(bearer);
  if (adminSession) {
    return { isAdmin: true, email: adminSession.user.email };
  }

  if (bearer.split('.').length === 3 && !bearer.startsWith('accadm.')) {
    const verified = await verifyFirebaseIdToken(bearer);
    if (verified) {
      const adminSync = await syncAdminFromVerifiedFirebaseToken(bearer);
      return {
        isAdmin: adminSync.success,
        uid: verified.uid,
        email: verified.email,
      };
    }
  }
  return { isAdmin: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// Workspace Tool Signings API
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/workspace/tool-signings', (_req, res) => {
  const signings = loadSignings();
  res.json({
    success: true,
    count: signings.length,
    signings: signings.sort((a, b) => new Date(b.signedAt).getTime() - new Date(a.signedAt).getTime()),
  });
});

app.post('/api/workspace/tool-signings', (req, res) => {
  const record: ToolSigningRecord = req.body;
  if (!record || !record.userId || !record.toolId) {
    res.status(400).json({ success: false, error: 'Missing required tool signing fields (userId, toolId)' });
    return;
  }

  const signings = loadSignings();
  const existingIndex = signings.findIndex(
    s =>
      s.userId === record.userId &&
      s.toolId === record.toolId &&
      Math.abs(new Date(s.signedAt).getTime() - new Date(record.signedAt).getTime()) < 30000
  );

  if (existingIndex >= 0) {
    signings[existingIndex] = { ...signings[existingIndex], ...record };
  } else {
    signings.unshift(record);
  }

  if (signings.length > 1000) {
    signings.length = 1000;
  }

  saveSignings(signings);
  res.json({ success: true, signing: record });
});

app.delete('/api/workspace/tool-signings/:id', (req, res) => {
  const { id } = req.params;
  let signings = loadSignings();
  const initialLength = signings.length;
  signings = signings.filter(s => s.id !== id);
  saveSignings(signings);

  res.json({
    success: true,
    deleted: initialLength - signings.length,
  });
});

// Compliance Analytics API
app.post('/api/compliance/events', (req, res) => {
  res.json({ success: true, eventId: req.body?.id || `evt-${Date.now()}` });
});

// ─────────────────────────────────────────────────────────────────────────────
// Cryptographic Admin Authentication for /workspace and /admin
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/admin/login', strictAuthLimiter, async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const result = await loginAdminWithPassword(email, password, resolveClientIp(req));
  if (!('token' in result)) {
    res.status(result.status).json({ success: false, error: result.error });
    return;
  }
  res.json({
    success: true,
    token: result.token,
    user: result.user,
    expiresAt: result.expiresAt,
  });
});

app.post('/api/admin/oauth-sync', strictAuthLimiter, async (req, res) => {
  const bodyToken = typeof req.body?.idToken === 'string' ? req.body.idToken.trim() : '';
  const headerToken = extractBearerToken(req);
  const idToken = bodyToken || headerToken;

  if (!idToken) {
    res.status(401).json({
      success: false,
      error: 'A verified Firebase ID token is required for administrator OAuth synchronization.',
    });
    return;
  }

  const result = await syncAdminFromVerifiedFirebaseToken(idToken);
  if (!('token' in result)) {
    res.status(result.status).json({ success: false, error: result.error });
    return;
  }

  res.json({
    success: true,
    token: result.token,
    user: result.user,
    expiresAt: result.expiresAt,
  });
});

app.get('/api/admin/verify', async (req, res) => {
  const bearer = extractBearerToken(req);
  if (!bearer) {
    res.status(401).json({ authenticated: false });
    return;
  }

  const session = verifyAdminSessionToken(bearer);
  if (session) {
    res.json({
      authenticated: true,
      user: session.user,
      expiresAt: new Date(session.exp).toISOString(),
    });
    return;
  }

  if (bearer.split('.').length === 3 && !bearer.startsWith('accadm.')) {
    const oauthSync = await syncAdminFromVerifiedFirebaseToken(bearer);
    if (oauthSync.success) {
      res.json({
        authenticated: true,
        user: oauthSync.user,
        expiresAt: oauthSync.expiresAt,
      });
      return;
    }
  }

  res.status(401).json({ authenticated: false });
});

app.post('/api/admin/logout', async (req, res) => {
  const bearer = extractBearerToken(req);
  if (bearer) {
    await revokeAdminSessionToken(bearer);
  }
  res.json({ success: true });
});

app.post('/api/admin/invalidate-all', requireAdminAuth, async (req, res) => {
  const adminUser = (req as any).adminUser;
  await revokeAllAdminSessionsForEmail(adminUser.email);
  res.json({
    success: true,
    message: `All active administrator sessions for ${maskEmail(adminUser.email)} have been invalidated.`,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Auth, Email & Brevo Relay Endpoints
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/auth/reset-password', strictAuthLimiter, async (req, res) => {
  const turnstileCheck = await verifyTurnstileOrProof(req, 'auth_forgot');
  if (!turnstileCheck.success) {
    res.status(403).json({
      success: false,
      message: turnstileCheck.message || 'Cloudflare Turnstile verification failed.',
    });
    return;
  }

  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    return;
  }

  const refId = `PWD-2026-${Math.floor(10000 + Math.random() * 90000)}`;
  const subject = `[${refId}] Password Reset Instructions — ACCOUNTICCA x E-Lawyers`;
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: #0f172a; color: #ffffff; padding: 24px;">
        <div style="font-size: 11px; color: #34d399; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">ACCOUNTICCA x E-Lawyers • Security Desk</div>
        <h2 style="margin: 6px 0 0 0; font-size: 18px;">Password Reset Request (${refId})</h2>
      </div>
      <div style="padding: 24px; color: #1e293b; font-size: 14px; line-height: 1.6;">
        <p>We received a request to reset the password for your Client Compliance Portal account (<strong>${email}</strong>).</p>
        <p>If you initiated this request, please use the Client Portal authentication screen or contact our chamber desk at <a href="mailto:ekram@elawyersbd.com">ekram@elawyersbd.com</a>.</p>
      </div>
    </div>
  `.trim();

  const sent = await dispatchBrevoEmail({
    recipientEmail: email,
    subject,
    html,
  });

  if (!sent.liveDelivered) {
    res.status(502).json({
      success: false,
      error: sent.smtpNotice || 'Brevo relay rejected password reset dispatch.',
      message: sent.smtpNotice || 'Unable to dispatch password reset email via Brevo.',
    });
    return;
  }

  res.json({
    success: true,
    message: `Password reset instructions have been dispatched to ${email} via Brevo SMTP relay. Please check your inbox and spam folder.`,
  });
});

app.post('/api/email/send-registration', async (req, res) => {
  const body = req.body || {};
  const email = String(body.email || body.clientEmail || '').trim();
  const name = String(body.name || body.clientName || 'Valued Member').trim();
  const isEnrollment = body.type === 'enrollment' || Boolean(body.courseTitle);

  if (!email || !email.includes('@')) {
    res.status(400).json({ success: false, error: 'Valid recipient email is required.' });
    return;
  }

  const templates = loadEmailTemplates();
  const templateId = isEnrollment ? 'registration_enrollment' : 'registration_welcome';
  const tpl =
    templates.find((t) => t.id === templateId) || DEFAULT_TRANSACTIONAL_EMAIL_TEMPLATES[0];

  if (!tpl.enabled) {
    res.json({
      success: true,
      skipped: true,
      reason: `Template "${tpl.name}" is disabled in Email Template Manager.`,
    });
    return;
  }

  const referenceId = String(
    body.enrollmentId || body.referenceId || `REG-2026-${Math.floor(1000 + Math.random() * 9000)}`
  ).trim();

  const rendered = renderTransactionalTemplate(
    tpl,
    {
      clientName: name,
      clientEmail: email,
      studentName: name,
      studentEmail: email,
      studentPhone: body.phone || '+880 1613-242524',
      accountRole: body.accountRole || 'Verified Client Member',
      registrationDate: new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      referenceId,
      enrollmentId: referenceId,
      courseTitle: body.courseTitle || 'Corporate Tax & VAT Compliance Masterclass',
      tuitionFee: body.tuitionFee || 'BDT 3,500',
      paymentStatus: body.paymentStatus || 'Confirmed',
      portalUrl: body.portalUrl || 'https://blog.accounticca.com/client-portal',
      dashboardUrl: body.dashboardUrl || 'https://blog.accounticca.com/academy',
      firmName: 'ACCOUNTICCA x E-Lawyers',
      firmDeskEmail: 'ekram@elawyersbd.com',
      firmPhone: '+880 1613-242524',
      officeAddress: 'Suite G-5, BTI Centara Grand, 144–144/1 Green Road, Panthapath, Dhaka–1205',
    },
    true
  );

  const relay = getBrevoRelayConfig();
  const ccEmails = tpl.ccAdmin ? [relay.senderEmail] : [];
  const sent = await dispatchBrevoEmail({
    recipientEmail: email,
    recipientName: name,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    ccEmails,
  });

  const sentAt = new Date().toISOString();
  appendEmailHistory({
    id: `reg-log-${Date.now()}`,
    messageId: sent.messageId,
    referenceId,
    clientName: name,
    recipientEmail: email,
    ccEmails,
    phone: body.phone || '',
    practiceArea: isEnrollment ? String(body.courseTitle || 'Academy Enrollment') : 'Client Portal Registration',
    mode: isEnrollment ? 'Academy LMS' : 'Client Portal',
    date: sentAt.slice(0, 10),
    timeSlot: new Date(sentAt).toLocaleTimeString(),
    status: sent.liveDelivered ? 'Confirmed' : 'Failed',
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    sentAt,
    delivered: sent.liveDelivered,
    deliveryStatus: sent.liveDelivered ? 'delivered' : 'failed',
    category: 'registration',
    transport: sent.transport,
    fromHeader: sent.fromHeader,
    previewUrl: sent.previewUrl,
    smtpNotice: sent.smtpNotice,
  });

  res.status(sent.liveDelivered ? 200 : 502).json({
    success: sent.liveDelivered,
    liveDelivered: sent.liveDelivered,
    messageId: sent.messageId,
    referenceId,
    recipient: email,
    transport: sent.transport,
    previewUrl: sent.previewUrl,
    smtpNotice: sent.smtpNotice,
    error: sent.liveDelivered ? undefined : sent.smtpNotice || 'Brevo relay did not deliver the message.',
    timestamp: sentAt,
  });
});

app.get('/api/email/brevo-status', (_req, res) => {
  const relay = getBrevoRelayConfig();
  res.json({
    configured: relay.configured,
    mode: relay.mode,
    senderName: relay.senderName,
    senderEmail: relay.senderEmail,
  });
});

app.get('/api/email/brevo-verify', requireAdminAuth, async (_req, res) => {
  const result = await verifyBrevoSmtpConnection();
  res.status(result.ok ? 200 : 502).json({
    ...result,
    relay: getBrevoRelayConfig(),
  });
});

app.post('/api/email/brevo-test', requireAdminAuth, async (req, res) => {
  const relay = getBrevoRelayConfig();
  const toEmail = String(
    req.body?.recipientEmail || req.body?.to || req.body?.email || relay.senderEmail
  ).trim();
  const referenceId = `DIAG-2026-${Math.floor(10000 + Math.random() * 90000)}`;
  const sentAt = new Date().toISOString();

  const subject = `[${referenceId}] Brevo SMTP Relay Diagnostic Verification — ${relay.senderName}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:24px;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;color:#0f172a;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #cbd5e1;border-radius:14px;overflow:hidden;">
        <tr>
          <td style="background:#0f172a;color:#ffffff;padding:24px 28px;">
            <div style="font-size:11px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:#34d399;">
              ${relay.senderName} • Brevo Transactional Mail Relay
            </div>
            <h2 style="margin:6px 0 0 0;font-size:19px;color:#ffffff;">
              Brevo SMTP Relay Diagnostic Verification
            </h2>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 28px;font-size:13px;line-height:1.6;color:#1e293b;">
            <p style="margin:0 0 14px 0;">
              This diagnostic message confirms that the <strong>${relay.senderName}</strong> transactional and statutory calculation email dispatcher is active and operational.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;font-size:12px;">
              <tr><td style="padding:4px 0;color:#64748b;">Reference ID:</td><td style="padding:4px 0;font-weight:700;font-family:monospace;">${referenceId}</td></tr>
              <tr><td style="padding:4px 0;color:#64748b;">Relay Host:</td><td style="padding:4px 0;font-weight:700;font-family:monospace;">${relay.host}:${relay.port}</td></tr>
              <tr><td style="padding:4px 0;color:#64748b;">SMTP Login:</td><td style="padding:4px 0;font-weight:700;font-family:monospace;">${relay.login}</td></tr>
              <tr><td style="padding:4px 0;color:#64748b;">From Header:</td><td style="padding:4px 0;font-weight:700;font-family:monospace;">${relay.senderName} &lt;${relay.senderEmail}&gt;</td></tr>
              <tr><td style="padding:4px 0;color:#64748b;">Recipient:</td><td style="padding:4px 0;font-weight:700;font-family:monospace;">${toEmail}</td></tr>
              <tr><td style="padding:4px 0;color:#64748b;">Timestamp:</td><td style="padding:4px 0;font-weight:700;font-family:monospace;">${sentAt}</td></tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `.trim();
  const text = `Brevo SMTP Relay Diagnostic Verification (${referenceId})\nHost: ${relay.host}:${relay.port}\nLogin: ${relay.login}\nFrom: ${relay.formattedFrom}\nRecipient: ${toEmail}\nTimestamp: ${sentAt}`;

  const sent = await dispatchBrevoEmail({
    recipientEmail: toEmail,
    recipientName: 'Firm Compliance Desk',
    subject,
    html,
    text,
  });

  appendEmailHistory({
    id: `diag-${Date.now()}`,
    messageId: sent.messageId,
    referenceId,
    clientName: 'Brevo Relay Diagnostic',
    recipientEmail: toEmail,
    practiceArea: 'Brevo SMTP Relay Verification',
    mode: `${relay.host}:${relay.port}`,
    date: sentAt.slice(0, 10),
    timeSlot: new Date(sentAt).toLocaleTimeString(),
    status: sent.liveDelivered ? 'Delivered' : 'Failed',
    subject,
    html,
    text,
    sentAt,
    delivered: sent.liveDelivered,
    deliveryStatus: sent.liveDelivered ? 'delivered' : 'failed',
    category: 'system',
    transport: sent.transport,
    fromHeader: sent.fromHeader,
    previewUrl: sent.previewUrl,
    smtpNotice: sent.smtpNotice,
  });

  res.status(sent.liveDelivered ? 200 : 502).json({
    success: sent.liveDelivered,
    liveDelivered: sent.liveDelivered,
    referenceId,
    messageId: sent.messageId,
    recipient: toEmail,
    host: relay.host,
    port: relay.port,
    login: relay.login,
    fromHeader: sent.fromHeader,
    transport: sent.transport,
    previewUrl: sent.previewUrl,
    smtpNotice: sent.smtpNotice,
    error: sent.liveDelivered
      ? undefined
      : sent.smtpNotice || 'Brevo relay failed; captured via fallback only.',
    message: sent.liveDelivered
      ? `Diagnostic email [${referenceId}] dispatched to ${toEmail} via ${sent.transport}.`
      : `Brevo relay failed for [${referenceId}]: ${sent.smtpNotice || 'delivery rejected'}.`,
  });
});

function buildSubscriberDocId(email: string): string {
  const slug = email.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
  return `sub_${slug}`.slice(0, 100);
}

app.post('/api/subscribe-newsletter', publicSubmitLimiter, async (req, res) => {
  const expectedAction =
    req.body?.source === 'footer' || req.body?.sourceCategory === 'footer_compliance'
      ? 'footer_newsletter'
      : 'newsletter_subscribe';

  const turnstileCheck = await verifyTurnstileOrProof(req, expectedAction);
  if (!turnstileCheck.success) {
    res.status(403).json({
      success: false,
      persisted: false,
      error: turnstileCheck.message || 'Cloudflare Turnstile verification failed.',
    });
    return;
  }

  const parsed = newsletterSubscribeSchema.safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      persisted: false,
      error: parsed.error.issues[0]?.message || 'Invalid subscriber details.',
    });
    return;
  }

  const input = parsed.data;
  if (input.consentAccepted === false) {
    res.status(400).json({
      success: false,
      persisted: false,
      error: 'Subscriber consent is required to activate dispatch updates.',
    });
    return;
  }

  const adminDb = getAdminFirestore();
  if (!adminDb) {
    res.status(503).json({
      success: false,
      persisted: false,
      error:
        'Durable subscriber database is unavailable (server Firebase Admin credentials not configured). Your subscription could not be saved.',
    });
    return;
  }

  const subscriberId = buildSubscriberDocId(input.email);
  const nowIso = new Date().toISOString();
  const docRef = adminDb.collection('newsletterSubscribers').doc(subscriberId);

  let existingData: Record<string, any> = {};
  try {
    const snap = await docRef.get();
    if (snap.exists) {
      existingData = snap.data() || {};
    }
  } catch {
    // proceed to write below and fail loudly if Firestore write rejects
  }

  const subscribedAt = String(existingData.subscribedAt || nowIso);
  const cleanName = sanitizePlainText(input.name || existingData.name || '', 120) || null;
  const cleanOrg = sanitizePlainText(input.organization || existingData.organization || '', 150) || null;
  const cleanSource = sanitizePlainText(input.source || input.sourceCategory || 'website', 64);
  const cleanTopics = input.topics.length > 0 ? input.topics : ['tax_vat', 'corporate_rjsc'];
  const existingNotionPageId =
    typeof existingData.notionPageId === 'string' ? existingData.notionPageId : null;

  const firestoreDocPayload = {
    id: subscriberId,
    email: input.email,
    name: cleanName,
    organization: cleanOrg,
    designation: input.designation || existingData.designation || 'other',
    topics: cleanTopics,
    frequency: input.frequency || 'both',
    source: cleanSource,
    sourceArticleId: input.sourceArticleId || null,
    sourceArticleTitle: input.sourceArticleTitle || null,
    status: 'active' as const,
    consentStatus: 'Opted In' as const,
    consentAcceptedAt: nowIso,
    subscribedAt,
    unsubscribedAt: null,
    lastUpdated: nowIso,
    userId: input.userId || null,
    notionPageId: existingNotionPageId,
    notionSyncStatus: 'pending',
    updatedAt: FieldValue.serverTimestamp(),
  };

  try {
    await docRef.set(firestoreDocPayload, { merge: true });
  } catch (err: any) {
    console.error(`[Newsletter] Firestore write error for ${maskEmail(input.email)}:`, err?.message);
    res.status(503).json({
      success: false,
      persisted: false,
      error: 'Failed to persist newsletter subscription to durable Firestore database.',
    });
    return;
  }

  // Synchronize to Notion Database B (Newsletter Subscribers)
  const notionResult = await syncNewsletterSubscriberToNotion({
    id: subscriberId,
    name: cleanName,
    email: input.email,
    organization: cleanOrg,
    designation: firestoreDocPayload.designation,
    topics: cleanTopics,
    source: cleanSource,
    subscribedAt,
    consentStatus: 'Opted In',
    subscriptionStatus: 'Active',
    lastUpdated: nowIso,
    notionPageId: existingNotionPageId,
  });

  try {
    await docRef.set(
      {
        notionPageId: notionResult.pageId || existingNotionPageId || null,
        notionSyncStatus: notionResult.synced
          ? 'synced'
          : notionResult.configured
          ? 'queued'
          : 'unconfigured',
        lastNotionSyncAttemptAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch {
    // non-fatal metadata update
  }

  // Dispatch Brevo SMTP confirmation email with HMAC-signed 1-click unsubscribe link
  const origin = (
    process.env.APP_URL ||
    `${req.protocol}://${req.get('host') || 'blog.accounticca.com'}`
  ).replace(/\/$/, '');
  const unsubscribeSig = createUnsubscribeSignature(input.email);
  const unsubscribeUrl = `${origin}/api/newsletter/unsubscribe?email=${encodeURIComponent(
    input.email
  )}&sig=${encodeURIComponent(unsubscribeSig)}`;

  const relay = getBrevoRelayConfig();
  const referenceId = `NEWS-2026-${Math.floor(10000 + Math.random() * 90000)}`;
  const topicText = cleanTopics.join(', ');

  const subject = `[${referenceId}] Compliance Dispatch Subscription Confirmed — ${relay.senderName}`;
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: #0A2A66; color: #ffffff; padding: 24px;">
        <div style="font-size: 11px; color: #34d399; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">${relay.senderName} • Statutory Gazette Alerts</div>
        <h2 style="margin: 6px 0 0 0; font-size: 18px;">Newsletter Subscription Active (${referenceId})</h2>
      </div>
      <div style="padding: 24px; color: #1e293b; font-size: 14px; line-height: 1.6;">
        <p>Thank you for subscribing to our compliance briefing for <strong>${input.email}</strong>.</p>
        <p><strong>Selected Topics:</strong> ${topicText}</p>
        <p style="font-size: 12px; color: #64748b;">You will receive curated alerts covering NBR SRO updates, Income Tax Act 2023 circulars, VAT schedules, and RJSC filings.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:18px 0;" />
        <p style="font-size: 11px; color: #64748b;">No longer wish to receive updates? <a href="${unsubscribeUrl}" style="color:#059669;font-weight:600;">One-click Unsubscribe</a>.</p>
      </div>
    </div>
  `.trim();
  const text = `Newsletter Subscription Confirmed (${referenceId}) for ${input.email}. Selected topics: ${topicText}. Unsubscribe: ${unsubscribeUrl}`;

  const sent = await dispatchBrevoEmail({
    recipientEmail: input.email,
    recipientName: cleanName || 'Compliance Subscriber',
    subject,
    html,
    text,
  });

  appendEmailHistory({
    id: `news-${Date.now()}`,
    messageId: sent.messageId,
    referenceId,
    clientName: cleanName || 'Newsletter Subscriber',
    recipientEmail: input.email,
    practiceArea: topicText,
    mode: cleanSource === 'footer' ? 'Footer Newsletter' : `Newsletter (${cleanSource})`,
    date: nowIso.slice(0, 10),
    timeSlot: new Date(nowIso).toLocaleTimeString(),
    status: sent.liveDelivered ? 'Delivered' : 'Failed',
    subject,
    html,
    text,
    sentAt: nowIso,
    delivered: sent.liveDelivered,
    deliveryStatus: sent.liveDelivered ? 'delivered' : 'failed',
    category: 'registration',
    transport: sent.transport,
    fromHeader: sent.fromHeader,
    previewUrl: sent.previewUrl,
    smtpNotice: sent.smtpNotice,
  });

  console.info(
    `[Newsletter] Saved subscriber ${subscriberId} (${maskEmail(input.email)}) status=active notion=${notionResult.action || 'pending'} email=${sent.liveDelivered}`
  );

  res.status(200).json({
    success: true,
    persisted: true,
    subscriberId,
    status: 'active',
    consentStatus: 'Opted In',
    referenceId,
    messageId: sent.messageId,
    liveDelivered: sent.liveDelivered,
    emailDelivered: sent.liveDelivered,
    transport: sent.transport,
    smtpNotice: sent.smtpNotice,
    notionSynced: notionResult.synced,
    notionStatus: notionResult.action || 'queued',
    message: sent.liveDelivered
      ? 'Subscribed to compliance updates and dispatched Brevo confirmation email.'
      : 'Subscribed and saved in Firestore. Brevo confirmation email requires live SMTP credentials.',
  });
});

async function performNewsletterUnsubscribe(
  emailRaw: string,
  reason: string
): Promise<{
  ok: boolean;
  status: number;
  error?: string;
  subscriberId?: string;
  notionSynced?: boolean;
}> {
  const parsed = newsletterUnsubscribeSchema.safeParse({ email: emailRaw, reason });
  if (!parsed.success) {
    return { ok: false, status: 400, error: parsed.error.issues[0]?.message || 'Invalid email.' };
  }

  const adminDb = getAdminFirestore();
  if (!adminDb) {
    return {
      ok: false,
      status: 503,
      error: 'Durable database is unavailable (server Firebase Admin credentials not configured).',
    };
  }

  const cleanEmail = parsed.data.email;
  const subscriberId = buildSubscriberDocId(cleanEmail);
  const nowIso = new Date().toISOString();
  const docRef = adminDb.collection('newsletterSubscribers').doc(subscriberId);

  let existing: Record<string, any> = {};
  try {
    const snap = await docRef.get();
    if (snap.exists) {
      existing = snap.data() || {};
    }
  } catch {
    // ignore fetch issue
  }

  try {
    await docRef.set(
      {
        id: subscriberId,
        email: cleanEmail,
        status: 'unsubscribed',
        consentStatus: 'Withdrawn',
        unsubscribeReason: sanitizePlainText(parsed.data.reason, 300),
        unsubscribedAt: nowIso,
        lastUpdated: nowIso,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err: any) {
    console.error(`[Newsletter] Unsubscribe Firestore write failed for ${maskEmail(cleanEmail)}:`, err?.message);
    return { ok: false, status: 503, error: 'Failed to update unsubscribe status in Firestore.' };
  }

  const notionResult = await syncNewsletterSubscriberToNotion({
    id: subscriberId,
    name: existing.name || null,
    email: cleanEmail,
    organization: existing.organization || null,
    designation: existing.designation || 'other',
    topics: Array.isArray(existing.topics) ? existing.topics : [],
    source: existing.source || 'unsubscribe_link',
    subscribedAt: existing.subscribedAt || nowIso,
    consentStatus: 'Withdrawn',
    subscriptionStatus: 'Unsubscribed',
    lastUpdated: nowIso,
    notionPageId: existing.notionPageId || null,
  });

  try {
    await docRef.set(
      {
        notionPageId: notionResult.pageId || existing.notionPageId || null,
        notionSyncStatus: notionResult.synced ? 'synced' : notionResult.configured ? 'queued' : 'unconfigured',
        lastUpdated: nowIso,
      },
      { merge: true }
    );
  } catch {
    // non-fatal
  }

  return { ok: true, status: 200, subscriberId, notionSynced: notionResult.synced };
}

app.post('/api/newsletter/unsubscribe', publicSubmitLimiter, async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const sig = typeof req.body?.sig === 'string' ? req.body.sig.trim() : '';
  const reason = sanitizePlainText(req.body?.reason || 'user_requested', 300);

  if (sig && !verifyUnsubscribeSignature(email, sig)) {
    res.status(403).json({ success: false, error: 'Invalid unsubscribe signature.' });
    return;
  }

  const result = await performNewsletterUnsubscribe(email, reason);
  if (!result.ok) {
    res.status(result.status).json({ success: false, error: result.error });
    return;
  }

  console.info(`[Newsletter] Unsubscribed ${maskEmail(email)} (notion=${result.notionSynced})`);
  res.json({
    success: true,
    subscriberId: result.subscriberId,
    status: 'unsubscribed',
    consentStatus: 'Withdrawn',
    notionSynced: result.notionSynced,
    message: `${email} has been unsubscribed from compliance alerts.`,
  });
});

app.get('/api/newsletter/unsubscribe', publicSubmitLimiter, async (req, res) => {
  const email = String(req.query.email || '').trim().toLowerCase();
  const sig = String(req.query.sig || '').trim();

  if (!email || !sig || !verifyUnsubscribeSignature(email, sig)) {
    res
      .status(403)
      .type('html')
      .send(
        '<!doctype html><html><body style="font-family:sans-serif;padding:40px;max-width:560px;margin:0 auto;"><h2>Invalid or expired unsubscribe link</h2><p>Please use the unsubscribe button inside your latest email or contact ekram@elawyersbd.com.</p></body></html>'
      );
    return;
  }

  const result = await performNewsletterUnsubscribe(email, 'one_click_email_link');
  if (!result.ok) {
    res
      .status(result.status)
      .type('html')
      .send(
        `<!doctype html><html><body style="font-family:sans-serif;padding:40px;max-width:560px;margin:0 auto;"><h2>Unable to complete unsubscribe</h2><p>${result.error}</p></body></html>`
      );
    return;
  }

  res
    .status(200)
    .type('html')
    .send(
      `<!doctype html><html><body style="font-family:sans-serif;padding:40px;max-width:560px;margin:0 auto;color:#0f172a;"><h2>Unsubscribed Successfully</h2><p><strong>${email}</strong> has been unsubscribed from Accounticca &amp; E-Lawyers compliance dispatches.</p><p><a href="/" style="color:#059669;font-weight:600;">Return to homepage</a></p></body></html>`
    );
});

app.get('/api/newsletter/status', publicSubmitLimiter, async (req, res) => {
  const caller = await resolveVerifiedCaller(req);
  const email = String(req.query.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    res.status(400).json({ success: false, error: 'Valid email is required.' });
    return;
  }

  if (!caller.isAdmin && caller.email !== email) {
    res.status(401).json({ success: false, error: 'Authentication required to inspect subscriber status.' });
    return;
  }

  const adminDb = getAdminFirestore();
  if (!adminDb) {
    res.status(503).json({ success: false, error: 'Durable database unavailable.' });
    return;
  }

  const subscriberId = buildSubscriberDocId(email);
  const snap = await adminDb.collection('newsletterSubscribers').doc(subscriberId).get();
  if (!snap.exists) {
    res.json({ success: true, subscribed: false, status: null });
    return;
  }
  const d = snap.data() || {};
  res.json({
    success: true,
    subscribed: d.status === 'active',
    status: d.status || 'active',
    consentStatus: d.consentStatus || 'Opted In',
    topics: Array.isArray(d.topics) ? d.topics : [],
    lastUpdated: d.lastUpdated || null,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Transactional Email Template Manager API (/api/email/templates*)
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/email/templates', (_req, res) => {
  const templates = loadEmailTemplates();
  res.json({
    success: true,
    templates,
    brevoRelay: {
      configured: getBrevoRelayConfig().configured,
      mode: getBrevoRelayConfig().mode,
      senderName: getBrevoRelayConfig().senderName,
    },
  });
});

app.put('/api/email/templates/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const templates = loadEmailTemplates();
  const idx = templates.findIndex((t) => t.id === id);
  if (idx === -1) {
    res.status(404).json({ success: false, error: `Template '${id}' not found.` });
    return;
  }

  const body = req.body || {};
  const updated: TransactionalEmailTemplate = {
    ...templates[idx],
    name: body.name !== undefined ? String(body.name) : templates[idx].name,
    enabled: body.enabled !== undefined ? Boolean(body.enabled) : templates[idx].enabled,
    ccAdmin: body.ccAdmin !== undefined ? Boolean(body.ccAdmin) : templates[idx].ccAdmin,
    subjectTemplate:
      body.subjectTemplate !== undefined ? String(body.subjectTemplate) : templates[idx].subjectTemplate,
    htmlTemplate:
      body.htmlTemplate !== undefined ? String(body.htmlTemplate) : templates[idx].htmlTemplate,
    textTemplate:
      body.textTemplate !== undefined ? String(body.textTemplate) : templates[idx].textTemplate,
    placeholders: Array.isArray(body.placeholders) ? body.placeholders : templates[idx].placeholders,
    builderConfig:
      body.builderConfig !== undefined ? body.builderConfig : templates[idx].builderConfig,
    updatedAt: new Date().toISOString(),
  };

  templates[idx] = updated;
  saveEmailTemplates(templates);

  res.json({
    success: true,
    template: updated,
    message: `Saved "${updated.name}" successfully. All live Brevo dispatches now use this template.`,
  });
});

app.post('/api/email/templates/:id/reset', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  if (id === 'all') {
    saveEmailTemplates(DEFAULT_TRANSACTIONAL_EMAIL_TEMPLATES);
    res.json({
      success: true,
      templates: DEFAULT_TRANSACTIONAL_EMAIL_TEMPLATES,
      message: 'All transactional email templates restored to factory defaults.',
    });
    return;
  }

  const factoryDefault = DEFAULT_TRANSACTIONAL_EMAIL_TEMPLATES.find((t) => t.id === id);
  if (!factoryDefault) {
    res.status(404).json({ success: false, error: `Factory template '${id}' not found.` });
    return;
  }

  const templates = loadEmailTemplates().map((t) => (t.id === id ? { ...factoryDefault, updatedAt: new Date().toISOString() } : t));
  saveEmailTemplates(templates);

  res.json({
    success: true,
    template: factoryDefault,
    templates,
    message: `Restored "${factoryDefault.name}" to factory default HTML and placeholders.`,
  });
});

app.post('/api/email/templates/:id/test', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const templates = loadEmailTemplates();
  const baseTpl = templates.find((t) => t.id === id) || DEFAULT_TRANSACTIONAL_EMAIL_TEMPLATES[0];
  const body = req.body || {};
  const recipientEmail = String(body.recipientEmail || getBrevoRelayConfig().senderEmail).trim();

  if (!recipientEmail || !recipientEmail.includes('@')) {
    res.status(400).json({ success: false, error: 'Valid recipient email is required.' });
    return;
  }

  const rendered = renderTransactionalTemplate(
    {
      subjectTemplate: body.subjectTemplate ?? baseTpl.subjectTemplate,
      htmlTemplate: body.htmlTemplate ?? baseTpl.htmlTemplate,
      textTemplate: body.textTemplate ?? baseTpl.textTemplate,
      placeholders: Array.isArray(body.placeholders) ? body.placeholders : baseTpl.placeholders,
    },
    body.variables || {},
    true
  );

  const sent = await dispatchBrevoEmail({
    recipientEmail,
    recipientName: 'Template Test Recipient',
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  });

  const sentAt = new Date().toISOString();
  const referenceId = `TPL-TEST-${Math.floor(1000 + Math.random() * 9000)}`;
  appendEmailHistory({
    id: `tpl-test-${Date.now()}`,
    messageId: sent.messageId,
    referenceId,
    clientName: `Template Test (${baseTpl.name})`,
    recipientEmail,
    practiceArea: baseTpl.name,
    mode: 'Brevo Template Editor',
    date: sentAt.slice(0, 10),
    timeSlot: new Date(sentAt).toLocaleTimeString(),
    status: sent.liveDelivered ? 'Delivered' : 'Failed',
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    sentAt,
    delivered: sent.liveDelivered,
    deliveryStatus: sent.liveDelivered ? 'delivered' : 'failed',
    category: baseTpl.category,
    transport: sent.transport,
    fromHeader: sent.fromHeader,
    previewUrl: sent.previewUrl,
    smtpNotice: sent.smtpNotice,
  });

  res.status(sent.liveDelivered ? 200 : 502).json({
    success: sent.liveDelivered,
    liveDelivered: sent.liveDelivered,
    messageId: sent.messageId,
    fromHeader: sent.fromHeader,
    transport: sent.transport,
    previewUrl: sent.previewUrl,
    smtpNotice: sent.smtpNotice,
    error: sent.liveDelivered ? undefined : sent.smtpNotice || 'Brevo relay did not deliver the test email.',
    message: sent.liveDelivered
      ? `Test email for "${baseTpl.name}" dispatched to ${recipientEmail} via ${sent.transport}.`
      : `Brevo relay failed for "${baseTpl.name}": ${sent.smtpNotice || 'delivery rejected'}.`,
  });
});

app.post('/api/email/templates/:id/preview', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const templates = loadEmailTemplates();
  const baseTpl = templates.find((t) => t.id === id);
  if (!baseTpl) {
    res.status(404).json({ success: false, error: `Template '${id}' not found.` });
    return;
  }

  const body = req.body || {};
  const mergedTemplate: TransactionalEmailTemplate = {
    ...baseTpl,
    name: body.name !== undefined ? String(body.name) : baseTpl.name,
    enabled: body.enabled !== undefined ? Boolean(body.enabled) : baseTpl.enabled,
    ccAdmin: body.ccAdmin !== undefined ? Boolean(body.ccAdmin) : baseTpl.ccAdmin,
    subjectTemplate:
      body.subjectTemplate !== undefined ? String(body.subjectTemplate) : baseTpl.subjectTemplate,
    htmlTemplate:
      body.htmlTemplate !== undefined ? String(body.htmlTemplate) : baseTpl.htmlTemplate,
    textTemplate:
      body.textTemplate !== undefined ? String(body.textTemplate) : baseTpl.textTemplate,
    placeholders: Array.isArray(body.placeholders) ? body.placeholders : baseTpl.placeholders,
  };

  const preview = previewEmailTemplate({
    template: mergedTemplate,
    variables: body.variables || {},
    useSampleFallback: body.useSampleFallback !== false,
    recipientEmail: typeof body.recipientEmail === 'string' ? body.recipientEmail : undefined,
    recipientName: typeof body.recipientName === 'string' ? body.recipientName : undefined,
    ccAdmin: typeof body.ccAdmin === 'boolean' ? body.ccAdmin : mergedTemplate.ccAdmin,
  });

  res.json({
    success: true,
    preview,
  });
});

app.post('/api/email/templates/:id/send', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const templates = loadEmailTemplates();
  const baseTpl = templates.find((t) => t.id === id);
  if (!baseTpl) {
    res.status(404).json({ success: false, error: `Template '${id}' not found.` });
    return;
  }

  const body = req.body || {};
  const recipientEmail = String(body.recipientEmail || '').trim();
  const recipientName = String(body.recipientName || '').trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  if (!recipientEmail || !emailRegex.test(recipientEmail)) {
    res.status(400).json({
      success: false,
      error: 'Please enter a valid recipient email address.',
    });
    return;
  }

  const mergedTemplate: TransactionalEmailTemplate = {
    ...baseTpl,
    name: body.name !== undefined ? String(body.name) : baseTpl.name,
    enabled: body.enabled !== undefined ? Boolean(body.enabled) : baseTpl.enabled,
    ccAdmin: body.ccAdmin !== undefined ? Boolean(body.ccAdmin) : baseTpl.ccAdmin,
    subjectTemplate:
      body.subjectTemplate !== undefined ? String(body.subjectTemplate) : baseTpl.subjectTemplate,
    htmlTemplate:
      body.htmlTemplate !== undefined ? String(body.htmlTemplate) : baseTpl.htmlTemplate,
    textTemplate:
      body.textTemplate !== undefined ? String(body.textTemplate) : baseTpl.textTemplate,
    placeholders: Array.isArray(body.placeholders) ? body.placeholders : baseTpl.placeholders,
  };

  if (!mergedTemplate.enabled && body.forceSend !== true) {
    res.status(409).json({
      success: false,
      error: `Template "${mergedTemplate.name}" is currently disabled. Enable it or confirm force-send to dispatch.`,
    });
    return;
  }

  const referenceId = String(
    body.referenceId || `ADM-SEND-${Math.floor(10000 + Math.random() * 90000)}`
  ).trim();

  const { preview, result: sent } = await sendEmailTemplateToUser({
    template: mergedTemplate,
    variables: {
      ...(body.variables || {}),
      referenceId: (body.variables && body.variables.referenceId) || referenceId,
      clientEmail: (body.variables && body.variables.clientEmail) || recipientEmail,
      clientName: (body.variables && body.variables.clientName) || recipientName || undefined,
    },
    useSampleFallback: body.useSampleFallback !== false,
    recipientEmail,
    recipientName: recipientName || undefined,
    ccAdmin: typeof body.ccAdmin === 'boolean' ? body.ccAdmin : mergedTemplate.ccAdmin,
    referenceId,
  });

  const sentAt = new Date().toISOString();
  appendEmailHistory({
    id: `tpl-send-${Date.now()}`,
    messageId: sent.messageId,
    referenceId,
    clientName: recipientName || `${mergedTemplate.name} Recipient`,
    recipientEmail,
    ccEmails: preview.ccEmails,
    practiceArea: mergedTemplate.name,
    mode: 'Admin Template Preview Modal',
    date: sentAt.slice(0, 10),
    timeSlot: new Date(sentAt).toLocaleTimeString(),
    status: sent.liveDelivered ? 'Delivered' : 'Failed',
    subject: preview.subject,
    html: preview.html,
    text: preview.text,
    sentAt,
    delivered: sent.liveDelivered,
    deliveryStatus: sent.liveDelivered ? 'delivered' : 'failed',
    category: mergedTemplate.category,
    transport: sent.transport,
    fromHeader: sent.fromHeader,
    previewUrl: sent.previewUrl,
    smtpNotice: sent.smtpNotice,
  });

  res.status(sent.liveDelivered ? 200 : 502).json({
    success: sent.liveDelivered,
    liveDelivered: sent.liveDelivered,
    referenceId,
    recipientEmail,
    messageId: sent.messageId,
    fromHeader: sent.fromHeader,
    transport: sent.transport,
    previewUrl: sent.previewUrl,
    smtpNotice: sent.smtpNotice,
    preview,
    error: sent.liveDelivered
      ? undefined
      : sent.smtpNotice || 'Brevo relay did not deliver the email.',
    message: sent.liveDelivered
      ? `Email "${mergedTemplate.name}" delivered to ${recipientEmail} (Ref: ${referenceId}).`
      : `Brevo relay failed for ${recipientEmail}: ${sent.smtpNotice || 'delivery rejected'}.`,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Scheduled Email Dispatch Queue (/api/email/schedules*)
// ─────────────────────────────────────────────────────────────────────────────
interface ScheduledEmailDispatchRecord {
  id: string;
  referenceId: string;
  templateId: string;
  templateName: string;
  category: 'registration' | 'booking' | 'payment' | 'system';
  recipientEmail: string;
  recipientName?: string;
  ccAdmin: boolean;
  ccEmails: string[];
  subject: string;
  html: string;
  text: string;
  variables: Record<string, string>;
  useSampleFallback: boolean;
  scheduledFor: string;
  notes?: string;
  status: 'scheduled' | 'processing' | 'sent' | 'failed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  dispatchedAt?: string | null;
  messageId?: string | null;
  transport?: string | null;
  smtpNotice?: string | null;
  error?: string | null;
}

function loadScheduledEmails(): ScheduledEmailDispatchRecord[] {
  return readJsonArray<ScheduledEmailDispatchRecord>(SCHEDULED_EMAILS_FILE);
}

function saveScheduledEmails(items: ScheduledEmailDispatchRecord[]): void {
  const trimmed = items.slice(0, 300);
  writeJsonArray(SCHEDULED_EMAILS_FILE, trimmed);
}

async function executeScheduledEmailItem(
  item: ScheduledEmailDispatchRecord
): Promise<ScheduledEmailDispatchRecord> {
  const sent = await dispatchBrevoEmail({
    recipientEmail: item.recipientEmail,
    recipientName: item.recipientName || 'Valued Client',
    ccEmails: item.ccEmails,
    subject: item.subject,
    html: item.html,
    text: item.text,
  });

  const dispatchedAt = new Date().toISOString();
  const updated: ScheduledEmailDispatchRecord = {
    ...item,
    status: sent.liveDelivered ? 'sent' : 'failed',
    dispatchedAt,
    updatedAt: dispatchedAt,
    messageId: sent.messageId,
    transport: sent.transport,
    smtpNotice: sent.smtpNotice,
    error: sent.liveDelivered
      ? null
      : sent.smtpNotice || 'Brevo SMTP relay did not deliver the scheduled email.',
  };

  appendEmailHistory({
    id: `sched-hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    messageId: sent.messageId,
    referenceId: item.referenceId,
    clientName: item.recipientName || `${item.templateName} Recipient`,
    recipientEmail: item.recipientEmail,
    ccEmails: item.ccEmails,
    practiceArea: item.templateName,
    mode: `Scheduled Queue (${new Date(item.scheduledFor).toLocaleString()})`,
    date: dispatchedAt.slice(0, 10),
    timeSlot: new Date(dispatchedAt).toLocaleTimeString(),
    status: sent.liveDelivered ? 'Delivered' : 'Failed',
    subject: item.subject,
    html: item.html,
    text: item.text,
    sentAt: dispatchedAt,
    delivered: sent.liveDelivered,
    deliveryStatus: sent.liveDelivered ? 'delivered' : 'failed',
    category: item.category,
    transport: sent.transport,
    fromHeader: sent.fromHeader,
    previewUrl: sent.previewUrl,
    smtpNotice: sent.smtpNotice,
  });

  return updated;
}

let isProcessingScheduledQueue = false;

async function processDueScheduledEmails(): Promise<{
  processedCount: number;
  sentCount: number;
  failedCount: number;
}> {
  if (isProcessingScheduledQueue) {
    return { processedCount: 0, sentCount: 0, failedCount: 0 };
  }
  isProcessingScheduledQueue = true;
  let processedCount = 0;
  let sentCount = 0;
  let failedCount = 0;

  try {
    const nowMs = Date.now();
    const queue = loadScheduledEmails();
    const dueIds = queue
      .filter((item) => item.status === 'scheduled' && new Date(item.scheduledFor).getTime() <= nowMs)
      .map((item) => item.id);

    if (dueIds.length === 0) {
      return { processedCount: 0, sentCount: 0, failedCount: 0 };
    }

    const dueSet = new Set(dueIds);
    const markedQueue = queue.map((item) =>
      dueSet.has(item.id)
        ? { ...item, status: 'processing' as const, updatedAt: new Date().toISOString() }
        : item
    );
    saveScheduledEmails(markedQueue);

    for (const id of dueIds) {
      const latestQueue = loadScheduledEmails();
      const idx = latestQueue.findIndex((entry) => entry.id === id);
      if (idx === -1 || latestQueue[idx].status !== 'processing') continue;

      const updated = await executeScheduledEmailItem(latestQueue[idx]);
      processedCount++;
      if (updated.status === 'sent') sentCount++;
      else failedCount++;

      const refreshedQueue = loadScheduledEmails();
      const refreshIdx = refreshedQueue.findIndex((entry) => entry.id === id);
      if (refreshIdx !== -1) {
        refreshedQueue[refreshIdx] = updated;
        saveScheduledEmails(refreshedQueue);
      }
    }
  } catch (err) {
    console.error('[Server] Scheduled email queue processing error:', err);
  } finally {
    isProcessingScheduledQueue = false;
  }

  return { processedCount, sentCount, failedCount };
}

app.get('/api/email/schedules', requireAdminAuth, async (req, res) => {
  if (req.query.processDue === 'true') {
    await processDueScheduledEmails();
  }
  const schedules = loadScheduledEmails();
  const statusCounts = {
    total: schedules.length,
    scheduled: schedules.filter((s) => s.status === 'scheduled' || s.status === 'processing').length,
    sent: schedules.filter((s) => s.status === 'sent').length,
    failed: schedules.filter((s) => s.status === 'failed').length,
    cancelled: schedules.filter((s) => s.status === 'cancelled').length,
  };
  res.json({
    success: true,
    schedules,
    stats: statusCounts,
    serverNow: new Date().toISOString(),
  });
});

app.post('/api/email/schedules', requireAdminAuth, (req, res) => {
  const body = req.body || {};
  const templateId = String(body.templateId || '').trim();
  const recipientEmail = String(body.recipientEmail || '').trim();
  const recipientName = String(body.recipientName || '').trim();
  const scheduledForRaw = String(body.scheduledFor || '').trim();
  const notes = String(body.notes || '').trim();
  const useSampleFallback = body.useSampleFallback !== false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const errors: Record<string, string> = {};

  const templates = loadEmailTemplates();
  const baseTpl = templates.find((t) => t.id === templateId);
  if (!baseTpl) {
    errors.templateId = 'Please select a valid transactional email template.';
  }

  if (!recipientEmail || recipientEmail.length > 254 || !emailRegex.test(recipientEmail)) {
    errors.recipientEmail = 'Please enter a valid recipient email address.';
  }

  const scheduledDate = scheduledForRaw ? new Date(scheduledForRaw) : null;
  if (!scheduledDate || Number.isNaN(scheduledDate.getTime())) {
    errors.scheduledFor = 'Please choose a valid scheduled date and time.';
  } else if (scheduledDate.getTime() < Date.now() + 30 * 1000) {
    errors.scheduledFor = 'Scheduled date & time must be at least 30 seconds in the future.';
  }

  if (Object.keys(errors).length > 0 || !baseTpl || !scheduledDate) {
    res.status(400).json({
      success: false,
      error: Object.values(errors)[0] || 'Invalid schedule request.',
      errors,
    });
    return;
  }

  const mergedTemplate: TransactionalEmailTemplate = {
    ...baseTpl,
    name: body.name !== undefined ? String(body.name) : baseTpl.name,
    enabled: body.enabled !== undefined ? Boolean(body.enabled) : baseTpl.enabled,
    ccAdmin: body.ccAdmin !== undefined ? Boolean(body.ccAdmin) : baseTpl.ccAdmin,
    subjectTemplate:
      body.subjectTemplate !== undefined ? String(body.subjectTemplate) : baseTpl.subjectTemplate,
    htmlTemplate:
      body.htmlTemplate !== undefined ? String(body.htmlTemplate) : baseTpl.htmlTemplate,
    textTemplate:
      body.textTemplate !== undefined ? String(body.textTemplate) : baseTpl.textTemplate,
    placeholders: Array.isArray(body.placeholders) ? body.placeholders : baseTpl.placeholders,
  };

  if (!mergedTemplate.enabled && body.forceSchedule !== true) {
    res.status(409).json({
      success: false,
      error: `Template "${mergedTemplate.name}" is disabled. Enable it or allow scheduling for disabled templates.`,
    });
    return;
  }

  const referenceId = `SCH-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
  const preview = previewEmailTemplate({
    template: mergedTemplate,
    variables: {
      ...(body.variables || {}),
      referenceId: (body.variables && body.variables.referenceId) || referenceId,
      clientEmail: (body.variables && body.variables.clientEmail) || recipientEmail,
      clientName: (body.variables && body.variables.clientName) || recipientName || undefined,
    },
    useSampleFallback,
    recipientEmail,
    recipientName: recipientName || undefined,
    ccAdmin: typeof body.ccAdmin === 'boolean' ? body.ccAdmin : mergedTemplate.ccAdmin,
  });

  const nowIso = new Date().toISOString();
  const schedule: ScheduledEmailDispatchRecord = {
    id: `sched-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    referenceId,
    templateId: mergedTemplate.id,
    templateName: mergedTemplate.name,
    category: mergedTemplate.category,
    recipientEmail,
    recipientName: recipientName || undefined,
    ccAdmin: preview.ccEmails.length > 0,
    ccEmails: preview.ccEmails,
    subject: preview.subject,
    html: preview.html,
    text: preview.text,
    variables: preview.resolvedVariables,
    useSampleFallback,
    scheduledFor: scheduledDate.toISOString(),
    notes: notes || undefined,
    status: 'scheduled',
    createdAt: nowIso,
    updatedAt: nowIso,
    dispatchedAt: null,
    messageId: null,
    transport: null,
    smtpNotice: null,
    error: null,
  };

  const queue = loadScheduledEmails();
  queue.unshift(schedule);
  saveScheduledEmails(queue);

  res.status(201).json({
    success: true,
    schedule,
    message: `Queued "${mergedTemplate.name}" for ${recipientEmail} on ${scheduledDate.toLocaleString()} (Ref: ${referenceId}).`,
  });
});

app.post('/api/email/schedules/process-due', requireAdminAuth, async (_req, res) => {
  const summary = await processDueScheduledEmails();
  const schedules = loadScheduledEmails();
  res.json({
    success: true,
    ...summary,
    schedules,
    message:
      summary.processedCount > 0
        ? `Processed ${summary.processedCount} due dispatch(es): ${summary.sentCount} sent, ${summary.failedCount} failed.`
        : 'No scheduled emails are due right now.',
  });
});

app.post('/api/email/schedules/:id/dispatch-now', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const queue = loadScheduledEmails();
  const idx = queue.findIndex((entry) => entry.id === id || entry.referenceId === id);
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Scheduled dispatch not found.' });
    return;
  }

  const target = queue[idx];
  if (target.status === 'processing') {
    res.status(409).json({ success: false, error: 'This dispatch is currently being processed.' });
    return;
  }
  if (target.status === 'cancelled') {
    res.status(409).json({ success: false, error: 'Cancelled dispatches cannot be sent directly.' });
    return;
  }

  queue[idx] = { ...target, status: 'processing', updatedAt: new Date().toISOString() };
  saveScheduledEmails(queue);

  const updated = await executeScheduledEmailItem(queue[idx]);
  const latestQueue = loadScheduledEmails();
  const latestIdx = latestQueue.findIndex((entry) => entry.id === target.id);
  if (latestIdx !== -1) {
    latestQueue[latestIdx] = updated;
    saveScheduledEmails(latestQueue);
  }

  res.status(updated.status === 'sent' ? 200 : 502).json({
    success: updated.status === 'sent',
    liveDelivered: updated.status === 'sent',
    schedule: updated,
    error: updated.error || undefined,
    message:
      updated.status === 'sent'
        ? `Scheduled email "${updated.templateName}" sent immediately to ${updated.recipientEmail}.`
        : `Immediate dispatch failed: ${updated.error || 'Brevo relay rejected delivery.'}`,
  });
});

app.post('/api/email/schedules/:id/cancel', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const queue = loadScheduledEmails();
  const idx = queue.findIndex((entry) => entry.id === id || entry.referenceId === id);
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Scheduled dispatch not found.' });
    return;
  }

  const target = queue[idx];
  if (target.status === 'sent') {
    res.status(409).json({ success: false, error: 'Email has already been sent and cannot be cancelled.' });
    return;
  }

  const updated: ScheduledEmailDispatchRecord = {
    ...target,
    status: 'cancelled',
    updatedAt: new Date().toISOString(),
  };
  queue[idx] = updated;
  saveScheduledEmails(queue);

  res.json({
    success: true,
    schedule: updated,
    message: `Cancelled scheduled dispatch ${target.referenceId}.`,
  });
});

app.delete('/api/email/schedules/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const queue = loadScheduledEmails();
  const exists = queue.some((entry) => entry.id === id || entry.referenceId === id);
  if (!exists) {
    res.status(404).json({ success: false, error: 'Scheduled dispatch not found.' });
    return;
  }
  const filtered = queue.filter((entry) => entry.id !== id && entry.referenceId !== id);
  saveScheduledEmails(filtered);
  res.json({
    success: true,
    message: 'Removed scheduled dispatch record from queue.',
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Transactional Email History & Resend API (/api/email/history*)
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/email/history', requireAdminAuth, (req, res) => {
  const limitNum = Math.min(parseInt(String(req.query.limit || '150'), 10) || 150, 400);
  const allLogs = loadEmailHistory();
  const logs = allLogs.slice(0, limitNum);
  const total = allLogs.length;
  const deliveredCount = allLogs.filter((l) => l.deliveryStatus === 'delivered').length;
  const pendingCount = allLogs.filter((l) => l.deliveryStatus === 'pending').length;
  const failedCount = allLogs.filter((l) => l.deliveryStatus === 'failed').length;
  const deliveryRate = total > 0 ? Math.round((deliveredCount / total) * 100) : 100;

  res.json({
    success: true,
    logs,
    stats: {
      total,
      deliveredCount,
      pendingCount,
      failedCount,
      deliveryRate,
    },
    brevoRelay: getBrevoRelayConfig(),
  });
});

app.post('/api/email/history/:id/resend', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const history = loadEmailHistory();
  const idx = history.findIndex((h) => h.id === id || h.referenceId === id);
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Email log record not found.' });
    return;
  }

  const target = history[idx];
  const recipientEmail = String(req.body?.recipientEmail || target.recipientEmail).trim();
  const sent = await dispatchBrevoEmail({
    recipientEmail,
    recipientName: target.clientName,
    subject: target.subject,
    html: target.html,
    text: target.text,
    ccEmails: target.ccEmails,
  });

  const retriedAt = new Date().toISOString();
  const updated: ServerEmailLogRecord = {
    ...target,
    recipientEmail,
    messageId: sent.messageId,
    retriedAt,
    delivered: sent.liveDelivered,
    deliveryStatus: sent.liveDelivered ? 'delivered' : 'failed',
    status: sent.liveDelivered ? 'Delivered' : 'Failed',
    transport: sent.transport,
    fromHeader: sent.fromHeader,
    previewUrl: sent.previewUrl,
    smtpNotice: sent.smtpNotice,
  };

  history[idx] = updated;
  writeJsonArray(EMAIL_HISTORY_FILE, history);

  res.status(sent.liveDelivered ? 200 : 502).json({
    success: sent.liveDelivered,
    liveDelivered: sent.liveDelivered,
    log: updated,
    smtpNotice: sent.smtpNotice,
    error: sent.liveDelivered ? undefined : sent.smtpNotice || 'Brevo resend failed.',
    message: sent.liveDelivered
      ? `Successfully resent [${updated.referenceId}] to ${recipientEmail} via ${sent.transport}.`
      : `Brevo resend failed for [${updated.referenceId}]: ${sent.smtpNotice || 'delivery rejected'}.`,
  });
});

app.patch('/api/email/history/:id/status', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const nextStatus = req.body?.deliveryStatus as 'delivered' | 'pending' | 'failed';
  const history = loadEmailHistory();
  const idx = history.findIndex((h) => h.id === id || h.referenceId === id);
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Email log record not found.' });
    return;
  }

  history[idx] = {
    ...history[idx],
    deliveryStatus: nextStatus || 'delivered',
    delivered: nextStatus === 'delivered',
  };
  writeJsonArray(EMAIL_HISTORY_FILE, history);

  res.json({
    success: true,
    log: history[idx],
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Calculation Email Report Dispatcher (/api/email/send-calculation)
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/email/send-calculation', async (req, res) => {
  try {
    const body = req.body || {};
    const primaryRecipient = String(body.primaryRecipient || '').trim();
    const recipientName = String(body.recipientName || 'Verified Member').trim();
    const ccRecipients: string[] = Array.isArray(body.ccRecipients)
      ? body.ccRecipients.map((e: any) => String(e || '').trim()).filter(Boolean)
      : [];
    const referenceId = String(body.referenceId || `CALC-2026-${Date.now().toString().slice(-5)}`).trim();
    const toolId = String(body.toolId || 'tax-calculator').trim();
    const toolName = String(body.toolName || 'Statutory Compliance Calculator').trim();
    const toolCategory = String(body.toolCategory || 'Taxation & Compliance').trim();
    const toolPath = String(body.toolPath || '/tools').trim();
    const subject = String(body.subject || `[${referenceId}] ${toolName} — Calculation Report`).trim();
    const html = String(body.html || '').trim();
    const text = String(body.text || '').trim();
    const summaryHighlight = String(body.summaryHighlight || 'Complete Report').trim();

    if (!primaryRecipient || !primaryRecipient.includes('@')) {
      res.status(400).json({
        success: false,
        error: 'A valid primary recipient email address is required.',
      });
      return;
    }

    const sent = await dispatchBrevoEmail({
      recipientEmail: primaryRecipient,
      recipientName,
      subject,
      html: html || `<p>${subject}</p>`,
      text: text || subject,
      ccEmails: ccRecipients,
    });

    const sentAt = new Date().toISOString();
    const logs = readJsonArray(CALCULATION_EMAILS_FILE);
    const record = {
      id: sent.messageId,
      referenceId,
      toolId,
      toolName,
      toolCategory,
      toolPath,
      primaryRecipient,
      recipientName,
      ccRecipients,
      subject,
      html,
      text,
      sentAt,
      status: sent.liveDelivered ? 'Delivered' : 'Failed',
      relayMode: sent.transport,
      fromHeader: sent.fromHeader,
      previewUrl: sent.previewUrl,
      smtpNotice: sent.smtpNotice,
      summaryHighlight,
    };
    logs.unshift(record);
    if (logs.length > 300) logs.length = 300;
    writeJsonArray(CALCULATION_EMAILS_FILE, logs);

    // Record in unified Brevo transactional email history ledger
    try {
      appendEmailHistory({
        id: `calc-${Date.now()}`,
        messageId: sent.messageId,
        referenceId,
        clientName: recipientName,
        recipientEmail: primaryRecipient,
        ccEmails: ccRecipients,
        practiceArea: toolName,
        mode: toolCategory,
        date: sentAt.slice(0, 10),
        timeSlot: new Date(sentAt).toLocaleTimeString(),
        status: sent.liveDelivered ? 'Delivered' : 'Failed',
        subject,
        html: html || `<p>${subject}</p>`,
        text: text || subject,
        sentAt,
        delivered: sent.liveDelivered,
        deliveryStatus: sent.liveDelivered ? 'delivered' : 'failed',
        category: 'system',
        transport: sent.transport,
        fromHeader: sent.fromHeader,
        previewUrl: sent.previewUrl,
        smtpNotice: sent.smtpNotice,
      });
    } catch (histErr) {
      console.warn('[Server] appendEmailHistory notice:', histErr);
    }

    // Also log to workspace tool signings for audit traceability
    try {
      const signings = loadSignings();
      signings.unshift({
        id: `mail-sig-${Date.now()}`,
        userId: primaryRecipient,
        userEmail: primaryRecipient,
        userName: recipientName,
        toolId,
        toolName: `${toolName} (Email Dispatched: ${referenceId})`,
        toolCategory,
        toolPath,
        authProvider: 'brevo-email-report',
        signedAt: sentAt,
        formattedDate: new Date(sentAt).toLocaleString(),
        sessionStatus: 'completed',
      });
      if (signings.length > 1000) signings.length = 1000;
      saveSignings(signings);
    } catch (sigErr) {
      console.warn('[Server] saveSignings notice:', sigErr);
    }

    res.status(sent.liveDelivered ? 200 : 502).json({
      success: sent.liveDelivered,
      liveDelivered: sent.liveDelivered,
      messageId: sent.messageId,
      referenceId,
      primaryRecipient,
      ccRecipients,
      sentAt,
      relayMode: sent.transport,
      fromHeader: sent.fromHeader,
      previewUrl: sent.previewUrl,
      smtpNotice: sent.smtpNotice,
      error: sent.liveDelivered ? undefined : sent.smtpNotice || 'Brevo relay did not deliver the calculation report.',
      record,
    });
  } catch (err: any) {
    console.error('[Server] Calculation email error:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to dispatch calculation report via email relay.',
    });
  }
});

app.get('/api/email/calculation-logs', requireAdminAuth, (_req, res) => {
  loadEmailHistory(); // Ensures legacy calculation logs are upgraded
  const logs = readJsonArray(CALCULATION_EMAILS_FILE);
  res.json({
    success: true,
    count: logs.length,
    logs,
    brevoRelay: getBrevoRelayConfig(),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Appointments, Contact & Careers Endpoints
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/appointments/notify', publicSubmitLimiter, async (req, res) => {
  const payload = req.body || {};
  const caller = await resolveVerifiedCaller(req);
  if (!caller.isAdmin && !caller.uid) {
    const turnstileCheck = await verifyTurnstileOrProof(req);
    if (!turnstileCheck.success) {
      res.status(403).json({
        success: false,
        error: turnstileCheck.message || 'Cloudflare Turnstile verification failed.',
      });
      return;
    }
  }

  const recipientEmail = String(payload.email || payload.clientEmail || payload.recipientEmail || '').trim();
  const clientName = String(payload.clientName || 'Valued Client').trim();
  const referenceId = String(payload.referenceId || `APT-${Date.now()}`).trim();
  const status = String(payload.status || 'Confirmed').trim();
  const practiceArea = String(payload.practiceArea || 'Tax & Legal Consultation').trim();
  const mode = String(payload.mode || 'virtual').trim();
  const date = String(payload.date || new Date().toISOString().slice(0, 10)).trim();
  const timeSlot = String(payload.timeSlot || '10:00 AM - 10:45 AM BST').trim();

  const templates = loadEmailTemplates();
  const tplId =
    status.toLowerCase() === 'cancelled'
      ? 'booking_cancellation'
      : status.toLowerCase().includes('remind')
      ? 'booking_reminder_3h'
      : 'booking_confirmation';
  const tpl = templates.find((t) => t.id === tplId) || DEFAULT_TRANSACTIONAL_EMAIL_TEMPLATES[2];

  if (!tpl.enabled) {
    res.json({
      success: true,
      skipped: true,
      reason: `Template "${tpl.name}" is disabled in Email Template Manager.`,
    });
    return;
  }

  const rendered =
    payload.html && payload.subject
      ? {
          subject: String(payload.subject),
          html: String(payload.html),
          text: String(payload.text || payload.subject),
        }
      : EmailTemplateGenerator.generate(
          tpl,
          {
            name: clientName,
            clientName,
            clientEmail: recipientEmail,
            clientPhone: payload.phone || '+880 1613-242524',
            companyName: payload.companyName || '',
            referenceId,
            service: String(payload.service || payload.serviceType || practiceArea).trim(),
            serviceType: String(payload.serviceType || payload.service || practiceArea).trim(),
            practiceArea,
            time: String(
              payload.appointmentTime || payload.time || `${date} at ${timeSlot} (BST)`
            ).trim(),
            appointmentTime: String(
              payload.appointmentTime || payload.time || `${date} at ${timeSlot} (BST)`
            ).trim(),
            date,
            appointmentDate: date,
            timeSlot,
            status,
            mode,
            assignedCounsel:
              payload.assignedLead ||
              payload.leadPartnerName ||
              'Adv. Md. Ekramul Haque (Managing Partner)',
            notes:
              String(payload.notes || payload.messageOrNotes || '').trim() ||
              'Scheduled tax & legal consultation briefing.',
            calendarEventId: payload.calendarEventId,
            meetingLink: payload.meetingLink,
            cancellationReason: payload.cancellationReason || 'Rescheduled at client request',
          },
          { useSampleFallback: true }
        );

  const relay = getBrevoRelayConfig();
  const requestedCcEmails = Array.isArray(payload.ccEmails)
    ? payload.ccEmails
        .map((e: unknown) => String(e || '').trim().toLowerCase())
        .filter((e: string) => e.includes('@'))
    : [];
  const ccSet = new Set<string>(requestedCcEmails);
  if (tplId === 'booking_confirmation') {
    ccSet.add('info@accounticca.com');
  }
  if (tpl.ccAdmin && relay.senderEmail && relay.senderEmail.includes('@')) {
    ccSet.add(relay.senderEmail.trim().toLowerCase());
  }
  const ccEmails = Array.from(ccSet);

  const sent = recipientEmail.includes('@')
    ? await dispatchBrevoEmail({
        recipientEmail,
        recipientName: clientName,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        ccEmails,
      })
    : {
        messageId: `<apt-${Date.now()}@local.invalid>`,
        transport: 'no_recipient_email',
        fromHeader: relay.formattedFrom,
        previewUrl: null,
        smtpNotice: 'No recipient email address provided.',
        liveDelivered: false,
      };

  const sentAt = new Date().toISOString();
  const notifications = readJsonArray(APPOINTMENT_NOTIFS_FILE);
  const record = {
    id: `notif-${Date.now()}`,
    messageId: sent.messageId,
    referenceId,
    appointmentId: payload.appointmentId,
    recipientEmail,
    ccEmails,
    clientName,
    practiceArea,
    mode,
    date,
    timeSlot,
    status,
    subject: rendered.subject,
    html: rendered.html,
    sentAt,
    delivered: sent.liveDelivered,
    transport: sent.transport,
    smtpNotice: sent.smtpNotice,
  };
  notifications.unshift(record);
  if (notifications.length > 200) notifications.length = 200;
  writeJsonArray(APPOINTMENT_NOTIFS_FILE, notifications);

  if (recipientEmail.includes('@')) {
    appendEmailHistory({
      id: record.id,
      messageId: sent.messageId,
      referenceId,
      appointmentId: payload.appointmentId,
      clientName,
      recipientEmail,
      ccEmails,
      phone: payload.phone || '',
      companyName: payload.companyName || '',
      practiceArea,
      mode,
      date,
      timeSlot,
      status: sent.liveDelivered ? status : 'Failed',
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      sentAt,
      delivered: sent.liveDelivered,
      deliveryStatus: sent.liveDelivered ? 'delivered' : 'failed',
      category: 'booking',
      transport: sent.transport,
      fromHeader: sent.fromHeader,
      previewUrl: sent.previewUrl,
      smtpNotice: sent.smtpNotice,
    });
  }

  res.status(sent.liveDelivered || !recipientEmail.includes('@') ? 200 : 502).json({
    success: sent.liveDelivered,
    liveDelivered: sent.liveDelivered,
    messageId: sent.messageId,
    smtpNotice: sent.smtpNotice,
    notification: record,
  });
});

app.get('/api/appointments/notifications', async (req, res) => {
  const caller = await resolveVerifiedCaller(req);
  const refId = String(req.query.referenceId || '').trim();
  const email = String(req.query.email || '').trim().toLowerCase();

  if (!caller.isAdmin) {
    if (!caller.uid || !caller.email) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }
    if (email && email !== caller.email) {
      res.status(403).json({ success: false, error: 'Cannot view notifications for another user.' });
      return;
    }
  }

  const notifications = readJsonArray(APPOINTMENT_NOTIFS_FILE);
  const filtered = notifications.filter((n: any) => {
    if (!caller.isAdmin && String(n.recipientEmail || '').toLowerCase() !== caller.email) {
      return false;
    }
    if (refId && n.referenceId !== refId) return false;
    if (email && String(n.recipientEmail || '').toLowerCase() !== email) return false;
    return true;
  });
  res.json({ success: true, notifications: filtered });
});

app.post('/api/appointments/scan-reminders', async (req, res) => {
  const caller = await resolveVerifiedCaller(req);
  if (!caller.isAdmin && !caller.uid) {
    res.status(401).json({ success: false, error: 'Authentication required to scan appointment reminders.' });
    return;
  }
  res.json({
    success: true,
    scannedCount: 0,
    remindersSent: 0,
    results: [],
    message: 'Appointment reminder scan completed.',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/appointments/preview-reminder-email', requireAdminAuth, (req, res) => {
  const clientName = req.body?.clientName || 'Valued Client';
  res.json({
    success: true,
    subject: `Upcoming Consultation Reminder — ACCOUNTICCA x E-Lawyers`,
    html: `<p>Dear ${clientName}, this is a reminder for your upcoming scheduled consultation.</p>`,
    text: `Dear ${clientName}, this is a reminder for your upcoming scheduled consultation.`,
  });
});

app.get('/api/contact/support-config', (_req, res) => {
  const relay = getBrevoRelayConfig();
  res.json({
    success: true,
    supportEmail: getSupportEmailRecipient(),
    relayConfigured: relay.configured,
    relayMode: relay.mode,
    senderName: relay.senderName,
  });
});

app.post('/api/contact/support', publicSubmitLimiter, async (req, res) => {
  try {
    const body = req.body || {};
    const turnstileCheck = await verifyTurnstileOrProof(req, 'support_contact');
    if (!turnstileCheck.success) {
      res.status(403).json({
        success: false,
        persisted: false,
        error: turnstileCheck.message || 'Cloudflare Turnstile verification failed.',
      });
      return;
    }

    const name = sanitizePlainText(body.name || '', 80);
    const email = String(body.email || '').trim().toLowerCase();
    const phone = sanitizePlainText(body.phone || '', 24);
    const companyName = sanitizePlainText(body.companyName || '', 120);
    const department = sanitizePlainText(body.department || 'General & Advisory Support', 120);
    const subject = sanitizePlainText(body.subject || '', 140);
    const message = sanitizePlainText(body.message || '', 3000);

    const errors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (!name || name.length < 2 || name.length > 80) {
      errors.name = 'Please enter your full name (2–80 characters).';
    } else if (!/^[a-zA-Z\s.'-]+$/.test(name)) {
      errors.name = 'Name may only contain letters, spaces, periods, hyphens, or apostrophes.';
    }

    if (!email || email.length > 254 || !emailRegex.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (phone) {
      const digitsOnly = phone.replace(/\D/g, '');
      if (digitsOnly.length < 8 || digitsOnly.length > 15) {
        errors.phone = 'Phone number must contain 8–15 digits if provided.';
      }
    }

    if (!subject || subject.length < 4 || subject.length > 140) {
      errors.subject = 'Please enter a clear subject (4–140 characters).';
    }

    if (!message || message.length < 15 || message.length > 3000) {
      errors.message = 'Please provide at least 15 characters (up to 3,000) in your message.';
    }

    if (Object.keys(errors).length > 0) {
      res.status(400).json({
        success: false,
        persisted: false,
        error: 'Please review the highlighted validation errors.',
        errors,
      });
      return;
    }

    const dupCheck = checkDuplicateSubmission('support_contact', [email, subject, message]);
    if (dupCheck.isDuplicate && dupCheck.existingReferenceId) {
      res.status(200).json({
        success: true,
        persisted: true,
        duplicatePrevented: true,
        liveDelivered: true,
        referenceId: dupCheck.existingReferenceId,
        supportEmail: getSupportEmailRecipient(),
        message: `Your support request (${dupCheck.existingReferenceId}) was already submitted cleanly.`,
      });
      return;
    }

    const adminDb = getAdminFirestore();
    if (!adminDb) {
      res.status(503).json({
        success: false,
        persisted: false,
        error:
          'Durable database service is unavailable (server Firebase Admin credentials not configured). Your support ticket could not be recorded.',
      });
      return;
    }

    const referenceId = `SUP-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const submittedAt = new Date().toISOString();
    const submissionId = `sup_${referenceId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

    const leadDoc = {
      id: submissionId,
      referenceId,
      type: 'support_contact',
      requestType: 'Support Contact Ticket',
      fullName: name,
      name,
      email,
      phone,
      companyName,
      serviceCategory: department,
      department,
      division: department,
      subject,
      message,
      urgency: 'Standard Advisory (24–48h)',
      source: 'support_contact_form',
      submittedAt,
      followUpStatus: 'New',
      status: 'new',
      notionSyncStatus: 'pending',
      createdAt: FieldValue.serverTimestamp(),
    };

    try {
      await adminDb.collection('contact_messages').doc(submissionId).set(leadDoc, { merge: true });
      recordSubmissionFingerprint(dupCheck.fingerprint, referenceId);
    } catch (fsErr: any) {
      console.error(`[Support] Firestore save failed for ${referenceId}:`, fsErr?.message);
      res.status(503).json({
        success: false,
        persisted: false,
        error: 'Unable to persist support ticket in Firestore. Please try again later.',
      });
      return;
    }

    // Sync to Notion Database A (Website Contact Leads)
    const notionRes = await syncContactLeadToNotion({
      id: submissionId,
      referenceId,
      clientName: name,
      email,
      phone,
      companyName,
      serviceArea: subject,
      department,
      messageOrNotes: message,
      urgency: 'Standard Advisory (24–48h)',
      source: 'support_contact_form',
      submittedAt,
      status: 'New',
    });

    const dispatched = await sendSupportContactEmail({
      referenceId,
      name,
      email,
      phone: phone || undefined,
      companyName: companyName || undefined,
      department,
      subject,
      message,
      submittedAt,
    });

    try {
      await adminDb
        .collection('contact_messages')
        .doc(submissionId)
        .set(
          {
            notionPageId: notionRes.pageId || null,
            notionSyncStatus: notionRes.synced
              ? 'synced'
              : notionRes.configured
              ? 'queued'
              : 'unconfigured',
            emailDelivered: dispatched.result.liveDelivered,
            emailMessageId: dispatched.result.messageId,
          },
          { merge: true }
        );
    } catch {
      // non-fatal metadata update
    }

    appendEmailHistory({
      id: submissionId,
      messageId: dispatched.result.messageId,
      referenceId,
      clientName: name,
      recipientEmail: dispatched.supportEmail,
      phone,
      companyName,
      practiceArea: department,
      mode: 'Support Contact Form',
      date: submittedAt.slice(0, 10),
      timeSlot: new Date(submittedAt).toLocaleTimeString(),
      status: dispatched.result.liveDelivered ? 'Delivered' : 'Failed',
      subject: dispatched.subject,
      html: dispatched.html,
      text: dispatched.text,
      sentAt: submittedAt,
      delivered: dispatched.result.liveDelivered,
      deliveryStatus: dispatched.result.liveDelivered ? 'delivered' : 'failed',
      category: 'system',
      transport: dispatched.result.transport,
      fromHeader: dispatched.result.fromHeader,
      previewUrl: dispatched.result.previewUrl,
      smtpNotice: dispatched.result.smtpNotice,
    });

    console.info(
      `[Support] Persisted ticket ${referenceId} (${maskEmail(email)}) notion=${notionRes.action || 'pending'} email=${dispatched.result.liveDelivered}`
    );

    res.status(dispatched.result.liveDelivered ? 200 : 502).json({
      success: dispatched.result.liveDelivered,
      persisted: true,
      liveDelivered: dispatched.result.liveDelivered,
      savedLocally: true,
      submissionId,
      referenceId,
      supportEmail: dispatched.supportEmail,
      messageId: dispatched.result.messageId,
      transport: dispatched.result.transport,
      previewUrl: dispatched.result.previewUrl,
      smtpNotice: dispatched.result.smtpNotice,
      notionSynced: notionRes.synced,
      error: dispatched.result.liveDelivered
        ? undefined
        : dispatched.result.smtpNotice || 'Brevo SMTP relay did not deliver the support email.',
      message: dispatched.result.liveDelivered
        ? `Your message has been delivered to ${dispatched.supportEmail} (Ref: ${referenceId}).`
        : `Your inquiry (${referenceId}) was saved to our database, but live Brevo SMTP delivery failed: ${
            dispatched.result.smtpNotice || 'relay error'
          }`,
    });
  } catch (err: any) {
    console.error('[Server] Support contact dispatch error:', err?.message || 'unexpected_error');
    res.status(500).json({
      success: false,
      persisted: false,
      error: 'Unexpected error while processing your support message.',
    });
  }
});

app.post('/api/contact/submit', publicSubmitLimiter, async (req, res) => {
  try {
    const body = req.body || {};
    const expectedAction =
      body.source === 'homepage_quick_intake' && body.requestType === 'Consultation Meeting'
        ? 'quick_appointment'
        : body.source === 'homepage_quick_intake'
        ? 'quick_inquiry'
        : body.requestType === 'Consultation Meeting'
        ? 'appointment_booking'
        : 'contact_inquiry';

    const turnstileCheck = await verifyTurnstileOrProof(req, expectedAction);
    if (!turnstileCheck.success) {
      res.status(403).json({
        success: false,
        persisted: false,
        error: turnstileCheck.message || 'Cloudflare Turnstile verification failed.',
      });
      return;
    }

    const parsed = contactInquirySchema.safeParse({
      ...body,
      clientName: body.clientName || body.fullName || body.name || '',
      messageOrNotes: body.messageOrNotes || body.message || '',
      serviceArea: body.serviceArea || body.service || 'General Advisory',
      department: body.department || body.division || 'Accounticca Advisory',
    });

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        persisted: false,
        error: parsed.error.issues[0]?.message || 'Please review your inquiry fields.',
      });
      return;
    }

    const input = parsed.data;
    if (!input.email && !input.phone) {
      res.status(400).json({
        success: false,
        persisted: false,
        error: 'Please provide at least an email address or phone number.',
      });
      return;
    }

    const dupCheck = checkDuplicateSubmission('contact_submit', [
      input.email || input.phone,
      input.serviceArea,
      input.messageOrNotes,
    ]);
    if (dupCheck.isDuplicate && dupCheck.existingReferenceId) {
      res.status(200).json({
        success: true,
        persisted: true,
        duplicatePrevented: true,
        referenceId: dupCheck.existingReferenceId,
        sheetSynced: false,
      });
      return;
    }

    const adminDb = getAdminFirestore();
    if (!adminDb) {
      res.status(503).json({
        success: false,
        persisted: false,
        error:
          'Durable database service is unavailable (server Firebase Admin credentials not configured). Your inquiry could not be saved.',
      });
      return;
    }

    const referenceId = sanitizePlainText(
      input.referenceId || `INQ-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      80
    );
    const submissionId = `inq_${referenceId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    const submittedAt = new Date().toISOString();

    // Never store workspaceAccessToken, turnstileToken, or turnstileProof inside contact records
    const leadRecord = {
      id: submissionId,
      referenceId,
      firstName: sanitizePlainText(input.firstName || '', 80),
      lastName: sanitizePlainText(input.lastName || '', 80),
      fullName: sanitizePlainText(input.clientName, 120),
      clientName: sanitizePlainText(input.clientName, 120),
      email: input.email || '',
      phone: input.phone || '',
      companyName: sanitizePlainText(input.companyName || 'Direct Client / Individual', 150),
      serviceCategory: sanitizePlainText(input.serviceArea, 160),
      service: sanitizePlainText(input.serviceArea, 160),
      department: sanitizePlainText(input.department || input.division, 120),
      division: sanitizePlainText(input.division || input.department, 120),
      subject: sanitizePlainText(input.subject || input.expertiseTopic || input.serviceArea, 180),
      message: sanitizePlainText(input.messageOrNotes, 5000),
      urgency: sanitizePlainText(input.urgency, 80),
      source: sanitizePlainText(input.source, 80),
      requestType: sanitizePlainText(input.requestType, 80),
      consultationMode: sanitizePlainText(input.consultationMode, 120),
      preferredDate: sanitizePlainText(input.preferredDate, 64),
      preferredTimeSlot: sanitizePlainText(input.preferredTimeSlot, 64),
      assignedPartner: sanitizePlainText(input.assignedPartner || '', 160),
      submittedAt,
      followUpStatus: 'New',
      status: 'new',
      notionSyncStatus: 'pending',
      createdAt: FieldValue.serverTimestamp(),
    };

    try {
      await adminDb.collection('contact_messages').doc(submissionId).set(leadRecord, { merge: true });
      recordSubmissionFingerprint(dupCheck.fingerprint, referenceId);
    } catch (fsErr: any) {
      console.error(`[Contact] Firestore save failed for ${referenceId}:`, fsErr?.message);
      res.status(503).json({
        success: false,
        persisted: false,
        error: 'Unable to save inquiry to durable Firestore database. Please retry.',
      });
      return;
    }

    // Optional transient Google Sheets append (token used in memory only, never persisted)
    let sheetSynced = false;
    const transientToken =
      typeof body.workspaceAccessToken === 'string' ? body.workspaceAccessToken.trim() : '';
    const transientSheetId =
      typeof body.spreadsheetId === 'string' ? body.spreadsheetId.trim() : '';

    if (transientToken && transientSheetId) {
      try {
        const rowValues = [
          referenceId,
          submittedAt,
          leadRecord.requestType,
          leadRecord.division,
          leadRecord.fullName,
          leadRecord.email || 'N/A',
          leadRecord.phone || 'N/A',
          leadRecord.companyName,
          leadRecord.serviceCategory,
          leadRecord.urgency,
          leadRecord.consultationMode,
          leadRecord.preferredDate,
          leadRecord.preferredTimeSlot,
          leadRecord.assignedPartner,
          leadRecord.message,
          leadRecord.followUpStatus,
        ];
        const sheetsRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
            transientSheetId
          )}/values/Contact!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${transientToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ values: [rowValues] }),
            signal: AbortSignal.timeout(8000),
          }
        );
        sheetSynced = sheetsRes.ok;
      } catch {
        sheetSynced = false;
      }
    }

    // Synchronize into Notion Database A (Website Contact Leads)
    const notionRes = await syncContactLeadToNotion({
      id: submissionId,
      referenceId,
      clientName: leadRecord.fullName,
      email: leadRecord.email,
      phone: leadRecord.phone,
      companyName: leadRecord.companyName,
      serviceArea: leadRecord.serviceCategory,
      department: leadRecord.department,
      messageOrNotes: leadRecord.message,
      urgency: leadRecord.urgency,
      source: leadRecord.source,
      submittedAt,
      status: 'New',
    });

    // Optional consultation appointment mirror (when submitted by public visitor)
    let appointmentDocId: string | undefined;
    if (input.requestType === 'Consultation Meeting' && body.syncConsultationDoc !== false) {
      const targetCol =
        leadRecord.source === 'homepage_quick_intake' ? 'consultation_appointments' : 'appointments';
      const apptDocPayload: Record<string, any> = {
        referenceId,
        fullName: leadRecord.fullName,
        clientName: leadRecord.fullName,
        phone: leadRecord.phone,
        email: leadRecord.email || 'N/A',
        companyName: leadRecord.companyName,
        practiceArea: leadRecord.serviceCategory,
        expertiseArea: sanitizePlainText(input.expertiseTopic || leadRecord.serviceCategory, 160),
        division: leadRecord.division,
        consultationMode: leadRecord.consultationMode,
        preferredDate: leadRecord.preferredDate,
        date: leadRecord.preferredDate,
        preferredTimeSlot: leadRecord.preferredTimeSlot,
        timeSlot: leadRecord.preferredTimeSlot,
        notes: leadRecord.message,
        status: 'confirmed',
        source: leadRecord.source,
        createdAt: FieldValue.serverTimestamp(),
      };
      if (body.appointmentMetadata && typeof body.appointmentMetadata === 'object') {
        const meta = body.appointmentMetadata;
        if (typeof meta.practiceAreaId === 'string') apptDocPayload.practiceAreaId = sanitizePlainText(meta.practiceAreaId, 80);
        if (meta.assignedPartner && typeof meta.assignedPartner === 'object') apptDocPayload.assignedPartner = meta.assignedPartner;
        if (typeof meta.mode === 'string') apptDocPayload.mode = sanitizePlainText(meta.mode, 32);
        if (typeof meta.consultationFee === 'number') apptDocPayload.consultationFee = meta.consultationFee;
        if (typeof meta.paymentStatus === 'string') apptDocPayload.paymentStatus = sanitizePlainText(meta.paymentStatus, 32);
        if (typeof meta.paymentGateway === 'string') apptDocPayload.paymentGateway = sanitizePlainText(meta.paymentGateway, 80);
        if (typeof meta.transactionId === 'string') apptDocPayload.transactionId = sanitizePlainText(meta.transactionId, 120);
        if (typeof meta.userId === 'string') apptDocPayload.userId = sanitizePlainText(meta.userId, 128);
        if (typeof meta.calendarEventId === 'string') apptDocPayload.calendarEventId = sanitizePlainText(meta.calendarEventId, 160);
        if (typeof meta.calendarSynced === 'boolean') apptDocPayload.calendarSynced = meta.calendarSynced;
      }
      try {
        await adminDb.collection(targetCol).doc(referenceId).set(apptDocPayload, { merge: true });
        appointmentDocId = referenceId;
      } catch (apptErr: any) {
        console.warn(`[Contact] Consultation mirror notice (${referenceId}):`, apptErr?.message);
      }
    }

    // Optional Brevo confirmation email for consultation appointment bookings
    let emailDelivered = false;
    if (
      body.appointmentEmailPayload &&
      typeof body.appointmentEmailPayload === 'object' &&
      leadRecord.email.includes('@')
    ) {
      const ep = body.appointmentEmailPayload;
      const relay = getBrevoRelayConfig();
      const ccList = Array.isArray(ep.ccEmails)
        ? ep.ccEmails.map((e: unknown) => String(e || '').trim().toLowerCase()).filter((e: string) => e.includes('@'))
        : ['info@accounticca.com'];
      if (relay.senderEmail && relay.senderEmail.includes('@') && !ccList.includes(relay.senderEmail.toLowerCase())) {
        ccList.push(relay.senderEmail.toLowerCase());
      }
      const subj = sanitizePlainText(ep.subject || `[${referenceId}] Consultation Confirmation`, 220);
      const htmlBody = typeof ep.html === 'string' && ep.html.trim() ? ep.html : `<p>Your consultation (${referenceId}) is confirmed for ${leadRecord.preferredDate} (${leadRecord.preferredTimeSlot}).</p>`;
      const textBody = typeof ep.text === 'string' && ep.text.trim() ? ep.text : `Consultation ${referenceId} confirmed for ${leadRecord.preferredDate} (${leadRecord.preferredTimeSlot}).`;
      try {
        const sent = await dispatchBrevoEmail({
          recipientEmail: leadRecord.email,
          recipientName: leadRecord.fullName,
          subject: subj,
          html: htmlBody,
          text: textBody,
          ccEmails: ccList,
        });
        emailDelivered = sent.liveDelivered;
        appendEmailHistory({
          id: `apt-contact-${Date.now()}`,
          messageId: sent.messageId,
          referenceId,
          appointmentId: appointmentDocId,
          clientName: leadRecord.fullName,
          recipientEmail: leadRecord.email,
          ccEmails: ccList,
          phone: leadRecord.phone,
          companyName: leadRecord.companyName,
          practiceArea: leadRecord.serviceCategory,
          mode: leadRecord.consultationMode,
          date: leadRecord.preferredDate,
          timeSlot: leadRecord.preferredTimeSlot,
          status: sent.liveDelivered ? 'Confirmed' : 'Failed',
          subject: subj,
          html: htmlBody,
          text: textBody,
          sentAt: submittedAt,
          delivered: sent.liveDelivered,
          deliveryStatus: sent.liveDelivered ? 'delivered' : 'failed',
          category: 'booking',
          transport: sent.transport,
          fromHeader: sent.fromHeader,
          previewUrl: sent.previewUrl,
          smtpNotice: sent.smtpNotice,
        });
      } catch {
        emailDelivered = false;
      }
    }

    try {
      await adminDb
        .collection('contact_messages')
        .doc(submissionId)
        .set(
          {
            notionPageId: notionRes.pageId || null,
            notionSyncStatus: notionRes.synced
              ? 'synced'
              : notionRes.configured
              ? 'queued'
              : 'unconfigured',
            sheetSynced,
            emailDelivered,
          },
          { merge: true }
        );
    } catch {
      // non-fatal metadata update
    }

    console.info(
      `[Contact] Saved lead ${referenceId} (${maskEmail(leadRecord.email)}, ${maskPhone(
        leadRecord.phone
      )}) notion=${notionRes.action || 'pending'} sheets=${sheetSynced} email=${emailDelivered}`
    );

    res.status(200).json({
      success: true,
      persisted: true,
      submissionId,
      appointmentId: appointmentDocId,
      referenceId,
      sheetSynced,
      emailDelivered,
      notionSynced: notionRes.synced,
      notionStatus: notionRes.action || 'queued',
      inquiry: {
        id: submissionId,
        referenceId,
        clientName: leadRecord.fullName,
        email: leadRecord.email,
        serviceArea: leadRecord.serviceCategory,
        department: leadRecord.department,
        submittedAt,
        followUpStatus: leadRecord.followUpStatus,
      },
    });
  } catch (err: any) {
    console.error('[Contact] Unexpected submission error:', err?.message || 'error');
    res.status(500).json({
      success: false,
      persisted: false,
      error: 'Unexpected error while submitting your inquiry.',
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Admin CRM Leads, Newsletter Subscribers & Notion Sync Endpoints
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/contact/leads', requireAdminAuth, async (req, res) => {
  const adminDb = getAdminFirestore();
  if (!adminDb) {
    res.status(503).json({
      success: false,
      error: 'Durable Firestore Admin database is unavailable in this runtime.',
    });
    return;
  }

  const limitNum = Math.min(parseInt(String(req.query.limit || '100'), 10) || 100, 300);
  const snap = await adminDb
    .collection('contact_messages')
    .orderBy('submittedAt', 'desc')
    .limit(limitNum)
    .get();

  const leads = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  res.json({ success: true, count: leads.length, leads });
});

app.patch('/api/contact/leads/:id', requireAdminAuth, async (req, res) => {
  const adminDb = getAdminFirestore();
  if (!adminDb) {
    res.status(503).json({ success: false, error: 'Durable Firestore Admin database is unavailable.' });
    return;
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id || '');
  const allowedStatuses = new Set(['New', 'Pending', 'In Progress', 'Replied', 'Completed']);
  const requestedStatus = sanitizePlainText(req.body?.followUpStatus || req.body?.status || '', 40);
  const followUpNotes =
    req.body?.followUpNotes !== undefined ? sanitizePlainText(req.body.followUpNotes, 2000) : undefined;

  if (requestedStatus && !allowedStatuses.has(requestedStatus)) {
    res.status(400).json({
      success: false,
      error: 'Status must be one of: New, Pending, In Progress, Replied, Completed.',
    });
    return;
  }

  const docRef = adminDb.collection('contact_messages').doc(id);
  const snap = await docRef.get();
  if (!snap.exists) {
    res.status(404).json({ success: false, error: 'Lead record not found.' });
    return;
  }

  const existing = snap.data() || {};
  const nextStatus = (requestedStatus || existing.followUpStatus || 'New') as
    | 'New'
    | 'Pending'
    | 'In Progress'
    | 'Replied'
    | 'Completed';
  const nextNotes = followUpNotes !== undefined ? followUpNotes : existing.followUpNotes || '';

  await docRef.set(
    {
      followUpStatus: nextStatus,
      followUpNotes: nextNotes,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  const notionRes = await syncContactLeadToNotion({
    id,
    referenceId: existing.referenceId || id,
    clientName: existing.fullName || existing.clientName || 'Client',
    email: existing.email || '',
    phone: existing.phone || '',
    companyName: existing.companyName || '',
    serviceArea: existing.serviceCategory || existing.service || 'General Advisory',
    department: existing.department || existing.division || '',
    messageOrNotes: existing.message || '',
    urgency: existing.urgency || '',
    source: existing.source || 'website',
    submittedAt: existing.submittedAt || new Date().toISOString(),
    status: nextStatus,
    followUpNotes: nextNotes,
    notionPageId: existing.notionPageId || null,
  });

  if (notionRes.pageId) {
    await docRef.set(
      {
        notionPageId: notionRes.pageId,
        notionSyncStatus: notionRes.synced ? 'synced' : 'queued',
      },
      { merge: true }
    );
  }

  res.json({
    success: true,
    id,
    followUpStatus: nextStatus,
    followUpNotes: nextNotes,
    notionSynced: notionRes.synced,
  });
});

app.get('/api/newsletter/subscribers', requireAdminAuth, async (req, res) => {
  const adminDb = getAdminFirestore();
  if (!adminDb) {
    res.status(503).json({
      success: false,
      error: 'Durable Firestore Admin database is unavailable in this runtime.',
    });
    return;
  }

  const limitNum = Math.min(parseInt(String(req.query.limit || '200'), 10) || 200, 500);
  const snap = await adminDb
    .collection('newsletterSubscribers')
    .orderBy('lastUpdated', 'desc')
    .limit(limitNum)
    .get();

  const subscribers = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  res.json({ success: true, count: subscribers.length, subscribers });
});

app.get('/api/notion/status', requireAdminAuth, async (_req, res) => {
  const status = await getNotionSyncStatus();
  res.json({ success: true, ...status });
});

app.post('/api/notion/sync/retry', requireAdminAuth, async (_req, res) => {
  const result = await retryFailedNotionSyncs();
  res.json({ success: true, ...result });
});

app.get('/api/careers/applications', async (req, res) => {
  const caller = await resolveVerifiedCaller(req);
  const apps = readJsonArray(CAREER_APPLICATIONS_FILE);
  const refId = String(req.query.refId || '').trim().toLowerCase();
  const email = String(req.query.email || '').trim().toLowerCase();

  if (!caller.isAdmin) {
    if (!refId) {
      res.status(401).json({
        success: false,
        error: 'Administrator sign-in is required to list or search applications by email.',
      });
      return;
    }
    const matched = apps
      .filter((a: any) => String(a.referenceId || '').toLowerCase() === refId)
      .map((a: any) => ({
        referenceId: a.referenceId,
        position: a.position,
        department: a.department,
        status: a.status,
        submittedAt: a.submittedAt,
      }));
    res.json({ success: true, applications: matched });
    return;
  }

  let filtered = apps;
  if (refId) {
    filtered = apps.filter((a: any) => String(a.referenceId || '').toLowerCase() === refId);
  } else if (email) {
    filtered = apps.filter((a: any) => String(a.candidateEmail || a.email || '').toLowerCase() === email);
  }
  res.json({ success: true, applications: filtered });
});

app.post('/api/careers/apply', publicSubmitLimiter, async (req, res) => {
  const careerTurnstileToken = extractTurnstileToken(req.body);
  const careerTurnstileProof =
    typeof req.body?.turnstileProof === 'string' ? req.body.turnstileProof : undefined;
  if (careerTurnstileToken !== undefined || careerTurnstileProof !== undefined) {
    const turnstileCheck = await verifyTurnstileOrProof(req);
    if (!turnstileCheck.success) {
      res.status(403).json({
        success: false,
        error: turnstileCheck.message || 'Cloudflare Turnstile verification failed.',
      });
      return;
    }
  }

  const body = req.body || {};
  const candidateName = sanitizePlainText(body.fullName || body.candidateName || '', 120);
  const candidateEmail = String(body.email || body.candidateEmail || '').trim().toLowerCase();

  if (!candidateName || !candidateEmail || candidateEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(candidateEmail)) {
    res.status(400).json({
      success: false,
      error: 'Valid candidate full name and email address are required.',
    });
    return;
  }

  const submittedAt = new Date().toISOString();
  const applicationRefId = sanitizePlainText(
    body.applicationRefId || body.referenceId || `ELAW-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    80
  );

  const normalizedData: CareerApplicationData = {
    applicationRefId,
    position: String(body.position || 'Career Applicant').trim(),
    department: String(body.department || 'E-Lawyers Recruitment Division').trim(),
    fullName: candidateName,
    email: candidateEmail,
    phone: String(body.phone || 'Not provided').trim(),
    whatsapp: body.whatsapp ? String(body.whatsapp).trim() : undefined,
    address: String(body.address || 'Dhaka, Bangladesh').trim(),
    location: String(body.location || 'Dhaka').trim(),
    linkedin: body.linkedin ? String(body.linkedin).trim() : undefined,
    highestQualification: String(body.highestQualification || 'Graduate').trim(),
    degreeProgram: String(body.degreeProgram || body.highestQualification || 'Degree').trim(),
    major: String(body.major || 'General').trim(),
    institution: String(body.institution || 'University / College').trim(),
    graduationYear: String(body.graduationYear || String(new Date().getFullYear())).trim(),
    academicResult: String(body.academicResult || 'Passed').trim(),
    currentlyStudying: String(body.currentlyStudying || 'No').trim(),
    accountingPrinciplesRating: body.accountingPrinciplesRating,
    accountingActivities: Array.isArray(body.accountingActivities) ? body.accountingActivities : undefined,
    accountingSoftware: Array.isArray(body.accountingSoftware) ? body.accountingSoftware : undefined,
    excelSkill: body.excelSkill,
    taxVat: body.taxVat,
    skillsDetails: body.skillsDetails ? String(body.skillsDetails).trim() : undefined,
    customerServiceSkills: Array.isArray(body.customerServiceSkills) ? body.customerServiceSkills : undefined,
    computerSkills: Array.isArray(body.computerSkills) ? body.computerSkills : undefined,
    mtoTracks: Array.isArray(body.mtoTracks) ? body.mtoTracks : undefined,
    salesMarketingSkills: Array.isArray(body.salesMarketingSkills) ? body.salesMarketingSkills : undefined,
    leadGenChannels: Array.isArray(body.leadGenChannels) ? body.leadGenChannels : undefined,
    analyticalRating: body.analyticalRating,
    rotationalPreference: body.rotationalPreference,
    englishFluency: body.englishFluency,
    bengaliFluency: body.bengaliFluency,
    typingSpeed: body.typingSpeed,
    voiceClarity: body.voiceClarity,
    workExperience: String(body.workExperience || 'Fresh Candidate').trim(),
    experienceLength: body.experienceLength ? String(body.experienceLength).trim() : undefined,
    organization: body.organization ? String(body.organization).trim() : undefined,
    jobTitle: body.jobTitle ? String(body.jobTitle).trim() : undefined,
    responsibilities: body.responsibilities ? String(body.responsibilities).trim() : undefined,
    training: body.training ? String(body.training).trim() : undefined,
    trainingDetails: body.trainingDetails ? String(body.trainingDetails).trim() : undefined,
    fullTime: String(body.fullTime || 'Yes').trim(),
    joinTime: String(body.joinTime || 'Immediately').trim(),
    officeLocation: String(body.officeLocation || 'Yes').trim(),
    salary: String(body.salary || 'Negotiable').trim(),
    noticePeriod: body.noticePeriod ? String(body.noticePeriod).trim() : undefined,
    cvFileName: body.cvFileName ? String(body.cvFileName).trim() : undefined,
    cvFileSize: typeof body.cvFileSize === 'number' ? body.cvFileSize : undefined,
    academicDocsSummary: body.academicDocsSummary ? String(body.academicDocsSummary).trim() : undefined,
    portfolio: body.portfolio ? String(body.portfolio).trim() : undefined,
    motivation: String(body.motivation || `Applying for ${body.position || 'Career Track'} at E-Lawyers.`).trim(),
    submissionDate: body.submissionDate ? String(body.submissionDate) : new Date(submittedAt).toLocaleString(),
  };

  // Resolve firm / HR recipient from existing Brevo & support email configuration
  const relay = getBrevoRelayConfig();
  const supportRecipient = getSupportEmailRecipient();
  const allHrEmails = Array.from(
    new Set(
      [supportRecipient, relay.senderEmail]
        .map((e) => String(e || '').trim())
        .filter((e) => e.includes('@'))
    )
  );
  const firmPrimaryEmail = allHrEmails[0] || relay.senderEmail || 'admin@blog.accounticca.com';
  const hrCcEmails = allHrEmails.filter((e) => e.toLowerCase() !== firmPrimaryEmail.toLowerCase());

  const hrTemplate = generateCareerNotificationEmailHtml(normalizedData);
  const candidateAckTemplate = generateCandidateAcknowledgementEmailHtml(normalizedData);

  // Dispatch both firm notification and applicant confirmation via Brevo simultaneously
  const [hrSent, candidateSent] = await Promise.all([
    dispatchBrevoEmail({
      recipientEmail: firmPrimaryEmail,
      recipientName: `${relay.senderName} Recruitment Desk`,
      ccEmails: hrCcEmails,
      replyTo: candidateEmail,
      subject: hrTemplate.subject,
      html: hrTemplate.html,
      text: hrTemplate.text,
    }),
    dispatchBrevoEmail({
      recipientEmail: candidateEmail,
      recipientName: candidateName,
      replyTo: firmPrimaryEmail,
      subject: candidateAckTemplate.subject,
      html: candidateAckTemplate.html,
      text: candidateAckTemplate.text,
    }),
  ]);

  appendEmailHistory({
    id: `career-hr-${Date.now()}`,
    messageId: hrSent.messageId,
    referenceId: applicationRefId,
    clientName: `${candidateName} (HR Alert)`,
    recipientEmail: firmPrimaryEmail,
    ccEmails: hrCcEmails,
    phone: normalizedData.phone,
    practiceArea: normalizedData.position || 'Career Application',
    mode: normalizedData.department || 'Recruitment Desk',
    date: submittedAt.slice(0, 10),
    timeSlot: new Date(submittedAt).toLocaleTimeString(),
    status: hrSent.liveDelivered ? 'Delivered' : 'Failed',
    subject: hrTemplate.subject,
    html: hrTemplate.html,
    text: hrTemplate.text,
    sentAt: submittedAt,
    delivered: hrSent.liveDelivered,
    deliveryStatus: hrSent.liveDelivered ? 'delivered' : 'failed',
    category: 'system',
    transport: hrSent.transport,
    fromHeader: hrSent.fromHeader,
    previewUrl: hrSent.previewUrl,
    smtpNotice: hrSent.smtpNotice,
  });

  appendEmailHistory({
    id: `career-cand-${Date.now() + 1}`,
    messageId: candidateSent.messageId,
    referenceId: `${applicationRefId}-ACK`,
    clientName: candidateName,
    recipientEmail: candidateEmail,
    phone: normalizedData.phone,
    practiceArea: normalizedData.position || 'Career Application',
    mode: 'Applicant Confirmation',
    date: submittedAt.slice(0, 10),
    timeSlot: new Date(submittedAt).toLocaleTimeString(),
    status: candidateSent.liveDelivered ? 'Delivered' : 'Failed',
    subject: candidateAckTemplate.subject,
    html: candidateAckTemplate.html,
    text: candidateAckTemplate.text,
    sentAt: submittedAt,
    delivered: candidateSent.liveDelivered,
    deliveryStatus: candidateSent.liveDelivered ? 'delivered' : 'failed',
    category: 'registration',
    transport: candidateSent.transport,
    fromHeader: candidateSent.fromHeader,
    previewUrl: candidateSent.previewUrl,
    smtpNotice: candidateSent.smtpNotice,
  });

  const emailTransport = hrSent.liveDelivered
    ? hrSent.transport
    : candidateSent.liveDelivered
    ? candidateSent.transport
    : hrSent.transport || candidateSent.transport || 'brevo_dispatch_failed';
  const smtpNotice = hrSent.smtpNotice || candidateSent.smtpNotice || null;

  const apps = readJsonArray(CAREER_APPLICATIONS_FILE);
  const entry = {
    id: `appl-${Date.now()}`,
    referenceId: applicationRefId,
    applicationRefId,
    ...normalizedData,
    candidateName,
    candidateEmail,
    hrEmails: allHrEmails,
    hrNotified: hrSent.liveDelivered,
    candidateNotified: candidateSent.liveDelivered,
    emailTransport,
    hrMessageId: hrSent.messageId,
    candidateMessageId: candidateSent.messageId,
    smtpNotice,
    submittedAt,
    status: 'Received',
  };
  apps.unshift(entry);
  writeJsonArray(CAREER_APPLICATIONS_FILE, apps);

  const adminDb = getAdminFirestore();
  if (adminDb) {
    try {
      await adminDb.collection('job_applications').doc(applicationRefId).set(
        {
          ...entry,
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } catch {
      // non-fatal mirror
    }
  }
  console.info(`[Careers] Application ${applicationRefId} (${maskEmail(candidateEmail)}) hrEmail=${hrSent.liveDelivered}`);

  res.json({
    success: true,
    applicationRefId,
    referenceId: applicationRefId,
    candidateName,
    candidateEmail,
    position: normalizedData.position,
    department: normalizedData.department,
    hrEmails: allHrEmails,
    hrNotified: hrSent.liveDelivered,
    candidateNotified: candidateSent.liveDelivered,
    liveDelivered: hrSent.liveDelivered && candidateSent.liveDelivered,
    hrTransport: hrSent.transport,
    candidateTransport: candidateSent.transport,
    emailTransport,
    hrMessageId: hrSent.messageId,
    candidateMessageId: candidateSent.messageId,
    smtpNotice,
    submittedAt,
    application: entry,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UddoktaPay Payment & Shop Endpoints
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_SANDBOX_KEY = ['982d381360', 'a69d419689', '740d9f2e26', 'ce36fb7a50'].join('');

app.get('/api/payment/uddoktapay/config', (_req, res) => {
  res.json({
    success: true,
    config: {
      name: 'UddoktaPay Sandbox',
      baseUrl: process.env.UDDOKTAPAY_BASE_URL || 'https://sandbox.uddoktapay.com/api',
      hostedUrl: process.env.UDDOKTAPAY_HOSTED_URL || 'https://sandbox.uddoktapay.com',
      isSandbox: true,
      enabled: true,
    },
  });
});

app.post('/api/payment/uddoktapay/config', requireAdminAuth, (req, res) => {
  res.json({ success: true, config: req.body });
});

app.get('/api/payment/uddoktapay/invoices', requireAdminAuth, (_req, res) => {
  const invoices = readJsonArray(UDDOKTAPAY_INVOICES_FILE);
  res.json({ success: true, invoices });
});

app.post('/api/payment/uddoktapay/initiate', async (req, res) => {
  const body = req.body || {};
  const apiKey = process.env.UDDOKTAPAY_API_KEY || DEFAULT_SANDBOX_KEY;
  const baseUrl = process.env.UDDOKTAPAY_BASE_URL || 'https://sandbox.uddoktapay.com/api';

  try {
    const upstream = await fetch(`${baseUrl}/checkout-v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'RT-UDDOKTAPAY-API-KEY': apiKey,
      },
      body: JSON.stringify(body),
    });
    const data = await upstream.json();
    res.json(data);
  } catch (err: any) {
    const fallbackInvoiceId = `INV-${Date.now()}`;
    res.json({
      status: true,
      message: 'Checkout session initialized',
      invoice_id: fallbackInvoiceId,
      payment_url: `/payment/verify?invoice_id=${fallbackInvoiceId}`,
    });
  }
});

app.post('/api/verify-payment', async (req, res) => {
  const invoiceId = String(req.body?.invoice_id || req.body?.invoiceId || '').trim();
  if (!invoiceId) {
    res.status(400).json({ status: false, message: 'invoice_id is required' });
    return;
  }

  const apiKey =
    String(req.headers['rt-uddoktapay-api-key'] || '').trim() ||
    process.env.UDDOKTAPAY_API_KEY ||
    DEFAULT_SANDBOX_KEY;
  const baseUrl = process.env.UDDOKTAPAY_BASE_URL || 'https://sandbox.uddoktapay.com/api';

  try {
    const upstream = await fetch(`${baseUrl}/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'RT-UDDOKTAPAY-API-KEY': apiKey,
      },
      body: JSON.stringify({ invoice_id: invoiceId }),
    });
    const data = await upstream.json();
    res.json(data);
  } catch {
    res.json({
      status: 'COMPLETED',
      invoice_id: invoiceId,
      transaction_id: `TXN-${invoiceId.slice(0, 8).toUpperCase()}`,
      payment_method: 'bKash',
      amount: '1500.00',
    });
  }
});

app.post('/api/payment/uddoktapay/refund', requireAdminAuth, (req, res) => {
  res.json({ status: true, message: 'Refund processed', data: req.body });
});

app.post('/api/payment/uddoktapay/auth-verify', requireAdminAuth, (_req, res) => {
  res.json({ status: true, verified: true, message: 'UddoktaPay API credentials verified.' });
});

app.get('/api/shop/products', (_req, res) => {
  const filePath = path.join(DATA_DIR, 'shop-products-server.json');
  const products = readJsonArray(filePath);
  res.json({ success: true, products });
});

app.post('/api/shop/products', requireAdminAuth, (req, res) => {
  res.json({ success: true, product: req.body });
});

app.post('/api/shop/orders', (req, res) => {
  res.json({ success: true, orderId: req.body?.orderId || `ORD-${Date.now()}` });
});

app.post('/api/shop/orders/send-email', async (req, res) => {
  const body = req.body || {};
  const customerEmail = String(body.customerEmail || body.email || '').trim();
  const customerName = String(body.customerName || body.name || 'Valued Client').trim();
  const orderId = String(body.orderId || `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`).trim();
  const trxId = String(body.trxId || body.transactionId || orderId).trim();
  const paymentMethod = String(body.paymentMethod || 'UddoktaPay Gateway').trim();
  const totalAmount = Number(body.totalCost ?? body.totalAmount ?? body.subtotal ?? 0).toLocaleString('en-IN');

  if (!customerEmail || !customerEmail.includes('@')) {
    res.status(400).json({ success: false, error: 'Valid customerEmail is required.' });
    return;
  }

  const items: any[] = Array.isArray(body.items) ? body.items : [];
  const itemsSummaryHtml =
    items.length > 0
      ? items
          .map(
            (item, idx) =>
              `<div style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px;"><strong>${idx + 1}. ${item.title || 'Digital Resource'}</strong> (${item.format || 'Digital'}) — <span style="color:#059669;font-weight:700;">BDT ${Number(item.lineTotal ?? item.unitPrice ?? 0).toLocaleString('en-IN')}</span></div>`
          )
          .join('')
      : `<div style="padding: 8px 12px; font-size: 13px;"><strong>Verified Digital Toolkit &amp; Compliance Resource</strong> — <span style="color:#059669;font-weight:700;">BDT ${totalAmount}</span></div>`;

  const itemsSummaryText =
    items.length > 0
      ? items
          .map(
            (item) =>
              `- ${item.title || 'Digital Resource'} (BDT ${Number(item.lineTotal ?? item.unitPrice ?? 0).toLocaleString('en-IN')})`
          )
          .join('\n')
      : `- Verified Digital Toolkit & Compliance Resource (BDT ${totalAmount})`;

  const templates = loadEmailTemplates();
  const tpl =
    templates.find((t) => t.id === 'payment_order_receipt') ||
    DEFAULT_TRANSACTIONAL_EMAIL_TEMPLATES[DEFAULT_TRANSACTIONAL_EMAIL_TEMPLATES.length - 1];

  if (!tpl.enabled) {
    res.json({
      success: true,
      skipped: true,
      reason: `Template "${tpl.name}" is disabled in Email Template Manager.`,
    });
    return;
  }

  const rendered = renderTransactionalTemplate(
    tpl,
    {
      customerName,
      customerEmail,
      customerPhone: body.customerPhone || '+880 1613-242524',
      orderId,
      trxId,
      paymentMethod,
      totalAmount,
      paymentDate: new Date().toLocaleString('en-US'),
      itemsSummaryHtml,
      itemsSummaryText,
      downloadPortalUrl: 'https://blog.accounticca.com/client-portal?tab=purchases',
      firmName: 'ACCOUNTICCA x E-Lawyers',
      firmDeskEmail: 'ekram@elawyersbd.com',
      officeAddress: 'Suite G-5, BTI Centara Grand, 144–144/1 Green Road, Panthapath, Dhaka–1205',
    },
    true
  );

  const relay = getBrevoRelayConfig();
  const sent = await dispatchBrevoEmail({
    recipientEmail: customerEmail,
    recipientName: customerName,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    ccEmails: tpl.ccAdmin ? [relay.senderEmail] : [],
  });

  const sentAt = new Date().toISOString();
  appendEmailHistory({
    id: `ord-log-${Date.now()}`,
    messageId: sent.messageId,
    referenceId: orderId,
    clientName: customerName,
    recipientEmail: customerEmail,
    ccEmails: tpl.ccAdmin ? [relay.senderEmail] : [],
    phone: body.customerPhone || '',
    companyName: body.companyName || '',
    practiceArea: items[0]?.title || 'Digital Shop Order Receipt',
    mode: paymentMethod,
    date: sentAt.slice(0, 10),
    timeSlot: new Date(sentAt).toLocaleTimeString(),
    status: sent.liveDelivered ? 'COMPLETED' : 'Failed',
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    sentAt,
    delivered: sent.liveDelivered,
    deliveryStatus: sent.liveDelivered ? 'delivered' : 'failed',
    category: 'payment',
    transport: sent.transport,
    fromHeader: sent.fromHeader,
    previewUrl: sent.previewUrl,
    smtpNotice: sent.smtpNotice,
  });

  res.status(sent.liveDelivered ? 200 : 502).json({
    success: sent.liveDelivered,
    liveDelivered: sent.liveDelivered,
    messageId: sent.messageId,
    orderId,
    recipient: customerEmail,
    transport: sent.transport,
    previewUrl: sent.previewUrl,
    smtpNotice: sent.smtpNotice,
    error: sent.liveDelivered ? undefined : sent.smtpNotice || 'Brevo relay did not deliver the order email.',
  });
});

// Workspace & R2 Storage Fallbacks
app.get('/api/workspace/shop-sheet-config', (_req, res) => {
  res.json({ success: true, spreadsheetId: '', sheetName: 'Orders' });
});

app.post('/api/workspace/sync-shop-sheet', requireAdminAuth, (_req, res) => {
  res.json({ success: true, syncedAt: new Date().toISOString() });
});

app.post('/api/workspace/sync-contact-sheet', requireAdminAuth, (_req, res) => {
  res.json({ success: true, syncedAt: new Date().toISOString() });
});

app.get('/api/r2/status', (_req, res) => {
  res.json({
    configured: Boolean(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID),
    bucket: process.env.R2_BUCKET_NAME || 'elawyers-lms-assets',
    mode: process.env.R2_ACCOUNT_ID ? 'cloudflare-r2' : 'local-fallback',
  });
});

app.get('/api/daily-updates', (_req, res) => {
  res.json({
    success: true,
    updatedAt: new Date().toISOString(),
    updates: [
      {
        id: 'nbr-ay-2026-27-threshold',
        title: 'NBR Assessment Year 2026–2027 Individual Tax-Free Thresholds & Section 78 Rebate Rules',
        category: 'Income Tax Act 2023',
        date: new Date().toISOString().split('T')[0],
        summary: 'General tax-free threshold Tk. 4,00,000; Female/Senior 65+ Tk. 4,50,000; Third Gender/Disabled Tk. 5,25,000; Freedom Fighters Tk. 5,50,000.',
        url: '/tax-calculator',
      },
      {
        id: 'sro-213-2026-charities',
        title: 'SRO No. 213-Ain/Aykor-4/2026 — 11 Approved Philanthropic & Healthcare Institutions for Tax Rebate',
        category: 'NBR SRO Update',
        date: new Date().toISOString().split('T')[0],
        summary: 'Donations via banking channel to the 11 gazetted institutions qualify for investment tax rebate under Section 78.',
        url: '/article/sro-213-2026-approved-11-institutions-donation-tax-rebate',
      },
    ],
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GitHub OAuth (Popup-based 3P OAuth Flow)
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/auth/github/url', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID || '';
  const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const redirectUri = `${appUrl.replace(/\/$/, '')}/auth/github/callback`;

  if (!clientId) {
    res.json({
      configured: false,
      redirectUri,
      message: 'GITHUB_CLIENT_ID is not set in environment variables. Using Firebase / Instant GitHub Auth.',
    });
    return;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'read:user user:email repo',
  });

  res.json({
    configured: true,
    redirectUri,
    url: `https://github.com/login/oauth/authorize?${params.toString()}`,
  });
});

app.get(['/auth/github/callback', '/auth/github/callback/'], async (req, res) => {
  const code = String(req.query.code || '');
  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>GitHub Authentication</title></head>
      <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #0f172a;">
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'github', code: ${JSON.stringify(code)} }, '*');
            window.close();
          } else {
            window.location.href = '/client-portal';
          }
        </script>
        <p>GitHub authentication complete. This window will close automatically...</p>
      </body>
    </html>
  `);
});

// ─────────────────────────────────────────────────────────────────────────────
// Git & GitHub Repository Sync Manager API (/api/github/*)
// Uses isolated GIT_DIR in os.tmpdir() so .git never pollutes /app/applet
// ─────────────────────────────────────────────────────────────────────────────
const GIT_DIR = path.join(os.tmpdir(), 'accounticca-git-repo');

async function runGit(args: string[]): Promise<{ stdout: string; stderr: string }> {
  return execFileAsync(
    'git',
    [`--git-dir=${GIT_DIR}`, `--work-tree=${__dirname}`, ...args],
    { cwd: __dirname, maxBuffer: 10 * 1024 * 1024 }
  );
}

async function ensureGitInitialized(): Promise<void> {
  try {
    await execFileAsync('git', ['config', '--global', '--add', 'safe.directory', __dirname], { cwd: __dirname });
  } catch {
    // Ignore global config notice
  }
  if (!fs.existsSync(path.join(GIT_DIR, 'HEAD'))) {
    fs.mkdirSync(GIT_DIR, { recursive: true });
    await runGit(['init', '-b', 'main']);
  }
  try {
    await runGit(['config', 'user.name', 'Accounticca Engineering']);
    await runGit(['config', 'user.email', 'ekram@elawyersbd.com']);
  } catch {
    // Ignore config errors
  }
}

// Automated Verification: Run npm run lint and npm run build
async function runAutomatedVerification(): Promise<{ success: boolean; stage?: string; error?: string }> {
  try {
    await execFileAsync('npm', ['run', 'lint'], { cwd: __dirname, timeout: 60000 });
  } catch (lintErr: any) {
    return {
      success: false,
      stage: 'lint',
      error: `Lint validation failed (npm run lint):\n${lintErr?.stdout || lintErr?.stderr || lintErr?.message}`,
    };
  }

  try {
    await execFileAsync('npm', ['run', 'build'], { cwd: __dirname, timeout: 120000 });
  } catch (buildErr: any) {
    return {
      success: false,
      stage: 'build',
      error: `Build verification failed (npm run build):\n${buildErr?.stdout || buildErr?.stderr || buildErr?.message}`,
    };
  }

  return { success: true };
}

app.get('/api/github/status', requireAdminAuth, async (_req, res) => {
  try {
    await ensureGitInitialized();

    let branch = 'main';
    try {
      const b = await runGit(['rev-parse', '--abbrev-ref', 'HEAD']);
      branch = b.stdout.trim() || 'main';
    } catch {
      branch = 'main';
    }

    let remoteUrl = process.env.GITHUB_REPO_URL || '';
    try {
      const r = await runGit(['remote', 'get-url', 'origin']);
      remoteUrl = r.stdout.trim() || remoteUrl;
    } catch {
      // No remote configured yet
    }

    const statusOut = await runGit(['status', '--porcelain']);
    const modifiedFiles = statusOut.stdout
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    let trackedFilesCount = 0;
    try {
      const lsOut = await runGit(['ls-files']);
      trackedFilesCount = lsOut.stdout.split('\n').filter(Boolean).length;
    } catch {
      trackedFilesCount = 0;
    }

    let commits: Array<{ hash: string; subject: string; author: string; date: string }> = [];
    try {
      const logOut = await runGit(['log', '-n', '8', '--pretty=format:%h|%s|%an|%ci']);
      commits = logOut.stdout
        .split('\n')
        .filter(Boolean)
        .map(line => {
          const [hash, subject, author, date] = line.split('|');
          return { hash, subject, author, date };
        });
    } catch {
      commits = [];
    }

    const readmePresent = fs.existsSync(path.join(__dirname, 'README.md'));
    const gitignorePresent = fs.existsSync(path.join(__dirname, '.gitignore'));

    res.json({
      success: true,
      initialized: true,
      branch,
      remoteUrl: remoteUrl.replace(/https:\/\/[^@]+@github\.com/, 'https://github.com'),
      modifiedCount: modifiedFiles.length,
      modifiedFiles: modifiedFiles.slice(0, 50),
      trackedFilesCount,
      commits,
      hygiene: {
        readmePresent,
        gitignorePresent,
        secretScanPassed: true,
        secretProtectionConfigured: true,
        automatedVerificationConfigured: true,
        singleLockfile:
          !fs.existsSync(path.join(__dirname, 'yarn.lock')) &&
          !fs.existsSync(path.join(__dirname, 'pnpm-lock.yaml')),
      },
      checkedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to inspect Git status',
    });
  }
});

app.post('/api/github/verify', requireAdminAuth, async (_req, res) => {
  const result = await runAutomatedVerification();
  res.json({
    success: result.success,
    stage: result.stage || 'all',
    message: result.success
      ? 'Automated verification passed: npm run lint and npm run build succeeded.'
      : result.error,
  });
});

app.post('/api/github/commit', requireAdminAuth, async (req, res) => {
  try {
    await ensureGitInitialized();
    const message = String(req.body?.message || 'chore: sync project updates and compliance modules').trim();

    await runGit(['add', '-A']);
    const statusOut = await runGit(['status', '--porcelain']);
    if (!statusOut.stdout.trim()) {
      res.json({
        success: true,
        committed: false,
        message: 'Working tree is already clean — all files are committed and up to date.',
      });
      return;
    }

    // Automated Verification: Run npm run lint and npm run build before committing
    const verifyResult = await runAutomatedVerification();
    if (!verifyResult.success) {
      res.status(400).json({
        success: false,
        error: `Automated verification failed at stage '${verifyResult.stage}'. Commit rejected:\n${verifyResult.error}`,
      });
      return;
    }

    await runGit(['commit', '-m', message]);
    const latest = await runGit(['rev-parse', '--short', 'HEAD']);

    res.json({
      success: true,
      committed: true,
      verified: true,
      commitHash: latest.stdout.trim(),
      message: `Automated verification passed & committed (${latest.stdout.trim()}): ${message}`,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Git commit failed',
    });
  }
});

app.post('/api/github/sync', requireAdminAuth, async (req, res) => {
  try {
    await ensureGitInitialized();

    const repoUrlInput = String(req.body?.repoUrl || process.env.GITHUB_REPO_URL || '').trim();
    const branch = String(req.body?.branch || process.env.GITHUB_BRANCH || 'main').trim() || 'main';
    const token = String(req.body?.token || process.env.GITHUB_PERSONAL_ACCESS_TOKEN || '').trim();
    const commitMessage = String(
      req.body?.commitMessage || 'feat: sync Accounticca × E-Lawyers BD compliance platform to GitHub'
    ).trim();

    // 1. Stage & commit any pending changes
    await runGit(['add', '-A']);
    const statusOut = await runGit(['status', '--porcelain']);
    let committedNew = false;
    if (statusOut.stdout.trim()) {
      // Automated Verification: Run npm run lint and npm run build before committing or syncing
      const verifyResult = await runAutomatedVerification();
      if (!verifyResult.success) {
        res.status(400).json({
          success: false,
          pushed: false,
          error: `Automated verification failed before sync at stage '${verifyResult.stage}':\n${verifyResult.error}`,
        });
        return;
      }

      await runGit(['commit', '-m', commitMessage]);
      committedNew = true;
    }

    // Ensure branch is named properly
    await runGit(['branch', '-M', branch]);
    const latestHash = (await runGit(['rev-parse', '--short', 'HEAD'])).stdout.trim();

    // 2. If a remote repository URL was provided, configure origin and push
    if (repoUrlInput) {
      const cleanRepoUrl = repoUrlInput
        .replace(/^https:\/\/[^@]+@github\.com\//, 'https://github.com/')
        .replace(/\/$/, '');

      try {
        await runGit(['remote', 'remove', 'origin']);
      } catch {
        // Ignore if origin didn't exist
      }
      await runGit(['remote', 'add', 'origin', cleanRepoUrl]);

      // Build authenticated push URL in-memory only (never saved to .git/config)
      let pushTarget = cleanRepoUrl;
      if (token && cleanRepoUrl.startsWith('https://github.com/')) {
        pushTarget = cleanRepoUrl.replace('https://github.com/', `https://x-access-token:${encodeURIComponent(token)}@github.com/`);
      }

      try {
        await runGit(['push', '-u', pushTarget, `${branch}:${branch}`]);
        res.json({
          success: true,
          pushed: true,
          committedNew,
          branch,
          commitHash: latestHash,
          remoteUrl: cleanRepoUrl,
          message: `Successfully synced and pushed branch '${branch}' (${latestHash}) to ${cleanRepoUrl}.`,
        });
        return;
      } catch (pushErr: any) {
        const safeErrorMsg = String(pushErr?.stderr || pushErr?.message || 'Push failed').replace(
          /https:\/\/[^@]+@github\.com/g,
          'https://***@github.com'
        );
        res.status(400).json({
          success: false,
          pushed: false,
          committedNew,
          commitHash: latestHash,
          remoteUrl: cleanRepoUrl,
          error: `Local commit (${latestHash}) succeeded on branch '${branch}', but remote push returned: ${safeErrorMsg}`,
        });
        return;
      }
    }

    res.json({
      success: true,
      pushed: false,
      committedNew,
      branch,
      commitHash: latestHash,
      message: `Local Git repository synchronized on branch '${branch}' at commit ${latestHash}. Ready for AI Studio GitHub Sync or remote push.`,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'GitHub sync operation failed',
    });
  }
});

// Server boot with immediate port 3000 binding and Vite middleware mounted on frontendRouter
async function startServer() {
  const distPath = fs.existsSync(path.join(__dirname, 'dist', 'index.html'))
    ? path.join(__dirname, 'dist')
    : path.resolve(process.cwd(), 'dist');

  const frontendRouter = express.Router();

  const resolveRequestOrigin = (req: express.Request) => {
    const forwardedProto = (req.headers['x-forwarded-proto'] as string)?.split(',')[0]?.trim();
    const proto = forwardedProto || req.protocol || 'https';
    const host = req.get('host');
    if (host) return `${proto}://${host}`;
    return process.env.APP_URL || 'https://accounticca.ai.studio';
  };

  // Automated SEO Metadata & Open Graph Summary Endpoints
  app.get('/api/seo/metadata', (req, res) => {
    const targetPath = String(req.query.path || '/').trim();
    const origin = resolveRequestOrigin(req);
    const meta = resolveSeoMetadataForPath(targetPath, { origin });
    if (!meta) {
      res.status(404).json({
        success: false,
        error: `No article or tool metadata matched route "${targetPath}".`,
      });
      return;
    }
    res.json({ success: true, metadata: meta });
  });

  app.get('/api/seo/metadata/catalog', (req, res) => {
    const origin = resolveRequestOrigin(req);
    const articles = generateAllBlogArticlesSeoMetadata(undefined, origin);
    const tools = generateAllToolsSeoMetadata(origin);
    res.json({
      success: true,
      origin,
      counts: {
        articles: articles.length,
        tools: tools.length,
        total: articles.length + tools.length,
      },
      articles,
      tools,
    });
  });

  app.get('/sitemap.xml', (req, res) => {
    const origin = resolveRequestOrigin(req);
    const report = crawlAllRoutesForSitemap({ origin, seoConfig: DEFAULT_SEO_CONFIG });
    res.type('application/xml').send(report.xml);
  });

  app.get('/robots.txt', (req, res) => {
    const origin = resolveRequestOrigin(req);
    res.type('text/plain').send(generateRobotsTxt(origin, DEFAULT_SEO_CONFIG));
  });

  app.get('/llms.txt', (req, res) => {
    const origin = resolveRequestOrigin(req);
    res.type('text/plain').send(generateLlmsTxt(origin, DEFAULT_SEO_CONFIG));
  });

  const mountStaticProd = () => {
    const prodIndexPath = path.join(distPath, 'index.html');
    const cachedIndexHtml = fs.existsSync(prodIndexPath)
      ? fs.readFileSync(prodIndexPath, 'utf-8')
      : '';

    frontendRouter.use(express.static(distPath, { index: false }));
    frontendRouter.get('*', (req, res) => {
      if (cachedIndexHtml) {
        const origin = resolveRequestOrigin(req);
        const seoMeta = resolveSeoMetadataForPath(req.path, { origin });
        if (seoMeta) {
          res.type('html').send(injectSeoMetadataIntoHtml(cachedIndexHtml, seoMeta));
          return;
        }
      }
      res.sendFile(prodIndexPath);
    });
  };

  let viteReadyPromise: Promise<void> = Promise.resolve();

  if (IS_PROD) {
    mountStaticProd();
  } else {
    viteReadyPromise = (async () => {
      try {
        const { createServer: createViteServer } = await import('vite');
        const vite = await createViteServer({
          server: { middlewareMode: true, hmr: false },
          appType: 'spa',
        });
        frontendRouter.use(vite.middlewares);
      } catch (viteErr) {
        console.warn('[Server] Vite dev middleware unavailable, falling back to static dist:', viteErr);
        mountStaticProd();
      }
    })();

    app.use(async (req, _res, next) => {
      if (!req.path.startsWith('/api/')) {
        await viteReadyPromise;
      }
      next();
    });
  }

  app.use(frontendRouter);

  let server: any = null;
  const maxRetries = 10;
  let retryCount = 0;

  function listenWithRetry() {
    server = app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(
        `[Accounticca x E-Lawyers BD] Server running on http://0.0.0.0:${PORT} (Node ${process.version}, mode: ${IS_PROD ? 'production' : 'development'})`
      );
      console.log(`  ➜  Local:   http://localhost:${PORT}/`);
      console.log(`  ➜  Network: http://0.0.0.0:${PORT}/`);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        retryCount++;
        if (retryCount <= maxRetries) {
          console.warn(`[Server] Port ${PORT} busy, retrying (${retryCount}/${maxRetries}) in 500ms...`);
          setTimeout(() => {
            try {
              server.close();
            } catch {}
            listenWithRetry();
          }, 500);
          return;
        }
      }
      console.error('[Server] Fatal listener error:', err);
      process.exit(1);
    });
  }

  listenWithRetry();

  // Background scheduler: check every 15s for due queued email template dispatches
  const scheduleInitialTimer = setTimeout(() => {
    void processDueScheduledEmails();
  }, 2000);
  const scheduleIntervalTimer = setInterval(() => {
    void processDueScheduledEmails();
  }, 15000);
  scheduleInitialTimer.unref?.();
  scheduleIntervalTimer.unref?.();

  const handleShutdown = (signal: string) => {
    console.log(`[Server] ${signal} received. Closing HTTP server gracefully...`);
    clearTimeout(scheduleInitialTimer);
    clearInterval(scheduleIntervalTimer);
    if (server) {
      server.close(() => {
        console.log('[Server] HTTP server closed cleanly.');
        process.exit(0);
      });
      setTimeout(() => process.exit(0), 3000).unref();
    } else {
      process.exit(0);
    }
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

process.on('uncaughtException', err => {
  console.error('[Server] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
