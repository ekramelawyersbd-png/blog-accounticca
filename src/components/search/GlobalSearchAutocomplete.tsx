import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  X, 
  Calculator, 
  Calendar, 
  FileText, 
  BookOpen, 
  Coins, 
  Building2, 
  FolderDown, 
  Scale, 
  Receipt, 
  ShieldCheck, 
  ArrowRight, 
  ArrowUpRight, 
  Sparkles, 
  Clock, 
  History, 
  Tag, 
  ExternalLink,
  ChevronRight,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { mockArticles } from '../../data/mockData';
import { searchableTaxTools, SearchableTool } from '../../data/searchableTools';
import { Article } from '../../types';
import { cn } from '../../lib/utils';
import { calculateReadingTime } from '../../utils/readingTime';

const RECENT_SEARCHES_KEY = 'elawyers_recent_searches';
const MAX_RECENT_SEARCHES = 4;

interface GlobalSearchAutocompleteProps {
  isOpen: boolean;
  onClose: () => void;
  variant?: 'navbar-desktop' | 'navbar-mobile' | 'standalone';
  placeholder?: string;
  autoFocus?: boolean;
}

type AutocompleteItem = 
  | { type: 'tool'; data: SearchableTool }
  | { type: 'article'; data: Article };

export function GlobalSearchAutocomplete({
  isOpen,
  onClose,
  variant = 'navbar-desktop',
  placeholder = 'Search articles, tax tools, circulars...',
  autoFocus = true
}: GlobalSearchAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
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
      // ignore
    }
    return [];
  });

  const saveRecentSearch = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches(prev => {
      const updated = [trimmed, ...prev.filter(item => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_RECENT_SEARCHES);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const removeRecentSearch = (termToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches(prev => {
      const updated = prev.filter(t => t !== termToRemove);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const clearAllRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // ignore
    }
  };

  // Focus management
  useEffect(() => {
    if (isOpen && autoFocus) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoFocus]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (variant === 'navbar-mobile') {
          // On mobile drawer, clicking outside search only unfocuses the search input
          setIsFocused(false);
        } else {
          onClose();
        }
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside, { passive: true });
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose, variant]);

  // Reset active index when query changes
  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  // Search filter and ranking algorithm
  const { matchedTools, matchedArticles, totalMatches } = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      // Default: featured tools and top recent articles
      const defaultTools = searchableTaxTools.filter(t => t.featured).slice(0, 4);
      const defaultArticles = mockArticles.slice(0, 4);
      return {
        matchedTools: defaultTools,
        matchedArticles: defaultArticles,
        totalMatches: defaultTools.length + defaultArticles.length
      };
    }

    const tokens = trimmed.split(/\s+/).filter(Boolean);

    // 1. Score and filter Tax Tools
    const scoredTools = searchableTaxTools
      .map(tool => {
        let score = 0;
        const nameLower = tool.name.toLowerCase();
        const shortLower = tool.shortName.toLowerCase();
        const descLower = tool.description.toLowerCase();
        const catLower = tool.category.toLowerCase();
        const tagMatchCount = tool.tags.filter(tag => tokens.some(t => tag.toLowerCase().includes(t))).length;

        // Exact match
        if (nameLower === trimmed || shortLower === trimmed) score += 200;
        else if (nameLower.startsWith(trimmed) || shortLower.startsWith(trimmed)) score += 120;
        else if (tokens.every(t => nameLower.includes(t))) score += 80;
        else if (tokens.some(t => nameLower.includes(t))) score += 40;

        // Tag matching
        score += tagMatchCount * 25;

        // Category match
        if (catLower.includes(trimmed)) score += 30;

        // Description match
        if (tokens.every(t => descLower.includes(t))) score += 20;
        else if (tokens.some(t => descLower.includes(t))) score += 10;

        return { tool, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.tool)
      .slice(0, 4);

    // 2. Score and filter Articles
    const scoredArticles = mockArticles
      .map(article => {
        let score = 0;
        const titleLower = article.title.toLowerCase();
        const excerptLower = (article.excerpt || '').toLowerCase();
        const categoryLower = (article.category || '').toLowerCase();
        const tagMatchCount = (article.tags || []).filter(tag => tokens.some(t => tag.toLowerCase().includes(t))).length;

        if (titleLower === trimmed) score += 200;
        else if (titleLower.startsWith(trimmed)) score += 110;
        else if (tokens.every(t => titleLower.includes(t))) score += 70;
        else if (tokens.some(t => titleLower.includes(t))) score += 35;

        score += tagMatchCount * 20;

        if (categoryLower.includes(trimmed)) score += 25;

        if (tokens.every(t => excerptLower.includes(t))) score += 15;
        else if (tokens.some(t => excerptLower.includes(t))) score += 8;

        return { article, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.article)
      .slice(0, 5);

    return {
      matchedTools: scoredTools,
      matchedArticles: scoredArticles,
      totalMatches: scoredTools.length + scoredArticles.length
    };
  }, [query]);

  // Flatten suggestions into a unified array for arrow key navigation
  const flatItems: AutocompleteItem[] = useMemo(() => {
    const list: AutocompleteItem[] = [];
    matchedTools.forEach(tool => list.push({ type: 'tool', data: tool }));
    matchedArticles.forEach(article => list.push({ type: 'article', data: article }));
    return list;
  }, [matchedTools, matchedArticles]);

  // Navigation handler
  const handleSelectTool = useCallback((tool: SearchableTool) => {
    saveRecentSearch(tool.name);
    onClose();
    if (tool.path.includes('#')) {
      const [route, hash] = tool.path.split('#');
      navigate(route);
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    } else {
      navigate(tool.path);
    }
  }, [navigate, onClose, saveRecentSearch]);

  const handleSelectArticle = useCallback((article: Article) => {
    saveRecentSearch(article.title);
    onClose();
    navigate(`/article/${article.id}`);
  }, [navigate, onClose, saveRecentSearch]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (activeIndex >= 0 && flatItems[activeIndex]) {
      const selected = flatItems[activeIndex];
      if (selected.type === 'tool') {
        handleSelectTool(selected.data);
      } else {
        handleSelectArticle(selected.data);
      }
      return;
    }

    const trimmed = query.trim();
    if (trimmed) {
      saveRecentSearch(trimmed);
      onClose();
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    } else {
      onClose();
      navigate('/search');
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < flatItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : flatItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Quick suggestion click
  const handleQuickTopicClick = (topic: string) => {
    setQuery(topic);
    inputRef.current?.focus();
  };

  // Render Tool Icon dynamically
  const renderToolIcon = (iconName: SearchableTool['iconName'], className: string) => {
    switch (iconName) {
      case 'Calculator': return <Calculator className={className} />;
      case 'Calendar': return <Calendar className={className} />;
      case 'FileText': return <FileText className={className} />;
      case 'BookOpen': return <BookOpen className={className} />;
      case 'Coins': return <Coins className={className} />;
      case 'Building2': return <Building2 className={className} />;
      case 'FolderDown': return <FolderDown className={className} />;
      case 'Scale': return <Scale className={className} />;
      case 'Receipt': return <Receipt className={className} />;
      case 'ShieldCheck': return <ShieldCheck className={className} />;
      default: return <Calculator className={className} />;
    }
  };

  // Helper to highlight matching substrings
  const renderHighlighted = (text: string, highlight: string) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-emerald-100/90 text-emerald-950 font-bold px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const showDropdown = isOpen && (isFocused || query.length > 0 || variant === 'navbar-desktop');

  return (
    <div 
      ref={containerRef} 
      className={cn(
        "relative",
        variant === 'navbar-desktop' && "w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl",
        variant === 'navbar-mobile' && "w-full",
        variant === 'standalone' && "w-full"
      )}
    >
      {/* Search Input Bar */}
      <form 
        onSubmit={handleSubmit}
        className={cn(
          "relative flex items-center transition-all duration-200",
          variant === 'navbar-desktop' && "bg-white/95 backdrop-blur-md rounded-2xl border-2 border-emerald-500 shadow-md pl-3 pr-2 py-1.5 ring-4 ring-emerald-500/10",
          variant === 'navbar-mobile' && "bg-slate-100/90 rounded-xl border border-slate-200 pl-3.5 pr-2 py-2.5 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20",
          variant === 'standalone' && "bg-slate-900/80 rounded-2xl border border-slate-700 p-2 shadow-xl focus-within:border-emerald-500 text-white"
        )}
      >
        <Search className={cn(
          "w-4 h-4 shrink-0 transition-colors mr-2.5",
          query ? "text-emerald-600" : "text-slate-400"
        )} />
        
        <input
          ref={inputRef}
          type="search"
          inputMode="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          aria-controls="global-search-autocomplete-list"
          className={cn(
            "bg-transparent border-none focus:outline-none w-full text-xs sm:text-sm font-medium",
            variant === 'standalone' ? "text-white placeholder:text-slate-400" : "text-slate-900 placeholder:text-slate-400"
          )}
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors mr-1 cursor-pointer"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {variant === 'navbar-desktop' && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <kbd className="hidden sm:inline-block text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              Esc
            </kbd>
          </button>
        )}
      </form>

      {/* Floating Autocomplete Dropdown */}
      {showDropdown && (
        <div 
          ref={dropdownRef}
          id="global-search-autocomplete-list"
          className={cn(
            "z-50 bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_20px_60px_rgba(15,23,42,0.18),0_4px_16px_rgba(15,23,42,0.06)] rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150",
            variant === 'navbar-desktop' && "absolute left-0 right-0 sm:right-auto sm:w-[540px] md:w-[600px] top-full mt-2.5",
            variant === 'navbar-mobile' && "mt-2 w-full",
            variant === 'standalone' && "absolute left-0 right-0 top-full mt-2 w-full"
          )}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-extrabold uppercase tracking-wider text-[11px] text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                {query ? 'Instant Suggestions' : 'Explore Platform Tools & Insights'}
              </span>
            </div>

            {query && (
              <span className="text-[11px] font-bold text-slate-400">
                {totalMatches} result{totalMatches === 1 ? '' : 's'}
              </span>
            )}
          </div>

          <div className="max-h-[62vh] overflow-y-auto divide-y divide-slate-100 overscroll-contain">
            
            {/* When No Query: Quick Access & Recent Searches */}
            {!query.trim() && (
              <div className="p-3.5 space-y-4">
                {/* Recent Searches (if available) */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2 px-1">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <History className="w-3 h-3 text-slate-400" />
                        Recent Searches
                      </span>
                      <button
                        onClick={clearAllRecent}
                        className="text-[10px] text-slate-400 hover:text-red-500 font-semibold transition-colors"
                      >
                        Clear All
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {recentSearches.map((term, i) => (
                        <div
                          key={i}
                          onClick={() => {
                            setQuery(term);
                            inputRef.current?.focus();
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-semibold cursor-pointer border border-slate-200/60 transition-colors group"
                        >
                          <Search className="w-3 h-3 text-slate-400 group-hover:text-emerald-600" />
                          <span>{term}</span>
                          <button
                            type="button"
                            onClick={(e) => removeRecentSearch(term, e)}
                            className="text-slate-400 hover:text-slate-700 p-0.5 rounded-full"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Keywords / Tags */}
                <div>
                  <div className="flex items-center gap-1 mb-2 px-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <Tag className="w-3 h-3" />
                    Popular Topics in Bangladesh
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['Tax Calculator 2026', 'Investment Rebate', 'TDS Rates Section 89', 'RJSC Incorporation', 'VAT on Software', 'Tax Refund Section 240'].map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => handleQuickTopicClick(topic)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200/60 transition-colors text-left cursor-pointer"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 1: TAX & COMPLIANCE TOOLS */}
            {matchedTools.length > 0 && (
              <div className="p-2 sm:p-3">
                <div className="flex items-center justify-between px-2 mb-2">
                  <span className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5" />
                    Tax &amp; Compliance Tools ({matchedTools.length})
                  </span>
                  <Link 
                    to="/tools" 
                    onClick={onClose}
                    className="text-[11px] font-bold text-slate-400 hover:text-emerald-700 transition-colors flex items-center gap-0.5"
                  >
                    <span>All Tools</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="space-y-1">
                  {matchedTools.map((tool, idx) => {
                    const isSelected = activeIndex === idx;
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => handleSelectTool(tool)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={cn(
                          "w-full text-left flex items-start gap-3 p-2.5 rounded-xl transition-all duration-150 group cursor-pointer",
                          isSelected 
                            ? "bg-emerald-50/90 border border-emerald-300/80 shadow-xs" 
                            : "hover:bg-slate-50 border border-transparent"
                        )}
                      >
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 shadow-2xs",
                          isSelected 
                            ? "bg-emerald-600 text-white scale-105" 
                            : "bg-emerald-100/70 text-emerald-800 group-hover:bg-emerald-600 group-hover:text-white"
                        )}>
                          {renderToolIcon(tool.iconName, "w-4 h-4")}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-xs sm:text-sm font-extrabold leading-tight",
                              isSelected ? "text-emerald-950" : "text-slate-900 group-hover:text-emerald-800"
                            )}>
                              {renderHighlighted(tool.name, query)}
                            </span>
                            {tool.badge && (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 shrink-0">
                                {tool.badge}
                              </span>
                            )}
                          </div>
                          
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 leading-snug">
                            {renderHighlighted(tool.description, query)}
                          </p>
                        </div>

                        <div className="shrink-0 text-slate-400 group-hover:text-emerald-600 self-center">
                          <ArrowRight className={cn(
                            "w-4 h-4 transition-transform duration-150",
                            isSelected && "translate-x-1 text-emerald-600"
                          )} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECTION 2: ARTICLES & STATUTORY GUIDES */}
            {matchedArticles.length > 0 && (
              <div className="p-2 sm:p-3">
                <div className="flex items-center justify-between px-2 mb-2">
                  <span className="text-[11px] font-extrabold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Articles &amp; Statutory Guides ({matchedArticles.length})
                  </span>
                  <button 
                    type="button"
                    onClick={() => handleSubmit()}
                    className="text-[11px] font-bold text-slate-400 hover:text-blue-700 transition-colors flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Full Search</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-1">
                  {matchedArticles.map((article, artIdx) => {
                    const itemGlobalIndex = matchedTools.length + artIdx;
                    const isSelected = activeIndex === itemGlobalIndex;
                    const readingTime = calculateReadingTime(article.content || article.excerpt);

                    return (
                      <button
                        key={article.id}
                        type="button"
                        onClick={() => handleSelectArticle(article)}
                        onMouseEnter={() => setActiveIndex(itemGlobalIndex)}
                        className={cn(
                          "w-full text-left flex items-start gap-3 p-2.5 rounded-xl transition-all duration-150 group cursor-pointer",
                          isSelected 
                            ? "bg-blue-50/80 border border-blue-300/80 shadow-xs" 
                            : "hover:bg-slate-50 border border-transparent"
                        )}
                      >
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 shadow-2xs",
                          isSelected 
                            ? "bg-blue-600 text-white scale-105" 
                            : "bg-blue-100/70 text-blue-800 group-hover:bg-blue-600 group-hover:text-white"
                        )}>
                          <FileText className="w-4 h-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-xs sm:text-sm font-bold leading-tight line-clamp-1",
                              isSelected ? "text-blue-950 font-extrabold" : "text-slate-900 group-hover:text-blue-900"
                            )}>
                              {renderHighlighted(article.title, query)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                            <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded text-[10px]">
                              {article.category}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5 text-slate-400">
                              <Clock className="w-2.5 h-2.5" />
                              {readingTime}m read
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 text-slate-400 group-hover:text-blue-600 self-center">
                          <ArrowRight className={cn(
                            "w-4 h-4 transition-transform duration-150",
                            isSelected && "translate-x-1 text-blue-600"
                          )} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* EMPTY STATE: NO MATCHES */}
            {query.trim() && totalMatches === 0 && (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    No direct matches for "{query}"
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Try searching with broader terms like "tax", "rebate", "vat", "tds", or "incorporation".
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap justify-center gap-1.5 max-w-md mx-auto">
                  {['Tax Calculator', 'TDS Rates', 'Corporate Tax', 'VAT Refund', 'RJSC Fees'].map(term => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => handleQuickTopicClick(term)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-semibold transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleSubmit()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    <span>Search all articles for "{query}"</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Footer Bar */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-3 text-[11px]">
              <span className="inline-flex items-center gap-1 text-slate-400">
                <kbd className="px-1 py-0.5 text-[9px] font-bold bg-white border border-slate-200 rounded">↑↓</kbd> navigate
              </span>
              <span className="inline-flex items-center gap-1 text-slate-400">
                <kbd className="px-1 py-0.5 text-[9px] font-bold bg-white border border-slate-200 rounded">↵</kbd> select
              </span>
              <span className="inline-flex items-center gap-1 text-slate-400">
                <kbd className="px-1 py-0.5 text-[9px] font-bold bg-white border border-slate-200 rounded">esc</kbd> close
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleSubmit()}
              className="text-emerald-700 hover:text-emerald-800 font-bold inline-flex items-center gap-1 hover:underline text-xs"
            >
              <span>{query ? `View full results for "${query}"` : 'Open Search Page'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
