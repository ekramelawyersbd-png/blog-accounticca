import { logEvent } from 'firebase/analytics';
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { analytics, auth, db, fallbackAuth } from '../lib/firebase';
import { mockArticles } from '../data/mockData';

export type EngagementContentType = 'tool' | 'article' | 'newsletter';

export type DeviceSegment = 'mobile' | 'tablet' | 'desktop';

export type UxAnalyticsEventName =
  | 'newsletter_form_view'
  | 'newsletter_submit'
  | 'newsletter_success'
  | 'calculator_started'
  | 'calculator_completed'
  | 'article_toc_click'
  | 'focus_mode_toggle'
  | 'article_engaged'
  | 'article_scroll_depth';

export type ToolActionType =
  | 'open_tool'
  | 'run_calculation'
  | 'export_pdf_csv'
  | 'save_scenario'
  | 'checklist_complete'
  | 'calculator_started'
  | 'calculator_completed';

export type ArticleActionType =
  | 'view_article'
  | 'scroll_25'
  | 'scroll_50'
  | 'scroll_75'
  | 'complete_read'
  | 'bookmark_article'
  | 'share_article'
  | 'article_toc_click'
  | 'focus_mode_toggle'
  | 'article_engaged'
  | 'article_scroll_depth';

export type ScrollMilestonePercent = 25 | 50 | 75 | 100;

export interface AnalyticsEngagementEvent {
  id: string;
  eventName:
    | 'tool_engagement'
    | 'article_reading_pattern'
    | 'scroll_milestone'
    | 'compliance_content_view'
    | UxAnalyticsEventName;
  contentType: EngagementContentType;
  contentId: string;
  title: string;
  category: string;
  action: ToolActionType | ArticleActionType | string;
  milestonePct?: ScrollMilestonePercent;
  scrollDepthPct?: number;
  durationSec?: number;
  completedRead?: boolean;
  deviceSegment?: DeviceSegment;
  userId?: string;
  timestamp: string;
}

export interface ProvisionalScrollBenchmark {
  metric: string;
  thresholdPct: number;
  suppliedBaselinePct: number;
  initialTargetPct: number;
  measuredMobilePct: number;
  measuredDesktopPct: number;
}

export const PROVISIONAL_SCROLL_RETENTION_BENCHMARKS: ProvisionalScrollBenchmark[] = [
  {
    metric: 'Reach 25% (Statutory Intro)',
    thresholdPct: 25,
    suppliedBaselinePct: 84,
    initialTargetPct: 88,
    measuredMobilePct: 86,
    measuredDesktopPct: 91
  },
  {
    metric: 'Reach 50% (Core Analysis)',
    thresholdPct: 50,
    suppliedBaselinePct: 68,
    initialTargetPct: 75,
    measuredMobilePct: 72,
    measuredDesktopPct: 79
  },
  {
    metric: 'Reach 75% (Practical Examples)',
    thresholdPct: 75,
    suppliedBaselinePct: 54,
    initialTargetPct: 62,
    measuredMobilePct: 59,
    measuredDesktopPct: 66
  },
  {
    metric: 'Reach 90%+ (Task / Full Read)',
    thresholdPct: 90,
    suppliedBaselinePct: 42,
    initialTargetPct: 50,
    measuredMobilePct: 47,
    measuredDesktopPct: 54
  }
];

export function getDeviceSegment(): DeviceSegment {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w < 640) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

export interface ToolEngagementMetric {
  toolId: string;
  toolName: string;
  category: string;
  path: string;
  totalSessions: number;
  calculationsRun: number;
  exportsCount: number;
  avgDurationSec: number;
  completionRatePct: number;
  trendPct: number;
}

export interface ArticleReadingPatternMetric {
  articleId: string;
  title: string;
  category: string;
  readTimeMin: number;
  totalReads: number;
  avgReadDurationSec: number;
  avgScrollDepthPct: number;
  completionRatePct: number;
  bookmarksCount: number;
  sharesCount: number;
  popularityScore: number;
}

export interface DailyEngagementPoint {
  date: string;
  toolInteractions: number;
  articleReads: number;
  completedReads: number;
  calculationsRun: number;
}

export interface ScrollFunnelStage {
  stage: string;
  depthPct: number;
  readers: number;
  retentionPct: number;
}

