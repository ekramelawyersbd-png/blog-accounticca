import React, { useState, useMemo } from 'react';
import { ToolAccessGuard } from '../components/auth/ToolAccessGuard';
import { Building2, RefreshCw } from 'lucide-react';
import { CalculationEmailActionBarButton } from '../components/tools/CalculationEmailActionBarButton';
import { ToolSEO } from '../components/SEO';

export const CompanyRegistrationFee: React.FC = () => {
  const [authorizedCapital, setAuthorizedCapital] = useState<number>(1000000); // 10 Lakh
  const [stampDutyMoa, setStampDutyMoa] = useState<number>(1000); // Tk. 1,000 MoA
  const [stampDutyAoa, setStampDutyAoa] = useState<number>(3000); // Tk. 3,000 AoA for up to 10 Lakh, 4000 for 10L to 3Cr

  // RJSC Registration Fee based on Authorized Capital (Schedule II, Companies Act 1994)
  let registrationFee = 0;
  if (authorizedCapital <= 20000) {
    registrationFee = 360;
  } else if (authorizedCapital <= 50000) {
    registrationFee = 360 + ((authorizedCapital - 20000) / 10000) * 180;
  } else if (authorizedCapital <= 1000000) {
    registrationFee = 360 + (30000 / 10000) * 180 + ((authorizedCapital - 50000) / 10000) * 45;
  } else if (authorizedCapital <= 5000000) {
    registrationFee = 360 + (30000 / 10000) * 180 + (950000 / 10000) * 45 + ((authorizedCapital - 1000000) / 10000) * 25;
  } else {
    registrationFee = 360 + (30000 / 10000) * 180 + (950000 / 10000) * 45 + (4000000 / 10000) * 25 + ((authorizedCapital - 5000000) / 10000) * 15;
  }

  // Name Clearance Fee
  const nameClearanceFee = 200;
  // Filing Fees for Forms (Form I, VI, IX, X, XII) = 5 forms * Tk. 200
  const filingFees = 1000;
  // Digital Certified Copies
  const certifiedCopiesFee = 850;

  // Stamp Duty on AoA based on Capital
  let aoaStamp = 3000;
  if (authorizedCapital > 1000000 && authorizedCapital <= 30000000) {
    aoaStamp = 8000;
  } else if (authorizedCapital > 30000000) {
    aoaStamp = 20000;
  }
  const moaStamp = 1000;

  const totalGovernmentFee = registrationFee + nameClearanceFee + filingFees + certifiedCopiesFee + moaStamp + aoaStamp;

  const calculationSnapshot = useMemo(() => ({
    referenceId: `RJSC-${Date.now().toString().slice(-6)}`,
    generatedAt: new Date().toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' }),
    toolId: 'company-registration',
    toolName: 'RJSC Private Limited Incorporation Fee Estimator',
    toolCategory: 'Corporate Law & RJSC',
    toolPath: '/tools/company-registration',
    statutoryBasis: 'Companies Act 1994 (Schedule II) & Stamp Act 1899',
    summaryMetrics: [
      { label: 'Authorized Capital', value: `৳${authorizedCapital.toLocaleString()}` },
      { label: 'RJSC Registration Fee', value: `৳${Math.round(registrationFee).toLocaleString()}` },
      { label: 'Stamp Duty (MoA + AoA)', value: `৳${(moaStamp + aoaStamp).toLocaleString()}` },
      { label: 'Total Statutory Fees', value: `৳${Math.round(totalGovernmentFee).toLocaleString()}` },
    ],
    inputs: [
      { label: 'Authorized Capital', value: `৳${authorizedCapital.toLocaleString()}` },
      { label: 'Company Structure', value: 'Private Limited Company (by Shares)' },
      { label: 'Name Clearance Fee', value: '৳200' },
      { label: 'Digital Filing (5 Forms)', value: '৳1,000' },
      { label: 'Certified Copies (Digitized)', value: '৳850' },
    ],
    tables: [
      {
        title: 'RJSC Statutory Fee & Stamp Duty Schedule',
        headers: ['Head of Account / Service', 'Statutory Basis / Slab', 'Government Fee (BDT)'],
        rows: [
          { cells: ['Name Clearance Processing', 'RJSC Online System', '৳200'] },
          { cells: ['Capital Registration Fee', 'Companies Act 1994, Sched II', `৳${Math.round(registrationFee).toLocaleString()}`] },
          { cells: ['Statutory Forms Filing (5 forms)', 'Form I, VI, IX, X, XII', '৳1,000'] },
          { cells: ['MoA Stamp Duty', 'The Stamp Act 1899', `৳${moaStamp.toLocaleString()}`] },
          { cells: ['AoA Stamp Duty', `Capital bracket (≤ ৳${(authorizedCapital > 30000000 ? '3 Cr+' : authorizedCapital > 1000000 ? '3 Cr' : '10 Lakh')})`, `৳${aoaStamp.toLocaleString()}`] },
          { cells: ['Digital Certified Incorporation Copies', 'Certificate + MoA/AoA', '৳850'] },
          { cells: ['Total Government Fee Payable', 'Excluding professional legal fees', `৳${Math.round(totalGovernmentFee).toLocaleString()}`] },
        ],
      },
    ],
    legalNotes: [
      'Companies Act 1994 (Act No. XVIII of 1994), Schedule II Table of Registration Fees.',
      'The Stamp Act 1899 (Act II of 1899) Article 10 (Articles of Association) & Article 39 (Memorandum of Association).',
      'RJSC digital portal processing charges are subject to official government gazettes.',
    ],
  }), [authorizedCapital, registrationFee, nameClearanceFee, filingFees, certifiedCopiesFee, moaStamp, aoaStamp, totalGovernmentFee]);

  return (
    <>
      <ToolSEO
        toolId="company-registration"
        title="RJSC Private Limited Company Fee Estimator"
        canonicalUrl="/tools/company-registration"
        category="FinanceApplication"
        statutoryBasis="Companies Act 1994 (Schedule II) & Stamp Act 1899"
      />
      <ToolAccessGuard
        toolId="company-registration"
        toolName="RJSC Company Registration Fee Estimator"
        toolCategory="Corporate Law &amp; RJSC"
        toolPath="/tools/company-registration"
      >
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full border border-purple-300">
              Companies Act 1994 (Act XVIII of 1994)
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-2">
              RJSC Private Limited Company Incorporation Fee Estimator
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Computes official Registrar of Joint Stock Companies and Firms (RJSC) statutory fees and non-judicial stamp duty.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setAuthorizedCapital(1000000)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset
            </button>
            <CalculationEmailActionBarButton
              options={{
                toolId: 'company-registration',
                toolName: 'RJSC Company Registration Fee Estimator',
                toolCategory: 'Corporate Law & RJSC',
                toolPath: '/tools/company-registration',
                statutoryBasis: 'Companies Act 1994 & Stamp Act 1899',
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
              Capital Structure Parameters
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Authorized Share Capital (BDT)
              </label>
              <input
                type="number"
                value={authorizedCapital || ''}
                onChange={e => setAuthorizedCapital(Number(e.target.value) || 0)}
                aria-label="Authorized Share Capital BDT"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-black font-semibold"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Standard SME capital: ৳ 10,00,000 (10 Lakh) or ৳ 25,00,000 (25 Lakh)
              </span>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-100 border-b border-slate-200">
              <h3 className="text-sm font-black text-black">RJSC Government Fee Breakdown (At A Glance)</h3>
              <p className="text-xs text-slate-600">Official statutory fees payable via online payment gateway.</p>
            </div>

            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className="bg-slate-200 border-b border-slate-300 text-xs font-black uppercase text-black">
                  <th className="py-3 px-4 text-black font-black">Statutory Charge</th>
                  <th className="py-3 px-4 text-black font-black text-right">Governing Rule</th>
                  <th className="py-3 px-4 text-black font-black text-right">Fee (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs text-black">
                <tr>
                  <td className="py-2.5 px-4 font-bold text-black">Registration Fee on Capital</td>
                  <td className="py-2.5 px-4 text-right text-black font-mono">Schedule II, Tiered</td>
                  <td className="py-2.5 px-4 text-right text-black font-black font-mono">
                    ৳ {Math.round(registrationFee).toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-black">Name Clearance Fee</td>
                  <td className="py-2.5 px-4 text-right text-black font-mono">Per Name Application</td>
                  <td className="py-2.5 px-4 text-right text-black font-black font-mono">
                    ৳ {nameClearanceFee.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-black">Filing Fees for Statutory Forms</td>
                  <td className="py-2.5 px-4 text-right text-black font-mono">Forms I, VI, IX, X, XII</td>
                  <td className="py-2.5 px-4 text-right text-black font-black font-mono">
                    ৳ {filingFees.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-black">MoA Non-Judicial Stamp Duty</td>
                  <td className="py-2.5 px-4 text-right text-black font-mono">Stamp Act 1899</td>
                  <td className="py-2.5 px-4 text-right text-black font-black font-mono">
                    ৳ {moaStamp.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-black">AoA Non-Judicial Stamp Duty</td>
                  <td className="py-2.5 px-4 text-right text-black font-mono">Capital Tier Stamp</td>
                  <td className="py-2.5 px-4 text-right text-black font-black font-mono">
                    ৳ {aoaStamp.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-black">Digital Certified Copies (MoA/AoA/Cert)</td>
                  <td className="py-2.5 px-4 text-right text-black font-mono">RJSC Portal Fee</td>
                  <td className="py-2.5 px-4 text-right text-black font-black font-mono">
                    ৳ {certifiedCopiesFee.toLocaleString()}
                  </td>
                </tr>
                <tr className="bg-purple-100 font-extrabold border-t-2 border-purple-300">
                  <td className="py-3 px-4 font-black text-sm text-black">Total RJSC Government Registration Cost:</td>
                  <td className="py-3 px-4 text-right text-black font-mono">Total Official</td>
                  <td className="py-3 px-4 text-right text-black font-black text-base font-mono">
                    ৳ {Math.round(totalGovernmentFee).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-black font-bold">
              • Professional legal drafting fees and trade license fees are separate from RJSC official fees.
            </div>
          </div>
        </div>
      </div>
    </ToolAccessGuard>
    </>
  );
};
