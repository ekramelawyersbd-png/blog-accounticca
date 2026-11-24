import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';
import { Download, RotateCcw, Scale, SlidersHorizontal } from 'lucide-react';
import { useTableSort } from '../../hooks/useTableSort';
import { SortableTh } from '../ui/SortableTh';

export type EntityPresetId =
  | 'firm_aop_trust'
  | 'cooperative'
  | 'private_edu'
  | 'non_listed_company'
  | 'listed_company'
  | 'new_manufacturing'
  | 'mobile_operator'
  | 'tobacco_manufacturer';

interface EntityPreset {
  id: EntityPresetId;
  label: string;
  shortLabel: string;
  statutoryBasis: string;
  regularRate: number; // percentage, e.g., 27.5
  minTaxRate: number; // percentage, e.g., 0.6
  grossReceiptsThreshold: number; // BDT (50,00,000 for firms/AOP/trusts; 0 for companies)
  defaultGrossReceipts: number;
  defaultProfitMargin: number; // percentage
}

const ENTITY_PRESETS: EntityPreset[] = [
  {
    id: 'firm_aop_trust',
    label: 'Partnership Firm / AOP / Trust / AJP',
    shortLabel: 'Firm / AOP / Trust',
    statutoryBasis: 'Finance Act, 2026 · Sec. 163(5) (Tk. 50L threshold)',
    regularRate: 27.5,
    minTaxRate: 0.6,
    grossReceiptsThreshold: 5_000_000,
    defaultGrossReceipts: 10_000_000,
    defaultProfitMargin: 5,
  },
  {
    id: 'cooperative',
    label: 'Registered Co-operative Society',
    shortLabel: 'Co-operative Society',
    statutoryBasis: 'Finance Act, 2026 · 20% entity rate & Sec. 163(5)',
    regularRate: 20.0,
    minTaxRate: 0.6,
    grossReceiptsThreshold: 5_000_000,
    defaultGrossReceipts: 12_000_000,
    defaultProfitMargin: 4,
  },
  {
    id: 'private_edu',
    label: 'Specified Private Educational Institution',
    shortLabel: 'Private Educational',
    statutoryBasis: 'Finance Act, 2026 · 5% concessional rate & Sec. 163(5)',
    regularRate: 5.0,
    minTaxRate: 0.6,
    grossReceiptsThreshold: 5_000_000,
    defaultGrossReceipts: 25_000_000,
    defaultProfitMargin: 10,
  },
  {
    id: 'non_listed_company',
    label: 'Non-Listed Company (General)',
    shortLabel: 'Non-Listed Company',
    statutoryBasis: 'Income Tax Act, 2023 · Sec. 163(5) (all companies)',
    regularRate: 27.5,
    minTaxRate: 0.6,
    grossReceiptsThreshold: 0,
    defaultGrossReceipts: 35_000_000,
    defaultProfitMargin: 2.0,
  },
  {
    id: 'listed_company',
    label: 'Publicly Traded (Listed) Company',
    shortLabel: 'Listed Company',
    statutoryBasis: 'Income Tax Act, 2023 · Sec. 163(5)',
    regularRate: 22.5,
    minTaxRate: 0.6,
    grossReceiptsThreshold: 0,
    defaultGrossReceipts: 50_000_000,
    defaultProfitMargin: 3.0,
  },
  {
    id: 'new_manufacturing',
    label: 'New Manufacturing Undertaking (First 3 Years)',
    shortLabel: 'New Manufacturing',
    statutoryBasis: 'Sec. 163(5) · 0.10% concessional rate (first 3 income years)',
    regularRate: 27.5,
    minTaxRate: 0.1,
    grossReceiptsThreshold: 5_000_000,
    defaultGrossReceipts: 30_000_000,
    defaultProfitMargin: 1.5,
  },
  {
    id: 'mobile_operator',
    label: 'Mobile Phone Operator',
    shortLabel: 'Mobile Operator',
    statutoryBasis: 'Sec. 163(5) · 2.00% minimum tax on gross receipts',
    regularRate: 45.0,
    minTaxRate: 2.0,
    grossReceiptsThreshold: 0,
    defaultGrossReceipts: 100_000_000,
    defaultProfitMargin: 4.0,
  },
  {
    id: 'tobacco_manufacturer',
    label: 'Tobacco Product Manufacturer',
    shortLabel: 'Tobacco Manufacturer',
    statutoryBasis: 'Finance Act, 2026 · 45% tax & 3.00% Sec. 163(5) floor',
    regularRate: 45.0,
    minTaxRate: 3.0,
    grossReceiptsThreshold: 0,
    defaultGrossReceipts: 40_000_000,
    defaultProfitMargin: 6.0,
  },
];

