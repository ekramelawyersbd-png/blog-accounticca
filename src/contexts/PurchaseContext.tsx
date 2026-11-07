import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db, fallbackAuth } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { SHOP_PRODUCTS, ShopProduct } from '../data/shopProducts';
import { generatePdfReceipt } from '../utils/receiptGenerator';
import {
  verifyUddoktaPayPayment,
  getPendingUddoktaCheckout,
  fetchUddoktaPayInvoices,
  VerifyPaymentResponse
} from '../services/uddoktapayService';

export type PaymentStatus = 'completed' | 'pending' | 'refunded' | 'failed';
export type AccessStatus = 'active' | 'pending' | 'revoked';
export type ProductAccessState = 'completed' | 'pending' | 'none';

export interface TransactionRecord {
  id: string;
  purchaseId: string;
  userId: string;
  userEmail?: string;
  productId: string;
  productSlug?: string;
  productTitle: string;
  productName: string;
  orderId: string;
  referenceId?: string;
  invoiceId?: string;
  transactionId: string;
  amount: number;
  status: 'completed' | 'pending' | 'refunded';
  paymentStatus: PaymentStatus;
  accessStatus: AccessStatus;
  paymentMethod: string;
  date: string;
  purchaseDate: string;
  accessExpiryDate: string | null;
  lastSyncedAt?: string;
  refundedAt?: string;
  refundReason?: string;
}

export interface PurchaseOptions {
  productSlug?: string;
  orderId?: string;
  invoiceId?: string;
  transactionId?: string;
  userIdOverride?: string;
  userEmailOverride?: string;
  userNameOverride?: string;
  accessExpiryDate?: string | null;
}

interface PurchaseContextType {
  activeUserId: string | null;
  activeUserEmail: string | null;
  isUserLoggedIn: boolean;
  purchasedProductIds: string[];
  pendingProductIds: string[];
  transactions: TransactionRecord[];
  isSyncingPayments: boolean;
  syncingTransactionId: string | null;
  lastPaymentSyncAt: string | null;
  autoSyncEnabled: boolean;
  setAutoSyncEnabled: (enabled: boolean) => void;
  isPurchased: (productIdOrSlug: string) => boolean;
  isPendingPurchase: (productIdOrSlug: string) => boolean;
  getProductAccessState: (productIdOrSlug: string) => ProductAccessState;
  getPurchaseRecord: (productIdOrSlug: string) => TransactionRecord | undefined;
  purchaseProduct: (
    productId: string,
    productTitle?: string,
    amount?: number,
    paymentMethod?: string,
    status?: 'completed' | 'pending',
    options?: PurchaseOptions
  ) => TransactionRecord | null;
  simulateInstantPurchase: (product: ShopProduct) => void;
  verifyPendingTransaction: (transactionId: string) => Promise<VerifyPaymentResponse | void>;
  syncTransactionWithUddoktaPay: (txOrId: string | TransactionRecord) => Promise<VerifyPaymentResponse>;
  syncAllPendingTransactions: () => Promise<{ checked: number; verified: number; updated: number }>;
  downloadReceipt: (tx: TransactionRecord) => void;
  processRefund: (transactionId: string, refundReason?: string) => void;
  bindCheckoutIdentity: (email: string, name?: string) => string;
}

const PurchaseContext = createContext<PurchaseContextType | null>(null);

const LEGACY_STORAGE_KEY = 'accounticca_purchased_products';
const LEGACY_TRANSACTIONS_KEY = 'accounticca_payment_history';
const CHECKOUT_IDENTITY_KEY = 'accounticca_checkout_client_identity';
const AUTO_SYNC_STORAGE_KEY = 'accounticca_uddoktapay_autosync_enabled';

const getUserTransactionsKey = (userId: string) => `accounticca_user_tx_${userId}`;
const getEmailTransactionsKey = (email: string) => `accounticca_email_tx_${email.trim().toLowerCase()}`;

export function resolveInvoiceIdForTransaction(tx: Partial<TransactionRecord>): string {
  if (tx.invoiceId && tx.invoiceId.trim()) {
    return tx.invoiceId.trim();
  }
  const candidateKeys = [tx.orderId, tx.referenceId, tx.transactionId, tx.id, tx.purchaseId].filter(Boolean) as string[];
  for (const key of candidateKeys) {
    const pendingSnap = getPendingUddoktaCheckout(key);
    if (pendingSnap?.invoiceId) {
      return pendingSnap.invoiceId;
    }
  }
  return (tx.orderId || tx.referenceId || tx.transactionId || tx.id || tx.purchaseId || '').trim();
}

