/**
 * Comprehensive SEO, Social Graph, IndexNow, and Generative Engine Optimization (GEO) Config
 * Supports dynamic host resolution on both Client (window.location.origin) and Server (req host).
 */

export type SchemaOrgType = 
  | 'LegalService' 
  | 'AccountingService' 
  | 'WebSite' 
  | 'WebApplication' 
  | 'Article' 
  | 'Product' 
  | 'Course' 
  | 'FAQPage' 
  | 'Organization'
  | 'BreadcrumbList';

export interface RouteSeoEntry {
  path: string;
  title: string;
  description: string;
  keywords: string[];
  ogImage: string;
  schemaType: SchemaOrgType;
  priority: number; // 0.1 to 1.0
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  noindex?: boolean;
  isCustom?: boolean;
  lastmod?: string;
}

export interface SeoConfig {
  siteName: string;
  titleSuffix: string;
  defaultDescription: string;
  defaultKeywords: string[];
  defaultOgImage: string;
  brandLogo: string;
  locale: string;
  twitterHandle: string;
  twitterCard: 'summary' | 'summary_large_image';
  telephone: string;
  email: string;
  streetAddress: string;
  addressLocality: string;
  postalCode: string;
  addressCountry: string;
  sameAs: string[];
  googleSiteVerification: string;
  bingSiteVerification: string;
  facebookDomainVerification: string;
  indexNowApiKey: string;
  aiSearchSummary: string;
  enableIndexNowAutoPing: boolean;
  routes: Record<string, RouteSeoEntry>;
  updatedAt: string;
}

export interface IndexNowLogEntry {
  id: string;
  timestamp: string;
  host: string;
  key: string;
  urlList: string[];
  statusCode: number;
  statusText: string;
  engine: string;
}

export const DEFAULT_INDEXNOW_KEY = 'accounticca_seo_indexnow_2026';

