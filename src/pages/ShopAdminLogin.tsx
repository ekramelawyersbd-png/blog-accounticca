import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  KeyRound,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Mail,
  ArrowLeft,
} from 'lucide-react';
import { useShopAuth } from '../contexts/ShopAuthContext';
import { useAuth } from '../contexts/AuthContext';
import { ServiceSEO } from '../components/SEO';

export function ShopAdminLogin() {
  const {
    login,
    loginWithGoogle,
    syncActiveFirebaseAdmin,
    isAuthenticated,
    isLoading: authLoading,
    loginError,
    clearError,
  } = useShopAuth();
  const { authUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect destination after login
  const searchParams = new URLSearchParams(location.search);
  const redirectTo =
    searchParams.get('redirect') || (location.state as any)?.from || '/admin/shop';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, redirectTo]);

  // If an authorized admin is already signed into Firebase Google Auth, auto-sync seamlessly
  useEffect(() => {
    if (!authLoading && !isAuthenticated && authUser?.role === 'admin') {
      let active = true;
      void syncActiveFirebaseAdmin().then((res) => {
        if (active && res.success) {
          navigate(redirectTo, { replace: true });
        }
      });
      return () => {
        active = false;
      };
    }
  }, [authLoading, isAuthenticated, authUser?.role, syncActiveFirebaseAdmin, navigate, redirectTo]);

  const handleGoogleAdminSignIn = async () => {
    clearError();
    setErrorMsg(null);
    setIsGoogleSubmitting(true);
    const result = await loginWithGoogle();
    setIsGoogleSubmitting(false);

    if (result.success) {
      navigate(redirectTo, { replace: true });
    } else {
      setErrorMsg(result.error || 'Google administrator verification failed.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setErrorMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both administrative email and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email.trim(), password.trim());
    setIsSubmitting(false);

    if (result.success) {
      navigate(redirectTo, { replace: true });
    } else {
      setErrorMsg(result.error || 'Access denied. Verify authorized administrator credentials.');
    }
  };

  const isWorkspaceTarget = redirectTo.toLowerCase().startsWith('/workspace');

  return (
    <div className="min-h-[85vh] bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <ServiceSEO
        title={
          isWorkspaceTarget
            ? 'Admin Sign-In Required | Workspace Hub'
            : 'Admin Authentication | Accounticca Shop Portal'
        }
        description="Restricted administrative access for Accounticca & E-Lawyers Workspace Hub (/workspace) and digital asset catalog."
        serviceType="Administrative Login"
        canonicalUrl="/admin/login"
      />

      <div className="w-full max-w-lg mx-auto">
        {/* Top Back Link */}
        <div className="mb-5 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Home</span>
          </Link>

          <span className="text-xs text-slate-500 font-mono">
            {isWorkspaceTarget ? 'Admin Access · /workspace' : 'Admin Portal'}
          </span>
        </div>

        {/* Single-Elevation Auth Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 text-slate-900">
          {/* Header */}
          <div className="text-center space-y-2.5">
            <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-700" />
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {isWorkspaceTarget
                  ? 'Admin-Only Workspace Access'
                  : 'Administrator Sign-In'}
              </h1>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Sign in with your verified Google administrator account or server-configured admin
                credentials to access Shop, Cloudflare Edge, and Workspace controls.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {(errorMsg || loginError) && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-xs text-red-800 flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMsg || loginError}</div>
            </div>
          )}

          {/* Primary Google Admin SSO Action */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => void handleGoogleAdminSignIn()}
              disabled={isGoogleSubmitting || isSubmitting}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 whitespace-nowrap"
            >
              {isGoogleSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Google Admin SSO...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Sign in with Google (Authorized Admin SSO)</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-slate-500">
              Recommended — cryptographically verified via Firebase RS256 ID token on the server.
            </p>
          </div>

          {/* Divider */}
          <div className="relative flex items-center">
            <div className="flex-grow border-t border-slate-200" />
            <span className="px-3 text-[11px] font-medium text-slate-500">
              Or sign in with email &amp; password
            </span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="admin-login-email"
                className="block text-xs font-semibold text-slate-700"
              >
                Administrator Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="admin-login-email"
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ekram.elawyersbd@gmail.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="admin-login-password"
                className="block text-xs font-semibold text-slate-700"
              >
                Administrative Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="admin-login-password"
                  type={showPassword ? 'text' : 'password'}
                  inputMode="text"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full pl-10 pr-11 py-2.5 bg-white border border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isGoogleSubmitting}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>
                    {isWorkspaceTarget
                      ? 'Authenticate & Enter /workspace'
                      : 'Authenticate with Password'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Verification Summary */}
          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Server-Verified Admin Session</span>
            </span>
            <span className="text-slate-400 font-mono text-[10px]">HMAC-SHA256 / RS256</span>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-500">
          Accounticca &amp; E-Lawyers · Bangladesh Supreme Court Legal &amp; Tax Practice
        </p>
      </div>
    </div>
  );
}

export default ShopAdminLogin;
