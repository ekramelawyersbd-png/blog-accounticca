import React from 'react';
import { Shield, Lock, Eye, FileText, CheckCircle2, CalendarDays, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { ContactPageShell } from '../components/layout/ContactPageShell';

export function PrivacyPolicy() {
  return (
    <ContactPageShell
      breadcrumbs={[
        { label: 'Legal Policies', path: '/terms' },
        { label: 'Privacy Policy' },
      ]}
      eyebrow="Governance & Client Confidentiality · Dhaka Chambers"
      headline="Privacy Policy."
      accentHeadline="How we safeguard client & statutory records."
      description="At Accounticca and E-Lawyers BD, attorney-client confidentiality and strict data protection govern every advisory brief, tax return file, and corporate incorporation mandate."
      metaItems={[
        'Last Updated: September 10, 2026',
        'Strict Attorney-Client Privilege',
        'No Third-Party Data Sale',
      ]}
      actions={
        <Link
          to="/contact"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
        >
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          Contact Privacy Desk
        </Link>
      }
      summaryCard={{
        eyebrow: 'Data Protection Standard',
        title: 'Confidentiality Charter',
        icon: <Shield className="h-5 w-5" aria-hidden="true" />,
        description:
          'TIN/BIN records, RJSC incorporation filings, and financial statements shared with our chambers are protected under strict professional privilege.',
        actions: [
          {
            label: 'Terms & Conditions',
            to: '/terms',
            icon: <Scale className="h-3.5 w-3.5" aria-hidden="true" />,
          },
          {
            label: 'Chamber Contact',
            to: '/contact',
            variant: 'neutral',
          },
        ],
        footerText: 'Questions regarding records deletion or access may be directed to our Dhaka chambers.',
      }}
    >
      <SEO
        title="Privacy Policy – Data Protection & Client Confidentiality | Accounticca & E-Lawyers"
        description="Read the Privacy Policy of Accounticca & E-Lawyers BD regarding client confidentiality, personal data protection, and corporate compliance records."
        canonicalUrl="/privacy"
      />

      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xs md:p-9">
          <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-slate-950 sm:text-2xl">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
              <Eye className="h-5 w-5" aria-hidden="true" />
            </span>
            1. Information We Collect
          </h2>
          <p className="text-sm leading-7 text-slate-600 sm:text-base">
            We collect information that you provide directly to us when you use our services, register for an account, subscribe to our regulatory updates, or contact our legal and tax experts. This may include:
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600 sm:text-base">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
              <span>
                <strong className="font-semibold text-slate-900">Personal Identification Information:</strong> Name, email address, phone number, and professional details.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
              <span>
                <strong className="font-semibold text-slate-900">Corporate Information:</strong> Company name, registration details (RJSC), TIN/BIN numbers for tax and VAT consultations.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
              <span>
                <strong className="font-semibold text-slate-900">Usage Data:</strong> Information on how you interact with our platform, browser types, and access timestamps.
              </span>
            </li>
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xs md:p-9">
          <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-slate-950 sm:text-2xl">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </span>
            2. How We Use Your Information
          </h2>
          <p className="text-sm leading-7 text-slate-600 sm:text-base">
            The information we collect is used strictly to deliver, maintain, and improve our legal and tax consultancy services. Specifically, we use your data to:
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600 sm:text-base">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
              <span>Deliver tailored legal, corporate, and tax advisory services.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
              <span>Process your consultations, document reviews, and service requests.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
              <span>Send important updates regarding NBR circulars, RJSC deadlines, and regulatory changes in Bangladesh.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
              <span>Respond to your inquiries and client support requests.</span>
            </li>
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xs md:p-9">
          <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-slate-950 sm:text-2xl">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
              <Shield className="h-5 w-5" aria-hidden="true" />
            </span>
            3. Data Protection and Confidentiality
          </h2>
          <p className="text-sm leading-7 text-slate-600 sm:text-base">
            As a legal and tax advisory platform, we adhere to strict confidentiality standards. Client-attorney and client-consultant privileges apply to all sensitive communications. We do not sell, rent, or trade your personal or corporate information to third parties. We implement industry-standard security measures to protect your data against unauthorized access, alteration, disclosure, or destruction.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xs md:p-9">
          <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-slate-950 sm:text-2xl">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
              <Lock className="h-5 w-5" aria-hidden="true" />
            </span>
            4. Your Rights
          </h2>
          <p className="text-sm leading-7 text-slate-600 sm:text-base">
            You have the right to access, update, or request the deletion of your personal information stored on our platform. If you wish to exercise these rights or have any questions regarding our privacy practices, please reach out to our chambers through the Contact page.
          </p>
        </div>
      </div>
    </ContactPageShell>
  );
}
