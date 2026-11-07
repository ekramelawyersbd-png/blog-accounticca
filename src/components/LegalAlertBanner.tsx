import { AlertTriangle, Bell, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LegalAlertBanner() {
  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-8 rounded-r-xl shadow-sm flex items-start sm:items-center gap-4">
      <div className="bg-amber-100 p-2 rounded-full shrink-0">
        <Bell className="w-5 h-5 text-amber-600" />
      </div>
      <div className="flex-1">
        <h4 className="text-amber-900 font-bold text-sm sm:text-base">
          Legal Alert: NBR Circular Update 2026
        </h4>
        <p className="text-amber-800 text-xs sm:text-sm mt-1">
          Recent National Board of Revenue (NBR) circulars have updated the penalty thresholds and mandatory digital hearing requirements. Ensure your compliance documentation is up to date.
        </p>
      </div>
      <Link 
        to="/category/tax" 
        className="hidden sm:flex items-center gap-1 text-amber-700 hover:text-amber-900 font-semibold text-sm transition-colors whitespace-nowrap shrink-0"
      >
        View Circulars <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
