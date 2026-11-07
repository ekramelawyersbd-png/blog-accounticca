import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Sparkles, 
  Search, 
  Filter, 
  Scale, 
  Building2, 
  ShieldCheck, 
  Users, 
  Coins, 
  HelpCircle, 
  Calendar, 
  CheckCircle2, 
  Info,
  Layers,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { TaxScenarioBarComparison } from './TaxScenarioBarComparison';

export interface TaxSlabRow {
  id: string;
  category: string;
  taxFreeThreshold: number;
  tierLabel: string;
  tierAmount: number | 'balance'; // e.g. 400000, 300000, or 'balance'
  ratePercent: number;
  assessmentYears: string;
  sourceRef: string;
}

export interface CorporateRateRow {
  category: string;
  standardRate: string;
  compliantBankingRate?: string;
  assessmentYear: string;
  notes: string;
}

export const TAX_SLABS_DATA: TaxSlabRow[] = [
  // AY 2026-2027 & 2027-2028 - General Individual
  { id: '1', category: 'General Individual (Male, under 65)', taxFreeThreshold: 400000, tierLabel: 'First BDT 400,000', tierAmount: 400000, ratePercent: 0, assessmentYears: '2026-2027, 2027-2028', sourceRef: 'Finance Act 2026 [1-6]' },
  { id: '2', category: 'General Individual (Male, under 65)', taxFreeThreshold: 400000, tierLabel: 'Next BDT 300,000', tierAmount: 300000, ratePercent: 10, assessmentYears: '2026-2027, 2027-2028', sourceRef: 'Finance Act 2026 [1-6]' },
  { id: '3', category: 'General Individual (Male, under 65)', taxFreeThreshold: 400000, tierLabel: 'Next BDT 400,000', tierAmount: 400000, ratePercent: 15, assessmentYears: '2026-2027, 2027-2028', sourceRef: 'Finance Act 2026 [1-6]' },
  { id: '4', category: 'General Individual (Male, under 65)', taxFreeThreshold: 400000, tierLabel: 'Next BDT 500,000', tierAmount: 500000, ratePercent: 20, assessmentYears: '2026-2027, 2027-2028', sourceRef: 'Finance Act 2026 [1-6]' },
  { id: '5', category: 'General Individual (Male, under 65)', taxFreeThreshold: 400000, tierLabel: 'Next BDT 2,000,000', tierAmount: 2000000, ratePercent: 25, assessmentYears: '2026-2027, 2027-2028', sourceRef: 'Finance Act 2026 [1-6]' },
  { id: '6', category: 'General Individual (Male, under 65)', taxFreeThreshold: 400000, tierLabel: 'On Balance', tierAmount: 'balance', ratePercent: 30, assessmentYears: '2026-2027, 2027-2028', sourceRef: 'Finance Act 2026 [1-6]' },

  // AY 2026-2027 & 2027-2028 - Women & Senior Citizens (65+)
  { id: '7', category: 'Women and Senior Citizens (Aged 65 or above)', taxFreeThreshold: 450000, tierLabel: 'First BDT 450,000', tierAmount: 450000, ratePercent: 0, assessmentYears: '2026-2027, 2027-2028', sourceRef: 'Finance Act 2026 [1, 2, 6]' },
  { id: '8', category: 'Women and Senior Citizens (Aged 65 or above)', taxFreeThreshold: 450000, tierLabel: 'Next BDT 300,000', tierAmount: 300000, ratePercent: 10, assessmentYears: '2026-2027, 2027-2028', sourceRef: 'Finance Act 2026 [1, 2, 6]' },
  { id: '9', category: 'Women and Senior Citizens (Aged 65 or above)', taxFreeThreshold: 450000, tierLabel: 'Next BDT 400,000', tierAmount: 400000, ratePercent: 15, assessmentYears: '2026-2027, 2027-2028', sourceRef: 'Finance Act 2026 [1, 2, 6]' },
  { id: '10', category: 'Women and Senior Citizens (Aged 65 or above)', taxFreeThreshold: 450000, tierLabel: 'Next BDT 500,000', tierAmount: 500000, ratePercent: 20, assessmentYears: '2026-2027, 2027-2028', sourceRef: 'Finance Act 2026 [1, 2, 6]' },
  { id: '11', category: 'Women and Senior Citizens (Aged 65 or above)', taxFreeThreshold: 450000, tierLabel: 'Next BDT 2,000,000', tierAmount: 2000000, ratePercent: 25, assessmentYears: '2026-2027, 2027-2028', sourceRef: 'Finance Act 2026 [1, 2, 6]' },
  { id: '12', category: 'Women and Senior Citizens (Aged 65 or above)', taxFreeThreshold: 450000, tierLabel: 'On Balance', tierAmount: 'balance', ratePercent: 30, assessmentYears: '2026-2027, 2027-2028', sourceRef: 'Finance Act 2026 [1, 2, 6]' },

  // AY 2026-2027 & 2027-2028 - Third Gender & Persons with Disability
  { id: '13', category: 'Third Gender & Persons with Disability', taxFreeThreshold: 525000, tierLabel: 'First BDT 525,000', tierAmount: 525000, ratePercent: 0, assessmentYears: '2026-2027, 2027-2028', sourceRef: 'Finance Act 2026 [1, 2, 6]' },
  { id: '14', category: 'Third Gender & Persons with Disability', taxFreeThreshold: 525000, tierLabel: 'Next BDT 300,000', tierAmount: 300000, ratePercent: 10, assessmentYears: '2026-2027, 2027-2028', sourceRef: 'Finance Act 2026 [1, 2, 6]' },
  { id: '15', category: 'Third Gender & Persons with Disability', taxFreeThreshold: 525000, tierLabel: 'Next BDT 400,000', tierAmount: 400000, ratePercent: 15, assessmentYears: '2026-2027, 2027-2028', sourceRef: 'Finance Act 2026 [1, 2, 6]' },
  { id: '16', category: 'Third Gender & Persons with Disability', taxFreeThreshold: 525000, tierLabel: 'Next BDT 500,000', tierAmount: 500000, ratePercent: 20, assessmentYears: '2026-2027, 2027-2028', sourceRef: 'Finance Act 2026 [1, 2, 6]' },
  { id: '17', category: 'Third Gender & Persons with Disability', taxFreeThreshold: 525000, tierLabel: 'Next BDT 2,000,000', tierAmount: 2000000, ratePercent: 25, assessmentYears: '2026-2027, 2027-2028', sourceRef: 'Finance Act 2026 [1, 2, 6]' },
  { id: '18', category: 'Third Gender & Persons with Disability', taxFreeThreshold: 525000, tierLabel: 'On Balance', tierAmount: 'balance', ratePercent: 30, assessmentYears: '2026-2027, 2027-2028', sourceRef: 'Finance Act 2026 [1, 2, 6]' },

  // AY 2026-2027 & 2027-2028 - Gazetted Freedom Fighters & July Warriors 2024
  { id: '19', category: 'Gazetted War-Wounded Freedom Fighters & July Warriors 2024', taxFreeThreshold: 550000, tierLabel: 'First BDT 550,000', tierAmount: 550000, ratePercent: 0, assessmentYears: '2026-2027, 2027-2028', sourceRef: 'Finance Act 2026 [1, 2, 6]' },
  { id: '20', category: 'Gazetted War-Wounded Freedom Fighters & July Warriors 2024', taxFreeThreshold: 550000, tierLabel: 'Next BDT 300,000', tierAmount: 300000, ratePercent: 10, assessmentYears: '2026-2027, 2027-2028', sourceRef: 'Finance Act 2026 [1, 2, 6]' },
  { id: '21', category: 'Gazetted War-Wounded Freedom Fighters & July Warriors 2024', taxFreeThreshold: 550000, tierLabel: 'Next BDT 400,000', tierAmount: 400000, ratePercent: 15, assessmentYears: '2026-2027, 2027-2028', sourceRef: 'Finance Act 2026 [1, 2, 6]' },
  { id: '22', category: 'Gazetted War-Wounded Freedom Fighters & July Warriors 2024', taxFreeThreshold: 550000, tierLabel: 'Next BDT 500,000', tierAmount: 500000, ratePercent: 20, assessmentYears: '2026-2027, 2027-2028', sourceRef: 'Finance Act 2026 [1, 2, 6]' },
  { id: '23', category: 'Gazetted War-Wounded Freedom Fighters & July Warriors 2024', taxFreeThreshold: 550000, tierLabel: 'Next BDT 2,000,000', tierAmount: 2000000, ratePercent: 25, assessmentYears: '2026-2027, 2027-2028', sourceRef: 'Finance Act 2026 [1, 2, 6]' },
  { id: '24', category: 'Gazetted War-Wounded Freedom Fighters & July Warriors 2024', taxFreeThreshold: 550000, tierLabel: 'On Balance', tierAmount: 'balance', ratePercent: 30, assessmentYears: '2026-2027, 2027-2028', sourceRef: 'Finance Act 2026 [1, 2, 6]' },

  // AY 2028-2029 & 2029-2030 - General Individual Roadmap
  { id: '25', category: 'General Individual (Male, under 65)', taxFreeThreshold: 450000, tierLabel: 'Up to BDT 450,000', tierAmount: 450000, ratePercent: 0, assessmentYears: '2028-2029 & 2029-2030', sourceRef: 'Finance Act 2026 Roadmap [1]' },
  { id: '26', category: 'General Individual (Male, under 65)', taxFreeThreshold: 450000, tierLabel: 'Next BDT 300,000', tierAmount: 300000, ratePercent: 10, assessmentYears: '2028-2029 & 2029-2030', sourceRef: 'Finance Act 2026 Roadmap [1]' },
  { id: '27', category: 'General Individual (Male, under 65)', taxFreeThreshold: 450000, tierLabel: 'Next BDT 400,000', tierAmount: 400000, ratePercent: 15, assessmentYears: '2028-2029 & 2029-2030', sourceRef: 'Finance Act 2026 Roadmap [1]' },
  { id: '28', category: 'General Individual (Male, under 65)', taxFreeThreshold: 450000, tierLabel: 'Next BDT 500,000', tierAmount: 500000, ratePercent: 20, assessmentYears: '2028-2029 & 2029-2030', sourceRef: 'Finance Act 2026 Roadmap [1]' },
  { id: '29', category: 'General Individual (Male, under 65)', taxFreeThreshold: 450000, tierLabel: 'Next BDT 2,000,000', tierAmount: 2000000, ratePercent: 25, assessmentYears: '2028-2029 & 2029-2030', sourceRef: 'Finance Act 2026 Roadmap [1]' },
  { id: '30', category: 'General Individual (Male, under 65)', taxFreeThreshold: 450000, tierLabel: 'Next BDT 26,350,000', tierAmount: 26350000, ratePercent: 30, assessmentYears: '2028-2029 & 2029-2030', sourceRef: 'Finance Act 2026 Roadmap [1]' },
  { id: '31', category: 'General Individual (Male, under 65)', taxFreeThreshold: 450000, tierLabel: 'On Balance', tierAmount: 'balance', ratePercent: 35, assessmentYears: '2028-2029 & 2029-2030', sourceRef: 'Finance Act 2026 Roadmap [1]' },

  // AY 2030-2031 - General Individual Roadmap
  { id: '32', category: 'General Individual (Male, under 65)', taxFreeThreshold: 500000, tierLabel: 'Up to BDT 500,000', tierAmount: 500000, ratePercent: 0, assessmentYears: '2030-2031', sourceRef: 'Finance Act 2026 Roadmap [1]' },
  { id: '33', category: 'General Individual (Male, under 65)', taxFreeThreshold: 500000, tierLabel: 'Next BDT 300,000', tierAmount: 300000, ratePercent: 10, assessmentYears: '2030-2031', sourceRef: 'Finance Act 2026 Roadmap [1]' },
  { id: '34', category: 'General Individual (Male, under 65)', taxFreeThreshold: 500000, tierLabel: 'Next BDT 400,000', tierAmount: 400000, ratePercent: 15, assessmentYears: '2030-2031', sourceRef: 'Finance Act 2026 Roadmap [1]' },
  { id: '35', category: 'General Individual (Male, under 65)', taxFreeThreshold: 500000, tierLabel: 'Next BDT 500,000', tierAmount: 500000, ratePercent: 20, assessmentYears: '2030-2031', sourceRef: 'Finance Act 2026 Roadmap [1]' },
  { id: '36', category: 'General Individual (Male, under 65)', taxFreeThreshold: 500000, tierLabel: 'Next BDT 2,000,000', tierAmount: 2000000, ratePercent: 25, assessmentYears: '2030-2031', sourceRef: 'Finance Act 2026 Roadmap [1]' },
  { id: '37', category: 'General Individual (Male, under 65)', taxFreeThreshold: 500000, tierLabel: 'Next BDT 26,300,000', tierAmount: 26300000, ratePercent: 30, assessmentYears: '2030-2031', sourceRef: 'Finance Act 2026 Roadmap [1]' },
  { id: '38', category: 'General Individual (Male, under 65)', taxFreeThreshold: 500000, tierLabel: 'On Balance', tierAmount: 'balance', ratePercent: 35, assessmentYears: '2030-2031', sourceRef: 'Finance Act 2026 Roadmap [1]' },

  // AY 2025-2026 - General Taxpayer Previous Year
  { id: '39', category: 'General Individual (Male, under 65)', taxFreeThreshold: 375000, tierLabel: 'First BDT 375,000', tierAmount: 375000, ratePercent: 0, assessmentYears: '2025-2026', sourceRef: 'Arthik Alap [7]' },
  { id: '40', category: 'General Individual (Male, under 65)', taxFreeThreshold: 375000, tierLabel: 'Next BDT 300,000', tierAmount: 300000, ratePercent: 10, assessmentYears: '2025-2026', sourceRef: 'Arthik Alap [7]' },
  { id: '41', category: 'General Individual (Male, under 65)', taxFreeThreshold: 375000, tierLabel: 'Next BDT 400,000', tierAmount: 400000, ratePercent: 15, assessmentYears: '2025-2026', sourceRef: 'Arthik Alap [7]' },
  { id: '42', category: 'General Individual (Male, under 65)', taxFreeThreshold: 375000, tierLabel: 'Next BDT 500,000', tierAmount: 500000, ratePercent: 20, assessmentYears: '2025-2026', sourceRef: 'Arthik Alap [7]' },
  { id: '43', category: 'General Individual (Male, under 65)', taxFreeThreshold: 375000, tierLabel: 'Next BDT 2,000,000', tierAmount: 2000000, ratePercent: 25, assessmentYears: '2025-2026', sourceRef: 'Arthik Alap [7]' },
  { id: '44', category: 'General Individual (Male, under 65)', taxFreeThreshold: 375000, tierLabel: 'On Balance', tierAmount: 'balance', ratePercent: 30, assessmentYears: '2025-2026', sourceRef: 'Arthik Alap [7]' }
];

