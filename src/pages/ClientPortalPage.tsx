import React from 'react';
import { ClientPortal } from '../components/portal/ClientPortal';
import { ServiceSEO } from '../components/SEO';
import { Link } from 'react-router-dom';
import { Home, ChevronRight, ShieldCheck, Briefcase } from 'lucide-react';

export const ClientPortalPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50/70 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <ServiceSEO
        title="Client Advisory Portal | Ongoing Consultations & Shared Documents Vault"
        description="Encrypted corporate client portal for Accounticca & E-Lawyers Chambers. Track consultation milestones, download certified NBR tax assessment dockets, High Court writ drafts, and manage legal filings."
        serviceType="Corporate Client Portal"
        canonicalUrl="/portal"
      />

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb Header */}
        <nav aria-label="Breadcrumb" className="flex items-center text-xs text-slate-500 font-medium">
          <Link to="/" className="hover:text-slate-900 transition-colors flex items-center gap-1">
            <Home className="w-3.5 h-3.5 text-slate-400" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 mx-2 text-slate-300 shrink-0" />
          <Link to="/dashboard" className="hover:text-slate-900 transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5 mx-2 text-slate-300 shrink-0" />
          <span className="text-slate-900 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Client Advisory Portal</span>
          </span>
        </nav>

        {/* Client Portal Component */}
        <ClientPortal />
      </div>
    </div>
  );
};
