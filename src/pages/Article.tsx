import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { mockArticles, categories } from '../data/mockData';
import { format } from 'date-fns';
import { calculateReadingTime } from '../utils/readingTime';
import { Bookmark, Clock, MessageCircle, Share2, ThumbsUp, Printer, Award, Facebook, Twitter, Linkedin, Link as LinkIcon, Search, ChevronRight, ChevronDown, ChevronUp, User, Calendar, Briefcase, FileText, ExternalLink, Loader2, ImageOff, Check, ShieldCheck, Maximize2, Minimize2, Sparkles, Columns3 } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { DocumentChecklist } from '../components/DocumentChecklist';
import React from 'react';
import { ReadProgress } from '../components/ReadProgress';
import { ArticleReadingProgress } from '../components/ArticleReadingProgress';
import { ReadAloudButton } from '../components/ReadAloudButton';
import { ChecklistExporter } from '../components/ChecklistExporter';
import { SocialShareButtons } from '../components/SocialShareButtons';
import { useAuth } from '../contexts/AuthContext';
import { useBookmarks } from '../contexts/BookmarkContext';
import { useFocusMode } from '../contexts/FocusModeContext';
import { FocusModeReaderBar } from '../components/article/FocusModeReaderBar';
import { QuoteCardGeneratorModal } from '../components/article/QuoteCardGeneratorModal';

import { ComplianceChecklist } from '../components/ComplianceChecklist';
import { ImageCarousel } from '../components/ImageCarousel';
import { useImageLoader } from '../hooks/useImageLoader';
import { MarkdownImage } from '../components/MarkdownImage';
import {
  ArticleNavigator,
  extractTextFromReactNode,
  parseMarkdownHeadings,
  slugifyHeadingText
} from '../components/ArticleNavigator';
import { LegalAlertBanner } from '../components/LegalAlertBanner';
import { PenaltyFlowchart } from '../components/PenaltyFlowchart';
import { Section272Checklist as Section272ComplianceChecklist } from '../components/Section272Checklist';
import { Section46ReferenceTable } from '../components/Section46ReferenceTable';
import { Section46ScenarioSelector } from '../components/Section46ScenarioSelector';
import { RelatedArticles, getRecommendedArticles } from '../components/RelatedArticles';
import { NewsletterSignup } from '../components/NewsletterSignup';
import { InteractiveChecklistItem } from '../components/InteractiveChecklistItem';

import { useLanguage } from '../contexts/LanguageContext';

import { SortableTable } from '../components/SortableTable';
import { EarlyFilingIncentive } from '../components/tax/EarlyFilingIncentive';
import { InvestmentTaxRebateCalculator } from '../components/tax/InvestmentTaxRebateCalculator';
import { TotalIncomeCalculator } from '../components/tax/TotalIncomeCalculator';
import { AgriculturalTaxCalculator } from '../components/tax/AgriculturalTaxCalculator';
import { LossCarryForwardCalculator } from '../components/tax/LossCarryForwardCalculator';
import { Clause20ExemptionCard } from '../components/tax/Clause20ExemptionCard';
import { Section66Vs67SummaryCard } from '../components/tax/Section66Vs67SummaryCard';
import { OtherSourcesDocChecklist } from '../components/tax/OtherSourcesDocChecklist';
import { TdsLotteryGiftsFreelanceCard } from '../components/tax/TdsLotteryGiftsFreelanceCard';
import { TaxableVsExemptIncomeCalculator } from '../components/tax/TaxableVsExemptIncomeCalculator';
import { GrossVsTaxableIncomeCard } from '../components/tax/GrossVsTaxableIncomeCard';
import { TurnoverTaxCalculator } from '../components/tax/TurnoverTaxCalculator';
import { TurnoverSlabsSummaryCard } from '../components/tax/TurnoverSlabsSummaryCard';
import { TaxRebateCeilingCard } from '../components/tax/TaxRebateCeilingCard';
import { CorporateTaxRateCalculator } from '../components/tax/CorporateTaxRateCalculator';
import { CorporateComplianceMasteryQuiz } from '../components/tax/CorporateComplianceMasteryQuiz';
import { CapitalGainsTaxCalculator } from '../components/tax/CapitalGainsTaxCalculator';
import { TaxReturnChecklist } from '../components/tax/TaxReturnChecklist';
import { TaxSummaryDashboard } from '../components/tax/TaxSummaryDashboard';
import { VatApportionmentCalculator } from '../components/tax/VatApportionmentCalculator';
import { IdentificationSystemsMatrix } from '../components/IdentificationSystemsMatrix';
import { Sro213DonationRebateWidget } from '../components/tax/Sro213DonationRebateWidget';
import { ImageGallery } from '../components/ImageGallery';
import { CommentSection } from '../components/CommentSection';
import { BlogSEO } from '../components/BlogSEO';
import { BlogDisclaimer } from '../components/BlogDisclaimer';
import { ContactELawyers } from '../components/ContactELawyers';
import { RelatedResources } from '../components/RelatedResources';
import { EcosystemSocialKit } from '../components/EcosystemSocialKit';
import { BlogCover } from '../components/BlogCover';
import { EstimatedReadingTime } from '../components/EstimatedReadingTime';
import { GlossaryTerm } from '../data/glossaryData';
import { TermDetailModal } from '../components/glossary/TermDetailModal';
import {
  ArticleGlossaryBar,
  highlightGlossaryInReactNodes,
  detectArticleGlossaryTerms,
  ALL_GLOSSARY_TERMS,
} from '../components/glossary/GlossaryTooltipSystem';
import { trackArticleReadingPattern } from '../services/firebaseAnalyticsService';
import {
  useArticleScrollMilestones,
  SCROLL_MILESTONE_THRESHOLDS
} from '../hooks/useArticleScrollMilestones';

