import { auth } from '../lib/firebase';
import { getAdminAuthHeaders } from '../contexts/ShopAuthContext';

export type ProfessionalDesignation =
  | 'advocate_supreme_court'
  | 'advocate_district_court'
  | 'barrister'
  | 'chartered_accountant'
  | 'cost_management_accountant'
  | 'tax_practitioner'
  | 'corporate_counsel'
  | 'cfo_finance_director'
  | 'business_owner'
  | 'other';

export const DESIGNATION_LABELS: Record<ProfessionalDesignation, string> = {
  advocate_supreme_court: 'Advocate, Supreme Court of BD',
  advocate_district_court: 'Advocate, District Court',
  barrister: 'Barrister-at-Law',
  chartered_accountant: 'Chartered Accountant (ICAB)',
  cost_management_accountant: 'CMA (ICMAB)',
  tax_practitioner: 'Tax Practitioner / ITP',
  corporate_counsel: 'Corporate Counsel / Company Sec.',
  cfo_finance_director: 'CFO / Finance Director',
  business_owner: 'Managing Director / Business Owner',
  other: 'Legal / Tax Professional',
};

export interface NewsletterSubscriberInput {
  email: string;
  name?: string;
  designation?: ProfessionalDesignation | string;
  organization?: string;
  topics?: string[];
  frequency?: 'weekly' | 'urgent_alerts' | 'both';
  source?: 'sidebar' | 'footer' | 'article' | 'modal';
  sourceCategory?: string;
  sourceArticleId?: string;
  sourceArticleTitle?: string;
  consentAccepted?: boolean;
  turnstileToken?: string;
  turnstileProof?: string;
}

export interface NewsletterSubscriber extends NewsletterSubscriberInput {
  id: string;
  status: 'active' | 'unsubscribed';
  subscribedAt: string;
  userId?: string | null;
}

/**
 * Generate a deterministic document ID for local recognition based on normalized email.
 */
function getSubscriberDocId(email: string): string {
  const clean = email.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
  return `sub_${clean}`.substring(0, 100);
}

/**
 * Subscribes or updates preferences via validated backend API
 * (Cloudflare Turnstile + Admin Firestore + Brevo SMTP + Notion Database B).
 */
export async function subscribeToNewsletter(
  input: NewsletterSubscriberInput
): Promise<{
  success: boolean;
  persisted: boolean;
  id: string;
  message: string;
  emailDelivered?: boolean;
  notionSynced?: boolean;
}> {
  const cleanEmail = input.email.trim().toLowerCase();

  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
    throw new Error('Please provide a valid professional email address.');
  }

  if (input.consentAccepted === false) {
    throw new Error('Consent is required to activate statutory dispatch updates.');
  }

  const normalizedTopics =
    input.topics && input.topics.length > 0 ? input.topics : ['tax_vat', 'corporate_rjsc'];

  const response = await fetch('/api/subscribe-newsletter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: cleanEmail,
      name: input.name?.trim() || undefined,
      designation: input.designation || 'other',
      organization: input.organization?.trim() || undefined,
      topics: normalizedTopics,
      frequency: input.frequency || 'both',
      source: input.source || 'sidebar',
      sourceCategory: input.sourceCategory,
      sourceArticleId: input.sourceArticleId || undefined,
      sourceArticleTitle: input.sourceArticleTitle || undefined,
      consentAccepted: input.consentAccepted ?? true,
      userId: auth.currentUser?.uid || undefined,
      turnstileToken: input.turnstileToken,
      'cf-turnstile-response': input.turnstileToken,
      turnstileProof: input.turnstileProof,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.persisted) {
    throw new Error(
      data?.error ||
        data?.message ||
        'Unable to save subscription to our durable database. Please try again.'
    );
  }

  const subscriberId = String(data.subscriberId || getSubscriberDocId(cleanEmail));
  const nowIso = new Date().toISOString();

  // Cache locally ONLY after backend confirmed durable Firestore save
  try {
    localStorage.setItem(
      'accounticca_newsletter_subscriber',
      JSON.stringify({
        id: subscriberId,
        email: cleanEmail,
        name: input.name,
        designation: input.designation,
        status: 'active',
        subscribedAt: nowIso,
        topics: normalizedTopics,
      })
    );

    const historyRaw = localStorage.getItem('accounticca_newsletter_list');
    const history: any[] = historyRaw ? JSON.parse(historyRaw) : [];
    const idx = history.findIndex((h: any) => h.email === cleanEmail);
    const localRecord = {
      id: subscriberId,
      email: cleanEmail,
      name: input.name?.trim() || null,
      designation: input.designation || 'other',
      organization: input.organization?.trim() || null,
      topics: normalizedTopics,
      frequency: input.frequency || 'both',
      source: input.source || 'sidebar',
      status: 'active',
      subscribedAt: nowIso,
    };
    if (idx >= 0) {
      history[idx] = localRecord;
    } else {
      history.push(localRecord);
    }
    localStorage.setItem('accounticca_newsletter_list', JSON.stringify(history));
  } catch (storageErr) {
    console.warn('LocalStorage error while caching subscriber:', storageErr);
  }

  return {
    success: true,
    persisted: true,
    id: subscriberId,
    emailDelivered: Boolean(data.emailDelivered ?? data.liveDelivered),
    notionSynced: Boolean(data.notionSynced),
    message: data.message || 'Successfully subscribed to legal & tax updates.',
  };
}

