import { useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useImageLoader } from '../hooks/useImageLoader';

interface CarouselImage {
  src: string;
  alt: string;
}

interface ImageCarouselProps {
  images: CarouselImage[];
}

function CarouselImageItem({ src, alt }: { src: string, alt: string }) {
  const { isLoaded, hasError } = useImageLoader(src);
  return (
    <>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 animate-pulse">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
        </div>
      )}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400">
          <ImageOff className="w-8 h-8 mb-2 text-slate-300" />
          <span className="text-sm">Failed to load image</span>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-contain absolute inset-0 transition-opacity duration-300 ${isLoaded && !hasError ? 'opacity-100' : 'opacity-0'}`}
      />
    </>
  );
}

export function ImageCarousel({ images }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!images || images.length === 0) return null;

  return (
    <div className="my-10 relative group rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 max-w-[70%] mx-auto">
      <div className="aspect-[16/9] w-full relative overflow-hidden flex items-center justify-center bg-slate-100">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 w-full h-full"
          >
            <CarouselImageItem src={images[currentIndex].src} alt={images[currentIndex].alt} />
          </motion.div>
        </AnimatePresence>

        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-700 shadow-md hover:bg-white hover:text-emerald-600 transition-all opacity-0 group-hover:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-700 shadow-md hover:bg-white hover:text-emerald-600 transition-all opacity-0 group-hover:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>
      
      {images[currentIndex].alt && (
        <div className="bg-white p-4 border-t border-slate-200 text-center">
          <p className="text-sm font-medium text-slate-600">
            {images[currentIndex].alt}
          </p>
          <div className="flex justify-center gap-1.5 mt-3">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentIndex ? 'bg-emerald-500 w-4' : 'bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
