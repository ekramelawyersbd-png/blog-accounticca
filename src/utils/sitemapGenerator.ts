import { mockArticles, categories } from '../data/mockData';
import { searchableTaxTools } from '../data/searchableTools';
import { SHOP_PRODUCTS } from '../data/shopProducts';
import { INITIAL_LMS_COURSES } from '../data/lmsCoursesData';
import { DEFAULT_SEO_CONFIG, type SeoConfig } from './seoConfig';

export type SitemapRouteSource =
  | 'react-router-static'
  | 'legal-tax-article'
  | 'legal-category'
  | 'compliance-tool'
  | 'shop-product'
  | 'lms-course';

export interface CrawledRouteEntry {
  path: string;
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: string;
  source: SitemapRouteSource;
  title?: string;
  category?: string;
  imageUrl?: string;
}

export interface SitemapGenerationReport {
  generatedAt: string;
  origin: string;
  publicFilePath: string;
  totalUrls: number;
  countsBySource: {
    staticRoutes: number;
    articles: number;
    categories: number;
    tools: number;
    products: number;
    courses: number;
  };
  routes: CrawledRouteEntry[];
  xml: string;
}

/**
 * Default list of React Router static paths declared in src/App.tsx
 * Used as a fallback when running in browser environments without fs access,
 * while Node.js environments parse src/App.tsx directly via extractReactRouterPathsFromSource().
 */
export const KNOWN_REACT_ROUTER_PATHS: string[] = [
  '/',
  '/training',
  '/community',
  '/experts',
  '/discussions',
  '/tools',
  '/tools/rjsc-fee-calculator',
  '/tools/post-registration-checklist',
  '/tools/rjsc-functions-explorer',
  '/tools/rjsc-returns-filing-guide',
  '/tools/capital-gains-tax',
  '/tools/corporate-tax',
  '/tools/wealth-surcharge',
  '/tools/investment-rebate',
  '/tools/agricultural-tax',
  '/tools/minimum-turnover-tax',
  '/tools/dvc-verification',
  '/tools/resource-library',
  '/tools/early-filing-incentive',
  '/tools/loss-carry-forward-calculator',
  '/tools/tax-slabs-explorer',
  '/tools/rate-finder',
  '/tools/vat-apportionment-calculator',
  '/tools/seo-performance-audit',
  '/resource-library',
  '/tax-refund-guide',
  '/course/personal-income-tax',
  '/search',
  '/glossary',
  '/faq',
  '/tax-planner',
  '/corporate-planner',
  '/policy-analysis',
  '/team',
  '/vat-guide',
  '/tds-guide',
  '/contact',
  '/verify-certificate',
  '/careers',
  '/careers/accountant',
  '/careers/customer-care',
  '/careers/mto',
  '/careers/sales-marketing',
  '/privacy',
  '/terms',
];

const EXCLUDED_ROUTE_PREFIXES = [
  '/admin',
  '/student',
  '/lms',
  '/checkout',
  '/shop/checkout',
  '/shop/login',
  '/payment',
  '/paymently',
  '/Paymently',
  '/gateway',
  '/auth',
  '/profile',
  '/portal',
  '/client-portal',
  '/workspace',
  '/settings',
  '/dashboard',
  '/enrollment',
  '/e_lawyers_customer_care_application.html',
];

/**
 * Checks whether a route path should be indexed by search engines.
 */
export function isIndexableRoutePath(rawPath: string): boolean {
  if (!rawPath) return false;
  const normalized = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;

  // Exclude wildcard, dynamic parameter placeholders (expanded separately), or malformed trailing '=' aliases
  if (normalized.includes('*') || normalized.includes(':') || normalized.endsWith('=')) {
    return false;
  }

  // Exclude uppercase duplicate aliases when lowercase canonical exists (e.g. /Careers/* vs /careers/*)
  if (normalized.startsWith('/Careers')) {
    return false;
  }

  for (const prefix of EXCLUDED_ROUTE_PREFIXES) {
    if (normalized === prefix || normalized.startsWith(`${prefix}/`)) {
      return false;
    }
  }

  return true;
}

/**
 * Dynamically extracts indexable React Router <Route path="..." element={...} /> definitions
 * from the raw source code of src/App.tsx, excluding <Navigate /> redirects and private routes.
 */
