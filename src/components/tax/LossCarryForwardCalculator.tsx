import React, { useState, useMemo } from 'react';
import { LossAbsorptionD3Chart } from './LossAbsorptionD3Chart';
import { 
  Calculator, 
  Sparkles, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  Plus, 
  Trash2, 
  RotateCcw, 
  ChevronRight, 
  ShieldCheck, 
  Building2, 
  HelpCircle,
  BarChart3,
  ListOrdered,
  FileText
} from 'lucide-react';

export type EntityType = 'general' | 'startup' | 'speculative' | 'tobacco';

export interface YearInput {
  id: string;
  yearLabel: string; // e.g. "AY 2027-28"
  assessmentYearNum: number; // e.g. 2027
  profitOrLoss: number; // Positive for profit, Negative for loss (before current depreciation)
  currentDepreciation: number; // Current year statutory depreciation allowance
}

export interface LossBucket {
  originYear: number;
  originLabel: string;
  initialAmount: number;
  remainingAmount: number;
  expiryYear: number; // originYear + 6 (or + 9 for startup)
  isExpired: boolean;
}

export interface YearScheduleResult {
  yearId: string;
  yearLabel: string;
  assessmentYearNum: number;
  profitBeforeDep: number;
  currentDep: number;
  
  // Calculations
  currentYearNetResult: number; // profitBeforeDep - currentDep (if positive, profit available)
  
  // Adjustments
  broughtForwardLossUsed: number;
  broughtForwardDepUsed: number;
  
  // End of year balances
  netTaxableIncome: number;
  activeLossPoolEnd: number;
  expiredLossThisYear: number;
  unabsorbedDepEnd: number;
  
  // Detailed breakdown
  lossBucketsAtEnd: LossBucket[];
}

export const PRESET_SCENARIOS: Record<string, { title: string; entityType: EntityType; startYear: number; description: string; items: { profitOrLoss: number; currentDep: number }[] }> = {
  'general-turnaround': {
    title: '1. General Business Turnaround (6-Year Rule)',
    entityType: 'general',
    startYear: 2027,
    description: 'Demonstrates how a general business incurs a BDT 20 Lakh loss in Year 1, then utilizes it over subsequent profitable years within the 6-year statutory limit.',
    items: [
      { profitOrLoss: -2000000, currentDep: 300000 },
      { profitOrLoss: -500000, currentDep: 200000 },
      { profitOrLoss: 400000, currentDep: 200000 },
      { profitOrLoss: 800000, currentDep: 200000 },
      { profitOrLoss: 1200000, currentDep: 200000 },
      { profitOrLoss: 1500000, currentDep: 200000 },
      { profitOrLoss: 2000000, currentDep: 200000 }
    ]
  },
  'startup-sandbox': {
    title: '2. Registered Startup Sandbox (9-Year Rule)',
    entityType: 'startup',
    startYear: 2027,
    description: 'Demonstrates a high-growth tech startup with heavy initial R&D losses (BDT 50 Lakhs) utilizing the extended 9-year Sandbox carry-forward facility under Eighth Schedule.',
    items: [
      { profitOrLoss: -5000000, currentDep: 500000 },
      { profitOrLoss: -3000000, currentDep: 400000 },
      { profitOrLoss: -1000000, currentDep: 300000 },
      { profitOrLoss: 1000000, currentDep: 300000 },
      { profitOrLoss: 2500000, currentDep: 300000 },
      { profitOrLoss: 4000000, currentDep: 300000 },
      { profitOrLoss: 6000000, currentDep: 300000 }
    ]
  },
  'heavy-machinery': {
    title: '3. Heavy Industrial Factory (Unabsorbed Depreciation Focus)',
    entityType: 'general',
    startYear: 2027,
    description: 'Demonstrates a manufacturing unit with massive upfront Third Schedule tax depreciation allowances (Section 71) carrying forward indefinitely without expiring.',
    items: [
      { profitOrLoss: 1000000, currentDep: 3500000 },
      { profitOrLoss: 1500000, currentDep: 2500000 },
      { profitOrLoss: 2000000, currentDep: 1800000 },
      { profitOrLoss: 3000000, currentDep: 1500000 },
      { profitOrLoss: 4000000, currentDep: 1000000 }
    ]
  }
};

