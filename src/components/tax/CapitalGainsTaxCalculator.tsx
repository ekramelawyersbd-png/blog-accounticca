import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  Copy, 
  Check, 
  Building2, 
  Gem, 
  TrendingUp, 
  Calendar, 
  Clock, 
  HelpCircle, 
  ArrowRight, 
  Sparkles, 
  Info, 
  Scale, 
  Save, 
  Trash2, 
  Share2, 
  FileText,
  BadgePercent,
  Landmark,
  ShieldAlert,
  Download
} from 'lucide-react';

export type AssetType = 'real_estate' | 'personal_valuables' | 'listed_securities' | 'other';
export type TaxpayerGenderCategory = 'general' | 'female_senior' | 'disabled' | 'freedom_fighter';

export interface SavedCapitalGainsCalc {
  id: string;
  timestamp: number;
  dateFormatted: string;
  assetType: AssetType;
  assetLabel: string;
  holdingPeriodYears: number;
  purchasePrice: number;
  salePrice: number;
  improvements: number;
  netGain: number;
  taxPayable: number;
  effectiveRate: number;
  installmentAmount?: number;
}

export interface CapitalGainsTaxCalculatorProps {
  className?: string;
  initialAssetType?: AssetType;
}

export function CapitalGainsTaxCalculator({
  className = '',
  initialAssetType = 'real_estate'
}: CapitalGainsTaxCalculatorProps) {
  // Inputs
  const [assetType, setAssetType] = useState<AssetType>(initialAssetType);
  const [purchasePrice, setPurchasePrice] = useState<number>(5000000);
  const [purchaseYear, setPurchaseYear] = useState<number>(2015);
  const [salePrice, setSalePrice] = useState<number>(12000000);
  const [saleYear, setSaleYear] = useState<number>(2026);
  const [improvementCosts, setImprovementCosts] = useState<number>(0);
  
  // For short term (held <= 5 years)
  const [otherIncome, setOtherIncome] = useState<number>(500000);
  const [taxpayerCategory, setTaxpayerCategory] = useState<TaxpayerGenderCategory>('general');
  const [isSponsorDirector, setIsSponsorDirector] = useState<boolean>(false);
  
  // UI states
  const [copied, setCopied] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'calculator' | 'rules' | 'history'>('calculator');

  // History state
  const [history, setHistory] = useState<SavedCapitalGainsCalc[]>(() => {
    try {
      const saved = localStorage.getItem('capital_gains_calc_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.slice(0, 5);
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Calculate Holding Period
  const holdingPeriodYears = useMemo(() => {
    const diff = Number(saleYear) - Number(purchaseYear);
    return Math.max(0, diff);
  }, [purchaseYear, saleYear]);

  const isLongTerm = holdingPeriodYears > 5;

  // Calculate Net Capital Gain
  const totalCost = Number(purchasePrice || 0) + Number(improvementCosts || 0);
  const netGain = Math.max(0, Number(salePrice || 0) - totalCost);
  const hasCapitalLoss = Number(salePrice || 0) < totalCost;
  const capitalLossAmount = hasCapitalLoss ? totalCost - Number(salePrice || 0) : 0;

  // Tax Free Threshold for individual categories (AY 2026–27)
  const taxFreeThreshold = useMemo(() => {
    switch (taxpayerCategory) {
      case 'female_senior': return 425000;
      case 'disabled': return 500000;
      case 'freedom_fighter': return 525000;
      case 'general':
      default: return 375000; // Baseline Tk. 3,75,000 (or 4,00,000 for standard male)
    }
  }, [taxpayerCategory]);

  // Compute Tax Slab calculation helper
  const computeSlabTax = (totalTaxableIncome: number) => {
    let remaining = Math.max(0, totalTaxableIncome);
    const breakdown: { slab: string; rate: number; taxablePortion: number; tax: number }[] = [];

    // 0% Slab
    const zeroPortion = Math.min(remaining, taxFreeThreshold);
    breakdown.push({ slab: `First BDT ${taxFreeThreshold.toLocaleString()}`, rate: 0, taxablePortion: zeroPortion, tax: 0 });
    remaining -= zeroPortion;

    // 10% Slab (Next 3 Lakh)
    if (remaining > 0) {
      const p = Math.min(remaining, 300000);
      breakdown.push({ slab: 'Next BDT 3,00,000', rate: 10, taxablePortion: p, tax: p * 0.1 });
      remaining -= p;
    }

    // 15% Slab (Next 4 Lakh)
    if (remaining > 0) {
      const p = Math.min(remaining, 400000);
      breakdown.push({ slab: 'Next BDT 4,00,000', rate: 15, taxablePortion: p, tax: p * 0.15 });
      remaining -= p;
    }

    // 20% Slab (Next 5 Lakh)
    if (remaining > 0) {
      const p = Math.min(remaining, 500000);
      breakdown.push({ slab: 'Next BDT 5,00,000', rate: 20, taxablePortion: p, tax: p * 0.2 });
      remaining -= p;
    }

    // 25% Slab (Next 5 Lakh)
    if (remaining > 0) {
      const p = Math.min(remaining, 500000);
      breakdown.push({ slab: 'Next BDT 5,00,000', rate: 25, taxablePortion: p, tax: p * 0.25 });
      remaining -= p;
    }

    // 30% Slab (Remaining)
    if (remaining > 0) {
      breakdown.push({ slab: 'Remaining Balance', rate: 30, taxablePortion: remaining, tax: remaining * 0.3 });
    }

    const totalTax = breakdown.reduce((sum, item) => sum + item.tax, 0);
    return { totalTax, breakdown };
  };

  // Calculation results based on Asset Type and Holding Period
  const calculationResult = useMemo(() => {
    if (netGain <= 0) {
      return {
        taxPayable: 0,
        rateLabel: '0%',
        methodLabel: 'No Capital Gain Realized',
        legalBasis: 'Income Tax Act 2023 / Finance Act 2026',
        installmentEligible: false,
        annualInstallment: 0,
        slabBreakdown: null,
        regularTax: 0,
        incrementalGainTax: 0
      };
    }

    // 1. REAL ESTATE / LAND / BUILDINGS
    if (assetType === 'real_estate') {
      if (isLongTerm) {
        // Flat 15% under Seventh Schedule
        const tax = netGain * 0.15;
        const annualInstallment = Math.round(tax / 3);
        return {
          taxPayable: tax,
          rateLabel: '15% Flat Rate',
          methodLabel: 'Seventh Schedule (সপ্তম তফসিল) - Long Term (> 5 Years)',
          legalBasis: 'Finance Act 2026, Seventh Schedule, Part-II',
          installmentEligible: true,
          annualInstallment: annualInstallment,
          slabBreakdown: null,
          regularTax: 0,
          incrementalGainTax: tax
        };
      } else {
        // Held <= 5 years: Added to Regular Income & taxed at slab rates
        const baseRegular = Number(otherIncome || 0);
        const combined = baseRegular + netGain;
        const baseCalc = computeSlabTax(baseRegular);
        const combinedCalc = computeSlabTax(combined);
        const incrementalTax = Math.max(0, combinedCalc.totalTax - baseCalc.totalTax);

        return {
          taxPayable: incrementalTax,
          rateLabel: 'Individual Slab Rates (0% - 30%)',
          methodLabel: 'Added to Total Income (Holding Period ≤ 5 Years)',
          legalBasis: 'Section 45 & Sixth Schedule / Finance Act 2026',
          installmentEligible: false,
          annualInstallment: 0,
          slabBreakdown: combinedCalc.breakdown,
          regularTax: baseCalc.totalTax,
          incrementalGainTax: incrementalTax,
          totalCombinedTax: combinedCalc.totalTax,
          combinedIncome: combined
        };
      }
    }

    // 2. PERSONAL VALUABLE ASSETS (Gold, Jewellery, Gems, Silver, Antiques, Artwork)
    if (assetType === 'personal_valuables') {
      const tax = netGain * 0.05;
      return {
        taxPayable: tax,
        rateLabel: '5% Flat Rate',
        methodLabel: 'Personal Valuable Assets Capital Gains Provision',
        legalBasis: 'Finance Act 2026 - Valuable Personal Assets Clause',
        installmentEligible: false,
        annualInstallment: 0,
        slabBreakdown: null,
        regularTax: 0,
        incrementalGainTax: tax
      };
    }

    // 3. LISTED SECURITIES / SHARES
    if (assetType === 'listed_securities') {
      if (isSponsorDirector) {
        const tax = netGain * 0.10;
        return {
          taxPayable: tax,
          rateLabel: '10% Flat Rate',
          methodLabel: 'Sponsor / Director Share Transfer Taxation',
          legalBasis: 'Finance Act 2026 / Seventh Schedule',
          installmentEligible: false,
          annualInstallment: 0,
          slabBreakdown: null,
          regularTax: 0,
          incrementalGainTax: tax
        };
      } else {
        // Individual investors in listed shares: 15% on gains exceeding Tk. 50 Lakh, or standard concessional
        const EXEMPTION_THRESHOLD = 5000000; // Tk. 50 Lakh threshold
        const taxableGain = Math.max(0, netGain - EXEMPTION_THRESHOLD);
        const tax = taxableGain * 0.15;
        return {
          taxPayable: tax,
          rateLabel: netGain > EXEMPTION_THRESHOLD ? '15% on Gain > Tk. 50L' : 'Exempt (Under Tk. 50L)',
          methodLabel: 'General Public Listed Securities (Concessional / Exemption Threshold)',
          legalBasis: 'Section 45 / Finance Act 2026 SRO',
          installmentEligible: false,
          annualInstallment: 0,
          slabBreakdown: null,
          regularTax: 0,
          incrementalGainTax: tax
        };
      }
    }

    // 4. OTHER CAPITAL ASSETS
    const tax = isLongTerm ? netGain * 0.15 : netGain * 0.15;
    return {
      taxPayable: tax,
      rateLabel: '15% Flat Rate',
      methodLabel: 'Standard Capital Asset Disposition',
      legalBasis: 'Finance Act 2026 / Income Tax Act 2023',
      installmentEligible: false,
      annualInstallment: 0,
      slabBreakdown: null,
      regularTax: 0,
      incrementalGainTax: tax
    };
  }, [assetType, isLongTerm, netGain, otherIncome, taxpayerCategory, isSponsorDirector]);

  // Load Preset Scenarios
  const loadPreset = (preset: 'rahman_land' | 'akter_property' | 'karim_gold') => {
    if (preset === 'rahman_land') {
      setAssetType('real_estate');
      setPurchasePrice(5000000);
      setPurchaseYear(2015);
      setSalePrice(12000000);
      setSaleYear(2026);
      setImprovementCosts(0);
      setOtherIncome(0);
    } else if (preset === 'akter_property') {
      setAssetType('real_estate');
      setPurchasePrice(4000000);
      setPurchaseYear(2023);
      setSalePrice(5000000);
      setSaleYear(2026);
      setImprovementCosts(0);
      setOtherIncome(500000);
    } else if (preset === 'karim_gold') {
      setAssetType('personal_valuables');
      setPurchasePrice(150000);
      setPurchaseYear(2012);
      setSalePrice(450000);
      setSaleYear(2026);
      setImprovementCosts(0);
      setOtherIncome(0);
    }
  };

  const handleReset = () => {
    setPurchasePrice(5000000);
    setPurchaseYear(2015);
    setSalePrice(12000000);
    setSaleYear(2026);
    setImprovementCosts(0);
    setOtherIncome(500000);
    setAssetType('real_estate');
  };

  const handleSaveCalculation = () => {
    const assetLabels: Record<AssetType, string> = {
      real_estate: 'Real Estate / Land',
      personal_valuables: 'Personal Valuables (Gold/Jewellery)',
      listed_securities: 'Listed Securities',
      other: 'Other Capital Asset'
    };

    const newRecord: SavedCapitalGainsCalc = {
      id: `cgt_${Date.now()}`,
      timestamp: Date.now(),
      dateFormatted: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      assetType,
      assetLabel: assetLabels[assetType],
      holdingPeriodYears,
      purchasePrice,
      salePrice,
      improvements: improvementCosts,
      netGain,
      taxPayable: calculationResult.taxPayable,
      effectiveRate: netGain > 0 ? (calculationResult.taxPayable / netGain) * 100 : 0,
      installmentAmount: calculationResult.installmentEligible ? calculationResult.annualInstallment : undefined
    };

    const updated = [newRecord, ...history.filter(h => h.id !== newRecord.id)].slice(0, 5);
    setHistory(updated);
    try {
      localStorage.setItem('capital_gains_calc_history', JSON.stringify(updated));
    } catch {
      // ignore
    }

    setSaveSuccessMessage('Calculation successfully saved to history!');
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  const handleCopySummary = () => {
    const summaryText = `Capital Gains Tax Calculation Summary (Bangladesh Finance Act 2026 & AY 2026–27):
Asset Type: ${assetType.replace('_', ' ').toUpperCase()}
Purchase Price: BDT ${purchasePrice.toLocaleString()} (${purchaseYear})
Selling Price: BDT ${salePrice.toLocaleString()} (${saleYear})
Improvement Costs: BDT ${improvementCosts.toLocaleString()}
Holding Period: ${holdingPeriodYears} Year(s) (${isLongTerm ? 'Held > 5 Years' : 'Held <= 5 Years'})
Net Capital Gain: BDT ${netGain.toLocaleString()}
Statutory Rate / Rule: ${calculationResult.rateLabel}
Capital Gains Tax Payable: BDT ${calculationResult.taxPayable.toLocaleString()}
${calculationResult.installmentEligible ? `3-Year Annual Installment: BDT ${calculationResult.annualInstallment.toLocaleString()} / year (AY 2026-27, 2027-28, 2028-29)` : ''}
Legal Reference: ${calculationResult.legalBasis}
Computed via Accounticca Tax Advisory Desk`;

    navigator.clipboard.writeText(summaryText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden ${className}`} id="capital-gains-tax-tool">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <Scale className="w-3.5 h-3.5 text-emerald-400" />
              Finance Act 2026 & AY 2026–27 Statutory Engine
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Calculator className="w-7 h-7 text-emerald-400 shrink-0" />
              Capital Gains Tax Calculator
              <span className="text-emerald-400 text-xl font-normal hidden sm:inline">(মূলধনী আয় কর)</span>
            </h2>
            <p className="text-slate-300 text-sm md:text-base mt-2 max-w-3xl leading-relaxed">
              Calculate exact capital gains tax, holding periods, 15% flat rate under the Seventh Schedule, 
              installment payment facilities, individual tax slabs for short-term gains, and 5% rates on personal valuables.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('calculator')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'calculator' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Calculator
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'rules' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Statutory Rules
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'history' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              History ({history.length})
            </button>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-400 mr-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Load Practical Example:
          </span>
          <button
            onClick={() => loadPreset('rahman_land')}
            className="px-2.5 py-1 text-xs rounded-md bg-slate-800/80 hover:bg-emerald-900/60 text-emerald-200 border border-slate-700 hover:border-emerald-500/50 transition-colors"
          >
            Example 1: Land Sale &gt; 5 Yrs (15% Flat + 3 Installments)
          </button>
          <button
            onClick={() => loadPreset('akter_property')}
            className="px-2.5 py-1 text-xs rounded-md bg-slate-800/80 hover:bg-emerald-900/60 text-emerald-200 border border-slate-700 hover:border-emerald-500/50 transition-colors"
          >
            Example 2: Property Sale ≤ 5 Yrs (Slab Rates)
          </button>
          <button
            onClick={() => loadPreset('karim_gold')}
            className="px-2.5 py-1 text-xs rounded-md bg-slate-800/80 hover:bg-emerald-900/60 text-emerald-200 border border-slate-700 hover:border-emerald-500/50 transition-colors"
          >
            Example 3: Gold Jewellery (5% Rate)
          </button>
        </div>
      </div>

      {activeTab === 'rules' && (
        <div className="p-6 md:p-8 space-y-6 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-base mb-1">Real Estate Held &gt; 5 Years</h3>
              <p className="text-xs font-semibold text-emerald-600 mb-2">15% Flat Tax (Seventh Schedule)</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Applies to land, buildings, flats, and commercial premises. Taxpayers may pay the resulting 15% tax liability in 
                <strong className="text-slate-800"> 3 equal annual installments</strong> across consecutive assessment years.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-base mb-1">Real Estate Held ≤ 5 Years</h3>
              <p className="text-xs font-semibold text-amber-700 mb-2">Progressive Individual Slab Rates</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Short-term capital gains are added directly to regular total income (salary, business, house property) and taxed 
                under standard individual progressive tax slabs (0%, 10%, 15%, 20%, 25%, 30%).
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center mb-3">
                <Gem className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-base mb-1">Personal Valuable Assets</h3>
              <p className="text-xs font-semibold text-indigo-700 mb-2">5% Capital Gains Tax</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Includes profits from the sale of gold jewellery, diamonds, gems, precious metals, antique artworks, and club memberships. 
                Documented acquisition receipts determine net taxable gains.
              </p>
            </div>
          </div>

          <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-5 flex items-start gap-4">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 leading-relaxed">
              <strong className="text-blue-900 block text-sm font-semibold mb-1">Corporate Restructuring Exemption Notice:</strong>
              Under the Bangladesh Finance Act 2026, capital gains arising from the transfer of capital assets during the conversion of 
              a partnership firm into a private limited company are fully exempt from tax if the 4 statutory conditions (same shareholding, 
              no cash consideration, asset carryover, and minimum 5-year lock-in) are satisfied.
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              Saved Capital Gains Computations
            </h3>
            {history.length > 0 && (
              <button
                onClick={() => {
                  setHistory([]);
                  localStorage.removeItem('capital_gains_calc_history');
                }}
                className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear History
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Calculator className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">No saved computations yet</p>
              <p className="text-xs text-slate-400 mt-1">Run a calculation and click &quot;Save Computation&quot; to keep it here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((record) => (
                <div key={record.id} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition-all shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div>
                      <span className="font-semibold text-slate-800 text-sm">{record.assetLabel}</span>
                      <span className="text-xs text-slate-500 ml-2">({record.holdingPeriodYears} yrs holding)</span>
                    </div>
                    <span className="text-xs text-slate-400">{record.dateFormatted}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
                    <div>
                      <span className="text-slate-400 block">Purchase Price</span>
                      <span className="font-medium text-slate-700">BDT {record.purchasePrice.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Sale Price</span>
                      <span className="font-medium text-slate-700">BDT {record.salePrice.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Net Gain</span>
                      <span className="font-semibold text-emerald-600">BDT {record.netGain.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Tax Payable</span>
                      <span className="font-bold text-slate-900">BDT {record.taxPayable.toLocaleString()}</span>
                    </div>
                  </div>
                  {record.installmentAmount && (
                    <div className="mt-2 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded inline-block">
                      Installment: BDT {record.installmentAmount.toLocaleString()} / year (3 annual payments)
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'calculator' && (
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Input Form Column (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Asset Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  1. Select Asset Class (সম্পদের শ্রেণী)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAssetType('real_estate')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      assetType === 'real_estate'
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-600/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <Building2 className={`w-5 h-5 mb-2 ${assetType === 'real_estate' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div>
                      <div className="text-xs font-bold">Land & Property</div>
                      <div className="text-[10px] text-slate-500">জমি ও বাড়ি / ফ্ল্যাট</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAssetType('personal_valuables')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      assetType === 'personal_valuables'
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-600/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <Gem className={`w-5 h-5 mb-2 ${assetType === 'personal_valuables' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div>
                      <div className="text-xs font-bold">Gold & Valuables</div>
                      <div className="text-[10px] text-slate-500">সোনা, রত্ন ও অলঙ্কার</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAssetType('listed_securities')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      assetType === 'listed_securities'
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-600/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <TrendingUp className={`w-5 h-5 mb-2 ${assetType === 'listed_securities' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div>
                      <div className="text-xs font-bold">Shares & Stocks</div>
                      <div className="text-[10px] text-slate-500">শেয়ার ও সিকিউরিটিজ</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAssetType('other')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      assetType === 'other'
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-600/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <BadgePercent className={`w-5 h-5 mb-2 ${assetType === 'other' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div>
                      <div className="text-xs font-bold">Other Assets</div>
                      <div className="text-[10px] text-slate-500">অন্যান্য মূলধনী সম্পদ</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Purchase Details Group */}
              <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    2. Acquisition Details (অর্জনের তথ্য)
                  </span>
                  <span className="text-[11px] text-slate-500">ক্রয়মূল্য ও অর্জনের সাল</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Purchase Price (অর্জনমূল্য) BDT
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(Math.max(0, Number(e.target.value)))}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 bg-white"
                        placeholder="50,00,000"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-medium text-slate-400">BDT</span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      {(purchasePrice / 100000).toFixed(2)} Lakh / {(purchasePrice / 10000000).toFixed(2)} Crore
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Purchase Year (অর্জনের বছর)
                    </label>
                    <input
                      type="number"
                      min="1971"
                      max="2026"
                      value={purchaseYear}
                      onChange={(e) => setPurchaseYear(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 bg-white"
                      placeholder="2015"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Year asset was purchased or registered
                    </span>
                  </div>
                </div>
              </div>

              {/* Sale Details Group */}
              <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    3. Disposal / Sale Details (বিক্রয়ের তথ্য)
                  </span>
                  <span className="text-[11px] text-slate-500">বিক্রয়মূল্য ও হস্তান্তরের সাল</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Selling Price (বিক্রয়মূল্য) BDT
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        value={salePrice}
                        onChange={(e) => setSalePrice(Math.max(0, Number(e.target.value)))}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 bg-white"
                        placeholder="1,20,00,000"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-medium text-slate-400">BDT</span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      {(salePrice / 100000).toFixed(2)} Lakh / {(salePrice / 10000000).toFixed(2)} Crore
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Sale Year (বিক্রয়ের বছর)
                    </label>
                    <input
                      type="number"
                      min={purchaseYear}
                      max="2030"
                      value={saleYear}
                      onChange={(e) => setSaleYear(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 bg-white"
                      placeholder="2026"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Fiscal Year of deed transfer (e.g., 2026 for AY 2026-27)
                    </span>
                  </div>
                </div>
              </div>

              {/* Improvements & Additional Costs */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Documented Improvement / Renovation / Legal Costs (উন্নয়ন ও সংস্কার ব্যয়) BDT
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={improvementCosts}
                    onChange={(e) => setImprovementCosts(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
                    placeholder="Boundary wall, registration, structural development..."
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-medium text-slate-400">BDT</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Permitted deductions under Section 43: Documented costs for building, renovation, boundary walls, and acquisition fees.
                </p>
              </div>

              {/* Conditional Inputs based on Asset Type / Short Term */}
              {assetType === 'real_estate' && !isLongTerm && (
                <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span className="text-xs font-bold text-amber-900">
                      Short-Term Holding Notice (≤ 5 Years): Slab Calculation Active
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Because this asset was held for <strong>{holdingPeriodYears} years</strong> (less than or equal to 5 years), 
                    the capital gain of BDT {netGain.toLocaleString()} will be added to your regular taxable income and taxed 
                    under standard progressive individual tax slabs.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Other Taxable Income (Salary/Business) BDT
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        value={otherIncome}
                        onChange={(e) => setOtherIncome(Math.max(0, Number(e.target.value)))}
                        className="w-full px-3 py-2 rounded-lg border border-amber-300 text-slate-900 text-sm bg-white"
                        placeholder="5,00,000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Taxpayer Category (করদাতার শ্রেণী)
                      </label>
                      <select
                        value={taxpayerCategory}
                        onChange={(e) => setTaxpayerCategory(e.target.value as TaxpayerGenderCategory)}
                        className="w-full px-3 py-2 rounded-lg border border-amber-300 text-slate-900 text-sm bg-white"
                      >
                        <option value="general">General Individual (Tk. 3.75L - 4.0L)</option>
                        <option value="female_senior">Female / Senior (65+) (Tk. 4.25L)</option>
                        <option value="disabled">Person with Disability (Tk. 5.0L)</option>
                        <option value="freedom_fighter">Freedom Fighter (Tk. 5.25L)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {assetType === 'listed_securities' && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-slate-700 shrink-0" />
                    <span className="text-xs font-bold text-slate-800">
                      Shareholder Status Selection
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!isSponsorDirector}
                        onChange={() => setIsSponsorDirector(false)}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>General Public Investor (Concessional / Exemption Threshold)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={isSponsorDirector}
                        onChange={() => setIsSponsorDirector(true)}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Sponsor / Director Shareholder (10% Flat Rate)</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Inputs
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Summary Copied' : 'Copy Summary'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCalculation}
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Computation
                  </button>
                </div>
              </div>

              {saveSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{saveSuccessMessage}</span>
                </div>
              )}
            </div>

            {/* Results Column (5 Cols) */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-md border border-slate-700/80">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/60">
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                    Computation Assessment
                  </span>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${
                    isLongTerm ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {holdingPeriodYears} Yrs ({isLongTerm ? 'Held > 5 Yrs' : 'Held ≤ 5 Yrs'})
                  </span>
                </div>

                {/* Net Capital Gain Card */}
                <div className="mb-5">
                  <span className="text-xs text-slate-400 block mb-1">
                    Net Capital Gain (মূলধনী আয় / নিট লাভ)
                  </span>
                  <div className="text-3xl font-extrabold tracking-tight text-white flex items-baseline gap-2">
                    <span>BDT {netGain.toLocaleString()}</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-medium mt-1 block">
                    {hasCapitalLoss ? (
                      <span className="text-rose-400">Capital Loss: BDT {capitalLossAmount.toLocaleString()}</span>
                    ) : (
                      `Selling Price (Tk. ${salePrice.toLocaleString()}) - Total Cost (Tk. ${totalCost.toLocaleString()})`
                    )}
                  </span>
                </div>

                {/* Tax Payable */}
                <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 mb-5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-300 font-medium">Capital Gains Tax Payable:</span>
                    <span className="text-xs font-semibold text-emerald-400">{calculationResult.rateLabel}</span>
                  </div>
                  <div className="text-2xl font-bold text-emerald-400">
                    BDT {calculationResult.taxPayable.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                    <span>Effective Rate:</span>
                    <span>
                      {netGain > 0 ? ((calculationResult.taxPayable / netGain) * 100).toFixed(2) : 0}% of net gain
                    </span>
                  </div>
                </div>

                {/* 3-Year Installment Facility Card (if qualified) */}
                {calculationResult.installmentEligible && (
                  <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/30 mb-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Landmark className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-300">
                        3-Year Equal Installment Facility
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mb-3 leading-relaxed">
                      Under Bangladesh Finance Act 2026, eligible real estate capital gains tax may be paid across 3 consecutive assessment years:
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-slate-900/80 p-2 rounded-lg border border-emerald-500/20">
                        <span className="text-[10px] text-slate-400 block">AY 2026–27</span>
                        <span className="font-bold text-white text-[11px]">BDT {calculationResult.annualInstallment.toLocaleString()}</span>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-lg border border-emerald-500/20">
                        <span className="text-[10px] text-slate-400 block">AY 2027–28</span>
                        <span className="font-bold text-white text-[11px]">BDT {calculationResult.annualInstallment.toLocaleString()}</span>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-lg border border-emerald-500/20">
                        <span className="text-[10px] text-slate-400 block">AY 2028–29</span>
                        <span className="font-bold text-white text-[11px]">BDT {calculationResult.annualInstallment.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Statutory Reference footer */}
                <div className="text-[11px] text-slate-400 border-t border-slate-700/60 pt-3">
                  <span className="font-semibold text-slate-300 block mb-0.5">Statutory Legal Framework:</span>
                  <span>{calculationResult.legalBasis}</span>
                </div>
              </div>

              {/* Progressive Slab Breakdown if Short-Term */}
              {calculationResult.slabBreakdown && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-amber-600" />
                    Individual Progressive Slab Breakdown
                  </h4>
                  <div className="space-y-2 text-xs">
                    {calculationResult.slabBreakdown.map((row, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-b-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700">{row.slab}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                            {row.rate}%
                          </span>
                        </div>
                        <span className="font-mono text-slate-800">
                          BDT {row.tax.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Consultation / Assessment Advisory CTA */}
              <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  <h4 className="font-bold text-sm text-emerald-950">Need Custom Legal Vetting?</h4>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed mb-3">
                  Have complex joint venture development agreements, corporate restructuring, or inheritance asset valuations? 
                  Advocate Ekramul Hoque provides direct statutory consultation.
                </p>
                <a
                  href="/contact"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900 bg-white hover:bg-emerald-100 px-3.5 py-2 rounded-lg border border-emerald-300 shadow-sm transition-colors"
                >
                  <span>Book Consultation With Advocate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CapitalGainsTaxCalculator;
