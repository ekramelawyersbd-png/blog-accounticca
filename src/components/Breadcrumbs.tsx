import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, Home, ArrowLeft, Compass } from 'lucide-react';
import { mockArticles, categories } from '../data/mockData';
import { SHOP_PRODUCTS } from '../data/shopProducts';
import { searchableTaxTools } from '../data/searchableTools';
import { INITIAL_LMS_COURSES } from '../data/lmsCoursesData';
import { resolveAcademyCourseOption, getAcademyPortalCourses } from '../utils/lmsPortalStore';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
  /**
   * When true, forces the breadcrumb navigation to render inline even when inside
   * a global Layout BreadcrumbProvider.
   */
  inline?: boolean;
  showBackButton?: boolean;
}

interface BreadcrumbContextValue {
  customItems: BreadcrumbItem[] | null;
  setCustomItems: (items: BreadcrumbItem[] | null) => void;
  hasGlobalBar: boolean;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue>({
  customItems: null,
  setCustomItems: () => {},
  hasGlobalBar: false,
});

const KNOWN_PARENT_PATHS: Record<string, string> = {
  'Tools': '/tools',
  'Tools Hub': '/tools',
  'Tools & Calculators': '/tools',
  'Tools & Resources': '/tools',
  'Resources': '/tools',
  'Shop': '/tools',
  'Digital Shop': '/tools',
  'Training Hub': '/training',
  'Training Academy': '/training',
  'Categories': '/search',
  'Knowledge Hub': '/search',
  'Knowledge Base': '/search',
  'Student Portal': '/student/dashboard',
  'Student Dashboard': '/student/dashboard',
  'Community': '/community',
  'Careers': '/Careers',
  'Dashboard': '/dashboard',
};

const TOOL_ROUTE_META: Record<string, { title: string; category: string }> = {
  'rjsc-fee-calculator': {
    title: 'RJSC Registration Fee Calculator',
    category: 'Corporate & RJSC',
  },
  'post-registration-checklist': {
    title: 'Post-Incorporation Compliance Checklist',
    category: 'Corporate & RJSC',
  },
  'rjsc-functions-explorer': {
    title: 'RJSC Statutory Functions Explorer',
    category: 'Corporate & RJSC',
  },
  'rjsc-returns-filing-guide': {
    title: 'RJSC Annual Returns & Filing Guide',
    category: 'Corporate & RJSC',
  },
  'capital-gains-tax': {
    title: 'Capital Gains Tax Calculator (ITA 2023)',
    category: 'Tax & VAT Calculators',
  },
  'corporate-tax': {
    title: 'Corporate Tax Rate Finder 2026–27',
    category: 'Corporate Tax',
  },
  'wealth-surcharge': {
    title: 'Net Wealth Surcharge Calculator',
    category: 'Personal Tax',
  },
  'investment-rebate': {
    title: 'Investment Tax Rebate Calculator',
    category: 'Personal Tax',
  },
  'agricultural-tax': {
    title: 'Agricultural Income Tax Calculator',
    category: 'Personal Tax',
  },
  'minimum-turnover-tax': {
    title: 'Minimum & Turnover Tax Calculator (Sec 163)',
    category: 'Corporate Tax',
  },
  'dvc-verification': {
    title: 'DVC Audit & Financial Compliance Checker',
    category: 'Corporate & Audit',
  },
  'resource-library': {
    title: 'Statutory Forms & PDF Library',
    category: 'Statutory Templates',
  },
  'early-filing-incentive': {
    title: 'PSR & Statutory Filing Compliance Checker',
    category: 'Tax Compliance',
  },
  'loss-carry-forward-calculator': {
    title: 'Loss Set-Off & Carry Forward Simulator',
    category: 'Tax Planning',
  },
  'tax-slabs-explorer': {
    title: 'Interactive Tax Slabs Explorer 2026–27',
    category: 'Personal Tax',
  },
  'rate-finder': {
    title: 'National TDS, VDS & Tax Rate Finder',
    category: 'Withholding Tax',
  },
  'vat-apportionment-calculator': {
    title: 'VAT Apportionment Calculator (Section 47)',
    category: 'Tax & VAT Calculators',
  },
  'seo-performance-audit': {
    title: 'SEO Performance Audit',
    category: 'Compliance Reference',
  },
  'seo-audit': {
    title: 'SEO Performance Audit',
    category: 'Compliance Reference',
  },
};

function formatSegmentLabel(segment: string): string {
  const decoded = decodeURIComponent(segment).replace(/=$/, '');
  return decoded
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) => {
      const upper = word.toUpperCase();
      if (['RJSC', 'VAT', 'TDS', 'VDS', 'ITA', 'MTO', 'FAQ', 'LMS', 'DVC', 'PSR', 'NBR', 'BIN', 'TIN', 'PDF'].includes(upper)) {
        return upper;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

function normalizeCustomItems(items: BreadcrumbItem[]): BreadcrumbItem[] {
  return items
    .filter((item) => item && item.label && item.label.trim().toLowerCase() !== 'home')
    .map((item, idx, arr) => {
      const isLast = idx === arr.length - 1;
      if (isLast) {
        return { label: item.label };
      }
      const resolvedPath = item.path || KNOWN_PARENT_PATHS[item.label.trim()];
      return {
        label: item.label,
        path: resolvedPath,
      };
    });
}

/**
 * Dynamically computes the hierarchical breadcrumb trail from the active URL pathname,
 * search query parameters, hash, and platform data registries.
 */
export function resolveDynamicBreadcrumbs(
  pathname: string,
  search: string = '',
  hash: string = '',
  overrideItems?: BreadcrumbItem[] | null
): BreadcrumbItem[] {
  if (overrideItems && overrideItems.length > 0) {
    return normalizeCustomItems(overrideItems);
  }

  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  if (cleanPath === '/') {
    return [];
  }

  const searchParams = new URLSearchParams(search);
  const segments = cleanPath.split('/').filter(Boolean);
  const first = segments[0] || '';
  const second = segments[1] || '';

  // 1. Knowledge Base Category pages: /category/:id
  if (first === 'category' && second) {
    const category = categories.find((c) => c.id === second);
    return [
      { label: 'Knowledge Hub', path: '/search' },
      { label: 'Legal Categories', path: '/search' },
      { label: category ? category.name : formatSegmentLabel(second) },
    ];
  }

  // 2. Knowledge Base Article pages: /article/:id
  if (first === 'article' && second) {
    const article = mockArticles.find((a) => a.id === second);
    if (article) {
      const matchedCat = categories.find(
        (c) => c.id === article.categoryId || c.name === article.category
      );
      const catId = matchedCat?.id || article.categoryId || 'tax';
      const catName = matchedCat?.name || article.category || 'Legal & Tax';
      return [
        { label: 'Knowledge Hub', path: '/search' },
        { label: catName, path: `/category/${catId}` },
        { label: article.title },
      ];
    }
    return [
      { label: 'Knowledge Hub', path: '/search' },
      { label: formatSegmentLabel(second) },
    ];
  }

  // 3. Digital Shop & Product Details: /shop, /shop/:slug, /shop/product/:slug, /shop/checkout
  if (first === 'shop') {
    if (!second) {
      const catFilter = searchParams.get('category');
      const typeFilter = searchParams.get('type');
      if (catFilter && catFilter !== 'All Products') {
        return [
          { label: 'Compliance Tools', path: '/tools' },
          { label: catFilter },
        ];
      }
      if (typeFilter && typeFilter !== 'All Types') {
        return [
          { label: 'Compliance Tools', path: '/tools' },
          { label: typeFilter },
        ];
      }
      return [{ label: 'Compliance Tools', path: '/tools' }];
    }

    if (second === 'checkout') {
      return [
        { label: 'Compliance Hub', path: '/' },
        { label: 'Checkout & Procurement' },
      ];
    }

    const productSlug = second === 'product' && segments[2] ? segments[2] : second;
    let product = SHOP_PRODUCTS.find((p) => p.slug === productSlug || p.id === productSlug);
    if (!product && typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem('complianceHub_shop_catalog_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            product = parsed.find((p: { slug?: string; id?: string }) => p.slug === productSlug || p.id === productSlug);
          }
        }
      } catch {
        // Ignore storage read errors
      }
    }

    if (product) {
      return [
        { label: 'Compliance Tools', path: '/tools' },
        {
          label: product.category,
          path: '/tools',
        },
        { label: product.title },
      ];
    }

    return [
      { label: 'Compliance Tools', path: '/tools' },
      { label: formatSegmentLabel(productSlug) },
    ];
  }

  if (first === 'checkout') {
    return [
      { label: 'Compliance Hub', path: '/' },
      { label: 'Checkout & Procurement' },
    ];
  }

  // 4. Compliance Tools Hub & Standalone Calculators: /tools, /tools/:toolSlug
  if (first === 'tools') {
    const categoryQuery = searchParams.get('category');
    if (!second) {
      if (categoryQuery) {
        return [
          { label: 'Tools & Calculators', path: '/tools' },
          { label: categoryQuery },
        ];
      }
      if (hash) {
        const cleanHash = hash.replace(/^#/, '');
        const matchedTool = searchableTaxTools.find((t) => t.id === cleanHash || t.id.replace(/-tool$/, '') === cleanHash);
        if (matchedTool) {
          return [
            { label: 'Tools & Calculators', path: '/tools' },
            { label: matchedTool.category, path: '/tools' },
            { label: matchedTool.name },
          ];
        }
      }
      return [{ label: 'Tools & Calculators Hub' }];
    }

    const toolMeta = TOOL_ROUTE_META[second];
    if (toolMeta) {
      return [
        { label: 'Tools & Calculators', path: '/tools' },
        { label: toolMeta.category, path: '/tools' },
        { label: toolMeta.title },
      ];
    }

    const matchedFromSearchable = searchableTaxTools.find(
      (t) => t.id === second || t.id === `${second}-tool` || t.path === `/tools/${second}`
    );
    if (matchedFromSearchable) {
      return [
        { label: 'Tools & Calculators', path: '/tools' },
        { label: matchedFromSearchable.category, path: '/tools' },
        { label: matchedFromSearchable.name },
      ];
    }

    return [
      { label: 'Tools & Calculators', path: '/tools' },
      { label: formatSegmentLabel(second) },
    ];
  }

  // 5. Standalone Planners, Calculators & Statutory Guides
  if (first === 'tax-planner') {
    return [
      { label: 'Tools & Calculators', path: '/tools' },
      { label: 'Personal Tax', path: '/tools' },
      { label: 'Personal Income Tax Planner 2026–27' },
    ];
  }
  if (first === 'corporate-planner' || first === 'corporate-tax-planner') {
    return [
      { label: 'Tools & Calculators', path: '/tools' },
      { label: 'Corporate Tax', path: '/tools' },
      { label: 'Corporate Tax Planner 2026' },
    ];
  }
  if (first === 'policy-analysis') {
    return [
      { label: 'Tools & Calculators', path: '/tools' },
      { label: 'Tax Planning', path: '/tools' },
      { label: 'Tax Policy Analysis' },
    ];
  }
  if (first === 'vat-apportionment-calculator') {
    return [
      { label: 'Tools & Calculators', path: '/tools' },
      { label: 'Tax & VAT Calculators', path: '/tools' },
      { label: 'VAT Apportionment Calculator (Section 47)' },
    ];
  }
  if (first === 'vat-guide') {
    return [
      { label: 'Tax & VAT Guides', path: '/category/tax' },
      { label: 'VAT Registration & Compliance Guide' },
    ];
  }
  if (first === 'tds-guide' || first === 'tds-reference') {
    return [
      { label: 'Tax & VAT Guides', path: '/category/tax' },
      { label: 'TDS & VDS Master Rate Reference' },
    ];
  }
  if (first === 'tax-refund-guide') {
    return [
      { label: 'Tax & VAT Guides', path: '/category/tax' },
      { label: 'Tax Refund & Adjustment Guide' },
    ];
  }

  // 6. Training Academy & Courses
  if (first === 'training') {
    return [{ label: 'Training Academy' }];
  }

  if (first === 'course' && second) {
    const course = INITIAL_LMS_COURSES.find((c) => c.courseId === second);
    const academyCourse = resolveAcademyCourseOption(second);
    const title = course
      ? course.title
      : academyCourse
      ? academyCourse.title
      : second === 'personal-income-tax'
      ? 'Personal Income Tax Masterclass (ITA 2023)'
      : formatSegmentLabel(second);
    return [
      { label: 'Training Academy', path: '/training' },
      { label: title },
    ];
  }

  if (first === 'enrollment') {
    return [
      { label: 'Training Academy', path: '/training' },
      { label: 'Course Enrollment' },
    ];
  }
  if (first === 'verify-certificate') {
    return [
      { label: 'Training Academy', path: '/training' },
      { label: 'Public Certificate Verification Registry' },
    ];
  }

  // 7. Student LMS Portal & Learning Modes
  if (first === 'student') {
    const queryClassParam = searchParams.get('class');

    if (!second) {
      return [
        { label: 'Training Academy', path: '/training' },
        { label: 'Student Learning Portal' },
      ];
    }
    if (second === 'dashboard') {
      if (segments[2]) {
        const rawCourseParam = segments[2];
        const resolvedAcademyCourse = resolveAcademyCourseOption(rawCourseParam);
        const courseTitle = resolvedAcademyCourse
          ? resolvedAcademyCourse.title
          : formatSegmentLabel(rawCourseParam);
        const coursePath = resolvedAcademyCourse
          ? resolvedAcademyCourse.dashboardPath
          : `/student/dashboard/${rawCourseParam}`;

        if (segments[3] === 'exam') {
          return [
            { label: 'Training Academy', path: '/training' },
            { label: 'Student Dashboard', path: '/student/dashboard' },
            { label: courseTitle, path: coursePath },
            { label: 'Final Certification Assessment' },
          ];
        }
        if (segments[3] === 'lesson' && segments[4]) {
          return [
            { label: 'Training Academy', path: '/training' },
            { label: 'Student Dashboard', path: '/student/dashboard' },
            { label: courseTitle, path: coursePath },
            { label: formatSegmentLabel(segments[4]) },
          ];
        }
        if (queryClassParam) {
          return [
            { label: 'Training Academy', path: '/training' },
            { label: 'Student Dashboard', path: '/student/dashboard' },
            { label: courseTitle, path: coursePath },
            { label: queryClassParam },
          ];
        }
        return [
          { label: 'Training Academy', path: '/training' },
          { label: 'Student Dashboard', path: '/student/dashboard' },
          { label: courseTitle },
        ];
      }

      if (queryClassParam) {
        return [
          { label: 'Training Academy', path: '/training' },
          { label: 'Student Dashboard', path: '/student/dashboard' },
          { label: queryClassParam },
        ];
      }

      return [
        { label: 'Training Academy', path: '/training' },
        { label: 'Student Learning Portal' },
      ];
    }

    if (second === 'course' && segments[2]) {
      const courseId = segments[2];
      const course = INITIAL_LMS_COURSES.find((c) => c.courseId === courseId);
      const academyCourse = resolveAcademyCourseOption(courseId);
      const courseTitle = course
        ? course.title
        : academyCourse
        ? academyCourse.title
        : formatSegmentLabel(courseId);

      const modeTitleMap: Record<string, string> = {
        video: 'Video Lesson',
        notes: 'Class Notes',
        ppt: 'PPT Slides',
        quiz: 'Class Quiz',
      };

      if (segments[3] === 'lesson' && segments[4]) {
        const lessonId = segments[4];
        const lesson = course?.lessons.find((l) => l.lessonId === lessonId);
        const lessonLabel = lesson ? lesson.heading : formatSegmentLabel(lessonId);
        const mode = segments[5];

        if (mode && modeTitleMap[mode]) {
          return [
            { label: 'Training Academy', path: '/training' },
            { label: 'Student Portal', path: '/student/dashboard' },
            { label: courseTitle, path: `/student/course/${courseId}` },
            { label: lessonLabel, path: `/student/course/${courseId}/lesson/${lessonId}` },
            { label: modeTitleMap[mode] },
          ];
        }

        return [
          { label: 'Training Academy', path: '/training' },
          { label: 'Student Portal', path: '/student/dashboard' },
          { label: courseTitle, path: `/student/course/${courseId}` },
          { label: lessonLabel },
        ];
      }

      if (segments[3] === 'exam') {
        return [
          { label: 'Training Academy', path: '/training' },
          { label: 'Student Portal', path: '/student/dashboard' },
          { label: courseTitle, path: `/student/course/${courseId}` },
          { label: 'Final Certification Assessment' },
        ];
      }

      if (segments[3] === 'quiz' && segments[4]) {
        return [
          { label: 'Training Academy', path: '/training' },
          { label: 'Student Portal', path: '/student/dashboard' },
          { label: courseTitle, path: `/student/course/${courseId}` },
          { label: `Quiz: ${formatSegmentLabel(segments[4])}` },
        ];
      }

      return [
        { label: 'Training Academy', path: '/training' },
        { label: 'Student Portal', path: '/student/dashboard' },
        { label: courseTitle },
      ];
    }

    if (second === 'certificates' && segments[2]) {
      return [
        { label: 'Training Academy', path: '/training' },
        { label: 'Student Portal', path: '/student/dashboard' },
        { label: `Certificate: ${segments[2]}` },
      ];
    }
  }

  // 8. Careers Hub & Role Application Pages
  const lowerFirst = first.toLowerCase().replace(/=$/, '');
  if (lowerFirst === 'careers' || lowerFirst === 'jobs' || first === 'e_lawyers_customer_care_application.html') {
    if (first === 'e_lawyers_customer_care_application.html') {
      return [
        { label: 'Careers & Opportunities', path: '/Careers' },
        { label: 'Customer Care Executive' },
      ];
    }
    if (!second) {
      return [{ label: 'Careers & Opportunities' }];
    }
    const cleanRole = second.toLowerCase().replace(/=$/, '');
    if (cleanRole.includes('accountant')) {
      return [
        { label: 'Careers & Opportunities', path: '/Careers' },
        { label: 'Accountant (Tax & Compliance)' },
      ];
    }
    if (cleanRole.includes('customer-care')) {
      return [
        { label: 'Careers & Opportunities', path: '/Careers' },
        { label: 'Customer Care Executive' },
      ];
    }
    if (cleanRole.includes('mto') || cleanRole.includes('management-trainee')) {
      return [
        { label: 'Careers & Opportunities', path: '/Careers' },
        { label: 'Management Trainee Officer (MTO)' },
      ];
    }
    if (cleanRole.includes('sales') || cleanRole.includes('marketing')) {
      return [
        { label: 'Careers & Opportunities', path: '/Careers' },
        { label: 'Sales & Marketing Executive' },
      ];
    }
    return [
      { label: 'Careers & Opportunities', path: '/Careers' },
      { label: formatSegmentLabel(second) },
    ];
  }

  // 9. Community, Experts, Discussions
  if (first === 'community') {
    const tab = searchParams.get('tab');
    if (tab === 'experts') {
      return [
        { label: 'Community & Q&A', path: '/community' },
        { label: 'Verified Panel Experts' },
      ];
    }
    if (tab === 'discussions') {
      return [
        { label: 'Community & Q&A', path: '/community' },
        { label: 'Peer Discussions' },
      ];
    }
    return [{ label: 'Community & Expert Q&A' }];
  }
  if (first === 'experts') {
    return [
      { label: 'Community & Q&A', path: '/community' },
      { label: 'Verified Panel Experts' },
    ];
  }
  if (first === 'discussions') {
    return [
      { label: 'Community & Q&A', path: '/community' },
      { label: 'Peer Discussions' },
    ];
  }

  // 10. Resource Library, Search, Glossary, FAQ, Dashboard, Team, Contact, Portal
  if (first === 'resource-library') {
    return [
      { label: 'Tools & Calculators', path: '/tools' },
      { label: 'Statutory Resource Library (PDFs)' },
    ];
  }
  if (first === 'search') {
    const q = searchParams.get('q');
    if (q && q.trim()) {
      return [
        { label: 'Knowledge Hub', path: '/search' },
        { label: `Search: "${q.trim()}"` },
      ];
    }
    return [{ label: 'Knowledge Hub & Search' }];
  }
  if (first === 'glossary') {
    return [
      { label: 'Knowledge Hub', path: '/search' },
      { label: 'Accounting & Tax Glossary' },
    ];
  }
  if (first === 'faq') {
    return [
      { label: 'Knowledge Hub', path: '/search' },
      { label: 'Legal & Tax FAQs' },
    ];
  }
  if (first === 'dashboard') {
    const tab = searchParams.get('tab');
    const tabMap: Record<string, string> = {
      analytics: 'Content & Tool Analytics',
      'firebase-analytics': 'Content & Tool Analytics',
      deadlines: 'Compliance Deadlines Calendar',
      purchases: 'Purchase History & Unlocked Kits',
      feedback: 'Quick Feedback',
      profile: 'Account Profile Hub',
    };
    if (tab && tabMap[tab]) {
      return [
        { label: 'Compliance Dashboard', path: '/dashboard' },
        { label: tabMap[tab] },
      ];
    }
    return [{ label: 'Compliance Dashboard' }];
  }
  if (first === 'team') {
    return [
      { label: 'Firm Profile', path: '/contact' },
      { label: 'Our Advisory Team' },
    ];
  }
  if (first === 'contact') {
    const tab = searchParams.get('tab');
    const area = searchParams.get('area');
    if (tab === 'appointment') {
      if (area) {
        return [
          { label: 'Contact & Advisory', path: '/contact' },
          { label: 'Book Consultation', path: '/contact?tab=appointment' },
          { label: formatSegmentLabel(area) },
        ];
      }
      return [
        { label: 'Contact & Advisory', path: '/contact' },
        { label: 'Book Consultation' },
      ];
    }
    return [{ label: 'Contact & Advisory Desk' }];
  }
  if (first === 'portal' || first === 'client-portal') {
    return [
      { label: 'Compliance Dashboard', path: '/dashboard' },
      { label: 'Client Advisory Portal' },
    ];
  }
  if (first === 'profile') {
    return [
      { label: 'Account', path: '/dashboard' },
      { label: 'My Profile & Saved Items' },
    ];
  }
  if (first === 'auth') {
    return [{ label: 'Sign In & Account Access' }];
  }
  if (first === 'workspace') {
    return [
      { label: 'Admin Console', path: '/admin/shop' },
      { label: 'Google Workspace Integration' },
    ];
  }
  if (first === 'privacy') {
    return [
      { label: 'Legal Policies' },
      { label: 'Privacy Policy' },
    ];
  }
  if (first === 'terms') {
    return [
      { label: 'Legal Policies' },
      { label: 'Terms & Conditions' },
    ];
  }

  // 11. Payment Callbacks & Admin Routes
  if (first === 'payment' || first === 'gateway') {
    const isCancel = cleanPath.includes('cancel');
    return [
      { label: 'Compliance Hub', path: '/' },
      { label: isCancel ? 'Payment Cancelled' : 'Payment Verification' },
    ];
  }
  if (first === 'admin') {
    if (second === 'login') {
      return [
        { label: 'Admin Console' },
        { label: 'Authorized Sign In' },
      ];
    }
    if (second === 'shop' || !second) {
      return [
        { label: 'Admin Console' },
        { label: 'Shop Catalog Desk' },
      ];
    }
    if (second === 'dashboard' || second === 'courses' || second === 'assessments' || second === 'certificates') {
      return [
        { label: 'Admin Console', path: '/admin/shop' },
        { label: 'LMS Course Editor' },
      ];
    }
    return [
      { label: 'Admin Console', path: '/admin/shop' },
      { label: formatSegmentLabel(second) },
    ];
  }

  // 12. Generic dynamic segment fallback for any nested route
  return segments.map((seg, index) => {
    const isLast = index === segments.length - 1;
    const cumulativePath = '/' + segments.slice(0, index + 1).join('/');
    return {
      label: formatSegmentLabel(seg),
      path: isLast ? undefined : cumulativePath,
    };
  });
}

export function BreadcrumbProvider({
  children,
  hasGlobalBar = true,
}: {
  children: React.ReactNode;
  hasGlobalBar?: boolean;
}) {
  const [customItems, setCustomItems] = useState<BreadcrumbItem[] | null>(null);
  const location = useLocation();

  // Clear custom page overrides whenever route changes before child effect runs
  useEffect(() => {
    setCustomItems(null);
  }, [location.pathname, location.search]);

  const value = useMemo(
    () => ({ customItems, setCustomItems, hasGlobalBar }),
    [customItems, hasGlobalBar]
  );

  return (
    <BreadcrumbContext.Provider value={value}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

/**
 * Renders the semantic breadcrumb navigation list with Schema.org BreadcrumbList JSON-LD.
 */
function BreadcrumbTrail({
  items,
  className = '',
  showBackButton = false,
}: {
  items: BreadcrumbItem[];
  className?: string;
  showBackButton?: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const breadcrumbJsonLd = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://accounticca.com';
    const itemListElement = [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${origin}/`,
      },
      ...items.map((item, index) => {
        const itemUrl = item.path ? (item.path.startsWith('http') ? item.path : `${origin}${item.path}`) : `${origin}${location.pathname}`;
        return {
          '@type': 'ListItem',
          position: index + 2,
          name: item.label,
          item: itemUrl,
        };
      }),
    ];
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement,
    });
  }, [items, location.pathname]);

  if (items.length === 0) {
    return null;
  }

  const parentItem = items.length > 1 ? items[items.length - 2] : null;

  const handleBack = () => {
    if (parentItem?.path) {
      navigate(parentItem.path);
    } else if (typeof window !== 'undefined' && window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center justify-between gap-3 text-xs sm:text-sm font-medium text-slate-600 print:hidden ${className}`}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }}
      />
      <div className="flex items-center min-w-0 overflow-x-auto no-scrollbar py-0.5">
        {showBackButton && (
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1 mr-2.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200/80 hover:border-emerald-200 text-xs font-semibold transition-colors shrink-0 cursor-pointer shadow-2xs"
            title={parentItem?.label ? `Back to ${parentItem.label}` : 'Go back'}
            aria-label={parentItem?.label ? `Go back to ${parentItem.label}` : 'Go back to previous page'}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back</span>
          </button>
        )}

        <ol
          className="flex items-center min-w-0 whitespace-nowrap"
          itemScope
          itemType="https://schema.org/BreadcrumbList"
        >
          {/* Root Home Item */}
          <li
            className="flex items-center shrink-0"
            itemProp="itemListElement"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            <Link
              to="/"
              itemProp="item"
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-emerald-700 transition-colors font-medium hover:underline"
              title="Compliance Hub Home"
            >
              <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
              <span itemProp="name" className="hidden xs:inline sm:inline">Home</span>
            </Link>
            <meta itemProp="position" content="1" />
          </li>

          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const position = index + 2;

            return (
              <li
                key={`${item.label}-${index}`}
                className="flex items-center min-w-0"
                itemProp="itemListElement"
                itemScope
                itemType="https://schema.org/ListItem"
              >
                <ChevronRight
                  className="w-3.5 h-3.5 mx-1.5 sm:mx-2 text-slate-400 shrink-0"
                  aria-hidden="true"
                />
                {!isLast && item.path ? (
                  <Link
                    to={item.path}
                    itemProp="item"
                    className="text-slate-600 hover:text-emerald-700 transition-colors truncate max-w-[150px] sm:max-w-[220px] md:max-w-[300px] hover:underline"
                    title={item.label}
                  >
                    <span itemProp="name">{item.label}</span>
                  </Link>
                ) : !isLast ? (
                  <span
                    itemProp="name"
                    className="text-slate-500 truncate max-w-[150px] sm:max-w-[220px] md:max-w-[300px]"
                    title={item.label}
                  >
                    {item.label}
                  </span>
                ) : (
                  <span
                    aria-current="page"
                    itemProp="name"
                    className="text-slate-900 font-bold truncate max-w-[200px] sm:max-w-[340px] md:max-w-[480px] lg:max-w-[560px]"
                    title={item.label}
                  >
                    {item.label}
                  </span>
                )}
                <meta itemProp="position" content={String(position)} />
              </li>
            );
          })}
        </ol>
      </div>

