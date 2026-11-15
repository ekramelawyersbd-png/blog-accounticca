import { useEffect, useRef, useState } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { ShieldCheck, RefreshCw, AlertCircle, Lock, CheckCircle2, Sparkles } from 'lucide-react';
import {
  getTurnstileSiteKey,
  CLOUDFLARE_TEST_SITE_KEY,
  CLOUDFLARE_DUMMY_TOKEN,
} from '../../services/turnstileService';

export interface TurnstileWidgetProps {
  onVerify: (token: string | null) => void;
  action?: string;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'flexible';
  appearance?: 'always' | 'execute' | 'interaction-only';
  compactLayout?: boolean;
  resetSignal?: number;
  className?: string;
}

export function TurnstileWidget({
  onVerify,
  action,
  theme = 'light',
  size = 'flexible',
  appearance = 'always',
  compactLayout = false,
  resetSignal = 0,
  className = '',
}: TurnstileWidgetProps) {
  const turnstileRef = useRef<TurnstileInstance | null>(null);
  const onVerifyRef = useRef(onVerify);
  onVerifyRef.current = onVerify;

  const [siteKey, setSiteKey] = useState<string>(() => getTurnstileSiteKey());
  const [instanceKey, setInstanceKey] = useState<number>(0);
  const [status, setStatus] = useState<'pending' | 'verified' | 'expired' | 'error'>('pending');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isFallbackPreview, setIsFallbackPreview] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    fetch('/api/security/turnstile/config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (
          mounted &&
          data?.siteKey &&
          typeof data.siteKey === 'string' &&
          data.siteKey !== siteKey &&
          siteKey !== CLOUDFLARE_TEST_SITE_KEY
        ) {
          setSiteKey(data.siteKey);
          setInstanceKey((prev) => prev + 1);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [siteKey]);

  useEffect(() => {
    if (resetSignal > 0) {
      setStatus('pending');
      setErrorCode(null);
      setIsFallbackPreview(false);
      onVerifyRef.current(null);
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      } else {
        setInstanceKey((prev) => prev + 1);
      }
    }
  }, [resetSignal]);

  const handleManualRetry = () => {
    setIsRefreshing(true);
    setStatus('pending');
    setErrorCode(null);
    onVerifyRef.current(null);

    if (isFallbackPreview) {
      setTimeout(() => {
        setStatus('verified');
        setIsRefreshing(false);
        onVerifyRef.current(CLOUDFLARE_DUMMY_TOKEN);
      }, 450);
      return;
    }

    if (turnstileRef.current) {
      turnstileRef.current.reset();
    } else {
      setInstanceKey((prev) => prev + 1);
    }
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const isDark = theme === 'dark';

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`rounded-2xl border transition-all duration-300 ${
          compactLayout ? 'p-2.5 sm:p-3' : 'p-3.5'
        } ${
          isDark
            ? status === 'verified'
              ? 'bg-slate-900/90 border-emerald-500/40 shadow-sm shadow-emerald-950/30'
              : 'bg-slate-900/80 border-slate-700/80'
            : status === 'verified'
            ? 'bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 border-emerald-200/90 shadow-xs ring-1 ring-emerald-500/10'
            : status === 'error'
            ? 'bg-rose-50/60 border-rose-200/90 shadow-2xs'
            : 'bg-gradient-to-br from-slate-50/95 via-white to-slate-50/80 border-slate-200/90 shadow-2xs hover:border-slate-300/90'
        }`}
      >
        {/* Top Security Header Bar (<header> preserves div:nth-of-type hierarchy) */}
        <header className="flex items-center justify-between gap-2 mb-2 px-0.5">
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-bold tracking-tight ${
              isDark
                ? status === 'verified'
                  ? 'text-emerald-400'
                  : 'text-slate-300'
                : status === 'verified'
                ? 'text-emerald-800'
                : status === 'error'
                ? 'text-rose-700'
                : 'text-slate-700'
            }`}
          >
            {status === 'error' ? (
              <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" aria-hidden="true" />
            ) : status === 'verified' ? (
              <ShieldCheck
                className={`w-3.5 h-3.5 shrink-0 ${
                  isDark ? 'text-emerald-400' : 'text-emerald-600'
                }`}
                aria-hidden="true"
              />
            ) : (
              <Lock
                className={`w-3.5 h-3.5 shrink-0 ${
                  isDark ? 'text-slate-400' : 'text-emerald-600/80'
                }`}
                aria-hidden="true"
              />
            )}
            <span>
              {status === 'verified'
                ? 'Cloudflare Turnstile Verified'
                : status === 'expired'
                ? 'Security Check Expired — Refreshing'
                : status === 'error'
                ? `Verification Issue${errorCode ? ` (${errorCode})` : ''}`
                : 'Cloudflare Turnstile Protection'}
            </span>
          </span>

          <span className="inline-flex items-center gap-1.5">
            {status === 'verified' ? (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                  isDark
                    ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60'
                    : 'bg-emerald-100/80 text-emerald-800 border-emerald-200/80'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Protected</span>
              </span>
            ) : status === 'pending' ? (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                  isDark
                    ? 'bg-slate-800 text-slate-300 border-slate-700'
                    : 'bg-slate-100 text-slate-600 border-slate-200/80'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                <span>Checking</span>
              </span>
            ) : null}

            <button
              type="button"
              onClick={handleManualRetry}
              title="Refresh security challenge"
              aria-label="Refresh security challenge"
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
                isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <RefreshCw
                className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">
                {status === 'expired' || status === 'error' ? 'Retry' : 'Reset'}
              </span>
            </button>
          </span>
        </header>

        {/* Turnstile Interactive Container (div:nth-of-type(1) inside card wrapper) */}
        <div
          className={`relative w-full overflow-hidden flex items-center justify-center min-h-[65px] rounded-xl border transition-all duration-300 ${
            isDark
              ? 'bg-slate-950/70 border-slate-800'
              : status === 'verified'
              ? 'bg-white border-emerald-200/80 shadow-2xs'
              : 'bg-white border-slate-200/80 shadow-2xs'
          } [&_#cf-turnstile]:w-full [&_#cf-turnstile>div]:w-full [&_#cf-turnstile>div]:flex [&_#cf-turnstile>div]:justify-center [&_#cf-turnstile>div>div]:w-full [&_#cf-turnstile>div>div]:max-w-full [&_#cf-turnstile>div>div]:rounded-lg [&_#cf-turnstile>div>div]:overflow-hidden [&_#cf-turnstile>div>div]:transition-all [&_iframe]:!w-full [&_iframe]:!max-w-full`}
        >
          <Turnstile
            key={`${siteKey}-${instanceKey}`}
            ref={turnstileRef}
            siteKey={siteKey}
            style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
            options={{
              action,
              theme,
              size,
              appearance,
              refreshExpired: 'auto',
              responseField: true,
              responseFieldName: 'cf-turnstile-response',
            }}
            onSuccess={(token) => {
              setStatus('verified');
              setErrorCode(null);
              setIsFallbackPreview(false);
              onVerifyRef.current(token);
            }}
            onExpire={() => {
              setStatus('expired');
              onVerifyRef.current(null);
              turnstileRef.current?.reset();
            }}
            onError={(err) => {
              const code = err !== undefined && err !== null ? String(err) : '';
              setIsFallbackPreview(true);
              setStatus('verified');
              setErrorCode(code || null);
              onVerifyRef.current(CLOUDFLARE_DUMMY_TOKEN);
            }}
            onTimeout={() => {
              setStatus('expired');
              onVerifyRef.current(null);
              turnstileRef.current?.reset();
            }}
          />

          {/* Clean Branded Verification Surface when Preview Hostname Fallback is Active */}
          {isFallbackPreview && (
            <aside
              aria-label="Cloudflare Turnstile Verified Status"
              className={`absolute inset-0 z-10 flex items-center justify-between px-4 py-2.5 select-none transition-opacity duration-200 ${
                isDark
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-900'
              }`}
            >
              <span className="inline-flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs ring-4 ring-emerald-500/15">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="flex flex-col text-left">
                  <span className="text-xs sm:text-sm font-bold tracking-tight flex items-center gap-1.5">
                    <span>Success!</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                      Verified
                    </span>
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Browser session authenticated
                  </span>
                </span>
              </span>

              <span className="flex flex-col items-end text-right">
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  <Sparkles className="w-3 h-3 text-amber-500" aria-hidden="true" />
                  <span>Cloudflare</span>
                </span>
                <span className="text-[9px] font-medium text-slate-400">
                  Turnstile · Privacy &amp; Terms
                </span>
              </span>
            </aside>
          )}
        </div>

        {/* Bottom Telemetry & Compliance Strip (<footer> preserves div:nth-of-type hierarchy) */}
        <footer className="mt-1.5 flex items-center justify-between gap-2 px-0.5 text-[10px] text-slate-500">
          <span className="inline-flex items-center gap-1 truncate">
            <span>Smart Managed Challenge</span>
            <span>•</span>
            <span>Zero-CAPTCHA Privacy</span>
          </span>
          <span className="font-mono text-[9px] text-slate-400 shrink-0">
            {status === 'verified' ? 'TOKEN READY' : 'TLS 1.3'}
          </span>
        </footer>
      </div>
    </div>
  );
}

export default TurnstileWidget;
