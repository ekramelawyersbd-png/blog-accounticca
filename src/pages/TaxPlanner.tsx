import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Calculator, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  DollarSign, 
  Bookmark, 
  RotateCcw, 
  Calendar, 
  ExternalLink,
  Share2,
  Sparkles,
  Check,
  X,
  Coins,
  CalendarCheck
} from 'lucide-react';
import { TaxScenarioManager } from '../components/tax/TaxScenarioManager';
import { TaxScenarioBarComparison } from '../components/tax/TaxScenarioBarComparison';
import { TaxDeadlineNotification } from '../components/tax/TaxDeadlineNotification';
import { ShareTaxScenarioModal } from '../components/tax/ShareTaxScenarioModal';
import { WealthSurchargeVisualizer } from '../components/tax/WealthSurchargeVisualizer';
import { EarlyFilingIncentive } from '../components/tax/EarlyFilingIncentive';
import { TaxCategory, TaxLocation, TaxScenario, TaxScenarioInputs } from '../types/taxScenario';
import { buildAppointmentUrl } from '../utils/appointmentRedirect';
import { parseTaxScenarioFromUrl } from '../utils/taxShareUtils';
import { ToolSEO } from '../components/SEO';
import { CalculationEmailActionBarButton } from '../components/tools/CalculationEmailActionBarButton';

type Category = TaxCategory;
type Location = TaxLocation;

const STORAGE_KEY = 'bd_tax_planner_scenarios_v1';

