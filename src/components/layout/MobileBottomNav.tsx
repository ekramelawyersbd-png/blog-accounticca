import { Link, useLocation } from 'react-router-dom';
import { Home, GraduationCap, Wrench, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function MobileBottomNav() {
  const location = useLocation();
  const { user } = useAuth();

  const isHome = location.pathname === '/';
  const isAcademy = location.pathname.startsWith('/training') || 
    location.pathname.startsWith('/courses') || 
    location.pathname === '/enrollment';
  const isTools = location.pathname === '/tools' || 
    location.pathname.startsWith('/tools/') || 
    location.pathname === '/tax-calculator' || 
    location.pathname === '/corporate-planner' || 
    location.pathname === '/tax-planner';
  const isPortal = location.pathname === '/portal' || 
    location.pathname === '/client-portal' || 
    location.pathname === '/student' || 
    location.pathname.startsWith('/student/') || 
    location.pathname === '/lms' || 
    location.pathname === '/verify-certificate';
  const isProfile = location.pathname.startsWith('/dashboard') || 
    location.pathname.startsWith('/auth') || 
    location.pathname === '/profile';

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] print:hidden"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 items-center justify-items-center">
        {/* 1. Home */}
        <Link
          to="/"
          className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] p-1 rounded-xl transition-colors ${
            isHome ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Home</span>
        </Link>

        {/* 2. Academy */}
        <Link
          to="/training"
          className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] p-1 rounded-xl transition-colors relative ${
            isAcademy ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <GraduationCap className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Academy</span>
        </Link>

        {/* 3. Tools */}
        <Link
          to="/tools"
          className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] p-1 rounded-xl transition-colors ${
            isTools ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wrench className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Tools</span>
        </Link>

        {/* 4. Portal */}
        <Link
          to="/portal"
          className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] p-1 rounded-xl transition-colors ${
            isPortal ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Portal</span>
        </Link>

        {/* 5. Profile */}
        <Link
          to={user ? '/profile' : '/auth'}
          className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] p-1 rounded-xl transition-colors ${
            isProfile ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {user?.photoURL ? (
            <img 
              src={user.photoURL} 
              alt="Profile" 
              className="w-5 h-5 rounded-full object-cover mb-0.5 border border-emerald-600"
            />
          ) : (
            <User className="w-5 h-5 mb-0.5" />
          )}
          <span className="text-[10px] tracking-tight">{user ? 'Profile' : 'Sign In'}</span>
        </Link>
      </div>
    </nav>
  );
}
