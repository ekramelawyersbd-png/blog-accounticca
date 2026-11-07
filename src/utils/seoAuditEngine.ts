export type AuditSeverity = 'passed' | 'warning' | 'failed';
export type AuditCategory = 'meta' | 'social' | 'schema' | 'headers' | 'technical';

export interface AuditItem {
  id: string;
  category: AuditCategory;
  title: string;
  severity: AuditSeverity;
  score: number; // 0 to 10
  foundValue: string;
  expectedValue: string;
  metric?: string;
  googleStandard: string;
  explanation: string;
  recommendation: string;
  codeSnippet?: string;
}

export interface HeaderNode {
  level: number;
  tag: string;
  text: string;
  length: number;
}

export interface SchemaNode {
  type: string;
  id?: string;
  name?: string;
  valid: boolean;
  rawJson: Record<string, unknown>;
  warnings: string[];
}

export interface SeoAuditReport {
  timestamp: string;
  sourceType: 'index.html' | 'rendered-dom' | 'custom-markup';
  url: string;
  overallScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  categoryScores: {
    meta: number;
    social: number;
    schema: number;
    headers: number;
    technical: number;
  };
  stats: {
    total: number;
    passed: number;
    warning: number;
    failed: number;
  };
  items: AuditItem[];
  metaData: {
    title: string;
    description: string;
    canonical: string;
    robots: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    ogType: string;
    ogSiteName: string;
    twitterCard: string;
    twitterTitle: string;
    twitterDescription: string;
    twitterImage: string;
    viewport: string;
    themeColor: string;
    lang: string;
  };
  headers: HeaderNode[];
  schemas: SchemaNode[];
  rawHtmlSnippet: string;
}

/**
 * Parses raw HTML string or live document into a complete SEO audit report
 * in compliance with Google's latest SEO and Rich Results standards.
 */
