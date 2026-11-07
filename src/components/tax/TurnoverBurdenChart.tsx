import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Layers, 
  Eye, 
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';

interface TurnoverBurdenChartProps {
  currentTurnover?: number;
  onSelectTurnover?: (turnover: number) => void;
  className?: string;
}

interface ChartDataPoint {
  turnoverCr: number;
  turnoverLabel: string;
  turnoverRaw: number;
  revisedTaxLakh: number;
  previousTaxLakh: number;
  savingsLakh: number;
  slab: string;
  ratePercent: number;
  rateLabel: string;
}

export function TurnoverBurdenChart({
  currentTurnover = 30000000,
  onSelectTurnover,
  className = ''
}: TurnoverBurdenChartProps) {
  // View mode: 'amount' (in Lakh BDT) or 'rate' (effective %)
  const [viewMode, setViewMode] = useState<'amount' | 'rate'>('amount');
  const [showPreviousComparison, setShowPreviousComparison] = useState<boolean>(true);
  const [showSlabBands, setShowSlabBands] = useState<boolean>(true);

  // Generate discrete granular data points from 0 to 10 Crore
  const chartData: ChartDataPoint[] = useMemo(() => {
    const rawPoints = [
      0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0,
      2.25, 2.5, 2.75, 3.0, 3.25, 3.5, 3.75, 4.0,
      4.5, 5.0, 5.5, 6.0, 7.0, 8.0, 9.0, 10.0
    ];

    return rawPoints.map(cr => {
      const rawTurnover = cr * 10000000;
      let rate = 0;
      let slab = 'Slab 1 (Up to 2 Cr)';
      let ratePercent = 0;

      if (rawTurnover <= 20000000) {
        rate = 0;
        ratePercent = 0;
        slab = 'Slab 1: 0% Tax-Free';
      } else if (rawTurnover <= 40000000) {
        rate = 0.005;
        ratePercent = 0.5;
        slab = 'Slab 2: 0.5% Rate';
      } else {
        rate = 0.01;
        ratePercent = 1.0;
        slab = 'Slab 3: 1.0% Rate';
      }

      const revisedTax = rawTurnover * rate;
      const previousTax = rawTurnover * 0.01;
      const savings = Math.max(0, previousTax - revisedTax);

      return {
        turnoverCr: cr,
        turnoverLabel: `${cr} Cr`,
        turnoverRaw: rawTurnover,
        revisedTaxLakh: Number((revisedTax / 100000).toFixed(2)),
        previousTaxLakh: Number((previousTax / 100000).toFixed(2)),
        savingsLakh: Number((savings / 100000).toFixed(2)),
        slab,
        ratePercent,
        rateLabel: `${ratePercent}%`
      };
    });
  }, []);

  const currentCr = Number((currentTurnover / 10000000).toFixed(2));

  // Current calculations for marker
  const currentStat = useMemo(() => {
    let rate = 0;
    if (currentTurnover <= 20000000) rate = 0;
    else if (currentTurnover <= 40000000) rate = 0.005;
    else rate = 0.01;

    const currentTaxLakh = (currentTurnover * rate) / 100000;
    const prevTaxLakh = (currentTurnover * 0.01) / 100000;
    return {
      ratePercent: rate * 100,
      taxLakh: currentTaxLakh,
      prevTaxLakh,
      savingsLakh: Math.max(0, prevTaxLakh - currentTaxLakh)
    };
  }, [currentTurnover]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: ChartDataPoint = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/80 text-xs space-y-2 backdrop-blur-md max-w-xs">
          <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
            <span className="font-extrabold text-sm text-indigo-300">
              Turnover: Tk. {data.turnoverCr} Crore
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {data.slab.split(':')[0]}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-slate-300">
              <span>Revised Tax (New Slabs):</span>
              <span className="font-black text-white text-sm">
                Tk. {data.revisedTaxLakh} Lakh ({data.rateLabel})
              </span>
            </div>

            {showPreviousComparison && (
              <div className="flex justify-between items-center text-slate-400">
                <span>Previous Flat 1% Proposal:</span>
                <span className="line-through">Tk. {data.previousTaxLakh} Lakh</span>
              </div>
            )}

            {data.savingsLakh > 0 && showPreviousComparison && (
              <div className="flex justify-between items-center text-emerald-400 font-bold pt-1 border-t border-slate-800">
                <span className="flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  Tax Saved:
                </span>
                <span>-Tk. {data.savingsLakh} Lakh</span>
              </div>
            )}
          </div>

          {onSelectTurnover && (
            <div className="pt-1 text-[10px] text-indigo-400 italic text-center">
              Click node to load this turnover into the calculator
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white rounded-3xl border border-indigo-200/90 shadow-xl overflow-hidden ${className}`}>
      {/* Chart Header */}
      <div className="p-6 sm:p-7 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-xs shrink-0 mt-0.5">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  Visual Progression Curve
                </span>
                <span className="text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  Tk. 0 to 10 Crore Range
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-1">
                Turnover Tax Burden Across Slabs
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Visualizing how the tax liability scales incrementally through the 0% (up to 2 Cr), 0.5% (2–4 Cr), and 1% (&gt;4 Cr) tiers
              </p>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
            {/* View Mode Switcher */}
            <div className="bg-slate-200/80 p-0.5 rounded-xl flex items-center text-xs font-bold text-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('amount')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  viewMode === 'amount'
                    ? 'bg-white text-indigo-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tax (Tk. Lakh)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('rate')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  viewMode === 'rate'
                    ? 'bg-white text-indigo-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Rate (%)
              </button>
            </div>

            {/* Toggle previous proposal line */}
            <button
              type="button"
              onClick={() => setShowPreviousComparison(!showPreviousComparison)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1.5 ${
                showPreviousComparison
                  ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showPreviousComparison ? 'Hide 1% Proposal' : 'Show 1% Proposal'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Highlight Pill for current calculator turnover */}
        <div className="mt-4 p-3 bg-white rounded-2xl border border-indigo-100 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
            <span className="text-slate-600">
              Current Calculator Position:
            </span>
            <strong className="text-slate-900 font-black">
              Tk. {currentCr} Crore
            </strong>
            <span className="text-slate-400">|</span>
            <span className="text-indigo-700 font-semibold">
              Tax: <strong>Tk. {currentStat.taxLakh.toFixed(2)} Lakh</strong> ({currentStat.ratePercent}%)
            </span>
          </div>

          {currentStat.savingsLakh > 0 && (
            <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Savings vs Flat 1%: Tk. {currentStat.savingsLakh.toFixed(2)} Lakh</span>
            </div>
          )}
        </div>
      </div>

      {/* Recharts Line Chart Container */}
      <div className="p-4 sm:p-6">
        <div className="h-80 sm:h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload.length && onSelectTurnover) {
                  onSelectTurnover(e.activePayload[0].payload.turnoverRaw);
                }
              }}
            >
              <defs>
                <linearGradient id="revisedAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="previousAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />

              <XAxis
                dataKey="turnoverCr"
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                tick={{ fill: '#64748b', fontSize: 11 }}
                unit=" Cr"
                name="Annual Turnover"
              />

              <YAxis
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                tick={{ fill: '#64748b', fontSize: 11 }}
                unit={viewMode === 'amount' ? ' L' : '%'}
                name={viewMode === 'amount' ? 'Tax Payable (Lakh Tk.)' : 'Tax Rate (%)'}
              />

              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={36}
                wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
              />

              {/* Background Reference Bands for the 3 Slabs */}
              {showSlabBands && (
                <>
                  <ReferenceArea
                    x1={0}
                    x2={2}
                    fill="#10b981"
                    fillOpacity={0.06}
                    label={{
                      value: 'Slab 1: 0% Tax-Free (0–2 Cr)',
                      position: 'insideTopLeft',
                      fill: '#059669',
                      fontSize: 10,
                      fontWeight: 700
                    }}
                  />
                  <ReferenceArea
                    x1={2}
                    x2={4}
                    fill="#3b82f6"
                    fillOpacity={0.06}
                    label={{
                      value: 'Slab 2: 0.5% Rate (2–4 Cr)',
                      position: 'insideTopLeft',
                      fill: '#2563eb',
                      fontSize: 10,
                      fontWeight: 700
                    }}
                  />
                  <ReferenceArea
                    x1={4}
                    x2={10}
                    fill="#8b5cf6"
                    fillOpacity={0.06}
                    label={{
                      value: 'Slab 3: 1.0% Rate (>4 Cr)',
                      position: 'insideTopLeft',
                      fill: '#7c3aed',
                      fontSize: 10,
                      fontWeight: 700
                    }}
                  />
                </>
              )}

              {/* Slab Boundary Reference Lines */}
              <ReferenceLine
                x={2}
                stroke="#10b981"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{ value: 'Tk. 2 Cr Ceiling', position: 'insideBottomLeft', fill: '#059669', fontSize: 10 }}
              />
              <ReferenceLine
                x={4}
                stroke="#3b82f6"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{ value: 'Tk. 4 Cr Ceiling', position: 'insideBottomLeft', fill: '#2563eb', fontSize: 10 }}
              />

              {/* Active User Reference Line */}
              {currentCr <= 10 && (
                <ReferenceLine
                  x={currentCr}
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  label={{
                    value: `You: ${currentCr} Cr`,
                    position: 'top',
                    fill: '#312e81',
                    fontSize: 11,
                    fontWeight: 800
                  }}
                />
              )}

              {/* View Mode = Amount: Show Tax Amount Curves */}
              {viewMode === 'amount' && (
                <>
                  {showPreviousComparison && (
                    <Line
                      type="monotone"
                      dataKey="previousTaxLakh"
                      name="Previous Flat 1% Proposal (Tk. Lakh)"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                  )}

                  <Area
                    type="monotone"
                    dataKey="revisedTaxLakh"
                    fill="url(#revisedAreaGradient)"
                    stroke="none"
                  />

                  <Line
                    type="monotone"
                    dataKey="revisedTaxLakh"
                    name="Revised NBR Slabs (Tk. Lakh)"
                    stroke="#4f46e5"
                    strokeWidth={3.5}
                    dot={{ r: 3, fill: '#4f46e5' }}
                    activeDot={{ r: 7, stroke: '#312e81', strokeWidth: 2 }}
                  />
                </>
              )}

              {/* View Mode = Rate: Show Effective Percentage Step-function */}
              {viewMode === 'rate' && (
                <>
                  {showPreviousComparison && (
                    <Line
                      type="stepAfter"
                      dataKey={() => 1.0}
                      name="Previous Flat Proposal (1.0%)"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  )}

                  <Line
                    type="stepAfter"
                    dataKey="ratePercent"
                    name="Revised Slabs Tax Rate (%)"
                    stroke="#4f46e5"
                    strokeWidth={3.5}
                    dot={{ r: 4, fill: '#4f46e5' }}
                    activeDot={{ r: 7 }}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart Footer Takeaways */}
      <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
        <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
          <div>
            <strong className="text-slate-900 block font-bold">1. Zero-Tax Haven (0 – 2 Cr)</strong>
            <span className="text-slate-600">The line stays flat at 0. Small traders remit Tk. 0 minimum turnover tax.</span>
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1 shrink-0" />
          <div>
            <strong className="text-slate-900 block font-bold">2. Moderate Climb (2 – 4 Cr)</strong>
            <span className="text-slate-600">The 0.5% rate cuts the statutory slope in half, cushioning growing medium businesses.</span>
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-purple-500 mt-1 shrink-0" />
          <div>
            <strong className="text-slate-900 block font-bold">3. Standard Floor (&gt; 4 Cr)</strong>
            <span className="text-slate-600">Above Tk. 4 Crore, the curve joins the standard 1.0% rate for established corporations.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TurnoverBurdenChart;
