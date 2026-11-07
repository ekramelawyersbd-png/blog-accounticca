import React, { useEffect, useState, useMemo } from 'react';
import { 
  X, 
  BookOpen, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  Copy, 
  Check, 
  ExternalLink, 
  AlertTriangle, 
  Scale, 
  Building2, 
  CreditCard, 
  Clock,
  Landmark,
  Gavel,
  Search,
  BookMarked,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getLegalDetailsForSection } from '../../data/tdsLegalDetails';
import { buildAppointmentUrl } from '../../utils/appointmentRedirect';

export interface TdsDrawerItem {
  id: string;
  category: string;
  subCategory: string;
  section: string;
  rate: string;
  notes?: string;
}

interface TdsDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  item: TdsDrawerItem | null;
}

type DrawerTab = 'source' | 'dates' | 'circulars' | 'related' | 'rules';
type RelatedFilter = 'all' | 'circulars' | 'rulings';

export function TdsDetailsDrawer({ isOpen, onClose, item }: TdsDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>('source');
  const [copied, setCopied] = useState(false);
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [relatedFilter, setRelatedFilter] = useState<RelatedFilter>('all');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!item) return null;

  const legalDetail = getLegalDetailsForSection(item.section);

  const totalRelatedCount = (legalDetail.relatedCirculars?.length || 0) + (legalDetail.courtRulings?.length || 0);

  const filteredCirculars = useMemo(() => {
    if (!legalDetail.relatedCirculars) return [];
    const query = searchQuery.trim().toLowerCase();
    if (!query) return legalDetail.relatedCirculars;
    return legalDetail.relatedCirculars.filter(c => 
      c.number.toLowerCase().includes(query) ||
      c.title.toLowerCase().includes(query) ||
      c.summary.toLowerCase().includes(query) ||
      c.relevance.toLowerCase().includes(query) ||
      c.badge.toLowerCase().includes(query)
    );
  }, [legalDetail.relatedCirculars, searchQuery]);

  const filteredRulings = useMemo(() => {
    if (!legalDetail.courtRulings) return [];
    const query = searchQuery.trim().toLowerCase();
    if (!query) return legalDetail.courtRulings;
    return legalDetail.courtRulings.filter(r => 
      r.caseTitle.toLowerCase().includes(query) ||
      r.citation.toLowerCase().includes(query) ||
      r.court.toLowerCase().includes(query) ||
      r.benchOrDivision.toLowerCase().includes(query) ||
      r.issueDecided.toLowerCase().includes(query) ||
      r.holdingSummary.toLowerCase().includes(query) ||
      r.legalSignificance.toLowerCase().includes(query)
    );
  }, [legalDetail.courtRulings, searchQuery]);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedItemId(id);
      setTimeout(() => setCopiedItemId(null), 2500);
    });
  };

  const handleCopyCitation = () => {
    const citation = `TAX DEDUCTION AT SOURCE (TDS) STATUTORY REFERENCE
Section: ${legalDetail.sectionCode} (${legalDetail.sectionTitle})
Act: ${legalDetail.statutoryAct}
Category: ${item.category} - ${item.subCategory}
Applicable TDS Rate: ${item.rate}
Effective Date: ${legalDetail.effectiveDates.enactedDate} (Latest Amendment: ${legalDetail.effectiveDates.latestAmendment})
Key NBR Circular: ${legalDetail.referenceCirculars[0]?.number || 'S.R.O. 278-Ain/Aykor-25/2023'}
Treasury Chalan Code: ${legalDetail.statutoryRules.treasuryChalanCode}
PSR Penalty Rule: ${legalDetail.statutoryRules.psrRequirement}`;

    navigator.clipboard.writeText(citation).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* Slide-out Drawer Container */}
          <motion.div
            id="tds-details-drawer-content"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full z-10 border-l border-slate-200"
          >
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white flex flex-col gap-4 border-b border-slate-800 shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <Scale className="w-3.5 h-3.5" />
                      {legalDetail.sectionCode}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Income Tax Act 2023
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-white leading-snug">
                    {item.category}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300">
                    {item.subCategory}
                  </p>
                </div>

                <button
                  onClick={onClose}
                  id="close-tds-drawer-btn"
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors shrink-0"
                  aria-label="Close details drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Rate & Quick Metadata Pill */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Statutory TDS Rate:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black text-sm">
                    {item.rate}
                  </span>
                </div>
                <button
                  onClick={handleCopyCitation}
                  id="copy-tds-citation-btn"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors font-semibold"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Citation Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Citation</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-6 shrink-0 overflow-x-auto">
              <button
                onClick={() => setActiveTab('source')}
                id="drawer-tab-source"
                className={`py-3.5 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                  activeTab === 'source'
                    ? 'border-emerald-600 text-emerald-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Legal Source Text
              </button>
              <button
                onClick={() => setActiveTab('dates')}
                id="drawer-tab-dates"
                className={`py-3.5 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                  activeTab === 'dates'
                    ? 'border-emerald-600 text-emerald-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Effective Dates
              </button>
              <button
                onClick={() => setActiveTab('circulars')}
                id="drawer-tab-circulars"
                className={`py-3.5 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                  activeTab === 'circulars'
                    ? 'border-emerald-600 text-emerald-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                Key Circulars ({legalDetail.referenceCirculars.length})
              </button>
              <button
                onClick={() => setActiveTab('related')}
                id="drawer-tab-related-circulars"
                className={`py-3.5 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                  activeTab === 'related'
                    ? 'border-emerald-600 text-emerald-700 bg-white shadow-xs'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <BookMarked className="w-4 h-4 text-emerald-600" />
                <span>Related Circulars</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {totalRelatedCount}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('rules')}
                id="drawer-tab-rules"
                className={`py-3.5 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                  activeTab === 'rules'
                    ? 'border-emerald-600 text-emerald-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Compliance & Rules
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800">
              {/* TAB 1: LEGAL SOURCE TEXT */}
              {activeTab === 'source' && (
                <div className="space-y-6">
                  {/* Primary Act Citation */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Governing Statute
                    </div>
                    <div className="text-base font-extrabold text-slate-900 mb-2">
                      {legalDetail.statutoryAct}
                    </div>
                    <div className="text-xs text-emerald-800 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                      {legalDetail.bengaliSectionTitle}
                    </div>
                  </div>

                  {/* English Statutory Provision */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Scale className="w-4 h-4 text-emerald-600" />
                      Statutory Provision (Official English Translation)
                    </h3>
                    <div className="bg-emerald-950 text-emerald-50 p-4 sm:p-5 rounded-2xl border border-emerald-800/80 font-mono text-xs sm:text-sm leading-relaxed shadow-inner">
                      "{legalDetail.englishStatutoryExtract}"
                    </div>
                  </div>

                  {/* Bengali Statutory Provision */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-slate-600" />
                      মূল আইনগত ধারা (বাংলা পাঠ)
                    </h3>
                    <div className="bg-slate-100 text-slate-800 p-4 rounded-2xl border border-slate-200 font-sans text-xs sm:text-sm leading-relaxed">
                      "{legalDetail.bengaliStatutoryExtract}"
                    </div>
                  </div>

                  {/* Scope & Applicability */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Scope & Subject Matter Coverage
                    </h3>
                    <ul className="space-y-2.5">
                      {legalDetail.scopeAndApplicability.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 bg-white p-3 rounded-xl border border-slate-100 shadow-xs">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-normal">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cross References */}
                  <div className="pt-2">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Statutory Cross References
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {legalDetail.crossReferences.map((ref, idx) => (
                        <span key={idx} className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                          {ref}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: EFFECTIVE DATES */}
              {activeTab === 'dates' && (
                <div className="space-y-5">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs sm:text-sm text-emerald-900">
                    <strong>Statutory Validity:</strong> These provisions are currently in active force under the Income Tax Act 2023, subject to annual modifications enacted through the Finance Acts.
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Date of Original Enactment</div>
                        <div className="text-base font-extrabold text-slate-900 mt-0.5">{legalDetail.effectiveDates.enactedDate}</div>
                        <p className="text-xs text-slate-500 mt-1">{legalDetail.effectiveDates.enactedAct}</p>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Latest Statutory Amendment</div>
                        <div className="text-base font-extrabold text-slate-900 mt-0.5">{legalDetail.effectiveDates.latestAmendment}</div>
                        <p className="text-xs text-slate-500 mt-1">Incorporated revisions into rate schedules, threshold limits, and withholding forms.</p>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <Scale className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Applicable Assessment Years</div>
                        <div className="text-base font-extrabold text-slate-900 mt-0.5">{legalDetail.effectiveDates.applicableTaxYears}</div>
                        <p className="text-xs text-slate-500 mt-1">Mandatory for all corporate, partnership, and individual returns filed in Bangladesh.</p>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Gazette Publication Record</div>
                        <div className="text-sm font-bold text-slate-900 mt-0.5">{legalDetail.effectiveDates.gazetteNotification}</div>
                        <p className="text-xs text-slate-500 mt-1">Legally promulgated under Bangladesh Extraordinary Gazette authority.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: REFERENCE CIRCULAR NUMBERS */}
              {activeTab === 'circulars' && (
                <div className="space-y-4">
                  <div className="text-xs text-slate-500">
                    Official NBR Statutory Regulatory Orders (S.R.O.s) and Paripatra circulars governing this specific TDS section:
                  </div>

                  {legalDetail.referenceCirculars.map((circ, idx) => (
                    <div 
                      key={idx} 
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-emerald-300 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-2">
                        <span className="font-mono text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                          {circ.number}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          Dated: {circ.date}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-slate-900">
                          {circ.title}
                        </h4>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                          Issued by: {circ.issuedBy}
                        </p>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {circ.summary}
                      </p>

                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Practical Impact: {circ.relevance}</span>
                      </div>
                    </div>
                  ))}

                  {/* Discovery Callout to Related Circulars & Court Rulings */}
                  <div className="mt-5 p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                        <BookMarked className="w-3.5 h-3.5 text-emerald-700" />
                        Explore All Associated TDS Circulars & Court Precedents
                      </h4>
                      <p className="text-[11px] text-emerald-800 leading-relaxed">
                        Access official NBR gazette circular links, S.R.O.s, and Supreme Court / Tribunal rulings for {legalDetail.sectionCode}.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('related')}
                      id="jump-to-related-circulars-btn"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shrink-0 transition-colors shadow-xs"
                    >
                      <span>Related Circulars ({totalRelatedCount})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB: RELATED CIRCULARS & COURT RULINGS */}
              {activeTab === 'related' && (
                <section id="related-circulars-section" className="space-y-6">
                  {/* Section Title & Explanatory Banner */}
                  <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <BookMarked className="w-4 h-4" />
                      </span>
                      <h3 className="text-sm sm:text-base font-extrabold text-white">
                        Related TDS Circulars & Judicial Precedents
                      </h3>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Automatically indexed statutory S.R.O. orders, administrative clarification circulars, and landmark Supreme Court / Tribunal rulings directly governing <strong>{legalDetail.sectionCode}</strong> ({legalDetail.sectionTitle}).
                    </p>
                  </div>

                  {/* Search and Category Filter Toolbar */}
                  <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={`Search ${totalRelatedCount} circulars, S.R.O.s, or case citations...`}
                        id="related-circulars-search-input"
                        className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                          aria-label="Clear search"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => setRelatedFilter('all')}
                        id="filter-related-all"
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          relatedFilter === 'all'
                            ? 'bg-slate-900 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                        }`}
                      >
                        All References ({filteredCirculars.length + filteredRulings.length})
                      </button>
                      <button
                        onClick={() => setRelatedFilter('circulars')}
                        id="filter-related-circulars"
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                          relatedFilter === 'circulars'
                            ? 'bg-emerald-700 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Official Circulars & S.R.O.s ({filteredCirculars.length})</span>
                      </button>
                      <button
                        onClick={() => setRelatedFilter('rulings')}
                        id="filter-related-rulings"
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                          relatedFilter === 'rulings'
                            ? 'bg-purple-700 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                        }`}
                      >
                        <Gavel className="w-3.5 h-3.5 text-purple-500" />
                        <span>Court & Tribunal Rulings ({filteredRulings.length})</span>
                      </button>
                    </div>
                  </div>

                  {/* Empty Search Result State */}
                  {filteredCirculars.length === 0 && filteredRulings.length === 0 && (
                    <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-xs space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Search className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">
                        No circulars or rulings match "{searchQuery}"
                      </h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Try searching by section number, S.R.O. code, court name, or clear the search filter.
                      </p>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors"
                      >
                        Clear Search
                      </button>
                    </div>
                  )}

                  {/* SUB-SECTION 1: ASSOCIATED TDS CIRCULARS */}
                  {relatedFilter !== 'rulings' && filteredCirculars.length > 0 && (
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between gap-2 pt-1 border-b border-slate-200 pb-2">
                        <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-600" />
                          <span>Associated NBR Circulars, S.R.O.s & Paripatra Guidelines</span>
                        </h4>
                        <span className="text-xs font-bold text-slate-500">
                          {filteredCirculars.length} Document{filteredCirculars.length > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="space-y-3.5">
                        {filteredCirculars.map((circ) => (
                          <div
                            key={circ.id}
                            id={`related-circ-${circ.id}`}
                            className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-300 transition-all space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  circ.badge === 'S.R.O.'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : circ.badge === 'Finance Act Paripatra'
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                    : circ.badge === 'Central Bank Directive'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-slate-100 text-slate-800 border border-slate-200'
                                }`}>
                                  {circ.badge}
                                </span>
                                <span className="font-mono text-xs font-black text-slate-900">
                                  {circ.number}
                                </span>
                              </div>
                              <span className="text-xs text-slate-500 font-medium">
                                Issued: {circ.date}
                              </span>
                            </div>

                            <div>
                              <h5 className="font-bold text-sm text-slate-900 leading-snug">
                                {circ.title}
                              </h5>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Authority: {circ.issuedBy}
                              </p>
                            </div>

                            <p className="text-xs sm:text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                              {circ.summary}
                            </p>

                            <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100/80">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span><strong>Practical Impact:</strong> {circ.relevance}</span>
                            </div>

                            {/* Action Buttons: Direct External Link & Copy Citation */}
                            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                              <a
                                href={circ.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                id={`circ-external-link-${circ.id}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs border border-emerald-200 transition-colors"
                                title="Open official NBR portal or gazette record in new tab"
                              >
                                <span>Official NBR Document</span>
                                <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                              </a>

                              <button
                                onClick={() => handleCopyText(`${circ.number}: ${circ.title} (${circ.date}) - Source: ${circ.url}`, circ.id)}
                                id={`circ-copy-btn-${circ.id}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                              >
                                {copiedItemId === circ.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-emerald-700 font-bold">Citation Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Copy Reference</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SUB-SECTION 2: COURT & TRIBUNAL RULINGS */}
                  {relatedFilter !== 'circulars' && filteredRulings.length > 0 && (
                    <div className="space-y-3.5 pt-2">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
                        <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <Gavel className="w-4 h-4 text-purple-600" />
                          <span>Landmark Supreme Court & Taxes Appellate Tribunal Precedents</span>
                        </h4>
                        <span className="text-xs font-bold text-slate-500">
                          {filteredRulings.length} Judgment{filteredRulings.length > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="space-y-3.5">
                        {filteredRulings.map((ruling) => (
                          <div
                            key={ruling.id}
                            id={`related-ruling-${ruling.id}`}
                            className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-purple-300 transition-all space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-200">
                                  {ruling.court}
                                </span>
                                <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                                  {ruling.citation}
                                </span>
                              </div>
                              <span className="text-xs text-slate-500 font-medium">
                                Decided: {ruling.judgmentDate}
                              </span>
                            </div>

                            <div>
                              <h5 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">
                                {ruling.caseTitle}
                              </h5>
                              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                                {ruling.benchOrDivision}
                              </p>
                            </div>

                            {/* Issue Decided */}
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
                              <span className="font-bold text-slate-900">Legal Issue: </span>
                              {ruling.issueDecided}
                            </div>

                            {/* Holding Summary */}
                            <div className="p-3.5 bg-emerald-950 text-emerald-50 rounded-xl font-mono text-xs leading-relaxed border border-emerald-900 shadow-inner">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1 flex items-center gap-1.5">
                                <Scale className="w-3.5 h-3.5" />
                                Judicial Holding / Ratio Decidendi
                              </div>
                              "{ruling.holdingSummary}"
                            </div>

                            {/* Significance */}
                            <div className="flex items-start gap-1.5 text-xs text-slate-600 bg-purple-50/60 p-2.5 rounded-xl border border-purple-100/80">
                              <Scale className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                              <span><strong>Precedent Status:</strong> {ruling.legalSignificance}</span>
                            </div>

                            {/* Action Buttons: Direct External Link & Copy Citation */}
                            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                              <a
                                href={ruling.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                id={`ruling-external-link-${ruling.id}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
                                title="Open Supreme Court law report or tribunal database in new tab"
                              >
                                <span>Supreme Court Repository</span>
                                <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
                              </a>

                              <button
                                onClick={() => handleCopyText(`${ruling.caseTitle}, ${ruling.citation} (${ruling.judgmentDate}) - Ratio: ${ruling.holdingSummary}`, ruling.id)}
                                id={`ruling-copy-btn-${ruling.id}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                              >
                                {copiedItemId === ruling.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-emerald-700 font-bold">Citation Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Copy Case Citation</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Constitutional Doctrine Stare Decisis Notice */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-slate-700" />
                      Constitutional Binding Effect of Tax Precedents
                    </div>
                    <p className="leading-relaxed">
                      Under Article 111 of the Constitution of Bangladesh, the law declared by the Appellate Division and the High Court Division is strictly binding upon all subordinate courts, tribunals, and assessing tax authorities (DCTs / Joint Commissioners). Deducting entities can cite these precedents when responding to Section 143 notices or audit observations.
                    </p>
                  </div>
                </section>
              )}

              {/* TAB 4: COMPLIANCE & RULES */}
              {activeTab === 'rules' && (
                <div className="space-y-4">
                  {/* PSR Requirement Warning */}
                  <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 flex gap-3.5 items-start">
                    <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-amber-950">
                        Proof of Submission of Return (PSR) Penalty Rule
                      </h4>
                      <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                        {legalDetail.statutoryRules.psrRequirement}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                        <Building2 className="w-4 h-4 text-emerald-600" />
                        Deducting Authority
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {legalDetail.statutoryRules.deductingAuthority}
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                        <Clock className="w-4 h-4 text-emerald-600" />
                        Deposit Timeline
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {legalDetail.statutoryRules.depositTimeline}
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                        Treasury A-Chalan Code
                      </div>
                      <p className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded inline-block">
                        {legalDetail.statutoryRules.treasuryChalanCode}
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                        <Scale className="w-4 h-4 text-emerald-600" />
                        Minimum Tax Status
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {legalDetail.statutoryRules.minimumTaxStatus}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <div className="text-xs font-bold text-slate-700">Required Statutory Documentation</div>
                    <p className="text-xs text-slate-600">
                      {legalDetail.statutoryRules.statutoryCertificate}
                    </p>
                    <div className="pt-2 border-t border-slate-200 text-xs text-rose-700">
                      <strong>Non-Compliance Consequence:</strong> {legalDetail.statutoryRules.nonCompliancePenalty}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Consultation Action */}
            <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-500 text-center sm:text-left">
                Need verification for an invoice or withholding dispute under {legalDetail.sectionCode}?
              </div>
              <a
                href={buildAppointmentUrl({
                  service: `TDS Compliance: ${legalDetail.sectionCode}`,
                  notes: `Category: ${item.category} (${item.subCategory}). Rate: ${item.rate}`,
                  source: `TDS Details Drawer - ${legalDetail.sectionCode}`
                })}
                target="_blank"
                rel="noopener noreferrer"
                id="drawer-consult-lawyer-btn"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm group whitespace-nowrap"
              >
                <span>Consult Withholding Tax Lawyer</span>
                <ExternalLink className="w-3.5 h-3.5 text-emerald-200 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
