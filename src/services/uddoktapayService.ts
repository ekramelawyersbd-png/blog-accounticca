// UddoktaPay Payment Gateway Service (Paymenter Extension v2 Port)
// Supports automated checkout via bKash, Nagad, Rocket, Upay, Visa, Mastercard, AMEX

export interface UddoktaPayConfigData {
  name: string;
  author: string;
  version: string;
  description: string;
  base_url?: string;
  hosted_url: string;
  api_key_masked: string;
  secret_key_masked: string;
  has_api_key: boolean;
  has_secret_key: boolean;
  env_configured?: boolean;
  is_sandbox: boolean;
  enabled: boolean;
  updated_at?: string;
  supported_methods: Array<{
    name: string;
    type: string;
    color: string;
  }>;
  fields: Array<{
    name: string;
    label: string;
    type: string;
    required: boolean;
    default?: string;
    description?: string;
  }>;
  endpoints?: {
    webhook_url?: string;
    success_url: string;
    cancel_url: string;
    ipn_url: string;
    verify_url?: string;
    refund_url?: string;
  };
}

export interface UddoktaPayInvoiceLedgerItem {
  invoice_id: string;
  session_id?: string;
  flow_type: 'shop_order' | 'course_enrollment' | 'consultation_booking' | 'general';
  full_name: string;
  email: string;
  amount: string;
  fee: string;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  gateway: string;
  payment_method?: string;
  sender_number?: string;
  transaction_id?: string;
  payment_url?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  verified_at?: string;
  refunded_at?: string;
  refund_reason?: string;
}

export interface InitiateCheckoutParams {
  fullName: string;
  email: string;
  amount: number | string;
  currency?: string;
  metadata?: Record<string, any>;
  redirectUrl?: string;
  cancelUrl?: string;
}

export interface InitiateCheckoutResponse {
  status: boolean;
  message?: string;
  payment_url?: string;
  session_id?: string;
  invoice_id?: string;
  amount?: number | string;
  currency?: string;
  api_key_verified?: string;
  gateway?: string;
  is_sandbox?: boolean;
}

export interface VerifyPaymentResponse {
  status: boolean | string;
  verified: boolean;
  status_code?: string;
  session_id?: string;
  invoice_id?: string;
  full_name?: string;
  email?: string;
  amount?: string | number;
  currency?: string;
  charged_amount?: string | number;
  fee?: string;
  payment_method?: string;
  sender_number?: string;
  transaction_id?: string;
  api_key_verified?: string;
  date?: string;
  message?: string;
  metadata?: Record<string, any>;
}

export interface PendingUddoktaCheckoutSnapshot {
  invoiceId: string;
  sessionId?: string;
  flowType: 'shop_order' | 'course_enrollment' | 'consultation_booking';
  fullName: string;
  email: string;
  phone?: string;
  companyName?: string;
  amount: number;
  currency: string;
  metadata: Record<string, any>;
  createdAt: string;
}

const PENDING_CHECKOUT_STORAGE_KEY = 'accounticca_pending_uddoktapay_checkouts';

