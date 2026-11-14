import React, { useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ShoppingBag, ShieldCheck, RefreshCw } from 'lucide-react';
import { SEO } from '../components/SEO';
import { getPendingUddoktaCheckout } from '../services/uddoktapayService';
import { ContactPageShell } from '../components/layout/ContactPageShell';

export const PaymentCancelPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryAmount = searchParams.get('amount') || '';
  const queryName = searchParams.get('name') || searchParams.get('full_name') || '';
  const queryEmail = searchParams.get('email') || searchParams.get('customer_email') || '';
  const queryPhone = searchParams.get('phone') || searchParams.get('mobile') || '';
  const queryRef = searchParams.get('reference') || searchParams.get('reference_id') || searchParams.get('order_id') || '';
  const queryProduct = searchParams.get('product') || searchParams.get('slug') || '';
  const queryInvoice = searchParams.get('invoice_id') || searchParams.get('session_id') || '';

  // Pull transaction data from session / pending checkout service if URL params are sparse
  const pendingSnapshot = useMemo(() => {
    if (queryInvoice) {
      const snap = getPendingUddoktaCheckout(queryInvoice);
      if (snap) return snap;
    }
    try {
      const raw = localStorage.getItem('accounticca_pending_uddoktapay_checkouts');
      if (raw) {
        const list = JSON.parse(raw);
        if (list && list.length > 0) return list[0];
      }
    } catch {
      // ignore
    }
    return null;
  }, [queryInvoice]);

  const amount = queryAmount || (pendingSnapshot?.amount ? String(pendingSnapshot.amount) : '');
  const name = queryName || pendingSnapshot?.fullName || '';
  const email = queryEmail || pendingSnapshot?.email || '';
  const phone = queryPhone || pendingSnapshot?.phone || '';
  const reference = queryRef || pendingSnapshot?.invoiceId || '';
  const product = queryProduct || pendingSnapshot?.flowType || '';

  // Build retry search params
  const retryParams = new URLSearchParams();
  if (amount) retryParams.set('amount', amount);
  if (name) retryParams.set('name', name);
  if (email) retryParams.set('email', email);
  if (phone) retryParams.set('phone', phone);
  if (reference) retryParams.set('reference', reference);
  if (product) retryParams.set('product', product);

  const retryUrl = `/paymently?${retryParams.toString()}`;

  return (
    <>
      <SEO
        title="Payment Cancelled - UddoktaPay Hosted"
        description="Payment session was cancelled. No charges were incurred."
      />

      <ContactPageShell
        breadcrumbs={[
          { label: 'Checkout', path: '/checkout' },
          { label: 'Payment Cancelled' },
        ]}
        eyebrow="Payment Settlement Status · UddoktaPay Hosted"
        headline="Payment Process"
        accentHeadline="Cancelled"
        description="Your automated checkout session was cancelled or closed before completion. Zero charges were processed on your MFS wallet or card."
        metaItems={[
          reference ? `Reference: ${reference}` : 'Status: TRANSACTION_ABORTED',
          amount ? `Amount: ৳${amount} BDT` : 'No Charges Incurred',
        ]}
        actions={
          <button
            type="button"
            onClick={() => navigate(retryUrl)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span>Retry Payment {amount ? `(৳${amount})` : ''}</span>
          </button>
        }
        summaryCard={{
          eyebrow: 'Transaction Summary',
          title: amount ? `৳${amount} BDT` : 'No Deduction Made',
          description: reference
            ? `Session reference ${reference} remains saved so you can resume settlement anytime.`
            : 'Resume payment settlement or browse compliance tools without losing your cart.',
          icon: <AlertTriangle className="h-5 w-5" aria-hidden="true" />,
          actions: [
            {
              label: 'Retry Payment',
              onClick: () => navigate(retryUrl),
              icon: <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />,
            },
            {
              label: 'Compliance Tools',
              to: '/tools',
              variant: 'neutral',
              icon: <ShoppingBag className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />,
            },
          ],
          footerIcon: <ShieldCheck className="h-4 w-4" aria-hidden="true" />,
          footerText: 'Protected by Accounticca Verified Security & UddoktaPay',
        }}
      >
        <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden text-center p-8 sm:p-10 space-y-6">
          <div className="w-16 h-16 bg-amber-50 text-amber-700 rounded-2xl border border-amber-200 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">No Charges Were Incurred</h2>
            <p className="text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
              Your UddoktaPay automated checkout was closed before completion. No deductions were made from your bKash, Nagad, Rocket, or card account.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs text-slate-600 font-mono space-y-1.5 text-left">
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="font-bold text-amber-700">TRANSACTION_ABORTED</span>
            </div>
            {reference && (
              <div className="flex justify-between">
                <span className="text-slate-400">Reference:</span>
                <span className="font-semibold text-slate-800">{reference}</span>
              </div>
            )}
            {amount && (
              <div className="flex justify-between">
                <span className="text-slate-400">Amount:</span>
                <span className="font-semibold text-slate-800">৳{amount} BDT</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(retryUrl)}
              className="w-full px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Payment {amount ? `(৳${amount})` : ''}</span>
            </button>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/tools"
                className="w-full sm:w-1/2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Compliance Tools</span>
              </Link>
              <Link
                to="/"
                className="w-full sm:w-1/2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Go to Homepage</span>
              </Link>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Protected by Accounticca Verified Security &amp; UddoktaPay</span>
          </div>
        </div>
      </ContactPageShell>
    </>
  );
};

