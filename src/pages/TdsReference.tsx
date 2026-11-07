import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, BookOpen, Percent, FileText, CheckCircle2, ArrowRightLeft, Globe, Scale, ExternalLink, ChevronRight, Info, Pin, SearchX, RotateCcw, Calculator, Coins, Sparkles } from 'lucide-react';
import { TdsDetailsDrawer, TdsDrawerItem } from '../components/tds/TdsDetailsDrawer';
import { QuickCompareToggle } from '../components/tds/QuickCompareToggle';
import { TdsComparisonTray } from '../components/tds/TdsComparisonTray';
import { TdsComparatorSearchFilter, SectionType } from '../components/tds/TdsComparatorSearchFilter';
import { TdsSearchableSelect } from '../components/tds/TdsSearchableSelect';
import { HighlightText } from '../components/tds/HighlightText';
import { QuickTdsCalculator } from '../components/tds/QuickTdsCalculator';
import { ToolSEO } from '../components/SEO';

export type TdsViewMode = 'database' | 'comparator' | 'calculator' | 'treaty';

interface TdsEntry {
  id: string;
  category: string;
  subCategory: string;
  section: string;
  rate: string;
  notes?: string;
}

interface TreatyEntry {
  country: string;
  dividend: string;
  interest: string;
  royalty: string;
  technical: string;
}

const treatyData: TreatyEntry[] = [
  { country: 'United Kingdom', dividend: '10% / 15%', interest: '10%', royalty: '10%', technical: '10%' },
  { country: 'United States', dividend: '10% / 15%', interest: '10%', royalty: '10%', technical: '10%' },
  { country: 'Singapore', dividend: '10% / 15%', interest: '10%', royalty: '10%', technical: '10%' },
  { country: 'India', dividend: '10% / 15%', interest: '10%', royalty: '10%', technical: '10%' },
  { country: 'Malaysia', dividend: '10% / 15%', interest: '10%', royalty: '10%', technical: '10%' },
  { country: 'Canada', dividend: '15%', interest: '10%', royalty: '10%', technical: '10%' },
  { country: 'Japan', dividend: '10% / 15%', interest: '10%', royalty: '10%', technical: '10%' },
  { country: 'United Arab Emirates', dividend: '5% / 10%', interest: '10%', royalty: '10%', technical: '10%' },
  { country: 'China', dividend: '10%', interest: '10%', royalty: '10%', technical: '10%' },
  { country: 'Netherlands', dividend: '10% / 15%', interest: '10%', royalty: '10%', technical: '10%' },
  { country: 'Germany', dividend: '15%', interest: '10%', royalty: '10%', technical: '10%' },
  { country: 'South Korea', dividend: '10% / 15%', interest: '10%', royalty: '10%', technical: '10%' }
];

