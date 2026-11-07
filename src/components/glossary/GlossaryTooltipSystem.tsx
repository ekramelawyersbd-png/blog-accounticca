import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Scale, 
  BookOpen, 
  Volume2, 
  VolumeX, 
  ExternalLink, 
  X, 
  Pin, 
  Sparkles, 
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react';
import { glossaryTerms, GlossaryTerm } from '../../data/glossaryData';

// Additional high-frequency legal & accounting terms in Bangladesh tax/corporate articles
const SUPPLEMENTARY_GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    id: 'rjsc',
    term: 'RJSC (Registrar of Joint Stock Companies and Firms)',
    shortTerm: 'RJSC',
    bengaliTerm: 'যৌথ মূলধন কোম্পানি ও ফার্মসমূহের পরিদপ্তর',
    category: 'corporate',
    categoryLabel: 'Companies Act, 1994',
    summary: 'The sole statutory authority in Bangladesh responsible for incorporating companies, registering partnerships and societies, and maintaining statutory corporate filings under the Companies Act, 1994.',
    actReference: 'Companies Act, 1994 — Part II & Registration Rules',
    keyProvisions: [
      'Administers name clearance, incorporation certificates, and Memorandum & Articles of Association (MoA/AoA).',
      'Receives mandatory annual returns (Schedule X), audited balance sheets, and Form XII (directors particulars).',
      'Approves share transfers (Form 117), capital increases, and creation/modification of charges (mortgages).'
    ],
    ratesOrLimits: 'Registration fees scale by Authorized Capital; Annual filing due within 21 days of AGM.',
    relatedTerms: ['tin', 'bin', 'dvc'],
    tags: ['rjsc', 'registrar of joint stock companies', 'company registration', 'schedule x', 'form xii']
  },
  {
    id: 'nbr',
    term: 'NBR (National Board of Revenue)',
    shortTerm: 'NBR',
    bengaliTerm: 'জাতীয় রাজস্ব বোর্ড',
    category: 'compliance',
    categoryLabel: 'Tax & Customs Administration',
    summary: 'The central apex authority for tax administration in Bangladesh under the Internal Resources Division (IRD) of the Ministry of Finance, responsible for formulating and enforcing Income Tax, VAT, and Customs laws.',
    actReference: 'National Board of Revenue Order, 1972 (President’s Order No. 76 of 1972) & Income Tax Act, 2023',
    keyProvisions: [
      'Issues Statutory Regulatory Orders (SROs), general orders, and official tax circulars/clarifications.',
      'Administers e-TIN, e-Return, and online VAT (IVAS) portals across Bangladesh.',
      'Conducts tax audits, appellate proceedings, and revenue collection.'
    ],
    relatedTerms: ['sro', 'tds', 'vat', 'tin'],
    tags: ['nbr', 'national board of revenue', 'tax authority']
  },
  {
    id: 'a-challan',
    term: 'A-Challan / e-Challan (Automated Treasury Challan)',
    shortTerm: 'A-Challan',
    bengaliTerm: 'এ-চালান / অটোমেটেড ট্রেজারি চালান',
    category: 'compliance',
    categoryLabel: 'Treasury Deposit System',
    summary: 'The automated electronic government treasury payment portal used by taxpayers and withholding entities to deposit Income Tax, TDS, VAT, VDS, and government fees directly into Bangladesh Bank / Sonali Bank accounts.',
    actReference: 'Income Tax Act, 2023 — Section 140 & Treasury Rules',
    keyProvisions: [
      'Allows instant online tax payment via mobile financial services (bKash, Nagad), cards, or RTGS/internet banking.',
      'Generates a verifiable Challan number required for claiming tax credit and filing quarterly TDS returns.',
      'Mandatory for depositing source tax within 2 weeks of deduction.'
    ],
    relatedTerms: ['tds', 'vds', 'ait', 'psr'],
    tags: ['a-challan', 'e-challan', 'treasury challan', 'automated challan']
  },
  {
    id: 'input-tax-credit',
    term: 'Input Tax Credit (উপকরণ কর রেয়াত)',
    shortTerm: 'Input Tax Credit',
    bengaliTerm: 'উপকরণ কর রেয়াত',
    category: 'vat',
    categoryLabel: 'VAT & SD Act, 2012',
    summary: 'A mechanism under the VAT Act allowing a registered business paying standard 15% VAT to offset the VAT paid on eligible business purchases (inputs) against the Output VAT collected on sales.',
    actReference: 'Value Added Tax and Supplementary Duty Act, 2012 — Section 46',
    keyProvisions: [
      'Only available to businesses paying the standard 15% output VAT rate (not available under truncated rates or 4% turnover tax).',
      'Requires a valid Mushak-6.3 Tax Invoice from the supplier and payment through banking channels for transactions ≥ BDT 100,000.',
      'Input-Output Coefficient (Mushak-4.3) must be declared and filed with the VAT Commissionerate.'
    ],
    ratesOrLimits: 'Must be claimed within 4 tax periods (4 months) of invoice date.',
    relatedTerms: ['vat', 'mushak-6-3', 'mushak-9-1'],
    tags: ['input tax credit', 'input vat', 'mushak 4.3', 'section 46 vat']
  },
  {
    id: 'capital-gains',
    term: 'Capital Gains (মূলধনী আয়)',
    shortTerm: 'Capital Gains',
    bengaliTerm: 'মূলধনী আয় (ধারা ৫৭)',
    category: 'income-tax',
    categoryLabel: 'Income Tax Act, 2023',
    summary: 'Profits or gains arising from the transfer, sale, exchange, or relinquishment of a capital asset (such as land, buildings, shares, securities, or business machinery).',
    actReference: 'Income Tax Act, 2023 — Chapter VI, Sections 57 to 61',
    keyProvisions: [
      'Computed by deducting allowable cost of acquisition, capital improvements, and transfer expenses from the higher of sale price or fair market value.',
      'Capital gains from listed shares for individual taxpayers exceeding BDT 50 Lakh in an income year are subject to tax.',
      'Property transfer source tax (Section 125) often operates as final/minimum tax liability on real estate gains.'
    ],
    ratesOrLimits: 'Companies: 15% flat rate; Individuals: standard slab rate if held ≤ 5 years, or max 15% if held > 5 years.',
    relatedTerms: ['tds', 'minimum-tax'],
    tags: ['capital gains', 'capital gain', 'capital asset']
  },
  {
    id: 'net-wealth-surcharge',
    term: 'Net Wealth Surcharge (নীট সম্পদ সারচার্জ)',
    shortTerm: 'Wealth Surcharge',
    bengaliTerm: 'নীট সম্পদ সারচার্জ',
    category: 'income-tax',
    categoryLabel: 'Finance Act & ITA 2023',
    summary: 'An additional progressive surcharge levied on top of an individual taxpayer’s regular income tax liability when their total net wealth declared in Form IT-10B exceeds BDT 4 Crore (40 Million) or specific asset ownership criteria.',
    actReference: 'Finance Act, 2026 & Income Tax Act, 2023 — Section 164',
    keyProvisions: [
      'Triggered when net wealth exceeds BDT 4 Crore, or if the taxpayer owns more than one motor car or house property exceeding 8,000 sq. ft.',
      'Calculated as a percentage (10% to 35%) of the net income tax payable, NOT a percentage of total wealth.',
      'Environmental surcharge also applies for multiple combustion-engine motor vehicles.'
    ],
    ratesOrLimits: '0% up to BDT 4 Cr; 10% (4–10 Cr); 20% (10–20 Cr); 30% (20–50 Cr); 35% (>50 Cr).',
    relatedTerms: ['universal-self-assessment', 'psr'],
    tags: ['wealth surcharge', 'net wealth surcharge', 'it-10b', 'surcharge']
  },
  {
    id: 'perquisites',
    term: 'Perquisites (সুযোগ-সুবিধা / পারকুইজিট)',
    shortTerm: 'Perquisites',
    bengaliTerm: 'পারকুইজিট ও ভাতা (ধারা ৩২)',
    category: 'income-tax',
    categoryLabel: 'Income Tax Act, 2023',
    summary: 'Non-cash benefits, incentives, or monetary allowances provided by an employer to an employee in addition to basic salary (such as housing, conveyance, medical, utilities, or domestic staff).',
    actReference: 'Income Tax Act, 2023 — Sections 32 & 55',
    keyProvisions: [
      'For employees: One-third (1/3) of gross salary or BDT 450,000 (whichever is lower) is exempt from salary tax under the single consolidated deduction rule.',
      'For employers: Perquisites exceeding BDT 1,000,000 per employee (or BDT 2,500,000 for disabled employees) are disallowed as corporate business expense under Section 55.'
    ],
    ratesOrLimits: 'Employer disallowance cap: BDT 10 Lakh per employee per year.',
    relatedTerms: ['tds', 'sixth-schedule'],
    tags: ['perquisites', 'perquisite', 'allowances', 'salary tax']
  },
  {
    id: 'section-272',
    term: 'Section 272 Penalty & Hearing Rule',
    shortTerm: 'Section 272',
    bengaliTerm: 'ধারা ২৭২ (শুনানির অধিকার)',
    category: 'compliance',
    categoryLabel: 'Income Tax Act, 2023',
    summary: 'A mandatory procedural safeguard under the Income Tax Act, 2023 stating that no penalty order can be legally imposed on a taxpayer without first serving a written show-cause notice and granting a reasonable opportunity of being heard.',
    actReference: 'Income Tax Act, 2023 — Section 272',
    keyProvisions: [
      'Codifies the natural justice principle of audi alteram partem (right to a fair hearing).',
      'Any penalty imposed without prior notice and hearing is void ab initio (legally invalid) on appeal.',
      'Applies to penalties for non-filing (Sec 266), concealment of income (Sec 269), and non-compliance.'
    ],
    relatedTerms: ['universal-self-assessment', 'psr'],
    tags: ['section 272', 'show-cause notice', 'penalty order']
  },
  {
    id: 'section-46',
    term: 'Deemed Business Income (Section 46)',
    shortTerm: 'Section 46',
    bengaliTerm: 'গণ্য ব্যবসায়িক আয় (ধারা ৪৬)',
    category: 'income-tax',
    categoryLabel: 'Income Tax Act, 2023',
    summary: 'Statutory provisions that treat certain recoveries, unpaid trading liabilities (>3 years), asset disposal gains above written-down value, and business benefits as taxable business income.',
    actReference: 'Income Tax Act, 2023 — Section 46',
    keyProvisions: [
      'Trading liabilities remaining unpaid for 3 years after being claimed as a deduction are added back as income.',
      'Sale of business assets for more than tax Written Down Value (WDV) triggers balancing charge up to original cost.',
      'Bad debts subsequently recovered are taxable in the year of recovery.'
    ],
    relatedTerms: ['minimum-tax', 'section-66-67'],
    tags: ['section 46', 'deemed business income', 'balancing charge']
  }
];

