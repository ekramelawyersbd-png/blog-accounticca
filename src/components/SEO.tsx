import React, { useMemo, useEffect } from 'react';
import { useLocation, useInRouterContext } from 'react-router-dom';
import { Article } from '../types';
import {
  generateArticleSeoMetadata,
  generateToolSeoMetadata,
  removeStaticHeadDuplicates,
} from '../services/seoMetadataService';

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface ServiceSEOConfig {
  serviceType: string;
  providerName?: string;
  providerType?: 'LegalService' | 'AccountingService' | 'ProfessionalService' | 'Organization';
  providerUrl?: string;
  areaServed?: string;
  serviceAudience?: string;
  telephone?: string;
  email?: string;
}

export type SEOPageType = 'website' | 'article' | 'service' | 'webapp' | 'course' | 'product' | 'profile';

export interface SEOProps {
  /** Page or Content Title */
  title: string;
  /** Meta Description (recommended 120-160 characters) */
  description?: string;
  /** Canonical URL or relative path (e.g. /tools or https://example.com/tools) */
  canonicalUrl?: string;
  /** Page Type: website, article, service, webapp, course, product, or profile */
  type?: SEOPageType;
  /** Featured image URL for Open Graph and Twitter Card */
  imageUrl?: string;
  /** Image Alt text */
  imageAlt?: string;
  /** Image dimensions for social cards */
  imageWidth?: number | string;
  imageHeight?: number | string;
  /** Keywords list or comma-separated string */
  keywords?: string[] | string;
  /** Prevent search engines from indexing this page */
  noindex?: boolean;
  /** Brand / Site Name override */
  siteName?: string;
  /** Automatically append siteName to title if no brand separator is present (default: true) */
  appendSiteName?: boolean;
  /** Twitter Card format (default: summary_large_image) */
  twitterCard?: 'summary' | 'summary_large_image';
  /** Twitter handle (e.g. @Accounticca) */
  twitterHandle?: string;
  /** Locale for OpenGraph (default: en_US) */
  locale?: string;
  /** Author name for article */
  authorName?: string;
  /** Author URL */
  authorUrl?: string;
  /** Publication date (ISO format) */
  publishedTime?: string;
  /** Modification date (ISO format) */
  modifiedTime?: string;
  /** Article category / section */
  section?: string;
  /** Article tags */
  tags?: string[];
  /** Service specific configuration */
  service?: ServiceSEOConfig;
  /** Application category when type === 'webapp' */
  applicationCategory?: string;
  /** Optional breadcrumbs for Schema.org BreadcrumbList */
  breadcrumbs?: BreadcrumbItem[];
  /** Custom Schema.org object or array of objects to inject */
  customSchema?: Record<string, any> | Array<Record<string, any>>;
  /** Optional override for Open Graph headline when distinct from SEO <title> */
  openGraphTitle?: string;
  /** Optional override for Open Graph social card summary */
  openGraphDescription?: string;
  /** Optional override for Twitter card headline */
  twitterTitle?: string;
  /** Optional override for Twitter card description */
  twitterDescription?: string;
  /** Optional precomputed structured data array replacing default schema builder */
  precomputedStructuredData?: Array<Record<string, any>>;
  /** Optional children for arbitrary extra meta tags */
  children?: React.ReactNode;
}

const DEFAULT_SITE_NAME = 'Compliance Hub — ACCOUNTICCA x E-Lawyers';
const DEFAULT_SHORT_BRAND = 'ACCOUNTICCA x E-Lawyers';
const DEFAULT_DESCRIPTION =
  'Legal, Tax, VAT, Accounting & Business Technology Knowledge Platform for Bangladesh by Accounticca & E-Lawyers.';
const DEFAULT_FALLBACK_IMAGE = '/logo.png';
const DEFAULT_FALLBACK_BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://blog.accounticca.com';

/**
 * Safely reads current router pathname when rendered inside a Router context
 */
function useSafePathname(): string {
  const inRouter = useInRouterContext();
  // Always call hook unconditionally per React rules; when outside router, fallback to window.location
  let routerPathname = '/';
  try {
    if (inRouter) {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const location = useLocation();
      routerPathname = location.pathname;
    } else if (typeof window !== 'undefined') {
      routerPathname = window.location.pathname;
    }
  } catch {
    if (typeof window !== 'undefined') {
      routerPathname = window.location.pathname;
    }
  }
  return routerPathname;
}

/**
 * Resolves a full canonical URL from either relative path, current route, or absolute URL
 */