export const DEFAULT_SEO_CONFIG: SeoConfig = {
  siteName: 'Compliance Hub — ACCOUNTICCA x E-Lawyers',
  titleSuffix: ' | ACCOUNTICCA x E-Lawyers',
  defaultDescription: 'Bangladesh premier platform for Corporate Law, Income Tax, VAT compliance, RJSC Company Registration, Statutory Audit, and Digital Legal Templates. Powered by Supreme Court Advocates and Chartered Accountants.',
  defaultKeywords: [
    'Corporate Law Bangladesh',
    'Income Tax Bangladesh',
    'Tax Return 2026-27',
    'VAT Compliance Bangladesh',
    'RJSC Registration Dhaka',
    'Company Formation Bangladesh',
    'BIDA Permission',
    'WPPF Calculator',
    'TDS Rates Bangladesh',
    'Supreme Court Advocate Dhaka',
    'Accounting Advisory Dhaka'
  ],
  defaultOgImage: '/logo.png',
  brandLogo: '/logo.png',
  locale: 'en_BD',
  twitterHandle: '@Accounticca',
  twitterCard: 'summary_large_image',
  telephone: '+8801335230170',
  email: 'info@elawyersbd.com',
  streetAddress: 'Suite G-5, BTI Centara Grand, 144–144/1 Green Road, Panthapath',
  addressLocality: 'Dhaka',
  postalCode: '1205',
  addressCountry: 'BD',
  sameAs: [
    'https://linkedin.com/company/accounticca',
    'https://facebook.com/accounticca',
    'https://youtube.com/@accounticca'
  ],
  googleSiteVerification: '',
  bingSiteVerification: '',
  facebookDomainVerification: '',
  indexNowApiKey: DEFAULT_INDEXNOW_KEY,
  aiSearchSummary: 'ACCOUNTICCA x E-Lawyers Compliance Hub is the authoritative legal, tax, VAT, and business technology knowledge platform and service bureau in Bangladesh. It provides automated income tax calculators, VAT guides, corporate compliance advisory, digital legal contracts, and LMS certification courses.',
  enableIndexNowAutoPing: true,
  updatedAt: new Date().toISOString(),
  routes: {
    '/': {
      path: '/',
      title: 'Compliance Hub — Legal, Tax, VAT & Business Compliance Bangladesh',
      description: 'Corporate Law, Income Tax return calculations, VAT compliance, RJSC company formation, and professional legal advisory in Bangladesh. Powered by Accounticca & E-Lawyers.',
      keywords: ['Corporate Law Bangladesh', 'Income Tax Dhaka', 'VAT Compliance', 'RJSC Registration', 'E-Lawyers BD', 'Accounticca'],
      ogImage: '/logo.png',
      schemaType: 'LegalService',
      priority: 1.0,
      changefreq: 'daily'
    },
    '/calculators': {
      path: '/calculators',
      title: 'Tax & Compliance Calculators Bangladesh 2026-27',
      description: 'Interactive Bangladesh Income Tax Calculator, Wealth Surcharge, Investment Tax Rebate, WPPF, TDS, and Corporate Tax Slabs calculators conforming to Finance Act 2024–2026.',
      keywords: ['Tax Calculator Bangladesh', 'Income Tax Calculator 2026-27', 'Wealth Surcharge Calculator', 'TDS Rate Calculator BD', 'Investment Rebate BD'],
      ogImage: '/logo.png',
      schemaType: 'WebApplication',
      priority: 0.9,
      changefreq: 'weekly'
    },
    '/services': {
      path: '/services',
      title: 'Corporate Legal & Tax Advisory Services — Dhaka, Bangladesh',
      description: 'Comprehensive business legal solutions: RJSC Company Incorporation, Foreign Investment (BIDA) approvals, Corporate Tax filings, VAT audits, and litigation representation.',
      keywords: ['Legal Advisory Dhaka', 'Company Registration Bangladesh', 'Tax Consultant Dhaka', 'VAT Audit BD', 'Foreign Investment BIDA'],
      ogImage: '/logo.png',
      schemaType: 'LegalService',
      priority: 0.9,
      changefreq: 'weekly'
    },
    '/insights': {
      path: '/insights',
      title: 'Compliance Insights & Legal Articles — E-Lawyers & Accounticca',
      description: 'Expert statutory analyses, regulatory notifications, National Board of Revenue (NBR) circular breakdowns, and court precedents on Bangladesh business laws.',
      keywords: ['Tax Articles Bangladesh', 'NBR SRO Circulars', 'Company Law Insights Dhaka', 'VAT Statutory Precedents', 'Legal Compliance Updates BD'],
      ogImage: '/logo.png',
      schemaType: 'Article',
      priority: 0.8,
      changefreq: 'daily'
    },
    '/courses': {
      path: '/courses',
      title: 'Corporate Tax & Compliance Academy — Online LMS Certification',
      description: 'Master practical Income Tax Return filing, VAT compliance, RJSC corporate governance, and statutory audit readiness with video modules, quizzes, and verified certificates.',
      keywords: ['Tax Course Bangladesh', 'Income Tax Training Dhaka', 'VAT Certification BD', 'Corporate Compliance Course', 'Accounticca LMS'],
      ogImage: '/logo.png',
      schemaType: 'Course',
      priority: 0.8,
      changefreq: 'weekly'
    },
    '/booking': {
      path: '/booking',
      title: 'Schedule Legal & Tax Consultation — Online Appointment Booking',
      description: 'Book a 1-on-1 virtual or in-person consultation with Supreme Court Advocates and Chartered Accountants for corporate law, tax disputes, and company registration.',
      keywords: ['Book Lawyer Dhaka', 'Tax Consultation Bangladesh', 'Legal Appointment Dhaka', 'E-Lawyers Consultation'],
      ogImage: '/logo.png',
      schemaType: 'LegalService',
      priority: 0.8,
      changefreq: 'weekly'
    },
    '/tools/rjsc-fee-calculator': {
      path: '/tools/rjsc-fee-calculator',
      title: 'RJSC Company Registration Fee Calculator Bangladesh',
      description: 'Calculate official government registration fees, name clearance fees, stamp duty, and certified copy charges for private limited companies at RJSC Bangladesh.',
      keywords: ['RJSC Fee Calculator', 'Company Registration Cost Bangladesh', 'Stamp Duty BD', 'RJSC Name Clearance Fee'],
      ogImage: '/logo.png',
      schemaType: 'WebApplication',
      priority: 0.8,
      changefreq: 'monthly'
    },
    '/tools/tax-slabs-explorer': {
      path: '/tools/tax-slabs-explorer',
      title: 'Individual & Corporate Tax Slabs Explorer 2026-27',
      description: 'Detailed analysis of current individual tax exemption limits, progressive tax brackets, female/senior citizen benefits, and listed vs non-listed corporate tax rates in Bangladesh.',
      keywords: ['Tax Slabs Bangladesh 2026', 'Income Tax Brackets BD', 'Corporate Tax Rates Dhaka', 'Zero Tax Threshold BD'],
      ogImage: '/logo.png',
      schemaType: 'WebApplication',
      priority: 0.8,
      changefreq: 'monthly'
    },
    '/tools/wealth-surcharge': {
      path: '/tools/wealth-surcharge',
      title: 'Wealth Surcharge (Asset Tax) Calculator Bangladesh',
      description: 'Compute progressive net wealth surcharges on individual assets exceeding 4 Crore BDT, including multi-motor vehicle and house property surcharges.',
      keywords: ['Wealth Surcharge Calculator Bangladesh', 'Asset Surcharge BD', 'Net Wealth Tax Dhaka', 'NBR Surcharge Slabs'],
      ogImage: '/logo.png',
      schemaType: 'WebApplication',
      priority: 0.7,
      changefreq: 'monthly'
    },
    '/tools/investment-rebate': {
      path: '/tools/investment-rebate',
      title: 'Investment Tax Rebate Calculator — Income Tax Act 2023',
      description: 'Calculate allowable investment rebate under Sixth Schedule (DPS, life insurance, stocks, treasury bonds, Zakat fund) to minimize your income tax liability.',
      keywords: ['Investment Tax Rebate Calculator', 'DPS Tax Rebate Bangladesh', 'Tax Credit BD', 'Sixth Schedule Rebate Calculator'],
      ogImage: '/logo.png',
      schemaType: 'WebApplication',
      priority: 0.7,
      changefreq: 'monthly'
    },
    '/training': {
      path: '/training',
      title: 'Corporate Training Hub & Practical Tax Workshops',
      description: 'Executive training sessions for corporate accountants, legal counsels, and entrepreneurs on Bangladesh tax disputes, transfer pricing, and VAT returns.',
      keywords: ['Tax Training Dhaka', 'VAT Training BD', 'Corporate Law Workshops', 'Professional Tax Academy'],
      ogImage: '/logo.png',
      schemaType: 'Course',
      priority: 0.7,
      changefreq: 'monthly'
    },
    '/about': {
      path: '/about',
      title: 'About ACCOUNTICCA & E-Lawyers — Bangladesh Legal & Tax Firm',
      description: 'Learn about our multidisciplinary practice uniting Supreme Court of Bangladesh advocates, tax counsels, chartered accountants, and legal tech innovators.',
      keywords: ['About E-Lawyers', 'About Accounticca', 'Advocate Ekram Hossain', 'Law Firm Dhaka', 'Tax Attorneys BD'],
      ogImage: '/logo.png',
      schemaType: 'Organization',
      priority: 0.7,
      changefreq: 'monthly'
    },
    '/contact': {
      path: '/contact',
      title: 'Contact E-Lawyers & Accounticca — Panthapath, Dhaka Office',
      description: 'Reach our legal advisory office at BTI Centara Grand, Panthapath, Dhaka. Telephone: +8801335230170. Email: info@elawyersbd.com.',
      keywords: ['Contact E-Lawyers', 'Law Firm Address Dhaka', 'Tax Consultant Phone Number', 'Accounticca Office'],
      ogImage: '/logo.png',
      schemaType: 'LegalService',
      priority: 0.7,
      changefreq: 'monthly'
    },
    '/faq': {
      path: '/faq',
      title: 'Frequently Asked Questions (FAQ) — Bangladesh Law & Tax',
      description: 'Verified answers to common legal and tax questions: Company registration steps, TIN registration, VAT return deadlines, wealth statements, and trademark filing.',
      keywords: ['Bangladesh Tax FAQ', 'Company Registration FAQ BD', 'VAT Return Questions', 'Legal FAQ Dhaka'],
      ogImage: '/logo.png',
      schemaType: 'FAQPage',
      priority: 0.7,
      changefreq: 'weekly'
    },
    '/privacy': {
      path: '/privacy',
      title: 'Privacy Policy — Client Confidentiality & Data Security',
      description: 'Our commitment to protecting client tax documents, corporate agreements, personal information, and encrypted payment details.',
      keywords: ['Privacy Policy Accounticca', 'Data Protection Legal BD', 'Confidentiality Agreement'],
      ogImage: '/logo.png',
      schemaType: 'WebSite',
      priority: 0.3,
      changefreq: 'yearly'
    },
    '/terms': {
      path: '/terms',
      title: 'Terms & Conditions of Service — ACCOUNTICCA x E-Lawyers',
      description: 'Terms governing digital downloads, consultation booking, corporate retainer representation, and online LMS training courses.',
      keywords: ['Terms of Service E-Lawyers', 'Legal Disclaimer Bangladesh', 'Retainer Agreement Terms'],
      ogImage: '/logo.png',
      schemaType: 'WebSite',
      priority: 0.3,
      changefreq: 'yearly'
    }
  }
};

