import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import type express from 'express';
import { getAdminFirestore, verifyFirebaseIdToken } from './firebaseAdmin';
import { maskEmail, resolveClientIp } from './securityMiddleware';

export interface AdminUserProfile {
  email: string;
  role: 'admin';
  name: string;
  title: string;
  authMethod?: 'password' | 'firebase_oauth';
}

export interface VerifiedAdminSession {
  user: AdminUserProfile;
  jti: string;
  iat: number;
  exp: number;
}

const DEFAULT_ADMIN_ALLOWLIST = [
  'hmekram@gmail.com',
  'ekram.elawyersbd@gmail.com',
  'ekram@elawyersbd.com',
  'admin@erpforu.com',
  'superadmin@erpforu.com',
];

const DATA_DIR = path.join(os.tmpdir(), 'accounticca-runtime-data');
const REVOCATION_FILE = path.join(DATA_DIR, 'admin-session-revocations.json');
const SESSION_SECRET_FILE = path.join(DATA_DIR, 'admin-session-secret.key');

interface RevocationState {
  revokedJtis: Record<string, number>;
  revokedAllBeforeByEmail: Record<string, number>;
}

function loadOrCreatePersistentFallbackSecret(): string {
  try {
    if (fs.existsSync(SESSION_SECRET_FILE)) {
      const existing = fs.readFileSync(SESSION_SECRET_FILE, 'utf8').trim();
      if (existing.length >= 32) {
        return existing;
      }
    }
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const generated = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(SESSION_SECRET_FILE, generated, { encoding: 'utf8', mode: 0o600 });
    return generated;
  } catch {
    return crypto.randomBytes(32).toString('hex');
  }
}

const BOOT_FALLBACK_SESSION_SECRET = loadOrCreatePersistentFallbackSecret();
let warnedMissingSecret = false;

function getSessionSecret(): string {
  const configured = (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.JWT_SECRET ||
    ''
  ).trim();
  if (configured.length >= 16) {
    return configured;
  }
  if (!warnedMissingSecret) {
    warnedMissingSecret = true;
    console.warn(
      '[AdminAuth] ADMIN_SESSION_SECRET is unset; using a persistent local fallback secret in runtime tmpdir.'
    );
  }
  return BOOT_FALLBACK_SESSION_SECRET;
}

export function getAuthorizedAdminEmails(): Set<string> {
  const fromEnv = (
    process.env.ADMIN_ALLOWED_EMAILS ||
    process.env.ADMIN_EMAILS ||
    process.env.AUTHORIZED_ADMIN_EMAILS ||
    ''
  )
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes('@'));

  if (fromEnv.length > 0) {
    return new Set(fromEnv);
  }
  return new Set(DEFAULT_ADMIN_ALLOWLIST);
}

export function isAuthorizedAdminEmail(email: string): boolean {
  const normalized = (email || '').trim().toLowerCase();
  if (!normalized) return false;
  return getAuthorizedAdminEmails().has(normalized);
}

