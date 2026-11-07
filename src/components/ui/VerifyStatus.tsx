import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, Clock, AlertCircle, RotateCcw } from 'lucide-react';
import {
  verifyPayment,
  VerifiedPaymentStatusData,
  isPendingStatus
} from '../../services/paymentService';
import { usePaymentStatusSync, PaymentStatusSyncItemResult } from '../../hooks/usePaymentStatusSync';
import { TransactionRecord, resolveInvoiceIdForTransaction } from '../../contexts/PurchaseContext';

export interface VerifyStatusProps {
  /** The UddoktaPay invoice_id to verify */
  invoiceId?: string;
  /** Alternative snake_case invoice_id prop */
  invoice_id?: string;
  /** Current status of the transaction (e.g., 'PENDING', 'COMPLETED', 'REFUNDED') */
  status?: string;
  /** Optional full transaction record for Firestore synchronization */
  transaction?: TransactionRecord | Record<string, any>;
  /** Button label when status is PENDING (defaults to 'Verify Payment') */
  buttonLabel?: string;
  /** Whether to display the status badge alongside or after verification */
  showStatusBadge?: boolean;
  /** Whether to also sync the verified result to Firestore via usePaymentStatusSync (default: true) */
  syncWithFirestore?: boolean;
  /** Callback fired when verification completes with the updated status and full payment data */
  onStatusChange?: (
    updatedStatus: string,
    paymentData: VerifiedPaymentStatusData,
    syncResult?: PaymentStatusSyncItemResult
  ) => void;
  /** Callback compatible with existing row verification handlers */
  onVerified?: (
    syncResult: PaymentStatusSyncItemResult & { paymentData: VerifiedPaymentStatusData }
  ) => void;
  /** Callback fired when an error occurs during verification */
  onError?: (error: any) => void;
  /** Custom button className override */
  className?: string;
  /** Compact size variant */
  compact?: boolean;
}

