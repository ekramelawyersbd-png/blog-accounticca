import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Calculator, 
  FileCheck2, 
  RotateCcw, 
  Sparkles, 
  ArrowRight, 
  Printer, 
  Briefcase, 
  Building2, 
  Sprout, 
  Landmark, 
  TrendingUp, 
  Coins, 
  DollarSign, 
  Users2, 
  Globe2, 
  AlertCircle,
  HelpCircle,
  CheckSquare,
  ShieldCheck,
  Percent,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export interface IncomeSourceItem {
  id: string;
  headNumber: number;
  titleEn: string;
  titleBn: string;
  category: string;
  lawSection: string;
  icon: React.ElementType;
  colorScheme: {
    bg: string;
    text: string;
    border: string;
    lightBg: string;
  };
  tipsEn: string;
  tipsBn: string;
  deductionNotesEn: string;
  deductionNotesBn: string;
  isExcludedFromRebate?: boolean;
}

export const STATUTORY_INCOME_HEADS: IncomeSourceItem[] = [
  {
    id: 'employment',
    headNumber: 1,
    titleEn: 'Income from Employment / Salary',
    titleBn: 'চাকরি বা বেতন হতে আয়',
    category: 'Employment',
    lawSection: 'Section 32, Income Tax Act 2023',
    icon: Briefcase,
    colorScheme: { bg: 'bg-blue-600', text: 'text-blue-700', border: 'border-blue-200', lightBg: 'bg-blue-50' },
    tipsEn: 'Basic salary, house rent allowance, medical allowance, festival bonus. Apply Sixth Schedule exemptions.',
    tipsBn: 'মূল বেতন, বাড়ি ভাড়া, চিকিৎসা ও উৎসব ভাতা। ষষ্ঠ তফসিলের অনুমোদিত কর অব্যাহতি বাদ দিয়ে গণনা করুন।',
    deductionNotesEn: 'Allowable salary exemption threshold under Sixth Schedule (Part 1).',
    deductionNotesBn: 'ষষ্ঠ তফসিলের প্রথম খণ্ড অনুযায়ী অনুমোদিত কর অব্যাহতি।'
  },
  {
    id: 'rent',
    headNumber: 2,
    titleEn: 'Income from Rent / House Property',
    titleBn: 'ভাড়া বা গৃহ-সম্পত্তি হতে আয়',
    category: 'Property',
    lawSection: 'Section 36, Income Tax Act 2023',
    icon: Building2,
    colorScheme: { bg: 'bg-indigo-600', text: 'text-indigo-700', border: 'border-indigo-200', lightBg: 'bg-indigo-50' },
    tipsEn: 'Gross annual rent received or receivable. Deduct statutory repairs (25% residential, 30% commercial) and municipal taxes.',
    tipsBn: 'মোট প্রাপ্ত বা প্রাপ্য ভাড়া। বিধিবদ্ধ মেরামত ছাড় (আবাসিক ২৫%, বাণিজ্যিক ৩০%), পৌর কর ও গৃহঋণের সুদ বাদ দিন।',
    deductionNotesEn: 'Statutory 25%/30% repairs, municipal taxes, property insurance, mortgage interest.',
    deductionNotesBn: 'বিধিবদ্ধ ২৫%/৩০% মেরামত ছাড়, পৌর কর, বীমা প্রিমিয়াম ও ব্যাংক ঋণের সুদ।'
  },
  {
    id: 'agriculture',
    headNumber: 3,
    titleEn: 'Income from Agriculture',
    titleBn: 'কৃষি হতে আয়',
    category: 'Agriculture',
    lawSection: 'Section 39, Income Tax Act 2023',
    icon: Sprout,
    colorScheme: { bg: 'bg-emerald-600', text: 'text-emerald-700', border: 'border-emerald-200', lightBg: 'bg-emerald-50' },
    tipsEn: 'Crops, tea, rubber, fisheries, poultry and livestock. Deduct statutory cost of production allowances.',
    tipsBn: 'ফসল, চা, রবার, মৎস্য চাষ, ডেইরি ও পোল্ট্রি হতে আয়। অনুমোদিত উৎপাদন খরচ বাদ দিন।',
    deductionNotesEn: 'Allowable production expenses, land revenue, and statutory agricultural exemptions.',
    deductionNotesBn: 'আইনসম্মত উৎপাদন ব্যয়, ভূমি উন্নয়ন কর ও বিশেষ কৃষি কর অব্যাহতি।'
  },
  {
    id: 'business',
    headNumber: 4,
    titleEn: 'Income from Business or Profession',
    titleBn: 'ব্যবসা বা পেশা হতে আয়',
    category: 'Business',
    lawSection: 'Section 45, Income Tax Act 2023',
    icon: Landmark,
    colorScheme: { bg: 'bg-amber-600', text: 'text-amber-700', border: 'border-amber-200', lightBg: 'bg-amber-50' },
    tipsEn: 'Trading, services, manufacturing, consulting. Deduct allowable commercial expenses backed by vouchers.',
    tipsBn: 'বাণিজ্য, সেবা, উৎপাদন বা পরামর্শক ফি। ভাউচার ও ব্যাংক চ্যানেলযুক্ত অনুমোদিত খরচ বাদ দিন।',
    deductionNotesEn: 'Allowable business expenses, commercial depreciation, banking channel compliance.',
    deductionNotesBn: 'অনুমোদিত বাণিজ্যিক খরচ, হিসাবসম্মত অবচয় ও ব্যাংক লেনদেন শর্ত।'
  },
  {
    id: 'capital-gains',
    headNumber: 5,
    titleEn: 'Capital Gains',
    titleBn: 'মূলধনি আয় (ক্যাপিটাল গেইন)',
    category: 'Capital',
    lawSection: 'Section 57, Income Tax Act 2023',
    icon: TrendingUp,
    colorScheme: { bg: 'bg-purple-600', text: 'text-purple-700', border: 'border-purple-200', lightBg: 'bg-purple-50' },
    tipsEn: 'Disposal of land, flats, company shares, licenses. Calculate net gain: transfer value minus acquisition costs.',
    tipsBn: 'জমি, ফ্ল্যাট, শেয়ার বা লাইসেন্স হস্তান্তরের নিট মুনাফা: হস্তান্তর মূল্য হতে ক্রয়মূল্য ও ব্যয় বাদ।',
    deductionNotesEn: 'Cost of acquisition, capital improvements, transfer fees, and statutory exemptions.',
    deductionNotesBn: 'মূল পরিসম্পদ অর্জন খরচ, উন্নয়ন ব্যয় ও সরকারি নিবন্ধন খরচ।'
  },
  {
    id: 'financial-assets',
    headNumber: 6,
    titleEn: 'Income from Financial Assets',
    titleBn: 'আর্থিক পরিসম্পদ হতে আয়',
    category: 'Investments',
    lawSection: 'Section 62, Income Tax Act 2023',
    icon: Coins,
    colorScheme: { bg: 'bg-cyan-600', text: 'text-cyan-700', border: 'border-cyan-200', lightBg: 'bg-cyan-50' },
    tipsEn: 'Bank interest, FDR profit, Sanchayapatra profit, dividends. Report gross income and TDS separately.',
    tipsBn: 'ব্যাংক সুদ, এফডিআর মুনাফা, সঞ্চয়পত্রের মুনাফা ও লভ্যাংশ। গ্রস আয় ও উৎসে কর্তিত কর আলাদা হিসাব করুন।',
    deductionNotesEn: 'Bank excise duty & service charges; keep TDS certificates for tax credit.',
    deductionNotesBn: 'ব্যাংক আবগারি শুল্ক ও চার্জ; উৎসে কর কর্তন (TDS) সনদ ক্রেডিট হিসেবে সমন্বিত হবে।'
  },
  {
    id: 'other-sources',
    headNumber: 7,
    titleEn: 'Income from Other Sources',
    titleBn: 'অন্যান্য উৎস হতে আয়',
    category: 'Miscellaneous',
    lawSection: 'Section 66, Income Tax Act 2023',
    icon: DollarSign,
    colorScheme: { bg: 'bg-rose-600', text: 'text-rose-700', border: 'border-rose-200', lightBg: 'bg-rose-50' },
    tipsEn: 'Royalties, honorarium, guest speaker fees, cash subsidies, commission, lottery winnings.',
    tipsBn: 'রয়্যালটি, সম্মানী, গেস্ট স্পিকার ফি, সরকারি নগদ প্রণোদনা বা কমিশন।',
    deductionNotesEn: 'Direct expenses incurred wholly and exclusively to earn the non-classified receipt.',
    deductionNotesBn: 'উক্ত আয় অর্জনের নিমিত্তে সম্পূর্ণ ও নিরবচ্ছিন্নভাবে ব্যয়িত অনুমোদিত খরচ।'
  },
  {
    id: 'partnership-aop',
    headNumber: 8,
    titleEn: 'Share of Partnership Firm / AOP',
    titleBn: 'অংশীদারি ফার্ম বা AOP-এর আয়ের অংশ',
    category: 'Partnership',
    lawSection: 'Section 78 & Third Schedule',
    icon: Users2,
    colorScheme: { bg: 'bg-orange-600', text: 'text-orange-700', border: 'border-orange-200', lightBg: 'bg-orange-50' },
    tipsEn: 'Taxpayer share in partnership firm profit. CRITICAL: Included in Total Income, but EXCLUDED from 3% rebate base under Section 78!',
    tipsBn: 'ফার্মের অর্জিত মুনাফায় করদাতার অংশ। সতর্কবার্তা: মোট আয়ে যোগ হবে, তবে ধারা ৭৮-এর ৩% রেয়াত গণনায় বাদ যাবে!',
    deductionNotesEn: 'Income taxed at firm level; excluded from 3% Section 78 rebate base calculation.',
    deductionNotesBn: 'ফার্ম পর্যায়ে কর পরিশোধিত হওয়ায় করদাতার ৩% রেয়াত ভিত্তি থেকে এটি বাদ দেওয়া হয়।'
  },
  {
    id: 'spouse-child',
    headNumber: 9,
    titleEn: 'Income of Spouse or Minor Child',
    titleBn: 'স্বামী/স্ত্রী বা অপ্রাপ্তবয়স্ক সন্তানের আয়',
    category: 'Clubbing',
    lawSection: 'Section 70, Income Tax Act 2023',
    icon: Users2,
    colorScheme: { bg: 'bg-teal-600', text: 'text-teal-700', border: 'border-teal-200', lightBg: 'bg-teal-50' },
    tipsEn: 'Include only when statutory clubbing conditions apply (e.g., assets transferred without adequate consideration).',
    tipsBn: 'শুধুমাত্র আইনের শর্ত প্রযোজ্য হলেই অন্তর্ভুক্ত করুন (যেমন: নামমাত্র মূল্যে হস্তান্তরিত সম্পদের আয়)।',
    deductionNotesEn: 'Applicable when transferred without adequate consideration to spouse or minor.',
    deductionNotesBn: 'অপর্যাপ্ত প্রতিদানে সম্পদ হস্তান্তরের মাধ্যমে অর্জিত আয়ের ক্ষেত্রে প্রযোজ্য।'
  },
  {
    id: 'foreign-income',
    headNumber: 10,
    titleEn: 'Foreign Income / Taxable Abroad',
    titleBn: 'বৈদেশিক আয় (ফরেন ইনকাম)',
    category: 'International',
    lawSection: 'Section 75 & DTAA Agreements',
    icon: Globe2,
    colorScheme: { bg: 'bg-slate-700', text: 'text-slate-800', border: 'border-slate-300', lightBg: 'bg-slate-100' },
    tipsEn: 'Resident worldwide income: foreign salary, investments, freelance consultancies. Check foreign tax credit.',
    tipsBn: 'নিবাসী করদাতার বিশ্বব্যাপী অর্জিত আয়: বিদেশে বেতন, পরামর্শ বা লভ্যাংশ। কর ক্রেডিট বিবেচনা করুন।',
    deductionNotesEn: 'Foreign Tax Credit (FTC) under double taxation avoidance agreements (DTAA).',
    deductionNotesBn: 'দ্বৈত কর পরিহার চুক্তি (DTAA) অনুযায়ী ফরেন ট্যাক্স ক্রেডিট সমন্বয়ের সুযোগ।'
  }
];

