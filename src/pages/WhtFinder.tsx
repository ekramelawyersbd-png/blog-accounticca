import React, { useState } from 'react';
import { ToolAccessGuard } from '../components/auth/ToolAccessGuard';
import { CalculationEmailActionBarButton } from '../components/tools/CalculationEmailActionBarButton';

interface WhtRule {
  section: string;
  category: string;
  description: string;
  baseRate: string;
  nonTinRate: string;
  threshold: string;
}

const WHT_RULES: WhtRule[] = [
  {
    section: 'Section 89',
    category: 'Supply of Goods / Vendor Invoices',
    description: 'Supply of goods, materials, or equipment through tender or quotation.',
    baseRate: '3% to 7% (Tiered)',
    nonTinRate: '50% higher',
    threshold: 'Exceeding ৳ 50,000 per bill',
  },
  {
    section: 'Section 88',
    category: 'Execution of Contract',
    description: 'Contractor works, civil construction, engineering contracts.',
    baseRate: '5% to 7.5%',
    nonTinRate: '50% higher',
    threshold: 'All contract payments',
  },
  {
    section: 'Section 90',
    category: 'Professional & Technical Consultancy',
    description: 'Fees for legal consultancy, accounting, audit, management, or technical services.',
    baseRate: '10% (TIN holder)',
    nonTinRate: '20% (Without 12-digit TIN)',
    threshold: 'All professional fee disbursements',
  },
  {
    section: 'Section 102',
    category: 'House Property Rent',
    description: 'Rent paid for office space, commercial premises, or residential company leases.',
    baseRate: '5%',
    nonTinRate: '7.5%',
    threshold: 'Exceeding ৳ 25,000 per month',
  },
  {
    section: 'Section 104',
    category: 'Commission & Brokerage',
    description: 'Agency fees, indenting commissions, sales representative incentives.',
    baseRate: '10%',
    nonTinRate: '15%',
    threshold: 'All disbursements',
  },
  {
    section: 'Section 107',
    category: 'Bank Interest & Profit on Securities',
    description: 'Interest on fixed deposits (FDR), savings accounts, corporate bonds.',
    baseRate: '10% (With TIN)',
    nonTinRate: '15% (Without TIN / Proof of Return)',
    threshold: 'Exceeding ৳ 100,000 per year',
  },
];

export const WhtFinder: React.FC = () => {
  const [search, setSearch] = useState('');

  const filtered = WHT_RULES.filter(r => 
    r.section.toLowerCase().includes(search.toLowerCase()) ||
    r.category.toLowerCase().includes(search.toLowerCase()) ||
    r.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ToolAccessGuard
      toolId="wht-finder"
      toolName="Withholding Tax (TDS / WHT) Rate Finder"
      toolCategory="Taxation &amp; Deduction at Source"
      toolPath="/tools/wht"
    >
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold px-2.5 py-1 bg-cyan-100 text-cyan-800 rounded-full border border-cyan-300">
              Income Tax Act 2023 (Chapter VII)
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-2">
              Statutory Withholding Tax (TDS / WHT) Schedule
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Authoritative deduction at source rates for withholding entities in Bangladesh.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search section or payment type..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
              />
            </div>
            <CalculationEmailActionBarButton
              options={{
                toolId: 'wht-finder',
                toolName: 'Statutory Withholding Tax (TDS / WHT) Schedule',
                toolCategory: 'Taxation & Deduction at Source',
                toolPath: '/tools/wht',
                statutoryBasis: 'Income Tax Act 2023 · Chapter VII (Deduction at Source)',
                customSnapshot: {
                  referenceId: `WHT-${Date.now().toString().slice(-6)}`,
                  generatedAt: new Date().toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' }),
                  toolId: 'wht-finder',
                  toolName: 'Statutory Withholding Tax (TDS / WHT) Schedule',
                  toolCategory: 'Taxation & Deduction at Source',
                  toolPath: '/tools/wht',
                  statutoryBasis: 'Income Tax Act 2023 · Chapter VII (Deduction at Source)',
                  inputs: [
                    { label: 'Total Statutory TDS Sections', value: `${WHT_RULES.length} Key Categories` },
                    { label: 'Active Filter Query', value: search ? `"${search}"` : 'All Categories' },
                    { label: 'Non-TIN Higher Rate Rule', value: '50% higher deduction under Section 86' },
                  ],
                  summaryMetrics: [
                    { label: 'Matching TDS Rules', value: `${filtered.length} Sections` },
                    { label: 'Default Advisory Scope', value: 'National Board of Revenue (NBR)' },
                  ],
                  tables: [
                    {
                      title: 'Statutory Withholding Tax Schedule',
                      headers: ['Statutory Section', 'Payment Category', 'Base TDS Rate', 'Without TIN Rate'],
                      rows: filtered.slice(0, 10).map(r => ({ cells: [r.section, r.category, r.baseRate, r.nonTinRate] })),
                    },
                  ],
                  legalNotes: [
                    'Income Tax Act 2023 (Act No. XII of 2023), Chapter VII: Deduction at Source.',
                    'Section 86 specifies penalties and 50% surcharge for failure to provide 12-digit e-TIN.',
                    'Section 143 mandates issuance of withholding certificate (Form 52) to payees.',
                  ],
                },
              }}
              label="Send Calculation Report"
              variant="primary"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="bg-slate-200 border-b border-slate-300 text-xs font-black uppercase text-black">
                <th className="py-3 px-4 text-black font-black">Section</th>
                <th className="py-3 px-4 text-black font-black">Payment Category</th>
                <th className="py-3 px-4 text-black font-black">Standard Rate (With TIN)</th>
                <th className="py-3 px-4 text-black font-black">Without TIN / PSR Penalty</th>
                <th className="py-3 px-4 text-black font-black">Statutory Threshold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-black">
              {filtered.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-blue-700">{item.section}</td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-black">{item.category}</div>
                    <div className="text-[11px] text-slate-500">{item.description}</div>
                  </td>
                  <td className="py-3 px-4 font-bold text-emerald-800 font-mono">{item.baseRate}</td>
                  <td className="py-3 px-4 font-bold text-rose-700 font-mono">{item.nonTinRate}</td>
                  <td className="py-3 px-4 font-semibold text-black">{item.threshold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ToolAccessGuard>
  );
};
