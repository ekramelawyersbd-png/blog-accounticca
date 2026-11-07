import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileSpreadsheet,
  Mail,
  Sparkles,
  Clock,
  RotateCcw,
} from 'lucide-react';

export interface FormSuccessAnimationProps {
  referenceId: string;
  clientName: string;
  email: string;
  phone: string;
  service: string;
  division: string;
  message: string;
  inquirySheetSynced: boolean;
  emailDraftUrl: string | null;
  onReset: () => void;
}

export const FormSuccessAnimation: React.FC<FormSuccessAnimationProps> = ({
  referenceId,
  clientName,
  email,
  phone,
  service,
  division,
  message,
  inquirySheetSynced,
  emailDraftUrl,
  onReset,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyRef = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(referenceId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 340,
        damping: 26,
      }}
      className="relative overflow-hidden rounded-3xl border border-emerald-200/90 bg-gradient-to-b from-white via-emerald-50/40 to-teal-50/30 p-6 shadow-xl shadow-emerald-950/5 sm:p-9"
    >
      {/* Decorative ambient background glows */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-200/40 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-teal-200/30 blur-3xl"
        aria-hidden="true"
      />

      {/* Hero Animated Success Icon */}
      <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
        {/* Expanding pulse ripples using Framer Motion */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0.75 }}
          animate={{ scale: 1.45, opacity: 0 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
          className="absolute inset-0 rounded-full bg-emerald-400/25"
          aria-hidden="true"
        />
        <motion.div
          initial={{ scale: 0.8, opacity: 0.6 }}
          animate={{ scale: 1.55, opacity: 0 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.45 }}
          className="absolute -inset-2 rounded-full bg-teal-400/15"
          aria-hidden="true"
        />

        {/* Primary SVG Checkmark with Framer Motion stroke animations */}
        <motion.svg
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 360, damping: 20 }}
          className="relative h-24 w-24 drop-shadow-md"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle outer track */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="#a7f3d0"
            strokeWidth="3"
            opacity="0.6"
          />
          {/* Animated outline ring */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            stroke="#059669"
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
          />
          {/* Solid bouncing background disc */}
          <motion.circle
            cx="50"
            cy="50"
            r="38"
            fill="url(#emeraldGradient)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22, delay: 0.1 }}
          />
          {/* Animated checkmark path */}
          <motion.path
            d="M32 50.5L44 62.5L68 37.5"
            stroke="#ffffff"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.28 }}
          />
          <defs>
            <linearGradient id="emeraldGradient" x1="12" y1="12" x2="88" y2="88" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0b5e48" />
              <stop offset="1" stopColor="#047857" />
            </linearGradient>
          </defs>
        </motion.svg>
      </div>

      {/* Confirmation Headings & Reference ID */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mt-5 text-center"
      >
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-900 shadow-2xs backdrop-blur-xs">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
          <span>Inquiry Successfully Registered</span>
        </div>

        <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          Thank you, {clientName.split(' ')[0] || 'Client'}!
        </h3>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
          Your matter brief has been logged directly into our chamber ledger and queued for partner review.
        </p>

        {/* Reference Number Card */}
        <div className="mx-auto mt-5 max-w-md rounded-2xl border border-emerald-200/90 bg-white p-3.5 shadow-xs sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-left">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Official Docket Reference</p>
              <p className="font-mono text-base font-bold tracking-tight text-emerald-950 sm:text-lg">
                {referenceId}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyRef}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-900 focus:outline-none focus:ring-4 focus:ring-emerald-600/15"
              aria-label="Copy docket reference ID"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                  <span className="text-emerald-800">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                  <span>Copy ID</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Sync Status Badges */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="mt-5 flex flex-wrap items-center justify-center gap-2.5 text-xs"
      >
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200/80 bg-white px-3 py-1.5 font-medium text-emerald-900 shadow-2xs">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
          <span>Firestore Database Confirmed</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200/80 bg-white px-3 py-1.5 font-medium text-emerald-900 shadow-2xs">
          <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
          <span>{inquirySheetSynced ? 'Synced to Workspace Google Sheet' : 'Logged to Workspace Ledger'}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200/80 bg-white px-3 py-1.5 font-medium text-emerald-900 shadow-2xs">
          <Clock className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
          <span>Response SLA: 4 business hours</span>
        </span>
      </motion.div>

      {/* Docket Summary Details */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.38 }}
        className="mt-6 rounded-2xl border border-slate-200/90 bg-white/95 p-4 text-left shadow-xs sm:p-5"
      >
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Summary of Inquiry</p>
        <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
          <div>
            <span className="text-slate-500">Practice Area:</span>
            <p className="mt-0.5 font-semibold text-slate-900">{service}</p>
          </div>
          <div>
            <span className="text-slate-500">Routing Desk:</span>
            <p className="mt-0.5 font-semibold text-slate-900">{division}</p>
          </div>
          <div>
            <span className="text-slate-500">Client Contact:</span>
            <p className="mt-0.5 font-semibold text-slate-900">
              {clientName} · <span className="text-slate-600">{email}</span>
            </p>
          </div>
          <div>
            <span className="text-slate-500">Phone / WhatsApp:</span>
            <p className="mt-0.5 font-semibold text-slate-900">{phone}</p>
          </div>
        </div>

        <div className="mt-3 border-t border-slate-100 pt-3">
          <span className="text-slate-500 text-xs">Matter Brief:</span>
          <p className="mt-1 line-clamp-3 rounded-lg bg-slate-50 p-2.5 text-xs leading-5 text-slate-700">
            {message}
          </p>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45 }}
        className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <button
          type="button"
          onClick={onReset}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-emerald-600/15"
        >
          <RotateCcw className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
          <span>Submit Another Inquiry</span>
        </button>

        {emailDraftUrl && (
          <a
            href={emailDraftUrl}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0b5e48] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#084b3a] focus:outline-none focus:ring-4 focus:ring-emerald-600/20"
          >
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Open Email Draft (Attach Documents)</span>
            <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden="true" />
          </a>
        )}
      </motion.div>

      <p className="mt-4 text-center text-[11px] text-slate-500">
        A senior advisor will review your matter and contact you at {email} within our guaranteed response window.
      </p>
    </motion.div>
  );
};