export const ALL_GLOSSARY_TERMS: GlossaryTerm[] = [
  ...glossaryTerms,
  ...SUPPLEMENTARY_GLOSSARY_TERMS
];

// Build alias mapping to GlossaryTerm so variants in article text match cleanly
interface MatcherEntry {
  phrase: string;
  term: GlossaryTerm;
}

const PHRASE_ALIASES: Record<string, string[]> = {
  'tds': ['TDS', 'Tax Deduction at Source', 'Tax Deducted at Source', 'Withholding Tax', 'Source Tax'],
  'vat': ['VAT', 'Value Added Tax', 'Value-Added Tax'],
  'sixth-schedule': ['Sixth Schedule', '6th Schedule'],
  'vds': ['VDS', 'VAT Deduction at Source', 'VAT Deducted at Source'],
  'ait': ['AIT', 'Advance Income Tax'],
  'psr': ['PSR', 'Proof of Submission of Return', 'Section 264'],
  'tin': ['e-TIN', 'TIN', 'Taxpayer Identification Number'],
  'bin': ['BIN', 'Business Identification Number'],
  'assessment-year': ['Assessment Year', 'Income Year'],
  'minimum-tax': ['Minimum Tax', 'Section 163'],
  'section-66-67': ['Section 66', 'Section 67', 'Sections 66 and 67', 'Unexplained Investments'],
  'mushak-6-3': ['Mushak 6.3', 'Mushak-6.3'],
  'mushak-6-6': ['Mushak 6.6', 'Mushak-6.6'],
  'mushak-9-1': ['Mushak 9.1', 'Mushak-9.1'],
  'investment-tax-rebate': ['Investment Tax Rebate', 'Tax Rebate', 'Investment Rebate'],
  'dvc': ['DVC', 'Document Verification Code'],
  'sro': ['SRO', 'Statutory Regulatory Order'],
  'supplementary-duty': ['Supplementary Duty'],
  'turnover-tax': ['Turnover Tax', 'Mushak 9.2', 'Mushak-9.2'],
  'withholding-entity': ['Withholding Entity', 'Withholding Entities', 'Section 87'],
  'universal-self-assessment': ['Universal Self-Assessment', 'Self-Assessment', 'Section 180'],
  'rjsc': ['RJSC', 'Registrar of Joint Stock Companies', 'Schedule X', 'Form XII'],
  'nbr': ['NBR', 'National Board of Revenue'],
  'a-challan': ['A-Challan', 'e-Challan', 'Treasury Challan'],
  'input-tax-credit': ['Input Tax Credit', 'Input VAT', 'Mushak 4.3', 'Mushak-4.3'],
  'capital-gains': ['Capital Gains', 'Capital Gain'],
  'net-wealth-surcharge': ['Net Wealth Surcharge', 'Wealth Surcharge', 'IT-10B', 'Form IT-10B'],
  'perquisites': ['Perquisites', 'Perquisite'],
  'section-272': ['Section 272'],
  'section-46': ['Section 46', 'Deemed Business Income']
};

