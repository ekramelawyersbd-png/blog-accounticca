import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Maximize2, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Sparkles, 
  ShoppingBag, 
  Check, 
  ExternalLink,
  Layers,
  Image as ImageIcon,
  Tag,
  Eye,
  ZoomIn
} from 'lucide-react';
import { ShopProduct } from '../../data/shopProducts';
import { LightboxModal, LightboxImageItem } from '../gallery/LightboxModal';

interface ShopPictureGalleryProps {
  products: ShopProduct[];
  selectedOption: string;
  selectedType: string;
  selectedCategory: string;
  onAddToCart?: (e: React.MouseEvent, product: ShopProduct) => void;
  onInstantBuy?: (e: React.MouseEvent, product: ShopProduct) => void;
  addedIds?: Record<string, boolean>;
}

export const ShopPictureGallery: React.FC<ShopPictureGalleryProps> = ({
  products,
  selectedOption,
  selectedType,
  selectedCategory,
  onAddToCart,
  onInstantBuy,
  addedIds = {}
}) => {
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Gallery items derived from filtered products with valid images
  const galleryItems = products.filter(p => !!p.imageUrl);

  // Convert to LightboxImageItem format
  const lightboxImages: LightboxImageItem[] = galleryItems.map(p => ({
    id: p.id,
    url: p.imageUrl,
    title: p.title,
    description: p.shortDescription,
    category: p.category,
    badge: p.badge,
    price: p.price,
    format: p.format,
    slug: p.slug
  }));

  if (galleryItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-8">
      {/* Picture Gallery Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-6 transition-all duration-300">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
              <ImageIcon className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-900 bg-amber-100 border border-amber-300/60 px-2 py-0.5 rounded-full">
                  Visual Picture Gallery
                </span>
                <span className="text-xs text-slate-300">•</span>
                <span className="text-xs font-bold text-slate-800">
                  {selectedOption}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-950 tracking-tight mt-0.5">
                Visual Showcase &amp; Photo Previews
                <span className="ml-2 text-xs font-semibold text-slate-500">
                  ({galleryItems.length} {galleryItems.length === 1 ? 'picture' : 'pictures'})
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsExpanded(prev => !prev)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <span>{isExpanded ? 'Hide Gallery' : 'Show Gallery'}</span>
            </button>
          </div>
        </div>

        {/* Gallery Visual Grid */}
        {isExpanded && (
          <div className="pt-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
              {galleryItems.map((product, idx) => {
                const discount = Math.round(
                  ((product.originalPrice - product.price) / product.originalPrice) * 100
                );

                return (
                  <div
                    key={product.id}
                    onClick={() => setActiveLightboxIndex(idx)}
                    className="group relative rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-950 shadow-xs hover:shadow-xl hover:border-amber-400/70 transition-all duration-300 cursor-pointer flex flex-col aspect-4/5"
                  >
                    {/* Image Layer */}
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                    />

                    {/* Gradient Overlay for Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-black/20 group-hover:from-slate-950/95 transition-all duration-300" />

                    {/* Top Badges */}
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 z-10 pointer-events-none">
                      {product.badge ? (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-slate-950/90 text-amber-300 border border-amber-400/40 shadow-xs">
                          {product.badge}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-slate-950/80 text-slate-300 border border-slate-700">
                          {product.category.split(' ')[0]}
                        </span>
                      )}

                      {discount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-emerald-600 text-white shadow-xs">
                          -{discount}%
                        </span>
                      )}
                    </div>

                    {/* Hover Zoom Icon */}
                    <div className="absolute inset-0 flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                      <div className="w-10 h-10 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
                        <Maximize2 className="w-4 h-4 stroke-[2.5]" />
                      </div>
                    </div>

                    {/* Bottom Metadata */}
                    <div className="absolute bottom-0 left-0 right-0 p-2.5 z-10 text-white space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold text-amber-300 truncate font-mono">
                          {product.price === 0 ? 'FREE' : `Tk ${product.price.toLocaleString()}`}
                        </span>
                        <span className="text-[9px] text-slate-300 truncate max-w-[80px]">
                          {product.format.split(' ')[0]}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold leading-tight line-clamp-2 text-white group-hover:text-amber-200 transition-colors">
                        {product.title}
                      </h4>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-[11px] text-slate-400 mt-3 flex items-center justify-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-amber-500" />
              <span>Click any image to enlarge and preview complete toolkit details</span>
            </p>
          </div>
        )}
      </div>

      {/* Enhanced Full-screen Zoomable Lightbox Modal */}
      <LightboxModal
        images={lightboxImages}
        initialIndex={activeLightboxIndex ?? 0}
        isOpen={activeLightboxIndex !== null}
        onClose={() => setActiveLightboxIndex(null)}
        onAddToCart={onAddToCart ? (item) => {
          const prod = galleryItems.find(p => p.id === item.id);
          if (prod) {
            onAddToCart({ stopPropagation: () => {} } as any, prod);
          }
        } : undefined}
        isAdded={
          activeLightboxIndex !== null && galleryItems[activeLightboxIndex]
            ? !!addedIds[galleryItems[activeLightboxIndex].id]
            : false
        }
      />
    </div>
  );
};

export default ShopPictureGallery;
