import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface CopySectionButtonProps {
  content: string;
  className?: string;
}

export function CopySectionButton({ content, className }: CopySectionButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy content:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all shadow-sm",
        copied 
          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900",
        className
      )}
      title="Copy Section Content"
      type="button"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : "Copy Content"}
    </button>
  );
}
