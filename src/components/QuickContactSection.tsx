import React, { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Calendar,
  Send,
  CheckCircle2,
  Phone,
  MessageCircle,
  Clock,
  ShieldCheck,
  Building2,
  ArrowRight,
  ExternalLink,
  Scale,
  Sparkles,
  MapPin,
  AlertCircle
} from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getAccessToken } from '../services/workspaceAuth';
import { getStoredContactSheetId } from '../services/contactSheetsSync';
import { dispatchFormSubmissionToast, FormSuccessNotification } from './ui/FormSubmissionToast';
import { PatternFormat } from 'react-number-format';

const PRIMARY_PHONE = '+880 1335-230170';
const RAW_PHONE = '+8801335230170';
const ACCOUNTICCA_EMAIL = 'info@accounticca.com';
const ELAWYERS_EMAIL = 'info@elawyersbd.com';

const SERVICES = [
  'Corporate Law & RJSC Compliance',
  'Corporate Tax, VAT & Statutory Audit',
  'Fractional CFO & Financial Modeling',
  'BIDA Approvals & Foreign Direct Investment',
  'Commercial Contracts & IP Protection',
  'Individual Income Tax Return 2026-27',
  'Integrated Joint Ecosystem Consultation'
];

const TIME_SLOTS = [
  '11:00 AM – 12:00 PM (Morning)',
  '02:30 PM – 03:30 PM (Afternoon)',
  '05:00 PM – 06:00 PM (Evening)'
];

