import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  BookMarked, 
  Calculator, 
  ShoppingBag, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  Sparkles, 
  FileText, 
  Bookmark, 
  Lock, 
  Unlock, 
  ExternalLink, 
  Layers, 
  Calendar,
  BarChart2,
  PieChart as PieIcon,
  ArrowUpRight,
  ShieldCheck,
  Eye,
  RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { useBookmarks } from '../../contexts/BookmarkContext';
import { usePurchases } from '../../contexts/PurchaseContext';
import { SHOP_PRODUCTS } from '../../data/shopProducts';
import { mockArticles } from '../../data/mockData';
import { Link } from 'react-router-dom';
import { WeeklyActivityTrendChart } from './WeeklyActivityTrendChart';
import { AnnualActivityHeatmap } from './AnnualActivityHeatmap';

interface UserActivityDashboardProps {
  onNavigateTab?: (tab: 'saved' | 'articles' | 'payments' | 'activity') => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Income Tax': '#059669',
  'Corporate Law': '#2563eb',
  'VAT & Customs': '#d97706',
  'Business & Startup': '#7c3aed',
  'Compliance Reference': '#0891b2',
  'Tax Calculator': '#10b981',
  'Utility': '#64748b',
  'Other': '#475569'
};

const READS_TREND_DATA = [
  { day: 'Mon', articleReads: 4, bookmarksSaved: 1, toolAccesses: 2 },
  { day: 'Tue', articleReads: 7, bookmarksSaved: 3, toolAccesses: 4 },
  { day: 'Wed', articleReads: 5, bookmarksSaved: 2, toolAccesses: 1 },
  { day: 'Thu', articleReads: 9, bookmarksSaved: 4, toolAccesses: 5 },
  { day: 'Fri', articleReads: 12, bookmarksSaved: 5, toolAccesses: 8 },
  { day: 'Sat', articleReads: 8, bookmarksSaved: 2, toolAccesses: 3 },
  { day: 'Sun', articleReads: 11, bookmarksSaved: 6, toolAccesses: 6 }
];

