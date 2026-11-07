import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export type EmailDispatchStatus = 'success' | 'error' | null;

export interface EmailDispatchToastProps {
  status: EmailDispatchStatus;
  title?: string;
  message?: string;
  referenceId?: string;
  recipients?: string[];
  relayMode?: string;
  previewUrl?: string | null;
  onClose: () => void;
  onRetry?: () => void;
  autoDismissMs?: number;
  className?: string;
}

export const EmailDispatchToast: React.FC<EmailDispatchToastProps> = ({
  status,
  title,
  message,
  referenceId,
  recipients,
  relayMode,
  previewUrl,
  onClose,
  onRetry,
  autoDismissMs = 6000,
  className = '',
}) => {
  const [progress, setProgress] = useState<number>(100);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const isSuccess = status === 'success';
  const isError = status === 'error';

  const defaultTitle = isSuccess ? 'Email Sent Successfully' : 'Failed to send';
  const displayTitle = title || defaultTitle;

  // Auto-dismiss countdown timer with progress bar
  useEffect(() => {
    if (!status || autoDismissMs <= 0) return;

    setProgress(100);
    const intervalMs = 50;
    const step = (intervalMs / autoDismissMs) * 100;

    const timer = setInterval(() => {
      if (isPaused) return;

      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          setTimeout(() => {
            onClose();
          }, 0);
          return 0;
        }
        return Math.max(0, prev - step);
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [status, autoDismissMs, isPaused, onClose]);

  if (!status) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`fixed top-5 right-5 sm:right-8 z-[130] w-[calc(100vw-2.5rem)] sm:w-full sm:max-w-md animate-in fade-in slide-in-from-top-4 duration-200 pointer-events-auto ${className}`}
      data-testid="email-dispatch-toast"
    >
      <div
        className={`rounded-2xl border shadow-2xl overflow-hidden backdrop-blur-md transition-all ${
          isSuccess
            ? 'bg-slate-950/95 border-emerald-500/50 text-white shadow-emerald-950/40 ring-1 ring-emerald-500/30'
            : 'bg-slate-950/95 border-rose-500/50 text-white shadow-rose-950/40 ring-1 ring-rose-500/30'
        }`}
      >
        {/* Progress bar countdown */}
        {autoDismissMs > 0 && (
          <div className="w-full bg-slate-800/80 h-1 overflow-hidden">
            <div
              className={`h-full transition-[width] duration-75 ease-linear ${
                isSuccess
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-rose-500 to-orange-400'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="p-4 sm:p-4.5 flex items-start gap-3.5">
          {/* Status Badge Icon */}
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
              isSuccess
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                : 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
          </div>

          {/* Toast Body */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                    isSuccess
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                      : 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                  }`}
                >
                  {isSuccess ? 'Delivered' : 'Dispatch Error'}
                </span>
                {referenceId && (
                  <span className="text-[10px] font-mono font-bold text-slate-300 truncate max-w-[130px]">
                    {referenceId}
                  </span>
                )}
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Title: 'Email Sent Successfully' or 'Failed to send' */}
            <h4
              className={`text-sm font-black tracking-tight leading-tight ${
                isSuccess ? 'text-emerald-300' : 'text-rose-300'
              }`}
            >
              {displayTitle}
            </h4>

            {/* Detail message */}
            {message && (
              <p className="text-xs text-slate-200 leading-relaxed break-words font-medium">
                {message}
              </p>
            )}

            {/* Recipients list if available */}
            {recipients && recipients.length > 0 && (
              <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-slate-300">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-400">To:</span>
                <span className="font-semibold text-emerald-200 truncate max-w-[240px]">
                  {recipients.join(', ')}
                </span>
              </div>
            )}

            {/* Transport details / Brevo Relay tag */}
            {relayMode && (
              <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5 pt-0.5">
                <ShieldCheck className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="truncate">Relay: {relayMode}</span>
              </div>
            )}

            {/* Action buttons (Retry or View MIME preview) */}
            <div className="pt-2 flex items-center gap-2.5">
              {isError && onRetry && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRetry();
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Retry Send</span>
                </button>
              )}

              {previewUrl && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-bold border border-slate-700 transition"
                >
                  <span>Preview MIME</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailDispatchToast;
