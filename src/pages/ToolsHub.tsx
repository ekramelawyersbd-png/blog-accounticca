import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Calculator, 
  FileCheck2, 
  Scale, 
  Building2, 
  Receipt, 
  Briefcase, 
  ShieldCheck, 
  Coins, 
  CheckCircle2, 
  LogIn, 
  ArrowRight, 
  Search,
  ExternalLink,
  Info,
  Sparkles,
  TrendingUp,
  Landmark,
  Sprout,
  FileSpreadsheet,
  BookOpen,
  Layers,
  Award,
  BarChart3,
  Clock,
  FileText,
  CheckSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { recordToolSigning } from '../services/toolSigningService';

export type ToolCategory =
  | 'Taxation'
  | 'Corporate & RJSC'
  | 'VAT & Withholding'
  | 'Property & Labour'
  | 'Audit, Workspace & Docs';

interface ToolItem {
  id: string;
  anchorId: string;
  name: string;
  description: string;
  category: ToolCategory;
  path: string;
  icon: any;
  color: string;
  statutoryBasis: string;
  badge: string;
}

export const TOOLS_CATALOG: ToolItem[] = [
  // ──────────────────────────────────────────
  // 1. TAXATION TOOLS
  // ──────────────────────────────────────────
  {
    id: 'tax-calculator',
    anchorId: 'income-tax-calculator-tool',
    name: 'Individual Income Tax & Salary TDS Calculator (AY 2026–27)',
    description: 'Calculate salary, business, and rental tax with AY 2026–27 thresholds (General Tk. 4,00,000; Female/65+ Tk. 4,50,000; Disabled Tk. 5,25,000; Freedom Fighters Tk. 5,50,000), dynamic slab tooltips, Mathematical Explanation accordion, and Section 86 Monthly Salary TDS.',
    category: 'Taxation',
    path: '/tax-calculator',
    icon: Calculator,
    color: 'bg-blue-600 text-white',
    statutoryBasis: 'Income Tax Act 2023 · Sec 78 & Sec 86 (AY 2026–27)',
    badge: 'AY 2026–27 Updated',
  },
  {
    id: 'investment-rebate',
    anchorId: 'investment-rebate-calculator-tool',
    name: 'Investment Tax Rebate & 3-Limit Ceiling Calculator',
    description: 'Compute allowable investment (DPS cap Tk. 1.2L, Sanchayapatra cap Tk. 5L, RPF, Mutual Funds, SRO 213/2026 11 Charities) and compare Limit A (3% income), Limit B (10% investment), and Limit C (Tk. 7,50,000).',
    category: 'Taxation',
    path: '/tools/investment-rebate',
    icon: Coins,
    color: 'bg-emerald-600 text-white',
    statutoryBasis: 'Section 78 & Part 3, 6th Schedule · SRO 213/2026',
    badge: '3-Limit Rebate',
  },
  {
    id: 'tax-slabs-explorer',
    anchorId: 'tax-slabs-explorer-tool',
    name: 'AY 2026–2027 Progressive Tax Slabs & Thresholds Explorer',
    description: 'Interactive breakdown of 0% initial thresholds across all 6 taxpayer categories, +Tk. 50,000 disabled child allowance, and progressive 0%–30% tier brackets.',
    category: 'Taxation',
    path: '/tools/tax-slabs-explorer',
    icon: Layers,
    color: 'bg-indigo-600 text-white',
    statutoryBasis: 'Finance Act & Income Tax Act 2023 (AY 2026–27)',
    badge: 'Slabs Explorer',
  },
  {
    id: 'tax-planner',
    anchorId: 'tax-planner-tool',
    name: 'Personal Income Tax & Salary Structure Scenario Planner',
    description: 'Compare multiple compensation packages, 1/3 salary exemption (up to Tk. 5,00,000), and investment rebate allocations side by side.',
    category: 'Taxation',
    path: '/tax-planner',
    icon: BarChart3,
    color: 'bg-blue-500 text-white',
    statutoryBasis: 'Income Tax Act 2023 · 6th Schedule',
    badge: 'Scenario Planner',
  },
  {
    id: 'corporate-tax',
    anchorId: 'corporate-tax-tool',
    name: 'Corporate Tax Rate & Section 55 Banking Compliance Calculator',
    description: 'Calculate corporate tax for Listed, Non-Listed, OPC, Bank/FI, Merchant Bank, and Tobacco/Telecom entities with banking-channel condition checks.',
    category: 'Taxation',
    path: '/tools/corporate-tax',
    icon: Landmark,
    color: 'bg-slate-800 text-white',
    statutoryBasis: 'Income Tax Act 2023 · Section 55 & Finance Act',
    badge: 'Corporate Tax',
  },
  {
    id: 'corporate-planner',
    anchorId: 'corporate-planner-tool',
    name: 'Corporate Tax Scenario Planner & Dividend Optimizer',
    description: 'Simulate corporate effective tax rates, allowable vs. inadmissible expenses, WPPF deductions, and dividend withholding impacts.',
    category: 'Taxation',
    path: '/corporate-planner',
    icon: Building2,
    color: 'bg-indigo-700 text-white',
    statutoryBasis: 'Income Tax Act 2023 · Corporate Assessment',
    badge: 'CFO Suite',
  },
  {
    id: 'minimum-turnover-tax',
    anchorId: 'minimum-turnover-tax-tool',
    name: 'Minimum & Gross Receipts Turnover Tax Calculator (Sec 163)',
    description: 'Compare Regular Tax Liability, Section 163(2) TDS minimum floor, and Section 163(5) Gross Receipts Turnover Tax across 0.1%, 0.25%, 0.60%, 1%, and 2% sectors.',
    category: 'Taxation',
    path: '/tools/minimum-turnover-tax',
    icon: TrendingUp,
    color: 'bg-amber-600 text-white',
    statutoryBasis: 'Income Tax Act 2023 · Section 163',
    badge: 'Section 163',
  },
  {
    id: 'capital-gains-tax',
    anchorId: 'capital-gains-tax-tool',
    name: 'Capital Gains Tax Calculator (Listed Shares & Property)',
    description: 'Calculate capital gains tax on listed sponsor/general shares, property transfers, and 5-year holding period tiers under Section 57 & 7th Schedule.',
    category: 'Taxation',
    path: '/tools/capital-gains-tax',
    icon: TrendingUp,
    color: 'bg-teal-600 text-white',
    statutoryBasis: 'Income Tax Act 2023 · Sec 57 & 7th Schedule',
    badge: 'Capital Gains',
  },
  {
    id: 'agricultural-tax',
    anchorId: 'agri-tax-tool',
    name: 'Agricultural Income Tax Calculator (Sec 40–44)',
    description: 'Compute taxable agricultural income with statutory 60% production cost allowance, +Tk. 2,00,000 sole-agriculturalist exemption, and tea/rubber rules.',
    category: 'Taxation',
    path: '/tools/agricultural-tax',
    icon: Sprout,
    color: 'bg-green-600 text-white',
    statutoryBasis: 'Income Tax Act 2023 · Sections 40–44',
    badge: 'Agri Tax',
  },
  {
    id: 'wealth-surcharge',
    anchorId: 'wealth-surcharge-tool',
    name: 'Net Wealth Surcharge & Environmental Surcharge Visualizer',
    description: 'Determine applicable 10%, 20%, 30%, or 35% net wealth surcharge slabs (above Tk. 4 Crore net wealth or multi-property/motor vehicle ownership).',
    category: 'Taxation',
    path: '/tools/wealth-surcharge',
    icon: Scale,
    color: 'bg-purple-600 text-white',
    statutoryBasis: 'Finance Act Surcharge Schedule · IT-10B',
    badge: 'IT-10B Surcharge',
  },
  {
    id: 'loss-carry-forward',
    anchorId: 'loss-carry-forward-tool',
    name: 'Loss Set-Off & 6-Year Carry Forward Simulator',
    description: 'Model business loss, speculation loss, capital loss, and unabsorbed depreciation set-off and 6-year carry-forward rules under Sections 70–75.',
    category: 'Taxation',
    path: '/tools/loss-carry-forward-calculator',
    icon: FileSpreadsheet,
    color: 'bg-cyan-600 text-white',
    statutoryBasis: 'Income Tax Act 2023 · Sections 70–75',
    badge: 'Loss Carry-Forward',
  },
  {
    id: 'early-filing-incentive',
    anchorId: 'early-filing-incentive-tool',
    name: 'Tax Day Deadline, Delay Interest & Penalty Estimator',
    description: 'Check 30 November Tax Day compliance and calculate Section 174 monthly delay interest and Section 266 non-filing penalties.',
    category: 'Taxation',
    path: '/tools/early-filing-incentive',
    icon: Clock,
    color: 'bg-rose-600 text-white',
    statutoryBasis: 'Income Tax Act 2023 · Sec 166, 174 & 266',
    badge: 'Tax Day 30 Nov',
  },
  {
    id: 'tax-refund-guide',
    anchorId: 'tax-refund-guide-tool',
    name: 'Tax Refund & Excess TDS Adjustment Navigator',
    description: 'Interactive workflow for claiming income tax refunds or carrying forward excess TDS/AIT credits against future assessment years.',
    category: 'Taxation',
    path: '/tax-refund-guide',
    icon: Receipt,
    color: 'bg-sky-600 text-white',
    statutoryBasis: 'Income Tax Act 2023 · Refund & Adjustment',
    badge: 'Refund Workflow',
  },
  {
    id: 'policy-analysis',
    anchorId: 'policy-analysis-tool',
    name: 'Bangladesh Tax Policy & Finance Act Impact Simulator',
    description: 'Comparative analysis of statutory threshold adjustments, slab shifts, and fiscal policy impacts across income brackets.',
    category: 'Taxation',
    path: '/policy-analysis',
    icon: BarChart3,
    color: 'bg-violet-600 text-white',
    statutoryBasis: 'Finance Act Policy Analysis',
    badge: 'Policy Simulator',
  },

  // ──────────────────────────────────────────
  // 2. VAT & WITHHOLDING (TDS / VDS) TOOLS
  // ──────────────────────────────────────────
  {
    id: 'rate-finder',
    anchorId: 'rate-finder-tool',
    name: 'Unified Tax, TDS & VAT Statutory Rate Finder',
    description: 'Instant searchable directory of Bangladesh Income Tax rates, Withholding Tax (TDS) sections, and VAT/VDS schedules.',
    category: 'VAT & Withholding',
    path: '/tools/rate-finder',
    icon: Search,
    color: 'bg-blue-700 text-white',
    statutoryBasis: 'ITA 2023 & VAT Act 2012',
    badge: 'All-in-One Finder',
  },
  {
    id: 'wht-finder',
    anchorId: 'wht-finder-tool',
    name: 'Withholding Tax (TDS / WHT) Section & Invoice Calculator',
    description: 'Lookup statutory deduction at source for vendor supply (Sec 89), contractor bills (Sec 88), commercial rent (Sec 109), and professional services.',
    category: 'VAT & Withholding',
    path: '/tools/wht',
    icon: Coins,
    color: 'bg-cyan-500 text-white',
    statutoryBasis: 'Withholding Tax Rules · ITA 2023',
    badge: 'TDS Lookup',
  },
  {
    id: 'tds-guide',
    anchorId: 'tds-reference-tool',
    name: 'Complete TDS & Withholding Tax Reference Matrix',
    description: 'Comprehensive section-by-section TDS rate schedule, minimum vs. adjustable deduction flags, and A-Challan deposit guidelines.',
    category: 'VAT & Withholding',
    path: '/tds-guide',
    icon: BookOpen,
    color: 'bg-teal-700 text-white',
    statutoryBasis: 'Income Tax Act 2023 · Part 7 (Sec 86–140)',
    badge: 'TDS Matrix',
  },
  {
    id: 'vat-calculator',
    anchorId: 'vat-calculator-tool',
    name: 'VAT & Mushak 6.3 Invoice Calculator',
    description: 'Instant VAT breakdown with standard 15%, 10%, 7.5%, and 5% truncated rates, Advance Tax (AT), and VDS withholding schedules.',
    category: 'VAT & Withholding',
    path: '/tools/vat',
    icon: Receipt,
    color: 'bg-emerald-500 text-white',
    statutoryBasis: 'VAT & SD Act 2012 · Mushak 6.3',
    badge: 'Mushak 6.3 Ready',
  },
  {
    id: 'vat-apportionment',
    anchorId: 'vat-apportionment-tool',
    name: 'VAT Input Tax Credit (ITC) Apportionment Calculator',
    description: 'Calculate partial input tax credit (ITC) apportionment for standard-rated, reduced-rated, and exempt supplies in Mushak 9.1.',
    category: 'VAT & Withholding',
    path: '/tools/vat-apportionment-calculator',
    icon: Calculator,
    color: 'bg-emerald-700 text-white',
    statutoryBasis: 'VAT & SD Act 2012 · Section 46 & Mushak 9.1',
    badge: 'Mushak 9.1 ITC',
  },
  {
    id: 'vat-guide',
    anchorId: 'vat-guide-tool',
    name: 'Interactive VAT & Mushak Compliance Reference Guide',
    description: 'Complete guide to 13-digit BIN registration, Mushak 6.1/6.2 registers, Mushak 6.6 VDS certificates, and monthly Mushak 9.1 filing.',
    category: 'VAT & Withholding',
    path: '/vat-guide',
    icon: FileText,
    color: 'bg-green-700 text-white',
    statutoryBasis: 'VAT & Supplementary Duty Act 2012',
    badge: 'VAT Protocol',
  },

  // ──────────────────────────────────────────
  // 3. CORPORATE & RJSC TOOLS
  // ──────────────────────────────────────────
  {
    id: 'rjsc-fee-calculator',
    anchorId: 'rjsc-fee-calculator-tool',
    name: 'RJSC Company Registration Fee Calculator (Detailed)',
    description: 'Full statutory breakdown of RJSC registration fees, MoA/AoA stamp duties, name clearance, digital certified copies, and VAT.',
    category: 'Corporate & RJSC',
    path: '/tools/rjsc-fee-calculator',
    icon: Building2,
    color: 'bg-purple-600 text-white',
    statutoryBasis: 'Companies Act 1994 · Schedule II',
    badge: 'Detailed RJSC',
  },
  {
    id: 'company-registration',
    anchorId: 'company-registration-tool',
    name: 'RJSC Quick Capital & Stamp Duty Estimator',
    description: 'Fast authorized capital slider to estimate MoA/AoA stamp duty and government filing fees for Private Limited Companies.',
    category: 'Corporate & RJSC',
    path: '/tools/company-registration',
    icon: Building2,
    color: 'bg-purple-500 text-white',
    statutoryBasis: 'Companies Act 1994 & Stamp Act',
    badge: 'Quick Estimator',
  },
  {
    id: 'post-registration-checklist',
    anchorId: 'post-registration-checklist-tool',
    name: 'Post-Incorporation Statutory Compliance Checklist',
    description: 'Interactive tracker for Trade License, e-TIN, BIN, Bank Account opening, Share Certificates, Statutory Audit, and IRC/ERC.',
    category: 'Corporate & RJSC',
    path: '/tools/post-registration-checklist',
    icon: CheckSquare,
    color: 'bg-indigo-600 text-white',
    statutoryBasis: 'Companies Act 1994 & Municipal Laws',
    badge: 'Startup Checklist',
  },
  {
    id: 'rjsc-functions-explorer',
    anchorId: 'rjsc-functions-explorer-tool',
    name: 'RJSC Statutory Functions & Corporate Forms Explorer',
    description: 'Explore RJSC entity types, Form XII (Directors), Form 117 (Share Transfer), Form XV (Registered Office), and charge registration.',
    category: 'Corporate & RJSC',
    path: '/tools/rjsc-functions-explorer',
    icon: Layers,
    color: 'bg-violet-600 text-white',
    statutoryBasis: 'Companies Act 1994 · RJSC Forms',
    badge: 'RJSC Explorer',
  },
  {
    id: 'rjsc-returns-filing-guide',
    anchorId: 'rjsc-returns-filing-guide-tool',
    name: 'RJSC Annual Returns, AGM & Schedule X Filing Guide',
    description: 'Step-by-step compliance calculator and guide for AGM deadlines, Schedule X annual summary, Form 23B auditor filings, and late condonation.',
    category: 'Corporate & RJSC',
    path: '/tools/rjsc-returns-filing-guide',
    icon: FileCheck2,
    color: 'bg-fuchsia-600 text-white',
    statutoryBasis: 'Companies Act 1994 · Sec 36, 81 & 190',
    badge: 'Schedule X Guide',
  },

  // ──────────────────────────────────────────
  // 4. PROPERTY & LABOUR LAW TOOLS
  // ──────────────────────────────────────────
  {
    id: 'stamp-duty',
    anchorId: 'stamp-duty-tool',
    name: 'Land & Property Deed Registration & AIT Calculator',
    description: 'Estimate total Kabala deed cost: Stamp Duty (1.5%), Registration Fee (1%), Local Govt Tax (2–3%), and Section 125 AIT.',
    category: 'Property & Labour',
    path: '/tools/stamp-duty',
    icon: Scale,
    color: 'bg-amber-500 text-white',
    statutoryBasis: 'Registration Act 1908, Stamp Act & Sec 125 ITA 2023',
    badge: 'Deed Registration',
  },
  {
    id: 'gratuity-calculator',
    anchorId: 'gratuity-calculator-tool',
    name: 'Gratuity & Severance Pay Calculator (Labour Act)',
    description: 'Calculate statutory end-of-service gratuity (30 days/year for 5–10 yrs, 45 days/year for 10+ yrs) and notice pay under Bangladesh Labour Act.',
    category: 'Property & Labour',
    path: '/tools/gratuity',
    icon: Briefcase,
    color: 'bg-rose-500 text-white',
    statutoryBasis: 'Bangladesh Labour Act 2006 · Sec 2(10) & 27',
    badge: 'Labour Act 2006',
  },

  // ──────────────────────────────────────────
  // 5. AUDIT, WORKSPACE & VERIFICATION TOOLS
  // ──────────────────────────────────────────
  {
    id: 'workspace-hub',
    anchorId: 'workspace-hub-tool',
    name: 'Google Workspace Integrations & Compliance Hub',
    description: 'Live Google Drive, Sheets, Gmail, Calendar, Docs, Slides, Tasks & Chat console, Tool Signings Ledger, and Salary TDS Draft Vault.',
    category: 'Audit, Workspace & Docs',
    path: '/workspace',
    icon: Sparkles,
    color: 'bg-blue-600 text-white',
    statutoryBasis: '8 Enabled Google Workspace Integrations',
    badge: '8 Integrations Active',
  },
  {
    id: 'dvc-verification',
    anchorId: 'dvc-verification-tool',
    name: 'ICAB Document Verification Code (DVC) Compliance Tool',
    description: 'Verify audited financial statement DVC requirements under Section 73 of Income Tax Act 2023, FRC guidelines, and RJSC filings.',
    category: 'Audit, Workspace & Docs',
    path: '/tools/dvc-verification',
    icon: ShieldCheck,
    color: 'bg-emerald-600 text-white',
    statutoryBasis: 'Income Tax Act 2023 · Sec 73 & ICAB DVC',
    badge: 'Audit DVC Check',
  },
  {
    id: 'resource-library',
    anchorId: 'resource-library-tool',
    name: 'Statutory Forms, SROs & Legal Precedent Library',
    description: 'Searchable vault of NBR return forms, Mushak templates, RJSC checklists, Salary TDS certificates, and SRO 213/2026 notifications.',
    category: 'Audit, Workspace & Docs',
    path: '/tools/resource-library',
    icon: BookOpen,
    color: 'bg-slate-700 text-white',
    statutoryBasis: 'NBR, RJSC & Labour Statutory Forms',
    badge: 'Template Vault',
  },
  {
    id: 'verify-certificate',
    anchorId: 'verify-certificate-tool',
    name: 'Public Certificate Verification Registry',
    description: 'Verify authenticity of Accounticca × E-Lawyers tax, VAT, and corporate compliance training certificates by Certificate ID.',
    category: 'Audit, Workspace & Docs',
    path: '/verify-certificate',
    icon: Award,
    color: 'bg-amber-600 text-white',
    statutoryBasis: 'LMS Digital Verification Registry',
    badge: 'Public Registry',
  },
  {
    id: 'seo-performance-audit',
    anchorId: 'seo-performance-audit-tool',
    name: 'Portal SEO, Schema.org & Performance Audit Tool',
    description: 'Inspect structured data (JSON-LD), OpenGraph cards, canonical routes, and Core Web Vitals readiness across all portal pages.',
    category: 'Audit, Workspace & Docs',
    path: '/tools/seo-performance-audit',
    icon: BarChart3,
    color: 'bg-indigo-600 text-white',
    statutoryBasis: 'Schema.org LegalService & Technical SEO',
    badge: 'SEO Audit',
  }
];

