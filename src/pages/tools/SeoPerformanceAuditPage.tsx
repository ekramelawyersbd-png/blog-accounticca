import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  Globe,
  Share2,
  Code2,
  FileCode,
  Download,
  ExternalLink,
  Layers,
  Monitor,
  Smartphone,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Sparkles,
  HelpCircle,
  CheckCheck,
  ArrowRight
} from 'lucide-react';
import { ToolPageLayout } from '../../components/tools/ToolPageLayout';
import {
  analyzeHtmlForSeo,
  SeoAuditReport,
  AuditItem,
  AuditCategory,
  AuditSeverity
} from '../../utils/seoAuditEngine';

// Fallback index.html snippet in case network fetch is unavailable
const STATIC_INDEX_HTML_FALLBACK = `<!doctype html>
<html lang="en" prefix="og: https://ogp.me/ns#">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
    <title>Compliance Hub – Legal, Tax, VAT, Accounting & Business Technology Knowledge Platform Bangladesh</title>
    <meta name="description" content="Your trusted platform for Corporate Law, Income Tax, VAT, RJSC Company Registration, Statutory Audit, and Business Compliance Updates in Bangladesh. Powered by Accounticca & E-Lawyers." />
    <meta name="keywords" content="Corporate Law Bangladesh, Income Tax Bangladesh, VAT Compliance, RJSC Registration, Statutory Audit, Legal Advisory, E-Lawyers, Accounticca, Compliance Hub Dhaka" />
    <meta name="author" content="Accounticca & E-Lawyers Bangladesh" />
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
    <meta name="gptbot" content="index, follow" />
    <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large" />
    <meta name="google-extended" content="index, follow" />
    <meta name="meta-externalagent" content="index, follow" />
    <meta name="claudebot" content="index, follow" />
    <meta name="perplexitybot" content="index, follow" />
    <link rel="canonical" href="https://blog.accounticca.com/" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <link rel="shortcut icon" href="/favicon.ico" />
    <link rel="icon" type="image/png" sizes="32x32" href="/logo.png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#020617" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://blog.accounticca.com/" />
    <meta property="og:title" content="Compliance Hub – Legal, Tax, VAT & Business Compliance Bangladesh" />
    <meta property="og:description" content="Corporate Law, Income Tax, VAT, RJSC Company Registration & Business Compliance Knowledge Platform in Bangladesh." />
    <meta property="og:image" content="https://blog.accounticca.com/logo.png" />
    <meta property="og:site_name" content="Compliance Hub (Accounticca × E-Lawyers)" />
    <meta property="og:locale" content="en_US" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="https://blog.accounticca.com/" />
    <meta name="twitter:title" content="Compliance Hub – Legal, Tax, VAT & Business Compliance Bangladesh" />
    <meta name="twitter:description" content="Corporate Law, Income Tax, VAT, RJSC Company Registration & Business Compliance Knowledge Platform in Bangladesh." />
    <meta name="twitter:image" content="https://blog.accounticca.com/logo.png" />
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "LegalService",
          "@id": "https://blog.accounticca.com/#organization",
          "name": "E-Lawyers & Accounticca",
          "alternateName": "Compliance Hub",
          "url": "https://blog.accounticca.com",
          "description": "Corporate law, income tax, VAT, statutory audit, and RJSC compliance services in Bangladesh.",
          "telephone": "+8801335230170",
          "email": "info@elawyersbd.com"
        },
        {
          "@type": "WebSite",
          "@id": "https://blog.accounticca.com/#website",
          "url": "https://blog.accounticca.com",
          "name": "Compliance Hub"
        },
        {
          "@type": "WebApplication",
          "@id": "https://blog.accounticca.com/#webapp",
          "name": "Compliance Hub Portal & Academy",
          "url": "https://blog.accounticca.com",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "All"
        }
      ]
    }
    </script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

export function SeoPerformanceAuditPage() {
  const [sourceMode, setSourceMode] = useState<'index.html' | 'rendered-dom' | 'custom'>('index.html');
  const [customHtml, setCustomHtml] = useState<string>('');
  const [rawIndexHtml, setRawIndexHtml] = useState<string>(STATIC_INDEX_HTML_FALLBACK);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [auditReport, setAuditReport] = useState<SeoAuditReport | null>(null);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'checklist' | 'serp-preview' | 'schema' | 'headers' | 'generator'>('overview');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | AuditCategory>('ALL');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'ISSUES' | 'PASSED'>('ALL');
  const [serpDevice, setSerpDevice] = useState<'desktop' | 'mobile' | 'social-og' | 'twitter'>('desktop');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Fetch index.html from server on mount
  const fetchIndexHtml = useCallback(async () => {
    try {
      const response = await fetch('/index.html', { cache: 'no-store' });
      if (response.ok) {
        const text = await response.text();
        if (text && text.includes('<html')) {
          setRawIndexHtml(text);
          return text;
        }
      }
    } catch {
      // Fallback
    }
    return STATIC_INDEX_HTML_FALLBACK;
  }, []);

  const runAudit = useCallback(async (modeOverride?: 'index.html' | 'rendered-dom' | 'custom') => {
    setIsRefreshing(true);
    const targetMode = modeOverride || sourceMode;

    try {
      let content = '';
      if (targetMode === 'index.html') {
        content = await fetchIndexHtml();
      } else if (targetMode === 'rendered-dom') {
        // Inspect active document HTML
        if (typeof document !== 'undefined') {
          content = document.documentElement.outerHTML;
        } else {
          content = rawIndexHtml;
        }
      } else {
        content = customHtml || STATIC_INDEX_HTML_FALLBACK;
      }

      const report = analyzeHtmlForSeo(
        content,
        targetMode === 'custom' ? 'custom-markup' : targetMode,
        typeof window !== 'undefined' ? window.location.origin + '/' : 'https://blog.accounticca.com/'
      );

      setAuditReport(report);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  }, [fetchIndexHtml, sourceMode, customHtml, rawIndexHtml]);

  useEffect(() => {
    runAudit();
  }, [runAudit]);

  const handleSourceChange = (newMode: 'index.html' | 'rendered-dom' | 'custom') => {
    setSourceMode(newMode);
    runAudit(newMode);
  };

  const handleCopyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filtered audit items
  const filteredItems = useMemo(() => {
    if (!auditReport) return [];
    return auditReport.items.filter(item => {
      const matchCat = categoryFilter === 'ALL' || item.category === categoryFilter;
      let matchSev = true;
      if (severityFilter === 'ISSUES') {
        matchSev = item.severity === 'warning' || item.severity === 'failed';
      } else if (severityFilter === 'PASSED') {
        matchSev = item.severity === 'passed';
      }
      return matchCat && matchSev;
    });
  }, [auditReport, categoryFilter, severityFilter]);

  // Export report as Markdown
  const exportMarkdownReport = () => {
    if (!auditReport) return;
    const md = `# SEO Performance Audit Report
