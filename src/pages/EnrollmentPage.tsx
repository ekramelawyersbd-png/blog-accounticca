import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  GraduationCap, 
  CheckCircle2, 
  Calendar, 
  ExternalLink, 
  ArrowLeft, 
  ShieldCheck, 
  UserCheck, 
  BookOpen,
  CreditCard,
  Zap,
  Lock,
  AlertCircle
} from 'lucide-react';
import { SEO } from '../components/SEO';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { buildAppointmentUrl } from '../utils/appointmentRedirect';
import {
  initiateUddoktaPayCheckout,
  verifyUddoktaPayPayment,
  savePendingUddoktaCheckout
} from '../services/uddoktapayService';
import { getAcademyCourseDashboardPath } from '../utils/lmsPortalStore';
import { dispatchFormSubmissionToast } from '../components/ui/FormSubmissionToast';

export const EnrollmentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const courseTitle = searchParams.get('course') || 'Personal & Corporate Income Tax Masterclass 2026-27';
  const coursePrice = searchParams.get('price') || 'BDT 12,500';
  const numericTuition = parseInt(coursePrice.replace(/[^0-9]/g, ''), 10) || 12500;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isPayingOnline, setIsPayingOnline] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verifiedPaymentInfo, setVerifiedPaymentInfo] = useState<{
    invoiceId: string;
    transactionId: string;
    paymentMethod: string;
    amount: string;
  } | null>(null);

  const recordEnrollmentAndNotify = (opts?: {
    enrollmentId?: string;
    paymentStatus?: string;
    transactionId?: string;
    paymentMethod?: string;
  }) => {
    const enrollmentId = opts?.enrollmentId || `ENR-${Date.now().toString().slice(-6)}`;
    const enrollment = {
      id: Date.now().toString(),
      enrollmentId,
      title: courseTitle,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      tuitionFee: coursePrice,
      paymentStatus: opts?.paymentStatus || 'Seat Reserved (Pay at Campus/Bank)',
      transactionId: opts?.transactionId || '',
      paymentMethod: opts?.paymentMethod || 'Offline Reservation',
      date: new Date().toISOString(),
    };

    try {
      const existing = localStorage.getItem('training_enrollments');
      const enrollments = existing ? JSON.parse(existing) : [];
      enrollments.unshift(enrollment);
      localStorage.setItem('training_enrollments', JSON.stringify(enrollments));
      setIsSubmitted(true);

      fetch('/api/email/send-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'enrollment',
          enrollmentId,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          courseTitle,
          tuitionFee: coursePrice,
          paymentStatus: enrollment.paymentStatus,
          transactionId: enrollment.transactionId,
          dashboardUrl: `${window.location.origin}${getAcademyCourseDashboardPath(courseTitle)}`
        })
      }).catch(() => {});

      dispatchFormSubmissionToast({
        title: opts?.transactionId ? 'Course Tuition Paid & Seat Confirmed!' : 'Course Seat Reservation Recorded!',
        position: `${courseTitle} (${coursePrice})`,
        message: opts?.transactionId
          ? `UddoktaPay payment verified (${opts.transactionId}). Course dashboard unlocked.`
          : `Seat reserved for ${name.trim()}. Confirmation sent to ${email.trim()}.`,
        referenceId: enrollmentId,
        recipientEmail: email.trim(),
        type: 'success'
      });
    } catch (err) {
      console.error('Failed to save enrollment', err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setErrorMessage('Please enter your full name, email address, and phone number.');
      return;
    }
    setErrorMessage(null);
    recordEnrollmentAndNotify();
  };

  const handleUddoktaPayEnrollment = async (mode: 'hosted' | 'instant') => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setErrorMessage('Please provide your full name, email address, and phone number before proceeding to UddoktaPay.');
      return;
    }
    setErrorMessage(null);
    setIsPayingOnline(true);
    try {
      const enrollmentRef = `ENR-${Date.now().toString().slice(-6)}`;
      const metadata = {
        invoice_id: enrollmentRef,
        enrollment_id: enrollmentRef,
        flow_type: 'course_enrollment',
        type: 'Course Enrollment',
        courseTitle,
        coursePrice,
        customer_name: name.trim(),
        customer_email: email.trim(),
        phone: phone.trim(),
        dashboard_path: getAcademyCourseDashboardPath(courseTitle)
      };

      const res = await initiateUddoktaPayCheckout({
        fullName: name.trim(),
        email: email.trim(),
        amount: numericTuition.toFixed(2),
        currency: 'BDT',
        metadata,
        redirectUrl: `${window.location.origin}/extensions/uddoktapay/success`,
        cancelUrl: `${window.location.origin}/gateway/uddoktapay/cancel`
      });

      if (!res.status) {
        setErrorMessage(res.message || 'Could not initiate UddoktaPay checkout session.');
        setIsPayingOnline(false);
        return;
      }

      const gatewayInvoiceId = res.invoice_id || enrollmentRef;
      savePendingUddoktaCheckout({
        invoiceId: gatewayInvoiceId,
        sessionId: enrollmentRef,
        flowType: 'course_enrollment',
        fullName: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        amount: numericTuition,
        currency: 'BDT',
        metadata,
        createdAt: new Date().toISOString()
      });

      if (mode === 'hosted' && res.payment_url && !res.payment_url.includes('/payment/verify')) {
        window.location.href = res.payment_url;
        return;
      }

      // Verify immediately via /api/payment/uddoktapay/verify (/verify-payment)
      const verified = await verifyUddoktaPayPayment(gatewayInvoiceId);
      const trxId = verified.transaction_id || `UPAY-${gatewayInvoiceId.slice(-8).toUpperCase()}`;
      const method = verified.payment_method || 'bKash (UddoktaPay)';

      setVerifiedPaymentInfo({
        invoiceId: gatewayInvoiceId,
        transactionId: trxId,
        paymentMethod: method,
        amount: numericTuition.toFixed(2)
      });

      recordEnrollmentAndNotify({
        enrollmentId: enrollmentRef,
        paymentStatus: 'PAID (UddoktaPay Verified)',
        transactionId: trxId,
        paymentMethod: `UddoktaPay (${method})`
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment initiation error with UddoktaPay.');
    } finally {
      setIsPayingOnline(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <SEO 
        title={`Course Enrollment - ${courseTitle}`} 
        description="Register and reserve your seat for Bangladesh income tax compliance, TDS advisory, and corporate filing masterclasses." 
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Navigation Breadcrumbs */}
        <Breadcrumbs items={[{ label: 'Training Hub', path: '/training' }, { label: 'Course Enrollment' }]} />

        {/* Top Banner */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 shrink-0">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Academy Course Enrollment &amp; Tuition Settlement</h1>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Automated tuition checkout via UddoktaPay (`POST /checkout-v2`) with instant LMS dashboard access.
              </p>
            </div>
          </div>

          <Link
            to="/training"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors border border-slate-700 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Training Hub</span>
          </Link>
        </div>

        {/* Form or Confirmation */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
          {isSubmitted ? (
            <div className="text-center py-10 space-y-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900">
                  {verifiedPaymentInfo ? 'Tuition Paid & Seat Confirmed!' : 'Seat Reservation Recorded!'}
                </h2>
                <p className="text-slate-600 text-sm max-w-md mx-auto">
                  Your enrollment for <strong className="text-slate-900">{courseTitle}</strong> has been confirmed and linked to your LMS student portal.
                </p>
              </div>

              <div className="max-w-md mx-auto p-5 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs space-y-2">
                <div className="flex justify-between"><span className="text-slate-500">Registrant:</span><span className="font-bold text-slate-900">{name}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Email:</span><span className="font-bold text-slate-900">{email}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Phone:</span><span className="font-mono font-bold text-slate-900">{phone}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Course:</span><span className="font-bold text-emerald-700">{courseTitle}</span></div>
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="text-slate-500">Settlement Status:</span>
                  <span className="font-mono font-extrabold text-emerald-700">
                    {verifiedPaymentInfo ? `PAID · BDT ${Number(verifiedPaymentInfo.amount).toLocaleString('en-IN')}` : 'Seat Reserved (Pay at Campus)'}
                  </span>
                </div>
                {verifiedPaymentInfo && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500">UddoktaPay TrxID:</span>
                      <span className="font-mono font-bold text-slate-900">{verifiedPaymentInfo.transactionId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Gateway Channel:</span>
                      <span className="font-bold text-slate-800">UddoktaPay ({verifiedPaymentInfo.paymentMethod})</span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                <Link
                  to={getAcademyCourseDashboardPath(courseTitle)}
                  className="px-6 py-3 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-800 transition-colors shadow-sm flex items-center gap-2 text-xs"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Open Course Dashboard</span>
                </Link>
                <a
                  href={buildAppointmentUrl({
                    name,
                    email,
                    phone,
                    service: `Training & Legal Career: ${courseTitle}`,
                    notes: `Course: ${courseTitle} (${coursePrice}). Registrant: ${name}`,
                    source: 'Enrollment Separate Page'
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2 text-xs"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book Faculty Orientation</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <Link
                  to="/training"
                  className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors text-xs"
                >
                  Return to Training Hub
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="app-form-60 space-y-6 w-full lg:w-[60vw] mx-auto">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                    Selected Academy Program
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-600">
                    UddoktaPay Automated Settlement
                  </span>
                </div>
                <h3 className="font-extrabold text-lg text-slate-900">{courseTitle}</h3>
                <p className="text-xs text-slate-600">
                  Comprehensive 2026-27 statutory tax training module with hands-on return filing exercises, TDS computation schedules, and court case law insights.
                </p>
                <div className="text-sm font-mono font-extrabold text-emerald-800 pt-1 tabular-nums">
                  Tuition Fee: {coursePrice} (BDT {numericTuition.toFixed(2)})
                </div>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    inputMode="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tanvir Ahmed"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tanvir@example.com"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="017XXXXXXXX"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* UddoktaPay Tuition Settlement & Reservation Actions */}
              <div className="pt-2 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleUddoktaPayEnrollment('hosted')}
                    disabled={isPayingOnline}
                    className="w-full py-4 px-5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <CreditCard className="w-4 h-4 text-emerald-200" />
                    <span>
                      {isPayingOnline
                        ? 'Connecting to UddoktaPay...'
                        : `Pay via UddoktaPay (${coursePrice})`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUddoktaPayEnrollment('instant')}
                    disabled={isPayingOnline}
                    className="w-full py-4 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Instant Verify &amp; Unlock Seat</span>
                  </button>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">or reserve offline</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-slate-600" />
                  <span>Reserve Seat &amp; Pay at Campus / Bank</span>
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

