import React, { useState } from 'react';
import { 
  Building2, 
  FileText, 
  Search, 
  FileCheck, 
  XCircle, 
  HelpCircle, 
  ExternalLink, 
  Calendar, 
  BookOpen, 
  Layers, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert,
  Scale,
  Sparkles,
  Download,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { buildAppointmentUrl } from '../../utils/appointmentRedirect';

export type TopicId = 'incorporation' | 'returns' | 'certified-copies' | 'winding-up';
export type EntityId = 'pvt' | 'plc' | 'partnership' | 'society';

export function RjscFunctionsExplorer() {
  const [selectedTopic, setSelectedTopic] = useState<TopicId>('incorporation');
  const [selectedEntity, setSelectedEntity] = useState<EntityId>('pvt');

  return (
    <div id="rjsc-functions-explorer" className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-8">
      {/* Component Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-md shrink-0">
            <Building2 className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">
                RJSC Functions & Statutory Lifecycle Guide
              </h2>
              <span className="text-[10px] font-black bg-indigo-100 text-indigo-900 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Companies Act 1994
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Interactive legal workflows for incorporation, annual/event-based returns, certified copies, and company winding-up in Bangladesh.
            </p>
          </div>
        </div>

        {/* Official Links */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <a
            href="https://roc.gov.bd"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
          >
            <span>RJSC Official Site</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>
          <a
            href="https://app.roc.gov.bd/psp/fee_calculator"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-xl text-xs font-bold transition-colors"
          >
            <span>ROC App Portal</span>
            <ExternalLink className="w-3 h-3 text-indigo-600" />
          </a>
        </div>
      </div>

      {/* Select Topic & Entity Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
        {/* Topic Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            1. Select Lifecycle Topic
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { id: 'incorporation', label: 'Name Clearance & Incorporation', icon: Search },
              { id: 'returns', label: 'Statutory Returns & Filings', icon: FileText },
              { id: 'certified-copies', label: 'Certified Copies (CTC)', icon: FileCheck },
              { id: 'winding-up', label: 'Winding Up & Striking Off', icon: XCircle },
            ].map((topic) => {
              const Icon = topic.icon;
              const isActive = selectedTopic === topic.id;
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => setSelectedTopic(topic.id as TopicId)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold leading-tight">{topic.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Entity Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-emerald-600" />
            2. Select Business Entity Structure
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { id: 'pvt', label: 'Private Limited Company', act: 'Companies Act 1994' },
              { id: 'plc', label: 'Public Limited Company', act: 'Companies Act 1994' },
              { id: 'partnership', label: 'Partnership Firm', act: 'Partnership Act 1932' },
              { id: 'society', label: 'Society / Association', act: 'Societies Act 1860' },
            ].map((entity) => {
              const isActive = selectedEntity === entity.id;
              return (
                <button
                  key={entity.id}
                  type="button"
                  onClick={() => setSelectedEntity(entity.id as EntityId)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80'
                  }`}
                >
                  <span className="text-xs font-bold block">{entity.label}</span>
                  <span className={`text-[10px] block mt-0.5 ${isActive ? 'text-emerald-200' : 'text-slate-500'}`}>
                    {entity.act}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Topic Content Details */}
      <div className="space-y-6">
        {selectedTopic === 'incorporation' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-emerald-950 flex items-center gap-2">
                  <Search className="w-5 h-5 text-emerald-700" />
                  Phase 1: Name Clearance & Pre-Registration Procedures
                </h3>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-200 px-3 py-1 rounded-full">
                  Validity: 180 Days
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Before incorporating, proposed entity names are submitted through the RJSC name clearance module. The Registrar verifies proposed names against trademark records, identical registered entities, and restricted statutory terms.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                <div className="bg-white p-3 rounded-xl border border-emerald-200/80 space-y-1">
                  <span className="font-bold text-emerald-900 block">Step 1 — Search Registry</span>
                  <span className="text-slate-600 block text-[11px]">Check existing database for phonetically similar company or partnership names.</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-200/80 space-y-1">
                  <span className="font-bold text-emerald-900 block">Step 2 — Submit Application</span>
                  <span className="text-slate-600 block text-[11px]">Pay ৳500 government search fee per proposed name online.</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-200/80 space-y-1">
                  <span className="font-bold text-emerald-900 block">Step 3 — Clearance Certificate</span>
                  <span className="text-slate-600 block text-[11px]">Download official Name Clearance Clearance Letter upon RJSC approval.</span>
                </div>
              </div>
            </div>

            {/* Incorporation Documents Required */}
            <div className="space-y-3">
              <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                Phase 2: Mandatory Formal Incorporation Forms
              </h4>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-extrabold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Statutory Form / Doc</th>
                      <th className="py-3 px-4">Description & Scope</th>
                      <th className="py-3 px-4">Legal Reference</th>
                      <th className="py-3 px-4 text-right">Govt Stamp Duty / Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-800">
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-900">Memorandum of Association (MoA)</td>
                      <td className="py-3 px-4 text-slate-600">Company objects clause, authorised capital, and initial subscriber commitments.</td>
                      <td className="py-3 px-4 font-mono text-slate-500">Sec. 5, 6 Companies Act</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">৳ 2,000 Stamp</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-900">Articles of Association (AoA)</td>
                      <td className="py-3 px-4 text-slate-600">Internal governance rules, director powers, AGM procedures, and share transfers.</td>
                      <td className="py-3 px-4 font-mono text-slate-500">Sec. 17 Companies Act</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">৳ 10,000–50,000 Stamp</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-900">Form I (Declaration of Compliance)</td>
                      <td className="py-3 px-4 text-slate-600">Statutory declaration by an advocate or charter accountant verifying compliance.</td>
                      <td className="py-3 px-4 font-mono text-slate-500">Sec. 25(2) Companies Act</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">Included in ৳1,200</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-900">Form IX (Consent to Act as Director)</td>
                      <td className="py-3 px-4 text-slate-600">Consent signed by each proposed director accepting appointment and share qualification.</td>
                      <td className="py-3 px-4 font-mono text-slate-500">Sec. 92 Companies Act</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">Included in ৳1,200</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-900">Form XII (Particulars of Directors/Managers)</td>
                      <td className="py-3 px-4 text-slate-600">Official register details of directors, managing director, and company secretary.</td>
                      <td className="py-3 px-4 font-mono text-slate-500">Sec. 115 Companies Act</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">Included in ৳1,200</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {selectedTopic === 'returns' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 space-y-3">
              <h3 className="text-base font-extrabold text-indigo-950 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-700" />
                Statutory Returns: Annual Summary & Event-Based Filings
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                All registered entities must file mandatory annual returns following their Annual General Meeting (AGM) and submit event-based forms whenever company particulars change (e.g., share transfers, board changes, address shifts).
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 uppercase font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Form Code</th>
                    <th className="py-3 px-4">Filing Purpose & Document Description</th>
                    <th className="py-3 px-4">Statutory Deadline</th>
                    <th className="py-3 px-4 text-right">Standard Fee / Late Penalty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-800">
                  <tr>
                    <td className="py-3 px-4 font-extrabold text-indigo-900 font-mono">Schedule X</td>
                    <td className="py-3 px-4 text-slate-600">Annual Summary of Capital and List of Shareholders submitted after AGM.</td>
                    <td className="py-3 px-4 font-bold text-amber-800">Within 30 days of AGM</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">৳ 400 (+ ৳1,000–5,000 if late)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-extrabold text-indigo-900 font-mono">Form XII</td>
                    <td className="py-3 px-4 text-slate-600">Notice of Change in Directors, Managing Director, Auditors, or Secretary.</td>
                    <td className="py-3 px-4 font-bold text-slate-700">Within 14 days of change</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">৳ 200 per filing</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-extrabold text-indigo-900 font-mono">Form 117</td>
                    <td className="py-3 px-4 text-slate-600">Instrument of Share Transfer signed by transferor & transferee with stamp duty.</td>
                    <td className="py-3 px-4 font-bold text-slate-700">Within 30 days of execution</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">1.5% Stamp Duty on Share Value</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-extrabold text-indigo-900 font-mono">Form VIII</td>
                    <td className="py-3 px-4 text-slate-600">Notice of Increase in Authorised Capital or Paid-Up Capital.</td>
                    <td className="py-3 px-4 font-bold text-slate-700">Within 15 days of Resolution</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">Calculated on Capital Band Increase</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-extrabold text-indigo-900 font-mono">Audited Accounts</td>
                    <td className="py-3 px-4 text-slate-600">Audited Balance Sheet & Profit & Loss Statement under ICAB DVC standards.</td>
                    <td className="py-3 px-4 font-bold text-amber-800">Submitted with Schedule X</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">৳ 400 filing fee</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {selectedTopic === 'certified-copies' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3">
              <h3 className="text-base font-extrabold text-emerald-400 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                Online Application for Certified True Copies (CTC)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Certified True Copies (CTC) are official stamped documents issued by the RJSC Registrar verifying that the copy matches original filings stored in statutory archives.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-indigo-700 block text-sm">1. Select Required Documents</span>
                <p className="text-slate-600">Choose from MoA, AoA, Form XII, Certificate of Incorporation, or Schedule X in the ROC App portal.</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-indigo-700 block text-sm">2. Pay Government Search Fees</span>
                <p className="text-slate-600">Pay ৳200 search fee + ৳5 per page copying charge online via e-payment gateway.</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-indigo-700 block text-sm">3. Download / Collect Certified Copy</span>
                <p className="text-slate-600">Download digitally signed e-certified PDF or collect physical embossed copy from RJSC counter.</p>
              </div>
            </div>
          </motion.div>
        )}

        {selectedTopic === 'winding-up' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-rose-950 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-700" />
                  Winding Up, Liquidation & Striking Off Dead Companies
                </h3>
                <span className="text-xs font-bold text-rose-800 bg-rose-200 px-3 py-1 rounded-full">
                  Sec. 286-320 Companies Act
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Companies that have ceased operations can be formally dissolved through **Members' Voluntary Winding Up** or subject to **Striking Off** under Section 292 if dormant and inactive for over 2 consecutive years.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-extrabold text-slate-900 block text-sm">Members' Voluntary Winding Up Workflow</span>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-600">
                  <li>Board of Directors Declaration of Solvency under Section 290.</li>
                  <li>Special Shareholders Resolution to liquidate company & appoint Liquidator.</li>
                  <li>Gazette Notification in Bangladesh Government Gazette & 2 national newspapers.</li>
                  <li>Liquidator distributes assets, satisfies liabilities, and submits Final Accounts to RJSC.</li>
                  <li>Dissolution Certificate issued after 3 months from filing final meeting return.</li>
                </ol>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-extrabold text-slate-900 block text-sm">Striking Off Inactive Companies (Sec. 292)</span>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-600">
                  <li>RJSC issues Notice to show cause why company should not be struck off.</li>
                  <li>Publication in Official Gazette of notice striking company off register.</li>
                  <li>Dissolution effective upon Gazette publication notice.</li>
                  <li>Directors remain liable for unsatisfied company liabilities.</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <h4 className="text-sm font-extrabold text-emerald-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Need Turnkey RJSC Filing, Winding-Up, or Legal Retainer Assistance?
          </h4>
          <p className="text-xs text-slate-300">
            Consult our RJSC corporate advocates and chartered secretaries for end-to-end statutory representation.
          </p>
        </div>

        <a
          href={buildAppointmentUrl({
            service: 'RJSC Statutory Representation',
            notes: `Topic: ${selectedTopic}, Entity: ${selectedEntity}`,
            source: 'RjscFunctionsExplorer Component'
          })}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs transition-all shrink-0 cursor-pointer shadow-sm"
        >
          <Calendar className="w-4 h-4" />
          <span>Consult Corporate Barrister</span>
        </a>
      </div>
    </div>
  );
}

export default RjscFunctionsExplorer;