/**
 * Unsubscribes a user cleanly across Firestore and Notion Database B.
 */
export async function unsubscribeFromNewsletter(
  email: string,
  reason = 'user_requested'
): Promise<{ success: boolean; message: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
    throw new Error('Please enter a valid email address to unsubscribe.');
  }

  const response = await fetch('/api/newsletter/unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: cleanEmail, reason }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.success) {
    throw new Error(data?.error || 'Unable to process unsubscribe request right now.');
  }

  try {
    const cachedRaw = localStorage.getItem('accounticca_newsletter_subscriber');
    if (cachedRaw) {
      const parsed = JSON.parse(cachedRaw);
      if (parsed?.email === cleanEmail) {
        localStorage.removeItem('accounticca_newsletter_subscriber');
      }
    }
    const historyRaw = localStorage.getItem('accounticca_newsletter_list');
    if (historyRaw) {
      const history: any[] = JSON.parse(historyRaw);
      const updated = history.map((h) =>
        h.email === cleanEmail ? { ...h, status: 'unsubscribed' } : h
      );
      localStorage.setItem('accounticca_newsletter_list', JSON.stringify(updated));
    }
  } catch {
    // ignore storage cleanup errors
  }

  return {
    success: true,
    message: data.message || `${cleanEmail} has been unsubscribed.`,
  };
}

/**
 * Checks if an email is actively subscribed via local recognition cache
 * and (when signed in) authenticated backend lookup.
 */
export async function checkSubscriberStatus(email: string): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return false;

  try {
    const cached = localStorage.getItem('accounticca_newsletter_subscriber');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed?.email === cleanEmail && parsed?.status !== 'unsubscribed') {
        return true;
      }
    }
  } catch {
    // ignore
  }

  try {
    let headers: Record<string, string> = getAdminAuthHeaders();
    if (!headers.Authorization && auth.currentUser) {
      const idToken = await auth.currentUser.getIdToken();
      headers = { ...headers, Authorization: `Bearer ${idToken}` };
    }
    if (!headers.Authorization && !headers['x-admin-token']) {
      return false;
    }

    const res = await fetch(
      `/api/newsletter/status?email=${encodeURIComponent(cleanEmail)}`,
      { headers }
    );
    if (!res.ok) return false;
    const data = await res.json().catch(() => ({}));
    return Boolean(data?.subscribed);
  } catch {
    return false;
  }
}
