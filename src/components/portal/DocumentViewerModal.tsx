import React from 'react';
import { 
  X, 
  Download, 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  Calendar, 
  Building2, 
  User, 
  Copy, 
  Check, 
  ExternalLink,
  Printer,
  BadgeCheck,
  Lock,
  Sparkles
} from 'lucide-react';
import { ClientDocument, downloadClientDocumentPDF } from '../../services/clientDocumentService';

interface DocumentViewerModalProps {
  document: ClientDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document: docItem,
  isOpen,
  onClose
}) => {
  const [copiedCode, setCopiedCode] = React.useState(false);

  if (!isOpen || !docItem) return null;

  const handleCopyCode = () => {
    if (docItem.verificationCode && navigator.clipboard) {
      navigator.clipboard.writeText(docItem.verificationCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const getStatusColor = (status: ClientDocument['status']) => {
    switch (status) {
      case 'Certified':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Filed':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'Ready for Signature':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Client Review Required':
        return 'bg-amber-50 text-amber-900 border-amber-200';
      case 'Chamber Scoping':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Ribbon */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-bold">
                  Client Vault • Document Record
                </span>
                {docItem.isConfidential && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40">
                    <Lock className="w-2.5 h-2.5" />
                    Privileged &amp; Confidential
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-white line-clamp-1">{docItem.title}</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            title="Close viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* Main Title & Status Row */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full border ${getStatusColor(docItem.status)}`}>
                ● {docItem.status}
              </span>
              <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                {docItem.category}
              </span>
              <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                {docItem.fileType.toUpperCase()} • {docItem.fileSize}
              </span>
              {docItem.consultationRef && (
                <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 font-bold">
                  Ref: {docItem.consultationRef}
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
              {docItem.title}
            </h2>

            {docItem.subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                {docItem.subtitle}
              </p>
            )}
          </div>

          {/* Metadata Card */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/90 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Author / Lead</span>
              <span className="font-bold text-slate-900 block">{docItem.author.name}</span>
              <span className="text-[11px] text-slate-500">{docItem.author.division}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Timeline</span>
              <span className="font-semibold text-slate-800 block">Shared: {docItem.sharedDate}</span>
              <span className="text-[11px] text-slate-500">Updated: {docItem.lastUpdated}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Verification Code</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                  {docItem.verificationCode || 'VER-SEC-2026'}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                  title="Copy verification code"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Executive Scope &amp; Summary
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-100 leading-relaxed font-normal">
              {docItem.summary}
            </p>
          </div>

          {/* Full Content Preview / Provisions */}
          {docItem.contentPreview && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <BadgeCheck className="w-4 h-4 text-emerald-600" />
                  <span>Document Provisions &amp; Chamber Record</span>
                </h4>
                <span className="text-[11px] text-slate-400 font-mono">Authenticated Copy</span>
              </div>

              <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap border border-slate-800 max-h-64 overflow-y-auto">
                {docItem.contentPreview}
              </div>
            </div>
          )}

          {/* Chamber Trust Stamp */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs text-slate-600 flex-wrap">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Certified under advocate &amp; chartered accountant client confidentiality privilege.</span>
            </div>
            <span className="font-mono text-[11px] text-emerald-700 font-bold">Panthapath Chambers</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 sm:px-8 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs sm:text-sm font-bold text-slate-700 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={() => downloadClientDocumentPDF(docItem)}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF Docket</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
