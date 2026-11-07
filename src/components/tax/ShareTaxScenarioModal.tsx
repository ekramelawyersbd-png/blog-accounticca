import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  Mail, 
  ExternalLink, 
  X, 
  Link2, 
  FileText, 
  Sparkles,
  DollarSign,
  TrendingDown,
  Building2,
  Calendar
} from 'lucide-react';
import { TaxScenarioInputs, TaxScenarioResults } from '../../types/taxScenario';
import { 
  buildTaxScenarioDeepLink, 
  generateTaxScenarioEmailContent, 
  generateTaxScenarioTextSummary 
} from '../../utils/taxShareUtils';

interface ShareTaxScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarioName?: string;
  notes?: string;
  inputs: TaxScenarioInputs;
  results: TaxScenarioResults;
}

export function ShareTaxScenarioModal({
  isOpen,
  onClose,
  scenarioName,
  notes,
  inputs,
  results
}: ShareTaxScenarioModalProps) {
  const [customTitle, setCustomTitle] = useState(scenarioName || 'Individual Tax Scenario');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  useEffect(() => {
    if (scenarioName) {
      setCustomTitle(scenarioName);
    }
  }, [scenarioName]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const deepLink = buildTaxScenarioDeepLink({
    name: customTitle,
    notes,
    inputs,
    results
  });

  const emailData = generateTaxScenarioEmailContent({
    name: customTitle,
    notes,
    inputs,
    results,
    deepLink
  });

  const textSummary = generateTaxScenarioTextSummary({
    name: customTitle,
    notes,
    inputs,
    results,
    deepLink
  });

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(deepLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(emailData.body);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2500);
    } catch (err) {
      console.error('Failed to copy email body', err);
    }
  };

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(textSummary);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    } catch (err) {
      console.error('Failed to copy summary', err);
    }
  };

  const numIncome = parseInt(inputs.income || '0', 10);
  const numInvestment = parseInt(inputs.investment || '0', 10);

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="share-tax-scenario-modal"
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Share Tax Calculation Scenario
              </h3>
              <p className="text-xs text-slate-500">
                Generate a shareable deep link or send results via pre-formatted email.
              </p>
            </div>
          </div>
          <button
            id="close-share-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Scenario Name Editable Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Scenario Name for Sharing
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="e.g. Plan A: 300k Sanchayapatra Investment"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Quick Preview Snapshot */}
          <div className="p-4 bg-gradient-to-br from-slate-50 to-emerald-50/40 rounded-2xl border border-slate-200/70">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
              <span>Scenario Summary (AY 2026-27)</span>
              <span className="text-emerald-700 font-bold bg-emerald-100/70 px-2 py-0.5 rounded-md text-[11px]">
                {inputs.category === 'general' ? 'General' : inputs.category.replace('_', ' ')}
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Annual Income</span>
                <span className="text-sm font-bold text-slate-800">
                  {numIncome.toLocaleString()} BDT
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Investments</span>
                <span className="text-sm font-bold text-slate-800">
                  {numInvestment.toLocaleString()} BDT
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Tax Rebate</span>
                <span className="text-sm font-bold text-emerald-600">
                  -{results.rebate.toLocaleString()} BDT
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Net Payable</span>
                <span className="text-sm font-black text-emerald-700">
                  {results.netPayable < 0 ? 'Refund' : ''} {Math.abs(results.netPayable).toLocaleString()} BDT
                </span>
              </div>
            </div>
          </div>

          {/* Deep Link Sharing Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-emerald-600" />
                Interactive Scenario Deep Link
              </label>
              <span className="text-[11px] text-slate-400">Loads exact inputs in any browser</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="share-deep-link-input"
                type="text"
                readOnly
                value={deepLink}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 select-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                id="copy-deep-link-btn"
                type="button"
                onClick={handleCopyLink}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs shrink-0 ${
                  copiedLink 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-emerald-700" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Share via Email Section */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-600" />
                Share via Email
              </h4>
              <span className="text-[11px] text-slate-500">Itemized calculation breakdown</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Launch your default email client with the subject, itemized tax computations, net payable numbers, and interactive deep link pre-filled.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <a
                id="open-email-client-link"
                href={emailData.mailtoUrl}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>Open in Email App</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              <button
                id="copy-email-body-btn"
                type="button"
                onClick={handleCopyEmail}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  copiedEmail
                    ? 'bg-slate-900 text-white'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs'
                }`}
              >
                {copiedEmail ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Email Body Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Email Template</span>
                  </>
                )}
              </button>

              <button
                id="copy-text-summary-btn"
                type="button"
                onClick={handleCopySummary}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  copiedSummary
                    ? 'bg-slate-900 text-white'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs'
                }`}
              >
                {copiedSummary ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Summary Copied!</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Chat Summary</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Recipient Experience Notice */}
          <div className="text-[11px] text-slate-500 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/80 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Anyone who clicks this deep link will see your exact calculations pre-filled in their browser. They can adjust parameters, inspect tax slabs, or save the scenario to their own device.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
