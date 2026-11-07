import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export interface FormFieldFeedbackProps {
  id?: string;
  hasError?: boolean;
  isValid?: boolean;
  errorMessage?: string | null;
  helperText?: string;
  validMessage?: string;
  showValidBadge?: boolean;
  className?: string;
}

export const FormFieldFeedback: React.FC<FormFieldFeedbackProps> = ({
  id,
  hasError,
  isValid,
  errorMessage,
  helperText,
  validMessage = 'Valid format',
  showValidBadge = true,
  className = 'mt-1.5'
}) => {
  if (hasError && errorMessage) {
    return (
      <div
        id={id}
        role="alert"
        aria-live="polite"
        className={`flex items-start gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 animate-in fade-in duration-150 ${className}`}
      >
        <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
        <span className="leading-tight">{errorMessage}</span>
      </div>
    );
  }

  if (isValid && showValidBadge) {
    return (
      <div
        id={id}
        aria-live="polite"
        className={`flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-150 ${className}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>{validMessage}</span>
      </div>
    );
  }

  if (helperText) {
    return (
      <p
        id={id}
        className={`text-[11px] text-slate-500 dark:text-slate-400 leading-tight ${className}`}
      >
        {helperText}
      </p>
    );
  }

  return null;
};

export default FormFieldFeedback;
