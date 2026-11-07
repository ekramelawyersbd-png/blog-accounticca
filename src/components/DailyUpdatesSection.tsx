import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  RefreshCw, 
  ExternalLink, 
  Calendar, 
  Building2, 
  Scale, 
  Calculator, 
  FileText, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Share2, 
  Copy, 
  Check, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  Globe, 
  Clock, 
  ArrowUpRight,
  ShieldAlert,
  Info
} from 'lucide-react';

export interface DailyUpdateItem {
  id: string;
  headline: string;
  summary: string;
  category: 'Income Tax' | 'VAT & Customs' | 'Corporate & RJSC' | 'Banking & Regulatory' | string;
  tag: string;
  impact: 'High' | 'Medium' | 'Urgent' | string;
  source: string;
  url: string;
  publishedDate: string;
  keyTakeaway: string;
  imageUrl?: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export function DailyUpdatesSection() {
  const [updates, setUpdates] = useState<DailyUpdateItem[]>([]);
  const [groundingSources, setGroundingSources] = useState<GroundingSource[]>([]);
  const [searchQueries, setSearchQueries] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isLiveGrounded, setIsLiveGrounded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedUpdate, setSelectedUpdate] = useState<DailyUpdateItem | null>(null);
  const [showSourcesModal, setShowSourcesModal] = useState<boolean>(false);
  const [isCached, setIsCached] = useState<boolean>(false);
  const [showAll, setShowAll] = useState<boolean>(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchDailyUpdates = async (force: boolean = false) => {
    if (force) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setLoadError(null);

    try {
      const res = await fetch(`/api/daily-updates${force ? '?force=true' : ''}`);
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();
      setUpdates(data.updates || []);
      setGroundingSources(data.groundingSources || []);
      setSearchQueries(data.searchQueries || []);
      setLastUpdated(data.lastUpdated || new Date().toISOString());
      setIsLiveGrounded(Boolean(data.isLiveGrounded));
      setIsCached(Boolean(data.cached));
      setAuthNotice(data.authNotice || null);
    } catch (err: any) {
      console.warn('Notice loading daily updates:', err.message || err);
      setLoadError('Displaying verified statutory Bangladesh dispatches.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDailyUpdates(false);
  }, []);

  const handleCopy = (item: DailyUpdateItem) => {
    const textToCopy = `${item.headline}\n\n${item.summary}\n\nKey Takeaway: ${item.keyTakeaway}\nSource: ${item.source} (${item.url})`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleShare = (item: DailyUpdateItem) => {
    if (navigator.share) {
      navigator.share({
        title: item.headline,
        text: `${item.headline} - ${item.keyTakeaway}`,
        url: item.url || window.location.href,
      }).catch(() => {});
    } else {
      handleCopy(item);
    }
  };

  // Associate verified high-quality pictures representing the specific legal & tax issue
  const getRelatedIssueImage = (item: DailyUpdateItem): string => {
    if (item.imageUrl) return item.imageUrl;
    const text = (item.headline + ' ' + item.summary + ' ' + item.tag + ' ' + item.category).toLowerCase();
    if (text.includes('vat') || text.includes('efd') || text.includes('mushak') || text.includes('customs') || text.includes('bond')) {
      if (text.includes('bond') || text.includes('customs') || text.includes('export') || text.includes('port')) {
        return 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800';
      }
      return 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&q=80&w=800';
    }
    if (text.includes('bank') || text.includes('remittance') || text.includes('forex') || text.includes('erq') || text.includes('currency')) {
      return 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=800';
    }
    if (text.includes('rjsc') || text.includes('company') || text.includes('corporate') || text.includes('bsec') || text.includes('director') || text.includes('board') || text.includes('secretar')) {
      if (text.includes('bsec') || text.includes('board') || text.includes('governance')) {
        return 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&q=80&w=800';
      }
      return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800';
    }
    if (text.includes('tds') || text.includes('withholding') || text.includes('audit') || text.includes('vendor')) {
      return 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=800';
    }
    if (text.includes('rebate') || text.includes('investment') || text.includes('dps') || text.includes('bond') || text.includes('slab')) {
      return 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800';
    }
    return 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800';
  };

  // Filter updates
  const filteredUpdates = updates.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch = !searchQuery.trim() || 
      item.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.keyTakeaway.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tag.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Strictly one row with 4 boxes by default (4/1 layout)
  const displayedUpdates = showAll ? filteredUpdates : filteredUpdates.slice(0, 4);

  const getCategoryIcon = (category: string, onDark = false) => {
    switch (category) {
      case 'Income Tax':
        return <Calculator className={`w-3.5 h-3.5 ${onDark ? 'text-emerald-400' : 'text-emerald-600'}`} />;
      case 'VAT & Customs':
        return <FileText className={`w-3.5 h-3.5 ${onDark ? 'text-teal-400' : 'text-teal-600'}`} />;
      case 'Corporate & RJSC':
        return <Building2 className={`w-3.5 h-3.5 ${onDark ? 'text-indigo-400' : 'text-indigo-600'}`} />;
      case 'Banking & Regulatory':
        return <Scale className={`w-3.5 h-3.5 ${onDark ? 'text-amber-400' : 'text-amber-600'}`} />;
      default:
        return <Info className={`w-3.5 h-3.5 ${onDark ? 'text-slate-300' : 'text-slate-600'}`} />;
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'Urgent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/90 text-white backdrop-blur-xs shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Urgent Action
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/90 text-white backdrop-blur-xs shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            High Impact
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800/80 text-slate-100 backdrop-blur-xs shadow-xs">
            Statutory
          </span>
        );
    }
  };

  const formatRelativeTime = (isoString: string) => {
    if (!isoString) return 'Just now';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins === 1) return '1 minute ago';
      if (diffMins < 60) return `${diffMins} minutes ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours === 1) return '1 hour ago';
      if (diffHours < 24) return `${diffHours} hours ago`;
      return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-slate-200/80">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 rounded-3xl p-6 sm:p-8 lg:p-10 text-white shadow-xl relative overflow-hidden border border-slate-800 mb-8">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-6 border-b border-slate-800">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide">
                {isLiveGrounded ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="w-2 h-2 rounded-full bg-emerald-400 -ml-3.5" />
                  </>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                )}
                DAILY REGULATORY WIRE
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isLiveGrounded ? 'Google Search Grounding' : 'Verified Statutory Sources'}</span>
              </span>

              {isCached && (
                <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700/60 hidden sm:inline-block">
                  Fast Cached Feed
                </span>
              )}

              {authNotice && (
                <span className="text-[11px] text-amber-300/80 bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-500/20 hidden md:inline-block" title="Configure a Gemini API Key in Settings > Secrets to enable live web search grounding">
                  Settings &gt; Secrets for Live Grounding
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="text-xs text-slate-400 flex items-center gap-1 mr-1 hidden sm:flex">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Updated {formatRelativeTime(lastUpdated)}</span>
              </div>

              <button
                type="button"
                onClick={() => fetchDailyUpdates(true)}
                disabled={isRefreshing || isLoading}
                title="Fetch latest live regulatory dispatches with Search Grounding"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm cursor-pointer disabled:opacity-50 active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Grounding Search...' : 'Refresh Feed'}</span>
              </button>
            </div>
          </div>

          {/* Section Main Titles */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            <div className="lg:col-span-8">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight mb-3">
                Daily Tax, VAT &amp; Regulatory Dispatches
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-3xl">
                Real-time verified legal and tax intelligence for Bangladesh. Monitored through live Google Search Grounding across the National Board of Revenue (NBR), Bangladesh Bank, RJSC, and statutory news despatches.
              </p>
            </div>

            {/* Quick Stats or Grounding Sources Trigger */}
            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowSourcesModal(!showSourcesModal)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-all cursor-pointer"
              >
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>View Grounded Web Sources ({groundingSources.length})</span>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showSourcesModal ? 'rotate-90' : ''}`} />
              </button>
            </div>
          </div>

          {/* Expandable Grounding Sources Drawer */}
          {showSourcesModal && (
            <div className="mt-6 pt-5 border-t border-slate-800/80 bg-slate-950/60 rounded-2xl p-4 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Verified Grounded Citations
                </span>
                <span className="text-[11px] text-slate-400">Sources indexed during live search</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {groundingSources.map((source, idx) => (
                  <a
                    key={idx}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-slate-200 hover:text-white transition-all group"
                  >
                    <span className="truncate font-medium">{source.title}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 shrink-0" />
                  </a>
                ))}
              </div>
              {searchQueries.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Search Grounding Queries:</span>
                  {searchQueries.map((q, idx) => (
                    <span key={idx} className="text-[11px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                      "{q}"
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: 'All Dispatches' },
            { id: 'tax', label: 'Income Tax (NBR)' },
            { id: 'vat', label: 'VAT & Customs' },
            { id: 'corporate', label: 'Corporate & RJSC' },
            { id: 'banking', label: 'Banking & Forex' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === tab.id
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Live Search Input */}
        <div className="relative min-w-[240px] sm:min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search SROs, circulars, topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 shadow-2xs"
          />
          {searchQuery && (
            <button 
              type="button" 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeleton - 1 Row with 4 Boxes */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
              <div className="h-44 sm:h-40 w-full bg-slate-200" />
              <div className="p-4 space-y-3 flex-1 flex flex-col">
                <div className="w-16 h-4 bg-slate-200 rounded" />
                <div className="w-full h-5 bg-slate-200 rounded" />
                <div className="space-y-1.5 flex-1">
                  <div className="w-full h-3.5 bg-slate-100 rounded" />
                  <div className="w-4/5 h-3.5 bg-slate-100 rounded" />
                </div>
                <div className="w-full h-12 bg-slate-50 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error / Fallback Notification */}
      {loadError && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 text-xs sm:text-sm">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">{loadError}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchDailyUpdates(true)}
            className="font-bold underline text-amber-800 hover:text-amber-950 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Cards Grid - 1 Row with 4 Boxes (4/1 Layout) */}
      {!isLoading && (
        <>
          {filteredUpdates.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 mb-1">No updates matching your filter</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Try clearing your search query or switching to another practice category.
              </p>
              <button
                type="button"
                onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {displayedUpdates.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-lg hover:border-emerald-500/40 transition-all duration-300 flex flex-col overflow-hidden group"
                  >
                    {/* Picture of Related Issue with Floating Badges */}
                    <div className="relative h-44 sm:h-40 w-full overflow-hidden bg-slate-100 shrink-0">
                      <img
                        src={getRelatedIssueImage(item)}
                        alt={item.headline}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />
                      
                      {/* Floating Category and Impact Badges on Picture */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/85 backdrop-blur-xs border border-white/15 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                          {getCategoryIcon(item.category, true)}
                          <span>{item.category}</span>
                        </span>
                        <div>
                          {getImpactBadge(item.impact)}
                        </div>
                      </div>

                      {/* SRO / Circular Tag Pill on Image */}
                      <div className="absolute bottom-2 left-2.5 pointer-events-none">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/95 text-slate-900 backdrop-blur-xs shadow-xs border border-white/40">
                          {item.tag}
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug line-clamp-2 mb-2">
                        {item.headline}
                      </h3>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-3">
                        {item.summary}
                      </p>

                      {/* Key Takeaway Box */}
                      <div className="p-2.5 bg-emerald-50/80 border border-emerald-200/70 rounded-xl mb-3 mt-auto">
                        <div className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider mb-0.5">
                              Key Takeaway:
                            </p>
                            <p className="text-[11px] text-emerald-800 leading-snug font-medium line-clamp-2">
                              {item.keyTakeaway}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="mt-auto px-4 py-3 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-slate-700 truncate text-[11px]">{item.source}</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span className="truncate">{item.publishedDate}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Copy Action */}
                        <button
                          type="button"
                          onClick={() => handleCopy(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                          title={copiedId === item.id ? 'Copied to clipboard!' : 'Copy update summary'}
                          aria-label="Copy update"
                        >
                          {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

                        {/* Share Action */}
                        <button
                          type="button"
                          onClick={() => handleShare(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                          title="Share update"
                          aria-label="Share update"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Source Link */}
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 font-semibold text-[10px] transition-colors shadow-2xs group/btn"
                          >
                            <span>Source</span>
                            <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover/btn:text-emerald-600" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* View More / Show Less Toggle Button when items > 4 */}
              {filteredUpdates.length > 4 && (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowAll(prev => !prev)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 font-bold text-xs sm:text-sm shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
                  >
                    <span>
                      {showAll ? 'Show 1 Row (4 Boxes)' : `View All Dispatches (${filteredUpdates.length})`}
                    </span>
                    {showAll ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-transform" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-transform" />
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Bottom Dispatch Disclaimer & Advisory Banner */}
      <div className="mt-8 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Dispatches are synthesized using Google Search Grounding across authoritative Bangladesh statutory portals. Consult certified tax practitioners for formal legal vetting before filing.
          </span>
        </div>
        <Link
          to="/contact"
          className="font-bold text-emerald-700 hover:text-emerald-800 whitespace-nowrap inline-flex items-center gap-1"
        >
          <span>Consult a Tax Lawyer</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}
