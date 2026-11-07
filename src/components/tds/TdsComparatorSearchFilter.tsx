import React, { useRef, useEffect } from 'react';
import { Search, X, Filter, Sparkles, RotateCcw } from 'lucide-react';

export type SectionType = 'All' | 'Section 89 (Supply)' | 'Section 90 (Services)' | 'Section 119 (Non-Resident)';

interface TdsComparatorSearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeSection: SectionType;
  onSectionChange: (section: SectionType) => void;
  sections: SectionType[];
  totalCount: number;
  filteredCount: number;
  sectionCounts: Record<SectionType, number>;
  onReset: () => void;
}

export function TdsComparatorSearchFilter({
  searchQuery,
  onSearchChange,
  activeSection,
  onSectionChange,
  sections,
  totalCount,
  filteredCount,
  sectionCounts,
  onReset,
}: TdsComparatorSearchFilterProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Quick search preset tags for common tax inquiries
  const quickPresets = [
    { label: 'Sec 89 Supply', query: '89' },
    { label: 'Sec 90 Services', query: '90' },
    { label: 'Sec 119 Foreign', query: '119' },
    { label: 'Consultancy', query: 'consultancy' },
    { label: 'Civil Works', query: 'civil works' },
    { label: 'Royalties', query: 'royalty' },
    { label: '10% Slabs', query: '10%' },
  ];

  // Global '/' hotkey to quickly focus search inside comparator
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        const compSection = document.getElementById('tds-comparator-section');
        if (compSection && !compSection.classList.contains('hidden')) {
          e.preventDefault();
          inputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isFiltering = searchQuery.trim().length > 0 || activeSection !== 'All';

  return (
    <div id="tds-comparator-search-filter" className="space-y-4 mb-6">
      {/* Search Input Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4 text-emerald-600" />
          </div>
          
          <input
            ref={inputRef}
            id="tds-comparator-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Real-time search section (e.g. 89, 90, 119), service, category, or rate (5%, 10%)..."
            className="w-full pl-11 pr-24 py-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-3 focus:ring-emerald-500/20 transition-all font-medium shadow-2xs"
            aria-label="Real-time TDS Comparator Search Filter"
          />

          {/* Right Action Area in Input: Clear button and keyboard shortcut hint */}
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5">
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  inputRef.current?.focus();
                }}
                id="tds-comparator-clear-search-btn"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                title="Clear search query"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded-md shadow-2xs">
              /
            </kbd>
          </div>
        </div>

        {/* Reset All Filters Button (visible when actively filtering) */}
        {isFiltering && (
          <button
            type="button"
            onClick={onReset}
            id="tds-comparator-reset-filters-btn"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Filter</span>
          </button>
        )}
      </div>

      {/* Section Quick-Filter Badges with Real-Time Counters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-1">
          <Filter className="w-3 h-3 text-slate-400" />
          <span>Section:</span>
        </span>

        {sections.map((sec) => {
          const isSelected = activeSection === sec;
          const count = sectionCounts[sec] || 0;
          const label = sec === 'All' 
            ? 'All Sections' 
            : sec.replace(' (Supply)', '').replace(' (Services)', '').replace(' (Non-Resident)', '');

          return (
            <button
              key={sec}
              type="button"
              id={`tds-comparator-filter-${sec.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              onClick={() => onSectionChange(sec)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isSelected
                  ? 'bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-700/20'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/60'
              }`}
            >
              <span>{label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isSelected
                    ? 'bg-emerald-800 text-emerald-100'
                    : count > 0 
                      ? 'bg-white text-slate-700 border border-slate-200' 
                      : 'bg-slate-200 text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Quick Search Suggestions & Results Count Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-500" />
            <span>Try:</span>
          </span>
          {quickPresets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onSearchChange(preset.query)}
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md transition-colors ${
                searchQuery.toLowerCase() === preset.query.toLowerCase()
                  ? 'bg-emerald-100 text-emerald-800 font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Real-time Result Status */}
        <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
          <span>Showing</span>
          <strong className="text-slate-900 font-bold">{filteredCount}</strong>
          <span>of {totalCount} categories</span>
          {isFiltering && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
          )}
        </div>
      </div>
    </div>
  );
}
