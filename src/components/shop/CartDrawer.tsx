import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  X, 
  Trash2, 
  ShoppingBag, 
  ArrowRight, 
  ShieldCheck, 
  Tag, 
  Check, 
  Plus, 
  Minus,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { usePurchases } from '../../contexts/PurchaseContext';

interface CartDrawerProps {
  onCheckout?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onCheckout }) => {
  const navigate = useNavigate();
  const { 
    items, 
    removeFromCart, 
    updateQuantity, 
    clearCart,
    subtotal, 
    discount, 
    promoCode, 
    applyPromoCode, 
    removePromoCode, 
    total, 
    totalItemsCount,
    isCartOpen, 
    setIsCartOpen 
  } = useCart();
  const { isPurchased, isPendingPurchase } = usePurchases();

  const [promoInput, setPromoInput] = useState('');
  const [promoFeedback, setPromoFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isCartOpen) return null;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const res = applyPromoCode(promoInput);
    if (res.success) {
      setPromoFeedback({ type: 'success', message: res.message });
      setPromoInput('');
    } else {
      setPromoFeedback({ type: 'error', message: res.message });
    }
    setTimeout(() => setPromoFeedback(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">Your Cart</h3>
                <p className="text-xs text-slate-400 font-medium">
                  {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} selected
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-slate-400 hover:text-rose-400 transition-colors px-2 py-1"
                  title="Clear all cart items"
                >
                  Clear All
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close cart drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8 stroke-1" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-base">Your cart is empty</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Explore legal contracts, automated tax workbooks, and corporate compliance toolkits.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <span>Explore Shop Items</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {items.map((item) => {
                  const alreadyOwned = isPurchased(item.product.id) || isPurchased(item.product.slug);
                  const pendingOrder = isPendingPurchase(item.product.id) || isPendingPurchase(item.product.slug);

                  return (
                    <div
                      key={item.product.id}
                      className={`p-3.5 rounded-2xl border transition-all flex gap-3.5 ${
                        alreadyOwned
                          ? 'bg-emerald-50/70 border-emerald-200'
                          : pendingOrder
                          ? 'bg-amber-50/70 border-amber-200'
                          : 'bg-slate-50 border-slate-200/80 hover:border-emerald-200'
                      }`}
                    >
                      <Link
                        to={`/shop/${item.product.slug}`}
                        onClick={() => setIsCartOpen(false)}
                        className="shrink-0 block"
                      >
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.title}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-200 hover:opacity-90 transition-opacity"
                        />
                      </Link>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <Link
                            to={`/shop/${item.product.slug}`}
                            onClick={() => setIsCartOpen(false)}
                            className="font-bold text-xs text-slate-900 leading-snug line-clamp-2 hover:text-emerald-700 transition-colors"
                          >
                            {item.product.title}
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                          {item.product.format}
                        </div>

                        {alreadyOwned ? (
                          <div className="mt-2 space-y-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              <Check className="w-3 h-3" />
                              Already Purchased — Duplicate Blocked
                            </span>
                            <div className="grid grid-cols-2 gap-1.5">
                              <Link
                                to={`/shop/${item.product.slug}`}
                                onClick={() => setIsCartOpen(false)}
                                className="py-1.5 px-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold text-center transition-colors"
                              >
                                View Product
                              </Link>
                              <Link
                                to="/client-portal"
                                onClick={() => setIsCartOpen(false)}
                                className="py-1.5 px-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold text-center transition-colors"
                              >
                                Go to Dashboard
                              </Link>
                            </div>
                          </div>
                        ) : pendingOrder ? (
                          <div className="mt-2 space-y-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                              Pending Verification
                            </span>
                            <Link
                              to="/client-portal"
                              onClick={() => setIsCartOpen(false)}
                              className="block py-1.5 px-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold text-center transition-colors"
                            >
                              Go to Dashboard
                            </Link>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between mt-2.5">
                            <div className="flex items-center gap-1.5 font-black text-xs text-slate-900">
                              <span>BDT {(item.product.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              {item.product.originalPrice > item.product.price && (
                                <span className="text-[10px] line-through text-slate-400 font-normal">
                                  BDT {(item.product.originalPrice * item.quantity).toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center border border-slate-200 bg-white rounded-lg">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                className="p-1 hover:bg-slate-100 text-slate-600 rounded-l-lg transition-colors"
                                title="Decrease quantity"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 text-xs font-bold text-slate-800">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                className="p-1 hover:bg-slate-100 text-slate-600 rounded-r-lg transition-colors"
                                title="Increase quantity"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Promo Code Box */}
            {items.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <form onSubmit={handleApplyPromo} className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Have a Promo Code?</span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. ACCOUNTICCA10"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Apply
                    </button>
                  </div>

                  {promoFeedback && (
                    <div className={`text-[11px] font-bold p-2 rounded-lg flex items-center gap-1.5 ${
                      promoFeedback.type === 'success' 
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      {promoFeedback.type === 'success' ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      <span>{promoFeedback.message}</span>
                    </div>
                  )}

                  {promoCode && (
                    <div className="flex items-center justify-between text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        Code: <strong>{promoCode}</strong> applied
                      </span>
                      <button
                        type="button"
                        onClick={removePromoCode}
                        className="text-xs text-rose-600 hover:underline font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400">
                    Tip: Use coupon <code className="font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">ACCOUNTICCA10</code> for 10% off.
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          {items.length > 0 && (
            <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-3 shrink-0">
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-900">BDT {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Discount Savings:</span>
                    <span>-BDT {discount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount:</span>
                  <span className="text-base text-emerald-700 font-black">
                    BDT {total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Delivery Assurance */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Instant Digital Download & Email Delivery via Secure Gateway</span>
              </div>

              {/* Checkout Button */}
              <button
                type="button"
                onClick={() => {
                  setIsCartOpen(false);
                  if (onCheckout) {
                    onCheckout();
                  } else {
                    navigate('/checkout');
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
