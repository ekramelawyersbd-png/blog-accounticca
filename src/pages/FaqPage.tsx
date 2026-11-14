import { FAQ } from '../components/FAQ';
import { SEO } from '../components/SEO';
import { ContactPageShell } from '../components/layout/ContactPageShell';
import { HelpCircle, BookOpen, CalendarDays, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function FaqPage() {
  return (
    <ContactPageShell
      breadcrumbs={[
        { label: 'Knowledge Hub', path: '/search' },
        { label: 'Legal & Tax FAQs' },
      ]}
      eyebrow="Statutory Knowledge Base · Bangladesh Legal & Tax FAQs"
      headline="Frequently asked questions."
      accentHeadline="Clear answers on ITA 2023, VAT & RJSC."
      description="Authoritative, reference-backed answers to the most common statutory questions covering Income Tax Act 2023, VAT BIN & VDS, RJSC company incorporation, and commercial contracts."
      metaItems={[
        'Income Tax Act 2023 & Finance Act',
        'VAT & SD Act 2012 Rules',
        'Companies Act 1994 & Stamp Duty',
      ]}
      actions={
        <>
          <Link
            to="/contact?tab=appointment"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
          >
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            Ask a Practice Partner
          </Link>
          <Link
            to="/glossary"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-xs transition hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-950"
          >
            <BookOpen className="h-4 w-4 text-emerald-700" aria-hidden="true" />
            Browse Tax &amp; Legal Glossary
          </Link>
        </>
      }
      summaryCard={{
        eyebrow: 'Advisory Desk Coverage',
        title: 'Statutory Reference Index',
        icon: <HelpCircle className="h-5 w-5" aria-hidden="true" />,
        description:
          'Every answer includes its governing section citation and practical compliance thresholds. Reach out directly if your matter requires written opinion.',
        actions: [
          {
            label: 'Contact Chambers',
            to: '/contact',
            icon: <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />,
          },
          {
            label: 'Search Archive',
            to: '/search',
            variant: 'neutral',
          },
        ],
        footerText: 'Updated for Bangladesh Assessment Year 2026–2027 & SRO directives.',
      }}
    >
      <SEO
        title="Legal, Tax, VAT & RJSC Compliance FAQs | Accounticca & E-Lawyers"
        description="Frequently asked questions and statutory answers on Bangladesh Income Tax Act 2023, VAT compliance, RJSC company registration, and corporate law."
        canonicalUrl="/faq"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Legal & Tax FAQs', url: '/faq' },
        ]}
      />
      <FAQ className="!bg-transparent !border-t-0 !py-0 !px-0" hideHeader />
    </ContactPageShell>
  );
}