export function LossCarryForwardCalculator() {
  const [entityType, setEntityType] = useState<EntityType>('general');
  const [startYearNum, setStartYearNum] = useState<number>(2027);
  
  const [yearsData, setYearsData] = useState<YearInput[]>([
    { id: '1', yearLabel: 'AY 2027–28', assessmentYearNum: 2027, profitOrLoss: -2000000, currentDepreciation: 300000 },
    { id: '2', yearLabel: 'AY 2028–29', assessmentYearNum: 2028, profitOrLoss: -500000, currentDepreciation: 200000 },
    { id: '3', yearLabel: 'AY 2029–30', assessmentYearNum: 2029, profitOrLoss: 400000, currentDepreciation: 200000 },
    { id: '4', yearLabel: 'AY 2030–31', assessmentYearNum: 2030, profitOrLoss: 800000, currentDepreciation: 200000 },
    { id: '5', yearLabel: 'AY 2031–32', assessmentYearNum: 2031, profitOrLoss: 1200000, currentDepreciation: 200000 },
    { id: '6', yearLabel: 'AY 2032–33', assessmentYearNum: 2032, profitOrLoss: 1500000, currentDepreciation: 200000 },
    { id: '7', yearLabel: 'AY 2033–34', assessmentYearNum: 2033, profitOrLoss: 2000000, currentDepreciation: 200000 }
  ]);

  const maxLossYears = entityType === 'startup' ? 9 : 6;

  // Load a preset scenario
  const handleLoadPreset = (presetKey: string) => {
    const preset = PRESET_SCENARIOS[presetKey];
    if (!preset) return;
    setEntityType(preset.entityType);
    setStartYearNum(preset.startYear);
    const newItems: YearInput[] = preset.items.map((item, idx) => {
      const yr = preset.startYear + idx;
      return {
        id: String(idx + 1),
        yearLabel: `AY ${yr}–${(yr + 1).toString().slice(-2)}`,
        assessmentYearNum: yr,
        profitOrLoss: item.profitOrLoss,
        currentDepreciation: item.currentDep
      };
    });
    setYearsData(newItems);
  };

  // Update a single year input
  const handleUpdateYear = (id: string, field: 'profitOrLoss' | 'currentDepreciation', value: number) => {
    setYearsData(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  // Add a new assessment year to the table
  const handleAddYear = () => {
    const lastYear = yearsData[yearsData.length - 1];
    const nextYrNum = lastYear ? lastYear.assessmentYearNum + 1 : startYearNum;
    const newId = String(Date.now());
    const newYear: YearInput = {
      id: newId,
      yearLabel: `AY ${nextYrNum}–${(nextYrNum + 1).toString().slice(-2)}`,
      assessmentYearNum: nextYrNum,
      profitOrLoss: 1000000,
      currentDepreciation: 200000
    };
    setYearsData(prev => [...prev, newYear]);
  };

  // Remove a year row
  const handleRemoveYear = (id: string) => {
    if (yearsData.length <= 1) return;
    setYearsData(prev => prev.filter(item => item.id !== id));
  };

  // Reset to default
  const handleReset = () => {
    handleLoadPreset('general-turnaround');
  };

  // Multi-Year Loss Set-Off & Depreciation Calculation Engine
  const scheduleResults: YearScheduleResult[] = useMemo(() => {
    let activeLossBuckets: LossBucket[] = [];
    let cumulativeUnabsorbedDep = 0;

    const results: YearScheduleResult[] = [];

    yearsData.forEach((inputYear) => {
      const yrNum = inputYear.assessmentYearNum;
      const profitBeforeDep = inputYear.profitOrLoss;
      const currentDep = inputYear.currentDepreciation;

      let broughtForwardLossUsedThisYear = 0;
      let broughtForwardDepUsedThisYear = 0;
      let expiredLossThisYear = 0;

      // Check for expired losses at the start of this year
      activeLossBuckets = activeLossBuckets.map(bucket => {
        if (!bucket.isExpired && yrNum > bucket.expiryYear) {
          expiredLossThisYear += bucket.remainingAmount;
          return { ...bucket, isExpired: true, remainingAmount: 0 };
        }
        return bucket;
      });

      // Filter out fully settled or expired buckets for active processing
      let availableLossBuckets = activeLossBuckets.filter(b => !b.isExpired && b.remainingAmount > 0);

      let availableProfitForSetOff = 0;
      let newLossGeneratedThisYear = 0;

      if (profitBeforeDep < 0) {
        // Year generates a new business loss
        newLossGeneratedThisYear = Math.abs(profitBeforeDep);
        // Current depreciation cannot be absorbed at all
        cumulativeUnabsorbedDep += currentDep;
      } else {
        // Year generates profit
        // Current year depreciation absorbs profit first under Third Schedule
        if (profitBeforeDep >= currentDep) {
          availableProfitForSetOff = profitBeforeDep - currentDep;
        } else {
          // Profit is smaller than current depreciation
          const unabsorbedCurrentDep = currentDep - profitBeforeDep;
          cumulativeUnabsorbedDep += unabsorbedCurrentDep;
          availableProfitForSetOff = 0;
        }
      }

      // If we have new business loss this year, add to loss buckets
      if (newLossGeneratedThisYear > 0) {
        availableLossBuckets.push({
          originYear: yrNum,
          originLabel: inputYear.yearLabel,
          initialAmount: newLossGeneratedThisYear,
          remainingAmount: newLossGeneratedThisYear,
          expiryYear: yrNum + maxLossYears,
          isExpired: false
        });
      }

      // Step 1: Set off brought-forward business losses BEFORE unabsorbed depreciation (Sec. 71(3) Priority Rule!)
      if (availableProfitForSetOff > 0 && availableLossBuckets.length > 0) {
        for (let i = 0; i < availableLossBuckets.length; i++) {
          const bucket = availableLossBuckets[i];
          if (availableProfitForSetOff <= 0) break;

          if (bucket.remainingAmount > 0) {
            const absorb = Math.min(availableProfitForSetOff, bucket.remainingAmount);
            bucket.remainingAmount -= absorb;
            availableProfitForSetOff -= absorb;
            broughtForwardLossUsedThisYear += absorb;
          }
        }
      }

      // Step 2: Utilize unabsorbed depreciation if profit is still remaining
      if (availableProfitForSetOff > 0 && cumulativeUnabsorbedDep > 0) {
        const depAbsorb = Math.min(availableProfitForSetOff, cumulativeUnabsorbedDep);
        cumulativeUnabsorbedDep -= depAbsorb;
        availableProfitForSetOff -= depAbsorb;
        broughtForwardDepUsedThisYear += depAbsorb;
      }

      const netTaxableIncome = availableProfitForSetOff;
      const activeLossPoolEnd = availableLossBuckets.reduce((sum, b) => sum + b.remainingAmount, 0);

      results.push({
        yearId: inputYear.id,
        yearLabel: inputYear.yearLabel,
        assessmentYearNum: yrNum,
        profitBeforeDep,
        currentDep,
        currentYearNetResult: profitBeforeDep - currentDep,
        broughtForwardLossUsed: broughtForwardLossUsedThisYear,
        broughtForwardDepUsed: broughtForwardDepUsedThisYear,
        netTaxableIncome,
        activeLossPoolEnd,
        expiredLossThisYear,
        unabsorbedDepEnd: cumulativeUnabsorbedDep,
        lossBucketsAtEnd: availableLossBuckets.map(b => ({ ...b }))
      });

      // Update activeLossBuckets for the next iteration
      activeLossBuckets = availableLossBuckets;
    });

    return results;
  }, [yearsData, entityType, maxLossYears]);

  // Overall Summary Metrics
  const summary = useMemo(() => {
    const totalProfits = yearsData.reduce((s, y) => s + (y.profitOrLoss > 0 ? y.profitOrLoss : 0), 0);
    const totalLosses = yearsData.reduce((s, y) => s + (y.profitOrLoss < 0 ? Math.abs(y.profitOrLoss) : 0), 0);
    const totalLossUsed = scheduleResults.reduce((s, r) => s + r.broughtForwardLossUsed, 0);
    const totalDepUsed = scheduleResults.reduce((s, r) => s + r.broughtForwardDepUsed, 0);
    const totalTaxable = scheduleResults.reduce((s, r) => s + r.netTaxableIncome, 0);
    const lastResult = scheduleResults[scheduleResults.length - 1];
    
    // Estimate corporate tax savings (using 27.5% standard corporate tax rate)
    const totalTaxDeduction = totalLossUsed + totalDepUsed;
    const estimatedTaxSaved = totalTaxDeduction * 0.275;

    return {
      totalProfits,
      totalLosses,
      totalLossUsed,
      totalDepUsed,
      totalTaxable,
      remainingLossPool: lastResult ? lastResult.activeLossPoolEnd : 0,
      remainingUnabsorbedDep: lastResult ? lastResult.unabsorbedDepEnd : 0,
      estimatedTaxSaved
    };
  }, [yearsData, scheduleResults]);

  return (
    <div className="not-prose my-10 bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden font-sans">
      {/* Tool Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-6 sm:p-8 text-white">
        <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-extrabold uppercase tracking-widest px-3.5 py-1.5 rounded-full mb-3">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Interactive Tax Tool — Sections 70 & 71</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
          Business Loss Set-Off & Carry-Forward Schedule Simulator
        </h2>
        <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
          Simulate multi-year business results, statutory Third Schedule depreciation, Section 71(3) priority rules, and the 6-year general vs. 9-year Startup Sandbox carry-forward limits under the Income Tax Act, 2023.
        </p>

        {/* Quick Scenario Preset Buttons */}
        <div className="mt-6 pt-6 border-t border-slate-800">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-3">
            Load Quick Presets:
          </span>
          <div className="flex flex-wrap gap-2.5">
            {Object.keys(PRESET_SCENARIOS).map((key) => (
              <button
                key={key}
                onClick={() => handleLoadPreset(key)}
                className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 text-xs font-extrabold transition-all cursor-pointer border border-slate-700/80 flex items-center gap-1.5"
              >
                <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                <span>{PRESET_SCENARIOS[key].title}</span>
              </button>
            ))}
            <button
              onClick={handleReset}
              className="px-3.5 py-2 rounded-xl bg-slate-800/50 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer border border-slate-700/50 flex items-center gap-1 ml-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Controls & Configuration */}
      <div className="p-6 bg-slate-50 border-b border-slate-200/90">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Entity Type Selector */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>1. Tax Entity & Carry-Forward Rule:</span>
              </label>
              {/* Entity Type Tooltip */}
              <div className="relative group/tooltip">
                <HelpCircle className="w-4 h-4 text-emerald-600 hover:text-emerald-800 cursor-pointer transition-colors" />
                <div className="absolute right-0 top-6 hidden group-hover/tooltip:block w-72 sm:w-80 p-3.5 bg-slate-900 text-white text-xs rounded-2xl shadow-xl z-50 border border-slate-700 font-normal leading-relaxed">
                  <span className="font-extrabold text-emerald-400 block mb-1 uppercase tracking-wider text-[10px]">
                    Statutory Entity Rules:
                  </span>
                  <ul className="space-y-1.5 text-[11px] text-slate-300">
                    <li><strong className="text-white">Normal Business (Sec. 70(5)):</strong> Losses carry forward for up to <strong>6 successive assessment years</strong> against business income.</li>
                    <li><strong className="text-emerald-300">Registered Startup Sandbox (Eighth Sched.):</strong> Eligible NBR-registered startups receive <strong>9 assessment years</strong> carry-forward relief.</li>
                    <li><strong className="text-white">Speculative / Tobacco (Sec. 70(2)):</strong> Set off restricted strictly to same-source income.</li>
                  </ul>
                </div>
              </div>
            </div>

            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value as EntityType)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="general">General Business (6-Year Loss Limit, Unlimited Dep.)</option>
              <option value="startup">Registered Startup Sandbox (9-Year Loss Limit, Eighth Sched.)</option>
              <option value="speculative">Speculative Business (6-Year Limit, Restricted Set-Off)</option>
              <option value="tobacco">Tobacco Manufacturing (6-Year Limit, Restricted Set-Off)</option>
            </select>
            <div className="mt-2 text-[11px] text-slate-500 font-medium">
              {entityType === 'startup' ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Extended 9-Year Sandbox carry-forward active under Finance Act 2026.</span>
                </span>
              ) : (
                <span>Standard 6-year loss carry-forward limit under Section 70(5).</span>
              )}
            </div>
          </div>

          {/* Starting Year */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
              2. Base Assessment Year:
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">AY</span>
              <input
                type="number"
                value={startYearNum}
                onChange={(e) => setStartYearNum(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-emerald-500"
              />
              <span className="text-xs font-bold text-slate-500">–{(startYearNum + 1).toString().slice(-2)}</span>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">First assessment year in the simulation schedule.</p>
          </div>

          {/* Priority Rule Reminder Box */}
          <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200/80 flex items-start gap-3">
            <Clock className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider block mb-1">
                Section 71(3) Priority Rule:
              </span>
              <p className="text-[11px] text-emerald-900 leading-snug font-medium">
                Brought-forward business losses <strong>must</strong> be set off against profit before applying carried-forward unabsorbed depreciation!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Input Data Table */}
      <div className="p-6 sm:p-8 bg-white border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-emerald-600" />
              <span>Multi-Year Financial Results Input</span>
            </h3>
            <p className="text-xs text-slate-500">Input annual business profit (positive) or loss (negative), plus Third Schedule tax depreciation allowance.</p>
          </div>
          <button
            onClick={handleAddYear}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Assessment Year</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-slate-900 text-white text-xs uppercase tracking-wider font-extrabold">
              <tr>
                <th className="py-3 px-4 w-36">Assessment Year</th>
                <th className="py-3 px-4 min-w-[220px]">
                  <div className="flex items-center gap-1.5">
                    <span>Annual Business Result (Profit/Loss)</span>
                    {/* Annual Business Result Tooltip */}
                    <div className="relative group/tooltip">
                      <HelpCircle className="w-3.5 h-3.5 text-emerald-400 hover:text-emerald-300 cursor-pointer" />
                      <div className="absolute left-0 top-5 hidden group-hover/tooltip:block w-72 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl z-50 border border-slate-700 font-normal normal-case leading-relaxed">
                        <strong className="text-emerald-400 block mb-1">Annual Business Result (Chapter V):</strong>
                        Tax profit or loss computed after statutory add-backs under Sections 55 & 56. Enter positive for profit, negative for loss. Under Sec. 70(2), business loss cannot offset salary or house property income.
                      </div>
                    </div>
                  </div>
                </th>
                <th className="py-3 px-4 min-w-[220px]">
                  <div className="flex items-center gap-1.5">
                    <span>Depreciation Allowance (BDT)</span>
                    {/* Depreciation Allowance Tooltip */}
                    <div className="relative group/tooltip">
                      <HelpCircle className="w-3.5 h-3.5 text-emerald-400 hover:text-emerald-300 cursor-pointer" />
                      <div className="absolute left-0 top-5 hidden group-hover/tooltip:block w-72 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl z-50 border border-slate-700 font-normal normal-case leading-relaxed">
                        <strong className="text-emerald-400 block mb-1">Third Schedule Depreciation:</strong>
                        Statutory tax depreciation allowance (WDV or accelerated method). Current depreciation absorbs current profit first. Any unabsorbed balance carries forward <strong>indefinitely</strong> under Section 71(4).
                      </div>
                    </div>
                  </div>
                </th>
                <th className="py-3 px-4 w-40">Status Preview</th>
                <th className="py-3 px-4 w-12 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs sm:text-sm bg-white">
              {yearsData.map((item) => {
                const isLoss = item.profitOrLoss < 0;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-black text-slate-900">
                      <span className="inline-block bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md text-xs font-extrabold">
                        {item.yearLabel}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={item.profitOrLoss}
                          onChange={(e) => handleUpdateYear(item.id, 'profitOrLoss', Number(e.target.value))}
                          className={`w-full px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-bold outline-none ${
                            isLoss ? 'bg-red-50 border-red-300 text-red-900' : 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
                          }`}
                        />
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          Tk. {(Math.abs(item.profitOrLoss)/100000).toFixed(1)}L
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={item.currentDepreciation}
                          onChange={(e) => handleUpdateYear(item.id, 'currentDepreciation', Number(e.target.value))}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-bold text-slate-900 outline-none focus:border-emerald-500"
                        />
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          Tk. {(item.currentDepreciation/100000).toFixed(1)}L
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        isLoss ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                      }`}>
                        {isLoss ? '🔴 Loss Year' : '🟢 Profit Year'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleRemoveYear(item.id)}
                        disabled={yearsData.length <= 1}
                        title="Remove year row"
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Output Simulation Schedule Table */}
      <div className="p-6 sm:p-8 bg-slate-50/50">
        {/* D3.js Visualization Component */}
        <LossAbsorptionD3Chart data={scheduleResults} entityType={entityType} />

        <div className="mb-6 mt-8">
          <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <span>Statutory Loss Set-Off & Carry-Forward Schedule</span>
          </h3>
          <p className="text-xs text-slate-600">Calculated under Sections 70, 71 & Eighth Schedule of Income Tax Act, 2023.</p>
        </div>

        {/* Multi-Year Calculation Results Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs mb-8">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead className="bg-slate-900 text-white text-xs uppercase tracking-wider font-extrabold">
              <tr>
                <th className="py-3.5 px-4 w-32">Assessment Year</th>
                <th className="py-3.5 px-4">Annual Result (Profit/Loss)</th>
                <th className="py-3.5 px-4">Depreciation Allowance</th>
                <th className="py-3.5 px-4">Brought-Forward Loss Used</th>
                <th className="py-3.5 px-4">Unabsorbed Dep. Used</th>
                <th className="py-3.5 px-4">Net Taxable Income</th>
                <th className="py-3.5 px-4 min-w-[180px]">Remaining Loss Pool & Expiry Year</th>
                <th className="py-3.5 px-4">Unabsorbed Dep. End</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 text-xs sm:text-sm bg-white">
              {scheduleResults.map((res) => {
                const isLossYr = res.profitBeforeDep < 0;
                return (
                  <tr key={res.yearId} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-black text-slate-900">
                      <span className="inline-block bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-xs font-bold">
                        {res.yearLabel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold">
                      <span className={isLossYr ? 'text-red-700' : 'text-emerald-800'}>
                        {isLossYr ? `(Tk. ${Math.abs(res.profitBeforeDep).toLocaleString()})` : `Tk. ${res.profitBeforeDep.toLocaleString()}`}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-700">
                      Tk. {res.currentDep.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-900 font-bold">
                      {res.broughtForwardLossUsed > 0 ? `Tk. ${res.broughtForwardLossUsed.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-blue-900 font-bold">
                      {res.broughtForwardDepUsed > 0 ? `Tk. ${res.broughtForwardDepUsed.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-950">
                      <span className={res.netTaxableIncome > 0 ? 'bg-amber-100 text-amber-950 px-2 py-0.5 rounded border border-amber-300 font-extrabold' : 'text-slate-400'}>
                        {res.netTaxableIncome > 0 ? `Tk. ${res.netTaxableIncome.toLocaleString()}` : 'Tk. 0'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-700">
                      <div>{res.activeLossPoolEnd > 0 ? `Tk. ${res.activeLossPoolEnd.toLocaleString()}` : 'Tk. 0'}</div>
                      {/* Active Buckets Expiry Breakdown */}
                      {res.lossBucketsAtEnd.filter(b => b.remainingAmount > 0).map((b, idx) => (
                        <div key={idx} className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5 mt-1 inline-block mr-1">
                          From {b.originLabel} → Expires AY {b.expiryYear}–{(b.expiryYear+1).toString().slice(-2)} ({maxLossYears}y rule)
                        </div>
                      ))}
                      {res.expiredLossThisYear > 0 && (
                        <div className="text-[10px] text-red-700 font-bold bg-red-50 border border-red-200 rounded px-1.5 py-0.5 mt-1 block">
                          ⚠️ Tk. {res.expiredLossThisYear.toLocaleString()} EXPIRED in AY {res.assessmentYearNum}–{(res.assessmentYearNum+1).toString().slice(-2)}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-blue-800">
                      {res.unabsorbedDepEnd > 0 ? `Tk. ${res.unabsorbedDepEnd.toLocaleString()}` : 'Tk. 0'}
                      {res.unabsorbedDepEnd > 0 && (
                        <span className="text-[10px] text-blue-600 block font-semibold">
                          Sec. 71(4) No Expiry
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Overall Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
              Total Business Losses Set Off:
            </span>
            <span className="text-xl font-extrabold text-emerald-800">
              Tk. {summary.totalLossUsed.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">Section 70(1) & 70(5)</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
              Total Depreciation Absorbed:
            </span>
            <span className="text-xl font-extrabold text-blue-800">
              Tk. {summary.totalDepUsed.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">Section 71(1) & 71(4)</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
              Active Loss Pool Remaining:
            </span>
            <span className="text-xl font-extrabold text-slate-900">
              Tk. {summary.remainingLossPool.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">
              Expires after {entityType === 'startup' ? '9 years' : '6 years'}
            </span>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-emerald-950 p-5 rounded-2xl text-white shadow-md">
            <span className="text-[11px] font-bold uppercase text-emerald-400 block mb-1">
              Estimated Direct Tax Savings:
            </span>
            <span className="text-2xl font-black text-white">
              Tk. {summary.estimatedTaxSaved.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-300 block mt-1">At 27.5% corporate rate</span>
          </div>
        </div>
      </div>
    </div>
  );
}
