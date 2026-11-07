import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  ExternalLink, 
  Building2, 
  Filter, 
  Calculator, 
  FileCheck, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { buildAppointmentUrl } from '../../utils/appointmentRedirect';

export interface StatutoryFormItem {
  code: string;
  name: string;
  category: 'Annual' | 'Conditional Event';
  trigger: string;
  deadlineDays: number;
  deadlineUnit: 'AGM' | 'Event' | 'Appointment';
  section: string;
  description: string;
  requiredAttachments: string[];
  govFee: string;
  exampleScenario: string;
}

const STATUTORY_FORMS: StatutoryFormItem[] = [
  // Annual Mandatory
  {
    code: 'Schedule X',
    name: 'Annual Return of Share Capital & Shareholder Summary',
    category: 'Annual',
    trigger: 'Holding of Annual General Meeting (AGM)',
    deadlineDays: 21,
    deadlineUnit: 'AGM',
    section: 'Section 36, Companies Act 1994',
    description: 'Comprehensive annual summary recording authorized capital, paid-up capital, list of directors, and complete shareholder ledger as at the AGM date.',
    requiredAttachments: ['Signed Schedule X Form', 'Audited Financial Statements (ICAB DVC)', 'AGM Notice & Minutes'],
    govFee: '৳400 (+ compounding late fee up to ৳5,000 if delayed)',
    exampleScenario: 'NexaSoft Tech holds AGM on 30 Nov -> Schedule X must be filed on RJSC portal by 21 Dec.'
  },
  {
    code: 'Balance Sheet & P&L',
    name: 'Audited Financial Statements & Profit & Loss Account',
    category: 'Annual',
    trigger: 'Adoption of Accounts at AGM',
    deadlineDays: 30,
    deadlineUnit: 'AGM',
    section: 'Section 185, Companies Act 1994',
    description: 'Audited balance sheet, profit and loss statement, directors report, and auditor report with ICAB Document Verification Code (DVC).',
    requiredAttachments: ['Audited Accounts with DVC Code', 'Directors Report', 'Auditor Certificate'],
    govFee: '৳400 filing fee',
    exampleScenario: 'AGM held on 30 Nov -> Financial statements must be submitted by 30 Dec.'
  },
  {
    code: 'Form 23B',
    name: 'Notice of Appointment of Auditor',
    category: 'Annual',
    trigger: 'Receiving Auditor Appointment Notice',
    deadlineDays: 30,
    deadlineUnit: 'Appointment',
    section: 'Section 210(2), Companies Act 1994',
    description: 'Official notice submitted by the chartered accountant auditor confirming acceptance of appointment.',
    requiredAttachments: ['Auditor ICAB Acceptance Letter', 'Shareholders Resolution'],
    govFee: '৳200 filing fee',
    exampleScenario: 'Auditor appointed on 1 Dec -> Auditor files Form 23B by 31 Dec.'
  },

  // Event-Based Conditional
  {
    code: 'Form XII',
    name: 'Particulars of Directors, Managers & Changes',
    category: 'Conditional Event',
    trigger: 'Change in Directors, MD, Auditor, or Secretary',
    deadlineDays: 14,
    deadlineUnit: 'Event',
    section: 'Section 115, Companies Act 1994',
    description: 'Notice reporting any new director appointment, resignation, removal, address update, or change in Managing Director.',
    requiredAttachments: ['Board Resolution', 'Form IX Consent (for new director)', 'Resignation Letter (if applicable)'],
    govFee: '৳200 filing fee',
    exampleScenario: 'New director appointed on 1 Nov -> Form XII must be submitted by 15 Nov.'
  },
  {
    code: 'Form IX',
    name: 'Consent of Director to Act',
    category: 'Conditional Event',
    trigger: 'Appointment of New Director',
    deadlineDays: 30,
    deadlineUnit: 'Event',
    section: 'Section 92, Companies Act 1994',
    description: 'Signed consent declaration by newly appointed director agreeing to act and holding qualification shares.',
    requiredAttachments: ['Signed Form IX Document', 'Director NID & e-TIN Copy'],
    govFee: 'Included with Form XII',
    exampleScenario: 'Director joins board -> Form IX signed and filed alongside Form XII.'
  },
  {
    code: 'Form XV',
    name: 'Return of Allotment of Shares',
    category: 'Conditional Event',
    trigger: 'Board Allotment of New Shares',
    deadlineDays: 60,
    deadlineUnit: 'Event',
    section: 'Section 151, Companies Act 1994',
    description: 'Filing reporting share allotment details, subscriber names, paid-up consideration, and share certificate serials.',
    requiredAttachments: ['Board Resolution for Allotment', 'Bank Capital Encashment Certificate'],
    govFee: '৳200 + Capital Stamp Duty',
    exampleScenario: 'Board allotting 10,000 new shares on 10 Oct -> Form XV filed by 9 Dec.'
  },
  {
    code: 'Form IV',
    name: 'Notice of Increase in Authorised Share Capital',
    category: 'Conditional Event',
    trigger: 'Passing Extraordinary Resolution for Capital Increase',
    deadlineDays: 15,
    deadlineUnit: 'Event',
    section: 'Section 56, Companies Act 1994',
    description: 'Notice reporting increase in company authorized share capital limit beyond previous MoA threshold.',
    requiredAttachments: ['Extraordinary Resolution', 'Amended MoA / AoA', 'Bank Voucher for Capital Fee'],
    govFee: 'Calculated based on capital increase band rates',
    exampleScenario: 'Shareholders approve raising capital from ৳10L to ৳50L -> Form IV filed within 15 days.'
  },
  {
    code: 'Form VIII',
    name: 'Special / Extraordinary Resolution & Constitutional Changes',
    category: 'Conditional Event',
    trigger: 'Passing Special Resolution (MoA/AoA Change)',
    deadlineDays: 15,
    deadlineUnit: 'Event',
    section: 'Section 88, Companies Act 1994',
    description: 'Filing copy of special resolution altering Articles of Association, company name, or objects clause.',
    requiredAttachments: ['Signed Special Resolution Copy', 'Notice of EGM', 'Minutes of EGM'],
    govFee: '৳200 filing fee + Non-Judicial Stamp Duty',
    exampleScenario: 'Company alters AoA governance clause on 5 Nov -> Form VIII filed by 20 Nov.'
  },
  {
    code: 'Form 117',
    name: 'Instrument of Transfer of Shares',
    category: 'Conditional Event',
    trigger: 'Execution of Share Transfer Deed',
    deadlineDays: 30,
    deadlineUnit: 'Event',
    section: 'Section 38, Companies Act 1994',
    description: 'Executed share transfer instrument signed by transferor and transferee with mandatory 1.5% non-judicial stamp duty.',
    requiredAttachments: ['Executed Form 117 Deed', 'Board Approval Resolution', 'Share Certificates'],
    govFee: '1.5% Stamp Duty on Share Consideration Value',
    exampleScenario: 'Shareholder sells 5,000 shares -> Form 117 executed and registered with RJSC.'
  },
  {
    code: 'Form XVIII',
    name: 'Particulars of Mortgage or Charge Creation',
    category: 'Conditional Event',
    trigger: 'Creating Mortgage/Bank Charge over Assets',
    deadlineDays: 21,
    deadlineUnit: 'Event',
    section: 'Section 159, Companies Act 1994',
    description: 'Registration of bank loan mortgage, debenture, or charge created on company land, factory, or assets.',
    requiredAttachments: ['Sanction Letter', 'Mortgage Deed / Hypothecation Agreement', 'Board Resolution'],
    govFee: '0.1% on Secured Facility Amount (Max ৳20,000)',
    exampleScenario: 'Company takes ৳1 Crore bank loan secured against property -> Form XVIII filed within 21 days.'
  },
  {
    code: 'Form XIX',
    name: 'Particulars of Modification of Mortgage / Charge',
    category: 'Conditional Event',
    trigger: 'Modifying Bank Loan / Facility Terms',
    deadlineDays: 21,
    deadlineUnit: 'Event',
    section: 'Section 167, Companies Act 1994',
    description: 'Filing reporting modification of interest rate, loan amount, or security release under existing charge.',
    requiredAttachments: ['Bank Facility Renewal / Modification Deed', 'Board Resolution'],
    govFee: '৳500 filing fee',
    exampleScenario: 'Bank enhances credit line -> Form XIX filed within 21 days of modification.'
  },
  {
    code: 'Form XXVIII',
    name: 'Memorandum of Satisfaction of Charge',
    category: 'Conditional Event',
    trigger: 'Full Repayment & Clearance of Secured Loan',
    deadlineDays: 21,
    deadlineUnit: 'Event',
    section: 'Section 169, Companies Act 1994',
    description: 'Notice confirming bank loan payoff and requesting cancellation of registered mortgage charge in RJSC registry.',
    requiredAttachments: ['Bank No Objection Certificate (NOC)', 'Bank Release Deed'],
    govFee: '৳500 filing fee',
    exampleScenario: 'Bank loan fully paid off -> Form XXVIII filed with Bank NOC to clear charge.'
  }
];