/**
 * Resolves a dynamic canonical origin based on browser environment or fallback.
 */
export function getClientOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'https://accounticca.ai.studio';
}

/**
 * Resolves a full URL given an origin and path.
 */
export function resolveUrl(origin: string, pathOrUrl?: string): string {
  if (!pathOrUrl) return origin;
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${origin.replace(/\/$/, '')}${cleanPath}`;
}

export interface DynamicSitemapContent {
  articles?: Array<{ id: string; title?: string; publishedAt?: string; updatedAt?: string; [key: string]: any }>;
  categories?: Array<{ id: string; name?: string; [key: string]: any }>;
  tools?: Array<{ id: string; name?: string; path?: string; [key: string]: any }>;
  products?: Array<{ id?: string; title?: string; slug: string; updatedAt?: string; [key: string]: any }>;
  courses?: Array<{ id: string; title?: string; updatedAt?: string; [key: string]: any }>;
}

/**
 * Generates dynamic XML Sitemap (sitemap.xml) for all published articles, tools, courses, and products
 */
export function generateXmlSitemap(
  origin: string,
  config: SeoConfig,
  dynamicContent?: DynamicSitemapContent
): string {
  const cleanOrigin = origin.replace(/\/$/, '');
  const nowIso = new Date().toISOString().split('T')[0];

  const seenUrls = new Set<string>();
  const urlElements: string[] = [];

  const addUrl = (loc: string, lastmod: string, changefreq: string, priority: string) => {
    if (seenUrls.has(loc)) return;
    seenUrls.add(loc);

    urlElements.push(`  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
    <xhtml:link rel="alternate" hreflang="en-bd" href="${escapeXml(loc)}" />
    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(loc)}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(loc)}" />
  </url>`);
  };

  // 1. Core static & admin-configured public routes
  Object.values(config.routes).forEach((route) => {
    if (route.noindex) return;
    const loc = `${cleanOrigin}${route.path === '/' ? '' : route.path}`;
    const lastmod = route.lastmod || nowIso;
    const changefreq = route.changefreq || 'weekly';
    const priority = (route.priority ?? 0.7).toFixed(1);
    addUrl(loc, lastmod, changefreq, priority);
  });

  // 2. All Published Articles (e.g. /article/:id)
  if (dynamicContent?.articles && dynamicContent.articles.length > 0) {
    dynamicContent.articles.forEach((art) => {
      if (!art.id) return;
      const loc = `${cleanOrigin}/article/${art.id}`;
      const lastmod = art.updatedAt ? art.updatedAt.split('T')[0] : (art.publishedAt ? art.publishedAt.split('T')[0] : nowIso);
      addUrl(loc, lastmod, 'weekly', '0.8');
    });
  }

  // 3. All Published Categories (e.g. /category/:id)
  if (dynamicContent?.categories && dynamicContent.categories.length > 0) {
    dynamicContent.categories.forEach((cat) => {
      if (!cat.id) return;
      const loc = `${cleanOrigin}/category/${cat.id}`;
      addUrl(loc, nowIso, 'weekly', '0.7');
    });
  }

  // 4. All Interactive Compliance & Tax Tools (e.g. /tools/*, /calculators/*)
  if (dynamicContent?.tools && dynamicContent.tools.length > 0) {
    dynamicContent.tools.forEach((tool) => {
      if (!tool.path) return;
      const normalizedPath = tool.path.startsWith('/') ? tool.path : `/${tool.path}`;
      const loc = `${cleanOrigin}${normalizedPath}`;
      addUrl(loc, nowIso, 'weekly', '0.8');
    });
  }

  // 5. All Published Digital Shop Products (e.g. /shop/:slug)
  if (dynamicContent?.products && dynamicContent.products.length > 0) {
    dynamicContent.products.forEach((prod) => {
      if (!prod.slug) return;
      const loc = `${cleanOrigin}/shop/${prod.slug}`;
      const lastmod = prod.updatedAt ? prod.updatedAt.split('T')[0] : nowIso;
      addUrl(loc, lastmod, 'daily', '0.8');
    });
  }

  // 6. All Published LMS Courses (e.g. /courses/:id, /courses/:courseId)
  if (dynamicContent?.courses && dynamicContent.courses.length > 0) {
    dynamicContent.courses.forEach((course) => {
      const cId = course.courseId || course.id || course.slug;
      if (!cId) return;
      const loc = `${cleanOrigin}/courses/${cId}`;
      const lastmod = course.updatedAt ? course.updatedAt.split('T')[0] : nowIso;
      addUrl(loc, lastmod, 'weekly', '0.8');
      
      // Also register /course/:id for LMS direct access
      addUrl(`${cleanOrigin}/course/${cId}`, lastmod, 'weekly', '0.7');
    });
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlElements.join('\n')}
</urlset>`;
}

