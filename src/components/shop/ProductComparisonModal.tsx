import React from 'react';
import { Link } from 'react-router-dom';
import { 
  X, 
  Scale, 
  Check, 
  ShoppingBag, 
  ArrowRight, 
  ShieldCheck, 
  FileText, 
  Star, 
  Trash2, 
  Download,
  AlertCircle,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { ShopProduct, inferProductType } from '../../data/shopProducts';
import { ProductPurchaseActions } from './ProductPurchaseActions';

interface ProductComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ShopProduct[];
  onRemoveProduct: (productId: string) => void;
  onClearAll: () => void;
  onAddToCart: (product: ShopProduct) => void;
  onInstantBuy: (product: ShopProduct) => void;
}

export const ProductComparisonModal: React.FC<ProductComparisonModalProps> = ({
  isOpen,
  onClose,
  products,
  onRemoveProduct,
  onClearAll,
  onAddToCart,
  onInstantBuy,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="compare-modal-title">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-6">
        <div className="relative w-full max-w-6xl transform overflow-hidden rounded-[2rem] border border-amber-500/25 bg-white text-left shadow-2xl transition-all">
          
          {/* Executive Header Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-[#0b162c] to-slate-900 px-6 py-6 sm:px-8 sm:py-7 text-white">
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
                  <Scale className="h-3.5 w-3.5 text-amber-400" />
                  <span>Statutory & Advisory Toolkit Comparison</span>
                </div>
                <h2 id="compare-modal-title" className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-white font-serif">
                  Side-by-Side Legal Solutions Matrix
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-300">
                  Comparing {products.length} legal toolkit{products.length === 1 ? '' : 's'} across statutory compliance, deliverables, clauses, and pricing.
                </p>
              </div>

              <div className="flex items-center gap-2.5 self-start sm:self-auto">
                {products.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearAll}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                    <span>Clear All</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  aria-label="Close comparison modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Comparison Content Table */}
          {products.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
                <Scale className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">No toolkits selected for comparison</h3>
              <p className="mt-1 text-xs text-slate-500">
                Select 2 to 4 legal agreements or toolkits on the shop page to compare their attributes side-by-side.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
              >
                Return to Shop
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto p-4 sm:p-6">
              <table className="w-full min-w-[700px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="w-48 p-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Attribute
                    </th>
                    {products.map((product) => {
                      const discountPercent = Math.round(
                        ((product.originalPrice - product.price) / product.originalPrice) * 100
                      );
                      const pType = product.productType || inferProductType(product);

                      return (
                        <th key={product.id} className="p-3 align-top min-w-[220px] max-w-[280px]">
                          <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-3.5 flex flex-col justify-between h-full">
                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={() => onRemoveProduct(product.id)}
                              className="absolute top-2 right-2 p-1 rounded-lg bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 shadow-2xs transition-colors"
                              title="Remove from comparison"
                              aria-label={`Remove ${product.title} from comparison`}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>

                            <div>
                              <div className="aspect-16/10 rounded-xl overflow-hidden bg-slate-200 mb-2.5">
                                <img
                                  src={product.imageUrl}
                                  alt={product.title}
                                  className="h-full w-full object-cover"
                                />
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-amber-300 px-2 py-0.5 rounded">
                                  {pType}
                                </span>
                                {product.badge && (
                                  <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                                    {product.badge}
                                  </span>
                                )}
                              </div>

                              <Link
                                to={`/shop/${product.slug}`}
                                onClick={onClose}
                                className="font-bold text-sm text-slate-900 hover:text-emerald-700 transition-colors line-clamp-2 block leading-snug"
                              >
                                {product.title}
                              </Link>
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-baseline justify-between">
                              <div>
                                <span className="text-base font-black text-slate-950">
                                  BDT {product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                {product.originalPrice > product.price && (
                                  <span className="block text-[11px] line-through text-slate-400">
                                    BDT {product.originalPrice.toLocaleString('en-IN')}
                                  </span>
                                )}
                              </div>
                              {discountPercent > 0 && (
                                <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded">
                                  -{discountPercent}%
                                </span>
                              )}
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs">
                  {/* Category / Discipline */}
                  <tr className="hover:bg-slate-50/70">
                    <td className="p-3 font-bold text-slate-600 bg-slate-50/50">Practice Area</td>
                    {products.map((p) => (
                      <td key={p.id} className="p-3 text-slate-900 font-semibold">
                        <span className="inline-block bg-slate-100 px-2 py-1 rounded text-[11px] text-slate-700 border border-slate-200/60">
                          {p.category}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Format & Deliverables */}
                  <tr className="hover:bg-slate-50/70">
                    <td className="p-3 font-bold text-slate-600 bg-slate-50/50">Deliverable Format</td>
                    {products.map((p) => (
                      <td key={p.id} className="p-3 text-slate-900">
                        <span className="font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60">
                          {p.format}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Scope & Volume */}
                  <tr className="hover:bg-slate-50/70">
                    <td className="p-3 font-bold text-slate-600 bg-slate-50/50">Scope & Volume</td>
                    {products.map((p) => (
                      <td key={p.id} className="p-3 font-mono font-bold text-slate-800">
                        {p.pagesOrFiles}
                      </td>
                    ))}
                  </tr>

                  {/* Governing Law / Statutory Framework */}
                  <tr className="hover:bg-slate-50/70">
                    <td className="p-3 font-bold text-slate-600 bg-slate-50/50">Governing Legislation</td>
                    {products.map((p) => (
                      <td key={p.id} className="p-3 text-slate-800">
                        <div className="flex items-start gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="font-semibold text-slate-900">
                            {p.governingLaw || 'Statutory Acts of Bangladesh (2026)'}
                          </span>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Practitioner Vetting */}
                  <tr className="hover:bg-slate-50/70">
                    <td className="p-3 font-bold text-slate-600 bg-slate-50/50">Vetted By</td>
                    {products.map((p) => (
                      <td key={p.id} className="p-3 text-slate-700">
                        {p.authorOrVettedBy || 'Adv. Ekram Hossain, Supreme Court of Bangladesh'}
                      </td>
                    ))}
                  </tr>

                  {/* Rating & Reviews */}
                  <tr className="hover:bg-slate-50/70">
                    <td className="p-3 font-bold text-slate-600 bg-slate-50/50">Customer Rating</td>
                    {products.map((p) => (
                      <td key={p.id} className="p-3">
                        <div className="flex items-center gap-1.5 text-amber-500 font-bold">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-slate-900">{p.rating}</span>
                          <span className="text-slate-400 font-normal">({p.reviewsCount} reviews)</span>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Key Features & Clauses Included */}
                  <tr className="hover:bg-slate-50/70">
                    <td className="p-3 font-bold text-slate-600 bg-slate-50/50 align-top">
                      Key Clauses & Specs
                    </td>
                    {products.map((p) => (
                      <td key={p.id} className="p-3 align-top">
                        <ul className="space-y-1.5 text-[11px] text-slate-600">
                          {p.features && p.features.length > 0 ? (
                            p.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{feature}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-slate-400 italic">Complete practitioner drafting</li>
                          )}
                        </ul>
                      </td>
                    ))}
                  </tr>

                  {/* Instant Actions Row */}
                  <tr className="bg-slate-50/80">
                    <td className="p-3 font-bold text-slate-600">Quick Actions</td>
                    {products.map((p) => (
                      <td key={p.id} className="p-3">
                        <ProductPurchaseActions
                          product={p}
                          onAddToCart={(_, prod) => onAddToCart(prod)}
                          onBuyNow={(_, prod) => {
                            onClose();
                            onInstantBuy(prod);
                          }}
                          variant="compact"
                        />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Footer Advisory Note */}
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
              <span>All agreements & spreadsheets are updated for FY 2026–27 statutory rules.</span>
            </div>
            <Link
              to="/contact?tab=appointment"
              onClick={onClose}
              className="font-bold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1"
            >
              <span>Need bespoke drafting or counsel? Book consult</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};
