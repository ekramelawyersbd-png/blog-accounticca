import React from 'react';
import { CheckCircle2, Clock, AlertCircle, RotateCcw, RefreshCw } from 'lucide-react';
import { PaymentStatus } from '../../contexts/PurchaseContext';
import { NormalizedPaymentStatus } from '../../services/paymentService';

export type BadgeStatusType =
  | PaymentStatus
  | NormalizedPaymentStatus
  | 'completed'
  | 'pending'
  | 'failed'
  | 'refunded'
  | 'cancelled'
  | 'active'
  | 'revoked'
  | string;

export interface PaymentStatusBadgeProps {
  /** The payment status or transaction status string */
  status?: BadgeStatusType;
  /** Optional custom display label (if not provided, derived and capitalized from status) */
  label?: string;
  /** Whether the payment status is currently syncing or verifying */
  isSyncing?: boolean;
  isLoading?: boolean;
  /** Whether to display the status icon (default: true) */
  showIcon?: boolean;
  /** Size variant: 'sm' | 'md' | 'lg' (default: 'md') */
  size?: 'sm' | 'md' | 'lg';
  /** Optional custom CSS class name */
  className?: string;
}

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({
  status = 'pending',
  label,
  isSyncing = false,
  isLoading = false,
  showIcon = true,
  size = 'md',
  className = ''
}) => {
  const statusStr = String(status || 'pending').trim().toLowerCase();

  const isCompleted =
    statusStr === 'completed' ||
    statusStr === 'success' ||
    statusStr === 'active' ||
    statusStr === 'paid' ||
    statusStr === 'verified';

  const isRefunded = statusStr === 'refunded';

  const isFailed =
    statusStr === 'failed' ||
    statusStr === 'cancelled' ||
    statusStr === 'canceled' ||
    statusStr === 'revoked' ||
    statusStr === 'error';

  const isPending = !isCompleted && !isRefunded && !isFailed;

  const activeLoading = isSyncing || isLoading;

  // Format display label
  const defaultLabel = isCompleted
    ? 'Completed'
    : isRefunded
    ? 'Refunded'
    : isFailed
    ? 'Failed'
    : 'Pending';

  const displayLabel = label || defaultLabel;

  // Size styling
  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px] gap-1'
      : size === 'lg'
      ? 'px-3.5 py-1.5 text-xs gap-2'
      : 'px-2.5 py-1 text-[11px] gap-1.5';

  // Color coding (Green for completed, Yellow/Amber for pending, Red/Rose for failed/refunded)
  const colorClasses = isCompleted
    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
    : isRefunded || isFailed
    ? 'bg-rose-50 text-rose-800 border-rose-200'
    : 'bg-amber-50 text-amber-800 border-amber-200';

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full border shadow-2xs transition-all ${sizeClasses} ${colorClasses} ${className}`}
      title={`Payment Status: ${displayLabel}${activeLoading ? ' (Syncing...)' : ''}`}
    >
      {showIcon && (
        <>
          {activeLoading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600 shrink-0" />
          ) : isCompleted ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          ) : isRefunded ? (
            <RotateCcw className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          ) : isFailed ? (
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          ) : (
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          )}
        </>
      )}
      <span>{activeLoading ? 'Syncing...' : displayLabel}</span>
    </span>
  );
};

export default PaymentStatusBadge;
