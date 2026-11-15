/**
 * Cloudflare Turnstile Client Configuration & Verification Helper
 *
 * Uses the project's Turnstile widget site key (`0x4AAAAAAGCW2H9ASNhKzhcu` or `VITE_TURNSTILE_SITE_KEY`),
 * with automatic fallback in TurnstileWidget if a preview domain is not yet added to the widget's domain allowlist.
 */

export const DEFAULT_TURNSTILE_SITE_KEY = '0x4AAAAAAGCXo5pLXTP4rONr';
export const CLOUDFLARE_TEST_SITE_KEY = '1x00000000000000000000AA';
export const CLOUDFLARE_DUMMY_TOKEN = 'XXXX.DUMMY.TOKEN.XXXX';

const STALE_SITE_KEYS = new Set([
  'your_turnstile_site_key',
  'YOUR_SITE_KEY',
  '0x4AAAAAAGBkPsSQei2rRiGP',
  '0x4AAAAAAGCW2H9ASNhKzhcu',
]);

export function isPreviewOrLocalHostname(): boolean {
  if (typeof window === 'undefined' || !window.location?.hostname) {
    return false;
  }
  const h = window.location.hostname.toLowerCase();
  return (
    h === 'localhost' ||
    h === '127.0.0.1' ||
    h.endsWith('.run.app') ||
    h.endsWith('.web.app') ||
    h.endsWith('.firebaseapp.com')
  );
}

export function getTurnstileSiteKey(): string {
  const configured =
    typeof import.meta !== 'undefined' &&
    import.meta.env &&
    typeof import.meta.env.VITE_TURNSTILE_SITE_KEY === 'string'
      ? import.meta.env.VITE_TURNSTILE_SITE_KEY.trim()
      : '';

  if (configured && !STALE_SITE_KEYS.has(configured)) {
    return configured;
  }

  return DEFAULT_TURNSTILE_SITE_KEY;
}

export function isUsingTestTurnstileKey(): boolean {
  return getTurnstileSiteKey() === CLOUDFLARE_TEST_SITE_KEY;
}

export interface TurnstileVerificationResult {
  success: boolean;
  message?: string;
  errorCodes?: string[];
  action?: string;
  hostname?: string;
  usingTestKey?: boolean;
}

export async function verifyTurnstileTokenClient(
  token: string,
  action?: string
): Promise<TurnstileVerificationResult> {
  const cleanToken = typeof token === 'string' ? token.trim() : '';
  if (!cleanToken) {
    return {
      success: false,
      message: 'Please complete the Cloudflare Turnstile security check first.',
    };
  }

  try {
    const response = await fetch('/api/security/turnstile/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: cleanToken,
        turnstileToken: cleanToken,
        'cf-turnstile-response': cleanToken,
        action,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.success) {
      return {
        success: false,
        message:
          data?.message ||
          data?.error ||
          'Cloudflare Turnstile verification failed. Please retry the security check.',
        errorCodes: Array.isArray(data?.errorCodes) ? data.errorCodes : undefined,
      };
    }

    return {
      success: true,
      action: data.action,
      hostname: data.hostname,
      usingTestKey: Boolean(data.usingTestKey),
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Unable to verify Cloudflare Turnstile token right now.',
    };
  }
}
