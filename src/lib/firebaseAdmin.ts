import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { initializeApp, cert, applicationDefault, getApps, type App } from 'firebase-admin/app';
import { getFirestore, FieldValue, type Firestore } from 'firebase-admin/firestore';

export const PRIMARY_FIREBASE_PROJECT_ID =
  (process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0361533735').trim();

export const LEGACY_FIREBASE_PROJECT_ID = 'gen-lang-client-0396222608';

export const CUSTOM_AUTH_FIREBASE_PROJECT_ID =
  (process.env.CUSTOM_AUTH_FIREBASE_PROJECT_ID || 'elawyersnew').trim();

export const BLOG_FIREBASE_PROJECT_ID =
  (process.env.BLOG_FIREBASE_PROJECT_ID || 'blogaccounticca').trim();

export const FIRESTORE_DATABASE_ID =
  (
    process.env.FIRESTORE_DATABASE_ID ||
    'ai-studio-accounticcainsig-89414606-29ba-4643-944b-e0ac41725d03'
  ).trim();

const GOOGLE_SECURE_TOKEN_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

let cachedAdminApp: App | null = null;
let cachedFirestoreDb: Firestore | null = null;
let cachedInitError: string | null = null;
let cachedCerts: { certs: Record<string, string>; expiresAt: number } | null = null;

function normalizeParsedServiceAccount(parsed: Record<string, any>): Record<string, any> | null {
  if (!parsed || typeof parsed !== 'object') return null;
  if (typeof parsed.private_key === 'string') {
    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  }
  if (!parsed.client_email || !parsed.private_key) {
    return null;
  }
  return parsed;
}

function parseServiceAccountFromEnv(): Record<string, any> | null {
  let rawJson = (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '').trim();
  if (
    rawJson.length >= 2 &&
    ((rawJson.startsWith("'") && rawJson.endsWith("'")) ||
      (rawJson.startsWith('"') && rawJson.endsWith('"')))
  ) {
    rawJson = rawJson.slice(1, -1).trim();
  }

  if (rawJson) {
    try {
      if (rawJson.startsWith('{')) {
        const parsed = normalizeParsedServiceAccount(JSON.parse(rawJson));
        if (parsed) return parsed;
        cachedInitError = 'FIREBASE_SERVICE_ACCOUNT_JSON is missing client_email or private_key';
        return null;
      }
      const decoded = Buffer.from(rawJson, 'base64').toString('utf8').trim();
      if (decoded.startsWith('{')) {
        const parsed = normalizeParsedServiceAccount(JSON.parse(decoded));
        if (parsed) return parsed;
        cachedInitError = 'Decoded FIREBASE_SERVICE_ACCOUNT_JSON is missing client_email or private_key';
        return null;
      }
      cachedInitError = 'Invalid FIREBASE_SERVICE_ACCOUNT_JSON format: expected JSON object or base64-encoded JSON';
      return null;
    } catch (err: any) {
      cachedInitError = `Invalid FIREBASE_SERVICE_ACCOUNT_JSON format: ${err?.message || 'parse error'}`;
      return null;
    }
  }

  const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || '').trim();
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').trim();
  if (clientEmail && privateKey) {
    return normalizeParsedServiceAccount({
      type: 'service_account',
      project_id: PRIMARY_FIREBASE_PROJECT_ID,
      client_email: clientEmail,
      private_key: privateKey,
    });
  }

  const keyPath = (
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    ''
  ).trim();

  if (keyPath) {
    const resolved = path.isAbsolute(keyPath) ? keyPath : path.resolve(process.cwd(), keyPath);
    if (fs.existsSync(resolved)) {
      try {
        const parsed = normalizeParsedServiceAccount(JSON.parse(fs.readFileSync(resolved, 'utf8')));
        if (parsed) return parsed;
        cachedInitError = 'Service account file is missing client_email or private_key';
        return null;
      } catch (err: any) {
        cachedInitError = `Failed reading service account file: ${err?.message || 'read error'}`;
        return null;
      }
    }
  }

  return null;
}

export function getFirebaseAdminStatus(): {
  initialized: boolean;
  hasServiceAccount: boolean;
  projectId: string;
  databaseId: string;
  reason: string | null;
} {
  const sa = parseServiceAccountFromEnv();
  const useAdc =
    process.env.FIREBASE_USE_ADC === 'true' ||
    process.env.GOOGLE_CLOUD_PROJECT === PRIMARY_FIREBASE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT === PRIMARY_FIREBASE_PROJECT_ID;
  const resolvedProjectId = (sa?.project_id || PRIMARY_FIREBASE_PROJECT_ID).trim();

  if (cachedFirestoreDb) {
    return {
      initialized: true,
      hasServiceAccount: Boolean(sa || useAdc),
      projectId: resolvedProjectId,
      databaseId: FIRESTORE_DATABASE_ID,
      reason: cachedInitError,
    };
  }

  return {
    initialized: false,
    hasServiceAccount: Boolean(sa || useAdc),
    projectId: resolvedProjectId,
    databaseId: FIRESTORE_DATABASE_ID,
    reason:
      cachedInitError ||
      (!sa && !useAdc
        ? `FIREBASE_SERVICE_ACCOUNT_JSON is not configured for project ${PRIMARY_FIREBASE_PROJECT_ID}`
        : null),
  };
}

/**
 * Returns a Firebase Admin Firestore instance bound explicitly to the named database
 * `ai-studio-accounticcainsig-89414606-29ba-4643-944b-e0ac41725d03` (or `FIRESTORE_DATABASE_ID`).
 * Returns null if server-side credentials are not configured in this runtime.
 */
