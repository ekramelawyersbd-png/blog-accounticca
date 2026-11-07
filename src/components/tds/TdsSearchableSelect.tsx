import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, Scale } from 'lucide-react';
import { HighlightText } from './HighlightText';

export interface TdsSelectItem {
  id: string;
  category: string;
  subCategory: string;
  section: string;
  rate: string;
}

interface TdsSearchableSelectProps {
  id: string;
  label: string;
  slotName: string;
  items: TdsSelectItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  sections: string[];
}

export function TdsSearchableSelect({
  id,
  label,
  slotName,
  items,
  selectedId,
  onSelect,
  sections,
}: TdsSearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedItem = useMemo(() => {
    return items.find(item => item.id === selectedId);
  }, [items, selectedId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  // Filter items in real time based on search term
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(item => {
      const tokens = term.split(/\s+/).filter(Boolean);
      return tokens.every(tok => 
        item.section.toLowerCase().includes(tok) ||
        item.category.toLowerCase().includes(tok) ||
        item.subCategory.toLowerCase().includes(tok) ||
        item.rate.toLowerCase().includes(tok) ||
        item.id.toLowerCase().includes(tok)
      );
    });
  }, [items, searchTerm]);

  // Group filtered items by section
  const groupedItems = useMemo(() => {
    const validSections = sections.filter(s => s !== 'All');
    const groups: { section: string; items: TdsSelectItem[] }[] = [];

    validSections.forEach(sec => {
      const secItems = filteredItems.filter(item => item.section === sec);
      if (secItems.length > 0) {
        groups.push({ section: sec, items: secItems });
      }
    });

    return groups;
  }, [filteredItems, sections]);

  return (
    <div className="relative" ref={containerRef} id={`container-${id}`}>
      <label htmlFor={id} className="flex items-center justify-between text-sm font-semibold text-slate-700 mb-2">
        <span>{label}</span>
        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
          {slotName}
        </span>
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="w-full text-left pl-4 pr-10 py-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-slate-900 flex items-center justify-between shadow-2xs"
      >
        <div className="truncate pr-2">
          {selectedItem ? (
            <div className="flex items-center gap-2">
              <span className="inline-block shrink-0 px-2 py-0.5 text-[10px] font-black bg-emerald-100 text-emerald-800 rounded">
                {selectedItem.section.split(' ')[1] || selectedItem.section}
              </span>
              <span className="font-bold text-slate-900 truncate">
                {selectedItem.category}
              </span>
              <span className="text-xs text-slate-400 font-normal shrink-0">
                ({selectedItem.rate})
              </span>
            </div>
          ) : (
            <span className="text-slate-400">Select a TDS Category...</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Searchable Dropdown Overlay */}
      {isOpen && (
        <div 
          className="absolute z-40 left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
          style={{ maxHeight: '420px' }}
        >
          {/* Real-time search inside dropdown */}
          <div className="p-3 border-b border-slate-100 bg-slate-50/80 sticky top-0 z-10">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type to filter section (89, 90, 119), service, or rate..."
                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                id={`search-input-${id}`}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
              <span>{filteredItems.length} matching categories</span>
              <span className="text-[10px] text-slate-400">Esc to close</span>
            </div>
          </div>

          {/* List of categories grouped by section */}
          <div className="overflow-y-auto max-h-[320px] p-2 space-y-3" role="listbox">
            {groupedItems.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                <p className="font-semibold text-slate-700">No categories found matching "{searchTerm}"</p>
                <p className="text-[11px] text-slate-400 mt-1">Try searching with a section number like 89, 90, or 119.</p>
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="mt-3 px-3 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg text-[11px] hover:bg-slate-200"
                >
                  Clear search
                </button>
              </div>
            ) : (
              groupedItems.map(group => (
                <div key={group.section} className="space-y-1">
                  <div className="sticky top-0 bg-white/95 backdrop-blur-xs py-1 px-2 text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-100">
                    <Scale className="w-3 h-3 text-emerald-600" />
                    <span>{group.section}</span>
                    <span className="ml-auto font-mono text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                      {group.items.length} items
                    </span>
                  </div>

                  {group.items.map(item => {
                    const isSelected = item.id === selectedId;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        id={`option-${id}-${item.id}`}
                        onClick={() => {
                          onSelect(item.id);
                          setIsOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-950 font-semibold border border-emerald-200'
                            : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              <HighlightText text={item.section} query={searchTerm} />
                            </span>
                            <span className="font-extrabold text-slate-900 truncate">
                              <HighlightText text={item.category} query={searchTerm} />
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            <HighlightText text={item.subCategory} query={searchTerm} />
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-center">
                          <span className="font-mono text-xs font-black text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                            <HighlightText text={item.rate} query={searchTerm} />
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
