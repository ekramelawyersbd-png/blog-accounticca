import React from 'react';
import { Scale, X, ArrowRight, Layers, Trash2 } from 'lucide-react';
import { ShopProduct } from '../../data/shopProducts';

interface ProductComparisonDockProps {
  selectedProducts: ShopProduct[];
  onOpenModal: () => void;
  onRemoveProduct: (productId: string) => void;
  onClearAll: () => void;
  onToggleCompareMode?: () => void;
}

export const ProductComparisonDock: React.FC<ProductComparisonDockProps> = ({
  selectedProducts,
  onOpenModal,
  onRemoveProduct,
  onClearAll,
}) => {
  if (selectedProducts.length === 0) return null;

  const canCompare = selectedProducts.length >= 2;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-3xl animate-in fade-in slide-in-from-bottom-6 duration-300">
      <div className="rounded-2xl border border-amber-500/30 bg-slate-950/95 text-white p-3 sm:p-4 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Left Info & Product Thumbnails */}
          <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <div className="flex items-center gap-2 shrink-0">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30">
                <Scale className="h-4 w-4" />
              </span>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Compare Toolkits</span>
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {selectedProducts.length}/4
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  {canCompare ? 'Ready to compare' : 'Select at least 2 toolkits'}
                </div>
              </div>
            </div>

            {/* Thumbnail Pills */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              {selectedProducts.map((product) => (
                <div
                  key={product.id}
                  className="group relative flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 pl-1.5 pr-2 py-1 shrink-0"
                  title={product.title}
                >
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="h-6 w-6 rounded-lg object-cover"
                  />
                  <span className="max-w-[90px] sm:max-w-[110px] truncate text-[11px] font-semibold text-slate-200">
                    {product.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveProduct(product.id)}
                    className="ml-0.5 p-0.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                    aria-label={`Remove ${product.title} from compare list`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClearAll}
              className="px-2.5 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
              title="Clear all selected products"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>

            <button
              type="button"
              disabled={!canCompare}
              onClick={onOpenModal}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md ${
                canCompare
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 cursor-pointer hover:scale-105'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <span>Compare Now ({selectedProducts.length})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
