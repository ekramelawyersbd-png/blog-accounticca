import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth } from '../firebase';

export interface CalculationEmailReportRecord {
  id: string;
  referenceId: string;
  toolId: string;
  toolName: string;
  calculatorType: string;
  toolCategory: string;
  toolPath: string;
  primaryRecipient: string;
  recipientName: string;
  ccRecipients: string[];
  subject: string;
  html?: string;
  text?: string;
  sentAt: string;
  formattedDate?: string;
  status: string;
  relayMode: string;
  fromHeader?: string;
  previewUrl?: string | null;
  summaryHighlight: string;
  sheetSynced?: boolean;
  sheetSyncedAt?: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const COLLECTION_NAME = 'calculation_email_reports';
const LOCAL_STORAGE_KEY = 'elaw_calculation_email_reports';

export function formatBangladeshDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return (
      new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Dhaka',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(d) + ' BST'
    );
  } catch {
    return isoString;
  }
}

/**
 * Saves a calculation report record into Firestore
 */
export async function saveCalculationReportToFirestore(
  record: Partial<CalculationEmailReportRecord>
): Promise<CalculationEmailReportRecord> {
  const refId = record.referenceId || `CALC-${Date.now()}`;
  const docId = record.id || refId;
  const sentAt = record.sentAt || new Date().toISOString();

  const finalRecord: CalculationEmailReportRecord = {
    id: docId,
    referenceId: refId,
    toolId: record.toolId || 'tax-calculator',
    toolName: record.toolName || 'Statutory Compliance Calculator',
    calculatorType: record.calculatorType || record.toolName || 'Tax & Compliance Calculator',
    toolCategory: record.toolCategory || 'Taxation & Statutory Compliance',
    toolPath: record.toolPath || '/tools',
    primaryRecipient: (record.primaryRecipient || '').trim(),
    recipientName: record.recipientName || 'Verified Member',
    ccRecipients: Array.isArray(record.ccRecipients) ? record.ccRecipients : [],
    subject: record.subject || `[${refId}] Calculation Statement`,
    html: record.html || '',
    text: record.text || '',
    sentAt,
    formattedDate: formatBangladeshDate(sentAt),
    status: record.status || 'Delivered',
    relayMode: record.relayMode || 'smtp-relay.brevo.com:587',
    fromHeader: record.fromHeader || 'ACCOUNTICCA x E-Lawyers <ekram@elawyersbd.com>',
    previewUrl: record.previewUrl || null,
    summaryHighlight: record.summaryHighlight || 'Completed Statutory Statement',
    sheetSynced: Boolean(record.sheetSynced),
    sheetSyncedAt: record.sheetSyncedAt || null,
  };

  // 1. Cache to local storage
  try {
    const local = getLocalCalculationReports();
    const existingIdx = local.findIndex((l) => l.referenceId === refId || l.id === docId);
    if (existingIdx >= 0) {
      local[existingIdx] = finalRecord;
    } else {
      local.unshift(finalRecord);
    }
    if (local.length > 300) local.length = 300;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(local));
  } catch (err) {
    console.warn('[CalculationReport] LocalStorage cache notice:', err);
  }

  // 2. Persist to Firestore
  try {
    const docRef = doc(db, COLLECTION_NAME, docId);
    await setDoc(docRef, finalRecord, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${COLLECTION_NAME}/${docId}`);
  }

  // 3. Dispatch browser event for live UI reactivity
  try {
    window.dispatchEvent(
      new CustomEvent('calculation_email_report_saved', { detail: finalRecord })
    );
  } catch {}

  return finalRecord;
}

/**
 * Reads local cached calculation reports
 */
export function getLocalCalculationReports(): CalculationEmailReportRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Fetches all sent calculation reports from Firestore, falling back to server logs and local cache
 */
export async function fetchCalculationReportsFromFirestore(
  maxLimit: number = 200
): Promise<CalculationEmailReportRecord[]> {
  const mergedMap = new Map<string, CalculationEmailReportRecord>();

  // 1. Seed from local storage
  getLocalCalculationReports().forEach((item) => {
    mergedMap.set(item.referenceId || item.id, item);
  });

  // 2. Query Firestore collection
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('sentAt', 'desc'), limit(maxLimit));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as CalculationEmailReportRecord;
      const ref = data.referenceId || docSnap.id;
      mergedMap.set(ref, {
        ...data,
        id: docSnap.id,
        referenceId: ref,
        formattedDate: data.formattedDate || formatBangladeshDate(data.sentAt),
      });
    });
  } catch (err) {
    console.warn('[CalculationReport] Firestore fetch notice, checking fallback:', err);
  }

  // 3. If Firestore is empty or cold, check backend calculation log endpoint to seed records
  if (mergedMap.size === 0) {
    try {
      const res = await fetch('/api/email/calculation-logs');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.logs)) {
          for (const log of data.logs) {
            const mapped: CalculationEmailReportRecord = {
              id: log.id || log.referenceId,
              referenceId: log.referenceId,
              toolId: log.toolId || 'tax-calculator',
              toolName: log.toolName || 'Statutory Compliance Calculator',
              calculatorType: log.toolName || 'Tax & Compliance Calculator',
              toolCategory: log.toolCategory || 'Compliance Tools',
              toolPath: log.toolPath || '/tools',
              primaryRecipient: log.primaryRecipient,
              recipientName: log.recipientName || 'Verified Member',
              ccRecipients: log.ccRecipients || [],
              subject: log.subject || `[${log.referenceId}] Calculation Report`,
              html: log.html || '',
              text: log.text || '',
              sentAt: log.sentAt || new Date().toISOString(),
              formattedDate: formatBangladeshDate(log.sentAt || new Date().toISOString()),
              status: log.status || 'Delivered',
              relayMode: log.relayMode || 'smtp-relay.brevo.com:587',
              fromHeader: log.fromHeader,
              previewUrl: log.previewUrl,
              summaryHighlight: log.summaryHighlight || 'Completed Report',
              sheetSynced: false,
            };
            mergedMap.set(mapped.referenceId, mapped);
            // Async background push to Firestore to populate
            void setDoc(doc(db, COLLECTION_NAME, mapped.id), mapped).catch(() => {});
          }
        }
      }
    } catch {}
  }

  const reports = Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
  );

  return reports;
}

/**
 * Subscribes to real-time updates for calculation email reports in Firestore
 */
export function subscribeCalculationReports(
  onUpdate: (reports: CalculationEmailReportRecord[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const q = query(collection(db, COLLECTION_NAME), orderBy('sentAt', 'desc'), limit(150));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const reports: CalculationEmailReportRecord[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as CalculationEmailReportRecord;
        reports.push({
          ...data,
          id: docSnap.id,
          referenceId: data.referenceId || docSnap.id,
          formattedDate: data.formattedDate || formatBangladeshDate(data.sentAt),
        });
      });
      onUpdate(reports);
    },
    (error) => {
      console.warn('[CalculationReport] onSnapshot listener warning:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
    }
  );

  return unsubscribe;
}

/**
 * Deletes a calculation report from Firestore
 */
export async function deleteCalculationReportFromFirestore(docId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, docId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${COLLECTION_NAME}/${docId}`);
  }
}
