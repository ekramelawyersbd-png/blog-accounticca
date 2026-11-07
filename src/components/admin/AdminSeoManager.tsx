import React, { useState, useEffect } from 'react';
import {
  Globe,
  Search,
  Share2,
  Cpu,
  Zap,
  Check,
  AlertCircle,
  ExternalLink,
  Copy,
  RefreshCw,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Eye,
  CheckCircle2,
  FileCode,
  ShieldCheck,
  Smartphone,
  Monitor,
  Layers,
  Sparkles
} from 'lucide-react';
import {
  SeoConfig,
  RouteSeoEntry,
  IndexNowLogEntry,
  DEFAULT_SEO_CONFIG,
  DEFAULT_INDEXNOW_KEY,
  SchemaOrgType
} from '../../utils/seoConfig';
import {
  crawlAllRoutesForSitemap,
  type SitemapGenerationReport
} from '../../utils/sitemapGenerator';

const SCHEMA_TYPE_OPTIONS: Array<{ value: SchemaOrgType; label: string }> = [
  { value: 'LegalService', label: 'Legal Service (Corporate / Law Practice)' },
  { value: 'AccountingService', label: 'Accounting Service (Tax / Audit)' },
  { value: 'WebSite', label: 'Web Site (Portal / Directory)' },
  { value: 'WebApplication', label: 'Web Application (Calculator / Interactive Tool)' },
  { value: 'Article', label: 'Article / Statutory Insight' },
  { value: 'Product', label: 'Product / Digital Template / Retainer' },
  { value: 'Course', label: 'Course (LMS / Training Program)' },
  { value: 'FAQPage', label: 'FAQ Page (Statutory QA)' },
  { value: 'Organization', label: 'Organization (Firm Profile)' }
];

const CHANGEFREQ_OPTIONS: Array<RouteSeoEntry['changefreq']> = [
  'always',
  'hourly',
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'never'
];

