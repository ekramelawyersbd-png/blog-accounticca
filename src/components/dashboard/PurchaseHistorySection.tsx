import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  Key, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  Sparkles, 
  ShieldCheck, 
  FileText,
  CreditCard,
  Printer,
  ChevronRight,
  ArrowUpRight,
  Check,
  RefreshCw,
  AlertCircle,
  X
} from 'lucide-react';
import { usePurchases, TransactionRecord, resolveInvoiceIdForTransaction } from '../../contexts/PurchaseContext';
import { usePaymentStatusSync } from '../../hooks/usePaymentStatusSync';
import { VerifyStatus } from '../ui/VerifyStatus';
import { SHOP_PRODUCTS, ShopProduct } from '../../data/shopProducts';
import { Link } from 'react-router-dom';

export const PurchaseHistorySection: React.FC = () => {
  const {
    transactions,
    purchasedProductIds,
    downloadReceipt
  } = usePurchases();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [verifyNotice, setVerifyNotice] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Automatically check 'PENDING' transactions in Firestore on component mount via UddoktaPay Verify Payment API
  // and provide verifyTransactionStatus for 'Verify Status' buttons on PENDING transactions
  const {
    verifyTransactionStatus,
    isVerifyingTransaction,
    isPendingTransaction
  } = usePaymentStatusSync({
    enabled: true,
    onSyncComplete: (summary) => {
      if (summary.verified > 0) {
        setVerifyNotice({
          type: 'success',
          message: `Automatically verified ${summary.verified} pending transaction(s) in Firestore via UddoktaPay Verify Payment API.`
        });
      }
    }
  });

  // Map purchased product IDs and transactions to full ShopProduct items
  const unlockedToolsList = useMemo(() => {
    // 1. Convert transactions to unlocked items
    const itemsFromTx = transactions.map((tx) => {
      // Find matching shop product by title or ID
      const matchingProduct = SHOP_PRODUCTS.find(
        (p) => p.title.toLowerCase() === tx.productTitle.toLowerCase() ||
               tx.productTitle.toLowerCase().includes(p.title.toLowerCase()) ||
               p.id === tx.referenceId
      );

      return {
        id: tx.id,
        transactionId: tx.transactionId,
        invoiceId: resolveInvoiceIdForTransaction(tx),
        referenceId: tx.referenceId || `ACC-${tx.id}`,
        title: tx.productTitle,
        category: matchingProduct?.category || 'Tax & Legal Toolkit',
        format: matchingProduct?.format || 'Digital Kit (.docx, .xlsx, .pdf)',
        slug: matchingProduct?.slug || 'income-tax-calculator-2026-27',
        imageUrl: matchingProduct?.imageUrl || 'https://ibb.co.com/VYcVtN9y',
        amount: tx.amount,
        status: tx.status,
        paymentMethod: tx.paymentMethod,
        accessDate: tx.date,
        lastSyncedAt: tx.lastSyncedAt,
        brochureUrl: matchingProduct?.brochureUrl,
        productObj: matchingProduct,
        rawTx: tx
      };
    });

    // 2. Also map any purchasedProductIds not yet in transactions
    purchasedProductIds.forEach((pid) => {
      const prod = SHOP_PRODUCTS.find((p) => p.id === pid || p.slug === pid);
      if (prod && !itemsFromTx.some((it) => it.productObj?.id === prod.id || it.title === prod.title)) {
        itemsFromTx.push({
          id: `TXN-${prod.id}`,
          transactionId: `GATEWAY-PROD-${prod.id}`,
          invoiceId: `ACC-INV-${prod.id}`,
          referenceId: `ACC-2026-${Math.floor(100000 + Math.random() * 900000)}`,
          title: prod.title,
          category: prod.category,
          format: prod.format,
          slug: prod.slug,
          imageUrl: prod.imageUrl,
          amount: prod.price,
          status: 'completed',
          paymentMethod: 'Instant Unlocked Access',
          accessDate: new Date('2026-10-15T12:00:00.000Z').toISOString(),
          lastSyncedAt: undefined,
          brochureUrl: prod.brochureUrl,
          productObj: prod,
          rawTx: undefined
        });
      }
    });

    return itemsFromTx;
  }, [transactions, purchasedProductIds]);

  // Filtered list based on search and status
  const filteredTools = useMemo(() => {
    return unlockedToolsList.filter((item) => {
      const matchesSearch = 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.referenceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [unlockedToolsList, searchTerm, statusFilter]);

  // KPI Metrics
  const totalSpent = useMemo(() => {
    return unlockedToolsList
      .filter((t) => t.status === 'completed')
      .reduce((sum, item) => sum + item.amount, 0);
  }, [unlockedToolsList]);

  const completedCount = useMemo(() => {
    return unlockedToolsList.filter((t) => t.status === 'completed').length;
  }, [unlockedToolsList]);

  const latestAccessDate = useMemo(() => {
    if (unlockedToolsList.length === 0) return 'N/A';
    const dates = unlockedToolsList.map((t) => new Date(t.accessDate).getTime());
    const maxDate = new Date(Math.max(...dates));
    return maxDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }, [unlockedToolsList]);

  return (
    <div id="purchase-history-section" className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 rounded-full text-xs font-bold">
              <Key className="w-3.5 h-3.5" />
              <span>Verified Account Repository</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Purchase History &amp; Unlocked Tools
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Complete inventory of your purchased tax workbooks, legal agreement bundles, and unlocked digital tools with lifetime access timestamps and official receipts.
            </p>
          </div>

          <Link
            to="/tools"
            className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-2xl transition-all shadow-md hover:shadow-lg shrink-0 transform hover:-translate-y-0.5"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Browse Compliance Tools</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* KPI Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-700/60">
          <div className="bg-white/5 backdrop-blur-xs p-4 rounded-2xl border border-white/10 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Unlocked Tools &amp; Assets
            </span>
            <div className="text-2xl font-black text-white flex items-center gap-2">
              <span>{completedCount} Items</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md font-extrabold border border-emerald-400/30">
                Active
              </span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-4 rounded-2xl border border-white/10 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Invested Balance
            </span>
            <div className="text-2xl font-black text-emerald-400">
              BDT {totalSpent.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-4 rounded-2xl border border-white/10 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Latest Access Granted
            </span>
            <div className="text-2xl font-black text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{latestAccessDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search unlocked tools, TrxID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </span>

          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Items ({unlockedToolsList.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === 'completed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Completed / Unlocked ({unlockedToolsList.filter((t) => t.status === 'completed').length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pending Clearance ({unlockedToolsList.filter((t) => t.status === 'pending').length})
          </button>
        </div>
      </div>

      {verifyNotice && (
        <div
          role="status"
          aria-live="polite"
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-semibold ${
            verifyNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {verifyNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{verifyNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setVerifyNotice(null)}
            className="p-1 rounded-lg hover:bg-black/5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Unlocked Tools List */}
      <div className="space-y-4">
        {filteredTools.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No matching purchase records found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search query or explore our store catalog to purchase statutory toolkits.
            </p>
          </div>
        ) : (
          filteredTools.map((item) => {
            const accessDateFormatted = new Date(item.accessDate).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-slate-200/90 hover:border-emerald-300 transition-all shadow-xs hover:shadow-md p-5 sm:p-6 space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  
                  {/* Left: Product Info */}
                  <div className="flex items-start gap-4">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-slate-200 shadow-2xs"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://ibb.co.com/VYcVtN9y';
                      }}
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
                          {item.category}
                        </span>
                        {item.status === 'completed' ? (
                          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Access Unlocked</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Verification Pending</span>
                          </span>
                        )}
                      </div>

                      <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                        {item.title}
                      </h3>

                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium flex-wrap pt-0.5">
                        <span>Format: <strong>{item.format}</strong></span>
                        <span>•</span>
                        <span>Access Date: <strong>{accessDateFormatted}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Payment Amount & Reference */}
                  <div className="text-left md:text-right shrink-0 space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 md:bg-transparent md:p-0 md:border-none">
                    <div className="text-lg font-black text-slate-900">
                      BDT {item.amount.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] font-mono font-bold text-slate-500">
                      Ref: {item.referenceId}
                    </div>
                    <div className="text-[10px] font-medium text-slate-400">
                      Channel: {item.paymentMethod}
                    </div>
                  </div>

                </div>

                {/* Bottom Actions Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Permanent License • Verified via Accounticca Client Portal</span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end flex-wrap">
                    {/* Reusable 'Verify Status' UI component displaying 'Verify Payment' when status is 'PENDING' */}
                    <VerifyStatus
                      invoiceId={item.invoiceId}
                      status={item.status}
                      transaction={item.rawTx}
                      onVerified={(itemResult) => {
                        const res = itemResult.response;
                        setVerifyNotice({
                          type: itemResult.verified || res.verified ? 'success' : 'error',
                          message: `${res.message || `Payment status synced (${itemResult.updatedStatus.toUpperCase()})`} — Transaction status synced to Firestore (invoice_id: ${itemResult.invoiceId || item.invoiceId}).`
                        });
                      }}
                    />

                    {/* Download Receipt */}
                    <button
                      type="button"
                      onClick={() => downloadReceipt({
                        id: item.id,
                        transactionId: item.transactionId,
                        productTitle: item.title,
                        amount: item.amount,
                        status: item.status as any,
                        paymentMethod: item.paymentMethod,
                        date: item.accessDate,
                        referenceId: item.referenceId
                      } as any)}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      title="Download PDF Receipt"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>PDF Receipt</span>
                    </button>

                    {/* Launch / Access Tool Link */}
                    {item.brochureUrl && item.brochureUrl.startsWith('/') ? (
                      <Link
                        to={item.brochureUrl}
                        className="inline-flex items-center justify-center gap-1.5 px-4.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer"
                      >
                        <span>Access Tool</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    ) : item.slug ? (
                      <Link
                        to={`/shop/${item.slug}`}
                        className="inline-flex items-center justify-center gap-1.5 px-4.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer"
                      >
                        <span>View Tool Product Page</span>
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                      </Link>
                    ) : null}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