function createDeterministicUserIdFromEmail(email: string): string {
  const clean = email.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  return `USR-${Math.abs(hash).toString(36).toUpperCase()}-${clean.replace(/[^a-z0-9]/g, '').slice(0, 10)}`;
}

function resolveCanonicalProduct(productIdOrSlug: string): { id: string; slug: string; title: string } {
  const clean = (productIdOrSlug || '').trim();
  const found = SHOP_PRODUCTS.find(
    (p) =>
      p.id === clean ||
      p.slug === clean ||
      p.title.toLowerCase() === clean.toLowerCase() ||
      (p.coursePath && p.coursePath === clean)
  );
  if (found) {
    return { id: found.id, slug: found.slug, title: found.title };
  }
  return { id: clean, slug: clean, title: clean || 'Digital Compliance Product' };
}

function normalizeTransactionRecord(raw: any, fallbackUserId: string): TransactionRecord {
  const canonical = resolveCanonicalProduct(raw.productId || raw.productSlug || raw.productTitle || raw.id);
  const rawStatusLower = String(raw.status || '').trim().toLowerCase();
  const rawPaymentStatusLower = String(raw.paymentStatus || '').trim().toLowerCase();

  const status: 'completed' | 'pending' | 'refunded' =
    rawStatusLower === 'refunded' || rawPaymentStatusLower === 'refunded'
      ? 'refunded'
      : rawStatusLower === 'pending' || rawPaymentStatusLower === 'pending'
      ? 'pending'
      : 'completed';

  const paymentStatus: PaymentStatus = status;

  const accessStatus: AccessStatus =
    raw.accessStatus ||
    (status === 'completed' ? 'active' : status === 'pending' ? 'pending' : 'revoked');

  const dateIso = raw.purchaseDate || raw.date || new Date().toISOString();
  const orderId = raw.orderId || raw.referenceId || `ACC-${new Date().getFullYear()}-100001`;
  const purchaseId = raw.purchaseId || raw.id || `PUR-${Date.now()}`;
  const resolvedInvoiceId =
    raw.invoiceId ||
    getPendingUddoktaCheckout(orderId)?.invoiceId ||
    orderId;

  return {
    id: purchaseId,
    purchaseId,
    userId: raw.userId || fallbackUserId,
    userEmail: raw.userEmail || '',
    productId: raw.productId || canonical.id,
    productSlug: raw.productSlug || canonical.slug,
    productTitle: raw.productTitle || raw.productName || canonical.title,
    productName: raw.productName || raw.productTitle || canonical.title,
    orderId,
    referenceId: orderId,
    invoiceId: resolvedInvoiceId,
    transactionId: raw.transactionId || `PAY-TXN-1000001`,
    amount: typeof raw.amount === 'number' ? raw.amount : Number(raw.amount) || 0,
    status,
    paymentStatus,
    accessStatus,
    paymentMethod: raw.paymentMethod || 'SSL Secure Gateway',
    date: dateIso,
    purchaseDate: dateIso,
    accessExpiryDate: raw.accessExpiryDate ?? null,
    lastSyncedAt: raw.lastSyncedAt,
    refundedAt: raw.refundedAt,
    refundReason: raw.refundReason
  };
}

function deduplicateTransactions(txs: TransactionRecord[]): TransactionRecord[] {
  const byKey = new Map<string, TransactionRecord>();
  for (const tx of txs) {
    // Key by productId + status priority or purchaseId
    const key = tx.purchaseId || tx.id;
    if (!byKey.has(key)) {
      byKey.set(key, tx);
    } else {
      const existing = byKey.get(key)!;
      // Prefer updated status (e.g. refunded or completed over pending)
      if (tx.status !== existing.status || (tx.lastSyncedAt && (!existing.lastSyncedAt || tx.lastSyncedAt > existing.lastSyncedAt))) {
        byKey.set(key, tx);
      }
    }
  }
  return Array.from(byKey.values()).sort(
    (a, b) => new Date(b.purchaseDate || b.date).getTime() - new Date(a.purchaseDate || a.date).getTime()
  );
}

