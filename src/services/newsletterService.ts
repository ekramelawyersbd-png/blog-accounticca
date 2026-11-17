import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';

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
  sourceArticleId?: string;
  sourceArticleTitle?: string;
}

export interface NewsletterSubscriber extends NewsletterSubscriberInput {
  id: string;
  status: 'active' | 'unsubscribed';
  subscribedAt: string;
  userId?: string | null;
}

const COLLECTION_NAME = 'newsletterSubscribers';

/**
 * Generate a deterministic document ID for a subscriber based on their normalized email.
 * This prevents duplicate document proliferation while remaining valid in Firestore path keys.
 */
function getSubscriberDocId(email: string): string {
  const clean = email.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
  return `sub_${clean}`.substring(0, 100);
}

/**
 * Saves or updates a subscriber in Firestore for future legal and tax updates.
 */
export async function subscribeToNewsletter(
  input: NewsletterSubscriberInput
): Promise<{ success: boolean; id: string; message: string }> {
  const cleanEmail = input.email.trim().toLowerCase();
  
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error('Please provide a valid professional email address.');
  }

  const docId = getSubscriberDocId(cleanEmail);
  const docRef = doc(db, COLLECTION_NAME, docId);
  const nowIso = new Date().toISOString();

  const recordPayload = {
    email: cleanEmail,
    name: input.name?.trim() || null,
    designation: input.designation || 'other',
    organization: input.organization?.trim() || null,
    topics: input.topics && input.topics.length > 0 
      ? input.topics 
      : ['tax_vat', 'corporate_rjsc', 'precedents'],
    frequency: input.frequency || 'both',
    source: input.source || 'sidebar',
    sourceArticleId: input.sourceArticleId || null,
    sourceArticleTitle: input.sourceArticleTitle || null,
    status: 'active',
    subscribedAt: nowIso,
    userId: auth.currentUser?.uid || null,
    updatedAt: serverTimestamp(),
  };

  try {
    // Write directly to Firestore with merge: true to update preferences if already subscribed
    await setDoc(docRef, recordPayload, { merge: true });

    // Local caching for instant recognition across pages & offline resiliency
    try {
      localStorage.setItem('accounticca_newsletter_subscriber', JSON.stringify({
        id: docId,
        email: cleanEmail,
        name: input.name,
        designation: input.designation,
        subscribedAt: nowIso,
        topics: recordPayload.topics
      }));

      // Maintain client list of active subscriptions
      const historyRaw = localStorage.getItem('accounticca_newsletter_list');
      const history: any[] = historyRaw ? JSON.parse(historyRaw) : [];
      const idx = history.findIndex((h: any) => h.email === cleanEmail);
      if (idx >= 0) {
        history[idx] = { ...recordPayload, id: docId };
      } else {
        history.push({ ...recordPayload, id: docId });
      }
      localStorage.setItem('accounticca_newsletter_list', JSON.stringify(history));
    } catch (storageErr) {
      console.warn('LocalStorage error while saving subscriber:', storageErr);
    }

    return {
      success: true,
      id: docId,
      message: 'Successfully subscribed to legal & tax updates.'
    };
  } catch (error) {
    console.error('Error subscribing to newsletter in Firestore:', error);
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTION_NAME}/${docId}`);
    throw error;
  }
}

/**
 * Checks if an email is already stored as subscribed in Firestore.
 */
export async function checkSubscriberStatus(email: string): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return false;

  // 1. Quick check in local cache
  try {
    const cached = localStorage.getItem('accounticca_newsletter_subscriber');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed?.email === cleanEmail) {
        return true;
      }
    }
  } catch {
    // ignore
  }

  // 2. Query Firestore
  try {
    const docId = getSubscriberDocId(cleanEmail);
    const docSnap = await getDoc(doc(db, COLLECTION_NAME, docId));
    return docSnap.exists();
  } catch (err) {
    console.warn('Could not verify subscriber in Firestore (offline or rule restricted):', err);
    return false;
  }
}
