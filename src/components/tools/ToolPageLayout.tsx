import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ChevronRight, 
  Sparkles, 
  Lock, 
  CheckCircle2, 
  Layers, 
  Calendar, 
  ExternalLink, 
  Building2, 
  Calculator, 
  ShieldCheck, 
  FileText, 
  BookOpen, 
  FolderDown, 
  Coins, 
  Wheat, 
  Share2,
  Mail
} from 'lucide-react';
import { searchableTaxTools, SearchableTool } from '../../data/searchableTools';
import { useAuth } from '../../contexts/AuthContext';
import { buildAppointmentUrl } from '../../utils/appointmentRedirect';
import { ToolSEO } from '../SEO';
import { Breadcrumbs } from '../Breadcrumbs';
import { CalculationEmailModal } from './CalculationEmailModal';
import { CalculationEmailActionBarButton } from './CalculationEmailActionBarButton';

interface ToolPageLayoutProps {
  toolId: string;
  title: string;
  category: string;
  description: string;
  children: React.ReactNode;
}

export const ToolPageLayout: React.FC<ToolPageLayoutProps> = ({
  toolId,
  title,
  category,
  description,
  children
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const toolContentRef = React.useRef<HTMLDivElement | null>(null);

  // Map tool IDs to routes
  const getToolRoute = (id: string): string => {
    switch (id) {
      case 'rjsc-fee-estimator':
      case 'rjsc-fee-calculator-tool':
        return '/tools/rjsc-fee-calculator';
      case 'post-registration-checklist-tool':
        return '/tools/post-registration-checklist';
      case 'rjsc-functions-explorer-tool':
        return '/tools/rjsc-functions-explorer';
      case 'rjsc-returns-filing-guide-tool':
        return '/tools/rjsc-returns-filing-guide';
      case 'capital-gains-tax-tool':
        return '/tools/capital-gains-tax';
      case 'corporate-tax-tool':
        return '/tools/corporate-tax';
      case 'wealth-surcharge-tool':
        return '/tools/wealth-surcharge';
      case 'investment-rebate-calculator-tool':
        return '/tools/investment-rebate';
      case 'agricultural-tax-tool':
        return '/tools/agricultural-tax';
      case 'minimum-turnover-tax-tool':
        return '/tools/minimum-turnover-tax';
      case 'dvc-verification-tool':
        return '/tools/dvc-verification';
      case 'resource-library-tool':
        return '/tools/resource-library';
      case 'early-filing-incentive-tool':
        return '/tools/early-filing-incentive';
      case 'vat-apportionment-calculator':
      case 'vat-apportionment-calculator-tool':
        return '/tools/vat-apportionment-calculator';
      case 'seo-performance-audit':
      case 'seo-performance-audit-tool':
      case 'seo-audit':
        return '/tools/seo-performance-audit';
      default:
        return `/tools/${id}`;
    }
  };

  // List of all tools for quick switch
  const allTools = searchableTaxTools;

  // Filter related tools (other tools in same or related category)
  const relatedTools = allTools.filter(t => t.id !== toolId).slice(0, 4);
  const currentToolRoute = getToolRoute(toolId);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16 pt-6">
      <ToolSEO
        toolId={toolId}
        title={title}
        description={description}
        canonicalUrl={currentToolRoute}
        category={category}
        keywords={[title, category, 'Bangladesh Tax Calculator', 'RJSC Compliance', 'Income Tax Act 2023']}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Tools Hub', url: '/tools' },
          { name: title, url: currentToolRoute }
        ]}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header & Navigation Bar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Breadcrumb Navigation */}
            <div className="space-y-1">
              <Breadcrumbs
                inline
                items={[
                  { label: 'Tools & Calculators', path: '/tools' },
                  { label: category, path: '/tools' },
                  { label: title }
                ]}
                className="mb-1"
              />

              <div className="flex items-center gap-3 pt-1">
                <Link
                  to="/tools"
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0"
                  title="Return to Tools Hub"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {title}
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Layout with Related Tools Section */}
        <div className="flex flex-col gap-8 w-full min-w-0">
          
          {/* Main Tool Content Container */}
          <div ref={toolContentRef} className="w-full min-w-0 space-y-6">
            {children}
          </div>

          <CalculationEmailModal
            isOpen={isEmailModalOpen}
            onClose={() => setIsEmailModalOpen(false)}
            toolId={toolId}
            toolName={title}
            toolCategory={category}
            toolPath={currentToolRoute}
            userEmail={user?.email}
            userName={user?.displayName}
            containerRef={toolContentRef}
          />

          {/* Bottom Related Tools & Consultation */}
          <div className="w-full min-w-0 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            
            {/* Related Tools Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Related Tools
                </h3>
                <Link to="/tools" className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800">
                  View All
                </Link>
              </div>

              <div className="space-y-2 flex-1">
                {relatedTools.map((rt) => {
                  return (
                    <Link
                      key={rt.id}
                      to={getToolRoute(rt.id)}
                      className="block p-3 rounded-2xl border border-slate-200/80 hover:border-emerald-300 hover:bg-slate-50 transition-all space-y-1 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                          {rt.shortName || rt.name}
                        </span>
                        {user ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2">
                        {rt.description}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Lawyer & Tax Expert Advisory Card */}
            <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-sm gap-5 h-full flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Building2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">Expert Representation</span>
                </div>
                <h4 className="text-sm font-extrabold text-white">
                  Need Turnkey RJSC Filing or NBR Tax Assessment Support?
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Consult our Supreme Court Advocates, chartered tax practitioners, and RJSC consultants for 1-on-1 filing representation.
                </p>
              </div>
              <a
                href={buildAppointmentUrl({
                  service: `Legal & Tax Representation (${title})`,
                  notes: `Tool context: ${title} (${toolId})`,
                  source: 'ToolPageLayout Sidebar'
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Book Legal Consultation</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default ToolPageLayout;
