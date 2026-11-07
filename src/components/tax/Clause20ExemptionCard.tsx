import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  FileText, 
  Wheat, 
  Scale, 
  Copy, 
  Check, 
  Info,
  ExternalLink,
  Coins
} from 'lucide-react';

interface Clause20ExemptionCardProps {
  className?: string;
  showBengali?: boolean;
}

export function Clause20ExemptionCard({ className = '', showBengali = false }: Clause20ExemptionCardProps) {
  const [bengaliMode, setBengaliMode] = useState<boolean>(showBengali);
  const [copied, setCopied] = useState<boolean>(false);

  const copyRule = () => {
    const text = `
Sixth Schedule, Part 1, Clause 20 (Income Tax Act, 2023):
Agricultural Income Exemption: Up to BDT 2,00,000 (Max)
Mandatory Conditions:
1. The assessee must be a farmer by primary occupation (পেশায় কৃষক).
2. The assessee must have NO other income during the income year, except:
   - Income arising from cultivation of agricultural land; and
   - Bank interest / profit not exceeding BDT 20,000.
Important Limitation: Earning any employment salary, business profit, house rent, or interest > BDT 20,000 disqualifies the taxpayer from this BDT 2 lakh exemption.
Statutory Source: National Board of Revenue (NBR), Bangladesh.
`.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`bg-white rounded-3xl border border-emerald-300 shadow-xl overflow-hidden ${className}`}>
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 sm:p-7 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-400/30 backdrop-blur-xs text-emerald-300">
              <Wheat className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase bg-emerald-400/20 text-emerald-200 rounded-full border border-emerald-400/30">
                  Sixth Schedule • Part 1 • Clause 20
                </span>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-amber-400/20 text-amber-200 rounded-md border border-amber-400/30">
                  Statutory Rule
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                {bengaliMode ? 'কৃষি আয়ের ২ লক্ষ টাকা কর অব্যাহতি নীতিমালা' : 'BDT 2 Lakh Agricultural Income Exemption'}
              </h3>
              <p className="text-xs sm:text-sm text-emerald-200/90 mt-0.5">
                {bengaliMode 
                  ? 'আয়কর আইন, ২০২৩ এর ষষ্ঠ তফসিল, অংশ ১, দফা ২০ এর অধীনে আবশ্যকীয় শর্তাবলী'
                  : 'Mandatory Statutory Criteria under Income Tax Act, 2023 & NBR Directives'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => setBengaliMode(!bengaliMode)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-800/60 hover:bg-emerald-700/80 text-emerald-100 border border-emerald-600/40 transition-colors"
            >
              {bengaliMode ? 'English View' : 'বাংলা সংস্করণ'}
            </button>
            <button
              type="button"
              onClick={copyRule}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-400 text-emerald-950 hover:bg-emerald-300 transition-colors shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Rule'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 sm:p-8 space-y-6">
        
        {/* Core Statutory Exemption Amount Card */}
        <div className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white p-5 rounded-2xl border border-emerald-200/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs uppercase font-extrabold tracking-wider text-emerald-800">
              {bengaliMode ? 'সর্বোচ্চ কর অব্যাহতি সীমা' : 'Maximum Statutory Exemption Ceiling'}
            </div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-950">
              BDT 2,00,000 <span className="text-base font-bold text-emerald-700 font-sans">(২ লক্ষ টাকা)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              {bengaliMode
                ? 'কৃষি জমি চাষাবাদ হতে অর্জিত নিট কৃষি আয় হতে সর্বোচ্চ ২,০০,০০০ টাকা মোট করযোগ্য আয় হতে সম্পূর্ণ বাদ (Exempt) যাবে—যদি এবং কেবল যদি নিচের দুটি বিধিবদ্ধ শর্তই শতভাগ পূরণ হয়।'
                : 'Up to BDT 2,00,000 of net agricultural income derived from cultivating land is excluded from total income—IF and ONLY IF both statutory conditions below are strictly fulfilled.'}
            </p>
          </div>

          <div className="shrink-0 bg-white px-4 py-3 rounded-xl border border-emerald-300/80 shadow-2xs text-center">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Statutory Cap</div>
            <div className="text-xl font-black text-emerald-700">100% Tax-Free</div>
            <div className="text-[10px] text-slate-500 font-medium">Against Net Agri Income</div>
          </div>
        </div>

        {/* The Two Mandatory Conditions (Dual-Condition Test) */}
        <div>
          <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2 mb-3.5">
            <Scale className="w-4 h-4 text-emerald-600" />
            <span>{bengaliMode ? '২টি বাধ্যতামূলক বিধিবদ্ধ শর্ত (উভয়টি পূরণ আবশ্যক)' : 'Two Strict Mandatory Conditions (Both Must Be Met)'}</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Condition 1 Card */}
            <div className="p-5 rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/40 relative">
              <div className="absolute top-4 right-4 bg-emerald-600 text-white text-[11px] font-black w-6 h-6 rounded-full flex items-center justify-center">
                1
              </div>
              <div className="flex items-center gap-2.5 text-emerald-900 mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <h5 className="font-extrabold text-base">
                  {bengaliMode ? '১. পেশাগত পরিচয়: পেশায় কৃষক' : '1. Primary Occupation: Farmer'}
                </h5>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {bengaliMode ? (
                  <>
                    করদাতাকে ব্যক্তিগতভাবে <strong>পেশায় কৃষক (Farmer by Occupation)</strong> হতে হবে। যারা ব্যক্তিগতভাবে কৃষি কাজের সাথে যুক্ত নন অথবা প্রাতিষ্ঠানিক কৃষি ব্যবসা পরিচালনা করেন তারা এই ছাড় পাবেন না।
                  </>
                ) : (
                  <>
                    The assessee must be an individual who is a <strong>farmer by primary occupation</strong>. Commercial corporate entities, absentee landlords, or investors not directly engaged in farming do not qualify.
                  </>
                )}
              </p>
              <div className="mt-3 pt-2.5 border-t border-emerald-200/80 text-[11px] font-semibold text-emerald-800">
                &bull; {bengaliMode ? 'শর্ত: কৃষিকাজই প্রধান জীবিকা হতে হবে' : 'Requirement: Agriculture must be primary livelihood'}
              </div>
            </div>

            {/* Condition 2 Card */}
            <div className="p-5 rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/40 relative">
              <div className="absolute top-4 right-4 bg-emerald-600 text-white text-[11px] font-black w-6 h-6 rounded-full flex items-center justify-center">
                2
              </div>
              <div className="flex items-center gap-2.5 text-emerald-900 mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <h5 className="font-extrabold text-base">
                  {bengaliMode ? '২. বহিরাগত আয়ের সীমাবদ্ধতা' : '2. No Other Income Limitation'}
                </h5>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {bengaliMode ? (
                  <>
                    সংশ্লিষ্ট আয়বর্ষে করদাতার <strong>জমি চাষাবাদ হতে আয় ব্যতীত অন্য কোনো আয় থাকতে পারবে না</strong>; তবে সর্বোচ্চ <strong>২০,০০০ টাকা পর্যন্ত ব্যাংক সুদ/মুনাফা আয়</strong> অনুমোদিত।
                  </>
                ) : (
                  <>
                    The assessee must have <strong>NO other income during the income year</strong> except income from cultivating land, with only one narrow statutory exception: <strong>bank interest/profit not exceeding BDT 20,000</strong>.
                  </>
                )}
              </p>
              <div className="mt-3 pt-2.5 border-t border-emerald-200/80 text-[11px] font-semibold text-emerald-800">
                &bull; {bengaliMode ? 'সীমা: ব্যাংক সুদ সর্বোচ্চ ২০,০০০ টাকা' : 'Permitted Exception: Bank interest ≤ BDT 20,000'}
              </div>
            </div>

          </div>
        </div>

        {/* Disqualification / Who Does Not Qualify Matrix */}
        <div className="bg-rose-50/70 p-5 rounded-2xl border border-rose-200">
          <div className="flex items-center gap-2 text-rose-900 font-extrabold text-sm mb-3">
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{bengaliMode ? 'কারা এই ২ লক্ষ টাকা কর অব্যাহতি পাবেন না? (অযোগ্য তালিকা)' : 'Who is Disqualified from the BDT 2 Lakh Exemption?'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-rose-950">
            <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-rose-100">
              <span className="text-rose-500 font-bold shrink-0">&times;</span>
              <span>
                <strong>{bengaliMode ? 'বেতনভোগী চাকরিজীবী:' : 'Salaried Employees:'}</strong>{' '}
                {bengaliMode ? 'সরকারি বা বেসরকারি প্রতিষ্ঠানে কর্মরত যেকোনো কর্মকর্তা বা কর্মচারী।' : 'Government or private employees receiving any employment salary.'}
              </span>
            </div>
            <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-rose-100">
              <span className="text-rose-500 font-bold shrink-0">&times;</span>
              <span>
                <strong>{bengaliMode ? 'বাড়ি ভাড়া বা বাণিজ্যিক আয়:' : 'Rental Property Owners:'}</strong>{' '}
                {bengaliMode ? 'যাদের বাড়ি, দোকান বা গুদাম ভাড়া বাবদ আয় রয়েছে।' : 'Individuals earning rent from apartments, shops, or commercial property.'}
              </span>
            </div>
            <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-rose-100">
              <span className="text-rose-500 font-bold shrink-0">&times;</span>
              <span>
                <strong>{bengaliMode ? 'ব্যবসা বা ঠিকাদারি আয়:' : 'Business / Trade Owners:'}</strong>{' '}
                {bengaliMode ? 'যাদের ব্যবসা, দোকান, এজেন্টশিপ বা স্বাধীন পেশাগত আয় আছে।' : 'Anyone engaged in retail trading, dealership, contracting, or consultancy.'}
              </span>
            </div>
            <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-rose-100">
              <span className="text-rose-500 font-bold shrink-0">&times;</span>
              <span>
                <strong>{bengaliMode ? 'সঞ্চয়পত্র বা উচ্চ ব্যাংক সুদ:' : 'High Interest / Dividend Earners:'}</strong>{' '}
                {bengaliMode ? 'যাদের ব্যাংক সুদ ২০,০০০ টাকার বেশি অথবা সঞ্চয়পত্র/শেয়ার ডিভিডেন্ড আছে।' : 'Bank interest exceeding BDT 20,000, Sanchayapatra profit, or dividends.'}
              </span>
            </div>
          </div>
        </div>

        {/* Clarification of Common Misconception: BDT 2 Lakh vs. Old 5 Lakh Myth */}
        <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-300 text-amber-950 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{bengaliMode ? 'গুরুত্বপূর্ণ সতর্কতা: ৫ লক্ষ টাকার ভ্রান্ত ধারণা পরিহার করুন' : 'Crucial Correction: Debunking the BDT 5 Lakh Exemption Myth'}</span>
          </div>
          <p className="leading-relaxed text-amber-900/90">
            {bengaliMode ? (
              <>
                বিভিন্ন অনলাইন ফোরাম ও অপ্রচলিত ট্যাক্স গাইডে কৃষি আয়ের অব্যাহতি <strong>৫ লক্ষ টাকা</strong> বলে দাবি করা হয়—যা সম্পূর্ণ ভুল। আয়কর আইন, ২০২৩ এর ষষ্ঠ তফসিল, অংশ ১, দফা ২০ অনুযায়ী এই অব্যাহতি সীমা স্পষ্টভাবে <strong>২,০০,০০০ টাকা (২ লক্ষ)</strong> নির্ধারণ করা হয়েছে।
              </>
            ) : (
              <>
                Some outdated manuals and online forums erroneously cite a <strong>BDT 5,00,000</strong> agricultural exemption. The current statutory text of the Income Tax Act, 2023 (Sixth Schedule, Part 1, Clause 20) legally caps this specific exemption at <strong>BDT 2,00,000</strong>.
              </>
            )}
          </p>
        </div>

        {/* Statutory Disclaimer Box */}
        <div className="p-4 bg-slate-100 rounded-2xl border border-slate-300 text-slate-700 text-xs flex items-start gap-3">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div className="leading-relaxed space-y-1">
            <span className="font-bold text-slate-900 uppercase tracking-wide">
              {bengaliMode ? 'বিধিবদ্ধ সীমাবদ্ধতা সংক্রান্ত আইনি সতর্কতা (Statutory Disclaimer)' : 'Statutory Disclaimer on Other Income Limitations'}
            </span>
            <p>
              {bengaliMode ? (
                <>
                  করদাতার যদি নামমাত্র বেতন, ব্যবসা বা বাড়ি ভাড়া থাকে, তবে দফা ২০-এর ২ লক্ষ টাকা অব্যাহতি <strong>সম্পূর্ণ বাতিল</strong> হয়ে যাবে। সেক্ষেত্রে সম্পূর্ণ নিট কৃষি আয় করদাতার সাধারণ আয়ের সাথে যোগ হবে এবং ২০২৬–২০২৭ করবর্ষের প্রগতিশীল স্ল্যাব (সাধারণ করমুক্ত সীমা ৩,৭৫,০০০ টাকা) অনুযায়ী কর ধার্য হবে।
                </>
              ) : (
                <>
                  If the taxpayer receives any outside taxable income (even a modest corporate salary, trade margin, or apartment rent), eligibility for the Clause 20 exemption is <strong>completely extinguished</strong>. In that event, the entire net agricultural income must be pooled into total income and taxed according to regular 2026–2027 progressive individual slabs (starting above BDT 3,75,000).
                </>
              )}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Clause20ExemptionCard;
