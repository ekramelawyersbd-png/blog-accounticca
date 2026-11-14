import React from 'react';
import {
  Scale,
  AlertCircle,
  FileCheck,
  HelpCircle,
  CheckCircle2,
  Shield,
  CalendarDays,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { ContactPageShell } from '../components/layout/ContactPageShell';

export function TermsConditions() {
  return (
    <ContactPageShell
      breadcrumbs={[
        { label: 'Legal Policies', path: '/privacy' },
        { label: 'Terms & Conditions' },
      ]}
      eyebrow="Governance & Engagement Terms · Accounticca × E-Lawyers"
      headline="Terms & Conditions."
      accentHeadline="Platform scope & advisory disclaimers."
      description="Please review the terms governing access to our interactive calculators, statutory briefs, training academy, and chamber advisory services."
      metaItems={[
        'Last Updated: September 10, 2026',
        'Jurisdiction: Bangladesh Law',
        'Formal Engagement Charter',
      ]}
      actions={
        <Link
          to="/contact?tab=appointment"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
        >
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          Request Formal Engagement
        </Link>
      }
      summaryCard={{
        eyebrow: 'Engagement Governance',
        title: 'Professional Scope Notice',
        icon: <Scale className="h-5 w-5" aria-hidden="true" />,
        description:
          'Online calculators and briefs are informational resources. Attorney-client representation begins only upon execution of a formal engagement letter.',
        actions: [
          {
            label: 'Privacy Policy',
            to: '/privacy',
            icon: <Shield className="h-3.5 w-3.5" aria-hidden="true" />,
          },
          {
            label: 'Contact Desk',
            to: '/contact',
            variant: 'neutral',
          },
        ],
        footerText: 'Governed by applicable laws of the People’s Republic of Bangladesh.',
      }}
    >
      <SEO
        title="Terms & Conditions – Legal & Advisory Platform | Accounticca & E-Lawyers"
        description="Review the Terms and Conditions governing the use of Accounticca & E-Lawyers BD legal, tax, VAT, and corporate compliance tools and advisory services."
        canonicalUrl="/terms"
      />

      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xs md:p-9">
          <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-slate-950 sm:text-2xl">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
              <Scale className="h-5 w-5" aria-hidden="true" />
            </span>
            1. Agreement to Terms
          </h2>
          <p className="text-sm leading-7 text-slate-600 sm:text-base">
            By accessing or using our website, services, and consulting platforms, you agree to be bound by these Terms and Conditions. If you disagree with any part of the terms, you may not access the service. These terms apply to all visitors, users, and clients who access or use the Service.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xs md:p-9">
          <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-slate-950 sm:text-2xl">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
              <FileCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            2. Professional Services &amp; Disclaimer
          </h2>
          <p className="text-sm leading-7 text-slate-600 sm:text-base">
            Our platform provides legal, tax, VAT, and corporate compliance information and consulting services.
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600 sm:text-base">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
              <span>
                <strong className="font-semibold text-slate-900">Informational Purpose:</strong> The content on the blog and tools (e.g., tax calculators) is for informational purposes only and does not constitute formal legal or financial advice unless explicitly stated under a formal engagement.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
              <span>
                <strong className="font-semibold text-slate-900">No Attorney-Client Relationship:</strong> Reading our guides or using our calculators does not create an attorney-client relationship. Such a relationship is established only upon signing a formal engagement letter or consultancy agreement with Accounticca / E-Lawyers BD.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
              <span>
                <strong className="font-semibold text-slate-900">Accuracy:</strong> While we strive to keep information updated according to the latest NBR and RJSC regulations, laws change frequently. We make no representations or warranties of any kind regarding completeness or absolute suitability without partner review.
              </span>
            </li>
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xs md:p-9">
          <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-slate-950 sm:text-2xl">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
              <AlertCircle className="h-5 w-5" aria-hidden="true" />
            </span>
            3. User Responsibilities
          </h2>
          <p className="text-sm leading-7 text-slate-600 sm:text-base">
            When you create an account or interact with our community/experts, you are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account. You must provide accurate and complete information during consultations so our team can deliver reliable guidance.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xs md:p-9">
          <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-slate-950 sm:text-2xl">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
              <HelpCircle className="h-5 w-5" aria-hidden="true" />
            </span>
            4. Changes to Terms
          </h2>
          <p className="text-sm leading-7 text-slate-600 sm:text-base">
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
          </p>
        </div>
      </div>
    </ContactPageShell>
  );
}
