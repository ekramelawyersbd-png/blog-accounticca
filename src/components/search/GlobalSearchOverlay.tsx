import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  FileText,
  Wrench,
  GraduationCap,
  ArrowRight,
  Sparkles,
  History,
  Calculator,
  ShoppingBag,
  ExternalLink,
  Trash2,
  Tag,
  SlidersHorizontal,
  ChevronRight,
  BookOpen,
  Scale,
  ShieldCheck,
  Building2,
  FileSpreadsheet
} from 'lucide-react';
import { mockArticles } from '../../data/mockData';
import { searchableTaxTools, SearchableTool } from '../../data/searchableTools';
import { SHOP_PRODUCTS, ShopProduct, inferProductType } from '../../data/shopProducts';
import { cn } from '../../lib/utils';

const GLOBAL_RECENT_SEARCHES_KEY = 'elawyers_global_recent_searches_v3';
const MAX_RECENT = 6;

export type SearchResultType = 'article' | 'tool' | 'product' | 'course';

export interface SearchResultItem {
  type: SearchResultType;
  id: string;
  title: string;
  category: string;
  path: string;
  description: string;
  badge?: string;
  price?: number;
  originalPrice?: number;
  format?: string;
  tags?: string[];
  productType?: string;
}

const POPULAR_SUGGESTIONS = [
  { label: 'Income Tax Calculator 2026', query: 'income tax calculator', tab: 'tools' },
  { label: 'Employment Agreement', query: 'employment agreement', tab: 'products' },
  { label: 'RJSC Company Registration', query: 'rjsc registration', tab: 'all' },
  { label: 'Wealth Surcharge Calculator', query: 'wealth surcharge', tab: 'tools' },
  { label: 'Non-Disclosure Agreement (NDA)', query: 'nda', tab: 'products' },
  { label: 'VAT Exemption Guide', query: 'vat exemption', tab: 'articles' },
  { label: 'Trade License Dhaka (DNCC/DSCC)', query: 'trade license', tab: 'articles' },
  { label: 'Corporate Tax Rates 2026', query: 'corporate tax', tab: 'tools' }
];

