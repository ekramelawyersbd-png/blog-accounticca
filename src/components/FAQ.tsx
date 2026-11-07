import { useState, useRef, useEffect, useId } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronDown, 
  Search, 
  X, 
  HelpCircle, 
  Receipt, 
  Building2, 
  ShieldCheck, 
  FileText, 
  ExternalLink,
  Copy,
  Check,
  Briefcase,
  ArrowRight
} from 'lucide-react';

export interface FAQItem {
  id: string;
  category: 'tax' | 'vat' | 'corporate' | 'compliance' | 'general';
  categoryLabel: string;
  question: string;
  answer: string;
  reference?: string;
  tags?: string[];
}

export const FAQ_DATA: FAQItem[] = [
  {
    id: 'faq-tax-filing-requirement',
    category: 'tax',
    categoryLabel: 'Income Tax',
    question: 'Who is required to submit an annual income tax return in Bangladesh?',
    answer: 'Under Section 166 of the Income Tax Act 2023, submitting an income tax return is mandatory if your total income exceeds the minimum tax-free threshold, or if you meet specific criteria regardless of income. This includes: all TIN holders (unless specifically exempted), registered professionals (lawyers, doctors, chartered accountants, cost and management accountants), trade license holders, company directors or shareholders, owners of motor vehicles, and anyone requiring Proof of Submission of Return (PSR) to access 43+ statutory services.',
    reference: 'Income Tax Act 2023, Section 166 & Sixth Schedule',
    tags: ['PSR', 'TIN', 'Tax Return', 'Section 166']
  },
  {
    id: 'faq-tax-slabs-threshold',
    category: 'tax',
    categoryLabel: 'Income Tax',
    question: 'What is the tax-free income ceiling for individuals in the current assessment year?',
    answer: 'For individual taxpayers, the baseline tax-free ceiling is BDT 350,000. Special categories receive higher exemption thresholds: female taxpayers and senior citizens aged 65 or above enjoy a ceiling of BDT 400,000; physically challenged persons receive BDT 475,000; gazetted war-wounded freedom fighters receive BDT 500,000; and parents/legal guardians of physically disabled children receive an additional BDT 50,000 threshold per child.',
    reference: 'Finance Act & NBR Circular 2024-25',
    tags: ['Tax Slabs', 'Exemption', 'Individual Tax']
  },
  {
    id: 'faq-tax-rebate-investment',
    category: 'tax',
    categoryLabel: 'Income Tax',
    question: 'What allowable investments qualify for personal income tax rebates?',
    answer: 'Taxpayers can claim a rebate on eligible investments under the Sixth Schedule (Part 3) of the Income Tax Act 2023. Eligible avenues include: Life insurance premiums, Government Treasury Bonds, approved deposit pension schemes (DPS up to statutory limit), benevolent funds and group insurance, approved charitable donations, and investments in stocks listed on DSE/CSE through secondary trading. The rebate is calculated as a percentage (typically 15% on allowable investment or 3% of total taxable income, whichever is lower).',
    reference: 'Income Tax Act 2023, Sixth Schedule (Part 3)',
    tags: ['Rebate', 'DPS', 'Insurance', 'Investments']
  },
  {
    id: 'faq-vat-bin-registration',
    category: 'vat',
    categoryLabel: 'VAT & Customs',
    question: 'When is a business legally mandated to register for a 13-digit VAT BIN?',
    answer: 'Under the Value Added Tax and Supplementary Duty Act 2012, businesses with annual turnover exceeding BDT 3 Crore (30 Million) must register for a standard 13-digit Business Identification Number (BIN). Businesses with turnover between BDT 50 Lakhs and BDT 3 Crore are eligible for turnover tax (4%). However, certain businesses—such as manufacturers, importers, exporters, government contractors, and specific commercial service providers—must obtain a VAT BIN regardless of turnover threshold.',
    reference: 'VAT & SD Act 2012, Section 4 & Section 9',
    tags: ['VAT BIN', 'Turnover Tax', 'NBR VAT']
  },
  {
    id: 'faq-vat-withholding-vds',
    category: 'vat',
    categoryLabel: 'VAT & Customs',
    question: 'What is VAT Deducted at Source (VDS) and who is responsible for withholding?',
    answer: 'VAT Deducted at Source (VDS) is mandatory deduction by withholding entities when procuring designated goods or services. Withholding entities include government bodies, semi-autonomous authorities, NGOs, banks, insurance companies, and limited companies. Under Mushak rules, withholding entities must issue Mushak 6.6 certificates to vendors within statutory deadlines and deposit the deducted sum into the government treasury via e-Challan.',
    reference: 'Mushak Withholding Rules (SRO No. 186/2023)',
    tags: ['VDS', 'Mushak 6.6', 'Treasury Deposit']
  },
  {
    id: 'faq-rjsc-company-formation',
    category: 'corporate',
    categoryLabel: 'Corporate & RJSC',
    question: 'What are the essential steps and statutory requirements to incorporate a Private Limited Company in Bangladesh?',
    answer: 'Company formation under the Companies Act 1994 involves: (1) Name Clearance certificate from the Registrar of Joint Stock Companies and Firms (RJSC); (2) Drafting the Memorandum of Association (MoA) and Articles of Association (AoA); (3) For foreign shareholders, opening an encashment bank account and obtaining Inward Remittance Certificate; (4) Digital submission of Form I, VI, IX, X, and XII on RJSC portal; (5) Payment of statutory stamp duty and registration fees; and (6) Issuance of Certificate of Incorporation with digital certified copies.',
    reference: 'The Companies Act 1994 & RJSC Regulations',
    tags: ['RJSC', 'Private Limited', 'MoA & AoA', 'Incorporation']
  },
  {
    id: 'faq-foreign-ownership',
    category: 'corporate',
    categoryLabel: 'Corporate & RJSC',
    question: 'Can foreign investors or non-residents own 100% equity in a Bangladeshi company?',
    answer: 'Yes, Bangladesh maintains a liberal foreign investment policy. In most industrial and commercial sectors, 100% foreign equity ownership is permitted without requiring prior government permission. The 4 restricted sectors reserved exclusively for the state are: defense weaponry, nuclear energy, forest plantation/mechanized extraction in reserved forests, and security printing/minting. Foreign entities must register with BIDA (Bangladesh Investment Development Authority) and route capital through formal banking channels.',
    reference: 'Foreign Private Investment (Promotion and Protection) Act 1980',
    tags: ['Foreign Equity', 'BIDA', 'FDI', 'Remittance']
  },
  {
    id: 'faq-trade-license-renewal',
    category: 'compliance',
    categoryLabel: 'Compliance',
    question: 'What is the validity and renewal procedure for a City Corporation Trade License?',
    answer: 'Trade licenses are issued under the Local Government (City Corporation) Act 2009. Historically renewed annually by June 30th, businesses in Dhaka (DNCC & DSCC) and other major city corporations can now also apply for multi-year trade licenses (up to 5 years). Renewals require payment of local tax, sign-board fee, source tax (AIT), and submitting the previous license copy and current premises rent deed/holding tax receipt.',
    reference: 'City Corporation Ideal Tax Schedule',
    tags: ['Trade License', 'City Corporation', 'DNCC', 'DSCC']
  },
  {
    id: 'faq-tds-consequences',
    category: 'tax',
    categoryLabel: 'Income Tax',
    question: 'What are the legal consequences of failing to deduct or deposit Tax at Source (TDS)?',
    answer: 'Under Section 143 of the Income Tax Act 2023, failure to deduct or deposit TDS makes the withholding agent personally liable as an "assessee-in-default". In addition to paying the unpaid tax, the entity is penalized with a statutory interest of 2% per month. Furthermore, expenses on which TDS was required but not deducted are fully disallowed as deductible business expenses under Section 55, resulting in heavily inflated corporate tax liability.',
    reference: 'Income Tax Act 2023, Section 55 & Section 143',
    tags: ['TDS', 'Penalty', 'Expense Disallowance']
  },
  {
    id: 'faq-contract-stamp-duty',
    category: 'general',
    categoryLabel: 'Contracts & Legal Docs',
    question: 'Why must commercial contracts and agreements be printed on non-judicial stamp paper?',
    answer: 'Under the Stamp Act 1899, agreements, power of attorneys, leases, and contracts must bear appropriate non-judicial adhesive or impressed stamp duty to be legally enforceable and admissible as evidence in a court of law. Contracts executed on unstamped or insufficiently stamped paper cannot be impounded as direct evidence until deficit duty plus a penalty (often up to 10 times the duty) is paid.',
    reference: 'The Stamp Act 1899, Section 35 & Schedule I',
    tags: ['Stamp Duty', 'Contract Admissibility', 'Enforceability']
  }
];