export function resolveCanonicalUrl(pathOrUrl?: string, fallbackPathname?: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : DEFAULT_FALLBACK_BASE_URL;

  if (!pathOrUrl) {
    const pathname =
      fallbackPathname || (typeof window !== 'undefined' ? window.location.pathname : '/');
    const clean = pathname === '/' ? '' : pathname.replace(/\/$/, '');
    return `${base}${clean}`;
  }

  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl.replace(/\/$/, '');
  }

  const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  const normalized = cleanPath === '/' ? '' : cleanPath.replace(/\/$/, '');
  return `${base}${normalized}`;
}

/**
 * Resolves an absolute image URL
 */
export function resolveImageUrl(img?: string): string {
  if (!img) return DEFAULT_FALLBACK_IMAGE;
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  const base = typeof window !== 'undefined' ? window.location.origin : DEFAULT_FALLBACK_BASE_URL;
  return `${base}${img.startsWith('/') ? img : `/${img}`}`;
}

/**
 * Formats page title with brand name if not already branded
 */
function formatDocumentTitle(title: string, siteName: string, appendSiteName: boolean): string {
  const trimmed = title.trim();
  if (!appendSiteName) return trimmed;
  // If title already contains a brand separator or brand name, keep as is
  if (
    trimmed.includes('|') ||
    trimmed.includes('–') ||
    trimmed.includes('—') ||
    trimmed.toLowerCase().includes('accounticca') ||
    trimmed.toLowerCase().includes('e-lawyers') ||
    trimmed.toLowerCase().includes('compliance hub')
  ) {
    return trimmed;
  }
  return `${trimmed} | ${siteName === DEFAULT_SITE_NAME ? DEFAULT_SHORT_BRAND : siteName}`;
}

/**
 * Universal, Reusable SEO Metadata Component (`react-helmet-async`)
 * Drop into any page component to dynamically update:
 * - Document `<title>` & `<meta name="description">`
 * - Route-aware Canonical URLs (`<link rel="canonical" />`)
 * - Open Graph social sharing tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`)
 * - Twitter / X Card metadata (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`)
 * - Schema.org JSON-LD Structured Data (`Article`, `ProfessionalService`, `WebApplication`, `Course`, `BreadcrumbList`)
 */