export function QuickContactSection() {
  const [activeTab, setActiveTab] = useState<'inquiry' | 'appointment'>('inquiry');

  // Inquiry state
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryService, setInquiryService] = useState(SERVICES[0]);
  const [inquiryUrgency, setInquiryUrgency] = useState('Standard (24–48h)');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);
  const [submittedInquiryRef, setSubmittedInquiryRef] = useState<string | null>(null);

  // Appointment state
  const [apptMode, setApptMode] = useState<'chamber' | 'virtual'>('chamber');
  const [apptPractice, setApptPractice] = useState('Corporate Law & RJSC Compliance');
  const [apptDate, setApptDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    // skip to next business day if Friday or Saturday
    if (d.getDay() === 5) d.setDate(d.getDate() + 2);
    if (d.getDay() === 6) d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [apptTimeSlot, setApptTimeSlot] = useState(TIME_SLOTS[0]);
  const [apptName, setApptName] = useState('');
  const [apptPhone, setApptPhone] = useState('');
  const [apptEmail, setApptEmail] = useState('');
  const [isSubmittingAppt, setIsSubmittingAppt] = useState(false);
  const [submittedApptRef, setSubmittedApptRef] = useState<string | null>(null);

  // Validation
  const [formError, setFormError] = useState<string | null>(null);

  const handleInquirySubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!inquiryName.trim() || !inquiryPhone.trim() || !inquiryMessage.trim()) {
      setFormError('Please complete your name, phone number, and brief description.');
      return;
    }

    setIsSubmittingInquiry(true);
    const refNumber = Math.floor(10000 + Math.random() * 90000);
    const referenceId = `INQ-2026-${refNumber}`;
    const division = inquiryService.includes('Law') || inquiryService.includes('Contracts') || inquiryService.includes('BIDA')
      ? 'E-Lawyers Chambers'
      : 'Accounticca Advisory';

    try {
      await addDoc(collection(db, 'contact_messages'), {
        referenceId,
        fullName: inquiryName.trim(),
        phone: inquiryPhone.trim(),
        email: inquiryEmail.trim() || 'N/A',
        service: inquiryService,
        urgency: inquiryUrgency,
        division,
        message: `[Urgency: ${inquiryUrgency}]\n${inquiryMessage.trim()}`,
        status: 'new',
        source: 'homepage_quick_intake',
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Firestore quick backup error:', err);
    }

    // Best-effort backend contact sync
    try {
      const workspaceAccessToken = getAccessToken();
      const spreadsheetId = getStoredContactSheetId();
      await fetch('/api/contact/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceId,
          requestType: 'Homepage Quick Inquiry',
          division,
          clientName: inquiryName.trim(),
          email: inquiryEmail.trim() || 'info@accounticca.com',
          phone: inquiryPhone.trim(),
          serviceArea: inquiryService,
          messageOrNotes: `[Urgency: ${inquiryUrgency}] ${inquiryMessage.trim()}`,
          status: 'New Inquiry',
          workspaceAccessToken: workspaceAccessToken || undefined,
          spreadsheetId: spreadsheetId || undefined,
        }),
      });
    } catch {
      // silent fallback
    }

    setIsSubmittingInquiry(false);
    setSubmittedInquiryRef(referenceId);

    dispatchFormSubmissionToast({
      title: 'Written Brief Submitted!',
      position: `${inquiryService} · ${division}`,
      message: `Thank you, ${inquiryName.trim()}. Our senior desk will review your brief and respond shortly.`,
      referenceId,
      recipientEmail: inquiryEmail.trim() || undefined,
      type: 'success',
    });
  };

  const handleApptSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!apptName.trim() || !apptPhone.trim()) {
      setFormError('Please enter your name and phone number for the consultation.');
      return;
    }

    setIsSubmittingAppt(true);
    const refNumber = Math.floor(20000 + Math.random() * 80000);
    const referenceId = `APT-2026-${refNumber}`;

    try {
      await addDoc(collection(db, 'consultation_appointments'), {
        referenceId,
        fullName: apptName.trim(),
        phone: apptPhone.trim(),
        email: apptEmail.trim() || 'N/A',
        practiceArea: apptPractice,
        consultationMode: apptMode === 'chamber' ? 'In-Chamber (Panthapath, Dhaka)' : 'Virtual Consultation (Zoom / Meet)',
        preferredDate: apptDate,
        preferredTimeSlot: apptTimeSlot,
        status: 'confirmed',
        source: 'homepage_quick_intake',
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Firestore appointment save error:', err);
    }

    setIsSubmittingAppt(false);
    setSubmittedApptRef(referenceId);

    dispatchFormSubmissionToast({
      title: 'Consultation Slot Reserved!',
      position: `${apptPractice} · ${apptDate}`,
      message: `Confirmed for ${apptName.trim()} (${apptTimeSlot}).`,
      referenceId,
      recipientEmail: apptEmail.trim() || undefined,
      type: 'success',
    });
  };

  return (
    <section 
      id="contact-form-section" 
      className="w-full scroll-mt-8 py-12 sm:py-16 px-4 sm:px-6 lg:px-10 xl:px-12 bg-white border-t border-[#fffefe]"
    >
      <div className="w-full max-w-full mx-auto">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/90 border border-emerald-300 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>Chambers Consultation &amp; Intake Desk</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              One Point of Contact. <span className="text-emerald-700">Complete Legal &amp; Tax Support.</span>
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Submit a structured written brief or reserve a consultation slot directly with our senior advocates and tax consultants.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <Link
              to="/contact"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 border border-slate-200/90 hover:border-emerald-300 px-4 py-2.5 rounded-xl shadow-2xs transition-all"
            >
              <span>Open Full Chambers Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Centered 60% Display-Width Form Architecture */}
        <div className="space-y-8">
          {/* Top Chambers Summary & Direct Hotline Strip (Centered 60% on Desktop) */}
          <div className="app-form-60 w-full lg:w-[60vw] mx-auto">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-emerald-700" />
                    <span>Panthapath Chambers, Dhaka</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    BTI Centara Grand, 144 Green Road, Panthapath, Dhaka 1205. Available Sunday to Thursday (10:00 AM – 7:00 PM) for in-person consultations &amp; online appointments.
                  </p>
                </div>

                {/* Direct Hotline */}
                <div className="bg-emerald-50/80 rounded-2xl p-4 border border-emerald-200/70 shrink-0">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Direct Advisory Hotline</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                      Live Desk
                    </span>
                  </div>
                  <a
                    href={`tel:${RAW_PHONE}`}
                    className="text-xl sm:text-2xl font-black text-slate-900 hover:text-emerald-700 transition-colors flex items-center gap-2 tabular-nums"
                  >
                    <Phone className="w-5 h-5 text-emerald-600" />
                    <span>{PRIMARY_PHONE}</span>
                  </a>
                  <div className="mt-3 flex items-center gap-2">
                    <a
                      href="https://wa.me/8801335230170"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp Chat</span>
                    </a>
                    <a
                      href={`mailto:${ACCOUNTICCA_EMAIL}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition"
                    >
                      <span>Email Dispatch</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5 mt-5 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Dual Coordinated Review:</strong> Legal counsel &amp; Chartered Accountants assess each matter together.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Priority Turnaround:</strong> Standard response within 24–48 hours; expedited for statutory deadlines.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Scale className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Official Reference:</strong> Every inquiry or booking receives a tracked docket reference number.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Centered 60% Display-Width Interactive Quick Form with Tabs */}
          <div className="app-form-60 w-full lg:w-[60vw] mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden">
            {/* Tabs Header */}
            <div className="border-b border-slate-200/80 bg-slate-50/70 p-2 sm:p-3">
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-200/60 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('inquiry');
                    setFormError(null);
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeTab === 'inquiry'
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Send an inquiry</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('appointment');
                    setFormError(null);
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeTab === 'appointment'
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Book appointment</span>
                </button>
              </div>
            </div>

            {/* Form Content Area */}
            <div className="p-6 sm:p-8">
              {formError && (
                <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* TAB 1: SEND AN INQUIRY */}
              {activeTab === 'inquiry' && (
                <div>
                  {submittedInquiryRef ? (
                    <FormSuccessNotification
                      isVisible={true}
                      variant="inline"
                      title="Inquiry Submitted Successfully"
                      subtitle={inquiryService}
                      message="Our chambers practice desk has received your brief and will review your file within 24 to 48 hours."
                      referenceId={submittedInquiryRef}
                      recipientEmail={inquiryEmail.trim() || undefined}
                      onDismiss={() => {
                        setSubmittedInquiryRef(null);
                        setInquiryMessage('');
                      }}
                      actions={
                        <>
                          <a
                            href={`https://wa.me/8801335230170?text=${encodeURIComponent(`Hello, I submitted an inquiry with reference ${submittedInquiryRef} on Accounticca/E-Lawyers.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Follow up on WhatsApp</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              setSubmittedInquiryRef(null);
                              setInquiryMessage('');
                            }}
                            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
                          >
                            Submit Another Brief
                          </button>
                        </>
                      }
                    />
                  ) : (
                    <form onSubmit={handleInquirySubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Full Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            autoComplete="name"
                            inputMode="text"
                            required
                            value={inquiryName}
                            onChange={(e) => setInquiryName(e.target.value)}
                            placeholder="e.g. Md. Tanvir Ahmed"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 text-sm text-slate-900 outline-none transition"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Phone / WhatsApp <span className="text-rose-500">*</span>
                          </label>
                          <PatternFormat
                            type="tel"
                            name="tel"
                            autoComplete="tel"
                            inputMode="tel"
                            required
                            format={inquiryPhone.trim().startsWith('+') ? '+### ####-######' : '#####-######'}
                            mask="_"
                            value={inquiryPhone}
                            onValueChange={(values) => setInquiryPhone(values.formattedValue)}
                            placeholder="01711-000000"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 text-sm font-mono text-slate-900 outline-none transition"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Practice / Service Area
                          </label>
                          <select
                            value={inquiryService}
                            onChange={(e) => setInquiryService(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 text-sm text-slate-900 outline-none transition bg-white"
                          >
                            {SERVICES.map((srv) => (
                              <option key={srv} value={srv}>
                                {srv}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Email Address (Optional)
                          </label>
                          <input
                            type="email"
                            name="email"
                            autoComplete="email"
                            inputMode="email"
                            value={inquiryEmail}
                            onChange={(e) => setInquiryEmail(e.target.value)}
                            placeholder="name@company.com"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 text-sm text-slate-900 outline-none transition"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-bold text-slate-700">
                            Matter Description <span className="text-rose-500">*</span>
                          </label>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">Urgency:</span>
                            <select
                              value={inquiryUrgency}
                              onChange={(e) => setInquiryUrgency(e.target.value)}
                              className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-0.5 outline-none cursor-pointer"
                            >
                              <option value="Standard (24–48h)">Standard (24–48h)</option>
                              <option value="Approaching Deadline (< 7 Days)">Approaching Deadline (&lt; 7 Days)</option>
                              <option value="Urgent Notice / Hearing">Urgent Notice / Hearing</option>
                            </select>
                          </div>
                        </div>
                        <textarea
                          required
                          rows={3}
                          value={inquiryMessage}
                          onChange={(e) => setInquiryMessage(e.target.value)}
                          placeholder="Briefly state your requirements (e.g. RJSC company formation, NBR tax assessment, VAT audit notice, contract vetting)..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 text-sm text-slate-900 outline-none transition resize-none"
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <span className="text-[11px] text-slate-500">
                          Directly routed to Chambers Docket &amp; Lead Counsel
                        </span>
                        <button
                          type="submit"
                          disabled={isSubmittingInquiry}
                          className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                        >
                          <Send className="w-4 h-4" />
                          <span>{isSubmittingInquiry ? 'Sending...' : 'Send Inquiry Brief'}</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* TAB 2: BOOK AN APPOINTMENT */}
              {activeTab === 'appointment' && (
                <div>
                  {submittedApptRef ? (
                    <FormSuccessNotification
                      isVisible={true}
                      variant="inline"
                      title="Appointment Slot Reserved"
                      subtitle={`${apptPractice} · ${apptDate} (${apptTimeSlot})`}
                      message={`Your appointment has been queued for ${apptDate} during ${apptTimeSlot}. Our chambers desk will confirm via WhatsApp/SMS.`}
                      referenceId={submittedApptRef}
                      recipientEmail={apptEmail.trim() || undefined}
                      onDismiss={() => {
                        setSubmittedApptRef(null);
                      }}
                      actions={
                        <>
                          <Link
                            to="/contact?tab=appointment"
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition"
                          >
                            <span>Manage in Full Calendar</span>
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setSubmittedApptRef(null);
                            }}
                            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
                          >
                            Book Another Slot
                          </button>
                        </>
                      }
                    />
                  ) : (
                    <form onSubmit={handleApptSubmit} className="space-y-4">
                      {/* Consultation Mode Toggle */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Consultation Format
                        </label>
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => setApptMode('chamber')}
                            className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center gap-2.5 ${
                              apptMode === 'chamber'
                                ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold ring-1 ring-emerald-500'
                                : 'border-slate-200 hover:border-slate-300 text-slate-700'
                            }`}
                          >
                            <Building2 className={`w-4 h-4 ${apptMode === 'chamber' ? 'text-emerald-700' : 'text-slate-400'}`} />
                            <div className="text-xs">
                              <div>In-Chamber Meeting</div>
                              <div className="text-[10px] text-slate-500 font-normal">Panthapath, Dhaka</div>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setApptMode('virtual')}
                            className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center gap-2.5 ${
                              apptMode === 'virtual'
                                ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold ring-1 ring-emerald-500'
                                : 'border-slate-200 hover:border-slate-300 text-slate-700'
                            }`}
                          >
                            <Sparkles className={`w-4 h-4 ${apptMode === 'virtual' ? 'text-emerald-700' : 'text-slate-400'}`} />
                            <div className="text-xs">
                              <div>Virtual Video Call</div>
                              <div className="text-[10px] text-slate-500 font-normal">Zoom / Google Meet</div>
                            </div>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Practice Area
                          </label>
                          <select
                            value={apptPractice}
                            onChange={(e) => setApptPractice(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 text-sm text-slate-900 outline-none transition bg-white"
                          >
                            {SERVICES.map((srv) => (
                              <option key={srv} value={srv}>
                                {srv}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Preferred Date (Sun–Thu)
                          </label>
                          <input
                            type="date"
                            required
                            value={apptDate}
                            onChange={(e) => setApptDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 text-sm text-slate-900 outline-none transition bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Preferred Time Slot
                          </label>
                          <select
                            value={apptTimeSlot}
                            onChange={(e) => setApptTimeSlot(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 text-sm text-slate-900 outline-none transition bg-white"
                          >
                            {TIME_SLOTS.map((slot) => (
                              <option key={slot} value={slot}>
                                {slot}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Phone / WhatsApp <span className="text-rose-500">*</span>
                          </label>
                          <PatternFormat
                            type="tel"
                            name="tel"
                            autoComplete="tel"
                            inputMode="tel"
                            required
                            format={apptPhone.trim().startsWith('+') ? '+### ####-######' : '#####-######'}
                            mask="_"
                            value={apptPhone}
                            onValueChange={(values) => setApptPhone(values.formattedValue)}
                            placeholder="01711-000000"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 text-sm font-mono text-slate-900 outline-none transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          autoComplete="name"
                          inputMode="text"
                          required
                          value={apptName}
                          onChange={(e) => setApptName(e.target.value)}
                          placeholder="Your full name"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 text-sm text-slate-900 outline-none transition"
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <span className="text-[11px] text-slate-500">
                          Slots confirmed subject to chamber business hours
                        </span>
                        <button
                          type="submit"
                          disabled={isSubmittingAppt}
                          className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                        >
                          <Calendar className="w-4 h-4" />
                          <span>{isSubmittingAppt ? 'Booking...' : 'Reserve Consultation Slot'}</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
