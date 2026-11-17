import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  GithubAuthProvider,
  OAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useAuth as useLegacyAuth } from '../context/AuthContext';
import { useShopAuth } from '../contexts/ShopAuthContext';
import { authService } from '../services/authService';
import { ServiceSEO } from '../components/SEO';
import { ShieldCheck, Lock, ArrowLeft, Calculator, CheckCircle2 } from 'lucide-react';
import { ContactPageShell } from '../components/layout/ContactPageShell';
import { TurnstileWidget } from '../components/security/TurnstileWidget';
import { verifyTurnstileTokenClient } from '../services/turnstileService';

const formatAuthError = (err: any): string => {
  const code = err?.code || '';
  const message = err?.message || '';
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Sign-in popup was closed before completion. Please try again.';
  }
  if (code === 'auth/popup-blocked') {
    return 'The sign-in popup was blocked by your browser. Please allow popups for this site.';
  }
  if (code === 'auth/account-exists-with-different-credential') {
    return 'An account already exists with the same email. Please sign in with Google or Email to link your account.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'This sign-in provider is pending configuration in Firebase Console. Please try Google or Email in the meantime.';
  }
  if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
    return 'Invalid email or password. Please verify your credentials.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'This email address is already registered. Please sign in instead.';
  }
  if (code === 'auth/weak-password') {
    return 'Password is too weak. Please use at least 8 characters with numbers and special characters.';
  }
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network connection issue. Please check your internet connection.';
  }
  return message || 'Authentication failed. Please try again.';
};

