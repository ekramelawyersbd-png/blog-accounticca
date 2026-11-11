import React from 'react';
import { Mail, Sparkles, MessageCircle } from 'lucide-react';
import { useEmailPreview, OpenEmailPreviewOptions } from '../../contexts/EmailPreviewContext';
import { extractCalculationSnapshotFromContainer } from '../../utils/calculationEmailTemplate';

export interface CalculationEmailActionBarButtonProps {
  options?: OpenEmailPreviewOptions;
  label?: string;
  variant?: 'primary' | 'dark' | 'outline' | 'compact';
  title?: string;
  className?: string;
  onClick?: () => void;
}

export const CalculationEmailActionBarButton: React.FC<CalculationEmailActionBarButtonProps> = ({
  options,
  label = 'Send Calculation Report',
  variant = 'primary',
  title = 'Preview statutory calculation email report and dispatch to your email',
  className = '',
  onClick,
}) => {
  const { openEmailPreview } = useEmailPreview();

  const handleEmailClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (onClick) {
      onClick();
    }
    openEmailPreview(options);
  };

  const handleWhatsAppShare = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (onClick) {
      onClick();
    }

    try {
      const toolId = options?.toolId || 'tax-calculator';
      const toolName = options?.toolName || 'Bangladesh Statutory Compliance Calculator';
      const toolCategory = options?.toolCategory || 'Taxation & Statutory Compliance';
      const toolPath = options?.toolPath || window.location.pathname;
      const statutoryBasis = options?.statutoryBasis || 'Income Tax Act 2023 · Statutory Standards';

      let snapshot = options?.customSnapshot;
      if (!snapshot && options?.containerRef?.current) {
        snapshot = extractCalculationSnapshotFromContainer(options.containerRef.current, {
          toolId,
          toolName,
          toolCategory,
          toolPath,
          statutoryBasis,
        });
      }

      const refId = snapshot?.referenceId || `CALC-${Date.now().toString().slice(-6)}`;
      const metricsText = snapshot?.summaryMetrics
        ?.map((m) => `• *${m.label}*: ${m.value}`)
        .join('\n') || '';

      const inputsText = snapshot?.inputs
        ?.slice(0, 6)
        ?.map((i) => `  - ${i.label}: ${i.value}`)
        .join('\n') || '';

      const message =
        `⚖️ *ACCOUNTICCA × E-LAWYERS STATUTORY REPORT*\n` +
        `Ref ID: *${refId}*\n` +
        `Tool: *${toolName}*\n` +
        (metricsText ? `\n📊 *Key Summary:*\n${metricsText}\n` : '') +
        (inputsText ? `\n📝 *Verified Inputs:*\n${inputsText}\n` : '') +
        `\n🏛️ *Statutory Basis:* ${statutoryBasis}\n` +
        `🔗 Generated via Accounticca Chambers Portal (Dhaka)`;

      const encoded = encodeURIComponent(message);
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encoded}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.warn('WhatsApp share fallback:', err);
      window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent('Accounticca x E-Lawyers Statutory Calculation Report'), '_blank', 'noopener,noreferrer');
    }
  };

  let variantStyles = 'bg-blue-700 hover:bg-blue-800 text-white shadow-xs';
  if (variant === 'dark') {
    variantStyles = 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs';
  } else if (variant === 'outline') {
    variantStyles = 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-2xs';
  } else if (variant === 'compact') {
    variantStyles = 'bg-blue-600 hover:bg-blue-700 text-white text-[11px] px-2.5 py-1.5 shadow-2xs';
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleWhatsAppShare}
        title="Share calculation results instantly via WhatsApp"
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
        data-testid="whatsapp-share-action-btn"
      >
        <MessageCircle className="w-3.5 h-3.5 text-white shrink-0 fill-current" />
        <span>Share via WhatsApp</span>
      </button>
    </div>
  );
};

export default CalculationEmailActionBarButton;
