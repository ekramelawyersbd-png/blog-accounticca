import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  ShieldCheck,
  Calculator,
  RotateCcw,
  ArrowUpRight,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface PartnershipFirmSection73CheckerProps {
  className?: string;
  forceLanguage?: 'en' | 'bn';
}

const formatBdt = (amount: number): string => {
  const isNegative = amount < 0;
  const absVal = Math.round(Math.abs(amount));
  const formatted = absVal.toLocaleString('en-IN');
  return `${isNegative ? '-' : ''}BDT ${formatted}`;
};

const formatLakh = (amount: number, isBn: boolean): string => {
  const lakhs = amount / 100000;
  return `${lakhs.toFixed(2)} ${isBn ? 'লাখ' : 'lakh'}`;
};

const PRESET_SCENARIOS = [
  {
    id: 'ex1',
    labelEn: 'Example 1: 12 Cr / 2 Cr',
    labelBn: 'উদাহরণ ১: ১২ কোটি / ২ কোটি',
    turnoverCr: 12,
    capitalCr: 2,
  },
  {
    id: 'ex2',
    labelEn: 'Example 2: 8 Cr / 6 Cr',
    labelBn: 'উদাহরণ ২: ৮ কোটি / ৬ কোটি',
    turnoverCr: 8,
    capitalCr: 6,
  },
  {
    id: 'ex3',
    labelEn: 'Example 3: 7 Cr / 3 Cr',
    labelBn: 'উদাহরণ ৩: ৭ কোটি / ৩ কোটি',
    turnoverCr: 7,
    capitalCr: 3,
  },
  {
    id: 'boundary',
    labelEn: 'Exact Boundary: 10 Cr / 5 Cr',
    labelBn: 'ঠিক সীমা: ১০ কোটি / ৫ কোটি',
    turnoverCr: 10,
    capitalCr: 5,
  },
];

