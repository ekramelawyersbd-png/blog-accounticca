import fs from 'fs';
import os from 'os';
import path from 'path';
import type express from 'express';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { resolveClientIp } from './securityMiddleware';

export interface CloudflareEdgeContext {
  proxied: boolean;
  cfRay: string | null;
  cfCountry: string | null;
  cfConnectingIp: string | null;
  clientIp: string;
  visitorScheme: string | null;
  protocol: string;
  host: string;
}

export interface CloudflareCachePolicyRule {
  routePattern: string;
  cacheControl: string;
  cdnCacheControl: string;
  purpose: string;
}

export interface CloudflareHeaderProbeRow {
  path: string;
  category: string;
  cacheControl: string;
  cdnCacheControl: string;
  securityHeaders: string[];
}

export const CLOUDFLARE_CACHE_POLICIES: CloudflareCachePolicyRule[] = [
  {
    routePattern: '/assets/*',
    cacheControl: 'public, max-age=31536000, immutable',
    cdnCacheControl: 'max-age=31536000, immutable',
    purpose: 'Fingerprinted JS, CSS, and font bundles cached permanently at edge and browser',
  },
  {
    routePattern: '/sitemap.xml, /robots.txt, /llms.txt',
    cacheControl: 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
    cdnCacheControl: 'max-age=3600, stale-while-revalidate=86400',
    purpose: 'Crawl and SEO discovery endpoints served fast from edge with background refresh',
  },
  {
    routePattern: 'Public HTML Routes (/, /article/*, /tools/*)',
    cacheControl: 'public, max-age=0, must-revalidate',
    cdnCacheControl: 'max-age=300, stale-while-revalidate=3600',
    purpose: 'Edge-cached public pages with browser revalidation (auto-bypassed when authenticated)',
  },
  {
    routePattern: '/api/* and /admin/*',
    cacheControl: 'private, no-store, no-cache, must-revalidate',
    cdnCacheControl: 'no-store',
    purpose: 'Dynamic API responses, Turnstile verifications, payments, and Admin consoles never cached',
  },
];

export const BASELINE_SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

function parseCfVisitorScheme(rawHeader: string | string[] | undefined): string | null {
  if (typeof rawHeader !== 'string' || !rawHeader.trim()) return null;
  try {
    const parsed = JSON.parse(rawHeader);
    if (parsed && typeof parsed.scheme === 'string' && parsed.scheme.trim()) {
      return parsed.scheme.trim().toLowerCase();
    }
  } catch {
    // Ignore malformed CF-Visitor header
  }
  return null;
}

export function extractCloudflareEdgeContext(req: express.Request): CloudflareEdgeContext {
  const cfRay =
    typeof req.headers['cf-ray'] === 'string' && req.headers['cf-ray'].trim()
      ? req.headers['cf-ray'].trim()
      : null;
  const cfCountry =
    typeof req.headers['cf-ipcountry'] === 'string' && req.headers['cf-ipcountry'].trim()
      ? req.headers['cf-ipcountry'].trim().toUpperCase()
      : null;
  const cfConnectingIp =
    typeof req.headers['cf-connecting-ip'] === 'string' && req.headers['cf-connecting-ip'].trim()
      ? req.headers['cf-connecting-ip'].trim()
      : null;
  const visitorScheme = parseCfVisitorScheme(req.headers['cf-visitor']);
  const forwardedProto =
    typeof req.headers['x-forwarded-proto'] === 'string'
      ? req.headers['x-forwarded-proto'].split(',')[0]?.trim().toLowerCase()
      : undefined;
  const protocol = visitorScheme || forwardedProto || req.protocol || 'https';
  const host = req.get('host') || 'localhost:3000';

  return {
    proxied: Boolean(cfRay || cfConnectingIp),
    cfRay,
    cfCountry,
    cfConnectingIp,
    clientIp: resolveClientIp(req),
    visitorScheme,
    protocol,
    host,
  };
}

