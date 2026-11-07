import { useMemo } from 'react';
import { Clock, BookOpen } from 'lucide-react';
import { getReadingTimeStats } from '../utils/readingTime';
import { cn } from '../lib/utils';

interface EstimatedReadingTimeProps {
  content: string;
  wordsPerMinute?: number;
  variant?: 'badge' | 'sub-header' | 'inline' | 'hero';
  className?: string;
}

export function EstimatedReadingTime({
  content,
  wordsPerMinute = 200,
  variant = 'badge',
  className = '',
}: EstimatedReadingTimeProps) {
  const stats = useMemo(() => {
    return getReadingTimeStats(content, wordsPerMinute);
  }, [content, wordsPerMinute]);

  // 1. Badge variant: Sleek pill placed above the title alongside the category
  if (variant === 'badge') {
    return (
      <div 
        id="article-estimated-reading-time-badge"
        title={`Estimated reading duration: ${stats.minutes} minute${stats.minutes > 1 ? 's' : ''} based on ~${stats.words.toLocaleString()} words at ${stats.speedWpm} words/min`}
        className={cn(
          "inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/90 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md shadow-2xs hover:bg-emerald-100/70 transition-colors cursor-default",
          className
        )}
      >
        <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
        <span className="font-bold">
          <span className="hidden sm:inline">Estimated Reading Time: </span>
          {stats.minutes} min read
        </span>
      </div>
    );
  }

  // 2. Sub-Header variant: Detailed, elegant bar right near the article title
  if (variant === 'sub-header') {
    return (
      <div 
        id="article-estimated-reading-time-banner"
        className={cn(
          "inline-flex flex-wrap items-center gap-3 py-2 px-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs sm:text-sm text-slate-700 shadow-2xs",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Clock className="w-3 h-3" />
          </div>
          <span className="font-semibold text-slate-600">Estimated Reading Time:</span>
          <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200/60 shadow-2xs">
            ~{stats.minutes} min
          </span>
        </div>

        <span className="text-slate-300 hidden sm:inline">•</span>

        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
          <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>~{stats.words.toLocaleString()} words</span>
          <span className="text-slate-400 font-normal hidden md:inline">({stats.speedWpm} wpm standard pace)</span>
        </div>
      </div>
    );
  }

  // 3. Hero variant: Designed specifically for dark hero backgrounds (like VatGuide.tsx)
  if (variant === 'hero') {
    return (
      <div 
        id="hero-estimated-reading-time-badge"
        title={`Estimated reading duration: ${stats.minutes} minute${stats.minutes > 1 ? 's' : ''} based on ~${stats.words.toLocaleString()} words`}
        className={cn(
          "inline-flex items-center gap-1.5 bg-emerald-800/80 text-emerald-100 border border-emerald-700/80 text-xs font-semibold px-3 py-1 rounded-md backdrop-blur-xs",
          className
        )}
      >
        <Clock className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
        <span>
          <span className="hidden sm:inline">Estimated Reading Time: </span>
          {stats.minutes} min read
        </span>
      </div>
    );
  }

  // 4. Inline variant: Compact format for metadata rows
  return (
    <span 
      className={cn("inline-flex items-center gap-1 text-slate-500", className)}
      title={`Estimated reading time: ${stats.minutes} min based on ${stats.words} words`}
    >
      <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
      <span>Estimated {stats.minutes} min read</span>
    </span>
  );
}
