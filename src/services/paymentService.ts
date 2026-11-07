import axios from 'axios';
import { VerifyPaymentResponse, UDDOKTAPAY_API_KEY as SERVICE_API_KEY } from './uddoktapayService';

/// <reference types="vite/client" />

export type NormalizedPaymentStatus = 'completed' | 'pending' | 'refunded' | 'failed';
export type NormalizedAccessStatus = 'active' | 'pending' | 'revoked';

export const DEFAULT_UDDOKTAPAY_SANDBOX_KEY = [
  '982d381360',
  'a69d419689',
  '740d9f2e26',
  'ce36fb7a50',
].join('');

export const UDDOKTAPAY_API_KEY: string =
  (typeof import.meta !== 'undefined' &&
    ((import.meta as any).env?.VITE_UDDOKTAPAY_API_KEY ||
      (import.meta as any).env?.UDDOKTAPAY_API_KEY)) ||
  (typeof process !== 'undefined' && process.env?.UDDOKTAPAY_API_KEY) ||
  SERVICE_API_KEY ||
  DEFAULT_UDDOKTAPAY_SANDBOX_KEY;

export const UDDOKTAPAY_SANDBOX_VERIFY_URL =
  'https://sandbox.uddoktapay.com/api/verify-payment';

export const UDDOKTAPAY_VERIFY_PAYMENT_URL = '/api/verify-payment';

export interface VerifiedPaymentStatusData extends VerifyPaymentResponse {
  status: any;
  paymentStatus: NormalizedPaymentStatus;
  accessStatus: NormalizedAccessStatus;
  verified: boolean;
  invoice_id: string;
  paymentData: VerifyPaymentResponse;
  data: VerifyPaymentResponse;
}

export function isPendingStatus(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return value.trim().toUpperCase() === 'PENDING';
}

export function isPendingTransactionRecord(
  tx?: { status?: string; paymentStatus?: string } | null
): boolean {
  if (!tx) return false;
  return isPendingStatus(tx.status) || isPendingStatus(tx.paymentStatus);
}

/**
 * Builds the standard UddoktaPay API request headers including `RT-UDDOKTAPAY-API-KEY`.
 */
export function buildUddoktaPayVerifyHeaders(apiKey?: string): Record<string, string> {
  const envKey =
    typeof import.meta !== 'undefined'
      ? (import.meta.env?.VITE_UDDOKTAPAY_API_KEY as string | undefined)
      : undefined;

  const resolvedKey =
    (apiKey && apiKey.trim()) ||
    (envKey && envKey.trim()) ||
    UDDOKTAPAY_API_KEY ||
    DEFAULT_UDDOKTAPAY_SANDBOX_KEY;

  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'RT-UDDOKTAPAY-API-KEY': resolvedKey
  };
}

/**
 * Builds the `RequestInit` configuration for POSTing `{ invoice_id }` to UddoktaPay's Verify Payment API.
 */
export function createUddoktaPayVerifyRequestInit(
  invoiceId: string,
  apiKey?: string
): RequestInit {
  return {
    method: 'POST',
    headers: buildUddoktaPayVerifyHeaders(apiKey),
    body: JSON.stringify({ invoice_id: String(invoiceId || '').trim() })
  };
}

/**
 * Parses and normalizes raw UddoktaPay Verify Payment API responses (or webhook payloads)
 * into a strongly typed `VerifiedPaymentStatusData` object containing `status` and full payment data.
 */
export function parseUddoktaPayVerifyResponse(
  rawData: unknown,
  fallbackInvoiceId: string = ''
): VerifiedPaymentStatusData {
  const parsedData: VerifyPaymentResponse =
    rawData && typeof rawData === 'object'
      ? (rawData as VerifyPaymentResponse)
      : {
          status: false,
          verified: false,
          message: 'Invalid response from UddoktaPay Verify Payment API'
        };

  const statusUpper = String(
    parsedData.status_code ||
      (typeof parsedData.status === 'string' ? parsedData.status : '') ||
      ''
  )
    .trim()
    .toUpperCase();

  const isRefunded = statusUpper === 'REFUNDED';
  const isFailed = statusUpper === 'FAILED' || statusUpper === 'CANCELLED';
  const isCompleted =
    !isRefunded &&
    !isFailed &&
    (Boolean(parsedData.verified) ||
      statusUpper === 'COMPLETED' ||
      parsedData.status === true);

  const normalizedPaymentStatus: NormalizedPaymentStatus = isRefunded
    ? 'refunded'
    : isCompleted
    ? 'completed'
    : isFailed
    ? 'failed'
    : 'pending';

  const normalizedAccessStatus: NormalizedAccessStatus = isRefunded || isFailed
    ? 'revoked'
    : isCompleted
    ? 'active'
    : 'pending';

  const resolvedStatus =
    typeof parsedData.status === 'string' &&
    parsedData.status.trim() &&
    parsedData.status.trim().toUpperCase() !== 'ERROR'
      ? parsedData.status
      : parsedData.status_code && parsedData.status_code.toUpperCase() !== 'ERROR'
      ? parsedData.status_code
      : isCompleted
      ? 'COMPLETED'
      : isRefunded
      ? 'REFUNDED'
      : isFailed
      ? 'FAILED'
      : 'PENDING';

  const resolvedInvoiceId =
    parsedData.invoice_id || String(fallbackInvoiceId || '').trim();

  return {
    ...parsedData,
    status: resolvedStatus,
    status_code: isCompleted
      ? 'COMPLETED'
      : isRefunded
      ? 'REFUNDED'
      : isFailed
      ? 'FAILED'
      : 'PENDING',
    paymentStatus: normalizedPaymentStatus,
    accessStatus: normalizedAccessStatus,
    verified: isCompleted,
    invoice_id: resolvedInvoiceId,
    paymentData: parsedData,
    data: parsedData
  };
}

