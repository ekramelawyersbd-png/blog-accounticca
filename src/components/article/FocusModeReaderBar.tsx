import React from 'react';
import { 
  Minimize2, 
  Bookmark, 
  Sun, 
  Moon, 
  Coffee, 
  Type, 
  ArrowLeft,
  Clock,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { useFocusMode, ReaderTheme, ReaderFontSize } from '../../contexts/FocusModeContext';
import { ReadAloudButton } from '../ReadAloudButton';

interface FocusModeReaderBarProps {
  articleTitle: string;
  category: string;
  readTime: number;
  progressPercent: number;
  content?: string;
  isSaved?: boolean;
  onToggleSave?: () => void;
}

export function FocusModeReaderBar({
  articleTitle,
  category,
  readTime,
  progressPercent,
  content,
  isSaved = false,
  onToggleSave,
}: FocusModeReaderBarProps) {
  const { 
    toggleFocusMode, 
    readerTheme, 
    setReaderTheme, 
    readerFontSize, 
    setReaderFontSize 
  } = useFocusMode();

  const themes: { id: ReaderTheme; label: string; icon: React.ReactNode; bgClass: string }[] = [
    { id: 'light', label: 'Clean Light', icon: <Sun className="w-3.5 h-3.5" />, bgClass: 'bg-white text-slate-800' },
    { id: 'sepia', label: 'Warm Sepia', icon: <Coffee className="w-3.5 h-3.5" />, bgClass: 'bg-[#fbf7ee] text-[#4a3b2c]' },
    { id: 'dark', label: 'Night Dark', icon: <Moon className="w-3.5 h-3.5" />, bgClass: 'bg-slate-900 text-slate-100' },
  ];

  const fontSizes: { id: ReaderFontSize; label: string }[] = [
    { id: 'sm', label: 'A-' },
    { id: 'base', label: 'A' },
    { id: 'lg', label: 'A+' },
    { id: 'xl', label: 'A++' },
  ];

  const remainingMinutes = progressPercent >= 100 
    ? 0 
    : Math.max(1, Math.ceil(readTime * (1 - progressPercent / 100)));

  const barBgClass = readerTheme === 'sepia'
    ? 'bg-[#fbf7ee]/95 border-[#e8ddc8] text-[#3c2f1f]'
    : readerTheme === 'dark'
    ? 'bg-[#181f26]/95 border-slate-800 text-slate-100'
    : 'bg-white/95 border-slate-200/85 text-slate-800';

  return (
    <aside 
      aria-label="Distraction-free focus mode controls"
      className={`sticky top-0 z-50 backdrop-blur-md border-b shadow-xs transition-colors duration-200 print:hidden ${barBgClass}`}
    >
      {/* Top micro progress line */}
      <div className="w-full h-1 bg-transparent overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 transition-all duration-150 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-13 flex items-center justify-between gap-3">
        {/* Left: Exit Focus Mode & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={toggleFocusMode}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
              readerTheme === 'dark'
                ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
            title="Exit Focus Mode (or press Esc)"
          >
            <Minimize2 className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Exit Focus Mode</span>
            <span className="sm:hidden">Exit</span>
            <kbd className="hidden md:inline-block ml-1 px-1.5 py-0.2 rounded bg-black/20 text-[10px] font-mono">
              Esc
            </kbd>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          <div className="min-w-0 hidden md:flex items-center gap-2">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${
              readerTheme === 'sepia'
                ? 'bg-[#efe6d4] text-[#5c4a36]'
                : readerTheme === 'dark'
                ? 'bg-slate-800 text-emerald-400'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
            }`}>
              {category}
            </span>
            <span className="text-xs font-semibold truncate max-w-xs lg:max-w-md opacity-90">
              {articleTitle}
            </span>
          </div>
        </div>

        {/* Center: Reading Progress Status */}
        <div className="hidden sm:flex items-center gap-2.5 shrink-0">
          <div className="w-20 md:w-28 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
            {progressPercent}%
          </span>
          <span className="text-[11px] opacity-60 whitespace-nowrap">
            {progressPercent === 100 ? 'Finished' : `~${remainingMinutes}m left`}
          </span>
        </div>

        {/* Right: Theme, Font Size & Bookmark Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Font Size Selector */}
          <div className="flex items-center rounded-lg border border-black/10 dark:border-white/15 p-0.5 bg-black/5 dark:bg-white/5">
            {fontSizes.map((sz) => (
              <button
                key={sz.id}
                type="button"
                onClick={() => setReaderFontSize(sz.id)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  readerFontSize === sz.id
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10'
                }`}
                title={`Font Size: ${sz.label}`}
              >
                {sz.label}
              </button>
            ))}
          </div>

          {/* Theme Selector */}
          <div className="flex items-center rounded-lg border border-black/10 dark:border-white/15 p-0.5 bg-black/5 dark:bg-white/5">
            {themes.map((th) => (
              <button
                key={th.id}
                type="button"
                onClick={() => setReaderTheme(th.id)}
                className={`p-1 rounded text-xs transition-all cursor-pointer ${
                  readerTheme === th.id
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10'
                }`}
                title={th.label}
                aria-label={th.label}
              >
                {th.icon}
              </button>
            ))}
          </div>

          {/* TTS Audio Player */}
          {content && (
            <ReadAloudButton
              content={content}
              title={articleTitle}
              variant="compact"
            />
          )}

          {/* Bookmark */}
          {onToggleSave && (
            <button
              type="button"
              onClick={onToggleSave}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                isSaved 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400' 
                  : 'border-black/10 dark:border-white/15 opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10'
              }`}
              title={isSaved ? "Saved to Dashboard" : "Save Article"}
              aria-label="Bookmark"
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
