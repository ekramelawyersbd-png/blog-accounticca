import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Calculator, 
  Briefcase, 
  FileText, 
  LineChart, 
  BookOpen, 
  Wrench, 
  ChevronRight,
  Menu,
  X,
  FileSignature,
  Bookmark,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { APPOINTMENT_BASE_URL } from '../../utils/appointmentRedirect';

export function QuickAccessDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const tools = [
    {
      title: 'Tax Calculator',
      description: 'Individual & general income tax',
      icon: <Calculator className="w-5 h-5" />,
      path: '/tax-calculator',
      color: 'bg-emerald-100 text-emerald-700'
    },
    {
      title: 'Corporate Tax Planner',
      description: 'Company & enterprise tax',
      icon: <Briefcase className="w-5 h-5" />,
      path: '/corporate-planner',
      color: 'bg-blue-100 text-blue-700'
    },
    {
      title: 'VAT & Customs Guide',
      description: 'Value Added Tax rules',
      icon: <FileSignature className="w-5 h-5" />,
      path: '/vat-guide',
      color: 'bg-indigo-100 text-indigo-700'
    },
    {
      title: 'Policy Analysis',
      description: 'Deep dive into legal shifts',
      icon: <LineChart className="w-5 h-5" />,
      path: '/policy-analysis',
      color: 'bg-amber-100 text-amber-700'
    },
    {
      title: 'Legal Glossary',
      description: 'A-Z legal terms definition',
      icon: <BookOpen className="w-5 h-5" />,
      path: '/glossary',
      color: 'bg-rose-100 text-rose-700'
    }
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed top-1/2 -translate-y-1/2 right-0 z-50 flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white p-3 pr-4 rounded-l-2xl shadow-xl transition-all border border-emerald-600 border-r-0 group",
          isOpen ? "translate-x-full opacity-0" : "translate-x-0"
        )}
        title="Quick Access Tools"
      >
        <Wrench className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline-block font-bold text-sm tracking-wide">Quick Tools</span>
      </button>

      {/* Drawer */}
      <div 
        className={cn(
          "fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white border-l border-slate-200 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 text-emerald-800">
            <Wrench className="w-5 h-5" />
            <h2 className="font-bold text-lg">Quick Access</h2>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 ml-1">Professional Tools</p>
          
          {tools.map((tool) => {
            const isActive = location.pathname === tool.path;
            
            return (
              <Link
                key={tool.path}
                to={tool.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-start gap-4 p-3 rounded-xl transition-all group border",
                  isActive 
                    ? "bg-emerald-50 border-emerald-200 shadow-sm" 
                    : "bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm"
                )}
              >
                <div className={cn("p-2.5 rounded-lg shrink-0 transition-transform group-hover:scale-110", tool.color)}>
                  {tool.icon}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <h3 className={cn(
                    "font-bold text-sm truncate mb-0.5 transition-colors",
                    isActive ? "text-emerald-800" : "text-slate-800 group-hover:text-emerald-700"
                  )}>
                    {tool.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-1">{tool.description}</p>
                </div>
                <ChevronRight className={cn(
                  "w-4 h-4 mt-2 shrink-0 transition-transform",
                  isActive ? "text-emerald-500" : "text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5"
                )} />
              </Link>
            );
          })}
        </div>
        
        <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-2">
          <a
            href={APPOINTMENT_BASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-between w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm group"
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-200" />
              <span>Book Legal Consultation</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-emerald-200 group-hover:translate-x-0.5 transition-transform" />
          </a>
          <Link
            to="/dashboard?tab=bookmarks"
            id="drawer-bookmarks-link"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-between w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm font-bold transition-colors"
          >
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-emerald-600" />
              <span>Bookmarked Guides</span>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-600" />
          </Link>
          <Link 
            to="/tools" 
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 hover:text-emerald-700 transition-colors shadow-sm"
          >
            View All Tools <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </>
  );
}
