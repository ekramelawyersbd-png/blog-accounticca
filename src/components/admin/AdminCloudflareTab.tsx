import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RefreshCw,
  Copy,
  Check,
  Trash2,
  Terminal,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { getAdminAuthHeaders } from '../../contexts/ShopAuthContext';
import { useTableSort } from '../../hooks/useTableSort';
import { SortableTh } from '../ui/SortableTh';
import { CloudflareStatusPanel } from './cloudflare/CloudflareStatusPanel';
import { TurnstileSecurityLogs } from './cloudflare/TurnstileSecurityLogs';

interface CloudflareStatusPayload {
  success: boolean;
  checkedAt: string;
  edge: {
    proxied: boolean;
    cfRay: string | null;
    cfCountry: string | null;
    cfConnectingIp: string | null;
    clientIp: string;
    visitorScheme: string | null;
    protocol: string;
    host: string;
  };
  turnstile: {
    configured: boolean;
    usingTestKey: boolean;
    siteKeyPreview: string;
    allowedHostnames: string[];
  };
  r2: {
    configured: boolean;
    mode: 'cloudflare-r2' | 'local-fallback';
    bucketName: string;
    signedUrlTtlSeconds: number;
    accountConfigured: boolean;
  };
  analytics: {
    configured: boolean;
  };
  cacheApi: {
    purgeConfigured: boolean;
    zoneConfigured: boolean;
    tokenConfigured: boolean;
  };
  wrangler: {
    configured: boolean;
    appName: string;
    compatibilityDate: string;
    pagesOutputDir: string;
  };
  cachePolicies: Array<{
    routePattern: string;
    cacheControl: string;
    cdnCacheControl: string;
    purpose: string;
  }>;
}

interface HeaderProbeRow {
  path: string;
  category: string;
  cacheControl: string;
  cdnCacheControl: string;
  securityHeaders: string[];
}

interface DiagnosticRow {
  id: string;
  capability: string;
  layer: string;
  runtimeMode: string;
  configuration: string;
  state: 'Active' | 'Fallback' | 'Setup Pending';
}

interface ChecklistItem {
  id: string;
  category: 'DNS & SSL' | 'Security & WAF' | 'Storage & Analytics';
  title: string;
  detail: string;
  envOrRule: string;
}

const CHECKLIST_STORAGE_KEY = 'elawyers_cloudflare_golive_checklist_v1';

const GOLIVE_CHECKLIST: ChecklistItem[] = [
  {
    id: 'dns-proxy',
    category: 'DNS & SSL',
    title: 'Enable Proxied (Orange Cloud) DNS records for apex and blog subdomains',
    detail: 'Point accounticca.com and blog.accounticca.com A/CNAME records to your Node.js origin with Proxy status enabled so CF-Ray and CF-Connecting-IP headers are injected.',
    envOrRule: 'DNS -> Proxied',
  },
  {
    id: 'ssl-strict',
    category: 'DNS & SSL',
    title: 'Set SSL/TLS encryption mode to Full (Strict) with Cloudflare Origin Certificate',
    detail: 'Avoid Flexible SSL redirect loops by installing a 15-year Cloudflare Origin CA certificate or connecting via Cloudflare Tunnel.',
    envOrRule: 'SSL/TLS -> Full (Strict)',
  },
  {
    id: 'tunnel-or-origin',
    category: 'DNS & SSL',
    title: 'Configure Cloudflare Tunnel (cloudflared) or lock origin firewall to Cloudflare IPs',
    detail: 'Restrict direct port 3000/443 origin ingress to Cloudflare IP ranges or route privately through cloudflared so attackers cannot bypass WAF.',
    envOrRule: 'Zero Trust -> Tunnels',
  },
  {
    id: 'waf-rate-limit',
    category: 'Security & WAF',
    title: 'Add WAF rate-limit rules for /api/admin/login and public submission routes',
    detail: 'Edge rate limiting complements Express sliding-window limiters and stops credential stuffing before traffic hits the Node.js origin.',
    envOrRule: 'Security -> WAF',
  },
  {
    id: 'turnstile-prod',
    category: 'Security & WAF',
    title: 'Set live Cloudflare Turnstile Site Key & Secret Key in server environment',
    detail: 'Configure VITE_TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY, and TURNSTILE_HOSTNAMES to replace the Cloudflare test fallback key.',
    envOrRule: 'VITE_TURNSTILE_SITE_KEY / TURNSTILE_SECRET_KEY',
  },
  {
    id: 'cache-rules',
    category: 'DNS & SSL',
    title: 'Enable Origin Cache Control so Cloudflare honors Cloudflare-CDN-Cache-Control',
    detail: 'Static /assets/* cache for 1 year immutable, public articles cache at edge with SWR, while /api/* and /admin/* emit no-store.',
    envOrRule: 'Caching -> Origin Cache Control',
  },
  {
    id: 'r2-cors',
    category: 'Storage & Analytics',
    title: 'Configure Cloudflare R2 credentials and bucket CORS policy for LMS uploads',
    detail: 'Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY and allow PUT/GET from your production domain on the R2 bucket.',
    envOrRule: 'R2_ACCOUNT_ID / R2_BUCKET_NAME',
  },
  {
    id: 'analytics-purge',
    category: 'Storage & Analytics',
    title: 'Activate Cloudflare Web Analytics token and Zone Cache Purge API token',
    detail: 'Add VITE_CLOUDFLARE_ANALYTICS_TOKEN for cookie-free visitor telemetry and CLOUDFLARE_ZONE_ID + CLOUDFLARE_API_TOKEN for one-click edge purges.',
    envOrRule: 'CLOUDFLARE_ZONE_ID / VITE_CLOUDFLARE_ANALYTICS_TOKEN',
  },
];

