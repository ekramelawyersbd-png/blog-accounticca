import React, { useState, useMemo } from 'react';
import { ToolAccessGuard } from '../components/auth/ToolAccessGuard';
import { Briefcase, RefreshCw } from 'lucide-react';
import { CalculationEmailActionBarButton } from '../components/tools/CalculationEmailActionBarButton';
import { ToolSEO } from '../components/SEO';
import { ContactPageShell } from '../components/layout/ContactPageShell';

export const GratuityCalculator: React.FC = () => {
  const [basicSalary, setBasicSalary] = useState<number>(50000); // Last drawn basic salary
  const [serviceYears, setServiceYears] = useState<number>(7);
  const [separationType, setSeparationType] = useState<'resignation' | 'retirement' | 'termination' | 'death'>('retirement');

  // Bangladesh Labour Act 2006 (Section 2(10) & Section 27):
  // Continuous service requirement: Minimum 5 years for resignation
  // Rate:
  // - For service between 5 and 10 years: 30 days basic wages for every completed year of service (or part exceeding 6 months)
  // - For service exceeding 10 years: 45 days basic wages for every completed year exceeding 10 years (or 45 days throughout based on 2013 amendment)
  let gratuityDaysPerYear = 30;
  if (serviceYears > 10) {
    gratuityDaysPerYear = 45;
  }

  // Daily basic rate = Monthly Basic / 30
  const dailyBasic = basicSalary / 30;
  const isEligible = serviceYears >= 5 || separationType === 'termination' || separationType === 'death';
  const totalGratuity = isEligible ? dailyBasic * gratuityDaysPerYear * serviceYears : 0;

  // Notice Pay: Section 26: 120 days for monthly rated worker on termination, or 30/60 days on resignation
  let noticeDays = 30;
  if (separationType === 'termination') noticeDays = 120;
  else if (separationType === 'resignation') noticeDays = 30;
  const noticePay = (basicSalary / 30) * noticeDays;

  const calculationSnapshot = useMemo(() => ({
    referenceId: `GRAT-${Date.now().toString().slice(-6)}`,
    generatedAt: new Date().toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' }),
    toolId: 'gratuity-calculator',
    toolName: 'Gratuity & Severance Pay Calculator',
    toolCategory: 'Labour Law & Employment',
    toolPath: '/tools/gratuity',
    statutoryBasis: 'Bangladesh Labour Act 2006 · Sections 2(10), 26 & 27',
    summaryMetrics: [
      { label: 'Basic Monthly Wages', value: `৳${basicSalary.toLocaleString()}` },
      { label: 'Completed Service', value: `${serviceYears} Years` },
      { label: 'Gratuity Accrued', value: `৳${Math.round(totalGratuity).toLocaleString()}` },
      { label: 'Statutory Notice Pay', value: `৳${Math.round(noticePay).toLocaleString()}` },
    ],
    inputs: [
      { label: 'Monthly Basic Wage', value: `৳${basicSalary.toLocaleString()}` },
      { label: 'Length of Service', value: `${serviceYears} Completed Years` },
      { label: 'Mode of Separation', value: separationType === 'resignation' ? 'Voluntary Resignation' : separationType === 'retirement' ? 'Normal Superannuation / Retirement' : separationType === 'termination' ? 'Employer Termination (Sec 26)' : 'Death while in Service (Sec 19)' },
      { label: 'Eligibility Status', value: isEligible ? 'Eligible for Statutory Gratuity' : 'Ineligible (<5 Years Service on Resignation)' },
    ],
    tables: [
      {
        title: 'Statutory End-of-Service Settlement Breakdown',
        headers: ['Benefit / Entitlement', 'Statutory Formula / Basis', 'Payable Amount (BDT)'],
        rows: [
          { cells: ['Statutory Gratuity Benefit', `${gratuityDaysPerYear} days basic/yr x ${serviceYears} yrs (BLA Sec 27)`, `৳${Math.round(totalGratuity).toLocaleString()}`] },
          { cells: ['Notice Pay in Lieu', `${noticeDays} days basic wage (BLA Sec 26)`, `৳${Math.round(noticePay).toLocaleString()}`] },
          { cells: ['Total Final Settlement', 'Gratuity + Notice Pay', `৳${Math.round(totalGratuity + noticePay).toLocaleString()}`] },
        ],
      },
    ],
    legalNotes: [
      'Bangladesh Labour Act 2006 (Act No. XLII of 2006) as amended in 2013 & 2018.',
      'Section 2(10) defines "gratuity" as wages of at least 30 days for service of 5 to 10 years, and 45 days for service exceeding 10 years.',
      'Section 26 provides notice or wages in lieu of notice for termination of employment.',
      'Section 27 outlines terminal benefits payable on employee resignation and retirement.',
    ],
  }), [basicSalary, serviceYears, separationType, gratuityDaysPerYear, isEligible, totalGratuity, noticeDays, noticePay]);

  return (
    <ContactPageShell
      breadcrumbs={[
        { label: 'Tools & Calculators', path: '/tools' },
        { label: 'Gratuity & Severance Pay' },
      ]}
      eyebrow="Bangladesh Labour Act 2006 · Sections 2(10), 26 & 27"
      headline="Statutory Gratuity &"
      accentHeadline="Settlement Calculator"
      description="Computes end-of-service gratuity and notice pay under Sections 2(10), 26, and 27: 30 days basic wages (5–10 yrs) and 45 days basic wages (>10 yrs)."
      metaItems={[
        'Labour Act 2006 Compliant',
        'Notice Pay Sec 26',
        '30 / 45 Days Formula',
      ]}
      actions={
        <>
          <CalculationEmailActionBarButton
            options={{
              toolId: 'gratuity-calculator',
              toolName: 'Gratuity & Severance Pay Calculator',
              toolCategory: 'Labour Law & Employment',
              toolPath: '/tools/gratuity',
              statutoryBasis: 'Bangladesh Labour Act 2006 · Sections 2(10), 26 & 27',
              customSnapshot: calculationSnapshot,
            }}
            label="Send Calculation Report"
            variant="primary"
          />
          <button
            type="button"
            onClick={() => {
              setBasicSalary(50000);
              setServiceYears(7);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 shadow-xs transition hover:border-emerald-300 hover:bg-emerald-50 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
            <span>Reset</span>
          </button>
        </>
      }
      summaryCard={{
        eyebrow: 'Terminal Settlement Summary',
        title: `৳ ${Math.round(totalGratuity + noticePay).toLocaleString()}`,
        icon: <Briefcase className="h-5 w-5" aria-hidden="true" />,
        description: `Gratuity accrued ৳ ${Math.round(totalGratuity).toLocaleString()} · Statutory notice pay ৳ ${Math.round(noticePay).toLocaleString()} (${serviceYears} yrs service).`,
        actions: [
          {
            label: 'Labour Law Advisory',
            to: '/contact?tab=appointment',
          },
          {
            label: 'HR Legal Templates',
            to: '/resource-library',
            variant: 'neutral',
          },
        ],
        footerText: 'Excludes unavailed annual leave encashment (Section 117) and earned wages.',
      }}
    >
      <ToolSEO
        toolId="gratuity-calculator"
        title="Bangladesh Labour Act Gratuity & Notice Pay Calculator"
        canonicalUrl="/tools/gratuity"
        category="FinanceApplication"
        statutoryBasis="Bangladesh Labour Act 2006 · Sections 2(10), 26 & 27"
      />
      <ToolAccessGuard
        toolId="gratuity-calculator"
        toolName="Gratuity &amp; Severance Pay Calculator"
        toolCategory="Labour Law &amp; Employment"
        toolPath="/tools/gratuity"
      >
      <div className="space-y-6">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
              Employment History &amp; Wages
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Last Drawn Monthly Basic Wages (BDT)
              </label>
              <input
                type="number"
                value={basicSalary || ''}
                onChange={e => setBasicSalary(Number(e.target.value) || 0)}
                aria-label="Last Drawn Monthly Basic Wages BDT"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-black font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Completed Years of Continuous Service
              </label>
              <input
                type="number"
                value={serviceYears || ''}
                onChange={e => setServiceYears(Number(e.target.value) || 0)}
                aria-label="Completed Years of Continuous Service"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-black font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Separation Mode
              </label>
              <select
                value={separationType}
                onChange={e => setSeparationType(e.target.value as any)}
                aria-label="Separation Mode"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
              >
                <option value="retirement">Retirement (Attaining Superannuation)</option>
                <option value="resignation">Voluntary Resignation (Min 5 years service)</option>
                <option value="termination">Termination by Employer (Section 26)</option>
                <option value="death">Death / Permanent Disablement while in service</option>
              </select>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-100 border-b border-slate-200">
              <h3 className="text-sm font-black text-black">Statutory Settlement Statement (At A Glance)</h3>
              <p className="text-xs text-slate-600">Calculated according to the statutory provisions of Bangladesh Labour Act.</p>
            </div>

            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className="bg-slate-200 border-b border-slate-300 text-xs font-black uppercase text-black">
                  <th className="py-3 px-4 text-black font-black">Settlement Head</th>
                  <th className="py-3 px-4 text-black font-black text-right">Statutory Formula</th>
                  <th className="py-3 px-4 text-black font-black text-right">Payable (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs text-black">
                <tr>
                  <td className="py-2.5 px-4 font-bold text-black">Daily Basic Wage Equivalent</td>
                  <td className="py-2.5 px-4 text-right text-black font-mono">Basic ÷ 30 Days</td>
                  <td className="py-2.5 px-4 text-right text-black font-black font-mono">
                    ৳ {Math.round(dailyBasic).toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-black">Gratuity Entitlement Rate</td>
                  <td className="py-2.5 px-4 text-right text-black font-mono">{serviceYears > 10 ? '45 Days / Yr' : '30 Days / Yr'}</td>
                  <td className="py-2.5 px-4 text-right text-black font-black font-mono">
                    {isEligible ? `${gratuityDaysPerYear * serviceYears} Days Total` : 'Ineligible (<5 yrs)'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-black">Statutory Gratuity Benefit</td>
                  <td className="py-2.5 px-4 text-right text-black font-mono">Daily Wage × Days × Yrs</td>
                  <td className="py-2.5 px-4 text-right text-black font-black font-mono">
                    ৳ {Math.round(totalGratuity).toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-black">Notice Pay in Lieu of Notice</td>
                  <td className="py-2.5 px-4 text-right text-black font-mono">{noticeDays} Days Basic</td>
                  <td className="py-2.5 px-4 text-right text-black font-black font-mono">
                    ৳ {Math.round(noticePay).toLocaleString()}
                  </td>
                </tr>
                <tr className="bg-rose-100 font-extrabold border-t-2 border-rose-300">
                  <td className="py-3 px-4 font-black text-sm text-black">Total End-of-Service Terminal Benefit:</td>
                  <td className="py-3 px-4 text-right text-black font-mono">Gratuity + Notice</td>
                  <td className="py-3 px-4 text-right text-black font-black text-base font-mono">
                    ৳ {Math.round(totalGratuity + noticePay).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-black font-bold">
              • In addition, encashment of unavailed annual leave (Section 117) and earned salary up to the last working day are payable.
            </div>
          </div>
        </div>
      </div>
    </ToolAccessGuard>
    </ContactPageShell>
  );
};
