import React from 'react';
import { 
  Calculator, 
  ShieldCheck, 
  Award, 
  Heart, 
  Users, 
  Info, 
  Scale, 
  CheckCircle2,
  TrendingUp,
  Percent
} from 'lucide-react';

interface IndividualTaxSlabsCardProps {
  className?: string;
}

export function IndividualTaxSlabsCard({ className = '' }: IndividualTaxSlabsCardProps) {
  const slabs = [
    { label: 'On the first 4,00,000 Taka', range: 'Tk 0 – 4,00,000', rate: '0%', status: 'Nil (Tax-Free)' },
    { label: 'On the next 3,00,000 Taka', range: 'Tk 4,00,001 – 7,00,000', rate: '10%', status: 'Max Tk 30,000' },
    { label: 'On the next 4,00,000 Taka', range: 'Tk 7,00,001 – 11,00,000', rate: '15%', status: 'Max Tk 60,000' },
    { label: 'On the next 5,00,000 Taka', range: 'Tk 11,00,001 – 16,00,000', rate: '20%', status: 'Max Tk 1,00,000' },
    { label: 'On the next 10,00,000 Taka', range: 'Tk 16,00,001 – 26,00,000', rate: '25%', status: 'Max Tk 2,50,000' },
    { label: 'On the remaining balance', range: 'Above Tk 26,00,000', rate: '30%', status: 'Remaining Income' },
  ];

  const specialExemptions = [
    {
      category: 'General Resident Individuals',
      threshold: 'Tk 4,00,000',
      icon: Users,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      description: 'Standard baseline initial tax-free threshold.'
    },
    {
      category: 'Women & Seniors (65+ years)',
      threshold: 'Tk 4,50,000',
      icon: Heart,
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      description: 'Applicable to female taxpayers and male senior citizens aged 65 or older.'
    },
    {
      category: 'Disabled Persons',
      threshold: 'Tk 5,25,000',
      icon: ShieldCheck,
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
      description: 'Certified third-gender or physically challenged individuals.'
    },
    {
      category: 'War-wounded Freedom Fighters',
      threshold: 'Tk 5,50,000',
      icon: Award,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      description: 'Gazetted war-wounded freedom fighters and gazetted fighters.'
    },
    {
      category: 'Parents/Guardians of Disabled Persons',
      threshold: '+Tk 50,000 per dependent',
      icon: Users,
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      description: 'Receive an additional Tk 50,000 initial exemption for each disabled child or dependent.'
    },
  ];

  return (
    <div className={`bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-400/30 text-emerald-300">
              <Scale className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                  Bangladesh Finance Act 2026
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-white/10 text-slate-200 rounded-md">
                  AY 2026–2027
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                Individual Income Tax Slabs & Special Exemptions
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Official statutory income thresholds and progressive tax rates for assessment year 2026-27
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-8">
        {/* Slabs Table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Percent className="w-4 h-4 text-emerald-600" />
              <span>1. Progressive Tax Slabs for Individuals (2026–2027)</span>
            </h4>
            <span className="text-xs text-slate-500">For resident individuals</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-4 py-3 sm:px-6">Taxable Income Slab</th>
                  <th className="px-4 py-3 sm:px-6">Income Range</th>
                  <th className="px-4 py-3 sm:px-6 text-center">Tax Rate</th>
                  <th className="px-4 py-3 sm:px-6 text-right">Max Tax in Slab</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {slabs.map((slab, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 sm:px-6 font-bold text-slate-900">
                      {slab.label}
                    </td>
                    <td className="px-4 py-3.5 sm:px-6 text-slate-600 font-mono text-xs">
                      {slab.range}
                    </td>
                    <td className="px-4 py-3.5 sm:px-6 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-black ${
                        slab.rate === '0%' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : slab.rate === '10%'
                          ? 'bg-teal-100 text-teal-800'
                          : slab.rate === '15%'
                          ? 'bg-blue-100 text-blue-800'
                          : slab.rate === '20%'
                          ? 'bg-amber-100 text-amber-800'
                          : slab.rate === '25%'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {slab.rate}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 sm:px-6 text-right font-semibold text-slate-700">
                      {slab.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Special Exemptions Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>2. Special Exemptions (Initial 0% Tax-Free Slab)</span>
            </h4>
            <span className="text-xs text-slate-500">Statutory threshold categories</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {specialExemptions.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div 
                  key={idx} 
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs sm:text-sm text-slate-900">
                        {item.category}
                      </span>
                      <IconComp className="w-4 h-4 text-emerald-600 shrink-0" />
                    </div>
                    <div className="text-2xl font-black text-emerald-700 font-mono tracking-tight mt-1">
                      {item.threshold}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 pt-2 border-t border-slate-200/80 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary Footer Note */}
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950 text-xs flex items-start gap-3">
          <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-emerald-900">Statutory Note on Minimum Tax:</span>{' '}
            If an individual taxpayer's total taxable income exceeds their respective tax-free threshold, a minimum tax applies based on municipal jurisdiction (Tk 5,000 in Dhaka & Chattogram city corporations; Tk 4,000 in other city corporations; and Tk 3,000 in non-city corporation areas).
          </div>
        </div>
      </div>
    </div>
  );
}

export default IndividualTaxSlabsCard;
