import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Building2, 
  CalendarClock, 
  Receipt, 
  ExternalLink, 
  Calendar,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Info,
  DollarSign,
  ShieldCheck,
  FileText,
  Layers,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LegalTooltip } from './LegalTooltip';
import { buildAppointmentUrl } from '../utils/appointmentRedirect';

export function RJSCFeeEstimator() {
  // Calculator mode: 'incorporation' | 'returns'
  const [calcMode, setCalcMode] = useState<'incorporation' | 'returns'>('incorporation');

  // Form states
  const [businessType, setBusinessType] = useState<string>('company');
  const [entityType, setEntityType] = useState<string>('pvt');
  const [authorisedCapital, setAuthorisedCapital] = useState<number>(1000000); // 10 Lakh BDT default
  const [mortgageAmount, setMortgageAmount] = useState<number>(500000); // 5 Lakh BDT default
  const [filingPeriod, setFilingPeriod] = useState<string>('on-time');
  const [includeNameClearance, setIncludeNameClearance] = useState<boolean>(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showStepGuide, setShowStepGuide] = useState<boolean>(true);

  // RJSC Official Capital Fee Breakdown Calculation Function
  const capitalFeeDetails = useMemo(() => {
    if (calcMode !== 'incorporation') return { totalCapFee: 0, breakdown: [] };

    const cap = Math.max(0, Number(authorisedCapital) || 0);
    let capFee = 0;
    const breakdown: { tier: string; rate: string; amount: number }[] = [];

    if (cap <= 0) return { totalCapFee: 0, breakdown: [] };

    // Band 1: Up to ৳20,000
    const b1 = Math.min(cap, 20000);
    if (b1 > 0) {
      const fee1 = 360;
      capFee += fee1;
      breakdown.push({
        tier: 'First ৳20,000',
        rate: 'Flat ৳360',
        amount: fee1
      });
    }

    // Band 2: Above ৳20,000 to ৳50,000 (Additional ৳180 per ৳10,000 or part)
    if (cap > 20000) {
      const b2Amt = Math.min(cap - 20000, 30000); // max 30k
      const b2Units = Math.ceil(b2Amt / 10000);
      const fee2 = b2Units * 180;
      capFee += fee2;
      breakdown.push({
        tier: '৳20,001 – ৳50,000',
        rate: `৳180 per ৳10k (${b2Units} unit${b2Units > 1 ? 's' : ''})`,
        amount: fee2
      });
    }

    // Band 3: Above ৳50,000 to ৳10,00,000 (10 Lakh) (Additional ৳45 per ৳10,000 or part)
    if (cap > 50000) {
      const b3Amt = Math.min(cap - 50000, 950000); // max 9.5 Lakh
      const b3Units = Math.ceil(b3Amt / 10000);
      const fee3 = b3Units * 45;
      capFee += fee3;
      breakdown.push({
        tier: '৳50,001 – ৳10 Lakh',
        rate: `৳45 per ৳10k (${b3Units} unit${b3Units > 1 ? 's' : ''})`,
        amount: fee3
      });
    }

    // Band 4: Above ৳10 Lakh to ৳50 Lakh (Additional ৳24 per ৳10,000 or part)
    if (cap > 1000000) {
      const b4Amt = Math.min(cap - 1000000, 4000000); // max 40 Lakh
      const b4Units = Math.ceil(b4Amt / 10000);
      const fee4 = b4Units * 24;
      capFee += fee4;
      breakdown.push({
        tier: '৳10 Lakh – ৳50 Lakh',
        rate: `৳24 per ৳10k (${b4Units} unit${b4Units > 1 ? 's' : ''})`,
        amount: fee4
      });
    }

    // Band 5: Above ৳50 Lakh (Additional ৳45 per ৳1 Lakh or part)
    if (cap > 5000000) {
      const b5Amt = cap - 5000000;
      const b5Units = Math.ceil(b5Amt / 100000);
      const fee5 = b5Units * 45;
      capFee += fee5;
      breakdown.push({
        tier: 'Above ৳50 Lakh',
        rate: `৳45 per ৳1 Lakh (${b5Units} unit${b5Units > 1 ? 's' : ''})`,
        amount: fee5
      });
    }

    return { totalCapFee: capFee, breakdown };
  }, [authorisedCapital, calcMode]);

  // Stamp Duty Calculation
  const stampDutyAoA = useMemo(() => {
    if (calcMode !== 'incorporation') return 0;
    const cap = Math.max(0, Number(authorisedCapital) || 0);
    if (cap <= 4000000) return 10000; // Up to 40 Lakh -> 10,000 BDT
    if (cap <= 120000000) return 30000; // Above 40 Lakh to 12 Crore -> 30,000 BDT
    return 50000; // Above 12 Crore -> 50,000 BDT
  }, [authorisedCapital, calcMode]);

  // Combined Breakdown
  const totalBreakdown = useMemo(() => {
    if (calcMode === 'incorporation') {
      const nameClearance = includeNameClearance ? 500 : 0;
      const moaStamp = entityType === 'pvt' || entityType === 'plc' ? 2000 : 1000;
      const aoaStamp = entityType === 'pvt' || entityType === 'plc' ? stampDutyAoA : 0;
      const filingFee6Docs = 1200; // 6 mandatory statutory incorporation forms
      const capitalRegistrationFee = capitalFeeDetails.totalCapFee;
      const digitalCertificate = 1000;

      const subtotal = nameClearance + moaStamp + aoaStamp + filingFee6Docs + capitalRegistrationFee + digitalCertificate;
      const vatEstimated = Math.round(subtotal * 0.15); // 15% VAT on government services where applicable
      const totalEstimated = subtotal + vatEstimated;

      return {
        items: [
          { name: 'Name Clearance Application Fee', amount: nameClearance, note: '৳500 per proposed name search' },
          { name: 'Memorandum of Association (MoA) Stamp Duty', amount: moaStamp, note: 'Statutory non-judicial stamp' },
          { name: 'Articles of Association (AoA) Stamp Duty', amount: aoaStamp, note: `Based on ৳${(authorisedCapital / 100000).toFixed(1)} Lakh capital` },
          { name: 'Filing Fee (6 Incorporation Documents)', amount: filingFee6Docs, note: 'Form I, VI, IX, X, XII & Constitutional docs' },
          { name: 'Authorised Capital Registration Fee', amount: capitalRegistrationFee, note: 'Cumulative band rate per ৳10k/1 Lakh' },
          { name: 'Digital Certificate & Portal Service Charge', amount: digitalCertificate, note: 'RJSC digital token & processing fee' },
        ],
        subtotal,
        vatEstimated,
        totalEstimated
      };
    } else {
      // Annual Returns & Mortgage Filings Mode
      let baseFee = 800; // Schedule X + Audited Accounts
      let mortgageFee = 0;
      let lateFee = 0;

      if (entityType === 'plc') baseFee = 1200;
      if (entityType === 'partnership' || entityType === 'society') baseFee = 400;

      if (mortgageAmount > 0) {
        mortgageFee = Math.min(20000, Math.max(500, Math.round(mortgageAmount * 0.001))); // 0.1% max 20k
      }

      switch (filingPeriod) {
        case 'on-time': lateFee = 0; break;
        case 'late-30': lateFee = 1000; break;
        case 'late-90': lateFee = 2000; break;
        case 'late-90-plus': lateFee = 5000; break;
      }

      const subtotal = baseFee + mortgageFee + lateFee;
      const vatEstimated = Math.round(subtotal * 0.15);
      const totalEstimated = subtotal + vatEstimated;

      return {
        items: [
          { name: 'Statutory Annual Return Base Filing Fee', amount: baseFee, note: 'Schedule X & Balance Sheet filing' },
          { name: 'Mortgage / Charge Registration Charge', amount: mortgageFee, note: mortgageAmount > 0 ? `0.1% on ৳${mortgageAmount.toLocaleString()}` : 'N/A' },
          { name: 'Compounding Late Filing Penalty', amount: lateFee, note: filingPeriod === 'on-time' ? 'On-time submission' : 'Imposed for delayed AGM return' },
        ],
        subtotal,
        vatEstimated,
        totalEstimated
      };
    }
  }, [calcMode, includeNameClearance, entityType, stampDutyAoA, capitalFeeDetails, authorisedCapital, mortgageAmount, filingPeriod]);

  const handleSimulateCalculation = () => {
    setIsCalculating(true);
    setTimeout(() => {
      setIsCalculating(false);
    }, 400);
  };

  return (
    <div id="rjsc-fee-calculator" className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 text-white p-3.5 rounded-2xl shadow-md shrink-0">
            <Calculator className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-900">RJSC Official Fee & Incorporation Calculator</h2>
              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Live 2026 Band Schedule
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-0.5">
              Official Government Fee Estimator according to the Registrar of Joint Stock Companies & Firms (RJSC) portal rules.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowStepGuide(!showStepGuide)}
          className="inline-flex items-center gap-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl transition-colors shrink-0"
        >
          <HelpCircle className="w-4 h-4 text-indigo-600" />
          <span>{showStepGuide ? 'Hide Official Step Guide' : 'Show How to Use Guide'}</span>
        </button>
      </div>

      {/* Official 5-Step Guide Accordion */}
      <AnimatePresence>
        {showStepGuide && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-50 border border-slate-200 rounded-2xl p-5 md:p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-600" />
                Official RJSC Help Guide: How to Calculate Fees
              </h3>
              <a
                href="https://app.roc.gov.bd/psp/fee_calculator"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>Live RJSC Fee Calculator</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs text-slate-700">
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
                <span className="font-bold text-indigo-600 block">Step 1 — Service Mode</span>
                <p className="text-slate-600 leading-snug">Select Company Incorporation (New) or Statutory Annual Returns / Mortgage Charges.</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
                <span className="font-bold text-indigo-600 block">Step 2 — Business Type</span>
                <p className="text-slate-600 leading-snug">Choose Company, Partnership Firm, Society, or Trade Union from dropdown.</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
                <span className="font-bold text-indigo-600 block">Step 3 — Entity Structure</span>
                <p className="text-slate-600 leading-snug">Select Private Limited, Public Limited, or Foreign Company Branch.</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
                <span className="font-bold text-indigo-600 block">Step 4 — Enter Amounts</span>
                <p className="text-slate-600 leading-snug">Enter proposed Authorised Capital or Mortgage Charge Amount in BDT (৳).</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
                <span className="font-bold text-indigo-600 block">Step 5 — Calculate & Review</span>
                <p className="text-slate-600 leading-snug">Review statutory stamp duty, capital tier breakdown, and digital invoice total.</p>
              </div>
            </div>
            
            <p className="text-[11px] text-slate-500 italic">
              Note: The displayed result is treated as the official statutory fee estimate prior to live submission on the ROC App portal.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mode Selector Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setCalcMode('incorporation')}
          className={`flex-1 py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-2 ${
            calcMode === 'incorporation'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>New Company Incorporation Fee</span>
        </button>

        <button
          type="button"
          onClick={() => setCalcMode('returns')}
          className={`flex-1 py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-2 ${
            calcMode === 'returns'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Annual Returns & Mortgage Charges</span>
        </button>
      </div>

      {/* Input Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Step 2: Business Type */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-600" />
            <LegalTooltip term="Business Type" definition="The high-level entity classification under Bangladeshi law (Company, Partnership, Society, or Foreign Office).">
              Step 2 — Business Type
            </LegalTooltip>
          </label>
          <select
            value={businessType}
            onChange={(e) => {
              setBusinessType(e.target.value);
              if (e.target.value === 'partnership') setEntityType('partnership');
              else if (e.target.value === 'society') setEntityType('society');
              else setEntityType('pvt');
            }}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="company">Company (Private / Public Limited)</option>
            <option value="partnership">Partnership Firm (Partnership Act 1932)</option>
            <option value="society">Society / Association (Societies Act 1860)</option>
            <option value="foreign">Foreign Branch / Liaison Office</option>
          </select>
        </div>

        {/* Step 3: Entity Type */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <LegalTooltip term="Entity Type" definition="The specific corporate structure registered with the Office of the Registrar of Joint Stock Companies and Firms.">
              Step 3 — Entity Structure
            </LegalTooltip>
          </label>
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="pvt">Private Limited Company</option>
            <option value="plc">Public Limited Company</option>
            <option value="partnership">Partnership Firm</option>
            <option value="society">Society / Trade Union / Foundation</option>
          </select>
        </div>

        {/* Step 4: Amount Input */}
        {calcMode === 'incorporation' ? (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-indigo-600" />
              <LegalTooltip term="Authorised Capital" definition="The maximum value of share capital that the company is legally authorized to issue according to its Memorandum of Association.">
                Step 4 — Authorised Capital (৳ BDT)
              </LegalTooltip>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">৳</span>
              <input
                type="number"
                inputMode="numeric"
                min="10000"
                step="100000"
                value={authorisedCapital}
                onChange={(e) => setAuthorisedCapital(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {[500000, 1000000, 5000000, 10000000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAuthorisedCapital(preset)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
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
        ) : (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-indigo-600" />
              <LegalTooltip term="Mortgage Amount" definition="The total secured loan or bank facility amount for registering mortgage or charge returns with RJSC.">
                Step 4 — Mortgage Amount (৳ BDT)
              </LegalTooltip>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">৳</span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                step="100000"
                value={mortgageAmount}
                onChange={(e) => setMortgageAmount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>
        )}
      </div>

      {/* Secondary Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/60">
        {calcMode === 'incorporation' ? (
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="name-clearance-chk"
              checked={includeNameClearance}
              onChange={(e) => setIncludeNameClearance(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="name-clearance-chk" className="text-xs font-bold text-slate-800 cursor-pointer">
              Include Name Clearance Application Fee (৳500 per proposed name)
            </label>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <CalendarClock className="w-4 h-4 text-indigo-600" />
              Filing Deadline / Delayed Penalty
            </label>
            <select
              value={filingPeriod}
              onChange={(e) => setFilingPeriod(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            >
              <option value="on-time">On-time (Within 30 days of AGM)</option>
              <option value="late-30">Late Submission (1 – 30 days delay)</option>
              <option value="late-90">Late Submission (31 – 90 days delay)</option>
              <option value="late-90-plus">Late Submission (&gt; 90 days delay)</option>
            </select>
          </div>
        )}

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={handleSimulateCalculation}
            disabled={isCalculating}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            {isCalculating ? (
              <span>Recalculating...</span>
            ) : (
              <>
                <span>Recalculate Breakdown</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Step 5: Calculation Breakdown & Review */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-600" />
            Step 5 — Calculated RJSC Statutory Breakdown
          </h3>
          <span className="text-xs text-slate-500 font-semibold">
            Entity: <strong className="text-slate-900 uppercase">{entityType}</strong>
          </span>
        </div>

        {/* Breakdown Items Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 uppercase font-extrabold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Fee Component</th>
                <th className="py-3 px-4">Particulars / Basis</th>
                <th className="py-3 px-4 text-right">Statutory Fee (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-800">
              {totalBreakdown.items.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{item.name}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 italic">{item.note}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    ৳ {item.amount.toLocaleString()}
                  </td>
                </tr>
              ))}

              {/* Subtotal */}
              <tr className="bg-slate-50 font-bold">
                <td colSpan={2} className="py-3 px-4 text-slate-700 text-right uppercase">Statutory Subtotal</td>
                <td className="py-3 px-4 text-right text-slate-900">৳ {totalBreakdown.subtotal.toLocaleString()}</td>
              </tr>

              {/* VAT */}
              <tr className="bg-slate-50 font-semibold text-slate-600">
                <td colSpan={2} className="py-2.5 px-4 text-right">Estimated Govt. VAT (15%)</td>
                <td className="py-2.5 px-4 text-right">৳ {totalBreakdown.vatEstimated.toLocaleString()}</td>
              </tr>

              {/* Grand Total */}
              <tr className="bg-indigo-900 text-white font-black text-sm">
                <td colSpan={2} className="py-4 px-4 text-right uppercase tracking-wider">
                  Total Estimated RJSC Government Fee
                </td>
                <td className="py-4 px-4 text-right text-emerald-300 font-mono text-base">
                  ৳ {totalBreakdown.totalEstimated.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Capital Band Detailed Breakdown for Incorporation */}
        {calcMode === 'incorporation' && capitalFeeDetails.breakdown.length > 0 && (
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 space-y-2">
            <h4 className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-700" />
              Cumulative Capital Registration Fee Bands Detail (Authorised Capital: ৳{authorisedCapital.toLocaleString()})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
              {capitalFeeDetails.breakdown.map((b, idx) => (
                <div key={idx} className="bg-white p-2.5 rounded-xl border border-indigo-100/80 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">{b.tier}</span>
                    <span className="text-[10px] text-slate-500 block">{b.rate}</span>
                  </div>
                  <span className="font-extrabold text-indigo-800 font-mono">৳{b.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action & Consultation Link */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 text-white rounded-2xl p-5 shadow-sm">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Ready for Turnkey Company Incorporation or Statutory Filing?
            </h4>
            <p className="text-xs text-slate-300">
              Our RJSC corporate barristers and chartered advisors prepare your MoA/AoA, handle name clearance, and submit filings directly to the RJSC ROC portal.
            </p>
          </div>

          <a
            href={buildAppointmentUrl({
              service: calcMode === 'incorporation' ? 'RJSC Company Incorporation' : 'RJSC Annual Compliance & Returns',
              notes: `Business: ${businessType}, Entity: ${entityType}, ${calcMode === 'incorporation' ? `Capital: ৳${authorisedCapital}` : `Mortgage: ৳${mortgageAmount}`}, Total Govt Fee Est: ৳${totalBreakdown.totalEstimated}`,
              source: 'RJSC Fee Calculator'
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs transition-all shrink-0 cursor-pointer shadow-sm"
          >
            <Calendar className="w-4 h-4" />
            <span>Consult Lawyer for RJSC Filing</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
