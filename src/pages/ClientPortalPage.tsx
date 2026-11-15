import React from 'react';
import { ClientPortal } from '../components/portal/ClientPortal';
import { ServiceSEO } from '../components/SEO';
import { ShieldCheck, Briefcase, ArrowLeft } from 'lucide-react';
import { ContactPageShell } from '../components/layout/ContactPageShell';

export const ClientPortalPage: React.FC = () => {
  return (
    <>
      <ServiceSEO
        title="Client Advisory Portal | Ongoing Consultations & Shared Documents Vault"
        description="Encrypted corporate client portal for Accounticca & E-Lawyers Chambers. Track consultation milestones, download certified NBR tax assessment dockets, High Court writ drafts, and manage legal filings."
        serviceType="Corporate Client Portal"
        canonicalUrl="/portal"
      />

      <ContactPageShell
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Client Advisory Portal' }
        ]}
        eyebrow="Encrypted Document Vault"
        headline="Client Advisory"
        accentHeadline="Portal"
        description="Track consultation milestones, access purchased digital toolkits, download NBR tax assessment dockets, and manage corporate filings."
        metaItems={[
          'My Appointments (Real-Time Status)',
          'Purchased Toolkits & Kits',
          'Verified Legal & Tax Vault'
        ]}
        summaryCard={{
          eyebrow: 'Chamber Workspace',
          title: 'Active Engagements',
          description: 'Instant access to digital resources, tax dockets, and ongoing chamber advisory files.',
          icon: <Briefcase className="w-5 h-5" />,
          actions: [
            { label: 'Book New Consultation', to: '/contact', variant: 'emerald' },
            { label: 'Browse Tools Hub', to: '/tools', icon: <ArrowLeft className="w-4 h-4" />, variant: 'neutral' }
          ],
          footerIcon: <ShieldCheck className="w-4 h-4 text-emerald-700" />,
          footerText: 'Client-Confidential Access'
        }}
      >
        <div className="max-w-6xl mx-auto">
          <ClientPortal />
        </div>
      </ContactPageShell>
    </>
  );
};