export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  canonicalUrl,
  type = 'website',
  imageUrl,
  imageAlt,
  imageWidth = 1200,
  imageHeight = 630,
  keywords,
  noindex = false,
  siteName = DEFAULT_SITE_NAME,
  appendSiteName = true,
  twitterCard = 'summary_large_image',
  twitterHandle = '@Accounticca',
  locale = 'en_US',
  authorName,
  authorUrl,
  publishedTime,
  modifiedTime,
  section,
  tags,
  service,
  applicationCategory = 'BusinessApplication',
  breadcrumbs,
  customSchema,
  openGraphTitle,
  openGraphDescription,
  twitterTitle,
  twitterDescription,
  precomputedStructuredData,
  children
}: SEOProps) {
  const currentPathname = useSafePathname();

  const formattedTitle = useMemo(
    () => formatDocumentTitle(title, siteName, appendSiteName),
    [title, siteName, appendSiteName]
  );

  const fullCanonicalUrl = useMemo(
    () => resolveCanonicalUrl(canonicalUrl, currentPathname),
    [canonicalUrl, currentPathname]
  );

  const fullImageUrl = useMemo(() => resolveImageUrl(imageUrl), [imageUrl]);
  const resolvedImageAlt = imageAlt || formattedTitle;
  const resolvedOgTitle = openGraphTitle || formattedTitle;
  const resolvedOgDescription = openGraphDescription || description;
  const resolvedTwitterTitle = twitterTitle || resolvedOgTitle;
  const resolvedTwitterDescription = twitterDescription || resolvedOgDescription;

  const formattedKeywords = useMemo(() => {
    if (!keywords) return undefined;
    if (Array.isArray(keywords)) return keywords.filter(Boolean).join(', ');
    return keywords;
  }, [keywords]);

  // Generate Schema.org JSON-LD Structured Data based on page context
  const structuredDataList = useMemo(() => {
    if (precomputedStructuredData && precomputedStructuredData.length > 0) {
      return precomputedStructuredData;
    }
    const list: Record<string, any>[] = [];

    // 1. Article Schema
    if (type === 'article') {
      const articleSchema: Record<string, any> = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: title,
        description,
        image: fullImageUrl,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': fullCanonicalUrl
        },
        publisher: {
          '@type': 'Organization',
          name: siteName,
          logo: {
            '@type': 'ImageObject',
            url: resolveImageUrl('/logo.png')
          }
        }
      };

      if (publishedTime) articleSchema.datePublished = publishedTime;
      if (modifiedTime || publishedTime) articleSchema.dateModified = modifiedTime || publishedTime;

      if (authorName) {
        articleSchema.author = {
          '@type': 'Person',
          name: authorName,
          ...(authorUrl ? { url: authorUrl } : {})
        };
      }

      if (tags && tags.length > 0) {
        articleSchema.keywords = tags.join(', ');
      }

      list.push(articleSchema);
    }

    // 2. Service Schema
    if (type === 'service' || service) {
      const providerType = service?.providerType || 'ProfessionalService';
      const serviceSchema: Record<string, any> = {
        '@context': 'https://schema.org',
        '@type': providerType,
        name: service?.providerName || title,
        description,
        url: fullCanonicalUrl,
        image: fullImageUrl,
        serviceType: service?.serviceType || title,
        areaServed: {
          '@type': 'Country',
          name: service?.areaServed || 'Bangladesh'
        },
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'G-5, BTI Centara Grand, 144-144/1 Green Road',
          addressLocality: 'Dhaka',
          postalCode: '1205',
          addressCountry: 'BD'
        },
        telephone: service?.telephone || '+8801335230170',
        email: service?.email || 'info@accounticca.com'
      };

      if (service?.serviceAudience) {
        serviceSchema.audience = {
          '@type': 'Audience',
          audienceType: service.serviceAudience
        };
      }

      list.push(serviceSchema);
    }

    // 3. WebApplication Schema (for Calculators, Interactive Tools & Dashboards)
    if (type === 'webapp') {
      list.push({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: title,
        applicationCategory,
        operatingSystem: 'All',
        url: fullCanonicalUrl,
        image: fullImageUrl,
        description,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'BDT'
        },
        provider: {
          '@type': 'Organization',
          name: siteName
        }
      });
    }

    // 4. Course Schema (for LMS & Training Pages)
    if (type === 'course') {
      list.push({
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: title,
        description,
        url: fullCanonicalUrl,
        provider: {
          '@type': 'Organization',
          name: 'E-Lawyers Academy & Accounticca',
          sameAs: fullCanonicalUrl
        }
      });
    }

    // 4b. Product Schema (for Digital Shop & Packages)
    if (type === 'product') {
      list.push({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: title,
        image: fullImageUrl,
        description,
        brand: {
          '@type': 'Brand',
          name: siteName
        },
        offers: {
          '@type': 'Offer',
          url: fullCanonicalUrl,
          priceCurrency: 'BDT',
          price: '0',
          availability: 'https://schema.org/InStock'
        }
      });
    }

    // 5. Breadcrumbs Schema
    if (breadcrumbs && breadcrumbs.length > 0) {
      list.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((crumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.name,
          item: resolveCanonicalUrl(crumb.url, currentPathname)
        }))
      });
    }

    // 6. Custom Schema
    if (customSchema) {
      if (Array.isArray(customSchema)) {
        list.push(...customSchema);
      } else {
        list.push(customSchema);
      }
    }

    return list;
  }, [
    precomputedStructuredData,
    type,
    title,
    description,
    fullCanonicalUrl,
    fullImageUrl,
    siteName,
    publishedTime,
    modifiedTime,
    authorName,
    authorUrl,
    tags,
    service,
    applicationCategory,
    breadcrumbs,
    customSchema,
    currentPathname
  ]);

  const ogType =
    type === 'article'
      ? 'article'
      : type === 'product'
      ? 'product'
      : type === 'profile'
      ? 'profile'
      : 'website';

  const isPrivatePath = Boolean(
    currentPathname.startsWith('/admin') ||
    currentPathname.startsWith('/student/dashboard') ||
    currentPathname.startsWith('/checkout') ||
    currentPathname.startsWith('/cart') ||
    currentPathname.startsWith('/payment')
  );

  const shouldNoIndex = noindex || isPrivatePath;

  useEffect(() => {
    if (typeof document !== 'undefined' && formattedTitle) {
      document.title = formattedTitle;
      removeStaticHeadDuplicates();
    }
  }, [formattedTitle, fullCanonicalUrl, description, resolvedOgDescription]);

  return (
    <>
      {/* Primary Document Title & Meta Tags */}
      <title data-react-seo="true">{formattedTitle}</title>
      <meta data-react-seo="true" name="title" content={formattedTitle} />
      <meta data-react-seo="true" name="description" content={description} />
      {formattedKeywords && <meta data-react-seo="true" name="keywords" content={formattedKeywords} />}
      {authorName && <meta data-react-seo="true" name="author" content={authorName} />}
      <meta
        data-react-seo="true"
        name="robots"
        content={
          shouldNoIndex
            ? 'noindex, nofollow'
            : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
        }
      />

      {/* Dynamic Canonical Link */}
      <link data-react-seo="true" rel="canonical" href={fullCanonicalUrl} />

      {/* Open Graph / Facebook / LinkedIn / Slack / Discord */}
      <meta data-react-seo="true" property="og:type" content={ogType} />
      <meta data-react-seo="true" property="og:url" content={fullCanonicalUrl} />
      <meta data-react-seo="true" property="og:title" content={resolvedOgTitle} />
      <meta data-react-seo="true" property="og:description" content={resolvedOgDescription} />
      <meta data-react-seo="true" property="og:image" content={fullImageUrl} />
      <meta data-react-seo="true" property="og:image:alt" content={resolvedImageAlt} />
      {imageWidth && <meta data-react-seo="true" property="og:image:width" content={String(imageWidth)} />}
      {imageHeight && <meta data-react-seo="true" property="og:image:height" content={String(imageHeight)} />}
      <meta data-react-seo="true" property="og:site_name" content={siteName} />
      <meta data-react-seo="true" property="og:locale" content={locale} />

      {/* Article Specific Open Graph Tags */}
      {type === 'article' && publishedTime && (
        <meta data-react-seo="true" property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta data-react-seo="true" property="article:modified_time" content={modifiedTime} />
      )}
      {type === 'article' && authorName && (
        <meta data-react-seo="true" property="article:author" content={authorName} />
      )}
      {type === 'article' && section && (
        <meta data-react-seo="true" property="article:section" content={section} />
      )}
      {type === 'article' &&
        tags &&
        tags.map((tag) => <meta data-react-seo="true" key={tag} property="article:tag" content={tag} />)}

      {/* Twitter / X Cards */}
      <meta data-react-seo="true" name="twitter:card" content={twitterCard} />
      <meta data-react-seo="true" name="twitter:url" content={fullCanonicalUrl} />
      <meta data-react-seo="true" name="twitter:title" content={resolvedTwitterTitle} />
      <meta data-react-seo="true" name="twitter:description" content={resolvedTwitterDescription} />
      <meta data-react-seo="true" name="twitter:image" content={fullImageUrl} />
      <meta data-react-seo="true" name="twitter:image:alt" content={resolvedImageAlt} />
      {twitterHandle && <meta data-react-seo="true" name="twitter:site" content={twitterHandle} />}
      {twitterHandle && <meta data-react-seo="true" name="twitter:creator" content={twitterHandle} />}

      {/* Schema.org JSON-LD Structured Data */}
      {structuredDataList.map((data, idx) => (
        <script data-react-seo="true" key={idx} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}

      {children}
    </>
  );
}

/**
 * Alias for SEO component for semantic usage across page components
 */
export const SEOMeta = SEO;
export const PageSEO = SEO;

/**
 * Dedicated Blog Article SEO Helper Component
 */
export interface ArticleSEOProps {
  article: Article;
  canonicalUrl?: string;
  siteName?: string;
  customSchema?: Record<string, any> | Array<Record<string, any>>;
}

export function ArticleSEO({
  article,
  canonicalUrl,
  siteName,
  customSchema
}: ArticleSEOProps) {
  const generated = useMemo(
    () =>
      generateArticleSeoMetadata(article, {
        canonicalUrl,
        siteName,
        customSchema
      }),
    [article, canonicalUrl, siteName, customSchema]
  );

  return (
    <SEO
      title={generated.title}
      appendSiteName={false}
      description={generated.description}
      canonicalUrl={generated.canonicalUrl}
      type="article"
      imageUrl={generated.openGraph.image.url}
      imageAlt={generated.openGraph.image.alt}
      imageWidth={generated.openGraph.image.width}
      imageHeight={generated.openGraph.image.height}
      keywords={generated.keywords}
      authorName={generated.author}
      publishedTime={generated.openGraph.articleMeta?.publishedTime}
      modifiedTime={generated.openGraph.articleMeta?.modifiedTime}
      section={generated.openGraph.articleMeta?.section}
      tags={generated.openGraph.articleMeta?.tags}
      siteName={generated.openGraph.siteName}
      locale={generated.openGraph.locale}
      openGraphTitle={generated.openGraph.title}
      openGraphDescription={generated.openGraph.description}
      twitterTitle={generated.twitter.title}
      twitterDescription={generated.twitter.description}
      breadcrumbs={generated.breadcrumbs}
      precomputedStructuredData={generated.structuredData}
    />
  );
}

/**
 * Dedicated Service Page SEO Helper Component
 */
export interface ServiceSEOProps {
  title: string;
  description: string;
  serviceType: string;
  canonicalUrl?: string;
  imageUrl?: string;
  providerName?: string;
  providerType?: 'LegalService' | 'AccountingService' | 'ProfessionalService' | 'Organization';
  areaServed?: string;
  keywords?: string[] | string;
  noindex?: boolean;
  breadcrumbs?: BreadcrumbItem[];
  customSchema?: Record<string, any> | Array<Record<string, any>>;
}

export function ServiceSEO({
  title,
  description,
  serviceType,
  canonicalUrl,
  imageUrl,
  providerName = 'Accounticca & E-Lawyers',
  providerType = 'ProfessionalService',
  areaServed = 'Bangladesh',
  keywords,
  noindex,
  breadcrumbs,
  customSchema
}: ServiceSEOProps) {
  return (
    <SEO
      title={title}
      description={description}
      canonicalUrl={canonicalUrl}
      type="service"
      imageUrl={imageUrl}
      keywords={keywords}
      noindex={noindex}
      service={{
        serviceType,
        providerName,
        providerType,
        areaServed
      }}
      breadcrumbs={breadcrumbs}
      customSchema={customSchema}
    />
  );
}

/**
 * Dedicated Interactive Tool / Calculator SEO Helper Component (WebApplication Schema)
 */
export interface ToolSEOProps {
  toolId?: string;
  title: string;
  description?: string;
  canonicalUrl?: string;
  category?: string;
  statutoryBasis?: string;
  imageUrl?: string;
  keywords?: string[] | string;
  breadcrumbs?: BreadcrumbItem[];
  customSchema?: Record<string, any> | Array<Record<string, any>>;
}

export function ToolSEO({
  toolId,
  title,
  description,
  canonicalUrl,
  category = 'FinanceApplication',
  statutoryBasis,
  imageUrl,
  keywords,
  breadcrumbs,
  customSchema
}: ToolSEOProps) {
  const generated = useMemo(
    () =>
      generateToolSeoMetadata(
        {
          toolId,
          title,
          description,
          canonicalUrl,
          category,
          statutoryBasis,
          imageUrl,
          keywords,
          breadcrumbs,
          applicationCategory: category
        },
        { canonicalUrl, customSchema }
      ),
    [toolId, title, description, canonicalUrl, category, statutoryBasis, imageUrl, keywords, breadcrumbs, customSchema]
  );

  return (
    <SEO
      title={generated.title}
      appendSiteName={false}
      description={generated.description}
      canonicalUrl={generated.canonicalUrl}
      type="webapp"
      applicationCategory={category}
      imageUrl={generated.openGraph.image.url}
      imageAlt={generated.openGraph.image.alt}
      keywords={generated.keywords}
      siteName={generated.openGraph.siteName}
      locale={generated.openGraph.locale}
      openGraphTitle={generated.openGraph.title}
      openGraphDescription={generated.openGraph.description}
      twitterTitle={generated.twitter.title}
      twitterDescription={generated.twitter.description}
      breadcrumbs={generated.breadcrumbs}
      precomputedStructuredData={generated.structuredData}
    />
  );
}

/**
 * Dedicated Course / LMS SEO Helper Component (Course Schema)
 */
export interface CourseSEOProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  imageUrl?: string;
  keywords?: string[] | string;
  breadcrumbs?: BreadcrumbItem[];
  customSchema?: Record<string, any> | Array<Record<string, any>>;
}

export function CourseSEO({
  title,
  description,
  canonicalUrl,
  imageUrl,
  keywords,
  breadcrumbs,
  customSchema
}: CourseSEOProps) {
  return (
    <SEO
      title={title}
      description={description}
      canonicalUrl={canonicalUrl}
      type="course"
      imageUrl={imageUrl}
      keywords={keywords}
      breadcrumbs={breadcrumbs}
      customSchema={customSchema}
    />
  );
}

export default SEO;