export function getAdminFirestore(): Firestore | null {
  if (cachedFirestoreDb) return cachedFirestoreDb;

  const serviceAccount = parseServiceAccountFromEnv();
  const useAdc =
    process.env.FIREBASE_USE_ADC === 'true' ||
    process.env.GOOGLE_CLOUD_PROJECT === PRIMARY_FIREBASE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT === PRIMARY_FIREBASE_PROJECT_ID;

  if (!serviceAccount && !useAdc) {
    cachedInitError =
      `Server Firestore Admin credentials missing. Set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS for project ${PRIMARY_FIREBASE_PROJECT_ID}.`;
    return null;
  }

  try {
    const appName = 'accounticca-server-admin';
    const existing = getApps().find((a) => a.name === appName);
    if (existing) {
      cachedAdminApp = existing;
    } else if (serviceAccount) {
      cachedAdminApp = initializeApp(
        {
          credential: cert(serviceAccount as any),
          projectId: serviceAccount.project_id || PRIMARY_FIREBASE_PROJECT_ID,
        },
        appName
      );
    } else {
      cachedAdminApp = initializeApp(
        {
          credential: applicationDefault(),
          projectId: PRIMARY_FIREBASE_PROJECT_ID,
        },
        appName
      );
    }

    cachedFirestoreDb = getFirestore(cachedAdminApp, FIRESTORE_DATABASE_ID);
    cachedInitError = null;
    return cachedFirestoreDb;
  } catch (err: any) {
    cachedInitError = err?.message || 'Failed to initialize Firebase Admin Firestore';
    return null;
  }
}

export async function verifyFirestoreConnection(): Promise<{
  ok: boolean;
  projectId: string;
  databaseId: string;
  error?: string;
}> {
  const db = getAdminFirestore();
  if (!db) {
    return {
      ok: false,
      projectId: PRIMARY_FIREBASE_PROJECT_ID,
      databaseId: FIRESTORE_DATABASE_ID,
      error: getFirebaseAdminStatus().reason || 'Admin Firestore unavailable',
    };
  }
  try {
    await db.collection('test').doc('connection').get();
    return {
      ok: true,
      projectId: PRIMARY_FIREBASE_PROJECT_ID,
      databaseId: FIRESTORE_DATABASE_ID,
    };
  } catch (err: any) {
    return {
      ok: false,
      projectId: PRIMARY_FIREBASE_PROJECT_ID,
      databaseId: FIRESTORE_DATABASE_ID,
      error: err?.message || 'Firestore connection check failed',
    };
  }
}

async function fetchGooglePublicCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cachedCerts && cachedCerts.expiresAt > now) {
    return cachedCerts.certs;
  }

  const res = await fetch(GOOGLE_SECURE_TOKEN_CERTS_URL, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch Firebase public certificates (${res.status})`);
  }

  const certs = (await res.json()) as Record<string, string>;
  const cacheControl = res.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  const ttlMs = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) * 1000 : 3600 * 1000;

  cachedCerts = {
    certs,
    expiresAt: now + Math.max(60_000, ttlMs),
  };

  return certs;
}

export interface VerifiedFirebaseToken {
  uid: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  projectId: string;
  provider?: string;
}

/**
 * Cryptographically verifies a Firebase Auth ID token issued by either the primary Firestore project
 * (`gen-lang-client-0396222608`) or custom domain Auth project (`elawyersnew`) using Google's x509 certs.
 * Never trusts unsigned tokens or client-supplied email claims.
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedFirebaseToken | null> {
  const token = (idToken || '').trim();
  if (!token || token.split('.').length !== 3) {
    return null;
  }

  const parts = token.split('.');
  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));

    if (header.alg !== 'RS256' || typeof header.kid !== 'string') {
      return null;
    }

    const allowedProjects = new Set([
      PRIMARY_FIREBASE_PROJECT_ID,
      LEGACY_FIREBASE_PROJECT_ID,
      CUSTOM_AUTH_FIREBASE_PROJECT_ID,
      BLOG_FIREBASE_PROJECT_ID,
    ]);
    if (!allowedProjects.has(String(payload.aud || ''))) {
      return null;
    }

    const expectedIss = `https://securetoken.google.com/${payload.aud}`;
    if (payload.iss !== expectedIss) {
      return null;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== 'number' || payload.exp <= nowSec) {
      return null;
    }
    if (typeof payload.iat !== 'number' || payload.iat > nowSec + 300) {
      return null;
    }
    if (!payload.sub || typeof payload.sub !== 'string' || payload.sub.length > 128) {
      return null;
    }

    const certs = await fetchGooglePublicCerts();
    const certPem = certs[header.kid];
    if (!certPem) {
      return null;
    }

    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${parts[0]}.${parts[1]}`);
    verifier.end();
    const sigBuf = Buffer.from(parts[2], 'base64url');
    const isValid = verifier.verify(certPem, sigBuf);
    if (!isValid) {
      return null;
    }

    const email = String(payload.email || '').trim().toLowerCase();
    if (!email) {
      return null;
    }

    return {
      uid: payload.sub,
      email,
      emailVerified: Boolean(payload.email_verified),
      name: typeof payload.name === 'string' ? payload.name : undefined,
      projectId: String(payload.aud),
      provider: payload.firebase?.sign_in_provider,
    };
  } catch {
    return null;
  }
}

export { FieldValue };
