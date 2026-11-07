import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  RotateCcw,
  Copy,
  Check,
  FileText,
  Printer,
  Eye,
  ExternalLink,
  ShieldCheck,
  Building2,
  X,
  AlertCircle,
  Plus,
  RefreshCw,
  Sparkles,
  Activity
} from 'lucide-react';
import {
  usePurchases,
  TransactionRecord,
  resolveInvoiceIdForTransaction
} from '../../contexts/PurchaseContext';
import { usePaymentStatusSync } from '../../hooks/usePaymentStatusSync';
import { VerifyStatus } from '../ui/VerifyStatus';
import { generatePdfReceipt } from '../../utils/receiptGenerator';
import { SHOP_PRODUCTS } from '../../data/shopProducts';

interface PaymentHistoryProps {
  compact?: boolean;
  limit?: number;
  onViewAll?: () => void;
}

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({
  compact = false,
  limit,
  onViewAll
}) => {
  const {
    transactions,
    downloadReceipt,
    purchaseProduct,
    processRefund,
    isSyncingPayments,
    lastPaymentSyncAt,
    autoSyncEnabled,
    setAutoSyncEnabled,
    syncAllPendingTransactions
  } = usePurchases();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'completed' | 'pending' | 'refunded'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewTransaction, setPreviewTransaction] = useState<TransactionRecord | null>(null);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [verifyFeedback, setVerifyFeedback] = useState<{
    type: 'success' | 'info' | 'error';
    title: string;
    message: string;
    invoiceId?: string;
  } | null>(null);

  // Automatically check 'PENDING' transactions in Firestore on component mount via UddoktaPay Verify Payment API
  // and provide verifyTransactionStatus for 'Verify Status' action buttons on PENDING transactions
  const {
    isSyncing: isHookSyncing,
    isVerifyingTransaction,
    isPendingTransaction,
    verifyTransactionStatus,
    syncPendingTransactions
  } = usePaymentStatusSync({
    enabled: true,
    onSyncComplete: (summary) => {
      if (summary.verified > 0 || summary.updated > 0) {
        setVerifyFeedback({
          type: 'success',
          title: 'Pending Transactions Automatically Verified',
          message: `Synced ${summary.checked} pending Firestore transaction(s) on load via UddoktaPay Verify Payment API (${summary.verified} verified).`
        });
      }
    }
  });

  // New simulated payment form state
  const [simTitle, setSimTitle] = useState('Corporate Legal Retainer & Compliance Advisory');
  const [simAmount, setSimAmount] = useState('5000');
  const [simMethod, setSimMethod] = useState('UddoktaPay (bKash)');
  const [simStatus, setSimStatus] = useState<'completed' | 'pending'>('pending');
  const [simInvoiceId, setSimInvoiceId] = useState('');

  // Auto-dismiss verification feedback after 6 seconds
  useEffect(() => {
    if (!verifyFeedback) return;
    const timer = window.setTimeout(() => setVerifyFeedback(null), 6000);
    return () => window.clearTimeout(timer);
  }, [verifyFeedback]);

  // Keep previewTransaction synchronized if its status updates in transactions
  useEffect(() => {
    if (!previewTransaction) return;
    const updated = transactions.find(
      (t) => t.id === previewTransaction.id || t.purchaseId === previewTransaction.purchaseId
    );
    if (updated && (updated.status !== previewTransaction.status || updated.lastSyncedAt !== previewTransaction.lastSyncedAt)) {
      setPreviewTransaction(updated);
    }
  }, [transactions, previewTransaction]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesStatus = selectedStatus === 'all' || tx.status === selectedStatus;
      const query = searchQuery.toLowerCase().trim();
      const invoiceId = resolveInvoiceIdForTransaction(tx).toLowerCase();
      const matchesQuery = !query ||
        tx.productTitle.toLowerCase().includes(query) ||
        tx.transactionId.toLowerCase().includes(query) ||
        invoiceId.includes(query) ||
        (tx.referenceId && tx.referenceId.toLowerCase().includes(query)) ||
        tx.paymentMethod.toLowerCase().includes(query);

      return matchesStatus && matchesQuery;
    });
  }, [transactions, selectedStatus, searchQuery]);

  const displayedTransactions = limit ? filteredTransactions.slice(0, limit) : filteredTransactions;

  // Aggregate metrics
  const metrics = useMemo(() => {
    const totalPaid = transactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const totalPending = transactions
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const paidCount = transactions.filter(t => t.status === 'completed').length;
    const pendingCount = transactions.filter(t => t.status === 'pending').length;
    const refundedCount = transactions.filter(t => t.status === 'refunded').length;

    return { totalPaid, totalPending, paidCount, pendingCount, refundedCount, total: transactions.length };
  }, [transactions]);

  const handleCopy = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (e: React.MouseEvent, tx: TransactionRecord) => {
    e.stopPropagation();
    setDownloadingId(tx.id);
    try {
      generatePdfReceipt(tx);
    } catch (err) {
      console.error('Error generating PDF receipt:', err);
      downloadReceipt(tx);
    } finally {
      setTimeout(() => setDownloadingId(null), 1500);
    }
  };

  const handleVerificationResult = (
    tx: TransactionRecord,
    invoiceId: string,
    itemResult: any
  ) => {
    const res = itemResult.response;
    const rawStatus = String(res.status_code || res.status || '').toUpperCase();
    if (rawStatus === 'REFUNDED' || itemResult.updatedStatus === 'refunded') {
      setVerifyFeedback({
        type: 'info',
        title: 'Payment Status Synced to Firestore: Refunded',
        message: `UddoktaPay Verify Payment API reported invoice_id "${res.invoice_id || invoiceId}" as REFUNDED. Transaction status updated in Firestore.`,
        invoiceId: res.invoice_id || invoiceId
      });
    } else if (itemResult.verified || res.verified || rawStatus === 'COMPLETED') {
      setVerifyFeedback({
        type: 'success',
        title: 'Payment Verified & Updated in Firestore',
        message: `Verified invoice_id "${res.invoice_id || invoiceId}" (${res.payment_method || tx.paymentMethod} • TrxID: ${res.transaction_id || tx.transactionId}) via usePaymentStatusSync and updated status in Firestore.`,
        invoiceId: res.invoice_id || invoiceId
      });
    } else {
      setVerifyFeedback({
        type: 'info',
        title: 'Verification Check Complete',
        message: res.message || `Invoice "${invoiceId}" is currently ${rawStatus || 'PENDING'}. Firestore record timestamp updated.`,
        invoiceId
      });
    }
  };

  const handleVerificationError = (invoiceId: string, err: any) => {
    setVerifyFeedback({
      type: 'error',
      title: 'Verification Request Failed',
      message: err?.message || `Could not verify invoice_id "${invoiceId}" at this moment.`,
      invoiceId
    });
  };

  const handleVerifySingleTransaction = async (e: React.MouseEvent, tx: TransactionRecord) => {
    e.stopPropagation();
    const invoiceId = resolveInvoiceIdForTransaction(tx);
    try {
      const itemResult = await verifyTransactionStatus(invoiceId);
      handleVerificationResult(tx, invoiceId, itemResult);
    } catch (err: any) {
      handleVerificationError(invoiceId, err);
    }
  };

  const handleSyncAll = async () => {
    try {
      const hookSummary = await syncPendingTransactions();
      const contextSummary = await syncAllPendingTransactions();
      const verified = Math.max(hookSummary.verified, contextSummary.verified);
      const updated = Math.max(hookSummary.updated, contextSummary.updated);
      const checked = Math.max(hookSummary.checked, contextSummary.checked);

      if (verified > 0 || updated > 0) {
        setVerifyFeedback({
          type: 'success',
          title: 'UddoktaPay Payment Sync Complete',
          message: `Verified ${verified} invoice(s) and updated ${updated} transaction record(s) via UddoktaPay /verify-payment API.`
        });
      } else if (checked > 0) {
        setVerifyFeedback({
          type: 'info',
          title: 'Checked Pending Invoices',
          message: `Checked ${checked} pending invoice(s) against UddoktaPay Verify Payment API.`
        });
      } else {
        setVerifyFeedback({
          type: 'info',
          title: 'All Payments Up to Date',
          message: 'All transaction records are synchronized with the UddoktaPay Verify Payment API.'
        });
      }
    } catch (err: any) {
      setVerifyFeedback({
        type: 'error',
        title: 'Sync Error',
        message: err.message || 'Unable to sync pending transactions with UddoktaPay.'
      });
    }
  };

  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(simAmount) || 2000;
    const matchedShopProd = SHOP_PRODUCTS.find(
      p => p.title.toLowerCase() === simTitle.trim().toLowerCase() || p.id === simTitle.trim()
    );
    const targetId = matchedShopProd ? matchedShopProd.id : `prod-custom-${Date.now().toString().slice(-4)}`;
    const generatedOrderId = simInvoiceId.trim() || `UP-INV-${Date.now().toString().slice(-6)}`;
    purchaseProduct(targetId, matchedShopProd ? matchedShopProd.title : simTitle, amountNum, simMethod, simStatus, {
      productSlug: matchedShopProd?.slug,
      orderId: generatedOrderId,
      invoiceId: generatedOrderId
    });
    setSimInvoiceId('');
    setIsSimulateModalOpen(false);
  };

  const getStatusBadge = (status: TransactionRecord['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Paid &amp; Active</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending Verification</span>
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refunded · Access Revoked</span>
          </span>
        );
    }
  };

  return (
    <div id="client-portal-payment-history" className="space-y-6">
      {/* Widget Header & Metrics */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-xl font-bold text-slate-900">Payment History &amp; Receipts</h3>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>UddoktaPay Live Sync</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Official transaction record synced with the UddoktaPay Verify Payment API (<code className="font-mono text-slate-700">/api/verify-payment</code>) via <code className="font-mono text-slate-700">invoice_id</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
            {/* Recurring Background Auto-Sync Toggle */}
            <button
              type="button"
              onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                autoSyncEnabled
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800 hover:bg-emerald-100/70'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200/70'
              }`}
              title="Toggle recurring background check (every 15s) against UddoktaPay Verify Payment API"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  autoSyncEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span>{autoSyncEnabled ? 'Auto-Sync: On (15s)' : 'Auto-Sync: Off'}</span>
            </button>

            {/* Manual Sync All Button */}
            <button
              type="button"
              onClick={handleSyncAll}
              disabled={isSyncingPayments || isHookSyncing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Sync all pending invoices with UddoktaPay Verify Payment API"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${(isSyncingPayments || isHookSyncing) ? 'animate-spin text-emerald-400' : 'text-emerald-400'}`} />
              <span>{(isSyncingPayments || isHookSyncing) ? 'Syncing Invoices...' : 'Sync Payment Status'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSimulateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Payment</span>
            </button>
          </div>
        </div>

        {/* Live Verification / Background Sync Feedback Banner */}
        {verifyFeedback && (
          <div
            role="status"
            aria-live="polite"
            className={`mb-6 p-4 rounded-2xl border flex items-start justify-between gap-3 text-xs animate-in fade-in duration-200 ${
              verifyFeedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : verifyFeedback.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-indigo-50 border-indigo-200 text-indigo-900'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {verifyFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : verifyFeedback.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <Activity className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <div className="font-bold">{verifyFeedback.title}</div>
                <p className="leading-relaxed opacity-90">{verifyFeedback.message}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setVerifyFeedback(null)}
              className="p-1 rounded-lg hover:bg-black/5 text-current opacity-70 hover:opacity-100 cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Aggregate Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Cleared</span>
            <div className="text-2xl font-black text-slate-900">
              ৳{metrics.totalPaid.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>{metrics.paidCount} Paid Invoices</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Pending Clearance</span>
            <div className="text-2xl font-black text-amber-700">
              ৳{metrics.totalPending.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700">
              <Clock className="w-3 h-3 text-amber-600" />
              <span>{metrics.pendingCount} Awaiting Verification</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">All Transactions</span>
            <div className="text-2xl font-black text-slate-900">
              {metrics.total}
            </div>
            <span className="text-[11px] text-slate-500 block">
              {lastPaymentSyncAt
                ? `Last synced ${new Date(lastPaymentSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                : 'Lifetime portal payment entries'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-pink-50/60 border border-pink-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-pink-700 block">Automated Gateway</span>
            <div className="text-base font-black text-pink-900 font-mono truncate">
              UddoktaPay V2
            </div>
            <span className="text-[11px] font-semibold text-pink-800 block">
              bKash / Nagad / Cards • /verify-payment
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/70 overflow-x-auto">
            <button
              type="button"
              onClick={() => setSelectedStatus('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedStatus === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Entries ({metrics.total})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus('completed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedStatus === 'completed'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-emerald-800'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Paid ({metrics.paidCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedStatus === 'pending'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-slate-600 hover:text-amber-800'
              }`}
            >
              <Clock className="w-3 h-3 text-amber-600" />
              <span>Pending ({metrics.pendingCount})</span>
            </button>
            {metrics.refundedCount > 0 && (
              <button
                type="button"
                onClick={() => setSelectedStatus('refunded')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedStatus === 'refunded'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <RotateCcw className="w-3 h-3 text-slate-500" />
                <span>Refunded ({metrics.refundedCount})</span>
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by invoice_id, TrxID, or item..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Transactions Table / Card List */}
        {displayedTransactions.length === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">No payment records found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              {searchQuery || selectedStatus !== 'all'
                ? 'Try clearing your search query or switching filters.'
                : 'Completed and pending transactions for your User ID will be recorded here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedTransactions.map((tx) => {
              const matchedProd = SHOP_PRODUCTS.find(
                p => p.id === tx.productId || p.slug === tx.productSlug || p.slug === tx.productId
              );
              const resolvedInvoiceId = resolveInvoiceIdForTransaction(tx);
              const isVerifyingThis = isVerifyingTransaction(tx);
              const isPendingTx = isPendingTransaction(tx);

              return (
                <div
                  key={tx.id}
                  onClick={() => setPreviewTransaction(tx)}
                  className="group p-4 sm:p-5 rounded-2xl border border-slate-200/80 hover:border-emerald-300 bg-white hover:bg-slate-50/60 transition-all cursor-pointer shadow-2xs"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Transaction Description & Details */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 group-hover:bg-emerald-50 group-hover:border-emerald-200 group-hover:text-emerald-700 transition-colors">
                        <FileText className="w-5 h-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-900 group-hover:text-emerald-900 transition-colors">
                            {tx.productTitle}
                          </span>
                          {getStatusBadge(tx.status)}
                        </div>

                        {/* Typographic Metadata Line */}
                        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-slate-500 mt-1.5">
                          <span className="font-mono text-slate-700 font-semibold flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/70">
                            <span className="text-[10px] uppercase text-slate-400 font-sans font-bold">invoice_id:</span>
                            <span>{resolvedInvoiceId}</span>
                            <button
                              type="button"
                              onClick={(e) => handleCopy(e, resolvedInvoiceId)}
                              className="p-0.5 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                              title="Copy invoice_id"
                            >
                              {copiedId === resolvedInvoiceId ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </span>
                          <span>·</span>
                          <span className="font-mono text-slate-600 font-semibold flex items-center gap-1">
                            <span>Trx: {tx.transactionId}</span>
                            <button
                              type="button"
                              onClick={(e) => handleCopy(e, tx.transactionId)}
                              className="p-0.5 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                              title="Copy Transaction ID"
                            >
                              {copiedId === tx.transactionId ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </span>
                          <span>·</span>
                          <span>{tx.paymentMethod}</span>
                          <span>·</span>
                          <span>
                            {new Date(tx.date).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount & Actions */}
                    <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 flex-wrap">
                      <div className="text-left lg:text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Amount
                        </span>
                        <span className="text-base sm:text-lg font-black text-slate-900">
                          ৳{tx.amount.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {tx.status === 'completed' && matchedProd && (
                          <Link
                            to={`/shop/${matchedProd.slug}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-600" />
                            <span>View Product</span>
                          </Link>
                        )}

                        {/* Reusable 'Verify Status' component displaying 'Verify Payment' when status is 'PENDING' */}
                        <VerifyStatus
                          invoiceId={resolvedInvoiceId}
                          status={tx.status}
                          transaction={tx}
                          onVerified={(itemResult) =>
                            handleVerificationResult(tx, resolvedInvoiceId, itemResult)
                          }
                          onError={(err) => handleVerificationError(resolvedInvoiceId, err)}
                        />

                        {tx.status === 'completed' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              processRefund(tx.id);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-[11px] font-bold transition-colors cursor-pointer"
                            title="Refund order and revoke product access"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Refund</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => handleDownload(e, tx)}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs ${
                            downloadingId === tx.id
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}
                          title="Download official digital PDF receipt"
                        >
                          {downloadingId === tx.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-white" />
                              <span>Downloaded</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Receipt</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewTransaction(tx);
                          }}
                          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                          title="View Receipt Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer info & view all link */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Digital receipts certified under Bangladesh Income Tax Act 2023 &amp; VAT and SD Act 2012</span>
          </div>

          {limit && filteredTransactions.length > limit && onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
            >
              View all {filteredTransactions.length} transactions →
            </button>
          )}
        </div>
      </div>

      {/* RECEIPT PREVIEW MODAL */}
      {previewTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Digital Receipt Details</h4>
                  <p className="text-xs font-mono text-slate-500">TrxID: {previewTransaction.transactionId}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTransaction(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Content */}
            <div className="py-5 space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">UddoktaPay Invoice ID (<code className="font-mono">invoice_id</code>):</span>
                  <span className="font-mono font-bold text-slate-900">
                    {resolveInvoiceIdForTransaction(previewTransaction)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Receipt Reference:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {previewTransaction.referenceId || previewTransaction.id}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Payment Status:</span>
                  {getStatusBadge(previewTransaction.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Payment Method:</span>
                  <span className="font-bold text-slate-900">{previewTransaction.paymentMethod}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Date &amp; Time:</span>
                  <span className="text-slate-900 font-semibold">
                    {new Date(previewTransaction.date).toLocaleString('en-GB')}
                  </span>
                </div>
                {previewTransaction.lastSyncedAt && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500 font-medium">Last Gateway Sync:</span>
                    <span className="text-emerald-700 font-semibold">
                      {new Date(previewTransaction.lastSyncedAt).toLocaleString('en-GB')}
                    </span>
                  </div>
                )}
              </div>

              {/* Item Details */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h5 className="font-bold text-sm text-slate-900">{previewTransaction.productTitle}</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Legal &amp; Tax Compliance Advisory Service / Digital Asset
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-sm text-slate-900">
                      ৳{previewTransaction.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-900">Total Settled:</span>
                  <span className="text-base font-black text-emerald-800">
                    BDT {previewTransaction.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Merchant Details */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-1">
                <div className="font-bold text-slate-800">Authorized Merchant:</div>
                <div>Accounticca &amp; E-Lawyers Bangladesh Chambers</div>
                <div>Panthapath, Dhaka-1205 • Tax License TIN: 4829-1029-4412</div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>

                <VerifyStatus
                  invoiceId={resolveInvoiceIdForTransaction(previewTransaction)}
                  status={previewTransaction.status}
                  transaction={previewTransaction}
                  onVerified={(itemResult) =>
                    handleVerificationResult(
                      previewTransaction,
                      resolveInvoiceIdForTransaction(previewTransaction),
                      itemResult
                    )
                  }
                  onError={(err) =>
                    handleVerificationError(
                      resolveInvoiceIdForTransaction(previewTransaction),
                      err
                    )
                  }
                />
              </div>

              <button
                type="button"
                onClick={(e) => handleDownload(e, previewTransaction)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIMULATE / RECORD PAYMENT MODAL */}
      {isSimulateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Record Client Payment</h4>
                  <p className="text-xs text-slate-500">Record a payment or pending UddoktaPay invoice</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSimulateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSimulateSubmit} className="py-4 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Matter / Service Description
                </label>
                <input
                  type="text"
                  required
                  value={simTitle}
                  onChange={(e) => setSimTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Amount (BDT)
                  </label>
                  <input
                    type="number"
                    required
                    value={simAmount}
                    onChange={(e) => setSimAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={simStatus}
                    onChange={(e) => setSimStatus(e.target.value as 'completed' | 'pending')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="pending">Pending Verification</option>
                    <option value="completed">Paid (Completed)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  UddoktaPay Invoice ID (<code className="font-mono">invoice_id</code>) <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={simInvoiceId}
                  onChange={(e) => setSimInvoiceId(e.target.value)}
                  placeholder="e.g. UP-INV-202601 (auto-generated if blank)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={simMethod}
                  onChange={(e) => setSimMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="UddoktaPay (bKash)">UddoktaPay (bKash)</option>
                  <option value="UddoktaPay (Nagad)">UddoktaPay (Nagad)</option>
                  <option value="bKash Personal">bKash Personal (01744883636)</option>
                  <option value="SSL Secure Gateway">SSL Secure Gateway</option>
                  <option value="Bank Transfer (City Bank PLC)">Bank Transfer (City Bank PLC)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSimulateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Add Transaction Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
