import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Calculator, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  FileText, 
  Copy, 
  Check, 
  Wheat, 
  ChevronDown, 
  ChevronUp, 
  Info,
  DollarSign,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  History,
  Save,
  Trash2,
  Clock,
  ArrowUpRight,
  FileDown,
  Share2,
  Scale,
  TrendingDown,
  TrendingUp,
  ArrowRightLeft,
  Lightbulb
} from 'lucide-react';
import { generateAgriTaxPDF } from '../../utils/taxPdfExport';

export type TaxYearScenario = '2026-27' | '2025-26';

export interface SavedAgriCalculation {
  id: string;
  timestamp: number;
  dateFormatted: string;
  totalReceipts: number;
  maintainFormalRecords: boolean;
  actualExpensesInput: number;
  calculatedExpenses: number;
  netIncome: number;
  isFarmerByOccupation: boolean;
  noOtherSignificantIncome: boolean;
  clause20Exemption: number;
  taxableIncome: number;
  category: TaxpayerCategory;
  disabledDependentsCount?: number;
  isTeaRubberProduce: boolean;
  taxPayable: number;
  effectiveRate: string;
  taxYear?: TaxYearScenario;
  isComparisonMode?: boolean;
}

interface TaxFieldTooltipProps {
  term: string;
  definition: string;
  statutoryRef?: string;
  bengaliTerm?: string;
}

