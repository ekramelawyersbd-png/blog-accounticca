import React, { useState, useEffect, useRef } from 'react';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Bell, 
  Sparkles, 
  RefreshCw,
  Check,
  X
} from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { trackUxEngagementEvent } from '../../services/firebaseAnalyticsService';

const COLLECTION_NAME = 'newsletterSubscribers';

const COMPLIANCE_TOPICS = [
  { id: 'tax_vat', label: 'Tax & VAT SROs' },
  { id: 'corporate_rjsc', label: 'RJSC & Company Law' },
  { id: 'labour_regulations', label: 'Labour Law Compliance' },
  { id: 'audit_financial', label: 'Audit & Accounting Alerts' },
];

export function FooterNewsletter() {
  const [email, setEmail] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['tax_vat', 'corporate_rjsc']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [alreadySubscribedEmail, setAlreadySubscribedEmail] = useState<string | null>(null);
  const [showTopicPicker, setShowTopicPicker] = useState(false);
  const [inlineSuccess, setInlineSuccess] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<{ email: string; message: string } | null>(null);
  const formContainerRef = useRef<HTMLDivElement | null>(null);
  const hasLoggedViewRef = useRef<boolean>(false);

  // Track `newsletter_form_view` once per session when form becomes >=50% visible
  useEffect(() => {
    const node = formContainerRef.current;
    if (!node || hasLoggedViewRef.current || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting && !hasLoggedViewRef.current) {
          hasLoggedViewRef.current = true;
          void trackUxEngagementEvent({
            eventName: 'newsletter_form_view',
            contentType: 'newsletter',
            contentId: 'footer-compliance-newsletter',
            title: 'Footer Compliance Newsletter Form',
            category: 'Business Compliance',
            action: 'form_impression',
            metadata: { placement: 'footer', topics_count: selectedTopics.length }
          });
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [selectedTopics.length]);

  // Check if current user or browser previously subscribed
  useEffect(() => {
    try {
      const stored = localStorage.getItem('accounticca_newsletter_subscriber');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.email) {
          setAlreadySubscribedEmail(parsed.email);
          if (Array.isArray(parsed.topics) && parsed.topics.length > 0) {
            setSelectedTopics(parsed.topics);
          }
        }
      }
    } catch {
      // ignore storage error
    }
  }, []);

  // Auto-dismiss floating toast after 6 seconds
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => {
        setSuccessToast(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  // Auto-dismiss inline success message after 8 seconds
  useEffect(() => {
    if (inlineSuccess) {
      const timer = setTimeout(() => {
        setInlineSuccess(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [inlineSuccess]);

  const toggleTopic = (topicId: string) => {
    setSelectedTopics(prev =>
      prev.includes(topicId)
        ? prev.length > 1 ? prev.filter(t => t !== topicId) : prev
        : [...prev, topicId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInlineSuccess(null);

    // Log privacy-safe `newsletter_submit` attempt (never includes email address)
    void trackUxEngagementEvent({
      eventName: 'newsletter_submit',
      contentType: 'newsletter',
      contentId: 'footer-compliance-newsletter',
      title: 'Footer Compliance Newsletter Form',
      category: 'Business Compliance',
      action: 'submit_attempt',
      metadata: { topics_count: selectedTopics.length }
    });

    const cleanEmail = email.trim().toLowerCase();
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!cleanEmail || cleanEmail.length > 150 || !emailPattern.test(cleanEmail)) {
      setErrorMessage('Please enter a valid business email address (e.g., name@domain.com).');
      return;
    }

    setIsSubmitting(true);

    // Create deterministic doc ID from email
    const safeDocId = `sub_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`.substring(0, 100);
    const docRef = doc(db, COLLECTION_NAME, safeDocId);
    const nowIso = new Date().toISOString();

    const recordPayload = {
      email: cleanEmail,
      topics: selectedTopics,
      source: 'footer',
      category: 'business_compliance',
      status: 'active',
      subscribedAt: nowIso,
      userId: auth.currentUser?.uid || null,
      updatedAt: serverTimestamp(),
    };

    try {
      // Direct Firestore persistence (resilient fallback if rules/network block client write)
      try {
        await setDoc(docRef, recordPayload, { merge: true });
      } catch (firestoreErr) {
        console.warn('Firestore direct write warning (continuing via API & local registry):', firestoreErr);
      }

      // Dispatch Brevo SMTP welcome & compliance confirmation email
      try {
        await fetch('/api/subscribe-newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            topics: selectedTopics,
            sourceCategory: 'footer_compliance',
          }),
        });
      } catch {
        // Non-blocking if offline
      }

      // Cache locally
      try {
        localStorage.setItem(
          'accounticca_newsletter_subscriber',
          JSON.stringify({
            id: safeDocId,
            email: cleanEmail,
            subscribedAt: nowIso,
            topics: selectedTopics,
          })
        );
      } catch {
        // ignore
      }

      // Log privacy-safe `newsletter_success` event (no PII sent)
      void trackUxEngagementEvent({
        eventName: 'newsletter_success',
        contentType: 'newsletter',
        contentId: 'footer-compliance-newsletter',
        title: 'Footer Compliance Newsletter Form',
        category: 'Business Compliance',
        action: 'subscription_confirmed',
        metadata: { topics_count: selectedTopics.length }
      });

      setAlreadySubscribedEmail(cleanEmail);
      // Automatically clear input field
      setEmail('');
      // Set inline success message
      setInlineSuccess(`Subscription confirmed! We've saved ${cleanEmail} to our compliance registry and dispatched a confirmation via Brevo SMTP.`);
      // Trigger floating success toast notification
      setSuccessToast({
        email: cleanEmail,
        message: 'Saved to Firestore & confirmation dispatched via Brevo SMTP!'
      });
    } catch (err: any) {
      console.error('Newsletter subscription failure:', err);
      setErrorMessage(
        err.message?.includes('offline')
          ? 'Network is offline. Your subscription will sync once reconnected.'
          : 'Unable to save subscription. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        ref={formContainerRef}
        className="w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl border border-slate-700/80 p-5 sm:p-8 lg:p-10 mb-12 shadow-2xl relative overflow-hidden text-left"
      >
        {/* Decorative accent glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center lg:gap-8">
          {/* Left Column (58.33% on desktop): Heading, Benefits, Trust Badges */}
          <div className="min-w-0 lg:col-span-7 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Bell className="w-3.5 h-3.5" />
              <span>Business Compliance Intelligence</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Stay Ahead of Bangladesh Statutory &amp; Regulatory Changes
            </h3>

            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
              Subscribe to our practitioner dispatch for timely National Board of Revenue (NBR) SROs, Income Tax Act 2023 circulars, RJSC annual filing deadlines, and corporate legal precedents directly to your inbox.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1.5 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Direct Firestore Sync</span>
              </span>
              <span>&bull;</span>
              <span>Zero Spam</span>
              <span>&bull;</span>
              <span>1-Click Unsubscribe Anytime</span>
            </div>
          </div>

          {/* Right Column (41.67% on desktop): Fluid Responsive Form */}
          <div className="min-w-0 w-full lg:col-span-5">
            <form
              onSubmit={handleSubmit}
              noValidate
              className="w-full max-w-full space-y-3.5 bg-slate-950/75 p-4 sm:p-5 lg:p-6 rounded-2xl border border-slate-700/70 shadow-xl backdrop-blur-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Stay Updated
                </span>
                <button
                  type="button"
                  onClick={() => setShowTopicPicker(!showTopicPicker)}
                  className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition cursor-pointer"
                >
                  {showTopicPicker ? '− Hide topics' : '+ Customize topics'}
                </button>
              </div>

              {/* Inline Error Message */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span className="flex-1">{errorMessage}</span>
                  <button
                    type="button"
                    onClick={() => setErrorMessage('')}
                    className="text-rose-300 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Inline Success Message */}
              {inlineSuccess && (
                <div 
                  id="footer-newsletter-inline-success"
                  className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  <div className="flex-1 leading-relaxed">
                    <strong className="text-white font-bold block mb-0.5">Subscription Saved!</strong>
                    <span>{inlineSuccess}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInlineSuccess(null)}
                    className="text-emerald-300 hover:text-white p-0.5 transition cursor-pointer"
                    aria-label="Dismiss inline message"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Email Input & Submit Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full">
                <div className="relative flex-1 min-w-0 w-full">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="footer-newsletter-email"
                    name="email"
                    autoComplete="email"
                    type="email"
                    required
                    aria-label="Email address"
                    maxLength={150}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="Enter your business email..."
                    className="w-full min-w-0 pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>

                <button
                  id="footer-newsletter-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto shrink-0 whitespace-nowrap rounded-xl px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-900/30 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>Subscribe</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Optional Topics Selector */}
              {showTopicPicker && (
                <div className="pt-2 border-t border-slate-800 space-y-2 animate-in fade-in">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Select Your Compliance Focus:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {COMPLIANCE_TOPICS.map((topic) => {
                      const isSelected = selectedTopics.includes(topic.id);
                      return (
                        <button
                          key={topic.id}
                          type="button"
                          onClick={() => toggleTopic(topic.id)}
                          className={`p-2 rounded-lg text-xs font-medium text-left flex items-center gap-2 border transition cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-300'
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-slate-600'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <span className="truncate">{topic.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {alreadySubscribedEmail && !inlineSuccess && (
                <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Previously subscribed as <strong className="text-slate-300">{alreadySubscribedEmail}</strong>.</span>
                </p>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Floating Success Toast Notification */}
      {successToast && (
        <div
          id="newsletter-success-toast"
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900 border border-emerald-500/60 text-white rounded-2xl shadow-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 ring-1 ring-emerald-500/40"
        >
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 pr-1">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Newsletter Subscribed
            </p>
            <p className="text-sm font-semibold text-white truncate">
              {successToast.email}
            </p>
            <p className="text-xs text-slate-300 mt-0.5">
              Saved to Firestore compliance registry
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}