export function resolveCloudflareHeadersForPath(
  reqPath: string,
  options?: { isAuthenticatedRequest?: boolean; method?: string }
): {
  category: string;
  cacheControl: string;
  cdnCacheControl: string;
  vary?: string;
} {
  const normalizedPath = (reqPath || '/').split('?')[0];
  const method = (options?.method || 'GET').toUpperCase();
  const isAuthenticated = Boolean(options?.isAuthenticatedRequest);

  if (
    method !== 'GET' &&
    method !== 'HEAD'
  ) {
    return {
      category: 'Mutation / Non-GET Request',
      cacheControl: 'private, no-store, no-cache, must-revalidate',
      cdnCacheControl: 'no-store',
    };
  }

  if (normalizedPath.startsWith('/api/') || normalizedPath === '/api') {
    return {
      category: 'API Endpoint',
      cacheControl: 'private, no-store, no-cache, must-revalidate',
      cdnCacheControl: 'no-store',
    };
  }

  if (normalizedPath.startsWith('/admin') || isAuthenticated) {
    return {
      category: 'Authenticated / Admin Route',
      cacheControl: 'private, no-store, no-cache, must-revalidate',
      cdnCacheControl: 'no-store',
    };
  }

  if (normalizedPath.startsWith('/assets/')) {
    return {
      category: 'Hashed Static Asset',
      cacheControl: 'public, max-age=31536000, immutable',
      cdnCacheControl: 'max-age=31536000, immutable',
      vary: 'Accept-Encoding',
    };
  }

  if (
    normalizedPath === '/sitemap.xml' ||
    normalizedPath === '/robots.txt' ||
    normalizedPath === '/llms.txt'
  ) {
    return {
      category: 'SEO / Crawler Endpoint',
      cacheControl: 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
      cdnCacheControl: 'max-age=3600, stale-while-revalidate=86400',
      vary: 'Accept-Encoding',
    };
  }

  return {
    category: 'Public HTML Route',
    cacheControl: 'public, max-age=0, must-revalidate',
    cdnCacheControl: 'max-age=300, stale-while-revalidate=3600',
    vary: 'Accept-Encoding',
  };
}

/**
 * Express middleware that normalizes Cloudflare proxy metadata and emits
 * tiered browser + Cloudflare edge cache headers alongside baseline security headers.
 */
export function cloudflareEdgeMiddleware(): express.RequestHandler {
  return (req, res, next) => {
    const edgeCtx = extractCloudflareEdgeContext(req);
    (req as any).cloudflareEdge = edgeCtx;

    // Apply baseline security headers (iframe-safe for AI Studio preview compatibility)
    for (const [headerName, headerValue] of Object.entries(BASELINE_SECURITY_HEADERS)) {
      res.setHeader(headerName, headerValue);
    }

    // Apply HSTS only when actively served over HTTPS via Cloudflare proxy
    if (edgeCtx.proxied && edgeCtx.protocol === 'https') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    const hasAuthSignal = Boolean(
      req.headers.authorization ||
        req.headers['x-admin-token'] ||
        (typeof req.headers.cookie === 'string' && /admin|session|token/i.test(req.headers.cookie))
    );

    const policy = resolveCloudflareHeadersForPath(req.path, {
      isAuthenticatedRequest: hasAuthSignal,
      method: req.method,
    });

    res.setHeader('Cache-Control', policy.cacheControl);
    res.setHeader('Cloudflare-CDN-Cache-Control', policy.cdnCacheControl);
    if (policy.cdnCacheControl === 'no-store') {
      res.setHeader('CDN-Cache-Control', 'no-store');
    }
    if (policy.vary) {
      res.vary(policy.vary);
    }

    next();
  };
}

