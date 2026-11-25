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
    const startSocketBytes = req.socket?.bytesWritten ?? 0;

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

    res.on('finish', () => {
      const contentLenHeader = res.getHeader('content-length');
      const headerBytes =
        typeof contentLenHeader === 'number'
          ? contentLenHeader
          : typeof contentLenHeader === 'string'
            ? Number(contentLenHeader) || 0
            : 0;
      const socketDelta = Math.max(0, (req.socket?.bytesWritten ?? startSocketBytes) - startSocketBytes);
      const bytesTransferred = headerBytes > 0 ? headerBytes : socketDelta;
      const isCacheEligible =
        (req.method === 'GET' || req.method === 'HEAD') && policy.cdnCacheControl !== 'no-store';
      const isHtmlPage =
        policy.category === 'Public HTML Route' &&
        req.method === 'GET' &&
        res.statusCode >= 200 &&
        res.statusCode < 400;

      recordOriginTrafficSample({
        path: req.path || '/',
        statusCode: res.statusCode,
        bytes: bytesTransferred,
        cachedEligible: isCacheEligible,
        isPageView: isHtmlPage,
        clientIp: edgeCtx.clientIp,
        country: edgeCtx.cfCountry,
        cfRay: edgeCtx.cfRay,
      });
    });

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
        compatibilityDate: String(parsed.compatibility_date || '2025-09-01'),
        pagesOutputDir: String(parsed.pages_build_output_dir || './dist'),
      };
    }
  } catch {
    // Fallback below
  }
  return {
    configured: false,
    appName: 'accounticca-elawyers-compliance-suite',
    compatibilityDate: '2025-09-01',
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

  if (event.status === 'failure') {
    recordOriginThreatEvent({
      ruleId: 'cf-turnstile-challenge-fail',
      ruleName: 'Cloudflare Turnstile Human Verification Challenge',
      vector: 'Turnstile Challenge Failed',
      action: 'managed_challenge',
      category: 'challenged',
      source: `Turnstile (${event.action})`,
      clientIp: event.sourceIp,
      country: event.cfCountry,
      cfRay: event.cfRay,
      route: event.route,
    });
  }

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

// ─────────────────────────────────────────────────────────────────────────────
// Real-Time Traffic Analytics (Cloudflare Web Analytics / GraphQL API + Origin)
// ─────────────────────────────────────────────────────────────────────────────

export type AnalyticsTimeWindow = '15m' | '1h' | '6h' | '24h';

export interface TrafficAnalyticsPoint {
  timestamp: string;
  label: string;
  requests: number;
  rps: number;
  bandwidthBytes: number;
  cachedBytes: number;
  threats: number;
}

export interface ThreatMitigationEvent {
  id: string;
  timestamp: string;
  vector: string;
  action: string;
  source: string;
  country: string | null;
  count: number;
}

export interface CloudflareRealtimeAnalyticsPayload {
  source: 'cloudflare-analytics-api' | 'origin-live-telemetry';
  window: AnalyticsTimeWindow;
  bucketSeconds: number;
  fetchedAt: string;
  webAnalyticsRumConfigured: boolean;
  rumPageLoads: number | null;
  rumVisits: number | null;
  summary: {
    currentRps: number;
    averageRps: number;
    peakRps: number;
    totalRequests: number;
    cachedRequests: number;
    cacheHitRatioPct: number;
    totalBandwidthBytes: number;
    cachedBandwidthBytes: number;
    bandwidthBytesPerSec: number;
    threatsMitigated: number;
    pageViews: number;
    uniqueVisitors: number;
  };
  series: TrafficAnalyticsPoint[];
  threatEvents: ThreatMitigationEvent[];
  apiNotice: string | null;
}

interface OriginMinuteBucket {
  minuteEpochMs: number;
  requests: number;
  cachedRequests: number;
  bytes: number;
  cachedBytes: number;
  threats: number;
  pageViews: number;
  uniqueIps: Set<string>;
}

const ORIGIN_MINUTE_BUCKETS = new Map<number, OriginMinuteBucket>();
const ORIGIN_THREAT_EVENTS: ThreatMitigationEvent[] = [];
const MAX_ORIGIN_BUCKET_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_ORIGIN_THREAT_EVENTS = 100;

function getMinuteFloorMs(tsMs: number): number {
  return Math.floor(tsMs / 60_000) * 60_000;
}

function pruneOriginAnalyticsBuffers(nowMs: number): void {
  const cutoff = getMinuteFloorMs(nowMs - MAX_ORIGIN_BUCKET_AGE_MS);
  for (const key of ORIGIN_MINUTE_BUCKETS.keys()) {
    if (key < cutoff) {
      ORIGIN_MINUTE_BUCKETS.delete(key);
    }
  }
}

function recordOriginThreatEvent(params: {
  ruleId: string;
  ruleName: string;
  vector: string;
  action: string;
  category: 'blocked' | 'challenged';
  source: string;
  clientIp: string;
  country: string | null;
  cfRay: string | null;
  route: string;
}): void {
  const now = new Date();
  const minuteKey = getMinuteFloorMs(now.getTime());
  const existingBucket = ORIGIN_MINUTE_BUCKETS.get(minuteKey);
  if (existingBucket) {
    existingBucket.threats += 1;
  } else {
    ORIGIN_MINUTE_BUCKETS.set(minuteKey, {
      minuteEpochMs: minuteKey,
      requests: 0,
      cachedRequests: 0,
      bytes: 0,
      cachedBytes: 0,
      threats: 1,
      pageViews: 0,
      uniqueIps: new Set<string>(),
    });
  }

  ORIGIN_THREAT_EVENTS.unshift({
    id: `threat-${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: now.toISOString(),
    vector: params.vector,
    action: params.action.toUpperCase(),
    source: `${params.source} · ${params.route.slice(0, 60)}`,
    country: params.country,
    count: 1,
  });

  if (ORIGIN_THREAT_EVENTS.length > MAX_ORIGIN_THREAT_EVENTS) {
    ORIGIN_THREAT_EVENTS.length = MAX_ORIGIN_THREAT_EVENTS;
  }

  recordOriginWafEvent({
    id: `waf-origin-${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: now.toISOString(),
    ruleId: params.ruleId,
    ruleName: params.ruleName,
    action: params.action,
    category: params.category,
    source: params.source,
    clientIp: params.clientIp || 'unknown',
    country: params.country,
    requestPath: params.route.slice(0, 140),
    cfRay: params.cfRay,
    count: 1,
  });
}

function recordOriginTrafficSample(sample: {
  path: string;
  statusCode: number;
  bytes: number;
  cachedEligible: boolean;
  isPageView: boolean;
  clientIp: string;
  country: string | null;
  cfRay: string | null;
}): void {
  const nowMs = Date.now();
  const minuteKey = getMinuteFloorMs(nowMs);
  let bucket = ORIGIN_MINUTE_BUCKETS.get(minuteKey);
  if (!bucket) {
    bucket = {
      minuteEpochMs: minuteKey,
      requests: 0,
      cachedRequests: 0,
      bytes: 0,
      cachedBytes: 0,
      threats: 0,
      pageViews: 0,
      uniqueIps: new Set<string>(),
    };
    ORIGIN_MINUTE_BUCKETS.set(minuteKey, bucket);
    if (ORIGIN_MINUTE_BUCKETS.size > 1500) {
      pruneOriginAnalyticsBuffers(nowMs);
    }
  }

  bucket.requests += 1;
  const safeBytes = Math.max(0, Math.round(sample.bytes || 0));
  bucket.bytes += safeBytes;
  if (sample.cachedEligible) {
    bucket.cachedRequests += 1;
    bucket.cachedBytes += safeBytes;
  }
  if (sample.isPageView) {
    bucket.pageViews += 1;
  }
  if (sample.clientIp && sample.clientIp !== 'unknown') {
    bucket.uniqueIps.add(sample.clientIp);
  }

  if (sample.statusCode === 429) {
    recordOriginThreatEvent({
      ruleId: 'cf-origin-rate-limit-429',
      ruleName: 'Sliding-Window Rate Limit Enforcement',
      vector: 'Rate Limit Exceeded (HTTP 429)',
      action: 'block',
      category: 'blocked',
      source: 'Express Origin Limiter',
      clientIp: sample.clientIp,
      country: sample.country,
      cfRay: sample.cfRay,
      route: sample.path,
    });
  } else if (sample.statusCode === 401 && sample.path.startsWith('/api/admin')) {
    recordOriginThreatEvent({
      ruleId: 'cf-origin-admin-auth-401',
      ruleName: 'Admin Endpoint Access Protection',
      vector: 'Unauthorized Admin Access Blocked',
      action: 'block',
      category: 'blocked',
      source: 'Admin Auth Guard',
      clientIp: sample.clientIp,
      country: sample.country,
      cfRay: sample.cfRay,
      route: sample.path,
    });
  } else if (sample.statusCode === 403 && sample.path.startsWith('/api/')) {
    recordOriginThreatEvent({
      ruleId: 'cf-origin-api-guard-403',
      ruleName: 'Protected API Request Verification Guard',
      vector: 'Forbidden API Request Mitigated',
      action: 'block',
      category: 'blocked',
      source: 'Origin Security Guard',
      clientIp: sample.clientIp,
      country: sample.country,
      cfRay: sample.cfRay,
      route: sample.path,
    });
  }
}

function formatBucketLabel(iso: string, window: AnalyticsTimeWindow): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  if (window === '24h') {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function resolveAnalyticsWindowConfig(rawWindow: string | undefined): {
  window: AnalyticsTimeWindow;
  durationMs: number;
  bucketSeconds: number;
  slotCount: number;
  useHourlyGraphql: boolean;
} {
  switch (rawWindow) {
    case '15m':
      return {
        window: '15m',
        durationMs: 15 * 60 * 1000,
        bucketSeconds: 60,
        slotCount: 15,
        useHourlyGraphql: false,
      };
    case '6h':
      return {
        window: '6h',
        durationMs: 6 * 60 * 60 * 1000,
        bucketSeconds: 15 * 60,
        slotCount: 24,
        useHourlyGraphql: false,
      };
    case '24h':
      return {
        window: '24h',
        durationMs: 24 * 60 * 60 * 1000,
        bucketSeconds: 3600,
        slotCount: 24,
        useHourlyGraphql: true,
      };
    case '1h':
    default:
      return {
        window: '1h',
        durationMs: 60 * 60 * 1000,
        bucketSeconds: 5 * 60,
        slotCount: 12,
        useHourlyGraphql: false,
      };
  }
}

function buildOriginRealtimeAnalytics(
  rawWindow: string | undefined,
  apiNotice: string | null
): CloudflareRealtimeAnalyticsPayload {
  const cfg = resolveAnalyticsWindowConfig(rawWindow);
  const nowMs = Date.now();
  pruneOriginAnalyticsBuffers(nowMs);

  const bucketMs = cfg.bucketSeconds * 1000;
  const endSlotMs = Math.floor(nowMs / bucketMs) * bucketMs;
  const startSlotMs = endSlotMs - (cfg.slotCount - 1) * bucketMs;
  const windowCutoffMs = startSlotMs;

  const series: TrafficAnalyticsPoint[] = [];
  const allUniqueIps = new Set<string>();
  let totalRequests = 0;
  let cachedRequests = 0;
  let totalBandwidthBytes = 0;
  let cachedBandwidthBytes = 0;
  let threatsMitigated = 0;
  let pageViews = 0;
  let peakRps = 0;

  for (let i = 0; i < cfg.slotCount; i++) {
    const slotStart = startSlotMs + i * bucketMs;
    const slotEnd = slotStart + bucketMs;

    let slotReqs = 0;
    let slotCachedReqs = 0;
    let slotBytes = 0;
    let slotCachedBytes = 0;
    let slotThreats = 0;
    let slotPageViews = 0;

    for (const bucket of ORIGIN_MINUTE_BUCKETS.values()) {
      if (bucket.minuteEpochMs >= slotStart && bucket.minuteEpochMs < slotEnd) {
        slotReqs += bucket.requests;
        slotCachedReqs += bucket.cachedRequests;
        slotBytes += bucket.bytes;
        slotCachedBytes += bucket.cachedBytes;
        slotThreats += bucket.threats;
        slotPageViews += bucket.pageViews;
        for (const ip of bucket.uniqueIps) {
          allUniqueIps.add(ip);
        }
      }
    }

    const effectiveSeconds =
      i === cfg.slotCount - 1
        ? Math.max(1, Math.min(cfg.bucketSeconds, Math.round((nowMs - slotStart) / 1000)))
        : cfg.bucketSeconds;
    const rps = Math.round((slotReqs / effectiveSeconds) * 100) / 100;
    if (rps > peakRps) peakRps = rps;

    totalRequests += slotReqs;
    cachedRequests += slotCachedReqs;
    totalBandwidthBytes += slotBytes;
    cachedBandwidthBytes += slotCachedBytes;
    threatsMitigated += slotThreats;
    pageViews += slotPageViews;

    const iso = new Date(slotStart).toISOString();
    series.push({
      timestamp: iso,
      label: formatBucketLabel(iso, cfg.window),
      requests: slotReqs,
      rps,
      bandwidthBytes: slotBytes,
      cachedBytes: slotCachedBytes,
      threats: slotThreats,
    });
  }

  const latestPoint = series[series.length - 1];
  const windowSeconds = Math.max(1, cfg.durationMs / 1000);
  const averageRps = Math.round((totalRequests / windowSeconds) * 100) / 100;
  const cacheHitRatioPct =
    totalRequests > 0 ? Math.round((cachedRequests / totalRequests) * 1000) / 10 : 0;

  const recentThreats = ORIGIN_THREAT_EVENTS.filter(
    (evt) => new Date(evt.timestamp).getTime() >= windowCutoffMs
  ).slice(0, 20);

  return {
    source: 'origin-live-telemetry',
    window: cfg.window,
    bucketSeconds: cfg.bucketSeconds,
    fetchedAt: new Date(nowMs).toISOString(),
    webAnalyticsRumConfigured: Boolean(process.env.VITE_CLOUDFLARE_ANALYTICS_TOKEN?.trim()),
    rumPageLoads: null,
    rumVisits: null,
    summary: {
      currentRps: latestPoint ? latestPoint.rps : 0,
      averageRps,
      peakRps,
      totalRequests,
      cachedRequests,
      cacheHitRatioPct,
      totalBandwidthBytes,
      cachedBandwidthBytes,
      bandwidthBytesPerSec: Math.round(totalBandwidthBytes / windowSeconds),
      threatsMitigated,
      pageViews,
      uniqueVisitors: allUniqueIps.size,
    },
    series,
    threatEvents: recentThreats,
    apiNotice,
  };
}

async function postCloudflareGraphQL(
  apiToken: string,
  query: string,
  variables: Record<string, unknown>,
  timeoutMs = 7000
): Promise<{ ok: boolean; status: number; data: any }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchCloudflareRealtimeAnalytics(
  rawWindow?: string
): Promise<CloudflareRealtimeAnalyticsPayload> {
  const cfg = resolveAnalyticsWindowConfig(rawWindow);
  const zoneId = (process.env.CLOUDFLARE_ZONE_ID || '').trim();
  const apiToken = (process.env.CLOUDFLARE_API_TOKEN || '').trim();
  const accountId = (
    process.env.CLOUDFLARE_ACCOUNT_ID ||
    process.env.R2_ACCOUNT_ID ||
    ''
  ).trim();
  const rumSiteTag = (process.env.VITE_CLOUDFLARE_ANALYTICS_TOKEN || '').trim();

  if (!zoneId || !apiToken) {
    return buildOriginRealtimeAnalytics(
      cfg.window,
      'Cloudflare Web Analytics API credentials are not configured. Set CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN (with Zone:Analytics:Read) in your server environment to stream live Cloudflare edge metrics. Displaying live Express origin traffic telemetry.'
    );
  }

  const now = new Date();
  const since = new Date(now.getTime() - cfg.durationMs);

  const primaryQuery = cfg.useHourlyGraphql
    ? `query CloudflareZoneHourlyAnalytics($zoneTag: String!, $since: Time!, $until: Time!) {
        viewer {
          zones(filter: { zoneTag: $zoneTag }) {
            groups: httpRequests1hGroups(
              limit: 48
              orderBy: [datetimeHour_ASC]
              filter: { datetimeHour_geq: $since, datetimeHour_leq: $until }
            ) {
              dimensions { ts: datetimeHour }
              sum {
                requests
                cachedRequests
                bytes
                cachedBytes
                threats
                pageViews
                threatPathingMap {
                  threatPathingName
                  requests
                }
              }
              uniq { uniques }
            }
          }
        }
      }`
    : `query CloudflareZoneMinuteAnalytics($zoneTag: String!, $since: Time!, $until: Time!) {
        viewer {
          zones(filter: { zoneTag: $zoneTag }) {
            groups: httpRequests1mGroups(
              limit: 360
              orderBy: [datetimeMinute_ASC]
              filter: { datetimeMinute_geq: $since, datetimeMinute_leq: $until }
            ) {
              dimensions { ts: datetimeMinute }
              sum {
                requests
                cachedRequests
                bytes
                cachedBytes
                threats
                pageViews
                threatPathingMap {
                  threatPathingName
                  requests
                }
              }
              uniq { uniques }
            }
          }
        }
      }`;

  const firewallQuery = `query CloudflareZoneFirewallMitigations($zoneTag: String!, $since: Time!, $until: Time!) {
    viewer {
      zones(filter: { zoneTag: $zoneTag }) {
        firewallEventsAdaptiveGroups(
          limit: 15
          orderBy: [count_DESC]
          filter: { datetime_geq: $since, datetime_leq: $until }
        ) {
          count
          dimensions {
            action
            source
            clientCountryName
            ruleId
          }
        }
      }
    }
  }`;

  const rumQuery =
    accountId && rumSiteTag
      ? `query CloudflareWebAnalyticsRum($accountTag: String!, $siteTag: String!, $since: Time!, $until: Time!) {
          viewer {
            accounts(filter: { accountTag: $accountTag }) {
              rumPageloadEventsAdaptiveGroups(
                limit: 10
                filter: { siteTag: $siteTag, datetime_geq: $since, datetime_leq: $until }
              ) {
                count
                sum { visits }
              }
            }
          }
        }`
      : null;

  try {
    const vars = {
      zoneTag: zoneId,
      since: since.toISOString(),
      until: now.toISOString(),
    };

    const [primaryRes, firewallRes, rumRes] = await Promise.all([
      postCloudflareGraphQL(apiToken, primaryQuery, vars),
      postCloudflareGraphQL(apiToken, firewallQuery, vars).catch(() => null),
      rumQuery
        ? postCloudflareGraphQL(apiToken, rumQuery, {
            accountTag: accountId,
            siteTag: rumSiteTag,
            since: since.toISOString(),
            until: now.toISOString(),
          }).catch(() => null)
        : Promise.resolve(null),
    ]);

    const gqlErrors = Array.isArray(primaryRes.data?.errors) ? primaryRes.data.errors : [];
    const zoneNode = primaryRes.data?.data?.viewer?.zones?.[0];

    if (!primaryRes.ok || !zoneNode || (gqlErrors.length > 0 && !Array.isArray(zoneNode?.groups))) {
      const errMsg =
        gqlErrors.length > 0
          ? gqlErrors.map((e: any) => e.message || 'GraphQL error').join('; ')
          : `Cloudflare GraphQL Analytics API returned HTTP ${primaryRes.status}`;
      return buildOriginRealtimeAnalytics(
        cfg.window,
        `Cloudflare Web Analytics API query unavailable (${errMsg}). Ensure CLOUDFLARE_API_TOKEN includes Zone:Analytics:Read permission. Showing live Express origin traffic telemetry.`
      );
    }

    const rawGroups: any[] = Array.isArray(zoneNode.groups) ? zoneNode.groups : [];
    const rawBucketSeconds = cfg.useHourlyGraphql ? 3600 : 60;

    // Aggregate raw minute groups into window-sized chart buckets for clean readability
    const bucketMs = cfg.bucketSeconds * 1000;
    const aggregated = new Map<
      number,
      {
        requests: number;
        cachedRequests: number;
        bytes: number;
        cachedBytes: number;
        threats: number;
        pageViews: number;
      }
    >();

    let totalRequests = 0;
    let cachedRequests = 0;
    let totalBandwidthBytes = 0;
    let cachedBandwidthBytes = 0;
    let threatsMitigated = 0;
    let pageViews = 0;
    let uniqueVisitors = 0;

    const threatPathMap = new Map<string, number>();

    for (const grp of rawGroups) {
      const tsStr = grp?.dimensions?.ts;
      const tsMs = tsStr ? new Date(tsStr).getTime() : NaN;
      if (Number.isNaN(tsMs)) continue;

      const sum = grp.sum || {};
      const reqs = Number(sum.requests || 0);
      const cReqs = Number(sum.cachedRequests || 0);
      const bytes = Number(sum.bytes || 0);
      const cBytes = Number(sum.cachedBytes || 0);
      const threats = Number(sum.threats || 0);
      const pvs = Number(sum.pageViews || 0);
      const uniq = Number(grp?.uniq?.uniques || 0);

      totalRequests += reqs;
      cachedRequests += cReqs;
      totalBandwidthBytes += bytes;
      cachedBandwidthBytes += cBytes;
      threatsMitigated += threats;
      pageViews += pvs;
      uniqueVisitors = Math.max(uniqueVisitors, uniq);

      if (Array.isArray(sum.threatPathingMap)) {
        for (const tp of sum.threatPathingMap) {
          const name = String(tp?.threatPathingName || 'Edge Threat Mitigation');
          const cnt = Number(tp?.requests || 0);
          if (cnt > 0) {
            threatPathMap.set(name, (threatPathMap.get(name) || 0) + cnt);
          }
        }
      }

      const slotStart = Math.floor(tsMs / bucketMs) * bucketMs;
      const prev = aggregated.get(slotStart) || {
        requests: 0,
        cachedRequests: 0,
        bytes: 0,
        cachedBytes: 0,
        threats: 0,
        pageViews: 0,
      };
      prev.requests += reqs;
      prev.cachedRequests += cReqs;
      prev.bytes += bytes;
      prev.cachedBytes += cBytes;
      prev.threats += threats;
      prev.pageViews += pvs;
      aggregated.set(slotStart, prev);
    }

    const sortedSlots = Array.from(aggregated.entries()).sort((a, b) => a[0] - b[0]);
    let peakRps = 0;
    const series: TrafficAnalyticsPoint[] = sortedSlots.map(([slotStart, vals]) => {
      const denomSeconds = Math.max(rawBucketSeconds, cfg.bucketSeconds);
      const rps = Math.round((vals.requests / denomSeconds) * 100) / 100;
      if (rps > peakRps) peakRps = rps;
      const iso = new Date(slotStart).toISOString();
      return {
        timestamp: iso,
        label: formatBucketLabel(iso, cfg.window),
        requests: vals.requests,
        rps,
        bandwidthBytes: vals.bytes,
        cachedBytes: vals.cachedBytes,
        threats: vals.threats,
      };
    });

    // Extract firewall mitigation events if returned, otherwise fall back to threatPathingMap
    const threatEvents: ThreatMitigationEvent[] = [];
    const fwGroups =
      firewallRes?.ok && Array.isArray(firewallRes?.data?.data?.viewer?.zones?.[0]?.firewallEventsAdaptiveGroups)
        ? firewallRes.data.data.viewer.zones[0].firewallEventsAdaptiveGroups
        : [];

    if (fwGroups.length > 0) {
      fwGroups.forEach((item: any, idx: number) => {
        const dims = item?.dimensions || {};
        threatEvents.push({
          id: `cf-fw-${idx}-${dims.ruleId || dims.source || 'edge'}`,
          timestamp: now.toISOString(),
          vector: dims.ruleId ? `WAF Rule ${String(dims.ruleId).slice(0, 16)}` : String(dims.source || 'Cloudflare WAF'),
          action: String(dims.action || 'mitigated').toUpperCase(),
          source: String(dims.source || 'Cloudflare Edge WAF'),
          country: dims.clientCountryName ? String(dims.clientCountryName) : null,
          count: Number(item?.count || 0),
        });
      });
    } else if (threatPathMap.size > 0) {
      Array.from(threatPathMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .forEach(([name, count], idx) => {
          threatEvents.push({
            id: `cf-tp-${idx}-${name}`,
            timestamp: now.toISOString(),
            vector: name,
            action: 'MITIGATED',
            source: 'Cloudflare Edge Protection',
            country: null,
            count,
          });
        });
    }

    // Extract optional Cloudflare Web Analytics RUM counts
    let rumPageLoads: number | null = null;
    let rumVisits: number | null = null;
    const rumGroups =
      rumRes?.ok && Array.isArray(rumRes?.data?.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups)
        ? rumRes.data.data.viewer.accounts[0].rumPageloadEventsAdaptiveGroups
        : null;
    if (rumGroups) {
      rumPageLoads = rumGroups.reduce((acc: number, g: any) => acc + Number(g?.count || 0), 0);
      rumVisits = rumGroups.reduce((acc: number, g: any) => acc + Number(g?.sum?.visits || 0), 0);
    }

    const latestPoint = series[series.length - 1];
    const windowSeconds = Math.max(1, cfg.durationMs / 1000);
    const averageRps = Math.round((totalRequests / windowSeconds) * 100) / 100;
    const cacheHitRatioPct =
      totalRequests > 0 ? Math.round((cachedRequests / totalRequests) * 1000) / 10 : 0;

    return {
      source: 'cloudflare-analytics-api',
      window: cfg.window,
      bucketSeconds: cfg.bucketSeconds,
      fetchedAt: now.toISOString(),
      webAnalyticsRumConfigured: Boolean(rumSiteTag),
      rumPageLoads,
      rumVisits,
      summary: {
        currentRps: latestPoint ? latestPoint.rps : 0,
        averageRps,
        peakRps,
        totalRequests,
        cachedRequests,
        cacheHitRatioPct,
        totalBandwidthBytes,
        cachedBandwidthBytes,
        bandwidthBytesPerSec: Math.round(totalBandwidthBytes / windowSeconds),
        threatsMitigated,
        pageViews,
        uniqueVisitors,
      },
      series,
      threatEvents,
      apiNotice: null,
    };
  } catch (err: any) {
    return buildOriginRealtimeAnalytics(
      cfg.window,
      `Cloudflare Web Analytics API unreachable (${err?.message || 'network timeout'}). Showing live Express origin traffic telemetry.`
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Cloudflare WAF Blocked & Challenged Requests Summary (Rule ID & Timestamp)
// ─────────────────────────────────────────────────────────────────────────────

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

export interface CloudflareWafEventsPayload {
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
}

const WAF_EVENTS_FILE = path.join(
  os.tmpdir(),
  'accounticca-runtime-data',
  'waf-rule-events.json'
);
const MAX_STORED_WAF_EVENTS = 300;
let wafEventsCache: WafRuleEvent[] | null = null;

function ensureWafEventsLoaded(): WafRuleEvent[] {
  if (wafEventsCache !== null) {
    return wafEventsCache;
  }
  try {
    if (fs.existsSync(WAF_EVENTS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(WAF_EVENTS_FILE, 'utf-8'));
      if (Array.isArray(parsed)) {
        wafEventsCache = parsed.slice(0, MAX_STORED_WAF_EVENTS);
        return wafEventsCache;
      }
    }
  } catch {
    // Fallback to empty buffer
  }
  wafEventsCache = [];
  return wafEventsCache;
}

function persistWafEvents(events: WafRuleEvent[]): void {
  try {
    const dir = path.dirname(WAF_EVENTS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(WAF_EVENTS_FILE, JSON.stringify(events, null, 2), 'utf-8');
  } catch {
    // Non-fatal in ephemeral runtimes
  }
}

function recordOriginWafEvent(event: WafRuleEvent): void {
  const current = ensureWafEventsLoaded();
  const next = [event, ...current].slice(0, MAX_STORED_WAF_EVENTS);
  wafEventsCache = next;
  persistWafEvents(next);
}

function classifyWafActionCategory(rawAction: string): 'blocked' | 'challenged' {
  const normalized = String(rawAction || '').toLowerCase();
  if (normalized.includes('challenge')) {
    return 'challenged';
  }
  return 'blocked';
}

function summarizeWafEvents(
  rawEvents: WafRuleEvent[],
  filters: {
    ruleId?: string;
    sinceMs?: number | null;
    untilMs?: number | null;
    action?: 'all' | 'blocked' | 'challenged';
    limit?: number;
  }
): {
  totals: CloudflareWafEventsPayload['totals'];
  availableRuleIds: string[];
  ruleSummaries: WafRuleSummaryRow[];
  events: WafRuleEvent[];
} {
  const ruleIdSet = new Set<string>();
  for (const evt of rawEvents) {
    if (evt.ruleId) ruleIdSet.add(evt.ruleId);
  }
  const availableRuleIds = Array.from(ruleIdSet).sort((a, b) => a.localeCompare(b));

  const ruleQuery = (filters.ruleId || '').trim().toLowerCase();
  const filtered = rawEvents.filter((evt) => {
    if (filters.action && filters.action !== 'all' && evt.category !== filters.action) {
      return false;
    }
    if (ruleQuery && !evt.ruleId.toLowerCase().includes(ruleQuery)) {
      return false;
    }
    const tsMs = new Date(evt.timestamp).getTime();
    if (filters.sinceMs && Number.isFinite(tsMs) && tsMs < filters.sinceMs) {
      return false;
    }
    if (filters.untilMs && Number.isFinite(tsMs) && tsMs > filters.untilMs) {
      return false;
    }
    return true;
  });

  const summaryMap = new Map<
    string,
    {
      ruleId: string;
      ruleName: string;
      source: string;
      blockedCount: number;
      challengedCount: number;
      totalCount: number;
      ips: Set<string>;
      countryCounts: Map<string, number>;
      lastTriggeredAt: string;
      lastTriggeredMs: number;
    }
  >();

  let totalCount = 0;
  let blockedCount = 0;
  let challengedCount = 0;
  const allIps = new Set<string>();

  for (const evt of filtered) {
    const cnt = Math.max(1, Number(evt.count || 1));
    totalCount += cnt;
    if (evt.category === 'blocked') blockedCount += cnt;
    else challengedCount += cnt;

    if (evt.clientIp && evt.clientIp !== 'unknown') {
      allIps.add(evt.clientIp);
    }

    const key = evt.ruleId || 'unknown-rule';
    let entry = summaryMap.get(key);
    const tsMs = new Date(evt.timestamp).getTime();
    if (!entry) {
      entry = {
        ruleId: key,
        ruleName: evt.ruleName || key,
        source: evt.source || 'Cloudflare WAF',
        blockedCount: 0,
        challengedCount: 0,
        totalCount: 0,
        ips: new Set<string>(),
        countryCounts: new Map<string, number>(),
        lastTriggeredAt: evt.timestamp,
        lastTriggeredMs: Number.isFinite(tsMs) ? tsMs : 0,
      };
      summaryMap.set(key, entry);
    }

    entry.totalCount += cnt;
    if (evt.category === 'blocked') entry.blockedCount += cnt;
    else entry.challengedCount += cnt;
    if (evt.clientIp && evt.clientIp !== 'unknown') {
      entry.ips.add(evt.clientIp);
    }
    if (evt.country) {
      entry.countryCounts.set(evt.country, (entry.countryCounts.get(evt.country) || 0) + cnt);
    }
    if (Number.isFinite(tsMs) && tsMs > entry.lastTriggeredMs) {
      entry.lastTriggeredMs = tsMs;
      entry.lastTriggeredAt = evt.timestamp;
    }
  }

  const ruleSummaries: WafRuleSummaryRow[] = Array.from(summaryMap.values())
    .map((entry) => {
      let topCountry: string | null = null;
      let topCountryCount = 0;
      for (const [country, cCount] of entry.countryCounts.entries()) {
        if (cCount > topCountryCount) {
          topCountry = country;
          topCountryCount = cCount;
        }
      }
      return {
        ruleId: entry.ruleId,
        ruleName: entry.ruleName,
        source: entry.source,
        blockedCount: entry.blockedCount,
        challengedCount: entry.challengedCount,
        totalCount: entry.totalCount,
        uniqueIps: entry.ips.size,
        topCountry,
        lastTriggeredAt: entry.lastTriggeredAt,
      };
    })
    .sort((a, b) => b.totalCount - a.totalCount);

  const boundedLimit = Math.max(1, Math.min(200, Math.floor(Number(filters.limit || 100))));

  return {
    totals: {
      totalCount,
      blockedCount,
      challengedCount,
      distinctRuleCount: ruleSummaries.length,
      uniqueIps: allIps.size,
    },
    availableRuleIds,
    ruleSummaries,
    events: filtered.slice(0, boundedLimit),
  };
}

export async function fetchCloudflareWafBlockedChallengedEvents(params?: {
  ruleId?: string;
  since?: string;
  until?: string;
  action?: 'all' | 'blocked' | 'challenged';
  limit?: number;
}): Promise<CloudflareWafEventsPayload> {
  const now = new Date();
  const parsedSinceMs = params?.since ? new Date(params.since).getTime() : NaN;
  const parsedUntilMs = params?.until ? new Date(params.until).getTime() : NaN;
  const sinceMs = Number.isFinite(parsedSinceMs) ? parsedSinceMs : null;
  const untilMs = Number.isFinite(parsedUntilMs) ? parsedUntilMs : null;
  const actionFilter =
    params?.action === 'blocked' || params?.action === 'challenged' ? params.action : 'all';

  const zoneId = (process.env.CLOUDFLARE_ZONE_ID || '').trim();
  const apiToken = (process.env.CLOUDFLARE_API_TOKEN || '').trim();

  const buildOriginFallback = (notice: string): CloudflareWafEventsPayload => {
    const localEvents = ensureWafEventsLoaded();
    const summarized = summarizeWafEvents(localEvents, {
      ruleId: params?.ruleId,
      sinceMs,
      untilMs,
      action: actionFilter,
      limit: params?.limit,
    });
    return {
      source: 'origin-security-guard',
      fetchedAt: now.toISOString(),
      ...summarized,
      apiNotice: notice,
    };
  };

  if (!zoneId || !apiToken) {
    return buildOriginFallback(
      'Cloudflare WAF GraphQL API credentials are not configured. Set CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN (with Zone:Analytics:Read) in your server environment to stream edge WAF rule events. Showing origin-enforced blocks and Turnstile challenges.'
    );
  }

  const querySince = sinceMs
    ? new Date(sinceMs).toISOString()
    : new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const queryUntil = untilMs ? new Date(untilMs).toISOString() : now.toISOString();

  const wafAdaptiveQuery = `query CloudflareWafBlockedChallenged($zoneTag: String!, $since: Time!, $until: Time!) {
    viewer {
      zones(filter: { zoneTag: $zoneTag }) {
        firewallEventsAdaptive(
          limit: 200
          orderBy: [datetime_DESC]
          filter: {
            datetime_geq: $since
            datetime_leq: $until
            action_in: ["block", "managed_challenge", "js_challenge", "challenge", "interactive_challenge"]
          }
        ) {
          action
          clientIP
          clientCountryName
          clientRequestPath
          datetime
          rayName
          ruleId
          source
        }
      }
    }
  }`;

  try {
    const [wafRes, customRulesRes] = await Promise.all([
      postCloudflareGraphQL(apiToken, wafAdaptiveQuery, {
        zoneTag: zoneId,
        since: querySince,
        until: queryUntil,
      }),
      fetchJsonWithTimeout(
        `https://api.cloudflare.com/client/v4/zones/${encodeURIComponent(zoneId)}/rulesets/phases/http_request_firewall_custom/entrypoint`,
        {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        4500
      ).catch(() => null),
    ]);

    const gqlErrors = Array.isArray(wafRes.data?.errors) ? wafRes.data.errors : [];
    const rawEvents = wafRes.data?.data?.viewer?.zones?.[0]?.firewallEventsAdaptive;

    if (!wafRes.ok || !Array.isArray(rawEvents)) {
      const errMsg =
        gqlErrors.length > 0
          ? gqlErrors.map((e: any) => e.message || 'GraphQL error').join('; ')
          : `Cloudflare WAF GraphQL API returned HTTP ${wafRes.status}`;
      return buildOriginFallback(
        `Cloudflare WAF API query unavailable (${errMsg}). Ensure CLOUDFLARE_API_TOKEN includes Zone:Analytics:Read permission. Showing origin-enforced blocks and challenges.`
      );
    }

    const ruleNameMap = new Map<string, string>();
    const customRules =
      customRulesRes?.ok && customRulesRes?.data?.success
        ? customRulesRes.data?.result?.rules
        : null;
    if (Array.isArray(customRules)) {
      for (const r of customRules) {
        if (r?.id) {
          ruleNameMap.set(String(r.id), String(r.description || r.ref || r.id));
        }
      }
    }

    const mappedEvents: WafRuleEvent[] = rawEvents.map((item: any, idx: number) => {
      const ruleId = String(item?.ruleId || item?.source || 'cf-waf-unassigned');
      const action = String(item?.action || 'block');
      const source = String(item?.source || 'firewallCustom');
      return {
        id: `cf-waf-evt-${item?.rayName || idx}-${idx}`,
        timestamp: item?.datetime ? String(item.datetime) : now.toISOString(),
        ruleId,
        ruleName:
          ruleNameMap.get(ruleId) ||
          (source === 'firewallManaged'
            ? 'Cloudflare Managed WAF Rule'
            : source === 'ratelimit'
              ? 'Cloudflare Rate Limiting Rule'
              : `Cloudflare WAF Rule (${source})`),
        action,
        category: classifyWafActionCategory(action),
        source,
        clientIp: String(item?.clientIP || 'unknown'),
        country: item?.clientCountryName ? String(item.clientCountryName) : null,
        requestPath: String(item?.clientRequestPath || '/'),
        cfRay: item?.rayName ? String(item.rayName) : null,
        count: 1,
      };
    });

    const summarized = summarizeWafEvents(mappedEvents, {
      ruleId: params?.ruleId,
      sinceMs,
      untilMs,
      action: actionFilter,
      limit: params?.limit,
    });

    return {
      source: 'cloudflare-waf-api',
      fetchedAt: now.toISOString(),
      ...summarized,
      apiNotice: null,
    };
  } catch (err: any) {
    return buildOriginFallback(
      `Cloudflare WAF API unreachable (${err?.message || 'network timeout'}). Showing origin-enforced blocks and Turnstile challenges.`
    );
  }
}




