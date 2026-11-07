import React, { useState, useEffect, useCallback } from 'react';
import { 
  Download, 
  X, 
  Smartphone, 
  CheckCircle2, 
  Share2, 
  PlusSquare, 
  Sparkles,
  Loader2
} from 'lucide-react';

/**
 * Standard BeforeInstallPromptEvent interface according to W3C Manifest Incubator specification.
 */
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Module-level cache for beforeinstallprompt event to eliminate race conditions
// when the browser triggers the event before React components mount.
let cachedBeforeInstallPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    // Prevent default mini-infobar on mobile Chrome / Edge
    e.preventDefault();
    cachedBeforeInstallPrompt = e as BeforeInstallPromptEvent;
  });
}

/**
 * Helper to reliably detect whether the current visitor is on a mobile device
 * based on user agent, pointer capabilities, and viewport dimensions.
 */
function checkIsMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;

  const ua = (window.navigator.userAgent || '').toLowerCase();
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|crios|fxios/i.test(ua);
  const isIPad = window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1;
  const isTouchScreen = ('ontouchstart' in window) || (window.navigator.maxTouchPoints > 0);
  const isNarrowViewport = window.innerWidth <= 768;

  return isMobileUA || isIPad || (isNarrowViewport && isTouchScreen);
}

/**
 * Helper to detect if the app is already running in standalone/installed mode.
 */
function checkIsAppInstalled(): boolean {
  if (typeof window === 'undefined') return false;

  const isStandaloneMatch = window.matchMedia('(display-mode: standalone)').matches;
  const isFullscreenMatch = window.matchMedia('(display-mode: fullscreen)').matches;
  const isMinimalUIMatch = window.matchMedia('(display-mode: minimal-ui)').matches;
  const isSafariStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  const isTWA = document.referrer.includes('android-app://');

  return isStandaloneMatch || isFullscreenMatch || isMinimalUIMatch || isSafariStandalone || isTWA;
}

export interface InstallAppFloatingButtonProps {
  className?: string;
  positionClassName?: string;
  onInstalled?: () => void;
}

/**
 * Floating 'Install App' button component.
 * 
 * Rules enforced:
 * 1. Only appears when the user is on a mobile device.
 * 2. Only appears when the app is NOT currently installed (not in standalone mode).
 * 3. Uses BeforeInstallPromptEvent to trigger the installation when tapped on Android/Chromium.
 *    Provides guided 'Add to Home Screen' fallback instructions for iOS Safari.
 */
