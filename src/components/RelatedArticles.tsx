import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Article } from '../types';
import { mockArticles } from '../data/mockData';
import { Clock, ChevronRight, Tag, ArrowUpRight, BookOpen, Calendar, User, Sparkles, Layers, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { calculateReadingTime } from '../utils/readingTime';
import { BookmarkButton } from './BookmarkButton';

interface RelatedArticlesProps {
  currentArticle: Article;
  articles?: Article[];
  maxItems?: number;
  className?: string;
}

export interface RecommendedArticleItem {
  article: Article;
  score: number;
  matchingTags: string[];
  isSameCategory: boolean;
}

/**
 * Recommends 3-4 relevant articles dynamically based on category alignment
 * and tag similarity, with intelligent fallback.
 */
export function getRecommendedArticles(
  currentArticle: Article,
  allArticles: Article[] = mockArticles,
  limit: number = 4
): RecommendedArticleItem[] {
  if (!currentArticle) return [];

  const currentCategory = (currentArticle.category || '').toLowerCase().trim();
  const currentCategoryId = (currentArticle.categoryId || '').toLowerCase().trim();
  const currentTags = (currentArticle.tags || []).map(t => t.toLowerCase().trim());

  const getOverlapInfo = (candidate: Article) => {
    if (!candidate.tags || candidate.tags.length === 0) {
      return { score: 0, matches: [] };
    }

    const candTags = candidate.tags.map(t => t.toLowerCase().trim());
    let score = 0;
    const matches: string[] = [];

    for (let i = 0; i < candidate.tags.length; i++) {
      const origTag = candidate.tags[i];
      const lowerTag = candTags[i];

      if (currentTags.includes(lowerTag)) {
        score += 3; // High weight for exact tag match
        matches.push(origTag);
      } else {
        // Partial or word-boundary overlap
        for (const ct of currentTags) {
          if (ct.includes(lowerTag) || lowerTag.includes(ct)) {
            score += 1;
            matches.push(origTag);
            break;
          }
        }
      }
    }

    return { score, matches: Array.from(new Set(matches)) };
  };

  // 1. Primary candidate pool: filter out current article
  const candidatePool = allArticles.filter(a => a.id !== currentArticle.id);

  // Score each candidate by category priority & tag overlap
  const scoredCandidates: RecommendedArticleItem[] = candidatePool.map(article => {
    const candCat = (article.category || '').toLowerCase().trim();
    const candCatId = (article.categoryId || '').toLowerCase().trim();

    const isExactCategory = Boolean(
      (currentCategoryId && candCatId === currentCategoryId) ||
      (currentCategory && candCat === currentCategory)
    );

    const isRelatedCategory = Boolean(
      !isExactCategory && (
        (currentCategory.includes('tax') && (candCat.includes('tax') || candCat.includes('vat') || candCatId === 'tax')) ||
        (currentCategory.includes('vat') && (candCat.includes('vat') || candCat.includes('tax') || candCatId === 'vat')) ||
        (currentCategory.includes('corporate') && (candCat.includes('corporate') || candCat.includes('business') || candCatId === 'corporate')) ||
        (currentCategory.includes('business') && (candCat.includes('business') || candCat.includes('corporate') || candCatId === 'business')) ||
        (currentCategory.includes('accounting') && (candCat.includes('tax') || candCat.includes('accounting') || candCatId === 'accounting'))
      )
    );

    const { score: tagScore, matches } = getOverlapInfo(article);

    // Category weighting: exact same category gets highest base weight (+25),
    // related practice category gets secondary base weight (+12)
    let totalScore = tagScore;
    if (isExactCategory) {
      totalScore += 25;
    } else if (isRelatedCategory) {
      totalScore += 12;
    }

    return {
      article,
      score: totalScore,
      matchingTags: matches,
      isSameCategory: isExactCategory || isRelatedCategory
    };
  });

  // Sort candidates:
  // 1. Category and tag score (highest first)
  // 2. Publication date (most recent first)
  // 3. Reader popularity / likes
  scoredCandidates.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    const dateA = new Date(a.article.publishedAt).getTime();
    const dateB = new Date(b.article.publishedAt).getTime();
    if (dateB !== dateA) {
      return dateB - dateA;
    }
    return (b.article.likes || 0) - (a.article.likes || 0);
  });

  return scoredCandidates.slice(0, Math.max(3, limit));
}