export function AdminSeoManager() {
  const [config, setConfig] = useState<SeoConfig>(DEFAULT_SEO_CONFIG);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'routes' | 'global' | 'ai-search' | 'indexnow'>('overview');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Route editor states
  const [selectedRoutePath, setSelectedRoutePath] = useState<string>('/');
  const [currentOrigin, setCurrentOrigin] = useState<string>('https://blog.accounticca.com');
  const [previewPlatform, setPreviewPlatform] = useState<'google-desktop' | 'google-mobile' | 'facebook' | 'twitter'>('google-desktop');
  const [newRoutePath, setNewRoutePath] = useState<string>('');
  const [isAddingRoute, setIsAddingRoute] = useState<boolean>(false);

  // IndexNow submission states
  const [indexNowLogs, setIndexNowLogs] = useState<IndexNowLogEntry[]>([]);
  const [submittingIndexNow, setSubmittingIndexNow] = useState<boolean>(false);
  const [selectedUrlsForIndexNow, setSelectedUrlsForIndexNow] = useState<string[]>([]);

  // Dynamic Sitemap Crawler states
  const [sitemapReport, setSitemapReport] = useState<SitemapGenerationReport>(() =>
    crawlAllRoutesForSitemap({
      origin: typeof window !== 'undefined' ? window.location.origin : 'https://blog.accounticca.com',
    })
  );
  const [publishingSitemap, setPublishingSitemap] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentOrigin(window.location.origin);
    }
    fetchSeoConfig();
    fetchIndexNowLogs();
    fetchSitemapReport();
  }, []);

  const fetchSitemapReport = async () => {
    try {
      const res = await fetch('/api/seo/sitemap/report');
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.totalUrls === 'number') {
          setSitemapReport(data);
        }
      }
    } catch {
      // Fallback already populated from crawlAllRoutesForSitemap
    }
  };

  const handlePublishSitemapToPublic = async () => {
    try {
      setPublishingSitemap(true);
      const res = await fetch('/api/seo/sitemap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: currentOrigin }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.report) {
          setSitemapReport(data.report);
        }
        setStatusMessage({
          type: 'success',
          text:
            data.message ||
            `Crawled React Router routes and published ${sitemapReport.totalUrls} URLs to /public/sitemap.xml!`,
        });
        setTimeout(() => setStatusMessage(null), 5000);
      } else {
        throw new Error('Failed to publish sitemap.xml');
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Error publishing sitemap.xml to public folder',
      });
    } finally {
      setPublishingSitemap(false);
    }
  };

  const fetchSeoConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/seo/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (e) {
      console.error('Failed to fetch SEO config:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchIndexNowLogs = async () => {
    try {
      const res = await fetch('/api/seo/indexnow/logs');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.logs)) {
          setIndexNowLogs(data.logs);
        }
      }
    } catch (e) {
      console.warn('Could not fetch IndexNow logs:', e);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/seo/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'SEO Configuration saved and updated live across all endpoints!' });
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        throw new Error('Failed to save config');
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Error saving SEO settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    if (!window.confirm('Reset all SEO settings, verification tags, and route meta tags to recommended defaults?')) {
      return;
    }
    try {
      setSaving(true);
      const res = await fetch('/api/seo/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config || DEFAULT_SEO_CONFIG);
        setStatusMessage({ type: 'success', text: 'SEO settings successfully restored to factory defaults!' });
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (e) {
      setStatusMessage({ type: 'error', text: 'Failed to reset SEO defaults.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerIndexNow = async (urls?: string[]) => {
    try {
      setSubmittingIndexNow(true);
      const payload = urls && urls.length > 0 ? { urlList: urls } : undefined;
      const res = await fetch('/api/seo/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {})
      });
      if (res.ok) {
        const data = await res.json();
        setStatusMessage({
          type: 'success',
          text: `IndexNow ping dispatched for ${data.submittedCount || 0} URLs to Bing, Yandex and partner engines!`
        });
        fetchIndexNowLogs();
        setTimeout(() => setStatusMessage(null), 5000);
      } else {
        throw new Error('Failed to ping IndexNow');
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to ping IndexNow' });
    } finally {
      setSubmittingIndexNow(false);
    }
  };

  // Route manipulation
  const currentRoute = config.routes[selectedRoutePath] || {
    path: selectedRoutePath,
    title: '',
    description: '',
    keywords: [],
    ogImage: '/logo.png',
    schemaType: 'LegalService',
    priority: 0.8,
    changefreq: 'weekly'
  };

  const updateCurrentRouteField = <K extends keyof RouteSeoEntry>(field: K, value: RouteSeoEntry[K]) => {
    setConfig((prev) => ({
      ...prev,
      routes: {
        ...prev.routes,
        [selectedRoutePath]: {
          ...currentRoute,
          [field]: value
        }
      }
    }));
  };

  const handleAddCustomRoute = () => {
    if (!newRoutePath.trim()) return;
    const formatted = newRoutePath.trim().startsWith('/') ? newRoutePath.trim() : `/${newRoutePath.trim()}`;
    if (config.routes[formatted]) {
      setSelectedRoutePath(formatted);
      setIsAddingRoute(false);
      setNewRoutePath('');
      return;
    }
    const newEntry: RouteSeoEntry = {
      path: formatted,
      title: `${formatted.replace('/', '').replace(/-/g, ' ').toUpperCase()} — ACCOUNTICCA`,
      description: config.defaultDescription,
      keywords: config.defaultKeywords.slice(0, 5),
      ogImage: '/logo.png',
      schemaType: 'WebSite',
      priority: 0.7,
      changefreq: 'weekly',
      isCustom: true
    };
    setConfig((prev) => ({
      ...prev,
      routes: {
        ...prev.routes,
        [formatted]: newEntry
      }
    }));
    setSelectedRoutePath(formatted);
    setIsAddingRoute(false);
    setNewRoutePath('');
  };

  const handleDeleteRoute = (pathToDelete: string) => {
    if (pathToDelete === '/') {
      alert('The root home page route ("/") cannot be removed.');
      return;
    }
    if (window.confirm(`Remove SEO configuration for route "${pathToDelete}"?`)) {
      setConfig((prev) => {
        const nextRoutes = { ...prev.routes };
        delete nextRoutes[pathToDelete];
        return {
          ...prev,
          routes: nextRoutes
        };
      });
      setSelectedRoutePath('/');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setStatusMessage({ type: 'success', text: `Copied ${label} to clipboard!` });
    setTimeout(() => setStatusMessage(null), 2500);
  };

  // Character count helpers
  const titleCharCount = (currentRoute.title || '').length;
  const descCharCount = (currentRoute.description || '').length;

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-700">Loading live SEO & Indexing configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold tracking-tight text-white">SEO & Search Discovery Manager</h2>
            <span className="text-xs text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
              100% Free · Native
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Google Search, Schema.org Rich Snippets, Facebook/LinkedIn/WhatsApp OpenGraph, X Cards, AI Search (llms.txt) & IndexNow.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleResetToDefaults}
            disabled={saving}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            title="Reset to recommended defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={() => handleTriggerIndexNow()}
            disabled={submittingIndexNow}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Submit all site URLs to Bing & IndexNow engines"
          >
            <Zap className={`w-3.5 h-3.5 ${submittingIndexNow ? 'animate-spin' : 'text-amber-300'}`} />
            <span>{submittingIndexNow ? 'Pinging IndexNow...' : 'Ping IndexNow'}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveConfig}
            disabled={saving}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{saving ? 'Saving...' : 'Save Live Changes'}</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between border animate-in fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-3 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>Overview & Health Audit</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('routes')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'routes'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Eye className="w-4 h-4 text-emerald-400" />
          <span>Route Meta Tags & Previews</span>
          <span className="font-mono text-[10px] bg-slate-800 text-slate-200 px-1.5 py-0.2 rounded-full">
            {Object.keys(config.routes).length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('global')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'global'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Verification & Global Identity</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ai-search')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'ai-search'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4 text-emerald-400" />
          <span>AI Search & llms.txt</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('indexnow')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'indexnow'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Zap className="w-4 h-4 text-emerald-400" />
          <span>IndexNow Instant Indexing</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & HEALTH AUDIT */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Discovery Endpoints Strip */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-emerald-600" />
                  XML Sitemap
                </span>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-0.5"
                >
                  <span>Open</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-slate-500 font-mono truncate">{currentOrigin}/sitemap.xml</p>
              <div className="text-[11px] text-slate-400">Auto-generated with dynamic host</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Robots Directive
                </span>
                <a
                  href="/robots.txt"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5"
                >
                  <span>Open</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-slate-500 font-mono truncate">{currentOrigin}/robots.txt</p>
              <div className="text-[11px] text-slate-400">Allows Google, Bing, GPTBot, Perplexity</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-purple-600" />
                  AI Search llms.txt
                </span>
                <a
                  href="/llms.txt"
                  target="_blank"
                  rel="noreferrer"
                  className="text-purple-600 hover:text-purple-700 inline-flex items-center gap-0.5"
                >
                  <span>Open</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-slate-500 font-mono truncate">{currentOrigin}/llms.txt</p>
              <div className="text-[11px] text-slate-400">Structured markdown for AI models</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-600" />
                  IndexNow Key
                </span>
                <a
                  href={`/${config.indexNowApiKey || DEFAULT_INDEXNOW_KEY}.txt`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-600 hover:text-amber-700 inline-flex items-center gap-0.5"
                >
                  <span>Verify</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-slate-500 font-mono truncate">
                /{config.indexNowApiKey || DEFAULT_INDEXNOW_KEY}.txt
              </p>
              <div className="text-[11px] text-slate-400">Instant URL indexing verification</div>
            </div>
          </div>

          {/* Dynamic React Router Sitemap Crawler & Public Folder Publisher */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-emerald-600" />
                  <span>Dynamic React Router Sitemap Crawler (/public/sitemap.xml)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automatically crawls existing React Router routes in App.tsx and indexes all legal & tax articles, categories, compliance tools, courses, and shop templates into the public folder.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5"
                >
                  <span>View /sitemap.xml</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={handlePublishSitemapToPublic}
                  disabled={publishingSitemap}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${publishingSitemap ? 'animate-spin' : ''}`} />
                  <span>{publishingSitemap ? 'Crawling & Publishing...' : 'Crawl Routes & Publish to /public/sitemap.xml'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="text-slate-500 font-medium">Total Indexed URLs</div>
                <div className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                  {sitemapReport.totalUrls}
                </div>
              </div>
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80">
                <div className="text-emerald-800 font-medium">Legal & Tax Articles</div>
                <div className="text-lg font-bold font-mono tabular-nums text-emerald-900 mt-0.5">
                  {sitemapReport.countsBySource.articles}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="text-slate-500 font-medium">Legal Categories</div>
                <div className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                  {sitemapReport.countsBySource.categories}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="text-slate-500 font-medium">Compliance Tools</div>
                <div className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                  {sitemapReport.countsBySource.tools}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="text-slate-500 font-medium">Shop Templates</div>
                <div className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                  {sitemapReport.countsBySource.products}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="text-slate-500 font-medium">Static Routes</div>
                <div className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                  {sitemapReport.countsBySource.staticRoutes}
                </div>
              </div>
            </div>
          </div>

          {/* Route SEO Health Audit Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Route SEO Health Audit</h3>
                <p className="text-xs text-slate-500">
                  Real-time status of titles, meta descriptions, Schema.org entities, and indexation directives.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('routes')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
              >
                Edit Route Meta Tags &rarr;
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Route Path</th>
                    <th className="py-3 px-4">Meta Title (50–60 chars)</th>
                    <th className="py-3 px-4">Meta Description (120–160)</th>
                    <th className="py-3 px-4">Schema Entity</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {Object.values(config.routes).map((route) => {
                    const titleLen = (route.title || '').length;
                    const descLen = (route.description || '').length;
                    const isTitleGood = titleLen >= 30 && titleLen <= 65;
                    const isDescGood = descLen >= 100 && descLen <= 165;

                    return (
                      <tr key={route.path} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                          {route.path}
                          {route.noindex && (
                            <span className="ml-2 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-mono">
                              noindex
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="truncate font-medium">{route.title}</div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                            <span className={isTitleGood ? 'text-emerald-600 font-mono tabular-nums' : 'text-amber-600 font-mono tabular-nums'}>
                              {titleLen} chars
                            </span>
                            <span>·</span>
                            <span>{isTitleGood ? 'Optimal' : 'Needs attention'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 max-w-sm">
                          <div className="truncate text-slate-600">{route.description}</div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                            <span className={isDescGood ? 'text-emerald-600 font-mono tabular-nums' : 'text-amber-600 font-mono tabular-nums'}>
                              {descLen} chars
                            </span>
                            <span>·</span>
                            <span>{isDescGood ? 'Optimal length' : descLen < 100 ? 'Too short' : 'Too long'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono text-[11px] text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                            {route.schemaType}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-600">
                          {route.priority.toFixed(1)}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRoutePath(route.path);
                              setActiveTab('routes');
                            }}
                            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                          >
                            Edit Tags
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROUTE META TAGS & LIVE MULTI-PLATFORM PREVIEWS */}
      {activeTab === 'routes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Route Selector & Meta Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Route Selector Strip */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Selected Route Path</label>
                <button
                  type="button"
                  onClick={() => setIsAddingRoute(!isAddingRoute)}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingRoute ? 'Cancel' : 'Add Custom Route'}</span>
                </button>
              </div>

              {isAddingRoute ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newRoutePath}
                    onChange={(e) => setNewRoutePath(e.target.value)}
                    placeholder="/custom-page-path"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomRoute}
                    className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedRoutePath}
                    onChange={(e) => setSelectedRoutePath(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  >
                    {Object.keys(config.routes).map((path) => (
                      <option key={path} value={path}>
                        {path} — {config.routes[path].title}
                      </option>
                    ))}
                  </select>

                  {currentRoute.isCustom && (
                    <button
                      type="button"
                      onClick={() => handleDeleteRoute(selectedRoutePath)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete this custom route"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Meta Tags Form */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">Page Meta Title</label>
                  <span
                    className={`text-[11px] font-mono tabular-nums ${
                      titleCharCount >= 40 && titleCharCount <= 60
                        ? 'text-emerald-600'
                        : titleCharCount > 60
                        ? 'text-amber-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {titleCharCount} / 60 characters
                  </span>
                </div>
                <input
                  type="text"
                  value={currentRoute.title}
                  onChange={(e) => updateCurrentRouteField('title', e.target.value)}
                  placeholder="Enter high-intent title with focus keywords"
                  className="mt-1.5 w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">Meta Description</label>
                  <span
                    className={`text-[11px] font-mono tabular-nums ${
                      descCharCount >= 120 && descCharCount <= 160
                        ? 'text-emerald-600'
                        : descCharCount > 160
                        ? 'text-amber-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {descCharCount} / 160 characters
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={currentRoute.description}
                  onChange={(e) => updateCurrentRouteField('description', e.target.value)}
                  placeholder="Summarize the core value, statutory scope, and user outcome clearly."
                  className="mt-1.5 w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800">
                  Focus Keywords (Comma-separated)
                </label>
                <input
                  type="text"
                  value={(currentRoute.keywords || []).join(', ')}
                  onChange={(e) =>
                    updateCurrentRouteField(
                      'keywords',
                      e.target.value.split(',').map((k) => k.trim()).filter(Boolean)
                    )
                  }
                  placeholder="e.g. Corporate Law Bangladesh, Tax Return 2026, VAT Compliance"
                  className="mt-1.5 w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-800">OpenGraph & Twitter Image</label>
                  <input
                    type="text"
                    value={currentRoute.ogImage || ''}
                    onChange={(e) => updateCurrentRouteField('ogImage', e.target.value)}
                    placeholder="/logo.png or full https://... URL"
                    className="mt-1.5 w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800">Schema.org Entity Type</label>
                  <select
                    value={currentRoute.schemaType}
                    onChange={(e) => updateCurrentRouteField('schemaType', e.target.value as SchemaOrgType)}
                    className="mt-1.5 w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  >
                    {SCHEMA_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-xs font-bold text-slate-800">Sitemap Priority</label>
                  <input
                    type="number"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={currentRoute.priority}
                    onChange={(e) => updateCurrentRouteField('priority', parseFloat(e.target.value) || 0.7)}
                    className="mt-1.5 w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800">Change Frequency</label>
                  <select
                    value={currentRoute.changefreq}
                    onChange={(e) => updateCurrentRouteField('changefreq', e.target.value as any)}
                    className="mt-1.5 w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  >
                    {CHANGEFREQ_OPTIONS.map((freq) => (
                      <option key={freq} value={freq}>
                        {freq}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="route-noindex"
                    checked={Boolean(currentRoute.noindex)}
                    onChange={(e) => updateCurrentRouteField('noindex', e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="route-noindex" className="text-xs font-bold text-slate-700 cursor-pointer">
                    noindex (Hide from search)
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Multi-Platform Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">Live Multi-Platform Preview</span>
                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setPreviewPlatform('google-desktop')}
                    className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                      previewPlatform === 'google-desktop'
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Google Desktop SERP Preview"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewPlatform('google-mobile')}
                    className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                      previewPlatform === 'google-mobile'
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Google Mobile SERP Preview"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewPlatform('facebook')}
                    className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                      previewPlatform === 'facebook'
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Facebook / LinkedIn / WhatsApp OpenGraph Card"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* GOOGLE DESKTOP PREVIEW */}
              {previewPlatform === 'google-desktop' && (
                <div className="bg-white text-slate-900 rounded-xl p-4 shadow-sm border border-slate-200 space-y-1 font-sans">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[9px] text-emerald-700">
                      A
                    </div>
                    <span className="text-slate-700">{config.siteName.split('—')[0].trim()}</span>
                    <span>›</span>
                    <span className="font-mono text-[11px] text-slate-500 truncate">
                      {currentOrigin}
                      {currentRoute.path === '/' ? '' : currentRoute.path}
                    </span>
                  </div>
                  <h4 className="text-base text-blue-800 hover:underline cursor-pointer font-medium leading-snug line-clamp-1">
                    {currentRoute.title || 'Untitled Page'}
                    {config.titleSuffix}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {currentRoute.description || 'No description provided.'}
                  </p>
                </div>
              )}

              {/* GOOGLE MOBILE PREVIEW */}
              {previewPlatform === 'google-mobile' && (
                <div className="bg-white text-slate-900 rounded-xl p-3 shadow-sm border border-slate-200 space-y-1.5 font-sans max-w-xs mx-auto">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[9px] text-emerald-700">
                      A
                    </div>
                    <span className="font-medium text-slate-800 truncate">
                      {currentOrigin.replace('https://', '')}
                    </span>
                  </div>
                  <h4 className="text-sm text-blue-800 hover:underline cursor-pointer font-medium leading-tight line-clamp-2">
                    {currentRoute.title || 'Untitled Page'}
                    {config.titleSuffix}
                  </h4>
                  <p className="text-xs text-slate-600 leading-snug line-clamp-3">
                    {currentRoute.description || 'No description provided.'}
                  </p>
                </div>
              )}

              {/* FACEBOOK / LINKEDIN / WHATSAPP CARD */}
              {previewPlatform === 'facebook' && (
                <div className="bg-white text-slate-900 rounded-xl overflow-hidden shadow-sm border border-slate-200 font-sans">
                  <div className="h-36 bg-slate-100 relative flex items-center justify-center border-b border-slate-100 overflow-hidden">
                    {currentRoute.ogImage ? (
                      <img
                        src={
                          currentRoute.ogImage.startsWith('http')
                            ? currentRoute.ogImage
                            : `${currentOrigin}${currentRoute.ogImage}`
                        }
                        alt="Social Card Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-xs text-slate-400 font-mono">No OG Image Set</div>
                    )}
                  </div>
                  <div className="p-3 bg-slate-50/70 space-y-1 border-t border-slate-100">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-mono truncate">
                      {currentOrigin.replace('https://', '')}
                    </div>
                    <div className="text-xs font-bold text-slate-900 line-clamp-1">
                      {currentRoute.title || 'Untitled Page'}
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2">
                      {currentRoute.description || 'No description provided.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Summary of Active Directives */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-2">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Resolved Canonical URL for This Route</span>
              </div>
              <p className="font-mono text-[11px] bg-slate-50 p-2 rounded border border-slate-200 break-all text-slate-700">
                {currentOrigin}
                {currentRoute.path === '/' ? '' : currentRoute.path}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GLOBAL BRAND, VERIFICATION & IDENTITY */}
      {activeTab === 'global' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Global Defaults */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Global Brand & Title Identity
            </h3>

            <div>
              <label className="text-xs font-bold text-slate-800">Global Site Name</label>
              <input
                type="text"
                value={config.siteName}
                onChange={(e) => setConfig({ ...config, siteName: e.target.value })}
                className="mt-1.5 w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800">Title Suffix (Appended to Page Titles)</label>
              <input
                type="text"
                value={config.titleSuffix}
                onChange={(e) => setConfig({ ...config, titleSuffix: e.target.value })}
                className="mt-1.5 w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800">Default Meta Description</label>
              <textarea
                rows={3}
                value={config.defaultDescription}
                onChange={(e) => setConfig({ ...config, defaultDescription: e.target.value })}
                className="mt-1.5 w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-800">Contact Telephone</label>
                <input
                  type="text"
                  value={config.telephone}
                  onChange={(e) => setConfig({ ...config, telephone: e.target.value })}
                  className="mt-1.5 w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800">Official Email</label>
                <input
                  type="email"
                  value={config.email}
                  onChange={(e) => setConfig({ ...config, email: e.target.value })}
                  className="mt-1.5 w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800">Office Street Address (Schema.org)</label>
              <input
                type="text"
                value={config.streetAddress}
                onChange={(e) => setConfig({ ...config, streetAddress: e.target.value })}
                className="mt-1.5 w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Search Engine Verification Tags */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Search Engine Verification Meta Tags
            </h3>
            <p className="text-xs text-slate-500">
              Paste your HTML meta tag verification codes below. The server will dynamically inject them into the HTML head tag for verification.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Google Search Console Verification</span>
                <span className="text-[10px] text-slate-400 font-mono">google-site-verification</span>
              </label>
              <input
                type="text"
                value={config.googleSiteVerification || ''}
                onChange={(e) => setConfig({ ...config, googleSiteVerification: e.target.value })}
                placeholder="Paste code or token from Google Search Console"
                className="mt-1.5 w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Bing Webmaster Tools Verification</span>
                <span className="text-[10px] text-slate-400 font-mono">msvalidate.01</span>
              </label>
              <input
                type="text"
                value={config.bingSiteVerification || ''}
                onChange={(e) => setConfig({ ...config, bingSiteVerification: e.target.value })}
                placeholder="Paste Bing msvalidate.01 token"
                className="mt-1.5 w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Meta (Facebook) Domain Verification</span>
                <span className="text-[10px] text-slate-400 font-mono">facebook-domain-verification</span>
              </label>
              <input
                type="text"
                value={config.facebookDomainVerification || ''}
                onChange={(e) => setConfig({ ...config, facebookDomainVerification: e.target.value })}
                placeholder="Paste Meta business verification token"
                className="mt-1.5 w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>IndexNow API Key</span>
                <span className="text-[10px] text-slate-400 font-mono">Dynamic Text File</span>
              </label>
              <input
                type="text"
                value={config.indexNowApiKey || ''}
                onChange={(e) => setConfig({ ...config, indexNowApiKey: e.target.value })}
                placeholder={DEFAULT_INDEXNOW_KEY}
                className="mt-1.5 w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AI SEARCH & LLMS.TXT */}
      {activeTab === 'ai-search' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">
              Generative Engine Optimization (GEO) & AI Search Directives
            </h3>
            <p className="text-xs text-slate-500">
              Control how AI Search engines (Google AI Overviews, Perplexity, ChatGPT Search, Claude) index, cite, and retrieve legal, tax, and compliance answers from your site.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-800">
                AI Search Summary Pitch (Displayed prominently at the top of /llms.txt)
              </label>
              <textarea
                rows={4}
                value={config.aiSearchSummary}
                onChange={(e) => setConfig({ ...config, aiSearchSummary: e.target.value })}
                className="mt-1.5 w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Live Preview: /llms.txt</span>
                <a
                  href="/llms.txt"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 font-bold"
                >
                  <span>Open live /llms.txt</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
{`# ${config.siteName}

> ${config.aiSearchSummary}

The platform operates in Dhaka, Bangladesh, uniting Supreme Court Advocates and Chartered Accountants to deliver statutory corporate compliance, tax filing tools, legal document templates, and online certification.

## Interactive Tools & Calculators
- [Income Tax Calculator 2026-27](${currentOrigin}/calculators)
- [RJSC Fee Calculator](${currentOrigin}/tools/rjsc-fee-calculator)
- [Wealth Surcharge Calculator](${currentOrigin}/tools/wealth-surcharge)
- [Corporate Tax Slabs](${currentOrigin}/tools/tax-slabs-explorer)

## Core Legal & Corporate Services
- [Corporate Law & Advisory](${currentOrigin}/services)
- [Schedule Consultation](${currentOrigin}/booking)`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: INDEXNOW INSTANT INDEXING */}
      {activeTab === 'indexnow' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">IndexNow URL Dispatcher</h3>
                <p className="text-xs text-slate-500">
                  Notify search engines (Bing, Yandex, Seznam, Naver) immediately when content is added or modified.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleTriggerIndexNow()}
                disabled={submittingIndexNow}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Zap className={`w-3.5 h-3.5 ${submittingIndexNow ? 'animate-spin' : 'text-amber-300'}`} />
                <span>{submittingIndexNow ? 'Submitting to IndexNow...' : 'Submit All Public Pages'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-800">Verification Key:</span>
                <p className="font-mono text-slate-600 mt-1 truncate">{config.indexNowApiKey || DEFAULT_INDEXNOW_KEY}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-800">Key Location:</span>
                <p className="font-mono text-slate-600 mt-1 truncate">{currentOrigin}/{config.indexNowApiKey || DEFAULT_INDEXNOW_KEY}.txt</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-800">Public Target Pages:</span>
                <p className="font-mono text-slate-600 mt-1">
                  {Object.keys(config.routes).filter((k) => !config.routes[k].noindex).length} URLs in queue
                </p>
              </div>
            </div>
          </div>

          {/* Submission History Log */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900">IndexNow Submission History</h3>
              <button
                type="button"
                onClick={fetchIndexNowLogs}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Logs</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Target Host</th>
                    <th className="py-3 px-4">URLs Submitted</th>
                    <th className="py-3 px-4">Engine Endpoint</th>
                    <th className="py-3 px-4 text-right">Status Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {indexNowLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">
                        {log.host}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums">
                        {log.urlList?.length || 0} URLs
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {log.engine}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span
                          className={`font-mono text-[11px] px-2 py-0.5 rounded font-bold ${
                            log.statusCode === 200 || log.statusCode === 202
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          HTTP {log.statusCode} {log.statusText}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {indexNowLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        No IndexNow pings recorded yet. Click "Submit All Public Pages" to send your first instant indexing request.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSeoManager;
