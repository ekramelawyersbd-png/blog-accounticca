import React, { useState } from 'react';
import { 
  Scale, 
  X, 
  ArrowRightLeft, 
  Trash2, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Eye, 
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getLegalDetailsForSection } from '../../data/tdsLegalDetails';

export interface PinnedTdsItem {
  id: string;
  category: string;
  subCategory: string;
  section: string;
  rate: string;
  notes?: string;
}

interface TdsComparisonTrayProps {
  pinnedItems: PinnedTdsItem[];
  onUnpin: (id: string) => void;
  onClearAll: () => void;
  onLoadIntoSlots: (id1: string, id2: string) => void;
  onExpandDetails: (item: PinnedTdsItem) => void;
}

export function TdsComparisonTray({
  pinnedItems,
  onUnpin,
  onClearAll,
  onLoadIntoSlots,
  onExpandDetails,
}: TdsComparisonTrayProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMatrixModal, setShowMatrixModal] = useState(false);

  if (pinnedItems.length === 0) {
    return null;
  }

  const handleCompareInSlots = () => {
    if (pinnedItems.length >= 2) {
      onLoadIntoSlots(pinnedItems[0].id, pinnedItems[1].id);
    } else if (pinnedItems.length === 1) {
      onLoadIntoSlots(pinnedItems[0].id, pinnedItems[0].id);
    }
  };

  return (
    <>
      {/* Sticky Comparison Tray at Bottom of Screen */}
      <motion.aside
        id="tds-comparison-tray"
        aria-label="TDS Category Comparison Tray"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 260 }}
        className="fixed bottom-0 left-0 right-0 z-40 px-3 sm:px-6 pb-3 pointer-events-none"
      >
        <div className="max-w-7xl mx-auto pointer-events-auto">
          {/* Collapsed Pill View */}
          {isCollapsed ? (
            <div className="flex justify-end">
              <button
                onClick={() => setIsCollapsed(false)}
                id="expand-comparison-tray-btn"
                className="inline-flex items-center gap-2.5 px-5 py-3 bg-slate-900/95 hover:bg-slate-900 text-white rounded-full shadow-2xl border border-slate-700/80 backdrop-blur-md text-xs sm:text-sm font-bold transition-all hover:scale-105"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <Scale className="w-4 h-4 text-emerald-400" />
                <span>Comparison Tray</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs border border-emerald-500/30">
                  {pinnedItems.length} Pinned
                </span>
                <ChevronUp className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          ) : (
            /* Full Tray Card View */
            <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl sm:rounded-3xl border border-slate-700/90 shadow-2xl p-4 sm:p-5 flex flex-col gap-3.5">
              {/* Tray Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                    <Scale className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-extrabold text-white">
                        Comparison Tray
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {pinnedItems.length} {pinnedItems.length === 1 ? 'Category' : 'Categories'} Pinned
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 hidden sm:block">
                      {pinnedItems.length < 2 
                        ? 'Toggle "Quick-Compare" on another category to contrast both side-by-side' 
                        : 'Categories ready for side-by-side rate, threshold & legal analysis'}
                    </p>
                  </div>
                </div>

                {/* Right Header Controls */}
                <div className="flex items-center gap-2 flex-wrap">
                  {pinnedItems.length >= 2 && (
                    <>
                      <button
                        onClick={handleCompareInSlots}
                        id="tray-compare-in-slots-btn"
                        className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-xs hover:shadow-emerald-600/30"
                        title="Load first 2 pinned categories directly into comparator slots"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>Compare in Slots</span>
                      </button>

                      <button
                        onClick={() => setShowMatrixModal(true)}
                        id="tray-view-matrix-btn"
                        className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-xl text-xs border border-slate-700 transition-colors"
                        title="View comparative side-by-side table of all pinned items"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Full Matrix</span>
                      </button>
                    </>
                  )}

                  {pinnedItems.length === 1 && (
                    <button
                      onClick={handleCompareInSlots}
                      id="tray-load-slot1-btn"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors"
                      title="Load this category into Slot 1 of comparator"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Load into Slot 1</span>
                    </button>
                  )}

                  <button
                    onClick={onClearAll}
                    id="tray-clear-all-btn"
                    className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 font-bold rounded-xl text-xs transition-colors"
                    title="Unpin all items and clear the tray"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Clear Tray</span>
                  </button>

                  <button
                    onClick={() => setIsCollapsed(true)}
                    id="tray-collapse-btn"
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    title="Minimize tray"
                    aria-label="Minimize comparison tray"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Pinned Category Cards Scroll Row */}
              <div 
                id="tray-pinned-items-list"
                className="flex items-stretch gap-3 overflow-x-auto pb-1 pt-0.5 scrollbar-thin scrollbar-thumb-slate-700"
              >
                {pinnedItems.map((item, index) => (
                  <div
                    key={item.id}
                    id={`tray-item-${item.id}`}
                    className="flex-shrink-0 w-64 sm:w-72 bg-slate-800/90 hover:bg-slate-800 p-3 rounded-xl sm:rounded-2xl border border-slate-700/90 hover:border-emerald-500/60 transition-all flex flex-col justify-between group relative"
                  >
                    <div>
                      {/* Section & Rate Row */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-bold text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-700">
                          {item.section.replace(' (Supply)', '').replace(' (Services)', '').replace(' (Non-Resident)', '')}
                        </span>
                        <span className="font-mono text-xs font-black text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-700/50">
                          {item.rate}
                        </span>
                      </div>

                      {/* Title & Subcategory */}
                      <h5 className="font-bold text-xs sm:text-sm text-white line-clamp-1 group-hover:text-emerald-300 transition-colors">
                        {item.category}
                      </h5>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {item.subCategory}
                      </p>
                    </div>

                    {/* Action buttons inside card */}
                    <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between gap-1">
                      <button
                        onClick={() => onExpandDetails(item)}
                        id={`tray-expand-details-${item.id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                        title="Open legal source text drawer"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Legal Text</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onUnpin(item.id)}
                          id={`tray-unpin-${item.id}`}
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                          title="Remove from comparison tray"
                          aria-label={`Unpin ${item.category}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* If only 1 item pinned, show a placeholder card prompting to pin another */}
                {pinnedItems.length === 1 && (
                  <div className="flex-shrink-0 w-64 sm:w-72 border-2 border-dashed border-slate-700/70 rounded-xl sm:rounded-2xl p-4 flex flex-col items-center justify-center text-center text-slate-400">
                    <Sparkles className="w-5 h-5 text-emerald-400/70 mb-1.5" />
                    <p className="text-xs font-bold text-slate-300">
                      Pin 1 More Category
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Toggle 'Quick-Compare' on another item to unlock side-by-side analysis
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Multi-Item Comparative Matrix Modal */}
      <AnimatePresence>
        {showMatrixModal && (
          <div 
            id="tds-quick-compare-matrix-modal" 
            className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-5xl w-full p-6 sm:p-8 relative max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                      <Scale className="w-4 h-4" />
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900">
                      Side-by-Side Quick Comparison Matrix
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    Direct contrast of statutory rates, minimum tax status, penalty rules, and legal references for {pinnedItems.length} pinned categories.
                  </p>
                </div>
                <button
                  onClick={() => setShowMatrixModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                  aria-label="Close matrix modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Matrix Table */}
              <div className="overflow-x-auto py-4 flex-1">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-3 px-4 text-xs font-bold uppercase text-slate-400 bg-slate-50 w-44">
                        Attribute
                      </th>
                      {pinnedItems.map((item) => (
                        <th key={item.id} className="py-3 px-4 text-left bg-slate-50 border-l border-slate-200">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-black text-slate-900 line-clamp-1">
                              {item.category}
                            </span>
                            <button
                              onClick={() => onUnpin(item.id)}
                              className="text-slate-400 hover:text-rose-600 p-0.5 rounded-sm"
                              title="Unpin item"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700">
                            {item.section}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {/* Subcategory */}
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-slate-500 bg-slate-50/50">
                        Scope & Subcategory
                      </td>
                      {pinnedItems.map((item) => (
                        <td key={item.id} className="py-3.5 px-4 text-slate-700 border-l border-slate-100">
                          {item.subCategory}
                        </td>
                      ))}
                    </tr>

                    {/* Applicable Rate */}
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-slate-500 bg-slate-50/50">
                        Statutory TDS Rate
                      </td>
                      {pinnedItems.map((item) => (
                        <td key={item.id} className="py-3.5 px-4 border-l border-slate-100">
                          <span className="font-mono text-base font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            {item.rate}
                          </span>
                        </td>
                      ))}
                    </tr>

                    {/* Minimum Tax Status */}
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-slate-500 bg-slate-50/50">
                        Minimum Tax Status (Sec 163)
                      </td>
                      {pinnedItems.map((item) => {
                        const details = getLegalDetailsForSection(item.section);
                        return (
                          <td key={item.id} className="py-3.5 px-4 text-xs text-slate-700 border-l border-slate-100 leading-relaxed">
                            {details.statutoryRules.minimumTaxStatus}
                          </td>
                        );
                      })}
                    </tr>

                    {/* PSR Non-compliance Penalty */}
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-slate-500 bg-slate-50/50">
                        PSR Non-compliance Rule
                      </td>
                      {pinnedItems.map((item) => {
                        const details = getLegalDetailsForSection(item.section);
                        return (
                          <td key={item.id} className="py-3.5 px-4 text-xs text-amber-900 bg-amber-50/40 border-l border-slate-100 leading-relaxed">
                            {details.statutoryRules.psrRequirement}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Deducting Authority */}
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-slate-500 bg-slate-50/50">
                        Deducting Authority
                      </td>
                      {pinnedItems.map((item) => {
                        const details = getLegalDetailsForSection(item.section);
                        return (
                          <td key={item.id} className="py-3.5 px-4 text-xs text-slate-600 border-l border-slate-100">
                            {details.statutoryRules.deductingAuthority}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Legal Drawer Action */}
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-slate-500 bg-slate-50/50">
                        Statutory References
                      </td>
                      {pinnedItems.map((item) => (
                        <td key={item.id} className="py-3.5 px-4 border-l border-slate-100">
                          <button
                            onClick={() => {
                              setShowMatrixModal(false);
                              onExpandDetails(item);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Expand Legal Details</span>
                          </button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
                <button
                  onClick={onClearAll}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Unpin All</span>
                </button>
                <div className="flex items-center gap-2">
                  {pinnedItems.length >= 2 && (
                    <button
                      onClick={() => {
                        setShowMatrixModal(false);
                        handleCompareInSlots();
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors"
                    >
                      Load into Main Comparator Slots
                    </button>
                  )}
                  <button
                    onClick={() => setShowMatrixModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
