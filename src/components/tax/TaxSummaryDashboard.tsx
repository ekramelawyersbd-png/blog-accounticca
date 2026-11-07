import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  PieChart as PieChartIcon,
  BarChart3,
  TrendingUp,
  Percent,
  Coins,
  ShieldAlert,
  ShieldCheck,
  Info,
  Sparkles,
  ArrowUpRight,
  Filter,
  Layers,
  HelpCircle,
  Scale
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export interface TaxSummaryDashboardProps {
  className?: string;
  // Optional external values; if not passed, uses standard statutory benchmark defaults
  incomeData?: {
    employment?: number;
    rent?: number;
    agriculture?: number;
    business?: number;
    capitalGains?: number;
    financialAssets?: number;
    otherSources?: number;
    partnership?: number;
    spouseChild?: number;
    foreign?: number;
  };
  totalEligibleInvestment?: number;
}

export function TaxSummaryDashboard({
  className = '',
  incomeData: propIncomeData,
  totalEligibleInvestment: propInvestment
}: TaxSummaryDashboardProps) {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  // State: Interactive income heads breakdown
  const [incomes, setIncomes] = useState({
    employment: propIncomeData?.employment ?? 1000000,
    rent: propIncomeData?.rent ?? 300000,
    agriculture: propIncomeData?.agriculture ?? 0,
    business: propIncomeData?.business ?? 500000,
    capitalGains: propIncomeData?.capitalGains ?? 0,
    financialAssets: propIncomeData?.financialAssets ?? 200000,
    otherSources: propIncomeData?.otherSources ?? 50000,
    partnership: propIncomeData?.partnership ?? 200000,
    spouseChild: propIncomeData?.spouseChild ?? 0,
    foreign: propIncomeData?.foreign ?? 0
  });

  const [eligibleInvestment, setEligibleInvestment] = useState<number>(propInvestment ?? 450000);
  const [chartView, setChartView] = useState<'both' | 'pie' | 'comparison'>('both');
  const [activeHeadFilter, setActiveHeadFilter] = useState<'all' | 'nonZero'>('nonZero');

  // Head configuration with statutory metadata & distinct theme colors
  const HEAD_CONFIG = useMemo(() => [
    { id: 'employment', nameEn: 'Employment / Salary', nameBn: 'চাকরি / বেতন', color: '#2563EB', headNum: 1, isRebateQualifying: true },
    { id: 'rent', nameEn: 'Rent / House Property', nameBn: 'বাড়ি ভাড়া / গৃহ সম্পত্তি', color: '#4F46E5', headNum: 2, isRebateQualifying: true },
    { id: 'agriculture', nameEn: 'Agriculture', nameBn: 'কৃষি হতে আয়', color: '#059669', headNum: 3, isRebateQualifying: true },
    { id: 'business', nameEn: 'Business / Profession', nameBn: 'ব্যবসা বা পেশা', color: '#D97706', headNum: 4, isRebateQualifying: true },
    { id: 'capitalGains', nameEn: 'Capital Gains', nameBn: 'মূলধনি মুনাফা', color: '#7C3AED', headNum: 5, isRebateQualifying: true },
    { id: 'financialAssets', nameEn: 'Financial Assets', nameBn: 'আর্থিক পরিসম্পদ', color: '#0891B2', headNum: 6, isRebateQualifying: true },
    { id: 'otherSources', nameEn: 'Other Sources', nameBn: 'অন্যান্য উৎস', color: '#E11D48', headNum: 7, isRebateQualifying: true },
    { id: 'partnership', nameEn: 'Partnership Firm / AOP', nameBn: 'অংশীদারি ফার্মের মুনাফা', color: '#EA580C', headNum: 8, isRebateQualifying: false }, // Excluded under Section 78!
    { id: 'spouseChild', nameEn: 'Spouse / Minor Child', nameBn: 'স্বামী/স্ত্রী/সন্তানের আয়', color: '#0D9488', headNum: 9, isRebateQualifying: true },
    { id: 'foreign', nameEn: 'Foreign Income', nameBn: 'বৈদেশিক আয়', color: '#475569', headNum: 10, isRebateQualifying: true },
  ], []);

  // Total Income (Aggregate of all heads)
  const totalIncome = useMemo(() => {
    return Object.values(incomes).reduce((sum, v) => sum + (v || 0), 0);
  }, [incomes]);

  // Section 78 Qualifying Rebate Base (Excludes Partnership Firm profit share)
  const qualifyingRebateBase = useMemo(() => {
    return totalIncome - (incomes.partnership || 0);
  }, [totalIncome, incomes.partnership]);

  // 3-Limit Investment Tax Rebate Formulation (Assessment Year 2026-2027)
  const limit1_3PercentIncome = Math.round(qualifyingRebateBase * 0.03);
  const limit2_10PercentInvestment = Math.round(eligibleInvestment * 0.10);
  const limit3_StatutoryCap = 750000;

  const allowableRebate = Math.min(limit1_3PercentIncome, limit2_10PercentInvestment, limit3_StatutoryCap);
  const optimalInvestmentForFullRebate = Math.round(limit1_3PercentIncome / 0.10);

  // Formatted data for Recharts Pie Chart
  const pieData = useMemo(() => {
    const data = HEAD_CONFIG.map(cfg => {
      const val = incomes[cfg.id as keyof typeof incomes] || 0;
      return {
        id: cfg.id,
        name: isBn ? cfg.nameBn : cfg.nameEn,
        value: val,
        percentage: totalIncome > 0 ? ((val / totalIncome) * 100).toFixed(1) : '0',
        color: cfg.color,
        isRebateQualifying: cfg.isRebateQualifying,
        headNum: cfg.headNum
      };
    });

    if (activeHeadFilter === 'nonZero') {
      return data.filter(d => d.value > 0);
    }
    return data;
  }, [incomes, HEAD_CONFIG, isBn, totalIncome, activeHeadFilter]);

  // Formatted data for Comparison Bar Chart (Total Income vs Qualifying Base vs Limits)
  const comparisonBarData = useMemo(() => {
    return [
      {
        category: isBn ? 'মোট আয় ও রেয়াত ভিত্তি' : 'Income & Rebate Base',
        [isBn ? 'মোট করযোগ্য আয়' : 'Total Income']: totalIncome,
        [isBn ? 'ধারা ৭৮ রেয়াত ভিত্তি' : 'Sec 78 Rebate Base']: qualifyingRebateBase,
        [isBn ? 'ফার্ম মুনাফা (বাদ)' : 'Excluded Firm Share']: incomes.partnership || 0,
      }
    ];
  }, [totalIncome, qualifyingRebateBase, incomes.partnership, isBn]);

  // Recharts Bar Data for the 3 Limits
  const rebateLimitsBarData = useMemo(() => {
    return [
      {
        limitName: isBn ? '১. আয়ের ৩%' : '1. 3% of Income',
        amount: limit1_3PercentIncome,
        fill: '#10B981',
        isGoverning: allowableRebate === limit1_3PercentIncome,
        description: isBn ? `রেয়াত ভিত্তি ৳${qualifyingRebateBase.toLocaleString('en-IN')}-এর ৩%` : `3% of Tk. ${qualifyingRebateBase.toLocaleString('en-IN')}`
      },
      {
        limitName: isBn ? '২. বিনিয়োগের ১০%' : '2. 10% of Invest.',
        amount: limit2_10PercentInvestment,
        fill: '#3B82F6',
        isGoverning: allowableRebate === limit2_10PercentInvestment,
        description: isBn ? `বিনিয়োগ ৳${eligibleInvestment.toLocaleString('en-IN')}-এর ১০%` : `10% of Tk. ${eligibleInvestment.toLocaleString('en-IN')}`
      },
      {
        limitName: isBn ? '৩. সর্বোচ্চ সীমা' : '3. Statutory Cap',
        amount: limit3_StatutoryCap,
        fill: '#64748B',
        isGoverning: allowableRebate === limit3_StatutoryCap,
        description: isBn ? 'আইনসম্মত সর্বোচ্চ ক্যাপ' : 'Statutory Maximum Ceiling'
      }
    ];
  }, [limit1_3PercentIncome, limit2_10PercentInvestment, limit3_StatutoryCap, allowableRebate, qualifyingRebateBase, eligibleInvestment, isBn]);

  const handleIncomeChange = (key: keyof typeof incomes, value: number) => {
    setIncomes(prev => ({
      ...prev,
      [key]: Math.max(0, value)
    }));
  };

  return (
    <div className={`bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden ${className}`}>
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold tracking-wide uppercase border border-emerald-500/30 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isBn ? 'রিয়েল-টাইম ভিজ্যুয়াল ড্যাশবোর্ড' : 'Interactive Visual Analytics'}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {isBn ? 'আয়ের খাত ও ৩% কর রেয়াত তুলনামূলক ড্যাশবোর্ড' : 'Tax Summary Dashboard: Income Heads & 3% Rebate'}
            </h3>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
              {isBn 
                ? '১০টি খাতের আয় বিন্যাস, মোট আয়ের অনুপাত এবং ধারা ৭৮ অনুযায়ী ৩% বিনিয়োগ কর রেয়াতের ভিত্তি রিয়েল-টাইম চার্টে যাচাই করুন।' 
                : 'Interactive Recharts visualization mapping the distribution of statutory income heads and demonstrating how the 3% rebate ceiling compares with overall Total Income.'}
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 px-4 py-3 rounded-2xl">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                {isBn ? 'মোট পরিগণিত আয়' : 'Total Income'}
              </div>
              <div className="text-lg sm:text-xl font-black text-white font-mono mt-0.5">
                ৳ {totalIncome.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 px-4 py-3 rounded-2xl">
              <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                {isBn ? 'অনুমোদনযোগ্য ৩% রেয়াত' : '3% Rebate Limit'}
              </div>
              <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono mt-0.5">
                ৳ {limit1_3PercentIncome.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>

        {/* View Switcher Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setChartView('both')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                chartView === 'both' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isBn ? 'উভয় চার্ট' : 'Combined View'}</span>
            </button>
            <button
              onClick={() => setChartView('pie')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                chartView === 'pie' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <PieChartIcon className="w-3.5 h-3.5" />
              <span>{isBn ? 'খাতভিত্তিক অনুপাত' : 'Heads Breakdown'}</span>
            </button>
            <button
              onClick={() => setChartView('comparison')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                chartView === 'comparison' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{isBn ? 'রেয়াত ও সীমা তুলনা' : 'Rebate Comparison'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveHeadFilter(activeHeadFilter === 'all' ? 'nonZero' : 'all')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium border border-slate-700 transition flex items-center gap-1.5"
            >
              <Filter className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                {activeHeadFilter === 'nonZero' 
                  ? (isBn ? 'শুধুমাত্র সক্রিয় খাত' : 'Active Heads (> 0)') 
                  : (isBn ? 'সকল ১০টি খাত' : 'Show All 10 Heads')}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Workspace */}
      <div className="p-5 sm:p-8 space-y-8">
        
        {/* Visual Charts Grid */}
        <div className={`grid gap-8 ${chartView === 'both' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
          
          {/* Chart 1: Donut / Pie Breakdown of Income Heads */}
          {(chartView === 'both' || chartView === 'pie') && (
            <div className={`${chartView === 'both' ? 'lg:col-span-6' : 'w-full'} bg-slate-50/70 border border-slate-200/90 rounded-2xl p-5 sm:p-6 flex flex-col`}>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-900 uppercase tracking-wider">
                    <PieChartIcon className="w-4 h-4 text-indigo-600" />
                    <span>{isBn ? 'আয়ের খাত বিন্যাস (১০টি খাত)' : 'Income Distribution by Statutory Heads'}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isBn ? 'মোট আয়ে প্রতিটি খাতের শতকরা হার' : 'Percentage contribution of each head to Total Income'}
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700">
                  {pieData.length} {isBn ? 'টি খাত' : 'Heads'}
                </span>
              </div>

              {/* Chart container */}
              <div className="h-72 sm:h-80 w-full relative">
                {totalIncome > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={105}
                        paddingAngle={3}
                      >
                        {pieData.map((entry) => (
                          <Cell key={entry.id} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1">
                                <div className="font-bold flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                                  <span>{data.name}</span>
                                </div>
                                <div className="font-mono text-emerald-400 font-bold text-sm">
                                  ৳ {Number(data.value).toLocaleString('en-IN')}
                                </div>
                                <div className="text-slate-300">
                                  {isBn ? 'মোট আয়ের' : 'Share of Total'}: <strong className="text-white">{data.percentage}%</strong>
                                </div>
                                {!data.isRebateQualifying && (
                                  <div className="text-amber-400 text-[10px] font-semibold border-t border-slate-800 pt-1">
                                    ⚠️ {isBn ? 'ধারা ৭৮-এর ৩% রেয়াত ভিত্তি থেকে বাদ' : 'Excluded from Sec 78 3% rebate base'}
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        iconType="circle"
                        wrapperStyle={{ fontSize: '11px', paddingTop: '16px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                    <Info className="w-8 h-8 mb-2 opacity-50" />
                    <span>{isBn ? 'কোনো আয়ের অংক পাওয়া যায়নি।' : 'No income figures entered.'}</span>
                  </div>
                )}

                {/* Center Badge in Donut */}
                {totalIncome > 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {isBn ? 'মোট আয়' : 'Total Income'}
                    </span>
                    <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
                      ৳ {(totalIncome / 100000).toFixed(1)}L
                    </span>
                  </div>
                )}
              </div>

              {/* Notice beneath chart */}
              <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C]" />
                  <span>{isBn ? 'অংশীদারি ফার্মের আয় (ধারা ৭৮ অনুযায়ী ৩% রেয়াত ভিত্তি হতে বাদ)' : 'Partnership share excluded from 3% rebate base'}</span>
                </span>
                <span className="font-mono font-bold text-slate-800">
                  ৳ {(incomes.partnership || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}

          {/* Chart 2: 3% Investment Rebate vs Total Income Comparison Bar Chart */}
          {(chartView === 'both' || chartView === 'comparison') && (
            <div className={`${chartView === 'both' ? 'lg:col-span-6' : 'w-full'} bg-slate-50/70 border border-slate-200/90 rounded-2xl p-5 sm:p-6 flex flex-col`}>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                    <span>{isBn ? '৩% রেয়াত বনাম ৩টি আইনসম্মত সীমা' : '3% Rebate Ceiling vs Statutory Limits'}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isBn ? 'আয়কর আইন ২০২৩-এর ৩টি সীমার মধ্যে সর্বনিম্ন অংকটি গ্রহণযোগ্য' : 'Rebate equals the lowest among the three statutory limits'}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-lg">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isBn ? 'আইনসম্মত ৩ সীমা' : 'AY 2026-27'}</span>
                </div>
              </div>

              {/* Bar Chart Container */}
              <div className="h-72 sm:h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={rebateLimitsBarData} 
                    margin={{ top: 20, right: 20, left: 10, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis 
                      dataKey="limitName" 
                      tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                      interval={0}
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: '#64748B' }}
                      tickFormatter={(val) => `৳${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1">
                              <div className="font-bold text-slate-200">{data.limitName}</div>
                              <div className="font-mono text-emerald-400 font-bold text-sm">
                                ৳ {Number(data.amount).toLocaleString('en-IN')}
                              </div>
                              <div className="text-slate-400 text-[11px]">{data.description}</div>
                              {data.isGoverning && (
                                <div className="text-emerald-300 font-bold text-[10px] bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40 inline-block mt-1">
                                  ★ {isBn ? 'চূড়ান্ত গ্রহণযোগ্য রেয়াত (সর্বনিম্ন)' : 'Governing Allowable Rebate'}
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine 
                      y={allowableRebate} 
                      stroke="#10B981" 
                      strokeDasharray="4 4" 
                      strokeWidth={2}
                      label={{ 
                        value: isBn ? `অনুমোদিত: ৳${allowableRebate.toLocaleString('en-IN')}` : `Allowable: ৳${allowableRebate.toLocaleString('en-IN')}`, 
                        position: 'top', 
                        fill: '#047857', 
                        fontSize: 10, 
                        fontWeight: 700 
                      }} 
                    />
                    <Bar dataKey="amount" radius={[8, 8, 0, 0]} maxBarSize={60}>
                      {rebateLimitsBarData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.isGoverning ? '#10B981' : entry.fill} 
                          opacity={entry.isGoverning ? 1 : 0.75}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Status explanation */}
              <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>{isBn ? 'চূড়ান্ত অনুমোদনযোগ্য কর রেয়াত:' : 'Net Allowable Tax Rebate:'}</span>
                  <span className="text-emerald-700 font-mono text-sm">৳ {allowableRebate.toLocaleString('en-IN')}</span>
                </div>
                <div className="text-slate-500 flex items-center justify-between">
                  <span>{isBn ? 'পূর্ণ ৩% রেয়াত দাবি করতে প্রয়োজনীয় বিনিয়োগ:' : 'Investment required to max 3% rebate:'}</span>
                  <span className="font-mono font-semibold text-slate-800">৳ {optimalInvestmentForFullRebate.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Live Head Inputs & Simulation Controls */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-200 pb-4">
            <div>
              <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Coins className="w-5 h-5 text-indigo-600" />
                <span>{isBn ? 'খাতভিত্তিক আয়ের অংক পরিবর্তন করুন (সিমুলেশন)' : 'Simulate Income Amounts Across Heads'}</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {isBn 
                  ? 'নিচের খাতসমূহের আয় পরিবর্তন করে তাৎক্ষণিকভাবে মোট আয় ও ৩% রেয়াতের প্রভাব পর্যবেক্ষণ করুন।' 
                  : 'Adjust figures across statutory heads below to watch the live recalculation of Total Income and Section 78 limits.'}
              </p>
            </div>
            
            {/* Quick Presets */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIncomes({
                  employment: 1200000,
                  rent: 360000,
                  agriculture: 0,
                  business: 600000,
                  capitalGains: 150000,
                  financialAssets: 250000,
                  otherSources: 50000,
                  partnership: 300000,
                  spouseChild: 0,
                  foreign: 0
                })}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition"
              >
                {isBn ? 'পেশাজীবী কেস' : 'Executive Case'}
              </button>
              <button
                type="button"
                onClick={() => setIncomes({
                  employment: 800000,
                  rent: 0,
                  agriculture: 0,
                  business: 0,
                  capitalGains: 0,
                  financialAssets: 100000,
                  otherSources: 0,
                  partnership: 0,
                  spouseChild: 0,
                  foreign: 0
                })}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition"
              >
                {isBn ? 'শুধুমাত্র বেতন' : 'Salary Only'}
              </button>
            </div>
          </div>

          {/* 10 Heads Input Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {HEAD_CONFIG.map((head) => {
              const val = incomes[head.id as keyof typeof incomes] || 0;
              return (
                <div key={head.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: head.color }}>
                      0{head.headNum}
                    </span>
                    {!head.isRebateQualifying && (
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1 rounded">
                        {isBn ? '৩% রেয়াত বাদ' : 'No 3% Base'}
                      </span>
                    )}
                  </div>
                  <label className="text-xs font-bold text-slate-800 line-clamp-1 mb-1" title={isBn ? head.nameBn : head.nameEn}>
                    {isBn ? head.nameBn : head.nameEn}
                  </label>
                  <div className="relative mt-auto">
                    <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">৳</span>
                    <input
                      type="number"
                      min="0"
                      value={val || ''}
                      onChange={(e) => handleIncomeChange(head.id as keyof typeof incomes, Number(e.target.value) || 0)}
                      className="w-full text-xs font-mono font-bold pl-6 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Investment Amount Input */}
          <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  {isBn ? 'ষষ্ঠ তফসিল অনুযায়ী যোগ্য বিনিয়োগ (টাকা):' : 'Eligible Investment under Part 2 (Tk.):'}
                </label>
                <span className="text-[11px] text-slate-500">
                  {isBn ? 'ডিপিএস (সর্বোচ্চ ১.২ লাখ), সঞ্চয়পত্র, জীবন বীমা, ট্রেজারি বন্ড ইত্যাদি।' : 'DPS (cap 1.2L), Sanchayapatra, Life Insurance, Treasury Bonds.'}
                </span>
              </div>
            </div>
            
            <div className="relative w-full sm:w-60">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">৳</span>
              <input
                type="number"
                min="0"
                value={eligibleInvestment || ''}
                onChange={(e) => setEligibleInvestment(Math.max(0, Number(e.target.value) || 0))}
                className="w-full text-sm font-mono font-bold pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="450000"
              />
            </div>
          </div>
        </div>

        {/* Section 78 Statutory Explanatory Card */}
        <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 text-xs text-indigo-950 flex flex-col sm:flex-row items-start gap-3.5">
          <Info className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <span className="font-bold text-sm">
              {isBn 
                ? 'আয়কর আইন ২০২৩-এর ধারা ৭৮ এবং ৩% রেয়াত গণনার মৌলিক পার্থক্য:' 
                : 'Key Statutory Distinction: Total Income vs Section 78 Rebate Limit'}
            </span>
            <p>
              {isBn 
                ? `আপনার মোট আয় ৳${totalIncome.toLocaleString('en-IN')}, কিন্তু ধারা ৭৮ অনুযায়ী অংশীদারি ফার্মের মুনাফা (৳${(incomes.partnership || 0).toLocaleString('en-IN')}) রেয়াত গণনায় বাদ যাওয়ায় রেয়াত ভিত্তি হলো ৳${qualifyingRebateBase.toLocaleString('en-IN')}। অতএব, ৩% সীমা দাঁড়ায় ৳${limit1_3PercentIncome.toLocaleString('en-IN')} (ভুলবশত মোট আয়ের উপর ৩% দাবি করলে কর দাবি বাতিল হতে পারে)।`
                : `Total Income is Tk. ${totalIncome.toLocaleString('en-IN')}. However, Section 78 excludes partnership profits (Tk. ${(incomes.partnership || 0).toLocaleString('en-IN')}) because the firm is separately taxed. Thus, your qualifying rebate base is Tk. ${qualifyingRebateBase.toLocaleString('en-IN')}, yielding a 3% rebate ceiling of Tk. ${limit1_3PercentIncome.toLocaleString('en-IN')}. Claiming 3% on unadjusted Total Income leads to erroneous assessments.`}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
