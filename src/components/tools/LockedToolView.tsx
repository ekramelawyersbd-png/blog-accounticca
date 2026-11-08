import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, ShoppingBag, ShoppingCart, CheckCircle2, Sparkles, ArrowRight, ShieldCheck, CreditCard } from 'lucide-react';
import { ShopProduct } from '../../data/shopProducts';
import { useCart } from '../../contexts/CartContext';
import { usePurchases } from '../../contexts/PurchaseContext';

export interface LockedToolViewProps {
  product?: ShopProduct;
  toolTitle?: string;
  onUnlockSuccess?: () => void;
}

export const LockedToolView: React.FC<LockedToolViewProps> = ({
  product,
  toolTitle,
  onUnlockSuccess
}) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { simulateInstantPurchase } = usePurchases();

  const handleBuyNow = () => {
    if (product) {
      addToCart(product, 1);
      navigate(`/shop/${product.slug}`);
    } else {
      navigate('/tools');
    }
  };

  const handleTestUnlock = () => {
    if (product) {
      simulateInstantPurchase(product);
      if (onUnlockSuccess) {
        onUnlockSuccess();
      }
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-200/90 bg-gradient-to-br from-amber-50/90 via-white to-slate-50 p-6 sm:p-10 shadow-xl">
      <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />
      <div className="absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
        
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100/90 text-amber-900 text-xs font-bold shadow-xs border border-amber-300">
          <Lock className="w-4 h-4 text-amber-700" />
          <span>Shop Protected Tool & Premium Feature</span>
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {toolTitle || product?.title || 'Restricted Professional Tool Access'}
          </h3>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            {product?.shortDescription || 'Access to this interactive compliance tool is restricted to verified purchasers of the corresponding digital product in our official shop.'}
          </p>
        </div>

        {/* Product Details Card */}
        {product && (
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-200 text-left max-w-2xl mx-auto space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Shop Product Title</span>
                <h4 className="text-base font-extrabold text-slate-900 leading-snug">
                  {product.title}
                </h4>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Access Fee</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black text-slate-950">৳{product.price.toLocaleString()}</span>
                  {product.originalPrice > product.price && (
                    <span className="text-xs text-slate-400 line-through">৳{product.originalPrice.toLocaleString()}</span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h5 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>What's Included with Unlocked Access:</span>
              </h5>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                {product.features.slice(0, 4).map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-tight">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Action Buttons with Prominent Buy Now */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
          
          {/* Prominent Buy Now Button */}
          {product ? (
            <Link
              to={`/shop/${product.slug}`}
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-lg transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <ShoppingBag className="w-5 h-5 text-emerald-200" />
              <span>Apply Now (৳{product.price.toLocaleString()})</span>
              <ArrowRight className="w-5 h-5 text-emerald-100" />
            </Link>
          ) : (
            <Link
              to="/tools"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-lg transition-all cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Browse Compliance Tools</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}

          {/* Instant Test Unlock */}
          {product && (
            <button
              onClick={handleTestUnlock}
              className="inline-flex items-center gap-2 px-5 py-4 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs transition-all border border-amber-300 cursor-pointer"
              title="Simulate instant purchase for testing and evaluation"
            >
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span>Instant Test Unlock</span>
            </button>
          )}

        </div>

        <p className="text-xs text-slate-500 pt-2">
          Already purchased through bank transfer or bKash? Verify your Transaction ID in the{' '}
          <Link to="/profile" className="font-bold text-slate-800 hover:underline">
            Account Profile
          </Link>{' '}
          or contact <span className="font-semibold text-slate-700">support@elawyersbd.com</span>.
        </p>

      </div>
    </div>
  );
};

export default LockedToolView;