export interface TaxChecklistProps {
  className?: string;
  onNavigateToCalculator?: (headId: string) => void;
}

export function TaxReturnChecklist({ className = '', onNavigateToCalculator }: TaxChecklistProps) {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  // State: selected income sources applicable to this taxpayer
  const [applicableSources, setApplicableSources] = useState<Record<string, boolean>>({
    employment: true,
    rent: false,
    agriculture: false,
    business: true,
    'capital-gains': false,
    'financial-assets': true,
    'other-sources': false,
    'partnership-aop': true,
    'spouse-child': false,
    'foreign-income': false,
  });

  // State: completed/computed status for each head
  const [completedSources, setCompletedSources] = useState<Record<string, boolean>>({
    employment: true,
    business: false,
    'financial-assets': false,
    'partnership-aop': false,
  });

  // State: entered income amounts (for instant estimation preview)
  const [headAmounts, setHeadAmounts] = useState<Record<string, number>>({
    employment: 1000000,
    rent: 0,
    agriculture: 0,
    business: 500000,
    'capital-gains': 0,
    'financial-assets': 200000,
    'other-sources': 0,
    'partnership-aop': 200000,
    'spouse-child': 0,
    'foreign-income': 0,
  });

  // Expandable details drawer
  const [expandedHeadId, setExpandedHeadId] = useState<string | null>('employment');
  const [filterMode, setFilterMode] = useState<'all' | 'applicable' | 'completed'>('applicable');

  // Toggle applicability (Does this taxpayer have this income head?)
  const toggleApplicability = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setApplicableSources(prev => {
      const nextVal = !prev[id];
      const updated = { ...prev, [id]: nextVal };
      if (!nextVal) {
        // If not applicable, remove completed status
        setCompletedSources(c => ({ ...c, [id]: false }));
      }
      return updated;
    });
  };

  // Toggle completion status (Tick off when computed)
  const toggleCompleted = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCompletedSources(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Amount update
  const handleAmountChange = (id: string, value: number) => {
    setHeadAmounts(prev => ({
      ...prev,
      [id]: Math.max(0, value)
    }));
  };

  // Calculations
  const totalApplicableCount = useMemo(() => {
    return Object.values(applicableSources).filter(Boolean).length;
  }, [applicableSources]);

  const completedCount = useMemo(() => {
    return STATUTORY_INCOME_HEADS.filter(head => applicableSources[head.id] && completedSources[head.id]).length;
  }, [applicableSources, completedSources]);

  const progressPercentage = totalApplicableCount === 0 ? 0 : Math.round((completedCount / totalApplicableCount) * 100);

  // Total Income computed from ticked off heads
  const computedTotalIncome = useMemo(() => {
    return STATUTORY_INCOME_HEADS.reduce((acc, head) => {
      if (applicableSources[head.id] && completedSources[head.id]) {
        return acc + (headAmounts[head.id] || 0);
      }
      return acc;
    }, 0);
  }, [applicableSources, completedSources, headAmounts]);

  // Section 78 Qualifying Income (Excludes partnership profit share even if completed!)
  const computedQualifyingRebateBase = useMemo(() => {
    return STATUTORY_INCOME_HEADS.reduce((acc, head) => {
      if (applicableSources[head.id] && completedSources[head.id]) {
        if (head.id === 'partnership-aop') return acc; // Excluded under Section 78!
        return acc + (headAmounts[head.id] || 0);
      }
      return acc;
    }, 0);
  }, [applicableSources, completedSources, headAmounts]);

  // Projected 3% Rebate Limit from current completed income
  const projected3PercentRebate = Math.round(computedQualifyingRebateBase * 0.03);

  // Filter heads for display
  const displayedHeads = useMemo(() => {
    return STATUTORY_INCOME_HEADS.filter(head => {
      if (filterMode === 'applicable') return applicableSources[head.id];
      if (filterMode === 'completed') return applicableSources[head.id] && completedSources[head.id];
      return true;
    });
  }, [filterMode, applicableSources, completedSources]);

  // Quick Action Presets
  const markAllCompleted = () => {
    const newCompleted: Record<string, boolean> = {};
    STATUTORY_INCOME_HEADS.forEach(head => {
      if (applicableSources[head.id]) {
        newCompleted[head.id] = true;
      }
    });
    setCompletedSources(newCompleted);
  };

  const resetChecklist = () => {
    setCompletedSources({});
  };

  const scrollToCalculator = (headId: string) => {
    if (onNavigateToCalculator) {
      onNavigateToCalculator(headId);
    } else {
      const el = document.getElementById('total-income-calculator-tool');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className={`bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden ${className}`}>
      
      {/* Top Banner / Progress Summary */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold tracking-wide uppercase border border-emerald-500/30 mb-3">
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{isBn ? 'আইটি-১১গ রিটার্ন চেকলিস্ট' : 'IT-11GA Return Verification'}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {isBn ? '১০টি খাতের আয় ও হিসাব চেকলিস্ট' : '10 Heads Income Computation Checklist'}
            </h3>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
              {isBn 
                ? 'আপনার প্রযোজ্য আয়ের খাতগুলো টিক দিয়ে হিসাব সম্পন্ন করুন। মোট আয় এবং ধারা ৭৮-এর ৩% রেয়াত ভিত্তির অগ্রগতি লাইভ দেখুন।' 
                : 'Tick off income heads as you verify and calculate them. Track your aggregate Total Income and Section 78 rebate base in real time.'}
            </p>
          </div>

          {/* Progress Circular / Numerical Badge */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl flex items-center gap-4 shrink-0 shadow-lg">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-700/60"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-400 transition-all duration-700 ease-out"
                  strokeDasharray={`${progressPercentage}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-sm font-extrabold text-white">
                {progressPercentage}%
              </span>
            </div>
            <div>
              <div className="text-xs uppercase font-bold text-emerald-300 tracking-wider">
                {isBn ? 'গণনার অগ্রগতি' : 'Calculation Status'}
              </div>
              <div className="text-lg font-black text-white">
                {completedCount} <span className="text-slate-400 text-sm font-normal">/ {totalApplicableCount} {isBn ? 'টি খাত' : 'Heads'}</span>
              </div>
              <div className="text-[11px] text-slate-300 font-medium">
                {progressPercentage === 100 
                  ? (isBn ? '✅ সকল খাত সম্পন্ন!' : '✅ Ready to aggregate!') 
                  : (isBn ? `${totalApplicableCount - completedCount}টি খাত বাকি` : `${totalApplicableCount - completedCount} heads pending`)}
              </div>
            </div>
          </div>
        </div>

        {/* Live Aggregation Counter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {isBn ? 'গণনাকৃত মোট আয় (Total Income)' : 'Computed Total Income'}
              </div>
              <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono mt-0.5">
                ৳ {computedTotalIncome.toLocaleString('en-IN')}
              </div>
            </div>
            <Coins className="w-5 h-5 text-emerald-400/80 shrink-0" />
          </div>

          <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {isBn ? 'ধারা ৭৮ রেয়াত ভিত্তি' : 'Sec 78 Rebate Base'}
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-semibold border border-amber-500/30">
                  {isBn ? 'ফার্ম আয় বাদ' : 'Firm Excluded'}
                </span>
              </div>
              <div className="text-lg sm:text-xl font-black text-amber-400 font-mono mt-0.5">
                ৳ {computedQualifyingRebateBase.toLocaleString('en-IN')}
              </div>
            </div>
            <Percent className="w-5 h-5 text-amber-400/80 shrink-0" />
          </div>

          <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {isBn ? 'সম্ভাব্য ৩% রেয়াত সীমা' : 'Projected 3% Rebate Cap'}
              </div>
              <div className="text-lg sm:text-xl font-black text-white font-mono mt-0.5">
                ৳ {projected3PercentRebate.toLocaleString('en-IN')}
              </div>
            </div>
            <Sparkles className="w-5 h-5 text-emerald-400/80 shrink-0" />
          </div>
        </div>

        {/* Filter Tabs & Quick Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setFilterMode('applicable')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                filterMode === 'applicable'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isBn ? `প্রযোজ্য খাতসমূহ (${totalApplicableCount})` : `My Applicable Heads (${totalApplicableCount})`}
            </button>
            <button
              onClick={() => setFilterMode('completed')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                filterMode === 'completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isBn ? `গণনাকৃত (${completedCount})` : `Calculated (${completedCount})`}
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                filterMode === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isBn ? 'সকল ১০টি খাত' : 'All 10 Statutory Heads'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={markAllCompleted}
              className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 rounded-lg font-medium border border-emerald-500/30 transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isBn ? 'সব সম্পন্ন করুন' : 'Mark All Calculated'}</span>
            </button>
            <button
              onClick={resetChecklist}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium border border-slate-700 transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isBn ? 'রিসেট' : 'Reset'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Checklist Body */}
      <div className="p-5 sm:p-8">
        
        {/* Section Notice Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3.5 text-xs text-amber-900">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">
              {isBn ? 'আইনসম্মত নির্দেশনা (আয়কর আইন ২০২৩):' : 'Statutory Computation Guidelines (Income Tax Act 2023):'}
            </span>
            <p className="leading-relaxed">
              {isBn 
                ? 'প্রতিটি খাতের জন্য কেবল গ্রস প্রাপ্তি যোগ করলেই হবে না। প্রতিটি খাতের অনুমোদনযোগ্য খরচ ও ষষ্ঠ তফসিলে উল্লেখিত কর অব্যাহতি বাদ দিয়ে প্রাপ্ত "পরিগণিত নিট আয়" টিক দিন।'
                : 'Do not simply add gross bank receipts. Calculate net taxable income under each head after statutory deductions and Sixth Schedule exemptions before ticking off.'}
            </p>
          </div>
        </div>

        {/* 10 Heads Interactive Cards */}
        <div className="space-y-3.5">
          {displayedHeads.map((head) => {
            const HeadIcon = head.icon;
            const isApplicable = !!applicableSources[head.id];
            const isCompleted = !!completedSources[head.id];
            const isExpanded = expandedHeadId === head.id;
            const currentAmount = headAmounts[head.id] || 0;

            return (
              <div 
                key={head.id}
                className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
                  isCompleted 
                    ? 'border-emerald-300 bg-emerald-50/20 shadow-xs' 
                    : isApplicable 
                      ? 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                      : 'border-slate-100 bg-slate-50/60 opacity-60'
                }`}
              >
                {/* Header Row */}
                <div 
                  onClick={() => setExpandedHeadId(isExpanded ? null : head.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                >
                  {/* Left: Checkbox & Head Info */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    {/* Completion Tick Button */}
                    <button
                      type="button"
                      onClick={(e) => toggleCompleted(head.id, e)}
                      disabled={!isApplicable}
                      className={`mt-0.5 sm:mt-0 p-1 rounded-xl transition cursor-pointer shrink-0 ${
                        !isApplicable 
                          ? 'opacity-40 cursor-not-allowed text-slate-300' 
                          : isCompleted 
                            ? 'text-emerald-600 hover:text-emerald-700 bg-emerald-100/60' 
                            : 'text-slate-300 hover:text-slate-400 bg-slate-100'
                      }`}
                      title={isCompleted ? 'Mark as incomplete' : 'Tick off as calculated'}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 fill-emerald-600 text-white" />
                      ) : (
                        <Circle className="w-6 h-6" />
                      )}
                    </button>

                    {/* Head Icon */}
                    <div className={`p-2.5 rounded-xl shrink-0 ${head.colorScheme.lightBg} ${head.colorScheme.text}`}>
                      <HeadIcon className="w-5 h-5" />
                    </div>

                    {/* Titles & Statutory Head Number */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {isBn ? `খাত ০${head.headNumber}` : `Head 0${head.headNumber}`}
                        </span>
                        {head.id === 'partnership-aop' && (
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300">
                            {isBn ? 'ধারা ৭৮ সতর্কবার্তা' : 'Sec 78 Rebate Exclusion'}
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-mono hidden md:inline">
                          {head.lawSection}
                        </span>
                      </div>
                      <h4 className={`text-base font-bold tracking-tight mt-1 truncate ${
                        isCompleted ? 'text-slate-900' : 'text-slate-800'
                      }`}>
                        {isBn ? head.titleBn : head.titleEn}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {isBn ? head.tipsBn : head.tipsEn}
                      </p>
                    </div>
                  </div>

                  {/* Right: Amount Preview, Applicability Toggle, and Expand Indicator */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 self-end sm:self-auto shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    
                    {/* Amount preview pill */}
                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {isBn ? 'পরিগণিত নিট আয়' : 'Computed Net'}
                      </div>
                      <div className="text-sm sm:text-base font-extrabold font-mono text-slate-900">
                        ৳ {currentAmount.toLocaleString('en-IN')}
                      </div>
                    </div>

                    {/* Applicability Switch */}
                    <button
                      type="button"
                      onClick={(e) => toggleApplicability(head.id, e)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border cursor-pointer ${
                        isApplicable
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                      }`}
                      title={isApplicable ? 'Click to mark as not applicable' : 'Click to enable this head'}
                    >
                      {isApplicable ? (isBn ? 'প্রযোজ্য' : 'Applicable') : (isBn ? 'প্রযোজ্য নয়' : 'N/A')}
                    </button>

                    {/* Expand icon */}
                    <div className="text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Drawer: Deductions Checklist & Direct Amount Input */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 bg-slate-50/80 border-t border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-5">
                    
                    {/* Left: Statutory Deductions & Verification Tips */}
                    <div className="md:col-span-7 space-y-3">
                      <div>
                        <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>{isBn ? 'বিধিবদ্ধ কর্তন ও যাচাইকরণ নিয়ম:' : 'Statutory Deductions & Verification:'}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                          {isBn ? head.deductionNotesBn : head.deductionNotesEn}
                        </p>
                      </div>

                      {head.id === 'partnership-aop' && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                          <strong>{isBn ? 'ধারা ৭৮ সতর্কতা:' : 'Section 78 Rule:'}</strong>{' '}
                          {isBn 
                            ? 'অংশীদারি ফার্মে কর পরিশোধিত থাকায় এই আয় মোট আয়ে যোগ হবে ঠিকই, কিন্তু ৩% বিনিয়োগ কর রেয়াত গণনায় এই অংশটি বাদ পড়বে।' 
                            : 'This income is included in Total Income on your return, but EXCLUDED from the 3% rebate base because tax has been assessed on the partnership firm.'}
                        </div>
                      )}
                    </div>

                    {/* Right: Net Amount Input & Direct Calculator Link */}
                    <div className="md:col-span-5 bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          {isBn ? 'নিট করযোগ্য আয় লিখুন (টাকা):' : 'Enter Net Taxable Amount (Tk.):'}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-slate-400 font-bold">৳</span>
                          <input 
                            type="number" 
                            min="0"
                            value={currentAmount || ''}
                            onChange={(e) => handleAmountChange(head.id, Number(e.target.value) || 0)}
                            className="w-full text-sm font-mono font-bold pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="0"
                          />
                        </div>
                        <span className="text-[11px] text-slate-400 mt-1 block">
                          {isBn ? 'খরচ ও ছাড় বাদ দিয়ে অবশিষ্ট নিট অংক।' : 'Net amount after allowable expenses.'}
                        </span>
                      </div>

                      <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => toggleCompleted(head.id)}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                            isCompleted 
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                              : 'bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isCompleted ? (isBn ? 'হিসাব সম্পন্ন হয়েছে' : 'Calculated') : (isBn ? 'সম্পন্ন হিসেবে চিহ্নিত করুন' : 'Mark as Calculated')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => scrollToCalculator(head.id)}
                          className="py-2 px-3 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition flex items-center gap-1 shrink-0"
                          title="Open detailed calculator for this head"
                        >
                          <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="hidden sm:inline">{isBn ? 'বিস্তারিত' : 'Compute'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Final Assessment Summary Card */}
        <div className="mt-8 p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl border border-slate-700/80 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>{isBn ? 'চূড়ান্ত সারসংক্ষেপ (Assessment Year 2026–2027)' : 'Final Aggregation (AY 2026–2027)'}</span>
              </div>
              <h4 className="text-xl sm:text-2xl font-black text-white">
                {isBn ? 'মোট আয় ও ধারা ৭৮ অনুমোদনযোগ্য সীমা' : 'Total Income vs Section 78 Rebate Limit'}
              </h4>
              <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                {isBn 
                  ? `আপনি ${totalApplicableCount}টি খাতের মধ্যে ${completedCount}টি খাতের হিসাব সম্পন্ন করেছেন। আপনার চূড়ান্ত মোট আয় ৳ ${computedTotalIncome.toLocaleString('en-IN')} এবং ৩% রেয়াত ভিত্তি ৳ ${computedQualifyingRebateBase.toLocaleString('en-IN')}।` 
                  : `You have completed ${completedCount} out of ${totalApplicableCount} applicable income heads. Total Income stands at Tk. ${computedTotalIncome.toLocaleString('en-IN')}, and Section 78 qualifying base is Tk. ${computedQualifyingRebateBase.toLocaleString('en-IN')}.`}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-auto px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>{isBn ? 'চেকলিস্ট প্রিন্ট করুন' : 'Print Checklist'}</span>
              </button>
              <button
                type="button"
                onClick={() => scrollToCalculator('all')}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 hover:-translate-y-0.5"
              >
                <span>{isBn ? 'পূর্ণাঙ্গ ক্যালকুলেটরে যান' : 'Open Full Calculator'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
