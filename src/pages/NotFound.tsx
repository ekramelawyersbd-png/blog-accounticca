import { Link } from 'react-router-dom';
import { Home, Search, Wrench, ArrowLeft, ShieldAlert, BookOpen } from 'lucide-react';
import { SEO } from '../components/SEO';
import { ContactPageShell } from '../components/layout/ContactPageShell';

export function NotFound() {
  return (
    <>
      <SEO
        title="404 - Page Not Found | Compliance Hub"
        description="The statutory guide, tax calculator, or compliance page could not be found."
      />

      <ContactPageShell
        breadcrumbs={[{ label: '404 · Not Found' }]}
        eyebrow="Error 404"
        headline="Page or Document"
        accentHeadline="Not Found"
        description="The requested statutory guideline, tax tool, or compliance document may have been updated, relocated, or is temporarily unavailable under recent NBR or RJSC circular revisions."
        metaItems={[
          'Income Tax Act 2023',
          'Calculators & Checklists',
          'Direct Legal Support'
        ]}
        summaryCard={{
          eyebrow: 'Navigation Recovery',
          title: 'Return to Active Hub',
          description: 'Jump directly back to our primary compliance hub, search engine, or advisor desk.',
          icon: <ShieldAlert className="w-5 h-5" />,
          actions: [
            { label: 'Back to Homepage', to: '/', variant: 'emerald' },
            { label: 'Contact Legal Desk', to: '/contact', variant: 'neutral' }
          ],
          footerIcon: <ArrowLeft className="w-4 h-4 text-emerald-700" />,
          footerText: 'Verified repository links updated daily'
        }}
      >
        <div className="max-w-3xl mx-auto bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Quick Compliance Destinations</h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Select a verified section below or return to the previous page.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <Link
              to="/"
              className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all flex items-center gap-3 group"
            >
              <Home className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-900">Homepage</div>
                <div className="text-[11px] text-slate-500">Back to Compliance Hub</div>
              </div>
            </Link>

            <Link
              to="/search"
              className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all flex items-center gap-3 group"
            >
              <Search className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-900">Search Articles</div>
                <div className="text-[11px] text-slate-500">Find acts, SROs &amp; slabs</div>
              </div>
            </Link>

            <Link
              to="/tools"
              className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all flex items-center gap-3 group"
            >
              <Wrench className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-900">Tools Hub</div>
                <div className="text-[11px] text-slate-500">Calculators &amp; checklists</div>
              </div>
            </Link>

            <Link
              to="/category/tax"
              className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all flex items-center gap-3 group"
            >
              <BookOpen className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-900">Income Tax Guides</div>
                <div className="text-[11px] text-slate-500">Income Tax Act 2023</div>
              </div>
            </Link>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go back to previous page</span>
            </button>
          </div>
        </div>
      </ContactPageShell>
    </>
  );
}
