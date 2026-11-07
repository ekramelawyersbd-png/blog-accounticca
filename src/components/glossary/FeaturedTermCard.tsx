import React, { useState } from 'react';
import { 
  Scale, 
  FileText, 
  Calculator, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  Bookmark, 
  ExternalLink, 
  BookOpen,
  ChevronRight,
  ShieldCheck,
  Percent,
  Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { GlossaryTerm } from '../../data/glossaryData';

interface FeaturedTermCardProps {
  term: GlossaryTerm;
  isBookmarked: boolean;
  onToggleBookmark: (termId: string) => void;
  onSelectTerm: (term: GlossaryTerm) => void;
}

export const FeaturedTermCard: React.FC<FeaturedTermCardProps> = ({
  term,
  isBookmarked,
  onToggleBookmark,
  onSelectTerm,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'provisions' | 'example' | 'compliance'>('overview');
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = `${term.term} (${term.bengaliTerm})\n${term.actReference}\n\nSummary:\n${term.summary}\n\nKey Rates/Limits:\n${term.ratesOrLimits || 'N/A'}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getBadgeColor = () => {
    switch (term.id) {
      case 'tds':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          accent: 'bg-emerald-600',
          badge: 'bg-emerald-100 text-emerald-800',
          icon: <Percent className="w-5 h-5 text-emerald-600" />
        };
      case 'vat':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          accent: 'bg-blue-600',
          badge: 'bg-blue-100 text-blue-800',
          icon: <Calculator className="w-5 h-5 text-blue-600" />
        };
      case 'sixth-schedule':
        return {
          bg: 'bg-amber-50 text-amber-900 border-amber-200',
          accent: 'bg-amber-600',
          badge: 'bg-amber-100 text-amber-900',
          icon: <Layers className="w-5 h-5 text-amber-700" />
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-800 border-slate-200',
          accent: 'bg-slate-700',
          badge: 'bg-slate-100 text-slate-800',
          icon: <BookOpen className="w-5 h-5 text-slate-700" />
        };
    }
  };

  const styling = getBadgeColor();

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
      {/* Header Banner */}
      <div className={`p-5 border-b border-slate-100 ${styling.bg} flex items-start justify-between gap-4`}>
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-white rounded-xl shadow-xs border border-slate-200/60 flex items-center justify-center shrink-0">
            {styling.icon}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${styling.badge}`}>
                {term.categoryLabel}
              </span>
              <span className="text-xs font-medium text-slate-500 bg-white/80 px-2 py-0.5 rounded-full border border-slate-200/50">
                Core Statutory Concept
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
              {term.term}
            </h3>
            <p className="text-sm font-medium text-slate-600 mt-0.5 font-bengali">
              {term.bengaliTerm}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark(term.id);
            }}
            title={isBookmarked ? "Remove bookmark" : "Save to bookmarks"}
            className={`p-2 rounded-xl transition-colors ${
              isBookmarked 
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                : 'bg-white/80 text-slate-500 hover:text-slate-800 hover:bg-white border border-slate-200/60'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-600' : ''}`} />
          </button>
          <button
            onClick={handleCopy}
            title="Copy citation & summary"
            className="p-2 bg-white/80 text-slate-500 hover:text-slate-800 hover:bg-white rounded-xl border border-slate-200/60 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Legal Reference Subheader */}
      <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200/70 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-1.5 font-medium truncate">
          <Scale className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-500">Legal Authority:</span>
          <span className="font-semibold text-slate-700 truncate">{term.actReference}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 pt-3 border-b border-slate-100 bg-white flex gap-1 overflow-x-auto text-xs font-semibold scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2.5 px-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Overview & Rates
        </button>
        <button
          onClick={() => setActiveTab('provisions')}
          className={`pb-2.5 px-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'provisions'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Key Provisions ({term.keyProvisions.length})
        </button>
        {term.practicalExample && (
          <button
            onClick={() => setActiveTab('example')}
            className={`pb-2.5 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'example'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            BDT Example Case
          </button>
        )}
        <button
          onClick={() => setActiveTab('compliance')}
          className={`pb-2.5 px-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'compliance'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Compliance & Penalties
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-5 flex-1 flex flex-col justify-between text-sm">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <p className="text-slate-700 leading-relaxed font-normal">
              {term.summary}
            </p>
            {term.ratesOrLimits && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Key Rates & Statutory Thresholds
                </div>
                <p className="text-slate-800 font-medium text-xs sm:text-sm leading-relaxed">
                  {term.ratesOrLimits}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'provisions' && (
          <div className="space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Statutory Mechanisms
            </div>
            <ul className="space-y-2">
              {term.keyProvisions.map((provision, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-slate-700 text-xs sm:text-sm">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-snug">{provision}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'example' && term.practicalExample && (
          <div className="space-y-3">
            <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200/70">
              <span className="text-xs font-bold text-emerald-900 block mb-1">
                Practical Scenario
              </span>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                {term.practicalExample.scenario}
              </p>
            </div>
            {term.practicalExample.calculation && (
              <div className="p-3 bg-slate-100/80 rounded-xl font-mono text-xs text-slate-800 leading-relaxed">
                <div className="font-sans font-bold text-slate-600 mb-1">Calculation Breakdown:</div>
                {term.practicalExample.calculation}
              </div>
            )}
            <div className="text-xs text-slate-600 leading-relaxed">
              <strong className="text-slate-900">Outcome & Impact: </strong>
              {term.practicalExample.outcome}
            </div>
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="space-y-3.5">
            {term.complianceRules && (
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Compliance Obligations
                </span>
                <ul className="space-y-1.5">
                  {term.complianceRules.slice(0, 3).map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {term.penaltiesOrConsequences && (
              <div className="p-3 bg-red-50/80 rounded-xl border border-red-200 text-xs text-red-900">
                <div className="font-bold flex items-center gap-1.5 mb-1 text-red-800">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  Consequences of Non-Compliance
                </div>
                <p className="text-red-800/90 leading-relaxed">{term.penaltiesOrConsequences}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions & Deep Links */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {term.relatedLinks?.slice(0, 2).map((link, idx) => (
              <Link
                key={idx}
                to={link.url}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100/80 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <span>{link.title}</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            ))}
          </div>

          <button
            onClick={() => onSelectTerm(term)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 py-1.5 px-3 rounded-lg hover:bg-slate-100 transition-colors ml-auto"
          >
            <span>Full Details & Citation</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
