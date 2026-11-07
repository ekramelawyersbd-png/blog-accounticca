import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ArrowUp,
  Link2,
  ListFilter,
  Search,
  X
} from 'lucide-react';

export interface ArticleHeadingItem {
  id: string;
  title: string;
  level: number;
  chapterNumber: string;
  parentId?: string;
}

export interface ArticleNavigatorProps {
  /** Raw markdown content of the article */
  content: string;
  /** Optional article title for aria context */
  articleTitle?: string;
  /** Optional externally computed scroll progress (0-100) */
  scrollProgress?: number;
  /** Optional total estimated reading time in minutes */
  readingTimeMinutes?: number;
  /** Optional DOM container ID of the rendered markdown body */
  targetContainerId?: string;
  /** Optional sticky class override */
  stickyClassName?: string;
  /** Optional additional className */
  className?: string;
}

/**
 * Recursively extracts plain text from React children (e.g. inside ReactMarkdown h2/h3 nodes
 * that may contain nested <strong>, <em>, or <code> elements).
 */
export function extractTextFromReactNode(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return '';
  }
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(extractTextFromReactNode).join('');
  }
  if (React.isValidElement(node)) {
    return extractTextFromReactNode((node.props as { children?: React.ReactNode }).children);
  }
  return '';
}

/**
 * Normalizes a heading string (removing markdown emphasis, links, inline code, and HTML tags)
 * into a deterministic DOM id matching the ReactMarkdown heading renderer.
 */