export const usePurchases = () => {
  const context = useContext(PurchaseContext);
  if (!context) {
    throw new Error('usePurchases must be used within a PurchaseProvider');
  }
  return context;
};

export const PurchaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, authUser } = useAuth();

  // Optional checkout identity if a customer completed checkout with email before full OAuth login
  const [checkoutIdentity, setCheckoutIdentity] = useState<{
    uid: string;
    email: string;
    name?: string;
  } | null>(() => {
    try {
      const saved = localStorage.getItem(CHECKOUT_IDENTITY_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  // Clear legacy global non-user-scoped keys once so hardcoded defaults never leak across users
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      localStorage.removeItem(LEGACY_TRANSACTIONS_KEY);
    } catch {}
  }, []);

  // When user logs out of Firebase Auth, also clear any temporary checkout identity
  const prevAuthUidRef = React.useRef<string | null>(null);
  useEffect(() => {
    const currentFirebaseUid = user?.uid || authUser?.uid || null;
    if (prevAuthUidRef.current && !currentFirebaseUid) {
      // User explicitly logged out
      setCheckoutIdentity(null);
      try {
        localStorage.removeItem(CHECKOUT_IDENTITY_KEY);
      } catch {}
    }
    prevAuthUidRef.current = currentFirebaseUid;
  }, [user?.uid, authUser?.uid]);

  const activeUserId = useMemo<string | null>(() => {
    if (user?.uid) return user.uid;
    if (authUser?.uid) return authUser.uid;
    if (checkoutIdentity?.uid) return checkoutIdentity.uid;
    return null;
  }, [user?.uid, authUser?.uid, checkoutIdentity?.uid]);

  const activeUserEmail = useMemo<string | null>(() => {
    const raw =
      user?.email ||
      authUser?.email ||
      user?.providerData?.[0]?.email ||
      checkoutIdentity?.email ||
      null;
    return raw ? raw.trim().toLowerCase() : null;
  }, [user, authUser, checkoutIdentity]);

  const isUserLoggedIn = Boolean(activeUserId);

  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);

  // Load user-specific purchases from localStorage and merge email-matched purchases on login
  useEffect(() => {
    if (!activeUserId) {
      setTransactions([]);
      return;
    }

    let merged: TransactionRecord[] = [];
    try {
      const userSaved = localStorage.getItem(getUserTransactionsKey(activeUserId));
      if (userSaved) {
        const parsed = JSON.parse(userSaved);
        if (Array.isArray(parsed)) {
          merged.push(...parsed.map((item) => normalizeTransactionRecord(item, activeUserId)));
        }
      }

      if (activeUserEmail) {
        const emailSaved = localStorage.getItem(getEmailTransactionsKey(activeUserEmail));
        if (emailSaved) {
          const parsedEmail = JSON.parse(emailSaved);
          if (Array.isArray(parsedEmail)) {
            const normalizedEmailTxs = parsedEmail.map((item) =>
              normalizeTransactionRecord({ ...item, userId: activeUserId, userEmail: activeUserEmail }, activeUserId)
            );
            merged.push(...normalizedEmailTxs);
          }
        }
      }
    } catch {}

    const deduped = deduplicateTransactions(merged);
    setTransactions(deduped);

    try {
      localStorage.setItem(getUserTransactionsKey(activeUserId), JSON.stringify(deduped));
      if (activeUserEmail) {
        localStorage.setItem(getEmailTransactionsKey(activeUserEmail), JSON.stringify(deduped));
      }
    } catch {}
  }, [activeUserId, activeUserEmail]);

  // Real-time Firestore synchronization for the logged-in user's purchases
  useEffect(() => {
    if (!activeUserId) return;

    const q = query(collection(db, 'user_purchases'), where('userId', '==', activeUserId));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) return;
        const remoteRecords: TransactionRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          remoteRecords.push(normalizeTransactionRecord({ ...data, id: docSnap.id }, activeUserId));
        });

        setTransactions((prev) => {
          const combined = deduplicateTransactions([...remoteRecords, ...prev]);
          try {
            localStorage.setItem(getUserTransactionsKey(activeUserId), JSON.stringify(combined));
            if (activeUserEmail) {
              localStorage.setItem(getEmailTransactionsKey(activeUserEmail), JSON.stringify(combined));
            }
          } catch {}
          return combined;
        });
      },
      () => {
        // Silent fallback to user-scoped local cache if offline
      }
    );

    return () => unsubscribe();
  }, [activeUserId, activeUserEmail]);

  // Listen to cross-tab storage updates for instant synchronization across browser tabs/pages
  useEffect(() => {
    const handleStorageSync = (e: StorageEvent) => {
      if (!activeUserId) return;
      if (e.key === getUserTransactionsKey(activeUserId) && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setTransactions(deduplicateTransactions(parsed.map((item) => normalizeTransactionRecord(item, activeUserId))));
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageSync);
    return () => window.removeEventListener('storage', handleStorageSync);
  }, [activeUserId]);

  const persistTransactionsForUser = useCallback(
    (uid: string, email: string | null, updated: TransactionRecord[]) => {
      try {
        localStorage.setItem(getUserTransactionsKey(uid), JSON.stringify(updated));
        if (email) {
          localStorage.setItem(getEmailTransactionsKey(email), JSON.stringify(updated));
        }
      } catch {}
    },
    []
  );

  const persistRecordToFirestore = useCallback(
    async (record: TransactionRecord) => {
      const targetUid = record.userId || activeUserId || fallbackAuth.currentUser?.uid;
      if (!targetUid || !record.productId) return;
      const docId = `${targetUid}_${record.productId}`;
      const docRef = doc(db, 'user_purchases', docId);
      const payload = {
        ...record,
        userId: targetUid,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      };
      try {
        await setDoc(docRef, payload, { merge: true });
      } catch {
        // Offline cache will synchronize when network is available
      }

      const authUid = user?.uid || fallbackAuth.currentUser?.uid;
      if (authUid && targetUid === authUid) {
        try {
          await setDoc(doc(db, 'payments', docId), payload, { merge: true });
        } catch {
          // Non-blocking if user is not signed in with Firebase Auth
        }
      }
    },
    [activeUserId, user?.uid]
  );

  // Derived list of verified & active product IDs for the currently logged-in user
  const purchasedProductIds = useMemo<string[]>(() => {
    if (!activeUserId) return [];
    const ids = new Set<string>();
    for (const tx of transactions) {
      if (
        tx.userId === activeUserId &&
        tx.paymentStatus === 'completed' &&
        tx.accessStatus === 'active'
      ) {
        if (tx.productId) ids.add(tx.productId);
        if (tx.productSlug) ids.add(tx.productSlug);
        const canonical = resolveCanonicalProduct(tx.productId || tx.productTitle);
        if (canonical.id) ids.add(canonical.id);
        if (canonical.slug) ids.add(canonical.slug);
      }
    }
    return Array.from(ids);
  }, [activeUserId, transactions]);

  // Derived list of pending product IDs for the currently logged-in user
  const pendingProductIds = useMemo<string[]>(() => {
    if (!activeUserId) return [];
    const ids = new Set<string>();
    for (const tx of transactions) {
      if (
        tx.userId === activeUserId &&
        (tx.paymentStatus === 'pending' || tx.accessStatus === 'pending')
      ) {
        if (tx.productId && !purchasedProductIds.includes(tx.productId)) {
          ids.add(tx.productId);
        }
        if (tx.productSlug && !purchasedProductIds.includes(tx.productSlug)) {
          ids.add(tx.productSlug);
        }
        const canonical = resolveCanonicalProduct(tx.productId || tx.productTitle);
        if (canonical.id && !purchasedProductIds.includes(canonical.id)) {
          ids.add(canonical.id);
        }
        if (canonical.slug && !purchasedProductIds.includes(canonical.slug)) {
          ids.add(canonical.slug);
        }
      }
    }
    return Array.from(ids);
  }, [activeUserId, transactions, purchasedProductIds]);

  const isPurchased = useCallback(
    (productIdOrSlug: string): boolean => {
      if (!activeUserId || !productIdOrSlug) return false;
      const clean = productIdOrSlug.trim();
      if (purchasedProductIds.includes(clean)) return true;
      const canonical = resolveCanonicalProduct(clean);
      return purchasedProductIds.includes(canonical.id) || purchasedProductIds.includes(canonical.slug);
    },
    [activeUserId, purchasedProductIds]
  );

  const isPendingPurchase = useCallback(
    (productIdOrSlug: string): boolean => {
      if (!activeUserId || !productIdOrSlug) return false;
      if (isPurchased(productIdOrSlug)) return false;
      const clean = productIdOrSlug.trim();
      if (pendingProductIds.includes(clean)) return true;
      const canonical = resolveCanonicalProduct(clean);
      return pendingProductIds.includes(canonical.id) || pendingProductIds.includes(canonical.slug);
    },
    [activeUserId, pendingProductIds, isPurchased]
  );

  const getProductAccessState = useCallback(
    (productIdOrSlug: string): ProductAccessState => {
      if (!activeUserId || !productIdOrSlug) return 'none';
      if (isPurchased(productIdOrSlug)) return 'completed';
      if (isPendingPurchase(productIdOrSlug)) return 'pending';
      return 'none';
    },
    [activeUserId, isPurchased, isPendingPurchase]
  );

  const getPurchaseRecord = useCallback(
    (productIdOrSlug: string): TransactionRecord | undefined => {
      if (!activeUserId || !productIdOrSlug) return undefined;
      const canonical = resolveCanonicalProduct(productIdOrSlug);
      return transactions.find(
        (tx) =>
          tx.userId === activeUserId &&
          (tx.productId === productIdOrSlug ||
            tx.productSlug === productIdOrSlug ||
            tx.productId === canonical.id ||
            tx.productSlug === canonical.slug ||
            tx.productTitle.toLowerCase() === canonical.title.toLowerCase())
      );
    },
    [activeUserId, transactions]
  );

  const bindCheckoutIdentity = useCallback(
    (email: string, name?: string): string => {
      const cleanEmail = email.trim().toLowerCase();
      if (user?.uid) return user.uid;
      if (authUser?.uid) return authUser.uid;
      const deterministicUid = createDeterministicUserIdFromEmail(cleanEmail);
      const identity = { uid: deterministicUid, email: cleanEmail, name };
      setCheckoutIdentity(identity);
      try {
        localStorage.setItem(CHECKOUT_IDENTITY_KEY, JSON.stringify(identity));
      } catch {}
      return deterministicUid;
    },
    [user?.uid, authUser?.uid]
  );

  const purchaseProduct = useCallback(
    (
      productId: string,
      productTitle: string = 'Digital Compliance Product',
      amount: number = 1500,
      paymentMethod: string = 'SSL Secure Gateway',
      status: 'completed' | 'pending' = 'completed',
      options?: PurchaseOptions
    ): TransactionRecord | null => {
      const canonical = resolveCanonicalProduct(productId || productTitle);
      const resolvedEmail = (
        options?.userEmailOverride ||
        activeUserEmail ||
        ''
      )
        .trim()
        .toLowerCase();

      let targetUserId = options?.userIdOverride || activeUserId;
      if (!targetUserId && resolvedEmail) {
        targetUserId = bindCheckoutIdentity(resolvedEmail, options?.userNameOverride);
      }
      if (!targetUserId) {
        // Fallback session user ID if neither Firebase Auth nor email was provided
        targetUserId = bindCheckoutIdentity('client@accounticca.com', 'Verified Client');
      }

      const nowIso = new Date().toISOString();
      const orderId =
        options?.orderId ||
        `ACC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const invoiceId =
        options?.invoiceId ||
        getPendingUddoktaCheckout(orderId)?.invoiceId ||
        orderId;
      const txId =
        options?.transactionId ||
        `PAY-TXN-${Math.floor(1000000 + Math.random() * 9000000)}`;
      const purchaseDocId = `PUR-${targetUserId.slice(0, 12)}-${canonical.id}`;

      const paymentStatus: PaymentStatus = status === 'pending' ? 'pending' : 'completed';
      const accessStatus: AccessStatus = status === 'pending' ? 'pending' : 'active';

      const newRecord: TransactionRecord = {
        id: purchaseDocId,
        purchaseId: purchaseDocId,
        userId: targetUserId,
        userEmail: resolvedEmail,
        productId: canonical.id,
        productSlug: options?.productSlug || canonical.slug,
        productTitle: productTitle || canonical.title,
        productName: productTitle || canonical.title,
        orderId,
        referenceId: orderId,
        invoiceId,
        transactionId: txId,
        amount,
        status,
        paymentStatus,
        accessStatus,
        paymentMethod,
        date: nowIso,
        purchaseDate: nowIso,
        accessExpiryDate: options?.accessExpiryDate ?? null
      };

      setTransactions((prev) => {
        // Prevent duplicate active purchase records for the same user + product
        const existingCompleted = prev.find(
          (item) =>
            item.userId === targetUserId &&
            (item.productId === canonical.id || item.productSlug === canonical.slug) &&
            item.paymentStatus === 'completed' &&
            item.accessStatus === 'active'
        );
        if (existingCompleted && status === 'completed') {
          return prev;
        }

        const filtered = prev.filter(
          (item) =>
            !(
              item.userId === targetUserId &&
              (item.productId === canonical.id || item.productSlug === canonical.slug)
            )
        );
        const updated = deduplicateTransactions([newRecord, ...filtered]);
        persistTransactionsForUser(targetUserId!, resolvedEmail || null, updated);
        return updated;
      });

      // Persist to Firestore user_purchases collection
      persistRecordToFirestore(newRecord).catch(() => {});

      return newRecord;
    },
    [activeUserId, activeUserEmail, bindCheckoutIdentity, persistTransactionsForUser, persistRecordToFirestore]
  );

  const simulateInstantPurchase = useCallback(
    (product: ShopProduct) => {
      purchaseProduct(product.id, product.title, product.price, 'SSL Secure Gateway', 'completed', {
        productSlug: product.slug
      });
    },
    [purchaseProduct]
  );

  const [isSyncingPayments, setIsSyncingPayments] = useState(false);
  const [syncingTransactionId, setSyncingTransactionId] = useState<string | null>(null);
  const [lastPaymentSyncAt, setLastPaymentSyncAt] = useState<string | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabledState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(AUTO_SYNC_STORAGE_KEY);
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  const setAutoSyncEnabled = useCallback((enabled: boolean) => {
    setAutoSyncEnabledState(enabled);
    try {
      localStorage.setItem(AUTO_SYNC_STORAGE_KEY, String(enabled));
    } catch {}
  }, []);

  const syncTransactionWithUddoktaPay = useCallback(
    async (txOrId: string | TransactionRecord): Promise<VerifyPaymentResponse> => {
      const targetTx =
        typeof txOrId === 'string'
          ? transactions.find(
              (t) =>
                t.id === txOrId ||
                t.purchaseId === txOrId ||
                t.invoiceId === txOrId ||
                t.orderId === txOrId ||
                t.referenceId === txOrId ||
                t.transactionId === txOrId
            )
          : txOrId;

      const resolvedInvoiceId = targetTx
        ? resolveInvoiceIdForTransaction(targetTx)
        : String(txOrId).trim();

      const trackingId = targetTx?.id || resolvedInvoiceId;
      setSyncingTransactionId(trackingId);

      try {
        const verifyRes = await verifyUddoktaPayPayment(resolvedInvoiceId);
        const nowIso = new Date().toISOString();
        setLastPaymentSyncAt(nowIso);

        const rawStatusUpper = String(verifyRes.status_code || verifyRes.status || '').toUpperCase();
        const isRefunded = rawStatusUpper === 'REFUNDED';
        const isCompleted =
          !isRefunded &&
          (Boolean(verifyRes.verified) ||
            rawStatusUpper === 'COMPLETED' ||
            verifyRes.status === true);

        const effectiveUserId = activeUserId || targetTx?.userId || fallbackAuth.currentUser?.uid || 'client';
        const firestoreUpdates: TransactionRecord[] = [];

        const buildUpdatedTx = (tx: TransactionRecord): TransactionRecord => {
          const nextStatus: TransactionRecord['status'] = isRefunded
            ? 'refunded'
            : isCompleted
            ? 'completed'
            : tx.status;

          const nextPaymentStatus: PaymentStatus = isRefunded
            ? 'refunded'
            : isCompleted
            ? 'completed'
            : tx.paymentStatus;

          const nextAccessStatus: AccessStatus = isRefunded
            ? 'revoked'
            : isCompleted
            ? 'active'
            : tx.accessStatus;

          const syncedMethod = verifyRes.payment_method
            ? verifyRes.payment_method.toLowerCase().includes('uddoktapay')
              ? verifyRes.payment_method
              : `UddoktaPay (${verifyRes.payment_method})`
            : tx.paymentMethod;

          return {
            ...tx,
            userId: tx.userId || effectiveUserId,
            invoiceId: verifyRes.invoice_id || resolvedInvoiceId,
            transactionId: verifyRes.transaction_id || tx.transactionId,
            paymentMethod: syncedMethod,
            status: nextStatus,
            paymentStatus: nextPaymentStatus,
            accessStatus: nextAccessStatus,
            lastSyncedAt: nowIso,
            ...(isRefunded
              ? {
                  refundedAt: tx.refundedAt || nowIso,
                  refundReason: tx.refundReason || verifyRes.message || 'Refunded via UddoktaPay'
                }
              : {})
          };
        };

        setTransactions((prev) => {
          let matchedAny = false;
          const updated = prev.map((tx) => {
            const isMatch =
              (targetTx && (tx.id === targetTx.id || tx.purchaseId === targetTx.purchaseId)) ||
              tx.invoiceId === resolvedInvoiceId ||
              tx.orderId === resolvedInvoiceId ||
              tx.referenceId === resolvedInvoiceId ||
              tx.transactionId === resolvedInvoiceId ||
              tx.id === resolvedInvoiceId;

            if (!isMatch) return tx;
            matchedAny = true;
            const updatedTx = buildUpdatedTx(tx);
            firestoreUpdates.push(updatedTx);
            return updatedTx;
          });

          if (!matchedAny && targetTx) {
            const insertedTx = buildUpdatedTx(targetTx);
            firestoreUpdates.push(insertedTx);
            const merged = deduplicateTransactions([insertedTx, ...updated]);
            if (activeUserId) {
              persistTransactionsForUser(activeUserId, activeUserEmail, merged);
            }
            return merged;
          }

          if (activeUserId) {
            persistTransactionsForUser(activeUserId, activeUserEmail, updated);
          }
          return updated;
        });

        if (firestoreUpdates.length === 0 && targetTx) {
          firestoreUpdates.push(buildUpdatedTx(targetTx));
        }

        await Promise.all(
          firestoreUpdates.map((record) => persistRecordToFirestore(record))
        );

        return verifyRes;
      } finally {
        setSyncingTransactionId(null);
      }
    },
    [transactions, activeUserId, activeUserEmail, persistTransactionsForUser, persistRecordToFirestore]
  );

  const verifyPendingTransaction = useCallback(
    async (transactionId: string) => {
      if (!activeUserId) return;
      return await syncTransactionWithUddoktaPay(transactionId);
    },
    [activeUserId, syncTransactionWithUddoktaPay]
  );

  const syncAllPendingTransactions = useCallback(async (): Promise<{
    checked: number;
    verified: number;
    updated: number;
  }> => {
    if (!activeUserId) {
      return { checked: 0, verified: 0, updated: 0 };
    }

    setIsSyncingPayments(true);
    let checked = 0;
    let verified = 0;
    let updatedCount = 0;

    try {
      // 1. Fetch server-side UddoktaPay invoice ledger to reconcile any refunded/completed invoices
      const ledgerInvoices = await fetchUddoktaPayInvoices();
      const ledgerByKey = new Map<string, any>();
      for (const inv of ledgerInvoices) {
        if (inv.invoice_id) ledgerByKey.set(inv.invoice_id, inv);
        if (inv.session_id) ledgerByKey.set(inv.session_id, inv);
        if (inv.transaction_id) ledgerByKey.set(inv.transaction_id, inv);
        if (inv.metadata?.order_id) ledgerByKey.set(String(inv.metadata.order_id), inv);
        if (inv.metadata?.invoice_id) ledgerByKey.set(String(inv.metadata.invoice_id), inv);
      }

      // 2. Verify pending transactions via UddoktaPay /verify-payment API using invoice_id
      const pendingList = transactions.filter((t) => t.status === 'pending');
      for (const pendingTx of pendingList) {
        checked += 1;
        const res = await syncTransactionWithUddoktaPay(pendingTx);
        if (res.verified || String(res.status_code || res.status).toUpperCase() === 'COMPLETED') {
          verified += 1;
          updatedCount += 1;
        }
      }

      // 3. Reconcile any existing transactions whose status changed in the UddoktaPay ledger (e.g. REFUNDED)
      if (ledgerByKey.size > 0) {
        const nowIso = new Date().toISOString();
        setTransactions((prev) => {
          let changed = false;
          const nextList = prev.map((tx) => {
            const invoiceKey = resolveInvoiceIdForTransaction(tx);
            const matchedInv =
              ledgerByKey.get(invoiceKey) ||
              ledgerByKey.get(tx.orderId) ||
              (tx.referenceId ? ledgerByKey.get(tx.referenceId) : undefined) ||
              ledgerByKey.get(tx.transactionId);

            if (!matchedInv) return tx;

            if (matchedInv.status === 'REFUNDED' && tx.status !== 'refunded') {
              changed = true;
              updatedCount += 1;
              return {
                ...tx,
                invoiceId: matchedInv.invoice_id || invoiceKey,
                transactionId: matchedInv.transaction_id || tx.transactionId,
                status: 'refunded' as const,
                paymentStatus: 'refunded' as PaymentStatus,
                accessStatus: 'revoked' as AccessStatus,
                refundedAt: matchedInv.refunded_at || nowIso,
                refundReason: matchedInv.refund_reason || 'Refunded via UddoktaPay',
                lastSyncedAt: nowIso
              };
            }

            if (matchedInv.status === 'COMPLETED' && tx.status === 'pending') {
              changed = true;
              verified += 1;
              updatedCount += 1;
              return {
                ...tx,
                invoiceId: matchedInv.invoice_id || invoiceKey,
                transactionId: matchedInv.transaction_id || tx.transactionId,
                status: 'completed' as const,
                paymentStatus: 'completed' as PaymentStatus,
                accessStatus: 'active' as AccessStatus,
                lastSyncedAt: nowIso
              };
            }

            return tx;
          });

          if (changed) {
            persistTransactionsForUser(activeUserId, activeUserEmail, nextList);
          }
          return changed ? nextList : prev;
        });
      }

      setLastPaymentSyncAt(new Date().toISOString());
      return { checked, verified, updated: updatedCount };
    } finally {
      setIsSyncingPayments(false);
    }
  }, [activeUserId, activeUserEmail, transactions, syncTransactionWithUddoktaPay, persistTransactionsForUser]);

  // Recurring background check: automatically polls UddoktaPay Verify Payment API for pending invoices
  useEffect(() => {
    if (!activeUserId || !autoSyncEnabled) return;

    const hasPending = transactions.some((t) => t.status === 'pending');
    if (!hasPending) return;

    const timer = window.setInterval(() => {
      syncAllPendingTransactions().catch(() => {});
    }, 15000);

    return () => window.clearInterval(timer);
  }, [activeUserId, autoSyncEnabled, transactions, syncAllPendingTransactions]);

  const downloadReceipt = useCallback((tx: TransactionRecord) => {
    generatePdfReceipt(tx);
  }, []);

  const processRefund = useCallback(
    (transactionId: string, refundReason: string = 'Admin processed refund') => {
      setTransactions((prev) => {
        const updated = prev.map((tx) => {
          if (tx.transactionId === transactionId || tx.id === transactionId || tx.purchaseId === transactionId) {
            const refundedTx: TransactionRecord = {
              ...tx,
              status: 'refunded',
              paymentStatus: 'refunded',
              accessStatus: 'revoked',
              refundedAt: new Date().toISOString(),
              refundReason
            };
            persistRecordToFirestore(refundedTx).catch(() => {});
            return refundedTx;
          }
          return tx;
        });
        if (activeUserId) {
          persistTransactionsForUser(activeUserId, activeUserEmail, updated);
        }
        return updated;
      });
    },
    [activeUserId, activeUserEmail, persistTransactionsForUser, persistRecordToFirestore]
  );

  return (
    <PurchaseContext.Provider
      value={{
        activeUserId,
        activeUserEmail,
        isUserLoggedIn,
        purchasedProductIds,
        pendingProductIds,
        transactions,
        isSyncingPayments,
        syncingTransactionId,
        lastPaymentSyncAt,
        autoSyncEnabled,
        setAutoSyncEnabled,
        isPurchased,
        isPendingPurchase,
        getProductAccessState,
        getPurchaseRecord,
        purchaseProduct,
        simulateInstantPurchase,
        verifyPendingTransaction,
        syncTransactionWithUddoktaPay,
        syncAllPendingTransactions,
        downloadReceipt,
        processRefund,
        bindCheckoutIdentity
      }}
    >
      {children}
    </PurchaseContext.Provider>
  );
};
