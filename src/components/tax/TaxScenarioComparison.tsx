import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ArrowRightLeft, CheckCircle2, ShieldAlert, Sparkles, X, ArrowUpRight, ArrowDownRight, Minus, Share2, BarChart3 } from 'lucide-react';
import { TaxScenario } from '../../types/taxScenario';

interface TaxScenarioComparisonProps {
  scenarios: TaxScenario[];
  onClose: () => void;
  onLoadScenario: (scenario: TaxScenario) => void;
  onShareScenario?: (scenario: TaxScenario) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General Individual',
  female_senior: 'Female / Senior (65+)',
  disabled: 'Person with Disability',
  freedom_fighter: 'Gazetted Freedom Fighter'
};

const LOCATION_LABELS: Record<string, string> = {
  dhaka_ctg: 'Dhaka / Chattogram',
  other_cc: 'Other City Corp.',
  non_cc: 'Non-City Corp.'
};

export function TaxScenarioComparison({ scenarios, onClose, onLoadScenario, onShareScenario }: TaxScenarioComparisonProps) {
  const [selectedLeftId, setSelectedLeftId] = useState<string>(() => scenarios[0]?.id || '');
  const [selectedRightId, setSelectedRightId] = useState<string>(() => scenarios[1]?.id || scenarios[0]?.id || '');

  if (scenarios.length === 0) {
    return null;
  }

  const baseline = scenarios[0];
  const scenarioLeft = scenarios.find((s) => s.id === selectedLeftId) || scenarios[0];
  const scenarioRight = scenarios.find((s) => s.id === selectedRightId) || scenarios[1] || scenarios[0];

  const barChartData = [
    {
      metric: 'Taxable Income',
      scenarioA: scenarioLeft.results.taxableIncome,
      scenarioB: scenarioRight.results.taxableIncome
    },
    {
      metric: 'Gross Tax',
      scenarioA: scenarioLeft.results.grossTax,
      scenarioB: scenarioRight.results.grossTax
    },
    {
      metric: 'Sec 78 Rebate',
      scenarioA: scenarioLeft.results.rebate,
      scenarioB: scenarioRight.results.rebate
    },
    {
      metric: 'Final Liability',
      scenarioA: scenarioLeft.results.finalLiability,
      scenarioB: scenarioRight.results.finalLiability
    },
    {
      metric: 'Net Payable',
      scenarioA: scenarioLeft.results.netPayable,
      scenarioB: scenarioRight.results.netPayable
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                Tax Scenario Comparison
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  {scenarios.length} {scenarios.length === 1 ? 'Scenario' : 'Scenarios'}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Comparing tax thresholds, investment rebates, cliff triggers, and net liabilities side-by-side.
              </p>
            </div>
          </div>
          <button
            id="close-comparison-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="overflow-x-auto p-6 flex-1 space-y-6">
          {scenarios.length < 2 && (
            <div className="mb-4 p-4 bg-amber-50 rounded-2xl border border-amber-200 text-sm text-amber-800 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
              <span>Select at least 2 scenarios to view relative savings and side-by-side differentials.</span>
            </div>
          )}

          {scenarios.length >= 2 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                    <span>Side-by-Side Liability Bar Chart</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Choose any two saved scenarios below to compare their tax liabilities visually.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-xs bg-slate-800 inline-block" />
                    <select
                      value={scenarioLeft.id}
                      onChange={(e) => setSelectedLeftId(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-800"
                    >
                      {scenarios.map((sc) => (
                        <option key={sc.id} value={sc.id}>
                          Scenario A: {sc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="text-xs font-bold text-slate-400">vs</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block" />
                    <select
                      value={scenarioRight.id}
                      onChange={(e) => setSelectedRightId(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-emerald-300 bg-white text-xs font-bold text-emerald-900"
                    >
                      {scenarios.map((sc) => (
                        <option key={sc.id} value={sc.id}>
                          Scenario B: {sc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="h-[260px] w-full bg-white rounded-xl border border-slate-200/80 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="metric" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={(val: number) => (val >= 100000 ? `${(val / 100000).toFixed(1)}L` : `${(val / 1000).toFixed(0)}k`)}
                    />
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        `BDT ${Number(val || 0).toLocaleString()}`,
                        name === 'scenarioA' ? scenarioLeft.name : scenarioRight.name
                      ]}
                      contentStyle={{ borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                      formatter={(val: string) => (val === 'scenarioA' ? scenarioLeft.name : scenarioRight.name)}
                    />
                    <Bar dataKey="scenarioA" name="scenarioA" fill="#1e293b" radius={[4, 4, 0, 0]} maxBarSize={44} />
                    <Bar dataKey="scenarioB" name="scenarioB" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={44} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="min-w-[640px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-48 bg-slate-50/50 rounded-l-xl">
                    Metrics & Parameters
                  </th>
                  {scenarios.map((sc, idx) => (
                    <th key={sc.id} className="py-4 px-4 text-left align-top">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block mb-1">
                            {idx === 0 ? 'Baseline Scenario' : `Scenario #${idx + 1}`}
                          </span>
                          <h3 className="text-base font-bold text-slate-900 leading-tight">{sc.name}</h3>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {new Date(sc.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            id={`load-scenario-table-btn-${sc.id}`}
                            onClick={() => onLoadScenario(sc)}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors text-center"
                          >
                            Load
                          </button>
                          {onShareScenario && (
                            <button
                              id={`share-scenario-table-btn-${sc.id}`}
                              onClick={() => onShareScenario(sc)}
                              className="inline-flex items-center justify-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 border border-slate-200 rounded-lg transition-colors text-center"
                              title="Share deep link or email"
                            >
                              <Share2 className="w-3 h-3 text-emerald-600" />
                              <span>Share</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                
                {/* Inputs Section */}
                <tr className="bg-slate-50/80">
                  <td colSpan={scenarios.length + 1} className="py-2.5 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Profile & Inputs
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-slate-600">Taxpayer Profile</td>
                  {scenarios.map((sc) => (
                    <td key={sc.id} className="py-3 px-4 text-slate-900">
                      <span className="font-semibold">{CATEGORY_LABELS[sc.inputs.category] || sc.inputs.category}</span>
                      {sc.inputs.disabledDependents > 0 && (
                        <span className="block text-xs text-slate-500">
                          +{sc.inputs.disabledDependents} disabled dep.
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-slate-600">Location / Status</td>
                  {scenarios.map((sc) => (
                    <td key={sc.id} className="py-3 px-4 text-slate-800 text-xs">
                      <div>{LOCATION_LABELS[sc.inputs.location] || sc.inputs.location}</div>
                      {sc.inputs.isFirstTimeFiler && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded">
                          First-Time Filer
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-slate-600">Annual Income</td>
                  {scenarios.map((sc) => (
                    <td key={sc.id} className="py-3 px-4 font-bold text-slate-900">
                      {parseInt(sc.inputs.income || '0', 10).toLocaleString()} BDT
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-slate-600">Eligible Investment</td>
                  {scenarios.map((sc) => (
                    <td key={sc.id} className="py-3 px-4 text-slate-900 font-medium">
                      {parseInt(sc.inputs.investment || '0', 10).toLocaleString()} BDT
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-slate-600">TDS Pre-Deducted</td>
                  {scenarios.map((sc) => (
                    <td key={sc.id} className="py-3 px-4 text-slate-700">
                      {parseInt(sc.inputs.tds || '0', 10).toLocaleString()} BDT
                    </td>
                  ))}
                </tr>

                {/* Computations Section */}
                <tr className="bg-slate-50/80">
                  <td colSpan={scenarios.length + 1} className="py-2.5 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Tax Computation & Reliefs
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-slate-600">Tax-Free Threshold</td>
                  {scenarios.map((sc) => (
                    <td key={sc.id} className="py-3 px-4 text-slate-900">
                      {sc.results.totalLimit.toLocaleString()} BDT
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-slate-600">Taxable Income</td>
                  {scenarios.map((sc) => (
                    <td key={sc.id} className="py-3 px-4 font-semibold text-slate-900">
                      {sc.results.taxableIncome.toLocaleString()} BDT
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-slate-600">Gross Slab Tax</td>
                  {scenarios.map((sc) => (
                    <td key={sc.id} className="py-3 px-4 text-slate-800">
                      {sc.results.grossTax.toLocaleString()} BDT
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-slate-600">Investment Rebate</td>
                  {scenarios.map((sc) => (
                    <td key={sc.id} className="py-3 px-4 font-semibold text-emerald-600">
                      - {sc.results.rebate.toLocaleString()} BDT
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-slate-600">Mandatory Min. Tax</td>
                  {scenarios.map((sc) => (
                    <td key={sc.id} className="py-3 px-4 text-slate-700">
                      {sc.results.minimumTax.toLocaleString()} BDT
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 px-4 font-medium text-slate-600">Cliff Status</td>
                  {scenarios.map((sc) => {
                    const isCliff = sc.results.taxableIncome > 0 && sc.results.finalLiability === sc.results.minimumTax;
                    return (
                      <td key={sc.id} className="py-3 px-4">
                        {isCliff ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                            <ShieldAlert className="w-3.5 h-3.5" /> Min Tax Applied
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Normal Slab
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Final Liabilities */}
                <tr className="bg-slate-50/80">
                  <td colSpan={scenarios.length + 1} className="py-2.5 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Liability & Variance
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-bold text-slate-800">Final Tax Liability</td>
                  {scenarios.map((sc) => (
                    <td key={sc.id} className="py-3 px-4 font-bold text-slate-900 text-base">
                      {sc.results.finalLiability.toLocaleString()} BDT
                    </td>
                  ))}
                </tr>

                <tr className="bg-emerald-50/40">
                  <td className="py-4 px-4 font-bold text-emerald-950">Net Payable / (Refund)</td>
                  {scenarios.map((sc) => (
                    <td key={sc.id} className="py-4 px-4">
                      <div className="font-black text-lg text-emerald-800">
                        {sc.results.netPayable < 0
                          ? `(${Math.abs(sc.results.netPayable).toLocaleString()}) Refund`
                          : `${sc.results.netPayable.toLocaleString()} BDT`}
                      </div>
                    </td>
                  ))}
                </tr>

                {scenarios.length > 1 && (
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-600">Savings vs Baseline</td>
                    {scenarios.map((sc, idx) => {
                      if (idx === 0) {
                        return (
                          <td key={sc.id} className="py-3 px-4 text-xs text-slate-400 font-medium">
                            <span className="inline-flex items-center gap-1">
                              <Minus className="w-3.5 h-3.5" /> Baseline Reference
                            </span>
                          </td>
                        );
                      }
                      const diff = baseline.results.finalLiability - sc.results.finalLiability;
                      if (diff > 0) {
                        return (
                          <td key={sc.id} className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-sm">
                              <ArrowDownRight className="w-4 h-4" /> Save {diff.toLocaleString()} BDT
                            </span>
                          </td>
                        );
                      } else if (diff < 0) {
                        return (
                          <td key={sc.id} className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-sm">
                              <ArrowUpRight className="w-4 h-4" /> +{Math.abs(diff).toLocaleString()} BDT more
                            </span>
                          </td>
                        );
                      }
                      return (
                        <td key={sc.id} className="py-3 px-4 text-xs text-slate-500 font-medium">
                          Identical Tax
                        </td>
                      );
                    })}
                  </tr>
                )}

              </tbody>
            </table>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
          <button
            id="comparison-done-btn"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
