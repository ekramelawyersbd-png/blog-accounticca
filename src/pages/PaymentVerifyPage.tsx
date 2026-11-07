import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  Receipt, 
  GraduationCap, 
  ShoppingBag, 
  RefreshCcw,
  Copy,
  Check,
  Calendar,
  Download,
  FileText,
  FileCheck,
  Printer
} from 'lucide-react';
import { SEO } from '../components/SEO';
import {
  verifyUddoktaPayPayment,
  VerifyPaymentResponse,
  getPendingUddoktaCheckout
} from '../services/uddoktapayService';
import { usePurchases } from '../contexts/PurchaseContext';
import { useCart } from '../contexts/CartContext';
import { dispatchFormSubmissionToast } from '../components/ui/FormSubmissionToast';
import { generatePdfReceipt, ReceiptDataPayload } from '../utils/receiptGenerator';

export const PaymentVerifyPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { purchaseProduct } = usePurchases();
  const { clearCart } = useCart();

  const invoiceId =
    searchParams.get('invoice_id') ||
    searchParams.get('session_id') ||
    searchParams.get('invoiceId') ||
    searchParams.get('sess') ||
    '';
  const sessionId = searchParams.get('session_id') || '';
  const paramAmount = searchParams.get('amount') || '';
  const paramProductId = searchParams.get('product_id') || searchParams.get('productId') || '';
  const paramProductTitle = searchParams.get('product_title') || searchParams.get('title') || '';
  const paramFlow = searchParams.get('flow') || '';

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VerifyPaymentResponse | null>(null);
  const [copiedTxn, setCopiedTxn] = useState(false);
  const [resolvedFlow, setResolvedFlow] = useState<string>(paramFlow || 'shop_order');
  const [resolvedCourseId, setResolvedCourseId] = useState<string>('');
  const [resolvedItemSummary, setResolvedItemSummary] = useState<string>('');

  // Automatic PDF receipt generation & email dispatch state
  const autoPdfTriggeredRef = useRef(false);
  const emailSentRef = useRef(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [lastReceiptPayload, setLastReceiptPayload] = useState<ReceiptDataPayload | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function runVerification() {
      if (!invoiceId) {
        setLoading(false);
        return;
      }
      try {
        const res = await verifyUddoktaPayPayment(invoiceId);
        if (!isMounted) return;

        setResult(res);
        setLoading(false);

        const verified =
          res?.verified ||
          res?.status_code === 'COMPLETED' ||
          res?.status === 'COMPLETED' ||
          res?.status === true ||
          searchParams.get('status') === 'completed';

        const pendingSnapshot = getPendingUddoktaCheckout(invoiceId);
        const metadata: Record<string, any> = {
          ...(pendingSnapshot?.metadata || {}),
          ...(res?.metadata || {})
        };
        const flowType: string =
          metadata.flow_type ||
          metadata.flow ||
          pendingSnapshot?.flowType ||
          paramFlow ||
          'shop_order';
        setResolvedFlow(flowType);

        const trxId = res?.transaction_id || `UDK-${invoiceId}`;
        const settledAmount = Number(res?.amount || pendingSnapshot?.amount || paramAmount || 1500);
        const gatewayMethod = res?.payment_method
          ? `UddoktaPay (${res.payment_method})`
          : 'UddoktaPay Gateway';

        if (!verified) return;

        if (flowType === 'course_enrollment') {
          const cId = String(metadata.course_id || metadata.courseId || paramProductId || '2');
          const cTitle = String(
            metadata.course_title || metadata.courseTitle || paramProductTitle || 'Academy Professional Course'
          );
          setResolvedCourseId(cId);
          setResolvedItemSummary(cTitle);

          purchaseProduct(
            `course-${cId}`,
            cTitle,
            settledAmount,
            gatewayMethod,
            'completed',
            {
              orderId: metadata.invoice_id || invoiceId,
              transactionId: trxId
            }
          );

          try {
            const existingRaw = localStorage.getItem('training_enrollments');
            const existingList = existingRaw ? JSON.parse(existingRaw) : [];
            const alreadyRecorded = existingList.some(
              (e: any) => e.transactionId === trxId || e.orderId === invoiceId || e.id === metadata.enrollment_id
            );
            if (!alreadyRecorded) {
              existingList.push({
                id: metadata.enrollment_id || invoiceId,
                orderId: invoiceId,
                courseTitle: cTitle,
                coursePrice: `BDT ${settledAmount.toLocaleString()}`,
                name: pendingSnapshot?.fullName || res?.full_name || metadata.customer_name || 'Enrolled Student',
                email: pendingSnapshot?.email || res?.email || metadata.customer_email || '',
                phone: pendingSnapshot?.phone || metadata.phone || '',
                transactionId: trxId,
                paymentMethod: gatewayMethod,
                paymentStatus: 'PAID (UddoktaPay Verified)',
                enrolledAt: new Date().toISOString()
              });
              localStorage.setItem('training_enrollments', JSON.stringify(existingList));
            }
          } catch (e) {
            console.warn('Enrollment storage sync notice:', e);
          }

          dispatchFormSubmissionToast({
            title: 'Academy Tuition Verified',
            message: `${cTitle} unlocked via UddoktaPay (${trxId}).`
          });
        } else if (flowType === 'consultation_booking') {
          const bookingId = String(
            metadata.appointment_id || metadata.booking_id || sessionId || invoiceId
          );
          const serviceName = String(
            metadata.practiceArea || metadata.service_type || 'Legal & Tax Consultation'
          );
          setResolvedItemSummary(`${serviceName} (${bookingId})`);

          purchaseProduct(
            `consultation-${bookingId}`,
            `Consultation: ${serviceName}`,
            settledAmount,
            gatewayMethod,
            'completed',
            {
              orderId: bookingId,
              transactionId: trxId
            }
          );

          try {
            const rawAppts = localStorage.getItem('accounticca_booked_appointments');
            if (rawAppts) {
              const appts = JSON.parse(rawAppts);
              const updated = appts.map((item: any) =>
                item.id === bookingId
                  ? {
                      ...item,
                      paymentStatus: 'PAID',
                      paymentGateway: gatewayMethod,
                      transactionId: trxId
                    }
                  : item
              );
              localStorage.setItem('accounticca_booked_appointments', JSON.stringify(updated));
              window.dispatchEvent(new Event('appointments-updated'));
            }
          } catch (e) {
            console.warn('Appointment storage sync notice:', e);
          }

          dispatchFormSubmissionToast({
            title: 'Consultation Retainer Settled',
            message: `Booking ${bookingId} verified via UddoktaPay (${trxId}).`
          });
        } else {
          // Digital Shop Order Flow
          const snapshotItems = metadata.items;
          if (Array.isArray(snapshotItems) && snapshotItems.length > 0) {
            setResolvedItemSummary(snapshotItems.map((i: any) => i.title).join(', '));
            snapshotItems.forEach((item: any) => {
              purchaseProduct(
                String(item.id || item.productId),
                String(item.title),
                Number(item.price || item.unitPrice || settledAmount),
                gatewayMethod,
                'completed',
                {
                  orderId: metadata.order_id || sessionId || invoiceId,
                  transactionId: trxId
                }
              );
            });
            clearCart();
          } else {
            const resolvedProductId = paramProductId || metadata.product_id || `shop-${invoiceId}`;
            const resolvedTitle =
              paramProductTitle || metadata.product_title || metadata.order_summary || 'Verified Digital Product & Toolkit';
            setResolvedItemSummary(String(resolvedTitle));
            purchaseProduct(
              String(resolvedProductId),
              String(resolvedTitle),
              settledAmount,
              gatewayMethod,
              'completed',
              {
                orderId: metadata.order_id || sessionId || invoiceId,
                transactionId: trxId
              }
            );
          }

          dispatchFormSubmissionToast({
            title: 'Payment Verified Successfully',
            message: `Transaction ${trxId} confirmed. Digital downloads are unlocked.`
          });
        }

        // Assemble official PDF receipt payload
        const customerName =
          pendingSnapshot?.fullName ||
          res?.full_name ||
          metadata.customer_name ||
          metadata.name ||
          'Valued Client';
        const customerEmail =
          pendingSnapshot?.email ||
          res?.email ||
          metadata.customer_email ||
          metadata.email ||
          '';

        const receiptPayload: ReceiptDataPayload = {
          id: invoiceId || `INV-${Date.now()}`,
          purchaseId: invoiceId || `PUR-${Date.now()}`,
          userId: pendingSnapshot?.metadata?.userId || 'verified-purchaser',
          userEmail: customerEmail,
          customerName,
          customerEmail,
          customerPhone: pendingSnapshot?.phone || metadata.customer_phone || metadata.phone || '',
          productId: paramProductId || metadata.product_id || (Array.isArray(metadata.items) && metadata.items[0]?.productId) || `prod-${invoiceId}`,
          productSlug: metadata.product_slug || (Array.isArray(metadata.items) && metadata.items[0]?.slug) || '',
          productTitle: String(
            resolvedItemSummary ||
            (Array.isArray(metadata.items) && metadata.items.length > 0
              ? metadata.items.map((i: any) => i.title).join(', ')
              : paramProductTitle || metadata.product_title || 'Digital Legal & Tax Statutory Toolkit')
          ),
          orderId: metadata.order_id || metadata.invoice_id || invoiceId,
          referenceId: metadata.order_id || invoiceId,
          transactionId: trxId,
          amount: settledAmount,
          status: 'completed',
          paymentStatus: 'completed',
          accessStatus: 'active',
          paymentMethod: gatewayMethod,
          date: new Date().toISOString(),
          purchaseDate: new Date().toISOString(),
          items: Array.isArray(metadata.items) && metadata.items.length > 0 ? metadata.items : undefined
        };

        setLastReceiptPayload(receiptPayload);

        // Automatically trigger downloadable PDF receipt generation upon success detection
        if (!autoPdfTriggeredRef.current) {
          autoPdfTriggeredRef.current = true;
          setTimeout(() => {
            try {
              generatePdfReceipt(receiptPayload);
              setPdfDownloaded(true);
              dispatchFormSubmissionToast({
                title: 'Official PDF Receipt Downloaded',
                message: `Receipt for ${trxId} (BDT ${settledAmount.toLocaleString('en-IN')}) saved to downloads.`,
                type: 'success'
              });
            } catch (pdfErr) {
              console.error('Automatic PDF receipt generation error:', pdfErr);
            }
          }, 850);
        }

        // Trigger automated confirmation email through Brevo SMTP relay to registered email address
        if (!emailSentRef.current && customerEmail) {
          emailSentRef.current = true;
          fetch('/api/shop/orders/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: metadata.order_id || metadata.invoice_id || invoiceId,
              customerName,
              customerEmail,
              customerPhone: pendingSnapshot?.phone || metadata.customer_phone || metadata.phone || '',
              companyName: pendingSnapshot?.companyName || metadata.company_name || 'Accounticca Client',
              items: Array.isArray(metadata.items) && metadata.items.length > 0 ? metadata.items : [{
                productId: paramProductId || metadata.product_id || 'digital-resource',
                slug: metadata.product_slug || 'digital-resource',
                title: resolvedItemSummary || paramProductTitle || 'Verified Digital Toolkit & Resource',
                category: 'Tax & Legal Kit',
                productType: 'Templates',
                format: 'XLSX + PDF',
                quantity: 1,
                unitPrice: settledAmount,
                lineTotal: settledAmount
              }],
              subtotal: settledAmount,
              discount: 0,
              totalCost: settledAmount,
              paymentMethod: gatewayMethod,
              trxId,
              orderDate: new Date().toISOString()
            })
          })
            .then(res => res.json())
            .then(data => {
              if (data && data.success) {
                console.log('[Brevo Email Dispatched to Registered Email]:', customerEmail);
              }
            })
            .catch(emailErr => {
              console.warn('Automated email dispatch warning:', emailErr);
            });
        }
      } catch (err) {
        console.error('Verification error:', err);
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    runVerification();

    return () => {
      isMounted = false;
    };
  }, [clearCart, invoiceId, paramAmount, paramFlow, paramProductId, paramProductTitle, purchaseProduct, sessionId, searchParams]);

  const handleCopy = (text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedTxn(true);
    setTimeout(() => setCopiedTxn(false), 2000);
  };

  const handleManualDownloadReceipt = () => {
    if (!lastReceiptPayload) return;
    setDownloadingPdf(true);
    try {
      generatePdfReceipt(lastReceiptPayload);
      setPdfDownloaded(true);
      dispatchFormSubmissionToast({
        title: 'PDF Receipt Generated',
        message: 'Your official digital payment receipt has been downloaded.',
        type: 'success'
      });
    } catch (e) {
      console.error('Manual PDF receipt download error:', e);
    } finally {
      setTimeout(() => setDownloadingPdf(false), 500);
    }
  };

  const isCompleted =
    result?.verified ||
    result?.status_code === 'COMPLETED' ||
    result?.status === 'COMPLETED' ||
    result?.status === true ||
    searchParams.get('status') === 'completed';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <SEO
        title="Payment Verification - UddoktaPay Gateway"
        description="Verify your automated payment status via UddoktaPay gateway for Accounticca & eLawyers services."
      />

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden">
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-slate-900 via-[#0d2f44] to-[#0e433b] p-6 text-white text-center relative">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>UddoktaPay Gateway · /verify-payment Confirmed</span>
            </div>
            <h1 className="text-2xl font-black text-white">Automated Payment Settlement</h1>
            <p className="text-xs text-slate-300 mt-1">bKash · Nagad · Rocket · Upay · Visa &amp; Mastercard</p>
          </div>

          <div className="p-6 sm:p-10">
            {loading ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <h2 className="text-lg font-bold text-slate-800">Verifying Invoice with UddoktaPay...</h2>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Calling <code className="font-mono text-slate-700">/api/verify-payment</code> for invoice{' '}
                  <strong className="font-mono text-slate-700">{invoiceId}</strong>.
                </p>
              </div>
            ) : !invoiceId ? (
              <div className="text-center py-10 space-y-5">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-900">No Invoice ID Provided</h2>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    No active transaction <code className="font-mono">invoice_id</code> was specified in the callback query. If you just placed an order, check your email or return to the shop.
                  </p>
                </div>
                <div className="pt-4 flex justify-center gap-3">
                  <Link
                    to="/tools"
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    Compliance Tools
                  </Link>
                  <Link
                    to="/client-portal"
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              </div>
            ) : isCompleted ? (
              <div className="space-y-6">
                {/* Success Card Header */}
                <div className="text-center space-y-2">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold uppercase tracking-wider">
                    {resolvedFlow === 'course_enrollment'
                      ? 'Academy Course Enrollment Verified'
                      : resolvedFlow === 'consultation_booking'
                      ? 'Consultation Retainer Settled'
                      : 'Digital Shop Order Unlocked'}
                  </span>
                  <h2 className="text-2xl font-black text-slate-900">Payment Successful!</h2>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                    Your automated payment was verified by UddoktaPay. Your receipt and digital entitlements have been activated immediately.
                  </p>
                </div>

                {/* Official PDF Receipt Banner Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="p-3 bg-white rounded-xl border border-emerald-200 text-emerald-700 shrink-0 shadow-2xs">
                      <FileText className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">Official NBR Audit-Ready PDF Receipt</span>
                        {pdfDownloaded ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                            <Check className="w-3 h-3" /> Auto-Downloaded
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 text-[10px] font-bold animate-pulse">
                            Auto-Generating PDF...
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        A verified, computer-generated payment voucher has been automatically generated for order{' '}
                        <strong className="font-mono text-slate-800">{result?.invoice_id || invoiceId}</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleManualDownloadReceipt}
                      disabled={downloadingPdf || !lastReceiptPayload}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-emerald-200" />
                      <span>{downloadingPdf ? 'Generating...' : pdfDownloaded ? 'Download PDF Again' : 'Download PDF Receipt'}</span>
                    </button>
                  </div>
                </div>

                {/* Transaction Data Table */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200/90 p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">Gateway Provider</span>
                    <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      UddoktaPay Payment Gateway
                    </span>
                  </div>

                  {resolvedItemSummary && (
                    <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-200 gap-4">
                      <span className="text-slate-500 font-medium shrink-0">Settled Item / Service</span>
                      <span className="font-bold text-slate-900 text-right truncate">{resolvedItemSummary}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">Payment Method</span>
                    <span className="font-bold text-pink-700 bg-pink-50 border border-pink-200 px-2.5 py-0.5 rounded-full text-[11px]">
                      {result?.payment_method || 'bKash / Automated MFS'}
                    </span>
                  </div>

                  {result?.sender_number && (
                    <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-200">
                      <span className="text-slate-500 font-medium">Sender Account</span>
                      <span className="font-mono font-bold text-slate-800">{result.sender_number}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">Amount Settled</span>
                    <span className="text-base font-black text-emerald-700 font-mono tabular-nums">
                      BDT {Number(result?.amount || paramAmount || 1500).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {typeof result?.fee === 'number' && (
                    <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-200">
                      <span className="text-slate-500 font-medium">Gateway Fee</span>
                      <span className="font-mono text-xs font-semibold text-slate-700 tabular-nums">
                        BDT {Number(result.fee).toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">UddoktaPay Invoice ID</span>
                    <span className="font-mono text-[11px] text-slate-700 font-semibold">{result?.invoice_id || invoiceId}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">Verified Transaction ID</span>
                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-900">
                      <span>{result?.transaction_id || `TRX-${invoiceId}`}</span>
                      <button
                        onClick={() => handleCopy(result?.transaction_id || `TRX-${invoiceId}`)}
                        className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                        title="Copy Transaction ID"
                      >
                        {copiedTxn ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Official Payment Receipt</span>
                    <button
                      type="button"
                      onClick={handleManualDownloadReceipt}
                      disabled={downloadingPdf || !lastReceiptPayload}
                      className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                    >
                      <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Receipt-{invoiceId}.pdf</span>
                      <Download className="w-3 h-3 text-emerald-600 ml-0.5" />
                    </button>
                  </div>
                </div>

                {/* Flow-specific Primary Action Links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {resolvedFlow === 'course_enrollment' ? (
                    <>
                      <Link
                        to={`/training/course/${resolvedCourseId || '2'}/dashboard`}
                        className="flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        <GraduationCap className="w-4 h-4" />
                        <span>Open Course Dashboard</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        to="/training"
                        className="flex items-center justify-center gap-2 py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        <span>Browse Academy Catalog</span>
                      </Link>
                    </>
                  ) : resolvedFlow === 'consultation_booking' ? (
                    <>
                      <Link
                        to="/profile?tab=appointments"
                        className="flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>View My Appointments</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        to="/client-portal"
                        className="flex items-center justify-center gap-2 py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        <span>Open Client Portal</span>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/client-portal?tab=purchases"
                        className="flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Access Unlocked Downloads</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        to="/client-portal"
                        className="flex items-center justify-center gap-2 py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        <GraduationCap className="w-4 h-4" />
                        <span>Go to Client Dashboard</span>
                      </Link>
                    </>
                  )}
                </div>

                <div className="text-center pt-2">
                  <Link
                    to="/client-portal?tab=payments"
                    className="text-xs font-bold text-slate-600 hover:text-emerald-700 inline-flex items-center gap-1 transition-colors"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>View Client Payment History &amp; Official Receipts</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Payment Pending or Incomplete</h2>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  {result?.message ||
                    'The automated transaction has not been marked COMPLETED by UddoktaPay yet. If you just completed payment, please click Re-Verify below.'}
                </p>
                <div className="pt-4 flex justify-center gap-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-emerald-700 cursor-pointer"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" />
                    <span>Re-Verify Status</span>
                  </button>
                  <Link
                    to="/tools"
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    Compliance Tools
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

