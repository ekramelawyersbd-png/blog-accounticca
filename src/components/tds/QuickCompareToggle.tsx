import React from 'react';
import { Bookmark, Check, Pin } from 'lucide-react';

interface QuickCompareToggleProps {
  itemId: string;
  categoryName: string;
  isPinned: boolean;
  onToggle: (id: string) => void;
  className?: string;
  showLabel?: boolean;
}

export function QuickCompareToggle({
  itemId,
  categoryName,
  isPinned,
  onToggle,
  className = '',
  showLabel = true,
}: QuickCompareToggleProps) {
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(itemId);
  };

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {showLabel && (
        <span 
          className={`text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
            isPinned ? 'text-emerald-700 font-extrabold' : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={handleToggle}
        >
          <Pin className={`w-3 h-3 transition-transform ${isPinned ? 'text-emerald-600 fill-emerald-600 -rotate-45' : 'text-slate-400'}`} />
          <span>Quick-Compare</span>
          {isPinned && (
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-sm ml-0.5">
              Pinned
            </span>
          )}
        </span>
      )}

      {/* Switch Toggle Button */}
      <button
        type="button"
        role="switch"
        aria-checked={isPinned}
        aria-label={`Toggle Quick-Compare pin for ${categoryName}`}
        onClick={handleToggle}
        id={`quick-compare-toggle-${itemId}`}
        className={`quick-compare-switch relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40 ${
          isPinned ? 'bg-emerald-600' : 'bg-slate-300 hover:bg-slate-400'
        }`}
        title={isPinned ? `Unpin ${categoryName} from comparison tray` : `Pin ${categoryName} to sticky comparison tray`}
      >
        <span className="sr-only">Toggle Quick-Compare for {categoryName}</span>
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            isPinned ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
