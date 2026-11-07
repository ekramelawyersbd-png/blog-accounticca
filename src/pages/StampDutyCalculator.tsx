import React, { useState, useMemo } from 'react';
import { ToolAccessGuard } from '../components/auth/ToolAccessGuard';
import { Scale, RefreshCw } from 'lucide-react';
import { CalculationEmailActionBarButton } from '../components/tools/CalculationEmailActionBarButton';

export const StampDutyCalculator: React.FC = () => {
  const [deedValue, setDeedValue] = useState<number>(5000000); // 50 Lakh
  const [propertyLocation, setPropertyLocation] = useState<'dhaka_ctg_city' | 'other_city' | 'cantonment' | 'upazila'>('dhaka_ctg_city');

  // Rates in Bangladesh for Sale Deed (Kabala):
  // 1. Stamp Duty: 1.5% of deed value
  // 2. Registration Fee: 1% of deed value (minimum Tk 100)
  // 3. Local Government Tax (LGT): 2% (city corp/cantonment) or 3% (upazila)
  // 4. Source Tax (AIT Section 125 of Income Tax Act 2023): Depends on area (approx 4-8% or per katha in commercial areas)
  const stampDutyRate = 0.015;
  const registrationFeeRate = 0.01;
  const lgtRate = propertyLocation === 'upazila' ? 0.03 : 0.02;
  const aitRate = propertyLocation === 'dhaka_ctg_city' ? 0.08 : 0.04;

  const stampDuty = deedValue * stampDutyRate;
  const registrationFee = Math.max(100, deedValue * registrationFeeRate);
  const lgt = deedValue * lgtRate;
  const ait = deedValue * aitRate;
  const totalGovtCost = stampDuty + registrationFee + lgt + ait;

  const calculationSnapshot = useMemo(() => ({
    referenceId: `DEED-${Date.now().toString().slice(-6)}`,
    generatedAt: new Date().toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' }),
    toolId: 'stamp-duty',
    toolName: 'Land & Property Deed Stamp Duty & Registration Cost Calculator',
    toolCategory: 'Property & Deed Registration',
    toolPath: '/tools/stamp-duty',
    statutoryBasis: 'The Stamp Act 1899 & The Registration Act 1908 · AIT Sec 125 ITA 2023',
    summaryMetrics: [
      { label: 'Deed / Mouza Value', value: `৳${deedValue.toLocaleString()}` },
      { label: 'Stamp Duty (1.5%)', value: `৳${Math.round(stampDuty).toLocaleString()}` },
      { label: 'Sub-Registry Fee (1%)', value: `৳${Math.round(registrationFee).toLocaleString()}` },
      { label: 'Total Statutory Cost', value: `৳${Math.round(totalGovtCost).toLocaleString()}` },
    ],
    inputs: [
      { label: 'Deed Property Value', value: `৳${deedValue.toLocaleString()}` },
      { label: 'Property Location', value: propertyLocation === 'dhaka_ctg_city' ? 'Dhaka / Chattogram City Corp' : propertyLocation === 'other_city' ? 'Other City Corporation' : propertyLocation === 'cantonment' ? 'Cantonment Board' : 'Upazila / Rural Municipality' },
      { label: 'Statutory Stamp Duty Rate', value: '1.5% of deed value' },
      { label: 'Sub-Registry Fee Rate', value: '1% of deed value (Min Tk 100)' },
    ],
    tables: [
      {
        title: 'Statutory Land / Flat Registration Cost Breakdown',
        headers: ['Head of Account / Tax', 'Statutory Rate / Legal Provision', 'Government Fee (BDT)'],
        rows: [
          { cells: ['Non-Judicial Stamp Duty', '1.5% (The Stamp Act 1899)', `৳${Math.round(stampDuty).toLocaleString()}`] },
          { cells: ['Registration Fee', '1% (The Registration Act 1908)', `৳${Math.round(registrationFee).toLocaleString()}`] },
          { cells: ['Local Government Tax (LGT)', `${(lgtRate * 100).toFixed(1)}% (City Corp / Upazila Ordinance)`, `৳${Math.round(lgt).toLocaleString()}`] },
          { cells: ['Advance Income Tax (AIT)', `${(aitRate * 100).toFixed(1)}% (Income Tax Act 2023 Sec 125)`, `৳${Math.round(ait).toLocaleString()}`] },
          { cells: ['Total Government Fee Payable', 'Sum of all statutory charges', `৳${Math.round(totalGovtCost).toLocaleString()}`] },
        ],
      },
    ],
    legalNotes: [
      'The Stamp Act 1899 (Act II of 1899) as amended by Finance Acts.',
      'The Registration Act 1908 (Act XVI of 1908) Schedule of Fees.',
      'Income Tax Act 2023, Section 125 (Tax on Transfer of Property / AIT).',
      'Local Government (City Corporation / Pourashava / Union Parishad) Tax on transfer of immovable property.',
    ],
  }), [deedValue, propertyLocation, stampDuty, registrationFee, lgt, ait, totalGovtCost, lgtRate, aitRate]);

  return (
    <ToolAccessGuard
      toolId="stamp-duty"
      toolName="Land &amp; Property Stamp Duty Calculator"
      toolCategory="Property &amp; Deed Registration"
      toolPath="/tools/stamp-duty"
    >
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full border border-amber-300">
              Registration Act 1908 &amp; Stamp Act 1899
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-2">
              Bangladesh Land &amp; Flat Deed Registration Cost Calculator
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Computes statutory Stamp Duty (1.5%), Sub-Registry Fee (1%), Local Govt Tax, and Advance Income Tax (AIT Sec 125).
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setDeedValue(5000000)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset
            </button>
            <CalculationEmailActionBarButton
              options={{
                toolId: 'stamp-duty',
                toolName: 'Land & Property Deed Registration Calculator',
                toolCategory: 'Property & Deed Registration',
                toolPath: '/tools/stamp-duty',
                statutoryBasis: 'Registration Act 1908 & Stamp Act 1899',
                customSnapshot: calculationSnapshot,
              }}
              label="Send Calculation Report"
              variant="primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
              Deed Property Valuation
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Total Deed Value / Mouza Value (BDT)
              </label>
              <input
                type="number"
                value={deedValue || ''}
                onChange={e => setDeedValue(Number(e.target.value) || 0)}
                aria-label="Total Deed Value BDT"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-black font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Property Jurisdiction
              </label>
              <select
                value={propertyLocation}
                onChange={e => setPropertyLocation(e.target.value as any)}
                aria-label="Property Jurisdiction"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
              >
                <option value="dhaka_ctg_city">Dhaka &amp; Chittagong City Corporation Areas</option>
                <option value="other_city">Gazipur, Narayanganj &amp; Other City Corporations</option>
                <option value="cantonment">Cantonment Board Areas</option>
                <option value="upazila">Upazila / Union Parishad Rural Areas</option>
              </select>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-100 border-b border-slate-200">
              <h3 className="text-sm font-black text-black">Statutory Registration Breakdown (At A Glance)</h3>
              <p className="text-xs text-slate-600">Fixed rate statutory registry fee schedule.</p>
            </div>

            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className="bg-slate-200 border-b border-slate-300 text-xs font-black uppercase text-black">
                  <th className="py-3 px-4 text-black font-black">Fee Category</th>
                  <th className="py-3 px-4 text-black font-black text-right">Rate</th>
                  <th className="py-3 px-4 text-black font-black text-right">Amount (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs text-black">
                <tr>
                  <td className="py-2.5 px-4 font-bold text-black">Non-Judicial Stamp Duty</td>
                  <td className="py-2.5 px-4 text-right text-black font-mono">1.5%</td>
                  <td className="py-2.5 px-4 text-right text-black font-black font-mono">
                    ৳ {Math.round(stampDuty).toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-black">Sub-Registry Registration Fee</td>
                  <td className="py-2.5 px-4 text-right text-black font-mono">1.0%</td>
                  <td className="py-2.5 px-4 text-right text-black font-black font-mono">
                    ৳ {Math.round(registrationFee).toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-black">Local Government Tax (LGT)</td>
                  <td className="py-2.5 px-4 text-right text-black font-mono">{(lgtRate * 100).toFixed(1)}%</td>
                  <td className="py-2.5 px-4 text-right text-black font-black font-mono">
                    ৳ {Math.round(lgt).toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-black">Advance Income Tax (Sec 125, NBR)</td>
                  <td className="py-2.5 px-4 text-right text-black font-mono">{(aitRate * 100).toFixed(1)}%</td>
                  <td className="py-2.5 px-4 text-right text-black font-black font-mono">
                    ৳ {Math.round(ait).toLocaleString()}
                  </td>
                </tr>
                <tr className="bg-amber-100 font-extrabold border-t-2 border-amber-300">
                  <td className="py-3 px-4 font-black text-sm text-black">Total Statutory Registry Fees:</td>
                  <td className="py-3 px-4 text-right text-black font-mono">{((totalGovtCost / deedValue) * 100).toFixed(1)}%</td>
                  <td className="py-3 px-4 text-right text-black font-black text-base font-mono">
                    ৳ {Math.round(totalGovtCost).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-black font-bold">
              • In addition, stationary / E-fee (Tk. 100) and N-fee per 300 words are payable at the sub-registry counter.
            </div>
          </div>
        </div>
      </div>
    </ToolAccessGuard>
  );
};
