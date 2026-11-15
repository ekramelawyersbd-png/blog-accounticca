import { useEffect, useRef, useState } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import {
  getTurnstileSiteKey,
  isPreviewOrLocalHostname,
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

  useEffect(() => {
    let mounted = true;
    if (!isPreviewOrLocalHostname() && siteKey === CLOUDFLARE_TEST_SITE_KEY) {
      fetch('/api/security/turnstile/config')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (mounted && data?.siteKey && typeof data.siteKey === 'string' && data.siteKey !== siteKey) {
            setSiteKey(data.siteKey);
            setInstanceKey((prev) => prev + 1);
          }
        })
        .catch(() => {});
    }
    return () => {
      mounted = false;
    };
  }, [siteKey]);

  useEffect(() => {
    if (resetSignal > 0) {
      setStatus('pending');
      setErrorCode(null);
      onVerifyRef.current(null);
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      } else {
        setInstanceKey((prev) => prev + 1);
      }
    }
  }, [resetSignal]);

  const handleManualRetry = () => {
    setStatus('pending');
    setErrorCode(null);
    onVerifyRef.current(null);
    setInstanceKey((prev) => prev + 1);
  };

  const isDark = theme === 'dark';

  return (
    <div className={`w-full ${className}`}>
      <div
        className={
          compactLayout
            ? 'w-full'
            : `rounded-xl border p-3 transition-colors ${
                isDark
                  ? 'bg-slate-900/75 border-slate-700/80'
                  : status === 'verified'
                  ? 'bg-emerald-50/45 border-emerald-200/90'
                  : status === 'error'
                  ? 'bg-rose-50/50 border-rose-200'
                  : 'bg-slate-50/80 border-slate-200/90'
              }`
        }
      >
        {!compactLayout && (
          <div className="flex items-center justify-between gap-2 mb-2 text-[11px]">
            <span
              className={`inline-flex items-center gap-1.5 font-semibold ${
                isDark
                  ? status === 'verified'
                    ? 'text-emerald-400'
                    : 'text-slate-300'
                  : status === 'verified'
                  ? 'text-emerald-800'
                  : status === 'error'
                  ? 'text-rose-700'
                  : 'text-slate-600'
              }`}
            >
              {status === 'error' ? (
                <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" aria-hidden="true" />
              ) : (
                <ShieldCheck
                  className={`w-3.5 h-3.5 shrink-0 ${
                    status === 'verified'
                      ? isDark
                        ? 'text-emerald-400'
                        : 'text-emerald-600'
                      : 'text-slate-400'
                  }`}
                  aria-hidden="true"
                />
              )}
              <span>
                {status === 'verified'
                  ? 'Verified by Cloudflare Turnstile'
                  : status === 'expired'
                  ? 'Security check expired — refreshing'
                  : status === 'error'
                  ? `Verification issue${errorCode ? ` (${errorCode})` : ''}`
                  : 'Cloudflare Turnstile Security Check'}
              </span>
            </span>

            {(status === 'expired' || status === 'error') && (
              <button
                type="button"
                onClick={handleManualRetry}
                className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" aria-hidden="true" />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}

        <div className="w-full overflow-hidden flex items-center justify-center min-h-[65px] [&_#cf-turnstile]:w-full [&_iframe]:!w-full [&_iframe]:!max-w-full">
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
            }}
            onSuccess={(token) => {
              setStatus('verified');
              setErrorCode(null);
              onVerifyRef.current(token);
            }}
            onExpire={() => {
              setStatus('expired');
              onVerifyRef.current(null);
              turnstileRef.current?.reset();
            }}
            onError={(err) => {
              const code = err !== undefined && err !== null ? String(err) : '';
              if (siteKey !== CLOUDFLARE_TEST_SITE_KEY) {
                setSiteKey(CLOUDFLARE_TEST_SITE_KEY);
                setStatus('pending');
                setErrorCode(null);
                setInstanceKey((prev) => prev + 1);
                return;
              }
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
        </div>
      </div>
    </div>
  );
}

export default TurnstileWidget;
