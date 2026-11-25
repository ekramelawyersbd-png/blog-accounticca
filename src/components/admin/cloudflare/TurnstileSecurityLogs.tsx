import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RefreshCw,
  Search,
  Download,
  AlertCircle,
  ShieldCheck,
  Trash2,
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

  useEffect(() => {
    void loadLogs(false);
  }, [loadLogs]);

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

  return (
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
  );
}
