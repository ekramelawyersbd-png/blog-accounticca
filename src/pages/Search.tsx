import { BookmarkButton } from '../components/BookmarkButton';
import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { mockArticles } from '../data/mockData';
import { format } from 'date-fns';
import { calculateReadingTime } from '../utils/readingTime';
import { Search as SearchIcon, History, X, Clock, Calendar, ExternalLink, Calculator, ArrowRight, Sparkles, BookOpen, FileText } from 'lucide-react';
import { buildAppointmentUrl } from '../utils/appointmentRedirect';
import { searchableTaxTools, SearchableTool } from '../data/searchableTools';
import { SEO } from '../components/SEO';

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

  // Click outside listener for suggestions
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

      const filtered = mockArticles.filter(article => 
        article.title.toLowerCase().includes(lowerQuery) || 
        article.excerpt.toLowerCase().includes(lowerQuery) ||
        article.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
        article.category.toLowerCase().includes(lowerQuery)
      );
      setResults(filtered);

      const toolsFiltered = searchableTaxTools.filter(tool => {
        const nameLower = tool.name.toLowerCase();
        const shortLower = tool.shortName.toLowerCase();
        const descLower = tool.description.toLowerCase();
        const catLower = tool.category.toLowerCase();
        return nameLower.includes(lowerQuery) ||
               shortLower.includes(lowerQuery) ||
               descLower.includes(lowerQuery) ||
               catLower.includes(lowerQuery) ||
               tool.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
               tokens.some(t => nameLower.includes(t) || tool.tags.some(tag => tag.includes(t)));
      });
      setMatchingTools(toolsFiltered);

      const trimmed = query.trim();
      if (trimmed) {
        setRecentSearches(prev => {
          const updated = [trimmed, ...prev.filter(item => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_RECENT_SEARCHES);
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
      setMatchingTools(searchableTaxTools.filter(t => t.featured));
    }
  }, [query]);

  // Suggestions for autocomplete while typing
  const liveSuggestions = React.useMemo(() => {
    const trimmed = inputValue.trim().toLowerCase();
    if (!trimmed) return { tools: [], articles: [] };
    const tokens = trimmed.split(/\s+/).filter(Boolean);

    const tools = searchableTaxTools
      .filter(t => {
        const name = t.name.toLowerCase();
        const tags = t.tags.join(' ').toLowerCase();
        return name.includes(trimmed) || tokens.every(tok => name.includes(tok) || tags.includes(tok));
      })
      .slice(0, 3);

    const articles = mockArticles
      .filter(a => {
        const title = a.title.toLowerCase();
        const tags = (a.tags || []).join(' ').toLowerCase();
        return title.includes(trimmed) || tokens.every(tok => title.includes(tok) || tags.includes(tok));
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
    setRecentSearches(prev => {
      const updated = prev.filter(term => term !== termToRemove);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
      <div className="mb-12">
        <h1 id="search-page-title" className="text-3xl font-bold text-slate-900 mb-6 text-center">Search Results</h1>
        <form 
          ref={formRef}
          id="search-page-form"
          className="app-form-60 relative w-full lg:w-[60vw] mx-auto"
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
          <SearchIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
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
            placeholder="Search for articles, VAT, tax rules..."
            className="w-full pl-12 pr-10 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm text-slate-900"
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
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              aria-label="Clear search input"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Real-time Autocomplete Dropdown attached to search input */}
          {showInputSuggestions && (liveSuggestions.tools.length > 0 || liveSuggestions.articles.length > 0) && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 bg-slate-50 flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span className="flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Suggestions as you type
                </span>
                <span>Press Enter to search</span>
              </div>

              {liveSuggestions.tools.length > 0 && (
                <div className="p-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 px-2 py-1 block">
                    Tax Tools &amp; Calculators
                  </span>
                  {liveSuggestions.tools.map(tool => (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => {
                        setShowInputSuggestions(false);
                        navigate(tool.path);
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-emerald-50/80 flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                          <Calculator className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                            {tool.name}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {tool.category}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              )}

              {liveSuggestions.articles.length > 0 && (
                <div className="p-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 px-2 py-1 block">
                    Articles &amp; Guides
                  </span>
                  {liveSuggestions.articles.map(article => (
                    <button
                      key={article.id}
                      type="button"
                      onClick={() => {
                        setShowInputSuggestions(false);
                        navigate(`/article/${article.id}`);
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-blue-50/80 flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 group-hover:text-blue-900 truncate">
                            {article.title}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {article.category}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </form>

        {recentSearches.length > 0 && (
          <div id="recent-searches-section" className="mt-4 flex flex-wrap items-center gap-2 max-w-2xl">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mr-1 shrink-0">
              <History className="w-3.5 h-3.5 text-slate-400" />
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
                    className={`group inline-flex items-center gap-1.5 pl-3 pr-2 py-1 text-xs font-medium rounded-full transition-colors border ${
                      isActive
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-xs'
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
                          handleRemoveRecent(term, e as any);
                        }
                      }}
                      className="p-0.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              id="clear-all-recent-searches-btn"
              type="button"
              onClick={handleClearAllRecent}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors ml-2 hover:underline cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Matching Tax & Compliance Tools */}
      {matchingTools.length > 0 && (
        <div id="matching-tax-tools-section" className="mb-10 p-6 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/60 rounded-3xl border border-emerald-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 leading-tight">
                  {query ? 'Matching Tax & Compliance Tools' : 'Featured Tax Tools'}
                </h2>
                <p className="text-xs text-slate-500">
                  Interactive calculators, statutory planners &amp; guides
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
              {matchingTools.length} Tool{matchingTools.length > 1 ? 's' : ''} Found
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {matchingTools.map(tool => (
              <Link
                key={tool.id}
                to={tool.path}
                className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-400 hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {tool.category}
                    </span>
                    {tool.badge && (
                      <span className="text-[10px] font-extrabold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {tool.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {tool.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700 group-hover:text-emerald-800">
                  <span>Open Tool</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <h2 id="search-results-heading" className="text-lg font-bold text-slate-800">
          {query ? `Showing articles for "${query}"` : 'All Articles'}
        </h2>
        <span id="search-results-count" className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          {results.length} found
        </span>
      </div>

      {results.length > 0 ? (
        <div id="search-results-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {results.map(article => (
            <Link key={article.id} id={`search-result-article-${article.id}`} to={`/article/${article.id}`} className="group bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden">
              <div className="aspect-video w-full overflow-hidden">
                <img 
                  src={article.imageUrl} 
                  alt={article.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest mb-4">
                  <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">{article.category}</span>
                  <span className="text-slate-400 flex items-center gap-1">
                    {format(new Date(article.publishedAt), 'MMM d, yyyy')} • 
                    <Clock className="w-3 h-3" /> {calculateReadingTime(article.content)} min
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-tight">
                    {article.title}
                  </h3>
                  <BookmarkButton 
                    id={article.id} 
                    title={article.title} 
                    url={`/article/${article.id}`}
                    className="p-1.5 -mr-1.5 -mt-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-emerald-600 transition-colors shrink-0" 
                  />
                </div>
                <p className="text-slate-600 line-clamp-3 mb-6 flex-1 text-sm">
                  {article.excerpt}
                </p>
                <div className="flex items-center gap-3 mt-auto pt-4 border-t border-slate-100">
                  <img src={article.author.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(article.author.name)}&background=047857&color=fff`} alt={article.author.name} className="w-8 h-8 rounded-full object-cover" onError={(e) => { const target = e.target as HTMLImageElement; target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(article.author.name)}&background=047857&color=fff`; }} />
                  <span className="text-sm font-bold text-slate-700">{article.author.name}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div id="search-no-results" className="text-center py-16 px-6 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <SearchIcon className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-900 text-lg font-bold mb-2">No articles found{query ? ` for "${query}"` : ''}</p>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
            Looking for customized legal advice or tax representation on this topic? Connect directly with our panel of practicing lawyers.
          </p>
          <a
            href={buildAppointmentUrl({
              service: 'Legal & Tax Consultation',
              notes: query ? `Search query: ${query}` : undefined,
              source: 'Search Page - No Results'
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold transition-all shadow-sm"
          >
            <Calendar className="w-4 h-4 text-emerald-200" />
            <span>Book Consultation on Appointment Portal</span>
            <ExternalLink className="w-3.5 h-3.5 text-emerald-200" />
          </a>
        </div>
      )}
    </div>
  );
}
