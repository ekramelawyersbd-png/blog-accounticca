/**
 * Cloudflare Turnstile Client Configuration & Verification Helper
 *
 * Uses `VITE_TURNSTILE_SITE_KEY` when provided in environment configuration,
 * and falls back to Cloudflare's official Always-Passes testing sitekey
 * (`1x00000000000000000000AA`) during local/preview development.
 */

export const CLOUDFLARE_TEST_SITE_KEY = '1x00000000000000000000AA';

export function getTurnstileSiteKey(): string {
  const configured =
    typeof import.meta !== 'undefined' &&
    import.meta.env &&
    typeof import.meta.env.VITE_TURNSTILE_SITE_KEY === 'string'
      ? import.meta.env.VITE_TURNSTILE_SITE_KEY.trim()
      : '';

  return configured || CLOUDFLARE_TEST_SITE_KEY;
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
  if (!token || !token.trim()) {
    return {
      success: false,
      message: 'Please complete the Cloudflare Turnstile security check first.',
    };
  }

  try {
    const response = await fetch('/api/security/turnstile/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token.trim(), action }),
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
