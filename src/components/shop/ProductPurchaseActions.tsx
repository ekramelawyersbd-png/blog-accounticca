import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  LayoutDashboard
} from 'lucide-react';
import { ShopProduct, inferProductType } from '../../data/shopProducts';
import { usePurchases } from '../../contexts/PurchaseContext';

interface ProductPurchaseActionsProps {
  product?: ShopProduct;
  productId?: string;
  productSlug?: string;
  isAdded?: boolean;
  isAddedToCart?: boolean;
  onAddToCart: (e: React.MouseEvent, product?: ShopProduct) => void;
  onBuyNow: (e: React.MouseEvent, product?: ShopProduct) => void;
  variant?: 'card' | 'course' | 'compact' | 'detail';
  viewProductHref?: string;
  onViewProductClick?: () => void;
}

export const ProductPurchaseActions: React.FC<ProductPurchaseActionsProps> = ({
  product,
  productId,
  productSlug,
  isAdded = false,
  isAddedToCart = false,
  onAddToCart,
  onBuyNow,
  variant = 'card',
  viewProductHref,
  onViewProductClick
}) => {
  const { getProductAccessState } = usePurchases();
  const resolvedId = product?.id || productId || product?.slug || productSlug || '';
  const resolvedSlug = product?.slug || productSlug || product?.id || productId || '';
  const addedFlag = isAdded || isAddedToCart;
  const pType = product ? product.productType || inferProductType(product) : 'Calculator & Excel';
  const accessState = getProductAccessState(resolvedId);
  const resolvedViewHref = viewProductHref || (resolvedSlug ? `/shop/${resolvedSlug}` : '/tools');

  // SCENARIO B: User Has Already Purchased & Verified the Product
  if (accessState === 'completed') {
    if (variant === 'detail') {
      const redirectUrl = product?.coursePath || product?.brochureUrl || '/client-portal';
      const redirectLabel = product?.coursePath
        ? 'Enter Academy Course'
        : product?.brochureUrl
        ? 'Open Unlocked Resource'
        : 'Access in Client Portal';

      return (
        <div className="space-y-3 pt-5 mt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Already Purchased · Verified Account Access Unlocked</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
              Owned
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {onViewProductClick ? (
              <button
                type="button"
                onClick={onViewProductClick}
                className="h-12 px-6 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-sm font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                title={`Redirect to ${redirectUrl}`}
              >
                <ArrowRight className="w-4 h-4 text-white" />
                <span>{redirectLabel}</span>
              </button>
            ) : redirectUrl.startsWith('/') ? (
              <Link
                to={redirectUrl}
                className="h-12 px-6 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-sm font-black transition-all shadow-md flex items-center justify-center gap-2"
                title={`Redirect to ${redirectUrl}`}
              >
                <ArrowRight className="w-4 h-4 text-white" />
                <span>{redirectLabel}</span>
              </Link>
            ) : (
              <a
                href={redirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-12 px-6 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-sm font-black transition-all shadow-md flex items-center justify-center gap-2"
                title={`Redirect to ${redirectUrl}`}
              >
                <ExternalLink className="w-4 h-4 text-white" />
                <span>{redirectLabel}</span>
              </a>
            )}
            <Link
              to="/client-portal"
              className="h-12 px-6 bg-white hover:bg-slate-100 text-slate-950 rounded-xl text-sm font-black transition-all shadow-md flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-700" />
              <span>Go to Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </Link>
          </div>
        </div>
      );
    }

    if (variant === 'compact') {
      return (
        <div className="space-y-1.5">
          <Link
            to={resolvedViewHref}
            className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
          >
            <Eye className="h-3.5 w-3.5 text-emerald-700" />
            <span>View Product</span>
          </Link>
          <Link
            to="/client-portal"
            className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
          >
            <LayoutDashboard className="h-3.5 w-3.5 text-emerald-400" />
            <span>Go to Dashboard</span>
          </Link>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-2">
        <Link
          to={resolvedViewHref}
          onClick={(e) => e.stopPropagation()}
          className="w-full py-2.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs"
        >
          <Eye className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span className="truncate">View Product</span>
        </Link>

        <Link
          to="/client-portal"
          onClick={(e) => e.stopPropagation()}
          className="w-full py-2.5 px-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 hover:shadow-md"
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">Go to Dashboard</span>
        </Link>
      </div>
    );
  }

  // PENDING VERIFICATION STATE: User has a pending unverified order for this product
  if (accessState === 'pending') {
    if (variant === 'detail') {
      return (
        <div className="space-y-3 pt-5 mt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-200 text-xs font-bold">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
              <span>Order Submitted · Pending Payment Verification</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
              Pending
            </span>
          </div>
          <Link
            to="/client-portal"
            className="h-12 w-full px-6 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-sm font-black transition-all shadow-md flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4 text-slate-950" />
            <span>Go to Dashboard</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </Link>
        </div>
      );
    }

    return (
      <div className="space-y-1.5">
        <div className="w-full py-1.5 px-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold flex items-center justify-center gap-1.5">
          <Clock className="w-3 h-3 text-amber-600 shrink-0" />
          <span className="truncate">Pending Verification</span>
        </div>
        <Link
          to="/client-portal"
          onClick={(e) => e.stopPropagation()}
          className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Go to Dashboard</span>
        </Link>
      </div>
    );
  }

  // SCENARIO A: User Has Not Purchased the Product (Default)
  if (variant === 'detail') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-5 mt-4 border-t border-slate-800/80">
        <button
          type="button"
          onClick={(e) => onBuyNow(e, product)}
          className="h-12 px-6 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 active:scale-95 text-slate-950 rounded-xl text-sm font-black transition-all shadow-md hover:shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Apply Now</span>
          <ArrowRight className="w-4 h-4 text-slate-950" />
        </button>

        <button
          type="button"
          onClick={(e) => onAddToCart(e, product)}
          className={`h-12 px-6 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border ${
            isAdded
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-700 shadow-2xs'
          }`}
        >
          {isAdded ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>Added to Cart!</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={(e) => onAddToCart(e, product)}
          className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <ShoppingBag className="h-3.5 w-3.5 text-slate-600" />
          <span>Add to Cart</span>
        </button>

        <button
          type="button"
          onClick={(e) => onBuyNow(e, product)}
          className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer"
        >
          <span>Apply Now</span>
          <ArrowRight className="h-3.5 w-3.5 text-amber-300" />
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={(e) => onAddToCart(e, product)}
        className={`w-full py-2.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
          isAdded
            ? 'bg-emerald-600 text-white border-emerald-600'
            : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-2xs hover:border-slate-300'
        }`}
      >
        {isAdded ? (
          <>
            <Check className="w-3.5 h-3.5 text-white" />
            <span>Added!</span>
          </>
        ) : (
          <>
            <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
            <span>Add to Cart</span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={(e) => onBuyNow(e, product)}
        className={`w-full py-2.5 px-2.5 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer hover:shadow-md ${
          variant === 'course' || pType === 'Academy Courses'
            ? 'bg-emerald-600 hover:bg-emerald-700'
            : 'bg-slate-900 hover:bg-slate-800'
        }`}
      >
        <span>Apply Now</span>
        <ArrowRight
          className={`w-3.5 h-3.5 ${
            variant === 'course' || pType === 'Academy Courses' ? 'text-white' : 'text-amber-300'
          }`}
        />
      </button>
    </div>
  );
};