export function GlobalSearchOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'articles' | 'tools' | 'products' | 'courses'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // OS detection for showing Cmd+K vs Ctrl+K
  const isMac = useMemo(() => {
    if (typeof window === 'undefined') return true;
    return /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  }, []);

  const shortcutLabel = isMac ? '⌘K' : 'Ctrl+K';

  // Recent searches storage in localStorage
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(GLOBAL_RECENT_SEARCHES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.slice(0, MAX_RECENT);
      }
    } catch {
      // ignore
    }
    return [];
  });

  const saveRecent = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const updated = [trimmed, ...prev.filter((t) => t.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_RECENT);
      try {
        localStorage.setItem(GLOBAL_RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const removeRecent = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((t) => t !== term);
      try {
        localStorage.setItem(GLOBAL_RECENT_SEARCHES_KEY, JSON.stringify(updated));
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
      localStorage.removeItem(GLOBAL_RECENT_SEARCHES_KEY);
    } catch {
      // ignore
    }
  };

  // Global Keyboard Listener for Cmd+K (Mac) / Ctrl+K (Windows/Linux)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Case-insensitive check for K with metaKey (Command on Mac) or ctrlKey (Control on Windows/Linux)
      const isCmdOrCtrlK = (e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K' || e.code === 'KeyK');

      if (isCmdOrCtrlK) {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen((prev) => !prev);
        return;
      }

      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    const handleCustomOpen = (e?: Event) => {
      const customEvent = e as CustomEvent<{ query?: string; tab?: 'all' | 'articles' | 'tools' | 'products' | 'courses' }>;
      if (customEvent?.detail?.query) {
        setQuery(customEvent.detail.query);
      }
      if (customEvent?.detail?.tab) {
        setActiveTab(customEvent.detail.tab);
      }
      setIsOpen(true);
    };

    // Use capture phase so the global shortcut intercepts even when an input or button currently has focus
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('open-global-search', handleCustomOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('open-global-search', handleCustomOpen);
    };
  }, [isOpen]);

  // Focus input and lock body scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = 'unset';
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  // Gather and index all searchable items across Articles, Tools, and Products
  const allResults = useMemo(() => {
    const results: SearchResultItem[] = [];

    // 1. Articles & Guides
    mockArticles.forEach((article) => {
      results.push({
        type: 'article',
        id: `article-${article.id}`,
        title: article.title,
        category: article.category || 'Tax & Legal Article',
        path: `/article/${article.id}`,
        description: article.excerpt || article.title,
        badge: article.tags?.[0] || 'Article',
        tags: article.tags || []
      });
    });

    // 2. Calculators & Legal Tools
    // Direct link to core Individual Tax Calculator
    results.push({
      type: 'tool',
      id: 'tool-individual-tax-calculator',
      title: 'Individual Income Tax Calculator 2026–2027',
      category: 'Tax Calculator',
      path: '/calculator',
      description: 'Calculate your personal income tax, gender exemptions, investment rebates (Section 78), and final payable tax for FY 2026-27.',
      badge: 'Most Popular',
      tags: ['tax calculator', 'income tax', 'ব্যক্তিগত আয়কর', 'salary tax', 'rebate', 'tax slabs']
    });

    searchableTaxTools.forEach((tool) => {
      // Avoid duplicate if already added
      if (tool.id === 'individual-income-tax-calculator') return;
      results.push({
        type: 'tool',
        id: `tool-${tool.id}`,
        title: tool.name,
        category: tool.category,
        path: tool.path || `/tools/${tool.id}`,
        description: tool.description,
        badge: tool.badge || 'Tool',
        tags: tool.tags || []
      });
    });

    // 3. Products & Templates (Shop Products: Legal Contracts, Compliance Toolkits, Manuals, & Academy Courses)
    SHOP_PRODUCTS.forEach((p) => {
      const pType = inferProductType(p);
      const isCourse = pType === 'Academy Courses' || p.category === 'Academy Courses';

      results.push({
        type: isCourse ? 'course' : 'product',
        id: `product-${p.id}`,
        title: p.title,
        category: p.category,
        path: p.coursePath || `/shop/${p.slug}`,
        description: p.shortDescription || p.fullDescription,
        badge: p.badge || (isCourse ? 'Certified Cohort' : pType),
        price: p.price,
        originalPrice: p.originalPrice,
        format: p.format,
        productType: pType,
        tags: [...(p.features || []), p.governingLaw || '', pType]
      });
    });

    return results;
  }, []);

  // Filtered & Ranked results based on search query and active tab
  const filteredResults = useMemo(() => {
    const trimmed = query.trim().toLowerCase();

    let list = allResults;

    // Filter by tab
    if (activeTab === 'articles') list = list.filter((item) => item.type === 'article');
    else if (activeTab === 'tools') list = list.filter((item) => item.type === 'tool');
    else if (activeTab === 'products') list = list.filter((item) => item.type === 'product');
    else if (activeTab === 'courses') list = list.filter((item) => item.type === 'course');

    if (!trimmed) {
      // If no query, return top 10 recommended items
      return list.slice(0, 10);
    }

    const tokens = trimmed.split(/\s+/).filter(Boolean);

    return list
      .map((item) => {
        let score = 0;
        const titleLower = item.title.toLowerCase();
        const descLower = item.description.toLowerCase();
        const catLower = item.category.toLowerCase();
        const tagsLower = (item.tags || []).join(' ').toLowerCase();

        // Exact match
        if (titleLower === trimmed) score += 400;
        else if (titleLower.startsWith(trimmed)) score += 250;
        else if (tokens.every((t) => titleLower.includes(t))) score += 150;
        else if (tokens.some((t) => titleLower.includes(t))) score += 70;

        // Tags and keywords match
        if (tokens.every((t) => tagsLower.includes(t))) score += 50;
        else if (tokens.some((t) => tagsLower.includes(t))) score += 25;

        // Description match
        if (tokens.every((t) => descLower.includes(t))) score += 35;
        else if (tokens.some((t) => descLower.includes(t))) score += 15;

        // Category match
        if (catLower.includes(trimmed)) score += 30;

        return { item, score };
      })
      .filter((res) => res.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((res) => res.item);
  }, [allResults, query, activeTab]);

  // Keep selected index in bound
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeTab]);

  // Scroll active item into view
  useEffect(() => {
    if (!resultsContainerRef.current) return;
    const activeEl = resultsContainerRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleSelectResult = (item: SearchResultItem) => {
    if (query.trim()) {
      saveRecent(query.trim());
    }
    setIsOpen(false);
    setQuery('');
    navigate(item.path);
  };

  // Keyboard navigation within the modal (ArrowUp, ArrowDown, Enter, Tab)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults.length > 0) {
        const chosen = filteredResults[selectedIndex] || filteredResults[0];
        if (chosen) handleSelectResult(chosen);
      }
    } else if (e.key === 'Tab') {
      // Optional: cycle through tabs
      e.preventDefault();
      const tabs: ('all' | 'articles' | 'tools' | 'products' | 'courses')[] = ['all', 'articles', 'tools', 'products', 'courses'];
      const currentIndex = tabs.indexOf(activeTab);
      const nextIndex = (currentIndex + 1) % tabs.length;
      setActiveTab(tabs[nextIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-3xl rounded-3xl bg-white border border-slate-200/90 shadow-[0_25px_80px_rgba(15,23,42,0.35)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Bar with Input */}
        <div className="relative flex items-center px-4 sm:px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center shrink-0 mr-3 shadow-2xs">
            <Search className="w-5 h-5" />
          </div>
          <input
            ref={inputRef}
            type="search"
            inputMode="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search articles, tax calculators, legal tools & shop products..."
            className="w-full bg-transparent border-none focus:outline-none text-sm sm:text-base font-semibold text-slate-900 placeholder:text-slate-400"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition-colors mr-2 cursor-pointer"
              title="Clear search input"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="hidden sm:inline-block px-2 py-1 rounded-md text-[10px] font-mono font-bold text-slate-500 bg-slate-200/80 border border-slate-300 shadow-2xs">
              {shortcutLabel}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-500 bg-slate-200/70 hover:bg-slate-300 transition-colors cursor-pointer"
              title="Close search modal"
            >
              Esc
            </button>
          </div>
        </div>

        {/* Tab Filter Row */}
        <div className="flex items-center gap-1 px-4 sm:px-5 py-2.5 bg-slate-100/70 border-b border-slate-200/70 overflow-x-auto scrollbar-none">
          {[
            { id: 'all', label: 'All Results', count: allResults.length },
            { id: 'articles', label: 'Articles & Guides', count: allResults.filter((i) => i.type === 'article').length },
            { id: 'tools', label: 'Tools & Calculators', count: allResults.filter((i) => i.type === 'tool').length },
            { id: 'products', label: 'Products & Templates', count: allResults.filter((i) => i.type === 'product').length },
            { id: 'courses', label: 'Academy Courses', count: allResults.filter((i) => i.type === 'course').length }
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 shrink-0",
                  isSelected
                    ? "bg-[#10243a] text-white shadow-xs"
                    : "bg-white hover:bg-slate-200/60 text-slate-700 border border-slate-200/80"
                )}
              >
                <span>{tab.label}</span>
                <span className={cn("text-[10px] px-1.5 py-0.2 rounded-full font-black", isSelected ? "bg-amber-400 text-slate-950" : "bg-slate-100 text-slate-500")}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Results Body */}
        <div ref={resultsContainerRef} className="overflow-y-auto p-3 sm:p-4 space-y-2 overscroll-contain flex-1">
          {/* Quick Suggestions & Recent Searches when query is empty */}
          {!query && (
            <div className="space-y-4 mb-3">
              {/* Recent Searches */}
              {recentSearches.length > 0 && activeTab === 'all' && (
                <div className="px-2 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-emerald-600" />
                      Recent Searches
                    </span>
                    <button
                      type="button"
                      onClick={clearAllRecent}
                      className="hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <Trash2 className="w-3 h-3" /> Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => setQuery(term)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-xs font-semibold transition-colors border border-slate-200/80 cursor-pointer group"
                      >
                        <span>{term}</span>
                        <span
                          onClick={(e) => removeRecent(term, e)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 rounded-full"
                          title="Remove item"
                        >
                          <X className="w-3 h-3" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Discovery Shortcuts */}
              {activeTab === 'all' && (
                <div className="px-2 pt-1">
                  <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Quick Topics &amp; Shortcuts
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_SUGGESTIONS.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => {
                          setQuery(item.query);
                          if (item.tab !== 'all') setActiveTab(item.tab as any);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-600 hover:text-emerald-900 text-xs font-medium border border-slate-200/80 transition-colors cursor-pointer"
                      >
                        <Tag className="w-3 h-3 text-emerald-600" />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Results List */}
          {filteredResults.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-inner">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">No matching results found for &quot;{query}&quot;</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Try searching for &quot;income tax&quot;, &quot;employment contract&quot;, &quot;nda&quot;, &quot;vat guide&quot;, &quot;rjsc&quot;, or &quot;wealth surcharge&quot;.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredResults.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={item.id}
                    data-index={index}
                    onClick={() => handleSelectResult(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "flex items-center justify-between p-3.5 rounded-2xl transition-all cursor-pointer border group",
                      isSelected
                        ? "bg-emerald-50/90 border-emerald-300 shadow-sm ring-2 ring-emerald-500/20"
                        : "bg-white hover:bg-slate-50/90 border-slate-100"
                    )}
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      {/* Icon */}
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs mt-0.5",
                          item.type === 'article' && "bg-blue-50 text-blue-700 border-blue-200/90",
                          item.type === 'tool' && "bg-amber-50 text-amber-700 border-amber-200/90",
                          item.type === 'product' && "bg-purple-50 text-purple-700 border-purple-200/90",
                          item.type === 'course' && "bg-emerald-50 text-emerald-700 border-emerald-200/90"
                        )}
                      >
                        {item.type === 'article' && <FileText className="w-5 h-5" />}
                        {item.type === 'tool' && <Calculator className="w-5 h-5" />}
                        {item.type === 'product' && <ShoppingBag className="w-5 h-5" />}
                        {item.type === 'course' && <GraduationCap className="w-5 h-5" />}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded",
                              item.type === 'article' && "bg-blue-100 text-blue-800",
                              item.type === 'tool' && "bg-amber-100 text-amber-800",
                              item.type === 'product' && "bg-purple-100 text-purple-800",
                              item.type === 'course' && "bg-emerald-100 text-emerald-900"
                            )}
                          >
                            {item.type === 'article'
                              ? 'Article'
                              : item.type === 'tool'
                              ? 'Tool / Calc'
                              : item.type === 'product'
                              ? item.productType || 'Product'
                              : 'Academy Course'}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 truncate max-w-[200px]">
                            {item.category}
                          </span>
                          {item.badge && (
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200/70">
                              {item.badge}
                            </span>
                          )}
                          {item.format && (
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-1.5 py-0.2 rounded">
                              {item.format}
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                          {item.title}
                        </h4>

                        <p className="text-xs text-slate-500 line-clamp-1 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Price and Nav Indicator */}
                    <div className="flex items-center gap-3 shrink-0 pl-3">
                      {item.price !== undefined && (
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-slate-900 block">
                            BDT {item.price.toLocaleString()}
                          </span>
                          {item.originalPrice && item.originalPrice > item.price && (
                            <span className="text-[10px] font-mono text-slate-400 line-through block">
                              BDT {item.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}
                      <ArrowRight className={cn("w-4 h-4 transition-transform", isSelected ? "text-emerald-600 translate-x-1" : "text-slate-300")} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Navigation Bar with Shortcut Hints */}
        <div className="flex flex-wrap items-center justify-between px-4 sm:px-5 py-3 bg-slate-50 border-t border-slate-200/80 text-[11px] text-slate-500 font-medium gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-[10px] shadow-2xs">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-[10px] shadow-2xs">↓</kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-[10px] shadow-2xs">Enter</kbd>
              <span>Open</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-[10px] shadow-2xs">Tab</kbd>
              <span>Filter</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-[10px] shadow-2xs">Esc</kbd>
              <span>Close</span>
            </span>
          </div>

          <div className="font-bold text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Accounticca &amp; E-Lawyers Global Quick Search</span>
          </div>
        </div>
      </div>
    </div>
  );
}