const QUICK_TURNOVER_PRESETS = [
  { label: 'Tk. 40 Lakh', value: 4_000_000 },
  { label: 'Tk. 1 Crore', value: 10_000_000 },
  { label: 'Tk. 2.5 Crore', value: 25_000_000 },
  { label: 'Tk. 5 Crore', value: 50_000_000 },
  { label: 'Tk. 10 Crore', value: 100_000_000 },
];

const MARGIN_SCENARIO_POINTS = [0, 1, 2, 3, 5, 10, 15, 25];

function formatBdt(amount: number): string {
  const rounded = Math.round(amount);
  const absFormatted = Math.abs(rounded).toLocaleString('en-IN');
  return rounded < 0 ? `-Tk. ${absFormatted}` : `Tk. ${absFormatted}`;
}

function formatCompactBdt(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 10_000_000) return `${sign}Tk. ${(abs / 10_000_000).toFixed(2)} Cr`;
  if (abs >= 100_000) return `${sign}Tk. ${(abs / 100_000).toFixed(2)} L`;
  if (abs >= 1_000) return `${sign}Tk. ${(abs / 1_000).toFixed(0)}k`;
  return `${sign}Tk. ${Math.round(abs)}`;
}

interface ScenarioRow {
  id: string;
  label: string;
  marginPct: number;
  taxableProfit: number;
  regularTax: number;
  minimumTax: number;
  tdsMinimumTax: number;
  finalTaxPayable: number;
  difference: number; // regularTax - effectiveMinimumTax
  governingRegime: 'Regular Income Tax' | 'Minimum Tax (Sec. 163(5))' | 'TDS Minimum (Sec. 163(2))' | 'Equal Liability';
  isCurrent: boolean;
}

export interface Section163ComparativeDashboardProps {
  initialEntity?: EntityPresetId;
  initialGrossReceipts?: number;
  initialProfitMargin?: number;
  className?: string;
}

