import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Scale, 
  Calculator, 
  FileCheck, 
  ShieldCheck, 
  ArrowRight, 
  Building2, 
  CheckCircle2, 
  BookOpen, 
  Users, 
  Briefcase 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const HomePage: React.FC = () => {
  const { user, signInWithGoogle, signInDemoUser } = useAuth();

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="bg-linear-to-b from-slate-900 via-blue-950 to-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
            <Scale className="w-3.5 h-3.5 text-blue-400" />
            eLawyers BD · Premier Bangladesh Law &amp; Tax Compliance Suite
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            Authoritative Bangladesh Legal, Tax &amp; Corporate Compliance
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Statutory calculators, corporate registries, and case docket workspace built for advocates, chartered accountants, and Bangladeshi enterprises.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/tools"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all text-sm"
            >
              <Calculator className="w-4 h-4" />
              Explore Free Tools
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/tax-calculator"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/20 backdrop-blur-xs transition-all text-sm"
            >
              Tax Calculator (FY 24-25)
            </Link>

            <Link
              to="/workspace?tab=tool-signings"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-200 font-bold rounded-xl border border-emerald-400/30 backdrop-blur-xs transition-all text-sm"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Workspace Log
            </Link>
          </div>

          {/* User Sign-in quick card */}
          {!user && (
            <div className="pt-4 max-w-md mx-auto">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-xs text-slate-200 flex items-center justify-between gap-3">
                <div className="text-left">
                  <div className="font-bold text-white">Free Member Access</div>
                  <div className="text-[11px] text-slate-300">Sign in once to unlock all tools freely.</div>
                </div>
                <button
                  onClick={() => signInWithGoogle()}
                  className="px-3.5 py-1.5 bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-lg text-xs shadow-xs transition-all cursor-pointer"
                >
                  Google Sign-In
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center font-bold">
              <Calculator className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Zero Paywall Compliance Tools</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every tool on <Link to="/tools" className="text-blue-600 underline font-semibold">/tools</Link> is completely free upon signing in. No shop purchase or checkout required.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Audit-Ready Workspace Ledger</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every calculation session is logged in real-time in the <Link to="/workspace?tab=tool-signings" className="text-blue-600 underline font-semibold">/workspace</Link> ledger with timestamps and CSV export.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center font-bold">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Statutory BD Law Alignment</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Formulas strict to Income Tax Act 2023, Finance Act 2024-25, VAT Act 2012, and Bangladesh Labour Act 2006.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