export function hashAdminPassword(plainPassword: string, saltHex?: string): string {
  const salt = saltHex || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(plainPassword, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt}$${derived.toString('hex')}`;
}

export function verifyAdminPasswordHash(plainPassword: string, storedHash: string): boolean {
  const parts = String(storedHash || '').trim().split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') {
    return false;
  }
  const [, salt, hexDigest] = parts;
  if (!salt || !hexDigest) return false;
  try {
    const expected = Buffer.from(hexDigest, 'hex');
    const actual = crypto.scryptSync(plainPassword, salt, expected.length, { N: 16384, r: 8, p: 1 });
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Revocation Store (OS temp file + optional Firestore mirror)
// ─────────────────────────────────────────────────────────────────────────────
function readRevocations(): RevocationState {
  try {
    if (fs.existsSync(REVOCATION_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(REVOCATION_FILE, 'utf8'));
      return {
        revokedJtis: parsed?.revokedJtis && typeof parsed.revokedJtis === 'object' ? parsed.revokedJtis : {},
        revokedAllBeforeByEmail:
          parsed?.revokedAllBeforeByEmail && typeof parsed.revokedAllBeforeByEmail === 'object'
            ? parsed.revokedAllBeforeByEmail
            : {},
      };
    }
  } catch {
    // ignore read notice
  }
  return { revokedJtis: {}, revokedAllBeforeByEmail: {} };
}

function writeRevocations(state: RevocationState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const now = Date.now();
    const cleanedJtis: Record<string, number> = {};
    for (const [jti, expMs] of Object.entries(state.revokedJtis)) {
      if (typeof expMs === 'number' && expMs > now) {
        cleanedJtis[jti] = expMs;
      }
    }
    fs.writeFileSync(
      REVOCATION_FILE,
      JSON.stringify(
        {
          revokedJtis: cleanedJtis,
          revokedAllBeforeByEmail: state.revokedAllBeforeByEmail,
        },
        null,
        2
      ),
      'utf8'
    );
  } catch {
    // non-fatal on read-only fs
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Brute-Force Failed Login Tracker
// ─────────────────────────────────────────────────────────────────────────────
const failedLoginTracker = new Map<string, { count: number; lockedUntil: number }>();

function checkLoginRateLimit(ip: string): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const entry = failedLoginTracker.get(ip);
  if (!entry) return { allowed: true };
  if (entry.lockedUntil > now) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.lockedUntil - now) / 1000) };
  }
  if (entry.lockedUntil && entry.lockedUntil <= now) {
    failedLoginTracker.delete(ip);
  }
  return { allowed: true };
}

function recordFailedLogin(ip: string): void {
  const entry = failedLoginTracker.get(ip) || { count: 0, lockedUntil: 0 };
  entry.count += 1;
  if (entry.count >= 5) {
    entry.lockedUntil = Date.now() + 15 * 60 * 1000;
  }
  failedLoginTracker.set(ip, entry);
}

function clearFailedLogin(ip: string): void {
  failedLoginTracker.delete(ip);
}

// ─────────────────────────────────────────────────────────────────────────────
// Signed Admin Token Issuance & Verification (HMAC-SHA256)
// ─────────────────────────────────────────────────────────────────────────────
const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export function issueAdminSessionToken(user: AdminUserProfile): {
  token: string;
  jti: string;
  expiresAt: string;
} {
  const iat = Date.now();
  const exp = iat + ADMIN_SESSION_TTL_MS;
  const jti = crypto.randomUUID();
  const payloadObj = {
    sub: user.email.toLowerCase(),
    role: 'admin',
    name: user.name,
    title: user.title,
    authMethod: user.authMethod || 'password',
    jti,
    iat,
    exp,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
  const sigB64 = crypto
    .createHmac('sha256', getSessionSecret())
    .update(payloadB64)
    .digest('base64url');

  return {
    token: `accadm.${payloadB64}.${sigB64}`,
    jti,
    expiresAt: new Date(exp).toISOString(),
  };
}

export function verifyAdminSessionToken(token: string): VerifiedAdminSession | null {
  const clean = (token || '').trim();
  if (!clean.startsWith('accadm.')) {
    return null;
  }
  const parts = clean.split('.');
  if (parts.length !== 3) {
    return null;
  }
  const [, payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return null;

  const expectedSig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(payloadB64)
    .digest('base64url');

  const sigBuf = Buffer.from(sigB64);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    const email = String(parsed?.sub || '').trim().toLowerCase();
    if (
      !email ||
      parsed.role !== 'admin' ||
      !isAuthorizedAdminEmail(email) ||
      typeof parsed.exp !== 'number' ||
      typeof parsed.iat !== 'number' ||
      typeof parsed.jti !== 'string' ||
      parsed.exp <= Date.now()
    ) {
      return null;
    }

    const revocations = readRevocations();
    if (revocations.revokedJtis[parsed.jti]) {
      return null;
    }
    const revokedAllBefore = revocations.revokedAllBeforeByEmail[email] || 0;
    if (parsed.iat <= revokedAllBefore) {
      return null;
    }

    return {
      user: {
        email,
        role: 'admin',
        name: String(parsed.name || 'Authorized Administrator'),
        title: String(parsed.title || 'Authorized Workspace, LMS & Shop Administrator'),
        authMethod: parsed.authMethod === 'firebase_oauth' ? 'firebase_oauth' : 'password',
      },
      jti: parsed.jti,
      iat: parsed.iat,
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}

export async function revokeAdminSessionToken(token: string): Promise<boolean> {
  const verified = verifyAdminSessionToken(token);
  if (!verified) return false;
  const state = readRevocations();
  state.revokedJtis[verified.jti] = verified.exp;
  writeRevocations(state);

  const db = getAdminFirestore();
  if (db) {
    try {
      await db.collection('admin_revoked_sessions').doc(verified.jti).set({
        email: verified.user.email,
        exp: verified.exp,
        revokedAt: new Date().toISOString(),
      });
    } catch {
      // non-fatal
    }
  }
  return true;
}

export async function revokeAllAdminSessionsForEmail(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const now = Date.now();
  const state = readRevocations();
  state.revokedAllBeforeByEmail[normalized] = now;
  writeRevocations(state);

  const db = getAdminFirestore();
  if (db) {
    try {
      await db.collection('admin_revocation_watermarks').doc(normalized).set({
        email: normalized,
        revokedBeforeMs: now,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      // non-fatal
    }
  }
}

export function extractBearerToken(req: express.Request): string {
  const explicitAdminHeader = String(req.headers['x-admin-token'] || '').trim();
  if (explicitAdminHeader) {
    return explicitAdminHeader;
  }
  const authHeader = String(req.headers.authorization || '');
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return '';
}

/**
 * Authenticates admin with email + password against `ADMIN_PASSWORD_HASH` (scrypt).
 * Never uses any hardcoded plaintext fallback password.
 */
export async function loginAdminWithPassword(
  emailRaw: string,
  passwordRaw: string,
  clientIp: string
): Promise<
  | { success: true; token: string; user: AdminUserProfile; expiresAt: string }
  | { success: false; status: number; error: string }
> {
  const limitCheck = checkLoginRateLimit(clientIp);
  if (!limitCheck.allowed) {
    return {
      success: false,
      status: 429,
      error: `Too many failed login attempts. Please retry in ${limitCheck.retryAfterSec} seconds.`,
    };
  }

  const email = String(emailRaw || '').trim().toLowerCase();
  const password = String(passwordRaw || '');

  const configuredHash = (process.env.ADMIN_PASSWORD_HASH || '').trim();
  const configuredEnvPassword = (process.env.ADMIN_PASSWORD || '').trim();
  if (!configuredHash && !configuredEnvPassword) {
    return {
      success: false,
      status: 503,
      error:
        'Password-based admin login is disabled until ADMIN_PASSWORD_HASH is configured on the server. Please sign in using verified Google OAuth with an authorized administrator account.',
    };
  }

  let passwordValid = false;
  if (configuredHash) {
    passwordValid = verifyAdminPasswordHash(password, configuredHash);
  } else if (configuredEnvPassword) {
    const a = Buffer.from(password, 'utf8');
    const b = Buffer.from(configuredEnvPassword, 'utf8');
    passwordValid = a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  if (!isAuthorizedAdminEmail(email) || !password || !passwordValid) {
    recordFailedLogin(clientIp);
    console.warn(`[AdminAuth] Failed password login attempt for ${maskEmail(email)} from IP ${clientIp}`);
    return {
      success: false,
      status: 401,
      error: 'Invalid administrator credentials.',
    };
  }

  clearFailedLogin(clientIp);
  const user: AdminUserProfile = {
    email,
    role: 'admin',
    name: process.env.ADMIN_DISPLAY_NAME || 'Adv. Ekram Hossain',
    title: 'Authorized Workspace, LMS & Shop Administrator',
    authMethod: 'password',
  };
  const issued = issueAdminSessionToken(user);
  return {
    success: true,
    token: issued.token,
    user,
    expiresAt: issued.expiresAt,
  };
}

/**
 * Issues a server-signed admin session ONLY after cryptographically verifying
 * a Firebase Auth ID token (`RS256` signed by Google) and checking emailVerified + admin allowlist.
 * Client-supplied email strings are NEVER trusted.
 */
export async function syncAdminFromVerifiedFirebaseToken(
  idToken: string
): Promise<
  | { success: true; token: string; user: AdminUserProfile; expiresAt: string }
  | { success: false; status: number; error: string }
> {
  const verified = await verifyFirebaseIdToken(idToken);
  if (!verified) {
    return {
      success: false,
      status: 401,
      error: 'Invalid or expired Firebase ID token. Server-side token verification failed.',
    };
  }

  if (!verified.emailVerified) {
    return {
      success: false,
      status: 403,
      error: 'Administrator Google/Firebase account email is not verified.',
    };
  }

  // Check allowlist or Firestore admins/{uid} / users/{uid}
  let isAdmin = isAuthorizedAdminEmail(verified.email);
  if (!isAdmin) {
    const db = getAdminFirestore();
    if (db) {
      try {
        const adminDoc = await db.collection('admins').doc(verified.uid).get();
        if (adminDoc.exists && adminDoc.data()?.active !== false) {
          isAdmin = true;
        }
      } catch {
        // ignore lookup notice
      }
    }
  }

  if (!isAdmin) {
    console.warn(`[AdminAuth] Unauthorized OAuth admin sync attempt by ${maskEmail(verified.email)}`);
    return {
      success: false,
      status: 403,
      error: 'This authenticated account is not an authorized administrator.',
    };
  }

  const user: AdminUserProfile = {
    email: verified.email,
    role: 'admin',
    name: verified.name || 'Authorized Administrator',
    title: 'Authorized Workspace, LMS & Shop Administrator',
    authMethod: 'firebase_oauth',
  };

  const issued = issueAdminSessionToken(user);
  return {
    success: true,
    token: issued.token,
    user,
    expiresAt: issued.expiresAt,
  };
}

/**
 * Express middleware that requires either:
 * 1) A valid HMAC-signed `accadm.*` admin session token (non-revoked), OR
 * 2) A valid Firebase Auth ID token for an authorized verified admin email.
 */
export async function requireAdminAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<void> {
  const bearer = extractBearerToken(req);
  if (!bearer) {
    res.status(401).json({
      success: false,
      error: 'Administrator authentication required.',
    });
    return;
  }

  const session = verifyAdminSessionToken(bearer);
  if (session) {
    (req as any).adminUser = session.user;
    (req as any).adminSession = session;
    next();
    return;
  }

  // Allow direct verified Firebase ID token if caller holds an active Firebase session
  if (bearer.split('.').length === 3 && !bearer.startsWith('accadm.')) {
    const oauthSync = await syncAdminFromVerifiedFirebaseToken(bearer);
    if (oauthSync.success) {
      (req as any).adminUser = oauthSync.user;
      next();
      return;
    }
  }

  res.status(401).json({
    success: false,
    error: 'Invalid, expired, or revoked administrator session.',
  });
}
