import React, { useState } from 'react';
import { 
  Download, 
  X, 
  Share2, 
  PlusSquare, 
  Smartphone, 
  CheckCircle2, 
  Sparkles, 
  ChevronRight,
  ShieldCheck,
  Zap,
  BookOpen
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const MobileInstallPrompt: React.FC = () => {
  const { 
    isInstallable, 
    isInstalled, 
    isIOS, 
    isAndroid, 
    showPrompt, 
    install, 
    dismissPrompt, 
    openPrompt 
  } = usePWAInstall();

  // Active guide tab: default to detected platform
  const [activePlatform, setActivePlatform] = useState<'ios' | 'android'>(() => {
    return isIOS ? 'ios' : 'android';
  });

  const [installSuccess, setInstallSuccess] = useState(false);

  // If already installed in standalone mode, do not render prompt
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        setInstallSuccess(true);
        setTimeout(() => {
          dismissPrompt(30 * 24 * 60 * 60 * 1000); // 30 days
        }, 2000);
      }
    } else {
      // If native prompt not directly available, switch to platform instruction tab
      if (isIOS) {
        setActivePlatform('ios');
      } else {
        setActivePlatform('android');
      }
    }
  };

  return (
    <>
      {/* Floating Mini Badge on Mobile (Visible when pop-up is dismissed to allow manual reopening) */}
      {!showPrompt && (
        <button
          onClick={openPrompt}
          aria-label="Install mobile app"
          className="fixed bottom-20 right-3.5 z-30 lg:hidden flex items-center gap-2 py-2 px-3.5 bg-emerald-900/95 hover:bg-emerald-900 text-white rounded-full shadow-lg shadow-emerald-950/20 border border-emerald-700/80 backdrop-blur-md active:scale-95 transition-all text-xs font-semibold cursor-pointer animate-fade-in print:hidden"
        >
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
            <Download className="w-3 h-3" />
          </div>
          <span>Install App</span>
        </button>
      )}

      {/* Main Install Pop-up Modal / Bottom Sheet */}
      {showPrompt && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/65 backdrop-blur-xs transition-opacity animate-fade-in print:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-title"
        >
          {/* Backdrop click to dismiss */}
          <div 
            className="absolute inset-0 -z-10" 
            onClick={() => dismissPrompt()} 
          />

          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden max-h-[90vh] flex flex-col transition-all transform animate-slide-up">
            
            {/* Header Banner */}
            <div className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white p-5 sm:p-6 pb-6">
              {/* Close Button */}
              <button
                onClick={() => dismissPrompt()}
                aria-label="Close install prompt"
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-emerald-950/40 hover:bg-emerald-950/70 text-emerald-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white p-1.5 shadow-md shrink-0 border border-emerald-400/30 overflow-hidden flex items-center justify-center">
                  <img 
                    src="/logo.png" 
                    alt="Compliance Hub" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="pr-6">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-700/80 text-emerald-200 border border-emerald-600/60 mb-1">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    Mobile App Experience
                  </div>
                  <h3 id="pwa-install-title" className="text-lg sm:text-xl font-extrabold tracking-tight text-white leading-tight">
                    Save to Home Screen
                  </h3>
                  <p className="text-xs text-emerald-100/90 mt-0.5">
                    Fast access on Android & iOS without opening a browser
                  </p>
                </div>
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-700">
              
              {/* Success Notification */}
              {installSuccess ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">App Installed Successfully!</h4>
                  <p className="text-xs text-slate-600">
                    Compliance Hub is now available on your mobile home screen.
                  </p>
                </div>
              ) : (
                <>
                  {/* Key Benefits */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 sm:p-3 text-center flex flex-col items-center">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-1.5">
                        <Zap className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 leading-tight">1-Tap Launch</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">Quick access</span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 sm:p-3 text-center flex flex-col items-center">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center mb-1.5">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 leading-tight">Full Screen</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">No browser bars</span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 sm:p-3 text-center flex flex-col items-center">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center mb-1.5">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 leading-tight">Fast Tools</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">Tax & VAT data</span>
                    </div>
                  </div>

                  {/* Native 1-Click Install Button (When Chromium/Android deferred prompt is available) */}
                  {isInstallable && (
                    <div className="space-y-2">
                      <button
                        onClick={handleInstallClick}
                        className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm sm:text-base rounded-2xl shadow-md shadow-emerald-700/25 transition-all cursor-pointer"
                      >
                        <Download className="w-5 h-5 shrink-0" />
                        <span>Install App Now</span>
                      </button>
                      <p className="text-center text-[11px] text-slate-400">
                        Takes zero device storage &bull; Installs in seconds
                      </p>
                    </div>
                  )}

                  {/* Device Specific Step-by-Step Instructions */}
                  <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 space-y-3">
                    {/* Platform Selector Tabs */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        How to save on your device:
                      </span>
                      <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => setActivePlatform('android')}
                          className={`px-2.5 py-1 rounded-md transition-all ${
                            activePlatform === 'android'
                              ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Android
                        </button>
                        <button
                          type="button"
                          onClick={() => setActivePlatform('ios')}
                          className={`px-2.5 py-1 rounded-md transition-all ${
                            activePlatform === 'ios'
                              ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          iOS (iPhone/iPad)
                        </button>
                      </div>
                    </div>

                    {/* iOS Safari Instructions */}
                    {activePlatform === 'ios' && (
                      <div className="space-y-3 text-xs leading-relaxed text-slate-600">
                        <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-xs shrink-0">
                            1
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-semibold text-slate-800">
                              Tap the <span className="text-blue-600 font-bold inline-flex items-center gap-1">Share button <Share2 className="w-3.5 h-3.5 inline" /></span>
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Located at the bottom of your Safari browser toolbar (square with arrow pointing up).
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-xs shrink-0">
                            2
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-semibold text-slate-800">
                              Scroll down & tap <span className="text-emerald-700 font-bold inline-flex items-center gap-1">&quot;Add to Home Screen&quot; <PlusSquare className="w-3.5 h-3.5 inline" /></span>
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Look for the plus icon in the options list.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                          <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold text-xs shrink-0">
                            3
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-semibold text-slate-800">
                              Tap <span className="font-bold text-slate-900">&quot;Add&quot;</span> in the top-right corner
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Compliance Hub icon will now appear on your home screen!
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Android Instructions */}
                    {activePlatform === 'android' && (
                      <div className="space-y-3 text-xs leading-relaxed text-slate-600">
                        <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-xs shrink-0">
                            1
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-semibold text-slate-800">
                              Tap the <span className="font-bold text-slate-900">Menu icon (&vellip;)</span>
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Usually three dots located at top-right in Chrome, Edge, or Samsung Internet.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                          <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold text-xs shrink-0">
                            2
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-semibold text-slate-800">
                              Select <span className="font-bold text-emerald-800">&quot;Install app&quot;</span> or <span className="font-bold text-emerald-800">&quot;Add to Home screen&quot;</span>
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Confirm the prompt to install without using Google Play Store.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

            </div>

            {/* Bottom Controls */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => dismissPrompt()}
                className="py-2.5 px-4 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Maybe Later
              </button>

              <div className="flex items-center gap-2">
                {isInstallable && !installSuccess ? (
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="inline-flex items-center gap-1.5 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Install Now</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => dismissPrompt()}
                    className="inline-flex items-center gap-1.5 py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <span>Got It</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
