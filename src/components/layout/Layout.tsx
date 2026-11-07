import { Outlet, useLocation } from 'react-router-dom';
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
          className={`min-w-0 flex-1 w-full max-w-full ${
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
      </div>
    </BreadcrumbProvider>
  );
}
