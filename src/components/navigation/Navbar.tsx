import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Scale, 
  Wrench, 
  Calculator, 
  Briefcase, 
  ShoppingBag, 
  LogIn, 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck, 
  User as UserIcon,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, signInWithGoogle, signInDemoUser, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-blue-900 text-white rounded-xl flex items-center justify-center font-black shadow-xs">
              <Scale className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900 text-base sm:text-lg leading-tight tracking-tight">
                eLawyers<span className="text-blue-700">BD</span>
              </div>
              <div className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
                Legal &amp; Tax Suite
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              to="/tools"
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                isActive('/tools')
                  ? 'bg-blue-50 text-blue-800'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-blue-600" />
                Tools Directory
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Free
                </span>
              </span>
            </Link>

            <Link
              to="/tax-calculator"
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                isActive('/tax-calculator')
                  ? 'bg-blue-50 text-blue-800'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-emerald-600" />
                Tax Calculator
              </span>
            </Link>

            <Link
              to="/workspace?tab=tool-signings"
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                isActive('/workspace')
                  ? 'bg-blue-50 text-blue-800'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-indigo-600" />
                Workspace
              </span>
            </Link>
          </nav>

          {/* User Auth Section */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl py-1.5 px-3">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs uppercase">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'M'}
                </div>
                <div className="text-left text-xs">
                  <div className="font-bold text-slate-900 truncate max-w-[140px]">{user.displayName || 'Member'}</div>
                  <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                    Unlocked
                  </div>
                </div>
                <button
                  onClick={() => logout()}
                  title="Sign Out"
                  aria-label="Sign Out"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer ml-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => signInWithGoogle()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In (Free)
                </button>
                <button
                  onClick={() => signInDemoUser()}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold border border-slate-200 transition-all cursor-pointer"
                >
                  Demo Login
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
              className="p-2 text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-6 space-y-2">
          <Link
            to="/tools"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between p-2.5 rounded-xl font-bold text-slate-900 hover:bg-slate-50"
          >
            <span className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-blue-600" />
              Tools Directory
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Free
            </span>
          </Link>

          <Link
            to="/tax-calculator"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 p-2.5 rounded-xl font-bold text-slate-900 hover:bg-slate-50"
          >
            <Calculator className="w-4 h-4 text-emerald-600" />
            Tax Calculator
          </Link>

          <Link
            to="/workspace?tab=tool-signings"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 p-2.5 rounded-xl font-bold text-slate-900 hover:bg-slate-50"
          >
            <Briefcase className="w-4 h-4 text-indigo-600" />
            Workspace &amp; Signings Log
          </Link>

          <div className="pt-4 border-t border-slate-100">
            {user ? (
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
                <div>
                  <div className="font-bold text-xs text-slate-900">{user.email}</div>
                  <div className="text-[10px] text-emerald-700">Signed In · Tools Unlocked</div>
                </div>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="px-3 py-1 text-xs text-rose-600 font-bold bg-white border border-rose-200 rounded-lg"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => { signInWithGoogle(); setMobileMenuOpen(false); }}
                  className="w-full py-2.5 bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  Sign In with Google (Free)
                </button>
                <button
                  onClick={() => { signInDemoUser(); setMobileMenuOpen(false); }}
                  className="w-full py-2 bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold"
                >
                  Instant Member Access
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
