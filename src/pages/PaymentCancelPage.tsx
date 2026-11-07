import React, { useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ShoppingBag, ShieldCheck, RefreshCw } from 'lucide-react';
import { SEO } from '../components/SEO';
import { getPendingUddoktaCheckout } from '../services/uddoktapayService';

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
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <SEO
        title="Payment Cancelled - UddoktaPay Hosted"
        description="Payment session was cancelled. No charges were incurred."
      />

      <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-center p-8 sm:p-10 space-y-6">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <AlertTriangle className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900">Payment Process Cancelled</h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
            Your UddoktaPay automated checkout was cancelled or closed before completion. No deductions were made from your bKash, Nagad, Rocket, or card account.
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs text-slate-500 font-mono space-y-1 text-left">
          <div className="flex justify-between">
            <span className="text-slate-400">Status:</span>
            <span className="font-bold text-amber-700">TRANSACTION_ABORTED</span>
          </div>
          {reference && (
            <div className="flex justify-between">
              <span className="text-slate-400">Reference:</span>
              <span className="font-semibold text-slate-700">{reference}</span>
            </div>
          )}
          {amount && (
            <div className="flex justify-between">
              <span className="text-slate-400">Amount:</span>
              <span className="font-semibold text-slate-700">৳{amount} BDT</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={() => navigate(retryUrl)}
            className="w-full px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 transform active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Payment {amount ? `(৳${amount})` : ''}</span>
          </button>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/tools"
              className="w-full sm:w-1/2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Compliance Tools</span>
            </Link>
            <Link
              to="/"
              className="w-full sm:w-1/2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go to Homepage</span>
            </Link>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Protected by Accounticca Verified Security & UddoktaPay</span>
        </div>
      </div>
    </div>
  );
};