export function RjscReturnsFilingGuide() {
  const [filterCategory, setFilterCategory] = useState<'All' | 'Annual' | 'Conditional Event'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [agmDate, setAgmDate] = useState<string>('2026-11-30');
  const [eventDate, setEventDate] = useState<string>('2026-11-01');
  const [selectedFormCode, setSelectedFormCode] = useState<string>('Schedule X');

  // Calculate annual deadlines based on AGM Date
  const annualDeadlines = useMemo(() => {
    if (!agmDate) return null;
    const agm = new Date(agmDate);
    if (isNaN(agm.getTime())) return null;

    const schedXDate = new Date(agm);
    schedXDate.setDate(schedXDate.getDate() + 21);

    const balanceSheetDate = new Date(agm);
    balanceSheetDate.setDate(balanceSheetDate.getDate() + 30);

    return {
      agmFormatted: agm.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      scheduleXDeadline: schedXDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      balanceSheetDeadline: balanceSheetDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    };
  }, [agmDate]);

  // Calculate event deadline based on Event Date
  const eventDeadlines = useMemo(() => {
    if (!eventDate) return null;
    const ev = new Date(eventDate);
    if (isNaN(ev.getTime())) return null;

    const d14 = new Date(ev); d14.setDate(d14.getDate() + 14);
    const d15 = new Date(ev); d15.setDate(d15.getDate() + 15);
    const d21 = new Date(ev); d21.setDate(d21.getDate() + 21);
    const d30 = new Date(ev); d30.setDate(d30.getDate() + 30);
    const d60 = new Date(ev); d60.setDate(d60.getDate() + 60);

    return {
      eventFormatted: ev.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      d14: d14.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      d15: d15.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      d21: d21.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      d30: d30.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      d60: d60.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    };
  }, [eventDate]);

  // Filtered forms list
  const filteredForms = useMemo(() => {
    return STATUTORY_FORMS.filter(form => {
      const matchesCategory = filterCategory === 'All' || form.category === filterCategory;
      const matchesSearch = form.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            form.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [filterCategory, searchQuery]);

  const activeFormDetail = useMemo(() => {
    return STATUTORY_FORMS.find(f => f.code === selectedFormCode) || STATUTORY_FORMS[0];
  }, [selectedFormCode]);

  return (
    <div id="rjsc-returns-filing-guide" className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-4">
          <div className="bg-amber-500 text-white p-3.5 rounded-2xl shadow-md shrink-0">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">
                RJSC Statutory Returns Filing Guide (Companies Act 1994)
              </h2>
              <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Annual vs Event Matrix
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Comprehensive guide to annual reporting cycles, conditional event triggers, statutory form codes, and portal deadlines.
            </p>
          </div>
        </div>

        <a
          href="https://app.roc.gov.bd/psp/rf_main"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors shrink-0"
        >
          <span>Open RJSC Returns Portal</span>
          <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
        </a>
      </div>

      {/* Interactive Deadline Calculators Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
        {/* Annual Deadline Calculator */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-600" />
              1. Annual Returns Deadline Calculator
            </h3>
            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
              Annual Trigger
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Select AGM Date Held by Company
            </label>
            <input
              type="date"
              value={agmDate}
              onChange={(e) => setAgmDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            />
          </div>

          {annualDeadlines && (
            <div className="space-y-2 pt-1 text-xs">
              <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Schedule X (Annual Return)</span>
                  <span className="text-[10px] text-slate-500">21 days from AGM ({annualDeadlines.agmFormatted})</span>
                </div>
                <span className="font-extrabold text-amber-900 font-mono text-xs">{annualDeadlines.scheduleXDeadline}</span>
              </div>

              <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Audited Balance Sheet & P&L</span>
                  <span className="text-[10px] text-slate-500">30 days from AGM ({annualDeadlines.agmFormatted})</span>
                </div>
                <span className="font-extrabold text-amber-900 font-mono text-xs">{annualDeadlines.balanceSheetDeadline}</span>
              </div>
            </div>
          )}
        </div>

        {/* Event-Based Deadline Calculator */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600" />
              2. Event-Based Filing Deadline Calculator
            </h3>
            <span className="text-[10px] font-bold bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded">
              Conditional Trigger
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Select Corporate Event Date (e.g. Director Change / Share Allotment)
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            />
          </div>

          {eventDeadlines && (
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2 bg-indigo-50/80 border border-indigo-100 rounded-xl">
                <span className="font-bold text-slate-900 block text-[11px]">Form XII (14 Days)</span>
                <span className="text-[10px] text-indigo-700 font-mono font-bold">{eventDeadlines.d14}</span>
              </div>
              <div className="p-2 bg-indigo-50/80 border border-indigo-100 rounded-xl">
                <span className="font-bold text-slate-900 block text-[11px]">Form IV/VIII (15 Days)</span>
                <span className="text-[10px] text-indigo-700 font-mono font-bold">{eventDeadlines.d15}</span>
              </div>
              <div className="p-2 bg-indigo-50/80 border border-indigo-100 rounded-xl">
                <span className="font-bold text-slate-900 block text-[11px]">Form XVIII Charge (21 Days)</span>
                <span className="text-[10px] text-indigo-700 font-mono font-bold">{eventDeadlines.d21}</span>
              </div>
              <div className="p-2 bg-indigo-50/80 border border-indigo-100 rounded-xl">
                <span className="font-bold text-slate-900 block text-[11px]">Form XV Allotment (60 Days)</span>
                <span className="text-[10px] text-indigo-700 font-mono font-bold">{eventDeadlines.d60}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          {(['All', 'Annual', 'Conditional Event'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'All' ? 'All Forms (12)' : cat === 'Annual' ? 'Annual Mandatory (3)' : 'Conditional Event-Based (9)'}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search form name or code (e.g. Schedule X, Form XII)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-w-[240px]"
        />
      </div>

      {/* Statutory Forms Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-100 text-slate-700 uppercase font-extrabold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Form Code</th>
              <th className="py-3 px-4">Form Title & Description</th>
              <th className="py-3 px-4">Classification</th>
              <th className="py-3 px-4">Statutory Deadline</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-800">
            {filteredForms.map((form) => {
              const isSelected = selectedFormCode === form.code;
              return (
                <tr 
                  key={form.code}
                  className={`hover:bg-slate-50 transition-colors cursor-pointer ${isSelected ? 'bg-amber-50/50 font-semibold' : ''}`}
                  onClick={() => setSelectedFormCode(form.code)}
                >
                  <td className="py-3 px-4 font-black text-indigo-900 font-mono text-xs">
                    {form.code}
                  </td>
                  <td className="py-3 px-4 space-y-0.5">
                    <span className="font-bold text-slate-900 block">{form.name}</span>
                    <span className="text-[11px] text-slate-500 line-clamp-1">{form.description}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      form.category === 'Annual' 
                        ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                        : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                    }`}>
                      {form.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800">
                    {form.deadlineDays} Days ({form.deadlineUnit})
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFormCode(form.code);
                      }}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Active Form Detail Card */}
      {activeFormDetail && (
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-400 bg-slate-800 px-2.5 py-0.5 rounded font-mono uppercase">
                  {activeFormDetail.code}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  {activeFormDetail.section}
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-white mt-1">
                {activeFormDetail.name}
              </h3>
            </div>

            <a
              href={buildAppointmentUrl({
                service: `RJSC ${activeFormDetail.code} Filing Support`,
                notes: `Form: ${activeFormDetail.code}, Section: ${activeFormDetail.section}`,
                source: 'RjscReturnsFilingGuide Detail Card'
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-colors shrink-0 cursor-pointer shadow-sm"
            >
              <Calendar className="w-4 h-4" />
              <span>Assistance with {activeFormDetail.code}</span>
            </a>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {activeFormDetail.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
            <div className="bg-slate-800/80 p-3.5 rounded-2xl space-y-1.5">
              <span className="font-extrabold text-emerald-400 block uppercase tracking-wider text-[10px]">
                Required Supporting Attachments
              </span>
              <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[11px]">
                {activeFormDetail.requiredAttachments.map((att, i) => (
                  <li key={i}>{att}</li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-800/80 p-3.5 rounded-2xl space-y-1.5">
              <span className="font-extrabold text-amber-400 block uppercase tracking-wider text-[10px]">
                Statutory Trigger & Fees
              </span>
              <p className="text-slate-300 text-[11px]">
                <strong>Trigger:</strong> {activeFormDetail.trigger}
              </p>
              <p className="text-slate-300 text-[11px]">
                <strong>Govt Fee:</strong> {activeFormDetail.govFee}
              </p>
            </div>

            <div className="bg-slate-800/80 p-3.5 rounded-2xl space-y-1.5">
              <span className="font-extrabold text-indigo-400 block uppercase tracking-wider text-[10px]">
                Practical Compliance Example
              </span>
              <p className="text-slate-300 text-[11px] italic">
                "{activeFormDetail.exampleScenario}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer Call to Action */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 text-white rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <h4 className="text-sm font-extrabold text-amber-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Turnkey RJSC Annual & Event Filing Representation
          </h4>
          <p className="text-xs text-slate-300">
            Ensure complete compliance under Companies Act 1994 with ELA & Associates corporate secretarial team.
          </p>
        </div>

        <a
          href={buildAppointmentUrl({
            service: 'Turnkey RJSC Returns Filing Retainer',
            notes: 'Annual & Event Returns Filing Consultation Inquiry',
            source: 'RjscReturnsFilingGuide Banner'
          })}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition-all shrink-0 cursor-pointer shadow-sm"
        >
          <Calendar className="w-4 h-4" />
          <span>Consult Corporate Barrister</span>
        </a>
      </div>
    </div>
  );
}

export default RjscReturnsFilingGuide;
