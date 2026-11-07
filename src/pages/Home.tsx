import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookmarkButton } from '../components/BookmarkButton';
import { calculateReadingTime } from '../utils/readingTime';
import {
  ArrowRight,
  Clock,
  BookOpen,
  Calculator,
  FileText,
  Landmark,
  Search,
  Scale,
  ShieldCheck,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Building2,
  ArrowUpRight,
  ExternalLink,
  Calendar as CalendarIcon,
  MessageSquare,
  Award,
  FileCheck,
  MapPin,
  Star,
  Wrench,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';
import { mockArticles } from '../data/mockData';
import { INITIAL_EXPERTS, INITIAL_QUESTIONS } from '../data/communityData';
import { format } from 'date-fns';
import { Testimonials } from '../components/Testimonials';
import { QuickContactSection } from '../components/QuickContactSection';
import { SEO } from '../components/SEO';
import { SHOP_PRODUCTS, ShopProduct } from '../data/shopProducts';
import { useCart } from '../contexts/CartContext';
import { usePurchases } from '../contexts/PurchaseContext';
import { ProductPurchaseActions } from '../components/shop/ProductPurchaseActions';

export function Home() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isPurchased, isPendingPurchase } = usePurchases();
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [latestArticlesCategory, setLatestArticlesCategory] = useState('all');
  const [guideSearchQuery, setGuideSearchQuery] = useState('');
  const [isLoadingGuides, setIsLoadingGuides] = useState(true);
  const [heroArticleIndex, setHeroArticleIndex] = useState(0);
  const [featuredInsightIndex, setFeaturedInsightIndex] = useState(0);
  const [insightsViewMode, setInsightsViewMode] = useState<'grid' | 'carousel'>('grid');

  // Hero Search State with Live Suggestions
  const [heroSearchQuery, setHeroSearchQuery] = useState('');
  const [showHeroSuggestions, setShowHeroSuggestions] = useState(false);

  // Interactive Quick Estimator State (Home Page Instant Utility)
  const [estimatorMode, setEstimatorMode] = useState<'personal_tax' | 'vat_tds'>('personal_tax');
  const [quickIncome, setQuickIncome] = useState<string>('1200000');
  const [quickTaxCategory, setQuickTaxCategory] = useState<'general' | 'female_senior'>('general');
  const [quickInvoiceAmount, setQuickInvoiceAmount] = useState<string>('500000');
  const [quickSupplyType, setQuickSupplyType] = useState<'standard_15' | 'it_5' | 'procurement_7_5' | 'rent_15'>('standard_15');

  const featuredRegulatoryInsights = [
    {
      id: 'reg-salary-tds-2026-2027',
      badge: 'Income Tax Act 2023 · ধারা ৮৬ (Section 86)',
      effectiveDate: 'Payroll & AY 2026–2027',
      impactLevel: 'High Impact',
      title: 'বেতন থেকে উৎসে কর কর্তন ২০২৬–২৭: মাসিক TDS হিসাবের নিয়ম, করমুক্ত বেতন ও বিনিয়োগ রেয়াত',
      summary:
        'ধারা ৮৬ অনুযায়ী বেতন থেকে গড় হারে মাসিক TDS কর্তনের ৬টি ধাপ, ১/৩ অংশ বা সর্বোচ্চ ৫,০০,০০০ টাকা বেতন অব্যাহতি, ৪,০০,০০০ টাকা করমুক্ত সীমা, বিনিয়োগ রেয়াত (৩%/১০%/৭.৫ লক্ষ টাকা), বোনাস ও বেতন বৃদ্ধির সমন্বয়।',
      statReference: 'Section 86, 78 & 6th Schedule · ITA 2023',
      articlePath: '/article/salary-tds-bangladesh-complete-guide-2026-2027',
      toolPath: '/tax-calculator',
      toolLabel: 'Salary TDS Calculator'
    },
    {
      id: 'reg-bangladesh-income-tax-slabs-2026-2027',
      badge: 'Income Tax Act 2023 · AY 2026–27',
      effectiveDate: 'Assessment Year 2026–2027',
      impactLevel: 'High Impact',
      title: 'Bangladesh Income Tax 2026–27: Updated Tax-Free Thresholds (Tk. 4,00,000+), Progressive Slabs & Compliance',
      summary:
        'Official NBR guidelines for AY 2026–2027: basic tax-free threshold increased to Tk. 4,00,000 (Tk. 4,50,000 for women/seniors, Tk. 5,25,000 for disabled/third-gender), progressive tax brackets from 0% to 30%, mandatory digital e-return filing protocols, and minimum tax requirements.',
      statReference: 'Sections 4, 60 & 166 · Income Tax Act 2023',
      articlePath: '/article/bangladesh-income-tax-slabs-thresholds-2026-2027',
      toolPath: '/tax-calculator',
      toolLabel: 'Income Tax Calculator'
    },
    {
      id: 'reg-sro-213-2026-donation-rebate',
      badge: 'SRO No. 213-Ain/Aykor-4/2026 · Section 78',
      effectiveDate: 'Effective: 1 July 2026–30 June 2030',
      impactLevel: 'High Impact',
      title: 'Tax Rebate on Donations to 11 Approved Public-Welfare Organisations | ১১ প্রতিষ্ঠানে দানে আয়কর রেয়াত',
      summary:
        'Ministry of Finance SRO No. 213-Ain/Aykor-4/2026 recognizes 11 specified public-welfare and healthcare institutions (including ASHIC, BANCAT, and cancer trusts) for individual tax rebate under Section 76(1) and Sixth Schedule Part 3.',
      statReference: 'Secs. 76(1) & 78 · Sixth Schedule Part 3 · ITA 2023',
      articlePath: '/article/sro-213-2026-approved-11-institutions-donation-tax-rebate',
      toolPath: '/tax-calculator',
      toolLabel: 'Rebate Calculator'
    },
    {
      id: 'reg-ita-2023-sro',
      badge: 'Income Tax Act 2023 · Investment Cap',
      effectiveDate: 'Effective FY 2026–2027',
      impactLevel: 'High Impact',
      title: 'Allowable Investment Tax Rebate Caps (3% Income / 10% Investment / Tk. 7,50,000 Cap)',
      summary:
        'Detailed statutory limits on tax rebate calculation: lower of 3% eligible taxable income, 10% actual allowable investments (DPS up to BDT 1,20,000, Sanchayapatra up to BDT 5,00,000), or BDT 7,50,000 maximum cap.',
      statReference: 'Secs. 76, 78 & Sixth Schedule · ITA 2023',
      articlePath: '/article/investment-tax-rebate-bangladesh-2026-2027',
      toolPath: '/tax-calculator',
      toolLabel: 'Run Tax Calculator'
    },
    {
      id: 'reg-vat-mushak-91',
      badge: 'VAT & SD Act 2012 · NBR Directive',
      effectiveDate: 'Monthly Return Mandate',
      impactLevel: 'Mandatory Filing',
      title: 'Input Tax Credit (Mushak 6.3) Verification & 80% Banking Channel Settlement Enforcement',
      summary:
        'Stricter enforcement under Section 46 & Section 47 requiring Mushak 6.3 tax invoices within 4 tax periods and mandatory banking channel settlement for supplies exceeding BDT 1,00,000.',
      statReference: 'Secs. 46 & 47 · VAT & SD Act 2012',
      articlePath: '/article/input-tax-rebate-bangladesh-vat-guide',
      toolPath: '/tools/vat-apportionment-calculator',
      toolLabel: 'Apportionment Tool'
    },
    {
      id: 'reg-rjsc-digital',
      badge: 'Companies Act 1994 · RJSC Circular',
      effectiveDate: 'Annual Compliance',
      impactLevel: 'Corporate Governance',
      title: 'RJSC Digital Schedule X, Form XII & Beneficial Ownership Disclosure Synchronization',
      summary:
        'Updated RJSC verification workflow requiring TIN/e-Return proof for directors on Form XII changes, AGM minutes authentication, and digitized share transfer instruments (Form 117).',
      statReference: 'Secs. 36 & 85 · Companies Act 1994',
      articlePath: '/article/rjsc-guide',
      toolPath: '/tools',
      toolLabel: 'RJSC Fee Checklists'
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoadingGuides(false);
    }, 350);
    return () => clearTimeout(timer);
  }, []);

  const handleRefreshGuides = () => {
    setIsLoadingGuides(true);
    setGuideSearchQuery('');
    setTimeout(() => {
      setIsLoadingGuides(false);
    }, 350);
  };

  // Sort all articles by published date descending and extract top 3 for hero switcher
  const heroRecentArticles = useMemo(
    () =>
      [...mockArticles]
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, 3),
    []
  );
  const currentHeroArticle =
    heroRecentArticles[heroArticleIndex] || heroRecentArticles[0] || mockArticles[0] || null;

  const recentArticles = mockArticles.slice(1, 9);
  const filteredLatestArticles =
    latestArticlesCategory === 'all'
      ? recentArticles
      : mockArticles.filter((a) => a.categoryId === latestArticlesCategory).slice(0, 8);
  const displayLatestArticles =
    filteredLatestArticles.length > 0 ? filteredLatestArticles : recentArticles;

  const featuredGuides = [
    {
      title: 'বেতন থেকে উৎসে কর কর্তন ২০২৬–২৭: মাসিক TDS হিসাবের নিয়ম, করমুক্ত বেতন ও বিনিয়োগ রেয়াত',
      path: '/article/salary-tds-bangladesh-complete-guide-2026-2027',
      category: 'Payroll TDS · ধারা ৮৬',
      statRef: '১/৩ বা ৫ লক্ষ অব্যাহতি',
      readTime: '12 min read'
    },
    {
      title: 'Bangladesh Income Tax 2026–27: Updated Tax-Free Thresholds & Progressive Slabs',
      path: '/article/bangladesh-income-tax-slabs-thresholds-2026-2027',
      category: 'Income Tax · AY 2026-27',
      statRef: 'Tk. 4,00,000 Threshold',
      readTime: '9 min read'
    },
    {
      title: 'Tax Rebate on Donations to 11 Organisations (SRO No. 213-Ain/Aykor-4/2026) | ১১ প্রতিষ্ঠানে দানে আয়কর রেয়াত',
      path: '/article/sro-213-2026-approved-11-institutions-donation-tax-rebate',
      category: 'Income Tax · SRO 213',
      statRef: 'Secs. 76(1) & 78 · 2026–2030',
      readTime: '10 min read'
    },
    {
      title: 'Comprehensive Guide to Input Tax Rebate (উপকরণ কর রেয়াত) in Bangladesh',
      path: '/article/input-tax-rebate-bangladesh-vat-guide',
      category: 'VAT & Indirect Tax',
      statRef: 'Sec 46–47 · VAT Act 2012',
      readTime: '14 min read'
    },
    {
      title: 'Corporate VAT Compliance & Monthly Return Protocol in Bangladesh (Mushak 9.1)',
      path: '/article/corporate-vat-compliance-monthly-return-protocol-bangladesh',
      category: 'VAT & Indirect Tax',
      statRef: 'Rule 47 · Mushak 9.1',
      readTime: '15 min read'
    },
    {
      title: 'Business Identification Number (BIN) Registration in Bangladesh: Complete Guide',
      path: '/article/bin-registration-in-bangladesh',
      category: 'VAT Registration',
      statRef: 'Mushak 2.1 · Sec 6',
      readTime: '14 min read'
    },
    {
      title: 'Identification and Registration Systems Overview (71 Global & Bangladesh IDs)',
      path: '/article/identification-and-registration-systems-overview-guide',
      category: 'Regulatory Reference',
      statRef: '71 Statutory IDs',
      readTime: '18 min read'
    },
    {
      title: 'Investment Tax Rebate in Bangladesh 2026–2027: Eligible Investments, Limits & Calculation',
      path: '/article/investment-tax-rebate-bangladesh-2026-2027',
      category: 'Income Tax',
      statRef: 'Sec 78 · ITA 2023',
      readTime: '12 min read'
    },
    {
      title: 'Complete Guide to Company Registration in Bangladesh (RJSC, MOA & AOA)',
      path: '/article/company-reg',
      category: 'Corporate Law',
      statRef: 'Companies Act 1994',
      readTime: '8 min read'
    },
    {
      title: 'Income Tax Return Filing Guide 2026–2027',
      path: '/article/tax-return-guide',
      category: 'Tax Assessment',
      statRef: 'Sec 166–180 · ITA 2023',
      readTime: '10 min read'
    },
    {
      title: 'RJSC Annual Return & Statutory Filing Guide',
      path: '/article/rjsc-guide',
      category: 'RJSC Compliance',
      statRef: 'Schedule X & Form XII',
      readTime: '6 min read'
    },
    {
      title: 'Corporate Law Services in Bangladesh (Company Formation & Advisory)',
      path: '/article/corporate-law-services-bangladesh',
      category: 'Corporate Law',
      statRef: 'Commercial Governance',
      readTime: '6 min read'
    },
    {
      title: 'Tax & VAT Services in Bangladesh (Corporate & Individual)',
      path: '/article/tax-vat-services-bangladesh',
      category: 'Tax & VAT Law',
      statRef: 'NBR Representation',
      readTime: '6 min read'
    },
    {
      title: 'Bookkeeping Services: Keep Financial Records Organized & Audit-Ready',
      path: '/article/bookkeeping-services-accounticca',
      category: 'Accounting & Finance',
      statRef: 'IFRS & DVC Audit',
      readTime: '5 min read'
    },
    {
      title: 'Legal Checklist for Entrepreneurs & Startups in Bangladesh',
      path: '/article/startup-legal-checklist',
      category: 'Business & Startup',
      statRef: 'Founders Protocol',
      readTime: '5 min read'
    }
  ];

  const filteredGuides = useMemo(() => {
    const q = guideSearchQuery.trim().toLowerCase();
    if (!q) return featuredGuides;
    return featuredGuides.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        g.statRef.toLowerCase().includes(q)
    );
  }, [guideSearchQuery]);

  // Live Hero Search Suggestions
  const heroSearchSuggestions = useMemo(() => {
    const q = heroSearchQuery.trim().toLowerCase();
    if (!q) return [];
    return mockArticles
      .filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          a.excerpt.toLowerCase().includes(q)
      )
      .slice(0, 4);
  }, [heroSearchQuery]);

  // Instant Tax & VAT Estimator Calculations
  const quickTaxSummary = useMemo(() => {
    const rawIncome = Math.max(0, Number(quickIncome) || 0);
    const exemption = quickTaxCategory === 'female_senior' ? 400000 : 350000;
    let remaining = Math.max(0, rawIncome - exemption);
    const slabs = [
      { limit: 100000, rate: 0.05 },
      { limit: 400000, rate: 0.1 },
      { limit: 500000, rate: 0.15 },
      { limit: 500000, rate: 0.2 },
      { limit: 2000000, rate: 0.25 }
    ];
    let grossTax = 0;
    for (const slab of slabs) {
      if (remaining <= 0) break;
      const chunk = Math.min(remaining, slab.limit);
      grossTax += chunk * slab.rate;
      remaining -= chunk;
    }
    if (remaining > 0) {
      grossTax += remaining * 0.3;
    }
    const maxRebate = Math.min(rawIncome * 0.03, 1000000);
    const netPayable = rawIncome > exemption ? Math.max(5000, Math.round(grossTax - maxRebate)) : 0;
    return {
      taxableIncome: Math.max(0, rawIncome - exemption),
      grossTax: Math.round(grossTax),
      maxRebate: Math.round(maxRebate),
      netPayable
    };
  }, [quickIncome, quickTaxCategory]);

  const quickVatTdsSummary = useMemo(() => {
    const base = Math.max(0, Number(quickInvoiceAmount) || 0);
    const config = {
      standard_15: { vatRate: 0.15, tdsRate: 0.07, label: 'Standard Commercial Supply (15% VAT · 7% TDS)' },
      it_5: { vatRate: 0.05, tdsRate: 0.1, label: 'IT Enabled Services / Software (5% VAT · 10% TDS)' },
      procurement_7_5: { vatRate: 0.075, tdsRate: 0.05, label: 'Procurement Provider (7.5% VAT · 5% TDS)' },
      rent_15: { vatRate: 0.15, tdsRate: 0.05, label: 'Commercial Space Rent (15% VAT · 5% TDS)' }
    }[quickSupplyType];
    const vatAmount = Math.round(base * config.vatRate);
    const tdsAmount = Math.round(base * config.tdsRate);
    const netDisbursement = Math.max(0, base - tdsAmount);
    return {
      vatAmount,
      tdsAmount,
      netDisbursement,
      totalWithVat: base + vatAmount,
      label: config.label
    };
  }, [quickInvoiceAmount, quickSupplyType]);

  const practiceDesks = [
    {
      desk: 'Corporate Structuring & Tax Strategy',
      lead: 'Ekramul Islam Khandaker',
      role: 'Founding Member',
      service: 'Integrated Joint Ecosystem Consultation',
      focus: 'Entity formation, strategic tax planning, and multi-regulatory governance',
      deliverables: 'RJSC Incorporation · Holding Structuring · Tax Advisory',
      imgSrc: 'https://i.ibb.co/tTskLmG0/17-removebg-preview.png'
    },
    {
      desk: 'Commercial Law & Litigation',
      lead: 'Advocate Anamul Haque',
      role: 'Founding Member',
      service: 'Corporate Law & RJSC Compliance',
      focus: 'Contract vetting, RJSC compliance, commercial disputes, and regulatory vetting',
      deliverables: 'Shareholders Agreements · High Court & Commercial Vetting',
      imgSrc: 'https://i.ibb.co/GQvnZKpX/13.png'
    },
    {
      desk: 'Audit, IFRS & ACCA Advisory',
      lead: 'Muhammad Abdul Kader ACCA',
      role: 'Senior Consultant',
      service: 'Fractional CFO & Financial Modeling',
      focus: 'Financial reporting, statutory audit readiness, and internal control systems',
      deliverables: 'IFRS Financials · Valuation Models · Internal Audit Controls',
      imgSrc: 'https://i.ibb.co/2YPhyMYW/19.png'
    },
    {
      desk: 'NBR Income Tax & VAT Compliance',
      lead: 'Zohir Uddin',
      role: 'Partner',
      service: 'Corporate Tax, VAT & Statutory Audit',
      focus: 'Corporate & individual tax returns, Mushak compliance, and tribunal defense',
      deliverables: 'Mushak 9.1 Returns · Sec 163 Assessment · Tribunal Defense',
      imgSrc: 'https://i.ibb.co/FLDh8Wcx/3.png'
    }
  ];

  const routeToSpecialistDesk = (service: string, leadName: string) => {
    navigate(
      `/contact?tab=inquiry&service=${encodeURIComponent(service)}&lead=${encodeURIComponent(leadName)}#contact-form-section`
    );
  };

  return (
    <div className="w-full">
      <SEO
        title="Accounticca & E-Lawyers | Bangladesh Corporate Law, NBR Tax, VAT & RJSC Compliance Hub"
        description="Empowering Bangladeshi businesses, startups, and foreign investors with integrated legal governance, NBR tax advisory, RJSC compliance, and fractional CFO leadership."
        canonicalUrl="/"
        keywords={[
          'Compliance Hub Bangladesh',
          'Legal Advisory Dhaka',
          'Tax Consulting Bangladesh',
          'VAT Advisory',
          'RJSC Company Registration',
          'Fractional CFO Services',
          'Accounticca',
          'E-Lawyers'
        ]}
      />

      {/* 1. Hero Section — Editorial Authority + Centered 60% Statutory Search Command Bar */}
      <section className="w-full relative bg-gradient-to-b from-[#fcfaf5] via-white to-slate-50/70 text-slate-900 border-b border-slate-200/90 overflow-hidden pt-10 pb-14 lg:pt-16 lg:pb-20">
        {/* Subtle ambient architectural grid */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-15%] left-[8%] w-[640px] h-[640px] bg-emerald-500/8 rounded-full blur-[130px]" />
          <div className="absolute bottom-[-15%] right-[6%] w-[540px] h-[540px] bg-amber-400/10 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:28px_28px] opacity-30" />
        </div>

        <div className="relative z-10 px-4 sm:px-6 lg:px-10 xl:px-12 max-w-full mx-auto w-full space-y-12">
          {/* Top Editorial Grid: Headline + Featured Briefing Switcher */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* Left Column: Authority Positioning & Primary Actions */}
            <div className="lg:col-span-7 space-y-6">
              {/* Quiet Editorial Kicker (Zero-Pill Discipline) */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>Bangladesh Regulatory &amp; Corporate Intelligence Platform</span>
                <span className="text-slate-300" aria-hidden="true">·</span>
                <span className="font-mono text-slate-500">AY 2026–2027</span>
              </div>

              {/* Main Display Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-black tracking-tight text-slate-950 leading-[1.06]">
                Integrated Corporate Law,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-800 via-teal-700 to-[#9e7a33]">
                  Tax &amp; RJSC Governance
                </span>
              </h1>

              {/* Dual-Practice Attribution Line */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:text-sm text-slate-600 border-y border-slate-200/80 py-3">
                <span className="text-slate-500">Joint Practice Ecosystem by</span>
                <a
                  href="https://elawyersbd.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-extrabold text-slate-900 hover:text-emerald-700 underline decoration-emerald-500/50 underline-offset-4 transition-colors"
                >
                  <span>E-Lawyers</span>
                  <ExternalLink className="w-3 h-3 text-emerald-700" />
                </a>
                <span className="text-slate-300" aria-hidden="true">&amp;</span>
                <a
                  href="https://accounticca.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-extrabold text-slate-900 hover:text-emerald-700 underline decoration-emerald-500/50 underline-offset-4 transition-colors"
                >
                  <span>Accounticca</span>
                  <ExternalLink className="w-3 h-3 text-emerald-700" />
                </a>
                <span className="text-slate-300 hidden sm:inline" aria-hidden="true">·</span>
                <span className="font-semibold text-emerald-800">
                  Supreme Court Advocates, Chartered Tax Practitioners &amp; ACCA Advisors
                </span>
              </div>

              {/* Value Proposition */}
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-2xl font-normal">
                Authoritative statutory analysis, interactive NBR tax and Mushak VAT calculators, and turnkey corporate representation. Built for founders, CFOs, and legal teams navigating the{' '}
                <strong className="font-semibold text-slate-800">Income Tax Act 2023</strong>,{' '}
                <strong className="font-semibold text-slate-800">VAT &amp; SD Act 2012</strong>, and{' '}
                <strong className="font-semibold text-slate-800">Companies Act 1994</strong>.
              </p>

              {/* Key Statutory Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1 border-b border-slate-200/80 pb-6">
                <div>
                  <div className="font-mono text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
                    25+
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                    Interactive Tax &amp; VAT Tools
                  </div>
                </div>
                <div>
                  <div className="font-mono text-2xl sm:text-3xl font-black text-emerald-700 tabular-nums">
                    71
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                    Registration &amp; ID Guides
                  </div>
                </div>
                <div>
                  <div className="font-mono text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
                    21
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                    Advocates &amp; Tax Specialists
                  </div>
                </div>
                <div>
                  <div className="font-mono text-2xl sm:text-3xl font-black text-[#9e7a33] tabular-nums">
                    2026–27
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                    Finance Act Slabs Updated
                  </div>
                </div>
              </div>

              {/* Primary & Secondary CTAs */}
              <div className="flex flex-wrap items-center gap-3.5 pt-1">
                <Link
                  to="/contact"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-3.5 rounded-xl font-bold transition-all flex items-center gap-2.5 shadow-sm text-sm sm:text-base"
                >
                  <span>Book Legal &amp; Tax Consultation</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/tools"
                  className="bg-white hover:bg-slate-50 border border-slate-300 hover:border-emerald-600 text-slate-900 px-6 py-3.5 rounded-xl font-bold transition-all flex items-center gap-2 text-sm sm:text-base"
                >
                  <Calculator className="w-4 h-4 text-emerald-700" />
                  <span>Explore Compliance Tools</span>
                </Link>
                <Link
                  to="/services"
                  className="text-xs sm:text-sm font-bold text-slate-600 hover:text-emerald-800 px-3 py-2 inline-flex items-center gap-1 transition-colors"
                >
                  <span>View Service Architecture</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right Column: Top 3 Recent Articles Switcher & Practice Pillars */}
            <div className="lg:col-span-5 space-y-4">
              {currentHeroArticle && (
                <div className="bg-white border border-slate-200/90 p-6 sm:p-7 rounded-3xl shadow-sm">
                  {/* Header: Interactive Recent Insights Tabs (1 to 3) & Navigation */}
                  <div className="flex items-center justify-between gap-2 mb-5">
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                      {heroRecentArticles.map((article, idx) => (
                        <button
                          key={article.id}
                          type="button"
                          onClick={() => setHeroArticleIndex(idx)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            heroArticleIndex === idx
                              ? 'bg-emerald-700 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title={`View recent dispatch ${idx + 1}`}
                        >
                          <span>Dispatch 0{idx + 1}</span>
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setHeroArticleIndex((prev) =>
                            prev > 0 ? prev - 1 : heroRecentArticles.length - 1
                          )
                        }
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                        aria-label="Previous article"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setHeroArticleIndex((prev) =>
                            prev < heroRecentArticles.length - 1 ? prev + 1 : 0
                          )
                        }
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                        aria-label="Next article"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <Link
                    to={`/article/${currentHeroArticle.id}`}
                    className="group/link flex flex-col"
                  >
                    {/* Unboxed Metadata Line */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2.5">
                      <span className="font-bold text-emerald-700 uppercase tracking-wider">
                        {currentHeroArticle.category || 'Statutory Dispatch'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">
                        {calculateReadingTime(currentHeroArticle.content)} min read
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {currentHeroArticle.publishedAt
                          ? format(new Date(currentHeroArticle.publishedAt), 'MMM d, yyyy')
                          : 'Updated'}
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2.5 leading-snug group-hover/link:text-emerald-700 transition-colors line-clamp-2">
                      {currentHeroArticle.title}
                    </h2>

                    <p className="text-slate-600 text-xs sm:text-sm mb-5 line-clamp-2 leading-relaxed">
                      {currentHeroArticle.excerpt}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={currentHeroArticle.author.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                          alt={currentHeroArticle.author.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {currentHeroArticle.author.name}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {currentHeroArticle.author.role || 'Editorial Board'}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 group-hover/link:translate-x-0.5 transition-transform">
                        <span>Read Dispatch</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </span>
                    </div>
                  </Link>

                  {/* Compact Selector for Top 3 Recent Dispatches */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-1">
                    {heroRecentArticles.map((article, idx) => (
                      <button
                        key={article.id}
                        type="button"
                        onClick={() => setHeroArticleIndex(idx)}
                        className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                          heroArticleIndex === idx
                            ? 'bg-emerald-50/90 text-emerald-950 font-bold'
                            : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span className="truncate pr-2 flex items-center gap-2">
                          <span className="font-mono text-emerald-700 font-bold shrink-0">
                            0{idx + 1}.
                          </span>
                          <span className="truncate">{article.title}</span>
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 shrink-0">
                          {format(new Date(article.publishedAt), 'MMM d')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Three Practice Pillar Navigation Cards */}
              <div className="grid grid-cols-3 gap-3">
                <Link
                  to="/article/company-reg"
                  className="bg-white border border-slate-200/90 rounded-2xl p-3.5 hover:border-emerald-500 transition-colors group"
                >
                  <Landmark className="w-4 h-4 text-emerald-700 mb-1.5" />
                  <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                    RJSC &amp; Corporate
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">MOA, Form XII &amp; AGM</div>
                </Link>
                <Link
                  to="/tax-calculator"
                  className="bg-white border border-slate-200/90 rounded-2xl p-3.5 hover:border-emerald-500 transition-colors group"
                >
                  <Calculator className="w-4 h-4 text-emerald-700 mb-1.5" />
                  <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                    Income Tax 2023
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Slabs, Sec 78 &amp; 163</div>
                </Link>
                <Link
                  to="/vat-guide"
                  className="bg-white border border-slate-200/90 rounded-2xl p-3.5 hover:border-emerald-500 transition-colors group"
                >
                  <Scale className="w-4 h-4 text-emerald-700 mb-1.5" />
                  <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                    VAT &amp; Withholding
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Mushak 6.3 &amp; 9.1</div>
                </Link>
              </div>
            </div>
          </div>

          {/* Centered 60% Display-Width Statutory Search & Quick Command Bar */}
          <div className="app-form-60 w-full lg:w-[60vw] mx-auto pt-2">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-md relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <label
                  htmlFor="hero-statutory-search"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2"
                >
                  <Search className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Search Statutory Guides, NBR Sections, Mushak Forms &amp; Calculators</span>
                </label>
                <span className="text-[11px] font-mono text-slate-400">
                  ITA 2023 · VAT Act 2012 · Companies Act 1994
                </span>
              </div>

              <form
                className="w-full relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setShowHeroSuggestions(false);
                  if (heroSearchQuery.trim()) {
                    navigate(`/search?q=${encodeURIComponent(heroSearchQuery.trim())}`);
                  } else {
                    navigate('/search');
                  }
                }}
              >
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-slate-400 left-4 top-1/2 -translate-y-1/2 absolute pointer-events-none" />
                  <input
                    id="hero-statutory-search"
                    name="search"
                    type="text"
                    value={heroSearchQuery}
                    onFocus={() => setShowHeroSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowHeroSuggestions(false), 180)}
                    onChange={(e) => {
                      setHeroSearchQuery(e.target.value);
                      setShowHeroSuggestions(true);
                    }}
                    placeholder="Try 'Section 78 rebate', 'Mushak 6.3 input tax', 'RJSC Form XII', 'TDS rate'..."
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none text-sm sm:text-base font-medium transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-emerald-700 text-white font-bold px-7 py-3.5 rounded-2xl text-sm transition-colors shrink-0 cursor-pointer"
                >
                  Search Hub
                </button>
              </form>

              {/* Live Autocomplete Dropdown */}
              {showHeroSuggestions && heroSearchSuggestions.length > 0 && (
                <div className="mt-2 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden divide-y divide-slate-100">
                  {heroSearchSuggestions.map((item) => (
                    <Link
                      key={item.id}
                      to={`/article/${item.id}`}
                      className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-emerald-50/60 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {item.category} · {calculateReadingTime(item.content)} min read
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-emerald-700 shrink-0" />
                    </Link>
                  ))}
                </div>
              )}

              {/* Quick Tool Launch Bar */}
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-3.5 border-t border-slate-100">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mr-1">
                  Direct Tools:
                </span>
                <Link
                  to="/tax-calculator"
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 transition-colors"
                >
                  Income Tax Calculator 2026–27
                </Link>
                <Link
                  to="/tools/vat-apportionment-calculator"
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 transition-colors"
                >
                  VAT Apportionment (Sec 47)
                </Link>
                <Link
                  to="/tds-guide"
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 transition-colors"
                >
                  TDS &amp; VDS Rate Matrix
                </Link>
                <Link
                  to="/corporate-planner"
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 transition-colors"
                >
                  Corporate Tax Planner
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Instant Statutory Estimator (Centered 60% Display Width Form) */}
      <section className="w-full py-12 px-4 sm:px-6 lg:px-10 xl:px-12 bg-white border-b border-slate-200/80">
        <div className="app-form-60 w-full lg:w-[60vw] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Instant Statutory Workbench · FY 2026–2027
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                Quick Tax, VAT &amp; Withholding Estimator
              </h2>
            </div>

            {/* Interactive Mode Switcher */}
            <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setEstimatorMode('personal_tax')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  estimatorMode === 'personal_tax'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Personal Income Tax
              </button>
              <button
                type="button"
                onClick={() => setEstimatorMode('vat_tds')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  estimatorMode === 'vat_tds'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Commercial VAT &amp; TDS
              </button>
            </div>
          </div>

          <div className="bg-slate-50/70 rounded-3xl border border-slate-200/90 p-6 sm:p-8">
            {estimatorMode === 'personal_tax' ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="home-quick-income"
                      className="block text-xs font-bold text-slate-700 mb-2"
                    >
                      Annual Assessable Income (BDT)
                    </label>
                    <input
                      id="home-quick-income"
                      type="number"
                      min="0"
                      step="50000"
                      value={quickIncome}
                      onChange={(e) => setQuickIncome(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="home-quick-category"
                      className="block text-xs font-bold text-slate-700 mb-2"
                    >
                      Taxpayer Assessment Category
                    </label>
                    <select
                      id="home-quick-category"
                      value={quickTaxCategory}
                      onChange={(e) =>
                        setQuickTaxCategory(e.target.value as 'general' | 'female_senior')
                      }
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                    >
                      <option value="general">General Individual (Threshold: BDT 3,50,000)</option>
                      <option value="female_senior">
                        Female / Senior Citizen 65+ (Threshold: BDT 4,00,000)
                      </option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-200/80">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80">
                    <div className="text-[11px] text-slate-500 font-medium">Taxable Income</div>
                    <div className="font-mono text-base sm:text-lg font-black text-slate-900 mt-1 tabular-nums">
                      ৳{quickTaxSummary.taxableIncome.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80">
                    <div className="text-[11px] text-slate-500 font-medium">Slab Gross Tax</div>
                    <div className="font-mono text-base sm:text-lg font-black text-slate-900 mt-1 tabular-nums">
                      ৳{quickTaxSummary.grossTax.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80">
                    <div className="text-[11px] text-slate-500 font-medium">Max Sec 78 Rebate</div>
                    <div className="font-mono text-base sm:text-lg font-black text-emerald-700 mt-1 tabular-nums">
                      -৳{quickTaxSummary.maxRebate.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="bg-emerald-900 text-white p-4 rounded-2xl">
                    <div className="text-[11px] text-emerald-200 font-medium">Est. Net Tax</div>
                    <div className="font-mono text-base sm:text-lg font-black text-white mt-1 tabular-nums">
                      ৳{quickTaxSummary.netPayable.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500">
                  <span>
                    Computed under Finance Act 2026 progressive slabs &amp; Sec 163 minimum tax rules.
                  </span>
                  <Link
                    to="/tax-calculator"
                    className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-900"
                  >
                    <span>Open Full Tax &amp; Rebate Calculator</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="home-quick-invoice"
                      className="block text-xs font-bold text-slate-700 mb-2"
                    >
                      Base Vendor Invoice Amount (BDT, Excl. VAT)
                    </label>
                    <input
                      id="home-quick-invoice"
                      type="number"
                      min="0"
                      step="10000"
                      value={quickInvoiceAmount}
                      onChange={(e) => setQuickInvoiceAmount(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="home-quick-supply"
                      className="block text-xs font-bold text-slate-700 mb-2"
                    >
                      Statutory Supply Classification
                    </label>
                    <select
                      id="home-quick-supply"
                      value={quickSupplyType}
                      onChange={(e) =>
                        setQuickSupplyType(
                          e.target.value as
                            | 'standard_15'
                            | 'it_5'
                            | 'procurement_7_5'
                            | 'rent_15'
                        )
                      }
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                    >
                      <option value="standard_15">
                        Standard Commercial Supply (15% VAT · 7% TDS)
                      </option>
                      <option value="it_5">
                        IT Enabled Services / Software (5% VAT · 10% TDS)
                      </option>
                      <option value="procurement_7_5">
                        Procurement Provider (7.5% VDS · 5% TDS)
                      </option>
                      <option value="rent_15">
                        Commercial Space &amp; Office Rent (15% VAT · 5% TDS)
                      </option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-200/80">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80">
                    <div className="text-[11px] text-slate-500 font-medium">Mushak 6.3 VAT</div>
                    <div className="font-mono text-base sm:text-lg font-black text-slate-900 mt-1 tabular-nums">
                      ৳{quickVatTdsSummary.vatAmount.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80">
                    <div className="text-[11px] text-slate-500 font-medium">Source TDS Deduction</div>
                    <div className="font-mono text-base sm:text-lg font-black text-amber-700 mt-1 tabular-nums">
                      ৳{quickVatTdsSummary.tdsAmount.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80">
                    <div className="text-[11px] text-slate-500 font-medium">Net Payable to Vendor</div>
                    <div className="font-mono text-base sm:text-lg font-black text-emerald-700 mt-1 tabular-nums">
                      ৳{quickVatTdsSummary.netDisbursement.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="bg-slate-900 text-white p-4 rounded-2xl">
                    <div className="text-[11px] text-slate-300 font-medium">Total Gross Outlay</div>
                    <div className="font-mono text-base sm:text-lg font-black text-white mt-1 tabular-nums">
                      ৳{quickVatTdsSummary.totalWithVat.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500">
                  <span>{quickVatTdsSummary.label} · Requires valid Mushak 6.3 &amp; PSR proof.</span>
                  <Link
                    to="/tds-guide"
                    className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-900"
                  >
                    <span>Explore Complete TDS &amp; VDS Rate Schedule</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. Careers Highlight Section — E-Lawyers */}
      <section className="careers-section w-full py-10 sm:py-14 px-4 sm:px-6 lg:px-10 xl:px-12 bg-[#f8fafc] border-b border-slate-200/80">
        <div className="w-full max-w-full mx-auto">
          <div className="relative rounded-3xl overflow-hidden shadow-sm border border-[#c7a76b]/50 bg-gradient-to-br from-white via-[#fdfaf3] to-emerald-50/40">
            <div className="relative z-10 p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                {/* LEFT: Copy + CTA */}
                <div className="lg:w-[52%]">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>Active Recruitment · 4 Career Tracks Open</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-[1.15] mb-3">
                    Build Your Career at{' '}
                    <span className="bg-gradient-to-r from-[#9e7a33] via-[#b89249] to-[#8a6824] bg-clip-text text-transparent">
                      E-Lawyers
                    </span>
                  </h2>

                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-5 max-w-md">
                    Join a premier corporate legal &amp; business consultancy in Dhaka. 4 career tracks now open for fresh graduates &amp; experienced professionals.
                  </p>

                  <div className="flex flex-wrap items-center gap-4">
                    <Link
                      to="/Careers"
                      className="group inline-flex items-center gap-2 px-5 py-3 bg-[#c7a76b] hover:bg-[#b89658] text-[#10243a] font-black text-sm rounded-xl shadow-xs transition-all"
                    >
                      <span>Explore All Careers</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                      Application Deadline: Oct 31, 2026
                    </span>
                  </div>
                </div>

                {/* RIGHT: 4 Role Mini-Cards */}
                <div className="lg:w-[48%]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Link
                      to="/Careers/mto"
                      className="group flex items-center gap-3 p-3.5 rounded-2xl bg-white hover:bg-amber-50/40 border border-slate-200/90 hover:border-amber-400/80 transition-all"
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center flex-shrink-0">
                        <Award className="w-5 h-5 text-amber-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 truncate">MTO Trainee</div>
                        <div className="text-[11px] text-[#9e7a33] font-medium truncate">
                          Multiple Openings
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#9e7a33] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </Link>

                    <Link
                      to="/Careers/sales-marketing"
                      className="group flex items-center gap-3 p-3.5 rounded-2xl bg-white hover:bg-emerald-50/40 border border-slate-200/90 hover:border-emerald-400/80 transition-all"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-emerald-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          Sales &amp; Marketing
                        </div>
                        <div className="text-[11px] text-emerald-700 font-medium truncate">
                          Multiple Openings
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </Link>

                    <Link
                      to="/Careers/accountant"
                      className="group flex items-center gap-3 p-3.5 rounded-2xl bg-white hover:bg-teal-50/40 border border-slate-200/90 hover:border-teal-400/80 transition-all"
                    >
                      <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-center flex-shrink-0">
                        <Calculator className="w-5 h-5 text-teal-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 truncate">Accountant</div>
                        <div className="text-[11px] text-teal-700 font-medium truncate">
                          ২ জন (Accounts Division)
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </Link>

                    <Link
                      to="/Careers/customer-care"
                      className="group flex items-center gap-3 p-3.5 rounded-2xl bg-white hover:bg-amber-50/40 border border-slate-200/90 hover:border-[#c7a76b] transition-all"
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-100/70 border border-amber-300/80 flex items-center justify-center flex-shrink-0">
                        <UserCheck className="w-5 h-5 text-[#8a6824]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 truncate">Customer Care</div>
                        <div className="text-[11px] text-[#9e7a33] font-medium truncate">
                          ২ জন (Female Only)
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#9e7a33] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-[#9e7a33]" />
                  Panthapath, Dhaka · Full-Time In-Person Positions
                </span>
                <Link
                  to="/Careers#check-status"
                  className="text-[#9e7a33] font-bold hover:text-emerald-700 flex items-center gap-1 transition-colors"
                >
                  <span>Already applied? Check Live Application Status</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Latest Articles & Statutory Precedents */}
      <section className="w-full py-12 px-4 sm:px-6 lg:px-10 xl:px-12 max-w-full mx-auto">
        <div className="relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1.5">
                Statutory &amp; Regulatory Dispatches
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
                Latest Articles &amp; Precedents
              </h2>
              <p className="text-slate-500 text-sm sm:text-base max-w-2xl font-normal leading-relaxed">
                Expert legal analysis, NBR tax codes, corporate governance mandates, and procedural checklists for Bangladesh.
              </p>
            </div>

            <Link
              to="/search"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 px-4 py-2.5 rounded-xl transition-all group shrink-0 self-start md:self-auto"
            >
              <span>Explore All Articles</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Interactive Category Filter Controls */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-8 no-scrollbar">
            {[
              { id: 'all', label: 'All Updates' },
              { id: 'tax', label: 'Income Tax' },
              { id: 'corporate', label: 'Corporate Law' },
              { id: 'vat', label: 'VAT & Customs' },
              { id: 'compliance', label: 'Compliance' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setLatestArticlesCategory(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  latestArticlesCategory === tab.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 4-Column x 2-Row Articles Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {displayLatestArticles.map((article) => (
              <Link
                key={article.id}
                to={`/article/${article.id}`}
                className="group bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-500/60 hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden h-full"
              >
                <div className="aspect-[16/10] w-full overflow-hidden relative bg-slate-100">
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                </div>

                <div className="p-4 sm:p-5 flex-1 flex flex-col">
                  {/* Unboxed Metadata Row */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-2">
                    <span className="font-bold text-emerald-700 uppercase tracking-wider truncate">
                      {article.category}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono shrink-0">
                      {calculateReadingTime(article.content)} min read
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
                    {article.title}
                  </h3>
                  <p className="text-slate-500 text-xs mb-4 line-clamp-2 leading-relaxed flex-1 font-normal">
                    {article.excerpt}
                  </p>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-auto">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={article.author.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                        alt={article.author.name}
                        className="w-7 h-7 rounded-full border border-slate-200 object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate max-w-[100px]">
                          {article.author.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {format(new Date(article.publishedAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <BookmarkButton
                        id={article.id}
                        title={article.title}
                        url={`/article/${article.id}`}
                        className="text-slate-400 hover:text-emerald-600 transition-colors p-1"
                      />
                      <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 transition-colors" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Curated Statutory & Compliance Guides Directory with Instant Filter */}
      <section className="w-full mx-auto max-w-full px-4 py-8 sm:px-6 lg:px-10 xl:px-12">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-2xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Comprehensive Reference Directory</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Essential Bangladesh Tax, VAT &amp; Corporate Compliance Guides
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={guideSearchQuery}
                  onChange={(e) => setGuideSearchQuery(e.target.value)}
                  placeholder="Filter 12 core guides..."
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                />
              </div>
              <button
                type="button"
                onClick={handleRefreshGuides}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGuides ? 'animate-spin' : ''}`} />
                <span>Reset</span>
              </button>
              <Link
                to="/tools"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
              >
                <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                <span>All Tools Hub</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGuides.map((guide, index) => (
              <Link
                key={guide.path}
                to={guide.path}
                className="group p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-emerald-500/60 hover:shadow-xs transition-all flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 mb-2">
                    <span className="font-bold text-emerald-800">
                      0{index + 1 < 10 ? index + 1 : ''}{index + 1 >= 10 ? index + 1 : ''}. {guide.category}
                    </span>
                    <span className="font-mono text-slate-400">
                      {guide.statRef} · {guide.readTime}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug">
                    {guide.title}
                  </h3>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 pt-2 border-t border-slate-200/60">
                  <span>Read Full Statutory Guide</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Specialist Practice Desks Routing Strip */}
      <section className="w-full mx-auto max-w-full px-4 py-6 sm:px-6 lg:px-10 xl:px-12">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Practice Leadership Routing
              </p>
              <h2 className="mt-1 text-xl sm:text-2xl font-bold text-slate-950">
                Route your inquiry directly to a specialist partner desk
              </h2>
            </div>
            <Link
              to="/team"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950"
            >
              <span>Meet all 21 team members</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {practiceDesks.map((item) => (
              <article
                key={item.lead}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 hover:bg-white hover:border-emerald-400 transition"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={item.imgSrc}
                      alt={item.lead}
                      loading="lazy"
                      className="h-12 w-12 rounded-full object-cover object-top border border-slate-200 bg-white shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{item.lead}</h3>
                      <p className="text-xs font-medium text-emerald-700">{item.role}</p>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-slate-900 mb-1">{item.desk}</p>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">{item.focus}</p>
                  <p className="text-[11px] font-mono text-slate-600 border-t border-slate-200/70 pt-2.5 mb-4">
                    {item.deliverables}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => routeToSpecialistDesk(item.service, item.lead)}
                  className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-emerald-700 text-emerald-800 hover:text-white border border-slate-200 hover:border-emerald-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Route Brief to Desk</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Academy Highlight Section — Accounticca Academy & Regulatory Change Watch */}
      <section className="w-full py-10 sm:py-14 px-4 sm:px-6 lg:px-10 xl:px-12 bg-white border-y border-slate-200/80">
        <div className="w-full max-w-full mx-auto">
          <div className="relative rounded-3xl overflow-hidden shadow-sm border border-emerald-200 bg-gradient-to-br from-emerald-50/60 via-teal-50/30 to-white">
            <div className="relative z-10 p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                <div className="lg:w-[52%]">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>Live Cohorts Enrolling · CPD &amp; Professional Syllabus</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-[1.15] mb-3">
                    Accelerate Skills at{' '}
                    <span className="text-emerald-700">Accounticca Academy</span>
                  </h2>

                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-5 max-w-md">
                    Practical practitioner-led training in Bangladesh Income Tax, VAT &amp; SD Act 2012, RJSC corporate governance, and hands-on e-Return filing.
                  </p>

                  <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                    <Link
                      to="/training"
                      className="group inline-flex items-center gap-2 px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-xs transition-all"
                    >
                      <span>Explore All Courses</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      to="/contact?tab=inquiry#inquiry"
                      className="group inline-flex items-center gap-1.5 px-4 py-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-sm rounded-xl transition-all"
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      <span>Send an inquiry</span>
                    </Link>
                    <Link
                      to="/contact?tab=appointment"
                      className="group inline-flex items-center gap-1.5 px-4 py-3 bg-emerald-100/90 hover:bg-emerald-200 border border-emerald-300 text-emerald-900 font-bold text-sm rounded-xl transition-all"
                    >
                      <CalendarIcon className="w-4 h-4 text-emerald-700" />
                      <span>Book appointment</span>
                    </Link>
                  </div>
                </div>

                <div className="lg:w-[48%]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Link
                      to="/training"
                      className="group flex items-center gap-3 p-3.5 rounded-2xl bg-white hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 transition-all"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center flex-shrink-0">
                        <Calculator className="w-5 h-5 text-emerald-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          Personal Income Tax
                        </div>
                        <div className="text-[11px] text-emerald-700 font-medium truncate">
                          Live Cohort · e-Return Filing
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </Link>

                    <Link
                      to="/training"
                      className="group flex items-center gap-3 p-3.5 rounded-2xl bg-white hover:bg-cyan-50/70 border border-slate-200 hover:border-cyan-300 transition-all"
                    >
                      <div className="w-10 h-10 rounded-xl bg-cyan-100 border border-cyan-200 text-cyan-700 flex items-center justify-center flex-shrink-0">
                        <FileCheck className="w-5 h-5 text-cyan-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          VAT &amp; SD Masterclass
                        </div>
                        <div className="text-[11px] text-cyan-700 font-medium truncate">
                          Mushak 6.3 &amp; Withholding
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </Link>

                    <Link
                      to="/training"
                      className="group flex items-center gap-3 p-3.5 rounded-2xl bg-white hover:bg-amber-50/70 border border-slate-200 hover:border-amber-300 transition-all"
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-amber-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          RJSC &amp; Secretarial
                        </div>
                        <div className="text-[11px] text-amber-700 font-medium truncate">
                          Incorporation &amp; Compliance
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </Link>

                    <Link
                      to="/training"
                      className="group flex items-center gap-3 p-3.5 rounded-2xl bg-white hover:bg-teal-50/70 border border-slate-200 hover:border-teal-300 transition-all"
                    >
                      <div className="w-10 h-10 rounded-xl bg-teal-100 border border-teal-200 text-teal-700 flex items-center justify-center flex-shrink-0">
                        <Award className="w-5 h-5 text-teal-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          Practical Accounting
                        </div>
                        <div className="text-[11px] text-teal-700 font-medium truncate">
                          IFRS, Excel &amp; Tax Audit
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Featured Insights Grid / Carousel: Recent Regulatory Changes */}
              <div className="mt-8 pt-7 border-t border-emerald-200/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
                      Featured Insights · Regulatory Change Watch
                    </p>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                      Recent Statutory &amp; Regulatory Changes in Bangladesh
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <div className="inline-flex items-center bg-white p-1 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setInsightsViewMode('grid')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          insightsViewMode === 'grid'
                            ? 'bg-emerald-700 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Grid View
                      </button>
                      <button
                        type="button"
                        onClick={() => setInsightsViewMode('carousel')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          insightsViewMode === 'carousel'
                            ? 'bg-emerald-700 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Carousel
                      </button>
                    </div>

                    {insightsViewMode === 'carousel' && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setFeaturedInsightIndex((prev) =>
                              prev > 0 ? prev - 1 : featuredRegulatoryInsights.length - 1
                            )
                          }
                          className="w-8 h-8 rounded-xl bg-white hover:bg-emerald-50 text-slate-700 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                          aria-label="Previous regulatory insight"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFeaturedInsightIndex((prev) =>
                              prev < featuredRegulatoryInsights.length - 1 ? prev + 1 : 0
                            )
                          }
                          className="w-8 h-8 rounded-xl bg-white hover:bg-emerald-50 text-slate-700 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                          aria-label="Next regulatory insight"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {insightsViewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {featuredRegulatoryInsights.map((insight) => (
                      <div
                        key={insight.id}
                        className="bg-white/95 rounded-2xl border border-slate-200/90 hover:border-emerald-500/60 p-4 flex flex-col justify-between gap-3 transition-all"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                            <span className="font-bold text-emerald-800 truncate">
                              {insight.badge}
                            </span>
                            <span className="font-semibold text-amber-700 shrink-0">
                              {insight.impactLevel}
                            </span>
                          </div>

                          <Link
                            to={insight.articlePath}
                            className="block text-sm font-extrabold text-slate-900 hover:text-emerald-700 transition-colors leading-snug line-clamp-2"
                          >
                            {insight.title}
                          </Link>

                          <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                            {insight.summary}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                            <span className="truncate">{insight.statReference}</span>
                            <span className="shrink-0 font-semibold text-emerald-700">
                              {insight.effectiveDate}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1">
                            <Link
                              to={insight.articlePath}
                              className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700 hover:text-emerald-900 transition-colors"
                            >
                              <span>Read Briefing</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                            <Link
                              to={insight.toolPath}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-700 text-slate-700 hover:text-white text-[11px] font-bold transition-colors"
                            >
                              <span>{insight.toolLabel}</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-emerald-200 p-5 sm:p-6">
                    {(() => {
                      const activeInsight =
                        featuredRegulatoryInsights[featuredInsightIndex] ||
                        featuredRegulatoryInsights[0];
                      return (
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                          <div className="space-y-2.5 max-w-3xl">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              <span className="font-bold text-emerald-800">
                                {activeInsight.badge}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="font-semibold text-amber-700">
                                {activeInsight.impactLevel}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono">
                                {activeInsight.statReference} ({activeInsight.effectiveDate})
                              </span>
                            </div>

                            <h4 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                              {activeInsight.title}
                            </h4>

                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                              {activeInsight.summary}
                            </p>
                          </div>

                          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
                            <Link
                              to={activeInsight.articlePath}
                              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold transition-all"
                            >
                              <span>Read Full Regulatory Brief</span>
                              <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                              to={activeInsight.toolPath}
                              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold transition-all"
                            >
                              <Calculator className="w-3.5 h-3.5 text-emerald-700" />
                              <span>{activeInsight.toolLabel}</span>
                            </Link>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {featuredRegulatoryInsights.map((item, idx) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setFeaturedInsightIndex(idx)}
                            className={`h-2 rounded-full transition-all cursor-pointer ${
                              featuredInsightIndex === idx
                                ? 'w-7 bg-emerald-700'
                                : 'w-2 bg-slate-300 hover:bg-slate-400'
                            }`}
                            aria-label={`Select insight ${idx + 1}`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">
                        Insight 0{featuredInsightIndex + 1} of 0
                        {featuredRegulatoryInsights.length}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  Interactive Live Cohorts · Practical Case Studies · Verifiable Completion Certificates
                </span>
                <Link
                  to="/verify-certificate"
                  className="text-emerald-800 font-bold hover:text-emerald-950 flex items-center gap-1 transition-colors"
                >
                  <span>Verify an Academy Certificate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Featured Compliance Products, Courses & Digital Toolkits */}
      <section className="w-full mx-auto max-w-full px-4 py-10 sm:px-6 lg:px-10 xl:px-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
              Digital Compliance Store &amp; Academy
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              Featured Products, Courses &amp; Statutory Toolkits
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Instant-access tax calculation workbooks, corporate legal kits, and certified training courses. Verified purchases automatically unlock across all pages for your User ID.
            </p>
          </div>
          <Link
            to="/tools"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors self-start sm:self-auto shrink-0"
          >
            <span>Explore All Compliance Tools</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {SHOP_PRODUCTS.slice(0, 4).map((product: ShopProduct) => {
            const owned = isPurchased(product.id) || isPurchased(product.slug);
            return (
              <div
                key={product.id}
                className={`bg-white rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                  owned
                    ? 'border-emerald-300 ring-1 ring-emerald-500/20'
                    : 'border-slate-200/90 hover:border-emerald-400'
                }`}
              >
                <div className="space-y-3.5">
                  <div className="relative h-36 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60">
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
                      {product.category}
                    </div>
                    <Link
                      to={`/shop/${product.slug}`}
                      className="font-bold text-sm sm:text-base text-slate-900 hover:text-emerald-700 transition-colors line-clamp-2 leading-snug"
                    >
                      {product.title}
                    </Link>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1.5 leading-relaxed">
                      {product.shortDescription}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-500">{product.format}</span>
                    <span className="font-mono text-base font-black text-slate-900 tabular-nums">
                      BDT {product.price.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <ProductPurchaseActions
                    product={product}
                    productId={product.id}
                    productSlug={product.slug}
                    variant="card"
                    isAdded={addedProductId === product.id}
                    onAddToCart={() => {
                      if (isPurchased(product.id) || isPendingPurchase(product.id)) return;
                      addToCart(product, 1);
                      setAddedProductId(product.id);
                      setTimeout(() => setAddedProductId(null), 1600);
                    }}
                    onBuyNow={() => {
                      if (isPurchased(product.id) || isPendingPurchase(product.id)) {
                        navigate('/client-portal');
                        return;
                      }
                      navigate(`/checkout?product=${encodeURIComponent(product.slug)}&qty=1`);
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 9. Community Expert Panelists & Discussion Section */}
      <section className="w-full mx-auto max-w-full px-4 py-10 sm:px-6 lg:px-10 xl:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
              <div>
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Community Q&amp;A
                </p>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                  Recent Tax &amp; Legal Discussions
                </h2>
              </div>
              <Link
                to="/community"
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
              >
                <span>View Forum</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-4">
              {INITIAL_QUESTIONS.slice(0, 3).map((q) => (
                <Link
                  key={q.id}
                  to="/community"
                  className="block bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-emerald-400 transition-colors space-y-2.5"
                >
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-bold text-emerald-800">{q.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{q.time}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 hover:text-emerald-700 transition-colors">
                    {q.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{q.content}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">Asked by {q.author.name}</span>
                    <span className="font-mono text-emerald-700 font-bold">
                      {q.answersCount} Answers
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <aside className="bg-white p-6 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                    Verified Panelists
                  </p>
                  <h3 className="mt-0.5 text-base font-bold text-slate-900 sm:text-lg">
                    Top Legal &amp; Tax Contributors
                  </h3>
                </div>
                <Link
                  to="/community?tab=experts"
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                >
                  All Experts
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>

              <div className="my-2 divide-y divide-slate-100">
                {INITIAL_EXPERTS.slice(0, 3).map((expert) => (
                  <article key={expert.id} className="flex items-start gap-3.5 py-4">
                    <img
                      src={expert.avatar}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 object-cover"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="truncate text-sm font-bold text-slate-900">{expert.name}</h4>
                        <span className="inline-flex shrink-0 items-center gap-1 font-mono text-xs font-bold tabular-nums text-amber-600">
                          <Star
                            className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                            aria-hidden="true"
                          />
                          {expert.rating.toFixed(1)}
                        </span>
                      </div>

                      <p className="mt-0.5 truncate text-xs font-semibold text-emerald-700">
                        {expert.role}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-slate-500">
                        {expert.credentials}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] tabular-nums text-slate-500">
                        <span>{expert.experience} exp</span>
                        <span aria-hidden="true">·</span>
                        <span>{expert.answersCount} answers</span>
                        <span aria-hidden="true">·</span>
                        <span>{expert.helpfulVotes} helpful votes</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="mt-2 space-y-4 border-t border-slate-100 pt-4">
              <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                <div>
                  <p className="font-mono text-base font-extrabold tabular-nums text-slate-900">
                    50+
                  </p>
                  <p className="text-[11px] text-slate-500">Verified Experts</p>
                </div>
                <div className="border-x border-slate-200">
                  <p className="font-mono text-base font-extrabold tabular-nums text-emerald-700">
                    1,200+
                  </p>
                  <p className="text-[11px] text-slate-500">Solved Inquiries</p>
                </div>
                <div>
                  <p className="font-mono text-base font-extrabold tabular-nums text-slate-900">
                    24h
                  </p>
                  <p className="text-[11px] text-slate-500">Avg. Response</p>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 sm:flex-row">
                <Link
                  to="/community"
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-emerald-800"
                >
                  Visit Community Forum
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
                <Link
                  to="/community?tab=experts"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                >
                  <UserCheck className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                  Meet Experts
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* 10. Inquiry and appointment intake (Centered 60% Display Width Form) */}
      <QuickContactSection />

      {/* 11. Client testimonials */}
      <section className="mx-auto mb-10 mt-2 w-full max-w-full rounded-3xl border-t border-slate-200/70 bg-slate-50/80 px-4 py-10 sm:px-6 lg:px-10 xl:px-12">
        <Testimonials
          variant="carousel"
          title="Client Trust & Verified Success Stories"
          subtitle="See how leading Bangladeshi enterprises, startups, and CFOs rely on Accounticca and E-Lawyers for corporate governance, RJSC filings, and NBR tax strategy."
        />
      </section>
    </div>
  );
}

export default Home;
