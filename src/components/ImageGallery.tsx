import React, { useState } from 'react';
import { Image as ImageIcon, ImageOff, Loader2, Maximize2 } from 'lucide-react';
import { LightboxModal, LightboxImageItem } from './gallery/LightboxModal';

export interface GalleryImage {
  url: string;
  alt?: string;
  caption?: string;
}

interface ImageGalleryProps {
  images: (string | GalleryImage)[];
  layout?: 'grid' | 'banner';
  className?: string;
}

function GalleryItem({ 
  img, 
  layout, 
  index, 
  onClick 
}: { 
  img: GalleryImage; 
  layout: 'grid' | 'banner'; 
  index?: number;
  onClick?: () => void;
}) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  const aspectClass = layout === 'banner' ? 'aspect-[21/9] sm:aspect-[3/1]' : 'aspect-[4/3]';
  const figureClass = layout === 'banner' 
    ? 'w-full overflow-hidden rounded-3xl my-10 border border-slate-200 shadow-sm relative group bg-slate-50 cursor-pointer'
    : 'group relative overflow-hidden rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-emerald-300 transition-all duration-300 bg-slate-50 cursor-pointer';

  return (
    <figure 
      className={`${figureClass} ${aspectClass} flex items-center justify-center`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label={`View ${img.caption || img.alt || 'image'} in full-screen zoomable lightbox`}
    >
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-100 z-0">
          <Loader2 className="w-8 h-8 animate-spin mb-2" />
          <span className="text-xs font-medium uppercase tracking-wider">Loading</span>
        </div>
      )}
      
      {status === 'error' ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-100/50 z-0 border border-slate-200/50 rounded-inherit">
          <ImageOff className="w-8 h-8 mb-2 opacity-50" />
          <span className="text-xs font-medium uppercase tracking-wider">Image Unavailable</span>
        </div>
      ) : (
        <>
          <img 
            src={img.url} 
            alt={img.alt || (layout === 'banner' ? 'Article visual banner' : `Gallery visual ${index ? index + 1 : ''}`)} 
            className={`w-full h-full object-cover transition-transform duration-700 z-10 relative ${layout === 'banner' ? 'group-hover:scale-105' : 'transform group-hover:scale-110'} ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
            referrerPolicy="no-referrer"
            loading="lazy"
            onLoad={() => setStatus('loaded')}
            onError={() => setStatus('error')}
          />
          {/* Subtle gradient overlay for text readability if caption exists */}
          {img.caption && status === 'loaded' && (
            <div className={`absolute inset-0 bg-gradient-to-t from-slate-900/${layout === 'banner' ? '60' : '80'} via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20`} />
          )}

          {/* Quick Zoom Indicator Overlay */}
          <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-25 pointer-events-none">
            <div className="w-10 h-10 rounded-full bg-slate-900/80 text-white flex items-center justify-center shadow-lg border border-white/20 transform scale-75 group-hover:scale-100 transition-transform">
              <Maximize2 className="w-5 h-5 text-amber-300" />
            </div>
          </div>
        </>
      )}

      {img.caption && status === 'loaded' && (
        <figcaption className={`absolute bottom-0 left-0 right-0 p-4 text-white z-30 transition-all duration-300 opacity-0 group-hover:opacity-100 ${layout === 'banner' ? 'text-center text-sm font-medium translate-y-full group-hover:translate-y-0' : 'text-xs font-semibold translate-y-4 group-hover:translate-y-0'}`}>
          {img.caption}
        </figcaption>
      )}
    </figure>
  );
}

export function ImageGallery({ images, layout = 'grid', className = '' }: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  // Normalize array elements into GalleryImage objects
  const normalizedImages: GalleryImage[] = images.map(img => 
    typeof img === 'string' ? { url: img } : img
  );

  const lightboxImages: LightboxImageItem[] = normalizedImages.map((img, idx) => ({
    url: img.url,
    title: img.caption || img.alt || `Gallery Image ${idx + 1}`,
    caption: img.caption,
    description: img.caption
  }));

  return (
    <>
      {layout === 'banner' ? (
        <div className={className}>
          <GalleryItem 
            img={normalizedImages[0]} 
            layout="banner" 
            onClick={() => setLightboxIndex(0)} 
          />
        </div>
      ) : (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 my-10 ${className}`}>
          {normalizedImages.map((img, idx) => (
            <GalleryItem 
              key={idx} 
              img={img} 
              layout="grid" 
              index={idx} 
              onClick={() => setLightboxIndex(idx)} 
            />
          ))}
        </div>
      )}

      {/* Lightbox Modal with Full-Screen Zoom and Navigation */}
      <LightboxModal
        images={lightboxImages}
        initialIndex={lightboxIndex ?? 0}
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
      />
    </>
  );
}
