import crypto from 'crypto';
import type express from 'express';
import { z } from 'zod';

/**
 * Masks email addresses in server logs so PII is never leaked in stdout/stderr.
 */
export function maskEmail(email?: string | null): string {
  const raw = String(email || '').trim().toLowerCase();
  const atIdx = raw.indexOf('@');
  if (atIdx <= 0) return '[redacted-email]';
  const local = raw.slice(0, atIdx);
  const domain = raw.slice(atIdx + 1);
  const visible = local.length <= 2 ? local[0] || '*' : `${local.slice(0, 2)}***`;
  return `${visible}@${domain}`;
}

export function maskPhone(phone?: string | null): string {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '[no-phone]';
  if (digits.length <= 4) return '****';
  return `***${digits.slice(-4)}`;
}

export function sanitizePlainText(input: unknown, maxLength: number): string {
  return String(input ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

export function resolveClientIp(req: express.Request): string {
  const cfConnectingIp = req.headers['cf-connecting-ip'];
  if (typeof cfConnectingIp === 'string' && cfConnectingIp.trim()) {
    return cfConnectingIp.trim();
  }
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  return req.ip || 'unknown';
}

// ─────────────────────────────────────────────────────────────────────────────
// Sliding-Window Rate Limiter
// ─────────────────────────────────────────────────────────────────────────────
interface RateBucket {
  timestamps: number[];
  blockedUntil?: number;
}

const rateBuckets = new Map<string, RateBucket>();

export function rateLimit(options: {
  keyPrefix: string;
  windowMs: number;
  maxRequests: number;
  blockDurationMs?: number;
}): express.RequestHandler {
  return (req, res, next) => {
    const now = Date.now();
    const ip = resolveClientIp(req);
    const key = `${options.keyPrefix}:${ip}`;
    const bucket = rateBuckets.get(key) || { timestamps: [] };

    if (bucket.blockedUntil && bucket.blockedUntil > now) {
      const retrySec = Math.ceil((bucket.blockedUntil - now) / 1000);
      res.setHeader('Retry-After', String(retrySec));
      res.status(429).json({
        success: false,
        error: `Too many requests. Please wait ${retrySec} seconds before trying again.`,
      });
      return;
    }

    const cutoff = now - options.windowMs;
    bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff);

    if (bucket.timestamps.length >= options.maxRequests) {
      if (options.blockDurationMs) {
        bucket.blockedUntil = now + options.blockDurationMs;
      }
      rateBuckets.set(key, bucket);
      const retrySec = Math.max(1, Math.ceil((options.blockDurationMs || options.windowMs) / 1000));
      res.setHeader('Retry-After', String(retrySec));
      res.status(429).json({
        success: false,
        error: `Rate limit exceeded. Please retry after ${retrySec} seconds.`,
      });
      return;
    }

    bucket.timestamps.push(now);
    rateBuckets.set(key, bucket);

    if (rateBuckets.size > 5000) {
      for (const [k, b] of rateBuckets.entries()) {
        if (b.timestamps.every((t) => t <= cutoff) && (!b.blockedUntil || b.blockedUntil <= now)) {
          rateBuckets.delete(k);
        }
      }
    }

    next();
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Short-lived Duplicate Submission Guard (prevents accidental double clicks)
// ─────────────────────────────────────────────────────────────────────────────
const recentSubmissionFingerprints = new Map<string, { referenceId: string; expiresAt: number }>();

export function checkDuplicateSubmission(
  scope: string,
  parts: Array<string | undefined | null>,
  ttlMs: number = 45_000
): { isDuplicate: boolean; existingReferenceId?: string; fingerprint: string } {
  const now = Date.now();
  for (const [k, v] of recentSubmissionFingerprints.entries()) {
    if (v.expiresAt <= now) {
      recentSubmissionFingerprints.delete(k);
    }
  }

  const rawKey = `${scope}:${parts.map((p) => String(p || '').trim().toLowerCase()).join('|')}`;
  const fingerprint = crypto.createHash('sha256').update(rawKey).digest('hex');
  const existing = recentSubmissionFingerprints.get(fingerprint);

  if (existing && existing.expiresAt > now) {
    return {
      isDuplicate: true,
      existingReferenceId: existing.referenceId,
      fingerprint,
    };
  }

  return { isDuplicate: false, fingerprint };
}

export function recordSubmissionFingerprint(
  fingerprint: string,
  referenceId: string,
  ttlMs: number = 45_000
): void {
  recentSubmissionFingerprints.set(fingerprint, {
    referenceId,
    expiresAt: Date.now() + ttlMs,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Server-Side Turnstile + Short-Lived Verification Proof
// ─────────────────────────────────────────────────────────────────────────────
const PROCESS_PROOF_SECRET =
  (process.env.ADMIN_SESSION_SECRET || process.env.TURNSTILE_PROOF_SECRET || '').trim() ||
  crypto.randomBytes(32).toString('hex');

const redeemedProofIds = new Map<string, number>();

export function createTurnstileVerificationProof(action: string, ip: string): string {
  const jti = crypto.randomUUID();
  const exp = Date.now() + 5 * 60 * 1000;
  const payload = Buffer.from(
    JSON.stringify({
      jti,
      act: action || 'general',
      ipHash: crypto.createHash('sha256').update(ip || 'unknown').digest('hex').slice(0, 16),
      exp,
    })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', PROCESS_PROOF_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function consumeTurnstileVerificationProof(
  proof: string,
  expectedIp: string
): { valid: boolean; reason?: string } {
  const now = Date.now();
  for (const [k, exp] of redeemedProofIds.entries()) {
    if (exp <= now) redeemedProofIds.delete(k);
  }

  const parts = String(proof || '').trim().split('.');
  if (parts.length !== 2) {
    return { valid: false, reason: 'Malformed verification proof.' };
  }

  const [payloadB64, sigB64] = parts;
  const expectedSig = crypto
    .createHmac('sha256', PROCESS_PROOF_SECRET)
    .update(payloadB64)
    .digest('base64url');

  const sigBuf = Buffer.from(sigB64);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return { valid: false, reason: 'Invalid verification proof signature.' };
  }

  try {
    const parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!parsed?.jti || typeof parsed.exp !== 'number' || parsed.exp <= now) {
      return { valid: false, reason: 'Turnstile verification proof has expired.' };
    }
    if (redeemedProofIds.has(parsed.jti)) {
      return { valid: false, reason: 'Turnstile verification proof has already been used.' };
    }
    const expectedIpHash = crypto
      .createHash('sha256')
      .update(expectedIp || 'unknown')
      .digest('hex')
      .slice(0, 16);
    if (parsed.ipHash && parsed.ipHash !== expectedIpHash) {
      return { valid: false, reason: 'Verification proof client mismatch.' };
    }
    redeemedProofIds.set(parsed.jti, parsed.exp);
    return { valid: true };
  } catch {
    return { valid: false, reason: 'Unable to decode verification proof.' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Input Validation Schemas (Zod)
// ─────────────────────────────────────────────────────────────────────────────
const PHONE_REGEX = /^[+\d][\d\s\-().]{6,22}$/;

export const contactInquirySchema = z.object({
  referenceId: z.string().trim().max(80).optional(),
  firstName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().max(80).optional(),
  clientName: z.string().trim().min(2, 'Full name must be at least 2 characters.').max(120),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254)
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v), 'Please provide a valid email address.')
    .optional()
    .default(''),
  phone: z
    .string()
    .trim()
    .refine(
      (v) => !v || (PHONE_REGEX.test(v) && v.replace(/\D/g, '').length >= 8 && v.replace(/\D/g, '').length <= 16),
      'Please enter a valid phone number (8–16 digits).'
    )
    .optional()
    .default(''),
  companyName: z.string().trim().max(150).optional().default(''),
  serviceArea: z.string().trim().min(2).max(160).optional().default('General Advisory'),
  department: z.string().trim().max(120).optional().default('Accounticca Advisory'),
  division: z.string().trim().max(120).optional().default('Accounticca Advisory'),
  subject: z.string().trim().max(180).optional().default(''),
  messageOrNotes: z.string().trim().min(5, 'Please describe your inquiry (at least 5 characters).').max(5000),
  urgency: z.string().trim().max(80).optional().default('Standard Advisory (24–48h)'),
  source: z.string().trim().max(80).optional().default('website_contact_form'),
  requestType: z.string().trim().max(80).optional().default('Service Inquiry'),
  expertiseTopic: z.string().trim().max(180).optional().default('General Service Inquiry'),
  consultationMode: z.string().trim().max(120).optional().default('N/A (Written Inquiry)'),
  preferredDate: z.string().trim().max(64).optional().default('Immediate / Written'),
  preferredTimeSlot: z.string().trim().max(64).optional().default('N/A'),
  assignedPartner: z.string().trim().max(160).optional().default(''),
  idempotencyKey: z.string().trim().max(128).optional(),
});

export const newsletterSubscribeSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(5, 'Valid email address is required.')
    .max(254)
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid email address.'),
  name: z.string().trim().max(120).optional().nullable(),
  organization: z.string().trim().max(150).optional().nullable(),
  designation: z.string().trim().max(100).optional().default('other'),
  topics: z.array(z.string().trim().min(1).max(64)).max(12).optional().default(['tax_vat', 'corporate_rjsc']),
  frequency: z.enum(['weekly', 'urgent_alerts', 'both']).optional().default('both'),
  source: z.string().trim().max(64).optional().default('website'),
  sourceCategory: z.string().trim().max(64).optional(),
  sourceArticleId: z.string().trim().max(256).optional().nullable(),
  sourceArticleTitle: z.string().trim().max(512).optional().nullable(),
  consentAccepted: z.boolean().optional().default(true),
  userId: z.string().trim().max(128).optional().nullable(),
});

export const newsletterUnsubscribeSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(5, 'Valid email address is required.')
    .max(254)
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid email address.'),
  reason: z.string().trim().max(300).optional().default('user_requested'),
});

// ─────────────────────────────────────────────────────────────────────────────
// Signed One-Click Unsubscribe Link Helpers (HMAC-SHA256)
// ─────────────────────────────────────────────────────────────────────────────
export function createUnsubscribeSignature(email: string): string {
  const normalized = email.trim().toLowerCase();
  return crypto
    .createHmac('sha256', PROCESS_PROOF_SECRET)
    .update(`unsubscribe:${normalized}`)
    .digest('base64url');
}

export function verifyUnsubscribeSignature(email: string, sig: string): boolean {
  if (!email || !sig) return false;
  const expected = createUnsubscribeSignature(email);
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  return sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
}