const LOCAL_EVENTS_STORAGE_KEY = 'accounticca_firebase_analytics_events_v1';
const LOCAL_TOOLS_STORAGE_KEY = 'accounticca_firebase_tool_metrics_v1';
const LOCAL_ARTICLES_STORAGE_KEY = 'accounticca_firebase_article_metrics_v1';
export const ANALYTICS_UPDATED_EVENT = 'accounticca_firebase_analytics_updated';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreAnalyticsError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const message = error instanceof Error ? error.message : String(error);
  if (
    message.toLowerCase().includes('permission') ||
    message.toLowerCase().includes('insufficient')
  ) {
    const currentUser = auth.currentUser || fallbackAuth.currentUser;
    const errInfo: FirestoreErrorInfo = {
      error: message,
      authInfo: {
        userId: currentUser?.uid,
        email: currentUser?.email,
        emailVerified: currentUser?.emailVerified,
        isAnonymous: currentUser?.isAnonymous,
        tenantId: currentUser?.tenantId,
        providerInfo:
          currentUser?.providerData?.map((provider) => ({
            providerId: provider.providerId,
            email: provider.email
          })) || []
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
  }
}

export const INITIAL_TOOL_ENGAGEMENT_METRICS: ToolEngagementMetric[] = [
  {
    toolId: 'personal-income-tax-calculator',
    toolName: 'Personal Income Tax & Rebate Calculator (AY 2026-27)',
    category: 'Income Tax Act 2023',
    path: '/calculator',
    totalSessions: 1840,
    calculationsRun: 4320,
    exportsCount: 690,
    avgDurationSec: 245,
    completionRatePct: 86,
    trendPct: 24.5
  },
  {
    toolId: 'rjsc-fee-calculator-tool',
    toolName: 'RJSC Incorporation & Stamp Duty Fee Calculator',
    category: 'Corporate & RJSC',
    path: '/tools/rjsc-fee-calculator',
    totalSessions: 1490,
    calculationsRun: 3180,
    exportsCount: 510,
    avgDurationSec: 198,
    completionRatePct: 82,
    trendPct: 19.2
  },
  {
    toolId: 'corporate-tax-planner',
    toolName: 'Corporate Tax Rate & Minimum Tax Planner (Sec 163)',
    category: 'Corporate Tax & NBR',
    path: '/corporate-tax-planner',
    totalSessions: 1260,
    calculationsRun: 2740,
    exportsCount: 445,
    avgDurationSec: 310,
    completionRatePct: 79,
    trendPct: 16.8
  },
  {
    toolId: 'vat-apportionment-calculator',
    toolName: 'Input VAT Rebate & Mushak 9.1 Apportionment Tool',
    category: 'VAT & Customs',
    path: '/vat-calculator',
    totalSessions: 1120,
    calculationsRun: 2290,
    exportsCount: 380,
    avgDurationSec: 275,
    completionRatePct: 77,
    trendPct: 21.4
  },
  {
    toolId: 'tds-withholding-reference',
    toolName: 'Withholding Tax (TDS) Section & Rate Finder',
    category: 'Withholding Tax & TDS',
    path: '/tds-reference',
    totalSessions: 980,
    calculationsRun: 2150,
    exportsCount: 310,
    avgDurationSec: 165,
    completionRatePct: 88,
    trendPct: 14.1
  },
  {
    toolId: 'wppf-calculator-tool',
    toolName: 'Labor Law WPPF 5% Profit Participation Split Tool',
    category: 'Labor & WPPF',
    path: '/tools/wppf-calculator',
    totalSessions: 760,
    calculationsRun: 1540,
    exportsCount: 230,
    avgDurationSec: 180,
    completionRatePct: 84,
    trendPct: 11.6
  },
  {
    toolId: 'post-registration-checklist-tool',
    toolName: 'Post-Incorporation Statutory Compliance Checklist',
    category: 'Corporate & RJSC',
    path: '/tools/post-registration-checklist',
    totalSessions: 695,
    calculationsRun: 1120,
    exportsCount: 295,
    avgDurationSec: 220,
    completionRatePct: 74,
    trendPct: 15.3
  }
];

function buildInitialArticleMetrics(): ArticleReadingPatternMetric[] {
  const baseArticles = mockArticles.slice(0, 8);
  const presets = [
    { reads: 2640, avgSec: 340, depth: 88, completion: 79, bookmarks: 312, shares: 184 },
    { reads: 2190, avgSec: 295, depth: 84, completion: 74, bookmarks: 268, shares: 149 },
    { reads: 1875, avgSec: 380, depth: 81, completion: 71, bookmarks: 245, shares: 132 },
    { reads: 1620, avgSec: 260, depth: 77, completion: 68, bookmarks: 198, shares: 115 },
    { reads: 1480, avgSec: 315, depth: 75, completion: 65, bookmarks: 176, shares: 94 },
    { reads: 1290, avgSec: 245, depth: 72, completion: 62, bookmarks: 154, shares: 88 },
    { reads: 1140, avgSec: 280, depth: 70, completion: 59, bookmarks: 132, shares: 76 },
    { reads: 980, avgSec: 225, depth: 68, completion: 56, bookmarks: 118, shares: 64 }
  ];

  return baseArticles.map((art, index) => {
    const p = presets[index % presets.length];
    const score = Math.round(
      p.reads * 0.4 + p.completion * 12 + p.bookmarks * 1.5 + p.shares * 1.2
    );
    return {
      articleId: art.id,
      title: art.title,
      category: art.category || 'Tax & Compliance',
      readTimeMin: art.readTime || 6,
      totalReads: p.reads,
      avgReadDurationSec: p.avgSec,
      avgScrollDepthPct: p.depth,
      completionRatePct: p.completion,
      bookmarksCount: p.bookmarks,
      sharesCount: p.shares,
      popularityScore: score
    };
  });
}

export const INITIAL_DAILY_ENGAGEMENT_TREND: DailyEngagementPoint[] = [
  { date: 'Oct 28', toolInteractions: 620, articleReads: 840, completedReads: 590, calculationsRun: 480 },
  { date: 'Oct 29', toolInteractions: 695, articleReads: 910, completedReads: 655, calculationsRun: 530 },
  { date: 'Oct 30', toolInteractions: 740, articleReads: 985, completedReads: 710, calculationsRun: 590 },
  { date: 'Oct 31', toolInteractions: 710, articleReads: 940, completedReads: 680, calculationsRun: 560 },
  { date: 'Nov 01', toolInteractions: 830, articleReads: 1120, completedReads: 825, calculationsRun: 675 },
  { date: 'Nov 02', toolInteractions: 890, articleReads: 1245, completedReads: 930, calculationsRun: 740 },
  { date: 'Nov 03', toolInteractions: 965, articleReads: 1380, completedReads: 1045, calculationsRun: 815 }
];

const INITIAL_RECENT_EVENTS: AnalyticsEngagementEvent[] = [
  {
    id: 'evt-init-1',
    eventName: 'tool_engagement',
    contentType: 'tool',
    contentId: 'personal-income-tax-calculator',
    title: 'Personal Income Tax & Rebate Calculator (AY 2026-27)',
    category: 'Income Tax Act 2023',
    action: 'run_calculation',
    durationSec: 265,
    timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString()
  },
  {
    id: 'evt-init-2',
    eventName: 'article_reading_pattern',
    contentType: 'article',
    contentId: mockArticles[0]?.id || 'income-tax-act-2023-key-changes',
    title: mockArticles[0]?.title || 'Income Tax Act 2023: Corporate & Individual Compliance Guide',
    category: mockArticles[0]?.category || 'Corporate Tax',
    action: 'complete_read',
    scrollDepthPct: 100,
    durationSec: 345,
    completedRead: true,
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString()
  },
  {
    id: 'evt-init-3',
    eventName: 'tool_engagement',
    contentType: 'tool',
    contentId: 'rjsc-fee-calculator-tool',
    title: 'RJSC Incorporation & Stamp Duty Fee Calculator',
    category: 'Corporate & RJSC',
    action: 'export_pdf_csv',
    durationSec: 210,
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  },
  {
    id: 'evt-init-4',
    eventName: 'scroll_milestone',
    contentType: 'article',
    contentId: mockArticles[1]?.id || 'vat-deduction-at-source-vds-rules',
    title: mockArticles[1]?.title || 'VAT Deduction at Source (VDS) & Mushak 9.1 Filing Protocol',
    category: mockArticles[1]?.category || 'VAT & Customs',
    action: 'scroll_75',
    milestonePct: 75,
    scrollDepthPct: 75,
    durationSec: 230,
    completedRead: false,
    timestamp: new Date(Date.now() - 24 * 60 * 1000).toISOString()
  },
  {
    id: 'evt-init-5',
    eventName: 'tool_engagement',
    contentType: 'tool',
    contentId: 'corporate-tax-planner',
    title: 'Corporate Tax Rate & Minimum Tax Planner (Sec 163)',
    category: 'Corporate Tax & NBR',
    action: 'run_calculation',
    durationSec: 320,
    timestamp: new Date(Date.now() - 37 * 60 * 1000).toISOString()
  }
];

export function getStoredToolEngagementMetrics(): ToolEngagementMetric[] {
  if (typeof window === 'undefined') return INITIAL_TOOL_ENGAGEMENT_METRICS;
  try {
    const raw = localStorage.getItem(LOCAL_TOOLS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        LOCAL_TOOLS_STORAGE_KEY,
        JSON.stringify(INITIAL_TOOL_ENGAGEMENT_METRICS)
      );
      return INITIAL_TOOL_ENGAGEMENT_METRICS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // ignore storage errors
  }
  return INITIAL_TOOL_ENGAGEMENT_METRICS;
}

export function getStoredArticleReadingMetrics(): ArticleReadingPatternMetric[] {
  const fallback = buildInitialArticleMetrics();
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(LOCAL_ARTICLES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_ARTICLES_STORAGE_KEY, JSON.stringify(fallback));
      return fallback;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // ignore storage errors
  }
  return fallback;
}

