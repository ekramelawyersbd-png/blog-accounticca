import React, { useState } from 'react';
import { useImageLoader } from '../hooks/useImageLoader';
import { ImageOff, Loader2 } from 'lucide-react';

export function MarkdownImage(props: any) {
  const { node, ...rest } = props;
  const [src, setSrc] = useState(rest.src);
  const { isLoaded, hasError } = useImageLoader(src);

  const handleImageError = () => {
    if (src?.includes('e6775d1b') || src?.includes('trade-license-process')) {
      if (src !== '/trade-license-process.png') {
        setSrc('/trade-license-process.png');
        return;
      }
    }
    if (src?.includes('e0d2e605') || src?.includes('trade-license-sample')) {
      if (src !== '/trade-license-sample.png') {
        setSrc('/trade-license-sample.png');
        return;
      }
    }
    if (src?.includes('539d4a08-aa90-415a-bff1-8dafc712294c') || src?.includes('trade-license-infographic')) {
      if (src !== '/trade-license-infographic.png') {
        setSrc('/trade-license-infographic.png');
        return;
      }
    }
  };
  
  if (!src || !src.trim()) {
    return null;
  }
  
  return (
    <span className="my-8 flex flex-col items-center max-w-full sm:max-w-[95%] lg:max-w-4xl mx-auto w-full relative block">
      {!isLoaded && !hasError && (
        <span className="w-full aspect-[16/9] bg-slate-100 flex items-center justify-center rounded-2xl border border-slate-200 animate-pulse">
           <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
        </span>
      )}
      {hasError && (
        <span className="w-full aspect-[16/9] bg-slate-50 flex flex-col items-center justify-center text-slate-400 rounded-2xl border border-slate-200">
          <ImageOff className="w-8 h-8 mb-2 text-slate-300" />
          <span className="text-sm">Image could not be loaded</span>
        </span>
      )}
      {src && (
        <img 
          {...rest} 
          src={src}
          onError={handleImageError}
          className={`rounded-2xl border border-slate-200/90 shadow-md object-contain w-full bg-white transition-opacity duration-300 ${
            isLoaded && !hasError ? 'opacity-100' : 'hidden'
          }`} 
        />
      )}
      {rest.alt && isLoaded && !hasError && (
        <span className="text-center text-xs sm:text-sm text-slate-500 mt-3 font-medium block">
          {rest.alt}
        </span>
      )}
    </span>
  );
}
