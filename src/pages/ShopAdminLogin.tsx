import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  KeyRound, 
  ArrowRight, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { useShopAuth } from '../contexts/ShopAuthContext';
import { ServiceSEO } from '../components/SEO';

export function ShopAdminLogin() {
  const { login, isAuthenticated, isLoading: authLoading, loginError, clearError } = useShopAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect destination after login
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get('redirect') || (location.state as any)?.from || '/admin/shop';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, redirectTo]);

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

  const handleAutofill = () => {
    setEmail('hmekram@gmail.com');
    setPassword('123ekraM.com');
    setErrorMsg(null);
    clearError();
  };

  const isWorkspaceTarget = redirectTo.toLowerCase().startsWith('/workspace');

  return (
    <div className="min-h-[85vh] bg-slate-50 sm:bg-gradient-to-b sm:from-slate-50 sm:via-emerald-50/30 sm:to-slate-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <ServiceSEO
        title={isWorkspaceTarget ? 'Admin Sign-In Required | Workspace Hub' : 'Admin Authentication | Accounticca Shop Portal'}
        description="Restricted administrative access for Accounticca & E-Lawyers Workspace Hub (/workspace) and digital asset catalog."
        serviceType="Administrative Login"
        canonicalUrl="/admin/login"
      />

      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="app-form-60 w-full lg:w-[60vw] mx-auto relative z-10">
        
        {/* Top Back Link */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Home</span>
          </Link>

          <span className="text-[10px] uppercase font-black tracking-widest text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-full border border-emerald-300">
            {isWorkspaceTarget ? 'Admin Sign-In Required · /workspace' : 'Internal Portal'}
          </span>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-7 sm:p-9 shadow-xl space-y-6 text-slate-900">
          
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 shadow-md shadow-emerald-500/20">
              <div className="w-full h-full bg-emerald-50 rounded-[14px] flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-emerald-600" />
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                {isWorkspaceTarget ? 'Admin-Only Workspace Access' : 'Admin-Only Shop & Workspace Access'}
              </h1>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                {isWorkspaceTarget
                  ? 'Admin sign-in is strictly required to enter /workspace (Google Workspace Integrations & Compliance Hub). Server-side identity verification is enforced.'
                  : 'The Workspace & Shop Management interface is strictly restricted to authorized administrators. Server-side identity verification is enforced.'}
              </p>
            </div>
          </div>

          {/* Authorized Credentials Helper Banner (Hidden) */}
          <div className="hidden bg-emerald-950/50 border border-emerald-800/60 rounded-2xl p-3.5 text-xs text-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-[11px] uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>Authorized Administrator</span>
              </span>
              <button
                type="button"
                onClick={handleAutofill}
                className="text-[10px] font-bold text-emerald-300 hover:text-emerald-100 bg-emerald-900/60 hover:bg-emerald-800 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
              >
                Auto-Fill Credentials
              </button>
            </div>
            <div className="text-[11px] font-mono space-y-0.5 text-slate-300">
              <div><strong className="text-emerald-400">ID:</strong> hmekram@gmail.com</div>
              <div><strong className="text-emerald-400">Pass:</strong> 123ekraM.com</div>
            </div>
          </div>

          {/* Error Message */}
          {(errorMsg || loginError) && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 text-xs text-red-800 flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="leading-snug">
                {errorMsg || loginError}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Administrator Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hmekram@gmail.com"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 font-semibold focus:outline-none transition-colors shadow-2xs"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  Administrative Password
                </label>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  inputMode="text"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-11 py-3 bg-white border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 font-semibold focus:outline-none transition-colors shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-black transition-all shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Server Authentication...</span>
                </>
              ) : (
                <>
                  <span>{isWorkspaceTarget ? 'Authenticate & Enter /workspace' : 'Authenticate & Enter Shop'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Security Badges */}
          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Backend Authorization Active</span>
            </span>
            <span className="text-slate-400 font-mono text-[10px]">
              SHA-256 Auth Session
            </span>
          </div>

        </div>

        {/* Notice underneath */}
        <p className="mt-4 text-center text-[11px] text-slate-500">
          Accounticca & E-Lawyers • Bangladesh Supreme Court Legal & Tax Practice
        </p>

      </div>
    </div>
  );
}

export default ShopAdminLogin;
