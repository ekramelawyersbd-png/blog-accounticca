import { useLanguage } from '../contexts/LanguageContext';
import { Languages } from 'lucide-react';
import { cn } from '../lib/utils';

export function LanguageToggle({ className, variant = 'light' }: { className?: string; variant?: 'light' | 'dark' }) {
  const { language, setLanguage } = useLanguage();

  const isDark = variant === 'dark';

  return (
    <div className={cn(
      "inline-flex items-center gap-1 p-1 rounded-xl border transition-all shadow-2xs",
      isDark ? "bg-slate-800/95 border-slate-700" : "bg-white border-slate-200/90",
      className
    )}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setLanguage('en');
        }}
        className={cn(
          "px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all min-h-[34px] min-w-[42px] cursor-pointer flex items-center justify-center select-none",
          language === 'en'
            ? "bg-emerald-600 text-white shadow-xs scale-100"
            : isDark ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900 active:bg-slate-100"
        )}
        aria-pressed={language === 'en'}
      >
        EN
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setLanguage('bn');
        }}
        className={cn(
          "px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all min-h-[34px] min-w-[42px] cursor-pointer flex items-center justify-center select-none",
          language === 'bn'
            ? "bg-emerald-600 text-white shadow-xs scale-100"
            : isDark ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900 active:bg-slate-100"
        )}
        aria-pressed={language === 'bn'}
      >
        বাং
      </button>
    </div>
  );
}