const CLI_SNIPPETS = [
  {
    id: 'wrangler-auth',
    label: 'Authenticate Wrangler CLI with Cloudflare',
    command: 'npx wrangler login && npm run cf:whoami',
  },
  {
    id: 'pages-deploy',
    label: 'Build & Deploy Static Edge Bundle to Cloudflare Pages',
    command: 'npm run cf:pages:deploy',
  },
  {
    id: 'pages-dev',
    label: 'Preview Cloudflare Pages _headers & _redirects Locally',
    command: 'npm run build && npm run cf:pages:dev',
  },
  {
    id: 'cloudflared-tunnel',
    label: 'Expose Local Node.js Express Origin via Cloudflare Tunnel',
    command: 'cloudflared tunnel --url http://localhost:3000',
  },
];

function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function AdminCloudflareTab() {
  const [status, setStatus] = useState<CloudflareStatusPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState<'overview' | 'turnstile-logs' | 'cache' | 'checklist'>('overview');

  // Header probe state
  const [probingHeaders, setProbingHeaders] = useState<boolean>(false);
  const [headerProbeRows, setHeaderProbeRows] = useState<HeaderProbeRow[] | null>(null);
  const [headerProbeCheckedAt, setHeaderProbeCheckedAt] = useState<string | null>(null);
  const [headerProbeError, setHeaderProbeError] = useState<string | null>(null);

  // Cache purge state
  const [purgeMode, setPurgeMode] = useState<'everything' | 'urls'>('urls');
  const [purgeUrlsInput, setPurgeUrlsInput] = useState<string>(
    'https://blog.accounticca.com/sitemap.xml\nhttps://blog.accounticca.com/'
  );
  const [purging, setPurging] = useState<boolean>(false);
  const [purgeResult, setPurgeResult] = useState<{
    ok: boolean;
    message: string;
    rayId?: string | null;
    timestamp: string;
  } | null>(null);

  // Checklist & CLI copy state
  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(CHECKLIST_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return [];
  });
  const [checklistFilter, setChecklistFilter] = useState<
    'All' | 'DNS & SSL' | 'Security & WAF' | 'Storage & Analytics'
  >('All');
  const [diagnosticSearch, setDiagnosticSearch] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const clientAnalyticsConfigured = Boolean(
    (import.meta.env.VITE_CLOUDFLARE_ANALYTICS_TOKEN || '').trim()
  );

  const fetchStatus = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetch('/api/admin/cloudflare/status', {
        headers: getAdminAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || `Failed to load Cloudflare status (HTTP ${res.status})`);
      }
      setStatus(data as CloudflareStatusPayload);
    } catch (err: any) {
      setError(err?.message || 'Unable to query Cloudflare runtime diagnostics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchStatus(false);
  }, [fetchStatus]);

  useEffect(() => {
    try {
      localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(completedIds));
    } catch {
      // ignore storage errors
    }
  }, [completedIds]);

  const handleTestEdgeHeaders = async () => {
    setProbingHeaders(true);
    setHeaderProbeError(null);
    try {
      const res = await fetch('/api/admin/cloudflare/test-headers', {
        headers: getAdminAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || `Header probe failed (HTTP ${res.status})`);
      }
      setHeaderProbeRows(Array.isArray(data.matrix) ? data.matrix : []);
      setHeaderProbeCheckedAt(data.checkedAt || new Date().toISOString());
    } catch (err: any) {
      setHeaderProbeError(err?.message || 'Unable to test edge headers.');
    } finally {
      setProbingHeaders(false);
    }
  };

  const handlePurgeCache = async (e: React.FormEvent) => {
    e.preventDefault();
    setPurging(true);
    setPurgeResult(null);

    const parsedUrls =
      purgeMode === 'urls'
        ? purgeUrlsInput
            .split(/[\n,]+/)
            .map((u) => u.trim())
            .filter(Boolean)
        : [];

    if (purgeMode === 'urls' && parsedUrls.length === 0) {
      setPurgeResult({
        ok: false,
        message: 'Enter at least one full https:// URL before requesting a targeted cache purge.',
        timestamp: new Date().toISOString(),
      });
      setPurging(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/cloudflare/purge-cache', {
        method: 'POST',
        headers: getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          mode: purgeMode,
          urls: parsedUrls,
        }),
      });
      const data = await res.json().catch(() => ({}));
      setPurgeResult({
        ok: Boolean(res.ok && data?.success),
        message: data?.message || data?.error || `Cloudflare purge responded with HTTP ${res.status}`,
        rayId: data?.rayId || null,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      setPurgeResult({
        ok: false,
        message: err?.message || 'Network error while contacting Cloudflare purge endpoint.',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setPurging(false);
    }
  };

  const toggleChecklistItem = (id: string) => {
    setCompletedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCopyCommand = async (id: string, command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId((current) => (current === id ? null : current));
      }, 1600);
    } catch {
      // Fallback copy if clipboard API unavailable
      setCopiedId(null);
    }
  };

  const diagnosticRows = useMemo<DiagnosticRow[]>(() => {
    if (!status) return [];
    const analyticsActive = status.analytics.configured || clientAnalyticsConfigured;
    return [
      {
        id: 'proxy',
        capability: 'Cloudflare Reverse Proxy',
        layer: 'Edge Network',
        runtimeMode: status.edge.proxied ? 'Proxied via Cloudflare Edge' : 'Direct Origin Traffic',
        configuration: status.edge.cfRay
          ? `CF-Ray ${status.edge.cfRay} · Country ${status.edge.cfCountry || 'N/A'}`
          : `Host ${status.edge.host} · No CF-Ray header on current request`,
        state: status.edge.proxied ? 'Active' : 'Setup Pending',
      },
      {
        id: 'client-ip',
        capability: 'Real Visitor IP Attribution',
        layer: 'Origin Security',
        runtimeMode: status.edge.cfConnectingIp ? 'CF-Connecting-IP Active' : 'X-Forwarded-For Fallback',
        configuration: `Resolved IP ${status.edge.clientIp} · Express trust proxy enabled`,
        state: status.edge.cfConnectingIp ? 'Active' : 'Fallback',
      },
      {
        id: 'cache-headers',
        capability: 'Tiered Edge Cache Headers',
        layer: 'CDN Caching',
        runtimeMode: 'Express Origin Middleware + _headers',
        configuration: `${status.cachePolicies.length} route tiers (/assets immutable, /api & /admin no-store)`,
        state: 'Active',
      },
      {
        id: 'security-headers',
        capability: 'Baseline Security Headers',
        layer: 'Origin Security',
        runtimeMode: 'Iframe-Safe Edge Hardening',
        configuration: 'nosniff · strict-origin-when-cross-origin · Permissions-Policy · HTTPS HSTS',
        state: 'Active',
      },
      {
        id: 'turnstile',
        capability: 'Cloudflare Turnstile Verification',
        layer: 'Bot Protection',
        runtimeMode:
          status.turnstile.configured && !status.turnstile.usingTestKey
            ? 'Live Production Keys'
            : 'Cloudflare Test Key Fallback',
        configuration: `Site key ${status.turnstile.siteKeyPreview} · ${status.turnstile.allowedHostnames.length} allowed hostnames`,
        state:
          status.turnstile.configured && !status.turnstile.usingTestKey ? 'Active' : 'Fallback',
      },
      {
        id: 'r2',
        capability: 'Cloudflare R2 Object Storage',
        layer: 'LMS Media Storage',
        runtimeMode: status.r2.configured ? 'Cloudflare R2 (S3 Presigned)' : 'Local Storage Fallback',
        configuration: `Bucket ${status.r2.bucketName} · Presigned TTL ${status.r2.signedUrlTtlSeconds}s`,
        state: status.r2.configured ? 'Active' : 'Fallback',
      },
      {
        id: 'analytics',
        capability: 'Cloudflare Web Analytics',
        layer: 'Observability',
        runtimeMode: analyticsActive ? 'Beacon Script Active' : 'Unconfigured (Silent No-Op)',
        configuration: analyticsActive
          ? 'VITE_CLOUDFLARE_ANALYTICS_TOKEN detected'
          : 'Set VITE_CLOUDFLARE_ANALYTICS_TOKEN to enable cookie-free beacon',
        state: analyticsActive ? 'Active' : 'Setup Pending',
      },
      {
        id: 'cache-purge',
        capability: 'Zone Cache Purge REST API',
        layer: 'CDN Operations',
        runtimeMode: status.cacheApi.purgeConfigured ? 'Zone API Connected' : 'Credentials Pending',
        configuration: status.cacheApi.purgeConfigured
          ? 'CLOUDFLARE_ZONE_ID & CLOUDFLARE_API_TOKEN configured server-side'
          : 'Set CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN in server env',
        state: status.cacheApi.purgeConfigured ? 'Active' : 'Setup Pending',
      },
      {
        id: 'wrangler',
        capability: 'Wrangler CLI & Pages Manifests',
        layer: 'Deployment Tooling',
        runtimeMode: status.wrangler.configured ? 'wrangler.jsonc + _headers/_redirects' : 'Missing Config',
        configuration: `Project ${status.wrangler.appName} · Output ${status.wrangler.pagesOutputDir}`,
        state: status.wrangler.configured ? 'Active' : 'Setup Pending',
      },
    ];
  }, [status, clientAnalyticsConfigured]);

  const filteredDiagnostics = useMemo(() => {
    const q = diagnosticSearch.trim().toLowerCase();
    if (!q) return diagnosticRows;
    return diagnosticRows.filter(
      (row) =>
        row.capability.toLowerCase().includes(q) ||
        row.layer.toLowerCase().includes(q) ||
        row.runtimeMode.toLowerCase().includes(q) ||
        row.configuration.toLowerCase().includes(q) ||
        row.state.toLowerCase().includes(q)
    );
  }, [diagnosticRows, diagnosticSearch]);

  const { sortedItems: sortedDiagnostics, getSortDirection, requestSort } = useTableSort<
    DiagnosticRow,
    'capability' | 'layer' | 'runtimeMode' | 'state'
  >(filteredDiagnostics, {
    initialSort: { key: 'capability', direction: 'asc' },
    accessors: {
      capability: (r) => r.capability,
      layer: (r) => r.layer,
      runtimeMode: (r) => r.runtimeMode,
      state: (r) => r.state,
    },
  });

  const filteredChecklist = useMemo(() => {
    if (checklistFilter === 'All') return GOLIVE_CHECKLIST;
    return GOLIVE_CHECKLIST.filter((item) => item.category === checklistFilter);
  }, [checklistFilter]);

  const renderSemanticStateText = (state: DiagnosticRow['state']) => {
    if (state === 'Active') {
      return <span className="font-semibold text-emerald-700">Active</span>;
    }
    if (state === 'Fallback') {
      return <span className="font-semibold text-amber-700">Fallback</span>;
    }
    return <span className="font-semibold text-slate-600">Setup Pending</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-medium text-slate-500 flex items-center gap-2">
            <span>Admin Operations</span>
            <span aria-hidden="true">·</span>
            <span>Edge Infrastructure</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              Last checked {formatTime(status?.checkedAt)}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Cloudflare Edge, Security &amp; Deployment Console
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl">
            Monitor live Cloudflare proxy headers, Turnstile and R2 production readiness, tiered
            origin cache directives, and Wrangler deployment tooling for the Node.js Express origin.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => void fetchStatus(true)}
            disabled={refreshing || loading}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Diagnostics'}</span>
          </button>
        </div>
      </div>

      {/* Error Recovery Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900">
                Could not load Cloudflare runtime diagnostics
              </p>
              <p className="text-xs text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void fetchStatus(true)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white text-red-800 border border-red-300 hover:bg-red-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Retry Probe
          </button>
        </div>
      )}

      {/* 4-Column Top KPI Strip (Flat single-elevation) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Edge Proxy Status</p>
          {loading ? (
            <div className="h-7 w-32 bg-slate-100 rounded mt-2" />
          ) : (
            <p
              className={`text-lg font-bold mt-1.5 ${
                status?.edge.proxied ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {status?.edge.proxied ? 'Cloudflare Proxied' : 'Direct Origin'}
            </p>
          )}
          <p className="text-xs text-slate-500 font-mono tabular-nums mt-2 truncate">
            {status?.edge.cfRay
              ? `Ray: ${status.edge.cfRay}`
              : `IP: ${status?.edge.clientIp || '—'}`}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Turnstile Protection</p>
          {loading ? (
            <div className="h-7 w-32 bg-slate-100 rounded mt-2" />
          ) : (
            <p
              className={`text-lg font-bold mt-1.5 ${
                status?.turnstile.configured && !status?.turnstile.usingTestKey
                  ? 'text-emerald-700'
                  : 'text-amber-700'
              }`}
            >
              {status?.turnstile.configured && !status?.turnstile.usingTestKey
                ? 'Live Production'
                : 'Test Key Fallback'}
            </p>
          )}
          <p className="text-xs text-slate-500 font-mono tabular-nums mt-2 truncate">
            Key: {status?.turnstile.siteKeyPreview || '—'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">R2 Object Storage</p>
          {loading ? (
            <div className="h-7 w-32 bg-slate-100 rounded mt-2" />
          ) : (
            <p
              className={`text-lg font-bold mt-1.5 ${
                status?.r2.configured ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {status?.r2.configured ? 'Cloudflare R2 Active' : 'Local Fallback'}
            </p>
          )}
          <p className="text-xs text-slate-500 font-mono tabular-nums mt-2 truncate">
            Bucket: {status?.r2.bucketName || 'elawyers-lms-assets'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Web Analytics &amp; Purge API</p>
          {loading ? (
            <div className="h-7 w-32 bg-slate-100 rounded mt-2" />
          ) : (
            <p
              className={`text-lg font-bold mt-1.5 ${
                status?.analytics.configured || clientAnalyticsConfigured
                  ? 'text-emerald-700'
                  : 'text-slate-800'
              }`}
            >
              {status?.analytics.configured || clientAnalyticsConfigured
                ? 'Beacon Active'
                : 'Beacon Pending'}
            </p>
          )}
          <p className="text-xs text-slate-500 font-mono tabular-nums mt-2 truncate">
            Purge API: {status?.cacheApi.purgeConfigured ? 'Configured' : 'Env Pending'}
          </p>
        </div>
      </div>

      {/* Segmented Section Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveSection('overview')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeSection === 'overview'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overview &amp; Diagnostics
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('turnstile-logs')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeSection === 'turnstile-logs'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Turnstile Logs
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('cache')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeSection === 'cache'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cache &amp; Headers
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('checklist')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeSection === 'checklist'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Go-Live Checklist &amp; CLI ({completedIds.length}/{GOLIVE_CHECKLIST.length})
          </button>
        </div>

        <div className="text-xs text-slate-500 font-mono tabular-nums">
          Origin: {status?.edge.protocol || 'https'}://{status?.edge.host || 'localhost:3000'}
        </div>
      </div>

      {/* SECTION 1: OVERVIEW & DIAGNOSTICS */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          <CloudflareStatusPanel />
          <TurnstileSecurityLogs />

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Cloudflare Capability Matrix
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Live server-side verification across proxy headers, Turnstile, R2 storage, analytics, and Wrangler tooling.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={diagnosticSearch}
                onChange={(e) => setDiagnosticSearch(e.target.value)}
                placeholder="Filter capabilities..."
                aria-label="Filter Cloudflare capabilities"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700">
                  <SortableTh
                    label="Capability"
                    sortKey="capability"
                    direction={getSortDirection('capability')}
                    onSort={requestSort}
                    className="px-4 py-3"
                  />
                  <SortableTh
                    label="Layer"
                    sortKey="layer"
                    direction={getSortDirection('layer')}
                    onSort={requestSort}
                    className="px-4 py-3"
                  />
                  <SortableTh
                    label="Runtime Mode"
                    sortKey="runtimeMode"
                    direction={getSortDirection('runtimeMode')}
                    onSort={requestSort}
                    className="px-4 py-3"
                  />
                  <th className="px-4 py-3 text-xs font-semibold">Observed Configuration</th>
                  <SortableTh
                    label="Status"
                    sortKey="state"
                    direction={getSortDirection('state')}
                    onSort={requestSort}
                    align="right"
                    className="px-4 py-3"
                  />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {loading ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <tr key={idx} className="h-11">
                      <td className="px-4 py-3"><div className="h-4 w-40 bg-slate-100 rounded" /></td>
                      <td className="px-4 py-3"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                      <td className="px-4 py-3"><div className="h-4 w-36 bg-slate-100 rounded" /></td>
                      <td className="px-4 py-3"><div className="h-4 w-56 bg-slate-100 rounded" /></td>
                      <td className="px-4 py-3 text-right"><div className="h-4 w-16 bg-slate-100 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : sortedDiagnostics.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                      No Cloudflare capabilities match &ldquo;{diagnosticSearch}&rdquo;.
                    </td>
                  </tr>
                ) : (
                  sortedDiagnostics.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                        {row.capability}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                        {row.layer}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-slate-800 whitespace-nowrap">
                        {row.runtimeMode}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono tabular-nums text-slate-600">
                        {row.configuration}
                      </td>
                      <td className="px-4 py-3 text-xs text-right whitespace-nowrap">
                        {renderSemanticStateText(row.state)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      )}

      {/* SECTION 1B: TURNSTILE SECURITY LOGS (FOCUSED VIEW) */}
      {activeSection === 'turnstile-logs' && (
        <TurnstileSecurityLogs />
      )}

      {/* SECTION 2: CACHE & HEADERS */}
      {activeSection === 'cache' && (
        <div className="space-y-6">
          {/* Tiered Cache Policies + Live Header Probe */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Origin Cache-Control &amp; Edge Header Verification
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Express middleware emits differentiated browser and Cloudflare edge cache directives per route class.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleTestEdgeHeaders()}
                disabled={probingHeaders}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{probingHeaders ? 'Testing Headers...' : 'Test Edge Headers'}</span>
              </button>
            </div>

            {headerProbeError && (
              <div className="px-5 py-3 bg-red-50 border-b border-red-200 text-xs text-red-800">
                {headerProbeError}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold">
                    <th className="px-4 py-3">Route Pattern</th>
                    <th className="px-4 py-3">Cache-Control</th>
                    <th className="px-4 py-3">Cloudflare-CDN-Cache-Control</th>
                    <th className="px-4 py-3">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {(status?.cachePolicies || []).map((policy) => (
                    <tr key={policy.routePattern} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-semibold whitespace-nowrap">
                        {policy.routePattern}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums">{policy.cacheControl}</td>
                      <td className="px-4 py-3 font-mono tabular-nums">{policy.cdnCacheControl}</td>
                      <td className="px-4 py-3 text-slate-600">{policy.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {headerProbeRows && (
              <div className="border-t border-slate-200 p-5 bg-slate-50 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-900">
                    Live Header Probe Matrix ({headerProbeRows.length} routes verified)
                  </p>
                  <p className="text-xs font-mono tabular-nums text-slate-500">
                    Verified at {formatTime(headerProbeCheckedAt)}
                  </p>
                </div>
                <div className="overflow-x-auto bg-white border border-slate-200 rounded-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-semibold">
                        <th className="px-3 py-2.5">Sample Path</th>
                        <th className="px-3 py-2.5">Classification</th>
                        <th className="px-3 py-2.5">Cloudflare-CDN-Cache-Control</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {headerProbeRows.map((row) => (
                        <tr key={row.path}>
                          <td className="px-3 py-2.5 font-mono font-medium whitespace-nowrap">
                            {row.path}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">{row.category}</td>
                          <td className="px-3 py-2.5 font-mono tabular-nums">
                            {row.cdnCacheControl}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Zone Cache Purge Console */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Cloudflare Zone Edge Cache Purge
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Executes server-side against Cloudflare&apos;s REST API using{' '}
                  <span className="font-mono">CLOUDFLARE_ZONE_ID</span> and{' '}
                  <span className="font-mono">CLOUDFLARE_API_TOKEN</span>.
                </p>
              </div>
              <div className="text-xs font-semibold">
                {status?.cacheApi.purgeConfigured ? (
                  <span className="text-emerald-700">API Credentials Ready</span>
                ) : (
                  <span className="text-amber-700">Server Env Credentials Needed</span>
                )}
              </div>
            </div>

            <form onSubmit={handlePurgeCache} className="space-y-4">
              <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPurgeMode('urls')}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    purgeMode === 'urls'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Purge Specific URLs
                </button>
                <button
                  type="button"
                  onClick={() => setPurgeMode('everything')}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    purgeMode === 'everything'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Purge Entire Zone
                </button>
              </div>

              {purgeMode === 'urls' ? (
                <div className="space-y-1.5">
                  <label
                    htmlFor="cf-purge-urls"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Target URLs (one per line, max 30 per Cloudflare API call)
                  </label>
                  <textarea
                    id="cf-purge-urls"
                    rows={4}
                    value={purgeUrlsInput}
                    onChange={(e) => setPurgeUrlsInput(e.target.value)}
                    placeholder="https://blog.accounticca.com/sitemap.xml"
                    className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>
              ) : (
                <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  Purging the entire zone immediately invalidates all cached assets across Cloudflare
                  edge data centers and temporarily increases origin requests until caches warm again.
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={purging}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>
                    {purging
                      ? 'Submitting Purge...'
                      : purgeMode === 'everything'
                        ? 'Purge Entire Cloudflare Zone'
                        : 'Purge Selected URLs'}
                  </span>
                </button>
                <span className="text-xs text-slate-500">
                  Secrets remain strictly server-side and are never stored in the browser.
                </span>
              </div>
            </form>

            {purgeResult && (
              <div
                className={`p-4 rounded-lg border text-xs flex items-start gap-2.5 ${
                  purgeResult.ok
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                {purgeResult.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="font-semibold">{purgeResult.message}</p>
                  <p className="font-mono tabular-nums text-[11px] opacity-80">
                    Time: {formatTime(purgeResult.timestamp)}
                    {purgeResult.rayId ? ` · CF-Ray: ${purgeResult.rayId}` : ''}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 3: GO-LIVE CHECKLIST & WRANGLER CLI */}
      {activeSection === 'checklist' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Interactive Go-Live Checklist */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Cloudflare Go-Live Checklist
                  </h3>
                  <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                    {completedIds.length} / {GOLIVE_CHECKLIST.length} completed · Saved in browser
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCompletedIds([])}
                  disabled={completedIds.length === 0}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
                {(['All', 'DNS & SSL', 'Security & WAF', 'Storage & Analytics'] as const).map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setChecklistFilter(cat)}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                        checklistFilter === cat
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="divide-y divide-slate-200">
              {filteredChecklist.map((item) => {
                const checked = completedIds.includes(item.id);
                return (
                  <label
                    key={item.id}
                    className="flex items-start gap-3.5 p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleChecklistItem(item.id)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600 cursor-pointer"
                    />
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{item.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-slate-600">{item.envOrRule}</span>
                      </div>
                      <p
                        className={`text-sm font-semibold ${
                          checked ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.detail}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Wrangler & Cloudflared CLI Commands */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-5 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-700" />
                <h3 className="text-base font-bold text-slate-900">
                  Wrangler &amp; Tunnel CLI Commands
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Wrangler CLI and Cloudflare Pages manifests are pre-configured in this workspace.
              </p>
            </div>

            <div className="divide-y divide-slate-200">
              {CLI_SNIPPETS.map((snippet) => {
                const isCopied = copiedId === snippet.id;
                return (
                  <div key={snippet.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-800">{snippet.label}</p>
                      <button
                        type="button"
                        onClick={() => void handleCopyCommand(snippet.id, snippet.command)}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-700" />
                            <span className="text-emerald-700">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-3 rounded-lg bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto">
                      <code>{snippet.command}</code>
                    </pre>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