const tdsData: TdsEntry[] = [
  // Section 89
  { id: '89-1', category: 'General Supply & Manufacturing Contracts', subCategory: 'Processing, Civil Works, Construction, Engineering', section: 'Section 89 (Supply)', rate: '5%' },
  { id: '89-2', category: 'Industrial Raw Materials & Packaging', subCategory: 'Supplies', section: 'Section 89 (Supply)', rate: '3%' },
  { id: '89-3', category: 'Recycled Goods', subCategory: 'Recycling Inputs', section: 'Section 89 (Supply)', rate: '1%' },
  { id: '89-4', category: 'Petroleum & Energy Supply', subCategory: 'Refinery oil supplies', section: 'Section 89 (Supply)', rate: '1%' },
  { id: '89-5', category: 'Petroleum & Energy Supply', subCategory: 'Extra High Voltage Power Cables 33kV–500kV, VCV', section: 'Section 89 (Supply)', rate: '3%' },
  { id: '89-6', category: 'Tobacco Raw Materials', subCategory: 'Supplies', section: 'Section 89 (Supply)', rate: '10%' },
  { id: '89-7', category: 'Unlisted Product Supplies', subCategory: 'General supplies not covered elsewhere', section: 'Section 89 (Supply)', rate: '5%' },
  
  // Section 90
  { id: '90-1', category: 'Advisory & Consultancy Fees', subCategory: 'Non-individual corporate entity', section: 'Section 90 (Services)', rate: '7.5%' },
  { id: '90-2', category: 'Advisory & Consultancy Fees', subCategory: 'Individual service provider', section: 'Section 90 (Services)', rate: '15%' },
  { id: '90-3', category: 'Technical Services & Know-How', subCategory: 'Non-individual entity', section: 'Section 90 (Services)', rate: '10%' },
  { id: '90-4', category: 'Technical Services & Know-How', subCategory: 'Individual service provider', section: 'Section 90 (Services)', rate: '15%' },
  { id: '90-5', category: 'Logistics, Transport & Rental Services', subCategory: 'Transport, vehicle rental, general repair', section: 'Section 90 (Services)', rate: '2%' },
  { id: '90-6', category: 'Catering, Events & Operational Services', subCategory: 'Catering, PR, training workshops, courier', section: 'Section 90 (Services)', rate: '2%' },
  { id: '90-7', category: 'Manpower Supply & Security Agencies', subCategory: 'On total bill amount', section: 'Section 90 (Services)', rate: '1%' },
  { id: '90-8', category: 'Manpower Supply & Security Agencies', subCategory: 'On commission amount only', section: 'Section 90 (Services)', rate: '10%' },
  { id: '90-9', category: 'Equipment Repair & Dockyard Services', subCategory: 'Motor garage, workshop repair', section: 'Section 90 (Services)', rate: '5%' },
  { id: '90-10', category: 'Telecom & Financial Services', subCategory: 'Mobile network operator, credit rating', section: 'Section 90 (Services)', rate: '10%' },
  { id: '90-11', category: 'Honoraria & Meeting Fees', subCategory: 'Meeting fees, Training fees, Honorarium', section: 'Section 90 (Services)', rate: '20%' },

  // Section 119
  { id: '119-1', category: 'Royalties & Intangible Property Payments', subCategory: 'Royalty fees, License fees, IP rights', section: 'Section 119 (Non-Resident)', rate: '20%' },
  { id: '119-2', category: 'Technical Services & Assistance', subCategory: 'Non-individual corporate entity', section: 'Section 119 (Non-Resident)', rate: '10%' },
  { id: '119-3', category: 'Technical Services & Assistance', subCategory: 'Individual person', section: 'Section 119 (Non-Resident)', rate: '20%' },
  { id: '119-4', category: 'Professional Services', subCategory: 'Foreign company/entity', section: 'Section 119 (Non-Resident)', rate: '10%' },
  { id: '119-5', category: 'Professional Services', subCategory: 'Individual professional', section: 'Section 119 (Non-Resident)', rate: '20%' },
  { id: '119-6', category: 'Legal Service Fees', subCategory: 'Foreign lawyers or legal service providers', section: 'Section 119 (Non-Resident)', rate: '20%' },
  { id: '119-7', category: 'Bandwidth Payments', subCategory: 'International internet bandwidth', section: 'Section 119 (Non-Resident)', rate: '10%' },
  { id: '119-8', category: 'Digital Marketing & Advertisement Creation', subCategory: 'Online marketing, ad production', section: 'Section 119 (Non-Resident)', rate: '10%' },
  { id: '119-9', category: 'Advertisement Broadcasting', subCategory: 'Television advertising, media broadcasting', section: 'Section 119 (Non-Resident)', rate: '15%' },
  { id: '119-10', category: 'Satellite, Airtime, Frequency & Channel Rental', subCategory: 'Satellite capacity, channel leasing', section: 'Section 119 (Non-Resident)', rate: '20%' },
  { id: '119-11', category: 'Cross-Border Contractor Contracts', subCategory: 'Manufacturing, processing, civil works', section: 'Section 119 (Non-Resident)', rate: '6%' },
  { id: '119-12', category: 'Foreign Goods Supply Contracts', subCategory: 'Cross-border supply bills', section: 'Section 119 (Non-Resident)', rate: '6%' },
  { id: '119-13', category: 'Equipment & Machinery Rental', subCategory: 'Equipment rental, machinery leasing', section: 'Section 119 (Non-Resident)', rate: '7.5%' },
  { id: '119-14', category: 'Interest Payments', subCategory: 'Foreign loan interest, deposit interest', section: 'Section 119 (Non-Resident)', rate: '10%' },
  { id: '119-15', category: 'Capital Gains', subCategory: 'Sale of shares, disposal of investment assets', section: 'Section 119 (Non-Resident)', rate: '15%' },
  { id: '119-16', category: 'Dividend Payments', subCategory: 'Company, Fund or Trust', section: 'Section 119 (Non-Resident)', rate: '20%' },
  { id: '119-17', category: 'Dividend Payments', subCategory: 'Individual Person', section: 'Section 119 (Non-Resident)', rate: '25%' },
  { id: '119-18', category: 'Other Unspecified Services', subCategory: 'General provision for foreign services', section: 'Section 119 (Non-Resident)', rate: '20%' },
];