/**
 * Generates dynamic robots.txt file blocking internal paths while allowing full public resource indexing
 */
export function generateRobotsTxt(origin: string, config: SeoConfig): string {
  const cleanOrigin = origin.replace(/\/$/, '');
  return `# Dynamic robots.txt for ACCOUNTICCA x E-Lawyers Compliance Hub
# Dynamically served for host: ${cleanOrigin}

# -------------------------------------------------------------
# Default Crawler Policy
# -------------------------------------------------------------
User-agent: *
# Allowed Public Resources (Full indexing allowed)
Allow: /
Allow: /article/
Allow: /category/
Allow: /shop/
Allow: /tools/
Allow: /calculators
Allow: /services
Allow: /courses
Allow: /booking
Allow: /training
Allow: /glossary
Allow: /community
Allow: /faq
Allow: /verify-certificate
Allow: /about
Allow: /contact
Allow: /privacy
Allow: /terms
Allow: /sitemap.xml
Allow: /robots.txt
Allow: /llms.txt
Allow: /llms-full.txt
Allow: /logo.png
Allow: /favicon.ico
Allow: /assets/

# Blocked Internal & Administrative Paths
Disallow: /admin/
Disallow: /api/
Disallow: /student/
Disallow: /checkout
Disallow: /cart
Disallow: /payment/
Disallow: /gateway/
Disallow: /auth
Disallow: /data/
Disallow: /*?*sort=
Disallow: /*?*filter=
Disallow: /*.json$

# -------------------------------------------------------------
# Googlebot & Major Search Engines
# -------------------------------------------------------------
User-agent: Googlebot
Allow: /
Allow: /article/
Allow: /category/
Allow: /shop/
Allow: /tools/
Allow: /courses
Allow: /calculators
Allow: /services
Disallow: /admin/
Disallow: /api/
Disallow: /student/
Disallow: /checkout
Disallow: /cart
Disallow: /payment/

User-agent: Googlebot-Image
Allow: /logo.png
Allow: /assets/
Allow: /pwa-*.png

User-agent: Bingbot
Allow: /
Allow: /article/
Allow: /category/
Allow: /shop/
Allow: /tools/
Allow: /courses
Disallow: /admin/
Disallow: /api/
Disallow: /student/
Disallow: /checkout
Disallow: /cart

User-agent: DuckDuckBot
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /student/

User-agent: YandexBot
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /student/

User-agent: Baiduspider
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /student/

# -------------------------------------------------------------
# Generative AI & Knowledge Engine Retrieval Bots
# -------------------------------------------------------------
User-agent: GPTBot
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /student/
Disallow: /checkout

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: meta-externalagent
Allow: /

User-agent: Applebot-Extended
Allow: /

# -------------------------------------------------------------
# Host and Dynamic Sitemap Declarations
# -------------------------------------------------------------
Host: ${cleanOrigin}
Sitemap: ${cleanOrigin}/sitemap.xml
`;
}

