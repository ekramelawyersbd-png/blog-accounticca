import React from 'react';
import { ShoppingBag, CheckCircle2, ShieldCheck, Sparkles, ArrowRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ShopPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Notice Banner ensuring users know tools are free */}
      <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-emerald-950 text-sm sm:text-base">
              All Statutory &amp; Calculation Tools are 100% Free!
            </h3>
            <p className="text-xs text-emerald-800">
              No shop purchase, subscription, or paywall needed to use our tools. Simply sign in to access all tools freely with audit logging to <Link to="/workspace?tab=tool-signings" className="font-bold underline">/workspace</Link>.
            </p>
          </div>
        </div>
        <Link
          to="/tools"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs whitespace-nowrap transition-all"
        >
          Go to Free Tools <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Shop Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-2">
        <span className="text-xs font-bold px-3 py-1 bg-blue-100 text-blue-800 rounded-full border border-blue-200">
          Professional Legal &amp; Corporate Services
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          eLawyers BD Premium Legal &amp; Retainer Advisory Packages
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
          Full-service bespoke advocacy, High Court &amp; Supreme Court representation, corporate secretarial audits, and tailored tax appellate representation by Supreme Court advocates.
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all">
          <div className="space-y-4">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              Advisory &amp; Review
            </span>
            <h3 className="text-lg font-black text-slate-900">Comprehensive Contract &amp; Deed Vetting</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Legal review of commercial agreements, leases, deeds of transfer, and corporate bylaws by senior enrolled advocates.
            </p>
            <div className="text-2xl font-black text-slate-900 pt-2">৳ 15,000 <span className="text-xs font-normal text-slate-500">/ agreement</span></div>
          </div>
          <button 
            onClick={() => alert('Consultation inquiry submitted to eLawyers BD chamber.')}
            className="mt-6 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            Inquire for Consultation
          </button>
        </div>

        <div className="bg-white rounded-2xl border-2 border-blue-600 p-6 flex flex-col justify-between shadow-md relative">
          <div className="absolute -top-3 right-6 bg-blue-600 text-white text-[11px] font-black px-3 py-0.5 rounded-full">
            Most Popular
          </div>
          <div className="space-y-4">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              Company Formation
            </span>
            <h3 className="text-lg font-black text-slate-900">End-to-End RJSC Company Incorporation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Full MoA/AoA drafting, name clearance, digital submission, stamp duty handling, and certified incorporation package.
            </p>
            <div className="text-2xl font-black text-slate-900 pt-2">৳ 35,000 <span className="text-xs font-normal text-slate-500">+ Govt Fees</span></div>
          </div>
          <button 
            onClick={() => alert('Company incorporation inquiry submitted.')}
            className="mt-6 w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer"
          >
            Hire Chamber
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all">
          <div className="space-y-4">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              Tax Appellate
            </span>
            <h3 className="text-lg font-black text-slate-900">Taxes Appellate Tribunal &amp; ADR Representation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Representation before Commissioner (Appeals), Taxes Appellate Tribunal, and Alternative Dispute Resolution (ADR).
            </p>
            <div className="text-2xl font-black text-slate-900 pt-2">৳ 50,000 <span className="text-xs font-normal text-slate-500">/ case retainer</span></div>
          </div>
          <button 
            onClick={() => alert('Appellate representation inquiry submitted.')}
            className="mt-6 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            Schedule Assessment
          </button>
        </div>
      </div>
    </div>
  );
};