export function Article() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const isSaved = id ? isBookmarked(id) : false;

  const article = mockArticles.find(a => a.id === id);

  useEffect(() => {
    if (article) {
      const categoryObj = categories.find(c => c.id === article.category);
      void trackArticleReadingPattern({
        articleId: article.id,
        title: article.title,
        category: categoryObj?.name || 'Income Tax Act 2023',
        action: 'view_article',
        scrollDepthPct: 25,
        durationSec: 45
      });
    }
  }, [article]);
  const popularArticles = mockArticles.slice(0, 4);
  const { isLoaded: isFeaturedLoaded, hasError: hasFeaturedError } = useImageLoader(article?.imageUrl);

  const { isFocusMode, toggleFocusMode, readerTheme, readerFontSize } = useFocusMode();
  const [isQuickSummaryOpen, setIsQuickSummaryOpen] = useState(true);
  const [isFullWidthCanvas, setIsFullWidthCanvas] = useState(false);

  const articleCategoryName = useMemo(() => {
    if (!article) return 'Income Tax Act 2023';
    const categoryObj = categories.find(c => c.id === article.category);
    return categoryObj?.name || article.category || 'Income Tax Act 2023';
  }, [article]);

  // Custom Firebase Analytics hook logging `scroll_milestone` (25%, 50%, 75%, 100%) as the reader progresses
  const {
    scrollProgress,
    reachedMilestones
  } = useArticleScrollMilestones({
    articleId: article?.id,
    articleTitle: article?.title,
    category: articleCategoryName,
    readTimeMin: article?.readTime || 5,
    targetElementId: 'article-content-body',
    enabled: Boolean(article)
  });

  const [glossaryHighlightsEnabled, setGlossaryHighlightsEnabled] = useState(true);
  const [activeGlossaryModalTerm, setActiveGlossaryModalTerm] = useState<GlossaryTerm | null>(null);
  const [selectedQuoteText, setSelectedQuoteText] = useState<string | null>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [floatingToolbarPos, setFloatingToolbarPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setFloatingToolbarPos(null);
        return;
      }
      const text = selection.toString().trim();
      if (text.length >= 10 && text.length <= 600) {
        const range = selection.getRangeAt(0);
        const contentBody = document.getElementById('article-content-body');
        if (contentBody && contentBody.contains(range.commonAncestorContainer)) {
          setSelectedQuoteText(text);
          const rect = range.getBoundingClientRect();
          setFloatingToolbarPos({
            x: Math.max(20, Math.min(window.innerWidth - 220, rect.left + rect.width / 2 - 90)),
            y: rect.top - 55 + window.scrollY
          });
          return;
        }
      }
      setFloatingToolbarPos(null);
    };

    document.addEventListener('mouseup', handleSelectionChange);
    return () => {
      document.removeEventListener('mouseup', handleSelectionChange);
    };
  }, []);
  const [bookmarkedGlossaryIds, setBookmarkedGlossaryIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('compliance_hub_glossary_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleToggleGlossaryBookmark = (termId: string) => {
    setBookmarkedGlossaryIds(prev => {
      const next = prev.includes(termId) ? prev.filter(item => item !== termId) : [...prev, termId];
      try {
        localStorage.setItem('compliance_hub_glossary_bookmarks', JSON.stringify(next));
      } catch {
        // Ignore storage error
      }
      return next;
    });
  };

  // Keyboard shortcut listener: 'Esc' exits Focus Mode, 'F' toggles Focus Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'Escape' && isFocusMode) {
        toggleFocusMode();
      } else if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        toggleFocusMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode, toggleFocusMode]);

  const headingColorClass = !isFocusMode || readerTheme === 'light'
    ? 'text-slate-900'
    : readerTheme === 'sepia'
    ? 'text-[#2d2216]'
    : 'text-white';

  const excerptColorClass = !isFocusMode || readerTheme === 'light'
    ? 'text-slate-600'
    : readerTheme === 'sepia'
    ? 'text-[#5c4a36]'
    : 'text-slate-300';

  const proseThemeClass = !isFocusMode
    ? 'prose-slate prose-headings:text-slate-900 prose-a:text-emerald-600'
    : readerTheme === 'sepia'
    ? 'prose-amber text-[#3c2f1f] prose-headings:text-[#2d2216] prose-p:text-[#3c2f1f] prose-strong:text-[#2d2216] prose-a:text-[#a0522d]'
    : readerTheme === 'dark'
    ? 'prose-invert text-slate-200 prose-headings:text-white prose-p:text-slate-300 prose-strong:text-white prose-a:text-emerald-400'
    : 'prose-slate prose-headings:text-slate-900 prose-a:text-emerald-600';

  const proseSizeClass = !isFocusMode
    ? 'prose-lg'
    : readerFontSize === 'sm'
    ? 'prose-base'
    : readerFontSize === 'lg'
    ? 'prose-xl'
    : readerFontSize === 'xl'
    ? 'prose-2xl'
    : 'prose-lg';



  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Article Not Found</h2>
        <p className="text-slate-600 mb-8">The legal article or guide you are looking for does not exist or has been removed.</p>
        <Link to="/" className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-500 transition-colors">
          Return to Homepage
        </Link>
      </div>
    );
  }

  const toggleSave = async () => {
    if (!id || !article) return;
    const willBeSaved = !isSaved;
    await toggleBookmark({
      id,
      title: article.title,
      type: 'article',
      url: `/article/${id}`,
      dateSaved: new Date().toISOString(),
      offlineContent: article.content,
      offlineExcerpt: article.excerpt,
      offlineImageUrl: article.imageUrl,
      category: article.category,
      categoryId: article.categoryId,
      readTime: article.readTime,
      authorName: article.author?.name
    });
    if (willBeSaved) {
      setSaveFeedback(user ? 'Saved to your private dashboard' : 'Bookmarked locally. Sign in with Google to sync to your dashboard across all devices');
      setTimeout(() => setSaveFeedback(null), 4500);
    } else {
      setSaveFeedback(null);
    }
  };

  const searchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.elements.namedItem('search') as HTMLInputElement;
    if (input.value.trim()) {
      navigate(`/search?q=${encodeURIComponent(input.value.trim())}`);
    }
  };

  const relatedArticles = useMemo(
    () => getRecommendedArticles(article, mockArticles, 4).map(r => r.article),
    [article]
  );

  const localizedContent = useMemo(() => {
    if (!article) return '';
    const regex = /(?:\n|^)---\s*\n\s*(?:#+\s*)?(?:বাংলা|in bangla)/i;
    const parts = article.content.split(regex);
    if (language === 'en') {
      return parts[0].trim();
    } else {
      return parts.length > 1 ? parts[1].trim() : parts[0].trim();
    }
  }, [article, language]);

  const readingTimeMinutes = useMemo(() => calculateReadingTime(localizedContent), [localizedContent]);
  // Long-form articles typically exceed 300 words or require >= 2 minutes to read thoroughly
  const isLongForm = readingTimeMinutes >= 2 || localizedContent.length > 500;

  const chapterJumpLinks = useMemo(() => {
    return parseMarkdownHeadings(localizedContent)
      .filter((h) => h.level === 2)
      .slice(0, 8)
      .map((h) => ({ id: h.id, text: h.title }));
  }, [localizedContent]);

  const detectedGlossaryTerms = useMemo(
    () => detectArticleGlossaryTerms(localizedContent),
    [localizedContent]
  );

  const markdownComponents = useMemo(() => ({
    h1: ({ node, children, ...props }: any) => {
      const id = slugifyHeadingText(extractTextFromReactNode(children));
      return <h1 id={id} className="text-[25px] leading-[33px] scroll-mt-28" {...props}>{children}</h1>;
    },
    h2: ({ node, children, ...props }: any) => {
      const id = slugifyHeadingText(extractTextFromReactNode(children));
      const isFlowchartTarget = article.id === 'section-272-income-tax-act-2023-penalty-bangladesh' && id === 'mandatory-hearing-before-imposing-penalty';
      const isSection46Target = article.id === 'deemed-business-income-section-46-bangladesh-tax-act' && (id === '1-introduction' || id === 'introduction');
      const isLossTarget = article.id === 'set-off-carry-forward-business-losses-section-70-71-bangladesh-tax' && (id === '1-introduction' || id === 'introduction');
      
      const isSpecificH2 = id === 'required-documents-list-for-employees-income-from-salary-fy-2025-26-ay-2026-27';
      const className = isSpecificH2 
        ? "text-[15px] leading-[25px] scroll-mt-28 font-bold" 
        : "text-[25px] leading-[33px] scroll-mt-28 font-bold";

      return (
        <>
          <h2 id={id} className={className} {...props}>{children}</h2>
          {isFlowchartTarget && <PenaltyFlowchart />}
          {isLossTarget && <LossCarryForwardCalculator />}
          {isSection46Target && (
            <>
              <Section46ScenarioSelector />
              <Section46ReferenceTable />
            </>
          )}
        </>
      );
    },
    h3: ({ node, children, ...props }: any) => {
      const id = slugifyHeadingText(extractTextFromReactNode(children));
      return <h3 id={id} className="scroll-mt-28" {...props}>{children}</h3>;
    },
    h4: ({ node, children, ...props }: any) => {
      const id = slugifyHeadingText(extractTextFromReactNode(children));
      return <h4 id={id} className="scroll-mt-28 font-bold" {...props}>{children}</h4>;
    },
    p: ({ node, children }: any) => {
      const elementChildren = React.Children.toArray(children);
      
      const isOnlyImages = elementChildren.length > 0 && elementChildren.every((child: any) => {
        if (typeof child === 'string') {
          return child.trim() === '';
        }
        return React.isValidElement(child) && (child.props as any)?.node?.tagName === 'img';
      });

      const imageElements = elementChildren.filter((child: any) => React.isValidElement(child) && (child.props as any)?.node?.tagName === 'img');

      if (isOnlyImages && imageElements.length > 1) {
        const carouselImages = imageElements.map((img: any) => ({
          src: img.props.src,
          alt: img.props.alt
        }));
        return <ImageCarousel images={carouselImages} />;
      }
      
      if (
        elementChildren.some(
          (child: any) =>
            React.isValidElement(child) &&
            ((child.props as any)?.node?.tagName === "document-checklist" ||
              (child.props as any)?.node?.tagName === "vat-apportionment-calculator")
        )
      ) {
        return <div className="mb-4">{children}</div>;
      }
      const highlightedChildren = highlightGlossaryInReactNodes(
        children,
        glossaryHighlightsEnabled,
        setActiveGlossaryModalTerm
      );
      return <p className="text-[15px] leading-[25px] text-slate-600 mb-6 text-justify">{highlightedChildren}</p>;
    },
    img: ({ node, ...props }: any) => <MarkdownImage {...props} />,
    ul: ({ node, children, ...props }: any) => {
      if (article.id === 'personal-income-tax-return-submission-guide-2025-2026') {
        return <ul className="list-none pl-0 space-y-3 my-6 text-[15px] leading-[25px] text-justify" {...props}>{children}</ul>;
      }
      return <ul className="list-disc pl-5 space-y-2 mb-6 text-[15px] leading-[25px] text-justify text-slate-600" {...props}>{children}</ul>;
    },
    li: ({ node, children, ...props }: any) => {
      const highlightedChildren = highlightGlossaryInReactNodes(
        children,
        glossaryHighlightsEnabled,
        setActiveGlossaryModalTerm
      );
      if (article.id === 'personal-income-tax-return-submission-guide-2025-2026') {
        return <InteractiveChecklistItem articleId={article.id} {...props}>{highlightedChildren}</InteractiveChecklistItem>;
      }
      return <li {...props}>{highlightedChildren}</li>;
    },
    td: ({ node, children, ...props }: any) => {
      const highlightedChildren = highlightGlossaryInReactNodes(
        children,
        glossaryHighlightsEnabled,
        setActiveGlossaryModalTerm
      );
      return <td {...props}>{highlightedChildren}</td>;
    },
    table: ({ node, children, ...props }: any) => <SortableTable {...props}>{children}</SortableTable>
  }), [article.id, glossaryHighlightsEnabled]);

  const articleCustomSchema = useMemo(() => {
    if (article.id === 'total-income-calculation-bangladesh-2026-2027') {
      return [
        {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: 'How to Calculate Total Income in Bangladesh for 2026–2027',
          description: 'Complete guide to calculating Total Income (মোট আয়) in Bangladesh for Assessment Year 2026–2027, including the major income heads and investment tax rebate calculation.',
          author: {
            '@type': 'Person',
            name: 'Advocate Ekramul Hoque',
            url: 'https://elawyersbd.com/'
          },
          publisher: {
            '@type': 'Organization',
            name: 'E-Lawyers & Accounticca',
            url: 'https://elawyersbd.com/'
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': 'https://elawyersbd.com/total-income-calculation-bangladesh-2026-2027/'
          },
          image: 'https://elawyersbd.com/wp-content/uploads/2026/09/total-income-calculation-bangladesh-2026-2027.jpg',
          keywords: [
            'Total Income Calculation Bangladesh 2026–2027',
            'Total Income Bangladesh',
            'মোট আয় নির্ণয়',
            'Income Tax Bangladesh 2026–2027',
            'Bangladesh Income Tax Guide',
            'IT-11GA 2023',
            'Income Tax Return Bangladesh',
            'Taxable Income Bangladesh',
            'Salary Income Tax Bangladesh',
            'Business Income Tax Bangladesh',
            'Rent Income Tax Bangladesh',
            'Investment Tax Rebate Bangladesh',
            'Section 78 Income Tax Act 2023',
            'Bangladesh Tax Return 2026–27'
          ]
        },
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'What is Total Income in Bangladesh?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Total Income is the aggregate of income computed under the applicable heads of income after applying the deductions, exemptions and computation rules prescribed by the Income Tax Act, 2023.'
              }
            },
            {
              '@type': 'Question',
              name: 'What are the main income heads in Bangladesh?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'The major income categories include employment, rent, agriculture, business or profession, capital gains, financial assets, other sources, applicable partnership or AOP income, applicable spouse or minor-child income, and taxable foreign income.'
              }
            },
            {
              '@type': 'Question',
              name: 'Is Total Income the same as the income used for investment tax rebate?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Not necessarily. The investment tax rebate calculation has specific statutory rules regarding which income is included or excluded from the 3% qualifying-income calculation.'
              }
            },
            {
              '@type': 'Question',
              name: 'How is investment tax rebate calculated for 2026–2027?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'For Assessment Year 2026–2027, the investment tax rebate is subject to the lowest of 3% of qualifying total income, 10% of qualifying investment and expenditure, and Tk. 7,50,000.'
              }
            }
          ]
        }
      ];
    }
    if (article.id === 'trade-license-bangladesh-guide-dncc-dscc') {
      return [
        {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: 'Trade License in Bangladesh: Importance, Requirements, Application Process, Renewal, and Cost Guide (Dhaka North & Dhaka South City Corporation)',
          description: 'Learn everything about Trade License in Bangladesh including importance, required documents, application process, renewal procedure, and estimated costs for Dhaka North and Dhaka South City Corporation.',
          author: {
            '@type': 'Organization',
            name: 'Accounticca × E-Lawyers Advisory Group',
            url: 'https://accounticca.com/'
          },
          publisher: {
            '@type': 'Organization',
            name: 'Accounticca & E-Lawyers',
            url: 'https://accounticca.com/'
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': 'https://accounticca.com/article/trade-license-bangladesh-guide-dncc-dscc'
          },
          keywords: [
            'Trade License Bangladesh',
            'Dhaka City Corporation Trade License',
            'DNCC Trade License',
            'DSCC Trade License',
            'Trade License Renewal Bangladesh',
            'Trade License Cost in Bangladesh'
          ]
        },
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Is a trade license mandatory in Bangladesh?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes, most businesses operating commercially require a trade license from the relevant local authority.'
              }
            },
            {
              '@type': 'Question',
              name: 'Can I run an online business without a trade license?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Online businesses may also require a trade license depending on their business activities and legal requirements.'
              }
            },
            {
              '@type': 'Question',
              name: 'How long does it take to get a trade license?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'The timeframe depends on application accuracy, document completeness, and verification process, typically 3 to 7 working days.'
              }
            },
            {
              '@type': 'Question',
              name: 'How much does a trade license cost in Dhaka?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'The cost varies depending on business category, location, and city corporation assessment, typically ranging between BDT 1,500 and BDT 25,000+.'
              }
            },
            {
              '@type': 'Question',
              name: 'How often should a trade license be renewed?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Trade licenses generally require annual renewal, covering the fiscal year from July 1 to June 30.'
              }
            },
            {
              '@type': 'Question',
              name: 'Can one trade license cover multiple businesses or locations?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Usually, a trade license applies to a specific business activity and location. Separate licenses are required for different activities or branch locations.'
              }
            }
          ]
        }
      ];
    }
    if (article.id === 'investment-tax-rebate-bangladesh-2026-2027') {
      return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Investment Tax Rebate in Bangladesh 2026–2027: Eligible Investments, Limits & Calculation',
        description: 'A detailed guide to investment tax rebate in Bangladesh for Assessment Year 2026–2027, including eligible investments, donations, conditions and calculation.',
        author: {
          '@type': 'Organization',
          name: 'E-Lawyers & Accounticca',
          url: 'https://accounticca.com/'
        },
        publisher: {
          '@type': 'Organization',
          name: 'E-Lawyers & Accounticca',
          url: 'https://accounticca.com/'
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': 'https://accounticca.com/investment-tax-rebate-bangladesh-2026-2027'
        },
        keywords: [
          'Investment Tax Rebate Bangladesh 2026–2027',
          'Bangladesh Tax Rebate',
          'Section 78 Income Tax Act 2023',
          'DPS Tax Rebate',
          'Income Tax Bangladesh'
        ]
      };
    }
    if (article.id === 'bangladesh-income-tax-slabs-thresholds-2026-2027') {
      return [
        {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: 'Bangladesh Income Tax 2026–27: Updated Tax-Free Thresholds, Progressive Tax Rates and Practical Examples | আয়কর ২০২৬–২৭',
          description:
            'Complete guide to Bangladesh Income Tax for Assessment Year (AY) 2026–2027 in English and বাংলা. Learn the updated Tk. 4,00,000 tax-free threshold, progressive tax slabs, and practical examples.',
          author: {
            '@type': 'Organization',
            name: 'Accounticca × E-Lawyers Direct Tax Practice',
            url: 'https://accounticca.com/'
          },
          publisher: {
            '@type': 'Organization',
            name: 'Accounticca & E-Lawyers',
            url: 'https://accounticca.com/'
          }
        },
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Is the tax-free income threshold Tk. 4,00,000 for AY 2026–2027?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. Under the revised framework, the general individual taxpayer\'s basic tax-free threshold is Tk. 4,00,000.'
              }
            },
            {
              '@type': 'Question',
              name: 'Are women and senior citizens entitled to a higher exemption limit?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. The applicable initial exemption is Tk. 4,50,000 for female taxpayers and taxpayers aged 65 years or above.'
              }
            },
            {
              '@type': 'Question',
              name: '২০২৬–২০২৭ করবর্ষে সাধারণ করদাতার করমুক্ত আয়সীমা কত?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'সাধারণ ব্যক্তিশ্রেণির করদাতার প্রাথমিক করমুক্ত আয়সীমা ৪,০০,০০০ টাকা।'
              }
            },
            {
              '@type': 'Question',
              name: 'নারী ও ৬৫ বছর বা তদূর্ধ্ব বয়সী করদাতাদের করমুক্ত আয়সীমা কত?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'উভয় শ্রেণির ক্ষেত্রে নির্ধারিত করমুক্ত আয়সীমা ৪,৫০,০০০ টাকা।'
              }
            }
          ]
        }
      ];
    }
    if (article.id === 'sro-213-2026-approved-11-institutions-donation-tax-rebate') {
      return [
        {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline:
            'Tax Rebate on Donations to 11 Organisations (SRO No. 213-Ain/Aykor-4/2026) | ১১ প্রতিষ্ঠানে দানে আয়কর রেয়াত',
          description:
            'Complete guide to Income Tax Rebate on Donations to 11 Approved Public-Welfare Organisations in Bangladesh under SRO No. 213-Ain/Aykor-4/2026 (Effective: 1 July 2026–30 June 2030) and Section 78 of the Income Tax Act, 2023.',
          author: {
            '@type': 'Organization',
            name: 'Accounticca × E-Lawyers Direct Tax Practice',
            url: 'https://accounticca.com/'
          },
          publisher: {
            '@type': 'Organization',
            name: 'Accounticca & E-Lawyers',
            url: 'https://accounticca.com/'
          }
        },
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Is the entire donation deducted from income tax?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'No. The eligible donation enters the statutory rebate calculation under Section 78 (lowest of 3% of qualifying income, 10% of total eligible investments and expenditure, or BDT 750,000). The full amount is not automatically deducted from the tax liability.'
              }
            },
            {
              '@type': 'Question',
              name: 'Can a company claim the same benefit?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Not automatically under this specific notification. The SRO addresses donations by individual taxpayers. A company’s treatment depends on separately applicable tax provisions.'
              }
            },
            {
              '@type': 'Question',
              name: 'Are donations made after 30 June 2030 eligible?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'The notification states that its validity ends on 30 June 2030. Eligibility after that date would depend on any extension, new notification or another applicable legal provision.'
              }
            },
            {
              '@type': 'Question',
              name: 'Do all payments to approved organisations qualify?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'No. The payment must be a genuine qualifying donation or contribution. Ordinary payments for goods or services are not automatically eligible.'
              }
            },
            {
              '@type': 'Question',
              name: '১ লাখ টাকা দান করলে কি ১ লাখ টাকা আয়কর কমবে?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'না। দানটি অনুমোদনযোগ্য ব্যয় হিসেবে কর রেয়াত গণনায় অন্তর্ভুক্ত হতে পারে। রেয়াতের পরিমাণ নির্ভর করবে আইনে নির্ধারিত গণনা ও সীমার ওপর (প্রাসঙ্গিক আয়ের ৩%, অনুমোদিত বিনিয়োগ ও ব্যয়ের ১০%, এবং সর্বোচ্চ ৭,৫০,০০০ টাকার মধ্যে সর্বনিম্ন পরিমাণ)।'
              }
            },
            {
              '@type': 'Question',
              name: 'এই ১১টি প্রতিষ্ঠান ছাড়া অন্য প্রতিষ্ঠানে দান করলে কি কর রেয়াত পাওয়া যাবে না?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'এমন নয়। আয়কর আইনের অন্যান্য বিধান বা পৃথক সরকারি অনুমোদন অনুযায়ী অন্য কিছু প্রতিষ্ঠানে প্রদত্ত অনুদানও রেয়াতযোগ্য হতে পারে। এই প্রজ্ঞাপন শুধু নির্দিষ্ট ১১টি প্রতিষ্ঠানের অনুমোদন নিশ্চিত করে।'
              }
            },
            {
              '@type': 'Question',
              name: '৩০ জুন ২০৩০-এর পরে অনুদান দিলে রেয়াত পাওয়া যাবে?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'এই প্রজ্ঞাপনের ঘোষিত মেয়াদ অনুযায়ী ৩০ জুন ২০৩০ পর্যন্ত সুবিধাটি কার্যকর। মেয়াদ শেষ হওয়ার পর নতুন প্রজ্ঞাপন, নবায়ন বা অন্য প্রযোজ্য আইনি ভিত্তি আছে কি না দেখতে হবে।'
              }
            },
            {
              '@type': 'Question',
              name: 'অনুদান গ্রহণকারী প্রতিষ্ঠানের সব আয় কি করমুক্ত?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'না। প্রজ্ঞাপনটি মূলত ব্যক্তি অনুদানদাতার কর রেয়াতের সুবিধা নিয়ে। প্রতিষ্ঠানের নিজস্ব আয়ের কর-ব্যবস্থা আলাদা বিধানের ওপর নির্ভর করবে।'
              }
            }
          ]
        }
      ];
    }
    return undefined;
  }, [article.id]);

  const canonicalUrl = useMemo(() => {
    if (article.id === 'total-income-calculation-bangladesh-2026-2027') {
      return 'https://elawyersbd.com/total-income-calculation-bangladesh-2026-2027/';
    }
    if (article.id === 'investment-tax-rebate-bangladesh-2026-2027') {
      return '/investment-tax-rebate-bangladesh-2026-2027';
    }
    return undefined;
  }, [article.id]);

  return (
    <>
      <BlogSEO 
        article={article} 
        canonicalUrl={canonicalUrl}
        customSchema={articleCustomSchema} 
      />
      {!isFocusMode && !isLongForm && <ReadProgress />}

      {/* Dedicated Focus Mode Reading Bar at Top of Viewport */}
      {isFocusMode && (
        <FocusModeReaderBar 
          articleTitle={article.title}
          category={article.category}
          readTime={readingTimeMinutes}
          progressPercent={scrollProgress}
          content={localizedContent}
          isSaved={isSaved}
          onToggleSave={toggleSave}
        />
      )}

      {/* Floating Left Social Share Rail for Desktop (Hidden in Focus Mode) */}
      {!isFocusMode && (
        <SocialShareButtons 
          url={`/article/${article.id}`}
          title={article.title} 
          summary={article.excerpt} 
          variant="floating-rail" 
        />
      )}

      <div className={isFocusMode ? "max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10 transition-all duration-300" : "max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 xl:pl-16 xl:pr-8 2xl:pl-20 2xl:pr-10 py-6 md:py-9"}>
        {!isFocusMode && (
          <Breadcrumbs 
            items={[
              { label: 'Knowledge Hub', path: '/search' },
              { label: article.category, path: `/category/${article.categoryId}` },
              { label: article.title }
            ]} 
          />
        )}

        {isFocusMode && (
          <div className="mb-8 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-3 text-xs animate-in fade-in">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span><strong>Focus Mode:</strong> Distraction-free reading experience. Navigation and sidebars are hidden. Press <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-[10px]">Esc</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-[10px]">F</kbd> to toggle.</span>
            </div>
            <button
              type="button"
              onClick={toggleFocusMode}
              className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline shrink-0 cursor-pointer"
            >
              Exit Focus (Esc)
            </button>
          </div>
        )}

        <div className={`mt-5 ${isFocusMode ? 'space-y-8' : 'grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-10'}`}>
          
          {/* Main Content Area (75% primary canvas default on desktop, or 100% when wide canvas is toggled) */}
          <div className={`${isFocusMode || isFullWidthCanvas ? 'lg:col-span-12 w-full' : 'lg:col-span-9'} leading-[25px] w-full min-w-0`}>
            
            {article.id === 'section-272-income-tax-act-2023-penalty-bangladesh' && (
              <LegalAlertBanner />
            )}

            {/* 1. Article Header Section */}
            <header className="mb-10">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <Link to={`/category/${article.categoryId}`} className="inline-block bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-md hover:bg-emerald-200 transition-colors">
                  {article.category}
                </Link>
                <EstimatedReadingTime content={localizedContent} variant="badge" />
              </div>
              
              <h1 className={`text-[25px] leading-[33px] font-bold ${headingColorClass} mb-4 transition-colors duration-200`}>
                {article.title}
              </h1>

              {/* Estimated Reading Time Display near the Article Title */}
              <div className="mb-6">
                <EstimatedReadingTime content={localizedContent} variant="sub-header" />
              </div>

              <p className={`text-[15px] leading-[25px] text-justify ${excerptColorClass} mb-8 transition-colors duration-200`}>
                {article.excerpt}
              </p>
              
              <div className="flex flex-wrap items-center justify-between gap-6 pb-8 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <img src={article.author.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} alt={article.author.name} className="w-12 h-12 rounded-full border border-slate-200 object-cover" />
                  <div>
                    <p className={`font-bold ${headingColorClass}`}>{article.author.name}</p>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {format(new Date(article.publishedAt), 'MMM d, yyyy')}</span>
                      <span>&bull;</span>
                      <EstimatedReadingTime content={localizedContent} variant="inline" />
                      {!isFocusMode && (
                        <>
                          <span>&bull;</span>
                          <a href="#professional-comments-section" className="flex items-center gap-1 text-slate-600 hover:text-emerald-700 font-semibold transition-colors">
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Discussion</span>
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Text-to-Speech (TTS) Reader Button */}
                    <ReadAloudButton
                      content={localizedContent}
                      title={article.title}
                      variant="pill"
                      showSecurityBadge={true}
                    />

                    {/* Focus Mode Toggle Button */}
                    <button
                      type="button"
                      onClick={() => {
                        void import('../services/firebaseAnalyticsService').then(
                          ({ trackUxEngagementEvent }) =>
                            trackUxEngagementEvent({
                              eventName: 'focus_mode_toggle',
                              contentType: 'article',
                              contentId: article.id,
                              title: article.title,
                              category: articleCategoryName,
                              action: isFocusMode ? 'exit_focus_mode' : 'enter_focus_mode',
                              scrollDepthPct: scrollProgress
                            })
                        );
                        toggleFocusMode();
                      }}
                      title={isFocusMode ? "Exit Focus Mode (Esc)" : "Enter Focus Mode: Hide navigation and sidebars for clean, distraction-free reading"}
                      aria-label="Toggle Focus Mode"
                      className={`px-3.5 py-2.5 rounded-xl border font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-2xs ${
                        isFocusMode 
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300'
                      }`}
                    >
                      {isFocusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4 text-emerald-600" />}
                      <span className="text-sm font-semibold">{isFocusMode ? "Exit Focus" : "Focus Mode"}</span>
                      <kbd className="hidden sm:inline-block text-[10px] bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono">
                        F
                      </kbd>
                    </button>

                    <button 
                      id="article-bookmark-btn"
                      onClick={toggleSave} 
                      title={isSaved ? "Remove from Saved Items" : "Save this article to your private Dashboard"}
                      aria-label={isSaved ? "Remove from Saved Items" : "Save this article to your private Dashboard"}
                      className={`px-4 py-2.5 rounded-xl border font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                        isSaved 
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 transition-transform active:scale-125 duration-150 ${isSaved ? 'fill-current text-emerald-600' : ''}`} />
                      <span className="hidden sm:inline text-sm">{isSaved ? "Saved to Dashboard" : "Save Article"}</span>
                    </button>
                  </div>

                  {saveFeedback && (
                    <div id="bookmark-save-feedback" className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-xs shadow-xs animate-in fade-in">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{saveFeedback}</span>
                      <Link to="/dashboard?tab=saved" className="font-bold underline ml-1 hover:text-emerald-950">
                        View Dashboard &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Top Social Sharing Bar (Hidden in Focus Mode) */}
              {!isFocusMode && (
                <div className="pt-6">
                  <SocialShareButtons 
                    url={`/article/${article.id}`}
                    title={article.title} 
                    summary={article.excerpt} 
                    variant="top-bar" 
                  />
                </div>
              )}
            </header>

            {/* Featured Article Cover Photo with Category Theming, Dynamic Fallback, and Lightbox Zoom */}
            <BlogCover article={article} />

            {/* Visual Reading Progress Indicator Bar for Long-Form Articles */}
            {isLongForm && (
              <ArticleReadingProgress
                targetContentId="article-content-body"
                totalMinutes={readingTimeMinutes}
                articleTitle={article.title}
                category={article.category}
                rawContent={localizedContent}
                isSaved={isSaved}
                onToggleSave={toggleSave}
                isFocusMode={isFocusMode}
                onToggleFocusMode={toggleFocusMode}
              />
            )}

            {/* Collapsible Above-the-Fold Quick Summary & Interactive Chapter Jump Bar */}
            <div className="my-6 rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden not-prose">
              <div className="px-4 sm:px-5 py-3 bg-slate-50/90 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-xs text-slate-700 flex-wrap">
                  <span className="font-bold text-slate-900">Quick Statutory Summary &amp; Chapter Jump</span>
                  <span aria-hidden="true" className="text-slate-300">&middot;</span>
                  <span className="font-mono tabular-nums text-emerald-700 font-semibold">
                    Display View: {isFocusMode || isFullWidthCanvas ? '100%' : '75%'} Canvas
                  </span>
                  <span aria-hidden="true" className="text-slate-300">&middot;</span>
                  <span className="font-mono tabular-nums text-slate-600">
                    Read Progress: {scrollProgress}%
                  </span>
                  <span aria-hidden="true" className="text-slate-300 hidden sm:inline">&middot;</span>
                  <div className="hidden sm:flex items-center gap-1 font-mono tabular-nums text-[11px]" title="Firebase Analytics scroll_milestone retention checkpoints">
                    {SCROLL_MILESTONE_THRESHOLDS.map((m) => {
                      const isReached = reachedMilestones.includes(m);
                      return (
                        <span
                          key={m}
                          className={`px-1.5 py-0.5 rounded transition-colors ${
                            isReached
                              ? 'bg-emerald-100 text-emerald-800 font-bold'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {m}%
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isFocusMode && (
                    <button
                      type="button"
                      onClick={() => setIsFullWidthCanvas((prev) => !prev)}
                      className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Columns3 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isFullWidthCanvas ? 'Show Sidebar (75/25)' : 'Expand Full Width (100%)'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsQuickSummaryOpen((prev) => !prev)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <span>{isQuickSummaryOpen ? 'Collapse Summary' : 'Expand Summary'}</span>
                    {isQuickSummaryOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {isQuickSummaryOpen && (
                <div className="p-4 sm:p-5 space-y-4">
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {article.excerpt}
                  </p>

                  {chapterJumpLinks.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="text-xs font-semibold text-slate-500">
                        Jump directly to section ({chapterJumpLinks.length} chapters):
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {chapterJumpLinks.map((chap, idx) => (
                          <button
                            key={chap.id}
                            type="button"
                            onClick={() => {
                              const el = document.getElementById(chap.id);
                              if (el) {
                                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                              void import('../services/firebaseAnalyticsService').then(
                                ({ trackUxEngagementEvent }) =>
                                  trackUxEngagementEvent({
                                    eventName: 'article_toc_click',
                                    contentType: 'article',
                                    contentId: article.id,
                                    title: article.title,
                                    category: articleCategoryName,
                                    action: `top_summary_jump_${chap.id}`,
                                    metadata: { section_id: chap.id }
                                  })
                              );
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200/80 hover:border-emerald-200 text-xs font-medium transition-colors cursor-pointer text-left truncate max-w-[260px]"
                            title={chap.text}
                          >
                            <span className="font-mono tabular-nums text-slate-400 mr-1">
                              {String(idx + 1).padStart(2, '0')}.
                            </span>
                            <span>{chap.text}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Interactive Section 66 vs. Section 67 Summary Box for Quick Reference */}
            {article.id === 'income-from-other-sources-sections-66-67-income-tax-act-2023' && (
              <div className="my-8 not-prose" id="section-66-vs-67-summary-tool">
                <Section66Vs67SummaryCard 
                  showBengaliDefault={language === 'bn'} 
                  className="shadow-lg hover:shadow-xl transition-shadow duration-300 ring-1 ring-slate-900/5"
                />
              </div>
            )}

            {/* Interactive TDS Screener for Lottery, Gifts, Loans, and Freelance Income */}
            {article.id === 'tds-lottery-winnings-gifts-loans-freelance-income-bangladesh-2026-2027' && (
              <div className="my-8 not-prose" id="tds-lottery-gifts-freelance-tool">
                <TdsLotteryGiftsFreelanceCard 
                  showBengaliDefault={language === 'bn'} 
                  className="shadow-lg hover:shadow-xl transition-shadow duration-300 ring-1 ring-slate-900/5"
                />
              </div>
            )}

            {/* Interactive Taxable vs Exempt Income Calculator & Screener */}
            {article.id === 'taxable-and-non-taxable-income-bangladesh-guide-2026-2027' && (
              <div className="my-8 not-prose" id="taxable-vs-exempt-income-tool">
                <TaxableVsExemptIncomeCalculator 
                  showBengaliDefault={language === 'bn'} 
                  className="shadow-lg hover:shadow-xl transition-shadow duration-300 ring-1 ring-slate-900/5"
                />
              </div>
            )}

            {/* Interactive Gross vs Taxable Income Card */}
            {article.id === 'total-income-calculation-bangladesh-2026-2027' && (
              <div className="my-8 not-prose" id="gross-vs-taxable-income-tool">
                <GrossVsTaxableIncomeCard 
                  showBengaliDefault={language === 'bn'} 
                  className="shadow-lg hover:shadow-xl transition-shadow duration-300 ring-1 ring-slate-900/5"
                />
              </div>
            )}

            {/* Interactive Identification & Registration Systems Matrix */}
            {article.id === 'identification-and-registration-systems-overview-guide' && (
              <div className="my-8 not-prose" id="identification-systems-matrix-tool">
                <IdentificationSystemsMatrix />
              </div>
            )}

            {/* Interactive SRO 213/2026 Approved 11 Charities Donation Tax Rebate Calculator & Verifier */}
            {article.id === 'sro-213-2026-approved-11-institutions-donation-tax-rebate' && (
              <div className="my-8 not-prose" id="sro-213-donation-rebate-tool">
                <Sro213DonationRebateWidget />
              </div>
            )}

            {/* Interactive Legal & Accounting Glossary Companion Bar */}
            <ArticleGlossaryBar
              detectedTerms={detectedGlossaryTerms}
              highlightsEnabled={glossaryHighlightsEnabled}
              onToggleHighlights={() => setGlossaryHighlightsEnabled(prev => !prev)}
              onSelectTerm={(term) => setActiveGlossaryModalTerm(term)}
            />

            {/* 2-7. Article Content Area (Markdown) */}
            <div 
              id="article-content-body" 
              className={`prose ${proseThemeClass} ${proseSizeClass} max-w-none prose-headings:font-bold prose-headings:scroll-mt-28 prose-a:font-semibold hover:prose-a:underline mb-16 transition-colors duration-200`}
            >
              <Markdown 
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  ...markdownComponents, 
                  "document-checklist": () => <DocumentChecklist />,
                  "other-sources-checklist": () => (
                    <div className="my-10 not-prose">
                      <OtherSourcesDocChecklist 
                        showBengaliDefault={language === 'bn'}
                        className="shadow-lg hover:shadow-xl transition-shadow duration-300 ring-1 ring-slate-900/5"
                      />
                    </div>
                  ),
                  "tds-lottery-gifts-screener": () => (
                    <div className="my-10 not-prose">
                      <TdsLotteryGiftsFreelanceCard 
                        showBengaliDefault={language === 'bn'}
                        className="shadow-lg hover:shadow-xl transition-shadow duration-300 ring-1 ring-slate-900/5"
                      />
                    </div>
                  ),
                  "taxable-exempt-screener": () => (
                    <div className="my-10 not-prose">
                      <TaxableVsExemptIncomeCalculator 
                        showBengaliDefault={language === 'bn'}
                        className="shadow-lg hover:shadow-xl transition-shadow duration-300 ring-1 ring-slate-900/5"
                      />
                    </div>
                  ),
                  "vat-apportionment-calculator": () => (
                    <div className="my-10 not-prose scroll-mt-24" id="vat-apportionment-calculator-tool">
                      <VatApportionmentCalculator />
                    </div>
                  )
                } as any}
              >
                {localizedContent}
              </Markdown>
            </div>

            {/* Conditional Checklists Injection */}
            {article.id === 'income-from-other-sources-sections-66-67-income-tax-act-2023' && (
              <div className="my-12 scroll-mt-24 not-prose" id="tax-documentation-checklist-tool">
                <OtherSourcesDocChecklist 
                  showBengaliDefault={language === 'bn'}
                  className="shadow-lg hover:shadow-xl transition-shadow duration-300 ring-1 ring-slate-900/5"
                />
              </div>
            )}
            {article.id === 'required-documents-rjsc-annual-return-filing-bangladesh' && (
              <ComplianceChecklist />
            )}
            {article.id === 'section-272-income-tax-act-2023-penalty-bangladesh' && (
              <Section272ComplianceChecklist />
            )}
            {article.id === 'benefits-of-filing-income-tax-return-bangladesh' && (
              <>
                <div className="my-12">
                  <h3 className="text-2xl font-bold text-slate-900 mb-6">Tax Filing Deadline & Incentives</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
                    <div>
                      <ImageGallery 
                        layout="grid"
                        className="!my-0 grid-cols-1 sm:grid-cols-1 lg:grid-cols-1"
                        images={[
                          { url: 'https://pub-d893cbb677b6463eb69f13e1dbb40541.r2.dev/Tax%20sep%2030300.png', caption: 'Tax Return Deadline: September 30' }
                        ]} 
                      />
                    </div>
                    <div className="space-y-6">
                      <ImageGallery 
                        layout="grid"
                        className="!my-0 grid-cols-1 sm:grid-cols-1 lg:grid-cols-1"
                        images={[
                          { url: 'https://pub-d893cbb677b6463eb69f13e1dbb40541.r2.dev/tax%20sep%2030.png', caption: 'Early Filing Benefits & Incentives' }
                        ]} 
                      />
                      {/* Copy of the second picture placed below it */}
                      <ImageGallery 
                        layout="grid"
                        className="!my-0 grid-cols-1 sm:grid-cols-1 lg:grid-cols-1"
                        images={[
                          { url: 'https://pub-d893cbb677b6463eb69f13e1dbb40541.r2.dev/tax%20sep%2030.png', caption: 'Early Filing Benefits & Incentives (Copy)' }
                        ]} 
                      />
                    </div>
                  </div>
                </div>
                <div className="my-12" id="early-filing-tool">
                  <EarlyFilingIncentive initialPayableTax={50000} className="shadow-lg hover:shadow-xl transition-shadow duration-300 ring-1 ring-slate-900/5" />
                </div>
              </>
            )}

            {article.id === 'investment-tax-rebate-bangladesh-2026-2027' && (
              <div className="my-12 scroll-mt-24" id="investment-tax-rebate-tool">
                <InvestmentTaxRebateCalculator className="shadow-lg hover:shadow-xl transition-shadow duration-300 ring-1 ring-slate-900/5" />
              </div>
            )}

            {article.id === 'total-income-calculation-bangladesh-2026-2027' && (
              <>
                <div className="my-12 scroll-mt-24" id="tax-summary-dashboard-tool">
                  <TaxSummaryDashboard className="shadow-lg hover:shadow-xl transition-shadow duration-300 ring-1 ring-slate-900/5" />
                </div>
                <div className="my-12 scroll-mt-24" id="tax-return-checklist-tool">
                  <TaxReturnChecklist className="shadow-lg hover:shadow-xl transition-shadow duration-300 ring-1 ring-slate-900/5" />
                </div>
                <div className="my-12 scroll-mt-24" id="total-income-calculator-tool">
                  <TotalIncomeCalculator className="shadow-lg hover:shadow-xl transition-shadow duration-300 ring-1 ring-slate-900/5" />
                </div>
              </>
            )}

            {article.id === 'agricultural-income-tax-bangladesh-2026-2027' && (
              <>
                <div className="my-12 scroll-mt-24" id="clause-20-exemption-card">
                  <Clause20ExemptionCard className="shadow-lg hover:shadow-xl transition-shadow duration-300 ring-1 ring-slate-900/5" />
                </div>
                <div className="my-12 scroll-mt-24" id="agricultural-tax-calculator-tool">
                  <AgriculturalTaxCalculator className="shadow-lg hover:shadow-xl transition-shadow duration-300 ring-1 ring-slate-900/5" />
                </div>
              </>
            )}

            {article.id === 'minimum-turnover-tax-slabs-bangladesh-2026-2027' && (
              <>
                <div className="my-12 scroll-mt-24" id="turnover-slabs-summary-card">
                  <TurnoverSlabsSummaryCard className="shadow-lg hover:shadow-xl transition-shadow duration-300 ring-1 ring-slate-900/5" />
                </div>
                <div className="my-12 scroll-mt-24" id="turnover-tax-calculator-tool">
                  <TurnoverTaxCalculator className="shadow-lg hover:shadow-xl transition-shadow duration-300 ring-1 ring-slate-900/5" />
                </div>
              </>
            )}

            {article.id === 'tax-rebate-ceiling-bangladesh-finance-act-2026' && (
              <>
                <div className="my-12 scroll-mt-24" id="tax-rebate-ceiling-card">
                  <TaxRebateCeilingCard className="shadow-lg hover:shadow-xl transition-shadow duration-300 ring-1 ring-slate-900/5" />
                </div>
                <div className="my-12 scroll-mt-24" id="investment-tax-rebate-calculator-tool">
                  <InvestmentTaxRebateCalculator className="shadow-lg hover:shadow-xl transition-shadow duration-300 ring-1 ring-slate-900/5" />
                </div>
              </>
            )}

            {article.id === 'corporate-tax-rates-bangladesh-fy-2026-27' && (
              <>
                <div className="my-12 scroll-mt-24" id="corporate-tax-calculator-tool">
                  <CorporateTaxRateCalculator className="shadow-lg hover:shadow-xl transition-shadow duration-300 ring-1 ring-slate-900/5" />
                </div>
                <div className="my-12 scroll-mt-24" id="corporate-compliance-mastery-quiz">
                  <CorporateComplianceMasteryQuiz initialTopic="BANKING_2_5" />
                </div>
              </>
            )}

            {(article.id === 'inadmissible-deductions-tax-disallowances-sections-55-56-bangladesh' ||
              article.id === 'set-off-carry-forward-business-losses-section-70-71-bangladesh-tax' ||
              article.id === 'minimum-turnover-tax-slabs-bangladesh-2026-2027' ||
              article.id === 'income-tax-circular-2026-2027-expense-deductions-business-restructuring') && (
              <div className="my-12 scroll-mt-24" id="corporate-compliance-mastery-quiz">
                <CorporateComplianceMasteryQuiz
                  initialTopic={
                    article.id === 'inadmissible-deductions-tax-disallowances-sections-55-56-bangladesh'
                      ? 'SEC_56_56KA'
                      : article.id === 'set-off-carry-forward-business-losses-section-70-71-bangladesh-tax'
                      ? 'STARTUP_SANDBOX'
                      : 'ALL'
                  }
                />
              </div>
            )}

            {(article.id === 'capital-gains-tax-bangladesh-finance-act-2026' || article.id === 'capital-gains-tax-calculation-examples-ay-2026-27') && (
              <div className="my-12 scroll-mt-24" id="capital-gains-tax-calculator-tool">
                <CapitalGainsTaxCalculator className="shadow-lg hover:shadow-xl transition-shadow duration-300 ring-1 ring-slate-900/5" />
              </div>
            )}

            {/* Dynamic Gallery Images */}
            {article.galleryImages && article.galleryImages.length > 0 && (
              <div className="my-12">
                <h3 className="text-2xl font-bold text-slate-900 mb-6">Gallery Images</h3>
                <ImageGallery 
                  layout="grid"
                  images={article.galleryImages}
                />
              </div>
            )}

            {/* Tags */}
            <div className="flex items-center gap-3 py-6 border-y border-slate-200 mb-8 flex-wrap">
              <span className="text-sm font-bold text-slate-900">Related Tags:</span>
              {article.tags.map(tag => (
                <Link key={tag} to={`/search?q=${encodeURIComponent(tag)}`} className="text-sm bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors">
                  #{tag}
                </Link>
              ))}
            </div>

            {/* Bottom Social Media Sharing & Networking Bar */}
            <SocialShareButtons 
              url={`/article/${article.id}`}
              title={article.title} 
              summary={article.excerpt} 
              variant="bottom-bar" 
            />

            {/* Strategic Partnership Media & Publishing Toolkit */}
            <EcosystemSocialKit articleId={article.id} />

            {/* 8. Author Profile Section */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 mb-12 flex flex-col md:flex-row gap-6 items-start">
              <img src={article.author.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} alt={article.author.name} className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-sm shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">{article.author.name}</h3>
                <p className="text-emerald-700 font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" /> {article.author.role || 'Corporate Legal Expert'}
                </p>
                <p className="text-slate-600 mb-4 leading-relaxed">
                  {article.author.name} is a seasoned legal professional specializing in corporate compliance, tax legislation, and business advisory in Bangladesh. With over a decade of experience, they provide actionable insights for growing enterprises.
                </p>
                <Link to="/team" className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 hover:text-emerald-600 transition-colors">
                  View Full Profile <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* 9. Professional Comments & Peer Discussion Section (Hidden in Focus Mode) */}
            {!isFocusMode && (
              <div id="professional-comments-section" className="mb-12 scroll-mt-24">
                <CommentSection 
                  articleId={article.id} 
                  articleTitle={article.title}
                  articleCategory={article.category}
                />
              </div>
            )}

            {!isFocusMode && <BlogDisclaimer topic={article.category} />}

            {!isFocusMode && <RelatedResources currentCategory={article.category} />}

            {!isFocusMode && <ContactELawyers />}

            {!isFocusMode && <ChecklistExporter articleId={article.id} />}

            {/* In Focus Mode: Clean End of Article Completion Card */}
            {isFocusMode && (
              <div className={`my-12 p-8 rounded-3xl border text-center space-y-4 transition-colors duration-200 ${
                readerTheme === 'sepia'
                  ? 'bg-[#f4ebd8] border-[#e2d5be] text-[#3c2f1f]'
                  : readerTheme === 'dark'
                  ? 'bg-slate-900 border-slate-800 text-slate-100'
                  : 'bg-emerald-500/5 border-emerald-500/20 text-slate-800'
              }`}>
                <div className="inline-flex p-3 rounded-2xl bg-emerald-600 text-white shadow-xs">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className={`text-xl font-bold ${headingColorClass}`}>
                  You have finished reading this guide
                </h3>
                <p className={`text-sm max-w-md mx-auto ${excerptColorClass}`}>
                  Focus Mode provides an ad-free, distraction-free reading experience. You can exit anytime to explore peer discussions, related insights, or professional consultation services.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={toggleFocusMode}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Minimize2 className="w-4 h-4" />
                    <span>Exit Focus Mode</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Scroll to Top
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* 12. Sidebar Content (Desktop 25% Sticky Rail) - Hidden in Focus Mode or Full-Width Canvas */}
          {!isFocusMode && !isFullWidthCanvas && (
            <aside className="lg:col-span-3 relative w-full">
              <div className="sticky top-20 space-y-6 w-full">
                {/* Sticky Interactive Chapter Navigator at Top of Sidebar */}
                <ArticleNavigator
                  content={localizedContent}
                  articleTitle={article.title}
                  scrollProgress={scrollProgress}
                  readingTimeMinutes={readingTimeMinutes}
                  targetContainerId="article-content-body"
                  stickyClassName=""
                />

              {/* Search Box */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Search Legal Articles</h3>
                <form onSubmit={searchSubmit} className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    name="search"
                    type="text" 
                    placeholder="Search topics..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </form>
              </div>

              {/* Sidebar Promotional Image */}
              <div className="rounded-3xl overflow-hidden shadow-sm border border-slate-200">
                <img 
                  src="https://pub-d893cbb677b6463eb69f13e1dbb40541.r2.dev/90b0e2d5-0462-418b-ab5f-3dd3b3b40770.png" 
                  alt="Featured Guide" 
                  className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300 cursor-pointer" 
                />
              </div>

              {/* Categories */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Categories</h3>
                <ul className="space-y-2">
                  {categories.map(cat => (
                    <li key={cat.id}>
                      <Link to={`/category/${cat.id}`} className="flex items-center justify-between group p-2 hover:bg-slate-50 rounded-xl transition-colors">
                        <span className="text-sm font-medium text-slate-600 group-hover:text-emerald-700 transition-colors">{cat.name}</span>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Related Insights (Sidebar) */}
              {relatedArticles.length > 0 && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" /> Related Insights
                  </h3>
                  <div className="space-y-4">
                    {relatedArticles.slice(0, 3).map(rel => (
                      <Link key={rel.id} to={`/article/${rel.id}`} className="flex gap-4 group">
                        <img src={rel.imageUrl} alt={rel.title} className="w-16 h-16 rounded-xl object-cover border border-slate-100 shrink-0" />
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 group-hover:text-emerald-600 transition-colors line-clamp-2 mb-1">{rel.title}</h4>
                          <span className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold">{rel.category}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Posts */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-600" /> Most Read Articles
                </h3>
                <div className="space-y-4">
                  {popularArticles.map(pop => (
                    <Link key={pop.id} to={`/article/${pop.id}`} className="flex gap-4 group">
                      <img src={pop.imageUrl} alt={pop.title} className="w-16 h-16 rounded-xl object-cover border border-slate-100 shrink-0" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 group-hover:text-emerald-600 transition-colors line-clamp-2 mb-1">{pop.title}</h4>
                        <span className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold">{pop.category}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Newsletter Signup in Sidebar (Direct Firestore Persistence) */}
              <NewsletterSignup 
                variant="sidebar"
                currentCategory={article.category}
                sourceArticleTitle={article.title}
                sourceArticleId={article.id}
              />

              {/* Quick Share Widget */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Share2 className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Share Insight</h3>
                </div>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Share this statutory analysis with your professional network and colleagues.
                </p>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <SocialShareButtons 
                    url={`/article/${article.id}`}
                    title={article.title} 
                    summary={article.excerpt} 
                    variant="sidebar-card" 
                    className="w-full"
                  />
                </div>
              </div>

              {/* Advertisement / Service Banner */}
              <div className="bg-slate-900 p-8 rounded-3xl text-center text-white shadow-lg relative overflow-hidden border border-slate-800">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <FileText className="w-24 h-24 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold mb-3 relative z-10">Company Registration Service</h3>
                <p className="text-slate-400 text-sm mb-6 relative z-10">End-to-end RJSC incorporation and trade license acquisition.</p>
                <Link 
                  to="/contact" 
                  className="inline-flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors relative z-10 shadow-md"
                >
                  <span>Book Consultation</span>
                  <ExternalLink className="w-4 h-4 text-emerald-200" />
                </Link>
              </div>

            </div>
          </aside>
          )}

        </div>
      </div>

      {/* 9. Related Articles (Hidden in Focus Mode) */}
      {!isFocusMode && <RelatedArticles currentArticle={article} maxItems={4} />}

      {/* Statutory Term Detail Modal triggered from Glossary Tooltip or Bar */}
      <TermDetailModal
        term={activeGlossaryModalTerm}
        onClose={() => setActiveGlossaryModalTerm(null)}
        isBookmarked={activeGlossaryModalTerm ? bookmarkedGlossaryIds.includes(activeGlossaryModalTerm.id) : false}
        onToggleBookmark={handleToggleGlossaryBookmark}
        onSelectRelatedTerm={(relatedId) => {
          const found = ALL_GLOSSARY_TERMS.find(t => t.id === relatedId);
          if (found) setActiveGlossaryModalTerm(found);
        }}
      />

      {/* Quote Card Generator Modal */}
      {isQuoteModalOpen && selectedQuoteText && (
        <QuoteCardGeneratorModal
          isOpen={isQuoteModalOpen}
          onClose={() => setIsQuoteModalOpen(false)}
          initialQuote={selectedQuoteText}
          articleTitle={article.title}
          articleAuthor={article.author.name}
          articleUrl={window.location.href}
        />
      )}

      {/* Floating Selection Toolbar Button */}
      {floatingToolbarPos && !isQuoteModalOpen && (
        <div
          style={{ top: `${floatingToolbarPos.y}px`, left: `${floatingToolbarPos.x}px` }}
          className="absolute z-40 animate-in fade-in zoom-in-95 duration-150"
        >
          <button
            type="button"
            onClick={() => {
              setIsQuoteModalOpen(true);
              setFloatingToolbarPos(null);
            }}
            className="flex items-center gap-2 bg-slate-900 dark:bg-emerald-600 text-white px-3.5 py-2 rounded-xl shadow-xl hover:bg-slate-800 dark:hover:bg-emerald-500 font-bold text-xs cursor-pointer border border-white/20 transition-transform hover:scale-105"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 dark:text-white" />
            <span>Create Share Quote</span>
          </button>
        </div>
      )}
    </>
  );
}
