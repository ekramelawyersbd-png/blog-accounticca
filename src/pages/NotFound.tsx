import { Link } from 'react-router-dom';
import { Home, Search, Wrench, ArrowLeft, ShieldAlert, BookOpen } from 'lucide-react';
import { SEO } from '../components/SEO';

export function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
      <SEO 
        title="404 - Page Not Found | Compliance Hub"
        description="The statutory guide, tax calculator, or compliance page could not be found."
      />
      <div className="max-w-xl w-full text-center bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>
        
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Error 404
        </span>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-4 mb-3 tracking-tight">
          Page or Document Not Found
        </h1>

        <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-8">
          The requested statutory guideline, tax tool, or compliance document may have been updated, relocated, or is temporarily unavailable under recent NBR or RJSC circular revisions.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-left">
          <Link
            to="/"
            className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all flex items-center gap-3 group"
          >
            <Home className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-bold text-slate-900">Homepage</div>
              <div className="text-[11px] text-slate-500">Back to Compliance Hub</div>
            </div>
          </Link>

          <Link
            to="/search"
            className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all flex items-center gap-3 group"
          >
            <Search className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-bold text-slate-900">Search Articles</div>
              <div className="text-[11px] text-slate-500">Find acts, SROs & slabs</div>
            </div>
          </Link>

          <Link
            to="/tools"
            className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all flex items-center gap-3 group"
          >
            <Wrench className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-bold text-slate-900">Tools Hub</div>
              <div className="text-[11px] text-slate-500">Calculators & checklists</div>
            </div>
          </Link>

          <Link
            to="/category/tax"
            className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all flex items-center gap-3 group"
          >
            <BookOpen className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-bold text-slate-900">Income Tax Guides</div>
              <div className="text-[11px] text-slate-500">Income Tax Act 2023</div>
            </div>
          </Link>
        </div>

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
  );
}
