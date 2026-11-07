import React, { useState } from 'react';
import { ExternalLink, Maximize2 } from 'lucide-react';
import { LightboxModal, LightboxImageItem } from './gallery/LightboxModal';

interface GalleryItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}

interface GalleryProps {
  title?: string;
  description?: string;
  items: GalleryItem[];
}

export function Gallery({ 
  title = "Visual Guides & Infographics", 
  description = "Browse visual aids, process flowcharts, and infographics related to tax circulars and compliance.", 
  items 
}: GalleryProps) {
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);

  if (!items || items.length === 0) return null;

  const lightboxImages: LightboxImageItem[] = items.map((item) => ({
    id: item.id,
    url: item.imageUrl,
    title: item.title,
    description: item.description,
    caption: item.title
  }));

  return (
    <div className="mb-16">
      <div className="flex flex-col mb-8">
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        {description && <p className="text-slate-600 mt-2">{description}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, idx) => (
          <div 
            key={item.id} 
            onClick={() => setActiveLightboxIndex(idx)}
            className="group relative bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveLightboxIndex(idx);
              }
            }}
            aria-label={`Open ${item.title} in full-screen zoomable lightbox`}
          >
            <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 relative">
              <img 
                src={item.imageUrl} 
                alt={item.title} 
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors duration-300 flex items-center justify-center">
                <div 
                  className="w-12 h-12 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-900 opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 hover:bg-emerald-500 hover:text-white shadow-xl"
                  title="Expand Full-screen Lightbox"
                >
                  <Maximize2 className="w-5 h-5" />
                </div>
              </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-emerald-700 transition-colors line-clamp-1">
                {item.title}
              </h3>
              <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal with Full-Screen Zoom and Navigation */}
      <LightboxModal
        images={lightboxImages}
        initialIndex={activeLightboxIndex ?? 0}
        isOpen={activeLightboxIndex !== null}
        onClose={() => setActiveLightboxIndex(null)}
      />
    </div>
  );
}
