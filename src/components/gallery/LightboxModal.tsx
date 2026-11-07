import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize, 
  Minimize, 
  ShoppingBag, 
  ExternalLink,
  Check,
  Tag,
  Sparkles
} from 'lucide-react';

export interface LightboxImageItem {
  id?: string;
  url: string;
  title?: string;
  description?: string;
  caption?: string;
  category?: string;
  badge?: string;
  price?: number;
  format?: string;
  slug?: string;
}

export interface LightboxModalProps {
  images: LightboxImageItem[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (item: LightboxImageItem) => void;
  isAdded?: boolean;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  images,
  initialIndex,
  isOpen,
  onClose,
  onAddToCart,
  isAdded = false
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(true);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  // Sync initial index
  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, [initialIndex, isOpen]);

  // Reset zoom & pan when image changes
  const handleIndexChange = useCallback((newIndex: number) => {
    setCurrentIndex(newIndex);
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    const nextIdx = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    handleIndexChange(nextIdx);
  }, [currentIndex, images.length, handleIndexChange]);

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    const nextIdx = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    handleIndexChange(nextIdx);
  }, [currentIndex, images.length, handleIndexChange]);

  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3.5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) {
        setPanOffset({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleDoubleTap = () => {
    if (zoomLevel > 1) {
      handleResetZoom();
    } else {
      setZoomLevel(2);
    }
  };

  // Fullscreen API toggle
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch (err) {
      console.warn('[Lightbox] Fullscreen toggle error:', err);
      // Fallback toggle state
      setIsFullscreen(prev => !prev);
    }
  };

  // Track native fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (zoomLevel > 1) {
          handleResetZoom();
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        handleResetZoom();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, zoomLevel, handlePrev, handleNext, onClose]);

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    if (thumbnailsRef.current) {
      const activeEl = thumbnailsRef.current.children[currentIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentIndex]);

  // Drag / Pan handlers when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    const maxPan = (zoomLevel - 1) * 250;
    const newX = Math.max(-maxPan, Math.min(maxPan, e.clientX - dragStart.x));
    const newY = Math.max(-maxPan, Math.min(maxPan, e.clientY - dragStart.y));
    setPanOffset({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Swipe for mobile navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && zoomLevel === 1) {
      setTouchStartX(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || zoomLevel > 1) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handlePrev();
      } else {
        handleNext();
      }
    }
    setTouchStartX(null);
  };

  if (!isOpen || images.length === 0) {
    return null;
  }

  const currentImage = images[currentIndex] || images[0];

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-xl text-white select-none transition-all duration-300 ${
        isFullscreen ? 'p-0' : 'p-2 sm:p-4'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={currentImage.title || 'Image Lightbox Preview'}
      onMouseUp={handleMouseUp}
    >
      {/* Top Controls Toolbar */}
      <div className="relative z-30 flex items-center justify-between px-3 py-2.5 sm:px-6 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-lg shrink-0">
        
        {/* Left: Index Counter & Image Info */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-amber-300 shrink-0">
            {currentIndex + 1} / {images.length}
          </div>

          {currentImage.title && (
            <h3 className="text-xs sm:text-sm font-bold text-white truncate max-w-[180px] sm:max-w-md hidden xs:block">
              {currentImage.title}
            </h3>
          )}

          {currentImage.category && (
            <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-slate-950">
              {currentImage.category}
            </span>
          )}
        </div>

        {/* Center: Zoom Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 1}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="Zoom Out (-)"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="px-2 text-[11px] font-mono font-bold text-amber-300 min-w-[42px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 3.5}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="Zoom In (+)"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {zoomLevel > 1 && (
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer ml-0.5"
              title="Reset Zoom (0)"
              aria-label="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right: Fullscreen & Close */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700 shadow-xs"
            title={isFullscreen ? 'Exit Full-screen (F)' : 'Full-screen Mode (F)'}
            aria-label="Toggle Full-screen Mode"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white transition-colors cursor-pointer border border-rose-500 shadow-xs"
            title="Close Lightbox (Esc)"
            aria-label="Close Lightbox"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div 
        className="relative flex-1 flex items-center justify-center overflow-hidden my-2 sm:my-3 cursor-default"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleTap}
      >
        {/* Previous Image Arrow */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 sm:left-6 z-30 w-11 h-11 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center border border-slate-700 shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
            aria-label="Previous Image (Left Arrow)"
            title="Previous (Left Arrow)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Next Image Arrow */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 sm:right-6 z-30 w-11 h-11 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center border border-slate-700 shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
            aria-label="Next Image (Right Arrow)"
            title="Next (Right Arrow)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Display Image with Smooth Zoom & Drag Transform */}
        <div 
          className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-100 ease-out"
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
            cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in'
          }}
        >
          <img
            ref={imageRef}
            src={currentImage.url}
            alt={currentImage.title || currentImage.caption || `Image ${currentIndex + 1}`}
            className="max-h-[68vh] sm:max-h-[76vh] max-w-[92vw] sm:max-w-[85vw] object-contain rounded-2xl shadow-2xl drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] pointer-events-auto"
            draggable={false}
          />
        </div>

        {/* Quick Double Click Zoom Hint Pill */}
        {zoomLevel === 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none opacity-60 hover:opacity-100 transition-opacity">
            <span className="text-[10px] font-semibold tracking-wider text-slate-300 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800 backdrop-blur-xs">
              Double-click image to zoom 2x &bull; Drag to pan
            </span>
          </div>
        )}
      </div>

      {/* Bottom Info Bar & Thumbnail Filmstrip */}
      <div className="relative z-30 flex flex-col gap-2.5 px-3 py-2.5 sm:px-6 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-lg shrink-0">
        
        {/* Metadata Details & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {currentImage.badge && (
                <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                  {currentImage.badge}
                </span>
              )}
              {currentImage.format && (
                <span className="text-[11px] font-medium text-slate-400">
                  {currentImage.format}
                </span>
              )}
              {currentImage.price !== undefined && (
                <span className="text-xs font-black text-amber-400 font-mono">
                  {currentImage.price === 0 ? 'FREE DOWNLOAD' : `Tk ${currentImage.price.toLocaleString()}`}
                </span>
              )}
            </div>

            <h4 className="text-sm sm:text-base font-bold text-white truncate">
              {currentImage.title || currentImage.caption || `Image ${currentIndex + 1}`}
            </h4>

            {currentImage.description && (
              <p className="text-xs text-slate-400 line-clamp-1 max-w-2xl">
                {currentImage.description}
              </p>
            )}
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 shrink-0">
            {currentImage.slug && (
              <Link
                to={`/shop/${currentImage.slug}`}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors shadow-xs"
              >
                <span>View Toolkit Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}

            {onAddToCart && currentImage.id && (
              <button
                type="button"
                onClick={() => onAddToCart(currentImage)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors border border-slate-700 shadow-xs cursor-pointer"
              >
                {isAdded ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Added!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowThumbnails(prev => !prev)}
              className="text-[11px] font-semibold text-slate-400 hover:text-white px-2 py-1 rounded-lg border border-slate-800 hover:bg-slate-800/80 transition-colors"
            >
              {showThumbnails ? 'Hide Strip' : 'Show Strip'}
            </button>
          </div>
        </div>

        {/* Thumbnail Filmstrip */}
        {showThumbnails && images.length > 1 && (
          <div 
            ref={thumbnailsRef}
            className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
          >
            {images.map((img, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleIndexChange(idx)}
                  className={`relative w-14 h-11 sm:w-16 sm:h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-400 ring-2 ring-amber-400/40 scale-105 shadow-md shadow-amber-400/20'
                      : 'border-slate-700/80 opacity-60 hover:opacity-100 hover:border-slate-500'
                  }`}
                  title={img.title || `Thumbnail ${idx + 1}`}
                  aria-label={`Jump to image ${idx + 1}`}
                >
                  <img
                    src={img.url}
                    alt={img.title || `Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-amber-400/10 pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LightboxModal;