export const VerifyStatus: React.FC<VerifyStatusProps> = ({
  invoiceId,
  invoice_id,
  status,
  transaction,
  buttonLabel = 'Verify Payment',
  showStatusBadge = true,
  syncWithFirestore = true,
  onStatusChange,
  onVerified,
  onError,
  className = '',
  compact = false
}) => {
  const resolvedInvoiceId =
    invoiceId ||
    invoice_id ||
    (transaction ? resolveInvoiceIdForTransaction(transaction as any) : '') ||
    '';

  const initialStatus =
    status ||
    transaction?.status ||
    transaction?.paymentStatus ||
    'PENDING';

  const [currentStatus, setCurrentStatus] = useState<string>(String(initialStatus));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [paymentData, setPaymentData] = useState<VerifiedPaymentStatusData | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { syncStatus } = usePaymentStatusSync(resolvedInvoiceId);

  useEffect(() => {
    const nextStatus = status || transaction?.status || transaction?.paymentStatus;
    if (nextStatus) {
      setCurrentStatus(String(nextStatus));
    }
  }, [status, transaction?.status, transaction?.paymentStatus]);

  const isPending = isPendingStatus(currentStatus);

  const handleVerifyPayment = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!resolvedInvoiceId || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);
    setFeedbackMessage(null);

    try {
      // 1. Call the verifyPayment service (uses axios POST to https://sandbox.uddoktapay.com/api/verify-payment)
      const verifiedResponse = await verifyPayment(resolvedInvoiceId);
      setPaymentData(verifiedResponse);

      const nextDisplayStatus = String(
        verifiedResponse.status_code ||
          verifiedResponse.status ||
          verifiedResponse.paymentStatus ||
          currentStatus
      ).toUpperCase();

      setCurrentStatus(nextDisplayStatus);

      // 2. Sync with Firestore ('payments' and 'user_purchases') & PurchaseContext state if enabled
      let firestoreSyncResult: PaymentStatusSyncItemResult | undefined;
      if (syncWithFirestore) {
        try {
          firestoreSyncResult = await syncStatus(
            resolvedInvoiceId,
            transaction as TransactionRecord | undefined
          );
          if (firestoreSyncResult?.updatedStatus) {
            setCurrentStatus(firestoreSyncResult.updatedStatus.toUpperCase());
          }
        } catch {
          // Keep direct verifyPayment result even if Firestore sync encounters a transient issue
        }
      }

      const finalStatus = firestoreSyncResult?.updatedStatus
        ? firestoreSyncResult.updatedStatus.toUpperCase()
        : nextDisplayStatus;

      if (verifiedResponse.verified || finalStatus === 'COMPLETED') {
        setFeedbackMessage('Payment Verified');
      } else if (finalStatus === 'REFUNDED') {
        setFeedbackMessage('Payment Refunded');
      } else {
        setFeedbackMessage(
          verifiedResponse.message || `Status: ${finalStatus}`
        );
      }

      if (onStatusChange) {
        onStatusChange(finalStatus, verifiedResponse, firestoreSyncResult);
      }

      if (onVerified) {
        const mappedStatus: 'completed' | 'pending' | 'refunded' =
          verifiedResponse.paymentStatus === 'refunded'
            ? 'refunded'
            : verifiedResponse.paymentStatus === 'completed'
            ? 'completed'
            : 'pending';

        const fallbackResult: PaymentStatusSyncItemResult = firestoreSyncResult || {
          ...verifiedResponse,
          status: mappedStatus,
          paymentStatus: mappedStatus,
          updatedStatus: mappedStatus,
          previousStatus: String(initialStatus || 'pending').toLowerCase(),
          verified: verifiedResponse.verified,
          transactionId: String(
            verifiedResponse.transaction_id || transaction?.transactionId || resolvedInvoiceId
          ),
          invoiceId: verifiedResponse.invoice_id || resolvedInvoiceId,
          productTitle: String(transaction?.productTitle || 'Service Payment'),
          firestoreDocIdsUpdated: [],
          response: verifiedResponse,
          paymentData: verifiedResponse,
          data: verifiedResponse
        };
        onVerified({
          ...fallbackResult,
          paymentData: verifiedResponse
        });
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to verify payment status with UddoktaPay.';
      setErrorMessage(msg);
      if (onError) {
        onError(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const normalizedUpper = String(currentStatus || '').trim().toUpperCase();

  return (
    <div
      className="inline-flex items-center gap-2 flex-wrap"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Display 'Verify Payment' action button whenever the transaction status is 'PENDING' */}
      {isPending && (
        <button
          type="button"
          onClick={handleVerifyPayment}
          disabled={isLoading || !resolvedInvoiceId}
          className={
            className ||
            `inline-flex items-center justify-center gap-1.5 ${
              compact ? 'px-2.5 py-1.5 text-[11px]' : 'px-3.5 py-2 text-xs'
            } rounded-xl font-bold bg-amber-600 hover:bg-amber-700 text-white border border-amber-600 shadow-xs transition-all cursor-pointer disabled:opacity-60`
          }
          title={`Verify payment status with UddoktaPay API (invoice_id: ${resolvedInvoiceId})`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Verifying...' : buttonLabel}</span>
        </button>
      )}

      {/* Reflect updated status in the UI after verification or when showStatusBadge is enabled */}
      {!isPending && showStatusBadge && paymentData && (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
            normalizedUpper === 'COMPLETED'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : normalizedUpper === 'REFUNDED'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          {normalizedUpper === 'COMPLETED' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          ) : normalizedUpper === 'REFUNDED' ? (
            <RotateCcw className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          ) : (
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          )}
          <span>{feedbackMessage || normalizedUpper}</span>
        </span>
      )}

      {/* If still PENDING after a check, show subtle status feedback */}
      {isPending && feedbackMessage && !errorMessage && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600 shrink-0" />
          <span>{feedbackMessage}</span>
        </span>
      )}

      {/* Error message reflection */}
      {errorMessage && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </span>
      )}
    </div>
  );
};

export default VerifyStatus;