export function buildCloudflareHeaderProbeMatrix(): CloudflareHeaderProbeRow[] {
  const samplePaths = [
    '/',
    '/article/what-is-rjsc-bangladesh-complete-guide',
    '/assets/index-hashed.js',
    '/sitemap.xml',
    '/api/health',
    '/admin/cloudflare',
  ];

  const securityHeaderList = Object.entries(BASELINE_SECURITY_HEADERS).map(
    ([k, v]) => `${k}: ${v}`
  );

  return samplePaths.map((samplePath) => {
    const resolved = resolveCloudflareHeadersForPath(samplePath, { method: 'GET' });
    return {
      path: samplePath,
      category: resolved.category,
      cacheControl: resolved.cacheControl,
      cdnCacheControl: resolved.cdnCacheControl,
      securityHeaders: securityHeaderList,
    };
  });
}

export function readWranglerProjectInfo(rootDir: string): {
  configured: boolean;
  appName: string;
  compatibilityDate: string;
  pagesOutputDir: string;
} {
  const wranglerPath = path.join(rootDir, 'wrangler.jsonc');
  try {
    if (fs.existsSync(wranglerPath)) {
      const raw = fs.readFileSync(wranglerPath, 'utf-8');
      // Strip // comments safely for JSONC
      const cleaned = raw.replace(/^\s*\/\/.*$/gm, '');
      const parsed = JSON.parse(cleaned);
      return {
        configured: true,
        appName: String(parsed.name || 'accounticca-elawyers-compliance-suite'),
        compatibilityDate: String(parsed.compatibility_date || '2026-11-24'),
        pagesOutputDir: String(parsed.pages_build_output_dir || './dist'),
      };
    }
  } catch {
    // Fallback below
  }
  return {
    configured: false,
    appName: 'accounticca-elawyers-compliance-suite',
    compatibilityDate: '2026-11-24',
    pagesOutputDir: './dist',
  };
}