export const PartnershipFirmSection73Checker: React.FC<PartnershipFirmSection73CheckerProps> = ({
  className = '',
  forceLanguage,
}) => {
  const { language } = useLanguage();
  const isBn = (forceLanguage ?? language) === 'bn';
  const [activeTab, setActiveTab] = useState<'threshold' | 'ics'>('threshold');

  // Section 73(1) Audit Threshold inputs (BDT crore)
  const [turnoverCr, setTurnoverCr] = useState<string>('12');
  const [capitalCr, setCapitalCr] = useState<string>('2');
  const [hasLongTermContract, setHasLongTermContract] = useState<boolean>(false);

  // Section 73(2) Income Computation Sheet inputs (BDT)
  const [accountingProfit, setAccountingProfit] = useState<string>('5000000');
  const [disallowedExpenses, setDisallowedExpenses] = useState<string>('500000');
  const [allowableDeductions, setAllowableDeductions] = useState<string>('200000');

  const thresholdResult = useMemo(() => {
    const turnover = Math.max(0, Number.parseFloat(turnoverCr) || 0);
    const capital = Math.max(0, Number.parseFloat(capitalCr) || 0);

    const exceedsTurnover = turnover > 10;
    const exceedsCapital = capital > 5;
    const exactTurnoverBoundary = turnover === 10 && !exceedsCapital && !hasLongTermContract;
    const exactCapitalBoundary = capital === 5 && !exceedsTurnover && !hasLongTermContract;
    const auditMandatory = exceedsTurnover || exceedsCapital || hasLongTermContract;

    let reason = isBn
      ? 'টার্নওভার ও মূলধন কোনোটিই ধারা ৭৩(১)-এর নির্ধারিত সীমা অতিক্রম করেনি। তবে আয় পরিগণনাপত্র (ICS) দাখিল করা বাধ্যতামূলক।'
      : 'Neither threshold exceeds the statutory limit under Section 73(1).';

    if (hasLongTermContract && !exceedsTurnover && !exceedsCapital) {
      reason = isBn
        ? 'ধারা ৭৩(১) অনুযায়ী দীর্ঘমেয়াদি চুক্তি (Long-term Contract) থেকে আয় অর্জন করলে টার্নওভার বা মূলধন নির্বিশেষে নিরীক্ষিত আর্থিক বিবরণী বাধ্যতামূলক।'
        : 'Section 73(1) independently requires audited financial statements for any person deriving income from long-term contracts, regardless of turnover or capital thresholds.';
    } else if (exceedsTurnover && exceedsCapital) {
      reason = isBn
        ? 'বার্ষিক টার্নওভার (১০ কোটি টাকার অধিক) এবং মূলধন (৫ কোটি টাকার অধিক)—উভয় সীমাই অতিক্রম করেছে।'
        : 'Both annual turnover (> BDT 10 crore) and capital (> BDT 5 crore) exceed the Section 73(1) thresholds.';
    } else if (exceedsTurnover) {
      reason = isBn
        ? 'বার্ষিক টার্নওভার ১০ কোটি টাকার বেশি। শর্তগুলো বিকল্প হওয়ায় মূলধন ৫ কোটি টাকা বা তার কম হলেও CA অডিট বাধ্যতামূলক।'
        : 'Annual turnover exceeds BDT 10 crore. Because the conditions are alternative, a CA audit is mandatory even if capital is BDT 5 crore or less.';
    } else if (exceedsCapital) {
      reason = isBn
        ? 'মূলধন ৫ কোটি টাকার বেশি। শর্তগুলো বিকল্প হওয়ায় টার্নওভার ১০ কোটি টাকা বা তার কম হলেও CA অডিট বাধ্যতামূলক।'
        : 'Capital exceeds BDT 5 crore. Because the conditions are alternative, a CA audit is mandatory even if turnover is BDT 10 crore or less.';
    } else if (exactTurnoverBoundary || exactCapitalBoundary) {
      reason = isBn
        ? 'আইনের ভাষায় "১০ কোটি টাকার অধিক" বা "৫ কোটি টাকার অধিক" বলা হয়েছে। তাই ঠিক ১০ কোটি টাকা টার্নওভার বা ঠিক ৫ কোটি টাকা মূলধন হলে শুধু এই শর্তে অডিট বাধ্যতামূলক হয় না, তবে অন্যান্য আইনগত অডিটের শর্ত প্রযোজ্য হতে পারে।'
        : 'The statutory wording is strictly "more than" BDT 10 crore in turnover or "more than" BDT 5 crore in capital. Reaching the exact threshold does not by itself trigger mandatory audit under Section 73(1), though other regulatory audit rules may still apply.';
    }

    return {
      turnover,
      capital,
      exceedsTurnover,
      exceedsCapital,
      auditMandatory,
      reason,
    };
  }, [turnoverCr, capitalCr, hasLongTermContract, isBn]);

  const icsResult = useMemo(() => {
    const profit = Number.parseFloat(accountingProfit) || 0;
    const addDisallowed = Math.max(0, Number.parseFloat(disallowedExpenses) || 0);
    const lessAllowable = Math.max(0, Number.parseFloat(allowableDeductions) || 0);
    const taxableProfit = profit + addDisallowed - lessAllowable;
    const netAdjustment = addDisallowed - lessAllowable;

    return {
      profit,
      addDisallowed,
      lessAllowable,
      taxableProfit,
      netAdjustment,
    };
  }, [accountingProfit, disallowedExpenses, allowableDeductions]);

  const handleResetIcs = () => {
    setAccountingProfit('5000000');
    setDisallowedExpenses('500000');
    setAllowableDeductions('200000');
  };

  return (
    <section
      aria-labelledby="section-73-checker-heading"
      className={`rounded-xl border border-slate-200 bg-white text-slate-900 ${className}`}
    >
      {/* Header Strip */}
      <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">
              {isBn
                ? 'আয়কর আইন, ২০২৩ (ধারা ৭৩) · অর্থ আইন, ২০২৬ (ধারা ৫৯) · করবর্ষ ২০২৬–২০২৭'
                : 'Income Tax Act, 2023 (Section 73) · Finance Act, 2026 (Section 59) · Tax Year 2026–2027'}
            </p>
            <h3
              id="section-73-checker-heading"
              className="mt-1 text-xl font-semibold tracking-tight text-slate-900"
            >
              {isBn
                ? 'অংশীদারি ফার্ম অডিট, DVS ও ICS যাচাইকরণ টুল'
                : 'Partnership Firm Audit, DVS & ICS Compliance Checker'}
            </h3>
          </div>

          <div
            role="tablist"
            aria-label={isBn ? 'কমপ্লায়েন্স টুল মোড' : 'Compliance tool mode'}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-slate-100 p-1 self-start md:self-auto"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'threshold'}
              onClick={() => setActiveTab('threshold')}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
                activeTab === 'threshold'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {isBn ? 'অডিট ও DVS যাচাই' : 'Audit & DVS Checker'}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'ics'}
              onClick={() => setActiveTab('ics')}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
                activeTab === 'ics'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calculator className="h-3.5 w-3.5" aria-hidden="true" />
              {isBn ? 'ICS মুনাফা সমন্বয়' : 'ICS Profit Reconciler'}
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-6 sm:px-8">
        {activeTab === 'threshold' ? (
          <div className="space-y-6">
            {/* Quick Example Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500 mr-1">
                {isBn ? 'আর্টিকেলের উদাহরণ লোড করুন:' : 'Load article example:'}
              </span>
              {PRESET_SCENARIOS.map((preset) => {
                const isActive =
                  Number.parseFloat(turnoverCr) === preset.turnoverCr &&
                  Number.parseFloat(capitalCr) === preset.capitalCr;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setTurnoverCr(String(preset.turnoverCr));
                      setCapitalCr(String(preset.capitalCr));
                    }}
                    className={`whitespace-nowrap rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
                      isActive
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {isBn ? preset.labelBn : preset.labelEn}
                  </button>
                );
              })}
            </div>

            {/* Numeric Inputs */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="pf-turnover-input"
                  className="block text-sm font-medium text-slate-800"
                >
                  {isBn
                    ? 'বার্ষিক টার্নওভার / রাজস্ব (কোটি টাকা)'
                    : 'Annual Turnover / Revenue (BDT Crore)'}
                </label>
                <div className="mt-1.5 flex items-center rounded-lg border border-slate-300 bg-white focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900">
                  <span className="pl-3 text-xs font-medium text-slate-500 select-none">BDT</span>
                  <input
                    id="pf-turnover-input"
                    type="number"
                    min="0"
                    step="0.5"
                    value={turnoverCr}
                    onChange={(e) => setTurnoverCr(e.target.value)}
                    className="w-full bg-transparent px-2.5 py-2.5 font-mono text-sm tabular-nums text-slate-900 focus:outline-none"
                    placeholder="e.g. 12"
                  />
                  <span className="pr-3 text-xs font-medium text-slate-500 select-none">
                    {isBn ? 'কোটি' : 'Crore'}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-slate-500 font-mono tabular-nums">
                  {isBn
                    ? 'আইনি সীমা: ১০.০০ কোটি টাকার অধিক'
                    : 'Statutory trigger: > BDT 10.00 crore'}
                </p>
              </div>

              <div>
                <label
                  htmlFor="pf-capital-input"
                  className="block text-sm font-medium text-slate-800"
                >
                  {isBn ? 'অংশীদারি মূলধন (কোটি টাকা)' : 'Partnership Capital (BDT Crore)'}
                </label>
                <div className="mt-1.5 flex items-center rounded-lg border border-slate-300 bg-white focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900">
                  <span className="pl-3 text-xs font-medium text-slate-500 select-none">BDT</span>
                  <input
                    id="pf-capital-input"
                    type="number"
                    min="0"
                    step="0.5"
                    value={capitalCr}
                    onChange={(e) => setCapitalCr(e.target.value)}
                    className="w-full bg-transparent px-2.5 py-2.5 font-mono text-sm tabular-nums text-slate-900 focus:outline-none"
                    placeholder="e.g. 2"
                  />
                  <span className="pr-3 text-xs font-medium text-slate-500 select-none">
                    {isBn ? 'কোটি' : 'Crore'}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-slate-500 font-mono tabular-nums">
                  {isBn
                    ? 'আইনি সীমা: ৫.০০ কোটি টাকার অধিক'
                    : 'Statutory trigger: > BDT 5.00 crore'}
                </p>
              </div>
            </div>

            {/* Independent Long-Term Contract Trigger */}
            <label className="flex items-start gap-3 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={hasLongTermContract}
                onChange={(e) => setHasLongTermContract(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <span className="text-xs leading-relaxed text-slate-700">
                <strong className="font-semibold text-slate-900">
                  {isBn
                    ? 'ফার্মটির দীর্ঘমেয়াদি চুক্তি (Long-term Contract) থেকে আয় রয়েছে'
                    : 'Firm derives income from long-term contracts'}
                </strong>{' '}
                {isBn
                  ? '— ধারা ৭৩(১)-এর স্বতন্ত্র শর্ত অনুযায়ী টার্নওভার বা মূলধন নির্বিশেষে CA অডিট বাধ্যতামূলক।'
                  : '— Independent trigger under Section 73(1) requiring CA-audited financial statements regardless of turnover or capital.'}
              </span>
            </label>

            {/* Determination Table */}
            <div className="overflow-x-auto border-t border-slate-200 pt-5">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                    <th className="py-2.5 pr-4">
                      {isBn ? 'কমপ্লায়েন্স বাধ্যবাধকতা' : 'Compliance Requirement'}
                    </th>
                    <th className="py-2.5 px-4">{isBn ? 'সিদ্ধান্ত' : 'Determination'}</th>
                    <th className="py-2.5 pl-4">
                      {isBn ? 'অনুমোদিত পেশাজীবী / ভিত্তি' : 'Authorized Professional / Basis'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3.5 pr-4 font-medium text-slate-900">
                      {isBn
                        ? 'CA কর্তৃক নিরীক্ষিত আর্থিক বিবরণী'
                        : 'CA-Audited Financial Statements'}
                      <span className="block text-xs font-normal text-slate-500">
                        {isBn
                          ? 'ধারা ৭৩(১) · টার্নওভার > ১০ কোটি অথবা মূলধন > ৫ কোটি'
                          : 'Section 73(1) · Turnover > 10 Cr OR Capital > 5 Cr'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {thresholdResult.auditMandatory ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-amber-800">
                          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
                          {isBn ? 'অডিট বাধ্যতামূলক' : 'Mandatory Audit'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-800">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                          {isBn ? 'সীমা অতিক্রম করেনি' : 'Not Triggered by Threshold'}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 pl-4 text-slate-600">
                      {thresholdResult.auditMandatory
                        ? isBn
                          ? 'নিবন্ধিত চার্টার্ড অ্যাকাউন্ট্যান্ট (CA)'
                          : 'Registered Chartered Accountant (CA)'
                        : isBn
                        ? 'শুধু ধারা ৭৩(১)-এর সীমা অনুযায়ী বাধ্যতামূলক নয়'
                        : 'Exempt under Sec. 73(1) threshold alone'}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3.5 pr-4 font-medium text-slate-900">
                      {isBn ? 'ICAB DVS / DVC যাচাইকরণ' : 'ICAB DVS / DVC Authentication'}
                      <span className="block text-xs font-normal text-slate-500">
                        {isBn
                          ? 'ICAB সার্কুলার (২৪ নভেম্বর ২০২০, কার্যকর ১ ডিসেম্বর ২০২০)'
                          : 'ICAB Circular (24 Nov 2020, eff. 1 Dec 2020)'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {thresholdResult.auditMandatory ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-amber-800">
                          <FileCheck2 className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
                          {isBn ? 'DVC বাধ্যতামূলক' : 'Mandatory DVC Required'}
                        </span>
                      ) : (
                        <span className="text-slate-600 font-medium">
                          {isBn
                            ? 'শুধু প্রযোজ্য CA অডিট রিপোর্টের ক্ষেত্রে'
                            : 'Required only if CA audit report is issued'}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 pl-4 text-slate-600">
                      {isBn
                        ? 'প্র্যাকটিসিং CA কর্তৃক ICAB DVS পোর্টাল থেকে তৈরি'
                        : 'Generated by practicing CA on ICAB DVS portal'}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3.5 pr-4 font-medium text-slate-900">
                      {isBn ? 'আয় পরিগণনাপত্র (ICS)' : 'Income Computation Sheet (ICS)'}
                      <span className="block text-xs font-normal text-slate-500">
                        {isBn
                          ? 'ধারা ৭৩(২) · সকল আওতাভুক্ত অংশীদারি ফার্ম'
                          : 'Section 73(2) · All partnership firms'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900">
                        <FileCheck2 className="h-4 w-4 shrink-0 text-slate-700" aria-hidden="true" />
                        {isBn ? 'সর্বদা বাধ্যতামূলক' : 'Always Mandatory'}
                      </span>
                    </td>
                    <td className="py-3.5 pl-4 text-slate-600">
                      {isBn
                        ? 'নিবন্ধিত CA, CMA অথবা আয়কর আইনজীবী'
                        : 'CA, Cost & Management Accountant (CMA), or Income Tax Lawyer'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Statutory Explanation & DVC Action */}
            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-relaxed text-slate-600 max-w-2xl">
                {thresholdResult.reason}
              </p>
              <Link
                to="/tools/dvc-verification"
                className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
              >
                {isBn ? 'DVC যাচাইকরণ গাইড দেখুন' : 'Open DVC Verification Guide'}
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-600">
                {isBn
                  ? 'আয়কর আইন, ২০২৩-এর ধারা ৭৩(২) অনুযায়ী হিসাব অনুযায়ী মুনাফা থেকে করযোগ্য ব্যবসায়িক মুনাফা সমন্বয় করুন।'
                  : 'Reconcile accounting profit to taxable business profit under Section 73(2) of the Income Tax Act, 2023.'}
              </p>
              <button
                type="button"
                onClick={handleResetIcs}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                {isBn ? 'উদাহরণে রিসেট করুন' : 'Reset to Article Example'}
              </button>
            </div>

            {/* ICS Inputs */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label
                  htmlFor="ics-accounting-profit"
                  className="block text-xs font-medium text-slate-700"
                >
                  {isBn ? 'হিসাব অনুযায়ী মুনাফা (টাকা)' : 'Accounting Profit (BDT)'}
                </label>
                <input
                  id="ics-accounting-profit"
                  type="number"
                  step="50000"
                  value={accountingProfit}
                  onChange={(e) => setAccountingProfit(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-mono text-sm tabular-nums text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor="ics-disallowed-expenses"
                  className="block text-xs font-medium text-slate-700"
                >
                  {isBn ? 'যোগ: অননুমোদিত ব্যয় (টাকা)' : 'Add: Disallowed Expenses (BDT)'}
                </label>
                <input
                  id="ics-disallowed-expenses"
                  type="number"
                  min="0"
                  step="50000"
                  value={disallowedExpenses}
                  onChange={(e) => setDisallowedExpenses(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-mono text-sm tabular-nums text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor="ics-allowable-deductions"
                  className="block text-xs font-medium text-slate-700"
                >
                  {isBn
                    ? 'বিয়োগ: অতিরিক্ত অনুমোদিত কর কর্তন (টাকা)'
                    : 'Less: Additional Allowable Tax Deductions (BDT)'}
                </label>
                <input
                  id="ics-allowable-deductions"
                  type="number"
                  min="0"
                  step="50000"
                  value={allowableDeductions}
                  onChange={(e) => setAllowableDeductions(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-mono text-sm tabular-nums text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Live Reconciliation Statement */}
            <div className="overflow-x-auto border-t border-slate-200 pt-5">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                    <th className="py-2 text-left">{isBn ? 'বিবরণ' : 'Particulars'}</th>
                    <th className="py-2 text-right">
                      {isBn ? 'টাকার পরিমাণ (BDT)' : 'Amount (BDT)'}
                    </th>
                    <th className="py-2 text-right hidden sm:table-cell">
                      {isBn ? 'লাখ টাকায়' : 'In Lakh'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2.5 text-slate-700">
                      {isBn ? 'হিসাব অনুযায়ী মুনাফা (Accounting Profit)' : 'Accounting profit'}
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums text-slate-900">
                      {formatBdt(icsResult.profit)}
                    </td>
                    <td className="py-2.5 text-right font-mono text-xs tabular-nums text-slate-500 hidden sm:table-cell">
                      {formatLakh(icsResult.profit, isBn)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-700">
                      {isBn ? 'যোগ: অননুমোদিত ব্যয় (Disallowed Expenses)' : 'Add: Disallowed expenses'}
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums text-slate-900">
                      + {formatBdt(icsResult.addDisallowed)}
                    </td>
                    <td className="py-2.5 text-right font-mono text-xs tabular-nums text-slate-500 hidden sm:table-cell">
                      + {formatLakh(icsResult.addDisallowed, isBn)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-700">
                      {isBn
                        ? 'বিয়োগ: অতিরিক্ত অনুমোদিত কর কর্তন'
                        : 'Less: Additional allowable tax deductions'}
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums text-slate-900">
                      - {formatBdt(icsResult.lessAllowable)}
                    </td>
                    <td className="py-2.5 text-right font-mono text-xs tabular-nums text-slate-500 hidden sm:table-cell">
                      - {formatLakh(icsResult.lessAllowable, isBn)}
                    </td>
                  </tr>
                  <tr className="bg-slate-50 font-semibold">
                    <td className="py-3 px-2 text-slate-900">
                      {isBn ? 'করযোগ্য ব্যবসায়িক মুনাফা' : 'Taxable business profit'}
                    </td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-slate-900">
                      {formatBdt(icsResult.taxableProfit)}
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-xs tabular-nums text-slate-700 hidden sm:table-cell">
                      {formatLakh(icsResult.taxableProfit, isBn)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-xs text-slate-500">
              {isBn ? 'নিট কর সমন্বয়: ' : 'Net statutory adjustment: '}
              <span className="font-mono font-medium tabular-nums text-slate-800">
                {icsResult.netAdjustment >= 0 ? '+' : ''}
                {formatBdt(icsResult.netAdjustment)}
              </span>
              {isBn
                ? '। চূড়ান্ত আয় পরিগণনাপত্র (ICS) নিবন্ধিত CA, CMA অথবা আয়কর আইনজীবী কর্তৃক প্রস্তুত ও প্রত্যয়িত হতে হবে।'
                : '. Final Income Computation Sheet must be prepared and certified by a registered CA, CMA, or Income Tax Lawyer.'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
