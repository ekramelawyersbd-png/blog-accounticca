import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Shield,
  HardDrive,
  Globe,
  Trash2,
  X,
} from 'lucide-react';
import { getAdminAuthHeaders } from '../../../contexts/ShopAuthContext';

export interface EdgeCacheZoneStatus {
  source: 'cloudflare-api' | 'origin-middleware';
  zoneApiConnected: boolean;
  zoneIdPreview: string | null;
  zoneName: string | null;
  zoneStatus: string;
  planName: string | null;
  developmentMode: boolean;
  cacheLevel: string;
  browserCacheTtl: number | null;
  sslMode: string;
  proxiedRequest: boolean;
  cfRay: string | null;
  cfCountry: string | null;
  activePolicyCount: number;
  apiNotice: string | null;
}

export interface ActiveSecurityRule {
  id: string;
  name: string;
  scope: 'Edge WAF' | 'Bot Protection' | 'Rate Limit' | 'Security Headers' | 'Access Control';
  target: string;
  action: string;
  status: 'Active' | 'Fallback' | 'Edge Pending';
  source: 'Cloudflare API' | 'Express Origin';
}

export interface R2RecentObject {
  key: string;
  sizeBytes: number;
  lastModified: string;
  category: 'Video' | 'Document' | 'Presentation' | 'Data' | 'Other';
}

export interface R2StorageUsageStats {
  mode: 'cloudflare-r2' | 'local-fallback';
  bucketName: string;
  signedUrlTtlSeconds: number;
  endpointHost: string | null;
  totalObjects: number;
  totalBytes: number;
  truncated: boolean;
  byCategory: Array<{
    category: string;
    objectCount: number;
    totalBytes: number;
  }>;
  recentObjects: R2RecentObject[];
  notice: string | null;
}

interface TelemetryResponse {
  success: boolean;
  checkedAt: string;
  edgeCacheZone: EdgeCacheZoneStatus;
  securityRules: ActiveSecurityRule[];
  r2Usage: R2StorageUsageStats;
  error?: string;
}

export interface EdgeCachePurgeResult {
  status: 'success' | 'error';
  mode: 'everything' | 'urls';
  message: string;
  rayId: string | null;
  purgedCount?: number;
  timestamp: string;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const val = bytes / Math.pow(1024, idx);
  return `${val >= 100 || idx === 0 ? val.toFixed(0) : val.toFixed(1)} ${units[idx]}`;
}

