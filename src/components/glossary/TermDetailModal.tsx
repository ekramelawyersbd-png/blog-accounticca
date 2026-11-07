import React, { useState } from 'react';
import { 
  X, 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Copy, 
  Check, 
  Bookmark, 
  ExternalLink,
  ShieldCheck,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { GlossaryTerm } from '../../data/glossaryData';

interface TermDetailModalProps {
  term: GlossaryTerm | null;
  onClose: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (termId: string) => void;
  onSelectRelatedTerm: (termId: string) => void;
}

export const TermDetailModal: React.FC<TermDetailModalProps> = ({
  term,
  onClose,
  isBookmarked,
  onToggleBookmark,
  onSelectRelatedTerm,
}) => {
  const [copied, setCopied] = useState(false);

  if (!term) return null;

  const handleCopy = () => {
    const citation = `${term.term} (${term.bengaliTerm})\nLegal Authority: ${term.actReference}\n\nSummary:\n${term.summary}\n\nKey Provisions:\n${term.keyProvisions.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\nRates/Limits: ${term.ratesOrLimits || 'N/A'}`;
    navigator.clipboard.writeText(citation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                {term.categoryLabel}
              </span>
              <span className="text-xs font-mono text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-md">
                {term.shortTerm}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 leading-tight">
              {term.term}
            </h3>
            <p className="text-sm font-semibold text-slate-600 mt-1 font-bengali">
              {term.bengaliTerm}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleBookmark(term.id)}
              className={`p-2.5 rounded-xl border transition-colors ${
                isBookmarked 
                  ? 'bg-amber-100 text-amber-700 border-amber-300' 
                  : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
              }`}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark term'}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-600' : ''}`} />
            </button>
            <button
              onClick={handleCopy}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 transition-colors"
              title="Copy definition & legal reference"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          {/* Statutory Reference Banner */}
          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start gap-3">
            <Scale className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">
                Statutory Authority & Sections
              </span>
              <p className="text-xs sm:text-sm font-medium text-emerald-950 mt-0.5">
                {term.actReference}
              </p>
            </div>
          </div>

          {/* Definition */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Comprehensive Definition
            </h4>
            <p className="text-slate-800 text-base leading-relaxed">
              {term.summary}
            </p>
          </div>

          {/* Key Rates or Limits */}
          {term.ratesOrLimits && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Applicable Statutory Rates & Limits
              </span>
              <p className="text-slate-900 font-medium leading-relaxed">
                {term.ratesOrLimits}
              </p>
            </div>
          )}

          {/* Key Provisions */}
          {term.keyProvisions.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Key Legal Provisions & Mechanisms
              </h4>
              <ul className="space-y-2.5">
                {term.keyProvisions.map((provision, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-700">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-snug">{provision}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Practical Example Case */}
          {term.practicalExample && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block">
                Practical Application Example (BDT)
              </span>
              <p className="text-slate-800 font-medium">
                {term.practicalExample.scenario}
              </p>
              {term.practicalExample.calculation && (
                <div className="p-2.5 bg-white/80 rounded-xl font-mono text-xs text-slate-700">
                  {term.practicalExample.calculation}
                </div>
              )}
              <p className="text-xs text-slate-700">
                <strong>Impact:</strong> {term.practicalExample.outcome}
              </p>
            </div>
          )}

          {/* Required Documents */}
          {term.documentsRequired && term.documentsRequired.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Mandatory Supporting Documents
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {term.documentsRequired.map((doc, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-2 text-xs text-slate-800 font-medium">
                    <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{doc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Penalties */}
          {term.penaltiesOrConsequences && (
            <div className="p-4 bg-red-50 rounded-2xl border border-red-200 text-xs text-red-900 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-red-800 font-semibold mb-0.5">
                  Consequences of Non-Compliance:
                </strong>
                <p className="text-red-900/90 leading-relaxed">{term.penaltiesOrConsequences}</p>
              </div>
            </div>
          )}

          {/* Related Links */}
          {term.relatedLinks && term.relatedLinks.length > 0 && (
            <div className="pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Related Platform Guides & Tools
              </h4>
              <div className="flex flex-wrap gap-2">
                {term.relatedLinks.map((link, idx) => (
                  <Link
                    key={idx}
                    to={link.url}
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition-colors"
                  >
                    <span>{link.title}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Source: E-Lawyers Bangladesh Tax, Accounting & Compliance
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
