import { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Info } from 'lucide-react';

interface LegalTooltipProps {
  term: string;
  definition: string;
  children?: React.ReactNode;
}

export function LegalTooltip({ term, definition, children }: LegalTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = window.setTimeout(() => {
      setIsVisible(false);
    }, 150); // slight delay to prevent flickering
  };

  return (
    <span 
      className="relative inline-flex items-center gap-1 cursor-help group z-10"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className="underline decoration-slate-300 decoration-dashed underline-offset-4 group-hover:decoration-emerald-500 transition-colors">
        {children || term}
      </span>
      <Info className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-[100] w-64 p-3 text-sm font-normal text-left text-slate-600 bg-slate-900 border border-slate-800 rounded-xl shadow-xl bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none"
          >
            <div className="font-bold text-white mb-1">{term}</div>
            <div className="text-slate-300 leading-relaxed text-xs">{definition}</div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-slate-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