const CATEGORIES: Array<'ALL' | ToolCategory> = [
  'ALL',
  'Taxation',
  'VAT & Withholding',
  'Corporate & RJSC',
  'Property & Labour',
  'Audit, Workspace & Docs'
];

export const ToolsHub: React.FC = () => {
  const { user, signInWithGoogle, signInDemoUser } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | ToolCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const location = useLocation();

  // Record visit to Tools Hub when user is signed in
  useEffect(() => {
    if (user) {
      recordToolSigning('tools-hub', 'Tools Directory & Compliance Suite', 'Legal Suite Hub', '/tools', user);
    }
  }, [user]);

  // Smooth scroll to anchor if hash is present (e.g. /tools#agri-tax-tool)
  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace('#', '');
      const el = document.getElementById(targetId);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  }, [location.hash]);

  const filteredTools = useMemo(() => {
    return TOOLS_CATALOG.filter(tool => {
      const matchesSearch = 
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.statutoryBasis.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.badge.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'ALL' || tool.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-slate-900 via-blue-900 to-indigo-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-4xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            All {TOOLS_CATALOG.length} Statutory Tools Unlocked · AY 2026–2027 Compliant
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Bangladesh Legal, Tax, VAT &amp; RJSC Compliance Tools Directory
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Complete suite of {TOOLS_CATALOG.length} interactive calculators, statutory rate finders, RJSC fee estimators, Google Workspace integrations, and compliance tools updated for Assessment Year 2026–2027 (Income Tax Act 2023, VAT &amp; SD Act 2012, Companies Act 1994, and Bangladesh Labour Act 2006).
          </p>

          {/* Member Authentication Status Card */}
          <div className="hidden pt-3">
            {user ? (
              <div className="hidden flex-wrap items-center gap-3 bg-emerald-950/60 border border-emerald-500/30 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-emerald-200 backdrop-blur-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Verified Member Access Active:</strong> Signed in as{' '}
                  <span className="font-mono text-white font-medium">{user.email}</span>. All {TOOLS_CATALOG.length} tools unlocked freely!
                </span>
                <Link
                  to="/workspace"
                  className="ml-auto inline-flex items-center gap-1 text-emerald-300 hover:text-white underline font-semibold whitespace-nowrap"
                >
                  Open Workspace Hub <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              <div className="hidden flex-wrap items-center gap-3 bg-white/10 border border-white/20 rounded-2xl p-4 text-xs sm:text-sm backdrop-blur-xs">
                <div className="flex items-center gap-2 text-slate-200">
                  <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Sign in once to unlock and use all {TOOLS_CATALOG.length} compliance tools freely. No shop payment needed!</span>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => signInWithGoogle()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-xs transition-all cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Sign In with Google
                  </button>
                  <button
                    onClick={() => signInDemoUser()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition-all cursor-pointer"
                  >
                    1-Click Instant Access
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map(cat => {
            const count = cat === 'ALL' ? TOOLS_CATALOG.length : TOOLS_CATALOG.filter(t => t.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{cat === 'ALL' ? 'All Tools' : cat}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedCategory === cat ? 'bg-blue-900 text-blue-100' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search all 32 tools or statutory acts..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTools.map(tool => {
          const Icon = tool.icon;
          return (
            <div
              key={tool.id}
              id={tool.anchorId}
              className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all duration-200 p-6 flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${tool.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {tool.category}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                      {tool.badge}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {tool.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-1">
                    {tool.statutoryBasis}
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {tool.description}
                </p>
              </div>

              <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
                {user ? (
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Free · Unlocked
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-blue-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Free with Sign-In
                  </span>
                )}

                <Link
                  to={tool.path}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 group-hover:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer"
                >
                  Launch Tool
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Notice regarding Workspace logging */}
      <div className="bg-slate-100/80 rounded-2xl p-5 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0" />
          <span>
            <strong>Workspace Audit Trail &amp; Google Workspace Sync:</strong> Every calculation session is logged in the{' '}
            <Link to="/workspace?tab=tool-signings" className="text-blue-700 font-bold underline">
              Workspace Tool Signings Log
            </Link>{' '}
            and can be exported to Google Drive, Sheets, or Docs in{' '}
            <Link to="/workspace?tab=integrations" className="text-blue-700 font-bold underline">
              /workspace
            </Link>.
          </span>
        </div>
        <Link
          to="/workspace"
          className="inline-flex items-center gap-1.5 text-blue-700 hover:text-blue-900 font-bold whitespace-nowrap"
        >
          Open Workspace Hub <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
export default ToolsHub;
