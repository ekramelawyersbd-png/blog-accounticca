import React from 'react';
import { Scale, AlertCircle, FileCheck, HelpCircle, CheckCircle2 } from 'lucide-react';
import { SEO } from '../components/SEO';

export function TermsConditions() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <SEO
        title="Terms & Conditions – Legal & Advisory Platform | Accounticca & E-Lawyers"
        description="Review the Terms and Conditions governing the use of Accounticca & E-Lawyers BD legal, tax, VAT, and corporate compliance tools and advisory services."
        canonicalUrl="/terms"
      />
      <div className="mb-12">
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
          Terms & <span className="text-emerald-600">Conditions</span>
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
          Please read these terms and conditions carefully before using the E-Lawyers BD / Accounticca platform.
        </p>
        <p className="text-sm font-semibold text-slate-500 mt-4">Last Updated: September 10, 2026</p>
      </div>

      <div className="prose prose-slate prose-lg max-w-none">
        
        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-200/60 mb-10">
          <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 mb-6 mt-0">
            <Scale className="w-6 h-6 text-emerald-500" />
            1. Agreement to Terms
          </h2>
          <p className="text-slate-600">
            By accessing or using our website, services, and consulting platforms, you agree to be bound by these Terms and Conditions. If you disagree with any part of the terms, you may not access the service. These terms apply to all visitors, users, and clients who access or use the Service.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-200/60 mb-10">
          <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 mb-6 mt-0">
            <FileCheck className="w-6 h-6 text-emerald-500" />
            2. Professional Services & Disclaimer
          </h2>
          <p className="text-slate-600">
            Our platform provides legal, tax, VAT, and corporate compliance information and consulting services. 
          </p>
          <ul className="space-y-2 mt-4 text-slate-600">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Informational Purpose:</strong> The content on the blog and tools (e.g., tax calculators) is for informational purposes only and does not constitute formal legal or financial advice unless explicitly stated under a formal engagement.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>No Attorney-Client Relationship:</strong> Reading our blog or using our calculators does not create an attorney-client relationship. Such a relationship is only established upon signing a formal engagement letter or consultancy agreement with Accounticca / E-Lawyers BD.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Accuracy:</strong> While we strive to keep information updated according to the latest NBR and RJSC regulations, laws change frequently. We make no representations or warranties of any kind about the completeness or accuracy of the website content.</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-200/60 mb-10">
          <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 mb-6 mt-0">
            <AlertCircle className="w-6 h-6 text-emerald-500" />
            3. User Responsibilities
          </h2>
          <p className="text-slate-600">
            When you create an account or interact with our community/experts, you are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account. You must provide accurate and complete information during consultations to ensure we can provide the best possible service.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-200/60 mb-10">
          <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 mb-6 mt-0">
            <HelpCircle className="w-6 h-6 text-emerald-500" />
            4. Changes to Terms
          </h2>
          <p className="text-slate-600">
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
          </p>
        </div>

      </div>
    </div>
  );
}