export const UserActivityDashboard: React.FC<UserActivityDashboardProps> = ({ onNavigateTab }) => {
  const { savedItems } = useBookmarks();
  const { purchasedProductIds, transactions } = usePurchases();
  const [activeTimeframe, setActiveTimeframe] = useState<'7d' | '30d' | 'year'>('7d');
  const [activeTab, setActiveTab] = useState<'overview' | 'heatmap' | 'reads' | 'bookmarks' | 'purchases'>('overview');

  // Resolved purchased products
  const purchasedProducts = useMemo(() => {
    return SHOP_PRODUCTS.filter(p => purchasedProductIds.includes(p.id));
  }, [purchasedProductIds]);

  // Total investment in shop tools
  const totalInvestmentBDT = useMemo(() => {
    return purchasedProducts.reduce((sum, p) => sum + p.price, 0);
  }, [purchasedProducts]);

  // Simulated article reading history
  const recentArticleReads = useMemo(() => {
    return mockArticles.slice(0, 6).map((art, idx) => ({
      ...art,
      readAt: new Date(Date.now() - idx * 86400000 * 1.5).toISOString(),
      progressPercentage: idx === 0 ? 100 : idx === 1 ? 85 : 100
    }));
  }, []);

  // Category Distribution Data for Donut Chart
  const categoryPieData = useMemo(() => {
    const counts: Record<string, number> = {};

    // Count bookmarks by category
    savedItems.forEach(item => {
      const cat = item.category || 'Compliance Reference';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    // Count purchased tools by category
    purchasedProducts.forEach(prod => {
      const cat = prod.category;
      counts[cat] = (counts[cat] || 0) + 2; // Weight purchased products higher
    });

    // Fallbacks if empty
    if (Object.keys(counts).length === 0) {
      counts['Income Tax'] = 4;
      counts['Corporate Law'] = 3;
      counts['VAT & Customs'] = 2;
      counts['Business & Startup'] = 2;
    }

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name] || '#059669'
    }));
  }, [savedItems, purchasedProducts]);

  // Purchases Monthly Trend
  const purchasesTrendData = useMemo(() => {
    return [
      { month: 'Jun', amount: 950, toolsUnlocked: 1 },
      { month: 'Jul', amount: 1850, toolsUnlocked: 2 },
      { month: 'Aug', amount: 2400, toolsUnlocked: 2 },
      { month: 'Sep', amount: 3500, toolsUnlocked: 3 },
      { month: 'Oct', amount: totalInvestmentBDT || 4200, toolsUnlocked: purchasedProducts.length || 4 }
    ];
  }, [purchasedProducts, totalInvestmentBDT]);

  return (
    <div id="user-activity-dashboard-card" className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-8">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs shrink-0">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                User Activity & Insights Analytics
              </h2>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Live Analytics</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Visual analytics tracking your recent article reads, saved bookmarks, and unlocked shop compliance tools
            </p>
          </div>
        </div>

        {/* Timeframe Selector & Refresh */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
            {(['7d', '30d', 'year'] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setActiveTimeframe(tf)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTimeframe === tf 
                    ? 'bg-white text-emerald-700 font-bold shadow-xs' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tf === '7d' ? 'Last 7 Days' : tf === '30d' ? '30 Days' : 'This Year'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Article Reads */}
        <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Recent Article Reads</span>
            <div className="p-2 rounded-xl bg-emerald-100/80 text-emerald-700">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-950">28</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +14%
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            ~142 mins total reading time in Income Tax & Corporate Law
          </p>
        </div>

        {/* Card 2: Saved Bookmarks */}
        <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Saved Bookmarks</span>
            <div className="p-2 rounded-xl bg-indigo-100/80 text-indigo-700">
              <BookMarked className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-950">{savedItems.length}</span>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              Synced
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            {savedItems.length > 0 ? `Latest: ${savedItems[0]?.title.slice(0, 24)}...` : 'Bookmark guides to build reading list'}
          </p>
        </div>

        {/* Card 3: Purchased Tools */}
        <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Unlocked Shop Tools</span>
            <div className="p-2 rounded-xl bg-amber-100/80 text-amber-800">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-950">{purchasedProducts.length}</span>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              ৳{totalInvestmentBDT.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Permanent tool licenses & editable Excel templates
          </p>
        </div>

        {/* Card 4: Compliance Score */}
        <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Engagement Score</span>
            <div className="p-2 rounded-xl bg-blue-100/80 text-blue-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-950">96.8%</span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Verified
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            High compliance readiness rating across active practice areas
          </p>
        </div>

      </div>

      {/* Internal Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        {[
          { id: 'overview', label: 'Activity Overview & Visual Charts', icon: BarChart2 },
          { id: 'heatmap', label: '365-Day Activity Heatmap (D3)', icon: Calendar },
          { id: 'reads', label: 'Recent Article Reads (28)', icon: FileText },
          { id: 'bookmarks', label: `Saved Bookmarks (${savedItems.length})`, icon: Bookmark },
          { id: 'purchases', label: `Unlocked Tools (${purchasedProducts.length})`, icon: ShoppingBag }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: OVERVIEW & CHARTS */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Recharts Line Chart: Long-Term Weekly Activity & Compliance Trends */}
          <WeeklyActivityTrendChart />
          
          {/* D3.js 365-Day Contribution-Style Heatmap */}
          <AnnualActivityHeatmap />

          {/* Main Visualizations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Chart 1: Reading & Activity Trends (Bar Chart) */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    Weekly Engagement & Reading Activity
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Daily distribution of guide reads, bookmarks saved, and tool accesses
                  </p>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={READS_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                      itemStyle={{ color: '#38bdf8' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="articleReads" name="Article Reads" fill="#059669" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="bookmarksSaved" name="Bookmarks Saved" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="toolAccesses" name="Tool Accesses" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Practice Area Distribution (Pie Chart) */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-emerald-600" />
                  Practice Area Interest Share
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Proportion of saved items & tool activity across legal domains
                </p>
              </div>

              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }} 
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Secondary Chart Row: Purchased Tools Investment Curve */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                  Shop Tools Investment & Licensing Trend (BDT ৳)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cumulative investment in professional calculators, legal kits, and compliance workbooks
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Total Tool Assets</span>
                <p className="text-lg font-black text-slate-950">৳{totalInvestmentBDT.toLocaleString()}</p>
              </div>
            </div>

            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={purchasesTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                    formatter={(value: any) => [`৳${Number(value).toLocaleString()}`, 'Investment Value']}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#d97706" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT: 365-DAY D3 CONTRIBUTION HEATMAP */}
      {activeTab === 'heatmap' && (
        <div className="space-y-4">
          <AnnualActivityHeatmap />
        </div>
      )}

      {/* TAB CONTENT 2: RECENT ARTICLE READS */}
      {activeTab === 'reads' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Recent Article Reads & Reading History
            </h3>
            <span className="text-xs text-slate-500 font-medium">Tracked in this session</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentArticleReads.map((art) => (
              <div 
                key={art.id} 
                className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 bg-white hover:bg-slate-50/60 transition-all flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {art.category}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {art.readTime || '6 min'} read
                    </span>
                  </div>

                  <Link 
                    to={`/article/${art.id}`}
                    className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug"
                  >
                    {art.title}
                  </Link>

                  <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                    {art.excerpt}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full" style={{ width: `${art.progressPercentage}%` }} />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500">{art.progressPercentage}% read</span>
                  </div>

                  <Link 
                    to={`/article/${art.id}`}
                    className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800 text-xs"
                  >
                    <span>Read Again</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: SAVED BOOKMARKS */}
      {activeTab === 'bookmarks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Saved Bookmarks Library ({savedItems.length})
            </h3>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('saved')}
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Manage All Bookmarks</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {savedItems.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200/80">
              <BookMarked className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">No bookmarks saved yet</p>
              <p className="text-xs text-slate-500 mt-1">Click the bookmark icon on any guide or article to save it to your dashboard.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {savedItems.map((item) => (
                <div key={item.id} className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50/60 transition-all flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {item.category || 'Statutory Guide'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Saved {new Date(item.dateSaved).toLocaleDateString()}
                    </span>
                  </div>

                  <Link to={item.url} className="text-xs font-bold text-slate-900 hover:text-emerald-700 line-clamp-2">
                    {item.title}
                  </Link>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                    <Link to={item.url} className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1">
                      <span>Open Guide</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 4: UNLOCKED SHOP TOOLS */}
      {activeTab === 'purchases' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Unlocked Shop Tools & Digital Assets ({purchasedProducts.length})
            </h3>
            <Link to="/tools" className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1">
              <span>Browse Compliance Tools</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {purchasedProducts.map((prod) => (
              <div key={prod.id} className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 transition-all flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {prod.category}
                    </span>
                    <span className="text-xs font-black text-slate-950">৳{prod.price.toLocaleString()}</span>
                  </div>

                  <h4 className="text-sm font-extrabold text-slate-900 leading-snug">
                    {prod.title}
                  </h4>

                  <p className="text-xs text-slate-600 line-clamp-2">
                    {prod.shortDescription}
                  </p>
                </div>

                <div className="pt-3 border-t border-emerald-100/80 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                    <Unlock className="w-3 h-3 text-emerald-600" /> Unlocked
                  </span>

                  <Link 
                    to={`/shop/${prod.slug}`}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold transition-colors inline-flex items-center gap-1"
                  >
                    <span>Launch Tool</span>
                    <ExternalLink className="w-3 h-3 text-emerald-400" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default UserActivityDashboard;
