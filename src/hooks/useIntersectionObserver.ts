import { useState, useEffect, useRef, RefObject } from 'react';

export interface UseIntersectionObserverOptions {
  root?: Element | Document | null;
  rootMargin?: string;
  threshold?: number | number[];
  freezeOnceVisible?: boolean;
  enabled?: boolean;
}

/**
 * Custom React hook that observes an element's visibility within the viewport
 * using the browser's native IntersectionObserver API.
 *
 * Designed for lazy loading images, infinite scroll, and deferred asset loading
 * to minimize initial page weight and network overhead.
 *
 * @param options Observer configuration options
 * @returns [ref, isIntersecting] Tuple with ref to attach to DOM element and visibility boolean
 */
export function useIntersectionObserver<T extends HTMLElement = HTMLDivElement>(
  options: UseIntersectionObserverOptions = {}
): [RefObject<T | null>, boolean] {
  const {
    root = null,
    rootMargin = '200px 0px',
    threshold = 0.01,
    freezeOnceVisible = true,
    enabled = true
  } = options;

  const elementRef = useRef<T | null>(null);
  const [isIntersecting, setIsIntersecting] = useState<boolean>(false);

  useEffect(() => {
    if (!enabled) return;

    const element = elementRef.current;
    if (!element) return;

    // Fallback gracefully for older browsers or test environments without IntersectionObserver
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsIntersecting(true);
      return;
    }

    // If freezeOnceVisible is true and we've already intersected, no need to re-observe
    if (freezeOnceVisible && isIntersecting) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementVisible = entry.isIntersecting;
        if (isElementVisible) {
          setIsIntersecting(true);
          if (freezeOnceVisible) {
            observer.unobserve(element);
          }
        } else if (!freezeOnceVisible) {
          setIsIntersecting(false);
        }
      },
      {
        root,
        rootMargin,
        threshold
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [root, rootMargin, threshold, freezeOnceVisible, enabled, isIntersecting]);

  return [elementRef, isIntersecting];
}

export default useIntersectionObserver;