function TaxFieldTooltip({ term, definition, statutoryRef, bengaliTerm }: TaxFieldTooltipProps) {
  const [open, setOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative inline-flex items-center ml-1.5" ref={tooltipRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="text-slate-400 hover:text-emerald-600 focus:outline-hidden transition-colors cursor-help p-0.5 rounded-full hover:bg-emerald-50"
        aria-label={`Tax info for ${term}`}
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {open && (
        <div 
          className="absolute z-50 w-72 sm:w-80 p-3.5 text-xs text-left bg-slate-900 text-slate-200 rounded-2xl shadow-2xl border border-slate-700/80 bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-auto"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-2 mb-2">
            <span className="font-bold text-white text-sm">{term}</span>
            {statutoryRef && (
              <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                {statutoryRef}
              </span>
            )}
          </div>
          {bengaliTerm && (
            <div className="text-[11px] font-semibold text-emerald-300 mb-1">
              {bengaliTerm}
            </div>
          )}
          <p className="text-slate-300 leading-relaxed text-xs">
            {definition}
          </p>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
}

interface AgriculturalExpenseBreakdown {
  landTaxKhajna: number;
  seedsFertilizers: number;
  irrigationFuel: number;
  laborHarvesting: number;
  loanInterest: number;
  machineryRepairs: number;
  cropInsurance: number;
  tractorDepreciation: number;
  otherDirectCosts: number;
}

export type TaxpayerCategory = 'general' | 'female_senior' | 'disabled' | 'freedom_fighter';

export function AgriculturalTaxCalculator({ className = '' }: { className?: string }) {
  // 1. Inputs: Total Agricultural Receipts
  const [totalAgriReceipts, setTotalAgriReceipts] = useState<number>(1500000);
  
  // 2. Toggle: Maintain Formal Records (false = 60% deemed expense; true = actual expenses)
  const [maintainFormalRecords, setMaintainFormalRecords] = useState<boolean>(false);
  const [actualExpensesInput, setActualExpensesInput] = useState<number>(650000);
  const [showItemizedActuals, setShowItemizedActuals] = useState<boolean>(false);
  
  const [itemizedExpenses, setItemizedExpenses] = useState<AgriculturalExpenseBreakdown>({
    landTaxKhajna: 15000,
    seedsFertilizers: 180000,
    irrigationFuel: 120000,
    laborHarvesting: 200000,
    loanInterest: 40000,
    machineryRepairs: 45000,
    cropInsurance: 15000,
    tractorDepreciation: 35000,
    otherDirectCosts: 0,
  });

  // 3. Exemption Toggles: BDT 2 Lakh Exemption (Sixth Schedule Part 1 Clause 20)
  const [isFarmerByOccupation, setIsFarmerByOccupation] = useState<boolean>(true);
  const [noOtherSignificantIncome, setNoOtherSignificantIncome] = useState<boolean>(true);

  // Optional: Taxpayer category for basic exemption threshold
  const [category, setCategory] = useState<TaxpayerCategory>('general');
  const [disabledDependentsCount, setDisabledDependentsCount] = useState<number>(0);
  const [isTeaRubberProduce, setIsTeaRubberProduce] = useState<boolean>(false);

  // Multi-Year Tax Slab Scenario Toggle: AY 2026-27 vs. AY 2025-26
  const [selectedTaxYear, setSelectedTaxYear] = useState<TaxYearScenario>('2026-27');
  const [isComparisonMode, setIsComparisonMode] = useState<boolean>(false);

  const [copied, setCopied] = useState<boolean>(false);

  // 4. Local Storage History (Last 5 Calculations)
  const [history, setHistory] = useState<SavedAgriCalculation[]>([]);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Load last 5 saved calculations from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('agri_tax_calc_history');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setHistory(parsed.slice(0, 5));
        }
      }
    } catch (e) {
      console.error('Failed to load agricultural tax history from localStorage', e);
    }
  }, []);

  // Synchronize itemized expenses sum
  const sumOfItemized = useMemo(() => {
    return Object.values(itemizedExpenses).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  }, [itemizedExpenses]);

  // Handle Tea/Rubber split under Section 40(2) (60% Agri / 40% Business)
  const { effectiveAgriProduceValue, businessPortionProduce } = useMemo(() => {
    if (isTeaRubberProduce) {
      return {
        effectiveAgriProduceValue: totalAgriReceipts * 0.60,
        businessPortionProduce: totalAgriReceipts * 0.40
      };
    }
    return {
      effectiveAgriProduceValue: totalAgriReceipts,
      businessPortionProduce: 0
    };
  }, [totalAgriReceipts, isTeaRubberProduce]);

  // Expense Calculation:
  // If maintainFormalRecords is false -> 60% deemed expense rate (Section 43)
  // If true -> actual expenses
  const calculatedExpenses = useMemo(() => {
    if (!maintainFormalRecords) {
      return effectiveAgriProduceValue * 0.60;
    }
    return actualExpensesInput;
  }, [maintainFormalRecords, effectiveAgriProduceValue, actualExpensesInput]);

  // Net Agricultural Income = Total Agricultural Receipts - Allowable Expenses
  const netAgriIncome = useMemo(() => {
    return Math.max(0, effectiveAgriProduceValue - calculatedExpenses);
  }, [effectiveAgriProduceValue, calculatedExpenses]);

  // Check BDT 2 Lakh Exemption (Clause 20)
  // Eligible if 'Farmer by Occupation' AND 'No Other Significant Income'
  const isClause20Eligible = useMemo(() => {
    return isFarmerByOccupation && noOtherSignificantIncome;
  }, [isFarmerByOccupation, noOtherSignificantIncome]);

  const clause20ExemptionAmount = useMemo(() => {
    if (isClause20Eligible) {
      return Math.min(netAgriIncome, 200000);
    }
    return 0;
  }, [isClause20Eligible, netAgriIncome]);

  // Taxable Agricultural Income
  const taxableAgriIncome = useMemo(() => {
    return Math.max(0, netAgriIncome - clause20ExemptionAmount);
  }, [netAgriIncome, clause20ExemptionAmount]);

  // Total Taxable Amount (including business portion if tea/rubber)
  const totalTaxableAmount = useMemo(() => {
    return taxableAgriIncome + businessPortionProduce;
  }, [taxableAgriIncome, businessPortionProduce]);

  // 1. AY 2026-2027 Scenario Calculation (Finance Act 2026)
  const calc2026_27 = useMemo(() => {
    let base = 400000;
    switch (category) {
      case 'female_senior':
        base = 450000;
        break;
      case 'disabled':
        base = 525000;
        break;
      case 'freedom_fighter':
        base = 550000;
        break;
      case 'general':
      default:
        base = 400000;
        break;
    }
    const additionalExemption = Math.max(0, disabledDependentsCount) * 50000;
    const threshold = base + additionalExemption;

    let balance = totalTaxableAmount;
    const slabs = [];

    // Slab 1: Basic threshold @ 0%
    const slab1Val = Math.min(balance, threshold);
    slabs.push({
      label: `First BDT ${threshold.toLocaleString('en-IN')}`,
      rate: '0%',
      amount: slab1Val,
      tax: 0
    });
    balance = Math.max(0, balance - slab1Val);

    // Slab 2: Next BDT 3,00,000 @ 10%
    if (balance > 0) {
      const slab2Val = Math.min(balance, 300000);
      slabs.push({
        label: 'Next BDT 3,00,000',
        rate: '10%',
        amount: slab2Val,
        tax: slab2Val * 0.10
      });
      balance = Math.max(0, balance - slab2Val);
    }

    // Slab 3: Next BDT 4,00,000 @ 15%
    if (balance > 0) {
      const slab3Val = Math.min(balance, 400000);
      slabs.push({
        label: 'Next BDT 4,00,000',
        rate: '15%',
        amount: slab3Val,
        tax: slab3Val * 0.15
      });
      balance = Math.max(0, balance - slab3Val);
    }

    // Slab 4: Next BDT 5,00,000 @ 20%
    if (balance > 0) {
      const slab4Val = Math.min(balance, 500000);
      slabs.push({
        label: 'Next BDT 5,00,000',
        rate: '20%',
        amount: slab4Val,
        tax: slab4Val * 0.20
      });
      balance = Math.max(0, balance - slab4Val);
    }

    // Slab 5: Next BDT 10,00,000 @ 25%
    if (balance > 0) {
      const slab5Val = Math.min(balance, 1000000);
      slabs.push({
        label: 'Next BDT 10,00,000',
        rate: '25%',
        amount: slab5Val,
        tax: slab5Val * 0.25
      });
      balance = Math.max(0, balance - slab5Val);
    }

    // Slab 6: Balance @ 30%
    if (balance > 0) {
      slabs.push({
        label: 'Remaining Balance',
        rate: '30%',
        amount: balance,
        tax: balance * 0.30
      });
      balance = 0;
    }

    const totalTax = slabs.reduce((acc, curr) => acc + curr.tax, 0);
    const effectiveRate = totalTaxableAmount > 0 ? ((totalTax / totalTaxableAmount) * 100).toFixed(2) : '0.00';
    return { 
      threshold, 
      slabs, 
      totalTax, 
      effectiveRate, 
      yearLabel: 'AY 2026–2027 (Finance Act 2026)',
      baseThreshold: base,
      topRate: '30%'
    };
  }, [category, disabledDependentsCount, totalTaxableAmount]);

  // 2. AY 2025-2026 Scenario Calculation (Previous Year / Finance Act 2024–25)
  const calc2025_26 = useMemo(() => {
    let base = 350000;
    switch (category) {
      case 'female_senior':
        base = 400000;
        break;
      case 'disabled':
        base = 475000;
        break;
      case 'freedom_fighter':
        base = 500000;
        break;
      case 'general':
      default:
        base = 350000;
        break;
    }
    const additionalExemption = Math.max(0, disabledDependentsCount) * 50000;
    const threshold = base + additionalExemption;

    let balance = totalTaxableAmount;
    const slabs = [];

    // Slab 1: Basic threshold @ 0%
    const slab1Val = Math.min(balance, threshold);
    slabs.push({
      label: `First BDT ${threshold.toLocaleString('en-IN')}`,
      rate: '0%',
      amount: slab1Val,
      tax: 0
    });
    balance = Math.max(0, balance - slab1Val);

    // Slab 2: Next BDT 1,00,000 @ 5%
    if (balance > 0) {
      const slab2Val = Math.min(balance, 100000);
      slabs.push({
        label: 'Next BDT 1,00,000',
        rate: '5%',
        amount: slab2Val,
        tax: slab2Val * 0.05
      });
      balance = Math.max(0, balance - slab2Val);
    }

    // Slab 3: Next BDT 3,00,000 @ 10%
    if (balance > 0) {
      const slab3Val = Math.min(balance, 300000);
      slabs.push({
        label: 'Next BDT 3,00,000',
        rate: '10%',
        amount: slab3Val,
        tax: slab3Val * 0.10
      });
      balance = Math.max(0, balance - slab3Val);
    }

    // Slab 4: Next BDT 4,00,000 @ 15%
    if (balance > 0) {
      const slab4Val = Math.min(balance, 400000);
      slabs.push({
        label: 'Next BDT 4,00,000',
        rate: '15%',
        amount: slab4Val,
        tax: slab4Val * 0.15
      });
      balance = Math.max(0, balance - slab4Val);
    }

    // Slab 5: Next BDT 5,00,000 @ 20%
    if (balance > 0) {
      const slab5Val = Math.min(balance, 500000);
      slabs.push({
        label: 'Next BDT 5,00,000',
        rate: '20%',
        amount: slab5Val,
        tax: slab5Val * 0.20
      });
      balance = Math.max(0, balance - slab5Val);
    }

    // Slab 6: Balance @ 25%
    if (balance > 0) {
      slabs.push({
        label: 'Remaining Balance',
        rate: '25%',
        amount: balance,
        tax: balance * 0.25
      });
      balance = 0;
    }

    const totalTax = slabs.reduce((acc, curr) => acc + curr.tax, 0);
    const effectiveRate = totalTaxableAmount > 0 ? ((totalTax / totalTaxableAmount) * 100).toFixed(2) : '0.00';
    return { 
      threshold, 
      slabs, 
      totalTax, 
      effectiveRate, 
      yearLabel: 'AY 2025–2026 (Previous Year)',
      baseThreshold: base,
      topRate: '25%'
    };
  }, [category, disabledDependentsCount, totalTaxableAmount]);

  // Scenario Delta (AY 2026-27 vs AY 2025-26)
  const scenarioDelta = useMemo(() => {
    const diff = calc2026_27.totalTax - calc2025_26.totalTax;
    const thresholdDiff = calc2026_27.threshold - calc2025_26.threshold; // typically +50,000
    const percentDiff = calc2025_26.totalTax > 0 
      ? ((Math.abs(diff) / calc2025_26.totalTax) * 100).toFixed(1)
      : '0.0';

    return {
      diff,
      absDiff: Math.abs(diff),
      thresholdDiff,
      percentDiff,
      isSavings: diff < 0,
      isIncrease: diff > 0,
      isEqual: diff === 0
    };
  }, [calc2026_27, calc2025_26]);

  // Active calculation based on selected scenario
  const activeCalc = selectedTaxYear === '2026-27' ? calc2026_27 : calc2025_26;
  const basicThreshold = activeCalc.threshold;
  const slabBreakdown = { slabs: activeCalc.slabs, totalTax: activeCalc.totalTax };
  const effectiveTaxRate = activeCalc.effectiveRate;

  const handleReset = () => {
    setTotalAgriReceipts(1500000);
    setMaintainFormalRecords(false);
    setActualExpensesInput(650000);
    setIsFarmerByOccupation(true);
    setNoOtherSignificantIncome(true);
    setCategory('general');
    setDisabledDependentsCount(0);
    setIsTeaRubberProduce(false);
    setSelectedTaxYear('2026-27');
    setIsComparisonMode(false);
  };

  const handleShareResult = async () => {
    let text = '';
    if (isComparisonMode) {
      text = `
=== Agricultural Income Tax Assessment (AY 2025–26 vs. AY 2026–27 Comparison) ===
Total Agricultural Receipts: BDT ${totalAgriReceipts.toLocaleString('en-IN')}
Allowable Expenses: BDT ${calculatedExpenses.toLocaleString('en-IN')} (${!maintainFormalRecords ? 'Section 43 (60% Deemed Rate)' : 'Section 42 (Actual Expenses)'})
Net Agricultural Income: BDT ${netAgriIncome.toLocaleString('en-IN')}
Clause 20 Exemption (BDT 2 Lakh): ${clause20ExemptionAmount > 0 ? `BDT ${clause20ExemptionAmount.toLocaleString('en-IN')} Deducted` : 'Not Applicable (Conditions Not Met)'}
Total Taxable Amount: BDT ${totalTaxableAmount.toLocaleString('en-IN')}
Taxpayer Category: ${category}
Disabled Dependents Allowance: ${disabledDependentsCount > 0 ? `${disabledDependentsCount} dependent(s) (+BDT ${(disabledDependentsCount * 50000).toLocaleString('en-IN')})` : 'None'}
--------------------------------------------------
Multi-Year Scenario Comparison:
• AY 2026–2027 (Finance Act 2026):
  - Basic Tax-Free Threshold: BDT ${calc2026_27.threshold.toLocaleString('en-IN')}
  - Final Tax Payable: BDT ${calc2026_27.totalTax.toLocaleString('en-IN')}
  - Effective Tax Rate: ${calc2026_27.effectiveRate}%
  - Slabs: 10% starting rate, 30% top bracket

• AY 2025–2026 (Previous Year):
  - Basic Tax-Free Threshold: BDT ${calc2025_26.threshold.toLocaleString('en-IN')}
  - Final Tax Payable: BDT ${calc2025_26.totalTax.toLocaleString('en-IN')}
  - Effective Tax Rate: ${calc2025_26.effectiveRate}%
  - Slabs: 5% starting rate, 25% top bracket

--------------------------------------------------
Tax Liability Variance:
${scenarioDelta.isSavings 
  ? `✓ Tax Savings in AY 2026–27: BDT ${scenarioDelta.absDiff.toLocaleString('en-IN')} (${scenarioDelta.percentDiff}% reduction) due to +BDT 50,000 higher initial exemption threshold.`
  : scenarioDelta.isIncrease
  ? `⚠ Tax Variance in AY 2026–27: +BDT ${scenarioDelta.absDiff.toLocaleString('en-IN')} (+${scenarioDelta.percentDiff}%) due to replacement of 5% starter slab with 10% rate and introduction of 30% top bracket.`
  : '• Neutral: Identical tax liability (BDT 0) across both assessment years.'}
Statutory Basis: Sections 40–44 & Sixth Schedule Part 1 Clause 20 (Income Tax Act, 2023)
Accounticca × E-Lawyers Bangladesh Agricultural Tax Advisory
`.trim();
    } else {
      text = `
=== Agricultural Income Tax Assessment (${activeCalc.yearLabel}) ===
Total Agricultural Receipts: BDT ${totalAgriReceipts.toLocaleString('en-IN')}
Expense Method: ${!maintainFormalRecords ? 'Section 43 (60% Deemed Rate)' : 'Section 42 (Verified Actual Expenses)'}
Allowable Agricultural Expenses: BDT ${calculatedExpenses.toLocaleString('en-IN')}
Net Agricultural Income: BDT ${netAgriIncome.toLocaleString('en-IN')}
Clause 20 Exemption (BDT 2 Lakh): ${clause20ExemptionAmount > 0 ? `BDT ${clause20ExemptionAmount.toLocaleString('en-IN')} Deducted` : 'Not Applicable (Conditions Not Met)'}
Total Taxable Income: BDT ${totalTaxableAmount.toLocaleString('en-IN')}
Taxpayer Category: ${category} (Threshold: BDT ${basicThreshold.toLocaleString('en-IN')})
Disabled Dependents Allowance: ${disabledDependentsCount > 0 ? `${disabledDependentsCount} dependent(s) (+BDT ${(disabledDependentsCount * 50000).toLocaleString('en-IN')})` : 'None'}
Final Tax Payable: BDT ${slabBreakdown.totalTax.toLocaleString('en-IN')}
Effective Tax Rate: ${effectiveTaxRate}%
Statutory Basis: Sections 40–44, Income Tax Act, 2023 & Sixth Schedule Part 1 Clause 20
Accounticca × E-Lawyers Bangladesh Agricultural Tax Advisory
`.trim();
    }

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback
    }

    if (navigator.share) {
      navigator.share({
        title: `Agricultural Tax Assessment - ${isComparisonMode ? '2025-26 vs 2026-27 Comparison' : activeCalc.yearLabel}`,
        text
      }).catch(() => {});
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const copyResults = handleShareResult;

  const handleSaveToHistory = () => {
    const newItem: SavedAgriCalculation = {
      id: `agri-${Date.now()}`,
      timestamp: Date.now(),
      dateFormatted: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }),
      totalReceipts: totalAgriReceipts,
      maintainFormalRecords,
      actualExpensesInput,
      calculatedExpenses,
      netIncome: netAgriIncome,
      isFarmerByOccupation,
      noOtherSignificantIncome,
      clause20Exemption: clause20ExemptionAmount,
      taxableIncome: totalTaxableAmount,
      category,
      disabledDependentsCount,
      isTeaRubberProduce,
      taxPayable: slabBreakdown.totalTax,
      effectiveRate: effectiveTaxRate,
      taxYear: selectedTaxYear,
      isComparisonMode
    };

    // Filter out duplicates and keep strictly the last 5
    const filtered = history.filter(
      h => !(
        h.totalReceipts === totalAgriReceipts && 
        h.taxPayable === slabBreakdown.totalTax && 
        h.maintainFormalRecords === maintainFormalRecords &&
        h.clause20Exemption === clause20ExemptionAmount &&
        (h.disabledDependentsCount || 0) === disabledDependentsCount &&
        h.taxYear === selectedTaxYear
      )
    );

    const updated = [newItem, ...filtered].slice(0, 5);
    setHistory(updated);
    try {
      localStorage.setItem('agri_tax_calc_history', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }

    setSaveSuccessMessage('Calculation snapshot saved to history!');
    setTimeout(() => setSaveSuccessMessage(null), 2500);
  };

  const handleRestoreCalculation = (item: SavedAgriCalculation) => {
    setTotalAgriReceipts(item.totalReceipts);
    setMaintainFormalRecords(item.maintainFormalRecords);
    if (item.actualExpensesInput) setActualExpensesInput(item.actualExpensesInput);
    setIsFarmerByOccupation(item.isFarmerByOccupation);
    setNoOtherSignificantIncome(item.noOtherSignificantIncome);
    setCategory(item.category);
    setDisabledDependentsCount(item.disabledDependentsCount || 0);
    setIsTeaRubberProduce(item.isTeaRubberProduce || false);
    if (item.taxYear) setSelectedTaxYear(item.taxYear);
    if (item.isComparisonMode !== undefined) setIsComparisonMode(item.isComparisonMode);
    setSaveSuccessMessage(`Restored calculation (${item.dateFormatted})`);
    setTimeout(() => setSaveSuccessMessage(null), 2500);
  };

  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    try {
      localStorage.setItem('agri_tax_calc_history', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('agri_tax_calc_history');
    } catch (e) {
      console.error(e);
    }
    setSaveSuccessMessage('All saved history cleared.');
    setTimeout(() => setSaveSuccessMessage(null), 2500);
  };

  const handleDownloadPDF = () => {
    generateAgriTaxPDF({
      totalReceipts: totalAgriReceipts,
      maintainFormalRecords,
      calculatedExpenses,
      netIncome: netAgriIncome,
      isFarmerByOccupation,
      noOtherSignificantIncome,
      clause20Exemption: clause20ExemptionAmount,
      taxableIncome: totalTaxableAmount,
      category,
      disabledDependentsCount,
      basicThreshold,
      taxPayable: slabBreakdown.totalTax,
      effectiveRate: effectiveTaxRate,
      slabs: slabBreakdown.slabs.map(s => ({
        label: s.label,
        rate: s.rate,
        amount: s.amount,
        tax: s.tax
      })),
      taxYear: selectedTaxYear === '2026-27' ? 'AY 2026–2027 (Finance Act 2026)' : 'AY 2025–2026 (Previous Year)',
      comparison: isComparisonMode ? {
        prevYearTax: calc2025_26.totalTax,
        diff: scenarioDelta.diff,
        prevYearName: 'AY 2025–26'
      } : undefined
    });
  };

  return (
    <div className={`bg-white rounded-3xl border border-emerald-200 shadow-xl overflow-hidden ${className}`}>
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-700/60 rounded-2xl border border-emerald-500/30 backdrop-blur-xs">
              <Wheat className="w-7 h-7 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight">Agricultural Income Tax Calculator</h3>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-200 rounded-full border border-emerald-400/30">
                  AY 2026–2027
                </span>
              </div>
              <p className="text-emerald-200/90 text-sm mt-0.5">
                Income Tax Act, 2023 (Sections 40–44) & Sixth Schedule Part 1 (Clause 20)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-compliance-tips', { detail: { toolId: 'agri-tax-tool' } }))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 transition-colors shadow-2xs cursor-pointer"
              title="Open context-aware compliance advice"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Compliance Tips</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/50 transition-colors shadow-xs"
              title="Download official agricultural tax assessment as PDF"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Download as PDF</span>
            </button>
            <button
              onClick={handleSaveToHistory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-emerald-700/80 hover:bg-emerald-600 border border-emerald-500/40 transition-colors shadow-2xs"
              title="Save current calculation to local storage"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Snapshot ({history.length}/5)</span>
            </button>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-emerald-200 hover:text-white bg-emerald-800/40 hover:bg-emerald-800/80 border border-emerald-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            <button
              onClick={handleShareResult}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 transition-colors shadow-sm"
              title="Share calculation result (copies formatted summary to clipboard)"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-950" /> : <Share2 className="w-3.5 h-3.5 text-emerald-950" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Share Result'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Body */}
      <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Inputs Section (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Input 1: Total Agricultural Receipts */}
          <div className="bg-slate-50/90 p-5 rounded-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="total-agri-receipts-input" className="text-sm font-bold text-slate-800 flex items-center">
                <span>Total Agricultural Receipts</span>
                <TaxFieldTooltip 
                  term="Total Agricultural Receipts" 
                  bengaliTerm="মোট কৃষি প্রাপ্তি বা বাজার মূল্য"
                  statutoryRef="Section 40"
                  definition="The gross fair market value of all produce harvested (field crops, horticulture, livestock, poultry, fish, dairy, fruits, timber) during the income year at prevailing market rates, rather than net bank receipts."
                />
                <span className="text-xs font-normal text-slate-500 ml-1.5">(BDT)</span>
              </label>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                Gross Produce Value
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-2.5">
              Market value of all harvested crops, fruits, dairy, fish, livestock, or agro-produce.
            </p>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                ৳
              </span>
              <input
                id="total-agri-receipts-input"
                type="number"
                min="0"
                step="10000"
                value={totalAgriReceipts || ''}
                onChange={(e) => setTotalAgriReceipts(Math.max(0, Number(e.target.value)))}
                className="w-full pl-9 pr-4 py-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-2xs"
                placeholder="e.g. 1500000"
              />
            </div>

            {/* Quick value chips */}
            <div className="flex flex-wrap gap-2 mt-3">
              {[500000, 1000000, 1500000, 2500000, 5000000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setTotalAgriReceipts(val)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-colors ${
                    totalAgriReceipts === val 
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' 
                      : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  ৳{(val / 100000).toFixed(val % 100000 === 0 ? 0 : 1)} Lakh
                </button>
              ))}
            </div>

            {/* Tea & Rubber Split option */}
            <div className="mt-3.5 pt-3 border-t border-slate-200 flex items-start gap-2.5">
              <input
                id="tea-rubber-toggle"
                type="checkbox"
                checked={isTeaRubberProduce}
                onChange={(e) => setIsTeaRubberProduce(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="tea-rubber-toggle" className="text-xs text-slate-700 leading-relaxed cursor-pointer flex items-center flex-wrap">
                <span className="font-semibold text-slate-900">Tea / Rubber Estate Produce (Section 40(2)):</span>
                <TaxFieldTooltip 
                  term="Tea & Rubber Statutory Allocation" 
                  bengaliTerm="চা ও রাবার বিক্রয় আয়ের ৬০/৪০ বিভাজন"
                  statutoryRef="Section 40(2)"
                  definition="Under Section 40(2), 60% of proceeds from tea and rubber produced and processed by the taxpayer is assessed under Agricultural Income, while 40% is assessed under Business Income."
                />
                <span className="ml-1">
                  Automatically allocate <span className="font-bold text-emerald-700">60% to Agriculture</span> and <span className="font-bold text-amber-700">40% to Business Income</span>.
                </span>
              </label>
            </div>
          </div>

          {/* Input 2: Toggle for 'Maintain Formal Records' */}
          <div className="bg-slate-50/90 p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-sm font-bold text-slate-800 flex items-center">
                  <span>Maintain Formal Records</span>
                  <TaxFieldTooltip 
                    term="Formal Records Criteria" 
                    bengaliTerm="যথাযথ হিসাব ও প্রমাণাদি সংরক্ষণের মানদণ্ড"
                    statutoryRef="Section 42 & 43"
                    definition="Requires maintaining an authentic cash book/ledger, third-party purchase vouchers for seeds, fertilizer, pesticides, and fuel, bank transaction records, labor payment muster rolls, and verifiable sales memos. Without verifiable records, Section 43 deems expenditure at 60%."
                  />
                  <span className="text-xs font-normal text-slate-500 ml-1.5">(বই বা হিসাব সংরক্ষণ)</span>
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  Do you keep formal books of accounts and verifiable vouchers?
                </p>
              </div>

              {/* The Toggle Switch */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setMaintainFormalRecords(false)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    !maintainFormalRecords
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  False (No)
                </button>
                <button
                  type="button"
                  onClick={() => setMaintainFormalRecords(true)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    maintainFormalRecords
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  True (Yes)
                </button>
              </div>
            </div>

            {/* If Maintain Formal Records is FALSE -> 60% Deemed Expense Rate applies */}
            {!maintainFormalRecords ? (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold flex items-center">
                      <span>60% Deemed Expense Rate Applied (Section 43)</span>
                      <TaxFieldTooltip 
                        term="60% Deemed Expense Rate" 
                        bengaliTerm="৬০% অনুমিত উৎপাদন ব্যয় বিধি"
                        statutoryRef="Section 43"
                        definition="Where a cultivator does not maintain regular or verifiable books, the law deems 60% of the produce market value as allowable expenditure (leaving 40% as net taxable income). Landowners receiving produce on adhi/barga/crop-sharing cannot use this 60% rule."
                      />
                    </span>
                  </div>
                  <span className="text-xs font-black text-emerald-800">
                    ৳{calculatedExpenses.toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-xs text-emerald-800/90 leading-relaxed">
                  Under Section 43, where proper accounts/records are not maintained, exactly{' '}
                  <strong>60% of the market value of agricultural produce</strong> is deemed as allowable expenditure.
                  (Remaining 40% constitutes net agricultural income).
                </p>
                <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-2">
                  <strong>Statutory Caveat:</strong> The 60% deemed expense rule does not apply to absentee landlords deriving income under <em>adhi, barga, or crop-sharing</em>.
                </div>
              </div>
            ) : (
              /* If Maintain Formal Records is TRUE -> Input for Actual Expenses */
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <label htmlFor="actual-expenses-input" className="text-xs font-bold text-slate-800 flex items-center">
                    <FileText className="w-3.5 h-3.5 text-emerald-600 mr-1.5" />
                    <span>Actual Agricultural Expenses (Section 42)</span>
                    <TaxFieldTooltip 
                      term="Actual Allowable Expenses" 
                      bengaliTerm="প্রকৃত অনুমোদিত কৃষি খরচ"
                      statutoryRef="Section 42"
                      definition="Documented expenses incurred wholly and exclusively for agriculture: land development tax (Khajna), seeds, irrigation fuel/electricity, labor wages, agricultural loan interest, machinery repairs, crop insurance, and Third Schedule tax depreciation on tractors."
                    />
                    <span className="text-[11px] font-normal text-slate-500 ml-1.5">(BDT)</span>
                  </label>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Supported by Vouchers
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">৳</span>
                  <input
                    id="actual-expenses-input"
                    type="number"
                    min="0"
                    step="5000"
                    value={actualExpensesInput || ''}
                    onChange={(e) => setActualExpensesInput(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter total verified expenses"
                  />
                </div>

                {/* Option to toggle itemized expenses */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowItemizedActuals(!showItemizedActuals)}
                    className="flex items-center justify-between w-full text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    <span>{showItemizedActuals ? 'Hide Itemized Expense Breakdown' : 'Fill Itemized Expenses (Seeds, Labor, Irrigation, Khajna)'}</span>
                    {showItemizedActuals ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showItemizedActuals && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] font-medium text-slate-600 block">Land Tax (Khajna) & Rent</label>
                        <input
                          type="number"
                          value={itemizedExpenses.landTaxKhajna}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setItemizedExpenses(prev => ({ ...prev, landTaxKhajna: val }));
                          }}
                          className="w-full px-2 py-1 text-xs border rounded bg-white mt-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-slate-600 block">Seeds, Fertilizers, Pesticides</label>
                        <input
                          type="number"
                          value={itemizedExpenses.seedsFertilizers}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setItemizedExpenses(prev => ({ ...prev, seedsFertilizers: val }));
                          }}
                          className="w-full px-2 py-1 text-xs border rounded bg-white mt-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-slate-600 block">Irrigation Fuel & Electricity</label>
                        <input
                          type="number"
                          value={itemizedExpenses.irrigationFuel}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setItemizedExpenses(prev => ({ ...prev, irrigationFuel: val }));
                          }}
                          className="w-full px-2 py-1 text-xs border rounded bg-white mt-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-slate-600 block">Labor & Harvesting Wages</label>
                        <input
                          type="number"
                          value={itemizedExpenses.laborHarvesting}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setItemizedExpenses(prev => ({ ...prev, laborHarvesting: val }));
                          }}
                          className="w-full px-2 py-1 text-xs border rounded bg-white mt-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-slate-600 block">Agri Loan Interest (Krishi Bank)</label>
                        <input
                          type="number"
                          value={itemizedExpenses.loanInterest}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setItemizedExpenses(prev => ({ ...prev, loanInterest: val }));
                          }}
                          className="w-full px-2 py-1 text-xs border rounded bg-white mt-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-slate-600 block">Machinery Repairs & Depreciation</label>
                        <input
                          type="number"
                          value={itemizedExpenses.tractorDepreciation}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setItemizedExpenses(prev => ({ ...prev, tractorDepreciation: val }));
                          }}
                          className="w-full px-2 py-1 text-xs border rounded bg-white mt-0.5"
                        />
                      </div>
                      <div className="sm:col-span-2 pt-2 border-t flex justify-between items-center text-xs">
                        <span className="text-slate-600 font-medium">Sum of itemized: <strong>৳{sumOfItemized.toLocaleString('en-IN')}</strong></span>
                        <button
                          type="button"
                          onClick={() => setActualExpensesInput(sumOfItemized)}
                          className="text-emerald-700 underline font-semibold"
                        >
                          Use as Total Actual Expenses &uarr;
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Input 3: Toggles for BDT 2 Lakh Exemption */}
          <div className="bg-slate-50/90 p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <label className="text-sm font-bold text-slate-800 flex items-center">
                  <span>Special Agricultural Exemption (Clause 20)</span>
                  <TaxFieldTooltip 
                    term="Clause 20 Exemption (BDT 2 Lakh)" 
                    bengaliTerm="দফা ২০ এর অধীনে ২ লক্ষ টাকা পর্যন্ত কর অব্যাহতি"
                    statutoryRef="Sixth Sched. Part 1 Cl. 20"
                    definition="A maximum exclusion of up to BDT 2,00,000 from net agricultural income for genuine farmers with no outside income (except bank interest ≤ BDT 20,000). The old BDT 5 Lakh exemption proposal is obsolete."
                  />
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sixth Schedule, Part 1, Clause 20 permits up to BDT 2,00,000 exemption if both statutory conditions are satisfied.
                </p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                isClause20Eligible 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {isClause20Eligible ? '৳2,00,000 Exempt' : 'No Exemption'}
              </span>
            </div>

            <div className="space-y-3">
              {/* Condition 1: Toggle for 'Farmer by Occupation' */}
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-900 flex items-center">
                    <span>Condition 1: Farmer by Occupation (পেশায় কৃষক)</span>
                    <TaxFieldTooltip 
                      term="Farmer by Occupation Criteria" 
                      bengaliTerm="পেশায় কৃষক হওয়ার শর্ত"
                      statutoryRef="Sixth Sched. Cl. 20"
                      definition="Sixth Schedule Part 1 Clause 20 requires the assessee to be an individual who personally engages in farming as their primary occupation and livelihood. It does not apply to corporate bodies, passive investors, or non-farmers holding agricultural land."
                    />
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Is agriculture/cultivation the individual's primary occupation?
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsFarmerByOccupation(true)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                      isFarmerByOccupation
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFarmerByOccupation(false)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                      !isFarmerByOccupation
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {/* Condition 2: Toggle for 'No Other Significant Income' */}
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-900 flex items-center">
                    <span>Condition 2: No Other Significant Income</span>
                    <TaxFieldTooltip 
                      term="Zero Outside Income Test" 
                      bengaliTerm="অন্যান্য আয়ের কঠোর সীমাবদ্ধতা"
                      statutoryRef="Sixth Sched. Cl. 20"
                      definition="The taxpayer must have no other taxable income during the fiscal year except land cultivation income and bank interest/profit not exceeding BDT 20,000. Receiving salary, business profit, or house rent revokes eligibility for this BDT 2 Lakh exemption."
                    />
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Has no other income except land cultivation & bank profit ≤ ৳20,000.
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setNoOtherSignificantIncome(true)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                      noOtherSignificantIncome
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Yes (No other)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoOtherSignificantIncome(false)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                      !noOtherSignificantIncome
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    No (Has salary/rent)
                  </button>
                </div>
              </div>
            </div>

            {/* Exemption Status Message */}
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
              isClause20Eligible
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-slate-100 border-slate-300 text-slate-700'
            }`}>
              {isClause20Eligible ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Clause 20 Exemption Granted:</strong> An exclusion of{' '}
                    <strong>৳{clause20ExemptionAmount.toLocaleString('en-IN')}</strong> will be subtracted from Net Income.
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <strong>Exemption Not Applicable:</strong> Clause 20 requires both full-time farmer status and zero outside income (except bank interest ≤ ৳20k). Net agricultural income is fully taxable.
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Input 4: Taxpayer Category for Slabs */}
          <div className="bg-slate-50/90 p-5 rounded-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-2.5">
              <label className="text-sm font-bold text-slate-800 flex items-center">
                <span>Taxpayer Slab Category (AY 2026–2027)</span>
                <TaxFieldTooltip 
                  term="Tax-Free Slabs (2026–2027)" 
                  bengaliTerm="করমুক্ত আয়ের সাধারণ ও বিশেষ সীমা"
                  statutoryRef="Finance Act 2026"
                  definition="Basic tax-free threshold: BDT 4,00,000 for general individuals, BDT 4,50,000 for women & senior citizens (65+), BDT 5,25,000 for disabled, and BDT 5,50,000 for war-wounded freedom fighters."
                />
              </label>
              <span className="text-xs font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                Threshold: ৳{basicThreshold.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'general', title: 'General', limit: '৳4.00 Lakh' },
                { id: 'female_senior', title: 'Women / 65+', limit: '৳4.50 Lakh' },
                { id: 'disabled', title: 'Disabled', limit: '৳5.25 Lakh' },
                { id: 'freedom_fighter', title: 'Freedom Fighter', limit: '৳5.50 Lakh' },
              ].map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id as TaxpayerCategory)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    category === c.id
                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs">{c.title}</div>
                  <div className={`text-[10px] mt-0.5 ${category === c.id ? 'text-emerald-100' : 'text-slate-500'}`}>
                    {c.limit}
                  </div>
                </button>
              ))}
            </div>

            {/* Special Exemption: Parents/Guardians of Disabled Persons */}
            <div className="mt-4 pt-3.5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="text-xs font-bold text-slate-800 flex items-center">
                  <span>Parent/Guardian of Disabled Child</span>
                  <TaxFieldTooltip 
                    term="Disabled Child/Dependent Allowance"
                    bengaliTerm="প্রতিবন্ধী সন্তানের পিতা/মাতা/অভিভাবকের কর সুবিধা"
                    statutoryRef="Finance Act 2026"
                    definition="Parents or legal guardians of certified disabled children/dependents receive an additional BDT 50,000 initial tax-free threshold per eligible dependent under Bangladesh Finance Act 2026."
                  />
                </label>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  +৳50,000 threshold for each disabled child or dependent
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => setDisabledDependentsCount(Math.max(0, disabledDependentsCount - 1))}
                  disabled={disabledDependentsCount === 0}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-slate-300 text-slate-700 font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
                  aria-label="Decrease disabled dependents"
                >
                  -
                </button>
                <span className="w-8 text-center font-bold text-sm text-slate-900">
                  {disabledDependentsCount}
                </span>
                <button
                  type="button"
                  onClick={() => setDisabledDependentsCount(disabledDependentsCount + 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 shadow-2xs"
                  aria-label="Increase disabled dependents"
                >
                  +
                </button>
                {disabledDependentsCount > 0 && (
                  <span className="ml-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                    +৳{(disabledDependentsCount * 50000).toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Output & Tax Computation Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 shadow-xl border border-slate-700/60 sticky top-24">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/80">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-base text-white tracking-wide">Agricultural Tax Result</h4>
              </div>
              <span className="text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30">
                AY 2026-27
              </span>
            </div>

            {/* Arithmetic Steps */}
            <div className="mt-5 space-y-3.5 text-sm">
              
              <div className="flex justify-between items-center text-slate-300">
                <span>Total Agricultural Receipts:</span>
                <span className="font-bold text-white">৳{totalAgriReceipts.toLocaleString('en-IN')}</span>
              </div>

              {isTeaRubberProduce && (
                <div className="p-2.5 bg-emerald-950/60 rounded-xl border border-emerald-800/40 text-xs space-y-1">
                  <div className="flex justify-between text-emerald-300">
                    <span>Agri Portion (60% Sec 40(2)):</span>
                    <span className="font-bold">৳{effectiveAgriProduceValue.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-amber-300">
                    <span>Business Portion (40%):</span>
                    <span className="font-bold">৳{businessPortionProduce.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center text-rose-300">
                <span>Less: Expenses ({!maintainFormalRecords ? '60% Deemed' : 'Actual'}):</span>
                <span className="font-semibold">-৳{calculatedExpenses.toLocaleString('en-IN')}</span>
              </div>

              {/* Net Agricultural Income */}
              <div className="pt-2 border-t border-slate-700 flex justify-between items-center">
                <span className="font-medium text-slate-200">Net Agricultural Income:</span>
                <span className="font-bold text-emerald-300 text-base">৳{netAgriIncome.toLocaleString('en-IN')}</span>
              </div>

              {/* BDT 2 Lakh Exemption */}
              {clause20ExemptionAmount > 0 && (
                <div className="flex justify-between items-center text-emerald-400">
                  <span>Less: Clause 20 Exemption:</span>
                  <span className="font-semibold">-৳{clause20ExemptionAmount.toLocaleString('en-IN')}</span>
                </div>
              )}

              {/* Total Taxable Income Highlight */}
              <div className="mt-4 p-4 bg-emerald-900/40 rounded-2xl border border-emerald-500/30 text-center">
                <div className="text-xs font-medium text-emerald-300">Total Taxable Amount</div>
                <div className="text-2xl font-black text-white mt-1">
                  ৳{totalTaxableAmount.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-emerald-200/80 mt-1">
                  Tax-free threshold: ৳{basicThreshold.toLocaleString('en-IN')}
                </div>
              </div>

              {/* Progressive Slabs Breakdown */}
              <div className="mt-5 pt-4 border-t border-slate-700/80">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    2026–2027 Slab Breakdown
                  </span>
                  <span className="text-xs text-slate-400">Tax</span>
                </div>

                <div className="space-y-1.5">
                  {slabBreakdown.slabs.map((s, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center text-xs py-1 px-2 rounded-lg bg-slate-800/60 border border-slate-700/40"
                    >
                      <span className="text-slate-300">
                        {s.label} ({s.rate}):
                      </span>
                      <div className="text-right">
                        <span className="text-slate-400 mr-2">৳{s.amount.toLocaleString('en-IN')}</span>
                        <span className="font-bold text-white">৳{s.tax.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final Tax Liability Box */}
              <div className="mt-5 p-5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl text-white shadow-lg text-center">
                <div className="text-xs uppercase tracking-wider font-semibold text-emerald-100">
                  Final Tax Payable
                </div>
                <div className="text-3xl font-black mt-1">
                  ৳{slabBreakdown.totalTax.toLocaleString('en-IN')}
                </div>
                <div className="mt-1 flex items-center justify-center gap-3 text-xs text-emerald-100">
                  <span>Effective Rate: <strong>{effectiveTaxRate}%</strong></span>
                  <span>•</span>
                  <span>Status: <strong>{slabBreakdown.totalTax > 0 ? 'Tax Payable' : 'Zero Tax'}</strong></span>
                </div>
              </div>

              {/* Action Buttons: Download PDF and Share Result */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="py-2.5 px-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98]"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handleShareResult}
                  className="py-2.5 px-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-emerald-300 transition-all active:scale-[0.98]"
                  title="Copy calculation summary to clipboard"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Share2 className="w-4 h-4 text-emerald-700" />}
                  <span>{copied ? 'Copied!' : 'Share Result'}</span>
                </button>
              </div>
            </div>

            {/* Statutory Reference Footer */}
            <div className="mt-4 pt-3 border-t border-slate-700/60 text-[11px] text-slate-400 flex items-start gap-1.5 leading-relaxed">
              <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Calculated strictly under Sections 40–44 and Sixth Schedule Part 1 Clause 20 of the Income Tax Act, 2023.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Local Storage-Based Calculation History Section (Saves last 5 calculations) */}
      <div className="border-t border-slate-200 bg-slate-50/80 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-base text-slate-900">Calculation History</h4>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {history.length}/5 Saved
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Saved in your browser local storage. Click "Restore" to reload past values into the calculator.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveToHistory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 transition-colors shadow-2xs"
            >
              <Save className="w-3.5 h-3.5" />
              Save Current
            </button>
            {history.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Feedback message banner */}
        {saveSuccessMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{saveSuccessMessage}</span>
          </div>
        )}

        {/* History Cards Grid or Empty State */}
        {history.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
            <Clock className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-sm font-bold text-slate-700">No saved calculation history yet</div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Click &quot;Save Current&quot; or &quot;Save Snapshot&quot; to preserve up to 5 calculation scenarios in your browser.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {history.map((item, index) => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{item.dateFormatted}</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      #{index + 1}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Gross Receipts:</span>
                      <span className="font-bold text-slate-900">৳{item.totalReceipts.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Expense Method:</span>
                      <span className="font-semibold text-emerald-700">
                        {item.maintainFormalRecords ? 'Sec 42 Actual' : 'Sec 43 (60% Deemed)'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Net Agri Income:</span>
                      <span className="font-medium text-slate-800">৳{item.netIncome.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Clause 20 Exemption:</span>
                      <span className={`font-semibold ${item.clause20Exemption > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {item.clause20Exemption > 0 ? '৳2,00,000' : 'None'}
                      </span>
                    </div>

                    {(item.disabledDependentsCount || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Disabled Dep.:</span>
                        <span className="font-semibold text-blue-700">
                          {item.disabledDependentsCount} (+৳{(item.disabledDependentsCount! * 50000).toLocaleString('en-IN')})
                        </span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                      <span className="text-slate-600 font-medium">Final Tax:</span>
                      <span className="text-sm font-black text-emerald-700">
                        ৳{item.taxPayable.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleRestoreCalculation(item)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restore</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Delete this calculation snapshot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Named alias export to support both import conventions
export const AgriculturalIncomeTaxCalculator = AgriculturalTaxCalculator;
export default AgriculturalTaxCalculator;
