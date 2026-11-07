import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  BookOpen, 
  Filter, 
  Bookmark, 
  Sparkles, 
  GitCompare, 
  Scale, 
  FileText, 
  ChevronRight, 
  Copy, 
  Check, 
  HelpCircle, 
  LayoutGrid, 
  List, 
  Printer, 
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { 
  glossaryTerms, 
  glossaryCategories, 
  GlossaryTerm 
} from '../data/glossaryData';
import { FeaturedTermCard } from '../components/glossary/FeaturedTermCard';
import { TermComparisonWidget } from '../components/glossary/TermComparisonWidget';
import { GlossaryQuiz } from '../components/glossary/GlossaryQuiz';
import { TermDetailModal } from '../components/glossary/TermDetailModal';
import { InteractiveKeyTermsEducator } from '../components/glossary/InteractiveKeyTermsEducator';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';

const BOOKMARKS_STORAGE_KEY = 'elawyers_glossary_bookmarks';

export function Glossary() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAlphabet, setSelectedAlphabet] = useState<string | null>(null);
  const [showOnlyBookmarked, setShowOnlyBookmarked] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedTermForModal, setSelectedTermForModal] = useState<GlossaryTerm | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load bookmarks from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      if (saved) {
        setBookmarkedIds(JSON.parse(saved));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const toggleBookmark = (id: string) => {
    setBookmarkedIds(prev => {
      const next = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
      try {
        localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore localStorage write error
      }
      return next;
    });
  };

  const copyTermCitation = (e: React.MouseEvent, term: GlossaryTerm) => {
    e.stopPropagation();
    const citation = `${term.term} (${term.bengaliTerm}) — ${term.actReference}: ${term.summary}`;
    navigator.clipboard.writeText(citation);
    setCopiedId(term.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Featured terms: TDS, VAT, and Sixth Schedule
  const featuredTerms = useMemo(() => {
    return glossaryTerms.filter(t => t.featured || ['tds', 'vat', 'sixth-schedule'].includes(t.id));
  }, []);

  // Filtered terms
  const filteredTerms = useMemo(() => {
    return glossaryTerms.filter(item => {
      const matchesSearch = 
        query.trim() === '' ||
        item.term.toLowerCase().includes(query.toLowerCase()) ||
        item.shortTerm.toLowerCase().includes(query.toLowerCase()) ||
        item.bengaliTerm.includes(query) ||
        item.summary.toLowerCase().includes(query.toLowerCase()) ||
        item.actReference.toLowerCase().includes(query.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));

      const matchesCategory = 
        selectedCategory === 'all' || item.category === selectedCategory;

      const matchesAlphabet = 
        !selectedAlphabet || 
        item.term.toUpperCase().startsWith(selectedAlphabet) || 
        item.shortTerm.toUpperCase().startsWith(selectedAlphabet);

      const matchesBookmark = 
        !showOnlyBookmarked || bookmarkedIds.includes(item.id);

      return matchesSearch && matchesCategory && matchesAlphabet && matchesBookmark;
    });
  }, [query, selectedCategory, selectedAlphabet, showOnlyBookmarked, bookmarkedIds]);

  // Unique letters for A-Z bar
  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    glossaryTerms.forEach(t => {
      const firstLetter = t.shortTerm[0]?.toUpperCase() || t.term[0]?.toUpperCase();
      if (firstLetter && /[A-Z]/.test(firstLetter)) {
        letters.add(firstLetter);
      }
    });
    return Array.from(letters).sort();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      <SEO
        title={
          selectedTermForModal
            ? `${selectedTermForModal.term} – Statutory Definition | Accounting & Tax Glossary`
            : 'Bangladesh Accounting, Income Tax, VAT & RJSC Legal Glossary | Accounticca'
        }
        description={
          selectedTermForModal
            ? selectedTermForModal.summary
            : 'Comprehensive statutory dictionary of Bangladesh Income Tax Act 2023, VAT & SD Act 2012, RJSC Companies Act 1994, and IFRS accounting terminology.'
        }
        canonicalUrl="/glossary"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Glossary & Terminology', url: '/glossary' }
        ]}
      />
      {/* Top Breadcrumb & Hero */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <Breadcrumbs items={[{ label: 'Glossary & Terminology' }]} />

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mt-4">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-3 border border-emerald-200">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>Statutory Legal & Tax Dictionary</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Accounting & Tax Glossary
              </h1>
              <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
                Authoritative definitions, governing sections, calculation examples, and compliance rules under Bangladesh’s 
                <strong className="text-slate-900 font-semibold"> Income Tax Act, 2023</strong> and 
                <strong className="text-slate-900 font-semibold"> VAT & SD Act, 2012</strong>.
              </p>
            </div>

            {/* Quick Action Badges */}
            <div className="flex items-center gap-2.5 flex-wrap shrink-0">
              <a
                href="#interactive-key-terms-hub"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Interactive Terms Hub</span>
              </a>

              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors shadow-xs"
                title="Print glossary reference sheet"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>Print Reference</span>
              </button>

              <button
                onClick={() => setShowOnlyBookmarked(prev => !prev)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                  showOnlyBookmarked
                    ? 'bg-amber-500 text-white font-extrabold shadow'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${showOnlyBookmarked ? 'fill-white' : 'text-amber-500'}`} />
                <span>Saved Terms ({bookmarkedIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* ========================================================= */}
        {/* SECTION 1: INTERACTIVE STATUTORY KEY TERMS EDUCATOR */}
        {/* ========================================================= */}
        <section aria-labelledby="interactive-key-terms-heading">
          <InteractiveKeyTermsEducator 
            onOpenModal={(term) => setSelectedTermForModal(term)}
          />
        </section>

        {/* ========================================================= */}
        {/* SECTION 2: STATUTORY SPOTLIGHT CARDS (TDS, VAT, SIXTH SCHEDULE) */}
        {/* ========================================================= */}
        <section className="mb-14" aria-labelledby="featured-terms-heading">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Detailed Provision Explorer
                </span>
              </div>
              <h2 id="featured-terms-heading" className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                Core Tax Pillars: TDS, VAT & Sixth Schedule
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md text-left sm:text-right">
              Examine statutory clauses, compliance checklists, and legal citations for each pillar.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {featuredTerms.map(term => (
              <FeaturedTermCard
                key={term.id}
                term={term}
                isBookmarked={bookmarkedIds.includes(term.id)}
                onToggleBookmark={toggleBookmark}
                onSelectTerm={(t) => setSelectedTermForModal(t)}
              />
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 2: INTERACTIVE SIDE-BY-SIDE CONCEPT COMPARISON */}
        {/* ========================================================= */}
        <section aria-labelledby="comparison-heading">
          <TermComparisonWidget />
        </section>

        {/* ========================================================= */}
        {/* SECTION 3: INTERACTIVE TAX KNOWLEDGE QUIZ */}
        {/* ========================================================= */}
        <section aria-labelledby="quiz-heading">
          <GlossaryQuiz />
        </section>

        {/* ========================================================= */}
        {/* SECTION 4: SEARCHABLE ALL TERMS DICTIONARY */}
        {/* ========================================================= */}
        <section id="all-terms" className="mt-12" aria-labelledby="all-terms-heading">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 id="all-terms-heading" className="text-2xl font-bold text-slate-900">
                Complete Statutory Terms Directory
              </h2>
              <p className="text-sm text-slate-600 mt-0.5">
                Showing {filteredTerms.length} of {glossaryTerms.length} defined statutory terms
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 self-start md:self-auto shadow-xs">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Cards view"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'table'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Table view"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>
          </div>

          {/* Search Input & Category Filters */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm mb-6 space-y-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by term (e.g. TDS, VAT, Sixth Schedule, PSR, e-TIN), section, or Bangla..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-sm sm:text-base placeholder:text-slate-400 transition-all"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700 bg-slate-200/70 hover:bg-slate-300 w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1 shrink-0">
                <Filter className="w-3.5 h-3.5" />
                Category:
              </span>
              {glossaryCategories.map((cat) => {
                const count = cat.id === 'all' 
                  ? glossaryTerms.length 
                  : glossaryTerms.filter(t => t.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setSelectedAlphabet(null);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {cat.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* A-Z Alphabetical Quick Jump Bar */}
            <div className="pt-2 border-t border-slate-100 flex items-center gap-1 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
              <span className="text-slate-400 uppercase tracking-wider text-[11px] mr-2 shrink-0">
                A–Z Jump:
              </span>
              <button
                onClick={() => setSelectedAlphabet(null)}
                className={`px-2 py-1 rounded-lg transition-colors shrink-0 ${
                  selectedAlphabet === null
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All
              </button>
              {availableLetters.map(letter => (
                <button
                  key={letter}
                  onClick={() => setSelectedAlphabet(selectedAlphabet === letter ? null : letter)}
                  className={`w-7 h-7 rounded-lg transition-colors flex items-center justify-center shrink-0 ${
                    selectedAlphabet === letter
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>

          {/* ACTIVE FILTER BADGES */}
          {(query || selectedCategory !== 'all' || selectedAlphabet || showOnlyBookmarked) && (
            <div className="flex items-center gap-2 mb-4 flex-wrap text-xs">
              <span className="text-slate-500 font-medium">Active filters:</span>
              {query && (
                <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
                  Query: "{query}"
                  <button onClick={() => setQuery('')} className="hover:text-emerald-950 font-bold ml-1">×</button>
                </span>
              )}
              {selectedCategory !== 'all' && (
                <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
                  Category: {glossaryCategories.find(c => c.id === selectedCategory)?.label}
                  <button onClick={() => setSelectedCategory('all')} className="hover:text-emerald-950 font-bold ml-1">×</button>
                </span>
              )}
              {selectedAlphabet && (
                <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
                  Letter: {selectedAlphabet}
                  <button onClick={() => setSelectedAlphabet(null)} className="hover:text-emerald-950 font-bold ml-1">×</button>
                </span>
              )}
              {showOnlyBookmarked && (
                <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
                  Saved Terms Only
                  <button onClick={() => setShowOnlyBookmarked(false)} className="hover:text-amber-950 font-bold ml-1">×</button>
                </span>
              )}
              <button
                onClick={() => {
                  setQuery('');
                  setSelectedCategory('all');
                  setSelectedAlphabet(null);
                  setShowOnlyBookmarked(false);
                }}
                className="text-slate-500 hover:text-slate-800 underline font-semibold ml-2"
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* ========================================================= */}
          {/* DISPLAY: CARDS VIEW */}
          {/* ========================================================= */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTerms.length > 0 ? (
                filteredTerms.map((item) => {
                  const isBookmarked = bookmarkedIds.includes(item.id);
                  const isCopied = copiedId === item.id;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedTermForModal(item)}
                      className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between cursor-pointer group hover:border-emerald-300"
                    >
                      <div>
                        {/* Top row */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {item.categoryLabel}
                            </span>
                            {item.featured && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                Core Concept
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleBookmark(item.id);
                              }}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isBookmarked 
                                  ? 'bg-amber-100 text-amber-700' 
                                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                              }`}
                              title={isBookmarked ? 'Remove bookmark' : 'Bookmark term'}
                            >
                              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-600' : ''}`} />
                            </button>
                            <button
                              onClick={(e) => copyTermCitation(e, item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                              title="Copy citation"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Term title */}
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {item.term}
                        </h3>
                        <p className="text-xs font-semibold text-slate-500 font-bengali mt-0.5 mb-2.5">
                          {item.bengaliTerm}
                        </p>

                        {/* Statutory reference */}
                        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 mb-3 truncate">
                          <Scale className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{item.actReference}</span>
                        </div>

                        {/* Definition excerpt */}
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                          {item.summary}
                        </p>
                      </div>

                      {/* Footer */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-mono text-[11px]">
                          {item.shortTerm}
                        </span>
                        <span className="text-emerald-700 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                          <span>Explore Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                    <Search className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 mb-1">
                    No glossary terms found
                  </h4>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto mb-4">
                    We couldn’t find any statutory terms matching your search or filters.
                  </p>
                  <button
                    onClick={() => {
                      setQuery('');
                      setSelectedCategory('all');
                      setSelectedAlphabet(null);
                      setShowOnlyBookmarked(false);
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear All Filters</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* DISPLAY: TABLE VIEW */}
          {/* ========================================================= */}
          {viewMode === 'table' && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                    <tr>
                      <th className="py-4 px-6">Term & Acronym</th>
                      <th className="py-4 px-6">Bengali Name</th>
                      <th className="py-4 px-6">Governing Legislation & Section</th>
                      <th className="py-4 px-6">Summary Definition</th>
                      <th className="py-4 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTerms.length > 0 ? (
                      filteredTerms.map((item) => (
                        <tr 
                          key={item.id} 
                          onClick={() => setSelectedTermForModal(item)}
                          className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                        >
                          <td className="py-4 px-6">
                            <div className="font-bold text-slate-900 group-hover:text-emerald-700">
                              {item.term}
                            </div>
                            <span className="text-xs font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              {item.shortTerm}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-bengali font-medium text-slate-700">
                            {item.bengaliTerm}
                          </td>
                          <td className="py-4 px-6 text-xs text-slate-700 font-medium">
                            <span className="inline-flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-200/60">
                              <Scale className="w-3 h-3 text-slate-400" />
                              {item.actReference}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-xs leading-relaxed max-w-md">
                            {item.summary}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleBookmark(item.id);
                              }}
                              className={`p-2 rounded-lg transition-colors ${
                                bookmarkedIds.includes(item.id)
                                  ? 'text-amber-600 hover:bg-amber-50'
                                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                              }`}
                              title="Bookmark"
                            >
                              <Bookmark className={`w-4 h-4 ${bookmarkedIds.includes(item.id) ? 'fill-amber-600' : ''}`} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-500">
                          No terms found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* EDUCATIONAL RESOURCE FOOTER CALLOUT */}
        {/* ========================================================= */}
        <section className="mt-16 p-8 bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl text-white shadow-lg">
          <div className="max-w-3xl">
            <h3 className="text-2xl font-bold mb-2">
              Need Specific Statutory Advisory or Clarifications?
            </h3>
            <p className="text-emerald-100 text-sm sm:text-base leading-relaxed mb-6 font-normal">
              Our legal and tax experts assist businesses, salaried professionals, and expatriates with return preparation, withholding audits, advance tax planning, and NBR dispute resolution.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                to="/contact"
                className="px-5 py-2.5 bg-white text-emerald-950 font-bold rounded-xl text-xs sm:text-sm shadow hover:bg-emerald-50 transition-colors"
              >
                Schedule Legal Consultation
              </Link>
              <Link
                to="/tax-calculator"
                className="px-5 py-2.5 bg-emerald-700/80 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm border border-emerald-500/40 transition-colors"
              >
                Launch General Tax Calculator
              </Link>
              <Link
                to="/vat-guide"
                className="px-5 py-2.5 bg-emerald-700/80 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm border border-emerald-500/40 transition-colors"
              >
                Read Bangladesh VAT Guide
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Detail Modal */}
      {selectedTermForModal && (
        <TermDetailModal
          term={selectedTermForModal}
          onClose={() => setSelectedTermForModal(null)}
          isBookmarked={bookmarkedIds.includes(selectedTermForModal.id)}
          onToggleBookmark={toggleBookmark}
          onSelectRelatedTerm={(termId) => {
            const found = glossaryTerms.find(t => t.id === termId);
            if (found) setSelectedTermForModal(found);
          }}
        />
      )}
    </div>
  );
}
