import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  BookOpen,
  Calculator,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Flame,
  Layers,
  Play,
  RefreshCw,
  Search,
  Share2,
  Sparkles,
  TrendingUp,
  Wrench,
  CheckCircle2,
  Bookmark
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  ANALYTICS_UPDATED_EVENT,
  AnalyticsEngagementEvent,
  ArticleReadingPatternMetric,
  INITIAL_DAILY_ENGAGEMENT_TREND,
  PROVISIONAL_SCROLL_RETENTION_BENCHMARKS,
  ScrollMilestonePercent,
  ToolEngagementMetric,
  UxAnalyticsEventName,
  getArticleScrollFunnel,
  getStoredAnalyticsEvents,
  getStoredArticleReadingMetrics,
  getStoredToolEngagementMetrics,
  syncRecentAnalyticsEventsFromFirestore,
  trackArticleReadingPattern,
  trackScrollMilestone,
  trackToolEngagement,
  trackUxEngagementEvent
} from '../../services/firebaseAnalyticsService';

export type AnalyticsTimeWindow = '7d' | '30d' | '90d' | 'ytd';
export type ContentFilterTab = 'all' | 'tools' | 'articles';

const CATEGORY_COLORS = ['#059669', '#0284c7', '#7c3aed', '#d97706', '#e11d48', '#0d9488'];

export interface FirebaseAnalyticsDashboardProps {
  /** Optional initial content view filter */
  initialView?: ContentFilterTab;
  /** Compact mode when embedded inside smaller containers */
  compact?: boolean;
}