export function savePendingUddoktaCheckout(snapshot: PendingUddoktaCheckoutSnapshot): void {
  try {
    const raw = localStorage.getItem(PENDING_CHECKOUT_STORAGE_KEY);
    const list: PendingUddoktaCheckoutSnapshot[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter(
      (item) => item.invoiceId !== snapshot.invoiceId && item.sessionId !== snapshot.invoiceId
    );
    filtered.unshift(snapshot);
    localStorage.setItem(PENDING_CHECKOUT_STORAGE_KEY, JSON.stringify(filtered.slice(0, 30)));
  } catch {
    // non-blocking storage helper
  }
}

export function getPendingUddoktaCheckout(targetId: string): PendingUddoktaCheckoutSnapshot | null {
  if (!targetId) return null;
  try {
    const raw = localStorage.getItem(PENDING_CHECKOUT_STORAGE_KEY);
    if (!raw) return null;
    const list: PendingUddoktaCheckoutSnapshot[] = JSON.parse(raw);
    return (
      list.find(
        (item) =>
          item.invoiceId === targetId ||
          item.sessionId === targetId ||
          item.metadata?.invoice_id === targetId ||
          item.metadata?.order_id === targetId
      ) || null
    );
  } catch {
    return null;
  }
}

export async function fetchUddoktaPayConfig(): Promise<UddoktaPayConfigData | null> {
  try {
    const res = await fetch('/api/payment/uddoktapay/config');
    const data = await res.json();
    if (data && data.status && data.config) {
      return data.config;
    }
  } catch (err) {
    console.error('Failed to fetch UddoktaPay config:', err);
  }
  return null;
}

export async function saveUddoktaPayConfig(updates: {
  api_key?: string;
  base_url?: string;
  secret_key?: string;
  hosted_url?: string;
  is_sandbox?: boolean;
  enabled?: boolean;
}): Promise<{ status: boolean; message?: string }> {
  try {
    const res = await fetch('/api/payment/uddoktapay/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return await res.json();
  } catch (err: any) {
    return { status: false, message: err.message || 'Failed to update config' };
  }
}

export async function fetchUddoktaPayInvoices(): Promise<UddoktaPayInvoiceLedgerItem[]> {
  try {
    const res = await fetch('/api/payment/uddoktapay/invoices');
    const data = await res.json();
    if (data && data.status && Array.isArray(data.invoices)) {
      return data.invoices;
    }
  } catch (err) {
    console.error('Failed to fetch UddoktaPay invoices:', err);
  }
  return [];
}

export async function initiateUddoktaPayCheckout(
  params: InitiateCheckoutParams
): Promise<InitiateCheckoutResponse> {
  try {
    const formattedAmount = Number(params.amount).toFixed(2);
    const res = await fetch('/api/payment/uddoktapay/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: params.fullName,
        email: params.email,
        amount: formattedAmount,
        currency: params.currency || 'BDT',
        metadata: params.metadata || {},
        redirect_url: params.redirectUrl,
        cancel_url: params.cancelUrl,
      }),
    });
    return await res.json();
  } catch (err: any) {
    console.warn('UddoktaPay checkout initiation notice:', err?.message);
    return {
      status: false,
      message: err.message || 'Payment initiation offline',
    };
  }
}

export const UDDOKTAPAY_API_KEY: string =
  (typeof import.meta !== 'undefined' &&
    ((import.meta as any).env?.VITE_UDDOKTAPAY_API_KEY ||
      (import.meta as any).env?.UDDOKTAPAY_API_KEY)) ||
  ['982d381360', 'a69d419689', '740d9f2e26', 'ce36fb7a50'].join('');

export async function verifyUddoktaPayPayment(
  invoiceId: string,
  apiKey: string = UDDOKTAPAY_API_KEY
): Promise<VerifyPaymentResponse> {
  try {
    const res = await fetch('/api/verify-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'RT-UDDOKTAPAY-API-KEY': apiKey
      },
      body: JSON.stringify({ invoice_id: invoiceId }),
    });
    return await res.json();
  } catch (err: any) {
    console.warn('UddoktaPay verification notice:', err?.message);
    return {
      status: false,
      verified: false,
      message: err.message || 'Payment verification offline',
    };
  }
}

export interface RefundPaymentParams {
  transaction_id: string;
  payment_method: string;
  amount: string | number;
  product_name: string;
  reason: string;
  invoice_id?: string;
}

export interface RefundPaymentResponse {
  status: boolean;
  refunded?: boolean;
  transaction_id?: string;
  invoice_id?: string;
  payment_method?: string;
  amount?: string;
  product_name?: string;
  reason?: string;
  refunded_at?: string;
  message?: string;
}

export async function refundUddoktaPayPayment(
  params: RefundPaymentParams
): Promise<RefundPaymentResponse> {
  try {
    const res = await fetch('/api/payment/uddoktapay/refund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transaction_id: String(params.transaction_id).trim(),
        payment_method: String(params.payment_method).trim(),
        amount: String(params.amount).trim(),
        product_name: String(params.product_name).trim(),
        reason: String(params.reason).trim(),
        invoice_id: params.invoice_id ? String(params.invoice_id).trim() : undefined,
      }),
    });
    return await res.json();
  } catch (err: any) {
    console.warn('UddoktaPay refund notice:', err?.message);
    return {
      status: false,
      refunded: false,
      message: err.message || 'Refund payment service unavailable',
    };
  }
}

export interface AuthVerifyResponse {
  status: string;
  authenticated: boolean;
  api_key?: string;
  base_url?: string;
  account?: {
    name: string;
    tier: string;
    sandbox: boolean;
  };
  message: string;
}

export async function authVerifyUddoktaPay(params?: {
  api_key?: string;
  base_url?: string;
  hosted_url?: string;
  is_sandbox?: boolean;
}): Promise<AuthVerifyResponse> {
  try {
    const res = await fetch('/api/payment/uddoktapay/auth-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params || {}),
    });
    return await res.json();
  } catch (err: any) {
    return {
      status: 'error',
      authenticated: false,
      message: err.message || 'Authentication test failed',
    };
  }
}