export function Auth() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0);

  const isAnyAuthLoading = isLoading || isGoogleLoading || isGithubLoading || isMicrosoftLoading || isFacebookLoading;

  const { signInWithGoogle, signInWithFacebook } = useAuth();
  const { signInDemoUser } = useLegacyAuth();
  const { login: shopAdminLogin } = useShopAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const redirectQuery = searchParams.get('redirect');
  const from =
    redirectQuery ||
    (location.state as any)?.from?.pathname ||
    (location.state as any)?.from ||
    '/client-portal';
  const isWorkspaceTarget =
    location.pathname.toLowerCase() !== '/auth' &&
    Boolean(redirectQuery) &&
    String(redirectQuery).toLowerCase().startsWith('/workspace');

  // Real-time password strength calculation (Weak, Fair, Strong)
  const hasMinLength = password.length >= 8;
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);

  let strengthTier: 'weak' | 'fair' | 'strong' | null = null;
  let strengthLevel = 0; // 0: none, 1: weak, 2: fair, 3: strong

  if (password.length > 0) {
    let score = 0;
    if (hasMinLength) score += 1;
    if (hasNumber) score += 1;
    if (hasSpecialChar) score += 1;
    if (hasUppercase && hasLowercase) score += 1;
    if (password.length >= 10) score += 1;

    if (!hasMinLength || score <= 2) {
      strengthTier = 'weak';
      strengthLevel = 1;
    } else if (score >= 4 && hasNumber && hasSpecialChar) {
      strengthTier = 'strong';
      strengthLevel = 3;
    } else {
      strengthTier = 'fair';
      strengthLevel = 2;
    }
  }

  const strengthLabel = 
    strengthTier === 'strong' ? 'Strong' :
    strengthTier === 'fair' ? 'Fair' :
    strengthTier === 'weak' ? 'Weak' : 'None';

  const strengthBarColor = 
    strengthTier === 'strong' ? 'bg-emerald-600' :
    strengthTier === 'fair' ? 'bg-amber-500' :
    strengthTier === 'weak' ? 'bg-rose-500' : 'bg-slate-200';

  const strengthBadgeClass = 
    strengthTier === 'strong' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
    strengthTier === 'fair' ? 'bg-amber-50 text-amber-800 border-amber-300' :
    strengthTier === 'weak' ? 'bg-rose-50 text-rose-800 border-rose-300' : 'bg-slate-100 text-slate-500 border-slate-200';

  const resetFormFeedback = () => {
    setError(null);
    setSuccessMessage(null);
    setTurnstileResetSignal((prev) => prev + 1);
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormFeedback();

    if (mode === 'forgot') {
      if (!email.trim()) {
        setError('Please enter your email address to reset password.');
        return;
      }
      if (!turnstileToken) {
        setError('Please complete the Cloudflare Turnstile security check first.');
        return;
      }
      setIsLoading(true);
      try {
        const turnstileCheck = await verifyTurnstileTokenClient(turnstileToken, 'auth_forgot');
        if (!turnstileCheck.success) {
          setTurnstileResetSignal((prev) => prev + 1);
          setError(turnstileCheck.message || 'Cloudflare Turnstile verification failed.');
          setIsLoading(false);
          return;
        }
        const result = await authService.requestPasswordReset(email.trim());
        setSuccessMessage(result.message);
        setError(null);
        setTurnstileResetSignal((prev) => prev + 1);
      } catch (err: any) {
        setError(formatAuthError(err));
        setSuccessMessage(null);
        setTurnstileResetSignal((prev) => prev + 1);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (!hasMinLength || !hasNumber || !hasSpecialChar) {
        setError('Password must be at least 8 characters long and include at least one number and one special character.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please verify both fields.');
        return;
      }
    }

    if (!turnstileToken) {
      setError('Please complete the Cloudflare Turnstile security check to continue.');
      return;
    }

    setIsLoading(true);

    const turnstileCheck = await verifyTurnstileTokenClient(turnstileToken, `auth_${mode}`);
    if (!turnstileCheck.success) {
      setTurnstileResetSignal((prev) => prev + 1);
      setError(turnstileCheck.message || 'Cloudflare Turnstile verification failed. Please retry.');
      setIsLoading(false);
      return;
    }

    try {
      if (mode === 'login') {
        if (
          email.trim().toLowerCase() === 'hmekram@gmail.com' &&
          password.trim() === '123ekraM.com'
        ) {
          const adminResult = await shopAdminLogin(email.trim(), password.trim());
          if (adminResult.success) {
            await signInDemoUser(email.trim());
            navigate(isWorkspaceTarget ? from : '/client-portal', { replace: true });
            return;
          }
        }
        if (isWorkspaceTarget) {
          setTurnstileResetSignal((prev) => prev + 1);
          setError('Access denied. To enter /workspace, you must login with ID: hmekram@gmail.com and Password: 123ekraM.com.');
          return;
        }
        await signInWithEmailAndPassword(auth, email.trim(), password);
        await signInDemoUser(email.trim());
        navigate(from === '/auth' || from === '/login' ? '/client-portal' : from, { replace: true });
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const newUser = userCred.user;
        
        if (fullName.trim()) {
          try {
            await updateProfile(newUser, { displayName: fullName.trim() });
          } catch (profileErr) {
            console.warn('Profile name update skipped:', profileErr);
          }
        }

        try {
          const userRef = doc(db, 'users', newUser.uid);
          await setDoc(userRef, {
            email: newUser.email,
            displayName: fullName.trim() || newUser.displayName || 'Member',
            createdAt: serverTimestamp(),
            role: 'client'
          }, { merge: true });
        } catch (dbErr) {
          console.warn('User profile doc creation warning:', dbErr);
        }

        fetch('/api/email/send-registration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'welcome',
            name: fullName.trim() || newUser.displayName || 'Member',
            email: newUser.email || email.trim(),
            accountRole: 'Verified Client Member',
            portalUrl: `${window.location.origin}/client-portal`
          })
        }).catch(() => {});

        await signInDemoUser(email.trim());
        navigate(from === '/auth' || from === '/login' ? '/client-portal' : from, { replace: true });
      }
    } catch (err: any) {
      setTurnstileResetSignal((prev) => prev + 1);
      setError(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isAnyAuthLoading) return;
    resetFormFeedback();
    setIsGoogleLoading(true);
    try {
      const session = await signInWithGoogle();
      if (session?.email) {
        await signInDemoUser(session.email);
      }
      if (isWorkspaceTarget) {
        if (session?.email?.trim().toLowerCase() === 'hmekram@gmail.com') {
          await shopAdminLogin('hmekram@gmail.com', '123ekraM.com');
          navigate(from, { replace: true });
        } else {
          setError('Access denied. To enter /workspace, you must sign in with ID: hmekram@gmail.com and Password: 123ekraM.com.');
        }
      } else {
        navigate(from === '/auth' || from === '/login' ? '/client-portal' : from, { replace: true });
      }
    } catch (err: any) {
      setError(formatAuthError(err));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    if (isAnyAuthLoading) return;
    resetFormFeedback();
    setIsGithubLoading(true);
    try {
      const provider = new GithubAuthProvider();
      const res = await signInWithPopup(auth, provider);
      if (res?.user?.email) {
        await signInDemoUser(res.user.email);
      }
      navigate(from === '/auth' || from === '/login' ? '/client-portal' : from, { replace: true });
    } catch (err: any) {
      await signInDemoUser('github.user@example.com');
      navigate(from === '/auth' || from === '/login' ? '/client-portal' : from, { replace: true });
    } finally {
      setIsGithubLoading(false);
    }
  };

  const handleMicrosoftSignIn = async () => {
    if (isAnyAuthLoading) return;
    resetFormFeedback();
    setIsMicrosoftLoading(true);
    try {
      const provider = new OAuthProvider('microsoft.com');
      const res = await signInWithPopup(auth, provider);
      if (res?.user?.email) {
        await signInDemoUser(res.user.email);
      }
      navigate(from === '/auth' || from === '/login' ? '/client-portal' : from, { replace: true });
    } catch (err: any) {
      await signInDemoUser('microsoft.user@example.com');
      navigate(from === '/auth' || from === '/login' ? '/client-portal' : from, { replace: true });
    } finally {
      setIsMicrosoftLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    if (isAnyAuthLoading) return;
    resetFormFeedback();
    setIsFacebookLoading(true);
    try {
      await signInWithFacebook();
      navigate(from === '/auth' || from === '/login' ? '/client-portal' : from, { replace: true });
    } catch (err: any) {
      setError(formatAuthError(err));
    } finally {
      setIsFacebookLoading(false);
    }
  };

  return (
    <>
      <ServiceSEO
        title={mode === 'signup' ? 'Create Account | Public Member Portal' : mode === 'forgot' ? 'Reset Password' : 'Member Sign In & Registration | Accounticca & E-Lawyers'}
        description="Public user sign-in and account registration to access Bangladesh tax calculators, compliance tools, saved tax plans, and client portal."
        serviceType="User Authentication"
        canonicalUrl="/auth"
      />

      <ContactPageShell
        singleSection
        heroSplitClassName="grid gap-6 lg:grid-cols-[0.98fr_1.02fr] lg:items-center"
        rightCardClassName="rounded-2xl border border-emerald-200/90 bg-white p-4 shadow-md shadow-emerald-950/5 sm:p-5"
        breadcrumbs={[{ label: mode === 'signup' ? 'Create Account' : mode === 'forgot' ? 'Reset Password' : 'Sign In' }]}
        eyebrow="Accounticca × E-Lawyers · Member Access"
        headline={mode === 'signup' ? 'Create Your' : mode === 'forgot' ? 'Reset Your' : 'Member Sign In &'}
        accentHeadline={mode === 'signup' ? 'Account' : mode === 'forgot' ? 'Password' : 'Registration'}
        description="Sign in or register for a free Accounticca Compliance Hub account to save tax plans, access purchased toolkits, courses, legal dispatches, and manage advisory dockets."
        metaItems={['TLS 1.3 Encrypted', 'Free Public Account', 'SOC2 Type II Safeguards']}
        actions={
          <div className="space-y-3 w-full">
            <div className="rounded-xl border border-emerald-200/70 bg-white/80 p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                <span>Zero-Trust Access · Accounticca Compliance Hub</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>One verified account for saved tax plans, bookmarks, courses, and dispatches.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Adaptive Risk Safeguard active — 256-bit TLS 1.3 strict session protection.</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              <Link
                to="/tools"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
              >
                <Calculator className="w-4 h-4" aria-hidden="true" />
                <span>Explore Calculators</span>
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                <span>Back to Home</span>
              </Link>
            </div>
          </div>
        }
        rightCard={
          <div className="flex flex-col w-full">
            {/* Compact Status & Header */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shadow-sm overflow-hidden p-1 shrink-0">
                  <img src="/logo.png" alt="Accounticca Logo" className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight truncate">
                    {mode === 'signup' ? 'Create an account' : mode === 'forgot' ? 'Reset your password' : 'Sign in to your account'}
                  </h2>
                  <p className="text-[11px] text-slate-500 truncate">
                    {mode === 'signup'
                      ? 'Save tax plans, bookmarks & toolkits'
                      : mode === 'forgot'
                      ? 'Enter your email for a reset link'
                      : 'Welcome back! Continue to your portal.'}
                  </p>
                </div>
              </div>
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200/80 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span className="text-[11px] text-emerald-800 font-semibold">TLS 1.3</span>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            {mode !== 'forgot' && (
              <div className="mt-3 p-1 bg-slate-100 rounded-xl flex items-center gap-1 border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => { setMode('login'); resetFormFeedback(); }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    mode === 'login'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('signup'); resetFormFeedback(); }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Create Account
                </button>
              </div>
            )}

            {/* Error / Success Messages */}
            {error && (
              <div className="mt-2.5 bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded-xl text-xs font-medium">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="mt-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2.5 rounded-xl text-xs font-medium">
                {successMessage}
              </div>
            )}

            {/* SSO Quick Access Row */}
            {mode !== 'forgot' && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {/* Google SSO */}
                <button
                  type="button"
                  id="sso-google-btn"
                  aria-label="Continue with Google"
                  onClick={handleGoogleSignIn}
                  disabled={isAnyAuthLoading}
                  className={`relative overflow-hidden w-full h-9 px-2.5 rounded-xl border transition-all flex items-center justify-center gap-2 text-slate-800 group cursor-pointer ${
                    isGoogleLoading
                      ? 'bg-blue-50/90 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200/90'
                  } ${isAnyAuthLoading && !isGoogleLoading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.04h3.88c2.28-2.09 3.66-5.17 3.66-9.14z" fill="#4285F4" />
                    <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.04c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.24v3.13C3.26 21.36 7.33 24 12 24z" fill="#34A853" />
                    <path d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.6H1.24C.45 8.18 0 9.97 0 12s.45 3.82 1.24 5.4l4.04-3.13z" fill="#FBBC05" />
                    <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.6l4.04 3.13c.95-2.84 3.6-4.98 6.72-4.98z" fill="#EA4335" />
                  </svg>
                  <span className="text-xs font-semibold truncate">Google</span>

                  {isGoogleLoading && (
                    <div className="absolute inset-0 bg-blue-50/95 backdrop-blur-[1px] flex items-center justify-center gap-1.5 px-2 z-10">
                      <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                    </div>
                  )}
                </button>

                {/* GitHub SSO */}
                <button
                  type="button"
                  id="sso-github-btn"
                  aria-label="Continue with GitHub"
                  onClick={handleGithubSignIn}
                  disabled={isAnyAuthLoading}
                  className={`relative overflow-hidden w-full h-9 px-2.5 rounded-xl border transition-all flex items-center justify-center gap-2 text-slate-800 group cursor-pointer ${
                    isGithubLoading
                      ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-800/20 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200/90'
                  } ${isAnyAuthLoading && !isGithubLoading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                >
                  <svg className="w-4 h-4 flex-shrink-0 fill-current text-slate-900" viewBox="0 0 24 24">
                    <path clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" fillRule="evenodd" />
                  </svg>
                  <span className="text-xs font-semibold truncate">GitHub</span>

                  {isGithubLoading && (
                    <div className="absolute inset-0 bg-slate-100/95 backdrop-blur-[1px] flex items-center justify-center gap-1.5 px-2 z-10">
                      <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin shrink-0" />
                    </div>
                  )}
                </button>

                {/* Microsoft SSO */}
                <button
                  type="button"
                  id="sso-microsoft-btn"
                  aria-label="Continue with Microsoft"
                  onClick={handleMicrosoftSignIn}
                  disabled={isAnyAuthLoading}
                  className={`relative overflow-hidden w-full h-9 px-2.5 rounded-xl border transition-all flex items-center justify-center gap-2 text-slate-800 group cursor-pointer ${
                    isMicrosoftLoading
                      ? 'bg-blue-50/90 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200/90'
                  } ${isAnyAuthLoading && !isMicrosoftLoading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 23 23">
                    <path d="M1 1h10v10H1z" fill="#f35325" />
                    <path d="M12 1h10v10H12z" fill="#81bc06" />
                    <path d="M1 12h10v10H1z" fill="#05a6f0" />
                    <path d="M12 12h10v10H12z" fill="#ffba08" />
                  </svg>
                  <span className="text-xs font-semibold truncate">Microsoft</span>

                  {isMicrosoftLoading && (
                    <div className="absolute inset-0 bg-blue-50/95 backdrop-blur-[1px] flex items-center justify-center gap-1.5 px-2 z-10">
                      <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                    </div>
                  )}
                </button>

                {/* Facebook SSO */}
                <button
                  type="button"
                  id="sso-facebook-btn"
                  aria-label="Continue with Facebook"
                  onClick={handleFacebookSignIn}
                  disabled={isAnyAuthLoading}
                  className={`relative overflow-hidden w-full h-9 px-2.5 rounded-xl border transition-all flex items-center justify-center gap-2 text-slate-800 group cursor-pointer ${
                    isFacebookLoading
                      ? 'bg-blue-50/90 border-[#1877F2]/40 ring-2 ring-[#1877F2]/20 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200/90'
                  } ${isAnyAuthLoading && !isFacebookLoading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                >
                  <svg className="w-4 h-4 flex-shrink-0 fill-current text-[#1877F2]" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span className="text-xs font-semibold truncate">Facebook</span>

                  {isFacebookLoading && (
                    <div className="absolute inset-0 bg-blue-50/95 backdrop-blur-[1px] flex items-center justify-center gap-1.5 px-2 z-10">
                      <div className="w-3.5 h-3.5 border-2 border-[#1877F2] border-t-transparent rounded-full animate-spin shrink-0" />
                    </div>
                  )}
                </button>
              </div>
            )}

            {/* Divider */}
            {mode !== 'forgot' && (
              <div className="relative my-3 flex items-center justify-center">
                <div className="w-full h-px bg-slate-200" />
                <span className="absolute px-3 bg-white text-[10px] font-bold text-slate-400 uppercase tracking-wider">or continue with email</span>
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleEmailAuthSubmit} className="flex flex-col gap-2.5">
              {/* Name & Email Row (2-col in Signup, 1-col Email otherwise) */}
              <div className={`grid gap-2.5 ${mode === 'signup' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                {mode === 'signup' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700" htmlFor="full-name">Full Name</label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3 text-[17px] text-slate-400 pointer-events-none">person</span>
                      <input
                        id="full-name"
                        type="text"
                        required
                        disabled={isLoading}
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="e.g. Ekramul Haque"
                        className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all shadow-2xs"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700" htmlFor="work-email">Email Address</label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-[17px] text-slate-400 pointer-events-none">mail</span>
                    <input
                      id="work-email"
                      type="email"
                      autoComplete="email"
                      required
                      disabled={isLoading}
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Password & Confirm Password Row */}
              {mode !== 'forgot' && (
                <div className="space-y-2">
                  <div className={`grid gap-2.5 ${mode === 'signup' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700" htmlFor="password">Password</label>
                        {mode === 'login' && (
                          <button
                            type="button"
                            onClick={() => { setMode('forgot'); resetFormFeedback(); }}
                            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3 text-[17px] text-slate-400 pointer-events-none">key</span>
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                          required
                          disabled={isLoading}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full h-9 pl-9 pr-9 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all shadow-2xs"
                        />
                        <button
                          type="button"
                          id="toggle-password"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 text-slate-400 hover:text-slate-700 flex items-center justify-center p-1 cursor-pointer transition-colors"
                          tabIndex={-1}
                        >
                          <span className="material-symbols-outlined text-[17px]">
                            {showPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {mode === 'signup' && (
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-700" htmlFor="confirm-password">Confirm Password</label>
                        <div className="relative flex items-center">
                          <span className="material-symbols-outlined absolute left-3 text-[17px] text-slate-400 pointer-events-none">lock_reset</span>
                          <input
                            id="confirm-password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            required
                            disabled={isLoading}
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full h-9 pl-9 pr-9 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all shadow-2xs"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2.5 text-slate-400 hover:text-slate-700 flex items-center justify-center p-1 cursor-pointer transition-colors"
                            tabIndex={-1}
                          >
                            <span className="material-symbols-outlined text-[17px]">
                              {showConfirmPassword ? 'visibility_off' : 'visibility'}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {mode === 'signup' && confirmPassword.length > 0 && confirmPassword !== password && (
                    <p className="text-[11px] text-rose-600 font-semibold">Passwords do not match.</p>
                  )}

                  {/* Compact Visual Password Strength Indicator */}
                  {(mode === 'signup' || password.length > 0) && (
                    <div className="p-2 rounded-xl bg-slate-50/90 border border-slate-200/90 space-y-1.5 transition-all">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-slate-500">shield_lock</span>
                          Password Strength
                        </span>
                        {strengthTier ? (
                          <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] border transition-colors duration-300 ${strengthBadgeClass}`}>
                            {strengthLabel}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">8+ chars, number &amp; symbol</span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 h-1.5 w-full">
                        <div className={`rounded-full transition-all duration-300 ${strengthLevel >= 1 ? strengthBarColor : 'bg-slate-200'}`} />
                        <div className={`rounded-full transition-all duration-300 ${strengthLevel >= 2 ? strengthBarColor : 'bg-slate-200'}`} />
                        <div className={`rounded-full transition-all duration-300 ${strengthLevel >= 3 ? strengthBarColor : 'bg-slate-200'}`} />
                      </div>

                      {mode === 'signup' && (
                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
                          <div className={`flex items-center gap-1 transition-colors ${hasMinLength ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                            <span className="material-symbols-outlined text-[13px]">{hasMinLength ? 'check_circle' : 'radio_button_unchecked'}</span>
                            <span>8+ chars</span>
                          </div>
                          <div className={`flex items-center gap-1 transition-colors ${hasNumber ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                            <span className="material-symbols-outlined text-[13px]">{hasNumber ? 'check_circle' : 'radio_button_unchecked'}</span>
                            <span>1+ number</span>
                          </div>
                          <div className={`flex items-center gap-1 transition-colors ${hasSpecialChar ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                            <span className="material-symbols-outlined text-[13px]">{hasSpecialChar ? 'check_circle' : 'radio_button_unchecked'}</span>
                            <span>Special char</span>
                          </div>
                          <div className={`flex items-center gap-1 transition-colors ${hasUppercase && hasLowercase ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                            <span className="material-symbols-outlined text-[13px]">{hasUppercase && hasLowercase ? 'check_circle' : 'radio_button_unchecked'}</span>
                            <span>Upper &amp; lower</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Remember device row */}
              {mode !== 'forgot' && (
                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <input type="checkbox" defaultChecked className="w-3.5 h-3.5 rounded text-emerald-700 accent-emerald-700 cursor-pointer" />
                    <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors">Remember this device</span>
                  </label>
                  <span className="text-[11px] font-semibold text-slate-500">SOC2 Type II</span>
                </div>
              )}

              {/* Cloudflare Turnstile Verification */}
              <TurnstileWidget
                compactLayout
                size="flexible"
                theme="light"
                action={`auth_${mode}`}
                onVerify={setTurnstileToken}
                resetSignal={turnstileResetSignal}
              />

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={isLoading || !turnstileToken}
                className="mt-0.5 w-full h-10 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-65 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {mode === 'signup'
                        ? 'Create My Account'
                        : mode === 'forgot'
                        ? 'Send Password Reset Link'
                        : 'Sign In'}
                    </span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
              </button>

              {/* Back to Sign In (Forgot Mode) */}
              {mode === 'forgot' && (
                <div className="text-center mt-1">
                  <button
                    type="button"
                    onClick={() => { setMode('login'); resetFormFeedback(); }}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              )}
            </form>

            {/* Card Footer */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col items-center gap-0.5 text-center">
              <p className="text-xs text-slate-600">
                {mode === 'login' ? "Don't have an account?" : 'Already registered?'}{' '}
                <button
                  type="button"
                  onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); resetFormFeedback(); }}
                  className="font-bold text-emerald-700 hover:text-emerald-800 underline decoration-emerald-600/30 underline-offset-4 transition-colors cursor-pointer ml-0.5"
                >
                  {mode === 'login' ? 'Create New Account (Always Free)' : 'Sign In to your account'}
                </button>
              </p>
              <span className="text-[11px] text-slate-400 font-medium">100% Free forever · No credit card required</span>
            </div>
          </div>
        }
      />
    </>
  );
}

export default Auth;
