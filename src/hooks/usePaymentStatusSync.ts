import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db, fallbackAuth } from '../lib/firebase';
import {
  usePurchases,
  TransactionRecord,
  resolveInvoiceIdForTransaction,
  PaymentStatus,
  AccessStatus
} from '../contexts/PurchaseContext';
import {
  VerifyPaymentResponse
} from '../services/uddoktapayService';
import {
  UDDOKTAPAY_API_KEY,
  UDDOKTAPAY_SANDBOX_VERIFY_URL,
  UDDOKTAPAY_VERIFY_PAYMENT_URL,
  VerifiedPaymentStatusData,
  buildUddoktaPayVerifyHeaders,
  createUddoktaPayVerifyRequestInit,
  parseUddoktaPayVerifyResponse,
  verifyPayment,
  verifyPaymentStatus,
  verifyWebhookPaymentPayload,
  isPendingStatus,
  isPendingTransactionRecord,
  paymentService
} from '../services/paymentService';

/// <reference types="vite/client" />

export {
  UDDOKTAPAY_API_KEY,
  UDDOKTAPAY_SANDBOX_VERIFY_URL,
  UDDOKTAPAY_VERIFY_PAYMENT_URL,
  buildUddoktaPayVerifyHeaders,
  createUddoktaPayVerifyRequestInit,
  parseUddoktaPayVerifyResponse,
  verifyPayment,
  verifyPaymentStatus,
  verifyWebhookPaymentPayload,
  isPendingStatus,
  isPendingTransactionRecord,
  paymentService
};
export type { VerifiedPaymentStatusData };

export enum FirestoreOperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: FirestoreOperationType;
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

