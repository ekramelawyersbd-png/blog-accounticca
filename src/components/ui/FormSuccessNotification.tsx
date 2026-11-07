import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Copy,
  Check,
  X,
  Sparkles,
  Mail,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

export interface FormSuccessNotificationProps {
  /** Controls whether the notification is visible (wrapped in AnimatePresence) */
  isVisible?: boolean;
  /** Main heading of the notification */
  title: string;
  /** Detailed confirmation message */
  message: string;
  /** Optional subtitle or context (e.g. practice area, slot, position) */
  subtitle?: string;
  /** Optional tracking or docket reference number */
  referenceId?: string;
  /** Optional recipient email address to display */
  recipientEmail?: string;
  /** Visual variant: 'inline' for form containers, 'banner' for compact alerts, 'floating' for toast overlays */
  variant?: 'inline' | 'banner' | 'floating';
  /** Theme tone: 'success' (default), 'info', or 'error' */
  type?: 'success' | 'info' | 'error';
  /** Auto-dismiss duration in ms (0 or undefined disables auto-dismiss for inline variant) */
  autoHideDurationMs?: number;
  /** Callback when the user dismisses or resets the notification */
  onDismiss?: () => void;
  /** Optional action buttons or links rendered in the notification footer */
  actions?: React.ReactNode;
  /** Optional badge label override */
  badgeText?: string;
  /** Additional className */
  className?: string;
}

/**
 * Reusable Framer Motion form success notification component.
 * Provides immediate, spring-animated positive feedback upon form submission
 * with an animated SVG checkmark, copyable reference ID, and optional auto-dismiss progress bar.
 */