export const CORPORATE_RATES_DATA: CorporateRateRow[] = [
  { category: 'Publicly traded company (> 10% shares through IPO)', standardRate: '22.5%', compliantBankingRate: '20.0%', assessmentYear: '2026-2027', notes: 'Requires all receipts, expenses, and investments above Tk 5L via banking channels' },
  { category: 'Publicly traded company (10% or less shares through IPO)', standardRate: '25.0%', compliantBankingRate: '22.5%', assessmentYear: '2026-2027', notes: 'Requires all transactions via banking channel' },
  { category: 'Non-publicly traded company (Standard Private Ltd.)', standardRate: '27.5%', compliantBankingRate: '25.0%', assessmentYear: '2026-2027', notes: 'Standard private limited company tax rate' },
  { category: 'One Person Company (OPC)', standardRate: '22.5%', compliantBankingRate: '20.0%', assessmentYear: '2026-2027', notes: 'Reduced corporate rate for single shareholder companies' },
  { category: 'Trust, Association of Persons (AOP), and Firm', standardRate: '27.5%', compliantBankingRate: '25.0%', assessmentYear: '2026-2027', notes: 'Entity level assessment rate' },
  { category: 'Listed banks, insurance, & financial institutions', standardRate: '37.5%', assessmentYear: '2026-2027', notes: 'Financial sector statutory rate' },
  { category: 'Non-listed banks, insurance, & financial institutions', standardRate: '40.0%', assessmentYear: '2026-2027', notes: 'Non-listed financial institutions' },
  { category: 'Merchant banks', standardRate: '37.5%', assessmentYear: '2026-2027', notes: 'Capital market financial entities' },
  { category: 'Mobile phone operator companies', standardRate: '45.0%', assessmentYear: '2026-2027', notes: 'Telecommunications sector rate' },
  { category: 'Tobacco product manufacturing companies', standardRate: '45.0%', assessmentYear: '2026-2027', notes: 'Subject to 2.5% additional health surcharge' },
  { category: 'Private universities, medical, dental & IT colleges', standardRate: '5.0%', assessmentYear: '2026-2027', notes: 'Concessional rate under official Gazette notification' },
  { category: 'Individual Taxpayer (Capital Gains from Gold Sale)', standardRate: '5.0%', assessmentYear: '2026-2027', notes: 'Specific flat capital gains rate on gold sales' }
];