type CategoryFilter = 'all' | 'tax' | 'vat' | 'corporate' | 'compliance' | 'general';

interface FAQProps {
  initialOpenCount?: number;
  showCategoryFilters?: boolean;
  showSearchBar?: boolean;
  className?: string;
}

export function FAQ({
  showCategoryFilters = true,
  showSearchBar = true,
  className = ''
}: FAQProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['faq-tax-filing-requirement']));
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const componentId = useId();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const headerButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Filter items
  const filteredFAQs = FAQ_DATA.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesCategory;

    const matchesQuery = 
      item.question.toLowerCase().includes(query) ||
      item.answer.toLowerCase().includes(query) ||
      item.reference?.toLowerCase().includes(query) ||
      item.tags?.some(tag => tag.toLowerCase().includes(query));

    return matchesCategory && matchesQuery;
  });

  const toggleItem = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(filteredFAQs.map(f => f.id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const copyAnswer = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
    }
  };

  // Keyboard navigation across accordion headers (WAI-ARIA pattern)
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const total = filteredFAQs.length;
    if (total === 0) return;

    let targetIndex = -1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        targetIndex = (index + 1) % total;
        break;
      case 'ArrowUp':
        e.preventDefault();
        targetIndex = (index - 1 + total) % total;
        break;
      case 'Home':
        e.preventDefault();
        targetIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        targetIndex = total - 1;
        break;
      default:
        return;
    }

    if (targetIndex >= 0 && headerButtonRefs.current[targetIndex]) {
      headerButtonRefs.current[targetIndex]?.focus();
    }
  };

  // Reset button refs array when items change
  useEffect(() => {
    headerButtonRefs.current = headerButtonRefs.current.slice(0, filteredFAQs.length);
  }, [filteredFAQs.length]);

  const categories: { key: CategoryFilter; label: string; icon: typeof Receipt }[] = [
    { key: 'all', label: 'All Queries', icon: HelpCircle },
    { key: 'tax', label: 'Income Tax', icon: Receipt },
    { key: 'vat', label: 'VAT & Customs', icon: ShieldCheck },
    { key: 'corporate', label: 'Corporate & RJSC', icon: Building2 },
    { key: 'compliance', label: 'Compliance', icon: Briefcase },
    { key: 'general', label: 'Contracts & Legal', icon: FileText },
  ];

  return (
    <section 
      id="faq-section" 
      className={`w-full py-16 px-4 sm:px-6 lg:px-8 bg-slate-50 border-t border-slate-200/80 ${className}`}
      aria-labelledby="faq-main-heading"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header Block */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 bg-emerald-100/80 text-emerald-800 text-xs font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4 border border-emerald-200/60">
            <HelpCircle className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            <span>Knowledge Base & FAQs</span>
          </div>
          <h2 
            id="faq-main-heading" 
            className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight"
          >
            Frequently Asked Legal & Tax Questions
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mt-3 font-medium">
            Clear, authoritative answers to statutory questions regarding Bangladesh Income Tax Act 2023, VAT, company registration, and business compliance.
          </p>
        </div>

        {/* Interactive Filter & Search Controls */}
        <div className="space-y-4 mb-8">
          {/* Search bar */}
          {showSearchBar && (
            <div className="relative max-w-2xl mx-auto">
              <label htmlFor={`${componentId}-search`} className="sr-only">
                Search frequently asked questions
              </label>
              <div className="relative flex items-center">
                <Search 
                  className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" 
                  aria-hidden="true" 
                />
                <input
                  id={`${componentId}-search`}
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by keywords (e.g. PSR, BIN, exemption, rebate, RJSC)..."
                  className="w-full bg-white border border-slate-300 hover:border-slate-400 focus:border-emerald-600 rounded-2xl py-3.5 pl-12 pr-12 text-slate-900 placeholder:text-slate-400 text-sm sm:text-base font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/15 shadow-sm transition-all"
                  aria-describedby={`${componentId}-search-count`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-3.5 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg focus-visible:ring-2 focus-visible:ring-emerald-500"
                    aria-label="Clear search query"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Category Filter Tabs */}
          {showCategoryFilters && (
            <div 
              role="tablist" 
              aria-label="Filter FAQ by legal categories"
              className="flex items-center justify-center flex-wrap gap-2 pt-2"
            >
              {categories.map((cat) => {
                const isSelected = activeCategory === cat.key;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.key}
                    role="tab"
                    id={`${componentId}-tab-${cat.key}`}
                    aria-selected={isSelected}
                    aria-controls={`${componentId}-faq-list`}
                    onClick={() => setActiveCategory(cat.key)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                      isSelected
                        ? 'bg-emerald-700 text-white shadow-md'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-200' : 'text-slate-500'}`} aria-hidden="true" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Results Summary & Expand/Collapse Controls */}
          <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600 px-1 pt-1">
            <div 
              id={`${componentId}-search-count`} 
              aria-live="polite" 
              className="font-medium text-slate-500"
            >
              Showing <span className="font-bold text-slate-900">{filteredFAQs.length}</span> {filteredFAQs.length === 1 ? 'question' : 'questions'}
              {searchQuery && (
                <span> for &ldquo;<span className="text-emerald-700 font-semibold">{searchQuery}</span>&rdquo;</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={expandAll}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-1"
              >
                Expand All
              </button>
              <span className="text-slate-300" aria-hidden="true">|</span>
              <button
                type="button"
                onClick={collapseAll}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-1"
              >
                Collapse All
              </button>
            </div>
          </div>
        </div>

        {/* Accordion Container */}
        <div 
          id={`${componentId}-faq-list`}
          className="space-y-3"
          role="region"
          aria-label="Frequently Asked Questions List"
        >
          {filteredFAQs.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-sm">
              <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" aria-hidden="true" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">No matching questions found</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                We couldn&apos;t find any questions matching your query. Would you like to consult our legal &amp; tax team directly?
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('all');
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Reset Filters
                </button>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors"
                >
                  <span>Ask an Expert</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            filteredFAQs.map((faq, index) => {
              const isExpanded = expandedIds.has(faq.id);
              const headerId = `${componentId}-header-${faq.id}`;
              const panelId = `${componentId}-panel-${faq.id}`;
              const isCopied = copiedId === faq.id;

              return (
                <div
                  key={faq.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isExpanded 
                      ? 'border-emerald-300/80 shadow-md ring-1 ring-emerald-500/20' 
                      : 'border-slate-200/90 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <h3>
                    <button
                      ref={(el) => {
                        headerButtonRefs.current[index] = el;
                      }}
                      id={headerId}
                      type="button"
                      aria-expanded={isExpanded}
                      aria-controls={panelId}
                      onClick={() => toggleItem(faq.id)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      className="w-full flex items-start justify-between gap-4 p-5 sm:p-6 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-inset"
                    >
                      <div className="space-y-1.5 flex-1 pr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/50">
                            {faq.categoryLabel}
                          </span>
                          {faq.reference && (
                            <span className="text-[11px] font-semibold text-slate-600 hidden sm:inline-block">
                              Ref: {faq.reference}
                            </span>
                          )}
                        </div>
                        <span className="block text-base sm:text-lg font-bold text-slate-900 leading-snug">
                          {faq.question}
                        </span>
                      </div>

                      <div 
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 mt-0.5 ${
                          isExpanded ? 'bg-emerald-100 text-emerald-700 rotate-180' : 'bg-slate-100 text-slate-500'
                        }`}
                        aria-hidden="true"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </button>
                  </h3>

                  {/* Accessible Collapsible Content Panel */}
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={headerId}
                    hidden={!isExpanded}
                    className={`px-5 pb-5 sm:px-6 sm:pb-6 text-slate-700 text-sm sm:text-base leading-relaxed border-t border-slate-100 bg-slate-50/50 ${
                      !isExpanded ? 'hidden' : 'block'
                    }`}
                  >
                    <div className="pt-4">
                      <p className="font-normal text-slate-700">
                        {faq.answer}
                      </p>

                      {faq.reference && (
                        <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between flex-wrap gap-2 text-xs">
                          <div className="text-slate-500 font-medium">
                            <strong className="text-slate-700 font-semibold">Statutory Reference:</strong> {faq.reference}
                          </div>

                          <button
                            type="button"
                            onClick={() => copyAnswer(faq.id, `${faq.question}\n\n${faq.answer}\nReference: ${faq.reference || 'E-Lawyers BD'}`)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-700 py-1 px-2.5 rounded-lg bg-white border border-slate-200 hover:border-emerald-200 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500"
                            aria-label={`Copy answer to: ${faq.question}`}
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                                <span className="text-emerald-700">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                                <span>Copy Answer</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {faq.tags && faq.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap mt-3" aria-label="Tags">
                          {faq.tags.map((tag) => (
                            <span 
                              key={tag} 
                              className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Need Personal Consultation Banner */}
        <div className="mt-12 bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl border border-emerald-800/40">
          <div className="space-y-1.5 text-center sm:text-left">
            <h3 className="text-xl font-bold text-white tracking-tight">
              Have a specific question not covered here?
            </h3>
            <p className="text-sm text-emerald-200/80 max-w-xl">
              Get personalized legal advice or tax filing support tailored to your unique corporate or individual requirements.
            </p>
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-6 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20 shrink-0 transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
          >
            <span>Book Consultation</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