      {/* Quick-Jump Legal Category & Compliance Tool Switchers for fast hierarchy navigation */}
      <div className="hidden lg:flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Compass className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <label htmlFor="breadcrumb-category-jump" className="sr-only">
            Jump to Legal Category
          </label>
          <select
            id="breadcrumb-category-jump"
            aria-label="Jump to Legal Category"
            value={
              location.pathname.startsWith('/category/')
                ? location.pathname
                : ''
            }
            onChange={(e) => {
              if (e.target.value) {
                navigate(e.target.value);
              }
            }}
            className="bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-slate-700 text-[11px] font-semibold rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
          >
            <option value="">Legal Categories...</option>
            {categories.slice(0, 8).map((cat) => (
              <option key={cat.id} value={`/category/${cat.id}`}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <span className="text-slate-300 select-none" aria-hidden="true">
          ·
        </span>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <label htmlFor="breadcrumb-tool-jump" className="sr-only">
            Jump to Compliance Tool
          </label>
          <select
            id="breadcrumb-tool-jump"
            aria-label="Jump to Compliance Tool"
            value={
              location.pathname.startsWith('/tools/')
                ? location.pathname
                : ''
            }
            onChange={(e) => {
              if (e.target.value) {
                navigate(e.target.value);
              }
            }}
            className="bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-slate-700 text-[11px] font-semibold rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer max-w-[210px]"
          >
            <option value="">Compliance Tools...</option>
            <option value="/tools">All Tools Hub Directory</option>
            {Object.entries(TOOL_ROUTE_META)
              .filter(([slug]) => slug !== 'seo-audit')
              .map(([slug, meta]) => (
                <option key={slug} value={`/tools/${slug}`}>
                  {meta.title} ({meta.category})
                </option>
              ))}
          </select>
        </div>
      </div>
    </nav>
  );
}

/**
 * Platform-wide Dynamic Breadcrumb Bar mounted at the top of the content area in Layout.tsx.
 * Automatically tracks route changes and updates the user's location hierarchy.
 */
export function DynamicBreadcrumbBar() {
  const location = useLocation();
  const { customItems } = useContext(BreadcrumbContext);

  const cleanPath = location.pathname.replace(/\/+$/, '') || '/';

  if (cleanPath === '/') {
    return null;
  }

  const resolvedItems = resolveDynamicBreadcrumbs(
    location.pathname,
    location.search,
    location.hash,
    customItems
  );

  if (resolvedItems.length === 0) {
    return null;
  }

  return (
    <div
      id="dynamic-breadcrumb-content-header"
      className="w-full bg-white/95 backdrop-blur-xs border-b border-slate-200/80 print:hidden transition-colors"
    >
      <div className="w-full max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-1.5 sm:py-2">
        <BreadcrumbTrail items={resolvedItems} showBackButton />
      </div>
    </div>
  );
}

export const Breadcrumb = DynamicBreadcrumbBar;
export const DynamicBreadcrumbs = DynamicBreadcrumbBar;

/**
 * Dynamic & Backward-Compatible Breadcrumbs Component.
 * - Can be used without props (`<Breadcrumbs />`) to automatically derive crumbs from the current route.
 * - Can be passed `items` (`<Breadcrumbs items={[...]} />`) to specify or override crumbs.
 * - When inside `BreadcrumbProvider` with an active `DynamicBreadcrumbBar` in `Layout`, syncs custom
 *   items to the global bar and avoids rendering a duplicate breadcrumb bar unless `inline={true}`.
 */
export function Breadcrumbs({
  items,
  className = 'mb-6',
  inline = false,
  showBackButton = false,
}: BreadcrumbsProps) {
  const location = useLocation();
  const { setCustomItems, hasGlobalBar } = useContext(BreadcrumbContext);

  useEffect(() => {
    if (items && items.length > 0 && hasGlobalBar && !inline) {
      setCustomItems(items);
      return () => setCustomItems(null);
    }
  }, [items, hasGlobalBar, inline, setCustomItems]);

  const resolvedItems = useMemo(
    () =>
      resolveDynamicBreadcrumbs(
        location.pathname,
        location.search,
        location.hash,
        items
      ),
    [location.pathname, location.search, location.hash, items]
  );

  // If the global DynamicBreadcrumbBar is active in Layout and this isn't an explicit inline bar,
  // prevent duplicate stacked breadcrumb bars on the same page.
  if (hasGlobalBar && !inline) {
    return null;
  }

  return (
    <BreadcrumbTrail
      items={resolvedItems}
      className={className}
      showBackButton={showBackButton}
    />
  );
}

export default Breadcrumbs;
