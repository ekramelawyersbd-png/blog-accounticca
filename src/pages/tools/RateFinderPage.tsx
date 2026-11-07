import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Calculator, 
  ArrowLeft, 
  FileText, 
  ShieldCheck, 
  Sparkles, 
  Info, 
  CheckCircle2, 
  X, 
  Layers, 
  Building2, 
  Percent, 
  ChevronRight, 
  Coins, 
  Scale, 
  Download, 
  Copy, 
  HelpCircle,
  ExternalLink,
  BookOpen,
  DollarSign,
  ArrowRightLeft,
  ChevronDown,
  Tag,
  Zap,
  SlidersHorizontal
} from 'lucide-react';
import { 
  NATIONAL_RATE_DATABASE, 
  RateItem, 
  VatRateItem, 
  TdsVdsRateItem, 
  CustomsRateItem, 
  RateCategory, 
  searchRateDatabase, 
  calculateCustomsDuties, 
  DutyCalculationInputs 
} from '../../data/nationalRateDatabase';
import { ToolSEO } from '../../components/SEO';

export function RateFinderPage() {
  // Navigation tab states
  const [activeTab, setActiveTab] = useState<RateCategory | 'ALL' | 'CALCULATOR'>('ALL');
  
  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [vdsApplicabilityFilter, setVdsApplicabilityFilter] = useState<'ALL' | 'YES' | 'NO'>('ALL');
  const [rateTypeFilter, setRateTypeFilter] = useState<'ALL' | 'EXEMPT' | 'REDUCED' | 'STANDARD'>('ALL');
  const [sroFilter, setSroFilter] = useState<'ALL' | 'SRO_240' | 'SRO_173' | 'SRO_136'>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedItem, setSelectedItem] = useState<RateItem | null>(null);

  // Predictive search states
  const [showPredictiveMenu, setShowPredictiveMenu] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close predictive menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowPredictiveMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- DUTY CALCULATOR ADVANCED STATES ---
  const [valuationMode, setValuationMode] = useState<'BDT' | 'FOREIGN'>('BDT');
  const [foreignCurrency, setForeignCurrency] = useState<'USD' | 'EUR' | 'GBP' | 'JPY' | 'SGD'>('USD');
  const [foreignAmount, setForeignAmount] = useState<number>(10000);
  const [exchangeRateBDT, setExchangeRateBDT] = useState<number>(122.50);

  const [hsSearchTerm, setHsSearchTerm] = useState<string>('');
  const [customHsCode, setCustomHsCode] = useState<string>('8517.13.00');
  const [customHsTitle, setCustomHsTitle] = useState<string>('Smartphones / Mobile Phones (CBU)');

  const [calculatorInputs, setCalculatorInputs] = useState<DutyCalculationInputs>({
    assessableValueBDT: 1225000,
    customsDutyPercent: 25,
    regulatoryDutyPercent: 3,
    supplementaryDutyPercent: 20,
    vatPercent: 15,
    advanceTaxPercent: 5,
    advanceIncomeTaxPercent: 5
  });

  const [selectedHsPresetId, setSelectedHsPresetId] = useState<string>('customs-85171300');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [showFormulaGuide, setShowFormulaGuide] = useState(false);

  // Filtered rate items for main database view
  const filteredRates = useMemo(() => {
    let results = searchRateDatabase(
      searchQuery,
      activeTab === 'CALCULATOR' ? 'ALL' : activeTab,
      false
    );

    // Filter by VDS Applicability ('ALL' | 'YES' | 'NO')
    if (vdsApplicabilityFilter === 'YES') {
      results = results.filter(item => item.vdsApplicable === true);
    } else if (vdsApplicabilityFilter === 'NO') {
      results = results.filter(item => item.vdsApplicable === false);
    }

    // Rate tier filter
    if (rateTypeFilter !== 'ALL') {
      results = results.filter(item => {
        if (item.category === 'VAT') {
          const vat = item as VatRateItem;
          if (rateTypeFilter === 'EXEMPT') return vat.vatRate === 0;
          if (rateTypeFilter === 'REDUCED') return vat.vatRate > 0 && vat.vatRate < 15;
          if (rateTypeFilter === 'STANDARD') return vat.vatRate >= 15;
        }
        if (item.category === 'CUSTOMS') {
          const cust = item as CustomsRateItem;
          if (rateTypeFilter === 'EXEMPT') return cust.customsDuty === 0 && cust.vatRate === 0;
          if (rateTypeFilter === 'REDUCED') return cust.customsDuty > 0 && cust.customsDuty < 25;
          if (rateTypeFilter === 'STANDARD') return cust.customsDuty >= 25;
        }
        return true;
      });
    }

    // SRO filter
    if (sroFilter !== 'ALL') {
      results = results.filter(item => {
        if (item.category === 'VAT') {
          const vat = item as VatRateItem;
          if (sroFilter === 'SRO_240') return vat.sroNumber?.includes('240-AIN/2021');
          if (sroFilter === 'SRO_173') return vat.sroNumber?.includes('173-AIN/2024');
          if (sroFilter === 'SRO_136') return vat.sroNumber?.includes('136-AIN/2023');
        }
        return true;
      });
    }

    return results;
  }, [searchQuery, activeTab, vdsApplicabilityFilter, rateTypeFilter, sroFilter]);

  // Predictive search suggestions
  const predictiveSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();

    return NATIONAL_RATE_DATABASE.filter(item => {
      const matchesCode = item.code.toLowerCase().includes(q);
      const matchesTitle = item.title.toLowerCase().includes(q);
      const matchesDesc = item.description.toLowerCase().includes(q);
      const matchesTags = item.tags.some(t => t.toLowerCase().includes(q));
      
      let matchesHs = false;
      if (item.category === 'CUSTOMS') {
        matchesHs = (item as CustomsRateItem).hsCode.toLowerCase().includes(q);
      }

      return matchesCode || matchesTitle || matchesDesc || matchesTags || matchesHs;
    }).slice(0, 8); // Top 8 predictive matches
  }, [searchQuery]);

  // Category counts matching current query
  const categoryCounts = useMemo(() => {
    const base = searchRateDatabase(searchQuery, 'ALL', false);
    return {
      all: base.length,
      vat: base.filter(i => i.category === 'VAT').length,
      tds: base.filter(i => i.category === 'TDS_VDS').length,
      customs: base.filter(i => i.category === 'CUSTOMS').length,
      vds: base.filter(i => i.vdsApplicable).length,
      vdsNo: base.filter(i => !i.vdsApplicable).length
    };
  }, [searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = NATIONAL_RATE_DATABASE.length;
    const vatCount = NATIONAL_RATE_DATABASE.filter(r => r.category === 'VAT').length;
    const tdsCount = NATIONAL_RATE_DATABASE.filter(r => r.category === 'TDS_VDS').length;
    const customsCount = NATIONAL_RATE_DATABASE.filter(r => r.category === 'CUSTOMS').length;
    const vdsCount = NATIONAL_RATE_DATABASE.filter(r => r.vdsApplicable).length;
    return { total, vatCount, tdsCount, customsCount, vdsCount };
  }, []);

  // Customs presets
  const customsItems = useMemo(() => {
    return NATIONAL_RATE_DATABASE.filter(r => r.category === 'CUSTOMS') as CustomsRateItem[];
  }, []);

  // Filtered Customs Items for Calculator Search
  const filteredCalculatorCustoms = useMemo(() => {
    if (!hsSearchTerm.trim()) return customsItems;
    const term = hsSearchTerm.toLowerCase();
    return customsItems.filter(c => 
      c.hsCode.toLowerCase().includes(term) ||
      c.title.toLowerCase().includes(term) ||
      c.description.toLowerCase().includes(term)
    );
  }, [customsItems, hsSearchTerm]);

  // Update Assessable Value in BDT when foreign currency inputs change
  const handleForeignCurrencyChange = (amount: number, rate: number) => {
    setForeignAmount(amount);
    setExchangeRateBDT(rate);
    const calculatedAv = Math.round(amount * rate);
    setCalculatorInputs(prev => ({ ...prev, assessableValueBDT: calculatedAv }));
  };

  // Preset picker handler
  const handleSelectCustomsPreset = (item: CustomsRateItem) => {
    setSelectedHsPresetId(item.id);
    setCustomHsCode(item.hsCode);
    setCustomHsTitle(item.title);
    setCalculatorInputs(prev => ({
      ...prev,
      customsDutyPercent: item.customsDuty,
      regulatoryDutyPercent: item.regulatoryDuty,
      supplementaryDutyPercent: item.supplementaryDuty,
      vatPercent: item.vatRate,
      advanceTaxPercent: item.advanceTax,
      advanceIncomeTaxPercent: item.advanceIncomeTax
    }));
  };

  // Duty calculation result
  const dutyBreakdown = useMemo(() => {
    return calculateCustomsDuties(calculatorInputs);
  }, [calculatorInputs]);

  // Pre-fill calculator from rate item
  const handleOpenInCalculator = (item: CustomsRateItem) => {
    handleSelectCustomsPreset(item);
    setActiveTab('CALCULATOR');
    setSelectedItem(null);
  };

  const handleCopySummary = () => {
    const summaryText = `NBR Customs Duty & Total Tax Incidence Calculation:
HS Code: ${customHsCode} (${customHsTitle})
Assessable Value (AV): BDT ${dutyBreakdown.assessableValueBDT.toLocaleString()}
--------------------------------------------------
- Customs Duty (CD @ ${calculatorInputs.customsDutyPercent}%): BDT ${dutyBreakdown.customsDutyBDT.toLocaleString()}
- Regulatory Duty (RD @ ${calculatorInputs.regulatoryDutyPercent}%): BDT ${dutyBreakdown.regulatoryDutyBDT.toLocaleString()}
- Supplementary Duty (SD @ ${calculatorInputs.supplementaryDutyPercent}%): BDT ${dutyBreakdown.supplementaryDutyBDT.toLocaleString()}
- Value Added Tax (VAT @ ${calculatorInputs.vatPercent}%): BDT ${dutyBreakdown.vatBDT.toLocaleString()}
- Advance Tax (AT @ ${calculatorInputs.advanceTaxPercent}%): BDT ${dutyBreakdown.advanceTaxBDT.toLocaleString()}
- Advance Income Tax (AIT @ ${calculatorInputs.advanceIncomeTaxPercent}%): BDT ${dutyBreakdown.advanceIncomeTaxBDT.toLocaleString()}
==================================================
Total Duty Payable: BDT ${dutyBreakdown.totalDutyPayableBDT.toLocaleString()}
Total Landed Cost: BDT ${dutyBreakdown.totalCostWithTaxBDT.toLocaleString()}
Effective Total Tax Incidence (TTI): ${dutyBreakdown.effectiveTotalTaxIncidencePercent}%`;

    navigator.clipboard.writeText(summaryText);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-6 pb-16">
      <ToolSEO
        title={
          selectedItem
            ? `${selectedItem.title} (${selectedItem.code}) – National Rate Finder | Accounticca`
            : 'Bangladesh National Tax, VAT, TDS, VDS & Customs Duty Rate Finder | Accounticca'
        }
        description="Search statutory VAT schedules, TDS/VDS withholding sections, and HS Code customs import duty rates under Bangladesh Finance Act 2026."
        canonicalUrl="/tools/rate-finder"
        keywords={['Bangladesh VAT Rate Finder', 'TDS VDS Rate Schedule', 'HS Code Duty Calculator Bangladesh', 'NBR Rate Finder']}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link to="/tools" className="hover:text-emerald-700 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Tools Hub
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-medium">National Rate Finder</span>
        </div>

        {/* Hero Header Banner */}
        <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 translate-x-12 -translate-y-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              National Tax, VAT & Customs Tariff Directory 2026–27
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
              National Rate Finder & Tariff Database
            </h1>
            <p className="text-slate-300 max-w-3xl text-sm sm:text-base leading-relaxed mb-6">
              Search & verify live statutory rates for Bangladesh Value Added Tax (VAT), Withholding Tax (TDS/VDS under ITA 2023), and Customs HS Code tariffs with predictive search and an integrated Total Tax Incidence (TTI) duty calculator.
            </p>

            {/* Statutory Badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-200 mb-6">
              <span className="px-3 py-1 rounded-lg bg-white/10 backdrop-blur-xs border border-white/10 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                VAT & SD Act, 2012
              </span>
              <span className="px-3 py-1 rounded-lg bg-white/10 backdrop-blur-xs border border-white/10 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                Income Tax Act, 2023
              </span>
              <span className="px-3 py-1 rounded-lg bg-white/10 backdrop-blur-xs border border-white/10 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                Customs Act, 2023 & Finance Act 2026
              </span>
              <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                S.R.O. No. 240-AIN/2021 VDS Compliant
              </span>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-700/60">
              <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
                <div className="text-xs text-slate-400">Total Indexed Items</div>
                <div className="text-xl font-bold text-white mt-0.5">{stats.total} Statutory Rates</div>
              </div>
              <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
                <div className="text-xs text-slate-400">VAT & Service Codes</div>
                <div className="text-xl font-bold text-emerald-400 mt-0.5">{stats.vatCount} Categories</div>
              </div>
              <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
                <div className="text-xs text-slate-400">TDS / VDS Sections</div>
                <div className="text-xl font-bold text-blue-400 mt-0.5">{stats.tdsCount} ITA Sections</div>
              </div>
              <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
                <div className="text-xs text-slate-400">HS Customs Tariffs</div>
                <div className="text-xl font-bold text-amber-400 mt-0.5">{stats.customsCount} HS Codes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Category Tabs Navigation */}
        <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-200 mb-6 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              All Rates
            </button>
            <button
              onClick={() => setActiveTab('VAT')}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'VAT'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              VAT Rates ({stats.vatCount})
            </button>
            <button
              onClick={() => setActiveTab('TDS_VDS')}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'TDS_VDS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Percent className="w-4 h-4" />
              TDS / VDS Rates ({stats.tdsCount})
            </button>
            <button
              onClick={() => setActiveTab('CUSTOMS')}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'CUSTOMS'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Coins className="w-4 h-4" />
              Customs & HS Codes ({stats.customsCount})
            </button>
            <button
              onClick={() => setActiveTab('CALCULATOR')}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'CALCULATOR'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
              }`}
            >
              <Calculator className="w-4 h-4" />
              Duty & Tax Calculator
            </button>
          </div>

          {activeTab !== 'CALCULATOR' && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Table View
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'cards' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Card View
              </button>
            </div>
          )}
        </div>

        {/* CONTENT FOR RATES SEARCH OR CALCULATOR */}
        {activeTab !== 'CALCULATOR' ? (
          <div>
            {/* Search Bar & Predictive Text Header */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 mb-6">
              
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                {/* PREDICTIVE SEARCH INPUT WRAPPER */}
                <div ref={searchContainerRef} className="relative flex-1">
                  <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowPredictiveMenu(true);
                    }}
                    onFocus={() => setShowPredictiveMenu(true)}
                    placeholder="Search by HS Code (e.g. 8471), Section (e.g. Sec 89), Service Code (S003)..."
                    className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setShowPredictiveMenu(false);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  {/* PREDICTIVE TEXT DROPDOWN PANEL */}
                  {showPredictiveMenu && predictiveSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
                      <div className="px-4 py-2 bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                        <span>Predictive Match Suggestions ({predictiveSuggestions.length})</span>
                        <span className="text-slate-400">Click to Select or Inspect</span>
                      </div>

                      {predictiveSuggestions.map((sug) => (
                        <div
                          key={sug.id}
                          onClick={() => {
                            setSearchQuery(sug.code);
                            setShowPredictiveMenu(false);
                          }}
                          className="p-3.5 hover:bg-emerald-50/70 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <span className="font-mono text-xs font-extrabold px-2.5 py-1 bg-slate-100 group-hover:bg-emerald-100 group-hover:text-emerald-900 rounded-lg text-slate-900 border border-slate-200 shrink-0">
                              {sug.code}
                            </span>
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-900 truncate">
                                {sug.title}
                              </div>
                              <div className="text-xs text-slate-500 truncate mt-0.5">
                                {sug.sectionOrSchedule} — {sug.description}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {sug.category === 'VAT' && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                                VAT {(sug as VatRateItem).vatRate}%
                              </span>
                            )}
                            {sug.category === 'TDS_VDS' && (
                              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[11px] font-bold">
                                TDS {(sug as TdsVdsRateItem).baseRateFormatted}
                              </span>
                            )}
                            {sug.category === 'CUSTOMS' && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[11px] font-bold">
                                TTI {(sug as CustomsRateItem).totalTaxIncidence}%
                              </span>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedItem(sug);
                                setShowPredictiveMenu(false);
                              }}
                              className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-white rounded-md transition-colors"
                              title="Inspect details"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Filters Dropdowns */}
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={rateTypeFilter}
                    onChange={(e: any) => setRateTypeFilter(e.target.value)}
                    className="px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ALL">All Rate Tiers</option>
                    <option value="EXEMPT">Exempt (0%)</option>
                    <option value="REDUCED">Reduced Rate (&lt;15%)</option>
                    <option value="STANDARD">Standard Rate (&ge;15%)</option>
                  </select>

                  <select
                    value={sroFilter}
                    onChange={(e: any) => setSroFilter(e.target.value)}
                    className="px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ALL">All SRO Notifications</option>
                    <option value="SRO_240">SRO 240 (VDS Rules)</option>
                    <option value="SRO_173">SRO 173 (ITES Software)</option>
                    <option value="SRO_136">SRO 136 (Hotel Services)</option>
                  </select>

                  {/* Filter by VDS Applicability Dropdown */}
                  <div className="relative flex items-center">
                    <Filter className="w-3.5 h-3.5 text-emerald-600 absolute left-3 pointer-events-none" />
                    <select
                      aria-label="Filter by VDS Applicability"
                      value={vdsApplicabilityFilter}
                      onChange={(e) => setVdsApplicabilityFilter(e.target.value as 'ALL' | 'YES' | 'NO')}
                      className={`pl-8 pr-8 py-3 border rounded-xl text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-colors cursor-pointer ${
                        vdsApplicabilityFilter === 'YES'
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : vdsApplicabilityFilter === 'NO'
                          ? 'bg-amber-50 border-amber-300 text-amber-900'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <option value="ALL">Filter by VDS Applicability: All ({categoryCounts.all})</option>
                      <option value="YES">VDS Applicability: Yes ({categoryCounts.vds})</option>
                      <option value="NO">VDS Applicability: No ({categoryCounts.vdsNo})</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* CATEGORY-BASED FILTERING PILLS WITH LIVE COUNTS */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-1">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                  Category Filters:
                </span>

                <button
                  onClick={() => {
                    setActiveTab('ALL');
                    setVdsApplicabilityFilter('ALL');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'ALL' && vdsApplicabilityFilter === 'ALL'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All Rates
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${activeTab === 'ALL' && vdsApplicabilityFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'}`}>
                    {categoryCounts.all}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('VAT');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'VAT'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  VAT Services &amp; Goods
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${activeTab === 'VAT' ? 'bg-white/20 text-white' : 'bg-emerald-200/80 text-emerald-900'}`}>
                    {categoryCounts.vat}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('TDS_VDS');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'TDS_VDS'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                  }`}
                >
                  Withholding Tax (TDS)
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${activeTab === 'TDS_VDS' ? 'bg-white/20 text-white' : 'bg-blue-200/80 text-blue-900'}`}>
                    {categoryCounts.tds}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('CUSTOMS');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'CUSTOMS'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                  }`}
                >
                  Customs HS Tariffs
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${activeTab === 'CUSTOMS' ? 'bg-white/20 text-white' : 'bg-amber-200/80 text-amber-950'}`}>
                    {categoryCounts.customs}
                  </span>
                </button>

                <button
                  onClick={() => setVdsApplicabilityFilter(vdsApplicabilityFilter === 'YES' ? 'ALL' : 'YES')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    vdsApplicabilityFilter === 'YES'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  VDS: Yes
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${vdsApplicabilityFilter === 'YES' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'}`}>
                    {categoryCounts.vds}
                  </span>
                </button>

                <button
                  onClick={() => setVdsApplicabilityFilter(vdsApplicabilityFilter === 'NO' ? 'ALL' : 'NO')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    vdsApplicabilityFilter === 'NO'
                      ? 'bg-slate-700 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  VDS: No
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${vdsApplicabilityFilter === 'NO' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'}`}>
                    {categoryCounts.vdsNo}
                  </span>
                </button>
              </div>

              {/* Recommended Quick Search Suggestions */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-400 font-medium">Quick Suggestions:</span>
                {[
                  { label: 'Laptop (8471)', query: '8471' },
                  { label: 'Smartphone (8517)', query: '8517' },
                  { label: 'Software (S003)', query: 'S003' },
                  { label: 'Sec. 89 (Supply)', query: 'Sec. 89' },
                  { label: 'Sec. 91 (Consultancy)', query: 'Sec. 91' },
                  { label: 'Sec. 95 (Rent)', query: 'Sec. 95' },
                  { label: 'Construction (S002)', query: 'S002' },
                  { label: 'Car 1500cc (8703)', query: '8703' }
                ].map(chip => (
                  <button
                    key={chip.label}
                    onClick={() => {
                      setSearchQuery(chip.query);
                      setShowPredictiveMenu(false);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-600 font-medium transition-colors"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Results Summary Header */}
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="text-sm text-slate-600">
                Showing <span className="font-bold text-slate-900">{filteredRates.length}</span> matching statutory rate records
                {searchQuery && <span> for &ldquo;<span className="text-emerald-700 font-medium">{searchQuery}</span>&rdquo;</span>}
              </div>
              {(searchQuery || vdsApplicabilityFilter !== 'ALL' || rateTypeFilter !== 'ALL' || sroFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setVdsApplicabilityFilter('ALL');
                    setRateTypeFilter('ALL');
                    setSroFilter('ALL');
                  }}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  Reset Search &amp; Filters
                </button>
              )}
            </div>

            {/* RESULTS VIEW - TABLE OR CARDS */}
            {filteredRates.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                <Info className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-900 mb-1">No Rate Records Found</h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto mb-4">
                  No statutory rate or HS code matching your current search query or active filters. Try searching by HS Code, Section code, or broader keywords.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setVdsApplicabilityFilter('ALL');
                    setRateTypeFilter('ALL');
                    setSroFilter('ALL');
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  Clear Search Filters
                </button>
              </div>
            ) : viewMode === 'table' ? (
              /* TABLE VIEW */
              <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden mb-8">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                      <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider font-semibold">
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4">Code / Section</th>
                        <th className="py-3.5 px-4">Product / Service Title</th>
                        <th className="py-3.5 px-4">Statutory Rate</th>
                        <th className="py-3.5 px-4">VDS Status</th>
                        <th className="py-3.5 px-4">Schedule / Legal Basis</th>
                        <th className="py-3.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {filteredRates.map((item) => {
                        let categoryBadge = null;
                        let rateDisplay = null;

                        if (item.category === 'VAT') {
                          const vat = item as VatRateItem;
                          categoryBadge = (
                            <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold">
                              VAT
                            </span>
                          );
                          rateDisplay = (
                            <span className={`font-bold ${vat.vatRate === 0 ? 'text-emerald-600' : vat.vatRate === 15 ? 'text-slate-900' : 'text-blue-600'}`}>
                              {vat.vatRate}% ({vat.vatType})
                            </span>
                          );
                        } else if (item.category === 'TDS_VDS') {
                          const tds = item as TdsVdsRateItem;
                          categoryBadge = (
                            <span className="px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 text-xs font-bold">
                              TDS / VDS
                            </span>
                          );
                          rateDisplay = (
                            <span className="font-bold text-blue-900">
                              {tds.baseRateFormatted}
                            </span>
                          );
                        } else if (item.category === 'CUSTOMS') {
                          const cust = item as CustomsRateItem;
                          categoryBadge = (
                            <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 text-xs font-bold">
                              Customs Tariff
                            </span>
                          );
                          rateDisplay = (
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900">TTI: {cust.totalTaxIncidence}%</span>
                              <span className="text-xs text-slate-500">
                                CD: {cust.customsDuty}% | SD: {cust.supplementaryDuty}% | VAT: {cust.vatRate}%
                              </span>
                            </div>
                          );
                        }

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 align-top">
                              {categoryBadge}
                            </td>
                            <td className="py-3.5 px-4 align-top font-mono font-bold text-slate-900">
                              {item.code}
                            </td>
                            <td className="py-3.5 px-4 align-top">
                              <div className="font-semibold text-slate-900">{item.title}</div>
                              <div className="text-xs text-slate-500 line-clamp-2 mt-0.5">{item.description}</div>
                            </td>
                            <td className="py-3.5 px-4 align-top">
                              {rateDisplay}
                            </td>
                            <td className="py-3.5 px-4 align-top">
                              {item.vdsApplicable ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                                  <CheckCircle2 className="w-3 h-3" />
                                  VDS Compulsory
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">N/A</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 align-top text-xs text-slate-600 font-medium max-w-xs">
                              {item.sectionOrSchedule}
                            </td>
                            <td className="py-3.5 px-4 align-top text-right">
                              <button
                                onClick={() => setSelectedItem(item)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                              >
                                View Logic
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* CARD GRID VIEW */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {filteredRates.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="font-mono text-xs font-extrabold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-900 border border-slate-200">
                          {item.code}
                        </span>
                        {item.category === 'VAT' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                            VAT
                          </span>
                        )}
                        {item.category === 'TDS_VDS' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                            TDS / VDS
                          </span>
                        )}
                        {item.category === 'CUSTOMS' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                            Customs Tariff
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-slate-900 text-base mb-1.5 line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-slate-600 text-xs leading-relaxed line-clamp-3 mb-4">
                        {item.description}
                      </p>

                      <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-100 text-xs space-y-1.5">
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="text-slate-500">Statutory Rate:</span>
                          <span className="font-bold text-slate-900">
                            {item.category === 'VAT' && `${(item as VatRateItem).vatRate}% (${(item as VatRateItem).vatType})`}
                            {item.category === 'TDS_VDS' && (item as TdsVdsRateItem).baseRateFormatted}
                            {item.category === 'CUSTOMS' && `TTI: ${(item as CustomsRateItem).totalTaxIncidence}%`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="text-slate-500">Schedule / SRO:</span>
                          <span className="font-semibold text-slate-700 truncate max-w-[180px]">{item.sectionOrSchedule}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      {item.vdsApplicable ? (
                        <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          VDS Mandatory
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Standard Deduction</span>
                      )}

                      <button
                        onClick={() => setSelectedItem(item)}
                        className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-1"
                      >
                        Inspect Rate
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* INTEGRATED DUTY & TAX CALCULATOR TAB */
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
              
              {/* Calculator Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-2">
                    <Calculator className="w-3.5 h-3.5" />
                    Bangladesh Customs Tariff &amp; Total Tax Incidence (TTI) Engine
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Import Duty &amp; Total Tax Incidence Calculator
                  </h2>
                  <p className="text-slate-600 text-sm mt-1">
                    Query HS codes and enter customs valuation to calculate compounding duties (CD, RD, SD, VAT, AT, AIT) and effective TTI %.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowFormulaGuide(!showFormulaGuide)}
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    {showFormulaGuide ? 'Hide Formula Guide' : 'Formula Logic Guide'}
                  </button>

                  <button
                    onClick={handleCopySummary}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 shadow-xs"
                  >
                    <Copy className="w-4 h-4" />
                    {copiedNotification ? 'Copied Summary!' : 'Copy Calculation'}
                  </button>
                </div>
              </div>

              {/* FORMULA GUIDE EXPANDABLE PANEL */}
              {showFormulaGuide && (
                <div className="mb-6 bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-6 rounded-2xl border border-indigo-700 text-xs space-y-3 relative">
                  <button
                    onClick={() => setShowFormulaGuide(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <h3 className="font-bold text-indigo-300 text-sm flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    Statutory Compounding Formula under Bangladesh Customs Act, 2023
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    Under National Board of Revenue (NBR) customs regulations, import duties are computed sequentially in a cascading compounding structure:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 font-mono text-[11px] pt-1">
                    <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                      <span className="text-emerald-400 font-bold block mb-0.5">1. Customs Duty (CD)</span>
                      CD = Assessable Value (AV) &times; CD%
                    </div>
                    <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                      <span className="text-emerald-400 font-bold block mb-0.5">2. Regulatory Duty (RD)</span>
                      RD = Assessable Value (AV) &times; RD%
                    </div>
                    <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                      <span className="text-amber-400 font-bold block mb-0.5">3. Supplementary Duty (SD)</span>
                      SD = (AV + CD + RD) &times; SD%
                    </div>
                    <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                      <span className="text-blue-400 font-bold block mb-0.5">4. Value Added Tax (VAT)</span>
                      VAT = (AV + CD + RD + SD) &times; VAT%
                    </div>
                    <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                      <span className="text-indigo-300 font-bold block mb-0.5">5. Advance Tax (AT)</span>
                      AT = (AV + CD + RD + SD) &times; AT%
                    </div>
                    <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                      <span className="text-slate-300 font-bold block mb-0.5">6. Advance Income Tax (AIT)</span>
                      AIT = Assessable Value (AV) &times; AIT%
                    </div>
                  </div>

                  <div className="pt-2 text-slate-300">
                    <span className="font-bold text-white">Total Tax Incidence (TTI %):</span> TTI = (Total Duty Payable / Assessable Value) &times; 100%
                  </div>
                </div>
              )}

              {/* STEP 1: HS CODE SELECTION & TARIFF SEARCH */}
              <div className="mb-6 bg-slate-50 rounded-2xl p-5 border border-slate-200">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-600" />
                    Step 1: Select 8-Digit HS Code Tariff or Pick Preset:
                  </label>
                  <span className="text-xs text-slate-500 font-mono">Current HS: <span className="font-bold text-slate-900">{customHsCode}</span></span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  {/* Live Search Input for HS Preset */}
                  <div className="relative md:col-span-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={hsSearchTerm}
                      onChange={(e) => setHsSearchTerm(e.target.value)}
                      placeholder="Filter HS code or item..."
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Dropdown Preset Picker */}
                  <div className="md:col-span-2">
                    <select
                      value={selectedHsPresetId}
                      onChange={(e) => {
                        const item = customsItems.find(c => c.id === e.target.value);
                        if (item) handleSelectCustomsPreset(item);
                      }}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    >
                      {filteredCalculatorCustoms.map((item) => (
                        <option key={item.id} value={item.id}>
                          HS {item.hsCode} — {item.title} (CD: {item.customsDuty}% | TTI: {item.totalTaxIncidence}%)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Custom HS Code & Title Override Inputs */}
                <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Custom HS Code String:</label>
                    <input
                      type="text"
                      value={customHsCode}
                      onChange={(e) => setCustomHsCode(e.target.value)}
                      placeholder="e.g. 8471.30.10"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Custom Item Description:</label>
                    <input
                      type="text"
                      value={customHsTitle}
                      onChange={(e) => setCustomHsTitle(e.target.value)}
                      placeholder="e.g. Imported Industrial Machinery"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* STEP 2: VALUATION INPUT (BDT OR FOREIGN CURRENCY) */}
              <div className="mb-6 bg-indigo-50/50 rounded-2xl p-5 border border-indigo-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-indigo-700" />
                    Step 2: Customs Assessable Value (AV) Determination:
                  </label>

                  {/* Valuation Mode Switcher */}
                  <div className="flex items-center bg-white p-1 rounded-xl border border-indigo-200 text-xs font-semibold">
                    <button
                      onClick={() => setValuationMode('BDT')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        valuationMode === 'BDT' ? 'bg-indigo-600 text-white shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Direct BDT
                    </button>
                    <button
                      onClick={() => setValuationMode('FOREIGN')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        valuationMode === 'FOREIGN' ? 'bg-indigo-600 text-white shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Foreign Currency (C&amp;F)
                    </button>
                  </div>
                </div>

                {valuationMode === 'BDT' ? (
                  <div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-indigo-700">BDT</span>
                      <input
                        type="number"
                        value={calculatorInputs.assessableValueBDT}
                        onChange={(e) => setCalculatorInputs({ ...calculatorInputs, assessableValueBDT: Number(e.target.value) })}
                        className="w-full pl-16 pr-4 py-3 bg-white border border-indigo-300 rounded-xl text-lg font-extrabold text-slate-900 focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                    <p className="text-xs text-indigo-800 mt-1.5">
                      Total landed Assessable Value (AV) in BDT approved by Customs C&amp;F valuation.
                    </p>
                  </div>
                ) : (
                  /* FOREIGN CURRENCY CONVERTER MODE */
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Currency:</label>
                      <select
                        value={foreignCurrency}
                        onChange={(e: any) => setForeignCurrency(e.target.value)}
                        className="w-full p-2.5 bg-white border border-indigo-300 rounded-xl font-bold text-slate-900 text-xs"
                      >
                        <option value="USD">USD ($ - US Dollar)</option>
                        <option value="EUR">EUR (€ - Euro)</option>
                        <option value="GBP">GBP (£ - British Pound)</option>
                        <option value="JPY">JPY (¥ - Japanese Yen)</option>
                        <option value="SGD">SGD ($ - Singapore Dollar)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">C&amp;F Amount ({foreignCurrency}):</label>
                      <input
                        type="number"
                        value={foreignAmount}
                        onChange={(e) => handleForeignCurrencyChange(Number(e.target.value), exchangeRateBDT)}
                        className="w-full p-2.5 bg-white border border-indigo-300 rounded-xl font-bold text-slate-900 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Customs Exchange Rate (BDT):</label>
                      <input
                        type="number"
                        value={exchangeRateBDT}
                        onChange={(e) => handleForeignCurrencyChange(foreignAmount, Number(e.target.value))}
                        className="w-full p-2.5 bg-white border border-indigo-300 rounded-xl font-bold text-slate-900 text-sm"
                      />
                    </div>

                    <div className="sm:col-span-3 bg-white p-3 rounded-xl border border-indigo-200 text-xs font-bold text-indigo-900 flex justify-between items-center">
                      <span>Converted Assessable Value (AV):</span>
                      <span className="text-sm font-black text-indigo-700">BDT {calculatorInputs.assessableValueBDT.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 3: STATUTORY CUSTOMS DUTY RATES INPUT GRID */}
              <div className="mb-8">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-800 mb-3">
                  Step 3: Review / Adjust Tariff Duty Rates (%):
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {/* CD % */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Customs Duty (CD %)</label>
                    <input
                      type="number"
                      value={calculatorInputs.customsDutyPercent}
                      onChange={(e) => setCalculatorInputs({ ...calculatorInputs, customsDutyPercent: Number(e.target.value) })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-sm"
                    />
                    <div className="text-[10px] text-slate-500 mt-1">On AV</div>
                  </div>

                  {/* RD % */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Regulatory Duty (RD %)</label>
                    <input
                      type="number"
                      value={calculatorInputs.regulatoryDutyPercent}
                      onChange={(e) => setCalculatorInputs({ ...calculatorInputs, regulatoryDutyPercent: Number(e.target.value) })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-sm"
                    />
                    <div className="text-[10px] text-slate-500 mt-1">On AV</div>
                  </div>

                  {/* SD % */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Supplementary (SD %)</label>
                    <input
                      type="number"
                      value={calculatorInputs.supplementaryDutyPercent}
                      onChange={(e) => setCalculatorInputs({ ...calculatorInputs, supplementaryDutyPercent: Number(e.target.value) })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-amber-700 text-sm"
                    />
                    <div className="text-[10px] text-slate-500 mt-1">On (AV+CD+RD)</div>
                  </div>

                  {/* VAT % */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">VAT Rate (VAT %)</label>
                    <input
                      type="number"
                      value={calculatorInputs.vatPercent}
                      onChange={(e) => setCalculatorInputs({ ...calculatorInputs, vatPercent: Number(e.target.value) })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-blue-700 text-sm"
                    />
                    <div className="text-[10px] text-slate-500 mt-1">On (AV+CD+RD+SD)</div>
                  </div>

                  {/* AT % */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Advance Tax (AT %)</label>
                    <input
                      type="number"
                      value={calculatorInputs.advanceTaxPercent}
                      onChange={(e) => setCalculatorInputs({ ...calculatorInputs, advanceTaxPercent: Number(e.target.value) })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-sm"
                    />
                    <div className="text-[10px] text-slate-500 mt-1">Import stage AT</div>
                  </div>

                  {/* AIT % */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Advance Income Tax (AIT %)</label>
                    <input
                      type="number"
                      value={calculatorInputs.advanceIncomeTaxPercent}
                      onChange={(e) => setCalculatorInputs({ ...calculatorInputs, advanceIncomeTaxPercent: Number(e.target.value) })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-sm"
                    />
                    <div className="text-[10px] text-slate-500 mt-1">On AV</div>
                  </div>
                </div>
              </div>

              {/* CALCULATION RESULTS BREAKDOWN PANEL */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-slate-400 font-bold">Effective Total Tax Incidence (TTI)</div>
                    <div className="text-3xl sm:text-5xl font-black text-emerald-400 mt-1">
                      {dutyBreakdown.effectiveTotalTaxIncidencePercent}%
                    </div>
                    <div className="text-xs text-slate-400 mt-1 font-mono">
                      HS Code: <span className="font-bold text-white">{customHsCode}</span> ({customHsTitle})
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-xs uppercase tracking-wider text-slate-400 font-bold">Total Duty &amp; Tax Payable</div>
                    <div className="text-2xl sm:text-4xl font-extrabold text-white mt-1 font-mono">
                      BDT {dutyBreakdown.totalDutyPayableBDT.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Landed Import Cost: <span className="font-bold text-emerald-300">BDT {dutyBreakdown.totalCostWithTaxBDT.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Stacked Visual Bar Breakdown */}
                <div className="mb-6">
                  <div className="flex justify-between items-center text-xs text-slate-300 mb-2 font-semibold">
                    <span>Landed Cost Composition (AV vs Total Duties):</span>
                    <span>Assessable Value: {Math.round((dutyBreakdown.assessableValueBDT / dutyBreakdown.totalCostWithTaxBDT) * 100)}%</span>
                  </div>

                  <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden flex">
                    <div 
                      style={{ width: `${(dutyBreakdown.assessableValueBDT / dutyBreakdown.totalCostWithTaxBDT) * 100}%` }} 
                      className="bg-indigo-500 h-full"
                      title="Assessable Value"
                    />
                    <div 
                      style={{ width: `${(dutyBreakdown.customsDutyBDT / dutyBreakdown.totalCostWithTaxBDT) * 100}%` }} 
                      className="bg-emerald-500 h-full"
                      title="Customs Duty"
                    />
                    <div 
                      style={{ width: `${(dutyBreakdown.supplementaryDutyBDT / dutyBreakdown.totalCostWithTaxBDT) * 100}%` }} 
                      className="bg-amber-500 h-full"
                      title="Supplementary Duty"
                    />
                    <div 
                      style={{ width: `${(dutyBreakdown.vatBDT / dutyBreakdown.totalCostWithTaxBDT) * 100}%` }} 
                      className="bg-blue-500 h-full"
                      title="VAT"
                    />
                    <div 
                      style={{ width: `${((dutyBreakdown.advanceTaxBDT + dutyBreakdown.advanceIncomeTaxBDT) / dutyBreakdown.totalCostWithTaxBDT) * 100}%` }} 
                      className="bg-teal-400 h-full"
                      title="AT & AIT"
                    />
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300 mt-2">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></span> AV</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> CD</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span> SD</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span> VAT</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-teal-400 rounded-full"></span> AT &amp; AIT</span>
                  </div>
                </div>

                {/* Detailed Breakdown Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-xs text-slate-400 border-b border-slate-800 uppercase">
                        <th className="py-2.5 px-3">Duty Component</th>
                        <th className="py-2.5 px-3">Rate %</th>
                        <th className="py-2.5 px-3">Base Valuation Amount (BDT)</th>
                        <th className="py-2.5 px-3 text-right">Duty Payable (BDT)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-medium">
                      <tr>
                        <td className="py-3 px-3 text-slate-200 font-bold">Customs Duty (CD)</td>
                        <td className="py-3 px-3 text-slate-300">{calculatorInputs.customsDutyPercent}%</td>
                        <td className="py-3 px-3 text-slate-400 font-mono">BDT {dutyBreakdown.assessableValueBDT.toLocaleString()}</td>
                        <td className="py-3 px-3 text-right text-emerald-400 font-bold font-mono">
                          BDT {dutyBreakdown.customsDutyBDT.toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-3 text-slate-200 font-bold">Regulatory Duty (RD)</td>
                        <td className="py-3 px-3 text-slate-300">{calculatorInputs.regulatoryDutyPercent}%</td>
                        <td className="py-3 px-3 text-slate-400 font-mono">BDT {dutyBreakdown.assessableValueBDT.toLocaleString()}</td>
                        <td className="py-3 px-3 text-right text-emerald-400 font-bold font-mono">
                          BDT {dutyBreakdown.regulatoryDutyBDT.toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-3 text-slate-200 font-bold">Supplementary Duty (SD)</td>
                        <td className="py-3 px-3 text-slate-300">{calculatorInputs.supplementaryDutyPercent}%</td>
                        <td className="py-3 px-3 text-slate-400 font-mono">BDT {dutyBreakdown.valueForSDBDT.toLocaleString()}</td>
                        <td className="py-3 px-3 text-right text-amber-400 font-bold font-mono">
                          BDT {dutyBreakdown.supplementaryDutyBDT.toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-3 text-slate-200 font-bold">Value Added Tax (VAT)</td>
                        <td className="py-3 px-3 text-slate-300">{calculatorInputs.vatPercent}%</td>
                        <td className="py-3 px-3 text-slate-400 font-mono">BDT {dutyBreakdown.valueForVATBDT.toLocaleString()}</td>
                        <td className="py-3 px-3 text-right text-blue-400 font-bold font-mono">
                          BDT {dutyBreakdown.vatBDT.toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-3 text-slate-200 font-bold">Advance Tax (AT)</td>
                        <td className="py-3 px-3 text-slate-300">{calculatorInputs.advanceTaxPercent}%</td>
                        <td className="py-3 px-3 text-slate-400 font-mono">BDT {dutyBreakdown.valueForVATBDT.toLocaleString()}</td>
                        <td className="py-3 px-3 text-right text-slate-300 font-bold font-mono">
                          BDT {dutyBreakdown.advanceTaxBDT.toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-3 text-slate-200 font-bold">Advance Income Tax (AIT)</td>
                        <td className="py-3 px-3 text-slate-300">{calculatorInputs.advanceIncomeTaxPercent}%</td>
                        <td className="py-3 px-3 text-slate-400 font-mono">BDT {dutyBreakdown.assessableValueBDT.toLocaleString()}</td>
                        <td className="py-3 px-3 text-right text-slate-300 font-bold font-mono">
                          BDT {dutyBreakdown.advanceIncomeTaxBDT.toLocaleString()}
                        </td>
                      </tr>
                      <tr className="bg-slate-800/80 text-base font-extrabold">
                        <td className="py-4 px-3 text-white" colSpan={3}>
                          TOTAL LANDED COST (AV + Total Duty)
                        </td>
                        <td className="py-4 px-3 text-right text-emerald-400 font-mono">
                          BDT {dutyBreakdown.totalCostWithTaxBDT.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ITEM DETAIL MODAL */}
        {selectedItem && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute right-5 top-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-3">
                <span className="font-mono text-xs font-bold px-3 py-1 bg-slate-100 rounded-lg text-slate-900 border border-slate-200">
                  {selectedItem.code}
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase">
                  {selectedItem.category} Record
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 mb-2">{selectedItem.title}</h2>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">{selectedItem.description}</p>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 text-sm mb-6">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Statutory Clause / Schedule:</span>
                  <span className="font-bold text-slate-900">{selectedItem.sectionOrSchedule}</span>
                </div>

                {selectedItem.vdsApplicable && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">VDS Applicability:</span>
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Mandatory Source Deduction
                    </span>
                  </div>
                )}

                {selectedItem.remarks && (
                  <div className="py-1">
                    <span className="text-slate-500 font-medium block mb-1">Legal Conditions &amp; Notes:</span>
                    <p className="text-slate-700 text-xs leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                      {selectedItem.remarks}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                {selectedItem.category === 'CUSTOMS' && (
                  <button
                    onClick={() => handleOpenInCalculator(selectedItem as CustomsRateItem)}
                    className="px-4 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    <Calculator className="w-4 h-4" />
                    Calculate Duty in Tool
                  </button>
                )}
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