/**
 * Generates dynamic llms.txt standard file for AI search engines (ChatGPT Search, Perplexity, Claude, Google AI Overviews)
 */
export function generateLlmsTxt(
  origin: string,
  config: SeoConfig,
  dynamicContent?: {
    products?: Array<{ title: string; slug: string; price: number; category: string }>;
    courses?: Array<{ title: string; id: string; description?: string }>;
  }
): string {
  const cleanOrigin = origin.replace(/\/$/, '');

  const productsMarkdown = dynamicContent?.products && dynamicContent.products.length > 0
    ? dynamicContent.products
        .map((p) => `- [${p.title}](${cleanOrigin}/shop/${p.slug}): ${p.category} (BDT ${p.price})`)
        .join('\n')
    : `- [Income Tax Return Kit 2026-27](${cleanOrigin}/shop/tax-return-kit-2026): Complete filing templates & checklist (BDT 1,500)
- [Non-Disclosure Agreement (NDA)](${cleanOrigin}/shop/non-disclosure-agreement-nda): Bilingual mutual NDA under Bangladesh Contract Act (BDT 1,200)
- [Shareholders Agreement](${cleanOrigin}/shop/shareholders-agreement): Corporate governance and equity agreement (BDT 2,500)
- [Employment Contract Kit](${cleanOrigin}/shop/employment-contract-kit): Bangladesh Labour Act 2006 compliant (BDT 1,200)`;

  const coursesMarkdown = dynamicContent?.courses && dynamicContent.courses.length > 0
    ? dynamicContent.courses
        .map((c) => `- [${c.title}](${cleanOrigin}/courses/${c.id}): Practical certified online workshop`)
        .join('\n')
    : `- [Personal Income Tax Return Masterclass](${cleanOrigin}/courses/tax-masterclass-2026): Practical return filing under Income Tax Act 2023 with certificate.`;

  return `# ${config.siteName}

> ${config.aiSearchSummary}

The platform operates in Dhaka, Bangladesh, uniting Supreme Court Advocates and Chartered Accountants to deliver statutory corporate compliance, tax filing tools, legal document templates, and online certification.

## Interactive Tools & Calculators
- [Income Tax Calculator 2026-27](${cleanOrigin}/calculators): Automated tax computation under Finance Act 2024–2026 for individuals, female taxpayers, and corporations.
- [RJSC Fee Calculator](${cleanOrigin}/tools/rjsc-fee-calculator): Accurate government incorporation and statutory return filing fees.
- [Wealth Surcharge Calculator](${cleanOrigin}/tools/wealth-surcharge): Asset tax calculator for high-net-worth individuals in Bangladesh.
- [Investment Tax Rebate Calculator](${cleanOrigin}/tools/investment-rebate): Maximize allowable tax credits under the Sixth Schedule.
- [Corporate Tax Slabs](${cleanOrigin}/tools/tax-slabs-explorer): Complete reference for listed, non-listed, and OPC corporate tax rates.

## Core Legal & Corporate Services
- [Corporate Law & Advisory](${cleanOrigin}/services): RJSC company registration, joint ventures, foreign investment (BIDA) approvals, and statutory litigation.
- [Tax & VAT Compliance](${cleanOrigin}/services): Assessment appeals, TDS compliance, VAT audit representation, and transfer pricing.
- [Schedule Consultation](${cleanOrigin}/booking): Book virtual or in-person advisory sessions with Supreme Court Advocates.

## Vetted Legal Templates & Shop
${productsMarkdown}

## Training & LMS Certification
${coursesMarkdown}

## Contact & Location
- Address: ${config.streetAddress}, ${config.addressLocality} ${config.postalCode}, ${config.addressCountry}
- Telephone: ${config.telephone}
- Email: ${config.email}
- Full Index: ${cleanOrigin}/sitemap.xml
`;
}

/**
 * Escapes XML entities
 */
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
