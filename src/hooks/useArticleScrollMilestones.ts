import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ScrollMilestonePercent,
  trackScrollMilestone,
  trackUxEngagementEvent
} from '../services/firebaseAnalyticsService';

export const SCROLL_MILESTONE_THRESHOLDS: readonly ScrollMilestonePercent[] = [25, 50, 75, 100];

export interface UseArticleScrollMilestonesOptions {
  /** Unique identifier of the article being read */
  articleId?: string;
  /** Human-readable title of the article */
  articleTitle?: string;
  /** Statutory or compliance category name */
  category?: string;
  /** Estimated reading time in minutes */
  readTimeMin?: number;
  /** DOM element ID wrapping the article body (defaults to 'article-content-body') */
  targetElementId?: string;
  /** Whether tracking is enabled (defaults to true) */
  enabled?: boolean;
}

export interface UseArticleScrollMilestonesResult {
  /** Current scroll progress percentage (0 - 100) relative to #article-content-body */
  scrollProgress: number;
  /** Ordered list of milestones (25, 50, 75, 100) logged in the current article session */
  reachedMilestones: ScrollMilestonePercent[];
  /** Most recently reached scroll milestone */
  lastMilestone: ScrollMilestonePercent | null;
  /** Manually trigger/log a specific scroll milestone */
  logMilestoneManually: (milestone: ScrollMilestonePercent) => Promise<void>;
}

/**
 * Custom hook that monitors article scroll depth relative strictly to `#article-content-body`
 * (excluding footer and comments) and dispatches Firebase Analytics `scroll_milestone` &
 * `article_scroll_depth` events once per threshold per article view, plus `article_engaged`
 * after 15 seconds of active reading + scroll interaction.
 */
export function useArticleScrollMilestones({
  articleId,
  articleTitle = 'Compliance Guide',
  category = 'Income Tax Act 2023',
  readTimeMin = 5,
  targetElementId = 'article-content-body',
  enabled = true
}: UseArticleScrollMilestonesOptions): UseArticleScrollMilestonesResult {
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [reachedMilestones, setReachedMilestones] = useState<ScrollMilestonePercent[]>([]);
  const [lastMilestone, setLastMilestone] = useState<ScrollMilestonePercent | null>(null);

  const firedMilestonesRef = useRef<Set<ScrollMilestonePercent>>(new Set());
  const hasScrolledRef = useRef<boolean>(false);
  const hasFiredEngagedRef = useRef<boolean>(false);
  const sessionStartTimeRef = useRef<number>(Date.now());

  // Reset tracked milestones whenever the user navigates to a different article
  useEffect(() => {
    firedMilestonesRef.current.clear();
    hasScrolledRef.current = false;
    hasFiredEngagedRef.current = false;
    sessionStartTimeRef.current = Date.now();
    setScrollProgress(0);
    setReachedMilestones([]);
    setLastMilestone(null);
  }, [articleId]);

  // Track `article_engaged` after 15 seconds of active reading + scroll interaction
  useEffect(() => {
    if (!enabled || !articleId) return;

    const timer = window.setInterval(() => {
      if (hasFiredEngagedRef.current) return;
      const elapsedSec = Math.round((Date.now() - sessionStartTimeRef.current) / 1000);
      if (elapsedSec >= 15 && hasScrolledRef.current) {
        hasFiredEngagedRef.current = true;
        void trackUxEngagementEvent({
          eventName: 'article_engaged',
          contentType: 'article',
          contentId: articleId,
          title: articleTitle,
          category,
          action: 'active_reading_15s',
          durationSec: elapsedSec,
          metadata: { read_time_min: readTimeMin }
        });
      }
    }, 3000);

    return () => window.clearInterval(timer);
  }, [enabled, articleId, articleTitle, category, readTimeMin]);

  const dispatchMilestone = useCallback(
    async (milestone: ScrollMilestonePercent) => {
      if (!articleId || firedMilestonesRef.current.has(milestone)) return;

      firedMilestonesRef.current.add(milestone);
      const elapsedSec = Math.max(
        1,
        Math.round((Date.now() - sessionStartTimeRef.current) / 1000)
      );

      setReachedMilestones(
        Array.from(firedMilestonesRef.current).sort((a, b) => a - b) as ScrollMilestonePercent[]
      );
      setLastMilestone(milestone);

      await trackScrollMilestone({
        articleId,
        title: articleTitle,
        category,
        milestone,
        durationSec: elapsedSec,
        readTimeMin
      });
    },
    [articleId, articleTitle, category, readTimeMin]
  );

  useEffect(() => {
    if (!enabled || !articleId) return;

    let animationFrameId: number;

    const evaluateScrollPosition = () => {
      const targetElement = document.getElementById(targetElementId);
      let currentPct = 0;

      // Measure scroll depth relative strictly to the article body (#article-content-body), not the whole page
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const startOffset = 180;
        const elementTop = rect.top;
        const elementHeight = rect.height;

        if (elementTop > startOffset) {
          currentPct = 0;
        } else {
          hasScrolledRef.current = true;
          const scrollableDistance = Math.max(1, elementHeight - viewportHeight * 0.6);
          const scrolledPastStart = startOffset - elementTop;
          currentPct = Math.min(
            100,
            Math.max(0, Math.round((scrolledPastStart / scrollableDistance) * 100))
          );
        }
      }

      // Normalize 90%+ scroll depth to 100% completion milestone when reaching the end of the article body
      const effectiveMilestonePct = currentPct >= 90 ? 100 : currentPct;
      setScrollProgress(currentPct);

      for (const milestone of SCROLL_MILESTONE_THRESHOLDS) {
        if (
          effectiveMilestonePct >= milestone &&
          !firedMilestonesRef.current.has(milestone)
        ) {
          void dispatchMilestone(milestone);
        }
      }
    };

    const handleScroll = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(evaluateScrollPosition);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    evaluateScrollPosition();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, [enabled, articleId, targetElementId, dispatchMilestone]);

  return {
    scrollProgress,
    reachedMilestones,
    lastMilestone,
    logMilestoneManually: dispatchMilestone
  };
}

export const useScrollMilestone = useArticleScrollMilestones;
export default useArticleScrollMilestones;
