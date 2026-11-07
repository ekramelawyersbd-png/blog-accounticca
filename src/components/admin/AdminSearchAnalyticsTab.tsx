import React, { useState, useEffect } from 'react';
import { 
  Search, 
  TrendingUp, 
  AlertTriangle, 
  BarChart3, 
  FileText, 
  Wrench, 
  ShoppingBag, 
  Download, 
  CheckCircle2, 
  PlusCircle, 
  RefreshCw,
  Sparkles,
  Calendar,
  Filter
} from 'lucide-react';
import { 
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

interface SearchQueryItem {
  query: string;
  count: number;
  resultsFound: number;
  trend: 'up' | 'stable' | 'down';
  category: string;
}

interface ContentGapItem {
  query: string;
  searches: number;
  suggestedAction: string;
  priority: 'High' | 'Medium' | 'Low';
}

type DateRangeOption = '7d' | '30d' | '90d' | 'ytd' | 'custom';

const BASE_TOP_QUERIES: SearchQueryItem[] = [
  { query: 'Income Tax Return 2026-27', count: 1420, resultsFound: 24, trend: 'up', category: 'Tax' },
  { query: 'RJSC Company Registration', count: 980, resultsFound: 18, trend: 'up', category: 'Corporate' },
  { query: 'WPPF Calculation Formula', count: 750, resultsFound: 12, trend: 'stable', category: 'Tools' },
  { query: 'VAT Return Mushak 9.1', count: 620, resultsFound: 15, trend: 'up', category: 'VAT' },
  { query: 'Non-Disclosure Agreement Template', count: 540, resultsFound: 8, trend: 'up', category: 'Shop' },
  { query: 'Capital Gains Tax Land', count: 430, resultsFound: 9, trend: 'stable', category: 'Tax' },
  { query: 'BIDA Foreign Investment Approval', count: 390, resultsFound: 6, trend: 'up', category: 'Corporate' },
  { query: 'Investment Tax Rebate Sixth Schedule', count: 350, resultsFound: 11, trend: 'stable', category: 'Tax' }
];

const INITIAL_CONTENT_GAPS: ContentGapItem[] = [
  { query: 'Transfer Pricing Audit Bangladesh', searches: 210, suggestedAction: 'Publish comprehensive guide on NBR Transfer Pricing Rules & Form 8CZ', priority: 'High' },
  { query: 'Export Subsidy Cash Assistance BIDA', searches: 185, suggestedAction: 'Create tool or statutory guide for RMG & software export incentives', priority: 'High' },
  { query: 'Freelancer Tax Exemptions 2026', searches: 160, suggestedAction: 'Publish article on IT/ITES tax exemption compliance & SRO circulars', priority: 'Medium' },
  { query: 'Virtual Office RJSC Legality', searches: 145, suggestedAction: 'Update corporate formation checklist for co-working and virtual addresses', priority: 'Medium' },
  { query: 'Cryptocurrency Tax Regulation BD', searches: 95, suggestedAction: 'Draft legal brief on Bangladesh Bank & NBR stance on digital assets', priority: 'Low' }
];

const BASE_INTERACTION_TRENDS = [
  { day: 'Mon', articles: 320, tools: 540, shop: 120, lms: 85 },
  { day: 'Tue', articles: 410, tools: 620, shop: 145, lms: 95 },
  { day: 'Wed', articles: 380, tools: 590, shop: 135, lms: 110 },
  { day: 'Thu', articles: 450, tools: 680, shop: 165, lms: 130 },
  { day: 'Fri', articles: 520, tools: 750, shop: 190, lms: 145 },
  { day: 'Sat', articles: 610, tools: 890, shop: 220, lms: 180 },
  { day: 'Sun', articles: 490, tools: 710, shop: 175, lms: 140 }
];

const INTENT_DISTRIBUTION_DATA = [
  { name: 'Tax Calculation', value: 38, color: '#059669' },
  { name: 'Legal & Corporate Advisory', value: 27, color: '#10b981' },
  { name: 'Template & Tool Procurement', value: 20, color: '#34d399' },
  { name: 'LMS Training & Exams', value: 15, color: '#6ee7b7' }
];

export function AdminSearchAnalyticsTab() {
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dateRange, setDateRange] = useState<DateRangeOption>('30d');
  const [customStartDate, setCustomStartDate] = useState('2026-09-01');
  const [customEndDate, setCustomEndDate] = useState('2026-10-27');
  
  const [gaps, setGaps] = useState<ContentGapItem[]>(INITIAL_CONTENT_GAPS);
  const [newGapInput, setNewGapInput] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Scale multiplier based on selected date range
  const multiplier = dateRange === '7d' ? 0.28 : dateRange === '30d' ? 1.0 : dateRange === '90d' ? 2.8 : dateRange === 'ytd' ? 5.5 : 1.5;
  const totalSearchesNum = Math.round(24850 * multiplier);

  const scaledQueries = BASE_TOP_QUERIES.map(q => ({
    ...q,
    count: Math.round(q.count * multiplier)
  }));

  const scaledTrends = BASE_INTERACTION_TRENDS.map(t => ({
    ...t,
    articles: Math.round(t.articles * multiplier),
    tools: Math.round(t.tools * multiplier),
    shop: Math.round(t.shop * multiplier),
    lms: Math.round(t.lms * multiplier)
  }));

  const filteredQueries = scaledQueries.filter(q => {
    const matchesSearch = q.query.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesCat = selectedCategory === 'All' || q.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleAddCustomGap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGapInput.trim()) return;
    const newItem: ContentGapItem = {
      query: newGapInput.trim(),
      searches: Math.floor(Math.random() * 100) + 50,
      suggestedAction: 'Review user search intent and assign editorial task for new content.',
      priority: 'Medium'
    };
    setGaps([newItem, ...gaps]);
    setNewGapInput('');
    setSuccessMsg('Successfully added content gap tracking item.');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  return (
    <div className="space-y-8 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto animate-fade-in">
      {/* Top Banner with Date Range Selector */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl border border-emerald-700/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-700/60 text-emerald-100 px-3 py-1 rounded-full text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Search Intelligence & Content Gaps Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Search Queries & User Interaction Analytics
            </h1>
            <p className="text-emerald-100/80 text-sm mt-1 max-w-2xl">
              Monitor top user search terms, evaluate zero-result queries to identify high-value content gaps, and analyze engagement across articles, interactive tools, and shop items.
            </p>
          </div>

          {/* Date Range Selector Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-black/30 backdrop-blur-md p-3 rounded-2xl border border-white/10 shrink-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200 px-1">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Time Period:</span>
            </div>
            <div className="inline-flex bg-slate-900/80 p-1 rounded-xl border border-slate-700/80 text-xs font-bold">
              <button
                type="button"
                onClick={() => setDateRange('7d')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${dateRange === '7d' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'}`}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setDateRange('30d')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${dateRange === '30d' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'}`}
              >
                30 Days
              </button>
              <button
                type="button"
                onClick={() => setDateRange('90d')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${dateRange === '90d' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'}`}
              >
                90 Days
              </button>
              <button
                type="button"
                onClick={() => setDateRange('ytd')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${dateRange === 'ytd' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'}`}
              >
                YTD
              </button>
              <button
                type="button"
                onClick={() => setDateRange('custom')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${dateRange === 'custom' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'}`}
              >
                Custom
              </button>
            </div>

            <button
              onClick={() => {
                setSuccessMsg(`Refreshed metrics for period: ${dateRange.toUpperCase()}`);
                setTimeout(() => setSuccessMsg(null), 3000);
              }}
              className="inline-flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="Refresh Analytics"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="sm:hidden">Refresh</span>
            </button>
          </div>
        </div>

        {/* Custom Date Range Picker inputs if 'custom' is selected */}
        {dateRange === 'custom' && (
          <div className="mt-4 pt-4 border-t border-emerald-700/50 flex flex-wrap items-center gap-4 text-xs">
            <span className="font-semibold text-emerald-200">Custom Date Range:</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-300">From:</span>
              <input 
                type="date" 
                value={customStartDate} 
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-300">To:</span>
              <input 
                type="date" 
                value={customEndDate} 
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <span className="text-emerald-300 italic">Showing metrics from {customStartDate} to {customEndDate}</span>
          </div>
        )}
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Searches ({dateRange.toUpperCase()})</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalSearchesNum.toLocaleString()}</h3>
            <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +18.4% vs previous period
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Search className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Zero-Result Gaps</p>
            <h3 className="text-2xl font-black text-amber-700 mt-1">{gaps.length} Gaps</h3>
            <p className="text-xs text-slate-600 font-medium mt-1">High priority editorial queue</p>
          </div>
          <div className="flex items-center gap-2">
            <img 
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=120" 
              alt="Search Analytics Gap Preview" 
              className="w-10 h-10 rounded-xl object-cover border border-amber-200 shadow-xs shrink-0"
            />
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Click-Through Rate</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">74.2%</h3>
            <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +4.1% improvement
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Tools & Calculators</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">28 Tools</h3>
            <p className="text-xs text-slate-600 font-medium mt-1">98.9% uptime & accuracy</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Wrench className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts Section: User Interaction Trends & Intent Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interaction Trends Area Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">User Interaction Trends ({dateRange.toUpperCase()})</h3>
              <p className="text-xs text-slate-500 mt-0.5">Engagement volume across articles, tax tools, shop, and LMS academy</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Filtered by {dateRange.toUpperCase()}</span>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={scaledTrends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTools" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="colorArticles" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="tools" name="Tax Tools & Calculators" stroke="#059669" fillOpacity={1} fill="url(#colorTools)" />
                <Area type="monotone" dataKey="articles" name="Articles & Guides" stroke="#10b981" fillOpacity={1} fill="url(#colorArticles)" />
                <Area type="monotone" dataKey="shop" name="Shop & Templates" stroke="#34d399" fill="#34d399" fillOpacity={0.3} />
                <Area type="monotone" dataKey="lms" name="LMS Academy" stroke="#6ee7b7" fill="#6ee7b7" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Search Intent Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Search Intent Share</h3>
            <p className="text-xs text-slate-500 mt-0.5">Categorized user search objectives</p>
          </div>
          <div className="h-64 w-full flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={INTENT_DISTRIBUTION_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {INTENT_DISTRIBUTION_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 pt-2 border-t border-slate-100">
            {INTENT_DISTRIBUTION_DATA.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Search Queries Table & Content Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Queries Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Top Search Queries ({dateRange.toUpperCase()})</h3>
              <p className="text-xs text-slate-500 mt-0.5">Most frequent keywords entered by users in the platform search bar</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter queries..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 w-44"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="All">All Categories</option>
                <option value="Tax">Tax</option>
                <option value="Corporate">Corporate</option>
                <option value="VAT">VAT</option>
                <option value="Tools">Tools</option>
                <option value="Shop">Shop</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-6">Search Query</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Search Volume</th>
                  <th className="py-3 px-4 text-right">Matching Results</th>
                  <th className="py-3 px-6 text-center">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredQueries.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-slate-900 flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{item.query}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">
                      {item.count.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-600">
                      {item.resultsFound} found
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md text-[11px]">
                        <TrendingUp className="w-3 h-3" />
                        <span>High</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Content Gaps & Zero-Result Identification Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-bold text-slate-900">Identified Content Gaps</h3>
              </div>
              <span className="bg-amber-100 text-amber-800 font-extrabold text-xs px-2.5 py-0.5 rounded-full">
                {gaps.length} Gaps
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Queries with zero or low matching results indicating high-demand topics where new articles or templates should be published.
            </p>

            <form onSubmit={handleAddCustomGap} className="mb-4 flex gap-2">
              <input
                type="text"
                placeholder="Add missing keyword..."
                value={newGapInput}
                onChange={(e) => setNewGapInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1 shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Track</span>
              </button>
            </form>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {gaps.map((gap, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-emerald-200 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 text-xs">{gap.query}</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      {gap.searches} searches
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed mb-2">{gap.suggestedAction}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <span className="text-[10px] font-semibold text-slate-500">Priority: <strong className="text-slate-800">{gap.priority}</strong></span>
                    <button
                      onClick={() => {
                        setSuccessMsg(`Assigned editorial task for "${gap.query}". Redirecting to content studio...`);
                        setTimeout(() => setSuccessMsg(null), 3000);
                      }}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Create Content</span>
                      <FileText className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 text-center">
            <p className="text-[11px] text-slate-500">
              Content gaps are automatically recorded when user search strings return zero articles or tools.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
