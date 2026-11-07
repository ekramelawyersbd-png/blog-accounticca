import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white">
                <Scale className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-white text-base">eLawyers BD</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Bangladesh legal &amp; taxation compliance suite. Statutory engines for Income Tax Act 2023, VAT Act 2012, and Companies Act 1994.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm mb-3">Free Statutory Tools</h4>
            <ul className="space-y-2">
              <li><Link to="/tax-calculator" className="hover:text-white transition-colors">Individual Income Tax Calculator</Link></li>
              <li><Link to="/tools/vat" className="hover:text-white transition-colors">VAT &amp; Mushak 6.3 Calculator</Link></li>
              <li><Link to="/tools/company-registration" className="hover:text-white transition-colors">RJSC Incorporation Fees</Link></li>
              <li><Link to="/tools/stamp-duty" className="hover:text-white transition-colors">Deed Stamp Duty Calculator</Link></li>
              <li><Link to="/tools/gratuity" className="hover:text-white transition-colors">Labour Law Gratuity Settlement</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm mb-3">Enterprise Workspace</h4>
            <ul className="space-y-2">
              <li><Link to="/workspace?tab=tool-signings" className="hover:text-white transition-colors">Tool Signings Live Log</Link></li>
              <li><Link to="/workspace?tab=compliance-calendar" className="hover:text-white transition-colors">Statutory Deadlines Calendar</Link></li>
              <li><Link to="/workspace?tab=documents" className="hover:text-white transition-colors">Legal Draft Vault</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Chamber Advisory Retainer</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm mb-3">Statutory Compliance</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Calculations reflect NBR statutory circulars and Finance Act 2024 provisions. Every member access is logged under the workspace audit trail.
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              100% Free Tools for Members
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} eLawyers BD. All statutory rights reserved under the laws of Bangladesh.
          </div>
          <div className="flex items-center gap-4">
            <Link to="/tools" className="hover:text-slate-400">Tools Directory</Link>
            <Link to="/workspace?tab=tool-signings" className="hover:text-slate-400">Workspace Log</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
