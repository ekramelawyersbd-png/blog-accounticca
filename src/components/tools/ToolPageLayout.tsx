import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Calendar,
  ExternalLink,
  Building2,
  Calculator,
  Mail,
  ShieldCheck,
  Scale,
  ArrowRight,
  Clock3,
} from 'lucide-react';
import { searchableTaxTools } from '../../data/searchableTools';
import { useAuth } from '../../contexts/AuthContext';
import { buildAppointmentUrl } from '../../utils/appointmentRedirect';
import { ToolSEO } from '../SEO';
import { CalculationEmailModal } from './CalculationEmailModal';
import { ContactPageShell, ContactSectionHeader } from '../layout/ContactPageShell';

interface ToolPageLayoutProps {
  toolId: string;
  title: string;
  category: string;
  description: string;
  children: React.ReactNode;
}

export const ToolPageLayout: React.FC<ToolPageLayoutProps> = ({
  toolId,
  title,
  category,
  description,
  children,
}) => {
  const { user } = useAuth();
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const toolContentRef = React.useRef<HTMLDivElement | null>(null);

  const getToolRoute = (id: string): string => {
    switch (id) {
      case 'rjsc-fee-estimator':
      case 'rjsc-fee-calculator-tool':
        return '/tools/rjsc-fee-calculator';
      case 'post-registration-checklist-tool':
        return '/tools/post-registration-checklist';
      case 'rjsc-functions-explorer-tool':
        return '/tools/rjsc-functions-explorer';
      case 'rjsc-returns-filing-guide-tool':
        return '/tools/rjsc-returns-filing-guide';
      case 'capital-gains-tax-tool':
        return '/tools/capital-gains-tax';
      case 'corporate-tax-tool':
        return '/tools/corporate-tax';
      case 'wealth-surcharge-tool':
        return '/tools/wealth-surcharge';
      case 'investment-rebate-calculator-tool':
        return '/tools/investment-rebate';
      case 'agricultural-tax-tool':
        return '/tools/agricultural-tax';
      case 'minimum-turnover-tax-tool':
        return '/tools/minimum-turnover-tax';
      case 'dvc-verification-tool':
        return '/tools/dvc-verification';
      case 'resource-library-tool':
        return '/tools/resource-library';
      case 'early-filing-incentive-tool':
        return '/tools/early-filing-incentive';
      case 'vat-apportionment-calculator':
      case 'vat-apportionment-calculator-tool':
        return '/tools/vat-apportionment-calculator';
      case 'seo-performance-audit':
      case 'seo-performance-audit-tool':
      case 'seo-audit':
        return '/tools/seo-performance-audit';
      default:
        return `/tools/${id}`;
    }
  };

  const allTools = searchableTaxTools;
  const relatedTools = allTools.filter((t) => t.id !== toolId).slice(0, 4);
  const currentToolRoute = getToolRoute(toolId);

  return (
    <ContactPageShell
      breadcrumbs={[
        { label: 'Tools & Calculators', path: '/tools' },
        { label: category, path: '/tools' },
        { label: title },
      ]}
      eyebrow={`Statutory Interactive Tool · ${category} · Bangladesh`}
      headline={title}
      accentHeadline="Statutory computation & advisory."
      description={description}
      metaItems={[
        category,
        'Finance Act & ITA 2023 Aligned',
        'Accounticca × E-Lawyers Advisory',
      ]}
      actions={
        <>
          <Link
            to="/tools"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-xs transition hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-950"
          >
            <ArrowLeft className="h-4 w-4 text-emerald-700" aria-hidden="true" />
            All Tools &amp; Calculators
          </Link>
          <button
            type="button"
            onClick={() => setIsEmailModalOpen(true)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 cursor-pointer"
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            Email Calculation Summary
          </button>
        </>
      }
      summaryCard={{
        eyebrow: 'Statutory Tool Context',
        title: category,
        icon: <Calculator className="h-5 w-5" aria-hidden="true" />,
        description:
          'Interactive calculation engine maintained by High Court advocates and chartered tax advisors. Book a session for official filing sign-off.',
        actions: [
          {
            label: 'Book Consultation',
            to: `/contact?tab=appointment&service=${encodeURIComponent(`Legal & Tax Representation (${title})`)}`,
            icon: <Calendar className="h-3.5 w-3.5" aria-hidden="true" />,
          },
          {
            label: 'Send Report via Email',
            onClick: () => setIsEmailModalOpen(true),
            icon: <Mail className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />,
            variant: 'neutral',
          },
        ],
        footerIcon: <Building2 className="h-4 w-4" aria-hidden="true" />,
        footerText: 'Verified against NBR Statutory SROs, Companies Act 1994 & ITA 2023 schedules.',
      }}
      trustItems={[
        {
          icon: <ShieldCheck className="h-4 w-4" aria-hidden="true" />,
          label: 'Zero third-party telemetry; local computation',
        },
        {
          icon: <Scale className="h-4 w-4" aria-hidden="true" />,
          label: 'Reviewed by ACCA advisors & tax advocates',
        },
        {
          icon: <Clock3 className="h-4 w-4" aria-hidden="true" />,
          label: 'Exportable & ready for partner review',
        },
      ]}
    >
      <ToolSEO
        toolId={toolId}
        title={title}
        description={description}
        canonicalUrl={currentToolRoute}
        category={category}
        keywords={[
          title,
          category,
          'Bangladesh Tax Calculator',
          'RJSC Compliance',
          'Income Tax Act 2023',
        ]}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Tools Hub', url: '/tools' },
          { name: title, url: currentToolRoute },
        ]}
      />

      {/* Main Tool Workspace */}
      <div ref={toolContentRef} className="w-full min-w-0 space-y-6">
        {children}
      </div>

      <CalculationEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        toolId={toolId}
        toolName={title}
        toolCategory={category}
        toolPath={currentToolRoute}
        userEmail={user?.email}
        userName={user?.displayName}
        containerRef={toolContentRef}
      />

      {/* Bottom Related Tools & Chamber Representation in Contact Styling */}
      <section className="pt-4">
        <ContactSectionHeader
          eyebrow="Connected Advisory & Calculators"
          title="Continue your compliance workflow"
          description="Cross-check related statutory rules or route your numbers directly to a partner desk."
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 items-stretch">
          <div className="flex h-full flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-950">
                <Sparkles className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                Related Statutory Tools
              </h3>
              <Link
                to="/tools"
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950"
              >
                View All <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>

            <div className="flex-1 space-y-3">
              {relatedTools.map((rt) => (
                <Link
                  key={rt.id}
                  to={getToolRoute(rt.id)}
                  className="group block space-y-1 rounded-2xl border border-slate-200/80 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="line-clamp-1 text-sm font-bold text-slate-900 transition-colors group-hover:text-emerald-800">
                      {rt.shortName || rt.name}
                    </span>
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                  </div>
                  <p className="line-clamp-2 text-xs leading-5 text-slate-600">{rt.description}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex h-full flex-col justify-between rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/30 p-6 shadow-xs sm:p-8 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-800">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-800">
                  <Building2 className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-xs font-semibold">Expert Chamber Representation</span>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-slate-950">
                Need Turnkey RJSC Filing or NBR Tax Assessment Support?
              </h3>
              <p className="text-sm leading-6 text-slate-600">
                Consult our Supreme Court Advocates, ACCA chartered advisors, and RJSC corporate practitioners for 1-on-1 statutory filing, hearing representation, and compliance sign-off.
              </p>
            </div>

            <div className="space-y-3 pt-2 border-t border-emerald-200/70">
              <a
                href={buildAppointmentUrl({
                  service: `Legal & Tax Representation (${title})`,
                  notes: `Tool context: ${title} (${toolId})`,
                  source: 'ToolPageLayout Sidebar',
                })}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
              >
                <Calendar className="h-4 w-4" aria-hidden="true" />
                <span>Book Legal &amp; Tax Consultation</span>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
              <Link
                to="/contact"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 transition hover:border-emerald-300 hover:bg-emerald-50/40"
              >
                <span>Open Chamber Contact Desk</span>
                <ArrowRight className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </ContactPageShell>
  );
};

export default ToolPageLayout;
