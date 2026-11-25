import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RefreshCw,
  Search,
  Download,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { getAdminAuthHeaders } from '../../../contexts/ShopAuthContext';
import { useTableSort } from '../../../hooks/useTableSort';
import { SortableTh } from '../../ui/SortableTh';

export interface TurnstileVerificationEvent {
  id: string;
  timestamp: string;
  status: 'success' | 'failure';
  method: 'siteverify' | 'proof';
  action: string;
  route: string;
  sourceIp: string;
  ipSource: 'cf-connecting-ip' | 'x-forwarded-for' | 'socket';
  cfCountry: string | null;
  cfRay: string | null;
  hostname: string | null;
  usingTestKey: boolean;
  errorCodes: string[];
  reason: string | null;
  latencyMs: number;
}

export interface TurnstileSecuritySummary {
  total: number;
  successCount: number;
  failureCount: number;
  successRatePct: number;
  uniqueIps: number;
  avgLatencyMs: number;
}

interface TurnstileLogsResponse {
  success: boolean;
  fetchedAt: string;
  limit: number;
  summary: TurnstileSecuritySummary;
  events: TurnstileVerificationEvent[];
  error?: string;
}

export interface WafRuleEvent {
  id: string;
  timestamp: string;
  ruleId: string;
  ruleName: string;
  action: string;
  category: 'blocked' | 'challenged';
  source: string;
  clientIp: string;
  country: string | null;
  requestPath: string;
  cfRay: string | null;
  count: number;
}

export interface WafRuleSummaryRow {
  ruleId: string;
  ruleName: string;
  source: string;
  blockedCount: number;
  challengedCount: number;
  totalCount: number;
  uniqueIps: number;
  topCountry: string | null;
  lastTriggeredAt: string;
}

interface WafEventsResponse {
  success: boolean;
  source: 'cloudflare-waf-api' | 'origin-security-guard';
  fetchedAt: string;
  totals: {
    totalCount: number;
    blockedCount: number;
    challengedCount: number;
    distinctRuleCount: number;
    uniqueIps: number;
  };
  availableRuleIds: string[];
  ruleSummaries: WafRuleSummaryRow[];
  events: WafRuleEvent[];
  apiNotice: string | null;
  error?: string;
}

type WafTimestampPreset = 'all' | '1h' | '24h' | '7d' | 'custom';

function toLocalDateTimeInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString([], {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatTimeOnly(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatIpSourceLabel(ipSource: TurnstileVerificationEvent['ipSource']): string {
  if (ipSource === 'cf-connecting-ip') return 'CF-Connecting-IP';
  if (ipSource === 'x-forwarded-for') return 'X-Forwarded-For';
  return 'Direct Socket';
}

function escapeCsvCell(value: string | number | null | undefined): string {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function TurnstileSecurityLogs() {
  const [events, setEvents] = useState<TurnstileVerificationEvent[]>([]);
  const [summary, setSummary] = useState<TurnstileSecuritySummary>({
    total: 0,
    successCount: 0,
    failureCount: 0,
    successRatePct: 0,
    uniqueIps: 0,
    avgLatencyMs: 0,
  });
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failure'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [confirmClear, setConfirmClear] = useState<boolean>(false);
  const [clearing, setClearing] = useState<boolean>(false);

  // Cloudflare WAF Blocked & Challenged Requests Summary state
  const [wafData, setWafData] = useState<WafEventsResponse | null>(null);
  const [wafLoading, setWafLoading] = useState<boolean>(true);
  const [wafRefreshing, setWafRefreshing] = useState<boolean>(false);
  const [wafError, setWafError] = useState<string | null>(null);
  const [wafViewMode, setWafViewMode] = useState<'summary' | 'events'>('summary');
  const [wafActionFilter, setWafActionFilter] = useState<'all' | 'blocked' | 'challenged'>('all');
  const [wafRuleIdFilter, setWafRuleIdFilter] = useState<string>('');
  const [wafTimePreset, setWafTimePreset] = useState<WafTimestampPreset>('all');
  const [wafFromTimestamp, setWafFromTimestamp] = useState<string>('');
  const [wafToTimestamp, setWafToTimestamp] = useState<string>('');

  const loadLogs = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetch('/api/admin/cloudflare/turnstile-logs?limit=50', {
        headers: getAdminAuthHeaders(),
      });
      const json: TurnstileLogsResponse = await res.json().catch(() => ({
        success: false,
        fetchedAt: '',
        limit: 50,
        summary: {
          total: 0,
          successCount: 0,
          failureCount: 0,
          successRatePct: 0,
          uniqueIps: 0,
          avgLatencyMs: 0,
        },
        events: [],
        error: `Unexpected server response (HTTP ${res.status})`,
      }));

      if (!res.ok || !json.success) {
        throw new Error(json.error || `Failed to load Turnstile security logs (HTTP ${res.status})`);
      }

      setEvents(Array.isArray(json.events) ? json.events : []);
      if (json.summary) {
        setSummary(json.summary);
      }
      setFetchedAt(json.fetchedAt || new Date().toISOString());
    } catch (err: any) {
      setError(err?.message || 'Unable to retrieve Cloudflare Turnstile verification logs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadWafEvents = useCallback(
    async (
      options?: {
        isRefresh?: boolean;
        sinceIso?: string;
        untilIso?: string;
      }
    ) => {
      if (options?.isRefresh) {
        setWafRefreshing(true);
      } else {
        setWafLoading(true);
      }
      setWafError(null);

      try {
        const params = new URLSearchParams({ limit: '150' });
        if (options?.sinceIso) params.set('since', options.sinceIso);
        if (options?.untilIso) params.set('until', options.untilIso);

        const res = await fetch(`/api/admin/cloudflare/waf-events?${params.toString()}`, {
          headers: getAdminAuthHeaders(),
        });
        const json: WafEventsResponse = await res.json().catch(() => ({
          success: false,
          source: 'origin-security-guard',
          fetchedAt: '',
          totals: {
            totalCount: 0,
            blockedCount: 0,
            challengedCount: 0,
            distinctRuleCount: 0,
            uniqueIps: 0,
          },
          availableRuleIds: [],
          ruleSummaries: [],
          events: [],
          apiNotice: null,
          error: `Unexpected server response (HTTP ${res.status})`,
        }));

        if (!res.ok || !json.success) {
          throw new Error(
            json.error || `Failed to load Cloudflare WAF events (HTTP ${res.status})`
          );
        }

        setWafData(json);
      } catch (err: any) {
        setWafError(
          err?.message || 'Unable to retrieve Cloudflare WAF blocked and challenged requests.'
        );
      } finally {
        setWafLoading(false);
        setWafRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadLogs(false);
  }, [loadLogs]);

  useEffect(() => {
    const sinceIso =
      wafFromTimestamp && !Number.isNaN(new Date(wafFromTimestamp).getTime())
        ? new Date(wafFromTimestamp).toISOString()
        : undefined;
    const untilIso =
      wafToTimestamp && !Number.isNaN(new Date(wafToTimestamp).getTime())
        ? new Date(wafToTimestamp).toISOString()
        : undefined;
    void loadWafEvents({ isRefresh: wafData !== null, sinceIso, untilIso });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wafFromTimestamp, wafToTimestamp, loadWafEvents]);

  const applyWafTimePreset = (preset: WafTimestampPreset) => {
    setWafTimePreset(preset);
    if (preset === 'all') {
      setWafFromTimestamp('');
      setWafToTimestamp('');
      return;
    }
    if (preset === 'custom') return;

    const now = new Date();
    const offsetMs =
      preset === '1h'
        ? 60 * 60 * 1000
        : preset === '24h'
          ? 24 * 60 * 60 * 1000
          : 7 * 24 * 60 * 60 * 1000;
    setWafFromTimestamp(toLocalDateTimeInputValue(new Date(now.getTime() - offsetMs)));
    setWafToTimestamp(toLocalDateTimeInputValue(now));
  };

  const handleResetWafFilters = () => {
    setWafRuleIdFilter('');
    setWafActionFilter('all');
    setWafTimePreset('all');
    setWafFromTimestamp('');
    setWafToTimestamp('');
  };

  const handleClearLogs = async () => {
    setClearing(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/cloudflare/turnstile-logs', {
        method: 'DELETE',
        headers: getAdminAuthHeaders(),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || `Failed to clear logs (HTTP ${res.status})`);
      }
      setConfirmClear(false);
      await loadLogs(true);
    } catch (err: any) {
      setError(err?.message || 'Unable to clear Turnstile verification logs.');
    } finally {
      setClearing(false);
    }
  };

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return events.filter((evt) => {
      if (statusFilter !== 'all' && evt.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        evt.sourceIp.toLowerCase().includes(q) ||
        evt.action.toLowerCase().includes(q) ||
        evt.route.toLowerCase().includes(q) ||
        (evt.cfCountry || '').toLowerCase().includes(q) ||
        (evt.cfRay || '').toLowerCase().includes(q) ||
        evt.errorCodes.some((code) => code.toLowerCase().includes(q)) ||
        (evt.reason || '').toLowerCase().includes(q)
      );
    });
  }, [events, statusFilter, searchQuery]);

  const { sortedItems: sortedEvents, getSortDirection, requestSort } = useTableSort<
    TurnstileVerificationEvent,
    'timestamp' | 'status' | 'action' | 'sourceIp' | 'latencyMs'
  >(filteredEvents, {
    initialSort: { key: 'timestamp', direction: 'desc' },
    accessors: {
      timestamp: (e) => new Date(e.timestamp).getTime(),
      status: (e) => e.status,
      action: (e) => e.action,
      sourceIp: (e) => e.sourceIp,
      latencyMs: (e) => e.latencyMs,
    },
  });

  const handleExportCsv = () => {
    if (sortedEvents.length === 0) return;
    const headers = [
      'Timestamp',
      'Status',
      'Method',
      'Action',
      'Route',
      'Source IP',
      'IP Source Header',
      'Country',
      'CF-Ray',
      'Key Mode',
      'Latency (ms)',
      'Error Codes',
      'Reason',
    ];
    const rows = sortedEvents.map((evt) => [
      evt.timestamp,
      evt.status,
      evt.method,
      evt.action,
      evt.route,
      evt.sourceIp,
      evt.ipSource,
      evt.cfCountry || '',
      evt.cfRay || '',
      evt.usingTestKey ? 'test-key' : 'live-key',
      evt.latencyMs,
      evt.errorCodes.join('; '),
      evt.reason || '',
    ]);
    const csv = [
      headers.map(escapeCsvCell).join(','),
      ...rows.map((row) => row.map(escapeCsvCell).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `turnstile-security-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Client-side instant filtering & aggregation of WAF events by Rule ID, Action, and Timestamp
  const filteredWafEvents = useMemo(() => {
    const raw = wafData?.events || [];
    const ruleQuery = wafRuleIdFilter.trim().toLowerCase();
    const fromMs = wafFromTimestamp ? new Date(wafFromTimestamp).getTime() : NaN;
    const toMs = wafToTimestamp ? new Date(wafToTimestamp).getTime() : NaN;

    return raw.filter((evt) => {
      if (wafActionFilter !== 'all' && evt.category !== wafActionFilter) {
        return false;
      }
      if (ruleQuery && !evt.ruleId.toLowerCase().includes(ruleQuery)) {
        return false;
      }
      const tsMs = new Date(evt.timestamp).getTime();
      if (Number.isFinite(fromMs) && Number.isFinite(tsMs) && tsMs < fromMs) {
        return false;
      }
      if (Number.isFinite(toMs) && Number.isFinite(tsMs) && tsMs > toMs) {
        return false;
      }
      return true;
    });
  }, [wafData?.events, wafActionFilter, wafRuleIdFilter, wafFromTimestamp, wafToTimestamp]);

  const filteredWafSummary = useMemo(() => {
    const map = new Map<
      string,
      {
        ruleId: string;
        ruleName: string;
        source: string;
        blockedCount: number;
        challengedCount: number;
        totalCount: number;
        ips: Set<string>;
        countries: Map<string, number>;
        lastTriggeredAt: string;
        lastTriggeredMs: number;
      }
    >();

    let totalCount = 0;
    let blockedCount = 0;
    let challengedCount = 0;
    const allIps = new Set<string>();

    for (const evt of filteredWafEvents) {
      const cnt = Math.max(1, evt.count || 1);
      totalCount += cnt;
      if (evt.category === 'blocked') blockedCount += cnt;
      else challengedCount += cnt;

      if (evt.clientIp && evt.clientIp !== 'unknown') {
        allIps.add(evt.clientIp);
      }

      const key = evt.ruleId || 'unknown-rule';
      let row = map.get(key);
      const tsMs = new Date(evt.timestamp).getTime();
      if (!row) {
        row = {
          ruleId: key,
          ruleName: evt.ruleName || key,
          source: evt.source || 'Cloudflare WAF',
          blockedCount: 0,
          challengedCount: 0,
          totalCount: 0,
          ips: new Set<string>(),
          countries: new Map<string, number>(),
          lastTriggeredAt: evt.timestamp,
          lastTriggeredMs: Number.isFinite(tsMs) ? tsMs : 0,
        };
        map.set(key, row);
      }

      row.totalCount += cnt;
      if (evt.category === 'blocked') row.blockedCount += cnt;
      else row.challengedCount += cnt;
      if (evt.clientIp && evt.clientIp !== 'unknown') {
        row.ips.add(evt.clientIp);
      }
      if (evt.country) {
        row.countries.set(evt.country, (row.countries.get(evt.country) || 0) + cnt);
      }
      if (Number.isFinite(tsMs) && tsMs > row.lastTriggeredMs) {
        row.lastTriggeredMs = tsMs;
        row.lastTriggeredAt = evt.timestamp;
      }
    }

    const rows: WafRuleSummaryRow[] = Array.from(map.values()).map((row) => {
      let topCountry: string | null = null;
      let maxCountryHits = 0;
      for (const [country, hits] of row.countries.entries()) {
        if (hits > maxCountryHits) {
          topCountry = country;
          maxCountryHits = hits;
        }
      }
      return {
        ruleId: row.ruleId,
        ruleName: row.ruleName,
        source: row.source,
        blockedCount: row.blockedCount,
        challengedCount: row.challengedCount,
        totalCount: row.totalCount,
        uniqueIps: row.ips.size,
        topCountry,
        lastTriggeredAt: row.lastTriggeredAt,
      };
    });

    return {
      rows,
      totals: {
        totalCount,
        blockedCount,
        challengedCount,
        distinctRuleCount: rows.length,
        uniqueIps: allIps.size,
      },
    };
  }, [filteredWafEvents]);

  const {
    sortedItems: sortedWafRuleSummaries,
    getSortDirection: getWafSummarySortDirection,
    requestSort: requestWafSummarySort,
  } = useTableSort<
    WafRuleSummaryRow,
    'ruleId' | 'blockedCount' | 'challengedCount' | 'totalCount' | 'uniqueIps' | 'lastTriggeredAt'
  >(filteredWafSummary.rows, {
    initialSort: { key: 'totalCount', direction: 'desc' },
    accessors: {
      ruleId: (r) => r.ruleId,
      blockedCount: (r) => r.blockedCount,
      challengedCount: (r) => r.challengedCount,
      totalCount: (r) => r.totalCount,
      uniqueIps: (r) => r.uniqueIps,
      lastTriggeredAt: (r) => new Date(r.lastTriggeredAt).getTime(),
    },
  });

  const {
    sortedItems: sortedWafEvents,
    getSortDirection: getWafEventSortDirection,
    requestSort: requestWafEventSort,
  } = useTableSort<WafRuleEvent, 'timestamp' | 'ruleId' | 'action' | 'clientIp'>(
    filteredWafEvents,
    {
      initialSort: { key: 'timestamp', direction: 'desc' },
      accessors: {
        timestamp: (e) => new Date(e.timestamp).getTime(),
        ruleId: (e) => e.ruleId,
        action: (e) => e.action,
        clientIp: (e) => e.clientIp,
      },
    }
  );

  const hasActiveWafFilters = Boolean(
    wafRuleIdFilter.trim() || wafActionFilter !== 'all' || wafFromTimestamp || wafToTimestamp
  );

  const handleExportWafCsv = () => {
    if (wafViewMode === 'summary') {
      if (sortedWafRuleSummaries.length === 0) return;
      const headers = [
        'Rule ID',
        'Rule Name',
        'Source',
        'Blocked Requests',
        'Challenged Requests',
        'Total Hits',
        'Unique IPs',
        'Top Country',
        'Last Triggered',
      ];
      const rows = sortedWafRuleSummaries.map((row) => [
        row.ruleId,
        row.ruleName,
        row.source,
        row.blockedCount,
        row.challengedCount,
        row.totalCount,
        row.uniqueIps,
        row.topCountry || '',
        row.lastTriggeredAt,
      ]);
      const csv = [
        headers.map(escapeCsvCell).join(','),
        ...rows.map((r) => r.map(escapeCsvCell).join(',')),
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cloudflare-waf-rule-summary-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (sortedWafEvents.length === 0) return;
    const headers = [
      'Timestamp',
      'Rule ID',
      'Rule Name',
      'Category',
      'Action',
      'Source',
      'Client IP',
      'Country',
      'Request Path',
      'CF-Ray',
    ];
    const rows = sortedWafEvents.map((evt) => [
      evt.timestamp,
      evt.ruleId,
      evt.ruleName,
      evt.category,
      evt.action,
      evt.source,
      evt.clientIp,
      evt.country || '',
      evt.requestPath,
      evt.cfRay || '',
    ]);
    const csv = [
      headers.map(escapeCsvCell).join(','),
      ...rows.map((r) => r.map(escapeCsvCell).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cloudflare-waf-events-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
    <section
      aria-label="Cloudflare Turnstile Security Verification Logs"
      className="bg-white border border-slate-200 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-700" />
            <h3 className="text-base font-bold text-slate-900">
              Turnstile Verification Security Logs
            </h3>
          </div>
          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
            <span>Last 50 Human Verification Events</span>
            <span aria-hidden="true">·</span>
            <span>Status, Source IP &amp; Edge Metadata</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              Synced {formatTimeOnly(fetchedAt)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={sortedEvents.length === 0}
            className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 disabled:opacity-40 transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {confirmClear ? (
            <div className="inline-flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => void handleClearLogs()}
                disabled={clearing}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
              >
                {clearing ? 'Clearing...' : 'Confirm Clear'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                disabled={clearing}
                className="px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              disabled={events.length === 0}
              className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 disabled:opacity-40 transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => void loadLogs(true)}
            disabled={loading || refreshing}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 disabled:opacity-60 transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Logs'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 border-b border-slate-200">
        <div className="p-4">
          <p className="text-xs text-slate-500">Recorded Events (Max 50)</p>
          {loading ? (
            <div className="h-6 w-16 bg-slate-100 rounded mt-1" />
          ) : (
            <p className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-1">
              {summary.total}
            </p>
          )}
          <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
            {summary.successCount} passed · {summary.failureCount} failed
          </p>
        </div>

        <div className="p-4">
          <p className="text-xs text-slate-500">Verification Pass Rate</p>
          {loading ? (
            <div className="h-6 w-20 bg-slate-100 rounded mt-1" />
          ) : (
            <p
              className={`text-lg font-bold font-mono tabular-nums mt-1 ${
                summary.total === 0
                  ? 'text-slate-800'
                  : summary.successRatePct >= 80
                    ? 'text-emerald-700'
                    : summary.successRatePct >= 50
                      ? 'text-amber-700'
                      : 'text-red-700'
              }`}
            >
              {summary.total > 0 ? `${summary.successRatePct.toFixed(1)}%` : '—'}
            </p>
          )}
          <p className="text-xs text-slate-500 mt-0.5">Human challenge completion</p>
        </div>

        <div className="p-4">
          <p className="text-xs text-slate-500">Unique Source IPs</p>
          {loading ? (
            <div className="h-6 w-16 bg-slate-100 rounded mt-1" />
          ) : (
            <p className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-1">
              {summary.uniqueIps}
            </p>
          )}
          <p className="text-xs text-slate-500 mt-0.5">Attributed via CF-Connecting-IP</p>
        </div>

        <div className="p-4">
          <p className="text-xs text-slate-500">Average Verification Latency</p>
          {loading ? (
            <div className="h-6 w-20 bg-slate-100 rounded mt-1" />
          ) : (
            <p className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-1">
              {summary.total > 0 ? `${summary.avgLatencyMs} ms` : '—'}
            </p>
          )}
          <p className="text-xs text-slate-500 mt-0.5">Siteverify &amp; proof check duration</p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="px-5 py-3.5 bg-red-50 border-b border-red-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => void loadLogs(true)}
            className="px-3 py-1 rounded-md text-xs font-semibold bg-white text-red-800 border border-red-300 hover:bg-red-100 cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start sm:self-auto">
          {(
            [
              { id: 'all', label: `All (${summary.total})` },
              { id: 'success', label: `Success (${summary.successCount})` },
              { id: 'failure', label: `Failure (${summary.failureCount})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by IP, action, route, CF-Ray, error..."
            aria-label="Filter Turnstile security logs"
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Events Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold">
              <SortableTh
                label="Timestamp"
                sortKey="timestamp"
                direction={getSortDirection('timestamp')}
                onSort={requestSort}
                className="px-4 py-2.5"
              />
              <SortableTh
                label="Status"
                sortKey="status"
                direction={getSortDirection('status')}
                onSort={requestSort}
                className="px-4 py-2.5"
              />
              <SortableTh
                label="Action & Route"
                sortKey="action"
                direction={getSortDirection('action')}
                onSort={requestSort}
                className="px-4 py-2.5"
              />
              <SortableTh
                label="Source IP & Metadata"
                sortKey="sourceIp"
                direction={getSortDirection('sourceIp')}
                onSort={requestSort}
                className="px-4 py-2.5"
              />
              <SortableTh
                label="Latency"
                sortKey="latencyMs"
                direction={getSortDirection('latencyMs')}
                onSort={requestSort}
                align="right"
                className="px-4 py-2.5"
              />
              <th className="px-4 py-2.5 text-xs font-semibold">Verification Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="h-11">
                  <td className="px-4 py-2.5"><div className="h-3.5 w-28 bg-slate-100 rounded" /></td>
                  <td className="px-4 py-2.5"><div className="h-3.5 w-14 bg-slate-100 rounded" /></td>
                  <td className="px-4 py-2.5"><div className="h-3.5 w-40 bg-slate-100 rounded" /></td>
                  <td className="px-4 py-2.5"><div className="h-3.5 w-36 bg-slate-100 rounded" /></td>
                  <td className="px-4 py-2.5 text-right"><div className="h-3.5 w-12 bg-slate-100 rounded ml-auto" /></td>
                  <td className="px-4 py-2.5"><div className="h-3.5 w-44 bg-slate-100 rounded" /></td>
                </tr>
              ))
            ) : sortedEvents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center">
                  <p className="text-sm font-semibold text-slate-800">
                    {events.length === 0
                      ? 'No Turnstile verification events recorded yet'
                      : 'No verification events match your current filter'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    {events.length === 0
                      ? 'Every Cloudflare Turnstile challenge submitted through Contact, Newsletter, Career, or Password Reset forms is logged here automatically with status and source IP metadata.'
                      : 'Try clearing the search query or switching back to All events.'}
                  </p>
                </td>
              </tr>
            ) : (
              sortedEvents.map((evt) => (
                <tr key={evt.id} className="hover:bg-slate-50 transition-colors align-top">
                  <td className="px-4 py-2.5 font-mono tabular-nums whitespace-nowrap text-slate-700">
                    {formatDateTime(evt.timestamp)}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {evt.status === 'success' ? (
                      <span className="font-semibold text-emerald-700">Success</span>
                    ) : (
                      <span className="font-semibold text-red-700">Failure</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-semibold text-slate-900">{evt.action}</div>
                    <div className="text-[11px] text-slate-500 font-mono truncate max-w-[220px]" title={evt.route}>
                      {evt.route} · {evt.method} · {evt.usingTestKey ? 'Test Key' : 'Live'}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-mono tabular-nums font-semibold text-slate-900">
                      {evt.sourceIp}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                      {formatIpSourceLabel(evt.ipSource)}
                      {evt.cfCountry ? ` · ${evt.cfCountry}` : ''}
                      {evt.cfRay ? ` · Ray ${evt.cfRay}` : ''}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 font-mono tabular-nums text-right whitespace-nowrap text-slate-700">
                    {evt.latencyMs} ms
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 max-w-xs">
                    {evt.status === 'success' ? (
                      <span className="text-slate-600">
                        Verified{evt.hostname ? ` (${evt.hostname})` : ''}
                      </span>
                    ) : (
                      <div className="space-y-0.5">
                        {evt.errorCodes.length > 0 && (
                          <div className="font-mono text-[11px] text-red-700">
                            {evt.errorCodes.join(', ')}
                          </div>
                        )}
                        {evt.reason && (
                          <div className="text-[11px] text-slate-600 leading-snug">
                            {evt.reason}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>

    {/* Cloudflare WAF Blocked & Challenged Requests Summary */}
    <section
      aria-label="Cloudflare WAF Blocked and Challenged Requests Summary"
      className="bg-white border border-slate-200 rounded-xl overflow-hidden"
    >
      {/* WAF Section Header */}
      <div className="px-5 py-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-700" />
            <h3 className="text-base font-bold text-slate-900">
              Cloudflare WAF Blocked &amp; Challenged Requests
            </h3>
          </div>
          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
            <span>
              Source:{' '}
              {wafData?.source === 'cloudflare-waf-api'
                ? 'Cloudflare WAF API'
                : 'Origin Security Guard'}
            </span>
            <span aria-hidden="true">·</span>
            <span>Filterable by Rule ID &amp; Timestamp</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              Synced {formatTimeOnly(wafData?.fetchedAt)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportWafCsv}
            disabled={
              wafViewMode === 'summary'
                ? sortedWafRuleSummaries.length === 0
                : sortedWafEvents.length === 0
            }
            className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 disabled:opacity-40 transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const sinceIso =
                wafFromTimestamp && !Number.isNaN(new Date(wafFromTimestamp).getTime())
                  ? new Date(wafFromTimestamp).toISOString()
                  : undefined;
              const untilIso =
                wafToTimestamp && !Number.isNaN(new Date(wafToTimestamp).getTime())
                  ? new Date(wafToTimestamp).toISOString()
                  : undefined;
              void loadWafEvents({ isRefresh: true, sinceIso, untilIso });
            }}
            disabled={wafLoading || wafRefreshing}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 disabled:opacity-60 transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${wafRefreshing ? 'animate-spin' : ''}`} />
            <span>{wafRefreshing ? 'Refreshing...' : 'Refresh WAF'}</span>
          </button>
        </div>
      </div>

      {/* WAF Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 border-b border-slate-200">
        <div className="p-4">
          <p className="text-xs text-slate-500">Total Triggered Requests</p>
          {wafLoading ? (
            <div className="h-6 w-16 bg-slate-100 rounded mt-1" />
          ) : (
            <p className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-1">
              {filteredWafSummary.totals.totalCount.toLocaleString()}
            </p>
          )}
          <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
            {hasActiveWafFilters ? 'Matching active filters' : 'All recorded WAF events'}
          </p>
        </div>

        <div className="p-4">
          <p className="text-xs text-slate-500">Blocked Requests</p>
          {wafLoading ? (
            <div className="h-6 w-16 bg-slate-100 rounded mt-1" />
          ) : (
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                {filteredWafSummary.totals.blockedCount.toLocaleString()}
              </p>
              <span
                className={`text-xs font-semibold ${
                  filteredWafSummary.totals.blockedCount > 0
                    ? 'text-red-700'
                    : 'text-slate-500'
                }`}
              >
                Blocked
              </span>
            </div>
          )}
          <p className="text-xs text-slate-500 mt-0.5">Hard blocks &amp; rate-limit drops</p>
        </div>

        <div className="p-4">
          <p className="text-xs text-slate-500">Challenged Requests</p>
          {wafLoading ? (
            <div className="h-6 w-16 bg-slate-100 rounded mt-1" />
          ) : (
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                {filteredWafSummary.totals.challengedCount.toLocaleString()}
              </p>
              <span
                className={`text-xs font-semibold ${
                  filteredWafSummary.totals.challengedCount > 0
                    ? 'text-amber-700'
                    : 'text-slate-500'
                }`}
              >
                Challenged
              </span>
            </div>
          )}
          <p className="text-xs text-slate-500 mt-0.5">Managed, JS &amp; Turnstile challenges</p>
        </div>

        <div className="p-4">
          <p className="text-xs text-slate-500">Triggered Rule IDs</p>
          {wafLoading ? (
            <div className="h-6 w-16 bg-slate-100 rounded mt-1" />
          ) : (
            <p className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-1">
              {filteredWafSummary.totals.distinctRuleCount.toLocaleString()}
            </p>
          )}
          <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
            {filteredWafSummary.totals.uniqueIps.toLocaleString()} unique client IPs
          </p>
        </div>
      </div>

      {/* WAF Error State */}
      {wafError && (
        <div className="px-5 py-3.5 bg-red-50 border-b border-red-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
            <span>{wafError}</span>
          </div>
          <button
            type="button"
            onClick={() => void loadWafEvents({ isRefresh: true })}
            className="px-3 py-1 rounded-md text-xs font-semibold bg-white text-red-800 border border-red-300 hover:bg-red-100 cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            Retry
          </button>
        </div>
      )}

      {/* Rule ID & Timestamp Filter Controls */}
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
        {/* Row 1: View Switcher + Action Filter + Timestamp Presets */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="WAF table view mode"
              className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg"
            >
              <button
                type="button"
                onClick={() => setWafViewMode('summary')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  wafViewMode === 'summary'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Rule Summary ({sortedWafRuleSummaries.length})
              </button>
              <button
                type="button"
                onClick={() => setWafViewMode('events')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  wafViewMode === 'events'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Request Log ({sortedWafEvents.length})
              </button>
            </div>

            <div
              role="group"
              aria-label="WAF action filter"
              className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg"
            >
              {(
                [
                  { id: 'all', label: 'All Actions' },
                  { id: 'blocked', label: 'Blocked' },
                  { id: 'challenged', label: 'Challenged' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setWafActionFilter(opt.id)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    wafActionFilter === opt.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div
            role="group"
            aria-label="Timestamp quick filter"
            className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start lg:self-auto"
          >
            {(
              [
                { id: 'all', label: 'All Time' },
                { id: '1h', label: 'Last 1h' },
                { id: '24h', label: 'Last 24h' },
                { id: '7d', label: 'Last 7d' },
              ] as const
            ).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyWafTimePreset(preset.id)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  wafTimePreset === preset.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Rule ID Filter (Text + Select) & Explicit Timestamp Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-2.5 items-end">
          <div className="lg:col-span-4 space-y-1">
            <label
              htmlFor="waf-rule-id-input"
              className="block text-[11px] font-semibold text-slate-600"
            >
              Filter by Rule ID
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                id="waf-rule-id-input"
                type="text"
                value={wafRuleIdFilter}
                onChange={(e) => setWafRuleIdFilter(e.target.value)}
                placeholder="Enter rule ID (e.g. cf-origin-rate-limit-429)"
                className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="lg:col-span-3 space-y-1">
            <label
              htmlFor="waf-rule-id-select"
              className="block text-[11px] font-semibold text-slate-600"
            >
              Detected Rule IDs
            </label>
            <select
              id="waf-rule-id-select"
              value={
                (wafData?.availableRuleIds || []).includes(wafRuleIdFilter)
                  ? wafRuleIdFilter
                  : ''
              }
              onChange={(e) => setWafRuleIdFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">All Rule IDs ({wafData?.availableRuleIds.length ?? 0})</option>
              {(wafData?.availableRuleIds || []).map((rid) => (
                <option key={rid} value={rid}>
                  {rid}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2 space-y-1">
            <label
              htmlFor="waf-timestamp-from"
              className="block text-[11px] font-semibold text-slate-600"
            >
              From Timestamp
            </label>
            <input
              id="waf-timestamp-from"
              type="datetime-local"
              value={wafFromTimestamp}
              onChange={(e) => {
                setWafTimePreset('custom');
                setWafFromTimestamp(e.target.value);
              }}
              className="w-full px-2 py-1.5 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="lg:col-span-2 space-y-1">
            <label
              htmlFor="waf-timestamp-to"
              className="block text-[11px] font-semibold text-slate-600"
            >
              To Timestamp
            </label>
            <input
              id="waf-timestamp-to"
              type="datetime-local"
              value={wafToTimestamp}
              onChange={(e) => {
                setWafTimePreset('custom');
                setWafToTimestamp(e.target.value);
              }}
              className="w-full px-2 py-1.5 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="lg:col-span-1 flex justify-end">
            <button
              type="button"
              onClick={handleResetWafFilters}
              disabled={!hasActiveWafFilters}
              title="Reset Rule ID and Timestamp filters"
              className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 disabled:opacity-40 transition-colors inline-flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* WAF Summary Table or Detailed Request Log Table */}
      <div className="overflow-x-auto">
        {wafViewMode === 'summary' ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold">
                <SortableTh
                  label="Rule ID"
                  sortKey="ruleId"
                  direction={getWafSummarySortDirection('ruleId')}
                  onSort={requestWafSummarySort}
                  className="px-4 py-2.5"
                />
                <th className="px-4 py-2.5 text-xs font-semibold">Rule / Trigger Source</th>
                <SortableTh
                  label="Blocked"
                  sortKey="blockedCount"
                  direction={getWafSummarySortDirection('blockedCount')}
                  onSort={requestWafSummarySort}
                  align="right"
                  className="px-4 py-2.5"
                />
                <SortableTh
                  label="Challenged"
                  sortKey="challengedCount"
                  direction={getWafSummarySortDirection('challengedCount')}
                  onSort={requestWafSummarySort}
                  align="right"
                  className="px-4 py-2.5"
                />
                <SortableTh
                  label="Total Hits"
                  sortKey="totalCount"
                  direction={getWafSummarySortDirection('totalCount')}
                  onSort={requestWafSummarySort}
                  align="right"
                  className="px-4 py-2.5"
                />
                <SortableTh
                  label="Unique IPs"
                  sortKey="uniqueIps"
                  direction={getWafSummarySortDirection('uniqueIps')}
                  onSort={requestWafSummarySort}
                  align="right"
                  className="px-4 py-2.5"
                />
                <SortableTh
                  label="Last Triggered"
                  sortKey="lastTriggeredAt"
                  direction={getWafSummarySortDirection('lastTriggeredAt')}
                  onSort={requestWafSummarySort}
                  align="right"
                  className="px-4 py-2.5"
                />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {wafLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="h-11">
                    <td className="px-4 py-2.5"><div className="h-3.5 w-36 bg-slate-100 rounded" /></td>
                    <td className="px-4 py-2.5"><div className="h-3.5 w-48 bg-slate-100 rounded" /></td>
                    <td className="px-4 py-2.5 text-right"><div className="h-3.5 w-10 bg-slate-100 rounded ml-auto" /></td>
                    <td className="px-4 py-2.5 text-right"><div className="h-3.5 w-10 bg-slate-100 rounded ml-auto" /></td>
                    <td className="px-4 py-2.5 text-right"><div className="h-3.5 w-12 bg-slate-100 rounded ml-auto" /></td>
                    <td className="px-4 py-2.5 text-right"><div className="h-3.5 w-10 bg-slate-100 rounded ml-auto" /></td>
                    <td className="px-4 py-2.5 text-right"><div className="h-3.5 w-28 bg-slate-100 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : sortedWafRuleSummaries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center">
                    <p className="text-sm font-semibold text-slate-800">
                      {hasActiveWafFilters
                        ? 'No WAF rules match the current Rule ID or Timestamp filter'
                        : 'No blocked or challenged WAF requests recorded yet'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      {hasActiveWafFilters
                        ? 'Adjust the Rule ID query or widen the From / To timestamp window to inspect additional rule triggers.'
                        : 'Requests blocked or challenged by Cloudflare WAF rules, rate limiters, or failed Turnstile verifications are summarized here by Rule ID.'}
                    </p>
                    {hasActiveWafFilters && (
                      <button
                        type="button"
                        onClick={handleResetWafFilters}
                        className="mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                sortedWafRuleSummaries.map((row) => (
                  <tr key={row.ruleId} className="hover:bg-slate-50 transition-colors align-top">
                    <td className="px-4 py-2.5 font-mono whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setWafRuleIdFilter(row.ruleId)}
                        title="Filter table by this Rule ID"
                        className="font-semibold text-blue-700 hover:underline cursor-pointer text-left"
                      >
                        {row.ruleId}
                      </button>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-semibold text-slate-900">{row.ruleName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {row.source}
                        {row.topCountry ? ` · Top country: ${row.topCountry}` : ''}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-mono tabular-nums text-right whitespace-nowrap">
                      {row.blockedCount > 0 ? (
                        <span className="font-semibold text-red-700">
                          {row.blockedCount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-mono tabular-nums text-right whitespace-nowrap">
                      {row.challengedCount > 0 ? (
                        <span className="font-semibold text-amber-700">
                          {row.challengedCount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-mono tabular-nums font-bold text-right whitespace-nowrap">
                      {row.totalCount.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 font-mono tabular-nums text-right whitespace-nowrap text-slate-700">
                      {row.uniqueIps.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 font-mono tabular-nums text-right whitespace-nowrap text-slate-700">
                      {formatDateTime(row.lastTriggeredAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold">
                <SortableTh
                  label="Timestamp"
                  sortKey="timestamp"
                  direction={getWafEventSortDirection('timestamp')}
                  onSort={requestWafEventSort}
                  className="px-4 py-2.5"
                />
                <SortableTh
                  label="Rule ID"
                  sortKey="ruleId"
                  direction={getWafEventSortDirection('ruleId')}
                  onSort={requestWafEventSort}
                  className="px-4 py-2.5"
                />
                <SortableTh
                  label="Action"
                  sortKey="action"
                  direction={getWafEventSortDirection('action')}
                  onSort={requestWafEventSort}
                  className="px-4 py-2.5"
                />
                <SortableTh
                  label="Client IP & Country"
                  sortKey="clientIp"
                  direction={getWafEventSortDirection('clientIp')}
                  onSort={requestWafEventSort}
                  className="px-4 py-2.5"
                />
                <th className="px-4 py-2.5 text-xs font-semibold">Request Path &amp; Ray</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {wafLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="h-11">
                    <td className="px-4 py-2.5"><div className="h-3.5 w-28 bg-slate-100 rounded" /></td>
                    <td className="px-4 py-2.5"><div className="h-3.5 w-36 bg-slate-100 rounded" /></td>
                    <td className="px-4 py-2.5"><div className="h-3.5 w-20 bg-slate-100 rounded" /></td>
                    <td className="px-4 py-2.5"><div className="h-3.5 w-32 bg-slate-100 rounded" /></td>
                    <td className="px-4 py-2.5"><div className="h-3.5 w-44 bg-slate-100 rounded" /></td>
                  </tr>
                ))
              ) : sortedWafEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center">
                    <p className="text-sm font-semibold text-slate-800">
                      No matching blocked or challenged requests found
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Clear or broaden the Rule ID and Timestamp filters to view other WAF triggers.
                    </p>
                  </td>
                </tr>
              ) : (
                sortedWafEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50 transition-colors align-top">
                    <td className="px-4 py-2.5 font-mono tabular-nums whitespace-nowrap text-slate-700">
                      {formatDateTime(evt.timestamp)}
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => setWafRuleIdFilter(evt.ruleId)}
                        className="font-mono font-semibold text-blue-700 hover:underline cursor-pointer text-left"
                      >
                        {evt.ruleId}
                      </button>
                      <div className="text-[11px] text-slate-500">{evt.ruleName}</div>
                    </td>
                    <td className="px-4 py-2.5 font-mono whitespace-nowrap">
                      {evt.category === 'blocked' ? (
                        <span className="font-semibold text-red-700">
                          {evt.action.toUpperCase()}
                        </span>
                      ) : (
                        <span className="font-semibold text-amber-700">
                          {evt.action.toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-mono tabular-nums whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{evt.clientIp}</div>
                      <div className="text-[11px] text-slate-500">
                        {evt.country || 'N/A'} · {evt.source}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-mono max-w-xs">
                      <div className="truncate text-slate-800" title={evt.requestPath}>
                        {evt.requestPath}
                      </div>
                      {evt.cfRay && (
                        <div className="text-[11px] text-slate-500">Ray {evt.cfRay}</div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {wafData?.apiNotice && (
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
          {wafData.apiNotice}
        </div>
      )}
    </section>
    </div>
  );
}