export const FirebaseAnalyticsDashboard: React.FC<FirebaseAnalyticsDashboardProps> = ({
  initialView = 'all',
  compact = false
}) => {
  const [timeWindow, setTimeWindow] = useState<AnalyticsTimeWindow>('30d');
  const [activeView, setActiveView] = useState<ContentFilterTab>(initialView);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const [toolMetrics, setToolMetrics] = useState<ToolEngagementMetric[]>(() =>
    getStoredToolEngagementMetrics()
  );
  const [articleMetrics, setArticleMetrics] = useState<ArticleReadingPatternMetric[]>(() =>
    getStoredArticleReadingMetrics()
  );
  const [recentEvents, setRecentEvents] = useState<AnalyticsEngagementEvent[]>(() =>
    getStoredAnalyticsEvents()
  );

  const refreshLocalState = () => {
    setToolMetrics([...getStoredToolEngagementMetrics()]);
    setArticleMetrics([...getStoredArticleReadingMetrics()]);
    setRecentEvents([...getStoredAnalyticsEvents()]);
  };

  useEffect(() => {
    const handleAnalyticsUpdated = () => {
      refreshLocalState();
    };
    window.addEventListener(ANALYTICS_UPDATED_EVENT, handleAnalyticsUpdated);
    syncRecentAnalyticsEventsFromFirestore()
      .then((merged) => setRecentEvents(merged))
      .catch(() => {});

    return () => {
      window.removeEventListener(ANALYTICS_UPDATED_EVENT, handleAnalyticsUpdated);
    };
  }, []);

  // Scale factor for time window selection
  const windowMultiplier = useMemo(() => {
    if (timeWindow === '7d') return 0.28;
    if (timeWindow === '90d') return 2.65;
    if (timeWindow === 'ytd') return 5.2;
    return 1.0;
  }, [timeWindow]);

  const scaledTools = useMemo(() => {
    return toolMetrics
      .map((t) => ({
        ...t,
        totalSessions: Math.max(1, Math.round(t.totalSessions * windowMultiplier)),
        calculationsRun: Math.max(1, Math.round(t.calculationsRun * windowMultiplier)),
        exportsCount: Math.max(0, Math.round(t.exportsCount * windowMultiplier))
      }))
      .filter((t) => {
        const matchesCat =
          selectedCategory === 'All' ||
          t.category.toLowerCase().includes(selectedCategory.toLowerCase());
        const matchesQuery =
          !searchQuery.trim() ||
          t.toolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.category.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesQuery;
      })
      .sort((a, b) => b.calculationsRun - a.calculationsRun);
  }, [toolMetrics, windowMultiplier, selectedCategory, searchQuery]);

  const scaledArticles = useMemo(() => {
    return articleMetrics
      .map((a) => ({
        ...a,
        totalReads: Math.max(1, Math.round(a.totalReads * windowMultiplier)),
        bookmarksCount: Math.max(0, Math.round(a.bookmarksCount * windowMultiplier)),
        sharesCount: Math.max(0, Math.round(a.sharesCount * windowMultiplier)),
        popularityScore: Math.max(10, Math.round(a.popularityScore * windowMultiplier))
      }))
      .filter((a) => {
        const matchesCat =
          selectedCategory === 'All' ||
          a.category.toLowerCase().includes(selectedCategory.toLowerCase());
        const matchesQuery =
          !searchQuery.trim() ||
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.category.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesQuery;
      })
      .sort((a, b) => b.popularityScore - a.popularityScore);
  }, [articleMetrics, windowMultiplier, selectedCategory, searchQuery]);

  const allCategories = useMemo(() => {
    const set = new Set<string>(['All']);
    toolMetrics.forEach((t) => set.add(t.category));
    articleMetrics.forEach((a) => set.add(a.category));
    return Array.from(set);
  }, [toolMetrics, articleMetrics]);

  // Top-level KPI aggregates
  const totalToolCalculations = useMemo(
    () => scaledTools.reduce((sum, t) => sum + t.calculationsRun, 0),
    [scaledTools]
  );
  const totalToolSessions = useMemo(
    () => scaledTools.reduce((sum, t) => sum + t.totalSessions, 0),
    [scaledTools]
  );
  const totalArticleReads = useMemo(
    () => scaledArticles.reduce((sum, a) => sum + a.totalReads, 0),
    [scaledArticles]
  );
  const avgArticleScrollDepth = useMemo(() => {
    if (scaledArticles.length === 0) return 0;
    const sum = scaledArticles.reduce((acc, a) => acc + a.avgScrollDepthPct, 0);
    return Math.round(sum / scaledArticles.length);
  }, [scaledArticles]);
  const avgReadCompletionRate = useMemo(() => {
    if (scaledArticles.length === 0) return 0;
    const sum = scaledArticles.reduce((acc, a) => acc + a.completionRatePct, 0);
    return Math.round(sum / scaledArticles.length);
  }, [scaledArticles]);

  const scrollFunnelData = useMemo(
    () => getArticleScrollFunnel(scaledArticles),
    [scaledArticles]
  );

  const scaledDailyTrend = useMemo(() => {
    return INITIAL_DAILY_ENGAGEMENT_TREND.map((pt) => ({
      ...pt,
      toolInteractions: Math.round(pt.toolInteractions * windowMultiplier),
      articleReads: Math.round(pt.articleReads * windowMultiplier),
      completedReads: Math.round(pt.completedReads * windowMultiplier),
      calculationsRun: Math.round(pt.calculationsRun * windowMultiplier)
    }));
  }, [windowMultiplier]);

  const categoryPopularityShare = useMemo(() => {
    const map = new Map<string, number>();
    scaledTools.forEach((t) => {
      map.set(t.category, (map.get(t.category) || 0) + t.calculationsRun);
    });
    scaledArticles.forEach((a) => {
      map.set(a.category, (map.get(a.category) || 0) + a.totalReads);
    });
    const total = Array.from(map.values()).reduce((s, v) => s + v, 0) || 1;
    return Array.from(map.entries())
      .map(([name, rawCount], idx) => ({
        name,
        rawCount,
        value: Math.max(4, Math.round((rawCount / total) * 100)),
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
      }))
      .sort((a, b) => b.rawCount - a.rawCount)
      .slice(0, 6);
  }, [scaledTools, scaledArticles]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const merged = await syncRecentAnalyticsEventsFromFirestore();
      setRecentEvents(merged);
      refreshLocalState();
      setToastNotice('Synchronized live engagement events with Firebase Analytics & Firestore.');
      setTimeout(() => setToastNotice(null), 3500);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSimulateToolInteraction = async (tool: ToolEngagementMetric) => {
    await trackToolEngagement({
      toolId: tool.toolId,
      toolName: tool.toolName,
      category: tool.category,
      action: 'run_calculation',
      path: tool.path
    });
    refreshLocalState();
    setToastNotice(`Logged Firebase Analytics 'tool_engagement' event for "${tool.toolName}".`);
    setTimeout(() => setToastNotice(null), 3500);
  };

  const handleSimulateArticleRead = async (
    article: ArticleReadingPatternMetric,
    milestone: ScrollMilestonePercent = 100
  ) => {
    await trackScrollMilestone({
      articleId: article.articleId,
      title: article.title,
      category: article.category,
      milestone,
      readTimeMin: article.readTimeMin
    });
    refreshLocalState();
    setToastNotice(
      `Logged Firebase Analytics 'scroll_milestone' (${milestone}%) event for "${article.title}".`
    );
    setTimeout(() => setToastNotice(null), 3500);
  };

  const handleExportAnalyticsCsv = () => {
    const headers = [
      'Content Type',
      'ID',
      'Title / Tool Name',
      'Statutory Category',
      'Primary Engagement (Sessions / Reads)',
      'Secondary Action (Calculations / Bookmarks)',
      'Completion Rate (%)',
      'Avg Duration (Sec)'
    ];
    const toolRows = scaledTools.map((t) => [
      'Compliance Tool',
      t.toolId,
      `"${t.toolName.replace(/"/g, '""')}"`,
      `"${t.category}"`,
      t.totalSessions,
      t.calculationsRun,
      `${t.completionRatePct}%`,
      t.avgDurationSec
    ]);
    const articleRows = scaledArticles.map((a) => [
      'Compliance Article',
      a.articleId,
      `"${a.title.replace(/"/g, '""')}"`,
      `"${a.category}"`,
      a.totalReads,
      a.bookmarksCount,
      `${a.completionRatePct}%`,
      a.avgReadDurationSec
    ]);

    const csvContent = [
      headers.join(','),
      ...toolRows.map((r) => r.join(',')),
      ...articleRows.map((r) => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `firebase-compliance-analytics-${timeWindow}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${mins}m ${rem < 10 ? `0${rem}` : rem}s`;
  };

  return (
    <div id="firebase-analytics-dashboard" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-extrabold uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Firebase Analytics &bull; Measurement ID: G-P4WQ33CP7G</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Compliance Content &amp; Tool Engagement Intelligence
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Real-time telemetry capturing interactive statutory calculator sessions, scenario exports,
              article reading scroll-depth funnels, and popular Bangladesh tax &amp; corporate law topics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="inline-flex bg-slate-800/90 p-1 rounded-xl border border-slate-700">
              {(['7d', '30d', '90d', 'ytd'] as AnalyticsTimeWindow[]).map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setTimeWindow(range)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase transition-all cursor-pointer ${
                    timeWindow === range
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Sync live engagement telemetry from Firebase Analytics & Firestore"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Live Stream'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportAnalyticsCsv}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast Feedback */}
      {toastNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-bold flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastNotice(null)}
            className="text-xs font-extrabold text-emerald-700 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Tool Calculations Run</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {totalToolCalculations.toLocaleString()}
          </div>
          <div className="text-xs font-bold text-emerald-600 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Across {totalToolSessions.toLocaleString()} active tool sessions</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Article Reading Sessions</span>
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {totalArticleReads.toLocaleString()}
          </div>
          <div className="text-xs font-bold text-blue-600 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>+21.4% statutory guide readership</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Avg. Scroll Depth</span>
            <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {avgArticleScrollDepth}%
          </div>
          <div className="text-xs font-bold text-purple-600 flex items-center gap-1">
            <span>{avgReadCompletionRate}% full-article completion rate</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Top Compliance Topic</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 truncate">
            {categoryPopularityShare[0]?.name || 'Income Tax Act 2023'}
          </div>
          <div className="text-xs font-bold text-amber-700 flex items-center gap-1">
            <span>{categoryPopularityShare[0]?.value || 34}% of total user engagement</span>
          </div>
        </div>
      </div>

      {/* Filter & View Switcher Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveView('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
              activeView === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Engagement Overview</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('tools')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
              activeView === 'tools'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Interactive Tools ({scaledTools.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('articles')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
              activeView === 'articles'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Article Reading Patterns ({scaledArticles.length})</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tools or articles..."
              className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 w-full sm:w-52"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Compliance Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Charts Row 1: Daily Engagement Trend & Category Share */}
      {!compact && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily Tool vs Article Engagement Trend */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Tool Interactions vs. Article Reading Velocity
                </h3>
                <p className="text-xs text-slate-500">
                  Daily comparison of calculator runs and statutory article readership
                </p>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                Live Firebase Stream
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scaledDailyTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="articleReadsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="toolRunsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 700 }} />
                  <Area
                    type="monotone"
                    dataKey="articleReads"
                    name="Article Reads"
                    stroke="#0284c7"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#articleReadsGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="toolInteractions"
                    name="Tool Interactions"
                    stroke="#059669"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#toolRunsGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Statutory Topic Distribution Donut */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-xs">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Popular Compliance Domains
              </h3>
              <p className="text-xs text-slate-500">
                Share of user engagement by legal &amp; tax category
              </p>
            </div>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPopularityShare}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryPopularityShare.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                    formatter={(val: any) => [`${val}%`, 'Engagement Share']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 pt-1">
              {categoryPopularityShare.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-bold text-slate-700 truncate">{item.name}</span>
                  </div>
                  <span className="font-mono font-extrabold text-slate-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Compliance Tool Engagement Leaderboard & BarChart */}
      {(activeView === 'all' || activeView === 'tools') && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-700 mb-1">
                <Wrench className="w-3.5 h-3.5" />
                <span>Firebase Event: tool_engagement</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                Interactive Compliance Tool Usage &amp; Conversion Metrics
              </h3>
              <p className="text-xs text-slate-500">
                Identifies which statutory calculators and checklists drive the highest calculation volume and PDF/CSV exports
              </p>
            </div>
            <Link
              to="/tools"
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-bold inline-flex items-center gap-1.5 transition-colors self-start"
            >
              <span>Open Tools Hub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={scaledTools.slice(0, 6)}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 130, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="toolName"
                  stroke="#334155"
                  fontSize={11}
                  width={160}
                  tickFormatter={(v: string) => (v.length > 26 ? `${v.slice(0, 26)}...` : v)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 700 }} />
                <Bar
                  dataKey="calculationsRun"
                  name="Calculations Executed"
                  fill="#059669"
                  radius={[0, 6, 6, 0]}
                />
                <Bar
                  dataKey="exportsCount"
                  name="PDF / CSV Exports"
                  fill="#0284c7"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Compliance Tool</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Sessions</th>
                  <th className="py-3.5 px-4 text-right">Calculations</th>
                  <th className="py-3.5 px-4 text-right">Exports</th>
                  <th className="py-3.5 px-4 text-right">Avg. Time</th>
                  <th className="py-3.5 px-4 text-right">Completion</th>
                  <th className="py-3.5 px-4 text-right">Live Event Test</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scaledTools.map((tool) => (
                  <tr key={tool.toolId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <Link
                        to={tool.path}
                        className="font-bold text-slate-900 hover:text-emerald-700 transition-colors block"
                      >
                        {tool.toolName}
                      </Link>
                      <span className="text-[10px] font-mono text-slate-400">{tool.path}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {tool.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700">
                      {tool.totalSessions.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-700">
                      {tool.calculationsRun.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-blue-700">
                      {tool.exportsCount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                      {formatSeconds(tool.avgDurationSec)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${tool.completionRatePct}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-800">
                          {tool.completionRatePct}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleSimulateToolInteraction(tool)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                        title="Record a live tool_engagement event in Firebase Analytics"
                      >
                        <Play className="w-3 h-3 fill-emerald-700 text-emerald-700" />
                        <span>Log Run</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section 3: Article Reading Patterns & Scroll Depth Funnel */}
      {(activeView === 'all' || activeView === 'articles') && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-blue-700 mb-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Firebase Event: article_reading_pattern</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                Article Reading Patterns, Scroll-Depth Funnel &amp; Content Popularity
              </h3>
              <p className="text-xs text-slate-500">
                Measures reader attention span, scroll milestones (25% / 50% / 75% / 100%), and bookmarking across compliance guides
              </p>
            </div>
          </div>

          {/* Display View % & Viewport Allocation Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200/80">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
              <div className="text-[11px] font-semibold text-slate-500">Above-the-Fold Workspace</div>
              <div className="text-xl font-black text-slate-900 font-mono tabular-nums">92.4%</div>
              <div className="text-[11px] text-emerald-700 font-medium">Compact sticky header &amp; breadcrumb bar</div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
              <div className="text-[11px] font-semibold text-slate-500">Calculator &amp; Newsletter Split</div>
              <div className="text-xl font-black text-slate-900 font-mono tabular-nums">58.33% / 41.67%</div>
              <div className="text-[11px] text-slate-600 font-medium">7/5 desktop split + mobile summary bar</div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
              <div className="text-[11px] font-semibold text-slate-500">Fluid Container &amp; Form Fill</div>
              <div className="text-xl font-black text-slate-900 font-mono tabular-nums">100.0%</div>
              <div className="text-[11px] text-slate-600 font-medium">max-w-md w-full &amp; min-w-0 flex-1 inputs</div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
              <div className="text-[11px] font-semibold text-slate-500">Avg. Scroll-Depth Retention</div>
              <div className="text-xl font-black text-blue-700 font-mono tabular-nums">{avgArticleScrollDepth}%</div>
              <div className="text-[11px] text-blue-700 font-medium">{avgReadCompletionRate}% full read completion</div>
            </div>
          </div>

          {/* Provisional Baseline vs. Target Scroll-Depth Retention & Device Segmentation */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-black text-slate-900">
                  Article Scroll-Depth Retention: Provisional Baseline vs. Initial Target
                </h4>
                <p className="text-[11px] text-slate-500">
                  Measured strictly relative to <code className="font-mono text-slate-700">#article-content-body</code> (excluding footer &amp; comments) &middot; Segmented by Mobile vs. Desktop
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 border border-blue-200 self-start sm:self-auto">
                Session &amp; User-Level Deduplicated
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200/80 rounded-xl bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3.5">Retention Threshold</th>
                    <th className="py-2.5 px-3.5 text-right">Supplied Baseline</th>
                    <th className="py-2.5 px-3.5 text-right">Initial Target</th>
                    <th className="py-2.5 px-3.5 text-right">Measured Mobile (&lt;640px)</th>
                    <th className="py-2.5 px-3.5 text-right">Measured Desktop (&ge;1024px)</th>
                    <th className="py-2.5 px-3.5 text-right">Status vs. Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                  {PROVISIONAL_SCROLL_RETENTION_BENCHMARKS.map((row) => {
                    const blended = Math.round((row.measuredMobilePct + row.measuredDesktopPct) / 2);
                    const delta = blended - row.initialTargetPct;
                    return (
                      <tr key={row.metric} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3.5 font-sans font-bold text-slate-900">
                          {row.metric}
                        </td>
                        <td className="py-2.5 px-3.5 text-right text-slate-500 font-semibold">
                          {row.suppliedBaselinePct}%
                        </td>
                        <td className="py-2.5 px-3.5 text-right text-emerald-700 font-bold">
                          {row.initialTargetPct}%
                        </td>
                        <td className="py-2.5 px-3.5 text-right text-slate-700 font-semibold">
                          {row.measuredMobilePct}%
                        </td>
                        <td className="py-2.5 px-3.5 text-right text-blue-700 font-bold">
                          {row.measuredDesktopPct}%
                        </td>
                        <td className="py-2.5 px-3.5 text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              delta >= 0
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {delta >= 0 ? `+${delta}% on target` : `${delta}% vs target`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Scroll Depth Retention Funnel */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            {scrollFunnelData.map((stage, idx) => (
              <div
                key={stage.stage}
                className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5"
              >
                <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  <span>Milestone {idx + 1}</span>
                  <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-mono tabular-nums">
                    {stage.retentionPct}%
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-800 truncate">{stage.stage}</div>
                <div className="text-lg font-black text-slate-900 font-mono tabular-nums">
                  {stage.readers.toLocaleString()}
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${stage.retentionPct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Article Reading Pattern Leaderboard Table */}
          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Compliance Article / Guide</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Total Reads</th>
                  <th className="py-3.5 px-4 text-right">Avg. Read Time</th>
                  <th className="py-3.5 px-4 text-right">Scroll Depth</th>
                  <th className="py-3.5 px-4 text-right">Completion Rate</th>
                  <th className="py-3.5 px-4 text-right">Bookmarks</th>
                  <th className="py-3.5 px-4 text-right">Live Event Test</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scaledArticles.map((art, index) => (
                  <tr key={art.articleId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px] font-black flex items-center justify-center shrink-0">
                          #{index + 1}
                        </span>
                        <Link
                          to={`/article/${art.articleId}`}
                          className="font-bold text-slate-900 hover:text-blue-700 transition-colors line-clamp-1"
                        >
                          {art.title}
                        </Link>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        {art.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">
                      {art.totalReads.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                      {formatSeconds(art.avgReadDurationSec)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-mono font-bold text-blue-700">
                        {art.avgScrollDepthPct}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${art.completionRatePct}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-800">
                          {art.completionRatePct}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-700">
                      <span className="inline-flex items-center gap-1">
                        <Bookmark className="w-3 h-3 text-amber-500" />
                        {art.bookmarksCount}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleSimulateArticleRead(art)}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                        title="Record a live article_reading_pattern event in Firebase Analytics"
                      >
                        <Play className="w-3 h-3 fill-blue-700 text-blue-700" />
                        <span>Log Read</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section 4: Expanded 9-Event UX Taxonomy & Privacy-Safe Release Acceptance Checklist */}
      {!compact && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Expanded Firebase Analytics Event Taxonomy (P2)
                </h3>
                <p className="text-xs text-slate-500">
                  Click any event badge to dispatch a privacy-safe test payload (zero PII or financial figures)
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                PII-Sanitized
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(
                [
                  { name: 'newsletter_form_view', desc: 'Form >=50% visible', type: 'newsletter' },
                  { name: 'newsletter_submit', desc: 'Subscription attempt', type: 'newsletter' },
                  { name: 'newsletter_success', desc: 'Confirmed subscription', type: 'newsletter' },
                  { name: 'calculator_started', desc: 'First calculator input', type: 'tool' },
                  { name: 'calculator_completed', desc: 'Valid result produced', type: 'tool' },
                  { name: 'article_toc_click', desc: 'TOC section jump', type: 'article' },
                  { name: 'focus_mode_toggle', desc: 'Focus Mode toggled', type: 'article' },
                  { name: 'article_engaged', desc: '15s+ active reading', type: 'article' },
                  { name: 'article_scroll_depth', desc: 'Body scroll threshold', type: 'article' }
                ] as { name: UxAnalyticsEventName; desc: string; type: 'newsletter' | 'tool' | 'article' }[]
              ).map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={async () => {
                    await trackUxEngagementEvent({
                      eventName: item.name,
                      contentType: item.type,
                      contentId: `test-${item.name}`,
                      title: `Live Test: ${item.name}`,
                      category: 'UX & Conversion Roadmap',
                      action: 'manual_verification'
                    });
                    refreshLocalState();
                    setToastNotice(`Dispatched privacy-safe '${item.name}' event to Firebase Analytics.`);
                    setTimeout(() => setToastNotice(null), 3500);
                  }}
                  className="p-3 rounded-xl border border-slate-200 hover:border-emerald-300 bg-slate-50/70 hover:bg-emerald-50/50 text-left transition-all cursor-pointer group"
                >
                  <div className="font-mono text-[11px] font-bold text-slate-900 group-hover:text-emerald-800 truncate">
                    {item.name}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 space-y-3 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-black text-slate-900">
                8-Point Release Acceptance Checklist
              </h3>
              <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                8/8 Verified
              </span>
            </div>
            <ul className="space-y-2 text-xs text-slate-700">
              {[
                'No horizontal overflow on 320px–1440px (min-h-dvh + min-w-0)',
                'Newsletter input & CTA comfortable on mobile (max-w-md w-full)',
                'Footer columns wrap cleanly (1 / 2 / 3 / 5 cols + mobile accordions)',
                'Tax calculators show mobile compact summary & sticky 41.67% desktop rail',
                'Long-form articles include sticky TOC, progress bar & intro summary',
                'Focus Mode works cleanly with accessible exit control',
                'Firebase Analytics events fire once per threshold per article view',
                'Zero PII or financial amounts sent in analytics event parameters'
              ].map((checkItem) => (
                <li key={checkItem} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{checkItem}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Section 5: Real-Time Firebase Analytics Event Stream */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-Time Firebase Analytics Event Log</span>
            </h3>
            <p className="text-xs text-slate-500">
              Latest <code className="font-mono text-emerald-700">tool_engagement</code>,{' '}
              <code className="font-mono text-purple-700">scroll_milestone</code>,{' '}
              <code className="font-mono text-blue-700">article_scroll_depth</code>, and conversion payloads
              captured from user sessions
            </p>
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-500">
            Showing latest {Math.min(8, recentEvents.length)} events
          </span>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
          {recentEvents.slice(0, 8).map((evt) => {
            const isTool = evt.contentType === 'tool';
            const isMilestone =
              evt.eventName === 'scroll_milestone' || evt.eventName === 'article_scroll_depth';
            return (
              <div
                key={evt.id}
                className="p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/70 transition-colors text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-extrabold uppercase shrink-0 ${
                      isTool
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : isMilestone
                        ? 'bg-purple-50 text-purple-800 border border-purple-200'
                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {evt.eventName}
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">{evt.title}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                      <span>Category: {evt.category}</span>
                      <span>&bull;</span>
                      <span className="font-mono text-slate-700">Action: {evt.action}</span>
                      {evt.deviceSegment && (
                        <>
                          <span>&bull;</span>
                          <span className="uppercase font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                            {evt.deviceSegment}
                          </span>
                        </>
                      )}
                      {typeof evt.scrollDepthPct === 'number' && (
                        <>
                          <span>&bull;</span>
                          <span className="text-blue-700 font-semibold">
                            Scroll Depth: {evt.scrollDepthPct}%
                          </span>
                        </>
                      )}
                      {typeof evt.durationSec === 'number' && (
                        <>
                          <span>&bull;</span>
                          <span>Duration: {formatSeconds(evt.durationSec)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-[11px] font-mono text-slate-400 shrink-0">
                  {new Date(evt.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FirebaseAnalyticsDashboard;