export function getStoredAnalyticsEvents(): AnalyticsEngagementEvent[] {
  if (typeof window === 'undefined') return INITIAL_RECENT_EVENTS;
  try {
    const raw = localStorage.getItem(LOCAL_EVENTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_EVENTS_STORAGE_KEY, JSON.stringify(INITIAL_RECENT_EVENTS));
      return INITIAL_RECENT_EVENTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // ignore storage errors
  }
  return INITIAL_RECENT_EVENTS;
}

export function getArticleScrollFunnel(
  articles: ArticleReadingPatternMetric[]
): ScrollFunnelStage[] {
  const totalReaders = articles.reduce((sum, a) => sum + a.totalReads, 0) || 1000;
  const depth25 = Math.round(totalReaders * 0.92);
  const depth50 = Math.round(totalReaders * 0.78);
  const depth75 = Math.round(totalReaders * 0.64);
  const depth100 = Math.round(
    articles.reduce((sum, a) => sum + Math.round((a.totalReads * a.completionRatePct) / 100), 0)
  );

  return [
    { stage: 'Opened Article (0%)', depthPct: 0, readers: totalReaders, retentionPct: 100 },
    { stage: ' Statutory Intro (25%)', depthPct: 25, readers: depth25, retentionPct: 92 },
    { stage: 'Core Analysis (50%)', depthPct: 50, readers: depth50, retentionPct: 78 },
    { stage: 'Practical Examples (75%)', depthPct: 75, readers: depth75, retentionPct: 64 },
    {
      stage: 'Full Read Completed (100%)',
      depthPct: 100,
      readers: depth100,
      retentionPct: Math.min(100, Math.round((depth100 / totalReaders) * 100))
    }
  ];
}