export async function purgeCloudflareZoneCache(params: {
  mode: 'everything' | 'urls';
  urls?: string[];
}): Promise<{
  success: boolean;
  statusCode: number;
  message: string;
  rayId?: string | null;
  purgedCount?: number;
}> {
  const zoneId = (process.env.CLOUDFLARE_ZONE_ID || '').trim();
  const apiToken = (process.env.CLOUDFLARE_API_TOKEN || '').trim();

  if (!zoneId || !apiToken) {
    return {
      success: false,
      statusCode: 503,
      message:
        'Cloudflare Zone Cache Purge is not configured yet. Set CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN (with Zone:Cache Purge permission) in your server environment variables.',
    };
  }

  let payload: Record<string, unknown>;
  let purgedCount: number | undefined;

  if (params.mode === 'everything') {
    payload = { purge_everything: true };
  } else {
    const cleanUrls = (params.urls || [])
      .map((u) => String(u || '').trim())
      .filter(Boolean);

    if (cleanUrls.length === 0) {
      return {
        success: false,
        statusCode: 400,
        message: 'Provide at least one full https:// URL to purge.',
      };
    }

    if (cleanUrls.length > 30) {
      return {
        success: false,
        statusCode: 400,
        message: 'Cloudflare allows purging up to 30 URLs per API request.',
      };
    }

    for (const url of cleanUrls) {
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
          return {
            success: false,
            statusCode: 400,
            message: `Invalid URL protocol for purge: "${url}". Use https:// URLs.`,
          };
        }
      } catch {
        return {
          success: false,
          statusCode: 400,
          message: `Invalid URL format: "${url}". Provide full https:// URLs.`,
        };
      }
    }

    payload = { files: cleanUrls };
    purgedCount = cleanUrls.length;
  }

  try {
    const cfResponse = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${encodeURIComponent(zoneId)}/purge_cache`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10_000),
        body: JSON.stringify(payload),
      }
    );

    const rayId = cfResponse.headers.get('cf-ray');
    const data: any = await cfResponse.json().catch(() => ({}));

    if (cfResponse.ok && data?.success) {
      return {
        success: true,
        statusCode: 200,
        rayId,
        purgedCount,
        message:
          params.mode === 'everything'
            ? 'Cloudflare edge cache purge accepted for the entire zone.'
            : `Cloudflare edge cache purge accepted for ${purgedCount} URL${purgedCount === 1 ? '' : 's'}.`,
      };
    }

    const cfErrorMsg =
      Array.isArray(data?.errors) && data.errors.length > 0
        ? data.errors.map((e: any) => e.message || e.code).join('; ')
        : `Cloudflare API returned HTTP ${cfResponse.status}`;

    const permissionHint =
      cfResponse.status === 401 || cfResponse.status === 403
        ? ' Verify that CLOUDFLARE_API_TOKEN includes the Zone:Cache Purge permission for CLOUDFLARE_ZONE_ID.'
        : '';

    return {
      success: false,
      statusCode: cfResponse.status >= 400 ? cfResponse.status : 502,
      rayId,
      message: `Cloudflare cache purge failed: ${cfErrorMsg}.${permissionHint}`,
    };
  } catch (err: any) {
    return {
      success: false,
      statusCode: 502,
      message: `Unable to reach Cloudflare API: ${err?.message || 'network error'}`,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Live Edge Cache Zone Status, Active Security Rules & R2 Storage Usage Telemetry
// ─────────────────────────────────────────────────────────────────────────────

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

export interface CloudflareStatusTelemetry {
  checkedAt: string;
  edgeCacheZone: EdgeCacheZoneStatus;
  securityRules: ActiveSecurityRule[];
  r2Usage: R2StorageUsageStats;
}

function classifyStorageCategory(key: string): R2RecentObject['category'] {
  const lower = key.toLowerCase();
  if (/\.(mp4|mov|webm|mkv|m3u8)$/.test(lower)) return 'Video';
  if (/\.(pdf|doc|docx|txt|md|rtf)$/.test(lower)) return 'Document';
  if (/\.(ppt|pptx|key)$/.test(lower)) return 'Presentation';
  if (/\.(json|csv|xlsx|xls)$/.test(lower)) return 'Data';
  return 'Other';
}

async function fetchJsonWithTimeout(
  url: string,
  headers: Record<string, string>,
  timeoutMs = 5000
): Promise<{ ok: boolean; status: number; data: any }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchEdgeZoneAndWafFromApi(
  edge: CloudflareEdgeContext
): Promise<{ zone: EdgeCacheZoneStatus; edgeWafRules: ActiveSecurityRule[] }> {
  const zoneId = (process.env.CLOUDFLARE_ZONE_ID || '').trim();
  const apiToken = (process.env.CLOUDFLARE_API_TOKEN || '').trim();

  const fallbackZone: EdgeCacheZoneStatus = {
    source: 'origin-middleware',
    zoneApiConnected: false,
    zoneIdPreview: zoneId ? `${zoneId.slice(0, 6)}...${zoneId.slice(-4)}` : null,
    zoneName: edge.host.replace(/:\d+$/, ''),
    zoneStatus: edge.proxied ? 'Proxied (Origin Observed)' : 'Origin Active (Zone API Pending)',
    planName: null,
    developmentMode: false,
    cacheLevel: 'Origin Cache-Control (4 Tiers)',
    browserCacheTtl: 0,
    sslMode: edge.protocol === 'https' ? 'HTTPS Enforced' : 'Origin HTTP (Dev)',
    proxiedRequest: edge.proxied,
    cfRay: edge.cfRay,
    cfCountry: edge.cfCountry,
    activePolicyCount: CLOUDFLARE_CACHE_POLICIES.length,
    apiNotice:
      !zoneId || !apiToken
        ? 'Set CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN on the server to pull live Cloudflare Zone settings and WAF rulesets.'
        : null,
  };

  if (!zoneId || !apiToken) {
    return { zone: fallbackZone, edgeWafRules: [] };
  }

  const cfHeaders = {
    Authorization: `Bearer ${apiToken}`,
    'Content-Type': 'application/json',
  };
  const baseUrl = `https://api.cloudflare.com/client/v4/zones/${encodeURIComponent(zoneId)}`;

  try {
    const [zoneRes, devModeRes, cacheLvlRes, browserTtlRes, sslRes, wafRes] = await Promise.all([
      fetchJsonWithTimeout(baseUrl, cfHeaders),
      fetchJsonWithTimeout(`${baseUrl}/settings/development_mode`, cfHeaders).catch(() => null),
      fetchJsonWithTimeout(`${baseUrl}/settings/cache_level`, cfHeaders).catch(() => null),
      fetchJsonWithTimeout(`${baseUrl}/settings/browser_cache_ttl`, cfHeaders).catch(() => null),
      fetchJsonWithTimeout(`${baseUrl}/settings/ssl`, cfHeaders).catch(() => null),
      fetchJsonWithTimeout(
        `${baseUrl}/rulesets/phases/http_request_firewall_custom/entrypoint`,
        cfHeaders
      ).catch(() => null),
    ]);

    if (!zoneRes.ok || !zoneRes.data?.success || !zoneRes.data?.result) {
      const cfErr =
        Array.isArray(zoneRes.data?.errors) && zoneRes.data.errors.length > 0
          ? zoneRes.data.errors.map((e: any) => e.message || e.code).join('; ')
          : `Cloudflare Zone API returned HTTP ${zoneRes.status}`;
      return {
        zone: {
          ...fallbackZone,
          apiNotice: `Live Zone API query unavailable (${cfErr}). Showing Express origin telemetry.`,
        },
        edgeWafRules: [],
      };
    }

    const z = zoneRes.data.result;
    const edgeWafRules: ActiveSecurityRule[] = [];
    const rawRules = wafRes?.ok && wafRes?.data?.success ? wafRes.data?.result?.rules : null;
    if (Array.isArray(rawRules)) {
      for (const rule of rawRules.slice(0, 12)) {
        edgeWafRules.push({
          id: `cf-waf-${String(rule.id || edgeWafRules.length)}`,
          name: String(rule.description || rule.ref || 'Cloudflare WAF Custom Rule'),
          scope: 'Edge WAF',
          target: String(rule.expression || 'Zone Traffic').slice(0, 90),
          action: String(rule.action || 'managed_challenge').toUpperCase(),
          status: rule.enabled === false ? 'Edge Pending' : 'Active',
          source: 'Cloudflare API',
        });
      }
    }

    return {
      zone: {
        source: 'cloudflare-api',
        zoneApiConnected: true,
        zoneIdPreview: `${zoneId.slice(0, 6)}...${zoneId.slice(-4)}`,
        zoneName: String(z.name || fallbackZone.zoneName),
        zoneStatus: z.paused ? 'Paused' : String(z.status || 'active'),
        planName: z.plan?.name ? String(z.plan.name) : null,
        developmentMode: devModeRes?.data?.result?.value === 'on',
        cacheLevel: String(cacheLvlRes?.data?.result?.value || 'standard'),
        browserCacheTtl:
          typeof browserTtlRes?.data?.result?.value === 'number'
            ? browserTtlRes.data.result.value
            : null,
        sslMode: String(sslRes?.data?.result?.value || fallbackZone.sslMode),
        proxiedRequest: edge.proxied,
        cfRay: edge.cfRay,
        cfCountry: edge.cfCountry,
        activePolicyCount: CLOUDFLARE_CACHE_POLICIES.length,
        apiNotice: null,
      },
      edgeWafRules,
    };
  } catch (err: any) {
    return {
      zone: {
        ...fallbackZone,
        apiNotice: `Cloudflare Zone API unreachable (${err?.message || 'timeout'}). Showing Express origin telemetry.`,
      },
      edgeWafRules: [],
    };
  }
}