export function analyzeHtmlForSeo(
  htmlContent: string,
  sourceType: 'index.html' | 'rendered-dom' | 'custom-markup' = 'index.html',
  pageUrl: string = 'https://blog.accounticca.com/'
): SeoAuditReport {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  const items: AuditItem[] = [];

  // 1. Title Analysis
  const titleEl = doc.querySelector('title');
  const titleText = titleEl?.textContent?.trim() || '';
  const titleLen = titleText.length;

  if (!titleText) {
    items.push({
      id: 'title-presence',
      category: 'meta',
      title: 'Page Title (<title>) Presence',
      severity: 'failed',
      score: 0,
      foundValue: 'Missing <title> tag',
      expectedValue: 'Descriptive title between 30 and 60 characters',
      googleStandard: 'Google uses the <title> tag as the primary headline in search engine result pages (SERPs).',
      explanation: 'Without a title tag, search engines cannot determine the page topic, severely hurting rankings and click-through rates.',
      recommendation: 'Add a concise, branded <title> inside the <head> element.',
      codeSnippet: '<title>Compliance Hub – Legal, Tax & Corporate Advisory Bangladesh</title>'
    });
  } else if (titleLen < 30) {
    items.push({
      id: 'title-length',
      category: 'meta',
      title: 'Page Title Length',
      severity: 'warning',
      score: 5,
      metric: `${titleLen} characters (Suboptimal)`,
      foundValue: `"${titleText}" (${titleLen} chars)`,
      expectedValue: '30 to 60 characters for optimal SERP display',
      googleStandard: 'Google displays the first 50–60 characters of a title tag. Titles under 30 characters underutilize ranking keywords.',
      explanation: 'Your title is too short to fully communicate value or capture secondary long-tail keywords in Google Search.',
      recommendation: 'Expand the title to 30–60 characters by adding your primary brand name or core service keywords.',
      codeSnippet: `<title>${titleText} – Compliance Hub Bangladesh</title>`
    });
  } else if (titleLen > 60) {
    items.push({
      id: 'title-length',
      category: 'meta',
      title: 'Page Title Length & Truncation Risk',
      severity: 'warning',
      score: 6.5,
      metric: `${titleLen} characters (Truncation Risk)`,
      foundValue: `"${titleText}" (${titleLen} chars)`,
      expectedValue: '30 to 60 characters (Max ~580 pixels)',
      googleStandard: 'Google typically truncates titles exceeding 60 characters (or ~580px width) in SERPs with an ellipsis (...).',
      explanation: `At ${titleLen} characters, Google search results will truncate your title, cutting off words after character ~58-60.`,
      recommendation: 'Front-load your most important primary keywords and keep the full title between 30 and 60 characters.',
      codeSnippet: `<title>Compliance Hub – Legal, Tax & VAT Advisory Bangladesh</title>`
    });
  } else {
    items.push({
      id: 'title-length',
      category: 'meta',
      title: 'Page Title (<title>) Length & Formatting',
      severity: 'passed',
      score: 10,
      metric: `${titleLen} characters (Optimal)`,
      foundValue: `"${titleText}" (${titleLen} chars)`,
      expectedValue: '30 to 60 characters',
      googleStandard: 'Google displays full titles within 30–60 characters cleanly across desktop and mobile SERPs.',
      explanation: 'Title length is well-balanced for search snippets with zero pixel overflow risk.',
      recommendation: 'Keep current title. Ensure high-intent focus keywords remain prominent.',
      codeSnippet: `<title>${titleText}</title>`
    });
  }

  // 2. Meta Description Analysis
  const descEl = doc.querySelector('meta[name="description"]');
  const descText = descEl?.getAttribute('content')?.trim() || '';
  const descLen = descText.length;

  if (!descText) {
    items.push({
      id: 'desc-presence',
      category: 'meta',
      title: 'Meta Description Presence',
      severity: 'failed',
      score: 0,
      foundValue: 'Missing <meta name="description">',
      expectedValue: 'Compelling 120 to 160 character summary with call to action',
      googleStandard: 'Meta descriptions serve as the snippet text in Google SERPs and directly dictate click-through rates (CTR).',
      explanation: 'When missing, Google will attempt to generate an automatic snippet from on-page text, which is often messy or irrelevant.',
      recommendation: 'Add a 120–160 character description summarizing core value proposition with an action verb.',
      codeSnippet: '<meta name="description" content="Your trusted platform for Corporate Law, Income Tax, VAT, RJSC Company Registration, Statutory Audit, and Business Compliance in Bangladesh." />'
    });
  } else if (descLen < 120) {
    items.push({
      id: 'desc-length',
      category: 'meta',
      title: 'Meta Description Length',
      severity: 'warning',
      score: 6,
      metric: `${descLen} characters (Too Short)`,
      foundValue: `"${descText}" (${descLen} chars)`,
      expectedValue: '120 to 160 characters for complete search snippet coverage',
      googleStandard: 'Descriptions under 120 characters underutilize available SERP real estate.',
      explanation: 'Your description is shorter than the optimal 120–160 character window, leaving potential SERP visibility unused.',
      recommendation: 'Elaborate on unique benefits or include a direct call to action (e.g., "Explore guidelines, calculate liabilities, and register today.").',
      codeSnippet: `<meta name="description" content="${descText} Explore calculators, guides, and corporate services today." />`
    });
  } else if (descLen > 165) {
    items.push({
      id: 'desc-length',
      category: 'meta',
      title: 'Meta Description Truncation Risk',
      severity: 'warning',
      score: 7,
      metric: `${descLen} characters (Truncation Risk)`,
      foundValue: `"${descText}" (${descLen} chars)`,
      expectedValue: '120 to 160 characters (Max ~960px desktop / 680px mobile)',
      googleStandard: 'Google cuts off descriptions longer than ~160 characters with an ellipsis (...).',
      explanation: `At ${descLen} characters, trailing phrases will get cut off in mobile and desktop snippets.`,
      recommendation: 'Tighten wording to ~145–155 characters so the complete thought and call-to-action remain visible.',
      codeSnippet: `<meta name="description" content="${descText.slice(0, 150)}..." />`
    });
  } else {
    items.push({
      id: 'desc-length',
      category: 'meta',
      title: 'Meta Description Length & CTR Optimization',
      severity: 'passed',
      score: 10,
      metric: `${descLen} characters (Optimal)`,
      foundValue: `"${descText}" (${descLen} chars)`,
      expectedValue: '120 to 160 characters',
      googleStandard: 'Descriptions between 120–160 characters fit completely inside Google SERP snippets.',
      explanation: 'Ideal length with high likelihood of full SERP snippet delivery without truncation.',
      recommendation: 'Maintain description. Keep value proposition sharp.',
      codeSnippet: `<meta name="description" content="${descText}" />`
    });
  }

  // 3. Canonical Tag Analysis
  const canonicalEl = doc.querySelector('link[rel="canonical"]');
  const canonicalHref = canonicalEl?.getAttribute('href')?.trim() || '';

  if (!canonicalHref) {
    items.push({
      id: 'canonical-tag',
      category: 'meta',
      title: 'Canonical URL (<link rel="canonical">)',
      severity: 'warning',
      score: 4,
      foundValue: 'Missing rel="canonical" link',
      expectedValue: `Canonical tag pointing to absolute URL (e.g., ${pageUrl})`,
      googleStandard: 'Canonical tags prevent duplicate content penalties from URL query parameters, tracking tags, and protocol differences.',
      explanation: 'Search crawlers may index duplicate versions of pages (http vs https, trailing slashes, or query parameters).',
      recommendation: 'Specify the self-referencing absolute canonical URL in <head>.',
      codeSnippet: `<link rel="canonical" href="${pageUrl}" />`
    });
  } else if (!canonicalHref.startsWith('http://') && !canonicalHref.startsWith('https://')) {
    items.push({
      id: 'canonical-tag',
      category: 'meta',
      title: 'Canonical URL Absolute Formatting',
      severity: 'warning',
      score: 6,
      foundValue: canonicalHref,
      expectedValue: 'Must be an absolute URL starting with https://',
      googleStandard: 'Google explicitly recommends absolute URLs rather than relative paths in canonical tags.',
      explanation: 'Relative URLs can be misinterpreted if pages are mirrored or served under staging domains.',
      recommendation: 'Change relative canonical URL to an absolute https:// URL.',
      codeSnippet: `<link rel="canonical" href="${pageUrl}" />`
    });
  } else {
    items.push({
      id: 'canonical-tag',
      category: 'meta',
      title: 'Canonical URL (<link rel="canonical">)',
      severity: 'passed',
      score: 10,
      foundValue: canonicalHref,
      expectedValue: 'Absolute canonical URL present',
      googleStandard: 'Google uses rel="canonical" as the definitive signal for preferred URL consolidation.',
      explanation: 'Proper canonical tag protects against duplicate content penalties.',
      recommendation: 'Keep canonical tag synchronized across all dynamic routes.',
      codeSnippet: `<link rel="canonical" href="${canonicalHref}" />`
    });
  }

  // 4. Robots Directives & AI Crawler Directives
  const robotsEl = doc.querySelector('meta[name="robots"]');
  const robotsContent = robotsEl?.getAttribute('content')?.toLowerCase() || '';

  if (!robotsContent) {
    items.push({
      id: 'robots-directive',
      category: 'technical',
      title: 'Search Engine Robots Directives',
      severity: 'warning',
      score: 6,
      foundValue: 'Default index/follow (no explicit tag)',
      expectedValue: 'index, follow, max-snippet:-1, max-image-preview:large',
      googleStandard: 'Explicitly declaring max-snippet and max-image-preview enables large image previews in Google Discover and Search.',
      explanation: 'Google defaults to indexing, but rich image previews in Google Discover require explicit max-image-preview:large directive.',
      recommendation: 'Add explicit robots directive with max-image-preview and max-snippet.',
      codeSnippet: '<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />'
    });
  } else {
    const hasNoIndex = robotsContent.includes('noindex');
    if (hasNoIndex) {
      items.push({
        id: 'robots-directive',
        category: 'technical',
        title: 'Robots Noindex Directive (Critical Alert)',
        severity: 'failed',
        score: 0,
        foundValue: robotsContent,
        expectedValue: 'index, follow for public production pages',
        googleStandard: 'Pages containing noindex will be completely omitted from Google Search results.',
        explanation: 'Your robots tag is instructing Googlebot NOT to index this page in search results.',
        recommendation: 'Remove noindex directive immediately if this page is intended for public search visibility.',
        codeSnippet: '<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />'
      });
    } else {
      const hasImagePreview = robotsContent.includes('max-image-preview:large');
      items.push({
        id: 'robots-directive',
        category: 'technical',
        title: 'Robots Indexing & Preview Directives',
        severity: 'passed',
        score: 10,
        foundValue: robotsContent,
        expectedValue: 'index, follow with preview settings',
        googleStandard: 'Proper robots directives ensure indexing and enable Google Discover & SERP rich media cards.',
        explanation: hasImagePreview
          ? 'Includes max-image-preview:large, unlocking Google Discover high-res thumbnail eligibility.'
          : 'Allows Googlebot full indexing access.',
        recommendation: 'Maintain configuration.',
        codeSnippet: `<meta name="robots" content="${robotsContent}" />`
      });
    }
  }

  // 5. AI Crawlers (Googlebot, GPTBot, Claudebot, PerplexityBot)
  const aiBots = ['googlebot', 'gptbot', 'claudebot', 'perplexitybot'];
  const detectedAiBots = aiBots.filter(bot => !!doc.querySelector(`meta[name="${bot}"]`));

  items.push({
    id: 'ai-crawler-directives',
    category: 'technical',
    title: 'AI Search & LLM Directives (GPTBot, ClaudeBot, Google-Extended)',
    severity: detectedAiBots.length >= 2 ? 'passed' : 'warning',
    score: detectedAiBots.length >= 2 ? 10 : 7,
    foundValue: detectedAiBots.length > 0 ? detectedAiBots.join(', ') : 'None specified',
    expectedValue: 'Directives for modern AI engines (Google-Extended, GPTBot, ClaudeBot)',
    googleStandard: 'Modern search and generative engines (Gemini, ChatGPT Search, Perplexity) parse bot-specific meta tags.',
    explanation: detectedAiBots.length >= 2
      ? 'Configured for high visibility in generative engine answer citations.'
      : 'Adding explicit bot tags ensures your compliance knowledge is cited in AI summaries.',
    recommendation: 'Include directives for Googlebot, GPTBot, and ClaudeBot to maximize generative AI referral traffic.',
    codeSnippet: '<meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large" />\n<meta name="gptbot" content="index, follow" />\n<meta name="claudebot" content="index, follow" />'
  });

  // 6. OpenGraph Protocol Tags
  const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
  const ogDesc = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
  const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
  const ogType = doc.querySelector('meta[property="og:type"]')?.getAttribute('content') || '';
  const ogSiteName = doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content') || '';
  const ogUrl = doc.querySelector('meta[property="og:url"]')?.getAttribute('content') || '';

  const ogMissing: string[] = [];
  if (!ogTitle) ogMissing.push('og:title');
  if (!ogDesc) ogMissing.push('og:description');
  if (!ogImage) ogMissing.push('og:image');
  if (!ogType) ogMissing.push('og:type');

  if (ogMissing.length > 0) {
    items.push({
      id: 'og-tags',
      category: 'social',
      title: 'OpenGraph Meta Tags Completeness',
      severity: ogMissing.includes('og:title') || ogMissing.includes('og:image') ? 'failed' : 'warning',
      score: Math.max(0, 10 - ogMissing.length * 3),
      foundValue: `Missing: ${ogMissing.join(', ')}`,
      expectedValue: 'og:title, og:description, og:image, og:type, og:site_name, og:url',
      googleStandard: 'OpenGraph tags control link previews on Facebook, LinkedIn, Slack, WhatsApp, and Google Discover.',
      explanation: 'Incomplete OpenGraph tags result in blank or broken preview cards when links are shared on social platforms.',
      recommendation: `Add the missing tags (${ogMissing.join(', ')}) in <head>.`,
      codeSnippet: '<meta property="og:type" content="website" />\n<meta property="og:title" content="Compliance Hub – Legal & Tax Bangladesh" />\n<meta property="og:description" content="Corporate Law, Income Tax & VAT compliance portal." />\n<meta property="og:image" content="https://blog.accounticca.com/logo.png" />'
    });
  } else {
    items.push({
      id: 'og-tags',
      category: 'social',
      title: 'OpenGraph Social Card Protocol',
      severity: 'passed',
      score: 10,
      foundValue: `Found complete set (og:title, og:desc, og:image, og:type, og:site_name)`,
      expectedValue: 'Complete OpenGraph metadata suite',
      googleStandard: 'Social platform link previews render high-fidelity rich media cards with image and summary.',
      explanation: 'All standard OpenGraph protocol tags are declared with absolute image references.',
      recommendation: 'Ensure og:image is hosted over HTTPS and is at least 1200x630px or square 1024x1024px.',
      codeSnippet: `<meta property="og:title" content="${ogTitle}" />\n<meta property="og:image" content="${ogImage}" />`
    });
  }

  // 7. Twitter Card Tags
  const twitterCard = doc.querySelector('meta[name="twitter:card"]')?.getAttribute('content') || '';
  const twitterTitle = doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content') || '';
  const twitterDesc = doc.querySelector('meta[name="twitter:description"]')?.getAttribute('content') || '';
  const twitterImage = doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content') || '';

  if (!twitterCard) {
    items.push({
      id: 'twitter-card',
      category: 'social',
      title: 'Twitter / X Card Directives',
      severity: 'warning',
      score: 4,
      foundValue: 'Missing twitter:card directive',
      expectedValue: 'summary_large_image with twitter:title and twitter:image',
      googleStandard: 'Twitter/X requires twitter:card="summary_large_image" for prominent visual display in feeds.',
      explanation: 'Shared links on X will fall back to minimal text links without visual preview artwork.',
      recommendation: 'Add twitter:card set to summary_large_image.',
      codeSnippet: '<meta name="twitter:card" content="summary_large_image" />\n<meta name="twitter:title" content="Compliance Hub – Legal & Tax Bangladesh" />\n<meta name="twitter:image" content="https://blog.accounticca.com/logo.png" />'
    });
  } else {
    items.push({
      id: 'twitter-card',
      category: 'social',
      title: 'Twitter / X Social Card Tags',
      severity: 'passed',
      score: 10,
      foundValue: `twitter:card="${twitterCard}", image="${twitterImage ? 'Present' : 'Fallback to OG'}"`,
      expectedValue: 'summary_large_image',
      googleStandard: 'Unlocks full-width banner preview cards on X/Twitter feeds.',
      explanation: 'Properly formatted card enables maximum click-through rates from social traffic.',
      recommendation: 'Maintain current card definition.',
      codeSnippet: `<meta name="twitter:card" content="${twitterCard}" />\n<meta name="twitter:title" content="${twitterTitle || ogTitle}" />`
    });
  }

  // 8. Schema.org JSON-LD Structured Data
  const jsonLdScripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
  const schemas: SchemaNode[] = [];
  let jsonLdValid = true;
  let parsedJsonCount = 0;

  jsonLdScripts.forEach((script, idx) => {
    try {
      const content = script.textContent?.trim() || '';
      if (!content) return;
      const parsed = JSON.parse(content);
      parsedJsonCount++;

      // Check for graph array or single object
      const nodes = Array.isArray(parsed['@graph'])
        ? parsed['@graph']
        : Array.isArray(parsed)
        ? parsed
        : [parsed];

      nodes.forEach((node: Record<string, unknown>) => {
        const type = String(node['@type'] || 'Thing');
        const warnings: string[] = [];

        if (!node.name && !node.headline) warnings.push('Missing "name" or "headline" property');
        if (!node.url && !node['@id']) warnings.push('Missing canonical "url" or "@id"');

        schemas.push({
          type,
          id: String(node['@id'] || `#schema-${idx}`),
          name: String(node.name || node.headline || type),
          valid: warnings.length === 0,
          rawJson: node,
          warnings,
        });
      });
    } catch {
      jsonLdValid = false;
    }
  });

  if (jsonLdScripts.length === 0) {
    items.push({
      id: 'schema-presence',
      category: 'schema',
      title: 'Schema.org JSON-LD Structured Data',
      severity: 'failed',
      score: 0,
      foundValue: 'Zero <script type="application/ld+json"> tags found',
      expectedValue: 'Embedded Schema.org structured data (WebApplication, Organization, LegalService)',
      googleStandard: 'Google uses Schema.org JSON-LD to generate Rich Results, knowledge graph panels, and search snippet badges.',
      explanation: 'Without structured data, your app loses eligibility for enhanced search snippets, star ratings, and organization knowledge graph cards.',
      recommendation: 'Add a valid JSON-LD script defining WebApplication and Organization.',
      codeSnippet: '<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "WebApplication",\n  "name": "Compliance Hub",\n  "applicationCategory": "BusinessApplication",\n  "operatingSystem": "All"\n}\n</script>'
    });
  } else if (!jsonLdValid) {
    items.push({
      id: 'schema-syntax',
      category: 'schema',
      title: 'JSON-LD Syntax Validation',
      severity: 'failed',
      score: 2,
      foundValue: 'Syntax Error in JSON-LD payload',
      expectedValue: 'Valid JSON string parsable with JSON.parse()',
      googleStandard: 'Google Search Console flags syntax errors as unparsable structured data and completely ignores the schema.',
      explanation: 'One or more <script type="application/ld+json"> tags contain malformed JSON syntax.',
      recommendation: 'Format and validate the JSON string using a linter or validator.',
      codeSnippet: '{\n  "@context": "https://schema.org",\n  "@type": "LegalService"\n}'
    });
  } else {
    const hasOrgOrLegal = schemas.some(s => ['LegalService', 'Organization', 'Corporation', 'LocalBusiness'].includes(s.type));
    const hasWebApp = schemas.some(s => ['WebApplication', 'SoftwareApplication', 'WebSite'].includes(s.type));

    items.push({
      id: 'schema-entities',
      category: 'schema',
      title: 'Schema.org Rich Snippet Entities',
      severity: 'passed',
      score: 10,
      foundValue: `${schemas.length} entities detected (${schemas.map(s => s.type).join(', ')})`,
      expectedValue: 'Schema.org graph with recognized entity types',
      googleStandard: 'Structured data accurately establishes organizational authority and application capability for Google Rich Results.',
      explanation: `Valid structured data detected covering: ${schemas.map(s => s.type).join(', ')}. ${hasOrgOrLegal ? 'Verified corporate entity graph.' : ''} ${hasWebApp ? 'Verified WebApplication graph.' : ''}`,
      recommendation: 'Ensure Schema.org telephone, address, and logo links are actively monitored and updated.',
      codeSnippet: jsonLdScripts[0]?.textContent?.trim().slice(0, 300) + '...'
    });
  }

  // 9. Document Headings Hierarchy (H1, H2, H3)
  const headerElements = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  const headers: HeaderNode[] = headerElements.map(el => ({
    level: parseInt(el.tagName.replace('H', ''), 10),
    tag: el.tagName.toLowerCase(),
    text: el.textContent?.trim() || '',
    length: (el.textContent?.trim() || '').length,
  }));

  const h1Elements = headers.filter(h => h.level === 1);

  if (sourceType === 'index.html' && headerElements.length === 0) {
    // In React Vite SPAs, index.html holds the shell div#root while headings render dynamically in client components.
    items.push({
      id: 'header-structure',
      category: 'headers',
      title: 'HTML Static Heading Outline (SPA Architecture)',
      severity: 'warning',
      score: 7,
      metric: '0 static headings in index.html (Client Rendered)',
      foundValue: 'Dynamic client-side rendered SPA (<div id="root"></div>)',
      expectedValue: 'At least one prominent <h1> tag rendered on each route',
      googleStandard: 'Googlebot executes JavaScript to crawl headings, but initial server HTML without fallback text relies heavily on client rendering.',
      explanation: 'Your index.html is an SPA shell. Ensure that React Helmet and page components render exactly one unique <h1> on each view.',
      recommendation: 'Check the "Rendered DOM (Current App)" tab to verify the live H1 and H2 hierarchy rendered by React.',
      codeSnippet: '<h1>Compliance Hub – Bangladesh Legal, Tax & Corporate Portal</h1>'
    });
  } else if (h1Elements.length === 0) {
    items.push({
      id: 'h1-presence',
      category: 'headers',
      title: 'Primary <h1> Heading Presence',
      severity: 'failed',
      score: 2,
      foundValue: 'Zero <h1> tags found',
      expectedValue: 'Exactly one primary <h1> tag per page',
      googleStandard: 'Google relies on the <h1> heading as the top-level semantic descriptor of page content.',
      explanation: 'Pages missing an <h1> tag lack a clear semantic anchor for accessibility and search ranking.',
      recommendation: 'Add a single descriptive <h1> heading communicating the page purpose.',
      codeSnippet: '<h1>Corporate Law, Tax & VAT Advisory Bangladesh</h1>'
    });
  } else if (h1Elements.length > 1) {
    items.push({
      id: 'h1-presence',
      category: 'headers',
      title: 'Primary <h1> Heading Uniqueness',
      severity: 'warning',
      score: 7,
      metric: `${h1Elements.length} <h1> tags detected`,
      foundValue: `Found ${h1Elements.length} <h1> tags`,
      expectedValue: 'Exactly one single <h1> per page',
      googleStandard: 'While HTML5 permits multiple H1s in sectioning elements, Google recommends a single clear H1 for main topic focus.',
      explanation: 'Multiple H1 tags dilute keyword topical authority and can confuse search crawlers regarding primary focus.',
      recommendation: 'Keep the most important title as <h1> and demote secondary titles to <h2>.',
      codeSnippet: `<h1>${h1Elements[0].text}</h1>`
    });
  } else {
    items.push({
      id: 'h1-presence',
      category: 'headers',
      title: 'Primary <h1> Heading Uniqueness & Hierarchy',
      severity: 'passed',
      score: 10,
      foundValue: `1 unique <h1>: "${h1Elements[0].text}" (${h1Elements[0].length} chars)`,
      expectedValue: 'Exactly one <h1> heading',
      googleStandard: 'Clear semantic document outline following Google accessibility and topical guidelines.',
      explanation: 'Clean H1 tag anchors the document structure perfectly.',
      recommendation: 'Ensure subsequent section subheadings follow logical H2 and H3 order.',
      codeSnippet: `<h1>${h1Elements[0].text}</h1>`
    });
  }

  // 10. Viewport & Mobile Responsiveness
  const viewportEl = doc.querySelector('meta[name="viewport"]');
  const viewportContent = viewportEl?.getAttribute('content') || '';

  if (!viewportContent) {
    items.push({
      id: 'viewport-tag',
      category: 'technical',
      title: 'Mobile Viewport Meta Tag',
      severity: 'failed',
      score: 0,
      foundValue: 'Missing viewport tag',
      expectedValue: 'width=device-width, initial-scale=1.0',
      googleStandard: 'Mobile-first indexing requires a responsive viewport tag for all web pages.',
      explanation: 'Without a viewport tag, mobile devices render pages at desktop width (980px) and scale down, failing Google Mobile-Friendly tests.',
      recommendation: 'Add the standard responsive viewport meta tag in <head>.',
      codeSnippet: '<meta name="viewport" content="width=device-width, initial-scale=1.0" />'
    });
  } else if (!viewportContent.includes('width=device-width')) {
    items.push({
      id: 'viewport-tag',
      category: 'technical',
      title: 'Mobile Viewport Configuration',
      severity: 'warning',
      score: 6,
      foundValue: viewportContent,
      expectedValue: 'width=device-width, initial-scale=1.0',
      googleStandard: 'Google recommends width=device-width for proper fluid layout across modern smartphones.',
      explanation: 'Non-standard viewport configuration may cause horizontal overflow or unreadable text scaling on mobile.',
      recommendation: 'Update viewport content to width=device-width, initial-scale=1.0.',
      codeSnippet: '<meta name="viewport" content="width=device-width, initial-scale=1.0" />'
    });
  } else {
    items.push({
      id: 'viewport-tag',
      category: 'technical',
      title: 'Mobile Viewport Configuration',
      severity: 'passed',
      score: 10,
      foundValue: viewportContent,
      expectedValue: 'width=device-width, initial-scale=1.0',
      googleStandard: 'Fully compliant with Google Mobile-First Indexing requirements.',
      explanation: 'Ensures fluid responsiveness across mobile, tablet, and desktop viewports.',
      recommendation: 'Keep current viewport configuration.',
      codeSnippet: `<meta name="viewport" content="${viewportContent}" />`
    });
  }

  // 11. Language Attribute (<html lang="...">)
  const htmlLang = doc.documentElement?.getAttribute('lang') || '';
  if (!htmlLang) {
    items.push({
      id: 'html-lang',
      category: 'technical',
      title: 'HTML Document Language (<html lang="...">)',
      severity: 'warning',
      score: 5,
      foundValue: 'Missing lang attribute on <html>',
      expectedValue: 'lang="en" or appropriate BCP 47 language code',
      googleStandard: 'Declaring document language aids accessibility screen readers and geographic search localization.',
      explanation: 'Search engines and translation tools rely on the lang attribute to accurately classify content audience.',
      recommendation: 'Add lang="en" to the root <html> opening tag.',
      codeSnippet: '<html lang="en">'
    });
  } else {
    items.push({
      id: 'html-lang',
      category: 'technical',
      title: 'HTML Document Language Declaration',
      severity: 'passed',
      score: 10,
      foundValue: `lang="${htmlLang}"`,
      expectedValue: 'Valid BCP 47 language tag',
      googleStandard: 'Proper language attribution assists international SEO and screen reader accessibility.',
      explanation: `Document language set to "${htmlLang}".`,
      recommendation: 'Maintain language declaration.',
      codeSnippet: `<html lang="${htmlLang}">`
    });
  }

  // 12. Favicon & Apple Touch Icons
  const hasFavicon = !!doc.querySelector('link[rel*="icon"]');
  const hasAppleTouchIcon = !!doc.querySelector('link[rel="apple-touch-icon"]');

  if (!hasFavicon) {
    items.push({
      id: 'favicon-tag',
      category: 'technical',
      title: 'Favicon & Browser Branding Icon',
      severity: 'warning',
      score: 5,
      foundValue: 'Missing favicon icon link',
      expectedValue: 'High-res favicon link (<link rel="icon" href="/favicon.ico" />)',
      googleStandard: 'Google displays site favicons next to search results in mobile and modern desktop SERPs.',
      explanation: 'Missing favicons result in generic globe icons in Google Search snippets, lowering user trust and click-through rates.',
      recommendation: 'Add favicon and apple-touch-icon links in <head>.',
      codeSnippet: '<link rel="icon" type="image/x-icon" href="/favicon.ico" />\n<link rel="apple-touch-icon" href="/apple-touch-icon.png" />'
    });
  } else {
    items.push({
      id: 'favicon-tag',
      category: 'technical',
      title: 'Favicon & SERP Icon Representation',
      severity: 'passed',
      score: 10,
      foundValue: hasAppleTouchIcon ? 'Favicon & Apple Touch Icon present' : 'Favicon present',
      expectedValue: 'Favicon and touch icons declared',
      googleStandard: 'Enables custom brand logo in Google mobile SERP visual snippet headers.',
      explanation: 'Branded favicon helps your site stand out visually in competitive search queries.',
      recommendation: 'Ensure favicon file is at least 48x48px (or 192x192px) for crisp display on high-DPI screens.',
      codeSnippet: '<link rel="icon" type="image/png" href="/logo.png" />'
    });
  }

  // Compute overall and category scores
  const categories: AuditCategory[] = ['meta', 'social', 'schema', 'headers', 'technical'];
  const categoryScores: Record<AuditCategory, number> = {
    meta: 0,
    social: 0,
    schema: 0,
    headers: 0,
    technical: 0,
  };

  categories.forEach(cat => {
    const catItems = items.filter(i => i.category === cat);
    if (catItems.length === 0) {
      categoryScores[cat] = 100;
    } else {
      const sum = catItems.reduce((acc, curr) => acc + curr.score, 0);
      categoryScores[cat] = Math.round((sum / (catItems.length * 10)) * 100);
    }
  });

  // Calculate weighted overall score
  const overallScore = Math.round(
    categoryScores.meta * 0.25 +
    categoryScores.social * 0.20 +
    categoryScores.schema * 0.25 +
    categoryScores.headers * 0.15 +
    categoryScores.technical * 0.15
  );

  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'A';
  if (overallScore >= 95) grade = 'A+';
  else if (overallScore >= 85) grade = 'A';
  else if (overallScore >= 75) grade = 'B';
  else if (overallScore >= 60) grade = 'C';
  else if (overallScore >= 50) grade = 'D';
  else grade = 'F';

  const stats = {
    total: items.length,
    passed: items.filter(i => i.severity === 'passed').length,
    warning: items.filter(i => i.severity === 'warning').length,
    failed: items.filter(i => i.severity === 'failed').length,
  };

  return {
    timestamp: new Date().toLocaleTimeString(),
    sourceType,
    url: pageUrl,
    overallScore,
    grade,
    categoryScores,
    stats,
    items,
    metaData: {
      title: titleText,
      description: descText,
      canonical: canonicalHref,
      robots: robotsContent,
      ogTitle: ogTitle || titleText,
      ogDescription: ogDesc || descText,
      ogImage: ogImage,
      ogType: ogType,
      ogSiteName: ogSiteName,
      twitterCard: twitterCard,
      twitterTitle: twitterTitle || ogTitle || titleText,
      twitterDescription: twitterDesc || ogDesc || descText,
      twitterImage: twitterImage || ogImage,
      viewport: viewportContent,
      themeColor: doc.querySelector('meta[name="theme-color"]')?.getAttribute('content') || '#020617',
      lang: htmlLang,
    },
    headers,
    schemas,
    rawHtmlSnippet: htmlContent.slice(0, 1500),
  };
}