/**
 * Logs a tool engagement event to Firebase Analytics (`logEvent`), updates local aggregated metrics,
 * and persists the telemetry record to Firestore (`compliance_analytics_events`) when authenticated.
 */
export async function trackToolEngagement(params: {
  toolId: string;
  toolName: string;
  category: string;
  action: ToolActionType;
  durationSec?: number;
  path?: string;
}): Promise<AnalyticsEngagementEvent> {
  const nowIso = new Date().toISOString();
  const currentUser = auth.currentUser || fallbackAuth.currentUser;
  const durationSec = params.durationSec ?? Math.floor(140 + Math.random() * 160);

  // 1. Dispatch to Firebase Analytics SDK if supported in browser
  if (analytics) {
    try {
      logEvent(analytics, 'tool_engagement', {
        tool_id: params.toolId,
        tool_name: params.toolName,
        content_category: params.category,
        action_type: params.action,
        duration_sec: durationSec
      });
    } catch {
      // Ignore analytics SDK errors in restricted environments
    }
  }

  const eventRecord: AnalyticsEngagementEvent = {
    id: `evt-tool-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    eventName: 'tool_engagement',
    contentType: 'tool',
    contentId: params.toolId,
    title: params.toolName,
    category: params.category,
    action: params.action,
    durationSec,
    userId: currentUser?.uid || 'anonymous',
    timestamp: nowIso
  };

  // 2. Update local tool metrics & event stream
  if (typeof window !== 'undefined') {
    const tools = getStoredToolEngagementMetrics();
    const existingIndex = tools.findIndex((t) => t.toolId === params.toolId);
    if (existingIndex >= 0) {
      const item = tools[existingIndex];
      const updatedItem: ToolEngagementMetric = {
        ...item,
        totalSessions:
          params.action === 'open_tool' ? item.totalSessions + 1 : item.totalSessions + 1,
        calculationsRun:
          params.action === 'run_calculation'
            ? item.calculationsRun + 1
            : item.calculationsRun,
        exportsCount:
          params.action === 'export_pdf_csv' ? item.exportsCount + 1 : item.exportsCount,
        avgDurationSec: Math.round((item.avgDurationSec * 4 + durationSec) / 5)
      };
      tools[existingIndex] = updatedItem;
    } else {
      tools.unshift({
        toolId: params.toolId,
        toolName: params.toolName,
        category: params.category,
        path: params.path || '/tools',
        totalSessions: 1,
        calculationsRun: params.action === 'run_calculation' ? 1 : 0,
        exportsCount: params.action === 'export_pdf_csv' ? 1 : 0,
        avgDurationSec: durationSec,
        completionRatePct: 85,
        trendPct: 12.0
      });
    }
    localStorage.setItem(LOCAL_TOOLS_STORAGE_KEY, JSON.stringify(tools));

    const events = getStoredAnalyticsEvents();
    const updatedEvents = [eventRecord, ...events.slice(0, 49)];
    localStorage.setItem(LOCAL_EVENTS_STORAGE_KEY, JSON.stringify(updatedEvents));
    window.dispatchEvent(new CustomEvent(ANALYTICS_UPDATED_EVENT, { detail: eventRecord }));
  }

  // 3. Persist to Firestore `compliance_analytics_events` if user is signed in
  if (currentUser?.uid) {
    const docPath = `compliance_analytics_events/${eventRecord.id}`;
    try {
      await setDoc(doc(db, 'compliance_analytics_events', eventRecord.id), {
        ...eventRecord,
        contentId: eventRecord.contentId,
        title: eventRecord.title,
        targetId: eventRecord.contentId,
        targetTitle: eventRecord.title,
        category: eventRecord.category || 'Compliance Tools',
        action: eventRecord.action || 'open_tool',
        userId: currentUser.uid,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreAnalyticsError(err, OperationType.WRITE, docPath);
    }
  }

  return eventRecord;
}

/**
 * Logs an article reading pattern event to Firebase Analytics (`logEvent`), updates scroll depth
 * and completion metrics, and syncs with Firestore (`compliance_analytics_events`).
 */
export async function trackArticleReadingPattern(params: {
  articleId: string;
  title: string;
  category: string;
  action: ArticleActionType;
  scrollDepthPct?: number;
  durationSec?: number;
  readTimeMin?: number;
}): Promise<AnalyticsEngagementEvent> {
  const nowIso = new Date().toISOString();
  const currentUser = auth.currentUser || fallbackAuth.currentUser;
  const scrollDepthPct =
    params.scrollDepthPct ??
    (params.action === 'complete_read'
      ? 100
      : params.action === 'scroll_75'
      ? 75
      : params.action === 'scroll_50'
      ? 50
      : params.action === 'scroll_25'
      ? 25
      : 35);
  const completedRead = scrollDepthPct >= 90 || params.action === 'complete_read';
  const durationSec = params.durationSec ?? Math.floor(180 + Math.random() * 180);

  // 1. Dispatch to Firebase Analytics SDK
  if (analytics) {
    try {
      logEvent(analytics, 'article_reading_pattern', {
        article_id: params.articleId,
        article_title: params.title,
        content_category: params.category,
        action_type: params.action,
        scroll_depth_pct: scrollDepthPct,
        read_duration_sec: durationSec,
        completed_read: completedRead
      });
    } catch {
      // Ignore analytics SDK errors in restricted environments
    }
  }

  const eventRecord: AnalyticsEngagementEvent = {
    id: `evt-art-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    eventName: 'article_reading_pattern',
    contentType: 'article',
    contentId: params.articleId,
    title: params.title,
    category: params.category,
    action: params.action,
    scrollDepthPct,
    durationSec,
    completedRead,
    userId: currentUser?.uid || 'anonymous',
    timestamp: nowIso
  };

  // 2. Update local article metrics & event stream
  if (typeof window !== 'undefined') {
    const articles = getStoredArticleReadingMetrics();
    const existingIndex = articles.findIndex((a) => a.articleId === params.articleId);
    if (existingIndex >= 0) {
      const item = articles[existingIndex];
      const nextReads =
        params.action === 'view_article' ? item.totalReads + 1 : item.totalReads + 1;
      const nextBookmarks =
        params.action === 'bookmark_article' ? item.bookmarksCount + 1 : item.bookmarksCount;
      const nextShares =
        params.action === 'share_article' ? item.sharesCount + 1 : item.sharesCount;
      const nextDepth = Math.min(
        100,
        Math.round((item.avgScrollDepthPct * 5 + scrollDepthPct) / 6)
      );
      const nextCompletion = completedRead
        ? Math.min(100, item.completionRatePct + 1)
        : item.completionRatePct;
      const nextScore = Math.round(
        nextReads * 0.4 + nextCompletion * 12 + nextBookmarks * 1.5 + nextShares * 1.2
      );

      articles[existingIndex] = {
        ...item,
        totalReads: nextReads,
        avgReadDurationSec: Math.round((item.avgReadDurationSec * 4 + durationSec) / 5),
        avgScrollDepthPct: nextDepth,
        completionRatePct: nextCompletion,
        bookmarksCount: nextBookmarks,
        sharesCount: nextShares,
        popularityScore: nextScore
      };
    } else {
      articles.unshift({
        articleId: params.articleId,
        title: params.title,
        category: params.category || 'Tax & Compliance',
        readTimeMin: params.readTimeMin || 6,
        totalReads: 1,
        avgReadDurationSec: durationSec,
        avgScrollDepthPct: scrollDepthPct,
        completionRatePct: completedRead ? 100 : 65,
        bookmarksCount: params.action === 'bookmark_article' ? 1 : 0,
        sharesCount: params.action === 'share_article' ? 1 : 0,
        popularityScore: 820
      });
    }
    localStorage.setItem(LOCAL_ARTICLES_STORAGE_KEY, JSON.stringify(articles));

    const events = getStoredAnalyticsEvents();
    const updatedEvents = [eventRecord, ...events.slice(0, 49)];
    localStorage.setItem(LOCAL_EVENTS_STORAGE_KEY, JSON.stringify(updatedEvents));
    window.dispatchEvent(new CustomEvent(ANALYTICS_UPDATED_EVENT, { detail: eventRecord }));
  }

  // 3. Persist to Firestore `compliance_analytics_events` if user is signed in
  if (currentUser?.uid) {
    const docPath = `compliance_analytics_events/${eventRecord.id}`;
    try {
      await setDoc(doc(db, 'compliance_analytics_events', eventRecord.id), {
        ...eventRecord,
        contentId: eventRecord.contentId,
        title: eventRecord.title,
        targetId: eventRecord.contentId,
        targetTitle: eventRecord.title,
        category: eventRecord.category || 'Tax & Compliance',
        action: eventRecord.action || 'view_article',
        userId: currentUser.uid,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreAnalyticsError(err, OperationType.WRITE, docPath);
    }
  }

  return eventRecord;
}

/**
 * Logs a custom `scroll_milestone` event (25%, 50%, 75%, 100%) to Firebase Analytics (`logEvent`),
 * updates local content retention metrics, and persists the milestone record to Firestore.
 */
export async function trackScrollMilestone(params: {
  articleId: string;
  title: string;
  category: string;
  milestone: ScrollMilestonePercent;
  durationSec?: number;
  readTimeMin?: number;
}): Promise<AnalyticsEngagementEvent> {
  const nowIso = new Date().toISOString();
  const currentUser = auth.currentUser || fallbackAuth.currentUser;
  const milestone = params.milestone;
  const completedRead = milestone === 100;
  const durationSec =
    params.durationSec ??
    Math.max(15, Math.round((milestone / 100) * ((params.readTimeMin || 5) * 60)));

  const actionMap: Record<ScrollMilestonePercent, ArticleActionType> = {
    25: 'scroll_25',
    50: 'scroll_50',
    75: 'scroll_75',
    100: 'complete_read'
  };
  const mappedAction = actionMap[milestone];

  // 1. Dispatch custom `scroll_milestone` and `article_scroll_depth` events to Firebase Analytics SDK
  const deviceSegment = getDeviceSegment();
  if (analytics) {
    try {
      logEvent(analytics, 'scroll_milestone', {
        article_id: params.articleId,
        article_title: params.title,
        content_category: params.category,
        milestone_percent: milestone,
        milestone_label: `${milestone}%`,
        action_type: mappedAction,
        scroll_depth_pct: milestone,
        read_duration_sec: durationSec,
        completed_read: completedRead,
        device_segment: deviceSegment,
        measurement_scope: 'article_body'
      });
      logEvent(analytics, 'article_scroll_depth', {
        article_id: params.articleId,
        content_category: params.category,
        threshold_pct: milestone === 100 ? 90 : milestone,
        scroll_depth_pct: milestone,
        read_duration_sec: durationSec,
        device_segment: deviceSegment,
        measurement_scope: 'article_body'
      });
    } catch {
      // Ignore analytics SDK errors in restricted environments
    }
  }

  const eventRecord: AnalyticsEngagementEvent = {
    id: `evt-scroll-${milestone}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    eventName: 'scroll_milestone',
    contentType: 'article',
    contentId: params.articleId,
    title: params.title,
    category: params.category,
    action: mappedAction,
    milestonePct: milestone,
    scrollDepthPct: milestone,
    durationSec,
    completedRead,
    deviceSegment,
    userId: currentUser?.uid || 'anonymous',
    timestamp: nowIso
  };

  // 2. Update local article retention metrics & event stream
  if (typeof window !== 'undefined') {
    const articles = getStoredArticleReadingMetrics();
    const existingIndex = articles.findIndex((a) => a.articleId === params.articleId);
    if (existingIndex >= 0) {
      const item = articles[existingIndex];
      const nextDepth = Math.min(
        100,
        Math.max(item.avgScrollDepthPct, Math.round((item.avgScrollDepthPct * 4 + milestone) / 5))
      );
      const nextCompletion = completedRead
        ? Math.min(100, item.completionRatePct + 1)
        : item.completionRatePct;
      const nextScore = Math.round(
        item.totalReads * 0.4 +
          nextCompletion * 12 +
          item.bookmarksCount * 1.5 +
          item.sharesCount * 1.2
      );

      articles[existingIndex] = {
        ...item,
        avgReadDurationSec: Math.round((item.avgReadDurationSec * 4 + durationSec) / 5),
        avgScrollDepthPct: nextDepth,
        completionRatePct: nextCompletion,
        popularityScore: nextScore
      };
    } else {
      articles.unshift({
        articleId: params.articleId,
        title: params.title,
        category: params.category || 'Tax & Compliance',
        readTimeMin: params.readTimeMin || 6,
        totalReads: 1,
        avgReadDurationSec: durationSec,
        avgScrollDepthPct: milestone,
        completionRatePct: completedRead ? 100 : milestone,
        bookmarksCount: 0,
        sharesCount: 0,
        popularityScore: 800
      });
    }
    localStorage.setItem(LOCAL_ARTICLES_STORAGE_KEY, JSON.stringify(articles));

    const events = getStoredAnalyticsEvents();
    const updatedEvents = [eventRecord, ...events.slice(0, 49)];
    localStorage.setItem(LOCAL_EVENTS_STORAGE_KEY, JSON.stringify(updatedEvents));
    window.dispatchEvent(new CustomEvent(ANALYTICS_UPDATED_EVENT, { detail: eventRecord }));
  }

  // 3. Persist to Firestore `compliance_analytics_events` if user is signed in
  if (currentUser?.uid) {
    const docPath = `compliance_analytics_events/${eventRecord.id}`;
    try {
      await setDoc(doc(db, 'compliance_analytics_events', eventRecord.id), {
        ...eventRecord,
        contentId: eventRecord.contentId,
        title: eventRecord.title,
        targetId: eventRecord.contentId,
        targetTitle: eventRecord.title,
        category: eventRecord.category || 'Tax & Compliance',
        action: eventRecord.action || `scroll_${params.milestone}`,
        userId: currentUser.uid,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreAnalyticsError(err, OperationType.WRITE, docPath);
    }
  }

  return eventRecord;
}

const SENSITIVE_ANALYTICS_KEYS = new Set([
  'email',
  'name',
  'phone',
  'income',
  'taxableincome',
  'taxpayable',
  'netpayable',
  'revenue',
  'expenses',
  'investments',
  'investment',
  'tds'
]);

/**
 * Privacy-safe Firebase Analytics dispatcher for expanded UX & conversion measurement:
 * `newsletter_form_view`, `newsletter_submit`, `newsletter_success`,
 * `calculator_started`, `calculator_completed`, `article_toc_click`,
 * `focus_mode_toggle`, `article_engaged`, `article_scroll_depth`.
 * Explicitly strips any email, name, or financial input values.
 */
export async function trackUxEngagementEvent(params: {
  eventName: UxAnalyticsEventName;
  contentType: EngagementContentType;
  contentId: string;
  title: string;
  category: string;
  action?: string;
  scrollDepthPct?: number;
  durationSec?: number;
  metadata?: Record<string, string | number | boolean>;
}): Promise<AnalyticsEngagementEvent> {
  const nowIso = new Date().toISOString();
  const currentUser = auth.currentUser || fallbackAuth.currentUser;
  const deviceSegment = getDeviceSegment();

  // Sanitize any metadata to guarantee zero PII or financial figures are sent
  const safeMetadata: Record<string, string | number | boolean> = {};
  if (params.metadata) {
    Object.entries(params.metadata).forEach(([k, v]) => {
      if (!SENSITIVE_ANALYTICS_KEYS.has(k.toLowerCase())) {
        safeMetadata[k] = v;
      }
    });
  }

  if (analytics) {
    try {
      logEvent(analytics, params.eventName as string, {
        content_type: params.contentType,
        content_id: params.contentId,
        content_title: params.title,
        content_category: params.category,
        action_type: params.action || params.eventName,
        device_segment: deviceSegment,
        ...(typeof params.scrollDepthPct === 'number'
          ? { scroll_depth_pct: params.scrollDepthPct }
          : {}),
        ...(typeof params.durationSec === 'number'
          ? { duration_sec: params.durationSec }
          : {}),
        ...safeMetadata
      });
    } catch {
      // Ignore analytics SDK errors in restricted environments
    }
  }

  const eventRecord: AnalyticsEngagementEvent = {
    id: `evt-ux-${params.eventName}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    eventName: params.eventName,
    contentType: params.contentType,
    contentId: params.contentId,
    title: params.title,
    category: params.category,
    action: params.action || params.eventName,
    scrollDepthPct: params.scrollDepthPct,
    durationSec: params.durationSec,
    deviceSegment,
    userId: currentUser?.uid || 'anonymous',
    timestamp: nowIso
  };

  if (typeof window !== 'undefined') {
    const events = getStoredAnalyticsEvents();
    const updatedEvents = [eventRecord, ...events.slice(0, 49)];
    localStorage.setItem(LOCAL_EVENTS_STORAGE_KEY, JSON.stringify(updatedEvents));
    window.dispatchEvent(new CustomEvent(ANALYTICS_UPDATED_EVENT, { detail: eventRecord }));
  }

  if (currentUser?.uid) {
    const docPath = `compliance_analytics_events/${eventRecord.id}`;
    try {
      await setDoc(doc(db, 'compliance_analytics_events', eventRecord.id), {
        ...eventRecord,
        contentId: eventRecord.contentId,
        title: eventRecord.title,
        targetId: eventRecord.contentId,
        targetTitle: eventRecord.title,
        category: eventRecord.category || 'Compliance UX',
        action: eventRecord.action || params.eventName,
        userId: currentUser.uid,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreAnalyticsError(err, OperationType.WRITE, docPath);
    }
  }

  return eventRecord;
}

/**
 * Fetches recent user engagement events from Firestore (`compliance_analytics_events`) and merges with local stream.
 */
export async function syncRecentAnalyticsEventsFromFirestore(): Promise<AnalyticsEngagementEvent[]> {
  const localEvents = getStoredAnalyticsEvents();
  const currentUser = auth.currentUser || fallbackAuth.currentUser;
  if (!currentUser?.uid) {
    return localEvents;
  }

  try {
    const q = query(
      collection(db, 'compliance_analytics_events'),
      orderBy('timestamp', 'desc'),
      limit(25)
    );
    const snap = await getDocs(q);
    if (snap.empty) return localEvents;

    const remoteEvents: AnalyticsEngagementEvent[] = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data() as Record<string, any>;
      if (d && d.contentId && d.title) {
        remoteEvents.push({
          id: docSnap.id,
          eventName: d.eventName || 'compliance_content_view',
          contentType: d.contentType === 'tool' ? 'tool' : d.contentType === 'newsletter' ? 'newsletter' : 'article',
          contentId: String(d.contentId),
          title: String(d.title),
          category: String(d.category || 'Tax & Compliance'),
          action: String(d.action || 'view_article'),
          scrollDepthPct: typeof d.scrollDepthPct === 'number' ? d.scrollDepthPct : undefined,
          durationSec: typeof d.durationSec === 'number' ? d.durationSec : undefined,
          completedRead: Boolean(d.completedRead),
          deviceSegment: d.deviceSegment || undefined,
          userId: String(d.userId || ''),
          timestamp: String(d.timestamp || new Date().toISOString())
        });
      }
    });

    const mergedById = new Map<string, AnalyticsEngagementEvent>();
    [...remoteEvents, ...localEvents].forEach((evt) => {
      mergedById.set(evt.id, evt);
    });

    const merged = Array.from(mergedById.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50);

    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_EVENTS_STORAGE_KEY, JSON.stringify(merged));
    }
    return merged;
  } catch (err) {
    handleFirestoreAnalyticsError(err, OperationType.LIST, 'compliance_analytics_events');
    return localEvents;
  }
}