export function RelatedArticles({
  currentArticle,
  articles = mockArticles,
  maxItems = 4,
  className = '',
}: RelatedArticlesProps) {
  const recommendedItems = useMemo(
    () => getRecommendedArticles(currentArticle, articles, maxItems),
    [currentArticle, articles, maxItems]
  );

  // Extract unique topics / tags from the current article and related articles in this category
  const similarTopics = useMemo(() => {
    const topicSet = new Set<string>();
    if (currentArticle.tags) {
      currentArticle.tags.forEach(t => topicSet.add(t));
    }
    recommendedItems.forEach(({ article, matchingTags }) => {
      matchingTags.forEach(t => topicSet.add(t));
      if (article.tags) {
        article.tags.slice(0, 3).forEach(t => topicSet.add(t));
      }
    });
    return Array.from(topicSet).slice(0, 7);
  }, [currentArticle, recommendedItems]);

  if (recommendedItems.length === 0) {
    return null;
  }

  const gridColsClass =
    recommendedItems.length === 4
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      : recommendedItems.length === 3
      ? 'grid-cols-1 md:grid-cols-3'
      : recommendedItems.length === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  const categoryUrl = currentArticle.categoryId 
    ? `/category/${currentArticle.categoryId}` 
    : '/category/corporate';

  return (
    <section 
      id="related-articles-section"
      aria-labelledby="related-articles-heading"
      className={`bg-slate-50/90 py-14 md:py-20 border-t border-slate-200 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
              <span>Related Articles &bull; {currentArticle.category}</span>
            </div>
            <h2 
              id="related-articles-heading"
              className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5"
            >
              <span>Related Articles</span>
            </h2>
            <p className="text-slate-600 text-sm md:text-base mt-2 max-w-2xl leading-relaxed">
              Explore similar topics and authoritative guides in <span className="font-semibold text-slate-900">{currentArticle.category}</span> to navigate Bangladesh statutory compliance and business law.
            </p>
          </div>

          <Link
            id="related-articles-view-category-btn"
            to={categoryUrl}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:text-emerald-800 bg-white border border-emerald-200 px-4 py-2.5 rounded-xl shadow-2xs hover:shadow-xs transition-all group shrink-0"
          >
            <span>All {currentArticle.category} Articles</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Similar Topics / Tags Bar */}
        {similarTopics.length > 0 && (
          <div className="mb-8 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mr-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Similar Topics:</span>
            </span>
            {similarTopics.map(topic => (
              <Link
                key={topic}
                to={`/search?q=${encodeURIComponent(topic)}`}
                className="text-xs font-medium bg-white text-slate-700 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 px-3 py-1 rounded-lg transition-colors shadow-2xs hover:bg-emerald-50/50"
              >
                #{topic}
              </Link>
            ))}
          </div>
        )}

        {/* Dynamic Articles Cards Grid */}
        <div className={`grid ${gridColsClass} gap-6 sm:gap-8`}>
          {recommendedItems.map(({ article, matchingTags, isSameCategory }, idx) => {
            const readingTime = calculateReadingTime(article.content);
            const displayTag = matchingTags.length > 0 ? matchingTags[0] : (article.tags && article.tags[0]);
            const formattedDate = article.publishedAt 
              ? format(new Date(article.publishedAt), 'MMM d, yyyy') 
              : 'Recent';

            return (
              <article
                key={article.id}
                id={`related-article-card-${idx}`}
                className="group bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 flex flex-col overflow-hidden h-full"
              >
                {/* Image Container with Link */}
                <div className="aspect-[16/10] w-full overflow-hidden relative bg-slate-100">
                  <Link to={`/article/${article.id}`} tabIndex={-1} aria-hidden="true">
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>

                  {/* Category Pill Overlay */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 pointer-events-none">
                    <span className="bg-slate-900/85 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-md tracking-wider uppercase shadow-xs">
                      {article.category}
                    </span>
                    {isSameCategory && (
                      <span className="bg-emerald-700/90 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wide shadow-xs flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-200" />
                        <span>Related</span>
                      </span>
                    )}
                  </div>

                  {/* Bookmark Button */}
                  <div className="absolute top-3 right-3">
                    <BookmarkButton
                      id={article.id}
                      title={article.title}
                      url={`/article/${article.id}`}
                      className="p-1.5 bg-white/90 backdrop-blur-xs rounded-lg hover:bg-white text-slate-700 shadow-xs"
                    />
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Topic / Matching Tag Indicator */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      {displayTag ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          <Tag className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate">#{displayTag}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                          <Layers className="w-3 h-3 text-slate-400" />
                          <span>Similar Topic</span>
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 shrink-0">
                        <Clock className="w-3 h-3" />
                        <span>{readingTime} min</span>
                      </span>
                    </div>

                    {/* Article Title */}
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug mb-2.5">
                      <Link 
                        id={`related-article-link-${idx}`}
                        to={`/article/${article.id}`}
                        className="focus:outline-none focus:underline"
                      >
                        {article.title}
                      </Link>
                    </h3>

                    {/* Excerpt */}
                    <p className="text-slate-600 text-xs sm:text-sm line-clamp-2 mb-4 leading-relaxed">
                      {article.excerpt}
                    </p>
                  </div>

                  {/* Metadata Footer */}
                  <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-2 truncate pr-2">
                      {article.author?.avatarUrl ? (
                        <img 
                          src={article.author.avatarUrl} 
                          alt={article.author.name} 
                          className="w-5 h-5 rounded-full object-cover border border-slate-200" 
                        />
                      ) : (
                        <User className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span className="truncate">{article.author?.name || 'Legal Analyst'}</span>
                    </div>

                    <Link
                      to={`/article/${article.id}`}
                      aria-label={`Read ${article.title}`}
                      className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:text-emerald-800 transition-colors group/link shrink-0"
                    >
                      <span>Read</span>
                      <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