export function extractReactRouterPathsFromSource(appTsxSource: string): string[] {
  if (!appTsxSource || typeof appTsxSource !== 'string') {
    return KNOWN_REACT_ROUTER_PATHS;
  }

  const discovered = new Set<string>(['/']);

  // Match <Route ... /> blocks (both single-line and multi-line)
  const routeRegex = /<Route\b([\s\S]*?)\/?>/g;
  let match: RegExpExecArray | null;

  while ((match = routeRegex.exec(appTsxSource)) !== null) {
    const attrs = match[1];

    // Skip redirect routes that render <Navigate ... />
    if (attrs.includes('<Navigate')) {
      continue;
    }

    // Handle index route
    if (/\bindex\b/.test(attrs)) {
      discovered.add('/');
      continue;
    }

    const pathMatch = attrs.match(/\bpath=["']([^"']+)["']/);
    if (!pathMatch) continue;

    const rawPath = pathMatch[1].trim();
    const normalizedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;

    if (isIndexableRoutePath(normalizedPath)) {
      discovered.add(normalizedPath);
    }
  }

  return Array.from(discovered);
}

function escapeXml(unsafe: string): string {
  return String(unsafe || '').replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

function normalizeDateIso(dateStr?: string, fallbackIso?: string): string {
  const today = fallbackIso || new Date().toISOString().split('T')[0];
  if (!dateStr) return today;
  const trimmed = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return today;
}

/**
 * Crawls all React Router static routes, dynamic legal & tax articles, legal categories,
 * standalone compliance calculators/tools, digital shop templates, and LMS courses,
 * returning a structured SitemapGenerationReport with the complete XML string.
 */
export function crawlAllRoutesForSitemap(options?: {
  origin?: string;
  appTsxSource?: string;
  seoConfig?: SeoConfig;
  customProducts?: Array<{
    id?: string;
    slug: string;
    title?: string;
    category?: string;
    status?: string;
    updatedAt?: string;
    imageUrl?: string;
  }>;
}): SitemapGenerationReport {
  const cleanOrigin = (options?.origin || 'https://blog.accounticca.com').replace(/\/$/, '');
  const seoConfig = options?.seoConfig || DEFAULT_SEO_CONFIG;
  const todayIso = new Date().toISOString().split('T')[0];

  const entriesMap = new Map<string, CrawledRouteEntry>();

  const registerRoute = (entry: Omit<CrawledRouteEntry, 'loc'>) => {
    const cleanPath = entry.path === '/' ? '/' : `/${entry.path.replace(/^\/+/, '').replace(/\/+$/, '')}`;
    const loc = `${cleanOrigin}${cleanPath === '/' ? '/' : cleanPath}`;
    if (entriesMap.has(cleanPath)) {
      return;
    }
    entriesMap.set(cleanPath, {
      ...entry,
      path: cleanPath,
      loc,
    });
  };

  // 1. Crawl React Router static routes from App.tsx (plus any configured SEO static routes)
  const routerPaths = options?.appTsxSource
    ? extractReactRouterPathsFromSource(options.appTsxSource)
    : KNOWN_REACT_ROUTER_PATHS;

  for (const routePath of routerPaths) {
    const seoRoute = seoConfig.routes[routePath];
    if (seoRoute?.noindex) continue;

    const isToolRoute = routePath.startsWith('/tools/');
    registerRoute({
      path: routePath,
      lastmod: normalizeDateIso(seoRoute?.lastmod, todayIso),
      changefreq: seoRoute?.changefreq || (routePath === '/' ? 'daily' : isToolRoute ? 'weekly' : 'weekly'),
      priority: (seoRoute?.priority ?? (routePath === '/' ? 1.0 : isToolRoute ? 0.85 : 0.8)).toFixed(1),
      source: isToolRoute ? 'compliance-tool' : 'react-router-static',
      title: seoRoute?.title || (routePath === '/' ? 'Compliance Hub Home' : undefined),
    });
  }

  // Also include any public routes explicitly defined in seoConfig.routes
  for (const route of Object.values(seoConfig.routes)) {
    if (route.noindex || !isIndexableRoutePath(route.path)) continue;
    const isToolRoute = route.path.startsWith('/tools/');
    registerRoute({
      path: route.path,
      lastmod: normalizeDateIso(route.lastmod, todayIso),
      changefreq: route.changefreq || 'weekly',
      priority: (route.priority ?? 0.8).toFixed(1),
      source: isToolRoute ? 'compliance-tool' : 'react-router-static',
      title: route.title,
    });
  }

  // 2. Crawl all Interactive Compliance & Tax Tools from searchableTaxTools
  for (const tool of searchableTaxTools) {
    if (!tool.path) continue;
    const toolPath = tool.path.split('#')[0];
    if (!toolPath || !isIndexableRoutePath(toolPath)) continue;
    registerRoute({
      path: toolPath,
      lastmod: todayIso,
      changefreq: 'weekly',
      priority: '0.85',
      source: 'compliance-tool',
      title: tool.name,
      category: tool.category,
    });
  }

  // 3. Crawl all Legal & Tax Categories (/category/:id)
  for (const cat of categories) {
    if (!cat.id) continue;
    registerRoute({
      path: `/category/${cat.id}`,
      lastmod: todayIso,
      changefreq: 'weekly',
      priority: '0.8',
      source: 'legal-category',
      title: `${cat.name} — Legal & Tax Category`,
      category: cat.name,
    });
  }

  // 4. Crawl all Legal, Corporate, VAT, RJSC & Tax Articles (/article/:id)
  for (const article of mockArticles) {
    if (!article.id) continue;
    const imageUrl = article.imageUrl
      ? article.imageUrl.startsWith('http')
        ? article.imageUrl
        : `${cleanOrigin}${article.imageUrl.startsWith('/') ? article.imageUrl : `/${article.imageUrl}`}`
      : undefined;

    registerRoute({
      path: `/article/${article.id}`,
      lastmod: normalizeDateIso(article.publishedAt, todayIso),
      changefreq: 'weekly',
      priority: '0.9',
      source: 'legal-tax-article',
      title: article.metaTitle || article.title,
      category: article.category,
      imageUrl,
    });
  }

  // 5. Crawl all Published Digital Shop Products (/shop/:slug)
  const productsList = options?.customProducts || SHOP_PRODUCTS;
  for (const product of productsList) {
    if (!product.slug || product.status === 'draft') continue;
    const imageUrl = product.imageUrl
      ? product.imageUrl.startsWith('http')
        ? product.imageUrl
        : `${cleanOrigin}${product.imageUrl.startsWith('/') ? product.imageUrl : `/${product.imageUrl}`}`
      : undefined;

    registerRoute({
      path: `/shop/${product.slug}`,
      lastmod: normalizeDateIso('updatedAt' in product ? product.updatedAt : undefined, todayIso),
      changefreq: 'daily',
      priority: '0.8',
      source: 'shop-product',
      title: product.title,
      category: product.category,
      imageUrl,
    });
  }

  // 6. Crawl all LMS Certification Courses (/course/:courseId)
  for (const course of INITIAL_LMS_COURSES) {
    if (!course.courseId) continue;
    registerRoute({
      path: `/course/${course.courseId}`,
      lastmod: todayIso,
      changefreq: 'weekly',
      priority: '0.8',
      source: 'lms-course',
      title: course.title,
      category: 'Training Academy',
    });
  }

  const routes = Array.from(entriesMap.values());

  const countsBySource = {
    staticRoutes: routes.filter((r) => r.source === 'react-router-static').length,
    articles: routes.filter((r) => r.source === 'legal-tax-article').length,
    categories: routes.filter((r) => r.source === 'legal-category').length,
    tools: routes.filter((r) => r.source === 'compliance-tool').length,
    products: routes.filter((r) => r.source === 'shop-product').length,
    courses: routes.filter((r) => r.source === 'lms-course').length,
  };

  const urlNodes = routes.map((route) => {
    const imageXml = route.imageUrl
      ? `\n    <image:image>\n      <image:loc>${escapeXml(route.imageUrl)}</image:loc>${
          route.title ? `\n      <image:title>${escapeXml(route.title)}</image:title>` : ''
        }\n    </image:image>`
      : '';

    return `  <url>
    <loc>${escapeXml(route.loc)}</loc>
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
    <xhtml:link rel="alternate" hreflang="en-bd" href="${escapeXml(route.loc)}" />
    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(route.loc)}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(route.loc)}" />${imageXml}
  </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlNodes.join('\n')}
</urlset>
`;

  return {
    generatedAt: new Date().toISOString(),
    origin: cleanOrigin,
    publicFilePath: '/public/sitemap.xml',
    totalUrls: routes.length,
    countsBySource,
    routes,
    xml,
  };
}
