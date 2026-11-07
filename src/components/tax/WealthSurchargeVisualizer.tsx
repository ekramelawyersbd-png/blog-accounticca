import React, { useState, useMemo } from 'react';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  CartesianGrid
} from 'recharts';
import { 
  Coins, 
  ShieldCheck, 
  AlertTriangle, 
  Car, 
  Home as HomeIcon, 
  Info, 
  ExternalLink, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  HelpCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface WealthSurchargeVisualizerProps {
  initialPayableTax?: number;
  showCardWrapper?: boolean;
  className?: string;
  onWealthChange?: (netWealth: number, surchargeAmount: number, surchargeRate: number) => void;
}

interface SurchargeBracket {
  id: string;
  name: string;
  rangeLabel: string;
  minCrore: number;
  maxCrore: number; // 999 for 50+
  minBdt: number;
  maxBdt: number;
  statutoryRate: number; // in percent, e.g. 10
  tierName: string;
  description: string;
  color: string;
  accentBg: string;
}

const BRACKETS: SurchargeBracket[] = [
  {
    id: 'slab_0',
    name: 'Up to 4 Cr',
    rangeLabel: '≤ 4 Crore',
    minCrore: 0,
    maxCrore: 4,
    minBdt: 0,
    maxBdt: 40000000,
    statutoryRate: 0,
    tierName: 'Standard Exemption',
    description: 'No surcharge unless luxury conditions apply (>1 motor car or >8,000 sq ft residential property).',
    color: '#10b981', // emerald-500
    accentBg: 'bg-emerald-50 border-emerald-200 text-emerald-900'
  },
  {
    id: 'slab_10',
    name: '4 Cr – 10 Cr',
    rangeLabel: '> 4 Cr to 10 Cr',
    minCrore: 4,
    maxCrore: 10,
    minBdt: 40000001,
    maxBdt: 100000000,
    statutoryRate: 10,
    tierName: 'Moderate Tier',
    description: '10% additional surcharge on assessed regular payable income tax.',
    color: '#06b6d4', // cyan-500
    accentBg: 'bg-cyan-50 border-cyan-200 text-cyan-900'
  },
  {
    id: 'slab_20',
    name: '10 Cr – 20 Cr',
    rangeLabel: '> 10 Cr to 20 Cr',
    minCrore: 10,
    maxCrore: 20,
    minBdt: 100000001,
    maxBdt: 200000000,
    statutoryRate: 20,
    tierName: 'Substantial Wealth Tier',
    description: '20% additional surcharge on assessed regular payable income tax.',
    color: '#3b82f6', // blue-500
    accentBg: 'bg-blue-50 border-blue-200 text-blue-900'
  },
  {
    id: 'slab_30',
    name: '20 Cr – 50 Cr',
    rangeLabel: '> 20 Cr to 50 Cr',
    minCrore: 20,
    maxCrore: 50,
    minBdt: 200000001,
    maxBdt: 500000000,
    statutoryRate: 30,
    tierName: 'High Wealth Bracket',
    description: '30% additional surcharge on assessed regular payable income tax.',
    color: '#8b5cf6', // purple-500
    accentBg: 'bg-purple-50 border-purple-200 text-purple-900'
  },
  {
    id: 'slab_35',
    name: 'Above 50 Cr',
    rangeLabel: '> 50 Crore',
    minCrore: 50,
    maxCrore: 100,
    minBdt: 500000001,
    maxBdt: 9999999999,
    statutoryRate: 35,
    tierName: 'Ultra-High-Net-Worth (Max)',
    description: '35% maximum statutory surcharge on assessed regular payable income tax.',
    color: '#f43f5e', // rose-500
    accentBg: 'bg-rose-50 border-rose-200 text-rose-900'
  }
];

const PRESETS = [
  { label: '2.5 Cr', valueCrore: 2.5, bdt: 25000000 },
  { label: '4.0 Cr', valueCrore: 4.0, bdt: 40000000 },
  { label: '7.5 Cr', valueCrore: 7.5, bdt: 75000000 },
  { label: '15.0 Cr', valueCrore: 15.0, bdt: 150000000 },
  { label: '35.0 Cr', valueCrore: 35.0, bdt: 350000000 },
  { label: '65.0 Cr', valueCrore: 65.0, bdt: 650000000 },
];

export function WealthSurchargeVisualizer({
  initialPayableTax = 500000,
  showCardWrapper = true,
  className = '',
  onWealthChange
}: WealthSurchargeVisualizerProps) {
  // State: Net Wealth in BDT
  const [netWealthBdt, setNetWealthBdt] = useState<number>(75000000); // Default 7.5 Crore
  const [payableTax, setPayableTax] = useState<number>(initialPayableTax);
  
  // Luxury Asset Triggers
  const [ownsMultipleCars, setOwnsMultipleCars] = useState<boolean>(false);
  const [ownsLargeProperty, setOwnsLargeProperty] = useState<boolean>(false);
  
  // Optional Special Surcharges
  const [hasTobaccoIncome, setHasTobaccoIncome] = useState<boolean>(false);
  const [tobaccoIncomeBdt, setTobaccoIncomeBdt] = useState<number>(20000000);
  const [additionalCarsCount, setAdditionalCarsCount] = useState<number>(1);
  const [avgCarCcSlab, setAvgCarCcSlab] = useState<number>(75000); // e.g. 2001-2500cc = 75,000 BDT

  // Sync payableTax if prop changes
  React.useEffect(() => {
    if (initialPayableTax > 0) {
      setPayableTax(initialPayableTax);
    }
  }, [initialPayableTax]);

  const wealthInCrore = useMemo(() => {
    return Number((netWealthBdt / 10000000).toFixed(2));
  }, [netWealthBdt]);

  // Determine active bracket and applicable surcharge rate
  const assessment = useMemo(() => {
    let activeBracket = BRACKETS[0];
    let rate = 0;
    let isTriggeredByLuxury = false;
    let triggerReasons: string[] = [];

    if (wealthInCrore > 50) {
      activeBracket = BRACKETS[4];
      rate = 35;
    } else if (wealthInCrore > 20) {
      activeBracket = BRACKETS[3];
      rate = 30;
    } else if (wealthInCrore > 10) {
      activeBracket = BRACKETS[2];
      rate = 20;
    } else if (wealthInCrore > 4) {
      activeBracket = BRACKETS[1];
      rate = 10;
    } else {
      activeBracket = BRACKETS[0];
      rate = 0;
      // Check luxury rules for wealth <= 4 Crore
      if (ownsMultipleCars) {
        rate = 10;
        isTriggeredByLuxury = true;
        triggerReasons.push('Ownership of more than one motor car');
      }
      if (ownsLargeProperty) {
        rate = 10;
        isTriggeredByLuxury = true;
        triggerReasons.push('Residential house property exceeding 8,000 sq. ft.');
      }
    }

    const wealthSurchargeAmount = Math.round(payableTax * (rate / 100));

    // Tobacco Surcharge: 2.5% on tobacco income if wealth > 4 Crore
    let tobaccoSurchargeAmount = 0;
    if (wealthInCrore > 4 && hasTobaccoIncome) {
      tobaccoSurchargeAmount = Math.round(tobaccoIncomeBdt * 0.025);
    }

    // Environmental Surcharge: fixed amount per additional car
    let environmentalSurchargeAmount = 0;
    if (ownsMultipleCars && additionalCarsCount > 0) {
      environmentalSurchargeAmount = additionalCarsCount * avgCarCcSlab;
    }

    const totalSurcharge = wealthSurchargeAmount + tobaccoSurchargeAmount + environmentalSurchargeAmount;
    const totalOutflow = payableTax + totalSurcharge;

    return {
      activeBracket,
      effectiveRate: rate,
      isTriggeredByLuxury,
      triggerReasons,
      wealthSurchargeAmount,
      tobaccoSurchargeAmount,
      environmentalSurchargeAmount,
      totalSurcharge,
      totalOutflow
    };
  }, [
    wealthInCrore, 
    ownsMultipleCars, 
    ownsLargeProperty, 
    payableTax, 
    hasTobaccoIncome, 
    tobaccoIncomeBdt, 
    additionalCarsCount, 
    avgCarCcSlab
  ]);

  // Call onWealthChange callback
  React.useEffect(() => {
    if (onWealthChange) {
      onWealthChange(netWealthBdt, assessment.wealthSurchargeAmount, assessment.effectiveRate);
    }
  }, [netWealthBdt, assessment.wealthSurchargeAmount, assessment.effectiveRate, onWealthChange]);

  // Chart Data Preparation
  const chartData = useMemo(() => {
    return BRACKETS.map(b => {
      const isCurrent = b.id === assessment.activeBracket.id;
      // If luxury override is active on slab 0, display 10% on slab 0
      const displayRate = (b.id === 'slab_0' && assessment.isTriggeredByLuxury) 
        ? 10 
        : b.statutoryRate;

      return {
        name: b.name,
        rangeLabel: b.rangeLabel,
        statutoryRate: displayRate,
        baseRate: b.statutoryRate,
        isCurrent,
        color: b.color,
        tierName: b.tierName,
        minCr: b.minCrore,
        maxCr: b.maxCrore,
        userWealthCr: wealthInCrore,
        isLuxuryTriggered: b.id === 'slab_0' && assessment.isTriggeredByLuxury
      };
    });
  }, [assessment.activeBracket.id, assessment.isTriggeredByLuxury, wealthInCrore]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valCrore = parseFloat(e.target.value);
    setNetWealthBdt(Math.round(valCrore * 10000000));
  };

  const handleBdtInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanNum = parseInt(e.target.value.replace(/[^0-9]/g, '') || '0', 10);
    setNetWealthBdt(cleanNum);
  };

  const content = (
    <div id="wealth-surcharge-visualizer" className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Coins className="w-3.5 h-3.5 text-emerald-600" />
            <span>Section 2(86B) • Finance Act 2026</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Wealth-Based Surcharge <span className="text-emerald-600">Visualizer</span>
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Visualize progressive surcharge brackets (0% to 35%) under the Income Tax Act, 2023. Adjust your net wealth to see where your balance sheet sits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/article/understanding-surcharge-income-tax-act-2023-bangladesh-wealth-rates"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors shrink-0"
            title="Read statutory wealth surcharge guide"
          >
            <span>Legal Guide</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/article/special-surcharge-rules-tobacco-environmental-income-tax-act-2023"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors shrink-0"
            title="Read environmental and tobacco surcharge rules"
          >
            <span>Vehicle & Tobacco Rules</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Controls & Inputs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Inputs (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-50 border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-6">
          
          {/* Net Wealth Input */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="net-wealth-input" className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-emerald-600" />
                <span>Total Net Wealth (Form IT-10B)</span>
              </label>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                {wealthInCrore.toLocaleString()} Crore BDT
              </span>
            </div>
            
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-sm">
                Tk
              </span>
              <input
                id="net-wealth-input"
                type="text"
                value={netWealthBdt.toLocaleString('en-US')}
                onChange={handleBdtInputChange}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="75,000,000"
              />
            </div>

            {/* Slider */}
            <div className="mt-3">
              <div className="flex justify-between text-[11px] text-slate-400 font-semibold mb-1">
                <span>0 Cr</span>
                <span>20 Cr</span>
                <span>50 Cr</span>
                <span>100 Cr</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="0.5"
                value={Math.min(100, wealthInCrore)}
                onChange={handleSliderChange}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setNetWealthBdt(p.bdt)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition-all ${
                    Math.abs(wealthInCrore - p.valueCrore) < 0.1
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Regular Payable Tax Input */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="payable-income-tax-input" className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Payable Income Tax (Base)</span>
              </label>
              <span className="text-xs text-slate-500">From Income Assessment</span>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-sm">
                Tk
              </span>
              <input
                id="payable-income-tax-input"
                type="number"
                min="0"
                value={payableTax}
                onChange={(e) => setPayableTax(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="500000"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Surcharge is calculated as a percentage of regular payable income tax, not on gross wealth.
            </p>
          </div>

          {/* Luxury Asset Override Toggles */}
          <div className="pt-3 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Special Luxury Asset Triggers
              </span>
              <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-1.5 py-0.5 rounded">
                10% Surcharge Rule
              </span>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
              <input
                type="checkbox"
                checked={ownsMultipleCars}
                onChange={(e) => setOwnsMultipleCars(e.target.checked)}
                className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 flex items-center gap-1">
                  <Car className="w-3.5 h-3.5 text-slate-600" />
                  Owns More Than One Motor Car
                </span>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Triggers 10% surcharge even if net wealth is ≤ 4 Crore.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
              <input
                type="checkbox"
                checked={ownsLargeProperty}
                onChange={(e) => setOwnsLargeProperty(e.target.checked)}
                className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 flex items-center gap-1">
                  <HomeIcon className="w-3.5 h-3.5 text-slate-600" />
                  Residential Property Exceeding 8,000 sq. ft.
                </span>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Cumulative plinth area triggers 10% surcharge even if net wealth ≤ 4 Cr.
                </p>
              </div>
            </label>
          </div>

          {/* Environmental & Tobacco Addon Toggles */}
          <div className="pt-3 border-t border-slate-200 space-y-3">
            <details className="group">
              <summary className="text-xs font-bold text-slate-700 cursor-pointer hover:text-emerald-700 flex items-center justify-between">
                <span>Environmental & Tobacco Surcharges</span>
                <span className="text-[10px] text-slate-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="mt-3 space-y-3 pt-2">
                {ownsMultipleCars && (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="font-bold text-slate-800 flex items-center justify-between">
                      <span>Environmental Surcharge (Cars)</span>
                      <span className="text-emerald-700 font-bold">Tk {assessment.environmentalSurchargeAmount.toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-semibold mb-1">Additional Cars</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={additionalCarsCount}
                          onChange={(e) => setAdditionalCarsCount(parseInt(e.target.value, 10) || 1)}
                          className="w-full px-2 py-1 border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-semibold mb-1">Engine Slab Rate</label>
                        <select
                          value={avgCarCcSlab}
                          onChange={(e) => setAvgCarCcSlab(parseInt(e.target.value, 10))}
                          className="w-full px-2 py-1 border border-slate-300 rounded-lg text-xs"
                        >
                          <option value={25000}>≤ 1,500 cc (Tk 25k)</option>
                          <option value={50000}>1,501–2,000 cc (Tk 50k)</option>
                          <option value={75000}>2,001–2,500 cc (Tk 75k)</option>
                          <option value={150000}>2,501–3,000 cc (Tk 150k)</option>
                          <option value={200000}>3,001–3,500 cc (Tk 200k)</option>
                          <option value={350000}>&gt; 3,500 cc (Tk 350k)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={hasTobaccoIncome}
                      onChange={(e) => setHasTobaccoIncome(e.target.checked)}
                      className="w-3.5 h-3.5 text-emerald-600 rounded"
                    />
                    <span>Tobacco Manufacturing Income (2.5%)</span>
                  </label>
                  {hasTobaccoIncome && (
                    <div className="mt-2 space-y-1">
                      <label className="text-[10px] text-slate-500">Tobacco Business Net Income (Tk)</label>
                      <input
                        type="number"
                        value={tobaccoIncomeBdt}
                        onChange={(e) => setTobaccoIncomeBdt(parseInt(e.target.value, 10) || 0)}
                        className="w-full px-2 py-1 border border-slate-300 rounded-lg text-xs"
                      />
                      <p className="text-[10px] text-slate-500">
                        {wealthInCrore > 4 
                          ? `Eligible: 2.5% on Tk ${tobaccoIncomeBdt.toLocaleString()} = Tk ${assessment.tobaccoSurchargeAmount.toLocaleString()}`
                          : 'Inapplicable (Net wealth is not exceeding 4 Crore).'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </details>
          </div>

        </div>

        {/* Right Chart & Dynamic Assessment (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Recharts Progressive Bar Chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Progressive Surcharge Slabs (%)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Highlighting your current net wealth bracket ({wealthInCrore} Cr)
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${assessment.activeBracket.accentBg}`}>
                  <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: assessment.activeBracket.color }} />
                  <span>Your Surcharge: {assessment.effectiveRate}%</span>
                </div>
              </div>
            </div>

            {/* Recharts Container */}
            <div className="h-[270px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={chartData}
                  margin={{ top: 20, right: 15, left: -20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis 
                    domain={[0, 40]}
                    ticks={[0, 10, 20, 30, 35]}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    unit="%"
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 max-w-[240px]">
                            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1">
                              <span className="font-bold text-emerald-400">{data.tierName}</span>
                              <span className="font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                                {data.statutoryRate}%
                              </span>
                            </div>
                            <p className="text-slate-300">
                              Wealth Bracket: <strong className="text-white">{data.rangeLabel}</strong>
                            </p>
                            {data.isLuxuryTriggered && (
                              <p className="text-amber-300 text-[10px]">
                                ★ 10% triggered by luxury asset rules (&gt;1 car or &gt;8,000 sq ft)
                              </p>
                            )}
                            {data.isCurrent && (
                              <div className="pt-1 text-emerald-300 font-bold flex items-center gap-1 border-t border-slate-800 mt-1">
                                <span>✔ Your Current Tier ({data.userWealthCr} Cr)</span>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="statutoryRate" 
                    radius={[6, 6, 0, 0]}
                    barSize={44}
                  >
                    {chartData.map((entry) => (
                      <Cell 
                        key={entry.name}
                        fill={entry.isCurrent ? entry.color : '#cbd5e1'}
                        opacity={entry.isCurrent ? 1 : 0.45}
                        stroke={entry.isCurrent ? '#0f172a' : 'none'}
                        strokeWidth={entry.isCurrent ? 2 : 0}
                      />
                    ))}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>

            {/* Visual Slider Range Legend */}
            <div className="grid grid-cols-5 gap-1 pt-2 border-t border-slate-100 text-center text-[10px] font-semibold text-slate-500">
              <div className={assessment.activeBracket.id === 'slab_0' ? 'text-emerald-700 font-bold' : ''}>0% (≤4Cr)</div>
              <div className={assessment.activeBracket.id === 'slab_10' ? 'text-cyan-700 font-bold' : ''}>10% (4-10Cr)</div>
              <div className={assessment.activeBracket.id === 'slab_20' ? 'text-blue-700 font-bold' : ''}>20% (10-20Cr)</div>
              <div className={assessment.activeBracket.id === 'slab_30' ? 'text-purple-700 font-bold' : ''}>30% (20-50Cr)</div>
              <div className={assessment.activeBracket.id === 'slab_35' ? 'text-rose-700 font-bold' : ''}>35% (&gt;50Cr)</div>
            </div>
          </div>

          {/* Active Calculation Summary Matrix */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <Coins className="w-36 h-36 text-white" />
            </div>

            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Active Surcharge Assessment
                </span>
                <span className="text-xs text-slate-300 font-semibold">
                  AY 2026–2027
                </span>
              </div>

              {/* Surcharge Tier Callout */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
                <div>
                  <div className="text-xs text-slate-400">Current Net Wealth Tier</div>
                  <div className="text-base font-bold text-white flex items-center gap-2">
                    <span>{assessment.activeBracket.tierName}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      {assessment.activeBracket.rangeLabel}
                    </span>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-xs text-slate-400">Applicable Surcharge Rate</div>
                  <div className="text-2xl font-black text-emerald-400">
                    {assessment.effectiveRate}%
                  </div>
                </div>
              </div>

              {/* Luxury trigger alert if applicable */}
              {assessment.isTriggeredByLuxury && (
                <div className="bg-amber-500/20 border border-amber-400/40 rounded-xl p-3 text-xs text-amber-200 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300">Special 10% Surcharge Trigger Applied:</span>
                    <p className="mt-0.5 text-amber-100/90 text-[11px]">
                      Although net wealth ({wealthInCrore} Cr) is within the ≤ 4 Crore threshold, you are subject to 10% surcharge due to: {assessment.triggerReasons.join(' and ')}.
                    </p>
                  </div>
                </div>
              )}

              {/* Financial Outflow Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/40">
                  <div className="text-[11px] text-slate-400 font-semibold">Payable Normal Tax</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    Tk {payableTax.toLocaleString()}
                  </div>
                </div>

                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/40">
                  <div className="text-[11px] text-emerald-400 font-semibold">Wealth Surcharge ({assessment.effectiveRate}%)</div>
                  <div className="text-sm font-bold text-emerald-300 mt-0.5">
                    + Tk {assessment.wealthSurchargeAmount.toLocaleString()}
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1 bg-emerald-950/80 p-3 rounded-xl border border-emerald-700/50">
                  <div className="text-[11px] text-emerald-300 font-bold uppercase tracking-wider">Total Tax + Surcharge</div>
                  <div className="text-base font-black text-white mt-0.5">
                    Tk {assessment.totalOutflow.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* If Tobacco or Environmental surcharges are non-zero */}
              {(assessment.environmentalSurchargeAmount > 0 || assessment.tobaccoSurchargeAmount > 0) && (
                <div className="pt-2 border-t border-slate-700 text-xs text-slate-300 space-y-1">
                  {assessment.environmentalSurchargeAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Environmental Surcharge ({additionalCarsCount} extra cars):</span>
                      <span className="font-bold text-amber-300">+ Tk {assessment.environmentalSurchargeAmount.toLocaleString()}</span>
                    </div>
                  )}
                  {assessment.tobaccoSurchargeAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Tobacco Manufacturing Surcharge (2.5%):</span>
                      <span className="font-bold text-amber-300">+ Tk {assessment.tobaccoSurchargeAmount.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Consultation / Advisory prompt */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-300">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  Form IT-10B reconciliation required for net wealth &gt; 4 Crore.
                </span>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-1 text-emerald-300 hover:text-emerald-200 font-bold underline shrink-0"
                >
                  <span>Book Wealth Tax Review</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );

  if (!showCardWrapper) {
    return content;
  }

  return (
    <div className={`bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs ${className}`}>
      {content}
    </div>
  );
}
