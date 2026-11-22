import React, { useState } from 'react';
import { ToolAccessGuard } from '../components/auth/ToolAccessGuard';
import { CalculationEmailActionBarButton } from '../components/tools/CalculationEmailActionBarButton';
import { ToolSEO } from '../components/SEO';
import { ContactPageShell } from '../components/layout/ContactPageShell';
import { Scale } from 'lucide-react';
import { useTableSort } from '../hooks/useTableSort';
import { SortableTh } from '../components/ui/SortableTh';

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

  const { sortedItems: sortedWht, requestSort, getSortDirection } = useTableSort<
    WhtRule,
    'section' | 'category' | 'baseRate' | 'nonTinRate' | 'threshold'
  >(filtered);

  return (
    <ContactPageShell
      breadcrumbs={[
        { label: 'Tools & Calculators', path: '/tools' },
        { label: 'Withholding Tax (TDS / WHT) Finder' },
      ]}
      eyebrow="Income Tax Act 2023 · Chapter VII · Deduction at Source"
      headline="Withholding Tax"
      accentHeadline="(TDS / WHT) Schedule"
      description="Authoritative deduction at source rates and non-TIN surcharge thresholds for withholding entities in Bangladesh across supply, contracts, rent, and advisory services."
      metaItems={[
        'Chapter VII ITA 2023',
        'With TIN vs. Without TIN',
        'Sec 143 Form 52 Notice',
      ]}
      actions={
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
      }
      summaryCard={{
        eyebrow: 'Statutory Coverage',
        title: `${filtered.length} Active Rules`,
        icon: <Scale className="h-5 w-5" aria-hidden="true" />,
        description:
          'Compare base rates against Section 86 non-TIN / PSR penalties, or open the full Section 89/90/119 database.',
        actions: [
          {
            label: 'Full TDS Database',
            to: '/tds-guide',
          },
          {
            label: 'SRO 273 Gazette',
            to: '/SRO/TDS2026',
            variant: 'neutral',
          },
        ],
        footerText: 'Withholding certificates must be issued via Form 52 under Section 143.',
      }}
    >
      <ToolSEO
        toolId="wht-finder"
        title="Withholding Tax (TDS / WHT) Section Rate Finder"
        canonicalUrl="/tools/wht"
        category="BusinessApplication"
        statutoryBasis="Income Tax Act 2023 · Chapter VII"
      />
      <ToolAccessGuard
        toolId="wht-finder"
        toolName="Withholding Tax (TDS / WHT) Rate Finder"
        toolCategory="Taxation &amp; Deduction at Source"
        toolPath="/tools/wht"
      >
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-950">Filter Withholding Tax Sections</h2>
            <p className="text-xs text-slate-600 mt-0.5">Search by section number, supplier category, or service type.</p>
          </div>
          <div className="w-full sm:w-80">
            <input
              type="text"
              placeholder="Search section or payment type..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table data-sort-managed="react" className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="bg-slate-200 border-b border-slate-300 text-xs font-black uppercase text-black">
                <SortableTh label="Section" sortKey="section" direction={getSortDirection('section')} onSort={requestSort} className="py-3 px-4 text-black font-black" />
                <SortableTh label="Payment Category" sortKey="category" direction={getSortDirection('category')} onSort={requestSort} className="py-3 px-4 text-black font-black" />
                <SortableTh label="Standard Rate (With TIN)" sortKey="baseRate" direction={getSortDirection('baseRate')} onSort={requestSort} className="py-3 px-4 text-black font-black" />
                <SortableTh label="Without TIN / PSR Penalty" sortKey="nonTinRate" direction={getSortDirection('nonTinRate')} onSort={requestSort} className="py-3 px-4 text-black font-black" />
                <SortableTh label="Statutory Threshold" sortKey="threshold" direction={getSortDirection('threshold')} onSort={requestSort} className="py-3 px-4 text-black font-black" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-black">
              {sortedWht.map((item, idx) => (
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
    </ContactPageShell>
  );
};
