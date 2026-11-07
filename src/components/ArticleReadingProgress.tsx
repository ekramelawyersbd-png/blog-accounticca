import { useState, useEffect, useRef } from 'react';
import { BookOpen, Clock, CheckCircle2, Bookmark, ArrowUp, Sparkles, Maximize2, Minimize2 } from 'lucide-react';
import { ReadAloudButton } from './ReadAloudButton';

interface ArticleReadingProgressProps {
  targetContentId?: string;
  totalMinutes: number;
  articleTitle: string;
  category: string;
  rawContent?: string;
  isSaved?: boolean;
  onToggleSave?: () => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
}

export function ArticleReadingProgress({
  targetContentId = 'article-content-body',
  totalMinutes,
  articleTitle,
  category,
  rawContent,
  isSaved = false,
  onToggleSave,
  isFocusMode = false,
  onToggleFocusMode,
}: ArticleReadingProgressProps) {
  const [progress, setProgress] = useState(0);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationFrameId: number;

    const calculateProgress = () => {
      const targetElement = document.getElementById(targetContentId);
      const scrollY = window.scrollY || document.documentElement.scrollTop;

      // Determine visibility of sticky mini-bar
      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        // Show sticky bar once user scrolls past the in-page progress box
        setShowStickyBar(containerRect.bottom < 60 && scrollY > 200);
      }

      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        // Element's top relative to viewport. Reading starts when top reaches 180px
        const startOffset = 180;
        const elementTop = rect.top;
        const elementHeight = rect.height;

        if (elementTop > startOffset) {
          setProgress(0);
        } else {
          // Total scrollable distance through the content
          const scrollableDistance = Math.max(1, elementHeight - (viewportHeight * 0.6));
          const scrolledPastStart = startOffset - elementTop;
          const currentPct = Math.min(100, Math.max(0, Math.round((scrolledPastStart / scrollableDistance) * 100)));
          setProgress(currentPct);
        }
      } else {
        // Fallback to window height if targetElement not found
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight > 0) {
          const currentPct = Math.min(100, Math.max(0, Math.round((scrollY / docHeight) * 100)));
          setProgress(currentPct);
        }
      }
    };

    const handleScroll = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(calculateProgress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    // Initial calculation
    calculateProgress();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, [targetContentId]);

  // Dynamic estimated minutes remaining based on current reading progress
  const remainingMinutes = progress >= 100 
    ? 0 
    : Math.max(1, Math.ceil(totalMinutes * (1 - progress / 100)));

  // Milestone contextual guidance
  const getMilestoneText = () => {
    if (progress === 0) return 'Ready to read: Explore statutory guidelines and analysis below';
    if (progress < 25) return 'Section 1: Statutory background and regulatory framework';
    if (progress < 50) return 'Section 2: Legal provisions, rates, and compliance requirements';
    if (progress < 75) return 'Section 3: Practical compliance checklists and enforcement rules';
    if (progress < 100) return 'Section 4: Summary, exceptions, and procedural recommendations';
    return 'Complete! You have finished reading this practitioner guide';
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* 1. Global Viewport Top Progress Line (Sticks to the very top edge of browser) */}
      <div 
        className="fixed top-0 left-0 right-0 h-1 bg-transparent z-[100] pointer-events-none print:hidden"
        aria-hidden="true"
      >
        <div 
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 transition-all duration-150 ease-out shadow-[0_0_10px_rgba(16,185,129,0.7)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 2. Floating Sticky Reader Companion Bar (Slides down when scrolling through the article) */}
      {showStickyBar && (
        <div 
          className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-top-2 print:hidden"
          role="region"
          aria-label="Article reading progress"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between gap-4">
            {/* Left: Article title & category badge */}
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="hidden sm:inline-block text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded shrink-0">
                {category}
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                {articleTitle}
              </span>
            </div>

            {/* Right: Progress stats, Read status & Quick actions */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-16 sm:w-28 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 hidden xs:block">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-150 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-emerald-700 whitespace-nowrap bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/50">
                  {progress}% {progress === 100 ? 'Done' : 'Read'}
                </span>
                <span className="hidden md:inline-block text-[11px] text-slate-500 font-medium">
                  {progress === 100 ? 'Complete' : `~${remainingMinutes}m left`}
                </span>
              </div>

              {onToggleSave && (
                <button
                  type="button"
                  onClick={onToggleSave}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    isSaved 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  title={isSaved ? 'Saved to Dashboard' : 'Save Article'}
                  aria-label="Bookmark article"
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                </button>
              )}

              {onToggleFocusMode && (
                <button
                  type="button"
                  onClick={onToggleFocusMode}
                  className={`p-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                    isFocusMode
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                  }`}
                  title={isFocusMode ? 'Exit Focus Mode (Esc)' : 'Enter Focus Mode (Distraction-free reading)'}
                  aria-label="Toggle Focus Mode"
                >
                  {isFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  <span className="hidden lg:inline text-xs font-semibold">
                    {isFocusMode ? 'Exit Focus' : 'Focus'}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={scrollToTop}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors"
                title="Back to top"
                aria-label="Scroll back to top"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          
          {/* Attached mini progress bar at the bottom edge of sticky header */}
          <div className="w-full h-[2px] bg-slate-100 overflow-hidden">
            <div 
              className="h-full bg-emerald-600 transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* 3. In-Page Visual Reading Progress Indicator Box (At the top of the article) */}
      <div 
        ref={containerRef}
        className="bg-gradient-to-br from-slate-50 via-emerald-50/20 to-white border border-emerald-100/90 rounded-2xl p-4 sm:p-5 shadow-xs mb-8 transition-all hover:border-emerald-200/80"
      >
        {/* Top Meta Line: Title, Status Badge & Time Remaining */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  Reading Progress
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                  progress === 100 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                }`}>
                  {progress === 100 ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>100% Completed</span>
                    </>
                  ) : (
                    <span>{progress}% Read</span>
                  )}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Long-form regulatory analysis &amp; guidance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 self-start sm:self-auto">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200/80 px-2.5 py-1 rounded-lg shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {progress === 100 
                  ? 'Article finished' 
                  : `~${remainingMinutes} min read remaining`}
              </span>
            </div>
            
            {/* Quick listen button if rawContent available */}
            {rawContent && (
              <ReadAloudButton 
                content={rawContent} 
                title={articleTitle} 
              />
            )}
          </div>
        </div>

        {/* Visual Progress Bar Track */}
        <div className="relative mt-2 mb-2.5">
          <div 
            className="w-full h-3 bg-slate-200/70 rounded-full overflow-hidden shadow-inner border border-slate-200/60 relative"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-full transition-all duration-200 ease-out shadow-xs relative"
              style={{ width: `${progress}%` }}
            >
              {/* Subtle animated light gleam on bar tip */}
              {progress > 0 && progress < 100 && (
                <span className="absolute right-0 top-0 bottom-0 w-2 bg-white/40 rounded-full animate-pulse" />
              )}
            </div>
          </div>

          {/* Visual Milestone Ticks (25%, 50%, 75%) */}
          <div className="absolute inset-0 pointer-events-none flex justify-between px-1 items-center">
            <span className="w-0.5 h-1.5 bg-slate-300 rounded-full ml-[25%]" title="25% Milestone" />
            <span className="w-0.5 h-1.5 bg-slate-300 rounded-full ml-[50%]" title="50% Milestone" />
            <span className="w-0.5 h-1.5 bg-slate-300 rounded-full ml-[75%]" title="75% Milestone" />
          </div>
        </div>

        {/* Dynamic Milestone / Contextual Guidance Strip */}
        <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500 font-medium pt-1">
          <div className="flex items-center gap-1.5 truncate">
            {progress === 100 ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                {getMilestoneText()}
              </span>
            ) : (
              <span className="text-slate-600">
                <strong className="text-slate-800 font-semibold">Active Milestone: </strong>
                {getMilestoneText()}
              </span>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3 shrink-0 text-[11px] text-slate-400">
            <span>25% Basics</span>
            <span>&bull;</span>
            <span>50% Rules</span>
            <span>&bull;</span>
            <span>75% Checklists</span>
            <span>&bull;</span>
            <span className={progress === 100 ? "text-emerald-600 font-bold" : ""}>100% Done</span>
          </div>
        </div>
      </div>
    </>
  );
}
