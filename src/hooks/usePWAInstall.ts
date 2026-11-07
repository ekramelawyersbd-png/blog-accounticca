import { useState, useEffect, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const STORAGE_KEY_DISMISSED = 'pwa_prompt_dismissed_until';
const DISMISSAL_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours dismissal cooldown

let cachedHookPrompt: BeforeInstallPromptEvent | null = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    cachedHookPrompt = e as BeforeInstallPromptEvent;
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => cachedHookPrompt
  );
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [showPrompt, setShowPrompt] = useState<boolean>(false);

  useEffect(() => {
    // 1. Detect standalone mode (already running as installed PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');
    setIsInstalled(isStandalone);

    if (isStandalone) {
      return;
    }

    // 2. Detect OS & Mobile Device
    const ua = (window.navigator.userAgent || '').toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) || 
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
    const isAndroidDevice = /android/.test(ua);
    const isMobileDevice = isIOSDevice || isAndroidDevice || /mobile|tablet/.test(ua) || window.innerWidth < 768;

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
    setIsMobile(isMobileDevice);

    // 3. Check dismissal timestamp
    const dismissedUntil = localStorage.getItem(STORAGE_KEY_DISMISSED);
    const isDismissed = dismissedUntil && Date.now() < parseInt(dismissedUntil, 10);

    // 4. Capture beforeinstallprompt (Chromium / Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!isDismissed) {
        // Show after polite 2-second delay once the app is loaded
        const timer = setTimeout(() => setShowPrompt(true), 2000);
        return () => clearTimeout(timer);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.removeItem(STORAGE_KEY_DISMISSED);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    const handleCustomOpen = () => setShowPrompt(true);
    window.addEventListener('open-pwa-install', handleCustomOpen);

    // 5. For iOS or mobile browsers where beforeinstallprompt doesn't fire natively:
    // Show polite prompt after 3 seconds if on mobile and not recently dismissed
    let autoShowTimer: NodeJS.Timeout | null = null;
    if (!isDismissed && (isIOSDevice || isAndroidDevice || isMobileDevice)) {
      autoShowTimer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('open-pwa-install', handleCustomOpen);
      if (autoShowTimer) clearTimeout(autoShowTimer);
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setShowPrompt(false);
        setDeferredPrompt(null);
        return true;
      } else {
        // User dismissed the browser prompt
        dismissPrompt();
        return false;
      }
    } catch (err) {
      console.warn('[PWA] Install prompt error:', err);
      return false;
    }
  }, [deferredPrompt]);

  const dismissPrompt = useCallback((durationMs: number = DISMISSAL_DURATION_MS) => {
    setShowPrompt(false);
    try {
      localStorage.setItem(STORAGE_KEY_DISMISSED, (Date.now() + durationMs).toString());
    } catch {
      // ignore
    }
  }, []);

  const openPrompt = useCallback(() => {
    setShowPrompt(true);
  }, []);

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    isAndroid,
    isMobile,
    showPrompt,
    setShowPrompt,
    install,
    dismissPrompt,
    openPrompt
  };
}