Generated: ${new Date().toISOString()}
Target: ${auditReport.url}
Source Analyzed: ${auditReport.sourceType}
Overall Score: ${auditReport.overallScore}/100 (Grade: ${auditReport.grade})

## Category Scores
- Meta Tags & Snippet: ${auditReport.categoryScores.meta}%
- Social Sharing Cards (OpenGraph & Twitter): ${auditReport.categoryScores.social}%
- Structured Data (Schema.org JSON-LD): ${auditReport.categoryScores.schema}%
- Content Headers & Hierarchy: ${auditReport.categoryScores.headers}%
- Technical SEO & Mobile Readiness: ${auditReport.categoryScores.technical}%

## Summary Statistics
- Total Checks: ${auditReport.stats.total}
- Passed: ${auditReport.stats.passed}
- Warnings: ${auditReport.stats.warning}
- Critical Errors: ${auditReport.stats.failed}

## Detailed Findings & Action Items
${auditReport.items.map((item, i) => `### ${i + 1}. [${item.severity.toUpperCase()}] ${item.title}
- **Category**: ${item.category}
- **Found**: ${item.foundValue}
- **Expected Standard**: ${item.expectedValue}
- **Google Standard**: ${item.googleStandard}
- **Impact**: ${item.explanation}
- **Action Required**: ${item.recommendation}
${item.codeSnippet ? `\n\`\`\`html\n${item.codeSnippet}\n\`\`\`\n` : ''}
`).join('\n')}

---
Audited using Accounticca & E-Lawyers Compliance Hub SEO Engine.
`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `seo-performance-audit-${new Date().toISOString().split('T')[0]}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export report as JSON
  const exportJsonReport = () => {
    if (!auditReport) return;
    const blob = new Blob([JSON.stringify(auditReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `seo-performance-audit-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Recommended Compliant Head Snippet
  const recommendedCompliantHead = `<!-- Google & SEO Standards Compliant Head Snippet -->
<title>Compliance Hub – Legal, Tax & Corporate Advisory BD</title>
<meta name="description" content="Your trusted Bangladesh platform for Corporate Law, Income Tax, VAT, RJSC Company Incorporation, and Statutory Audit. Calculate, verify, and consult today." />
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
<link rel="canonical" href="https://blog.accounticca.com/" />

<!-- OpenGraph Social Cards -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://blog.accounticca.com/" />
<meta property="og:title" content="Compliance Hub – Legal, Tax & VAT Advisory Bangladesh" />
<meta property="og:description" content="Official platform for Corporate Law, Income Tax, VAT, RJSC registration, and statutory audit in Bangladesh." />
<meta property="og:image" content="https://blog.accounticca.com/logo.png" />
<meta property="og:image:width" content="1024" />
<meta property="og:image:height" content="1024" />
<meta property="og:site_name" content="Compliance Hub (Accounticca × E-Lawyers)" />

<!-- Twitter / X Cards -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Compliance Hub – Legal, Tax & VAT Advisory Bangladesh" />
<meta name="twitter:description" content="Official platform for Corporate Law, Income Tax, VAT, RJSC registration, and statutory audit in Bangladesh." />
<meta name="twitter:image" content="https://blog.accounticca.com/logo.png" />

<!-- Schema.org JSON-LD (WebApplication & LegalService) -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LegalService",
      "@id": "https://blog.accounticca.com/#organization",
      "name": "E-Lawyers & Accounticca",
      "alternateName": "Compliance Hub",
      "url": "https://blog.accounticca.com",
      "logo": "https://blog.accounticca.com/logo.png",
      "description": "Corporate law, income tax, VAT, statutory audit, and RJSC compliance services in Bangladesh.",
      "telephone": "+8801335230170",
      "email": "info@elawyersbd.com"
    },
    {
      "@type": "WebApplication",
      "@id": "https://blog.accounticca.com/#webapp",
      "name": "Compliance Hub Portal & Academy",
      "url": "https://blog.accounticca.com",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "All"
    }
  ]
}
</script>`;

  return (
    <ToolPageLayout
      toolId="seo-performance-audit"
      title="SEO Performance Audit & Compliance Inspector"
      category="Compliance Reference"
      description="Perform real-time diagnostic audits of HTML meta tags, Schema.org JSON-LD structured data, OpenGraph social cards, and document headers against Google's latest SEO standards."
    >
      <div className="space-y-8">
        {/* Tool Header & Source Controls */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Google SEO 2026 Standards Engine</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                SEO Performance Audit & Metadata Inspector
              </h1>
              <p className="text-slate-600 text-sm sm:text-base mt-1.5 max-w-3xl">
                Real-time diagnostic analysis of meta tags, Schema.org structured data, social cards,
                and document headers found in our <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-xs">index.html</code> with actionable, one-click copyable recommendations.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => runAudit()}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Scanning...' : 'Re-run Live Audit'}</span>
              </button>

              <button
                type="button"
                onClick={exportMarkdownReport}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs sm:text-sm transition-colors cursor-pointer"
                title="Download Markdown Report"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export MD</span>
              </button>

              <button
                type="button"
                onClick={exportJsonReport}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs sm:text-sm transition-colors cursor-pointer"
                title="Download JSON Report"
              >
                <FileCode className="w-4 h-4" />
                <span className="hidden sm:inline">Export JSON</span>
              </button>
            </div>
          </div>

          {/* Source Selection & Scan Mode Switcher */}
          <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl max-w-full overflow-x-auto">
              <button
                type="button"
                onClick={() => handleSourceChange('index.html')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  sourceMode === 'index.html'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                index.html Shell
              </button>
              <button
                type="button"
                onClick={() => handleSourceChange('rendered-dom')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  sourceMode === 'rendered-dom'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Live Rendered App DOM
              </button>
              <button
                type="button"
                onClick={() => handleSourceChange('custom')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  sourceMode === 'custom'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Custom HTML Sandbox
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Last scanned at: <strong className="text-slate-700">{auditReport?.timestamp || 'Just now'}</strong></span>
            </div>
          </div>

          {/* Custom Sandbox Input (if active) */}
          {sourceMode === 'custom' && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Paste Custom HTML Markup to Audit:
              </label>
              <textarea
                value={customHtml}
                onChange={(e) => setCustomHtml(e.target.value)}
                placeholder="<html><head><title>Custom Title</title>...</head>...</html>"
                rows={4}
                className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => runAudit('custom')}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                Audit Custom HTML
              </button>
            </div>
          )}
        </div>

        {/* Executive Scorecard */}
        {auditReport && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Overall Score Dial */}
            <div className="md:col-span-4 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-400">SEO Health Score</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                    auditReport.overallScore >= 85
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : auditReport.overallScore >= 70
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  }`}>
                    Grade: {auditReport.grade}
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mt-4">
                  <span className="text-5xl sm:text-6xl font-black tracking-tight text-white">
                    {auditReport.overallScore}
                  </span>
                  <span className="text-2xl text-slate-400 font-semibold">/100</span>
                </div>

                <p className="text-slate-300 text-xs sm:text-sm mt-3 leading-relaxed">
                  {auditReport.overallScore >= 85
                    ? 'Excellent SEO configuration! Rich snippet entities, social cards, and crawlability directives exceed Google standards.'
                    : auditReport.overallScore >= 70
                    ? 'Good baseline metadata, but minor adjustments to title length, descriptions, or headings are recommended to eliminate truncation risk.'
                    : 'Critical metadata omissions detected. Apply suggested snippets below to restore full search snippet visibility.'}
                </p>
              </div>

              {/* Status Counters */}
              <div className="grid grid-cols-3 gap-2 mt-6 pt-5 border-t border-slate-800">
                <div className="bg-slate-800/60 rounded-xl p-2.5 text-center">
                  <div className="flex items-center justify-center gap-1 text-emerald-400 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Passed</span>
                  </div>
                  <div className="text-lg font-bold text-white mt-0.5">{auditReport.stats.passed}</div>
                </div>

                <div className="bg-slate-800/60 rounded-xl p-2.5 text-center">
                  <div className="flex items-center justify-center gap-1 text-amber-400 text-xs font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Warnings</span>
                  </div>
                  <div className="text-lg font-bold text-white mt-0.5">{auditReport.stats.warning}</div>
                </div>

                <div className="bg-slate-800/60 rounded-xl p-2.5 text-center">
                  <div className="flex items-center justify-center gap-1 text-rose-400 text-xs font-semibold">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Failed</span>
                  </div>
                  <div className="text-lg font-bold text-white mt-0.5">{auditReport.stats.failed}</div>
                </div>
              </div>
            </div>

            {/* Category Performance Breakdown */}
            <div className="md:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Google Standards Category Breakdown
                </h2>
                <p className="text-slate-500 text-xs">
                  Compliance weighting calibrated against Google Search Central and Rich Results guidelines.
                </p>

                <div className="space-y-4 mt-5">
                  {/* Meta Tags */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-700 flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-blue-600" />
                        Meta Tags & SERP Snippet
                      </span>
                      <span className="text-slate-900 font-bold">{auditReport.categoryScores.meta}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${auditReport.categoryScores.meta}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Social Cards */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-700 flex items-center gap-1.5">
                        <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                        Social Cards (OpenGraph & Twitter)
                      </span>
                      <span className="text-slate-900 font-bold">{auditReport.categoryScores.social}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${auditReport.categoryScores.social}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Schema Structured Data */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-700 flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5 text-emerald-600" />
                        Schema.org JSON-LD Structured Data
                      </span>
                      <span className="text-slate-900 font-bold">{auditReport.categoryScores.schema}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                        style={{ width: `${auditReport.categoryScores.schema}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Content Headers */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-700 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-amber-600" />
                        Content Headers & Semantic Outline
                      </span>
                      <span className="text-slate-900 font-bold">{auditReport.categoryScores.headers}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-amber-600 rounded-full transition-all duration-500"
                        style={{ width: `${auditReport.categoryScores.headers}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Technical & Mobile */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-700 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-purple-600" />
                        Technical SEO & Mobile Responsiveness
                      </span>
                      <span className="text-slate-900 font-bold">{auditReport.categoryScores.technical}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-purple-600 rounded-full transition-all duration-500"
                        style={{ width: `${auditReport.categoryScores.technical}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Active Target: <strong className="text-slate-700">{auditReport.url}</strong></span>
                <span className="text-emerald-700 font-medium">Schema Entities: {auditReport.schemas.length} detected</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="border-b border-slate-200">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`pb-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Audit Checklist ({auditReport?.items.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('serp-preview')}
              className={`pb-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'serp-preview'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Live SERP & Social Simulator</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('schema')}
              className={`pb-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'schema'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Schema.org JSON-LD ({auditReport?.schemas.length || 0})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('headers')}
              className={`pb-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'headers'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Content Headers Outline ({auditReport?.headers.length || 0})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('generator')}
              className={`pb-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'generator'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Compliant &lt;head&gt; Generator</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Checklist & Detailed Findings */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Filter Controls */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Category:
                </span>
                {(['ALL', 'meta', 'social', 'schema', 'headers', 'technical'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      categoryFilter === cat
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'ALL' ? 'All' : cat === 'meta' ? 'Meta Tags' : cat === 'social' ? 'Social Cards' : cat === 'schema' ? 'Schema.org' : cat === 'headers' ? 'Headers' : 'Technical'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500 mr-1">Status:</span>
                <button
                  type="button"
                  onClick={() => setSeverityFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    severityFilter === 'ALL'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({auditReport?.items.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSeverityFilter('ISSUES')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    severityFilter === 'ISSUES'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Issues Only ({(auditReport?.stats.warning || 0) + (auditReport?.stats.failed || 0)})
                </button>
                <button
                  type="button"
                  onClick={() => setSeverityFilter('PASSED')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    severityFilter === 'PASSED'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Passed ({auditReport?.stats.passed})
                </button>
              </div>
            </div>

            {/* Audit Items List */}
            <div className="space-y-4">
              {filteredItems.map(item => {
                const isExpanded = expandedItemId === item.id;
                const isWarning = item.severity === 'warning';
                const isFailed = item.severity === 'failed';
                const isPassed = item.severity === 'passed';

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl border transition-all ${
                      isFailed
                        ? 'border-rose-200/90 shadow-2xs hover:border-rose-300'
                        : isWarning
                        ? 'border-amber-200/90 shadow-2xs hover:border-amber-300'
                        : 'border-slate-200/80 hover:border-emerald-200'
                    }`}
                  >
                    <div
                      onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                      className="p-5 cursor-pointer flex items-start justify-between gap-4 select-none"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="mt-0.5 shrink-0">
                          {isPassed && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                          {isWarning && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                          {isFailed && <XCircle className="w-5 h-5 text-rose-500" />}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="text-sm font-bold text-slate-900 truncate">
                              {item.title}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                              {item.category}
                            </span>
                            {item.metric && (
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                isPassed
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : isWarning
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}>
                                {item.metric}
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-600 line-clamp-1">
                            <span className="font-semibold text-slate-700">Found: </span>
                            <span className="font-mono text-slate-800 bg-slate-50 px-1 py-0.5 rounded border border-slate-200/60">
                              {item.foundValue.length > 90 ? item.foundValue.slice(0, 90) + '...' : item.foundValue}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          isPassed
                            ? 'bg-emerald-100 text-emerald-800'
                            : isWarning
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {item.severity.toUpperCase()}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Diagnostic Detail */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-4 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/60">
                            <span className="font-bold text-slate-800 block mb-1">Current Found Value</span>
                            <p className="font-mono text-slate-700 break-all bg-white p-2 rounded border border-slate-200">
                              {item.foundValue}
                            </p>
                          </div>

                          <div className="bg-emerald-50/60 rounded-xl p-3.5 border border-emerald-200/60">
                            <span className="font-bold text-emerald-900 block mb-1">Expected Google Standard</span>
                            <p className="text-emerald-800 leading-relaxed">
                              {item.expectedValue}
                            </p>
                          </div>
                        </div>

                        <div>
                          <strong className="text-slate-800 block mb-1">Google Search Standard & Guidelines</strong>
                          <p className="text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-200/60">
                            {item.googleStandard}
                          </p>
                        </div>

                        <div>
                          <strong className="text-slate-800 block mb-1">Ranking & User Experience Impact</strong>
                          <p className="text-slate-600 leading-relaxed">
                            {item.explanation}
                          </p>
                        </div>

                        <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-400 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              Actionable Recommendation & Fix
                            </span>

                            {item.codeSnippet && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyCode(item.id, item.codeSnippet!);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold text-[11px] transition-colors cursor-pointer"
                              >
                                {copiedId === item.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span>Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy Snippet</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>

                          <p className="text-slate-200 leading-relaxed">
                            {item.recommendation}
                          </p>

                          {item.codeSnippet && (
                            <pre className="bg-slate-950 p-3 rounded-lg overflow-x-auto font-mono text-[11px] text-emerald-300 border border-slate-800">
                              {item.codeSnippet}
                            </pre>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredItems.length === 0 && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-slate-900">No issues found matching this filter</h4>
                  <p className="text-xs text-slate-500 mt-1">All monitored criteria passed successfully under this category.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Live SERP & Social Sharing Simulator */}
        {activeTab === 'serp-preview' && auditReport && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-emerald-600" />
                    Real-Time Search & Social Preview Simulator
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    See exactly how Google and social platforms render your live meta tags.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSerpDevice('desktop')}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      serpDevice === 'desktop' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Google Desktop</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSerpDevice('mobile')}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      serpDevice === 'mobile' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Google Mobile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSerpDevice('social-og')}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      serpDevice === 'social-og' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Facebook / LinkedIn</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSerpDevice('twitter')}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      serpDevice === 'twitter' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    <span>Twitter / X</span>
                  </button>
                </div>
              </div>

              {/* Preview Rendering Box */}
              <div className="mt-6 flex justify-center">
                {/* 1. Google Desktop Preview */}
                {serpDevice === 'desktop' && (
                  <div className="w-full max-w-2xl bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm font-sans space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-700">
                      <div className="w-4 h-4 rounded-full bg-slate-900 flex items-center justify-center text-[9px] text-white font-bold">C</div>
                      <div className="flex items-center gap-1 truncate text-slate-600">
                        <span className="font-semibold text-slate-800">Compliance Hub</span>
                        <span>•</span>
                        <span className="text-slate-500 truncate">{auditReport.url}</span>
                      </div>
                    </div>

                    <h3 className="text-xl font-normal text-[#1a0dab] hover:underline cursor-pointer leading-snug line-clamp-1">
                      {auditReport.metaData.title || 'Untitled Page Document'}
                    </h3>

                    <p className="text-sm text-[#4d5156] leading-relaxed line-clamp-2">
                      {auditReport.metaData.description || 'No meta description detected in HTML head.'}
                    </p>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <span>Title Length: <strong className={auditReport.metaData.title.length > 60 ? 'text-amber-600' : 'text-emerald-600'}>{auditReport.metaData.title.length} chars</strong> (Max: ~60)</span>
                      <span>Description: <strong className={auditReport.metaData.description.length > 160 ? 'text-amber-600' : 'text-emerald-600'}>{auditReport.metaData.description.length} chars</strong> (Target: 120–160)</span>
                    </div>
                  </div>
                )}

                {/* 2. Google Mobile Preview */}
                {serpDevice === 'mobile' && (
                  <div className="w-full max-w-sm bg-white border-2 border-slate-300 rounded-3xl p-5 shadow-md font-sans space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-700">
                      <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-[10px] text-white font-bold">C</div>
                      <div>
                        <div className="font-bold text-slate-900 text-[11px] leading-tight">Compliance Hub</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{auditReport.url}</div>
                      </div>
                    </div>

                    <h4 className="text-base font-normal text-[#1a0dab] hover:underline cursor-pointer leading-snug line-clamp-2 mt-1">
                      {auditReport.metaData.title || 'Untitled Page Document'}
                    </h4>

                    <p className="text-xs text-[#4d5156] leading-relaxed line-clamp-3">
                      {auditReport.metaData.description || 'No description provided.'}
                    </p>
                  </div>
                )}

                {/* 3. OpenGraph / Facebook Preview */}
                {serpDevice === 'social-og' && (
                  <div className="w-full max-w-lg bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-sm font-sans">
                    <div className="w-full h-52 bg-slate-900 flex items-center justify-center relative overflow-hidden">
                      {auditReport.metaData.ogImage ? (
                        <img
                          src={auditReport.metaData.ogImage}
                          alt="OpenGraph Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="text-slate-400 text-xs flex flex-col items-center gap-2">
                          <Share2 className="w-8 h-8" />
                          <span>Missing og:image tag</span>
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-200/80 space-y-1">
                      <div className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                        {auditReport.metaData.ogSiteName || 'ACCOUNTICCA.COM'}
                      </div>
                      <div className="text-base font-bold text-slate-900 line-clamp-1 leading-snug">
                        {auditReport.metaData.ogTitle || auditReport.metaData.title}
                      </div>
                      <div className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {auditReport.metaData.ogDescription || auditReport.metaData.description}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Twitter / X Card Preview */}
                {serpDevice === 'twitter' && (
                  <div className="w-full max-w-lg bg-slate-950 text-white rounded-3xl p-5 border border-slate-800 shadow-lg font-sans space-y-3">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white">CH</div>
                      <div>
                        <div className="font-bold text-white text-xs">Compliance Hub Bangladesh</div>
                        <div className="text-[11px] text-slate-400">@accounticca</div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-200">
                      Check out the updated corporate tax, VAT, and RJSC compliance framework in Bangladesh:
                    </p>

                    <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900">
                      <div className="w-full h-48 bg-slate-800 flex items-center justify-center overflow-hidden">
                        {auditReport.metaData.twitterImage || auditReport.metaData.ogImage ? (
                          <img
                            src={auditReport.metaData.twitterImage || auditReport.metaData.ogImage}
                            alt="Twitter Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-slate-400">No card image</span>
                        )}
                      </div>
                      <div className="p-3 space-y-1">
                        <div className="text-[11px] text-slate-400">blog.accounticca.com</div>
                        <div className="text-xs font-bold text-white line-clamp-1">
                          {auditReport.metaData.twitterTitle || auditReport.metaData.title}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-2">
                          {auditReport.metaData.twitterDescription || auditReport.metaData.description}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Schema.org JSON-LD Inspector */}
        {activeTab === 'schema' && auditReport && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-emerald-600" />
                    Schema.org Structured Data Graph
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Entities detected in <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">&lt;script type="application/ld+json"&gt;</code> for Google Rich Results.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {auditReport.schemas.length} Valid Entities
                  </span>
                </div>
              </div>

              {/* Entity Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {auditReport.schemas.map((schema, index) => (
                  <div
                    key={`${schema.type}-${index}`}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-emerald-300 transition-all shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        @{schema.type}
                      </span>
                      {schema.valid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {schema.name || schema.type}
                    </h4>

                    <p className="text-xs text-slate-500 truncate">
                      ID: <span className="font-mono text-slate-700">{schema.id || 'Anonymous'}</span>
                    </p>

                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Properties: {Object.keys(schema.rawJson).length}</span>
                      <span className="text-emerald-700 font-semibold">Google Eligible</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Formatted Code Inspector */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Full Parsed JSON-LD Graph Payload:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode('full-schema', JSON.stringify(auditReport.schemas.map(s => s.rawJson), null, 2))}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    {copiedId === 'full-schema' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied JSON</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="bg-slate-900 text-emerald-300 p-4 rounded-xl overflow-x-auto font-mono text-xs max-h-96 border border-slate-800">
                  {JSON.stringify(auditReport.schemas.map(s => s.rawJson), null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Content Headers Hierarchy */}
        {activeTab === 'headers' && auditReport && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-emerald-600" />
                    Document Heading Hierarchy & Semantic Structure
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Analyzing H1, H2, and H3 tags to ensure logical content hierarchy according to Google Search Central guidelines.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                    Total Headings: {auditReport.headers.length}
                  </span>
                </div>
              </div>

              {auditReport.headers.length === 0 ? (
                <div className="mt-6 p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
                  <HelpCircle className="w-10 h-10 text-slate-400 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-800">
                    No Headings Found in Static HTML Shell ({auditReport.sourceType})
                  </h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                    This SPA mounts all headings dynamically via React client components. Switch to
                    the <strong>"Live Rendered App DOM"</strong> mode using the source selector above to audit the runtime headings tree.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSourceChange('rendered-dom')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    <span>Switch to Live Rendered DOM</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="mt-6 space-y-2.5">
                  {auditReport.headers.map((h, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        h.level === 1
                          ? 'bg-emerald-50/70 border-emerald-300 font-bold text-emerald-950'
                          : h.level === 2
                          ? 'bg-slate-50 border-slate-200 font-semibold text-slate-800 ml-4'
                          : 'bg-white border-slate-200 text-slate-700 ml-8'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          h.level === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {h.tag.toUpperCase()}
                        </span>
                        <span className="truncate">{h.text || '<Empty Heading>'}</span>
                      </div>

                      <span className="text-[11px] text-slate-400 shrink-0 ml-3">
                        {h.length} chars
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Compliant Head Generator */}
        {activeTab === 'generator' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    Google 2026 Compliant &lt;head&gt; Generator
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pre-optimized HTML snippet adhering to Google SEO guidelines, title/description character limits, and Schema.org rich results.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyCode('generator-snippet', recommendedCompliantHead)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  {copiedId === 'generator-snippet' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Complete &lt;head&gt;</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="bg-slate-900 text-emerald-300 p-5 rounded-xl overflow-x-auto font-mono text-xs leading-relaxed max-h-[500px] border border-slate-800">
                {recommendedCompliantHead}
              </pre>
            </div>
          </div>
        )}

        {/* Bottom Statutory Context & Reference */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Continuous SEO Monitoring & Search Engine Compliance
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Our audit engine inspects metadata tags, OpenGraph cards, Twitter cards, and Schema.org JSON-LD against Google Search Central guidelines, ensuring maximum visibility for Bangladesh corporate compliance, tax, and legal resources.
            </p>
          </div>

          <Link
            to="/tools"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer shadow-xs"
          >
            <span>Explore All Calculators & Tools</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </ToolPageLayout>
  );
}

export default SeoPerformanceAuditPage;