const SORTED_MATCHER_ENTRIES: MatcherEntry[] = (() => {
  const entries: MatcherEntry[] = [];
  for (const term of ALL_GLOSSARY_TERMS) {
    const aliases = PHRASE_ALIASES[term.id] || [term.shortTerm, term.term];
    for (const phrase of aliases) {
      if (phrase && phrase.trim().length >= 3) {
        entries.push({ phrase: phrase.trim(), term });
      }
    }
  }
  // Sort longest phrases first so "Tax Deduction at Source" matches before "TDS"
  return entries.sort((a, b) => b.phrase.length - a.phrase.length);
})();

const ESCAPED_PATTERNS = SORTED_MATCHER_ENTRIES.map((e) =>
  e.phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
);

// Master regex with word boundaries
const GLOSSARY_MASTER_REGEX = new RegExp(
  `\\b(${ESCAPED_PATTERNS.join('|')})\\b`,
  'gi'
);

export function findMatchingGlossaryTerm(matchedText: string): GlossaryTerm | undefined {
  const lower = matchedText.toLowerCase();
  const entry = SORTED_MATCHER_ENTRIES.find((e) => e.phrase.toLowerCase() === lower);
  if (!entry) return undefined;
  // For short acronyms (3 chars like TDS, VAT, AIT, PSR, BIN, DVC, SRO, TIN, NBR), require uppercase in source text to avoid false positives
  if (matchedText.length <= 3 && matchedText !== matchedText.toUpperCase()) {
    return undefined;
  }
  return entry.term;
}

