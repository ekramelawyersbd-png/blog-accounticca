import { useState, useEffect } from 'react';

export function useImageLoader(src: string | undefined) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src) {
      setHasError(true);
      return;
    }

    let isMounted = true;
    setIsLoaded(false);
    setHasError(false);

    const img = new window.Image();
    img.src = src;

    img.onload = () => {
      if (isMounted) setIsLoaded(true);
    };

    img.onerror = () => {
      if (isMounted) {
        setHasError(true);
        setIsLoaded(true);
      }
    };

    return () => {
      isMounted = false;
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { isLoaded, hasError };
}
