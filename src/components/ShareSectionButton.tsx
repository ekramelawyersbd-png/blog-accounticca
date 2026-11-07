import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface ShareSectionButtonProps {
  title: string;
  text: string;
  url: string;
  className?: string;
}

export function ShareSectionButton({ title, text, url, className }: ShareSectionButtonProps) {
  const [shared, setShared] = useState(false);

  const handleShare = async () => {
    const fullUrl = window.location.origin + url;
    const shareData = {
      title,
      text,
      url: fullUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Failed to share:', err);
        }
      }
    } else {
      // Fallback to clipboard if Web Share API is not supported
      try {
        await navigator.clipboard.writeText(fullUrl);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (err) {
        console.error('Failed to copy fallback:', err);
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all shadow-sm",
        shared 
          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900",
        className
      )}
      title="Share Section"
      type="button"
    >
      {shared ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
      {shared ? "Shared" : "Share"}
    </button>
  );
}