export function Section163ComparativeDashboard({
  initialEntity = 'firm_aop_trust',
  initialGrossReceipts,
  initialProfitMargin,
  className = '',
}: Section163ComparativeDashboardProps) {
  const defaultPreset =
    ENTITY_PRESETS.find((p) => p.id === initialEntity) || ENTITY_PRESETS[0];

  const [selectedEntityId, setSelectedEntityId] = useState<EntityPresetId>(defaultPreset.id);
  const [grossReceipts, setGrossReceipts] = useState<number>(
    initialGrossReceipts ?? defaultPreset.defaultGrossReceipts
  );
  const [profitMarginPct, setProfitMarginPct] = useState<number>(
    initialProfitMargin ?? defaultPreset.defaultProfitMargin
  );
  const [regularRatePct, setRegularRatePct] = useState<number>(defaultPreset.regularRate);
  const [minTaxRatePct, setMinTaxRatePct] = useState<number>(defaultPreset.minTaxRate);
  const [tdsWithheld, setTdsWithheld] = useState<number>(0);
  const [chartView, setChartView] = useState<'current' | 'sensitivity'>('sensitivity');

  const activePreset = useMemo(
    () => ENTITY_PRESETS.find((p) => p.id === selectedEntityId) || ENTITY_PRESETS[0],
    [selectedEntityId]
  );

  const handleSelectEntity = (id: EntityPresetId) => {
    const preset = ENTITY_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setSelectedEntityId(id);
    setRegularRatePct(preset.regularRate);
    setMinTaxRatePct(preset.minTaxRate);
    setGrossReceipts(preset.defaultGrossReceipts);
    setProfitMarginPct(preset.defaultProfitMargin);
  };

  const handleReset = () => {
    handleSelectEntity('firm_aop_trust');
    setTdsWithheld(0);
    setChartView('sensitivity');
  };

  const thresholdApplies =
    activePreset.grossReceiptsThreshold > 0 &&
    grossReceipts < activePreset.grossReceiptsThreshold;

  const currentComputation = useMemo(() => {
    const safeGross = Math.max(0, grossReceipts);
    const expenses = safeGross * (1 - profitMarginPct / 100);
    const accountingProfit = safeGross - expenses;
    const taxableIncome = Math.max(0, accountingProfit);
    const regularTax = taxableIncome * (regularRatePct / 100);
    const grossReceiptsMinTax = thresholdApplies ? 0 : safeGross * (minTaxRatePct / 100);
    const safeTds = Math.max(0, tdsWithheld);
    const effectiveSection163Min = Math.max(grossReceiptsMinTax, safeTds);
    const finalTaxPayable = Math.max(regularTax, effectiveSection163Min);

    let governingRegime: ScenarioRow['governingRegime'] = 'Regular Income Tax';
    if (finalTaxPayable === 0) {
      governingRegime = 'Equal Liability';
    } else if (safeTds > regularTax && safeTds >= grossReceiptsMinTax && safeTds > 0) {
      governingRegime = 'TDS Minimum (Sec. 163(2))';
    } else if (grossReceiptsMinTax > regularTax) {
      governingRegime = 'Minimum Tax (Sec. 163(5))';
    } else if (Math.abs(regularTax - effectiveSection163Min) < 1 && effectiveSection163Min > 0) {
      governingRegime = 'Equal Liability';
    }

    const difference = regularTax - effectiveSection163Min;
    const minTaxPenaltyExcess = Math.max(0, effectiveSection163Min - regularTax);
    const breakEvenMarginPct =
      regularRatePct > 0 && !thresholdApplies
        ? (minTaxRatePct / regularRatePct) * 100
        : 0;
    const effectiveRateOnGross = safeGross > 0 ? (finalTaxPayable / safeGross) * 100 : 0;
    const effectiveRateOnProfit =
      taxableIncome > 0 ? (finalTaxPayable / taxableIncome) * 100 : null;

    return {
      safeGross,
      expenses,
      accountingProfit,
      taxableIncome,
      regularTax,
      grossReceiptsMinTax,
      tdsMinimumTax: safeTds,
      effectiveSection163Min,
      finalTaxPayable,
      governingRegime,
      difference,
      minTaxPenaltyExcess,
      breakEvenMarginPct,
      effectiveRateOnGross,
      effectiveRateOnProfit,
    };
  }, [grossReceipts, profitMarginPct, regularRatePct, minTaxRatePct, tdsWithheld, thresholdApplies]);

  // Single-scenario direct comparative bar chart data
  const currentBarData = useMemo(() => {
    const items = [
      {
        name: `Regular Tax (${regularRatePct}%)`,
        shortName: 'Regular Tax',
        amount: Math.round(currentComputation.regularTax),
        fill: '#0f172a',
        note: `${formatBdt(currentComputation.taxableIncome)} taxable income × ${regularRatePct}%`,
      },
      {
        name: thresholdApplies
          ? 'Sec. 163(5) Min Tax (Exempt)'
          : `Sec. 163(5) Min Tax (${minTaxRatePct}%)`,
        shortName: 'Minimum Tax (163)',
        amount: Math.round(currentComputation.grossReceiptsMinTax),
        fill: '#d97706',
        note: thresholdApplies
          ? `Gross receipts below Tk. 50,00,000 threshold`
          : `${formatBdt(currentComputation.safeGross)} gross receipts × ${minTaxRatePct}%`,
      },
    ];

    if (currentComputation.tdsMinimumTax > 0) {
      items.push({
        name: 'Sec. 163(2) TDS Floor',
        shortName: 'TDS Floor (163(2))',
        amount: Math.round(currentComputation.tdsMinimumTax),
        fill: '#475569',
        note: 'Tax deducted/collected at source under Sec. 163(2)',
      });
    }

    items.push({
      name: 'Final Tax Payable',
      shortName: 'Final Payable',
      amount: Math.round(currentComputation.finalTaxPayable),
      fill:
        currentComputation.governingRegime === 'Regular Income Tax'
          ? '#059669'
          : '#dc2626',
      note: `Governing regime: ${currentComputation.governingRegime}`,
    });

    return items;
  }, [currentComputation, regularRatePct, minTaxRatePct, thresholdApplies]);

  // Multi-scenario margin sensitivity comparison rows
  const scenarioRows: ScenarioRow[] = useMemo(() => {
    const safeGross = Math.max(0, grossReceipts);
    const minTax = thresholdApplies ? 0 : safeGross * (minTaxRatePct / 100);
    const safeTds = Math.max(0, tdsWithheld);
    const effectiveMin = Math.max(minTax, safeTds);

    const margins = [...MARGIN_SCENARIO_POINTS];
    const roundedCurrent = Number(profitMarginPct.toFixed(2));
    if (!margins.some((m) => Math.abs(m - roundedCurrent) < 0.05)) {
      margins.push(roundedCurrent);
      margins.sort((a, b) => a - b);
    }

    return margins.map((margin) => {
      const isCurrent = Math.abs(margin - roundedCurrent) < 0.05;
      const profit = Math.max(0, safeGross * (margin / 100));
      const regularTax = profit * (regularRatePct / 100);
      const finalTaxPayable = Math.max(regularTax, effectiveMin);

      let governingRegime: ScenarioRow['governingRegime'] = 'Regular Income Tax';
      if (finalTaxPayable === 0) {
        governingRegime = 'Equal Liability';
      } else if (safeTds > regularTax && safeTds >= minTax && safeTds > 0) {
        governingRegime = 'TDS Minimum (Sec. 163(2))';
      } else if (minTax > regularTax) {
        governingRegime = 'Minimum Tax (Sec. 163(5))';
      } else if (Math.abs(regularTax - effectiveMin) < 1 && effectiveMin > 0) {
        governingRegime = 'Equal Liability';
      }

      return {
        id: `margin-${margin}`,
        label: margin === 0 ? '0% (Loss/Nil)' : `${margin}%`,
        marginPct: margin,
        taxableProfit: Math.round(profit),
        regularTax: Math.round(regularTax),
        minimumTax: Math.round(minTax),
        tdsMinimumTax: Math.round(safeTds),
        finalTaxPayable: Math.round(finalTaxPayable),
        difference: Math.round(regularTax - effectiveMin),
        governingRegime,
        isCurrent,
      };
    });
  }, [grossReceipts, profitMarginPct, regularRatePct, minTaxRatePct, tdsWithheld, thresholdApplies]);

  const { sortedItems: sortedScenarios, requestSort, getSortDirection } = useTableSort<
    ScenarioRow,
    'marginPct' | 'taxableProfit' | 'regularTax' | 'minimumTax' | 'difference' | 'finalTaxPayable' | 'governingRegime'
  >(scenarioRows);

  const handleExportCsv = () => {
    const headers = [
      'Entity Category',
      'Gross Receipts (BDT)',
      'Profit Margin (%)',
      'Taxable Profit (BDT)',
      `Regular Tax (${regularRatePct}%)`,
      `Minimum Tax Sec. 163(5) (${minTaxRatePct}%)`,
      'TDS Floor Sec. 163(2) (BDT)',
      'Difference (Regular - Min)',
      'Final Tax Payable (BDT)',
      'Governing Regime',
    ];
    const rows = scenarioRows.map((r) => [
      `"${activePreset.label}"`,
      Math.round(grossReceipts),
      r.marginPct,
      r.taxableProfit,
      r.regularTax,
      r.minimumTax,
      r.tdsMinimumTax,
      r.difference,
      r.finalTaxPayable,
      `"${r.governingRegime}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `section-163-tax-comparison-${activePreset.id}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExpenseChange = (nextExpense: number) => {
    if (grossReceipts <= 0) return;
    const clampedExpense = Math.max(0, Math.min(grossReceipts * 1.25, nextExpense));
    const nextMargin = ((grossReceipts - clampedExpense) / grossReceipts) * 100;
    setProfitMarginPct(Number(nextMargin.toFixed(2)));
  };

  return (
    <section
      aria-labelledby="sec163-dashboard-heading"
      className={`bg-white border border-slate-200 rounded-xl overflow-hidden ${className}`}
    >
      {/* Top Header Strip */}
      <div className="px-6 py-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-700">Income Tax Act, 2023</span>
            <span aria-hidden="true">·</span>
            <span>Section 163 Comparative Analytics</span>
            <span aria-hidden="true">·</span>
            <span>AY 2026–2027 to AY 2030–2031</span>
          </div>
          <h2
            id="sec163-dashboard-heading"
            className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900"
          >
            Regular Income Tax vs. Minimum Tax (Section 163)
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* 4-Column KPI Summary Strip (Single Elevation, Hairline Dividers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 border-b border-slate-200 bg-slate-50/60">
        <div className="px-6 py-4">
          <p className="text-xs font-medium text-slate-500">
            Regular Income Tax ({regularRatePct}%)
          </p>
          <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {formatBdt(currentComputation.regularTax)}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            Taxable profit: {formatCompactBdt(currentComputation.taxableIncome)} ({profitMarginPct.toFixed(1)}%)
          </p>
        </div>

        <div className="px-6 py-4">
          <p className="text-xs font-medium text-slate-500">
            Minimum Tax · Sec. 163(5) ({minTaxRatePct}%)
          </p>
          <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-amber-700">
            {formatBdt(currentComputation.grossReceiptsMinTax)}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {thresholdApplies
              ? 'Below Tk. 50 Lakh gross receipts threshold'
              : `On ${formatCompactBdt(currentComputation.safeGross)} gross receipts`}
          </p>
        </div>

        <div className="px-6 py-4">
          <p className="text-xs font-medium text-slate-500">
            Final Statutory Tax Liability
          </p>
          <p
            className={`mt-1 text-2xl font-bold font-mono tabular-nums ${
              currentComputation.governingRegime === 'Regular Income Tax'
                ? 'text-emerald-700'
                : 'text-red-700'
            }`}
          >
            {formatBdt(currentComputation.finalTaxPayable)}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-700">
            Governing: {currentComputation.governingRegime}
          </p>
        </div>

        <div className="px-6 py-4">
          <p className="text-xs font-medium text-slate-500">
            {currentComputation.minTaxPenaltyExcess > 0
              ? 'Minimum Tax Floor Excess'
              : 'Regular Tax Surplus Above Floor'}
          </p>
          <p
            className={`mt-1 text-2xl font-bold font-mono tabular-nums ${
              currentComputation.minTaxPenaltyExcess > 0
                ? 'text-red-700'
                : 'text-slate-900'
            }`}
          >
            {currentComputation.minTaxPenaltyExcess > 0
              ? `+${formatBdt(currentComputation.minTaxPenaltyExcess)}`
              : formatBdt(Math.abs(currentComputation.difference))}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {thresholdApplies
              ? 'Sec. 163(5) floor inactive under Tk. 50L'
              : `Break-even margin: ${currentComputation.breakEvenMarginPct.toFixed(2)}%`}
          </p>
        </div>
      </div>

      {/* Main Workspace: Controls (Left) + Comparative Bar Chart (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 divide-y xl:divide-y-0 xl:divide-x divide-slate-200">
        {/* Left Control Rail */}
        <div className="xl:col-span-4 p-6 space-y-5 bg-white">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-slate-500" />
              Assessee & Financial Inputs
            </h3>
          </div>

          {/* Entity Type */}
          <div className="space-y-1.5">
            <label
              htmlFor="sec163-entity-select"
              className="block text-xs font-semibold text-slate-700"
            >
              Assessee Category
            </label>
            <select
              id="sec163-entity-select"
              value={selectedEntityId}
              onChange={(e) => handleSelectEntity(e.target.value as EntityPresetId)}
              className="w-full px-3 py-2.5 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
            >
              {ENTITY_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label} ({preset.regularRate}% / {preset.minTaxRate}%)
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500">{activePreset.statutoryBasis}</p>
          </div>

          {/* Gross Receipts */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="sec163-gross-input"
                className="text-xs font-semibold text-slate-700"
              >
                Annual Gross Receipts (BDT)
              </label>
              <span className="text-xs font-mono tabular-nums text-slate-600">
                {formatCompactBdt(grossReceipts)}
              </span>
            </div>
            <input
              id="sec163-gross-input"
              type="number"
              min={0}
              step={500_000}
              value={grossReceipts}
              onChange={(e) => setGrossReceipts(Math.max(0, Number(e.target.value) || 0))}
              className="w-full px-3 py-2 text-sm font-mono tabular-nums font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
            />
            <input
              type="range"
              aria-label="Annual gross receipts slider"
              min={1_000_000}
              max={150_000_000}
              step={500_000}
              value={Math.min(150_000_000, grossReceipts)}
              onChange={(e) => setGrossReceipts(Number(e.target.value))}
              className="w-full accent-slate-900 cursor-pointer"
            />
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TURNOVER_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setGrossReceipts(preset.value)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                    grossReceipts === preset.value
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-900'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Profit Margin & Business Expenses */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label
                htmlFor="sec163-margin-slider"
                className="text-xs font-semibold text-slate-700"
              >
                Net Taxable Profit Margin (%)
              </label>
              <span className="text-xs font-mono tabular-nums font-semibold text-slate-900">
                {profitMarginPct.toFixed(2)}%
              </span>
            </div>
            <input
              id="sec163-margin-slider"
              type="range"
              min={-10}
              max={35}
              step={0.25}
              value={Math.max(-10, Math.min(35, profitMarginPct))}
              onChange={(e) => setProfitMarginPct(Number(e.target.value))}
              className="w-full accent-emerald-700 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono tabular-nums text-slate-400">
              <span>-10% (Loss)</span>
              <span>0%</span>
              <span>
                {currentComputation.breakEvenMarginPct > 0
                  ? `${currentComputation.breakEvenMarginPct.toFixed(1)}% (Break-Even)`
                  : '15%'}
              </span>
              <span>35%</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label
                  htmlFor="sec163-expenses-input"
                  className="block text-[11px] font-medium text-slate-600 mb-1"
                >
                  Allowable Expenses (BDT)
                </label>
                <input
                  id="sec163-expenses-input"
                  type="number"
                  min={0}
                  step={100_000}
                  value={Math.round(currentComputation.expenses)}
                  onChange={(e) => handleExpenseChange(Number(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label
                  htmlFor="sec163-tds-input"
                  className="block text-[11px] font-medium text-slate-600 mb-1"
                >
                  Sec. 163(2) TDS Paid (BDT)
                </label>
                <input
                  id="sec163-tds-input"
                  type="number"
                  min={0}
                  step={25_000}
                  value={tdsWithheld}
                  onChange={(e) => setTdsWithheld(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Statutory Rate Fine-Tuning */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label
                htmlFor="sec163-regular-rate"
                className="block text-[11px] font-medium text-slate-600 mb-1"
              >
                Regular Tax Rate (%)
              </label>
              <input
                id="sec163-regular-rate"
                type="number"
                min={0}
                max={60}
                step={0.5}
                value={regularRatePct}
                onChange={(e) =>
                  setRegularRatePct(Math.max(0, Math.min(60, Number(e.target.value) || 0)))
                }
                className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums font-semibold text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label
                htmlFor="sec163-min-rate"
                className="block text-[11px] font-medium text-slate-600 mb-1"
              >
                Sec. 163(5) Min Rate (%)
              </label>
              <input
                id="sec163-min-rate"
                type="number"
                min={0}
                max={10}
                step={0.05}
                value={minTaxRatePct}
                onChange={(e) =>
                  setMinTaxRatePct(Math.max(0, Math.min(10, Number(e.target.value) || 0)))
                }
                className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums font-semibold text-amber-800 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          {/* Statutory Rule Summary */}
          <div className="pt-3 border-t border-slate-200 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <Scale className="w-3.5 h-3.5 text-slate-500" />
              Statutory Formula · Section 163
            </div>
            <p className="leading-relaxed">
              Payable tax equals the higher of Regular Income Tax and Section 163 Minimum Tax.
              {!thresholdApplies && currentComputation.breakEvenMarginPct > 0 && (
                <>
                  {' '}
                  At <span className="font-mono font-semibold text-slate-900">{regularRatePct}%</span> regular tax and{' '}
                  <span className="font-mono font-semibold text-amber-800">{minTaxRatePct}%</span> minimum tax,
                  minimum tax governs whenever taxable profit falls below{' '}
                  <span className="font-mono font-semibold text-slate-900">
                    {currentComputation.breakEvenMarginPct.toFixed(2)}%
                  </span>{' '}
                  of gross receipts.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Right Visualization Canvas */}
        <div className="xl:col-span-8 p-6 flex flex-col justify-between bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {chartView === 'sensitivity'
                  ? 'Comparative Bar Chart Across Profit Margin Scenarios'
                  : 'Direct Liability Comparison for Current Assessee Inputs'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                Gross receipts {formatBdt(currentComputation.safeGross)} · Regular rate {regularRatePct}% ·
                Sec. 163(5) rate {thresholdApplies ? '0% (below Tk. 50L)' : `${minTaxRatePct}%`}
              </p>
            </div>

            {/* Segmented Mode Control */}
            <div
              role="tablist"
              aria-label="Chart comparison view"
              className="inline-flex items-center p-1 bg-slate-100 rounded-lg self-start sm:self-auto shrink-0"
            >
              <button
                type="button"
                role="tab"
                aria-selected={chartView === 'sensitivity'}
                onClick={() => setChartView('sensitivity')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  chartView === 'sensitivity'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Margin Comparison
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={chartView === 'current'}
                onClick={() => setChartView('current')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  chartView === 'current'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Current Breakdown
              </button>
            </div>
          </div>

          {/* Chart Legend (Clean Unboxed Key) */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-600 mb-4">
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded-xs bg-slate-900 inline-block" aria-hidden="true" />
              Regular Income Tax ({regularRatePct}%)
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded-xs bg-amber-600 inline-block" aria-hidden="true" />
              Minimum Tax · Sec. 163(5) ({minTaxRatePct}%)
            </span>
            {chartView === 'current' && (
              <span className="inline-flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-xs inline-block ${
                    currentComputation.governingRegime === 'Regular Income Tax'
                      ? 'bg-emerald-600'
                      : 'bg-red-600'
                  }`}
                  aria-hidden="true"
                />
                Final Statutory Payable
              </span>
            )}
          </div>

          {/* Comparative Bar Chart */}
          <div className="w-full h-[340px] sm:h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartView === 'sensitivity' ? (
                <BarChart
                  data={scenarioRows}
                  margin={{ top: 14, right: 16, left: 8, bottom: 8 }}
                  barGap={4}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#475569', fontSize: 12 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => formatCompactBdt(Number(v))}
                    tick={{ fill: '#475569', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={78}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const row = payload[0].payload as ScenarioRow;
                      return (
                        <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3.5 text-xs min-w-[240px]">
                          <div className="font-bold text-slate-900 pb-2 mb-2 border-b border-slate-100 flex items-center justify-between gap-3">
                            <span>Profit Margin: {row.label}</span>
                            {row.isCurrent && (
                              <span className="text-emerald-700 font-semibold">Current</span>
                            )}
                          </div>
                          <div className="space-y-1.5 font-mono tabular-nums">
                            <div className="flex justify-between gap-4">
                              <span className="font-sans text-slate-500">Taxable Profit</span>
                              <span className="font-semibold text-slate-900">
                                {formatBdt(row.taxableProfit)}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="font-sans text-slate-700">Regular Income Tax</span>
                              <span className="font-bold text-slate-900">
                                {formatBdt(row.regularTax)}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="font-sans text-amber-800">Minimum Tax (Sec. 163)</span>
                              <span className="font-bold text-amber-700">
                                {formatBdt(row.minimumTax)}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4 pt-1.5 border-t border-slate-100">
                              <span className="font-sans text-slate-600">Net Variance (Reg − Min)</span>
                              <span
                                className={`font-bold ${
                                  row.difference < 0 ? 'text-red-700' : 'text-emerald-700'
                                }`}
                              >
                                {row.difference > 0 ? '+' : ''}
                                {formatBdt(row.difference)}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="font-sans font-semibold text-slate-900">
                                Final Tax Payable
                              </span>
                              <span className="font-bold text-slate-900">
                                {formatBdt(row.finalTaxPayable)}
                              </span>
                            </div>
                          </div>
                          <p className="mt-2 pt-2 border-t border-slate-100 text-[11px] font-medium text-slate-600">
                            Governing: {row.governingRegime}
                          </p>
                        </div>
                      );
                    }}
                  />
                  {currentComputation.grossReceiptsMinTax > 0 && (
                    <ReferenceLine
                      y={Math.round(currentComputation.grossReceiptsMinTax)}
                      stroke="#d97706"
                      strokeDasharray="4 4"
                      label={{
                        value: `Sec. 163 Floor: ${formatCompactBdt(currentComputation.grossReceiptsMinTax)}`,
                        position: 'insideTopRight',
                        fill: '#b45309',
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    />
                  )}
                  <Bar
                    dataKey="regularTax"
                    name="Regular Income Tax"
                    fill="#0f172a"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={34}
                  />
                  <Bar
                    dataKey="minimumTax"
                    name="Minimum Tax (Sec. 163)"
                    fill="#d97706"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={34}
                  />
                </BarChart>
              ) : (
                <BarChart
                  data={currentBarData}
                  margin={{ top: 14, right: 20, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="shortName"
                    tick={{ fill: '#334155', fontSize: 12, fontWeight: 500 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => formatCompactBdt(Number(v))}
                    tick={{ fill: '#475569', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={78}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const entry = payload[0].payload;
                      return (
                        <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs max-w-[260px]">
                          <p className="font-bold text-slate-900">{entry.name}</p>
                          <p className="mt-1 text-base font-bold font-mono tabular-nums text-slate-900">
                            {formatBdt(entry.amount)}
                          </p>
                          <p className="mt-1 text-slate-500">{entry.note}</p>
                        </div>
                      );
                    }}
                  />
                  {currentComputation.effectiveSection163Min > 0 && (
                    <ReferenceLine
                      y={Math.round(currentComputation.effectiveSection163Min)}
                      stroke="#d97706"
                      strokeDasharray="4 4"
                    />
                  )}
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={72}>
                    {currentBarData.map((entry) => (
                      <Cell key={entry.shortName} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Effective Rate Footnote Strip */}
          <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 tabular-nums">
            <span>
              Effective tax on gross receipts:{' '}
              <strong className="font-mono text-slate-900">
                {currentComputation.effectiveRateOnGross.toFixed(2)}%
              </strong>
            </span>
            <span>
              Effective tax on taxable profit:{' '}
              <strong className="font-mono text-slate-900">
                {currentComputation.effectiveRateOnProfit !== null
                  ? `${currentComputation.effectiveRateOnProfit.toFixed(2)}%`
                  : 'N/A (Loss / Zero Profit)'}
              </strong>
            </span>
            <span>
              Accounting profit:{' '}
              <strong
                className={`font-mono ${
                  currentComputation.accountingProfit < 0 ? 'text-red-700' : 'text-slate-900'
                }`}
              >
                {formatBdt(currentComputation.accountingProfit)}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Sortable Multi-Scenario Comparison Table */}
      <div className="border-t border-slate-200">
        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50/60 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Scenario Comparison Ledger (Click Any Row to Inspect)
            </h3>
            <p className="text-xs text-slate-500">
              Click column headers to sort · Active profit margin row is highlighted
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-600">
            Entity: {activePreset.shortLabel}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table
            data-sort-managed="react"
            className="w-full text-left border-collapse min-w-[760px]"
          >
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <SortableTh
                  label="Profit Margin"
                  sortKey="marginPct"
                  direction={getSortDirection('marginPct')}
                  onSort={requestSort}
                  className="py-3 px-4"
                />
                <SortableTh
                  label="Taxable Profit"
                  sortKey="taxableProfit"
                  direction={getSortDirection('taxableProfit')}
                  onSort={requestSort}
                  align="right"
                  className="py-3 px-4"
                />
                <SortableTh
                  label={`Regular Tax (${regularRatePct}%)`}
                  sortKey="regularTax"
                  direction={getSortDirection('regularTax')}
                  onSort={requestSort}
                  align="right"
                  className="py-3 px-4"
                />
                <SortableTh
                  label={`Min Tax (${minTaxRatePct}%)`}
                  sortKey="minimumTax"
                  direction={getSortDirection('minimumTax')}
                  onSort={requestSort}
                  align="right"
                  className="py-3 px-4"
                />
                <SortableTh
                  label="Variance (Reg − Min)"
                  sortKey="difference"
                  direction={getSortDirection('difference')}
                  onSort={requestSort}
                  align="right"
                  className="py-3 px-4"
                />
                <SortableTh
                  label="Final Payable"
                  sortKey="finalTaxPayable"
                  direction={getSortDirection('finalTaxPayable')}
                  onSort={requestSort}
                  align="right"
                  className="py-3 px-4"
                />
                <SortableTh
                  label="Governing Regime"
                  sortKey="governingRegime"
                  direction={getSortDirection('governingRegime')}
                  onSort={requestSort}
                  className="py-3 px-4"
                />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {sortedScenarios.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => setProfitMarginPct(row.marginPct)}
                  className={`cursor-pointer transition-colors ${
                    row.isCurrent
                      ? 'bg-emerald-50/70 hover:bg-emerald-50 font-medium'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="py-2.5 px-4 font-mono tabular-nums text-slate-900">
                    {row.label}
                    {row.isCurrent && (
                      <span className="ml-2 text-xs font-sans font-semibold text-emerald-700">
                        (Selected)
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700">
                    {formatBdt(row.taxableProfit)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-900">
                    {formatBdt(row.regularTax)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-amber-800">
                    {formatBdt(row.minimumTax)}
                  </td>
                  <td
                    className={`py-2.5 px-4 text-right font-mono tabular-nums font-semibold ${
                      row.difference < 0 ? 'text-red-700' : 'text-emerald-700'
                    }`}
                  >
                    {row.difference > 0 ? '+' : ''}
                    {formatBdt(row.difference)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                    {formatBdt(row.finalTaxPayable)}
                  </td>
                  <td className="py-2.5 px-4 text-xs font-semibold text-slate-700">
                    {row.governingRegime}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default Section163ComparativeDashboard;
