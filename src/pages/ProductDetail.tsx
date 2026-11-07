import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  ArrowLeft, 
  Star, 
  ShieldCheck, 
  FileText, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  Scale, 
  Share2, 
  Copy, 
  Check, 
  ArrowRight, 
  ChevronRight, 
  Award, 
  HelpCircle, 
  Zap, 
  Lock,
  FileDown,
  ExternalLink,
  Heart,
  GraduationCap,
  MonitorPlay
} from 'lucide-react';
import { ServiceSEO } from '../components/SEO';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../contexts/CartContext';
import { usePurchases } from '../contexts/PurchaseContext';
import { useShopAuth } from '../contexts/ShopAuthContext';
import { useBookmarks } from '../contexts/BookmarkContext';
import { ShopProduct, inferProductType } from '../data/shopProducts';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ProductPurchaseActions } from '../components/shop/ProductPurchaseActions';

export function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { products, getProductBySlug, loading, togglePublishStatus } = useProducts();
  const { addToCart, totalItemsCount, setIsCartOpen } = useCart();
  const { isAuthenticated } = useShopAuth();

  const product = slug ? getProductBySlug(slug) : undefined;
  const isDraft = product?.status === 'draft';

  // Purchases context & access gate enforcer
  const {
    isPurchased,
    isPendingPurchase,
    getPurchaseRecord,
    downloadReceipt,
    simulateInstantPurchase
  } = usePurchases();
  const hasPurchased = product ? isPurchased(product.id) : false;
  const hasPendingOrder = product ? isPendingPurchase(product.id) : false;
  const activePurchaseRecord = product ? getPurchaseRecord(product.id) : undefined;
  const [gatedAlert, setGatedAlert] = useState<string | null>(null);

  // Bookmark context for saving product
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const isSaved = product ? isBookmarked(product.id) : false;

  const handleToggleFavorite = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!product) return;
    await toggleBookmark({
      id: product.id,
      title: product.title,
      url: `/shop/${product.slug}`,
      type: 'article',
      category: product.category,
      offlineExcerpt: product.shortDescription,
      offlineImageUrl: product.imageUrl,
      authorName: product.authorOrVettedBy || 'Accounticca × E-Lawyers',
    });
  };

  const isInternalLink = (url?: string) => {
    if (!url) return false;
    const clean = url.trim();
    return clean.startsWith('/') || (clean.includes(window.location.host) && clean.startsWith('http'));
  };

  const isGatedInternalLink = !!(product?.requiresPurchaseToAccess || (product?.brochureUrl && isInternalLink(product.brochureUrl)));
  const isLinkUnlocked = !isGatedInternalLink || hasPurchased;

  // Quantity state & user feedback
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSnippetCopied, setIsSnippetCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'compliance'>('overview');

  // Scroll to top on slug change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setQuantity(1);
    setIsAdded(false);
    setGatedAlert(null);
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    if (hasPurchased || hasPendingOrder) {
      navigate('/client-portal');
      return;
    }
    addToCart(product, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (hasPurchased || hasPendingOrder) {
      navigate('/client-portal');
      return;
    }
    navigate(`/checkout?product=${encodeURIComponent(product.slug)}&qty=${quantity}`);
  };

  const handlePayNow = () => {
    if (!product) return;
    if (hasPurchased || hasPendingOrder) {
      navigate('/client-portal');
      return;
    }
    navigate(`/checkout?product=${encodeURIComponent(product.slug)}&qty=${quantity}`);
  };

  const handleDownloadPurchasedKit = (prod: ShopProduct) => {
    const content = `========================================================
ACCOUNTICCA & E-LAWYERS VERIFIED DIGITAL REPOSITORY
========================================================
Product Title: ${prod.title}
Product ID: ${prod.id}
Format: ${prod.format}
Governing Law: ${prod.governingLaw || 'Bangladesh Jurisdictional Law'}
Order ID: ${activePurchaseRecord?.orderId || 'VERIFIED-ACCESS'}
Access Status: ACTIVE & VERIFIED

--- OVERVIEW & INSTRUCTIONS ---
${prod.fullDescription}

--- INCLUDED DELIVERABLES ---
${prod.features.map((f, i) => `${i + 1}. ${f}`).join('\n')}

--- SAMPLE CLAUSE / EXCERPT ---
${prod.samplePreviewSnippet || 'Full verified statutory template.'}
========================================================`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${prod.slug}-verified-kit.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAndRedirect = (prod: ShopProduct) => {
    handleDownloadPurchasedKit(prod);
    const redirectUrl = prod.coursePath || prod.brochureUrl || '/client-portal';
    if (redirectUrl.startsWith('http')) {
      window.open(redirectUrl, '_blank', 'noopener,noreferrer');
    } else {
      navigate(redirectUrl);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleCopySnippet = () => {
    if (!product?.samplePreviewSnippet) return;
    navigator.clipboard.writeText(product.samplePreviewSnippet);
    setIsSnippetCopied(true);
    setTimeout(() => setIsSnippetCopied(false), 2000);
  };

  // If loading and product not yet found
  if (loading && !product) {
    return (
      <div className="min-h-screen bg-[#F6F8FB] flex items-center justify-center py-24">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-600 font-semibold text-sm">Loading verified product details...</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (!product) {
    return (
      <div className="min-h-screen bg-[#F6F8FB] py-20 px-4">
        <div className="max-w-xl mx-auto bg-white rounded-2xl p-8 sm:p-10 text-center border border-slate-200 shadow-xs space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <FileText className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Product Not Found</h1>
            <p className="text-slate-600 text-sm">
              We couldn't find the product <span className="font-mono font-bold text-slate-800">"{slug}"</span>. It may have been archived or updated in our compliance repository.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/tools"
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Tools Hub</span>
            </Link>
            <Link
              to="/contact"
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
            >
              Contact Legal Desk
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If item is saved as draft and viewer is not logged in as authorized admin
  if (isDraft && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F6F8FB] py-20 px-4">
        <div className="max-w-xl mx-auto bg-white rounded-2xl p-8 sm:p-10 text-center border border-slate-200 shadow-xs space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Product in Preparation (Draft)</h1>
            <p className="text-slate-600 text-sm leading-relaxed">
              The product <strong className="text-slate-800 font-semibold">"{product.title}"</strong> is currently unpublished and not visible to public customers.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/tools"
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Browse Compliance Tools</span>
            </Link>
            <Link
              to={`/admin/login?redirect=${encodeURIComponent(`/shop/${product.slug}`)}`}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2"
            >
              <span>Admin Login</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Related products (published only)
  const relatedProducts = products
    .filter(p => p.status !== 'draft' && p.id !== product.id && (p.category === product.category || p.rating >= 4.9))
    .slice(0, 3);

  const discountPercent = product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const productType = product.productType || inferProductType(product);

  return (
    <div className="bg-[#F6F8FB] min-h-screen text-slate-800 antialiased">
      <ServiceSEO
        title={`${product.title} | Accounticca Digital Shop`}
        description={product.shortDescription}
        serviceType="Legal & Tax Digital Product"
        canonicalUrl={`/shop/${product.slug}`}
        keywords={[
          product.title,
          product.category,
          'Bangladesh Legal Document',
          'Accounticca Shop',
          product.governingLaw || 'Bangladesh Law'
        ]}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Tools', url: '/tools' },
          { name: product.title, url: `/shop/${product.slug}` }
        ]}
      />

      {/* Sync product hierarchy with Layout's global Breadcrumb bar beneath header */}
      <Breadcrumbs
        items={[
          { label: 'Tools', path: '/tools' },
          { label: product.title }
        ]}
      />

      {/* Top Product Action Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Verified Digital Resource · {product.category}</span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Show admin desk button strictly for authenticated users */}
            {isAuthenticated && (
              <Link
                to="/admin/shop"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-colors text-xs"
              >
                <span>⚙️ Manage in Admin</span>
              </Link>
            )}

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium transition-colors cursor-pointer text-xs"
              title="Share this product link"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Share</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleToggleFavorite}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer text-xs ${
                isSaved
                  ? 'bg-rose-50 border-rose-300 text-rose-700 font-semibold'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title={isSaved ? 'Remove from saved bookmarks' : 'Save to personal bookmarks'}
            >
              <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-current text-rose-600' : 'text-slate-500'}`} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>

            <Link
              to="/tools"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-emerald-700 hover:text-emerald-800 font-semibold hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Tools</span>
            </Link>
          </div>

        </div>
      </div>

      {/* Admin Draft Mode Notice Banner */}
      {isDraft && isAuthenticated && (
        <div className="bg-amber-50 border-b border-amber-200 py-2.5 px-4">
          <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span>Draft Preview: This product is currently hidden from the public Shop catalog.</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => togglePublishStatus(product.id)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Publish Live
              </button>
              <Link
                to="/admin/shop"
                className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold rounded-lg text-xs transition-colors"
              >
                Admin Desk
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Container: 1200-1280px Max Width with Balanced 2-Column Grid */}
      <main className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start w-full">

          {/* LEFT COLUMN: Visual Media (40% width on Desktop = 5 cols), Specs, Excerpt, Guarantee */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* 1. Product Image & Preview Container */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                <img
                  src={product.imageUrl || '/logo.png'}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />

                {/* Refined single corner badge overlay */}
                <div className="absolute top-3.5 left-3.5 flex items-center gap-2 z-10">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-slate-900/90 text-white backdrop-blur-xs shadow-sm">
                    {productType}
                  </span>
                  {discountPercent > 0 && (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500 text-slate-950 shadow-sm">
                      {discountPercent}% OFF
                    </span>
                  )}
                </div>

                {/* Subtle updated mark and bookmark button top-right */}
                <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-white/95 text-slate-700 backdrop-blur-xs border border-slate-200 shadow-xs">
                    Updated 2026
                  </span>
                  <button
                    type="button"
                    aria-label={isSaved ? `Remove ${product.title} from personal bookmarks` : `Save ${product.title} to personal bookmarks`}
                    title={isSaved ? 'Remove from saved bookmarks' : 'Save to personal bookmarks'}
                    onClick={handleToggleFavorite}
                    className={`group/heart flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all duration-200 cursor-pointer shadow-sm ${
                      isSaved
                        ? 'bg-rose-500 text-white ring-2 ring-white/90 shadow-rose-950/30 scale-105'
                        : 'bg-white/90 text-slate-700 hover:bg-white hover:text-rose-500 hover:scale-110 border border-slate-200'
                    }`}
                  >
                    <Heart
                      className={`h-4 w-4 transition-transform duration-200 ${
                        isSaved ? 'fill-current text-white scale-110' : 'text-slate-600 group-hover/heart:scale-110'
                      }`}
                    />
                  </button>
                </div>

                {/* Clean Bottom Digital Download Strip */}
                <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur-md text-white px-3.5 py-2 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Instant Digital Download</span>
                  </div>
                  <span className="font-mono text-emerald-300 text-[11px] font-medium">{product.pagesOrFiles}</span>
                </div>
              </div>

              {/* Format & License Meta Row */}
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-2 font-medium text-slate-800">
                  <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{product.format}</span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Commercial License</span>
              </div>
            </div>

            {/* 2. Technical Specifications (Clean 2-Column Rows with Fixed Alignment) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-xs">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-600" />
                <span>Technical & Legal Specifications</span>
              </h3>

              <div className="divide-y divide-slate-100 text-xs">
                {product.governingLaw && (
                  <div className="py-2.5 flex items-start justify-between gap-4">
                    <span className="text-slate-500 font-medium w-36 shrink-0">Governing Law</span>
                    <span className="font-semibold text-slate-900 text-right">{product.governingLaw}</span>
                  </div>
                )}
                <div className="py-2.5 flex items-start justify-between gap-4">
                  <span className="text-slate-500 font-medium w-36 shrink-0">File Format</span>
                  <span className="font-semibold text-slate-900 text-right">{product.format}</span>
                </div>
                <div className="py-2.5 flex items-start justify-between gap-4">
                  <span className="text-slate-500 font-medium w-36 shrink-0">Document Scope</span>
                  <span className="font-semibold text-slate-900 text-right">{product.pagesOrFiles}</span>
                </div>
                <div className="py-2.5 flex items-start justify-between gap-4">
                  <span className="text-slate-500 font-medium w-36 shrink-0">Verified Authority</span>
                  <span className="font-semibold text-emerald-800 text-right">{product.authorOrVettedBy}</span>
                </div>
                <div className="py-2.5 flex items-start justify-between gap-4">
                  <span className="text-slate-500 font-medium w-36 shrink-0">Fiscal Year</span>
                  <span className="font-semibold text-slate-900 text-right">FY 2026–2027 (Statutory)</span>
                </div>
                <div className="py-2.5 flex items-start justify-between gap-4">
                  <span className="text-slate-500 font-medium w-36 shrink-0">Delivery Method</span>
                  <span className="font-semibold text-slate-900 text-right">Immediate Email + Screen Link</span>
                </div>
                {product.brochureUrl && (
                  <div className="py-2.5 flex items-start justify-between gap-4">
                    <span className="text-slate-500 font-medium w-36 shrink-0">
                      {isGatedInternalLink ? 'Protected App Link' : 'Official Brochure'}
                    </span>
                    {!isLinkUnlocked ? (
                      <button
                        type="button"
                        onClick={() => {
                          setGatedAlert("Access Restricted: You must complete the shop purchase process for this item before you can enter and use this internal application tool/link.");
                          handleBuyNow();
                        }}
                        className="inline-flex items-center gap-1.5 font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg border border-amber-300 text-xs transition-colors cursor-pointer shadow-2xs"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-700" />
                        <span>Locked • Requires Purchase</span>
                      </button>
                    ) : (
                      product.brochureUrl.startsWith('/') ? (
                        <Link
                          to={product.brochureUrl}
                          className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-900 hover:underline"
                        >
                          <FileDown className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{isGatedInternalLink ? 'Enter Unlocked Link' : 'Download Brochure'}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </Link>
                      ) : (
                        <a
                          href={product.brochureUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-900 hover:underline"
                        >
                          <FileDown className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{isGatedInternalLink ? 'Enter Unlocked Link' : 'Download Brochure'}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* Gated Access Alert Banner */}
              {gatedAlert && (
                <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-300 text-xs text-amber-900 flex items-start gap-2 shadow-sm animate-in fade-in duration-200">
                  <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">
                    <p className="font-bold">{gatedAlert}</p>
                    <p className="text-[11px] text-amber-800 mt-0.5">Please proceed to checkout below to unlock full access.</p>
                  </div>
                </div>
              )}

              {/* Action Card for Brochure / Protected Link */}
              {product.brochureUrl && (
                !isLinkUnlocked ? (
                  /* GATED / LOCKED STATE */
                  <div className="mt-3 p-3.5 bg-gradient-to-r from-amber-50/90 via-amber-50/50 to-white rounded-xl border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Lock className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                          <span>Internal App Tool Protected</span>
                          <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 border border-amber-300">
                            Checkout Required
                          </span>
                        </p>
                        <p className="text-[11px] text-amber-800 leading-snug">
                          Without completing the shop process, users cannot enter or use this internal link.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleBuyNow}
                        className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Unlock via Shop (৳{product.price.toLocaleString()})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (product) simulateInstantPurchase(product);
                        }}
                        title="Simulate instant purchase for live verification"
                        className="px-2.5 py-2 bg-white hover:bg-slate-100 text-slate-600 text-[10px] font-semibold rounded-xl border border-slate-200 cursor-pointer"
                      >
                        <span>Demo Unlock</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* UNLOCKED STATE */
                  <div className="mt-3 p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50/50 rounded-xl border border-emerald-200/80 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                          <span>{isGatedInternalLink ? 'Internal App Resource Unlocked' : 'Official Catalog Brochure Available'}</span>
                          <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Verified Access
                          </span>
                        </p>
                        <p className="text-[11px] text-emerald-700">Detailed specifications, terms and interactive access ready</p>
                      </div>
                    </div>
                    {product.brochureUrl.startsWith('/') ? (
                      <Link
                        to={product.brochureUrl}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all inline-flex items-center gap-1.5 shadow-sm shrink-0"
                      >
                        <span>Enter &amp; Use Link</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <a
                        href={product.brochureUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all inline-flex items-center gap-1.5 shadow-sm shrink-0"
                      >
                        <span>Enter &amp; Use Link</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )
              )}
            </div>

            {/* 3. Document Excerpt Preview */}
            {product.samplePreviewSnippet && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                      Document Excerpt
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopySnippet}
                    className="text-xs font-semibold text-slate-600 hover:text-emerald-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isSnippetCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy Sample</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 font-mono leading-relaxed max-h-40 overflow-y-auto">
                  "{product.samplePreviewSnippet}"
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  * Complete download includes editable clauses, definitions, execution schedules, and practitioner guidelines.
                </p>
              </div>
            )}

            {/* 4. Trust & Assurance Card (Executive Navy-Gold Institutional Card) */}
            <div className="bg-gradient-to-br from-slate-950 via-[#0b162c] to-[#071120] text-white rounded-2xl p-5 sm:p-6 border border-amber-400/25 shadow-md space-y-3 relative overflow-hidden">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-400/10 blur-xl" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/15 text-amber-400 flex items-center justify-center shrink-0 border border-amber-400/30 shadow-xs">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Institutional Assurance</span>
                  </div>
                  <div className="text-sm font-bold text-white tracking-tight">Chamber-Certified Legal Standards</div>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed relative z-10">
                Every contract clause, tax calculation schedule, and corporate resolution has been vetted by practicing Supreme Court Advocates and Chartered Accountants under Bangladesh statutory jurisdiction.
              </p>
              <div className="pt-2 flex items-center gap-4 text-[11px] text-slate-300 font-medium border-t border-slate-800/80 relative z-10">
                <span className="flex items-center gap-1.5 text-amber-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Applicable FY 2026–27</span>
                </span>
                <span className="flex items-center gap-1.5 text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Non-Judicial Stamp Ready</span>
                </span>
              </div>
            </div>

          </div>


          {/* RIGHT COLUMN: Product Hero, Clear Pricing Block, Unified CTA, Content Tabs (60% width = 7 cols) */}
          <div className="lg:col-span-7 space-y-5">

            {/* 1. Primary Product Information & Purchase Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
              
              {/* Category, Type & Rating Line */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-500 font-medium">
                  <span className="text-emerald-700 font-bold uppercase tracking-wider text-[11px]">
                    {product.category}
                  </span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="text-slate-500">{productType}</span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="text-slate-500">Updated 2026</span>
                </div>

                {/* Rating display */}
                <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/80">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-slate-900">{product.rating}</span>
                  <span className="text-slate-500 font-medium">({product.reviewsCount} reviews)</span>
                </div>
              </div>

              {/* Product Title & Description */}
              <div className="space-y-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug">
                  {product.title}
                </h1>
                <p className="text-slate-600 text-sm sm:text-[15px] leading-relaxed">
                  {product.shortDescription}
                </p>
              </div>

              {/* Unified Executive Pricing & Instant Checkout Block */}
              <div className="relative overflow-hidden rounded-2xl border border-amber-400/30 bg-gradient-to-br from-slate-950 via-[#0b162c] to-[#071120] p-6 text-white shadow-xl">
                <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-amber-400/10 blur-2xl" />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-400">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Commercial License · Statutory Valid FY 2026–27</span>
                    </div>
                    <div className="flex items-baseline gap-3 mt-2">
                      <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
                        BDT {product.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      {product.originalPrice > product.price && (
                        <span className="text-base line-through text-slate-400 font-medium">
                          BDT {product.originalPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                      {discountPercent > 0 && (
                        <span className="text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 px-2.5 py-0.5 rounded-full shadow-2xs">
                          Save {discountPercent}%
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-300 mt-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Immediate download + email delivery with free statutory amendments</span>
                    </div>
                  </div>

                  {/* Quantity selector (only shown if not already purchased/pending) */}
                  {!hasPurchased && !hasPendingOrder && (
                    <div className="flex items-center gap-2.5 sm:self-center bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                      <span className="text-xs font-semibold text-slate-300">Qty:</span>
                      <div className="flex items-center border border-slate-700 rounded-lg bg-slate-950 overflow-hidden shadow-2xs">
                        <button
                          type="button"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 font-bold text-sm transition-colors cursor-pointer"
                          title="Decrease quantity"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="w-9 text-center font-bold text-xs text-amber-300 font-mono">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 font-bold text-sm transition-colors cursor-pointer"
                          title="Increase quantity"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Dynamic Purchase Actions based on User Purchase Verification */}
                <ProductPurchaseActions
                  product={product}
                  isAdded={isAdded}
                  onAddToCart={() => handleAddToCart()}
                  onBuyNow={() => handlePayNow()}
                  variant="detail"
                  onViewProductClick={() => {
                    const redirectUrl = product.coursePath || product.brochureUrl || '/client-portal';
                    if (redirectUrl.startsWith('http')) {
                      window.open(redirectUrl, '_blank', 'noopener,noreferrer');
                    } else {
                      navigate(redirectUrl);
                    }
                  }}
                />

                {/* Trust Assurances Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 mt-4 border-t border-slate-800/80 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Instant Delivery</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>bKash / Nagad / Cards</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Editable .docx / .xlsx</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Advocate Vetted</span>
                  </div>
                </div>
              </div>

              {/* Unlocked Product Vault (Shown only when user has verified purchase) */}
              {hasPurchased && (
                <div
                  id="product-access-vault"
                  className="rounded-2xl border-2 border-emerald-400 bg-gradient-to-r from-emerald-50 via-teal-50/60 to-white p-5 sm:p-6 shadow-md space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-black text-slate-900">
                            Purchased Product Unlocked
                          </h3>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Active Access
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Order Ref:{' '}
                          <strong className="font-mono text-slate-800">
                            {activePurchaseRecord?.orderId || 'VERIFIED'}
                          </strong>{' '}
                          • Format: {product.format} ({product.pagesOrFiles})
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDownloadAndRedirect(product)}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                        title={`Download verified kit and redirect to ${product.coursePath || product.brochureUrl || 'Client Portal'}`}
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>
                          {product.coursePath
                            ? 'Download & Enter Course'
                            : product.brochureUrl
                            ? 'Download & Open Resource'
                            : 'Download & Go to Portal'}
                        </span>
                      </button>
                      {activePurchaseRecord && (
                        <button
                          type="button"
                          onClick={() => downloadReceipt(activePurchaseRecord)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Receipt</span>
                        </button>
                      )}
                      <Link
                        to="/client-portal"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all"
                      >
                        <span>Go to Dashboard</span>
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Academy Course Hub & Syllabus Navigation Card */}
              {(product.category === 'Academy Courses' || product.coursePath) && (
                <div className="rounded-2xl border border-emerald-300/80 bg-gradient-to-r from-emerald-50 via-teal-50 to-white p-4 sm:p-5 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <span>Academy Certified Program Track</span>
                          <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900 border border-emerald-300">
                            Verified Certification
                          </span>
                        </h3>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {product.cohortSchedule || 'Sequential video lectures, statutory notes, module quizzes, and LMS examination.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {product.coursePath && (
                        <Link
                          to={product.coursePath}
                          className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Full Syllabus</span>
                        </Link>
                      )}
                      <Link
                        to="/student/dashboard"
                        className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
                      >
                        <MonitorPlay className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Student Portal</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

            </div>


            {/* 2. Detailed Content Tabs (Overview, Features, Compliance) */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              
              {/* Segmented Tab Navigation matching /contact & /shop */}
              <div className="p-2 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'overview'
                        ? 'bg-slate-950 text-amber-300 shadow-sm border border-amber-400/30'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`}
                  >
                    <span>Overview & Legal Context</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('features')}
                    className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'features'
                        ? 'bg-slate-950 text-amber-300 shadow-sm border border-amber-400/30'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`}
                  >
                    <span>Features</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      activeTab === 'features' ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {product.features.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('compliance')}
                    className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'compliance'
                        ? 'bg-slate-950 text-amber-300 shadow-sm border border-amber-400/30'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`}
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Compliance & Stamp Duty</span>
                  </button>
                </div>
              </div>

              {/* Tab Content Panels with comfortable spacing and readable line-height */}
              <div className="p-6 sm:p-8">
                
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-2.5">
                        About This Legal & Business Toolkit
                      </h2>
                      <p className="text-sm sm:text-[15px] text-slate-600 leading-relaxed whitespace-pre-line">
                        {product.fullDescription}
                      </p>
                    </div>

                    {/* Author & Review Panel Card */}
                    <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900">
                        <Award className="w-4 h-4 text-emerald-600" />
                        <span>Author & Review Panel</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Authored and vetted by <strong className="text-slate-900">{product.authorOrVettedBy}</strong> in collaboration with Accounticca Senior Advisory and E-Lawyers Chambers.
                      </p>
                    </div>

                    {/* Who Is This Product Designed For? */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Who is this product designed for?
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700">
                        <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <span>Startup Founders & Co-Founders in Bangladesh</span>
                        </div>
                        <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <span>Corporate CFOs, Accountants & Tax Planners</span>
                        </div>
                        <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <span>Company Secretaries & In-House Legal Officers</span>
                        </div>
                        <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <span>Freelancers, Consultancies & SME Business Owners</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'features' && (
                  <div className="space-y-4">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
                      Included Document Features
                    </h2>
                    <p className="text-xs text-slate-500 mb-4">
                      Every element is pre-drafted and verified for immediate execution.
                    </p>
                    <div className="space-y-2.5">
                      {product.features.map((feature, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
                        >
                          <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                            {idx + 1}
                          </div>
                          <span className="text-xs font-medium text-slate-800 leading-relaxed">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'compliance' && (
                  <div className="space-y-5 text-xs text-slate-600 leading-relaxed">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      Bangladesh Jurisdiction & Execution Guidance
                    </h2>
                    
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Scale className="w-4 h-4 text-emerald-600" />
                        <span>Stamp Duty & Execution Under Bangladesh Law</span>
                      </h3>
                      <p>
                        Agreements executed in Bangladesh are subject to the Stamp Act, 1899. For agreements (NDAs, Service Agreements, Leases), execution on non-judicial stamp paper of appropriate denomination (typically BDT 300 or as prescribed by latest Finance Act) makes them admissible evidence in a court of law.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Arbitration & Dispute Resolution</span>
                      </h3>
                      <p>
                        All draft dispute clauses provide for amicable negotiation followed by institutional arbitration in Dhaka under the Arbitration Act, 2001, saving significant legal expenditure and delays.
                      </p>
                    </div>

                    <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 text-amber-900 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-amber-700" />
                        <span>Need Custom Tailoring or Negotiation Assistance?</span>
                      </div>
                      <p className="text-[11px] text-amber-800">
                        If your contract involves foreign entities, cross-border remittance, or high-value investment, book a 1-on-1 consultation session with our Supreme Court counsel.
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* 3. Need Customization Chamber Banner */}
            <div className="bg-gradient-to-br from-slate-950 via-[#0b162c] to-[#071120] text-white rounded-2xl p-6 sm:p-7 border border-amber-400/25 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
              <div className="pointer-events-none absolute -right-10 -bottom-10 h-36 w-36 rounded-full bg-amber-400/10 blur-2xl" />
              <div className="space-y-1 text-center sm:text-left relative z-10">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-400">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Custom Legal Advisory</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Need custom clauses, tailoring, or negotiation counsel?
                </div>
                <p className="text-xs text-slate-300 max-w-md leading-relaxed">
                  Our Supreme Court chamber can review counterparty redlines, adapt covenants, or draft bespoke advisory agreements for your company.
                </p>
              </div>

              <Link
                to="/contact"
                className="relative z-10 px-5 py-3 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md hover:shadow-amber-500/20 whitespace-nowrap inline-flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <span>Consult An Advocate</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>

        </div>


        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 pt-10 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Recommended Add-Ons</span>
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-950 tracking-tight mt-1">
                  Related Compliance Kits &amp; Toolkits
                </h2>
              </div>
              <Link
                to="/tools"
                className="text-xs font-bold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1 hover:underline"
              >
                <span>View All Tools</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {relatedProducts.map((rel) => (
                <div
                  key={rel.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-amber-400/50 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                >
                  <div className="aspect-16/9 bg-slate-100 overflow-hidden relative">
                    <img
                      src={rel.imageUrl || '/logo.png'}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-950/90 text-amber-300 border border-amber-400/30">
                      {rel.category}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center gap-1 text-amber-600 text-xs mb-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-slate-900">{rel.rating}</span>
                      </div>
                      <Link to={`/shop/${rel.slug}`}>
                        <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-2">
                          {rel.title}
                        </h3>
                      </Link>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {rel.shortDescription}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-base text-slate-900 font-mono">
                          BDT {rel.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <Link
                          to={`/shop/${rel.slug}`}
                          className="text-xs font-semibold text-slate-600 hover:text-emerald-800 inline-flex items-center gap-1"
                        >
                          <span>Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      <ProductPurchaseActions
                        product={rel}
                        onAddToCart={(_, prod) => addToCart(prod, 1)}
                        onBuyNow={(_, prod) => navigate(`/checkout?product=${encodeURIComponent(prod.slug)}`)}
                        variant="card"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* Floating Cart Trigger Button (When Cart Has Items) */}
      {totalItemsCount > 0 && (
        <div className="fixed bottom-6 left-6 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2.5 px-4 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-lg hover:scale-105 transition-all duration-200 border border-emerald-500/40 cursor-pointer"
            title="Open Shopping Cart"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4 text-white" />
              <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-950 font-black text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {totalItemsCount}
              </span>
            </div>
            <div className="text-left font-bold text-xs">
              <div>View Cart</div>
            </div>
          </button>
        </div>
      )}

    </div>
  );
}

export default ProductDetail;
