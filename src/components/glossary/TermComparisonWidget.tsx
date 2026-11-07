import React, { useState } from 'react';
import { GitCompare, Check, Scale, ShieldAlert, ArrowRight, HelpCircle } from 'lucide-react';
import { termComparisons } from '../../data/glossaryData';

export const TermComparisonWidget: React.FC = () => {
  const [selectedComparisonId, setSelectedComparisonId] = useState<string>(termComparisons[0].id);

  const activeComparison = termComparisons.find(c => c.id === selectedComparisonId) || termComparisons[0];

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700/80 my-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-700/80">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2 border border-emerald-500/30">
            <GitCompare className="w-3.5 h-3.5" />
            <span>Interactive Concept Matrix</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            Side-by-Side Tax Concept Comparison
          </h2>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Avoid common costly compliance errors by understanding the exact statutory boundaries between frequently confused Bangladesh tax terms.
          </p>
        </div>

        {/* Preset Selector Tabs */}
        <div className="flex flex-wrap gap-2">
          {termComparisons.map((comp) => (
            <button
              key={comp.id}
              onClick={() => setSelectedComparisonId(comp.id)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 ${
                selectedComparisonId === comp.id
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold scale-[1.02]'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700'
              }`}
            >
              {comp.title}
            </button>
          ))}
        </div>
      </div>

      {/* Description Header */}
      <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-white text-base font-bengali">
            {activeComparison.bengaliTitle}
          </h3>
          <p className="text-sm text-slate-300 mt-1 leading-relaxed">
            {activeComparison.description}
          </p>
        </div>
      </div>

      {/* Side-by-Side Comparison Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Term A Card */}
        <div className="bg-slate-800/90 rounded-2xl p-5 border border-emerald-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Direct / Primary Head
              </span>
              <span className="text-xs text-slate-400">Concept A</span>
            </div>
            <h4 className="text-xl font-bold text-white mb-4">
              {activeComparison.termA.name}
            </h4>

            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/50">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Nature & Core Basis
                </span>
                <p className="text-slate-200">{activeComparison.termA.basis}</p>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/50">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Governing Legislation
                </span>
                <p className="text-emerald-300 font-medium">{activeComparison.termA.governingLaw}</p>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/50">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Rates / Scope
                </span>
                <p className="text-slate-200">{activeComparison.termA.rateOrScope}</p>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/50">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Key Compliance Obligation
                </span>
                <p className="text-slate-200">{activeComparison.termA.keyObligation}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/60">
            <div className="flex items-start gap-2 text-xs text-amber-300">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span><strong>Consequence: </strong>{activeComparison.termA.consequence}</span>
            </div>
          </div>
        </div>

        {/* Term B Card */}
        <div className="bg-slate-800/90 rounded-2xl p-5 border border-blue-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs uppercase font-bold tracking-wider text-blue-400 bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-500/30">
                Counterpart / Secondary Mechanism
              </span>
              <span className="text-xs text-slate-400">Concept B</span>
            </div>
            <h4 className="text-xl font-bold text-white mb-4">
              {activeComparison.termB.name}
            </h4>

            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/50">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Nature & Core Basis
                </span>
                <p className="text-slate-200">{activeComparison.termB.basis}</p>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/50">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Governing Legislation
                </span>
                <p className="text-blue-300 font-medium">{activeComparison.termB.governingLaw}</p>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/50">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Rates / Scope
                </span>
                <p className="text-slate-200">{activeComparison.termB.rateOrScope}</p>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/50">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Key Compliance Obligation
                </span>
                <p className="text-slate-200">{activeComparison.termB.keyObligation}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/60">
            <div className="flex items-start gap-2 text-xs text-amber-300">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span><strong>Consequence: </strong>{activeComparison.termB.consequence}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