export function slugifyHeadingText(rawText: string): string {
  const plain = stripMarkdownFormatting(rawText);
  return plain
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Strips markdown inline formatting (**bold**, *italic*, `code`, [text](url), HTML tags)
 * for clean display in the chapter navigator.
 */
export function stripMarkdownFormatting(rawText: string): string {
  return rawText
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parses markdown headings (##, ###, ####) while ignoring fenced code blocks.
 */
export function parseMarkdownHeadings(markdown: string): ArticleHeadingItem[] {
  if (!markdown) return [];

  const lines = markdown.split('\n');
  const items: ArticleHeadingItem[] = [];
  let inCodeBlock = false;
  let h2Counter = 0;
  let h3Counter = 0;
  let currentParentId: string | undefined = undefined;
  const seenIds = new Map<string, number>();

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = trimmed.match(/^(#{2,4})\s+(.+)$/);
    if (!match) continue;

    const hashes = match[1];
    const level = hashes.length; // 2, 3, or 4
    const cleanTitle = stripMarkdownFormatting(match[2].replace(/\s*#+\s*$/, ''));
    if (!cleanTitle) continue;

    const baseId = slugifyHeadingText(cleanTitle);
    if (!baseId) continue;

    const count = seenIds.get(baseId) ?? 0;
    seenIds.set(baseId, count + 1);
    const id = count === 0 ? baseId : `${baseId}-${count}`;

    let chapterNumber = '';
    if (level === 2) {
      h2Counter += 1;
      h3Counter = 0;
      currentParentId = id;
      chapterNumber = String(h2Counter).padStart(2, '0');
    } else {
      h3Counter += 1;
      const parentPrefix = h2Counter > 0 ? String(h2Counter).padStart(2, '0') : '01';
      chapterNumber = `${parentPrefix}.${h3Counter}`;
    }

    items.push({
      id,
      title: cleanTitle,
      level,
      chapterNumber,
      parentId: level > 2 ? currentParentId : undefined
    });
  }

  return items;
}

export function ArticleNavigator({
  content,
  articleTitle,
  scrollProgress: externalScrollProgress,
  readingTimeMinutes,
  targetContainerId = 'article-content-body',
  stickyClassName = 'sticky top-20 z-20',
  className = ''
}: ArticleNavigatorProps) {
  const parsedHeadings = useMemo(() => parseMarkdownHeadings(content), [content]);
  const [headings, setHeadings] = useState<ArticleHeadingItem[]>(parsedHeadings);
  const [activeId, setActiveId] = useState<string>('');
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [internalProgress, setInternalProgress] = useState<number>(0);
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [showFilterInput, setShowFilterInput] = useState<boolean>(false);
  const [showSubsections, setShowSubsections] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCollapsedMobile, setIsCollapsedMobile] = useState<boolean>(false);

  const listContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  // Sync parsed markdown headings and enrich/verify against live DOM headings if present
  useEffect(() => {
    setHeadings(parsedHeadings);
    if (parsedHeadings.length > 0 && !activeId) {
      setActiveId(parsedHeadings[0].id);
    }

    const timer = window.setTimeout(() => {
      const container = document.getElementById(targetContainerId);
      if (!container) return;

      const domNodes = Array.from(
        container.querySelectorAll<HTMLElement>('h2[id], h3[id]')
      );
      if (domNodes.length === 0) return;

      // If markdown had no standard ## headings (e.g. raw HTML headings), build from DOM
      if (parsedHeadings.length === 0) {
        let h2Idx = 0;
        let h3Idx = 0;
        let lastH2Id: string | undefined;
        const domItems: ArticleHeadingItem[] = domNodes
          .map((node) => {
            const level = node.tagName.toLowerCase() === 'h3' ? 3 : 2;
            const title = (node.textContent || '').trim();
            const id = node.id;
            if (!id || !title) return null;
            let chapterNumber = '';
            if (level === 2) {
              h2Idx += 1;
              h3Idx = 0;
              lastH2Id = id;
              chapterNumber = String(h2Idx).padStart(2, '0');
            } else {
              h3Idx += 1;
              chapterNumber = `${String(Math.max(1, h2Idx)).padStart(2, '0')}.${h3Idx}`;
            }
            return {
              id,
              title,
              level,
              chapterNumber,
              parentId: level > 2 ? lastH2Id : undefined
            };
          })
          .filter(Boolean) as ArticleHeadingItem[];

        if (domItems.length > 0) {
          setHeadings(domItems);
          setActiveId(domItems[0].id);
        }
      }
    }, 150);

    return () => window.clearTimeout(timer);
  }, [parsedHeadings, targetContainerId]);

  // Real-time scroll spy to track active heading, completed headings, and progress %
  useEffect(() => {
    if (headings.length === 0) return;

    let rafId: number;
    const updateScrollSpy = () => {
      const scrollOffsetThreshold = 135;
      let currentActive = headings[0]?.id || '';
      const nextCompleted = new Set<string>();

      for (let i = 0; i < headings.length; i++) {
        const h = headings[i];
        const el = document.getElementById(h.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();

        if (rect.top <= scrollOffsetThreshold) {
          currentActive = h.id;
          if (i > 0) {
            for (let j = 0; j < i; j++) {
              nextCompleted.add(headings[j].id);
            }
          }
        } else {
          break;
        }
      }

      // Compute reading progress if not externally provided
      const container = document.getElementById(targetContainerId);
      if (container) {
        const rect = container.getBoundingClientRect();
        const viewportH = window.innerHeight;
        const totalScrollable = Math.max(1, rect.height - viewportH * 0.55);
        const scrolled = Math.max(0, 160 - rect.top);
        const pct = Math.min(100, Math.max(0, Math.round((scrolled / totalScrollable) * 100)));
        setInternalProgress(pct);
        if (pct >= 96) {
          headings.forEach((h) => nextCompleted.add(h.id));
        }
      }

      setActiveId(currentActive);
      setCompletedIds(nextCompleted);
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateScrollSpy);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    updateScrollSpy();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [headings, targetContainerId]);

  // Keep active chapter link visible inside the internal scrollable list
  useEffect(() => {
    if (!activeId || !listContainerRef.current) return;
    const activeNode = itemRefs.current[activeId];
    const container = listContainerRef.current;
    if (!activeNode) return;

    const containerRect = container.getBoundingClientRect();
    const nodeRect = activeNode.getBoundingClientRect();

    if (nodeRect.top < containerRect.top + 28 || nodeRect.bottom > containerRect.bottom - 28) {
      const targetScrollTop =
        activeNode.offsetTop - container.offsetTop - container.clientHeight / 2 + activeNode.clientHeight / 2;
      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth'
      });
    }
  }, [activeId]);

  const hasSubsections = useMemo(
    () => headings.some((h) => h.level >= 3),
    [headings]
  );

  const visibleHeadings = useMemo(() => {
    return headings.filter((h) => {
      if (!showSubsections && h.level >= 3) return false;
      if (!filterQuery.trim()) return true;
      const q = filterQuery.toLowerCase();
      return (
        h.title.toLowerCase().includes(q) ||
        h.chapterNumber.toLowerCase().includes(q)
      );
    });
  }, [headings, showSubsections, filterQuery]);

  const jumpToHeading = useCallback(
    (id: string, e?: React.MouseEvent) => {
      if (e) e.preventDefault();
      const element = document.getElementById(id);
      if (element) {
        const headerOffset = 96;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;

        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: 'smooth'
        });
        setActiveId(id);

        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, '', `#${id}`);
        }

        const matchedHeading = headings.find((h) => h.id === id);
        void import('../../services/firebaseAnalyticsService')
          .then(({ trackUxEngagementEvent }) =>
            trackUxEngagementEvent({
              eventName: 'article_toc_click',
              contentType: 'article',
              contentId: id,
              title: articleTitle || 'Compliance Guide',
              category: 'Article Navigation',
              action: `jump_${id}`,
              metadata: {
                section_id: id,
                chapter_number: matchedHeading?.chapterNumber || '01'
              }
            })
          )
          .catch(() => {});
      }
    },
    [headings, articleTitle]
  );

  const handleStepChapter = useCallback(
    (direction: 'prev' | 'next') => {
      if (visibleHeadings.length === 0) return;
      const currentIndex = visibleHeadings.findIndex((h) => h.id === activeId);
      const fallbackIndex = currentIndex === -1 ? 0 : currentIndex;
      const targetIndex =
        direction === 'prev'
          ? Math.max(0, fallbackIndex - 1)
          : Math.min(visibleHeadings.length - 1, fallbackIndex + 1);
      const targetHeading = visibleHeadings[targetIndex];
      if (targetHeading) {
        jumpToHeading(targetHeading.id);
      }
    },
    [visibleHeadings, activeId, jumpToHeading]
  );

  const handleCopyDeepLink = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    setCopiedId(id);
    window.setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 1800);
  }, []);

  if (headings.length === 0) return null;

  const displayProgress =
    typeof externalScrollProgress === 'number' ? externalScrollProgress : internalProgress;
  const activeIndex = headings.findIndex((h) => h.id === activeId);
  const currentStepNumber = activeIndex >= 0 ? activeIndex + 1 : 1;
  const remainingMinutes =
    typeof readingTimeMinutes === 'number' && readingTimeMinutes > 0
      ? Math.max(1, Math.ceil(readingTimeMinutes * (1 - displayProgress / 100)))
      : null;

  return (
    <nav
      aria-label={articleTitle ? `Chapter Navigator for ${articleTitle}` : 'Article Chapter Navigator'}
      className={`${stickyClassName} bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all duration-200 ${className}`}
    >
      {/* Top Progress Strip */}
      <div className="w-full h-1 bg-slate-100 overflow-hidden" aria-hidden="true">
        <div
          className="h-full bg-emerald-600 transition-transform duration-150 origin-left"
          style={{ transform: `scaleX(${Math.min(1, Math.max(0, displayProgress / 100))})` }}
        />
      </div>

      {/* Header Zone */}
      <div className="p-4 pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700 shrink-0">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                Article Navigator
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono tabular-nums">
                <span>
                  Section {currentStepNumber}/{headings.length}
                </span>
                <span aria-hidden="true">&middot;</span>
                <span className="text-emerald-700 font-semibold">{displayProgress}% read</span>
                {remainingMinutes !== null && displayProgress < 98 && (
                  <>
                    <span aria-hidden="true">&middot;</span>
                    <span>{remainingMinutes}m left</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {headings.length > 4 && (
              <button
                type="button"
                onClick={() => {
                  setShowFilterInput((prev) => !prev);
                  if (showFilterInput) setFilterQuery('');
                }}
                title={showFilterInput ? 'Close section filter' : 'Filter chapters'}
                aria-label="Filter chapters"
                className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                  showFilterInput || filterQuery
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            )}

            {hasSubsections && (
              <button
                type="button"
                onClick={() => setShowSubsections((prev) => !prev)}
                title={showSubsections ? 'Show top-level chapters only (H2)' : 'Show all subsections (H2 & H3)'}
                className={`px-2 py-1 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  showSubsections
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:text-slate-900'
                }`}
              >
                {showSubsections ? 'H2+H3' : 'H2 Only'}
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsCollapsedMobile((prev) => !prev)}
              aria-label={isCollapsedMobile ? 'Expand chapter list' : 'Collapse chapter list'}
              className="lg:hidden p-1.5 rounded-lg border border-slate-200/80 bg-slate-50 text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              {isCollapsedMobile ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Optional Quick Filter Input */}
        {showFilterInput && (
          <div className="mt-2.5 relative">
            <ListFilter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Jump to keyword or section..."
              className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {filterQuery && (
              <button
                type="button"
                onClick={() => setFilterQuery('')}
                aria-label="Clear section filter"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Interactive Chapter Jump List */}
      {!isCollapsedMobile && (
        <>
          <div
            ref={listContainerRef}
            className="max-h-[48vh] overflow-y-auto p-2.5 space-y-1 scroll-smooth"
          >
            {visibleHeadings.length === 0 ? (
              <div className="py-6 px-3 text-center text-xs text-slate-500">
                No sections match &ldquo;{filterQuery}&rdquo;.
              </div>
            ) : (
              visibleHeadings.map((heading) => {
                const isActive = activeId === heading.id;
                const isCompleted = completedIds.has(heading.id) && !isActive;
                const isSubsection = heading.level >= 3;
                const isCopied = copiedId === heading.id;

                return (
                  <div
                    key={heading.id}
                    className={`group relative flex items-center rounded-xl transition-colors duration-150 ${
                      isSubsection ? 'ml-3.5' : ''
                    } ${
                      isActive
                        ? 'bg-emerald-50/90 text-emerald-950 ring-1 ring-emerald-200/80'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <a
                      ref={(el) => {
                        itemRefs.current[heading.id] = el;
                      }}
                      href={`#${heading.id}`}
                      onClick={(e) => jumpToHeading(heading.id, e)}
                      aria-current={isActive ? 'location' : undefined}
                      className="flex-1 min-w-0 flex items-start gap-2.5 py-2 pl-2.5 pr-8 text-left"
                    >
                      <span
                        className={`font-mono tabular-nums text-[11px] leading-5 shrink-0 ${
                          isActive
                            ? 'font-bold text-emerald-700'
                            : isCompleted
                            ? 'text-emerald-600/80 font-medium'
                            : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                      >
                        {isCompleted ? (
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-emerald-700">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        ) : (
                          `${heading.chapterNumber}.`
                        )}
                      </span>

                      <span
                        className={`text-xs leading-snug line-clamp-2 transition-colors ${
                          isActive
                            ? 'font-bold text-emerald-950'
                            : isCompleted
                            ? 'font-medium text-slate-600 group-hover:text-slate-900'
                            : 'font-medium text-slate-700 group-hover:text-slate-900'
                        }`}
                      >
                        {heading.title}
                      </span>
                    </a>

                    {/* Copy Section Deep Link Action */}
                    <button
                      type="button"
                      onClick={(e) => handleCopyDeepLink(heading.id, e)}
                      title="Copy direct link to this section"
                      aria-label={`Copy link to ${heading.title}`}
                      className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-[10px] font-medium transition-opacity cursor-pointer ${
                        isCopied
                          ? 'opacity-100 bg-emerald-600 text-white px-1.5'
                          : 'opacity-0 group-hover:opacity-100 focus:opacity-100 text-slate-400 hover:text-emerald-700 hover:bg-emerald-100/60'
                      }`}
                    >
                      {isCopied ? 'Copied' : <Link2 className="w-3 h-3" />}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Interactive Chapter Stepper & Back-to-Top Footer */}
          <div className="px-3 py-2.5 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleStepChapter('prev')}
                disabled={activeIndex <= 0}
                title="Jump to previous section"
                className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <ChevronLeft className="w-3 h-3" />
                <span>Prev</span>
              </button>
              <button
                type="button"
                onClick={() => handleStepChapter('next')}
                disabled={activeIndex >= visibleHeadings.length - 1}
                title="Jump to next section"
                className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>Next</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              title="Scroll back to top of article"
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-800 hover:border-emerald-200 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <ArrowUp className="w-3 h-3 text-emerald-600" />
              <span>Top</span>
            </button>
          </div>
        </>
      )}
    </nav>
  );
}

export default ArticleNavigator;