export const FormSuccessNotification: React.FC<FormSuccessNotificationProps> = ({
  isVisible = true,
  title,
  message,
  subtitle,
  referenceId,
  recipientEmail,
  variant = 'inline',
  type = 'success',
  autoHideDurationMs,
  onDismiss,
  actions,
  badgeText,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isVisible || !autoHideDurationMs || !onDismiss || isHovered) return;
    const timer = window.setTimeout(() => {
      onDismiss();
    }, autoHideDurationMs);
    return () => window.clearTimeout(timer);
  }, [isVisible, autoHideDurationMs, onDismiss, isHovered]);

  const handleCopyRef = async () => {
    if (!referenceId) return;
    try {
      await navigator.clipboard.writeText(referenceId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      const input = document.createElement('input');
      input.value = referenceId;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    }
  };

  const isError = type === 'error';
  const isDarkFloating = variant === 'floating';

  const containerStyle = isDarkFloating
    ? isError
      ? 'bg-rose-950/95 border-rose-500/50 text-white shadow-2xl shadow-rose-950/40 backdrop-blur-xl'
      : 'bg-[#0b192c]/95 border-emerald-500/50 text-white shadow-2xl shadow-emerald-950/40 backdrop-blur-xl'
    : isError
      ? 'bg-gradient-to-br from-rose-50/95 via-white to-rose-50/60 border-rose-200/90 text-slate-900 shadow-lg shadow-rose-950/5'
      : 'bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/50 border-emerald-200/90 text-slate-900 shadow-lg shadow-emerald-950/5';

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          role="status"
          aria-live="polite"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          initial={{ opacity: 0, y: variant === 'floating' ? -24 : 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: variant === 'floating' ? -16 : -10, scale: 0.96 }}
          transition={{
            type: 'spring',
            stiffness: 380,
            damping: 28,
            mass: 0.8,
          }}
          className={`relative overflow-hidden rounded-2xl border ${containerStyle} ${className}`}
        >
          {/* Top Accent Gradient Bar */}
          <div
            className={`h-1.5 w-full ${
              isError
                ? 'bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500'
                : 'bg-gradient-to-r from-emerald-500 via-[#c7a76b] to-teal-500'
            }`}
          />

          {/* Decorative Ambient Glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full blur-2xl ${
              isError ? 'bg-rose-400/15' : 'bg-emerald-400/20'
            }`}
            aria-hidden="true"
          />

          <div className={variant === 'banner' ? 'p-4' : 'p-5 sm:p-6'}>
            <div className="flex items-start gap-3.5 sm:gap-4">
              {/* Animated Checkmark / Alert Icon Badge */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 420,
                  damping: 20,
                  delay: 0.08,
                }}
                className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-xs ${
                  isDarkFloating
                    ? isError
                      ? 'bg-rose-500/20 border-rose-400/40 text-rose-300'
                      : 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                    : isError
                      ? 'bg-rose-100 border-rose-200 text-rose-700'
                      : 'bg-emerald-100/90 border-emerald-300/80 text-emerald-700'
                }`}
              >
                {/* Subtle expanding ring pulse */}
                {!isError && (
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0.7 }}
                    animate={{ scale: 1.55, opacity: 0 }}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      ease: 'easeOut',
                    }}
                    className={`pointer-events-none absolute inset-0 rounded-2xl ${
                      isDarkFloating ? 'bg-emerald-400/25' : 'bg-emerald-500/20'
                    }`}
                    aria-hidden="true"
                  />
                )}

                {isError ? (
                  <AlertCircle className="h-6 w-6" />
                ) : (
                  <svg
                    className="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <motion.circle
                      cx="12"
                      cy="12"
                      r="9.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeOpacity="0.35"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
                    />
                    <motion.path
                      d="M7.5 12.5L10.5 15.5L16.5 9"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{
                        duration: 0.42,
                        ease: 'easeOut',
                        delay: 0.22,
                      }}
                    />
                  </svg>
                )}
              </motion.div>

              {/* Main Notification Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.12 }}
                  >
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest ${
                        isDarkFloating
                          ? isError
                            ? 'text-rose-300'
                            : 'text-emerald-300'
                          : isError
                            ? 'text-rose-700'
                            : 'text-emerald-700'
                      }`}
                    >
                      {isError ? (
                        <AlertCircle className="h-3 w-3" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      <span>
                        {badgeText ||
                          (isError
                            ? 'Submission Alert'
                            : 'Verified Submission Receipt')}
                      </span>
                    </span>

                    <h4
                      className={`mt-0.5 text-sm sm:text-base font-extrabold leading-snug ${
                        isDarkFloating ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {title}
                    </h4>
                  </motion.div>

                  {onDismiss && (
                    <button
                      type="button"
                      onClick={onDismiss}
                      aria-label="Dismiss notification"
                      className={`rounded-lg p-1.5 transition cursor-pointer ${
                        isDarkFloating
                          ? 'text-slate-400 hover:bg-white/10 hover:text-white'
                          : 'text-slate-400 hover:bg-slate-200/60 hover:text-slate-700'
                      }`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {subtitle && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.16 }}
                    className={`mt-1 text-xs font-bold ${
                      isDarkFloating ? 'text-[#e3c994]' : 'text-emerald-800'
                    }`}
                  >
                    {subtitle}
                  </motion.p>
                )}

                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.18 }}
                  className={`mt-1.5 text-xs sm:text-[13px] leading-relaxed ${
                    isDarkFloating ? 'text-slate-200' : 'text-slate-600'
                  }`}
                >
                  {message}
                </motion.p>

                {/* Reference ID & Recipient Email Strip */}
                {(referenceId || recipientEmail) && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.24 }}
                    className={`mt-3.5 pt-3 border-t flex flex-wrap items-center justify-between gap-2 ${
                      isDarkFloating ? 'border-white/10' : 'border-emerald-200/70'
                    }`}
                  >
                    {referenceId && (
                      <div
                        className={`flex items-center gap-2 rounded-xl px-3 py-1.5 border ${
                          isDarkFloating
                            ? 'bg-white/10 border-white/15'
                            : 'bg-white border-emerald-200/90 shadow-2xs'
                        }`}
                      >
                        <ShieldCheck
                          className={`h-3.5 w-3.5 shrink-0 ${
                            isDarkFloating ? 'text-emerald-300' : 'text-emerald-600'
                          }`}
                        />
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            isDarkFloating ? 'text-slate-300' : 'text-slate-500'
                          }`}
                        >
                          Ref ID:
                        </span>
                        <span
                          className={`font-mono text-xs font-black tracking-wide ${
                            isDarkFloating ? 'text-emerald-300' : 'text-emerald-800'
                          }`}
                        >
                          {referenceId}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyRef}
                          className={`ml-1 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold transition cursor-pointer ${
                            isDarkFloating
                              ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-400/30 text-emerald-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800'
                          }`}
                          title="Copy Reference ID"
                        >
                          {copied ? (
                            <>
                              <Check className="h-3 w-3" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {recipientEmail && (
                      <div
                        className={`inline-flex items-center gap-1.5 text-[11px] font-medium truncate max-w-full ${
                          isDarkFloating ? 'text-slate-300' : 'text-slate-600'
                        }`}
                      >
                        <Mail
                          className={`h-3.5 w-3.5 shrink-0 ${
                            isDarkFloating ? 'text-[#c7a76b]' : 'text-emerald-600'
                          }`}
                        />
                        <span className="truncate">{recipientEmail}</span>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Custom Action Buttons */}
                {actions && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.28 }}
                    className="mt-4 flex flex-wrap items-center gap-2.5"
                  >
                    {actions}
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Animated Auto-Hide Countdown Progress Bar */}
          {autoHideDurationMs && autoHideDurationMs > 0 && !isHovered && (
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{
                duration: autoHideDurationMs / 1000,
                ease: 'linear',
              }}
              style={{ transformOrigin: 'left' }}
              className={`h-1 w-full ${
                isError
                  ? 'bg-rose-400/70'
                  : 'bg-gradient-to-r from-emerald-400 via-[#c7a76b] to-teal-400'
              }`}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FormSuccessNotification;
