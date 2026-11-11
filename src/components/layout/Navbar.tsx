import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, 
  User, 
  Menu, 
  X, 
  ChevronDown, 
  Wrench, 
  BookOpen, 
  Calculator, 
  Building2, 
  FileText, 
  GraduationCap, 
  Receipt, 
  Coins, 
  Briefcase, 
  ScrollText, 
  ShieldCheck, 
  Newspaper,
  HelpCircle,
  Bookmark,
  Settings,
  LayoutDashboard,
  LogOut,
  Users,
  Award,
  MessageSquare,
  Calendar,
  Home,
  Check,
  Languages,
  ShoppingBag,
  MoreVertical,
  Bell,
  Download,
  Phone
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useBookmarks } from '../../contexts/BookmarkContext';
import { useCart } from '../../contexts/CartContext';
import { useShopAuth } from '../../contexts/ShopAuthContext';
import { LanguageToggle } from '../LanguageToggle';
import { GlobalSearchAutocomplete } from '../search/GlobalSearchAutocomplete';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [blogOpen, setBlogOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [mobileBlogOpen, setMobileBlogOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);
  const [mobileCommunityOpen, setMobileCommunityOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  const blogDropdownRef = useRef<HTMLDivElement>(null);
  const resourcesDropdownRef = useRef<HTMLDivElement>(null);
  const communityDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const blogTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resourcesTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const communityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { count: savedBookmarkCount } = useBookmarks();
  const { totalItemsCount, toggleCart } = useCart();
  const { isAuthenticated: isShopAdminAuthenticated } = useShopAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }
    if (searchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchOpen]);

  useEffect(() => {
    setSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      const key = typeof e.key === 'string' ? e.key.toLowerCase() : '';
      if ((e.metaKey || e.ctrlKey) && key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
        if (!searchOpen) {
          setTimeout(() => searchInputRef.current?.focus(), 50);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const blogCategories = [
    { 
      name: 'Corporate Law', 
      path: '/category/corporate', 
      description: 'RJSC filings, company registration & share transfers',
      icon: Building2 
    },
    { 
      name: 'Income Tax', 
      path: '/category/tax', 
      description: 'Income tax return filing, tax slabs & rebates',
      icon: Receipt 
    },
    { 
      name: 'VAT & Customs', 
      path: '/category/vat', 
      description: 'VAT registration, withholding tax & compliance',
      icon: Coins 
    },
    { 
      name: 'Business Law', 
      path: '/category/business', 
      description: 'Trade licenses, startup legalities & contracts',
      icon: Briefcase 
    },
    { 
      name: 'Legal Documents', 
      path: '/category/legal_docs', 
      description: 'Agreement drafting, contracts & notices',
      icon: ScrollText 
    },
    { 
      name: 'Compliance', 
      path: '/category/compliance', 
      description: 'Statutory compliance checklists & filings',
      icon: ShieldCheck 
    },
    { 
      name: 'Legal Updates', 
      path: '/category/updates', 
      description: 'New government circulars, SROs & amendments',
      icon: Newspaper 
    },
  ];

  const resourceLinks = [
    {
      name: 'TDS Rules 2026 (SRO 273)',
      path: '/SRO/TDS2026',
      description: 'উৎসে কর বিধিমালা, ২০২৬ — Complete gazette, rate tables, calculator & CSV',
      icon: ScrollText,
    },
    { 
      name: 'Regulatory Library', 
      path: '/resource-library', 
      description: 'Statutory gazette archive, NBR SROs, circulars & legal templates',
      icon: BookOpen 
    },
    { 
      name: 'Tools Hub', 
      path: '/tools', 
      description: 'Calculators, compliance checklists & utilities',
      icon: Wrench 
    },
    { 
      name: 'Tax Calculator 2026-27', 
      path: '/tax-calculator', 
      description: 'Income tax calculator with cloud save',
      icon: Calculator 
    },
    { 
      name: 'Individual Tax Planner', 
      path: '/tax-planner', 
      description: 'Estimate 2026 tax, rebates & minimum cliff',
      icon: Calculator 
    },
    { 
      name: 'Corporate Tax Planner', 
      path: '/corporate-planner', 
      description: 'Corporate slabs, rebate & planning tool',
      icon: Building2 
    },
    { 
      name: 'VAT Guide & Mushak', 
      path: '/vat-guide', 
      description: 'Withholding rules, deductions & compliance',
      icon: FileText 
    },
    { 
      name: 'TDS Reference Database', 
      path: '/tds-guide', 
      description: 'Section 89, 90 & 119 TDS rates & database',
      icon: BookOpen 
    },
    { 
      name: 'Student Learning Portal (LMS)', 
      path: '/student/dashboard', 
      description: '10-Class curriculum, video lessons, notes, PPT, quizzes & final exam',
      icon: GraduationCap 
    },
    { 
      name: 'Certificate Verification', 
      path: '/verify-certificate', 
      description: 'Public registry to verify official course certificates',
      icon: Award 
    },
    { 
      name: 'Google Workspace Hub', 
      path: '/workspace', 
      description: 'Drive, Sheets, Calendar, Docs & Meetings integration',
      icon: Briefcase 
    },
    { 
      name: 'Glossary & Legal Terms', 
      path: '/glossary', 
      description: 'Definitions of legal, fiscal & tax terms',
      icon: HelpCircle 
    },
  ];

  const communityLinks = [
    { 
      name: 'Experts Directory', 
      path: '/community?tab=experts', 
      description: 'Verified lawyers, tax practitioners & CAs',
      icon: Award 
    },
    { 
      name: 'Discussions & Q&A', 
      path: '/community?tab=discussions', 
      description: 'Ask questions & discuss BD regulations',
      icon: MessageSquare 
    },
    { 
      name: 'Events & CPD Workshops', 
      path: '/training', 
      description: 'Webinars, masterclasses & legal workshops',
      icon: Calendar 
    },
    { 
      name: 'Community Hub & Rankings', 
      path: '/community', 
      description: 'Overview, networking & monthly top contributors',
      icon: Users 
    },
  ];

  const isBlogActive = blogCategories.some(link => location.pathname === link.path) || 
    location.pathname.startsWith('/category/') || 
    location.pathname.startsWith('/article/');
    
  const isResourceActive =
    resourceLinks.some((link) => link.path !== '/training' && location.pathname === link.path) ||
    location.pathname.startsWith('/resource-library') ||
    location.pathname.startsWith('/SRO/');

  const isCommunityActive = location.pathname === '/community' || 
    location.pathname === '/experts' || 
    location.pathname === '/discussions';

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (blogDropdownRef.current && !blogDropdownRef.current.contains(event.target as Node)) {
        setBlogOpen(false);
      }
      if (resourcesDropdownRef.current && !resourcesDropdownRef.current.contains(event.target as Node)) {
        setResourcesOpen(false);
      }
      if (communityDropdownRef.current && !communityDropdownRef.current.contains(event.target as Node)) {
        setCommunityOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdowns on route navigation
  useEffect(() => {
    setBlogOpen(false);
    setResourcesOpen(false);
    setCommunityOpen(false);
    setIsOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname, location.search]);

  // Auto-expand the active section in mobile menu when opened
  useEffect(() => {
    if (isOpen) {
      if (isBlogActive) setMobileBlogOpen(true);
      if (isResourceActive) setMobileResourcesOpen(true);
      if (isCommunityActive) setMobileCommunityOpen(true);
    }
  }, [isOpen, isBlogActive, isResourceActive, isCommunityActive]);

  const handleBlogMouseEnter = () => {
    if (blogTimeoutRef.current) clearTimeout(blogTimeoutRef.current);
    setBlogOpen(true);
  };

  const handleBlogMouseLeave = () => {
    blogTimeoutRef.current = setTimeout(() => {
      setBlogOpen(false);
    }, 150);
  };

  const handleResourcesMouseEnter = () => {
    if (resourcesTimeoutRef.current) clearTimeout(resourcesTimeoutRef.current);
    setResourcesOpen(true);
  };

  const handleResourcesMouseLeave = () => {
    resourcesTimeoutRef.current = setTimeout(() => {
      setResourcesOpen(false);
    }, 150);
  };

  const handleCommunityMouseEnter = () => {
    if (communityTimeoutRef.current) clearTimeout(communityTimeoutRef.current);
    setCommunityOpen(true);
  };

  const handleCommunityMouseLeave = () => {
    communityTimeoutRef.current = setTimeout(() => {
      setCommunityOpen(false);
    }, 150);
  };

  return (
    <header 
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-200 ease-out print:hidden",
        isScrolled && !isOpen ? "pt-1.5 sm:pt-2 px-2.5 sm:px-5 lg:px-8" : "bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-0 shadow-2xs"
      )}
    >
      {/* Top Institutional Statutory Utility Strip (Visible at top of page) */}
      {!isScrolled && (
        <section
          aria-label="Statutory Gazette & Quick Compliance Bar"
          className="hidden md:block bg-[#0A2A66] text-blue-100 border-b border-blue-900/80 text-[11px]"
        >
          <div className="w-full max-w-[1527px] mx-auto px-4 sm:px-6 lg:px-8 h-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 truncate">
              <span className="inline-flex items-center gap-1.5 font-mono font-bold uppercase tracking-wider text-amber-300 bg-blue-950/90 border border-blue-800 px-2 py-0.5 rounded text-[10px] shrink-0">
                <ShieldCheck className="w-3 h-3 text-amber-300" />
                <span>AY 2026–2027 Gazette</span>
              </span>
              <Link
                to="/SRO/TDS2026"
                className="font-semibold text-white hover:text-amber-300 transition-colors truncate inline-flex items-center gap-1.5"
              >
                <span>উৎসে কর বিধিমালা, ২০২৬ (এস.আর.ও. নং-২৭৩-আইন/আয়কর-৫/২০২৬) — Interactive Rate Tables &amp; Calculator</span>
                <span className="text-amber-300 font-bold">→</span>
              </Link>
            </div>

            <div className="flex items-center gap-3.5 shrink-0 font-semibold">
              <Link
                to="/tax-calculator"
                className="text-blue-100 hover:text-white transition-colors inline-flex items-center gap-1"
              >
                <Calculator className="w-3 h-3 text-emerald-300" />
                <span>Tax Calculator</span>
              </Link>
              <span className="text-blue-700">•</span>
              <Link
                to="/verify-certificate"
                className="text-blue-100 hover:text-white transition-colors inline-flex items-center gap-1"
              >
                <Award className="w-3 h-3 text-amber-300" />
                <span>Verify Certificate</span>
              </Link>
              <span className="text-blue-700">•</span>
              <Link
                to="/student/dashboard"
                className="text-blue-100 hover:text-white transition-colors inline-flex items-center gap-1"
              >
                <GraduationCap className="w-3 h-3 text-sky-300" />
                <span>Student Portal</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      <div 
        className={cn(
          "w-full max-w-[1527px] mx-auto transition-all duration-200 ease-out",
          isScrolled && !isOpen
            ? "bg-white/95 backdrop-blur-xl shadow-[0_10px_30px_rgba(15,23,42,0.10),0_2px_6px_rgba(15,23,42,0.04)] rounded-2xl border border-slate-200/90 ring-1 ring-slate-900/5 px-3 sm:px-5 lg:px-7"
            : "px-3 sm:px-6 lg:px-8"
        )}
      >
        <div className={cn(
          "w-[1500px] max-w-full mx-auto flex justify-between items-center gap-2 sm:gap-4 transition-all duration-200 ease-out",
          isScrolled && !isOpen 
            ? "h-13 sm:h-14 py-0.5" 
            : "h-16 sm:h-[68px]"
        )}>
          {/* Brand Logo */}
          <div className="flex items-center shrink-0">
            <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shadow-sm shrink-0 overflow-hidden bg-slate-950 border border-slate-800 p-0.5 group-hover:scale-105 group-hover:border-amber-400 group-hover:shadow-md transition-all duration-200">
                <img src="/logo.png" alt="E-Lawyers & Accounticca Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base sm:text-xl font-black tracking-tight text-slate-900 leading-tight group-hover:text-emerald-950 transition-colors">
                    Compliance <span className="text-emerald-700">Hub</span>
                  </h1>
                </div>
                <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.18em] text-slate-500 font-extrabold leading-none mt-0.5 flex items-center gap-1.5">
                  <span>Legal</span>
                  <span className="text-emerald-600 font-black">•</span>
                  <span>Tax</span>
                  <span className="text-emerald-600 font-black">•</span>
                  <span>Advisory</span>
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation (Center Pill Bar) */}
          <nav 
            aria-label="Primary Navigation"
            className="hidden lg:flex items-center gap-0.5 xl:gap-1 bg-slate-100/85 p-1 rounded-full border border-slate-200/80 backdrop-blur-xs shadow-2xs"
          >
            {/* Dynamic Blog Dropdown Menu */}
            <div 
              ref={blogDropdownRef} 
              className="relative inline-block"
              onMouseEnter={handleBlogMouseEnter}
              onMouseLeave={handleBlogMouseLeave}
            >
              <button
                type="button"
                onClick={() => setBlogOpen((prev) => !prev)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 xl:px-3.5 py-1.5 rounded-full text-xs xl:text-[13px] tracking-wide transition-all duration-200 whitespace-nowrap focus:outline-none cursor-pointer",
                  isBlogActive || blogOpen
                    ? "bg-white text-emerald-800 shadow-2xs font-extrabold" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold"
                )}
                aria-expanded={blogOpen}
                aria-haspopup="true"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>Articles</span>
                <ChevronDown 
                  className={cn(
                    "w-3.5 h-3.5 transition-transform duration-200", 
                    blogOpen ? "rotate-180 text-emerald-700" : "text-slate-400"
                  )} 
                />
              </button>

              {/* Blog Dropdown Panel */}
              {blogOpen && (
                <div 
                  className="absolute left-0 top-full mt-2 w-[540px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                  role="menu"
                  aria-orientation="vertical"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 px-2 border-b border-slate-100">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                      Articles &amp; Law Categories
                    </span>
                    <Link 
                      to="/search" 
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
                      onClick={() => setBlogOpen(false)}
                    >
                      Browse All Articles →
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {blogCategories.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      return (
                        <Link
                          key={item.name}
                          to={item.path}
                          onClick={() => setBlogOpen(false)}
                          className={cn(
                            "flex items-start gap-3 p-2.5 rounded-xl transition-all duration-200 group text-left",
                            isActive 
                              ? "bg-emerald-50/80 border border-emerald-200/60" 
                              : "hover:bg-slate-50 border border-transparent hover:border-slate-100"
                          )}
                          role="menuitem"
                        >
                          <div className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                            isActive 
                              ? "bg-emerald-600 text-white shadow-sm" 
                              : "bg-slate-100 text-slate-600 group-hover:bg-emerald-600 group-hover:text-white"
                          )}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className={cn(
                              "text-xs font-bold transition-colors leading-tight",
                              isActive ? "text-emerald-900" : "text-slate-900 group-hover:text-emerald-700"
                            )}>
                              {item.name}
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 leading-normal">
                              {item.description}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  {/* Featured Statutory Spotlight inside Articles Menu */}
                  <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-3 px-2 py-2 rounded-xl bg-blue-50/70 border border-blue-100">
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono font-bold uppercase text-[#0A2A66] block">
                        Featured Statutory Gazette
                      </span>
                      <p className="text-xs font-extrabold text-slate-900 truncate">
                        উৎসে কর বিধিমালা, ২০২৬ (এস.আর.ও. নং-২৭৩)
                      </p>
                    </div>
                    <Link
                      to="/SRO/TDS2026"
                      onClick={() => setBlogOpen(false)}
                      className="px-3 py-1.5 rounded-lg bg-[#0A2A66] hover:bg-[#1A5BB8] text-white text-[11px] font-bold shrink-0 transition-colors"
                    >
                      Open Gazette →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic Resources Dropdown Menu */}
            <div 
              ref={resourcesDropdownRef} 
              className="relative inline-block"
              onMouseEnter={handleResourcesMouseEnter}
              onMouseLeave={handleResourcesMouseLeave}
            >
              <button
                type="button"
                onClick={() => setResourcesOpen((prev) => !prev)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 xl:px-3.5 py-1.5 rounded-full text-xs xl:text-[13px] tracking-wide transition-all duration-200 whitespace-nowrap focus:outline-none cursor-pointer",
                  isResourceActive || resourcesOpen
                    ? "bg-white text-emerald-800 shadow-2xs font-extrabold" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold"
                )}
                aria-expanded={resourcesOpen}
                aria-haspopup="true"
              >
                <Wrench className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tools &amp; Resources</span>
                <ChevronDown 
                  className={cn(
                    "w-3.5 h-3.5 transition-transform duration-200", 
                    resourcesOpen ? "rotate-180 text-emerald-700" : "text-slate-400"
                  )} 
                />
              </button>

              {/* Resources Dropdown Panel */}
              {resourcesOpen && (
                <div 
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[560px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                  role="menu"
                  aria-orientation="vertical"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 px-2 border-b border-slate-100">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                      Calculators, Portals &amp; Statutory Databases
                    </span>
                    <Link 
                      to="/tools" 
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
                      onClick={() => setResourcesOpen(false)}
                    >
                      Explore All Tools →
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {resourceLinks.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      return (
                        <Link
                          key={item.name}
                          to={item.path}
                          onClick={() => setResourcesOpen(false)}
                          className={cn(
                            "flex items-start gap-3 p-2.5 rounded-xl transition-all duration-200 group text-left",
                            isActive 
                              ? "bg-emerald-50/80 border border-emerald-200/60" 
                              : "hover:bg-slate-50 border border-transparent hover:border-slate-100"
                          )}
                          role="menuitem"
                        >
                          <div className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                            isActive 
                              ? "bg-emerald-600 text-white shadow-sm" 
                              : "bg-slate-100 text-slate-600 group-hover:bg-emerald-600 group-hover:text-white"
                          )}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className={cn(
                              "text-xs font-bold transition-colors leading-tight flex items-center gap-1.5",
                              isActive ? "text-emerald-900" : "text-slate-900 group-hover:text-emerald-700"
                            )}>
                              <span>{item.name}</span>
                              {item.path === '/SRO/TDS2026' && (
                                <span className="text-[9px] font-mono font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-amber-300 text-slate-950 shrink-0">
                                  SRO 273
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 leading-normal">
                              {item.description}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Academy Link */}
            <Link
              to="/training"
              className={cn(
                "inline-flex items-center gap-1.5 px-3 xl:px-3.5 py-1.5 rounded-full text-xs xl:text-[13px] tracking-wide transition-all duration-200 whitespace-nowrap",
                location.pathname.startsWith('/training')
                  ? "bg-white text-emerald-800 shadow-2xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold"
              )}
            >
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Academy</span>
            </Link>

            {/* Admin Shop Link (Shown only to authenticated admin) */}
            {isShopAdminAuthenticated && (
              <Link
                to="/admin/shop"
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs xl:text-[13px] tracking-wide transition-all duration-200 whitespace-nowrap",
                  location.pathname.startsWith('/admin/shop')
                    ? "bg-white text-emerald-800 shadow-2xs font-extrabold ring-1 ring-emerald-200"
                    : "text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 font-bold border border-emerald-200/80"
                )}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                <span>Admin</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </Link>
            )}

            {/* Careers Link */}
            <Link
              to="/Careers"
              className={cn(
                "inline-flex items-center gap-1.5 px-3 xl:px-3.5 py-1.5 rounded-full text-xs xl:text-[13px] tracking-wide transition-all duration-200 whitespace-nowrap",
                location.pathname.startsWith('/Careers') || location.pathname.startsWith('/careers')
                  ? "bg-[#10243a] text-white shadow-2xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold"
              )}
            >
              <Briefcase className="w-3.5 h-3.5 text-[#c7a76b]" />
              <span>Careers</span>
            </Link>

            {/* Contact */}
            <Link
              to="/contact"
              className={cn(
                "inline-flex items-center gap-1.5 px-3 xl:px-3.5 py-1.5 rounded-full text-xs xl:text-[13px] tracking-wide transition-all duration-200 whitespace-nowrap",
                location.pathname === '/contact'
                  ? "bg-white text-emerald-800 shadow-2xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold"
              )}
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Contact</span>
            </Link>
          </nav>
          
          {/* Right actions: Search + Saved Bookmarks + Cart + Auth + Mobile menu toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Desktop Global Search Trigger (Cmd+K / Ctrl+K) */}
            <div className="relative hidden sm:flex items-center">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open-global-search'))}
                className="h-9 px-3 rounded-xl border border-slate-200/80 bg-slate-50/80 hover:bg-emerald-50/60 hover:border-emerald-300 text-slate-600 hover:text-emerald-800 transition-all flex items-center gap-2 group cursor-pointer shadow-2xs"
                aria-label="Search articles, tools, and products (Cmd+K/Ctrl+K)"
                title="Search articles, tools, and products (Cmd+K/Ctrl+K)"
              >
                <Search className="w-4 h-4 text-slate-500 group-hover:text-emerald-700 transition-colors" />
                <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-800 hidden xl:inline">Search...</span>
                <kbd className="hidden md:inline-flex items-center text-[10px] font-mono font-bold text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded border border-slate-300">
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* Mobile Search Trigger Icon */}
            <div className="relative flex sm:hidden items-center">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open-global-search'))}
                className="h-9 w-9 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-emerald-50/60 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                aria-label="Quick Search (Cmd+K/Ctrl+K)"
                title="Quick Search (Cmd+K/Ctrl+K)"
              >
                <Search className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            {/* Desktop Saved Bookmarks Quick Link */}
            <Link
              to="/dashboard?tab=saved"
              className="hidden md:flex h-9 w-9 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-emerald-50/60 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 transition-all items-center justify-center relative shadow-2xs"
              title="Saved Articles & Bookmarks"
              aria-label="Saved Articles & Bookmarks"
            >
              <Bookmark className="w-4 h-4 text-slate-600" />
              {savedBookmarkCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-extrabold text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center shadow-xs ring-2 ring-white tabular-nums">
                  {savedBookmarkCount}
                </span>
              )}
            </Link>

            {/* Cart Trigger Button */}
            <div className="relative hidden sm:flex items-center">
              <button
                type="button"
                onClick={toggleCart}
                className="h-9 w-9 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-emerald-50/60 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 transition-all flex items-center justify-center cursor-pointer shadow-2xs relative"
                title="Shopping Cart"
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-4 h-4 text-emerald-700" />
                {totalItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-600 text-white font-extrabold text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center shadow-xs ring-2 ring-white tabular-nums">
                    {totalItemsCount}
                  </span>
                )}
              </button>
            </div>

            {user ? (
              <div className="relative hidden sm:block" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-100/90 text-emerald-800 hover:bg-emerald-200 border border-emerald-200/80 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer overflow-hidden shadow-2xs"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-3 border-b border-slate-100 mb-2">
                      <p className="text-sm font-bold text-slate-900 truncate">{user.displayName || user.email?.split('@')[0]}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-3 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      My Dashboard
                    </Link>
                    <Link
                      to="/dashboard?tab=saved"
                      className="flex items-center justify-between px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <div className="flex items-center gap-3">
                        <Bookmark className="w-4 h-4 text-emerald-600" />
                        <span>Saved Articles</span>
                      </div>
                      {savedBookmarkCount > 0 && (
                        <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          {savedBookmarkCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      Profile &amp; Preferences
                    </Link>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/auth" className="hidden sm:inline-flex items-center gap-1.5 h-9 text-xs font-bold text-white bg-slate-900 hover:bg-emerald-700 px-3.5 sm:px-4 rounded-xl transition-all duration-200 shadow-xs hover:shadow-sm hover:-translate-y-0.5 whitespace-nowrap">
                <User className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </Link>
            )}
            <button 
              className="lg:hidden relative h-9 w-9 rounded-xl border border-slate-200/80 bg-slate-50/80 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors p-1 cursor-pointer"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle navigation menu"
              title="More options and navigation"
            >
              {isOpen ? <X className="h-5 w-5" /> : <MoreVertical className="h-5 w-5" />}
              {totalItemsCount > 0 && !isOpen && (
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white font-extrabold text-[9px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center shadow-xs ring-2 ring-white">
                  {totalItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu (Three Dot menu drawer for mobile) */}
      {isOpen && (
        <div className="lg:hidden border-t border-slate-200/90 bg-white shadow-2xl absolute left-0 right-0 w-full max-h-[calc(100vh-72px)] overflow-y-auto overscroll-contain z-50">
          {/* Mobile Quick Actions: Cart, Tax Alerts & Install App */}
          <div className="px-4 pt-3 pb-2 border-b border-slate-100 bg-white">
            <div className="grid grid-cols-3 gap-2">
              {/* Mobile Cart Trigger */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  toggleCart();
                }}
                className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-200/80 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 transition-all cursor-pointer shadow-2xs"
                title="Shopping Cart"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-emerald-100/90 flex items-center justify-center text-emerald-800 shrink-0">
                    <ShoppingBag className="w-3 h-3" />
                  </div>
                  <span className="text-[11px] font-bold truncate">Cart</span>
                </div>
                {totalItemsCount > 0 ? (
                  <span className="bg-emerald-600 text-white font-extrabold text-[9px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center shadow-xs">
                    {totalItemsCount}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-semibold">0</span>
                )}
              </button>

              {/* Mobile Tax Deadline Alerts */}
              <Link
                to="/tax-planner"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-200/80 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 transition-all shadow-2xs"
                title="Tax Deadlines & Alerts"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-amber-100/90 flex items-center justify-center text-amber-800 shrink-0">
                    <Bell className="w-3 h-3" />
                  </div>
                  <span className="text-[11px] font-bold truncate">Alerts</span>
                </div>
                <span className="text-[9px] font-extrabold text-amber-800 bg-amber-100 px-1 py-0.5 rounded-md shrink-0">
                  Dates
                </span>
              </Link>

              {/* Mobile Install App Option */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  window.dispatchEvent(new CustomEvent('open-pwa-install'));
                }}
                className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 hover:border-emerald-300 text-emerald-800 transition-all cursor-pointer shadow-2xs"
                title="Install Compliance Hub as Mobile App"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-emerald-700 flex items-center justify-center text-white shrink-0">
                    <Download className="w-3 h-3" />
                  </div>
                  <span className="text-[11px] font-bold truncate">App</span>
                </div>
                <span className="text-[9px] font-extrabold text-emerald-700 bg-white border border-emerald-200 px-1 py-0.5 rounded-md shrink-0">
                  Save
                </span>
              </button>
            </div>
          </div>

          {/* div:nth-of-type(1) - Mobile Search & Language Tools */}
          <div className="px-4 pt-4 pb-3 border-b border-slate-100 bg-slate-50/70">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Languages className="w-4 h-4 text-emerald-600" />
                Language
              </span>
              <LanguageToggle />
            </div>
            <div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  window.dispatchEvent(new CustomEvent('open-global-search'));
                }}
                className="w-full flex items-center justify-between px-3.5 py-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-500 font-semibold shadow-2xs hover:border-emerald-500 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-emerald-600" />
                  <span>Search articles, tools &amp; courses...</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                  ⌘K
                </span>
              </button>
            </div>
          </div>

          {/* div:nth-of-type(2) - Mobile Navigation Options */}
          <div className="w-full px-4 py-3 space-y-1 max-h-[65vh] overflow-y-auto">
            {/* Mobile Home */}
            <Link
              to="/"
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[35px]",
                location.pathname === '/' 
                  ? "text-emerald-950 bg-emerald-50/90 border border-emerald-300 font-extrabold shadow-2xs" 
                  : "text-slate-700 hover:text-emerald-800 hover:bg-slate-50/80 active:bg-slate-100"
              )}
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center gap-2">
                <Home className={cn("w-4 h-4", location.pathname === '/' ? "text-emerald-600" : "text-slate-500")} />
                <span>Home</span>
              </div>
              {location.pathname === '/' && (
                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.2 rounded-full">
                  <Check className="w-2.5 h-2.5 text-emerald-700" />
                  Active
                </span>
              )}
            </Link>

            {/* Mobile Blog Accordion */}
            <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-2xs">
              <button
                type="button"
                onClick={() => setMobileBlogOpen(prev => !prev)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-xs font-bold transition-all min-h-[35px] cursor-pointer",
                  isBlogActive 
                    ? "text-emerald-950 bg-emerald-50/80 font-extrabold" 
                    : "text-slate-700 hover:text-emerald-800 hover:bg-slate-50/80"
                )}
                aria-expanded={mobileBlogOpen}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className={cn("w-4 h-4", isBlogActive ? "text-emerald-600" : "text-slate-500")} />
                  <span>Articles &amp; Law</span>
                  {isBlogActive && (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                      Active
                    </span>
                  )}
                </div>
                <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", mobileBlogOpen ? "rotate-180 text-emerald-700" : "text-slate-400")} />
              </button>

              {mobileBlogOpen && (
                <div className="p-1.5 space-y-1 bg-slate-50/70 border-t border-slate-100">
                  <Link
                    to="/search"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200/60 mb-0.5"
                  >
                    <span>Browse All Articles &amp; Law Categories</span>
                    <span>→</span>
                  </Link>

                  {blogCategories.map((item) => {
                    const Icon = item.icon;
                    const isSelected = location.pathname === item.path;
                    return (
                      <Link
                        key={item.name}
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[30px]",
                          isSelected 
                            ? "text-emerald-950 bg-white border border-emerald-300 font-black shadow-xs" 
                            : "text-slate-700 hover:text-slate-900 hover:bg-white/70 active:bg-white"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={cn(
                            "w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors",
                            isSelected ? "bg-emerald-600 text-white shadow-xs" : "bg-white text-slate-500 border border-slate-200/80"
                          )}>
                            <Icon className="w-3 h-3" />
                          </div>
                          <span className="truncate">{item.name}</span>
                        </div>
                        {isSelected && (
                          <span className="inline-flex items-center gap-0.5 text-[8px] font-extrabold bg-emerald-600 text-white px-1.5 py-0.2 rounded-full shrink-0">
                            <Check className="w-2 h-2" />
                            Selected
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Mobile Resources Accordion */}
            <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-2xs">
              <button
                type="button"
                onClick={() => setMobileResourcesOpen(prev => !prev)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-xs font-bold transition-all min-h-[35px] cursor-pointer",
                  isResourceActive 
                    ? "text-emerald-950 bg-emerald-50/80 font-extrabold" 
                    : "text-slate-700 hover:text-emerald-800 hover:bg-slate-50/80"
                )}
                aria-expanded={mobileResourcesOpen}
              >
                <div className="flex items-center gap-2">
                  <Wrench className={cn("w-4 h-4", isResourceActive ? "text-emerald-600" : "text-slate-500")} />
                  <span>Resources &amp; Tools</span>
                  {isResourceActive && (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                      Active
                    </span>
                  )}
                </div>
                <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", mobileResourcesOpen ? "rotate-180 text-emerald-700" : "text-slate-400")} />
              </button>

              {mobileResourcesOpen && (
                <div className="p-1.5 space-y-1 bg-slate-50/70 border-t border-slate-100">
                  {resourceLinks.map((item) => {
                    const Icon = item.icon;
                    const isSelected = item.path.includes('#')
                      ? location.pathname === item.path.split('#')[0] && location.hash === '#' + item.path.split('#')[1]
                      : location.pathname === item.path;
                    return (
                      <Link
                        key={item.name}
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[30px]",
                          isSelected 
                            ? "text-emerald-950 bg-white border border-emerald-300 font-black shadow-xs" 
                            : "text-slate-700 hover:text-slate-900 hover:bg-white/70 active:bg-white"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={cn(
                            "w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors",
                            isSelected ? "bg-emerald-600 text-white shadow-xs" : "bg-white text-slate-500 border border-slate-200/80"
                          )}>
                            <Icon className="w-3 h-3" />
                          </div>
                          <span className="truncate">{item.name}</span>
                        </div>
                        {isSelected && (
                          <span className="inline-flex items-center gap-0.5 text-[8px] font-extrabold bg-emerald-600 text-white px-1.5 py-0.2 rounded-full shrink-0">
                            <Check className="w-2 h-2" />
                            Selected
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Mobile Bookmarks */}
            <Link
              to="/dashboard?tab=saved"
              id="mobile-bookmarks-link"
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[35px]",
                location.pathname === '/dashboard' && (location.search.includes('tab=saved') || location.search.includes('tab=bookmarks'))
                  ? "text-emerald-950 bg-emerald-50/90 border border-emerald-300 font-extrabold shadow-2xs" 
                  : "text-slate-700 hover:text-emerald-800 hover:bg-slate-50/80 active:bg-slate-100"
              )}
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-emerald-600" />
                <span>Saved Articles</span>
              </div>
              <div className="flex items-center gap-1.5">
                {savedBookmarkCount > 0 && (
                  <span className="bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-2xs">
                    {savedBookmarkCount}
                  </span>
                )}
                {location.pathname === '/dashboard' && (location.search.includes('tab=saved') || location.search.includes('tab=bookmarks')) && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.2 rounded-full">
                    <Check className="w-2.5 h-2.5 text-emerald-700" />
                    Active
                  </span>
                )}
              </div>
            </Link>

            {/* Mobile Academy */}
            <Link
              to="/training"
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[35px]",
                location.pathname.startsWith('/training')
                  ? "text-emerald-950 bg-emerald-50/90 border border-emerald-300 font-extrabold shadow-2xs"
                  : "text-slate-700 hover:text-emerald-800 hover:bg-slate-50/80 active:bg-slate-100"
              )}
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center gap-2">
                <GraduationCap className={cn("w-4 h-4", location.pathname.startsWith('/training') ? "text-emerald-600" : "text-slate-500")} />
                <span>Academy</span>
              </div>
              {location.pathname.startsWith('/training') && (
                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.2 rounded-full">
                  <Check className="w-2.5 h-2.5 text-emerald-700" />
                  Active
                </span>
              )}
            </Link>

            {/* Mobile Admin Shop (Shown only to authenticated admin) */}
            {isShopAdminAuthenticated && (
              <Link
                to="/admin/shop"
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[35px]",
                  location.pathname.startsWith('/admin/shop')
                    ? "text-emerald-950 bg-emerald-50/90 border border-emerald-300 font-extrabold shadow-2xs" 
                    : "text-slate-700 hover:text-emerald-800 hover:bg-slate-50/80 active:bg-slate-100"
                )}
                onClick={() => setIsOpen(false)}
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  <span>Admin Legal &amp; Tax Store</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.2 rounded-full">
                  Admin Desk
                </span>
              </Link>
            )}

            {/* Mobile Contact */}
            <Link
              to="/contact"
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[35px]",
                location.pathname === '/contact'
                  ? "text-emerald-950 bg-emerald-50/90 border border-emerald-300 font-extrabold shadow-2xs" 
                  : "text-slate-700 hover:text-emerald-800 hover:bg-slate-50/80 active:bg-slate-100"
              )}
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className={cn("w-4 h-4", location.pathname === '/contact' ? "text-emerald-600" : "text-slate-500")} />
                <span>Contact</span>
              </div>
              {location.pathname === '/contact' && (
                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.2 rounded-full">
                  <Check className="w-2.5 h-2.5 text-emerald-700" />
                  Active
                </span>
              )}
            </Link>

            {/* Mobile Careers */}
            <Link
              to="/Careers"
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[35px]",
                location.pathname.startsWith('/Careers') || location.pathname.startsWith('/careers')
                  ? "text-[#10243a] bg-amber-50 border border-amber-300 font-extrabold shadow-2xs" 
                  : "text-slate-700 hover:text-amber-800 hover:bg-slate-50/80 active:bg-slate-100"
              )}
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#c7a76b]" />
                <span>Careers &amp; Open Positions</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded-full">
                4 Jobs
              </span>
            </Link>

            {user ? (
              <div className="mt-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/90 space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden ring-1 ring-emerald-300">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {user.displayName || user.email?.split('@')[0]}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-200/80">
                  <Link
                    to="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700 hover:text-emerald-700 shadow-2xs min-h-[30px]"
                  >
                    <LayoutDashboard className="w-3 h-3 text-emerald-600" />
                    <span>Dashboard</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-700 hover:bg-rose-100 min-h-[30px] cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/auth"
                className="flex items-center justify-center gap-1.5 w-full py-2.5 mt-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-emerald-700 transition-all shadow-sm min-h-[36px]"
                onClick={() => setIsOpen(false)}
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In / Create Account</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