function collectLocalFallbackStorageStats(
  bucketName: string,
  signedUrlTtlSeconds: number,
  rootDir: string
): R2StorageUsageStats {
  const dirsToScan = [
    path.join(os.tmpdir(), 'accounticca-runtime-data'),
    path.join(rootDir, 'public', 'uploads'),
  ];

  const foundObjects: R2RecentObject[] = [];

  for (const dir of dirsToScan) {
    try {
      if (!fs.existsSync(dir)) continue;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        const fullPath = path.join(dir, entry.name);
        const stat = fs.statSync(fullPath);
        const prefix = dir.includes('uploads') ? 'uploads/' : 'runtime/';
        const key = `${prefix}${entry.name}`;
        foundObjects.push({
          key,
          sizeBytes: stat.size,
          lastModified: stat.mtime.toISOString(),
          category: classifyStorageCategory(entry.name),
        });
      }
    } catch {
      // Ignore inaccessible local directories
    }
  }

  foundObjects.sort(
    (a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
  );

  const categoryTotals = new Map<string, { objectCount: number; totalBytes: number }>();
  let totalBytes = 0;

  for (const obj of foundObjects) {
    totalBytes += obj.sizeBytes;
    const prev = categoryTotals.get(obj.category) || { objectCount: 0, totalBytes: 0 };
    prev.objectCount += 1;
    prev.totalBytes += obj.sizeBytes;
    categoryTotals.set(obj.category, prev);
  }

  return {
    mode: 'local-fallback',
    bucketName,
    signedUrlTtlSeconds,
    endpointHost: null,
    totalObjects: foundObjects.length,
    totalBytes,
    truncated: false,
    byCategory: Array.from(categoryTotals.entries())
      .map(([category, stats]) => ({
        category,
        objectCount: stats.objectCount,
        totalBytes: stats.totalBytes,
      }))
      .sort((a, b) => b.totalBytes - a.totalBytes),
    recentObjects: foundObjects.slice(0, 10),
    notice:
      'Running in local storage fallback mode. Configure R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY to read live Cloudflare R2 bucket metrics.',
  };
}