export function TaxSlabsExplorer() {
  const [selectedAY, setSelectedAY] = useState<string>('2026-2027, 2027-2028');
  const [selectedCategory, setSelectedCategory] = useState<string>('General Individual (Male, under 65)');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hasDisabledChild, setHasDisabledChild] = useState<boolean>(false);
  const [simulatedIncome, setSimulatedIncome] = useState<number>(1200000); // BDT 12 Lakhs default

  // Extract unique AYs
  const availableAYs = ['2026-2027, 2027-2028', '2028-2029 & 2029-2030', '2030-2031', '2025-2026', 'Corporate Rates'];

  // Categories available for selected AY
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    TAX_SLABS_DATA.forEach(row => {
      if (row.assessmentYears === selectedAY) {
        cats.add(row.category);
      }
    });
    if (cats.size === 0) {
      cats.add('General Individual (Male, under 65)');
      cats.add('Women and Senior Citizens (Aged 65 or above)');
      cats.add('Third Gender & Persons with Disability');
      cats.add('Gazetted War-Wounded Freedom Fighters & July Warriors 2024');
    }
    return Array.from(cats);
  }, [selectedAY]);

  // Active Slabs Filtered
  const activeSlabs = useMemo(() => {
    return TAX_SLABS_DATA.filter(row => {
      const matchesAY = row.assessmentYears === selectedAY;
      const matchesCat = row.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || 
        row.category.toLowerCase().includes(q) ||
        row.tierLabel.toLowerCase().includes(q) ||
        row.assessmentYears.toLowerCase().includes(q) ||
        row.sourceRef.toLowerCase().includes(q);

      return matchesAY && matchesCat && matchesSearch;
    });
  }, [selectedAY, selectedCategory, searchQuery]);

  // Calculate Base Tax-Free Threshold including Parent of Disabled Person Add-on
  const activeBaseThreshold = useMemo(() => {
    if (activeSlabs.length > 0) {
      return activeSlabs[0].taxFreeThreshold;
    }
    return 400000;
  }, [activeSlabs]);

  const effectiveTaxFreeThreshold = activeBaseThreshold + (hasDisabledChild ? 50000 : 0);

  // Dynamic Slab Computation for Live Simulator
  const slabBreakdown = useMemo(() => {
    let remainingIncome = Number(simulatedIncome) || 0;
    let totalTax = 0;
    const steps: { label: string; slabLimit: string; rate: number; taxableInSlab: number; taxForSlab: number }[] = [];

    if (activeSlabs.length === 0) return { totalTax: 0, steps: [] };

    // First Slab (0% Tax Free)
    const firstSlabLimit = effectiveTaxFreeThreshold;
    const inFirst = Math.min(remainingIncome, firstSlabLimit);
    steps.push({
      label: `First BDT ${firstSlabLimit.toLocaleString()} (Tax-Free Threshold)`,
      slabLimit: `BDT ${firstSlabLimit.toLocaleString()}`,
      rate: 0,
      taxableInSlab: inFirst,
      taxForSlab: 0
    });
    remainingIncome -= inFirst;

    // Remaining Slabs
    for (let i = 1; i < activeSlabs.length; i++) {
      if (remainingIncome <= 0) break;
      const slab = activeSlabs[i];
      const rate = slab.ratePercent;

      if (slab.tierAmount === 'balance') {
        const tax = (remainingIncome * rate) / 100;
        totalTax += tax;
        steps.push({
          label: slab.tierLabel,
          slabLimit: 'On Balance',
          rate,
          taxableInSlab: remainingIncome,
          taxForSlab: tax
        });
        remainingIncome = 0;
      } else {
        const limit = Number(slab.tierAmount);
        const inSlab = Math.min(remainingIncome, limit);
        const tax = (inSlab * rate) / 100;
        totalTax += tax;
        steps.push({
          label: slab.tierLabel,
          slabLimit: `BDT ${limit.toLocaleString()}`,
          rate,
          taxableInSlab: inSlab,
          taxForSlab: tax
        });
        remainingIncome -= inSlab;
      }
    }

    return { totalTax, steps };
  }, [simulatedIncome, activeSlabs, effectiveTaxFreeThreshold]);

  return (
    <div className="not-prose my-10 bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-6 sm:p-8 text-white">
        <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-extrabold uppercase tracking-widest px-3.5 py-1.5 rounded-full mb-3">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Statutory Rates Hub — Finance Act 2026</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
          Bangladesh Income Tax Slabs & Corporate Rates Explorer
        </h2>
        <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
          Interactive multi-year statutory slab explorer for individual taxpayers (General, Women, Senior Citizens, July Warriors 2024, Disabled) and corporate entities under the Income Tax Act, 2023 & Finance Act 2026.
        </p>

        {/* Assessment Year Filter Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-slate-800">
          {availableAYs.map((ay) => (
            <button
              key={ay}
              onClick={() => {
                setSelectedAY(ay);
                if (ay !== 'Corporate Rates' && !availableCategories.includes(selectedCategory)) {
                  setSelectedCategory('General Individual (Male, under 65)');
                }
              }}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                selectedAY === ay
                  ? 'bg-emerald-500 text-slate-950 shadow-md scale-102 ring-2 ring-emerald-300'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>{ay === 'Corporate Rates' ? '🏢 Corporate Tax Rates (AY 2026-27)' : `AY ${ay}`}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content View */}
      {selectedAY !== 'Corporate Rates' ? (
        <div className="p-6 sm:p-8 bg-slate-50/50">
          {/* Controls Bar: Category Selector & Special Add-ons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Taxpayer Category Selector */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Select Taxpayer Category:</span>
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Parent of Disabled Child Toggle */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Parent / Guardian of Person with Disability?</span>
                </label>
                <input
                  type="checkbox"
                  checked={hasDisabledChild}
                  onChange={(e) => setHasDisabledChild(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Adds <strong>+ BDT 50,000</strong> to base tax-free threshold (Section 5 adjustment).
              </p>
            </div>
          </div>

          {/* Statutory Threshold Summary Card */}
          <div className="bg-gradient-to-r from-slate-900 to-emerald-950 p-6 rounded-3xl text-white shadow-md mb-8 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest block mb-1">
                  Active Tax-Free Threshold ({selectedAY}):
                </span>
                <div className="text-3xl font-black text-white">
                  BDT {effectiveTaxFreeThreshold.toLocaleString()}
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  Base BDT {activeBaseThreshold.toLocaleString()} {hasDisabledChild ? '+ BDT 50,000 (Parent of Disabled Person Add-on)' : ''}
                </div>
              </div>

              <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10 text-xs">
                <span className="text-emerald-300 font-bold block mb-1">Applicable Period:</span>
                <span className="text-white font-mono font-bold">Assessment Year {selectedAY}</span>
              </div>
            </div>
          </div>

          {/* Active Slabs Table */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs mb-8">
            <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              <span>Statutory Income Tax Slabs ({selectedCategory})</span>
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead className="bg-slate-900 text-white text-xs uppercase tracking-wider font-extrabold">
                  <tr>
                    <th className="py-3.5 px-4 min-w-[200px]">Taxable Income Tier</th>
                    <th className="py-3.5 px-4 w-32">Tax Rate</th>
                    <th className="py-3.5 px-4 min-w-[180px]">Statutory Base Threshold</th>
                    <th className="py-3.5 px-4 w-40">Assessment Year</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs sm:text-sm bg-white font-medium">
                  {activeSlabs.map((slab) => (
                    <tr key={slab.id} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {slab.tierLabel}
                      </td>
                      <td className="py-3.5 px-4 font-black">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-extrabold ${
                          slab.ratePercent === 0 
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {slab.ratePercent}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        BDT {slab.taxFreeThreshold.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {slab.assessmentYears}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Live Slab Tax Simulator */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-600" />
              <span>Live Individual Income Tax Calculation Simulator</span>
            </h3>
            <p className="text-xs text-slate-600 mb-6">
              Enter annual total taxable income to evaluate exact progressive slab tax computation.
            </p>

            {/* Income Input */}
            <div className="max-w-md bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Total Taxable Business / Salary Income (BDT)
              </label>
              <input
                type="number"
                value={simulatedIncome}
                onChange={(e) => setSimulatedIncome(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-base font-extrabold text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Tk. {(simulatedIncome/100000).toFixed(2)} Lakhs</span>
            </div>

            {/* Slab Calculation Breakdown */}
            <div className="space-y-2 mb-6">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block mb-2">
                Step-by-Step Progressive Slab Tax Breakdown:
              </span>
              <div className="space-y-2">
                {slabBreakdown.steps.map((st, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm">
                    <div>
                      <span className="font-bold text-slate-900 block">{st.label}</span>
                      <span className="text-xs text-slate-500 font-mono">Taxable in slab: BDT {st.taxableInSlab.toLocaleString()} @ {st.rate}%</span>
                    </div>
                    <div className="text-right font-black text-emerald-800 font-mono">
                      BDT {st.taxForSlab.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gross Tax Result Box */}
            <div className="p-5 bg-gradient-to-br from-slate-900 to-emerald-950 rounded-2xl text-white flex items-center justify-between border border-slate-800">
              <div>
                <span className="text-xs font-extrabold uppercase text-emerald-400 tracking-wider block mb-1">
                  Gross Income Tax Payable (Before Rebate):
                </span>
                <span className="text-2xl font-black text-white">
                  BDT {slabBreakdown.totalTax.toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-slate-300 text-right">
                <span>Effective Tax Rate: </span>
                <strong className="text-emerald-300 font-mono">
                  {simulatedIncome > 0 ? ((slabBreakdown.totalTax / simulatedIncome) * 100).toFixed(2) : 0}%
                </strong>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Corporate Tax Rates View */
        <div className="p-6 sm:p-8 bg-slate-50/50">
          <div className="mb-6">
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <span>Corporate Tax Rates (Assessment Year 2026–2027)</span>
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Applicable statutory corporate income tax tiers under Finance Act 2026 with compliant banking channel incentives.
            </p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200 shadow-2xs bg-white">
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead className="bg-slate-900 text-white text-xs uppercase tracking-wider font-extrabold">
                <tr>
                  <th className="py-3.5 px-4 min-w-[220px]">Corporate Entity Category</th>
                  <th className="py-3.5 px-4 w-32">Standard Tax Rate</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Compliant Banking Rate</th>
                  <th className="py-3.5 px-4 min-w-[220px]">Statutory Conditions & Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs sm:text-sm font-medium">
                {CORPORATE_RATES_DATA.map((corp, idx) => (
                  <tr key={idx} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-900">
                      {corp.category}
                    </td>
                    <td className="py-4 px-4 font-black text-slate-900">
                      <span className="inline-block bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-md text-xs font-extrabold">
                        {corp.standardRate}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-black">
                      {corp.compliantBankingRate ? (
                        <span className="inline-block bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-1 rounded-md text-xs font-extrabold">
                          {corp.compliantBankingRate}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">N/A</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-600 italic">
                      {corp.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Side-by-Side Two-Scenario Comparison via Recharts */}
      <div className="p-6 sm:p-8 border-t border-slate-200 bg-slate-50/40">
        <TaxScenarioBarComparison
          activeCalculatorInputs={{
            income: String(simulatedIncome || 1200000),
            investment: '0',
            tds: '0',
            category: selectedCategory.includes('Women')
              ? 'female_senior'
              : selectedCategory.includes('Disabled')
              ? 'disabled'
              : selectedCategory.includes('Freedom')
              ? 'freedom_fighter'
              : 'general',
            disabledDependents: hasDisabledChild ? 1 : 0,
            location: 'dhaka_ctg',
            isFirstTimeFiler: false
          }}
          activeCalculatorLabel="Active Slab Simulator Income"
        />
      </div>
    </div>
  );
}