function logFirestorePermissionError(
  error: unknown,
  operationType: FirestoreOperationType,
  path: string | null
) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.toLowerCase().includes('permission') || message.toLowerCase().includes('insufficient')) {
    const currentUser = auth.currentUser || fallbackAuth.currentUser;
    const errInfo: FirestoreErrorInfo = {
      error: message,
      authInfo: {
        userId: currentUser?.uid,
        email: currentUser?.email,
        emailVerified: currentUser?.emailVerified,
        isAnonymous: currentUser?.isAnonymous,
        tenantId: currentUser?.tenantId,
        providerInfo:
          currentUser?.providerData?.map((provider) => ({
            providerId: provider.providerId,
            email: provider.email
          })) || []
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
  }
}

export interface PaymentStatusSyncItemResult extends VerifiedPaymentStatusData {
  status: 'completed' | 'pending' | 'refunded';
  paymentStatus: PaymentStatus;
  updatedStatus: 'completed' | 'pending' | 'refunded';
  previousStatus: string;
  verified: boolean;
  transactionId: string;
  invoiceId: string;
  productTitle: string;
  firestoreDocIdsUpdated: string[];
  response: VerifyPaymentResponse;
  paymentData: VerifyPaymentResponse;
  data: VerifyPaymentResponse;
}

export interface PaymentStatusSyncSummary {
  checked: number;
  verified: number;
  updated: number;
  results: PaymentStatusSyncItemResult[];
  syncedAt: string;
}

export interface UsePaymentStatusSyncOptions {
  /** Optional invoice_id to bind to this hook instance */
  invoiceId?: string;
  /** Optional override for UDDOKTAPAY_API_KEY */
  apiKey?: string;
  /** Whether to automatically run the PENDING transaction check on mount (default: true when no single invoiceId is bound) */
  enabled?: boolean;
  /** Whether to automatically verify the bound invoiceId on mount (default: false) */
  verifyBoundInvoiceOnMount?: boolean;
  /** Optional callback fired when a sync pass completes */
  onSyncComplete?: (summary: PaymentStatusSyncSummary) => void;
  /** Optional callback fired when single invoice verification completes */
  onVerifyComplete?: (result: PaymentStatusSyncItemResult) => void;
}

export const postUddoktaPayVerifyPayment = verifyPaymentStatus;

/**
 * Custom hook `usePaymentStatusSync` that accepts an `invoice_id` (or options object)
 * and performs a POST request to the UddoktaPay Verify Payment API (`https://sandbox.uddoktapay.com/api/verify-payment`)
 * using the configured `UDDOKTAPAY_API_KEY` to retrieve and return the `status` and full payment data,
 * while also updating the corresponding document in Firestore (`user_purchases`) and context state.
 */
export function usePaymentStatusSync(
  invoiceIdOrOptions?: string | UsePaymentStatusSyncOptions,
  maybeOptions?: UsePaymentStatusSyncOptions
) {
  const parsedOptions: UsePaymentStatusSyncOptions =
    typeof invoiceIdOrOptions === 'string'
      ? { ...maybeOptions, invoiceId: invoiceIdOrOptions }
      : invoiceIdOrOptions || {};

  const {
    invoiceId: boundInvoiceId,
    apiKey: configuredApiKey = UDDOKTAPAY_API_KEY,
    enabled = typeof invoiceIdOrOptions !== 'string',
    verifyBoundInvoiceOnMount = false,
    onSyncComplete,
    onVerifyComplete
  } = parsedOptions;

  const {
    activeUserId,
    transactions,
    isSyncingPayments,
    syncingTransactionId,
    lastPaymentSyncAt,
    syncTransactionWithUddoktaPay
  } = usePurchases();

  const [isCheckingMount, setIsCheckingMount] = useState(false);
  const [localVerifyingId, setLocalVerifyingId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [paymentData, setPaymentData] = useState<VerifyPaymentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastVerifiedResult, setLastVerifiedResult] =
    useState<PaymentStatusSyncItemResult | null>(null);
  const [syncSummary, setSyncSummary] = useState<PaymentStatusSyncSummary | null>(null);

  const onSyncCompleteRef = useRef(onSyncComplete);
  onSyncCompleteRef.current = onSyncComplete;

  const onVerifyCompleteRef = useRef(onVerifyComplete);
  onVerifyCompleteRef.current = onVerifyComplete;

  const hasRunForUserRef = useRef<string | null>(null);
  const hasVerifiedBoundInvoiceRef = useRef<string | null>(null);

  const pendingTransactions = transactions.filter((tx) =>
    isPendingTransactionRecord(tx)
  );

  // Derive current known status for boundInvoiceId if present in transactions
  const matchedBoundTx = boundInvoiceId
    ? transactions.find(
        (t) =>
          resolveInvoiceIdForTransaction(t) === boundInvoiceId ||
          t.invoiceId === boundInvoiceId ||
          t.orderId === boundInvoiceId ||
          t.id === boundInvoiceId
      )
    : undefined;

  const currentStatus: PaymentStatus =
    paymentStatus ||
    lastVerifiedResult?.paymentStatus ||
    matchedBoundTx?.paymentStatus ||
    matchedBoundTx?.status ||
    'pending';

  /**
   * Calls `verifyPaymentStatus(resolvedInvoiceId)` to POST to `https://sandbox.uddoktapay.com/api/verify-payment`
   * with `RT-UDDOKTAPAY-API-KEY: UDDOKTAPAY_API_KEY`, updates the corresponding Firestore document in `user_purchases`
   * and local PurchaseContext state, and returns the `status` and full payment data.
   */
  const verifyTransactionStatus = useCallback(
    async (
      txOrInvoiceId?: string | TransactionRecord,
      explicitDocIdOrTx?: string | TransactionRecord
    ): Promise<PaymentStatusSyncItemResult> => {
      const effectiveInput = txOrInvoiceId ?? boundInvoiceId;
      if (!effectiveInput) {
        throw new Error('An invoice_id or TransactionRecord is required to verify payment status.');
      }

      const explicitDocId =
        typeof explicitDocIdOrTx === 'string' ? explicitDocIdOrTx : undefined;
      const explicitTx =
        typeof explicitDocIdOrTx === 'object' && explicitDocIdOrTx !== null
          ? explicitDocIdOrTx
          : undefined;

      setError(null);
      const effectiveUserId =
        activeUserId ||
        explicitTx?.userId ||
        (typeof effectiveInput === 'object' ? effectiveInput.userId : null) ||
        fallbackAuth.currentUser?.uid ||
        'client';

      const targetTx: TransactionRecord | undefined =
        explicitTx ||
        (typeof effectiveInput === 'string'
          ? transactions.find(
              (t) =>
                resolveInvoiceIdForTransaction(t) === effectiveInput ||
                t.invoiceId === effectiveInput ||
                t.orderId === effectiveInput ||
                t.referenceId === effectiveInput ||
                t.id === effectiveInput ||
                t.purchaseId === effectiveInput ||
                t.transactionId === effectiveInput
            )
          : effectiveInput);

      const resolvedInvoiceId =
        typeof effectiveInput === 'string' && effectiveInput.trim()
          ? effectiveInput.trim()
          : targetTx
          ? resolveInvoiceIdForTransaction(targetTx)
          : '';

      const trackingKey = targetTx?.id || resolvedInvoiceId;
      setLocalVerifyingId(trackingKey);

      try {
        // 1. Use the verifyPayment service to fetch the status for the given invoice_id
        const verifyRes = await verifyPayment(
          resolvedInvoiceId,
          configuredApiKey
        );
        setPaymentData(verifyRes.paymentData);

        // Also synchronize PurchaseContext state so all UI views reflect the verified payment immediately
        try {
          await syncTransactionWithUddoktaPay(targetTx || resolvedInvoiceId);
        } catch {
          // Context sync already handled or non-blocking
        }

        const rawStatusUpper = String(
          verifyRes.status_code || verifyRes.status || ''
        ).toUpperCase();
        const isRefunded = rawStatusUpper === 'REFUNDED';
        const isCompleted =
          !isRefunded &&
          (Boolean(verifyRes.verified) ||
            rawStatusUpper === 'COMPLETED' ||
            verifyRes.status === true);

        const nextStatus: 'completed' | 'pending' | 'refunded' = isRefunded
          ? 'refunded'
          : isCompleted
          ? 'completed'
          : 'pending';

        const nextPaymentStatus: PaymentStatus = nextStatus;
        const nextAccessStatus: AccessStatus = isRefunded
          ? 'revoked'
          : isCompleted
          ? 'active'
          : 'pending';

        setPaymentStatus(nextPaymentStatus);

        const syncedAtIso = new Date().toISOString();
        const firestoreDocIdsUpdated: string[] = [];

        // 2. Locate and update the corresponding document(s) in Firestore ('payments' and 'user_purchases')
        if (effectiveUserId) {
          const candidateDocIds = new Set<string>();
          const existingDocsById = new Map<string, Record<string, any>>();

          if (explicitDocId) {
            candidateDocIds.add(explicitDocId);
          }
          if (targetTx?.productId) {
            candidateDocIds.add(`${effectiveUserId}_${targetTx.productId}`);
          }

          // Query existing records in 'payments' collection for this user
          const authUid = auth.currentUser?.uid || fallbackAuth.currentUser?.uid;
          if (authUid && effectiveUserId === authUid) {
            try {
              const paymentsQuery = query(
                collection(db, 'payments'),
                where('userId', '==', authUid)
              );
              const paymentsSnap = await getDocs(paymentsQuery);
              paymentsSnap.forEach((docSnap) => {
                const d = docSnap.data() as Record<string, any>;
                const matchesInvoice =
                  d.invoiceId === resolvedInvoiceId ||
                  d.invoice_id === resolvedInvoiceId ||
                  d.orderId === resolvedInvoiceId ||
                  d.referenceId === resolvedInvoiceId ||
                  d.transactionId === resolvedInvoiceId ||
                  docSnap.id === resolvedInvoiceId ||
                  (targetTx &&
                    (d.id === targetTx.id ||
                      d.purchaseId === targetTx.purchaseId ||
                      d.productId === targetTx.productId));

                if (matchesInvoice) {
                  candidateDocIds.add(docSnap.id);
                  existingDocsById.set(docSnap.id, d);
                }
              });
            } catch (paymentsQueryErr) {
              logFirestorePermissionError(
                paymentsQueryErr,
                FirestoreOperationType.LIST,
                'payments'
              );
            }
          }

          try {
            const q = query(
              collection(db, 'user_purchases'),
              where('userId', '==', effectiveUserId)
            );
            const snap = await getDocs(q);
            snap.forEach((docSnap) => {
              const d = docSnap.data() as Record<string, any>;
              const matchesInvoice =
                d.invoiceId === resolvedInvoiceId ||
                d.orderId === resolvedInvoiceId ||
                d.referenceId === resolvedInvoiceId ||
                d.transactionId === resolvedInvoiceId ||
                (targetTx &&
                  (d.id === targetTx.id ||
                    d.purchaseId === targetTx.purchaseId ||
                    d.productId === targetTx.productId));

              if (matchesInvoice) {
                candidateDocIds.add(docSnap.id);
                if (!existingDocsById.has(docSnap.id)) {
                  existingDocsById.set(docSnap.id, d);
                }
              }
            });
          } catch (queryErr) {
            logFirestorePermissionError(queryErr, FirestoreOperationType.LIST, 'user_purchases');
          }

          if (candidateDocIds.size === 0) {
            const fallbackProductId =
              targetTx?.productId ||
              verifyRes.metadata?.product_id ||
              resolvedInvoiceId;
            candidateDocIds.add(`${effectiveUserId}_${fallbackProductId}`);
          }

          for (const docId of candidateDocIds) {
            const docPath = `user_purchases/${docId}`;
            const existingDoc = existingDocsById.get(docId);
            const docUserId = existingDoc?.userId || targetTx?.userId || effectiveUserId;
            const docProductId =
              existingDoc?.productId ||
              targetTx?.productId ||
              verifyRes.metadata?.product_id ||
              docId.replace(`${docUserId}_`, '') ||
              resolvedInvoiceId;

            try {
              const baseRecord = targetTx || existingDoc || {
                id: docId,
                purchaseId: docId,
                userId: docUserId,
                productId: docProductId,
                productTitle:
                  verifyRes.metadata?.product_title || 'Digital Compliance Product',
                productName:
                  verifyRes.metadata?.product_title || 'Digital Compliance Product',
                orderId: resolvedInvoiceId,
                referenceId: resolvedInvoiceId,
                amount: Number(verifyRes.amount || 0),
                date: syncedAtIso,
                purchaseDate: syncedAtIso,
                accessExpiryDate: null
              };

              const updatedPayload = {
                ...baseRecord,
                userId: docUserId,
                productId: docProductId,
                invoiceId: verifyRes.invoice_id || resolvedInvoiceId,
                invoice_id: verifyRes.invoice_id || resolvedInvoiceId,
                transactionId:
                  verifyRes.transaction_id ||
                  targetTx?.transactionId ||
                  existingDoc?.transactionId ||
                  resolvedInvoiceId,
                paymentMethod: verifyRes.payment_method
                  ? verifyRes.payment_method.toLowerCase().includes('uddoktapay')
                    ? verifyRes.payment_method
                    : `UddoktaPay (${verifyRes.payment_method})`
                  : targetTx?.paymentMethod ||
                    existingDoc?.paymentMethod ||
                    'UddoktaPay Gateway',
                status: nextStatus,
                paymentStatus: nextPaymentStatus,
                accessStatus: nextAccessStatus,
                verified: isCompleted,
                verifiedBy: 'uddoktapay_api',
                lastSyncedAt: syncedAtIso,
                updatedAt: serverTimestamp()
              };

              await setDoc(
                doc(db, 'user_purchases', docId),
                updatedPayload,
                { merge: true }
              );
              firestoreDocIdsUpdated.push(docId);

              // Update the document in the 'payments' Firestore collection with the latest data retrieved from the API
              if (authUid && docUserId === authUid) {
                try {
                  await setDoc(
                    doc(db, 'payments', docId),
                    updatedPayload,
                    { merge: true }
                  );
                } catch (paymentWriteErr) {
                  logFirestorePermissionError(
                    paymentWriteErr,
                    FirestoreOperationType.WRITE,
                    `payments/${docId}`
                  );
                }
              }
            } catch (writeErr) {
              logFirestorePermissionError(writeErr, FirestoreOperationType.WRITE, docPath);
            }
          }
        }

        const result: PaymentStatusSyncItemResult = {
          ...verifyRes.paymentData,
          status: nextStatus,
          paymentStatus: nextPaymentStatus,
          accessStatus: nextAccessStatus,
          updatedStatus: nextStatus,
          previousStatus: targetTx?.status || 'pending',
          verified: isCompleted,
          invoice_id: verifyRes.invoice_id || resolvedInvoiceId,
          transactionId:
            verifyRes.transaction_id || targetTx?.transactionId || resolvedInvoiceId,
          invoiceId: verifyRes.invoice_id || resolvedInvoiceId,
          productTitle:
            targetTx?.productTitle ||
            verifyRes.metadata?.product_title ||
            'Digital Compliance Product',
          firestoreDocIdsUpdated,
          response: verifyRes.paymentData,
          paymentData: verifyRes.paymentData,
          data: verifyRes.paymentData
        };

        setLastVerifiedResult(result);
        if (onVerifyCompleteRef.current) {
          onVerifyCompleteRef.current(result);
        }

        return result;
      } catch (err: any) {
        const message = err?.message || 'Failed to verify payment status with UddoktaPay.';
        setError(message);
        throw err;
      } finally {
        setLocalVerifyingId(null);
      }
    },
    [activeUserId, boundInvoiceId, configuredApiKey, transactions, syncTransactionWithUddoktaPay]
  );

  /**
   * Async `syncStatus` function that fetches the latest payment verification data
   * from `verifyPayment(invoice_id)` and updates the corresponding document in the
   * `'payments'` Firestore collection.
   */
  const syncStatus = useCallback(
    async (
      txOrInvoiceId?: string | TransactionRecord,
      explicitDocIdOrTx?: string | TransactionRecord
    ): Promise<PaymentStatusSyncItemResult> => {
      return verifyTransactionStatus(txOrInvoiceId, explicitDocIdOrTx);
    },
    [verifyTransactionStatus]
  );

  const verifySingleTransaction = useCallback(
    async (txOrInvoiceId?: string | TransactionRecord): Promise<VerifyPaymentResponse> => {
      const itemResult = await verifyTransactionStatus(txOrInvoiceId);
      return itemResult.response;
    },
    [verifyTransactionStatus]
  );

  const syncPendingTransactions = useCallback(async (): Promise<PaymentStatusSyncSummary> => {
    const effectiveUserId = activeUserId || fallbackAuth.currentUser?.uid || null;
    const nowIso = new Date().toISOString();

    if (!effectiveUserId && pendingTransactions.length === 0) {
      return {
        checked: 0,
        verified: 0,
        updated: 0,
        results: [],
        syncedAt: nowIso
      };
    }

    setIsCheckingMount(true);
    const results: PaymentStatusSyncItemResult[] = [];
    let checked = 0;
    let verified = 0;
    let updated = 0;

    try {
      // 1. Collect pending transactions from Firestore `user_purchases` collection
      const pendingByKey = new Map<string, { docId?: string; tx: TransactionRecord }>();

      if (effectiveUserId) {
        try {
          const userPurchasesQuery = query(
            collection(db, 'user_purchases'),
            where('userId', '==', effectiveUserId)
          );
          const snapshot = await getDocs(userPurchasesQuery);
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Record<string, any>;
            if (isPendingStatus(data.status) || isPendingStatus(data.paymentStatus)) {
              const invoiceId =
                (typeof data.invoiceId === 'string' && data.invoiceId.trim()) ||
                (typeof data.orderId === 'string' && data.orderId.trim()) ||
                (typeof data.referenceId === 'string' && data.referenceId.trim()) ||
                docSnap.id;

              const txRecord: TransactionRecord = {
                id: data.id || data.purchaseId || docSnap.id,
                purchaseId: data.purchaseId || data.id || docSnap.id,
                userId: data.userId || effectiveUserId,
                userEmail: data.userEmail || '',
                productId: data.productId || docSnap.id,
                productSlug: data.productSlug,
                productTitle: data.productTitle || data.productName || 'Digital Compliance Product',
                productName: data.productName || data.productTitle || 'Digital Compliance Product',
                orderId: data.orderId || invoiceId,
                referenceId: data.referenceId || data.orderId || invoiceId,
                invoiceId,
                transactionId: data.transactionId || invoiceId,
                amount: typeof data.amount === 'number' ? data.amount : Number(data.amount) || 0,
                status: 'pending',
                paymentStatus: 'pending',
                accessStatus: (data.accessStatus as AccessStatus) || 'pending',
                paymentMethod: data.paymentMethod || 'UddoktaPay Gateway',
                date: data.date || data.purchaseDate || nowIso,
                purchaseDate: data.purchaseDate || data.date || nowIso,
                accessExpiryDate: data.accessExpiryDate ?? null,
                lastSyncedAt: data.lastSyncedAt
              };

              pendingByKey.set(invoiceId, { docId: docSnap.id, tx: txRecord });
            }
          });
        } catch (err) {
          logFirestorePermissionError(err, FirestoreOperationType.LIST, 'user_purchases');
        }
      }

      // 2. Merge with any in-memory 'PENDING' transactions in PurchaseContext
      for (const tx of pendingTransactions) {
        const invoiceId = resolveInvoiceIdForTransaction(tx);
        const key = invoiceId || tx.id;
        if (key && !pendingByKey.has(key)) {
          const fallbackDocId =
            tx.userId && tx.productId ? `${tx.userId}_${tx.productId}` : undefined;
          pendingByKey.set(key, { docId: fallbackDocId, tx });
        }
      }

      // 3. Call UddoktaPay Verify Payment API for each pending transaction and update Firestore
      for (const [, entry] of pendingByKey.entries()) {
        const { docId, tx } = entry;
        const invoiceId = resolveInvoiceIdForTransaction(tx);
        if (!invoiceId) continue;

        checked += 1;
        const itemRes = await verifyTransactionStatus(tx, docId);
        if (itemRes.verified) {
          verified += 1;
        }
        if (itemRes.updatedStatus !== 'pending') {
          updated += 1;
        }
        results.push(itemRes);
      }

      const summary: PaymentStatusSyncSummary = {
        checked,
        verified,
        updated,
        results,
        syncedAt: new Date().toISOString()
      };

      setSyncSummary(summary);
      if (onSyncCompleteRef.current && checked > 0) {
        onSyncCompleteRef.current(summary);
      }

      return summary;
    } finally {
      setIsCheckingMount(false);
    }
  }, [activeUserId, pendingTransactions, verifyTransactionStatus]);

  // If a specific invoiceId was passed with verifyBoundInvoiceOnMount: true, verify it on mount
  useEffect(() => {
    if (!boundInvoiceId || !verifyBoundInvoiceOnMount) return;
    if (hasVerifiedBoundInvoiceRef.current === boundInvoiceId) return;
    hasVerifiedBoundInvoiceRef.current = boundInvoiceId;

    verifyTransactionStatus(boundInvoiceId).catch(() => {});
  }, [boundInvoiceId, verifyBoundInvoiceOnMount, verifyTransactionStatus]);

  // Automatically check 'PENDING' transactions in Firestore on component mount when enabled
  useEffect(() => {
    if (!enabled) return;

    const sessionKey = `${activeUserId || 'anon'}_${pendingTransactions.map((t) => t.id).join(',')}`;
    if (hasRunForUserRef.current === sessionKey) return;
    hasRunForUserRef.current = sessionKey;

    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await syncPendingTransactions();
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, activeUserId, pendingTransactions.length, syncPendingTransactions]);

  const activeVerifyingId = localVerifyingId || syncingTransactionId;

  const isVerifyingTransaction = useCallback(
    (txOrId?: string | TransactionRecord): boolean => {
      const checkTarget = txOrId ?? boundInvoiceId;
      if (!activeVerifyingId || !checkTarget) return false;
      if (typeof checkTarget === 'string') {
        return activeVerifyingId === checkTarget;
      }
      const resolvedInvoice = resolveInvoiceIdForTransaction(checkTarget);
      return (
        activeVerifyingId === checkTarget.id ||
        activeVerifyingId === checkTarget.purchaseId ||
        activeVerifyingId === resolvedInvoice ||
        activeVerifyingId === checkTarget.transactionId
      );
    },
    [activeVerifyingId, boundInvoiceId]
  );

  const isBoundInvoiceVerifying = boundInvoiceId
    ? isVerifyingTransaction(boundInvoiceId)
    : false;

  return {
    invoiceId: boundInvoiceId || null,
    status: currentStatus,
    paymentStatus: currentStatus,
    paymentData,
    data: paymentData,
    isSyncing: isCheckingMount || isSyncingPayments || isBoundInvoiceVerifying,
    isVerifying: isBoundInvoiceVerifying || Boolean(localVerifyingId),
    error,
    lastVerifiedResult,
    verifyingTransactionId: activeVerifyingId,
    isVerifyingTransaction,
    isPendingTransaction: isPendingTransactionRecord,
    lastSyncedAt: syncSummary?.syncedAt || lastPaymentSyncAt,
    syncSummary,
    pendingCount: pendingTransactions.length,
    /** Async function that fetches the status for a given invoice_id using verifyPayment and updates the document in the 'payments' Firestore collection */
    syncStatus,
    verifyPayment: verifyTransactionStatus,
    verifyPaymentStatus: verifyTransactionStatus,
    verifyTransactionStatus,
    verifySingleTransaction,
    syncPendingTransactions
  };
}

export default usePaymentStatusSync;

