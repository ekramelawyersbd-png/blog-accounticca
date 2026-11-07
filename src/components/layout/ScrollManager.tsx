import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * ScrollManager handles intelligent SPA scroll position behavior:
 * 1. When navigating to a DIFFERENT route (pathname changes), it scrolls the window to the top.
 * 2. When navigating with an anchor hash (#id), it smoothly scrolls to the target element.
 * 3. When interacting on the SAME page (switching tabs ?tab=..., pagination, filtering, clicking state buttons),
 *    it preserves the user's scroll position without jumping to the top.
 * 4. When navigating back/forward (POP action), it respects the browser's native scroll restoration.
 */
export function ScrollManager() {
  const location = useLocation();
  const navType = useNavigationType();
  const prevPathnameRef = useRef<string>(location.pathname);
  const prevHashRef = useRef<string>(location.hash);

  useEffect(() => {
    const isNewPage = location.pathname !== prevPathnameRef.current;
    const isHashChanged = location.hash !== prevHashRef.current;

    prevPathnameRef.current = location.pathname;
    prevHashRef.current = location.hash;

    // On browser Back/Forward (POP), allow browser natural restoration if there's no hash
    if (navType === 'POP' && !location.hash) {
      return;
    }

    // 1. If navigating to an anchor hash (e.g., /tools#resource-library or #comments)
    if (location.hash) {
      const targetId = location.hash.replace('#', '');
      const attemptScrollToHash = (retries = 4) => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ 
            behavior: isNewPage ? 'instant' : 'smooth', 
            block: 'start' 
          });
        } else if (retries > 0) {
          setTimeout(() => attemptScrollToHash(retries - 1), 100);
        }
      };

      if (isNewPage) {
        setTimeout(() => attemptScrollToHash(), 60);
      } else if (isHashChanged) {
        attemptScrollToHash();
      }
      return;
    }

    // 2. If navigating to a different page route, scroll to the top
    if (isNewPage) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });
    }

    // 3. If on the same page with query parameters/tab updates, preserve scroll position
  }, [location.pathname, location.hash, navType]);

  return null;
}
