import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  Clock,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Globe,
  Lightbulb,
  PieChart,
  Scale,
  Settings,
  ShieldCheck,
  Target,
  TrendingUp,
} from 'lucide-react';

const STRATEGIC_PILLARS = [
  {
    label: 'Business Strategy',
    icon: Lightbulb,
    iconWrapClass: 'bg-amber-50 border-amber-200/80 text-amber-700',
  },
  {
    label: 'Financial Intelligence',
    icon: TrendingUp,
    iconWrapClass: 'bg-emerald-50 border-emerald-200/80 text-emerald-700',
  },
  {
    label: 'Legal Expertise',
    icon: Scale,
    iconWrapClass: 'bg-blue-50 border-blue-200/80 text-blue-700',
  },
  {
    label: 'Regulatory Compliance',
    icon: ShieldCheck,
    iconWrapClass: 'bg-slate-100 border-slate-200 text-slate-700',
  },
] as const;

const ACCOUNTICCA_SERVICES = [
  {
    title: 'Strategic Planning & Market Validation',
    description:
      'Business opportunities, market potential, revenue models, growth pathways, and competitive positioning.',
    icon: Target,
  },
  {
    title: 'Financial Modeling & Growth Strategy',
    description:
      'Financial forecasting, investment planning, business valuation, and revenue optimization.',
    icon: TrendingUp,
  },
  {
    title: 'Fractional CFO & Financial Governance',
    description:
      'Financial reporting, budget planning, performance analysis, and cash flow management.',
    icon: Clock,
  },
  {
    title: 'Business Process Optimization & Automation',
    description:
      'Operational workflows, internal processes, technology adoption, and business scalability.',
    icon: Settings,
  },
] as const;

const E_LAWYERS_SERVICES = [
  {
    title: 'Corporate Incorporation & RJSC Compliance',
    description:
      'Company registration, RJSC filings, corporate documentation, and annual compliance requirements.',
    icon: Building2,
  },
  {
    title: 'Commercial Contracts & Agreements',
    description:
      'Business agreements, partnership contracts, vendor documentation, and commercial negotiations.',
    icon: FileText,
  },
  {
    title: 'Corporate Tax & VAT Advisory',
    description:
      'Corporate tax compliance, VAT matters, regulatory obligations, and tax planning structures.',
    icon: FileSpreadsheet,
  },
  {
    title: 'Foreign Investment & BIDA Advisory',
    description:
      'BIDA approval, foreign investment structuring, and business expansion requirements.',
    icon: Globe,
  },
  {
    title: 'Intellectual Property Protection',
    description:
      'Trademark registration, IP protection, brand security, and legal ownership management.',
    icon: ShieldCheck,
  },
] as const;

export function StrategicPartnershipSection() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-xs font-bold tracking-wide text-emerald-800 uppercase">
          Strategic Ecosystem Partnership
        </p>

        <h2 className="mt-2.5 text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-slate-950 leading-[1.12] text-balance">
          <span className="text-amber-700">Accounticca</span>
          <span className="mx-2.5 sm:mx-3.5 font-normal text-slate-400" aria-hidden="true">
            &times;
          </span>
          <span className="text-blue-700">E-Lawyers</span>
        </h2>

        <p className="mt-3 text-base sm:text-lg font-bold text-slate-800 text-balance">
          Building Stronger Businesses Through Integrated Advisory
        </p>

        <div className="mt-4 space-y-3 text-sm sm:text-[15px] text-slate-600 leading-relaxed">
          <p>
            In today&apos;s rapidly evolving business environment, companies require more than
            individual professional services. Growth, compliance, financial planning, and legal
            protection are deeply connected &mdash; and every major business decision carries both
            financial and legal implications.
          </p>
          <p>
            To address this growing need, Accounticca and E-Lawyers have established a strategic
            ecosystem partnership that brings together business advisory, financial intelligence,
            legal expertise, and regulatory compliance under one unified platform.
          </p>
        </div>
      </div>

      {/* Four Strategic Pillars Strip */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {STRATEGIC_PILLARS.map((pillar, idx) => {
          const Icon = pillar.icon;
          return (
            <div
              key={pillar.label}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white px-4 py-3.5 shadow-2xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${pillar.iconWrapClass}`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  {pillar.label}
                </span>
              </div>
              <span className="font-mono text-[11px] font-bold text-slate-400 tabular-nums shrink-0">
                0{idx + 1}
              </span>
            </div>
          );
        })}
      </div>

      {/* Two-Column Practice Comparison */}
      <div className="mt-8 lg:mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
        {/* Left Card: Accounticca */}
        <article className="rounded-3xl border border-amber-200/80 bg-gradient-to-b from-[#fffdf4] via-white to-white p-6 sm:p-8 shadow-xs flex flex-col">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-amber-200/60">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <PieChart className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                  About
                </p>
                <h3 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-tight">
                  Accounticca
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-amber-800 mt-0.5">
                  Business &amp; Financial Advisory Practice
                </p>
              </div>
            </div>

            <a
              href="https://accounticca.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-950 underline decoration-amber-400/70 underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              <span>accounticca.com</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>

          <p className="mt-5 mb-5 text-sm text-slate-600 leading-relaxed">
            Accounticca focuses on helping organizations improve financial performance, strengthen
            internal systems, and develop sustainable growth strategies through strategic analysis
            and financial expertise.
          </p>

          <ul className="divide-y divide-amber-100/90 border-t border-amber-100/90 flex-1">
            {ACCOUNTICCA_SERVICES.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.title} className="py-3.5 first:pt-4 last:pb-2 flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed mt-1">
                      {item.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 pt-4 border-t border-amber-200/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-mono text-slate-500 font-medium tabular-nums">
              04 Advisory Capabilities
            </span>
            <Link
              to="/services"
              className="inline-flex items-center gap-1.5 font-bold text-amber-800 hover:text-amber-950 transition-colors whitespace-nowrap"
            >
              <span>Explore Advisory Services</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </article>

        {/* Right Card: E-Lawyers */}
        <article className="rounded-3xl border border-blue-200/80 bg-gradient-to-b from-[#f4f8ff] via-white to-white p-6 sm:p-8 shadow-xs flex flex-col">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-blue-200/60">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Scale className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                  About
                </p>
                <h3 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-tight">
                  E-Lawyers
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-blue-800 mt-0.5">
                  Legal &amp; Compliance Practice
                </p>
              </div>
            </div>

            <a
              href="https://elawyersbd.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-800 hover:text-blue-950 underline decoration-blue-400/70 underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              <span>elawyersbd.com</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>

          <p className="mt-5 mb-5 text-sm text-slate-600 leading-relaxed">
            E-Lawyers provides comprehensive legal and corporate compliance support, helping
            businesses operate within regulatory frameworks while protecting their interests with
            experienced legal professionals.
          </p>

          <ul className="divide-y divide-blue-100/90 border-t border-blue-100/90 flex-1">
            {E_LAWYERS_SERVICES.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.title} className="py-3.5 first:pt-4 last:pb-2 flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed mt-1">
                      {item.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 pt-4 border-t border-blue-200/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-mono text-slate-500 font-medium tabular-nums">
              05 Legal &amp; Compliance Practices
            </span>
            <Link
              to="/contact"
              className="inline-flex items-center gap-1.5 font-bold text-blue-800 hover:text-blue-950 transition-colors whitespace-nowrap"
            >
              <span>Consult Legal &amp; Compliance Desk</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}