export function detectArticleGlossaryTerms(rawContent: string): GlossaryTerm[] {
  if (!rawContent) return [];
  const foundMap = new Map<string, GlossaryTerm>();
  const matches = rawContent.matchAll(GLOSSARY_MASTER_REGEX);
  for (const match of matches) {
    const text = match[0];
    const term = findMatchingGlossaryTerm(text);
    if (term && !foundMap.has(term.id)) {
      foundMap.set(term.id, term);
    }
  }
  return Array.from(foundMap.values());
}

interface GlossaryTermTooltipProps {
  matchedText: string;
  term: GlossaryTerm;
  onOpenFullModal?: (term: GlossaryTerm) => void;
}

export const GlossaryTermTooltip: React.FC<GlossaryTermTooltipProps> = ({
  matchedText,
  term,
  onOpenFullModal,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placement: 'top' | 'bottom' }>({
    top: 0,
    left: 0,
    placement: 'top',
  });

  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 360;
    const estimatedHeight = 290;

    // Decide top vs bottom placement based on available viewport space above
    const placement: 'top' | 'bottom' = rect.top > estimatedHeight + 24 ? 'top' : 'bottom';

    const top = placement === 'top' ? rect.top - 10 : rect.bottom + 10;
    const centerLeft = rect.left + rect.width / 2;
    const minLeft = 16 + tooltipWidth / 2;
    const maxLeft = window.innerWidth - 16 - tooltipWidth / 2;
    const clampedLeft = Math.max(minLeft, Math.min(maxLeft, centerLeft));

    setCoords({ top, left: clampedLeft, placement });
  };

  const handleMouseEnter = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (isOpen) return;
    hoverTimerRef.current = window.setTimeout(() => {
      updatePosition();
      setIsOpen(true);
    }, 140);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    if (isPinned) return;
    closeTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
      stopSpeech();
    }, 220);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    updatePosition();
    if (!isOpen) {
      setIsOpen(true);
      setIsPinned(true);
    } else {
      setIsPinned((prev) => !prev);
    }
  };

  const handleClose = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsPinned(false);
    setIsOpen(false);
    stopSpeech();
  };

  const stopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const toggleSpeakDefinition = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      `${term.term}. Statutory authority: ${term.actReference}. ${term.summary}`
    );
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleScrollOrResize = () => {
      if (triggerRef.current) {
        updatePosition();
      }
    };
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsPinned(false);
        setIsOpen(false);
        stopSpeech();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPinned(false);
        setIsOpen(false);
        stopSpeech();
      }
    };

    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <span
        ref={triggerRef}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-label={`Glossary definition for ${term.term}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick(e as any);
          }
        }}
        className={`border-b-2 border-dotted transition-colors cursor-help px-0.5 rounded-2xs inline ${
          isOpen
            ? 'border-emerald-600 bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 font-semibold'
            : 'border-emerald-600/75 hover:border-emerald-600 bg-emerald-500/8 hover:bg-emerald-500/15 text-inherit'
        }`}
      >
        {matchedText}
      </span>

      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={tooltipRef}
            role="dialog"
            aria-label={term.term}
            onMouseEnter={() => {
              if (closeTimerRef.current) {
                window.clearTimeout(closeTimerRef.current);
                closeTimerRef.current = null;
              }
            }}
            onMouseLeave={handleMouseLeave}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              transform:
                coords.placement === 'top'
                  ? 'translate(-50%, -100%)'
                  : 'translate(-50%, 0)',
              zIndex: 9999,
            }}
            className="w-[340px] sm:w-[375px] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-150 select-none"
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Top Accent Bar */}
            <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />

            <div className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mb-0.5">
                    <Scale className="w-3 h-3 shrink-0" />
                    <span>{term.categoryLabel}</span>
                    {isPinned && (
                      <>
                        <span>·</span>
                        <span className="text-amber-600 dark:text-amber-400">Pinned</span>
                      </>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {term.term}
                  </h4>
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {term.bengaliTerm}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={toggleSpeakDefinition}
                    title={isSpeaking ? 'Stop Audio' : 'Listen to Definition'}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      isSpeaking
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-emerald-600'
                    }`}
                  >
                    {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    title="Close tooltip (Esc)"
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Definition Summary */}
              <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                {term.summary}
              </p>

              {/* Statutory Reference */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Statutory Authority
                </div>
                <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                  {term.actReference}
                </div>
              </div>

              {/* Applicable Rates / Thresholds if available */}
              {term.ratesOrLimits && (
                <div className="px-2.5 py-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/60 text-[11px] text-emerald-900 dark:text-emerald-200 leading-snug">
                  <span className="font-bold">Rate / Limit: </span>
                  {term.ratesOrLimits}
                </div>
              )}

              {/* Footer Actions */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-400">
                  {isPinned ? 'Click outside or Esc to close' : 'Click term to pin open'}
                </span>

                {onOpenFullModal && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClose();
                      onOpenFullModal(term);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 cursor-pointer"
                  >
                    <span>Full Legal Provision</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

/**
 * Recursively transforms text nodes inside React children to highlight glossary terms.
 * Avoids double-wrapping or modifying links, code blocks, or buttons.
 */
export function highlightGlossaryInReactNodes(
  nodes: React.ReactNode,
  enabled: boolean,
  onOpenFullModal?: (term: GlossaryTerm) => void,
  seenCounter?: Map<string, number>
): React.ReactNode {
  if (!enabled) return nodes;
  const counter = seenCounter || new Map<string, number>();

  const transformString = (text: string): React.ReactNode => {
    if (!text || text.length < 3) return text;
    GLOSSARY_MASTER_REGEX.lastIndex = 0;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = GLOSSARY_MASTER_REGEX.exec(text)) !== null) {
      const matchedStr = match[0];
      const matchStart = match.index;
      const term = findMatchingGlossaryTerm(matchedStr);

      // Cap highlights per unique term per paragraph/tree to keep reading clean (max 3 per paragraph)
      const currentCount = term ? counter.get(term.id) || 0 : 999;

      if (term && currentCount < 3) {
        if (matchStart > lastIndex) {
          parts.push(text.slice(lastIndex, matchStart));
        }
        counter.set(term.id, currentCount + 1);
        parts.push(
          <GlossaryTermTooltip
            key={`gl-${term.id}-${matchStart}-${ currentCount }`}
            matchedText={matchedStr}
            term={term}
            onOpenFullModal={onOpenFullModal}
          />
        );
        lastIndex = matchStart + matchedStr.length;
      }
    }

    if (parts.length === 0) return text;
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    return parts;
  };

  const walk = (child: React.ReactNode): React.ReactNode => {
    if (typeof child === 'string') {
      return transformString(child);
    }
    if (Array.isArray(child)) {
      return child.map((c, idx) => <React.Fragment key={idx}>{walk(c)}</React.Fragment>);
    }
    if (React.isValidElement(child)) {
      const elementType = child.type;
      // Do not highlight inside links, code, pre, buttons, or existing tooltips
      if (
        typeof elementType === 'string' &&
        ['a', 'code', 'pre', 'button', 'h1', 'h2', 'h3', 'h4'].includes(elementType)
      ) {
        return child;
      }
      const props = child.props as any;
      if (props && props.children) {
        return React.cloneElement(child, {
          ...props,
          children: walk(props.children),
        });
      }
    }
    return child;
  };

  return walk(nodes);
}

interface ArticleGlossaryBarProps {
  detectedTerms: GlossaryTerm[];
  highlightsEnabled: boolean;
  onToggleHighlights: () => void;
  onSelectTerm: (term: GlossaryTerm) => void;
}

export const ArticleGlossaryBar: React.FC<ArticleGlossaryBarProps> = ({
  detectedTerms,
  highlightsEnabled,
  onToggleHighlights,
  onSelectTerm,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (detectedTerms.length === 0) return null;

  return (
    <div className="mb-8 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-2xs transition-all print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <span>Interactive Legal & Accounting Glossary</span>
              <span className="text-slate-400 font-normal">·</span>
              <span className="text-emerald-700 dark:text-emerald-400">
                {detectedTerms.length} {detectedTerms.length === 1 ? 'term' : 'terms'} in this article
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Hover or click any dotted-underlined term in the text for instant statutory definitions & rates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleHighlights}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              highlightsEnabled
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
            title={highlightsEnabled ? 'Disable inline term highlights' : 'Enable inline term highlights'}
          >
            {highlightsEnabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{highlightsEnabled ? 'Highlights: ON' : 'Highlights: OFF'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>View All ({detectedTerms.length})</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 mb-2.5">
            Click any detected technical term below to open its full statutory breakdown:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {detectedTerms.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectTerm(t)}
                className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/40 text-left transition-all flex items-start justify-between gap-2 group cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 truncate">
                    {t.shortTerm} — {t.term.replace(/\s*\(.*?\)\s*/g, '')}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {t.bengaliTerm} · {t.categoryLabel}
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
