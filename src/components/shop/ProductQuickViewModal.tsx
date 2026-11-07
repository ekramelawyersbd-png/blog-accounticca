import React, { useState } from 'react';
import { 
  X, 
  ShoppingBag, 
  Check, 
  ShieldCheck, 
  FileText, 
  Download, 
  Star, 
  Share2, 
  Sparkles,
  Scale,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { ShopProduct } from '../../data/shopProducts';
import { useCart } from '../../contexts/CartContext';

interface ProductQuickViewModalProps {
  product: ShopProduct | null;
  onClose: () => void;
  onInstantCheckout?: (product: ShopProduct) => void;
}

export const ProductQuickViewModal: React.FC<ProductQuickViewModalProps> = ({
  product,
  onClose,
  onInstantCheckout
}) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);

  if (!product) return null;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2000);
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(`${product.title} - Accounticca Shop: ${url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const discountPercent = Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center">
        <div className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-3xl border border-slate-200">
          
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-12">
            
            {/* Left side: Product Image & Overview (5 cols) */}
            <div className="md:col-span-5 bg-slate-900 text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-4">
                <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg aspect-4/3 bg-slate-800">
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-white ml-1">{product.rating}</span>
                    <span className="text-xs text-slate-400">({product.reviewsCount} reviews)</span>
                  </div>

                  <div className="text-xs text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Vetted by: {product.authorOrVettedBy}</span>
                  </div>

                  {product.governingLaw && (
                    <div className="text-[11px] text-slate-400 flex items-start gap-1.5 leading-relaxed">
                      <Scale className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <span>{product.governingLaw}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery info */}
              <div className="relative z-10 mt-6 pt-4 border-t border-white/10 space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span>File Delivery:</span>
                  <span className="font-bold text-white">Instant Download</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Format:</span>
                  <span className="font-bold text-emerald-400">{product.format}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Volume:</span>
                  <span className="font-bold text-white">{product.pagesOrFiles}</span>
                </div>
              </div>
            </div>

            {/* Right side: Product Details & Purchase Actions (7 cols) */}
            <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {product.category}
                  </span>
                  {product.badge && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-900 text-amber-300">
                      {product.badge}
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                  {product.title}
                </h2>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {product.fullDescription}
                </p>

                {/* Pricing Box */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Price (One-Time Payment)
                    </div>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-2xl font-black text-slate-900">
                        BDT {product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      {product.originalPrice > product.price && (
                        <span className="text-sm line-through text-slate-400 font-semibold">
                          BDT {product.originalPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>

                  {discountPercent > 0 && (
                    <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-emerald-600 text-white">
                      Save {discountPercent}%
                    </span>
                  )}
                </div>

                {/* Features Checklist */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    What's Included:
                  </h4>
                  <ul className="space-y-1.5">
                    {product.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          ✓
                        </span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Sample Preview Snippet */}
                {product.samplePreviewSnippet && (
                  <div className="p-3 bg-slate-100 rounded-xl text-[11px] text-slate-600 font-mono border border-slate-200">
                    <span className="font-bold text-slate-800 block mb-0.5 text-[10px] uppercase font-sans">
                      Document Sample Excerpt:
                    </span>
                    <p className="line-clamp-2 italic">"{product.samplePreviewSnippet}"</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center gap-3">
                  {/* Quantity */}
                  <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-2 text-slate-600 hover:text-slate-900 font-bold"
                    >
                      -
                    </button>
                    <span className="px-2 text-xs font-bold text-slate-900">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-2 text-slate-600 hover:text-slate-900 font-bold"
                    >
                      +
                    </button>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    {addedAnimation ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Added to Cart!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4 text-emerald-400" />
                        <span>Add to Cart (BDT {(product.price * quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
                      </>
                    )}
                  </button>

                  {/* Share button */}
                  <button
                    type="button"
                    onClick={handleShare}
                    className="p-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                    title="Share product link"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                  </button>
                </div>

                {onInstantCheckout && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onInstantCheckout(product);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    <span>Instant Checkout Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
