import { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { ArrowUp, ScrollText } from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileInstallPrompt } from '../pwa/MobileInstallPrompt';
import { CartDrawer } from '../shop/CartDrawer';
import { GlobalSearchOverlay } from '../search/GlobalSearchOverlay';
import { useFocusMode } from '../../contexts/FocusModeContext';
import { BreadcrumbProvider, Breadcrumb } from '../Breadcrumb';
import { useAppointmentReminderScanner } from '../../hooks/useAppointmentReminderScanner';

export function Layout() {
  // Dual-engine client scanner: runs in the background of active sessions to dispatch pending 3h reminders
  useAppointmentReminderScanner();

  const { isFocusMode, readerTheme } = useFocusMode();
  const location = useLocation();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 420);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isHomePage = location.pathname === '/';
  const isArticleView = location.pathname.startsWith('/article/');
  const isLmsPortalView =
    location.pathname === '/student' ||
    location.pathname.startsWith('/student/') ||
    location.pathname === '/lms';
  const isAuthView = location.pathname === '/auth' || location.pathname === '/login';
  const hideNavs = (isFocusMode && isArticleView) || isLmsPortalView || isAuthView;

  const bgThemeClass = !hideNavs || isLmsPortalView
    ? 'bg-slate-50'
    : readerTheme === 'sepia'
    ? 'bg-[#fbf7ee] text-[#3c2f1f]'
    : readerTheme === 'dark'
    ? 'bg-[#12161a] text-slate-100'
    : 'bg-white text-slate-900';

  return (
    <BreadcrumbProvider hasGlobalBar={!hideNavs && !isHomePage}>
      <div
        className={`flex min-h-dvh flex-col ${bgThemeClass} w-full max-w-full overflow-x-clip selection:bg-emerald-100 selection:text-emerald-900 antialiased transition-colors duration-300`}
      >
        {!hideNavs && <Navbar />}
        <main
          className={`min-w-0 flex-1 flex flex-col w-full max-w-full ${
            isLmsPortalView
              ? 'p-0 pb-16 lg:pb-0'
              : hideNavs
              ? 'pb-8 pt-0'
              : 'pb-16 lg:pb-0'
          }`}
        >
          {!hideNavs && !isHomePage && <Breadcrumb />}
          <Outlet />
        </main>
        {!hideNavs && <Footer />}
        {!hideNavs && <MobileBottomNav />}
        {!hideNavs && <MobileInstallPrompt />}
        <CartDrawer />
        <GlobalSearchOverlay />

        {/* Floating Quick-Access & Scroll-to-Top Action Bar */}
        {showScrollTop && !isLmsPortalView && (
          <div className="fixed bottom-20 lg:bottom-6 left-4 sm:left-6 z-40 flex items-center gap-2 print:hidden">
            {location.pathname !== '/SRO/TDS2026' && (
              <Link
                to="/SRO/TDS2026"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#0A2A66] hover:bg-[#1A5BB8] text-white text-xs font-extrabold shadow-lg border border-blue-400/30 transition-all hover:-translate-y-0.5"
                title="Open উৎসে কর বিধিমালা ২০২৬ (SRO 273)"
              >
                <ScrollText className="w-3.5 h-3.5 text-amber-300" />
                <span>TDS 2026 (SRO 273)</span>
              </Link>
            )}
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="h-10 w-10 rounded-xl bg-slate-900/90 hover:bg-emerald-700 text-white shadow-lg border border-white/15 flex items-center justify-center transition-all hover:-translate-y-0.5 cursor-pointer"
              aria-label="Scroll to top"
              title="Back to top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </BreadcrumbProvider>
  );
}

