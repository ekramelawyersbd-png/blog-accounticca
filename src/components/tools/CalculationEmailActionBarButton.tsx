import React from 'react';
import { Mail, Sparkles } from 'lucide-react';
import { useEmailPreview, OpenEmailPreviewOptions } from '../../contexts/EmailPreviewContext';

export interface CalculationEmailActionBarButtonProps {
  /**
   * Optional custom options to pass to openEmailPreview (toolId, containerRef, customSnapshot, etc.)
   */
  options?: OpenEmailPreviewOptions;
  /**
   * Button label (defaults to 'Send Calculation Report')
   */
  label?: string;
  /**
   * Visual presentation variant: 'primary' (blue), 'dark' (slate-900), 'outline' (slate border), or 'compact'
   */
  variant?: 'primary' | 'dark' | 'outline' | 'compact';
  /**
   * Optional custom tooltip
   */
  title?: string;
  /**
   * Optional className extension
   */
  className?: string;
  /**
   * Optional callback when clicked before/after modal open
   */
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

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (onClick) {
      onClick();
    }
    openEmailPreview(options);
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
    <button
      type="button"
      onClick={handleClick}
      title={title}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${variantStyles} ${className}`}
      data-testid="email-calculation-action-btn"
    >
      <Mail className="w-3.5 h-3.5 text-cyan-200 shrink-0" />
      <span>{label}</span>
      <Sparkles className="w-3 h-3 text-emerald-300 shrink-0 opacity-80" />
    </button>
  );
};

export default CalculationEmailActionBarButton;