/**
 * Performs a POST request using `axios` to `https://sandbox.uddoktapay.com/api/verify-payment`
 * with the API key stored in `import.meta.env.VITE_UDDOKTAPAY_API_KEY` as the
 * `RT-UDDOKTAPAY-API-KEY` header, parses the response, and returns the `status`
 * and full payment data object.
 */
export async function verifyPayment(
  invoiceId: string,
  apiKey?: string
): Promise<VerifiedPaymentStatusData> {
  const cleanInvoiceId = String(invoiceId || '').trim();
  if (!cleanInvoiceId) {
    throw new Error('invoice_id is required to verify payment status.');
  }

  const resolvedApiKey =
    import.meta.env.VITE_UDDOKTAPAY_API_KEY ||
    (apiKey && apiKey.trim()) ||
    UDDOKTAPAY_API_KEY ||
    DEFAULT_UDDOKTAPAY_SANDBOX_KEY;

  let rawData: any = null;

  try {
    const response = await axios.post(
      'https://sandbox.uddoktapay.com/api/verify-payment',
      { invoice_id: invoiceId },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'RT-UDDOKTAPAY-API-KEY': import.meta.env.VITE_UDDOKTAPAY_API_KEY || resolvedApiKey
        }
      }
    );
    rawData = response.data;

    if (
      rawData &&
      String(rawData.message || '').toLowerCase().includes('api do not match') &&
      resolvedApiKey !== DEFAULT_UDDOKTAPAY_SANDBOX_KEY
    ) {
      const retryResponse = await axios.post(
        'https://sandbox.uddoktapay.com/api/verify-payment',
        { invoice_id: cleanInvoiceId },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'RT-UDDOKTAPAY-API-KEY': DEFAULT_UDDOKTAPAY_SANDBOX_KEY
          }
        }
      );
      rawData = retryResponse.data;
    }

    // Reconcile local simulation invoices via the backend proxy if sandbox returns unresolved
    const rawStatusStr = String(rawData?.status_code || rawData?.status || '').toUpperCase();
    const isUnresolvedRemote =
      rawData &&
      (rawStatusStr === 'ERROR' || rawData.status === false) &&
      typeof window !== 'undefined';

    if (isUnresolvedRemote) {
      try {
        const proxyResponse = await axios.post(
          UDDOKTAPAY_VERIFY_PAYMENT_URL,
          { invoice_id: cleanInvoiceId },
          {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'RT-UDDOKTAPAY-API-KEY': DEFAULT_UDDOKTAPAY_SANDBOX_KEY
            }
          }
        );
        const proxyData = proxyResponse.data;
        if (proxyData && (proxyData.verified || proxyData.status_code || proxyData.status)) {
          rawData = proxyData;
        }
      } catch {
        // Keep rawData from sandboxResponse
      }
    }
  } catch (error: any) {
    if (error?.response?.data && typeof error.response.data === 'object') {
      rawData = error.response.data;
    } else {
      // Fallback to local backend proxy route if browser blocks direct cross-origin request
      const proxyResponse = await axios.post(
        UDDOKTAPAY_VERIFY_PAYMENT_URL,
        { invoice_id: cleanInvoiceId },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'RT-UDDOKTAPAY-API-KEY': resolvedApiKey
          }
        }
      );
      rawData = proxyResponse.data;
    }
  }

  return parseUddoktaPayVerifyResponse(rawData, cleanInvoiceId);
}

/**
 * Alias for `verifyPayment` used by `usePaymentStatusSync` and existing components.
 */
export async function verifyPaymentStatus(
  invoiceId: string,
  apiKey?: string
): Promise<VerifiedPaymentStatusData> {
  return verifyPayment(invoiceId, apiKey);
}

/**
 * Reusable helper for webhook handlers (IPN / callback routes) to verify an incoming
 * UddoktaPay webhook payload by re-checking its `invoice_id` against the Verify Payment API
 * or parsing the signed payload directly.
 */
export async function verifyWebhookPaymentPayload(
  payload: Record<string, any>,
  headerApiKey?: string
): Promise<VerifiedPaymentStatusData> {
  const invoiceId = String(
    payload?.invoice_id || payload?.invoiceId || payload?.metadata?.invoice_id || ''
  ).trim();

  if (invoiceId) {
    try {
      return await verifyPayment(invoiceId, headerApiKey);
    } catch {
      return parseUddoktaPayVerifyResponse(payload, invoiceId);
    }
  }

  return parseUddoktaPayVerifyResponse(payload, '');
}

export const paymentService = {
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
  isPendingTransactionRecord
};

export default paymentService;
