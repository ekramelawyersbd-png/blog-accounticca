import { Breadcrumbs } from '../components/Breadcrumbs';
import { FAQ } from '../components/FAQ';
import { SEO } from '../components/SEO';

export function FaqPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SEO
        title="Legal, Tax, VAT & RJSC Compliance FAQs | Accounticca & E-Lawyers"
        description="Frequently asked questions and statutory answers on Bangladesh Income Tax Act 2023, VAT compliance, RJSC company registration, and corporate law."
        canonicalUrl="/faq"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Legal & Tax FAQs', url: '/faq' }
        ]}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: 'Legal & Tax FAQs' }]} />
      </div>
      <FAQ />
    </div>
  );
}