export const InstallAppFloatingButton: React.FC<InstallAppFloatingButtonProps> = ({
  className = '',
  positionClassName = 'fixed bottom-20 right-4 z-40 sm:bottom-22',
  onInstalled
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => cachedBeforeInstallPrompt
  );
  const [isMobile, setIsMobile] = useState<boolean>(() => checkIsMobileDevice());
  const [isInstalled, setIsInstalled] = useState<boolean>(() => checkIsAppInstalled());
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);
  const [installSuccess, setInstallSuccess] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);

  useEffect(() => {
    // 1. Initial State Check
    setIsInstalled(checkIsAppInstalled());
    setIsMobile(checkIsMobileDevice());

    const ua = (window.navigator.userAgent || '').toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) || 
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    // 2. Capture BeforeInstallPromptEvent
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      cachedBeforeInstallPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    // 3. Handle App Installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      cachedBeforeInstallPrompt = null;
      setInstallSuccess(true);
      if (onInstalled) {
        onInstalled();
      }
    };

    // 4. Handle resize & orientation changes for responsive mobile check
    const handleResize = () => {
      setIsMobile(checkIsMobileDevice());
      setIsInstalled(checkIsAppInstalled());
    };

    // 5. Handle manual custom event trigger (e.g. from mobile menu)
    const handleCustomOpen = () => {
      setIsDismissed(false);
      handleInstallClick();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    window.addEventListener('open-pwa-install', handleCustomOpen);

    // Listen for standalone display mode changes
    const displayModeQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
      }
    };
    displayModeQuery.addEventListener?.('change', handleDisplayChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.removeEventListener('open-pwa-install', handleCustomOpen);
      displayModeQuery.removeEventListener?.('change', handleDisplayChange);
    };
  }, [onInstalled]);

  /**
   * Triggers the PWA installation using the captured BeforeInstallPromptEvent.
   */
  const handleInstallClick = useCallback(async () => {
    // Android / Chromium BeforeInstallPromptEvent flow
    if (deferredPrompt) {
      setIsInstalling(true);
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;

        if (choiceResult.outcome === 'accepted') {
          setInstallSuccess(true);
          setIsInstalled(true);
          setDeferredPrompt(null);
          cachedBeforeInstallPrompt = null;
          if (onInstalled) {
            onInstalled();
          }
          setTimeout(() => {
            setIsDismissed(true);
          }, 2500);
        } else {
          // User canceled the browser prompt; keep button available
        }
      } catch (error) {
        console.warn('[PWA] Install prompt failed:', error);
      } finally {
        setIsInstalling(false);
      }
      return;
    }

    // iOS Safari flow (WebKit does not support BeforeInstallPromptEvent natively)
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }
  }, [deferredPrompt, isIOS, onInstalled]);

  // Strictly enforce display conditions:
  // 1. Must be on a mobile device
  // 2. Must not be currently installed
  // 3. Must not be dismissed by user
  // 4. Must have BeforeInstallPromptEvent or be an iOS mobile device
  if (!isMobile) {
    return null;
  }

  if (isInstalled) {
    return null;
  }

  if (isDismissed) {
    return null;
  }

  if (!deferredPrompt && !isIOS) {
    return null;
  }

  return (
    <>
      {/* Floating 'Install App' Button Container */}
      <div 
        className={`${positionClassName} ${className} print:hidden animate-in fade-in slide-in-from-bottom-4 duration-300`}
        data-testid="pwa-install-floating-button"
      >
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/90 hover:bg-slate-950 backdrop-blur-md rounded-full shadow-2xl shadow-emerald-950/40 border border-emerald-500/40 transition-all hover:scale-105 active:scale-95 group">
          
          {/* Main Action Button */}
          <button
            type="button"
            onClick={handleInstallClick}
            disabled={isInstalling}
            aria-label="Install App on your mobile device"
            className="flex items-center gap-2 pl-3.5 pr-4 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-full text-xs font-black shadow-inner tracking-tight cursor-pointer transition-all disabled:opacity-75"
          >
            {isInstalling ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-100" />
            ) : installSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            ) : (
              <div className="relative">
                <Download className="w-4 h-4 text-emerald-100 group-hover:translate-y-0.5 transition-transform" />
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-200" />
                </span>
              </div>
            )}

            <span>
              {isInstalling ? 'Installing...' : installSuccess ? 'Installed!' : 'Install App'}
            </span>

            {/* Platform badge */}
            <span className="hidden xs:inline-flex items-center px-1.5 py-0.5 rounded-full bg-emerald-950/50 text-[10px] font-mono text-emerald-200 border border-emerald-500/30">
              {isIOS ? 'iOS' : 'PWA'}
            </span>
          </button>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsDismissed(true);
            }}
            aria-label="Dismiss Install App button"
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* iOS Safari Guided Install Sheet (when clicked on iOS device) */}
      {showIOSModal && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 print:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-title"
        >
          {/* Backdrop click to dismiss */}
          <div 
            className="absolute inset-0 -z-10" 
            onClick={() => setShowIOSModal(false)} 
          />

          <div className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-xs shrink-0">
                  <img 
                    src="/logo.png" 
                    alt="Compliance Hub" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 id="ios-install-title" className="font-extrabold text-base leading-tight">
                    Install on iPhone / iPad
                  </h3>
                  <p className="text-xs text-emerald-200 mt-0.5">
                    Add Compliance Hub to your Home Screen
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="w-8 h-8 rounded-full bg-emerald-950/40 hover:bg-emerald-950/70 text-emerald-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 3 Simple Steps */}
            <div className="p-5 space-y-3.5 text-xs">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-black flex items-center justify-center shrink-0">
                  1
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    Tap the Share button
                    <Share2 className="w-3.5 h-3.5 text-blue-600 inline" />
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Located at the bottom toolbar of Safari (square with arrow up).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-black flex items-center justify-center shrink-0">
                  2
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    Tap &quot;Add to Home Screen&quot;
                    <PlusSquare className="w-3.5 h-3.5 text-emerald-700 inline" />
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Scroll down the options list to find the plus icon.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 font-black flex items-center justify-center shrink-0">
                  3
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-900">
                    Tap &quot;Add&quot; in the top-right corner
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    The app icon will now appear directly on your home screen!
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="w-full py-2.5 mt-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallAppFloatingButton;