export function TaxPlanner() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [income, setIncome] = useState<string>('');
  const [investment, setInvestment] = useState<string>('');
  const [tds, setTds] = useState<string>('');
  const [category, setCategory] = useState<Category>('general');
  const [disabledDependents, setDisabledDependents] = useState<number>(0);
  const [location, setLocation] = useState<Location>('dhaka_ctg');
  const [isFirstTimeFiler, setIsFirstTimeFiler] = useState<boolean>(false);

  // Sharing & Deep Linking state
  const [activeScenarioName, setActiveScenarioName] = useState<string>('Custom Tax Plan');
  const [isSharedFromUrl, setIsSharedFromUrl] = useState<boolean>(false);
  const [sharedBannerDismissed, setSharedBannerDismissed] = useState<boolean>(false);
  const [savedToLocalSuccess, setSavedToLocalSuccess] = useState<boolean>(false);
  
  // Share modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareModalTarget, setShareModalTarget] = useState<{
    name?: string;
    notes?: string;
    inputs: TaxScenarioInputs;
  } | null>(null);

  // Hydrate from deep link if present in URL search parameters
  useEffect(() => {
    const parsed = parseTaxScenarioFromUrl(searchParams);
    if (parsed) {
      setIncome(parsed.inputs.income);
      setInvestment(parsed.inputs.investment);
      setTds(parsed.inputs.tds);
      setCategory(parsed.inputs.category);
      setDisabledDependents(parsed.inputs.disabledDependents);
      setLocation(parsed.inputs.location);
      setIsFirstTimeFiler(parsed.inputs.isFirstTimeFiler);
      
      const scenarioTitle = parsed.name || 'Shared Tax Scenario';
      setActiveScenarioName(scenarioTitle);
      setIsSharedFromUrl(true);
      setSharedBannerDismissed(false);
    }
  }, [searchParams]);

  const handleLoadScenario = (sc: TaxScenario) => {
    setIncome(sc.inputs.income);
    setInvestment(sc.inputs.investment);
    setTds(sc.inputs.tds);
    setCategory(sc.inputs.category);
    setDisabledDependents(sc.inputs.disabledDependents);
    setLocation(sc.inputs.location);
    setIsFirstTimeFiler(sc.inputs.isFirstTimeFiler);
    setActiveScenarioName(sc.name);
    setIsSharedFromUrl(false);
  };

  const handleResetInputs = () => {
    setIncome('');
    setInvestment('');
    setTds('');
    setCategory('general');
    setDisabledDependents(0);
    setLocation('dhaka_ctg');
    setIsFirstTimeFiler(false);
    setActiveScenarioName('Custom Tax Plan');
    setIsSharedFromUrl(false);
    setSearchParams({}, { replace: true });
  };

  const handleSaveSharedToLocal = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let list: TaxScenario[] = [];
      if (stored) {
        list = JSON.parse(stored);
      }
      const newScenario: TaxScenario = {
        id: 'sc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        name: activeScenarioName || 'Shared Tax Plan',
        createdAt: new Date().toISOString(),
        notes: 'Imported from shared deep link.',
        inputs: { ...currentInputs },
        results: { ...results }
      };
      const updated = [newScenario, ...list];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('taxScenariosUpdated'));
      setSavedToLocalSuccess(true);
      setTimeout(() => setSavedToLocalSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to save scenario to localStorage', e);
    }
  };

  // Compute logic
  const results = useMemo(() => {
    const numIncome = Math.max(0, parseInt(income || '0', 10));
    const numInvestment = Math.max(0, parseInt(investment || '0', 10));
    const numTds = Math.max(0, parseInt(tds || '0', 10));

    // 1. Determine base tax-free limit
    let baseLimit = 400000;
    if (category === 'female_senior') baseLimit = 450000;
    else if (category === 'disabled') baseLimit = 525000;
    else if (category === 'freedom_fighter') baseLimit = 550000;

    // Add dependent limit
    const totalLimit = baseLimit + (disabledDependents * 50000);

    // 2. Calculate progressive tax
    let taxableIncome = Math.max(0, numIncome - totalLimit);
    let grossTax = 0;
    
    let remaining = taxableIncome;

    const slabs = [
      { limit: 300000, rate: 0.10 },
      { limit: 400000, rate: 0.15 },
      { limit: 500000, rate: 0.20 },
      { limit: 2000000, rate: 0.25 }
    ];

    for (const slab of slabs) {
      if (remaining > 0) {
        const taxableAtSlab = Math.min(remaining, slab.limit);
        grossTax += taxableAtSlab * slab.rate;
        remaining -= taxableAtSlab;
      } else {
        break;
      }
    }

    if (remaining > 0) {
      grossTax += remaining * 0.30; // 30% on the rest
    }

    // 3. Investment Rebate (Simplified 15% on actual eligible investment)
    const rebate = numInvestment * 0.15;
    const netTaxBeforeMin = Math.max(0, grossTax - rebate);

    // 4. Minimum Tax Rule
    let minimumTax = 0;
    if (numIncome > totalLimit) {
      if (isFirstTimeFiler) {
        minimumTax = 1000;
      } else {
        if (location === 'dhaka_ctg') minimumTax = 5000;
        else if (location === 'other_cc') minimumTax = 4000;
        else minimumTax = 3000;
      }
    }

    // 5. Final Liability
    const finalLiability = numIncome > totalLimit ? Math.max(netTaxBeforeMin, minimumTax) : 0;
    
    // 6. Net Payable
    const netPayable = finalLiability - numTds;
    
    return {
      totalLimit,
      taxableIncome,
      grossTax,
      rebate,
      netTaxBeforeMin,
      minimumTax,
      finalLiability,
      netPayable
    };

  }, [income, investment, tds, category, disabledDependents, location, isFirstTimeFiler]);

  const currentInputs: TaxScenarioInputs = useMemo(() => ({
    income,
    investment,
    tds,
    category,
    disabledDependents,
    location,
    isFirstTimeFiler
  }), [income, investment, tds, category, disabledDependents, location, isFirstTimeFiler]);

  const calculationSnapshot = useMemo(() => ({
    referenceId: `PLAN-${Date.now().toString().slice(-6)}`,
    generatedAt: new Date().toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' }),
    toolId: 'tax-planner',
    toolName: 'Individual Income Tax Planner & Strategy Engine (AY 2026–27)',
    toolCategory: 'Tax Planning & Simulation',
    toolPath: '/tax-planner',
    statutoryBasis: 'Income Tax Act 2023 · Finance Act 2026',
    summaryMetrics: [
      { label: 'Total Annual Income', value: `৳${(parseInt(income || '0', 10)).toLocaleString()}` },
      { label: 'Taxable Income', value: `৳${results.taxableIncome.toLocaleString()}` },
      { label: 'Investment Rebate', value: `৳${results.rebate.toLocaleString()}` },
      { label: results.netPayable < 0 ? 'Estimated Tax Refund' : 'Net Tax Payable', value: `৳${Math.abs(results.netPayable).toLocaleString()}` },
    ],
    inputs: [
      { label: 'Annual Gross Income', value: `৳${(parseInt(income || '0', 10)).toLocaleString()}` },
      { label: 'Eligible Investment', value: `৳${(parseInt(investment || '0', 10)).toLocaleString()}` },
      { label: 'Advance Tax / TDS', value: `৳${(parseInt(tds || '0', 10)).toLocaleString()}` },
      { label: 'Taxpayer Category', value: category },
      { label: 'Location Jurisdiction', value: location },
      { label: 'First-time Filer', value: isFirstTimeFiler ? 'Yes (Tk. 1,000 min tax)' : 'No' },
    ],
    tables: [
      {
        title: 'Tax Assessment & Liability Breakdown',
        headers: ['Assessment Metric', 'Formula / Rule', 'Amount (BDT)'],
        rows: [
          { cells: ['Total Gross Income', 'Self-Declared Assessment', `৳${(parseInt(income || '0', 10)).toLocaleString()}`] },
          { cells: ['Personal Tax-Free Exemption', 'Statutory Threshold', `৳${results.totalLimit.toLocaleString()}`] },
          { cells: ['Taxable Income', 'Gross - Exemption', `৳${results.taxableIncome.toLocaleString()}`] },
          { cells: ['Gross Income Tax', 'Slab Calculation', `৳${results.grossTax.toLocaleString()}`] },
          { cells: ['Allowable Investment Rebate', '15% eligible rebate', `৳${results.rebate.toLocaleString()}`] },
          { cells: ['Minimum Tax Enforcement', 'Zone Statutory Floor', `৳${results.minimumTax.toLocaleString()}`] },
          { cells: ['Advance Tax / TDS Paid', 'Credit Adjustment', `৳${(parseInt(tds || '0', 10)).toLocaleString()}`] },
          { cells: [results.netPayable < 0 ? 'Refund Due from NBR' : 'Final Net Tax Payable', 'Statutory Balance', `৳${Math.abs(results.netPayable).toLocaleString()}`] },
        ],
      },
    ],
    legalNotes: [
      'Assessment Year 2026–27 pursuant to Income Tax Act 2023.',
      'Schedule 6 Part 3 investment rebate caps and ceilings.',
      'Minimum tax thresholds based on taxpayer residential area.',
    ],
  }), [income, results, investment, tds, category, location, isFirstTimeFiler]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <ToolSEO
        title="Individual Income Tax Planner & Scenario Simulator (2026–2027) | Accounticca"
        description="Estimate your annual individual income tax liability, Section 78 investment tax rebate, TDS credit, and wealth surcharge under Bangladesh Finance Act 2026."
        canonicalUrl="/tax-planner"
        keywords={['Bangladesh Income Tax Planner', 'Individual Tax Calculator 2026', 'Section 78 Rebate', 'Wealth Surcharge']}
      />
      
      <div className="text-center max-w-3xl mx-auto mb-8">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-6">
          Individual Income <span className="text-emerald-600">Tax Planner</span>
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed mb-6">
          Estimate your annual tax liability based on the 2026 guidelines. Input your income, approved investments, and TDS to calculate your net payable tax.
        </p>

        {/* Section Jump Links */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="#income-tax-calculator"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold hover:bg-emerald-100 transition-colors shadow-2xs"
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-600" />
            <span>Income Tax Calculator</span>
          </a>
          <a
            href="#wealth-surcharge-section"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs font-bold hover:bg-slate-200 transition-colors shadow-2xs"
          >
            <Coins className="w-3.5 h-3.5 text-emerald-600" />
            <span>Wealth Surcharge Visualizer (0% – 35%)</span>
          </a>
          <a
            href="#early-filing-incentive"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold hover:bg-amber-100 transition-colors shadow-2xs"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>5% Early Filing Incentive</span>
          </a>
        </div>
      </div>

      {/* Tax Filing Deadline Notification Component */}
      <div className="mb-10">
        <TaxDeadlineNotification
          currentInputs={currentInputs}
          currentResults={results}
          onLoadScenario={handleLoadScenario}
        />
      </div>

      {/* Shared Scenario Incoming Deep Link Alert Banner */}
      {isSharedFromUrl && !sharedBannerDismissed && (
        <div className="mb-8 p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-2xl border border-emerald-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase font-bold tracking-wider text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md">
                  Shared Deep Link Loaded
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  {activeScenarioName}
                </h3>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Inputs loaded with annual income of <span className="font-bold text-slate-800">{parseInt(income || '0', 10).toLocaleString()} BDT</span> and net tax payable of <span className="font-bold text-emerald-700">{results.netPayable.toLocaleString()} BDT</span>.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              id="save-shared-scenario-to-local-btn"
              onClick={handleSaveSharedToLocal}
              disabled={savedToLocalSuccess}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                savedToLocalSuccess
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {savedToLocalSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Saved to Scenarios!
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5" /> Save to My Scenarios
                </>
              )}
            </button>

            <button
              id="dismiss-shared-banner-btn"
              onClick={() => setSharedBannerDismissed(true)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Compact Result Summary Bar (<1024px) */}
      <div className="lg:hidden mb-6 rounded-2xl bg-slate-900 border border-slate-800 p-4 text-white shadow-md flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
            <span>Live Tax Assessment</span>
            <span>&middot;</span>
            <span className="text-slate-300">AY 2026–27 (FA 2026)</span>
          </div>
          <div className="text-2xl font-black font-mono tabular-nums text-white mt-0.5">
            {parseInt(income || '0', 10) > 0
              ? `৳ ${Math.abs(results.netPayable).toLocaleString()} BDT`
              : '৳ —'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {results.netPayable < 0 ? 'Estimated Tax Refund' : 'Net Payable after Rebate & TDS'}
          </div>
        </div>
        <a
          href="#tax-planner-detailed-assessment"
          className="shrink-0 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
        >
          View Breakdown &darr;
        </a>
      </div>

      <div id="income-tax-calculator" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start scroll-mt-6">
        
        {/* Input Workspace - 58.33% (lg:col-span-7) on desktop */}
        <div className="min-w-0 w-full lg:col-span-7 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/60">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-3">
              <Calculator className="w-6 h-6 text-emerald-500" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Tax Inputs</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Assessment Year 2026–27 &middot; Income Tax Act 2023 &amp; Finance Act 2026
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <CalculationEmailActionBarButton
                options={{
                  toolId: 'tax-planner',
                  toolName: 'Individual Income Tax Planner & Strategy Engine',
                  toolCategory: 'Tax Planning & Simulation',
                  toolPath: '/tax-planner',
                  statutoryBasis: 'Income Tax Act 2023 · Finance Act 2026',
                  customSnapshot: calculationSnapshot,
                }}
                label="Send Calculation Report"
                variant="primary"
              />

              <button
                type="button"
                id="share-active-plan-top-btn"
                onClick={() => {
                  setShareModalTarget({
                    name: activeScenarioName,
                    inputs: currentInputs
                  });
                  setIsShareModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-2xs"
                title="Share this tax scenario via deep link or email"
              >
                <Share2 className="w-3.5 h-3.5" /> Share Plan
              </button>

              <button
                type="button"
                id="reset-tax-planner-inputs-btn"
                onClick={handleResetInputs}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                title="Clear all fields"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Financial Inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Total Annual Income (BDT)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="number"
                    min="0"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    placeholder="e.g. 1200000"
                    className="w-full min-w-0 pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Eligible Investments (BDT)</label>
                  <input
                    type="number"
                    min="0"
                    value={investment}
                    onChange={(e) => setInvestment(e.target.value)}
                    placeholder="e.g. 200000"
                    className="w-full min-w-0 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">TDS Already Paid (BDT)</label>
                  <input
                    type="number"
                    min="0"
                    value={tds}
                    onChange={(e) => setTds(e.target.value)}
                    placeholder="e.g. 15000"
                    className="w-full min-w-0 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 font-medium"
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Profile Inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Taxpayer Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full min-w-0 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 font-medium appearance-none"
                >
                  <option value="general">General Individual (Male under 65)</option>
                  <option value="female_senior">Female or Senior Citizen (65+)</option>
                  <option value="disabled">Person with Disability / Third Gender</option>
                  <option value="freedom_fighter">Gazetted War-Wounded Freedom Fighter</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Location Zone</label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value as Location)}
                    className="w-full min-w-0 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 font-medium appearance-none"
                  >
                    <option value="dhaka_ctg">Dhaka / Chattogram City Corp.</option>
                    <option value="other_cc">Other City Corporations</option>
                    <option value="non_cc">Non-City Corporation Area</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Disabled Dependents (Count)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={disabledDependents}
                    onChange={(e) => setDisabledDependents(parseInt(e.target.value) || 0)}
                    className="w-full min-w-0 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 font-medium"
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center mt-1">
                <input
                  type="checkbox"
                  checked={isFirstTimeFiler}
                  onChange={(e) => setIsFirstTimeFiler(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-5 h-5 border-2 border-slate-300 rounded peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-colors"></div>
                <CheckCircle2 className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">I am filing for the very first time</span>
                <p className="text-xs text-slate-500 mt-1">First-time filers enjoy a reduced minimum tax rate cliff of 1,000 BDT.</p>
              </div>
            </label>

          </div>
        </div>

        {/* Assessment Summary - 41.67% (lg:col-span-5) Sticky on Desktop */}
        <div id="tax-planner-detailed-assessment" className="min-w-0 w-full lg:col-span-5 lg:sticky lg:top-20 space-y-6 scroll-mt-24">
          <div className="bg-slate-900 rounded-3xl p-6 md:p-8 shadow-xl text-white">
            <div className="flex items-center justify-between gap-2 mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <FileTextIcon /> Live Assessment
              </h3>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                AY 2026–27
              </span>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center text-slate-300 text-sm">
                <span>Personal Tax-Free Limit</span>
                <span className="font-semibold text-white">{results.totalLimit.toLocaleString()} BDT</span>
              </div>
              <div className="flex justify-between items-center text-slate-300 text-sm">
                <span>Taxable Income</span>
                <span className="font-semibold text-white">{results.taxableIncome.toLocaleString()} BDT</span>
              </div>
              
              <div className="h-px bg-slate-700 my-4" />
              
              <div className="flex justify-between items-center text-slate-300 text-sm">
                <span>Gross Tax (Progressive)</span>
                <span className="font-semibold text-white">{results.grossTax.toLocaleString()} BDT</span>
              </div>
              <div className="flex justify-between items-center text-slate-300 text-sm">
                <span>Investment Rebate (Est.)</span>
                <span className="font-semibold text-emerald-400">- {results.rebate.toLocaleString()} BDT</span>
              </div>
              
              <div className="h-px bg-slate-700 my-4" />

              <div className="flex justify-between items-center text-slate-300 text-sm">
                <span>Calculated Tax</span>
                <span className="font-semibold text-white">{results.netTaxBeforeMin.toLocaleString()} BDT</span>
              </div>
              <div className="flex justify-between items-center text-slate-300 text-sm">
                <span>Mandatory Minimum Tax</span>
                <span className="font-semibold text-amber-400">{results.minimumTax.toLocaleString()} BDT</span>
              </div>
              <div className="flex justify-between items-center text-slate-300 text-sm pt-2">
                <span>Final Tax Liability</span>
                <span className="font-semibold text-white text-lg">{results.finalLiability.toLocaleString()} BDT</span>
              </div>
              <div className="flex justify-between items-center text-slate-300 text-sm">
                <span>Less: TDS Already Paid</span>
                <span className="font-semibold text-emerald-400">- {results.netPayable < 0 ? results.finalLiability.toLocaleString() : (results.finalLiability - results.netPayable).toLocaleString()} BDT</span>
              </div>
            </div>

            <div className="bg-emerald-600 rounded-2xl p-5 text-center mb-4">
              <p className="text-emerald-100 text-sm font-medium mb-1">
                {results.netPayable < 0 ? 'Estimated Refund' : 'Net Tax Payable'}
              </p>
              <p className="text-3xl font-black font-mono tabular-nums text-white">
                ৳ {Math.abs(results.netPayable).toLocaleString()} <span className="text-lg font-semibold">BDT</span>
              </p>
            </div>

            <button
              type="button"
              id="share-active-scenario-results-btn"
              onClick={() => {
                setShareModalTarget({
                  name: activeScenarioName,
                  inputs: currentInputs
                });
                setIsShareModalOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs sm:text-sm font-bold transition-all border border-white/10 shadow-xs cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-emerald-300" />
              <span>Share Scenario Deep Link & Email</span>
            </button>
          </div>

          {/* Lawyer / Tax Practitioner Consultation CTA with Live Training Image */}
          <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
            <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-100">
              <img
                src="https://pub-d893cbb677b6463eb69f13e1dbb40541.r2.dev/545724939_1360666282733871_784797782317144558_n.jpg"
                alt="Practical Income Tax Planning & Assessment Session"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-lg border border-white/20 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Tax Advisory &amp; Workshop</span>
              </div>
            </div>
            <div className="p-5 sm:p-6 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800">
                <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                <h4 className="font-bold text-sm text-slate-900">Need Certified Legal or Tax Review?</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Have our accredited Supreme Court tax advocates and chartered accountants review your deductions, verify minimum tax rules, and file your statutory return.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                <a
                  href={buildAppointmentUrl({
                    service: 'Individual Tax Planning & Assessment',
                    notes: `Taxable Income: ${results.taxableIncome.toLocaleString()} BDT, Estimated Liability: ${results.finalLiability.toLocaleString()} BDT, Region: ${location}`,
                    source: 'Tax Planner Results'
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs group"
                >
                  <span>Book Tax Consultation</span>
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-200 group-hover:translate-x-0.5 transition-transform" />
                </a>
                <Link
                  to="/course/personal-income-tax"
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors text-center shrink-0"
                  title="View live tax return training course"
                >
                  <span>Masterclass</span>
                </Link>
              </div>
            </div>
          </div>

          {results.taxableIncome > 0 && results.finalLiability === results.minimumTax && (
            <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 flex gap-4 items-start">
              <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-amber-900 mb-1">Minimum Tax Cliff Reached</h4>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Your gross tax after rebates ({results.netTaxBeforeMin.toLocaleString()} BDT) is lower than the mandatory minimum tax for your region ({results.minimumTax.toLocaleString()} BDT). You are required to pay the minimum tax.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progressive Wealth Surcharge Visualizer (0% to 35%) */}
      <div id="wealth-surcharge-section" className="my-12 scroll-mt-6">
        <WealthSurchargeVisualizer
          initialPayableTax={results.finalLiability > 0 ? results.finalLiability : 500000}
          showCardWrapper={true}
        />
      </div>

      {/* 5% Early Filing Incentive */}
      <div id="early-filing-incentive" className="my-12 scroll-mt-6">
        <EarlyFilingIncentive
          initialPayableTax={results.finalLiability > 0 ? results.finalLiability : 500000}
        />
      </div>

      {/* Side-by-Side Two-Scenario Comparison via Recharts */}
      <TaxScenarioBarComparison
        activeCalculatorInputs={currentInputs}
        activeCalculatorLabel={activeScenarioName || 'Current Tax Plan'}
      />

      {/* Local Storage Scenario Management & Comparator */}
      <TaxScenarioManager
        currentInputs={currentInputs}
        currentResults={results}
        onLoadScenario={handleLoadScenario}
        onShareScenario={(sc) => {
          setShareModalTarget({
            name: sc.name,
            notes: sc.notes,
            inputs: sc.inputs
          });
          setIsShareModalOpen(true);
        }}
      />

      {/* Share Scenario Modal */}
      {isShareModalOpen && shareModalTarget && (
        <ShareTaxScenarioModal
          isOpen={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false);
            setShareModalTarget(null);
          }}
          scenarioName={shareModalTarget.name}
          notes={shareModalTarget.notes}
          inputs={shareModalTarget.inputs}
          results={results}
        />
      )}
    </div>
  );
}

function FileTextIcon() {
  return (
    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