async function fetchR2StorageUsageStats(rootDir: string): Promise<R2StorageUsageStats> {
  const accountId = (process.env.R2_ACCOUNT_ID || '').trim();
  const accessKeyId = (process.env.R2_ACCESS_KEY_ID || '').trim();
  const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || '').trim();
  const bucketName = (process.env.R2_BUCKET_NAME || 'elawyers-lms-assets').trim();
  const signedUrlTtlSeconds = Number(process.env.R2_SIGNED_URL_TTL_SECONDS || 3600) || 3600;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return collectLocalFallbackStorageStats(bucketName, signedUrlTtlSeconds, rootDir);
  }

  const endpointHost = `${accountId}.r2.cloudflarestorage.com`;
  try {
    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${endpointHost}`,
      credentials: { accessKeyId, secretAccessKey },
    });

    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 500,
      })
    );

    const contents = response.Contents || [];
    const objects: R2RecentObject[] = contents
      .filter((item) => Boolean(item.Key))
      .map((item) => {
        const key = String(item.Key);
        return {
          key,
          sizeBytes: Number(item.Size || 0),
          lastModified: item.LastModified
            ? item.LastModified.toISOString()
            : new Date(0).toISOString(),
          category: classifyStorageCategory(key),
        };
      })
      .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

    const categoryTotals = new Map<string, { objectCount: number; totalBytes: number }>();
    let totalBytes = 0;

    for (const obj of objects) {
      totalBytes += obj.sizeBytes;
      const prev = categoryTotals.get(obj.category) || { objectCount: 0, totalBytes: 0 };
      prev.objectCount += 1;
      prev.totalBytes += obj.sizeBytes;
      categoryTotals.set(obj.category, prev);
    }

    return {
      mode: 'cloudflare-r2',
      bucketName,
      signedUrlTtlSeconds,
      endpointHost,
      totalObjects: objects.length,
      totalBytes,
      truncated: Boolean(response.IsTruncated),
      byCategory: Array.from(categoryTotals.entries())
        .map(([category, stats]) => ({
          category,
          objectCount: stats.objectCount,
          totalBytes: stats.totalBytes,
        }))
        .sort((a, b) => b.totalBytes - a.totalBytes),
      recentObjects: objects.slice(0, 10),
      notice: response.IsTruncated
        ? 'Showing statistics from the first 500 objects in the Cloudflare R2 bucket.'
        : null,
    };
  } catch (err: any) {
    const fallback = collectLocalFallbackStorageStats(bucketName, signedUrlTtlSeconds, rootDir);
    return {
      ...fallback,
      endpointHost,
      notice: `Cloudflare R2 S3 query failed (${err?.message || 'connection error'}). Showing local fallback inventory.`,
    };
  }
}

export async function fetchCloudflareStatusTelemetry(params: {
  req: express.Request;
  rootDir: string;
  turnstileConfigured: boolean;
  turnstileUsingTestKey: boolean;
  allowedTurnstileHostnames: string[];
}): Promise<CloudflareStatusTelemetry> {
  const edge = extractCloudflareEdgeContext(params.req);
  const [{ zone, edgeWafRules }, r2Usage] = await Promise.all([
    fetchEdgeZoneAndWafFromApi(edge),
    fetchR2StorageUsageStats(params.rootDir),
  ]);

  const originSecurityRules: ActiveSecurityRule[] = [
    {
      id: 'sec-turnstile',
      name: 'Cloudflare Turnstile Human Verification',
      scope: 'Bot Protection',
      target: `Public auth, contact, newsletter & career forms (${params.allowedTurnstileHostnames.length} hostnames)`,
      action:
        params.turnstileConfigured && !params.turnstileUsingTestKey
          ? 'VERIFY (LIVE)'
          : 'VERIFY (TEST KEY)',
      status:
        params.turnstileConfigured && !params.turnstileUsingTestKey ? 'Active' : 'Fallback',
      source: 'Express Origin',
    },
    {
      id: 'sec-rate-public',
      name: 'Public Submission Sliding-Window Limiter',
      scope: 'Rate Limit',
      target: 'Public form & Turnstile verification routes (keyed by CF-Connecting-IP)',
      action: '15 REQ / 60S (120S BLOCK)',
      status: 'Active',
      source: 'Express Origin',
    },
    {
      id: 'sec-rate-auth',
      name: 'Strict Auth & Admin Action Rate Limiter',
      scope: 'Rate Limit',
      target: '/api/admin/login, /api/auth/reset-password, /api/admin/cloudflare/purge-cache',
      action: '10 REQ / 300S (300S BLOCK)',
      status: 'Active',
      source: 'Express Origin',
    },
    {
      id: 'sec-headers',
      name: 'Baseline Edge Security Headers',
      scope: 'Security Headers',
      target: 'All HTTP responses (nosniff, Referrer-Policy, Permissions-Policy)',
      action: 'ENFORCE HEADERS',
      status: 'Active',
      source: 'Express Origin',
    },
    {
      id: 'sec-hsts',
      name: 'Strict Transport Security (HSTS)',
      scope: 'Security Headers',
      target: 'Cloudflare proxied HTTPS traffic (max-age=31536000; includeSubDomains)',
      action: edge.proxied && edge.protocol === 'https' ? 'ENFORCED' : 'ARMED FOR HTTPS PROXY',
      status: edge.proxied && edge.protocol === 'https' ? 'Active' : 'Edge Pending',
      source: 'Express Origin',
    },
    {
      id: 'sec-admin-nostore',
      name: 'Admin & API Cache Isolation',
      scope: 'Access Control',
      target: '/api/* and /admin/* (private, no-store + Cloudflare-CDN-Cache-Control: no-store)',
      action: 'BYPASS EDGE CACHE',
      status: 'Active',
      source: 'Express Origin',
    },
  ];

  return {
    checkedAt: new Date().toISOString(),
    edgeCacheZone: zone,
    securityRules: [...edgeWafRules, ...originSecurityRules],
    r2Usage,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Cloudflare Turnstile Security Verification Event Logs (Last 50 Events)
// ─────────────────────────────────────────────────────────────────────────────

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

const TURNSTILE_LOGS_FILE = path.join(
  os.tmpdir(),
  'accounticca-runtime-data',
  'turnstile-security-logs.json'
);
const MAX_STORED_TURNSTILE_EVENTS = 200;

let turnstileEventsCache: TurnstileVerificationEvent[] | null = null;

function ensureTurnstileEventsLoaded(): TurnstileVerificationEvent[] {
  if (turnstileEventsCache !== null) {
    return turnstileEventsCache;
  }
  try {
    if (fs.existsSync(TURNSTILE_LOGS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(TURNSTILE_LOGS_FILE, 'utf-8'));
      if (Array.isArray(parsed)) {
        turnstileEventsCache = parsed.slice(0, MAX_STORED_TURNSTILE_EVENTS);
        return turnstileEventsCache;
      }
    }
  } catch {
    // Fall back to empty log buffer
  }
  turnstileEventsCache = [];
  return turnstileEventsCache;
}

function persistTurnstileEvents(events: TurnstileVerificationEvent[]): void {
  try {
    const dir = path.dirname(TURNSTILE_LOGS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(TURNSTILE_LOGS_FILE, JSON.stringify(events, null, 2), 'utf-8');
  } catch {
    // Non-fatal in read-only or ephemeral runtimes; in-memory ring buffer remains active
  }
}

export function recordTurnstileVerificationEvent(params: {
  req: express.Request;
  status: 'success' | 'failure';
  method: 'siteverify' | 'proof';
  action?: string;
  hostname?: string | null;
  usingTestKey: boolean;
  errorCodes?: string[];
  reason?: string | null;
  latencyMs?: number;
}): TurnstileVerificationEvent {
  const edge = extractCloudflareEdgeContext(params.req);
  const ipSource: TurnstileVerificationEvent['ipSource'] = edge.cfConnectingIp
    ? 'cf-connecting-ip'
    : typeof params.req.headers['x-forwarded-for'] === 'string' &&
        params.req.headers['x-forwarded-for'].trim()
      ? 'x-forwarded-for'
      : 'socket';

  const event: TurnstileVerificationEvent = {
    id: `tsl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    status: params.status,
    method: params.method,
    action: (params.action || 'general').slice(0, 64),
    route: String(params.req.originalUrl || params.req.path || '/api/security/turnstile/verify')
      .split('?')[0]
      .slice(0, 120),
    sourceIp: edge.clientIp,
    ipSource,
    cfCountry: edge.cfCountry,
    cfRay: edge.cfRay,
    hostname: params.hostname || edge.host.replace(/:\d+$/, '') || null,
    usingTestKey: Boolean(params.usingTestKey),
    errorCodes: Array.isArray(params.errorCodes) ? params.errorCodes.slice(0, 8) : [],
    reason: params.reason ? String(params.reason).slice(0, 220) : null,
    latencyMs: Math.max(0, Math.round(Number(params.latencyMs || 0))),
  };

  const current = ensureTurnstileEventsLoaded();
  const next = [event, ...current].slice(0, MAX_STORED_TURNSTILE_EVENTS);
  turnstileEventsCache = next;
  persistTurnstileEvents(next);
  return event;
}

export function getRecentTurnstileEvents(limit = 50): {
  events: TurnstileVerificationEvent[];
  summary: TurnstileSecuritySummary;
} {
  const boundedLimit = Math.max(1, Math.min(50, Math.floor(Number(limit) || 50)));
  const events = ensureTurnstileEventsLoaded().slice(0, boundedLimit);

  const total = events.length;
  let successCount = 0;
  let failureCount = 0;
  let totalLatency = 0;
  const ips = new Set<string>();

  for (const evt of events) {
    if (evt.status === 'success') successCount += 1;
    else failureCount += 1;
    totalLatency += evt.latencyMs || 0;
    if (evt.sourceIp && evt.sourceIp !== 'unknown') {
      ips.add(evt.sourceIp);
    }
  }

  return {
    events,
    summary: {
      total,
      successCount,
      failureCount,
      successRatePct: total > 0 ? Math.round((successCount / total) * 1000) / 10 : 0,
      uniqueIps: ips.size,
      avgLatencyMs: total > 0 ? Math.round(totalLatency / total) : 0,
    },
  };
}

export function clearTurnstileVerificationEvents(): void {
  turnstileEventsCache = [];
  persistTurnstileEvents([]);
}


