import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  Bell, 
  Briefcase, 
  Check,
  Building,
  Scale,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  subscribeToNewsletter, 
  checkSubscriberStatus,
  DESIGNATION_LABELS,
  ProfessionalDesignation 
} from '../services/newsletterService';

export interface NewsletterSignupProps {
  currentCategory?: string;
  sourceArticleTitle?: string;
  sourceArticleId?: string;
  className?: string;
  variant?: 'sidebar' | 'footer' | 'full-width' | 'card';
  title?: string;
  subtitle?: string;
}

const TOPIC_OPTIONS = [
  { id: 'tax_vat', label: 'Tax & VAT Reforms', desc: 'NBR SROs, Income Tax Act 2023, TDS tables' },
  { id: 'corporate_rjsc', label: 'Corporate & RJSC', desc: 'Company Act 1994, filings, annual returns' },
  { id: 'litigation_precedents', label: 'Supreme Court Rulings', desc: 'Appellate & High Court Division precedents' },
  { id: 'labor_compliance', label: 'Labour Law & Employment', desc: 'Bangladesh Labour Act & BIDA guidelines' },
];

export function NewsletterSignup({
  currentCategory,
  sourceArticleTitle,
  sourceArticleId,
  className = '',
  variant = 'sidebar',
  title,
  subtitle
}: NewsletterSignupProps) {
  let authContext: any = null;
  try {
    authContext = useAuth();
  } catch {
    // Fallback if rendered outside AuthProvider
  }
  const user = authContext?.user;

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState<ProfessionalDesignation>('advocate_supreme_court');
  const [organization, setOrganization] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['tax_vat', 'corporate_rjsc']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [alreadySubscribedEmail, setAlreadySubscribedEmail] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  // Pre-fill user information if logged in
  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
    if (user?.displayName && !name) {
      setName(user.displayName);
    }
  }, [user]);

  // Check if current user or browser has subscribed
  useEffect(() => {
    try {
      const stored = localStorage.getItem('accounticca_newsletter_subscriber');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.email) {
          setAlreadySubscribedEmail(parsed.email);
          if (parsed.designation) {
            setDesignation(parsed.designation);
          }
          if (Array.isArray(parsed.topics) && parsed.topics.length > 0) {
            setSelectedTopics(parsed.topics);
          }
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // Adapt pre-selected topic based on active article category
  useEffect(() => {
    if (!currentCategory) return;
    const cat = currentCategory.toLowerCase();
    if (cat.includes('tax') || cat.includes('vat')) {
      setSelectedTopics(prev => Array.from(new Set([...prev, 'tax_vat'])));
    } else if (cat.includes('corporate') || cat.includes('business')) {
      setSelectedTopics(prev => Array.from(new Set([...prev, 'corporate_rjsc'])));
    } else if (cat.includes('litigation') || cat.includes('court') || cat.includes('adr')) {
      setSelectedTopics(prev => Array.from(new Set([...prev, 'litigation_precedents'])));
    } else if (cat.includes('labor') || cat.includes('labour') || cat.includes('employment')) {
      setSelectedTopics(prev => Array.from(new Set([...prev, 'labor_compliance'])));
    }
  }, [currentCategory]);

  const toggleTopic = (topicId: string) => {
    setSelectedTopics(prev => 
      prev.includes(topicId)
        ? prev.length > 1 
          ? prev.filter(t => t !== topicId) 
          : prev // Keep at least one
        : [...prev, topicId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailPattern.test(cleanEmail)) {
      setStatus('error');
      setErrorMessage('Please enter a valid professional email address.');
      return;
    }

    setIsSubmitting(true);
    setStatus('idle');

    try {
      // Direct Firestore persistence
      await subscribeToNewsletter({
        email: cleanEmail,
        name: name.trim() || undefined,
        designation,
        organization: organization.trim() || undefined,
        topics: selectedTopics,
        source: variant === 'sidebar' ? 'sidebar' : variant === 'footer' ? 'footer' : 'article',
        sourceArticleId,
        sourceArticleTitle,
        frequency: 'both'
      });

      setAlreadySubscribedEmail(cleanEmail);
      setStatus('success');
    } catch (err: any) {
      console.error('Firestore newsletter subscription failure:', err);
      setStatus('error');
      setErrorMessage(
        err.message?.includes('network') 
          ? 'Network connectivity issue. Please check your connection and try again.'
          : 'Unable to register subscription at this time. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setErrorMessage('');
    setEmail('');
    setName('');
    setShowOptions(false);
  };

  // -------------------------------------------------------------
  // VARIANT: SIDEBAR
  // -------------------------------------------------------------
  if (variant === 'sidebar') {
    return (
      <div 
        id="newsletter-sidebar-widget"
        className={`bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 relative overflow-hidden ${className}`}
      >
        {/* Subtle accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-700" />

        {/* Header */}
        <div className="flex items-center gap-2 mb-2 pt-1">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest">
              Legal & Tax Dispatch
            </span>
          </div>
        </div>

        <h3 className="text-base font-bold text-slate-900 leading-snug mb-2">
          {title || 'Stay Ahead on Bangladesh Law & Tax Updates'}
        </h3>
        
        <p className="text-xs text-slate-500 leading-relaxed mb-4">
          {subtitle || 'Get curated, practitioner-grade summaries of new NBR circulars, SROs, and RJSC compliance deadlines delivered to your inbox.'}
        </p>

        {status === 'success' ? (
          <div 
            id="newsletter-sidebar-success"
            className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center animate-in fade-in zoom-95"
          >
            <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">
              Subscription Confirmed!
            </h4>
            <p className="text-xs text-slate-600 mb-3">
              We've saved <span className="font-semibold text-emerald-800">{email || alreadySubscribedEmail}</span> in Firestore for upcoming statutory dispatches.
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold underline underline-offset-2"
            >
              Subscribe another email
            </button>
          </div>
        ) : (
          <form id="newsletter-sidebar-form" onSubmit={handleSubmit} className="space-y-3">
            {status === 'error' && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label htmlFor="sidebar-newsletter-email" className="block text-xs font-semibold text-slate-700 mb-1">
                Professional Email <span className="text-emerald-600">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="sidebar-newsletter-email"
                  name="email"
                  autoComplete="email"
                  type="email"
                  inputMode="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="advocate@chamber.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Designation Selector */}
            <div>
              <label htmlFor="sidebar-newsletter-designation" className="block text-xs font-semibold text-slate-700 mb-1">
                Professional Role
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="sidebar-newsletter-designation"
                  value={designation}
                  onChange={e => setDesignation(e.target.value as ProfessionalDesignation)}
                  className="w-full pl-9 pr-7 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all appearance-none cursor-pointer"
                >
                  {Object.entries(DESIGNATION_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                  ▼
                </div>
              </div>
            </div>

            {/* Optional Preferences Accordion */}
            <div>
              <button
                type="button"
                onClick={() => setShowOptions(!showOptions)}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors"
              >
                <span>{showOptions ? '− Hide specific topics' : '+ Customize law & tax topics'}</span>
              </button>

              {showOptions && (
                <div className="mt-2 space-y-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 animate-in fade-in">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Select Focus Areas:
                  </div>
                  {TOPIC_OPTIONS.map(opt => {
                    const isChecked = selectedTopics.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleTopic(opt.id)}
                        className={`w-full text-left p-1.5 rounded-lg flex items-center gap-2 text-xs transition-colors ${
                          isChecked 
                            ? 'bg-emerald-100/70 text-emerald-900 font-semibold' 
                            : 'text-slate-600 hover:bg-slate-200/50'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                          isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span className="truncate">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              id="sidebar-newsletter-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 text-xs"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving to Database...</span>
                </>
              ) : (
                <>
                  <span>Subscribe to Updates</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            {/* Privacy note */}
            <div className="flex items-center gap-1.5 justify-center text-[10px] text-slate-400 pt-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>Zero spam · One-click unsubscribe anytime</span>
            </div>
          </form>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // VARIANT: FOOTER
  // -------------------------------------------------------------
  if (variant === 'footer') {
    return (
      <div 
        id="newsletter-footer-widget"
        className={`bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 text-white ${className}`}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Bell className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
            Legal & Tax Updates
          </span>
        </div>

        <h4 className="text-base font-bold text-white mb-2">
          Subscribe to Weekly Gazette
        </h4>
        <p className="text-xs text-slate-300 mb-4 leading-relaxed">
          Get real-time NBR circulars, statutory notifications, and corporate precedents stored directly in your inbox.
        </p>

        {status === 'success' ? (
          <div className="p-3 bg-emerald-900/40 border border-emerald-500/40 rounded-xl text-center">
            <div className="flex items-center justify-center gap-2 text-emerald-300 text-xs font-semibold mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Subscription Saved to Database!</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Updates will be dispatched to {email || alreadySubscribedEmail}.
            </p>
          </div>
        ) : (
          <form id="newsletter-footer-form" onSubmit={handleSubmit} className="space-y-2.5">
            {status === 'error' && (
              <p className="text-rose-400 text-xs">{errorMessage}</p>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="footer-newsletter-email"
                name="email"
                autoComplete="email"
                type="email"
                inputMode="email"
                required
                pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
                title="Please enter a valid email address (e.g. advocate@firm.com)"
                maxLength={150}
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="advocate@firm.com"
                className="flex-1 px-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shrink-0 transition-colors shadow-sm"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span>Subscribe</span>
                    <Send className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
              <span>Practitioner-curated updates</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> No spam
              </span>
            </div>
          </form>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // VARIANT: FULL-WIDTH / CARD
  // -------------------------------------------------------------
  const fullWidthContent = (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-3">
          <Bell className="w-3.5 h-3.5 text-emerald-600" />
          <span>Legal & Tax Intelligence Dispatch</span>
        </div>
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight mb-3">
          {title || 'Stay Informed on Bangladesh Law & Tax Updates'}
        </h2>
        <p className="text-slate-600 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          {subtitle || 'Receive curated, practitioner-grade summaries of latest NBR circulars, Finance Act amendments, RJSC compliance deadlines, and High Court rulings directly in your inbox.'}
        </p>
      </div>

      {status === 'success' ? (
        <div 
          id="newsletter-success-state"
          className="bg-emerald-50/90 border border-emerald-200 rounded-3xl p-8 text-center animate-in fade-in zoom-in-95 duration-300 shadow-sm"
        >
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">
            You're Officially Subscribed!
          </h3>
          <p className="text-slate-600 text-sm md:text-base max-w-lg mx-auto mb-4">
            Your preferences have been registered securely in Firestore for <span className="font-semibold text-emerald-800">{email || alreadySubscribedEmail}</span>.
          </p>

          <div className="inline-flex flex-wrap items-center justify-center gap-2 mb-6">
            {selectedTopics.map(tid => {
              const topic = TOPIC_OPTIONS.find(t => t.id === tid);
              return (
                <span 
                  key={tid}
                  className="px-3 py-1 rounded-lg bg-emerald-200/60 text-emerald-900 text-xs font-semibold"
                >
                  ✓ {topic?.label || tid}
                </span>
              );
            })}
          </div>

          <div className="pt-4 border-t border-emerald-200/60 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              Delivered weekly & upon breaking statutory gazettes
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Zero spam · One-click unsubscribe anytime
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <button
              id="newsletter-subscribe-another-btn"
              type="button"
              onClick={handleReset}
              className="text-emerald-700 hover:text-emerald-800 font-semibold underline underline-offset-2"
            >
              Subscribe another email
            </button>
          </div>
        </div>
      ) : (
        <form 
          id="newsletter-signup-form"
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 transition-shadow hover:shadow-md"
        >
          {alreadySubscribedEmail && status === 'idle' && (
            <div className="mb-6 p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>You previously subscribed with <strong className="text-slate-800">{alreadySubscribedEmail}</strong>. You can update your preferences below:</span>
              </span>
            </div>
          )}

          {status === 'error' && (
            <div 
              id="newsletter-error-message"
              className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm animate-in fade-in"
            >
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage || 'Failed to submit. Please check your email and try again.'}</span>
            </div>
          )}

          {/* Topic Preference Selection */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              Select Focus Topics:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {TOPIC_OPTIONS.map(topic => {
                const isChecked = selectedTopics.includes(topic.id);
                return (
                  <button
                    key={topic.id}
                    id={`newsletter-topic-${topic.id}`}
                    type="button"
                    onClick={() => toggleTopic(topic.id)}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                      isChecked
                        ? 'bg-emerald-50/80 border-emerald-500 text-emerald-950 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div 
                      className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                        isChecked 
                          ? 'bg-emerald-600 border-emerald-600 text-white' 
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{topic.label}</div>
                      <div className="text-[11px] text-slate-500 font-normal leading-tight mt-0.5">{topic.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
            {/* Designation */}
            <div className="md:col-span-3">
              <label htmlFor="newsletter-designation-input" className="sr-only">Professional Role</label>
              <select
                id="newsletter-designation-input"
                value={designation}
                onChange={e => setDesignation(e.target.value as ProfessionalDesignation)}
                className="w-full px-3 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all cursor-pointer"
              >
                {Object.entries(DESIGNATION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Optional Organization / Firm */}
            <div className="md:col-span-3">
              <label htmlFor="newsletter-org-input" className="sr-only">Chamber / Firm Name</label>
              <input
                id="newsletter-org-input"
                name="organization"
                autoComplete="organization"
                type="text"
                inputMode="text"
                value={organization}
                onChange={e => setOrganization(e.target.value)}
                placeholder="Chamber / Firm (Optional)"
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>

            {/* Required Email */}
            <div className="md:col-span-4">
              <label htmlFor="newsletter-email-input" className="sr-only">Business or Personal Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="newsletter-email-input"
                  name="email"
                  type="email"
                  inputMode="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="practitioner@firm.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="md:col-span-2">
              <button
                id="newsletter-submit-btn"
                type="submit"
                disabled={isSubmitting}
                className="w-full h-full min-h-[48px] bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-bold py-3 px-4 rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 text-xs"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Subscribe</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Privacy & Cadence Disclaimer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Subscriber records securely synchronized in Firestore. One-click unsubscribe anytime.</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
              <Clock className="w-3.5 h-3.5" />
              <span>Published weekly + Urgent SRO alerts</span>
            </div>
          </div>
        </form>
      )}
    </div>
  );

  if (variant === 'card') {
    return (
      <aside 
        id="newsletter-signup-card"
        aria-label="Newsletter Signup"
        className={`bg-slate-50 border border-slate-200 rounded-3xl p-6 ${className}`}
      >
        {fullWidthContent}
      </aside>
    );
  }

  return (
    <section 
      id="newsletter-signup-section"
      aria-label="Newsletter Signup"
      className={className}
    >
      {fullWidthContent}
    </section>
  );
}
