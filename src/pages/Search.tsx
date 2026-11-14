import { BookmarkButton } from '../components/BookmarkButton';
import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { mockArticles } from '../data/mockData';
import { format } from 'date-fns';
import { calculateReadingTime } from '../utils/readingTime';
import {
  Search as SearchIcon,
  History,
  X,
  Clock,
  Calendar,
  ExternalLink,
  Calculator,
  ArrowRight,
  Sparkles,
  FileText,
  BookOpen,
} from 'lucide-react';
import { buildAppointmentUrl } from '../utils/appointmentRedirect';
import { searchableTaxTools, SearchableTool } from '../data/searchableTools';
import { SEO } from '../components/SEO';
import {
  ContactPageShell,
  ContactSectionHeader,
} from '../components/layout/ContactPageShell';

const RECENT_SEARCHES_KEY = 'elawyers_recent_searches';
const MAX_RECENT_SEARCHES = 5;

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(query);
  const [results, setResults] = useState(mockArticles);
  const [matchingTools, setMatchingTools] = useState<SearchableTool[]>([]);
  const [showInputSuggestions, setShowInputSuggestions] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.slice(0, MAX_RECENT_SEARCHES);
        }
      }
    } catch {
      // ignore JSON parse error
    }
    return [];
  });

  useEffect(() => {
    setInputValue(query);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setShowInputSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query) {
      const lowerQuery = query.toLowerCase();
      const tokens = lowerQuery.split(/\s+/).filter(Boolean);

      const filtered = mockArticles.filter(
        (article) =>
          article.title.toLowerCase().includes(lowerQuery) ||
          article.excerpt.toLowerCase().includes(lowerQuery) ||
          article.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
          article.category.toLowerCase().includes(lowerQuery)
      );
      setResults(filtered);

      const toolsFiltered = searchableTaxTools.filter((tool) => {
        const nameLower = tool.name.toLowerCase();
        const shortLower = tool.shortName.toLowerCase();
        const descLower = tool.description.toLowerCase();
        const catLower = tool.category.toLowerCase();
        return (
          nameLower.includes(lowerQuery) ||
          shortLower.includes(lowerQuery) ||
          descLower.includes(lowerQuery) ||
          catLower.includes(lowerQuery) ||
          tool.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
          tokens.some((t) => nameLower.includes(t) || tool.tags.some((tag) => tag.includes(t)))
        );
      });
      setMatchingTools(toolsFiltered);

      const trimmed = query.trim();
      if (trimmed) {
        setRecentSearches((prev) => {
          const updated = [
            trimmed,
            ...prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase()),
          ].slice(0, MAX_RECENT_SEARCHES);
          try {
            localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
          } catch {
            // ignore localStorage quota errors
          }
          return updated;
        });
      }
    } else {
      setResults(mockArticles);
      setMatchingTools(searchableTaxTools.filter((t) => t.featured));
    }
  }, [query]);

  const liveSuggestions = React.useMemo(() => {
    const trimmed = inputValue.trim().toLowerCase();
    if (!trimmed) return { tools: [], articles: [] };
    const tokens = trimmed.split(/\s+/).filter(Boolean);

    const tools = searchableTaxTools
      .filter((t) => {
        const name = t.name.toLowerCase();
        const tags = t.tags.join(' ').toLowerCase();
        return name.includes(trimmed) || tokens.every((tok) => name.includes(tok) || tags.includes(tok));
      })
      .slice(0, 3);

    const articles = mockArticles
      .filter((a) => {
        const title = a.title.toLowerCase();
        const tags = (a.tags || []).join(' ').toLowerCase();
        return title.includes(trimmed) || tokens.every((tok) => title.includes(tok) || tags.includes(tok));
      })
      .slice(0, 4);

    return { tools, articles };
  }, [inputValue]);

  const handleSelectRecent = (term: string) => {
    setInputValue(term);
    setSearchParams({ q: term });
  };

  const handleRemoveRecent = (termToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((term) => term !== termToRemove);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleClearAllRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <ContactPageShell
      breadcrumbs={
        query
          ? [{ label: 'Knowledge Hub', path: '/search' }, { label: `Search: "${query}"` }]
          : [{ label: 'Knowledge Hub & Search' }]
      }
      eyebrow="Knowledge Hub · Search Articles, Calculators & Statutory Rules"
      headline={query ? `Results for "${query}"` : 'Knowledge Hub & Archive.'}
      accentHeadline="Search guides, tax tools & statutes."
      description="Explore Income Tax Act 2023 interpretations, VAT & SD Act compliance manuals, RJSC incorporation checklists, and interactive calculators."
      metaItems={[
        `${mockArticles.length} Statutory Articles`,
        `${searchableTaxTools.length} Interactive Calculators`,
        'Instant Autocomplete Search',
      ]}
      summaryCard={{
        eyebrow: 'Search Scope',
        title: `${results.length} Article${results.length === 1 ? '' : 's'} · ${matchingTools.length} Tool${matchingTools.length === 1 ? '' : 's'}`,
        icon: <BookOpen className="h-5 w-5" aria-hidden="true" />,
        description: query
          ? `Live index results across articles, regulatory references, and interactive tools matching "${query}".`
          : 'Browse our complete publication archive or enter keywords like TDS, VAT BIN, RJSC, Capital Gains, or SRO.',
        actions: [
          {
            label: 'All Calculators',
            to: '/tools',
            icon: <Calculator className="h-3.5 w-3.5" aria-hidden="true" />,
          },
          {
            label: 'Statutory Glossary',
            to: '/glossary',
            icon: <BookOpen className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />,
            variant: 'neutral',
          },
        ],
        footerText: 'Need tailored research? Submit a written brief to our Dhaka chambers.',
      }}
    >
      <SEO
        title={
          query
            ? `Search Results for "${query}" | Accounticca & E-Lawyers Knowledge Hub`
            : 'Search Legal, Tax, VAT & RJSC Guides and Calculators | Accounticca'
        }
        description={
          query
            ? `Explore articles, statutory guides, and tax calculators matching "${query}" on the Accounticca & E-Lawyers Compliance Hub.`
            : 'Search across Bangladesh Income Tax Act 2023 guides, VAT compliance resources, RJSC company filing checklists, and interactive calculators.'
        }
        canonicalUrl="/search"
      />

      {/* Search Form Card */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8">
        <form
          ref={formRef}
          id="search-page-form"
          className="relative mx-auto max-w-3xl"
          onSubmit={(e) => {
            e.preventDefault();
            setShowInputSuggestions(false);
            const trimmed = inputValue.trim();
            if (trimmed) {
              setSearchParams({ q: trimmed });
            } else {
              setSearchParams({});
            }
          }}
        >
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            id="search-page-input"
            name="search"
            type="text"
            value={inputValue}
            onFocus={() => setShowInputSuggestions(true)}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowInputSuggestions(true);
            }}
            placeholder="Search for articles, VAT, tax rules, RJSC forms..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-12 text-sm text-slate-900 shadow-2xs transition focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/15 sm:text-base"
          />
          {inputValue && (
            <button
              id="search-input-clear-btn"
              type="button"
              onClick={() => {
                setInputValue('');
                setSearchParams({});
                setShowInputSuggestions(false);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-slate-700 cursor-pointer"
              aria-label="Clear search input"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Real-time Autocomplete Dropdown */}
          {showInputSuggestions &&
            (liveSuggestions.tools.length > 0 || liveSuggestions.articles.length > 0) && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden divide-y divide-slate-100 rounded-2xl border border-slate-200/90 bg-white/95 shadow-xl backdrop-blur-xl">
                <div className="flex items-center justify-between bg-slate-50 px-4 py-2 text-[11px] font-bold text-slate-500">
                  <span className="flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="h-3 w-3 text-emerald-700" />
                    Suggestions as you type
                  </span>
                  <span>Press Enter to search</span>
                </div>

                {liveSuggestions.tools.length > 0 && (
                  <div className="p-2">
                    <span className="block px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                      Tax Tools &amp; Calculators
                    </span>
                    {liveSuggestions.tools.map((tool) => (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => {
                          setShowInputSuggestions(false);
                          navigate(tool.path);
                        }}
                        className="group flex w-full items-center justify-between rounded-xl p-2 text-left transition-colors hover:bg-emerald-50/80 cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                            <Calculator className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                              {tool.name}
                            </div>
                            <span className="text-[10px] text-slate-500">{tool.category}</span>
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:text-emerald-700" />
                      </button>
                    ))}
                  </div>
                )}

                {liveSuggestions.articles.length > 0 && (
                  <div className="p-2">
                    <span className="block px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                      Articles &amp; Guides
                    </span>
                    {liveSuggestions.articles.map((article) => (
                      <button
                        key={article.id}
                        type="button"
                        onClick={() => {
                          setShowInputSuggestions(false);
                          navigate(`/article/${article.id}`);
                        }}
                        className="group flex w-full items-center justify-between rounded-xl p-2 text-left transition-colors hover:bg-emerald-50/60 cursor-pointer"
                      >
                        <div className="flex min-w-0 items-center gap-2.5 pr-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                            <FileText className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                              {article.title}
                            </div>
                            <span className="text-[10px] text-slate-500">{article.category}</span>
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:text-emerald-700" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
        </form>

        {recentSearches.length > 0 && (
          <div
            id="recent-searches-section"
            className="mx-auto mt-4 flex max-w-3xl flex-wrap items-center gap-2"
          >
            <div className="mr-1 flex shrink-0 items-center gap-1.5 text-xs font-semibold text-slate-500">
              <History className="h-3.5 w-3.5 text-slate-400" />
              <span>Recent Searches:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {recentSearches.map((term, index) => {
                const isActive = query.toLowerCase() === term.toLowerCase();
                return (
                  <button
                    key={`${term}-${index}`}
                    id={`recent-search-chip-${index}`}
                    type="button"
                    onClick={() => handleSelectRecent(term)}
                    className={`group inline-flex items-center gap-1.5 rounded-full border py-1 pl-3 pr-2 text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-white text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>{term}</span>
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={`Remove "${term}" from recent searches`}
                      onClick={(e) => handleRemoveRecent(term, e)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleRemoveRecent(term, e as unknown as React.MouseEvent);
                        }
                      }}
                      className="ml-0.5 rounded-full p-0.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              id="clear-all-recent-searches-btn"
              type="button"
              onClick={handleClearAllRecent}
              className="ml-2 cursor-pointer text-xs text-slate-500 hover:text-slate-800 hover:underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Matching Tax & Compliance Tools */}
      {matchingTools.length > 0 && (
        <section
          id="matching-tax-tools-section"
          className="rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/30 p-6 shadow-xs sm:p-8"
        >
          <ContactSectionHeader
            eyebrow="Statutory Engines"
            title={query ? 'Matching Tax & Compliance Tools' : 'Featured Interactive Tools'}
            description="Interactive calculators, statutory planners & guides maintained by our advisory chambers."
            action={
              <span className="text-xs font-semibold text-emerald-800">
                {matchingTools.length} tool{matchingTools.length > 1 ? 's' : ''} matched
              </span>
            }
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {matchingTools.map((tool) => (
              <Link
                key={tool.id}
                to={tool.path}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition duration-200 hover:border-emerald-300 hover:shadow-md"
              >
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-emerald-800">{tool.category}</span>
                    {tool.badge && (
                      <span className="font-semibold text-slate-500">{tool.badge}</span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-950 transition-colors group-hover:text-emerald-800">
                    {tool.name}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-600">
                    {tool.description}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-emerald-800">
                  <span>Open Tool</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Articles Section */}
      <section>
        <ContactSectionHeader
          eyebrow="Publications & Briefs"
          title={query ? `Articles matching "${query}"` : 'All Statutory Articles'}
          description={`Showing ${results.length} curated article${results.length === 1 ? '' : 's'} from our knowledge repository.`}
          action={
            <span id="search-results-count" className="text-xs font-semibold text-slate-600">
              {results.length} found
            </span>
          }
        />

        {results.length > 0 ? (
          <div id="search-results-grid" className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {results.map((article) => (
              <Link
                key={article.id}
                id={`search-result-article-${article.id}`}
                to={`/article/${article.id}`}
                className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs transition duration-200 hover:border-emerald-300 hover:shadow-md"
              >
                <div className="aspect-video w-full overflow-hidden bg-slate-100">
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-emerald-800">{article.category}</span>
                    <span className="flex items-center gap-1">
                      {format(new Date(article.publishedAt), 'MMM d, yyyy')} ·
                      <Clock className="h-3 w-3" /> {calculateReadingTime(article.content)} min
                    </span>
                  </div>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <h3 className="text-lg font-bold leading-snug text-slate-950 transition-colors group-hover:text-emerald-800">
                      {article.title}
                    </h3>
                    <BookmarkButton
                      id={article.id}
                      title={article.title}
                      url={`/article/${article.id}`}
                      className="-mr-1.5 -mt-1.5 shrink-0 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-emerald-700"
                    />
                  </div>
                  <p className="mb-6 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">
                    {article.excerpt}
                  </p>
                  <div className="mt-auto flex items-center gap-3 border-t border-slate-100 pt-4">
                    <img
                      src={
                        article.author.avatarUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          article.author.name
                        )}&background=047857&color=fff`
                      }
                      alt={article.author.name}
                      className="h-8 w-8 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          article.author.name
                        )}&background=047857&color=fff`;
                      }}
                    />
                    <span className="text-sm font-semibold text-slate-800">
                      {article.author.name}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div
            id="search-no-results"
            className="mx-auto max-w-2xl rounded-3xl border border-slate-200/80 bg-white px-6 py-16 text-center shadow-xs"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <SearchIcon className="h-7 w-7" />
            </div>
            <p className="mb-2 text-lg font-bold text-slate-950">
              No articles found{query ? ` for "${query}"` : ''}
            </p>
            <p className="mx-auto mb-6 max-w-md text-sm leading-6 text-slate-600">
              Looking for customized legal advice or tax representation on this topic? Connect directly with our panel of practicing advocates and ACCA advisors.
            </p>
            <a
              href={buildAppointmentUrl({
                service: 'Legal & Tax Consultation',
                notes: query ? `Search query: ${query}` : undefined,
                source: 'Search Page - No Results',
              })}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
            >
              <Calendar className="h-4 w-4 text-emerald-100" />
              <span>Book Consultation on Advisory Desk</span>
              <ExternalLink className="h-3.5 w-3.5 text-emerald-100" />
            </a>
          </div>
        )}
      </section>
    </ContactPageShell>
  );
}