const comparatorSections: SectionType[] = ['All', 'Section 89 (Supply)', 'Section 90 (Services)', 'Section 119 (Non-Resident)'];

function matchesComparatorQuery(item: TdsEntry, query: string): boolean {
  if (!query || !query.trim()) return true;
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  
  return tokens.every(token => {
    // Check if token matches standard section numbers e.g. "89", "90", "119", "sec89", "s89"
    const cleanedNumber = token.replace(/^s(ec(tion)?)?/, '');
    if (['89', '90', '119'].includes(cleanedNumber)) {
      if (item.section.includes(cleanedNumber) || item.id.startsWith(cleanedNumber)) {
        return true;
      }
    }

    return (
      item.section.toLowerCase().includes(token) ||
      item.category.toLowerCase().includes(token) ||
      item.subCategory.toLowerCase().includes(token) ||
      item.rate.toLowerCase().includes(token) ||
      item.id.toLowerCase().includes(token)
    );
  });
}

export function TdsReference() {
  const [viewMode, setViewMode] = useState<TdsViewMode>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hash === '#quick-tds-calculator' || window.location.search.includes('calculator')) {
        return 'calculator';
      }
      if (window.location.hash === '#tds-comparator-section' || window.location.search.includes('comparator')) {
        return 'comparator';
      }
    }
    return 'comparator';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [treatySearch, setTreatySearch] = useState('');
  const [activeSection, setActiveSection] = useState<SectionType>('All');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<TdsEntry | null>(null);

  // Quick TDS Calculator State
  const [calcInitialAmount, setCalcInitialAmount] = useState<number>(100000);
  const [calcInitialRate, setCalcInitialRate] = useState<number>(5);
  const [calcInitialCategory, setCalcInitialCategory] = useState<string>('');

  const handleLaunchCalculatorWithItem = (item: TdsEntry, amount?: number) => {
    const numMatch = item.rate.match(/[\d.]+/);
    const parsedRate = numMatch ? parseFloat(numMatch[0]) : 5;
    setCalcInitialRate(parsedRate);
    setCalcInitialCategory(item.id);
    if (amount) {
      setCalcInitialAmount(amount);
    }
    setViewMode('calculator');
    const el = document.getElementById('quick-tds-calculator');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Comparator State
  const [compareId1, setCompareId1] = useState<string>('89-1');
  const [compareId2, setCompareId2] = useState<string>('119-2');
  const [comparatorSearch, setComparatorSearch] = useState('');
  const [comparatorSectionFilter, setComparatorSectionFilter] = useState<SectionType>('All');

  // Quick-Compare Sticky Tray State
  const [pinnedItemIds, setPinnedItemIds] = useState<string[]>(['89-1', '90-1']);

  const handleTogglePin = (id: string) => {
    setPinnedItemIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      }
      return [...prev, id];
    });
  };

  const pinnedItems = useMemo(() => {
    return pinnedItemIds
      .map(id => tdsData.find(d => d.id === id))
      .filter((item): item is TdsEntry => Boolean(item));
  }, [pinnedItemIds]);

  const handleLoadIntoSlots = (id1: string, id2: string) => {
    setCompareId1(id1);
    setCompareId2(id2);
    setViewMode('comparator');
    const el = document.getElementById('tds-comparator-section');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Handle URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#tds-comparator-section') {
        setViewMode('comparator');
      } else if (window.location.hash === '#quick-tds-calculator') {
        setViewMode('calculator');
      }
    };
    if (window.location.hash === '#tds-comparator-section') {
      setViewMode('comparator');
    } else if (window.location.hash === '#quick-tds-calculator') {
      setViewMode('calculator');
    }
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const compareItem1 = tdsData.find(item => item.id === compareId1);
  const compareItem2 = tdsData.find(item => item.id === compareId2);

  const filteredComparatorItems = useMemo(() => {
    return tdsData.filter(item => {
      const matchesSearch = matchesComparatorQuery(item, comparatorSearch);
      const matchesSection = comparatorSectionFilter === 'All' || item.section === comparatorSectionFilter;
      return matchesSearch && matchesSection;
    });
  }, [comparatorSearch, comparatorSectionFilter]);

  const comparatorSectionCounts = useMemo(() => {
    const counts: Record<SectionType, number> = {
      'All': 0,
      'Section 89 (Supply)': 0,
      'Section 90 (Services)': 0,
      'Section 119 (Non-Resident)': 0,
    };

    tdsData.forEach(item => {
      if (matchesComparatorQuery(item, comparatorSearch)) {
        counts['All']++;
        if (item.section in counts) {
          counts[item.section as SectionType]++;
        }
      }
    });

    return counts;
  }, [comparatorSearch]);

  // Extract unique categories for the dropdown, potentially filtered by the active Section
  const availableCategories = useMemo(() => {
    let relevantData = tdsData;
    if (activeSection !== 'All') {
      relevantData = tdsData.filter(item => item.section === activeSection);
    }
    const uniqueCategories = Array.from(new Set(relevantData.map(item => item.category)));
    return ['All', ...uniqueCategories.sort()];
  }, [activeSection]);

  // Reset category if it's no longer valid for the selected section
  useMemo(() => {
    if (activeCategory !== 'All' && !availableCategories.includes(activeCategory)) {
      setActiveCategory('All');
    }
  }, [availableCategories, activeCategory]);

  const filteredData = useMemo(() => {
    return tdsData.filter((item) => {
      const matchesSearch = 
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.subCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.rate.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSection = activeSection === 'All' || item.section === activeSection;
      
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;

      return matchesSearch && matchesSection && matchesCategory;
    });
  }, [searchQuery, activeSection, activeCategory]);

  const filteredTreaties = useMemo(() => {
    if (!treatySearch) return [];
    return treatyData.filter(t => t.country.toLowerCase().includes(treatySearch.toLowerCase()));
  }, [treatySearch]);

  const sections: SectionType[] = ['All', 'Section 89 (Supply)', 'Section 90 (Services)', 'Section 119 (Non-Resident)'];

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 transition-all ${pinnedItemIds.length > 0 ? 'pb-40 md:pb-48' : ''}`}>
      <ToolSEO
        title={
          viewMode === 'calculator'
            ? 'Quick TDS Deduction Calculator (Sections 89, 90 & 119) | Accounticca'
            : viewMode === 'treaty'
            ? 'DTAA Double Taxation Avoidance Treaty Rates | Accounticca & E-Lawyers'
            : 'Bangladesh TDS Reference Guide & Rates Database (ITA 2023) | Accounticca'
        }
        description="Comprehensive Tax Deducted at Source (TDS) rate lookup, gross-up calculator, and DTAA treaty rates under Sections 89, 90, and 119 of the Income Tax Act 2023."
        canonicalUrl="/tds-guide"
        keywords={['Bangladesh TDS Rates', 'Section 89 TDS', 'Section 90 TDS', 'Section 119 Non-Resident Tax', 'ITA 2023 TDS']}
      />
      
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-6">
          TDS Reference <span className="text-emerald-600">Guide</span>
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed">
          A comprehensive database of Tax Deducted at Source (TDS) rates covering supply contracts, corporate services, and non-resident remittances under the Income Tax Act 2023.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              setViewMode('calculator');
              const el = document.getElementById('quick-tds-calculator');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            id="hero-quick-calc-cta"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 text-xs font-bold transition-all shadow-2xs group cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span>Need to calculate tax deduction on an invoice? Open Quick TDS Calculator</span>
            <span className="text-emerald-600 font-black">→</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-slate-100 p-1.5 rounded-2xl flex-wrap justify-center gap-1.5 shadow-2xs border border-slate-200/60">
          <button
            onClick={() => setViewMode('database')}
            id="tab-btn-database"
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              viewMode === 'database' 
                ? 'bg-white text-emerald-800 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Database View
          </button>
          <button
            onClick={() => setViewMode('comparator')}
            id="tab-btn-comparator"
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              viewMode === 'comparator' 
                ? 'bg-white text-emerald-800 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            Comparator Mode
          </button>
          <button
            onClick={() => setViewMode('calculator')}
            id="tab-btn-calculator"
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              viewMode === 'calculator' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Quick TDS Calculator</span>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
              viewMode === 'calculator' ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}>
              Instant
            </span>
          </button>
          <button
            onClick={() => setViewMode('treaty')}
            id="tab-btn-treaty"
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              viewMode === 'treaty' 
                ? 'bg-white text-emerald-800 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4" />
            DTAA Treaty Finder
          </button>
        </div>
      </div>

      {/* Quick Calculator View */}
      {viewMode === 'calculator' && (
        <div className="mb-10 animate-fade-in">
          <QuickTdsCalculator
            id="quick-tds-calculator"
            initialAmount={calcInitialAmount}
            initialRate={calcInitialRate}
            initialCategory={calcInitialCategory}
            tdsCategories={tdsData}
            onSelectCategory={(id) => setCalcInitialCategory(id)}
          />
        </div>
      )}

      {viewMode === 'database' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/60 mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          
          <div className="flex flex-col sm:flex-row flex-1 gap-4 w-full md:max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="search"
                inputMode="search"
                autoComplete="off"
                placeholder="Search rates or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow text-slate-900"
              />
            </div>
            
            <div className="relative flex-1 sm:max-w-[240px]">
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow text-slate-900 appearance-none font-medium truncate"
              >
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'All' ? 'All Service Types' : cat}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400 mr-2 hidden sm:block" />
            {sections.map((section) => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === section
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {section}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <th className="py-4 px-6 font-semibold text-sm">Category & Description</th>
                <th className="py-4 px-6 font-semibold text-sm w-48">Tax Section</th>
                <th className="py-4 px-6 font-semibold text-sm text-right w-32">TDS Rate</th>
                <th className="py-4 px-6 font-semibold text-sm text-right w-44">Legal Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-900 mb-1">{item.category}</div>
                      <div className="text-sm text-slate-500 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        {item.subCategory}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                        {item.section}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-100">
                        {item.rate}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <QuickCompareToggle
                          itemId={item.id}
                          categoryName={item.category}
                          isPinned={pinnedItemIds.includes(item.id)}
                          onToggle={handleTogglePin}
                          showLabel={false}
                          className="bg-slate-100 px-2 py-1 rounded-lg border border-slate-200"
                        />
                        <button
                          onClick={() => handleLaunchCalculatorWithItem(item)}
                          id={`db-calc-${item.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-xl text-xs transition-colors shadow-2xs"
                          title={`Calculate TDS deduction for ${item.category} (${item.rate})`}
                        >
                          <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Calc</span>
                        </button>
                        <button
                          onClick={() => setSelectedItemForDetails(item)}
                          id={`db-expand-details-${item.id}`}
                          className="expand-details-btn inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 font-bold rounded-xl text-xs transition-colors shadow-2xs"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Expand Details</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500">
                    No matching TDS rates found for "{searchQuery}". Try adjusting your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <BookOpen className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-600">
            <strong>Note:</strong> These rates are applicable according to the Income Tax Act 2023. Double Taxation Avoidance Agreements (DTAA) may provide reduced rates for Section 119 payments if the payee submits a valid Tax Residency Certificate (TRC).
          </p>
        </div>
      </div>
      )}

      {/* Comparator Section */}
      <section 
        id="tds-comparator-section" 
        className={`bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-slate-200/60 mb-10 transition-all ${viewMode === 'comparator' ? 'block' : 'hidden'}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Side-by-Side TDS Rate Comparison</h2>
            <p className="text-sm text-slate-500 mt-1">
              Select two TDS categories to contrast statutory rates, or expand full legal details for each item.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
              <Scale className="w-4 h-4 text-emerald-600" />
              <span>Income Tax Act 2023</span>
            </span>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 relative">
          
          {/* Visual Divider on Desktop */}
          <div className="hidden md:block absolute left-1/2 top-12 bottom-0 w-px bg-slate-200 -translate-x-1/2">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-2 text-slate-400 border border-slate-200 rounded-full shadow-xs">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>

          {/* Column 1 */}
          <div className="space-y-6">
            <div>
              <TdsSearchableSelect
                id="compare-slot-1-select"
                label="Select Item 1"
                slotName="Slot 1"
                items={tdsData}
                selectedId={compareId1}
                onSelect={(id) => setCompareId1(id)}
                sections={comparatorSections}
              />
            </div>

            {compareItem1 && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider text-emerald-800 uppercase bg-emerald-100 rounded-full">
                      {compareItem1.section}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Slot 1</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{compareItem1.category}</h3>
                  <p className="text-slate-600 mb-6 text-sm">{compareItem1.subCategory}</p>
                  
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex justify-between items-center mb-6">
                    <span className="text-sm font-medium text-slate-500">Applicable Rate</span>
                    <span className="text-3xl font-black text-emerald-600">{compareItem1.rate}</span>
                  </div>
                </div>

                {/* Expand Details Button, Calc TDS & Quick-Compare Toggle on compareItem1 */}
                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedItemForDetails(compareItem1)}
                      id={`expand-details-${compareItem1.id}`}
                      className="expand-details-btn inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-xs"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Expand Details</span>
                    </button>
                    <button
                      onClick={() => handleLaunchCalculatorWithItem(compareItem1)}
                      id="calc-slot-1-btn"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-100/70 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold rounded-xl text-xs sm:text-sm transition-all"
                      title="Quick calculate TDS using this rate"
                    >
                      <Calculator className="w-4 h-4 text-emerald-700" />
                      <span>Calc TDS</span>
                    </button>
                  </div>
                  <QuickCompareToggle
                    itemId={compareItem1.id}
                    categoryName={compareItem1.category}
                    isPinned={pinnedItemIds.includes(compareItem1.id)}
                    onToggle={handleTogglePin}
                    className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Column 2 */}
          <div className="space-y-6">
            <div>
              <TdsSearchableSelect
                id="compare-slot-2-select"
                label="Select Item 2"
                slotName="Slot 2"
                items={tdsData}
                selectedId={compareId2}
                onSelect={(id) => setCompareId2(id)}
                sections={comparatorSections}
              />
            </div>

            {compareItem2 && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-400"></div>
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider text-slate-700 uppercase bg-slate-200 rounded-full">
                      {compareItem2.section}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Slot 2</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{compareItem2.category}</h3>
                  <p className="text-slate-600 mb-6 text-sm">{compareItem2.subCategory}</p>
                  
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex justify-between items-center mb-6">
                    <span className="text-sm font-medium text-slate-500">Applicable Rate</span>
                    <span className="text-3xl font-black text-slate-700">{compareItem2.rate}</span>
                  </div>
                </div>

                {/* Expand Details Button, Calc TDS & Quick-Compare Toggle on compareItem2 */}
                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedItemForDetails(compareItem2)}
                      id={`expand-details-${compareItem2.id}`}
                      className="expand-details-btn inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-xs"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Expand Details</span>
                    </button>
                    <button
                      onClick={() => handleLaunchCalculatorWithItem(compareItem2)}
                      id="calc-slot-2-btn"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-900 border border-slate-300 font-bold rounded-xl text-xs sm:text-sm transition-all"
                      title="Quick calculate TDS using this rate"
                    >
                      <Calculator className="w-4 h-4 text-slate-700" />
                      <span>Calc TDS</span>
                    </button>
                  </div>
                  <QuickCompareToggle
                    itemId={compareItem2.id}
                    categoryName={compareItem2.category}
                    isPinned={pinnedItemIds.includes(compareItem2.id)}
                    onToggle={handleTogglePin}
                    className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs"
                  />
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Directory of All TDS Category Items inside Comparator Section */}
        <div id="tds-comparator-category-items" className="mt-14 pt-10 border-t border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
                <Scale className="w-3.5 h-3.5 text-emerald-600" />
                <span>Section 89 • Section 90 • Section 119</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                All TDS Category Items & Statutory Slabs
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
                Click <strong className="text-emerald-700">"Expand Details"</strong> on any category item to open the slide-out drawer with official legal source text, effective dates, and reference circular numbers.
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-2">
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-xl">
                {filteredComparatorItems.length} Categories Listed
              </span>
            </div>
          </div>

          {/* Real-time Search and Section Filters with Keyboard Shortcut and Presets */}
          <TdsComparatorSearchFilter
            searchQuery={comparatorSearch}
            onSearchChange={setComparatorSearch}
            activeSection={comparatorSectionFilter}
            onSectionChange={setComparatorSectionFilter}
            sections={comparatorSections}
            totalCount={tdsData.length}
            filteredCount={filteredComparatorItems.length}
            sectionCounts={comparatorSectionCounts}
            onReset={() => {
              setComparatorSearch('');
              setComparatorSectionFilter('All');
            }}
          />

          {/* Category Item Cards Grid or Empty Search State */}
          {filteredComparatorItems.length === 0 ? (
            <div className="text-center py-16 px-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 border border-amber-200/60 shadow-xs">
                <SearchX className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1">
                No matching TDS categories found
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
                No categories matched your search for &ldquo;<span className="font-bold text-slate-800">{comparatorSearch}</span>&rdquo; {comparatorSectionFilter !== 'All' ? `under ${comparatorSectionFilter}` : ''}. Try clearing filters or searching for keywords like <span className="font-semibold text-emerald-700">&quot;89&quot;</span>, <span className="font-semibold text-emerald-700">&quot;consultancy&quot;</span>, or <span className="font-semibold text-emerald-700">&quot;5%&quot;</span>.
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  id="tds-comparator-empty-reset-btn"
                  onClick={() => {
                    setComparatorSearch('');
                    setComparatorSectionFilter('All');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Search &amp; Show All Categories</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredComparatorItems.map((item) => {
                const isPinned = pinnedItemIds.includes(item.id);
                return (
                  <div 
                    key={item.id}
                    id={`comparator-item-${item.id}`}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between group ${
                      isPinned
                        ? 'bg-emerald-50/50 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs">
                          <HighlightText text={item.section} query={comparatorSearch} />
                        </span>
                        <span className="font-mono text-xs font-black text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                          <HighlightText text={item.rate} query={comparatorSearch} />
                        </span>
                      </div>

                      {/* Quick-Compare Toggle Row */}
                      <div className="flex items-center justify-between py-1.5 px-2.5 my-2.5 rounded-xl bg-white/90 border border-slate-200/80 shadow-2xs">
                        <QuickCompareToggle
                          itemId={item.id}
                          categoryName={item.category}
                          isPinned={isPinned}
                          onToggle={handleTogglePin}
                        />
                        {isPinned && (
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            In Tray
                          </span>
                        )}
                      </div>

                      <h4 className="font-extrabold text-sm text-slate-900 leading-snug group-hover:text-emerald-950 transition-colors">
                        <HighlightText text={item.category} query={comparatorSearch} />
                      </h4>
                      <p className="text-xs text-slate-500 mt-2 flex items-start gap-1.5 leading-relaxed">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span><HighlightText text={item.subCategory} query={comparatorSearch} /></span>
                      </p>
                    </div>

                    <div className="mt-5 pt-3.5 border-t border-slate-200/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedItemForDetails(item)}
                          id={`expand-details-${item.id}`}
                          className="expand-details-btn inline-flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
                          title="Expand legal source text, effective dates, and reference circulars"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </button>
                        <button
                          onClick={() => handleLaunchCalculatorWithItem(item)}
                          id={`calc-item-${item.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-xl text-xs transition-colors"
                          title={`Calculate TDS with ${item.rate}`}
                        >
                          <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Calc</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setCompareId1(item.id);
                            const el = document.getElementById('tds-comparator-section');
                            el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }}
                          id={`compare-slot-1-${item.id}`}
                          className="px-2.5 py-1.5 text-xs font-semibold bg-white hover:bg-slate-200/80 text-slate-700 border border-slate-200 rounded-lg transition-colors"
                          title="Load this into Slot 1 of side-by-side comparison"
                        >
                          Slot 1
                        </button>
                        <button
                          onClick={() => {
                            setCompareId2(item.id);
                            const el = document.getElementById('tds-comparator-section');
                            el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }}
                          id={`compare-slot-2-${item.id}`}
                          className="px-2.5 py-1.5 text-xs font-semibold bg-white hover:bg-slate-200/80 text-slate-700 border border-slate-200 rounded-lg transition-colors"
                          title="Load this into Slot 2 of side-by-side comparison"
                        >
                          Slot 2
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {viewMode === 'treaty' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/60 mb-10">
          <div className="flex flex-col md:items-center justify-between gap-6 mb-8">
            <div className="relative w-full max-w-xl mx-auto">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="search"
                inputMode="search"
                autoComplete="off"
                placeholder="Search country name (e.g. United Kingdom, Singapore)..."
                value={treatySearch}
                onChange={(e) => setTreatySearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow text-slate-900"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <th className="py-4 px-6 font-semibold text-sm">Partner Country</th>
                  <th className="py-4 px-6 font-semibold text-sm">Dividend</th>
                  <th className="py-4 px-6 font-semibold text-sm">Interest</th>
                  <th className="py-4 px-6 font-semibold text-sm">Royalty</th>
                  <th className="py-4 px-6 font-semibold text-sm">Technical Fees</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTreaties.length > 0 ? (
                  filteredTreaties.map((treaty, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {treaty.country}
                      </td>
                      <td className="py-4 px-6 font-medium text-emerald-700">{treaty.dividend}</td>
                      <td className="py-4 px-6 font-medium text-slate-700">{treaty.interest}</td>
                      <td className="py-4 px-6 font-medium text-slate-700">{treaty.royalty}</td>
                      <td className="py-4 px-6 font-medium text-slate-700">{treaty.technical}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      {treatySearch 
                        ? `No Double Taxation Avoidance Agreement (DTAA) records found for "${treatySearch}".`
                        : "Type a country name in the search bar above to view reduced DTAA rates."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <BookOpen className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-600">
              <strong>Note:</strong> To avail these reduced rates under Section 119, the non-resident payee must provide a valid Tax Residency Certificate (TRC) from their home country's tax authority.
            </p>
          </div>
        </div>
      )}

      {/* Slide-out Drawer for TDS Legal Source Text, Effective Dates, and Reference Circular Numbers */}
      <TdsDetailsDrawer
        isOpen={!!selectedItemForDetails}
        onClose={() => setSelectedItemForDetails(null)}
        item={selectedItemForDetails}
      />

      {/* Sticky Comparison Tray for Pinned TDS Categories */}
      <TdsComparisonTray
        pinnedItems={pinnedItems}
        onUnpin={handleTogglePin}
        onClearAll={() => setPinnedItemIds([])}
        onLoadIntoSlots={handleLoadIntoSlots}
        onExpandDetails={(item) => setSelectedItemForDetails(item)}
      />

    </div>
  );
}
