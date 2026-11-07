import React, { useState } from 'react';
import { 
  Building2, 
  Scale, 
  FileText, 
  Maximize2, 
  X, 
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  Award,
  Layers,
  Calendar,
  Clock,
  UserCheck
} from 'lucide-react';
import { Article } from '../types';

export interface BlogCoverProps {
  article: Article;
  className?: string;
  showCaption?: boolean;
}

// Curated high-resolution professional image sets by category
const CATEGORY_DEFAULT_IMAGES: Record<string, { url: string; credit: string; label: string }> = {
  tax: {
    url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=1600',
    credit: 'National Board of Revenue (NBR) & Tax Advisory Operations',
    label: 'Taxation & Fiscal Governance'
  },
  legal: {
    url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=1600',
    credit: 'Supreme Court & Corporate Legal Compliance Practice',
    label: 'Corporate Law & RJSC Compliance'
  },
  business: {
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1600',
    credit: 'Dhaka Financial District & Enterprise Commercial Strategy',
    label: 'Strategic Advisory & Operations'
  },
  accounting: {
    url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1600',
    credit: 'Financial Modeling, Audit & Fractional CFO Intelligence',
    label: 'Fractional CFO & Accounting'
  }
};

const CATEGORY_THEMES: Record<string, { bg: string; badge: string; icon: React.ElementType; label: string }> = {
  tax: {
    bg: 'from-slate-950 via-slate-900 to-emerald-950',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    icon: Building2,
    label: 'Taxation & Fiscal Governance'
  },
  legal: {
    bg: 'from-slate-950 via-slate-900 to-sky-950',
    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    icon: Scale,
    label: 'Corporate Law & RJSC'
  },
  business: {
    bg: 'from-slate-900 via-slate-800 to-indigo-950',
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    icon: TrendingUp,
    label: 'Strategic Advisory & Operations'
  },
  accounting: {
    bg: 'from-slate-900 via-slate-800 to-cyan-950',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    icon: Layers,
    label: 'Fractional CFO & Accounting'
  }
};

export function BlogCover({ article, className = '', showCaption = true }: BlogCoverProps) {
  const [imageError, setImageError] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const categoryMeta = CATEGORY_DEFAULT_IMAGES[article.categoryId] || {
    url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=1600',
    credit: 'Accounticca & E-Lawyers Compliance Hub Editorial',
    label: article.category
  };

  const theme = CATEGORY_THEMES[article.categoryId] || {
    bg: 'from-slate-900 via-slate-800 to-slate-950',
    badge: 'bg-slate-700/40 text-slate-300 border-slate-600/50',
    icon: FileText,
    label: article.category
  };

  const CategoryIcon = theme.icon;

  const handleImageError = () => {
    // If remote ibb or r2 fails or is blocked, try local cached asset
    if (article.imageUrl?.includes('r2.dev') || article.id.includes('trade-license')) {
      const img = document.querySelector('#blog-cover-container img') as HTMLImageElement;
      if (img && !img.src.includes('trade-license-cover.png')) {
        img.src = '/trade-license-cover.png';
        return;
      }
    }
    if (article.imageUrl?.includes('ibb.co')) {
      const img = document.querySelector('#blog-cover-container img') as HTMLImageElement;
      if (img && !img.src.includes('salary-tds-cover.png')) {
        img.src = '/salary-tds-cover.png';
        return;
      }
    }
    setImageError(true);
  };

  // Determine active image: article's specific imageUrl if present, else fallback to high-res category-specific image
  const activeImageUrl = (!imageError && article.imageUrl) 
    ? article.imageUrl 
    : (!imageError ? categoryMeta.url : null);

  const activeCaption = article.imageUrl 
    ? `Curated editorial asset for ${article.category}` 
    : categoryMeta.credit;

  return (
    <div id="blog-cover-container" className={`my-8 ${className}`}>
      {/* Standardized 16:9 Visual Frame */}
      <div className="relative group overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-950 shadow-md transition-shadow duration-300 hover:shadow-xl">
        {activeImageUrl ? (
          <div className="relative w-full aspect-[16/9] max-h-[460px] overflow-hidden bg-slate-950">
            <img
              src={activeImageUrl}
              alt={article.title}
              onError={handleImageError}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            
            {/* Editorial Multi-Stop Gradient Overlay for Depth and Contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-black/20" />

            {/* Top-Right Badge: Category & Joint Identity */}
            <div className="absolute top-4 sm:top-6 inset-x-4 sm:inset-x-6 flex items-center justify-between gap-3 pointer-events-none">
              <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-white text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Accounticca × E-Lawyers</span>
                <span className="sm:hidden">Compliance Hub</span>
              </div>

              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md shadow-sm ${theme.badge}`}>
                <CategoryIcon className="w-3.5 h-3.5" />
                <span>{theme.label}</span>
              </span>
            </div>

            {/* Bottom Floating Title Overlay */}
            <div className="absolute bottom-0 inset-x-0 p-5 sm:p-7 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 text-xs text-slate-300 mb-2">
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    {article.author.name}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {article.readTime} min read
                  </span>
                </div>
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-white line-clamp-2 leading-snug">
                  {article.title}
                </h2>
              </div>

              {/* Fullscreen Lightbox Trigger Button */}
              <button
                type="button"
                onClick={() => setIsZoomOpen(true)}
                className="self-end sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/30 backdrop-blur-md text-white text-xs font-medium border border-white/20 transition-all cursor-pointer shadow-sm hover:scale-105"
                title="Expand cover image to full resolution"
                aria-label="Expand image"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Expand View</span>
              </button>
            </div>
          </div>
        ) : (
          /* High-Fidelity Branded Vector Graphic Fallback */
          <div className={`w-full aspect-[16/9] min-h-[300px] sm:min-h-[380px] bg-gradient-to-br ${theme.bg} flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden text-white select-none`}>
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

            <div className="flex items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-200">
                  Accounticca × E-Lawyers
                </span>
              </div>

              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md ${theme.badge}`}>
                <CategoryIcon className="w-3.5 h-3.5" />
                <span>{theme.label}</span>
              </span>
            </div>

            <div className="my-auto py-4 max-w-3xl relative z-10">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-tight mb-3">
                {article.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
                {article.excerpt}
              </p>
            </div>

            <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/10 relative z-10 text-xs text-slate-300">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-white">{article.author.name}</span>
                <span className="text-slate-500">•</span>
                <span>{article.readTime} min read</span>
              </div>

              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <Award className="w-3.5 h-3.5" />
                <span>Verified Regulatory Insight</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Editorial Caption Tag & Attribution */}
      {showCaption && (
        <div className="flex items-center justify-between text-xs text-slate-500 mt-2.5 px-2">
          <span className="truncate max-w-[70%]">{activeCaption}</span>
          <span className="text-slate-400 font-medium">{categoryMeta.label}</span>
        </div>
      )}

      {/* Lightbox Zoom Modal */}
      {isZoomOpen && activeImageUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsZoomOpen(false)}
        >
          <div 
            className="relative max-w-5xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 text-white">
              <div className="flex items-center gap-2.5 pr-4 truncate">
                <CategoryIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-sm font-semibold truncate">{article.title}</span>
              </div>
              <button
                onClick={() => setIsZoomOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close image preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 sm:p-6 max-h-[80vh] flex items-center justify-center overflow-auto bg-black/40">
              <img
                src={activeImageUrl}
                alt={article.title}
                referrerPolicy="no-referrer"
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-2xl shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