function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) return '—';
  return date.toLocaleString([], {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTimeOnly(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function CloudflareStatusPanel() {
  const [data, setData] = useState<TelemetryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [ruleScopeFilter, setRuleScopeFilter] = useState<'All' | ActiveSecurityRule['scope']>('All');

  // Edge Cache Purge state (Cloudflare API Zone:Cache Purge)
  const [purgeMode, setPurgeMode] = useState<'everything' | 'urls'>('everything');
  const [purgeUrlsInput, setPurgeUrlsInput] = useState<string>(
    'https://blog.accounticca.com/\nhttps://blog.accounticca.com/sitemap.xml'
  );
  const [confirmFullPurge, setConfirmFullPurge] = useState<boolean>(false);
  const [purging, setPurging] = useState<boolean>(false);
  const [purgeResult, setPurgeResult] = useState<EdgeCachePurgeResult | null>(null);

  const loadTelemetry = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetch('/api/admin/cloudflare/telemetry', {
        headers: getAdminAuthHeaders(),
      });
      const json: TelemetryResponse = await res.json().catch(() => ({
        success: false,
        checkedAt: '',
        edgeCacheZone: {} as EdgeCacheZoneStatus,
        securityRules: [],
        r2Usage: {} as R2StorageUsageStats,
        error: `Unexpected server response (HTTP ${res.status})`,
      }));

      if (!res.ok || !json.success) {
        throw new Error(json.error || `Failed to fetch Cloudflare telemetry (HTTP ${res.status})`);
      }

      setData(json);
    } catch (err: any) {
      setError(err?.message || 'Unable to retrieve Cloudflare zone, security, and R2 statistics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadTelemetry(false);
  }, [loadTelemetry]);

  const availableScopes = useMemo(() => {
    const base: Array<'All' | ActiveSecurityRule['scope']> = ['All'];
    if (!data?.securityRules) return base;
    const seen = new Set<ActiveSecurityRule['scope']>();
    for (const rule of data.securityRules) {
      if (!seen.has(rule.scope)) {
        seen.add(rule.scope);
        base.push(rule.scope);
      }
    }
    return base;
  }, [data?.securityRules]);

  const filteredRules = useMemo(() => {
    if (!data?.securityRules) return [];
    if (ruleScopeFilter === 'All') return data.securityRules;
    return data.securityRules.filter((r) => r.scope === ruleScopeFilter);
  }, [data?.securityRules, ruleScopeFilter]);

  const activeRuleCount = useMemo(
    () => (data?.securityRules || []).filter((r) => r.status === 'Active').length,
    [data?.securityRules]
  );

  /**
   * Triggers a Cloudflare edge cache purge via the server-side proxy endpoint
   * backed by CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN (Zone:Cache Purge permission).
   */
  const purgeEdgeCache = useCallback(
    async (mode: 'everything' | 'urls', rawUrls?: string[]): Promise<EdgeCachePurgeResult> => {
      setPurging(true);
      setPurgeResult(null);

      const cleanedUrls =
        mode === 'urls'
          ? (rawUrls ?? purgeUrlsInput.split(/[\n,]+/))
              .map((u) => u.trim())
              .filter(Boolean)
          : [];

      if (mode === 'urls') {
        if (cleanedUrls.length === 0) {
          const validationErr: EdgeCachePurgeResult = {
            status: 'error',
            mode,
            message: 'Enter at least one full https:// URL to purge from Cloudflare edge cache.',
            rayId: null,
            timestamp: new Date().toISOString(),
          };
          setPurgeResult(validationErr);
          setPurging(false);
          return validationErr;
        }
        if (cleanedUrls.length > 30) {
          const limitErr: EdgeCachePurgeResult = {
            status: 'error',
            mode,
            message: 'Cloudflare Zone:Cache Purge supports up to 30 URLs per API call.',
            rayId: null,
            timestamp: new Date().toISOString(),
          };
          setPurgeResult(limitErr);
          setPurging(false);
          return limitErr;
        }
        for (const candidate of cleanedUrls) {
          try {
            const parsed = new URL(candidate);
            if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
              throw new Error('Invalid protocol');
            }
          } catch {
            const urlErr: EdgeCachePurgeResult = {
              status: 'error',
              mode,
              message: `Invalid URL "${candidate}". Provide full https:// URLs.`,
              rayId: null,
              timestamp: new Date().toISOString(),
            };
            setPurgeResult(urlErr);
            setPurging(false);
            return urlErr;
          }
        }
      }

      try {
        const res = await fetch('/api/admin/cloudflare/purge-cache', {
          method: 'POST',
          headers: getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            mode,
            urls: cleanedUrls,
          }),
        });

        const payload = await res.json().catch(() => ({}));
        const ok = Boolean(res.ok && payload?.success);
        const result: EdgeCachePurgeResult = {
          status: ok ? 'success' : 'error',
          mode,
          message:
            payload?.message ||
            payload?.error ||
            (ok
              ? 'Cloudflare edge cache purge completed.'
              : `Cloudflare cache purge failed (HTTP ${res.status}).`),
          rayId: payload?.rayId || null,
          purgedCount: payload?.purgedCount,
          timestamp: new Date().toISOString(),
        };

        setPurgeResult(result);
        setConfirmFullPurge(false);

        if (ok) {
          void loadTelemetry(true);
        }

        return result;
      } catch (err: any) {
        const networkErr: EdgeCachePurgeResult = {
          status: 'error',
          mode,
          message:
            err?.message || 'Unable to reach the Cloudflare cache purge endpoint on the server.',
          rayId: null,
          timestamp: new Date().toISOString(),
        };
        setPurgeResult(networkErr);
        return networkErr;
      } finally {
        setPurging(false);
      }
    },
    [purgeUrlsInput, loadTelemetry]
  );

  const handlePurgeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (purgeMode === 'everything' && !confirmFullPurge) {
      setConfirmFullPurge(true);
      return;
    }
    void purgeEdgeCache(purgeMode);
  };

  const renderRuleStatus = (status: ActiveSecurityRule['status']) => {
    if (status === 'Active') {
      return <span className="font-semibold text-emerald-700">Active</span>;
    }
    if (status === 'Fallback') {
      return <span className="font-semibold text-amber-700">Fallback</span>;
    }
    return <span className="font-semibold text-slate-600">Edge Pending</span>;
  };

  return (
    <section
      aria-label="Cloudflare Zone, Security Rules, and R2 Storage Telemetry"
      className="space-y-6"
    >
      {/* Panel Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
            <span>Live Infrastructure Telemetry</span>
            <span aria-hidden="true">·</span>
            <span>Edge Zone, Security Rules &amp; R2 Storage</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              Updated {formatTimeOnly(data?.checkedAt)}
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
            Cloudflare Status Panel
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setPurgeMode('everything');
              setConfirmFullPurge(true);
              const formEl = document.getElementById('cf-edge-cache-purge-form');
              formEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            disabled={purging}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{purging ? 'Purging Edge Cache...' : 'Purge Edge Cache'}</span>
          </button>

          <button
            type="button"
            onClick={() => void loadTelemetry(true)}
            disabled={loading || refreshing}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 disabled:opacity-60 transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing Telemetry...' : 'Refresh Telemetry'}</span>
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-red-900">
                Telemetry request failed
              </p>
              <p className="text-xs text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadTelemetry(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-red-800 border border-red-300 hover:bg-red-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* 1. Edge Cache Zone Status */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-700" />
            <h4 className="text-sm font-bold text-slate-900">Edge Cache Zone Status</h4>
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>
              Source:{' '}
              {data?.edgeCacheZone.zoneApiConnected ? 'Cloudflare Zone API' : 'Express Origin'}
            </span>
            <span aria-hidden="true">·</span>
            <span
              className={`font-semibold ${
                data?.edgeCacheZone.zoneApiConnected || data?.edgeCacheZone.proxiedRequest
                  ? 'text-emerald-700'
                  : 'text-amber-700'
              }`}
            >
              {loading ? 'Checking...' : data?.edgeCacheZone.zoneStatus || 'Unknown'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
          <div className="p-4">
            <p className="text-xs text-slate-500">Zone / Origin Host</p>
            {loading ? (
              <div className="h-5 w-36 bg-slate-100 rounded mt-1.5" />
            ) : (
              <p className="text-sm font-bold text-slate-900 font-mono mt-1 truncate">
                {data?.edgeCacheZone.zoneName || '—'}
              </p>
            )}
            <p className="text-xs text-slate-500 font-mono tabular-nums mt-1">
              {data?.edgeCacheZone.zoneIdPreview
                ? `Zone ${data.edgeCacheZone.zoneIdPreview}`
                : data?.edgeCacheZone.planName || 'No Zone ID set'}
            </p>
          </div>

          <div className="p-4">
            <p className="text-xs text-slate-500">Cache Level &amp; Dev Mode</p>
            {loading ? (
              <div className="h-5 w-32 bg-slate-100 rounded mt-1.5" />
            ) : (
              <p className="text-sm font-bold text-slate-900 mt-1">
                {data?.edgeCacheZone.cacheLevel || '—'}
              </p>
            )}
            <p className="text-xs text-slate-500 font-mono tabular-nums mt-1">
              Dev Mode: {data?.edgeCacheZone.developmentMode ? 'On (Bypass)' : 'Off'} ·{' '}
              {data?.edgeCacheZone.activePolicyCount ?? 0} route tiers
            </p>
          </div>

          <div className="p-4">
            <p className="text-xs text-slate-500">SSL / Transport Posture</p>
            {loading ? (
              <div className="h-5 w-28 bg-slate-100 rounded mt-1.5" />
            ) : (
              <p className="text-sm font-bold text-slate-900 mt-1 capitalize">
                {data?.edgeCacheZone.sslMode || '—'}
              </p>
            )}
            <p className="text-xs text-slate-500 font-mono tabular-nums mt-1">
              Browser TTL:{' '}
              {data?.edgeCacheZone.browserCacheTtl !== null &&
              data?.edgeCacheZone.browserCacheTtl !== undefined
                ? `${data.edgeCacheZone.browserCacheTtl}s`
                : 'Origin governed'}
            </p>
          </div>

          <div className="p-4">
            <p className="text-xs text-slate-500">Edge Request Observation</p>
            {loading ? (
              <div className="h-5 w-28 bg-slate-100 rounded mt-1.5" />
            ) : (
              <p
                className={`text-sm font-bold mt-1 ${
                  data?.edgeCacheZone.proxiedRequest ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {data?.edgeCacheZone.proxiedRequest ? 'Proxied via Edge' : 'Direct Origin'}
              </p>
            )}
            <p className="text-xs text-slate-500 font-mono tabular-nums mt-1 truncate">
              {data?.edgeCacheZone.cfRay
                ? `${data.edgeCacheZone.cfRay} (${data.edgeCacheZone.cfCountry || 'N/A'})`
                : 'Awaiting Cloudflare proxy headers'}
            </p>
          </div>
        </div>

        {data?.edgeCacheZone.apiNotice && (
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
            {data.edgeCacheZone.apiNotice}
          </div>
        )}

        {/* Integrated Edge Cache Purge Control (Zone:Cache Purge) */}
        <form
          id="cf-edge-cache-purge-form"
          onSubmit={handlePurgeSubmit}
          className="px-5 py-4 border-t border-slate-200 bg-slate-50/60 space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-900">
                Edge Cache Purge (Cloudflare API · Zone:Cache Purge)
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Invalidate cached assets across Cloudflare edge PoPs using server-side credentials.
              </p>
            </div>

            <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setPurgeMode('everything');
                  setConfirmFullPurge(false);
                }}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  purgeMode === 'everything'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Purge Everything
              </button>
              <button
                type="button"
                onClick={() => {
                  setPurgeMode('urls');
                  setConfirmFullPurge(false);
                }}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  purgeMode === 'urls'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Purge Specific URLs
              </button>
            </div>
          </div>

          {purgeMode === 'urls' && (
            <div className="space-y-1">
              <label
                htmlFor="cf-status-panel-purge-urls"
                className="block text-xs font-medium text-slate-700"
              >
                URLs to purge (one per line or comma-separated, max 30)
              </label>
              <textarea
                id="cf-status-panel-purge-urls"
                rows={2}
                value={purgeUrlsInput}
                onChange={(e) => setPurgeUrlsInput(e.target.value)}
                placeholder="https://blog.accounticca.com/sitemap.xml"
                className="w-full p-2.5 text-xs font-mono bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2.5">
            {purgeMode === 'everything' && confirmFullPurge ? (
              <>
                <button
                  type="submit"
                  disabled={purging}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-60 transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{purging ? 'Purging Entire Zone...' : 'Confirm Full Zone Purge'}</span>
                </button>
                <button
                  type="button"
                  disabled={purging}
                  onClick={() => setConfirmFullPurge(false)}
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Cancel
                </button>
                <span className="text-xs text-amber-800">
                  This clears all cached objects in the Cloudflare zone immediately.
                </span>
              </>
            ) : (
              <button
                type="submit"
                disabled={purging}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {purging
                    ? 'Purging Edge Cache...'
                    : purgeMode === 'everything'
                      ? 'Purge Edge Cache'
                      : 'Purge Selected URLs'}
                </span>
              </button>
            )}
          </div>

          {/* Explicit Success / Failure State Display */}
          {purgeResult && (
            <div
              role="status"
              aria-live="polite"
              className={`p-3.5 rounded-lg border text-xs flex items-start justify-between gap-3 ${
                purgeResult.status === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                {purgeResult.status === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5 min-w-0">
                  <p className="font-semibold">
                    {purgeResult.status === 'success'
                      ? 'Edge Cache Purge Succeeded'
                      : 'Edge Cache Purge Failed'}
                  </p>
                  <p className="leading-relaxed">{purgeResult.message}</p>
                  <p className="font-mono tabular-nums text-[11px] opacity-80">
                    Mode: {purgeResult.mode === 'everything' ? 'Full Zone' : 'Targeted URLs'} ·{' '}
                    Time: {formatTimeOnly(purgeResult.timestamp)}
                    {purgeResult.rayId ? ` · CF-Ray: ${purgeResult.rayId}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {purgeResult.status === 'error' && (
                  <button
                    type="button"
                    disabled={purging}
                    onClick={() => void purgeEdgeCache(purgeResult.mode)}
                    className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white text-red-800 border border-red-300 hover:bg-red-100 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Retry
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPurgeResult(null)}
                  aria-label="Dismiss cache purge status"
                  className="p-1 rounded hover:bg-black/5 transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* 2. Active Security Rules */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-700" />
              <h4 className="text-sm font-bold text-slate-900">Active Security Rules</h4>
            </div>
            <p className="text-xs text-slate-500 font-mono tabular-nums">
              {activeRuleCount} active of {data?.securityRules.length ?? 0} configured edge &amp; origin controls
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {availableScopes.map((scope) => (
              <button
                key={scope}
                type="button"
                onClick={() => setRuleScopeFilter(scope)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  ruleScopeFilter === scope
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {scope}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold">
                <th className="px-4 py-2.5">Rule</th>
                <th className="px-4 py-2.5">Scope</th>
                <th className="px-4 py-2.5">Enforcement Target</th>
                <th className="px-4 py-2.5">Policy Action</th>
                <th className="px-4 py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="h-10">
                    <td className="px-4 py-2.5"><div className="h-3.5 w-44 bg-slate-100 rounded" /></td>
                    <td className="px-4 py-2.5"><div className="h-3.5 w-20 bg-slate-100 rounded" /></td>
                    <td className="px-4 py-2.5"><div className="h-3.5 w-52 bg-slate-100 rounded" /></td>
                    <td className="px-4 py-2.5"><div className="h-3.5 w-28 bg-slate-100 rounded" /></td>
                    <td className="px-4 py-2.5 text-right"><div className="h-3.5 w-14 bg-slate-100 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No security rules found for scope &ldquo;{ruleScopeFilter}&rdquo;.
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 font-semibold whitespace-nowrap">
                      <div>{rule.name}</div>
                      <div className="text-[11px] font-normal text-slate-500">{rule.source}</div>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">{rule.scope}</td>
                    <td className="px-4 py-2.5 text-slate-600">{rule.target}</td>
                    <td className="px-4 py-2.5 font-mono tabular-nums whitespace-nowrap">
                      {rule.action}
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      {renderRuleStatus(rule.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Recent R2 Storage Usage Statistics */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-slate-700" />
            <h4 className="text-sm font-bold text-slate-900">Recent R2 Storage Usage Statistics</h4>
          </div>
          <div className="text-xs text-slate-500 font-mono tabular-nums flex items-center gap-2">
            <span>Bucket: {data?.r2Usage.bucketName || 'elawyers-lms-assets'}</span>
            <span aria-hidden="true">·</span>
            <span
              className={`font-sans font-semibold ${
                data?.r2Usage.mode === 'cloudflare-r2' ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {data?.r2Usage.mode === 'cloudflare-r2' ? 'Cloudflare R2 Live' : 'Local Fallback'}
            </span>
          </div>
        </div>

        {/* R2 KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 border-b border-slate-200">
          <div className="p-4">
            <p className="text-xs text-slate-500">Stored Objects</p>
            {loading ? (
              <div className="h-6 w-20 bg-slate-100 rounded mt-1.5" />
            ) : (
              <p className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-1">
                {(data?.r2Usage.totalObjects ?? 0).toLocaleString()}
                {data?.r2Usage.truncated ? '+' : ''}
              </p>
            )}
            <p className="text-xs text-slate-500 mt-0.5">
              {data?.r2Usage.byCategory.length ?? 0} active asset categories
            </p>
          </div>

          <div className="p-4">
            <p className="text-xs text-slate-500">Total Storage Used</p>
            {loading ? (
              <div className="h-6 w-24 bg-slate-100 rounded mt-1.5" />
            ) : (
              <p className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-1">
                {formatBytes(data?.r2Usage.totalBytes ?? 0)}
              </p>
            )}
            <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
              Signed URL TTL: {data?.r2Usage.signedUrlTtlSeconds ?? 3600}s
            </p>
          </div>

          <div className="p-4">
            <p className="text-xs text-slate-500">Storage Breakdown</p>
            {loading ? (
              <div className="h-6 w-40 bg-slate-100 rounded mt-1.5" />
            ) : data?.r2Usage.byCategory && data.r2Usage.byCategory.length > 0 ? (
              <div className="mt-1.5 space-y-1 text-xs font-mono tabular-nums text-slate-700">
                {data.r2Usage.byCategory.slice(0, 3).map((cat) => (
                  <div key={cat.category} className="flex items-center justify-between gap-2">
                    <span className="font-sans text-slate-600">{cat.category}</span>
                    <span>
                      {cat.objectCount} · {formatBytes(cat.totalBytes)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-1.5">No objects recorded yet</p>
            )}
          </div>
        </div>

        {/* Recent Objects Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold">
                <th className="px-4 py-2.5">Recent Object Key</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5 text-right">Size</th>
                <th className="px-4 py-2.5 text-right">Last Modified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {loading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <tr key={idx} className="h-10">
                    <td className="px-4 py-2.5"><div className="h-3.5 w-52 bg-slate-100 rounded" /></td>
                    <td className="px-4 py-2.5"><div className="h-3.5 w-20 bg-slate-100 rounded" /></td>
                    <td className="px-4 py-2.5 text-right"><div className="h-3.5 w-16 bg-slate-100 rounded ml-auto" /></td>
                    <td className="px-4 py-2.5 text-right"><div className="h-3.5 w-28 bg-slate-100 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : !data?.r2Usage.recentObjects || data.r2Usage.recentObjects.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    No files have been uploaded to {data?.r2Usage.bucketName || 'the R2 bucket'} yet.
                    Uploaded LMS videos, PDFs, and course assets will appear here automatically.
                  </td>
                </tr>
              ) : (
                data.r2Usage.recentObjects.map((obj) => (
                  <tr key={obj.key} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-xs truncate max-w-md" title={obj.key}>
                      {obj.key}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">{obj.category}</td>
                    <td className="px-4 py-2.5 font-mono tabular-nums text-right whitespace-nowrap">
                      {formatBytes(obj.sizeBytes)}
                    </td>
                    <td className="px-4 py-2.5 font-mono tabular-nums text-right whitespace-nowrap text-slate-600">
                      {formatTimestamp(obj.lastModified)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data?.r2Usage.notice && (
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
            {data.r2Usage.notice}
          </div>
        )}
      </div>
    </section>
  );
}
