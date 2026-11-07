import React from 'react';
import { Shield, Lock, Eye, FileText, CheckCircle2 } from 'lucide-react';
import { SEO } from '../components/SEO';

export function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <SEO
        title="Privacy Policy – Data Protection & Client Confidentiality | Accounticca & E-Lawyers"
        description="Read the Privacy Policy of Accounticca & E-Lawyers BD regarding client confidentiality, personal data protection, and corporate compliance records."
        canonicalUrl="/privacy"
      />
      <div className="mb-12">
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
          Privacy <span className="text-emerald-600">Policy</span>
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
          At Accounticca / E-Lawyers BD, we are committed to protecting your privacy and ensuring the security of your personal and corporate information.
        </p>
        <p className="text-sm font-semibold text-slate-500 mt-4">Last Updated: September 10, 2026</p>
      </div>

      <div className="prose prose-slate prose-lg max-w-none">
        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-200/60 mb-10">
          <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 mb-6 mt-0">
            <Eye className="w-6 h-6 text-emerald-500" />
            1. Information We Collect
          </h2>
          <p className="text-slate-600">
            We collect information that you provide directly to us when you use our services, register for an account, subscribe to our newsletter, or contact our legal and tax experts. This may include:
          </p>
          <ul className="space-y-2 mt-4 text-slate-600">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Personal Identification Information:</strong> Name, email address, phone number, and professional details.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Corporate Information:</strong> Company name, registration details (RJSC), TIN/BIN numbers for tax and VAT consultations.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Usage Data:</strong> Information on how you interact with our platform, IP addresses, browser types, and access times.</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-200/60 mb-10">
          <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 mb-6 mt-0">
            <FileText className="w-6 h-6 text-emerald-500" />
            2. How We Use Your Information
          </h2>
          <p className="text-slate-600">
            The information we collect is used to provide, maintain, and improve our legal and tax consultancy services. Specifically, we use your data to:
          </p>
          <ul className="space-y-2 mt-4 text-slate-600">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span>Deliver tailored legal, corporate, and tax advisory services.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span>Process your consultations, document reviews, and service requests.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span>Send important updates regarding NBR circulars, RJSC deadlines, and regulatory changes in Bangladesh.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span>Respond to your inquiries and customer support requests.</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-200/60 mb-10">
          <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 mb-6 mt-0">
            <Shield className="w-6 h-6 text-emerald-500" />
            3. Data Protection and Confidentiality
          </h2>
          <p className="text-slate-600">
            As a legal and tax advisory platform, we adhere to strict confidentiality standards. Client-attorney and client-consultant privileges apply to all sensitive communications. We do not sell, rent, or trade your personal or corporate information to third parties. We implement industry-standard security measures to protect your data against unauthorized access, alteration, disclosure, or destruction.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-200/60 mb-10">
          <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 mb-6 mt-0">
            <Lock className="w-6 h-6 text-emerald-500" />
            4. Your Rights
          </h2>
          <p className="text-slate-600">
            You have the right to access, update, or request the deletion of your personal information stored on our platform. If you wish to exercise these rights or have any questions regarding our privacy practices, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
}
