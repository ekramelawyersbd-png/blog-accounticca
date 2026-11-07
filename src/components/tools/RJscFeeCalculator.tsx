import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Building2, 
  Receipt, 
  CheckCircle2, 
  Info, 
  DollarSign, 
  ArrowRight,
  ShieldCheck,
  Calendar,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { buildAppointmentUrl } from '../../utils/appointmentRedirect';

export interface RJscFeeBreakdown {
  nameClearance: number;
  documentFiling: number;
  moaStamp: number;
  aoaStamp: number;
  capitalFee: number;
  subtotal: number;
  vat: number;
  total: number;
  capitalBandBreakdown: { tier: string; rate: string; amount: number }[];
}

export function RJscFeeCalculator() {
  const [entityType, setEntityType] = useState<string>('pvt');
  const [authorisedCapital, setAuthorisedCapital] = useState<number>(1000000); // Default 10 Lakh BDT
  const [includeNameClearance, setIncludeNameClearance] = useState<boolean>(true);
  const [showGuide, setShowGuide] = useState<boolean>(false);

  // Exact statutory RJSC fee calculation logic
  const feeCalculation = useMemo<RJscFeeBreakdown>(() => {
    const cap = Math.max(0, Number(authorisedCapital) || 0);

    // 1. Name Clearance Fee
    const nameClearance = includeNameClearance ? 500 : 0;

    // 2. Document Filing Fee (6 statutory incorporation forms)
    const documentFiling = 1200;

    // 3. MoA Stamp Duty
    const moaStamp = (entityType === 'pvt' || entityType === 'plc') ? 2000 : 1000;

    // 4. AoA Stamp Duty based on Authorised Capital brackets
    let aoaStamp = 0;
    if (entityType === 'pvt' || entityType === 'plc') {
      if (cap <= 4000000) {
        aoaStamp = 10000; // Up to 40 Lakh -> 10,000 BDT
      } else if (cap <= 120000000) {
        aoaStamp = 30000; // Above 40 Lakh to 12 Crore -> 30,000 BDT
      } else {
        aoaStamp = 50000; // Above 12 Crore -> 50,000 BDT
      }
    }

    // 5. Bracketed Capital-Based Registration Fees (Cumulative)
    let capitalFee = 0;
    const capitalBandBreakdown: { tier: string; rate: string; amount: number }[] = [];

    if (cap > 0) {
      // Band 1: Up to ৳20,000 -> ৳360
      const b1 = Math.min(cap, 20000);
      if (b1 > 0) {
        const fee1 = 360;
        capitalFee += fee1;
        capitalBandBreakdown.push({
          tier: 'Up to ৳20,000',
          rate: 'Flat ৳360',
          amount: fee1,
        });
      }

      // Band 2: Above ৳20,000 to ৳50,000 -> Additional ৳180 per ৳10,000 or part
      if (cap > 20000) {
        const b2Amt = Math.min(cap - 20000, 30000);
        const b2Units = Math.ceil(b2Amt / 10000);
        const fee2 = b2Units * 180;
        capitalFee += fee2;
        capitalBandBreakdown.push({
          tier: '৳20,001 – ৳50,000',
          rate: `৳180 per ৳10,000 (${b2Units} unit${b2Units > 1 ? 's' : ''})`,
          amount: fee2,
        });
      }

      // Band 3: Above ৳50,000 to ৳10 Lakh -> Additional ৳45 per ৳10,000 or part
      if (cap > 50000) {
        const b3Amt = Math.min(cap - 50000, 950000);
        const b3Units = Math.ceil(b3Amt / 10000);
        const fee3 = b3Units * 45;
        capitalFee += fee3;
        capitalBandBreakdown.push({
          tier: '৳50,001 – ৳10 Lakh',
          rate: `৳45 per ৳10,000 (${b3Units} unit${b3Units > 1 ? 's' : ''})`,
          amount: fee3,
        });
      }

      // Band 4: Above ৳10 Lakh to ৳50 Lakh -> Additional ৳24 per ৳10,000 or part
      if (cap > 1000000) {
        const b4Amt = Math.min(cap - 1000000, 4000000);
        const b4Units = Math.ceil(b4Amt / 10000);
        const fee4 = b4Units * 24;
        capitalFee += fee4;
        capitalBandBreakdown.push({
          tier: '৳10 Lakh – ৳50 Lakh',
          rate: `৳24 per ৳10,000 (${b4Units} unit${b4Units > 1 ? 's' : ''})`,
          amount: fee4,
        });
      }

      // Band 5: Above ৳50 Lakh -> Additional ৳45 per ৳1 Lakh or part
      if (cap > 5000000) {
        const b5Amt = cap - 5000000;
        const b5Units = Math.ceil(b5Amt / 100000);
        const fee5 = b5Units * 45;
        capitalFee += fee5;
        capitalBandBreakdown.push({
          tier: 'Above ৳50 Lakh',
          rate: `৳45 per ৳1 Lakh (${b5Units} unit${b5Units > 1 ? 's' : ''})`,
          amount: fee5,
        });
      }
    }

    const subtotal = nameClearance + documentFiling + moaStamp + aoaStamp + capitalFee;
    const vat = Math.round(subtotal * 0.15); // 15% VAT on government portal processing
    const total = subtotal + vat;

    return {
      nameClearance,
      documentFiling,
      moaStamp,
      aoaStamp,
      capitalFee,
      subtotal,
      vat,
      total,
      capitalBandBreakdown,
    };
  }, [entityType, authorisedCapital, includeNameClearance]);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
      {/* Component Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 text-white p-3.5 rounded-2xl shadow-md shrink-0">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">
                RJSC Business Registration Fee Calculator
              </h2>
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Official 2026 Bands
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Compute company incorporation charges, non-judicial stamp duties, and capital fees under the Companies Act 1994.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl transition-colors cursor-pointer shrink-0"
        >
          <HelpCircle className="w-4 h-4 text-indigo-600" />
          <span>{showGuide ? 'Hide Rules' : 'How Fees Are Calculated'}</span>
        </button>
      </div>

      {/* Guide Card */}
      <AnimatePresence>
        {showGuide && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 sm:p-5 text-xs space-y-2 text-indigo-950"
          >
            <div className="flex items-center gap-2 font-bold text-indigo-900">
              <Info className="w-4 h-4 text-indigo-600" />
              <span>RJSC Statutory Fee Rules Breakdown</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-slate-700">
              <li><strong>Name Clearance:</strong> ৳500 per proposed company name submission.</li>
              <li><strong>Document Filing Fee:</strong> ৳1,200 for submitting 6 statutory incorporation forms.</li>
              <li><strong>MoA Stamp Duty:</strong> ৳2,000 statutory non-judicial stamp.</li>
              <li><strong>AoA Stamp Duty:</strong> ৳10,000 (Up to ৳40 Lakh capital), ৳30,000 (৳40 Lakh to ৳12 Crore), ৳50,000 (&gt; ৳12 Crore).</li>
              <li><strong>Authorised Capital Fee:</strong> Cumulative rates applied across capital bands per ৳10,000 or ৳1 Lakh increment.</li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Inputs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Entity Type Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-indigo-600" />
            Select Entity Type
          </label>
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="pvt">Private Limited Company</option>
            <option value="plc">Public Limited Company</option>
            <option value="partnership">Partnership Firm</option>
            <option value="society">Society / Association / Foundation</option>
          </select>
        </div>

        {/* Authorised Capital Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-indigo-600" />
            Authorised Capital (৳ BDT)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">৳</span>
            <input
              type="number"
              min="10000"
              step="100000"
              value={authorisedCapital}
              onChange={(e) => setAuthorisedCapital(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          {/* Preset Buttons */}
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {[500000, 1000000, 5000000, 10000000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAuthorisedCapital(preset)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                  authorisedCapital === preset
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                ৳{(preset / 100000).toFixed(0)} Lakh
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Name Clearance Checkbox */}
      <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70">
        <input
          type="checkbox"
          id="rjsc-nc-check"
          checked={includeNameClearance}
          onChange={(e) => setIncludeNameClearance(e.target.checked)}
          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
        />
        <label htmlFor="rjsc-nc-check" className="text-xs font-bold text-slate-800 cursor-pointer">
          Include Name Clearance Search & Application Fee (৳500)
        </label>
      </div>

      {/* Calculated Breakdown Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-indigo-600" />
            Statutory RJSC Fee Breakdown
          </h3>
          <span className="text-xs text-slate-500 font-semibold">
            Capital: <strong className="text-slate-900">৳{authorisedCapital.toLocaleString()}</strong>
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 uppercase font-extrabold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Fee Item</th>
                <th className="py-2.5 px-4">Statutory Basis</th>
                <th className="py-2.5 px-4 text-right">Amount (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-800">
              {includeNameClearance && (
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Name Clearance Fee</span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-500">৳500 per proposed name search</td>
                  <td className="py-2.5 px-4 text-right font-bold">৳ {feeCalculation.nameClearance.toLocaleString()}</td>
                </tr>
              )}

              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Document Filing Fee</span>
                </td>
                <td className="py-2.5 px-4 text-slate-500">Fixed ৳1,200 for 6 statutory forms</td>
                <td className="py-2.5 px-4 text-right font-bold">৳ {feeCalculation.documentFiling.toLocaleString()}</td>
              </tr>

              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>MoA Non-Judicial Stamp Duty</span>
                </td>
                <td className="py-2.5 px-4 text-slate-500">Memorandum stamp duty</td>
                <td className="py-2.5 px-4 text-right font-bold">৳ {feeCalculation.moaStamp.toLocaleString()}</td>
              </tr>

              {(entityType === 'pvt' || entityType === 'plc') && (
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>AoA Stamp Duty</span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-500">
                    {authorisedCapital <= 4000000 
                      ? 'Up to ৳40 Lakh (৳10,000)' 
                      : authorisedCapital <= 120000000 
                      ? '৳40 Lakh to ৳12 Crore (৳30,000)' 
                      : 'Above ৳12 Crore (৳50,000)'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold">৳ {feeCalculation.aoaStamp.toLocaleString()}</td>
                </tr>
              )}

              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Authorised Capital Registration Fee</span>
                </td>
                <td className="py-2.5 px-4 text-slate-500">Bracketed cumulative band rates</td>
                <td className="py-2.5 px-4 text-right font-bold text-indigo-700">৳ {feeCalculation.capitalFee.toLocaleString()}</td>
              </tr>

              {/* Subtotal */}
              <tr className="bg-slate-50 font-bold">
                <td colSpan={2} className="py-2.5 px-4 text-slate-700 text-right uppercase">Statutory Subtotal</td>
                <td className="py-2.5 px-4 text-right text-slate-900">৳ {feeCalculation.subtotal.toLocaleString()}</td>
              </tr>

              {/* Estimated VAT */}
              <tr className="bg-slate-50 font-semibold text-slate-600">
                <td colSpan={2} className="py-2 px-4 text-right">Govt. Service VAT (15%)</td>
                <td className="py-2 px-4 text-right">৳ {feeCalculation.vat.toLocaleString()}</td>
              </tr>

              {/* Total */}
              <tr className="bg-indigo-900 text-white font-black text-sm">
                <td colSpan={2} className="py-3 px-4 text-right uppercase tracking-wider">
                  Total Estimated Government Fee
                </td>
                <td className="py-3 px-4 text-right text-emerald-300 font-mono text-base">
                  ৳ {feeCalculation.total.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Capital Band Sub-Breakdown Details */}
      {feeCalculation.capitalBandBreakdown.length > 0 && (
        <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 space-y-2 text-xs">
          <span className="font-extrabold text-indigo-900 uppercase tracking-wider block">
            Capital Fee Tiers Breakdown
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {feeCalculation.capitalBandBreakdown.map((band, idx) => (
              <div key={idx} className="bg-white p-2.5 rounded-xl border border-indigo-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">{band.tier}</span>
                  <span className="text-[10px] text-slate-500 block">{band.rate}</span>
                </div>
                <span className="font-bold text-indigo-800 font-mono">৳{band.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Call to Action */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 text-white rounded-2xl p-4 shadow-sm">
        <div className="space-y-0.5">
          <h4 className="text-xs sm:text-sm font-bold text-emerald-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Turnkey Company Incorporation Service
          </h4>
          <p className="text-[11px] text-slate-300">
            Consult our RJSC corporate advocates to draft MoA/AoA, apply for name clearance, and obtain incorporation certificates.
          </p>
        </div>

        <a
          href={buildAppointmentUrl({
            service: 'RJSC Company Incorporation',
            notes: `Entity: ${entityType}, Authorised Capital: ৳${authorisedCapital}, Total Govt Fee Est: ৳${feeCalculation.total}`,
            source: 'RJscFeeCalculator Component'
          })}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-xl text-xs transition-all shrink-0 cursor-pointer"
        >
          <Calendar className="w-4 h-4" />
          <span>Book RJSC Legal Consultation</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

export default RJscFeeCalculator;
