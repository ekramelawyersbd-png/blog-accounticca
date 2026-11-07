import React, { useState } from 'react';
import { 
  Building2, 
  CheckCircle2, 
  TrendingDown, 
  HelpCircle, 
  Copy, 
  Check, 
  Scale, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';

interface TurnoverSlabsSummaryCardProps {
  className?: string;
}

export function TurnoverSlabsSummaryCard({ className = '' }: TurnoverSlabsSummaryCardProps) {
  const [copied, setCopied] = useState<boolean>(false);

  const slabs = [
    {
      slab: 'Slab 1',
      range: 'Up to Tk. 2 Crore',
      rate: '0% (Tax-Free)',
      rateColor: 'text-emerald-700 bg-emerald-50 border-emerald-300',
      description: 'Small retail shops, early-stage startups, cottage industries, and neighborhood vendors.',
      benefit: 'Complete exemption from minimum turnover tax; 100% relief during growth or loss periods.'
    },
    {
      slab: 'Slab 2',
      range: 'Above Tk. 2 Crore to Tk. 4 Crore',
      rate: '0.5%',
      rateColor: 'text-blue-700 bg-blue-50 border-blue-300',
      description: 'Medium traders, regional distributors, growing retail chains, and expanding SMEs.',
      benefit: 'Half the previous tax rate (0.5% instead of 1.0%), saving businesses up to Tk. 2,00,000 annually.'
    },
    {
      slab: 'Slab 3',
      range: 'Above Tk. 4 Crore',
      rate: '1.0%',
      rateColor: 'text-purple-700 bg-purple-50 border-purple-300',
      description: 'Large manufacturing companies, corporate distributors, commercial importers, and mega retail.',
      benefit: 'Standard corporate minimum turnover floor ensuring structured fiscal contribution.'
    }
  ];

  const comparisonData = [
    { category: 'Small Businesses (< Tk. 2 Crore)', previous: 'Flat 1% on total sales', revised: '0% (Completely Tax-Free)', impact: '100% Tax Relief' },
    { category: 'Medium Businesses (Tk. 2–4 Crore)', previous: 'Flat 1% on total sales', revised: 'Reduced to 0.5%', impact: '50% Tax Cut' },
    { category: 'Large Businesses (> Tk. 4 Crore)', previous: 'Flat 1% on total sales', revised: 'Remains 1%', impact: 'Stable Fiscal Floor' },
  ];

  const copySummary = () => {
    const text = `
=== NBR Restructured Minimum Turnover Tax Slabs in Bangladesh ===
1. Slab 1: Up to Tk. 2 Crore -> 0% (Tax-Free)
2. Slab 2: Above Tk. 2 Crore to Tk. 4 Crore -> 0.5%
3. Slab 3: Above Tk. 4 Crore -> 1.0%

Previous Proposal: Flat 1% across all business sales regardless of size or profit.
Revised Structure Benefit: Complete exemption up to Tk. 2 Crore, 50% tax reduction for medium enterprises, and loss-protection for businesses facing challenging economic cycles.
Source: National Board of Revenue (NBR), Bangladesh.
`.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`bg-white rounded-3xl border border-indigo-200 shadow-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-400/30 text-indigo-300">
              <Scale className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
                  NBR Regulatory Policy
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-white/10 text-slate-200 rounded-md">
                  Finance Act Updates
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                Restructured Minimum Turnover Tax Slabs
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Official 3-tier turnover system replacing the previous flat 1% proposal for Bangladeshi businesses
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={copySummary}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-900 bg-indigo-300 hover:bg-indigo-200 transition-colors shadow-sm self-end sm:self-center"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy Slabs'}
          </button>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-8">
        
        {/* The 3 Slabs Grid */}
        <div>
          <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>Official 3-Tier Turnover Tax Slabs</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {slabs.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-50/80 rounded-2xl border border-slate-200 p-5 flex flex-col justify-between hover:border-indigo-300 hover:shadow-sm transition-all"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {item.slab}
                    </span>
                    <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${item.rateColor}`}>
                      {item.rate}
                    </span>
                  </div>

                  <div className="text-lg font-black text-slate-900 mb-1">
                    {item.range}
                  </div>

                  <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200/80 text-[11px] text-emerald-800 font-semibold bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200/60">
                  {item.benefit}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Head-to-Head Comparison Table */}
        <div>
          <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-emerald-600" />
            <span>Comparison: Previous Flat 1% vs Revised Structure</span>
          </h4>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Business Category</th>
                  <th className="py-3 px-4">Previous Flat Proposal</th>
                  <th className="py-3 px-4">Revised Slabs</th>
                  <th className="py-3 px-4 text-right">Business Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {comparisonData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {row.category}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 line-through">
                      {row.previous}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-indigo-700">
                      {row.revised}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-emerald-700">
                      {row.impact}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Key Statutory Drivers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-1.5">
            <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>1. Relief for Small Traders</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Small business owners operating on thin 3–5% net margins are fully protected from paying tax when turnover is under Tk. 2 Crore.
            </p>
          </div>

          <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200 space-y-1.5">
            <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-blue-700" />
              <span>2. Loss-Making Insulation</span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              When raw material inflation or recession forces operational losses, the revised slabs cut the statutory tax floor by up to 100%.
            </p>
          </div>

          <div className="p-4 bg-purple-50/80 rounded-2xl border border-purple-200 space-y-1.5">
            <div className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-purple-700" />
              <span>3. Gradual Stepped Growth</span>
            </div>
            <p className="text-[11px] text-purple-800 leading-relaxed">
              Startups scale smoothly through 0% &rarr; 0.5% &rarr; 1% without facing an immediate severe cliff effect on gross sales.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default TurnoverSlabsSummaryCard;
